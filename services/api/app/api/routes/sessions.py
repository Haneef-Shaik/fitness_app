"""The PERFORMED tree API — the logger's server half.

Two rules shape everything here:

1. **Nothing in this module reads live plan data to render history.** The prescription
   is snapshotted into `target_snapshot` at start. Editing a program afterwards cannot
   change what a past session says (AC-12).
2. **Every set write is idempotent.** The logger commits locally and flushes later, so
   the same write arrives more than once as a matter of course, not as an exception.
"""
from __future__ import annotations

import uuid
from datetime import UTC, datetime, timedelta
from typing import Annotated

from fastapi import APIRouter, Header, Query
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import selectinload

from app.api.deps import CurrentUser, DbSession, authorize
from app.api.envelope import ok
from app.core.errors import Conflict, NotFound, ValidationFailed
from app.domain.dates import to_local_date
from app.models import (
    Exercise,
    PersonalRecord,
    PlanExercise,
    SessionExercise,
    SessionStatus,
    SetType,
    User,
    UserProfile,
    WorkoutPlanDay,
    WorkoutSession,
    WorkoutSet,
)
from app.schemas.envelope import DeletedOut, Envelope, PagedEnvelope
from app.schemas.sessions import (
    PreviousPerformanceOut,
    RecordEntryOut,
    SessionExerciseIn,
    SessionExerciseOut,
    SessionFinishOut,
    SessionOut,
    SessionStart,
    SetBatchOut,
    SetIn,
    SetOut,
)
from app.services.sessions import (
    annotate_set,
    densify_set_indices,
    finish_session,
    load_session,
)

router = APIRouter(tags=["sessions"])

# A phone clock can sit a little ahead of the server's. Rejecting on the exact
# second would bounce honest writes, so T9 is enforced with a tolerance.
CLOCK_SKEW = timedelta(minutes=5)


def _enum(v) -> str:
    return v.value if hasattr(v, "value") else str(v)


def _num(v) -> float | None:
    return float(v) if v is not None else None


async def _timezone_of(db: DbSession, user_id: uuid.UUID) -> str:
    tz = await db.scalar(select(UserProfile.timezone).where(UserProfile.user_id == user_id))
    return tz or "UTC"


def _set_out(s: WorkoutSet) -> dict:
    return SetOut(
        id=s.id, client_id=s.client_id, set_index=s.set_index, set_type=_enum(s.set_type),
        reps=s.reps, load_kg=_num(s.load_kg), duration_seconds=s.duration_seconds,
        distance_m=_num(s.distance_m), rpe=_num(s.rpe), rir=_num(s.rir),
        completed=s.completed, performed_at=s.performed_at,
        load_unit_entered=s.load_unit_entered, e1rm_kg=_num(s.e1rm_kg),
        formula_version=s.formula_version, is_pr=s.is_pr, note=s.note,
    ).model_dump(mode="json")


async def _serialise(db: DbSession, s: WorkoutSession) -> dict:
    ids = {se.exercise_id for se in s.exercises}
    names: dict[uuid.UUID, str] = {}
    if ids:
        names = dict((await db.execute(
            select(Exercise.id, Exercise.name).where(Exercise.id.in_(ids))
        )).all())
    return SessionOut(
        id=s.id, plan_day_id=s.plan_day_id, status=_enum(s.status),
        started_at=s.started_at, completed_at=s.completed_at,
        local_date=s.local_date, logged_timezone=s.logged_timezone, notes=s.notes,
        total_volume_kg=_num(s.total_volume_kg), duration_seconds=s.duration_seconds,
        exercises=[
            SessionExerciseOut(
                id=se.id, exercise_id=se.exercise_id,
                exercise_name=names.get(se.exercise_id), order_index=se.order_index,
                notes=se.notes, skipped=se.skipped, target_snapshot=se.target_snapshot,
                sets=[_set_out(x) for x in se.sets],
            )
            for se in s.exercises
        ],
    ).model_dump(mode="json")


