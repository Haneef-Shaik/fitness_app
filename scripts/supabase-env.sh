#!/usr/bin/env bash
#
# Everything that runs against the LOCAL Supabase stack (docs/14-SUPABASE.md):
# the API (Postgres through the transaction-mode pooler, Storage's S3 endpoint,
# Supabase Auth), the scripts that sign in (seeds, assert_ac.py), and the app in
# development (its publishable key). Prints `export` lines, read from
# `supabase status`, so no key is ever written into the repository:
#
#   pnpm supabase start
#   eval "$(scripts/supabase-env.sh)"
#   uv run --directory services/api uvicorn app.main:app --host 0.0.0.0 --port 8000
#   (cd apps/mobile && pnpm start)          # the app signs in with the same stack
#   bash scripts/e2e.sh                      # the offline flow's API restart inherits it
#
# Rate limits are off, as for every local run of the acceptance suite: the
# flows sign in more often in a minute than a person would.
set -euo pipefail
cd "$(dirname "$0")/.."

status=$(pnpm -s exec supabase status -o env 2>/dev/null) || {
  echo "echo 'no local Supabase answering: pnpm supabase start' >&2; false"; exit 1;
}
value() { printf '%s\n' "$status" | sed -n "s/^$1=\"\(.*\)\"$/\1/p"; }

# The pooler's tenant is fixed by the CLI for a local stack.
cat <<EOF
export DATABASE_URL='postgresql+asyncpg://postgres.pooler-dev:postgres@127.0.0.1:54329/postgres'
export DB_POOL_MODE=transaction
export SUPABASE_URL='$(value API_URL)'
export SUPABASE_SECRET_KEY='$(value SECRET_KEY)'
export STORAGE_BACKEND=s3
export S3_ENDPOINT_URL='$(value STORAGE_S3_URL)'
export S3_BUCKET=fitlog-photos
export S3_REGION='$(value S3_PROTOCOL_REGION)'
export S3_ACCESS_KEY_ID='$(value S3_PROTOCOL_ACCESS_KEY_ID)'
export S3_SECRET_ACCESS_KEY='$(value S3_PROTOCOL_ACCESS_KEY_SECRET)'
export RATE_LIMITS_ENABLED=false
export SUPABASE_PUBLISHABLE_KEY='$(value PUBLISHABLE_KEY)'
export EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY='$(value PUBLISHABLE_KEY)'
EOF
