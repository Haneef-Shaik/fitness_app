"""H-14 · nutrition over a range of days (N05.3–N05.5), pure.

Built from `daily_summaries` rows, which came from `day_totals` — so "what
counts" (confirmed items only, I2/D5) still has one home. This module only
aggregates days.

The wireframe's rules, each one a line here:

**Unlogged days are excluded from averages**, and the number of logged days is
reported with them. A week with three logged days averaged over seven reads as
a crash diet.

**Fewer than three logged days is not enough data** — the screen says so rather
than drawing a noisy chart.

**A day with incomplete macro data counts for calories and is flagged**, never
silently mixed in as if its unknown macros were zero.

**Each day is judged against its own target** (Q8): a target changed on
Friday does not turn Tuesday into a miss.

**Training vs rest days** splits the logged days by whether a session was
completed that day (BRD §22).
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import date

#: Below this, a range is "not enough data yet" (H-14 edge cases).
MIN_LOGGED_DAYS = 3
#: "Within target" is ±10% of the calorie target (H-14 wireframe).
TARGET_BAND = 0.10


@dataclass(frozen=True, slots=True)
class Day:
    local_date: date
    calories: float
    protein_g: float
    carbs_g: float
    fat_g: float
    meals_logged: int
    session_count: int
    incomplete: bool
    body_weight_kg: float | None
    #: The calorie target in force that day (Q8), when targets are versioned.
    target_kcal: float | None = None


@dataclass(frozen=True, slots=True)
class Averages:
    calories: float
    protein_g: float
    carbs_g: float
    fat_g: float


@dataclass(frozen=True, slots=True)
class Split:
    days: int
    calories: float
    protein_g: float


@dataclass(frozen=True, slots=True)
class DailyPoint:
    local_date: date
    #: None when nothing confirmed was logged — not 0, which would read as a fast.
    calories: float | None
    protein_g: float | None
    trained: bool
    body_weight_kg: float | None


@dataclass(frozen=True, slots=True)
class RangeSummary:
    days: int
    logged_days: int
    enough_data: bool
    averages: Averages | None
    macro_split: dict[str, int] | None
    target_kcal: float | None
    within_target_days: int | None
    incomplete_days: int
    training: Split | None
    rest: Split | None
    daily: list[DailyPoint]


def is_logged(d: Day) -> bool:
    """A day with confirmed intake. Pending AI items are meals but not intake (D5)."""
    return d.meals_logged > 0 and (d.calories > 0 or d.protein_g > 0 or d.carbs_g > 0 or d.fat_g > 0)


def _mean(values: list[float]) -> float:
    return round(sum(values) / len(values), 1)


def _averages(days: list[Day]) -> Averages | None:
    if not days:
        return None
    return Averages(
        calories=_mean([d.calories for d in days]),
        protein_g=_mean([d.protein_g for d in days]),
        carbs_g=_mean([d.carbs_g for d in days]),
        fat_g=_mean([d.fat_g for d in days]),
    )


def _split(days: list[Day]) -> Split | None:
    if not days:
        return None
    return Split(days=len(days), calories=_mean([d.calories for d in days]),
                 protein_g=_mean([d.protein_g for d in days]))


def macro_split(avg: Averages) -> dict[str, int] | None:
    """Shares of energy, not of grams: 4 / 4 / 9 kcal per gram."""
    kcal = {"protein": avg.protein_g * 4, "carbs": avg.carbs_g * 4, "fat": avg.fat_g * 9}
    total = sum(kcal.values())
    if total <= 0:
        return None
    return {k: round(v * 100 / total) for k, v in kcal.items()}


def summarise(days: list[Day], target_kcal: float | None) -> RangeSummary:
    logged = [d for d in days if is_logged(d)]
    avg = _averages(logged)
    within = None
    if target_kcal or any(d.target_kcal for d in logged):
        # Each day against the target it had (Q8); a day with none, against the range's.
        def near(d: Day) -> bool:
            t = d.target_kcal or target_kcal
            return bool(t) and abs(d.calories - t) <= t * TARGET_BAND
        within = sum(1 for d in logged if near(d))
    return RangeSummary(
        days=len(days),
        logged_days=len(logged),
        enough_data=len(logged) >= MIN_LOGGED_DAYS,
        averages=avg,
        macro_split=macro_split(avg) if avg else None,
        target_kcal=target_kcal,
        within_target_days=within,
        incomplete_days=sum(1 for d in logged if d.incomplete),
        training=_split([d for d in logged if d.session_count > 0]) if logged else None,
        rest=_split([d for d in logged if d.session_count == 0]) if logged else None,
        daily=[
            DailyPoint(
                local_date=d.local_date,
                calories=d.calories if is_logged(d) else None,
                protein_g=d.protein_g if is_logged(d) else None,
                trained=d.session_count > 0,
                body_weight_kg=d.body_weight_kg,
            )
            for d in days
        ],
    )
