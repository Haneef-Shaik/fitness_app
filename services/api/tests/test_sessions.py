"""Session & set API — §4. The logger's server half.

Two things are load-bearing here and both have a dedicated test:
  * a replayed offline write must never duplicate a set (4.3, 4.5);
  * the numbers the summary screen shows must equal the shared contract vectors,
    because the phone computed its own copy of them offline (4.10).
"""
from __future__ import annotations

import json
import uuid
from datetime import UTC, datetime, timedelta
from pathlib import Path

import pytest

from tests.auth import sign_up

pytestmark = pytest.mark.asyncio

VECTORS = json.loads(
    (Path(__file__).parents[3] / "contracts" / "vectors" / "domain.json").read_text()
)
TOL = VECTORS["tolerance"]


def _data(response, expect: int = 200):
    # Every mutating call is asserted. An unasserted call makes a test vacuous: the
    # route can 500 and the assertions that follow still pass on stale state.
    assert response.status_code == expect, response.text
    return response.json()["data"]


async def _exercise_ids(client, n=3) -> list[str]:
    rows = _data(await client.get("/v1/exercises", params={"limit": 50}))
    return [e["id"] for e in rows[:n]]


async def _plan_day(client) -> tuple[str, str, list[str]]:
    p = _data(await client.post("/v1/workout-programs", json={"name": "PPL"}), 201)
    p = _data(await client.post(
        f"/v1/workout-programs/{p['id']}/days", json={"name": "Push"}
    ), 201)
    day_id = p["days"][0]["id"]
    ex = await _exercise_ids(client)
    _data(await client.put(f"/v1/plan-days/{day_id}/exercises", json=[
        {"exercise_id": ex[0], "target_sets": 4, "target_reps_min": 6,
         "target_reps_max": 8, "target_load": 80, "rest_seconds": 180},
        {"exercise_id": ex[1], "target_sets": 3, "target_reps_min": 8, "target_reps_max": 10},
    ]))
    return p["id"], day_id, ex


async def _post_set(client, se_id: str, body: dict, key: str | None = None, expect: int = 201):
    return _data(
        await client.post(
            f"/v1/session-exercises/{se_id}/sets", json=body,
            headers={"Idempotency-Key": key or str(uuid.uuid4())},
        ),
        expect,
    )


# ---------------------------------------------------------------- 4.1 start

async def test_start_from_plan_day_snapshots_the_prescription(auth_client):
    _, day_id, _ = await _plan_day(auth_client)
    s = _data(await auth_client.post("/v1/workout-sessions", json={"plan_day_id": day_id}), 201)

    assert s["status"] == "in_progress"
    assert [e["order_index"] for e in s["exercises"]] == [0, 1]
    snap = s["exercises"][0]["target_snapshot"]
    assert snap["target_sets"] == 4 and snap["target_load"] == 80.0
    assert snap["rest_seconds"] == 180
    assert s["exercises"][0]["exercise_name"]        # resolved, not a bare id


async def test_ac12_editing_the_plan_after_start_cannot_rewrite_the_snapshot(auth_client):
    _, day_id, ex = await _plan_day(auth_client)
    s = _data(await auth_client.post("/v1/workout-sessions", json={"plan_day_id": day_id}), 201)
    before = s["exercises"][0]["target_snapshot"]

    # Rewrite the plan day completely — different exercise, different prescription.
    _data(await auth_client.put(f"/v1/plan-days/{day_id}/exercises", json=[
        {"exercise_id": ex[2], "target_sets": 12, "target_load": 200},
    ]))

    after = _data(await auth_client.get(f"/v1/workout-sessions/{s['id']}"))
    assert len(after["exercises"]) == 2, "the plan edit reached into the performed tree"
    assert after["exercises"][0]["target_snapshot"] == before
    assert after["exercises"][0]["exercise_id"] == ex[0]


