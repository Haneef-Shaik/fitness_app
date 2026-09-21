# Screen Architecture
## Complete screen inventory, navigation graph and route table

This document answers **"what screens exist and how are they connected"**.
For **"what does each screen look like and what does every button do"**, see [wireframes/](wireframes/).

---

## 1. Navigation model

### 1.1 Primary navigation — 5 tabs

```
┌──────────────────────────────────────────────────────────────┐
│                       CONTENT AREA                           │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│   🏠        🏋️        ╭───╮        🍎        📈              │
│  Home      Train      │ + │     Nutrition  Progress          │
│                       ╰───╯                                  │
└──────────────────────────────────────────────────────────────┘
      B-*       C/D/E/F/G-*   B-03      H-*        I/J/G-*
```

| Tab | Landing screen | Contains |
|-----|----------------|----------|
| **Home** | B-01 Dashboard | Today's training + nutrition + progress at a glance, quick actions |
| **Train** | C-01 / E-01 Train Hub | Programs, exercise library, start workout, history, workout analytics |
| **+** (FAB) | B-03 Quick Action Sheet | Log set · Log meal · Scan food · Add weight · Start workout |
| **Nutrition** | H-01 Diary | Day diary, meals, food entry, nutrition analytics, recipes |
| **Progress** | I-01 Progress | Body metrics, weight trend, goals, measurement history |

Settings (K-*) is reached from the **avatar in the top app bar**, not a tab — it is not a daily
destination and would waste a tab slot (BRD §14 lists no settings surface in the dashboard).

**Desktop (≥1024 px):** the same five sections become a labelled left rail with Settings appended,
and the FAB becomes a persistent "Log" button at the top of the rail.

### 1.2 Screen classes

| Class | Behaviour | Examples |
|-------|-----------|----------|
| **Tab root** | Preserves scroll + stack per tab | B-01, C-01, H-01, I-01 |
| **Stacked** | Pushes within a tab; back returns | C-02, D-02, F-03, H-02 |
| **Full-screen task** | Escapes the tab shell; exiting requires intent | E-02/E-03, H-08, H-09, A-07 |
| **Sheet** | Bottom sheet on mobile, dialog ≥768 px | B-03, E-04, F-02, H-03, H-05 |
| **Dialog** | Blocking confirmation | E-09, C-08, K-07 |
| **Overlay/Banner** | Non-blocking, contextual | E-10, L-02, H-07 |

---

## 2. Complete screen inventory

Legend — **Type**: `TR` tab root · `ST` stacked · `FS` full-screen · `SH` sheet · `DL` dialog · `OV` overlay.
**Pri**: `P0` MVP-critical · `P1` MVP · `P2` Phase 2.

### A · Auth & Onboarding — 10 screens
| ID | Screen | Type | Pri | Purpose |
|----|--------|------|-----|---------|
| A-01 | Splash / Session Bootstrap | FS | P0 | Restore session, check for an active workout draft, route |
| A-02 | Welcome | FS | P0 | Value proposition, Sign up / Log in |
| A-03 | Sign Up | FS | P0 | Create account |
| A-04 | Log In | FS | P0 | Authenticate |
| A-05 | Forgot / Reset Password | FS | P0 | Recovery flow (request + reset from link) |
| A-06 | Verify Email | FS | P1 | Confirm address, resend |
| A-07 | Onboarding Wizard | FS | P0 | 6 steps: basics → units & timezone → activity → goal → targets → schedule |
| A-08 | Target Review | FS | P0 | TDEE/macro suggestion, editable, clearly labelled an estimate |
| A-09 | Program Starter | FS | P1 | Pick a starter program, build one, or skip |
| A-10 | Onboarding Complete | FS | P1 | Hand-off to the dashboard with a first action |

### B · Dashboard — 5 screens
| ID | Screen | Type | Pri | Purpose |
|----|--------|------|-----|---------|
| B-01 | Home Dashboard | TR | P0 | BRD §14: today's workout, nutrition, weight, consistency, charts, quick actions |
| B-02 | Customize Dashboard | ST | P1 | Card visibility + order (BRD §15) |
| B-03 | Quick Action Sheet | SH | P0 | The FAB menu |
| B-04 | Notifications / Reminders | ST | P1 | Inbox for reminders, AI completions, PR notices |
| B-05 | Global Search | FS | P1 | Exercises, foods, sessions, meals in one field |

