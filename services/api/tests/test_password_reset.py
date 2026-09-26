"""A-05 · Forgot / reset password.

A reset flow that works is easy. The rules that make it safe are the ones this
file pins, each of which a working flow can quietly break:

* **No enumeration** (01 A-05, 02 §8). The request answers identically whether
  or not the address has an account — same status, same body — and an email
  provider that is down does not change the answer either.
* **The token is a password for thirty minutes.** Single use, stored only as a
  hash, dead once a newer one is requested.
* **A completed reset ends every session.** People reset because someone else
  may have the password; a refresh token that outlives the reset keeps them in.
"""
from __future__ import annotations

import asyncio
import hashlib
from datetime import UTC, datetime, timedelta

import pytest
from sqlalchemy import select, update

from app.email.base import EmailUnavailable
from app.email.provider import get_email_sender
from app.main import app
from app.models import AccountToken, AccountTokenPurpose, User, UserStatus
from tests.mail import PASSWORD, fresh_email, link_token, register

pytestmark = pytest.mark.asyncio

NEW_PASSWORD = "a-much-better-passphrase"


async def _forgot(client, email: str):
    return await client.post("/v1/auth/password/forgot", json={"email": email})


async def _reset(client, token: str, new_password: str = NEW_PASSWORD):
    return await client.post(
        "/v1/auth/password/reset", json={"token": token, "new_password": new_password}
    )


async def _requested_token(client, outbox, email: str) -> str:
    r = await _forgot(client, email)
    assert r.status_code == 200, r.text
    return link_token(outbox.to(email)[-1], "reset-password")


async def _backdate(db, email: str, *, created: timedelta, expires: timedelta | None = None):
    """Moves the user's reset token into the past, rather than sleeping."""
    user_id = (await db.scalar(select(User).where(User.email == email))).id
    now = datetime.now(UTC)
    values: dict = {"created_at": now - created}
    if expires is not None:
        values["expires_at"] = now - expires
    await db.execute(
        update(AccountToken)
        .where(AccountToken.user_id == user_id,
               AccountToken.purpose == AccountTokenPurpose.password_reset)
        .values(**values)
    )
    await db.commit()


