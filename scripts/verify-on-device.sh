#!/usr/bin/env bash
#
# G4 — prove the three claims that only native hardware can answer.
#
#   1. expo-sqlite opens (D14 has never executed a line of sqlite.ts)
#   2. a draft survives a force-quit and relaunch (the half web cannot do)
#   3. tap -> set rendered, p95, measured rather than asserted (H4.3)
#
# Usage:  bash scripts/verify-on-device.sh
#
# It starts nothing destructive and changes no files. It reports what it finds
# and tells you the next action.
set -uo pipefail
cd "$(dirname "$0")/.."

# java is NOT on PATH on this machine: Homebrew's openjdk@17 is installed but
# unlinked. Maestro and the Android tools both need it.
JDK=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home
[ -d "$JDK" ] && export JAVA_HOME="$JDK" && export PATH="$JDK/bin:$PATH"
export PATH="$PATH:$HOME/.maestro/bin"
ADB=/opt/homebrew/share/android-commandlinetools/platform-tools/adb

say()  { printf '\n\033[1m%s\033[0m\n' "$1"; }
ok()   { printf '  \033[32m✓\033[0m %s\n' "$1"; }
no()   { printf '  \033[31m✗\033[0m %s\n' "$1"; }
info() { printf '    %s\n' "$1"; }

LAN=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "")

say "Servers"
if curl -s -o /dev/null --max-time 2 "http://${LAN:-127.0.0.1}:8000/v1/openapi.json"; then
  ok "API reachable on http://$LAN:8000"
else
  no "API not reachable on the LAN"
  info "cd services/api && uv run uvicorn app.main:app --host 0.0.0.0 --port 8000"
fi
if curl -s -o /dev/null --max-time 2 "http://${LAN:-127.0.0.1}:8081/"; then
  ok "Metro reachable — open Expo Go at exp://$LAN:8081"
else
  no "Metro not reachable"
  info "cd apps/mobile && EXPO_PUBLIC_API_URL=http://$LAN:8000 npx expo start --lan"
fi

say "Target"
TARGET=none
if [ -x "$ADB" ] && [ -n "$($ADB devices 2>/dev/null | tail -n +2 | grep -w device)" ]; then
  TARGET=android
  ok "Android device over adb: $($ADB devices | tail -n +2 | grep -w device | head -1 | cut -f1)"
elif command -v java >/dev/null 2>&1; then
  no "No adb device"
  info "Android: enable Developer options -> USB debugging, then plug in."
  info "iPhone:  Expo Go works, but Maestro cannot drive it without Xcode,"
  info "         which is not installed here. Use the manual checks below."
else
  no "No adb device and no java on PATH"
fi

say "Tooling"
command -v maestro >/dev/null 2>&1 && ok "maestro $(maestro --version 2>/dev/null | tail -1)" \
  || no "maestro not on PATH (export PATH=\"\$PATH:\$HOME/.maestro/bin\")"
command -v java >/dev/null 2>&1 && ok "java $(java -version 2>&1 | head -1 | cut -d'"' -f2)" \
  || no "java not found — Maestro needs it"

if [ "$TARGET" = android ]; then
  say "Running the Maestro flows"
  maestro test apps/mobile/.maestro/
  exit $?
fi

say "Manual checks (no adb device)"
cat <<'STEPS'
  Open the app in Expo Go, then:

  1. SQLite opens (D14)
     Watch the Metro console. On a native target it must log:
         [db] open (sqlite)
     If it logs (memory), Metro resolved index.web.ts and this is not a native
     target. If it throws "Cannot find native module 'ExpoSQLite'", D14 is wrong.

  2. Kill-and-relaunch (the half web cannot do)
     Start a workout, log two sets, turn on airplane mode, log two more, then
     FORCE-QUIT the app (swipe it away — not just background it).
     Reopen it. Expect: "You're mid-workout", Resume, and all four sets present
     with the last two reading "Waiting to sync".
     Turn the radio back on. They should go "Synced" with no duplicates.

  3. tap -> set rendered, p95 (H4.3)
     Log at least 20 sets. Under the Finish button in a dev build there is a
     line reading:
         tap -> rendered · p50 X ms · p95 Y ms · worst Z ms · n=N
     Write down p95. The budget is < 100 ms (D16). That number is H4.3 and
     nothing else can stand in for it.
STEPS
