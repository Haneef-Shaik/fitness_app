"""Request and response shapes for body metrics, goals progress and B-01 (G9)."""
from __future__ import annotations

import uuid
from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field

METRIC_UNITS = Literal["kg", "lb", "cm", "in", "%"]


class BodyMetricIn(BaseModel):
    metric_key: str = Field(default="body_weight", max_length=40)
    #: Bounded so a fat-fingered 7.84 or 784 is refused rather than charted.
    value: float = Field(gt=0, le=1000)
    #: **I6** — the caller may speak pounds; storage is kilograms.
    unit: METRIC_UNITS = "kg"
    measured_at: datetime | None = None
    notes: str | None = Field(default=None, max_length=500)
    client_id: uuid.UUID | None = None


class BodyMetricOut(BaseModel):
    id: uuid.UUID
    metric_key: str
    #: Always canonical: kilograms or centimetres.
    value: float
    unit: str
    measured_at: datetime
    local_date: date
    notes: str | None = None


class BodyPointOut(BaseModel):
    local_date: date
    #: The day's **canonical** value — the first measurement of that day (Q5).
    value: float
    #: A trailing mean. Weight moves a kilogram a day on water alone, and the
    #: average is what somebody is actually trying to read off the chart.
    moving_average: float | None = None


class BodySeriesOut(BaseModel):
    metric_key: str
    unit: str
    points: list[BodyPointOut] = []
    #: `None` rather than 0 for a range with nothing in it — I13.
    change: float | None = None
    latest: BodyPointOut | None = None


# ------------------------------------------------------------------ B-01

class TrainingCardOut(BaseModel):
    sessions_today: int = 0
    volume_today_kg: float = 0
    sessions_this_week: int = 0
    volume_this_week_kg: float = 0
    streak_days: int = 0
    #: Surfaced so "resume" is reachable. G4's lesson: a screen reachable only
    #: by typing a URL is not reachable.
    active_session_id: uuid.UUID | None = None
    last_session: LastSessionOut | None = None


class LastSessionOut(BaseModel):
    id: uuid.UUID
    local_date: date
    title: str | None = None
    total_volume_kg: float | None = None
    set_count: int = 0


class MacroTargetsOut(BaseModel):
    calories: int | None = None
    protein_g: int | None = None
    carbs_g: int | None = None
    fat_g: int | None = None


class NutritionCardOut(BaseModel):
    """Confirmed items only (**I2 / D5**), through `day_totals` like everything
    else. `pending_count` is how the screen shows an estimate exists without
    letting it into the number."""

    calories: float = 0
    protein_g: float = 0
    carbs_g: float = 0
    fat_g: float = 0
    meals_logged: int = 0
    pending_count: int = 0
    incomplete: bool = False
    targets: MacroTargetsOut = MacroTargetsOut()


class BodyCardOut(BaseModel):
    """The last weigh-in, and whether one happened today.

    `latest` may be days old — that is the number to show, with its date. `today`
    is separately `None` when the user has not stepped on the scales today, which
    is what lets B-01 prompt without pretending an old figure is fresh.
    """

    latest: BodyPointOut | None = None
    #: The dashboard date's canonical weigh-in (Q5), or `None`.
    today: float | None = None
    change_7d: float | None = None
    change_30d: float | None = None
    unit: str = "kg"


class GoalCardOut(BaseModel):
    id: uuid.UUID
    goal_type: str
    metric_key: str
    direction: str
    start_value: float | None = None
    target_value: float
    target_unit: str
    start_date: date | None = None
    target_date: date | None = None
    weekly_rate: float | None = None
    #: The latest canonical measurement for this goal's metric, or `None`.
    current_value: float | None = None
    #: `None` when it cannot be known. **Null is not zero** — see
    #: `app.domain.body.goal_progress`.
    progress: float | None = None
    status: str


class DashboardOut(BaseModel):
    """**AC-11.** One call, one local date, three domains.

    Every domain is always present. A brand-new user has three empty ones, and
    that is the *first* dashboard anybody sees — it must render, not 404.
    """

    local_date: date
    #: Stated so the screen can show it, and so a bug report can name it.
    timezone: str
    training: TrainingCardOut
    nutrition: NutritionCardOut
    body: BodyCardOut
    goals: list[GoalCardOut] = []


# ------------------------------------------------------------------ I-05

class ProgressPhotoIn(BaseModel):
    image_key: str = Field(min_length=1, max_length=400)
    taken_at: datetime | None = None
    pose: Literal["front", "side", "back"] = "front"
    notes: str | None = Field(default=None, max_length=500)
    client_id: uuid.UUID | None = None


class ProgressPhotoOut(BaseModel):
    id: uuid.UUID
    image_key: str
    taken_at: datetime
    local_date: date
    pose: str
    notes: str | None = None
