"""Training analytics (G6) — volume, e1RM, muscle balance, frequency, adherence.

**Not one number is computed here.** Every figure comes from
`app.domain.training` or `app.domain.adherence`, because **AC-06** requires the
finish summary (E-08), session detail (F-03) and this module to agree, and they
can only agree while there is one definition. A `SUM(load_kg * reps)` in this
file would be a second definition of volume, and it would drift quietly, months
later, on one user's data.

What SQL is allowed to do here is *select and group*. What it is not allowed to
do is *arithmetic on domain quantities*.
"""
from __future__ import annotations

import uuid
from datetime import UTC, date, datetime, timedelta
from typing import Annotated

from fastapi import APIRouter, Query
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload

from app.api.adapters import domain_set
from app.api.deps import CurrentUser, DbSession
from app.api.envelope import ok
from app.core.errors import NotFound, ValidationFailed
from app.domain import training as domain_training
from app.domain.adherence import adherence as adherence_ratio
from app.domain.adherence import planned_occurrences
from app.domain.muscles import MuscleTree
from app.models import (
    Exercise,
    ExerciseMuscle,
    MuscleGroup,
    MuscleRole,
    SessionExercise,
    SessionStatus,
    WorkoutPlanDay,
    WorkoutProgram,
    WorkoutSession,
)
from app.schemas.analytics import (
    AdherenceOut,
    AdherenceWeekOut,
    ExerciseProgressionOut,
    FrequencyCellOut,
    FrequencyOut,
    GroupBy,
    MuscleVolumeOut,
    PersonalRecordRowOut,
    ProgressionPointOut,
    VolumeBucketOut,
    WorkoutAnalyticsOut,
)
from app.schemas.envelope import Envelope

router = APIRouter(tags=["analytics"])

MAX_RANGE_DAYS = 366 * 3


def _range(date_from: date | None, date_to: date | None) -> tuple[date, date]:
    """Defaults to the last 12 weeks, which is what every G-screen opens on."""
    # UTC rather than the profile's day: this is only the DEFAULT bound, and
    # every G-screen sends an explicit range built from local dates (I7).
    end = date_to or datetime.now(UTC).date()
    start = date_from or (end - timedelta(weeks=12))
    if end < start:
        raise ValidationFailed("That range ends before it starts.",
                               fields={"from": start.isoformat(), "to": end.isoformat()})
    if (end - start).days > MAX_RANGE_DAYS:
        raise ValidationFailed(
            "That range is too long to chart in one go.",
            fields={"range": f"{(end - start).days} days"},
        )
    return start, end


def _week_start(day: date) -> date:
    """Monday. The plan tree counts weeks from Sunday, but a training week
    reads Monday-first on every screen in this product."""
    return day - timedelta(days=day.weekday())


def _bucket_start(day: date, group_by: GroupBy) -> date:
    if group_by == "day":
        return day
    if group_by == "week":
        return _week_start(day)
    return day.replace(day=1)


def _bucket_starts(start: date, end: date, group_by: GroupBy) -> list[date]:
    """Every bucket in the range, including the empty ones.

    Omitting a bucket with no training would draw a lay-off as continuous
    training — the gap is the information.
    """
    out: list[date] = []
    cursor = _bucket_start(start, group_by)
    while cursor <= end:
        out.append(cursor)
        if group_by == "day":
            cursor += timedelta(days=1)
        elif group_by == "week":
            cursor += timedelta(weeks=1)
        else:
            cursor = (cursor.replace(day=28) + timedelta(days=4)).replace(day=1)
    return out


async def _completed_sessions(db: DbSession, user_id, start: date, end: date):
    """Completed sessions in the range, with their sets.

    Selected by `local_date` (**I7**) — the day the user was living, which is
    already stored. Filtering on `started_at` would put a late-evening session
    in the wrong bucket for anyone east of Greenwich.
    """
    return (await db.scalars(
        select(WorkoutSession)
        .where(
            WorkoutSession.user_id == user_id,
            WorkoutSession.status == SessionStatus.completed,
            WorkoutSession.local_date >= start,
            WorkoutSession.local_date <= end,
        )
        .options(selectinload(WorkoutSession.exercises).selectinload(SessionExercise.sets))
        .order_by(WorkoutSession.local_date)
    )).all()


