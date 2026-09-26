"""K-02 · Account & security — change password, change email, sign out elsewhere.

Each of these is reachable with a stolen *session*, so each asks for something a
stolen session does not carry: the current password, or the new inbox.

* **Change password** keeps this device signed in (a fresh token pair) and signs
  every other one out — the usual reason to change it is that someone else knows it.
* **Change email** applies only once the new address has been proven, so a typo
  cannot lock anybody out of their own account; the old address is told.
* **Sign out other devices** revokes every refresh-token family but the caller's.
"""
from __future__ import annotations

import asyncio
import uuid

import pytest
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.core.security import create_access_token
from app.models import AccountToken, RefreshToken, User
from tests.mail import PASSWORD, bearer, first_mail, fresh_email, link_token, register

pytestmark = pytest.mark.asyncio

NEW_PASSWORD = "a-much-better-passphrase"


async def _login(client, email: str, password: str = PASSWORD):
    return await client.post("/v1/auth/login", json={"email": email, "password": password})


async def _refresh(client, tokens: dict):
    return await client.post("/v1/auth/refresh", json={"refresh_token": tokens["refresh_token"]})


class TestChangePassword:
    async def _change(self, client, tokens, current=PASSWORD, new=NEW_PASSWORD):
        return await client.post(
            "/v1/account/password", headers=bearer(tokens),
            json={"current_password": current, "new_password": new},
        )

    async def test_it_needs_a_session(self, client):
        r = await client.post("/v1/account/password",
                              json={"current_password": PASSWORD, "new_password": NEW_PASSWORD})
        assert r.status_code == 401

    async def test_the_current_password_must_be_right(self, client):
        email = fresh_email()
        tokens = await register(client, email)

        r = await self._change(client, tokens, current="not-my-password")

        # 422 and not 401: a wrong password here is a field to fix, not an
        # expired session — the app must not try to refresh and retry it.
        assert r.status_code == 422
        assert r.json()["error"]["fields"]["current_password"]
        assert (await _login(client, email)).status_code == 200

    async def test_the_register_rules_apply(self, client):
        tokens = await register(client, fresh_email())

        r = await self._change(client, tokens, new="short")

        assert r.status_code == 422
        assert r.json()["error"]["fields"]["new_password"] == "Use at least 10 characters."

    async def test_the_same_password_is_not_a_change(self, client):
        tokens = await register(client, fresh_email())

        r = await self._change(client, tokens, new=PASSWORD)

        assert r.status_code == 422
        assert "new_password" in r.json()["error"]["fields"]

    async def test_it_keeps_this_device_and_signs_out_the_rest(self, client):
        email = fresh_email()
        this_device = await register(client, email)
        other_device = (await _login(client, email)).json()["data"]

        r = await self._change(client, this_device)
        assert r.status_code == 200, r.text
        fresh = r.json()["data"]

        # This device carries on with the pair it was just given...
        assert (await client.get("/v1/auth/me", headers=bearer(fresh))).status_code == 200
        assert (await _refresh(client, fresh)).status_code == 200
        # ...and nothing issued before the change can be refreshed.
        assert (await _refresh(client, other_device)).status_code == 401
        assert (await _refresh(client, this_device)).status_code == 401

    async def test_the_new_password_is_the_one_that_logs_in(self, client):
        email = fresh_email()
        tokens = await register(client, email)

        await self._change(client, tokens)

        assert (await _login(client, email, NEW_PASSWORD)).status_code == 200
        assert (await _login(client, email, PASSWORD)).status_code == 401


