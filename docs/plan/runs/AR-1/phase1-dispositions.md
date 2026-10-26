# AR-1 · Phase-1 review dispositions

| Field | Value |
|---|---|
| Review | [`docs/evidence/AR-1/phase1-review.json`](../../../evidence/AR-1/phase1-review.json), an independent, read-only review of phase 1. It was first read at `/tmp/fitlog-ar1-phase1-review.json`; revision 2 (PR-6) moved the citation to the durable copy. Verdict **REVISE**: 17 findings on 003 and the checkpoint (F1–F17), 4 on the test plan (T1–T4) |
| Later | Checkpoint review 2 ([`checkpoint-review2.json`](../../../evidence/AR-1/checkpoint-review2.json)) found all 21 resolved, plus proposal findings PR-1 to PR-6. Those are dispositioned in [proposal-revision2.md](proposal-revision2.md); the notes below mark where they touch F7 and T4 |
| Revision | Revision 1, 26 October 2026, in worktree `/Users/Adya/.codex/worktrees/fitlog-ar1/fitness_app` (branch `codex/ar1-contract-freeze`, `9f148c1` plus phase 2A's uncommitted files) |
| Files changed | [`003`](../../../architecture/003-architecture-freeze.md), [`checkpoint.md`](checkpoint.md), [`test-plan.md`](test-plan.md), and this new file. Nothing else |
| Method | Each finding was checked by reading the PRD and the cited source. No command, git, source edit, migration, status, ledger or credential change; no external action; no delegation |
| Result | **All 21 findings accepted. None rejected.** F7, F8, F9, F17 and T3 are accepted with a mechanism chosen here; the review offered options for each. Owner approval of 003 (G-1) stays **PENDING**. AR-1 is **not** complete |

**Orchestrator instructions applied in this revision:**
- The owner has confirmed a fresh launch: no existing users or data are redirected into the rebuild.
  Historical data is preserved.
- Routine, reversible engineering is authorised. No account, region, vendor, legal, price or backup
  approval is claimed.
- Phase 2A is in progress under another worker who owns `packages/domain` and `phase2A.md`. Its guard
  covers existing schemas only.
- Proposed future wire-format changes remain planned.

## Dispositions

### F1 · medium · Replay was checked before tenant and role
- **Verified.** 003's old §4.3 step 4 looked up the operation ID and hash before checking tenant and
  role. Current gym code authorises first: `gym_command_core` checks identity, then role, then locks,
  then replays (`20261019121035_gym_read_models.sql:8-15`). `freeze_action` checks access before its
  replay (`20261019140839_freeze_preview_binding.sql:21-29`), but takes the lock at `:17`, before the
  check (QA-1 F-7). PRD §22.1: "Staff role cache cannot extend revoked permission".
- **Disposition.** Accepted.
- **Decision.** The order is identity and session → scope (own account, live gym role or live link) →
  lock → replay → write-rate count → dependencies → per-kind permission → base revision → validation →
  write. `operation_result_v1` runs the first two steps and returns `NOT_FOUND` otherwise.
- **Addition.** Stored outcomes hold only identifiers, revisions, receipt numbers and status, so a
  replay cannot show more than the caller's current role could read. Today gym and freeze results carry
  balances (G17.api).
- **Changed.** 003 §4.3, §4.4, §6 and §10; checkpoint F-17.

### F2 · medium · Read counting would write inside READ ONLY transactions
- **Verified.** 003's old §4.3 and §4.12 counted reads in the pre-request function into
  `private.rate_windows`. Direct table reads stay allowed during transition (§4.2).
- **Disposition.** Accepted. The claim about how PostgREST sets transaction mode is added to §12 for
  MB-1 to confirm, and the design no longer depends on it.
- **Decision.**
  - The pre-request function only checks the contract header and never writes.
  - Reads are counted only inside v1 read RPCs, which are declared `VOLATILE` and called by `POST`.
  - Transitional direct reads are not counted by the database; RLS and `max_rows` bound them.
  - Counters are kept in an `UNLOGGED` table inside the request's own transaction.
- **Changed.** 003 §4.2, §4.3, §4.12 and §12 (two new verify items).

### F3 · medium · A major-only check accepts breaking 0.x minors
- **Verified.** 003's old §4.1 rejected only an unsupported major, while §8 lets `0.x` break in a
  minor.
- **Disposition.** Accepted.
- **Decision.**
  - Compatibility lines: `MAJOR.MINOR` before 1.0.0, `MAJOR` after.
  - The server serves a list of lines. A missing header, or one outside the list, gets
    `400 CONTRACT_UNSUPPORTED` with `meta.supported`.
  - `health-v1` publishes `contract: {current, supported}`.
- **Changed.** 003 §3.11, §4.1, §4.5 and §8.

### F4 · medium · Money range excluded signed values
- **Verified.** The delta columns are `check (delta_paise <> 0)`, with no magnitude bound
  (`20261017164708_gym_operations.sql:56,72`). They are written negative
  (`20261019121035_gym_read_models.sql:89,93,107`). Balance `net` and `credit` can be negative
  (`20261017164708_gym_operations.sql:126`). `gym_account_v1` returns all of them.
- **Disposition.** Accepted.
- **Decision.** Three money kinds:
  - non-negative, 0 to 1e11: prices, fees, charges, payments, refund, reversal and waiver amounts;
  - signed delta, ±1e11 and never 0: adjustments and allocations;
  - aggregate, signed, magnitude at most `Number.MAX_SAFE_INTEGER`, or the server raises `INTERNAL`:
    balances and dashboard totals.

  G17.api adds `abs(delta) <= 1e11` checks.
- **Changed.** 003 §4.9.

### F5 · medium · F-8e was routed to a rule that fixes nothing
- **Verified.** Outcome rows already store only `{id, revision}`
  (`20261019122347_function_lint_cleanup.sql:109,111`). The real growth is the full session-plus-sets
  snapshot written to `workout_revisions` on every operation on an existing session, each `set.commit`
  included. The current definition is `20261017164212_workout_correction_commands.sql:19-22`; it was
  first added at `20261017163754_scheduling_and_history.sql:93-96` (QA-1 F-8e at
  `bootstrap-security-review.md:191`).
- **Disposition.** Accepted.
- **Decision.**
  - `set.commit` writes no history.
  - A later set change writes one set-revision row (PRD §21.2 Set/SetRevision).
  - A session history row holds session fields only and is written only on corrections after
    completion.
  - Existing `workout_revisions` rows are kept (historical data preserved).
- **Owner.** MB-4, with MB-3 for the set commands.
- **Changed.** 003 §4.6, §4.7 and §10; checkpoint F-15.

### F6 · medium · "No staff health API", owner/manager offers and staff-only notes were dropped
- **Verified.**
  - PRD §21.3 lists "no staff health API" and owner/manager templates.
  - PRD §12.1 says front desk cannot offer templates.
  - PRD §16.1 forbids staff personal-data reads.
  - PRD §22.3 excludes staff-only notes from export.
  - 003's old §10 routed this to §6, which had no such row.
  - A linked member reads `notes` and `tags` through `register_read`
    (`20261017164708_gym_operations.sql:108`). They also come through `gym_account_v1`'s
    `to_jsonb(m)` (`20261019121035_gym_read_models.sql:136-137`), a second path the review did not
    cite.
- **Disposition.** Accepted, and extended to `tags` and to the `gym_account_v1` path.
- **Decision.**
  - §6 rows for no staff health API, owner/manager-only templates and offers, and staff-only notes and
    tags.
  - Linked members read their card only through `my_gym_card_v1`, which omits notes and tags. The
    linked-member branch of `register_read` is removed. Export excludes notes and tags.
- **Owners.** G16.api, G21.api, G18.api, G17.api, MB-7.
- **Changed.** 003 §4.15, §5, §6 and §10; checkpoint F-16.

### F7 · medium · Actor references must not be nulled
- **Verified.** PRD §21.2 (PRD:1406) requires `SET NULL` only on the gym link and forbids cascading
  gym receipts.
  - Every `actor_id` and `gym_roles.user_id` references `profiles(id)` with no `ON DELETE` rule
    (`20261017164708_gym_operations.sql:9,22,42,47,52,57,62,67,72,83,88,91`).
  - `profiles` cascades from `auth.users` (`20261017161031_member_core.sql:7`).
  - So deleting an auth user with personal rows or staff actions fails today.
  - A `SET NULL` on append-only rows would be a destructive update that an immutability trigger
    blocks.
- **Disposition.** Accepted. The review offered a minimal tombstoned profile or an actor table; this
  revision chooses the **actor table**.
- **Decision.**
  - `private.actors(id = auth user ID, created_at, erased_at)` is never deleted and has no personal
    field. Every actor reference points at it with `ON DELETE RESTRICT`.
  - `linked_user_id` uses `ON DELETE SET NULL`. Personal tables use `ON DELETE CASCADE` as a backstop
    behind MB-7's explicit purge order.
  - `actors.erased_at` doubles as the purge tombstone register that PRD §22.3 requires.
  - Retention of the bare UUID is a legal question (R-4, DEC-04), not claimed here.
- **Changed.** 003 §3.3 and §11 (R-4); checkpoint F-10 corrected.
- **Revision 2 note (PR-1, PR-3).** F7 stays resolved, and the actor table and its `RESTRICT`
  references are unchanged. Two parts are corrected:
  - `actors.erased_at` alone cannot be the tombstone register, because a pre-erasure backup has it
    empty. It is now the in-database copy of an external, append-only register (003 §3.3).
  - `actors.id` has no foreign key of its own, and the actor row is created with the profile.

  Details are in [proposal-revision2.md](proposal-revision2.md).
- **Checkpoint F-10 as first written:** "The deletion graph is undefined: `gym_members.linked_user_id`
  and every `actor_id` reference `profiles(id)` without the `SET NULL` that §21.2 requires".

### F8 · medium · Feed sequence allocation could lose late commits
- **Verified.** The old §4.8 gave no allocation rule. Member RPCs serialise on an advisory lock
  (`20261019122347_function_lint_cleanup.sql:34`), but direct writes and gym writes do not.
- **Disposition.** Accepted.
- **Decision.**
  - A `BEFORE` trigger stamps `change_seq` from a per-account counter row, updated in the writing
    transaction and held until commit. No sequence and no `max()+1`.
  - Every writer stamps through it, and the scheduler works one account per transaction.
  - Gym rows that a linked member reads use a separate per-link feed. It is stamped from a counter on
    the `gym_members` row, which gym commands already lock (`20261019121035_gym_read_models.sql:24`;
    `20261019140839_freeze_preview_binding.sql:19`).
  - This differs from the review's wording ("every writer stamps through it") only in using two
    counter rows, one per feed. The commit-order guarantee is the same.
- **Changed.** 003 §3.6 and §4.8.

### F9 · medium · No revocable or proxied access path
- **Verified.** PRD §22.1 (PRD:1481) says: use an authorised proxy or revocable access where immediate
  revocation is required, and keep future passport links independently revocable. PRD §22.3 says:
  revoke access immediately on deletion. The old §3.4 had signed URLs only.
- **Disposition.** Accepted.
- **Decision.** A per-bucket table:
  - **`personal-images`, `ai-inputs` and `exports`:** signed URLs, with an **accepted and stated**
    300 s residual for a URL issued to the owner's own session. Issuance stops at revocation, and
    erasure deletes objects early in its order.
  - **`gym-documents`:** always through the streaming proxy `gym-file-v1`, which rechecks access on
    every request and never issues a URL.
  - **Passport links:** one revocable grant row each, through the proxy.
- **Changed.** 003 §3.4, §4.11, §6 and §12.

### F10 · medium · Ten owner gates where AR-1 needs one approval
- **Verified.** The old §11 had ten pending gates. The checkpoint and test plan branched on G-9 and
  sent non-empty diffs to the owner. The orchestrator confirms that routine, reversible engineering is
  authorised.
- **Disposition.** Accepted.
- **Decision.**
  - **G-1 is the only approval**, pending: approve the completed 003, as a dated tracker entry.
  - **Now engineering decisions in the body:** G-2 (architecture part), G-4, G-5, G-6, G-9, G-10, and
    the defaults of G-7 and G-8.
  - **Owner-reserved and unclaimed:** R-1 region (Mumbai is only a recommendation); R-2 accounts and
    plan purchases (OW-3, OW-4); R-3 vendor adoption (RevenueCat, Sentry and its region, SMTP,
    MSG91, WhatsApp, Expo push); R-4 legal (DEC-04); R-5 prices and SKUs (DEC-06); R-6 AI vendor
    (DEC-08); R-7 photo backup (DEC-09).
  - **Phase 2:** compare, then delete the four SQL files and notify S2. A non-empty diff or a CLI
    failure goes to the orchestrator. Only a local `db reset` needs the owner.
- **Changed.** 003 §1, §2, §7, §9 and §11; checkpoint "Remaining AR-1 work", "Approval" and "Resume";
  test plan header, ground rules and §2.

### F11 · low · The decimal regex accepted `-0`
- **Verified.** The old pattern `^-?(0|[1-9][0-9]*)(\.[0-9]*[1-9])?$` matches `-0`.
- **Disposition.** Accepted.
- **Decision.** Use `^(0|-?[1-9][0-9]*(\.[0-9]*[1-9])?|-?0\.[0-9]*[1-9])$`. It was hand-checked:
  - rejects `-0`, `0.0`, `-0.0`, `00`, `01`, `1.50`, `1.`, `.5`, `+1` and `1e5`;
  - accepts `0`, `0.5`, `-0.5`, `10`, `1.05` and `101.333333`.

  It has no lookaround, so `pg_jsonschema` can use it. The pattern sits in a code block in 003 to avoid
  Markdown table escaping. The test plan adds a test that `formatDecimal` output always matches it.
- **Changed.** 003 §4.9; test plan §4.

### F12 · low · Inaccurate "Today" entries
- **Verified, each:**
  - `nutrition_targets` has no revision column and no timestamps
    (`20261017161031_member_core.sql:123-127`), and the client inserts none
    (`apps/mobile/src/data/api.ts:76`).
  - `P0002` is already re-raised as `PT404` (`20261019120824_gym_api_errors.sql:6`).
  - Freezes map `40001` to `PT409` (`20261019140429_gym_freezes.sql:158,170`).
  - `freeze_action` returns `22023` for a revoked session (`20261019140839_freeze_preview_binding.sql:16`).
  - The visit-list path lacked `apps/mobile/` and has no exact count
    (`apps/mobile/src/features/gym/GymHomeScreens.tsx:37`).
  - Only four of the eight contracts are asserted (`20261017164445_contract_trigger_dispatch.sql:5-17`).
- **Disposition.** Accepted, all five.
- **Decision.** Each entry is corrected. MB-5 adds a revision and created and updated times to
  targets. The §12 HTTP-mapping item now names member and gym `40001`, `42501` and `22023`, moved to
  MB-1, because no phase-2 step tested it.
- **Addition.** Created and updated times are missing on most member tables (checkpoint F-19).
- **Changed.** 003 §3.3, §4.5, §4.7, §4.8, §8 and §12; checkpoint F-3, F-5, F-6, F-18 and F-19; test
  plan §1.
- **Checkpoint entries as first written:**
  - F-3: "… a revoked session gives 403, not 401. How PostgREST maps `40001` and `P0002` to HTTP is
    unrecorded".
  - F-5: "Meals, body entries, goals and targets are written straight to tables: no operation ID or
    replay, a client-supplied `revision`, and updates with no revision check".
  - F-6: "… gym lists use 50-row offsets with an exact count".

  Test plan §1 as first written said `persistedContracts` held "the eight schemas Postgres validates".

### F13 · low · "Exercise semantics come from the authorised instance" was not recorded
- **Verified.** PRD:1444. The code already enforces it:
  - `set.commit` and `set.edit` read the type from the stored instance
    (`20261019122347_function_lint_cleanup.sql:83-87`;
    `20261017164212_workout_correction_commands.sql:29-33`);
  - the trigger rejects a snapshot that differs from the authorised exercise version
    (`20261017164445_contract_trigger_dispatch.sql:26-32`).
- **Disposition.** Accepted.
- **Decision.**
  - Set commands carry `instanceId` and set values only.
  - Instance commands carry `exerciseId` and `exerciseVersion`; the server builds the snapshot.
  - Remaining gap: `session.update` still takes a client-built instance list, which is checked but not
    server-built (MB-3).
- **Changed.** 003 §4.15 row and new §4.16.

### F14 · low · The domain table omitted PRD minimum operations
- **Verified** against the PRD §21.3 table, row by row.
- **Disposition.** Accepted.
- **Decision.** The column is retitled "Minimum operations (PRD §21.3)", and every listed operation is
  included. That adds: identity verification; instance create, edit and delete; food categories and
  archive; target-version preview and analytics; goal status; member-gym requests; exit reason;
  owner/manager templates; no staff health API. The bindings were rechecked: for example, a linked
  member's freeze request goes through `freeze_command_v1`, and renewal goes through
  `membership.issue`.
- **Changed.** 003 §5.

### F15 · low · Parts of §21.4 were missing
- **Verified.** PRD §21.4 lists aliases, servings, muscles, safe demo fixtures and the import contract;
  Strong and Hevy imports are P2. Muscles are free-text arrays today
  (`20261017161031_member_core.sql:44`).
- **Disposition.** Accepted.
- **Decision.** A reference-content table with owners:
  - muscle hierarchy: CT-1 content, MB-2 schema;
  - foods, aliases and servings: G14.data, MB-5;
  - string catalogues: G14.hi;
  - safe demo fixtures: PL-2, QA-5, CT-1.

  Every import format gets preview, timezone and unit mapping, duplicates, row errors and idempotent
  retry. The gym import is G17.api; Strong, Hevy, FitNotes and the food CSV are AP-5 (P2).
- **Added from the orchestrator.** The fresh-launch confirmation and the rule to preserve historical
  data.
- **Changed.** 003 §7.

### F16 · low · health-v1 is public but JWT checks were off "for webhooks only"
- **Verified.** The old §3.11 made `health-v1` public, while the old §4.11 turned JWT checks off only
  for the two webhooks.
- **Disposition.** Accepted.
- **Decision.** JWT verification is off for exactly three functions: the two webhooks and
  `health-v1`. Health returns only non-sensitive fields. Every other function needs a session JWT.
- **Changed.** 003 §3.11 and §4.11.

### F17 · low · Hash scope, dependency order and pruning
- **Verified.**
  - The old §4.6 hashed the contract major and an ordered dependency list.
  - Today's dependency loop is ordered and checks outcome rows
    (`20261019122347_function_lint_cleanup.sql:40-42`).
  - After pruning, an applied dependency would read as pending forever, against PRD §20.2's "not
    infinite retry".
- **Disposition.** Accepted. The review offered keeping operation keys, or making an expired
  dependency non-retryable; this revision **keeps operation keys**.
- **Decision.**
  - The `h1` hash covers `{actor, scope, kind, entityId, baseRevision, payload}`; there is no contract
    version or dependency list in it.
  - Dependencies are a set.
  - Results are pruned at 180 days. Operation keys stay for the life of the account, so a pruned
    dependency is still satisfied, and a late replay returns `resultPruned: true` with the entity ID.
  - The client retries `DEPENDENCY_PENDING` only while the dependency is still queued; otherwise the
    operation goes to Needs attention.
  - On `OPERATION_REUSED`, the client calls `operation_result_v1` first.
- **Changed.** 003 §3.1, §3.6, §4.5, §4.6 and §4.15.

### T1 · low · The drift probe was a comment
- **Disposition.** Accepted.
- **Decision.** The probe migration is `create table public.ar1_drift_probe(id integer);`, checked by
  `grep -c ar1_drift_probe`. Also added: confirm the file is gone, and never run `migration up` while
  it exists.
- **Changed.** Test plan §3.

### T2 · low · `git diff` ignores untracked files
- **Verified.** The snapshot, manifest and fixture are new, so they are untracked.
- **Disposition.** Accepted.
- **Decision.**
  - Tracked files are proven with `git diff --exit-code`. Untracked files are proven with a SHA-256
    recorded in `$AR1_TMP` before the mutation and checked with `shasum -a 256 -c` after it. A check
    that must create no file also compares the directory listing.
  - Phase 2A's evidence already meets this for M1.2 (the hash is back to `74914ca9…`) and M1.4 (the
    directory listing is unchanged).
  - M4.3 and the new M4.4 use the hash method.
  - A WIP commit was not chosen, because phase 2 runs without git writes.
