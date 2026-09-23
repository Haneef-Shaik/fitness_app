# Project Charter
## Volt — Fitness & Nutrition Tracking Platform

| Field | Value |
|-------|-------|
| Status | Active |
| Started | 2026-09-21 |
| Charter version | 1.0 |
| Source of requirements | `fitness_nutrition_tracking_BRD_data_model.docx` v1.0 |
| Live status | [09-PROJECT-TRACKER.md](09-PROJECT-TRACKER.md) |

> This document answers **why the project exists and what "done" means**.
> The [PRD](01-PRD.md) answers *what the product does*. The [tracker](09-PROJECT-TRACKER.md)
> answers *where we are today*. Keep the three separate — mixing them is how status
> reporting quietly becomes fiction.

---

## 1. Why this project exists

Serious trainees keep their data in three incompatible places: a workout logger that forgets
what they ate, a calorie app that forgets what they lifted, and memory for everything else.
The questions that actually drive training decisions therefore go unanswered — *what did I do
on my last chest day, am I eating enough protein on training days, is my weight responding to
the target I set six weeks ago.*

Existing apps optimise for **capture** and neglect **retrieval**. Volt optimises for both:
capture fast enough to happen between sets, and a data model structured enough that six months
of it answers analytical questions without reprocessing.

## 2. Project goals