class TestChangeEmail:
    async def _change(self, client, tokens, new_email, password=PASSWORD):
        return await client.post(
            "/v1/account/email", headers=bearer(tokens),
            json={"new_email": new_email, "password": password},
        )

    async def test_it_needs_the_password(self, client, outbox):
        tokens = await register(client, fresh_email())
        new = fresh_email("new")

        r = await self._change(client, tokens, new, password="not-my-password")

        assert r.status_code == 422
        assert r.json()["error"]["fields"]["password"]
        assert outbox.to(new) == []

    async def test_an_address_another_account_uses_is_refused(self, client, outbox):
        taken = fresh_email("taken")
        await register(client, taken)
        tokens = await register(client, fresh_email())

        r = await self._change(client, tokens, taken.upper())

        assert r.status_code == 422
        assert "new_email" in r.json()["error"]["fields"]

    async def test_your_own_address_is_not_a_change(self, client, outbox):
        email = fresh_email()
        tokens = await register(client, email)

        r = await self._change(client, tokens, email)

        assert r.status_code == 422
        assert "new_email" in r.json()["error"]["fields"]

    async def test_nothing_changes_until_the_new_address_is_proven(self, client, outbox):
        email, new = fresh_email(), fresh_email("new")
        tokens = await register(client, email)

        r = await self._change(client, tokens, new)

        assert r.status_code == 200, r.text
        assert r.json()["data"] == {"pending_email": new}
        me = (await client.get("/v1/auth/me", headers=bearer(tokens))).json()["data"]
        assert me["email"] == email
        assert me["pending_email"] == new
        # The link goes to the NEW address — that is what it proves.
        assert [m.kind for m in outbox.to(new)] == ["change_email"]
        assert (await _login(client, email)).status_code == 200

    async def test_opening_the_link_moves_the_account(self, client, outbox):
        email, new = fresh_email(), fresh_email("new")
        tokens = await register(client, email)
        await self._change(client, tokens, new)

        r = await client.post("/v1/auth/email/verify",
                              json={"token": link_token(outbox.to(new)[-1], "verify-email")})

        assert r.status_code == 200, r.text
        assert r.json()["data"] == {"email": new, "email_verified": True}
        assert (await _login(client, new)).status_code == 200
        assert (await _login(client, email)).status_code == 401
        me = (await client.get("/v1/auth/me", headers=bearer(tokens))).json()["data"]
        assert me == {**me, "email": new, "email_verified": True, "pending_email": None}

    async def test_the_old_address_is_told(self, client, outbox):
        email, new = fresh_email(), fresh_email("new")
        tokens = await register(client, email)
        await self._change(client, tokens, new)
        await client.post("/v1/auth/email/verify",
                          json={"token": link_token(outbox.to(new)[-1], "verify-email")})

        notices = [m for m in outbox.to(email) if m.kind == "email_changed"]
        assert len(notices) == 1
        assert new in notices[0].text

    async def test_an_address_taken_in_the_meantime_is_refused_at_the_link(self, client, outbox):
        email, new = fresh_email(), fresh_email("new")
        tokens = await register(client, email)
        await self._change(client, tokens, new)
        await register(client, new)  # somebody signs up with it first

        r = await client.post("/v1/auth/email/verify",
                              json={"token": link_token(outbox.to(new)[0], "verify-email")})

        assert r.status_code == 422
        me = (await client.get("/v1/auth/me", headers=bearer(tokens))).json()["data"]
        assert me["email"] == email

    async def test_links_sent_to_the_old_address_die_with_it(self, client, outbox, db):
        # A reset link in the old inbox must not outlive the address — whoever
        # reads that inbox next would own the account.
        email, new = fresh_email(), fresh_email("new")
        tokens = await register(client, email)
        old_verify = link_token(
            first_mail(outbox, email, "verify_email"), "verify-email"
        )
        await client.post("/v1/auth/password/forgot", json={"email": email})
        old_reset = link_token(
            first_mail(outbox, email, "password_reset"), "reset-password"
        )
        await self._change(client, tokens, new)
        await client.post("/v1/auth/email/verify",
                          json={"token": link_token(outbox.to(new)[-1], "verify-email")})

        # The rows are gone, not merely refused: the email check in the
        # handlers would refuse them anyway, and this is what does not rely on it.
        user = await db.scalar(select(User).where(User.email == new))
        left = await db.scalar(
            select(func.count()).select_from(AccountToken)
            .where(AccountToken.user_id == user.id, AccountToken.used_at.is_(None))
        )
        assert left == 0

        reset = await client.post("/v1/auth/password/reset",
                                  json={"token": old_reset, "new_password": NEW_PASSWORD})
        verify = await client.post("/v1/auth/email/verify", json={"token": old_verify})
        assert reset.status_code == verify.status_code == 400

    async def test_the_old_address_is_warned_when_a_change_is_asked_for(self, client, outbox):
        # Before it applies, while the owner can still stop it: a reset from
        # that inbox kills the pending change (below).
        email, new = fresh_email(), fresh_email("new")
        tokens = await register(client, email)

        await self._change(client, tokens, new)

        warnings = [m for m in outbox.to(email) if m.kind == "email_change_requested"]
        assert len(warnings) == 1
        assert new in warnings[0].text
        assert "fitlog://" not in warnings[0].text  # nothing in it to click by mistake

    @pytest.mark.parametrize("remedy", ["reset", "change_password", "sign_out_others"])
    async def test_whatever_the_owner_does_about_it_kills_the_pending_change(
        self, client, outbox, remedy
    ):
        # The takeover this closes: someone with the password asks to move the
        # account to their inbox. The owner is warned and acts — and a change
        # link that outlived their reaction would move the account anyway.
        email, attacker = fresh_email(), fresh_email("attacker")
        tokens = await register(client, email)
        await self._change(client, tokens, attacker)
        change_link = link_token(outbox.to(attacker)[-1], "verify-email")

        if remedy == "reset":
            await client.post("/v1/auth/password/forgot", json={"email": email})
            reset_token = link_token(first_mail(outbox, email, "password_reset"), "reset-password")
            r = await client.post("/v1/auth/password/reset",
                                  json={"token": reset_token, "new_password": NEW_PASSWORD})
        elif remedy == "change_password":
            r = await client.post("/v1/account/password", headers=bearer(tokens), json={
                "current_password": PASSWORD, "new_password": NEW_PASSWORD,
            })
        else:
            r = await client.post("/v1/auth/sessions/revoke-others", headers=bearer(tokens))
        assert r.status_code == 200, r.text

        opened = await client.post("/v1/auth/email/verify", json={"token": change_link})

        assert opened.status_code == 400
        assert opened.json()["error"]["code"] == "LINK_EXPIRED"
        assert (await _login(client, attacker, NEW_PASSWORD)).status_code == 401
        assert (await _login(client, attacker, PASSWORD)).status_code == 401


