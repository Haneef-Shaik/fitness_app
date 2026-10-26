# AR-1 · Proposal revision 2 (checkpoint review 2, PR-1 to PR-6)

| Field | Value |
|---|---|
| Review | [`docs/evidence/AR-1/checkpoint-review2.json`](../../../evidence/AR-1/checkpoint-review2.json), copied from `/tmp/fitlog-ar1-checkpoint-review2.json`. An independent checkpoint review of phase 2A and of proposal revision 1. Proposal verdict **REVISE**, with findings PR-1 (medium) and PR-2 to PR-6 (low). It found F1–F17 and T1–T4 resolved |
| Scope | PR-1 to PR-6 only. P2A-1 to P2A-8 belong to the `packages/domain` owner, who also owns the contract CLI, its tests, CI, package fields, `phase2A.md` and its corrections. They are not dispositioned here |
| Revision | Revision 2, 26 October 2026, in worktree `/Users/Adya/.codex/worktrees/fitlog-ar1/fitness_app` (branch `codex/ar1-contract-freeze`) |
| Files changed | [`003`](../../../architecture/003-architecture-freeze.md), [`checkpoint.md`](checkpoint.md), [`test-plan.md`](test-plan.md), [`phase1-dispositions.md`](phase1-dispositions.md), this new file, and the review copies [`docs/evidence/AR-1/phase1-review.json`](../../../evidence/AR-1/phase1-review.json) and `docs/evidence/AR-1/checkpoint-review2.json`. Nothing else |
| Method | Each finding was checked by reading the PRD, GOALS.md, the cited migrations and the CI workflow. No command, git, source edit, database, migration, status, ledger or credential change; no external action; no delegation |
| Result | **All six accepted. None rejected.** PR-1 and PR-2 are accepted with a mechanism chosen here. F1–F17 and T1–T4 stay resolved. One approval only, G-1, still **PENDING**. AR-1 is **not** complete |

**Coordinator instructions applied:**
- The coordinator parsed the durable phase-1 copy and found it semantically identical to the original,
  then removed the staging duplicate `docs/evidence/AR-1-phase1-review.json`. JSON escaping and
  formatting differences in the copies do not change the review data.
- The P2A-1 to P2A-8 code fixes are committed as candidate `22c5386`. The coordinator reports 179
  passing tests and passing negative and positive CI-baseline probes. That is local evidence: no hosted
  CI run, no independent verification yet, and no acceptance.
- **Revision 3 update.** Since this was written, an independent code reading of the corrections has
  passed, and this revision with its review copies has been committed in `3040ccf`. All of it is on
  this branch only: not merged, hosted CI unproved, not accepted
  ([proposal-revision3.md](proposal-revision3.md), R2-6).

## Dispositions

