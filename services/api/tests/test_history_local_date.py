"""AC-03 — a completed session appears under the **user-local** date.

    "A session started 23:40 in UTC+5:30 appears under that local date, not the
    UTC one" — docs/07-TRACEABILITY.md §2

The pure function already has a matrix: `tests/test_vectors.py` drives
`to_local_date` over `contracts/vectors/domain.json`, in Python and TypeScript.
That proves the *arithmetic*. It says nothing about whether a session actually
gets filed under that date, which is the criterion.

So these tests **consume the same vectors** rather than inventing new ones — a
second set of timezone cases would eventually disagree with the first — and
assert them end to end: set the profile's timezone, start a session at the
vector's instant, finish it, and ask history for that day.

The vectors cover five zones — Asia/Kolkata (half-hour offset),
America/New_York, Pacific/Kiritimati (UTC+14), Pacific/Niue (UTC-11), UTC — and
both DST directions. At session level the fall-back pair is dated in the future
and the API refuses a future session, so that direction has its own past-dated
test at the bottom of this file. No direction is lost; see the note on
LOGGABLE_CASES.
"""
from __future__ import annotations

import json
import uuid
from datetime import UTC, datetime
from pathlib import Path

import pytest

pytestmark = pytest.mark.asyncio

_VECTORS = json.loads(
    (Path(__file__).resolve().parents[3] / "contracts" / "vectors" / "domain.json").read_text()
)
ALL_CASES = _VECTORS["local_date"]

# The API refuses a session dated in the future ("A workout cannot be logged in
# the future"), which is correct and is not going to be relaxed for a test. Two
# vectors — the DST fall-back pair — sit in November 2026 and are therefore not
# loggable yet. `tests/test_vectors.py` still drives the pure function over ALL
# nine; these session-level cases take the ones a user could actually have
# logged, and the fall-back direction is covered by its own past-dated test
# below so no DST direction is lost.
LOGGABLE_CASES = [
    c for c in ALL_CASES
    if datetime.fromisoformat(c["instant"]) <= datetime.now(UTC)
]
assert len(LOGGABLE_CASES) >= 5, "the session-level matrix needs at least five zones"
assert {c["timezone"] for c in LOGGABLE_CASES} >= {
    "Asia/Kolkata", "America/New_York", "Pacific/Kiritimati", "Pacific/Niue", "UTC",
}, "five zones, as AC-03 requires"


def _data(response, expect: int = 200):
    assert response.status_code == expect, response.text
    return response.json()["data"]


def _body(response, expect: int = 200):
    assert response.status_code == expect, response.text
    return response.json()


async def _exercise_id(client) -> str:
    return _data(await client.get("/v1/exercises", params={"limit": 1}))[0]["id"]


async def _session_on(client, exercise_id: str, instant: str) -> dict:
    s = _data(await client.post("/v1/workout-sessions", json={
        "exercise_ids": [exercise_id], "started_at": instant,
    }), 201)
    await client.post(
        f"/v1/session-exercises/{s['exercises'][0]['id']}/sets",
        json={"set_type": "working", "load_kg": 60.0, "reps": 8},
        headers={"Idempotency-Key": str(uuid.uuid4())},
    )
    return _data(await client.post(f"/v1/workout-sessions/{s['id']}/finish", json={}))


def _case_id(case) -> str:
    return f'{case["timezone"]}-{case["expected_local_date"]}'


@pytest.mark.parametrize("case", LOGGABLE_CASES, ids=_case_id)
async def test_session_is_filed_under_the_users_local_date(auth_client, case):
    """The whole matrix, at session level. Five zones, both DST directions."""
    _data(await auth_client.patch("/v1/profile", json={"timezone": case["timezone"]}))
    ex = await _exercise_id(auth_client)

    await _session_on(auth_client, ex, case["instant"])

    row = _body(await auth_client.get("/v1/history/workouts"))["data"][0]
    assert row["local_date"] == case["expected_local_date"], case["note"]
    assert row["logged_timezone"] == case["timezone"]


