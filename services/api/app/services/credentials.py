"""Refresh-token pairs: issued, and revoked by the family (BRD §18, K-02).

These lived inside the auth routes until K-02 needed them too: a password
change hands the caller a fresh pair, and three flows end sessions — a reset,
a password change and "sign out other devices".

A **family** is one sign-in on one device. Refresh rotates the token inside its
family, so revoking a family is signing that device out, and "every family but
this one" is every other device.

**Revoking and issuing are serialised on the account row.** A refresh that read
its token just before a revoke committed would otherwise rotate anyway, and the
token it minted — inserted, not yet committed — is invisible to the revoke's
UPDATE. So `revoke_sessions`, refresh and login all take `lock_account` first,
always in the order account → tokens, which is also what keeps them from
deadlocking each other.
"""
from __future__ import annotations

import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy import delete, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.core.security import create_access_token, new_refresh_token
from app.models import PushToken, RefreshToken, User


async def lock_account(db: AsyncSession, user_id: uuid.UUID) -> None:
    """Holds the user's row until the transaction ends. See the module docstring."""
    await db.execute(select(User.id).where(User.id == user_id).with_for_update())


async def family_is_live(db: AsyncSession, user_id: uuid.UUID, family_id: uuid.UUID) -> bool:
    """Whether a sign-in still has a token that could refresh."""
    return await db.scalar(
        select(RefreshToken.id).where(
            RefreshToken.user_id == user_id,
            RefreshToken.family_id == family_id,
            RefreshToken.revoked_at.is_(None),
            RefreshToken.expires_at > datetime.now(UTC),
        ).limit(1)
    ) is not None


async def issue_token_pair(
    db: AsyncSession, user: User, family_id: uuid.UUID | None = None
) -> dict:
    """A new refresh token in `family_id` (a rotation), or in a new family (a sign-in)."""
    settings = get_settings()
    family = family_id or uuid.uuid4()
    raw, token_hash = new_refresh_token()
    db.add(
        RefreshToken(
            user_id=user.id,
            token_hash=token_hash,
            family_id=family,
            expires_at=datetime.now(UTC) + timedelta(days=settings.refresh_token_ttl_days),
        )
    )
    await db.flush()
    return {
        "access_token": create_access_token(user.id, family),
        "refresh_token": raw,
        "token_type": "Bearer",
        "expires_in": settings.access_token_ttl_minutes * 60,
    }


async def revoke_sessions(
    db: AsyncSession, user_id: uuid.UUID, *, keep_family: uuid.UUID | None = None
) -> int:
    """Revokes every live refresh token the user has, except one family's.

    Returns how many devices that signed out — families that still had an
    unexpired token — which is the number K-02 reports back. An access token
    already issued lives out its short TTL; there is no server-side session to
    end sooner.
    """
    await lock_account(db, user_id)
    now = datetime.now(UTC)
    live = [RefreshToken.user_id == user_id, RefreshToken.revoked_at.is_(None)]
    if keep_family is not None:
        live.append(RefreshToken.family_id != keep_family)

    signed_in = set(await db.scalars(
        select(RefreshToken.family_id).where(*live, RefreshToken.expires_at > now).distinct()
    ))
    await db.execute(update(RefreshToken).where(*live).values(revoked_at=now))
    # Those devices' push registrations go with their sessions (G11 review).
    gone = [PushToken.user_id == user_id]
    if keep_family is not None:
        gone.append(or_(PushToken.family_id.is_(None), PushToken.family_id != keep_family))
    await db.execute(delete(PushToken).where(*gone))
    return len(signed_in)
