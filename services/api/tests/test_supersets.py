"""E-13 · Supersets and circuits.

A superset is exercises that share a group number within one plan day or one
session. The plan says so, the session inherits it at start (I1: frozen, like
the rest of the prescription), and it can be changed mid-workout.
"""
from __future__ import annotations

import pytest

pytestmark = pytest.mark.asyncio


def _data(response, expect: int = 200):
    assert response.status_code == expect, response.text
    return response.json()["data"]


async def _day_with_a_superset(client):
    p = _data(await client.post("/v1/workout-programs", json={"name": "Arms"}), 201)
    p = _data(await client.post(f"/v1/workout-programs/{p['id']}/days", json={"name": "Arms"}), 201)
    day_id = p["days"][0]["id"]
    ex = [e["id"] for e in _data(await client.get("/v1/exercises", params={"limit": 50}))[:3]]
    out = _data(await client.put(f"/v1/plan-days/{day_id}/exercises", json=[
        {"exercise_id": ex[0], "target_sets": 3, "superset_group": 1, "rest_seconds": 90},
        {"exercise_id": ex[1], "target_sets": 3, "superset_group": 1, "rest_seconds": 90},
        {"exercise_id": ex[2], "target_sets": 3},
    ]))
    return day_id, out


async def test_a_plan_day_keeps_its_supersets(auth_client):
    _, program = await _day_with_a_superset(auth_client)
    groups = [e["superset_group"] for e in program["days"][0]["exercises"]]
    assert groups == [1, 1, None]


async def test_a_session_started_from_the_plan_inherits_them(auth_client):
    day_id, _ = await _day_with_a_superset(auth_client)
    s = _data(await auth_client.post("/v1/workout-sessions", json={"plan_day_id": day_id}), 201)
    assert [e["superset_group"] for e in s["exercises"]] == [1, 1, None]


async def test_a_superset_can_be_made_mid_workout(auth_client):
    day_id, _ = await _day_with_a_superset(auth_client)
    s = _data(await auth_client.post("/v1/workout-sessions", json={"plan_day_id": day_id}), 201)
    third = s["exercises"][2]["id"]

    out = _data(await auth_client.patch(f"/v1/session-exercises/{third}", json={"superset_group": 1}))
    assert [e["superset_group"] for e in out["exercises"]] == [1, 1, 1]


async def test_repeating_a_session_repeats_its_supersets(auth_client):
    day_id, _ = await _day_with_a_superset(auth_client)
    s = _data(await auth_client.post("/v1/workout-sessions", json={"plan_day_id": day_id}), 201)
    _data(await auth_client.post(f"/v1/workout-sessions/{s['id']}/cancel", json={}))
    again = _data(await auth_client.post("/v1/workout-sessions", json={"repeat_session_id": s["id"]}), 201)
    assert [e["superset_group"] for e in again["exercises"]] == [1, 1, None]


@pytest.mark.parametrize("group", [0, 10])
async def test_a_group_number_is_between_1_and_9(auth_client, group):
    day_id, _ = await _day_with_a_superset(auth_client)
    ex = _data(await auth_client.get("/v1/exercises", params={"limit": 1}))[0]["id"]
    r = await auth_client.put(f"/v1/plan-days/{day_id}/exercises",
                              json=[{"exercise_id": ex, "superset_group": group}])
    assert r.status_code == 422


async def test_duplicating_a_program_keeps_the_whole_prescription(auth_client):
    day_id, program = await _day_with_a_superset(auth_client)
    ex = _data(await auth_client.get("/v1/exercises", params={"limit": 1}))[0]["id"]
    _data(await auth_client.put(f"/v1/plan-days/{day_id}/exercises", json=[
        {"exercise_id": ex, "target_duration_seconds": 60, "superset_group": 2},
    ]))
    copy = _data(await auth_client.post(f"/v1/workout-programs/{program['id']}/duplicate"), 201)
    pe = copy["days"][0]["exercises"][0]
    assert pe["target_duration_seconds"] == 60
    assert pe["superset_group"] == 2
