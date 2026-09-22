from __future__ import annotations

import uuid
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator


class PlanExerciseIn(BaseModel):
    exercise_id: uuid.UUID
    target_sets: int | None = Field(default=None, ge=1, le=20)
    target_reps_min: int | None = Field(default=None, ge=1, le=100)
    target_reps_max: int | None = Field(default=None, ge=1, le=100)
    target_load: float | None = Field(default=None, ge=0, le=1000)
    load_unit: Literal["kg", "lb"] = "kg"
    # For exercises whose tracked fields are time or distance rather than reps/load
    # (C-07 renders from `exercises.tracks_*`). Canonical units: seconds, metres.
    target_duration_seconds: int | None = Field(default=None, ge=1, le=86400)
    target_distance_m: float | None = Field(default=None, gt=0, le=1_000_000)
    rest_seconds: int | None = Field(default=None, ge=0, le=600)

    @model_validator(mode="after")
    def _swap_reversed_rep_range(self) -> PlanExerciseIn:
        # A reversed range is a slip, not an error worth blocking on — swap it
        # silently, the way the UI does (C-07).
        lo, hi = self.target_reps_min, self.target_reps_max
        if lo is not None and hi is not None and hi < lo:
            object.__setattr__(self, "target_reps_min", hi)
            object.__setattr__(self, "target_reps_max", lo)
        return self


class PlanExerciseOut(PlanExerciseIn):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    order_index: int
    exercise_name: str | None = None


class PlanDayIn(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    scheduled_weekday: int | None = Field(default=None, ge=0, le=6)
    notes: str | None = Field(default=None, max_length=2000)


class PlanDayPatch(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=80)
    scheduled_weekday: int | None = Field(default=None, ge=0, le=6)
    notes: str | None = Field(default=None, max_length=2000)
    clear_schedule: bool = False


class PlanDayOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    day_index: int
    name: str
    scheduled_weekday: int | None
    notes: str | None
    exercises: list[PlanExerciseOut] = []


class ProgramIn(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    description: str | None = Field(default=None, max_length=500)


class ProgramPatch(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=80)
    description: str | None = Field(default=None, max_length=500)


class ProgramOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    name: str
    description: str | None
    status: Literal["active", "archived"]
    days: list[PlanDayOut] = []
