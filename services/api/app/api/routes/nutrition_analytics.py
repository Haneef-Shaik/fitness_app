"""H-14 · Nutrition analytics — week, month, three months or a custom range.

Every day comes from `summary_for`, the same cached day the dashboard reads, so
"what counts" (confirmed items only, I2/D5) still has one definition. The
aggregation is `app.domain.nutrition_range`; this route only fetches days.

The range is capped at 92 days: it is read day by day from the summary cache,
and a quarter is the longest the screen offers.
"""
from __future__ import annotations

from dataclasses import asdict
from datetime import UTC, date, datetime, timedelta
from typing import Annotated

from fastapi import APIRouter, Query
from sqlalchemy import select

from app.api.deps import CurrentUser, DbSession
from app.api.envelope import ok
from app.core.errors import ValidationFailed
from app.domain.dates import to_local_date
from app.domain.nutrition_range import Day, summarise
from app.models import UserProfile
from app.schemas.envelope import Envelope
from app.schemas.nutrition_analytics import NutritionRangeOut
from app.services import targets as targets_service
from app.services.summaries import summary_for

router = APIRouter(tags=["analytics"])

MAX_DAYS = 92
DEFAULT_DAYS = 7


@router.get("/analytics/nutrition", response_model=Envelope[NutritionRangeOut])
async def nutrition_range(
    user: CurrentUser,
    db: DbSession,
    date_from: Annotated[date | None, Query(alias="from")] = None,
    date_to: Annotated[date | None, Query(alias="to")] = None,
):
    profile = await db.scalar(select(UserProfile).where(UserProfile.user_id == user.id))
    # The profile's today (I7): the default range ends on the day the user is living.
    today = to_local_date(datetime.now(UTC), profile.timezone if profile else "UTC")
    end = date_to or today
    start = date_from or end - timedelta(days=DEFAULT_DAYS - 1)
    if end < start:
        raise ValidationFailed("That range ends before it starts.",
                               fields={"from": start.isoformat(), "to": end.isoformat()})
    span = (end - start).days + 1
    if span > MAX_DAYS:
        raise ValidationFailed("Pick a range of three months or less.",
                               fields={"range": f"{span} days"})

    targets = await targets_service.history(db, user.id)
    days: list[Day] = []
    for i in range(span):
        d = start + timedelta(days=i)
        s = await summary_for(db, user.id, d)
        days.append(Day(
            local_date=d, calories=s["calories"], protein_g=s["protein_g"],
            carbs_g=s["carbs_g"], fat_g=s["fat_g"], meals_logged=s["meals_logged"],
            session_count=s["session_count"], incomplete=s["incomplete"],
            body_weight_kg=s["body_weight_kg"],
            target_kcal=_kcal(targets.on(d)),
        ))

    # The headline target is the one in force at the END of the range; with no
    # history yet, the profile's (Q8).
    current = _kcal(targets.on(end)) or (profile.daily_calorie_target if profile else None)
    r = summarise(days, float(current) if current else None)
    out = NutritionRangeOut(
        from_=start, to=end, days=r.days, logged_days=r.logged_days, enough_data=r.enough_data,
        averages=r.averages and asdict(r.averages), macro_split=r.macro_split,
        target_kcal=r.target_kcal, within_target_days=r.within_target_days,
        incomplete_days=r.incomplete_days,
        training=r.training and asdict(r.training), rest=r.rest and asdict(r.rest),
        daily=[asdict(p) for p in r.daily],
    )
    return ok(out.model_dump(mode="json", by_alias=True))


def _kcal(t: targets_service.Targets | None) -> float | None:
    return float(t.calories) if t and t.calories else None
