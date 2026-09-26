"""Sending email (A-05, A-06, K-02).

Two senders behind one Protocol, the `ObjectStore` pattern again: `console` keeps
what it would have sent in memory — the default, what the suite reads links out
of, and what a developer sees in the server log — and `resend` speaks HTTP to a
real provider. Nothing in the suite reaches the network: the HTTP sender is
exercised against an in-process transport, so the request it builds is asserted
rather than assumed.

The property that matters most here is the one that is easiest to lose: a reset
link is a password. It must never reach a production log.
"""
from __future__ import annotations

import json
import logging

import httpx
import pytest

from app.config import Settings, validate_settings
from app.core.errors import EmailNotSent
from app.email.base import EmailMessage, EmailUnavailable
from app.email.console import ConsoleEmailSender
from app.email.delivery import send_or_raise, send_quietly
from app.email.provider import build_email_sender
from app.email.resend import ResendEmailSender

# No module-wide asyncio mark: half of these are plain functions, and
# `asyncio_mode = "auto"` already runs the coroutines.
SECRET_LINK = "fitlog://reset-password?token=very-secret-token"


def _message(**overrides) -> EmailMessage:
    fields = {
        "to": "someone@example.com",
        "subject": "Reset your FitLog password",
        "text": f"Open this link: {SECRET_LINK}",
        "kind": "password_reset",
    }
    return EmailMessage(**{**fields, **overrides})


def _production(**overrides) -> Settings:
    """Settings that would otherwise pass every production check."""
    fields = {
        "environment": "production",
        "jwt_secret": "x" * 48,
        "upload_signing_secret": "y" * 48,
        "email_provider": "resend",
        "email_api_key": "re_not_a_real_key",
        "email_from": "FitLog <no-reply@example.com>",
        # The operator token production also requires (admin guard).
        "admin_token": "a" * 48,
    }
    return Settings(**{**fields, **overrides})


class TestConsoleSender:
    async def test_it_keeps_what_it_sent(self):
        sender = ConsoleEmailSender()
        await sender.send(_message())

        assert len(sender.messages) == 1
        assert sender.messages[0].to == "someone@example.com"
        assert SECRET_LINK in sender.messages[0].text

    async def test_it_echoes_the_link_in_development(self, caplog, monkeypatch):
        # The only way a developer with no mail provider can follow a link.
        # Re-enabled because the suite runs Alembic in-process, and its
        # `fileConfig` disables every logger that already exists.
        monkeypatch.setattr(logging.getLogger("fitlog.email"), "disabled", False)
        with caplog.at_level(logging.INFO, logger="fitlog.email"):
            await ConsoleEmailSender(echo=True).send(_message())
        assert SECRET_LINK in caplog.text

    async def test_it_never_logs_the_body_when_echo_is_off(self, caplog, monkeypatch):
        monkeypatch.setattr(logging.getLogger("fitlog.email"), "disabled", False)
        with caplog.at_level(logging.DEBUG, logger="fitlog.email"):
            await ConsoleEmailSender(echo=False).send(_message())
        assert "very-secret-token" not in caplog.text
        assert "someone@example.com" not in caplog.text

    async def test_its_memory_is_bounded(self):
        # A development server left running must not grow without limit.
        sender = ConsoleEmailSender(keep=3)
        for i in range(5):
            await sender.send(_message(subject=f"n{i}"))
        assert [m.subject for m in sender.messages] == ["n2", "n3", "n4"]


class TestResendSender:
    async def test_it_posts_the_message_to_the_provider(self):
        seen: list[httpx.Request] = []

        def handler(request: httpx.Request) -> httpx.Response:
            seen.append(request)
            return httpx.Response(200, json={"id": "email_123"})

        sender = ResendEmailSender(
            api_key="re_test_key", sender="FitLog <no-reply@example.com>",
            transport=httpx.MockTransport(handler),
        )
        await sender.send(_message())

        assert len(seen) == 1
        request = seen[0]
        assert str(request.url) == "https://api.resend.com/emails"
        assert request.headers["authorization"] == "Bearer re_test_key"
        body = json.loads(request.content)
        assert body["from"] == "FitLog <no-reply@example.com>"
        assert body["to"] == ["someone@example.com"]
        assert body["subject"] == "Reset your FitLog password"
        assert SECRET_LINK in body["text"]

    @pytest.mark.parametrize("status", [301, 307, 400, 401, 422, 429, 500, 503])
    async def test_a_refusal_is_an_error_that_carries_no_secret(self, status):
        sender = ResendEmailSender(
            api_key="re_test_key", sender="FitLog <no-reply@example.com>",
            transport=httpx.MockTransport(lambda _r: httpx.Response(status, json={})),
        )
        with pytest.raises(EmailUnavailable) as caught:
            await sender.send(_message())

        text = str(caught.value)
        assert str(status) in text
        # The exception may be logged by a caller; it must not carry the key,
        # the address or the link.
        assert "re_test_key" not in text
        assert "someone@example.com" not in text
        assert "very-secret-token" not in text

    async def test_an_unreachable_provider_is_an_error_too(self):
        def handler(request: httpx.Request) -> httpx.Response:
            raise httpx.ConnectError("no route to host", request=request)

        sender = ResendEmailSender(
            api_key="re_test_key", sender="FitLog <no-reply@example.com>",
            transport=httpx.MockTransport(handler),
        )
        with pytest.raises(EmailUnavailable):
            await sender.send(_message())

    def test_it_refuses_to_exist_without_a_key(self):
        with pytest.raises(RuntimeError):
            ResendEmailSender(api_key="", sender="FitLog <no-reply@example.com>")


