#!/usr/bin/env bash
# TalkBack off, and the phone's accessibility settings back to "none enabled".
set -u
adb shell settings delete secure enabled_accessibility_services >/dev/null
adb shell settings put secure accessibility_enabled 0
