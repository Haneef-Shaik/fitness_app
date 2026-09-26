"""Alembic environment — async engine, URL and metadata pulled from the app.

Never hardcodes a database URL: it reads app.config so dev, test and production
all migrate through the same code path — and the engine comes from the same
builder the API and the worker use (`app/db_engine.py`), so pooler and TLS
settings cannot differ between the code and its migrations.

`Settings()`, not `get_settings()`: a migration needs a database, not the JWT
secret. `get_settings()` validates every production secret, which would put all
of them into the migration job (docs/12 §5). The database's own production rule
— TLS — is still enforced, by the builder.
"""
import asyncio
from logging.config import fileConfig

from sqlalchemy.engine import Connection

import app.models  # noqa: F401  — registers every model on Base.metadata
from alembic import context
from app import db_engine
from app.config import Settings
from app.db import Base

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def _url() -> str:
    # ALEMBIC_DATABASE_URL lets CI and the test suite point somewhere else.
    import os
    return os.environ.get("ALEMBIC_DATABASE_URL") or Settings().database_url


def run_migrations_offline() -> None:
    context.configure(
        url=_url(), target_metadata=target_metadata,
        literal_binds=True, dialect_opts={"paramstyle": "named"},
        compare_type=True, compare_server_default=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(
        connection=connection, target_metadata=target_metadata,
        compare_type=True, compare_server_default=True,
    )
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    # One connection, then exit: no pool to hold (pooled=False).
    connectable = db_engine.build_engine(Settings(), url=_url(), pooled=False)
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()


def run_migrations_online() -> None:
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
