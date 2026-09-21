from __future__ import annotations

import uuid
from datetime import date
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

GoalTypeT = Literal["fat_loss", "muscle_gain", "maintenance", "strength", "custom"]
GoalStatusT = Literal["active", "completed", "paused"]


class GoalIn(BaseModel):
    goal_type: GoalTypeT
    metric_key: str = Field(default="body_weight", max_length=40)
    direction: Literal["up", "down", "hold"] = "down"
    start_value: float | None = None
    target_value: float
    target_unit: str = Field(default="kg", max_length=16)
    start_date: date
    target_date: date | None = None


class GoalPatch(BaseModel):
    target_value: float | None = None
    target_date: date | None = None
    status: GoalStatusT | None = None


class GoalOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    goal_type: GoalTypeT
    metric_key: str
    direction: str
    start_value: float | None
    target_value: float
    target_unit: str
    start_date: date
    target_date: date | None
    status: GoalStatusT
