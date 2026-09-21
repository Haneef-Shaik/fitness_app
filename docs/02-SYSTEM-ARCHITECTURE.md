# System Architecture
## Fitness & Nutrition Tracking Platform

Derived from BRD §7 (data-model principles), §16 (API surface), §17 (technical architecture),
§18 (security) and §19 (NFRs).

---

## 1. Architectural drivers

| Driver | Consequence |
|--------|-------------|
| Workout logging must work when AI is down (§19) | AI lives behind a separate service and queue. No training write path touches it. |
| AI processing must be independently scalable and async (§19) | Analysis is a job, not a request. The client never holds a long connection. |
| Detailed relational analytics are central (§10, §11, §22) | PostgreSQL, normalised, with purpose-built indexes and materialised daily summaries. |
| Planned ≠ actual (§7) | `workout_programs/plan_*` and `workout_sessions/session_*/workout_sets` are separate trees. Sessions store their own copy of what happened. |
| Raw AI output ≠ confirmed nutrition (§7, §12) | `food_analyses` / `food_analysis_items` are append-only; `meal_items` hold confirmed truth. |
| Canonical units (§7) | `load_kg`, `height_cm`, `weight_kg`, `*_g_per_100g`. Conversion only at the presentation edge. |
| User timezone decides the day (§7) | Every instant is stored UTC; every day-bucket is computed with `user_profiles.timezone`. |
| Soft delete for reusable config (§7) | `status` enums on exercises, programs; never hard-delete anything history references. |

---

## 2. High-level topology

```
                         ┌──────────────────────────────────────────┐
                         │             CLIENTS                      │
                         │  React Native (Expo) — iOS + Android     │
                         └───────────────┬──────────────────────────┘
                                         │ HTTPS / JSON · JWT
                                         ▼
                         ┌──────────────────────────────────────────┐
                         │        API Gateway / BFF                 │
                         │  authn · authz · rate limit · validation │
                         │  request-id · unit presentation          │
                         └───┬──────────────┬──────────────┬────────┘
                             │              │              │
             ┌───────────────▼───┐ ┌────────▼────────┐ ┌───▼──────────────┐
             │  Training Service │ │Nutrition Service│ │ Profile Service  │
             │ programs · plan   │ │ meals · items   │ │ users · profile  │
             │ days · sessions   │ │ foods · targets  │ │ goals · metrics  │
             │ sets · PRs        │ │                 │ │ prefs            │
             └─────────┬─────────┘ └───┬─────────┬───┘ └───┬──────────────┘
                       │               │         │         │
                       │               │         │ enqueue │
                       │               │         ▼         │
                       │               │  ┌──────────────────────────┐
                       │               │  │  Job Queue (Redis/SQS)   │
                       │               │  └───────────┬──────────────┘
                       │               │              ▼
                       │               │  ┌──────────────────────────┐
                       │               │  │  AI Food Analysis Worker │
                       │               │  │  preprocess → model →    │
                       │               │  │  resolve → compute →     │
                       │               │  │  confidence → persist    │
                       │               │  └─────┬───────────────┬────┘
                       │               │        │               │
                       │               │        ▼               ▼
                       │               │  ┌───────────┐  ┌──────────────┐
                       │               │  │AI Gateway │  │Food Resolver │
                       │               │  │(provider- │  │(nutrition DB │
                       │               │  │ agnostic) │  │  provider)   │
                       │               │  └───────────┘  └──────────────┘
                       │               │
             ┌─────────▼───────────────▼──────────────────────────────┐
             │              PostgreSQL (primary)                      │
             │  training · nutrition · profile · analytics summaries  │
             └────────────────────────────────────────────────────────┘
             ┌────────────────────┐   ┌─────────────────────────────┐
             │  Redis             │   │  Object Storage (S3-compat) │
             │  cache · rate limit│   │  food images · progress pics│
             │  job queue · locks │   │  PRIVATE · signed URLs only │
             └────────────────────┘   └─────────────────────────────┘
             ┌────────────────────────────────────────────────────────┐
             │  Analytics Worker — nightly daily_summaries, PR        │
             │  recomputation, adherence rollups                      │
             └────────────────────────────────────────────────────────┘
```

**Deployment shape at MVP.** A modular monolith deployed as one API process with the module
boundaries above enforced in code (no cross-module table access — modules talk through service
interfaces). The AI worker is a **separate process from day one**, because §19 demands it scale
independently. Splitting Training/Nutrition/Profile into separate deployables later is then a
packaging change, not a redesign.

