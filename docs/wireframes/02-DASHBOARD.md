# Wireframes · B — Dashboard

[← Conventions](00-CONVENTIONS.md) · [Index](../README.md)

Screens B-01 … B-05. Implements BRD §14 in full.

---

## B-01 · Home Dashboard
**Route** `/home` · **Type** Tab root · **Priority** P0

**Purpose.** Answer, without a single tap: *what am I training today, how much have I eaten, how am
I trending, and what should I do next?*

**Entry points.** Tab bar · A-01 bootstrap · A-10 · logo tap · notification deep links · after
finishing a session (E-08) · after confirming a meal (H-08).

### Wireframe — populated
```
┌──────────────────────────────────────────────┐
│  Tuesday, 21 Sep            🔔•      (AB)    │
├──────────────────────────────────────────────┤
│ ① TODAY'S WORKOUT                            │
│ ┌──────────────────────────────────────────┐ │
│ │ Push · Chest & Triceps                   │ │
│ │ 6 exercises · ~52 min · last done 5d ago │ │
│ │                                          │ │
│ │ [      Start workout      ]   ( Swap )   │ │
│ └──────────────────────────────────────────┘ │
│                                              │
│ ② TODAY'S NUTRITION                      › │ │
│ ┌──────────────────────────────────────────┐ │
│ │                                          │ │
│ │            1,180 kcal left               │ │  hero figure
│ │        1,160 of 2,340 consumed           │ │
│ │  ━━━━━━━━━━━━━░░░░░░░░░░░░░░░░░░░░░░░    │ │  meter
│ │                                          │ │
│ │  Protein ████████░░░░  78 / 176 g        │ │
│ │  Carbs   ██████░░░░░░ 104 / 234 g        │ │
│ │  Fat     █████████░░░  41 /  78 g        │ │
│ │                                          │ │
│ │  Breakfast 420 · Lunch 740 · ✦ 1 pending │ │
│ │  [ Log a meal ]    ( 📷 Scan food )      │ │
│ └──────────────────────────────────────────┘ │
│                                              │
│ ③ WEIGHT                                 › │ │
│ ┌──────────────────────────────────────────┐ │
│ │  78.4 kg        ▼ 0.6 kg in 14 days      │ │
│ │  ▁▂▃▃▂▁▁▂▁▁▁▂▁  7-day avg 78.6 kg        │ │
│ │  Last logged 2 days ago     ( Log today )│ │
│ └──────────────────────────────────────────┘ │
│                                              │
│ ④ THIS WEEK                              › │ │
│ ┌──────────────────────────────────────────┐ │
│ │  Workouts  ●  ●  ○  ·  ·  ·  ·   2 of 4  │ │
│ │            M  T  W  T  F  S  S           │ │
│ │  Nutrition ✓  ✓  ◐  ·  ·  ·  ·   logged  │ │
│ │  Volume this week   14,280 kg  ▲ 8%      │ │
│ └──────────────────────────────────────────┘ │
│                                              │
│ ⑤ PROGRESS                               › │ │
│ ┌──────────────────────────────────────────┐ │
│ │  Bench press e1RM                        │ │
│ │       ╭─╮                                │ │
│ │   ╭───╯ ╰──╮      102 kg  ▲ 4 kg / 8 wk  │ │
│ │  ─╯        ╰─                            │ │
│ │  last 8 weeks · estimated (Epley)        │ │
│ └──────────────────────────────────────────┘ │
│                                              │
│ ( Customize dashboard )                      │
├──────────────────────────────────────────────┤
│   🏠       🏋️      ╭─+─╮      🍎        📈   │
└──────────────────────────────────────────────┘
```

### Regions

| # | Card | Data source | BRD ref |
|---|------|-------------|---------|
| ① | Today's workout | `GET /dashboard` → today's `workout_plan_day` by `scheduled_weekday`, plus last-performed date | §14.1 |
| ② | Today's nutrition | `daily_summaries` / live sum of `meal_items WHERE confirmed` for the local date, vs profile targets | §14.3 |
| ③ | Weight | Latest `body_metrics.weight_kg` + a 7-day moving average over the trend window | §14.4 |
| ④ | Weekly consistency | Completed vs planned sessions; days with ≥ 1 confirmed meal | §14.5 |
| ⑤ | Progress chart | Configurable: weight · volume · e1RM · calories · protein | §14.6 |
| — | Quick actions | FAB + in-card buttons | §14.7 |

### Controls

