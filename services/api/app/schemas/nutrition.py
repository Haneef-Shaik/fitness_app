"""Request and response shapes for nutrition (G7)."""
from __future__ import annotations

import uuid
from datetime import date, datetime
from typing import Annotated, Literal

from pydantic import BaseModel, Field, model_validator

#: A `meal_categories.slug`, NOT a closed set. H-16 lets a user add
#: "Pre-workout", so pinning this to four literals would make a new category a
#: schema change — and would reject a meal the database is perfectly happy with.
#: The route validates that the slug is one of the caller's own categories.
MealTypeT = Annotated[str, Field(min_length=1, max_length=40)]
ItemSourceT = Literal["manual", "text_ai", "image_ai"]


class FoodOut(BaseModel):
    """A food. Nutrition is **per 100 g** — always, and the field names say so
    nowhere, so this docstring has to."""

    id: uuid.UUID
    name: str
    brand: str | None = None
    calories: float | None = None
    protein_g: float | None = None
    carbs_g: float | None = None
    fat_g: float | None = None
    fiber_g: float | None = None
    serving_grams: float | None = None
    serving_label: str | None = None
    source: str
    is_custom: bool = False


class FoodIn(BaseModel):
    name: str = Field(min_length=1, max_length=160)
    brand: str | None = Field(default=None, max_length=120)
    calories: float | None = Field(default=None, ge=0)
    protein_g: float | None = Field(default=None, ge=0)
    carbs_g: float | None = Field(default=None, ge=0)
    fat_g: float | None = Field(default=None, ge=0)
    fiber_g: float | None = Field(default=None, ge=0)
    serving_grams: float | None = Field(default=None, gt=0)
    serving_label: str | None = Field(default=None, max_length=60)


class FoodPatch(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=160)
    brand: str | None = Field(default=None, max_length=120)
    calories: float | None = Field(default=None, ge=0)
    protein_g: float | None = Field(default=None, ge=0)
    carbs_g: float | None = Field(default=None, ge=0)
    fat_g: float | None = Field(default=None, ge=0)
    fiber_g: float | None = Field(default=None, ge=0)
    serving_grams: float | None = Field(default=None, gt=0)
    serving_label: str | None = Field(default=None, max_length=60)


class MealItemIn(BaseModel):
    """One item. Either it references a food, or it names itself.

    A quick-add with no `food_id` is legitimate — somebody ate something the
    catalog has never heard of — but it still has to say what it was, or the
    diary renders a blank row.
    """

    food_id: uuid.UUID | None = None
    display_name: str | None = Field(default=None, max_length=160)
    quantity_grams: float | None = Field(default=None, ge=0)

    # Only used when there is no `food_id`: a quick-add states its own macros.
    # With a `food_id` these are IGNORED and computed from the food, so the
    # snapshot cannot disagree with the source it claims to come from.
    calories: float | None = Field(default=None, ge=0)
    protein_g: float | None = Field(default=None, ge=0)
    carbs_g: float | None = Field(default=None, ge=0)
    fat_g: float | None = Field(default=None, ge=0)
    fiber_g: float | None = Field(default=None, ge=0)

    confirmed: bool = True
    source: ItemSourceT = "manual"
    client_id: uuid.UUID | None = None

    @model_validator(mode="after")
    def _identifiable(self) -> MealItemIn:
        if self.food_id is None and not (self.display_name or "").strip():
            raise ValueError("An item needs a food or a name of its own.")
        return self


class MealItemOut(BaseModel):
    """Macros here are **absolute for the quantity**, snapshotted at write."""

    id: uuid.UUID
    food_id: uuid.UUID | None = None
    display_name: str
    quantity_grams: float | None = None
    calories: float | None = None
    protein_g: float | None = None
    carbs_g: float | None = None
    fat_g: float | None = None
    fiber_g: float | None = None
    confirmed: bool
    user_corrected: bool
    source: ItemSourceT


class MealItemPatch(BaseModel):
    quantity_grams: float | None = Field(default=None, ge=0)
    confirmed: bool | None = None
    display_name: str | None = Field(default=None, max_length=160)
    calories: float | None = Field(default=None, ge=0)
    protein_g: float | None = Field(default=None, ge=0)
    carbs_g: float | None = Field(default=None, ge=0)
    fat_g: float | None = Field(default=None, ge=0)


class MealIn(BaseModel):
    meal_type: MealTypeT
    consumed_at: datetime | None = None
    notes: str | None = Field(default=None, max_length=500)
    client_id: uuid.UUID | None = None
    items: list[MealItemIn] = Field(default_factory=list)


class MealOut(BaseModel):
    id: uuid.UUID
    meal_type: MealTypeT
    consumed_at: datetime
    local_date: date
    logged_timezone: str
    notes: str | None = None
    items: list[MealItemOut] = []


class DayOut(BaseModel):
    """H-01's diary for one local day.

    Totals come from `app.domain.nutrition.day_totals`, which counts only
    confirmed items (**I2 / D5**). `pending_count` is how the screen shows that
    something is there without letting it into the number.

    `incomplete` means a counted item was missing a macro — "we do not know" is
    reported rather than silently treated as zero.
    """

    local_date: date
    calories: float
    protein_g: float
    carbs_g: float
    fat_g: float
    pending_count: int
    incomplete: bool
    meals: list[MealOut] = []


# --------------------------------------------------------- H-16 categories

class MealCategoryOut(BaseModel):
    id: uuid.UUID
    slug: str
    name: str
    sort_order: int
    #: "HH:MM", or null when the category has no usual time.
    default_time: str | None = None
    hidden: bool
    is_default: bool


class MealCategoryIn(BaseModel):
    name: str = Field(min_length=1, max_length=60)
    default_time: str | None = Field(default=None, pattern=r"^\d{2}:\d{2}$")


class MealCategoryPatch(BaseModel):
    """No `slug`. The slug is identity and renaming must not touch it — see
    `app.domain.slug`."""

    name: str | None = Field(default=None, min_length=1, max_length=60)
    default_time: str | None = Field(default=None, pattern=r"^\d{2}:\d{2}$")
    hidden: bool | None = None


class CategoryOrderIn(BaseModel):
    """Every id, in the new order.

    A partial list is refused rather than applied: sending three of four ids
    leaves the fourth at whatever position it happened to hold, which reads as a
    bug the next time the screen is opened.
    """

    ids: list[uuid.UUID] = Field(min_length=1)


# ---------------------------------------------------------- H-12 copying

class MealCopyIn(BaseModel):
    to_date: date
    meal_type: MealTypeT
    client_id: uuid.UUID | None = None


class DayCopyIn(BaseModel):
    from_date: date
    to_date: date
