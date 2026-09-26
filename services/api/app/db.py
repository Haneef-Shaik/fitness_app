"""The declarative base, and this process's engine — built on first use.

**Lazily, on purpose.** Every model imports `Base` from here and Alembic imports
every model, so an engine built at import time meant that importing a model ran
`get_settings()` — and in production that validates every secret the API needs.
A migration job holding only DATABASE_URL could not add a column without also
being handed the JWT secret. The API still refuses to start on a bad setting:
`app.main` asks for the engine at import, so the failure is at boot, not on the
first request.
"""
from collections.abc import AsyncGenerator
from functools import lru_cache

from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

from app.config import get_settings
from app.db_engine import build_engine


class Base(DeclarativeBase):
    pass


@lru_cache
def get_engine() -> AsyncEngine:
    return build_engine(get_settings())


@lru_cache
def get_sessionmaker() -> async_sessionmaker[AsyncSession]:
    return async_sessionmaker(get_engine(), class_=AsyncSession, expire_on_commit=False)


def __getattr__(name: str):
    """`from app.db import engine, SessionLocal` keeps working (PEP 562)."""
    if name == "engine":
        return get_engine()
    if name == "SessionLocal":
        return get_sessionmaker()
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with get_sessionmaker()() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
