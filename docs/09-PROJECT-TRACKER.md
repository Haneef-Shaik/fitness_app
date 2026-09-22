# Project Tracker
## Volt — Fitness & Nutrition Tracking Platform

**Last updated:** 2026-09-22 (G2 closed — catalog & planning) · **Charter:** [08-PROJECT-CHARTER.md](08-PROJECT-CHARTER.md)

> This file records **what is actually true today**, not what is planned.
> A box is only ticked when the thing has been run and verified — see the
> Definition of Done in [charter §4](08-PROJECT-CHARTER.md#4-definition-of-done).

**Status:** 🟢 done · 🟡 in progress · ⚪ not started · 🔴 blocked · ⏸ deferred to Phase 2

---

## Where we are

| | |
|---|---|
| **Milestones complete** | M0, M1 — **2 of 9** |
| **Tests passing** | **323** — 48 TS domain, 150 Python *(3 skipped)*, **125 client** |
| **API endpoints live** | **45** operations across **34** paths, all with declared response shapes (D17) |
| **App screens built** | **14** of 103 designed |
| **Screens designed** | 103 specified, 112 rendered *(incl. state variants)* |
| **Running** | Expo app → FastAPI → PostgreSQL, verified end-to-end in a browser |
| **Version control** | git, 18 commits · `155fb99` catalog & planning (G2) |
| **CI** | GitHub Actions — **5 jobs**: TS domain, Python, API-type drift gate, mobile tests, contract |

```
M0 ████████████ done      specs, design system, 103 screens
M1 ████████████ done      auth · profile · goals · migrations · CI
M2 ████████░░░░ in prog   training core — API done, logger client next
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
| M2 | Training core | [AC-01, AC-02](07-TRACEABILITY.md#2-acceptance-criteria--verification) | 🟡 |
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

Granular, ordered breakdown of the current milestone: **[TODO.md](TODO.md)**
Sequencing and handoffs from here to release: **[10-EXECUTION-GOALS.md](10-EXECUTION-GOALS.md)**

| Order | Task | Why now | Blocks |
|-------|------|---------|--------|
| 1 | **G3 — the logger** | The product | AC-02, AC-04 |
| 2 | **G4 — device verification via Maestro on Expo Go** | LAN connectivity and native behaviour are untested; the runner is chosen (D15) but not installed | DR4 |

*Cleared 21 Sep: Alembic migrations (DR1), git init, CI (DR3).*
*Cleared 22 Sep: **G0** — `docs/03` re-platformed for React Native; D14–D16 recorded.*
*Cleared 22 Sep: **G1** — generated types (D3b closed), query layer, `DataBoundary`, test harness; D17–D18 recorded.*
*Cleared 22 Sep: **G2** — 8 catalog and planning screens, the two missing endpoints, m4 migration. **AC-01 reachable**.*

## Blocked

| Item | Blocked by | Owner |
|------|-----------|-------|
| M5/M6 food coverage | Q1 nutrition provider undecided | User |
| Device verification | No Xcode locally — needs Expo Go on a real phone. The runner is now chosen (**Maestro**, D15) but not installed | User |
| Age policy on A-07 | Q9 legal position | User |

## Quality snapshot

| Metric | Now | Target |
|--------|-----|--------|
| Tests passing | 323 | grows with each milestone |
| Domain coverage | 100% of specified formulas | 100% |
| API integration tests | 83 | every endpoint, happy + failure |
| Migration guards | 2 — drift check + destructive round trip | kept green |
| Migrations | **4** — M1 foundations, M2 training core, M3 deferrable ordering, **M4 plan time/distance targets** | kept reversible |
| Mutation checks | 11 verified catches | every guard and shared-vector change |
| Lint | `ruff` clean, enforced in CI | stays clean |
| Coverage gate | **enforced** — client at **67.5%** statements / **71.2%** lines; `src/lib/query` and `DataBoundary` held at 90%+ | 80% global by G4 (D18) |
| Acceptance criteria passing | 1 of 12 — **AC-12** | 12 of 12 |

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