- **Changed.** Test plan ground rules, §1 and §4.

### T3 · low · Decimal formatting edge cases and the no-eligible-volume case
- **Verified.**
  - `sessionSummary` adds `?? 0`, so a session with no eligible set reports volume `0`
    (`packages/domain/src/calculations.ts:33-36`).
  - The SQL `sum()` of only `NULL` values is `NULL`.
  - `toFixed` rounds the binary double.
- **Disposition.** Accepted.
- **Decision.**
  - **The agreed answer is `null`**, because PRD §8.2 says "no invented kg volume". A new session
    vector `no-eligible-volume` expects `volumeKgReps: null`, `workingSets: 1` and
    `bestE1rmKg: null`.
  - The TypeScript runner sums the non-null `setVolume` results, or gives `null`. It asserts
    `sessionSummary`'s volume only where the expected value is non-null.
  - The `sessionSummary` divergence is checkpoint F-20, owned by MB-4. It is not fixed in phase 2,
    because `apps/mobile` displays that value.
  - New tests: `formatDecimal(-0.0000001)` is `"0"`. The known limit is documented:
    `(1.005).toFixed(2)` is `"1.00"`, while SQL `round` gives `1.01`.
  - M4.4 proves that both languages check the null rule.
- **Changed.** 003 §4.9 and §4.13; checkpoint F-20; test plan §4.

