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

LAN=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo 127.0.0.1)
HOST="${HOST:-$LAN:8081}"
# The flow carries its own literal count (Maestro will not interpolate one).
# measure-commit-p95-short.yaml is the 10-sample variant.
OUT="${OUT:-docs/measurements/commit-p95.md}"

FLOW="${FLOW:-measure-commit-p95.yaml}"
printf '\n\033[1mRunning %s on the device\033[0m\n' "$FLOW"
maestro test -e "HOST=$HOST" \
  "apps/mobile/.maestro/$FLOW" || {
  printf '\033[31m✗ the measurement flow did not complete\033[0m\n'; exit 1;
}

# The reading is on screen; take it from the accessibility tree rather than a
# screenshot, so it is text and not something a human has to squint at.
HIER=$(mktemp)
maestro hierarchy > "$HIER" 2>/dev/null

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
  printf '\033[31m✗ no reading on screen — is this a __DEV__ build?\033[0m\n'
  exit 1
fi

DEVICE=$(adb shell getprop ro.product.model 2>/dev/null | tr -d '\r')
ANDROID=$(adb shell getprop ro.build.version.release 2>/dev/null | tr -d '\r')
WHEN=$(date '+%Y-%m-%d %H:%M')

printf '\n\033[1mH4.3\033[0m\n  %s\n  on %s (Android %s)\n\n' "$LINE" "$DEVICE" "$ANDROID"

mkdir -p "$(dirname "$OUT")"
cat > "$OUT" <<EOF
# tap → set rendered · measured

<!-- Written by scripts/measure-p95.sh. Re-run it rather than editing this. -->

| | |
|---|---|
| **Reading** | \`$LINE\` |
| Device | $DEVICE, Android $ANDROID |
| Build | Expo Go over LAN, \`__DEV__\` (a release build can only be faster) |
| Flow | \`$FLOW\` |
| Measured | $WHEN |
| Budget | p95 < 100 ms (D16) |

**What the span covers.** \`performance.now()\` at the top of the tap handler, to a
\`requestAnimationFrame\` inside \`runAfterInteractions\` after the commit — so it
includes validate → reduce → publish → paint, and excludes the upload, which is
not on the commit path (I10).

**Why a dev build.** DR4 rules out a release build on this machine. The number is
therefore pessimistic: it carries the dev bundle's overhead. It is reported as
measured rather than adjusted.
EOF
printf 'written to %s\n' "$OUT"
