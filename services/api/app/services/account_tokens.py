"""Emailed single-use links: issued, cooled down, redeemed (A-05, A-06, K-02).

The rules every link shares live here so no route can forget one:

* **One live link per user and purpose.** Issuing deletes the older rows, so
  the link in the newest email is the only one that works.
* **One link per purpose per minute** — the "Resend in 0:45" on A-05 and A-06,
  and what stops a stranger filling somebody's inbox from the reset form.
* **Redeeming locks the row and spends it** in the caller's transaction. A
  check that fails afterwards (a weak password, an address taken meanwhile)
  raises, the transaction rolls back, and the link is left unspent to try again.
"""
from __future__ import annotations

import math
import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.core.errors import LinkExpired
from app.core.security import hash_link_token, new_link_token
from app.models import AccountToken, AccountTokenPurpose
from app.services.credentials import lock_account


def _ttl(purpose: AccountTokenPurpose) -> timedelta:
    settings = get_settings()
    if purpose is AccountTokenPurpose.password_reset:
        return timedelta(minutes=settings.password_reset_ttl_minutes)
    return timedelta(hours=settings.email_verify_ttl_hours)


async def seconds_until_next(
    db: AsyncSession, user_id: uuid.UUID, purpose: AccountTokenPurpose
) -> int:
    """0 when a new link may be sent now; otherwise the wait, rounded up.

    Locks the account first, so two requests in the same instant cannot both
    pass the check and both send: the second waits, then sees the first's row.
    Every issue after sign-up goes through here.
    """
    await lock_account(db, user_id)
    latest = await db.scalar(
        select(func.max(AccountToken.created_at))
        .where(AccountToken.user_id == user_id, AccountToken.purpose == purpose)
    )
    if latest is None:
        return 0
    cooldown = timedelta(seconds=get_settings().email_resend_cooldown_seconds)
    wait = (latest + cooldown - datetime.now(UTC)).total_seconds()
    return max(0, math.ceil(wait))


async def issue(
    db: AsyncSession, user_id: uuid.UUID, purpose: AccountTokenPurpose, email: str
) -> str:
    """A fresh link, replacing any older one for the same purpose.

    Returns the raw token — the only moment it exists outside the email.
    """
    await revoke(db, user_id, purpose)
    raw, token_hash = new_link_token()
    now = datetime.now(UTC)
    db.add(AccountToken(
        user_id=user_id, purpose=purpose, token_hash=token_hash, email=email,
        # Written here rather than left to the server default, so the lifetime
        # and the cooldown are measured from one clock.
        created_at=now, expires_at=now + _ttl(purpose),
    ))
    await db.flush()
    return raw


async def redeem(
    db: AsyncSession, raw: str, purposes: tuple[AccountTokenPurpose, ...]
) -> AccountToken:
    """The live link for `raw`, locked and spent — or `LinkExpired`.

    Unknown, used, superseded, expired or for another purpose all raise the same
    error: telling them apart tells a guesser which tokens once existed.
    """
    row = await db.scalar(
        select(AccountToken)
        .where(AccountToken.token_hash == hash_link_token(raw.strip()),
               AccountToken.purpose.in_(purposes))
        # Two taps on one link must not both succeed.
        .with_for_update()
    )
    now = datetime.now(UTC)
    if row is None or row.used_at is not None or row.expires_at <= now:
        raise LinkExpired()
    row.used_at = now
    return row


async def revoke(db: AsyncSession, user_id: uuid.UUID, *purposes: AccountTokenPurpose) -> None:
    """Deletes the user's links for these purposes (all of them when none are named)."""
    statement = delete(AccountToken).where(AccountToken.user_id == user_id)
    if purposes:
        statement = statement.where(AccountToken.purpose.in_(purposes))
    await db.execute(statement)


async def pending_email(db: AsyncSession, user_id: uuid.UUID) -> str | None:
    """The address a K-02 change is waiting on, while its link is live."""
    return await db.scalar(
        select(AccountToken.email).where(
            AccountToken.user_id == user_id,
            AccountToken.purpose == AccountTokenPurpose.change_email,
            AccountToken.used_at.is_(None),
            AccountToken.expires_at > datetime.now(UTC),
        )
    )
