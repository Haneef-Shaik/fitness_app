# Product Requirements Document
## Fitness & Nutrition Tracking Platform

| Field | Value |
|-------|-------|
| Version | 1.0 |
| Status | Draft for review |
| Source | `fitness_nutrition_tracking_BRD_data_model.docx` v1.0 |
| Owner | Product |
| Last updated | 2026-09-21 |

---

## 1. Problem statement

People who train seriously keep their fitness data in three incompatible places: a workout logger
that forgets what they ate, a calorie app that forgets what they lifted, and a notes app or memory
for everything else. The consequence is that the questions that actually drive training decisions
are unanswerable:

- *What did I do on my last chest day, and did I beat it?*
- *Am I eating enough protein on training days specifically?*
- *Is my weight trend responding to the calorie target I set six weeks ago?*

Existing loggers optimise for **capture** and neglect **retrieval**. This product optimises for both:
capture must be fast enough to happen between sets, and the data model must be structured enough
that six months of it answers analytical questions without reprocessing.

## 2. Vision

> A single source of truth for a user's fitness journey: planned training, actual training,
> nutrition, body measurements, goals and progress. *(BRD §2)*

Concretely: a longitudinal fitness **data platform** whose core model
(`User → Goals/Profile → Planned Training → Actual Sessions → Sets → Analytics` alongside
`User → Meals → Food Items → Confirmed Nutrition → Analytics`, joined by `Body Metrics`)
can absorb an AI assistant, progressive-overload recommendations, wearables and coach workflows
later **without a schema rewrite**.

## 3. Target users

### Persona 1 — "Structured Lifter" (primary, ~70% of MVP value)
Trains 3–6×/week on a repeating program. Cares about progressive overload, volume per muscle group,
and PRs. Logs during the session, one-handed, often with sweaty hands and a phone propped on a bench.
**Hard requirement:** logging a set must not break training rhythm.
**Kills adoption:** any flow that takes more than ~3 seconds per set, or loses an in-progress session.

### Persona 2 — "Body Recomposition Tracker" (primary)
Tracks weight and calories against a target. Wants nutrition logging that survives eating food that
has no barcode and no recipe — home-cooked meals, restaurant plates, regional dishes. This is the
persona AI food analysis exists for.
**Kills adoption:** having to hand-build every home-cooked meal from component ingredients.

### Persona 3 — "Returning Analyst" (secondary)
Opens the app on a rest day, on a laptop, and asks retrospective questions
(BRD §22). Needs filters, comparisons and charts rather than fast capture.

### Persona 4 — "Coach" `[P2]`
Reads another user's data and assigns programs. **Out of MVP scope**, but every
authorization check must be written as *"can actor A read resource R"*, never *"is this my user_id"*,
so coach access is an authorization-policy change and not a rewrite.

## 4. Jobs to be done

| JTBD | Screen(s) | Success measure |
|------|-----------|-----------------|
| Log the set I just did without losing my rhythm | E-03 | p95 tap-to-committed-set < 3 s; ≤ 2 taps for a repeat set |
| Know what I did last time so I can beat it | E-03, F-05, F-06 | Previous performance visible without navigation, 100% of the time it exists |
| Find my previous chest day without knowing its date | F-05 | 1 tap from History with a muscle filter |
| Know if I'm progressing | G-01…G-07 | Volume / e1RM / PR trend visible in ≤ 2 taps |
| Record a home-cooked meal in under 30 seconds | H-06, H-09, H-08 | p50 photo → confirmed meal < 45 s |
| Know how much protein I have left today | B-01, H-01 | Visible on the dashboard without interaction |
| Know whether my weight is actually moving | I-01, I-03 | Trend (smoothed), not just last reading |

## 5. Scope

