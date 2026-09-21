from __future__ import annotations

import pytest

pytestmark = pytest.mark.asyncio


async def test_profile_exists_immediately_after_register(auth_client):
    r = await auth_client.get("/v1/profile")
    assert r.status_code == 200
    data = r.json()["data"]
    assert data["preferred_unit_system"] == "metric"
    assert data["timezone"] == "UTC"
    assert data["onboarding_completed"] is False


async def test_patch_profile_applies_only_sent_fields(auth_client):
    r = await auth_client.patch("/v1/profile", json={"timezone": "Asia/Kolkata", "height_cm": 178})
    assert r.status_code == 200
    data = r.json()["data"]
    assert data["timezone"] == "Asia/Kolkata"
    assert data["height_cm"] == 178.0
    assert data["preferred_unit_system"] == "metric"   # untouched


async def test_unknown_timezone_is_rejected(auth_client):
    r = await auth_client.patch("/v1/profile", json={"timezone": "Mars/Olympus"})
    assert r.status_code == 422
    assert r.json()["error"]["fields"]["timezone"] == "Unknown time zone."


async def test_implausible_height_is_rejected(auth_client):
    r = await auth_client.patch("/v1/profile", json={"height_cm": 400})
    assert r.status_code == 422


async def test_calorie_target_floor_is_enforced(auth_client):
    assert (await auth_client.patch("/v1/profile", json={"daily_calorie_target": 500})).status_code == 422
    assert (await auth_client.patch("/v1/profile", json={"daily_calorie_target": 2340})).status_code == 200


async def test_create_and_list_goals(auth_client):
    payload = {
        "goal_type": "fat_loss", "metric_key": "body_weight", "direction": "down",
        "start_value": 78.4, "target_value": 74.0, "target_unit": "kg",
        "start_date": "2026-08-02", "target_date": "2026-11-30",
    }
    r = await auth_client.post("/v1/goals", json=payload)
    assert r.status_code == 201
    assert r.json()["data"]["target_value"] == 74.0

    listed = await auth_client.get("/v1/goals")
    assert listed.status_code == 200
    assert listed.json()["meta"]["total"] >= 1


async def test_target_date_must_follow_start_date(auth_client):
    r = await auth_client.post("/v1/goals", json={
        "goal_type": "fat_loss", "target_value": 74.0,
        "start_date": "2026-11-30", "target_date": "2026-08-02",
    })
    assert r.status_code == 422
    assert "after the start date" in r.json()["error"]["message"]


async def test_multiple_active_goals_are_allowed(auth_client):
    for target, gtype in ((74.0, "fat_loss"), (110.0, "strength")):
        r = await auth_client.post("/v1/goals", json={
            "goal_type": gtype, "target_value": target, "start_date": "2026-09-01",
        })
        assert r.status_code == 201
    active = await auth_client.get("/v1/goals", params={"status": "active"})
    assert active.json()["meta"]["total"] >= 2


async def test_cannot_read_another_users_goal(client, auth_client):
    created = await auth_client.post("/v1/goals", json={
        "goal_type": "fat_loss", "target_value": 74.0, "start_date": "2026-09-01",
    })
    goal_id = created.json()["data"]["id"]

    import uuid
    other = await client.post("/v1/auth/register", json={
        "email": f"other-{uuid.uuid4().hex[:8]}@example.com", "password": "correct-horse-battery",
    })
    token = other.json()["data"]["access_token"]

    r = await auth_client.get(f"/v1/goals/{goal_id}", headers={"authorization": f"Bearer {token}"})
    assert r.status_code == 403
    assert r.json()["error"]["code"] == "FORBIDDEN"
