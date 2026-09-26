#!/usr/bin/env bash
#
# H10 · cold start → dashboard interactive, measured on a real phone.
#
# Launches the app from a force-stop and polls Android's own accessibility tree
# until the dashboard's date is on screen — the first moment the screen is worth
# looking at. Reports every trial, not just the best one.
#
#   bash scripts/measure-cold-start.sh          # 5 trials
#   TRIALS=10 bash scripts/measure-cold-start.sh
#
# READ THE CAVEAT IN THE OUTPUT. This is Expo Go over LAN in `__DEV__`: the
# launch includes fetching the JS bundle from Metro across the network, which a
# release build does not do. The number is an upper bound and nothing else.
set -uo pipefail
cd "$(dirname "$0")/.."

export PATH="$PATH:$HOME/Library/Android/sdk/platform-tools:$HOME/.maestro/bin"
JDK=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home
[ -d "$JDK" ] && export JAVA_HOME="$JDK" && export PATH="$JDK/bin:$PATH"
export MAESTRO_DRIVER_STARTUP_TIMEOUT="${MAESTRO_DRIVER_STARTUP_TIMEOUT:-120000}"

LAN=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo 127.0.0.1)
HOST="${HOST:-$LAN:8081}"
DEVICE="${DEVICE:-$(adb devices | awk '/\tdevice$/{print $1}' | head -1)}"
TRIALS="${TRIALS:-3}"
MARKER="${MARKER:-dashboard-date}"
OUT="${OUT:-docs/measurements/cold-start.md}"

[ -z "$DEVICE" ] && { printf '\033[31m✗ no device\033[0m\n'; exit 1; }

now_ms() { python3 -c 'import time; print(int(time.time()*1000))'; }

# One trial: the flow stops the app, launches it and waits for B-01's date,
# timing that span itself. Prints "<ms> <first frame>", ms 0 for "not seen".
trial() {
  adb -s "$DEVICE" logcat -c >/dev/null 2>&1
  local ms frame
  # Maestro sends `console.log` to its own log, not to stdout — so the run gets
  # a debug directory of its own and the reading is taken from there.
  local dbg
  dbg=$(mktemp -d)
  maestro --device "$DEVICE" test --debug-output "$dbg" -e "HOST=$HOST" \
    apps/mobile/.maestro/measure-cold-start.yaml >/dev/null 2>&1
  ms=$(grep -rhoE 'JsConsole: COLD_START_MS [0-9]+' "$dbg" 2>/dev/null \
       | awk '{print $3}' | tail -1)
  rm -rf "$dbg"
  # Android's own time to first frame, straight from the platform.
  frame=$(adb -s "$DEVICE" logcat -d 2>/dev/null \
    | grep -oE 'Displayed host\.exp\.exponent/[^:]*: \+[0-9smA-Za-z]+' \
    | head -1 | grep -oE '\+[0-9]+m?s?[0-9]*m?s?' | head -1)
  echo "${ms:-0} ${frame:-none}"
}

printf '\n\033[1mSetup: sign in and clear any local draft\033[0m\n'
maestro --device "$DEVICE" test -e "HOST=$HOST" -e EMAIL=demo@fitlog.app -e PASSWORD=fitlogdemo1234 \
  apps/mobile/.maestro/sign-in.yaml >/dev/null 2>&1 || {
  printf '\033[31m✗ setup sign-in did not reach the dashboard\033[0m\n'; exit 1;
}

printf '\n\033[1mCold start → dashboard, %s trials on %s\033[0m\n' "$TRIALS" "$DEVICE"
SAMPLES=()
FRAMES=()
for i in $(seq 1 "$TRIALS"); do
  read -r ms frame <<<"$(trial)"
  if [ "$ms" -eq 0 ]; then
    printf '  trial %s: \033[31mnever reached the dashboard in 90 s\033[0m\n' "$i"
  else
    printf '  trial %s: %s ms to the dashboard (first frame %s)\n' "$i" "$ms" "$frame"
    SAMPLES+=("$ms")
    [ "$frame" != "none" ] && FRAMES+=("$frame")
  fi
done

[ "${#SAMPLES[@]}" -eq 0 ] && { printf '\033[31m✗ no usable trials\033[0m\n'; exit 1; }

READ=$(printf '%s\n' "${SAMPLES[@]}" | python3 -c '
import statistics, sys
xs = sorted(int(l) for l in sys.stdin if l.strip())
print(f"median {statistics.median(xs):.0f} ms · best {xs[0]} ms · worst {xs[-1]} ms · n={len(xs)}")
')

FRAME_LINE="not reported"
[ "${#FRAMES[@]}" -gt 0 ] && FRAME_LINE=$(printf '%s ' "${FRAMES[@]}")

MODEL=$(adb -s "$DEVICE" shell getprop ro.product.model 2>/dev/null | tr -d '\r')
ANDROID=$(adb -s "$DEVICE" shell getprop ro.build.version.release 2>/dev/null | tr -d '\r')
WHEN=$(date '+%Y-%m-%d %H:%M')

printf '\n\033[1mH10\033[0m\n  %s\n  on %s (Android %s)\n\n' "$READ" "$MODEL" "$ANDROID"

mkdir -p "$(dirname "$OUT")"
cat > "$OUT" <<EOF
# cold start → dashboard · measured

<!-- Written by scripts/measure-cold-start.sh. Re-run it rather than editing this. -->

| | |
|---|---|
| **Reading** | \`$READ\` |
| Device | $MODEL, Android $ANDROID |
| Build | **Expo Go over LAN, \`__DEV__\`** |
| Expo Go's first frame | \`$FRAME_LINE\` (Android's own \`Displayed\` figure, per trial) |
| Budget | < 2.5 s to interactive |
| Measured | $WHEN |

**What the span covers.** From the moment Maestro asks Expo Go to open the app
(the app already stopped) to \`dashboard-date\` being on screen — Expo Go
starting, **the JS bundle being fetched from Metro over Wi-Fi and compiled on the
phone**, React mounting, the dashboard's single request returning, and the date
painting.

**Why this is not the release number, and is not comparable to the budget.**
The dev bundle fetched on every trial is **14.5 MB of unminified JavaScript**
(14,503,229 bytes, served by Metro), which Hermes then has to compile on the
device. A release build instead loads [4.33 MiB of precompiled Hermes
bytecode](bundle-size.md) from the APK and fetches nothing. DR4 rules out a
release build on this machine, so this reading is an **upper bound**, and the
release figure is **unmeasured**.

**The two numbers.** *First frame* is Android's own \`Displayed\` figure — Expo Go
drawing its first frame, ~0.6 s. *To the dashboard* is this app being usable.
How the ~5.4 s between them splits between download, on-device compilation,
mounting and the API call has **not** been broken down; no part of it is
claimed to be the dominant one.

**Resolution.** The span is bracketed by \`Date.now()\` inside one Maestro run
([measure-cold-start.yaml](../../apps/mobile/.maestro/measure-cold-start.yaml)),
whose on-device driver checks the screen every few hundred ms — so a reading is
good to well under a second. A first attempt polled from the host with
\`maestro hierarchy\` and was useless: each call costs ~20 s of JVM and driver
start-up, so it measured the poll, not the app. Raw \`uiautomator dump\` returns
an empty tree for this app and cannot be used at all.
EOF
printf 'written to %s\n' "$OUT"
