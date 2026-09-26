"""The exercise library: big enough to log a real gym, and safe for history.

Two promises are pinned here. The library is complete enough that a Hevy user
finds their movements (≥ 250, each with instructions a person can follow), and
growing it never touches what is already there — users' sessions point at the
original rows by id, and a renamed seed entry would not rename a row, it would
add a second one beside it.
"""
from __future__ import annotations

import re

import pytest
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.models import Exercise, MuscleGroup
from app.seed.catalog import EXERCISES, MUSCLES, seed_catalog

pytestmark = pytest.mark.asyncio

#: The catalog as it stood before the library grew. These rows are history.
ORIGINAL_NAMES = (
    'Barbell Bench Press', 'Incline Barbell Bench Press', 'Dumbbell Bench Press',
    'Incline Dumbbell Press', 'Cable Fly', 'Push-up', 'Deadlift', 'Barbell Row', 'Pull-up',
    'Lat Pulldown', 'Seated Cable Row', 'Overhead Press', 'Dumbbell Lateral Raise',
    'Face Pull', 'Barbell Curl', 'Dumbbell Hammer Curl', 'Triceps Pushdown',
    'Overhead Triceps Extension', 'Close-Grip Bench Press', 'Barbell Squat', 'Front Squat',
    'Romanian Deadlift', 'Leg Press', 'Bulgarian Split Squat', 'Leg Curl',
    'Standing Calf Raise', 'Plank', 'Hanging Leg Raise', 'Cable Woodchop', 'Power Clean',
    'Push Press', 'Barbell Shrug', 'Skull Crusher', 'Preacher Curl', 'Hip Thrust',
    'Goblet Squat', 'Dumbbell Row', 'Dumbbell Shoulder Press', 'Arnold Press',
    'Dumbbell Romanian Deadlift', 'Dumbbell Walking Lunge', 'Dumbbell Curl', 'Dumbbell Fly',
    'Reverse Dumbbell Fly', 'Leg Extension', 'Seated Calf Raise', 'Cable Crunch',
    'Ab Wheel Rollout', 'Chin-up', 'Dip', 'Inverted Row', 'Pike Push-up', 'Bodyweight Squat',
    'Pistol Squat', 'Glute Bridge', 'Back Extension', 'Lying Leg Raise', 'Side Plank',
    'Hollow Body Hold',
)

_SENTENCE_END = re.compile(r"[.!?](\s|$)")


def _data(response, expect: int = 200):
    assert response.status_code == expect, response.text
    return response.json()["data"]


async def _session(engine) -> AsyncSession:
    return async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)()


# ------------------------------------------------------------ the data

class TestTheLibraryItself:
    def test_it_is_big_enough_to_log_a_real_gym(self):
        assert len(EXERCISES) >= 250
        by_equipment = {e.equipment.value for e in EXERCISES}
        assert by_equipment >= {
            "barbell", "dumbbell", "machine", "cable", "bodyweight", "kettlebell", "band", "other",
        }
        assert sum(e.pattern == "cardio" for e in EXERCISES) >= 12

    def test_history_comes_first_and_unrenamed(self):
        assert tuple(e.name for e in EXERCISES[:len(ORIGINAL_NAMES)]) == ORIGINAL_NAMES

    def test_names_are_unique_ignoring_case(self):
        names = [e.name.lower() for e in EXERCISES]
        assert len(names) == len(set(names))

    def test_every_entry_has_two_to_four_sentences_of_instructions(self):
        bad = [
            e.name for e in EXERCISES
            if not 2 <= len(_SENTENCE_END.findall(e.instructions)) <= 4
            or len(e.instructions) > 450
        ]
        assert not bad, bad

    def test_every_muscle_named_exists_and_roles_do_not_overlap(self):
        slugs = {slug for slug, _, _ in MUSCLES}
        for e in EXERCISES:
            assert e.primary, e.name
            assert set(e.primary) | set(e.secondary) <= slugs, e.name
            assert not set(e.primary) & set(e.secondary), e.name

    def test_an_alias_points_at_one_exercise(self):
        """"rdl" must mean one thing. The one exception predates the library:
        "chin-up" is an alias of Pull-up AND the name of Chin-up."""
        seen: dict[str, str] = {}
        names = {e.name.lower() for e in EXERCISES}
        for e in EXERCISES:
            for alias in e.aliases:
                assert alias == alias.lower(), (e.name, alias)
                if (alias, e.name) == ("chin-up", "Pull-up"):
                    continue
                assert alias not in names, (e.name, alias)
                assert seen.setdefault(alias, e.name) == e.name, (alias, seen[alias], e.name)

    def test_tracked_fields_match_what_the_movement_is(self):
        by_name = {e.name: e.tracked for e in EXERCISES}
        assert by_name["Barbell Squat"] == {"load", "reps"}
        assert by_name["Plank"] == {"duration"}
        assert by_name["Treadmill Run"] == {"duration", "distance"}
        assert by_name["Farmer's Walk"] == {"load", "distance"}
        # A counterweight is help, not load: logging it as load would make
        # more assistance look like a personal record.
        assert by_name["Assisted Pull-up"] == {"reps"}


