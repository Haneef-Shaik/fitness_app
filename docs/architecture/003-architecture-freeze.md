# 003 — Architecture and contract freeze (proposal)

| Field | Value |
|---|---|
| Status | **Approved by delegation on 26 October 2026 (G-1).** Codex, acting as the owner's explicitly delegated decision-maker, approved this record as the AR-1 freeze in [tracker row ARCH-01](../09-PROJECT-TRACKER.md#decision-log). The delegation is recorded as AUTH-01. The owner did not personally review or sign it. AR-1 is not Done. *Historical: until then this row read "Proposal. Owner approval PENDING."* |
| Goal | AR-1. Phase 1 wrote this record, the [checkpoint](../plan/runs/AR-1/checkpoint.md) and the [next-phase test plan](../plan/runs/AR-1/test-plan.md). Revision 1 answers the independent phase-1 review ([review](../evidence/AR-1/phase1-review.json); [dispositions](../plan/runs/AR-1/phase1-dispositions.md)). Revision 2 answers proposal findings PR-1 to PR-6 of the second checkpoint review ([review](../evidence/AR-1/checkpoint-review2.json); [dispositions](../plan/runs/AR-1/proposal-revision2.md)). Revision 3 answers the eight low findings R2-1 to R2-8 of the proposal re-review ([review](../evidence/AR-1/proposal-review3.json); [dispositions](../plan/runs/AR-1/proposal-revision3.md)). Proposal review 4 passed revision 3; its five low findings N-1 to N-5 are applied ([review](../evidence/AR-1/proposal-review4.json); [dispositions](../plan/runs/AR-1/proposal-final-low-dispositions.md)). Phase 2A is in progress ([phase2A.md](../plan/runs/AR-1/phase2A.md)). AR-1 is **not** complete |
| Date | 26 October 2026 (draft, revisions 1–3 and the final low corrections) |
| Read at | Branch `codex/ar1-contract-freeze`. Code is cited as read at `9f148c1` (QA-1 accepted on local `main`); no cited migration has changed since. Phase 2A's snapshot is committed in `07757a5` and its corrections in `22c5386`, on this branch only: not merged |
| PRD | §§21.1–21.4, 22.1, 22.3, 26.1 (M0), 26.2; DEC-02 (technical part) |
| Relation | [001](001-mobile-foundation.md) is historical. [002](002-connected-member-and-gym.md) records the 17–19 October implementation. This record sets the target that implementation converges on. Neither earlier record is edited |

## Current state — G-1 approved by delegation, 26 October 2026 (read this first)

- **G-1 is approved.** Codex, acting as the owner's explicitly delegated decision-maker, approved this
  record (revision 3 with the final low corrections N-1 to N-5) with no exceptions:
  [tracker row ARCH-01](../09-PROJECT-TRACKER.md#decision-log). AUTH-01 records the owner's delegation
  in their own words. The owner did not personally review or sign this record.
- **Basis.** Independent [proposal review 4](../evidence/AR-1/proposal-review4.json) and the independent
  [guard review](../evidence/AR-1/guard-review.json) both PASS. Local gates: 185 tests in `pnpm check`,
  39 guard tests, a 15-migration replay with a strict empty diff, 8 persisted schemas matching, and the
  shared AC03 fixture passing.
- **Not decided by G-1.** R-1 to R-7 (§11). Under AUTH-01, routine technical and vendor-technical
  choices now belong to Codex, but account access, payments, external messages, legal and licence
  positions and device proof still need real evidence. None is claimed.
- **Not Done.** The bundled `pnpm backend:test` has not run; the coordinator runs it after applying the
  additive private formula migration to the existing local test stack, and no outcome is assumed here.
  A fresh independent verifier must then pass all four AR-1 boxes, and only after that PASS is the
  branch integrated locally. No goal status, acceptance row or ledger entry is changed.

## Earlier addendum, 26 October 2026 (historical)

*Written before G-1 and before the guard review's verdict; its "still open" line is superseded above.*

Reported by the coordinator and not independently verified, except where a review is named. Status
lines further down (for example §7's "four other files" and §8's "not built yet") are historical: they
keep what their authors saw. This addendum supersedes them.

- **Commits on `codex/ar1-contract-freeze`, not merged:** `07757a5` (contract snapshot), `22c5386` (P2A
  corrections), `3040ccf` (revision 2 and review copies), `ac71e51` (revision 3), `fcc9aed` (box-4
  fixture files), and `e23e9ae` (SQL-source guard, runner wiring, and the retirement of five files:
  `supabase/contracts.sql`, `contract-validation.sql`, `gym-read-models.sql`, `gym-freezes.sql` and
  `scripts/backend/contracts.ts`; comparison table in [phase2C.md](../plan/runs/AR-1/phase2C.md)). The
  final low corrections are uncommitted.
- **Evidence on the branch:** the canonical review and evidence files are copied into
  `docs/evidence/AR-1/`, including [`p2a-review3.json`](../evidence/AR-1/p2a-review3.json),
  [`proposal-review3.json`](../evidence/AR-1/proposal-review3.json) and
  [`proposal-review4.json`](../evidence/AR-1/proposal-review4.json). The existing
  `checkpoint-review2.json` parses to the same JSON as the canonical copy; only formatting differs.
- **Runs:** `pnpm check` passes with 185 tests, and the 39 new backend unit tests pass. The new guarded
  runners pass against an owned local replay stack (API 56321, DB 56322): all 8 persisted schemas match
  the snapshot, and the fixture runs exactly 16 set vectors and 2 session vectors. Missing AC03 IDs, a
  mutant bound and changed expectations each fail, and the originals then pass. All 15 migrations
  replay from empty to head with a strict empty schema diff and a clean lint. The original four backend
  suites pass separately on the 55321 stack. The bundled `pnpm backend:test` has **not** run, because
  the new migration is not applied on 55321. Evidence:
  [`guard-coordinator-gates.md`](../evidence/AR-1/guard-coordinator-gates.md),
  [`replay-verification.md`](../evidence/AR-1/replay-verification.md),
  [`real-runner-probes.json`](../evidence/AR-1/real-runner-probes.json).
- **Reviews:** proposal review 4 independently passed revision 3, with five low findings (N-1 to N-5)
  applied here and no further re-review requested. The independent review of the guards is still
  running.
- **Still open:** the owner's G-1 approval (PENDING); the guard review; merge and a hosted CI run; the
  lane S2 notice at handoff (§7); the final goal verifier and integration. No box is claimed done, and
  AR-1 is neither complete nor accepted.

## 1. How to read this record

- **Decision** is an engineering decision this record takes. The owner has authorised routine,
  reversible engineering, so a decision can be acted on now; phase 2 does not wait for approval. The
  record as a whole is frozen when the owner approves it (G-1). That happened on 26 October 2026 by
  explicit delegation: Codex, as the owner's delegated decision-maker, approved it (ARCH-01, under
  AUTH-01). A later record or an append-only migration can still change any decision.
- **Implemented** means present in the code as read at `9f148c1`. Where a behaviour was proven by a
  test run, the run is QA-1's ([handoff](../plan/runs/QA-1/handoff.md)). No command was run to write
  this record.
- **Missing** means the PRD requires it and the code lacks or contradicts it. Each item names the goal
  that owns it.
- **Planned** is a decided change that no code carries yet. The v1 wire-format changes (§4.4–§4.9)
  are planned. Contract 0.1.0 publishes only today's schemas (§8).
- **Owner-reserved** items are not decided here, and no approval is claimed for them. They are region,
  accounts and plan purchases, vendor adoption, legal positions, prices, the AI vendor and the photo
  backup policy (§11). A **candidate** is a named option that has never been provisioned: no account,
  no key, no terms accepted. This record provisions nothing.

## 2. Platform

| Layer | Decision | Today | Candidates, never provisioned | Status |
|---|---|---|---|---|
| Mobile clients | React Native, Expo SDK 57, strict TypeScript | Owner-confirmed (TECH-01, 17 Oct) | — | Owner-confirmed |
| System of record | PostgreSQL 17 on Supabase | Local only: project `fitlog_rebuild_20261017`, API 55321, DB 55322 (`supabase/config.toml:5,10,34,41`) | — | Decision. Hosted projects and plan: R-2. Region: R-1 |
| API | Supabase PostgREST RPCs for data; Supabase Edge Functions for provider, webhook, file-proxy and health endpoints | Nine PostgREST RPCs and direct table access; no Edge Function exists | A separate API host (Render, Railway, Fly.io) only if measured Edge limits fail (§3.5) | Decision |
| Identity | Supabase Auth | Email and password, local | SMTP: Resend or Postmark. SMS: MSG91 through an Auth SMS hook | Decision. Vendors: R-3; MB-1, G13 |
| Object storage | Supabase Storage, private buckets only, with an Edge proxy where revocation must be immediate (§3.4) | One private bucket, `personal-images` | — | Decision; MB-6 |
| Jobs and workers | Job tables in Postgres; a worker Edge Function claims leases | None | A separate worker host, only if measured limits fail | Decision |
| Scheduler | `pg_cron`, waking workers through `pg_net` | None | — | Decision |
| Subscriptions | Direct store server notifications behind a provider-neutral adapter | None | RevenueCat | Decision. RevenueCat adoption: R-3 |
| AI gateway | Provider-neutral adapter, called only by the worker | None | Models are chosen by AI-2 measurements | Decision. Model and vendor: R-6 |
| Messaging | Utility-template adapter (WhatsApp, SMS) and a push adapter | None | MSG91 (SMS, DLT); Meta WhatsApp Cloud API or a reseller; Expo push service | Decision. Providers: R-3, DEC-05 |
| Monitoring | Client and Edge error tracking behind a scrubbing adapter, Supabase logs, private metrics and alerts | None | Sentry, with its data region chosen at creation | Decision. Vendor and region: R-3 |
| Hosting region | — | None chosen | Supabase Mumbai (`ap-south-1`) is the engineering recommendation (§9); Singapore was archived, never answered | Owner-reserved: R-1 |
| Builds | EAS Build and Submit | None | — | Accounts: R-2; PL-7 |

## 3. Components (PRD §21.1)

### 3.1 Mobile clients

- **Decision.**
  - The app is a client of the contract package `@fitlog/domain` and holds no privileged key.
  - Every request carries `x-fitlog-contract: <CONTRACT_VERSION>` and an `x-request-id` UUID.
  - Records and their outbox operation commit in one local transaction before the UI acknowledges
    them (§20.2). Client calculations are provisional; server values are authoritative.
  - On `409 OPERATION_REUSED` the client first calls `operation_result_v1` (§4.6). It retries
    `DEPENDENCY_PENDING` only while the dependency is still queued or syncing on the device.
- **Implemented.** Expo SDK 57 app; only the publishable key reaches the client
  (`scripts/backend/environment.mjs:4-5`). Per-account SQLCipher cache with its key in SecureStore.
  Outbox with stable IDs, dependencies and base revisions (`apps/mobile/src/data/member-store.ts`).
  PKCE-only auth callback (QA-1 F-1, fixed and independently verified).
- **Missing.** Contract and request-ID headers; one envelope and error parser; conflict review UI
  (MB-3). Each sync downloads every own row in 500-row offset pages (`apps/mobile/src/data/api.ts:7-18`)
  instead of a cursor sync (MB-3). The web cache key sits beside its ciphertext (QA-1 F-8g, MB-3).
  Native builds and device QA (PL-7, PL-8, QA-3).

### 3.2 Authenticated versioned API

- **Decision.** §4 defines the whole `/v1` contract.
- **Implemented.** RPCs `complete_onboarding`, `apply_operation_v1`, `schedule_programme_v1`,
  `refresh_schedules_v1`, `gym_command_v1`, `gym_account_v1`, `gym_dashboard_v1`, `freeze_command_v1`
  and `freeze_preview_v1`. Each is a `security invoker` wrapper over a `private` definer with a fixed
  `search_path`. Direct table reads behind RLS for every member table, and direct inserts or updates
  for `meal_items`, `body_entries`, `goals`, `nutrition_targets`, `foods`, `exercises` (archive flag
  only, `20261017164336_validated_contracts.sql:64-65`) and `profiles` (named columns only).
- **Missing.** Success and error envelopes, a request ID, the error-code catalogue, cursors, rate
  limits, the contract-version check and OpenAPI. Mutation keys for the direct table writes. §4.15 has
  each rule.

### 3.3 Relational transactional store

- **Decision.**
  - Postgres is the only system of record. `public` holds tables and the `_vN` invoker wrappers.
    `private` holds every definer, with `search_path=''`.
  - Each definer checks identity, active account and current session before anything else (§4.3).
  - Every exposed table has RLS and explicit grants.
  - Every mutable entity has created and updated times and a server-owned revision (PRD §21.2).
  - Derived tables can always be rebuilt from source rows and formula versions. Migrations are
    append-only (§7).
  - Append-only tables reject `UPDATE` in a trigger, even from definer code.
  - Gym finance and gym audit rows also reject `DELETE`.
  - Personal append-only rows (set and session history, operation keys, consent events) can be
    deleted only by the erasure job. That job marks its transaction with the account being erased, and
    the trigger allows a `DELETE` only of that account's rows. Whether consent events must be kept
    after erasure is R-4.
