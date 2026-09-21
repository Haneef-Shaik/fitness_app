# Traceability Matrix

Every BRD requirement mapped to the screen that delivers it, the API that backs it, and the test that
proves it. Nothing in the BRD is unassigned; nothing in the UI is invented.

---

## 1. Functional requirements → screens → APIs

| BRD ID | Requirement | Screens | Primary APIs | Milestone |
|--------|-------------|---------|--------------|-----------|
| FR-W01 | Workout templates | C-02, C-03, C-04, C-05, C-06, C-07, C-08, C-09 | `/workout-programs`, `/workout-programs/:id/days`, `/plan-days/:id/exercises` | M2 |
| FR-W02 | Exercise catalog | D-01, D-02, D-03, D-04, C-06 | `/exercises`, `/muscle-groups`, `/exercises/:id/stats` | M2 |
| FR-W03 | Workout session | E-01, E-02, E-05, E-07, E-08, E-09, E-10 | `/workout-sessions`, `/workout-sessions/:id/finish`, `/workout-sessions/active` | M2 |
| FR-W04 | Set logging | E-03, E-06, E-12 | `/session-exercises/:id/sets`, `/workout-sets/:id`, `/workout-sessions/:id/sets/batch` | M2 |
| FR-W05 | Previous performance | E-03, F-05 | `/exercises/:id/previous-performance` | M2 |
| FR-W06 | History | F-01, F-02, F-03, F-04, F-05, F-06, F-07 | `/history/workouts`, `/history/previous-occurrence`, `/history/compare` | M3 |
| FR-W07 | Analytics | G-01 … G-07, E-08, E-11, D-02 | `/analytics/workouts`, `/analytics/muscle-volume`, `/analytics/exercises/:id`, `/analytics/personal-records`, `/analytics/frequency`, `/analytics/adherence` | M4 |
| FR-N01 | Meal logging | H-01, H-02, H-03, H-04, H-05, H-10, H-11, H-12, H-13, H-16 | `/meals`, `/meals/:id/items`, `/foods`, `/recipes` | M5 |
| FR-N02 | Photo input | H-09, H-07 | `/uploads/sign`, `/food-analysis/image`, `/food-analysis/:id` | M6 |
| FR-N03 | Text input | H-06, H-07 | `/food-analysis/text` | M6 |
| FR-N04 | AI correction | H-08, H-18, H-02 | `/food-analysis/:id/confirm` | M6 |
| FR-N05 | Nutrition totals | H-01, H-02, H-14, B-01 | `/meals?date=`, `/analytics/nutrition` | M5 / M7 |
| FR-P01 | Body metrics | I-01, I-02, I-03, I-04, I-05, I-06 | `/body-metrics`, `/analytics/body` | M7 |
| FR-P02 | Goals | J-01, J-02, J-03, J-04, H-15, A-08 | `/goals`, `/profile` | M1 / M7 |
| FR-C01 | Customization | K-03, K-04, B-02, H-15, H-16, D-03, D-04, I-06 | `/profile/preferences`, `/profile/dashboard` | M1 / M7 |

---

## 2. Acceptance criteria → verification

BRD §23, made executable.

