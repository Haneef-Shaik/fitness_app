"""Mid-session changes that the phone makes offline must be addressable offline.

The logger's outbox replays writes it queued while the server was out of reach,
so every write it queues has to name its target by something the phone already
knows. A server-issued id is not that: an exercise added on a train platform has
none yet, and a set's server id never reaches the draft at all.

So three writes are keyed by the client's own ids:
  - adding an exercise with a client-chosen `id` (idempotent on replay),
  - editing a set by its `client_id`,
  - deleting a set by its `client_id` (idempotent: gone is gone).
"""
from __future__ import annotations

import uuid

import pytest

from tests.auth import sign_up

pytestmark = pytest.mark.asyncio


def _data(response, expect: int = 200):
    assert response.status_code == expect, response.text
    return response.json()["data"]


async def _exercise_ids(client, n=2) -> list[str]:
    rows = _data(await client.get("/v1/exercises", params={"limit": 50}))
    return [e["id"] for e in rows[:n]]


async def _session(client, n=1):
    ex = await _exercise_ids(client, n)
    return _data(await client.post("/v1/workout-sessions", json={"exercise_ids": ex}), 201)


async def _post_set(client, se_id, payload, client_id=None, expect=201):
    key = client_id or str(uuid.uuid4())
    return _data(
        await client.post(
            f"/v1/session-exercises/{se_id}/sets", json={**payload, "client_id": key},
            headers={"Idempotency-Key": key},
        ),
        expect,
    )


# ----------------------------------------------- add exercise with a client id

async def test_an_exercise_added_offline_keeps_the_id_the_phone_chose(auth_client):
    s = await _session(auth_client)
    extra = (await _exercise_ids(auth_client, 2))[1]
    chosen = str(uuid.uuid4())

    out = _data(await auth_client.post(
        f"/v1/workout-sessions/{s['id']}/exercises",
        json={"exercise_id": extra, "id": chosen},
    ), 201)

    assert any(e["id"] == chosen for e in out["exercises"])
    # And a set can be written against it straight away, by that id.
    await _post_set(auth_client, chosen, {"reps": 8, "load_kg": 40})


async def test_replaying_an_added_exercise_does_not_add_it_twice(auth_client):
    s = await _session(auth_client)
    extra = (await _exercise_ids(auth_client, 2))[1]
    chosen = str(uuid.uuid4())
    body = {"exercise_id": extra, "id": chosen}

    _data(await auth_client.post(f"/v1/workout-sessions/{s['id']}/exercises", json=body), 201)
    again = _data(await auth_client.post(f"/v1/workout-sessions/{s['id']}/exercises", json=body), 200)

    assert [e["id"] for e in again["exercises"]].count(chosen) == 1
    assert len(again["exercises"]) == 2


async def test_a_client_id_already_used_by_another_session_is_refused(auth_client):
    first = await _session(auth_client)
    chosen = first["exercises"][0]["id"]
    _data(await auth_client.post(f"/v1/workout-sessions/{first['id']}/finish", json={}))
    second = await _session(auth_client)
    extra = (await _exercise_ids(auth_client, 2))[1]

    r = await auth_client.post(
        f"/v1/workout-sessions/{second['id']}/exercises",
        json={"exercise_id": extra, "id": chosen},
    )
    assert r.status_code == 409, r.text


# ------------------------------------------------------ set edit by client id

async def test_a_set_is_edited_by_the_id_the_phone_gave_it(auth_client):
    s = await _session(auth_client)
    se_id = s["exercises"][0]["id"]
    cid = str(uuid.uuid4())
    await _post_set(auth_client, se_id, {"reps": 8, "load_kg": 60}, client_id=cid)

    out = _data(await auth_client.patch(
        f"/v1/workout-sessions/{s['id']}/sets/by-client/{cid}",
        json={"rpe": 8.5, "rir": 1, "set_type": "drop", "note": "Grip went"},
    ))

    assert out["rpe"] == 8.5
    assert out["rir"] == 1
    assert out["set_type"] == "drop"
    assert out["note"] == "Grip went"


async def test_editing_a_set_that_never_arrived_is_a_404(auth_client):
    s = await _session(auth_client)
    r = await auth_client.patch(
        f"/v1/workout-sessions/{s['id']}/sets/by-client/{uuid.uuid4()}", json={"rpe": 7}
    )
    assert r.status_code == 404, r.text


# ---------------------------------------------------- set delete by client id

async def test_a_set_deleted_on_the_phone_is_deleted_on_the_server(auth_client):
    """The bug this closes: the logger's ✕ removed the row on screen only, and
    the finished session still counted the set in its volume."""
    s = await _session(auth_client)
    se_id = s["exercises"][0]["id"]
    keep, drop = str(uuid.uuid4()), str(uuid.uuid4())
    await _post_set(auth_client, se_id, {"reps": 5, "load_kg": 100}, client_id=keep)
    await _post_set(auth_client, se_id, {"reps": 5, "load_kg": 100}, client_id=drop)

    out = _data(await auth_client.delete(f"/v1/workout-sessions/{s['id']}/sets/by-client/{drop}"))
    assert out["deleted"] is True

    finished = _data(await auth_client.post(f"/v1/workout-sessions/{s['id']}/finish", json={}))
    sets = finished["exercises"][0]["sets"]
    assert [x["client_id"] for x in sets] == [keep]
    assert sets[0]["set_index"] == 0
    assert finished["total_volume_kg"] == 500


async def test_deleting_twice_is_not_an_error(auth_client):
    """A replayed delete must not park itself in the Sync Center as a failure."""
    s = await _session(auth_client)
    se_id = s["exercises"][0]["id"]
    cid = str(uuid.uuid4())
    await _post_set(auth_client, se_id, {"reps": 5, "load_kg": 100}, client_id=cid)

    _data(await auth_client.delete(f"/v1/workout-sessions/{s['id']}/sets/by-client/{cid}"))
    again = _data(await auth_client.delete(f"/v1/workout-sessions/{s['id']}/sets/by-client/{cid}"))
    assert again["deleted"] is False


async def test_another_users_set_cannot_be_deleted_by_client_id(auth_client, client):
    s = await _session(auth_client)
    se_id = s["exercises"][0]["id"]
    cid = str(uuid.uuid4())
    await _post_set(auth_client, se_id, {"reps": 5, "load_kg": 100}, client_id=cid)

    stranger = f"other-{uuid.uuid4().hex[:8]}@example.com"
    token = _data(await sign_up(client, json={"email": stranger, "password": "correct-horse-battery"}
    ), 201)["access_token"]
    r = await auth_client.delete(
        f"/v1/workout-sessions/{s['id']}/sets/by-client/{cid}",
        headers={"authorization": f"Bearer {token}"},
    )
    assert r.status_code == 403, r.text

    still = _data(await auth_client.get(f"/v1/workout-sessions/{s['id']}"))
    assert len(still["exercises"][0]["sets"]) == 1
