"""Training analytics (G6), and **AC-06**.

AC-06 is not "analytics works". It is an *agreement*: the same session's volume
reads identically on the finish summary (E-08), in session detail (F-03) and in
analytics (G-02). That only holds while there is ONE definition of volume, so
every number here defers to `app.domain.training` and nothing recomputes
`SUM(load_kg * reps)` in SQL.

The invariants these tests exist to pin:

  I3  warm-ups never count toward volume or PRs (D6)
  I4  muscle volume is primary x1.0, secondary x0.5 (D7)
  I5  e1RM carries its formula version; one series never mixes versions
  I7  weekly and monthly buckets are built from LOCAL dates
"""
from __future__ import annotations

import uuid
from datetime import UTC, datetime, timedelta

import pytest
from sqlalchemy import select

from app.domain.training import E1RM_FORMULA_VERSION
from app.models import MuscleGroup

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


async def _catalog_exercise(client) -> str:
    return _data(await client.get("/v1/exercises", params={"limit": 1}))[0]["id"]


async def _custom_exercise(client, db, *, muscles: list[tuple[str, str]]) -> str:
    """A user-owned exercise mapped to `(slug, role)` pairs.

    Through the API so it is not a global catalog row — `test_seed_catalog.py`
    counts those, and G5 learned that the hard way.
    """
    payload = []
    for slug, role in muscles:
        group = await db.scalar(select(MuscleGroup).where(MuscleGroup.slug == slug))
        assert group is not None, slug
        payload.append({"muscle_group_id": str(group.id), "role": role})
    created = _data(await client.post("/v1/exercises", json={
        "name": f"Analytics {uuid.uuid4().hex[:6]}",
        "equipment": "barbell",
        "muscles": payload,
    }), 201)
    return created["id"]


async def _grandchild_chest_exercise(client, db) -> tuple[str, str]:
    """An exercise whose chest link is a GRANDCHILD of Chest.

    Chest -> Upper Chest -> Clavicular Head. G6 must recurse the tree exactly as
    G5's rule does, and a one-level join matches every fixture that exists
    without this.
    """
    upper = await db.scalar(select(MuscleGroup).where(MuscleGroup.slug == "upper-chest"))
    grandchild = MuscleGroup(
        name=f"Clavicular Head {uuid.uuid4().hex[:6]}",
        slug=f"clav-{uuid.uuid4().hex[:6]}",
        parent_id=upper.id,
    )
    db.add(grandchild)
    await db.commit()

    created = _data(await client.post("/v1/exercises", json={
        "name": f"Incline {uuid.uuid4().hex[:6]}",
        "equipment": "barbell",
        "muscles": [{"muscle_group_id": str(grandchild.id), "role": "primary"}],
    }), 201)
    return created["id"], grandchild.slug


async def _session(client, plan: dict[str, list[dict]], *, started_at=None) -> dict:
    """`plan` maps exercise_id -> set payloads. Returns the finish response."""
    body: dict = {"exercise_ids": list(plan)}
    if started_at is not None:
        body["started_at"] = started_at.isoformat()
    s = _data(await client.post("/v1/workout-sessions", json=body), 201)
    by_exercise = {se["exercise_id"]: se["id"] for se in s["exercises"]}
    for exercise_id, sets in plan.items():
        for payload in sets:
            await _post_set(client, by_exercise[exercise_id], payload)
    return _data(await client.post(f"/v1/workout-sessions/{s['id']}/finish", json={}))


W = {"set_type": "working"}
WARMUP = {"set_type": "warmup"}


# --------------------------------------------------------------------- AC-06

class TestAC06:
    async def test_the_same_session_reads_the_same_on_all_three_surfaces(
        self, auth_client
    ):
        """E-08, F-03 and G-02 — one session, three surfaces, identical numbers.

        This is the whole goal in one test. If a SQL aggregate ever becomes the
        second definition of volume, this is what fails.
        """
        ex = await _catalog_exercise(auth_client)
        started = datetime.now(UTC) - timedelta(days=2)
        finished = await _session(auth_client, {ex: [
            {**WARMUP, "load_kg": 60.0, "reps": 10},     # 600, and must NOT count
            {**W, "load_kg": 100.0, "reps": 5},          # 500
            {**W, "load_kg": 100.0, "reps": 5},          # 500
        ]}, started_at=started)

        # E-08 — the finish summary
        e08_volume = finished["total_volume_kg"]

        # F-03 — session detail, read back
        f03 = _data(await auth_client.get(f"/v1/workout-sessions/{finished['id']}"))
        f03_volume = f03["total_volume_kg"]

        # G-02 — analytics
        day = finished["local_date"]
        buckets = _data(await auth_client.get("/v1/analytics/workouts", params={
            "from": day, "to": day, "group_by": "day",
        }))["buckets"]
        g02_volume = sum(b["volume_kg"] for b in buckets)

        assert e08_volume == 1000.0, "I3 — the warm-up is excluded"
        assert f03_volume == e08_volume, "F-03 disagrees with E-08"
        assert g02_volume == e08_volume, "G-02 disagrees with the logger"