| AC | Criterion | Flow under test | Assertion | Test type |
|----|-----------|-----------------|-----------|-----------|
| AC-01 | Create a Chest workout with multiple exercises and target sets/reps | C-04 → C-05 → C-06 → C-07 | The program persists with ≥ 2 `plan_exercises`, each with `target_sets` and a rep range | E2E |
| AC-02 | Record every performed set with load and reps | E-01 → E-03 (× n) | `workout_sets` count == sets entered; `load_kg` and `reps` match; `set_index` is dense | E2E |
| AC-03 | Completed sessions appear under the correct **user-local** date | E-08 → F-01 / F-07 | A session started 23:40 in UTC+5:30 appears under that local date, not the UTC one | E2E + unit (5 timezones, both DST directions) |
| AC-04 | Starting the same workout again shows previous performance | Complete a session → start the same plan day → E-03 | The previous-performance strip shows the prior session's sets before any input | E2E |
| AC-05 | Retrieve the previous chest-focused session without knowing its date | F-01 → F-02 (muscle = Chest) → F-05 | Returns the most recent completed session with a chest-primary exercise; states if it widened to secondary | E2E + unit (resolution rule) |
| AC-06 | Exercise and session volume are calculated from stored sets | E-08, F-03, G-02 | Σ(`load_kg` × `reps`) over completed non-warm-up sets, matching across all three screens | Unit + E2E |
| AC-07 | A manually logged meal updates daily totals | H-04 → H-05 → H-02 → H-01 → B-01 | The day total increases by exactly the item's calories, immediately | E2E |
| AC-08 | Text food input produces editable structured candidates | H-06 ("2 eggs, 3 rotis and 200g chicken") → H-08 | Three separately editable items with quantities and units — not one blob | E2E |
| AC-09 | Food-image input produces editable candidates with estimated nutrition | H-09 → H-07 → H-08 | ≥ 1 item with a quantity, macros and a confidence value; every field editable | E2E (mocked AI) |
| AC-10 | Corrected nutrition becomes confirmed while the original AI result stays available | H-08 (edit a quantity) → confirm → H-18 | `meal_items.confirmed = true` and `user_corrected = true` with the new value; `food_analysis_items` row byte-identical to before | **Integration — the critical one** |
| AC-11 | The dashboard reflects current workout, nutrition and body state | B-01 after each of the above | All three cards show the just-written data for the local date | E2E |
| AC-12 | Historical records survive plan and target changes | Complete a session → C-05 edit the plan → F-03; H-15 change targets → H-01 past day | Session sets, volume and PRs byte-identical after the plan edit; past totals unchanged after the target change | **Integration — the other critical one** |

---

## 3. BRD §22 queries → screen that answers them

The BRD lists twelve questions the data model must support. Every one must be answerable **in the UI**,
not merely in SQL.

| # | Question | Screen | Taps from the dashboard |
|---|----------|--------|-------------------------|
| 1 | What workout did I complete on a particular date? | F-07 → F-03 | 3 |
| 2 | What did I do during my previous chest day? | F-05 | 3 (Train → History → Previous chest) |
| 3 | Compare my last three chest sessions | F-06 | 4 |
| 4 | How much volume did I do for chest this week? | G-02 (muscle filter) | 3 |
| 5 | What was my best bench press set this month? | G-03 / G-04 / D-02 | 3 |
| 6 | How many times did I train back in the last four weeks? | G-05 | 3 |
| 7 | What did I eat today? | H-01 | 1 |
| 8 | How many calories and grams of protein today? | B-01 | **0** |
| 9 | What was my average daily calorie intake last week? | H-14 | 2 |
| 10 | How does this week's average weight compare with last week's? | I-03 | 2 |
| 11 | How much protein on training vs rest days? | H-14 ("Training vs rest days") | 2 |
| 12 | How far am I from my target weight? | I-01 / J-03 | 1 |

All twelve are reachable in ≤ 4 taps; the two most frequent (8 and 7) are at 0 and 1.

---

## 4. Data-model principles (BRD §7) → enforcement point

| Principle | Enforced where |
|-----------|----------------|
| Separate planned from actual | Distinct table trees; `session_exercises.target_snapshot`; C-* writes never touch E-*/F-* data. Tested by AC-12 |
| Every performed set is a first-class record | `workout_sets` with one row per set; E-03 commits individually |
| Raw AI separate from confirmed nutrition | `food_analysis_items` append-only; only `meal_items.confirmed` aggregates. Tested by AC-10 |
| Canonical units, convert at presentation | `load_kg`/`height_cm`/`weight_kg`/`*_per_100g`; `lib/units` at the render edge only. Tested by the U1 round-trip property |
| Keep metadata to reproduce derived metrics | `formula_version` on e1RM; snapshotted `meal_item` macros; `model_name` on analyses |
| Soft-delete reusable config | `status` enums; delete blocked when referenced (C-02, H-16, D-02) |
| User timezone decides the day | `local_date` generated columns; `lib/datetime` is the only date source. Tested by AC-03 |

