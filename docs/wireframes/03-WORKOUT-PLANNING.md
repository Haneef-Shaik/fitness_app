# Wireframes · C & D — Workout Planning and Exercise Catalog

[← Conventions](00-CONVENTIONS.md) · [Index](../README.md)

Screens C-01 … C-09, D-01 … D-05. Implements FR-W01, FR-W02.

> **The governing rule for everything in this file:** editing a plan **never** touches a
> `workout_session`, `session_exercise` or `workout_set` (BRD §7, AC-12). Every screen here writes
> only to the plan tree.

---

## C-01 · Train Hub
**Route** `/train` · **Type** Tab root · **Priority** P0

```
┌──────────────────────────────────────────────┐
│  Train                              🔔  (AB) │
├──────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────┐│
│  │ TODAY · Push · Chest & Triceps           ││
│  │ 6 exercises · ~52 min                    ││
│  │ [   Start workout   ]      ( Change )    ││
│  └──────────────────────────────────────────┘│
│                                              │
│  ( Empty workout )   ( Repeat last )         │
│                                              │
│  ────────────────────────────────────────    │
│  📋 Programs                     3 active  › │
│  📚 Exercise library            412 items  › │
│  🕐 History                   84 sessions  › │
│  📊 Analytics                              › │
│  🏆 Personal records              24 PRs   › │
│  ────────────────────────────────────────    │
│                                              │
│  RECENT SESSIONS                             │
│   Chest & Triceps   16 Sep · 8,240 kg · 🏆   │
│   Legs              14 Sep · 11,900 kg       │
│   Back & Biceps     12 Sep · 9,100 kg        │
│                                  See all ›   │
└──────────────────────────────────────────────┘
```

**Controls**
| Control | Destination | Note |
|---------|-------------|------|
| Start workout | E-02 (creates the session) | Becomes `[ Resume ]` if one is in progress |
| Change | E-01 | Pick a different plan day or template |
| Empty workout | E-02 with no exercises | Ad-hoc training |
| Repeat last | E-01 preloaded with the last completed session's exercises | Prescriptions come from that session's actual sets |
| Programs | C-02 | |
| Exercise library | D-01 | |
| History | F-01 | |
| Analytics | G-01 | |
| Personal records | G-04 | |
| A recent session row | F-03 | |
| See all | F-01 | |

**States.** No program → the today card becomes "No program yet" + `[ Browse starter programs ]`
(→ A-09 content) + `( Build my own )` (→ C-04). No history → the recent list is replaced by a single
line, "Your sessions will show up here."

---

## C-02 · Programs List
**Route** `/train/programs` · **Type** Stacked · **Priority** P0

```
┌──────────────────────────────────────────────┐
│ < Train               Programs          [ + ]│
│  [ Active ] ( Archived )                     │
│                                              │
│  ┌──────────────────────────────────────────┐│
│  │ Push / Pull / Legs              ⋮        ││
│  │ 3 days · 18 exercises                    ││
│  │ Mon · Wed · Fri        ● scheduled       ││
│  │ Last used 5 days ago                     ││
│  ├──────────────────────────────────────────┤│
│  │ Upper / Lower                   ⋮        ││
│  │ 4 days · 22 exercises · not scheduled    ││
│  ├──────────────────────────────────────────┤│
│  │ Deload Week                     ⋮        ││
│  │ 3 days · 12 exercises                    ││
│  └──────────────────────────────────────────┘│
└──────────────────────────────────────────────┘
```

**Controls**
| Control | Action | Result |
|---------|--------|--------|
| `[ + ]` | navigate | → C-04 create |
| Active / Archived | filter | `status` filter; archived rows are muted with a "Restore" action |
| Row tap | navigate | → C-03 |
| ⋮ menu | menu | Edit (C-04) · Duplicate (C-09) · Schedule (C-08) · Archive (C-09) · Delete (only if never used) |

**Edge cases**
- **Delete vs archive.** A program referenced by any `workout_session.plan_day_id` **cannot be
  deleted**, only archived — the menu item is disabled with the reason "Used by 12 sessions". This is
  the BRD §7 soft-delete principle made visible.