### C · Workout Planning — 9 screens
| ID | Screen | Type | Pri | Purpose |
|----|--------|------|-----|---------|
| C-01 | Train Hub | TR | P0 | Entry to today's workout, programs, library, history, analytics |
| C-02 | Programs List | ST | P0 | All programs, active + archived |
| C-03 | Program Detail | ST | P0 | Plan days, schedule, actions |
| C-04 | Program Create / Edit | ST | P0 | Name, description, day management |
| C-05 | Plan Day Editor | ST | P0 | Exercise list, reorder, add/remove |
| C-06 | Exercise Picker | SH | P0 | Search/filter/recent/custom, multi-select |
| C-07 | Prescription Editor | SH | P0 | Target sets, rep range, load, rest |
| C-08 | Program Schedule | ST | P1 | Assign plan days to weekdays |
| C-09 | Archive / Duplicate Confirm | DL | P1 | Destructive + deep-copy confirmations |

### D · Exercise Catalog — 5 screens
| ID | Screen | Type | Pri | Purpose |
|----|--------|------|-----|---------|
| D-01 | Exercise Library | ST | P0 | Search + filter the catalog |
| D-02 | Exercise Detail | ST | P0 | Muscles, history, PRs, e1RM trend |
| D-03 | Create / Edit Custom Exercise | ST | P0 | Name, equipment, pattern, tracked fields |
| D-04 | Muscle Mapping Editor | SH | P1 | Primary/secondary assignment |
| D-05 | Aliases & Merge | ST | P2 | Alias management, duplicate merge |

### E · Workout Logger — 13 screens (the critical path)
| ID | Screen | Type | Pri | Purpose |
|----|--------|------|-----|---------|
| E-01 | Start Workout | ST | P0 | Today's plan / template / repeat last / empty / past date |
| E-02 | Active Session — Exercise List | FS | P0 | Session overview, progress, navigation |
| E-03 | Active Session — Set Logger | FS | P0 | **The core screen.** Set entry + previous performance |
| E-04 | Rest Timer | OV | P0 | Countdown, adjust, skip, background-safe |
| E-05 | Add / Swap Exercise | SH | P0 | Mid-session exercise change |
| E-06 | Advanced Set Editor | SH | P1 | Set type, RPE/RIR, duration, distance, per-set note |
| E-07 | Session Notes | SH | P1 | Session-level note |
| E-08 | Finish Summary | FS | P0 | Volume, duration, PRs, confirm |
| E-09 | Discard Session | DL | P0 | Explicit destructive confirmation |
| E-10 | Session Recovery | OV | P0 | Resume / finish / discard an orphaned draft |
| E-11 | PR Celebration | OV | P1 | Moment of delight on a new record |
| E-12 | Plate Calculator | SH | P1 | What to load on the bar |
| E-13 | Supersets / Circuits | — | P2 | Grouped exercises |

### F · Workout History — 7 screens
| ID | Screen | Type | Pri | Purpose |
|----|--------|------|-----|---------|
| F-01 | History List | ST | P0 | Reverse-chronological sessions |
| F-02 | History Filters | SH | P0 | Date range, muscle, exercise, program |
| F-03 | Session Detail | ST | P0 | Read-only record of a past session |
| F-04 | Edit Past Session | FS | P1 | Retroactive correction |
| F-05 | Previous Occurrence | ST | P0 | "My previous chest day" (AC-05) |
| F-06 | Session Comparison | ST | P1 | 2–3 sessions side by side |
| F-07 | Training Calendar | ST | P1 | Month grid with training markers |

### G · Performance Analytics — 7 screens
| ID | Screen | Type | Pri | Purpose |
|----|--------|------|-----|---------|
| G-01 | Analytics Overview | ST | P0 | Range picker + headline metrics |
| G-02 | Volume Analytics | ST | P0 | Session/weekly/muscle-group volume |
| G-03 | Exercise Progression | ST | P0 | Per-exercise load, reps, volume, e1RM over time |
| G-04 | Personal Records | ST | P0 | PR board by exercise and record type |
| G-05 | Frequency & Muscle Balance | ST | P1 | Sessions, exposures, muscle heatmap |
| G-06 | Adherence | ST | P1 | Planned vs completed |
| G-07 | Estimated 1RM Detail | ST | P1 | e1RM trend + formula disclosure |