async def _owned_session(db: DbSession, session_id: uuid.UUID, user: User, action: str):
    s = await load_session(db, session_id)
    if s is None:
        raise NotFound("That session no longer exists.")
    authorize(user, action, s.user_id)
    return s


async def _owned_session_exercise(db: DbSession, se_id: uuid.UUID, user: User, action: str):
    se = await db.scalar(
        select(SessionExercise)
        .where(SessionExercise.id == se_id)
        .options(selectinload(SessionExercise.session), selectinload(SessionExercise.sets))
        .execution_options(populate_existing=True)
    )
    if se is None:
        raise NotFound("That exercise is not part of a session any more.")
    authorize(user, action, se.session.user_id)
    return se


def _snapshot(pe: PlanExercise) -> dict:
    """What the user was ASKED to do, frozen. Read by the logger to show targets and
    by history to show plan-vs-performed, neither of which re-reads the plan."""
    return {
        "target_sets": pe.target_sets,
        "target_reps_min": pe.target_reps_min,
        "target_reps_max": pe.target_reps_max,
        "target_load": _num(pe.target_load),
        "load_unit": pe.load_unit,
        "rest_seconds": pe.rest_seconds,
        "plan_exercise_id": str(pe.id),
    }


# ----------------------------------------------------------------- sessions

@router.post("/workout-sessions", status_code=201, response_model=Envelope[SessionOut])
async def start_session(body: SessionStart, user: CurrentUser, db: DbSession):
    """4.1 — start from a plan day, a repeat of an earlier session, an ad-hoc list,
    or nothing at all. Backdating is allowed (T9); the future is not."""
    sources = [body.plan_day_id, body.repeat_session_id, body.exercise_ids]
    if sum(1 for s in sources if s) > 1:
        raise ValidationFailed("Start a session from one source at a time.")

    started_at = body.started_at or datetime.now(UTC)
    if started_at.tzinfo is None:
        started_at = started_at.replace(tzinfo=UTC)
    if started_at > datetime.now(UTC) + CLOCK_SKEW:
        raise ValidationFailed(
            "A workout cannot be logged in the future.", fields={"started_at": "Pick today or earlier."}
        )

    # C1 — surface the open session's id so E-01 can offer finish or discard rather
    # than leaving the user stuck behind a refusal.
    open_id = await db.scalar(
        select(WorkoutSession.id).where(
            WorkoutSession.user_id == user.id,
            WorkoutSession.status == SessionStatus.in_progress,
        )
    )
    if open_id is not None:
        raise Conflict(
            "You already have a workout in progress.",
            fields={"active_session_id": str(open_id)},
        )

    tz = await _timezone_of(db, user.id)
    session = WorkoutSession(
        user_id=user.id, plan_day_id=body.plan_day_id, started_at=started_at,
        status=SessionStatus.in_progress, notes=body.notes,
        local_date=to_local_date(started_at, tz), logged_timezone=tz,
    )
    db.add(session)
    try:
        await db.flush()
    except IntegrityError as exc:
        # The partial unique index is the real guard; the check above is only the
        # friendly path. Two devices racing land here.
        raise Conflict("You already have a workout in progress.") from exc

    if body.plan_day_id:
        day = await db.scalar(
            select(WorkoutPlanDay)
            .where(WorkoutPlanDay.id == body.plan_day_id)
            .options(
                selectinload(WorkoutPlanDay.exercises),
                selectinload(WorkoutPlanDay.program),
            )
        )
        if day is None:
            raise NotFound("That plan day no longer exists.")
        authorize(user, "read", day.program.user_id)
        for i, pe in enumerate(day.exercises):
            db.add(SessionExercise(
                session_id=session.id, exercise_id=pe.exercise_id, order_index=i,
                plan_exercise_id=pe.id, target_snapshot=_snapshot(pe),
            ))

    elif body.repeat_session_id:
        prev = await _owned_session(db, body.repeat_session_id, user, "read")
        for i, se in enumerate(prev.exercises):
            db.add(SessionExercise(
                session_id=session.id, exercise_id=se.exercise_id, order_index=i,
                target_snapshot=se.target_snapshot,
            ))

    elif body.exercise_ids:
        found = set((await db.scalars(
            select(Exercise.id).where(Exercise.id.in_(body.exercise_ids))
        )).all())
        if missing := set(body.exercise_ids) - found:
            raise ValidationFailed(
                "One of those exercises does not exist.",
                fields={"exercise_ids": ", ".join(str(m) for m in missing)},
            )
        for i, ex_id in enumerate(body.exercise_ids):
            db.add(SessionExercise(session_id=session.id, exercise_id=ex_id, order_index=i))

    await db.flush()
    return ok(await _serialise(db, await load_session(db, session.id)), status_code=201)


