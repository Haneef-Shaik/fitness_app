"""Mid-session mutation endpoints — E-02's swap, remove and reorder (G3).

Four endpoints declared in docs/02 §7 and missing until now. All four are things
a user does *during* a workout, so all four must leave the session coherent:
`order_index` dense, `set_index` dense, and I1 intact — the plan is never touched.
"""
from __future__ import annotations

import uuid

import pytest

from tests.auth import sign_up

pytestmark = pytest.mark.asyncio


def _data(response, expect: int = 200):
    assert response.status_code == expect, response.text
    return response.json()["data"]


async def _exercise_ids(client, n=3) -> list[str]:
    rows = _data(await client.get("/v1/exercises", params={"limit": 50}))
    return [e["id"] for e in rows[:n]]


async def _session(client, n=3):
    ex = await _exercise_ids(client, n)
    return _data(await client.post("/v1/workout-sessions", json={"exercise_ids": ex}), 201)


async def _post_set(client, se_id, payload, expect=201):
    return _data(
        await client.post(
            f"/v1/session-exercises/{se_id}/sets", json=payload,
            headers={"Idempotency-Key": str(uuid.uuid4())},
        ),
        expect,
    )


# ------------------------------------------- PATCH /session-exercises/{id}

async def test_a_session_exercise_can_be_annotated(auth_client):
    s = await _session(auth_client, 1)
    se_id = s["exercises"][0]["id"]

    out = _data(await auth_client.patch(
        f"/v1/session-exercises/{se_id}", json={"notes": "Felt heavy, dropped the last set."}
    ))

    se = next(e for e in out["exercises"] if e["id"] == se_id)
    assert se["notes"] == "Felt heavy, dropped the last set."


async def test_a_session_exercise_can_be_skipped_without_losing_its_sets(auth_client):
    """Skipping is a statement about intent, not a delete. Anything already
    logged against it stays logged."""
    s = await _session(auth_client, 1)
    se_id = s["exercises"][0]["id"]
    await _post_set(auth_client, se_id, {"reps": 8, "load_kg": 60})

    out = _data(await auth_client.patch(f"/v1/session-exercises/{se_id}", json={"skipped": True}))

    se = next(e for e in out["exercises"] if e["id"] == se_id)
    assert se["skipped"] is True
    assert len(se["sets"]) == 1


async def test_patching_another_users_session_exercise_is_refused(auth_client, client):
    s = await _session(auth_client, 1)
    se_id = s["exercises"][0]["id"]

    other = _data(await sign_up(client, json={
        "email": f"o-{uuid.uuid4().hex[:8]}@example.com", "password": "correct-horse-battery",
    }), 201)
    client.headers["authorization"] = f"Bearer {other['access_token']}"

    r = await client.patch(f"/v1/session-exercises/{se_id}", json={"notes": "mine now"})
    assert r.status_code in (403, 404), r.text


# ------------------------------------------ DELETE /session-exercises/{id}

async def test_removing_an_exercise_redensifies_the_order(auth_client):
    """W04.6 — a gap in order_index is what makes a reorder walk rows through
    values their neighbours still hold."""
    s = await _session(auth_client, 3)
    middle = s["exercises"][1]["id"]

    out = _data(await auth_client.delete(f"/v1/session-exercises/{middle}"))

    assert [e["order_index"] for e in out["exercises"]] == [0, 1]
    assert middle not in [e["id"] for e in out["exercises"]]


async def test_removing_an_exercise_removes_its_sets(auth_client):
    s = await _session(auth_client, 2)
    se_id = s["exercises"][0]["id"]
    await _post_set(auth_client, se_id, {"reps": 8, "load_kg": 60})

    out = _data(await auth_client.delete(f"/v1/session-exercises/{se_id}"))

    assert all(e["id"] != se_id for e in out["exercises"])
    assert len(out["exercises"]) == 1


async def test_removing_the_last_exercise_leaves_a_valid_empty_session(auth_client):
    s = await _session(auth_client, 1)

    out = _data(await auth_client.delete(f"/v1/session-exercises/{s['exercises'][0]['id']}"))

    assert out["exercises"] == []
    assert out["status"] == "in_progress"


# --------------------------- PUT /workout-sessions/{id}/exercises/order

async def test_exercises_can_be_reordered_in_one_call(auth_client):
    s = await _session(auth_client, 3)
    ids = [e["id"] for e in s["exercises"]]
    reversed_ids = list(reversed(ids))

    out = _data(await auth_client.put(
        f"/v1/workout-sessions/{s['id']}/exercises/order", json=reversed_ids
    ))

    assert [e["id"] for e in out["exercises"]] == reversed_ids
    assert [e["order_index"] for e in out["exercises"]] == [0, 1, 2]


async def test_reordering_keeps_every_set_with_its_exercise(auth_client):
    s = await _session(auth_client, 2)
    first, second = (e["id"] for e in s["exercises"])
    await _post_set(auth_client, first, {"reps": 5, "load_kg": 100})

    out = _data(await auth_client.put(
        f"/v1/workout-sessions/{s['id']}/exercises/order", json=[second, first]
    ))

    moved = next(e for e in out["exercises"] if e["id"] == first)
    assert moved["order_index"] == 1
    assert len(moved["sets"]) == 1
    assert moved["sets"][0]["load_kg"] == 100.0


