# Launch Plan — from "release gate passed" to "live in both stores"

**Written:** 2026-09-26 · **Status source:** [09-PROJECT-TRACKER.md](09-PROJECT-TRACKER.md) · **Leftovers it absorbs:** [TODO.md](TODO.md)

M0–M8 are done: every BRD §20 MVP line has a working path, 12 of 12 acceptance criteria pass, and
the critical path is fast on a real Android phone. What stands between that and a published app is
this file — requirement gaps the UI still has, the account and legal surface every store demands,
hosting, the iOS build that has never been produced, and the content (foods, exercises) a user
compares against the apps they already have.

**How to read it.** Phases run roughly in order; items inside a phase are independent unless noted.
Each item says **who** (`You` = the owner — accounts, money, legal, decisions; `Build` = code) and
**Done when** — the evidence that ticks it, in the spirit of [charter §4](08-PROJECT-CHARTER.md#4-definition-of-done).
Tags: **[Launch]** must ship before publishing · **[v1.1]** fast follow, strongly recommended ·
**[Later]** BRD Phase 2.

---

## Phase 0 · Decisions the owner must make first

Everything else has a working default; these do not, and several phases wait on them.

| # | Decision | Recommendation | Blocks |
|---|----------|----------------|--------|
| L1 | **Database host** | Supabase (Pro) as managed Postgres 16 **and** Storage for photos. Keep FitLog's own auth and API — do not adopt Supabase Auth, RLS or direct client writes (they bypass the outbox and the server's authoritative recompute) | Phase 4 |
| L2 | **API + worker host** | Railway, Fly.io or Render — two processes (API, worker), HTTPS, same region as the database | Phase 4 |
| L3 | **Transactional email** | Resend or Postmark | A-05, A-06 |
| L4 | **Food data for v1** | Keep Q1 ("internal catalog, grown by seed") but **seed it from USDA FoodData Central + IFCT** instead of 22 hand-typed foods | Phase 6 |
| L5 | **Barcode scanning (H-17)** | Reopen Q1: it is table stakes in every nutrition competitor. Open Food Facts (ODbL, needs attribution) | Phase 6 |
| L6 | **Paid tier (Q6)** | Every AI photo analysis costs money. At minimum a free monthly AI quota; ideally a subscription via RevenueCat | Phase 8, K-08 |
| L7 | **Launch scope** | Which **[v1.1]** items move into **[Launch]** | Phase 6 |
| L8 | **Brand / name check** | Confirm "FitLog" is free as a store name and trademark in your markets before buying assets | Phase 7 |

---

## Phase 1 · Housekeeping — carried over from TODO.md

- [ ] **Push `main`** and watch the five CI jobs go green — *You* · Done when: GitHub shows the G10 commits and a green `ci.yml` run
- [ ] **Trigger `e2e.yml` once** (`workflow_dispatch`) — its first real GitHub run — *You* · Done when: green on GitHub, not just locally
- [ ] Set branch protection on `main` (CI required) — *You*

---

## Phase 2 · Close the MVP requirement gaps [Launch]

Found by reading the app code against the BRD and PRD. Each is a BRD requirement with a server
side but **no way to reach it from the app**.

