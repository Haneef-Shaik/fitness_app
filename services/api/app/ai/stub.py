"""A gateway that answers without a network call.

Two jobs, and they are the same job:

**Tests never reach a provider.** Every assertion in `test_ai_nutrition.py` runs
against this, so the suite is deterministic, free, and does not need a key.

**Local development works without a key.** `VOLT_AI_PROVIDER=stub` is the
default, so `git clone` → `pytest` → run the app needs no secret at all. A
developer opts *in* to spending money.

The parsing it does is genuinely naive — it is not trying to be a model. It
exists so that AC-08's "three foods become three items" is exercised end to end
through the real worker, the real resolver and the real persistence path.
"""
from __future__ import annotations

import re

from app.ai.gateway import SCHEMA_VERSION, AnalysisItem, AnalysisResult, parse_result

MODEL_NAME = "stub/deterministic@1"

#: Rough per-100 g figures for the handful of things the stub recognises, so an
#: end-to-end test produces plausible numbers rather than zeroes.
_KNOWN: dict[str, tuple[float, float, float, float, float]] = {
    # name            grams  kcal   protein carbs  fat   (per the stated grams)
    "egg":           (100.0, 143.0, 12.6, 0.7, 9.5),
    "roti":          (120.0, 297.0, 9.0, 54.0, 6.0),
    "chicken":       (200.0, 330.0, 62.0, 0.0, 7.2),
    "chicken curry": (200.0, 380.0, 26.0, 12.0, 24.0),
    "dal":           (200.0, 232.0, 14.0, 34.0, 4.0),
    "rice":          (150.0, 195.0, 4.0, 42.0, 0.5),
    "milk":          (250.0, 155.0, 8.0, 12.0, 8.0),
    "whey":          (60.0, 240.0, 48.0, 6.0, 3.0),
    "salad":         (60.0, 18.0, 1.0, 3.0, 0.2),
    "raita":         (100.0, 74.0, 3.0, 5.0, 4.0),
}

_SPLIT = re.compile(r",| and |\n")
_QUANTITY = re.compile(r"(\d+(?:\.\d+)?)\s*(g|ml|grams?|kg)?\b", re.IGNORECASE)


class StubGateway:
    """Deterministic, offline, and configurable by a test.

    A test sets `result` to dictate the outcome, `fail_with` to kill the service,
    or `raw_override` to feed the parser something malformed — which is how the
    containment tests reach the failure paths without a provider that misbehaves
    on cue.
    """

    def __init__(self) -> None:
        self.result: AnalysisResult | None = None
        self.fail_with: Exception | None = None
        self.raw_override: object | None = None
        self.calls: list[tuple[str, str]] = []

    def reset(self) -> None:
        self.result = None
        self.fail_with = None
        self.raw_override = None
        self.calls = []

    async def analyse_text(self, text: str) -> AnalysisResult:
        self.calls.append(("text", text))
        return self._respond(lambda: _from_text(text))

    async def analyse_image(self, image: bytes, content_type: str) -> AnalysisResult:
        self.calls.append(("image", content_type))
        return self._respond(_from_image)

    def _respond(self, build) -> AnalysisResult:
        if self.fail_with is not None:
            raise self.fail_with
        if self.raw_override is not None:
            # Goes through the REAL parser, so a malformed-output test proves
            # the parser rejects it rather than proving the stub does.
            return parse_result(self.raw_override)
        if self.result is not None:
            return self.result
        return build()


def _from_text(text: str) -> AnalysisResult:
    items: list[AnalysisItem] = []
    for fragment in (f.strip() for f in _SPLIT.split(text)):
        if not fragment:
            continue
        item = _item_for(fragment)
        if item is not None:
            items.append(item)

    return AnalysisResult(
        schema_version=SCHEMA_VERSION, model_name=MODEL_NAME, items=items,
        notes=None if items else "no foods recognised",
    )


def _from_image() -> AnalysisResult:
    return AnalysisResult(
        schema_version=SCHEMA_VERSION, model_name=MODEL_NAME,
        items=[
            AnalysisItem(
                detected_name="Chicken curry", estimated_quantity=350.0,
                estimated_unit="g", confidence=0.82, proposed_calories=620.0,
                proposed_protein_g=31.0, proposed_carbs_g=70.0, proposed_fat_g=23.0,
            ),
            AnalysisItem(
                detected_name="Raita", estimated_quantity=100.0,
                estimated_unit="g", confidence=0.41, proposed_calories=74.0,
                proposed_protein_g=3.0, proposed_carbs_g=5.0, proposed_fat_g=4.0,
            ),
        ],
        notes=None,
    )


def _item_for(fragment: str) -> AnalysisItem | None:
    lowered = fragment.lower()
    match = next(
        (k for k in sorted(_KNOWN, key=len, reverse=True) if k in lowered), None
    )
    if match is None:
        return None

    base_grams, kcal, protein, carbs, fat = _KNOWN[match]
    grams, explicit = _grams_in(lowered, base_grams)
    scale = grams / base_grams if base_grams else 1.0

    return AnalysisItem(
        detected_name=fragment[:160].strip().capitalize(),
        estimated_quantity=round(grams, 2),
        estimated_unit="g",
        # An amount the user actually stated is more certain than one guessed at.
        confidence=0.86 if explicit else 0.58,
        proposed_calories=round(kcal * scale, 2),
        proposed_protein_g=round(protein * scale, 2),
        proposed_carbs_g=round(carbs * scale, 2),
        proposed_fat_g=round(fat * scale, 2),
    )


def _grams_in(fragment: str, default_grams: float) -> tuple[float, bool]:
    """Grams, and whether the user stated them.

    "200g chicken" is a mass. "2 eggs" is a count, and the count multiplies the
    default portion rather than being read as 2 grams — which is the difference
    between 286 kcal and nothing.
    """
    match = _QUANTITY.search(fragment)
    if match is None:
        return default_grams, False

    value = float(match.group(1))
    unit = (match.group(2) or "").lower()
    if unit.startswith(("g", "ml")):
        return value, True
    if unit == "kg":
        return value * 1000, True
    return value * default_grams, True
