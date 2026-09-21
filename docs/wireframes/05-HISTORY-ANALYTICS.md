# Wireframes · F & G — Workout History and Performance Analytics

[← Conventions](00-CONVENTIONS.md) · [Index](../README.md)

Screens F-01 … F-07, G-01 … G-07. Implements FR-W06, FR-W07 and acceptance criteria AC-03, AC-05,
AC-06, AC-12. This is the half of the product that answers BRD §22.

---

## F-01 · History List
**Route** `/train/history` · **Type** Stacked · **Priority** P0

```
┌──────────────────────────────────────────────┐
│ < Train            History        📅   ⚙ •   │
│  [ All ] ( Chest ) ( This month )        ✕   │  active filter chips
│                                              │
│  SEPTEMBER 2026                              │
│  ┌──────────────────────────────────────────┐│
│  │ Tue 21  Chest & Triceps            🏆   ││
│  │ 58 min · 21 sets · 8,940 kg             ││
│  │ chest 13 · triceps 7 · delts 4          ││
│  ├──────────────────────────────────────────┤│
│  │ Sun 19  Legs                            ││
│  │ 64 min · 24 sets · 12,100 kg            ││
│  ├──────────────────────────────────────────┤│
│  │ Fri 17  Back & Biceps                   ││
│  │ 51 min · 19 sets · 9,340 kg             ││
│  ├──────────────────────────────────────────┤│
│  │ Wed 16  Chest & Triceps            🏆   ││
│  │ 62 min · 20 sets · 8,240 kg             ││
│  └──────────────────────────────────────────┘│
│  AUGUST 2026                                 │
│   …                                          │
│              ( Load more )                   │
└──────────────────────────────────────────────┘
```

**Controls**
| Control | Action | Result |
|---------|--------|--------|
| 📅 | navigate | → F-07 calendar view |
| ⚙ | open sheet | → F-02 filters. The `•` dot appears when any filter is active |
| Filter chips | tap | Removes that filter; `✕` clears all |
| Row tap | navigate | → F-03 |
| Row long-press | menu | Repeat this workout (→ E-01) · Compare (→ F-06) · Edit (→ F-04) · Delete |
| Load more / scroll | paginate | Cursor-based infinite scroll; month headers are sticky |
| Pull to refresh | refetch | |

**Data.** `GET /history/workouts?from&to&muscle&exercise&program&cursor`. The muscle summary line is
derived from `exercise_muscles` with the same primary/secondary weighting as G-02.

**States**
| State | Behaviour |
|-------|-----------|
| Empty (no sessions) | "No workouts yet" + `[ Start a workout ]` |
| Empty (filters exclude everything) | "No sessions match these filters" + `( Clear filters )`. **Distinct from having no data at all** — conflating the two is a common and confusing bug |
| Loading | Skeleton rows grouped under a skeleton month header |
| Offline | Cached pages render; "Load more" is disabled with "Needs a connection" |
| End of list | "That's everything — {n} sessions since {date}" |

**Edge cases**
- Sessions are grouped by **user-local date** (AC-03), not UTC. A session started at 23:40 local
  appears under that local date even if `started_at` is the next UTC day.
- Cancelled sessions never appear. `in_progress` sessions appear at the top with an "in progress" chip.
- A session referencing a deleted plan day still renders using its own stored exercises.
- Two sessions on the same day → both listed, ordered by `started_at` descending.
- Backdated sessions sort by their date, not by when they were created.

**a11y.** Each row's accessible name: "Tuesday 21 September, Chest and Triceps, 58 minutes,
21 sets, 8,940 kilograms, personal record". Month headers are `h2`.

---

## F-02 · History Filters
**Type** Sheet · **Priority** P0