# ------------------------------------------------- GET /analytics/workouts

class TestWorkouts:
    async def test_buckets_by_week_from_local_dates(self, auth_client):
        # I7. Bucketing by the UTC instant puts a late-evening session in the
        # wrong week for everyone east of Greenwich.
        _data(await auth_client.patch("/v1/profile", json={"timezone": "Asia/Kolkata"}))
        ex = await _catalog_exercise(auth_client)
        # 18:40Z on the 21st is 00:10 on the 22nd local — a different week.
        await _session(auth_client, {ex: [{**W, "load_kg": 50.0, "reps": 10}]},
                       started_at=datetime(2026, 9, 21, 18, 40, tzinfo=UTC))

        data = _data(await auth_client.get("/v1/analytics/workouts", params={
            "from": "2026-09-01", "to": "2026-09-30", "group_by": "week",
        }))

        weeks = [b for b in data["buckets"] if b["volume_kg"] > 0]
        assert len(weeks) == 1
        assert weeks[0]["start"] == "2026-09-21", "the week the USER trained in"

    async def test_excludes_warm_ups(self, auth_client):
        ex = await _catalog_exercise(auth_client)
        finished = await _session(auth_client, {ex: [
            {**WARMUP, "load_kg": 60.0, "reps": 10},
            {**W, "load_kg": 80.0, "reps": 5},
        ]})

        day = finished["local_date"]
        data = _data(await auth_client.get("/v1/analytics/workouts", params={
            "from": day, "to": day, "group_by": "day",
        }))

        assert sum(b["volume_kg"] for b in data["buckets"]) == 400.0

    async def test_reports_zero_for_a_bucket_with_no_training(self, auth_client):
        # A gap is information: the chart must draw a zero column, not skip the
        # week and make a lay-off look like continuous training.
        data = _data(await auth_client.get("/v1/analytics/workouts", params={
            "from": "2026-01-05", "to": "2026-01-25", "group_by": "week",
        }))

        assert len(data["buckets"]) == 3
        assert all(b["volume_kg"] == 0 for b in data["buckets"])

    async def test_rejects_an_unknown_grouping(self, auth_client):
        r = await auth_client.get("/v1/analytics/workouts", params={
            "from": "2026-01-01", "to": "2026-01-31", "group_by": "fortnight",
        })
        assert r.status_code == 422, r.text


# -------------------------------------------- GET /analytics/muscle-volume

