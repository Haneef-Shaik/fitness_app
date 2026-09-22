"""GET /history/compare — F-06, and **H5.2: the comparison primitive**.

G6's charts reuse this, so the numbers have to be the ones everything else
already agrees on. Two rules govern that:

  **I3** warm-ups never count toward volume (D6).
  **AC-06** the same volume must appear on E-08, F-03 and G-02 — which only
  holds if all of them defer to `app.domain.training`. A SQL `SUM(load*reps)`
  here would be a second definition of volume, and a second definition is how
  those three screens start disagreeing.

The alignment is the other half. Comparing sessions means putting the same
exercise side by side even when it is absent from one of them, so a row exists
per exercise across the whole set and a missing session is an explicit null
rather than a shifted column.
"""
from __future__ import annotations

import uuid
from datetime import UTC, datetime, timedelta

import pytest

pytestmark = pytest.mark.asyncio


def _body(response, expect: int = 200):
    assert response.status_code == expect, response.text
    return response.json()


def _data(response, expect: int = 200):
    return _body(response, expect)["data"]


async def _exercise_ids(client, n=2) -> list[str]:
    rows = _data(await client.get("/v1/exercises", params={"limit": 50}))
    return [e["id"] for e in rows[:n]]


async def _session_with(client, plan: dict[str, list[dict]], *, started_at) -> str:
    """`plan` maps exercise_id -> list of set payloads."""
    s = _data(await client.post("/v1/workout-sessions", json={
        "exercise_ids": list(plan), "started_at": started_at.isoformat(),
    }), 201)
    by_exercise = {se["exercise_id"]: se["id"] for se in s["exercises"]}
    for exercise_id, sets in plan.items():
        for payload in sets:
            await client.post(
                f"/v1/session-exercises/{by_exercise[exercise_id]}/sets",
                json=payload,
                headers={"Idempotency-Key": str(uuid.uuid4())},
            )
    _data(await client.post(f"/v1/workout-sessions/{s['id']}/finish", json={}))
    return s["id"]


W = {"set_type": "working"}


class TestPerSessionTotals:
    async def test_volume_excludes_warm_ups(self, auth_client):
        # I3. 60x10 warm-up + 100x5 working = 500, not 1100.
        ex, = await _exercise_ids(auth_client, 1)
        sid = await _session_with(auth_client, {ex: [
            {"set_type": "warmup", "load_kg": 60.0, "reps": 10},
            {**W, "load_kg": 100.0, "reps": 5},
        ]}, started_at=datetime.now(UTC) - timedelta(days=1))

        data = _data(await auth_client.get("/v1/history/compare", params={"sessions": sid}))

        assert data["sessions"][0]["total_volume_kg"] == 500.0
        assert data["sessions"][0]["set_count"] == 1, "the warm-up is not a counted set"

    async def test_sessions_come_back_newest_first_whatever_order_was_asked(
        self, auth_client
    ):
        ex, = await _exercise_ids(auth_client, 1)
        older = await _session_with(auth_client, {ex: [{**W, "load_kg": 50.0, "reps": 5}]},
                                    started_at=datetime.now(UTC) - timedelta(days=9))
        newer = await _session_with(auth_client, {ex: [{**W, "load_kg": 60.0, "reps": 5}]},
                                    started_at=datetime.now(UTC) - timedelta(days=2))

        data = _data(await auth_client.get(
            "/v1/history/compare", params={"sessions": f"{older},{newer}"}
        ))

        assert [s["id"] for s in data["sessions"]] == [newer, older], (
            "F-06 reads left-to-right as most recent first, regardless of the URL"
        )


class TestExerciseAlignment:
    async def test_an_exercise_missing_from_one_session_is_an_explicit_null(
        self, auth_client
    ):
        # The column must hold its place. Dropping the row instead would slide
        # every later number under the wrong date.
        a, b = await _exercise_ids(auth_client, 2)
        both = await _session_with(auth_client, {
            a: [{**W, "load_kg": 100.0, "reps": 5}],
            b: [{**W, "load_kg": 50.0, "reps": 10}],
        }, started_at=datetime.now(UTC) - timedelta(days=5))
        only_a = await _session_with(auth_client, {
            a: [{**W, "load_kg": 110.0, "reps": 5}],
        }, started_at=datetime.now(UTC) - timedelta(days=1))

        data = _data(await auth_client.get(
            "/v1/history/compare", params={"sessions": f"{only_a},{both}"}
        ))

        rows = {r["exercise_id"]: r for r in data["exercises"]}
        assert set(rows) == {a, b}, "a row per exercise across the whole comparison"

        b_by_session = {c["session_id"]: c for c in rows[b]["per_session"]}
        assert b_by_session[only_a]["volume_kg"] is None, "absent, not zero"
        assert b_by_session[both]["volume_kg"] == 500.0

    async def test_carries_the_best_set_per_exercise_per_session(self, auth_client):
        ex, = await _exercise_ids(auth_client, 1)
        sid = await _session_with(auth_client, {ex: [
            {**W, "load_kg": 80.0, "reps": 8},
            {**W, "load_kg": 102.5, "reps": 1},
            {"set_type": "warmup", "load_kg": 120.0, "reps": 1},
        ]}, started_at=datetime.now(UTC) - timedelta(days=1))

        data = _data(await auth_client.get("/v1/history/compare", params={"sessions": sid}))

        cell = data["exercises"][0]["per_session"][0]
        assert cell["best_set"]["load_kg"] == 102.5
        assert cell["best_set"]["reps"] == 1
        # 120 was a warm-up: heavier, and not a best set (I3 / PR eligibility).
        assert cell["max_load_kg"] == 102.5


class TestGuards:
    async def test_needs_at_least_one_session(self, auth_client):
        r = await auth_client.get("/v1/history/compare", params={"sessions": ""})
        assert r.status_code == 422, r.text

    async def test_refuses_more_than_three(self, auth_client):
        ids = ",".join(str(uuid.uuid4()) for _ in range(4))
        r = await auth_client.get("/v1/history/compare", params={"sessions": ids})
        assert r.status_code == 422, r.text

    async def test_rejects_a_malformed_id(self, auth_client):
        r = await auth_client.get("/v1/history/compare", params={"sessions": "not-a-uuid"})
        assert r.status_code == 422, r.text

    async def test_404s_a_session_that_is_not_mine(self, auth_client, client):
        ex, = await _exercise_ids(auth_client, 1)
        mine = await _session_with(auth_client, {ex: [{**W, "load_kg": 60.0, "reps": 5}]},
                                   started_at=datetime.now(UTC) - timedelta(days=1))
        other = f"other-{uuid.uuid4().hex[:8]}@example.com"
        r = await client.post("/v1/auth/register",
                              json={"email": other, "password": "correct-horse-battery"})
        token = r.json()["data"]["access_token"]

        r = await auth_client.get(
            "/v1/history/compare",
            params={"sessions": mine},
            headers={"authorization": f"Bearer {token}"},
        )

        assert r.status_code == 404, "another user's session must not be comparable"