async def test_start_from_an_ad_hoc_exercise_list(auth_client):
    ex = await _exercise_ids(auth_client)
    s = _data(await auth_client.post(
        "/v1/workout-sessions", json={"exercise_ids": ex[:2]}
    ), 201)
    assert [e["exercise_id"] for e in s["exercises"]] == ex[:2]
    assert all(e["target_snapshot"] is None for e in s["exercises"])


async def test_start_empty_then_add_an_exercise_mid_session(auth_client):
    ex = await _exercise_ids(auth_client)
    s = _data(await auth_client.post("/v1/workout-sessions", json={}), 201)
    assert s["exercises"] == []
    s = _data(await auth_client.post(
        f"/v1/workout-sessions/{s['id']}/exercises", json={"exercise_id": ex[0]}
    ), 201)
    assert len(s["exercises"]) == 1 and s["exercises"][0]["order_index"] == 0


async def test_repeat_copies_the_shape_not_the_sets(auth_client):
    ex = await _exercise_ids(auth_client)
    first = _data(await auth_client.post(
        "/v1/workout-sessions", json={"exercise_ids": ex[:2]}
    ), 201)
    await _post_set(auth_client, first["exercises"][0]["id"], {"reps": 8, "load_kg": 60})
    _data(await auth_client.post(f"/v1/workout-sessions/{first['id']}/finish"))

    repeat = _data(await auth_client.post(
        "/v1/workout-sessions", json={"repeat_session_id": first["id"]}
    ), 201)
    assert [e["exercise_id"] for e in repeat["exercises"]] == ex[:2]
    assert all(e["sets"] == [] for e in repeat["exercises"]), "repeat pre-filled the sets"


async def test_a_future_dated_session_is_refused(auth_client):
    """T9 — backdating is allowed everywhere; the future is not."""
    future = (datetime.now(UTC) + timedelta(days=1)).isoformat()
    r = await auth_client.post("/v1/workout-sessions", json={"started_at": future})
    assert r.status_code == 422, r.text
    assert r.json()["error"]["code"] == "VALIDATION_FAILED"


async def test_a_backdated_session_files_under_its_own_local_date(auth_client):
    """T1/T9 — the session belongs to the day it STARTED, in the user's timezone."""
    _data(await auth_client.patch("/v1/profile", json={"timezone": "Pacific/Auckland"}))
    # 22:30 UTC is already the NEXT day in Auckland (UTC+12/+13).
    started = datetime(2026, 3, 10, 22, 30, tzinfo=UTC)
    s = _data(await auth_client.post(
        "/v1/workout-sessions", json={"started_at": started.isoformat()}
    ), 201)
    assert s["local_date"] == "2026-03-11"
    assert s["logged_timezone"] == "Pacific/Auckland"


async def test_only_one_source_may_be_given(auth_client):
    _, day_id, ex = await _plan_day(auth_client)
    r = await auth_client.post(
        "/v1/workout-sessions", json={"plan_day_id": day_id, "exercise_ids": ex[:1]}
    )
    assert r.status_code == 422, r.text


# ------------------------------------------------------------- 4.9 one open

async def test_starting_a_second_session_while_one_is_open_is_refused(auth_client):
    """4.9 — and the refusal carries the open session's id, so E-01 can offer
    "finish" or "discard" instead of leaving the user stuck."""
    ex = await _exercise_ids(auth_client)
    first = _data(await auth_client.post(
        "/v1/workout-sessions", json={"exercise_ids": ex[:1]}
    ), 201)

    r = await auth_client.post("/v1/workout-sessions", json={"exercise_ids": ex[:1]})
    assert r.status_code == 409, r.text
    err = r.json()["error"]
    assert err["code"] == "CONFLICT"
    assert err["fields"]["active_session_id"] == first["id"]

    # And once the first is finished, a second starts normally.
    _data(await auth_client.post(f"/v1/workout-sessions/{first['id']}/finish"))
    _data(await auth_client.post("/v1/workout-sessions", json={"exercise_ids": ex[:1]}), 201)


