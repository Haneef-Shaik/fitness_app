"""GET /history/workouts — F-01's list, and **H5.1: the pagination convention**.

Every list endpoint after this one copies this shape, so it is settled here on
purpose rather than discovered seven times.

**Keyset, not offset.** History grows at the end a user reads from. With
`?offset=20`, logging a session between page 1 and page 2 shifts every row down
one and the reader sees a row twice; deleting one makes them miss a row entirely.
A keyset cursor over `(started_at, id)` is stable under both, because it names
*where it stopped* rather than *how far in* it was.

**Opaque.** The cursor is a base64 blob. Clients must not parse it, so the tests
here do not parse it either — they only ever feed it straight back. That is what
lets the key change later without breaking anyone.

`id` is in the key because `started_at` is not unique: two sessions can start in
the same second, and a cursor on time alone either repeats or skips them.
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


async def _post_set(client, se_id, payload, expect=201):
    return _data(
        await client.post(
            f"/v1/session-exercises/{se_id}/sets",
            json=payload,
            headers={"Idempotency-Key": str(uuid.uuid4())},
        ),
        expect,
    )


async def _exercise_id(client) -> str:
    return _data(await client.get("/v1/exercises", params={"limit": 1}))[0]["id"]


async def _exercise_on(client, db, slug: str) -> str:
    """A user-owned custom exercise whose only muscle row is `slug`, primary.

    Through the API, not a direct insert: a row with `owner_user_id` NULL is a
    global catalog entry and `test_seed_catalog.py` counts those.
    """
    from sqlalchemy import select

    from app.models import MuscleGroup

    group = await db.scalar(select(MuscleGroup).where(MuscleGroup.slug == slug))
    assert group is not None, f"no muscle group {slug!r}"
    created = _data(await client.post("/v1/exercises", json={
        "name": f"Test {slug} {uuid.uuid4().hex[:6]}",
        "equipment": "machine",
        "muscles": [{"muscle_group_id": str(group.id), "role": "primary"}],
    }), 201)
    return created["id"]


async def _finished_session(client, exercise_id, *, started_at, load=60.0, reps=8):
    s = _data(await client.post("/v1/workout-sessions", json={
        "exercise_ids": [exercise_id], "started_at": started_at.isoformat(),
    }), 201)
    await _post_set(client, s["exercises"][0]["id"],
                    {"set_type": "working", "load_kg": load, "reps": reps})
    _data(await client.post(f"/v1/workout-sessions/{s['id']}/finish", json={}))
    return s["id"]


async def _make_history(client, n: int) -> list[str]:
    """`n` finished sessions, newest first in the returned list."""
    ex = await _exercise_id(client)
    base = datetime.now(UTC) - timedelta(days=n + 1)
    ids = [await _finished_session(client, ex, started_at=base + timedelta(days=i))
           for i in range(n)]
    return list(reversed(ids))


def _page(body) -> list[str]:
    return [row["id"] for row in body["data"]]


class TestTheListItself:
    async def test_newest_first(self, auth_client):
        expected = await _make_history(auth_client, 3)

        body = _body(await auth_client.get("/v1/history/workouts"))

        assert _page(body) == expected

    async def test_only_completed_sessions(self, auth_client):
        expected = await _make_history(auth_client, 1)
        ex = await _exercise_id(auth_client)
        _data(await auth_client.post("/v1/workout-sessions", json={"exercise_ids": [ex]}), 201)

        body = _body(await auth_client.get("/v1/history/workouts"))

        assert _page(body) == expected

    async def test_never_another_users_history(self, auth_client, client):
        await _make_history(auth_client, 2)
        other = f"other-{uuid.uuid4().hex[:8]}@example.com"
        r = await client.post("/v1/auth/register",
                              json={"email": other, "password": "correct-horse-battery"})
        token = r.json()["data"]["access_token"]

        body = _body(await auth_client.get(
            "/v1/history/workouts", headers={"authorization": f"Bearer {token}"}
        ))

        assert body["data"] == []


class TestCursorPagination:
    async def test_walks_the_whole_list_exactly_once(self, auth_client):
        expected = await _make_history(auth_client, 7)

        seen: list[str] = []
        cursor = None
        for _ in range(10):                      # bounded: a loop bug must fail, not hang
            params = {"limit": 3}
            if cursor:
                params["cursor"] = cursor
            body = _body(await auth_client.get("/v1/history/workouts", params=params))
            seen += _page(body)
            cursor = body["meta"]["next_cursor"]
            if not cursor:
                break

        assert seen == expected, "every row once, in order, no repeats and no gaps"
        assert len(seen) == len(set(seen))

    async def test_the_last_page_says_it_is_the_last(self, auth_client):
        await _make_history(auth_client, 4)

        first = _body(await auth_client.get("/v1/history/workouts", params={"limit": 4}))

        # Exactly `limit` rows and no more to come. A `has_more` inferred from
        # "did we fill the page?" is wrong precisely here, and this is the case
        # that catches it.
        assert len(first["data"]) == 4
        assert first["meta"]["has_more"] is False
        assert first["meta"]["next_cursor"] is None

    async def test_a_session_logged_mid_read_does_not_shift_the_page(self, auth_client):
        # The reason for keyset. With offsets, inserting at the head pushes the
        # boundary row down and page 2 repeats it.
        expected = await _make_history(auth_client, 4)
        first = _body(await auth_client.get("/v1/history/workouts", params={"limit": 2}))
        assert _page(first) == expected[:2]

        ex = await _exercise_id(auth_client)
        await _finished_session(auth_client, ex, started_at=datetime.now(UTC))

        second = _body(await auth_client.get(
            "/v1/history/workouts",
            params={"limit": 2, "cursor": first["meta"]["next_cursor"]},
        ))

        assert _page(second) == expected[2:4], "the new session must not disturb page 2"

    async def test_separates_sessions_that_start_in_the_same_second(self, auth_client):
        # `started_at` alone is not a key. Identical timestamps must still page
        # cleanly, which is why `id` is the tiebreaker.
        ex = await _exercise_id(auth_client)
        same = datetime.now(UTC) - timedelta(days=1)
        ids = {await _finished_session(auth_client, ex, started_at=same) for _ in range(4)}

        seen: list[str] = []
        cursor = None
        for _ in range(8):
            params = {"limit": 2}
            if cursor:
                params["cursor"] = cursor
            body = _body(await auth_client.get("/v1/history/workouts", params=params))
            seen += _page(body)
            cursor = body["meta"]["next_cursor"]
            if not cursor:
                break

        assert sorted(seen) == sorted(ids)
        assert len(seen) == len(set(seen)), "a time-only cursor repeats or skips here"

    async def test_rejects_a_cursor_it_did_not_issue(self, auth_client):
        r = await auth_client.get("/v1/history/workouts", params={"cursor": "not-a-cursor"})
        assert r.status_code == 422, r.text

    async def test_caps_the_page_size(self, auth_client):
        r = await auth_client.get("/v1/history/workouts", params={"limit": 500})
        assert r.status_code == 422, r.text


class TestFilters:
    async def test_filters_by_local_date_range(self, auth_client):
        ex = await _exercise_id(auth_client)
        old = datetime.now(UTC) - timedelta(days=30)
        recent = datetime.now(UTC) - timedelta(days=2)
        await _finished_session(auth_client, ex, started_at=old)
        wanted = await _finished_session(auth_client, ex, started_at=recent)

        since = (datetime.now(UTC) - timedelta(days=7)).date().isoformat()
        body = _body(await auth_client.get("/v1/history/workouts", params={"from": since}))

        assert _page(body) == [wanted]

    async def test_filters_by_muscle_through_the_same_subtree_rule(self, auth_client, db):
        # F-02's muscle filter and AC-05's resolution must agree about what a
        # chest day is, so they share one recursion.
        from tests.test_history_previous_occurrence import _deep_chest_exercise

        chest_ex = await _deep_chest_exercise(auth_client, db)
        # NOT `_exercise_id`, which returns the first catalog row — that is
        # Barbell Bench Press, which is itself a chest exercise, so the filter
        # correctly returned two and the test blamed the filter.
        other_ex = await _exercise_on(auth_client, db, "calves")
        await _finished_session(auth_client, other_ex,
                                started_at=datetime.now(UTC) - timedelta(days=4))
        wanted = await _finished_session(auth_client, chest_ex,
                                         started_at=datetime.now(UTC) - timedelta(days=3))

        body = _body(await auth_client.get("/v1/history/workouts", params={"muscle": "chest"}))

        assert _page(body) == [wanted], "a grandchild of Chest is still a chest day"

    async def test_filtered_empty_is_not_the_same_as_empty(self, auth_client):
        # I13. The payload must let F-01 tell "no history" from "no matches",
        # because those are different screens.
        await _make_history(auth_client, 2)

        body = _body(await auth_client.get("/v1/history/workouts", params={"muscle": "calves"}))

        assert body["data"] == []
        assert body["meta"]["filtered"] is True
        assert body["meta"]["total_unfiltered"] == 2