class TestSignOutOtherDevices:
    async def test_it_needs_a_session(self, client):
        r = await client.post("/v1/auth/sessions/revoke-others")
        assert r.status_code == 401

    async def test_it_signs_out_every_other_device_and_keeps_this_one(self, client):
        email = fresh_email()
        phone = await register(client, email)
        tablet = (await _login(client, email)).json()["data"]
        laptop = (await _login(client, email)).json()["data"]

        r = await client.post("/v1/auth/sessions/revoke-others", headers=bearer(phone))

        assert r.status_code == 200, r.text
        assert r.json()["data"] == {"revoked": 2}
        assert (await _refresh(client, tablet)).status_code == 401
        assert (await _refresh(client, laptop)).status_code == 401
        assert (await _refresh(client, phone)).status_code == 200

    async def test_this_device_survives_its_own_refreshes(self, client):
        # A refresh rotates the token but keeps the family, so an access token
        # minted by a refresh still names the device it belongs to.
        email = fresh_email()
        await register(client, email)
        phone = (await _login(client, email)).json()["data"]
        rotated = (await _refresh(client, phone)).json()["data"]

        r = await client.post("/v1/auth/sessions/revoke-others", headers=bearer(rotated))

        assert r.json()["data"] == {"revoked": 1}
        assert (await _refresh(client, rotated)).status_code == 200

    async def test_a_token_that_names_no_device_is_sent_to_refresh(self, client):
        # Access tokens minted before `sid` existed cannot say which device to
        # keep. A 401 makes the app refresh — and the refreshed token can.
        registered = await register(client, fresh_email())
        legacy = create_access_token(uuid.UUID(registered["user"]["id"]))

        r = await client.post("/v1/auth/sessions/revoke-others",
                              headers={"authorization": f"Bearer {legacy}"})

        assert r.status_code == 401
        assert (await _refresh(client, registered)).status_code == 200

    async def test_a_device_already_signed_out_cannot_sign_out_the_rest(self, client):
        # Its access token outlives the sign-out by up to the access TTL. It
        # must not spend that time ending the real owner's sessions.
        email = fresh_email()
        phone = await register(client, email)
        stolen = (await _login(client, email)).json()["data"]
        await client.post("/v1/auth/logout", json={"refresh_token": stolen["refresh_token"]})

        r = await client.post("/v1/auth/sessions/revoke-others", headers=bearer(stolen))

        assert r.status_code == 401
        assert (await _refresh(client, phone)).status_code == 200

    async def test_a_refresh_caught_behind_a_revoke_does_not_outlive_it(self, client, engine):
        # The race: a refresh reads its token, a revoke commits, the refresh
        # rotates anyway — and the new token was never seen by the revoke.
        # Both now lock the account row first; this holds a revoke open in a
        # second session and lets a refresh arrive in the middle of it.
        registered = await register(client, fresh_email())
        user_id = uuid.UUID(registered["user"]["id"])

        maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
        async with maker() as revoker:
            await revoker.execute(select(User.id).where(User.id == user_id).with_for_update())
            await revoker.execute(
                update(RefreshToken).where(RefreshToken.user_id == user_id)
                .values(revoked_at=func.now())
            )
            refresh = asyncio.create_task(_refresh(client, registered))
            await asyncio.sleep(0.3)
            assert not refresh.done(), "the refresh did not wait for the revoke"
            await revoker.commit()

        r = await refresh
        assert r.status_code == 401

    async def test_another_accounts_sessions_are_untouched(self, client):
        mine = await register(client, fresh_email())
        other_email = fresh_email("other")
        theirs = await register(client, other_email)

        await client.post("/v1/auth/sessions/revoke-others", headers=bearer(mine))

        assert (await _refresh(client, theirs)).status_code == 200


async def test_signing_out_other_devices_ends_their_access_tokens_at_once(client):
    """Not fifteen minutes later, when the access token would have expired."""
    import uuid as _uuid

    email = f"two-phones-{_uuid.uuid4().hex[:8]}@example.com"
    reg = await client.post("/v1/auth/register", json={"email": email, "password": "correct-horse-battery"})
    phone_a = reg.json()["data"]["access_token"]
    login = await client.post("/v1/auth/login", json={"email": email, "password": "correct-horse-battery"})
    phone_b = login.json()["data"]["access_token"]

    r = await client.post("/v1/auth/sessions/revoke-others", headers={"authorization": f"Bearer {phone_a}"})
    assert r.status_code == 200, r.text

    assert (await client.get("/v1/auth/me", headers={"authorization": f"Bearer {phone_b}"})).status_code == 401
    assert (await client.get("/v1/auth/me", headers={"authorization": f"Bearer {phone_a}"})).status_code == 200
