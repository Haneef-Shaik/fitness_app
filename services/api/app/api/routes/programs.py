"""Plan tree API. Everything here writes ONLY to the plan tree — a logged session
is never touched, which is what makes AC-12 hold."""
from __future__ import annotations

import uuid

from fastapi import APIRouter
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload

from app.api.deps import CurrentUser, DbSession, authorize
from app.api.envelope import ok
from app.core.errors import Conflict, NotFound, ValidationFailed
from app.models import (
    Exercise,
    PlanExercise,
    ProgramStatus,
    WorkoutPlanDay,
    WorkoutProgram,
    WorkoutSession,
)
from app.schemas.envelope import DeletedOut, Envelope, PagedEnvelope
from app.schemas.programs import (
    PlanDayIn,
    PlanDayOut,
    PlanDayPatch,
    PlanExerciseIn,
    PlanExerciseOut,
    ProgramIn,
    ProgramOut,
    ProgramPatch,
    ProgramTemplateOut,
    TemplateDayOut,
)
from app.seed.program_templates import BY_KEY, TEMPLATES

router = APIRouter(tags=["programs"])

def _ex_out(pe: PlanExercise, names: dict[uuid.UUID, str]) -> dict:
    # Validated from the ORM object rather than field-by-field. The hand-written
    # version silently dropped every column added after it was written — m4's
    # duration and distance targets reached the database and never reached the
    # client, and nothing failed until a test asked for them.
    out = PlanExerciseOut.model_validate(pe)
    out.exercise_name = names.get(pe.exercise_id)
    return out.model_dump(mode="json")


async def _serialise(db: DbSession, p: WorkoutProgram) -> dict:
    ids = {pe.exercise_id for d in p.days for pe in d.exercises}
    names: dict[uuid.UUID, str] = {}
    if ids:
        names = dict((await db.execute(
            select(Exercise.id, Exercise.name).where(Exercise.id.in_(ids))
        )).all())
    return ProgramOut(
        id=p.id, name=p.name, description=p.description,
        status=p.status.value if hasattr(p.status, "value") else str(p.status),
        days=[
            PlanDayOut(
                id=d.id, day_index=d.day_index, name=d.name,
                scheduled_weekday=d.scheduled_weekday, notes=d.notes,
                exercises=[_ex_out(pe, names) for pe in d.exercises],
            )
            for d in p.days
        ],
    ).model_dump(mode="json")


async def _load_program(db: DbSession, program_id: uuid.UUID) -> WorkoutProgram:
    # populate_existing: without it the identity map hands back the object as it was
    # loaded earlier in this request, so a day or prescription added since is missing.
    p = await db.scalar(
        select(WorkoutProgram)
        .where(WorkoutProgram.id == program_id)
        .options(selectinload(WorkoutProgram.days).selectinload(WorkoutPlanDay.exercises))
        .execution_options(populate_existing=True)
    )
    if p is None:
        raise NotFound("That program no longer exists.")
    return p


async def _load_day(db: DbSession, day_id: uuid.UUID) -> WorkoutPlanDay:
    d = await db.scalar(
        select(WorkoutPlanDay)
        .where(WorkoutPlanDay.id == day_id)
        .options(
            selectinload(WorkoutPlanDay.exercises),
            selectinload(WorkoutPlanDay.program),
        )
        .execution_options(populate_existing=True)
    )
    if d is None:
        raise NotFound("That plan day no longer exists.")
    return d


# ---------------- programs ----------------

@router.get("/workout-programs", response_model=PagedEnvelope[list[ProgramOut]])
async def list_programs(user: CurrentUser, db: DbSession, status: str | None = None):
    stmt = (
        select(WorkoutProgram)
        .where(WorkoutProgram.user_id == user.id)
        .options(selectinload(WorkoutProgram.days).selectinload(WorkoutPlanDay.exercises))
    )
    if status:
        stmt = stmt.where(WorkoutProgram.status == status)
    rows = (await db.scalars(stmt.order_by(WorkoutProgram.created_at.desc()))).all()
    return ok([await _serialise(db, p) for p in rows], meta={"total": len(rows)})


@router.post("/workout-programs", status_code=201, response_model=Envelope[ProgramOut])
async def create_program(body: ProgramIn, user: CurrentUser, db: DbSession):
    p = WorkoutProgram(user_id=user.id, **body.model_dump())
    db.add(p)
    await db.flush()
    return ok(await _serialise(db, await _load_program(db, p.id)), status_code=201)