---

## 3. Stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Mobile client | **React Native (Expo)** + TypeScript — iOS + Android | The primary and only MVP client. See [03-FRONTEND-ARCHITECTURE](03-FRONTEND-ARCHITECTURE.md) |
| Web `[P2]` | Deferred. `packages/domain` is framework-free so a web surface can reuse it | BRD §17 allows either |
| API | **Python 3.13 + FastAPI** (async), Uvicorn | User decision D3a |
| Validation | **Pydantic v2** server-side; generated TS types client-side | See §3.1 |
| ORM / migrations | SQLAlchemy 2.x (async) + Alembic | |
| Package manager | `uv` (Python), `pnpm` (TypeScript) | Both already installed |
| DB | PostgreSQL 16 | BRD §17 recommendation for relational analytics |
| Migrations | Versioned, forward-only, reversible in one step | |
| Cache / queue | Redis | Cache, rate limiting, job queue, distributed locks |
| Object storage | S3-compatible, private bucket | BRD §18 |
| AI gateway | Provider-independent service returning **structured JSON only** | BRD §17 |
| Nutrition data | Licensed provider normalised into internal `Food` | BRD §17; see §7 below |
| Observability | OpenTelemetry traces + structured logs + RED metrics | BRD §19 |

### 3.1 What changed by choosing Python, and what it costs

The original plan put TypeScript on both sides so one Zod schema could validate the request on the
client and the server. That is no longer available. Three consequences, each with its replacement:

| Lost | Replacement | Enforced by |
|------|-------------|-------------|
| One shared validation schema | FastAPI emits **OpenAPI** from Pydantic models; the client generates TypeScript types from it | `openapi-typescript` in CI; a drifted client fails to compile |
| One implementation of the derived metrics | Two — `services/api/domain/` (Python, authoritative) and `packages/domain/` (TypeScript, for the offline logger) | **Shared JSON test vectors** in `contracts/vectors/`; both test suites load the same file |
| Shared enums and constants | Generated from one source (`contracts/`) into both languages | Codegen step, checked in, diffed in CI |

The **test vectors are the important one.** The mobile app computes volume, e1RM and PR candidates
locally so the logger works offline; the server recomputes them authoritatively on finish. If those
two implementations ever disagree, a user sees their session summary change after it syncs. A shared
fixture of inputs and expected outputs, run by both suites, is what makes that impossible to ship.

---

## 4. Domain module boundaries

### 4.1 Training
Owns `exercises`, `muscle_groups`, `exercise_muscles`, `workout_programs`, `workout_plan_days`,
`plan_exercises`, `workout_sessions`, `session_exercises`, `workout_sets`, `personal_records`.

**Invariants**
1. At most one `workout_session` per user with `status = 'in_progress'`.
   Enforced by a partial unique index: `UNIQUE (user_id) WHERE status = 'in_progress'`.
2. `workout_sets.set_index` is dense and 0-based within a `session_exercise`.
3. `session_exercises.order_index` is dense and 0-based within a session.
4. A session may reference `plan_day_id`, but **never reads live plan data for history rendering** —
   what was performed is fully described by `session_exercises` + `workout_sets`.
5. `load_kg` is canonical. The API accepts a display unit and converts on write.
6. Deleting a `session_exercise` cascades to its sets and re-densifies indices in one transaction.

**Derived-metric pipeline.** On `session.status → completed`:
```
compute set volume  → exercise volume → session volume
compute e1RM per working set (epley_v1)
evaluate PR candidates (max_load, max_reps, volume, estimated_1rm) per exercise
upsert personal_records where the new value beats the stored one
invalidate analytics cache keys for (user, date-range, muscle groups touched)
```
Executed **synchronously inside the finish transaction** for MVP (the volume is tiny — one session),
so the summary screen is correct immediately. Long-range rollups stay in the nightly worker.

**Retroactive edits.** Editing or deleting a completed session must recompute PRs. Because a PR can
be *demoted* by a delete, recomputation for the affected `(user_id, exercise_id)` pairs is a full
re-scan of that pair's completed working sets, not an incremental update. Queued, not inline.

### 4.2 Nutrition
Owns `meals`, `meal_items`, `foods`, `food_analyses`, `food_analysis_items`, nutrition targets.

