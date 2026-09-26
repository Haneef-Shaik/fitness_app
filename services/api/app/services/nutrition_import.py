"""Writing a MyFitnessPal export into the diary (launch plan, phase 6).

Each MFP meal becomes one meal with one entry holding its totals. Idempotent:
the meal's `client_id` is derived from (user, day, MFP meal name), so the same
export twice adds nothing, and the unique `(user_id, client_id)` enforces it.
"""
from __future__ import annotations

import uuid
from datetime import datetime, time
from zoneinfo import ZoneInfo

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.imports.nutrition_csv import NutritionParse
from app.models import ItemSource, Meal, MealItem, UserProfile
from app.services import summaries

_NAMESPACE = uuid.UUID("5f0c3d2e-8a41-4b7e-9d1c-6a2b3c4d5e6f")
#: When in the day each meal is placed — MFP does not say.
_AT = {"breakfast": time(8), "lunch": time(13), "snack": time(16), "dinner": time(19)}


def _client_id(user_id: uuid.UUID, day, source_name: str) -> uuid.UUID:
    return uuid.uuid5(_NAMESPACE, f"mfp|{user_id}|{day.isoformat()}|{source_name.lower()}")


async def import_nutrition(
    db: AsyncSession, user_id: uuid.UUID, parsed: NutritionParse, *, dry_run: bool = False,
) -> dict:
    profile = await db.scalar(select(UserProfile).where(UserProfile.user_id == user_id))
    tz = profile.timezone if profile else "UTC"

    ids = {_client_id(user_id, m.day, m.source_name): m for m in parsed.meals}
    existing = set((await db.scalars(
        select(Meal.client_id).where(Meal.user_id == user_id, Meal.client_id.in_(list(ids)))
    )).all()) if ids else set()
    new = {cid: m for cid, m in ids.items() if cid not in existing}
    days = sorted({m.day for m in new.values()})

    report = {
        "format": "myfitnesspal",
        "meals_found": len(parsed.meals),
        "meals_new": len(new),
        "meals_already_imported": len(ids) - len(new),
        "first_day": days[0].isoformat() if days else None,
        "last_day": days[-1].isoformat() if days else None,
        "skipped_rows": parsed.skipped_rows,
        "dry_run": dry_run,
    }
    if dry_run or not new:
        return report

    zone = ZoneInfo(tz)
    rows: list = []
    for cid, m in new.items():
        at = datetime.combine(m.day, _AT.get(m.meal_type, time(12)), tzinfo=zone)
        meal = Meal(
            id=uuid.uuid4(), user_id=user_id, meal_type=m.meal_type, consumed_at=at,
            local_date=m.day, logged_timezone=tz, client_id=cid,
            notes="Imported from MyFitnessPal",
        )
        rows.append(meal)
        rows.append(MealItem(
            meal_id=meal.id, food_id=None,
            display_name=f"{m.source_name} — from MyFitnessPal"[:160],
            calories=m.calories, protein_g=m.protein_g, carbs_g=m.carbs_g,
            fat_g=m.fat_g, fiber_g=m.fiber_g,
            confirmed=True, user_corrected=False, source=ItemSource.manual,
        ))
    # One flush for the lot: a flush per meal held a connection for minutes on
    # a long export (G11 security review).
    db.add_all(rows)
    await db.flush()
    await summaries.invalidate_all(db, user_id)
    return report