async def test_active_returns_null_rather_than_404_when_nothing_is_open(auth_client):
    r = await auth_client.get("/v1/workout-sessions/active")
    assert r.status_code == 200, r.text
    assert r.json()["data"] is None

    ex = await _exercise_ids(auth_client)
    started = _data(await auth_client.post(
        "/v1/workout-sessions", json={"exercise_ids": ex[:1]}
    ), 201)
    assert _data(await auth_client.get("/v1/workout-sessions/active"))["id"] == started["id"]


# ------------------------------------------------------------ 4.3 idempotency

async def test_a_set_write_without_an_idempotency_key_is_refused(auth_client):
    ex = await _exercise_ids(auth_client)
    s = _data(await auth_client.post("/v1/workout-sessions", json={"exercise_ids": ex[:1]}), 201)
    se_id = s["exercises"][0]["id"]

    r = await auth_client.post(
        f"/v1/session-exercises/{se_id}/sets", json={"reps": 8, "load_kg": 60}
    )
    assert r.status_code == 422, r.text
    assert "Idempotency-Key" in r.json()["error"]["fields"]


async def test_a_replayed_set_write_lands_on_the_same_row(auth_client):
    """The logger commits locally and flushes later, so the same write arriving
    twice is routine. The second must UPDATE, never append."""
    ex = await _exercise_ids(auth_client)
    s = _data(await auth_client.post("/v1/workout-sessions", json={"exercise_ids": ex[:1]}), 201)
    se_id = s["exercises"][0]["id"]
    key = str(uuid.uuid4())

    first = await _post_set(auth_client, se_id, {"reps": 8, "load_kg": 60}, key)
    again = await _post_set(auth_client, se_id, {"reps": 8, "load_kg": 60}, key, expect=200)
    assert again["id"] == first["id"]

    # A corrected replay converges on the same row rather than forking.
    fixed = await _post_set(auth_client, se_id, {"reps": 9, "load_kg": 62.5}, key, expect=200)
    assert fixed["id"] == first["id"] and fixed["reps"] == 9

    s = _data(await auth_client.get(f"/v1/workout-sessions/{s['id']}"))
    assert len(s["exercises"][0]["sets"]) == 1, "the replay duplicated the set"


async def test_set_indices_are_dense_and_zero_based(auth_client):
    ex = await _exercise_ids(auth_client)
    s = _data(await auth_client.post("/v1/workout-sessions", json={"exercise_ids": ex[:1]}), 201)
    se_id = s["exercises"][0]["id"]
    for reps in (10, 9, 8):
        await _post_set(auth_client, se_id, {"reps": reps, "load_kg": 60})
    s = _data(await auth_client.get(f"/v1/workout-sessions/{s['id']}"))
    assert [x["set_index"] for x in s["exercises"][0]["sets"]] == [0, 1, 2]


async def test_a_set_must_measure_something(auth_client):
    """W04.7 — a load with no reps, time or distance is not a set."""
    ex = await _exercise_ids(auth_client)
    s = _data(await auth_client.post("/v1/workout-sessions", json={"exercise_ids": ex[:1]}), 201)
    r = await auth_client.post(
        f"/v1/session-exercises/{s['exercises'][0]['id']}/sets",
        json={"load_kg": 60}, headers={"Idempotency-Key": str(uuid.uuid4())},
    )
    assert r.status_code == 422, r.text


# ------------------------------------------------------------- 4.4 edit/delete

