from __future__ import annotations

from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from fastapi import APIRouter
from sqlalchemy import select

from app.api.deps import CurrentUser, DbSession
from app.api.envelope import ok
from app.core.errors import NotFound, ValidationFailed
from app.models import UserProfile
from app.schemas.profile import ProfileOut, ProfilePatch

router = APIRouter(prefix="/profile", tags=["profile"])


@router.get("")
async def get_profile(user: CurrentUser, db: DbSession):
    profile = await db.scalar(select(UserProfile).where(UserProfile.user_id == user.id))
    if profile is None:
        raise NotFound("No profile yet.")
    return ok(ProfileOut.model_validate(profile).model_dump(mode="json"))


@router.patch("")
async def patch_profile(body: ProfilePatch, user: CurrentUser, db: DbSession):
    profile = await db.scalar(select(UserProfile).where(UserProfile.user_id == user.id))
    if profile is None:
        raise NotFound("No profile yet.")

    changes = body.model_dump(exclude_unset=True)

    if "timezone" in changes and changes["timezone"] is not None:
        try:
            ZoneInfo(changes["timezone"])
        except (ZoneInfoNotFoundError, ValueError):
            raise ValidationFailed(
                "That is not a recognised time zone.",
                fields={"timezone": "Unknown time zone."},
            ) from None

    for key, value in changes.items():
        setattr(profile, key, value)
    await db.flush()
    return ok(ProfileOut.model_validate(profile).model_dump(mode="json"))
