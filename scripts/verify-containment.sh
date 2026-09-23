#!/usr/bin/env bash
#
# I14 — no AI failure touches training. Verified, not asserted.
#
# Starts a real API and a real worker with the AI gateway pointed at a closed
# port, then drives the logger end to end over HTTP: register, start a session,
# log a set, finish it, read history and analytics, and log a meal by hand.
#
# The integration suite proves the same thing in-process. This proves it with
# two actual processes and a provider that genuinely is not there — which is
# what "kill the AI service and use the app" means.
#
# Usage:  scripts/verify-containment.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
API="$ROOT/services/api"
PORT="${VOLT_VERIFY_PORT:-8099}"
BASE="http://127.0.0.1:$PORT/v1"

# A closed port. Nothing is listening, and nothing ever will be.
export AI_PROVIDER=anthropic
export AI_API_KEY=not-a-real-key
export AI_BASE_URL="http://127.0.0.1:1/v1/messages"
export AI_TIMEOUT_SECONDS=2

cleanup() {
  [[ -n "${API_PID:-}"    ]] && kill "$API_PID"    2>/dev/null || true
  [[ -n "${WORKER_PID:-}" ]] && kill "$WORKER_PID" 2>/dev/null || true
}
trap cleanup EXIT

say()  { printf '\n\033[1m%s\033[0m\n' "$*"; }
ok()   { printf '  \033[32m✓\033[0m %s\n' "$*"; }
die()  { printf '  \033[31m✗\033[0m %s\n' "$*"; exit 1; }

say "Starting the API and the worker with the AI provider unreachable"
cd "$API"
uv run uvicorn app.main:app --port "$PORT" --log-level warning </dev/null >/tmp/volt-verify-api.log 2>&1 &
API_PID=$!
uv run python -m app.worker </dev/null >/tmp/volt-verify-worker.log 2>&1 &
WORKER_PID=$!

for _ in $(seq 1 40); do
  curl -sf "http://127.0.0.1:$PORT/health" >/dev/null 2>&1 && break
  sleep 0.5
done
curl -sf "http://127.0.0.1:$PORT/health" >/dev/null || die "the API never came up"
ok "API on :$PORT, worker pid $WORKER_PID"

EMAIL="verify-$(date +%s)@example.com"
TOKEN=$(curl -sS -X POST "$BASE/auth/register" -H 'content-type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"correct-horse-battery\"}" \
  | python3 -c 'import json,sys; print(json.load(sys.stdin)["data"]["access_token"])')
AUTH=(-H "authorization: Bearer $TOKEN" -H 'content-type: application/json')

say "Submitting an analysis the provider cannot answer"
ANALYSIS=$(curl -sS -X POST "$BASE/food-analysis/text" "${AUTH[@]}" \
  -d '{"text":"2 eggs, 3 rotis and 200g chicken curry"}' \
  | python3 -c 'import json,sys; print(json.load(sys.stdin)["data"]["id"])')
ok "queued $ANALYSIS"

for _ in $(seq 1 30); do
  STATUS=$(curl -sS "$BASE/food-analysis/$ANALYSIS" "${AUTH[@]}" \
    | python3 -c 'import json,sys; print(json.load(sys.stdin)["data"]["status"])')
  [[ "$STATUS" == "failed" || "$STATUS" == "completed" ]] && break
  sleep 1
done
BODY=$(curl -sS "$BASE/food-analysis/$ANALYSIS" "${AUTH[@]}")
CODE=$(echo "$BODY" | python3 -c 'import json,sys; print(json.load(sys.stdin)["data"]["error_code"])')
[[ "$STATUS" == "failed"          ]] || die "expected the analysis to fail, got $STATUS"
[[ "$CODE"   == "ai_unavailable"  ]] || die "expected ai_unavailable, got $CODE"
ok "analysis failed with ai_unavailable, and the worker is still alive"
kill -0 "$WORKER_PID" 2>/dev/null || die "the worker died with the provider"

say "Logging a whole workout with the provider still unreachable"
EX=$(curl -sS "$BASE/exercises?limit=1" "${AUTH[@]}" \
  | python3 -c 'import json,sys; print(json.load(sys.stdin)["data"][0]["id"])')
SESSION=$(curl -sS -X POST "$BASE/workout-sessions" "${AUTH[@]}" -d '{}' \
  | python3 -c 'import json,sys; print(json.load(sys.stdin)["data"]["id"])')
SE=$(curl -sS -X POST "$BASE/workout-sessions/$SESSION/exercises" "${AUTH[@]}" \
  -d "{\"exercise_id\":\"$EX\"}" \
  | python3 -c 'import json,sys; print(json.load(sys.stdin)["data"]["exercises"][-1]["id"])')
curl -sS -X POST "$BASE/session-exercises/$SE/sets" "${AUTH[@]}" \
  -H "Idempotency-Key: $(python3 -c 'import uuid;print(uuid.uuid4())')" \
  -d '{"set_type":"working","load_kg":60,"reps":8,"completed":true}' >/dev/null
VOLUME=$(curl -sS -X POST "$BASE/workout-sessions/$SESSION/finish" "${AUTH[@]}" -d '{}' \
  | python3 -c 'import json,sys; print(json.load(sys.stdin)["data"]["total_volume_kg"])')
[[ "$VOLUME" == "480.0" ]] || die "expected 480.0 kg of volume, got $VOLUME"
ok "session finished, volume 480.0 kg"

say "Reading history, analytics and logging a meal by hand"
curl -sf "$BASE/history/workouts" "${AUTH[@]}" >/dev/null || die "history is down"
ok "history"
curl -sf "$BASE/analytics/workouts" "${AUTH[@]}" >/dev/null || die "analytics is down"
ok "analytics"
FOOD=$(curl -sS -X POST "$BASE/foods" "${AUTH[@]}" \
  -d '{"name":"Oats","calories":380,"protein_g":13,"carbs_g":67,"fat_g":7}' \
  | python3 -c 'import json,sys; print(json.load(sys.stdin)["data"]["id"])')
curl -sS -X POST "$BASE/meals" "${AUTH[@]}" \
  -H "Idempotency-Key: $(python3 -c 'import uuid;print(uuid.uuid4())')" \
  -d "{\"meal_type\":\"lunch\",\"items\":[{\"food_id\":\"$FOOD\",\"quantity_grams\":100}]}" >/dev/null
KCAL=$(curl -sS "$BASE/nutrition/day" "${AUTH[@]}" \
  | python3 -c 'import json,sys; print(json.load(sys.stdin)["data"]["calories"])')
[[ "$KCAL" == "380.0" ]] || die "expected 380.0 kcal, got $KCAL"
ok "manual meal logged, day totals 380.0 kcal"

say "I14 holds: the AI service was unreachable throughout and nothing else noticed."
