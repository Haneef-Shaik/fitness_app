# Accessibility audit — G10

**WCAG 2.2 AA** is the target ([PRD §9](01-PRD.md), `[ASSUMPTION]`). This is the
audit the release gate requires, and G10's contract is explicit that it is
**not an automated scan**: a scan finds a missing label, and misses that the set
logger sends focus back to the top after every commit, or that the only sign a
set synced is a colour.

**Device.** Samsung SM-E546B (Galaxy M54 5G), Android 16, Exynos 1380, 7.6 GB.
The same phone every other hardware number in this project was taken on.

> **Status of this audit — read this first.** Everything in the method below
> was done on the phone and is logged here: the accessibility tree (0), the
> **TalkBack session (1)** — 25 Sep, two runs, the second on the fixed build —
> the keyboard-only diary pass and keyboard-only logging (2), both themes (3)
> and the colour check (4). The TalkBack session found **twelve defects the
> tree could not show** (findings 23–34) — among them that no text field in
> the app said its own name — and the device runs found three more (35–37).
> **37 findings: 34 fixed, 1 closed as not reproduced, 1 dated, 1 accepted.**
> An earlier draft of this file described passes as done before they were; the
> logs are the evidence, not the method list.

Findings are **fixed, or logged with a date**. "Noted" is not an outcome.

---

## Method

0. **Accessibility tree, read off the device.** `maestro hierarchy` on every
   screen the E2E flows visit, both mid-flow and at rest. *(done)*
1. **Screen-reader session.** TalkBack on: log a complete workout and read the
   diary. *(done 25 Sep — [talkback-session.md](measurements/talkback-session.md))*
2. **Keyboard-only diary pass, and keyboard-only logging.** Hardware-keyboard
   key events (Tab, Shift+Tab, Enter, typed text), no touch; focus read after
   every key from the device's own tree (`focused=true`) and screenshots.
   *(done — log below)*
3. **Both themes.** Every finding checked in dark and light.
4. **Colour-blind check.** Colour never carries meaning alone (05 §3), on the
   built app.

**How the keyboard was driven, and what that does not prove.** Keys were sent
with `adb shell input keyboard keyevent` — the input source is a keyboard, and
Android handles them exactly as a paired keyboard's. What differs: with no
physical keyboard attached, Android also shows the on-screen keyboard when a
field is focused, and focus navigation into that on-screen keyboard is an
artefact of the method, not of the app. A paired Bluetooth keyboard suppresses
it.

---

## Keyboard session log — 2026-09-23, SM-E546B, Android 16

**Diary (B-01 → H-01 → H-04 → H-05 → added).**

| Step | Key | Focus lands on | Result |
|---|---|---|---|
| Dashboard | Tab ×3 | `Log food` | **No visible focus at all** → finding 14 |
| | Enter | → Nutrition diary | activates |
| Diary | Tab ×5 | `+ Food` → `Lunch, 389 kcal, 1 items` (×3) → `Recipes` | order follows the screen; label says "1 items" → finding 19 |
| | Shift+Tab | `Back` reachable; order wraps `Copy this day` → `Back` → `+ Food` | ok |
| | Enter on a meal | → Meal (H-03), focus on `Back`; Tab: `Copy this meal` → `Delete meal` | ok (the item row is display-only for touch too) |
| Add food | Tab from `Back` | **stays on `Back`** — search, buttons and every result unreachable | **keyboard trap** → finding 15 |
| *after the fixes* | Tab | into `Search foods`; typed `Banana` | list filters |
| | Tab ×3 | `Quick add` → `New food` → `Banana, 89 kcal per 100 grams` | ring drawn round the row at its own radius |
| | Enter | → Food (H-05), Tab into `Amount in grams` → portion chips → meal chips → `Add to diary` | |
| | Enter | server: Banana logged, day 1,167 → **1,256 kcal** | **done by keyboard alone** |

**Logger (E-03), after the fixes.** Tab cycle, read off the device:
`Discard workout` → `Barbell Bench Press, 0 sets` → `Overhead Press, 0 sets` →
*(scroller, no name — finding 17)* → `Decrease Load` → `Load (kg)` →
`Increase Load` → `Decrease Reps` → `Reps` → `Increase Reps` → `Warm-up set` →
`Save set 1` → `+ Add exercises` → `Finish workout`. Typed `82.5` and `8`,
Enter on `Save set 1`: the set rendered with its synced dot, the rest timer
started, and the database holds **82.50 kg × 8** in the in-progress session.
**Keyboard-only logging works.** Before the fix the same cycle ran in columns
(both `−`, Warm-up, Save, both fields, both `+`) — finding 16.

