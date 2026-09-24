"""H-14 · nutrition over a range (N05.3–N05.5)."""
from __future__ import annotations

from datetime import date

from pydantic import BaseModel, Field


class AveragesOut(BaseModel):
    calories: float
    protein_g: float
    carbs_g: float
    fat_g: float


class SplitOut(BaseModel):
    days: int
    calories: float
    protein_g: float


class NutritionDayOut(BaseModel):
    local_date: date
    #: Null when nothing confirmed was logged that day — never 0.
    calories: float | None = None
    protein_g: float | None = None
    trained: bool
    body_weight_kg: float | None = None


class NutritionRangeOut(BaseModel):
    """Averages are over LOGGED days only, and `logged_days` is always beside
    them. Below three logged days `enough_data` is false and the screen says so
    rather than drawing a chart (H-14 edge cases)."""

    #: `from` on the wire; a Python keyword in here.
    from_: date = Field(alias="from")
    to: date
    days: int
    logged_days: int
    enough_data: bool
    averages: AveragesOut | None = None
    #: Shares of energy in whole percent: {"protein": 30, "carbs": 40, "fat": 30}.
    macro_split: dict[str, int] | None = None
    target_kcal: float | None = None
    #: Logged days within ±10% of the calorie target; null without a target.
    within_target_days: int | None = None
    incomplete_days: int
    training: SplitOut | None = None
    rest: SplitOut | None = None
    daily: list[NutritionDayOut]

    model_config = {"populate_by_name": True}
