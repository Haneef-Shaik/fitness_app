"""Supabase Auth, as the API sees it, for the suite (docs/14-SUPABASE.md).

The app signs up and in with Supabase and calls the API with the access token
it got. Here, `sign_up` / `sign_in` do Supabase's half: a row in `auth.users`
and one in `auth.sessions`, and an ES256 token signed by a test key that the
API finds in a test JWKS — the same verification path production takes, with
the network replaced by an httpx.MockTransport. Then `sign_up` calls
`/v1/auth/me`, as the app does after signing in, which creates the FitLog
account.

On plain Postgres `ensure_auth_schema` creates a minimal `auth` schema of the
shape the API reads; on Supabase's Postgres the real one is already there.
"""
from __future__ import annotations

import json
import time
import uuid
from dataclasses import dataclass, field
from typing import Any

import httpx
import jwt
from cryptography.hazmat.primitives.asymmetric import ec
from sqlalchemy import text

SUPABASE_URL = "http://supabase.test"
KID = "fitlog-test-key"
PASSWORD = "correct-horse-battery"

_private = ec.generate_private_key(ec.SECP256R1())
_jwk = json.loads(jwt.algorithms.ECAlgorithm.to_jwk(_private.public_key()))
JWKS = {"keys": [{**_jwk, "kid": KID, "alg": "ES256", "use": "sig"}]}


def issuer() -> str:
    return f"{SUPABASE_URL}/auth/v1"


def jwks_transport() -> httpx.MockTransport:
    def handler(request: httpx.Request) -> httpx.Response:
        if request.url.path == "/auth/v1/.well-known/jwks.json":
            return httpx.Response(200, json=JWKS)
        return httpx.Response(404)
    return httpx.MockTransport(handler)


def mint(
    user_id: uuid.UUID, session_id: uuid.UUID, email: str | None, *,
    authenticated_at: float | None = None, expires_in: int = 900,
    provider: str = "email", metadata: dict | None = None, key: Any = None,
    kid: str = KID, **claims: Any,
) -> str:
    """An access token shaped exactly like Supabase's (checked against the local
    stack: ES256, `kid`, `session_id`, `amr`, `role`)."""
    now = int(time.time())
    signed_in = int(authenticated_at if authenticated_at is not None else now)
    payload = {
        "iss": issuer(), "aud": "authenticated", "role": "authenticated",
        "sub": str(user_id), "session_id": str(session_id), "email": email or "",
        "iat": now, "exp": now + expires_in, "aal": "aal1", "is_anonymous": False,
        "amr": [{"method": "password" if provider == "email" else "oauth", "timestamp": signed_in}],
        "app_metadata": {"provider": provider, "providers": [provider]},
        "user_metadata": metadata or {},
        **claims,
    }
    return jwt.encode(payload, key or _private, algorithm="ES256", headers={"kid": kid})


AUTH_SCHEMA = (
    "CREATE SCHEMA IF NOT EXISTS auth",
    "CREATE TABLE IF NOT EXISTS auth.users (id uuid PRIMARY KEY, email text)",
    (
        "CREATE TABLE IF NOT EXISTS auth.sessions (id uuid PRIMARY KEY, "
        "user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, not_after timestamptz)"
    ),
)


async def ensure_auth_schema(conn) -> None:
    # Checked first: on Supabase the real schema exists and `postgres` may not
    # create in it — even `CREATE TABLE IF NOT EXISTS` is refused there.
    if await conn.scalar(text("SELECT to_regclass('auth.sessions') IS NULL")):
        for statement in AUTH_SCHEMA:
            await conn.execute(text(statement))
    # The `auth` schema outlives the suite's rebuild of `public`, so the last
    # run's test accounts are still there. Only the suite's own (every test
    # address is @example.com); a developer's accounts on the local Supabase
    # stay.
    await conn.execute(text("DELETE FROM auth.users WHERE email LIKE '%@example.com'"))


# ---------------------------------------------------------------- accounts


@dataclass
class _Response:
    """What `client.post("/v1/auth/register")` used to return, so the suite's
    many sign-ups read the same: `.status_code`, `.json()`, `.text`."""

    status_code: int
    body: dict = field(default_factory=dict)

    def json(self) -> dict:
        return self.body

    @property
    def text(self) -> str:
        return json.dumps(self.body)


_passwords: dict[str, str] = {}
_engine = None


def _db():
    global _engine
    if _engine is None:
        from app.config import get_settings
        from tests.conftest import make_engine
        _engine = make_engine(get_settings().test_database_url)
    return _engine


async def create_session(user_id: uuid.UUID) -> uuid.UUID:
    session_id = uuid.uuid4()
    async with _db().begin() as conn:
        await conn.execute(text("INSERT INTO auth.sessions (id, user_id) VALUES (:s, :u)"),
                           {"s": session_id, "u": user_id})
    return session_id


