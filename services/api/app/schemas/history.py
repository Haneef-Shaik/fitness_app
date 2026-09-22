"""Response shapes for history retrieval (G5).

The list's pagination meta is NOT here: it is `CursorMeta` in
`app.schemas.envelope`, because every list endpoint after this one uses the
same shape (H5.1).
"""
from __future__ import annotations

import uuid
from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel


class PreviousOccurrenceOut(BaseModel):
    """AC-05's answer.

    Deliberately NOT the whole session: F-03 already serves session detail, and
    embedding it here would give `id` two homes (I15). This carries what F-05's
    header renders, plus the two facts the rule itself produces.
    """

    session_id: uuid.UUID
    completed_at: datetime | None
    local_date: date
    total_volume_kg: float | None
    duration_seconds: int | None
    exercise_names: list[str] = []

    muscle_slug: str
    muscle_name: str

    # PRD §7.2: "the UI states that it widened". It can only do that if the fact
    # reaches the payload, so it is part of the answer and not a log line.
    widened: bool
    role_matched: Literal["primary", "secondary"]


class HistoryItemOut(BaseModel):
    """One row of F-01. Deliberately thin: the list is scrolled, not read."""

    id: uuid.UUID
    started_at: datetime
    completed_at: datetime | None
    local_date: date
    logged_timezone: str
    total_volume_kg: float | None
    duration_seconds: int | None
    set_count: int
    exercise_names: list[str] = []


class BestSetOut(BaseModel):
    load_kg: float | None = None
    reps: int | None = None
    e1rm_kg: float | None = None


class ComparisonCellOut(BaseModel):
    """One exercise in one session.

    Every field is `None` when that session did not include the exercise —
    deliberately not zero. "You did not do it" and "you did it for nothing" are
    different, and a chart that reads absence as 0 draws a cliff that never
    happened.
    """

    session_id: uuid.UUID
    volume_kg: float | None = None
    set_count: int | None = None
    max_load_kg: float | None = None
    best_set: BestSetOut | None = None


class ComparisonRowOut(BaseModel):
    exercise_id: uuid.UUID
    exercise_name: str | None = None
    per_session: list[ComparisonCellOut] = []


class ComparisonSessionOut(BaseModel):
    id: uuid.UUID
    local_date: date
    started_at: datetime
    total_volume_kg: float
    set_count: int
    duration_seconds: int | None = None


class ComparisonOut(BaseModel):
    """H5.2. Sessions newest-first; one row per exercise across all of them."""

    sessions: list[ComparisonSessionOut] = []
    exercises: list[ComparisonRowOut] = []
