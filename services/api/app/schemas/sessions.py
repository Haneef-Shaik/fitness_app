from __future__ import annotations

import uuid
from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

SetTypeT = Literal["warmup", "working", "drop", "failure"]
SessionStatusT = Literal["planned", "in_progress", "completed", "cancelled"]


class SessionStart(BaseModel):
    """Exactly one source. `plan_day_id` snapshots the prescription at start."""
    plan_day_id: uuid.UUID | None = None
    repeat_session_id: uuid.UUID | None = None
    exercise_ids: list[uuid.UUID] | None = None
    started_at: datetime | None = None     # backdating; never in the future
    notes: str | None = Field(default=None, max_length=2000)


class SetIn(BaseModel):
    # The client's idempotency key. A retried offline write must land on the same row.
    client_id: uuid.UUID | None = None
    set_type: SetTypeT = "working"
    reps: int | None = Field(default=None, ge=1, le=1000)
    load_kg: float | None = Field(default=None, ge=0, le=1000)
    duration_seconds: int | None = Field(default=None, ge=1, le=86400)
    distance_m: float | None = Field(default=None, gt=0, le=1_000_000)
    rpe: float | None = Field(default=None, ge=0, le=10)
    rir: float | None = Field(default=None, ge=0, le=10)
    load_unit_entered: Literal["kg", "lb"] = "kg"
    completed: bool = True
    performed_at: datetime | None = None
    note: str | None = Field(default=None, max_length=500)

    @model_validator(mode="after")
    def _must_measure_something(self) -> SetIn:
        # W04.7 — load alone is not a set.
        if self.reps is None and self.duration_seconds is None and self.distance_m is None:
            raise ValueError("Add reps, time or distance to save this set.")
        return self


class SetPatch(BaseModel):
    set_type: SetTypeT | None = None
    reps: int | None = Field(default=None, ge=1, le=1000)
    load_kg: float | None = Field(default=None, ge=0, le=1000)
    duration_seconds: int | None = Field(default=None, ge=1, le=86400)
    distance_m: float | None = Field(default=None, gt=0, le=1_000_000)
    rpe: float | None = Field(default=None, ge=0, le=10)
    rir: float | None = Field(default=None, ge=0, le=10)
    completed: bool | None = None
    note: str | None = Field(default=None, max_length=500)


class SetOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    client_id: uuid.UUID | None
    set_index: int
    set_type: SetTypeT
    reps: int | None
    load_kg: float | None
    duration_seconds: int | None
    distance_m: float | None
    rpe: float | None
    rir: float | None
    completed: bool
    performed_at: datetime
    load_unit_entered: str
    e1rm_kg: float | None
    formula_version: str | None
    is_pr: bool
    note: str | None


class SessionExerciseIn(BaseModel):
    exercise_id: uuid.UUID
    position: int | None = None      # None = append


class SessionExerciseOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    exercise_id: uuid.UUID
    exercise_name: str | None = None
    order_index: int
    notes: str | None
    skipped: bool
    target_snapshot: dict | None
    sets: list[SetOut] = []


class SessionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    plan_day_id: uuid.UUID | None
    status: SessionStatusT
    started_at: datetime
    completed_at: datetime | None
    local_date: date
    logged_timezone: str
    notes: str | None
    total_volume_kg: float | None
    duration_seconds: int | None
    exercises: list[SessionExerciseOut] = []


class PersonalRecordOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    exercise_id: uuid.UUID
    exercise_name: str | None = None
    record_type: Literal["max_load", "max_reps", "volume", "estimated_1rm"]
    value: float
    unit: str
    previous_value: float | None = None
