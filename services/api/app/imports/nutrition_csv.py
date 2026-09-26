"""Reading a MyFitnessPal nutrition export (launch plan, phase 6).

MFP's export is totals — one row per meal per day, with calories and macros —
not the foods themselves. So a meal comes across as one entry carrying that
meal's totals, named as what it is ("Lunch — from MyFitnessPal"), rather than
pretending to know what was eaten. The day totals, the weekly averages and the
targets comparison (H-14) all work from that.
"""
from __future__ import annotations

import csv
import io
from dataclasses import dataclass, field
from datetime import date

from app.imports.workout_csv import MAX_BYTES, MAX_ROWS, ImportFormatError

#: MFP's meal names → FitLog's default categories. Anything else is a snack:
#: the category a user can move it out of, rather than one that does not exist.
MEALS = {"breakfast": "breakfast", "lunch": "lunch", "dinner": "dinner", "snacks": "snack", "snack": "snack"}


@dataclass(frozen=True, slots=True)
class ImportedMeal:
    day: date
    meal_type: str
    source_name: str
    calories: float | None
    protein_g: float | None
    carbs_g: float | None
    fat_g: float | None
    fiber_g: float | None


@dataclass(slots=True)
class NutritionParse:
    meals: list[ImportedMeal]
    skipped_rows: dict[str, int] = field(default_factory=dict)


def _num(raw: str | None) -> float | None:
    t = (raw or "").strip().replace(",", "")
    if not t:
        return None
    try:
        v = float(t)
    except ValueError:
        return None
    return v if v >= 0 else None


def _col(row: dict[str, str], *names: str) -> str | None:
    for n in names:
        for k, v in row.items():
            if k and k.strip().lower() == n:
                return v
    return None


def parse_mfp(text: str) -> NutritionParse:
    if len(text.encode()) > MAX_BYTES:
        raise ImportFormatError("That file is too large to import (8 MB at most).")
    reader = csv.DictReader(io.StringIO(text.lstrip("﻿")))
    header = {h.strip().lower() for h in (reader.fieldnames or [])}
    if not {"date", "meal", "calories"} <= header:
        raise ImportFormatError(
            "That doesn't look like a MyFitnessPal nutrition export. "
            "Export the Nutrition Summary as CSV and try again."
        )
    result = NutritionParse(meals=[])
    for count, row in enumerate(reader, start=1):
        if count > MAX_ROWS:
            raise ImportFormatError(
                f"That file has more than {MAX_ROWS:,} rows. Export a shorter date range and import it in parts."
            )
        try:
            day = date.fromisoformat((_col(row, "date") or "").strip())
        except ValueError:
            result.skipped_rows["rows without a readable date"] = \
                result.skipped_rows.get("rows without a readable date", 0) + 1
            continue
        meal_name = (_col(row, "meal") or "").strip()
        calories = _num(_col(row, "calories"))
        if calories is None:
            result.skipped_rows["rows without calories"] = \
                result.skipped_rows.get("rows without calories", 0) + 1
            continue
        result.meals.append(ImportedMeal(
            day=day,
            meal_type=MEALS.get(meal_name.lower(), "snack"),
            source_name=(meal_name or "Meal")[:60],
            calories=calories,
            protein_g=_num(_col(row, "protein (g)", "protein")),
            carbs_g=_num(_col(row, "carbohydrates (g)", "carbohydrates", "carbs (g)")),
            fat_g=_num(_col(row, "fat (g)", "fat")),
            fiber_g=_num(_col(row, "fiber", "fiber (g)")),
        ))
    return result
