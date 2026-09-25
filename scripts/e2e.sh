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
export PATH="$PATH:$HOME/.maestro/bin:$HOME/Library/Android/sdk/platform-tools"

# Maestro installs a driver APK and talks to it over gRPC. On this phone the
# default startup window is not enough — the symptom is `StatusRuntimeException:
# UNAVAILABLE` and a flow that "did not complete" with no steps, which reads
# like a broken flow and is not one.
export MAESTRO_DRIVER_STARTUP_TIMEOUT="${MAESTRO_DRIVER_STARTUP_TIMEOUT:-120000}"

# With two devices attached (a phone and an emulator) Maestro cannot choose and
# gives up with "0 devices connected". Pin one when there is more than one.
DEVICE="${DEVICE:-$(adb devices | awk '/\tdevice$/{print $1}' | head -1)}"
MAESTRO_DEVICE_ARGS=()
[ -n "$DEVICE" ] && MAESTRO_DEVICE_ARGS=(--device "$DEVICE")

# An emulator reaches the host through its OWN localhost, via the `adb reverse`
# that scripts/emulator.sh sets up; a physical phone reaches it over the LAN.
# Detected rather than configured, because getting it wrong produces a blank app
# and no useful error.
LAN=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo 127.0.0.1)
if [ -z "${HOST:-}" ] && [[ "$DEVICE" == emulator-* ]]; then
  HOST="localhost:8081"
else
  HOST="${HOST:-$LAN:8081}"
fi
EMAIL="${EMAIL:-demo@volt.app}"
# Which app the flows drive. Expo Go (the default) loads the bundle from Metro
# over the LAN; an installed build — CI's release APK — is launched directly:
#   APP_ID=com.volt.app bash scripts/e2e.sh
APP_ID="${APP_ID:-host.exp.exponent}"
PASSWORD="${PASSWORD:-voltdemo1234}"
FLOWS=apps/mobile/.maestro

bold() { printf '\n\033[1m%s\033[0m\n' "$1"; }
fail() { printf '\033[31m✗ %s\033[0m\n' "$1"; }
pass() { printf '\033[32m✓ %s\033[0m\n' "$1"; }


# The phone is someone's phone. A call in progress covers the app, fails the
# flow, and a failure screenshot would capture the call — so wait for it to
# end rather than run through it (G10: two runs landed on calls).
wait_for_idle_phone() {
  local dev="${1:-}"
  local args=(); [ -n "$dev" ] && args=(-s "$dev")
  while adb "${args[@]}" shell dumpsys telephony.registry 2>/dev/null | grep -m1 mCallState | grep -qv "mCallState=0"; do
    printf '  the phone is on a call — waiting\n'; sleep 30
  done
}
failures=0
wait_for_idle_phone "$DEVICE"

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

# Re-applied before every flow, not once at setup. Expo CLI manages the 8081
# rule itself and drops it when Metro restarts — and the symptom is Expo Go's
# generic "Something went wrong", which says nothing about a missing route to
# the bundler. Re-adding an existing rule is a no-op, so this is free.
rewire() {
  # Only when the device under test IS an emulator, and only on it: with a
  # phone attached as well, a bare `adb` is ambiguous (G10).
  case "$DEVICE" in emulator-*) ;; *) return 0 ;; esac
  adb -s "$DEVICE" reverse tcp:8081 tcp:8081 >/dev/null 2>&1
  adb -s "$DEVICE" reverse tcp:8000 tcp:8000 >/dev/null 2>&1
}

flow() {
  rewire
  maestro "${MAESTRO_DEVICE_ARGS[@]}" test -e "EMAIL=$EMAIL" -e "PASSWORD=$PASSWORD" -e "HOST=$HOST" -e "APP_ID=$APP_ID" "$FLOWS/$1"
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
  rewire
  wait_for_idle_phone "$DEVICE"
  if ! maestro "${MAESTRO_DEVICE_ARGS[@]}" test -e "EMAIL=$EMAIL" -e "PASSWORD=$PASSWORD" -e "HOST=$HOST" -e "APP_ID=$APP_ID" "$FLOWS/$flow"; then
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

FIXTURE_DIR=/sdcard/Pictures/VoltE2E
FIXTURE=$FIXTURE_DIR/volt-e2e-meal.jpg
push_fixture() {
  adb -s "$DEVICE" shell mkdir -p "$FIXTURE_DIR"
  adb -s "$DEVICE" push "$FLOWS/fixtures/meal.jpg" "$FIXTURE" >/dev/null
  adb -s "$DEVICE" shell am broadcast -a android.intent.action.MEDIA_SCANNER_SCAN_FILE \
    -d "file://$FIXTURE" >/dev/null
  # The Photo Picker keeps its own copy of the media store and syncs it on its
  # own schedule; opened too soon it shows "No albums" (seen on the emulator).
  sleep 10
}
drop_fixture() {
  adb -s "$DEVICE" shell content delete --uri content://media/external/images/media \
    --where "_display_name=\'volt-e2e-meal.jpg\'" >/dev/null 2>&1
  adb -s "$DEVICE" shell rm -rf "$FIXTURE_DIR"
}

bold "Seeding the known state"
# Reference data FIRST, and every run. It is global and idempotent, and without
# it the food catalog is empty — which G10 discovered on the phone, where
# "Add food" answered *Nothing matches* for every staple in the seed.
( cd services/api && uv run python scripts/seed_catalog.py ) >/dev/null || {
  fail "reference-data seed failed"; exit 1;
}
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
if [ "$WANT" = all ] || [ "$WANT" = ac-07 ]; then
  # G10: the first hardware proof of AC-07. Until now it rested on API and
  # client tests — good ones, but G4 found eight defects on a phone that no
  # suite had caught.
  run_one ac-07 ac-07-log-a-meal.yaml --calories 389
fi
# AC-08 / AC-10 need the AI worker; the stub provider answers, so no key and
# no cost. Started for these two and stopped after, so nothing else runs
# against a queue it did not expect (G10, TODO 3.1).
if [ "$WANT" = all ] || [ "$WANT" = ac-08 ] || [ "$WANT" = ac-10 ]; then
  ( cd services/api && nohup uv run python -m app.worker </dev/null >/tmp/volt-worker.log 2>&1 & echo $! > /tmp/volt-worker.pid )
  if [ "$WANT" = all ] || [ "$WANT" = ac-08 ]; then
    run_one ac-08 ac-08-describe-a-meal.yaml
  fi
  if [ "$WANT" = all ] || [ "$WANT" = ac-10 ]; then
    run_one ac-10 ac-10-correct-and-confirm.yaml
  fi
  if [ "$WANT" = all ] || [ "$WANT" = ac-09 ]; then
    # The camera cannot be handed a picture, but the library can: the fixture
    # goes into its own album, indexed by the media store, and the flow picks
    # it from there — never from the phone owner's own photos. Removed after.
    push_fixture
    run_one ac-09 ac-09-photograph-a-meal.yaml
    drop_fixture
  fi
  pkill -f "app.worker" 2>/dev/null
fi
if [ "$WANT" = all ] || [ "$WANT" = ac-11 ]; then
  # Runs after AC-01/AC-02 on purpose: the training card reads the sessions
  # they leave behind.
  run_one ac-11 ac-11-dashboard-shows-everything.yaml --weight 78.4
fi
if [ "$WANT" = all ] || [ "$WANT" = ac-05 ]; then
  run_one ac-05 ac-05-previous-occurrence.yaml --muscle chest
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
