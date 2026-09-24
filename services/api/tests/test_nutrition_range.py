"""H-14 · nutrition over a range (N05.3–N05.5), pure.

The rules the wireframe insists on, each pinned:
  - unlogged days are EXCLUDED from averages, and the logged count is reported
    beside every average — otherwise three logged days in a week report a
    meaningless "average";
  - fewer than 3 logged days is "not enough data", not a noisy chart;
  - a day with incomplete macro data counts for calories but is flagged;
  - training vs rest days splits the logged days by whether a session was done.
"""
from __future__ import annotations

from datetime import date, timedelta

from app.domain.nutrition_range import Day, summarise

D0 = date(2026, 9, 1)


def day(i: int, kcal: float = 0, protein: float = 0, carbs: float = 0, fat: float = 0, *,
        meals: int | None = None, sessions: int = 0, incomplete: bool = False,
        weight: float | None = None) -> Day:
    return Day(
        local_date=D0 + timedelta(days=i), calories=kcal, protein_g=protein, carbs_g=carbs, fat_g=fat,
        meals_logged=(1 if kcal else 0) if meals is None else meals,
        session_count=sessions, incomplete=incomplete, body_weight_kg=weight,
    )


def test_averages_use_only_the_days_that_were_logged():
    s = summarise([day(0, 2000, 150), day(1), day(2, 2400, 170), day(3, 2200, 160)], target_kcal=2300)
    assert s.days == 4
    assert s.logged_days == 3
    assert s.averages.calories == 2200
    assert s.averages.protein_g == 160


def test_a_day_with_only_unconfirmed_items_is_not_a_logged_day():
    # Pending AI items are meals, but they are not intake (D5).
    s = summarise([day(0, 0, meals=2), day(1, 2000), day(2, 2100), day(3, 2200)], target_kcal=None)
    assert s.logged_days == 3


def test_fewer_than_three_logged_days_is_not_enough_data():
    s = summarise([day(0, 2000), day(1, 2100), day(2)], target_kcal=2000)
    assert s.enough_data is False
    assert summarise([day(0, 2000), day(1, 2100), day(2, 1900)], target_kcal=2000).enough_data is True


def test_within_target_counts_logged_days_inside_ten_percent():
    s = summarise([day(0, 2000), day(1, 2190), day(2, 2250), day(3, 1790), day(4)], target_kcal=2000)
    # 2000 and 2190 are within ±200; 2250 and 1790 are not; day 4 was not logged.
    assert s.within_target_days == 2


def test_without_a_target_there_is_no_adherence_to_report():
    assert summarise([day(0, 2000)], target_kcal=None).within_target_days is None


def test_the_macro_split_is_by_energy_not_by_grams():
    # 150 g protein = 600 kcal, 200 g carbs = 800 kcal, 67 g fat ≈ 600 kcal.
    s = summarise([day(i, 2000, 150, 200, 66.67) for i in range(3)], target_kcal=None)
    assert s.macro_split == {"protein": 30, "carbs": 40, "fat": 30}


def test_incomplete_days_are_counted_and_flagged():
    s = summarise([day(0, 2000, incomplete=True), day(1, 2000), day(2, 2000)], target_kcal=None)
    assert s.incomplete_days == 1
    assert s.averages.calories == 2000


def test_training_and_rest_days_are_compared_on_logged_days_only():
    s = summarise([
        day(0, 2400, 180, sessions=1), day(1, 2600, 190, sessions=2),
        day(2, 2000, 140), day(3, sessions=1),    # trained but nothing logged: not in either
    ], target_kcal=None)
    assert (s.training.days, s.training.calories, s.training.protein_g) == (2, 2500, 185)
    assert (s.rest.days, s.rest.calories) == (1, 2000)


def test_no_logged_days_means_no_averages_rather_than_zeros():
    s = summarise([day(0), day(1)], target_kcal=2000)
    assert s.averages is None
    assert s.macro_split is None
    assert s.training is None and s.rest is None


def test_every_day_of_the_range_is_listed_and_an_unlogged_day_is_null_not_zero():
    s = summarise([day(0, 2000, weight=80.2), day(1)], target_kcal=None)
    assert [d.calories for d in s.daily] == [2000, None]
    assert s.daily[0].body_weight_kg == 80.2