class TestRequest:
    async def test_it_answers_the_same_whether_or_not_the_account_exists(self, client, outbox):
        email = fresh_email()
        await register(client, email)

        known = await _forgot(client, email)
        unknown = await _forgot(client, fresh_email("nobody"))

        assert known.status_code == unknown.status_code == 200
        assert known.json()["data"] == unknown.json()["data"]

    async def test_only_the_real_account_gets_mail(self, client, outbox):
        email, stranger = fresh_email(), fresh_email("nobody")
        await register(client, email)

        await _forgot(client, email)
        await _forgot(client, stranger)

        assert len([m for m in outbox.to(email) if m.kind == "password_reset"]) == 1
        assert outbox.to(stranger) == []

    async def test_the_address_is_matched_case_insensitively(self, client, outbox):
        email = fresh_email()
        await register(client, email)

        await _forgot(client, email.upper())

        assert any(m.kind == "password_reset" for m in outbox.to(email))

    async def test_the_mail_carries_a_link_into_the_app_and_a_code_to_paste(self, client, outbox):
        email = fresh_email()
        await register(client, email)

        token = await _requested_token(client, outbox, email)

        text = outbox.to(email)[-1].text
        assert f"fitlog://reset-password?token={token}" in text
        # The same token on a line of its own, for a phone that will not open
        # the link — the reset screen takes it pasted (A-05).
        assert f"\n{token}\n" in text
        assert "30 minutes" in text

    async def test_only_a_hash_of_the_token_is_stored(self, client, outbox, db):
        email = fresh_email()
        await register(client, email)
        token = await _requested_token(client, outbox, email)

        row = await db.scalar(
            select(AccountToken)
            .join(User, User.id == AccountToken.user_id)
            .where(User.email == email,
                   AccountToken.purpose == AccountTokenPurpose.password_reset)
        )
        assert row.token_hash == hashlib.sha256(token.encode()).hexdigest()
        assert token not in row.token_hash

    async def test_the_link_lives_thirty_minutes(self, client, outbox, db):
        email = fresh_email()
        await register(client, email)
        await _requested_token(client, outbox, email)

        row = await db.scalar(
            select(AccountToken)
            .join(User, User.id == AccountToken.user_id)
            .where(User.email == email,
                   AccountToken.purpose == AccountTokenPurpose.password_reset)
        )
        lifetime = row.expires_at - row.created_at
        assert timedelta(minutes=29) < lifetime <= timedelta(minutes=30, seconds=5)

    async def test_asking_twice_within_a_minute_sends_one_mail(self, client, outbox):
        # Someone else can type your address into the form. They should not be
        # able to fill your inbox with it — and the answer must not change,
        # because a different answer is an enumeration oracle.
        email = fresh_email()
        await register(client, email)

        first = await _forgot(client, email)
        second = await _forgot(client, email)

        assert first.json()["data"] == second.json()["data"]
        assert len([m for m in outbox.to(email) if m.kind == "password_reset"]) == 1

    async def test_a_disabled_account_gets_nothing(self, client, outbox, db):
        email = fresh_email()
        await register(client, email)
        await db.execute(update(User).where(User.email == email)
                         .values(status=UserStatus.disabled))
        await db.commit()

        r = await _forgot(client, email)

        assert r.status_code == 200
        assert not any(m.kind == "password_reset" for m in outbox.to(email))

    async def test_a_provider_that_is_down_changes_nothing_the_caller_sees(self, client):
        # A 5xx only for real accounts would say which addresses have one.
        class Down:
            async def send(self, message):
                raise EmailUnavailable("provider returned 503")

        email = fresh_email()
        await register(client, email)
        app.dependency_overrides[get_email_sender] = lambda: Down()
        try:
            known = await _forgot(client, email)
            unknown = await _forgot(client, fresh_email("nobody"))
        finally:
            app.dependency_overrides.pop(get_email_sender, None)

        assert known.status_code == unknown.status_code == 200
        assert known.json()["data"] == unknown.json()["data"]


