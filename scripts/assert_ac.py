#!/usr/bin/env python3
"""Assert an acceptance criterion against the API — not against the screen.

A Maestro flow reads the screen it just wrote, which cannot see a write that
never landed. On this project it did not: AC-02 was green on a phone, showing
three sets, while the server held two. The third was stranded in the outbox and
only a query like the ones below could tell the difference.

So every flow is paired with a check here, and the wording is taken from
`docs/07-TRACEABILITY.md` §2 rather than from memory.

    python3 scripts/assert_ac.py ac-01
    python3 scripts/assert_ac.py ac-02 --sets 3 --load 80 --reps 8
    python3 scripts/assert_ac.py ac-04 --exercise "Barbell Bench Press"

Stdlib only, so CI needs no environment beyond python3.
"""
from __future__ import annotations

import argparse
import json
import sys
import urllib.error
import urllib.parse
import urllib.request

BASE = "http://localhost:8000"
EMAIL = "demo@volt.app"
PASSWORD = "voltdemo1234"

GREEN, RED, DIM, OFF = "\033[32m", "\033[31m", "\033[2m", "\033[0m"


class Failed(Exception):
    """An assertion about server state did not hold."""


def _request(method: str, path: str, token: str | None = None, body: dict | None = None) -> dict:
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(f"{BASE}{path}", data=data, method=method)
    req.add_header("Content-Type", "application/json")
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        raise Failed(f"{method} {path} -> {e.code} {e.read()[:300].decode(errors='replace')}") from e
    except urllib.error.URLError as e:
        raise Failed(f"{method} {path} unreachable ({e.reason}). Is the API running?") from e


def login() -> str:
    env = _request("POST", "/v1/auth/login", body={"email": EMAIL, "password": PASSWORD})
    return env["data"]["access_token"]


def get(path: str, token: str) -> object:
    env = _request("GET", path, token=token)
    if not env.get("success"):
        raise Failed(f"GET {path} returned an error envelope: {env.get('error')}")
    return env["data"]


def check(label: str, condition: bool, detail: str = "") -> None:
    if condition:
        print(f"  {GREEN}✓{OFF} {label}" + (f" {DIM}{detail}{OFF}" if detail else ""))
    else:
        raise Failed(f"{label}{(' — ' + detail) if detail else ''}")


# --------------------------------------------------------------------------- AC-01

def ac_01(token: str, args: argparse.Namespace) -> None:
    """"The program persists with >= 2 plan_exercises, each with target_sets and a
    rep range." Newest program first, since the flow has just built one."""
    programs = get("/v1/workout-programs", token)
    if not programs:
        raise Failed("no programs at all")

    day = None
    for p in programs:
        for d in p.get("days") or []:
            if d.get("name") == args.day and (d.get("exercises") or []):
                day = d
                break
        if day:
            break
    if day is None:
        raise Failed(f"no day named {args.day!r} carrying any exercises")

    exercises = day["exercises"]
    check("≥ 2 plan_exercises", len(exercises) >= 2, f"{len(exercises)} on {day['name']!r}")

    for i, pe in enumerate(exercises):
        sets, lo, hi = pe.get("target_sets"), pe.get("target_reps_min"), pe.get("target_reps_max")
        check(
            f"position {i + 1} has target_sets and a rep range",
            sets is not None and lo is not None and hi is not None,
            f"sets={sets} reps={lo}–{hi}",
        )


# --------------------------------------------------------------------------- AC-02

def _newest_session(token: str) -> dict:
    sessions = get("/v1/workout-sessions", token)
    if not sessions:
        raise Failed("no sessions at all")
    newest = max(sessions, key=lambda s: s["started_at"])
    return get(f"/v1/workout-sessions/{newest['id']}", token)


