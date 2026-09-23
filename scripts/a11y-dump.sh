#!/usr/bin/env bash
#
# Capture the accessibility tree a screen reader actually reads.
#
# TalkBack does not read the React tree, the styles, or the colours. It reads
# the Android accessibility node tree: `content-description`, `text`, `class`,
# `clickable`, `focusable`, and the order they appear in. This dumps exactly
# that, so a finding is evidence rather than an impression.
#
#   scripts/a11y-dump.sh logger      # names the capture
set -euo pipefail
export PATH="$HOME/Library/Android/sdk/platform-tools:$PATH"

LABEL="${1:-screen}"
OUT="docs/measurements/a11y-$LABEL.txt"
DEVICE="${DEVICE:-$(adb devices | awk '/\tdevice$/{print $1}' | head -1)}"

adb -s "$DEVICE" shell uiautomator dump /sdcard/a11y.xml >/dev/null 2>&1
adb -s "$DEVICE" pull /sdcard/a11y.xml /tmp/a11y.xml >/dev/null 2>&1

mkdir -p "$(dirname "$OUT")"
python3 - "$LABEL" "$OUT" <<'PY'
import sys, xml.etree.ElementTree as ET

label, out = sys.argv[1], sys.argv[2]
root = ET.parse("/tmp/a11y.xml").getroot()

lines = [f"# Accessibility tree — {label}", ""]
lines.append("Everything a screen reader has to work with, in the order it")
lines.append("traverses. A row with no name is a row TalkBack announces as its")
lines.append("class — \"Button\", \"EditText\" — and nothing else.")
lines.append("")

index = 0
for node in root.iter("node"):
    text = (node.get("text") or "").strip()
    desc = (node.get("content-desc") or "").strip()
    cls = (node.get("class") or "").split(".")[-1]
    clickable = node.get("clickable") == "true"
    focusable = node.get("focusable") == "true"
    if not (text or desc or clickable):
        continue
    index += 1
    name = desc or text or "(no accessible name)"
    flags = "".join([
        "T" if clickable else "-",
        "F" if focusable else "-",
    ])
    lines.append(f"{index:3d} [{flags}] {cls:<16} {name}")

open(out, "w").write("\n".join(lines) + "\n")
print(f"{index} nodes -> {out}")
PY
