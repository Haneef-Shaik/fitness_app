from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Query
from sqlalchemy import case, func, or_, select
from sqlalchemy.orm import selectinload

from app.api.deps import CurrentUser, DbSession
from app.api.envelope import ok
from app.core.errors import Forbidden, NotFound, ValidationFailed
from app.models import (
    CatalogStatus,
    Equipment,
    Exercise,
    ExerciseMuscle,
    MuscleGroup,
    MuscleRole,
)
from app.schemas.envelope import Envelope, PagedEnvelope
from app.schemas.exercises import (
    ExerciseIn,
    ExerciseOut,
    ExercisePatch,
    MuscleGroupOut,
    MuscleRefOut,
)

router = APIRouter(tags=["exercises"])


def _enum_value(v) -> str:
    """SQLAlchemy keeps a plain string until the row is refreshed, so accept both."""
    return v.value if hasattr(v, "value") else str(v)


def _serialise(ex: Exercise) -> dict:
    """Flattens the association rows: slug and name live on the joined muscle_group,
    so the ORM object cannot be coerced into the response shape directly."""
    return ExerciseOut(
        id=ex.id,
        name=ex.name,
        equipment=_enum_value(ex.equipment),
        movement_pattern=ex.movement_pattern,
        aliases=list(ex.aliases or []),
        is_custom=ex.is_custom,
        status=_enum_value(ex.status),
        tracks_load=ex.tracks_load,
        tracks_reps=ex.tracks_reps,
        tracks_duration=ex.tracks_duration,
        tracks_distance=ex.tracks_distance,
        default_unit=ex.default_unit,
        instructions=ex.instructions,
        muscles=[
            MuscleRefOut(
                id=em.muscle_group.id, slug=em.muscle_group.slug,
                name=em.muscle_group.name, role=_enum_value(em.role),
            )
            for em in sorted(ex.muscles, key=lambda m: (_enum_value(m.role), m.muscle_group.name))
        ],
    ).model_dump(mode="json")


async def _load(db: DbSession, exercise_id: uuid.UUID) -> Exercise:
    ex = await db.scalar(
        select(Exercise)
        .where(Exercise.id == exercise_id)
        .options(selectinload(Exercise.muscles).joinedload(ExerciseMuscle.muscle_group))
    )
    if ex is None:
        raise NotFound("That exercise no longer exists.")
    return ex


@router.get("/muscle-groups", response_model=Envelope[list[MuscleGroupOut]])
async def list_muscle_groups(user: CurrentUser, db: DbSession):
    rows = (await db.scalars(
        select(MuscleGroup).order_by(MuscleGroup.sort_order, MuscleGroup.name)
    )).all()
    return ok([MuscleGroupOut.model_validate(m).model_dump(mode="json") for m in rows])


@router.get("/exercises", response_model=PagedEnvelope[list[ExerciseOut]])
async def list_exercises(
    user: CurrentUser,
    db: DbSession,
    q: Annotated[str | None, Query(max_length=80)] = None,
    muscle: Annotated[str | None, Query(max_length=60)] = None,
    equipment: Annotated[str | None, Query(max_length=20)] = None,
    pattern: Annotated[str | None, Query(max_length=60)] = None,
    mine: bool = False,
    include_archived: bool = False,
    limit: Annotated[int, Query(ge=1, le=200)] = 50,
    offset: Annotated[int, Query(ge=0)] = 0,
):
    # A user sees the global catalog plus their own custom exercises — never anyone else's.
    stmt = select(Exercise).where(
        or_(Exercise.owner_user_id.is_(None), Exercise.owner_user_id == user.id)
    ).options(selectinload(Exercise.muscles).joinedload(ExerciseMuscle.muscle_group))

    if mine:
        stmt = stmt.where(Exercise.owner_user_id == user.id)
    if not include_archived:
        stmt = stmt.where(Exercise.status == CatalogStatus.active)
    order = [Exercise.name]
    if q:
        term = q.strip().lower()
        needle = f"%{term}%"
        alias_text = func.lower(func.array_to_string(Exercise.aliases, " | "))
        # Name OR any alias — "bench" must find "Barbell Bench Press", and
        # "hex" must find the trap-bar deadlift through "hex bar deadlift".
        stmt = stmt.where(or_(Exercise.name.ilike(needle), alias_text.like(needle)))
        # With 250+ exercises, alphabetical order buried the one asked for:
        # "rdl" put "Dumbbell Romanian Deadlift" above "Romanian Deadlift".
        # An exact name or alias first, then names that start with the query.
        order = [
            case((or_(func.lower(Exercise.name) == term, Exercise.aliases.any(term)), 0),
                 else_=1),
            case((func.lower(Exercise.name).startswith(term), 0), else_=1),
            func.length(Exercise.name),
            Exercise.name,
        ]
    if equipment:
        stmt = stmt.where(Exercise.equipment == equipment)
    if pattern:
        stmt = stmt.where(Exercise.movement_pattern == pattern)
    if muscle:
        stmt = stmt.where(Exercise.id.in_(
            select(ExerciseMuscle.exercise_id)
            .join(MuscleGroup, MuscleGroup.id == ExerciseMuscle.muscle_group_id)
            .where(MuscleGroup.slug == muscle)
        ))

    rows = (await db.scalars(stmt.order_by(*order).limit(limit).offset(offset))).all()
    return ok([_serialise(e) for e in rows], meta={"limit": limit, "offset": offset, "count": len(rows)})