@router.get("/workout-sessions/active", response_model=Envelope[SessionOut])
async def get_active(user: CurrentUser, db: DbSession):
    """4.2 — the logger asks this on every cold start. `null` is a valid answer, not
    a 404: "no workout in progress" is a normal state, not an error."""
    sid = await db.scalar(
        select(WorkoutSession.id).where(
            WorkoutSession.user_id == user.id,
            WorkoutSession.status == SessionStatus.in_progress,
        )
    )
    if sid is None:
        return ok(None)
    return ok(await _serialise(db, await load_session(db, sid)))


@router.get("/workout-sessions", response_model=PagedEnvelope[list[SessionOut]])
async def list_sessions(
    user: CurrentUser, db: DbSession,
    limit: Annotated[int, Query(ge=1, le=100)] = 30,
    offset: Annotated[int, Query(ge=0)] = 0,
):
    """Cancelled sessions never appear — 4.7."""
    rows = (await db.scalars(
        select(WorkoutSession)
        .where(
            WorkoutSession.user_id == user.id,
            WorkoutSession.status == SessionStatus.completed,
        )
        .order_by(WorkoutSession.started_at.desc())
        .limit(limit).offset(offset)
    )).all()
    return ok([await _serialise(db, s) for s in rows], meta={"count": len(rows)})


@router.get("/workout-sessions/{session_id}", response_model=Envelope[SessionOut])
async def get_session(session_id: uuid.UUID, user: CurrentUser, db: DbSession):
    return ok(await _serialise(db, await _owned_session(db, session_id, user, "read")))


@router.post("/workout-sessions/{session_id}/exercises", status_code=201, response_model=Envelope[SessionOut])
async def add_exercise(
    session_id: uuid.UUID, body: SessionExerciseIn, user: CurrentUser, db: DbSession
):
    """Adding an exercise mid-session is the common case, not an edge case."""
    s = await _owned_session(db, session_id, user, "update")
    if s.status is not SessionStatus.in_progress:
        raise Conflict("That workout is finished. Reopen it to make changes.")
    if await db.scalar(select(Exercise.id).where(Exercise.id == body.exercise_id)) is None:
        raise NotFound("That exercise does not exist.")
    db.add(SessionExercise(
        session_id=s.id, exercise_id=body.exercise_id,
        order_index=max((se.order_index for se in s.exercises), default=-1) + 1,
    ))
    await db.flush()
    return ok(await _serialise(db, await load_session(db, s.id)), status_code=201)


# --------------------------------------------------------------------- sets