async def test_deleting_a_set_redensifies_the_indices(auth_client):
    """A gap would render as "Set 1, Set 3" in the logger."""
    ex = await _exercise_ids(auth_client)
    s = _data(await auth_client.post("/v1/workout-sessions", json={"exercise_ids": ex[:1]}), 201)
    se_id = s["exercises"][0]["id"]
    rows = [await _post_set(auth_client, se_id, {"reps": r, "load_kg": 60}) for r in (10, 9, 8)]

    _data(await auth_client.delete(f"/v1/workout-sets/{rows[0]['id']}"))
    s = _data(await auth_client.get(f"/v1/workout-sessions/{s['id']}"))
    sets = s["exercises"][0]["sets"]
    assert [x["set_index"] for x in sets] == [0, 1]
    assert [x["reps"] for x in sets] == [9, 8], "the wrong set survived"


async def test_editing_a_set_rederives_its_e1rm(auth_client):
    ex = await _exercise_ids(auth_client)
    s = _data(await auth_client.post("/v1/workout-sessions", json={"exercise_ids": ex[:1]}), 201)
    row = await _post_set(auth_client, s["exercises"][0]["id"], {"reps": 8, "load_kg": 80})
    assert row["e1rm_kg"] == pytest.approx(101.33, abs=0.01)
    assert row["formula_version"] == "epley_v1"

    edited = _data(await auth_client.patch(
        f"/v1/workout-sets/{row['id']}", json={"reps": 5, "load_kg": 140}
    ))
    assert edited["e1rm_kg"] == pytest.approx(163.33, abs=0.01)


async def test_a_warmup_carries_no_e1rm(auth_client):
    """D6 — a warm-up is not a performance, so it must not produce an estimate that
    could later read as a record."""
    ex = await _exercise_ids(auth_client)
    s = _data(await auth_client.post("/v1/workout-sessions", json={"exercise_ids": ex[:1]}), 201)
    row = await _post_set(
        auth_client, s["exercises"][0]["id"],
        {"reps": 12, "load_kg": 40, "set_type": "warmup"},
    )
    assert row["e1rm_kg"] is None and row["formula_version"] is None


async def test_an_edit_cannot_empty_a_set(auth_client):
    ex = await _exercise_ids(auth_client)
    s = _data(await auth_client.post("/v1/workout-sessions", json={"exercise_ids": ex[:1]}), 201)
    row = await _post_set(auth_client, s["exercises"][0]["id"], {"reps": 8, "load_kg": 60})
    r = await auth_client.patch(f"/v1/workout-sets/{row['id']}", json={"reps": None})
    assert r.status_code == 422, r.text


# ----------------------------------------------------------------- 4.5 batch

async def test_the_outbox_flush_is_idempotent_per_set(auth_client):
    """4.5 — a partially-delivered batch is resent WHOLE. Re-sending must not
    duplicate the items that did land."""
    ex = await _exercise_ids(auth_client)
    s = _data(await auth_client.post("/v1/workout-sessions", json={"exercise_ids": ex[:2]}), 201)
    a, b = s["exercises"][0]["id"], s["exercises"][1]["id"]
    batch = [
        {"session_exercise_id": a, "client_id": str(uuid.uuid4()), "reps": 8, "load_kg": 80},
        {"session_exercise_id": a, "client_id": str(uuid.uuid4()), "reps": 8, "load_kg": 80},
        {"session_exercise_id": b, "client_id": str(uuid.uuid4()), "reps": 12, "load_kg": 30},
    ]

    first = _data(await auth_client.post(f"/v1/workout-sessions/{s['id']}/sets/batch", json=batch))
    assert [r["created"] for r in first["results"]] == [True, True, True]

    second = _data(await auth_client.post(f"/v1/workout-sessions/{s['id']}/sets/batch", json=batch))
    assert [r["created"] for r in second["results"]] == [False, False, False]
    assert [r["set"]["id"] for r in second["results"]] == [r["set"]["id"] for r in first["results"]]

    s = _data(await auth_client.get(f"/v1/workout-sessions/{s['id']}"))
    assert [len(e["sets"]) for e in s["exercises"]] == [2, 1]


