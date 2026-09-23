"""Copying a meal or a whole day (H-12).

**A copy is a manual entry, not a new estimate.** Items land `confirmed = true`,
`source = manual`, with no `analysis_item_id`: the user chose to log this, so
carrying the AI provenance across would let an estimate someone never looked at
count toward a total (**I12**, and the D5 rule it protects).

Clock times are preserved, not instants. Copying Tuesday's 13:00 lunch to
Wednesday puts it at 13:00 on Wednesday — even across a DST boundary, where
"the same instant, one day later" would land at 12:00 or 14:00.
"""
from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import Annotated
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Header
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.api.deps import CurrentUser, DbSession
from app.api.envelope import ok
from app.api.routes.nutrition import meal_out
from app.core.errors import NotFound, ValidationFailed
from app.domain.dates import to_local_date
from app.food.categories import assert_category
from app.models import ItemSource, Meal, MealItem, UserProfile
from app.schemas.envelope import Envelope
from app.schemas.nutrition import DayCopyIn, MealCopyIn, MealOut

router = APIRouter(tags=["nutrition"])


async def _timezone_of(db: DbSession, user_id: uuid.UUID) -> str:
    tz = await db.scalar(select(UserProfile.timezone).where(UserProfile.user_id == user_id))
    return tz or "UTC"


def _same_clock_time(source: datetime, to_date, time_zone: str) -> datetime:
    """`source`'s LOCAL clock time, on `to_date`, back in UTC."""
    zone = ZoneInfo(time_zone)
    local = source.astimezone(zone)
    return datetime.combine(to_date, local.timetz()).replace(tzinfo=zone).astimezone(UTC)


def _copied_items(source: Meal, target: Meal) -> list[MealItem]:
    """Fresh rows, identical macros, stripped of provenance."""
    return [
        MealItem(
            meal_id=target.id,
            food_id=item.food_id,
            display_name=item.display_name,
            quantity_grams=item.quantity_grams,
            calories=item.calories, protein_g=item.protein_g,
            carbs_g=item.carbs_g, fat_g=item.fat_g, fiber_g=item.fiber_g,
            # The three lines that make a copy a manual entry.
            confirmed=True,
            source=ItemSource.manual,
            analysis_item_id=None,
            user_corrected=False,
        )
        for item in source.items
    ]


async def _load_meal(db: DbSession, user_id: uuid.UUID, meal_id: uuid.UUID) -> Meal:
    meal = await db.scalar(
        select(Meal).where(Meal.id == meal_id, Meal.user_id == user_id)
        .options(selectinload(Meal.items))
    )
    if meal is None:
        raise NotFound("That meal no longer exists.")
    return meal


@router.post("/meals/{meal_id}/copy", status_code=201, response_model=Envelope[MealOut])
async def copy_meal(
    meal_id: uuid.UUID,
    body: MealCopyIn,
    user: CurrentUser,
    db: DbSession,
    idempotency_key: Annotated[uuid.UUID | None, Header(alias="Idempotency-Key")] = None,
):
    source = await _load_meal(db, user.id, meal_id)
    await assert_category(db, user.id, body.meal_type)

    if body.client_id is not None:
        existing = await db.scalar(
            select(Meal)
            .where(Meal.user_id == user.id, Meal.client_id == body.client_id)
            .options(selectinload(Meal.items))
        )
        if existing is not None:
            return ok(meal_out(existing), status_code=201)

    tz = await _timezone_of(db, user.id)
    consumed_at = _same_clock_time(source.consumed_at, body.to_date, tz)

    target = Meal(
        user_id=user.id, meal_type=body.meal_type, consumed_at=consumed_at,
        local_date=to_local_date(consumed_at, tz), logged_timezone=tz,
        notes=source.notes, client_id=body.client_id,
    )
    db.add(target)
    await db.flush()
    for item in _copied_items(source, target):
        db.add(item)
    await db.flush()

    fresh = await _load_meal(db, user.id, target.id)
    return ok(meal_out(fresh), status_code=201)


@router.post("/nutrition/day/copy", status_code=201, response_model=Envelope[list[MealOut]])
async def copy_day(
    body: DayCopyIn,
    user: CurrentUser,
    db: DbSession,
    idempotency_key: Annotated[uuid.UUID | None, Header(alias="Idempotency-Key")] = None,
):
    """Duplicates every meal on `from_date` onto `to_date`.

    Meals are ADDED, never replaced: the target day may already have something
    on it, and silently deleting a day someone logged is not a copy.
    """
    if body.from_date == body.to_date:
        raise ValidationFailed(
            "Pick a different day to copy to.", fields={"to_date": str(body.to_date)},
        )

    sources = (await db.scalars(
        select(Meal)
        .where(Meal.user_id == user.id, Meal.local_date == body.from_date)
        .options(selectinload(Meal.items))
        .order_by(Meal.consumed_at)
    )).all()
    if not sources:
        # Reporting success for a no-op leaves someone staring at an empty day
        # wondering which of the two dates they got wrong.
        raise ValidationFailed(
            "There is nothing logged on that day to copy.",
            fields={"from_date": str(body.from_date)},
        )

    tz = await _timezone_of(db, user.id)
    created: list[Meal] = []

    for source in sources:
        consumed_at = _same_clock_time(source.consumed_at, body.to_date, tz)
        target = Meal(
            user_id=user.id, meal_type=source.meal_type, consumed_at=consumed_at,
            local_date=to_local_date(consumed_at, tz), logged_timezone=tz,
            notes=source.notes,
        )
        db.add(target)
        await db.flush()
        for item in _copied_items(source, target):
            db.add(item)
        created.append(target)

    await db.flush()
    fresh = [await _load_meal(db, user.id, m.id) for m in created]
    return ok([meal_out(m) for m in fresh], status_code=201)
