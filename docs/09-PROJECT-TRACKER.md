# Project Tracker
## Volt — Fitness & Nutrition Tracking Platform

**Last updated:** 2026-09-23 (G8 closed — AI nutrition) · **Charter:** [08-PROJECT-CHARTER.md](08-PROJECT-CHARTER.md)

> This file records **what is actually true today**, not what is planned.
> A box is only ticked when the thing has been run and verified — see the
> Definition of Done in [charter §4](08-PROJECT-CHARTER.md#4-definition-of-done).

**Status:** 🟢 done · 🟡 in progress · ⚪ not started · 🔴 blocked · ⏸ deferred to Phase 2

---

## Where we are

| | |
|---|---|
| **Milestones complete** | M0, M1, M5, **M6** — **4 of 9** |
| **Tests passing** | **997** — 91 TS domain, 361 Python *(3 skipped)*, **545 client** |
| **API endpoints live** | **89** operations across **67** paths, all with declared response shapes (D17) |
| **App screens built** | **41** of 103 designed |
| **Processes** | API (`uvicorn`) + **analysis worker** (`uv run python -m app.worker`) — separate on purpose (D25) |
| **Screens designed** | 103 specified, 112 rendered *(incl. state variants)* |
| **Running** | Expo app → FastAPI → PostgreSQL, verified end-to-end in a browser |
| **Version control** | git, 37 commits · `fcbba0b` nutrition core (G7) |
| **CI** | GitHub Actions — **5 jobs**: TS domain, Python, API-type drift gate, mobile tests, contract |

```
M0 ████████████ done      specs, design system, 103 screens
M1 ████████████ done      auth · profile · goals · migrations · CI
M2 ████████████ done      training core — AC-01 and AC-02 proven on hardware
M3 ████████████ done      retrieval
M4 ████████████ done      training analytics
M5 ████████████ done      nutrition core
M6 ████████████ done      AI nutrition
M7 ░░░░░░░░░░░░           body & dashboard
M8 ░░░░░░░░░░░░           hardening
```

---

## Milestones

| # | Milestone | Exit criterion | Status |
|---|-----------|----------------|--------|
| M0 | Specs & design system | Every screen specified; design system validated | 🟢 |
| M1 | Foundations | Sign up → onboarding → dashboard, real DB | 🟢 |
| M2 | Training core | [AC-01, AC-02](07-TRACEABILITY.md#2-acceptance-criteria--verification) | 🟡 |
| M3 | Retrieval | AC-03, AC-04, AC-05, AC-12 | ⚪ |
| M4 | Training analytics | AC-06 | ⚪ |
| M5 | Nutrition core | AC-07 | 🟢 |
| M6 | AI nutrition | AC-08, AC-09, AC-10 | 🟢 |
| M7 | Progress & dashboard | AC-11 | ⚪ |
| M8 | Hardening | NFR sign-off | ⚪ |

---

## M0 · Specs & design system 🟢

- [x] BRD extracted and analysed (25 sections, 19 entities)
- [x] [PRD](01-PRD.md) — personas, scope, FRs expanded to testable sub-requirements
- [x] [System architecture](02-SYSTEM-ARCHITECTURE.md) — topology, AI pipeline, schema additions, indexes
- [x] [Frontend architecture](03-FRONTEND-ARCHITECTURE.md)
- [x] [Screen architecture](04-SCREEN-ARCHITECTURE.md) — 103 screens, nav graph, routes
- [x] [Design system](05-DESIGN-SYSTEM.md) — tokens, charts, a11y; accent chosen by CVD sweep
- [x] [Edge cases](06-EDGE-CASES.md) — ~110 cases grouped by cause
- [x] [Traceability](07-TRACEABILITY.md) — requirement → screen → API → test
- [x] [Wireframes](wireframes/) — 10 volumes, every control documented
- [x] [Design file](design/index.html) — 103 screens as running HTML/CSS, 12 domains
- [x] Verified: 0 broken links, 103/103 screens covered

## M1 · Foundations 🟢

**Exit:** a user can sign up, complete onboarding and reach a dashboard backed by a real database.

### Shared domain 🟢
- [x] `contracts/vectors/domain.json` — cross-language contract
- [x] `packages/domain` (TypeScript) — volume, e1RM, PR rules, set validity, units, timezone, nutrition
- [x] `services/api/app/domain` (Python) — same, authoritative
- [x] Both suites run the same vectors — **48 TS + 47 Python**
- [x] Mutation-tested: 3 deliberate breakages each caught by the shared vectors

### API 🟢
- [x] FastAPI app, response envelope, error taxonomy, `request_id` on every response
- [x] Models: `users`, `user_profiles`, `fitness_goals`, `refresh_tokens`
- [x] argon2 hashing · JWT access · rotating refresh with **family revocation**
- [x] `POST /auth/register · /login · /refresh · /logout` · `GET /auth/me`
- [x] `GET|PATCH /profile`
- [x] `GET|POST /goals` · `GET|PATCH /goals/{id}`
- [x] Policy layer `authorize(actor, action, owner_id)` — never an inline ownership check
- [x] CORS for the Expo dev surface
- [x] 18 integration tests against real Postgres

### Mobile 🟢
- [x] Expo + expo-router + Barlow/Barlow Condensed
- [x] Design tokens ported to RN; Card/Button/Field/Meter/Stat/Pill primitives with the depth recipe
- [x] API client — envelope unwrapping, silent 401 refresh, LAN host derivation
- [x] Refresh token in SecureStore (keychain), not AsyncStorage
- [x] A-01 splash · A-02 welcome · A-03 register · A-04 login · A-07 onboarding · B-01 dashboard
- [x] Verified end-to-end in a browser: register → onboarding → dashboard → create goal

### Infrastructure 🟢
- [x] `docker-compose` — dev Postgres + ephemeral tmpfs test Postgres
- [x] `scripts/seed_demo.py` — idempotent demo account
- [x] **Alembic migrations** — async env, URL from `app.config`, never hardcoded
- [x] Migration downgrade drops the Postgres ENUM types *(they survive `DROP TABLE`;
      without this a `downgrade` → `upgrade` fails with "type already exists")*
- [x] Test suite **runs the migrations** rather than `create_all`, so drift cannot hide
- [x] `test_migrations.py` — `alembic check` guard + destructive round trip on its own database
- [x] `git init`, `.gitignore` verified to exclude `.env`, first commit `5b2ada9`
- [x] CI: TypeScript domain, Python domain + migrations + API, cross-language contract check
- [x] `ruff` clean and enforced in CI
- [ ] OpenAPI → TypeScript codegen checked in *(deferred to M2, when the surface grows)*

## M2 · Training core 🟡  ← in progress

**Exit:** AC-01 (build a Chest workout) and AC-02 (record every set).
The whole server half is done and verified against a running instance; the logger
client is what remains.

### Data model 🟢
- [x] Models: `exercises`, `muscle_groups`, `exercise_muscles`, `workout_programs`, `workout_plan_days`, `plan_exercises`
- [x] Models: `workout_sessions`, `session_exercises`, `workout_sets`, `personal_records`
- [x] Partial unique index — one `in_progress` session per user *(proved by test, not by a code path)*
- [x] `local_date` on sessions — **a plain column, not a generated one.** `AT TIME ZONE`
      and the timezone lookup are `STABLE`, not `IMMUTABLE`, which Postgres refuses in a
      generated column. Written through `domain.dates.to_local_date` and stored next to
      `logged_timezone` so a later recompute is auditable. [02 §6](02-SYSTEM-ARCHITECTURE.md)
- [x] Ordering constraints `DEFERRABLE INITIALLY DEFERRED` — densifying an ordered list
      walks rows through values their neighbours still hold *(migration `b3c07d41f2a1`)*
- [x] Seed the global exercise catalog + muscle-group tree — 22 groups, 29 exercises

### API 🟢
- [x] `GET|POST /exercises`, `/muscle-groups`
- [x] `GET|POST|PATCH /workout-programs`, plan days, bulk reorder, duplicate, archive
- [x] `POST /workout-sessions` — plan day / repeat / ad-hoc / empty · backdated · **future refused**
- [x] `GET /workout-sessions/active` *(`null`, not 404)*, `GET /workout-sessions/{id}`, history list
- [x] `POST /session-exercises/{id}/sets` — **`Idempotency-Key` mandatory**
- [x] `PATCH|DELETE /workout-sets/{id}` — re-densify in one transaction
- [x] `POST /workout-sessions/{id}/sets/batch` — outbox flush, idempotent per set
- [x] `/finish`, `/cancel`, `/reopen`
- [x] `GET /exercises/{id}/previous-performance`, `GET /exercises/{id}/records`
- [x] Derived metrics computed **inside** the finish transaction
- [x] PR recomputation is a full re-scan, so a record can be **demoted** by an edit
- [x] Volume record is the best **single session**, not a lifetime total
- [x] 8 mutation checks — each guard proved to fail a named test when removed

### Client ⚪
- [ ] Screens: D-01, D-02, D-03, C-02…C-07, E-01, E-02, **E-03**, E-04, E-08
- [ ] Local-first set commits: Zustand draft + persisted store
- [ ] Write outbox with idempotent replay
- [ ] E-10 session recovery

## M3 · Retrieval ⚪
- [ ] `GET /history/workouts` with filters, cursor pagination
- [ ] `GET /history/previous-occurrence` — the muscle-group resolution rule
- [ ] `GET /history/compare`
- [ ] Screens: F-01…F-07
- [ ] AC-03 timezone test matrix · AC-05 previous chest day
- [x] AC-12 plan edits leave history alone — the plan day is rewritten mid-session and
      the snapshot is asserted unchanged *(`test_sessions.py`, mutation-checked)*

## M4 · Training analytics ⚪
- [ ] `/analytics/workouts`, `/muscle-volume`, `/exercises/{id}`, `/personal-records`, `/frequency`, `/adherence`
- [x] PR recomputation on retroactive edit *(full re-scan — a PR can be demoted)* — landed early with M2's finish transaction
- [ ] Screens: G-01…G-07 with charts

## M5 · Nutrition core 🟢
- [x] Models: `foods`, `meals`, `meal_items` **with denormalised macro columns** ([02 §4.2](02-SYSTEM-ARCHITECTURE.md)),
      plus `meal_categories` (H-16) and `recipes` / `recipe_items` (H-11). Migration `2fb1377688cf`,
      round-tripped upgrade → downgrade → re-upgrade, `alembic check` clean
- [x] Nutrition provider **worked around, not decided** 🟡 *(Q1 still open — see [charter §9](08-PROJECT-CHARTER.md))*.
      `FoodResolver` Protocol + `InternalCatalogResolver` over 22 seeded foods + a test double
- [x] `/foods`, `/meals`, `/meal-items`, `/recipes` — and `/meal-categories`, `/nutrition/day`,
      `/meals/{id}/copy`, `/nutrition/day/copy`
- [x] Screens: H-01…H-05, H-10…H-13, H-15, H-16
- [ ] H-14 nutrition analytics — **not in G7's scope**; needs `daily_summaries` (G9)
- [ ] H-17 barcode scanner — P2, and blocked on Q1

## M6 · AI nutrition 🟢
- [x] `food_analyses` / `food_analysis_items`, append-only — **enforced by two database
      triggers** (migration `m6`), round-tripped before it shipped
- [x] Job queue + worker, independently scalable — Postgres `FOR UPDATE SKIP LOCKED`,
      `uv run python -m app.worker` (D25). Several workers are safe; a dead worker's job
      is reclaimed after a lock timeout
- [x] AI gateway with strict JSON schema (D23, D24); food resolution ladder in
      `app/food/ladder.py` with step 5 = **give up**, because a wrong match is worse
      than no match
- [x] Signed upload URLs (D26); **EXIF stripped client and server side**, asserted
      server-side on bytes that genuinely carried GPS coordinates
- [x] Screens: H-06…H-09, H-18
- [x] AC-10 — corrected values confirmed, raw analysis **byte-identical**

## M7 · Progress & dashboard ⚪
- [ ] `body_metrics`, `/analytics/body`, `daily_summaries`
- [ ] `GET /dashboard` — one aggregated call
- [ ] Screens: I-01…I-06, J-01…J-04, B-02…B-05

## M8 · Hardening ⚪
- [ ] Offline outbox end-to-end, L-02 sync centre, L-07 conflict
- [ ] Observability: RED metrics, the alert table in [02 §9](02-SYSTEM-ARCHITECTURE.md)
- [ ] Accessibility audit — keyboard-only logging, screen-reader diary
- [ ] Performance budgets measured on a mid-tier Android
- [ ] Account export and deletion end-to-end

---

## Immediate queue

Granular, ordered breakdown of the current milestone: **[TODO.md](TODO.md)**
Sequencing and handoffs from here to release: **[10-EXECUTION-GOALS.md](10-EXECUTION-GOALS.md)**

| Order | Task | Why now | Blocks |
|-------|------|---------|--------|
| 1 | **G9 — body, goals, dashboard** | The last acceptance criterion. Also carries the **profile screen G7 found missing** — nothing in the app sets `birth_date`, `sex` or `height_cm`, which H-15's calculator needs — and `daily_summaries`, which H-14 has been waiting on | AC-11 |
| 2 | **G10 — hardening** | Observability, accessibility, the performance budget D16 measured and missed, and account export/delete | NFR sign-off |

*Cleared 21 Sep: Alembic migrations (DR1), git init, CI (DR3).*
*Cleared 22 Sep: **G0** — `docs/03` re-platformed for React Native; D14–D16 recorded.*
*Cleared 22 Sep: **G1** — generated types (D3b closed), query layer, `DataBoundary`, test harness; D17–D18 recorded.*
*Cleared 22 Sep: **G2** — 8 catalog and planning screens, the two missing endpoints, m4 migration. **AC-01 reachable**.*
*Cleared 22 Sep: **G3** — draft store, outbox, 8 logger screens, 4 mutation endpoints. **AC-02 and AC-04 reachable**, pending device proof.*
*Cleared 23 Sep: **G4** — E2E on a physical phone; **DR4 closed**; p95 measured and missed.*
*Cleared 23 Sep: **G5** — history, comparison, cursor pagination. **AC-03 and AC-05**.*
*Cleared 23 Sep: **G6** — six analytics endpoints and a chart kit. **AC-06**.*
*Cleared 23 Sep: **G7** — nutrition core: foods, meals, the diary, categories, recipes, copying, targets. **AC-07**. Q1 worked around, not answered.*
*Cleared 23 Sep: **G8** — AI nutrition: append-only analyses, a Postgres-queued worker, a contained gateway, signed uploads. **AC-08, AC-09, AC-10** — 11 of 12.*

## Blocked

| Item | Blocked by | Owner |
|------|-----------|-------|
| Food coverage, H-17 barcode | Q1 nutrition provider undecided — **narrowed twice**: M5 shipped without it on a 22-food internal catalog, and M6's AI path resolves through the same interface. What is still blocked is coverage: an AI estimate can only match what the catalog contains, and everything else stays unresolved with the model's own macros | User |
| Device verification | No Xcode locally — needs Expo Go on a real phone. The runner is now chosen (**Maestro**, D15) but not installed | User |
| Age policy on A-07 | Q9 legal position | User |

## Quality snapshot

| Metric | Now | Target |
|--------|-----|--------|
| Tests passing | **997** — 545 client, 361 API (+3 skipped), 91 domain | grows with each milestone |
| Domain coverage | 100% of specified formulas | 100% |
| API integration tests | **361** | every endpoint, happy + failure |
| Migration guards | **3** — drift check, destructive round trip, and a test asserting the append-only triggers are still **in a migration** (without it, deleting them would leave a green suite and a promise nothing keeps) | kept green |
| Migrations | **6** — M1 foundations, M2 training core, M3 deferrable ordering, M4 plan time/distance targets, M5 nutrition, **M6 AI analyses** (append-only, with two triggers and the FK M5 deferred) | kept reversible — M5 and M6 each round-tripped upgrade → downgrade → re-upgrade before they shipped |
| Mutation checks | **79** verified catches — **G8 added 22**: the correction detector in both directions, the schema-version gate, the low-confidence threshold, the missing error code, confirm idempotency, the quota, server-side EXIF stripping, signature verification and expiry, the resolver bypass, a worker that writes meal items itself, the append-only trigger, **each of the eight immutability clauses one at a time**, the three code-level guards, and five on the review screen. G7's 38 and the earlier 19 stand behind them. **One mutation survived and exposed a real hole**: the immutability test named a single column, and a "freeze it once it is set" rule would have let commentary be invented for an analysis that had none. The rule and the test were both changed | every guard and shared-vector change |
| Lint | `ruff` clean, enforced in CI | stays clean |
| Coverage gate | **enforced**, and **ratcheted in G8** to **62/56/57/63** (from G7's 59/54/55/60). Careful reading the table: naming a path in `coverageThreshold` **removes it from `global`**, so the printed **66.03%** includes `src/lib/query` and `DataBoundary` (held at 90%+) while the `global` bucket is the remainder — measured **62.15%** statements / **63.35%** lines | 80% global (D18) — **not met, and now deliberately tracked** rather than aspirational |
| Acceptance criteria passing | **11 of 12** — AC-01, AC-02, AC-04 (device + API, 22 Sep), AC-03, AC-05, AC-06, AC-07, **AC-08, AC-09, AC-10** (23 Sep) and AC-12. **AC-07 to AC-10 are proven by API and client tests, not on hardware** — `scripts/e2e.sh` still covers AC-01/02/04/05 only. AC-11 is G9 | 12 of 12 |
| tap → set rendered | **p95 396.4 ms** over 99 commits, **118.7 ms** over 9 — Samsung SM-E546B, Android 16, `__DEV__` build. [Full write-up](measurements/commit-p95.md) | p95 < 100 ms (D16) — **MISSED at every list length measured** |

## Changelog

| Date | Change |
|------|--------|
| 21 Sep | M0 complete — specs, design system, 103 screens |
| 21 Sep | Accent changed lime → **Iris** after CVD measurement showed ΔE 0.3 against series green |
| 21 Sep | Platform changed to **React Native (Expo)**; API to **Python FastAPI**; docs corrected before code |
| 21 Sep | Shared cross-language test vectors established and mutation-verified |
| 21 Sep | M2 server side complete — catalog, plan tree, sessions, sets, records |
| 21 Sep | **AC-12 proved by test**: the plan day is rewritten mid-session and the snapshot holds |
| 21 Sep | Ordering constraints made deferrable after a densify collided — it had been passing on luck |
| 21 Sep | M1 API + mobile complete; verified register → onboarding → dashboard → goal |
| 21 Sep | Fixed: refresh-token family revocation was discarded by session rollback |
| 21 Sep | Fixed: React 19/18 mismatch, ESM `query-string`, Metro `.js` resolution, missing CORS |
| 21 Sep | **M1 closed** — Alembic migrations, git init, CI. DR1 and DR3 resolved |
| 21 Sep | Fixed: migration downgrade left Postgres ENUM types behind, breaking re-upgrade |
| 21 Sep | Test suite now runs migrations instead of `create_all` — drift cannot hide |
| 22 Sep | **G0 closed** — `docs/03` re-platformed for React Native; persistence (**D14** `expo-sqlite`), E2E runner (**D15** Maestro) and the device performance budget (**D16**) recorded |
| 22 Sep | **G1 closed** — `packages/api-types` generated and drift-gated (**D3b closed**), query layer with the §6.2 invalidation map as code, `DataBoundary`, and a client test harness: **0 → 69 tests** |
| 22 Sep | API responses were absent from OpenAPI entirely — every route returned a bare `JSONResponse`. All 42 routes now declare `Envelope[T]` (**D17**); schemas 19 → 67 |
| 22 Sep | **G2 closed** — 8 screens (D-01…D-03, C-02/C-03, C-05, C-06, C-07), `/exercises/{id}/history` and `/stats` built, **AC-01 reachable**. Client tests 69 → 125 |
| 22 Sep | **m4**: plan exercises can prescribe duration and distance — a plank and a run had nothing to prescribe, which would have surfaced as a logger bug in G3 |
| 22 Sep | `@shopify/flash-list` tried and removed: it crashed the web build. `VirtualList` is the seam; FlashList can return in G4 when a device exists to verify it on |
| 22 Sep | **G3 closed** — the logger. Draft store with pure reducers, write outbox, 8 E-screens, 4 mutation endpoints. Client tests 125 → 251 |
| 22 Sep | **`expo-sqlite` has no web build** (`platforms: [apple, android]`). D14 stands for the shipping platforms but is **unproven on hardware**; `src/lib/db` is now an interface with a SQLite and an in-memory implementation |
| 22 Sep | Fixed before it shipped: a **refresh stampede** — concurrent 401s each refreshed with the same token, and reuse detection revoked the family, signing the user out mid-workout. Refresh is now single-flight (**D20** covers the related UUID bug) |
| 22 Sep | Zustand replaced by ~50 lines over `useSyncExternalStore` (**D19**): v5 and v4 both crashed with React `null` inside the library, as FlashList did in G2 |
| 22 Sep | **G4 in progress, blocked on hardware.** AC-04's previous-performance strip built (G3 never had it), Maestro 2.10.0 installed with 4 flows, latency harness added. Client tests 251 → 297 |
| 22 Sep | `forceExit` **removed** from the Jest config — carried since G1, and dropping Zustand in G3 took the cause with it. Verified over three clean runs |
| 22 Sep | Two more bugs closed by covering the untested layer: the sync-dot reconciliation, and `session.tsx` leaving an email on screen after a failed profile fetch |
| 23 Sep | **G8 — AI nutrition.** `food_analyses` / `food_analysis_items` **append-only at the database level**, a Postgres `SKIP LOCKED` queue with the worker in its own process, an `AIGateway` Protocol (stub by default, Anthropic behind a key), signed uploads with EXIF stripped twice, and screens **H-06…H-09, H-18**. **AC-08, AC-09 and AC-10 proven — 11 of 12**. API tests 293 → 361, client 502 → 545. Migration `m6` |
| 23 Sep | **G7 — nutrition core.** `foods`, `meals`, `meal_items`, `meal_categories`, `recipes`, migration `2fb1377688cf`. Endpoints `/foods`, `/meals`, `/meal-items`, `/recipes`, `/meal-categories`, `/nutrition/day` and the two copy routes. Screens **H-01…H-05, H-10…H-13, H-15, H-16**. **AC-07 proven — 8 of 12**. API tests 241 → 293, client 414 → 502, domain 59 → 91. Q1 **not** answered; the resolver made it optional |
| 23 Sep | **G6 — analytics.** Six `/analytics/*` endpoints, a chart kit (**H6.1**) and screens **G-01…G-07**. **AC-06 proven** — **7 of 12**. API tests 209 → 241, client 370 → 414 |
| 23 Sep | **AC-06 is an agreement, and it has a test that breaks when the agreement does.** One session read on the finish summary, in session detail and in analytics, asserted identical. Mutation-checked by summing volume in the route instead of deferring to `app.domain.training`: AC-06 fails, which is exactly what it is for |
| 23 Sep | **Adherence had a definition but no implementation.** PRD W07.7 (`completed planned ÷ planned`) is now in `app/domain/adherence.py` **and** `packages/domain/.../adherence.ts`, pinned by new shared vectors — two implementations are allowed, a third in SQL is not. It carries two judgements the ratio does not: **no plan is undefined, never 0**, and **more than planned is 1.0, not 1.25** |
| 23 Sep | Writing those vectors caught my own arithmetic: a "Saturday is outside the range" case ended on 2026-09-26, which **is** a Saturday. The vector was wrong, not the code |
| 23 Sep | **The muscle tree is now one module walked both ways.** G5's CTE answers "everything below this group" for a filter; `MuscleTree.ancestors` answers "which groups receive this volume". Same `parent_id` edges, opposite directions, same file so they cannot drift. Mutation: stopping at the first parent fails the grandchild test |
| 23 Sep | **No index was added for analytics, and that is evidenced.** `EXPLAIN` shows the session scan using `ix_sessions_user_local_date` with the range as an index condition; two tests assert the plan and forbid a `Seq Scan`, so widening the filter to `started_at` later fails the build rather than quietly scanning |
| 23 Sep | `react-native-svg@15.8.0` added for the one chart type that needs a polyline — checked against `bundledNativeModules.json` first, the same way D14 checked `expo-sqlite`, so it ships inside Expo Go and DR4 is unaffected |
| 23 Sep | Two classes named `E1rmPointOut` made the generated client fall back to `app__schemas__analytics__E1rmPointOut` and broke an existing alias. The drift gate caught it immediately; renamed to `ProgressionPointOut` |
| 23 Sep | **G5 — retrieval.** `GET /history/workouts` (keyset pagination), `/history/previous-occurrence` (**AC-05**) and `/history/compare`, plus screens **F-01…F-07**. **AC-03** and **AC-05** proven — **6 of 12**. API tests 164 → 209, client 326 → 370 |
| 23 Sep | **"Or a descendant" is recursive, and the seeded tree is two levels deep** — so a one-level join passes every fixture and is still wrong. `muscle_subtree_ids` is a recursive CTE written **once** and shared by AC-05's resolution and F-02's filter, because two tree walks drift into "history and analytics disagree about what a chest day is" (which is how AC-06 fails later). Tested against a **grandchild** built for the purpose |
| 23 Sep | **Widening is a second query, not a looser first one.** `role IN ('primary','secondary')` in one pass returns a NEWER secondary match over an older primary one, which is the opposite of the rule. Caught by a mutation — and the mutation first exposed that the test guarding it was **vacuous**: it compared a session id against an *exercise* id, which is never equal, so it passed against a deliberately broken rule |
| 23 Sep | **AC-03's vectors include instants in the future**, and the API correctly refuses a future-dated session. The session-level matrix runs the loggable ones (still five zones) and covers DST fall-back with its own past-dated case, rather than relaxing the API or inventing a second set of timezone cases |
| 23 Sep | Two gaps the client had: `api.get` unwraps to `data` and **discards `meta`**, so a cursor could not reach the app at all — `getPaged` keeps the envelope; and `PagedEnvelope`'s generic `Meta` has no cursor fields, so the paged response was **documented as un-pageable**. `CursorEnvelope`/`CursorMeta` are declared, which is the same gap D17 closed for bodies |
| 23 Sep | Coverage ratchet **54/50/50/55**, up from G4's 51/47/48/52 — seven screens and their tests, so the floor rose with the ceiling |
| 23 Sep | **D16's budget is missed, and now known.** tap → set rendered measured on the device: **p95 396.4 ms** over 99 commits on one exercise, and **118.7 ms** over 9 — against a 100 ms budget. Two costs, separated by running both lengths: a **baseline near 110 ms** present from the first sets, and **growth with list length** on top (p95 118.7 → 184.8 → 396.4 ms at 10, 33 and 100 rows) because every commit re-renders the whole list. Had only the 100-sample run been taken, list growth would have looked like the whole story. It is a `__DEV__` build and a release one can only be faster — by an unmeasured amount, so the number stands as taken. **D16 is unchanged; this is an open item, not a rewritten target** |
| 22 Sep | **G4 — the critical path driven on a physical phone** (Samsung SM-E546B, Android 16) through Expo Go over the LAN. **AC-01, AC-02 and AC-04 proven**, each by a Maestro flow **and** a query against the API. **DR4 resolved**; `defaultBase()`'s `hostUri` derivation confirmed executing after Metro was found running with `EXPO_PUBLIC_API_URL` set, which returns early — the branch DR4 is about had still never run |
| 22 Sep | **The outbox stranded sets, silently.** AC-02 was green on the phone showing three sets while the server held **two**. Two causes: `flush()` handed a concurrent caller the already-running promise, whose work list was read before the new entry existed; and the logger flushed straight after `commitSet`, before the fire-and-forget write had put the entry in SQLite. Sync lag went 3 s / 24 s / **25 min** → 21 ms / 12 ms / 13 ms. The existing concurrency test seeded all its work *before* flushing, so it could never have caught it |
| 22 Sep | **Nothing re-armed the outbox when the network returned.** Its three triggers — screen mount, app foreground, set committed — are all things the *user* does, and nobody taps anything while resting between sets. Measured: API restored, 90 s later still two grey dots and one set on the server. A root-level pump now ticks every 15 s; the outbox's own `readyEntries` still decides what is due |
| 22 Sep | **Losing the network deleted the account.** `performRefresh` cleared the stored refresh token on *any* failure, and `fetch` rejects with a plain `TypeError` when there is no signal — so opening the app in a basement gym signed the user out of a workout in progress and locked them out until reception returned. Only a 401/403 clears it now. Session restore reads the token's survival to tell **O9** (revoked → login) from **O10** (offline → full logging) |
| 22 Sep | **Signing out left you on the dashboard.** The redirect lived only in `app/index.tsx`, which renders at `/`, so from any other screen the status change was invisible — avatar went blank and the next query 401'd into a generic error. `AuthGate` watches status rather than route, which is also the honest answer to a refresh failing mid-workout |
| 22 Sep | Two UI defects only a phone showed: the set-count stepper opened at `min + step`, so four taps read **5**; and the prescription sheet's body was a fixed-height view, so with the keyboard up the footer was drawn across the load field and "Rest between sets" could not be reached at all |
| 22 Sep | **The fixture was the flake.** `seed_demo.py` cancelled a leftover open session only on a brand-new account — the cancel sat below an early return. E-01 shows only "You're mid-workout" while a session is open, so every flow reaching for a plan day failed on a selector, reading like a broken app. Its docstring also claimed "wipes and recreates", which it never did |
| 22 Sep | **`setAirplaneMode` does not take this device offline** — Wi-Fi stays enabled, and three "offline" sets reached the server in ~20 ms. Worse, **offline plus relaunch is not expressible in Expo Go at all**, because the bundle reloads from Metro over the same LAN. The offline scenario now takes the **API** away while Metro stays up, which isolates exactly what is under test and leaves the radio alone |
| 22 Sep | Follow-up sweep: `docs/02` and `wireframes/01` specified a **cookie** refresh token, contradicting **D10** and the code; `docs/07` answered Q2 with a **PWA**, contradicting **D1**; `docs/05` and six wireframes wrote accessibility in **ARIA/CSS**. All corrected; the gate grew three checks |


---

### Handoff — G0 · Client spec re-platformed            closed 22 Sep · `2aadfa0`

**Outcome claimed.** Anyone opening `docs/03` reads the platform that is actually in `apps/mobile`,
and the logger's durability layer has a named implementation that is verified to exist in the SDK
this app has installed.

**Inherited and used.** None — first goal.

**Produced.**

| ID | Artefact | Claim | Evidence |
|----|----------|-------|----------|
| H0.1 | `docs/03` §2–§4, §9, §11 | Every package named in §2 is installable in this app | `grep -rnoE "Next\.js\|Tailwind\|shadcn\|Dexie\|IndexedDB\|Playwright\|Server Component\|LCP\|gzip" docs/03-FRONTEND-ARCHITECTURE.md` → **19 occurrences before, 0 after**. Every Expo-family row checked against `node_modules/expo/bundledNativeModules.json` (SDK 52.0.49, 114 modules) **and** Expo's SDK-52 native-module API; every other row resolved with `npm view <pkg> version` |
| H0.2 | `docs/03` §5.3 + **D14** | Draft and outbox have a schema and a real database | `expo-sqlite ~15.1.4` pinned by the installed SDK and present in Expo Go; `expo-sqlite@15.1.4` exposes `withTransactionAsync` / `withExclusiveTransactionAsync`, which is the atomic dequeue the outbox needs. `react-native-mmkv` confirmed **absent** from the Expo Go set, which is what rules it out |
| H0.3 | **D15** | The E2E runner needs no local native toolchain | `xcodebuild -version` → *"requires Xcode"*, Command Line Tools only ⇒ no iOS build is producible here, which eliminates Detox. Maestro drives Expo Go over the LAN. Not yet installed — **G4** does that |
| H0.4 | **D16** | The budget is measurable on a device | tap → set rendered p95 **< 100 ms**; cold start → dashboard interactive **< 2.5 s** mid-tier Android; JS bundle **tracked, not capped** (`npx expo export`) |

**Verified.**

```
bash scripts/check-client-spec.sh    # exit 0 — all five checks pass
#   rejected web stack in docs/03 ....... 19 before  ->  0 after
#   browser database in any spec doc .... 16 before  ->  0 after
#   D14/D15/D16 recorded in the charter . 4
#
# Counted against HEAD e514838 with `git archive`. Across ALL of docs/ the browser
# database appeared 31 times; 15 of those are in the three exempt files, which quote
# it deliberately. The entry gate's `grep -rn | wc -l` reported 30 because it counts
# matching LINES; one line carries two occurrences.
#
# Mutation check: appending the rejected database to docs/03 makes the script exit 1
# on two separate checks; removing that line makes it exit 0 again. The gate has been
# seen to fail, so it is a gate and not a decoration.

node -e "<bundledNativeModules.json>"  -> expo-sqlite ~15.1.4 (SDK 52.0.49, 114 modules)
curl https://api.expo.dev/v2/sdks/52.0.0/native-modules -> expo-sqlite present; react-native-mmkv absent
npm view expo-sqlite@~15.1.4 version   -> 15.1.4 ; its .d.ts exports withTransactionAsync
xcodebuild -version                    -> "requires Xcode" (Command Line Tools only)
```

**Decisions recorded.** D14 (`expo-sqlite`), D15 (Maestro), D16 (device performance budget).

**Left undone, and why — this is what G1 inherits as debt.**
- **Nothing is installed.** `expo-sqlite`, TanStack Query, Zustand, the test harness and Maestro are
  all *specified and verified available*, not added to `apps/mobile/package.json`. G0 was a
  documentation goal; G1 and G4 install them. "Verified available" is weaker than "installs cleanly
  alongside the existing tree" — G1's inherit table already says to treat an install failure as a G0
  defect.
- **The charts row is deliberately unfinished.** `victory-native@42` is ruled out here (it peers
  Skia `>=2.6.0`; Expo Go SDK 52 ships **1.5.0**), and `41.26.0` fits — but the kit choice is
  **G6**'s (H6.1), so §2 names the substrate and the constraint, not the winner.
- **WAL is not verified.** §5.3 does not claim it. `expo-sqlite` can issue any `PRAGMA`, but
  `journal_mode = WAL` was not run on a device — **G3** sets it and **G4** confirms it.
- **Hermes `Intl` is not verified.** `docs/03` §2 names `date-fns-tz`, which needs
  `Intl.DateTimeFormat` with a `timeZone`. That is a Hermes build option and it was **not run on a
  device**, so §2 says so in the same row rather than asserting it. **I7** — the day is the
  profile's day — depends on it, so **G1** must assert one DST case in the harness before the
  logger is written against it.

**Scope extended after the first pass.** A sweep for the *class* of defect, rather than the six
sites the goal named, found four more — two of them contradictions of decisions already recorded,
which is worse than a stale stack name because the next implementer has no way to know which
document is lying:

| Where | Said | Reality |
|-------|------|---------|
| `docs/02` §8 security · `wireframes/01` cross-cutting | Refresh token in an **httpOnly, SameSite=Strict cookie** | **Contradicts D10 and the code.** `services/api` sets no cookie anywhere: `POST /auth/refresh` takes `RefreshIn` from the request **body**, and `apps/mobile/src/lib/storage.ts` stores it in the keychain via `expo-secure-store` |
| `docs/07` §Q2 | Client strategy = "**Responsive PWA (D1)**" | **Contradicts D1**, which chose React Native and deferred web. The answer cited the very decision that overturned it |
| `docs/05` §a11y · 6 wireframe files | `aria-label`, `aria-live`, `role="meter"`, `outline: none`, `prefers-reduced-motion`, Tab/Enter/Esc as the logger's operation model | None exist in React Native. The accessibility floor is **non-negotiable per charter §8**, so a spec written in DOM attributes makes the one undroppable requirement unbuildable |
| `wireframes/04` E-04 | Rest timer survives "**browser tab throttling**" | The real case is the **app being backgrounded or suspended**; the timestamp basis is what makes it correct either way |

All are fixed, translated to the React Native APIs **verified present in RN 0.76.9**:
`accessibilityLabel` · `accessibilityHint` · `accessibilityRole` (incl. `list`, `progressbar`,
`combobox`, `radiogroup`, `header`) · `accessibilityState` · `accessibilityValue` ·
`accessibilityLiveRegion` · `AccessibilityInfo.announceForAccessibility` / `isReduceMotionEnabled`.

The gate grew three checks to match — DOM-only a11y identifiers, cookie-based auth, and `PWA` as a
client strategy. **Each was seen to fail on its own probe and only its own**, then pass again.

**Traps hit.**
- **The gate failed on the rewrite's own prose.** The first pass explained *why* Tailwind, shadcn and
  Playwright are gone — and named them, so the `grep` still returned 5 hits. The rejected platform
  belongs in the charter's rationale (**I15**), not in the spec; `docs/03` now says what we use and
  the decision log says what we rejected.
- **The gate as written could never pass.** It requires that the browser database appear nowhere in
  `docs/`, but five documents quote the rejected platform *on purpose* — `10-EXECUTION-GOALS.md`
  §4.2 is the finding that created G0, `prompts/G0.md` and `G1.md` carry it into a fresh session,
  and this handoff record has to cite its own evidence. Deleting the words would delete the record.
  The gate now lives once, in `scripts/check-client-spec.sh`, with those paths exempted and the
  reason written in the file rather than rediscovered by the next person.
- **DR4's premise was half-stale.** It says "no Xcode/Android SDK locally". No Xcode is right; an
  Android SDK *is* installed (build-tools 35/36, platform android-36, NDK 27) but unconfigured with
  no device attached. Recorded in D15 and corrected in DR4 rather than left to mislead G4.
- **The goal's scope list was not the extent of the defect.** It named `01-PRD` and three
  `06-EDGE-CASES` rows. The browser assumption had actually reached **nine** files, including
  `docs/02`, `docs/05`, `docs/07` and six wireframes. Fixing the named sites and stopping would have
  left G3 and G4 building against specs that contradict D1 and D10.

**Backlog raised, not fixed.**
- The Android SDK is installed but unconfigured — decide in G4 whether to wire it up or stay on
  Expo Go only.
- `apps/mobile` still ships `react-native-web`; harmless, but web is deferred (D1) and it should be
  a deliberate keep, not an accident.

---

### Handoff — G1 · Client spine            closed 22 Sep · `f34b8b5`

**Outcome claimed.** Every screen goal after this writes feature code only — no fetch wrapper, no
hand-typed response shape, no per-screen loading state, no untested shared component.

**Inherited and used.**

| ID | Held? | Note |
|----|-------|------|
| H0.1 | ✅ | Every package `docs/03` §2 named installed cleanly. The SDK-52 pins G0 recorded (`jest-expo@52.0.6`, RTL `13.3.3`) were correct and saved the version trap |
| H0.3 | ✅ | D15 read before choosing tooling; no second E2E runner introduced |

**Produced.**

| ID | Artefact | Claim | Evidence |
|----|----------|-------|----------|
| H1.1 | `packages/api-types` | Client and server cannot silently disagree | Deleted `ProfileOut.week_starts_on`; `week_starts_on: number` vanished from the generated types and the gate exited 1. Restored, green. 67 schema types, 23 response payloads |
| H1.2 | `queryKeys.ts` + `invalidation.ts` | One key and one documented invalidator per read | Tests assert code ↔ docs/03 §6.2 match **both ways**. Mutations caught: program→sessions fails the AC-12 test; `refetch: true` on a set fails the I10 test; a drifted doc citation fails both agreement tests |
| H1.3 | `DataBoundary` | No screen re-implements the five states | 17 tests, 100% statements. Collapsing filtered-empty into empty fails 3 named tests; swapping error/loading precedence fails 1 |
| H1.4 | `jest-expo` harness + ratchet | Untested shared code fails CI | `pnpm --filter @volt/mobile test:ci` → 69 tests, gate enforced. Two CI jobs added (types, mobile) |

**Verified.**

```
pnpm --filter @volt/domain test      ->  48 passed
uv run pytest -q (services/api)      -> 133 passed, 3 skipped   (unchanged by D17)
pnpm --filter @volt/mobile test:ci   ->  69 passed, gate exit 0
pnpm --filter @volt/mobile typecheck ->  clean
generate + git diff --exit-code      ->  types in sync
B-01 driven in a real browser against the live API: register -> onboarding ->
  dashboard; DataBoundary rendered the empty state, "Set a goal" ran the mutation,
  invalidation refetched, content state appeared. Zero console errors.
```

**Verified counts.** Client tests **0 → 69**. Repo total **181 → 250**.
Coverage: **63.7%** statements, **68.9%** lines. `src/lib/query` **97%**, `DataBoundary` **100%**.

**Decisions recorded.** D3b **closed** · D17 (declared response envelope) · D18 (coverage ratchet).

**Left undone, and why — this is what G2 inherits as debt.**
- **`src/lib/session.tsx` is still 0% covered** and `src/ui/index.tsx` is 31%. They are the whole gap
  between today's number and the 80% house floor. Untouched deliberately: G1's brief was to build the
  spine and migrate **one** screen, and rewriting the session provider under it would have widened the
  blast radius of this goal considerably.
- **Only B-01 was migrated.** The other five screens still call `api.ts` directly. That was the
  instruction and it was the right one — a wide migration would have hidden whether the substrate is
  any good.
- **The Hermes `Intl` question G0 raised is still open.** No DST case is asserted yet, because
  nothing in G1 buckets a date. **G3** must settle it before the logger depends on **I7**.
- **`forceExit: true` in `jest.config.js`.** A mounted TanStack mutation observer never lets the Jest
  worker go idle under jest-expo's RN environment. Narrowed to library+environment, not app code: it
  hangs with a no-op `onSuccess`, the same `applyInvalidation` runs without React in
  `invalidation.test.ts` and exits cleanly, and a synchronous `notifyManager` scheduler removed the
  `act()` warnings but not the hang. Every test still runs and reports. **G3 should revisit it** — a
  suite that cannot end on its own will eventually hide a real leak.

**Traps hit.**
- **The contract did not cover responses at all.** `packages/api-types` generated cleanly and looked
  finished while containing only request bodies, because every route returns `ok(...)`, a
  `JSONResponse`, and FastAPI documents nothing from that. A drift gate shipped in that state would
  have been a gate over the half of the contract nobody reads. Caught by looking at what was
  generated rather than that it generated — **D17**.
- **Jest's coverage buckets.** Naming a path in `coverageThreshold` **removes it from `global`**, so
  after holding `src/lib/query` at 90% the `global` numbers dropped to the untested remainder and the
  build failed against figures that were correct a minute earlier. The thresholds now say which
  denominator each bucket measures.
- **jest-expo's `transformIgnorePatterns` is inert under pnpm.** Its allow-list is anchored at the
  first `node_modules/`, which under pnpm is followed by `.pnpm/`, so every React Native source was
  skipped and Jest choked on Flow syntax. Replaced with a pattern that tests the inner
  `node_modules/`, which carries the real package name in both layouts.
- **A broken install, not a broken config.** `strip-ansi@6.0.1` had an ESM `ansi-regex@6.3.0` nested
  inside it while declaring `^5.0.1`, which crashed every Jest reporter with
  `ansiRegex is not a function` and looked exactly like a misconfigured harness. Pinned by a pnpm
  override.
- **`EXPO_PUBLIC_API_URL` cannot be tested at runtime.** babel-preset-expo inlines it at transform
  time, so under Jest it is already `undefined` and no assignment can reach the branch. Confirmed by
  reading the babel output. Documented in `api.ts` and left explicitly untested rather than covered
  by a test that proves nothing.

---

### Handoff — G8 · AI nutrition                                closed 23 Sep

**Outcome claimed.** AI estimates food and never becomes the record; a correction is what counts,
and the raw result survives byte for byte.

**Inherited and used.**

| ID | Held? | Note |
|----|-------|------|
| H7.1 | ✅ | The AI path resolves **through** the resolver, not around it. What it needed on top was a ladder — a model says "2 eggs" and the catalog says "Whole Egg" — so `app/food/ladder.py` sits above the interface and below the worker, climbing down in decreasing confidence and **giving up** at step 5. The interface itself did not change, which is what H7.1 claimed |
| H7.2 | ✅ | A confirmed AI item lands in exactly the same shape as a manual one: snapshotted macros on `meal_items`, `confirmed = true`, counted by the same `day_totals`. Nothing in G8 added a second place where `confirmed` is filtered |

**Produced.**

| ID | Artefact | Claim | Evidence |
|----|----------|-------|----------|
| H8.1 | Append-only analysis tables | A correction never mutates the raw AI result | `test_ac10_a_correction_confirms_the_meal_and_leaves_the_analysis_untouched` — a SHA-256 over **every column** of every item row, built from the table's own column list, compared before and after. Plus `test_the_database_itself_refuses_an_update_to_an_analysis_item` / `..._a_delete_...`, and `test_the_request_and_the_model_output_cannot_be_rewritten` parametrised over all seven immutable columns |
| H8.2 | AI gateway | Strict JSON schema, timeout, containment — training never depends on it | `test_i14_the_whole_logger_still_works_with_the_gateway_dead`, and `scripts/verify-containment.sh` with two real processes and a provider on a closed port |

**Verified.**

- **AC-08** — `test_ac08_three_foods_become_three_separately_editable_items`: *"2 eggs, 3 rotis and
  200g chicken curry"* yields three rows with three ids, each with a quantity and a unit.
- **AC-09** — `test_ac09_a_photo_yields_items_with_quantity_macros_and_confidence`, and on the
  client `sends only the fields the user actually typed` proves every field is editable and that
  untouched ones are sent as `null`.
- **AC-10** — byte-identity, not field equality. The fingerprint reads
  `FoodAnalysisItem.__table__.columns`, so a column added next year is covered without anyone
  remembering to add it.
- **Containment** — `scripts/verify-containment.sh` starts `uvicorn` and `python -m app.worker`
  with `AI_BASE_URL=http://127.0.0.1:1/v1/messages`. The analysis failed `ai_unavailable`, the
  worker stayed up, and then: a session started, a set logged, the session finished at 480.0 kg,
  history read, analytics read, a food created and a meal logged at 380.0 kcal. **Nothing else
  noticed.**

Acceptance criteria now proven: AC-01, AC-02, AC-03, AC-04, AC-05, AC-06, AC-07, **AC-08, AC-09,
AC-10**, AC-12 — **11 of 12**. AC-11 is G9's.

**Decisions recorded.** **D23** the provider is Anthropic Claude behind an `AIGateway` Protocol,
with a **stub as the default** so the suite never makes a network call and a checkout needs no key ·
**D24** the model contract is versioned (`food_analysis.v1`), stored per row, and an unknown
version is a failure rather than a guess · **D25** the queue is Postgres `SKIP LOCKED` and the
worker is a separate process · **D26** object storage is an interface with a local implementation,
because the charter says no cloud.

**Left undone, and why.**

- **No hardware flow for AC-08/09/10.** `scripts/e2e.sh` still covers AC-01/02/04/05 only. With no
  device attached, an unrun Maestro flow would be worse than none — G4's own lesson.
- **H-09 uses the system camera, not an in-app one.** The wireframe draws a preview with a torch
  and a flip button; this uses `expo-image-picker`, which delivers capture, library, downscale,
  strip and upload without a second native module and a permissions flow that cannot be exercised
  on the hardware currently available. It is a later change to one file.
- **One photo per analysis.** H-09 accepts up to four and submits the first. A meal photographed
  from two angles is two estimates the user reconciles, which is honest; pretending one call saw
  both plates would not be. Batching is a server change, not a screen change.
- **No dictation on H-06.** The platform speech API is another dependency for an affordance the
  keyboard already covers.
- **Notifications on completion are not built.** H-07 is dismissible and the analysis is waiting
  when the user returns, but nothing pushes. That belongs with the rest of the notification work.
- **Q1 is still open**, and now matters more: an AI estimate can only resolve to what the catalog
  contains. Everything else stays unresolved with the model's own macros, which works — and is
  exactly the gap a provider would close.

**Traps hit.**

- **A lifecycle in an append-only table.** `food_analyses` is a *job* as well as a record, so a
  blanket freeze would have stopped the worker recording that it had finished. The line is drawn
  inside the row: the request is immutable always, the model's output once the analysis has ended.
- **"Freeze it once it is set" left a hole**, and a mutation found it: an analysis that legitimately
  had no `notes` could have commentary written into it afterwards, and the audit trail would show
  the model saying something it never said. The rule became "immutable once terminal".
- **A single-column immutability test.** It passed while seven other guards could have been removed.
  Parametrised over all of them.
- **`run_once` claims the globally oldest job**, which is right for a fleet of workers and wrong for
  a test that means "my job has been processed". Eighteen tests were passing or failing on whichever
  row happened to be first. `drain()` now exists for both.
- **A lambda that recursed into its own monkeypatch.** `setattr(signing, "_now", lambda: signing._now() + N)`
  calls the patched function. The original has to be captured first.
- **The ladder's shortest rung matched everything.** `"Nani's Sunday curry"` leaves a stray `"s"`
  once punctuation is dropped, and `ILIKE '%s%'` matches most of a food catalog. Rungs are now at
  least three characters.

---

### Handoff — G7 · Nutrition core                closed 23 Sep · `fcbba0b`

**Outcome claimed.** A manually logged meal moves today's totals, on the user's local date —
**AC-07**. Proven by API tests and client tests; **not** on hardware.

**Inherited and used.**

| ID | Held? | Note |
|----|-------|------|
| H3.2 | ⚠️ | **The queue was generic. The door was not.** `createOutbox` only ever touches `readyEntries`/`markSent`/`markRetry`/`markFailed`, so the engine was genuinely reusable — but the only way to put something *in* was `commit(draft, entry)`, which demands a session draft, and a meal has none. Fixed on the shared `SessionStore` contract as `enqueue(entry)`, implemented in both the SQLite and in-memory stores and covered by the one contract suite. **Recorded as a G3 defect**, not answered with a second queue. Meals and recipe logs now ride the same outbox and the same `startOutboxPump` |
| H6.1 | ✅ | `Meter` from the chart kit draws H-01's remaining-calories bar unchanged. H-15's macro rows are a new control (a track plus steppers) rather than a chart, so they are not in the kit |
| H5.1 | ✅ | `/foods` uses `CursorEnvelope`, and `meta.filtered` is what lets H-04 tell "you have no foods" from "nothing matches this" (**I13**) |

**Produced.**

| ID | Artefact | Claim | Evidence |
|----|----------|-------|----------|
| H7.1 | Food resolver interface | Provider-agnostic — Q1 answerable late without a rewrite | `app/food/resolver.py`: a `Protocol` with `search(query) -> list[Candidate]` and `resolve(ref) -> FoodRef`. One real implementation (`InternalCatalogResolver`, 22 seeded foods) and a test double substituted in the suite. `_resolver()` in `app/api/routes/nutrition.py` is the only place a concrete resolver is named |
| H7.2 | Meal aggregate | Denormalised macros; only confirmed reaches analytics | `meal_items` hold absolute macros frozen at write; `foods` hold per 100 g. Editing a food afterwards leaves the meal byte identical (asserted). `confirmed` is filtered once, in `app.domain.nutrition.day_totals` |

**Verified.** AC-07: `tests/test_nutrition.py` end to end, plus H-01's own test asserting the
pending item is visible and in no total · outbox replay: the I8 test in `test_nutrition.py` and the
store-contract test for `enqueue` · the snapshot rule: log a meal, edit the food, assert identical ·
the recipe version of it: log a recipe, quadruple the recipe, assert the meal unchanged.

Acceptance criteria now proven: AC-01, AC-02, AC-03, AC-04, AC-05, AC-06, **AC-07**, AC-12 —
**8 of 12**.

**Decisions recorded.** **Q1 → still open**, and G7 shipped without it. DR2 downgraded from
"blocks M5/M6" to "blocks coverage and the licensing obligation" ([charter §7](08-PROJECT-CHARTER.md#7-delivery-risks)).
Two new decisions: **D21** (`meals.meal_type` is a slug, not an ENUM — H-16 makes a fixed four-value
enum untenable) and **D22** (a recipe is a plan; logging it snapshots).

**Left undone, and why.**

- **H-14 nutrition analytics** and **H-17 barcode** were not in scope. H-14 needs `daily_summaries`
  (G9's); H-17 is P2 and depends on Q1
- **No hardware flow for AC-07.** `scripts/e2e.sh` still covers AC-01/02/04/05 only. The claim rests
  on API and client tests
- **Q8 is open and now user-visible.** Targets are not versioned, so Volt has no record of what a
  past day's target was. H-15 therefore says only that nothing already logged is rewritten —
  deliberately narrower than the wireframe's "past days keep the numbers they had", which the schema
  cannot support
- **No screen sets `birth_date`, `sex` or `height_cm`.** The API accepts all three and H-15's
  calculator needs them; onboarding does not collect them and no profile screen exists. H-15 names
  the gap and falls back to a weight-and-activity estimate rather than linking to a route that is
  not there. Belongs to G9
- **H-15's macro control is steppers, not a gesture slider.** The wireframe draws sliders;
  `@react-native-community/slider` is a new dependency and D19's history with dependencies that
  reach for React under Metro argued against one for a control that steppers do equally well — and
  that a screen reader and a Maestro flow can both drive

**Traps hit.**

- **The `meal_type` enum.** Written in this same goal, before H-16 was read. A four-value Postgres
  ENUM makes "Pre-workout" a migration. Caught while the migration was still uncommitted, so it was
  amended rather than superseded — but `alembic check` passed the whole time, because the DB was
  already at the old version of the same revision. It only surfaced on a forced downgrade
- **A vacuous 404.** "Another user cannot copy this meal" passed before the route existed: a missing
  route returns 404 too. Two tests had the same shape; both now assert the owner *can* do it
- **A 101-step sweep that could not fail.** The macro interlock's "always totals 100" test swept a
  30/40/30 base, whose two fractional parts always sum to 1 — independent rounding is right every
  time there. An equal-others base (49.5 / 49.5, both rounding up) is where it breaks. Found by
  mutation, not by reading
- **`expo-sqlite` pulled into the whole query layer.** Wiring meals through the store made
  `hooks.ts` import `src/lib/db`, whose static `import 'expo-sqlite'` throws under Jest — four
  suites went red. The fix is architectural rather than a mock: `src/lib/db/index.ts` is now a
  façade that `require`s the implementation on first use, so importing the module costs nothing
- **`router.replace` undefined in a mock.** ES imports hoist above `const mockReplace = jest.fn()`,
  so a factory that captures the variable directly captures `undefined`. Calling through a wrapper
  defers the lookup

---

### Handoff — G6 · Analytics                                   closed 23 Sep

**Outcome claimed.** Training data is a trend, and the numbers agree with the logger's. **AC-06**
proven — **7 of 12**.

**Inherited and used.**

| ID | Held? | Note |
|----|-------|------|
| H5.1 | ✅ | The cursor convention was there to copy. G6's analytics reads are ranged rather than paged, so none of them needed it — which is the convention doing its job quietly |
| H5.2 | ✅ | `/history/compare` is reused rather than reimplemented for F-06 |
| H1.3 | ✅ | Every empty chart is a `DataBoundary` empty state with a sentence, not a blank plot. Asserted per screen |

**Produced.**

| ID | Artefact | Claim | Evidence |
|----|----------|-------|----------|
| H6.1 | `src/ui/charts/` | Palette, axis, legend, empty state, obeying 05 §3 | 8-slot palette asserted hex-for-hex in both themes; spacer unassignable; six-series ceiling; a regression is never red. 24 tests, 2 mutations |
| H6.2 | Analytics read model | Does not scan every set per request | `EXPLAIN` asserted in two tests: index scan, no `Seq Scan`. No migration needed, and that is measured rather than claimed |
| — | `app/domain/adherence.py` + `adherence.ts` | PRD W07.7 has an implementation in both languages | 11 new shared vectors; TS and Python run the same ones |

**Verified.** AC-01, AC-02, AC-03, AC-04, AC-05, **AC-06**, AC-12 — **7 of 12**.
API tests 209 → 241. Client 370 → 414. Domain vectors 48 → 59.

**Left undone, and why.**
- **G-07 shares G-03's screen.** Both are "one exercise's progression over time"; the wireframes
  differ in entry point, not in content, and two screens would be one chart built twice.
- **No tooltip.** 05 §3.5 asks for a hovered direct label, which has no meaning without a pointer.
  First, last and max are labelled instead; a touch equivalent belongs with the interaction pass.
- **The charts are not on a device yet.** They typecheck and render in tests, in both themes, but
  G4's lesson is that rendering in a test is not rendering on a phone. The emulator cannot drive
  touch, so this is owed a device pass.

**Traps hit.**
- **The ceiling test was vacuous.** "Never hands out the spacer" passed six keys, so slot 7 was
  unreachable whatever the ceiling was — it passed against a ceiling deliberately raised to 7. Found
  by the mutation, fixed by supplying seven keys and then twenty.
- **My own vectors were wrong before the code was.** A "Saturday is outside this range" case ended
  on a Saturday.
- **Two schema classes with one name** broke a generated alias by forcing fully-qualified names. The
  D3b drift gate surfaced it on the first regeneration.
- **The docstring claimed a shared CTE that the code did not use.** The roll-up walks *up* the tree
  while G5's CTE walks *down*. Rather than leave the comment lying, the upward walk moved into
  `app/domain/muscles.py` beside the CTE — same module, same edges, opposite directions.

---

### Handoff — G5 · Retrieval                                    closed 23 Sep

**Outcome claimed.** A user answers *"what did I do last chest day?"* without remembering when it
was, and is told plainly if the search had to widen. **AC-03** and **AC-05** proven — **6 of 12**.

**Inherited and used.**

| ID | Held? | Note |
|----|-------|------|
| H4.1 | ✅ | Added to rather than restarted: `ac-05-previous-occurrence.yaml` joins the suite and **passes on the device**, paired with an `assert_ac.py` check like every criterion since G4. It reaches F-05 by navigating from the dashboard — "without knowing its date" also means without knowing the URL |
| H1.2 | ⚠️ | The registry held, but the invalidation map had a **gap it could not see**: a reopened session stops being completed and so leaves history, and nothing invalidated the retrieval keys. F-01 would have kept showing it and AC-05 would have resolved to it |
| H2.1 | ✅ | F-01…F-07 reuse `VirtualList`, `FilterChips`, `ScreenScaffold`, `Sheet` and `DataBoundary` unchanged. No screen re-solved any of them |

**Produced.**

| ID | Artefact | Claim | Evidence |
|----|----------|-------|----------|
| H5.1 | `app/api/cursor.py` + `CursorEnvelope` | One pagination shape for every list endpoint after this | Keyset over `(started_at, id)`, opaque base64, `has_more` counted not inferred. Two mutations each fail a named test |
| H5.2 | `GET /history/compare` | The comparison primitive G6's charts reuse | 2–3 sessions aligned by exercise; every number from `app.domain.training`; an absent cell is **null, never 0** |
| — | `app/domain/muscles.py` | One recursion for "or a descendant", shared by AC-05 and F-02 | Mutation: a one-level join fails 5 tests |

**Verified.** AC-01, AC-02, AC-03, AC-04, AC-05, AC-12 — **6 of 12**.
API tests 164 → 209. Client tests 326 → 370. Coverage ratchet 51/47/48/52 → **54/50/50/55**.

**Left undone, and why.**
- **F-04 is an entry point, not an editor.** G5 is retrieval; editing a past session belongs with the
  session-mutation work. It says so on screen rather than presenting a form that does not save.
- **AC-03's E2E half is the API, not Maestro.** The timezone matrix runs against the API across five
  zones and both DST directions; it is not driven through the UI, because the criterion is about
  which day a session is *filed* under and the UI cannot make that wrong on its own.
- Two of the nine `local_date` vectors are dated in the future, and the API rightly refuses a
  future-dated session. The session-level matrix uses the loggable ones and covers DST fall-back
  with its own past-dated case.

**Traps hit.**
- **A vacuous test, found by a mutation.** `test_does_not_widen_when_a_primary_match_exists`
  compared a session id against an **exercise** id — never equal, so it passed against a rule that
  had been deliberately broken. The mutation check earned its keep: it failed one test where two
  should have failed, and that gap was the tell.
- **"Or a descendant" reads like a join and is a recursion.** The seeded tree is two levels deep, so
  a one-level join matches every fixture that exists. The tests build a grandchild specifically so
  the shortcut fails.
- **Widening in one query is not widening.** `role IN ('primary','secondary')` returns a newer
  secondary match over an older primary one — the opposite of the rule.
- **The cursor could not have reached the client.** `api.get` unwraps to `data` and drops `meta`;
  and `PagedEnvelope`'s generic `Meta` has no cursor fields, so the response was *documented* as
  un-pageable. Both fixed — the second is the same gap D17 closed for bodies.
- **The fixtures polluted another file's guards.** Writing test exercises straight to `exercises`
  with a NULL owner made them catalog entries, and `test_seed_catalog.py` counts those. The
  failures appeared in a file G5 never touched.

---

### Handoff — G4 · Critical path proven on hardware            closed 23 Sep

**Outcome claimed.** AC-01, AC-02 and AC-04 are proven by flows that ran on a **physical phone** and
were then checked **against the API**. DR4 is closed. The p95 is measured, and **misses its budget**.

**Inherited and used.**

| ID | Held? | Note |
|----|-------|------|
| H3.1 | ✅ | The pure reducers were right. Nothing the device found was in them |
| H3.2 | ❌ | "Outbox is idempotent" held; "the outbox delivers" did not. It stranded a set for **25 minutes** while the screen showed it saved. Two causes, then a third: a concurrent `flush()` was handed a run whose work list predated the new entry; the logger flushed before the fire-and-forget write had reached SQLite; and **nothing re-armed the queue when the server came back** — all three triggers were things the user does |
| H3.3 | ✅ | Now genuinely verified — see the ledger. G3's own note said it was unverified, and it was right to |
| H3.4 | ✅ | The four endpoints were used hard and held |
| H0.3 | ✅ | Maestro drove Expo Go with no native toolchain, exactly as D15 claimed. Two things it did not anticipate: a **system dialog masks the whole app** out of the accessibility tree, and **`setAirplaneMode` does not take this phone offline** |

**Produced.**

| ID | Artefact | Claim | Evidence |
|----|----------|-------|----------|
| H4.1 | `.maestro/` + `scripts/e2e.sh` + `scripts/assert_ac.py` | Each criterion is a flow **and** a query against the API | `ac-01-build-chest-workout`, `ac-02-record-every-set`, `ac-04-previous-performance`, `offline-1/2/3`. **The CI job has never run** — see H4.1 in the ledger |
| H4.2 | Device-verified build | Runs on a phone over the LAN; DR4 closed | Samsung SM-E546B, Android 16. `hostUri` → `http://192.168.1.3:8000`; `[db] open (sqlite) journal_mode=wal` |
| H4.3 | Measured p95 | tap → set rendered, on hardware | **396.4 ms** over 99 commits; **118.7 ms** over 9. Budget 100 ms — **missed** |

**Verified.** Acceptance criteria now proven: AC-01, AC-02, AC-04, AC-12 — **4 of 12**.

**Left undone, and why.**
- **The CI workflow has never executed.** It builds a debug APK, so the flows' `appId` and Expo Go
  `openLink` need parametrising. The criteria are proven on hardware, not in CI. Written down rather
  than claimed.
- **Offline plus relaunch cannot be expressed in Expo Go**, because the bundle reloads from Metro over
  the same LAN. The scenario is proven by taking the **API** away while Metro stays up. Proving it
  with the radio off needs a development build — DR4's remaining edge.
- **D16 is missed and left at 100 ms.** Two costs are now separated: a baseline near 110 ms, and
  growth with list length because every commit re-renders the whole list.

**Traps hit.**
- **A green flow that proved nothing.** AC-02 passed on the phone showing three sets while the server
  held two. This is the goal's own warning — "the UI is the thing most likely to be right; the write
  is the thing most likely to be missing" — and it was right.
- **A flow asserting less than its criterion.** AC-01 prescribed only the first exercise while
  AC-01 reads "**each** with `target_sets` and a rep range". It was green and half-testing.
- **An assertion of my own that raced.** AC-04 checked "not the session just started" — redundant
  (the new one is `in_progress`, so "most recently **completed**" already excludes it) and racy.
  Removed rather than loosened.
- **The fixture was the flake.** `seed_demo.py` cancelled a leftover open session only on a brand-new
  account, and E-01 hides every plan day while one is open — so flows failed on selectors and looked
  like a broken app. Its docstring claimed a wipe it never did.
- **The ratchet caught me pinning it to the wrong number.** Naming a path in `coverageThreshold`
  **removes it from `global`**, so the printed 55.66% is not the bucket being gated. The real
  remainder is 51.90%; thresholds are now 51/47/48/52, up from 45/38/42/46.
- **My own harness lied twice.** Maestro does not interpolate an env var into `repeat.times`, so
  `SAMPLES=10` silently ran 100; and a backgrounded server inheriting the script's stdin kept a pipe
  open, so a finished run looked like a hang.

---

### Handoff — G2 · Catalog and planning            closed 22 Sep · `155fb99`

**Outcome claimed.** A user can search the catalog, open an exercise, create a custom one, and build
a multi-day program with prescriptions, entirely on a phone screen. **AC-01 is reachable.**

**Inherited and used.**

| ID | Held? | Note |
|----|-------|------|
| H1.1 | ✅ | Types regenerated twice (new endpoints, then m4); `git diff --exit-code` clean both times. Nothing in G2 is hand-typed |
| H1.2 | ✅ | Two new reads added to the registry **and** to docs/03 §6.2 in the same change — the agreement test would have failed otherwise |
| H1.3 | ✅ | Every async surface renders through `DataBoundary`. No screen hand-rolls a spinner |
| H1.4 | ✅ | The ratchet caught the new hooks at 63.8% and refused the build until they were tested. That is the gate working, not the gate being annoying |

**Produced.**

| ID | Artefact | Claim | Evidence |
|----|----------|-------|----------|
| H2.1 | `src/ui/VirtualList`, `FilterChips`, `ScreenScaffold`, `Sheet` | The list, filter row, scaffold and sheet are solved once | Used by all 8 screens; `VirtualList` is a seam, so the list implementation is a one-file change |
| H2.2 | `src/features/exercises/ExercisePicker` | The logger's add/swap is a prop change | `selected` / `onChange` / `onCommit` are **controlled**; `max={1}` is swap. 11 tests drive it through props, as the logger will |
| H2.3 | `/exercises/{id}/history`, `/stats` | D-02's data exists server-side | 15 tests asserting status **and** payload; both defer every derived number to `app.domain.training` |

**Verified.**

```
pnpm --filter @volt/domain test      ->  48 passed
uv run pytest -q   (services/api)    -> 150 passed, 3 skipped   (was 136)
uv run ruff check . / alembic check  -> clean / no new operations
pnpm --filter @volt/mobile test:ci   -> 125 passed (was 69), gate exit 0
pnpm --filter @volt/mobile typecheck -> clean
generate + git diff --exit-code      -> types in sync
```

Coverage **63.7% → 67.5%** statements, **68.9% → 71.2%** lines. Repo total **250 → 323** tests.

**Ran for real.** Built a 3-day program end to end in a browser against the live API, by hand:
**Push — Chest & Triceps** (Barbell Bench Press 4 × 6–8 @ 80 kg, Incline Dumbbell Press 3 × 8–10,
Cable Fly), **Pull — Back & Biceps** (Barbell Row, Lat Pulldown), **Legs** (Bulgarian Split Squat,
Barbell Squat — reordered before saving, and the new order persisted). Three things were confirmed
against live data rather than asserted:

- C-05's live summary read **CHEST 4 · FRONT DELTS 2 · TRICEPS 2** off a single 4-set bench
  prescription — primary ×1, secondary ×0.5, which is **I4/D7** visible on screen.
- D-02's **never-performed** state rendered for every seeded exercise before anything was logged.
- After logging warm-up 10×40, then 8×80 and 6×90, `/stats` returned volume **1180 kg** — the
  400 kg warm-up excluded (**I3**) — and e1RM **108 kg**, which is Epley on 90 × 6 exactly (**I5**).

**Left undone, and why — this is what G3 inherits as debt.**
- **C-05 reorder is ↑/↓ buttons, not a drag handle.** Accessible and testable, and it re-densifies on
  save, but the wireframe's `⠿` drag is not built. Drag needs `react-native-gesture-handler`, which
  is another unverifiable-on-web dependency; **G4** is the right place, once a device exists.
- **No long-press row menu on D-01**, no ⋮ menus on C-02/C-03, no archive/duplicate/delete UI. The
  endpoints exist; the affordances do not. C-04, C-08, C-09 and D-04 were not in scope.
- **D-03 does not warn on near-duplicates from the server's fuzzy match** — it compares against the
  current search result only. Good enough to catch an exact retype, not a typo.
- **`src/lib/session.tsx` is still 0% covered**, unchanged from G1.
- **The screens have no component tests of their own.** The kit, the picker, the prescription editor
  and the set-count maths are tested; the six route files are not. They were verified by hand
  instead, which is weaker and is why it is written down here.

**Traps hit.**
- **The prescription schema could not express the product.** C-07 renders from `tracks_*`, but
  `plan_exercises` had only sets/reps/load — so a plank and a run had **nothing to prescribe**. Fixed
  with m4 rather than by special-casing the UI, because the frozen `target_snapshot` is what the
  logger reads: a target missing from the snapshot does not exist as far as G3 is concerned.
- **`_ex_out` enumerated its fields by hand**, so m4's columns reached the database and never reached
  the client. Nothing failed until a test asked for them. It validates from the ORM object now.
- **Two endpoints, two timestamp formats.** `/records` hand-rolled `isoformat()` ("+00:00") while the
  new `/stats` went through Pydantic ("Z"), for the same field. Caught by a test that compared the
  two endpoints directly rather than checking each in isolation.
- **A duplicated query made a mutation test vacuous.** `previous-performance` and the new history
  query had the same joins and filters; breaking one left every test passing. They are one
  `_occurrences_query` now — dropping the user filter from it fails 8 tests, where before it failed
  none.
- **`@shopify/flash-list` crashed the web build** with *"Invalid hook call … more than one copy of
  React"*. Isolated by swapping `VirtualList` alone. It may be fine on a device, but there is none
  until G4, so it was removed rather than shipped unverified — and `docs/03` §2 now says so.
- **jest-expo's `setupFiles` replaces rather than extends.** Naming that key dropped React Native's
  own setup and produced `__fbBatchedBridgeConfig is not set`, which reads like a broken test rather
  than a broken config.

---

### Handoff — G3 · The logger            closed 22 Sep · `60b0bd4`

**Outcome claimed.** A user can start a workout, log sets one-handed with the UI never waiting on the
network, keep logging with the server unreachable, and finish with numbers the server agrees with.
**AC-02 and AC-04 are reachable — and not yet proven, because proving them needs a device.**

**Inherited and used.**

| ID | Held? | Note |
|----|-------|------|
| H0.2 | ⚠️ | D14 named `expo-sqlite` as available. It is — on iOS and Android only. See below |
| H1.1–H1.4 | ✅ | Types regenerated twice; new reads keyed through the registry; `DataBoundary` used; the ratchet caught the untested UI and was answered with tests rather than a lower gate |
| H2.2 | ✅ | `ExercisePicker` reused for add-exercise **as a prop change**, exactly as G2 promised. No second picker was written |

**Produced.**

| ID | Artefact | Claim | Evidence |
|----|----------|-------|----------|
| H3.1 | `store/reducers.ts` | Pure, immutable, densifying | 30 tests, no React. Densify **paired** with `test_densify_matches_the_client_reducer`, each naming the other |
| H3.2 | `lib/offline/outbox.ts` | FIFO per aggregate, idempotent replay, terminal 4xx surfaced | 17 tests. Dropping a terminal failure, continuing a queue after one, and retrying for ever each fail their own named test |
| H3.3 | `RecoveryGate` + `mergeRecovered` | Local and server reconciled deterministically | Every row of the §5.3 table has a test. **The kill-and-relaunch half is unverified** — see below |
| H3.4 | 4 mutation endpoints | E-02's annotate, remove, reorder, notes | 14 tests asserting status **and** payload; I1 has its own test |

**Verified.**

```
uv run pytest -q        -> 164 passed, 3 skipped   (was 150)
ruff / alembic check    -> clean / no new operations
pnpm --filter @volt/mobile test:ci -> 251 passed   (was 125), gate exit 0
typecheck, drift gate, G0 spec gate -> all clean
```

**Ran for real, in a browser against the live API.**

- **I10 held with the server switched off.** Sets 4 and 5 committed instantly with the API process
  killed, and read **"Waiting to sync"** while 1–3 read "Synced". The only visible difference between
  online and offline was the dot, which is what docs/03 §7 asks for.
- **Zero duplicates.** After the API came back, SQL against `workout_sets` for that session returned
  **6 sets, 6 distinct `client_id`s, `set_index` dense 0–5** — the two queued offline flushed exactly
  once each.
- **Client and server agree by construction.** The instant summary said best e1RM **93 kg**; the
  server's record said **93.3 kg**. Epley on 70 × 10 is 93.33, from the same definition on both sides.
- E-01's in-progress card, prefill from the frozen `target_snapshot` (I1), resume, finish, and E-11's
  four records all rendered against real data.

**Left undone, and why — this is what G4 inherits as debt.**
- **SQLite has never been opened.** `expo-sqlite` declares `"platforms": ["apple", "android"]` and has
  **no web build**; importing it on web crashes the app outright. Web is the only target this project
  can run (DR4). So `src/lib/db` is an interface with two implementations, the contract suite runs
  against the in-memory one, and **every line of `sqlite.ts` is unexecuted code**. D14 is amended to
  say so. **G4 is where it stops being a reading of a manifest.**
- **The airplane-mode test is half-done.** Offline logging, flush and no-duplicates are verified for
  real. **Kill the app and relaunch is not** — the web store is in-memory by design, so there is
  nothing to survive. That half is G4's, on hardware.
- ~~**tap → set rendered has not been measured.**~~ **Measured 23 Sep (G4)** and it **misses**:
  p95 396.4 ms over 99 commits, 118.7 ms over 9, against 100 ms. The commit path being *synchronous*
  was indeed a different claim from "< 100 ms on a phone" — it is synchronous and it is slow.
- ~~**WAL is unverified**~~ — confirmed on the device: `[db] open (sqlite) journal_mode=wal`.
- **The route files have no component tests.** The store, outbox, reducers, timer, summary and the
  logger's components are tested; `app/session/[id].tsx` and `app/train/start.tsx` were verified by
  hand. Both of the bugs found late (below) were in exactly that untested layer, which is the
  argument for closing it.
- **E-05, E-06, E-07 and E-12** (advanced set editor, session notes UI, plate calculator) are not
  built. Swap-exercise reuses the picker but has no entry point on E-03 yet.

**Traps hit.**
- **The gate's own premise was wrong, and that was the most valuable hour.** G3 says "open a database
  in the running app before building on it". Doing that revealed there is no web build at all —
  something no amount of reading the SDK manifest in G0 would have shown.
- **A non-UUID idempotency key.** The client generated `${timestamp}-${random}`; the server types the
  header as a UUID and 422s anything else. Every unit test passed, because they used readable keys.
  It surfaced only against the live API, as *"the set logged fine and never uploaded"* — the worst
  shape this bug could take. **D20**, and the format is now asserted.
- **A refresh stampede.** Three queries 401 together, each refreshed with the same token, the first
  rotated it, and reuse detection — correctly — revoked the whole family and signed the user out
  mid-workout. G1 tested one refresh, sequentially. Refresh is now single-flight, with a test that
  fails when the guard is removed.
- **A sync dot that lied.** `flushAndReconcile` treated "not in the failed list" as sent, so a set
  queued with the server unreachable showed **Synced**. It now reads the entry's actual state. This
  dot is the only thing distinguishing online from offline, so it is the one thing it must not
  get wrong.
- **A summary computed after the draft was cleared.** E-08 showed 3 sets and 1,440 kg for a 6-set,
  2,880 kg workout, because `finish()` clears the draft and the summary was read afterwards. It is
  snapshotted before finishing now.
- **Zustand, twice.** v5 then v4, both crashing with React `null` inside the library — the same shape
  `@shopify/flash-list` produced in G2. Replaced with ~50 lines over React's own
  `useSyncExternalStore` (**D19**). The reducers did not change, which is what keeping them pure was
  for.

---

### Handoff — G4 · **OPEN, blocked on hardware**            as of 22 Sep · `334c7f4`

**This is not a close-out.** G4's three central claims can only be answered by a native target and
there is none on this machine: no Xcode, no physical device, no emulator (no system image, and
`java` is installed but unlinked). Everything recorded below is either proven or explicitly not.

**What is proven.**

| Claim | Evidence |
|---|---|
| AC-04's feature exists | The previous-performance strip — **G3 never built it**, so AC-04 was unprovable regardless of hardware. 8 tests: prior sets, warm-ups excluded, warm-ups-only, first-time prompt, loading, retry, a11y label |
| The E2E flows exist | Maestro **2.10.0 installed** (D15 chose it in G0; nobody had run it). 4 flows, written against accessibility labels so they break when the app becomes *unusable*, not when a layout shifts |
| The latency harness exists | `commitTiming.ts`, p95 by nearest rank, `worst` reported beside it because one stall in twenty does not move p95 but the user still saw it |
| The Jest suite ends on its own | `forceExit` **removed** — carried G1→G3. Dropping Zustand (D19) took the cause with it. Three clean runs, 297 passed, exit 0 |

**What is NOT proven, and cannot be from here.**

| Claim | Status |
|---|---|
| **SQLite opens (D14)** | `sqlite.ts` is written, typed and contract-tested against its in-memory twin, and has **executed zero lines** |
| **Kill-and-relaunch recovery** | The logic has a test per row of the §5.3 table; the *behaviour* needs a store that survives a process death, which web's in-memory one cannot |
| **tap → set p95 (H4.3)** | The path is proven *synchronous* by a test that fails when an `await` is introduced. That is a different claim from *under 100 ms on a phone* |
| **AC-01 / AC-02 / AC-04 by E2E** | Flows written, never executed |

**Two bugs found by covering the layer that had none.**
- `flushAndReconcile` read "not in the failed list" as sent — G3's sync dot bug, now guarded by a
  test that fails when the bug is reintroduced.
- `session.tsx` set the email before fetching the profile, so a failed profile left the app
  signed-out while still showing whose account it was.

**A method note worth keeping.** The E-08 mutation check **passed twice while the guard was
useless**: first because the mocked `useFinishSession` did not clear the draft as the real hook
does, then because the mutation kept a fallback that rescued it. Only the third, faithful
reproduction failed the tests. *A mutation check that passes is not evidence until the mutation is
known to be faithful.*

**To finish G4.** `bash scripts/verify-on-device.sh` reports what it finds and what to do next.
With an Android device over adb it runs all four flows; with an iPhone it prints the manual
sequence, because Maestro cannot drive a physical iPhone without Xcode.