async def test_one_bad_item_does_not_strand_the_rest_of_the_queue(auth_client):
    ex = await _exercise_ids(auth_client)
    s = _data(await auth_client.post("/v1/workout-sessions", json={"exercise_ids": ex[:1]}), 201)
    se_id = s["exercises"][0]["id"]
    out = _data(await auth_client.post(f"/v1/workout-sessions/{s['id']}/sets/batch", json=[
        {"session_exercise_id": se_id, "client_id": str(uuid.uuid4()), "load_kg": 60},   # no reps
        {"session_exercise_id": str(uuid.uuid4()), "client_id": str(uuid.uuid4()), "reps": 5},
        {"session_exercise_id": se_id, "client_id": str(uuid.uuid4()), "reps": 8, "load_kg": 60},
    ]))
    assert [r["accepted"] for r in out["results"]] == [False, False, True]
    assert all(r.get("error") for r in out["results"] if not r["accepted"])


# ------------------------------------------------- 4.6 / 4.10 finish & vectors

async def test_finish_computes_volume_e1rm_and_prs_from_the_shared_vectors(auth_client):
    """4.10 — the server's numbers must equal contracts/vectors/domain.json, because
    the phone computed its own copy of them offline while the set was logged."""
    case = VECTORS["personal_records"]
    ex = await _exercise_ids(auth_client)
    s = _data(await auth_client.post("/v1/workout-sessions", json={"exercise_ids": ex[:1]}), 201)
    se_id = s["exercises"][0]["id"]

    for spec in case["sets"]:
        await _post_set(auth_client, se_id, {
            "set_type": spec["set_type"], "reps": spec["reps"],
            "load_kg": spec["load_kg"], "completed": spec["completed"],
        })

    finished = _data(await auth_client.post(f"/v1/workout-sessions/{s['id']}/finish"))
    assert finished["status"] == "completed"
    assert finished["duration_seconds"] is not None

    # Session volume counts every completed non-warm-up set, drop sets included (D6).
    expected_volume = sum(
        spec["load_kg"] * spec["reps"]
        for spec in case["sets"]
        if spec["completed"] and spec["set_type"] != "warmup" and spec["load_kg"]
    )
    assert finished["total_volume_kg"] == pytest.approx(expected_volume, abs=0.01)

    got = {r["record_type"]: r["value"] for r in finished["records"]}
    want = case["expected"]
    assert got["max_load"] == pytest.approx(want["max_load_kg"], abs=0.01)
    assert got["max_reps"] == pytest.approx(want["max_reps"], abs=0.01)
    assert got["volume"] == pytest.approx(want["volume_kg"], abs=0.01)
    assert got["estimated_1rm"] == pytest.approx(want["estimated_1rm_kg"], abs=0.01)

    # A drop set is not a clean PR attempt, so the heaviest bar of the day (120kg,
    # a drop) must NOT become the max-load record.
    assert got["max_load"] < 120


@pytest.mark.parametrize("case", VECTORS["e1rm"], ids=lambda c: c["name"])
async def test_stored_e1rm_matches_the_vector(auth_client, case):
    if case["load_kg"] is None or case["reps"] < 1:
        pytest.skip("not a storable set — covered by the pure-domain vector test")
    ex = await _exercise_ids(auth_client)
    s = _data(await auth_client.post("/v1/workout-sessions", json={"exercise_ids": ex[:1]}), 201)
    row = await _post_set(auth_client, s["exercises"][0]["id"], {
        "reps": case["reps"], "load_kg": case["load_kg"],
    })
    # Stored to 2dp; the vector tolerance applies to the formula, not the column.
    assert row["e1rm_kg"] == pytest.approx(case["expected_e1rm_kg"], abs=0.01)


