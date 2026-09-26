"""Create (or reset) the demo account so the app can be opened and poked at.

    uv run python scripts/seed_demo.py

Idempotent, but NOT a wipe: it creates what is missing, cancels whatever
session was left open, and removes programs other than the seeded one (AC-01
builds one per run). Completed history is kept.
"""
from __future__ import annotations

import asyncio
import datetime as dt
import sys
import uuid
from zoneinfo import ZoneInfo

import httpx

BASE = "http://localhost:8000"
EMAIL = "demo@fitlog.app"
TZ = "Asia/Kolkata"
PASSWORD = "fitlogdemo1234"


# The split the design files render. Names are matched against the seeded catalog, so
# this stays correct if the catalog grows.
SPLIT = {
    "Push — Chest, Shoulders & Triceps": [
        ("Barbell Bench Press", 4, 6, 8, 80.0, 180),
        ("Overhead Press", 3, 8, 10, 45.0, 120),
        ("Cable Triceps Pushdown", 3, 10, 12, 30.0, 75),
    ],
    "Pull — Back & Biceps": [
        ("Deadlift", 3, 3, 5, 140.0, 240),
        ("Pull-Up", 4, 6, 10, None, 120),
        ("Barbell Row", 3, 8, 10, 70.0, 120),
    ],
    "Legs": [
        ("Back Squat", 4, 5, 8, 110.0, 210),
        ("Romanian Deadlift", 3, 8, 10, 90.0, 150),
    ],
}

# Two completed sessions so history, previous-performance and the PR badges have
# something real to render. Backdated, which the API allows and the future does not.
PAST_SESSIONS = [
    (14, "Push — Chest, Shoulders & Triceps", [
        ("Barbell Bench Press", [("warmup", 40.0, 12), ("working", 75.0, 8),
                                 ("working", 75.0, 8), ("working", 75.0, 7)]),
        ("Overhead Press", [("working", 42.5, 9), ("working", 42.5, 8)]),
    ]),
    (5, "Push — Chest, Shoulders & Triceps", [
        ("Barbell Bench Press", [("warmup", 40.0, 12), ("working", 80.0, 8),
                                 ("working", 80.0, 8), ("working", 77.5, 8)]),
        ("Overhead Press", [("working", 45.0, 8), ("working", 45.0, 8)]),
    ]),
]


async def _catalog(c, h) -> dict[str, str]:
    rows = (await c.get("/v1/exercises", headers=h, params={"limit": 200})).json()["data"]
    return {e["name"]: e["id"] for e in rows}


PROGRAM_NAME = "Push / Pull / Legs"


async def _prune_programs(c, h) -> int:
    """Remove every program but the seeded one — AC-01 builds a new one each run.

    Before this the list grew by one per run, and the flows that open a program
    had to scroll past all of them (G10 TODO 3.4). A program a session used
    cannot be deleted (BRD §7 soft delete), so that one is archived instead.
    """
    removed = 0
    for p in (await c.get("/v1/workout-programs", headers=h)).json()["data"]:
        if p["name"] == PROGRAM_NAME or p.get("status") == "archived":
            continue
        r = await c.delete(f"/v1/workout-programs/{p['id']}", headers=h)
        if r.status_code == 409:
            r = await c.post(f"/v1/workout-programs/{p['id']}/archive", headers=h)
        removed += r.status_code in (200, 204)
    return removed


async def _seed_program(c, h, catalog: dict[str, str]) -> dict[str, str]:
    """Returns {day name: plan day id}. Skipped entirely if the program already exists."""
    existing = [p for p in (await c.get("/v1/workout-programs", headers=h)).json()["data"]
                if p["name"] == PROGRAM_NAME]
    if existing:
        return {d["name"]: d["id"] for d in existing[0]["days"]}

    r = await c.post("/v1/workout-programs", headers=h, json={
        "name": PROGRAM_NAME, "description": "Three-day split, repeated twice a week",
    })
    assert r.status_code == 201, r.text
    pid = r.json()["data"]["id"]

    day_ids: dict[str, str] = {}
    for weekday, (day_name, rows) in enumerate(SPLIT.items()):
        r = await c.post(f"/v1/workout-programs/{pid}/days", headers=h, json={
            "name": day_name, "scheduled_weekday": weekday * 2,
        })
        assert r.status_code == 201, r.text
        day_id = next(d["id"] for d in r.json()["data"]["days"] if d["name"] == day_name)
        day_ids[day_name] = day_id

        payload = []
        for name, sets, lo, hi, load, rest in rows:
            if name not in catalog:
                continue
            payload.append({
                "exercise_id": catalog[name], "target_sets": sets,
                "target_reps_min": lo, "target_reps_max": hi,
                "target_load": load, "rest_seconds": rest,
            })
        r = await c.put(f"/v1/plan-days/{day_id}/exercises", headers=h, json=payload)
        assert r.status_code == 200, r.text
    return day_ids