**Invariants**
1. `food_analyses` and `food_analysis_items` are **append-only**. User corrections write to
   `meal_items`; the analysis rows are audit records (BRD §18).
2. Nutrition analytics read **only** `meal_items` with `confirmed = true`.
3. A `meal_item` may exist with `food_id = NULL` — an AI estimate or quick-add that was never
   resolved to a canonical food. Its macros are stored denormalised on the item.
4. Item macros are **snapshotted at confirm time**, not recomputed from `foods` on read. If the
   provider later updates a food's macros, history must not silently change.
   *(This extends BRD §7's "keep enough source metadata to reproduce derived metrics".)*
5. Day bucketing: `date_trunc('day', consumed_at AT TIME ZONE user_profiles.timezone)`.

**`meal_items` needs denormalised nutrition columns.** The BRD's `meal_items` carries quantity and
confidence but no macros, which forces every read to join `foods` and recompute — breaking invariant 4
and making `food_id = NULL` items impossible to value. Recommended addition:

| Added field | Type | Purpose |
|-------------|------|---------|
| `calories` | decimal | Snapshotted at confirm |
| `protein_g` / `carbs_g` / `fat_g` / `fiber_g` | decimal | Snapshotted at confirm |
| `quantity_grams` | decimal, nullable | Normalised mass for aggregation across units |
| `analysis_item_id` | FK, nullable | Provenance back to the raw AI row |
| `user_corrected` | boolean | BRD §13 field, currently only in the AI contract |
| `display_name` | string | Survives an unresolved or later-archived food |

### 4.3 Profile
Owns `users`, `user_profiles`, `fitness_goals`, `body_metrics`, preferences, dashboard layout,
custom meal categories, notification settings.

### 4.4 Analytics (read model)
Read-only over the other modules' tables plus `daily_summaries`.
`daily_summaries` is a **cache, never a source of truth** — every figure must be reproducible from
base tables, and any inconsistency resolves in favour of base tables.

---

## 5. AI food-analysis pipeline (BRD §12)

```
 ① CLIENT                                                       ② API
 ┌──────────────────────┐                        ┌────────────────────────────┐
 │ capture / pick image │  POST /uploads/sign    │ issue signed PUT URL       │
 │ downscale ≤1600px    │ ─────────────────────► │ (short TTL, private key)   │
 │ strip EXIF GPS       │ ◄───────────────────── │                            │
 │ PUT direct to S3     │ ─────────────────────► │ (bypasses the API)         │
 │                      │  POST /food-analysis/  │ create food_analyses       │
 │                      │       image {key}      │ status = processing        │
 │                      │ ◄───────────────────── │ 202 + analysis_id          │
 └──────────┬───────────┘                        └─────────────┬──────────────┘
            │ poll GET /food-analysis/:id  (or SSE)            │ enqueue
            │                                                  ▼
 ┌──────────┴────────────────────────────────────────────────────────────────┐
 │ ③ WORKER                                                                   │
 │  1 preprocess    normalise image / tokenise + normalise text quantities    │
 │  2 model call    AI Gateway → strict JSON schema, temp 0, timeout + retry  │
 │  3 resolve       candidate name → canonical foods (exact → alias → fuzzy)  │
 │  4 compute       macros = food.per_100g × grams ÷ 100  (or serving-based)  │
 │  5 confidence    per item; flag < threshold; flag unresolved               │
 │  6 persist       food_analysis_items (append-only) · status = completed    │
 │     on failure   status = failed + error_code, image retained for retry    │
 └───────────────────────────────────────────────────────────────────────────┘
            │
            ▼
 ┌───────────────────────────────────────────────────────────────────────────┐
 │ ④ USER REVIEW (H-08) — mandatory. Edit name/food/quantity/macros, remove,  │
 │   add missed foods. Confirm → meal_items (confirmed = true, user_corrected)│
 │   Raw analysis rows untouched. Only now does the day total move.           │
 └───────────────────────────────────────────────────────────────────────────┘
```

### 5.1 AI contract (BRD §13)
The gateway must return JSON matching a versioned schema; anything else is a failure, not a partial
success.

```jsonc
{
  "schema_version": "food_analysis.v1",
  "input_type": "image",              // image | text
  "model_name": "<provider/model@version>",
  "items": [
    {
      "detected_name": "Chicken biryani",
      "estimated_quantity": 350,
      "estimated_unit": "g",
      "confidence": 0.82,             // DETECTION confidence, not nutritional certainty
      "proposed_calories": 620,
      "proposed_protein_g": 31,
      "proposed_carbs_g": 70,
      "proposed_fat_g": 23
    }
  ],
  "notes": "optional model commentary, never shown as fact"
}
```
`resolved_food_id` and `user_corrected` are set by the platform (resolver and review step), never by
the model.

### 5.2 Food resolution ladder
1. Exact normalised-name match on `foods`.
2. Alias / synonym table match.
3. User's own custom foods and previously confirmed items (personalisation — a user who logs
   "roti" repeatedly should resolve to *their* roti).
