#!/usr/bin/env bash
#
# A release APK the acceptance flows can drive: CI's E2E job and a laptop build
# the same thing, with no hand edits to the generated native project.
#
#   API_URL=http://192.168.1.3:8000 bash scripts/build-release-apk.sh   # the phone, over the LAN
#   API_URL=http://localhost:8000    bash scripts/build-release-apk.sh   # an emulator (adb reverse)
#   FRESH=1 … bash scripts/build-release-apk.sh                          # re-run expo prebuild
#
# Output: apps/mobile/android/app/build/outputs/apk/release/app-release.apk
#
# NOT a store build. Two things differ, both because the API here is plain HTTP
# on a developer machine:
#   - the manifest allows cleartext traffic (a store build talks HTTPS);
#   - it is signed with the debug key the generated project ships with.
# EXPO_PUBLIC_MEASURE is left unset: the latency overlay stays out.
set -euo pipefail
cd "$(dirname "$0")/../apps/mobile"

: "${API_URL:?set API_URL — the address the APP will use to reach the API}"

export JAVA_HOME="${JAVA_HOME:-/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home}"
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
[ -d "$JAVA_HOME" ] && export PATH="$JAVA_HOME/bin:$PATH"

if [ "${FRESH:-0}" = 1 ] || [ ! -d android ]; then
  npx expo prebuild --platform android --no-install --clean
fi

# 1 · Cleartext HTTP to the dev API. Prebuild writes it only into the DEBUG
# manifest; without it a release build's every request fails, and the app shows
# a network error that has nothing to do with the network.
MANIFEST=android/app/src/main/AndroidManifest.xml
if ! grep -q 'usesCleartextTraffic' "$MANIFEST"; then
  sed -i.bak 's/<application /<application android:usesCleartextTraffic="true" /' "$MANIFEST"
  rm -f "$MANIFEST.bak"
fi

# 2 · app.json's splash has a colour and no image, but the theme prebuild
# generates still names @drawable/splashscreen_logo — resource linking fails
# without one. A 1 dp transparent shape is the honest "no image".
LOGO=android/app/src/main/res/drawable/splashscreen_logo.xml
if [ ! -f "$LOGO" ]; then
  mkdir -p "$(dirname "$LOGO")"
  cat > "$LOGO" <<'XML'
<?xml version="1.0" encoding="utf-8"?>
<!-- app.json's splash has no image; the generated theme still names one. -->
<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="rectangle">
  <solid android:color="@android:color/transparent" />
  <size android:width="1dp" android:height="1dp" />
</shape>
XML
fi

cd android
EXPO_PUBLIC_API_URL="$API_URL" ./gradlew assembleRelease --no-daemon -q
echo "built: apps/mobile/android/app/build/outputs/apk/release/app-release.apk (API $API_URL)"
