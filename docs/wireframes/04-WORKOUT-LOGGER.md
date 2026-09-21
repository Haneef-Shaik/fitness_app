# Wireframes · E — Workout Logger

[← Conventions](00-CONVENTIONS.md) · [Index](../README.md)

Screens E-01 … E-13. Implements FR-W03, FR-W04, FR-W05 and acceptance criteria AC-02, AC-04, AC-06.

> **This is the product.** Everything else can be a little slow. This cannot.
> The rules from [03-FRONTEND-ARCHITECTURE §1](../03-FRONTEND-ARCHITECTURE.md) apply to every screen
> in this file: a set commit never awaits the network, the draft is durable, and no spinner ever
> appears between "user typed reps" and "set is on screen".

---

## E-01 · Start Workout
**Route** `/train/start` · **Type** Stacked · **Priority** P0

```
┌──────────────────────────────────────────────┐
│ < Train            Start a workout           │
│                                              │
│  ┌──────────────────────────────────────────┐│
│  │ TODAY · Push — Chest & Triceps           ││
│  │ Push / Pull / Legs · 6 exercises         ││
│  │ Last done 5 days ago · 8,240 kg          ││
│  │           [   Start   ]                  ││
│  └──────────────────────────────────────────┘│
│                                              │
│  ( 🔁 Repeat last session )                  │
│      Chest & Triceps · 16 Sep                │
│  ( ➕ Empty workout )                        │
│  ( 📅 Log a past workout )                   │
│                                              │
│  OTHER DAYS IN THIS PROGRAM                  │
│   Pull — Back & Biceps       6 exercises  ›  │
│   Legs                       6 exercises  ›  │
│                                              │
│  OTHER PROGRAMS                              │
│   Upper / Lower              4 days       ›  │
│   Deload Week                3 days       ›  │
└──────────────────────────────────────────────┘
```