### H · Nutrition — 18 screens
| ID | Screen | Type | Pri | Purpose |
|----|--------|------|-----|---------|
| H-01 | Nutrition Diary | TR | P0 | The day: totals, target, remaining, meals |
| H-02 | Meal Detail | ST | P0 | Items, per-meal totals, edit |
| H-03 | Add Food — Mode Chooser | SH | P0 | Search / Describe / Photo / Quick add / Recent / Recipes / Barcode |
| H-04 | Food Search | FS | P0 | Search the nutrition DB + custom foods |
| H-05 | Food Detail & Portion | SH | P0 | Serving picker, computed macros |
| H-06 | Describe Your Meal (text AI) | FS | P0 | Natural-language input (AC-08) |
| H-07 | AI Processing | OV | P0 | Async status, dismissible |
| H-08 | AI Review & Correct | FS | P0 | **Confidence + full editability** (AC-09, AC-10) |
| H-09 | Photo Capture | FS | P0 | Camera / library, multi-image |
| H-10 | Create / Edit Custom Food | ST | P0 | Per-100g macros + serving definition |
| H-11 | Recipes & Saved Meals | ST | P1 | Reusable multi-item meals |
| H-12 | Copy Meal / Copy Day | SH | P1 | Duplicate to another date/meal |
| H-13 | Quick Add | SH | P1 | Raw calories/macros, no food record |
| H-14 | Nutrition Analytics | ST | P0 | Week / month / custom range (BRD §11) |
| H-15 | Calorie & Macro Targets | ST | P0 | Manual or TDEE-derived |
| H-16 | Meal Category Manager | ST | P1 | Custom meal types (BRD §15) |
| H-17 | Barcode Scanner | FS | P2 | BRD §21 |
| H-18 | Analysis History | ST | P1 | Past AI analyses + their raw results (audit, BRD §18) |

### I · Body Progress — 6 screens
| ID | Screen | Type | Pri | Purpose |
|----|--------|------|-----|---------|
| I-01 | Progress Overview | TR | P0 | Weight, measurements, goals, trends |
| I-02 | Log Body Metric | SH | P0 | Weight + configurable measurements |
| I-03 | Weight Trend | ST | P0 | Chart with moving average, entry list |
| I-04 | Measurement Detail | ST | P1 | One measurement over time |
| I-05 | Progress Photos | ST | P1 | Private photo timeline + compare |
| I-06 | Measurement Fields | SH | P1 | Choose which fields to track |

### J · Goals — 4 screens
| ID | Screen | Type | Pri | Purpose |
|----|--------|------|-----|---------|
| J-01 | Goals List | ST | P0 | Active / paused / completed |
| J-02 | Create / Edit Goal | ST | P0 | Type, target, dates |
| J-03 | Goal Detail | ST | P1 | Progress vs the linked metric |
| J-04 | Goal Outcome | DL | P1 | Achieved / missed, next step |

### K · Profile & Settings — 11 screens
| ID | Screen | Type | Pri | Purpose |
|----|--------|------|-----|---------|
| K-01 | Profile | ST | P0 | Identity, body basics, summary stats |
| K-02 | Account & Security | ST | P0 | Email, password, sessions, sign out |
| K-03 | Units, Locale & Timezone | ST | P0 | Metric/imperial, timezone, week start |
| K-04 | Logging Preferences | ST | P0 | Optional fields, rest defaults, warm-up in volume |
| K-05 | Dashboard Layout | ST | P1 | → B-02 |
| K-06 | Notifications & Reminders | ST | P1 | Workout/meal/weigh-in reminders |
| K-07 | Data & Privacy | ST | P0 | Export, delete images, delete account |
| K-08 | AI Preferences | ST | P1 | Confidence threshold display, quota, model transparency |
| K-09 | Integrations | ST | P2 | Wearables, health platforms |
| K-10 | About & Legal | ST | P0 | Version, terms, privacy, licences, support |
| K-11 | Subscription | ST | P2 | Stub |

### L · System & Cross-cutting — 8 screens
| ID | Screen | Type | Pri | Purpose |
|----|--------|------|-----|---------|
| L-01 | Empty State (pattern) | — | P0 | Shared empty-state component |
| L-02 | Offline Banner & Sync Center | OV/ST | P0 | Connectivity, outbox, failed writes |
| L-03 | Error State (pattern) | — | P0 | Shared error surface with retry + request_id |
| L-04 | Not Found (404) | FS | P0 | Unknown route or deleted resource |
| L-05 | Session Expired | DL | P0 | Re-authenticate without losing context |
| L-06 | Permission Primer | DL | P0 | Camera / notifications, explained before the OS prompt |
| L-07 | Sync Conflict | DL | P1 | Two devices edited the same record |
| L-08 | Maintenance / Degraded | FS | P1 | Planned downtime, AI degraded notice |

