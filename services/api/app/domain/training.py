"""Derived training metrics — the authoritative implementation.

The TypeScript mirror in packages/domain computes these locally so the logger works
offline. Both are pinned by contracts/vectors/domain.json; see docs/02 §3.1.
"""
from __future__ import annotations

from collections.abc import Iterable
from dataclasses import dataclass
from typing import Literal

SetType = Literal["warmup", "working", "drop", "failure"]

E1RM_FORMULA_VERSION = "epley_v1"


@dataclass(frozen=True, slots=True)
class WorkoutSet:
    """Canonical units only: kg, seconds, metres."""
    set_type: SetType
    load_kg: float | None
    reps: int | None
    completed: bool
    duration_seconds: int | None = None
    distance_m: float | None = None


@dataclass(frozen=True, slots=True)
class PersonalRecords:
    max_load_kg: float | None
    max_reps: int | None
    volume_kg: float
    estimated_1rm_kg: float | None


def set_volume_kg(s: WorkoutSet, *, include_warmups: bool = False) -> float:
    """load × reps. Completed sets only; warm-ups only when the user counts them
    (BRD §10, decision D6 — excluded by default, toggled in K-04)."""
    if not s.completed:
        return 0.0
    if s.set_type == "warmup" and not include_warmups:
        return 0.0
    if s.load_kg is None or s.reps is None:
        return 0.0
    return s.load_kg * s.reps


def total_volume_kg(sets: Iterable[WorkoutSet], *, include_warmups: bool = False) -> float:
    return sum(set_volume_kg(s, include_warmups=include_warmups) for s in sets)


def counts_toward_volume(s: WorkoutSet, *, include_warmups: bool = False) -> bool:
    """Whether a set is one of the sets a volume figure is made of."""
    return s.completed and (include_warmups or s.set_type != "warmup")


def weighted_volume_kg(
    volume_kg: float, role: Literal["primary", "secondary"], secondary_weight: float = 0.5
) -> float:
    """Muscle-group weighting: primary 1.0, secondary 0.5 (decision D7)."""
    return volume_kg * (1.0 if role == "primary" else secondary_weight)


def estimated_1rm_kg(load_kg: float | None, reps: int | None) -> float | None:
    """Epley: load × (1 + reps/30). Store the value WITH E1RM_FORMULA_VERSION."""
    if load_kg is None or reps is None or reps < 1:
        return None
    return load_kg * (1 + reps / 30)


def is_pr_eligible(s: WorkoutSet) -> bool:
    """Warm-ups and drop sets are not clean PR attempts."""
    return s.completed and s.set_type in ("working", "failure")


def evaluate_records(sets: Iterable[WorkoutSet]) -> PersonalRecords:
    eligible = [s for s in sets if is_pr_eligible(s)]
    loads = [s.load_kg for s in eligible if s.load_kg is not None]
    reps = [s.reps for s in eligible if s.reps is not None]
    e1rms = [v for v in (estimated_1rm_kg(s.load_kg, s.reps) for s in eligible) if v is not None]
    return PersonalRecords(
        max_load_kg=max(loads) if loads else None,
        max_reps=max(reps) if reps else None,
        volume_kg=sum(set_volume_kg(s) for s in eligible),
        estimated_1rm_kg=max(e1rms) if e1rms else None,
    )


def validate_set(
    reps: int | None = None,
    load_kg: float | None = None,
    duration_seconds: int | None = None,
    distance_m: float | None = None,
) -> tuple[bool, str | None]:
    """W04.7 — load alone is not a set."""
    if reps is not None and (not isinstance(reps, int) or reps < 1):
        return False, "Reps must be a whole number of at least 1."
    if load_kg is not None and load_kg < 0:
        return False, "Load cannot be negative."
    if reps is None and duration_seconds is None and distance_m is None:
        return False, "Add reps, time or distance to save this set."
    return True, None
