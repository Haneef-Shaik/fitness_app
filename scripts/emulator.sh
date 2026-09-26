#!/usr/bin/env bash
#
# The Android emulator, set up so `scripts/e2e.sh` can drive it exactly like the
# phone did. DR4's mitigation without borrowing hardware.
#
#   bash scripts/emulator.sh start     # create if needed, boot, wire the ports
#   bash scripts/emulator.sh stop
#   bash scripts/emulator.sh status
#   HEADLESS=1 bash scripts/emulator.sh start
#
# WHY THE PORT FORWARDING MATTERS, and it is not obvious:
#
# Expo serves Metro to an emulator over `adb reverse`, so the app sees Metro at
# `localhost:8081` and `Constants.expoConfig.hostUri` reads "localhost:8081".
# `defaultBase()` takes the host off that and asks for `http://localhost:8000` —
# which, inside the emulator, is the EMULATOR's port 8000. Nothing is there, and
# the app looks broken in a way that has nothing to do with the app.
#
# Reversing 8000 as well makes the emulator's localhost:8000 reach the host's,
# so `defaultBase()` is correct without an emulator special case in app code.
# (10.0.2.2 is the other route to the host, but it would mean teaching the app
# about emulators, and DR4 is about not doing that.)
set -uo pipefail
cd "$(dirname "$0")/.."

export JAVA_HOME="${JAVA_HOME:-/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home}"
# A USER-OWNED sdk root. Homebrew's android-commandlinetools lives under
# /opt/homebrew and is not writable, so `sdkmanager` there fails with "Failed to
# read or create install properties file" and installs nothing while exiting 0.
# Writing into a Homebrew prefix would also be undone by the next `brew upgrade`.
# ~/Library/Android/sdk is where the Android tooling expects an SDK anyway.
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$ANDROID_HOME/cmdline-tools/latest/bin:$PATH"

AVD="${AVD:-fitlog-test}"
IMAGE="${IMAGE:-system-images;android-34;google_apis;arm64-v8a}"
DEVICE="${DEVICE:-pixel_6}"

bold() { printf '\n\033[1m%s\033[0m\n' "$1"; }
ok()   { printf '  \033[32m✓\033[0m %s\n' "$1"; }
no()   { printf '  \033[31m✗\033[0m %s\n' "$1"; }
info() { printf '    %s\n' "$1"; }

emulator_serial() {
  adb devices | awk '/^emulator-/ { print $1; exit }'
}

# EVERY adb call here goes to the emulator, never to "whichever device is
# attached". With a phone plugged in and the emulator not (yet) online, a bare
# `adb` is the PHONE — and G10 found this script had switched a real phone's
# animations off and wired its ports while the emulator failed to boot. `-e`
# refuses to run rather than pick the wrong device.
eadb() { adb -e "$@"; }

create_avd() {
  if avdmanager list avd 2>/dev/null | grep -q "Name: $AVD"; then
    tune_avd
    ok "AVD '$AVD' already exists"
    return 0
  fi
  bold "Creating AVD '$AVD'"
  echo "no" | avdmanager create avd -n "$AVD" -k "$IMAGE" -d "$DEVICE" --force >/dev/null 2>&1 \
    || { no "could not create the AVD"; return 1; }
  tune_avd
  ok "created from $IMAGE"
}

# `avdmanager create` writes a profile that does not match how the emulator is
# actually going to be run, and the defaults bite:
#
#   hw.gpu.enabled=no  — contradicts the `-gpu` flag passed on the command line.
#   hw.keyboard=no     — text has to go through the on-screen keyboard, which is
#                        slower and flakier for `inputText`.
#
# Both are set here so the AVD agrees with how it is launched.
tune_avd() {
  local cfg="$HOME/.android/avd/$AVD.avd/config.ini"
  [ -f "$cfg" ] || return 0
  python3 - "$cfg" <<'PY'
import sys
path = sys.argv[1]
want = {"hw.gpu.enabled": "yes", "hw.gpu.mode": "host", "hw.keyboard": "yes"}
lines, seen = [], set()
for line in open(path):
    key = line.split("=", 1)[0].strip()
    if key in want:
        lines.append(f"{key}={want[key]}\n"); seen.add(key)
    else:
        lines.append(line)
for key, value in want.items():
    if key not in seen:
        lines.append(f"{key}={value}\n")
open(path, "w").writelines(lines)
PY
}

