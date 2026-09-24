"""Check-ins: weight and measurements as milestones (G10, the owner's review).

A check-in is everything a user measured on one day — weight, waist, chest,
body fat — read together, so the progress screen can say "since your first
check-in: −3.2 kg, −4 cm off your waist". The first one is the baseline
onboarding records. The next one is due `checkin_interval_days` after the
last, on the SERVER's calendar (I7).
"""
from __future__ import annotations

from datetime import UTC, datetime, timedelta

import pytest

pytestmark = pytest.mark.asyncio


async def _metric(client, key, value, unit, day: str):
    r = await client.post("/v1/body-metrics", json={
        "metric_key": key, "value": value, "unit": unit, "measured_at": f"{day}T08:00:00Z",
    })
    assert r.status_code == 201, r.text


async def _checkins(client):
    return (await client.get("/v1/body/checkins")).json()["data"]


async def test_a_new_account_has_no_checkins_and_one_is_due_now(auth_client):
    c = await _checkins(auth_client)
    assert c["checkins"] == [] and c["baseline"] is None
    assert c["interval_days"] == 7
    assert c["next_due"] == c["today"] and c["overdue"] is False


async def test_a_days_metrics_are_one_checkin_and_the_first_is_the_baseline(auth_client):
    await auth_client.patch("/v1/profile", json={"timezone": "UTC"})
    await _metric(auth_client, "body_weight", 84, "kg", "2026-09-01")
    await _metric(auth_client, "waist_cm", 92, "cm", "2026-09-01")
    await _metric(auth_client, "body_weight", 82.5, "kg", "2026-09-08")
    await _metric(auth_client, "waist_cm", 90, "cm", "2026-09-08")
    await _metric(auth_client, "chest_cm", 101, "cm", "2026-09-08")

    c = await _checkins(auth_client)
    assert [x["local_date"] for x in c["checkins"]] == ["2026-09-08", "2026-09-01"]   # newest first
    assert c["checkins"][0]["values"] == {"body_weight": 82.5, "waist_cm": 90, "chest_cm": 101}
    assert c["baseline"]["local_date"] == "2026-09-01"
    # Change since the baseline, for every metric the baseline also had.
    assert c["checkins"][0]["since_baseline"] == {"body_weight": -1.5, "waist_cm": -2}


async def test_the_next_checkin_is_due_one_interval_after_the_last(auth_client):
    await auth_client.patch("/v1/profile", json={"timezone": "UTC", "checkin_interval_days": 14})
    today = datetime.now(UTC).date()   # the profile is on UTC
    last = today - timedelta(days=3)
    await _metric(auth_client, "body_weight", 80, "kg", last.isoformat())
    c = await _checkins(auth_client)
    assert c["next_due"] == (last + timedelta(days=14)).isoformat()
    assert c["overdue"] is False


async def test_overdue_when_the_interval_has_passed(auth_client):
    await auth_client.patch("/v1/profile", json={"timezone": "UTC"})
    last = datetime.now(UTC).date() - timedelta(days=10)
    await _metric(auth_client, "body_weight", 80, "kg", last.isoformat())
    c = await _checkins(auth_client)
    assert c["overdue"] is True


async def test_only_your_own(auth_client, client):
    await _metric(auth_client, "body_weight", 80, "kg", "2026-09-01")
    other = await client.post("/v1/auth/register", json={
        "email": "other-checkins@example.com", "password": "correct-horse-battery"})
    client.headers["authorization"] = f"Bearer {other.json()['data']['access_token']}"
    assert (await client.get("/v1/body/checkins")).json()["data"]["checkins"] == []


@pytest.mark.parametrize("key,unit", [
    ("chest_cm", "cm"), ("hips_cm", "cm"), ("arm_cm", "cm"), ("thigh_cm", "cm"),
    ("waist_cm", "cm"), ("body_fat_pct", "%"), ("body_weight", "kg"),
])
async def test_every_measurement_reports_its_own_unit(auth_client, key, unit):
    # Found adding the onboarding baseline: only three keys were mapped, so a
    # chest measurement's trend came back labelled "kg".
    await _metric(auth_client, key, 50, unit, "2026-09-01")
    series = (await auth_client.get("/v1/analytics/body", params={"metric_key": key})).json()["data"]
    assert series["unit"] == unit
