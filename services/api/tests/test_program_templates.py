"""Starter programs (C-01 "Browse starter programs", C-04 "Start from a template").

Found on a phone in G10: a new account's Programs screen was completely empty,
with nothing to start from. The wireframes specified starter programs from the
beginning; nothing built them.

A template is a plan, not a program anyone owns. Choosing one DEEP-COPIES it
into the user's own programs, so editing theirs can never reach back into the
template or into anyone else's copy.
"""
from __future__ import annotations

import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.models import Exercise
from app.seed.program_templates import TEMPLATES

pytestmark = pytest.mark.asyncio


async def test_every_template_names_only_catalog_exercises(engine):
    """A template that names an exercise the catalog lacks would fail for every
    user who picks it — so it fails here first."""
    maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with maker() as db:
        catalog = set((await db.scalars(
            select(Exercise.name).where(Exercise.owner_user_id.is_(None))
        )).all())
    named = {ex.name for t in TEMPLATES for d in t.days for ex in d.exercises}
    assert named, "no exercises in any template"
    assert named <= catalog, sorted(named - catalog)


async def test_lists_the_starter_programs(auth_client):
    rows = (await auth_client.get("/v1/program-templates")).json()["data"]
    assert [r["key"] for r in rows] == [t.key for t in TEMPLATES]
    first = rows[0]
    assert first["name"] and first["summary"]
    assert first["days_per_week"] == TEMPLATES[0].per_week
    assert [d["name"] for d in first["days"]] == [d.name for d in TEMPLATES[0].days]


async def test_starting_one_creates_the_users_own_program(auth_client):
    tpl = TEMPLATES[0]
    r = await auth_client.post(f"/v1/program-templates/{tpl.key}/start")
    assert r.status_code == 201, r.text
    p = r.json()["data"]

    assert p["name"] == tpl.name
    assert [d["name"] for d in p["days"]] == [d.name for d in tpl.days]
    assert [d["day_index"] for d in p["days"]] == list(range(len(tpl.days)))
    first_day = p["days"][0]
    assert [e["exercise_name"] for e in first_day["exercises"]] == [e.name for e in tpl.days[0].exercises]
    assert [e["order_index"] for e in first_day["exercises"]] == list(range(len(tpl.days[0].exercises)))
    e0, t0 = first_day["exercises"][0], tpl.days[0].exercises[0]
    assert (e0["target_sets"], e0["target_reps_min"], e0["target_reps_max"]) == (t0.sets, t0.reps_min, t0.reps_max)

    mine = (await auth_client.get("/v1/workout-programs")).json()["data"]
    assert p["id"] in [m["id"] for m in mine]


async def test_two_starts_are_two_independent_copies(auth_client):
    tpl = TEMPLATES[0]
    a = (await auth_client.post(f"/v1/program-templates/{tpl.key}/start")).json()["data"]
    b = (await auth_client.post(f"/v1/program-templates/{tpl.key}/start")).json()["data"]
    assert a["id"] != b["id"]
    assert {d["id"] for d in a["days"]}.isdisjoint({d["id"] for d in b["days"]})


async def test_unknown_template_is_404(auth_client):
    r = await auth_client.post("/v1/program-templates/no-such-thing/start")
    assert r.status_code == 404


async def test_requires_a_user(client):
    assert (await client.get("/v1/program-templates")).status_code == 401


async def test_the_library_comes_back_ranked_for_this_user(auth_client):
    await auth_client.patch("/v1/profile", json={
        "training_experience": "beginner", "training_days_per_week": 3,
        "equipment": "dumbbells", "session_minutes": 45,
    })
    rows = (await auth_client.get("/v1/program-templates")).json()["data"]
    assert rows[0]["key"] == "dumbbell-full-body"
    assert rows[0]["recommended"] is True and rows[0]["fits"] is True
    assert rows[0]["reasons"]
    # A barbell program is still listed, but says why it does not fit.
    stronglifts = next(r for r in rows if r["key"] == "stronglifts-5x5")
    assert stronglifts["fits"] is False and stronglifts["reasons"] == ["Needs a full gym"]


async def test_nothing_is_called_recommended_before_anything_is_answered(auth_client):
    rows = (await auth_client.get("/v1/program-templates")).json()["data"]
    assert not any(r["recommended"] for r in rows)


async def test_the_copy_keeps_how_to_run_it(auth_client):
    p = (await auth_client.post("/v1/program-templates/531-bbb/start")).json()["data"]
    assert "training max" in p["description"]
    assert p["days"][0]["notes"] and "5/3/1" in p["days"][0]["notes"]
    # The main lift appears twice: the wave, then 5x10.
    names = [e["exercise_name"] for e in p["days"][0]["exercises"]]
    assert names.count("Overhead Press") == 2