async def end_session(session_id: uuid.UUID) -> None:
    """Signing out, as Supabase does it: the session row goes."""
    async with _db().begin() as conn:
        await conn.execute(text("DELETE FROM auth.sessions WHERE id = :s"), {"s": session_id})


def _tokens(user_id, session_id, email, metadata=None) -> dict:
    return {
        "user": {"id": str(user_id), "email": email},
        "access_token": mint(user_id, session_id, email, metadata=metadata),
        "refresh_token": f"refresh-{session_id}", "token_type": "bearer",
        "session_id": str(session_id),
    }


async def sign_up(client: httpx.AsyncClient, *, json: dict) -> _Response:
    """Supabase's sign-up, then the app's first call. 201 with tokens, as the
    API's own `/v1/auth/register` answered before it moved to Supabase."""
    email = str(json.get("email", "")).strip().lower()
    async with _db().begin() as conn:
        taken = await conn.scalar(text("SELECT 1 FROM auth.users WHERE email = :e"), {"e": email})
        if taken:
            return _Response(422, {"error": {"code": "user_already_exists"}})
        user_id = uuid.uuid4()
        await conn.execute(text("INSERT INTO auth.users (id, email) VALUES (:u, :e)"),
                           {"u": user_id, "e": email})
    _passwords[email] = str(json.get("password", PASSWORD))
    session_id = await create_session(user_id)
    metadata = {"display_name": json["display_name"]} if json.get("display_name") else None
    body = _tokens(user_id, session_id, email, metadata)
    me = await client.get("/v1/auth/me", headers={"authorization": f"Bearer {body['access_token']}"})
    assert me.status_code == 200, me.text
    return _Response(201, {"data": body})


async def sign_in(client: httpx.AsyncClient, *, json: dict) -> _Response:
    """Supabase's password sign-in: a new session for an existing user."""
    email = str(json.get("email", "")).strip().lower()
    async with _db().begin() as conn:
        user_id = await conn.scalar(text("SELECT id FROM auth.users WHERE email = :e"), {"e": email})
    if user_id is None or _passwords.get(email) != json.get("password"):
        return _Response(400, {"error": {"code": "invalid_credentials"}})
    session_id = await create_session(user_id)
    return _Response(200, {"data": _tokens(user_id, session_id, email)})


# ------------------------------------------------------ the Auth admin API


class FakeAuthAdmin:
    """Supabase Auth's server-side endpoints the API calls (app/auth/admin.py),
    behaving as the local stack does: deleting a user takes its sessions with
    it; a code is emailed only to an existing account (422 otherwise); a wrong
    or reused code is refused."""

    def __init__(self) -> None:
        self.reset()

    def reset(self) -> None:
        self.codes: dict[str, str] = {}
        self.deleted: list[uuid.UUID] = []
        self.down = False

    def transport(self) -> httpx.MockTransport:
        return httpx.MockTransport(self._handle)

    async def _handle(self, request: httpx.Request) -> httpx.Response:
        if self.down:
            return httpx.Response(503)
        assert request.headers.get("apikey"), "the secret key was not sent"
        path = request.url.path.removeprefix("/auth/v1")
        body = json.loads(request.content) if request.content else {}
        if request.method == "DELETE" and path.startswith("/admin/users/"):
            user_id = uuid.UUID(path.rsplit("/", 1)[1])
            async with _db().begin() as conn:
                gone = await conn.execute(text("DELETE FROM auth.users WHERE id = :u"), {"u": user_id})
            self.deleted.append(user_id)
            return httpx.Response(200 if gone.rowcount else 404, json={})
        if request.method == "POST" and path == "/otp":
            email = body["email"]
            async with _db().begin() as conn:
                exists = await conn.scalar(text("SELECT 1 FROM auth.users WHERE email = :e"), {"e": email})
            if not exists:
                return httpx.Response(422, json={"error_code": "otp_disabled"})
            self.codes[email] = f"{uuid.uuid4().int % 1_000_000:06d}"
            return httpx.Response(200, json={})
        if request.method == "POST" and path == "/verify":
            email, token = body["email"], body["token"]
            if self.codes.get(email) != token:
                return httpx.Response(403, json={"error_code": "otp_expired"})
            del self.codes[email]  # single use
            async with _db().begin() as conn:
                user_id = await conn.scalar(text("SELECT id FROM auth.users WHERE email = :e"), {"e": email})
            return httpx.Response(200, json={"user": {"id": str(user_id), "email": email}})
        return httpx.Response(404)


AUTH_ADMIN = FakeAuthAdmin()