**Controls**
| Control | Action | Result |
|---------|--------|--------|
| Start (today's) | `POST /workout-sessions {plan_day_id}` | Creates the session, snapshots each `plan_exercise` into `session_exercises.target_snapshot`, → E-02 |
| Repeat last session | `POST` with `source=repeat` | Copies the **last completed session's** exercise list; prescriptions come from what was actually performed, not the plan |
| Empty workout | `POST` with no plan | → E-02 with an empty list and the add-exercise sheet already open |
| Log a past workout | date picker → `POST {started_at}` | Creates a session dated in the past. **Cannot be dated in the future** |
| Any plan-day row | `POST {plan_day_id}` | → E-02 |
| Any program row | expand | Shows that program's days |

**Edge cases**
- **A session is already in progress** → this screen is replaced by a card: "You're in the middle of
  *Chest & Triceps* (24:13, 8 sets)" with `[ Resume ]`, `( Finish it )`, `( Discard and start new )`.
  Starting a second session is never silently allowed — invariant: one `in_progress` per user.
- Offline → the session is created with a client-side UUID and queued. Everything works; a "will sync"
  note appears once.
- Past-dated session → E-02 shows a persistent banner, "Logging for 18 Sep", because otherwise a
  user will log today's workout into last week.
- No programs at all → only Empty workout and Log a past workout are offered, plus a link to C-04.
- The plan day's exercises include an archived exercise → included, flagged "archived", swappable.

**Events.** `session.started{source, plan_day_id, exercise_count, is_backdated}`

---

## E-02 · Active Session — Exercise List
**Route** `/session/[sessionId]` · **Type** Full-screen · **Priority** P0

**Purpose.** The session's map. Shows progress, lets the user move between exercises, and is the only
route to finishing.

```
┌──────────────────────────────────────────────┐
│ ✕      Chest & Triceps        24:13      ⋮   │
│        ━━━━━━━━━━━━━░░░░░░░  8 / 21 sets     │
├──────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────┐│
│  │ ✓ 1  Barbell Bench Press                 ││
│  │      4 / 4 sets · 2,560 kg          🏆   ││
│  │      80 × 8 · 80 × 8 · 80 × 7 · 77.5 × 8 ││
│  ├──────────────────────────────────────────┤│
│  │ ▶ 2  Incline Dumbbell Press        ⋮    ││
│  │      2 / 3 sets · in progress            ││
│  │      30 × 10 · 30 × 9                    ││
│  │      ━━━━━━━━━━━━━━░░░░░░                ││
│  ├──────────────────────────────────────────┤│
│  │ ○ 3  Cable Fly                     ⋮    ││
│  │      0 / 3 sets · 12–15 reps             ││
│  ├──────────────────────────────────────────┤│
│  │ ○ 4  Overhead Press                ⋮    ││
│  │ ○ 5  Triceps Pushdown              ⋮    ││
│  │ ○ 6  Overhead Triceps Extension    ⋮    ││
│  └──────────────────────────────────────────┘│
│  [ + Add an exercise ]                       │
│                                              │
│  📝 Session notes                         ›  │
├──────────────────────────────────────────────┤
│  ( Discard )              [   Finish   ]     │
└──────────────────────────────────────────────┘
```

**Controls**
| Control | Action | Result |
|---------|--------|--------|
| ✕ | minimise | Returns to the previous screen. **The session stays open** and the active-session bar appears. Not a discard |
| Timer `24:13` | — | Live elapsed since `started_at`. Tap to toggle elapsed/clock time |
| ⋮ (session) | menu | Session notes · Reorder exercises · Log for a different date · Discard |
| Exercise row tap | navigate | → E-03 for that exercise |
| ⋮ (exercise) | menu | Swap exercise (E-05) · Add a note · Move up/down · Remove · Mark as skipped |
| Drag (in reorder mode) | reorder | Re-densifies `order_index` |
| + Add an exercise | sheet | → E-05 |
| Session notes | sheet | → E-07 |
| Discard | dialog | → E-09 |
| **Finish** | navigate | → E-08 summary (not an immediate commit) |
| Swipe left/right on a row | quick actions | Reveal "Skip" and "Remove" |

**Row states.** `✓` complete (sets done ≥ target) · `▶` in progress · `○` not started · `⊘` skipped
(muted, "skipped" label, still tappable to un-skip).

**States**
| State | Behaviour |
|-------|-----------|
| Empty session | The add-exercise sheet opens automatically; the list shows "Add your first exercise" |
| All exercises complete | The Finish button gets a subtle emphasis and the header reads "All sets done" |
| Backdated session | A persistent banner: "Logging for 18 Sep" |
| Offline | A quiet chip, "Offline — everything's saved on this device." No blocking, no repeated toasts |
| Some sets failed to sync | A per-row sync dot; a single header chip "{n} not synced yet" → L-02 |

**Edge cases**
- **App killed / browser closed** → the draft is in IndexedDB; E-10 recovers it on next launch.
- **Session open past local midnight** → the session's date remains `started_at`'s local date; the
  banner states which date it will be filed under.
- **Session open > 6 h** → on next foreground, a prompt: *Finish now / Keep going / Discard*.
  Never auto-finished, never auto-discarded — a 7-hour session is unusual but legitimate.
- **Removing an exercise with logged sets** → confirmation naming the set count, then undo.
- **Reordering after sets are logged** → allowed; `order_index` is presentation, `performed_at` is truth.
- **Same exercise twice in one session** → two separate `session_exercises` rows, each with its own
  set list and its own previous-performance lookup.
- **Finish with zero completed sets** → E-08 warns: "No sets logged. Discard instead?" with both
  options. An empty completed session is allowed but is almost always a mistake.

**a11y.** The list is a `role="list"` with each row's accessible name reading "Exercise 2 of 6,
Incline Dumbbell Press, 2 of 3 sets done". The timer is an `aria-live="off"` region (it must not
announce every second) with an on-demand label.

---

## E-03 · Set Logger ★
**Route** `/session/[sessionId]/[exerciseId]` · **Type** Full-screen · **Priority** P0

**The single most important screen in the product.** AC-02 and AC-04 both live here.

