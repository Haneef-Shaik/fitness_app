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
import os
import sys
import urllib.error
import urllib.parse
import urllib.request

BASE = os.environ.get("FITLOG_API", "http://localhost:8000").rstrip("/")
EMAIL = "demo@fitlog.app"
PASSWORD = "fitlogdemo1234"

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
    # Signing in is Supabase Auth's (docs/14); this file's own directory holds
    # the one way scripts do it.
    from supabase_signin import access_token

    try:
        return access_token(EMAIL, PASSWORD)
    except SystemExit as e:
        raise Failed(f"could not sign in as {EMAIL}: {e}") from e


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


# --------------------------------------------------------------------------- AC-05

def ac_05(token: str, args: argparse.Namespace) -> None:
    """"Returns the most recent completed session with a chest-primary exercise;
    states if it widened to secondary." Both clauses, because a widened answer
    presented as a direct hit is the failure this criterion is about."""
    found = get(f"/v1/history/previous-occurrence?muscle={args.muscle}", token)
    check("an occurrence was resolved", found is not None, args.muscle)

    sessions = get("/v1/workout-sessions", token)
    completed = [s for s in sessions if s["status"] == "completed"]
    check("there is completed history to resolve against", bool(completed),
          f"{len(completed)} completed")

    detail = get(f"/v1/workout-sessions/{found['session_id']}", token)
    check("it points at a COMPLETED session", detail["status"] == "completed",
          detail["status"])

    # The rule is about primary unless nothing is primary. Whichever happened,
    # the payload has to say which — the screen is required to repeat it.
    check(
        "it states which role matched",
        found["role_matched"] in ("primary", "secondary"),
        f"role_matched={found['role_matched']}, widened={found['widened']}",
    )
    check(
        "widened and role_matched agree",
        found["widened"] == (found["role_matched"] == "secondary"),
        f"widened={found['widened']} role={found['role_matched']}",
    )
    check(
        "it is the most recent session that qualifies",
        all(
            s["started_at"] <= detail["started_at"]
            for s in completed
            if s["id"] in _sessions_touching(token, args.muscle, found["role_matched"])
        ),
        f"chose {detail['local_date']}",
    )


def _sessions_touching(token: str, muscle: str, role: str) -> set:
    """Session ids the history list reports for that muscle — the same subtree
    rule, asked a different way, so agreement between the two is the assertion."""
    rows = get(f"/v1/history/workouts?muscle={muscle}&limit=100", token)
    return {r["id"] for r in rows}


CRITERIA = {
    "ac-01": (ac_01, "Create a Chest workout with multiple exercises and target sets/reps"),
    "ac-02": (ac_02, "Record every performed set with load and reps"),
    "ac-04": (ac_04, "Starting the same workout again shows previous performance"),
    "ac-05": (ac_05, "Retrieve the previous chest-focused session without knowing its date"),
    # ac-07 and ac-11 are added below, after their functions are defined.
}


def ac_07(token: str, args: argparse.Namespace) -> None:
    """AC-07 — "A manually logged meal changes today's totals immediately, on
    the user's LOCAL date."

    Reads the diary the same way the screen does, then checks the meal is
    actually filed under the day the SERVER calls today — the half a flow
    cannot see, because a screen showing a number it computed locally looks
    identical to one showing a number that landed.
    """
    day = get("/v1/nutrition/day", token)
    meals = day["meals"]

    check("a meal is logged today", len(meals) >= 1, f"{len(meals)} meals")
    check(
        "the day's total moved",
        day["calories"] >= args.calories - 2,
        f"{day['calories']} kcal, wanted at least {args.calories}",
    )

    profile = get("/v1/profile", token)
    check(
        "it is filed under the profile's day, not the device's",
        all(m["local_date"] == day["local_date"] for m in meals),
        f"local_date {day['local_date']} in {profile['timezone']}",
    )

    # I2 / D5 — the number on screen counts confirmed items only.
    confirmed = [i for m in meals for i in m["items"] if i["confirmed"]]
    check("every counted item is confirmed", len(confirmed) >= 1,
          f"{len(confirmed)} confirmed items")


def ac_11(token: str, args: argparse.Namespace) -> None:
    """AC-11 — "All three cards show the just-written data for the local date."

    And the thing the screen cannot prove about itself: that it came from ONE
    call. The dashboard endpoint either carries all three domains or it does
    not, and this asks it directly.
    """
    board = get("/v1/dashboard", token)

    for domain in ("training", "nutrition", "body", "goals"):
        check(f"the dashboard carries {domain}", domain in board)

    check(
        "the body card shows the weigh-in that was just written",
        board["body"]["latest"] is not None
        and abs(board["body"]["latest"]["value"] - args.weight) < 0.05,
        f"{board['body']['latest']}",
    )
    check(
        "the training card shows completed work",
        board["training"]["last_session"] is not None,
        f"{board['training']}",
    )
    check(
        "the local date is the profile's, resolved server-side",
        board["local_date"] == get("/v1/nutrition/day", token)["local_date"],
        f"{board['local_date']} vs the diary's",
    )


