# TODO — active work

**Milestone:** M2 · Training core → [tracker](09-PROJECT-TRACKER.md) · [charter](08-PROJECT-CHARTER.md)
**Exit:** [AC-01](07-TRACEABILITY.md#2-acceptance-criteria--verification) build a Chest workout ·
[AC-02](07-TRACEABILITY.md#2-acceptance-criteria--verification) record every performed set

> This file holds **only the work in flight**. Milestone status lives in the tracker — it is not
> repeated here, because a status maintained in two places drifts. When M2 closes, this file is
> replaced with M3's tasks.
>
> A task is done when it meets the [Definition of Done](08-PROJECT-CHARTER.md#4-definition-of-done):
> tests first, tests fail before the code exists, a deliberate mutation makes them fail again,
> and the spec doc is updated in the same change if behaviour changed.

---

## 1 · Data model  ✅ *complete*

- [x] **1.1** Models: `muscle_groups` (self-referencing `parent_id`), `exercises`, `exercise_muscles`
      — `role` enum primary/secondary
      · `exercises` needs `tracks_load/reps/duration/distance`, `default_unit`, `aliases[]`, `status`
- [x] **1.2** Models: `workout_programs`, `workout_plan_days`, `plan_exercises`
      — dense 0-based `order_index`, `scheduled_weekday` nullable
- [x] **1.3** Models: `workout_sessions`, `session_exercises`, `workout_sets`, `personal_records`
      — `session_exercises.target_snapshot jsonb` freezes the prescription at start ([AC-12](07-TRACEABILITY.md))
      · `workout_sets` needs `load_unit_entered`, `e1rm_kg`, `formula_version`, `is_pr`
- [x] **1.4** ~~`local_date` **generated** column~~ → plain column written by the application.
      Postgres refuses a generated column here: `started_at AT TIME ZONE <tz>` is STABLE, not
      IMMUTABLE. Written via `domain.dates.to_local_date`, with `logged_timezone` stored beside
      it so a timezone change (edge case T4) can recompute the affected rows auditably.
- [x] **1.5** Partial unique index — **one `in_progress` session per user**
      `UNIQUE (user_id) WHERE status = 'in_progress'`
- [x] **1.6** Indexes from [02 §6.1](02-SYSTEM-ARCHITECTURE.md) — history, previous-occurrence, PR board
- [x] **1.7** Alembic revision + `alembic check` green + downgrade drops any new ENUMs
- [x] **1.8** Seed: global exercise catalog + muscle-group tree, versioned and idempotent

## 2 · Catalog API  ✅ *complete*

- [x] **2.1** `GET /exercises` — q, muscle, equipment, pattern, include_archived; cursor paginated
- [x] **2.2** `POST /exercises` — custom; **reject without ≥1 primary muscle** (W02.4)
- [x] **2.3** `GET|PATCH /exercises/{id}`, `POST /exercises/{id}/archive`
      — archiving must not break history
- [x] **2.4** `GET /muscle-groups` — hierarchical
- [x] **2.5** Test: a global catalog exercise is read-only; "copy to custom" is the offered path

## 3 · Programs API  ✅ *complete*

- [x] **3.1** `GET|POST /workout-programs`, `GET|PATCH /workout-programs/{id}`
- [x] **3.2** `POST /workout-programs/{id}/duplicate` — **deep copy**, new IDs throughout
- [x] **3.3** `POST /workout-programs/{id}/archive` — and **block delete when referenced**
- [x] **3.4** `GET|POST /workout-programs/{id}/days`, `PATCH|DELETE /plan-days/{id}`
- [x] **3.5** `PUT /plan-days/{id}/exercises` — bulk reorder in **one transaction**, re-densify indices
- [x] **3.6** Test **AC-12**: edit a program, assert a completed session is byte-identical after

## 4 · Session & set API  *(the critical path)*

- [x] **4.1** `POST /workout-sessions` — from plan day / template / repeat / empty / past date
      · snapshots the prescription · **rejects a future date**
- [x] **4.2** `GET /workout-sessions/active`, `GET /workout-sessions/{id}`
- [x] **4.3** `POST /session-exercises/{id}/sets` — **`Idempotency-Key` mandatory**
      a retried offline write must never duplicate a set
- [x] **4.4** `PATCH|DELETE /workout-sets/{id}` — re-densify `set_index` in one transaction
- [x] **4.5** `POST /workout-sessions/{id}/sets/batch` — outbox flush, idempotent per set
- [x] **4.6** `POST /workout-sessions/{id}/finish` — volume, e1RM, PR evaluation **inside the
      finish transaction** so the summary is correct immediately
- [x] **4.7** `POST /workout-sessions/{id}/cancel` — `status = cancelled`, rows retained,
      never appears in history or analytics
- [x] **4.8** `GET /exercises/{id}/previous-performance?before=` — the resolution rule in
      [PRD §7.2](01-PRD.md#72-review-the-previous-chest-day)
- [x] **4.9** Test: starting a second session while one is `in_progress` is refused
- [x] **4.10** Test: server-computed volume/e1RM/PR match `contracts/vectors/domain.json`

## 5 · Mobile — catalog & planning

- [ ] **5.1** D-01 exercise library — search, muscle/equipment filters, virtualised list
- [ ] **5.2** D-02 exercise detail — PRs, e1RM chart, recent sessions, never-performed state
- [ ] **5.3** D-03 create custom exercise — primary-muscle requirement enforced in the UI
- [ ] **5.4** C-02/C-03 programs list + detail
- [ ] **5.5** C-05 plan day editor — reorder, live set-count-per-muscle summary
- [ ] **5.6** C-06 exercise picker sheet — multi-select, "create from query" when empty
- [ ] **5.7** C-07 prescription editor — fields driven by the exercise's tracked fields

## 6 · Mobile — the logger  *(the product)*

- [ ] **6.1** Session draft store (Zustand) + durable persistence — written on **every** committed
      change, not on an interval
- [ ] **6.2** Write outbox — FIFO per aggregate, exponential backoff, terminal 4xx surfaced not dropped
- [ ] **6.3** E-01 start workout — today's plan / repeat / empty / past date
- [ ] **6.4** E-02 session exercise list — set dots, progress, add/swap, finish
- [ ] **6.5** **E-03 set logger** — steppers, repeat-set, previous performance always on screen,
      per-set delta, sync dot. **Commit never awaits the network**
- [ ] **6.6** E-04 rest timer — counts from a target timestamp, survives backgrounding
- [ ] **6.7** E-08 finish summary — computed client-side from the draft so it renders instantly
- [ ] **6.8** E-09 discard — names the exact count of what will be lost
- [ ] **6.9** E-10 session recovery — resume / finish / discard on relaunch
- [ ] **6.10** E-11 PR celebration — **after** the summary, never mid-set

## 7 · Close-out

- [ ] **7.1** E2E: **AC-01** — build a Chest workout with ≥2 exercises and target sets/reps
- [ ] **7.2** E2E: **AC-02** — record every set; `set_index` dense; loads and reps match
- [ ] **7.3** E2E: log a full session **in airplane mode**, kill the app, relaunch, restore
      connectivity, assert the server state matches
- [ ] **7.4** Measure p95 tap→set-rendered *(budget < 100 ms)* on a real device
- [ ] **7.5** Update [tracker](09-PROJECT-TRACKER.md): M2 status, test count, changelog
- [ ] **7.6** Replace this file with M3's tasks

---

## Carried over

- [ ] **DR4** — verify on a physical device via Expo Go; LAN connectivity is untested
- [ ] **D3b** — OpenAPI → TypeScript codegen, worth wiring now the API surface widens
- [x] **Q3** — "max reps" PR is the most reps in a single working set, any load. Recorded as **D11** in the [charter](08-PROJECT-CHARTER.md#6-decision-log) and implemented

## Blocked — needs a decision from the user

- [ ] **Q1** nutrition database provider — blocks M5/M6, and a licensing attribution requirement
- [ ] **Q9** minimum age / legal position — blocks A-07