@pytest.mark.parametrize("case", VECTORS["volume"], ids=lambda c: c["name"])
async def test_session_volume_matches_the_vector(auth_client, case):
    storable = [s for s in case["sets"] if s.get("reps")]
    if not storable:
        pytest.skip("no storable sets in this vector")
    if case.get("include_warmups"):
        # K-04: the server counts warm-ups when the user's profile says so.
        _data(await auth_client.patch("/v1/profile", json={"warmups_in_volume": True}))
    ex = await _exercise_ids(auth_client)
    s = _data(await auth_client.post("/v1/workout-sessions", json={"exercise_ids": ex[:1]}), 201)
    se_id = s["exercises"][0]["id"]
    for spec in storable:
        await _post_set(auth_client, se_id, {
            "set_type": spec["set_type"], "reps": spec["reps"],
            "load_kg": spec["load_kg"], "completed": spec["completed"],
        })
    finished = _data(await auth_client.post(f"/v1/workout-sessions/{s['id']}/finish"))
    assert finished["total_volume_kg"] == pytest.approx(case["expected_volume_kg"], abs=TOL + 0.01)


async def test_a_pr_is_flagged_only_on_the_set_that_set_it(auth_client):
    """The celebration names a set, so the flag has to land on the right one — not
    on every set of a session that happened to contain a record."""
    ex = await _exercise_ids(auth_client)

    first = _data(await auth_client.post("/v1/workout-sessions", json={"exercise_ids": ex[:1]}), 201)
    await _post_set(auth_client, first["exercises"][0]["id"], {"reps": 8, "load_kg": 60})
    _data(await auth_client.post(f"/v1/workout-sessions/{first['id']}/finish"))

    second = _data(await auth_client.post("/v1/workout-sessions", json={"exercise_ids": ex[:1]}), 201)
    se_id = second["exercises"][0]["id"]
    await _post_set(auth_client, se_id, {"reps": 5, "load_kg": 50})   # beats nothing
    await _post_set(auth_client, se_id, {"reps": 5, "load_kg": 70})   # beats the load record
    _data(await auth_client.post(f"/v1/workout-sessions/{second['id']}/finish"))

    second = _data(await auth_client.get(f"/v1/workout-sessions/{second['id']}"))
    flags = [x["is_pr"] for x in second["exercises"][0]["sets"]]
    assert flags == [False, True], flags

    # The earlier session keeps its own flag — a record it no longer holds was still
    # a record on the day, and history must not rewrite itself.
    first = _data(await auth_client.get(f"/v1/workout-sessions/{first['id']}"))
    assert first["exercises"][0]["sets"][0]["is_pr"] is True


async def test_a_record_is_demoted_when_the_session_that_set_it_is_edited(auth_client):
    """A record must be able to go DOWN. An incremental update can only raise one,
    which is why the recompute is a full re-scan."""
    ex = await _exercise_ids(auth_client)
    s = _data(await auth_client.post("/v1/workout-sessions", json={"exercise_ids": ex[:1]}), 201)
    row = await _post_set(auth_client, s["exercises"][0]["id"], {"reps": 3, "load_kg": 150})
    _data(await auth_client.post(f"/v1/workout-sessions/{s['id']}/finish"))
    assert _data(await auth_client.get(
        f"/v1/exercises/{ex[0]}/previous-performance"
    ))["best_e1rm_kg"] == pytest.approx(165.0, abs=0.01)

    # The 150 was a typo — it was 100.
    _data(await auth_client.patch(f"/v1/workout-sets/{row['id']}", json={"load_kg": 100}))
    assert _data(await auth_client.get(
        f"/v1/exercises/{ex[0]}/previous-performance"
    ))["best_e1rm_kg"] == pytest.approx(110.0, abs=0.01)


# ---------------------------------------------------------------- 4.7 cancel

