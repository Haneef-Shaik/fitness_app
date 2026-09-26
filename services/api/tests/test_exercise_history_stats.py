"""GET /exercises/{id}/history and /stats — D-02's data (Finding 2, G2).

Both were declared in docs/02 §7 and did not exist. They are read-only aggregations
over tables that already exist, and both must honour the same invariants as
everything else that counts a set:

  I3 — warm-ups are excluded from volume and PRs (D6)
  I5 — Epley, and the value carries `epley_v1` with it (D8)

The e1RM series must come from app.domain.training, not a SQL expression. A second
definition of the formula is how AC-06 drifts later.
"""
from __future__ import annotations

import uuid
from datetime import UTC, datetime, timedelta

import pytest

from app.domain.training import E1RM_FORMULA_VERSION, estimated_1rm_kg
from tests.auth import sign_up

pytestmark = pytest.mark.asyncio


def _data(response, expect: int = 200):
    assert response.status_code == expect, response.text
    return response.json()["data"]


def _body(response, expect: int = 200):
    assert response.status_code == expect, response.text
    return response.json()


async def _exercise_ids(client, n=2) -> list[str]:
    rows = _data(await client.get("/v1/exercises", params={"limit": 50}))
    return [e["id"] for e in rows[:n]]


async def _post_set(client, se_id, payload, expect=201):
    return _data(
        await client.post(
            f"/v1/session-exercises/{se_id}/sets",
            json=payload,
            headers={"Idempotency-Key": str(uuid.uuid4())},
        ),
        expect,
    )


async def _finished_session(client, exercise_id: str, sets: list[dict], *, started_at=None):
    """Logs `sets` against `exercise_id` and finishes the session."""
    payload: dict = {"exercise_ids": [exercise_id]}
    if started_at is not None:
        payload["started_at"] = started_at.isoformat()
    s = _data(await client.post("/v1/workout-sessions", json=payload), 201)
    se_id = s["exercises"][0]["id"]
    for row in sets:
        await _post_set(client, se_id, row)
    _data(await client.post(f"/v1/workout-sessions/{s['id']}/finish", json={}))
    return s["id"]


# ------------------------------------------------------------------ history

async def test_history_of_a_never_performed_exercise_is_empty_not_missing(auth_client):
    """A new user has never done any of the 29 seeded exercises. That is the most
    common state of this screen, and it is empty, not an error."""
    ex = (await _exercise_ids(auth_client))[0]
    body = _body(await auth_client.get(f"/v1/exercises/{ex}/history"))

    assert body["data"] == []
    assert body["meta"]["count"] == 0


async def test_history_returns_sessions_newest_first_with_their_sets(auth_client):
    ex = (await _exercise_ids(auth_client))[0]
    older = datetime.now(UTC) - timedelta(days=7)
    await _finished_session(auth_client, ex, [{"reps": 8, "load_kg": 60}], started_at=older)
    await _finished_session(auth_client, ex, [{"reps": 6, "load_kg": 80}, {"reps": 5, "load_kg": 85}])

    rows = _data(await auth_client.get(f"/v1/exercises/{ex}/history"))

    assert len(rows) == 2
    assert rows[0]["local_date"] >= rows[1]["local_date"]
    assert [s["set_index"] for s in rows[0]["sets"]] == [0, 1]
    assert rows[0]["sets"][0]["load_kg"] == 80.0
    assert rows[1]["sets"][0]["reps"] == 8


async def test_history_excludes_warmups_from_its_volume(auth_client):
    """I3/D6 — a warm-up must not inflate the number the user compares against."""
    ex = (await _exercise_ids(auth_client))[0]
    await _finished_session(auth_client, ex, [
        {"reps": 10, "load_kg": 20, "set_type": "warmup"},
        {"reps": 5, "load_kg": 100, "set_type": "working"},
    ])

    rows = _data(await auth_client.get(f"/v1/exercises/{ex}/history"))

    assert rows[0]["volume_kg"] == pytest.approx(500.0)   # 5×100 only, not +200
    assert len(rows[0]["sets"]) == 2                      # the warm-up is still shown


async def test_history_best_e1rm_ignores_warmups(auth_client):
    """A heavy low-rep warm-up must not become that session's best estimate —
    the same I3 rule the volume obeys, on the other number in the row."""
    ex = (await _exercise_ids(auth_client))[0]
    await _finished_session(auth_client, ex, [
        {"reps": 1, "load_kg": 200, "set_type": "warmup"},
        {"reps": 5, "load_kg": 100, "set_type": "working"},
    ])

    rows = _data(await auth_client.get(f"/v1/exercises/{ex}/history"))

    assert rows[0]["best_e1rm_kg"] == pytest.approx(estimated_1rm_kg(100.0, 5))
    assert rows[0]["formula_version"] == E1RM_FORMULA_VERSION


async def test_history_shows_only_completed_sessions(auth_client):
    """An in-progress session is the logger's business, not history's."""
    ex = (await _exercise_ids(auth_client))[0]
    await _finished_session(auth_client, ex, [{"reps": 5, "load_kg": 100}])

    live = _data(await auth_client.post("/v1/workout-sessions", json={"exercise_ids": [ex]}), 201)
    await _post_set(auth_client, live["exercises"][0]["id"], {"reps": 3, "load_kg": 120})

    rows = _data(await auth_client.get(f"/v1/exercises/{ex}/history"))

    assert len(rows) == 1
    assert all(r["session_id"] != live["id"] for r in rows)


