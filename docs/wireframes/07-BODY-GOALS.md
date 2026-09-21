# Wireframes · I & J — Body Progress and Goals

[← Conventions](00-CONVENTIONS.md) · [Index](../README.md)

Screens I-01 … I-06, J-01 … J-04. Implements FR-P01, FR-P02.

---

## I-01 · Progress Overview
**Route** `/progress` · **Type** Tab root · **Priority** P0

```
┌──────────────────────────────────────────────┐
│  Progress                          🔔  (AB)  │
├──────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────┐│
│  │ WEIGHT                               ›   ││
│  │  78.4 kg        ▼ 0.6 kg in 14 days      ││
│  │                                          ││
│  │  │╲    ╱╲                                ││
│  │  │ ╲__╱  ╲___                            ││
│  │  │           ╲__      ← 7-day average    ││
│  │  └──────────────────────────────────     ││
│  │   Aug 24              Sep 21             ││
│  │  Last logged 2 days ago    [ Log today ] ││
│  └──────────────────────────────────────────┘│
│                                              │
│  ┌──────────────────────────────────────────┐│
│  │ GOAL · Lose fat                      ›   ││
│  │  78.4 → 74.0 kg                          ││
│  │  ━━━━━━━━━━━━━━░░░░░░░░░░  4.4 kg to go  ││
│  │  Started 2 Aug · 5.1 kg lost so far      ││
│  │  At this rate, around 12 Nov       ⓘ     ││
│  └──────────────────────────────────────────┘│
│                                              │
│  MEASUREMENTS                        Edit ›  │
│  ┌──────────┬──────────┬──────────┐          │
│  │ Waist    │ Chest    │ Arm      │          │
│  │ 84.0 cm  │ 104.0 cm │ 37.5 cm  │          │
│  │ ▼ 2.0    │ ▲ 0.5    │ ▲ 0.5    │          │
│  │ 14 days  │ 14 days  │ 14 days  │          │
│  └──────────┴──────────┴──────────┘          │
│  Body fat 18.2%  ▼ 1.1                       │
│                                              │
│  📷 Progress photos          6 photos    ›   │
│                                              │
│  [ + Log today's measurements ]              │
├──────────────────────────────────────────────┤
│   🏠      🏋️     ╭─+─╮      🍎       📈      │
└──────────────────────────────────────────────┘
```

**Controls**
| Control | Action | Result |
|---------|--------|--------|
| Weight card / chart | navigate | → I-03 |
| `[ Log today ]` / `[ + Log today's measurements ]` | sheet | → I-02 |
| Goal card | navigate | → J-03 |
| ⓘ (projection) | popover | "Based on your average change over the last 4 weeks. An estimate, not a prediction." |
| Measurement tile | navigate | → I-04 for that measurement |
| Edit › | sheet | → I-06 field selection |
| Progress photos | navigate | → I-05 |

**States**
| State | Behaviour |
|-------|-----------|
| No weight ever | The card becomes "Track your weight to see the trend" + `[ Log your weight ]`. No chart, no zero line |
| One entry | The value shows; the chart is replaced by "One more entry and the trend appears" |
| No goal | The goal card becomes "Set a goal to track progress against" + `[ Set a goal ]` |
| Goal reached | The card shows a completion state → J-04 |
| No measurements tracked | The measurement grid is replaced by `[ Choose what to track ]` → I-06 |
| Stale data (> 14 days) | A gentle "Last logged 18 days ago" — a fact, never a scold |

**Edge cases.** A weight logged in the future (timezone or manual error) is excluded from "latest"
and flagged in I-03. Projection is suppressed when the trend is flat or moving away from the goal —
projecting "you will reach 74 kg in 400 years" is worse than showing nothing; the card then says
"Not enough of a trend to project."

---

## I-02 · Log Body Metric
**Type** Sheet · **Priority** P0

```
┌──────────────────────────────────────────────┐
│               ───                            │
│  Log measurements                            │
│  Date  [ Today, Tue 21 Sep ⌄ ]  08:14        │
│                                              │
│  Weight *    ┌────────┐  [ kg ] ( lb )       │
│              │  78.4  │                      │
│              └────────┘                      │
│              Last: 78.6 kg (2 days ago)      │
│                                              │
│  Body fat    ┌────────┐ %                    │
│  Waist       ┌────────┐ cm                   │
│  Chest       ┌────────┐ cm                   │
│  Arm         ┌────────┐ cm                   │
│  Thigh       ┌────────┐ cm                   │
│                         ( Choose fields › )  │
│                                              │
│  Note  ┌──────────────────────────────────┐  │
│        │ morning, before food             │  │
│        └──────────────────────────────────┘  │
│                                              │
│              [    Save    ]                  │
└──────────────────────────────────────────────┘
```

