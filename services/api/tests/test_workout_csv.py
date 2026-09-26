"""Strong and Hevy exports, parsed. Every row becomes a set or a counted skip."""
from __future__ import annotations

from datetime import datetime

import pytest

from app.imports.workout_csv import ImportFormatError, detect, parse

STRONG = """Date,Workout Name,Duration,Exercise Name,Set Order,Weight,Reps,Distance,Seconds,Notes,Workout Notes,RPE
2025-03-01 07:30:00,Push Day,1h 5m,Bench Press (Barbell),W,40,12,0,0,,Felt good,
2025-03-01 07:30:00,Push Day,1h 5m,Bench Press (Barbell),1,80,8,0,0,,Felt good,8
2025-03-01 07:30:00,Push Day,1h 5m,Bench Press (Barbell),2,80,7,0,0,Grip slipped,Felt good,9
2025-03-01 07:30:00,Push Day,1h 5m,Bench Press (Barbell),Rest Timer,0,0,0,90,,Felt good,
2025-03-01 07:30:00,Push Day,1h 5m,Plank,1,0,0,0,60,,Felt good,
2025-03-01 07:30:00,Push Day,1h 5m,Overhead Press (Barbell),1,50,0,0,0,,Felt good,
2025-03-04 18:00:00,Legs,45m,Squat (Barbell),1,100,5,0,0,,,
"""

HEVY = """"title","start_time","end_time","description","exercise_title","superset_id","exercise_notes","set_index","set_type","weight_kg","reps","distance_km","duration_seconds","rpe"
"Pull","2 Mar 2025, 08:00","2 Mar 2025, 09:10","","Deadlift (Barbell)","","Hook grip","0","warmup","60","5","","",""
"Pull","2 Mar 2025, 08:00","2 Mar 2025, 09:10","","Deadlift (Barbell)","","Hook grip","1","normal","140","5","","","8.5"
"Pull","2 Mar 2025, 08:00","2 Mar 2025, 09:10","","Lat Pulldown (Cable)","","","0","dropset","50","10","","",""
"Pull","2 Mar 2025, 08:00","2 Mar 2025, 09:10","","Running","","","0","normal","","","5.2","1800",""
"""


def test_the_format_is_recognised_from_its_header():
    assert detect(STRONG) == "strong"
    assert detect(HEVY) == "hevy"


def test_anything_else_is_refused_in_words():
    with pytest.raises(ImportFormatError, match="Strong or Hevy"):
        detect("a,b,c\n1,2,3\n")


def test_strong_rows_become_sessions_exercises_and_typed_sets():
    r = parse(STRONG, weight_unit="kg")
    assert [s.title for s in r.sessions] == ["Push Day", "Legs"]
    push = r.sessions[0]
    assert push.started_at == datetime(2025, 3, 1, 7, 30)  # noqa: DTZ001 — wall-clock time
    assert push.duration_seconds == 3900
    assert push.notes == "Felt good"
    bench = push.exercises[0]
    assert bench.name == "Bench Press (Barbell)"
    assert [s.set_type for s in bench.sets] == ["warmup", "working", "working"]
    assert bench.sets[2].note == "Grip slipped"
    assert bench.sets[1].rpe == 8
    plank = push.exercises[1]
    assert plank.sets[0].duration_seconds == 60 and plank.sets[0].load_kg is None


def test_nothing_is_dropped_silently():
    r = parse(STRONG, weight_unit="kg")
    # A rest timer row, and an overhead press with a load and no reps (W04.7).
    assert r.skipped_rows == {"rest timer rows": 1, "sets with no reps, time or distance": 1}
    assert all(e.name != "Overhead Press (Barbell)" for e in r.sessions[0].exercises)


def test_strong_pounds_become_kilograms():
    r = parse(STRONG, weight_unit="lb")
    assert r.sessions[1].exercises[0].sets[0].load_kg == pytest.approx(45.359, abs=0.001)


def test_hevy_rows_keep_their_types_distance_and_duration():
    r = parse(HEVY)
    pull = r.sessions[0]
    assert pull.duration_seconds == 70 * 60
    dl = pull.exercises[0]
    assert dl.notes == "Hook grip"
    assert [s.set_type for s in dl.sets] == ["warmup", "working"]
    assert dl.sets[1].rpe == 8.5
    assert pull.exercises[1].sets[0].set_type == "drop"
    run = pull.exercises[2].sets[0]
    assert run.distance_m == 5200 and run.duration_seconds == 1800


def test_the_same_workout_has_the_same_key_on_every_import():
    a = parse(STRONG, weight_unit="kg").sessions[0]
    b = parse(STRONG, weight_unit="kg").sessions[0]
    assert a.import_key == b.import_key


def test_a_hostile_exercise_name_is_cheap_to_match():
    """A lazy regex backtracked quadratically on a long run of spaces: one name
    froze the event loop for seconds (G11 security review). Linear now."""
    import time

    from app.services.workout_import import candidates

    hostile = "a" + " " * 130_000 + "b"
    started = time.perf_counter()
    candidates(hostile)
    candidates(hostile + " (")
    assert time.perf_counter() - started < 0.5


def test_names_are_capped_at_the_column_width():
    long = "x" * 500
    csv_text = (
        "Date,Workout Name,Duration,Exercise Name,Set Order,Weight,Reps,Distance,Seconds,Notes,Workout Notes,RPE\n"
        f"2025-03-01 07:30:00,{long},1h,{long},1,50,5,0,0,,,\n"
    )
    r = parse(csv_text, weight_unit="kg")
    assert len(r.sessions[0].title) == 120
    assert len(r.sessions[0].exercises[0].name) == 120


def test_a_set_no_logger_could_hold_is_skipped_by_name():
    csv_text = (
        "Date,Workout Name,Duration,Exercise Name,Set Order,Weight,Reps,Distance,Seconds,Notes,Workout Notes,RPE\n"
        "2025-03-01 07:30:00,Push,1h,Bench Press (Barbell),1,1000000,5,0,0,,,\n"
        "2025-03-01 07:30:00,Push,1h,Bench Press (Barbell),2,100,5,0,0,,,\n"
    )
    r = parse(csv_text, weight_unit="kg")
    assert r.skipped_rows == {"sets with values outside what a set can hold": 1}
    assert len(r.sessions[0].exercises[0].sets) == 1


def test_a_file_past_the_row_cap_is_refused_whole(monkeypatch):
    from app.imports import workout_csv

    monkeypatch.setattr(workout_csv, "MAX_ROWS", 2)
    with pytest.raises(ImportFormatError, match="more than 2 rows"):
        parse(STRONG, weight_unit="kg")
