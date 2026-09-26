"""Reading another app's workout export — Strong and Hevy CSV (launch plan, phase 6).

Pure parsing: text in, sessions out, nothing touches the database. Someone
switching apps brings years of history, and the one thing an importer must not
do is quietly get it wrong, so every row either becomes a set or is counted as
skipped with a reason; nothing is dropped silently.

Canonical units on the way out (I6): kilograms, seconds, metres. Strong does not
say which unit its weights are in — it exports whatever the user had set — so
the caller must.
"""
from __future__ import annotations

import csv
import hashlib
import io
import re
from dataclasses import dataclass, field
from datetime import datetime
from typing import Literal

from app.domain.units import lb_to_kg

Format = Literal["strong", "hevy"]
SetTypeT = Literal["warmup", "working", "drop", "failure"]

#: Refuse anything bigger rather than parse a surprise. Ten years of daily
#: training in Strong's format is well under this.
MAX_BYTES = 8 * 1024 * 1024
#: Rows past this are a file nobody's history produces — ten years of daily
#: five-exercise, five-set sessions is ~90k. Refused rather than half-read.
MAX_ROWS = 100_000
#: The exercise-name column is 120 characters; nothing longer is a real name.
MAX_NAME = 120


class ImportFormatError(ValueError):
    """The file is not a format we read. The message is shown to the user."""


@dataclass(frozen=True, slots=True)
class ImportedSet:
    set_type: SetTypeT
    load_kg: float | None
    reps: int | None
    duration_seconds: int | None
    distance_m: float | None
    rpe: float | None
    note: str | None


@dataclass(frozen=True, slots=True)
class ImportedExercise:
    name: str
    notes: str | None
    sets: tuple[ImportedSet, ...]


@dataclass(frozen=True, slots=True)
class ImportedSession:
    title: str
    started_at: datetime            # naive: the time on the lifter's wall clock
    duration_seconds: int | None
    notes: str | None
    exercises: tuple[ImportedExercise, ...]

    @property
    def import_key(self) -> str:
        """Stable across re-imports of the same file, so a second import adds nothing."""
        raw = f"{self.started_at.isoformat()}|{self.title}"
        return hashlib.sha256(raw.encode()).hexdigest()[:32]


@dataclass(slots=True)
class ParseResult:
    format: Format
    sessions: list[ImportedSession]
    skipped_rows: dict[str, int] = field(default_factory=dict)


# ------------------------------------------------------------------ helpers

def _num(raw: str | None) -> float | None:
    if raw is None:
        return None
    t = raw.strip().replace(",", ".")
    if t == "":
        return None
    try:
        v = float(t)
    except ValueError:
        return None
    return v


def _int(raw: str | None) -> int | None:
    v = _num(raw)
    return round(v) if v is not None else None


def _text(raw: str | None, limit: int = 2000) -> str | None:
    t = (raw or "").strip()[:limit].strip()
    return t or None


def _rows(text: str) -> tuple[list[str], list[dict[str, str]]]:
    if len(text.encode()) > MAX_BYTES:
        raise ImportFormatError("That file is too large to import (8 MB at most).")
    sample = text[:4096]
    try:
        dialect = csv.Sniffer().sniff(sample, delimiters=",;")
    except csv.Error:
        dialect = csv.excel
    reader = csv.DictReader(io.StringIO(text.lstrip("﻿")), dialect=dialect)
    header = [h.strip() for h in (reader.fieldnames or [])]
    reader.fieldnames = header
    rows = []
    for row in reader:
        rows.append(row)
        if len(rows) > MAX_ROWS:
            raise ImportFormatError(
                f"That file has more than {MAX_ROWS:,} rows. Export a shorter date range and import it in parts."
            )
    return header, rows


def detect(text: str) -> Format:
    header, _ = _rows(text[:4096] if len(text) > 4096 else text)
    names = {h.lower() for h in header}
    if {"exercise_title", "start_time", "set_index"} <= names:
        return "hevy"
    if {"exercise name", "set order", "date"} <= names:
        return "strong"
    raise ImportFormatError(
        "That doesn't look like a Strong or Hevy export. Export a CSV from the app you used and try again."
    )


def _skip(result: ParseResult, reason: str) -> None:
    result.skipped_rows[reason] = result.skipped_rows.get(reason, 0) + 1


def _assemble(groups: dict[tuple, dict]) -> list[ImportedSession]:
    sessions = []
    for g in groups.values():
        exercises = tuple(
            ImportedExercise(name=name, notes=ex["notes"], sets=tuple(ex["sets"]))
            for name, ex in g["exercises"].items() if ex["sets"]
        )
        if exercises:
            sessions.append(ImportedSession(
                title=g["title"], started_at=g["started_at"], duration_seconds=g["duration"],
                notes=g["notes"], exercises=exercises,
            ))
    return sorted(sessions, key=lambda s: s.started_at)


def _measures_something(s: ImportedSet) -> bool:
    # W04.7 — load alone is not a set, whichever app it came from.
    return s.reps is not None or s.duration_seconds is not None or s.distance_m is not None


def _plausible(s: ImportedSet) -> bool:
    """The limits a set logged in FitLog is held to (SetIn). A 1,000,000 kg row
    is a typo in the other app, and stored it would overflow the column — an
    error whose text carried the row's values into the logs (G11 review)."""
    return (
        (s.load_kg is None or 0 <= s.load_kg <= 1000)
        and (s.reps is None or 1 <= s.reps <= 1000)
        and (s.duration_seconds is None or 1 <= s.duration_seconds <= 86_400)
        and (s.distance_m is None or 0 < s.distance_m <= 1_000_000)
        and (s.rpe is None or 0 <= s.rpe <= 10)
    )


