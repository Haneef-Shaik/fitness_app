"""Freezing macros onto a row.

Called by every path that writes a `meal_item` — logging, copying, and logging a
recipe. One implementation, because "the macros are snapshotted at write" is
only true if every writer does it the same way (02 §4.2 inv. 4).
"""
from __future__ import annotations

from app.domain import nutrition as domain_nutrition
from app.models import Food


def num(value) -> float | None:
    return float(value) if value is not None else None


def snapshot_from_food(food: Food, grams: float) -> dict:
    """Absolute macros for `grams` of `food`, computed from its per-100 g figures."""
    macros = domain_nutrition.scale_to_grams(
        domain_nutrition.Per100g(
            calories=num(food.calories), protein_g=num(food.protein_g),
            carbs_g=num(food.carbs_g), fat_g=num(food.fat_g),
        ),
        float(grams),
    )
    fiber = num(food.fiber_g)
    return {
        "calories": macros.calories, "protein_g": macros.protein_g,
        "carbs_g": macros.carbs_g, "fat_g": macros.fat_g,
        "fiber_g": None if fiber is None else fiber * (float(grams) / 100.0),
    }


def scale_absolute(values: dict, factor: float) -> dict:
    """Scale already-absolute macros. Used when an item has no food behind it."""
    return {k: (None if v is None else float(v) * factor) for k, v in values.items()}