wire_ports() {
  # Both directions of the same idea: the app reaches the host's Metro and the
  # host's API through the emulator's own localhost.
  eadb reverse tcp:8081 tcp:8081 >/dev/null 2>&1 && ok "Metro reachable at localhost:8081" \
    || no "could not reverse 8081"
  eadb reverse tcp:8000 tcp:8000 >/dev/null 2>&1 && ok "API reachable at localhost:8000" \
    || no "could not reverse 8000"
}

calm_animations() {
  # Maestro reads a settled view hierarchy; animations are the main source of
  # "it was there a moment ago". Safe here in a way it would not be on someone's
  # phone — this device exists only to be driven.
  for s in window_animation_scale transition_animation_scale animator_duration_scale; do
    eadb shell settings put global "$s" 0 >/dev/null 2>&1
  done
  ok "animations off (Maestro reads a settled hierarchy)"
}

start() {
  command -v emulator >/dev/null 2>&1 || {
    no "the 'emulator' package is not installed"
    info "sdkmanager \"emulator\" \"$IMAGE\""
    exit 1
  }
  create_avd || exit 1

  if [ -n "$(emulator_serial)" ]; then
    ok "an emulator is already running: $(emulator_serial)"
  else
    bold "Booting '$AVD'"
    # Windowed uses the host GPU, which on Apple Silicon is dramatically faster.
    # Headless falls back to software rendering, which is slower but does not
    # need a display server — the shape a CI runner wants.
    local window=(-gpu host)
    [ -n "${HEADLESS:-}" ] && window=(-no-window -gpu swiftshader_indirect)
    # -no-snapshot-load: a restored snapshot can carry a stale Expo Go and a
    # signed-in account, which is exactly the "whose state is this?" problem the
    # sign-in prelude had to be taught to handle.
    nohup emulator -avd "$AVD" -no-snapshot-load -no-boot-anim \
      "${window[@]}" </dev/null >/tmp/fitlog-emulator.log 2>&1 &
    info "log: /tmp/fitlog-emulator.log"

    eadb wait-for-device
    printf '    booting'
    for _ in $(seq 1 120); do
      [ "$(eadb shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" = "1" ] && break
      printf '.'; sleep 2
    done
    printf '\n'
    [ "$(eadb shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" = "1" ] \
      && ok "booted: $(emulator_serial)" || { no "did not finish booting"; exit 1; }
  fi

  bold "Wiring the ports"
  wire_ports
  calm_animations
  status
}

stop() {
  local serial; serial=$(emulator_serial)
  [ -z "$serial" ] && { ok "no emulator running"; return 0; }
  adb -s "$serial" emu kill >/dev/null 2>&1
  ok "stopped $serial"
}

status() {
  bold "Status"
  local serial; serial=$(emulator_serial)
  if [ -n "$serial" ]; then
    ok "emulator: $serial (Android $(eadb shell getprop ro.build.version.release 2>/dev/null | tr -d '\r'))"
  else
    no "no emulator running"
  fi
  eadb reverse --list 2>/dev/null | grep -q 8081 && ok "8081 reversed" || no "8081 not reversed"
  eadb reverse --list 2>/dev/null | grep -q 8000 && ok "8000 reversed" || no "8000 not reversed"
  if eadb shell pm list packages 2>/dev/null | grep -q host.exp.exponent; then
    ok "Expo Go installed"
  else
    no "Expo Go not installed"
    info "cd apps/mobile && npx expo start --android   (installs the SDK-matched build)"
  fi
  printf '\n    Then: HOST=localhost:8081 bash scripts/e2e.sh all\n\n'
}

case "${1:-start}" in
  start)  start ;;
  stop)   stop ;;
  status) status ;;
  *) echo "usage: $0 [start|stop|status]"; exit 2 ;;
esac
