"""Session lifecycle and derived metrics.

The formulas come from app.domain.training — the same definitions the mobile client
mirrors in TypeScript, pinned by contracts/vectors/domain.json. Nothing here
re-implements a formula.
"""
from __future__ import annotations

import uuid
from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.domain.training import (
    E1RM_FORMULA_VERSION,
    estimated_1rm_kg,
    evaluate_records,
    set_volume_kg,
)
from app.domain.training import (
    WorkoutSet as DomainSet,
)
from app.models import (
    PersonalRecord,
    RecordType,
    SessionExercise,
    SessionStatus,
    SetType,
    UserProfile,
    WorkoutSession,
    WorkoutSet,
)

SESSION_LOAD = (
    selectinload(WorkoutSession.exercises).selectinload(SessionExercise.sets),
)


def to_domain(s: WorkoutSet) -> DomainSet:
    return DomainSet(
        set_type=s.set_type.value if hasattr(s.set_type, "value") else str(s.set_type),
        load_kg=float(s.load_kg) if s.load_kg is not None else None,
        reps=s.reps,
        completed=s.completed,
        duration_seconds=s.duration_seconds,
        distance_m=float(s.distance_m) if s.distance_m is not None else None,
    )


async def load_session(db: AsyncSession, session_id: uuid.UUID) -> WorkoutSession | None:
    return await db.scalar(
        select(WorkoutSession)
        .where(WorkoutSession.id == session_id)
        .options(*SESSION_LOAD)
        .execution_options(populate_existing=True)
    )


async def densify_set_indices(db: AsyncSession, session_exercise_id: uuid.UUID) -> None:
    """set_index must stay dense and 0-based after a delete (W04.6)."""
    rows = (await db.scalars(
        select(WorkoutSet)
        .where(WorkoutSet.session_exercise_id == session_exercise_id)
        .order_by(WorkoutSet.set_index)
    )).all()
    for i, s in enumerate(rows):
        if s.set_index != i:
            s.set_index = i
    await db.flush()


def annotate_set(s: WorkoutSet) -> None:
    """Store e1RM WITH its formula version, so history stays reproducible if the
    default formula ever changes (BRD §10)."""
    load = float(s.load_kg) if s.load_kg is not None else None
    value = estimated_1rm_kg(load, s.reps)
    if value is not None and s.set_type != SetType.warmup and s.completed:
        s.e1rm_kg = round(value, 2)
        s.formula_version = E1RM_FORMULA_VERSION
    else:
        s.e1rm_kg = None
        s.formula_version = None


async def recompute_records_for_exercise(
    db: AsyncSession, user_id: uuid.UUID, exercise_id: uuid.UUID
) -> dict[str, float]:
    """FULL re-scan of that user+exercise's completed sets.

    Deliberately not incremental: a record can be *demoted* when a session is edited
    or deleted, and an incremental update can only ever raise one.

    The four record types are NOT all the same shape. max_load, max_reps and e1RM are
    per-SET bests, so a scan of every set answers them. Volume is a per-SESSION best —
    summing every set ever performed would produce lifetime volume, a number that only
    ever goes up and is therefore not a record at all. So the scan groups by session
    and takes the best session.
    """
    rows = (await db.execute(
        select(WorkoutSet, SessionExercise.session_id)
        .join(SessionExercise, SessionExercise.id == WorkoutSet.session_exercise_id)
        .join(WorkoutSession, WorkoutSession.id == SessionExercise.session_id)
        .where(
            WorkoutSession.user_id == user_id,
            SessionExercise.exercise_id == exercise_id,
            WorkoutSession.status == SessionStatus.completed,
        )
    )).all()

    by_session: dict[uuid.UUID, list[DomainSet]] = {}
    for workout_set, session_id in rows:
        by_session.setdefault(session_id, []).append(to_domain(workout_set))

    per_session = [evaluate_records(sets) for sets in by_session.values()]
    loads = [r.max_load_kg for r in per_session if r.max_load_kg is not None]
    reps = [r.max_reps for r in per_session if r.max_reps is not None]
    e1rms = [r.estimated_1rm_kg for r in per_session if r.estimated_1rm_kg is not None]
    volumes = [r.volume_kg for r in per_session if r.volume_kg > 0]

    wanted: dict[RecordType, tuple[float | None, str]] = {
        RecordType.max_load: (max(loads) if loads else None, "kg"),
        # Q3 (PRD §12): most reps in a single working set, regardless of load.
        RecordType.max_reps: (float(max(reps)) if reps else None, "reps"),
        RecordType.volume: (max(volumes) if volumes else None, "kg"),
        RecordType.estimated_1rm: (max(e1rms) if e1rms else None, "kg"),
    }

    existing = {
        r.record_type: r for r in (await db.scalars(
            select(PersonalRecord).where(
                PersonalRecord.user_id == user_id, PersonalRecord.exercise_id == exercise_id
            )
        )).all()
    }

    improved: dict[str, float] = {}
    now = datetime.now(UTC)
    for rtype, (value, unit) in wanted.items():
        current = existing.get(rtype)
        if value is None:
            if current is not None:
                await db.delete(current)      # the record was demoted away entirely
            continue
        value = round(float(value), 2)
        if current is None:
            db.add(PersonalRecord(
                user_id=user_id, exercise_id=exercise_id, record_type=rtype,
                value=value, unit=unit, achieved_at=now,
            ))
            improved[rtype.value] = value
        elif float(current.value) != value:
            if value > float(current.value):
                improved[rtype.value] = value
            current.value = value
            current.unit = unit
            current.achieved_at = now
    await db.flush()
    return improved


async def finish_session(db: AsyncSession, session: WorkoutSession) -> dict:
    """Runs INSIDE the caller's transaction so the summary screen is correct
    immediately, rather than after a background job catches up."""
    now = datetime.now(UTC)
    session.status = SessionStatus.completed
    session.completed_at = now
    session.duration_seconds = max(0, int((now - session.started_at).total_seconds()))

    # K-04 / D6 — the stored total follows the user's current preference, and
    # `services.volume.recount` restates it if they change their mind.
    include_warmups = bool(await db.scalar(
        select(UserProfile.warmups_in_volume).where(UserProfile.user_id == session.user_id)
    ))
    total = 0.0
    for se in session.exercises:
        for s in se.sets:
            annotate_set(s)
            total += set_volume_kg(to_domain(s), include_warmups=include_warmups)
    session.total_volume_kg = round(total, 2)
    await db.flush()

    prs: dict[uuid.UUID, dict[str, float]] = {}
    for exercise_id in {se.exercise_id for se in session.exercises}:
        improved = await recompute_records_for_exercise(db, session.user_id, exercise_id)
        if improved:
            prs[exercise_id] = improved

    # Flag the individual sets that set a record, so history can badge them
    # without recomputing (BRD §9 is_pr).
    for se in session.exercises:
        if se.exercise_id not in prs:
            continue
        best = prs[se.exercise_id]
        for s in se.sets:
            if s.set_type == SetType.warmup or not s.completed:
                continue
            load = float(s.load_kg) if s.load_kg is not None else None
            if (
                (load is not None and best.get("max_load") == round(load, 2))
                or (s.reps is not None and best.get("max_reps") == float(s.reps))
                or (s.e1rm_kg is not None and best.get("estimated_1rm") == float(s.e1rm_kg))
            ):
                s.is_pr = True
    await db.flush()
    return {"total_volume_kg": session.total_volume_kg, "records": prs}
