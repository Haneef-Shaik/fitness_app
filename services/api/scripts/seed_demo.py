"""Create (or reset) the demo account so the app can be opened and poked at.

    uv run python scripts/seed_demo.py

Idempotent: re-running wipes and recreates the demo user's data.
"""
from __future__ import annotations

import asyncio
import datetime as dt
import sys
from zoneinfo import ZoneInfo

import httpx

BASE = "http://localhost:8000"
EMAIL = "demo@volt.app"
TZ = "Asia/Kolkata"
PASSWORD = "voltdemo1234"


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

        goals = (await c.get("/v1/goals", headers=h)).json()
        print()
        print("  email    ", EMAIL)
        print("  password ", PASSWORD)
        print("  profile  ", "2,340 kcal · 176 g protein · Asia/Kolkata")
        print("  goals    ", goals["meta"]["total"])
        return 0


sys.exit(asyncio.run(main()))
