#!/usr/bin/env bash
#
# TODO 2.2 · the release numbers: cold start and tap → set p95 on an installed
# RELEASE build, not Expo Go and not the dev bundle.
#
# Build it first (generated native project, never committed):
#
#   cd apps/mobile
#   EXPO_PUBLIC_API_URL=http://<LAN IP>:8000 npx expo prebuild --platform android --no-install
#   # LAN HTTP to the local API: add android:usesCleartextTraffic="true" to
#   # <application> in android/app/src/main/AndroidManifest.xml. app.json's
#   # splash has no image but the generated theme names one: add a 1dp
#   # transparent shape as android/app/src/main/res/drawable/splashscreen_logo.xml
#   cd android && EXPO_PUBLIC_API_URL=… EXPO_PUBLIC_MEASURE=1 ./gradlew assembleRelease
#
# EXPO_PUBLIC_MEASURE=1 puts the latency reading on screen in a release bundle,
# which is where the p95 is read from. Then:
#
#   bash scripts/measure-release.sh
set -uo pipefail
cd "$(dirname "$0")/.."

JDK=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home
[ -d "$JDK" ] && export JAVA_HOME="$JDK" && export PATH="$JDK/bin:$PATH"
export PATH="$PATH:$HOME/.maestro/bin:$HOME/Library/Android/sdk/platform-tools"
export MAESTRO_DRIVER_STARTUP_TIMEOUT="${MAESTRO_DRIVER_STARTUP_TIMEOUT:-120000}"

APK="${APK:-apps/mobile/android/app/build/outputs/apk/release/app-release.apk}"
DEVICE="${DEVICE:-$(adb devices | awk '/\tdevice$/{print $1}' | head -1)}"
TRIALS="${TRIALS:-5}"
OUT="${OUT:-docs/measurements/release-build.md}"
FLOWS=apps/mobile/.maestro

[ -f "$APK" ] || { printf '\033[31m✗ no APK at %s — build it first (see the header)\033[0m\n' "$APK"; exit 1; }
[ -n "$DEVICE" ] || { printf '\033[31m✗ no device\033[0m\n'; exit 1; }


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
printf '\n\033[1mInstalling %s\033[0m\n' "$APK"
wait_for_idle_phone "$DEVICE"
adb -s "$DEVICE" install -r "$APK" >/dev/null || { printf '\033[31m✗ install failed\033[0m\n'; exit 1; }
APK_BYTES=$(stat -f %z "$APK")

printf '\n\033[1mSeeding and signing in\033[0m\n'
( cd services/api && uv run python scripts/seed_demo.py ) >/dev/null || { printf '\033[31m✗ seed failed\033[0m\n'; exit 1; }
maestro --device "$DEVICE" test "$FLOWS/sign-in-release.yaml" >/dev/null 2>&1 || {
  printf '\033[31m✗ sign-in did not reach the dashboard\033[0m\n'; exit 1; }

