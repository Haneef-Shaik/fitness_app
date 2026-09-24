"""Q8 · versioned calorie targets (G10).

The profile holds the CURRENT targets; `calorie_targets` holds one row per day
they changed. A day is judged against the latest row on or before it — so a
target changed on Friday leaves Tuesday's meter as it was (H-15's promise).
"""
from __future__ import annotations

import uuid
from bisect import bisect_right
from dataclasses import dataclass
from datetime import UTC, date, datetime

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.dates import to_local_date
from app.models import CalorieTarget, UserProfile

TARGET_FIELDS = ("daily_calorie_target", "protein_g_target", "carbs_g_target", "fat_g_target")


@dataclass(frozen=True, slots=True)
class Targets:
    calories: int | None
    protein_g: int | None
    carbs_g: int | None
    fat_g: int | None

    def as_dict(self) -> dict:
        return {"calories": self.calories, "protein_g": self.protein_g,
                "carbs_g": self.carbs_g, "fat_g": self.fat_g}


async def record(db: AsyncSession, profile: UserProfile) -> None:
    """The profile's targets as of its today. Twice in a day keeps the last."""
    today = to_local_date(datetime.now(UTC), profile.timezone)
    values = {
        "calories": profile.daily_calorie_target, "protein_g": profile.protein_g_target,
        "carbs_g": profile.carbs_g_target, "fat_g": profile.fat_g_target,
    }
    await db.execute(
        insert(CalorieTarget)
        .values(user_id=profile.user_id, effective_from=today, **values)
        .on_conflict_do_update(index_elements=["user_id", "effective_from"], set_=values)
    )


class TargetHistory:
    """Every change for one user, answering "what was the target on day d"."""

    def __init__(self, rows: list[CalorieTarget]) -> None:
        self._dates = [r.effective_from for r in rows]
        self._rows = rows

    def on(self, day: date) -> Targets | None:
        i = bisect_right(self._dates, day)
        if i == 0:
            return None                      # before any target was set
        r = self._rows[i - 1]
        return Targets(r.calories, r.protein_g, r.carbs_g, r.fat_g)


async def history(db: AsyncSession, user_id: uuid.UUID) -> TargetHistory:
    rows = (await db.scalars(
        select(CalorieTarget).where(CalorieTarget.user_id == user_id)
        .order_by(CalorieTarget.effective_from)
    )).all()
    return TargetHistory(list(rows))