- Duplicate → "Push / Pull / Legs (copy)", a deep copy of days, exercises and prescriptions, new IDs.
- Archived program that is still scheduled → scheduling is cleared on archive and the user is told.
- A program with zero days → shown with "No days yet" and a direct `[ Add a day ]`.
- Offline → list renders from cache; create/edit are queued through the outbox.

---

## C-03 · Program Detail
**Route** `/train/programs/[programId]` · **Type** Stacked · **Priority** P0

```
┌──────────────────────────────────────────────┐
│ < Programs        Push / Pull / Legs      ⋮  │
│  Classic 3-day split. Progressive overload   │
│  on the main lifts.                          │
│  3 days · 18 exercises · Mon · Wed · Fri     │
│                                              │
│  ┌──────────────────────────────────────────┐│
│  │ DAY 1 · Push — Chest & Triceps      ⋮   ││
│  │ Mon · 6 exercises · ~52 min              ││
│  │   Barbell Bench Press    4 × 6-8  @80 kg ││
│  │   Incline DB Press       3 × 8-10        ││
│  │   Cable Fly              3 × 12-15       ││
│  │   + 3 more                            ⌄  ││
│  │   [ Start this workout ]    ( Edit )     ││
│  ├──────────────────────────────────────────┤│
│  │ DAY 2 · Pull — Back & Biceps        ⋮   ││
│  │ Wed · 6 exercises                        ││
│  ├──────────────────────────────────────────┤│
│  │ DAY 3 · Legs                        ⋮   ││
│  │ Fri · 6 exercises                        ││
│  └──────────────────────────────────────────┘│
│                                              │
│  [ + Add a day ]                             │
│                                              │
│  ADHERENCE · last 4 weeks                    │
│  ━━━━━━━━━━━━━━━━░░░░░  9 of 12 completed    │
│                              See details ›   │
└──────────────────────────────────────────────┘
```

**Controls**
| Control | Action | Result |
|---------|--------|--------|
| ⋮ (program) | menu | Edit · Duplicate · Schedule (C-08) · Archive · Delete |
| Day header tap | navigate | → C-05 plan day editor |
| ⋮ (day) | menu | Edit · Duplicate day · Move up/down · Delete day |
| ⌄ +3 more | expand | Reveals the full exercise list inline |
| Start this workout | `POST /workout-sessions {plan_day_id}` | → E-02. **Available for any day**, not just today's |
| Edit | navigate | → C-05 |
| + Add a day | create | Appends a day with the next `day_index` → C-05 |
| See details › | navigate | → G-06 adherence, filtered to this program |

**Edge cases**
- Deleting a day used by past sessions → allowed, but a dialog states "12 past sessions used this
  day. They'll keep their records." `plan_day_id` becomes a dangling reference that history tolerates
  because sessions are self-describing.
- Reordering days re-densifies `day_index` in one transaction.
- A day with no exercises → "No exercises yet" + `[ Add exercises ]`; `[ Start this workout ]` is
  still enabled (an empty session is valid — exercises can be added live).
- Adherence with no planned sessions in the range → "Not enough data yet", never "0%".

---

## C-04 · Program Create / Edit
**Route** `/train/programs/new` · `/train/programs/[id]/edit` · **Type** Stacked · **Priority** P0

```
┌──────────────────────────────────────────────┐
│ ✕ Cancel          New program          [Save]│
│                                              │
│  Name *                                      │
│  ┌────────────────────────────────────────┐  │
│  │ Push / Pull / Legs                     │  │
│  └────────────────────────────────────────┘  │
│  Description                                 │
│  ┌────────────────────────────────────────┐  │
│  │ Classic 3-day split…                   │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  DAYS                                        │
│  ┌──────────────────────────────────────────┐│
│  │ ⠿ 1  Push — Chest & Triceps     Mon  ✕  ││
│  │ ⠿ 2  Pull — Back & Biceps       Wed  ✕  ││
│  │ ⠿ 3  Legs                       Fri  ✕  ││
│  └──────────────────────────────────────────┘│
│  [ + Add a day ]                             │
│                                              │
│  ( Start from a template )                   │
└──────────────────────────────────────────────┘
```