```
┌──────────────────────────────────────────────┐
│ ‹  Incline Dumbbell Press       2 / 6    ⋮   │
│    chest · front delts          target 3×8-10│
├──────────────────────────────────────────────┤
│ ① LAST TIME · 16 Sep                      ›  │
│   30 × 10   30 × 9   27.5 × 10               │
│                                              │
│ ② TODAY                                      │
│  ┌────┬────────┬───────┬──────┬────┐         │
│  │ #  │  kg    │ reps  │ RPE  │    │         │
│  ├────┼────────┼───────┼──────┼────┤         │
│  │ W  │  20    │  12   │  —   │ ✓ ●│         │
│  │ 1  │  30    │  10   │  8   │ ✓ ●│  ▲ =    │
│  │ 2  │  30    │   9   │  9   │ ✓ ◐│  ▲ =    │
│  ├────┼────────┼───────┼──────┼────┤         │
│  │ 3  │ ┌────┐ │┌────┐ │ ┌──┐ │    │         │
│  │    │ │ 30 │ ││ 9  │ │ │ 9│ │ ✓  │ ← active│
│  │    │ └────┘ │└────┘ │ └──┘ │    │         │
│  └────┴────────┴───────┴──────┴────┘         │
│                                              │
│ ③ ( − 2.5 )  30 kg  ( + 2.5 )   [ kg ] (lb)  │
│    ( − 1 )    9 reps  ( + 1 )                │
│                                              │
│ ④ [        ✓  Save set 3        ]            │
│    ( 🔁 Same as last set )  ( ⋯ More )       │
│                                              │
│ ⑤ + Add a set        🧮 Plate calculator     │
├──────────────────────────────────────────────┤
│  ‹ Bench Press          Cable Fly ›          │
└──────────────────────────────────────────────┘
```

### Regions

| # | Region | Detail |
|---|--------|--------|
| ① | **Previous performance** (FR-W05) | The most recent completed session containing this exercise. Always visible, never behind a tap. `›` → F-03 for that session |
| ② | **Today's sets** | Committed sets, newest at the bottom. Per-set delta vs the matching previous set. Sync dot per row |
| ③ | **Entry controls** | Large steppers with unit-aware increments. The numeric fields are directly editable |
| ④ | **Commit** | The primary action. Full width, ≥ 56 px |
| ⑤ | Secondary | Add an empty row; plate calculator (E-12) |
| — | Footer | Swipe or tap to the previous/next exercise, without going back to E-02 |

### Controls

| Control | Action | Result | Failure |
|---------|--------|--------|---------|
| **✓ Save set** | Commit | Validates locally → new draft state → renders immediately → persists to IndexedDB → enqueues the write → starts the rest timer → prefills the next set from this one | Network failure is invisible here; the row shows a pending dot and retries |
| 🔁 Same as last set | Commit a copy | One tap to repeat the previous set's load and reps. **The fastest path, and the most-used control in the product** | — |
| ( − ) / ( + ) load | Stepper | Default ±2.5 kg / ±5 lb, configurable in K-04. Long-press accelerates | — |
| ( − ) / ( + ) reps | Stepper | ±1 | — |
| Load / reps field tap | Direct edit | Opens a numeric keypad (`inputMode="decimal"`), selects the existing value | — |
| kg / lb toggle | Display convert | Converts the displayed number; `load_kg` stays canonical. The chosen unit is remembered per exercise | — |
| RPE field | Stepper / slider | 0–10 in 0.5 steps. **Hidden unless enabled in K-04** | — |
| ⋯ More | Sheet | → E-06: set type, RIR, duration, distance, per-set note | — |
| Set row tap | Edit | Re-opens that set in the entry controls; ✓ becomes "Update set 2" | — |
| Set row swipe left | Delete | Undo toast; remaining `set_index` values re-densify | — |
| Set row long-press | Menu | Edit · Duplicate · Mark as warm-up · Delete | — |
| W badge | Toggle | Marks the set as a warm-up. Warm-ups are excluded from volume and PRs (D6) and shown muted | — |
| + Add a set | Append | An empty row prefilled from the last set | — |
| 🧮 Plate calculator | Sheet | → E-12 | — |
| `‹ Bench Press` / `Cable Fly ›` | Navigate | Previous/next exercise in the session. Also a horizontal swipe | — |
| ‹ (top left) | Navigate | → E-02. The session stays open | — |
| ⋮ | Menu | Exercise notes · Swap exercise · Exercise history (D-02) · Remove from session | — |

### Adaptive fields
The entry controls are **generated from the exercise's tracked fields**, not fixed:

