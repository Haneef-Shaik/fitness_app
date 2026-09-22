"""History retrieval (G5) — finding the past without knowing its date.

Every rule here is normative and written down elsewhere. This module implements
them; it does not decide them.
"""
from __future__ import annotations

import uuid
from datetime import date
from typing import Annotated

from fastapi import APIRouter, Query
from sqlalchemy import func, select, tuple_
from sqlalchemy.orm import selectinload

from app.api.adapters import domain_set
from app.api.cursor import decode_cursor, encode_cursor
from app.api.deps import CurrentUser, DbSession
from app.api.envelope import ok
from app.core.errors import NotFound, ValidationFailed
from app.domain.muscles import muscle_subtree_ids
from app.domain.training import estimated_1rm_kg, evaluate_records, total_volume_kg
from app.models import (
    Exercise,
    ExerciseMuscle,
    MuscleGroup,
    MuscleRole,
    SessionExercise,
    SessionStatus,
    WorkoutSession,
    WorkoutSet,
)
from app.schemas.envelope import CursorEnvelope, Envelope
from app.schemas.history import (
    BestSetOut,
    ComparisonCellOut,
    ComparisonOut,
    ComparisonRowOut,
    ComparisonSessionOut,
    HistoryItemOut,
    PreviousOccurrenceOut,
)

router = APIRouter(tags=["history"])


def _matching_session(user_id, root_slug: str, roles: list[MuscleRole]):
    """The most recent completed session touching `root_slug` or below it.

    `completed_at DESC` is the rule's own ordering (PRD §7.2) — not `started_at`,
    which would reorder a session that was left open overnight and finished the
    next morning.
    """
    return (
        select(WorkoutSession)
        .where(
            WorkoutSession.user_id == user_id,
            WorkoutSession.status == SessionStatus.completed,
            WorkoutSession.id.in_(
                select(SessionExercise.session_id)
                .join(Exercise, Exercise.id == SessionExercise.exercise_id)
                .join(ExerciseMuscle, ExerciseMuscle.exercise_id == Exercise.id)
                .where(
                    ExerciseMuscle.muscle_group_id.in_(muscle_subtree_ids(root_slug)),
                    ExerciseMuscle.role.in_(roles),
                )
            ),
        )
        .order_by(WorkoutSession.completed_at.desc())
        .limit(1)
    )


@router.get("/history/previous-occurrence", response_model=Envelope[PreviousOccurrenceOut | None])
async def previous_occurrence(
    user: CurrentUser,
    db: DbSession,
    muscle: Annotated[str, Query(max_length=60)],
):
    """AC-05 — "what did I do last chest day?", without knowing the date.

    The rule, from PRD §7.2, in order:
      1. most recent completed session of MINE
      2. containing an exercise whose `exercise_muscles` row is that group **or a
         descendant** with `role = 'primary'`
      3. if nothing matches, widen to primary+secondary **and say so**
    """
    group = await db.scalar(select(MuscleGroup).where(MuscleGroup.slug == muscle))
    if group is None:
        raise ValidationFailed(
            "That muscle group does not exist.", fields={"muscle": muscle}
        )

    widened = False
    session = await db.scalar(_matching_session(user.id, muscle, [MuscleRole.primary]))
    if session is None:
        # Widening is a second query, not a looser first one: a primary match
        # anywhere in history must beat a NEWER secondary one, and a single
        # `role IN (...)` query would happily return the newer secondary.
        session = await db.scalar(
            _matching_session(user.id, muscle, [MuscleRole.primary, MuscleRole.secondary])
        )
        widened = session is not None

    if session is None:
        # Not an error. "You have never trained this" is an answer F-05 renders.
        return ok(None)

    names = (await db.scalars(
        select(Exercise.name)
        .join(SessionExercise, SessionExercise.exercise_id == Exercise.id)
        .where(SessionExercise.session_id == session.id)
        .order_by(SessionExercise.order_index)
    )).all()

    return ok(PreviousOccurrenceOut(
        session_id=session.id,
        completed_at=session.completed_at,
        local_date=session.local_date,
        total_volume_kg=float(session.total_volume_kg) if session.total_volume_kg else None,
        duration_seconds=session.duration_seconds,
        exercise_names=list(names),
        muscle_slug=group.slug,
        muscle_name=group.name,
        widened=widened,
        role_matched="secondary" if widened else "primary",
    ).model_dump(mode="json"))