### 5.1 In scope — MVP (BRD §20)
1. Authentication, profile, units, timezone, activity level, goals.
2. Exercise catalog (global) + custom exercises + muscle mappings.
3. Workout programs, plan days, exercise prescriptions.
4. Live workout logging: sets, reps, load, duration, RPE/RIR, warm-up flags, notes.
5. Workout history with date / workout / exercise / muscle-group filters.
6. Previous-session comparison, including "previous chest day".
7. Volume, frequency, PR and estimated-1RM analytics.
8. Manual meal and food logging.
9. Natural-language text food parsing.
10. Photo-based food analysis with an editable, confidence-annotated review step.
11. Daily / weekly / monthly / custom-range calories and macros.
12. Body weight + configurable measurements, with a trend chart.
13. A configurable dashboard.

### 5.2 In scope — Phase 2 (BRD §21) `[P2]`
Barcode scanning · offline-first sync · progressive-overload recommendations · exercise substitutions ·
sleep/recovery and wearable integrations · coach accounts and shared programs · micronutrient expansion ·
personalised nutrition recommendations · natural-language fitness assistant.

### 5.3 Explicitly out of scope
Social feed / friends / leaderboards · in-app video coaching · meal-plan generation and grocery lists ·
payments and subscription management · water and supplement tracking · menstrual-cycle tracking ·
multi-language content localisation (the UI is i18n-ready; content is English at MVP) ·
medical or clinical claims of any kind.

> **Product guardrail.** The app displays *estimates*. Every AI-derived nutrition figure and every
> calculated calorie target must be visually and textually marked as an estimate (BRD §18), and no
> surface may present a health, medical or clinical recommendation.

## 6. Goals & success metrics

| Goal (BRD §3) | Metric | MVP target |
|---------------|--------|------------|
| Make in-workout logging extremely fast | p95 set-commit interaction time | < 3 s |
| Retain structured history | Sessions with ≥ 1 set, completed and dated correctly | > 99.5% |
| Retrieval answers real questions | % of BRD §22 queries answerable in ≤ 3 taps | 100% |
| AI is useful but not authoritative | % of AI food items edited before confirm | tracked, no target — used to tune the model |
| Nutrition logging retention | D7 nutrition-logging retention | ≥ 35% |
| Training logging retention | D30 workout-logging retention | ≥ 45% |
| Reliability of core loop | Sessions lost / abandoned due to client error | < 0.1% |

## 7. Key user journeys (expanded from BRD §5)

### 7.1 Plan and perform a workout — *happy path*
`B-01 Dashboard → "Start workout" → E-01 Start Workout → E-02 Session Exercise List →
E-03 Set Logger (per exercise) → E-04 Rest Timer → … → "Finish" → E-08 Session Summary →
E-11 PR Celebration (if any) → F-03 Session Detail`

**Also covered:**
- No plan for today → E-01 offers *Repeat last session*, *Pick a template*, *Empty workout*.
- Equipment is taken → E-05 swaps the exercise without leaving the session.
- User adds an unplanned exercise → appended as `session_exercise` with `order_index` after the last.
- User skips a planned exercise → its `session_exercise` is created with zero completed sets, or not
  created at all if never opened. Adherence counts the session, not the exercise.
- App is killed mid-session → E-10 recovers from the local draft on next launch.
- Session left open overnight → auto-finalisation prompt (see §7.6).

### 7.2 Review the previous chest day
`F-01 History → F-02 Filters (muscle = Chest) → "Previous occurrence" → F-05 →
optional "Compare with the one before" → F-06 Comparison`

**Resolution rule (normative).** The *previous chest day* is the most recent `workout_session` where
`status = completed`, `user_id = me`, and at least one `session_exercise` maps to an `exercise` that
has an `exercise_muscles` row with `muscle_group = Chest` (or a descendant of Chest) and
`role = 'primary'`, ordered by `completed_at DESC`. If nothing matches on `primary`, the query widens
to `role IN ('primary','secondary')` and the UI states that it widened.

