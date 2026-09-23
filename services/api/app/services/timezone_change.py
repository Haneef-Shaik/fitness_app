"""Re-bucketing a user's history when they change their timezone (edge case T4).

`workout_sessions.local_date` has carried this comment since M2:

> recomputed for the affected rows when a user changes their profile timezone
> (edge case T4)

It was not. G9 found it, because **I7** — the day is the profile's day — is the
invariant this goal turns on, and a dashboard that resolves "today" correctly
while the rows underneath it are bucketed by a timezone the user no longer lives
in is only half true.

What this does: recompute `local_date` from the stored instant and the new
timezone, for every row that carries one, then forget every cached summary. The
instants are untouched — a workout happened when it happened. Only the calendar
day it is filed under moves, which is the entire point.

Deliberately synchronous and deliberately bounded: a timezone change is rare,
and a user who has just moved continents would rather wait a moment than see
last week land on the wrong days.
"""
from __future__ import annotations

import uuid
from zoneinfo import ZoneInfo

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import BodyMetric, Meal, WorkoutSession
from app.services import summaries

#: Each table, the instant that decides its day, and the column to rewrite.
_BUCKETED = (
    (WorkoutSession, WorkoutSession.started_at),
    (Meal, Meal.consumed_at),
    (BodyMetric, BodyMetric.measured_at),
)


async def rebucket(db: AsyncSession, user_id: uuid.UUID, new_timezone: str) -> int:
    """Move every dated row onto the day it falls on in `new_timezone`.

    Returns how many rows moved — zero is the normal answer for a user whose
    old and new timezones share a UTC offset, and is worth reporting rather
    than hiding.
    """
    # Raises on an unknown zone before anything is written. The route validates
    # too; this is here so the function is safe called from anywhere.
    ZoneInfo(new_timezone)

    moved = 0
    for model, instant in _BUCKETED:
        # `AT TIME ZONE` in the database rather than a round trip per row: this
        # is one statement per table however much history the user has.
        recomputed = func.date(func.timezone(new_timezone, instant))
        result = await db.execute(
            update(model)
            .where(
                model.user_id == user_id,
                model.local_date != recomputed,
            )
            .values(local_date=recomputed, logged_timezone=new_timezone)
        )
        moved += result.rowcount or 0

    if moved:
        # Every cached day is now suspect: rows have crossed between them.
        await summaries.invalidate_all(db, user_id)

    return moved


async def affected_row_count(db: AsyncSession, user_id: uuid.UUID) -> int:
    """How much history a timezone change would touch. For a confirmation copy."""
    total = 0
    for model, _ in _BUCKETED:
        total += await db.scalar(
            select(func.count()).select_from(model).where(model.user_id == user_id)
        ) or 0
    return total