**Controls**
| Control | Action | Result |
|---------|--------|--------|
| Name | text, required | Validation: 1–80 chars, unique per user (a duplicate warns but does not block) |
| Description | textarea, optional | ≤ 500 chars |
| ⠿ | reorder | Drag or keyboard; re-densifies `day_index` |
| Day name field | inline edit | Tapping the row name edits it in place |
| Weekday chip | select | `scheduled_weekday`, or "Not scheduled" |
| ✕ per day | remove | Undo toast. If the day has exercises, confirms first |
| + Add a day | append | New row, focus moves to its name field |
| Start from a template | sheet | Prefills days + exercises from a platform template (deep copy) |
| Save | `POST`/`PATCH` | → C-03 |
| ✕ Cancel | intercept | "Discard this program?" if anything was typed |

**Validation.** Name required. Days may be zero at save (a program can be built incrementally).
Duplicate weekday assignments are allowed with a warning — some people train twice a day.

---

## C-05 · Plan Day Editor
**Route** `/train/plan-days/[dayId]` · **Type** Stacked · **Priority** P0

**Purpose.** The prescription surface — the screen that makes AC-01 pass.

```
┌──────────────────────────────────────────────┐
│ ✕            Push — Chest & Triceps    [Save]│
│  Day name  ┌──────────────────────────────┐  │
│            │ Push — Chest & Triceps       │  │
│            └──────────────────────────────┘  │
│  Scheduled  ( — ) [Mon] ( Tue ) ( Wed ) …    │
│                                              │
│  EXERCISES                              6    │
│  ┌──────────────────────────────────────────┐│
│  │ ⠿ 1  Barbell Bench Press            ⋮   ││
│  │      chest · triceps · front delts       ││
│  │      4 sets · 6–8 reps · 80 kg · 180 s   ││
│  ├──────────────────────────────────────────┤│
│  │ ⠿ 2  Incline Dumbbell Press         ⋮   ││
│  │      chest · front delts                 ││
│  │      3 sets · 8–10 reps · — · 120 s      ││
│  ├──────────────────────────────────────────┤│
│  │ ⠿ 3  Cable Fly                      ⋮   ││
│  │      chest                               ││
│  │      3 sets · 12–15 reps · — · 90 s      ││
│  └──────────────────────────────────────────┘│
│  [ + Add exercises ]                         │
│                                              │
│  Notes                                       │
│  ┌────────────────────────────────────────┐  │
│  │ Bench first, always warm up shoulders. │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  Estimated 52 min · chest 13 sets ·          │
│  triceps 7 · delts 4                         │
└──────────────────────────────────────────────┘
```

**Controls**
| Control | Action | Result |
|---------|--------|--------|
| Day name | text | Required, ≤ 60 chars |
| Weekday chips | single-select | `scheduled_weekday`, "—" clears it |
| ⠿ | reorder | Re-densifies `order_index` |
| Exercise row tap | open sheet | → C-07 prescription editor |
| ⋮ per exercise | menu | Edit prescription · Replace exercise (→ C-06) · Duplicate · Remove |
| + Add exercises | open sheet | → C-06 picker, multi-select, appends in pick order |
| Notes | textarea | `workout_plan_days.notes` |
| Save | `PUT /plan-days/:id/exercises` (bulk) + `PATCH` the day | One transaction so ordering can't half-apply |
| ✕ | intercept | Discard confirmation if dirty |

**Regions.** The footer line is a **live set-count-per-muscle summary**, computed from
`exercise_muscles` (primary ×1, secondary ×0.5, rounded). It is the fastest way to catch an
unbalanced day at design time, and it uses the same weighting as G-02 so planning and analytics agree.

**Edge cases**
- The same exercise added twice → allowed (common: bench heavy, then bench light). They are distinct
  `plan_exercises` rows with distinct `order_index`.
