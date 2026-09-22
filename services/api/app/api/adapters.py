"""ORM row -> domain value.

`load_kg` and `distance_m` are `Numeric`, so SQLAlchemy hands back `Decimal`.
The domain functions work in `float`, and mixing the two raises
`unsupported operand type(s) for +: 'float' and 'decimal.Decimal'` somewhere
deep inside a sum — a long way from the route that caused it.

This lives here rather than inside a route module because more than one route
now feeds the domain: sessions, and G5's comparison. Two copies of the coercion
would be two chances to drift on which fields are converted.
"""
from __future__ import annotations

from app.domain import training as domain_training
from app.models import WorkoutSet


def enum_value(v) -> str:
    """SQLAlchemy keeps a plain string until the row is refreshed, so accept both."""
    return v.value if hasattr(v, "value") else str(v)


def num(v) -> float | None:
    return float(v) if v is not None else None


def domain_set(s: WorkoutSet) -> domain_training.WorkoutSet:
    """The ORM row as the domain sees it. Canonical units only."""
    return domain_training.WorkoutSet(
        set_type=enum_value(s.set_type),
        load_kg=num(s.load_kg),
        reps=s.reps,
        completed=s.completed,
        duration_seconds=s.duration_seconds,
        distance_m=num(s.distance_m),
    )