4. Provider search with a similarity threshold.
5. **Unresolved** → keep `food_id = NULL`, carry the model's proposed macros, flag in the UI.

Step 5 is what makes home-cooked and regional food workable, and is the reason `meal_items` must be
able to hold macros without a food.

### 5.3 Failure containment
| Failure | Behaviour |
|---------|-----------|
| AI gateway down / timeout | `status = failed`, `error_code = ai_unavailable`. Meal unaffected. Retry offered. UI falls back to manual entry. |
| Malformed model JSON | One reprompt with the schema; then `failed` with `error_code = ai_invalid_output`. Never partially parsed. |
| Resolver down | Items persist unresolved with model-proposed macros. |
| Image unreadable / no food detected | `completed` with zero items + a reason. The UI says "we couldn't identify food", not an error. |
| Worker crash mid-job | Job is idempotent on `analysis_id`; re-runs overwrite nothing (items written once, in one transaction). |
| **Any AI failure** | Workout logging, meal creation, manual food entry and all analytics remain fully functional. |

### 5.4 Cost and abuse controls
Per-user daily analysis quota, per-minute rate limit, max image size and count enforced server-side,
and a content check before the model call. Quota state is surfaced in the UI before the user takes a
photo, never after.

---

## 6. Data model notes on top of BRD §9

Fields below are **additions/refinements** the BRD schema needs to satisfy its own §7 principles,
§10 metric definitions and §22 queries. Nothing here contradicts the BRD.

| Table | Addition | Why |
|-------|----------|-----|
| `users` | `deleted_at` | §18 account deletion, with soft-delete grace |
| `user_profiles` | `birth_date`, `sex`, `dashboard_layout jsonb`, `logging_field_prefs jsonb` | TDEE inputs (§9 activity_level is alone insufficient); §15 customization |
| `user_profiles` | `daily_calorie_target`, `protein/carbs/fat_g_target` | §15 custom targets; §11 day metrics need a target |
| `fitness_goals` | `metric_key`, `direction` | §P02.4 progress needs to know which metric a custom goal tracks |
| `exercises` | `default_unit`, `tracks_load/reps/duration/distance` (bool) | Cardio and bodyweight exercises must not demand load (W04.8) |
| `exercises` | `aliases text[]` | §15 custom aliases; resolution quality |
| `workout_sessions` | `local_date date` + `logged_timezone` | AC-03 and every §22 date query. **Not a generated column** — `started_at AT TIME ZONE <tz>` is STABLE, not IMMUTABLE, which Postgres rejects. Written by the application; `logged_timezone` makes a recompute on timezone change (T4) auditable |
| `workout_sessions` | `total_volume_kg`, `duration_seconds` | Cheap list rendering without aggregating sets |
| `session_exercises` | `plan_exercise_id` nullable, `target_snapshot jsonb` | Preserves what was *prescribed* at the time (§7 "plan changes never rewrite history") |
| `workout_sets` | `load_unit_entered`, `e1rm_kg`, `formula_version` | §10 "store formula/version"; lets display echo the user's entry unit |
| `workout_sets` | `is_pr boolean` | Renders PR badges in history without recomputation |
| `meals` | `local_date date` | Same reasoning as sessions |
| `meal_items` | macros + `quantity_grams` + `analysis_item_id` + `user_corrected` + `display_name` | See §4.2 |
| `foods` | `aliases text[]`, `verified boolean`, `is_custom`, `owner_user_id` | Resolution ladder + user-created foods |
| `food_analyses` | `meal_id` nullable FK, `error_code`, `completed_at`, `quota_cost` | Links an analysis to the meal it fed; retry + observability |
| `body_metrics` | `custom_measurements jsonb` | §P01.2 configurable measurements without a migration per field |
| `daily_summaries` | `user_id, local_date, calories, protein_g, carbs_g, fat_g, fiber_g, session_count, volume_kg, weight_kg, computed_at` | §9 "optional precomputed aggregate"; §11 week/month reads |
| all tables | `created_at`, `updated_at` | §9 pattern, applied consistently |