@router.get("/workout-programs/{program_id}", response_model=Envelope[ProgramOut])
async def get_program(program_id: uuid.UUID, user: CurrentUser, db: DbSession):
    p = await _load_program(db, program_id)
    authorize(user, "read", p.user_id)
    return ok(await _serialise(db, p))


@router.patch("/workout-programs/{program_id}", response_model=Envelope[ProgramOut])
async def patch_program(
    program_id: uuid.UUID, body: ProgramPatch, user: CurrentUser, db: DbSession
):
    p = await _load_program(db, program_id)
    authorize(user, "update", p.user_id)
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(p, k, v)
    await db.flush()
    return ok(await _serialise(db, await _load_program(db, p.id)))


@router.post("/workout-programs/{program_id}/duplicate", status_code=201, response_model=Envelope[ProgramOut])
async def duplicate_program(program_id: uuid.UUID, user: CurrentUser, db: DbSession):
    """Deep copy. Every day and prescription gets a NEW id, so later edits to the
    copy cannot reach back into the original."""
    src = await _load_program(db, program_id)
    authorize(user, "read", src.user_id)

    copy = WorkoutProgram(
        user_id=user.id, name=f"{src.name} (copy)", description=src.description
    )
    db.add(copy)
    await db.flush()

    for day in src.days:
        new_day = WorkoutPlanDay(
            program_id=copy.id, day_index=day.day_index, name=day.name,
            scheduled_weekday=day.scheduled_weekday, notes=day.notes,
        )
        db.add(new_day)
        await db.flush()
        for pe in day.exercises:
            db.add(PlanExercise(
                plan_day_id=new_day.id, exercise_id=pe.exercise_id,
                order_index=pe.order_index, target_sets=pe.target_sets,
                target_reps_min=pe.target_reps_min, target_reps_max=pe.target_reps_max,
                target_load=pe.target_load, load_unit=pe.load_unit,
                rest_seconds=pe.rest_seconds,
            ))
    await db.flush()
    return ok(await _serialise(db, await _load_program(db, copy.id)), status_code=201)


@router.post("/workout-programs/{program_id}/archive", response_model=Envelope[ProgramOut])
async def archive_program(program_id: uuid.UUID, user: CurrentUser, db: DbSession):
    p = await _load_program(db, program_id)
    authorize(user, "update", p.user_id)
    p.status = ProgramStatus.archived
    # Archiving clears the schedule, otherwise the dashboard keeps proposing a
    # workout from a program the user has put away.
    for d in p.days:
        d.scheduled_weekday = None
    await db.flush()
    return ok(await _serialise(db, await _load_program(db, p.id)))


@router.delete("/workout-programs/{program_id}", response_model=Envelope[DeletedOut])
async def delete_program(program_id: uuid.UUID, user: CurrentUser, db: DbSession):
    """Hard delete, and ONLY when nothing references it. A program used by any
    session must be archived instead — BRD §7 soft-delete principle."""
    p = await _load_program(db, program_id)
    authorize(user, "delete", p.user_id)

    day_ids = [d.id for d in p.days]
    used = 0
    if day_ids:
        used = await db.scalar(
            select(func.count()).select_from(WorkoutSession)
            .where(WorkoutSession.plan_day_id.in_(day_ids))
        ) or 0
    if used:
        raise Conflict(
            f"Used by {used} session{'s' if used != 1 else ''} — archive it instead."
        )
    await db.delete(p)
    await db.flush()
    return ok({"deleted": True})


# ---------------- plan days ----------------

@router.post("/workout-programs/{program_id}/days", status_code=201, response_model=Envelope[ProgramOut])
async def create_day(
    program_id: uuid.UUID, body: PlanDayIn, user: CurrentUser, db: DbSession
):
    p = await _load_program(db, program_id)
    authorize(user, "update", p.user_id)
    next_index = max((d.day_index for d in p.days), default=-1) + 1
    day = WorkoutPlanDay(program_id=p.id, day_index=next_index, **body.model_dump())
    db.add(day)
    await db.flush()
    return ok(await _serialise(db, await _load_program(db, p.id)), status_code=201)


@router.patch("/plan-days/{day_id}", response_model=Envelope[ProgramOut])
async def patch_day(day_id: uuid.UUID, body: PlanDayPatch, user: CurrentUser, db: DbSession):
    day = await _load_day(db, day_id)
    authorize(user, "update", day.program.user_id)
    changes = body.model_dump(exclude_unset=True)
    if changes.pop("clear_schedule", False):
        day.scheduled_weekday = None
        changes.pop("scheduled_weekday", None)
    for k, v in changes.items():
        setattr(day, k, v)
    await db.flush()
    return ok(await _serialise(db, await _load_program(db, day.program_id)))