class _Down:
    async def send(self, message: EmailMessage) -> None:
        raise EmailUnavailable("provider returned 503")


class TestDelivery:
    async def test_a_quiet_failure_is_logged_without_the_address_or_the_link(
        self, caplog, monkeypatch
    ):
        # Swallowed for the caller (A-05 must not enumerate), never for the log.
        monkeypatch.setattr(logging.getLogger("fitlog.email"), "disabled", False)
        with caplog.at_level(logging.ERROR, logger="fitlog.email"):
            await send_quietly(_Down(), _message())

        assert "password_reset" in caplog.text
        assert "503" in caplog.text
        assert "someone@example.com" not in caplog.text
        assert "very-secret-token" not in caplog.text

    async def test_a_loud_failure_becomes_a_sentence_for_the_user(self):
        with pytest.raises(EmailNotSent) as caught:
            await send_or_raise(_Down(), _message())
        assert caught.value.status_code == 503
        assert "Try again" in caught.value.message


class TestChoosingASender:
    def test_console_is_the_default(self):
        # `git clone` → `pytest` → run the app sends no mail and needs no key.
        assert Settings().email_provider == "console"
        assert isinstance(build_email_sender(Settings()), ConsoleEmailSender)

    def test_resend_is_chosen_by_setting(self):
        s = Settings(email_provider="resend", email_api_key="re_x",
                     email_from="FitLog <no-reply@example.com>")
        assert isinstance(build_email_sender(s), ResendEmailSender)

    def test_an_unknown_provider_is_refused_rather_than_silently_consoled(self):
        with pytest.raises(RuntimeError, match="EMAIL_PROVIDER"):
            build_email_sender(Settings(email_provider="carrier-pigeon"))

    def test_an_unknown_provider_stops_the_server_starting_not_the_first_sign_up(self):
        # The sender is built lazily, on the first mail. A typo found there is
        # a 500 on sign-up; found at startup it is a deploy that did not go out.
        with pytest.raises(RuntimeError, match="EMAIL_PROVIDER"):
            validate_settings(Settings(email_provider="carrier-pigeon"))

    @pytest.mark.parametrize("environment", ["staging", "production", "test"])
    async def test_only_development_echoes_links_to_the_log(
        self, environment, caplog, monkeypatch
    ):
        # "Not production" is not "safe to log a password-reset link".
        monkeypatch.setattr(logging.getLogger("fitlog.email"), "disabled", False)
        sender = build_email_sender(Settings(environment=environment))
        with caplog.at_level(logging.DEBUG, logger="fitlog.email"):
            await sender.send(_message())
        assert "very-secret-token" not in caplog.text


class TestProductionRefusesToStart:
    def test_a_complete_production_config_passes(self):
        validate_settings(_production())

    def test_the_console_sender_is_refused(self):
        # A production server on the console sender answers "we've sent a link"
        # and sends nothing: nobody could ever reset a password.
        with pytest.raises(RuntimeError, match="EMAIL_PROVIDER"):
            validate_settings(_production(email_provider="console"))

    def test_resend_needs_a_key(self):
        with pytest.raises(RuntimeError, match="EMAIL_API_KEY"):
            validate_settings(_production(email_api_key=""))

    def test_resend_needs_a_from_address(self):
        with pytest.raises(RuntimeError, match="EMAIL_FROM"):
            validate_settings(_production(email_from=""))

    def test_the_provider_is_reached_over_https(self):
        with pytest.raises(RuntimeError, match="EMAIL_BASE_URL"):
            validate_settings(_production(email_base_url="http://api.resend.com/emails"))

    def test_the_resend_cooldown_cannot_be_switched_off(self):
        # It is the only thing between the reset form and someone's inbox.
        with pytest.raises(RuntimeError, match="EMAIL_RESEND_COOLDOWN_SECONDS"):
            validate_settings(_production(email_resend_cooldown_seconds=0))

    def test_a_reset_link_cannot_be_made_long_lived(self):
        with pytest.raises(RuntimeError, match="PASSWORD_RESET_TTL_MINUTES"):
            validate_settings(_production(password_reset_ttl_minutes=24 * 60))

    def test_development_needs_none_of_it(self):
        validate_settings(Settings(environment="development"))
