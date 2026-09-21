"""Seed the global catalog.  uv run python scripts/seed_catalog.py"""
from __future__ import annotations

import asyncio
import sys
from pathlib import Path

# Run directly (`uv run python scripts/seed_catalog.py`) as well as via -m.
sys.path.insert(0, str(Path(__file__).parents[1]))

from app.db import SessionLocal
from app.seed.catalog import SEED_VERSION, seed_catalog


async def main() -> int:
    async with SessionLocal() as db:
        result = await seed_catalog(db)
        await db.commit()
    print(f"catalog seed v{SEED_VERSION}")
    print(f"  muscle groups added: {result['muscle_groups']}")
    print(f"  exercises added:     {result['exercises']}")
    return 0


sys.exit(asyncio.run(main()))