async def test_a_cancelled_session_keeps_its_rows_but_leaves_history(auth_client):
    ex = await _exercise_ids(auth_client)
    s = _data(await auth_client.post("/v1/workout-sessions", json={"exercise_ids": ex[:1]}), 201)
    await _post_set(auth_client, s["exercises"][0]["id"], {"reps": 8, "load_kg": 60})

    cancelled = _data(await auth_client.post(f"/v1/workout-sessions/{s['id']}/cancel"))
    assert cancelled["status"] == "cancelled"
    # Discarding is about leaving history — not about destroying what was typed.
    assert len(cancelled["exercises"][0]["sets"]) == 1

    history = _data(await auth_client.get("/v1/workout-sessions"))
    assert s["id"] not in [h["id"] for h in history]
    assert _data(await auth_client.get("/v1/workout-sessions/active")) is None
    # And it contributes nothing to analytics.
    assert _data(await auth_client.get(f"/v1/exercises/{ex[0]}/previous-performance")) is None


async def test_a_finished_session_cannot_take_new_sets_until_reopened(auth_client):
    ex = await _exercise_ids(auth_client)
    s = _data(await auth_client.post("/v1/workout-sessions", json={"exercise_ids": ex[:1]}), 201)
    se_id = s["exercises"][0]["id"]
    await _post_set(auth_client, se_id, {"reps": 8, "load_kg": 60})
    _data(await auth_client.post(f"/v1/workout-sessions/{s['id']}/finish"))

    r = await auth_client.post(
        f"/v1/session-exercises/{se_id}/sets", json={"reps": 8, "load_kg": 60},
        headers={"Idempotency-Key": str(uuid.uuid4())},
    )
    assert r.status_code == 409, r.text

    _data(await auth_client.post(f"/v1/workout-sessions/{s['id']}/reopen"))
    await _post_set(auth_client, se_id, {"reps": 8, "load_kg": 60})


async def test_finishing_twice_is_refused(auth_client):
    ex = await _exercise_ids(auth_client)
    s = _data(await auth_client.post("/v1/workout-sessions", json={"exercise_ids": ex[:1]}), 201)
    _data(await auth_client.post(f"/v1/workout-sessions/{s['id']}/finish"))
    r = await auth_client.post(f"/v1/workout-sessions/{s['id']}/finish")
    assert r.status_code == 409, r.text


# --------------------------------------------------- 4.8 previous performance

async def test_previous_performance_resolves_the_last_completed_session(auth_client):
    ex = await _exercise_ids(auth_client)
    assert _data(await auth_client.get(f"/v1/exercises/{ex[0]}/previous-performance")) is None

    older = _data(await auth_client.post("/v1/workout-sessions", json={"exercise_ids": ex[:1]}), 201)
    await _post_set(auth_client, older["exercises"][0]["id"], {"reps": 8, "load_kg": 60})
    _data(await auth_client.post(f"/v1/workout-sessions/{older['id']}/finish"))
    cutoff = datetime.now(UTC)

    newer = _data(await auth_client.post("/v1/workout-sessions", json={"exercise_ids": ex[:1]}), 201)
    await _post_set(auth_client, newer["exercises"][0]["id"], {"reps": 8, "load_kg": 65})
    _data(await auth_client.post(f"/v1/workout-sessions/{newer['id']}/finish"))

    latest = _data(await auth_client.get(f"/v1/exercises/{ex[0]}/previous-performance"))
    assert latest["session_id"] == newer["id"]
    assert latest["sets"][0]["load_kg"] == 65.0

    # `before` is what the logger sends mid-session: "what did I do LAST time",
    # not "what did I do the set I am looking at".
    earlier = _data(await auth_client.get(
        f"/v1/exercises/{ex[0]}/previous-performance", params={"before": cutoff.isoformat()}
    ))
    assert earlier["session_id"] == older["id"]
    assert earlier["sets"][0]["load_kg"] == 60.0


async def test_previous_performance_ignores_a_session_still_in_progress(auth_client):
    ex = await _exercise_ids(auth_client)
    live = _data(await auth_client.post("/v1/workout-sessions", json={"exercise_ids": ex[:1]}), 201)
    await _post_set(auth_client, live["exercises"][0]["id"], {"reps": 8, "load_kg": 60})
    assert _data(await auth_client.get(f"/v1/exercises/{ex[0]}/previous-performance")) is None


