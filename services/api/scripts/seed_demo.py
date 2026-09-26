"""Create (or reset) the demo account so the app can be opened and poked at.

    uv run python scripts/seed_demo.py

The account is created in Supabase Auth, already confirmed (docs/14), then set
up through the FitLog API. Locally, the stack `pnpm supabase start` runs.

For App Review, against a deployed API and its Supabase project, with the
reviewer account's own details (never the defaults below, which are public in
this repository):

    FITLOG_API=https://api.example.com DEMO_EMAIL=review@… DEMO_PASSWORD=… \
    SUPABASE_URL=https://<ref>.supabase.co SUPABASE_PUBLISHABLE_KEY=… SUPABASE_SECRET_KEY=… \
        uv run python scripts/seed_demo.py

Idempotent, but NOT a wipe: it creates what is missing, cancels whatever
session was left open, and removes programs other than the seeded one (AC-01
builds one per run). Completed history is kept.
"""
from __future__ import annotations

import asyncio
import datetime as dt
import os
import sys
import uuid
from pathlib import Path
from zoneinfo import ZoneInfo

import httpx

# scripts/supabase_signin.py, at the repository root: the one way scripts sign in.
sys.path.insert(0, str(Path(__file__).resolve().parents[3] / "scripts"))
from supabase_signin import access_token

BASE = os.environ.get("FITLOG_API", "http://localhost:8000").rstrip("/")
EMAIL = os.environ.get("DEMO_EMAIL", "demo@fitlog.app")
TZ = os.environ.get("DEMO_TIMEZONE", "Asia/Kolkata")
PASSWORD = os.environ.get("DEMO_PASSWORD", "fitlogdemo1234")
if BASE.startswith("https://") and PASSWORD == "fitlogdemo1234":
    # The default is in a public repo. A deployed account with it is anyone's.
    sys.exit("Set DEMO_PASSWORD for a deployed API; the default is public.")
if BASE.startswith("https://") and not os.environ.get("SUPABASE_URL"):
    # Without it the sign-in falls back to the LOCAL stack, and the deployed API
    # refuses a token its own project did not issue.
    sys.exit("Set SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY and SUPABASE_SECRET_KEY "
             "for the deployed API's Supabase project.")


# The split the design files render. Names are matched against the seeded catalog, so
# this stays correct if the catalog grows.
SPLIT = {
    "Push — Chest, Shoulders & Triceps": [
        ("Barbell Bench Press", 4, 6, 8, 80.0, 180),
        ("Overhead Press", 3, 8, 10, 45.0, 120),
        ("Triceps Pushdown", 3, 10, 12, 30.0, 75),
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
    """Every exercise, page by page. One page of 200 was the whole catalog until
    G11 grew it to 297, and a name past the first page silently left its plan
    day without that exercise."""
    names: dict[str, str] = {}
    offset = 0
    while True:
        rows = (await c.get("/v1/exercises", headers=h,
                            params={"limit": 200, "offset": offset})).json()["data"]
        for e in rows:
            # By name and by alias, ignoring case: "Back Squat" is the catalog's
            # Barbell Squat, and "Pull-Up" its "Pull-up".
            names.setdefault(e["name"].lower(), e["id"])
            for alias in e.get("aliases") or []:
                names.setdefault(alias.lower(), e["id"])
        if len(rows) < 200:
            return names
        offset += 200


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
        days = {d["name"]: d for d in existing[0]["days"]}
        # Repaired, not skipped: a day left empty (a catalog that changed under
        # it, an interrupted seed) would start a workout with nothing in it.
        for day_name, rows in SPLIT.items():
            day = days.get(day_name)
            if day is not None and not day.get("exercises"):
                await _fill_day(c, h, day["id"], rows, catalog)
        return {name: d["id"] for name, d in days.items()}

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

        await _fill_day(c, h, day_id, rows, catalog)
    return day_ids


async def _fill_day(c, h, day_id: str, rows, catalog: dict[str, str]) -> None:
    payload = []
    for name, sets, lo, hi, load, rest in rows:
        if name.lower() not in catalog:
            continue
        payload.append({
            "exercise_id": catalog[name.lower()], "target_sets": sets,
            "target_reps_min": lo, "target_reps_max": hi,
            "target_load": load, "rest_seconds": rest,
        })
    r = await c.put(f"/v1/plan-days/{day_id}/exercises", headers=h, json=payload)
    assert r.status_code == 200, r.text


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

    # Kept when it is real history. Sessions with no sets — seeded while a plan
    # day was empty — are not history anyone could compare against, and left
    # alone they made "previous performance" and "previous chest day" empty for
    # every E2E run after (G11).
    history = (await c.get("/v1/history/workouts", headers=h, params={"limit": 50})).json()["data"]
    if any(row.get("set_count") for row in history):
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

        # Signing in is Supabase Auth's (docs/14): the account is made there,
        # confirmed, if it does not exist, and the first API call creates the
        # FitLog side of it.
        token = access_token(EMAIL, PASSWORD, create=True, metadata={"display_name": "Demo"})
        h = {"authorization": f"Bearer {token}"}
        r = await c.get("/v1/auth/me", headers=h)
        if r.status_code != 200:
            print("the API refused the Supabase sign-in:", r.text)
            return 1

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


if __name__ == "__main__":
    # Guarded so seed_screenshots.py can reuse the program and catalog helpers.
    sys.exit(asyncio.run(main()))