def _muscle_filtered(stmt, muscle: str):
    """Restricts to sessions touching `muscle` or anything below it.

    The SAME recursion AC-05 resolves with (`muscle_subtree_ids`). F-02's filter
    and "previous chest day" must agree about what a chest day is; two tree
    walks would drift and the two screens would disagree.
    """
    return stmt.where(
        WorkoutSession.id.in_(
            select(SessionExercise.session_id)
            .join(Exercise, Exercise.id == SessionExercise.exercise_id)
            .join(ExerciseMuscle, ExerciseMuscle.exercise_id == Exercise.id)
            .where(ExerciseMuscle.muscle_group_id.in_(muscle_subtree_ids(muscle)))
        )
    )


@router.get("/history/workouts", response_model=CursorEnvelope[list[HistoryItemOut]])
async def list_workouts(
    user: CurrentUser,
    db: DbSession,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    cursor: Annotated[str | None, Query(max_length=512)] = None,
    muscle: Annotated[str | None, Query(max_length=60)] = None,
    exercise_id: uuid.UUID | None = None,
    date_from: Annotated[date | None, Query(alias="from")] = None,
    date_to: Annotated[date | None, Query(alias="to")] = None,
):
    """F-01's list, paginated by keyset (**H5.1**).

    Ordered `(started_at, id) DESC`, which is also the cursor key — the order and
    the key must be the same pair or paging skips rows.
    """
    mine = (
        select(WorkoutSession)
        .where(
            WorkoutSession.user_id == user.id,
            WorkoutSession.status == SessionStatus.completed,
        )
    )

    # Counted BEFORE the filters, so I13 can tell "no history" from "no matches".
    total_unfiltered = await db.scalar(
        select(func.count()).select_from(mine.subquery())
    ) or 0

    stmt = mine
    filtered = False
    if muscle is not None:
        if not await db.scalar(select(MuscleGroup.id).where(MuscleGroup.slug == muscle)):
            raise ValidationFailed("That muscle group does not exist.",
                                   fields={"muscle": muscle})
        stmt = _muscle_filtered(stmt, muscle)
        filtered = True
    if exercise_id is not None:
        stmt = stmt.where(WorkoutSession.id.in_(
            select(SessionExercise.session_id)
            .where(SessionExercise.exercise_id == exercise_id)
        ))
        filtered = True
    # The local date, not the instant (I7): a session belongs to the day the user
    # was living, which is what `local_date` already stores.
    if date_from is not None:
        stmt = stmt.where(WorkoutSession.local_date >= date_from)
        filtered = True
    if date_to is not None:
        stmt = stmt.where(WorkoutSession.local_date <= date_to)
        filtered = True

    if cursor is not None:
        after_t, after_id = decode_cursor(cursor)
        stmt = stmt.where(
            tuple_(WorkoutSession.started_at, WorkoutSession.id) < (after_t, after_id)
        )

    stmt = stmt.order_by(
        WorkoutSession.started_at.desc(), WorkoutSession.id.desc()
    ).options(selectinload(WorkoutSession.exercises))

    # One row over the page, so `has_more` is a fact rather than an inference
    # from "did we fill the page?" — which is wrong on an exactly-full last page.
    rows = (await db.scalars(stmt.limit(limit + 1))).all()
    has_more = len(rows) > limit
    rows = rows[:limit]

    # `session_exercises` carries only `exercise_id`, so names come from one
    # lookup across the whole page rather than a query per row.
    session_ids = [r.id for r in rows] or [None]
    names_by_session: dict = {}
    for sid, name in (await db.execute(
        select(SessionExercise.session_id, Exercise.name)
        .join(Exercise, Exercise.id == SessionExercise.exercise_id)
        .where(SessionExercise.session_id.in_(session_ids))
        .order_by(SessionExercise.order_index)
    )).all():
        names_by_session.setdefault(sid, []).append(name)

    set_counts = dict((await db.execute(
        select(SessionExercise.session_id, func.count(WorkoutSet.id))
        .join(WorkoutSet, WorkoutSet.session_exercise_id == SessionExercise.id)
        .where(SessionExercise.session_id.in_(session_ids))
        .group_by(SessionExercise.session_id)
    )).all())

    items = [
        HistoryItemOut(
            id=r.id,
            started_at=r.started_at,
            completed_at=r.completed_at,
            local_date=r.local_date,
            logged_timezone=r.logged_timezone,
            total_volume_kg=float(r.total_volume_kg) if r.total_volume_kg else None,
            duration_seconds=r.duration_seconds,
            set_count=set_counts.get(r.id, 0),
            exercise_names=names_by_session.get(r.id, []),
        ).model_dump(mode="json")
        for r in rows
    ]

    return ok(items, meta={
        "limit": limit,
        "count": len(items),
        "next_cursor": encode_cursor(rows[-1].started_at, rows[-1].id) if has_more else None,
        "has_more": has_more,
        "filtered": filtered,
        "total_unfiltered": total_unfiltered,
    })