def _usable(result: ParseResult, s: ImportedSet) -> bool:
    if not _measures_something(s):
        _skip(result, "sets with no reps, time or distance")
        return False
    if not _plausible(s):
        _skip(result, "sets with values outside what a set can hold")
        return False
    return True


# ------------------------------------------------------------------- strong

_STRONG_TYPES: dict[str, SetTypeT] = {"w": "warmup", "d": "drop", "f": "failure"}


def _strong_duration(raw: str | None) -> int | None:
    """"1h 5m", "45m", "50s" or plain seconds."""
    t = (raw or "").strip()
    if not t:
        return None
    if t.isdigit():
        return int(t)
    total = 0
    for value, unit in re.findall(r"(\d+)\s*([hms])", t):
        total += int(value) * {"h": 3600, "m": 60, "s": 1}[unit]
    return total or None


def parse_strong(text: str, weight_unit: Literal["kg", "lb"]) -> ParseResult:
    _, rows = _rows(text)
    result = ParseResult(format="strong", sessions=[])
    groups: dict[tuple, dict] = {}
    to_kg = (lambda v: v) if weight_unit == "kg" else lb_to_kg

    for row in rows:
        order = (row.get("Set Order") or "").strip()
        if order.lower().startswith("rest"):
            _skip(result, "rest timer rows")
            continue
        try:
            # Naive on purpose: the export holds wall-clock time, and the
            # importer places it in the user's own time zone.
            started = datetime.strptime(  # noqa: DTZ007
                (row.get("Date") or "").strip(), "%Y-%m-%d %H:%M:%S"
            )
        except ValueError:
            _skip(result, "rows without a readable date")
            continue
        name = _text(row.get("Exercise Name"), MAX_NAME)
        if not name:
            _skip(result, "rows without an exercise")
            continue

        weight = _num(row.get("Weight"))
        s = ImportedSet(
            set_type=_STRONG_TYPES.get(order.lower(), "working"),
            load_kg=round(to_kg(weight), 3) if weight else None,
            reps=_int(row.get("Reps")) or None,
            duration_seconds=_int(row.get("Seconds")) or None,
            # Strong's distance follows the user's unit setting as well; metric
            # users export kilometres, so a small number is read as km.
            distance_m=_strong_distance(_num(row.get("Distance")), weight_unit),
            rpe=_num(row.get("RPE")),
            note=_text(row.get("Notes"), 500),
        )
        if not _usable(result, s):
            continue

        title = _text(row.get("Workout Name"), MAX_NAME) or "Imported workout"
        g = groups.setdefault((started, title), {
            "title": title, "started_at": started,
            "duration": _strong_duration(row.get("Duration")),
            "notes": _text(row.get("Workout Notes")), "exercises": {},
        })
        ex = g["exercises"].setdefault(name, {"notes": None, "sets": []})
        ex["sets"].append(s)

    result.sessions = _assemble(groups)
    return result


def _strong_distance(value: float | None, unit: str) -> float | None:
    if not value:
        return None
    return round(value * (1000 if unit == "kg" else 1609.344), 1)


# --------------------------------------------------------------------- hevy

_HEVY_TYPES: dict[str, SetTypeT] = {
    "warmup": "warmup", "normal": "working", "dropset": "drop", "failure": "failure",
}
_HEVY_TIME_FORMATS = ("%d %b %Y, %H:%M", "%Y-%m-%d %H:%M:%S", "%Y-%m-%dT%H:%M:%S")


def _hevy_time(raw: str | None) -> datetime | None:
    t = (raw or "").strip()
    for fmt in _HEVY_TIME_FORMATS:
        try:
            return datetime.strptime(t, fmt)  # noqa: DTZ007 — wall-clock time, placed by the importer
        except ValueError:
            continue
    return None


def parse_hevy(text: str) -> ParseResult:
    header, rows = _rows(text)
    result = ParseResult(format="hevy", sessions=[])
    groups: dict[tuple, dict] = {}
    in_pounds = "weight_lbs" in header and "weight_kg" not in header

    for row in rows:
        started = _hevy_time(row.get("start_time"))
        if started is None:
            _skip(result, "rows without a readable date")
            continue
        name = _text(row.get("exercise_title"), MAX_NAME)
        if not name:
            _skip(result, "rows without an exercise")
            continue
        weight = _num(row.get("weight_lbs" if in_pounds else "weight_kg"))
        km = _num(row.get("distance_km"))
        s = ImportedSet(
            set_type=_HEVY_TYPES.get((row.get("set_type") or "normal").strip().lower(), "working"),
            load_kg=round(lb_to_kg(weight) if in_pounds else weight, 3) if weight else None,
            reps=_int(row.get("reps")) or None,
            duration_seconds=_int(row.get("duration_seconds")) or None,
            distance_m=round(km * 1000, 1) if km else None,
            rpe=_num(row.get("rpe")),
            note=None,
        )
        if not _usable(result, s):
            continue

        ended = _hevy_time(row.get("end_time"))
        title = _text(row.get("title"), MAX_NAME) or "Imported workout"
        g = groups.setdefault((started, title), {
            "title": title, "started_at": started,
            "duration": int((ended - started).total_seconds()) if ended and ended > started else None,
            "notes": _text(row.get("description")), "exercises": {},
        })
        ex = g["exercises"].setdefault(name, {"notes": _text(row.get("exercise_notes")), "sets": []})
        ex["sets"].append(s)

    result.sessions = _assemble(groups)
    return result


def parse(text: str, fmt: Format | Literal["auto"] = "auto",
          weight_unit: Literal["kg", "lb"] = "kg") -> ParseResult:
    kind = detect(text) if fmt == "auto" else fmt
    return parse_strong(text, weight_unit) if kind == "strong" else parse_hevy(text)
