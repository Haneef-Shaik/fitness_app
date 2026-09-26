"""Versioned, idempotent seed for the global exercise catalog and muscle-group tree.

Idempotent by design: it upserts on natural keys, so any environment can be rebuilt
from scratch and re-running is a no-op. Global entries have owner_user_id NULL.

The exercises themselves are data, in `exercise_library.py`. **An existing row
is history**: sessions, plans and PRs point at it, so this seeder never
renames it and never changes its equipment, muscles or tracked fields. It only
adds exercises that are missing and fills what an existing one lacks — its
instructions, and aliases it does not have yet.
"""
from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Exercise, ExerciseMuscle, MuscleGroup, MuscleRole
from app.seed.exercise_library import LIBRARY, ExerciseSeed

SEED_VERSION = 2

# (slug, display name, parent slug or None)
#
# New groups are APPENDED, never inserted: a group's sort order is its index
# here, and a database seeded earlier keeps the order it was given. Inserting
# "traps" after "mid-back" would renumber everything below it on a fresh
# install and on no existing one.
MUSCLES: list[tuple[str, str, str | None]] = [
    ("chest", "Chest", None),
    ("upper-chest", "Upper Chest", "chest"),
    ("back", "Back", None),
    ("lats", "Lats", "back"),
    ("mid-back", "Mid Back", "back"),
    ("lower-back", "Lower Back", "back"),
    ("shoulders", "Shoulders", None),
    ("front-delts", "Front Delts", "shoulders"),
    ("side-delts", "Side Delts", "shoulders"),
    ("rear-delts", "Rear Delts", "shoulders"),
    ("arms", "Arms", None),
    ("biceps", "Biceps", "arms"),
    ("triceps", "Triceps", "arms"),
    ("forearms", "Forearms", "arms"),
    ("legs", "Legs", None),
    ("quads", "Quads", "legs"),
    ("hamstrings", "Hamstrings", "legs"),
    ("glutes", "Glutes", "legs"),
    ("calves", "Calves", "legs"),
    ("core", "Core", None),
    ("abs", "Abs", "core"),
    ("obliques", "Obliques", "core"),
    # --- added with the 250-exercise library: shrugs, adductor work and leg
    #     raises had nowhere honest to put their volume.
    ("traps", "Traps", "back"),
    ("adductors", "Adductors", "legs"),
    ("hip-flexors", "Hip Flexors", "legs"),
]

#: The seeded exercises, in library order.
EXERCISES: tuple[ExerciseSeed, ...] = LIBRARY


async def seed_catalog(db: AsyncSession) -> dict[str, int]:
    """Upserts muscle groups and global exercises. Safe to run repeatedly."""
    by_slug, created_muscles = await _seed_muscles(db)

    existing = {
        e.name: e for e in (
            await db.scalars(select(Exercise).where(Exercise.owner_user_id.is_(None)))
        ).all()
    }
    created_exercises = 0
    for seed in EXERCISES:
        current = existing.get(seed.name)
        if current is None:
            await _create(db, seed, by_slug)
            created_exercises += 1
        else:
            _fill_missing(current, seed)

    await db.flush()
    return {"muscle_groups": created_muscles, "exercises": created_exercises}


async def _seed_muscles(db: AsyncSession) -> tuple[dict[str, MuscleGroup], int]:
    by_slug: dict[str, MuscleGroup] = {
        m.slug: m for m in (await db.scalars(select(MuscleGroup))).all()
    }
    created = 0
    for order, (slug, name, _parent) in enumerate(MUSCLES):
        if slug not in by_slug:
            mg = MuscleGroup(slug=slug, name=name, sort_order=order)
            db.add(mg)
            by_slug[slug] = mg
            created += 1
    await db.flush()

    # Second pass so parents exist before children reference them.
    for slug, _name, parent in MUSCLES:
        if parent:
            by_slug[slug].parent_id = by_slug[parent].id
    await db.flush()
    return by_slug, created


async def _create(db: AsyncSession, seed: ExerciseSeed, by_slug: dict[str, MuscleGroup]) -> None:
    tracked = seed.tracked
    ex = Exercise(
        owner_user_id=None, name=seed.name, equipment=seed.equipment,
        movement_pattern=seed.pattern, aliases=list(seed.aliases), is_custom=False,
        tracks_load="load" in tracked,
        tracks_reps="reps" in tracked,
        tracks_duration="duration" in tracked,
        tracks_distance="distance" in tracked,
        default_unit="kg",
        instructions=seed.instructions or None,
    )
    db.add(ex)
    await db.flush()
    roles = ((MuscleRole.primary, seed.primary), (MuscleRole.secondary, seed.secondary))
    for role, slugs in roles:
        for s in slugs:
            db.add(ExerciseMuscle(exercise_id=ex.id, muscle_group_id=by_slug[s].id, role=role))


def _fill_missing(ex: Exercise, seed: ExerciseSeed) -> None:
    """Only what the row lacks. Unchanged values are not written, so a re-run
    issues no UPDATE at all."""
    if not ex.instructions and seed.instructions:
        ex.instructions = seed.instructions
    missing = [a for a in seed.aliases if a not in (ex.aliases or [])]
    if missing:
        ex.aliases = [*(ex.aliases or []), *missing]
    if ex.movement_pattern is None and seed.pattern:
        ex.movement_pattern = seed.pattern