async def test_a_reorder_that_omits_an_exercise_is_refused(auth_client):
    """A partial order would silently drop an exercise from the session."""
    s = await _session(auth_client, 3)
    ids = [e["id"] for e in s["exercises"]]

    r = await auth_client.put(
        f"/v1/workout-sessions/{s['id']}/exercises/order", json=ids[:2]
    )
    assert r.status_code == 422, r.text
    assert r.json()["error"]["fields"]


async def test_a_reorder_naming_a_foreign_exercise_is_refused(auth_client):
    s = await _session(auth_client, 2)
    ids = [e["id"] for e in s["exercises"]]

    r = await auth_client.put(
        f"/v1/workout-sessions/{s['id']}/exercises/order", json=[ids[0], str(uuid.uuid4())]
    )
    assert r.status_code == 422, r.text


# --------------------------------------------- PATCH /workout-sessions/{id}

async def test_session_notes_can_be_edited(auth_client):
    s = await _session(auth_client, 1)

    out = _data(await auth_client.patch(
        f"/v1/workout-sessions/{s['id']}", json={"notes": "Short on time."}
    ))

    assert out["notes"] == "Short on time."


async def test_editing_a_session_never_touches_the_plan(auth_client):
    """I1 — the plan tree is not the performed tree. The snapshot froze the
    prescription at start and nothing here may reach back into the plan."""
    p = _data(await auth_client.post("/v1/workout-programs", json={"name": "PPL"}), 201)
    p = _data(await auth_client.post(
        f"/v1/workout-programs/{p['id']}/days", json={"name": "Push"}
    ), 201)
    day_id = p["days"][0]["id"]
    ex = await _exercise_ids(auth_client, 2)
    _data(await auth_client.put(f"/v1/plan-days/{day_id}/exercises", json=[
        {"exercise_id": ex[0], "target_sets": 4, "target_reps_min": 6, "target_reps_max": 8},
        {"exercise_id": ex[1], "target_sets": 3},
    ]))

    s = _data(await auth_client.post("/v1/workout-sessions", json={"plan_day_id": day_id}), 201)
    before = _data(await auth_client.get(f"/v1/workout-programs/{p['id']}"))

    # Reorder and remove inside the session.
    ids = [e["id"] for e in s["exercises"]]
    _data(await auth_client.put(
        f"/v1/workout-sessions/{s['id']}/exercises/order", json=list(reversed(ids))
    ))
    _data(await auth_client.delete(f"/v1/session-exercises/{ids[0]}"))

    after = _data(await auth_client.get(f"/v1/workout-programs/{p['id']}"))
    assert after == before, "editing a session must not change the program"


async def test_mutating_a_finished_session_is_refused(auth_client):
    s = await _session(auth_client, 1)
    await _post_set(auth_client, s["exercises"][0]["id"], {"reps": 5, "load_kg": 100})
    _data(await auth_client.post(f"/v1/workout-sessions/{s['id']}/finish", json={}))

    r = await auth_client.delete(f"/v1/session-exercises/{s['exercises'][0]['id']}")
    assert r.status_code == 409, r.text


# ------------------------------------------------ densify: both sides agree

async def test_densify_matches_the_client_reducer(auth_client):
    """PAIRED with `delete and re-densify (W04.6)` in
    apps/mobile/src/features/workout-session/store/__tests__/reducers.test.ts.

    The phone re-densifies locally so the UI is instant, and the server
    re-densifies on the write. If the two disagree, a set silently changes
    position after a sync. Same scenarios, same expected output, both sides.
    """
    s = await _session(auth_client, 1)
    se_id = s["exercises"][0]["id"]

    ids = []
    for reps in (8, 6, 5):
        row = await _post_set(auth_client, se_id, {"reps": reps, "load_kg": 60})
        ids.append(row["id"])

    # delete the MIDDLE set -> [0, 1], the client's first densify case
    assert _data(await auth_client.delete(f"/v1/workout-sets/{ids[1]}"))["deleted"] is True
    out = _data(await auth_client.get(f"/v1/workout-sessions/{s['id']}"))
    se = next(e for e in out["exercises"] if e["id"] == se_id)
    assert [x["set_index"] for x in se["sets"]] == [0, 1]
    assert [x["reps"] for x in se["sets"]] == [8, 5]

    # delete the FIRST set -> [0], the client's second densify case
    assert _data(await auth_client.delete(f"/v1/workout-sets/{ids[0]}"))["deleted"] is True
    out = _data(await auth_client.get(f"/v1/workout-sessions/{s['id']}"))
    se = next(e for e in out["exercises"] if e["id"] == se_id)
    assert [x["set_index"] for x in se["sets"]] == [0]
    assert [x["reps"] for x in se["sets"]] == [5]