printf '\n\033[1mCold start → dashboard, %s trials\033[0m\n' "$TRIALS"
# Read from the platform log, not a test driver: process start (ActivityManager's
# "Start proc") to the app's own VOLT_DASHBOARD_READY line, both stamped by
# logcat. A first attempt timed it with Maestro and read ~6 s for a build whose
# first frame was under 1 s — the driver's own launch and polling were most of it.
SAMPLES=(); FRAMES=()
for i in $(seq 1 "$TRIALS"); do
  wait_for_idle_phone "$DEVICE"
  adb -s "$DEVICE" shell am force-stop com.volt.app
  sleep 2
  adb -s "$DEVICE" logcat -c >/dev/null 2>&1
  frame=$(adb -s "$DEVICE" shell am start -W -n com.volt.app/.MainActivity 2>/dev/null | awk -F': ' '/TotalTime/{print $2}' | tr -d '\r')
  ms=""
  for _ in $(seq 1 60); do
    if adb -s "$DEVICE" logcat -d 2>/dev/null | grep -q "VOLT_DASHBOARD_READY"; then
      ms=$(adb -s "$DEVICE" logcat -d -v epoch 2>/dev/null | python3 -c '
import re, sys
start = ready = None
for line in sys.stdin:
    parts = line.split()
    if not parts:
        continue
    if start is None and re.search(r"Start proc \d+:com\.volt\.app/", line):
        start = float(parts[0])
    if ready is None and "VOLT_DASHBOARD_READY" in line:
        ready = float(parts[0])
print(round((ready - start) * 1000) if start and ready else "")')
      break
    fi
    sleep 0.5
  done
  printf '  trial %s: %s ms to the dashboard (first frame %s ms)\n' "$i" "${ms:-none}" "${frame:-none}"
  [ -n "${ms:-}" ] && SAMPLES+=("$ms")
  [ -n "${frame:-}" ] && FRAMES+=("+${frame}ms")
done
[ "${#SAMPLES[@]}" -gt 0 ] || { printf '\033[31m✗ no usable cold-start trials\033[0m\n'; exit 1; }
COLD=$(printf '%s\n' "${SAMPLES[@]}" | python3 -c '
import statistics, sys
xs = sorted(int(l) for l in sys.stdin if l.strip())
print(f"median {statistics.median(xs):.0f} ms · best {xs[0]} ms · worst {xs[-1]} ms · n={len(xs)}")')

if [ "${SKIP_P95:-0}" = "1" ]; then
  P95="${P95_READING:-not re-measured in this run}"
else
printf '\n\033[1mtap → set, 100 commits\033[0m\n'
( cd services/api && uv run python scripts/seed_demo.py ) >/dev/null
maestro --device "$DEVICE" test "$FLOWS/measure-commit-p95-release.yaml" >/dev/null 2>&1 || {
  printf '\033[31m✗ the p95 flow did not complete\033[0m\n'; exit 1; }
HIER=$(mktemp)
maestro --device "$DEVICE" hierarchy > "$HIER" 2>/dev/null
P95=$(python3 - "$HIER" <<'PY'
import json, sys
found = []
def walk(n):
    t = (n.get('attributes', {}).get('text', '') or '').strip()
    if 'tap' in t and 'p95' in t:
        found.append(' '.join(t.split()))
    for c in n.get('children', []) or []:
        walk(c)
walk(json.load(open(sys.argv[1])))
print(found[0] if found else '')
PY
)
rm -f "$HIER"
[ -n "$P95" ] || { printf '\033[31m✗ no latency reading on screen — built without EXPO_PUBLIC_MEASURE=1?\033[0m\n'; exit 1; }
fi

MODEL=$(adb -s "$DEVICE" shell getprop ro.product.model | tr -d '\r')
ANDROID=$(adb -s "$DEVICE" shell getprop ro.build.version.release | tr -d '\r')
WHEN=$(date '+%Y-%m-%d %H:%M')
FRAME_LINE="not reported"; [ "${#FRAMES[@]}" -gt 0 ] && FRAME_LINE=$(printf '%s ' "${FRAMES[@]}")

printf '\n  cold start: %s\n  tap → set:  %s\n\n' "$COLD" "$P95"
cat > "$OUT" <<EOF
# Release build · measured

<!-- Written by scripts/measure-release.sh. Re-run it rather than editing this. -->

The numbers TODO 2.2 said were unmeasured: an installed **release** APK
(\`assembleRelease\`, Hermes bytecode in the APK, no Metro, no Expo Go).

| | |
|---|---|
| **Cold start → dashboard** | \`$COLD\` · budget < 2.5 s |
| Android's first frame | \`$FRAME_LINE\` |
| **tap → set rendered** | \`$P95\` · budget p95 < 100 ms (D16) |
| APK | $APK_BYTES bytes |
| Device | $MODEL, Android $ANDROID |
| Measured | $WHEN |

**What differs from a store build.** Signed with the debug key, and
\`usesCleartextTraffic\` is on so it can reach the API on the LAN over HTTP; the
reading line is compiled in (\`EXPO_PUBLIC_MEASURE=1\`). None of these is on the
measured paths.

**What the spans cover.** Cold start: from the process starting (logcat's
\`Start proc\`) to the app logging \`VOLT_DASHBOARD_READY\` — the moment the
dashboard has its data, including its one API call over Wi-Fi — both stamped
by logcat. *First frame* is \`am start -W\`'s TotalTime.
tap → set: \`performance.now()\` at the top of the tap handler to a frame after
the commit (commitTiming.ts), excluding the upload (I10).
EOF
printf 'written to %s\n' "$OUT"