Delivery goals, distinct from the product metrics in [PRD §6](01-PRD.md#6-goals--success-metrics).

| # | Goal | Success criterion | Verified by |
|---|------|-------------------|-------------|
| G1 | Ship a usable MVP on **iOS and Android** | A trainee can log a full session and a full day of food, offline, on their own phone | Manual run on a real device |
| G2 | The data model survives contact with reality | Every one of the twelve BRD §22 queries is answerable in the shipped UI | [07-TRACEABILITY §3](07-TRACEABILITY.md) |
| G3 | The critical path is genuinely fast | p95 tap-to-set-rendered < 100 ms; a set commit never awaits the network | Instrumented `session.set_committed.interaction_ms` |
| G4 | AI never becomes the source of truth | Raw AI output and confirmed nutrition are separable in the database and visibly distinct in the UI, at all times | AC-10 integration test |
| G5 | Nothing silently disagrees | Client and server derived metrics are pinned by shared test vectors; CI fails on drift | `contracts/vectors/domain.json` in both suites |
| G6 | The specs stay true | A behaviour change updates the doc in the same change; no doc describes something that is not the case | Review; the doc set is the review surface |

## 3. Non-goals

Stated so they can be refused without re-litigating:

- **A web app.** Deferred, not cancelled. `packages/domain` stays framework-free so a web
  surface remains cheap later.
- **Social features.** No feed, friends, leaderboards or sharing.
- **Coach accounts.** Phase 2. The authorization layer is written so this becomes a policy
  change, but nothing is built for it now.
- **Meal planning and grocery lists.** Out of scope entirely.
- **Payments, subscriptions, any paywall.** No pricing surface at MVP ([PRD Q6](01-PRD.md#13-open-questions)).
- **Medical or clinical claims.** The product shows estimates and never advises.
- **Offline-first sync of every entity.** MVP covers durable workout logging and a write
  outbox. Full bidirectional sync is Phase 2.

## 4. Definition of done

Applied at three levels. A thing is not done until its level passes.

### A task is done when
- [ ] Tests written first, and they fail before the implementation exists
- [ ] All tests pass, and a deliberate mutation of the implementation makes them fail
- [ ] Errors are handled explicitly — no silently swallowed failure
- [ ] The spec doc is updated in the same change if behaviour changed
- [ ] No hardcoded values that belong in config

### A milestone is done when
- [ ] Its acceptance criteria in [07-TRACEABILITY §2](07-TRACEABILITY.md) pass end-to-end
- [ ] The flow has been **run**, not just unit-tested — against a real database
- [ ] Empty, error and offline states exist for every screen it adds
- [ ] The tracker is updated with what actually shipped, including what was cut

### A release is done when
- [ ] All twelve acceptance criteria pass
- [ ] NFR budgets in [PRD §9](01-PRD.md#9-non-functional-requirements-brd-19) are measured, not assumed
- [ ] Accessibility pass: keyboard-only logging, screen-reader pass on diary and logger
- [ ] Data deletion and export work end-to-end

## 5. Working agreements

| Agreement | Why |
|-----------|-----|
| **Verify, don't assert.** A claim that something works is backed by running it | Four real bugs in the Expo setup were invisible to code review and only appeared on `expo start` |
| **Test the guard, not just the path.** Mutate the implementation to prove the test can fail | A vacuous test is worse than no test — it buys false confidence |
| **Docs are the spec, code is the implementation.** Change the doc first when the behaviour changes | Two platform changes (RN, FastAPI) invalidated documented decisions; they were corrected before code was written against them |
| **Formulas live in one definition, two implementations.** Pinned by shared vectors | The offline logger must compute locally; the server is authoritative. Drift means a user's summary changes after sync |
| **Estimated never looks like confirmed** | The distinction is enforced in the schema *and* in the UI, not one or the other |
| **No cloud.** All deliverables are local files in this repo | User instruction, 2026-09-21 |

## 6. Decision log

Decisions that shaped the build. Reversing one is a project-level change, not a refactor.

| # | Decision | Date | Rationale |
|---|----------|------|-----------|
| D1 | **React Native (Expo)** for iOS + Android; web deferred | 21 Sep | User: "our main platform would be android and ios". Expo because no local Xcode/Android SDK is needed to develop on a real device |
| D2 | 5-tab bottom nav; left rail at ≥1024 px | 21 Sep | Thumb reach during workouts |
| D3 | **PostgreSQL** primary store | 21 Sep | BRD §10/§11/§22 are entirely relational analytics |
| D3a | **Python 3.13 + FastAPI**, not Node/Fastify | 21 Sep | User decision |
| D3b | Contract via **OpenAPI from Pydantic** → generated TS types | 21 Sep | Shared Zod schemas only worked when both sides were TypeScript. **Closed 22 Sep (G1):** `packages/api-types` is generated by `openapi-typescript` and gated in CI. Closing it required a server change first — every route returned a bare `JSONResponse`, so FastAPI documented no response shape at all and the contract covered request bodies only |
| D3c | Domain formulas implemented twice, pinned by **shared JSON vectors** | 21 Sep | Offline logger computes locally; server is authoritative |
| D4 | Offline MVP = durable session + write outbox; full sync is P2 | 21 Sep | Full bidirectional sync is a separate project |
| D5 | Only `confirmed = true` meal items count toward analytics | 21 Sep | BRD §12.9 |
| D6 | Warm-ups excluded from volume and PRs, user-toggleable | 21 Sep | Warm-ups corrupt progression trends |
| D7 | Muscle volume weighting: primary 1.0, secondary 0.5 | 21 Sep | BRD §10 left the default unspecified |
| D8 | Epley as default e1RM, stored as `epley_v1` | 21 Sep | BRD §10 example; version stored so history stays reproducible |
| D9 | **Iris** (`#B0A4FF` / `#5A31C4`) as the single accent | 21 Sep | Chosen by CVD separation sweep, not taste. Lime measured ΔE 0.3 from series green — an accessibility failure |
| D10 | Refresh token in the device keychain, not an httpOnly cookie | 21 Sep | Native apps cannot use cookies; rotation + family revocation replaces that protection |
| D11 | `max_reps` PR = most reps in a single working set, **any load** (closes Q3) | 21 Sep | A fixed-load definition needs a reference load the user never sets; "any load" is what a lifter means by a rep PR |
| D12 | `volume` PR = best **single session** for that exercise, not a lifetime total | 21 Sep | A lifetime sum only ever rises, so it is not a record. The other three types are per-set bests |
| D13 | Ordering constraints are `DEFERRABLE INITIALLY DEFERRED`; the idempotency constraint stays immediate | 21 Sep | Densifying an ordered list walks rows through values their neighbours still hold. The idempotency key stays immediate so a race surfaces as a friendly 409 inside the handler, not a 500 at commit |
| D14 | **`expo-sqlite`** holds the session draft and the write outbox | 22 Sep | An outbox needs an **atomic dequeue** — mark an entry sent *and* move the draft's sync state in one transaction. A torn pair is a duplicate set or a lost one, so a key-value store is not enough: `AsyncStorage` is in Expo Go but has no multi-write atomicity, and `react-native-mmkv` is **not** in the SDK 52 Expo Go module set at all, so it would need the dev build [DR4](#7-delivery-risks) rules out. **Checked, not assumed** (22 Sep): `node_modules/expo/bundledNativeModules.json` for the installed SDK **52.0.49** pins `expo-sqlite ~15.1.4`; Expo's own SDK-52 native-module list returns the same range among the **114** modules in Expo Go (and confirms `react-native-mmkv` is absent); the published `expo-sqlite@15.1.4` exposes `withTransactionAsync` and `withExclusiveTransactionAsync`. Schema and the draft-as-blob / outbox-as-rows reasoning: [03 §5.3](03-FRONTEND-ARCHITECTURE.md). **Amended 22 Sep (G3):** installing it revealed `"platforms": ["apple", "android"]` — there is **no web build**, and importing it on web crashes the app. The decision stands for the shipping platforms, but it is still **unproven on hardware**: no device exists yet and web cannot run it. `src/lib/db` is therefore an interface with a SQLite implementation and an in-memory one, both held to the same contract suite. **G4 is where D14 stops being a reading of a manifest and becomes a result.** **Confirmed 22 Sep (G4)** on a Samsung SM-E546B: `[db] open (sqlite) journal_mode=wal` — the module loads, the database opens, and WAL (which G0 declined to claim) is what it actually runs. A draft written to it survived a force-quit and a relaunch. |
| D15 | **Maestro** is the E2E runner, driving **Expo Go** over the LAN | 22 Sep | Playwright drives a browser and cannot see a native app. Detox needs a custom native build, and `xcodebuild` on this machine resolves only to Command Line Tools — **no iOS build can be produced here at all**. Maestro runs YAML flows against Expo Go with no native toolchain, which is the one configuration DR4 leaves available. **Correction to DR4's stated premise:** an Android SDK *is* present locally (`/opt/homebrew/share/android-commandlinetools`, build-tools 35/36, platform android-36, NDK 27) but is unconfigured (`ANDROID_HOME` unset) with no device attached; the iOS half of DR4 stands unchanged. **Confirmed 22 Sep (G4)**: Maestro 2.10.0 drives Expo Go on a physical Android device over the LAN with no native toolchain, so **H0.3 holds** — five flows and some twenty device runs, none of which needed a build. Two things the decision did not anticipate, both now recorded in `apps/mobile/.maestro/README.md`: a **system dialog** (the phone's password manager) masks the whole app out of the accessibility tree while it is up, and `setAirplaneMode` does **not** take this device offline, because Wi-Fi stays enabled. |
| D16 | Client performance budget is **tap → set rendered p95 < 100 ms**, **cold start → dashboard interactive < 2.5 s** (mid-tier Android), and a **tracked-but-uncapped** JS bundle | 22 Sep | The previous budget was written in LCP, INP, gzipped bundle size and Server Component boundaries — a phone answers none of those and a React Native build produces none of them. The one metric that survives the platform change is tap → set rendered, because it was never about the platform: it is [03 §1](03-FRONTEND-ARCHITECTURE.md)'s constraint expressed as a number. **G4** (H4.3) measures it on real hardware; until then it is a budget, not a result |
| D17 | The client's response envelope is **declared** to FastAPI via a generic `Envelope[T]` `response_model` on every route | 22 Sep | The envelope is built at runtime by `ok()`/`fail()`, which return `JSONResponse` — so FastAPI had nothing to infer and the OpenAPI document contained **no response shapes at all**. A drift gate over request bodies alone would have let a renamed response field through silently, which is most of what the client reads. The `*Out` models already existed and were already used; they were simply never shown to FastAPI. Documentation only: FastAPI skips response validation when a handler returns a `Response` directly, proven by the suite holding at 133 passed / 3 skipped either side of the change |
| D18 | Client coverage is a **ratchet**, not a number: `src/lib/query` and `DataBoundary` are held at 90%+, the remainder is pinned just under today's figure | 22 Sep | The client went 0% → 63.7% statements in one goal. Pinning the house 80% floor immediately would have meant either weakening it within a week or blocking G2 on testing pre-existing screens. Holding **new shared code** high is what actually prevents the floor rotting, and the remainder rises as `session.tsx` and `ui/index.tsx` get covered. The intent is 80% global by **G4**, when the critical path is proven |
| D19 | **No third-party state library.** `src/lib/store/createStore.ts` — about 50 lines over React's own `useSyncExternalStore` | 22 Sep | Zustand was tried at v5 and then v4; both crashed the app the moment a component subscribed, with React resolving to `null` inside the library. That is the same failure `@shopify/flash-list` produced in G2, and the common factor is a dependency reaching for React through its own import under Metro's web bundling. Web is the only target this project can run (DR4), so a library that breaks it is unusable here whatever it does on a device. The reducers were always where the logic lived and did not change when the store did — which is what keeping them pure bought |
| D20 | The client's **`Idempotency-Key` is a real RFC 4122 v4 UUID**, generated once at commit | 22 Sep | The server types the header as a UUID and rejects anything else with a 422. A timestamp-random string passed every unit test — they used readable keys — and failed only against the live API, where it looked like "the set logged fine and never uploaded", the worst shape of bug on this path. The format is now part of the contract and is asserted (**I8**) |
| D21 | **`meals.meal_type` is a category slug, not a Postgres ENUM**, and `meal_categories` owns the label | 23 Sep (G7) | H-16 lets a user add "Pre-workout", so a four-value enum would make a new category a migration and would reject a row the application accepts. Meals reference the **slug** with no FK, so the slug outlives its category being deleted — the same reasoning as `display_name` on a meal item. The split is what makes a rename free and a delete refusable: a category with meals behind it is **hidden, never deleted** (409). Recorded in [02 §4.2](02-SYSTEM-ARCHITECTURE.md). The enum was dropped from the M5 migration before it shipped, and the migration round-trips clean |
| D22 | **A recipe is a plan; logging it snapshots.** `recipe_items` reference a live `food_id` and hold no macros | 23 Sep (G7) | Correcting a food should change what a recipe will make next time and nothing it already made. That is invariant 4 / **AC-12/I1** one level up, and it is the same shape as `program.changed` not invalidating sessions. Asserted directly: log a recipe, quadruple it, and the logged meal's macros are unchanged |
| D23 | **The AI provider is Anthropic Claude** (`claude-sonnet-5`), reached through `app/ai/gateway.py`'s `AIGateway` Protocol — and the **default provider is a stub** | 23 Sep (G8) | The gateway is an interface first and a provider second, the same shape Q1's resolver uses: the suite never makes a network call, `git clone` → `pytest` → run the app needs no key at all, and a developer opts *in* to spending money. Claude was chosen for the vision-plus-tool-schema combination the food contract needs in one call. `AI_API_KEY` is read from the environment, validated at startup when the provider is not the stub, and never logged, returned or stored. Switching provider is a change to `app/ai/provider.py` and nothing above it |
| D24 | **The model contract is versioned** — `food_analysis.v1`, stored on every analysis row | 23 Sep (G8) | A response whose `schema_version` is not a version we know is a **failure**, never something to parse as far as it goes: a v2 payload read as v1 is how a confidence figure becomes a calorie count. Storing the version per row means a v1 analysis stays readable after v2 ships, which matters because these rows are append-only and will outlive several schemas |
| D25 | **The job queue is Postgres** (`FOR UPDATE SKIP LOCKED`), and the worker is a **separate process** | 23 Sep (G8) | A model call takes seconds and sometimes takes the timeout. Doing it in a request handler means one slow plate photograph occupies a worker a set-commit needs, and **I14** stops being true the first time the provider is slow. A broker to run one job type would be infrastructure bought on credit; SKIP LOCKED is the correct primitive and the database is already there. Verified with two real processes against an unreachable provider — `scripts/verify-containment.sh` |
| D26 | **Object storage is an interface with a local-filesystem implementation** | 23 Sep (G8) | [02 §5](02-SYSTEM-ARCHITECTURE.md) draws S3 with signed PUTs from the phone. The charter's standing rule is **no cloud**, so what ships is the same shape locally: `ObjectStore` Protocol, `LocalObjectStore`, and HMAC-signed expiring URLs that cover the key, the content type, the declared size and the owner. S3 becomes one more implementation |
| D27 | **`daily_summaries` is invalidated on write and recomputed on read** — never updated in place | 23 Sep (G9) | Updating a summary row means two pieces of code computing the same number — the one that wrote the meal and the one that computes a day — and only one of them being right. Deleting the row says "this is unknown again" and lets the single compute path answer. A missed invalidation then shows up as a *stale* figure that the cross-check catches (the dashboard's nutrition is asserted equal to `/nutrition/day`, which always computes fresh) rather than as a subtly wrong one nothing compares against. The row carries no `updated_at`, because it is never edited |
| D28 | **A timezone change re-files history** (edge case T4) | 23 Sep (G9) | `workout_sessions.local_date` has carried a comment since M2 saying it is "recomputed for the affected rows when a user changes their profile timezone". It was not, until G9 found it while proving **I7** for the dashboard. `app/services/timezone_change.py` recomputes `local_date` for sessions, meals and body metrics in one statement per table and drops every cached summary. The **instants are untouched** — a workout happened when it happened, and only the day it is filed under moves |
| D29 | **Device preferences live in a local JSON file, not on the server and not in the keychain** | 23 Sep (G9) | B-02's dashboard layout and I-06's tracked fields are preferences, not facts about the user: no round trip, no column, no migration, and no second device silently rearranging the first. The keychain (`storage.ts`) is for secrets — putting a card order in it would be slower, semantically wrong, and would bury a real secret in noise. A stored layout is **merged** with the known sections rather than trusted wholesale, so a card added in a later release appears for somebody who saved a layout before it existed |

## 7. Delivery risks

Distinct from the product risks in [PRD §12](01-PRD.md#12-risks).

| # | Risk | Impact | Mitigation | Status |
|---|------|--------|------------|--------|
| DR1 | ~~No migrations~~ | Any real data becomes unmigratable | Alembic landed 21 Sep. The test suite **runs the migrations** rather than `create_all`, and `alembic check` fails the build on model drift | 🟢 Resolved |
| DR2 | Nutrition provider undecided ([Q1](01-PRD.md#13-open-questions)) | **Downgraded 23 Sep (G7).** No longer blocks M5: the nutrition core ships on the internal catalog, and **AC-07 is proven** without a provider. What remains blocked is **coverage** — branded products, barcode lookup (H-17) — and the licensing/attribution obligation a third-party catalog brings | Done, and it worked: `app/food/resolver.py` is a Protocol (`search`/`resolve`), `InternalCatalogResolver` implements it over 22 seeded foods, a test double is substituted in the suite, and **no route or screen imports a concrete resolver**. A provider becomes one more implementation | 🟡 Open — **narrowed** |
| DR3 | ~~No CI~~ | The cross-language guard only works if it runs | GitHub Actions landed 21 Sep: both suites, migrations, lint, and a check that neither suite stops loading the shared vectors | 🟢 Resolved |
| DR4 | Device testing unverified — **no Xcode** locally (`xcodebuild` resolves to Command Line Tools only). An Android SDK *is* installed but unconfigured, with no device attached | LAN connectivity and native behaviour untested | Expo Go on a physical device, driven by **Maestro** ([D15](#6-decision-log)) — a runner that needs no native build, so the missing Xcode no longer blocks E2E | 🟢 **Resolved 22 Sep (G4)** — driven end to end on a **Samsung SM-E546B, Android 16**, through Expo Go over the LAN. `defaultBase()`'s `hostUri` derivation is confirmed **executing**: Metro had been started with `EXPO_PUBLIC_API_URL` set, which returns early, so the branch had still never run — it was restarted without it (laptop `192.168.1.3`, phone `192.168.1.4`) and sets reached Postgres in 12–21 ms. Had the derivation failed it would have returned `localhost:8000`, which on a phone is the phone. **One limit remains, and it is structural:** Expo Go reloads its bundle from Metro over the same LAN, so logging offline and then relaunching cannot be expressed — a relaunch with the network down cannot load the app at all. G4 proves that path by taking the **API** away while Metro stays up; proving it with the radio off needs a development build, which is [H0.3](10-EXECUTION-GOALS.md#3--the-handoff-ledger)'s premise to revisit |
| DR5 | Scope pressure from 103 designed screens | Designing everything invites building everything | `[P2]` screens are hidden or explicitly "soon", never half-built | 🟢 Controlled |
| DR6 | Two-language domain drift | User-visible inconsistency after sync | Shared vectors + mutation testing | 🟢 Controlled |

## 8. Who decides what

| Area | Decider |
|------|---------|
| Product scope, priority, what ships | **User** |
| Platform and stack choices | **User**, recorded in §6 |
| Architecture within the chosen stack | Implementation, documented and open to challenge |
| Visual design direction | **User** chooses direction; execution and accessibility floors are non-negotiable |
| Accessibility and data-integrity floors | Not negotiable — they are in the Definition of Done |

## 9. Open decisions blocking progress

Each has a working default so nothing is stalled, but each should be confirmed.

| # | Question | Blocks | Working default |
|---|----------|--------|-----------------|
| Q1 | Nutrition database provider | **No longer blocks M5** (closed for the core by the resolver, 23 Sep). Still blocks **food coverage** — barcode lookup (H-17), branded products, and the licensing/attribution requirement that comes with a third-party catalog | Resolver interface + seeded internal catalog of **22 foods**. `FoodResolver` is a Protocol with `InternalCatalogResolver` behind it and a test double beside it; `_resolver()` in `app/api/routes/nutrition.py` is the **only** place a concrete resolver is named, so answering Q1 is one function, not a rewrite |
| Q3 | Is "max reps" a PR at any load? | M4 | Most reps in a single working set, any load |
| Q5 | ~~Which weigh-in is canonical when there are several in a day?~~ **Closed 23 Sep (G9)** | — | **The first of the day**, implemented and asserted: `body_metrics` has no unique constraint per day (a second weigh-in really happened), and the *read* takes the earliest `measured_at` — earliest measured, not earliest written |
| Q8 | Are calorie targets versioned over time? | H-01 past days, G-06 | Not versioned; past days render consumed-only when the target changed after them |
| Q9 | Minimum age / legal position | A-07 | 13+, needs legal confirmation |