@router.delete("/plan-days/{day_id}", response_model=Envelope[ProgramOut])
async def delete_day(day_id: uuid.UUID, user: CurrentUser, db: DbSession):
    """Allowed even when sessions used it — those sessions are self-describing and
    keep their records; plan_day_id simply becomes NULL."""
    day = await _load_day(db, day_id)
    authorize(user, "delete", day.program.user_id)
    program_id = day.program_id
    await db.delete(day)
    await db.flush()

    # Keep day_index dense so the UI never shows a gap.
    remaining = (await db.scalars(
        select(WorkoutPlanDay).where(WorkoutPlanDay.program_id == program_id)
        .order_by(WorkoutPlanDay.day_index)
    )).all()
    for i, d in enumerate(remaining):
        d.day_index = i
    await db.flush()
    return ok(await _serialise(db, await _load_program(db, program_id)))


@router.put("/plan-days/{day_id}/exercises", response_model=Envelope[ProgramOut])
async def set_day_exercises(
    day_id: uuid.UUID, body: list[PlanExerciseIn], user: CurrentUser, db: DbSession
):
    """Bulk replace + reorder in ONE transaction, so an ordering change can never
    half-apply. order_index is assigned from list position — dense and 0-based."""
    day = await _load_day(db, day_id)
    authorize(user, "update", day.program.user_id)

    ids = {e.exercise_id for e in body}
    if ids:
        found = set((await db.scalars(select(Exercise.id).where(Exercise.id.in_(ids)))).all())
        if missing := ids - found:
            raise ValidationFailed(
                "One of those exercises does not exist.",
                fields={"exercises": ", ".join(str(m) for m in missing)},
            )

    for pe in list(day.exercises):
        await db.delete(pe)
    await db.flush()

    for position, item in enumerate(body):
        db.add(PlanExercise(plan_day_id=day.id, order_index=position, **item.model_dump()))
    await db.flush()
    return ok(await _serialise(db, await _load_program(db, day.program_id)))


# ------------------------------------------------------------ starter programs


@router.get("/program-templates", response_model=Envelope[list[ProgramTemplateOut]])
async def list_program_templates(user: CurrentUser):
    """C-01 "Browse starter programs" and C-04 "Start from a template"."""
    return ok([
        ProgramTemplateOut(
            key=t.key, name=t.name, summary=t.summary, level=t.level,
            days_per_week=len(t.days),
            days=[TemplateDayOut(name=d.name, scheduled_weekday=d.weekday,
                                 exercises=[e.name for e in d.exercises]) for d in t.days],
        ).model_dump(mode="json")
        for t in TEMPLATES
    ])


@router.post("/program-templates/{key}/start", status_code=201, response_model=Envelope[ProgramOut])
async def start_program_template(key: str, user: CurrentUser, db: DbSession):
    """Deep-copies a template into the user's own programs. Every day and
    prescription is new, so editing the copy never reaches the template."""
    tpl = BY_KEY.get(key)
    if tpl is None:
        raise NotFound("That starter program does not exist.")

    names = {e.name for d in tpl.days for e in d.exercises}
    by_name = dict((await db.execute(
        select(Exercise.name, Exercise.id)
        .where(Exercise.owner_user_id.is_(None), Exercise.name.in_(names))
    )).all())
    missing = names - by_name.keys()
    if missing:
        # The template test makes this unreachable; if it is reached anyway, a
        # half-built program is worse than a clear failure.
        raise ValidationFailed(f"Starter program references unknown exercises: {sorted(missing)}")

    program = WorkoutProgram(user_id=user.id, name=tpl.name, description=tpl.summary)
    db.add(program)
    await db.flush()
    for i, d in enumerate(tpl.days):
        day = WorkoutPlanDay(program_id=program.id, day_index=i, name=d.name,
                             scheduled_weekday=d.weekday)
        db.add(day)
        await db.flush()
        for j, e in enumerate(d.exercises):
            db.add(PlanExercise(
                plan_day_id=day.id, exercise_id=by_name[e.name], order_index=j,
                target_sets=e.sets, target_reps_min=e.reps_min, target_reps_max=e.reps_max,
                target_duration_seconds=e.duration_seconds, rest_seconds=e.rest_seconds,
            ))
    await db.flush()
    return ok(await _serialise(db, await _load_program(db, program.id)), status_code=201)
