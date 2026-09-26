#!/usr/bin/env bash
#
# Migrations as a release step (02 §11): forward-only, once per deploy, and
# BEFORE the new release starts. Expand/contract is what makes that order safe —
# the old release keeps working on the new schema for the minute the host takes
# to roll over — so a migration is never run by the API at startup, where two
# replicas would race each other to it.
#
# Runs `alembic upgrade head` and prints the revision it reached; revokes
# Supabase's Data API roles from the tables (app/db_hardening.py); then runs the
# reference-data seed, which is idempotent and "safe on every deploy"
# (app/seed/__init__.py). It needs DATABASE_URL and nothing else: no JWT secret,
# no storage keys (alembic/env.py, app/db.py).
#
#   DATABASE_URL='postgresql+asyncpg://…:5432/postgres?ssl=require' scripts/migrate.sh
#   ENVIRONMENT=production CONFIRM_PRODUCTION=1 DATABASE_URL=… scripts/migrate.sh
#   SEED=0 …                        # migrations only
#
# Production is refused unless CONFIRM_PRODUCTION=1. The deploy workflow sets it
# for the production job, behind the environment's required reviewer; a person
# at a laptop has to type it, and should be asking why they are (docs/12 §5).
#
# Use the SESSION pooler's URL (port 5432) or a direct connection. Migrations
# take locks and run DDL in one transaction; do not aim them at the transaction
# pooler (6543).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
API="$ROOT/services/api"

say() { printf '\n\033[1m%s\033[0m\n' "$*"; }
die() { printf '  \033[31m✗\033[0m %s\n' "$1" >&2; exit "${2:-1}"; }

[[ -n "${DATABASE_URL:-}" ]] || die "set DATABASE_URL — the database to migrate"
ENVIRONMENT="${ENVIRONMENT:-development}"

if [[ "$ENVIRONMENT" == "production" && "${CONFIRM_PRODUCTION:-}" != "1" ]]; then
  die "ENVIRONMENT=production: refusing without CONFIRM_PRODUCTION=1" 2
fi

# Inside alembic/env.py this overrides DATABASE_URL. One URL, the one named below.
unset ALEMBIC_DATABASE_URL

# Host, port and database — never the credentials, which would land in CI logs.
TARGET=$(python3 -c '
import os, urllib.parse as u
p = u.urlsplit(os.environ["DATABASE_URL"])
print(f"{p.hostname}:{p.port or 5432}{p.path}")
')

cd "$API"
# --no-sync: the environment is the one already installed (`uv sync --frozen
# --no-dev` in the release job), never re-resolved in the middle of a release.
say "Migrating $TARGET ($ENVIRONMENT)"
uv run --no-sync alembic upgrade head
uv run --no-sync alembic current

# Every release, after the migrations: Supabase grants its public-key roles
# every table in `public`, including the ones just created (app/db_hardening.py).
say "Closing the Data API"
uv run --no-sync python scripts/harden_database.py

if [[ "${SEED:-1}" == "1" ]]; then
  say "Reference data"
  uv run --no-sync python scripts/seed_catalog.py
fi

say "Done: $TARGET is at head."
