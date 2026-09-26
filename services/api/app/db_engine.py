"""How every process builds its database engine — the API, the worker and Alembic.

One builder, because the three used to build their own, and a connection
setting that only the API had is a migration that works on a laptop and fails
against the hosted database (L1: Supabase, through its pooler).

Two decisions live here:

**Transaction pooling turns prepared statements off, on both layers.** Supabase's
transaction pooler hands consecutive transactions on one client connection to
different server connections, so a statement prepared in one is missing in the
next. asyncpg caches statements (`statement_cache_size`) and SQLAlchemy's asyncpg
adapter caches them again (`prepared_statement_cache_size`); both go to zero.
Measured through PgBouncer in transaction mode (docs/12 §3): with the caches on,
120 of 150 concurrent sessions failed — "prepared statement does not exist", and
worse, a statement bound to another client's same-named one; with them off, 0.
asyncpg also names statements `__asyncpg_stmt_1__`, `_2__`… per connection, so
each gets a unique name as well — insurance against a pooler that leaves one on
a server connection — and the pool is `NullPool`: the pooler is the pool. Both
are SQLAlchemy's documented recipe for PgBouncer.

**A deployed environment insists on TLS.** A libpq URL says `sslmode=require`;
asyncpg has no `sslmode` keyword and takes `ssl=` instead, so the mode is moved
out of the URL into the connect arguments — either spelling works — and staging
and production refuse a URL whose mode could fall back to plaintext.
"""
from __future__ import annotations

import uuid
from dataclasses import dataclass
from typing import Any

from sqlalchemy.engine import make_url
from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine
from sqlalchemy.pool import NullPool

from app.config import Settings

POOL_MODES = frozenset({"session", "transaction"})

#: libpq's sslmode values, which asyncpg's `ssl=` also accepts as strings.
SSL_MODES = frozenset({"disable", "allow", "prefer", "require", "verify-ca", "verify-full"})

#: The modes that never fall back to plaintext.
TLS_REQUIRED = frozenset({"require", "verify-ca", "verify-full"})


@dataclass(frozen=True, slots=True)
class EngineOptions:
    #: The URL without its TLS parameter, password intact.
    url: str
    connect_args: dict[str, Any]
    #: `create_async_engine` keywords: a sized pool, or `NullPool`.
    pool: dict[str, Any]


def unique_statement_name() -> str:
    """A prepared-statement name no other client of the pooler will pick."""
    return f"__asyncpg_{uuid.uuid4().hex}__"


def engine_options(
    database_url: str,
    *,
    pool_mode: str,
    pool_size: int,
    max_overflow: int,
    require_tls: bool,
    pooled: bool = True,
) -> EngineOptions:
    """Pure: the same inputs always give the same options, and nothing connects."""
    if pool_mode not in POOL_MODES:
        raise ValueError(f"DB_POOL_MODE must be one of {sorted(POOL_MODES)}, not {pool_mode!r}")

    url, ssl_mode = _split_tls(database_url)
    if require_tls and ssl_mode not in TLS_REQUIRED:
        # Better to refuse to start than to send health data in plaintext
        # because a copied URL lost its query string.
        raise RuntimeError(
            "DATABASE_URL must insist on TLS in staging and production: append "
            "?ssl=require (or verify-full with PGSSLROOTCERT) — docs/12-DEPLOYMENT.md §3"
        )

    connect_args: dict[str, Any] = {}
    if ssl_mode is not None:
        connect_args["ssl"] = ssl_mode

    if pool_mode == "transaction":
        connect_args = {
            **connect_args,
            "statement_cache_size": 0,
            "prepared_statement_cache_size": 0,
            "prepared_statement_name_func": unique_statement_name,
        }
        pool: dict[str, Any] = {"poolclass": NullPool}
    elif pooled:
        # pre_ping: a pooler closes idle client connections, and the first
        # request after a quiet night should not be the one that finds out.
        pool = {"pool_pre_ping": True, "pool_size": pool_size, "max_overflow": max_overflow}
    else:
        pool = {"poolclass": NullPool}

    return EngineOptions(url=url, connect_args=connect_args, pool=pool)


def options_from_settings(
    settings: Settings, *, url: str | None = None, pooled: bool = True
) -> EngineOptions:
    return engine_options(
        url or settings.database_url,
        pool_mode=settings.db_pool_mode,
        pool_size=settings.db_pool_size,
        max_overflow=settings.db_max_overflow,
        require_tls=settings.is_deployed,
        pooled=pooled,
    )


def build_engine(
    settings: Settings, *, url: str | None = None, pooled: bool = True
) -> AsyncEngine:
    """`url` overrides the settings' URL (Alembic's ALEMBIC_DATABASE_URL);
    `pooled=False` is for one-shot processes that hold no pool."""
    opts = options_from_settings(settings, url=url, pooled=pooled)
    # hide_parameters: a database error's text otherwise carries the row's
    # values — a set's note, a password hash, an address — into the logs and
    # crash reports (G11 security review).
    return create_async_engine(
        opts.url, connect_args=opts.connect_args, hide_parameters=True, **opts.pool,
    )


def _split_tls(database_url: str) -> tuple[str, str | None]:
    """The URL without `ssl`/`sslmode`, and the mode it asked for."""
    parsed = make_url(database_url)
    query = dict(parsed.query)
    ssl = query.pop("ssl", None)
    sslmode = query.pop("sslmode", None)
    requested = ssl if ssl is not None else sslmode
    # A repeated parameter arrives as a tuple: `?ssl=a&ssl=b` is ambiguous.
    modes = requested if isinstance(requested, tuple) else (requested,)
    if len(modes) > 1:
        raise ValueError("DATABASE_URL names more than one sslmode")
    mode = modes[0]
    if mode is not None and mode not in SSL_MODES:
        raise ValueError(f"DATABASE_URL has an unknown sslmode {mode!r}; use one of {sorted(SSL_MODES)}")
    stripped = parsed.set(query=query).render_as_string(hide_password=False)
    return stripped, mode
