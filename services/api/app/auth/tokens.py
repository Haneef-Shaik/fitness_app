"""Verifying a Supabase access token (docs/14, S2).

The app signs in with Supabase and sends the access token it got as a bearer
token; nothing else identifies a caller. A token is accepted only when:

- its signature verifies — against the project's **JWKS** for asymmetric keys
  (ES256 / RS256, the default for current projects and the local stack), or
  the **legacy HS256 secret** when `SUPABASE_JWT_SECRET` is set (older
  projects). An algorithm we were not configured for is refused, never guessed;
- it was issued by this project (`iss` = `<SUPABASE_URL>/auth/v1`) for a signed-in
  user (`aud` = `authenticated`, not an anonymous sign-in);
- it has not expired, and carries the `sub` and `session_id` the rest of the
  API relies on.

The JWKS is fetched without blocking the event loop, kept ten minutes, and
fetched again at once when a token names a key it does not have — which is how
a key rotation in the dashboard reaches a running API.
"""
from __future__ import annotations

import json
import time
import uuid
from dataclasses import dataclass
from datetime import UTC, datetime

import httpx
import jwt

from app.config import get_settings

AUDIENCE = "authenticated"
JWKS_TTL_SECONDS = 600
#: At most one fetch forced by an unknown key per this many seconds. A token is
#: attacker-controlled, and its `kid` must not be a way to make the API fetch
#: from Supabase on every request.
FORCED_REFRESH_COOLDOWN_SECONDS = 30
#: Clock skew between Supabase and this host.
LEEWAY_SECONDS = 30
ASYMMETRIC = frozenset({"ES256", "RS256"})

#: Replaced in tests with an httpx.MockTransport serving a test JWKS.
_transport: httpx.AsyncBaseTransport | None = None
_jwks: dict[str, jwt.PyJWK] = {}
_jwks_fetched_at = 0.0
_forced_at = -FORCED_REFRESH_COOLDOWN_SECONDS


@dataclass(frozen=True, slots=True)
class Claims:
    user_id: uuid.UUID
    session_id: uuid.UUID
    email: str | None
    #: The most recent authentication in this sign-in (`amr`): when the person
    #: last proved who they are, not when the token was refreshed.
    authenticated_at: datetime | None
    provider: str | None
    #: `user_metadata`: a display name from sign-up, or Google / Apple's name.
    metadata: dict


def issuer() -> str:
    return f"{get_settings().supabase_url.rstrip('/')}/auth/v1"


async def verify(token: str) -> Claims | None:
    """The token's claims, or None for anything that should be a 401."""
    try:
        header = jwt.get_unverified_header(token)
    except jwt.PyJWTError:
        return None
    alg = header.get("alg")
    key = await _key_for(alg, header.get("kid"))
    if key is None:
        return None
    try:
        claims = jwt.decode(
            token, key, algorithms=[alg], audience=AUDIENCE, issuer=issuer(),
            leeway=LEEWAY_SECONDS,
            options={"require": ["exp", "iat", "sub", "aud", "iss", "session_id"]},
        )
    except jwt.PyJWTError:
        return None
    if claims.get("is_anonymous") or claims.get("role") != AUDIENCE:
        return None
    try:
        user_id = uuid.UUID(claims["sub"])
        session_id = uuid.UUID(claims["session_id"])
    except (ValueError, TypeError):
        return None
    return Claims(
        user_id=user_id, session_id=session_id, email=_email(claims.get("email")),
        authenticated_at=_authenticated_at(claims.get("amr")),
        provider=(claims.get("app_metadata") or {}).get("provider"),
        metadata=claims.get("user_metadata") or {},
    )


async def _key_for(alg: str | None, kid: str | None):
    settings = get_settings()
    if alg == "HS256":
        return settings.supabase_jwt_secret or None
    if alg not in ASYMMETRIC or not settings.supabase_url or not kid:
        return None
    key = await _jwk(kid, refresh=False)
    if key is None and _may_force():  # a key we have not seen: rotated since?
        key = await _jwk(kid, refresh=True)
    return key.key if key is not None and key.algorithm_name == alg else None


async def _jwk(kid: str, *, refresh: bool) -> jwt.PyJWK | None:
    global _jwks, _jwks_fetched_at
    stale = not _jwks or time.monotonic() - _jwks_fetched_at > JWKS_TTL_SECONDS
    if not stale and not refresh:
        # Fresh keys and this kid is not among them: that is the caller's
        # problem until a (rate-limited) forced refresh says otherwise.
        return _jwks.get(kid)
    # No lock: two requests fetching at once cost one extra GET, and a lock
    # held across event loops (the suite runs several) is its own failure.
    try:
        async with httpx.AsyncClient(timeout=5.0, transport=_transport) as client:
            response = await client.get(f"{issuer()}/.well-known/jwks.json")
        response.raise_for_status()
        keys = {
            k["kid"]: jwt.PyJWK(k) for k in response.json().get("keys", [])
            if k.get("kid") and k.get("alg") in ASYMMETRIC
        }
    except (httpx.HTTPError, json.JSONDecodeError, jwt.PyJWTError, KeyError):
        # Keep serving the keys we had: Supabase being briefly unreachable
        # must not sign everybody out.
        return _jwks.get(kid)
    _jwks, _jwks_fetched_at = keys, time.monotonic()
    return _jwks.get(kid)


def _may_force() -> bool:
    global _forced_at
    now = time.monotonic()
    if now - _forced_at < FORCED_REFRESH_COOLDOWN_SECONDS:
        return False
    _forced_at = now
    return True


def _email(value) -> str | None:
    return value.strip().lower() if isinstance(value, str) and value.strip() else None


def _authenticated_at(amr) -> datetime | None:
    stamps = [
        entry.get("timestamp") for entry in amr or []
        if isinstance(entry, dict) and isinstance(entry.get("timestamp"), int | float)
    ]
    return datetime.fromtimestamp(max(stamps), UTC) if stamps else None


def reset_cache() -> None:
    global _jwks, _jwks_fetched_at, _forced_at
    _jwks, _jwks_fetched_at, _forced_at = {}, 0.0, -FORCED_REFRESH_COOLDOWN_SECONDS
