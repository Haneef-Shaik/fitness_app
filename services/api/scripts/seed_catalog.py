"""Seed all global reference data.  uv run python scripts/seed_catalog.py

Named for the exercise catalog it started as; it now seeds everything in
`app.seed`, which is what `seed_all` is for.
"""
from __future__ import annotations

import asyncio
import sys
from pathlib import Path

# Run directly (`uv run python scripts/seed_catalog.py`) as well as via -m.
sys.path.insert(0, str(Path(__file__).parents[1]))

from app.db import SessionLocal
from app.seed import seed_all
from app.seed.catalog import SEED_VERSION


async def main() -> int:
    async with SessionLocal() as db:
        result = await seed_all(db)
        await db.commit()
    print(f"reference data seed v{SEED_VERSION}")
    for kind, added in sorted(result.items()):
        print(f"  {kind + ' added:':22} {added}")
    return 0


sys.exit(asyncio.run(main()))
