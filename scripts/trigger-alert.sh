#!/usr/bin/env bash
#
# Make an alert fire, on purpose, and watch it.
#
# An alert nobody has seen fire is a configuration file. This drives enough real
# traffic through a real API to breach one real rule — `set_commit_failures`,
# the tightest threshold in the table (02 §9) because it is the core loop — and
# then reads `GET /v1/admin/alerts` to show it firing.
#
# It also demonstrates the minimum sample doing its job: a handful of failures
# early on fires nothing, because one failure out of three is 33% and means
# nothing. The alert only appears once there is enough traffic to mean something.
#
# Usage:  scripts/trigger-alert.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
API="$ROOT/services/api"
PORT="${FITLOG_ALERT_PORT:-8098}"
BASE="http://127.0.0.1:$PORT/v1"

#: Above the rule's 200-observation minimum, with one failure — 1/250 = 0.4%,
#: which is four times the 0.1% threshold and nowhere near the 0.5% general one.
COMMITS="${FITLOG_ALERT_COMMITS:-250}"

cleanup() {
  # Close the session this run opened: left open, every run adds one to the
  # abandoned_sessions alert it is not testing.
  if [[ -n "${SESSION:-}" && -n "${TOKEN:-}" ]]; then
    curl -sS -o /dev/null -X POST "$BASE/workout-sessions/$SESSION/cancel" \
      -H "authorization: Bearer $TOKEN" -H 'content-type: application/json' -d '{}' || true
  fi
  [[ -n "${API_PID:-}" ]] && kill "$API_PID" 2>/dev/null || true
}
trap cleanup EXIT

say() { printf '\n\033[1m%s\033[0m\n' "$*"; }
ok()  { printf '  \033[32m✓\033[0m %s\n' "$*"; }
die() { printf '  \033[31m✗\033[0m %s\n' "$*"; exit 1; }
jsonq() { python3 -c "import json,sys; d=json.load(sys.stdin); print($1)"; }

say "Starting the API on :$PORT"
cd "$API"
uv run uvicorn app.main:app --port "$PORT" --log-level warning </dev/null >/tmp/fitlog-alert-api.log 2>&1 &
API_PID=$!
for _ in $(seq 1 40); do
  curl -sf "http://127.0.0.1:$PORT/health" >/dev/null 2>&1 && break
  sleep 0.5
done
curl -sf "http://127.0.0.1:$PORT/health" >/dev/null || die "the API never came up"
ok "up"

EMAIL="alert-$(date +%s)@example.com"
TOKEN=$(curl -sS -X POST "$BASE/auth/register" -H 'content-type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"correct-horse-battery\"}" \
  | jsonq 'd["data"]["access_token"]')
AUTH=(-H "authorization: Bearer $TOKEN" -H 'content-type: application/json')

EX=$(curl -sS "$BASE/exercises?limit=1" "${AUTH[@]}" | jsonq 'd["data"][0]["id"]')
SESSION=$(curl -sS -X POST "$BASE/workout-sessions" "${AUTH[@]}" -d '{}' | jsonq 'd["data"]["id"]')
SE=$(curl -sS -X POST "$BASE/workout-sessions/$SESSION/exercises" "${AUTH[@]}" \
  -d "{\"exercise_id\":\"$EX\"}" | jsonq 'd["data"]["exercises"][-1]["id"]')

say "One bad commit, with almost no traffic behind it"
curl -sS -o /dev/null -X POST "$BASE/session-exercises/$SE/sets" "${AUTH[@]}" \
  -H "Idempotency-Key: $(python3 -c 'import uuid;print(uuid.uuid4())')" \
  -d '{"set_type":"working","load_kg":60,"reps":0,"completed":true}'
# The rule under test, specifically. Other rules read the database as it is —
# `abandoned_sessions` fires on a dev database full of open test sessions, and
# rightly (G10 found this check failing on exactly that).
FIRING=$(curl -sS "$BASE/admin/alerts" "${AUTH[@]}" \
  | jsonq '"yes" if any(a["name"] == "set_commit_failures" for a in d["data"]["firing"]) else "no"')
[[ "$FIRING" == "no" ]] || die "set_commit_failures fired on a sample of one — the minimum sample is not working"
ok "set_commit_failures silent: 1 failure out of 1 is 100% and means nothing"

say "Now $COMMITS real commits, so the rate means something"
for i in $(seq 1 "$COMMITS"); do
  curl -sS -o /dev/null -X POST "$BASE/session-exercises/$SE/sets" "${AUTH[@]}" \
    -H "Idempotency-Key: $(python3 -c 'import uuid;print(uuid.uuid4())')" \
    -d '{"set_type":"working","load_kg":60,"reps":8,"completed":true}'
done
ok "$COMMITS committed"

say "What is firing"
BODY=$(curl -sS "$BASE/admin/alerts" "${AUTH[@]}")
# Via a file, not a pipe: the heredoc below would eat stdin.
printf '%s' "$BODY" > /tmp/fitlog-alerts.json
python3 - /tmp/fitlog-alerts.json <<'PYEOF'
import json, sys

d = json.load(open(sys.argv[1]))["data"]
snap = d["snapshot"]
print("  set commits: %.0f total, %.0f failed"
      % (snap["set_commits_total"], snap["set_commits_failed"]))
if not d["firing"]:
    print("  nothing firing")
for a in d["firing"]:
    print("  \033[31mFIRING\033[0m  " + a["message"])
PYEOF

echo "$BODY" | jsonq '[a["name"] for a in d["data"]["firing"]]' | grep -q set_commit_failures \
  || die "set_commit_failures did not fire — the alert table is not wired"

say "set_commit_failures fired. The table is wired, not just written down."