| Exercise type | Fields shown |
|---------------|--------------|
| Barbell / dumbbell / machine (`tracks_load`, `tracks_reps`) | load, reps, (RPE) |
| Bodyweight (`tracks_reps` only) | reps, (RPE), optional "+ added weight" |
| Timed hold (`tracks_duration`) | duration (mm:ss), (RPE) |
| Cardio (`tracks_duration`, `tracks_distance`) | duration, distance, (RPE) |
| Weighted carry | load, distance, (duration) |

A set with **no reps and no duration and no distance** is invalid and cannot be committed (W04.7).
Load alone is not a set.

### Previous-performance states
| State | Render |
|-------|--------|
| Loaded | `30 × 10   30 × 9   27.5 × 10` + a date and a `›` link |
| Loading | A skeleton strip. **Entry is fully usable while it loads** |
| Never performed | "First time logging this — go get a baseline." Not an error, not an empty box |
| Failed to load | "Couldn't load last time" + a retry chip. Entry unaffected |
| Same exercise twice this session | The lookup ignores the current session entirely |

### Deltas
Each committed set shows its comparison with the corresponding set from last time:
`▲ +2.5 kg` · `▲ +1 rep` · `=` · `▼ −1 rep`.
Improvements use `--status-good` + ▲. **Regressions use `--ink-secondary` + ▼, never red** — a lighter
day is information, not a failure (design principle, [05-DESIGN-SYSTEM §2.4](../05-DESIGN-SYSTEM.md)).

### Validation
| Field | Rule | Message |
|-------|------|---------|
| Reps | integer 1–1000 | "Reps must be a whole number of at least 1." |
| Load | ≥ 0, ≤ 1000 kg, up to 2 decimals | "That's over 1000 kg — is that right?" (soft confirm, not a block) |
| Duration | 1 s – 24 h | — |
| Distance | > 0 | — |
| RPE / RIR | 0–10, 0.5 steps | — |
| Whole set | at least one of reps / duration / distance | "Add reps, time or distance to save this set." |

Soft warnings (a load 3× the previous best, 50+ reps) ask for confirmation once and then remember
the answer for that exercise — the app must not nag a user who genuinely deadlifts 300 kg.

### Edge cases
- **Rapid double-tap on ✓** → debounced; the idempotency key is the set's `clientId`, so even a
  duplicated request creates one set.
- **Editing a set that has already synced** → a `PATCH` is queued; the row shows a syncing dot.
- **Deleting a synced set** → a `DELETE` is queued; remaining indices re-densify locally and the
  server does the same in one transaction.
- **A set that beats a PR** → the row gets a 🏆; the celebration (E-11) is deferred to E-08 so it
  never interrupts the working set. *(Interrupting a user mid-set to congratulate them is the single
  worst thing this screen could do.)*
- **The keypad covers the commit button** → the entry block and ✓ are pinned above the keyboard;
  this is a layout requirement, not a nicety.
- **Screen lock / app backgrounded mid-entry** → uncommitted field values are preserved in the draft.
- **Unit toggled mid-session** → previously committed sets re-render in the new unit from canonical
  `load_kg`; no stored value changes.
- **Offline for the whole session** → indistinguishable from online, except for the pending dots.
- **Exercise archived mid-session** (another device) → logging continues; the archive affects pickers only.
- **A set validation `4xx` from the server** → the row turns `--status-serious` with an inline
  "Couldn't save — tap to fix". **Never a modal**, never a lost value.

### Keyboard / a11y
- Tab order: load → reps → RPE → ✓. **Enter commits the set** from any field.
- ↑/↓ in a numeric field increments by the stepper's step.
- Committing announces "Set 3 saved: 30 kilograms for 9 reps" via `aria-live="polite"`.
- Every stepper button has an explicit label ("Increase load by 2.5 kilograms").
- The set table is a real `<table>` with headers, so a screen reader can read it row by row.
- All targets ≥ 56 px. The commit button is full width so it cannot be missed one-handed.

### Events
`session.set_committed{set_type, has_rpe, interaction_ms, was_prefilled, used_repeat, offline}` ·
`session.set_edited` · `session.set_deleted` · `session.exercise_changed{direction}`

---

## E-04 · Rest Timer
**Type** Overlay · **Priority** P0

