from __future__ import annotations

import uuid
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

EquipmentT = Literal[
    "barbell", "dumbbell", "machine", "cable", "bodyweight", "band", "kettlebell", "other"
]
RoleT = Literal["primary", "secondary"]


class MuscleRefOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    slug: str
    name: str
    role: RoleT


class MuscleGroupOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    slug: str
    name: str
    parent_id: uuid.UUID | None
    sort_order: int


class ExerciseOut(BaseModel):
    id: uuid.UUID
    name: str
    equipment: EquipmentT
    movement_pattern: str | None
    aliases: list[str]
    is_custom: bool
    status: Literal["active", "archived"]
    tracks_load: bool
    tracks_reps: bool
    tracks_duration: bool
    tracks_distance: bool
    default_unit: str
    # Flattened by the route (slug/name live on the joined muscle_group), so this
    # is excluded from ORM validation and populated afterwards.
    muscles: list[MuscleRefOut] = []

    model_config = ConfigDict(from_attributes=True)


class MuscleAssignmentIn(BaseModel):
    muscle_group_id: uuid.UUID
    role: RoleT


class ExerciseIn(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    equipment: EquipmentT = "other"
    movement_pattern: str | None = Field(default=None, max_length=60)
    aliases: list[str] = Field(default_factory=list, max_length=20)
    muscles: list[MuscleAssignmentIn] = Field(min_length=1)
    tracks_load: bool = True
    tracks_reps: bool = True
    tracks_duration: bool = False
    tracks_distance: bool = False
    default_unit: str = Field(default="kg", max_length=8)

    @model_validator(mode="after")
    def _check(self) -> ExerciseIn:
        # W02.4 — without a primary muscle, muscle-group analytics and the
        # previous-chest-day lookup cannot work at all.
        if not any(m.role == "primary" for m in self.muscles):
            raise ValueError("Pick at least one primary muscle.")
        # W04.7 — a set needs reps, time or distance. An exercise that tracks none
        # of them could never hold a valid set.
        if not (self.tracks_reps or self.tracks_duration or self.tracks_distance):
            raise ValueError("Choose at least one thing to track: reps, duration or distance.")
        return self


class ExercisePatch(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    equipment: EquipmentT | None = None
    movement_pattern: str | None = Field(default=None, max_length=60)
    aliases: list[str] | None = None
    muscles: list[MuscleAssignmentIn] | None = None
    tracks_load: bool | None = None
    tracks_reps: bool | None = None
    tracks_duration: bool | None = None
    tracks_distance: bool | None = None
    default_unit: str | None = Field(default=None, max_length=8)

    @model_validator(mode="after")
    def _check(self) -> ExercisePatch:
        if self.muscles is not None and not any(m.role == "primary" for m in self.muscles):
            raise ValueError("Pick at least one primary muscle.")
        return self
