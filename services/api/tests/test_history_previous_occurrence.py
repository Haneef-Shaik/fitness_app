"""GET /history/previous-occurrence — AC-05, the resolution rule.

The rule is **normative and already written** ([PRD §7.2](../../../docs/01-PRD.md)):

    the most recent `workout_session` where `status = completed`, `user_id = me`,
    and at least one `session_exercise` maps to an `exercise` that has an
    `exercise_muscles` row with `muscle_group = Chest` (or a **descendant** of
    Chest) and `role = 'primary'`, ordered by `completed_at DESC`. If nothing
    matches on `primary`, the query widens to `role IN ('primary','secondary')`
    **and the UI states that it widened.**

Two clauses do the damage if you skim them:

  "or a descendant"  — the muscle tree is self-referencing, so this is recursive.
                       A one-level join passes for Upper Chest and is still wrong.
                       Every test here that cares uses a GRANDCHILD.
  "and the UI states" — widening silently is the trap named in the goal. The fact
                       has to reach the payload, or the screen cannot say it.
"""
from __future__ import annotations

import uuid
from datetime import UTC, datetime, timedelta

import pytest
from sqlalchemy import select

from app.models import MuscleGroup, MuscleRole
from tests.auth import sign_up

pytestmark = pytest.mark.asyncio


def _data(response, expect: int = 200):
    assert response.status_code == expect, response.text
    return response.json()["data"]


async def _post_set(client, se_id, payload, expect=201):
    return _data(
        await client.post(
            f"/v1/session-exercises/{se_id}/sets",
            json=payload,
            headers={"Idempotency-Key": str(uuid.uuid4())},
        ),
        expect,
    )


async def _finished_session(client, exercise_id: str, *, started_at=None, reps=8, load=60.0):
    payload: dict = {"exercise_ids": [exercise_id]}
    if started_at is not None:
        payload["started_at"] = started_at.isoformat()
    s = _data(await client.post("/v1/workout-sessions", json=payload), 201)
    await _post_set(client, s["exercises"][0]["id"],
                    {"set_type": "working", "load_kg": load, "reps": reps})
    _data(await client.post(f"/v1/workout-sessions/{s['id']}/finish", json={}))
    return s["id"]


async def _deep_chest_exercise(client, db, *, role: MuscleRole = MuscleRole.primary) -> str:
    """An exercise whose CHEST link is a GRANDCHILD of Chest.

    Chest -> Upper Chest -> Clavicular Head. The seeded tree stops at two levels,
    so the third is built here: a rule that joins one level deep matches nothing
    for this exercise, which is exactly the failure worth catching.

    Created through the API, so it is a user-owned custom exercise rather than a
    global catalog row. Writing straight to `exercises` with `owner_user_id`
    NULL made it a catalog entry, and `test_seed_catalog.py` counts those — the
    pollution surfaced as two failures in a file this one never touches.

    When the chest link is secondary the exercise still gets a primary muscle
    (triceps), because `ExerciseIn` requires one (W02.4) and a real exercise
    with chest-secondary has its primary somewhere.
    """
    chest = await db.scalar(select(MuscleGroup).where(MuscleGroup.slug == "chest"))
    upper = await db.scalar(select(MuscleGroup).where(MuscleGroup.slug == "upper-chest"))
    assert chest is not None and upper is not None
    assert upper.parent_id == chest.id, "fixture assumes Upper Chest is a child of Chest"

    grandchild = MuscleGroup(
        name=f"Clavicular Head {uuid.uuid4().hex[:6]}",
        slug=f"clavicular-head-{uuid.uuid4().hex[:6]}",
        parent_id=upper.id,
    )
    db.add(grandchild)
    await db.commit()

    muscles = [{"muscle_group_id": str(grandchild.id), "role": role.value}]
    if role is MuscleRole.secondary:
        triceps = await db.scalar(select(MuscleGroup).where(MuscleGroup.slug == "triceps"))
        muscles.append({"muscle_group_id": str(triceps.id), "role": "primary"})

    created = _data(await client.post("/v1/exercises", json={
        "name": f"Incline Press {uuid.uuid4().hex[:6]}",
        "equipment": "barbell",
        "muscles": muscles,
    }), 201)
    return created["id"]