```
   ┌────────────────────────────────────────┐
   │  Rest                            ✕     │
   │                                        │
   │             1 : 47                     │   large, tabular
   │        ━━━━━━━━━━━━━━░░░░░░░░          │
   │                                        │
   │   ( − 15 s )   ( + 15 s )   ( Skip )   │
   │                                        │
   │   Next: set 4 · 30 kg × 9              │
   └────────────────────────────────────────┘
```

**Behaviour**
- Starts automatically after a committed set when the exercise has a `rest_seconds` target and the
  feature is on (K-04). Never for warm-up sets by default.
- **Collapses to a slim bar** at the top of E-03 so set entry is never blocked. Tapping expands it.
- Survives navigation, tab switches and backgrounding — the countdown is derived from a target
  timestamp, not an interval counter, so it stays accurate after the tab is throttled.
- On completion: haptic + optional sound + a local notification if the app is backgrounded.
  All three are individually configurable, and all default **on except sound**.

**Controls.** ±15 s adjust the current countdown only. Skip dismisses it. ✕ dismisses and disables
auto-start for the rest of this exercise.

**Edge cases.** Committing another set while the timer runs restarts it. Browser tab throttling → the
timestamp basis keeps it correct. Notification permission denied → falls back to in-app haptic and
visual only, with no repeated prompting. `prefers-reduced-motion` → the progress bar updates in
discrete steps rather than animating.

---

## E-05 · Add / Swap Exercise
**Type** Sheet · **Priority** P0

Reuses C-06's picker with a session-specific header and two modes:

```
┌──────────────────────────────────────────────┐
│               ───                            │
│  Swap "Incline Dumbbell Press"               │
│  Your 2 logged sets will move to the new     │
│  exercise.                          ⓘ        │
│                                              │
│  SUGGESTED ALTERNATIVES                      │
│   Incline Barbell Press    chest · delts     │
│   Machine Chest Press      chest             │
│   Push-up (weighted)       chest · triceps   │
│  ──────────────────────────────────────────  │
│  🔍 Search all exercises…                    │
└──────────────────────────────────────────────┘
```

| Mode | Behaviour |
|------|-----------|
| **Add** | Appends a new `session_exercise` at the end with `order_index = n`. Optionally insert at a position |
| **Swap** | Changes `session_exercise.exercise_id`. **Logged sets are kept and move with it** — the alternative (deleting the sets) silently destroys work |

**Suggested alternatives** are exercises sharing the same primary muscle and movement pattern
`[ASSUMPTION — a simple heuristic at MVP; FR "exercise substitutions" is Phase 2]`.

**Edge cases.** Swapping to an exercise with different tracked fields (load-based → duration-based)
warns that the logged sets' load values will be retained but no longer displayed, and requires
confirmation. Swapping resets the previous-performance lookup to the new exercise. Undo is available
for 10 seconds.

---

## E-06 · Advanced Set Editor
**Type** Sheet · **Priority** P1

```
┌──────────────────────────────────────────────┐
│               ───                       Done │
│  Set 3 · Incline Dumbbell Press              │
│                                              │
│  Set type                                    │
│  ( Warm-up ) [ Working ] ( Drop ) ( Failure )│
│                                              │
│  Load       ┌────────┐  [kg] (lb)            │
│             │  30    │                       │
│  Reps       ┌────────┐                       │
│             │   9    │                       │
│  RPE        ├─────●────────┤   9             │
│  RIR        ├──●───────────┤   1             │
│  Duration   ┌────────┐ mm:ss  (optional)     │
│  Distance   ┌────────┐ m      (optional)     │
│                                              │
│  Note       ┌────────────────────────────┐   │
│             │ Left side felt weak        │   │
│             └────────────────────────────┘   │
│                                              │
│  ( Delete set )              [ Save ]        │
└──────────────────────────────────────────────┘
```

**Set types and their consequences** — stated in the UI, because they change the numbers:

| Type | Counts toward volume | Eligible for a PR |
|------|---------------------|-------------------|
| Warm-up | No (D6, toggleable in K-04) | No |
| Working | Yes | Yes |
| Drop | Yes | No `[ASSUMPTION]` — a drop set is not a clean PR attempt |
| Failure | Yes | Yes |

RPE and RIR are inverse views of the same judgement; editing one **suggests** the other
(`RIR ≈ 10 − RPE`) without forcing it, and both are stored as entered.

---

## E-07 · Session Notes
**Type** Sheet · **Priority** P1