# ------------------------------------------------------------ the seed

async def test_every_global_exercise_is_seeded_with_instructions(engine):
    async with await _session(engine) as db:
        missing = (await db.scalars(select(Exercise.name).where(
            Exercise.owner_user_id.is_(None),
            func.coalesce(func.length(Exercise.instructions), 0) < 40,
        ))).all()
        total = await db.scalar(
            select(func.count()).select_from(Exercise).where(Exercise.owner_user_id.is_(None))
        )
    assert not missing, missing[:5]
    assert total >= 250


async def test_an_existing_row_is_filled_in_not_replaced(engine):
    """What a deployment from before the library sees: the old row, same id,
    now with instructions and nothing else changed."""
    async with await _session(engine) as db:
        squat = await db.scalar(select(Exercise).where(
            Exercise.owner_user_id.is_(None), Exercise.name == "Barbell Squat"))
        original_id, original_aliases = squat.id, list(squat.aliases)
        await db.execute(update(Exercise).where(Exercise.id == squat.id).values(
            instructions=None, aliases=["squat"],
        ))
        await db.commit()

    async with await _session(engine) as db:
        result = await seed_catalog(db)
        await db.commit()
        again = await db.scalar(select(Exercise).where(Exercise.id == original_id))
        count = await db.scalar(select(func.count()).select_from(Exercise).where(
            Exercise.owner_user_id.is_(None), Exercise.name == "Barbell Squat"))

    assert result == {"muscle_groups": 0, "exercises": 0}
    assert count == 1
    seeded = next(e for e in EXERCISES if e.name == "Barbell Squat")
    assert again.instructions == seeded.instructions
    assert sorted(again.aliases) == sorted(original_aliases)


async def test_the_new_muscle_groups_hang_off_the_right_parents(engine):
    async with await _session(engine) as db:
        groups = {m.slug: m for m in (await db.scalars(select(MuscleGroup))).all()}
    assert groups["traps"].parent_id == groups["back"].id
    assert groups["adductors"].parent_id == groups["legs"].id
    assert groups["hip-flexors"].parent_id == groups["legs"].id


# ------------------------------------------------------------- the API

@pytest.mark.parametrize(("query", "expected"), [
    ("rdl", "Romanian Deadlift"),
    ("ohp", "Overhead Press"),
    ("hex bar", "Trap Bar Deadlift"),
    ("bench", "Barbell Bench Press"),
    ("rower", "Rowing Machine"),
    ("kb swing", "Kettlebell Swing"),
])
async def test_what_people_type_finds_the_exercise_first(auth_client, query, expected):
    rows = _data(await auth_client.get("/v1/exercises", params={"q": query}))
    assert rows and rows[0]["name"] == expected, [r["name"] for r in rows[:5]]


async def test_the_detail_screen_gets_the_instructions(auth_client):
    rows = _data(await auth_client.get("/v1/exercises", params={"q": "Romanian Deadlift"}))
    rdl = next(r for r in rows if r["name"] == "Romanian Deadlift")
    detail = _data(await auth_client.get(f"/v1/exercises/{rdl['id']}"))
    assert detail["instructions"] and len(detail["instructions"]) > 40


async def test_a_custom_exercise_can_carry_its_own_notes(auth_client):
    quads = next(m["id"] for m in _data(await auth_client.get("/v1/muscle-groups"))
                 if m["slug"] == "quads")
    created = _data(await auth_client.post("/v1/exercises", json={
        "name": "Spanish Squat", "equipment": "band",
        "muscles": [{"muscle_group_id": quads, "role": "primary"}],
        "instructions": "Band behind the knees, sit back, shins vertical.",
    }), 201)
    assert created["instructions"].startswith("Band behind the knees")

    patched = _data(await auth_client.patch(
        f"/v1/exercises/{created['id']}", json={"instructions": None}))
    assert patched["instructions"] is None
