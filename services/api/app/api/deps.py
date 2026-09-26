from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.auth import provision, sessions, tokens
from app.auth.tokens import Claims
from app.core.errors import Forbidden, Unauthorized
from app.db import SessionLocal, get_db
from app.models import User, UserStatus

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


async def current_claims(request: Request, db: DbSession) -> Claims:
    """The caller's Supabase sign-in, verified and still live (docs/14, S2–S3).

    The token must be this project's, unexpired and correctly signed — and the
    sign-in it came from must still exist. A token outlives its sign-out until
    it expires; without the session check, "sign out other devices" and a
    deleted account would leave a working token for up to fifteen minutes (the
    rule the refresh-family check enforced before, G11 security review). A 401
    sends the app to Supabase to refresh, which an ended sign-in cannot.
    """
    header = request.headers.get("authorization", "")
    if not header.lower().startswith("bearer "):
        raise Unauthorized()
    claims = await tokens.verify(header[7:])
    if claims is None or not await sessions.is_live(db, claims):
        raise Unauthorized()
    return claims


Signin = Annotated[Claims, Depends(current_claims)]


async def current_user(claims: Signin, db: DbSession) -> User:
    user = await provision.account_for(db, claims)
    if user.deleted_at is not None:
        raise Unauthorized()
    if user.status is not UserStatus.active:
        raise Forbidden("This account is disabled.")
    return user


CurrentUser = Annotated[User, Depends(current_user)]


async def current_session(claims: Signin, user: CurrentUser) -> uuid.UUID:
    """The Supabase sign-in — the device — the caller's token came from. Depends
    on `current_user`, so it only ever runs for a live, provisioned account."""
    return claims.session_id


CurrentSession = Annotated[uuid.UUID, Depends(current_session)]


def can(actor: User, action: str, owner_user_id: uuid.UUID) -> bool:
    """Every handler asks the policy layer, never `resource.user_id == token.sub` inline.
    This is what makes coach accounts (BRD §21) a policy change rather than a rewrite."""
    return actor.id == owner_user_id


def authorize(actor: User, action: str, owner_user_id: uuid.UUID) -> None:
    if not can(actor, action, owner_user_id):
        raise Forbidden()