def ac_02(token: str, args: argparse.Namespace) -> None:
    """"workout_sets count == sets entered; load_kg and reps match; set_index is
    dense." Every clause is asserted separately so a failure names which broke."""
    session = _newest_session(token)
    logged = [se for se in session["exercises"] if se.get("sets")]
    if not logged:
        raise Failed(f"session {session['id']} has no sets on any exercise")

    se = logged[0]
    sets = sorted(se["sets"], key=lambda s: s["set_index"])

    check(
        "workout_sets count == sets entered",
        len(sets) == args.sets,
        f"server has {len(sets)}, flow entered {args.sets}",
    )
    check(
        "set_index is dense",
        [s["set_index"] for s in sets] == list(range(len(sets))),
        str([s["set_index"] for s in sets]),
    )
    check(
        "load_kg matches",
        all(s["load_kg"] == args.load for s in sets),
        str([s["load_kg"] for s in sets]),
    )
    check(
        "reps match",
        all(s["reps"] == args.reps for s in sets),
        str([s["reps"] for s in sets]),
    )
    # I8: the outbox may deliver twice; the server must store once.
    client_ids = [s["client_id"] for s in sets if s["client_id"]]
    check(
        "no duplicate client_id (I8)",
        len(client_ids) == len(set(client_ids)),
        f"{len(client_ids)} keys, {len(set(client_ids))} distinct",
    )


# --------------------------------------------------------------------------- AC-04

def ac_04(token: str, args: argparse.Namespace) -> None:
    """"The previous-performance strip shows the prior session's sets before any
    input." The strip is this endpoint, so it is the thing to assert."""
    matches = get(f"/v1/exercises?q={urllib.parse.quote(args.exercise)}", token)
    if not matches:
        raise Failed(f"no exercise named {args.exercise!r}")
    exercise_id = matches[0]["id"]

    previous = get(f"/v1/exercises/{exercise_id}/previous-performance", token)
    check("previous performance exists", previous is not None, args.exercise)

    sets = previous.get("sets") or []
    check("it carries the prior session's sets", len(sets) > 0, f"{len(sets)} sets")
    check(
        "every set has a load and reps to show",
        all(s["load_kg"] is not None and s["reps"] is not None for s in sets),
        str([(s["load_kg"], s["reps"]) for s in sets][:4]),
    )

    # "the PRIOR session" is a specific row, not merely "some old one": it is the
    # most recently completed session. Asserting only "not the current one" would
    # pass on a week-old session while the one just finished was ignored.
    sessions = get("/v1/workout-sessions", token)
    completed = [s for s in sessions if s["status"] == "completed"]
    if not completed:
        raise Failed("no completed session for previous-performance to point at")
    latest = max(completed, key=lambda s: s["started_at"])

    check(
        "it is the most recently COMPLETED session",
        previous["session_id"] == latest["id"],
        f"strip={previous['session_id'][:8]} latest completed={latest['id'][:8]}",
    )
    # There is deliberately no "and not the session just started" check. It adds
    # nothing — the just-started one is `in_progress`, so "most recently
    # COMPLETED" already excludes it — and it raced: the new session reaches the
    # server a moment after the screen shows it, so the check read the previous
    # session as "current" and failed on a criterion it was not testing.


CRITERIA = {
    "ac-01": (ac_01, "Create a Chest workout with multiple exercises and target sets/reps"),
    "ac-02": (ac_02, "Record every performed set with load and reps"),
    "ac-04": (ac_04, "Starting the same workout again shows previous performance"),
}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("criterion", choices=sorted(CRITERIA))
    parser.add_argument("--day", default="Chest", help="AC-01: the plan day the flow built")
    parser.add_argument("--sets", type=int, default=3, help="AC-02: how many sets the flow entered")
    parser.add_argument("--load", type=float, default=80.0)
    parser.add_argument("--reps", type=int, default=8)
    parser.add_argument("--exercise", default="Barbell Bench Press")
    args = parser.parse_args()

    fn, wording = CRITERIA[args.criterion]
    print(f"\n{args.criterion.upper()} · {wording}")
    try:
        fn(login(), args)
    except Failed as e:
        print(f"  {RED}✗{OFF} {e}\n")
        return 1
    print(f"  {GREEN}server state matches the criterion{OFF}\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
