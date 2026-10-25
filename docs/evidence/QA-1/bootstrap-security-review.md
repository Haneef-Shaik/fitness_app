# QA-1 · Bootstrap foundation security and correctness review (preparation)

**Date:** 25 Oct 2026 · **Reviewer:** read-only foundation/security reviewer for the Codex orchestrator
**Status:** QA-1 **preparation only**. QA-1 is not claimed and not Done; OW-1 still gates it. Nothing in
this report is evidence that any QA-1 Done-when box is met.

## 1. Scope, method and limits

**Reviewed (uncommitted `v2/develop` working tree, as of this date):**

- `supabase/migrations/` (all 14 files), `supabase/config.toml`, `supabase/seed.sql`, `supabase/.gitignore`
- `scripts/backend/` (`environment.mjs`, `preview-account.mjs`, `seed-development.mjs`, `verify.mjs`,
  `verify-gym.mjs`, `verify-freezes.mjs`, `verify-freeze-projection.mjs`)
- `apps/mobile/src/data/` (`member-store.ts`, `MemberProvider.tsx`, `cache*.ts`, `api.ts`, `gym-api.ts`,
  `gym-outbox.ts`, `useDraft.ts`, `types.ts`), plus `apps/mobile/src/lib/supabase.ts` and
  `auth-storage.native.ts` because the data layer depends on them
- `packages/domain/src/finance.ts`, `models.ts`
- `.github/workflows/mobile-ci.yml`, root `.gitignore`, `.npmrc`, root `package.json` scripts

**Method.** Static reading only. Each rule from docs/23 §9.6 was checked against the code, along with
a Supabase checklist: RLS on every exposed table, no authorization from `user_metadata`,
`security definer` kept outside exposed schemas with `search_path=''`, explicit grants and default
privileges, storage policies, no privileged key in the client, views, and the exposed schemas.

**Limits. Read these before relying on the report.**

- **No tests, builds, migrations or database commands were run.** The assertions in
  `scripts/backend/verify*.mjs` are quoted below only as what the suites *intend* to check. They are not
  evidence that anything passes.
- No external service was contacted. The local Supabase stack was not started or queried.
- The Supabase skill file named in the brief
  (`~/.codex/plugins/cache/openai-curated-remote/supabase/1.0.0/skills/supabase/SKILL.md`) is outside
  the project, and **read permission was denied**. The checklist above comes from general Supabase
  practice, not from that file.
- The secret scan was a ripgrep search for `sb_secret_`, `sb_publishable_…`, `eyJhbGciOi`,
  `service_role_key`, `SUPABASE_SERVICE` and PEM private-key headers. It found **no matches**, but
  ripgrep skips git-ignored files. `apps/mobile/.env.local` exists, is ignored by `.env.*`, and was
  deliberately not opened. This is not the full-tree secret scan that QA-1 requires.
- Out of scope: screens under `apps/mobile/src/features/`, except where cited to show impact.

## 2. Verdict per invariant