### PR-1 · medium · The tombstone register lived inside the database a restore rolls back
- **Verified.**
  - The old 003 §3.3 made `actors.erased_at` the purge tombstone register.
  - A backup or point-in-time copy taken before an erasure has `erased_at` empty, so "purge every
    account with `erased_at` set" misses exactly the accounts at risk.
  - That fails PRD §22.3 (PRD.md:1530-1531: a "purge tombstone register prevents deleted users being
    resurrected after restore"), AC30 (PRD.md:1797) and MB-7 box 2 (GOALS.md:663).
  - PL-5 restores into an isolated project (GOALS.md:346), which fits a purge before serving.
- **Disposition.** Accepted.
- **Decision (003 §3.3).**
  - An **external register outside every database rollback domain** holds the actor UUID, the erasure
    time and the erasure job ID, and no personal field. It is append-only: the worker can add an entry
    but cannot overwrite or delete one.
  - **Append before erasure completes.** Erasure step 2 appends and confirms the entry before step 3
    deletes anything. A failed append fails closed: no later step runs, the job alerts and retries, and
    the account stays revoked. The append is idempotent on the actor UUID.
  - **Retention.** Each entry is kept until every backup and point-in-time copy taken before its
    erasure has expired: at least the longest backup expiry in force, 90 days or less by default.
  - `actors.erased_at` stays as the in-database copy.
  - **Restore.** PL-5's runbook restores into an isolated project, imports the register, purges every
    listed account and every account with `erased_at` set, checks that none remains, and only then
    serves clients.
  - MB-7's test replays from the external register, and PL-5's drill and AC30 prove that no erased
    account comes back.
  - **Candidate arrangement, never provisioned:** a write-once object store with a retention lock, in a
    storage account separate from every Supabase project. It holds one object per tombstone, with a
    write-only worker credential and a list-and-read credential held only by the runbook.
  - This is an architecture decision about properties. MB-7 configures the arrangement and PL-5 proves
    it. Its account is R-2, its vendor and region R-3, and the retention of the bare UUID R-4. Nothing
    is provisioned, and no owner or external approval is claimed.
- **Narrowed from the review.** The review's examples were "a private ops Storage object or a separate
  ops project". Neither qualifies under the rule "outside every database rollback domain":
  - a Storage bucket in the same project lists its objects through `storage.objects`, inside the
    database being restored;
  - a separate ops database has its own restores, which can roll the register back.
- **Changed.** 003 §3.3 (erasure step 2, register, Missing), §9, §11 (R-2, R-3, R-4), §12 and §13.
- **Residual tests and owners.**

  | Test | Owner | State |
  |---|---|---|
  | Restore a pre-erasure snapshot into a scratch database, import the external register and purge: no personal row, object reference or auth user remains, and sign-in fails. Mutation: skip the import, and the test fails | MB-7 | Not built |
  | A failed register append stops erasure before step 3 and retries; nothing is deleted | MB-7 | Not built |
  | The chosen store refuses overwrite and delete by the worker credential, and its retention covers the longest backup expiry | MB-7, PL-2 (store under R-2, R-3) | Not chosen, not provisioned |
  | The restore drill imports the register and purges before serving, and no erased test account comes back (AC30) | PL-5 | Not run |

### PR-2 · low · Rejected requests were never counted
- **Verified.**
  - The old 003 §4.12 said "a rolled-back request does not count".
  - Every rejected v1 call raises `PT<status>`, which rolls the counter back. So 401, 403, 404, 409 and
    422 responses were never counted.
  - PRD §18.1 (PRD.md:1184) limits writes to 120 a minute and 5,000 a day, and reads to 600 a minute,
    and says a replay neither creates nor counts a record.
- **Disposition.** Accepted, with option (a): a committing outer counter. Option (b), an outer limiter,
  is not chosen. Data RPCs go straight to PostgREST (003 §4.2), so it would need a gateway that the
  platform decision does not include.
- **Decision (003 §4.3, §4.5, §4.12).**
  - **Blocks.** Each v1 definer checks identity in an outer block and runs everything else in an inner
    `BEGIN … EXCEPTION` block. The rate check inside reads the committed counts and writes nothing.
  - **Counting.** After the inner block ends, the outer block adds one to each window unless the inner
    block replayed. On a caught error it returns the envelope with `response.status` (and `Retry-After`
    for 429), so the count commits and the command's writes do not.
  - **Unexpected SQLSTATEs.** These map to `INVALID_REQUEST`, `DUPLICATE_ENTITY` or `INTERNAL`. A
    statement timeout (`57014`) escapes uncounted.
  - **Preserved:** replays never count; the pre-request function never writes; reads are counted only
    in `VOLATILE` `POST` read RPCs, so nothing writes inside a `READ ONLY` transaction.
  - **Stated residual.** The database does not count requests that never reach a v1 definer: a bad
    contract header, bodies PostgREST rejects, and transitional direct reads. None takes the
    per-account lock. PL-9 watches their rates.
- **Changed.** 003 §4.3 (steps 1, 5 and the new count step), §4.5 binding, §4.12, §11 (the G-4 row
  wording) and §12 (new executable item).
- **Residual tests and owners.**

  | Test | Owner | State |
  |---|---|---|
  | 121 rejected commands in one minute (403, 404, 409, 422): the first 120 keep their status, the 121st gets 429 with `Retry-After`, the window holds 121, and no command row is written. This also shows that PostgREST commits a normal return with a 4xx `response.status` | MB-1 | Not built |
  | 200 replays of one applied command leave the count unchanged | MB-1 | Not built |
  | A `GET` direct read and a `POST` read RPC both succeed with no `25006`; only the RPC counts | MB-1 | Not built |
  | Mutation: move the increment into the inner block, see the first test fail, restore | MB-1 | Not built |

### PR-3 · low · The actor key's own foreign keys were not stated
- **Verified.**
  - `profiles.id` references `auth.users(id) on delete cascade` (`20261017161031_member_core.sql:7`).
  - An actor key built the same way would cascade at erasure step 6 into rows that every `RESTRICT`
    reference blocks.
  - `complete_onboarding` inserts the profile (`20261017164336_validated_contracts.sql:83`).
  - Gym and freeze definers require `member_active()`, which needs the profile, before they write an
    actor reference (`20261019121035_gym_read_models.sql:8`;
    `20261019140839_freeze_preview_binding.sql:16`; `20261017161031_member_core.sql:24-31`).
- **Disposition.** Accepted.
- **Decision (003 §3.3).**
  - `actors.id` has no foreign key to `auth.users` or `profiles`.
  - `complete_onboarding` inserts the actor row in the same transaction as the profile, before it, with
    `on conflict do nothing`. No actor reference can come before it.
  - The migration that adds the table inserts a row for each existing profile before it adds the
    foreign keys.
- **Changed.** 003 §3.3.
- **Residual tests and owners.** A migration test: deleting the profile and then the auth user leaves
  the actor row in place and is not blocked (MB-7). An onboarding test: the actor row and the profile
  commit together (MB-1). Neither is built.

### PR-4 · low · Replay after a role demotion was not addressed
- **Verified.**
  - In 003 §4.3, per-kind permission (step 7) comes after replay (step 4). `operation_result_v1` runs
    only steps 1 and 2.
  - `freeze_action` checks per-kind permission before replay today
    (`20261019140839_freeze_preview_binding.sql:22`, then `:24-27`), and its results carry freeze
    projections (`:70`).
  - **Also found here:** `gym_command_core` already replays (`20261019121035_gym_read_models.sql:15`)
    before its per-kind checks (`:42,47,62,84,97`). Its owner-or-manager kinds `membership.issue`,
    `charge.waive`, `payment.refund` and `payment.reverse` store balances (`:60,95,117`). So a demoted
    manager can replay their own earlier balance today.
- **Disposition.** Accepted. F1, which concerned revoked scope, is not reopened.
- **Decision (003 §4.3).**
  - A demoted actor may replay their own outcome, and `operation_result_v1` may return it. This is
    accepted only because §4.4 trims outcomes to identifiers, revisions, receipt numbers and status.
  - "Trimmed" includes rows stored before the trim: a replay returns only those fields, and the row is
    not rewritten.
  - Until a definer's outcomes are trimmed, no change moves one of its per-kind checks behind replay.
    G17.api keeps `freeze_action`'s current order until then.
  - `gym_command_core`'s existing exposure is recorded, and G17.api closes it with the trim.
- **Changed.** 003 §4.3; checkpoint F-17.
- **Residual tests and owners.** G17.api: a manager demoted to front desk replays an earlier
  `payment.refund`. Before the trim, the test records the existing exposure. After the trim, the replay
  returns only identifiers and status. A demoted actor's `freeze_action` approve replay is refused with
  403 until freeze outcomes are trimmed. A revoked actor gets 404 from both definers and from
  `operation_result_v1`. Not built.
- **Revision 3 (R2-5).** The interim rule ordered checks inside definers only, so
  `operation_result_v1` could have returned an untrimmed freeze projection to a demoted manager. 003
  §4.3 now has it return only the §4.4 projection from its first release, and 003 §12 adds the test: a
  demoted manager asks for a freeze approve stored before the trim and gets only identifiers and
  status. Not built.

### PR-5 · low · Failing closed in CI was only a request to "consider"
- **Verified.**
  - The old checkpoint asked the package owner to "consider" failing closed. T4 decided failing closed
    for `FITLOG_BASE_REF` only.
  - The old 003 §8 said that CI sets the variable. When review 2 read it, `mobile-ci.yml` did not.
  - As read now in this worktree, `.github/workflows/mobile-ci.yml:19-44` sets `FITLOG_CONTRACT_BASELINE`
    from the event, checks out full history (`fetch-depth: 0`), and refuses an empty, all-zero or
    malformed value.
- **Disposition.** Accepted.
- **Decision (003 §8).**
  - In CI, the contract baseline guard requires the trusted base commit from the CI event, never from
    the change. An unset or empty variable, an unresolvable ref, or unavailable git fails `pnpm check`,
    with no fallback.
  - The same rule as `FITLOG_BASE_REF`, on the same commit.
- **State, not proof.**
  - The correction is candidate `22c5386`, implemented and tested locally (as the coordinator
    reports).
  - Independent code verification is pending, and no hosted CI run has shown it passing with the trusted
    base or failing without it. (Revision 3: the independent code reading has since passed, and
    `22c5386` is committed but not merged. Hosted CI is still unproved.)
  - 003 §8 says that, until then, CI is not proven to check any contract baseline, and that before the
    candidate it checked none.
- **Changed.** 003 §8; checkpoint "Remaining AR-1 work" and box 2; phase1-dispositions T4 note;
  test-plan §2 and §7. No CLI, test, CI or package file was edited here.
- **Residual tests and owners.** Independent verification of `22c5386`, including the P2A-1 and P2A-2
  mutation checks (the `packages/domain` owner and an independent verifier). A hosted CI run that
  passes with the event's base and fails when the value is removed (`packages/domain` owner, with PL-1
  for the backend job).

