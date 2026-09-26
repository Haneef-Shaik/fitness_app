"""A-06 · Verify email.

**Verification never gates the product.** A-06 is explicit that losing the
ability to log a workout over an unverified address would break the core
promise, so an unverified account is a full account here: every test that
checks a lock-out checks that there is none.

What verification does gate is the *address*: a link proves an inbox for 24
hours, once, and only for the address it was sent to.
"""
from __future__ import annotations

from datetime import UTC, datetime, timedelta

import pytest
from sqlalchemy import select, update

from app.email.base import EmailUnavailable
from app.email.provider import get_email_sender
from app.main import app
from app.models import AccountToken, AccountTokenPurpose, User
from tests.mail import PASSWORD, bearer, first_mail, fresh_email, link_token, register

pytestmark = pytest.mark.asyncio


def _verify_mails(outbox, email: str):
    return [m for m in outbox.to(email) if m.kind == "verify_email"]


async def _verify(client, token: str):
    return await client.post("/v1/auth/email/verify", json={"token": token})


async def _me(client, tokens: dict) -> dict:
    r = await client.get("/v1/auth/me", headers=bearer(tokens))
    assert r.status_code == 200, r.text
    return r.json()["data"]


async def _backdate(db, email: str, *, created: timedelta, expires: timedelta | None = None):
    user_id = (await db.scalar(select(User).where(User.email == email))).id
    now = datetime.now(UTC)
    values: dict = {"created_at": now - created}
    if expires is not None:
        values["expires_at"] = now - expires
    await db.execute(
        update(AccountToken)
        .where(AccountToken.user_id == user_id,
               AccountToken.purpose == AccountTokenPurpose.verify_email)
        .values(**values)
    )
    await db.commit()


class TestOnRegister:
    async def test_signing_up_sends_a_verification_link(self, client, outbox):
        email = fresh_email()
        await register(client, email)

        mails = _verify_mails(outbox, email)
        assert len(mails) == 1
        token = link_token(mails[0], "verify-email")
        assert f"\n{token}\n" in mails[0].text

    async def test_a_new_account_starts_unverified(self, client, outbox):
        tokens = await register(client, fresh_email())

        me = await _me(client, tokens)
        assert me["email_verified"] is False
        assert me["pending_email"] is None

    async def test_a_provider_that_is_down_does_not_stop_anyone_signing_up(self, client):
        class Down:
            async def send(self, message):
                raise EmailUnavailable("provider returned 503")

        app.dependency_overrides[get_email_sender] = lambda: Down()
        try:
            r = await client.post("/v1/auth/register",
                                  json={"email": fresh_email(), "password": PASSWORD})
        finally:
            app.dependency_overrides.pop(get_email_sender, None)

        assert r.status_code == 201


class TestVerify:
    async def test_the_link_verifies_the_address(self, client, outbox):
        email = fresh_email()
        tokens = await register(client, email)

        r = await _verify(client, link_token(_verify_mails(outbox, email)[0], "verify-email"))

        assert r.status_code == 200, r.text
        assert r.json()["data"] == {"email": email, "email_verified": True}
        assert (await _me(client, tokens))["email_verified"] is True

    async def test_it_needs_no_session(self, client, outbox):
        # The link is often opened on a different device, or after signing out.
        email = fresh_email()
        await register(client, email)
        client.headers.pop("authorization", None)

        r = await _verify(client, link_token(_verify_mails(outbox, email)[0], "verify-email"))

        assert r.status_code == 200

    async def test_a_link_works_once(self, client, outbox):
        email = fresh_email()
        await register(client, email)
        token = link_token(_verify_mails(outbox, email)[0], "verify-email")

        assert (await _verify(client, token)).status_code == 200
        again = await _verify(client, token)

        assert again.status_code == 400
        assert again.json()["error"]["code"] == "LINK_EXPIRED"

    async def test_a_link_lives_a_day(self, client, outbox, db):
        email = fresh_email()
        await register(client, email)
        row = await db.scalar(
            select(AccountToken).join(User, User.id == AccountToken.user_id)
            .where(User.email == email, AccountToken.purpose == AccountTokenPurpose.verify_email)
        )
        assert timedelta(hours=23, minutes=59) < row.expires_at - row.created_at <= timedelta(hours=24)

    async def test_a_link_past_its_expiry_is_refused(self, client, outbox, db):
        email = fresh_email()
        await register(client, email)
        token = link_token(_verify_mails(outbox, email)[0], "verify-email")
        await _backdate(db, email, created=timedelta(hours=25), expires=timedelta(hours=1))

        r = await _verify(client, token)

        assert r.status_code == 400
        assert r.json()["error"]["code"] == "LINK_EXPIRED"

    async def test_a_reset_link_cannot_verify_and_a_verify_link_cannot_reset(self, client, outbox):
        email = fresh_email()
        tokens = await register(client, email)
        verify_token = link_token(_verify_mails(outbox, email)[0], "verify-email")
        await client.post("/v1/auth/password/forgot", json={"email": email})
        reset_token = link_token(
            first_mail(outbox, email, "password_reset"), "reset-password"
        )

        crossed_verify = await _verify(client, reset_token)
        crossed_reset = await client.post(
            "/v1/auth/password/reset",
            json={"token": verify_token, "new_password": "a-much-better-passphrase"},
        )

        assert crossed_verify.status_code == crossed_reset.status_code == 400
        assert crossed_verify.json()["error"]["code"] == "LINK_EXPIRED"
        assert crossed_reset.json()["error"]["code"] == "LINK_EXPIRED"
        # Neither did anything: still unverified, and the old password still works.
        assert (await _me(client, tokens))["email_verified"] is False
        login = await client.post("/v1/auth/login", json={"email": email, "password": PASSWORD})
        assert login.status_code == 200