| Invariant (docs/23 §9.6) | Verdict from reading | Notes |
|---|---|---|
| Identity comes from the session | **Holds in SQL; broken on the client by F-1** | Every RPC and direct-write policy uses `auth.uid()`. `ownerId` in a payload is only compared with it. `private.member_active()` also requires a live `auth.sessions` row (`20261017161031_member_core.sql:24-31`). F-1 lets an attacker choose *which* session the app holds. |
| Staff never reach personal health data | **Holds** | No policy on `profiles`, the workout, food, body or goal tables, or `storage.objects` references gym roles. `gym_account`/`gym_dashboard` read only `gym_*` tables. Storage paths are scoped to the owner (`member_core.sql:169-174`). See F-7 for staff free text. |
| Tenant IDs are untrusted | **Holds** (F-6 is low) | `gym_command_core` derives the role from `auth.uid()` for the supplied `gymId`. Every referenced entity (`planId`, `membershipId`, `renewalOf`, `chargeId`, `paymentId`, `freezeId`) is looked up `where gym_id=gid and member_id=mid` (`20261019121035_gym_read_models.sql:24,49,53,85,98`; `20261019140839_freeze_preview_binding.sql:33,41`). |
| Money: integer minor units, append-only | **Integer: holds. Append-only: grants only (F-3)** | All amounts are `bigint … _paise` with range checks. `parseRupees` parses strings exactly (`packages/domain/src/finance.ts:5-9`). Clients have no `UPDATE`/`DELETE` on finance tables, and no command updates or deletes a finance row. Nothing inside the database enforces append-only. |
| A locally acknowledged set is durable | **Holds by reading** (F-4 and F-5 are risks) | `logSet` resolves and notifies only after `cache.write` commits an exclusive SQLCipher transaction (`member-store.ts:15-18,113-117`; `cache.native.ts:26-30`). No kill test was run. |
| No privileged frontend key | **Holds** | The client reads only `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (`apps/mobile/src/lib/supabase.ts:6`). `environment.mjs:4` refuses any key that is not `sb_publishable_`. The secret key appears only in Node test scripts, behind a `127.0.0.1:55321` guard. |
| Every exposed table has RLS | **Holds** | All 30 `public` tables enable RLS. There are no views. The exposed schemas are `public` and `graphql_public` only (`config.toml:13`), so `private` is not reachable over HTTP. Each `public` wrapper revokes `PUBLIC`/`anon`. |

## 3. Findings

Severity: **High** blocks QA-1 under its Scope 1 ("fix critical and high findings"). **Medium** and
**Low** findings are filed against their owning goal. No critical findings.

### F-1 · HIGH · Deep link accepts attacker-supplied session tokens (login CSRF / session swap)

- **Where:** `apps/mobile/src/data/MemberProvider.tsx:29-37`, mainly `:34`. The workspace switch
  happens at `:27` and `:42`.
- **Defect:** `acceptUrl` runs on every URL that opens the app (`fitlog://…`, `config scheme 'fitlog'`),
  on any path. If the fragment carries `access_token` and `refresh_token`, it calls
  `supabase.auth.setSession` with them, without asking and even when another user is signed in.
- **Exploit path:**
  1. The attacker signs up, verifies their own account, and copies their own valid token pair.
  2. The attacker sends `fitlog://x#access_token=<A>&refresh_token=<R>` as a link in SMS, chat or a web
     page. On Android, a co-installed app can fire the same intent without any tap.
  3. `setSession` succeeds, because the tokens are genuine. `onAuthStateChange` replaces the session,
     and `MemberWorkspace` remounts under the attacker's user ID. No prompt is shown.
  4. Body weight, measurements, meals, workouts and private photos that the victim logs afterwards are
     written to the attacker's account, where the attacker can read them.
  5. The switch also skips the "resolve pending work before sign-out" guard
     (`features/settings/SettingsScreen.tsx:12`). The victim's queued work is not sent, because caches
     are per user, so the harm is disclosure, not loss.
- **Why the branch is unnecessary:** the client is configured with `flowType: 'pkce'`
  (`lib/supabase.ts:9`), so genuine confirmation and recovery links return `?code=`.
  `exchangeCodeForSession` already rejects a code without this device's verifier. Only the implicit
  branch is exploitable.
- **Fix:** remove the `access_token`/`refresh_token` branch. Accept only `?code=` on the exact
  `/auth/callback` path. If a different user is already signed in, refuse or require explicit
  confirmation. Add a regression test that a crafted fragment URL does not change the session.
- **Owner if not fixed in QA-1:** MB-1 (identity and sessions); the screen side is SC-5.

### F-2 · MEDIUM · Five read policies skip the revoked-session check

- **Where:** `profile_read` (`20261017161031_member_core.sql:34`); `role_read`, `register_read` (linked
  branch) and `plans_read` (linked branch) (`20261017164708_gym_operations.sql:107-109`); `gym_read`
  (linked branch) (`20261019120627_gym_command_guards.sql:2`).
- **Defect:** these policies test only `auth.uid()`. They do not call `private.member_active()`, which
  is where the live `auth.sessions` check and the `status='active'` check live.
