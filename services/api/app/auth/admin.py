"""Server-only calls to Supabase's Auth API, with the project's secret key.

Two jobs, both part of deleting an account (docs/14, S5–S6):

- **deleting the sign-in** once FitLog's data is gone, so the address can
  sign up again and no session survives;
- **the web deletion page's one-time code**: Supabase emails a code to the
  address, and a correct code proves the person holds it — which works for
  password, Google and Apple accounts alike.

The secret key never leaves the server. `_transport` is swapped for an
httpx.MockTransport in tests.
"""
from __future__ import annotations

import logging
import uuid

import httpx

from app.config import get_settings
from app.core.errors import ServiceUnavailable

log = logging.getLogger("fitlog.auth")

_transport: httpx.AsyncBaseTransport | None = None
TIMEOUT_SECONDS = 10.0


def _client() -> httpx.AsyncClient:
    settings = get_settings()
    if not (settings.supabase_url and settings.supabase_secret_key):
        raise ServiceUnavailable("Account changes are unavailable right now.")
    return httpx.AsyncClient(
        base_url=f"{settings.supabase_url.rstrip('/')}/auth/v1",
        headers={"apikey": settings.supabase_secret_key},
        timeout=TIMEOUT_SECONDS, transport=_transport,
    )


async def delete_sign_in(user_id: uuid.UUID) -> None:
    """Removes the Supabase user and every session it had. Gone already is fine."""
    async with _client() as client:
        try:
            response = await client.delete(f"/admin/users/{user_id}")
        except httpx.HTTPError as exc:
            log.error("deleting a sign-in failed: %s", type(exc).__name__)
            raise ServiceUnavailable("Your data is deleted; finishing the sign-out failed. Try again.") from exc
    if response.status_code not in (200, 204, 404):
        log.error("deleting a sign-in refused: HTTP %s", response.status_code)
        raise ServiceUnavailable("Your data is deleted; finishing the sign-out failed. Try again.")


async def send_code(email: str) -> None:
    """Emails a one-time code to an existing account's address. Never creates
    one, and never says whether the address has an account."""
    async with _client() as client:
        try:
            response = await client.post("/otp", json={"email": email, "create_user": False})
        except httpx.HTTPError as exc:
            log.warning("sending a code failed: %s", type(exc).__name__)
            return
    if response.status_code >= 300 and response.status_code != 422:
        # 422: no such user — deliberately indistinguishable to the caller.
        log.warning("sending a code refused: HTTP %s", response.status_code)


async def verify_code(email: str, code: str) -> uuid.UUID | None:
    """The account the code proves, or None for a wrong or expired code."""
    async with _client() as client:
        try:
            response = await client.post(
                "/verify", json={"type": "email", "email": email, "token": code},
            )
        except httpx.HTTPError as exc:
            log.warning("checking a code failed: %s", type(exc).__name__)
            return None
    if response.status_code != 200:
        return None
    try:
        return uuid.UUID(response.json()["user"]["id"])
    except (KeyError, TypeError, ValueError):
        return None
