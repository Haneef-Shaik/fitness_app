"""The AI gateway contract (02 §5.1).

**The model's output is data, not instructions, and not a partial success.** A
response that does not match the schema is a failure with an error code — never
something to parse as far as it goes and keep the rest of. "Never partially
parsed" is the rule 02 §5.3 states and this module is where it is enforced.

The gateway is a `Protocol` for the same reason `FoodResolver` is: the provider
is a runtime dependency, the tests must never make a network call, and swapping
one for another should not reach above this file.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

#: Bumping this is a schema change, and old analyses keep their own version
#: string so a v1 row stays readable when v2 lands.
SCHEMA_VERSION = "food_analysis.v1"
SUPPORTED_SCHEMA_VERSIONS = frozenset({SCHEMA_VERSION})

VALID_UNITS = ("g", "ml", "piece", "serving", "cup")


class AIUnavailable(Exception):
    """The model could not be reached, or did not answer in time."""


class AIInvalidOutput(Exception):
    """The model answered with something that is not the agreed schema."""


@dataclass(frozen=True, slots=True)
class AnalysisItem:
    """One food the model says it saw. Every field here is the MODEL's claim.

    `resolved_food_id` and `user_corrected` are deliberately absent: those are
    set by the platform (02 §5.1), and a model that could set them would be able
    to mark its own guess as a user's decision.
    """

    detected_name: str
    estimated_quantity: float | None
    estimated_unit: str
    confidence: float | None
    proposed_calories: float | None
    proposed_protein_g: float | None
    proposed_carbs_g: float | None
    proposed_fat_g: float | None


@dataclass(frozen=True, slots=True)
class AnalysisResult:
    schema_version: str
    model_name: str
    items: tuple[AnalysisItem, ...] | list[AnalysisItem]
    notes: str | None


class AIGateway(Protocol):
    async def analyse_text(self, text: str) -> AnalysisResult: ...

    async def analyse_image(self, image: bytes, content_type: str) -> AnalysisResult: ...


def parse_result(raw: object) -> AnalysisResult:
    """Validate a model response into an `AnalysisResult`, or raise.

    Deliberately strict and deliberately boring. Every branch here raises
    `AIInvalidOutput`, which the worker turns into `error_code =
    ai_invalid_output` — the user sees "we got a result we couldn't read" and is
    offered manual entry, which is the whole design.
    """
    if not isinstance(raw, dict):
        raise AIInvalidOutput("the response was not an object")

    version = raw.get("schema_version")
    if version not in SUPPORTED_SCHEMA_VERSIONS:
        # An unknown version is refused rather than guessed at. A v2 payload
        # read as v1 is exactly how a "confidence" field becomes a calorie count.
        raise AIInvalidOutput(f"unsupported schema_version {version!r}")

    raw_items = raw.get("items")
    if not isinstance(raw_items, list):
        raise AIInvalidOutput("items was not a list")

    items: list[AnalysisItem] = []
    for entry in raw_items:
        if not isinstance(entry, dict):
            raise AIInvalidOutput("an item was not an object")
        name = entry.get("detected_name")
        if not isinstance(name, str) or not name.strip():
            raise AIInvalidOutput("an item had no detected_name")

        unit = entry.get("estimated_unit") or "g"
        if unit not in VALID_UNITS:
            raise AIInvalidOutput(f"unknown unit {unit!r}")

        confidence = _number(entry.get("confidence"), "confidence")
        if confidence is not None and not (0.0 <= confidence <= 1.0):
            raise AIInvalidOutput("confidence was outside 0..1")

        items.append(AnalysisItem(
            detected_name=name.strip()[:160],
            estimated_quantity=_number(entry.get("estimated_quantity"), "estimated_quantity"),
            estimated_unit=unit,
            confidence=confidence,
            proposed_calories=_number(entry.get("proposed_calories"), "proposed_calories"),
            proposed_protein_g=_number(entry.get("proposed_protein_g"), "proposed_protein_g"),
            proposed_carbs_g=_number(entry.get("proposed_carbs_g"), "proposed_carbs_g"),
            proposed_fat_g=_number(entry.get("proposed_fat_g"), "proposed_fat_g"),
        ))

    model_name = raw.get("model_name")
    return AnalysisResult(
        schema_version=str(version),
        model_name=str(model_name) if model_name else "unknown",
        items=items,
        notes=str(raw["notes"])[:2000] if raw.get("notes") else None,
    )


def _number(value: object, field: str) -> float | None:
    if value is None:
        return None
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise AIInvalidOutput(f"{field} was not a number")
    if value < 0:
        raise AIInvalidOutput(f"{field} was negative")
    return float(value)