class TestReset:
    async def test_it_sets_the_new_password_and_retires_the_old(self, client, outbox):
        email = fresh_email()
        await register(client, email)
        token = await _requested_token(client, outbox, email)

        r = await _reset(client, token)
        assert r.status_code == 200, r.text

        new = await client.post("/v1/auth/login", json={"email": email, "password": NEW_PASSWORD})
        old = await client.post("/v1/auth/login", json={"email": email, "password": PASSWORD})
        assert new.status_code == 200
        assert old.status_code == 401

    async def test_it_signs_out_every_session(self, client, outbox):
        email = fresh_email()
        registered = await register(client, email)
        other_device = (await client.post(
            "/v1/auth/login", json={"email": email, "password": PASSWORD}
        )).json()["data"]
        token = await _requested_token(client, outbox, email)

        assert (await _reset(client, token)).status_code == 200

        for session in (registered, other_device):
            r = await client.post(
                "/v1/auth/refresh", json={"refresh_token": session["refresh_token"]}
            )
            assert r.status_code == 401

    async def test_a_link_works_once(self, client, outbox):
        email = fresh_email()
        await register(client, email)
        token = await _requested_token(client, outbox, email)

        assert (await _reset(client, token)).status_code == 200
        again = await _reset(client, token, "yet-another-passphrase")

        assert again.status_code == 400
        assert again.json()["error"]["code"] == "LINK_EXPIRED"

    async def test_an_expired_link_is_refused(self, client, outbox, db):
        email = fresh_email()
        await register(client, email)
        token = await _requested_token(client, outbox, email)
        await _backdate(db, email, created=timedelta(minutes=31), expires=timedelta(minutes=1))

        r = await _reset(client, token)

        assert r.status_code == 400
        assert r.json()["error"]["code"] == "LINK_EXPIRED"
        # And the password did not change.
        login = await client.post("/v1/auth/login", json={"email": email, "password": PASSWORD})
        assert login.status_code == 200

    async def test_unknown_used_and_expired_all_say_the_same_thing(self, client, outbox, db):
        # Different words would tell a guesser which tokens once existed.
        used_by, expired_for = fresh_email(), fresh_email()
        await register(client, used_by)
        await register(client, expired_for)
        spent = await _requested_token(client, outbox, used_by)
        await _reset(client, spent)
        stale = await _requested_token(client, outbox, expired_for)
        await _backdate(db, expired_for, created=timedelta(hours=1), expires=timedelta(minutes=1))

        answers = [
            await _reset(client, spent),
            await _reset(client, stale),
            await _reset(client, "not-a-token-anybody-was-sent"),
        ]

        assert {r.status_code for r in answers} == {400}
        assert len({r.json()["error"]["message"] for r in answers}) == 1
        assert "expired" in answers[0].json()["error"]["message"]

    async def test_two_taps_on_one_link_at_once_succeed_once(self, client, outbox):
        # Sequential re-use is the easy case. The row lock is what makes two
        # requests in flight together — a double tap, a retried request — safe.
        email = fresh_email()
        await register(client, email)
        token = await _requested_token(client, outbox, email)

        results = await asyncio.gather(
            _reset(client, token, "first-new-passphrase"),
            _reset(client, token, "second-new-passphrase"),
        )

        assert sorted(r.status_code for r in results) == [200, 400]
        winner = "first-new-passphrase" if results[0].status_code == 200 else "second-new-passphrase"
        login = await client.post("/v1/auth/login", json={"email": email, "password": winner})
        assert login.status_code == 200

    async def test_a_link_sent_before_the_account_was_disabled_stops_working(
        self, client, outbox, db
    ):
        email = fresh_email()
        await register(client, email)
        token = await _requested_token(client, outbox, email)
        await db.execute(update(User).where(User.email == email)
                         .values(status=UserStatus.disabled))
        await db.commit()

        r = await _reset(client, token)

        assert r.status_code == 400
        assert r.json()["error"]["code"] == "LINK_EXPIRED"

    async def test_a_newer_request_kills_the_older_link(self, client, outbox, db):
        email = fresh_email()
        await register(client, email)
        first = await _requested_token(client, outbox, email)
        await _backdate(db, email, created=timedelta(minutes=2))
        second = await _requested_token(client, outbox, email)
        assert first != second

        stale = await _reset(client, first)
        fresh = await _reset(client, second)

        assert stale.status_code == 400
        assert fresh.status_code == 200

    async def test_the_register_rules_apply_and_the_link_survives_a_refusal(self, client, outbox):
        email = fresh_email()
        await register(client, email)
        token = await _requested_token(client, outbox, email)

        weak = await _reset(client, token, "short")
        common = await _reset(client, token, "letmein123")

        assert weak.status_code == common.status_code == 422
        assert weak.json()["error"]["fields"]["new_password"] == "Use at least 10 characters."
        assert "too common" in common.json()["error"]["fields"]["new_password"]
        # A refused password did not spend the link.
        assert (await _reset(client, token)).status_code == 200

    async def test_it_confirms_the_address_it_was_sent_to(self, client, outbox):
        # Opening the link proves the inbox, which is all verification proves.
        email = fresh_email()
        await register(client, email)
        token = await _requested_token(client, outbox, email)
        await _reset(client, token)

        tokens = (await client.post(
            "/v1/auth/login", json={"email": email, "password": NEW_PASSWORD}
        )).json()["data"]
        me = await client.get(
            "/v1/auth/me", headers={"authorization": f"Bearer {tokens['access_token']}"}
        )
        assert me.json()["data"]["email_verified"] is True
