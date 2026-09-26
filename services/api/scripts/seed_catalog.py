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

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.config import Settings
from app.db_engine import build_engine
from app.seed import seed_all
from app.seed.catalog import SEED_VERSION


async def main() -> int:
    # Settings(), not get_settings(): like a migration, seeding needs the
    # database and nothing else, so the release job carries only DATABASE_URL
    # (docs/12 §5). The engine is the API's, TLS rule included.
    engine = build_engine(Settings(), pooled=False)
    try:
        async with async_sessionmaker(engine, class_=AsyncSession)() as db:
            result = await seed_all(db)
            await db.commit()
    finally:
        await engine.dispose()
    print(f"reference data seed v{SEED_VERSION}")
    for kind, added in sorted(result.items()):
        print(f"  {kind + ' added:':22} {added}")
    return 0


sys.exit(asyncio.run(main()))