async def test_history_is_paginated(auth_client):
    ex = (await _exercise_ids(auth_client))[0]
    for i in range(3):
        await _finished_session(
            auth_client, ex, [{"reps": 5, "load_kg": 100 + i}],
            started_at=datetime.now(UTC) - timedelta(days=i + 1),
        )

    body = _body(await auth_client.get(f"/v1/exercises/{ex}/history", params={"limit": 2}))

    assert len(body["data"]) == 2
    assert body["meta"]["limit"] == 2 and body["meta"]["count"] == 2

    page2 = _data(await auth_client.get(
        f"/v1/exercises/{ex}/history", params={"limit": 2, "offset": 2}
    ))
    assert len(page2) == 1


async def test_history_of_an_unknown_exercise_is_404(auth_client):
    # Asserting the envelope, not just the status: a missing ROUTE also 404s, so a
    # status-only assertion would pass while the endpoint did not exist at all.
    r = await auth_client.get(f"/v1/exercises/{uuid.uuid4()}/history")
    assert r.status_code == 404, r.text
    body = r.json()
    assert body["success"] is False
    assert body["error"]["message"] == "That exercise no longer exists."
    assert body["error"]["request_id"]


async def test_history_never_shows_another_users_sessions(client, auth_client):
    """The exercise catalog is global; what you did with it is not."""
    ex = (await _exercise_ids(auth_client))[0]
    await _finished_session(auth_client, ex, [{"reps": 5, "load_kg": 100}])

    other = _data(await sign_up(client, json={
        "email": f"other-{uuid.uuid4().hex[:8]}@example.com", "password": "correct-horse-battery",
    }), 201)
    client.headers["authorization"] = f"Bearer {other['access_token']}"

    rows = _data(await client.get(f"/v1/exercises/{ex}/history"))
    assert rows == []


# -------------------------------------------------------------------- stats

async def test_stats_of_a_never_performed_exercise_is_the_first_time_state(auth_client):
    """D-02's never-performed state — what a new user sees for every exercise."""
    ex = (await _exercise_ids(auth_client))[0]
    stats = _data(await auth_client.get(f"/v1/exercises/{ex}/stats"))

    assert stats["session_count"] == 0
    assert stats["last_performed_at"] is None
    assert stats["total_volume_kg"] == 0
    assert stats["records"] == {}
    assert stats["e1rm_series"] == []


async def test_stats_records_match_the_records_endpoint(auth_client):
    """One definition. /stats must not re-derive what /records already computes."""
    ex = (await _exercise_ids(auth_client))[0]
    await _finished_session(auth_client, ex, [{"reps": 5, "load_kg": 100}, {"reps": 8, "load_kg": 80}])

    stats = _data(await auth_client.get(f"/v1/exercises/{ex}/stats"))
    records = _data(await auth_client.get(f"/v1/exercises/{ex}/records"))

    assert stats["records"] == records
    assert records["max_load"]["value"] == 100.0


async def test_stats_e1rm_series_uses_the_shared_epley_and_carries_its_version(auth_client):
    """I5 — the value is meaningless without the formula that produced it."""
    ex = (await _exercise_ids(auth_client))[0]
    await _finished_session(auth_client, ex, [{"reps": 5, "load_kg": 100}])

    stats = _data(await auth_client.get(f"/v1/exercises/{ex}/stats"))

    assert len(stats["e1rm_series"]) == 1
    point = stats["e1rm_series"][0]
    assert point["e1rm_kg"] == pytest.approx(estimated_1rm_kg(100.0, 5))
    assert point["formula_version"] == E1RM_FORMULA_VERSION


async def test_stats_e1rm_series_ignores_warmups(auth_client):
    """I3 — a light warm-up must never become the best estimate, and a heavy one
    must never be treated as a clean attempt."""
    ex = (await _exercise_ids(auth_client))[0]
    await _finished_session(auth_client, ex, [
        {"reps": 1, "load_kg": 200, "set_type": "warmup"},
        {"reps": 5, "load_kg": 100, "set_type": "working"},
    ])

    stats = _data(await auth_client.get(f"/v1/exercises/{ex}/stats"))

    assert len(stats["e1rm_series"]) == 1
    assert stats["e1rm_series"][0]["e1rm_kg"] == pytest.approx(estimated_1rm_kg(100.0, 5))


async def test_stats_series_is_one_point_per_session_in_date_order(auth_client):
    ex = (await _exercise_ids(auth_client))[0]
    for i, load in enumerate([90.0, 95.0, 100.0]):
        await _finished_session(
            auth_client, ex, [{"reps": 5, "load_kg": load}],
            started_at=datetime.now(UTC) - timedelta(days=10 - i),
        )

    stats = _data(await auth_client.get(f"/v1/exercises/{ex}/stats"))

    assert len(stats["e1rm_series"]) == 3
    dates = [p["local_date"] for p in stats["e1rm_series"]]
    assert dates == sorted(dates)
    assert stats["session_count"] == 3
    assert stats["last_performed_at"] is not None


async def test_stats_total_volume_excludes_warmups(auth_client):
    ex = (await _exercise_ids(auth_client))[0]
    await _finished_session(auth_client, ex, [
        {"reps": 10, "load_kg": 20, "set_type": "warmup"},
        {"reps": 5, "load_kg": 100},
    ])

    stats = _data(await auth_client.get(f"/v1/exercises/{ex}/stats"))
    assert stats["total_volume_kg"] == pytest.approx(500.0)


async def test_stats_of_an_unknown_exercise_is_404(auth_client):
    # Asserting the envelope, not just the status: a missing ROUTE also 404s, so a
    # status-only assertion would pass while the endpoint did not exist at all.
    r = await auth_client.get(f"/v1/exercises/{uuid.uuid4()}/stats")
    assert r.status_code == 404, r.text
    body = r.json()
    assert body["success"] is False
    assert body["error"]["message"] == "That exercise no longer exists."
    assert body["error"]["request_id"]
