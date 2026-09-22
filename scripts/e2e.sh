#!/usr/bin/env bash
#
# The acceptance suite: seed, drive the phone, then ask the SERVER what landed.
#
# Each criterion is two halves that only mean something together:
#
#   the Maestro flow   — a person can reach it, and the screen says so
#   assert_ac.py       — and the write actually reached the database
#
# The second half is not belt-and-braces. AC-02 was green on a real phone,
# showing three sets, while the server held two: the outbox stranded the third
# and no assertion about the screen could have known.
#
# Usage:
#   bash scripts/e2e.sh                  # everything, in dependency order
#   bash scripts/e2e.sh ac-02            # one criterion
#   HOST=10.0.0.4:8081 bash scripts/e2e.sh
#
# Order matters: AC-04 reads the session AC-02 completes. The seed runs once at
# the start rather than between flows, for the same reason.
set -uo pipefail
cd "$(dirname "$0")/.."

# java is NOT on PATH on this machine: Homebrew's openjdk@17 is installed but
# unlinked. Maestro and the Android tools both need it.
JDK=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home
[ -d "$JDK" ] && export JAVA_HOME="$JDK" && export PATH="$JDK/bin:$PATH"
export PATH="$PATH:$HOME/.maestro/bin"

LAN=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo 127.0.0.1)
HOST="${HOST:-$LAN:8081}"
EMAIL="${EMAIL:-demo@volt.app}"
PASSWORD="${PASSWORD:-voltdemo1234}"
FLOWS=apps/mobile/.maestro

bold() { printf '\n\033[1m%s\033[0m\n' "$1"; }
fail() { printf '\033[31m✗ %s\033[0m\n' "$1"; }
pass() { printf '\033[32m✓ %s\033[0m\n' "$1"; }

failures=0

seed() {
  ( cd services/api && uv run python scripts/seed_demo.py ) >/dev/null 2>&1
}

# The offline flow needs the API unreachable while Metro stays up — see the
# header of offline-1-log-online.yaml for why airplane mode cannot do this.
api_stop() {
  local pids
  pids=$(lsof -ti :8000 2>/dev/null)
  [ -n "$pids" ] && kill $pids 2>/dev/null
  for _ in $(seq 1 20); do
    curl -sf --max-time 1 http://localhost:8000/v1/openapi.json >/dev/null 2>&1 || return 0
    sleep 1
  done
  return 1
}

api_start() {
  # </dev/null matters: without it the restarted server inherits this script's
  # stdin, and when e2e.sh is run through a pipe the reader never sees EOF. The
  # script finishes, the results never appear, and it looks like a hang.
  ( cd services/api && nohup uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 \
      </dev/null >/tmp/volt-api.log 2>&1 & )
  for _ in $(seq 1 60); do
    curl -sf --max-time 1 http://localhost:8000/v1/openapi.json >/dev/null 2>&1 && return 0
    sleep 1
  done
  return 1
}

flow() {
  maestro test -e "EMAIL=$EMAIL" -e "PASSWORD=$PASSWORD" -e "HOST=$HOST" "$FLOWS/$1"
}

run_one() {
  local id="$1" flow="$2"
  shift 2
  bold "$id"
  # Re-seeded per flow, not once per suite. AC-04 starts a workout to look at
  # the previous-performance strip and necessarily leaves it open, and E-01
  # shows ONLY "You're mid-workout" while a session is open — so the next flow
  # finds no plan day and fails on a selector. The seed cancels whatever is
  # open and leaves completed history alone, which is exactly the guarantee.
  seed
  if ! maestro test -e "EMAIL=$EMAIL" -e "PASSWORD=$PASSWORD" -e "HOST=$HOST" "$FLOWS/$flow"; then
    fail "$id — the flow did not complete"
    failures=$((failures + 1))
    return
  fi
  # The flow passing only means the screen agreed. Ask the server.
  if ! python3 scripts/assert_ac.py "$id" "$@"; then
    fail "$id — the screen agreed but the server did not"
    failures=$((failures + 1))
    return
  fi
  pass "$id proven on the device AND in the database"
}

bold "Seeding the known state"
( cd services/api && uv run python scripts/seed_demo.py ) || {
  fail "seed failed — is the API up on :8000?"; exit 1;
}

WANT="${1:-all}"

if [ "$WANT" = all ] || [ "$WANT" = ac-01 ]; then
  run_one ac-01 ac-01-build-chest-workout.yaml --day Chest
fi
if [ "$WANT" = all ] || [ "$WANT" = ac-02 ]; then
  run_one ac-02 ac-02-record-every-set.yaml --sets 3 --load 80 --reps 8
fi
if [ "$WANT" = all ] || [ "$WANT" = ac-04 ]; then
  run_one ac-04 ac-04-previous-performance.yaml --exercise "Barbell Bench Press"
fi
if [ "$WANT" = all ] || [ "$WANT" = offline ]; then
  # No assert_ac.py criterion of its own: what it proves — every set present
  # exactly once after a kill and a reconnect — is AC-02's check re-run against
  # a session that was logged with the radio off.
  bold "offline"
  seed
  # Three flows with the server taken away in the middle. The API always comes
  # back, including on a failure — leaving a developer's API dead because a
  # test failed is not an acceptable way to report it.
  ok=1
  flow offline-1-log-online.yaml || ok=0
  if [ "$ok" = 1 ]; then
    api_stop || { fail "could not stop the API"; ok=0; }
  fi
  [ "$ok" = 1 ] && { flow offline-2-queue-and-relaunch.yaml || ok=0; }
  api_start || { fail "the API did not come back up"; ok=0; }
  [ "$ok" = 1 ] && { flow offline-3-drain.yaml || ok=0; }
  # Same check as AC-02, against a session that was logged with the server gone:
  # three sets, dense, and one row per client_id however often it was replayed.
  [ "$ok" = 1 ] && { python3 scripts/assert_ac.py ac-02 --sets 3 --load 80 --reps 8 || ok=0; }

  if [ "$ok" = 1 ]; then
    pass "logging survived the server going away, a force-quit and a relaunch (I8, I10)"
  else
    fail "offline flow"
    failures=$((failures + 1))
  fi
fi

bold "Result"
if [ "$failures" -eq 0 ]; then
  pass "every requested criterion holds on the device and on the server"
else
  fail "$failures failed"
fi
exit $((failures > 0))
