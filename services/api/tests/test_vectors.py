"""Runs the SHARED cross-language vectors in contracts/vectors/domain.json.

The TypeScript suite in packages/domain/test/vectors.test.ts loads the same file.
If the two implementations ever disagree, a user's session summary changes after it
syncs — this file is what makes that impossible to ship.
"""
from __future__ import annotations

import json
from datetime import date
from pathlib import Path

import pytest

from app.domain.adherence import adherence, planned_occurrences
from app.domain.dates import to_local_date
from app.domain.nutrition import MealItem, Per100g, day_totals, scale_to_grams
from app.domain.training import (
    E1RM_FORMULA_VERSION,
    WorkoutSet,
    estimated_1rm_kg,
    evaluate_records,
    total_volume_kg,
    validate_set,
)
from app.domain.units import CM_PER_IN, KG_PER_LB, cm_to_in, kg_to_lb, lb_to_kg

VECTORS = json.loads(
    (Path(__file__).parents[3] / "contracts" / "vectors" / "domain.json").read_text()
)
TOL = VECTORS["tolerance"]


def _set(s: dict) -> WorkoutSet:
    return WorkoutSet(
        set_type=s["set_type"], load_kg=s.get("load_kg"),
        reps=s.get("reps"), completed=s["completed"],
    )


def test_constants_match_contract():
    assert KG_PER_LB == VECTORS["constants"]["KG_PER_LB"]
    assert CM_PER_IN == VECTORS["constants"]["CM_PER_IN"]
    assert E1RM_FORMULA_VERSION == VECTORS["constants"]["e1rm_formula"]


@pytest.mark.parametrize("case", VECTORS["volume"], ids=lambda c: c["name"])
def test_volume(case):
    assert total_volume_kg(_set(s) for s in case["sets"]) == pytest.approx(
        case["expected_volume_kg"], abs=TOL
    )


@pytest.mark.parametrize("case", VECTORS["e1rm"], ids=lambda c: c["name"])
def test_e1rm(case):
    got = estimated_1rm_kg(case.get("load_kg"), case.get("reps"))
    if case["expected_e1rm_kg"] is None:
        assert got is None
    else:
        assert got == pytest.approx(case["expected_e1rm_kg"], abs=TOL)


def test_personal_records():
    case = VECTORS["personal_records"]
    got = evaluate_records(_set(s) for s in case["sets"])
    exp = case["expected"]
    assert got.max_load_kg == pytest.approx(exp["max_load_kg"], abs=TOL)
    assert got.max_reps == exp["max_reps"]
    assert got.volume_kg == pytest.approx(exp["volume_kg"], abs=TOL)
    assert got.estimated_1rm_kg == pytest.approx(exp["estimated_1rm_kg"], abs=TOL)


@pytest.mark.parametrize("case", VECTORS["units"]["conversions"], ids=lambda c: c["name"])
def test_unit_conversions(case):
    if "expected_lb" in case:
        assert kg_to_lb(case["kg"]) == pytest.approx(case["expected_lb"], abs=TOL)
    if "expected_in" in case:
        assert cm_to_in(case["cm"]) == pytest.approx(case["expected_in"], abs=TOL)


@pytest.mark.parametrize("kg", VECTORS["units"]["roundtrip_kg"])
def test_unit_roundtrip_is_lossless(kg):
    assert abs(lb_to_kg(kg_to_lb(kg)) - kg) < TOL


@pytest.mark.parametrize(
    "case", VECTORS["local_date"], ids=lambda c: f'{c["timezone"]}-{c["expected_local_date"]}'
)
def test_local_date(case):
    assert to_local_date(case["instant"], case["timezone"]) == date.fromisoformat(
        case["expected_local_date"]
    )


@pytest.mark.parametrize("case", VECTORS["set_validity"], ids=lambda c: c["name"])
def test_set_validity(case):
    s = case["set"]
    valid, error = validate_set(
        reps=s.get("reps"), load_kg=s.get("load_kg"),
        duration_seconds=s.get("duration_seconds"), distance_m=s.get("distance_m"),
    )
    assert valid is case["expected_valid"]
    if not case["expected_valid"] and case.get("expected_error"):
        assert error == case["expected_error"]


@pytest.mark.parametrize("case", VECTORS["nutrition_day_totals"], ids=lambda c: c["name"])
def test_nutrition_day_totals(case):
    got = day_totals(
        MealItem(
            calories=i["calories"], protein_g=i["protein_g"],
            carbs_g=i["carbs_g"], fat_g=i["fat_g"], confirmed=i["confirmed"],
        )
        for i in case["items"]
    )
    exp = case["expected"]
    assert got.calories == pytest.approx(exp["calories"], abs=TOL)
    assert got.protein_g == pytest.approx(exp["protein_g"], abs=TOL)
    assert got.carbs_g == pytest.approx(exp["carbs_g"], abs=TOL)
    assert got.fat_g == pytest.approx(exp["fat_g"], abs=TOL)
    assert got.pending_count == exp["pending_count"]
    assert got.incomplete is exp["incomplete"]


@pytest.mark.parametrize("case", VECTORS["adherence"], ids=lambda c: c["note"][:40])
def test_adherence(case):
    assert adherence(case["completed_planned"], case["planned"]) == case["expected"]


@pytest.mark.parametrize(
    "case", VECTORS["planned_occurrences"], ids=lambda c: c["note"][:40]
)
def test_planned_occurrences(case):
    assert planned_occurrences(
        case["weekdays"],
        date.fromisoformat(case["start"]),
        date.fromisoformat(case["end"]),
    ) == case["expected"]


@pytest.mark.parametrize(
    "case", VECTORS["nutrition_scaling"], ids=lambda c: c["note"][:42]
)
def test_nutrition_scaling(case):
    got = scale_to_grams(Per100g(**case["per_100g"]), case["grams"])
    for field, expected in case["expected"].items():
        actual = getattr(got, field)
        if expected is None:
            assert actual is None, f"{field}: unknown must stay unknown"
        else:
            assert actual == pytest.approx(expected, abs=TOL)
