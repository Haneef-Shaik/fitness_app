from __future__ import annotations

from datetime import date
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class ProfileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    display_name: str | None = None
    height_cm: float | None = None
    birth_date: date | None = None
    sex: str | None = None
    preferred_unit_system: Literal["metric", "imperial"]
    timezone: str
    week_starts_on: int
    activity_level: Literal["sedentary", "light", "moderate", "very", "extra"]
    daily_calorie_target: int | None = None
    protein_g_target: int | None = None
    carbs_g_target: int | None = None
    fat_g_target: int | None = None
    onboarding_completed: bool


class ProfilePatch(BaseModel):
    """Every field optional — PATCH applies only what is sent."""
    display_name: str | None = Field(default=None, max_length=80)
    height_cm: float | None = Field(default=None, ge=50, le=300)
    birth_date: date | None = None
    sex: str | None = Field(default=None, max_length=20)
    preferred_unit_system: Literal["metric", "imperial"] | None = None
    timezone: str | None = Field(default=None, max_length=64)
    week_starts_on: Literal[0, 1, 6] | None = None
    activity_level: Literal["sedentary", "light", "moderate", "very", "extra"] | None = None
    daily_calorie_target: int | None = Field(default=None, ge=800, le=8000)
    protein_g_target: int | None = Field(default=None, ge=0, le=600)
    carbs_g_target: int | None = Field(default=None, ge=0, le=1200)
    fat_g_target: int | None = Field(default=None, ge=0, le=400)
    onboarding_completed: bool | None = None