- An archived exercise already in the plan → shown with an "archived" chip and a replace action; it
  is never silently removed.
- Removing the last exercise → the day stays valid and empty.
- Reordering while offline → applied locally and queued; the bulk order call is idempotent.
- Save conflict (edited on another device) → L-07 with both versions.
- A very long exercise list (> 15) → the estimated-duration line warns "That's a long session".

**a11y.** The exercise list is a `role="list"`; each row's accessible name reads
"Position 1, Barbell Bench Press, 4 sets of 6 to 8 reps at 80 kilograms". Keyboard reorder with the
handle focused; every move is announced.

---

## C-06 · Exercise Picker
**Type** Sheet (full-height) · **Priority** P0

```
┌──────────────────────────────────────────────┐
│               ───                       Done │
│  🔍 ┌──────────────────────────────────────┐ │
│     │ bench                                │ │
│     └──────────────────────────────────────┘ │
│  ( All ) [ Chest ] ( Back ) ( Legs ) …    ⚙  │
│                                              │
│  ☑ Barbell Bench Press          barbell      │
│      chest · triceps · front delts           │
│  ☐ Incline Barbell Bench Press  barbell      │
│  ☑ Dumbbell Bench Press         dumbbell     │
│  ☐ Close-Grip Bench Press       barbell      │
│                                              │
│  RECENT                                      │
│  ☐ Cable Fly · ☐ Overhead Press              │
│                                              │
│  Can't find it?  [ + Create "bench" ]        │
├──────────────────────────────────────────────┤
│  2 selected              [   Add 2   ]       │
└──────────────────────────────────────────────┘
```

**Controls**
| Control | Action | Result |
|---------|--------|--------|
| Search | debounced 300 ms | Matches name + aliases; typo-tolerant |
| Muscle chips | filter | Multi-select, AND with search |
| ⚙ | open filters | Equipment, movement pattern, custom-only, include archived |
| Row checkbox | toggle | Multi-select. Tapping the row name opens D-02 in a peek |
| Recent | quick pick | The user's 10 most-used exercises |
| + Create "{query}" | navigate | → D-03 with the name prefilled; on save it returns here **with the new exercise selected** |
| Add N | commit | Appends to the plan day in selection order, closes |
| Done / backdrop / Esc | dismiss | Discards the selection with no changes |

**Edge cases.** Zero results → the create action becomes the primary affordance. Selecting an
exercise already in the day → allowed, with an inline "already in this day" hint. Offline → searches
the cached catalog and says so; creating a custom exercise offline is queued. The selection survives
changing the search query or filters.

---

## C-07 · Prescription Editor
**Type** Sheet · **Priority** P0

```
┌──────────────────────────────────────────────┐
│               ───                            │
│  Barbell Bench Press                         │
│  chest · triceps · front delts               │
│                                              │
│  Target sets            ( − )   4   ( + )    │
│                                              │
│  Rep range          ┌─────┐ to ┌─────┐       │
│                     │  6  │    │  8  │       │
│                     └─────┘    └─────┘       │
│                                              │
│  Target load        ┌───────┐  [ kg ] ( lb ) │
│                     │  80   │                │
│                     └───────┘                │
│                     ( Leave blank — work up )│
│                                              │
│  Rest between sets  ( − ) 3:00 ( + )         │
│                      90s · 2m · 3m · 5m      │
│                                              │
│  Last time: 4 × 8 @ 77.5 kg  (16 Sep)   ›    │
│                                              │
│       ( Remove )          [   Save   ]       │
└──────────────────────────────────────────────┘
```

**Controls**
| Control | Action | Validation |
|---------|--------|-----------|
| Target sets ± | stepper | 1–20 |
| Rep min / max | numeric | 1–100; max ≥ min, auto-corrected with a hint rather than an error |
| Target load | numeric + unit toggle | ≥ 0; stored as `target_load` + `load_unit`; blank is valid |
| kg / lb toggle | convert | Converts the **displayed** value; canonical storage is unchanged |
| Rest ± / presets | stepper | 0–600 s; 0 means "no rest timer" |
| Last time › | navigate | → F-03 for that session. Loads async; absent for a first-time exercise |
| Remove | destructive | Removes the exercise from the day, with undo |
| Save | commit to the local plan draft | Applied on C-05's Save |