**Controls.** Date/time picker (defaults to now, cannot be in the future) · numeric fields for each
enabled measurement · unit toggles that convert display only · "Choose fields ›" → I-06 · Save →
`POST /body-metrics`.

**Validation**
| Field | Rule | Message |
|-------|------|---------|
| Weight | 20–500 kg; at least one field required overall | "Enter at least one measurement." |
| Body fat | 1–70% | |
| Circumferences | 10–300 cm | |
| Any value | A > 5% single-day change warns | "That's a big change from {last}. Is it right?" — soft confirm, never a block |

**Edge cases**
- **A second entry on the same day** → allowed. The daily canonical value for charts and trends is
  the **first entry of the day** (P01.4, decision Q5), and the sheet says so: "You already logged
  78.6 kg today. This will be saved as a second entry."
- **Backdating** → allowed; the entry sorts by `recorded_at` and the chart re-renders.
- **Offline** → queued through the outbox; the chart updates optimistically.
- **Only a note, no values** → blocked with the message above.

**a11y.** Each field has a persistent visible label and a unit suffix in its accessible name. Saving
announces "Weight 78.4 kilograms saved for today."

---

## I-03 · Weight Trend
**Route** `/progress/weight` · **Type** Stacked · **Priority** P0

```
┌──────────────────────────────────────────────┐
│ < Progress        Weight                ⚙    │
│  ( 1 mo ) [ 3 mo ] ( 6 mo ) ( 1 yr ) ( All ) │
│  23 Jun – 21 Sep 2026                        │
│                                              │
│  │ 84 ╲                                      │
│  │     ●╲●                                   │
│  │      ╲ ●╲ ●                               │
│  │       ●  ╲●  ●╲                           │
│  │            ╲●  ●╲●  ●                     │
│  │ 78              ╲●───●  78.4              │
│  │ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ goal 74.0     │
│  └──────────────────────────────────────────  │
│   Jun        Jul        Aug        Sep        │
│   ● daily   ── 7-day average    Table view   │
│                                              │
│  ┌──────────┬──────────┬──────────┐          │
│  │ 78.4 kg  │ −5.6 kg  │ −0.43 kg │          │
│  │ latest   │ 3 months │ per week │          │
│  └──────────┴──────────┴──────────┘          │
│                                              │
│  ENTRIES                                     │
│   21 Sep 08:14   78.4 kg   "morning"     ⋮  │
│   19 Sep 08:02   78.6 kg                 ⋮  │
│   17 Sep 07:58   78.9 kg                 ⋮  │
│                                See all ›     │
└──────────────────────────────────────────────┘
```

**Form.** A **line, one hue in two shades** — thin raw points plus a heavier 7-day moving average.
The moving average is the honest reading; daily weight is noise, and showing only raw points makes
people panic about water weight. A dashed goal line is a reference, in `--ink-muted`.

**Controls.** Range presets · ⚙ (show/hide raw points, moving-average window 3/7/14 days, show the
goal line) · a point tap shows its value and date · an entry row ⋮ → Edit · Delete · "Use as today's".

**Edge cases.** Gaps longer than the moving-average window **break the line** rather than
interpolating — a straight line across a 3-week gap asserts measurements that were never taken.
A single entry shows the point with "A trend needs at least two entries." Multiple entries on one
day are all plotted; the moving average uses the first-of-day value. An outlier (> 5 kg from
neighbours) is plotted but marked, with an "Is this right?" action, because a fat-finger 87.4 for
78.4 otherwise wrecks the trend silently.

---

## I-04 · Measurement Detail
**Route** `/progress/measurements/[key]` · **Type** Stacked · **Priority** P1

The same structure as I-03 for a single measurement (waist, chest, arm, thigh, body fat, or a custom
field). Adds a "compare with weight" toggle that renders a **second stacked chart sharing the x-axis**
— never a second y-axis.