def _sets_of(session) -> list:
    return [domain_set(s) for se in session.exercises for s in se.sets]


def _counted(sets) -> list:
    """Sets that count toward volume — completed, non-warm-up (**I3 / D6**)."""
    return [s for s in sets if s.completed and s.set_type != "warmup"]


@router.get("/analytics/workouts", response_model=Envelope[WorkoutAnalyticsOut])
async def workout_volume(
    user: CurrentUser,
    db: DbSession,
    group_by: Annotated[GroupBy, Query()] = "week",
    date_from: Annotated[date | None, Query(alias="from")] = None,
    date_to: Annotated[date | None, Query(alias="to")] = None,
):
    """G-02's column chart: volume over time.

    The sum is `domain_training.total_volume_kg`, not SQL. This is the endpoint
    AC-06 compares against the logger.
    """
    start, end = _range(date_from, date_to)
    sessions = await _completed_sessions(db, user.id, start, end)

    tally: dict[date, dict] = {
        b: {"volume_kg": 0.0, "session_count": 0, "set_count": 0}
        for b in _bucket_starts(start, end, group_by)
    }

    for session in sessions:
        bucket = _bucket_start(session.local_date, group_by)
        if bucket not in tally:
            continue
        sets = _sets_of(session)
        tally[bucket]["volume_kg"] += domain_training.total_volume_kg(sets)
        tally[bucket]["set_count"] += len(_counted(sets))
        tally[bucket]["session_count"] += 1

    buckets = [
        VolumeBucketOut(start=b, **values) for b, values in sorted(tally.items())
    ]
    return ok(WorkoutAnalyticsOut(
        group_by=group_by,
        buckets=buckets,
        total_volume_kg=sum(b.volume_kg for b in buckets),
    ).model_dump(mode="json"))


@router.get("/analytics/muscle-volume", response_model=Envelope[list[MuscleVolumeOut]])
async def muscle_volume(
    user: CurrentUser,
    db: DbSession,
    date_from: Annotated[date | None, Query(alias="from")] = None,
    date_to: Annotated[date | None, Query(alias="to")] = None,
):
    """G-02's sorted horizontal bar: where the work actually went.

    **D7 / I4** — primary x1.0, secondary x0.5, via
    `domain_training.weighted_volume_kg`. Rolled up through `MuscleTree`, which
    lives beside G5's `muscle_subtree_ids` in `app.domain.muscles` and walks the
    same `parent_id` edges the other way: the CTE answers "everything below this
    group" for a filter, this answers "which groups receive this volume". Same
    module, so they cannot drift into disagreeing about what a chest day is.
    """
    start, end = _range(date_from, date_to)
    sessions = await _completed_sessions(db, user.id, start, end)

    # exercise_id -> volume, computed ONCE by the domain.
    per_exercise: dict[uuid.UUID, float] = {}
    per_exercise_sets: dict[uuid.UUID, int] = {}
    for session in sessions:
        for se in session.exercises:
            sets = [domain_set(s) for s in se.sets]
            per_exercise[se.exercise_id] = (
                per_exercise.get(se.exercise_id, 0.0)
                + domain_training.total_volume_kg(sets)
            )
            per_exercise_sets[se.exercise_id] = (
                per_exercise_sets.get(se.exercise_id, 0) + len(_counted(sets))
            )

    if not per_exercise:
        return ok([])

    roles = (await db.execute(
        select(ExerciseMuscle.exercise_id, ExerciseMuscle.muscle_group_id, ExerciseMuscle.role)
        .where(ExerciseMuscle.exercise_id.in_(list(per_exercise)))
    )).all()

    tree = MuscleTree((await db.scalars(select(MuscleGroup))).all())

    tally: dict[str, dict] = {}
    for exercise_id, group_id, role in roles:
        weighted = domain_training.weighted_volume_kg(
            per_exercise.get(exercise_id, 0.0),
            "primary" if role is MuscleRole.primary else "secondary",
        )
        for group in tree.ancestors(group_id):
            row = tally.setdefault(
                group.slug,
                {"name": group.name, "volume_kg": 0.0, "set_count": 0},
            )
            row["volume_kg"] += weighted
            row["set_count"] += per_exercise_sets.get(exercise_id, 0)

    rows = [
        MuscleVolumeOut(slug=slug, **values).model_dump(mode="json")
        for slug, values in tally.items()
    ]
    # Sorted here rather than in the client: G-02 draws a sorted bar, and two
    # orders maintained separately drift.
    rows.sort(key=lambda r: r["volume_kg"], reverse=True)
    return ok(rows)