async def _upsert_set(
    db: DbSession, se: SessionExercise, body: SetIn, client_id: uuid.UUID
) -> tuple[WorkoutSet, bool]:
    """Returns (row, created). The idempotency contract: the SAME client_id always
    resolves to the SAME row, and a replay never appends."""
    existing = await db.scalar(
        select(WorkoutSet).where(
            WorkoutSet.session_exercise_id == se.id, WorkoutSet.client_id == client_id
        )
    )
    data = body.model_dump(exclude={"client_id", "performed_at", "set_type"})
    performed_at = body.performed_at or datetime.now(UTC)
    if performed_at.tzinfo is None:
        performed_at = performed_at.replace(tzinfo=UTC)

    if existing is not None:
        # A replay of an edited set still converges on one row.
        for k, v in data.items():
            setattr(existing, k, v)
        existing.set_type = SetType(body.set_type)
        annotate_set(existing)
        await db.flush()
        return existing, False

    next_index = await db.scalar(
        select(WorkoutSet.set_index)
        .where(WorkoutSet.session_exercise_id == se.id)
        .order_by(WorkoutSet.set_index.desc()).limit(1)
    )
    row = WorkoutSet(
        session_exercise_id=se.id, client_id=client_id,
        set_index=0 if next_index is None else next_index + 1,
        set_type=SetType(body.set_type), performed_at=performed_at, **data,
    )
    annotate_set(row)
    db.add(row)
    try:
        await db.flush()
    except IntegrityError as exc:
        # Two devices flushing the same client_id at once. The unique constraint is
        # the arbiter; the loser reports a conflict rather than duplicating the set.
        raise Conflict("That set was already saved from another device.") from exc
    return row, True


@router.post("/session-exercises/{se_id}/sets", status_code=201, response_model=Envelope[SetOut])
async def add_set(
    se_id: uuid.UUID, body: SetIn, user: CurrentUser, db: DbSession,
    idempotency_key: Annotated[uuid.UUID | None, Header(alias="Idempotency-Key")] = None,
):
    """4.3 — `Idempotency-Key` is MANDATORY. Without it a dropped response makes the
    client choose between a lost set and a duplicated one, and it will guess wrong."""
    client_id = idempotency_key or body.client_id
    if client_id is None:
        raise ValidationFailed(
            "This write needs an Idempotency-Key.",
            fields={"Idempotency-Key": "Send a UUID so a retry cannot duplicate the set."},
        )
    se = await _owned_session_exercise(db, se_id, user, "update")
    if se.session.status is not SessionStatus.in_progress:
        raise Conflict("That workout is finished. Reopen it to make changes.")

    row, created = await _upsert_set(db, se, body, client_id)
    return ok(_set_out(row), status_code=201 if created else 200)


@router.post("/workout-sessions/{session_id}/sets/batch", response_model=PagedEnvelope[SetBatchOut])
async def flush_sets(
    session_id: uuid.UUID, body: list[dict], user: CurrentUser, db: DbSession
):
    """4.5 — the offline outbox flush. Idempotent PER SET, so a partially-delivered
    batch can be resent whole. Each item is {session_exercise_id, ...SetIn}."""
    s = await _owned_session(db, session_id, user, "update")
    if s.status is not SessionStatus.in_progress:
        raise Conflict("That workout is finished. Reopen it to make changes.")
    by_id = {se.id: se for se in s.exercises}

    results: list[dict] = []
    for item in body:
        payload = dict(item)
        raw_se = payload.pop("session_exercise_id", None)
        raw_client = payload.get("client_id")
        try:
            se_id = uuid.UUID(str(raw_se))
            client_id = uuid.UUID(str(raw_client))
            parsed = SetIn.model_validate(payload)
        except (ValueError, TypeError) as exc:
            # One malformed item must not strand the rest of the queue on the device.
            results.append({"client_id": raw_client, "accepted": False, "error": str(exc)[:200]})
            continue
        if se_id not in by_id:
            results.append({
                "client_id": str(client_id), "accepted": False,
                "error": "That exercise is not part of this session.",
            })
            continue
        row, created = await _upsert_set(db, by_id[se_id], parsed, client_id)
        results.append({
            "client_id": str(client_id), "accepted": True,
            "created": created, "set": _set_out(row),
        })

    await db.flush()
    return ok({"results": results}, meta={"accepted": sum(1 for r in results if r["accepted"])})