class TestMuscleVolume:
    async def test_weights_primary_one_and_secondary_half(self, auth_client, db):
        # I4 / D7. 100x5 = 500 -> chest 500 (primary), triceps 250 (secondary).
        ex = await _custom_exercise(auth_client, db, muscles=[
            ("chest", "primary"), ("triceps", "secondary"),
        ])
        await _session(auth_client, {ex: [{**W, "load_kg": 100.0, "reps": 5}]})

        rows = {r["slug"]: r["volume_kg"] for r in _data(
            await auth_client.get("/v1/analytics/muscle-volume")
        )}

        assert rows["chest"] == 500.0
        assert rows["triceps"] == 250.0

    async def test_rolls_a_GRANDCHILD_up_to_its_ancestor(self, auth_client, db):
        # The recursion, shared with AC-05's rule. A one-level join reports the
        # grandchild and leaves Chest at zero.
        ex, grandchild = await _grandchild_chest_exercise(auth_client, db)
        await _session(auth_client, {ex: [{**W, "load_kg": 80.0, "reps": 10}]})

        rows = {r["slug"]: r["volume_kg"] for r in _data(
            await auth_client.get("/v1/analytics/muscle-volume")
        )}

        assert rows.get(grandchild) == 800.0, "the group it was actually mapped to"
        assert rows.get("upper-chest") == 800.0, "and its parent"
        assert rows.get("chest") == 800.0, "and ITS parent — one level up is not enough"

    async def test_excludes_warm_ups(self, auth_client, db):
        ex = await _custom_exercise(auth_client, db, muscles=[("chest", "primary")])
        await _session(auth_client, {ex: [
            {**WARMUP, "load_kg": 40.0, "reps": 10},
            {**W, "load_kg": 100.0, "reps": 5},
        ]})

        rows = {r["slug"]: r["volume_kg"] for r in _data(
            await auth_client.get("/v1/analytics/muscle-volume")
        )}

        assert rows["chest"] == 500.0

    async def test_sorted_heaviest_first(self, auth_client, db):
        # G-02 draws a sorted horizontal bar; sorting in the client would mean
        # two orders to keep in step.
        ex = await _custom_exercise(auth_client, db, muscles=[
            ("chest", "primary"), ("triceps", "secondary"),
        ])
        await _session(auth_client, {ex: [{**W, "load_kg": 100.0, "reps": 5}]})

        rows = _data(await auth_client.get("/v1/analytics/muscle-volume"))
        volumes = [r["volume_kg"] for r in rows]

        assert volumes == sorted(volumes, reverse=True)


# ------------------------------------ GET /analytics/exercises/{exercise_id}

class TestExerciseProgression:
    async def test_returns_an_e1rm_series_carrying_its_formula_version(
        self, auth_client
    ):
        # I5. A chart that mixes formula versions is silently wrong, so the
        # version travels with the series rather than being assumed.
        ex = await _catalog_exercise(auth_client)
        await _session(auth_client, {ex: [{**W, "load_kg": 100.0, "reps": 5}]},
                       started_at=datetime.now(UTC) - timedelta(days=3))

        data = _data(await auth_client.get(f"/v1/analytics/exercises/{ex}"))

        assert data["formula_version"] == E1RM_FORMULA_VERSION
        assert len(data["points"]) == 1
        # Epley: 100 * (1 + 5/30) = 116.67
        assert data["points"][0]["e1rm_kg"] == pytest.approx(116.67, abs=0.01)

    async def test_excludes_warm_ups_from_the_series(self, auth_client):
        ex = await _catalog_exercise(auth_client)
        await _session(auth_client, {ex: [
            {**WARMUP, "load_kg": 140.0, "reps": 1},   # heaviest, and not a PR attempt
            {**W, "load_kg": 100.0, "reps": 5},
        ]})

        data = _data(await auth_client.get(f"/v1/analytics/exercises/{ex}"))

        assert data["points"][0]["max_load_kg"] == 100.0

    async def test_says_nothing_rather_than_an_empty_chart_for_an_unperformed_exercise(
        self, auth_client
    ):
        ex = await _catalog_exercise(auth_client)
        data = _data(await auth_client.get(f"/v1/analytics/exercises/{ex}"))
        assert data["points"] == []

    async def test_404s_an_exercise_that_does_not_exist(self, auth_client):
        r = await auth_client.get(f"/v1/analytics/exercises/{uuid.uuid4()}")
        assert r.status_code == 404, r.text


# ------------------------------------- GET /analytics/personal-records

class TestPersonalRecords:
    async def test_returns_the_headline_numbers(self, auth_client):
        ex = await _catalog_exercise(auth_client)
        await _session(auth_client, {ex: [{**W, "load_kg": 120.0, "reps": 3}]})

        rows = _data(await auth_client.get("/v1/analytics/personal-records"))

        assert rows, "a PR board with history must not be empty"
        best = rows[0]
        assert best["max_load_kg"] == 120.0
        assert best["estimated_1rm_kg"] == pytest.approx(132.0, abs=0.01)
        assert best["formula_version"] == E1RM_FORMULA_VERSION

    async def test_a_warm_up_is_never_a_record(self, auth_client):
        ex = await _catalog_exercise(auth_client)
        await _session(auth_client, {ex: [
            {**WARMUP, "load_kg": 200.0, "reps": 1},
            {**W, "load_kg": 100.0, "reps": 5},
        ]})

        rows = _data(await auth_client.get("/v1/analytics/personal-records"))

        assert rows[0]["max_load_kg"] == 100.0


# ------------------------------------------- GET /analytics/frequency

