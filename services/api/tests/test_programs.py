"""Plan tree API — §3. The headline test is AC-12: editing a plan must not
touch a logged session."""
from __future__ import annotations

import uuid
from datetime import UTC, datetime

import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.models import (
    SessionExercise,
    SessionStatus,
    SetType,
    User,
    WorkoutSession,
    WorkoutSet,
)
from tests.auth import sign_up

pytestmark = pytest.mark.asyncio


async def _exercise_ids(client, n=3) -> list[str]:
    rows = (await client.get("/v1/exercises", params={"limit": 50})).json()["data"]
    return [e["id"] for e in rows[:n]]


async def _program_with_day(client) -> tuple[str, str, list[str]]:
    p = (await client.post("/v1/workout-programs", json={
        "name": "Push / Pull / Legs", "description": "Classic 3-day split",
    })).json()["data"]
    p = (await client.post(f"/v1/workout-programs/{p['id']}/days", json={
        "name": "Push — Chest & Triceps", "scheduled_weekday": 0,
    })).json()["data"]
    day_id = p["days"][0]["id"]
    ex = await _exercise_ids(client)
    await client.put(f"/v1/plan-days/{day_id}/exercises", json=[
        {"exercise_id": ex[0], "target_sets": 4, "target_reps_min": 6,
         "target_reps_max": 8, "target_load": 80, "rest_seconds": 180},
        {"exercise_id": ex[1], "target_sets": 3, "target_reps_min": 8, "target_reps_max": 10},
    ])
    return p["id"], day_id, ex


async def test_create_program_with_days_and_prescriptions(auth_client):
    pid, _, _ = await _program_with_day(auth_client)
    p = (await auth_client.get(f"/v1/workout-programs/{pid}")).json()["data"]
    assert p["name"] == "Push / Pull / Legs"
    assert len(p["days"]) == 1
    day = p["days"][0]
    assert day["day_index"] == 0 and day["scheduled_weekday"] == 0
    assert [e["order_index"] for e in day["exercises"]] == [0, 1]
    assert day["exercises"][0]["target_sets"] == 4
    assert day["exercises"][0]["exercise_name"]     # resolved, not just an id


async def test_reversed_rep_range_is_swapped_not_rejected(auth_client):
    _, day_id, ex = await _program_with_day(auth_client)
    r = await auth_client.put(f"/v1/plan-days/{day_id}/exercises", json=[
        {"exercise_id": ex[0], "target_reps_min": 12, "target_reps_max": 6},
    ])
    got = r.json()["data"]["days"][0]["exercises"][0]
    assert (got["target_reps_min"], got["target_reps_max"]) == (6, 12)


async def test_bulk_reorder_is_dense_and_zero_based(auth_client):
    _, day_id, ex = await _program_with_day(auth_client)
    r = await auth_client.put(f"/v1/plan-days/{day_id}/exercises", json=[
        {"exercise_id": ex[2]}, {"exercise_id": ex[0]}, {"exercise_id": ex[1]},
    ])
    day = r.json()["data"]["days"][0]
    assert [e["order_index"] for e in day["exercises"]] == [0, 1, 2]
    assert [e["exercise_id"] for e in day["exercises"]] == ex[2:3] + ex[0:2]


async def test_duplicate_is_a_deep_copy(auth_client):
    pid, _, _ = await _program_with_day(auth_client)
    copy = (await auth_client.post(f"/v1/workout-programs/{pid}/duplicate")).json()["data"]
    original = (await auth_client.get(f"/v1/workout-programs/{pid}")).json()["data"]

    assert copy["name"].endswith("(copy)")
    assert copy["id"] != original["id"]
    assert copy["days"][0]["id"] != original["days"][0]["id"]
    copy_ex = {e["id"] for e in copy["days"][0]["exercises"]}
    orig_ex = {e["id"] for e in original["days"][0]["exercises"]}
    assert copy_ex.isdisjoint(orig_ex), "prescriptions must be new rows, not shared"

    # Editing the copy must not reach back into the original.
    await auth_client.patch(f"/v1/workout-programs/{copy['id']}", json={"name": "Changed"})
    again = (await auth_client.get(f"/v1/workout-programs/{pid}")).json()["data"]
    assert again["name"] == "Push / Pull / Legs"


