from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import Depends, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.core.errors import Forbidden, Unauthorized
from app.core.security import access_token_family, decode_access_token
from app.db import SessionLocal, get_db
from app.email.base import EmailSender
from app.email.provider import get_email_sender
from app.models import User, UserStatus
from app.services.credentials import family_is_live

#: Function-scoped, so the commit in `get_db` runs BEFORE the response is sent.
#: FastAPI's default runs a yield dependency's exit after the response, and a
#: commit that failed there had already answered 200 — the outbox marked the
#: write sent and it was never saved (tests/test_commit_before_response.py).
DbSession = Annotated[AsyncSession, Depends(get_db, scope="function")]


def session_factory() -> async_sessionmaker[AsyncSession]:
    """For work that runs after the response — a background task opens its own
    session from this. A dependency, so the suite points it at the test database."""
    return SessionLocal


SessionFactory = Annotated[async_sessionmaker[AsyncSession], Depends(session_factory)]
#: The configured email sender. A dependency, not an import, so the suite puts
#: its own outbox in front of every route that sends mail with one override.
Mailer = Annotated[EmailSender, Depends(get_email_sender)]


async def current_user(request: Request, db: DbSession) -> User:
    header = request.headers.get("authorization", "")
    if not header.lower().startswith("bearer "):
        raise Unauthorized()
    user_id = decode_access_token(header[7:])
    if user_id is None:
        raise Unauthorized()

    user = await db.scalar(select(User).where(User.id == user_id))
    if user is None or user.deleted_at is not None:
        raise Unauthorized()
    if user.status is not UserStatus.active:
        raise Forbidden("This account is disabled.")
    # The sign-in this token came from must still be live. Without it, an access
    # token outlived a password reset, a password change or "sign out other
    # devices" by up to the access TTL — fifteen minutes of a stolen session
    # after the owner had ended it (G11 security review). A 401 here is what
    # sends the app to refresh, which a revoked family cannot.
    family = access_token_family(header[7:])
    if family is None or not await family_is_live(db, user.id, family):
        raise Unauthorized()
    return user


CurrentUser = Annotated[User, Depends(current_user)]


async def current_family(request: Request, user: CurrentUser, db: DbSession) -> uuid.UUID:
    """The refresh-token family — the device — the caller's access token came from.

    Depends on `current_user`, so it only ever runs for a valid token. A token
    minted before the `sid` claim existed is a 401: the client refreshes, and
    the refreshed token names its family (K-02 "sign out other devices").

    The family must still be signed in. An access token outlives its sign-out
    by up to the access TTL, and a device already signed out — or whoever took
    it — must not spend that time signing the owner out everywhere else.
    """
    family = access_token_family(request.headers.get("authorization", "")[7:])
    if family is None or not await family_is_live(db, user.id, family):
        raise Unauthorized()
    return family


CurrentFamily = Annotated[uuid.UUID, Depends(current_family)]


def can(actor: User, action: str, owner_user_id: uuid.UUID) -> bool:
    """Every handler asks the policy layer, never `resource.user_id == token.sub` inline.
    This is what makes coach accounts (BRD §21) a policy change rather than a rewrite."""
    return actor.id == owner_user_id


def authorize(actor: User, action: str, owner_user_id: uuid.UUID) -> None:
    if not can(actor, action, owner_user_id):
        raise Forbidden()
