"""Versioned, idempotent seed for the global exercise catalog and muscle-group tree.

Idempotent by design: it upserts on natural keys, so any environment can be rebuilt
from scratch and re-running is a no-op. Global entries have owner_user_id NULL.
"""
from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Equipment, Exercise, ExerciseMuscle, MuscleGroup, MuscleRole

SEED_VERSION = 1

# (slug, display name, parent slug or None)
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
]

# (name, equipment, movement pattern, [primary slugs], [secondary slugs], aliases)
EXERCISES: list[tuple[str, Equipment, str, list[str], list[str], list[str]]] = [
    # chest
    ("Barbell Bench Press", Equipment.barbell, "horizontal push", ["chest"], ["triceps", "front-delts"], ["bench", "flat bench", "bb bench"]),
    ("Incline Barbell Bench Press", Equipment.barbell, "incline push", ["upper-chest"], ["front-delts", "triceps"], ["incline bench"]),
    ("Dumbbell Bench Press", Equipment.dumbbell, "horizontal push", ["chest"], ["triceps", "front-delts"], ["db bench"]),
    ("Incline Dumbbell Press", Equipment.dumbbell, "incline push", ["upper-chest"], ["front-delts", "triceps"], ["incline db press"]),
    ("Cable Fly", Equipment.cable, "horizontal adduction", ["chest"], [], ["fly", "cable flye"]),
    ("Push-up", Equipment.bodyweight, "horizontal push", ["chest"], ["triceps", "front-delts"], ["pushup", "press-up"]),
    # back
    ("Deadlift", Equipment.barbell, "hinge", ["lower-back", "glutes", "hamstrings"], ["lats", "forearms"], ["conventional deadlift"]),
    ("Barbell Row", Equipment.barbell, "horizontal pull", ["mid-back", "lats"], ["biceps", "rear-delts"], ["bent over row", "bb row"]),
    ("Pull-up", Equipment.bodyweight, "vertical pull", ["lats"], ["biceps", "mid-back"], ["pullup", "chin-up"]),
    ("Lat Pulldown", Equipment.cable, "vertical pull", ["lats"], ["biceps", "mid-back"], ["pulldown"]),
    ("Seated Cable Row", Equipment.cable, "horizontal pull", ["mid-back"], ["lats", "biceps"], ["cable row"]),
    # shoulders
    ("Overhead Press", Equipment.barbell, "vertical push", ["front-delts"], ["triceps", "side-delts"], ["ohp", "military press", "shoulder press"]),
    ("Dumbbell Lateral Raise", Equipment.dumbbell, "abduction", ["side-delts"], [], ["lateral raise", "side raise"]),
    ("Face Pull", Equipment.cable, "horizontal pull", ["rear-delts"], ["mid-back"], []),
    # arms
    ("Barbell Curl", Equipment.barbell, "elbow flexion", ["biceps"], ["forearms"], ["bicep curl"]),
    ("Dumbbell Hammer Curl", Equipment.dumbbell, "elbow flexion", ["biceps", "forearms"], [], ["hammer curl"]),
    ("Triceps Pushdown", Equipment.cable, "elbow extension", ["triceps"], [], ["pushdown", "tricep pushdown"]),
    ("Overhead Triceps Extension", Equipment.dumbbell, "elbow extension", ["triceps"], [], ["overhead extension"]),
    ("Close-Grip Bench Press", Equipment.barbell, "horizontal push", ["triceps"], ["chest", "front-delts"], ["cgbp"]),
    # legs
    ("Barbell Squat", Equipment.barbell, "squat", ["quads", "glutes"], ["hamstrings", "lower-back"], ["squat", "back squat"]),
    ("Front Squat", Equipment.barbell, "squat", ["quads"], ["glutes", "core"], []),
    ("Romanian Deadlift", Equipment.barbell, "hinge", ["hamstrings", "glutes"], ["lower-back"], ["rdl"]),
    ("Leg Press", Equipment.machine, "squat", ["quads", "glutes"], ["hamstrings"], []),
    ("Bulgarian Split Squat", Equipment.dumbbell, "lunge", ["quads", "glutes"], ["hamstrings"], ["split squat", "rear foot elevated split squat"]),
    ("Leg Curl", Equipment.machine, "knee flexion", ["hamstrings"], [], ["hamstring curl"]),
    ("Standing Calf Raise", Equipment.machine, "plantar flexion", ["calves"], [], ["calf raise"]),
    # core
    ("Plank", Equipment.bodyweight, "anti-extension", ["abs"], ["obliques"], []),
    ("Hanging Leg Raise", Equipment.bodyweight, "hip flexion", ["abs"], ["obliques"], ["leg raise"]),
    ("Cable Woodchop", Equipment.cable, "rotation", ["obliques"], ["abs"], ["woodchop"]),
    # --- added for the starter-program library (G10): every exercise a
    #     well-known program names has to exist here, or the program can't be
    #     copied (test_program_templates.py checks each one).
    ("Power Clean", Equipment.barbell, "olympic pull", ["hamstrings", "glutes", "quads"], ["mid-back", "front-delts"], ["clean", "hang clean"]),
    ("Push Press", Equipment.barbell, "vertical push", ["front-delts"], ["triceps", "quads"], []),
    ("Barbell Shrug", Equipment.barbell, "scapular elevation", ["mid-back"], ["forearms"], ["shrug"]),
    ("Skull Crusher", Equipment.barbell, "elbow extension", ["triceps"], [], ["lying triceps extension"]),
    ("Preacher Curl", Equipment.barbell, "elbow flexion", ["biceps"], [], ["ez bar preacher curl"]),
    ("Hip Thrust", Equipment.barbell, "hinge", ["glutes"], ["hamstrings"], ["barbell hip thrust"]),
    ("Goblet Squat", Equipment.dumbbell, "squat", ["quads", "glutes"], ["core"], []),
    ("Dumbbell Row", Equipment.dumbbell, "horizontal pull", ["lats", "mid-back"], ["biceps", "rear-delts"], ["one-arm row", "db row"]),
    ("Dumbbell Shoulder Press", Equipment.dumbbell, "vertical push", ["front-delts"], ["triceps", "side-delts"], ["db shoulder press", "seated db press"]),
    ("Arnold Press", Equipment.dumbbell, "vertical push", ["front-delts", "side-delts"], ["triceps"], []),
    ("Dumbbell Romanian Deadlift", Equipment.dumbbell, "hinge", ["hamstrings", "glutes"], ["lower-back"], ["db rdl"]),
    ("Dumbbell Walking Lunge", Equipment.dumbbell, "lunge", ["quads", "glutes"], ["hamstrings"], ["lunge", "walking lunge"]),
    ("Dumbbell Curl", Equipment.dumbbell, "elbow flexion", ["biceps"], ["forearms"], ["db curl"]),
    ("Dumbbell Fly", Equipment.dumbbell, "horizontal adduction", ["chest"], [], ["db fly", "db flye"]),
    ("Reverse Dumbbell Fly", Equipment.dumbbell, "horizontal abduction", ["rear-delts"], ["mid-back"], ["rear delt fly"]),
    ("Leg Extension", Equipment.machine, "knee extension", ["quads"], [], []),
    ("Seated Calf Raise", Equipment.machine, "plantar flexion", ["calves"], [], []),
    ("Cable Crunch", Equipment.cable, "spinal flexion", ["abs"], [], []),
    ("Ab Wheel Rollout", Equipment.other, "anti-extension", ["abs"], ["obliques"], ["ab wheel"]),
    ("Chin-up", Equipment.bodyweight, "vertical pull", ["lats", "biceps"], ["mid-back"], ["chinup"]),
    ("Dip", Equipment.bodyweight, "vertical push", ["triceps", "chest"], ["front-delts"], ["dips", "parallel bar dip"]),
    ("Inverted Row", Equipment.bodyweight, "horizontal pull", ["mid-back", "lats"], ["biceps", "rear-delts"], ["australian pull-up", "body row"]),
    ("Pike Push-up", Equipment.bodyweight, "vertical push", ["front-delts"], ["triceps"], []),
    ("Bodyweight Squat", Equipment.bodyweight, "squat", ["quads", "glutes"], ["hamstrings"], ["air squat"]),
    ("Pistol Squat", Equipment.bodyweight, "squat", ["quads", "glutes"], ["core"], ["single-leg squat"]),
    ("Glute Bridge", Equipment.bodyweight, "hinge", ["glutes"], ["hamstrings"], []),
    ("Back Extension", Equipment.bodyweight, "hinge", ["lower-back"], ["glutes", "hamstrings"], ["hyperextension"]),
    ("Lying Leg Raise", Equipment.bodyweight, "hip flexion", ["abs"], [], []),
    ("Side Plank", Equipment.bodyweight, "anti-lateral flexion", ["obliques"], ["abs"], []),
    ("Hollow Body Hold", Equipment.bodyweight, "anti-extension", ["abs"], [], ["hollow hold"]),
]