@router.get(
    "/analytics/exercises/{exercise_id}",
    response_model=Envelope[ExerciseProgressionOut],
)
async def exercise_progression(
    exercise_id: uuid.UUID,
    user: CurrentUser,
    db: DbSession,
    date_from: Annotated[date | None, Query(alias="from")] = None,
    date_to: Annotated[date | None, Query(alias="to")] = None,
):
    """G-03 / G-07's line: e1RM and load over time for one exercise.

    **I5** — the series states its `formula_version`. Plotting values computed
    with different versions as one line is wrong in a way nobody sees.
    """
    exercise = await db.scalar(select(Exercise).where(Exercise.id == exercise_id))
    if exercise is None:
        raise NotFound("That exercise no longer exists.")

    start, end = _range(date_from, date_to)
    sessions = await _completed_sessions(db, user.id, start, end)

    points: list[ProgressionPointOut] = []
    for session in sessions:
        sets = [
            domain_set(s)
            for se in session.exercises if se.exercise_id == exercise_id
            for s in se.sets
        ]
        if not sets:
            continue
        # evaluate_records already excludes warm-ups (I3) and applies Epley (I5).
        records = domain_training.evaluate_records(sets)
        if records.max_load_kg is None and records.volume_kg == 0:
            continue
        points.append(ProgressionPointOut(
            local_date=session.local_date,
            e1rm_kg=records.estimated_1rm_kg,
            max_load_kg=records.max_load_kg,
            volume_kg=records.volume_kg,
        ))

    return ok(ExerciseProgressionOut(
        exercise_id=exercise_id,
        exercise_name=exercise.name,
        formula_version=domain_training.E1RM_FORMULA_VERSION,
        points=points,
    ).model_dump(mode="json"))


@router.get(
    "/analytics/personal-records",
    response_model=Envelope[list[PersonalRecordRowOut]],
)
async def personal_records(
    user: CurrentUser,
    db: DbSession,
    date_from: Annotated[date | None, Query(alias="from")] = None,
    date_to: Annotated[date | None, Query(alias="to")] = None,
):
    """G-04's KPI row. `evaluate_records` decides what a record is, not this."""
    start, end = _range(date_from, date_to)
    sessions = await _completed_sessions(db, user.id, start, end)

    by_exercise: dict[uuid.UUID, list] = {}
    achieved: dict[uuid.UUID, date] = {}
    for session in sessions:
        for se in session.exercises:
            if not se.sets:
                continue
            by_exercise.setdefault(se.exercise_id, []).extend(
                domain_set(s) for s in se.sets
            )
            achieved[se.exercise_id] = session.local_date

    if not by_exercise:
        return ok([])

    names = dict((await db.execute(
        select(Exercise.id, Exercise.name).where(Exercise.id.in_(list(by_exercise)))
    )).all())

    rows = []
    for exercise_id, sets in by_exercise.items():
        records = domain_training.evaluate_records(sets)
        if records.max_load_kg is None and records.volume_kg == 0:
            continue
        rows.append(PersonalRecordRowOut(
            exercise_id=exercise_id,
            exercise_name=names.get(exercise_id),
            max_load_kg=records.max_load_kg,
            max_reps=records.max_reps,
            estimated_1rm_kg=records.estimated_1rm_kg,
            volume_kg=records.volume_kg,
            formula_version=domain_training.E1RM_FORMULA_VERSION,
            achieved_on=achieved.get(exercise_id),
        ).model_dump(mode="json"))

    rows.sort(key=lambda r: r["estimated_1rm_kg"] or 0, reverse=True)
    return ok(rows)


