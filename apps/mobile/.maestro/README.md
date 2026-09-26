# Maestro flows

**D15** chose Maestro because it drives **Expo Go** over the LAN and needs no native
toolchain — there is no Xcode on the development machine ([DR4](../../docs/08-PROJECT-CHARTER.md#7-delivery-risks)).

## Running them

Don't run `maestro test` directly. Use the suite runner, which seeds the known
state, drives the phone, and then asks the **server** what landed:

```bash
bash scripts/e2e.sh            # everything, in dependency order
bash scripts/e2e.sh ac-02      # one criterion
```

It needs three things up:

```bash
# 1. the API, reachable from the phone (not localhost — the LAN address)
cd services/api && uv run uvicorn app.main:app --host 0.0.0.0 --port 8000

# 2. Metro, so Expo Go can load the bundle
cd apps/mobile && npx expo start

# 3. the phone on the same LAN, with USB debugging on
```

`java` is **not on PATH by default on this machine** — Homebrew's `openjdk@17` is
installed but unlinked. `scripts/e2e.sh` exports `JAVA_HOME` itself; if you invoke
Maestro by hand you have to.

## What each flow proves

| Flow | Proves | Criterion |
|------|--------|-----------|
| `ac-01-build-chest-workout` | A program persists with ≥2 prescribed exercises | **AC-01** |
| `ac-02-record-every-set` | Every set recorded, loads and reps match, indices dense | **AC-02** |
| `ac-04-previous-performance` | Last time's sets are on screen **before any input** | **AC-04** |
| `ac-05-previous-occurrence` | The previous chest session, reached without a date | **AC-05** |
| `ac-07-log-a-meal` | A manual meal moves today's totals, on the profile's day | **AC-07** |
| `ac-08-describe-a-meal` | A description comes back as editable candidates | **AC-08** |
| `ac-09-photograph-a-meal` | A photo (from the `FitLogE2E` album, never the owner's own) does too | **AC-09** |
| `ac-10-correct-and-confirm` | A corrected candidate is confirmed; the AI's original is kept | **AC-10** |
| `ac-11-dashboard-shows-everything` | One dashboard call carries all three domains | **AC-11** |
| `offline-1-log-online` | One set with the server reachable, for contrast | |
| `offline-2-queue-and-relaunch` | Queues with the server gone; draft survives a force-quit | **I10 / H3.3** |
| `offline-3-drain` | The queue drains unattended, with no duplicates | **I8** |
| `measure-*` | Not criteria — the H4.3 / release measurements | **D16** |
| `sign-in` | Prelude. Not run on its own | |

**Which app.** Every flow takes `APP_ID`: `host.exp.exponent` (the default —
Expo Go, loading the bundle from Metro over the LAN) or `com.fitlog.app` (an
installed build: CI's release APK, `scripts/build-release-apk.sh`).
`sign-in.yaml` launches whichever it is given; `sign-in-release.yaml` is only
that with `com.fitlog.app` filled in.

```bash
bash scripts/e2e.sh                                   # the phone, through Expo Go
APP_ID=com.fitlog.app DEVICE=emulator-5554 bash scripts/e2e.sh   # an installed release APK
```

They are **ordered**: AC-04 reads the session AC-02 completes, and the three
offline flows are one scenario with the API taken away in the middle.
`scripts/e2e.sh` runs them in that order and **re-seeds before each one** — a
flow that starts a workout leaves it open, and E-01 shows only
"You're mid-workout" while one is, hiding every plan day from the next flow.

## A green flow is only half of a criterion

Every flow is paired with a check in [`scripts/assert_ac.py`](../../../scripts/assert_ac.py)
that queries the API. This is not belt-and-braces. AC-02 was green on a real
phone, showing three sets, while the server held **two** — the outbox had
stranded the third and no assertion about the screen could have known.

## Why they are written against accessibility labels

Every selector is an `accessibilityLabel` the app already sets for screen
readers. Testing through the same names a blind user navigates by means the flows
break when the app becomes unusable, rather than when a layout shifts — and it
keeps the labels honest, because a wrong one fails the build.

## What cost time when writing these

**Assert the raw text, not the styled text.** `variant="label"` applies
`textTransform: uppercase`. That changes the pixels and *not* the accessibility
tree, so a selector copied off a screenshot (`TODAY'S WORKOUT`) never matches
what is actually there (`Today's workout`).

**`inputText` appends.** Tapping a field that already has a value and typing
leaves `Day 1Chest`. Use `eraseText` first whenever the field is not empty.

**Never dismiss the keyboard inside a sheet.** On Android both `hideKeyboard`
and `pressKey: back` send a back key, which hits the RN `Modal`'s
`onRequestClose` and dismisses the **sheet** — the screen underneath reappears
and every following tap lands somewhere unintended.

**With the IME up, spend a tap before you reach for a button.** The first tap
anywhere outside the focused field is consumed by blurring it, and the layout
then reflows. Maestro reads the target's bounds *before* that reflow, taps where
the button was, and the button never gets the touch — while the step still
reports `COMPLETED`. In the prescription sheet `Save` moved 870 px between the
two layouts. Tap an inert label first (`tapOn: "Rep range"`), then the button.
This cost a whole debugging session: the flow looked green to the step log and
the prescription silently never saved.

**And once the IME is down, `pressKey: back` pops the screen.** The two rules
above interact: a `back` that used to be absorbed by the keyboard starts
navigating as soon as you stop raising the keyboard.

**Wait for async state before testing for it.** Sign-out clears a token and then
re-routes. A `runFlow: when: visible:` evaluated immediately afterwards still
sees the old screen, skips the branch, and the flow walks on signed out until
the first query 401s into "Something went wrong". Follow it with an
`extendedWaitUntil` on the screen you expect.

**Selectors are regexes.** `+ New` is not a literal — the `+` is a quantifier and
the match silently fails. Escape it: `"\\+ New"`. Same for any `(`, `)`, `[`, `.`
you mean literally.

**`launchApp` opens Expo Go's own home screen, not the project.** Use
`openLink: exp://<lan-ip>:8081`, which is the same URL a developer types into
Expo Go by hand. And wait on a discrete control rather than the hero heading:
that renders as one node with embedded newlines, so an exact-text match on
`Train. Eat.` never matches.

**`setAirplaneMode` does not take this device offline.** Wi-Fi stays enabled
(`settings get global wifi_on` reads `2` and the interface keeps its address),
so three sets logged in "airplane mode" reached the server in about 20 ms and
the flow asserted nothing at all. The offline flows take the **API** away
instead — `scripts/e2e.sh` stops and restarts it between flows.

**And offline cannot include a relaunch here.** Expo Go reloads its bundle from
Metro over the same LAN, so with the network down the app cannot start at all.
Stopping only the API is what makes "log offline, force-quit, relaunch, resume"
expressible: the server is unreachable, Metro is not. Proving it with the radio
actually off needs a development build, which is DR4's open edge.

**A system dialog masks the entire app.** The phone's password manager offers to
save the credentials right after login. While it is up, every app selector
silently skips and a following `extendedWaitUntil` sits out its whole timeout
against a screen that is fine underneath. The prelude dismisses it with
"Cancel" — not "Never for this app", which writes a setting onto the phone.

**Say which account.** The prelude signs out first, then signs in as the account
`seed_demo.py` creates. Before it did, the flows inherited whoever the last run
left signed in — they spent a session running against a different user with
fourteen programs of their own debris and none of the seeded history AC-04 reads.