MAX_COMPARED = 3


def _parse_session_ids(raw: str) -> list[uuid.UUID]:
    parts = [p.strip() for p in raw.split(",") if p.strip()]
    if not parts:
        raise ValidationFailed("Pick at least one session to compare.",
                               fields={"sessions": "required"})
    if len(parts) > MAX_COMPARED:
        raise ValidationFailed(
            f"Compare at most {MAX_COMPARED} sessions at a time.",
            fields={"sessions": f"{len(parts)} given"},
        )
    try:
        return [uuid.UUID(p) for p in parts]
    except ValueError as exc:
        raise ValidationFailed("That is not a session id.",
                               fields={"sessions": raw[:60]}) from exc


@router.get("/history/compare", response_model=Envelope[ComparisonOut])
async def compare_sessions(
    user: CurrentUser,
    db: DbSession,
    sessions: Annotated[str, Query(max_length=200)],
):
    """F-06, and the primitive G6's charts reuse (**H5.2**).

    Every number defers to `app.domain.training`. A `SUM(load_kg * reps)` here
    would be a second definition of volume, and AC-06 requires E-08, F-03 and
    G-02 to agree — which they can only do while there is one definition.
    """
    ids = _parse_session_ids(sessions)

    rows = (await db.scalars(
        select(WorkoutSession)
        .where(WorkoutSession.user_id == user.id, WorkoutSession.id.in_(ids))
        .options(
            selectinload(WorkoutSession.exercises).selectinload(SessionExercise.sets)
        )
    )).all()
    found = {r.id for r in rows}
    if missing := [i for i in ids if i not in found]:
        # 404 and not an empty comparison: silently dropping a session the caller
        # named would render F-06 with a column quietly missing.
        raise NotFound(f"{len(missing)} of those sessions could not be found.")

    ordered = sorted(rows, key=lambda r: r.started_at, reverse=True)

    session_out = []
    # exercise_id -> session_id -> cell
    grid: dict[uuid.UUID, dict[uuid.UUID, ComparisonCellOut]] = {}

    for session in ordered:
        counted = 0
        volume = 0.0
        for se in session.exercises:
            # Through the adapter: `load_kg` is Numeric, so the raw ORM rows
            # carry Decimal and the domain sums in float.
            sets = [domain_set(s) for s in se.sets]
            ex_volume = total_volume_kg(sets)
            records = evaluate_records(sets)
            # The heaviest PR-eligible set, which is what F-06 labels "best set".
            best = max(
                (s for s in sets if s.completed and s.set_type in ("working", "failure")
                 and s.load_kg is not None),
                key=lambda s: (s.load_kg, s.reps or 0),
                default=None,
            )
            working = [s for s in sets if s.completed and s.set_type != "warmup"]
            counted += len(working)
            volume += ex_volume
            grid.setdefault(se.exercise_id, {})[session.id] = ComparisonCellOut(
                session_id=session.id,
                volume_kg=ex_volume,
                set_count=len(working),
                max_load_kg=records.max_load_kg,
                best_set=BestSetOut(
                    load_kg=best.load_kg,
                    reps=best.reps,
                    e1rm_kg=estimated_1rm_kg(best.load_kg, best.reps),
                ) if best is not None else None,
            )

        session_out.append(ComparisonSessionOut(
            id=session.id,
            local_date=session.local_date,
            started_at=session.started_at,
            total_volume_kg=volume,
            set_count=counted,
            duration_seconds=session.duration_seconds,
        ))

    names = dict((await db.execute(
        select(Exercise.id, Exercise.name).where(Exercise.id.in_(list(grid) or [None]))
    )).all())

    exercises = [
        ComparisonRowOut(
            exercise_id=exercise_id,
            exercise_name=names.get(exercise_id),
            # A cell for EVERY compared session, so the columns line up even
            # where the exercise is absent.
            per_session=[
                cells.get(s.id, ComparisonCellOut(session_id=s.id))
                for s in ordered
            ],
        ).model_dump(mode="json")
        for exercise_id, cells in grid.items()
    ]

    return ok(ComparisonOut(
        sessions=session_out, exercises=exercises
    ).model_dump(mode="json"))
