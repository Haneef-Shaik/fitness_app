"""Registering a phone for push notifications (launch plan, phase 6)."""
from __future__ import annotations

from typing import Literal

from fastapi import APIRouter
from pydantic import BaseModel, Field
from sqlalchemy import delete, select

from app.api.deps import CurrentFamily, CurrentUser, DbSession
from app.api.envelope import ok
from app.models import PushToken
from app.schemas.envelope import DeletedOut, Envelope

router = APIRouter(prefix="/devices", tags=["devices"])


class PushTokenIn(BaseModel):
    token: str = Field(min_length=10, max_length=255, pattern=r"^ExponentPushToken\[.+\]$|^ExpoPushToken\[.+\]$")
    platform: Literal["ios", "android"]


class PushTokenOut(BaseModel):
    token: str
    platform: str


@router.put("/push-token", response_model=Envelope[PushTokenOut])
async def register_push_token(
    body: PushTokenIn, user: CurrentUser, family: CurrentFamily, db: DbSession,
):
    """Idempotent. A token already on file for another account moves to this
    one — the phone changed hands (or accounts), and the old account's news must
    stop arriving on it."""
    row = await db.scalar(select(PushToken).where(PushToken.token == body.token))
    if row is None:
        db.add(PushToken(user_id=user.id, token=body.token, platform=body.platform, family_id=family))
    else:
        row.user_id = user.id
        row.platform = body.platform
        row.family_id = family
    await db.flush()
    return ok({"token": body.token, "platform": body.platform})


@router.delete("/push-token", response_model=Envelope[DeletedOut])
async def unregister_push_token(body: PushTokenIn, user: CurrentUser, db: DbSession):
    """On sign-out. Only this account's own token can be removed."""
    result = await db.execute(
        delete(PushToken).where(PushToken.token == body.token, PushToken.user_id == user.id)
    )
    return ok({"deleted": bool(result.rowcount)})