### 7.3 Log food using a photo
`H-01 Diary → "+" → H-03 Add Food → "Photo" → H-09 Capture →
H-07 Processing (async, dismissible) → H-08 AI Review & Correct → "Confirm" → H-02 Meal Detail`

**Also covered:**
- User navigates away while processing → a notification / diary badge brings them back to H-08.
- AI fails or times out → the meal still exists; the user is offered manual entry or retry.
- AI returns a food that can't be resolved to the nutrition DB → item is kept with the AI's proposed
  macros and flagged `unresolved`; the user can attach a food or accept the estimate.
- User confirms without editing → `meal_items.confirmed = true`, `source = image_ai`,
  `user_corrected = false`. Raw `food_analysis_items` are retained untouched.
- User edits → the *item* is updated; the original analysis row is never mutated (BRD §7, §12.8).

### 7.4 Log food using text
`H-03 → "Describe it" → H-06 Text input → parse → H-08 Review → Confirm`
Input `"2 eggs, 3 rotis and 200g chicken"` must yield three separately editable candidates with
quantities and units, not one blob.

### 7.5 Daily nutrition check
`B-01 Dashboard nutrition card` shows consumed / target / remaining and the macro split, computed
**only from confirmed items**, for the user-local day derived from `user_profiles.timezone`.

### 7.6 Lifecycle edges that need product decisions
| Situation | Behaviour |
|-----------|-----------|
| Session `in_progress` for > 6 h | On next app open, prompt: *Finish now / Keep going / Discard*. Never auto-discard. |
| Session `in_progress` past local midnight | Session date = `started_at` local date. Banner states which date it will be filed under. |
| Meal logged at 01:30 local | Belongs to that calendar day by default; the diary offers *Move to previous day*. |
| User changes timezone | Historical rows keep their stored UTC instants; day-bucketing recomputes. A one-time notice explains that past daily totals may shift. |
| User changes unit system | Display-only. Canonical `kg`/`cm`/`g` values are never rewritten. |
| User archives an exercise with history | History and analytics keep working. The exercise stops appearing in pickers. |
| User deletes a meal with a linked analysis | Meal and items are deleted; the `food_analysis` row and its image are deleted too (BRD §18 right to delete). |

## 8. Functional requirements

Each BRD requirement is expanded into testable sub-requirements. `→` gives the owning screen(s).

### FR-W01 · Workout templates
| ID | Requirement | Screen |
|----|-------------|--------|
| W01.1 | Create a program with a name, description and 1..n plan days | C-03, C-04 |
| W01.2 | Add, remove and reorder exercises within a plan day (`order_index` is dense and 0-based) | C-04 |
| W01.3 | Set per-exercise prescription: target sets, rep range (min/max), target load + unit, rest seconds | C-06 |
| W01.4 | Duplicate a program or a single plan day, producing a deep copy with new IDs | C-02, C-08 |
| W01.5 | Archive a program (`status = archived`); it disappears from pickers but historical sessions keep resolving `plan_day_id` | C-02, C-08 |
| W01.6 | Assign a plan day to a weekday (`scheduled_weekday`), or leave it unscheduled | C-07 |
| W01.7 | Editing a program never mutates any `workout_session`, `session_exercise` or `workout_set` | — (data rule) |

### FR-W02 · Exercise catalog
| ID | Requirement | Screen |
|----|-------------|--------|
| W02.1 | Search the global catalog by name with debounced, typo-tolerant matching | D-01, C-05 |
| W02.2 | Filter by muscle group, equipment and movement pattern | D-01 |
| W02.3 | Create a custom exercise (`owner_user_id = me`, `is_custom = true`) | D-03 |
| W02.4 | Map an exercise to 1..n muscle groups with `role ∈ {primary, secondary}`; ≥ 1 primary required | D-04 |
| W02.5 | Edit a custom exercise; global catalog entries are read-only but may be *copied* to a custom one | D-02, D-03 |
| W02.6 | Archive a custom exercise without breaking history | D-02 |
| W02.7 | Exercise detail shows all-time history, PRs, e1RM trend and last-performed date | D-02 |

