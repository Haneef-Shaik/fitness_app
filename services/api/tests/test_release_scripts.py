"""`scripts/migrate.sh` — migrations as a release step (02 §11, docs/12 §5).

Driven as a real subprocess, the way the deploy workflow runs it. The guard is
the interesting part: production is refused unless it was confirmed, before
anything touches a database; and a confirmed production run still demands TLS,
while never asking for the application's own secrets.
"""
from __future__ import annotations

import asyncio
import os
import subprocess
from pathlib import Path

import asyncpg
import pytest
from sqlalchemy.engine import make_url

from app.config import get_settings

SCRIPT = Path(__file__).parents[3] / "scripts" / "migrate.sh"

#: Nothing listens here. A run that got past the guard would fail differently.
CLOSED = "postgresql+asyncpg://nobody:secret@127.0.0.1:1/none"


def _data_api_roles(url: str) -> list[str]:
    """Supabase's public-key roles present in the database the suite runs on:
    none on plain Postgres, `anon` and `authenticated` on Supabase's."""
    u = make_url(url)

    async def query() -> list[str]:
        conn = await asyncpg.connect(
            host=u.host, port=u.port, user=u.username, password=u.password,
            database=u.database, statement_cache_size=0,
        )
        try:
            rows = await conn.fetch(
                "SELECT rolname FROM pg_roles WHERE rolname IN ('anon', 'authenticated') ORDER BY 1"
            )
            return [r["rolname"] for r in rows]
        finally:
            await conn.close()

    return asyncio.run(query())


def _run(**env: str) -> subprocess.CompletedProcess[str]:
    # A clean environment: only what the release job itself would have.
    base = {k: v for k, v in os.environ.items() if k in ("PATH", "HOME", "UV_CACHE_DIR")}
    return subprocess.run(
        ["bash", str(SCRIPT)], env={**base, **env},
        capture_output=True, text=True, timeout=180, check=False,
    )


class TestTheGuard:
    def test_production_is_refused_without_confirmation(self):
        result = _run(ENVIRONMENT="production", DATABASE_URL=CLOSED)

        assert result.returncode == 2, result.stderr
        assert "CONFIRM_PRODUCTION=1" in result.stderr

    def test_a_missing_url_is_refused(self):
        result = _run()

        assert result.returncode != 0
        assert "DATABASE_URL" in result.stderr

    def test_confirmed_production_still_demands_tls_and_not_the_jwt_secret(self):
        result = _run(ENVIRONMENT="production", CONFIRM_PRODUCTION="1", DATABASE_URL=CLOSED)

        assert result.returncode != 0
        output = result.stdout + result.stderr
        assert "ssl=require" in output
        assert "JWT_SECRET" not in output


class TestARelease:
    @pytest.mark.usefixtures("engine")  # the schema exists, so this is a no-op upgrade
    def test_it_migrates_and_seeds_without_printing_the_password(self):
        url = get_settings().test_database_url
        # The pool mode is a deployment setting the release job has too; without
        # it a run through Supabase's transaction pooler would test session mode.
        result = _run(DATABASE_URL=url, ENVIRONMENT="test", DB_POOL_MODE=get_settings().db_pool_mode)

        assert result.returncode == 0, result.stdout + result.stderr
        assert "(head)" in result.stdout  # `alembic current` after the upgrade
        # On Supabase's Postgres the public-key roles exist and are revoked;
        # on plain Postgres there is nothing to revoke.
        roles = _data_api_roles(url)
        if roles:
            assert f"Data API roles revoked from public: {', '.join(roles)}" in result.stdout
        else:
            assert "nothing to revoke" in result.stdout
        assert "reference data seed" in result.stdout
        # The target is named, the credentials are not.
        target = make_url(url)
        assert f"{target.host}:{target.port}/" in result.stdout
        assert f"{target.username}:{target.password}@" not in result.stdout + result.stderr
