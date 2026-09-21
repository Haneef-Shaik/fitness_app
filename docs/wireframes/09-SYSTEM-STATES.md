# Wireframes · L — System & Cross-cutting States

[← Conventions](00-CONVENTIONS.md) · [Index](../README.md)

Screens L-01 … L-08. These are the states that decide whether the app feels trustworthy when
something goes wrong — which, over a year of daily use, it will.

---

## L-01 · Empty State (shared pattern)
**Priority** P0

```
┌──────────────────────────────────────────────┐
│                  ( icon )                    │
│               {  Title  }                    │
│        {  One explanatory sentence  }        │
│             [ Primary action ]               │
│             ( Secondary )                    │
└──────────────────────────────────────────────┘
```

**Rules.** Icon + title + **one** sentence + **one** primary action. Never a dead end, never a joke,
never an exclamation mark. The sentence explains *what will appear here*, not that nothing is here.

| Screen | Title | Sentence | Action |
|--------|-------|----------|--------|
| F-01 | No workouts yet | Your completed sessions will appear here. | Start a workout |
| F-01 (filtered) | No sessions match | Try widening the date range or muscle filter. | Clear filters |
| C-02 | No programs yet | Build a program to plan your training days. | Create a program |
| D-01 (search) | Nothing matched "{q}" | You can add it as a custom exercise. | Create "{q}" |
| H-01 | Nothing logged yet | Add what you've eaten to see your totals. | Add food |
| H-04 | No foods matched | Create it once and it'll be there next time. | Create "{q}" |
| I-03 | No weight logged | Log your weight to start the trend. | Log weight |
| J-01 | No goals yet | Set a goal to track progress against. | Set a goal |
| G-* | Not enough data | You'll need at least {n} sessions in this range. | Widen the range |
| B-04 | Nothing new | Reminders and updates will show up here. | Notification settings |

**The filtered-empty vs genuinely-empty distinction is mandatory.** Telling a user with 84 sessions
"No workouts yet" because a filter excluded them is a bug, and a common one.

---

## L-02 · Offline Banner & Sync Center
**Route** `/sync` · **Type** Overlay + Stacked · **Priority** P0

**Banner** (in the app shell, non-blocking):
```
│ ⛅ Offline — your workout is still saving here   [Details] │
│ ⟳ Syncing 4 changes…                                       │
│ ⚠ 2 changes couldn't sync                       [Review]   │
```
The banner states **what still works**, not just that something is wrong. It never covers content,
never blocks a tap, and never appears more than once per state change.

**Sync Center**
```
┌──────────────────────────────────────────────┐
│ < Back            Sync                       │
│  ⛅ Offline since 14:22                       │
│  Everything you log is saved on this device   │
│  and will upload automatically.               │
│                                              │
│  WAITING TO UPLOAD                       4   │
│   ⟳ 3 sets · Chest & Triceps       14:31     │
│   ⟳ Weight 78.4 kg                 08:14     │
│                                              │
│  COULDN'T UPLOAD                         2   │
│  ┌──────────────────────────────────────────┐│
│  │ ⚠ Set 3 · Incline DB Press               ││
│  │   "Reps must be at least 1"              ││
│  │   ( Fix )   ( Discard )                  ││
│  ├──────────────────────────────────────────┤│
│  │ ⚠ Meal item · Chicken biryani            ││
│  │   That meal no longer exists.            ││
│  │   ( Add to another meal )  ( Discard )   ││
│  └──────────────────────────────────────────┘│
│                                              │
│  ( Retry everything )                        │
│  Last synced 21 Sep 14:22                    │
└──────────────────────────────────────────────┘
```

**Rules.** Nothing is ever dropped silently — a terminal failure always lands here with a plain-language
reason and a concrete choice. Retryable failures retry automatically with backoff and need no
attention. "Discard" is per-item, confirmed, and names what is being thrown away.

**Edge cases.** An outbox older than 7 days prompts a review. A queued write whose target was deleted
server-side offers to re-target it (as above) rather than just failing. The badge count includes only
terminal failures, not pending retries — otherwise the user is alarmed by normal operation.

---

## L-03 · Error State (shared pattern)
**Priority** P0

```
┌──────────────────────────────────────────────┐
│                  ( ⚠ icon )                  │
│        {  What couldn't be done  }           │
│        {  What the user can do  }            │
│             [ Try again ]                    │
│         Reference: req_8f2a19c   ⧉           │
└──────────────────────────────────────────────┘
```

| HTTP / condition | Title | Body | Actions |
|------------------|-------|------|---------|
| Network failure | Couldn't reach the server | Check your connection. Anything you logged is saved here. | Try again |
| 400 / 422 | That didn't save | {field-level message} | Fix it |
| 401 | You've been signed out | Log back in to carry on where you were. | Log in (→ L-05) |
| 403 | You can't open that | It belongs to another account. | Go home |
| 404 | We couldn't find that | It may have been deleted. | Go back |
| 409 | Someone changed this | This was edited on another device. | Review (→ L-07) |
| 429 | Too many requests | Try again in {n} seconds. | Wait / Try again |
| 5xx | Something went wrong on our side | We've logged it. Try again in a moment. | Try again · Contact support |
| Timeout | This is taking too long | | Try again · Keep waiting |

