"""Request and response shapes for recipes (H-11)."""
from __future__ import annotations

import uuid

from pydantic import BaseModel, Field, model_validator

from app.schemas.nutrition import MealTypeT


class MacrosOut(BaseModel):
    """Absolute macros for whatever the containing object says they describe."""

    calories: float | None = None
    protein_g: float | None = None
    carbs_g: float | None = None
    fat_g: float | None = None


class RecipeItemIn(BaseModel):
    food_id: uuid.UUID | None = None
    display_name: str | None = Field(default=None, max_length=160)
    quantity_grams: float | None = Field(default=None, ge=0)

    # Only read when there is no `food_id` — absolute, for the whole batch.
    calories: float | None = Field(default=None, ge=0)
    protein_g: float | None = Field(default=None, ge=0)
    carbs_g: float | None = Field(default=None, ge=0)
    fat_g: float | None = Field(default=None, ge=0)

    @model_validator(mode="after")
    def _identifiable(self) -> RecipeItemIn:
        if self.food_id is None and not (self.display_name or "").strip():
            raise ValueError("An ingredient needs a food or a name of its own.")
        return self


class RecipeItemOut(BaseModel):
    id: uuid.UUID
    food_id: uuid.UUID | None = None
    display_name: str
    quantity_grams: float | None = None
    calories: float | None = None
    protein_g: float | None = None
    carbs_g: float | None = None
    fat_g: float | None = None


class RecipeIn(BaseModel):
    name: str = Field(min_length=1, max_length=160)
    servings: float = Field(default=1, gt=0, le=100)
    notes: str | None = Field(default=None, max_length=500)
    items: list[RecipeItemIn] = Field(default_factory=list)


class RecipePatch(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=160)
    servings: float | None = Field(default=None, gt=0, le=100)
    notes: str | None = Field(default=None, max_length=500)
    #: When present, REPLACES the item list wholesale. A patch that merged items
    #: would have no way to express "remove the honey".
    items: list[RecipeItemIn] | None = None


class RecipeOut(BaseModel):
    id: uuid.UUID
    name: str
    servings: float
    notes: str | None = None
    items: list[RecipeItemOut] = []
    #: Computed from the CURRENT foods, because a recipe is a plan. Logging it
    #: snapshots; see `app.models.recipe`.
    per_serving: MacrosOut


class RecipeLogIn(BaseModel):
    meal_type: MealTypeT
    servings: float = Field(default=1, gt=0, le=100)
    consumed_at: str | None = None
    client_id: uuid.UUID | None = None