### PR-6 · low · Review links pointed at `/tmp`
- **Verified.** `phase1-dispositions.md:5` and `checkpoint.md:13` cited
  `/tmp/fitlog-ar1-phase1-review.json`, and this branch had no `docs/evidence/AR-1/`.
- **Disposition.** Accepted.
- **Decision.**
  - Both reviews are kept on this branch: [`docs/evidence/AR-1/phase1-review.json`](../../../evidence/AR-1/phase1-review.json)
    and [`docs/evidence/AR-1/checkpoint-review2.json`](../../../evidence/AR-1/checkpoint-review2.json).
    (Revision 3: they were uncommitted when this was written. They are committed in `3040ccf`, on
    this branch only, not merged.)
  - The phase-1 copy came from this worktree's staging copy. The coordinator verified that it is
    semantically identical and removed the staging duplicate. The review-2 copy came from the `/tmp`
    input.
  - Every revision-2 citation uses the durable paths. The `/tmp` paths appear only as provenance.
- **Changed.** checkpoint (revision 1 and 2 inputs), phase1-dispositions header, 003 header, this file.
- **Residual.** The main checkout already holds `docs/evidence/AR-1/phase1-review.json`, and this
  branch now adds the same path. Whoever merges confirms that the two hold the same data. No test.

## F1–F17 and T1–T4