### FR-W03 · Workout session
| ID | Requirement | Screen |
|----|-------------|--------|
| W03.1 | Start from today's scheduled plan day, any template, the last session, or empty | E-01 |
| W03.2 | Starting from a plan day snapshots the prescription into the session UI; later plan edits do not change it | E-01, E-02 |
| W03.3 | Only one session may be `in_progress` per user; starting another prompts to finish or discard the first | E-01, E-10 |
| W03.4 | Add, remove, reorder, swap and skip exercises mid-session | E-02, E-05 |
| W03.5 | Session notes at session and exercise level | E-07, E-03 |
| W03.6 | Finish sets `completed_at`, `status = completed` and triggers derived-metric calculation | E-08 |
| W03.7 | Cancel sets `status = cancelled`, retains rows, requires typed/explicit confirmation | E-09 |

### FR-W04 · Set logging
| ID | Requirement | Screen |
|----|-------------|--------|
| W04.1 | Record reps, load (+ display unit), duration, distance, RPE, RIR, `set_type`, `completed` | E-03, E-06 |
| W04.2 | Load is stored canonically in `load_kg`; imperial input converts on write and back on read | — (data rule) |
| W04.3 | Prefill each new set from the previous set of the same exercise in this session | E-03 |
| W04.4 | One-tap "repeat previous set" | E-03 |
| W04.5 | RPE/RIR/rest/duration/distance fields are individually hideable per user preference | K-04, E-03 |
| W04.6 | Edit or delete any set in the session; `set_index` stays dense after deletion | E-03 |
| W04.7 | A set with no reps **and** no duration **and** no distance is invalid and cannot be committed | E-03 |
| W04.8 | Bodyweight exercises accept reps with null load without validation error | E-03 |

### FR-W05 · Previous performance
| ID | Requirement | Screen |
|----|-------------|--------|
| W05.1 | While logging exercise X, show the set-by-set result of the most recent completed session containing X | E-03 |
| W05.2 | Show the delta vs that session per set (load, reps, volume) | E-03 |
| W05.3 | If X was never performed, show a first-time state, not an error or an empty box | E-03 |
| W05.4 | Previous performance loads without blocking set entry | E-03 |

### FR-W06 · History
| ID | Requirement | Screen |
|----|-------------|--------|
| W06.1 | Reverse-chronological session list, paginated | F-01 |
| W06.2 | Filter by date range, program, plan day, exercise and muscle group; filters combine (AND) | F-02 |
| W06.3 | "Previous occurrence" resolution for a muscle group or exercise (§7.2 rule) | F-05 |
| W06.4 | Compare 2–3 sessions of the same plan day or muscle group | F-06 |
| W06.5 | Calendar view with per-day training markers | F-07 |
| W06.6 | Retroactively edit or delete a completed session; derived metrics and PRs recompute | F-04 |
| W06.7 | Log a session for a past date | E-01 |

### FR-W07 · Analytics
| ID | Requirement | Definition | Screen |
|----|-------------|-----------|--------|
| W07.1 | Set volume | `load_kg × reps`, only for `completed = true` and `set_type ≠ warmup` (D6) | G-02 |
| W07.2 | Exercise / session / weekly volume | Sums of the above | G-02 |
| W07.3 | Muscle-group volume | Volume of exercises mapped to the group; primary ×1.0, secondary ×0.5 (D7) | G-02, G-05 |
| W07.4 | Estimated 1RM | Epley `load_kg × (1 + reps/30)`, stored with `formula_version` | G-07 |
| W07.5 | Personal records | Best `max_load`, `max_reps`, `volume`, `estimated_1rm` per exercise, working sets only | G-04, E-11 |
| W07.6 | Frequency | Completed sessions and exercise exposures per range | G-05 |
| W07.7 | Adherence | `completed planned sessions ÷ planned sessions` over the range | G-06 |
| W07.8 | Every metric must state its date range and unit | all G-* |

