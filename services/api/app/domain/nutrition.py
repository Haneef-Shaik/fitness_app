"""Only confirmed items drive nutrition analytics (decision D5, BRD §12.9)."""
from __future__ import annotations

from collections.abc import Iterable
from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class MealItem:
    calories: float | None
    protein_g: float | None
    carbs_g: float | None
    fat_g: float | None
    confirmed: bool


@dataclass(frozen=True, slots=True)
class DayTotals:
    calories: float
    protein_g: float
    carbs_g: float
    fat_g: float
    pending_count: int
    incomplete: bool


def day_totals(items: Iterable[MealItem]) -> DayTotals:
    items = list(items)
    confirmed = [i for i in items if i.confirmed]
    incomplete = False
    totals: dict[str, float] = {"calories": 0.0, "protein_g": 0.0, "carbs_g": 0.0, "fat_g": 0.0}
    for i in confirmed:
        for field in totals:
            v = getattr(i, field)
            if v is None:
                incomplete = True
            else:
                totals[field] += v
    return DayTotals(
        **totals, pending_count=len(items) - len(confirmed), incomplete=incomplete
    )


def remaining_kcal(consumed: float, target: float) -> float:
    """Negative means over target. The UI renders that; it never hides it."""
    return target - consumed


@dataclass(frozen=True, slots=True)
class Macros:
    """Absolute macros for a quantity — never per-100 g.

    The two are kept in different types on purpose. The trap G7's contract names
    is putting a per-100 g figure and a per-serving figure in the same column,
    and the same mistake is available in a variable: a number called `calories`
    that sometimes means "per 100 g" is the bug that writes 165 kcal for 2 kg of
    chicken.
    """

    calories: float | None
    protein_g: float | None
    carbs_g: float | None
    fat_g: float | None


@dataclass(frozen=True, slots=True)
class Per100g:
    """How a `food` stores its nutrition. **The canonical form** (I6)."""

    calories: float | None
    protein_g: float | None
    carbs_g: float | None
    fat_g: float | None


def scale_to_grams(per_100g: Per100g, grams: float) -> Macros:
    """What `grams` of this food actually contains.

    Unknown stays unknown: a null macro scales to null, never to 0. "We do not
    know the protein" and "it has no protein" are different claims, and
    `day_totals` already distinguishes them through its `incomplete` flag —
    collapsing one into the other here would defeat that.

    No rounding. The display edge rounds; the domain keeps the number it was
    given, so summing many items does not accumulate a rounding error.
    """
    factor = grams / 100.0

    def one(value: float | None) -> float | None:
        return None if value is None else value * factor

    return Macros(
        calories=one(per_100g.calories),
        protein_g=one(per_100g.protein_g),
        carbs_g=one(per_100g.carbs_g),
        fat_g=one(per_100g.fat_g),
    )
