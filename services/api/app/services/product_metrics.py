"""The PRD §6 product metrics, from the data the service already keeps.

No tracking SDK and no event stream: whether someone logged a meal in their
second week is already in `meals`, and a question the database can answer is
not a reason to send anyone's behaviour to a third party. Each definition is
stated where it is computed, because a retention figure without its
definition is a number anyone can make say anything.

Days are counted from the account's creation in UTC — close enough for a
weekly-cohort figure, and it does not depend on a timezone that can change.
"""
from __future__ import annotations

from dataclasses import asdict, dataclass
from datetime import UTC, datetime, timedelta

from sqlalchemy import and_, exists, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import ItemSource, Meal, MealItem, SessionStatus, User, WorkoutSession


@dataclass(frozen=True, slots=True)
class Retention:
    """`retained` of `cohort` were active in [day `start`, day `end`] after sign-up."""
    cohort: int
    retained: int

    @property
    def rate(self) -> float | None:
        return self.retained / self.cohort if self.cohort else None


async def _retention(
    db: AsyncSession, now: datetime, start: int, end: int, activity,
) -> Retention:
    """Among accounts old enough for the whole window to have passed, how many
    did `activity` inside it. `activity(user_created, lo, hi)` is an EXISTS."""
    eligible = User.created_at <= now - timedelta(days=end + 1)
    lo = User.created_at + timedelta(days=start)
    hi = User.created_at + timedelta(days=end + 1)
    cohort = await db.scalar(select(func.count()).select_from(User).where(eligible)) or 0
    retained = await db.scalar(
        select(func.count()).select_from(User).where(eligible, activity(lo, hi))
    ) or 0
    return Retention(cohort=cohort, retained=retained)


def _logged_a_meal(lo, hi):
    return exists().where(Meal.user_id == User.id, Meal.consumed_at >= lo, Meal.consumed_at < hi)


def _finished_a_workout(lo, hi):
    return exists().where(
        WorkoutSession.user_id == User.id,
        WorkoutSession.status == SessionStatus.completed,
        WorkoutSession.started_at >= lo, WorkoutSession.started_at < hi,
    )


async def product_metrics(db: AsyncSession, now: datetime | None = None) -> dict:
    now = now or datetime.now(UTC)

    # D7 nutrition retention (target ≥ 35 %): logged a meal on day 7–13.
    d7 = await _retention(db, now, 7, 13, _logged_a_meal)
    # D30 workout retention (target ≥ 45 %): finished a workout on day 30–36.
    d30 = await _retention(db, now, 30, 36, _finished_a_workout)

    # AI edit rate (tracked, no target): confirmed AI items the user changed.
    ai = and_(MealItem.source.in_([ItemSource.text_ai, ItemSource.image_ai]), MealItem.confirmed)
    ai_items = await db.scalar(select(func.count()).select_from(MealItem).where(ai)) or 0
    ai_edited = await db.scalar(
        select(func.count()).select_from(MealItem).where(ai, MealItem.user_corrected)
    ) or 0

    # Sessions lost (target < 0.1 %): started, then neither finished nor
    # deliberately discarded within a day — the shape a client error leaves.
    started = await db.scalar(select(func.count()).select_from(WorkoutSession)) or 0
    stranded = await db.scalar(
        select(func.count()).select_from(WorkoutSession).where(
            WorkoutSession.status == SessionStatus.in_progress,
            WorkoutSession.started_at < now - timedelta(hours=24),
        )
    ) or 0

    return {
        "as_of": now.isoformat(),
        "d7_nutrition_retention": {**asdict(d7), "rate": d7.rate, "target": 0.35,
                                   "definition": "logged a meal on day 7–13 after sign-up"},
        "d30_workout_retention": {**asdict(d30), "rate": d30.rate, "target": 0.45,
                                  "definition": "finished a workout on day 30–36 after sign-up"},
        "ai_edit_rate": {"items": ai_items, "edited": ai_edited,
                         "rate": ai_edited / ai_items if ai_items else None, "target": None},
        "sessions_lost": {"started": started, "stranded": stranded,
                          "rate": stranded / started if started else None, "target": 0.001,
                          "definition": "still in progress more than 24 h after starting"},
    }