```
┌──────────────────────────────────────────────┐
│               ───              Reset    Done │
│  DATE RANGE                                  │
│  ( All time ) [ This month ] ( Last 3 mo )   │
│  ( This year ) ( Custom… )                   │
│   From ┌──────────┐   To ┌──────────┐        │
│        │ 01 Sep   │      │ 21 Sep   │        │
│                                              │
│  MUSCLE GROUP                                │
│  [ Chest ] ( Back ) ( Shoulders ) ( Arms )   │
│  ( Legs ) ( Core )                           │
│  ◉ Primary only    ○ Primary or secondary    │
│                                              │
│  EXERCISE                                    │
│  🔍 ┌────────────────────────────────────┐   │
│     │ Search…                            │   │
│     └────────────────────────────────────┘   │
│                                              │
│  PROGRAM                                     │
│  ( Any ) [ Push / Pull / Legs ]              │
│                                              │
│  ──────────────────────────────────────────  │
│  [   Show 12 sessions   ]                    │
│  ( ⏮ Jump to the previous Chest day )        │
└──────────────────────────────────────────────┘
```

**Controls**
| Control | Action | Result |
|---------|--------|--------|
| Range presets | select | Sets from/to; "Custom…" reveals the date fields |
| Muscle chips | multi-select | Combined with OR *within* muscles, AND with other dimensions |
| Primary only / or secondary | radio | **This matters**: "chest day" usually means primary. The default is Primary only, matching the §7.2 resolution rule |
| Exercise search | combobox | Single exercise |
| Program | select | |
| `[ Show N sessions ]` | apply | The count is **live** as filters change, so the user never applies a filter that returns nothing |
| ⏮ Jump to the previous Chest day | navigate | → F-05. Only appears when exactly one muscle group is selected — this is the AC-05 shortcut |
| Reset | clear | All filters cleared |