async def _seed_history(c, h, day_ids: dict[str, str]) -> int:
    # Cancel FIRST, and unconditionally. This used to sit below the early return,
    # so it ran only on a brand-new account — and an account with any history at
    # all kept whatever session was left open. E-01 shows only "You're mid-workout"
    # while one exists, so every E2E flow that reaches for a plan day found none
    # and failed on a selector, which reads like a broken app rather than a dirty
    # fixture. "Starts from a known state" has to include "nothing is open".
    open_session = (await c.get("/v1/workout-sessions/active", headers=h)).json()["data"]
    if open_session:
        await c.post(f"/v1/workout-sessions/{open_session['id']}/cancel", headers=h)

    if (await c.get("/v1/workout-sessions", headers=h)).json()["meta"]["count"]:
        return 0

    made = 0
    for days_ago, day_name, plan in PAST_SESSIONS:
        started = dt.datetime.now(dt.UTC) - dt.timedelta(days=days_ago, hours=3)
        r = await c.post("/v1/workout-sessions", headers=h, json={
            "plan_day_id": day_ids[day_name], "started_at": started.isoformat(),
        })
        assert r.status_code == 201, r.text
        session = r.json()["data"]
        by_name = {e["exercise_name"]: e["id"] for e in session["exercises"]}

        for exercise_name, sets in plan:
            se_id = by_name.get(exercise_name)
            if se_id is None:
                continue
            for i, (set_type, load, reps) in enumerate(sets):
                r = await c.post(
                    f"/v1/session-exercises/{se_id}/sets",
                    # Idempotency-Key is mandatory — the same key the phone's outbox sends.
                    headers={**h, "Idempotency-Key": str(uuid.uuid4())},
                    json={"set_type": set_type, "load_kg": load, "reps": reps,
                          "performed_at": (started + dt.timedelta(minutes=4 * i)).isoformat()},
                )
                assert r.status_code in (200, 201), r.text

        r = await c.post(f"/v1/workout-sessions/{session['id']}/finish", headers=h)
        assert r.status_code == 200, r.text
        made += 1
    return made


async def main() -> int:
    async with httpx.AsyncClient(base_url=BASE, timeout=10) as c:
        try:
            await c.get("/health")
        except httpx.ConnectError:
            print("API is not running. Start it with:")
            print("  cd services/api && uv run uvicorn app.main:app --port 8000")
            return 1

        r = await c.post("/v1/auth/register", json={"email": EMAIL, "password": PASSWORD})
        if r.status_code == 201:
            print(f"created {EMAIL}")
        else:
            r = await c.post("/v1/auth/login", json={"email": EMAIL, "password": PASSWORD})
            if r.status_code != 200:
                print("could not create or log in:", r.text)
                return 1
            print(f"{EMAIL} already existed — reusing it")

        token = r.json()["data"]["access_token"]
        h = {"authorization": f"Bearer {token}"}

        await c.patch("/v1/profile", headers=h, json={
            "display_name": "Demo",
            "height_cm": 178,
            "timezone": TZ,
            "preferred_unit_system": "metric",
            "activity_level": "moderate",
            "daily_calorie_target": 2340,
            "protein_g_target": 176,
            "carbs_g_target": 234,
            "fat_g_target": 78,
            "onboarding_completed": True,      # skip straight to the dashboard
        })

        # The demo user's "today" is their local day, not the server's — the same
        # rule the product enforces everywhere else.
        today = dt.datetime.now(ZoneInfo(TZ)).date()

        existing = (await c.get("/v1/goals", headers=h)).json()["data"]
        if not existing:
            await c.post("/v1/goals", headers=h, json={
                "goal_type": "fat_loss", "metric_key": "body_weight", "direction": "down",
                "start_value": 78.4, "target_value": 74.0, "target_unit": "kg",
                "start_date": str(today - dt.timedelta(days=50)),
                "target_date": str(today + dt.timedelta(days=70)),
            })
            await c.post("/v1/goals", headers=h, json={
                "goal_type": "strength", "metric_key": "e1rm", "direction": "up",
                "start_value": 102.5, "target_value": 110.0, "target_unit": "kg",
                "start_date": str(today - dt.timedelta(days=20)),
            })

        catalog = await _catalog(c, h)
        pruned = await _prune_programs(c, h)
        day_ids = await _seed_program(c, h, catalog)
        await _seed_history(c, h, day_ids)

        goals = (await c.get("/v1/goals", headers=h)).json()
        programs = (await c.get("/v1/workout-programs", headers=h)).json()
        history = (await c.get("/v1/workout-sessions", headers=h)).json()
        print()
        print("  email    ", EMAIL)
        print("  password ", PASSWORD)
        print("  profile  ", "2,340 kcal · 176 g protein · Asia/Kolkata")
        print("  goals    ", goals["meta"]["total"])
        print("  programs ", programs["meta"]["total"], "·", len(day_ids), "plan days",
              f"· {pruned} left over from earlier runs removed" if pruned else "")
        print("  history  ", history["meta"]["count"], "completed sessions")
        return 0


sys.exit(asyncio.run(main()))
