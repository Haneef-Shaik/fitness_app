"""Request and response shapes for AI food analysis (G8)."""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.nutrition import MealTypeT


class AnalysisItemOut(BaseModel):
    """One food the model reported. **Every number here is a proposal.**

    Nothing in this object has moved a total. It moves one only after the user
    confirms it in H-08, and then it moves `meal_items`, never this row.
    """

    id: uuid.UUID
    detected_name: str
    estimated_quantity: float | None = None
    estimated_unit: str
    confidence: float | None = None
    #: What confirming saves at `estimated_quantity`: the matched food's macros
    #: when there is one (H7.2), the model's own otherwise.
    proposed_calories: float | None = None
    proposed_protein_g: float | None = None
    proposed_carbs_g: float | None = None
    proposed_fat_g: float | None = None
    #: The resolver's answer. `null` is ladder step 5 — the item keeps the
    #: model's macros and H-08 labels it "using our estimate".
    resolved_food_id: uuid.UUID | None = None
    resolved_food_name: str | None = None
    #: Below the review threshold. Computed server-side so every screen agrees.
    low_confidence: bool = False


class AnalysisOut(BaseModel):
    id: uuid.UUID
    input_type: Literal["text", "image"]
    status: Literal["pending", "processing", "completed", "failed"]
    #: The user's own words, kept so nobody is made to retype their meal.
    source_text: str | None = None
    image_key: str | None = None
    error_code: str | None = None
    model_name: str | None = None
    schema_version: str | None = None
    notes: str | None = None
    confirmed_meal_id: uuid.UUID | None = None
    created_at: datetime
    items: list[AnalysisItemOut] = []


class TextAnalysisIn(BaseModel):
    # H-06's validation: under three characters is not a meal description.
    text: str = Field(min_length=3, max_length=1000)
    client_id: uuid.UUID | None = None


class ImageAnalysisIn(BaseModel):
    image_key: str = Field(min_length=1, max_length=400)
    client_id: uuid.UUID | None = None


class ConfirmItemIn(BaseModel):
    """One reviewed item.

    Anything left unset is accepted as proposed. Setting a field is what makes
    it a **correction**, and the route decides `user_corrected` from exactly
    that — not from whether the user opened the screen.
    """

    analysis_item_id: uuid.UUID
    include: bool = True
    display_name: str | None = Field(default=None, max_length=160)
    food_id: uuid.UUID | None = None
    quantity_grams: float | None = Field(default=None, ge=0)
    calories: float | None = Field(default=None, ge=0)
    protein_g: float | None = Field(default=None, ge=0)
    carbs_g: float | None = Field(default=None, ge=0)
    fat_g: float | None = Field(default=None, ge=0)


class ConfirmIn(BaseModel):
    meal_type: MealTypeT
    consumed_at: datetime | None = None
    items: list[ConfirmItemIn] = Field(default_factory=list)
    client_id: uuid.UUID | None = None


class UploadSignIn(BaseModel):
    content_type: Literal["image/jpeg", "image/png"]
    byte_size: int = Field(gt=0)


class UploadSignOut(BaseModel):
    key: str
    upload_url: str
    expires_at: datetime
    max_bytes: int


class QuotaOut(BaseModel):
    """Stated BEFORE a photo is taken (02 §5.4), never after."""

    used: int
    limit: int
    remaining: int
    #: The user's next local midnight (I7), with its UTC offset.
    resets_at: datetime


class AnalysisSettingsOut(BaseModel):
    """K-08 · what a person is told about the AI before they use it (launch).

    Read from configuration, so the disclosure is where photos actually go —
    not a sentence in the app that drifts when the provider changes.
    """

    #: "anthropic", or "stub" when no provider is configured.
    provider: str
    #: How K-08 names the provider to a person.
    provider_name: str
    #: The model that analyses photos and descriptions.
    model: str
    #: Whether a submitted photo or description leaves our servers. False only
    #: for the development stub.
    sends_to_provider: bool
    #: Items below this confidence start unticked on H-08 (N04.3).
    low_confidence_threshold: float
    quota: QuotaOut