**Edge cases.** A live count of 0 disables Apply and suggests the nearest widening ("Try 'primary or
secondary'"). `to` before `from` → auto-swapped with a hint. Future dates are allowed in the range
but return nothing, and the empty state says so. Filters are reflected in the URL so a filtered
history view is shareable and survives refresh.

---

## F-03 · Session Detail
**Route** `/train/sessions/[sessionId]` · **Type** Stacked · **Priority** P0

```
┌──────────────────────────────────────────────┐
│ < History       Chest & Triceps           ⋮  │
│  Tue 21 Sep · 18:42 – 19:40 · 58 min         │
│  Push / Pull / Legs → Push                   │
│                                              │
│  ┌────────────┬────────────┬───────────────┐ │
│  │ 6 exercises│ 21 sets    │ 8,940 kg      │ │
│  └────────────┴────────────┴───────────────┘ │
│  chest 13 sets · triceps 7 · front delts 4   │
│                                              │
│  ┌──────────────────────────────────────────┐│
│  │ 1  Barbell Bench Press          🏆      ││
│  │    ┌───┬────────┬──────┬─────┐           ││
│  │    │ W │  40 kg │  12  │  —  │           ││
│  │    │ 1 │  80 kg │   8  │  8  │           ││
│  │    │ 2 │  80 kg │   8  │  8  │           ││
│  │    │ 3 │  80 kg │   7  │  9  │           ││
│  │    │ 4 │ 102.5  │   1  │ 10  │ 🏆        ││
│  │    └───┴────────┴──────┴─────┘           ││
│  │    Volume 2,560 kg · e1RM 118 kg         ││
│  │    "felt light today"                    ││
│  ├──────────────────────────────────────────┤│
│  │ 2  Incline Dumbbell Press               ││
│  │    3 sets · 30 kg × 10, 9, 8 · 810 kg   ││
│  │                                      ⌄   ││
│  └──────────────────────────────────────────┘│
│                                              │
│  📝 "Felt strong on bench today."            │
│                                              │
│  ( Compare with previous )  ( Repeat this )  │
└──────────────────────────────────────────────┘
```

**Controls**
| Control | Action | Result |
|---------|--------|--------|
| ⋮ | menu | Edit session (F-04) · Delete session · Export · Repeat (E-01) |
| Exercise header tap | expand/collapse | Toggles the full set table |
| Exercise name tap | navigate | → D-02 |
| 🏆 tap | popover | Which record, what it beat, when |
| Compare with previous | navigate | → F-06 with this session and the previous occurrence of the same plan day preselected |
| Repeat this | `POST /workout-sessions` | New session with the same exercises → E-02 |

**Read-only styling is explicit** (design principle 6): fields render as text, not inputs; there is
no visible affordance that suggests editing until F-04 is entered.

**Edge cases**
- A session with zero sets → "No sets were logged in this session" + Edit / Delete.
- A cancelled session opened by direct URL → "This workout was discarded", with no set data.
- An `in_progress` session → redirects to E-02 rather than rendering a partial history view.
- Exercises archived or deleted since → rendered by their stored name with an "archived" chip.
- Deleting the session → dialog naming the set count, then a queued delete + PR recomputation, and
  an explicit note: "Your personal records will be recalculated."
- Volume shown here always excludes warm-ups and incomplete sets, with a footnote stating the rule —
  so the number can always be reconciled with G-02.

---

## F-04 · Edit Past Session
**Route** `/train/sessions/[sessionId]/edit` · **Type** Full-screen · **Priority** P1

Reuses E-02 / E-03 in an **edit mode** that is visually distinct (an amber-tinted header bar reading
"Editing a past workout").

**Differences from live logging**
| Aspect | Live (E-03) | Edit (F-04) |
|--------|-------------|-------------|
| Rest timer | On | Off |
| Previous performance | The session before this one | The session before **this session's date**, not before today |
| Commit | Optimistic, queued | Optimistic, queued, plus a `[ Save changes ]` gate |
| `performed_at` on a new set | now | The session's date, defaulting to the last set's time + rest |
| PR effects | Computed on finish | Recomputed on save, and **can demote an existing PR** |

**Save dialog.** "Saving will recalculate your volume and personal records for these exercises."
`( Cancel )` `[ Save changes ]`.

**Edge cases.** Editing the session that currently holds a PR and reducing it → the PR is recomputed
from the full history of that exercise (a full re-scan, not an incremental update), and the user is
told which records changed. Changing `started_at` to a different local date moves the session in
history and recalculates that day's summary. Concurrent edits from two devices → L-07.

---

## F-05 · Previous Occurrence ★
**Route** `/train/history/previous?muscle=chest` · **Type** Stacked · **Priority** P0

**This screen exists solely to satisfy AC-05: "retrieve the previous chest-focused session without
knowing its date."**

```
┌──────────────────────────────────────────────┐
│ < History      Your previous Chest day       │
│                                              │
│  Wed 16 Sep · 5 days ago                     │
│  Chest & Triceps · 62 min · 8,240 kg         │
│  Found by: exercises with chest as a         │
│  primary muscle                       ⓘ      │
│                                              │
│  CHEST WORK                                  │
│  ┌──────────────────────────────────────────┐│
│  │ Barbell Bench Press                      ││
│  │  80 × 8 · 80 × 8 · 80 × 7 · 77.5 × 8     ││
│  │  volume 2,480 kg                         ││
│  ├──────────────────────────────────────────┤│
│  │ Incline Dumbbell Press                   ││
│  │  30 × 10 · 30 × 9 · 27.5 × 10            ││
│  │  volume 810 kg                           ││
│  ├──────────────────────────────────────────┤│
│  │ Cable Fly                                ││
│  │  15 × 14 · 15 × 12 · 12.5 × 15           ││
│  │  volume 592 kg                           ││
│  └──────────────────────────────────────────┘│
│  Chest volume 3,882 kg · 10 sets             │
│                                              │
│  ALSO IN THAT SESSION                     ⌄  │
│   Overhead Press · Triceps Pushdown · …      │
│                                              │
│  ( ◀ The one before that )  ( Compare both ) │
│  [ Repeat this workout ]   ( Full session › )│
└──────────────────────────────────────────────┘
```

**Resolution rule (shown to the user via ⓘ).** The most recent **completed** session containing at
least one exercise whose `exercise_muscles` has this muscle group with `role = 'primary'`. If none
exists, the query widens to include `secondary`, and the screen says so: *"No session had chest as a
primary muscle. Showing the most recent one that trained chest at all."*

**Controls**
| Control | Action | Result |
|---------|--------|--------|
| ⓘ | popover | Explains the resolution rule in plain language |
| ◀ The one before that | navigate | Walks back through occurrences, one at a time |
| Compare both | navigate | → F-06 with the two most recent occurrences |
| Repeat this workout | `POST` | → E-02 with the same exercises |
| Full session › | navigate | → F-03 |
| Also in that session ⌄ | expand | The non-chest exercises, so context isn't hidden |

**States.** No matching session at all → "You haven't trained chest yet" + `[ Find chest exercises ]`
(→ D-01 filtered). Only one occurrence → "◀ The one before that" is disabled with "That's your first
chest session."

**Edge cases**
- The exercise's muscle mapping was edited after the session → the query uses the **current** mapping,
  because mapping is a property of the exercise, not the session. The ⓘ note mentions this.
- A muscle group with children (Chest → Upper Chest) → descendants are included via `parent_id`.
- An exercise-based lookup (`?exercise=`) uses the same screen with an exercise heading.
- The exercise appears twice in that session → both instances are shown separately.

---

## F-06 · Session Comparison
**Route** `/train/history/compare?sessions=a,b[,c]` · **Type** Stacked · **Priority** P1

```
┌──────────────────────────────────────────────┐
│ < Back            Compare                 ⚙  │
│           21 Sep      16 Sep      11 Sep     │
│  ┌──────────┬──────────┬──────────┐          │
│  │ 8,940 kg │ 8,240 kg │ 8,050 kg │ volume   │
│  │ 21 sets  │ 20 sets  │ 20 sets  │          │
│  │ 58 min   │ 62 min   │ 60 min   │          │
│  └──────────┴──────────┴──────────┘          │
│                                              │
│  BARBELL BENCH PRESS                         │
│   21 Sep  ●───────────────────●  80–102.5 kg │
│   16 Sep  ●──────────────●       77.5–80 kg  │
│   11 Sep  ●─────────────●        77.5–80 kg  │
│   volume  2,560 ▲ 80 ▲ 30                    │
│   best set 102.5 × 1   80 × 8   80 × 8       │
│                                              │
│  INCLINE DUMBBELL PRESS                      │
│   volume    810 ▲ 30 ▼ 20                    │
│   best set  30 × 10   30 × 9   30 × 10       │
│                                              │
│  ONLY IN 21 SEP                              │
│   Overhead Triceps Extension                 │
│  ONLY IN 11 SEP                              │
│   Machine Chest Press                        │
│                                              │
│  Table view                                  │
└──────────────────────────────────────────────┘
```

**Form.** A **dumbbell chart** per exercise (load range per session), because the job is
"before → after per item" — one hue in two/three shades, not three categorical colors.

**Controls.** ⚙ → choose which sessions (up to 3) and which metric (volume · best set · e1RM · total
reps). Exercise rows expand to a full set-by-set table. "Table view" is the mandatory non-visual
alternative.

**Edge cases.** Sessions with no exercises in common → the comparison collapses to session-level
totals with an explanation. Different plan days compared → allowed, with a notice that they aren't
the same workout. Mobile → one session per column with horizontal scroll, or stacked cards with
swipe; never a squeezed 3-column table under 390 px.

---

## F-07 · Training Calendar
**Route** `/train/history/calendar` · **Type** Stacked · **Priority** P1

```
┌──────────────────────────────────────────────┐
│ < History       ◀  September 2026  ▶      ☰  │
│   M    T    W    T    F    S    S            │
│   1    2    3    4    5    6    7            │
│   ·    ●    ·    ●    ·    ●    ·            │
│   8    9   10   11   12   13   14            │
│   ●    ·    ●    ·    ●    ·    ·            │
│  15   16   17   18   19   20   21            │
│   ·    ●    ●    ·    ●    ·   [●]           │
│  22   23   24   25   26   27   28            │
│   ○    ·    ○    ·    ○    ·    ·            │
│                                              │
│  ● completed   ○ planned   · rest            │
│                                              │
│  TUE 21 SEP                                  │
│  ┌──────────────────────────────────────────┐│
│  │ Chest & Triceps · 58 min · 8,940 kg  🏆 ›││
│  └──────────────────────────────────────────┘│
│  12 sessions this month · 104,200 kg          │
└──────────────────────────────────────────────┘
```

**Controls.** ◀ ▶ change month (swipe too) · ☰ toggles to a list (F-01) · a day tap selects it and
shows its sessions below · a session row → F-03 · a future planned day → E-01 for that plan day.

**Edge cases.** A day with two sessions shows a doubled marker and lists both. Planned markers come
from `scheduled_weekday` and stop at the current month's end. Today is ringed. Months before the
first session are reachable but show an empty state rather than an endless back-scroll.

---

# G — Performance Analytics

> **Two rules apply to every screen in this section** (BRD §10, design principle 3):
> every figure states **its date range and its unit**, and every chart offers a **table view**.

## G-01 · Analytics Overview
**Route** `/train/analytics` · **Type** Stacked · **Priority** P0

```
┌──────────────────────────────────────────────┐
│ < Train          Analytics                   │
│  ( 4 wk ) [ 12 wk ] ( 6 mo ) ( 1 yr ) (Custom)│
│  29 Jun – 21 Sep 2026 · 12 weeks              │
│                                              │
│  ┌────────────────┬─────────────────────────┐│
│  │ 38             │ 412,800 kg              ││
│  │ sessions       │ total volume            ││
│  ├────────────────┼─────────────────────────┤│
│  │ 3.2 / wk       │ 11 new PRs              ││
│  │ frequency      │                         ││
│  └────────────────┴─────────────────────────┘│
│                                              │
│  WEEKLY VOLUME · kg                       ›  │
│  │       ▁  ▃  ▅  ▄  ▆  ▇  ▅  ▇  █         │
│  └──────────────────────────────────────────  │
│   Jul              Aug              Sep      │
│                                              │
│  VOLUME BY MUSCLE GROUP · kg              ›  │
│   Back    ███████████████████  98,400        │
│   Legs    ██████████████████   94,100        │
│   Chest   ███████████████      78,200        │
│   Delts   ████████             41,900        │
│   Arms    ███████              36,800        │
│   Core    ███                  14,200        │
│                                              │
│  📊 Volume ›   🏆 Records ›   📅 Frequency ›  │
│  📈 Progression ›   ✅ Adherence ›            │
└──────────────────────────────────────────────┘
```

**Regions.** A KPI row of stat tiles (not a grouped bar chart — a handful of headline numbers is a
stat-tile job). Weekly volume as a **column chart**, sequential. Muscle volume as a **sorted
horizontal bar**, sequential — one hue, more-is-darker, because the job is magnitude, not identity.

**Controls.** Range presets + custom · each card `›` → its detail screen · KPI tiles are tappable.

**States.** Fewer than 2 sessions in range → "Not enough data for this range" + a suggestion to widen
it, never an empty chart. Loading → the previous range's chart stays visible, dimmed, while the new
one loads.

**Edge cases.** A custom range beyond the server's cap → the UI clamps it and says so. A range with
zero sessions → all tiles show "—" with a range restatement, never "0" (which reads as a measured
zero rather than an absence).

---

## G-02 · Volume Analytics
**Route** `/train/analytics/volume` · **Type** Stacked · **Priority** P0

```
┌──────────────────────────────────────────────┐
│ < Analytics        Volume                    │
│  ( 4wk ) [ 12wk ] ( 6mo ) ( 1yr )            │
│  Group by:  ( Session ) [ Week ] ( Month )   │
│  Muscle:    [ All ] ( Chest ) ( Back ) …     │
│                                              │
│  WEEKLY VOLUME · kg                          │
│  │                                   ▇       │
│  │                          ▆  ▇  ▅  █       │
│  │       ▃  ▅  ▄  ▆                          │
│  │ ▁                                         │
│  └───────────────────────────────────────    │
│   W27 W28 W29 W30 W31 W32 W33 W34 W35 W36    │
│   avg 34,400 kg/wk · ▲ 12% vs the first half │
│                                 Table view   │
│                                              │
│  BY MUSCLE GROUP                             │
│   Back    ███████████████████  98,400  24%   │
│   Legs    ██████████████████   94,100  23%   │
│   Chest   ███████████████      78,200  19%   │
│   …                                          │
│                                              │
│  ⓘ Volume = load × reps, for completed       │
│    working sets. Warm-ups excluded.          │
│    Primary muscles count fully, secondary    │
│    at half.                          Change ›│
└──────────────────────────────────────────────┘
```

**The ⓘ block is required.** A volume number that the user cannot reconcile with their own sets is
worse than no number at all. "Change ›" opens K-04 where warm-up inclusion and secondary weighting
are configurable (D6, D7).

**Edge cases.** Bodyweight exercises with no load contribute 0 to load×reps volume; they are counted
in a separate "sets" measure and the chart footnote says so — otherwise a calisthenics user sees an
inexplicably empty chart. Duration/distance exercises are excluded from volume entirely and listed
separately. A week with no sessions renders as a zero-height column with a visible gap, not a missing
category.

---

## G-03 · Exercise Progression
**Route** `/train/analytics/exercises/[exerciseId]` · **Type** Stacked · **Priority** P0

```
┌──────────────────────────────────────────────┐
│ < Analytics    Barbell Bench Press        ⚙  │
│  ( 4wk ) [ 12wk ] ( 6mo ) ( 1yr )            │
│  Metric: [ Top set ] ( e1RM ) ( Volume )     │
│          ( Total reps )                      │
│                                              │
│  TOP SET LOAD · kg                           │
│  │                            ●  102.5       │
│  │                     ●──●──╱                │
│  │        ●──●──●─────╱                       │
│  │  ●────╱                                    │
│  │ 72.5                                       │
│  └───────────────────────────────────────     │
│   Jul          Aug          Sep               │
│                              Table view       │
│                                              │
│  ┌──────────────┬──────────────┬────────────┐│
│  │ 102.5 kg     │ +30 kg       │ 14         ││
│  │ best         │ over 12 wk   │ sessions   ││
│  └──────────────┴──────────────┴────────────┘│
│                                              │
│  SESSION HISTORY                             │
│   21 Sep  4 sets · top 102.5×1 · 2,560 kg 🏆›│
│   16 Sep  4 sets · top 80×8    · 2,480 kg  ›│
│   11 Sep  4 sets · top 80×8    · 2,400 kg  ›│
│                                              │
│  ( Compare with another exercise )           │
└──────────────────────────────────────────────┘
```

**Form.** A **line with emphasis** — the selected exercise in the brand hue, any comparison exercise
in de-emphasis gray. Selective direct labels (first, last, max, hovered) only.

**Controls.** Metric segmented control · range presets · ⚙ (include warm-ups, set-type filter,
show the trend line) · a point tap → F-03 · "Compare with another exercise" adds one gray
comparison series (**never a second y-axis** — if the scales differ wildly, the chart switches to
indexed-to-baseline with a stated basis).

**Edge cases.** Fewer than two sessions → "Log this exercise at least twice to see progression."
An exercise whose unit changed → the chart uses canonical kg and displays in the user's preferred
unit throughout. A long gap between sessions → the line breaks rather than interpolating across
three missing months, because a straight line over a gap implies data that doesn't exist.

---

## G-04 · Personal Records
**Route** `/train/analytics/records` · **Type** Stacked · **Priority** P0

```
┌──────────────────────────────────────────────┐
│ < Analytics    Personal records          ⚙   │
│  🔍 Search exercises                         │
│  Sort: [ Recent ] ( A–Z ) ( Most improved )  │
│                                              │
│  RECENT · last 30 days                       │
│  ┌──────────────────────────────────────────┐│
│  │ 🏆 Barbell Bench Press      21 Sep       ││
│  │    Max load  102.5 kg   was 100 kg  ▲2.5 ││
│  │    e1RM      118 kg     was 115 kg  ▲3   ││
│  ├──────────────────────────────────────────┤│
│  │ 🏆 Barbell Squat            19 Sep       ││
│  │    Max load  140 kg     was 135 kg  ▲5   ││
│  └──────────────────────────────────────────┘│
│                                              │
│  ALL RECORDS                                 │
│  ┌──────────────────┬────────┬──────┬───────┐│
│  │ Exercise         │ Load   │ Reps │ e1RM  ││
│  ├──────────────────┼────────┼──────┼───────┤│
│  │ Barbell Bench    │ 102.5  │ 14   │ 118   ││
│  │ Barbell Squat    │ 140    │ 12   │ 163   ││
│  │ Deadlift         │ 180    │  8   │ 208   ││
│  │ Overhead Press   │  62.5  │ 10   │  72   ││
│  └──────────────────┴────────┴──────┴───────┘│
│  ⓘ From completed working sets only.         │
│    e1RM uses Epley: load × (1 + reps/30).    │
└──────────────────────────────────────────────┘
```

**Record types** (BRD §9 `personal_records.record_type`): `max_load` · `max_reps` · `volume`
(best single-session volume for the exercise) · `estimated_1rm`.

**Controls.** Search · sort · ⚙ (which record types to show, include bodyweight exercises) · a row
tap → D-02 · a record tap → F-03 for the session that set it.

**Edge cases.** An exercise whose PR was demoted by a deleted or edited session → the row shows the
recomputed value; a one-time note explains why it changed. A tie → the earliest achievement date
wins `[ASSUMPTION]`. Bodyweight exercises show rep and volume records only. Duration-based exercises
get a "longest hold" record instead of load. A PR set during a discarded session never counts.

---

## G-05 · Frequency & Muscle Balance
**Route** `/train/analytics/frequency` · **Type** Stacked · **Priority** P1

```
┌──────────────────────────────────────────────┐
│ < Analytics    Frequency                     │
│  ( 4wk ) [ 12wk ] ( 6mo )                    │
│                                              │
│  3.2 sessions / week        38 total          │
│                                              │
│  SETS PER MUSCLE PER WEEK                    │
│          W31 W32 W33 W34 W35 W36             │
│  Chest    ░░  ▒▒  ██  ▓▓  ██  ██             │
│  Back     ▓▓  ██  ██  ██  ▓▓  ██             │
│  Legs     ██  ░░  ▓▓  ██  ██  ▓▓             │
│  Delts    ▒▒  ▒▒  ▓▓  ▒▒  ▓▓  ▒▒             │
│  Arms     ▒▒  ▓▓  ▒▒  ▓▓  ▒▒  ▓▓             │
│  Core     ░░  ░░  ▒▒  ░░  ░░  ▒▒             │
│          0 ░ ▒ ▓ █ 20+ sets      Table view  │
│                                              │
│  ⚠ Core: 2 sets/week over 12 weeks —         │
│    noticeably less than everything else.     │
│                                              │
│  TRAINING DAYS                               │
│   Mon ████████ 11   Thu ██ 3                 │
│   Tue ██ 2          Fri ███████ 10           │
│   Wed ███████ 9     Sat █ 1     Sun · 0      │
└──────────────────────────────────────────────┘
```

**Form.** A **heatmap** (week × muscle) using the sequential blue ramp — magnitude over a grid.
Cells carry their value on hover and in the table view. The ⚠ line is an **observation, not advice**:
it states what the data shows and never prescribes ("noticeably less than everything else", not
"you should train core more"). This keeps the product clear of health recommendations.

**Edge cases.** A muscle group with zero sets in the whole range is still shown as an empty row —
absence is the finding. Weeks are bucketed by the user's configured week start (K-03).

---

## G-06 · Adherence
**Route** `/train/analytics/adherence` · **Type** Stacked · **Priority** P1

```
┌──────────────────────────────────────────────┐
│ < Analytics    Adherence                     │
│  ( 4wk ) [ 12wk ] · Push / Pull / Legs   ⌄   │
│                                              │
│           31 of 36 planned sessions          │
│      ━━━━━━━━━━━━━━━━━━━━━━━━━━░░░░  86%     │
│                                              │
│  BY WEEK                                     │
│   W31 ●●●  W32 ●●○  W33 ●●●  W34 ●●●         │
│   W35 ●○●  W36 ●●·                           │
│   ● completed  ○ missed  · upcoming          │
│                                              │
│  BY PLAN DAY                                 │
│   Push   11 / 12   92%  ━━━━━━━━━━━━━━░      │
│   Pull   10 / 12   83%  ━━━━━━━━━━━━░░░      │
│   Legs   10 / 12   83%  ━━━━━━━━━━━━░░░      │
│                                              │
│  MOST MISSED                                 │
│   Friday · Legs — 2 of the 5 misses          │
│                                              │
│  ⓘ Planned sessions come from your program's │
│    schedule. Unscheduled programs aren't     │
│    counted.                          Edit ›  │
└──────────────────────────────────────────────┘
```

**Edge cases.** No scheduled program → "Adherence needs a schedule" + `[ Set a schedule ]` (→ C-08),
never "0%". A schedule changed mid-range → planned counts are computed per week from the schedule as
it was, if history is available, otherwise from the current schedule with a stated caveat
`[ASSUMPTION — schedule history is not versioned at MVP]`. Extra unplanned sessions can push
completion over 100%; the meter caps at 100% and shows "+3 extra sessions" separately rather than
reporting 108%.

---

## G-07 · Estimated 1RM Detail
**Route** `/train/analytics/one-rep-max` · **Type** Stacked · **Priority** P1

```
┌──────────────────────────────────────────────┐
│ < Analytics    Estimated 1RM                 │
│  Exercise: [ Barbell Bench Press        ⌄ ]  │
│  ( 12wk ) [ 6mo ] ( 1yr )                    │
│                                              │
│  ESTIMATED 1RM · kg                          │
│  │                              ●  118       │
│  │                    ●──●──●──╱              │
│  │        ●──●───────╱                        │
│  │  ●────╱  104                               │
│  └───────────────────────────────────────     │
│   Apr      Jun      Aug      Sep              │
│                              Table view       │
│                                              │
│  118 kg estimated   ▲ 14 kg over 6 months     │
│  Best actual single: 102.5 kg (21 Sep)        │
│                                              │
│  ⓘ Epley formula: load × (1 + reps/30),      │
│    calculated per working set, best per       │
│    session. An estimate — it is not a         │
│    tested one-rep max.                        │
│                                              │
│  Formula  [ Epley ] ( Brzycki ) ( Lombardi ) │
│  Changing this recalculates the chart only.   │
│  Your stored sets don't change.               │
└──────────────────────────────────────────────┘
```

**Why the formula selector matters.** BRD §10 says "store formula/version". `workout_sets.e1rm_kg`
and `formula_version` are stored at write time with the default (`epley_v1`); selecting a different
formula recomputes the **display** from `load_kg` and `reps` and labels the chart accordingly. Stored
values are never rewritten, so a user switching formulas cannot corrupt their history.

**Edge cases.** Sets above ~12 reps make every e1RM formula unreliable; those points are marked and
a footnote says so. A true single (1 rep) yields e1RM = load exactly. Warm-ups are excluded. An
exercise with no load returns no e1RM and the selector says the exercise isn't eligible.