**Total: 103 screens** — 64 `P0`, 34 `P1`, 5 `P2`.

---

## 3. Navigation graph

### 3.1 Top level
```
                            ┌──────────────┐
                            │ A-01 Splash  │
                            └──────┬───────┘
                    no session ┌───┴───┐ session + no profile
                               ▼       ▼                      session + profile
                       ┌────────────┐  ┌──────────────┐              │
                       │ A-02 Welcome│ │A-07 Onboarding│             │
                       └──┬──────┬──┘  └───────┬───────┘             │
                     A-03 │      │ A-04    A-08│A-09│A-10            │
                          └──┬───┘             └────┴───┐            │
                             │                          ▼            ▼
                             └──────────────────────► ┌──────────────────┐
                                                      │  B-01 DASHBOARD  │ ◄── deep links
                                                      └─┬───┬───┬───┬──┬─┘
                     ┌────────────────┬─────────────────┘   │   │   │  └────────────┐
                     ▼                ▼                     ▼   ▼   ▼               ▼
              ┌─────────────┐  ┌────────────┐      ┌─────────────┐ ┌──────────┐ ┌─────────┐
              │ C-01 TRAIN  │  │ H-01 DIARY │      │ I-01 PROGRESS│ │B-03 FAB │ │K-01 Prof│
              └─────────────┘  └────────────┘      └─────────────┘ └──────────┘ └─────────┘
```

### 3.2 Training flow
```
 C-01 Train Hub
   ├─ "Start today's workout" ──────────────────────────────┐
   ├─ Programs ──▶ C-02 ──▶ C-03 ──┬─▶ C-04 Edit program    │
   │                               ├─▶ C-05 Plan Day Editor │
   │                               │     ├─▶ C-06 Picker    │
   │                               │     └─▶ C-07 Prescribe │
   │                               ├─▶ C-08 Schedule        │
   │                               └─▶ C-09 Archive/Dup     │
   ├─ Exercises ─▶ D-01 ──▶ D-02 ──┬─▶ D-03 Custom          │
   │                               └─▶ D-04 Muscles         │
   ├─ History ───▶ F-01 ──┬─▶ F-02 Filters                  │
   │                      ├─▶ F-03 Detail ──▶ F-04 Edit     │
   │                      ├─▶ F-05 Previous Occurrence ─┐   │
   │                      ├─▶ F-06 Compare ◄────────────┘   │
   │                      └─▶ F-07 Calendar                 │
   └─ Analytics ─▶ G-01 ──┬─▶ G-02 Volume                   │
                          ├─▶ G-03 Progression ◄── D-02     │
                          ├─▶ G-04 PRs                      │
                          ├─▶ G-05 Frequency                │
                          ├─▶ G-06 Adherence                │
                          └─▶ G-07 e1RM                     │
                                                            │
 ┌──────────────────────────────────────────────────────────┘
 ▼
 E-01 Start Workout
   │  source: today's plan | template | repeat last | empty | past date
   ▼
 E-02 Session Exercise List ◄──────────────────────────┐
   │        │                                          │
   │        ├─▶ E-05 Add/Swap exercise ────────────────┤
   │        ├─▶ E-07 Session notes ───────────────────-┤
   │        └─▶ E-09 Discard ──▶ (confirm) ──▶ C-01    │
   ▼                                                   │
 E-03 Set Logger (per exercise) ────────────────────── ┤
   ├─▶ E-04 Rest Timer (auto after a set)              │
   ├─▶ E-06 Advanced set editor                        │
   ├─▶ E-12 Plate calculator                           │
   ├─ swipe/next exercise ─────────────────────────────┘
   └─ "Finish"
        ▼
      E-08 Finish Summary ──▶ E-11 PR Celebration ──▶ F-03 Session Detail ──▶ B-01
```

