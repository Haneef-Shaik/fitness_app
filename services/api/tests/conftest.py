"""Integration fixtures — a real Postgres, created and dropped per session.

The ephemeral tmpfs container in infra/docker-compose.yml means this is fast and
never leaves state behind between runs.
"""
from __future__ import annotations

import asyncio
import os
from collections.abc import AsyncGenerator
from dataclasses import dataclass
from pathlib import Path

import pytest
import pytest_asyncio
from alembic.config import Config
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from alembic import command
from app.api.deps import session_factory
from app.config import get_settings
from app.db import get_db
from app.main import app
from app.seed.catalog import seed_catalog
from app.seed.foods import seed_foods

settings = get_settings()

# The rate limiter is OFF for the suite, and that is a choice rather than a
# convenience. Every test here registers its own user from the one address the
# ASGI transport reports, so any limit a real deployment would use — ten sign-ups
# an hour from one IP — trips a few tests in, and WHICH test trips depends on the
# order they run in. Raising the limits to "effectively infinite" would be the
# same switch with a less honest name. `tests/test_rate_limits.py` turns it on
# per test through the `rate_limits` fixture below, against an empty counter
# table and a frozen clock, and drives every protected route to its 429 — which
# is what proves the wiring, rather than an incidental 429 somewhere else.
#
# The limiter reads settings per request, so flipping the cached object is enough.
settings.rate_limits_enabled = False


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
    # Background work (A-05's reset request) opens its own session; it must
    # open it on the test database too, never the development one.
    app.dependency_overrides[session_factory] = lambda: maker
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


# ------------------------------------------------- email (A-05, A-06, K-02)


@pytest_asyncio.fixture
async def outbox():
    """The mail a test caused, readable in the test.

    A fresh console sender per test, put in front of the `get_email_sender`
    dependency — so a test follows the link in the email, as a user would,
    rather than reading a token out of the database, where only its hash is.
    Without this fixture the app's own console sender still records, so no test
    ever reaches a provider.
    """
    from app.email.console import ConsoleEmailSender
    from app.email.provider import get_email_sender

    sender = ConsoleEmailSender(echo=False)
    app.dependency_overrides[get_email_sender] = lambda: sender
    yield sender
    app.dependency_overrides.pop(get_email_sender, None)


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


def _install_store(store, monkeypatch):
    """Makes `store` the one every route reads and writes, for one test.

    `get_store` is lru_cached, so the cache is cleared around the test rather
    than left holding a store that no longer exists.
    """
    from app.storage import provider

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
        "app.services.account",
    ):
        module = importlib.import_module(module_name)
        assert hasattr(module, "get_store"), f"{module_name} no longer imports get_store"
        monkeypatch.setattr(module, "get_store", lambda: store)
    return original


@pytest_asyncio.fixture
async def storage(tmp_path, monkeypatch):
    """A local object store under pytest's own tmp_path."""
    from app.storage.local import LocalObjectStore

    store = LocalObjectStore(tmp_path / "uploads")
    original = _install_store(store, monkeypatch)
    yield store
    original.cache_clear()


# ------------------------------------------------------------ S3 (L1)
#
# The S3 store is exercised over real HTTP, never through an in-process mock of
# botocore: path-style addressing, presigning and the error codes are the parts
# a hosted bucket gets wrong. By default that is moto's server on a free port;
# `S3_TEST_ENDPOINT_URL` points the same tests at MinIO or a staging bucket.


@dataclass(frozen=True)
class S3Endpoint:
    url: str
    region: str
    access_key_id: str
    secret_access_key: str
    #: A real server enforces what moto does not — presigned expiry, chiefly.
    real: bool

    def client(self):
        import boto3

        return boto3.client(
            "s3", endpoint_url=self.url, region_name=self.region,
            aws_access_key_id=self.access_key_id,
            aws_secret_access_key=self.secret_access_key,
        )