@router.get("/analytics/frequency", response_model=Envelope[FrequencyOut])
async def frequency(
    user: CurrentUser,
    db: DbSession,
    date_from: Annotated[date | None, Query(alias="from")] = None,
    date_to: Annotated[date | None, Query(alias="to")] = None,
):
    """G-05's week x muscle heatmap.

    Counts SESSIONS per muscle per week, not exercises. A three-movement chest
    day is one chest day; counting exercises makes it read as three.
    """
    start, end = _range(date_from, date_to)
    sessions = await _completed_sessions(db, user.id, start, end)

    exercise_ids = {se.exercise_id for s in sessions for se in s.exercises}
    tree = MuscleTree((await db.scalars(select(MuscleGroup))).all())

    mapping: dict[uuid.UUID, set] = {}
    if exercise_ids:
        for exercise_id, group_id in (await db.execute(
            select(ExerciseMuscle.exercise_id, ExerciseMuscle.muscle_group_id)
            .where(ExerciseMuscle.exercise_id.in_(list(exercise_ids)))
        )).all():
            mapping.setdefault(exercise_id, set()).update(
                g.slug for g in tree.ancestors(group_id)
            )

    # (week, slug) -> set of session ids, so a session counts once per muscle.
    seen: dict[tuple[date, str], set] = {}
    for session in sessions:
        week = _week_start(session.local_date)
        for se in session.exercises:
            for slug in mapping.get(se.exercise_id, ()):
                seen.setdefault((week, slug), set()).add(session.id)

    by_slug = tree.slugs()
    cells = [
        FrequencyCellOut(
            week_start=week, slug=slug, name=by_slug.get(slug, slug), sessions=len(ids),
        ).model_dump(mode="json")
        for (week, slug), ids in sorted(seen.items(), key=lambda kv: (kv[0][0], kv[0][1]))
    ]
    weeks = _bucket_starts(start, end, "week")
    return ok(FrequencyOut(weeks=weeks, cells=cells).model_dump(mode="json"))


@router.get("/analytics/adherence", response_model=Envelope[AdherenceOut])
async def adherence(
    user: CurrentUser,
    db: DbSession,
    date_from: Annotated[date | None, Query(alias="from")] = None,
    date_to: Annotated[date | None, Query(alias="to")] = None,
):
    """G-06's meter — **PRD W07.7**, via `app.domain.adherence`.

    "Adherence counts the session, not the exercise" (PRD §7.1), so a planned
    day that happened at all counts, however much of it was performed.
    """
    start, end = _range(date_from, date_to)

    scheduled = (await db.execute(
        select(WorkoutPlanDay.id, WorkoutPlanDay.scheduled_weekday)
        .join(WorkoutProgram, WorkoutProgram.id == WorkoutPlanDay.program_id)
        .where(
            WorkoutProgram.user_id == user.id,
            WorkoutPlanDay.scheduled_weekday.is_not(None),
        )
    )).all()

    weekdays = [w for _, w in scheduled if w is not None]
    planned_total = planned_occurrences(weekdays, start, end)

    plan_day_ids = [d for d, _ in scheduled]
    completed_total = 0
    if plan_day_ids:
        completed_total = await db.scalar(
            select(func.count(func.distinct(WorkoutSession.id)))
            .where(
                WorkoutSession.user_id == user.id,
                WorkoutSession.status == SessionStatus.completed,
                WorkoutSession.plan_day_id.in_(plan_day_ids),
                WorkoutSession.local_date >= start,
                WorkoutSession.local_date <= end,
            )
        ) or 0

    weeks: list[AdherenceWeekOut] = []
    for week_start in _bucket_starts(start, end, "week"):
        week_end = min(week_start + timedelta(days=6), end)
        window_start = max(week_start, start)
        weeks.append(AdherenceWeekOut(
            week_start=week_start,
            planned=planned_occurrences(weekdays, window_start, week_end),
            completed_planned=(await db.scalar(
                select(func.count(func.distinct(WorkoutSession.id)))
                .where(
                    WorkoutSession.user_id == user.id,
                    WorkoutSession.status == SessionStatus.completed,
                    WorkoutSession.plan_day_id.in_(plan_day_ids or [None]),
                    WorkoutSession.local_date >= window_start,
                    WorkoutSession.local_date <= week_end,
                )
            ) or 0) if plan_day_ids else 0,
        ))

    return ok(AdherenceOut(
        planned=planned_total,
        completed_planned=completed_total,
        adherence=adherence_ratio(completed_total, planned_total),
        weeks=weeks,
    ).model_dump(mode="json"))
