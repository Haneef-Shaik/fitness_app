"""K-04 · Logging preferences.

The most consequential one is D6's promise: warm-ups are excluded from volume
**by default, and the user may count them**. A preference that changed only new
sessions would leave last month's totals disagreeing with this month's for the
same work, so flipping it recounts the stored totals too.
"""
from __future__ import annotations

import uuid

import pytest

from app.domain.training import WorkoutSet, set_volume_kg, total_volume_kg

pytestmark = pytest.mark.asyncio


def _data(response, expect: int = 200):
    assert response.status_code == expect, response.text
    return response.json()["data"]


# ----------------------------------------------------------------- domain

def test_a_warmup_counts_only_when_asked():
    w = WorkoutSet(set_type="warmup", load_kg=60, reps=10, completed=True)
    assert set_volume_kg(w) == 0
    assert set_volume_kg(w, include_warmups=True) == 600


def test_an_incomplete_set_never_counts_whatever_the_preference():
    w = WorkoutSet(set_type="warmup", load_kg=60, reps=10, completed=False)
    assert set_volume_kg(w, include_warmups=True) == 0


def test_total_passes_the_preference_through():
    sets = [
        WorkoutSet(set_type="warmup", load_kg=60, reps=10, completed=True),
        WorkoutSet(set_type="working", load_kg=100, reps=5, completed=True),
    ]
    assert total_volume_kg(sets) == 500
    assert total_volume_kg(sets, include_warmups=True) == 1100


# ---------------------------------------------------------------- profile

async def test_the_defaults_are_the_documented_ones(auth_client):
    p = _data(await auth_client.get("/v1/profile"))
    assert p["warmups_in_volume"] is False
    assert p["show_rpe"] is False
    assert p["show_rir"] is False
    assert p["default_rest_seconds"] is None
    assert p["load_step_kg"] == 2.5
    assert p["bar_weight_kg"] == 20
    assert p["plate_inventory_kg"] == [25, 20, 15, 10, 5, 2.5, 1.25]


async def test_preferences_can_be_changed(auth_client):
    p = _data(await auth_client.patch("/v1/profile", json={
        "show_rpe": True, "default_rest_seconds": 120, "load_step_kg": 1.25,
        "bar_weight_kg": 15, "plate_inventory_kg": [20, 10, 5, 1.25],
    }))
    assert p["show_rpe"] is True
    assert p["default_rest_seconds"] == 120
    assert p["load_step_kg"] == 1.25
    assert p["bar_weight_kg"] == 15
    assert p["plate_inventory_kg"] == [20, 10, 5, 1.25]


@pytest.mark.parametrize("body", [
    {"load_step_kg": 0},
    {"default_rest_seconds": 5},
    {"bar_weight_kg": -1},
    {"plate_inventory_kg": []},
    {"plate_inventory_kg": [0]},
    {"plate_inventory_kg": [20] * 20},
])
async def test_nonsense_is_refused(auth_client, body):
    r = await auth_client.patch("/v1/profile", json=body)
    assert r.status_code == 422, r.text


# --------------------------------------------------- warm-ups and volume

async def _finished_session_with_a_warmup(client) -> str:
    rows = _data(await client.get("/v1/exercises", params={"limit": 50}))
    s = _data(await client.post(
        "/v1/workout-sessions", json={"exercise_ids": [rows[0]["id"]]}
    ), 201)
    se_id = s["exercises"][0]["id"]
    for body in (
        {"set_type": "warmup", "reps": 10, "load_kg": 60},
        {"set_type": "working", "reps": 5, "load_kg": 100},
    ):
        key = str(uuid.uuid4())
        _data(await client.post(
            f"/v1/session-exercises/{se_id}/sets", json={**body, "client_id": key},
            headers={"Idempotency-Key": key},
        ), 201)
    _data(await client.post(f"/v1/workout-sessions/{s['id']}/finish", json={}))
    return s["id"]


async def test_warmups_are_left_out_by_default(auth_client):
    sid = await _finished_session_with_a_warmup(auth_client)
    assert _data(await auth_client.get(f"/v1/workout-sessions/{sid}"))["total_volume_kg"] == 500


async def test_counting_warmups_recounts_past_sessions_and_analytics(auth_client):
    sid = await _finished_session_with_a_warmup(auth_client)

    _data(await auth_client.patch("/v1/profile", json={"warmups_in_volume": True}))

    assert _data(await auth_client.get(f"/v1/workout-sessions/{sid}"))["total_volume_kg"] == 1100
    analytics = _data(await auth_client.get("/v1/analytics/workouts", params={"group_by": "week"}))
    assert analytics["total_volume_kg"] == 1100

    _data(await auth_client.patch("/v1/profile", json={"warmups_in_volume": False}))
    assert _data(await auth_client.get(f"/v1/workout-sessions/{sid}"))["total_volume_kg"] == 500


async def test_a_new_session_is_counted_by_the_current_preference(auth_client):
    _data(await auth_client.patch("/v1/profile", json={"warmups_in_volume": True}))
    sid = await _finished_session_with_a_warmup(auth_client)
    assert _data(await auth_client.get(f"/v1/workout-sessions/{sid}"))["total_volume_kg"] == 1100