@pytest.fixture(scope="session")
def s3_endpoint():
    url = os.environ.get("S3_TEST_ENDPOINT_URL")
    if url:
        yield S3Endpoint(
            url=url,
            region=os.environ.get("S3_TEST_REGION", "us-east-1"),
            access_key_id=os.environ["S3_TEST_ACCESS_KEY_ID"],
            secret_access_key=os.environ["S3_TEST_SECRET_ACCESS_KEY"],
            real=True,
        )
        return

    from moto.server import ThreadedMotoServer

    server = ThreadedMotoServer(ip_address="127.0.0.1", port=0, verbose=False)
    server.start()
    host, port = server.get_host_and_port()
    yield S3Endpoint(
        url=f"http://{host}:{port}", region="us-east-1",
        access_key_id="fitlog-test", secret_access_key="fitlog-test", real=False,
    )
    server.stop()


@pytest.fixture
def s3_store(s3_endpoint):
    """An S3 store over a fresh, private bucket, emptied and removed afterwards."""
    import uuid as _uuid

    from app.storage.s3 import S3ObjectStore

    bucket = f"fitlog-test-{_uuid.uuid4().hex[:12]}"
    admin = s3_endpoint.client()
    admin.create_bucket(Bucket=bucket)

    yield S3ObjectStore(
        bucket=bucket, region=s3_endpoint.region, endpoint_url=s3_endpoint.url,
        access_key_id=s3_endpoint.access_key_id,
        secret_access_key=s3_endpoint.secret_access_key,
    )

    for page in admin.get_paginator("list_objects_v2").paginate(Bucket=bucket):
        for obj in page.get("Contents", []):
            admin.delete_object(Bucket=bucket, Key=obj["Key"])
    admin.delete_bucket(Bucket=bucket)


@pytest_asyncio.fixture
async def s3_storage(s3_store, monkeypatch):
    """The S3 store, installed into every route the way `storage` installs the
    local one."""
    original = _install_store(s3_store, monkeypatch)
    yield s3_store
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


# ------------------------------------------------------- rate limiting (launch)


class _Clock:
    """The limiter's clock, held still. Starts on a boundary that is a whole
    minute, hour and day, so a fresh window is a full one."""

    def __init__(self) -> None:
        self.t = float(1_800_000_000 - (1_800_000_000 % 86_400))

    def now(self) -> float:
        return self.t

    def advance(self, seconds: float) -> None:
        self.t += seconds


class _Limits:
    def __init__(self, monkeypatch, settings_obj) -> None:
        self._mp = monkeypatch
        self._s = settings_obj
        self.clock = _Clock()

    @property
    def enabled(self) -> bool:
        return self._s.rate_limits_enabled

    @enabled.setter
    def enabled(self, value: bool) -> None:
        self._mp.setattr(self._s, "rate_limits_enabled", value)

    def set(self, policy: str, *, ip: str | None = None, account: str | None = None) -> None:
        """Lowers one policy's limit for this test, e.g. `set("ai", ip="1/minute")`."""
        if ip is not None:
            self._mp.setattr(self._s, f"rate_limit_{policy}_ip", ip)
        if account is not None:
            self._mp.setattr(self._s, f"rate_limit_{policy}_account", account)

    def trust_proxies(self, count: int) -> None:
        self._mp.setattr(self._s, "trusted_proxy_count", count)


@pytest_asyncio.fixture
async def rate_limits(engine, monkeypatch):
    """The limiter ON for one test: an empty counter table and a frozen clock.

    Emptied rather than scoped, because the counters are keyed by address and
    every test comes from the same one — a count left by the previous test is
    exactly the order-dependence the suite-wide switch exists to avoid.
    """
    from app.core import ratelimit

    async with engine.begin() as conn:
        await conn.execute(text("DELETE FROM rate_limit_counters"))

    limits = _Limits(monkeypatch, get_settings())
    limits.enabled = True
    monkeypatch.setattr(ratelimit, "_now", limits.clock.now)
    yield limits
