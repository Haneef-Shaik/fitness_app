"""Response shapes for training analytics (G6)."""
from __future__ import annotations

import uuid
from datetime import date
from typing import Literal

from pydantic import BaseModel

GroupBy = Literal["day", "week", "month"]


class VolumeBucketOut(BaseModel):
    """One column of G-02's volume chart.

    `start` is a LOCAL date (I7). A bucket with no training reports 0 rather
    than being omitted: a gap is information, and skipping it draws a lay-off as
    continuous training.
    """

    start: date
    volume_kg: float
    session_count: int
    set_count: int


class WorkoutAnalyticsOut(BaseModel):
    group_by: GroupBy
    buckets: list[VolumeBucketOut] = []
    total_volume_kg: float = 0.0


class MuscleVolumeOut(BaseModel):
    """One bar of G-02's sorted horizontal chart.

    Weighted primary x1.0, secondary x0.5 (**D7 / I4**), and rolled up through
    the muscle tree — a grandchild of Chest is chest volume.
    """

    slug: str
    name: str
    volume_kg: float
    set_count: int


class ProgressionPointOut(BaseModel):
    """One point of G-03's line.

    NOT named `E1rmPointOut`: `app.schemas.sessions` already has one, and two
    classes with the same name make the generated client fall back to
    `app__schemas__analytics__E1rmPointOut`, which broke an existing alias.
    It carries more than e1RM in any case.
    """

    local_date: date
    e1rm_kg: float | None = None
    max_load_kg: float | None = None
    volume_kg: float = 0.0


class ExerciseProgressionOut(BaseModel):
    """G-03 / G-07's line.

    `formula_version` travels with the series (**I5**). A chart mixing versions
    is silently wrong, so the version is stated rather than assumed.
    """

    exercise_id: uuid.UUID
    exercise_name: str | None = None
    formula_version: str
    points: list[ProgressionPointOut] = []


class PersonalRecordRowOut(BaseModel):
    """One tile of G-04's KPI row."""

    exercise_id: uuid.UUID
    exercise_name: str | None = None
    max_load_kg: float | None = None
    max_reps: int | None = None
    estimated_1rm_kg: float | None = None
    volume_kg: float = 0.0
    formula_version: str
    achieved_on: date | None = None


class FrequencyCellOut(BaseModel):
    """One square of G-05's week x muscle heatmap.

    `sessions` counts SESSIONS, not exercises: a three-movement chest day is one
    chest day, and counting exercises makes it look like three.
    """

    week_start: date
    slug: str
    name: str
    sessions: int


class FrequencyOut(BaseModel):
    weeks: list[date] = []
    cells: list[FrequencyCellOut] = []


class AdherenceWeekOut(BaseModel):
    week_start: date
    planned: int
    completed_planned: int


class AdherenceOut(BaseModel):
    """G-06's meter, from **PRD W07.7** via `app.domain.adherence`.

    `adherence` is null when nothing was planned — undefined, not zero. Someone
    without a program has not failed to adhere to anything.
    """

    planned: int
    completed_planned: int
    adherence: float | None = None
    weeks: list[AdherenceWeekOut] = []
