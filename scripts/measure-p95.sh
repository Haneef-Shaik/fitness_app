#!/usr/bin/env bash
#
# H4.3 · tap → set rendered, p95, measured on a real phone.
#
# Drives 100 commits with Maestro, then reads the number off the device rather
# than off a simulator or a guess. The reading is produced inside the app by
# commitTiming.ts and rendered under __DEV__; this script only runs the flow and
# reports what the device says, together with the device and the conditions —
# a p95 without those is not a measurement.
#
#   bash scripts/measure-p95.sh                              # 100 samples
#   FLOW=measure-commit-p95-short.yaml bash scripts/measure-p95.sh   # 10
set -uo pipefail
cd "$(dirname "$0")/.."

JDK=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home
[ -d "$JDK" ] && export JAVA_HOME="$JDK" && export PATH="$JDK/bin:$PATH"
export PATH="$PATH:$HOME/.maestro/bin"

# Same two device facts as scripts/e2e.sh, and for the same reasons: the driver
# needs a longer window on this phone, and Maestro refuses to choose between two
# attached devices. Getting either wrong looks like a broken flow.
export MAESTRO_DRIVER_STARTUP_TIMEOUT="${MAESTRO_DRIVER_STARTUP_TIMEOUT:-120000}"
DEVICE="${DEVICE:-$(adb devices | awk '/\tdevice$/{print $1}' | head -1)}"
MAESTRO_DEVICE_ARGS=()
[ -n "$DEVICE" ] && MAESTRO_DEVICE_ARGS=(--device "$DEVICE")

LAN=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo 127.0.0.1)
HOST="${HOST:-$LAN:8081}"
# The flow carries its own literal count (Maestro will not interpolate one).
# measure-commit-p95-short.yaml is the 10-sample variant.
OUT="${OUT:-docs/measurements/commit-p95.md}"

FLOW="${FLOW:-measure-commit-p95.yaml}"

# What was measured. The default is the dev bundle; a production bundle is
# measured by pointing HOST at a Metro started with
#   EXPO_PUBLIC_MEASURE=1 expo start --no-dev --minify --port 8082
# and setting PROD=1 (TODO 2.2: the D16 budget is about the build users run).
if [ "${PROD:-0}" = "1" ]; then
  BUILD='Expo Go over LAN, **production bundle** (`--no-dev --minify`, Hermes) — the JS a release build runs; the host app is still Expo Go'
  WHY='**Why not a store build.** DR4: no signing or store pipeline on this machine. A production JS bundle is what differs between the dev build and a release for this path — the commit is JS on the UI thread — so this is the release number for everything but the native host.'
else
  BUILD='Expo Go over LAN, `__DEV__` (a release build can only be faster)'
  WHY='**Why a dev build.** The number is pessimistic: it carries the dev bundle'"'"'s overhead. It is reported as measured rather than adjusted. `PROD=1` measures a production bundle.'
fi

# Seeded first, exactly as scripts/e2e.sh does. A measurement run is not
# special: with sessions already logged today the dashboard's training card
# offers something other than "Start workout", and the flow dies on a selector
# that is only wrong because of what a PREVIOUS run left behind. A measurement
# nobody can reproduce is not a measurement.
printf '\n\033[1mSeeding the known state\033[0m\n'
( cd services/api && uv run python scripts/seed_catalog.py ) >/dev/null || {
  printf '\033[31m✗ reference-data seed failed\033[0m\n'; exit 1;
}
( cd services/api && uv run python scripts/seed_demo.py ) >/dev/null || {
  printf '\033[31m✗ seed failed — is the API up on :8000?\033[0m\n'; exit 1;
}


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
printf '\n\033[1mRunning %s on the device\033[0m\n' "$FLOW"
wait_for_idle_phone "$DEVICE"
maestro "${MAESTRO_DEVICE_ARGS[@]}" test -e "HOST=$HOST" \
  "apps/mobile/.maestro/$FLOW" || {
  printf '\033[31m✗ the measurement flow did not complete\033[0m\n'; exit 1;
}

# The reading is on screen; take it from the accessibility tree rather than a
# screenshot, so it is text and not something a human has to squint at.
HIER=$(mktemp)
maestro "${MAESTRO_DEVICE_ARGS[@]}" hierarchy > "$HIER" 2>/dev/null

LINE=$(python3 - "$HIER" <<'PY'
import json, sys
tree = json.load(open(sys.argv[1]))
found = []
def walk(n):
    t = (n.get('attributes', {}).get('text', '') or '').strip()
    if 'tap' in t and 'p95' in t:
        found.append(' '.join(t.split()))
    for c in n.get('children', []) or []:
        walk(c)
walk(tree)
print(found[0] if found else '')
PY
)
rm -f "$HIER"

if [ -z "$LINE" ]; then
  printf '\033[31m✗ no reading on screen — is this a __DEV__ build, or a production one with EXPO_PUBLIC_MEASURE=1?\033[0m\n'
  exit 1
fi

MODEL=$(adb -s "$DEVICE" shell getprop ro.product.model 2>/dev/null | tr -d '\r')
ANDROID=$(adb -s "$DEVICE" shell getprop ro.build.version.release 2>/dev/null | tr -d '\r')
WHEN=$(date '+%Y-%m-%d %H:%M')

printf '\n\033[1mH4.3\033[0m\n  %s\n  on %s (Android %s)\n\n' "$LINE" "$MODEL" "$ANDROID"

mkdir -p "$(dirname "$OUT")"
cat > "$OUT" <<EOF
# tap → set rendered · measured

<!-- Written by scripts/measure-p95.sh. Re-run it rather than editing this. -->

| | |
|---|---|
| **Reading** | \`$LINE\` |
| Device | $MODEL, Android $ANDROID |
| Build | $BUILD |
| Flow | \`$FLOW\` |
| Measured | $WHEN |
| Budget | p95 < 100 ms (D16) |

**What the span covers.** \`performance.now()\` at the top of the tap handler, to a
\`requestAnimationFrame\` inside \`runAfterInteractions\` after the commit — so it
includes validate → reduce → publish → paint, and excludes the upload, which is
not on the commit path (I10).

$WHY
EOF
printf 'written to %s\n' "$OUT"