- **Deletion graph (decision).** Erasure removes personal data without touching append-only rows:
  - **Actor key.** `private.actors(id, kind, created_at, erased_at)` holds one row per account, plus
    the support and system principals below. A member's row is created at onboarding, and no row is
    ever deleted. It has no name, contact or health field. A member's `id` is the auth user ID, so
    policies that compare with `auth.uid()` keep working.
    - `actors.id` has **no foreign key** to `auth.users` or `profiles`. Deleting the profile (step 5)
      or the auth user (step 6) therefore neither cascades into the actor row nor is blocked by the
      `RESTRICT` references to it.
    - `complete_onboarding` inserts the actor row in the same transaction as the profile, before the
      profile (`on conflict do nothing`, so a retry is harmless). Today that transaction inserts the
      profile at `20261017164336_validated_contracts.sql:83`. Every writer of an actor reference
      first passes `member_active()`, which needs the profile
      (`20261019121035_gym_read_models.sql:8`; `20261019140839_freeze_preview_binding.sql:16`). So no
      actor reference can exist before its actor row.
    - **An erased actor stays erased (revision 3).** After its insert, `complete_onboarding` reads the
      actor row and refuses, with the error it gives a profile that is not active
      (`20261017164336_validated_contracts.sql:80`), when `erased_at` is set. A conflict with an erased
      row is therefore never silently accepted. `member_active()` also requires the caller's
      `erased_at` to be null.
    - **Principals without onboarding (revision 3).** Each row records its kind: `member`, `support`
      or `system`. A support operator's row is inserted in the transaction that provisions the support
      principal. System jobs act as one `system` row, which the migration that adds the table seeds
      under a fixed reserved UUID that is not an auth user ID; a job's audit row also carries its job
      ID. The member erasure job refuses any row whose kind is not `member`, so neither kind can be
      erased through the member path.
    - The migration that adds the table inserts one row for every existing profile before it adds the
      foreign keys. Existing rows are kept.
  - **Actor references point at the actor key.** These are `actor_id`, `decided_by` and
    `gym_roles.user_id`, the actors on `gym_commands` and `gym_audit`, and every future consent, role,
    support and job audit actor. Each references `private.actors(id)` with `ON DELETE RESTRICT`.
    Erasure never updates those rows, so they stay immutable and no foreign-key action ever fires on
    them.
  - **Gym link.** `gym_members.linked_user_id` references `profiles(id)` with `ON DELETE SET NULL`
    (PRD §21.2). Gym ledger and receipt rows never cascade from a user.
  - **Personal tables.** `owner_id` references `profiles(id)` with `ON DELETE CASCADE`, as a backstop
    only. MB-7's erasure job deletes in an explicit, observable order:
    1. revoke sessions and staff roles, set `profiles.status` to `deletion_pending`, and ban the auth
       user, so that neither an old session nor the password can act again. `member_active()` and
       `complete_onboarding` already refuse both (`20261017161031_member_core.sql:27-28`;
       `20261017164336_validated_contracts.sql:74,80`), and issuing or finalizing an upload checks
       `member_active()` (§3.4). An upload URL issued just before step 1 can still deliver bytes
       until it expires; step 3 handles that (final low finding N-3). After step 5 deletes the
       profile, the ban and `erased_at` still stop a new onboarding until step 6 succeeds
       (revision 3);
    2. append the tombstone to the external register and confirm it (below), then set
       `actors.erased_at`. Step 3 does not start until the append is confirmed;
    3. delete objects. Step 3 starts only after the longest upload-URL lifetime in force (600 s by
       decision, §3.4; MB-6 measures the real value) has passed since step 1, so that no
       already-issued URL can still deliver bytes. It then deletes every object under the account's
       `<owner id>/` prefix in every personal bucket, whether or not an asset row references it
       (final low finding N-3);
    4. delete derived rows, then source rows;
    5. delete the profile, which fires the `SET NULL` on the gym link;
    6. delete the auth user.

    Each step is a job attempt. A failed step alerts and retries (PRD §22.3).
  - **Tombstone register (decision, revision 2).** A backup or point-in-time copy taken before an
    erasure has `erased_at` empty for that account, so a register that lives only in the database
    cannot stop a restore from bringing the user back. The register therefore has two copies:
    - **External register.** This is the copy that restores rely on. Each entry holds the actor UUID,
      the erasure time and the erasure job ID, and no personal field. It lives outside every database
      rollback domain: not in the production database, its backups or point-in-time copies, or any
      other database a restore can roll back. A Storage bucket in the same project does not qualify,
      because its object metadata and listing live in `storage.objects`, inside the database being
      restored. The register is append-only: the erasure worker's credential can add an entry and
      extend its retention, but cannot overwrite, shorten or delete one. An entry goes only when its
      retention ends.
    - **Append before erasure completes.** Step 2 appends the entry and waits for confirmation before
      step 3 deletes anything. If the append fails, the attempt fails closed: no later step runs, the
      job alerts and retries (PRD §22.3), and the account stays revoked by step 1. The append is
      idempotent on the actor UUID, so a retry never adds a second entry. If retries run into the
      30-day primary-store erasure deadline, the deadline signal fires (§3.11).
    - **Retention.** An entry is kept until every backup and point-in-time copy taken before
      `erased_at` commits has expired. Its clock therefore starts at the later of the append and the
      `erased_at` commit, not at the append alone (revision 3):
      - The entry is written with retention = append time + the longest backup expiry in force + 30
        days. The 30 days are the erasure deadline (§3.11), and they cover step 2's retries between
        the confirmed append and the `erased_at` commit.
      - If step 2 is still retrying when that margin would run out, the worker first extends the
        entry's retention by the same bound from the current time, confirms the extension, and only
        then sets `erased_at`.
      - Backup expiry itself does not change: 90 days or less by default (PRD §22.3), and longer only
        for a recorded backup-retention exception, which lengthens the bound with it.
      - The entry therefore outlives the backups it covers, by up to 30 days. Whether keeping the bare
        UUID for that bound fits the reviewed retention schedule is R-4. This record does not claim
        that it does.
    - **In-database copy.** `actors.erased_at` remains as the copy inside the database. It covers
      copies taken after an erasure; the external register covers copies taken before it.
    - **Restore.** PL-5's runbook restores into an isolated project that serves no client. It imports
      the external register. For every account that is listed there, or has `erased_at` set, it sets
      `erased_at` and runs this purge order from step 3. It checks that no personal row, object
      reference or auth user remains for any of those accounts, and serves clients only after that
      check passes. A restore path that cannot keep clients out until then is not used. Revision 3
      adds three rules:
      - **Quiet until checked.** Until the check passes, the restored project runs no `pg_cron` job
        and no `pg_net` wakeup, and holds no worker or messaging credential. So restored jobs cannot
        process or message an erased account before the purge.
      - **Cutover delta.** At cutover, the runbook stops the source project's erasure worker if the
        source still runs, imports the entries appended since the first import, purges those accounts
        as well, and only then switches clients.
      - **Pending erasures at cutover (final low finding N-2).** Once the source's erasure worker has
        stopped, the runbook copies the source's pending erasure requests (requested, or past step 1
        but not yet appended) into the restored project and runs each from step 1 before clients
        switch over. If the source is unavailable, the residual is stated: erasure requests made
        inside the RPO window are lost from the restored project, and PL-5 must reconcile them before
        declaring the restore complete.
      - **Object copies.** Every restore of object copies gets the same import and purge. The check
        also confirms that no object remains under a tombstoned `<owner id>/` prefix (§3.4) in any
        personal bucket, because bytes restored from an object copy may have no database reference.
        Whether object copies exist at all is R-7.
    - **Proof.** MB-7 box 2's test (GOALS.md:663) restores a pre-erasure snapshot and replays the
      tombstones from the external register, never from `erased_at`. A second test shows that a failed
      append stops erasure before step 3. A third shows that a sign-in between steps 5 and 6 cannot
      complete onboarding (revision 3). PL-5's drill runs the same import and purge, and AC30 checks
      that no erased account comes back. None of this has run.
    - **Candidate arrangement (never provisioned).** A write-once object store with a retention lock
      (object lock in compliance mode or an equivalent), in a storage account separate from every
      Supabase project. Each tombstone is one object, named by actor UUID. Its retention date is set to
      the bound above when it is written, and extended if step 2 outlasts the margin; compliance-mode
      retention can be extended but never shortened. `worker-v1` holds a credential in Edge secrets that
      can only write and extend retention; only the restore runbook holds a credential that can list and
      read. A separate ops database would not satisfy the
      rule, because its own restores could roll the register back.
    - **Status of the arrangement.** The decision is about the properties above. The store, its account,
      vendor and region are not chosen. Opening an account is R-2, adopting the vendor is R-3, and
      keeping the bare UUID in the register is R-4. MB-7 configures the register and PL-5 proves it.
      Nothing has been provisioned, and no owner or external approval is claimed.
  - Whether keeping the bare actor UUID after erasure, in `private.actors` and in the external
    register, fits the reviewed retention schedule is a legal question (R-4, DEC-04). The UUID carries
    no personal field.
- **Implemented.**
  - Owner foreign keys, and composite `(owner_id, id)` keys between sessions, occurrences and
    programmes (`20261017161031_member_core.sql:69-88`).
  - One active workout per user (`:86`), one completed session per occurrence (`:87`), unique set
    mutation IDs (`:91`).
  - Gym tables reference each other through `(gym_id, member_id)` composite keys, so a reference cannot
    point at another gym's member (`20261017164708_gym_operations.sql:39-85`).
  - Receipt numbers are unique per gym and come from a per-gym, per-year counter inside the command
    transaction (`20261019121035_gym_read_models.sql:76-79`).
  - Settled finance tables have no client write grant (`20261017164708_gym_operations.sql:94-105`).
- **Missing.**
  - Database-level immutability for append-only tables (G17.api; QA-1 F-3).
  - The deletion graph above. Today `gym_members.linked_user_id` and every `actor_id` reference
    `profiles(id)` with no `ON DELETE` rule (`20261017164708_gym_operations.sql:9,22,42,47,52,57,62,67,72,83,88,91`).
    `gym_freezes.decided_by` also references `profiles(id)` with no `ON DELETE` rule (column at
    `20261019140429_gym_freezes.sql:7`, constraint `gym_freezes_decided_by_fkey` at `:185-186`). The
    migration that adds `private.actors` drops `gym_freezes_decided_by_fkey` when it re-points the
    column to `private.actors(id)` with `RESTRICT`; otherwise erasure step 5 would fail for any owner or
    manager who has decided a freeze (final low finding N-1). `profiles` cascades from `auth.users`
    (`20261017161031_member_core.sql:7`), and personal tables reference `profiles` without a cascade. So
    deleting an auth user who has any personal row or any staff action fails today (MB-7, G17.api).
  - The actor table, the external tombstone register and the restore runbook's import and purge
    (MB-7, PL-5; owner-reserved parts R-2, R-3 and R-4).
  - Created and updated times are missing on `meal_items`, `body_entries`, `goals`,
    `nutrition_targets`, `workout_sessions`, `performed_sets` and `schedule_occurrences`
    (`20261017161031_member_core.sql:69-144`). Mutable gym tables have no updated time
    (MB-3, MB-5, MB-6, G17.api).
  - The §21.2 indexes for date-range history, diary and due amounts (MB-4, MB-5, G17.api).
  - Data dictionary and retention matrix (PD-02; AR-1 is an early prover).

### 3.4 Private object storage

- **Decision.**
  - Private buckets only: `personal-images` (progress and saved food photos), `ai-inputs` (temporary
    food photos), `exports` (bundles) and `gym-documents` (gym-owned files).
  - Object keys are `<owner or gym id>/<asset id>`. A `public.assets` row is the source of truth for
    owner, scope, type, size, sanitised state, retention and deletion.
  - Clients never sign URLs. Every access path calls the same SQL access predicate that table RLS uses
    (PRD §21.1, last line). Signed downloads expire after 300 seconds and uploads after 600 seconds.
  - Uploads: an `upload_intent_v1` RPC atomically reserves bytes and an asset count against 1 GiB and
    2,000 assets, with at most 10 open intents per user. A finalize step rechecks access, checks the
    actual object (size, type, sanitisation), adjusts the reservation, and deletes objects whose intent
    expired.
  - Staff are never issued a URL for a personal asset.
