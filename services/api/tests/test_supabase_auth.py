"""Signing in is Supabase Auth's; these hold the API's side of it (docs/14).

What the API accepts is the whole of its security: any token it wrongly
accepts is a way in to someone's health data. So the refusals are tested one
by one — expiry, audience, issuer, signature, algorithm, anonymous sign-ins —
along with the two things Supabase cannot do for us: ending a sign-in at once
(S3), and creating the FitLog account on first use (S1).
"""
from __future__ import annotations

import asyncio
import time
import uuid

import httpx
import jwt
import pytest
from cryptography.hazmat.primitives.asymmetric import ec
from sqlalchemy import func, select, text

from app.auth import tokens
from app.config import get_settings
from app.models import User, UserProfile
from tests import auth as fake
from tests.auth import create_session, end_session, mint

pytestmark = pytest.mark.asyncio


async def _auth_user(email: str | None = None) -> tuple[uuid.UUID, uuid.UUID, str]:
    """A Supabase user and a live session, with no FitLog account yet."""
    user_id, email = uuid.uuid4(), email or f"sb-{uuid.uuid4().hex[:10]}@example.com"
    async with fake._db().begin() as conn:
        await conn.execute(text("INSERT INTO auth.users (id, email) VALUES (:u, :e)"),
                           {"u": user_id, "e": email})
    return user_id, await create_session(user_id), email


def _bearer(token: str) -> dict:
    return {"authorization": f"Bearer {token}"}


async def _me(client, token: str) -> httpx.Response:
    return await client.get("/v1/auth/me", headers=_bearer(token))


class TestWhatIsAccepted:
    async def test_a_supabase_token_opens_the_api(self, client):
        user_id, session, email = await _auth_user()

        r = await _me(client, mint(user_id, session, email))

        assert r.status_code == 200, r.text
        assert r.json()["data"] == {"id": str(user_id), "email": email, "status": "active",
                                    "provider": "email"}

    async def test_the_legacy_hs256_secret_works_when_configured(self, client, monkeypatch):
        user_id, session, email = await _auth_user()
        monkeypatch.setattr(get_settings(), "supabase_jwt_secret", "legacy-" + "s" * 40)
        token = jwt.encode({
            "iss": fake.issuer(), "aud": "authenticated", "role": "authenticated",
            "sub": str(user_id), "session_id": str(session), "email": email,
            "iat": int(time.time()), "exp": int(time.time()) + 900,
        }, "legacy-" + "s" * 40, algorithm="HS256")

        assert (await _me(client, token)).status_code == 200


class TestWhatIsRefused:
    async def _refused(self, client, token: str) -> None:
        r = await _me(client, token)
        assert r.status_code == 401, r.text
        assert r.json()["error"]["code"] == "UNAUTHORIZED"

    async def test_an_expired_token(self, client):
        user_id, session, email = await _auth_user()
        await self._refused(client, mint(user_id, session, email, expires_in=-120))

    @pytest.mark.parametrize("aud", ["anon", "service_role", "something-else"])
    async def test_a_token_for_another_audience(self, client, aud):
        user_id, session, email = await _auth_user()
        await self._refused(client, mint(user_id, session, email, aud=aud))

    async def test_a_token_from_another_project(self, client):
        user_id, session, email = await _auth_user()
        await self._refused(client, mint(user_id, session, email, iss="https://other.supabase.co/auth/v1"))

    async def test_a_token_signed_with_a_key_the_project_did_not_publish(self, client):
        user_id, session, email = await _auth_user()
        forged = mint(user_id, session, email, key=ec.generate_private_key(ec.SECP256R1()))
        await self._refused(client, forged)

    async def test_hs256_without_a_legacy_secret_is_never_guessed(self, client):
        # The public JWKS must not become an HMAC key (algorithm confusion).
        user_id, session, _ = await _auth_user()
        token = jwt.encode({"iss": fake.issuer(), "aud": "authenticated", "role": "authenticated",
                            "sub": str(user_id), "session_id": str(session),
                            "iat": int(time.time()), "exp": int(time.time()) + 900},
                           "guess", algorithm="HS256")
        await self._refused(client, token)

    async def test_an_unsigned_token(self, client):
        user_id, session, _ = await _auth_user()
        token = jwt.encode({"iss": fake.issuer(), "aud": "authenticated", "sub": str(user_id),
                            "session_id": str(session), "exp": int(time.time()) + 900},
                           None, algorithm="none")
        await self._refused(client, token)

    async def test_an_anonymous_sign_in(self, client):
        user_id, session, _ = await _auth_user()
        await self._refused(client, mint(user_id, session, None, is_anonymous=True))

    async def test_a_token_without_a_session(self, client):
        user_id, _, email = await _auth_user()
        token = mint(user_id, uuid.uuid4(), email)
        payload = jwt.decode(token, options={"verify_signature": False})
        del payload["session_id"]
        await self._refused(client, jwt.encode(payload, fake._private, algorithm="ES256",
                                               headers={"kid": fake.KID}))

    @pytest.mark.parametrize("header", ["", "Bearer", "Basic abc", "Bearer not-a-jwt"])
    async def test_a_malformed_header(self, client, header):
        r = await client.get("/v1/auth/me", headers={"authorization": header} if header else {})
        assert r.status_code == 401


