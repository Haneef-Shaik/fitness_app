# Driving TalkBack from the laptop

G10's release gate needs a screen-reader session, and TalkBack was thought to
be undrivable from a host: `adb shell input` injects **past** Android's
accessibility input filter, so TalkBack never sees those keys or gestures.

A **uinput** device does not. `adb shell uinput -` registers a virtual USB
keyboard that InputReader treats as hardware, so its keys go through the same
filter a paired keyboard's do — and TalkBack's keyboard shortcuts work.
What TalkBack *says* is read from its own **"Display speech output"** card,
recorded and OCR'd frame by frame. The log is therefore what TalkBack spoke,
not what the accessibility tree contains.

## One-time phone setup (with TalkBack off)

TalkBack settings → Advanced settings → Developer settings → **Display speech
output: on**. Note what you changed; put it back afterwards.

Verbosity → *Speak text formatting* reads every React Native text span's size
and colour aloud ("start 32 pixels, colour grey"). Record the session with it
in the state you are testing; the G10 session turned it off for the main pass
and recorded a sample with it on (see docs/a11y-audit.md).

## Use

```bash
cd scripts/talkback
swiftc -O vocr.swift -o vocr               # once: Vision OCR over video frames
python3 keyboard.py serve &                # keep running: the virtual keyboard
bash on.sh                                 # opens Volt, TalkBack on
python3 listen.py -g 3 first next next click wait:4 next next
bash off.sh                                # TalkBack off, settings restored
```

`listen.py` prints, per command, every utterance TalkBack showed:

```
            next => Discard workout, Button
           click => Discard this workout?
            next => Close, Button ‖ Discard this workout?, Heading
```

Commands: `next`, `prev`, `first`, `last`, `click` (Alt+Enter), `back`
(Alt+Backspace), `key:TAB`, `key:CTRL+A`, `type:82.5`, `wait:N` (listen N s).
Every line is appended to `session.log`.

## Limits

- Keyboard navigation, not touch gestures: the same TalkBack traversal a swipe
  makes, driven by Alt+→ instead of a swipe right.
- The speech card shows one utterance at a time; identical consecutive
  utterances collapse into one line. A step that speaks nothing new reads
  `(silent)` — check the recording (`listen.mp4`) before calling it silent.
- TalkBack's focus can walk into its own speech card. `key:TAB` brings it
  back to the app.
- The card is translucent; `vocr` thresholds brightness so only its white text
  survives. A debug overlay under the card (EXPO_PUBLIC_MEASURE builds) can
  still bleed through.