- **Revocation, per bucket (decision).** PRD §22.1 requires an authorised proxy or revocable access
  where immediate revocation is needed. A signed URL cannot be recalled before it expires.

  | Bucket | Readers | Access path | Revocation |
  |---|---|---|---|
  | `personal-images` | The owner | Edge-issued signed URL, 300 s | New URLs stop at the moment the session or account is revoked, because issuance calls `member_active`. A URL issued earlier works for up to 300 s. **Accepted residual:** it was issued to the owner's own session for the owner's own photo. Deleting a photo deletes the object, which ends any URL for it. Account erasure deletes objects early in its order (§3.3) |
  | `ai-inputs` | The owner; the worker | Owner: signed URL, 300 s. Worker: a server-side read, never a URL | Same accepted 300 s residual for the owner. Objects expire after 30 days or with erasure |
  | `exports` | The owner | `export-download-v1` rechecks the session and the 48-hour link, then issues a 300 s URL for that one download | New downloads stop at revocation. Erasure cancels and purges bundles first. Same accepted 300 s residual |
  | `gym-documents` | Staff whose live role permits it; a linked member for their own receipts | Streaming Edge proxy `gym-file-v1`. Every request rechecks role or link through the SQL predicate and streams the object. No signed URL is ever issued | **Immediate.** A revoked role or link fails the next request (PRD §12.1, §22.1) |
  | Passport links (P2) | The grantee | Each grant is its own revocable row, and access goes through the proxy | Revoking one grant ends its access on the next request and leaves other grants alone (PRD §22.1) |

- **Implemented.** Bucket `personal-images`, private, 10 MiB, JPEG/PNG/HEIC; owner-prefix policies for
  read, insert and delete (`20261017161031_member_core.sql:167-174`).
- **Missing.** The asset table, intents, quota reservation, finalize, sanitisation, thumbnails,
  expiry and purge (MB-6, AI-3, MB-7); the gym file proxy (G17.api). The current storage policies let
  a member sign their own object with any lifetime through the Storage API; they must be replaced by
  Edge-issued URLs (MB-6). Whether Supabase can issue a 10-minute signed **upload** URL must be
  checked; the intent expiry above does not depend on it.

### 3.5 Durable worker and jobs

- **Decision.**
  - `private.jobs` holds kind, scope (user or gym), a unique `operation_id` for client-created jobs, a
    unique `dedupe_key` for logical keys (for example a renewal reminder's
    gym/member/membership/purpose/offset), status, `run_after`, attempts, `lease_owner`,
    `lease_expires_at`, deadline, last error code and result.
  - `private.job_attempts` is append-only: attempt number, `dispatch_id`, start and end, outcome,
    provider request ID and cost.
  - Workers claim batches with `FOR UPDATE SKIP LOCKED` and set a lease. An expired lease returns the
    job to the queue. A job that reached **dispatch committed** first reconciles with the provider by
    `dispatch_id`, never blind-resends (PRD §10.3, §14.2).
  - The worker is one Edge Function (`worker-v1`), woken every minute by `pg_cron` through `pg_net`
    and on enqueue. Retry schedules are per kind: AI 5/30/120 s with at most three retries and a
    five-minute deadline; messaging 1/5/30 min with at most three.
  - The worker's credentials live only in server secrets (Supabase Vault and Edge secrets).
  - A separate worker host is used only if PL-2 or AI-1 measures that Edge Function limits cannot meet
    the five-minute AI terminal budget.
- **Implemented.** None.
- **Missing.** All of it (G16.api builds the job tables; AI-3, G20.api and MB-7 use them; PL-2 deploys
  them).

### 3.6 Scheduler