### 3.3 Nutrition flow
```
 H-01 Diary (date-scoped)
   ├─ date nav ◄──▶ previous/next/picker
   ├─ meal card ──▶ H-02 Meal Detail ──┬─▶ H-05 edit item
   │                                   ├─▶ H-12 Copy meal
   │                                   └─▶ H-18 View original AI result
   ├─ "+" on a meal ──▶ H-03 Add Food (mode chooser)
   │       ├─ Search ──────▶ H-04 ──▶ H-05 Portion ──▶ add ──▶ H-02
   │       ├─ Describe ────▶ H-06 ──▶ H-07 ──▶ H-08 Review ──▶ confirm ──▶ H-02
   │       ├─ Photo ───────▶ L-06 permission ──▶ H-09 ──▶ H-07 ──▶ H-08 ──▶ H-02
   │       ├─ Quick add ───▶ H-13 ──▶ H-02
   │       ├─ Recent ──────▶ (list) ──▶ H-05 ──▶ H-02
   │       ├─ Recipes ─────▶ H-11 ──▶ H-02
   │       └─ Barcode [P2] ▶ H-17 ──▶ H-05
   ├─ "Create food" ──▶ H-10
   ├─ Analytics ──▶ H-14 (week | month | custom)
   ├─ Targets ──▶ H-15
   └─ Categories ──▶ H-16

 H-07 is dismissible: leaving keeps the job alive; completion raises a
 notification/badge that deep-links straight back to H-08.
```

### 3.4 Progress flow
```
 I-01 Progress Overview
   ├─ "Log weight" ──▶ I-02 ──▶ back with an updated chart
   ├─ Weight card ──▶ I-03 Trend ──▶ edit/delete an entry
   ├─ Measurement card ──▶ I-04
   ├─ Photos ──▶ I-05 ──▶ compare two dates
   ├─ Fields ──▶ I-06
   └─ Goals ──▶ J-01 ──▶ J-02 / J-03 ──▶ J-04
```

### 3.5 Cross-domain connections (the "connections" the BRD implies)
| From | To | Trigger |
|------|-----|--------|
| B-01 dashboard workout card | E-01 / E-02 | "Start" or "Resume" |
| B-01 nutrition card | H-01 | Tap the ring |
| B-01 weight card | I-03 | Tap the sparkline |
| B-03 FAB | E-03 (active session) or E-01 | "Log set" — context-aware |
| E-03 previous performance | F-03 | "View that session" |
| E-08 finish summary | G-04 | "See all PRs" |
| E-11 PR celebration | G-03 | "See progression" |
| D-02 exercise detail | G-03 | "Progression" |
| D-02 exercise detail | F-01 (pre-filtered) | "All sessions with this exercise" |
| F-03 session detail | F-06 | "Compare with previous" |
| F-05 previous occurrence | E-01 | "Repeat this workout" |
| H-02 meal detail | H-18 | "View the original AI estimate" |
| H-14 nutrition analytics | I-03 | Weight-trend overlay |
| G-06 adherence | C-03 | "Adjust the program" |
| J-03 goal detail | I-03 / H-14 / G-04 | Depending on the goal's metric |
| I-01 progress | H-15 | "Targets aren't matching your trend" |
| any screen | L-02 | Offline banner tap |
| any AI job completion | H-08 | Notification deep link |

---

## 4. Route table