### FR-N01 · Meal logging
| ID | Requirement | Screen |
|----|-------------|--------|
| N01.1 | Create a meal with `meal_type`, `consumed_at` and optional custom name | H-01, H-02 |
| N01.2 | Add items with quantity + unit; nutrition derives from `food` × quantity | H-04, H-05 |
| N01.3 | Custom meal categories beyond breakfast/lunch/dinner/snack | H-18 |
| N01.4 | Create a custom food with per-100g macros and a serving definition | H-10 |
| N01.5 | Save a meal as a reusable recipe / saved meal | H-11 |
| N01.6 | Copy a meal or an entire day to another date | H-12 |
| N01.7 | Quick-add raw calories/macros with no food record | H-13 |
| N01.8 | Edit and delete items and meals; totals recompute immediately | H-02 |

### FR-N02 · Photo input
| ID | Requirement | Screen |
|----|-------------|--------|
| N02.1 | Capture from camera or pick from library; multiple images per analysis | H-09 |
| N02.2 | Client-side downscale + compress before upload; strip EXIF location | H-09 |
| N02.3 | Upload to private storage via a short-lived signed URL; never a public URL | — |
| N02.4 | Analysis is asynchronous and non-blocking; the user may leave the screen | H-07 |
| N02.5 | Status is `processing → completed \| failed`, surfaced with retry | H-07 |

### FR-N03 · Text input
| ID | Requirement | Screen |
|----|-------------|--------|
| N03.1 | Parse free text into `{food, quantity, unit}` candidates, one row per food | H-06 |
| N03.2 | Understand counts ("2 eggs"), masses ("200g"), volumes ("250 ml") and vague portions ("a bowl of") | H-06 |
| N03.3 | Ambiguous quantity → default portion + an explicit "estimated" flag | H-08 |
| N03.4 | Unparseable input returns a clear message and keeps the user's text | H-06 |

### FR-N04 · AI correction
| ID | Requirement | Screen |
|----|-------------|--------|
| N04.1 | Every AI candidate is editable: name/food link, quantity, unit and each macro | H-08 |
| N04.2 | Confidence is displayed per item, described as *detection* confidence, not nutritional certainty | H-08 |
| N04.3 | Items below the confidence threshold are visually flagged and cannot be bulk-confirmed silently | H-08 |
| N04.4 | Individual items can be removed, and foods can be added that the AI missed | H-08 |
| N04.5 | Confirming writes `meal_items` with `confirmed = true`; `food_analysis_items` are never mutated | H-08 |
| N04.6 | The original AI result stays viewable after correction | H-02, H-08 |

### FR-N05 · Nutrition totals
| ID | Requirement | Screen |
|----|-------------|--------|
| N05.1 | Meal totals: calories, protein, carbs, fat, fiber | H-02 |
| N05.2 | Day totals: consumed, target, remaining, per-meal distribution | H-01, B-01 |
| N05.3 | Week: daily average, total, adherence to target | H-14 |
| N05.4 | Month: average intake, weight trend, goal progress | H-14 |
| N05.5 | Custom range: all of the above | H-14 |
| N05.6 | Only `confirmed = true` items count (D5); pending items shown separately | H-01, H-02 |
| N05.7 | Foods with null macros contribute nothing and mark the total "incomplete" | H-02, H-14 |
| N05.8 | Day boundaries follow `user_profiles.timezone` | — (data rule) |