async def test_archive_clears_the_schedule(auth_client):
    pid, _, _ = await _program_with_day(auth_client)
    r = (await auth_client.post(f"/v1/workout-programs/{pid}/archive")).json()["data"]
    assert r["status"] == "archived"
    assert r["days"][0]["scheduled_weekday"] is None


async def test_deleting_a_day_redensifies_indices(auth_client):
    """Renumbering walks 1->0 and 2->1, so each row passes through a value its
    neighbour has not vacated yet. Postgres checks a plain UNIQUE constraint row by
    row, and whether that collides depended on the order SQLAlchemy happened to emit
    the UPDATEs in — which for UUID primary keys is luck. uq_plan_day_index is
    DEFERRABLE INITIALLY DEFERRED (migration b3c07d41f2a1) so it cannot be luck."""
    pid, _, _ = await _program_with_day(auth_client)
    for name in ("Pull", "Legs"):
        r = await auth_client.post(f"/v1/workout-programs/{pid}/days", json={"name": name})
        assert r.status_code == 201, r.text
    p = (await auth_client.get(f"/v1/workout-programs/{pid}")).json()["data"]
    assert [d["day_index"] for d in p["days"]] == [0, 1, 2]

    r = await auth_client.delete(f"/v1/plan-days/{p['days'][0]['id']}")
    assert r.status_code == 200, r.text
    p = (await auth_client.get(f"/v1/workout-programs/{pid}")).json()["data"]
    assert [d["day_index"] for d in p["days"]] == [0, 1]
    assert [d["name"] for d in p["days"]] == ["Pull", "Legs"]


async def test_cannot_touch_another_users_program(client, auth_client):
    pid, _, _ = await _program_with_day(auth_client)
    other = await sign_up(client, json={
        "email": f"o-{uuid.uuid4().hex[:8]}@example.com", "password": "correct-horse-battery",
    })
    h = {"authorization": f"Bearer {other.json()['data']['access_token']}"}
    assert (await auth_client.get(f"/v1/workout-programs/{pid}", headers=h)).status_code == 403
    assert (await auth_client.patch(f"/v1/workout-programs/{pid}", json={"name": "x"}, headers=h)).status_code == 403


async def test_unused_program_can_be_deleted(auth_client):
    pid, _, _ = await _program_with_day(auth_client)
    assert (await auth_client.delete(f"/v1/workout-programs/{pid}")).status_code == 200
    assert (await auth_client.get(f"/v1/workout-programs/{pid}")).status_code == 404


async def test_program_used_by_a_session_cannot_be_deleted(auth_client, engine):
    """BRD §7 soft-delete: archive, never delete, once history references it."""
    pid, day_id, _ = await _program_with_day(auth_client)

    maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with maker() as db:
        me = await db.scalar(select(User).order_by(User.created_at.desc()).limit(1))
        db.add(WorkoutSession(
            user_id=me.id, plan_day_id=uuid.UUID(day_id),
            started_at=datetime.now(UTC), status=SessionStatus.completed,
            local_date=datetime.now(UTC).date(), logged_timezone="UTC",
        ))
        await db.commit()

    r = await auth_client.delete(f"/v1/workout-programs/{pid}")
    assert r.status_code == 409
    assert "archive it instead" in r.json()["error"]["message"]


