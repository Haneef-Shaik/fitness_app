"""Importing a Strong or Hevy export end to end: matched, idempotent, and counted
by the same rules as a workout logged here."""
from __future__ import annotations

import pytest

from app.services.workout_import import candidates

pytestmark = pytest.mark.asyncio

STRONG = """Date,Workout Name,Duration,Exercise Name,Set Order,Weight,Reps,Distance,Seconds,Notes,Workout Notes,RPE
2025-03-01 07:30:00,Push Day,1h 5m,Bench Press (Barbell),W,40,12,0,0,,,
2025-03-01 07:30:00,Push Day,1h 5m,Bench Press (Barbell),1,80,8,0,0,,,
2025-03-01 07:30:00,Push Day,1h 5m,Zercher Carry Thing,1,60,0,20,0,,,
2025-03-08 07:30:00,Push Day,1h,Bench Press (Barbell),1,85,5,0,0,,,
"""


def _data(response, expect: int = 200):
    assert response.status_code == expect, response.text
    return response.json()["data"]


def test_bracketed_equipment_is_tried_first_then_the_bare_name():
    assert candidates("Bench Press (Barbell)") == [
        "bench press (barbell)", "barbell bench press", "bench press",
    ]
    assert candidates("Pull Up (Bodyweight)") == ["pull up (bodyweight)", "pull up"]


async def test_a_dry_run_says_what_will_happen_and_writes_nothing(auth_client):
    out = _data(await auth_client.post("/v1/imports/workouts", json={"csv": STRONG}))
    assert out["dry_run"] is True
    assert out["sessions_new"] == 2
    assert out["exercises_matched"] == {"Bench Press (Barbell)": "Barbell Bench Press"}
    assert out["exercises_to_create"] == ["Zercher Carry Thing"]

    history = _data(await auth_client.get("/v1/history/workouts"))
    assert history == []


async def test_importing_creates_history_records_and_a_custom_exercise(auth_client):
    out = _data(await auth_client.post(
        "/v1/imports/workouts", json={"csv": STRONG, "dry_run": False},
    ))
    assert out["exercises_created"] == ["Zercher Carry Thing"]

    history = _data(await auth_client.get("/v1/history/workouts"))
    assert len(history) == 2
    first = min(history, key=lambda s: s["local_date"])
    assert first["local_date"] == "2025-03-01"
    # Warm-ups excluded (D6): 80 × 8 only.
    assert first["total_volume_kg"] == 640

    exercises = _data(await auth_client.get("/v1/exercises", params={"q": "Zercher", "limit": 5}))
    assert any(e["name"] == "Zercher Carry Thing" and e["is_custom"] for e in exercises)


async def test_the_same_file_twice_adds_nothing(auth_client):
    body = {"csv": STRONG, "dry_run": False}
    _data(await auth_client.post("/v1/imports/workouts", json=body))
    again = _data(await auth_client.post("/v1/imports/workouts", json=body))

    assert again["sessions_new"] == 0
    assert again["sessions_already_imported"] == 2
    assert len(_data(await auth_client.get("/v1/history/workouts"))) == 2


async def test_something_that_is_not_an_export_is_refused_in_words(auth_client):
    r = await auth_client.post("/v1/imports/workouts", json={"csv": "a,b\n1,2\n"})
    assert r.status_code == 422
    assert "Strong or Hevy" in r.json()["error"]["message"]