# ------------------------------------------------------------------ ownership

async def test_another_users_session_is_not_readable(auth_client, client):
    ex = await _exercise_ids(auth_client)
    mine = _data(await auth_client.post("/v1/workout-sessions", json={"exercise_ids": ex[:1]}), 201)

    stranger = f"other-{uuid.uuid4().hex[:8]}@example.com"
    token = _data(await sign_up(client, json={"email": stranger, "password": "correct-horse-battery"}
    ), 201)["access_token"]

    r = await auth_client.get(
        f"/v1/workout-sessions/{mine['id']}", headers={"authorization": f"Bearer {token}"}
    )
    assert r.status_code == 403, r.text


async def test_the_volume_record_is_the_best_session_not_a_lifetime_total(auth_client):
    """A number that only ever rises is not a record. Volume is the best SINGLE
    session for that exercise; max_load, max_reps and e1RM are per-set bests."""
    ex = await _exercise_ids(auth_client)

    heavy = _data(await auth_client.post("/v1/workout-sessions", json={"exercise_ids": ex[:1]}), 201)
    await _post_set(auth_client, heavy["exercises"][0]["id"], {"reps": 10, "load_kg": 60})
    _data(await auth_client.post(f"/v1/workout-sessions/{heavy['id']}/finish"))
    assert _data(await auth_client.get(f"/v1/exercises/{ex[0]}/records"))["volume"]["value"] == 600.0

    lighter = _data(await auth_client.post("/v1/workout-sessions", json={"exercise_ids": ex[:1]}), 201)
    await _post_set(auth_client, lighter["exercises"][0]["id"], {"reps": 8, "load_kg": 50})
    _data(await auth_client.post(f"/v1/workout-sessions/{lighter['id']}/finish"))

    records = _data(await auth_client.get(f"/v1/exercises/{ex[0]}/records"))
    assert records["volume"]["value"] == 600.0, "a lighter day raised the volume record"
    assert records["volume"]["unit"] == "kg"
    # The per-set bests are unchanged by the lighter day too.
    assert records["max_load"]["value"] == 60.0
    assert records["max_reps"]["value"] == 10.0


async def test_records_are_empty_before_anything_is_logged(auth_client):
    ex = await _exercise_ids(auth_client)
    assert _data(await auth_client.get(f"/v1/exercises/{ex[0]}/records")) == {}


async def test_another_users_custom_exercise_cannot_be_borrowed(auth_client, client):
    """Referencing it leaked its name and blocked its owner's account deletion."""
    stranger = f"owner-{uuid.uuid4().hex[:8]}@example.com"
    token = _data(await sign_up(client, json={"email": stranger, "password": "correct-horse-battery"}
    ), 201)["access_token"]
    them = {"authorization": f"Bearer {token}"}
    group = _data(await client.get("/v1/muscle-groups", headers=them))[0]["id"]
    theirs = _data(await client.post("/v1/exercises", headers=them, json={
        "name": "Private Secret Lift", "equipment": "other",
        "muscles": [{"muscle_group_id": group, "role": "primary"}],
    }), 201)["id"]

    r = await auth_client.post("/v1/workout-sessions", json={"exercise_ids": [theirs]})
    assert r.status_code == 422, r.text

    mine = _data(await auth_client.post("/v1/workout-sessions", json={"exercise_ids": []}), 201)
    r = await auth_client.post(f"/v1/workout-sessions/{mine['id']}/exercises", json={"exercise_id": theirs})
    assert r.status_code == 404, r.text

    deleted = await client.post("/v1/account/delete", headers={"authorization": f"Bearer {token}"},
                                json={"password": "correct-horse-battery", "confirmation": "DELETE"})
    assert deleted.status_code == 200, deleted.text
