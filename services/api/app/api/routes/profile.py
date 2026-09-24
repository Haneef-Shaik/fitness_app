from __future__ import annotations

from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from fastapi import APIRouter
from sqlalchemy import select

from app.api.deps import CurrentUser, DbSession
from app.api.envelope import ok
from app.core.errors import NotFound, ValidationFailed
from app.models import UserProfile
from app.schemas.envelope import Envelope
from app.schemas.profile import ProfileOut, ProfilePatch
from app.services import targets
from app.services.timezone_change import rebucket

router = APIRouter(prefix="/profile", tags=["profile"])


@router.get("", response_model=Envelope[ProfileOut])
async def get_profile(user: CurrentUser, db: DbSession):
    profile = await db.scalar(select(UserProfile).where(UserProfile.user_id == user.id))
    if profile is None:
        raise NotFound("No profile yet.")
    return ok(ProfileOut.model_validate(profile).model_dump(mode="json"))


@router.patch("", response_model=Envelope[ProfileOut])
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

    moving = (
        "timezone" in changes
        and changes["timezone"] is not None
        and changes["timezone"] != profile.timezone
    )

    for key, value in changes.items():
        setattr(profile, key, value)
    await db.flush()

    # Q8: a change of target is dated, so past days keep the one they had.
    # After the timezone is applied, so "today" is the day the user means.
    if any(field in changes for field in targets.TARGET_FIELDS):
        await targets.record(db, profile)
        await db.flush()

    if moving:
        # A timezone change moves a BOUNDARY, not a value. Every session, meal
        # and weigh-in is re-filed onto the day it actually falls on now, and
        # every cached summary is discarded — edge case T4, which the M2 model
        # comment has claimed was handled since before it was.
        await rebucket(db, user.id, profile.timezone)
        await db.flush()

    return ok(ProfileOut.model_validate(profile).model_dump(mode="json"))