**Edge cases.** A measurement with fewer than two entries shows the value and an empty-trend message.
Custom measurements from `body_metrics.custom_measurements` render identically to built-in ones.

---

## I-05 · Progress Photos
**Route** `/progress/photos` · **Type** Stacked · **Priority** P1

```
┌──────────────────────────────────────────────┐
│ < Progress     Photos              [ + ]  ⚙  │
│  ( Grid ) [ Compare ]                        │
│                                              │
│   ┌────────────────┐  ┌────────────────┐     │
│   │                │  │                │     │
│   │   2 Aug        │  │   21 Sep       │     │
│   │   83.5 kg      │  │   78.4 kg      │     │
│   └────────────────┘  └────────────────┘     │
│        ◀ pick ▶            ◀ pick ▶          │
│                                              │
│   7 weeks apart · −5.1 kg                    │
│   ( Share )  ( Save )                        │
│                                              │
│  🔒 Photos are private. They're stored        │
│     encrypted and never shown to anyone else. │
└──────────────────────────────────────────────┘
```

**Controls.** `[ + ]` capture or upload (tagged with the date and nearest weight) · Grid/Compare
toggle · per-side date pickers · Share/Save renders a side-by-side image **locally on the device** —
nothing is uploaded to a sharing service · ⚙ → privacy settings, delete all photos.

**Edge cases.** Photos are fetched through short-TTL signed URLs, re-issued per view; no URL is ever
long-lived or guessable (BRD §18). Deleting a photo is immediate and permanent, with a confirm.
"Delete all photos" is also available in K-07. Comparing a date with no photo shows the nearest
available and says so. The privacy line is required copy, not decoration.

---

## I-06 · Measurement Fields
**Type** Sheet · **Priority** P1

```
│  What do you want to track?                  │
│   ☑ Weight            (always on)            │
│   ☑ Body fat %                               │
│   ☑ Waist        ☑ Chest       ☑ Arm         │
│   ☐ Thigh        ☐ Hips        ☐ Neck        │
│   ☐ Calf         ☐ Forearm                   │
│   [ + Add a custom measurement ]             │
│   Reminder: ( Off ) [ Weekly ] ( Daily )     │
```

Unchecking a field **hides it from entry and display but never deletes its history** — re-enabling
restores the full chart. Custom measurements are stored in `body_metrics.custom_measurements` with a
name and unit. This is the BRD §15 "configurable measurements" requirement.

---

# J — Goals

## J-01 · Goals List
**Route** `/progress/goals` · **Type** Stacked · **Priority** P0

```
┌──────────────────────────────────────────────┐
│ < Progress          Goals               [ + ]│
│  [ Active ] ( Paused ) ( Completed )         │
│  ┌──────────────────────────────────────────┐│
│  │ Lose fat · reach 74.0 kg             ⋮  ││
│  │ ━━━━━━━━━━━━━━░░░░░░░  4.4 kg to go     ││
│  │ Started 2 Aug · target 30 Nov         › ││
│  ├──────────────────────────────────────────┤│
│  │ Strength · bench press 110 kg        ⋮  ││
│  │ ━━━━━━━━━━━━━━━━━━░░░  7.5 kg to go     ││
│  │ Started 1 Jul · no end date           › ││
│  └──────────────────────────────────────────┘│
└──────────────────────────────────────────────┘
```

Multiple active goals are allowed (P02.3). ⋮ → Edit · Pause · Mark complete · Delete.
Paused goals stop appearing on I-01 and B-01 but keep their history.

---

## J-02 · Create / Edit Goal
**Route** `/progress/goals/new` · **Type** Stacked · **Priority** P0

```
┌──────────────────────────────────────────────┐
│ ✕            New goal                  [Save]│
│  WHAT KIND?                                  │
│   ◉ Lose fat      ○ Build muscle             │
│   ○ Maintain      ○ Get stronger             │
│   ○ Something else                           │
│                                              │
│  TRACK IT WITH                               │
│   [ Body weight ⌄ ]                          │
│    body weight · body fat % · a measurement  │
│    · an exercise 1RM · daily calories        │
│                                              │
│  TARGET                                      │
│   From  78.4 kg (now)                        │
│   To    ┌────────┐ kg                        │
│         │  74.0  │                           │
│                                              │
│  WHEN                                        │
│   Start  [ Today ⌄ ]                         │
│   Target [ 30 Nov 2026 ⌄ ]  ( No end date )  │
│                                              │
│  ⓘ That's about 0.45 kg per week.            │
│                                              │
│  ☑ Update my calorie target to match  ✦      │
└──────────────────────────────────────────────┘
```

