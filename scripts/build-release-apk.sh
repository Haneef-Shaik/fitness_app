#!/usr/bin/env bash
#
# A release APK the acceptance flows can drive: CI's E2E job and a laptop build
# the same thing, with no hand edits to the generated native project.
#
#   API_URL=http://192.168.1.3:8000 bash scripts/build-release-apk.sh   # the phone, over the LAN
#   API_URL=http://localhost:8000    bash scripts/build-release-apk.sh   # an emulator (adb reverse)
#   FRESH=1 … bash scripts/build-release-apk.sh                          # re-run expo prebuild
#
#   STORE=1 API_URL=https://api.example.com \
#   FITLOG_UPLOAD_STORE_FILE=/abs/upload.jks FITLOG_UPLOAD_STORE_PASSWORD=… \
#   FITLOG_UPLOAD_KEY_ALIAS=… FITLOG_UPLOAD_KEY_PASSWORD=… bash scripts/build-release-apk.sh
#       a STORE build: HTTPS only, no cleartext, signed with the upload key
#       (plugins/withReleaseSigning.js), and checked for all three afterwards.
#
# Output: apps/mobile/android/app/build/outputs/apk/release/app-release.apk
#         …/bundle/release/app-release.aab as well with STORE=1 — Google Play
#         takes only App Bundles for new apps; the APK is what gets checked
#         (same manifest, same signing config) and what E2E installs.
#
#   FITLOG_VERSION=1.0.0 FITLOG_BUILD_NUMBER=12   the store numbers (app.config.js)
#
# Without STORE=1 it is NOT a store build. Two things differ, both because the
# API here is plain HTTP on a developer machine:
#   - the manifest allows cleartext traffic (a store build talks HTTPS);
#   - it is signed with the debug key the generated project ships with.
# EXPO_PUBLIC_MEASURE is left unset: the latency overlay stays out.
#
# Crash reporting (docs/12 §8): EXPO_PUBLIC_SENTRY_DSN is inlined into the
# bundle when set, and without it the app sends nothing. The Sentry config
# plugin uploads source maps on every release build and FAILS the build when it
# cannot, so the upload runs only when SENTRY_AUTH_TOKEN (with SENTRY_ORG and
# SENTRY_PROJECT) is present — a laptop or CI without Sentry still builds.
set -euo pipefail
cd "$(dirname "$0")/../apps/mobile"

: "${API_URL:?set API_URL — the address the APP will use to reach the API}"

# Supabase (docs/14): the app signs in with it directly. A store build must name
# the project; a local build defaults to the local stack (pnpm supabase start)
# on API_URL's host, with its publishable key read from `supabase status` —
# public by design, and still never written into the repository.
if [ -z "${SUPABASE_URL:-}" ] || [ -z "${SUPABASE_PUBLISHABLE_KEY:-}" ]; then
  if [ "${STORE:-0}" = 1 ]; then
    echo "STORE=1 needs SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY" >&2; exit 1
  fi
  LOCAL_KEY=$( (cd ../.. && pnpm exec supabase status -o env 2>/dev/null) | sed -n 's/^PUBLISHABLE_KEY="\(.*\)"$/\1/p')
  HOST="${API_URL#*://}"; HOST="${HOST%%/*}"; HOST="${HOST%%:*}"
  SUPABASE_URL="${SUPABASE_URL:-http://$HOST:54321}"
  SUPABASE_PUBLISHABLE_KEY="${SUPABASE_PUBLISHABLE_KEY:-$LOCAL_KEY}"
  [ -n "$SUPABASE_PUBLISHABLE_KEY" ] || {
    echo "no SUPABASE_PUBLISHABLE_KEY, and no local Supabase answering (pnpm supabase start)" >&2; exit 1;
  }
fi

export JAVA_HOME="${JAVA_HOME:-/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home}"
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
[ -d "$JAVA_HOME" ] && export PATH="$JAVA_HOME/bin:$PATH"

STORE="${STORE:-0}"
if [ "$STORE" = 1 ]; then
  case "$API_URL" in https://*) ;; *) echo "STORE=1 needs an https:// API_URL" >&2; exit 1 ;; esac
  case "$SUPABASE_URL" in https://*) ;; *) echo "STORE=1 needs an https:// SUPABASE_URL" >&2; exit 1 ;; esac
  for v in FITLOG_UPLOAD_STORE_FILE FITLOG_UPLOAD_STORE_PASSWORD FITLOG_UPLOAD_KEY_ALIAS FITLOG_UPLOAD_KEY_PASSWORD; do
    [ -n "${!v:-}" ] || { echo "STORE=1 needs $v" >&2; exit 1; }
  done
  [ -f "$FITLOG_UPLOAD_STORE_FILE" ] || { echo "no keystore at $FITLOG_UPLOAD_STORE_FILE" >&2; exit 1; }
  FRESH=1   # a dev build's cleartext patch must not survive into a store build