class TestResend:
    async def test_it_needs_a_session(self, client):
        r = await client.post("/v1/auth/email/resend")
        assert r.status_code == 401

    async def test_it_refuses_inside_a_minute_and_says_when(self, client, outbox):
        email = fresh_email()
        tokens = await register(client, email)

        r = await client.post("/v1/auth/email/resend", headers=bearer(tokens))

        assert r.status_code == 429
        assert r.json()["error"]["code"] == "RATE_LIMITED"
        assert "seconds" in r.json()["error"]["message"]
        assert len(_verify_mails(outbox, email)) == 1

    async def test_after_a_minute_it_sends_a_fresh_link_and_kills_the_old(self, client, outbox, db):
        email = fresh_email()
        tokens = await register(client, email)
        first = link_token(_verify_mails(outbox, email)[0], "verify-email")
        await _backdate(db, email, created=timedelta(minutes=2))

        r = await client.post("/v1/auth/email/resend", headers=bearer(tokens))

        assert r.status_code == 200, r.text
        assert r.json()["data"] == {"sent": True, "email_verified": False}
        second = link_token(_verify_mails(outbox, email)[-1], "verify-email")
        assert second != first
        assert (await _verify(client, first)).status_code == 400
        assert (await _verify(client, second)).status_code == 200

    async def test_a_verified_address_is_not_sent_another(self, client, outbox):
        email = fresh_email()
        tokens = await register(client, email)
        await _verify(client, link_token(_verify_mails(outbox, email)[0], "verify-email"))

        r = await client.post("/v1/auth/email/resend", headers=bearer(tokens))

        assert r.status_code == 200
        assert r.json()["data"] == {"sent": False, "email_verified": True}
        assert len(_verify_mails(outbox, email)) == 1

    async def test_a_provider_that_is_down_says_so_and_spends_no_cooldown(self, client, outbox, db):
        # Here there is nothing to enumerate — the caller is signed in — so an
        # honest failure beats a "sent" that was not.
        email = fresh_email()
        tokens = await register(client, email)
        await _backdate(db, email, created=timedelta(minutes=2))

        class Down:
            async def send(self, message):
                raise EmailUnavailable("provider returned 503")

        app.dependency_overrides[get_email_sender] = lambda: Down()
        try:
            failed = await client.post("/v1/auth/email/resend", headers=bearer(tokens))
        finally:
            app.dependency_overrides[get_email_sender] = lambda: outbox

        assert failed.status_code == 503
        assert failed.json()["error"]["code"] == "EMAIL_UNAVAILABLE"
        # The failed attempt did not start a cooldown.
        retry = await client.post("/v1/auth/email/resend", headers=bearer(tokens))
        assert retry.status_code == 200


class TestNoLockOut:
    async def test_an_unverified_account_can_use_the_whole_app(self, client, outbox):
        # A-06: logging must never depend on the inbox.
        email = fresh_email()
        tokens = await register(client, email)
        auth = bearer(tokens)

        assert (await client.get("/v1/dashboard", headers=auth)).status_code == 200
        assert (await client.get("/v1/account/export", headers=auth)).status_code == 200
        created = await client.post("/v1/goals", headers=auth, json={
            "goal_type": "fat_loss", "metric_key": "body_weight", "direction": "down",
            "start_value": 80.0, "target_value": 75.0, "target_unit": "kg",
            "start_date": "2026-09-01",
        })
        assert created.status_code == 201
        login = await client.post("/v1/auth/login", json={"email": email, "password": PASSWORD})
        assert login.status_code == 200

    async def test_an_unverified_account_can_still_reset_its_password(self, client, outbox):
        email = fresh_email()
        await register(client, email)

        await client.post("/v1/auth/password/forgot", json={"email": email})

        assert any(m.kind == "password_reset" for m in outbox.to(email))