async def test_ac12_editing_a_plan_leaves_a_logged_session_untouched(auth_client, engine):
    """AC-12 — the reason the plan tree and the performed tree are separate."""
    pid, day_id, ex = await _program_with_day(auth_client)

    maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with maker() as db:
        me = await db.scalar(select(User).order_by(User.created_at.desc()).limit(1))
        s = WorkoutSession(
            user_id=me.id, plan_day_id=uuid.UUID(day_id), started_at=datetime.now(UTC),
            status=SessionStatus.completed, local_date=datetime.now(UTC).date(),
            logged_timezone="UTC",
        )
        db.add(s); await db.flush()
        se = SessionExercise(
            session_id=s.id, exercise_id=uuid.UUID(ex[0]), order_index=0,
            target_snapshot={"target_sets": 4, "target_reps_min": 6, "target_reps_max": 8},
        )
        db.add(se); await db.flush()
        for i, (load, reps) in enumerate([(80, 8), (80, 8), (80, 7)]):
            db.add(WorkoutSet(
                session_exercise_id=se.id, set_index=i, set_type=SetType.working,
                load_kg=load, reps=reps, completed=True, performed_at=datetime.now(UTC),
            ))
        await db.commit()
        se_id = se.id

    async def snapshot():
        async with maker() as db:
            sets = (await db.scalars(
                select(WorkoutSet).where(WorkoutSet.session_exercise_id == se_id)
                .order_by(WorkoutSet.set_index)
            )).all()
            se = await db.scalar(select(SessionExercise).where(SessionExercise.id == se_id))
            return (
                [(s.set_index, float(s.load_kg), s.reps, s.completed) for s in sets],
                dict(se.target_snapshot),
            )

    before = await snapshot()

    # Now change the plan in every way that could plausibly leak.
    # Each call MUST succeed — otherwise this test passes trivially by never
    # exercising the code path it claims to guard.
    r1 = await auth_client.patch(f"/v1/workout-programs/{pid}", json={"name": "Totally Different"})
    r2 = await auth_client.patch(f"/v1/plan-days/{day_id}", json={"name": "Renamed", "clear_schedule": True})
    r3 = await auth_client.put(f"/v1/plan-days/{day_id}/exercises", json=[
        {"exercise_id": ex[2], "target_sets": 9, "target_reps_min": 1, "target_reps_max": 2},
    ])
    for label, r in (("patch program", r1), ("patch day", r2), ("replace exercises", r3)):
        assert r.status_code == 200, f"{label} failed ({r.status_code}): {r.text[:200]}"

    # The plan really did change...
    changed = (await auth_client.get(f"/v1/workout-programs/{pid}")).json()["data"]
    assert changed["name"] == "Totally Different"
    assert changed["days"][0]["exercises"][0]["target_sets"] == 9

    # ...and the logged performance did not.
    after = await snapshot()
    assert after == before, "a plan edit changed logged performance — AC-12 violated"



# ------------------------------------------------- m4: time/distance targets

async def test_a_plan_exercise_can_prescribe_duration_and_distance(auth_client):
    """C-07 renders from the exercise's tracked fields, so a plank needs a time
    target and a run needs a distance one. Before m4 there was nowhere to put them."""
    r = await auth_client.post("/v1/workout-programs", json={"name": "Conditioning"})
    assert r.status_code == 201, r.text
    r = await auth_client.post(
        f"/v1/workout-programs/{r.json()['data']['id']}/days", json={"name": "Core"}
    )
    assert r.status_code == 201, r.text
    day_id = r.json()["data"]["days"][0]["id"]
    ex = await _exercise_ids(auth_client, 2)

    r = await auth_client.put(f"/v1/plan-days/{day_id}/exercises", json=[
        {"exercise_id": ex[0], "target_sets": 3, "target_duration_seconds": 60},
        {"exercise_id": ex[1], "target_sets": 1, "target_distance_m": 5000},
    ])
    assert r.status_code == 200, r.text
    saved = r.json()["data"]

    rows = saved["days"][0]["exercises"]
    assert rows[0]["target_duration_seconds"] == 60
    assert rows[0]["target_reps_min"] is None
    assert rows[1]["target_distance_m"] == 5000
    assert rows[1]["target_load"] is None


async def test_the_session_snapshot_carries_the_time_target(auth_client):
    """I1 — the logger reads the frozen snapshot, never the live plan. If the
    target is not in the snapshot the logger cannot show it."""
    r = await auth_client.post("/v1/workout-programs", json={"name": "Conditioning 2"})
    assert r.status_code == 201, r.text
    r = await auth_client.post(
        f"/v1/workout-programs/{r.json()['data']['id']}/days", json={"name": "Core"}
    )
    assert r.status_code == 201, r.text
    day_id = r.json()["data"]["days"][0]["id"]
    ex = await _exercise_ids(auth_client, 1)
    r = await auth_client.put(f"/v1/plan-days/{day_id}/exercises", json=[
        {"exercise_id": ex[0], "target_sets": 3, "target_duration_seconds": 45},
    ])
    assert r.status_code == 200, r.text

    r = await auth_client.post("/v1/workout-sessions", json={"plan_day_id": day_id})
    assert r.status_code == 201, r.text
    s = r.json()["data"]

    snap = s["exercises"][0]["target_snapshot"]
    assert snap["target_duration_seconds"] == 45
    assert snap["target_distance_m"] is None
