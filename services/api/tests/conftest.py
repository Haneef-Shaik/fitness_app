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


# ------------------------------------------------------------ AI (G8)
#
# Nothing in the suite reaches a model. The gateway is the stub, and every test
# that needs a particular outcome sets it on the stub rather than mocking a
# transport — so the parser, the worker, the resolver and the persistence path
# are all genuinely exercised.


@pytest_asyncio.fixture
async def gateway():
    """The one gateway instance the worker and the API share for a test."""
    from app.ai.stub import StubGateway

    stub = StubGateway()
    yield stub
    stub.reset()


@pytest_asyncio.fixture
async def storage(tmp_path, monkeypatch):
    """A local object store under pytest's own tmp_path.

    `get_store` is lru_cached, so the cache is cleared around the test rather
    than left holding a directory that no longer exists.
    """
    from app.storage import provider
    from app.storage.local import LocalObjectStore

    store = LocalObjectStore(tmp_path / "uploads")
    # Hold the real function so the cache can be cleared afterwards —
    # `monkeypatch.setattr` replaces the attribute, lru_cache and all.
    original = provider.get_store
    original.cache_clear()
    monkeypatch.setattr(provider, "get_store", lambda: store)

    # Route modules import `get_store` BY NAME, so patching the provider alone
    # leaves each module holding the real one. Every importer is patched here,
    # and the loop means adding a route that stores a file cannot silently miss
    # the fixture — which is exactly how G9's photo tests first failed.
    import importlib

    for module_name in (
        "app.api.routes.food_analysis",
        "app.api.routes.uploads",
        "app.api.routes.body",
    ):
        module = importlib.import_module(module_name)
        assert hasattr(module, "get_store"), f"{module_name} no longer imports get_store"
        monkeypatch.setattr(module, "get_store", lambda: store)

    yield store
    original.cache_clear()


@pytest_asyncio.fixture
async def worker(engine, gateway, storage):
    """A worker driven one job at a time.

    Deliberately NOT a background process in the suite: `await worker.run_once()`
    makes "the job has been processed" an explicit line in the test rather than
    a sleep that is flaky on a loaded machine. The class under test is the same
    one `python -m app.worker` runs.
    """
    from app.worker.runner import AnalysisWorker

    maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    return AnalysisWorker(maker, gateway=gateway, store=storage)


@pytest_asyncio.fixture
async def quota(monkeypatch):
    """Lets a test lower the daily cap without a 25-request warm-up."""
    from app.config import get_settings as _get_settings

    settings_obj = _get_settings()
    original = settings_obj.ai_daily_quota

    class _Quota:
        @property
        def limit(self) -> int:
            return settings_obj.ai_daily_quota

        @limit.setter
        def limit(self, value: int) -> None:
            object.__setattr__(settings_obj, "ai_daily_quota", value)

    yield _Quota()
    object.__setattr__(settings_obj, "ai_daily_quota", original)


@pytest_asyncio.fixture
async def uploaded_image(auth_client, storage) -> str:
    """A signed upload, actually performed, so the key really exists."""
    signed = (await auth_client.post("/v1/uploads/sign", json={
        "content_type": "image/jpeg", "byte_size": 4096,
    })).json()["data"]

    jpeg = b"\xff\xd8" + b"\xff\xdb\x00\x43" + bytes(65) + b"\xff\xd9"
    put = await auth_client.put(signed["upload_url"], content=jpeg,
                                headers={"content-type": "image/jpeg"})
    assert put.status_code == 200, put.text
    return signed["key"]
