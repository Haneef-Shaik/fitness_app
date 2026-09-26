"""How much of an ordinary diary does the resolver actually resolve?

    uv run python scripts/measure_food_resolution.py            # DATABASE_URL
    DATABASE_URL=postgresql+asyncpg://…/other uv run python scripts/measure_food_resolution.py

Runs every phrase in `app.food.benchmark.MEAL_PHRASES` through the SAME ladder
the analysis worker uses, against whatever catalog the database holds, and
prints two numbers: how many resolved at all, and how many resolved to the
right food. The second is the one that matters (a wrong match is worse than
none — 02 §5.2), the first is what the `food_resolution` metric sees.

Read-only: it searches as a user who owns nothing, so only the global catalog
is visible, and it never writes.
"""
from __future__ import annotations

import asyncio
import sys
import uuid
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parents[1]))

from sqlalchemy import select

from app.db import SessionLocal
from app.food.benchmark import MEAL_PHRASES, is_correct
from app.food.internal import InternalCatalogResolver
from app.food.ladder import resolve_detected_name
from app.models import Food


async def main() -> int:
    nobody = uuid.uuid4()
    resolved = correct = 0
    async with SessionLocal() as db:
        resolver = InternalCatalogResolver(db, nobody)
        for phrase, expected in MEAL_PHRASES:
            food_id = await resolve_detected_name(resolver, phrase)
            name = None
            if food_id is not None:
                name = await db.scalar(select(Food.name).where(Food.id == food_id))
                resolved += 1
            ok = is_correct(name, expected)
            correct += ok
            mark = "ok " if ok else ("BAD" if name else " - ")
            print(f"  {mark} {phrase:32} -> {name or 'unresolved'}")

    total = len(MEAL_PHRASES)
    print(f"\nresolved {resolved}/{total} · correct {correct}/{total}")
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
