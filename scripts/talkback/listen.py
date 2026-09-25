#!/usr/bin/env python3
"""rec.py [-g GAP] cmd [cmd ...] — record the screen while sending TalkBack
keyboard commands, then OCR TalkBack's speech-output card frame by frame.

Each cmd is a keyboard.py command; use ':' for spaces ("type:82.5", "key:TAB").
A cmd of "wait:N" sleeps N seconds (to listen for unprompted speech).
Prints, per command, every distinct utterance fragment shown after it.
"""
import difflib, os, subprocess, sys, time

D = os.path.dirname(os.path.abspath(__file__)) if "__file__" in globals() else "."
FPS = 4


def card_rows(lines):
    frames = {}
    for line in lines:
        try:
            t, pos, text = line.split("\t", 2)
            y, x, w = map(float, pos.split())
        except ValueError:
            continue
        frames.setdefault(float(t), []).append((y, x, text.strip()))
    out = []
    for t in sorted(frames):
        rows = frames[t]
        head = [r for r in rows if 0.07 < r[1] < 0.12 and 0.6 < r[0] < 0.9
                and difflib.SequenceMatcher(None, r[2], "TalkBack").ratio() > 0.6]
        if not head:
            out.append((t, None))
            continue
        hy = head[-1][0]
        body = [r for r in rows if hy + 0.01 < r[0] < hy + 0.16 and 0.07 < r[1] < 0.12]
        out.append((t, " ".join(tx for _, _, tx in sorted(body)) or None))
    return out


def main(argv):
    gap = 2.6
    if argv[:1] == ["-g"]:
        gap, argv = float(argv[1]), argv[2:]
    total = sum(float(c.split(":", 1)[1]) if c.startswith("wait:") else gap for c in argv) + 2.5
    limit = min(180, int(total) + 2)
    subprocess.run(["adb", "shell", "rm", "-f", "/sdcard/listen.mp4"])
    rec = subprocess.Popen(["adb", "shell", "screenrecord", "--size", "720x1600",
                            "--bit-rate", "4000000", "--time-limit", str(limit), "/sdcard/listen.mp4"])
    t0 = time.time()
    time.sleep(1.5)
    sent = []
    for c in argv:
        if c.startswith("wait:"):
            sent.append((time.time() - t0, c))
            time.sleep(float(c.split(":", 1)[1]))
            continue
        sent.append((time.time() - t0, c))
        subprocess.run([sys.executable, os.path.join(D, "keyboard.py"), "send", *c.split(":", 1)])
        time.sleep(gap)
    end = time.time() - t0
    rec.wait()
    subprocess.run(["adb", "pull", "/sdcard/listen.mp4", os.path.join(D, "listen.mp4")], capture_output=True)
    ocr = subprocess.run([os.path.join(D, "vocr"), os.path.join(D, "listen.mp4"), str(FPS)],
                         capture_output=True, text=True).stdout.splitlines()
    rows = card_rows(ocr)
    # screenrecord starts ~0.6 s after it is spawned
    offset = float(os.environ.get("REC_OFFSET", "0.6"))
    log = open(os.path.join(D, "session.log"), "a")
    for i, (ts, c) in enumerate(sent):
        nxt = sent[i + 1][0] if i + 1 < len(sent) else end + 1.0
        frags = []
        prev = None
        for t, txt in rows:
            wall = t + offset
            changed = txt and txt != prev
            if txt:
                prev = txt
            if ts <= wall < nxt and changed and txt not in frags:
                frags.append(txt)
        line = f"{c:>16} => " + (" ‖ ".join(frags) if frags else "(silent)")
        print(line)
        log.write(time.strftime("%H:%M:%S ") + line + "\n")
    log.close()


if __name__ == "__main__":
    main(sys.argv[1:])