@router.post("/exercises", status_code=201, response_model=Envelope[ExerciseOut])
async def create_exercise(body: ExerciseIn, user: CurrentUser, db: DbSession):
    slugs = {m.muscle_group_id for m in body.muscles}
    found = set((await db.scalars(
        select(MuscleGroup.id).where(MuscleGroup.id.in_(slugs))
    )).all())
    if missing := slugs - found:
        raise ValidationFailed(
            "One of those muscle groups does not exist.",
            fields={"muscles": f"Unknown: {', '.join(str(m) for m in missing)}"},
        )

    payload = body.model_dump(exclude={"muscles"})
    payload["equipment"] = Equipment(payload["equipment"])
    ex = Exercise(owner_user_id=user.id, is_custom=True, **payload)
    db.add(ex)
    await db.flush()
    for m in body.muscles:
        db.add(ExerciseMuscle(
            exercise_id=ex.id, muscle_group_id=m.muscle_group_id, role=MuscleRole(m.role)
        ))
    await db.flush()
    return ok(_serialise(await _load(db, ex.id)), status_code=201)


@router.get("/exercises/{exercise_id}", response_model=Envelope[ExerciseOut])
async def get_exercise(exercise_id: uuid.UUID, user: CurrentUser, db: DbSession):
    ex = await _load(db, exercise_id)
    if ex.owner_user_id is not None and ex.owner_user_id != user.id:
        raise Forbidden()
    return ok(_serialise(ex))


@router.patch("/exercises/{exercise_id}", response_model=Envelope[ExerciseOut])
async def patch_exercise(
    exercise_id: uuid.UUID, body: ExercisePatch, user: CurrentUser, db: DbSession
):
    ex = await _load(db, exercise_id)
    # Global catalog entries are read-only. The offered path is "copy to a custom exercise".
    if ex.owner_user_id is None:
        raise Forbidden("This is a built-in exercise. Copy it to a custom exercise to edit it.")
    if ex.owner_user_id != user.id:
        raise Forbidden()

    changes = body.model_dump(exclude_unset=True)
    muscles = changes.pop("muscles", None)
    if "equipment" in changes and changes["equipment"] is not None:
        changes["equipment"] = Equipment(changes["equipment"])
    for key, value in changes.items():
        setattr(ex, key, value)

    if muscles is not None:
        for em in list(ex.muscles):
            await db.delete(em)
        await db.flush()
        for m in muscles:
            db.add(ExerciseMuscle(
                exercise_id=ex.id, muscle_group_id=m["muscle_group_id"], role=MuscleRole(m["role"])
            ))
    await db.flush()
    return ok(_serialise(await _load(db, ex.id)))


@router.post("/exercises/{exercise_id}/archive", response_model=Envelope[ExerciseOut])
async def archive_exercise(exercise_id: uuid.UUID, user: CurrentUser, db: DbSession):
    """Soft delete. History and analytics keep resolving; the exercise leaves pickers."""
    ex = await _load(db, exercise_id)
    if ex.owner_user_id is None:
        raise Forbidden("Built-in exercises cannot be archived.")
    if ex.owner_user_id != user.id:
        raise Forbidden()
    ex.status = CatalogStatus.archived
    await db.flush()
    return ok(_serialise(await _load(db, ex.id)))
