#!/usr/bin/env bash
# Opens Volt, then turns TalkBack on (Samsung's build; Google's is
# com.google.android.marvin.talkback/.TalkBackService).
set -u
adb shell monkey -p com.volt.app -c android.intent.category.LAUNCHER 1 >/dev/null 2>&1; sleep 2
adb shell settings put secure enabled_accessibility_services \
  com.samsung.android.accessibility.talkback/com.samsung.android.marvin.talkback.TalkBackService
adb shell settings put secure accessibility_enabled 1
sleep 7   # TalkBack binds, speaks "TalkBack on", and may raise its phone-access prompt
