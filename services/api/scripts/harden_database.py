"""Revoke Supabase's Data API roles from FitLog's tables.  uv run python scripts/harden_database.py

Run by `scripts/migrate.sh` on every release, after the migrations. Idempotent,
and a no-op on a database without Supabase's roles. Why: `app/db_hardening.py`.
"""
from __future__ import annotations

import asyncio
import sys
from pathlib import Path

# Run directly (`uv run python scripts/harden_database.py`) as well as via -m.
sys.path.insert(0, str(Path(__file__).parents[1]))

from app.config import Settings
from app.db_engine import build_engine
from app.db_hardening import SUPABASE_API_ROLES, revoke_data_api_grants


async def main() -> int:
    # DATABASE_URL and nothing else, like the migrations (docs/12 §5).
    engine = build_engine(Settings(), pooled=False)
    try:
        async with engine.begin() as conn:
            revoked = await revoke_data_api_grants(conn)
    finally:
        await engine.dispose()
    if revoked:
        print(f"Data API roles revoked from public: {', '.join(revoked)}")
    else:
        print(f"no Data API roles here ({', '.join(SUPABASE_API_ROLES)}): nothing to revoke")
    return 0


sys.exit(asyncio.run(main()))
