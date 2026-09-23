"""A small internal food catalog.

This is what makes **Q1 non-blocking**: the app resolves foods without any
provider, so the resolver interface can be built, used and tested before anyone
decides which database to license.

Deliberately small and unglamorous. It is not trying to be a nutrition database
— it is trying to prove the seam works and give a new account something to log.
Figures are per 100 g, rounded as printed on a label; they are not a claim to
laboratory accuracy, which is precisely why a real provider is still owed.

Idempotent, the same way `catalog.py` is: re-running adds nothing.
"""
from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Food, FoodSource

SEED_VERSION = 1

# name, brand, kcal, protein, carbs, fat, fiber, serving_g, serving_label
FOODS: list[tuple[str, str | None, float, float, float, float, float | None, float | None, str | None]] = [
    ("Chicken Breast, skinless", None, 165, 31.0, 0.0, 3.6, 0.0, 120, "1 breast"),
    ("Whole Egg", None, 143, 12.6, 0.7, 9.5, 0.0, 50, "1 egg"),
    ("Greek Yogurt, plain 0%", None, 59, 10.0, 3.6, 0.4, 0.0, 170, "1 pot"),
    ("Rolled Oats", None, 389, 16.9, 66.3, 6.9, 10.6, 40, "1 serving"),
    ("White Rice, cooked", None, 130, 2.7, 28.2, 0.3, 0.4, 150, "1 cup"),
    ("Brown Rice, cooked", None, 123, 2.7, 25.6, 1.0, 1.6, 150, "1 cup"),
    ("Roti / Chapati", None, 297, 11.0, 46.0, 7.5, 4.9, 40, "1 roti"),
    ("Whole Wheat Bread", None, 247, 13.0, 41.0, 3.4, 7.0, 32, "1 slice"),
    ("Banana", None, 89, 1.1, 22.8, 0.3, 2.6, 118, "1 medium"),
    ("Apple", None, 52, 0.3, 13.8, 0.2, 2.4, 182, "1 medium"),
    ("Almonds", None, 579, 21.2, 21.6, 49.9, 12.5, 28, "1 handful"),
    ("Peanut Butter", None, 588, 25.1, 20.0, 50.4, 6.0, 32, "2 tbsp"),
    ("Olive Oil", None, 884, 0.0, 0.0, 100.0, 0.0, 14, "1 tbsp"),
    ("Whole Milk", None, 61, 3.2, 4.8, 3.3, 0.0, 244, "1 cup"),
    ("Paneer", None, 265, 18.3, 1.2, 20.8, 0.0, 100, "1 serving"),
    ("Red Lentils, cooked", None, 116, 9.0, 20.1, 0.4, 7.9, 200, "1 bowl"),
    ("Chickpeas, cooked", None, 164, 8.9, 27.4, 2.6, 7.6, 160, "1 cup"),
    ("Salmon, cooked", None, 208, 20.4, 0.0, 13.4, 0.0, 150, "1 fillet"),
    ("Broccoli, cooked", None, 35, 2.4, 7.2, 0.4, 3.3, 90, "1 serving"),
    ("Potato, boiled", None, 87, 1.9, 20.1, 0.1, 1.8, 170, "1 medium"),
    ("Whey Protein Isolate", None, 370, 85.0, 5.0, 2.0, 0.0, 30, "1 scoop"),
    ("Dark Chocolate 70%", None, 598, 7.8, 45.9, 42.6, 10.9, 20, "2 squares"),
]


async def seed_foods(db: AsyncSession) -> dict[str, int]:
    """Idempotent. Returns how many rows were ADDED, so a caller can assert 0."""
    existing = set((await db.scalars(
        select(Food.name).where(Food.owner_user_id.is_(None))
    )).all())

    added = 0
    for name, brand, kcal, protein, carbs, fat, fiber, serving_g, serving_label in FOODS:
        if name in existing:
            continue
        db.add(Food(
            owner_user_id=None,
            name=name,
            brand=brand,
            calories=kcal,
            protein_g=protein,
            carbs_g=carbs,
            fat_g=fat,
            fiber_g=fiber,
            serving_grams=serving_g,
            serving_label=serving_label,
            source=FoodSource.internal,
        ))
        added += 1

    await db.flush()
    return {"foods": added}
