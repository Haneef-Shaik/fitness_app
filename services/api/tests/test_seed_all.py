"""Global reference data must reach a REAL database, not only a test one.

G10 found this the expensive way: `seed_foods` existed, was idempotent, was
covered by its own tests — and was called by nothing but `conftest`. Every
suite passed. On the phone, "Add food" said *Nothing matches* for every query
in the catalog, because no deployment had ever run it.

The bug was not in the seeder. It was that adding a seeder and wiring it up are
two separate acts, and only one of them is enforced. So this file enforces the
other: whatever `app.seed` exposes, `seed_all` runs.
"""
from __future__ import annotations

import importlib
import inspect
import pkgutil

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

import app.seed
from app.models import Food
from app.seed import seed_all


def _declared_seeders() -> set[str]:
    """Every `seed_*` coroutine in every module of `app.seed`."""
    found: set[str] = set()
    for info in pkgutil.iter_modules(app.seed.__path__):
        module = importlib.import_module(f"app.seed.{info.name}")
        for name, obj in vars(module).items():
            if name.startswith("seed_") and inspect.iscoroutinefunction(obj):
                found.add(name)
    return found


def test_seed_all_runs_every_seeder_the_package_declares():
    """The guard that was missing. Add `seed_supplements` tomorrow and forget to
    wire it, and this fails — before a user finds an empty screen."""
    declared = _declared_seeders()
    assert declared, "no seeders discovered — the discovery itself is broken"

    source = inspect.getsource(seed_all)
    missing = {name for name in declared if f"{name}(" not in source}
    assert not missing, f"declared but never run by seed_all: {sorted(missing)}"


async def test_seed_all_is_idempotent(engine):
    """The session fixture already seeded. Re-running must add nothing, which is
    what makes it safe to run on every deploy."""
    maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    for _ in range(2):
        async with maker() as db:
            added = await seed_all(db)
            await db.commit()
            assert not any(added.values()), added


async def test_seed_all_leaves_a_catalog_anyone_can_search(engine):
    """The symptom, asserted directly: a fresh account can find a staple food."""
    maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with maker() as db:
        await seed_all(db)
        await db.commit()
        oats = await db.scalar(
            select(Food).where(Food.owner_user_id.is_(None), Food.name == "Rolled Oats")
        )
    assert oats is not None
    assert oats.calories == 389
