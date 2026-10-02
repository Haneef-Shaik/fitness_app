# Implementation Plan — FitLog for Gyms (v2)
## From the built consumer app to a gym platform: architecture, goals G12–G30, sequencing

| | |
|---|---|
| **Implements** | [16-PRD-GYMS.md](16-PRD-GYMS.md) (PRD v2) |
| **Continues** | [10-EXECUTION-GOALS.md](10-EXECUTION-GOALS.md). Same goal anatomy, same invariants I1–I15, same working loop |
| **Strategy** | [R3 report](research/R3-gym-b2b2c-strategy.md), especially §14 (the pilot) and §15 (owner decisions) |
| **Status** | Plan. Nothing here is built. The tracker records status once G12 starts |
| **Date** | 2 Oct 2026 |

---

## 0 · How to read this plan

- **Goal anatomy.** Every goal uses the anatomy of [10 §1](10-EXECUTION-GOALS.md#1--the-anatomy-of-a-goal):
  - **Outcome**
  - **Inherits**
  - **Entry gate**
  - **Do**
  - **How**
  - **Done when**
  - **Hands off**
  - **Traps**
- **Paths are real.** They come from a read of the repository on 2 Oct 2026. Where a pattern already exists, the plan says *copy it*. Inventing a second way is the failure this project's history keeps warning about.
- **Sizes** are in **engineer-weeks (ew)**, for engineers who already know this codebase, at ±25%.
- **Team assumption:** two engineers (one leaning backend, one leaning mobile) plus the founder, who runs product, sales and the pilot.
- **Phase markers** follow the PRD: **[MVP]**, **[P2]**, **[P3]**, **[GATED]**.
- **Tracks.**
  - **Track A** is the existing store launch ([TODO.md](TODO.md), [11-LAUNCH-PLAN.md](11-LAUNCH-PLAN.md)).
  - **Track B** is the gym platform.
  - G13–G15 serve **both** tracks. They should land before the public store launch.

---

## 1 · What the codebase gives us, and what it lacks

### 1.1 Reuse — these patterns exist; copy them

| Need | Existing pattern | Where |
|------|------------------|-------|
| Response shape | `ok()` / `fail()` envelope; `AppError` subclasses; `response_model=Envelope[XOut]` on every route (D17) | `services/api/app/api/envelope.py`, `app/core/errors.py`, `app/schemas/envelope.py` |
| Lists | Keyset cursor `(timestamp, id)`, `CursorEnvelope` / `CursorMeta` | `app/api/cursor.py`, `routes/history.py` |
| Idempotent writes | `client_id` + `UniqueConstraint`; `Idempotency-Key` header (a UUID, D20); replay the existing row | `routes/sessions.py:_upsert_set` |
| Append-only records | PL/pgSQL trigger in a migration + AST guard test + one allow-listed writer | `alembic/versions/4265ed56ff6a_m6_…`, `tests/test_append_only_guard.py` |
| Integrations | A Protocol + null/recording/real implementations + `get_*()` keyed by an env setting + startup validation | `app/notify/push.py`, `app/ai/gateway.py`, `app/ai/provider.py`, `app/config.py` |
| Background work | Postgres queue with `FOR UPDATE SKIP LOCKED`, stale-lock reclaim, separate worker process (D25) | `app/worker/runner.py` |
| Rate limits | `POLICIES` + `rate_limit_<p>_ip/_account` settings + `enforce()` | `app/core/ratelimit.py` |
| Types end to end | `pnpm --filter @fitlog/api-types generate` → `schema.d.ts`; aliases in `index.ts`; CI drift gate | `packages/api-types/` |
| Client reads and writes | All hooks in one file; keys in `qk`; invalidation rules **mirrored in docs/03 §6.2** (a test enforces it) | `apps/mobile/src/lib/query/{hooks,queryKeys,invalidation}.ts` |
| Offline writes | `store.enqueue()` → outbox; delivery mapped by `kindForDelivery(path)`; Sync Center labels via `describePath()` | `src/lib/db/`, `src/lib/offline/`, `app/_layout.tsx`, `src/features/sync/describe.ts` |
| Screens | `ScreenScaffold` + `DataBoundary` + `src/ui` primitives; screen ID in the file header | `src/ui/`, `app/**` |
| Permissions | `usePermissionGate()` with `PermissionKind` and `PRIMER_COPY` | `src/features/permissions/` |
| Notification taps | `routeFor(data)` | `src/features/notifications/route.ts` |
| Product metrics | Computed from tables; no event SDK | `services/api/app/services/product_metrics.py` |
| Tests | pytest on Alembic `upgrade head`; stub AI gateway; Jest with coverage ratchet (D18); Maestro on a release APK | `services/api/tests/conftest.py`, `apps/mobile/jest.config.js`, `apps/mobile/.maestro/` |

### 1.2 Gaps — what does not exist and must be built

| Gap | Today | Consequence for the plan |
|-----|-------|--------------------------|
| **Phone-only accounts** | `provision._create` raises `Conflict` without an email; `users.email` is `NOT NULL UNIQUE`; `MeOut.email` is non-null; Supabase SMS is off | G13 changes the schema, provisioning, `MeOut` and the client |
| **Tenancy and roles** | `can()` compares `actor.id == owner_user_id` only; ~111 inline `user_id == user.id` filters | G16 adds a real policy module **for gym routes**. v1 user routes stay as they are |
| **Scheduled and generic jobs** | The worker only processes `food_analyses`; no scheduler; reminders are client-only | G16 adds a generic `jobs` table, handlers and a gym-time scheduler inside the existing worker process |
| **Messaging** | Push sends one message type; no WhatsApp or SMS; no FitLog email sender | G13 (`SmsSender`), G18 (`MessageSender` for WhatsApp) |
| **Entitlements** | One global AI quota (25 a day) for everyone; no IAP | G15 |
| **i18n** | No library; inline English; `en-GB`/`en-US` hard-coded in `src/lib/datetime/*`, `nutrition/format.ts`; English plurals in `count()`; Inter and Hanken Grotesk have **no Devanagari glyphs** | G14 builds the spine before any gym screen exists |
| **Camera scanning and location** | Only `expo-image-picker`; no `expo-camera`, no `expo-location` | G19 adds both, with primers |
| **Role-aware navigation** | `TABS` is a constant; one account per session | G16 adds a workspace switcher and `tabsFor(workspace)` |
| **Consent records** | None; legal pages are drafts | G16 (model), G18 (member API) |
| **The word "check-in"** | Already means the **body** check-in (I-02, `/v1/body/checkins`, `ReminderKey 'checkin'`) | A gym attendance event is a **`visit`** in code, APIs and tables (PRD §18) |
| **Deletion and export tests** | Assert every `user_id` FK cascades and every populated table is exported | G16 records a rule for **gym-owned** tables (FK `SET NULL`), and the tests learn it |

---

## 2 · Architecture

### 2.1 Domain model

Each table follows the existing conventions:
- UUID v4 primary keys set in Python;
- `TimestampMixin`;
- Postgres ENUMs, except for user-extensible sets (D21);
- money in **`BIGINT` paise**.

**"Gym-owned"** means the row belongs to the gym's records (the gym is the data fiduciary). Its FKs to `users` are `ON DELETE SET NULL`, never `CASCADE` (rule D41, G16).

```
organizations        id · name · owner_user_id→users (SET NULL) · billing fields [P2]
gyms                 id · org_id→organizations · public_id (short, for posters) · name · address
                     lat · lng · radius_m (50–500, default 150) · timezone (default Asia/Kolkata)
                     locale (en|hi) · gstin? · logo_key? · poster_key_version · settings JSONB
                     (alert rules, freeze limit, reminder offsets, calling window) · status
staff_memberships    id · gym_id · user_id→users (SET NULL) · invited_phone · role ENUM
                     (owner|manager|front_desk|trainer) · status (invited|active|removed)
                     UNIQUE(gym_id, user_id) where active
gym_members          id · gym_id · member_code (UNIQUE per gym) · full_name · phone_e164?
                     gender? · birth_date? · is_minor · parental_consent_at? · joined_on
                     assigned_trainer_id→staff_memberships? · notes · status (derived nightly)
                     linked_user_id→users (SET NULL) · link_status (unlinked|invited|linked|declined)
                     notice_version · source (import|manual|self) · archived_at? · client_id
                     INDEX(gym_id, phone_e164): not unique, since a parent's phone may be on a minor's record (PRD §7.10)
invites              id · gym_member_id · code (6 chars, UNIQUE) · expires_at · used_at? · sent_via
membership_plans     id · gym_id · name · duration_days|months · price_paise · admission_fee_paise?
                     pt_sessions? · active
memberships          id · gym_member_id · plan_id · start_date · end_date · price_paise (snapshot)
                     status · cancelled_at? · client_id
membership_freezes   id · membership_id · from_date · to_date · requested_by · approved_by?
charges              id · gym_id · gym_member_id · membership_id? · kind (membership|admission|pt|other)
                     amount_paise · due_date · client_id
payments ⟂           id · gym_id · gym_member_id · amount_paise (negative = reversal) · method ENUM
                     received_at · received_by→staff · reference? · reverses_payment_id?
                     receipt_no (gym sequence, assigned server-side) · client_id
receipt_counters     gym_id PK · next_no (row-locked increment)
visits               id · gym_id · gym_member_id · user_id? · occurred_at · local_date (gym tz)
                     source ENUM (self_scan|workout_at_gym|manual|device)
                     verification ENUM (verified|unverified|staff|device) · distance_band?
                     import_batch_id? · client_id · UNIQUE(gym_member_id, client_id)
device_member_map    gym_id · device_user_code · gym_member_id · UNIQUE(gym_id, device_user_code)
import_batches       id · gym_id · kind (members|visits) · file_sha256 · status · counts JSONB
                     UNIQUE(gym_id, kind, file_sha256)
alerts               id · gym_id · gym_member_id · rule ENUM (R1..R4, praise) · confidence
                     local_date · rank · state · action · outcome · actioned_by?
                     UNIQUE(gym_member_id, rule, local_date)
messages             id · gym_id · gym_member_id? · channel (whatsapp|sms|push) · template_key
                     category (utility|authentication|marketing) · dedupe_key UNIQUE · status
                     provider_ref? · cost_paise? · sent_at? · error?
consents ⟂           id · user_id? · gym_member_id? · gym_id? · purpose ENUM · granted bool
                     version · collected_via · collected_by? · created_at
audit_log ⟂          id · gym_id · actor_user_id · role · action · resource_type · resource_id
                     request_id · created_at
exit_reasons         id · gym_member_id · membership_id · reason ENUM · free_text? · via
challenges           id · gym_id · kind (attendance [MVP] | volume | lift_ratio [P2]) · title
                     starts_on · ends_on · target? · prize_text · status
challenge_optouts    challenge_id · user_id
referrals            id · gym_id · referrer_gym_member_id · code · referred_phone? · status
plan_assignments     id · gym_id · template_program_id · template_version · member_user_id
                     member_program_id (the copy) · assigned_by→staff · start_date
entitlements         id · user_id→users (CASCADE: it is the user's) · product ENUM · source ENUM
                     (app_store|play_store|admin_grant|gym_seat) · status · expires_at
                     store_ref? · UNIQUE(user_id, product, source)
entitlement_events ⟂ id · provider_event_id UNIQUE · payload JSONB · received_at
jobs                 id · kind · payload JSONB · run_at · status · attempts · locked_at?
                     dedupe_key UNIQUE? · last_error?
```

`⟂` = **append-only**, enforced by a database trigger.

**Additions to v1 tables:**
- `users`: `email` becomes nullable; add `phone_e164 UNIQUE NULL`; `CHECK (email IS NOT NULL OR phone_e164 IS NOT NULL)`.
- `user_profiles`: add `locale`.
- `workout_programs`: `user_id` becomes nullable with `CHECK (user_id IS NOT NULL OR gym_id IS NOT NULL)`; add `gym_id?`, `is_template`, `template_version`, `source_assignment_id?`. Gym templates have `user_id NULL`, so they survive their author's account deletion. Templates use **catalog exercises only**; a trainer's custom exercise is copied on assignment, because `plan_exercises.exercise_id` is RESTRICT.
- `body_metrics`: add `recorded_by_user_id → users ON DELETE SET NULL` (an explicit exception in `test_every_user_owned_table_cascades_from_users`) and source `trainer`.

### 2.2 Authorization: a policy module for gym routes

The v1 `can(actor, action, owner_user_id)` stays for user-owned data. **Gym routes use a new module, `services/api/app/policy/`:**

```python
# app/policy/gym.py — shape, not final code
GymStaff = Annotated[StaffContext, Depends(gym_staff("owner", "manager", "front_desk"))]

def gym_staff(*roles: Role):
    async def dep(gym_id: uuid.UUID, user: CurrentUser, db: DbSession) -> StaffContext:
        m = await active_membership(db, gym_id, user.id)
        if m is None or m.role not in roles:
            raise NotFound()          # never 403: another gym's existence must not leak (I16)
        return StaffContext(gym_id=gym_id, user=user, role=m.role, staff_id=m.id)
    return dep

async def member_data(ctx: StaffContext, member_id, purpose: Purpose, db) -> GymMember:
    """Load a gym member *within ctx.gym_id*. For training/body/nutrition purposes, require the
    member's current consent and write an audit_log row (I17). Trainers: own members only."""
```

**Rules:**
1. Every gym route lives under `/v1/gyms/{gym_id}/…` and depends on `gym_staff(...)`.
2. Every query filters by `gym_id` **and** the id, never by id alone.
3. **The route-walker test** (`tests/test_gym_isolation.py`):
   - enumerates `app.routes` whose path contains `{gym_id}`;
   - calls each one as staff of gym B against gym A's ids;
   - asserts **404**;
   - asserts that the number of routes it tested equals the number of `{gym_id}` routes. A new route that forgets the dependency fails CI.

Member-facing gym routes (`/v1/me/…`) authorise with the existing `CurrentUser` plus `gym_members.linked_user_id = user.id`.

### 2.3 API surface (new)

All routes use the D17 envelopes, cursor pagination for lists, and `Idempotency-Key` on creates.

| Area | Routes | Goal |
|------|--------|------|
| Phone and identity | Supabase handles OTP. `POST /v1/hooks/send-sms` (Supabase Send-SMS auth hook, signature-verified). `MeOut` gains `phone`, `pro`, `workspaces` | G13, G15, G16 |
| Entitlements | `GET /v1/me/entitlements` · `POST /v1/webhooks/revenuecat` · `POST /v1/admin/entitlements` (grant) | G15 |
| Gyms and staff | `POST /v1/gyms` (creates org + gym + owner staff; only for users with `can_create_gym`, set by `POST /v1/admin/gym-creators` during the pilot) · `GET/PATCH /v1/gyms/{gym_id}` · `…/staff` (GET, POST invite, PATCH role, DELETE) · `POST /v1/me/staff-invites/{id}/accept` | G16 |
| Members | `…/members` (GET list + filters, POST) · `…/members/{id}` (GET, PATCH, archive) · `…/imports` (POST upload → preview) · `…/imports/{id}/commit` | G17 |
| Plans and memberships | `…/plans` CRUD · `…/members/{id}/memberships` (POST new or renew) · `…/memberships/{id}/freeze` · `…/memberships/{id}/cancel` | G17 |
| Money | `…/members/{id}/charges` · `…/members/{id}/payments` (POST) · `…/payments/{id}/reverse` · `…/dues` · `…/receipts/{id}` | G17 |
| Export | `POST …/exports` (job) · `GET …/exports/{id}` (signed URL) · `POST …/offboard` | G17 |
| Linking and member | `…/members/{id}/invite` (POST, resend) · `POST /v1/me/gym-links` (code or confirm) · `GET /v1/me/gyms` · `GET /v1/me/gyms/{gym_id}` (card) · `…/receipts` · `POST …/freeze-requests` · `GET/PUT /v1/me/gyms/{gym_id}/consents` · `DELETE /v1/me/gyms/{gym_id}` (unlink) | G18 |
| Messaging | `POST /v1/webhooks/whatsapp` (status, STOP, quick replies) · `GET …/members/{id}/messages` | G18 |
| Visits | `POST /v1/me/visits` (scan or workout-at-gym; queued offline) · `…/visits` (GET, POST manual) · `…/visit-imports` (upload → map → commit) · `GET …/poster` (payload + version) · `POST …/poster/rotate` | G19 |
| Retention | `GET …/calls?date=` · `PATCH …/alerts/{id}` · `GET/PUT …/alert-rules` | G20 |
| Trainer | `GET …/trainer/members` · `GET …/members/{id}/training` (consented, audited) · `POST …/members/{id}/plan-assignments` · `POST …/members/{id}/measurements` · `…/plan-templates` | G21 |
| Challenges and referrals | `…/challenges` (owner CRUD) · `GET /v1/me/gyms/{gym_id}/challenge` · `POST /v1/me/gyms/{gym_id}/referrals` | G22 |
| Reports and admin | `GET …/reports/{kind}` · `GET /v1/admin/gym-metrics` | G17 (reports), G20 (gym-metrics), G23 (extends both) |

`…` = `/v1/gyms/{gym_id}`.

### 2.4 Jobs and scheduling (extends D25; no new process)

- **A generic `jobs` table**, claimed with the **same `SKIP LOCKED` + stale-lock pattern** as `food_analyses`.
  - `app/worker/jobs.py` holds a `JobWorker` with a handler registry (`kind → async handler`).
  - `app/worker/runner.py` alternates `AnalysisWorker.run_once()` and `JobWorker.run_once()`.
- **Retries:** exponential with jitter, at most 5 attempts. The last error is recorded.
- **Scheduler:** a 60-second tick inside the worker enqueues periodic jobs per gym, idempotently via `dedupe_key`. Two worker replicas can never double-fire:
  - `nightly_status:{gym}:{date}` at 02:00 gym time;
  - `alerts:{gym}:{date}` at 07:00;
  - `renewals:{gym}:{date}` at 09:00;
  - `standings:{gym}:{date}`.
- **Job kinds (MVP):**
  - `send_message`
  - `send_invite_batch`
  - `import_members`
  - `import_visits`
  - `export_gym`
  - `offboard_gym`
  - `nightly_status`
  - `evaluate_alerts`
  - `renewal_reminders`
  - `challenge_standings`
  - `cost_report`
- **Observability:** queue depth and age by kind, from the database at scrape time (`observability/queue.py`, as today).

### 2.5 Integrations

Every integration copies the Protocol shape: null default, recording fake for tests, real implementation, and `get_*()` selection by environment variable.

| Integration | Protocol / module | MVP implementation | Notes |
|---|---|---|---|
| SMS OTP | `app/notify/sms.py: SmsSender` | **MSG91** (DLT template) called from the Supabase **Send-SMS auth hook** | Twilio fallback; local dev uses Supabase test OTPs (`[auth.sms.test_otp]`) |
| WhatsApp | `app/notify/whatsapp.py: MessageSender` | **Meta WhatsApp Cloud API**, one platform number, utility templates naming the gym (Q23) | Webhook signature `X-Hub-Signature-256`. Template registry in `app/notify/templates.py` with `category` fixed per template. **A marketing template cannot be sent to a gym-supplied number** (I22) |
| Push | `app/notify/push.py` (exists) | `ExpoPushSender` + new message types `gym_calls`, `receipt`, `challenge` | `routeFor()` branches on the client |
| Billing (member) | `app/billing/revenuecat.py` | RevenueCat webhook → `entitlements` | Client `react-native-purchases` (config plugin; needs a dev or release build) |
| Billing (owner) `[P2]` | `app/billing/web.py` | Web checkout through our own payment gateway (we are the merchant) | No purchase prompt inside the app (Play/Apple anti-steering) |
| Payment aggregator `[P2]` | `app/payments/` | Razorpay or Cashfree sub-merchant per gym; settles to the gym | We never hold funds |
| Voice AI `[P2][GATED]` | `app/ai/voice.py: VoiceAgent` | Vendor chosen in G26 | Metered minutes, consent and window checks before dialling |
| AI (new capabilities) `[P2]` | `app/ai/gateway.py` grows sibling Protocols (`WorkoutParser`, `Reviewer`, `GymAssistant`) | Anthropic via the existing httpx client; stub for tests | Each call is entitlement-checked first (I21) |

### 2.6 Mobile structure

**Workspaces and tabs:**
- `src/features/workspace/` holds the current workspace in device prefs (D29): `personal` or `gym:<id>:<role>`.
- `src/ui/shell/tabs.ts` exports `tabsFor(workspace)`:
  - **Personal** keeps today's five tabs.
  - **Owner, manager or front desk** gets *Today · Members · Fees · Visits · More*.
  - **Trainer** gets *Today · Members · Plans · More*.
- The switcher (O-01) sits under the avatar in `ScreenScaffold`'s root header.

**Routes:** flat files as today, with a dynamic segment.

| Area | Paths |
|---|---|
| Owner | `app/gym/[gymId]/index.tsx` (O-02) · `members/index.tsx` · `members/[memberId].tsx` · `members/new.tsx` · `import.tsx` · `plans.tsx` · `dues.tsx` · `visits/index.tsx` · `visits/import.tsx` · `calls.tsx` · `staff.tsx` · `settings.tsx` · `reports.tsx` · `challenges.tsx` · `export.tsx` · `coverage.tsx` |
| Trainer | `app/gym/[gymId]/trainer/*` |
| Member | `app/my-gym/[gymId]/index.tsx` (N-01) · `receipts.tsx` · `sharing.tsx` · `challenge.tsx` · `refer.tsx` · `freeze.tsx` |
| Visit | `app/visit/scan.tsx` (N-02) |
| Join | `app/join.tsx` (A-13; deep link `fitlog://join?code=`) |
| Phone sign-in | `app/phone.tsx`, `app/phone-verify.tsx` (A-11, A-12) |
| Pro | `app/pro/index.tsx` (P-01) · `app/settings/pro.tsx` (P-03) |

**Data layer:**
- `src/lib/api-gym.ts`, `api-member-gym.ts`, `api-billing.ts`.
- New `qk` families (`gym.*`, `memberGym.*`, `entitlement`).
- New `MutationKind`s **with rows in docs/03 §6.2**; the invalidation test enforces this.
- Offline writes through `store.enqueue()`, with `kindForDelivery` and `describePath` entries:
  - `/me/visits`;
  - staff payments and manual marks.

**Native modules:**
- `expo-camera`: QR scanning.
- `expo-location`: foreground only, at scan time.
- `expo-print`: the poster PDF.
- `react-native-purchases`: billing.
- `expo-sharing`: PDF and image sharing (Android's `Share` is text-only, as `src/features/privacy/saveExport.ts` notes).
- `react-native-view-shot`: share-card PNGs.
- `react-native-qrcode-svg`: the poster's QR code.

Each gets permission strings in `app.config.js`, a `PermissionKind` and `PRIMER_COPY` entry, a lazy `require`, and a Jest mock. **Expo Go cannot load `react-native-purchases`.** The billing module is feature-detected, so Expo Go still runs with Pro reported as "unavailable in this build".

**i18n (G14):**
- `src/lib/i18n/`: typed catalogs `en.ts` and `hi.ts`, `t(key, vars)`, `useT()`, locale from prefs, then profile, then device.
- **Whole-sentence keys with variables, never concatenation.**
- `src/lib/datetime/*`, `humanDate.ts`, `nutrition/format.ts` and every `toLocaleString('en-US'|'en-GB')` take the active locale.
- A Devanagari font (Noto Sans Devanagari or Mukta) is a fallback family in `theme/tokens.ts`.

### 2.7 Privacy engineering

| Requirement | Mechanism |
|---|---|
| Consent before content (I17) | `member_data(ctx, id, purpose)` checks the latest consent row per purpose. An audit row is written in the same transaction |
| Append-only (I18) | Triggers on `payments`, `consents`, `audit_log`, `entitlement_events`. Each trigger allows exactly two exceptions: (a) an UPDATE that only nulls a user FK (the `SET NULL` of D41); (b) a DELETE when `current_setting('fitlog.purge', true)` names the user or gym (set with `SET LOCAL` by account purge or gym offboarding). This avoids today's `DISABLE TRIGGER`, which takes an ACCESS EXCLUSIVE lock on shared gym tables. The AST guard allow-lists `services/account.py` and `services/gym_offboard.py` |
| No coordinates (I23) | `POST /v1/me/visits` computes the distance and stores only `verification` + `distance_band`. Request-body logging and Sentry scrubbing drop `lat`/`lng`. A schema test asserts no `lat`/`lng` columns on `visits` |
| Member deletion | `users` row deleted → gym-owned FKs `SET NULL` (link removed; gym record stays). User-owned tables cascade as today. The export includes the member's links, consents and a copy of their visits and receipts |
| Gym offboarding | `offboard_gym` job: export, then a 30-day timer, then delete gym-owned rows. Members' accounts are untouched |
| Minors | `is_minor` members are skipped by every invite, link, challenge and analytics path. A test per path (AC-27) |
| Breach response | Runbook in G23 (72-hour notification); access logs kept ≥ 1 year (Rule 6) |

### 2.8 New invariants (added to 10 §6)

| # | Invariant | Enforced by |
|---|-----------|-------------|
| **I16** | **Tenant isolation.** Every `/v1/gyms/{gym_id}` route resolves access through `gym_staff()`; another tenant gets **404** | Route-walker test (G16) |
| **I17** | **Consent before content.** Staff reads of member training, body or nutrition data pass a consent check and write an audit row | `member_data()` + tests (G18, G21) |
| **I18** | **Money is integer paise.** Payments, consents, audit and entitlement events are append-only | Triggers + AST guard (G16, G17) |
| **I19** | **The gym's day is the gym's timezone.** Statuses, alerts, reminders and standings bucket by `gyms.timezone` | `domain/dates.to_local_date` + vectors (G17, G20) |
| **I20** | **The gym layer never blocks training or entry.** Extends I10 and I14 | Containment test with the gym APIs failing (G19) |
| **I21** | **No AI call without an entitlement check, and no model call on a `PRO_REQUIRED` path** | Stub call-count assertions (G15) |
| **I22** | **Outbound messages are idempotent on a deterministic key, and never marketing to a gym-supplied number** | `MessageSender` guard + audit query test (G18) |
| **I23** | **No raw location, Aadhaar number or biometric template is stored** | Schema test + log scrubbing test (G19) |
| **I24** | **Every gym and Pro surface string comes from the catalog, in English and Hindi** | Catalog-completeness + source-scan tests (G14) |

### 2.9 Decisions this plan expects to record

Each is recorded in the [charter](08-PROJECT-CHARTER.md#6-decision-log) **when its goal closes**, not before:

- **D36** phone identity (G13);
- **D37** i18n mechanism (G14);
- **D38** RevenueCat and the entitlement model, `PRO_REQUIRED` (G15);
- **D39** gym policy module and the 404 rule (G16);
- **D40** generic job queue and gym-time scheduler (G16);
- **D41** gym-owned tables `SET NULL` and the deletion/export rule (G16);
- **D42** money in paise, append-only ledger, server-assigned receipt numbers (G17);
- **D43** WhatsApp platform number and the template-category guard (G18);
- **D44** `visit` naming, verification bands, no coordinates (G19);
- **D45** alert confidence rule (G20);
- **D46** plan assignment as a member-owned copy (G21).

---

## 3 · The chain at a glance

**The baseline check.** Every entry gate below includes it. It is exactly what CI runs:

```bash
docker compose -f infra/docker-compose.yml up -d db-test
(cd services/api && uv run ruff check . && uv run pytest -q)
pnpm --filter @fitlog/domain test
pnpm --filter @fitlog/api-types generate && git diff --exit-code packages/api-types/src/schema.d.ts
pnpm --filter @fitlog/mobile typecheck && pnpm --filter @fitlog/mobile test:ci
```

| Goal | Outcome | Track | Blocked by | Size |
|------|---------|-------|-----------|------|
| **G12** | We know whether to build: interviews, counsel, AI accuracy, concierge pilot | B | — | founder 3 wk + 1 ew |
| **G13** | Phone-number sign-in; accounts without email | A + B | — | 2 ew |
| **G14** | i18n spine (EN/HI, Devanagari font, locale formats) and Indian food depth | A + B | — | 3 ew |
| **G15** | Pro: entitlements, paywall, all AI gated server-side | A + B | — | 3 ew |
| **G16** | Tenancy: gyms, staff roles, policy + route-walker, consent/audit, generic jobs, workspaces | B | G12 go, G13 | 4 ew |
| **G17** | Owner core: members, import, plans, memberships, fees, receipts, export | B | G14, G16 | 5 ew |
| **G18** | Members join: invites, linking, gym card, consent, WhatsApp | B | G13, G17 | 4 ew |
| **G19** | Visits without a gate: poster scan, workout-at-gym, manual, device import | B | G16, G18 | 3 ew |
| **G20** | Retention: alerts, today's calls, renewal reminders, exit reasons | B | G17, G18, G19 | 3 ew |
| **G21** | Trainer workspace and the plan loop | B | G18 | 3 ew |
| **G22** | Challenges, leaderboard, share cards, referrals | B | G19 | 2 ew |
| **G23** | Pilot release: Hindi completion, low-end Android, instrumentation, runbook, legal | B | G17–G22 | 3 ew |
| | **MVP total** | | | **≈ 36 ew** (gym-specific G16–G23 ≈ 27 ew) |

**[A] How this reconciles with R3.** R3 §10.2 put the whole MVP, including phone OTP, Pro, Hindi and the catalog, at 10–14 weeks for 2–3 engineers (≈ 20–42 ew). This plan is 35 ew for G13–G23 plus 1 ew in G12, so 36 ew: inside that range. G13–G15 (≈ 8 ew) are needed by the store launch anyway.

### 3.1 Calendar with two engineers

| Weeks | Founder | Engineer 1 (backend-leaning) | Engineer 2 (mobile-leaning) | Pilot |
|------|---------|------------------------------|-----------------------------|-------|
| 0–3 | **G12**: interviews, counsel, recruit 5 gyms, WhatsApp/DLT/RevenueCat accounts | G13 server; accuracy harness (G12) | G13 client; **G14 i18n spine** | **2-gym concierge** (by hand) |
| 3–6 | Concierge pilot running; pre-sell Pro | **G15 server** → **G16** | G14 food depth + fonts; **G15 client** | **Concierge widens to the 5 signed gyms**: members on today's FitLog; linking, reminders and alerts done by hand ([R3 §14.7](research/R3-gym-b2b2c-strategy.md)) |
| 6–10 | Pilot ops | **G17 server**, G18 messaging | G16 workspaces → **G17 owner screens** | **Week 8: early checkpoint.** Concierge activation < 10% of active members → stop Track B and go to R3 §14.9 |
| 10–13 | Pilot ops; **decision memo** | G19 server, G20 server | G18 client, G19 scanner | **Week 13: the §6.1 decision** (scale / fix / pivot), as in R3 |
| 13–17 | Prepare Phase 2 | G20 jobs, G21 server, G22 | G20 calls screen, G21 trainer, G22 | Pilot gyms move onto the MVP as parts ship |
| 17–19 | Pilot rollout | **G23** | **G23** | **MVP pilot release** to the 5 gyms (or 10–20 on "scale") |

**How the calendar overlaps goals.**
- A goal may start when the **server half** of its predecessor has closed: migrations, routes and tests merged.
- The predecessor's client half can finish in parallel.
- In the §4 entry gates, "Hx has closed" means its server half unless stated otherwise. Each goal still closes in full before its own handoff record is written.

**Slack is thin.** Two engineers give about 38 ew of capacity across 19 weeks, against 36 ew at ±25%. Expect up to ~22 weeks if estimates run long; the week-13 decision does not move.

**With three engineers the calendar compresses to ~13–14 weeks.** The week-13 decision stays where R3 put it, because it measures activation through the gym, which the concierge pilot can measure before the software is complete.

**Kill switches:**
- **Week 8.** Under 10% activation in the concierge gyms.
- **Week 13.** Linked under 15% (PRD §6.1 row 1) stops Track B. Any other pivot row triggers its response in R3 §14.9.

Either stop stops G16+ work (D31). G13–G15 are kept: they serve the store launch.

---

## 4 · The goals

### G12 · Validate before building (founder-led)

**Outcome.** Before the gym build starts we know three things:
- whether ICP owners want this and will pay for Pro;
- whether the invite and consent design is lawful;
- which AI model is accurate enough on weighed Indian meals, at what cost per image.

The concierge pilot is running.

**Inherits.** R3 §14.5–14.7 (hypotheses H1–H10, interview questions, pilot design) and PRD v2 §6.1.

**Entry gate.** None.

**Do.**
1. **Interviews:** 20–30 owners and 30–50 members, using the questions in R3 §14.6. Notes go in `docs/research/R4-validation/` (local files only).
2. **Counsel review** (Indian data protection and telecom):
   - the invite and consent flow (PRD §11);
   - the gym terms with the DPA and the owner-safety charter;
   - enrolment notice wording;
   - minors;
   - a written opinion on AI calling for P2: service vs promotional, 140-series, pre-declaration.
3. **Weighed-meal accuracy test.**
   - Extend `services/api/app/food/benchmark.py` and `services/api/scripts/measure_food_resolution.py` into `services/api/scripts/measure_food_accuracy.py`.
   - Run 50 weighed Indian dishes through the existing `AIGateway` for each candidate model (`AI_MODEL` switch).
   - Record calorie and protein error, and cost per image.
4. **Recruit 5 pilot gyms** inside one cluster (R3 §11.3) and sign pilot terms.
5. **Start the concierge pilot:** 2 gyms in weeks 0–3, widening to the 5 signed gyms at week 3 (R3 §14.7):
   - members install today's FitLog;
   - trainers assign plans through existing templates;
   - we track links, visits (poster on paper or the gym's own register) and renewals in a sheet;
   - we send renewal WhatsApps by hand, in each gym's name.
6. **Pre-sell Pro** to owners at the indicative price (PRD §9).
7. **Start the long-lead accounts** (§9 below): WhatsApp Business verification and templates, DLT, RevenueCat and store products.
8. **Answer PRD Q21–Q33** (Q33 with counsel), or accept their defaults in writing.

**How.**
- Interview notes use one template per interview (past behaviour, not opinions).
- The accuracy harness reuses `get_gateway()` with `AI_PROVIDER=anthropic`. Results are a table per model:
  - median absolute calorie error %;
  - share within ±20%;
  - ₹ per image (resized to ≤ 1,000 px).

**Done when.**
- [ ] `docs/research/R4-validation.md` exists with a **go / no-go** for Track B, backed by interview counts and quotes.
- [ ] A counsel memo is on file. The invite, notice and consent copy is marked "approved".
- [ ] An accuracy table for ≥ 2 models; the chosen model and its ₹/image are recorded.
- [ ] 5 gyms have signed pilot terms. The 2-gym concierge has run, and the 5-gym pilot starts with a baseline (each gym's previous-year renewals and joiners).
- [ ] Q21–Q33 are answered or defaulted.

**Hands off.**

| ID | Artefact | Claim |
|----|----------|-------|
| H12.1 | R4 memo | Track B is a go, and on which ICP |
| H12.2 | Approved copy | Invite, enrolment notice, FitLog consent and gym terms are lawful as written |
| H12.3 | Accuracy table | `AI_MODEL` for food is chosen on evidence; ₹/image known |
| H12.4 | Pilot terms + baseline | 5 gyms, with numbers to compare against |

**Traps.**
- Asking owners "would you use…?" instead of "what did you do last month?".
- Treating the founder's friends' gyms as the ICP.
- Starting counsel late. **WhatsApp template approval and DLT registration take weeks;** start them here, not in G18.

---

### G13 · Phone-number sign-in

**Outcome.** Anyone can sign in with an Indian mobile number and a one-time code, and an account may have no email at all.

**Inherits.** D30 (Supabase Auth), S1–S10 in [14-SUPABASE.md](14-SUPABASE.md), the G11 security review (tracker, 26 Sep).

**Entry gate.** The baseline is green.

**Do.**
1. **Migration `m19_phone_identity`:**
   - `users.email` becomes nullable;
   - add `users.phone_e164` (`UNIQUE NULL`);
   - add `CHECK (email IS NOT NULL OR phone_e164 IS NOT NULL)`.
2. **Provisioning** (`app/auth/provision.py`, `tokens.py`):
   - accept a token whose claims carry `phone` and no email;
   - keep `users.phone_e164` in sync with the token, as email is today;
   - `MeOut` gains `phone`; `email` becomes optional.
3. **The Send-SMS hook.**
   - `POST /v1/hooks/send-sms` verifies Supabase's hook signature.
   - It sends the OTP through `SmsSender` (`app/notify/sms.py`: `NullSmsSender`, `RecordingSmsSender`, `Msg91SmsSender` with the DLT template ID).
   - New rate-limit policy `sms`, keyed on the **phone number only** (5 an hour). The hook sees Supabase's address, not the member's, so a per-IP limit here would be a global cap. Per-IP limits stay with Supabase's `[auth.rate_limit]`.
4. **Supabase config.**
   - `[auth.sms] enable_signup = true`, with the hook configured; `max_frequency = "30s"` (A01.2).
   - Raise `[auth.rate_limit] sms_sent` (local and hosted) to the pilot's peak, e.g. 500 an hour. The default of 30 would stall a gym's join day.
   - Local `[auth.sms.test_otp]` numbers for Maestro.
   - `docs/12` §2.1 gains the hosted steps.
5. **Client.**
   - `sendPhoneOtp` / `verifyPhoneOtp` in `src/features/auth/supabaseAuth.ts`, with a `'phone'` field in `AuthProblem` and its `WORDS` entries.
   - `signInWithPhone` in `SessionValue`.
   - Routes `app/phone.tsx` (A-11) and `app/phone-verify.tsx` (A-12), added to `AuthGate.PUBLIC_ROUTES` and `tabs.HIDDEN`.
   - A "Continue with phone" button in `ProviderButtons`.
6. **Re-authentication for delete** (`REAUTH_REQUIRED`) gets a phone branch: a fresh OTP. K-02 can add and verify a phone (`updateUser({phone})`, `type: 'phone_change'`).
7. **Every email assumption.** `grep -rn "\.email" services/api/app apps/mobile/src` and fix each one:
   - export;
   - account deletion;
   - the web delete door, which still needs an email OTP. Phone-only users delete in-app.

**How.**
- Copy `PushSender`'s null/recording/real + `get_*()` shape for `SmsSender`, and the module-level `_transport` hook of `app/auth/admin.py` for tests.
- Verify the hook's **Standard Webhooks** signature: HMAC-SHA256 over `webhook-id.webhook-timestamp.body` with the `v1,whsec_…` secret, `hmac.compare_digest`, and reject timestamps older than 5 minutes.

**Done when.**
- [ ] `tests/test_phone_identity.py`:
  - a phone-only token provisions a user;
  - `MeOut.email` is null;
  - the CHECK constraint rejects a user with neither email nor phone (**seen to fail** with the constraint removed).
- [ ] `tests/test_send_sms_hook.py`: a bad signature gives 401; a good one calls the recording sender once with the DLT template; the rate limit returns 429.
- [ ] `test_account.py` deletion and export pass for a phone-only user.
- [ ] Maestro `sign-in-phone.yaml` passes on a release APK against the local stack (test OTP).
- [ ] Jest: A-11/A-12 errors map to the right field; the phone branch of reauth works.

**Hands off.**

| ID | Artefact | Claim |
|----|----------|-------|
| H13.1 | `users.phone_e164`, `MeOut.phone` | A person can be identified by phone alone |
| H13.2 | `SmsSender` + hook | OTP SMS goes through a DLT-registered template we control |

**Traps.**
- Supabase stores phones without "+". Normalise to E.164 (`+91…`) on both sides.
- DLT template text must match **exactly**, or operators silently drop the SMS.
- The `amr` method for OTP sign-ins differs from password. `authenticated_at` must still be computed for the delete window.

---

### G14 · The i18n spine, the Devanagari font, and Indian food depth

**Outcome.** Every new screen is born bilingual:
- strings come from a typed English/Hindi catalog;
- dates, numbers and ₹ follow the locale;
- Devanagari renders in the app's type scale;
- Indian food search covers ≥ 500 dishes with household units and Hinglish names.

**Inherits.** The UI kit and tokens (docs/15), `src/lib/datetime`, the food seed (`services/api/scripts/indian_foods.py`, `app/seed`).

**Entry gate.** The baseline is green.

**Do.**
1. **Decide the mechanism, then record D37.** Recommended: an in-house typed catalog, keeping to D19's minimal-dependency stance.
   - `src/lib/i18n/{en.ts,hi.ts,index.ts}`;
   - `t(key, vars)` and `useT()`;
   - plurals via `Intl.PluralRules` if Hermes supports `hi` on a release build, otherwise a two-form rule.
   - Verify on a release APK before writing the decision down.
2. **Locale-aware formatting.**
   - `src/lib/datetime/index.ts` and `humanDate.ts` take a locale.
   - `nutrition/format.ts` and `count()` lose their English plural rule.
   - Every `toLocaleString('en-US'|'en-GB')` goes through `formatNumber` / `formatCurrency` (`en-IN` grouping: ₹1,00,000).
3. **The font.**
   - Load Noto Sans Devanagari (or Mukta) weights in the font loader, and **select `fonts.*` by the active locale** in `Text` variants. React Native's `fontFamily` has no fallback stack.
   - Adjust line heights for Devanagari in `Text` variants.
   - Contrast and the type scale stay unchanged.
4. **Language setting.**
   - K-03 offers English / हिन्दी.
   - Stored in prefs (D29) **and** on `user_profiles.locale`, so server-sent messages use the member's language.
5. **The guards.**
   - **Catalog completeness:** every key exists in both languages, with no empty values.
   - **Source scan:** no user-visible string literals in `app/gym/**`, `app/my-gym/**`, `app/visit/**`, `app/pro/**`, `app/join.tsx`, `app/phone*.tsx` or `src/features/{gym,member-gym,billing,workspace}/**`. Copy the style of `src/ui/__tests__/focusRing.test.tsx`.
6. **Indian food depth** (FR-M03).
   - Extend `services/api/scripts/indian_foods.py` to ≥ 500 dishes, valued as the existing 138 are: USDA FNDDS/SR records, or standard recipes computed from USDA ingredients.
   - Add household portions (katori, roti, glass, ladle, plate) as `food_portions`.
   - Add Hinglish aliases in `foods.aliases`.
   - Bump `SEED_VERSION` in `app/seed/foods.py`, and in `app/seed/catalog.py` for the exercise aliases. Update [data-sources.md](data-sources.md).
   - **IFCT stays out** (no licence).
7. **Exercise aliases** in Hindi and Hinglish (`exercises.aliases`).

**How.**
- Whole-sentence keys with named variables: `t('gym.renew.reminder', {name, date})`. Never `t('due') + ' ' + date`.
- Migrate existing screens only where a gym flow passes through them (B-01 card, auth, settings language). The rest of v1 stays English for now; PRD L01.2 scopes Hindi to gym flows.

**Done when.**
- [ ] `src/lib/i18n/__tests__/catalog.test.ts` passes. **Seen to fail** on a key deleted from `hi.ts`.
- [ ] The source-scan test is **seen to fail** on a literal added to a gym file.
- [ ] `src/lib/datetime/__tests__` cover `en-IN` and `hi-IN` (₹1,00,000; Hindi month names; relative days).
- [ ] A release APK renders Hindi in Noto Sans Devanagari at every `Text` variant, with no tofu and no clipped matras (screenshot in `docs/screenshots/`).
- [ ] The food catalog test counts ≥ 500 `fitlog_indian` rows, each with ≥ 1 household portion.
- [ ] `measure_food_resolution.py` shows **no regression** on the existing benchmark.

**Hands off.**

| ID | Artefact | Claim |
|----|----------|-------|
| H14.1 | `t()`, catalogs, guards | New UI is bilingual by construction (I24) |
| H14.2 | Locale formatters | Dates, numbers and ₹ follow `en-IN` / `hi-IN` |
| H14.3 | Indian food seed v-next | ≥ 500 dishes, units and aliases, all with traceable sources |

**Traps.**
- **Inter and Hanken Grotesk have no Devanagari glyphs.** Without a fallback font Hindi renders as boxes, or in an ugly system fallback that breaks line heights.
- Hermes `Intl` coverage differs between debug and release, and between Android and iOS. Verify on release builds.
- Snapshot tests that pin English copy will churn. Assert keys and roles, not text.

---

### G15 · Pro: entitlements, the paywall, and AI behind it

**Outcome.** All AI is behind Pro, enforced on the server. A member can start a store trial, subscribe, restore, and lose nothing when Pro ends. Pilot users can be granted Pro without the stores.

**Inherits.**
- D23–D25 (the AI gateway, versioned contract, Postgres queue).
- The quota pattern (`/food-analysis/quota`, "read before offering").
- Launch-plan L6 (RevenueCat).

**Entry gate.** The baseline is green. **Owner task:** RevenueCat project and store products created (sandbox).

**Do.**
1. **Migration `m20_entitlements`:** `entitlements`, `entitlement_events` (append-only trigger).
2. **Billing module** (`app/billing/`):
   - `POST /v1/webhooks/revenuecat`: verifies the shared secret, is idempotent on `provider_event_id`, upserts `entitlements`.
   - `GET /v1/me/entitlements`.
   - `MeOut.pro = {active, product, source, expires_at}`.
   - `POST /v1/admin/entitlements` (pilot and gym-seat grants, with an end date) on the admin router (`admin_access`: the operator token in staging and production; any signed-in user in development, as for every admin route).
3. **The gate.**
   - `CurrentProUser` dependency in `app/api/deps.py`.
   - New `ProRequired(AppError)`: **403 `PRO_REQUIRED`**.
   - Applied to `POST /v1/food-analysis/text` and `/image`. **The worker re-checks the entitlement** before calling the gateway, because `AnalysisWorker` makes the model call, not the route. "Try again" in H-08 creates a new analysis through those routes. **Not** applied to reading past analyses.
   - Replace the global `AI_DAILY_QUOTA` with a **Pro fair-use cap** (setting, default 20 a day). `QuotaExceeded` is kept for the cap.
4. **Client.**
   - `react-native-purchases` with its config plugin, feature-detected so Expo Go still runs.
   - `src/features/billing/{purchases.ts,useEntitlement.ts}`.
   - P-01 paywall (`app/pro/index.tsx`): price, period, how to cancel, restore, trial text from the store offer. Shown once at the end of onboarding, dismissible (PRD PRO01.3).
   - P-02 "Trial started" sheet after a successful trial start.
   - P-03 (`app/settings/pro.tsx`) replaces K-11.
   - `ProGate` wraps every AI entry point found in the mobile survey: `app/quick.tsx` (describe, photo), `app/nutrition/add.tsx` (`go-describe`, `go-photo`), `src/features/dashboard/NutritionCard.tsx`, `app/nutrition/describe.tsx`, `photo.tsx`, `analysis/[id].tsx` (retry), `settings/ai.tsx`.
   - New `MutationKind 'entitlement.changed'`, with a **docs/03 §6.2 row**.
5. **Paywall honesty test:** the paywall renders price, renewal period and cancel instructions before the purchase button. No pre-selected upsell.
6. **Keep v1's AI tests and flows green.** `auth_client` and the e2e seed user get an `admin_grant` entitlement. Add a `free_client` fixture for the locked paths. Re-run Maestro ac-08, ac-09 and ac-10 (PRD v2 §13: AC-01…AC-12 unchanged).

**How.**
- After a purchase, poll `GET /v1/me/entitlements` for ≤ 30 s, because the webhook may lag the store.
- Cache the entitlement in prefs for 72 h of offline use (PRO01.8).
- The stub AI gateway's call counter proves the gate (I21).

**Done when.**
- [ ] `tests/test_pro_gate.py`: without an entitlement, `/food-analysis/text` and `/image` return `PRO_REQUIRED`, **no `food_analyses` row is created, and after `worker.drain()` the stub gateway's calls are empty**. An entitlement that expires between the request and the worker also results in no model call. Mutation-checked by removing the dependency from one route.
- [ ] The webhook replay of the same event is a no-op. Expiry locks the feature. A grant unlocks it until `expires_at`.
- [ ] Jest: `ProGate` lock and unlock; paywall copy; Expo Go fallback ("Pro unavailable in this build").
- [ ] A sandbox purchase and restore on an Android release build are recorded in the handoff (manual, with screenshots).
- [ ] AC-22 and AC-28 pass.

**Hands off.**

| ID | Artefact | Claim |
|----|----------|-------|
| H15.1 | `CurrentProUser`, `PRO_REQUIRED` | Any new AI route is gated by adding one dependency |
| H15.2 | `entitlements` + grants | Pilot and gym-seat access exist without the stores |
| H15.3 | `ProGate`, `useEntitlement` | Any new AI surface gets the locked state for free |

**Traps.**
- Store free trials usually require a payment method. The paywall must say so (PRO01.3).
- Launching the public app with free AI and paywalling later is the MyFitnessPal take-away backlash. **Ship G15 before the public store launch.**
- Native module plus Expo Go: keep the JS fallback, or every developer loses Expo Go.

---

### G16 · Tenancy: gyms, staff, the policy module, consent and audit, jobs, workspaces

**Outcome.** The server can host many gyms safely:
- every gym route is role-checked and tenant-isolated, proven by a test that walks all of them;
- consent and audit records are append-only;
- background jobs of any kind run on a gym-time schedule.

The app can switch between *Personal* and a gym workspace.

**Inherits.** H13.1 (phone identity, for staff invites), H12.1 (go).

**Entry gate.** The baseline is green, H12.1 says **go**, and H13 has closed.

**Do.**
1. **Migration `m21_tenancy`:** `organizations`, `gyms`, `staff_memberships`, `gym_members` (core columns), `consents`, `audit_log`, `jobs`. Append-only triggers on `consents` and `audit_log`; the AST guard allow-list is updated.
2. **Policy module** `app/policy/` (§2.2): `gym_staff(*roles)`, `StaffContext`, `member_data(...)`, `audit(...)`.
3. **Routes:** `routes/gyms.py` (create org + gym + owner staff, get, patch, settings) and `routes/gym_staff.py` (invite by phone; accept on sign-in when the verified phone matches; change role; remove).
4. **The route-walker** `tests/test_gym_isolation.py` (§2.2), with a minimal fixture factory (`tests/gym_factory.py`) building gym A and gym B with staff in each role.
5. **Deletion and export rule (D41).**
   - Amend `test_every_user_owned_table_cascades_from_users` with an explicit `GYM_OWNED_TABLES` set whose user FKs must be `SET NULL`.
   - `purge_account` leaves gym-owned rows.
   - The export adds `gym_links`, `consents` and the member's copy of visits and receipts.
6. **Jobs (§2.4).**
   - `app/worker/jobs.py` (`JobWorker`, handler registry, retries).
   - The runner alternates workers.
   - `scheduler.py` tick with `dedupe_key`.
   - Queue metrics per kind.
7. **Rate-limit policies** `gym_invites` and `visits` (settings plus validation).
8. **Client.**
   - `src/features/workspace/` (prefs-backed);
   - `tabsFor(workspace)` in `src/ui/shell/tabs.ts`;
   - O-01 create-gym (only when `MeOut.can_create_gym`, set by an operator) and the switcher;
   - `src/lib/api-gym.ts`, `qk.gym.*`;
   - an empty O-02 shell under `app/gym/[gymId]/index.tsx`.
9. **docs/02 and docs/03** gain the tenancy, jobs and workspace sections, plus the new invariants (I16–I24) in 10 §6.

**How.**
- Copy the m6 trigger SQL for append-only tables.
- Copy `AnalysisWorker`'s claim query for `JobWorker`.
- Every gym-scoped query is `select(X).where(X.gym_id == ctx.gym_id, X.id == id)`.

**Done when.**
- [ ] **AC-17**: the route-walker passes, and its route count equals the number of `{gym_id}` routes. **Seen to fail** when one route's dependency is removed.
- [ ] Policy unit tests cover each role against the PRD §8.1 matrix.
- [ ] Trigger tests: UPDATE or DELETE on `consents` / `audit_log` raises, except the two allowed cases. Deleting a staff user who has audit rows, and a member who has consent rows, both succeed.
- [ ] Job tests: retry with backoff; dedupe prevents a double enqueue; two concurrent workers never run one job twice (two sessions, `SKIP LOCKED`).
- [ ] Deletion and export tests are green under the new rule. A member deletion leaves `gym_members.linked_user_id = NULL`.
- [ ] Jest: `tabsFor` per role; the workspace switch persists across relaunch.

**Hands off.**

| ID | Artefact | Claim |
|----|----------|-------|
| H16.1 | `gym_staff()` + route-walker | Every future gym route is isolated or CI fails (I16) |
| H16.2 | `consents`, `audit_log` | Append-only consent and audit exist (I17, I18) |
| H16.3 | `jobs` + scheduler | Any later goal schedules gym-time work by registering a handler |
| H16.4 | Workspaces | Role-specific tabs exist; screens can be added under `app/gym/[gymId]` |

**Traps.**
- Returning 403 for another gym leaks that it exists. **Always 404.**
- Looking up by id without `gym_id`.
- N+1 role queries: cache the membership in `StaffContext` per request.
- A scheduler that fires twice on two replicas. `dedupe_key` must be UNIQUE, not just checked.
- "The gym's day" computed in UTC. Use `gyms.timezone` (I19).

---

### G17 · The owner's core: members, import, plans, memberships, fees, receipts, export

**Outcome.** An owner runs the gym's register and money from a phone, in Hindi or English, and goes live with ≥ 150 members in one visit.

**Inherits.** H14.1 (i18n), H16.1–H16.4.

**Entry gate.** The baseline is green and H16 has closed.

**Do.**
1. **Migration `m22_owner_core`:** the rest of `gym_members`, `membership_plans`, `memberships`, `membership_freezes`, `charges`, `payments` (append-only; reversal rows), `receipt_counters`, `import_batches`.
2. **Domain** `app/domain/memberships.py`: end-date math (months with month-end clamping; freezes extend), status derivation in gym time, dues and ageing. Edge cases go into `contracts/vectors/domain.json` only if the client also computes them; otherwise Python tests. Register the **`nightly_status`** handler (02:00 gym time) on H16.3.
3. **Routes** (§2.3: members, imports, plans, memberships, money, export).
   - Import copies `routes/imports.py`: a `dry_run=true` preview, then a commit keyed by `file_sha256`, parsing in `run_in_threadpool`, under the `imports` rate policy. The XLSX arrives through the signed upload (`routes/uploads.py`). Add `openpyxl` to `pyproject` dependencies.
   - Phones normalised to E.164 (`+91`, leading-0, spaces).
   - Preview returns per-row errors and duplicates. Same-phone rows are flagged; the owner merges them or keeps both.
   - Commit is idempotent on the file hash.
4. **Receipts.** The number is assigned **server-side** inside the payment transaction (row-locked counter, no gaps). The text is rendered for sharing.
5. **Export and offboarding jobs** (`export_gym` → CSV zip in storage → signed URL; `offboard_gym`).
6. **Client screens:** O-02 (counts), O-03, O-04 (without training data), O-05, O-06, O-07, O-08, O-09, O-10 (share via the native share sheet), O-11, O-15, O-16 (profile and plans), O-17 (collections, dues ageing, status counts, renewals), O-19, O-20 (counts only). All strings through `t()`.
7. **Offline:** payments and member edits recorded by staff queue through `store.enqueue()` (`kindForDelivery`, `describePath` labels). A receipt shows "number pending" until synced.
8. **Records.**
   - Every charge, payment, reversal, membership, freeze or cancel writes `audit(...)` in the same transaction. `GET …/audit-log` (owner only) feeds O-04's audit tab.
   - `PATCH …/freeze-requests/{id}` approves or declines a member's request (PRD GYM03.6).
   - Receipts show the configured GST lines when `gstin` is set (GYM04.7).
   - O-16 edits the enrolment notice; saving bumps its version, and members record `notice_version` (GYM10.4).
   - `POST …/members/{id}/erasure-requests` is tracked from open to done on O-04 (GYM14.3).

**How.**
- `CursorEnvelope` on `(created_at, id)` for the member list.
- Name search uses a trigram index, as `foods` does.
- Money is `int` paise in Pydantic schemas (`amount_paise: int`). The client formats it with H14.2.

**Done when.**
- [ ] **AC-13** timed: a 200-row XLSX fixture with Hindi names imports cleanly and dues are correct, with the owner flow under 90 minutes in a scripted walkthrough.
- [ ] **AC-21:** payment → dues → receipt. A reversal, not an edit. Concurrency test: 50 parallel payments give 50 distinct gap-free numbers.
- [ ] **AC-24:** the export and offboarding tests enumerate `GYM_OWNED_TABLES` from metadata. Any gym table added later fails them until it is exported and deleted. Offboarding leaves members' accounts.
- [ ] An audit row is asserted for a payment, a reversal, a membership and a freeze.
- [ ] Member, dues and visit lists return in p95 < 300 ms on a 1,000-member fixture.
- [ ] Money tests: no float anywhere on the path (Pydantic `int`). Trigger blocks an UPDATE on `payments`.
- [ ] Jest screen tests for O-03, O-06, O-09, in Hindi and English.

**Hands off.**

| ID | Artefact | Claim |
|----|----------|-------|
| H17.1 | Register + import | A gym's members can be loaded and kept in one place |
| H17.2 | Ledger + receipts | Money is correct, append-only and receipted (I18) |
| H17.3 | Status derivation | Active, expiring and lapsed are true in gym time (I19) |

**Traps.**
- Excel exports with a UTF-8 BOM or Windows-1252.
- Phone numbers stored as numbers, losing the leading `+`.
- Jan 31 + 1 month.
- Two staff recording the same cash payment: `client_id` idempotency plus a "possible duplicate" warning on the same amount and day.

---

### G18 · Members join: invites, linking, the gym card, consent, WhatsApp

**Outcome.** A member invited by their gym signs in with a phone OTP and lands on a filled gym card. They control what the gym sees, and get receipts and the invite on WhatsApp, in the gym's name.

**Inherits.** H12.2 (approved copy), H13.1, H16.2, H17.1–H17.2.

**Entry gate.** The baseline is green. H17 has closed. WhatsApp templates (invite, receipt) are **approved by Meta**.

**Do.**
1. **Messaging.**
   - `app/notify/whatsapp.py`: `MessageSender` (null, recording, Meta Cloud API).
   - `app/notify/templates.py`: a registry of key, category, language and variables, where the category is fixed per template.
   - Migration `m23_messaging`: `messages`, `invites`.
   - The `send_message` job.
   - `POST /v1/webhooks/whatsapp`: signature verification; delivery statuses; STOP → consent row `whatsapp_from_gym = false`.
2. **The guard (I22).** The sender refuses `category == marketing` for any recipient whose number came from a gym record. Every send carries a deterministic `dedupe_key`. A **per-gym monthly ceiling** on platform-paid WhatsApp spend is enforced in `MessageSender`. Templates: invite, receipt, freeze confirmation.
3. **Invites and linking.**
   - Invite job (one send; one staff-triggered resend).
   - `POST /v1/me/gym-links` accepts a code, or confirms an auto-match on a verified phone. A phone matching more than one record asks for the invite code.
   - **Minors are never invited** (AC-27).
4. **Member API:** `/v1/me/gyms`, card, receipts, freeze requests, consents (GET/PUT, versioned rows), unlink.
5. **Client.**
   - A-13 (`app/join.tsx`; deep link `fitlog://join?code=`), A-14 (age gate + FitLog consent rows).
   - **Age:** A-14 collects a date of birth (picker) and PATCHes the profile. `POST /v1/me/gym-links` refuses (422) when there is no birth date or the member is under 18. `MIN_AGE_YEARS` in `services/api/app/domain/age.py` changes globally only if Q33 says so. Existing 16–17-year-old accounts follow the counsel memo from G12.
   - A-13 offers the gym's `locale` as the UI language (PRD L01.1).
   - N-01 card on B-01 and in full, N-04, N-05, N-10.
   - Onboarding skip for invited members (M01.1).
   - O-20 coverage with statuses and resend, plus the coverage report tile on O-17.
6. **Push:** a `receipt` message type to the member (optional per prefs); `routeFor()` branch → N-04.

**How.** Copy `ExpoPushSender`'s shape for the WhatsApp sender, including token cleanup, which here is invalid-number handling.

**Done when.**
- [ ] **AC-14**: Maestro `join-gym.yaml` passes (phone test OTP → A-13 → card shows plan and end date).
- [ ] **AC-23**: an audit test asserts zero marketing sends to gym-supplied numbers. **Seen to fail** with the guard removed.
- [ ] **AC-27** for the invite and link paths with `is_minor` (challenges: G22).
- [ ] Webhook tests: bad signature → 401; STOP → consent row; a duplicate status event is a no-op.
- [ ] Re-running the invite job sends nothing new (dedupe).

**Hands off.**

| ID | Artefact | Claim |
|----|----------|-------|
| H18.1 | `MessageSender`, templates, log | Any goal can send a gym-named message safely (I22) |
| H18.2 | Invites and links | A member account is tied to a gym record by consent |
| H18.3 | Consent API + `member_data()` checks | Staff access follows the member's switches (I17) |
| H18.4 | Gym card | The member's gym lives on their home screen |

**Traps.**
- Utility templates reworded by Meta into marketing. Keep the invite strictly about "your membership card and receipts".
- Auto-linking the wrong person on a shared phone. **Always an explicit "Yes, I'm a member of <Gym>"**.
- Template approval latency. Submit in G12.

---

### G19 · Visits without a gate

**Outcome.** A gym knows who came — from poster scans, workouts logged at the gym, staff marks, and its own fingerprint reader — and nothing ever blocks a member.

**Inherits.** H16.1, H16.3, H18.2.

**Entry gate.** The baseline is green and H18 has closed.

**Do.**
1. **Migration `m24_visits`:** `visits`, `device_member_map`, visit `import_batches` (kind). Unique `(gym_member_id, client_id)`. Device-import dedupe on `(gym_id, device_user_code, occurred_at)`.
2. **The poster.**
   - Payload `fitlog://visit?g=<public_id>&v=<version>&s=<hmac>`, signed per gym with a rotatable key (`POST …/poster/rotate`).
   - O-16 renders a printable poster: QR as SVG → HTML → `expo-print` PDF → share.
3. **`POST /v1/me/visits`.**
   - Verifies the signature, the active link and the 3-hour rule.
   - Computes distance against `gyms.lat/lng/radius_m` from optional `{lat, lng, accuracy}`.
   - Stores only `verification` and `distance_band`.
   - **Never fails because of location.**
   - Accepts `scanned_at` within ±24 h, otherwise uses server time with a flag.
4. **Workout-at-gym.** When a linked member starts a session and location permission is granted, the client enqueues a separate `workout_at_gym` visit candidate. **The session start never waits for it** (I10, I20).
5. **Staff:** manual marks (O-12, back-dated ≤ 7 days); the device import wizard (O-13): upload eSSL/ZKTeco Excel → map columns → map device user codes to members (remembered) → commit. O-12 shows peak hours from `GET …/reports/visits` (day × hour).
6. **Reliability flag** per member, for G20: device-mapped **or** ≥ 4 recorded visits in the previous 28 days.
7. **Client.**
   - `expo-camera` scanner (N-02) and `expo-location` on demand.
   - `PermissionKind 'location'` + `PRIMER_COPY`.
   - N-03 result sheet.
   - Outbox path `/me/visits` with `kindForDelivery` and `describePath` ("Gym visit").

**How.** The visit endpoint is cheap and synchronous. Standings and alerts read visits later.

**Done when.**
- [ ] **AC-15**: Maestro offline flow — scan offline → relaunch → online → the visit lands with the original time. Online, scan → N-03 is p95 < 3 s on a throttled 3G profile.
- [ ] **AC-16**: a far or denied-location scan is stored `unverified`; standings exclude it (asserted in G22).
- [ ] Tamper test: a modified payload returns 4xx, and no visit is created.
- [ ] Schema and log tests: no `lat`/`lng` columns on `visits`; request logging and Sentry scrub drop them (I23).
- [ ] Containment test: with every gym endpoint returning 500, a workout can be started, logged and finished (I20).
- [ ] Device-import idempotency: the same file twice adds nothing.

**Hands off.**

| ID | Artefact | Claim |
|----|----------|-------|
| H19.1 | `visits` with sources and verification | Attendance exists without a gate |
| H19.2 | Reliability flag | G20 knows which absences are real |
| H19.3 | Scanner + location primer | Camera and location are available to later features |

**Traps.**
- Calling them "check-ins" in code: the collision with I-02.
- Indoor GPS error: treat `accuracy > radius` as unverified, not as far away.
- Posters photographed and shared on WhatsApp: harmless, because those scans are unverified.

---

### G20 · Retention: absence alerts, today's calls, renewal reminders, exit reasons

**Outcome.** Every morning the owner gets a short, honest list of who to call and why, with a drafted message. Members get renewal reminders on time, in the gym's name, once each.

**Inherits.** H16.3 (jobs), H17.3 (status), H18.1 (messaging), H19.2 (reliability).

**Entry gate.** The baseline is green and H19 has closed. Renewal and exit-reason templates (EN, HI) are approved by Meta as **utility**. If exit-reason is classed as marketing, O-14 offers a click-to-chat draft instead.

**Do.**
1. **Migration `m25_retention`:** `alerts`, `exit_reasons`; alert-rule settings in `gyms.settings` (validated schema).
2. **Rules** `app/domain/retention.py` (pure):
   - R1–R4 and praise moments (PRD GYM07.1, GYM07.6);
   - confidence from H19.2;
   - ranking.
   - Fixture tests cover freezes, minors, cancelled members, back-filled visits and gym-timezone midnight.
3. **Jobs:**
   - `evaluate_alerts` (07:00 gym time; dedupe per member, rule and date);
   - `renewal_reminders` (D-7, D-3, D0, D+3; 09:00–20:00; dedupe per membership and offset);
   - `cost_report` (daily per gym: AI, WhatsApp, SMS).
4. **The progress line** in reminders: computed from the member's own data through the existing analytics services, **only** under the consent `progress_in_reminders`.
5. **Owner push** `gym_calls` (count) at 08:00 gym time → `routeFor()` → O-14.
6. **Today's calls (O-14).** Ranked list, capped at 10 plus "show more". Drafted EN/HI messages via the catalog. **Click-to-chat** `https://wa.me/<digits>?text=…` opens the owner's own WhatsApp. Outcomes are recorded.
7. **Exit reasons.** A quick-reply utility template after a lapse → webhook → `exit_reasons`.
8. **Precision.** A visit back-filled into an alerted window marks the alert a false positive. Create **`GET /v1/admin/gym-metrics`** here, with precision, alerts actioned and the cost report; G23 extends it.
9. **Trainer view:** own members' alerts only.

**How.** The rules are pure functions over `(visits, memberships, settings, today)`, which makes them testable without the database. The job handler only loads inputs and writes alerts.

**Done when.**
- [ ] **AC-19**: fixture gym with reliable and unreliable members → correct confident and low alerts at 07:00 gym time.
- [ ] **AC-20**: the reminder job run twice (simulated worker crash) sends each reminder once. No sends outside 09:00–20:00 gym time. A consent-off member gets no progress line.
- [ ] Push routing test for `gym_calls`.
- [ ] The precision metric appears in `/v1/admin/gym-metrics`.

**Hands off.**

| ID | Artefact | Claim |
|----|----------|-------|
| H20.1 | Alerts + ranking | Owners see who to call, with honest confidence |
| H20.2 | Reminders | Renewals are reminded once each, on time, in the gym's name |
| H20.3 | Alert → action seam | P2 AI assistance and AI calling attach to an alert without rework |

**Traps.**
- Alerting on frozen, minor or cancelled members.
- UTC midnight.
- A list so long owners stop opening it: cap it, and measure actions.

---

### G21 · The trainer workspace and the plan loop

**Outcome.** A trainer assigns a plan in two taps, the member trains it in FitLog's logger, and the trainer sees what happened — only with the member's consent.

**Inherits.** v1 programs (W01.4 deep copy, I1), H16.1, H18.3.

**Entry gate.** The baseline is green and H18 has closed.

**Do.**
1. **Migration `m26_plan_loop`:**
   - `workout_programs` gains `gym_id`, `is_template`, `template_version`, `source_assignment_id`;
   - `plan_assignments`;
   - `body_metrics` gains `recorded_by_user_id` and source `trainer`;
   - `gym_members.assigned_trainer_id` is used.
2. **Templates:** gym-owned programs authored with the existing builder screens (C-03…C-07), parameterised by `gymId`.
3. **Assign:** deep-copy the template into the member's account with provenance. Re-assigning creates a new copy. **I1 is preserved.**
4. **Trainer reads** through `member_data(ctx, id, 'share_workouts'|'share_measurements')`. Each read is audited. Trainers see only their own members; managers and owners see all.
5. **Member:** N-06 and a B-01 card "Today's plan from <trainer>" → E-01 with the assigned day. Also the weekly "one thing that improved" B-01 card (PRD M02.3: PR, visits, volume, protein days), from the existing analytics services.
6. **Client:** T-01…T-05; trainer tabs.

**How.**
- Copy the program duplicate (deep copy) in `routes/programs.py` for assignment.
- Call `member_data()` on every T-02 read; never read member tables directly from trainer routes.

**Done when.**
- [ ] **AC-18**: consent off → T-02 shows "not shared" (server 404 on the data route); consent on → visible. Each read writes an audit row.
- [ ] I1 test: editing a template after assignment leaves the member's copy and sessions unchanged.
- [ ] A trainer can't read another trainer's member (policy test).
- [ ] Maestro `trainer-assigns-plan.yaml`: trainer assigns → member sees it on B-01 → logs a set.

**Hands off.**

| ID | Artefact | Claim |
|----|----------|-------|
| H21.1 | Assignment model | Plans flow from gym to member without mutating either |
| H21.2 | Consented training view | Trainers see what members allow, and every look is recorded |

**Traps.**
- A deleted member's copied program: it cascades with the member, while the template stays with the gym.
- Aggregate endpoints (e.g. "my members' volume") that bypass the per-member consent check.

---

### G22 · Challenges, leaderboard, share cards, referrals

**Outcome.** Members compete with the people they actually train with, and a PR or a challenge finish can be shared with the gym's name on it.

**Inherits.** H19.1 (visit verification), H16.3 (jobs).

**Entry gate.** The baseline is green and H19 has closed.

**Do.**
1. **Migration `m27_challenges`:** `challenges`, `challenge_optouts`, `referrals`.
2. **Standings job:** counts visits whose `verification` is `verified`, `staff` or `device` only; leagues by tenure; names shown as first name plus last initial; minors and opt-outs excluded. **Weekly visit streaks** (PRD GYM11.7) are computed by the same job.
3. **Screens:** O-18 (template-based creation), N-07 (standing, league, days left), N-08 (referral link and card).
4. **Share cards:** the PR card (E-11) and the weekly-improvement card carry the gym's name (opt-out per member). The image is rendered from SVG.
5. **Referral attribution.** An enquiry from a referral link is shown on the referrer's record. The reward is recorded by staff as an extension (O-08).

**Done when.**
- [ ] Standings exclude unverified scans (AC-16), minors (AC-27) and opt-outs.
- [ ] Name masking test.
- [ ] Referral attribution test.
- [ ] The share card renders the gym name, and omits it when the member opts out.

**How.** Standings and streaks are pure functions over visits (as `retention.py` is), loaded and written by a job handler.

**Hands off.**

| ID | Artefact | Claim |
|----|----------|-------|
| H22.1 | Standings and streaks | Members compete on recorded visits only, in leagues, with masked names |
| H22.2 | Share-card renderer | Any card can carry the gym's name, with a member opt-out |
| H22.3 | Referral attribution | A friend's enquiry is credited to the member who referred them |

**Traps.**
- Leaderboards that shame beginners: use leagues.
- Challenge windows in UTC.

---

### G23 · Pilot release: Hindi completion, low-end Android, instrumentation, runbook, legal

**Outcome.** The MVP can be handed to the pilot gyms. It is complete in Hindi, fast on a cheap phone, measured end to end, legally papered, and operable by a two-person team.

**Inherits.** H12.4 (pilot baseline), H17–H22.

**Entry gate.** The baseline is green; G17–G22 have closed; the week-13 decision is **scale** or **fix**.

**Do.**
1. **Hindi completion:** every MVP gym, Pro and member-gym string reviewed by a native speaker. Owner flows walked in Hindi on a device.
2. **Low-end Android:**
   - Buy the reference phone (₹8–10k class).
   - Run `measure-cold-start-release.yaml` and `measure-commit-p95-release.yaml` on it.
   - Set an APK size budget.
   - Fix regressions (AC-26).
3. **Instrumentation.** Extend `services/product_metrics.py` and `/v1/admin/gym-metrics` with:
   - gym activation funnel;
   - coverage;
   - new-joiner activation;
   - visits by source;
   - alert precision;
   - alerts actioned;
   - reminder outcomes;
   - renewals against baseline;
   - Pro trials and conversions;
   - cost per gym (AI, WhatsApp, SMS).
4. **Legal.** Gym terms with the DPA and the owner-safety charter, the enrolment notice template, and updated `app/legal/privacy.html` / `terms.html` (H12.2 copy).
5. **The runbook** `docs/18-PILOT-RUNBOOK.md`:
   - onboarding visit script;
   - poster printing;
   - the support WhatsApp line;
   - daily checks;
   - incident and breach response (72 h);
   - how to grant pilot Pro;
   - how to offboard.
6. **Maestro gym suite** in `e2e.yml`: `sign-in-phone`, `join-gym`, `visit-offline`, `trainer-assigns-plan`, `owner-records-payment`.
7. **Release:** TestFlight and Play internal track; pilot gyms provisioned by admin.

**Done when.**
- [ ] AC-25 and AC-26 pass.
- [ ] The nightly gym Maestro suite is green.
- [ ] The runbook is reviewed.
- [ ] Legal pages are updated.
- [ ] Pilot gyms are live and the instrumentation shows their funnels.

**Hands off.** **The MVP pilot.** Phase 2 starts only after PRD §6.1 says **scale**.

**How.**
- Run the reference-phone measurements through the existing release-APK Maestro flows; don't write new timing code.
- Gym metrics stay computed from tables, like `product_metrics.py`. No event SDK.

**Traps.**
- Hindi reviewed only on the emulator: real phones substitute fonts differently.
- Pilot gyms provisioned before the legal pages are live.
- Instrumentation that counts installs, not *linked* active members (the §6.1 metric).

---

## 5 · Phase 2 and Phase 3 goals (outline)

These are planned now and detailed when they become next. **None starts before the §6.1 gate says "scale".**

| Goal | Outcome | Key scope | Gate / dependency | Size |
|------|---------|-----------|-------------------|------|
| **G24 · Owner Pro and AI assistance** | Owners pay for AI help on the web | Web billing (we are the merchant); Pro Assist entitlement; why-this-member; drafted messages; ask-the-gym (read-only); trainer plan copilot; diet-chart digitiser (FR-PRO05) | §6.1 scale; pre-sell evidence | 5 ew |
| **G25 · Member Pro AI: workout logging and weekly review** | Members log sets by voice or text, and read a weekly AI review | New gateway Protocols (`WorkoutParser`, `Reviewer`); speech-to-text choice (on-device first); proposals confirmed into the normal set-commit path (I10); notebook-photo import; review citing numbers; no medical advice (FR-PRO03, P04) | H15 | 5 ew |
| **G26 · AI calling** `[GATED]` | Owners on Pro Calls let an AI call absent members | Vendor chosen on Hindi quality and ₹/min; `VoiceAgent` Protocol; consent purpose; windows; caps; pre-declaration; outcomes; metering and overage; hard monthly cap (FR-PRO06) | Counsel opinion (G12 memo); H20.3 | 5 ew |
| **G27 · Online collection and Autopay** | Members pay renewals in-app; money settles to the gym | Licensed payment aggregator sub-merchant onboarding; UPI intent links in reminders; UPI Autopay for monthly plans (≤ ₹15,000 per debit without extra authentication); reconciliation into the ledger; fees never absorbed (GYM04.8) | Q31 decided | 6 ew |
| **G28 · Web console and multi-branch** | Front desks and 2–5-branch owners run from a browser | Expo web build of owner routes (packages/domain stays framework-free); branch switcher; org-level reports | Demand from pilot | 5 ew |
| **G29 · Retention depth** | The loop deepens | Automatic device import; gym-floor screen; PT packs and trainer performance; assessment day; break mode (N-09); fitness passport; first-month cohort report; at-cost broadcast credits; gym's own WhatsApp number | — | 8 ew |
| **G30 · Register reader (free)** | Paper registers go live without typing | Vision extraction of register photos into the O-06 preview, the owner confirms each row; free (D33 exception) | H12.3 model choice | 2 ew |
| G31+ · Phase 3 | Ads and sponsorship (FR-AD01); verified-activity partnerships; city events; coaching marketplace; EMI; inventory | Scale gates: 50+ gyms in one city or 100k linked members, churn < 2%/month (R3 §10.4); ads also 50,000+ MAU (R3 §15.3) | — | — |

---

## 6 · Testing and quality

**The project's working loop (10 §6) applies unchanged:**
1. entry gate;
2. test first;
3. implement;
4. **mutation-check every new guard**;
5. run it for real;
6. close with tracker, charter, TODO and handoff.

**What is new in v2:**

| Guard | Catches | Introduced |
|---|---|---|
| Route-walker isolation test | A gym route without `gym_staff()` | G16 |
| Consent-and-audit tests per staff read | Training data reaching staff without consent | G18, G21 |
| Append-only triggers + AST guard | Edited payments, consents or audit rows | G16, G17 |
| `PRO_REQUIRED` with stub call count = 0 | AI cost or leakage without an entitlement | G15 |
| Marketing-to-gym-number audit | Purpose-limitation breach | G18 |
| Catalog-completeness + source-scan | Untranslated or inline strings | G14 |
| Coordinates schema and scrub test | Location retention | G19 |
| Gym-layer containment test | Training blocked by gym failures | G19 |
| Job dedupe and double-worker test | Duplicate WhatsApps; double alerts | G16, G20 |
| Maestro gym suite on a release APK | End-to-end regressions on the phone | G13 → G23 |
| Reference-phone performance flows | Low-end Android regressions | G23 |

**Coverage:** the D18 ratchet continues. New `src/lib/query` hooks keep that folder at ≥ 90%.

---

## 7 · Rollout, exposure and pilot operations

**No feature flags exist, and none are added.** Exposure follows data:
- gym surfaces appear only to users with a staff role or a gym link;
- Pro surfaces follow the entitlement;
- server-side kill switches are environment toggles, as today: `MESSAGING_PROVIDER=none`, `SMS_PROVIDER=none`, and `BILLING_WEBHOOKS_ENABLED`.

**Environments:**
- Staging uses the WhatsApp **test number** and sandbox store purchases.
- Production gyms are created by owners whom an operator has enabled (`can_create_gym`), or by admin during the pilot. Self-serve sign-up is P2.

**Pilot operations** (detailed in G23's runbook):
- the weekly visit;
- the support WhatsApp line;
- the daily metrics glance (`/v1/admin/gym-metrics`);
- the cost report;
- the breach and incident procedure.

---

## 8 · Delivery risks

| # | Risk | Mitigation |
|---|------|-----------|
| DR-1 | WhatsApp Business verification or template approval stalls G18 | Start in G12. Receipts fall back to the native share sheet (G17) until approved |
| DR-2 | DLT registration delays OTP SMS | Start in G12. Supabase test OTPs keep development unblocked. Twilio fallback |
| DR-3 | RevenueCat native module breaks Expo Go workflows | Feature-detect with a JS fallback (G15). E2E already runs on a release APK |
| DR-4 | Tenancy bugs leak data between gyms | Route-walker (I16) from the first gym route; policy unit tests; 404 rule |
| DR-5 | Hindi rendering or `Intl` gaps on Hermes | Verify on release builds in G14 before building screens on it |
| DR-6 | Scope creep from Phase 2 into the MVP (AI calling, payments) | Phase markers in PRD v2; G24+ start only after the §6.1 gate |
| DR-7 | Concierge pilot workload overwhelms the founder | Cap at 5 gyms; a weekly visit rhythm; the runbook; hire a pilot operations person if "scale" |
| DR-8 | The account deletion and export tests fight the new gym tables | Decided in G16 (D41) before any gym-owned table with a user FK lands |

---

## 9 · Owner tasks, with lead times

| Task | Needed by | Lead time |
|------|-----------|-----------|
| Counsel engagement (DPDP, telecom, terms, DPA) | G12 | 2–4 weeks |
| Meta Business verification; WhatsApp Cloud API number; templates (invite, receipt, renewal, exit reason) in EN and HI | G18 (start in G12) | 1–3 weeks + per-template review |
| DLT registration (entity, sender header, OTP template); MSG91 account | G13 (start in G12) | 1–2 weeks |
| RevenueCat project; App Store Connect and Play Console subscription products; sandbox testers | G15 | 1 week |
| Reference low-end Android phone | G14 / G23 | days |
| Pilot gyms recruited, terms signed, posters printed | G12 → G19 | ongoing |
| Support WhatsApp number and hours | G23 | days |
| Brand and trademark check for "FitLog for Gyms" (Q32) | before printing posters | 1–2 weeks |
