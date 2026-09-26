"""Engine options for a hosted Postgres (L1: Supabase through its pooler).

Mostly pure tests over the builder. Two things are proven against a real
database rather than read off a dict: that asyncpg and SQLAlchemy **accept** the
transaction-mode arguments (an unknown connect argument only fails when a
connection opens), and that the worker and Alembic build their engines through
the same builder instead of a copy of it.
"""
from __future__ import annotations

import asyncio
from pathlib import Path

import pytest
from pydantic import ValidationError
from sqlalchemy import text
from sqlalchemy.pool import NullPool

from app import db_engine
from app.config import Settings, get_settings
from app.db_engine import build_engine, engine_options

URL = "postgresql+asyncpg://fitlog:s3cr3t@pooler.example.com:5432/postgres"


def _opts(url: str = URL, **overrides):
    kwargs = {
        "pool_mode": "session", "pool_size": 5, "max_overflow": 5,
        "require_tls": False, "pooled": True,
    }
    return engine_options(url, **{**kwargs, **overrides})


class TestSessionMode:
    """The default: Supabase's session pooler (port 5432) or a direct connection."""

    def test_the_pool_is_sized_from_the_settings(self):
        opts = _opts(pool_size=7, max_overflow=3)

        assert opts.pool == {"pool_pre_ping": True, "pool_size": 7, "max_overflow": 3}

    def test_prepared_statements_stay_on(self):
        # A session is one server connection for its whole life, so asyncpg's
        # statement cache is safe and is worth ~10% per statement.
        opts = _opts()

        assert "statement_cache_size" not in opts.connect_args
        assert "prepared_statement_cache_size" not in opts.connect_args


class TestTransactionMode:
    """Supabase's transaction pooler (port 6543): consecutive transactions on one
    client connection may run on different server connections."""

    def test_both_statement_caches_are_off(self):
        opts = _opts(pool_mode="transaction")

        # asyncpg's own cache, and SQLAlchemy's cache in its asyncpg adapter —
        # turning off only one still reuses a statement the next server lacks.
        assert opts.connect_args["statement_cache_size"] == 0
        assert opts.connect_args["prepared_statement_cache_size"] == 0

    def test_statement_names_never_repeat(self):
        name = _opts(pool_mode="transaction").connect_args["prepared_statement_name_func"]
        names = {name() for _ in range(500)}

        # asyncpg numbers statements per connection, so two clients sharing a
        # server connection both prepare `__asyncpg_stmt_1__`.
        assert len(names) == 500
        assert all(n.startswith("__asyncpg_") and n.endswith("__") for n in names)

    def test_the_pooler_is_the_pool(self):
        opts = _opts(pool_mode="transaction", pool_size=9, max_overflow=9)

        assert opts.pool["poolclass"] is NullPool
        assert "pool_size" not in opts.pool and "max_overflow" not in opts.pool

    def test_an_unknown_mode_is_refused(self):
        with pytest.raises(ValueError, match="DB_POOL_MODE"):
            _opts(pool_mode="statement")


class TestTLS:
    def test_a_libpq_sslmode_becomes_asyncpgs_ssl_argument(self):
        # asyncpg.connect() has no `sslmode` keyword: left in the URL it is a
        # TypeError on the first connection, in production, at 3 a.m.
        opts = _opts(URL + "?sslmode=require")

        assert opts.connect_args["ssl"] == "require"
        assert "sslmode" not in opts.url

    def test_the_ssl_spelling_is_normalised_the_same_way(self):
        opts = _opts(URL + "?ssl=verify-full")

        assert opts.connect_args["ssl"] == "verify-full"
        assert "ssl=" not in opts.url

    def test_other_query_parameters_and_the_password_survive(self):
        opts = _opts(URL + "?sslmode=require&application_name=fitlog-api")

        assert "application_name=fitlog-api" in opts.url
        # Rendered with the password, not SQLAlchemy's `***` repr.
        assert "s3cr3t" in opts.url

    def test_an_unknown_mode_is_refused(self):
        with pytest.raises(ValueError, match="sslmode"):
            _opts(URL + "?sslmode=sometimes")

    def test_development_leaves_tls_to_the_driver(self):
        # The local containers have no certificate; asyncpg's default is prefer.
        assert "ssl" not in _opts().connect_args

    def test_a_deployed_environment_refuses_a_url_without_tls(self):
        with pytest.raises(RuntimeError, match="ssl=require"):
            _opts(require_tls=True)

    @pytest.mark.parametrize("mode", ["disable", "allow", "prefer"])
    def test_a_deployed_environment_refuses_a_mode_that_can_fall_back_to_plaintext(self, mode):
        with pytest.raises(RuntimeError, match="ssl=require"):
            _opts(URL + f"?sslmode={mode}", require_tls=True)

    @pytest.mark.parametrize("mode", ["require", "verify-ca", "verify-full"])
    def test_a_deployed_environment_accepts_a_mode_that_insists_on_tls(self, mode):
        assert _opts(URL + f"?ssl={mode}", require_tls=True).connect_args["ssl"] == mode