### FR-P01 · Body metrics
| ID | Requirement | Screen |
|----|-------------|--------|
| P01.1 | Log weight, body-fat %, waist, chest, arm, thigh and notes at a timestamp | I-02 |
| P01.2 | Choose which measurement fields are visible | I-06, K-04 |
| P01.3 | Weight chart with raw points plus a 7-day moving average | I-03 |
| P01.4 | Multiple entries per day are allowed; the daily value is the **first of the day** `[ASSUMPTION]` | I-01 |
| P01.5 | Edit and delete past entries | I-03, I-04 |
| P01.6 | Optional progress photos in private storage | I-05 |

### FR-P02 · Goals
| ID | Requirement | Screen |
|----|-------------|--------|
| P02.1 | Goal types: fat_loss, muscle_gain, maintenance, strength, custom | J-02 |
| P02.2 | Target value + unit + start date + optional target date | J-02 |
| P02.3 | Status: active / completed / paused; multiple goals may be active | J-01 |
| P02.4 | Goal progress derives from the linked metric (weight, calories, a PR) | J-03 |
| P02.5 | Calorie and macro targets are settable manually or from a TDEE estimate | H-15, A-08 |
| P02.6 | Changing a target never rewrites historical totals or past adherence | — (data rule) |

### FR-C01 · Customization
| ID | Requirement | Screen |
|----|-------------|--------|
| C01.1 | Metric / imperial toggle, display-only | K-03 |
| C01.2 | Custom exercises and aliases | D-03, D-05 |
| C01.3 | Custom muscle mappings | D-04 |
| C01.4 | Custom calorie and macro targets | H-15 |
| C01.5 | Custom meal categories | H-18 |
| C01.6 | Dashboard card visibility and order | B-02 |
| C01.7 | Optional logging fields (RPE, RIR, rest, duration, distance, measurements) | K-04 |
| C01.8 | Configurable reminders | K-06 |
| C01.9 | Progression rules `[P2]` | K-04 |

## 9. Non-functional requirements (BRD §19)

| Area | Requirement | How the front end honours it |
|------|-------------|------------------------------|
| Performance | < 300 ms API latency for common reads/writes | Set commits are optimistic and never await the network; skeletons only for first paint |
| Availability | Core workout logging usable when AI is down | Training and AI share no runtime dependency; AI failures are contained in the nutrition review screens |
| Offline | Mobile supports local logging + sync | In-session state in IndexedDB; a durable write outbox; an explicit Sync Center (L-02) |
| Scalability | AI processing independently scalable and async | Clients never hold an open request for analysis; they poll or subscribe |
| Observability | Monitor API latency, failed writes, AI latency, model and resolution failures | Client emits a defined event taxonomy (§07 traceability) with correlation IDs |
| Data quality | Confidence + correction paths | Confidence is a first-class UI element; nothing AI-derived is silently confirmed |
| Extensibility | New exercise types, nutrition fields, measurements, analytics | Config-driven field rendering; dashboard cards are a registry |
| Accessibility | — `[ASSUMPTION]` WCAG 2.2 AA | Documented in [05-DESIGN-SYSTEM](05-DESIGN-SYSTEM.md) |
| Security | Encryption, private storage, per-user authz, deletion | Signed URLs only; no ID in a URL is trusted client-side |

## 10. Acceptance criteria (BRD §23, made testable)

| # | Criterion | Verified on |
|---|-----------|-------------|
| AC-01 | A user can create a Chest workout with multiple exercises and target sets/reps | C-03 → C-04 → C-06 |
| AC-02 | A user can record every performed set with load and reps | E-03 |
| AC-03 | Completed sessions appear under the correct **user-local** date | F-01, F-07 |
| AC-04 | Starting the same workout again shows previous performance | E-03 |
| AC-05 | The previous chest-focused session is retrievable without knowing its date | F-05 |
| AC-06 | Exercise and session volume are calculated from stored sets | E-08, G-02 |
| AC-07 | A manually logged meal updates daily nutrition totals immediately | H-02 → H-01 → B-01 |
| AC-08 | Text food input produces editable structured candidates | H-06 → H-08 |
| AC-09 | Food-image input produces editable candidates with estimated nutrition | H-09 → H-08 |
| AC-10 | Corrected nutrition becomes confirmed while the original AI result stays available | H-08, H-02 |
| AC-11 | The dashboard reflects current workout, nutrition and body-progress state | B-01 |
| AC-12 | Historical records remain available after plans or targets change | C-04 edit → F-03 unchanged |