**Controls & rules**
| Control | Behaviour |
|---------|-----------|
| Goal type | Maps to `fitness_goals.goal_type`; "Something else" enables a free-text name |
| Track it with | Sets `metric_key` + `direction`, which is what makes J-03 able to compute progress at all |
| Target value | Unit follows the metric. "From" is read-only and pulled from the latest reading |
| Dates | `start_date` ≤ today by default; `target_date` optional and must be after the start |
| ⓘ rate line | Computes the implied weekly rate live and warns above ~1% bodyweight/week: "That's a fast rate — most people find it hard to sustain." A caution, never a block, never medical advice |
| Update my calorie target | Optional; recalculates H-15 targets from the goal. Unchecked by default — **nothing silently changes another setting** |

**Validation.** Target must differ from the current value. A target in the wrong direction for the
goal type (gaining weight on a fat-loss goal) warns and offers to switch the type.

**Edge cases.** No current reading for the chosen metric → the goal is still creatable, and progress
shows "Log a {metric} to start tracking." A goal on an exercise 1RM uses the e1RM PR as its source
and says which formula. Editing a goal's target mid-flight keeps the original `start_date` and
starting value, so progress is measured from where the user actually started (P02.6).

---

## J-03 · Goal Detail
**Route** `/progress/goals/[goalId]` · **Type** Stacked · **Priority** P1

```
┌──────────────────────────────────────────────┐
│ < Goals       Lose fat                   ⋮   │
│  Reach 74.0 kg by 30 Nov                     │
│                                              │
│            5.1 of 9.5 kg                     │
│   ━━━━━━━━━━━━━━━━░░░░░░░░░░░░  54%          │
│                                              │
│  │ 84 ╲                                      │
│  │     ╲●╲                                   │
│  │       ╲●─╲●                               │
│  │           ╲──●  78.4                      │
│  │ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ 74.0 target   │
│  │ ·········· on-pace line ··········        │
│  └──────────────────────────────────────────  │
│   Aug            Sep            Nov           │
│                              Table view       │
│                                              │
│  ┌──────────────┬──────────────┬────────────┐│
│  │ −0.43 kg/wk  │ 10 weeks     │ ~12 Nov    ││
│  │ average rate │ elapsed      │ projected  ││
│  └──────────────┴──────────────┴────────────┘│
│                                              │
│  Slightly ahead of pace.               ⓘ     │
│                                              │
│  ( Adjust goal )   ( Pause )  ( Mark done )  │
└──────────────────────────────────────────────┘
```

**The on-pace line** is the straight line from the starting value to the target over the goal's
window — a reference, in `--ink-muted` dotted, not a data series.

**Status copy** is factual and never moralising: "Slightly ahead of pace" · "Behind pace" ·
"Holding steady" · "Moving away from your target". Never "You're failing" or "Great job!".

**Edge cases.** A goal with no end date shows rate and elapsed time but no projection or pace line.
A goal whose metric has no readings in 30 days shows "No recent data" instead of a stale projection.
A goal reached early → J-04 triggers. A target date passed without reaching the goal → the card asks
"Extend, adjust or close this goal?" rather than silently marking it failed.

---

## J-04 · Goal Outcome
**Type** Dialog · **Priority** P1

```
   ┌────────────────────────────────────────┐
   │                 🎯                     │
   │         You reached your goal          │
   │                                        │
   │            74.0 kg                     │
   │      from 83.5 kg in 16 weeks          │
   │                                        │
   │  ( Set a new goal )   [ Keep it here ] │
   │  ( Switch to maintenance )             │
   └────────────────────────────────────────┘
```

Triggered when the tracked metric crosses the target. Sets `status = completed` and `completed_at`.
"Switch to maintenance" creates a maintenance goal at the current value and offers to update calorie
targets accordingly.

**For a missed target date**, the dialog is different and deliberately neutral:
> "Your target date for *Lose fat* has passed. You're 4.4 kg from 74.0 kg."
> `( Extend the date )` `( Adjust the target )` `( Close this goal )`
>
> No failure language, no streak-breaking, no guilt. The user decides what the outcome means.