class TestSignOutIsImmediate:
    async def test_an_ended_sign_in_is_refused_before_its_token_expires(self, client):
        user_id, session, email = await _auth_user()
        token = mint(user_id, session, email)
        assert (await _me(client, token)).status_code == 200

        await end_session(session)  # signed out — here, or from another device

        assert (await _me(client, token)).status_code == 401

    async def test_a_session_that_belongs_to_someone_else_is_refused(self, client):
        mine, _, email = await _auth_user()
        _, theirs, _ = await _auth_user()
        assert (await _me(client, mint(mine, theirs, email))).status_code == 401


class TestTheFirstSignIn:
    async def test_it_creates_the_account_and_an_empty_profile(self, client, db):
        user_id, session, email = await _auth_user()

        await _me(client, mint(user_id, session, email, provider="google",
                               metadata={"full_name": "Asha Rao"}))

        user = await db.scalar(select(User).where(User.id == user_id))
        profile = await db.scalar(select(UserProfile).where(UserProfile.user_id == user_id))
        assert user.email == email
        assert profile is not None and profile.display_name == "Asha Rao"

    async def test_two_first_requests_at_once_make_one_account(self, client, db):
        user_id, session, email = await _auth_user()
        token = mint(user_id, session, email)

        results = await asyncio.gather(*(_me(client, token) for _ in range(5)))

        assert [r.status_code for r in results] == [200] * 5
        assert await db.scalar(select(func.count()).select_from(User).where(User.id == user_id)) == 1

    async def test_the_address_follows_a_change_made_in_supabase(self, client, db):
        user_id, session, email = await _auth_user()
        await _me(client, mint(user_id, session, email))

        moved = f"moved-{uuid.uuid4().hex[:8]}@example.com"
        r = await _me(client, mint(user_id, session, moved))

        assert r.json()["data"]["email"] == moved
        db.expire_all()
        assert (await db.scalar(select(User).where(User.id == user_id))).email == moved

    async def test_an_address_another_account_holds_is_refused_not_merged(self, client):
        first, s1, email = await _auth_user()
        await _me(client, mint(first, s1, email))
        # A second Supabase user presenting the same address (its FitLog row
        # would collide): refused, never attached to the first account.
        second, s2, _ = await _auth_user(f"x-{uuid.uuid4().hex[:6]}@example.com")
        r = await _me(client, mint(second, s2, email))
        assert r.status_code == 409


class TestTheSigningKeys:
    async def test_a_rotated_key_is_fetched_when_a_token_names_it(self, client, monkeypatch):
        user_id, session, email = await _auth_user()
        assert (await _me(client, mint(user_id, session, email))).status_code == 200  # keys cached

        new_key = ec.generate_private_key(ec.SECP256R1())
        new_jwk = jwt.algorithms.ECAlgorithm.to_jwk(new_key.public_key(), as_dict=True)
        rotated = {"keys": [*fake.JWKS["keys"], {**new_jwk, "kid": "rotated", "alg": "ES256"}]}
        monkeypatch.setattr(tokens, "_transport", httpx.MockTransport(
            lambda request: httpx.Response(200, json=rotated)))
        monkeypatch.setattr(tokens, "_forced_at", -1e9)  # no refetch in the last 30 s

        token = mint(user_id, session, email, key=new_key, kid="rotated")
        assert (await _me(client, token)).status_code == 200

    async def test_made_up_key_ids_cannot_make_the_api_fetch_on_every_request(
        self, client, monkeypatch,
    ):
        """`kid` is the caller's to write; each unknown one must not be a fetch."""
        user_id, session, email = await _auth_user()
        assert (await _me(client, mint(user_id, session, email))).status_code == 200
        fetches = []

        def counting(request):
            fetches.append(request.url.path)
            return httpx.Response(200, json=fake.JWKS)
        monkeypatch.setattr(tokens, "_transport", httpx.MockTransport(counting))
        monkeypatch.setattr(tokens, "_forced_at", -1e9)

        for i in range(20):
            forged = mint(user_id, session, email, kid=f"made-up-{i}")
            assert (await _me(client, forged)).status_code == 401

        assert len(fetches) == 1  # the first unknown key, then the cooldown

    async def test_supabase_unreachable_keeps_the_keys_already_known(self, client, monkeypatch):
        user_id, session, email = await _auth_user()
        token = mint(user_id, session, email)
        assert (await _me(client, token)).status_code == 200

        def down(request):
            raise httpx.ConnectError("unreachable")
        monkeypatch.setattr(tokens, "_transport", httpx.MockTransport(down))
        monkeypatch.setattr(tokens, "_jwks_fetched_at", 0.0)  # stale: a refetch is due

        assert (await _me(client, token)).status_code == 200