A textarea bound to `workout_sessions.notes`, with quick-tag chips (`felt strong`, `tired`,
`short on time`, `elbow pain`) that append text. Autosaves on blur into the draft; ≤ 2000 characters.
Per-exercise notes use the same sheet bound to `session_exercises.notes`.

---

## E-08 · Finish Summary
**Route** `/session/[sessionId]/finish` · **Type** Full-screen · **Priority** P0

**Purpose.** Confirm, show what was achieved, and commit. Satisfies AC-06.

```
┌──────────────────────────────────────────────┐
│ ‹ Back            Finish workout             │
│                                              │
│              Chest & Triceps                 │
│              Tue 21 Sep · 58 min             │
│                                              │
│  ┌────────────┬────────────┬───────────────┐ │
│  │  6         │  21        │  8,940 kg     │ │
│  │  exercises │  sets      │  volume       │ │
│  └────────────┴────────────┴───────────────┘ │
│                                              │
│  🏆 NEW PERSONAL RECORDS                     │
│  ┌──────────────────────────────────────────┐│
│  │ Barbell Bench Press                      ││
│  │ Max load  102.5 kg   was 100 kg   ▲2.5   ││
│  │ e1RM      118 kg     was 115 kg   ▲3     ││
│  └──────────────────────────────────────────┘│
│                                              │
│  VS LAST TIME · 16 Sep                       │
│   Volume    8,940 kg   ▲ 700 kg  (+8.5%)     │
│   Sets      21         ▲ 1                   │
│   Duration  58 min     ▼ 4 min               │
│                                              │
│  ⚠ Cable Fly — no sets logged.               │
│     ( Mark as skipped )  ( Go back )         │
│                                              │
│  Notes  ┌────────────────────────────────┐   │
│         │ Felt strong on bench today.    │   │
│         └────────────────────────────────┘   │
│                                              │
│  [        Finish workout        ]            │
│  ( Keep training )                           │
└──────────────────────────────────────────────┘
```

**Controls**
| Control | Action | Result |
|---------|--------|--------|
| **Finish workout** | `POST /workout-sessions/:id/finish` | Sets `completed_at`, `status = completed`, computes volume + e1RM + PRs in the finish transaction → E-11 (if PRs) → F-03 |
| Keep training | navigate | → E-02, session stays `in_progress` |
| ‹ Back | navigate | → E-02, nothing committed |
| Mark as skipped | update | Flags the empty exercise as skipped; removes the warning |
| Go back | navigate | → E-03 for that exercise |
| Notes | text | Appends to / edits `workout_sessions.notes` |
| PR card tap | navigate | → G-04 |

**Edge cases**
- **No sets logged at all** → the primary action becomes `( Finish anyway )` and `[ Discard ]` is
  promoted, with "No sets were logged. Finishing will save an empty session."
- **Offline** → finishing is queued. The summary is computed **client-side** from the local draft, so
  the numbers are shown immediately; the server recomputes authoritatively on sync and any difference
  is reconciled silently (the client and server use the same formulas from `lib/training`).
- **First-ever session for this plan day** → "Vs last time" is replaced by "This is your baseline."
- **PR computation disagrees after sync** → the server is authoritative; F-03 shows the corrected
  values. This is rare and must never surface as an error.
- **Exercises with sets but none marked complete** → counted as logged; `completed = false` sets are
  excluded from volume, and the summary says so in a footnote.
- **Duration** is `completed_at − started_at`. If a session ran > 6 h, the summary asks whether to
  trim the duration to the last logged set's timestamp instead.
- **Finish tapped twice** → idempotent on the session ID; the second call returns the same result.

**Events.** `session.finished{duration_s, exercise_count, set_count, volume_kg, pr_count, offline}`

---

## E-09 · Discard Session
**Type** Dialog · **Priority** P0

```
   ┌────────────────────────────────────────┐
   │  Discard this workout?                 │
   │                                        │
   │  You've logged 8 sets across 2         │
   │  exercises. They'll be deleted.        │
   │  This can't be undone.                 │
   │                                        │
   │  ( Keep training )    [ Discard ]      │
   └────────────────────────────────────────┘
```

