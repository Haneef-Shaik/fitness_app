"""Choosing a sender. **The only place a concrete provider is named.**

Routes take the sender as a dependency (`deps.Mailer`), so the suite puts its own
outbox in front of it with `app.dependency_overrides` and every route that
sends mail is covered by one fixture.
"""
from __future__ import annotations

from functools import lru_cache

from app.config import Settings, get_settings
from app.email.base import EmailSender
from app.email.console import ConsoleEmailSender


def build_email_sender(settings: Settings) -> EmailSender:
    if settings.email_provider == "console":
        # Development only: "not production" (a staging box, a CI run) is not
        # "safe to write a live reset link into a log".
        return ConsoleEmailSender(echo=settings.environment == "development")

    if settings.email_provider == "resend":
        from app.email.resend import ResendEmailSender

        return ResendEmailSender(
            api_key=settings.email_api_key,
            sender=settings.email_from,
            base_url=settings.email_base_url,
            timeout_seconds=settings.email_timeout_seconds,
        )

    # Refused rather than falling back to the console: a typo in production
    # would otherwise "send" every reset link into a log.
    raise RuntimeError(f"Unknown EMAIL_PROVIDER {settings.email_provider!r}")


@lru_cache
def get_email_sender() -> EmailSender:
    return build_email_sender(get_settings())