def _latest_analysis(token: str, input_type: str) -> dict:
    rows = [a for a in get("/v1/food-analyses", token) if a["input_type"] == input_type]
    check(f"a {input_type} analysis exists", len(rows) >= 1, f"{len(rows)} {input_type} analyses")
    rows.sort(key=lambda a: a["created_at"], reverse=True)
    return get(f"/v1/food-analysis/{rows[0]['id']}", token)


def _editable_candidates(analysis: dict, minimum: int) -> None:
    check("it finished", analysis["status"] == "completed", analysis["status"])
    items = analysis["items"]
    check(f"at least {minimum} candidate(s)", len(items) >= minimum, f"{len(items)} items")
    check("every candidate carries estimated nutrition",
          all(i["proposed_calories"] is not None for i in items),
          ", ".join(f"{i['detected_name']} {i['proposed_calories']}" for i in items))


def ac_08(token: str, args: argparse.Namespace) -> None:
    """AC-08 — "Text food input produces editable structured candidates."

    The screen shows fields; this asks the server whether the analysis it drew
    them from is structured — named items with quantities and nutrition."""
    analysis = _latest_analysis(token, "text")
    _editable_candidates(analysis, minimum=2)
    check("it keeps the user's own words", bool(analysis.get("source_text")), analysis.get("source_text") or "")


def ac_09(token: str, args: argparse.Namespace) -> None:
    """AC-09 — "Food-image input produces editable candidates with estimated nutrition"."""
    analysis = _latest_analysis(token, "image")
    _editable_candidates(analysis, minimum=1)
    check("the photograph is stored with it", bool(analysis.get("image_key")), analysis.get("image_key") or "")


def ac_10(token: str, args: argparse.Namespace) -> None:
    """AC-10 — "Corrected nutrition becomes confirmed while the original AI
    result stays available."

    Both halves live on the server: the meal item holds the CORRECTED values,
    confirmed and marked as corrected, and the analysis still holds what was
    proposed. A screen showing the corrected number proves only the first."""
    analysis = _latest_analysis(token, "text")
    check("it was confirmed into a meal", analysis["confirmed_meal_id"] is not None,
          str(analysis["confirmed_meal_id"]))
    day = get("/v1/nutrition/day", token)
    items = [i for m in day["meals"] if m["id"] == analysis["confirmed_meal_id"] for i in m["items"]]
    check("the meal is in today's diary", len(items) >= 1, f"{len(items)} items")
    corrected = [i for i in items if i["user_corrected"]]
    check("a corrected item is marked as corrected", len(corrected) >= 1, f"{len(corrected)} corrected")
    check("and it is confirmed — it counts", all(i["confirmed"] for i in corrected))
    proposed = {i["id"]: i for i in analysis["items"]}
    originals = [proposed.get(i.get("analysis_item_id")) for i in corrected]
    check("the original AI result is still there, unchanged",
          all(o is not None and o["estimated_quantity"] is not None for o in originals),
          "; ".join(f"{o['detected_name']}: proposed {o['estimated_quantity']} {o['estimated_unit']}"
                    for o in originals if o))
    check("and it differs from what was saved",
          any(o and abs((o["estimated_quantity"] or 0) - float(i["quantity_grams"] or 0)) > 0.5
              for i, o in zip(corrected, originals, strict=False)),
          ", ".join(f"saved {i['quantity_grams']} g" for i in corrected))


CRITERIA["ac-07"] = (
    ac_07, "A manually logged meal moves today's totals, on the user's local date",
)
CRITERIA["ac-08"] = (ac_08, "Text food input produces editable structured candidates")
CRITERIA["ac-09"] = (ac_09, "Food-image input produces editable candidates with estimated nutrition")
CRITERIA["ac-10"] = (
    ac_10, "Corrected nutrition is confirmed while the original AI result stays available",
)
CRITERIA["ac-11"] = (
    ac_11, "The dashboard reflects current workout, nutrition and body state",
)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("criterion", choices=sorted(CRITERIA))
    parser.add_argument("--day", default="Chest", help="AC-01: the plan day the flow built")
    parser.add_argument("--sets", type=int, default=3, help="AC-02: how many sets the flow entered")
    parser.add_argument("--load", type=float, default=80.0)
    parser.add_argument("--reps", type=int, default=8)
    parser.add_argument("--exercise", default="Barbell Bench Press")
    parser.add_argument("--muscle", default="chest", help="AC-05: the group to resolve")
    parser.add_argument("--calories", type=float, default=380.0,
                        help="AC-07: the kcal the flow logged")
    parser.add_argument("--weight", type=float, default=78.4,
                        help="AC-11: the weigh-in the flow wrote")
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