@pytest.mark.parametrize("case", LOGGABLE_CASES, ids=_case_id)
async def test_history_finds_it_on_that_local_day(auth_client, case):
    """Filed is not enough — it has to be *findable* under that day.

    F-01's date filter reads `local_date`, so a session stored correctly but
    filtered by its UTC instant would still be missing from the day the user
    remembers training.
    """
    _data(await auth_client.patch("/v1/profile", json={"timezone": case["timezone"]}))
    ex = await _exercise_id(auth_client)
    await _session_on(auth_client, ex, case["instant"])

    day = case["expected_local_date"]
    found = _body(await auth_client.get(
        "/v1/history/workouts", params={"from": day, "to": day}
    ))["data"]

    assert len(found) == 1, f'not filed under {day} ({case["note"]})'


async def test_the_headline_case_is_not_the_utc_date(auth_client):
    """AC-03 as worded: 23:40 in UTC+5:30 is already tomorrow.

    The parametrised matrix above would still pass if `local_date` were simply
    the UTC date for every zone that happens not to cross midnight. This case
    is chosen because the two answers DIFFER, so it fails if the local date is
    quietly the UTC one.
    """
    instant = "2026-09-21T23:40:00+05:30"          # 18:10 UTC on the 21st
    utc_date = datetime.fromisoformat(instant).astimezone().date()

    _data(await auth_client.patch("/v1/profile", json={"timezone": "Asia/Kolkata"}))
    ex = await _exercise_id(auth_client)
    await _session_on(auth_client, ex, instant)

    row = _body(await auth_client.get("/v1/history/workouts"))["data"][0]

    assert row["local_date"] == "2026-09-21"
    assert row["local_date"] != "2026-09-22"
    assert utc_date.isoformat() == "2026-09-21"


async def test_a_session_at_2340_local_files_under_the_local_day_not_the_utc_one(auth_client):
    """The other side of midnight, where UTC and local genuinely disagree.

    23:40 on the 21st in Asia/Kolkata is 18:10 UTC on the 21st — same date. The
    case that actually separates the two is just after local midnight: 00:10 on
    the 22nd local is 18:40 UTC on the **21st**. Filing by the instant gives the
    21st; filing by the user's day gives the 22nd, and the 22nd is correct.
    """
    _data(await auth_client.patch("/v1/profile", json={"timezone": "Asia/Kolkata"}))
    ex = await _exercise_id(auth_client)

    await _session_on(auth_client, ex, "2026-09-21T18:40:00Z")

    row = _body(await auth_client.get("/v1/history/workouts"))["data"][0]
    assert row["local_date"] == "2026-09-22", "UTC says the 21st; the user trained on the 22nd"


async def test_the_dst_fall_back_hour_files_under_one_local_day(auth_client):
    """The repeated hour, both sides of it, on a date that can be logged.

    The vectors' fall-back pair is dated November 2026 and the API will not
    accept a future session, so this mirrors them one year earlier: US DST ended
    2025-11-02 at 02:00 EDT, rolling back to 01:00 EST. 05:30Z is 01:30 EDT and
    06:30Z is 01:30 EST — the same wall-clock time, an hour apart, and both are
    the 2nd. A naive UTC-offset cache that is not re-read per instant gets one
    of these wrong.
    """
    _data(await auth_client.patch("/v1/profile", json={"timezone": "America/New_York"}))
    ex = await _exercise_id(auth_client)

    await _session_on(auth_client, ex, "2025-11-02T05:30:00Z")   # 01:30 EDT
    await _session_on(auth_client, ex, "2025-11-02T06:30:00Z")   # 01:30 EST

    day = "2025-11-02"
    found = _body(await auth_client.get(
        "/v1/history/workouts", params={"from": day, "to": day}
    ))["data"]

    assert len(found) == 2, "both sides of the repeated hour belong to the 2nd"
    assert {r["local_date"] for r in found} == {day}
