#!/usr/bin/env bash
# The Google Play phone screenshots, from the real app on an emulator.
#
#   bash scripts/store-screenshots.sh            # emulator-5554, local API
#   DEVICE=emulator-5556 bash scripts/store-screenshots.sh
#
# Needs: the API on :8000 and a release build installed (scripts/build-release-apk.sh
# with API_URL=http://localhost:8000). Starts the AI worker if it is not running.
#
# What it does, and why:
#   · seeds store@fitlog.app (services/api/scripts/seed_screenshots.py) — eight
#     weeks of believable use, not the demo account the acceptance flows dirty;
#   · makes the screen 1080×1920: Play refuses a screenshot whose long side is
#     more than twice the short one, and a modern emulator is 20:9;
#   · freezes the status bar (demo mode: 18:30, full signal, no notifications);
#   · runs .maestro/store-screenshots.yaml and puts six PNGs in
#     docs/store/screenshots/android/;
#   · puts the screen and status bar back however it exits.
#
# App Store screenshots need the iOS build (6.9" and 6.5" iPhone sets) — this
# does not fake them from Android.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEVICE="${DEVICE:-emulator-5554}"
OUT="$ROOT/docs/store/screenshots/android"
FLOW="$ROOT/apps/mobile/.maestro/store-screenshots.yaml"
API="${FITLOG_API:-http://localhost:8000}"
export PATH="$PATH:$HOME/.maestro/bin:$HOME/Library/Android/sdk/platform-tools"
# Maestro needs a JDK; the release build's is the one this machine has.
if [ -z "${JAVA_HOME:-}" ] && [ -d /opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home ]; then
  export JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home
  export PATH="$JAVA_HOME/bin:$PATH"
fi

case "$DEVICE" in
  emulator-*) ;;
  *) echo "Refusing to resize $DEVICE: this changes the display, so it runs on an emulator only." >&2; exit 1 ;;
esac

adbd() { adb -s "$DEVICE" "$@"; }
demo() { adbd shell am broadcast -a com.android.systemui.demo -e command "$@" >/dev/null; }

restore() {
  demo exit || true
  adbd shell wm size reset >/dev/null 2>&1 || true
}
trap restore EXIT

curl -sf --max-time 3 "$API/health" >/dev/null || {
  echo "The API is not answering at $API — start it first (docs/03 §11)." >&2; exit 1;
}
if ! pgrep -f "app.worker" >/dev/null; then
  ( cd "$ROOT/services/api" && nohup uv run python -m app.worker </dev/null >/tmp/fitlog-worker.log 2>&1 & )
fi

echo "› seeding the screenshot account"
( cd "$ROOT/services/api" && FITLOG_API="$API" uv run python scripts/seed_screenshots.py )

TOKEN=$(curl -sf -X POST "$API/v1/auth/login" -H 'content-type: application/json' \
  -d '{"email":"store@fitlog.app","password":"fitlogstore1234"}' |
  python3 -c "import sys, json; print(json.load(sys.stdin)['data']['access_token'])")
BENCH_ID=$(curl -sf "$API/v1/exercises?q=barbell%20bench%20press&limit=5" -H "authorization: Bearer $TOKEN" |
  python3 -c "import sys, json; print(next(e['id'] for e in json.load(sys.stdin)['data'] if e['name'] == 'Barbell Bench Press'))")

echo "› preparing $DEVICE"
adbd reverse tcp:8000 tcp:8000 >/dev/null
adbd shell wm size 1080x1920
adbd shell settings put global sysui_demo_allowed 1
demo enter
demo clock -e hhmm 1830
demo battery -e level 100 -e plugged false
demo network -e wifi show -e level 4 -e fully true
demo network -e mobile show -e datatype none -e level 4 -e fully true
demo notifications -e visible false

echo "› capturing"
RUN=$(mktemp -d)
maestro --device "$DEVICE" test --test-output-dir "$RUN" -e "BENCH_ID=$BENCH_ID" "$FLOW"
# takeScreenshot files land in <output dir>/<run>/<flow>/takeScreenshot/.
mkdir -p "$OUT"
find "$RUN" -path '*/takeScreenshot/*.png' -exec cp {} "$OUT"/ \;
rm -rf "$RUN"

ls -1 "$OUT"/*.png
echo "✓ Play phone screenshots in ${OUT#"$ROOT"/}"
