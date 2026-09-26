"""The FitLog account behind a Supabase sign-in (docs/14, S1).

`users.id` is Supabase's `auth.users.id`: one identity, no mapping table, and
every foreign key that pointed at `users.id` still does. The row is created
the first time a signed-in person calls the API — whichever way they signed
up (email, Google, Apple) — together with the empty profile onboarding fills
in, exactly what sign-up created before.

Supabase owns the email address. When it changes there (a confirmed change
of address), the next request carries the new one and the FitLog row follows.
"""
from __future__ import annotations

from sqlalchemy import select, update
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.tokens import Claims
from app.core.errors import Conflict
from app.models import User, UserProfile

#: user_metadata keys that carry a name: ours at sign-up, then Google's and Apple's.
_NAME_KEYS = ("display_name", "full_name", "name")


async def account_for(db: AsyncSession, claims: Claims) -> User:
    user = await db.scalar(select(User).where(User.id == claims.user_id))
    if user is None:
        user = await _create(db, claims)
    elif claims.email and user.email != claims.email:
        await _follow_email(db, user, claims.email)
    return user


async def _create(db: AsyncSession, claims: Claims) -> User:
    if not claims.email:
        # Every provider FitLog enables returns an address; a sign-in without
        # one is not one this product can recover or contact.
        raise Conflict("This sign-in has no email address.")
    # ON CONFLICT: two first requests at once (the app starts several) must
    # not collide into a 500.
    await db.execute(
        insert(User).values(id=claims.user_id, email=claims.email).on_conflict_do_nothing()
    )
    user = await db.scalar(select(User).where(User.id == claims.user_id))
    if user is None:
        # The insert did nothing and there is no row under this id: the address
        # belongs to another FitLog account (one whose sign-in was removed
        # outside the app). Refused rather than merged — and before the
        # profile, which would otherwise point at a user that is not there.
        raise Conflict("This email address belongs to another FitLog account.")
    await db.execute(
        insert(UserProfile).values(user_id=claims.user_id, display_name=_name(claims))
        .on_conflict_do_nothing()
    )
    await db.flush()
    return user


async def _follow_email(db: AsyncSession, user: User, email: str) -> None:
    taken = await db.scalar(select(User.id).where(User.email == email, User.id != user.id))
    if taken is not None:
        return  # keep the old address rather than fail every request
    await db.execute(update(User).where(User.id == user.id).values(email=email))
    user.email = email


def _name(claims: Claims) -> str | None:
    for key in _NAME_KEYS:
        value = claims.metadata.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()[:80]
    return None