- **Failure path:** after a sign-out or a session revocation, a copied access token stays valid until
  `jwt_expiry` (3600 s, `config.toml:166`). During that window it can still read:
  - the profile, including date of birth;
  - the linked register row (name, phone, email, staff notes and tags);
  - linked gyms and plans;
  - the user's own staff roles.

  This contradicts MB-1's box "a revoked session fails on its next request". A disabled account
  (`status<>'active'`) can still read its profile.
- **Fix:** add `and (select private.member_active())` to each of these policies or branches.
- **Owner:** MB-1 (`profiles`) and G16.api (gym tables).

### F-3 · MEDIUM · "Append-only finance" rests only on grants

- **Where:** grants in `20261017164708_gym_operations.sql:94-105`. No trigger exists on `gym_charges`,
  `gym_payments`, `gym_allocations`, `gym_charge_adjustments`, `gym_principal_events`, `gym_receipts`,
  `gym_receipt_counters` or `gym_audit`.
- **Defect:** append-only is enforced only because the `authenticated` role has no `UPDATE`/`DELETE`
  grant.
- **Failure path:** the service key, any future `security definer` function or a migration can
  `UPDATE`/`DELETE` ledger and audit rows without trace. The test fixtures already do this on the local
  stack: `scripts/backend/verify-gym.mjs:62-63` and `verify-freezes.mjs:78-79` call `DELETE` on every
  finance table with the secret key. The rule in PRD §13 and docs/23 §9.6 ("reversals and refunds are
  new records, never edits") is not enforced in the database.
- **Fix:** add `BEFORE UPDATE OR DELETE` triggers that raise on finance and audit tables. Fixtures can
  either clean up through a dedicated, documented test-only path or use disposable databases. Add a
  test showing that the service role cannot edit a payment.
- **Owner:** G17.api (append-only finance).

### F-4 · MEDIUM · A permanently rejected operation strands acknowledged sets, with no retry or review path

- **Where:** `apps/mobile/src/data/member-store.ts:57-61` (classification) and `:51-52` (dependants
  skip). The sign-out block is `features/settings/SettingsScreen.tsx:12`.
- **Defect:** `42501` and every `22xxx` error mark an operation `rejected`, and `40001`/`23505` mark it
  `conflict`. Neither status is ever retried. Every later operation on the same entity depends on the
  stuck one, so none of them is sent.
- **Failure path:** `42501` is also what `private.member_active()` produces when the JWT's session row
  is gone, for example after a sign-out on another device while this access token is still valid. A
  transient identity state therefore permanently strands a workout's acknowledged sets on the device.
  The sets stay on the device, but they never reach the server, and sign-out stays blocked because no
  review UI exists.
- **Fix:** treat `42501` caused by session state as re-authentication-then-retry, not as rejection.
  Implement the conflict-review path that MB-3 already requires.
- **Owner:** MB-3 (durable outbox, "stale revision goes to conflict review").

### F-5 · MEDIUM · Each set commit rewrites the member's entire cache

- **Where:** `apps/mobile/src/data/cache.native.ts:26-30`. The callers are `member-store.ts:15-18`, and
  every `persist`, including draft autosaves (`useDraft.ts:16`).
- **Defect:** every write serialises every session, set, food, meal, body entry, goal and exercise
  into one JSON row.
- **Failure path:** cost grows with history. That puts MB-3's "durable commit p95 < 100 ms on the
  reference Android" budget at risk. It also widens the time between the tap and the acknowledgement,
  during which a kill loses the tap. That loss is not wrongly acknowledged, but it does feel like
  "I logged it and it vanished".
- **Also:** `PRAGMA synchronous` is never set (`:20`), so power-loss durability depends on the
  SQLCipher build's default for WAL mode.
- **Fix:** per-record tables, or at least separate rows for the outbox and the active session. Set
  `synchronous=FULL` explicitly.
- **Owner:** MB-3.

### F-6 · MEDIUM · Members can claim catalogue IDs for exercises and foods

- **Where:**
  - `exercises_insert` (`20261017161031_member_core.sql:53-54`) with primary key `(id,version)` (`:47`);
  - `foods_insert` (`:110`) with primary key `id` (`:101`);
  - the predictable development IDs and `on conflict(id,version) do nothing` in
    `scripts/backend/seed-development.mjs:30-31`.
- **Defect:** any active member can insert a row with an arbitrary `id` (and `version`) as long as
  `owner_id` is their own.
- **Failure path:** a member inserts `(catalogueId, version+1)`, or the next sequential catalogue ID,
  as a private row. A later catalogue seed for the same key is then either silently skipped
  (`do nothing`), so no other user ever receives that exercise version, or fails outright. One account
  can degrade the shared catalogue for everyone. Shared rows stay confidential.
- **Fix:** give member-owned and catalogue rows separate key spaces. Options: server-generated IDs for
  member inserts; a check that rejects member inserts whose `id` exists with `owner_id is null`; and
  seeds that fail loudly on a conflict with a row they do not own.
- **Owner:** CT-1 (seed idempotency) with MB-2 (custom exercise versions); MB-5 for foods.

### F-7 · LOW · Advisory and row locks are taken before authorization in `freeze_action`

- **Where:** `supabase/migrations/20261019140839_freeze_preview_binding.sql:17-21`.
- **Defect:** `pg_advisory_xact_lock(gym)` and `select … from gym_members … for update` both run
  before the `gym_record_access` check.
- **Failure path:** any authenticated user who knows a `gymId`/`memberId` can repeatedly call
  `freeze_preview_v1` and briefly contend another tenant's gym lock and member row. Each call is then
  rejected with `PT404`, so no data is exposed; the impact is contention only.
  `gym_command_core` already checks the role before locking (`20261019121035_gym_read_models.sql:9-13`).
- **Fix:** check `gym_role`/`gym_record_access` first, then lock.
- **Owner:** G17.api.

### F-8 · LOW · Smaller hardening items

| # | Where | Item | Owner |
|---|---|---|---|
| a | `20261019122347_function_lint_cleanup.sql:54-56` | `programme.save` uses `on conflict(id) do update` without `where programmes.owner_id=excluded.owner_id`. Ownership is checked earlier, but a race on the same client-generated ID by two users could overwrite another user's programme. The IDs are unguessable UUIDs, so this is defence in depth. | MB-2 |
| b | `20261017164708_gym_operations.sql:21,108` | A linked member reads their own register row, including staff `notes` and `tags`. Decide whether staff free text is visible to the member, and guard it against health content under PRD §16.1. | G18.api / G17.api |
| c | `20261019121035_gym_read_models.sql:16-19` | Any active member can call `gym.create`, become `owner` and claim any free `code`. Owner verification and onboarding are not built yet. | G16.api |
| d | `20261019121035_gym_read_models.sql:71`; `20261017164708_gym_operations.sql:64-67` | A front-desk user can bypass the duplicate-reference review with a self-set `reviewDuplicateReference: true`. `gym_principal_events.method` has no check constraint, unlike `gym_payments.method`. | G17.api |
| e | `20261017164212_workout_correction_commands.sql:19-22` | Every member operation, including each `set.commit`, stores a full session snapshot with all its sets. Storage grows quadratically per workout. | MB-4 |
| f | `apps/mobile/src/data/api.ts:28` with `MemberProvider.tsx:69` | Every 15-second sync calls `refresh_schedules_v1`. That iterates about 366 days × plan days per schedule (`20261017163754_scheduling_and_history.sql:20-27`). | MB-2 |
| g | `apps/mobile/src/data/cache.web.ts:16-20` | The web AES-GCM key is stored next to the ciphertext in the same origin's IndexedDB. It is obfuscation, not protection. Acceptable only while web stays a preview target. | MB-3 |
| h | `supabase/contracts.sql`, `contract-validation.sql`, `gym-read-models.sql`, `gym-freezes.sql` | SQL copies outside `migrations/` are not executed and can drift from the migrations. | AR-1 (replay and diff) |
| i | `scripts/backend/preview-account.mjs:15` | Writes synthetic credentials to `/private/tmp`. The path exists only on macOS; the file mode is 0600. | QA-1 portability note (no security impact) |

## 4. Planned features that are missing (not foundation defects)

These are absent by design and belong to later goals. None of them is evidence of a defect.

- **Member–gym linking:** there is no command that sets `gym_members.linked_user_id`. Tests link
  members with the secret key (`verify-freezes.mjs:29`). Owner: G18.api.
- **Staff management:** there is no command to grant or revoke `gym_roles`; tests use the secret key
  (`verify-gym.mjs:26,52`). Owner: G16.api.
- **Offline gym payments:** `gym-outbox.ts` replays a queued `payment.record` automatically and the
  receipt is issued on sync. G17.app requires a provisional acknowledgement and *authorized*
  reconciliation (AC37). Owner: G17.app / G19.api.
- **Offline food, body and goal writes:** these are online-only (`member-store.ts:194`), so nothing
  unsaved is acknowledged. Owners: MB-5 / MB-6 / AP-6.
- **Conflict-review UI** for `conflict`/`rejected` operations. Owner: MB-3 (see F-4).
- **CI backend job:** `mobile-ci.yml` does not start Supabase or run `pnpm backend:test`. Owner: PL-1.
- **Production auth configuration:** `config.toml` is local-only (for example
  `secure_password_change = false`, email `max_frequency = "1s"`). Owners: PL-2 / PL-4 / MB-1.

## 5. Checked and found sound by reading (not tested)

- **Hosts and keys.** Every backend script refuses any host but `127.0.0.1:55321`. The secret key is
  used only in Node scripts. `environment.mjs` writes `.env.local` with mode 0600 and only the
  publishable key.
- **SQL function safety.** Every `security definer` function lives in `private` with
  `search_path=''`. Each `public` RPC wrapper is `security invoker` and revokes `PUBLIC`/`anon`.
- **Grants.** Default table grants are revoked after each new table is created, so Supabase's
  `auto_expose_new_tables` default does not leak tables.
- **Idempotency and revisions.** Member and gym commands store their outcome under a global operation
  ID, bound to owner or actor and gym, and verify an input hash. A replay returns the original result;
  changed input is rejected. Base and expected revisions are enforced.
- **Gym ledger.**
  - Receipt numbers come from a per-gym, per-year counter inside the command transaction, so they are
    gap-free.
  - Refunds and reversals check that principal ranges do not overlap (`int8range &&`).
  - Waivers and refunds release allocations; they never edit them.
- **Adult-only accounts.** `complete_onboarding` enforces age 18 or over in the supplied time zone
  (self-attested DOB). `gym_members` rejects minor records.
- **Local cache.** The native cache refuses to open unless SQLCipher is active (`cipher_version`). The
  key is per user in SecureStore (`WHEN_UNLOCKED_THIS_DEVICE_ONLY`). Each account has its own database
  file, and `initialize()` rejects a cache whose rows belong to another owner.
- **CI.** `pull_request` (not `pull_request_target`), `permissions: contents: read`, actions pinned by
  SHA, `persist-credentials: false`, and no secrets referenced.
- **Ignore rules.** `.gitignore` covers `dist/`, `dist-native/`, `dist-verified/`, `.expo/` and `.env.*`.
  `supabase/.gitignore` covers `.temp` and `.branches`. Root `error.log` and `artifacts/` are untracked
  and **not** ignored; check them before committing (QA-1 Scope 2).

## 6. Blocker summary for the orchestrator

- **QA-1 blockers (High): 1.** F-1, deep-link session injection in
  `apps/mobile/src/data/MemberProvider.tsx:34`. Fix it before the foundation lands on `main`, or the
  owner records a documented downgrade and files it against MB-1 with a regression test.
- **Medium, file against the owning goal:**
  - F-2: revoked-session reads (MB-1, G16.api)
  - F-3: append-only finance not enforced in the database (G17.api)
  - F-4: outbox strands rejected operations (MB-3)
  - F-5: whole-cache rewrite and the `synchronous` pragma (MB-3)
  - F-6: catalogue ID squatting (CT-1, MB-2, MB-5)
- **Low:** F-7 and F-8a–i, each with its owner named above.
- **Not established by this review:** whether any suite passes, whether migrations replay, whether
  the tree is free of secrets (ignored files were not scanned), and anything else that needs execution.
  QA-1's Done-when boxes remain open.