### 6.1 Indexes the §22 queries require

```sql
-- "What did I do on date D?" / history list
CREATE INDEX ON workout_sessions (user_id, local_date DESC) WHERE status = 'completed';
-- one open session per user
CREATE UNIQUE INDEX ON workout_sessions (user_id) WHERE status = 'in_progress';
-- "previous chest day" / muscle filters
CREATE INDEX ON session_exercises (session_id, exercise_id);
CREATE INDEX ON exercise_muscles (muscle_group_id, role, exercise_id);
-- "best bench press set this month" / exercise progression
CREATE INDEX ON workout_sets (session_exercise_id, set_index);
CREATE INDEX ON workout_sets (performed_at DESC) WHERE completed;
-- PR board
CREATE INDEX ON personal_records (user_id, exercise_id, record_type);
-- "what did I eat today" / day + range totals
CREATE INDEX ON meals (user_id, local_date DESC);
CREATE INDEX ON meal_items (meal_id) WHERE confirmed;
-- weight trend
CREATE INDEX ON body_metrics (user_id, recorded_at DESC);
-- food search
CREATE INDEX ON foods USING gin (to_tsvector('simple', name));
```

### 6.1b Ordering constraints are deferrable

An ordered list is densified by renumbering: deleting set 0 of three moves 1 into 0
and 2 into 1. Postgres checks a plain `UNIQUE` constraint row by row as the `UPDATE`s
apply, so the renumber collides with a value its neighbour has not vacated yet —
and whether it collides depends on the order the ORM happens to emit the statements
in, which for UUID primary keys is luck. These three are therefore deferred to commit,
where the ordering is dense again (migration `b3c07d41f2a1`, decision D13):

```sql
ALTER TABLE workout_plan_days  ADD CONSTRAINT uq_plan_day_index
  UNIQUE (program_id, day_index)            DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE session_exercises  ADD CONSTRAINT uq_session_exercise_order
  UNIQUE (session_id, order_index)          DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE workout_sets       ADD CONSTRAINT uq_set_index
  UNIQUE (session_exercise_id, set_index)   DEFERRABLE INITIALLY DEFERRED;
```

`uq_set_client_id (session_exercise_id, client_id)` is deliberately **not** deferred.
It is the idempotency guard, and a race on it must surface inside the request handler
as a `409` naming the conflict — not at commit time as an unattributable `500`.

### 6.2 Reference queries for BRD §22

```sql
-- "What did I do during my previous chest day?"
WITH chest AS (
  SELECT em.exercise_id FROM exercise_muscles em
  JOIN muscle_groups mg ON mg.id = em.muscle_group_id
  WHERE mg.name = 'Chest' AND em.role = 'primary'
)
SELECT s.* FROM workout_sessions s
WHERE s.user_id = $1 AND s.status = 'completed'
  AND EXISTS (SELECT 1 FROM session_exercises se
              WHERE se.session_id = s.id AND se.exercise_id IN (SELECT exercise_id FROM chest))
ORDER BY s.completed_at DESC LIMIT 1;

-- "How much volume did I perform for chest this week?" (primary 1.0, secondary 0.5)
SELECT SUM(ws.load_kg * ws.reps * CASE em.role WHEN 'primary' THEN 1.0 ELSE 0.5 END) AS weighted_volume_kg
FROM workout_sets ws
JOIN session_exercises se ON se.id = ws.session_exercise_id
JOIN workout_sessions s   ON s.id = se.session_id
JOIN exercise_muscles em  ON em.exercise_id = se.exercise_id
JOIN muscle_groups mg     ON mg.id = em.muscle_group_id
WHERE s.user_id = $1 AND s.status = 'completed'
  AND s.local_date BETWEEN $2 AND $3
  AND mg.name = 'Chest' AND ws.completed AND ws.set_type <> 'warmup';

-- "How much protein on training vs rest days?"
SELECT (s.session_count > 0) AS training_day, AVG(s.protein_g)
FROM daily_summaries s
WHERE s.user_id = $1 AND s.local_date BETWEEN $2 AND $3
GROUP BY 1;
```