| Control | Action | Result | Failure |
|---------|--------|--------|---------|
| **Start workout** ① | `POST /workout-sessions {plan_day_id}` | → E-02 with the plan loaded | Offline → creates a local draft and starts anyway; syncs later |
| **Resume workout** ① | navigate | → E-02. Replaces "Start" whenever a session is `in_progress` | — |
| Swap ① | open sheet | Choose a different plan day or template → E-01 | — |
| Card ① body tap | navigate | → C-03 program detail (what's planned) | — |
| Nutrition card › ② | navigate | → H-01 diary for today | — |
| Meter / macro bars ② | navigate | → H-01, scrolled to totals | — |
| Log a meal ② | open sheet | → H-03 mode chooser, `meal` inferred from the current time | — |
| 📷 Scan food ② | navigate | → L-06 permission primer (first time) → H-09 | Camera denied → falls back to library picker |
| "✦ 1 pending" ② | navigate | → H-01 filtered to unconfirmed items | — |
| Weight card ③ / sparkline | navigate | → I-03 weight trend | — |
| Log today ③ | open sheet | → I-02 | — |
| This week › ④ | navigate | → G-06 adherence | — |
| Week dots ④ | tap a day | → F-01 filtered to that date, or H-01 for that date | Future day → inert, no tap |
| Progress card ⑤ | navigate | → G-03 / I-03 / H-14 depending on the selected metric | — |
| Progress card ⋮ ⑤ | menu | Change metric · change range | — |
| Customize dashboard | navigate | → B-02 | — |
| Pull to refresh | refetch | Re-runs `GET /dashboard` | Offline → keeps cached content, shows the stale badge |
| 🔔 | navigate | → B-04 | — |
| Avatar | navigate | → K-01 | — |

### States

**First-run / empty** — the most important state to get right, because *every* user sees it.
```
┌──────────────────────────────────────────────┐
│  Tuesday, 21 Sep                     (AB)    │
├──────────────────────────────────────────────┤
│  Let's get your first data in.               │
│  ┌──────────────────────────────────────────┐│
│  │ ☐  Log your first workout       [ Start ]││
│  │ ☐  Log a meal                   [ Log   ]││
│  │ ☐  Record your weight           [ Add   ]││
│  │ ☑  Set your targets                 ✓    ││
│  └──────────────────────────────────────────┘│
│  Your charts appear once there's something   │
│  to plot.                                    │
└──────────────────────────────────────────────┘
```
The checklist replaces the cards until at least one of each domain exists, then dissolves card by
card. **No zeroed charts, no flat lines at 0, no "0 kg" hero figures.**

| State | Behaviour |
|-------|-----------|
| Rest day (no plan scheduled) | Card ① reads "No workout planned today" + `[ Start a workout ]` + `( Browse programs )`. Never an empty card |
| Session in progress | Card ① becomes "In progress · 24:13 · 8 sets" + `[ Resume ]`; the active-session bar also shows |
| Session already completed today | Card ① becomes a summary: duration, sets, volume, PRs + `( View session )` + `( Log another )` |
| No nutrition logged yet | Card ② shows the full target as remaining, with "Nothing logged yet" — not "0 kcal" as an achievement |
| Over calorie target | Remaining goes negative, rendered with the diverging warm arm: "320 kcal over" + status-serious icon. **Never red-alarm styling, never a judgement** |
| No targets set | Card ② shows consumed only + `[ Set a target ]` |
| No weight ever logged | Card ③ → "Track your weight to see the trend" + `[ Log weight ]` |
| Only one weight entry | Value shown, no trend, "One more entry and we'll show the trend" |
| Loading | Skeleton cards matching each card's real height — no layout shift |
| Partial failure | The failed card shows an inline error + retry; the others render normally |
| Offline | All cards render from cache with a stale timestamp; Start workout still works |
| Unverified email (grace) | A dismissible banner above card ① |
| Outbox has failed writes | A banner: "{n} changes couldn't sync" → L-02 |

### Data
`GET /dashboard?date={localDate}` returns one payload for the whole screen:
```jsonc
{ "date": "2026-09-21",
  "workout": { "plan_day": {...}, "active_session": null, "completed_session": null,
               "last_performed_at": "2026-09-16" },
  "nutrition": { "consumed": {...}, "target": {...}, "remaining": {...},
                 "by_meal": [...], "pending_item_count": 1 },
  "body": { "latest": {...}, "trend": [...], "moving_average": 78.6 },
  "week": { "planned": 4, "completed": 2, "days": [...], "volume_kg": 14280, "volume_delta_pct": 8 },
  "featured_chart": { "metric": "e1rm", "exercise_id": "...", "series": [...] } }
```
One call, because five separate requests on the app's most-opened screen is the difference between
a 400 ms and a 1.4 s dashboard.

### Edge cases
- **Local midnight passes while the screen is open** → an in-place rollover to the new date with a
  brief "It's a new day" toast. The nutrition card must not keep yesterday's totals.
- **Timezone changed since the last visit** → totals recompute; a one-time explainer notes that past
  daily figures may shift.
- **Two plan days scheduled on the same weekday** → card ① shows the first by `day_index` and a
  "2 planned today" chip that opens a chooser.
- **Program archived but still scheduled** → falls back to "No workout planned" + a prompt to pick
  a new program.
- **Targets changed today** → the card uses the *current* target; history is unaffected (AC-12).
- **Weight logged in the future** (timezone or manual date error) → excluded from "latest", flagged
  in I-03.
- **Volume delta with no prior week** → "▲ 8%" is suppressed; shows "first week" instead.
- Very long program or plan-day names → truncate with a tooltip/title, never wrap to three lines.

### Keyboard / a11y
- Landmark structure: `header` → `main` with one `section` per card, each with an `aria-labelledby`.
- The hero figure is announced as "1,180 kilocalories remaining of 2,340".
- Meters use `role="meter"` with `aria-valuenow/min/max` and a text alternative.
- The week dot strip is a list with per-day labels ("Monday, workout completed"), never color-alone.
- Card order in the DOM matches visual order, including after B-02 reordering.

### Events
`dashboard.viewed{has_plan, has_active_session, cards_visible}` ·
`dashboard.quick_action{action}` · `dashboard.card_tapped{card}`

---

## B-02 · Customize Dashboard
**Route** `/home/customize` · **Type** Stacked · **Priority** P1 · BRD §15

```
┌──────────────────────────────────────────────┐
│ < Dashboard              Customize    [Save] │
│                                              │
│  Drag to reorder. Toggle to show or hide.    │
│                                              │
│  ┌──────────────────────────────────────────┐│
│  │ ⠿  Today's workout                   ☑  ││
│  │ ⠿  Today's nutrition                 ☑  ││
│  │ ⠿  Weight                            ☑  ││
│  │ ⠿  This week                         ☑  ││
│  │ ⠿  Progress chart                    ☑  ││
│  │       Metric: e1RM · Bench press   ⌄    ││
│  │       Range:  8 weeks              ⌄    ││
│  │ ⠿  Personal records                  ☐  ││
│  │ ⠿  Muscle balance                    ☐  ││
│  │ ⠿  Recent meals                      ☐  ││
│  │ ⠿  Goal progress                     ☐  ││
│  └──────────────────────────────────────────┘│
│                                              │
│  ( Reset to default )                        │
└──────────────────────────────────────────────┘
```

**Controls**
| Control | Action | Result |
|---------|--------|--------|
| ⠿ drag handle | reorder | Long-press then drag on touch; ↑/↓ with the handle focused on keyboard. **Keyboard reordering is mandatory** |
| ☑ / ☐ | toggle | Hides/shows. At least one card must remain visible; the last one's toggle disables with a reason |
| Metric ⌄ (progress card) | select | weight · session volume · muscle volume · e1RM (+ exercise picker) · calories · protein |
| Range ⌄ | select | 4 / 8 / 12 / 26 / 52 weeks |
| Save | `PATCH /profile/dashboard` | Returns to B-01 with the new layout |
| Reset to default | confirm dialog | Restores the shipped order and visibility |
| < Back with unsaved changes | intercept | "Discard changes?" → Discard / Keep editing |

**Edge cases.** A card whose data source is absent (e.g. Goal progress with no goals) still appears
in the list but is annotated "Nothing to show yet" so the user understands why enabling it changes
nothing. Layout is per-user, not per-device, and syncs. Drag on a list longer than the viewport
auto-scrolls at the edges.

**a11y.** The list is `role="list"` with `aria-describedby` explaining keyboard reordering; every
move announces "Moved Weight to position 2 of 9".

---

## B-03 · Quick Action Sheet (the FAB)
**Type** Sheet · **Priority** P0 · BRD §14.7

```
                                    NO ACTIVE SESSION
┌──────────────────────────────────────────────┐
│               ───                            │
│  Quick log                                   │
│                                              │
│  🏋️  Start a workout                      ›  │
│  🍎  Log a meal                           ›  │
│  📷  Scan food                            ›  │
│  ✍️  Describe a meal                      ›  │
│  ⚖️  Log weight                           ›  │
│  ⏱  Log a past workout                   ›  │
│                                              │
└──────────────────────────────────────────────┘

                                    ACTIVE SESSION
│  ⚡ Chest & Triceps · 24:13                   │
│  ➕  Log a set                             ›  │   ← promoted to first
│  🔀  Add an exercise                       ›  │
│  🏁  Finish workout                        ›  │
│  ──────────────────────────────────────────  │
│  🍎  Log a meal                            ›  │
│  ⚖️  Log weight                            ›  │
```

**Controls**
| Control | Destination | Note |
|---------|-------------|------|
| Start a workout | E-01 | |
| Log a set | E-03 for the current exercise | Only with an active session |
| Add an exercise | E-05 | Only with an active session |
| Finish workout | E-08 | Only with an active session |
| Log a meal | H-03, meal type inferred from the clock (`[ASSUMPTION]` breakfast < 11, lunch < 16, dinner < 22, else snack) | |
| Scan food | L-06 → H-09 | |
| Describe a meal | H-06 | |
| Log weight | I-02 | Sheet-over-sheet; dismissing returns to the dashboard, not to B-03 |
| Log a past workout | E-01 with a date picker | |

**Edge cases.** Offline → AI actions ("Scan food", "Describe a meal") are disabled with the inline
reason "Needs a connection". All other actions stay enabled. The sheet is dismissed by backdrop tap,
swipe-down, or Esc; dismissal never performs an action.

---

## B-04 · Notifications & Reminders
**Route** `/notifications` · **Type** Stacked · **Priority** P1

```
┌──────────────────────────────────────────────┐
│ < Home            Notifications   (Mark all) │
│                                              │
│  TODAY                                       │
│  ┌──────────────────────────────────────────┐│
│  │ ✦  Your food photo is ready          ›  ││  → H-08
│  │    3 items detected · 2 min ago      •  ││
│  ├──────────────────────────────────────────┤│
│  │ 🏆 New PR: Bench press 102.5 kg      ›  ││  → G-04
│  │    Today                                ││
│  ├──────────────────────────────────────────┤│
│  │ ⚠  2 changes couldn't sync           ›  ││  → L-02
│  │    Tap to review                     •  ││
│  └──────────────────────────────────────────┘│
│  EARLIER                                     │
│  │ ⏰ Time to log lunch          11:58 am  ││
│  │ ⏰ Push day is scheduled today  7:00 am ││
│                                              │
│  ( Notification settings )                   │
└──────────────────────────────────────────────┘
```

**Notification types**
| Type | Trigger | Deep link |
|------|---------|-----------|
| AI analysis complete | `food_analyses.status = completed` | H-08 |
| AI analysis failed | `status = failed` | H-08 error state with retry |
| PR achieved | New `personal_records` row on finish | G-04 |
| Sync failure | Outbox terminal failure | L-02 |
| Workout reminder | Scheduled plan day + user time | E-01 |
| Meal reminder | Configured time, only if nothing logged for that meal | H-03 |
| Weigh-in reminder | Configured cadence | I-02 |
| Open session | `in_progress` > 6 h | E-02 |

**Controls.** Row tap → deep link + mark read · Swipe → dismiss (with undo) · Mark all →
`PATCH` all unread · Notification settings → K-06.

**Edge cases.** The target resource was deleted → the row explains it and offers removal instead of
404-ing. Push permission never granted → an in-app-only banner explains that reminders appear here
only, with an enable path. Empty → "Nothing new" with a link to reminder settings.

---

## B-05 · Global Search
**Route** `/search` · **Type** FS · **Priority** P1

```
┌──────────────────────────────────────────────┐
│ < 🔍 bench                              ✕    │
│  [ All ] ( Exercises ) ( Foods ) ( Sessions )│
│                                              │
│  EXERCISES                                   │
│   🏋️ Bench Press (Barbell)   102.5 kg PR  ›  │
│   🏋️ Incline Bench Press     last: 6d ago ›  │
│  FOODS                                       │
│   🍎 Chicken breast, grilled   165 kcal/100g │
│  SESSIONS                                    │
│   📅 Chest & Triceps        16 Sep · 8.2k kg │
│                                              │
│  RECENT SEARCHES                             │
│   squat · biryani · pull day                 │
└──────────────────────────────────────────────┘
```

**Behaviour.** Debounced 300 ms, min 2 characters, results grouped by type with a max of 5 per group
and a "See all" per group. Recent searches are device-local and clearable.

**Edge cases.** No results → "Nothing matched '{q}'" + offers to create a custom exercise (D-03) or
custom food (H-10) with the query prefilled — search is the best moment to catch a missing record.
Offline → searches the local exercise cache only and says so.

**a11y.** `role="combobox"` with `aria-expanded` and an `aria-live` result count; ↑/↓ traverse
results, Enter opens, Esc clears then closes.
