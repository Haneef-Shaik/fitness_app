from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import Depends, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import Forbidden, Unauthorized
from app.core.security import decode_access_token
from app.db import get_db
from app.models import User, UserStatus

DbSession = Annotated[AsyncSession, Depends(get_db)]


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
    return user


CurrentUser = Annotated[User, Depends(current_user)]


def can(actor: User, action: str, owner_user_id: uuid.UUID) -> bool:
    """Every handler asks the policy layer, never `resource.user_id == token.sub` inline.
    This is what makes coach accounts (BRD §21) a policy change rather than a rewrite."""
    return actor.id == owner_user_id


def authorize(actor: User, action: str, owner_user_id: uuid.UUID) -> None:
    if not can(actor, action, owner_user_id):
        raise Forbidden()
