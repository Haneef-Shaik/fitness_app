# TalkBack session — G10 release gate

**What this is.** The screen-reader pass the release gate requires (TODO 0.1, 0.2): a
workout logged start → load → reps → save → finish → summary, and the diary read, with
TalkBack on. It records **what TalkBack said**, read off TalkBack's own *Display speech
output* card, not what the accessibility tree contains. Where the two differed, the
difference was the finding.

| | |
|---|---|
| Device | Samsung SM-E546B (Galaxy M54 5G), Android 16 — the phone every G10 number was taken on |
| Screen reader | Samsung TalkBack 16.2.00.12, default keymap, modifier Alt |
| Build | installed **release APK** (`assembleRelease`, Hermes, no Metro, no measurement overlay in run 2) |
| Run 1 | 2026-09-25 00:09–00:52 IST, build of `0a85d25` + the CI fixes — **found the defects below** |
| Run 2 | 2026-09-25 01:17–01:43 IST, build with the fixes — **verified them** |
| Method | [`scripts/talkback/`](../../scripts/talkback/README.md) |

## How it was driven — and what that does and does not prove

`adb shell input` injects past Android's accessibility input filter, so TalkBack never sees
it — which is why this pass was believed to need a person. A **uinput** device does not:
`adb shell uinput -` registers a virtual USB keyboard that the phone treats as hardware (shell
is in the `uhid` group), and its keys reach TalkBack like a paired keyboard's. TalkBack
confirmed it the first time a key arrived, by offering its *"New keymap available"* dialog.

Navigation was TalkBack's own: **Alt+→ / Alt+←** (next / previous item — the traversal a swipe
right / left makes), **Alt+Enter** (activate — a double tap), **Alt+Backspace** (back). Text was
typed on the virtual keyboard. Each step's speech was recorded by screen-recording TalkBack's
speech card and OCR-ing it frame by frame.

What differs from a person swiping: the input is keyboard, not touch, so touch-exploration
(dragging a finger to discover) was not exercised; the traversal order, the words spoken and
the focus movement are the same TalkBack code path. The OCR mis-reads a letter here and there
(`ot` for `of`, `Ado` for `Add`); those are corrected in the excerpts below, nothing else is.

**Phone settings changed for the session, and restored after.** TalkBack developer settings →
*Display speech output* on and *Log output level* VERBOSE (the Samsung build strips its speech
logging, so the card was the only source); Verbosity → *Speak text formatting* off for the main
pass (it was **on** on this phone — see finding 28). All four were put back, TalkBack turned off,
and `enabled_accessibility_services` returned to empty. TalkBack's *Allow phone access?* prompt
was answered *Cancel* / *Don't allow*; the permission remains denied.

## Run 1 — what TalkBack said (before the fixes)

**Logger, a set committed** — one set takes six swipes (finding 23):

```
next => Set 96, 80 kilograms for 8 reps
next => 96
next => 80 × 8
next => 640 kg
next => Synced
next => Delete set 96, Button
```

**The load and reps fields have no name** — TalkBack speaks the placeholder (finding 24):

```
next => Decrease Load (kg), Button
next => —, 80, Edit box
next => Increase Load (kg), Button
...
next => —, 6, Edit box
```

**Saving a set says nothing** (finding 25). Focus stays on the button, which renumbers:

```
prev  => Save set 1, Button
click => (silent)
wait:60 => (silent)        ← and nothing for the next minute
```

**TODO 0.2 — the rest timer, with TalkBack's focus ON the timer:**

```
  14.0 s  1 minute 15 seconds of rest left, Timer
  21.5 s  1 minute of rest left
  37.0 s  45 seconds of rest left
  51.5 s  30 seconds of rest left
  66.5 s  15 seconds of rest left
  70.0 s  Less than 15 seconds of rest left      ← 3.5 s after the last one (finding 27)
```

One announcement per 15 s step and **silence between steps** — finding 5 is answered. With
focus elsewhere (on *Save set*), the timer said nothing for the whole rest, including its end
(finding 26).

**Dashboard** — figures split from their meaning, macros read in columns (finding 29):

```
TRAINING · 0 · kg today · …
NUTRITION · 2,340 · kcal left • 0 of 2,340
PROTEIN · CARBS · FAT · 0g / 176 g · 0g / 234 g · 0g / 78 g
BODY · 78.4 · kg
```

**Finish summary** — `15:50 · DURATION · 3 · SETS · 1,980 kg · VOLUME` (finding 29); "15:50" is
spoken as a time of day.

**The finished workout came back** (finding 31) — the diary, after *Done*:

```
next => Workout in progress: Barbell Bench Press & Overhead Press, 20 minutes, 3 sets. Resume, Button
```

The server held that session as **completed** with 3 sets; the next launch then offered *"You
left a workout open · 3 sets · 54:36 ago"* for it (finding 32).

**The diary did not show a food just added** (finding 33): Banana → *Add to diary* → the diary
read *"Nothing logged today"* while `meals` held the row, dated 2026-09-25.

**Elsewhere:** `Start Legs, 1 exercises` and `1 of 2 · 1 sets` (finding 30); reminder toggles
read `Off, Button` with no reminder named (finding 34).

## Run 2 — the same paths, after the fixes

```
TRAINING, Heading
1,980 kilograms lifted today
2,251 kilocalories left, 89 of 2,340 eaten
Protein, 1.1 g of 176 g · Carbs, 22.8 g of 234 g · Fat, 0.3 g of 78 g
BODY, Heading · 78.4 kg

Start Legs, 1 exercise, Button

Load (kg), 80, Edit box
Reps, 6, Edit box
click Save set 1 => Set 1 saved: 80 kilograms for 6 reps
Set 1, 80 kilograms for 6 reps. Synced        ← one stop
Delete set 1, Button
TODAY, Heading

(focus on the TODAY heading, rest running) … => Rest complete

Workout finished, Heading
Duration, 17 minutes 12 seconds · Sets, 1 · Volume, 480 kg
WHAT YOU DID, Heading
Barbell Bench Press, 480 kilograms, 1 set, best estimated one-rep max 96 kilograms

(after Done: no "Workout in progress" bar; no recovery prompt on relaunch)

89 kilocalories eaten · 2,251 left, 4 percent · Protein, 1.1 g · Lunch, 89 kcal, 1 item, Button
Amount in grams, 100, Edit box
click Add to diary => Syncing 1 change…, Alert
                    => 141 kilocalories eaten       ← 89 + 52, straight away

off, Workout reminder, Switch
```

## A tooling artefact, not a finding

Twice in run 1 and once in run 2, TalkBack's focus stepped from *Decrease Load* into TalkBack's
own speech card instead of the load field. Repeated with the card **off**, focus went
`−` → `Load (kg)` → `+` every time (screenshots of the focus ring). The card is a debug overlay no
user has; the jump is the card's.
