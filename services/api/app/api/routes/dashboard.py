"""`GET /dashboard` — **AC-11**. One call, one local date, three domains.

Declared in [02 §7] since M0 and missing until now (Finding 2), so B-01 has been
fanning out. Every extra request is latency on the first screen after launch —
the screen a user sees most often and judges the app by.

**The local date is resolved here, from the profile's timezone, and the client
is never asked** (**I7**). A phone in a different timezone from the profile is
not a bug the client gets to have an opinion about — and this is the screen
where getting it wrong would be least visible: a day boundary moves by hours,
the numbers stay plausible, and nobody notices until they travel.

**Every domain is always present.** A brand-new user has three empty ones, and
that is the *first* dashboard anybody sees. It renders; it does not 404.
"""
from __future__ import annotations

import uuid
from datetime import UTC, date, datetime, timedelta
from typing import Annotated

from fastapi import APIRouter, Query
from sqlalchemy import func, select

from app.api.deps import CurrentUser, DbSession
from app.api.envelope import ok
from app.domain.body import goal_progress, training_streak
from app.domain.dates import to_local_date
from app.models import (
    BodyMetric,
    FitnessGoal,
    GoalStatus,
    SessionStatus,
    UserProfile,
    WorkoutSession,
    WorkoutSet,
)
from app.schemas.body import (
    BodyCardOut,
    BodyPointOut,
    DashboardOut,
    GoalCardOut,
    LastSessionOut,
    MacroTargetsOut,
    NutritionCardOut,
    TrainingCardOut,
)
from app.schemas.envelope import Envelope
from app.services import summaries

router = APIRouter(tags=["dashboard"])

#: How far back the streak query looks. A year of consecutive training days is
#: not a number this needs to be exact beyond.
STREAK_WINDOW_DAYS = 400


@router.get("/dashboard", response_model=Envelope[DashboardOut])
async def dashboard(
    user: CurrentUser,
    db: DbSession,
    day: Annotated[date | None, Query(alias="date")] = None,
):
    profile = await db.scalar(select(UserProfile).where(UserProfile.user_id == user.id))
    tz = (profile.timezone if profile else None) or "UTC"

    # The one line this endpoint exists to own. `day` is honoured when a client
    # asks for a specific date — yesterday's dashboard is a real thing to want —
    # but the DEFAULT is the server's answer, never the device's.
    local_date = day or to_local_date(datetime.now(UTC), tz)

    summary = await summaries.summary_for(db, user.id, local_date)

    return ok(DashboardOut(
        local_date=local_date,
        timezone=tz,
        training=await _training(db, user.id, local_date, tz, summary),
        nutrition=_nutrition(summary, profile),
        body=await _body(db, user.id, local_date, summary),
        goals=await _goals(db, user.id),
    ).model_dump(mode="json"))


# ------------------------------------------------------------------ training

async def _training(
    db: DbSession, user_id: uuid.UUID, local_date: date, tz: str, summary: dict
) -> TrainingCardOut:
    week_start = local_date - timedelta(days=local_date.weekday())

    week = (await db.execute(
        select(
            func.count(WorkoutSession.id),
            func.coalesce(func.sum(WorkoutSession.total_volume_kg), 0),
        ).where(
            WorkoutSession.user_id == user_id,
            WorkoutSession.status == SessionStatus.completed,
            WorkoutSession.local_date >= week_start,
            WorkoutSession.local_date <= local_date,
        )
    )).one()

    active_id = await db.scalar(
        select(WorkoutSession.id).where(
            WorkoutSession.user_id == user_id,
            WorkoutSession.status == SessionStatus.in_progress,
        )
    )

    last = await db.scalar(
        select(WorkoutSession)
        .where(
            WorkoutSession.user_id == user_id,
            WorkoutSession.status == SessionStatus.completed,
        )
        .order_by(WorkoutSession.local_date.desc(), WorkoutSession.started_at.desc())
        .limit(1)
    )
    last_out = None
    if last is not None:
        set_count = await db.scalar(
            select(func.count(WorkoutSet.id))
            .join(WorkoutSet.session_exercise)
            .where(WorkoutSet.session_exercise.has(session_id=last.id))
        ) or 0
        last_out = LastSessionOut(
            id=last.id, local_date=last.local_date, title=last.notes,
            total_volume_kg=float(last.total_volume_kg) if last.total_volume_kg else None,
            set_count=set_count,
        )

    # The streak is computed in the domain module, from dates already resolved
    # in the profile's timezone. Nothing here decides which day anything was on.
    trained = (await db.scalars(
        select(WorkoutSession.local_date)
        .where(
            WorkoutSession.user_id == user_id,
            WorkoutSession.status == SessionStatus.completed,
            WorkoutSession.local_date >= local_date - timedelta(days=STREAK_WINDOW_DAYS),
        )
        .distinct()
    )).all()

    return TrainingCardOut(
        sessions_today=summary["session_count"],
        volume_today_kg=summary["volume_kg"],
        sessions_this_week=week[0],
        volume_this_week_kg=float(week[1]),
        streak_days=training_streak(local_date, list(trained)),
        active_session_id=active_id,
        last_session=last_out,
    )