class TestTheRuleAsWritten:
    async def test_returns_the_most_recent_completed_session_for_that_muscle(
        self, auth_client, db
    ):
        ex = await _deep_chest_exercise(auth_client, db)
        older = datetime.now(UTC) - timedelta(days=9)
        newer = datetime.now(UTC) - timedelta(days=2)
        await _finished_session(auth_client, ex, started_at=older)
        expected = await _finished_session(auth_client, ex, started_at=newer)

        found = _data(await auth_client.get(
            "/v1/history/previous-occurrence", params={"muscle": "chest"}
        ))

        assert found["session_id"] == expected

    async def test_matches_through_a_GRANDCHILD_muscle_group(self, auth_client, db):
        # The whole point of "or a descendant". Joining one level deep passes the
        # Upper Chest case and returns nothing here.
        ex = await _deep_chest_exercise(auth_client, db)
        session_id = await _finished_session(auth_client, ex)

        found = _data(await auth_client.get(
            "/v1/history/previous-occurrence", params={"muscle": "chest"}
        ))

        assert found is not None, "a grandchild of Chest is still a chest day"
        assert found["session_id"] == session_id

    async def test_ignores_a_session_still_in_progress(self, auth_client, db):
        ex = await _deep_chest_exercise(auth_client, db)
        done = await _finished_session(auth_client, ex,
                                       started_at=datetime.now(UTC) - timedelta(days=3))
        # Started later, never finished: newer, and not an answer.
        _data(await auth_client.post("/v1/workout-sessions", json={"exercise_ids": [ex]}), 201)

        found = _data(await auth_client.get(
            "/v1/history/previous-occurrence", params={"muscle": "chest"}
        ))

        assert found["session_id"] == done

    async def test_says_nothing_rather_than_guessing_when_there_is_no_history(
        self, auth_client, db
    ):
        await _deep_chest_exercise(auth_client, db)

        body = (await auth_client.get(
            "/v1/history/previous-occurrence", params={"muscle": "chest"}
        )).json()

        assert body["success"] is True
        assert body["data"] is None, "no occurrence is an answer, not an error"


class TestWidening:
    async def test_widens_to_secondary_when_nothing_is_primary_AND_SAYS_SO(
        self, auth_client, db
    ):
        # "Widening silently" is the named trap. The payload has to carry it.
        ex = await _deep_chest_exercise(auth_client, db, role=MuscleRole.secondary)
        session_id = await _finished_session(auth_client, ex)

        found = _data(await auth_client.get(
            "/v1/history/previous-occurrence", params={"muscle": "chest"}
        ))

        assert found["session_id"] == session_id
        assert found["widened"] is True
        assert found["role_matched"] == "secondary"

    async def test_does_not_widen_when_a_primary_match_exists(self, auth_client, db):
        primary_ex = await _deep_chest_exercise(auth_client, db)
        secondary_ex = await _deep_chest_exercise(auth_client, db, role=MuscleRole.secondary)
        # The secondary session is NEWER. A single `role IN ('primary','secondary')`
        # query returns it, because it is genuinely the most recent match. The rule
        # says otherwise: primary wins wherever it is in history, and only a total
        # absence of primary widens. So these ids must be captured and compared —
        # an earlier version of this test compared a session id against an EXERCISE
        # id, which is never equal, and passed against a deliberately broken rule.
        older_primary = await _finished_session(
            auth_client, primary_ex, started_at=datetime.now(UTC) - timedelta(days=5)
        )
        newer_secondary = await _finished_session(
            auth_client, secondary_ex, started_at=datetime.now(UTC) - timedelta(days=1)
        )
        assert older_primary != newer_secondary

        found = _data(await auth_client.get(
            "/v1/history/previous-occurrence", params={"muscle": "chest"}
        ))

        assert found["session_id"] == older_primary, (
            "an older PRIMARY match beats a newer secondary one"
        )
        assert found["session_id"] != newer_secondary
        assert found["widened"] is False
        assert found["role_matched"] == "primary"


class TestScoping:
    async def test_never_returns_another_users_session(self, auth_client, client, db):
        ex = await _deep_chest_exercise(auth_client, db)
        await _finished_session(auth_client, ex)

        other = f"other-{uuid.uuid4().hex[:8]}@example.com"
        r = await sign_up(client, json={"email": other, "password": "correct-horse-battery"})
        token = r.json()["data"]["access_token"]

        body = (await auth_client.get(
            "/v1/history/previous-occurrence",
            params={"muscle": "chest"},
            headers={"authorization": f"Bearer {token}"},
        )).json()

        assert body["data"] is None

    async def test_rejects_an_unknown_muscle_group(self, auth_client):
        r = await auth_client.get(
            "/v1/history/previous-occurrence", params={"muscle": "not-a-muscle"}
        )
        assert r.status_code == 422, r.text
