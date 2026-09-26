"""MyFitnessPal's nutrition export → the diary, as honest per-meal totals."""
from __future__ import annotations

import pytest

pytestmark = pytest.mark.asyncio

MFP = """Date,Meal,Calories,Fat (g),Saturated Fat,Polyunsaturated Fat,Monounsaturated Fat,Trans Fat,Cholesterol,Sodium (mg),Potassium,Carbohydrates (g),Fiber,Sugar,Protein (g),Vitamin A,Vitamin C,Calcium,Iron,Note
2025-02-10,Breakfast,420,12,,,,,,,,55,6,,24,,,,,
2025-02-10,Lunch,650,20,,,,,,,,70,8,,45,,,,,
2025-02-10,Snacks,180,9,,,,,,,,20,2,,6,,,,,
2025-02-11,Dinner,,,,,,,,,,,,,,,,,,
"""


def _data(response, expect: int = 200):
    assert response.status_code == expect, response.text
    return response.json()["data"]


async def test_a_dry_run_counts_meals_and_names_what_was_skipped(auth_client):
    out = _data(await auth_client.post("/v1/imports/nutrition", json={"csv": MFP}))
    assert out["meals_new"] == 3
    assert out["skipped_rows"] == {"rows without calories": 1}
    day = _data(await auth_client.get("/v1/nutrition/day", params={"date": "2025-02-10"}))
    assert day["calories"] == 0


async def test_importing_fills_the_day_and_is_idempotent(auth_client):
    body = {"csv": MFP, "dry_run": False}
    _data(await auth_client.post("/v1/imports/nutrition", json=body))
    again = _data(await auth_client.post("/v1/imports/nutrition", json=body))
    assert again["meals_new"] == 0 and again["meals_already_imported"] == 3

    day = _data(await auth_client.get("/v1/nutrition/day", params={"date": "2025-02-10"}))
    assert day["calories"] == 1250
    assert day["protein_g"] == 75


async def test_a_workout_export_is_not_a_nutrition_export(auth_client):
    r = await auth_client.post("/v1/imports/nutrition", json={"csv": "Date,Workout Name\n2025-01-01,Push\n"})
    assert r.status_code == 422
    assert "MyFitnessPal" in r.json()["error"]["message"]