Full mapping in [07-TRACEABILITY.md](07-TRACEABILITY.md).

## 11. Release plan

| Milestone | Contents | Exit criterion |
|-----------|----------|----------------|
| M1 — Foundations | Auth, profile, units, timezone, goals (A-*, K-01…K-04, J-*) | A user can sign up and reach an empty dashboard |
| M2 — Training core | Exercise catalog, programs, plan days, live logging (D-*, C-*, E-*) | AC-01, AC-02 |
| M3 — Retrieval | History, filters, previous occurrence, comparison (F-*) | AC-03, AC-04, AC-05, AC-12 |
| M4 — Training analytics | Volume, PRs, e1RM, frequency, adherence (G-*) | AC-06 |
| M5 — Nutrition core | Foods, meals, items, manual logging, totals (H-01…H-05, H-10…H-13) | AC-07 |
| M6 — AI nutrition | Text parsing, image analysis, review & confirm (H-06…H-09) | AC-08, AC-09, AC-10 |
| M7 — Progress & polish | Body metrics, dashboard assembly, customization (I-*, B-*) | AC-11 |
| M8 — Hardening | Offline outbox, sync center, observability, a11y audit | NFR sign-off |

Matches BRD §24's recommended build order.

## 12. Risks

| # | Risk | Impact | Mitigation |
|---|------|--------|------------|
| R1 | AI food estimates are wrong often enough to destroy trust | High | Confidence is always visible; correction is one tap; the review step is mandatory; track edit-rate as a quality signal |
| R2 | Nutrition database licensing cost or coverage gaps (esp. regional/home-cooked food) | High | Normalise any provider into the internal `Food` model behind a resolver interface; allow custom foods; allow AI-proposed macros with no resolved food |
| R3 | Set logging is too slow → users abandon mid-workout | High | Optimistic local writes, prefill, repeat-set, large tap targets, no blocking spinners |
| R4 | Losing an in-progress session | Critical | Draft persisted to IndexedDB on every keystroke-commit; explicit recovery screen (E-10) |
| R5 | Timezone / DST bugs misfile days | Medium | One normative rule (store UTC, bucket by profile timezone); a dedicated test matrix in [06-EDGE-CASES](06-EDGE-CASES.md) |
| R6 | Unit-conversion drift (kg↔lb round-tripping) | Medium | Convert at the display edge only; never write back converted values |
| R7 | Analytics slow as history grows | Medium | Indexed queries + `daily_summaries` materialisation; range caps in the UI |
| R8 | Scope creep from Phase 2 into MVP | Medium | Every `[P2]` surface is either hidden or an explicit "coming soon" with no partial implementation |

## 13. Open questions

| # | Question | Blocks | Default if unanswered |
|---|----------|--------|-----------------------|
| Q1 | Which nutrition database provider? | H-04 coverage, food resolution quality | Build the resolver interface; seed a small internal catalog |
| Q2 | Web-only, mobile-only or both at MVP? | Client strategy | D1: responsive PWA |
| Q3 | Is "max_reps" a PR at any load, or at a fixed load? | G-04, E-11 | Most reps in a single working set, tracked per exercise regardless of load |
| Q4 | Should warm-ups count toward volume? | G-02 | D6: excluded, user-toggleable |
| Q5 | Multiple weigh-ins per day — which is canonical? | I-01, G/analytics | First of the day |
| Q6 | Is there a paid tier? | K-11 | No; K-11 is a stub |
| Q7 | Auto-confirm AI items above a confidence threshold? | H-08 | No — always require explicit confirmation (BRD §12.7) |