### T4 · low · The base-ref guard needs a local `main` and a permanent name
- **Disposition.** Accepted.
- **Decision.**
  - The variable is renamed `FITLOG_BASE_REF`.
  - **The guard fails closed:** it is required when `CI` is set, and an unresolvable ref or a missing
    merge base exits 1 with a clear message.
  - **Trusted policy:** PL-1 sets the variable from the CI event (the pull request's base branch, or
    the previous head on a push), never from content of the change, and fetches enough history.
  - CI also sets phase 2A's own variable, `FITLOG_CONTRACT_BASELINE`, to the same commit. Phase 2A's
    code is not changed here; the checkpoint asks its owner to fail closed in CI too.
  - New checks M2.3 and M2.4 prove that the guard fails closed.
- **Changed.** Test plan §0 and §2; 003 §8; checkpoint "Remaining AR-1 work".
- **Revision 2 note (PR-5).** T4 stays resolved for `FITLOG_BASE_REF`. The request above, which asked
  the package owner to fail closed in CI "too", is now a decision in 003 §8: the contract baseline guard
  fails closed in CI. The correction (P2A-1 to P2A-8) is candidate `22c5386`, implemented and tested
  locally. Independent verification is pending, and no hosted CI run proves it. Details are in
  [proposal-revision2.md](proposal-revision2.md).