**Not exercised by keyboard:** confirming an *estimated* item (H-08). It needs
an AI analysis on the device, which needs the worker; the Confirm control is
the shared `Button`, which the ring and Tab order above already cover.

---

## Findings

Status is **fixed** (in this goal), **dated** (a commitment with an owner and a
date), or **accepted** (a deliberate decision, with the reason).

| # | Where | Finding | Severity | Status |
|---|-------|---------|----------|--------|
| 1 | Set entry (E-03) | The visible field label and the input carried the **same** accessible name, so TalkBack announced "Load (kg)" and then "Load (kg), edit box, 80" — the label twice, for no information | Medium | **fixed** — the visible label is `accessibilityElementsHidden` / `importantForAccessibility="no"`; the input keeps the name. *TalkBack later showed the input's name was never spoken at all — #24* |
| 2 | Progress (I-01), Nutrition diary (H-01) | Both were `back={false}` because the wireframes call them **tab roots** — and there is no tab bar in this build. Reachable from B-01 with **no way back**; the hardware button exits the app from a root | High | **fixed** — both have a back affordance, and it now carries `testID="screen-back"` so a flow can use it |
| 3 | B-01 (G9 rewrite) | The `sign-in` flow asserted "Today's workout", a label G9 renamed to "Training". Nothing caught it for a goal and a half because **no device was attached** | Medium | **fixed** — flow updated; the real fix is §0 below |
| 4 | B-01 navigation | G9 moved Programs / Exercises / History / Trends into an "Elsewhere" row **below the fold**. Six flows tapped a position the buttons no longer occupy | Medium | **fixed** — flows scroll to the target first |
| 5 | Set entry | `uiautomator dump` cannot reach an idle state while the **rest timer ticks every second**. Accessibility tooling is blocked, and a tree that churns once a second is a tree TalkBack may re-announce from | Low | **fixed** — the label moves in 15-second steps and the digits are hidden from the reader; **confirmed with TalkBack speaking, 25 Sep**: one announcement per step, silence between (see the TalkBack section). Tooling still reads the tree with `maestro hierarchy`, which does not need idle |
| 6 | Set row | The row exposes `Set 1, 80 kilograms for 8 reps` and has **no `accessibilityRole`**, so TalkBack announces it as a plain view | Low | **accepted** — the composed name carries the meaning, and `role="text"` on Android adds nothing a user hears. Revisit if the row becomes interactive |
| 7 | Set entry (E-03) | **Typing into the load field could register the wrong number.** The field was fully controlled: every keystroke went up to a reducer and came back as a new `value` prop, re-setting the native text underneath the keyboard. On the device, typing `80` into a field showing `80` produced **800**, and `8` into one showing `6` produced **86** — captured in the accessibility tree as `Set 1, 800 kilograms for 86 reps` | **High** | **fixed** — the field owns its text while it is being typed into; the prop wins only when it changes for a reason the user did not cause. Four tests pin the behaviour, one of them driving a **live parent** character by character, because that round trip is the thing that used to fight the keyboard |
| 8 | H-05 food detail | Opening a food from search showed **"not found"** for anything past the first page — the screen looked its food up in `useFoods('')`, an unfiltered list capped at 25 rows. The seeded catalog is 22, so a handful of custom foods hid the rest | **High** | **fixed** — added `GET /foods/{id}`; the screen fetches by id. Three server tests, one of which fills the page first and asserts the fixture still proves something |
| 9 | Shell (L-02 banner) | The sync banner was drawn **under the status bar** — "2 changes couldn't sync" printed across the clock | Medium | **fixed** — top-edge SafeAreaView; test fails with the inset removed |
| 10 | Every screen under the banner | Each screen inset itself again below the banner, leaving a status-bar-high blank strip (the native SafeAreaView applies the full inset wherever it sits) | Low | **fixed** — `TopInsetHandled` context; screens take their edges from it; verified on the phone |
| 11 | L-02 | The **offline** banner could never appear in the app: nothing ever passed `online={false}` | Medium | **fixed** — offline is read from the outbox's own record of an unreachable server (`looksOffline`); seen on the phone with the API stopped |
| 12 | Every queued save (meal, recipe, weigh-in) | Offline, **Save sat on "Saving…" for over 30 s**: `onSuccess` returned the invalidation promise, so the save waited for every active read to refetch through its retries | **High** | **fixed** — invalidation runs in the background; the same offline save on the phone: **>30 s → 3.4 s** |
| 13 | Outbox | An offline write became a **permanent failure** after 8 attempts — a few minutes — contradicting docs/03 §7 ("offline → stays pending") and the banner's promise | **High** | **fixed** — only a server that answers and keeps failing exhausts attempts; tested through the real sender |
| 14 | Every control | **No visible keyboard focus.** docs/05 specifies `--focus-ring` (2 px + 2 px offset, never removed); it was never built. RN 0.76's Pressable never receives `onFocus` on Android — focus arrives only as the app-wide `onHWKeyEvent` | **High** | **fixed** — ring driven by that event, in one shared `Pressable`; a test fails if any screen imports the raw one; seen on the phone |
| 15 | Every text field | **Tab could not enter a text field.** RN 0.76's `ReactEditText.requestFocus` is a deliberate no-op, so keyboard focus stopped dead before search, sign-in, and the logger's load/reps | **High** | **fixed (forward)** — a focusable wrapper hands focus to the input from JS; shared `TextInput`, guarded like `Pressable`. **Shift+Tab into a field is still blocked — dated 2026-12-15**: fixed upstream ([react-native#48547](https://github.com/react/react-native/pull/48547)), arrives with the Expo SDK upgrade that carries it. Not a trap under 2.1.2 — Tab forward always leaves |
| 16 | Logger (E-03) | Tab order ran **in columns** (both `−`, Warm-up, Save, both fields, both `+`): Fabric flattened the row Views, and Android sorted one flat list | **High** | **fixed** — rows and the entry are native groups; order verified on the phone |
| 17 | Logger (E-03) | The exercise-tab **scroller is a Tab stop with no name**, and the focus ring on a tab is **clipped** by it. `focusable={false}` has no effect on Android's horizontal ScrollView | Low | **fixed** — the scroller is named "Exercises in this workout" (TalkBack said so, 25 Sep) and its content is padded for the ring; on the phone the 2 px ring + 2 px offset is drawn whole round each tab with the keyboard (25 Sep). `sessionScreen.test.tsx` |
| 18 | Logger (E-03) | One of four AC-02 runs: the tap on `Save set 2` completed and no set was recorded; the step took 13.8 s where others take ~1 s (consistent with finding 5's busy tree). Not reproduced in 3 further runs | Medium | **closed, not reproduced** — AC-02 run **five times on the phone on 25 Sep** (the suite's run, then four in a row): every *Save set* registered, 157–178 s a run. The busy tree finding 5 blamed is gone (the timer's label moves in 15 s steps). A related input race did show up on the slow **emulator** — finding 37 |
| 19 | Diary, recipes | Rows announced as "Lunch, 389 kcal, **1 items**" | Low | **fixed** — `count()`; tested |
| 20 | L-02 | An item that failed on auth says "Log back in to carry on" **while signed in** (it failed during an earlier sign-out) | Low | **fixed 24 Sep** — a 401 is no longer a failure at all: the write stays queued as "Waiting for you to sign in.", never exhausts, and goes on the next sign-in (`awaitingSignIn` in the outbox; the sender test fails with the branch removed) |
| 21 | Light theme, every status-toned label | Text drawn in the raw status hex: `serious` **2.28:1**, `warn` **1.59:1**, `good` 3.62:1, `crit` 4.15:1 on light surfaces; `ink3` 4.33:1 on light sunken and 4.497:1 on dark surface. docs/05 accepted low status contrast *because the label carries the meaning* — then the label was drawn in it | **High** | **fixed** — status text uses `*Ink` shades (same hue, ≥4.66:1); `ink3` nudged in both themes; a test pins every text tone at 4.5:1 on page, surface and sunken in both themes, and another fails if any text style takes a raw status token. Seen on the phone in light mode |
| 22 | docs/05 | The palette table had drifted from the shipping tokens (page, sunken, secondary and muted inks, `good`) — the documented `--ink-muted` itself read at ~3.3:1 | Medium | **fixed** — table reconciled to the code; the contrast test is now the arbiter (I15) |
| 23 | Logger (E-03) | **Each set row cost six swipes.** The row carried a composed label but was not a group, so TalkBack read "Set 1, 80 kilograms for 8 reps" and then every child again: "1", "80 × 8", "640 kg", "Synced", "Delete set 1". The tree showed one labelled row | **High** | **fixed** — the figures are one accessible element whose label includes the sync state ("…for 8 reps. Synced"); Delete stays its own stop. Verified in run 2; `sessionScreen.test.tsx` fails with the grouping removed |
| 24 | **Every text field** | **No text field said its name.** TalkBack names an Android text field by its *hint* and ignores its contentDescription, which is what `accessibilityLabel` becomes. The load field read "—, 80, Edit box" (its placeholder), the grams field "100, Edit box", the password field would read ten bullets. The tree said "Load (kg)" throughout — finding 1 was fixed against the tree and was never true for a listener | **High** | **fixed** — the shared `TextInput` puts the label in the native hint on Android and draws a differing placeholder over the empty field, hidden from the reader; sign-in and register fields got labels. Run 2: "Load (kg), 80, Edit box", "Amount in grams, 100, Edit box". `textInputName.test.tsx` |
| 25 | Logger (E-03) | **Saving a set was silent.** Focus stays on the button, which renumbers, and the new row appears elsewhere; TalkBack read neither — a blind user had no confirmation the set existed | **High** | **fixed** — "Set 2 saved: 82.5 kilograms for 8 reps" is announced after the commit (outside the measured tap → paint span). Heard in run 2 |
| 26 | Rest timer (E-04) | The end of a rest, and adjusting one, were silent unless TalkBack's focus was on the timer — and between sets it is on *Save set* | Medium | **fixed** — "Rest complete" is announced once on the transition (heard in run 2 with focus on a heading); ±15 s announces the new time. `RestTimer.test.tsx` |
| 27 | Rest timer | "15 seconds of rest left" lived for one second, so TalkBack said it and then "Less than 15 seconds" 3.5 s later | Low | **fixed** — the last step is "15 seconds or less"; one announcement |
| 28 | Every text | With TalkBack's *Speak text formatting* on — as it was on this phone, verbosity preset *Custom* — every React Native text is followed by its spans: "start 32 pixels, background colour black, colour grey". RN draws text size and colour as spans | Low | **dated 2026-12-15** — re-test on the Expo SDK upgrade already dated for #15b; nothing in the app sets these spans, and the main pass was run with the option off |
| 29 | Dashboard, diary, finish summary | Figures read apart from their meaning ("0" · "kg today"; "15:50" · "DURATION", the clock read as a time of day); macros read **in columns** — three names, then three figures; the calorie meter was three stops, the third repeating the first two | Medium | **fixed** — each figure is one stop with its name ("Protein, 1.1 g of 176 g", "Duration, 17 minutes 12 seconds"); `Stat`, `Meter` and the macro rows are groups. Run 2 transcript |
| 30 | Start, logger, history | "Start Legs, 1 exercises", "1 of 2 · 1 sets", "1 reps" | Low | **fixed** — `count()` everywhere a count is printed |
| 31 | Logger → every tab | **A finished workout came back as open.** Finishing cleared the draft while the summary was up; the screen then fetched its session — now *completed* — and adopted it as the draft again. The active-session bar said "Workout in progress … 3 sets. Resume" and resuming it would have logged sets into a finished session | **High** | **fixed** — only an `in_progress` session is adopted, and not after finishing. Two tests in `sessionScreen.test.tsx`, one fails with the guard removed. Run 2: no bar after *Done* |
| 32 | E-10 recovery | Every launch offered "You left a workout open · 3 sets · 54:36 ago" for that finished session: the gate never asked whether the draft's session was still open (docs/03 §5.3 says only an in-progress one is offered). "54:36 ago" is also a clock reading | Medium | **fixed** — when the server answers, a draft whose session is closed or gone is dropped; offline it is kept and offered as before. Age reads "started 54 minutes ago". `RecoveryGate.test.tsx` |
| 33 | Diary (H-01), every queued write | **A food just added did not appear.** The meal is queued, the diary was invalidated at queueing, refetched before the outbox had delivered, and nothing re-read it after — "Nothing logged today" with the meal on the server | **High** | **fixed** — the outbox reports each delivered write (`onSent`) and the shell invalidates what it moves (`kindForDelivery`: meals, recipe logs, weigh-ins). Run 2: 89 → 141 kcal straight after *Add to diary* |
| 34 | Reminders (B-04) | Each toggle read "Off, Button" — no word of which reminder | Low | **fixed** — a switch named for its reminder: "off, Workout reminder, Switch" (run 2). The permission help also named *Expo Go* in the release build; it names the app now |
| 35 | Add food (H-03) | **Describe it and Photograph it could not be reached on a phone.** They sat below the 22-food catalog on a screen set not to scroll. Found writing the AC-09 flow, not by TalkBack, and it cut off both AI entry points (AC-08, AC-09) for everyone | **High** | **fixed** — the screen scrolls and the AI modes sit with the other modes, above the list. `nutritionScreens.test.tsx` fails with `scroll={false}` restored |
| 36 | Every screen | Section titles ("Training", "Today", "What you did") were not headings, so heading navigation found only screen titles | Low | **fixed** — section-title labels are `header`; labels that caption a text field are hidden from the reader instead (the field says its own name, #24) |
| 37 | Logger (E-03) | **"800 × 86" again — on the emulator's release build.** A tap in the middle of a centred "80" puts the caret between 8 and 0: backspace removes the 8 and typing "80" gives **800**; before a "6", typing 8 gives **86**. Screenshots after each step proved it (erase left "0"). A person tapping the field gets the same. #7's identical symptom on the phone may have had this cause all along | **High** | **fixed** — the load and reps fields select their value on focus, so what is typed replaces it; AC-02 then passed 3 of 3 on the emulator. An echo guard for a lagging parent was added on the way and kept — its test shows a real race — but it was not what the emulator hit. `SetEntry.test.tsx` |

---

## Themes and colour — 2026-09-23, on the phone

**Both themes.** The phone's system theme was switched to light
(`cmd uimode night no`), the app relaunched, and the finish summary, recovery
sheet and sync banner read in light; then restored to the owner's setting
(dark). The light pass found finding 21 — measured, not eyeballed: every text
colour against every surface it sits on, in both palettes, now enforced by
`contrast.test.ts`. The keyboard focus ring is **7.19:1** (light) and
**8.77:1** (dark) against the page, over the 3:1 a focus indicator needs.

**Colour never carries meaning alone.** Checked from the device's tree rather
than by simulating colour vision: sync state is the word (`Synced`, `Waiting`,
`FAILED` chip), an estimated item says "estimated, not yet confirmed", a
regression is ▼ with a value, the sync banner is a sentence. No state found on
the screens walked that exists only as a colour.

---

## Screen reader (TalkBack) — 2026-09-25, SM-E546B

**Done, twice**: run 1 on the build G10 was about to ship, run 2 on the build
with its findings fixed. The full record — how TalkBack was driven from the
laptop, what it said at each step, what was changed on the phone and put back —
is [measurements/talkback-session.md](measurements/talkback-session.md).

*"TalkBack cannot be driven from a host"* (23 Sep) was half true: `adb shell
input` goes past the accessibility input filter, but a **uinput** virtual
keyboard goes through it, exactly as a paired one does. The speech was read off
TalkBack's own *Display speech output* card. The tooling is kept in
[`scripts/talkback/`](../scripts/talkback/README.md) so the pass can be re-run.

**What the tree had said was right, and was not.** The tree said the load field
was named "Load (kg)"; TalkBack said "—, 80, Edit box". The tree said a set row
was one element; TalkBack walked into it five more times. The tree says nothing
at all about what is *spoken when*: that saving a set, adjusting a rest and
ending one were all silent. None of findings 23–34 was visible in `maestro
hierarchy`.

**TODO 0.2 / finding 5 answered.** With TalkBack's focus on the rest timer it
speaks once per 15-second step and is quiet in between — 21.5 s, 37.0 s,
51.5 s, 66.5 s into the recording. The one wrinkle, "15 seconds" then "less
than 15" 3.5 s apart, is finding 27.

## What the tree says is already right

Read off the device, not off the source (`maestro hierarchy` on the logger,
mid-session, with a set committed and the rest timer running):

| Element | Accessible name | Why it matters |
|---------|-----------------|----------------|
| Set row | `Set 1, 80 kilograms for 8 reps` | The whole row is one announcement, not four fragments |
| Sync state | `Synced` | **The sync state is a word, not a colour.** 05 §3 forbids colour carrying meaning alone, and this is the place it would have been easiest to break |
| Rest timer | `76 seconds of rest left` | A countdown a screen reader can actually read |
| Steppers | `Increase Load (kg)` / `Decrease Reps` | Named by what they change, not "plus" and "minus" |
| Delete | `Delete set 1` | Says which set |
| Exercise tabs | `Barbell Bench Press, 1 sets` | Carries progress, not just a name |
| Estimated AI item (H-08) | `…estimated, not yet confirmed, selected` | **I12 in words.** The dashed border conveys nothing at all to a screen reader, and this is why the audit checks the tree rather than the design file |

The last row is the one G8 built deliberately and this audit confirms on a
device: *"the dashed border is never the only cue"* is true of the built app.
