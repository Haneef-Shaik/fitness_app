"""The store-screenshot account: eight weeks of believable use, ending today.

    uv run python scripts/seed_screenshots.py

The demo account is what the acceptance flows run against, so it collects
whatever they log — a dashboard reading "-1,005 kcal left" is not a store
screenshot. This one is separate and tells one plausible story: a lifter three
sessions a week on the demo's Push / Pull / Legs program, loads creeping up,
weighing in most mornings and two-thirds through today's food.

Everything goes through the public API, and the training history through the
real Strong importer (a generated CSV), so the screenshots show what a user
switching from Strong would see — volumes and records computed by the domain,
not written by hand. Idempotent: the importer keys each workout, and weigh-ins
and meals carry fixed client ids, so a re-run adds nothing it already added.

Local only: it refuses an https API. `scripts/store-screenshots.sh` runs it.
"""
from __future__ import annotations

import asyncio
import csv
import datetime as dt
import io
import os
import random
import sys
import uuid
from zoneinfo import ZoneInfo

import httpx
from seed_demo import SPLIT, _catalog, _seed_program
from supabase_signin import access_token

BASE = os.environ.get("FITLOG_API", "http://localhost:8000").rstrip("/")
EMAIL = os.environ.get("STORE_EMAIL", "store@fitlog.app")
PASSWORD = os.environ.get("STORE_PASSWORD", "fitlogstore1234")
TZ = os.environ.get("STORE_TIMEZONE", "Asia/Kolkata")
if BASE.startswith("https://"):
    sys.exit("seed_screenshots.py is for a local API; the story it writes is made up.")

#: Fixed, so every run derives the same client ids and the same noise.
NAMESPACE = uuid.UUID("5f1c8a52-7a39-4a5e-9d0e-3d2b3c8f6b11")
WEEKS = 8

# Working loads per occurrence of the day, oldest first — slow, uneven progress,
# the way it really goes. (warm-up, working sets, reps per working set)
PUSH, PULL, LEGS = SPLIT
PROGRESSION: dict[str, list[tuple[str, list[float | None], list[int]]]] = {
    PUSH: [
        ("Barbell Bench Press", [72.5, 72.5, 75, 77.5, 77.5, 80, 82.5, 82.5], [8, 8, 7]),
        ("Overhead Press", [40, 40, 42.5, 42.5, 45, 45, 47.5, 47.5], [9, 8, 8]),
        ("Triceps Pushdown", [25, 25, 27.5, 27.5, 30, 30, 32.5, 32.5], [12, 12, 11]),
    ],
    PULL: [
        ("Deadlift", [120, 125, 130, 132.5, 135, 140, 142.5, 145], [5, 5, 5]),
        ("Pull-Up", [None] * 8, [7, 6, 6, 5]),
        ("Barbell Row", [60, 60, 62.5, 65, 65, 67.5, 70, 70], [8, 8, 8]),
    ],
    LEGS: [
        ("Back Squat", [95, 97.5, 100, 102.5, 105, 107.5, 110, 112.5], [6, 6, 6, 5]),
        ("Romanian Deadlift", [75, 77.5, 80, 82.5, 85, 85, 87.5, 90], [8, 8, 8]),
    ],
}
WARMUPS = {"Barbell Bench Press": 40.0, "Deadlift": 60.0, "Back Squat": 50.0}

# Today, two-thirds through: ~1,550 of 2,340 kcal, protein on its way.
MEALS = [
    ("breakfast", (8, 20), [("rolled oats", 80), ("whole milk", 250), ("banana", 120)]),
    ("lunch", (13, 15), [("chicken breast", 180), ("white rice", 250), ("broccoli", 150)]),
    ("snack", (16, 40), [("greek yogurt", 250), ("almonds", 30)]),
]


def training_days(today: dt.date) -> list[tuple[dt.date, str]]:
    """Three sessions a week for WEEKS weeks, the last one two days ago."""
    gaps = [2, 2, 3]  # Mon / Wed / Fri, then the weekend
    days: list[dt.date] = []
    day = today - dt.timedelta(days=2)
    for i in range(WEEKS * 3):
        days.append(day)
        day -= dt.timedelta(days=gaps[i % 3])
    days.reverse()
    return [(d, SPLIT_ORDER[i % 3]) for i, d in enumerate(days)]


SPLIT_ORDER = [PUSH, PULL, LEGS]


def strong_csv(today: dt.date) -> str:
    """The history as Strong exports it: one row per set, grouped by date + name."""
    out = io.StringIO()
    w = csv.writer(out)
    w.writerow(["Date", "Workout Name", "Duration", "Exercise Name", "Set Order",
                "Weight", "Reps", "Distance", "Seconds", "Notes", "Workout Notes", "RPE"])
    seen: dict[str, int] = {}
    for day, name in training_days(today):
        k = seen.get(name, 0)
        seen[name] = k + 1
        started = dt.datetime.combine(day, dt.time(18, 30 + (k % 3) * 5))
        stamp = started.strftime("%Y-%m-%d %H:%M:%S")
        duration = f"{55 + (k * 7) % 20}m"
        for exercise, loads, reps in PROGRESSION[name]:
            order = 1
            if exercise in WARMUPS:
                w.writerow([stamp, name, duration, exercise, "W", WARMUPS[exercise], 10, "", "", "", "", ""])
            for r in reps:
                load = loads[k]
                w.writerow([stamp, name, duration, exercise, order,
                            "" if load is None else load, r + (1 if load is None and k >= 5 else 0),
                            "", "", "", "", ""])
                order += 1
    return out.getvalue()


