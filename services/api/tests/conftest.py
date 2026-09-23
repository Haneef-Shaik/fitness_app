"""Integration fixtures — a real Postgres, created and dropped per session.

The ephemeral tmpfs container in infra/docker-compose.yml means this is fast and
never leaves state behind between runs.
"""
from __future__ import annotations

import asyncio
import os
from collections.abc import AsyncGenerator
from pathlib import Path

import pytest_asyncio
from alembic.config import Config
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from alembic import command
from app.config import get_settings
from app.db import get_db
from app.main import app
from app.seed.catalog import seed_catalog
from app.seed.foods import seed_foods

settings = get_settings()


@pytest_asyncio.fixture(scope="session")
async def engine():
    """Builds the test schema by RUNNING THE MIGRATIONS, not metadata.create_all.

    This is deliberate: it means every test run proves the migrations actually
    work, so schema drift between the models and the migration chain cannot
    reach production unnoticed (DR1).
    """
    root = Path(__file__).parents[1]
    cfg = Config(str(root / "alembic.ini"))
    cfg.set_main_option("script_location", str(root / "alembic"))
    os.environ["ALEMBIC_DATABASE_URL"] = settings.test_database_url

    # Start from a genuinely empty schema. Dropping tables is not enough:
    # Postgres ENUM types survive DROP TABLE, and any state left by an earlier
    # create_all run would collide with the migration.
    reset = create_async_engine(settings.test_database_url, isolation_level="AUTOCOMMIT")
    async with reset.connect() as conn:
        await conn.execute(text("DROP SCHEMA public CASCADE"))
        await conn.execute(text("CREATE SCHEMA public"))
    await reset.dispose()

    # Alembic's async env calls asyncio.run(), which cannot run inside the
    # pytest event loop — so drive it on a worker thread.
    await asyncio.to_thread(command.upgrade, cfg, "head")

    eng = create_async_engine(settings.test_database_url, future=True)

    # The global catalog is part of the schema contract, not test data: every
    # environment is expected to have it.
    maker = async_sessionmaker(eng, class_=AsyncSession, expire_on_commit=False)
    async with maker() as db:
        await seed_catalog(db)
        await seed_foods(db)
        await db.commit()

    yield eng
    await eng.dispose()


@pytest_asyncio.fixture
async def db(engine) -> AsyncGenerator[AsyncSession, None]:
    maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with maker() as session:
        yield session


@pytest_asyncio.fixture
async def client(engine) -> AsyncGenerator[AsyncClient, None]:
    maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async def _override() -> AsyncGenerator[AsyncSession, None]:
        async with maker() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise

    app.dependency_overrides[get_db] = _override
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac
    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def auth_client(client: AsyncClient) -> AsyncClient:
    """A client already registered and carrying a bearer token."""
    import uuid as _uuid

    email = f"user-{_uuid.uuid4().hex[:10]}@example.com"
    r = await client.post(
        "/v1/auth/register", json={"email": email, "password": "correct-horse-battery"}
    )
    assert r.status_code == 201, r.text
    client.headers["authorization"] = f"Bearer {r.json()['data']['access_token']}"
    return client