class TestFrequency:
    async def test_counts_sessions_per_muscle_per_week(self, auth_client, db):
        ex = await _custom_exercise(auth_client, db, muscles=[("chest", "primary")])
        await _session(auth_client, {ex: [{**W, "load_kg": 80.0, "reps": 5}]},
                       started_at=datetime(2026, 9, 22, 10, 0, tzinfo=UTC))

        data = _data(await auth_client.get("/v1/analytics/frequency", params={
            "from": "2026-09-21", "to": "2026-09-27",
        }))

        cell = [c for c in data["cells"] if c["slug"] == "chest"]
        assert cell and cell[0]["sessions"] == 1

    async def test_counts_a_session_once_per_muscle_however_many_exercises_hit_it(
        self, auth_client, db
    ):
        # Frequency is "how often did I train chest", not "how many chest
        # exercises did I do". Counting exercises makes a 3-movement chest day
        # look like three chest days.
        a = await _custom_exercise(auth_client, db, muscles=[("chest", "primary")])
        b = await _custom_exercise(auth_client, db, muscles=[("chest", "primary")])
        await _session(auth_client, {
            a: [{**W, "load_kg": 80.0, "reps": 5}],
            b: [{**W, "load_kg": 60.0, "reps": 8}],
        }, started_at=datetime(2026, 9, 22, 10, 0, tzinfo=UTC))

        data = _data(await auth_client.get("/v1/analytics/frequency", params={
            "from": "2026-09-21", "to": "2026-09-27",
        }))

        chest = [c for c in data["cells"] if c["slug"] == "chest"]
        assert chest[0]["sessions"] == 1


# ------------------------------------------- GET /analytics/adherence

class TestAdherence:
    async def test_is_undefined_rather_than_zero_without_a_plan(self, auth_client):
        # PRD W07.7 via app.domain.adherence. Someone with no program has not
        # failed to adhere to anything, and G-06 must say so.
        data = _data(await auth_client.get("/v1/analytics/adherence", params={
            "from": "2026-09-21", "to": "2026-09-27",
        }))

        assert data["planned"] == 0
        assert data["adherence"] is None

    async def test_counts_planned_occurrences_from_the_schedule(self, auth_client):
        program = _data(await auth_client.post("/v1/workout-programs",
                                               json={"name": "PPL"}), 201)
        _data(await auth_client.post(f"/v1/workout-programs/{program['id']}/days",
                                     json={"name": "Push", "scheduled_weekday": 1}), 201)

        data = _data(await auth_client.get("/v1/analytics/adherence", params={
            "from": "2026-09-21", "to": "2026-10-04",     # two Mondays
        }))

        assert data["planned"] == 2
        assert data["completed_planned"] == 0
        assert data["adherence"] == 0.0, "planned and missed is 0, not undefined"


# --------------------------------------------------------------- performance

class TestReadModel:
    async def test_the_session_scan_is_index_driven_and_bounded_by_the_range(self, db):
        """G6's contract: analytics must not scan every set on every request.

        No migration was added for this because none is needed — but "no index
        was needed" is a claim, and this is the evidence. `ix_sessions_user_local_date`
        is partial on `status = 'completed'` and keyed `(user_id, local_date)`,
        which is exactly what `_completed_sessions` filters on; the sets then load
        by `session_exercise_id`, which `uq_set_index` covers.

        If someone later widens the filter to `started_at`, or drops the status
        predicate, the plan stops matching the index and this fails — which is
        the point. A comment claiming the read is cheap would not.
        """
        from sqlalchemy import text

        plan = "\n".join(row[0] for row in (await db.execute(text(
            """
            EXPLAIN SELECT * FROM workout_sessions
            WHERE user_id = '00000000-0000-0000-0000-000000000001'
              AND status = 'completed'
              AND local_date >= '2026-07-01' AND local_date <= '2026-09-30'
            """
        ))).all())

        assert "ix_sessions_user_local_date" in plan, plan
        assert "Seq Scan on workout_sessions" not in plan, plan

    async def test_sets_are_reachable_by_an_index_not_a_table_scan(self, db):
        from sqlalchemy import text

        plan = "\n".join(row[0] for row in (await db.execute(text(
            """
            EXPLAIN SELECT * FROM workout_sets
            WHERE session_exercise_id = '00000000-0000-0000-0000-000000000001'
            """
        ))).all())

        assert "Seq Scan on workout_sets" not in plan, plan