---

## 5. Non-functional requirements (BRD §19) → measurement

| NFR | Target | Measured by |
|-----|--------|-------------|
| Performance | < 300 ms API p95 on common reads/writes | Server RED metrics; alert on breach |
| Performance (client) | **< 100 ms INP for a set commit** | Real-user monitoring on `session.set_committed.interaction_ms` |
| Availability | Workout logging usable with AI down | Chaos test: disable the AI gateway, run the full AC-02 flow (edge case A17) |
| Offline | Local logging + sync | E2E: log a session in airplane mode, kill the app, relaunch, restore connectivity, verify the server state |
| Scalability | AI independently scalable | The worker is a separate deployable from day one; load-tested in isolation |
| Observability | API, AI, resolution failures monitored | The alert table in [02-SYSTEM-ARCHITECTURE §9](02-SYSTEM-ARCHITECTURE.md#9-observability-brd-19) |
| Data quality | Confidence + correction paths | `ai.item_edited` ÷ `ai.analysis_confirmed` tracked as the model-quality metric |
| Extensibility | New fields without a rewrite | Config-driven field rendering (K-04), dashboard card registry (B-02), `custom_measurements` jsonb |

---

## 6. Screens with no BRD backing

Screens this doc set adds beyond the BRD, with justification. Each is a candidate for cutting if
scope needs to shrink.

| Screen | Why it exists | Cut impact |
|--------|---------------|------------|
| A-09 Program Starter | Prevents the empty-app problem at first run | Medium — new users reach an unusable dashboard |
| E-10 Session Recovery | Mitigates Risk R4 (losing a session) | **Do not cut** — this is a data-loss guard |
| E-12 Plate Calculator | High-value, low-cost convenience for barbell users | Low |
| H-11 Recipes | Makes repeat meals viable; a major retention lever | Medium |
| H-12 Copy Meal/Day | Same | Low |
| H-13 Quick Add | The escape hatch when no food record fits | Medium — the diary becomes incomplete without it |
| H-18 Analysis History | Makes BRD §18 auditability visible to the user | Low functionally, **high for trust** |
| L-02 Sync Center | Makes the NFR offline requirement legible and recoverable | **Do not cut** — silent sync failures destroy trust |
| L-06 Permission Primer | Protects a one-shot OS permission | Low cost, high value |
| L-07 Sync Conflict | Prevents silent last-writer-wins data loss | **Do not cut** |
| B-05 Global Search | Convenience | Low — safe to cut for MVP |
| F-07 Calendar | A second view of existing data | Low — safe to cut for MVP |

---

## 7. Open questions blocking sign-off

Carried from [01-PRD §13](01-PRD.md#13-open-questions). Each has a working default so no screen is
blocked, but each should be confirmed before M5.

| # | Question | Blocks | Working default |
|---|----------|--------|-----------------|
| Q1 | Nutrition database provider | H-04 coverage, resolution quality, K-10 attribution | Resolver interface + a seeded internal catalog |
| Q2 | Web, mobile, or both at MVP | Client strategy | Responsive PWA (D1) |
| Q3 | Definition of a "max reps" PR | G-04, E-11 | Most reps in a single working set, any load |
| Q4 | Warm-ups in volume | G-02 | Excluded, user-toggleable (D6) |
| Q5 | Canonical weigh-in when there are several per day | I-01, I-03, H-14 | First of the day |
| Q6 | Paid tier | K-11 | None at MVP |
| Q7 | Auto-confirm AI above a confidence threshold | H-08, K-08 | **No** — always explicit (BRD §12.7) |
| Q8 | Target history versioning | H-01 past days, G-06 | Not versioned at MVP; past days render consumed-only when the target changed after them |
| Q9 | Age policy / minimum age | A-07 | 13+, needs legal confirmation |