# Exercises measured by time rather than reps — the logger renders fields from these flags.
TIMED = {"Plank", "Side Plank", "Hollow Body Hold"}


async def seed_catalog(db: AsyncSession) -> dict[str, int]:
    """Upserts muscle groups and global exercises. Safe to run repeatedly."""
    created_muscles = created_exercises = 0

    by_slug: dict[str, MuscleGroup] = {
        m.slug: m for m in (await db.scalars(select(MuscleGroup))).all()
    }
    for order, (slug, name, _parent) in enumerate(MUSCLES):
        if slug not in by_slug:
            mg = MuscleGroup(slug=slug, name=name, sort_order=order)
            db.add(mg)
            by_slug[slug] = mg
            created_muscles += 1
    await db.flush()

    # Second pass so parents exist before children reference them.
    for slug, _name, parent in MUSCLES:
        if parent:
            by_slug[slug].parent_id = by_slug[parent].id
    await db.flush()

    existing = {
        e.name for e in (
            await db.scalars(select(Exercise).where(Exercise.owner_user_id.is_(None)))
        ).all()
    }
    for name, equip, pattern, primaries, secondaries, aliases in EXERCISES:
        if name in existing:
            continue
        timed = name in TIMED
        ex = Exercise(
            owner_user_id=None, name=name, equipment=equip, movement_pattern=pattern,
            aliases=aliases, is_custom=False,
            tracks_load=not timed and equip is not Equipment.bodyweight,
            tracks_reps=not timed,
            tracks_duration=timed,
            tracks_distance=False,
            default_unit="kg",
        )
        db.add(ex)
        await db.flush()
        for s in primaries:
            db.add(ExerciseMuscle(exercise_id=ex.id, muscle_group_id=by_slug[s].id, role=MuscleRole.primary))
        for s in secondaries:
            db.add(ExerciseMuscle(exercise_id=ex.id, muscle_group_id=by_slug[s].id, role=MuscleRole.secondary))
        created_exercises += 1

    await db.flush()
    return {"muscle_groups": created_muscles, "exercises": created_exercises}
