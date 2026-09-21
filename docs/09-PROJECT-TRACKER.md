# Project Tracker
## Volt — Fitness & Nutrition Tracking Platform

**Last updated:** 2026-09-21 (M1 closed) · **Charter:** [08-PROJECT-CHARTER.md](08-PROJECT-CHARTER.md)

> This file records **what is actually true today**, not what is planned.
> A box is only ticked when the thing has been run and verified — see the
> Definition of Done in [charter §4](08-PROJECT-CHARTER.md#4-definition-of-done).

**Status:** 🟢 done · 🟡 in progress · ⚪ not started · 🔴 blocked · ⏸ deferred to Phase 2

---

## Where we are

| | |
|---|---|
| **Milestones complete** | M0, M1 — **2 of 9** |
| **Tests passing** | **115** — 48 TypeScript, 67 Python |
| **API endpoints live** | 11 |
| **App screens built** | 6 of 103 designed |
| **Screens designed** | 103 specified, 112 rendered *(incl. state variants)* |
| **Running** | Expo app → FastAPI → PostgreSQL, verified end-to-end in a browser |
| **Version control** | git initialised, first commit `5b2ada9` (118 files) |
| **CI** | GitHub Actions — both suites + contract check |

```
M0 ████████████ done      specs, design system, 103 screens
M1 ████████████ done      auth · profile · goals · migrations · CI
M2 ░░░░░░░░░░░░ next      training core
M3 ░░░░░░░░░░░░           retrieval
M4 ░░░░░░░░░░░░           training analytics
M5 ░░░░░░░░░░░░           nutrition core
M6 ░░░░░░░░░░░░           AI nutrition
M7 ░░░░░░░░░░░░           body & dashboard
M8 ░░░░░░░░░░░░           hardening
```

---

## Milestones

| # | Milestone | Exit criterion | Status |
|---|-----------|----------------|--------|
| M0 | Specs & design system | Every screen specified; design system validated | 🟢 |
| M1 | Foundations | Sign up → onboarding → dashboard, real DB | 🟢 |
| M2 | Training core | [AC-01, AC-02](07-TRACEABILITY.md#2-acceptance-criteria--verification) | ⚪ |
| M3 | Retrieval | AC-03, AC-04, AC-05, AC-12 | ⚪ |
| M4 | Training analytics | AC-06 | ⚪ |
| M5 | Nutrition core | AC-07 | ⚪ |
| M6 | AI nutrition | AC-08, AC-09, AC-10 | ⚪ |
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

## M2 · Training core ⚪  ← next

**Exit:** AC-01 (build a Chest workout) and AC-02 (record every set).

- [ ] Models: `exercises`, `muscle_groups`, `exercise_muscles`, `workout_programs`, `workout_plan_days`, `plan_exercises`
- [ ] Models: `workout_sessions`, `session_exercises`, `workout_sets`, `personal_records`
- [ ] Partial unique index — one `in_progress` session per user
- [ ] `local_date` generated column on sessions
- [ ] Seed the global exercise catalog + muscle-group tree
- [ ] `GET|POST /exercises`, `/muscle-groups`
- [ ] `GET|POST|PATCH /workout-programs`, plan days, bulk reorder
- [ ] `POST /workout-sessions`, `/finish`, `/cancel`, `GET /active`
- [ ] `POST /session-exercises/{id}/sets` with `Idempotency-Key`
- [ ] `GET /exercises/{id}/previous-performance`
- [ ] Derived metrics computed in the finish transaction
- [ ] Screens: D-01, D-02, D-03, C-02…C-07, E-01, E-02, **E-03**, E-04, E-08
- [ ] Local-first set commits: Zustand draft + IndexedDB-equivalent persistence
- [ ] Write outbox with idempotent replay
- [ ] E-10 session recovery

## M3 · Retrieval ⚪
- [ ] `GET /history/workouts` with filters, cursor pagination
- [ ] `GET /history/previous-occurrence` — the muscle-group resolution rule
- [ ] `GET /history/compare`
- [ ] Screens: F-01…F-07
- [ ] AC-03 timezone test matrix · AC-05 previous chest day · AC-12 plan edits leave history alone

## M4 · Training analytics ⚪
- [ ] `/analytics/workouts`, `/muscle-volume`, `/exercises/{id}`, `/personal-records`, `/frequency`, `/adherence`
- [ ] PR recomputation on retroactive edit *(full re-scan — a PR can be demoted)*
- [ ] Screens: G-01…G-07 with charts

## M5 · Nutrition core ⚪
- [ ] Models: `foods`, `meals`, `meal_items` **with denormalised macro columns** ([02 §4.2](02-SYSTEM-ARCHITECTURE.md))
- [ ] Nutrition provider decision 🔴 *(Q1)*
- [ ] `/foods`, `/meals`, `/meal-items`, `/recipes`
- [ ] Screens: H-01…H-05, H-10…H-13, H-15, H-16

## M6 · AI nutrition ⚪
- [ ] `food_analyses` / `food_analysis_items`, append-only
- [ ] Job queue + worker, independently scalable
- [ ] AI gateway with strict JSON schema; food resolver ladder
- [ ] Signed upload URLs; EXIF stripped client and server side
- [ ] Screens: H-06…H-09, H-18
- [ ] AC-10 — corrected values confirmed, raw analysis untouched

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

| Order | Task | Why now | Blocks |
|-------|------|---------|--------|
| 1 | **M2 training core** | The product's critical path — exercises, programs, sessions, sets | AC-01, AC-02 |
| 2 | Device verification via Expo Go | LAN connectivity and native behaviour are untested | DR4 |
| 3 | OpenAPI → TS codegen | Worth wiring once M2 widens the API surface | D3b |

*Cleared 21 Sep: Alembic migrations (DR1), git init, CI (DR3).*

## Blocked

| Item | Blocked by | Owner |
|------|-----------|-------|
| M5/M6 food coverage | Q1 nutrition provider undecided | User |
| Device verification | No Xcode/Android SDK locally — needs Expo Go on a real phone | User |
| Age policy on A-07 | Q9 legal position | User |

## Quality snapshot

| Metric | Now | Target |
|--------|-----|--------|
| Tests passing | 115 | grows with each milestone |
| Domain coverage | 100% of specified formulas | 100% |
| API integration tests | 18 | every endpoint, happy + failure |
| Migration guards | 2 — drift check + destructive round trip | kept green |
| Mutation checks | 3 verified catches | every shared-vector change |
| Lint | `ruff` clean, enforced in CI | stays clean |
| Coverage gate | not enforced | 80% (house rule) |
| Acceptance criteria passing | 0 of 12 | 12 of 12 |

## Changelog

| Date | Change |
|------|--------|
| 21 Sep | M0 complete — specs, design system, 103 screens |
| 21 Sep | Accent changed lime → **Iris** after CVD measurement showed ΔE 0.3 against series green |
| 21 Sep | Platform changed to **React Native (Expo)**; API to **Python FastAPI**; docs corrected before code |
| 21 Sep | Shared cross-language test vectors established and mutation-verified |
| 21 Sep | M1 API + mobile complete; verified register → onboarding → dashboard → goal |
| 21 Sep | Fixed: refresh-token family revocation was discarded by session rollback |
| 21 Sep | Fixed: React 19/18 mismatch, ESM `query-string`, Metro `.js` resolution, missing CORS |
| 21 Sep | **M1 closed** — Alembic migrations, git init, CI. DR1 and DR3 resolved |
| 21 Sep | Fixed: migration downgrade left Postgres ENUM types behind, breaking re-upgrade |
| 21 Sep | Test suite now runs migrations instead of `create_all` — drift cannot hide |
