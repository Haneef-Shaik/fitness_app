"""`daily_summaries` — a cache, and only a cache ([02 §4.4]).

**Invalidate on write, recompute on read. Never update in place.**

Updating a summary row in place would mean two pieces of code computing the same
number — the one that wrote the meal and the one that computes a day — and only
one of them being right. Deleting the row says "this is unknown again" and lets
the single compute path answer. It also means a missed invalidation shows up as
a stale figure the tests catch by comparing against `/nutrition/day`, rather than
as a subtly wrong figure that nothing compares against.

Every figure here is reproducible from base tables. Nothing reads a summary to
compute another summary.
"""
from __future__ import annotations

import uuid
from datetime import date

from sqlalchemy import delete, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.domain import nutrition as domain_nutrition
from app.models import (
    BodyMetric,
    DailySummary,
    Meal,
    SessionStatus,
    WorkoutSession,
)


async def invalidate(db: AsyncSession, user_id: uuid.UUID, local_date: date | None) -> None:
    """Forget a day. The next read recomputes it.

    Called from every write path that can change a day. A missed call is a stale
    dashboard, which is why the dashboard's figures are asserted against
    `/nutrition/day` — a comparison that fails loudly rather than drifting.
    """
    if local_date is None:
        return
    await db.execute(
        delete(DailySummary).where(
            DailySummary.user_id == user_id, DailySummary.local_date == local_date
        )
    )


async def invalidate_all(db: AsyncSession, user_id: uuid.UUID) -> None:
    """Forget every day. For a change that moves a boundary rather than a value —
    a timezone edit re-buckets every session and meal the user has."""
    await db.execute(delete(DailySummary).where(DailySummary.user_id == user_id))


async def compute(db: AsyncSession, user_id: uuid.UUID, local_date: date) -> dict:
    """The one place a day is computed. From base tables, always."""
    sessions = (await db.scalars(
        select(WorkoutSession).where(
            WorkoutSession.user_id == user_id,
            WorkoutSession.local_date == local_date,
            WorkoutSession.status == SessionStatus.completed,
        )
    )).all()
    volume = sum(float(s.total_volume_kg or 0) for s in sessions)

    meals = (await db.scalars(
        select(Meal)
        .where(Meal.user_id == user_id, Meal.local_date == local_date)
        .options(selectinload(Meal.items))
    )).all()

    # Through the domain module, like every other nutrition total. A SUM here
    # would be a second definition of "what counts" and I2 would have two homes.
    totals = domain_nutrition.day_totals([
        domain_nutrition.MealItem(
            calories=_num(i.calories), protein_g=_num(i.protein_g),
            carbs_g=_num(i.carbs_g), fat_g=_num(i.fat_g), confirmed=i.confirmed,
        )
        for meal in meals for i in meal.items
    ])

    weight = await canonical_weight(db, user_id, local_date)

    return {
        "session_count": len(sessions),
        "volume_kg": volume,
        "calories": totals.calories,
        "protein_g": totals.protein_g,
        "carbs_g": totals.carbs_g,
        "fat_g": totals.fat_g,
        "meals_logged": len(meals),
        "pending_count": totals.pending_count,
        "incomplete": totals.incomplete,
        "body_weight_kg": weight,
    }


async def canonical_weight(
    db: AsyncSession, user_id: uuid.UUID, local_date: date
) -> float | None:
    """**Q5 — the first weigh-in of the day.**

    Earliest *measured*, not earliest written: somebody weighs themselves at
    07:30, forgets, and logs it after dinner.
    """
    row = await db.scalar(
        select(BodyMetric)
        .where(
            BodyMetric.user_id == user_id,
            BodyMetric.local_date == local_date,
            BodyMetric.metric_key == "body_weight",
        )
        .order_by(BodyMetric.measured_at)
        .limit(1)
    )
    return float(row.value) if row is not None else None


async def summary_for(db: AsyncSession, user_id: uuid.UUID, local_date: date) -> dict:
    """The cached day, computing and storing it when it is not there."""
    cached = await db.get(DailySummary, (user_id, local_date))
    if cached is not None:
        return _as_dict(cached)

    values = await compute(db, user_id, local_date)

    # ON CONFLICT DO NOTHING: two requests racing to warm the same day is
    # routine, and neither should 500 over it. Whichever lands first wins, and
    # they computed the same thing anyway.
    await db.execute(
        insert(DailySummary)
        .values(user_id=user_id, local_date=local_date, **values)
        .on_conflict_do_nothing(index_elements=["user_id", "local_date"])
    )
    await db.flush()
    return values


def _as_dict(row: DailySummary) -> dict:
    return {
        "session_count": row.session_count,
        "volume_kg": float(row.volume_kg),
        "calories": float(row.calories),
        "protein_g": float(row.protein_g),
        "carbs_g": float(row.carbs_g),
        "fat_g": float(row.fat_g),
        "meals_logged": row.meals_logged,
        "pending_count": row.pending_count,
        "incomplete": row.incomplete,
        "body_weight_kg": float(row.body_weight_kg) if row.body_weight_kg is not None else None,
    }


def _num(value) -> float | None:
    return float(value) if value is not None else None


__all__ = [
    "canonical_weight",
    "compute",
    "invalidate",
    "invalidate_all",
    "summary_for",
]