@router.patch("/workout-sets/{set_id}", response_model=Envelope[SetOut])
async def patch_set(set_id: uuid.UUID, body: dict, user: CurrentUser, db: DbSession):
    """4.4 — editing re-derives e1RM from the new numbers in the same transaction, so
    the row is never briefly inconsistent with its own values."""
    row = await db.scalar(select(WorkoutSet).where(WorkoutSet.id == set_id))
    if row is None:
        raise NotFound("That set no longer exists.")
    se = await _owned_session_exercise(db, row.session_exercise_id, user, "update")

    from app.schemas.sessions import SetPatch
    changes = SetPatch.model_validate(body).model_dump(exclude_unset=True)
    merged = {
        "reps": changes.get("reps", row.reps),
        "duration_seconds": changes.get("duration_seconds", row.duration_seconds),
        "distance_m": changes.get("distance_m", _num(row.distance_m)),
    }
    if all(v is None for v in merged.values()):
        raise ValidationFailed("Add reps, time or distance to save this set.")

    for k, v in changes.items():
        setattr(row, k, SetType(v) if k == "set_type" else v)
    annotate_set(row)
    await db.flush()

    if se.session.status is SessionStatus.completed:
        # W06.6 — a retroactive edit must recompute, or the summary silently drifts.
        await finish_session(db, await load_session(db, se.session_id))
    return ok(_set_out(row))


@router.delete("/workout-sets/{set_id}", response_model=Envelope[DeletedOut])
async def delete_set(set_id: uuid.UUID, user: CurrentUser, db: DbSession):
    """4.4 — delete and re-densify in ONE transaction. A gap in set_index would show
    as "Set 1, Set 3" in the logger."""
    row = await db.scalar(select(WorkoutSet).where(WorkoutSet.id == set_id))
    if row is None:
        raise NotFound("That set no longer exists.")
    se = await _owned_session_exercise(db, row.session_exercise_id, user, "delete")
    se_id = row.session_exercise_id

    await db.delete(row)
    await db.flush()
    await densify_set_indices(db, se_id)

    if se.session.status is SessionStatus.completed:
        await finish_session(db, await load_session(db, se.session_id))
    return ok({"deleted": True})


# --------------------------------------------------------------- lifecycle

@router.post("/workout-sessions/{session_id}/finish", response_model=Envelope[SessionFinishOut])
async def finish(session_id: uuid.UUID, user: CurrentUser, db: DbSession):
    """4.6 — volume, e1RM and PR evaluation run INSIDE this transaction, so the
    summary screen the user lands on is already correct."""
    s = await _owned_session(db, session_id, user, "update")
    if s.status is SessionStatus.completed:
        raise Conflict("That workout is already finished.")
    if s.status is SessionStatus.cancelled:
        raise Conflict("That workout was discarded.")

    summary = await finish_session(db, s)
    payload = await _serialise(db, await load_session(db, s.id))

    names = dict((await db.execute(
        select(Exercise.id, Exercise.name).where(Exercise.id.in_(summary["records"].keys()))
    )).all()) if summary["records"] else {}
    payload["records"] = [
        {
            "exercise_id": str(ex_id), "exercise_name": names.get(ex_id),
            "record_type": rtype, "value": value,
            "unit": "reps" if rtype == "max_reps" else "kg",
        }
        for ex_id, improved in summary["records"].items()
        for rtype, value in improved.items()
    ]
    return ok(payload)


@router.post("/workout-sessions/{session_id}/cancel", response_model=Envelope[SessionOut])
async def cancel(session_id: uuid.UUID, user: CurrentUser, db: DbSession):
    """4.7 — the rows are RETAINED. Discarding is about the session leaving history
    and analytics, not about destroying what the user typed."""
    s = await _owned_session(db, session_id, user, "update")
    if s.status is SessionStatus.completed:
        raise Conflict("That workout is already finished.")
    s.status = SessionStatus.cancelled
    s.completed_at = datetime.now(UTC)
    await db.flush()
    return ok(await _serialise(db, await load_session(db, s.id)))