fi

if [ "${FRESH:-0}" = 1 ] || [ ! -d android ]; then
  npx expo prebuild --platform android --no-install --clean
fi

# 1 · Cleartext HTTP to the dev API. Prebuild writes it only into the DEBUG
# manifest; without it a release build's every request fails, and the app shows
# a network error that has nothing to do with the network.
MANIFEST=android/app/src/main/AndroidManifest.xml
if [ "$STORE" != 1 ] && ! grep -q 'usesCleartextTraffic' "$MANIFEST"; then
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

if [ -z "${SENTRY_AUTH_TOKEN:-}" ]; then
  export SENTRY_DISABLE_AUTO_UPLOAD="${SENTRY_DISABLE_AUTO_UPLOAD:-true}"
fi

cd android
# The JS bundle is where EXPO_PUBLIC_* values are inlined, and Gradle does not
# count environment variables as inputs: without this, a build with a new
# API_URL (or EXPO_PUBLIC_MEASURE) reused the last bundle and produced an APK
# that said one API and called another (found measuring on a phone, 26 Sep).
rm -rf app/build/generated/assets/react app/build/generated/sourcemaps/react \
  app/build/intermediates/sourcemaps/react
EXPO_PUBLIC_API_URL="$API_URL" EXPO_PUBLIC_SUPABASE_URL="$SUPABASE_URL" \
  EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY="$SUPABASE_PUBLISHABLE_KEY" \
  ./gradlew assembleRelease --no-daemon -q
APK=app/build/outputs/apk/release/app-release.apk
# Checked, not assumed: the address the app will call is the one asked for.
# Host and port, not the whole URL: Hermes packs its string table with shared
# prefixes, so the scheme may be stored run into the string before it.
# -c, not -q: under pipefail, -q's early exit kills unzip with SIGPIPE and the
# pipeline fails even when the address is there.
for URL in "$API_URL" "$SUPABASE_URL"; do
  HOST_PORT="${URL#*://}"; HOST_PORT="${HOST_PORT%%/*}"
  unzip -p "$APK" assets/index.android.bundle | LC_ALL=C grep -a -c -F "$HOST_PORT" >/dev/null \
    || { echo "✗ the APK's bundle does not call $HOST_PORT — a stale bundle?" >&2; exit 1; }
done
if [ "$STORE" = 1 ]; then
  # Checked, not assumed: the three things that make it a store build.
  BT=$(ls -d "$ANDROID_HOME"/build-tools/* | sort -V | tail -1)
  "$BT/aapt2" dump xmltree --file AndroidManifest.xml "$APK" | grep -q usesCleartextTraffic \
    && { echo "✗ the store APK allows cleartext traffic" >&2; exit 1; }
  "$BT/apksigner" verify --print-certs "$APK" | grep -q "CN=Android Debug" \
    && { echo "✗ the store APK is signed with the debug key" >&2; exit 1; }
  echo "✓ store build: HTTPS API, no cleartext, signed with the upload key"
  "$BT/apksigner" verify --print-certs "$APK" | grep "certificate DN"

  # The bundle Play actually receives, from the same prebuild and signing config.
  EXPO_PUBLIC_API_URL="$API_URL" EXPO_PUBLIC_SUPABASE_URL="$SUPABASE_URL" \
    EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY="$SUPABASE_PUBLISHABLE_KEY" \
    ./gradlew bundleRelease --no-daemon -q
  AAB=app/build/outputs/bundle/release/app-release.aab
  "$JAVA_HOME/bin/jarsigner" -verify -certs "$AAB" >/dev/null \
    || { echo "✗ the bundle is not signed" >&2; exit 1; }
  "$JAVA_HOME/bin/jarsigner" -verify -verbose -certs "$AAB" | grep -q "CN=Android Debug" \
    && { echo "✗ the bundle is signed with the debug key" >&2; exit 1; }
  echo "✓ bundle: apps/mobile/android/$AAB — upload this one to Play"
fi
echo "built: apps/mobile/android/app/build/outputs/apk/release/app-release.apk (API $API_URL, Supabase $SUPABASE_URL)"
