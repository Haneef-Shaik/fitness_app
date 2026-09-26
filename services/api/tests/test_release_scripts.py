"""`scripts/migrate.sh` — migrations as a release step (02 §11, docs/12 §5).

Driven as a real subprocess, the way the deploy workflow runs it. The guard is
the interesting part: production is refused unless it was confirmed, before
anything touches a database; and a confirmed production run still demands TLS,
while never asking for the application's own secrets.
"""
from __future__ import annotations

import os
import subprocess
from pathlib import Path

import pytest

from app.config import get_settings

SCRIPT = Path(__file__).parents[3] / "scripts" / "migrate.sh"

#: Nothing listens here. A run that got past the guard would fail differently.
CLOSED = "postgresql+asyncpg://nobody:secret@127.0.0.1:1/none"


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
        result = _run(DATABASE_URL=get_settings().test_database_url, ENVIRONMENT="test")

        assert result.returncode == 0, result.stdout + result.stderr
        assert "(head)" in result.stdout  # `alembic current` after the upgrade
        assert "nothing to revoke" in result.stdout  # no Supabase roles locally
        assert "reference data seed" in result.stdout
        # The target is named, the credentials are not.
        assert "localhost:5433/" in result.stdout
        assert "fitlog:fitlog@" not in result.stdout + result.stderr