### Workout logging — FR-W04, FR-C01
- [x] **Mid-session changes reach the server** *(found while building E-06 — a data-integrity bug, not in the original list)*. Deleting a set, adding an exercise mid-workout, set edits and notes changed the draft on the phone only: a deleted set was still counted in the finished workout's volume, and every set logged against an exercise added mid-session **never left the phone**. Each is now an outbox write keyed by the phone's own ids (`POST /workout-sessions/{id}/exercises` with a client `id`, `PATCH`/`DELETE /workout-sessions/{id}/sets/by-client/{client_id}`, idempotent on replay), and **Finish waits** until the queue for the session has landed instead of closing the workout ahead of its last sets — *Build* · Evidence: `tests/test_offline_session_writes.py` (8), `sessionSync.test.ts` (7), `sessionController.test.ts` (+4), `sessionScreen.test.tsx` (+2)
- [x] **E-06 Advanced Set Editor** — set type (warm-up / working / drop / failure, with what each does to volume and records), RPE and RIR that suggest each other (`RIR ≈ 10 − RPE`) without overwriting, and a per-set note. Opened from **More** for the next set, or by tapping a logged set to edit or delete it. F-03 now shows type, effort and every note — *Build* · Evidence: `advanced.test.ts` (9), `sessionScreen.test.tsx` E-06 block (4), `historyDetailScreens.test.tsx` (+1); server stores `rpe`/`rir`/`note`/`set_type` via the same set endpoints
- [x] **E-07 Session Notes** — workout notes with the quick-tag chips, and per-exercise notes, queued offline like everything else and shown in F-03 — *Build* · Evidence: `sessionScreen.test.tsx` E-07 block (2), `sessionSync.test.ts` notes block (2)
- [x] **K-04 Logging Preferences** — `/settings/logging`: count warm-ups in volume (D6; **recounts every past workout's stored total** and the daily summaries), RPE / RIR on the logger, default rest when the plan sets none, load step, bar and plate inventory. Migration `m9` (reversible, server defaults keep existing behaviour); the warm-up rule is one flag through `app.domain.training` and `@fitlog/domain`, pinned by a new shared vector — *Build* · Evidence: `tests/test_logging_preferences.py` (14), `contracts/vectors/domain.json` (+1 case, both suites), `preferencesScreens.test.tsx` K-04 block (4), `sessionScreen.test.tsx` K-04 block (4)
- [x] **Change the plan mid-workout** *(BRD §5.1 — "allow adding, skipping or reordering exercises"; only adding existed)*. An **Options ⋯** menu on the logger: skip (keeps what is logged), move earlier / later, swap (E-05; only while nothing is logged), remove (asks first, naming the sets), notes and the exercise's history. Every change is an ordered outbox write, so it works offline — *Build* · Evidence: `sessionSync.test.ts` (+5), `sessionScreen.test.tsx` (+4)
- [x] **E-12 Plate Calculator** — per-side plates for the entered load from the user's bar and plates; exact search rather than greedy (finds 15 + 15 where heaviest-first stops at 25), nearest achievable load offered with **Use it** when exact is impossible, pounds with a 45 lb bar and pound plates — *Build* · Evidence: `plates.test.ts` (8: 100 kg → 25 + 15 a side; 225 lb → 45 + 45), `sessionScreen.test.tsx` (+2)

### Settings and system states
- [x] **K-03 Units, Locale & Timezone** — `/settings/units`: units, time zone (with "use this phone's") and week start, warning before a zone change re-files past days — *Build* · Evidence: `preferencesScreens.test.tsx` K-03 block (2)
- [x] **L-04 Not Found** — `app/+not-found.tsx`; a deleted record keeps its owning screen's empty state — *Build* · Evidence: `notFound.test.tsx`
- [x] **L-05 Session Expired** — when the server ends a session mid-use, a password prompt appears **over** the current screen (nothing navigates away); signing back in carries on and releases queued writes. Offline is still never treated as signed out — *Build* · Evidence: `apiRefresh.test.ts` (+2), `session.test.tsx` (+2), `sessionExpired.test.tsx` (4)
- [x] **L-06 Permission Primer** — FitLog's own explanation before the OS asks for camera, photos or notifications; a permission the OS will not ask about again points to Settings — *Build* · Evidence: `aiNutritionScreens.test.tsx` (+2), `shellScreens.test.tsx` (+1)
- [x] **L-08 Maintenance / AI degraded** — `GET /v1/status` (unauthenticated); `MAINTENANCE_MODE` turns every call but health/status into an explained 503; "AI degraded" is **observed** (≥ 5 analyses in 15 min, ≥ 50 % failed at the provider — a photo with no food doesn't count). The app shows a dismissible maintenance screen (logging still works) and a notice on the photo and describe screens — *Build* · Evidence: `tests/test_service_status.py` (6), `serviceNotices.test.tsx` (4)

- [x] **Re-walk all 12 acceptance criteria** on a release build — *Build* · Evidence (26 Sep): release APK on **Expo SDK 57** in the emulator — **AC-01, 02, 04, 05, 07, 08, 09, 10, 11 and the offline flow all green**, each on the screen *and* in the database (`scripts/e2e.sh`). The offline flow is the proof of the outbox FIFO fix: set 2 backing off while set 3 was due used to send set 3 first. Two flows were made catalog-independent (AC-01 now narrows to Chest), and the demo seed was fixed. AC-03, 06 and 12 rest on API tests by nature. **Left:** the same run on iOS once the first iOS build exists

---

## Phase 3 · Accounts, security and privacy [Launch]

Every store rejects apps without these, and users cannot recover their accounts without them.

- [ ] **A-05 Forgot / Reset Password** — *Build side done*: `POST /v1/auth/password/forgot` answers the same 200 whether or not the account exists (lookup and mail happen after the response, so timing says nothing either), one mail a minute per account; `/reset` is single-use, 30-minute, hashed at rest, and signs every device out. Screens `forgot-password` / `reset-password` (deep link `fitlog://reset-password?token=` or paste the code), "Forgot password?" on login; rate-limited per address and per email typed. An `EmailSender` protocol: `console` (default, dev/test) and `resend` (production refuses `console`) · Evidence: `tests/test_password_reset.py`, `tests/test_email.py`, `resetPassword.test.tsx`, `forgotPassword.test.tsx`, `test_rate_limits.py` (+3) · **Left for the owner (L3):** a Resend account, a verified sending domain and `EMAIL_FROM`; then the loop through a real inbox
- [x] **A-06 Verify Email** — a link on sign-up (24 h, hashed), `POST /v1/auth/email/verify` (no sign-in needed — links open on other devices), resend with a 60-second cooldown, `email_verified` / `pending_email` on `/auth/me`, a one-row "Verify your email · Resend" in Settings. **Decision taken for now:** an unverified account keeps full use of the app (nothing locks) — the owner can tighten it — *Build* · Evidence: `tests/test_email_verification.py`, `verifyEmail.test.tsx`
- [x] **K-02 Account & Security** — `/settings/security`: change password (keeps this device with a fresh pair, signs out the rest), change email (applies only when the new address's link is opened; the old address is told both times), sign out other devices (access tokens carry a session id). A review found and closed an email-change link surviving a password reset, and a refresh racing a revoke — *Build* · Evidence: `tests/test_account_security.py`, `securityScreen.test.tsx`
- [x] **K-07 Data & Privacy screen** — `/settings/privacy`, three taps from Settings: download my data (JSON via the share sheet), delete my uploaded photos, delete my account (typed DELETE + password, **password in the body**, not the URL). Afterwards the phone clears that account's workout, queue, reminders and export copy. Deletion lives in one place (`app/services/account.py`) and empties the user's bucket folder too; the export now also carries logging preferences, supersets, RIR/notes/time/distance per set and feedback — *Build* · Evidence: `tests/test_account.py`, `tests/test_object_store.py`, `privacyScreens.test.tsx`
- [ ] **Web page for account deletion** — *Build side done*: `GET/POST /account/delete` on the API, a self-contained accessible HTML form using the same deletion code, rate-limited, unframeable, no cookies (so no CSRF surface) · Evidence: `tests/test_web_account_delete.py` · **Left for the owner:** the public HTTPS URL once hosted (`PUBLIC_BASE_URL`), entered in Play Console
- [x] **K-10 About & Legal** — `/settings/about` and `/settings/licences` (generated from `package.json` by `scripts/licences.mjs`; a test fails if a dependency is added without regenerating), the "estimates, not medical advice" statement, tappable Terms/Privacy on the welcome screen. **Draft** policy and terms served at `/legal/privacy` and `/legal/terms` with a DRAFT banner and `[OWNER: …]` markers for undecided points — *Build* · Evidence: `privacyScreens.test.tsx` (About block), `licences.test.ts`, `tests/test_legal_pages.py`
- [x] **Rate limiting** — Postgres-backed fixed windows (shared by every API instance, `m16`), per address and per account, with `Retry-After`: login, register, refresh, password reset, email verification, account deletion (app and web), AI, imports, feedback. `X-Forwarded-For` is trusted only for `TRUSTED_PROXY_COUNT` hops. Sign-in also costs the same time for an unknown email as for a wrong password (no enumeration by timing) — *Build* · Evidence: `tests/test_rate_limits.py` (the 11th login in a minute is a 429; windows reset; every protected route listed and driven to its 429), `tests/test_auth.py` (+1)
- [x] **K-08 AI Preferences + per-user AI quota** — `/settings/ai`: today's analyses used / limit and when it resets (the quota now resets at the user's local midnight, not UTC), who receives photos and with which model, what low confidence means; `GET /v1/food-analysis/settings`. Quota size still follows L6 — *Build* · Evidence: `privacyScreens.test.tsx` (AI block), `tests/test_ai_nutrition.py`
- [x] **Lock down `/v1/admin/*` and `/metrics`** — staging and production require an `ADMIN_TOKEN` bearer (constant-time compare) and refuse to start without one; development unchanged. The new operator reads — `/v1/admin/feedback`, `/v1/admin/product-metrics` — sit behind the same guard. Every response now carries `nosniff` / `no-referrer`, and HSTS when deployed — *Build* · Evidence: `tests/test_admin_guard.py`, `tests/test_observability.py` (+2)
- [x] **Security review** of the whole launch branch (26 Sep) — *Build*. Two earlier reviews (recovery/security; privacy) found and fixed an email-change takeover, a revoke race, limiter pool exhaustion, a stranger blocking in-app deletion, an upload-key traversal and photo deletion wiping other users' files. The final whole-branch review found **0 critical, 2 high, 3 medium, 8 low — all fixed, each with a test**:
  - **High:** the Docker image trusted the caller's `X-Forwarded-For` (uvicorn `--forwarded-allow-ips '*'`), so every per-address limit could be bypassed → `--no-proxy-headers`, the app reads the proxy's appended entry via `TRUSTED_PROXY_COUNT`. A crafted exercise name made the import's regex backtrack for seconds on the event loop, and imports flushed once per row → linear bracket split, parsing in a thread pool, row and name caps, one bulk insert
  - **Medium:** database errors carried row values into logs and Sentry → `hide_parameters` on every engine plus a scrubber layer; password re-checks (change password / email) had no limit → a `reauth` policy; a misspelled `ENVIRONMENT` silently skipped every production rule → only four names accepted, and the image defaults to `production`
  - **Low:** per-account login/reset limits let a stranger lock the owner out → keyed by account *and* address, with a looser per-account total; access tokens outlived a password reset / sign-out by up to 15 min → the sign-in must still be live; another user's custom exercise could be referenced (leaking its name, blocking their deletion) → ownership-scoped; push tokens outlived sign-out → tied to the sign-in (`m17`); the legacy password-in-URL delete route → removed; no body-size cap → 413 above 12 MB; export missed custom exercises → included; unmatched paths grew metric labels without bound → one `(unmatched)` label
  - Found along the way: the rate limiter's own database engine dropped TLS and transaction-pooler settings (every login would have failed against Supabase with SSL enforced) → it now inherits the app's engine options
  - **Left for the owner (L8):** reset and verification links use the `fitlog://` scheme, which another Android app could claim; moving to https App Links / Universal Links needs the production domain (`APP_LINK_BASE` is already a setting)
- [x] **Dependency audit** — `pip-audit` on the API's locked runtime deps: **no known vulnerabilities**. `pnpm audit` after the SDK 57 upgrade: **0 high, 0 critical** (2 moderate), down from 26 high + 2 critical; the `vitest` UI-server advisory was fixed separately (`vitest` 4.1.11 + `vite` 7) — *Build*

---

## Phase 4 · Infrastructure — production environment [Launch]

Assumes L1 = Supabase and L2 = a container host. The code change is small; the operational setup is most of the work.

### Database — Supabase
- [ ] Create the Supabase project on the **Pro** plan (the free tier pauses after a week idle and has no real backups) in the region nearest your users — *You*
- [x] Connection settings for Supabase — one engine builder (`app/db_engine.py`) for API, worker and Alembic: `DB_POOL_MODE=session|transaction` (transaction mode turns off both statement caches and the client pool — 150/150 sessions through a real PgBouncer transaction pooler, against 30/150 without), `DB_POOL_SIZE` / `DB_MAX_OVERFLOW`, `sslmode=` translated for asyncpg and TLS required when deployed. Every release also revokes Supabase's default Data-API grants on `public` (`app/db_hardening.py`) — *Build* · Evidence: `tests/test_db_engine.py`
- [x] Migrations as a release step — `scripts/migrate.sh` (refuses production without `CONFIRM_PRODUCTION=1`, never prints the password), run by `deploy.yml` before each release; migrations need only `DATABASE_URL`. The chain is linear through `m16` after merging four parallel branches — *Build*
- [ ] Turn on point-in-time recovery or confirm daily backups, then **test a restore once** — *You + Build* · Done when: a restore into a scratch project shows yesterday's data
- [x] Connection budget — pool size and overflow are settings; the runbook ([12-DEPLOYMENT.md](12-DEPLOYMENT.md)) works the sum for Supabase Pro — *Build*

### Photo storage
- [x] `S3ObjectStore` behind `ObjectStore` (`STORAGE_BACKEND=s3`, Supabase's S3 endpoint), private bucket, presigned GETs only; staging/production refuse `local`. One contract suite covers both stores — 36/36 against a real S3-compatible server, including a presigned URL returning 403 after expiry. Progress photos now come with an expiring `image_url` (they were not displaying before) — *Build* · Evidence: `tests/test_object_store.py`
- [x] Account deletion empties the user's bucket folder and nobody else's — *Build* · Evidence: `tests/test_object_store.py`, `tests/test_account.py`

### API and worker
- [x] Dockerfile — one non-root image for both processes (`uvicorn` and `python -m app.worker`, D25), `HEALTHCHECK` covering both (the worker writes a heartbeat), bad production settings stop it at boot; built and run against the dev database, both reported healthy (API 75 MiB idle, worker 61 MiB, image 393 MB). CI builds and boots it on every PR — *Build*
- [ ] Deploy to the L2 host with HTTPS on your own domain (e.g. `api.<domain>`) — *You + Build*
- [ ] Production secrets in the host's secret store: `DATABASE_URL`, JWT secret (new, long, never the dev one), `AI_PROVIDER=anthropic`, `AI_API_KEY`, storage keys, email key — *You*
- [x] Health check — `/health` reports the running release so a deploy can confirm the new build is the one answering — *Build*
- [x] CD — `.github/workflows/deploy.yml`: after CI passes on `main`, build and push the image to GHCR once, migrate and release to **staging**, then **production** behind a required reviewer; every step no-ops with a notice when its secret is missing; a manual rollback can skip migrations — *Build* (the first real run needs the owner's secrets)
- [ ] Re-run `./scripts/verify-containment.sh` against staging — AI down must not touch training (I14) — *Build*

### Observability
- [x] **Crash reporting** — Sentry in the API, the worker and the app, on only when a DSN is set, `send_default_pii` off and a scrubber that strips bodies, auth headers, emails and query strings; events tagged with release and the `request_id` the user sees (one end-to-end test sends a real error and checks the single scrubbed event). Mobile uses `@sentry/react-native` with its Expo plugin; source-map upload runs only when `SENTRY_AUTH_TOKEN` is set — *Build* · Evidence: `tests/test_crash_reporting.py`, `crashReporting.test.ts`
- [ ] Scrape `/metrics` into a dashboard (Grafana Cloud or the host's own); route the evaluated alert rules to email or a phone — *Build + You*
- [ ] Uptime check on the API — *You*
- [ ] Monthly spend alerts on the AI provider and the hosts — *You*

### Environments
- [ ] **Staging** (its own Supabase project + host) that store test builds point at — *Build side done*: staging is held to production's startup rules (secrets, S3, admin token, real email), `deploy.yml` releases to it first, and the runbook [12-DEPLOYMENT.md](12-DEPLOYMENT.md) walks the owner through both environments, env vars, backups, the restore drill and rollback · **Left for the owner:** the accounts and secrets

---

## Phase 5 · Platform builds [Launch]

### Both platforms
- [x] **Upgrade Expo SDK** 52 → **57** (React Native 0.76 → **0.86**, React 18 → **19.2**, expo-router 4 → 57), one SDK at a time with `expo-doctor` clean at each step; **`targetSdkVersion` 36 / `compileSdk` 36**, read from the built APK. Breaking changes handled: `expo-file-system` moved to `/legacy` (upload, prefs, export, import), notification display flags split, Metro's monorepo defaults, `StyleSheet.absoluteFill`; new dependencies re-aligned (`@sentry/react-native` 7.11, `expo-document-picker` 57). The same upgrade carries react-native#48547 — **#15b / #28 now need their device re-test** — *Build* · Evidence: 1,221 client tests + coverage gate green, `tsc` clean, `expo-doctor` 21/21, `pnpm audit` 0 high / 0 critical, and a **release build on SDK 57** (below). The tap-to-set p95 re-measurement on a phone is still owed
- [ ] App icon, adaptive icon and splash at every required size — *You (art) + Build* · **Build side done**: `apps/mobile/scripts/make-icons.py` generates store-valid placeholders from the design tokens (1024 opaque iOS/store icon, adaptive foreground inside the safe zone, 512 Play listing icon, notification silhouette), wired through `app.config.js`. The owner's final artwork replaces the PNGs; nothing else changes
- [x] Versioning: `app.config.js` takes `FITLOG_VERSION` / `FITLOG_BUILD_NUMBER` (refuses a non-integer) and sets `versionCode` and `buildNumber` together; EAS manages them remotely (`appVersionSource: remote`, `autoIncrement`) — *Build* · Evidence: `plugins/__tests__/appConfig.test.ts` (4), `expo config --type introspect` shows `versionCode: 7` with `FITLOG_BUILD_NUMBER=7`
- [x] Store-review hygiene in `app.config.js`: `ITSAppUsesNonExemptEncryption: false` (no export-compliance question per upload); **RECORD_AUDIO and SYSTEM_ALERT_WINDOW removed** from the Android manifest and the microphone string from iOS — FitLog never uses either — *Build* · Evidence: `appConfig.test.ts`; introspected manifest has `tools:node="remove"` for both
- [x] `apps/mobile/eas.json` — `preview` (internal APK) and `production` (AAB / App Store) profiles reading EAS environments, and a `submit` profile to Play's internal track — *Build*
- [ ] `EXPO_PUBLIC_API_URL` → the production HTTPS API for store builds — *Build*

### Android
- [ ] **Play Console developer account** ($25 one-off) — *You*
- [ ] Generate the **real upload key**, store it outside the repo and back it up twice — *You*
- [x] **Build an AAB, not an APK** — `STORE=1 scripts/build-release-apk.sh` now also runs `bundleRelease` and refuses a bundle that is unsigned or debug-signed; `eas.json`'s production profile builds one in the cloud — *Build* · Evidence (26 Sep, SDK 57, throwaway upload key): `✓ store build: HTTPS API, no cleartext, signed with the upload key` and `✓ bundle … app-release.aab`; `aapt2` on the APK: `com.fitlog.app`, versionCode 1 / versionName 1.0.0 from `FITLOG_BUILD_NUMBER` / `FITLOG_VERSION`, targetSdk 36, and no RECORD_AUDIO / SYSTEM_ALERT_WINDOW. Biometric permissions (declared by `expo-secure-store`, unused) are now blocked too
- [ ] Enrol in Play App Signing — *You*

### iOS — never built so far
- [ ] **Apple Developer Program** ($99/year) — *You*
- [ ] Bundle identifier, certificates and provisioning via **EAS Build** (no local Xcode needed) — *Build + You*
- [x] `Info.plist` usage strings: camera and photo library in plain language (image-picker plugin); microphone removed; notifications need no string on iOS — *Build*
- [ ] **Prove D14 on an iPhone** — kill the app mid-set, reopen, nothing lost — `expo-sqlite` has only ever run on Android — *Build* · Done when: the offline and recovery Maestro flows pass on an iPhone
- [ ] VoiceOver pass on the logger and the diary (TalkBack was Android only) — *Build*
- [ ] TestFlight internal build — *You + Build*

---

## Phase 6 · Content and market parity

What a user switching from MyFitnessPal, MacroFactor, Hevy or Strong will judge in their first week.

### Nutrition
- [x] **[Launch] Food database** — **7,838 foods**: USDA FoodData Central SR Legacy (7,353) + Foundation (325), public domain, via a reproducible `scripts/import_usda.py` (a fresh download reproduces the committed data byte for byte); **138 Indian dishes** built from USDA records only — 32 published USDA dishes (dal, idli, dosa, biryani, sambar…) and 105 computed from written-out home recipes, each labelled an estimate and citing its source. **IFCT was not used**: its data is NIN's copyright with no redistribution licence. Ranked, typo-tolerant search on `pg_trgm` (~12 ms) with Indian aliases (atta, bhindi, karela…) — *Build* · Evidence: all 15 required searches return the intended food first (was 11/15, with dal/biryani/idli/dosa empty); the AI matcher resolves **40/40** common meal phrases correctly (was 22/40, 17 right) — `tests/test_food_search.py`, `tests/test_seed_foods.py`, `scripts/measure_food_resolution.py`; licences and attribution in [data-sources.md](data-sources.md)
- [x] **[Launch] Common portions** — ~13,500 portions from USDA's own measures plus Indian household ones (1 katori ≈ 150 g, 1 roti ≈ 40 g), shown on H-05 as one-tap presets with a "Details & source" panel — *Build* · Evidence: `nutritionScreens.test.tsx` (+H-05 cases), `tests/test_seed_foods.py`
- [ ] **[v1.1] H-17 Barcode Scanner** via Open Food Facts (needs L5; ODbL attribution in K-10) — *Build*
- [x] **[v1.1] Push when an AI analysis finishes** — H-07 offers **"Tell me when it's ready"** for a photo (through L-06's primer); the worker pushes "Your meal estimate is ready" / "Couldn't estimate that meal" after committing, via Expo's push service; tapping opens the review. Tokens move with the device between accounts, are removed on sign-out and when Expo reports them dead. Off until configured: owner runs `eas init` (project id) and sets `PUSH_PROVIDER=expo` — *Build* · Evidence: `tests/test_push.py` (5), migration `m12`, `push.test.ts` (5), `aiNutritionScreens.test.tsx` (+2)

### Training
- [x] **[Launch] Exercise library** — **297 exercises** (was 59 in the seed), each with muscles, equipment, movement pattern, tracked fields, aliases (rdl, ohp, hex bar…) and **short instructions**, shown as "How to do it" on D-02. Existing names are pinned so no history moves; three muscle groups added (traps, adductors, hip flexors) — *Build* · Evidence: `tests/test_exercise_library.py`, `exerciseDetail.test.tsx` · *Note:* the 238 new instruction texts were drafted and spot-checked, not all read line by line — worth an owner skim
- [ ] **[v1.1] Exercise media** — images or short loops (licensed or your own) — *You + Build*
- [x] **[v1.1] E-13 Supersets / circuits** — a group number on plan and session exercises (`m13`), copied at start (I1) and on repeat; linked in the plan-day editor ("Superset with next", splitting a circuit cleanly when unlinked) or mid-workout from Options. The logger goes round-robin — a set of each, then the rest timer — and labels "Superset A · 1 of 2". Also fixed on the way: duplicating a program dropped hold times and distances — *Build* · Evidence: `tests/test_supersets.py` (7), `supersets.test.ts` (6), `supersetLinks.test.ts` (5), `planDayEditor.test.tsx` (2), `sessionScreen.test.tsx` (+2)
- [x] **[v1.1] Reorder in the plan-day editor** — already present as ↑/↓ buttons (C-05, G2), which are keyboard- and screen-reader-reachable; a drag handle is a later nicety, not a gap. Mid-workout reordering added in Phase 2 — *Build*

### Switching and platform
- [x] **[v1.1] Import workouts from Strong and Hevy** — Settings → *Import workouts*: pick the CSV, see a **dry run** (which exercises matched which, what becomes a custom exercise, every skipped row and why), then import. Idempotent per workout (`m11`, unique `import_key`), placed in the user's time zone, volume and records recomputed by the domain — *Build* · Evidence: `tests/test_workout_csv.py` (7), `tests/test_workout_import.py` (5), `importScreen.test.tsx` (2)
- [x] **[v1.1] MyFitnessPal nutrition import** — the same screen, *Nutrition*: MFP exports per-meal totals, not foods, so each meal comes in as one honestly named entry ("Lunch — from MyFitnessPal") at a sensible time of day in the user's zone; idempotent through a derived `client_id`; day totals, weekly averages and H-14 work from it — *Build* · Evidence: `tests/test_nutrition_import.py` (3), `importScreen.test.tsx` (+1)
- [x] **[v1.1] K-09 Integrations** — Apple HealthKit and Google Health Connect: weight in (smart scales), workouts out. Settings → *Health integrations*: two switches, each asking the OS for only its own permission (read Weight, write Exercise — nothing else). Weigh-ins are imported on open and on demand (last 30 days the first time, then from the last import with a 48 h overlap) through the ordinary body-metric outbox, keyed by the Health record's id so a re-read never duplicates; each finished workout is written once as strength training (`clientRecordId` / `HKExternalUUID` = the session id), and a failure there never touches the finish. The phone shows an honest card where neither exists (web, older Android without Health Connect) — *Build* · Evidence: `sync.test.ts` (7), `healthScreen.test.tsx` (3), `appConfig.test.ts` (+1); **release APK in the emulator (API 34):** the switch opens Health Connect's own sheet listing exactly *Weight* (read) and *Exercise* (write), both granted, *Sync weight now* reads the real store ("No new weigh-ins"), and a workout finished by Maestro appears in Health Connect as "FitLog · Barbell Bench Press, Strength training". iOS: entitlement and both usage strings verified in the resolved config; **not yet run on an iPhone**, and weight *import* has not met a real scale — both in [TODO §2](TODO.md#2--needs-a-device)
- [ ] **[Later] Home-screen widgets, Apple Watch / Wear OS** — *Build*

---

## Phase 7 · Store listing and compliance [Launch]

- [ ] **Privacy Policy** — hosted at a public URL; covers health and fitness data, food photos sent to an AI provider, retention, deletion, the 16+ age rule (Q9), and processors (Supabase, host, Anthropic, Sentry, email) — *You* (get it reviewed)
- [ ] **Terms of Use**, including "estimates, not medical advice" (PRD guardrail) — *You*
- [ ] **Google Play Data Safety form** — must match what the app actually collects — *You + Build*
- [ ] **Google Play Health apps declaration** — required for fitness and nutrition apps — *You*
- [ ] **Apple App Privacy labels** — *You + Build*
- [ ] Content rating questionnaires (IARC / App Store age rating), consistent with 16+ — *You*
- [ ] Store assets: phone screenshots (both stores' sizes), feature graphic, short and full descriptions, keywords — *You* (screenshots can come from the Maestro flows — *Build*)
- [ ] Support email and a simple landing page (privacy, terms, deletion URL and support all live here) — *You*
- [ ] Reviewer notes and a **demo account** with data for App Review — *You + Build* · **Build side done**: reviewer notes drafted in [13-STORE-LISTING.md §7](13-STORE-LISTING.md); `scripts/seed_demo.py` now takes `FITLOG_API` / `DEMO_EMAIL` / `DEMO_PASSWORD` and refuses the public default password against an `https://` API
- [x] **Drafts for every store form** — listing copy within each store's limits, Data Safety answers mapped to what the code collects, Health apps declaration, App Privacy labels, review-guideline checklist: [13-STORE-LISTING.md](13-STORE-LISTING.md) — *Build* (the owner still submits them)

---

## Phase 8 · Monetisation and product analytics

- [ ] **Decide Q6 / L6**, then update [charter §3](08-PROJECT-CHARTER.md#3-non-goals) — it currently lists payments as a non-goal — *You*
- [ ] If paid: **K-11 Subscription** via RevenueCat, with the store products, restore purchases and a paywall placed around AI features, never around logging — *Build*
- [x] **Product metrics without a tracking SDK** — every PRD §6 target is answerable from data the service already keeps, so none of it goes to a third party and no consent banner is needed: D7 nutrition retention, D30 workout retention, AI edit rate, sessions lost — each with its definition stated in the output (`app/services/product_metrics.py`, served at `GET /v1/admin/product-metrics` behind the admin guard) — *Build* · Evidence: `tests/test_product_metrics.py` (3)
- [x] In-app **feedback / report a problem** — Settings → *Send feedback*: problem / idea / other, with the app version, platform and the **request id of the last refused call** (never its contents); stored server-side (`m10`, deleted with the account), listed at `GET /v1/admin/feedback` — *Build* · Evidence: `tests/test_feedback.py` (6), `feedbackScreen.test.tsx` (3), `apiRefresh.test.ts` (+1)

---

## Phase 9 · Beta and launch

- [ ] **TestFlight** external beta — first App Review happens here — *You*
- [ ] **Google Play closed test** — new personal developer accounts must run a closed test with **at least 12 testers for 14 continuous days** before production access. Start it as soon as Phase 5 produces an AAB that talks to staging — *You*
- [ ] Recruit 12–20 real lifters and trackers; a feedback channel; triage weekly — *You*
- [ ] Fix beta findings; re-run the acceptance suite on both platforms — *Build*
- [ ] Production release with a **staged rollout** on Play (e.g. 10 % → 50 % → 100 %) and phased release on iOS — *You*
- [ ] Launch-week watch: crash-free rate, API error rate, AI cost per active user, sign-up → first logged set — *You + Build*

---

## Phase 10 · After launch — BRD Phase 2 [Later]

Ordered by what competitors make users expect, then by how much the data model already supports it:

1. Progressive-overload recommendations (the data is all there: sets, e1RM, PR rules)
2. Exercise substitutions
3. Offline-first sync of every entity (today: durable workout logging + the write outbox)
4. Micronutrient expansion
5. Personalised nutrition recommendations (never medical claims)
6. Natural-language fitness assistant over the BRD §22 queries
7. Web app for the "Returning Analyst" persona (`packages/domain` is already framework-free)
8. Coach accounts and shared programs (the authorization layer was written for this)
9. Sleep and recovery from wearables

---

## Dated and accepted — unchanged from TODO.md

- **#15b** Shift+Tab cannot enter a text field, and **#28** TalkBack formatting spans — both close with the Expo SDK upgrade in Phase 5, which now comes **before** their 2026-12-15 date
- A workout left unfinished **before local schema v2** is dropped by the migration; its queued writes show as **Unattributed** in Sync Center
- The TalkBack pass was keyboard-driven, not touch — the iOS VoiceOver pass in Phase 5 should use touch

---

## Critical path, at a glance

```
Decisions L1–L3 ─┬─> Phase 4 infra ──────────────┐
                 ├─> Phase 3 accounts (A-05/06) ─┤
Phase 2 gaps ────┤                               ├─> Phase 5 builds ─> Phase 9 beta (Play 14-day test) ─> launch
SDK upgrade ─────┘                               │
Phase 6 food + exercise content ─────────────────┤
Phase 7 legal + listing (You, in parallel) ──────┘
```

The two long poles are **Google Play's 14-day closed test** and **the first iOS App Review** —
start both as soon as a build talks to staging, not after everything else is finished.