**Edge cases**
- A bodyweight or cardio exercise (`tracks_load = false`) → the load field is replaced by
  duration/distance targets. The prescription form is **driven by the exercise's tracked fields**,
  not fixed.
- Rep max < min → silently swapped with a hint, "We swapped these for you."
- Target load in lb while the profile is metric → stored canonically, displayed in lb because
  `load_unit` was explicitly chosen here.
- "Last time" is derived from the most recent completed session containing this exercise — the same
  resolution rule as E-03, so planning and logging agree.

---

## C-08 · Program Schedule
**Route** `/train/programs/[id]/schedule` · **Type** Stacked · **Priority** P1

```
┌──────────────────────────────────────────────┐
│ < Program            Schedule          [Save]│
│  Which days do you train?                    │
│                                              │
│      Mon    Tue    Wed    Thu    Fri  Sat Sun│
│  ┌──────┐┌─────┐┌──────┐┌─────┐┌──────┐      │
│  │ Push ││ rest││ Pull ││ rest││ Legs │ rest │
│  │  ⌄   ││  ⌄  ││  ⌄   ││  ⌄  ││  ⌄   │  ⌄   │
│  └──────┘└─────┘└──────┘└─────┘└──────┘      │
│                                              │
│  ⓘ This drives your dashboard's "today's     │
│    workout" and your adherence number.       │
│                                              │
│  ( Clear all )                               │
└──────────────────────────────────────────────┘
```

**Controls.** Each weekday is a dropdown listing this program's plan days + "Rest". Save writes
`scheduled_weekday` on each `workout_plan_day`.

**Edge cases.** Assigning one plan day to two weekdays is allowed (e.g. Full Body ×3). Assigning two
plan days to the same weekday is allowed with a warning; B-01 then shows a chooser. Clearing all
schedules is valid — the dashboard falls back to "No workout planned" and adherence reports
"Not enough data".

---

## C-09 · Archive / Duplicate / Delete Confirmations
**Type** Dialog · **Priority** P1

| Action | Dialog | Buttons |
|--------|--------|---------|
| **Archive program** | "Archive *Push / Pull / Legs*? It'll move to Archived and stop appearing when you start a workout. Your history stays exactly as it is." | `( Cancel )` `[ Archive ]` |
| **Duplicate program** | "Make a copy of *Push / Pull / Legs*? You'll get *Push / Pull / Legs (copy)* with all 3 days and 18 exercises." | `( Cancel )` `[ Duplicate ]` |
| **Delete program** (only when unused) | "Delete *Deload Week* permanently? This can't be undone." | `( Cancel )` `[ Delete ]` destructive |
| **Delete program** (used) | Not offered. The menu item is disabled with "Used by 12 sessions — archive it instead." | — |
| **Delete plan day with history** | "12 past sessions used this day. Deleting it won't change those records." | `( Cancel )` `[ Delete day ]` |

Every archive is reversible from the Archived tab. Every delete of an unused object is undoable via
a 10-second toast. No dialog uses a bare "Are you sure?" — each states the consequence.

---

# D — Exercise Catalog

## D-01 · Exercise Library
**Route** `/train/exercises` · **Type** Stacked · **Priority** P0

```
┌──────────────────────────────────────────────┐
│ < Train           Exercises             [ + ]│
│  🔍 ┌──────────────────────────────────────┐ │
│     │ Search 412 exercises                 │ │
│     └──────────────────────────────────────┘ │
│  ( All ) ( Mine ) ( Chest ) ( Back ) …    ⚙  │
│                                              │
│  A                                           │
│   Arnold Press           dumbbell        ›   │
│     front delts · side delts · triceps       │
│  B                                           │
│   Barbell Bench Press    barbell    🏆   ›   │
│     chest · triceps · front delts            │
│     last: 5d ago · PR 102.5 kg               │
│   Barbell Row            barbell         ›   │
│   Bulgarian Split Squat  dumbbell   ✎    ›   │
│     custom                                   │
│  C …                                         │
└──────────────────────────────────────────────┘
```