All stay resolved, as review 2 found. Revision 2 touches these, and reopens none:

| Item | Effect of revision 2 |
|---|---|
| F1 | Unchanged order. The demotion note (PR-4) is separate: a revoked actor still fails scope before replay |
| F2 | Preserved. The pre-request function never writes, and reads are counted only in `VOLATILE` `POST` RPCs. Counting now also covers rejected requests (PR-2) |
| F7 | The actor table and its `RESTRICT` references are unchanged. The register is made external (PR-1), and the actor key's foreign keys are stated (PR-3) |
| F10 | Still one approval, G-1. No new gate. The tombstone store falls under the existing R-2, R-3 and R-4 |
| F17 | Unchanged. Replays still never count |
| T4 | Unchanged for `FITLOG_BASE_REF`. Its contract-baseline counterpart is now a decision (PR-5) |

## Where this revision goes beyond the review

The short re-review should check these:
1. The review's register examples were narrowed: neither Storage in the same project nor a separate
   database qualifies (PR-1).
2. Restores go into an isolated project and serve no client until the purge check passes (PR-1).
3. The register append comes before any deletion, idempotent on the actor UUID, and a failed append
   stops erasure (PR-1).
4. A 429 is counted. SQLSTATEs the definer did not raise are mapped. A statement timeout escapes
   uncounted. Requests rejected before the definer are a stated residual (PR-2).
5. The G-4 wording changes: error envelopes are returned after identity and raised before it (PR-2).
6. `gym_command_core`'s existing demotion exposure, and the replay projection for rows stored before
   the trim (PR-4).

## Not claimed

- No owner approval. G-1 is **PENDING**, and no region, account, vendor, legal, price or backup
  approval is claimed. Nothing is provisioned: the tombstone store is a candidate only.
- No AR-1 box is complete, and **AR-1 is not complete**. No goal status, board, ledger or tracker entry
  was changed.
- Candidate `22c5386` is described from the coordinator's report: implemented and tested locally. It is
  not hosted-CI proof, not independently verified and not accepted. (Revision 3: an independent code
  reading has since passed. It is still not merged, not hosted-CI proof and not accepted.)
- Nothing in this revision was executed. "Verified" means checked by reading the cited file and line.