---

## 7. API surface (expanding BRD §16)

Base `/{version}` = `/v1`. All responses use the envelope from the house patterns rule.

```jsonc
{ "success": true,  "data": {...}, "error": null, "meta": { "page": 1, "limit": 50, "total": 812 } }
{ "success": false, "data": null,  "error": { "code": "VALIDATION_FAILED", "message": "…",
                                              "fields": { "reps": "must be ≥ 1" },
                                              "request_id": "req_…" } }
```

| Domain | Endpoints |
|--------|-----------|
| Auth | `POST /auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/password/forgot`, `/auth/password/reset`, `POST /auth/verify-email` |
| Profile | `GET|PATCH /profile`, `GET|PATCH /profile/preferences`, `GET|PATCH /profile/dashboard` |
| Goals | `GET|POST /goals`, `GET|PATCH|DELETE /goals/:id` |
| Exercises | `GET /exercises` (q, muscle, equipment, pattern, include_archived), `POST /exercises`, `GET|PATCH /exercises/:id`, `POST /exercises/:id/archive`, `GET /exercises/:id/history`, `GET /exercises/:id/stats` |
| Muscle groups | `GET /muscle-groups` |
| Programs | `GET|POST /workout-programs`, `GET|PATCH /workout-programs/:id`, `POST /workout-programs/:id/duplicate`, `POST /workout-programs/:id/archive` |
| Plan days | `GET|POST /workout-programs/:id/days`, `PATCH|DELETE /plan-days/:id`, `PUT /plan-days/:id/exercises` (bulk reorder) |
| Sessions | `POST /workout-sessions` (from plan day / template / empty / repeat), `GET /workout-sessions/:id`, `PATCH /workout-sessions/:id`, `POST /workout-sessions/:id/finish`, `POST /workout-sessions/:id/cancel`, `POST /workout-sessions/:id/reopen`, `GET /workout-sessions/active` (`null` when nothing is open, never a 404) |
| Session exercises | `POST /workout-sessions/:id/exercises`, `PATCH|DELETE /session-exercises/:id`, `PUT /workout-sessions/:id/exercises/order` |
| Sets | `POST /session-exercises/:id/sets`, `PATCH|DELETE /workout-sets/:id`, `POST /workout-sessions/:id/sets/batch` (offline outbox flush) |
| Previous perf | `GET /exercises/:id/previous-performance?before=<timestamp>`, `GET /exercises/:id/records` — `before` is an instant, not a session id: the logger asks "what had I done by now", and a session id would need resolving to a time anyway |
| History | `GET /history/workouts?from=&to=&muscle=&exercise=&program=&cursor=`, `GET /history/previous-occurrence?muscle=|exercise=`, `GET /history/compare?session_ids=` |
| Analytics | `GET /analytics/workouts?from=&to=&group_by=`, `GET /analytics/muscle-volume`, `GET /analytics/exercises/:id`, `GET /analytics/personal-records`, `GET /analytics/frequency`, `GET /analytics/adherence` |
| Foods | `GET /foods?q=&source=`, `POST /foods` (custom), `GET|PATCH /foods/:id`, `GET /foods/recent`, `GET /foods/barcode/:code` `[P2]` |
| Meals | `GET /meals?date=`, `POST /meals`, `GET|PATCH|DELETE /meals/:id`, `POST /meals/:id/items`, `PATCH|DELETE /meal-items/:id`, `POST /meals/:id/duplicate`, `POST /meals/copy-day` |
| Recipes | `GET|POST /recipes`, `GET|PATCH|DELETE /recipes/:id`, `POST /recipes/:id/log` |
| Food AI | `POST /uploads/sign`, `POST /food-analysis/image`, `POST /food-analysis/text`, `GET /food-analysis/:id`, `POST /food-analysis/:id/retry`, `POST /food-analysis/:id/confirm` |
| Nutrition analytics | `GET /analytics/nutrition?from=&to=&granularity=` |
| Body | `GET|POST /body-metrics`, `PATCH|DELETE /body-metrics/:id`, `GET /analytics/body?metric=&from=&to=` |
| Dashboard | `GET /dashboard?date=` — one aggregated call for B-01 |
| Sync `[P2]` | `POST /sync/push`, `GET /sync/pull?since=` |
| Account | `GET /account/export`, `POST /account/delete` |