def weigh_ins(today: dt.date) -> list[tuple[dt.date, float]]:
    """Most mornings, 83 kg drifting to ~79.6 with the day-to-day noise a real scale shows."""
    rng = random.Random(7)
    rows = []
    for days_ago in range(WEEKS * 7, -1, -1):
        if days_ago and days_ago % 4 == 3:  # a skipped morning now and then
            continue
        trend = 83.0 - 3.4 * (1 - days_ago / (WEEKS * 7))
        rows.append((today - dt.timedelta(days=days_ago), round(trend + rng.uniform(-0.45, 0.45), 1)))
    return rows


def cid(*parts: object) -> str:
    return str(uuid.uuid5(NAMESPACE, "/".join(map(str, parts))))


async def _sign_in(c: httpx.AsyncClient) -> dict[str, str]:
    # Supabase Auth (docs/14): made there if missing; the first call makes the
    # FitLog account.
    token = access_token(EMAIL, PASSWORD, create=True, metadata={"display_name": "Alex"})
    h = {"authorization": f"Bearer {token}"}
    (await c.get("/v1/auth/me", headers=h)).raise_for_status()
    return h


async def _food(c: httpx.AsyncClient, h: dict[str, str], query: str) -> str:
    rows = (await c.get("/v1/foods", headers=h, params={"q": query, "limit": 5})).json()["data"]
    # The curated staples have the plain names ("Banana", not "Bananas, raw").
    pick = next((f for f in rows if f.get("source") == "internal"), rows[0] if rows else None)
    if pick is None:
        raise SystemExit(f"no food matches {query!r} — run scripts/seed_catalog.py first")
    return pick["id"]


async def main() -> int:
    tz = ZoneInfo(TZ)
    today = dt.datetime.now(tz).date()
    async with httpx.AsyncClient(base_url=BASE, timeout=60) as c:
        h = await _sign_in(c)
        await c.patch("/v1/profile", headers=h, json={
            "display_name": "Alex", "height_cm": 178, "timezone": TZ,
            "preferred_unit_system": "metric", "activity_level": "moderate",
            "daily_calorie_target": 2340, "protein_g_target": 176,
            "carbs_g_target": 234, "fat_g_target": 78, "onboarding_completed": True,
        })

        if not (await c.get("/v1/goals", headers=h)).json()["data"]:
            await c.post("/v1/goals", headers=h, json={
                "goal_type": "fat_loss", "metric_key": "body_weight", "direction": "down",
                "start_value": 83.0, "target_value": 77.0, "target_unit": "kg",
                "start_date": str(today - dt.timedelta(days=WEEKS * 7)),
                "target_date": str(today + dt.timedelta(days=42)),
            })

        # A run that failed mid-workout leaves one open, and the app then opens
        # on "You left a workout open" instead of the dashboard.
        open_session = (await c.get("/v1/workout-sessions/active", headers=h)).json()["data"]
        if open_session:
            await c.post(f"/v1/workout-sessions/{open_session['id']}/cancel", headers=h)

        await _seed_program(c, h, await _catalog(c, h))

        r = await c.post("/v1/imports/workouts", headers=h, json={
            "csv": strong_csv(today), "format": "strong", "weight_unit": "kg", "dry_run": False,
        })
        r.raise_for_status()
        report = r.json()["data"]

        for day, kg in weigh_ins(today):
            at = dt.datetime.combine(day, dt.time(7, 5), tz)
            r = await c.post("/v1/body-metrics", headers=h, json={
                "metric_key": "body_weight", "value": kg, "unit": "kg",
                "measured_at": at.isoformat(), "client_id": cid("weight", day),
            })
            r.raise_for_status()

        for meal_type, (hour, minute), items in MEALS:
            payload = [{"food_id": await _food(c, h, q), "quantity_grams": g} for q, g in items]
            r = await c.post("/v1/meals", headers=h, json={
                "meal_type": meal_type, "client_id": cid("meal", today, meal_type),
                "consumed_at": dt.datetime.combine(today, dt.time(hour, minute), tz).isoformat(),
                "items": payload,
            })
            r.raise_for_status()

    print(f"  email     {EMAIL}")
    print(f"  password  {PASSWORD}")
    print(f"  workouts  {report}")
    print(f"  weigh-ins {len(weigh_ins(today))} over {WEEKS} weeks")
    print(f"  meals     {len(MEALS)} today")
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
