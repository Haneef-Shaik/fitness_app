"""The richer onboarding (A-07, extended after the owner's review in G10).

Onboarding used to ask for units and an activity level, then show a calorie
target computed from a HARD-CODED BMR of 1,680 — the same number for everyone.
It now collects what a target and a program recommendation actually depend on,
and these tests pin that the server keeps it.
"""
from __future__ import annotations

import pytest

pytestmark = pytest.mark.asyncio


async def test_training_profile_round_trips(auth_client):
    r = await auth_client.patch("/v1/profile", json={
        "training_experience": "beginner", "training_days_per_week": 3,
        "session_minutes": 60, "equipment": "full_gym", "checkin_interval_days": 14,
    })
    assert r.status_code == 200, r.text
    p = (await auth_client.get("/v1/profile")).json()["data"]
    assert (p["training_experience"], p["training_days_per_week"], p["session_minutes"],
            p["equipment"], p["checkin_interval_days"]) == ("beginner", 3, 60, "full_gym", 14)


async def test_a_new_profile_checks_in_weekly_and_has_no_training_answers_yet(auth_client):
    p = (await auth_client.get("/v1/profile")).json()["data"]
    assert p["checkin_interval_days"] == 7
    assert p["training_experience"] is None and p["equipment"] is None


@pytest.mark.parametrize("field,value", [
    ("training_experience", "expert"),
    ("training_days_per_week", 0),
    ("training_days_per_week", 8),
    ("session_minutes", 5),
    ("equipment", "a rock"),
    ("checkin_interval_days", 0),
    ("checkin_interval_days", 60),
])
async def test_rejects_nonsense(auth_client, field, value):
    r = await auth_client.patch("/v1/profile", json={field: value})
    assert r.status_code == 422, (field, value, r.text)


async def test_a_goal_can_carry_its_pace(auth_client):
    r = await auth_client.post("/v1/goals", json={
        "goal_type": "fat_loss", "direction": "down", "start_value": 84, "target_value": 76,
        "target_unit": "kg", "start_date": "2026-09-23", "weekly_rate": 0.5,
    })
    assert r.status_code == 201, r.text
    assert r.json()["data"]["weekly_rate"] == 0.5


@pytest.mark.parametrize("rate", [0, -0.5, 2.5])
async def test_pace_must_be_a_sane_positive_rate(auth_client, rate):
    r = await auth_client.post("/v1/goals", json={
        "goal_type": "fat_loss", "direction": "down", "start_value": 84, "target_value": 76,
        "target_unit": "kg", "start_date": "2026-09-23", "weekly_rate": rate,
    })
    assert r.status_code == 422, (rate, r.text)