### 7.1 Cross-cutting API rules
- **Idempotency.** Every write accepts `Idempotency-Key`. Mandatory for set creation and outbox
  flush so a retried offline write cannot duplicate a set.
- **Optimistic concurrency.** `PATCH` accepts `If-Match: <version>`; a mismatch returns `409` with
  both versions so the client can run the conflict UI (L-07).
- **Cursor pagination** for all history and diary lists; offset pagination nowhere.
- **Unit presentation.** Requests carry canonical units. The API may echo a `display` block using the
  caller's profile unit system; clients must never round-trip a converted value back as canonical.
- **Every resource is scoped by actor.** Handlers ask the policy layer
  `can(actor, 'read', resource)` — never `resource.user_id === token.sub` inline. This is what makes
  coach accounts (§21) a policy change.
- **Range caps.** Analytics endpoints reject ranges beyond a configured maximum and say so, rather
  than timing out.

---

## 8. Security & privacy (BRD §18)

| Control | Implementation |
|---------|----------------|
| In transit | TLS 1.2+ everywhere, HSTS, no mixed content |
| At rest | DB encryption at rest; bucket SSE; secrets in a manager, never in source |
| Images | Private bucket. **No public URL pattern exists.** Reads use short-TTL signed GETs issued per request after an authz check. Object keys are random UUIDs — never `user_id/date` |
| Authorization | Per-resource policy check on every fitness/nutrition resource; deny by default; no IDOR-able sequential IDs (UUIDs) |
| Auth tokens | Short-lived access JWT + rotating refresh token in an httpOnly, SameSite=Strict cookie; refresh-token reuse detection revokes the family |
| AI auditability | `food_analyses` / `food_analysis_items` retained with confidence and model name; `user_corrected` preserved (§18) |
| Deletion | `POST /account/delete` → soft-delete + grace period → hard purge of rows **and** all object-storage assets. Individual image deletion is immediate. |
| Export | `GET /account/export` produces a complete JSON/CSV archive |
| Estimated vs confirmed | Enforced in the data model (`confirmed`) *and* in the UI (distinct styling + label). Never merged into one number without qualification |
| Rate limiting | Per-user and per-IP, tighter on auth and AI endpoints |
| Input validation | Shared Zod schemas at every boundary; reject unknown fields |
| PII in logs | Never log emails, image contents, raw food text or tokens; log `user_id` + `request_id` only |
| EXIF | GPS and device metadata stripped client-side before upload, and again server-side |

---

## 9. Observability (BRD §19)

**RED per endpoint** (rate, errors, duration) with p50/p95/p99, alerting on p95 > 300 ms for the
common read/write set.

| Signal | Alert condition |
|--------|-----------------|
| Failed writes (5xx on any POST/PATCH) | any sustained rate > 0.5% |
| Set-commit failures specifically | > 0.1% — this is the core loop |
| AI analysis latency p95 | > 20 s |
| AI failure rate (`status = failed`) | > 5% over 15 min |
| Food resolution failure rate (`food_id IS NULL` on confirm) | > 25% over 24 h — signals a data-coverage problem |
| AI item edit rate | tracked as a model-quality metric, alert on a step change |
| Outbox depth / age (client-reported) | p95 age > 5 min |
| Sessions abandoned in `in_progress` > 24 h | trend watch |

Traces carry `request_id` end-to-end, including into the AI worker via the job payload, so one food
photo is one traceable story.

---

## 10. Scaling path

| Stage | Trigger | Move |
|-------|---------|------|
| 0 | MVP | Modular monolith + separate AI worker |
| 1 | AI volume grows | Scale worker pool independently; add a priority queue for interactive analyses |
| 2 | Analytics reads slow | Materialise `daily_summaries` aggressively; add read replicas and route analytics there |
| 3 | Nutrition or training write volume dominates | Extract that module into its own deployable — boundaries already exist |
| 4 | Cross-user/long-range analytics | Warehouse + CDC, as BRD §17 anticipates |

---

## 11. Environments & delivery

`local → preview (per PR) → staging (prod-like data volume) → production`.
Forward-only migrations, expand/contract for column changes, and every deploy reversible without a
schema rollback. Seed data (global exercise catalog, muscle-group tree, starter foods) is versioned
and idempotent so any environment can be rebuilt from scratch.