Always names the exact count of what will be lost. `[ Discard ]` is the destructive style and is
**not** the default focus — focus lands on "Keep training". With more than 15 logged sets, the
confirmation escalates to requiring a typed "discard" `[ASSUMPTION]`.

Discarding sets `status = cancelled` (rows retained per BRD §9's enum) and clears the local draft.
A cancelled session never appears in history or analytics.

---

## E-10 · Session Recovery
**Type** Overlay on B-01 · **Priority** P0

**The screen that makes Risk R4 survivable.**

```
┌──────────────────────────────────────────────┐
│  ⚡ You have an unfinished workout            │
│                                              │
│  Chest & Triceps                             │
│  Started 1h 12m ago · 8 sets logged          │
│  Last set: Incline DB Press 30 kg × 9        │
│                                              │
│  [    Resume    ]                            │
│  (   Finish it now   )                       │
│  (   Discard   )                             │
└──────────────────────────────────────────────┘
```

**Trigger.** A local draft with `status = in_progress`, or `GET /workout-sessions/active` returning a
session, found at app start.

**Reconciliation.** If a local draft and a server session both exist for the same `session_id`, the
outbox is replayed (set writes are idempotent on `clientId`) and the union is presented. If they are
*different* sessions — genuinely possible across two devices — both are listed and the user picks;
neither is deleted without an explicit choice.

**Edge cases.** A draft older than 24 h shows its age prominently and puts "Finish it now" first.
A draft belonging to a different user ID (account switch) is quarantined and never merged (L-07).
A draft whose exercises reference a deleted custom exercise still opens — the exercise renders by its
stored name.

---

## E-11 · PR Celebration
**Type** Overlay · **Priority** P1

```
   ┌────────────────────────────────────────┐
   │              🏆                        │
   │          New personal record           │
   │                                        │
   │        Barbell Bench Press             │
   │            102.5 kg                    │
   │         previous best 100 kg           │
   │                                        │
   │  ( See progression )     [ Nice ]      │
   └────────────────────────────────────────┘
```

Shown **only after E-08**, never mid-set. Multiple PRs paginate with dots rather than stacking
modals. Skipped entirely under `prefers-reduced-motion` (the PR still appears in the summary and on
F-03). Dismissible by tap-anywhere, Esc, or swipe. "See progression" → G-03.

---

## E-12 · Plate Calculator
**Type** Sheet · **Priority** P1

```
┌──────────────────────────────────────────────┐
│               ───                            │
│  Load 102.5 kg                               │
│  Bar 20 kg  ( 15 ) [ 20 ] ( 25 ) ( custom )  │
│                                              │
│  Per side:  20 · 20 · 1.25                   │
│  ┌──────────────────────────────────────┐    │
│  │ ▐█▌ ▐█▌ ▌            BAR             │    │
│  └──────────────────────────────────────┘    │
│                                              │
│  Closest achievable: 102.5 kg ✓              │
│  Available plates                        ⚙   │
└──────────────────────────────────────────────┘
```

Computes the per-side plate stack for the current target load. If the exact load is unachievable with
the configured plates, it shows the nearest achievable load and offers to use it. Available plate
inventory is configurable and persists (K-04). Switches to lb plates with the unit.

---

## E-13 · Supersets & Circuits `[P2]`
**Priority** P2

Grouping `session_exercises` so the logger alternates between them and the rest timer applies to the
group rather than each exercise. Requires a `group_id` and `group_order` on `session_exercises`.
**Not built at MVP**; the columns are not added until the feature is scheduled, to avoid a half-used
schema.

---

## Logger — cross-cutting requirements

| Concern | Requirement |
|---------|-------------|
| **Latency** | p95 tap → set rendered < 100 ms. This is a hard budget, not a target |
| **Durability** | Every committed set is in IndexedDB before the UI settles. No debounce on persistence |
| **Network independence** | The entire flow — start, log, swap, finish — works offline |
| **Screen wake** | The screen-wake lock is held during an active session (with a user-visible toggle) so the phone doesn't sleep between sets |
| **Interruption** | A phone call, a notification, or an app switch never loses uncommitted field values |
| **One hand** | Every control in E-03 is reachable in the bottom two-thirds of the screen |
| **Keyboard** | The full flow is operable from a hardware keyboard for desktop users |
| **No blocking UI** | No modal, spinner or toast may ever sit between the user and the next set |
