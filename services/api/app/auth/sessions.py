"""Is the sign-in a token came from still live? (docs/14, S3)

A Supabase access token stays valid until it expires, whatever happened to
its sign-in since. Signing out — this device, every other device, or the
account being deleted — removes the session row in `auth.sessions`, so the
API reads that row and refuses a token whose sign-in is gone. This is what the
refresh-token family check did before: sign-out takes effect at once, not up
to fifteen minutes later.

The API's database role reads `auth.sessions` on Supabase (checked on the
local stack as the non-superuser `postgres` role, as hosted). The test suite's
plain Postgres gets a minimal `auth` schema of the same shape (tests/auth.py).
"""
from __future__ import annotations

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.tokens import Claims

_LIVE = text(
    "SELECT 1 FROM auth.sessions "
    "WHERE id = :sid AND user_id = :uid AND (not_after IS NULL OR not_after > now())"
)


async def is_live(db: AsyncSession, claims: Claims) -> bool:
    return bool(await db.scalar(_LIVE, {"sid": claims.session_id, "uid": claims.user_id}))
