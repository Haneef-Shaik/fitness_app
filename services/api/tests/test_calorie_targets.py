"""Q8 · calorie targets are versioned (G10).

H-15 promises: "Changing targets affects today onward. Your past days keep the
numbers they had." Until now a target was one column on the profile, so
changing it rewrote every past day's meter — Tuesday's 2,000 kcal looked like
a failure against a 1,800 target set on Friday.
"""
from __future__ import annotations

import uuid
from datetime import UTC, datetime, time, timedelta

import pytest
from sqlalchemy import update

from app.models import CalorieTarget

pytestmark = pytest.mark.asyncio


def _data(response, expect: int = 200):
    assert response.status_code == expect, response.text
    return response.json()["data"]


async def _set(client, kcal: int, protein: int = 150):
    return _data(await client.patch("/v1/profile", json={
        "timezone": "UTC", "daily_calorie_target": kcal, "protein_g_target": protein,
        "carbs_g_target": 200, "fat_g_target": 70,
    }))


async def _backdate(client, db, days: int):
    """Move this user's recorded targets `days` into the past, as if set then."""
    me = _data(await client.get("/v1/auth/me"))
    await db.execute(update(CalorieTarget).where(CalorieTarget.user_id == uuid.UUID(me["id"])).values(
        effective_from=CalorieTarget.effective_from - timedelta(days=days)))
    await db.commit()


async def test_a_past_day_keeps_the_target_it_had(auth_client, db):
    today = datetime.now(UTC).date()
    await _set(auth_client, 2000)
    await _backdate(auth_client, db, 5)
    await _set(auth_client, 1800)               # changed today

    past = _data(await auth_client.get("/v1/nutrition/day", params={"date": str(today - timedelta(days=2))}))
    now = _data(await auth_client.get("/v1/nutrition/day", params={"date": str(today)}))
    assert past["targets"]["calories"] == 2000
    assert now["targets"]["calories"] == 1800


async def test_changing_twice_in_a_day_keeps_the_last(auth_client):
    today = datetime.now(UTC).date()
    await _set(auth_client, 2000)
    await _set(auth_client, 2100, protein=160)
    day = _data(await auth_client.get("/v1/nutrition/day", params={"date": str(today)}))
    assert day["targets"] == {"calories": 2100, "protein_g": 160, "carbs_g": 200, "fat_g": 70}


async def test_a_day_before_any_target_has_none(auth_client):
    today = datetime.now(UTC).date()
    await _set(auth_client, 2000)
    day = _data(await auth_client.get("/v1/nutrition/day", params={"date": str(today - timedelta(days=3))}))
    assert day["targets"] is None


async def test_a_profile_edit_that_does_not_touch_targets_records_nothing(auth_client, db):
    await _set(auth_client, 2000)
    _data(await auth_client.patch("/v1/profile", json={"display_name": "Sam"}))
    me = _data(await auth_client.get("/v1/auth/me"))
    rows = (await db.execute(CalorieTarget.__table__.select().where(
        CalorieTarget.user_id == uuid.UUID(me["id"])))).all()
    assert len(rows) == 1


async def test_analytics_judge_each_day_against_its_own_target(auth_client, db):
    today = datetime.now(UTC).date()
    await _set(auth_client, 2000)
    await _backdate(auth_client, db, 6)
    await _set(auth_client, 1500)
    for i, kcal in [(4, 2000), (3, 2050), (0, 1500)]:
        d = today - timedelta(days=i)
        _data(await auth_client.post("/v1/meals", json={
            "meal_type": "lunch",
            "consumed_at": datetime.combine(d, time(12), tzinfo=UTC).isoformat(),
            "items": [{"display_name": "Plate", "calories": kcal, "protein_g": 100, "carbs_g": 100, "fat_g": 50}],
        }, headers={"Idempotency-Key": str(uuid.uuid4())}), 201)
    body = _data(await auth_client.get("/v1/analytics/nutrition", params={
        "from": str(today - timedelta(days=6)), "to": str(today)}))
    # Against one flat 1,500 target only today would count; against their own, all three do.
    assert body["within_target_days"] == 3
    assert body["target_kcal"] == 1500