**Controls**
| Control | Action | Result |
|---------|--------|--------|
| `[ + ]` | navigate | → D-03 |
| Search | debounced | Name + aliases |
| Mine | filter | `owner_user_id = me` |
| Muscle chips | filter | Multi-select |
| ⚙ | sheet | Equipment · movement pattern · tracked fields · show archived · sort (A–Z, recently used, most used) |
| Row tap | navigate | → D-02 |
| Row long-press | menu | Add to a plan day · Start a workout with it · Edit (custom only) |

**Regions.** `🏆` marks an exercise with a PR; `✎` marks a custom exercise. Alphabetical section
headers with a sticky index; the list is virtualised.

**Edge cases.** Empty search → "Nothing matched" + `[ Create "{query}" ]`. Archived exercises are
hidden unless the filter is on, then shown muted with a Restore action. Offline → the catalog is
cached at app start, so search works fully offline.

---

## D-02 · Exercise Detail
**Route** `/train/exercises/[exerciseId]` · **Type** Stacked · **Priority** P0

```
┌──────────────────────────────────────────────┐
│ < Exercises     Barbell Bench Press       ⋮  │
│  barbell · horizontal push                   │
│  ● chest   ○ triceps  ○ front delts          │
│    primary   secondary  secondary            │
│                                              │
│  PERSONAL RECORDS                            │
│  ┌──────────┬──────────┬──────────┬────────┐ │
│  │ Max load │ Max reps │ Best vol │ e1RM   │ │
│  │ 102.5 kg │ 14 @60kg │ 3,240 kg │ 118 kg │ │
│  │ 16 Sep   │ 2 Aug    │ 16 Sep   │ 16 Sep │ │
│  └──────────┴──────────┴──────────┴────────┘ │
│                                              │
│  ESTIMATED 1RM · last 12 weeks               │
│  │                          ╭──●  118 kg     │
│  │              ╭───╮  ╭────╯                │
│  │    ╭─────────╯   ╰──╯                     │
│  │ ●──╯ 104 kg                               │
│  └──────────────────────────────────────────  │
│    Jul          Aug          Sep             │
│    Epley · from working sets     Table view  │
│                                              │
│  RECENT SESSIONS                             │
│   16 Sep  4 × 8 @ 80 kg      2,560 kg   🏆 › │
│   11 Sep  4 × 8 @ 77.5 kg    2,480 kg     › │
│    6 Sep  4 × 7 @ 77.5 kg    2,170 kg     › │
│                                  See all ›   │
│                                              │
│  [ Add to a workout ]   ( See progression )  │
└──────────────────────────────────────────────┘
```

**Controls**
| Control | Action | Result |
|---------|--------|--------|
| ⋮ | menu | Edit (custom only) · Edit muscles (D-04) · Aliases `[P2]` · Archive · Copy to a custom exercise (for global entries) |
| PR tile tap | navigate | → F-03 for the session that set it |
| Chart | interact | Crosshair + tooltip; tapping a point → F-03 |
| Table view | toggle | The mandatory non-visual alternative |
| Recent session row | navigate | → F-03 |
| See all | navigate | → F-01 filtered to this exercise |
| Add to a workout | sheet | Pick a plan day (→ C-05) or add to the active session (→ E-05) |
| See progression | navigate | → G-03 |

**States.** Never performed → PRs and the chart are replaced by "You haven't logged this yet" +
`[ Add to a workout ]`. Performed once → PRs show, the chart says "One session so far — a trend needs
at least two." Global (non-custom) exercise → edit is disabled with "This is a built-in exercise" and
"Copy to a custom exercise" offered instead.