# ----------------------------------------------------------------- nutrition

def _nutrition(summary: dict, profile: UserProfile | None) -> NutritionCardOut:
    """Confirmed only, and it does not do its own arithmetic.

    Every figure here comes from the summary, which came from
    `app.domain.nutrition.day_totals`. A sum in this function would be a second
    definition of what counts, and **I2** would have two homes.
    """
    return NutritionCardOut(
        calories=summary["calories"],
        protein_g=summary["protein_g"],
        carbs_g=summary["carbs_g"],
        fat_g=summary["fat_g"],
        meals_logged=summary["meals_logged"],
        pending_count=summary["pending_count"],
        incomplete=summary["incomplete"],
        targets=MacroTargetsOut(
            calories=profile.daily_calorie_target if profile else None,
            protein_g=profile.protein_g_target if profile else None,
            carbs_g=profile.carbs_g_target if profile else None,
            fat_g=profile.fat_g_target if profile else None,
        ),
    )


# ---------------------------------------------------------------------- body

async def _body(
    db: DbSession, user_id: uuid.UUID, local_date: date, summary: dict
) -> BodyCardOut:
    latest = await db.scalar(
        select(BodyMetric)
        .where(
            BodyMetric.user_id == user_id,
            BodyMetric.metric_key == "body_weight",
            BodyMetric.local_date <= local_date,
        )
        .order_by(BodyMetric.local_date.desc(), BodyMetric.measured_at)
        .limit(1)
    )
    # From the summary, so "did I weigh in today" costs nothing on a warm day
    # — and so the column is actually read, rather than being a cached number
    # nobody consults and nobody can notice going stale.
    today = summary["body_weight_kg"]

    if latest is None:
        return BodyCardOut(today=today)

    return BodyCardOut(
        latest=BodyPointOut(local_date=latest.local_date, value=float(latest.value)),
        today=today,
        change_7d=await _change_since(db, user_id, local_date, 7, float(latest.value)),
        change_30d=await _change_since(db, user_id, local_date, 30, float(latest.value)),
        unit=latest.unit,
    )


async def _change_since(
    db: DbSession, user_id: uuid.UUID, local_date: date, days: int, current: float
) -> float | None:
    """How much has moved since `days` ago, or `None` if there is no baseline.

    None rather than 0: "you have not been weighed in a month" and "you have not
    changed in a month" are different statements.
    """
    since = local_date - timedelta(days=days)
    baseline = await db.scalar(
        select(BodyMetric)
        .where(
            BodyMetric.user_id == user_id,
            BodyMetric.metric_key == "body_weight",
            BodyMetric.local_date >= since,
            BodyMetric.local_date <= local_date,
        )
        .order_by(BodyMetric.local_date, BodyMetric.measured_at)
        .limit(1)
    )
    if baseline is None or baseline.local_date == local_date:
        return None
    return current - float(baseline.value)


# --------------------------------------------------------------------- goals

async def _goals(db: DbSession, user_id: uuid.UUID) -> list[GoalCardOut]:
    rows = (await db.scalars(
        select(FitnessGoal)
        .where(FitnessGoal.user_id == user_id, FitnessGoal.status == GoalStatus.active)
        .order_by(FitnessGoal.created_at.desc())
    )).all()
    return [await goal_card(db, user_id, g) for g in rows]


async def goal_card(db: DbSession, user_id: uuid.UUID, goal: FitnessGoal) -> GoalCardOut:
    """A goal plus its progress.

    Shared with `/goals` so the list and the dashboard can never disagree about
    how far along something is.
    """
    current = await db.scalar(
        select(BodyMetric)
        .where(BodyMetric.user_id == user_id, BodyMetric.metric_key == goal.metric_key)
        .order_by(BodyMetric.local_date.desc(), BodyMetric.measured_at)
        .limit(1)
    )
    current_value = float(current.value) if current is not None else None
    start = float(goal.start_value) if goal.start_value is not None else None

    return GoalCardOut(
        id=goal.id,
        goal_type=goal.goal_type.value if hasattr(goal.goal_type, "value") else str(goal.goal_type),
        metric_key=goal.metric_key,
        direction=goal.direction,
        start_value=start,
        target_value=float(goal.target_value),
        target_unit=goal.target_unit,
        current_value=current_value,
        progress=goal_progress(
            start=start, target=float(goal.target_value),
            current=current_value, direction=goal.direction,
        ),
        status=goal.status.value if hasattr(goal.status, "value") else str(goal.status),
    )
