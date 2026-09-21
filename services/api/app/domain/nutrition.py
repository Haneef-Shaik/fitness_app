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
