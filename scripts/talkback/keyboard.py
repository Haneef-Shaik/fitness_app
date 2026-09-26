#!/usr/bin/env python3
"""A virtual USB keyboard on the phone, through /dev/uinput.

`adb shell input keyevent` injects past the accessibility input filter, so
TalkBack never sees it. A uinput device is read by InputReader like real
hardware, so its keys reach TalkBack's keyboard shortcuts.

  keyboard.py serve            # holds the device open; reads commands from the FIFO
  keyboard.py send next        # Alt+Right       (TalkBack: next item)
  keyboard.py send prev        # Alt+Left
  keyboard.py send click       # Alt+Enter       (TalkBack: activate)
  keyboard.py send back        # Alt+Backspace
  keyboard.py send key TAB     # a plain key; chords as ALT+RIGHT
  keyboard.py send type 82.5   # types text
"""
import json, os, subprocess, sys, time

FIFO = os.path.join(os.path.dirname(os.path.abspath(__file__)), "keyboard.fifo")
KEYS = {
    "ESC": 1, "BACKSPACE": 14, "TAB": 15, "ENTER": 28, "LEFTCTRL": 29, "CTRL": 29,
    "LEFTSHIFT": 42, "SHIFT": 42, "LEFTALT": 56, "ALT": 56, "SPACE": 57,
    "UP": 103, "LEFT": 105, "RIGHT": 106, "DOWN": 108, "DOT": 52, "MINUS": 12,
    "SLASH": 53, "COMMA": 51, "DELETE": 111, "HOME": 102, "END": 107,
}
for i, c in enumerate("1234567890"):
    KEYS[c] = 2 + i
for row, start in (("QWERTYUIOP", 16), ("ASDFGHJKL", 30), ("ZXCVBNM", 44)):
    for i, c in enumerate(row):
        KEYS[c] = start + i
CHAR = {".": "DOT", " ": "SPACE", "-": "MINUS", "/": "SLASH", ",": "COMMA", "@": None}
ALIASES = {"next": "ALT+RIGHT", "prev": "ALT+LEFT", "click": "ALT+ENTER",
           "back": "ALT+BACKSPACE", "first": "ALT+CTRL+LEFT", "last": "ALT+CTRL+RIGHT",
           "actions": "ALT+CTRL+SPACE", "readall": "ALT+SHIFT+CTRL+ENTER"}


def ev(code, value):
    return [1, code, value, 0, 0, 0]


def chord(names):
    codes = [KEYS[n] for n in names]
    down = sum((ev(c, 1) for c in codes), [])
    up = sum((ev(c, 0) for c in reversed(codes)), [])
    return down, up


def serve():
    if not os.path.exists(FIFO):
        os.mkfifo(FIFO)
    p = subprocess.Popen(["adb", "shell", "uinput", "-"], stdin=subprocess.PIPE, text=True)

    def put(obj):
        p.stdin.write(json.dumps(obj) + "\n")
        p.stdin.flush()

    put({"id": 1, "command": "register", "name": "FitLog a11y keyboard", "vid": 6353,
         "pid": 43981, "bus": "usb",
         "configuration": [{"type": 100, "data": [1]},
                           {"type": 101, "data": sorted(set(KEYS.values()))}]})
    print("registered", flush=True)
    while True:
        with open(FIFO) as f:
            for line in f:
                parts = line.strip().split(" ", 1)
                if not parts or not parts[0]:
                    continue
                cmd, arg = parts[0], (parts[1] if len(parts) > 1 else "")
                if cmd in ALIASES:
                    cmd, arg = "key", ALIASES[cmd]
                if cmd == "key":
                    down, up = chord(arg.upper().split("+"))
                    put({"id": 1, "command": "inject", "events": down})
                    put({"id": 1, "command": "delay", "duration": 60})
                    put({"id": 1, "command": "inject", "events": up})
                elif cmd == "type":
                    for ch in arg:
                        name = CHAR.get(ch, ch.upper())
                        down, up = chord((["SHIFT"] if ch.isupper() else []) + [name])
                        put({"id": 1, "command": "inject", "events": down})
                        put({"id": 1, "command": "delay", "duration": 30})
                        put({"id": 1, "command": "inject", "events": up})
                        put({"id": 1, "command": "delay", "duration": 30})
                elif cmd == "quit":
                    p.stdin.close()
                    p.wait()
                    return
                print("did", cmd, arg, flush=True)


def send(words):
    with open(FIFO, "w") as f:
        f.write(" ".join(words) + "\n")


if __name__ == "__main__":
    if sys.argv[1] == "serve":
        serve()
    else:
        send(sys.argv[2:])