- **Decision.** `pg_cron` schedules are migrations. They:
  - wake workers and recover leases every minute;
  - mark missed occurrences after each timezone's midnight, hourly, one account per transaction
    (§4.8);
  - extend schedule horizons daily;
  - plan renewal reminders in the gym's 09:00–20:00 window;
  - expire upload intents (10 min), unattached uploads (24 h), unsaved AI photos (30 d) and export
    links (48 h);
  - prune operation **results** after 180 days (at least the PRD's 90), keeping operation keys
    (§4.6), and drop expired rate windows (§4.12);
  - sweep entitlement expiry as a backstop to webhooks;
  - emit the backup and deadline signals in §3.11.
- **Implemented.** None. The client calls `refresh_schedules_v1` on every sync, which walks about 366
  days per plan day (`20261017163754_scheduling_and_history.sql:19-27`; QA-1 F-8f).
- **Missing.** All of it (MB-2 for schedules, G20.api for reminders, MB-7 for retention, PL-2 to
  deploy).

### 3.7 Identity provider

- **Decision.**
  - Supabase Auth provides email and password, phone OTP (+91 first), Google and Apple.
  - The server derives the owner from `auth.uid()`. No v1 request body carries a user or owner ID; a
    gym ID is only a scope that the server authorises on every request.
  - `private.member_active()` requires an active profile, a verified email or phone, no ban or
    deletion, and the JWT's session still present in `auth.sessions`, so a revoked session fails on its
    next request.
  - A missing or revoked session returns `401 UNAUTHENTICATED` (§4.5), so that sync pauses and asks
    the member to sign in again (PRD §20.2).
  - Identities are never merged automatically. Notices become append-only consent events (PRD §22.2).
- **Implemented.** `member_active` as above (`20261017161031_member_core.sql:24-31`). Server-side adult
  check at onboarding; date of birth and notice versions are not client-writable
  (`20261017164336_validated_contracts.sql:70-85`; `20261017161225_member_operations.sql:114-116`).
  Live staff roles read on every request (`20261017164708_gym_operations.sql:13-15`). Local auth:
  12-character passwords, email confirmation, manual linking off (`supabase/config.toml:187-190,234`).
- **Missing.** Google, Apple and phone (MB-1, G13); session list and revoke; consent events; identity
  linking; resumable onboarding (MB-1). Revoked-session checks in five read policies (QA-1 F-2; MB-1
  and G16.api). `complete_onboarding` has no version suffix, and member operations still carry an
  `ownerId` that the server only compares with the session
  (`20261019122347_function_lint_cleanup.sql:32`).

### 3.8 Subscription adapter

- **Decision.**
  - Server state machine: `free`, `trial_active`, `pro_active`, `grace`, `expired`, `revoked`
    (PRD §18).
  - Tables: current entitlement per user, append-only entitlement events keyed by verified provider
    event ID, and purchase identities unique per store purchase so that one purchase can never attach
    to two users.
  - Verification is direct: App Store Server Notifications V2 (JWS signature) with the App Store
    Server API for restore, and Google Play real-time developer notifications (Pub/Sub push with a
    verified token) with the Play Developer API.
  - If the owner adopts RevenueCat (R-3), its webhook is treated only as a hint, and the server fetches
    the verified state before changing an entitlement.
  - The AI path reads only the server entitlement, never a client receipt or cached state.
- **Implemented.** None.
- **Missing.** All of it (G15.api; store accounts OW-4; price and SKUs R-5).

### 3.9 AI gateway

- **Decision.**
  - Request path, in this order: identity → **entitlement (`PRO_REQUIRED`)** → AI consent → at most
    two open jobs → reserve one allowance in the original UTC-day bucket plus a monetary reservation →
    insert a queued job → return 202 with the job ID.
  - No request path holds provider credentials. Only `worker-v1` calls a provider, and only after
    **dispatch committed**: under the job lock it rechecks entitlement, consent, quota and cost
    reservation, consumes the allowance and writes the attempt with its `dispatch_id`.
  - So a caller without an entitlement causes zero provider calls by construction; AC12 counts the
    calls to prove it.
  - The adapter validates structured output against the contract schema, records model, prompt
    version and cost, and never executes output. Inputs are only the sanitised food text or image.
  - A test provider serves local and CI runs; a deployed configuration refuses it (AI-1).
- **Implemented.** None.
- **Missing.** All of it (AI-3 pipeline, G15.api allowance, AI-1 provider, AI-2 measurements; model
  and vendor R-6).

### 3.10 Messaging adapter

- **Decision.**
  - A template registry holds purpose, language, approved copy and version, variables, provider
    template ID and authorisation basis.
  - A dispatch record is unique per logical key and reserves spend atomically against gym and platform
    caps. The default real-send cap is zero.
  - Status webhooks are verified, deduplicated and monotonic: Delivered is never downgraded.
  - Push uses generic lock-screen copy plus a safe destination ID (PRD §22.1).
  - Local and CI use a capturing test provider. Real sends wait for G23.
- **Implemented.** None.
- **Missing.** All of it (G18.api, G20.api, PL-6, MB-7; providers R-3, OW-5, OW-11, DEC-05).

### 3.11 Monitoring

- **Decision.**
  - Public `GET /functions/v1/health-v1` is deployed with JWT verification off, so an uptime monitor
    needs no key. It returns only status, API major, contract `{current, supported}` (§4.1) and
    migration head, and nothing per user.
  - Readiness, metrics, job retry and audited support access are private (service role or an operator
    grant).
  - Client and Edge errors go to an error tracker behind an adapter that scrubs personal data. The
    vendor and its data region are R-3.
  - Every log line carries `requestId` and, where present, `operationId`, and never an OTP, token, raw
    AI input, photo, health value or location (PRD §22.1).
  - Server-side feature flags in `private.feature_flags` can turn off AI, messaging or the gym layer
    without touching workouts. A disabled feature returns `503 FEATURE_DISABLED`.
  - The §23.2 signals are request and error rates, latency, queued and rejected writes, outbox age,
    job failures, AI duration and cost, webhook lag, message reconciliation and cost, receipt numbering
    gaps, deletion and export deadlines, and backup success. Their sources are the job, attempt,
    webhook, outcome and receipt tables plus platform logs. PL-9 sets thresholds and routes.
- **Implemented.** None. The backend scripts refuse any host but the local stack
  (`scripts/backend/verify.mjs:6-7`).
- **Missing.** All of it (PL-9, PL-2; error-tracker account R-2, R-3).

## 4. The `/v1` contract (PRD §21.3)

### 4.1 Versions

- **API major** is `v1`. It appears as the `_v1` suffix of every exposed RPC and as `-v1` in every Edge
  Function name. The `/rest/v1` and `/functions/v1` path segments belong to Supabase and are not our
  version.
- **Contract version** is the semver `CONTRACT_VERSION` exported by `@fitlog/domain` (§8). Clients
  send it in `x-fitlog-contract`.
- **Compatibility line.** Before 1.0.0 a line is `MAJOR.MINOR`, for example `0.1`. From 1.0.0 it is
  `MAJOR`. In `0.x` a minor bump starts a new line and may break payloads, for example the planned
  decimal switch (§4.9). A patch never changes the wire format within its line.
- **Check.** The server holds the list of lines it serves, normally one. It holds two only while a
  deliberate transition adapter exists. A request is accepted only if its header parses as semver and
  its line is in the list. Otherwise the server returns `400 CONTRACT_UNSUPPORTED` with
  `meta.supported`, and that includes a missing header. So an app built against 0.2 is refused by a
  server that serves only 0.3. The check ships in MB-1 together with the app change that sends the
  header (SP3).
- `health-v1` publishes `contract: {current, supported}`.
- A breaking change after 1.0.0 adds `_v2` functions beside `_v1`. `_v1` is removed only after metrics
  show that no supported app version still calls it, and after the minimum supported app version
  (PL-9) excludes it.

### 4.2 Transport binding

| Kind of operation | Binding | Notes |
|---|---|---|
| Data reads and commands | `POST /rest/v1/rpc/<name>_v1` (PostgREST) | RLS and definer checks stay in Postgres; one round trip; one transaction. v1 read RPCs are declared `VOLATILE` so that they can count reads (§4.12) |
| Provider-touching steps, signed URLs, file proxy, webhooks, health | `/functions/v1/<name>-v1` (Edge Functions) | Hold server secrets; verify raw webhook bodies; never hold a service key in the client |
| Direct table writes | Not part of v1 | Today's direct writes (§3.2) move to commands in MB-1, MB-5 and MB-6 |
| Direct table reads | Allowed during transition, own scope only | Not rate-counted by the database (§4.12). Replaced by list and sync RPCs (§4.8) |

The OpenAPI 3.1 document is generated from the contract package's operation registry. It lists each
logical operation (for example `POST /v1/sessions/{id}/sets`) with its binding (here `apply_operation_v1`,
kind `set.commit`). It is a PD-02 deliverable.

### 4.3 Request lifecycle of a v1 command

1. The app writes the record and its operation to the encrypted outbox in one local transaction.
2. Sync sends the RPC with the session JWT, the publishable key, `x-fitlog-contract` and
   `x-request-id`.
3. A PostgREST pre-request function checks only the contract header (§4.1). It reads headers and never
   writes, so it is safe inside the `READ ONLY` transactions that PostgREST uses for `GET`/`HEAD`, and
   reportedly for `STABLE`/`IMMUTABLE` functions (§12). Whether `db-pre-request` can be set on hosted
   Supabase is also checked in §12.
4. The definer runs these steps in this order. Step 1 runs in the definer's outer block. Steps 2–10
   run in an inner `BEGIN … EXCEPTION` block (§4.12):
   1. **Identity, active account and current session.** Otherwise `401 UNAUTHENTICATED`, raised. Nothing
      is counted, because there is no account to count against.
   2. **Scope.** A member command acts on the caller's own account. A gym command needs a live role in
      that gym, or a live link for the kinds a linked member may issue (a freeze request). A foreign or
      revoked scope returns `404 NOT_FOUND`.
   3. **Replay fast path, without a lock (revision 3).** Look up the operation key. If it has
      committed with the same `operationId`, actor, scope and hash, return the stored outcome with
      `meta.replayed: true`, taking no lock and writing and counting nothing. A different hash, actor
      or scope returns `409 OPERATION_REUSED` (§4.6). If no key exists, go on.
   4. **Lock, then look up again.** Take the per-account or per-gym advisory lock, only after steps 1
      and 2 pass (QA-1 F-7), and repeat step 3's lookup under it. At `READ COMMITTED`, the default
      isolation level, each statement takes a new snapshot, so this lookup sees an operation that the
      lock's previous holder committed, such as a concurrent first attempt of the same operation. A hit
      replays or returns `OPERATION_REUSED` exactly as in step 3.
   5. **Write-rate check** (§4.12). This reads the committed window counts and returns
      `429 RATE_LIMITED` when a limit is reached. It writes nothing.
   6. **Dependencies** (§4.6).
   7. **Per-kind permission.** Otherwise `403 FORBIDDEN`.
   8. **Base revision.** Otherwise `409 REVISION_CONFLICT`.
   9. **Validation**, JSON Schema plus SQL rules. Otherwise `400` or `422`.
   10. **Write** the rows (each stamped with its feed sequence, §4.8), the outcome and any audit rows;
       return the envelope.
5. **Count, then finish** (outer block, §4.12). Unless a replay lookup (step 4.3 or 4.4) returned a
   stored outcome, the outer block adds one to the caller's write windows, whatever the outcome. If
   the inner block raised, PostgreSQL has already rolled its writes back. The outer block then returns
   the error envelope with `response.status` set (§4.5), so the count is the only thing that commits.
6. The transaction commits before PostgREST returns (PRD §21.3).

Because scope is checked before both replay lookups, a revoked staff member or a revoked session
cannot replay a stored finance outcome (PRD §22.1: a cached role never extends a revoked permission).
`operation_result_v1` runs steps 1 and 2 too, and returns `NOT_FOUND` for an operation belonging to
another actor or scope. **From its first release (revision 3)** it returns only the §4.4 allowlist
projection of a stored result (identifiers, revisions, receipt numbers and status), whether or not the
definer that stored the result has been trimmed yet.

**Demotion (decision, revision 2).** A demoted actor still holds a live role in the gym, but one that
may no longer issue the kind (for example, a manager moved to front desk). Unlike a revoked actor, they
pass steps 1 and 2. So step 3 or 4 returns their own stored outcome before step 7 would refuse them,
and `operation_result_v1`, which runs only steps 1 and 2, returns its projection.
- This is accepted **only because** §4.4 limits a stored outcome to identifiers, revisions, receipt
  numbers and status. The replay shows the actor nothing beyond the identifiers of their own earlier
  result.
- "Trimmed" includes rows stored before the trim. A replay returns only the §4.4 fields of the stored
  result, and the row itself is not rewritten (§7: existing rows are preserved).
- Until a definer's outcomes are trimmed, no change may move one of its per-kind checks behind either
  replay lookup (steps 3 and 4):
  - `freeze_action` checks per-kind permission before replay today
    (`20261019140839_freeze_preview_binding.sql:22`, then `:24-27`), and its results carry freeze
    projections (`:70`). G17.api keeps that order until those outcomes are trimmed, so if the step-3
    fast path reaches `freeze_action` first, its per-kind check still runs before it.
  - This rule orders checks inside definers only. `operation_result_v1` cannot bypass it, because it
    never returns a stored result whole: a demoted manager who asks it for a freeze approve stored
    before the trim gets identifiers and status, never the projection at `:70` (revision 3).
  - `gym_command_core` already replays (`20261019121035_gym_read_models.sql:15`) before its per-kind
    checks (`:42,47,62,84,97`). `membership.issue`, `charge.waive`, `payment.refund` and
    `payment.reverse` store balances (`:60,95,117`). So today a demoted manager can replay their own
    earlier balance. This exposure already exists; the record did not create it. G17.api closes it
    with the §4.4 trim (checkpoint F-17).
- F1 is not reopened: a revoked actor still fails step 2.

**Today.** `gym_command_core` checks identity, then role, then locks, then looks up the replay
(`20261019121035_gym_read_models.sql:8-15`), which matches steps 1, 2 and 4. `freeze_action` locks
before it checks access (`20261019140839_freeze_preview_binding.sql:17-21`; QA-1 F-7; G17.api).
Member commands check identity, then lock, then look up the replay
(`20261017164212_workout_correction_commands.sql:7-13`). None has the step-3 fast path yet, so today
every replay takes the lock.

### 4.4 Success envelope

```json
{ "data": { }, "revision": 4, "requestId": "uuid", "meta": { "replayed": false } }
```

- Lists return `{ "data": [], "nextCursor": "opaque or null", "requestId": "uuid" }`.
- `requestId` is the client's `x-request-id` if it parses as a UUID, else a server UUID. It is stored
  on outcome, job and audit rows.
- A command's `data` holds identifiers, revisions, receipt numbers and status only. Derived state such
  as balances is read fresh through permission-checked reads, so a stored outcome never shows a caller
  more than their current role could read (§4.6).
- **Today** RPCs return bare objects such as `{"id": …, "revision": …}`. No request ID exists anywhere.
  Gym and freeze results also carry balances and freeze projections
  (`20261019121035_gym_read_models.sql:60,80,82,95,117`; `20261019140839_freeze_preview_binding.sql:70`;
  G17.api).

### 4.5 Errors

**Envelope.** `{ code, message, fieldErrors, retryable, retryAfterSeconds, conflict, paywall, requestId }`.
`message` is safe developer text; screens show `t(code)` and never `message`.

**Binding (revised in revision 2 so that rejected requests are counted, §4.12).**
- **After identity.** Errors in §4.3 steps 2–10 are raised inside the definer's inner block. The outer
  block catches them and returns the envelope as the function's result, with PostgREST's
  `response.status` set to the HTTP status and `response.headers` carrying `Retry-After` for 429. This
  is the same mechanism §4.10 uses for 202.
  - SQLSTATEs the definer did not raise itself are mapped too: class `22` becomes `INVALID_REQUEST`,
    `23505` becomes `DUPLICATE_ENTITY`, and anything else becomes `INTERNAL`.
  - A statement timeout or cancel (`57014`) is not caught by `WHEN OTHERS`. It rolls back uncounted.
- **Before the definer, or at identity.** The pre-request contract check and step 1 raise SQLSTATE
  `PT<status>`. PostgREST turns that into the HTTP status, as `PT404` and `PT409` already do, and the
  error DETAIL is the JSON envelope without `message`.
- **Parsing.** The contract package's parser accepts both forms: a returned envelope with a non-2xx
  status, and PostgREST's `{code, message, details, hint}` body. Edge Functions return the envelope as
  their body. If a test shows that PostgREST's `PGRST` raise form returns the envelope directly with a
  `Retry-After` header, the pre-definer binding may switch in a minor version.

| Code | HTTP | Retryable | Meaning | Today |
|---|---|---|---|---|
| `INVALID_REQUEST` | 400 | No | Shape error, unknown kind, `limit` outside 1–100 | `22023`, also used for field rules |
| `CONTRACT_UNSUPPORTED` | 400 | No; update the app | Contract header missing or outside the served lines (§4.1) | Missing |
| `UNAUTHENTICATED` | 401 | After sign-in | Missing, expired or revoked session | A revoked session raises `42501` in member and gym commands and `22023` in freeze commands (`20261019140839_freeze_preview_binding.sql:16`). Gym reads return `PT404`. Direct reads return no rows, except the five policies in QA-1 F-2 |
| `FORBIDDEN` | 403 | No | Known action the caller's role may not take | `42501` |
| `PRO_REQUIRED` | 403 | No | AI without entitlement; raised before any reservation, job or provider call | Missing |
| `CONSENT_REQUIRED` | 403 | No | AI permission or gym-link consent absent | Missing |
| `NOT_FOUND` | 404 | No | Missing **or** another owner's or tenant's ID; never 403 for a foreign ID | `PT404` in gym reads and freeze commands. Gym commands raise `P0002`, which the wrapper re-raises as `PT404` (`20261019120824_gym_api_errors.sql:6`). "Workout not found" raises `42501` (`20261019122347_function_lint_cleanup.sql:77`) |
| `REVISION_CONFLICT` | 409 | No; review | Base revision is stale; `conflict` carries the caller-readable current state | `40001`; freeze wrappers re-raise it as `PT409` (`20261019140429_gym_freezes.sql:158,170`) |
| `STATE_CONFLICT` | 409 | No | Another active workout, occurrence taken, date overlap | `40001` (freezes: `PT409`) |
| `DEPENDENCY_PENDING` | 409 | Yes, while the dependency is still queued (§4.6) | An outbox dependency has not been applied yet | `40001` |
| `OPERATION_REUSED` | 409 | No; call `operation_result_v1` first | Same operation ID with a different hash, actor or scope | `22023` |
| `DUPLICATE_ENTITY` | 409 | No; fetch | A new operation ID tries to create an entity ID that already exists | Unique-violation default |
| `REVIEW_REQUIRED` | 409 | No | Possible duplicate phone or payment reference | `40001` |
| `STORAGE_LIMIT_REACHED` | 409 | No | 1 GiB or 2,000 assets reached; `meta` shows usage | Missing |
| `PAYLOAD_TOO_LARGE` | 413 | No | Body or object over its limit | Bucket limit only |
| `VALIDATION_FAILED` | 422 | No | Field rule broken, with `fieldErrors` (for example under 18, date mismatch) | `22023` |
| `RATE_LIMITED` | 429 | After `retryAfterSeconds` | §18.1 traffic limits | Missing |
| `QUOTA_EXCEEDED` | 429 | After `retryAfterSeconds` | AI allowance, open jobs, open upload intents | Missing |
| `FEATURE_DISABLED` | 503 | Later | Flag off for AI, messaging or gym | Missing |
| `UNAVAILABLE` | 503 | Yes | Provider or database unavailable; platform spend cap paused | Missing |
| `INTERNAL` | 500 | With backoff | Unexpected; generic message | PostgREST default |

**Today's HTTP mapping.** Two codes are already mapped: gym commands' `P0002` becomes `PT404`, and
freezes' `40001` becomes `PT409`. No test yet pins what member and gym commands' `40001`, `42501` and
`22023` become over HTTP. PostgREST's documented default maps class `40` to 500, `42501` to 403 for an
authenticated role, and codes such as `22023` to 400. If that holds, today's member revision conflicts
reach the client as 500. MB-1 pins the real values with a test before it changes any code (§12). The
client classifies by SQLSTATE today, not by HTTP status.

### 4.6 Operation IDs, replay and request hashes

**Command body (v1).**

```json
{
  "operationId": "client-generated UUID, the idempotency key",
  "kind": "set.commit",
  "entityId": "uuid",
  "baseRevision": 1,
  "dependencies": ["uuid"],
  "payload": { }
}
```

Gym and freeze commands add `gymId`. No command carries `ownerId`.

**Request hash.** The server computes
`'h1:' || encode(sha256(convert_to(<canonical>::text, 'UTF8')), 'hex')` over the JSONB object
`{actor, scope (gymId or null), kind, entityId, baseRevision, payload}`.
- It leaves out the operation ID (the lookup key), the contract version and the dependencies. So a
  lost-response retry after an app update, or with its dependencies listed in another order, is still
  the same request.
- JSONB normalises key order and whitespace. Until decimals become strings (§4.9), equal numbers must
  be serialised the same way, which `JSON.stringify` does.
- The `h1` prefix versions the definition. A later definition compares old rows with the definition
  they were stored under.
- `sha256(bytea)` is built into PostgreSQL 11 and later.

**Replay.** The same `operationId`, actor, scope and hash return the stored outcome, marked
`meta.replayed: true`, without writing or counting anything. Once the operation has committed, the
replay takes no lock either (§4.3 step 3). A different hash, actor or scope returns
`409 OPERATION_REUSED`. On that error the client first calls `GET /v1/operations/{operationId}`
(`operation_result_v1`, authorised as in §4.3):
- if its own operation has an outcome, the original was applied (for example, the outbox re-encoded
  the payload after a breaking app update), and the client reconciles from server state;
- otherwise the operation goes to Needs attention.

A lost response therefore never re-runs work (PRD §10.3, §21.3).

**Retention.**
- Outcome **results** are kept at least 90 days and pruned at 180.
- The **operation key** (operation ID, actor, scope, kind, entity ID, hash, applied time) is kept for
  the life of the account and deleted with it.
- A replay after its result was pruned returns `meta: {replayed: true, resultPruned: true}` and only
  the entity ID; the client re-reads state.
- `DUPLICATE_ENTITY` is left for a new operation ID that tries to create an existing entity ID.

**Dependencies.** Dependencies are a set: order and repeats do not matter.
- A dependency is satisfied when its operation key exists for the same actor and scope, even after its
  result was pruned.
- An unknown dependency returns `409 DEPENDENCY_PENDING`, which is retryable. The client retries it
  only while the dependency is still queued or syncing on the device.
- If the dependency was rejected or discarded, or is no longer in the outbox, the dependent operation
  moves to Needs attention. PRD §20.2 forbids infinite retry.

**Today.**
- Member commands hash `md5` over `{entity, kind, base, payload}` (`20261017161225_member_operations.sql:20`)
  and check dependencies as an ordered list against outcome rows
  (`20261019122347_function_lint_cleanup.sql:40-42`).
- Gym and freeze commands hash `md5(p_command::text)` over the whole command, including its ID
  (`20261019121035_gym_read_models.sql:5`; `20261019140839_freeze_preview_binding.sql:14`).
- Replay returns the stored result and rejects changed input as `22023`. Outcomes are kept forever.
  Member outcome rows already store only `{id, revision}` (`20261019122347_function_lint_cleanup.sql:109,111`).
- The practical risk of `md5` is low because outcomes are scoped to the caller. The change is for one
  consistent, versioned definition across member and gym commands (MB-3, G16.api).

### 4.7 Revisions, conflicts and history

- Every mutable entity has an integer `revision`, starting at 1 and incremented by the server on each
  committed change. Clients never write it.
- Commands carry the aggregate's `baseRevision`; child edits also carry the child's revision (today
  `setRevision`). Gym finance commands keep the member-account `expectedRevision` lock.
- A mismatch returns `409 REVISION_CONFLICT` with
  `conflict: {entity, id, currentRevision, current}`, where `current` is only state the caller may
  read. There is no silent last-write-wins for performance or finance (PRD §20.3).
- Edge endpoints also accept `If-Match: "<revision>"`; if it and the body disagree, the request fails
  with 400.
- **History rows (decision).** History grows with the number of changes, not quadratically:
  - `set.commit` writes no history row; the set row itself is revision 1.
  - Each later change to a set (`set.edit`, `set.delete`, `set.restore`) writes one set-revision row:
    the set's previous values, the revision and the operation ID (PRD §21.2 Set/SetRevision).
  - A session history row holds session fields only, never the sets. It is written only on corrections
    after completion: `session.update` of a completed session, `session.delete` and
    `session.restore`.
  - Existing `workout_revisions` rows are kept as they are. The change only stops new full snapshots.
- **Implemented.** Workout, set, programme, occurrence, gym member, membership and freeze revisions
  are checked (`20261019122347_function_lint_cleanup.sql:59-79`; `20261019121035_gym_read_models.sql:26,33`).
- **Missing.**
  - Every member operation on an existing session, each `set.commit` included, copies the whole
    session with every set into `workout_revisions`
    (`20261017164212_workout_correction_commands.sql:19-22`, first added at
    `20261017163754_scheduling_and_history.sql:93-96`; QA-1 F-8e). MB-4 owns correction history;
    MB-3 owns the set commands.
  - `meal_items`, `body_entries` and `goals` take a client-supplied `revision` on direct insert.
    `nutrition_targets` has no revision column and no created or updated time at all
    (`20261017161031_member_core.sql:123-127`; `apps/mobile/src/data/api.ts:76`). Update grants on all
    four allow any change without a revision check (`20261017161031_member_core.sql:157-160`;
    `apps/mobile/src/data/api.ts:55-78`). MB-5 adds a revision and created and updated times to
    targets. Profile updates have no revision (MB-1, MB-5, MB-6).

### 4.8 Lists, cursors and the sync feed

- `limit` defaults to 50; the maximum is 100. Anything else returns `400 INVALID_REQUEST`.
- Every list declares its sort, which always ends with `id`, so order is stable.
- The cursor is opaque base64url JSON, `{"v":1,"s":"<sort>","f":"<filter hash>","k":[<last keys>]}`.
  The server rejects a cursor whose sort or filter hash differs from the request. The query is a keyset
  predicate, never an offset.
- **Member sync is a feed (decision).**
  - Each member-visible personal row has a `change_seq`, stamped on insert, update and soft delete by a
    `BEFORE` trigger.
  - The trigger takes the next value from a per-account counter row,
    `update private.sync_counters set last = last + 1 where owner_id = … returning last`, in the
    writing transaction. The row lock is held until commit, so a later commit for the same account
    always gets a higher `change_seq` than any earlier commit, and a client cursor never passes a value
    that a still-open transaction can use.
  - A sequence or `max()+1` is not used. A transaction that takes a value and commits late would fall
    behind a cursor, and that client would never receive the row.
  - Every writer stamps through the trigger: definers, transitional direct writes and the scheduler,
    which processes one account per transaction. Member RPCs already serialise per account on an
    advisory lock (`20261019122347_function_lint_cleanup.sql:34`); the counter row gives the same
    order to direct writes and scheduler updates.
  - Gym rows that a linked member reads (own memberships, dues, receipts, visits, freeze requests and
    offers) form a separate feed per link. That feed is stamped from a counter column on the
    `gym_members` row. Gym commands already lock that row `FOR UPDATE`
    (`20261019121035_gym_read_models.sql:24`; `20261019140839_freeze_preview_binding.sql:19`), and
    every future gym writer of member-visible rows must stamp through it too.
  - `sync_pull_v1(cursor, limit)` returns changes in `change_seq` order per feed, tombstones included.
    Delete tombstones reach the client before summaries are rebuilt (PRD §20.2).
- **Today.** The member app pages by offset in 500s (`apps/mobile/src/data/api.ts:10`). The gym member
  list pages by offset in 50s with an exact count (`apps/mobile/src/data/gym-api.ts:38`); the visit list
  pages by offset in 50s (`apps/mobile/src/features/gym/GymHomeScreens.tsx:37`). PostgREST `max_rows`
  is 1,000 (`supabase/config.toml:18`). Owners: MB-3, MB-4, G16.api, G17.api.

### 4.9 Encodings (planned v1 wire format)

**Canonical decimal string.** The wire form of every decimal is a JSON string matching:

```text
^(0|-?[1-9][0-9]*(\.[0-9]*[1-9])?|-?0\.[0-9]*[1-9])$
```

- It has no exponent, no `+`, no leading zeros, no trailing fractional zeros, no bare point and no
  `-0`.
- It uses no lookaround, so `pg_jsonschema`'s regular-expression engine can run it.
- Each field's schema narrows it further: non-negative fields drop the sign, and each field states its
  maximum integer digits and scale. A SQL `numeric` range check backs each field.

| Value | Wire form | Store |
|---|---|---|
| Decimal | Canonical decimal string, above | `numeric` |
| Entered quantity | `{ "value": "<decimal>", "unit": "lb" }`; the canonical value comes back too, for example `loadKg: "45.359237"` (PRD §4.2 keeps the original entry) | Original value and unit, plus the canonical `numeric` |
| Derived value | Decimal string rounded half away from zero to scale 6 by the server (e1RM, means, percentages). Comparisons and PRs use the unrounded server value. A sum over no eligible value is `null`, never `0` (PRD §8.2: no invented kg volume) | `numeric`, unrounded |
| Money, non-negative | `{ "amountMinor": 40000, "currency": "INR" }`, a JSON integer from 0 to 100,000,000,000 | Prices and fees (`gym_plans.fee_paise`), charges, payments (above 0), refund, reversal and waiver amounts (above 0) |
| Money, signed delta | Same shape, a JSON integer from −100,000,000,000 to 100,000,000,000, never 0 | `gym_charge_adjustments.delta_paise` and `gym_allocations.delta_paise` (`check <> 0`, `20261017164708_gym_operations.sql:56,72`; written negative at `20261019121035_gym_read_models.sql:89,93,107`) |
| Money, aggregate | Same shape, a signed JSON integer whose magnitude is at most 9,007,199,254,740,991 (`Number.MAX_SAFE_INTEGER`). The server raises `INTERNAL` rather than emit a larger value | Balance fields `charges`, `principal`, `allocated`, `due`, `credit`, `net` (`20261017164708_gym_operations.sql:126`); dashboard `dueToday`, `overdue`, `totalDue`, `collections` (`20261019121035_gym_read_models.sql:162,165`); report totals |
| Counts, reps, revisions | JSON integers | `integer` or `bigint` |
| Instant | RFC 3339. The server emits UTC `Z` with milliseconds and accepts offsets | `timestamptz` |
| Local date and zone | `YYYY-MM-DD` and an IANA name, checked against `pg_timezone_names` and `Intl` | `date`, `text` |
| Key casing | camelCase for every v1 JSON body: `requestId`, `fieldErrors`, `retryAfterSeconds`, `operationId`, `baseRevision` encode the PRD's `request_id`, `field_errors`, `retry_after`, `operation_id`, `base_revision` | — |

Money is never a float and is never summed across currencies. It is stored as `bigint` minor units with
the currency. Today's `*_paise` columns may stay while currency is INR-only
(`20261017164708_gym_operations.sql:4`). All three money kinds are exact in IEEE doubles.

**Today.**
- Decimals travel as JSON numbers (`packages/domain/src/models.ts:26,41,66-69`), and `numeric`
  columns have no declared scale.
- Money is integer paise named `amountPaise` and `feePaise`. The delta columns have no magnitude bound;
  G17.api adds `abs(delta) <= 100000000000`.
- Moving to decimal strings and `{amountMinor, currency}` breaks the set, prescription, meal, body,
  goal and gym payloads. It is planned, not in contract 0.1.0. MB-3, MB-5, MB-6 and G17.api adopt it
  under SP3 (§8), each as a new compatibility line.
- No legacy data needs converting, because the launch is fresh (§7).

### 4.10 Asynchronous operations

Any operation that waits on a provider, or may exceed the request budget, returns HTTP 202 with
`{data: {jobId, status: "queued"}, requestId}`. Status, cancel and retry are separate operations.
Terminal states are explicit; nothing reports completion before it happens. An RPC sets 202 through
PostgREST's `response.status` setting (check in AI-3). Today there is no asynchronous operation.

### 4.11 Signed webhooks and public endpoints

- Each provider has its own Edge Function (`billing-webhook-v1`, `messaging-webhook-v1`).
- Supabase JWT verification is off for exactly three functions: the two webhooks and `health-v1`
  (§3.11). Every other function requires a valid session JWT. `gym-file-v1` and `export-download-v1`
  also recheck access in SQL on every request.
- Each webhook reads the raw body before parsing and verifies the provider's signature, JWS or token
  over those bytes, with a timestamp tolerance.
- Accepted events go into `private.webhook_events`, unique on `(provider, event_id)`. A duplicate
  returns 200 and does nothing. Processing is a job.
- Out-of-order events are resolved by the provider's event time or by fetching the verified state.
- Today there are none (G15.api, G18.api, G20.api; PL-9 for health).

### 4.12 Traffic limits

- **Writes:** 120 per minute and 5,000 per day per user. Every v1 command that passes identity counts
  once, whatever its outcome: accepted, or rejected with 403, 404, 409, 422 or 429. A replay never
  counts (PRD §18.1).
- **Reads:** 600 per minute per user. Every call to a v1 read RPC (list, detail, sync) that passes
  identity counts once, whatever its outcome. Those RPCs are declared `VOLATILE` and called by `POST`,
  so they run in a read-write transaction and can count.
- **Mechanism (decision, revision 2).** Each v1 definer has two blocks (§4.3):
  1. The outer block checks identity.
  2. An inner `BEGIN … EXCEPTION` block runs everything else. Its rate check (§4.3 step 5; for a read,
     right after scope) reads the committed window counts and raises `RATE_LIMITED` at the limit. It
     writes nothing.
  3. When the inner block ends, whether it succeeded or its error was caught, the outer block upserts
     `+1` into each window for the class, unless the inner block replayed. After a caught error the
     inner block's writes are already rolled back, so the count and the returned error envelope
     (§4.5) are the only effects that commit.
- **Lock lifetimes (revision 3).** PL/pgSQL runs the inner block as a subtransaction, and the advisory
  lock and any row locks (`FOR UPDATE`, the §4.8 counter row) are taken inside it.
  - **Fast-path replay (§4.3 step 3):** no advisory or row lock is taken.
  - **The inner block ends normally,** after a write or a step-4 replay: its locks pass to the
    enclosing transaction and are held until commit, so the §4.8 feed order holds.
  - **Caught error:** rolling the subtransaction back releases every lock it took, advisory and row
    locks alike, together with its writes. The outer block then counts with no advisory lock held.
    That is safe: the count is one atomic upsert per window row, and it is the only write. A rejected
    request is serialised by the advisory lock only for the inner steps it reached after step 4, not
    for its count. A scope `404` or a step-3 `OPERATION_REUSED` never takes the lock.
  - **Counting order:** the outer block upserts the minute window, then the day window, always in
    that order, and each window row stays locked until commit. A transaction that holds the advisory
    lock took it before any window row, and every transaction takes the minute row before the day
    row, so two counting transactions cannot deadlock.
  - **Statement timeout or cancel (`57014`):** the whole transaction rolls back, which releases every
    lock and drops the count.
- **Not chosen:** an outer limiter in Edge or the platform. Data RPCs go straight to PostgREST (§4.2),
  so it would need a gateway in front of PostgREST, which the platform decision does not include.
- **Never counted:**
  - replays (stated residual below);
  - the pre-request function, which counts nothing and never writes, so nothing writes inside a
    `READ ONLY` transaction;
  - requests that fail identity, which have no account to count against.
- **Not counted by the database (stated residual).** These requests never reach a v1 definer and never
  take the per-account lock:
  - a missing or unsupported contract header, refused by the pre-request function;
  - bodies that PostgREST itself rejects;
  - transitional direct table reads. RLS and `max_rows` (1,000) bound them, and they end when MB-3,
    MB-4, G16.api and G17.api replace them with read RPCs.

  PL-9 watches these rates (§3.11), and adds an outer limiter only if a measurement shows abuse.
- **Replays are uncounted (stated residual, revision 3).** PRD §18.1 says a replay neither creates nor
  counts a record, so no window limits replays. A replay of a committed operation costs the identity
  check, the scope check and one key lookup, and takes no lock (§4.3 step 3). Only a duplicate of an
  operation whose first attempt has not committed yet reaches the lock; it waits for that attempt,
  which is itself counted, and then replays at step 4. If that attempt was rejected, no key exists, so
  the duplicate runs as a new attempt and is counted. PL-9 watches replay rates with the rates above.
- Counters live in `private.rate_windows(user_id, class, window_start, count)`, an `UNLOGGED` table
  pruned by the scheduler. A crash resets the counters, and concurrent requests may overshoot a
  window by the few that are in flight. Both are acceptable for anti-abuse limits.
- Edge Functions count through the same SQL function. The counting call commits whatever the request's
  outcome, and a replay is not counted.
- Over the limit returns `429 RATE_LIMITED` with `retryAfterSeconds` (and `Retry-After`) set to the end
  of the window. A 429 counts too, so a client that ignores `retryAfterSeconds` keeps its window full.
- §12 holds the executable check for all of this.
- One active export, one import and one erasure per account are job limits, separate from traffic.
- Gym budgets and provider caps are separate again. Today there are none (MB-1, PL-9).

### 4.13 Shared fixture vectors

- One JSON file per formula family under `packages/domain/fixtures/`. The TypeScript tests
  (`node --test`) and a SQL runner both read the same file; the SQL runner works against the local
  database inside a rolled-back transaction.
- Expected values use the §4.9 encodings. A value that has no eligible input is `null` in both
  languages.
- The server's SQL `round(numeric)` is authoritative and rounds decimal ties half away from zero.
  TypeScript's `toFixed` rounds the binary double instead, so a decimal tie can round down: for
  example `(1.005).toFixed(2)` is `"1.00"`, while SQL gives `1.01`. Client formatting is provisional,
  and fixtures avoid exact ties at the seventh decimal.
- AR-1 lands the runner and the AC03 volume and e1RM vectors
  ([test plan §4](../plan/runs/AR-1/test-plan.md)). MB-1 adds AC16 units and dates; MB-4 adds PR,
  frequency and adherence; G17.api adds the §13.3 finance vectors.
- **Today** the AC03 numbers are inline in `packages/domain/src/calculations.test.ts:15-22`, and no SQL
  function computes volume or e1RM. `sessionSummary` reports volume `0` for a session with no
  eligible set (`packages/domain/src/calculations.ts:33-36`), where §4.9 says `null` (MB-4).

### 4.14 PRO_REQUIRED, precisely

- `PRO_REQUIRED` is the first business check after identity on every AI entry point: create, retry
  and reanalyse.
- It returns HTTP 403, `retryable: false`, and `paywall: {reason: "free" | "expired" | "revoked",
  productIds: [...]}`. There are no prices; the store supplies those on the device.
- It is raised before any validation of the AI payload, so it does not reveal anything about the
  input. It never creates a job, reservation or provider call.
- Confirming a proposal that is already ready never needs an entitlement (PRD §10.3).

### 4.15 Rule status (PRD §21.3)

| Rule | Implemented | Missing | Owner |
|---|---|---|---|
| `/v1` version | `_v1` suffix on eight RPCs | `complete_onboarding` unsuffixed; contract header and its compatibility check; health | MB-1, PL-9 |
| Identity derives owner | `auth.uid()` in every definer | `ownerId` and `owner_id` still sent by clients | MB-1, MB-3, MB-5, MB-6 |
| Success envelope | — | All | MB-1 first, then every API goal |
| Error envelope and codes | Partial SQLSTATEs; `PT404` and `PT409` in gym and freeze paths | Catalogue, field errors, retryability, request ID | MB-1 first, then every API goal |
| Cursor, limit 50/100, stable sort | Ordered offset pages | Keyset cursors and the sync feed with its counter | MB-3, MB-4, G16.api, G17.api |
| Date and timezone semantics | Local date checked against the instant and zone in triggers | DST and unit fixtures (AC16) | MB-1 |
| Mutation key on retriable writes | `apply_operation_v1`, `gym_command_v1`, `freeze_command_v1` | Direct writes; `schedule_programme_v1`; `h1` hash; operation keys beyond result pruning | MB-1, MB-2, MB-3, MB-5, MB-6, G16.api |
| Base revision on mutable changes | Workouts, sets, programmes, gym records | Meals, body, goals, targets (no revision column), profile | MB-1, MB-5, MB-6 |
| Commit before success | One transaction per RPC | — | — |
| Status codes | `PT404`, `PT409`, `42501`, `22023`, `40001` | Exact mapping of §4.5 | MB-1, G16.api |
| `PRO_REQUIRED` before provider call | — | All | G15.api, AI-3 |
| 202 with job ID | — | All | AI-3, MB-7, G17.api |
| Signed webhooks with raw-body checks and dedupe | — | All | G15.api, G18.api |
| Decimal encoding; money in minor units | Money in integer paise | Decimal strings; signed and non-negative `{amountMinor, currency}` | MB-3, MB-5, MB-6, G17.api |
| Shared fixture vectors | TypeScript only, inline | One file, TypeScript and SQL | AR-1, then MB-1, MB-4, G17.api |
| Exercise semantics come from the authorised instance; the client cannot override them (PRD §21.3, set example) | Set commands read type from the stored instance; the trigger rejects snapshots that differ from the authorised exercise version (§4.16) | Server-built instance snapshots | MB-3 |
| Owner/manager programme templates and offers; no staff health API (PRD §21.3 table) | No staff policy or definer reads member tables (§6) | Offer commands; isolation tests | G21.api, G16.api |

### 4.16 Exercise semantics come from the authorised instance

- **Decision.**
  - Set commands carry `instanceId` (the authorised session exercise instance) and set values. They
    never carry exercise type, load basis or multiplier; the server reads those from the instance's
    stored snapshot.
  - Instance create and edit commands carry `exerciseId` and `exerciseVersion`. The server copies the
    snapshot from an exercise the caller may use: a global one or their own.
  - Volume, e1RM and validation use the stored snapshot only.
- **Implemented.**
  - `set.commit` and `set.edit` take the exercise type from the stored instance
    (`20261019122347_function_lint_cleanup.sql:83-87`;
    `20261017164212_workout_correction_commands.sql:29-33`).
  - The validation trigger rejects any instance or prescription snapshot whose type, load basis or
    multiplier differs from the authorised exercise version
    (`20261017164445_contract_trigger_dispatch.sql:26-32`).
- **Missing.** Instances still arrive as a client-built list through `session.update`, which the
  trigger checks but the server does not build (`20261019122347_function_lint_cleanup.sql:93-96`).
  MB-3 replaces this with instance commands.

## 5. Domains mapped to `/v1` (PRD §21.3 table)

| Domain | Minimum operations (PRD §21.3) | Binding today | Status | Owner |
|---|---|---|---|---|
| Identity and profile | Verify and link identities; get and update profile and preferences; list and revoke sessions; notices | `complete_onboarding`; direct `profiles` read and column update | Partial: email verification only; no linking, session list or notice events | MB-1, G13 |
| Catalogue and plans | Exercise search, detail, custom create, edit, archive; programme, day and prescription create, read, update, delete and order; schedule | Direct `exercises` read, insert and archive; `apply_operation_v1` (`programme.save`, `programme.archive`); `schedule_programme_v1`; `refresh_schedules_v1` | Partial | MB-2, CT-1 |
| Sessions and sets | Start, get active, recover; instance create, edit, delete; set create, edit, delete; finish, discard; mutation-result lookup | `apply_operation_v1`: `session.create`, `session.update` (whole instance list), `set.commit`, `set.edit`, `set.delete`, `set.restore`, `session.finish`, `session.delete`, `session.restore` | Core implemented; no get-active, recover, instance commands or result lookup | MB-3 |
| History and analytics | Filter, calendar, detail, compare, previous; volume, frequency, e1RM, PR and adherence over ranges | Client computes from the full download | Missing on the server | MB-4 |
| Food | Search, servings; custom food create, read, update, delete and archive; recipes, categories, favourites; meals, items, copy, quick add | Direct `foods` insert and update; direct `meal_items` insert | Partial | MB-5 |
| AI | Private upload intent and finalize; text or photo job create, status, cancel, retry; candidate correction and confirmation | — | Missing | AI-3, G15.api |
| Nutrition, body, goals | Targets and target-version preview; totals and analytics; body fields, entries, photos; goals, goal status, goal revisions | Direct inserts | Partial | MB-5, MB-6 |
| Gym setup and staff | Create and update gym; permitted gym list; roles; owner transfer | `gym_command_v1` (`gym.create`); direct `gyms` and `gym_roles` read | Partial; no update, role or transfer command | G16.api |
| Register and import | Member list, detail, create, edit, archive; import template, map, validate, commit, results | `gym_command_v1` (`member.save`, `member.archive`); direct offset list; `gym_account_v1` | Partial; no import | G17.api |
| Membership and finance | Plan versions; renew; freeze decision; charges, allocations, payment, reversal, refund, receipt, report | `gym_command_v1` (`plan.save`, `membership.issue` with renewal, `membership.cancel`, `payment.record`, `credit.apply`, `charge.waive`, `payment.refund`, `payment.reverse`); `freeze_command_v1`; `freeze_preview_v1`; `gym_dashboard_v1` | Substantial; front-desk requests, DB-level append-only and reports missing | G17.api |
| Invitation and member gym | Invite, send, revoke, claim; own gym card, dues, receipts, operational permissions, programme offers, requests | Linked members read their own rows through RLS; a linked member can request a freeze through `freeze_command_v1` | Missing commands; notes and tags leak (§6) | G18.api |
| Attendance and retention | Self and staff visits; device preview and commit; coverage; calls, outcomes, exit reason | `gym_command_v1` (`visit.record`, staff only) | Partial | G19.api, G20.api |
| Programme offers and challenges | Owner/manager templates; offer, accept, decline; enrolment, standing, referral; **no staff health API** | — | Missing; the no-health rule already holds (§6) | G21.api, G22.api |
| Pro and messages | Entitlement and quota; verified subscription webhook; message statuses, provider webhook, cost | — | Missing | G15.api, G18.api, G20.api |
| Account and gym lifecycle | Export job, status, download; deletion request and status; gym offboarding | — | Missing | MB-7, G17.api |
| Operations | Public minimal health, version and status; private readiness, metrics, job retry, audited support | — | Missing | PL-9, MB-7 |

## 6. Security and privacy (PRD §22.1, §16, §22.3)

| Requirement | Implemented | Missing | Owner |
|---|---|---|---|
| TLS, encrypted database, storage and backups | Provider-managed once hosted; local is plain HTTP | Confirm on staging and production | PL-2, PL-5 |
| Secrets only on the server | Publishable key only in the client; the secret key appears only in local Node test scripts | Vault and Edge secrets once hosted | PL-2 |
| Signed URLs: 5 min download, 10 min upload, bound to object, size and type, rechecked | — | §3.4 | MB-6, AI-3 |
| Authorised proxy or revocable access where revocation must be immediate; passport links independently revocable | — | §3.4 per-bucket table: gym documents and passport links go through `gym-file-v1`; the residual 300 s on personal assets is accepted and stated | G17.api, MB-6, MB-7, P2 |
| No permanent public progress, food or receipt URL; staff never get personal-asset URLs | No public bucket | Client self-signing must end (§3.4) | MB-6 |
| Owner and tenant policy on every endpoint, worker and download | RLS on every exposed table; definers check identity, session and live role | Workers, proxy and downloads do not exist yet; scope before replay (§4.3) | G16.api, MB-6 |
| **No staff health API.** No staff endpoint returns member sessions, food, body entries, goals, photos or raw AI results, and no legacy sharing flag enables one (PRD §16.1, §21.3) | Member tables have owner-only policies that ignore gym roles (`20261017161031_member_core.sql:150-155`); no gym policy or definer reads a member table (`20261017164708_gym_operations.sql:1`) | AC09 tests: every staff read or write of personal data is denied, and a retired trainer role is rejected | G16.api |
| **Programme templates and offers are owner/manager only.** Offers carry template versions, never health history; the owner sees offer status only (PRD §12.1, §16.2) | — | All | G21.api |
| **Staff-only notes.** `gym_members.notes` and `tags` are staff-only. A linked member reads their own card only through `my_gym_card_v1`, which omits both. The linked-member branch of `register_read` is removed in the same change, and `gym_account_v1` stops returning the whole row to a linked member. Personal export excludes them (PRD §12.2, §22.3) | — | Today a linked member reads notes and tags through `register_read` (`20261017164708_gym_operations.sql:108`) and through `gym_account_v1`'s `to_jsonb(m)` (`20261019121035_gym_read_models.sql:136-137`) (QA-1 F-2, F-8b) | G18.api, G17.api, MB-7 |
| Route inventory isolation tests (filters, guessed IDs, exports, assets, jobs) | Member and gym cross-user and cross-tenant suites (QA-1 backend lines) | The inventory itself | G16.api, QA-9 |
| A cached staff role never extends a revoked permission | Live role read on each request; scope checked before replay in gym and freeze commands (§4.3) | Offline roster rules (§20.1.1) | G19.api |
| Audit of finance, consent, roles, export, support and sensitive reads | `gym_audit` row per gym command | Consent, export, support, role changes and sensitive reads; restricted audit access; one-year retention; actor keys (§3.3) | G16.api, MB-7 |
| Logs redacted; never OTP, token, raw AI input, photo, health value or location | Raw location rejected on visits (`20261019121035_gym_read_models.sql:120`) | Log policy and a test | PL-9 |
| Local secrets in secure storage; encrypted, account-isolated local DB | SQLCipher with a SecureStore key per account | Web key separation | MB-3 |
| No analytics SDK sees private input; no impersonation; time-bound audited support grants | No analytics SDK; no support access path | Support grants | PL-10, MB-7 |
| Security review topics | QA-1 review | Pre-launch review | QA-12 |

## 7. Reference content and migrations (PRD §21.4)

- **Migrations** are timestamped and append-only, and a migration already on `main` is never edited
  (docs/23 §5).
  - Every pull request that touches `supabase/` must replay all migrations from empty to head and
    show an empty schema diff against the replay. AR-1 lands the commands (box 3); PL-1 runs them in
    CI.
  - No migration deletes or rewrites existing rows to reach a new design. History tables, ledger rows
    and local development data are preserved; new rules apply to new writes.
- **No executable SQL outside `supabase/migrations/`** except the configured seeds `seed.sql` and
  `development-catalogue.sql` (`supabase/config.toml:72`). Today there are four other files (QA-1 F-8h):
  - `supabase/contracts.sql` is written by `scripts/backend/contracts.ts:8`, but only the migration
    copy (`20261017164336_validated_contracts.sql`) runs. Regenerating it changes nothing in any
    database.
  - `contract-validation.sql`, `gym-read-models.sql` and `gym-freezes.sql` are drafts; nothing
    executes them.
  - **Decision (former G-9).** Phase 2 compares every statement in the four files with the
    migrations and records the comparison table. It then deletes all four, together with the
    generator `scripts/backend/contracts.ts` unless phase 2A has already retired it. Git history
    keeps them. The handoff notifies lane S2, which wrote two of them. Persisted-schema changes then
    ship as new migrations generated from the versioned snapshot (§8). A guard fails
    `pnpm backend:test` if a stray `.sql` file appears.
- **Seeds** are idempotent, preserve user rows and fail loudly on a conflict with a row they do not
  own. Catalogue rows and member-owned rows use separate key spaces, so a member cannot claim a
  catalogue ID (QA-1 F-6: CT-1, MB-2, MB-5).
- **Reference content** arrives through reviewed, versioned seeds with source, licence and version
  fields:

  | Content | Rule | Owner |
  |---|---|---|
  | At least 200 exercises with equipment and instructions | Source and licence on every record | CT-1, OW-13, DEC-16 |
  | Muscle hierarchy and exercise–muscle mapping (PRD §21.2 Muscle/ExerciseMuscle) | One canonical hierarchy. Each exercise version maps to it with a role and a weight. Today `primary_muscles` and `secondary_muscles` are free-text arrays (`20261017161031_member_core.sql:44`) | CT-1 (content), MB-2 (schema) |
  | Three starter programmes | Reviewed, with reviewer and date | CT-1, OW-13 |
  | At least 500 Indian foods, with English, Hindi and Hinglish aliases and servings with conversions | Aliases do not inflate the count | G14.data (content), MB-5 (schema) |
  | English and Hindi string catalogues | Every member flow | G14.hi |
  | Safe demo fixtures | Synthetic only, never copied from a real account; used for local and staging seeds and the store reviewer account. Today `development-catalogue.sql` is a development fixture, not launch content | PL-2 (staging), QA-5 (reviewer account), CT-1 |

- **Imports.** Every accepted import format has:
  - a preview before saving;
  - timezone and unit mapping;
  - duplicate detection;
  - row-level errors with the original row number, and no silent coercion;
  - idempotent retry.

  The gym CSV/XLSX import is required (PRD §12.3; G17.api). Strong, Hevy and FitNotes workout imports
  and the food CSV import are P2 (AP-5). One active import per account (§4.12).
- **Legacy data.** The owner has confirmed a fresh launch: no existing users or data are redirected into
  the rebuild. This was relayed by the orchestrator in this revision, 26 October 2026, and is DEC-15's
  answer A. OW-2 writes the dated tracker entry and the DEC-15 ledger row; this record changes
  neither. Historical data is preserved: nothing here deletes the pre-reset local volumes or snapshots
  that OW-2 §3 names, existing rows, or the earlier records 001 and 002. The gym CSV import is the only
  migration path at launch.

## 8. Contract package and the SP3 rule

**Package.**
- `@fitlog/domain` exports `CONTRACT_VERSION`.
- **0.1.0 publishes only the schemas that exist at `9f148c1`.** They are the Zod schemas the package
  root exports (23 today) and the eight persisted schemas in `private.contracts`. Phase 2A built
  this (`packages/domain/src/contract.ts`; [phase2A.md](../plan/runs/AR-1/phase2A.md)). Its snapshot
  is committed in `07757a5` and its corrections in `22c5386`, on this branch only: not merged.
- The §4 primitives are **not** in 0.1.0. Each arrives as its own version with the goal that first
  puts it on the wire:
  - the envelope, error codes, command body and cursor with MB-1;
  - decimal strings and money with MB-3, MB-5, MB-6 and G17.api.
- Each version's JSON Schema snapshot is committed at `packages/domain/contracts/<version>.json` and
  never edited. `contracts/manifest.json` records each file's SHA-256.
- `pnpm check` fails when:
  - any exported contract schema changes without a new version;
  - a past snapshot changes;
  - committed history differs from a Git baseline.

  Phase 2A reads its baseline from `FITLOG_CONTRACT_BASELINE`.
- **CI fails closed on the contract baseline (decision, revision 2).** When `CI` is set, the baseline
  guard requires `FITLOG_CONTRACT_BASELINE`, set to the trusted base commit from the CI event: the pull
  request's base, or the previous head on a push. It never comes from content of the change. If the
  variable is unset or empty, the ref does not resolve, or git is unavailable, `pnpm check` fails;
  nothing falls back to `HEAD` or a local `main`. The migration guard's `FITLOG_BASE_REF` follows the
  same rule (T4). Both use the same commit, and CI fetches enough history for it
  ([test plan §2](../plan/runs/AR-1/test-plan.md)).
- **State of that decision.** Committed, independently code-read, not merged, hosted CI unproved:
  - The `packages/domain` owner's correction (P2A-1 to P2A-8) is committed in `22c5386`. The
    coordinator reports 179 passing tests and passing negative and positive CI-baseline probes. An
    independent code reading of the corrections passed. It ran no command, and its PASS holds only if
    the domain test and typecheck exit 0, which the coordinator's run reports
    ([`docs/evidence/AR-1/p2a-review3.json`](../evidence/AR-1/p2a-review3.json); first read in the
    main checkout, now copied to this branch).
  - As read in this worktree, `.github/workflows/mobile-ci.yml:19-44` now sets the variable from the
    event, checks out full history and refuses an empty, all-zero or malformed value. No hosted CI run
    has shown it.
  - Until the correction is merged and seen both passing and failing in hosted CI, **CI is not
    proven to check any contract baseline**. Before the candidate, CI checked none: `pnpm check` ran
    with `CI=1` on a shallow checkout without the variable (checkpoint review 2, P2A-1).
  - The migration guard (`check-sql-sources.mjs`, AR-1 phase 2) and its `FITLOG_BASE_REF` are not
    built yet. PL-1 runs that guard in CI.
- `private.contracts`, the schemas Postgres stores, must equal the snapshot's persisted section for all
  eight names; `pnpm backend:test` checks this. Only four of the eight (`days`, `instances`,
  `nutrients`, `measurements`) are asserted on write today
  (`20261017164445_contract_trigger_dispatch.sql:5-17`). Whether `exercise`, `food`, `set` and `goal`
  are asserted is decided per command by MB-2, MB-3, MB-5 and MB-6.
- **Versioning (decision, former G-10).** Compatibility lines as in §4.1. `1.0.0` is cut at MS-3, when
  the member contracts conform to §4. After that, a breaking change means `_v2` functions and a major
  bump.
- Parallel lanes that bump at once resolve the clash on rebase by taking the next version.

**SP3 rule.** Before any screen goal that uses a backend change starts, the backend goal (MB-1 to MB-7,
G15.api to G22.api, the backend part of AI-3) merges, in one change set:

1. its migrations;
2. its commands and RPCs with their tests;
3. the contract version bump and new snapshot;
4. a regenerated `apps/mobile/src/data/database.types.ts`;
5. fixture vectors for any formula it adds.

A screen goal names, in its handoff, the contract version it was built against, and calls no
operation or field that is not in a merged snapshot. When a contract change breaks a merged screen,
the backend goal ships the client data-layer change in the same merge, with the smallest diff to shared
files.

## 9. Environments, region and backups

- **Environments.** Local (exists), staging and production. Staging and production are separate
  Supabase projects with separate identity, data, storage, keys, subscriptions and messaging budgets
  (PRD §23.2). Staging data is synthetic (§7). Opening the projects and buying a plan is R-2.
- **Region (owner-reserved, R-1).** The engineering recommendation is Supabase Mumbai (`ap-south-1`)
  for both, because the launch is India-only and the latency budgets (NF-03, NF-05) are measured from
  Indian networks. It must be offered on the plan bought under R-2. This is not a legal opinion;
  counsel under DEC-04 may change it. Edge Functions that touch the database should run near it; PL-2
  checks how Supabase places them.
- **Secrets.** Supabase Vault and Edge Function secrets on the server; EAS environment variables for
  public build configuration only.
- **Backups.** RPO 15 minutes and RTO 4 hours are selected. OW-2's register infers that production
  point-in-time recovery is needed; buying it is R-2, and PL-5 proves it with a drill. Every restore,
  of the database or of object copies, imports the external tombstone register and purges before it
  serves, with jobs, wakeups and provider credentials off until the check passes and a delta import at
  cutover (§3.3). PL-5's drill shows that (AC30). Backups expire after at most 90 days by default
  (PRD §22.3). The register keeps each entry for the longest backup expiry plus a 30-day margin from
  the append, extended if erasure outlasts the margin (§3.3); whether that bound fits the retention
  schedule is R-4. The object and photo backup policy, a nightly copy or an explicitly accepted gap, is
  **open** (R-7, DEC-09). PL-5 writes the owner's choice into this section.

## 10. QA-1 findings this record routes

| QA-1 finding | Rule in this record | Owner |
|---|---|---|
| F-8h: SQL copies outside `migrations/` | §7 (compare, then delete), §8 (generated snapshot) | AR-1 |
| F-2: revoked-session read policies | §3.7 (session check in every policy) | MB-1, G16.api |
| F-3: append-only finance in the database | §3.3 (immutability triggers) | G17.api |
| F-7: lock after authorisation | §4.3 (scope, then lock, then replay) | G17.api |
| F-8d: front-desk duplicate reference | §4.5 `REVIEW_REQUIRED` (owner or manager review) | G17.api |
| F-4, F-5 and pruning: outbox conflict recovery, cache durability, key recovery | §3.1, §4.6, §4.7 | MB-3 |
| F-6: catalogue ID collision | §7 (separate key spaces) | CT-1, MB-2, MB-5 |
| F-8a: programme upsert race; F-8f: schedule refresh cost | §4.7; §3.6 (the scheduler, not the client, extends horizons) | MB-2 |
| F-8e: full session snapshots in `workout_revisions` | §4.7 (history rows: none on `set.commit`, set-level rows, session fields only on corrections) | MB-4, MB-3 |
| F-8b and the private-health boundary: staff notes, no staff health API | §6 (staff-only notes, no staff health API, owner/manager offers) | G18.api, G17.api, G16.api, G21.api |
| F-8g: web cache key | §3.1, §6 | MB-3 |

## 11. Approval and owner-reserved items

**One approval: G-1, approved by delegation on 26 October 2026.** *(Historical: this line read "One
approval, PENDING" until then.)*

| Gate | Approve | Unblocks | State |
|---|---|---|---|
| G-1 | This completed record as a whole, or with stated exceptions, as a dated entry in the tracker decision log | AR-1 box 1; QA-2; the technical part of DEC-02 | **Approved, no exceptions**, by Codex as the owner's explicitly delegated decision-maker: [ARCH-01](../09-PROJECT-TRACKER.md#decision-log), under the delegation AUTH-01. Not a personal owner review |

Phase 2 (boxes 2–4) does not wait for G-1. G-1 does not make AR-1 Done: the fresh all-box verifier and
integration still follow.

**Delegation and the reserved items.** ARCH-01 does not decide R-1 to R-7 below. Under AUTH-01, their
routine technical and vendor-technical parts can now be decided by Codex, each in its own goal and
dated record. Opening accounts, payments, external messages, legal and licence positions and device
proof still need real evidence, which no delegation supplies.

**Engineering decisions taken in this record (no separate gate).** These are routine and reversible,
made under the owner's standing authorisation, and frozen with G-1. Earlier drafts listed them as
gates; the old numbers are kept so the history can be followed.

| Former gate | Decision | Section |
|---|---|---|
| G-2 (architecture part) | Postgres on Supabase as the system of record, with Supabase Auth, Storage, Edge Functions, `pg_cron` and `pg_net` | §2, §3 |
| G-4 | The `/v1` binding: `_v1` PostgREST RPCs and `-v1` Edge Functions, camelCase JSON. Error envelopes are returned with `response.status` after identity and raised as `PT<status>` before it (revision 2) | §4.2, §4.5, §4.12 |
| G-5 | Decimal strings and signed or non-negative `{amountMinor, currency}` as the planned v1 wire format, not in 0.1.0 | §4.9, §8 |
| G-6 | Jobs in Postgres with an Edge worker; a separate host only if measured limits fail | §3.5 |
| G-7 (default only) | Direct store server notifications behind a provider-neutral adapter | §3.8 |
| G-8 (default only) | An error tracker behind a scrubbing adapter, with a deliberately chosen data region | §3.11 |
| G-9 | Compare, then delete, the four SQL files outside `migrations/`, and notify lane S2 | §7 |
| G-10 | Contract versioning: compatibility lines, `0.x` until MS-3, then `1.0.0`, with `_v2` for breaking changes | §4.1, §8 |

**Owner-reserved: not decided here and not claimed.**

| ID | Item | On record | Path |
|---|---|---|---|
| R-1 | Hosting region for staging and production (former G-3) | Engineering recommendation: Supabase Mumbai (`ap-south-1`); Singapore archived | Owner; OW-3; DEC-04 may change it |
| R-2 | Accounts and plan purchases: Supabase organisation, projects and plan (including point-in-time recovery), EAS, store developer accounts, and the storage account for the external tombstone register (§3.3) | Nothing opened | OW-3, OW-4 |
| R-3 | Vendor adoption: RevenueCat; Sentry or another error tracker and its data region; SMTP (Resend or Postmark); SMS (MSG91, DLT); WhatsApp (Meta Cloud API or a reseller); Expo push; the write-once store for the tombstone register and its region (§3.3) | Candidates only | DEC-05, OW-3, OW-5, OW-11 |
| R-4 | Legal positions: notices, DPA, minors, retention schedules (including retained actor keys and the external tombstone register with its retention bound, §3.3), regional deployment | None | DEC-04 |
| R-5 | Prices and store SKUs | None | DEC-06, OW-7 |
| R-6 | AI model and vendor | Chosen from AI-2 measurements | DEC-08, AI-1, AI-2 |
| R-7 | Object and photo backup policy: a nightly copy or an accepted gap | Open | DEC-09, PL-5 |

DEC-15 is not reserved: the owner has confirmed a fresh launch (§7), and OW-2 records it.

## 12. To verify before relying on it

| Item | How | When |
|---|---|---|
| PostgREST transaction access mode for `GET`/`HEAD`, for `POST` to `STABLE`/`IMMUTABLE` and to `VOLATILE` functions, and inside `db-pre-request` on each | Integration test against the local stack | MB-1 |
| HTTP status that PostgREST gives member and gym commands' `40001`, `42501` and `22023` today | Integration test against the local stack | MB-1, before any error code changes |
| `PT<status>` errors with a JSON DETAIL survive to the client; whether the `PGRST` form gives a better body | Integration test | MB-1 |
| `db-pre-request` can be configured on hosted Supabase | Staging check | MB-1, PL-2 |
| `UNLOGGED` rate-window table: behaviour after a crash and with any read replica | Documentation and a local test | MB-1 |
| **Rejected requests are counted; replays are not; transaction modes stay valid** (§4.3, §4.12) | Integration test against the local stack, with mutation checks. (1) Send 121 v1 commands within one minute. The first 120 are rejected with a mix of 403, 404, `REVISION_CONFLICT` 409, `OPERATION_REUSED` 409 and 422. The 121st must pass scope and both replay lookups, so it is a command that would otherwise get 403, a revision 409 or 422 (revision 3). Expect: the first 120 return their own status with the envelope, the 121st returns 429 with `Retry-After`, `private.rate_windows` holds 121 for the minute window, and no command, outcome or audit row was written. This also shows that PostgREST commits when a function returns normally with a 4xx `response.status`. (2) Replay one applied command 200 times. Every replay returns `meta.replayed: true`, and the count does not move. In SQL, a replay of a committed operation leaves no advisory lock in `pg_locks` for its backend. (3) A `GET` direct table read and a `POST` to a v1 read RPC both succeed with no `25006`, and only the RPC moves the read count. (4) Mutations: move the increment into the inner block, and test (1) must fail; make the fast path take the lock, and test (2)'s `pg_locks` check must fail. Restore each change and prove the restore. (5) Concurrency (revision 3): send N concurrent rejected commands for one account, a mix of 403 and 422. The minute and day windows each rise by exactly N, and no request fails with a deadlock (`40P01`). In SQL, inside an open transaction, after the definer has caught an error, `pg_locks` shows no advisory lock for that backend | MB-1 |
| **Tombstones survive a restore** (§3.3) | (1) MB-7 test: erase an account, restore a snapshot taken before the erasure into a scratch database, import the external register and purge. No personal row, object reference or auth user for that account remains, and sign-in fails. Mutation: skip the import, and the test must fail. (2) MB-7 test: make the register append fail. Erasure stops before step 3 and retries, and nothing is deleted. (3) Staging check of the chosen store: the worker credential cannot overwrite, shorten or delete an entry; an entry is written with retention of append time + longest backup expiry + 30 days; and the worker can extend that retention when step 2 outlasts the margin (revision 3). (4) PL-5 drill: the runbook imports the register and purges before serving, and no erased test account comes back (AC30). Revision 3 adds: no `pg_cron` job, `pg_net` wakeup, worker or messaging credential is active in the restored project until the check passes; a tombstone appended at the source after the first import is imported and purged at cutover; and every restore of object copies gets the same import and purge, with no object left under a tombstoned `<owner id>/` prefix. (5) MB-7 test (revision 3): after step 5 and before step 6, a sign-in cannot complete onboarding, and `complete_onboarding` refuses an actor whose `erased_at` is set. Final low findings: (6) MB-7 test (N-1): the step-5 test erases an owner or manager who has decided a freeze; step 5 succeeds and the `gym_freezes` row keeps its `decided_by` actor key. (7) MB-7 test (N-3): an upload URL issued just before step 1 delivers bytes after step 1; when erasure completes, no object remains under the account's `<owner id>/` prefix in any personal bucket. (8) PL-5 drill (N-2): an erasure request pending at the source when its erasure worker stops is copied into the restored project and runs from step 1 before clients switch; with the source unavailable, the drill records the lost in-RPO requests and their reconciliation | MB-7, PL-5 (store chosen under R-2, R-3; object copies under R-7) |
| **`operation_result_v1` returns only the §4.4 projection** (§4.3, revision 3) | Integration test: a manager demoted to front desk calls `operation_result_v1` for a freeze approve stored before the trim, and gets only identifiers and status, never the freeze projection. A revoked actor gets 404 | The goal that first ships `operation_result_v1` for gym scope; G17.api |
| `response.status` 202 from an RPC | Integration test | AI-3 |
| Signed upload URL lifetime | Read current Supabase docs, then test | MB-6 |
| `gym-file-v1` streaming proxy: object size and time limits, and that it calls the same SQL predicate as RLS | Integration test | G17.api |
| Edge Function wall-clock and memory limits against the five-minute AI deadline | Staging measurement | AI-1, PL-2 |
| Mumbai offered on the chosen plan; where Edge Functions run | Provider's public documentation and pricing pages | OW-3 (R-1, R-2) |
| Error-tracker data regions | Vendor documentation | OW-3 (R-3) |

## 13. Revision history

| Date | Change |
|---|---|
| 26 Oct 2026 | Phase-1 draft (10 owner gates) |
| 26 Oct 2026 | Revision 1 after the independent phase-1 review: F1–F17 and T1–T4 dispositioned in [phase1-dispositions.md](../plan/runs/AR-1/phase1-dispositions.md). The gates become one approval (G-1), engineering decisions in the body and the owner-reserved list R-1 to R-7. 0.1.0 scope reconciled with phase 2A. Approval still PENDING |
| 26 Oct 2026 | Revision 2 after checkpoint review 2, proposal findings PR-1 to PR-6, dispositioned in [proposal-revision2.md](../plan/runs/AR-1/proposal-revision2.md). An external append-only tombstone register (§3.3, §9). The actor key has no foreign key of its own (§3.3). Rejected requests are counted through an outer and an inner block (§4.3, §4.5, §4.12). A demotion replay policy (§4.3). The CI contract baseline fails closed (§8). New §12 checks. Durable review links. F1–F17 and T1–T4 stay resolved. Still one approval, G-1, PENDING |
| 26 Oct 2026 | Revision 3 after the proposal re-review, low findings R2-1 to R2-8, dispositioned in [proposal-revision3.md](../plan/runs/AR-1/proposal-revision3.md). Erasure step 1 also blocks sign-in, and an erased actor cannot onboard again (§3.3). Register retention starts at the later of the append and the `erased_at` commit (§3.3, §9). Restores stay quiet until checked, import a cutover delta and cover object copies (§3.3, §9). A lock-free replay fast path, stated lock lifetimes and counting order (§4.3, §4.6, §4.12). `operation_result_v1` is projected from its first release (§4.3). Support and system actors (§3.3). Truthful commit state (header, §8). §12 checks extended. PR-1 to PR-6 stay resolved. Still one approval, G-1, PENDING |
| 26 Oct 2026 | Final low corrections after proposal review 4 (PASS), N-1 to N-5, dispositioned in [proposal-final-low-dispositions.md](../plan/runs/AR-1/proposal-final-low-dispositions.md). `gym_freezes_decided_by_fkey` is dropped when the column moves to the actor key (§3.3 Missing). Pending erasures are carried across a restore cutover (§3.3). Erasure step 3 waits out the upload-URL lifetime and deletes by prefix (§3.3). §12 tests (6)–(8). Durable review links and a dated current-state addendum. Still one approval, G-1, PENDING |
| 26 Oct 2026 | G-1 approved by delegation: Codex, as the owner's explicitly delegated decision-maker, approved this record with no exceptions ([ARCH-01](../09-PROJECT-TRACKER.md#decision-log); delegation AUTH-01), after proposal review 4 and the guard review both passed. No architecture changed. The owner did not personally review or sign. Earlier rows in this table that say PENDING are historical. AR-1 is not Done |