**Edge cases.** An exercise with `tracks_load = false` shows rep/duration/distance PRs instead of
load PRs — the PR tiles are **driven by the tracked fields**. An archived exercise shows an
"Archived" banner with Restore; its history remains fully readable.

---

## D-03 · Create / Edit Custom Exercise
**Route** `/train/exercises/new` · `/train/exercises/[id]/edit` · **Type** Stacked · **Priority** P0

```
┌──────────────────────────────────────────────┐
│ ✕            New exercise              [Save]│
│  Name *      ┌────────────────────────────┐  │
│              │ Bulgarian Split Squat      │  │
│              └────────────────────────────┘  │
│   ⚠ Similar exercise exists: "Split Squat"   │
│                                              │
│  Equipment   ( barbell ) [ dumbbell ]        │
│              ( machine ) ( cable )           │
│              ( bodyweight ) ( band ) ( other)│
│                                              │
│  Movement    ┌────────────────────────────┐  │
│  pattern     │ squat                   ⌄  │  │
│              └────────────────────────────┘  │
│                                              │
│  MUSCLES *                                   │
│  Primary     [ quads ✕ ] [ glutes ✕ ]  [ + ] │
│  Secondary   [ hamstrings ✕ ]          [ + ] │
│                                              │
│  WHAT TO TRACK                               │
│  ☑ Load      ☑ Reps                          │
│  ☐ Duration  ☐ Distance                      │
│                                              │
│  Default unit   [ kg ] ( lb )                │
└──────────────────────────────────────────────┘
```

**Controls & validation**
| Field | Rule | Message |
|-------|------|---------|
| Name | required, 1–80, warns on a near-duplicate | "Similar exercise exists — use it instead?" with a link. A warning, never a block |
| Equipment | required, single-select | — |
| Movement pattern | optional, free text with suggestions | — |
| Muscles | **≥ 1 primary required** | "Pick at least one primary muscle." Without it, muscle-group analytics and "previous chest day" cannot work |
| What to track | ≥ 1 required | "Choose at least one thing to track." Drives E-03's fields and D-02's PR types |
| Default unit | required when Load is tracked | — |

**Edge cases.** Editing a custom exercise with history → changing the **muscle mapping retroactively
changes analytics** for past sessions, because analytics join live. A dialog states this explicitly:
"This will change your past muscle-volume numbers for this exercise." Changing tracked fields does
not delete stored data — a set that has load keeps it even if load is untracked afterwards; the field
simply stops being offered. Saving offline queues the create and the exercise is immediately usable
locally with a client-side ID.

---

## D-04 · Muscle Mapping Editor
**Type** Sheet · **Priority** P1

```
┌──────────────────────────────────────────────┐
│               ───                       Done │
│  Muscles — Bulgarian Split Squat             │
│  Primary muscles do most of the work.        │
│  They're weighted fully in your volume       │
│  numbers; secondary muscles count half.      │
│                                              │
│  LOWER BODY                                  │
│   quads        ( none ) [ primary ] (second) │
│   glutes       ( none ) [ primary ] (second) │
│   hamstrings   ( none ) ( primary ) [second] │
│   calves       [ none ] ( primary ) (second) │
│  UPPER BODY ⌄                                │
│  CORE ⌄                                      │
│                                              │
│  ⚠ At least one primary muscle is required.  │
└──────────────────────────────────────────────┘
```

Grouped by the `muscle_groups.parent_id` hierarchy, collapsed by default except the section with
existing selections. The explanatory sentence about weighting is required — it is the only place the
user learns why the distinction matters.

---

## D-05 · Aliases & Merge `[P2]`
**Route** `/train/exercises/[id]/aliases` · **Priority** P2

Manage search synonyms ("bench", "BB bench", "flat bench") and merge a duplicate custom exercise into
a canonical one. A merge repoints every `session_exercise` and `plan_exercise`, recomputes PRs for
the target, and is **irreversible** — it therefore requires typed confirmation of the exercise name.
Stubbed at MVP; the `aliases` column ships so search can use it immediately.
