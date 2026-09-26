"""H-14 · `GET /v1/analytics/nutrition` — a range of days, end to end (G10).

The arithmetic is pinned in test_nutrition_range.py. These pin the wiring: the
days come from the same daily summaries as the dashboard (so confirmed-only,
I2), every day of the range is listed, and the target is the profile's.
"""
from __future__ import annotations

import uuid
from datetime import UTC, datetime, time, timedelta

import pytest

from tests.auth import sign_up

pytestmark = pytest.mark.asyncio


def _data(response, expect: int = 200):
    assert response.status_code == expect, response.text
    return response.json()["data"]


async def _eat(client, day, kcal: float, protein: float, *, confirmed: bool = True):
    _data(await client.post("/v1/meals", json={
        "meal_type": "lunch",
        "consumed_at": datetime.combine(day, time(12), tzinfo=UTC).isoformat(),
        "items": [{"display_name": "Plate", "calories": kcal, "protein_g": protein,
                   "carbs_g": 100, "fat_g": 50, "confirmed": confirmed}],
    }, headers={"Idempotency-Key": str(uuid.uuid4())}), 201)


async def _setup(client):
    _data(await client.patch("/v1/profile", json={"timezone": "UTC", "daily_calorie_target": 2000}))
    return datetime.now(UTC).date()


async def test_a_week_of_days_with_averages_over_the_logged_ones(auth_client):
    today = await _setup(auth_client)
    start = today - timedelta(days=6)
    await _eat(auth_client, start, 1900, 150)
    await _eat(auth_client, start + timedelta(days=2), 2100, 170)
    await _eat(auth_client, today, 2600, 160)
    # A pending AI item on another day: a meal, not intake (D5).
    await _eat(auth_client, start + timedelta(days=4), 3000, 10, confirmed=False)

    body = _data(await auth_client.get("/v1/analytics/nutrition",
                                       params={"from": start.isoformat(), "to": today.isoformat()}))

    assert body["days"] == 7
    assert body["logged_days"] == 3
    assert body["enough_data"] is True
    assert body["averages"]["calories"] == pytest.approx(2200)
    assert body["target_kcal"] == 2000
    assert body["within_target_days"] == 2        # 1900 and 2100; 2600 is over
    assert len(body["daily"]) == 7
    assert body["daily"][1]["calories"] is None     # nothing logged: null, not 0
    assert body["daily"][4]["calories"] is None     # only a pending item


async def test_defaults_to_the_last_seven_days_ending_today(auth_client):
    today = await _setup(auth_client)
    body = _data(await auth_client.get("/v1/analytics/nutrition"))
    assert body["to"] == today.isoformat()
    assert body["days"] == 7
    assert body["enough_data"] is False
    assert body["averages"] is None


async def test_a_range_longer_than_a_quarter_is_refused(auth_client):
    today = await _setup(auth_client)
    r = await auth_client.get("/v1/analytics/nutrition", params={
        "from": (today - timedelta(days=200)).isoformat(), "to": today.isoformat()})
    assert r.status_code == 422


async def test_someone_else_sees_nothing_of_mine(auth_client, client):
    today = await _setup(auth_client)
    await _eat(auth_client, today, 2000, 150)
    other = _data(await sign_up(client, json={
        "email": f"other-{uuid.uuid4().hex[:8]}@example.com", "password": "correct-horse-battery"}), 201)
    body = _data(await client.get("/v1/analytics/nutrition",
                                  headers={"authorization": f"Bearer {other['access_token']}"}))
    assert body["logged_days"] == 0