Every error carries a copyable `request_id`. **Never** a stack trace, a bare code, or "Oops!".

---

## L-04 · Not Found
**Route** `*` · **Priority** P0

```
│              ( icon )                        │
│      We couldn't find that page              │
│   It may have been deleted, or the link      │
│   might be wrong.                            │
│        [ Go to my dashboard ]                │
│        ( Go back )                           │
```

Used for unknown routes *and* for a resource that returns 404 — a session, meal or program that was
deleted on another device. In that case the copy names what was missing ("That workout no longer
exists").

---

## L-05 · Session Expired
**Type** Dialog · **Priority** P0

```
   ┌────────────────────────────────────────┐
   │  You've been signed out                │
   │                                        │
   │  Log back in to carry on. Nothing      │
   │  you've logged has been lost.          │
   │                                        │
   │  Email     ┌──────────────────────┐    │
   │  Password  ┌──────────────────────┐    │
   │                                        │
   │  ( Go to login )   [ Log back in ]     │
   └────────────────────────────────────────┘
```

**Re-authenticates in place.** On success the dialog closes, the original request retries, and the
user is exactly where they were — including mid-workout, mid-AI-review, or mid-form. Being kicked to
a login screen and losing an in-progress session would be the single most damaging failure in the app.

**Edge cases.** Expiry during an active workout → the dialog appears but the logger keeps working
offline behind it; it is dismissible, and the outbox flushes after re-auth. If the user logs in as a
**different** account, the current screen is abandoned and the local draft is quarantined (L-07).

---

## L-06 · Permission Primer
**Type** Dialog · **Priority** P0

```
   ┌────────────────────────────────────────┐
   │              ( 📷 )                    │
   │       Use your camera for food?        │
   │                                        │
   │  Take a photo of a meal and we'll      │
   │  estimate what's in it. Photos are     │
   │  private and you can delete them       │
   │  any time.                             │
   │                                        │
   │  ( Not now )       [ Allow camera ]    │
   └────────────────────────────────────────┘
```

**Always shown before the OS prompt**, because an OS prompt denied once is expensive to recover.
"Not now" does **not** trigger the OS prompt, so the user keeps the ability to say yes later.

| Permission | Asked when | Denied fallback |
|------------|------------|-----------------|
| Camera | First tap on "Take a photo" | Library picker; the flow still completes |
| Photo library | First library open | Manual entry |
| Notifications | First reminder enabled in K-06 | In-app inbox (B-04) only |
| Screen wake lock | First workout started | The screen sleeps normally; logging is unaffected |

**Never** asked at app launch, never asked twice after a denial in the same session, and never with a
guilt-trip. A denied permission always leaves a working path to the same outcome.

---

## L-07 · Sync Conflict
**Type** Dialog · **Priority** P1

```
   ┌────────────────────────────────────────┐
   │  This was changed somewhere else       │
   │                                        │
   │  "Chest & Triceps" was edited on        │
   │  another device at 14:31.               │
   │                                        │
   │  ┌──────────────┬───────────────────┐  │
   │  │ On this device│ On the other one │  │
   │  │ 21 sets       │ 19 sets          │  │
   │  │ 8,940 kg      │ 8,420 kg         │  │
   │  │ edited 14:35  │ edited 14:31     │  │
   │  └──────────────┴───────────────────┘  │
   │                                        │
   │  [ Keep this device's ]                │
   │  ( Keep the other one )                │
   │  ( Show me the difference )            │
   └────────────────────────────────────────┘
```

**Both versions are always shown with enough detail to choose.** A silent last-writer-wins on a
workout the user spent an hour logging is unacceptable.

**Set-level conflicts do not reach this dialog** — sets are idempotent on their client ID, so
replaying an outbox merges rather than conflicts. This dialog is for *whole-record* edits: session
metadata, meals, programs, profile settings.

**Account-switch quarantine.** A local draft belonging to a different user ID is never merged. The
dialog explains: "There's an unfinished workout on this device from another account. It'll stay
there until you sign back into that account." → `( Keep it )` `( Delete it )`.

---

## L-08 · Maintenance / Degraded
**Route** `/maintenance` · **Priority** P1

**Full outage**
```
│              ( 🔧 )                          │
│       We're doing some maintenance           │
│   Back around 03:00 UTC. Anything you log    │
│   on this device will upload when we're up.  │
│        [ Keep using it offline ]             │
```
**The app remains usable offline during maintenance.** That is the entire point of the local-first
logger, and it is the difference between an outage being an annoyance and being a lost workout.

**Degraded — AI unavailable** (a banner, not a screen):
```
│ ✦ Food photo analysis is temporarily unavailable.       │
│   Search and manual entry work as usual.      [Dismiss] │
```
Surfaced in H-03 and H-01, which disable only the AI entry modes. **Nothing about workout logging,
meal logging, history or analytics is affected** — BRD §19's availability requirement, made visible.

**Degraded — nutrition provider unavailable:** food search falls back to custom and recently used
foods, with a note. Logging continues.

**Account disabled** (`users.status = disabled`): a full-screen explanation with a support contact
and an export option. Never a silent failure loop at the login screen.
