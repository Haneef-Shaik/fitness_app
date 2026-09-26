from __future__ import annotations

from datetime import date
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.domain.age import MIN_AGE_YEARS, age_on, today_anywhere


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
    training_experience: Literal["beginner", "intermediate", "advanced"] | None = None
    training_days_per_week: int | None = None
    session_minutes: int | None = None
    equipment: Literal["full_gym", "home_gym", "dumbbells", "bodyweight"] | None = None
    checkin_interval_days: int = 7


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
    training_experience: Literal["beginner", "intermediate", "advanced"] | None = None
    training_days_per_week: int | None = Field(default=None, ge=1, le=7)
    session_minutes: int | None = Field(default=None, ge=15, le=240)
    equipment: Literal["full_gym", "home_gym", "dumbbells", "bodyweight"] | None = None
    checkin_interval_days: int | None = Field(default=None, ge=1, le=31)

    @field_validator("birth_date")
    @classmethod
    def _old_enough(cls, v: date | None) -> date | None:
        # A-07 / Q9: the client stops a younger person at onboarding, but the
        # rule belongs to the server — a client is not a boundary.
        if v is None:
            return v
        today = today_anywhere()
        if v > today:
            raise ValueError("Birth date is in the future.")
        if age_on(v, today) < MIN_AGE_YEARS:
            raise ValueError(f"FitLog is for people aged {MIN_AGE_YEARS} and over.")
        return v
