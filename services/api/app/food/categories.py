"""Meal categories (H-16) — seeding and validation.

Categories are seeded **lazily**, on first read or first write, rather than at
registration. Registration already exists and has its own migration history;
hanging a second side effect off it would mean every account created before G7
silently has no categories and no way to get them. Seeding where they are first
needed makes the four defaults true for every account, old or new.
"""
from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import ValidationFailed
from app.models import DEFAULT_MEAL_CATEGORIES, MealCategory


async def ensure_categories(db: AsyncSession, user_id: uuid.UUID) -> list[MealCategory]:
    """The user's categories, seeding the defaults exactly once."""
    existing = list((await db.scalars(
        select(MealCategory)
        .where(MealCategory.user_id == user_id)
        .order_by(MealCategory.sort_order, MealCategory.slug)
    )).all())
    if existing:
        return existing

    for order, (slug, name) in enumerate(DEFAULT_MEAL_CATEGORIES):
        db.add(MealCategory(
            user_id=user_id, slug=slug, name=name,
            sort_order=order, is_default=True, hidden=False,
        ))
    await db.flush()
    return list((await db.scalars(
        select(MealCategory)
        .where(MealCategory.user_id == user_id)
        .order_by(MealCategory.sort_order)
    )).all())


async def assert_category(db: AsyncSession, user_id: uuid.UUID, slug: str) -> MealCategory:
    """The slug a meal is being filed under must be one of this user's own.

    A hidden category still passes: hidden means "stop offering it", not "reject
    it". Copying a week that contains a hidden category has to keep working.
    """
    categories = await ensure_categories(db, user_id)
    for category in categories:
        if category.slug == slug:
            return category
    raise ValidationFailed(
        "That meal category does not exist.", fields={"meal_type": slug},
    )
