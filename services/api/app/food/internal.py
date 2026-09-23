"""The internal-catalog resolver — the implementation that works standalone.

Reads the `foods` table, which `app/seed/foods.py` seeds. No network, no
provider, no Q1 dependency. When Q1 is answered, a provider resolver sits beside
this one and the code above neither knows nor cares.

Scoping matches the exercise catalog: a user sees the global rows plus their own,
never anyone else's.
"""
from __future__ import annotations

import uuid

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.food.resolver import Candidate, FoodRef
from app.models import Food


def _as_candidate(food: Food) -> Candidate:
    return Candidate(
        ref=FoodRef(id=food.id, source="internal"),
        name=food.name,
        brand=food.brand,
        calories=float(food.calories) if food.calories is not None else None,
        protein_g=float(food.protein_g) if food.protein_g is not None else None,
        carbs_g=float(food.carbs_g) if food.carbs_g is not None else None,
        fat_g=float(food.fat_g) if food.fat_g is not None else None,
        serving_grams=float(food.serving_grams) if food.serving_grams is not None else None,
        serving_label=food.serving_label,
    )


class InternalCatalogResolver:
    """Satisfies `FoodResolver` structurally — no inheritance needed."""

    def __init__(self, db: AsyncSession, user_id: uuid.UUID) -> None:
        self._db = db
        self._user_id = user_id

    def _visible(self):
        return select(Food).where(
            or_(Food.owner_user_id.is_(None), Food.owner_user_id == self._user_id),
            Food.archived.is_(False),
        )

    async def search(self, query: str, *, limit: int = 20) -> list[Candidate]:
        stmt = self._visible()
        if query:
            stmt = stmt.where(Food.name.ilike(f"%{query.lower()}%"))
        rows = (await self._db.scalars(stmt.order_by(Food.name).limit(limit))).all()
        return [_as_candidate(f) for f in rows]

    async def resolve(self, ref: FoodRef) -> Candidate | None:
        if ref.id is None:
            return None
        food = await self._db.scalar(self._visible().where(Food.id == ref.id))
        return _as_candidate(food) if food is not None else None