```
PUBLIC
  /                                    A-01  splash → redirect
  /welcome                             A-02
  /login                               A-04
  /register                            A-03
  /reset-password                      A-05  (+ ?token= for the reset step)
  /verify-email                        A-06

ONBOARDING (authenticated, profile incomplete)
  /onboarding/[step]                   A-07  step ∈ basics|units|activity|goal|targets|schedule
  /onboarding/targets                  A-08
  /onboarding/program                  A-09
  /onboarding/done                     A-10

APP SHELL (authenticated)
  /home                                B-01
  /home/customize                      B-02
  /notifications                       B-04
  /search                              B-05

  /train                               C-01
  /train/programs                      C-02
  /train/programs/new                  C-04
  /train/programs/[programId]          C-03
  /train/programs/[programId]/edit     C-04
  /train/programs/[programId]/schedule C-08
  /train/plan-days/[dayId]             C-05
  /train/exercises                     D-01
  /train/exercises/new                 D-03
  /train/exercises/[exerciseId]        D-02
  /train/exercises/[exerciseId]/edit   D-03
  /train/start                         E-01
  /train/history                       F-01   ?from=&to=&muscle=&exercise=&program=
  /train/history/calendar              F-07
  /train/history/previous              F-05   ?muscle= | ?exercise=
  /train/history/compare               F-06   ?sessions=id1,id2[,id3]
  /train/sessions/[sessionId]          F-03
  /train/sessions/[sessionId]/edit     F-04
  /train/analytics                     G-01   ?from=&to=
  /train/analytics/volume              G-02
  /train/analytics/exercises/[id]      G-03
  /train/analytics/records             G-04
  /train/analytics/frequency           G-05
  /train/analytics/adherence           G-06
  /train/analytics/one-rep-max         G-07

  /nutrition                           H-01   ?date=YYYY-MM-DD  (defaults to local today)
  /nutrition/meals/[mealId]            H-02
  /nutrition/search                    H-04   ?meal=&date=
  /nutrition/describe                  H-06   ?meal=&date=
  /nutrition/photo                     H-09   ?meal=&date=
  /nutrition/analysis/[analysisId]     H-08
  /nutrition/foods/new                 H-10
  /nutrition/foods/[foodId]/edit       H-10
  /nutrition/recipes                   H-11
  /nutrition/recipes/[recipeId]        H-11
  /nutrition/analytics                 H-14   ?from=&to=&granularity=
  /nutrition/targets                   H-15
  /nutrition/categories                H-16
  /nutrition/analyses                  H-18
  /nutrition/barcode                   H-17   [P2]

  /progress                            I-01
  /progress/weight                     I-03
  /progress/measurements/[key]         I-04
  /progress/photos                     I-05
  /progress/goals                      J-01
  /progress/goals/new                  J-02
  /progress/goals/[goalId]             J-03
  /progress/goals/[goalId]/edit        J-02

  /settings                            K-01
  /settings/account                    K-02
  /settings/units                      K-03
  /settings/logging                    K-04
  /settings/dashboard                  K-05 → B-02
  /settings/notifications              K-06
  /settings/privacy                    K-07
  /settings/ai                         K-08
  /settings/integrations               K-09  [P2]
  /settings/about                      K-10
  /settings/subscription               K-11  [P2]
  /sync                                L-02

FULL-SCREEN (outside the shell)
  /session/[sessionId]                 E-02
  /session/[sessionId]/[exerciseId]    E-03
  /session/[sessionId]/finish          E-08

SYSTEM
  /offline                             L-02
  /maintenance                         L-08
  /* (unmatched)                       L-04
```

**URL-addressable sheets** use a query parameter so they survive refresh and can be linked:
`?sheet=filters` (F-02), `?sheet=add-food` (H-03), `?sheet=log-weight` (I-02),
`?sheet=portion&food=<id>` (H-05).

---

## 5. Screen-to-entity map

Which BRD entities each screen reads (R) and writes (W). Used to verify no entity is orphaned and
no screen invents data.

| Entity (BRD §8) | Screens |
|-----------------|---------|
| `User` | A-03 W · A-04 R · K-02 RW · K-07 W |
| `UserProfile` | A-07 W · K-01/K-03/K-04 RW · everywhere R (units, timezone) |
| `FitnessGoal` | A-07 W · J-01…J-04 RW · B-01 R · I-01 R |
| `WorkoutProgram` | C-02/C-03/C-04 RW · C-09 W · E-01 R · G-06 R |
| `WorkoutPlanDay` | C-03/C-05 RW · C-08 W · E-01 R · B-01 R |
| `PlanExercise` | C-05/C-06/C-07 RW · E-01/E-02 R |
| `Exercise` | D-01…D-04 RW · C-06 R · E-03/E-05 R · F-02 R · G-03 R |
| `MuscleGroup` | D-01/D-04 R · F-02 R · G-02/G-05 R |
| `WorkoutSession` | E-01…E-10 RW · F-01…F-07 R (F-04 W) · G-* R · B-01 R |
| `SessionExercise` | E-02/E-03/E-05 RW · F-03 R · G-03 R |
| `WorkoutSet` | E-03/E-06 RW · F-03/F-04 RW · G-02/G-03/G-07 R |
| `Meal` | H-01/H-02/H-12 RW · B-01 R · H-14 R |
| `MealItem` | H-02/H-05/H-08/H-13 RW · H-01 R · H-14 R |
| `Food` | H-04/H-05/H-10 RW · H-08 R |
| `FoodAnalysis` | H-06/H-07/H-09 W · H-08/H-18 R |
| `FoodAnalysisItem` | H-08 R (never W) · H-18 R |
| `BodyMetric` | I-01…I-04 RW · B-01 R · H-14 R · J-03 R |
| `PersonalRecord` | E-08/E-11 R · G-04 R · D-02 R |
| `DailySummary` | B-01 R · H-14 R · G-01 R |

No entity is unreachable from the UI; no screen depends on data the model does not hold.