@router.post("/workout-sessions/{session_id}/reopen", response_model=Envelope[SessionOut])
async def reopen(session_id: uuid.UUID, user: CurrentUser, db: DbSession):
    """W06.6 — "I forgot the last set". Refused while another session is open, so the
    partial unique index can never be violated."""
    s = await _owned_session(db, session_id, user, "update")
    if s.status is SessionStatus.in_progress:
        return ok(await _serialise(db, s))
    open_id = await db.scalar(
        select(WorkoutSession.id).where(
            WorkoutSession.user_id == user.id,
            WorkoutSession.status == SessionStatus.in_progress,
        )
    )
    if open_id is not None:
        raise Conflict(
            "Finish the workout you have open first.",
            fields={"active_session_id": str(open_id)},
        )
    s.status = SessionStatus.in_progress
    s.completed_at = None
    await db.flush()
    return ok(await _serialise(db, await load_session(db, s.id)))


# ------------------------------------------------------- previous performance

@router.get("/exercises/{exercise_id}/records", response_model=Envelope[dict[str, RecordEntryOut]])
async def exercise_records(exercise_id: uuid.UUID, user: CurrentUser, db: DbSession):
    """The four records the app shows on E-11 and G-04.

    `volume` is the best SINGLE SESSION, not a lifetime total — a number that only
    ever rises is not a record. See services.sessions.recompute_records_for_exercise.
    """
    rows = (await db.scalars(
        select(PersonalRecord).where(
            PersonalRecord.user_id == user.id, PersonalRecord.exercise_id == exercise_id
        )
    )).all()
    return ok({
        _enum(r.record_type): {
            "value": _num(r.value), "unit": r.unit,
            "achieved_at": r.achieved_at.isoformat(),
        }
        for r in rows
    })


@router.get("/exercises/{exercise_id}/previous-performance", response_model=Envelope[PreviousPerformanceOut])
async def previous_performance(
    exercise_id: uuid.UUID, user: CurrentUser, db: DbSession,
    before: Annotated[datetime | None, Query()] = None,
):
    """4.8 — what the logger shows under the entry pad: "last time you did 60 × 8".

    Resolves by PRD §7.2: most recent COMPLETED session of this user containing this
    exercise, ordered by completed_at desc. Cancelled and in-progress sessions are
    invisible here — comparing against a workout that was discarded is worse than
    showing nothing.
    """
    stmt = (
        select(WorkoutSession, SessionExercise)
        .join(SessionExercise, SessionExercise.session_id == WorkoutSession.id)
        .where(
            WorkoutSession.user_id == user.id,
            WorkoutSession.status == SessionStatus.completed,
            SessionExercise.exercise_id == exercise_id,
        )
        .order_by(WorkoutSession.completed_at.desc())
        .limit(1)
    )
    if before is not None:
        cutoff = before if before.tzinfo else before.replace(tzinfo=UTC)
        stmt = stmt.where(WorkoutSession.completed_at < cutoff)

    found = (await db.execute(stmt)).first()
    if found is None:
        # Not a 404 — "you have never done this exercise" is the first-time state the
        # logger renders as a prompt, not an error.
        return ok(None)

    session, se = found
    sets = (await db.scalars(
        select(WorkoutSet)
        .where(WorkoutSet.session_exercise_id == se.id)
        .order_by(WorkoutSet.set_index)
    )).all()
    best = await db.scalar(
        select(PersonalRecord.value).where(
            PersonalRecord.user_id == user.id,
            PersonalRecord.exercise_id == exercise_id,
            PersonalRecord.record_type == "estimated_1rm",
        )
    )
    return ok({
        "session_id": str(session.id),
        "local_date": session.local_date.isoformat(),
        "completed_at": session.completed_at.isoformat() if session.completed_at else None,
        "target_snapshot": se.target_snapshot,
        "best_e1rm_kg": _num(best),
        "sets": [_set_out(s) for s in sets],
    })