class TestUnpooled:
    def test_a_one_shot_engine_holds_no_pool(self):
        # Alembic opens one connection, migrates and exits.
        opts = _opts(pooled=False)

        assert opts.pool == {"poolclass": NullPool}

    def test_it_keeps_the_mode_specific_connect_arguments(self):
        opts = _opts(pool_mode="transaction", pooled=False)

        assert opts.connect_args["statement_cache_size"] == 0


class TestSettings:
    @pytest.mark.parametrize("environment", ["staging", "production"])
    def test_staging_is_held_to_productions_rule(self, environment):
        # Staging is where production's settings are rehearsed; a rule it skips
        # is a rule first exercised in production.
        settings = Settings(_env_file=None, environment=environment)

        with pytest.raises(RuntimeError, match="ssl=require"):
            build_engine(settings)

    def test_the_defaults_are_session_mode_and_a_small_pool(self):
        s = Settings(_env_file=None)

        assert (s.db_pool_mode, s.db_pool_size, s.db_max_overflow) == ("session", 5, 5)

    def test_an_unknown_pool_mode_is_refused_when_settings_load(self):
        with pytest.raises(ValidationError):
            Settings(_env_file=None, db_pool_mode="statement")

    def test_a_pool_needs_at_least_one_connection(self):
        with pytest.raises(ValidationError):
            Settings(_env_file=None, db_pool_size=0)


class TestWiring:
    async def test_transaction_mode_options_really_connect(self):
        """Proves the arguments are ones asyncpg and SQLAlchemy accept. Through a
        real transaction pooler is the runbook's check (docs/12 §3)."""
        settings = Settings(
            _env_file=None, database_url=get_settings().test_database_url,
            db_pool_mode="transaction",
        )
        engine = build_engine(settings)
        try:
            async with engine.connect() as conn:
                # Twice, and with a parameter, so the prepare path runs.
                for _ in range(2):
                    assert await conn.scalar(text("SELECT CAST(:n AS int) + 1"), {"n": 1}) == 2
        finally:
            await engine.dispose()

    async def test_the_worker_builds_its_engine_through_the_builder(self, monkeypatch):
        from app.worker import runner

        calls: list[dict] = []

        def spy(settings, **kwargs):
            calls.append(kwargs)
            return build_engine(settings, **kwargs)

        monkeypatch.setattr(runner, "build_engine", spy)
        factory = runner._session_factory()

        assert calls == [{}]
        await factory.kw["bind"].dispose()

    async def test_migrations_build_their_engine_through_the_builder(self, monkeypatch):
        from alembic import command

        calls: list[dict] = []
        real = db_engine.build_engine

        def spy(settings, **kwargs):
            calls.append(kwargs)
            return real(settings, **kwargs)

        monkeypatch.setattr(db_engine, "build_engine", spy)
        cfg = _alembic(get_settings().test_database_url, monkeypatch)
        await asyncio.to_thread(command.current, cfg)

        assert calls and calls[0]["pooled"] is False

    async def test_migrations_need_a_database_not_the_apps_secrets(self, monkeypatch):
        """A migration job is given DATABASE_URL and nothing else. In production
        it must fail on what it needs — TLS — and never on the JWT secret."""
        from alembic import command

        monkeypatch.setenv("ENVIRONMENT", "production")
        monkeypatch.delenv("JWT_SECRET", raising=False)

        cfg = _alembic(get_settings().test_database_url + "?ssl=disable", monkeypatch)
        with pytest.raises(RuntimeError) as refused:
            await asyncio.to_thread(command.current, cfg)
        assert "ssl=require" in str(refused.value)
        assert "JWT_SECRET" not in str(refused.value)


def _alembic(url: str, monkeypatch):
    """Through monkeypatch, so the override does not outlive the test."""
    from alembic.config import Config

    root = Path(__file__).parents[1]
    cfg = Config(str(root / "alembic.ini"))
    cfg.set_main_option("script_location", str(root / "alembic"))
    monkeypatch.setenv("ALEMBIC_DATABASE_URL", url)
    return cfg


class TestWhatEnginesKeepQuiet:
    def test_the_app_engine_hides_bound_parameters(self):
        from app.config import Settings
        from app.db_engine import build_engine

        engine = build_engine(Settings(_env_file=None))
        assert engine.sync_engine.hide_parameters is True

    def test_the_limiter_engine_keeps_tls_and_pooler_mode(self, monkeypatch):
        """Built from the URL alone it lost `?ssl=` (moved to connect args) and
        transaction mode's disabled caches: with SSL enforced, every login would
        have failed at the limiter (G11 review)."""
        from app import config
        from app.core.ratelimit import limiter_options

        settings = config.Settings(
            _env_file=None, database_url="postgresql+asyncpg://u:p@db.example:6543/postgres?ssl=require",
            db_pool_mode="transaction",
        )
        monkeypatch.setattr(config, "get_settings", lambda: settings)
        monkeypatch.setattr("app.core.ratelimit.get_settings", lambda: settings)

        opts = limiter_options("ignored", from_app_engine=True)
        assert opts.connect_args["ssl"] == "require"
        assert opts.connect_args["statement_cache_size"] == 0
