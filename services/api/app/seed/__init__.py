"""Global reference data: the rows every deployment needs and no user owns.

One entry point, deliberately. A seeder that is not called from `seed_all` is
a seeder that only ever runs in tests — which is exactly how G10 shipped an
empty food catalog to a phone with a green suite behind it.
`tests/test_seed_all.py` enforces the rule.
"""
from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.seed.catalog import seed_catalog
from app.seed.foods import seed_foods

__all__ = ["seed_all"]


async def seed_all(db: AsyncSession) -> dict[str, int]:
    """Every global seeder, in one call. Idempotent: re-running adds nothing,
    so it is safe on every deploy. Returns rows ADDED, per kind."""
    return {**await seed_catalog(db), **await seed_foods(db)}