- **Revision 3 note (R2-6).** `22c5386` is now committed and independently code-read, but not merged,
  and hosted CI is still unproved ([proposal-revision3.md](proposal-revision3.md)).

## Checkpoint findings as first written

Phase 1's wording of every checkpoint row that revision 1 changed, kept for the record. The revised
rows are in [checkpoint.md](checkpoint.md#findings).

| # | Finding (phase 1) | Evidence (phase 1) | Owner (phase 1) | Why it changed |
|---|---|---|---|---|
| F-1 | No contract version is exported, and the "versioned Zod contracts" in 002 have no version anywhere | `packages/domain/src/index.ts:1-4`; `packages/domain/package.json` | AR-1 | Phase 2A has since added 0.1.0, uncommitted |
| F-2 | The JSON Schema generator writes `supabase/contracts.sql`, which nothing executes; the database validates against the copy inside a 17 October migration. Three more draft SQL files sit outside `migrations/` (QA-1 F-8h) | `scripts/backend/contracts.ts:8`; `20261017164336_validated_contracts.sql:3-13` | AR-1 (G-9) | G-9 is now a decision (F10) |
| F-3 | No success or error envelope and no request ID. SQLSTATEs are mixed: `22023` covers both shape (400) and field rules (422); "Workout not found" raises `42501` (403) where the PRD wants 404; a revoked session gives 403, not 401. How PostgREST maps `40001` and `P0002` to HTTP is unrecorded | `20261019122347_function_lint_cleanup.sql:77`; `20261017161031_member_core.sql:24-31` | MB-1, G16.api | F12 |
| F-4 | Request hashes are `md5` with different scopes: member commands hash `{entity, kind, base, payload}`; gym and freeze commands hash the whole command, ID included. No contract version is part of either | `20261017161225_member_operations.sql:20`; `20261019121035_gym_read_models.sql:5`; `20261019140839_freeze_preview_binding.sql:14` | MB-3, G16.api | F17 keeps the contract version out of the hash |
| F-5 | Meals, body entries, goals and targets are written straight to tables: no operation ID or replay, a client-supplied `revision`, and updates with no revision check | `apps/mobile/src/data/api.ts:55-78`; `20261017161031_member_core.sql:157-160` | MB-5, MB-6 | F12 |
| F-6 | No cursor pagination. The member app downloads every own row in 500-row offset pages; gym lists use 50-row offsets with an exact count | `apps/mobile/src/data/api.ts:7-18`; `apps/mobile/src/data/gym-api.ts:38` | MB-3, G16.api, G17.api | F12 |
| F-7 | Decimals travel as JSON numbers and `numeric` columns have no declared scale, while the PRD's own example sends `"80"` as a string | `packages/domain/src/models.ts:26,41,66-69` | Owner G-5; then MB-3, MB-5, MB-6, G17.api | G-5 is now a decision (F10) |
| F-9 | Storage policies let a member sign their own objects with any lifetime, which conflicts with the 5- and 10-minute URL rules | `20261017161031_member_core.sql:169-174` | MB-6 | F9 |
| F-10 | The deletion graph is undefined: `gym_members.linked_user_id` and every `actor_id` reference `profiles(id)` without the `SET NULL` that §21.2 requires | `20261017164708_gym_operations.sql:22` and the `actor_id` columns | MB-7, G17.api | F7 |

## The review's other items

| Item | Disposition |
|---|---|
| Boxes: box 1 "drafted; approval pending"; boxes 2–4 "not started" | Box 1 agreed. Box 2 is now **in progress**: phase 2A recorded its local half after the review was written. That is not verified here and is not claimed as done. Boxes 3 and 4 agreed |
| Next phase 1: revise, restructure §11, ask the owner for one dated approval | Revision done. The approval request is G-1 and is **PENDING**; only the owner can make the entry |
| Next phase 2: phase 2 does not need G-1; run it with T1–T4 applied | Accepted. The test plan's order is preflight → box 2 database half → SQL guards and deletions → box 4 → box 3 with the structural probe → gates → handoff |
| Next phase 3: §12 additions | Added: PostgREST access mode under `GET`/`HEAD`, `STABLE` and `VOLATILE`, and in pre-request. Kept: `PT<status>` versus `PGRST` bodies, and `response.status` 202 |
| Next phase 4: short re-review of changed sections, then the goal verifier | Listed in the checkpoint's remaining work. Not requested here, because delegation is out of scope |
| Phase 2A's note that 003 §8 conflicted with test-plan §1 step 5 about the primitives | Settled: 0.1.0 publishes only today's schemas, and the primitives are planned for MB-1 and the decimal and money goals (003 §8; test plan §1 "Not in AR-1") |

## Where this revision goes beyond the review

These points go beyond the review. The re-review should check them:
1. Stored outcomes hold only identifiers, revisions, receipt numbers and status (003 §4.4, §4.6).
2. `tags` are staff-only alongside `notes`, and `gym_account_v1` is closed as a second leak path (003 §6).
3. The actor key equals the auth UUID and doubles as the tombstone register (003 §3.3). Review 2 found
   the register insufficient (PR-1). Revision 2 keeps `erased_at` only as the in-database copy of an
   external register.
4. Linked members' gym data gets its own feed counter on `gym_members` (003 §4.8).
5. Rate windows live in an `UNLOGGED` table (003 §4.12).
6. New checkpoint findings F-15 to F-20.
7. New mutation checks M2.3, M2.4 and M4.4.
8. The legacy-data statement records the owner's fresh-launch confirmation, as relayed by the
   orchestrator. The dated tracker entry and the DEC-15 ledger row remain OW-2's to write.

## Not claimed

- No owner approval. G-1 is **PENDING**, and no region, account, vendor, legal, price or backup
  approval is claimed.
- No AR-1 box is complete, and **AR-1 is not complete**. No goal status, board, ledger or tracker entry
  was changed.
- Nothing in this revision was executed. Every "Verified" above means checked by reading the cited
  file and line.
