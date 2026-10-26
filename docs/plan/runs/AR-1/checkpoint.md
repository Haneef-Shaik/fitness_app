# Checkpoint — AR-1 · Freeze the architecture and the versioned data contract

| Field | Value |
|---|---|
| Phase | 1 of AR-1 (the architecture record, this checkpoint and the next-phase test plan), plus revision 1 after the independent phase-1 review, revision 2 after checkpoint review 2 (proposal findings PR-1 to PR-6) and revision 3 after the proposal re-review (low findings R2-1 to R2-8) |
| Date | 26 October 2026 |
| Worktree | `/Users/Adya/.codex/worktrees/fitlog-ar1/fitness_app`, branch `codex/ar1-contract-freeze`. Code is cited as read at `9f148c1`. *Historical, as of revision 3; current state in the addendum below.* On this branch, not merged: phase 2A's snapshot (`07757a5`), its corrections (`22c5386`), and revision 2 with the durable review copies (`3040ccf`). Revision 3's edits are uncommitted |
| Lane | S8 Member backend |
| **AR-1 status** | **Not complete.** G-1 is approved by delegation (ARCH-01, 26 October 2026); see the current-state section below. *Historical, as of revision 3:* Box 1 is drafted and revised, and waits for the owner's one approval (G-1). Box 2's local half is recorded by phase 2A; its database half has not started. Box 3 has not started. Box 4's files are drafted by phase 2B, and its SQL has never run |

## Current state — G-1 approved by delegation, 26 October 2026 (read this first)

- **G-1 is approved.** Codex, acting as the owner's explicitly delegated decision-maker, approved 003
  (revision 3 with N-1 to N-5) with no exceptions:
  [tracker row ARCH-01](../../../09-PROJECT-TRACKER.md#decision-log). AUTH-01 records the owner's
  delegation in their own words. The owner did not personally review or sign 003.
- **Basis.** [Proposal review 4](../../../evidence/AR-1/proposal-review4.json) and the
  [guard review](../../../evidence/AR-1/guard-review.json), both independent, both PASS. Local gates:
  185 tests in `pnpm check`, 39 guard tests, a 15-migration replay with a strict empty diff, 8
  persisted schemas matching, and the shared AC03 fixture passing.
- **Box 1.** GOALS.md now reads "the owner's or an explicitly delegated decision-maker's approval"; its
  technical checks are unchanged. The approval half is in the tracker.
- **Not Done.** The bundled `pnpm backend:test` has not run; the coordinator runs it after applying the
  additive private formula migration to the existing local test stack, and no outcome is assumed here.
  A fresh independent verifier then checks all four boxes, and the branch is integrated locally only
  after that PASS. No status, acceptance or ledger entry is changed. R-1 to R-7 are not decided by
  ARCH-01; account access, payments, external messages, legal and licence positions and device proof
  still need real evidence (AUTH-01).
- **Records.** [Handoff](handoff.md) (CURRENT section) and the
  [owner pack](../../owner-packs/AR-1.md), now a delegated-decision record.

## Earlier addendum, 26 October 2026 (historical)

*Written before G-1 and before the guard review's verdict; its "still open" line is superseded above.*

Reported by the coordinator and not independently verified, except where a review is named. The
sections below are historical reports and keep the state their authors saw; this addendum supersedes
their status lines, including the box table.

- **Commits on `codex/ar1-contract-freeze`, not merged:** `07757a5` (contract snapshot), `22c5386` (P2A
  corrections), `3040ccf` (revision 2 and review copies), `ac71e51` (revision 3), `fcc9aed` (box-4
  fixture files), and `e23e9ae` (SQL-source guard, runner wiring, and the retirement of five files:
  `supabase/contracts.sql`, `contract-validation.sql`, `gym-read-models.sql`, `gym-freezes.sql` and
  `scripts/backend/contracts.ts`; comparison table in [phase2C.md](phase2C.md)). The final low
  corrections ([proposal-final-low-dispositions.md](proposal-final-low-dispositions.md)) are
  uncommitted.
- **Evidence on the branch:** the canonical review and evidence files are copied into
  `docs/evidence/AR-1/`, including [`p2a-review3.json`](../../../evidence/AR-1/p2a-review3.json),
  [`proposal-review3.json`](../../../evidence/AR-1/proposal-review3.json) and
  [`proposal-review4.json`](../../../evidence/AR-1/proposal-review4.json). The existing
  `checkpoint-review2.json` parses to the same JSON as the canonical copy; only formatting differs.
- **Runs:** `pnpm check` passes with 185 tests, and the 39 new backend unit tests pass. The new guarded
  runners pass against an owned local replay stack (API 56321, DB 56322): all 8 persisted schemas match
  the snapshot, and the fixture runs exactly 16 set vectors and 2 session vectors. Missing AC03 IDs, a
  mutant bound and changed expectations each fail, and the originals then pass. All 15 migrations
  replay from empty to head with a strict empty schema diff and a clean lint. The original four backend
  suites pass separately on the 55321 stack. The bundled `pnpm backend:test` has **not** run, because
  the new migration is not applied on 55321. Evidence:
  [`guard-coordinator-gates.md`](../../../evidence/AR-1/guard-coordinator-gates.md),
  [`replay-verification.md`](../../../evidence/AR-1/replay-verification.md),
  [`real-runner-probes.json`](../../../evidence/AR-1/real-runner-probes.json).
- **Reviews:** proposal review 4 independently passed revision 3, with five low findings (N-1 to N-5)
  applied in the final low corrections and no further re-review requested. The independent review of
  the guards is still running.
- **Still open:** the owner's G-1 approval (PENDING); the guard review; merge and a hosted CI run; the
  lane S2 notice at handoff (003 §7); the final goal verifier and integration. No box is claimed done,
  and AR-1 is neither complete nor accepted.

## Revision 3 (26 October 2026)

**Input.** The proposal re-review,
[`docs/evidence/AR-1/proposal-review3.json`](../../../evidence/AR-1/proposal-review3.json). It was first
read in the main checkout at
`/Users/Adya/personals/fitness_app/docs/evidence/AR-1/proposal-review3.json`; when revision 3 was written
it was not yet on this branch (historical).
Its verdict is REVISE: PR-1 to PR-6 resolved, no medium or higher defect, and eight low findings,
R2-1 to R2-8.

**What it did.**
- Checked each finding's cited lines in 003, the run files and the migrations, by reading only.
- Accepted all eight and rejected none. R2-4 takes the lock-free replay fast path with a second locked
  lookup. Each decision, the residual tests and their owners are in
  [proposal-revision3.md](proposal-revision3.md).
- PR-1 to PR-6, F1–F17 and T1–T4 stay resolved; none is reopened. No architecture was added beyond the
  findings.
- **Wrote:** [`003`](../../../architecture/003-architecture-freeze.md) (header, §3.3, §4.3, §4.6, §4.12,
  §8, §9, §11 R-4, §12, §13); this checkpoint; [`test-plan.md`](test-plan.md);
  [`proposal-revision2.md`](proposal-revision2.md) and [`phase1-dispositions.md`](phase1-dispositions.md)
  (revision 3 state notes only); the review link in [`phase2A-corrections.md`](phase2A-corrections.md)'s
  header; and `proposal-revision3.md`, new.

**Did not:** run any command or use git; edit source, SQL, migrations, `status.json`, plan data, GOALS.md
boxes or ACCEPTANCE.md; copy the review into this branch; touch Docker, a database or credentials; take
any external action or delegate.

## Revision 2 (26 October 2026)

**Input.** Checkpoint review 2,
[`docs/evidence/AR-1/checkpoint-review2.json`](../../../evidence/AR-1/checkpoint-review2.json), copied
from `/tmp/fitlog-ar1-checkpoint-review2.json`. Its proposal verdict is REVISE, with findings PR-1 to
PR-6. Its phase 2A findings, P2A-1 to P2A-8, belong to the `packages/domain` owner and are not handled
here.

**What it did.**
- Checked each PR finding against the PRD (§18.1, §21.2, §22.3, AC30), GOALS.md (MB-7, PL-5) and the
  cited source and workflow, by reading only.
- Accepted all six and rejected none. PR-1 and PR-2 are accepted with a mechanism chosen here. Each
  finding's decision, its residual tests and their owners are in
  [proposal-revision2.md](proposal-revision2.md).
- F1–F17 and T1–T4 stay resolved; none is reopened.
- **Wrote:**
  - [`003`](../../../architecture/003-architecture-freeze.md), revised (§3.3, §4.3, §4.5, §4.12, §8,
    §9, §11, §12, §13);
  - this checkpoint;
  - [`test-plan.md`](test-plan.md) and [`phase1-dispositions.md`](phase1-dispositions.md), with
    revision 2 notes;
  - `proposal-revision2.md`, new;
  - the durable review copies [`docs/evidence/AR-1/phase1-review.json`](../../../evidence/AR-1/phase1-review.json)
    and `docs/evidence/AR-1/checkpoint-review2.json`. The coordinator parsed the phase-1 copy, found it
    semantically identical to the original, and removed its staging duplicate.

**Did not:**
- run any command or use git;
- edit source, migrations, the contract CLI, its tests, CI, package fields, `phase2A.md`,
  `status.json`, GOALS.md boxes or ACCEPTANCE.md;
- touch credentials, provision anything, take any external action, or delegate.

## Revision 1 (26 October 2026)

**Input.** The independent phase-1 review, now kept at
[`docs/evidence/AR-1/phase1-review.json`](../../../evidence/AR-1/phase1-review.json). It was first read
at `/tmp/fitlog-ar1-phase1-review.json`, which does not survive a reboot. Its verdict was REVISE, with
findings F1–F17 on 003 and the checkpoint and T1–T4 on the test plan.

**What it did.**
- Checked every finding against the PRD (§§8.2, 12.1–12.2, 16, 18.1, 20.2, 21.1–21.4, 22.1, 22.3) and
  the source, by reading only.
- All 21 findings are accepted. F7, F8, F9, F17 and T3 are accepted with a specific mechanism chosen
  here. Each finding's decision and the file it changed are in
  [phase1-dispositions.md](phase1-dispositions.md).
- **Wrote four files:**
  - [`003`](../../../architecture/003-architecture-freeze.md), revised;
  - this checkpoint;
  - [`test-plan.md`](test-plan.md), revised;
  - `phase1-dispositions.md`, new.

**Instructions from the orchestrator that shaped it.**
- The owner has confirmed a fresh launch: no existing users or data are redirected into the rebuild.
  Historical data is preserved. 003 §7 records this; OW-2 writes the dated DEC-15 entry.
- Routine, reversible engineering is authorised. 003 therefore takes those decisions in its body and
  asks the owner for one approval (G-1) of the completed record. No region, account, vendor, legal,
  price or backup approval is claimed (003 §11, R-1 to R-7).
- Phase 2A is in progress under another worker, who owns `packages/domain` and
  [phase2A.md](phase2A.md). Its guard covers today's schemas only. 003 §8 now says that 0.1.0
  publishes only those schemas, which settles the wording conflict phase2A.md raised.
- Proposed wire-format changes (envelopes, decimal strings, money) stay planned and are not in 0.1.0.

**Did not:**
- run any command or use git (nothing is staged or committed);
- edit source, migrations, `packages/domain`, `phase2A.md`, `status.json`, GOALS.md boxes or
  ACCEPTANCE.md;
- touch credentials, take any external action, or delegate.

## Phase 1: what it did and did not do (as first recorded)

**Wrote** exactly three files:
- [`docs/architecture/003-architecture-freeze.md`](../../../architecture/003-architecture-freeze.md):
  the proposal, owner approval PENDING;
- this checkpoint;
- [`test-plan.md`](test-plan.md): files, commands and mutation checks for boxes 2–4.

**Read** GOALS.md (AR-1 and the cards it unblocks); PRD §§4.1–4.3, 8.2, 10.3, 14.2, 18, 20,
21.1–21.4, 22, 23.1–23.2, 25, 26.1, 26.2 and 27; docs/23; architecture 001 and 002; the QA-1
disposition, handoff and security review; the OW-2 dependency register; `packages/domain`; the 14
migrations (13 in full; `20261019140429_gym_freezes.sql` in part, plus searches); the opening lines of
the four SQL files outside `migrations/`; `supabase/config.toml`; the mobile data layer; and the
backend scripts.

**Did not:**
- run any command;
- use git (nothing is staged or committed; the three files are uncommitted in this worktree);
- change source, migrations, `status.json`, GOALS.md boxes or ACCEPTANCE.md;
- touch credentials or start services;
- delegate to any agent.

Nothing in 003 has been verified by execution. Its "Implemented" entries cite code as read, and QA-1's
recorded runs where noted.

## Done-when boxes

*Historical, as of revision 3. The dated addendum at the top records the later state; no box is
claimed done.*

| Box | State | Evidence or gap |
|---|---|---|
| 003 covers every §21.1 component and §21.3 rule, and the owner's approval is in the tracker | **Drafted, revised three times; approval PENDING** | Revision 2 corrected PR-1 to PR-6, and the re-review found them resolved. Revision 3 corrected its eight low findings (R2-1 to R2-8); a re-check of the revision-3 lines has not run. 003 §3 covers all 11 components. §4, §4.15 and §4.16 cover every §21.3 rule, including the two the review found missing: exercise semantics and no staff health API. §5 maps all 16 domain rows with the PRD's minimum operations. No tracker entry exists, and only the owner can add it (G-1) |
| `packages/domain` exports a contract version; a test fails on an unversioned schema change, seen once | **In progress, not verified here** | At `9f148c1` nothing exported a version. Phase 2A adds `CONTRACT_VERSION = '0.1.0'` through `packages/domain/src/index.ts:5` and records M1.1 failing once, then passing ([phase2A.md](phase2A.md)). Its snapshot is committed in `07757a5` and the P2A-1 to P2A-8 corrections in `22c5386`. The coordinator reports 179 tests and the CI-baseline probes passing locally, and an independent code reading of the corrections passed ([`p2a-review3.json`](../../../evidence/AR-1/p2a-review3.json), first read in the main checkout). Not merged, and no hosted CI run proves it. Remaining: merging, so that the trusted base carries the snapshot history; the database half (`verify-contracts.mjs`, M1.5); and the goal verifier's own check |
| Migrations replay from empty to head; schema diff against the replay is empty | Not started | 002 says a shadow replay of 14 migrations once showed no changes. That is a historical claim, not evidence for this box. Plan: test-plan §3 |
| One shared AC03 vector runs in TypeScript and SQL from one file | **In progress, not done** | Phase 2B drafted the fixture, its TypeScript test, `encoding.ts`, the `20261025234317_training_formula_v1.sql` body and the SQL check, all untracked ([phase2B.md](phase2B.md)). Its record shows the TypeScript side passing; the SQL has never run, and the runner `verify-fixtures.mjs` does not exist. Not verified here. Plan: test-plan §4 |

## Findings

All are from reading. Each names the record section that resolves it and the goal that owns it.
Revision 1 corrected F-1, F-3, F-5, F-6 and F-10 in place, and updated F-2, F-4, F-7 and F-9 to match
the revised decisions. Their phase-1 wording is kept in
[phase1-dispositions.md](phase1-dispositions.md#checkpoint-findings-as-first-written). F-15 to F-20 are
new in revision 1.

| # | Finding | Evidence | 003 | Owner |
|---|---|---|---|---|
| F-1 | At `9f148c1` no contract version was exported, and the "versioned Zod contracts" in 002 had no version anywhere. Phase 2A now adds 0.1.0, committed in `07757a5`, not merged | `packages/domain/src/index.ts` at `9f148c1` (lines 1-4); [phase2A.md](phase2A.md) | §8 | AR-1 |
| F-2 | The JSON Schema generator writes `supabase/contracts.sql`, which nothing executes; the database validates against the copy inside a 17 October migration. Three more draft SQL files sit outside `migrations/` (QA-1 F-8h) | `scripts/backend/contracts.ts:8`; `20261017164336_validated_contracts.sql:3-13` | §7 | AR-1 |
| F-3 | No success or error envelope and no request ID. SQLSTATEs are mixed: `22023` covers both shape (400) and field rules (422); "Workout not found" raises `42501` (403) where the PRD wants 404. A revoked session gives `42501` in member and gym commands and `22023` in freeze commands, never 401. Already mapped: gym commands' `P0002` to `PT404`, and freezes' `40001` to `PT409`. Not pinned by any test: what member and gym commands' `40001`, `42501` and `22023` become over HTTP | `20261019122347_function_lint_cleanup.sql:77`; `20261017161031_member_core.sql:24-31`; `20261019140839_freeze_preview_binding.sql:16`; `20261019120824_gym_api_errors.sql:6`; `20261019140429_gym_freezes.sql:158,170` | §4.4, §4.5 | MB-1, G16.api |
| F-4 | Request hashes are `md5` with different scopes: member commands hash `{entity, kind, base, payload}`; gym and freeze commands hash the whole command, ID included. No contract version is part of either, and 003 now keeps it out (§4.6) | `20261017161225_member_operations.sql:20`; `20261019121035_gym_read_models.sql:5`; `20261019140839_freeze_preview_binding.sql:14` | §4.6 | MB-3, G16.api |
| F-5 | Meals, body entries, goals and targets are written straight to tables with no operation ID or replay. Meals, body entries and goals take a client-supplied `revision`. `nutrition_targets` has no revision column and no created or updated time. Updates on all four have no revision check | `apps/mobile/src/data/api.ts:55-78` (targets at `:76`); `20261017161031_member_core.sql:123-127,157-160` | §4.2, §4.7 | MB-5, MB-6 |
| F-6 | No cursor pagination. The member app downloads every own row in 500-row offset pages. The gym member list uses 50-row offsets with an exact count; the visit list uses 50-row offsets | `apps/mobile/src/data/api.ts:7-18`; `apps/mobile/src/data/gym-api.ts:38`; `apps/mobile/src/features/gym/GymHomeScreens.tsx:37` | §4.8 | MB-3, G16.api, G17.api |
| F-7 | Decimals travel as JSON numbers and `numeric` columns have no declared scale, while the PRD's own example sends `"80"` as a string | `packages/domain/src/models.ts:26,41,66-69` | §4.9 (planned) | MB-3, MB-5, MB-6, G17.api |
| F-8 | The SQL half of box 4 needs new formula functions: no SQL volume or e1RM exists | Searched all 14 migrations | §4.13 | AR-1 (migration in test-plan §4) |
| F-9 | Storage policies let a member sign their own objects with any lifetime, which conflicts with the 5- and 10-minute URL rules. Signed URLs alone cannot give the immediate revocation PRD §22.1 needs for gym documents | `20261017161031_member_core.sql:169-174` | §3.4 | MB-6, G17.api |
| F-10 | The deletion graph is undefined. Every actor reference and `gym_members.linked_user_id` point at `profiles(id)` with no `ON DELETE` rule, so deleting an auth user who has any personal row or staff action fails. PRD §21.2 requires `SET NULL` **only on the gym link**. Actor references must not be nulled, because the rows are append-only: 003 points them at a retained actor key with `RESTRICT` | `20261017164708_gym_operations.sql:9,22,42,47,52,57,62,67,72,83,88,91`; `20261017161031_member_core.sql:7` | §3.3 | MB-7, G17.api |
| F-11 | There are no jobs, scheduler, webhooks, AI gateway, subscription or messaging adapters, or monitoring. That is expected at this stage; each has a named owner | — | §3.5–3.11 | G16.api, AI-3, G15.api, G18.api, G20.api, PL-9 |
| F-12 | `complete_onboarding` has no version suffix, and member commands carry an `ownerId` that the server only compares with the session | `20261019122347_function_lint_cleanup.sql:32` | §3.7, §4.6 | MB-1, MB-3 |
| F-13 | The client calls `refresh_schedules_v1` on every sync, which walks about 366 days per plan day (QA-1 F-8f) | `20261017163754_scheduling_and_history.sql:19-27` | §3.6 | MB-2 |
| F-14 | Undo windows differ: the server accepts a restore for 10 seconds while the PRD offers a five-second undo. Not a contradiction if the extra time is deliberate tolerance, but the contract must state it | `20261017164212_workout_correction_commands.sql:43,51`; PRD §4.3 | — | MB-3 |
| F-15 | Every member operation on an existing session, each `set.commit` included, writes the whole session with all its sets to `workout_revisions` (QA-1 F-8e). Phase 1 routed this to a rule about outcome rows, which fixed nothing | `20261017164212_workout_correction_commands.sql:19-22` | §4.7 | MB-4, MB-3 |
| F-16 | A linked member can read the gym's staff `notes` and `tags`, both through `register_read` and through `gym_account_v1`'s whole-row `to_jsonb(m)` (QA-1 F-2, F-8b) | `20261017164708_gym_operations.sql:108`; `20261019121035_gym_read_models.sql:136-137` | §6 | G18.api, G17.api |
| F-17 | Gym and freeze command results carry balances and freeze projections, so a stored outcome holds derived state. Revision 2: `gym_command_core` replays before its per-kind checks, so a demoted manager can replay their own earlier balance today. `freeze_action` checks per-kind permission first, and G17.api keeps that order until outcomes are trimmed | `20261019121035_gym_read_models.sql:60,80,82,95,117`; `20261019140839_freeze_preview_binding.sql:70`; replay at `20261019121035_gym_read_models.sql:15` before `:42,47,62,84,97`; `20261019140839_freeze_preview_binding.sql:22` before `:24-27` | §4.3, §4.4 | G17.api |
| F-18 | Only four of the eight stored contracts are asserted on write (`days`, `instances`, `nutrients`, `measurements`) | `20261017164445_contract_trigger_dispatch.sql:5-17` | §8 | MB-2, MB-3, MB-5, MB-6 |
| F-19 | Created and updated times are missing on most member tables, and mutable gym tables have no updated time (PRD §21.2) | `20261017161031_member_core.sql:69-144` | §3.3 | MB-3, MB-5, MB-6, G17.api |
| F-20 | `sessionSummary` reports volume `0` for a session with no eligible set, where PRD §8.2 says no invented kg volume (`null`) | `packages/domain/src/calculations.ts:33-36` | §4.9, §4.13 | MB-4 |

## Remaining AR-1 work

1. **Owner: one dated approval (G-1)** of the completed 003 in the tracker decision log, or approval
   with stated exceptions. **Done 26 October 2026 by delegation (ARCH-01, under AUTH-01); the rest of
   this list is historical where it conflicts with the current-state section.** Nothing else in AR-1
   needs the owner. The owner-reserved items R-1 to R-7
   (003 §11) stay with their own goals and are not part of AR-1.
2. **Phase 2** (test-plan §§0–5), in order. It does not wait for G-1:
   - preflight;
   - box 2, database half: `verify-contracts.mjs` and M1.5 (phase 2A did the local half);
   - the SQL-source and migration guards. Compare the four SQL files with the migrations, then delete
     them and record that lane S2 was notified. Then run M2.1–M2.4, including the fail-closed checks
     on `FITLOG_BASE_REF`;
   - box 4: the AC03 fixture file with the no-eligible-volume vector, `encoding.ts`, the formula
     migration, and the TypeScript and SQL runners (M4.1–M4.4). Phase 2B drafted the files; the SQL
     runner, a first SQL run and most of M4.1–M4.4 remain ([phase2B.md](phase2B.md));
   - box 3: the replay and diff commands with the structural drift probe;
   - the standard gates.
3. **Handoff** at `docs/plan/runs/AR-1/handoff.md`, mapping each box to its evidence (test-plan §6),
   then a short re-check of the lines revision 3 changed. Then the goal verifier. AR-1 is
   Done only after verification and integration (docs/23 §8).
4. **Requests to other lanes**, to go in the handoff:
   - **S2:** notice that phase 2 deletes `gym-read-models.sql` and `gym-freezes.sql` after the
     comparison table. Both are unexecuted drafts and stay in Git history;
   - **PL-1:** add the replay and diff commands to the backend CI job, and fetch the trusted base. Set
     `FITLOG_BASE_REF` from the CI event, never from files in the change, and use the same commit as
     `FITLOG_CONTRACT_BASELINE` (test-plan §2);
   - **`packages/domain` owner:** failing closed in CI is now a **decision** (003 §8), not a request
     to consider. The correction (P2A-1 to P2A-8) is committed in `22c5386` and independently
     code-read, but not merged. This worktree's `mobile-ci.yml` now sets the trusted baseline
     (`:19-44`). The correction still needs a merge, so that the trusted base carries the snapshot
     history, and a hosted CI run that passes with the trusted base and fails without it. Also add the
     `.gitattributes` rule from phase2A.md limitation 3;
   - **MB-1:** confirm the §12 items in 003 that need a running PostgREST, including the
     rejected-request counting check (PR-2) with revision 3's 121st-request rule, the replay
     `pg_locks` check and the concurrency sub-check (R2-4). Build the lock-free replay fast path with
     its second locked lookup, and count the minute window before the day window (003 §4.3, §4.12);
   - **MB-7 and PL-5:** build and prove the external tombstone register, its fail-closed append and
     the restore import and purge (003 §3.3, §12; PR-1). Also create the actor row in onboarding's
     transaction (PR-3). Revision 3 adds: erasure step 1 also sets `deletion_pending` and bans the auth
     user, and an erased actor cannot onboard again (R2-1); register retention is anchored to the later
     of the append and the `erased_at` commit (R2-2); the runbook keeps the restored project quiet
     until the check passes, imports a cutover delta, and purges object copies by tombstoned prefix
     (R2-3); support and system actor rows, and an erasure job that refuses them (R2-7). The final low
     corrections add: drop `gym_freezes_decided_by_fkey` when `decided_by` moves to the actor key, and
     test step 5 with a manager who decided a freeze (N-1); carry pending erasure requests across a
     restore cutover, or record and reconcile the lost in-RPO ones (N-2, PL-5 drill); start step 3
     only after the upload-URL lifetime and delete by `<owner id>/` prefix, with a test that no object
     remains (N-3) (003 §3.3, §12 (6)–(8)). The store's account, vendor and retention stay
     owner-reserved (R-2, R-3, R-4), and object copies are R-7;
   - **G17.api:** keep `freeze_action`'s per-kind check before both replay lookups, and trim gym and
     freeze outcomes with the replay projection (003 §4.3; PR-4). Whichever goal first ships
     `operation_result_v1` for gym scope returns only the §4.4 projection, and tests that a demoted
     manager gets only identifiers and status for a freeze approve stored before the trim (R2-5);
   - **OW-2:** write the dated DEC-15 entry for the owner-confirmed fresh launch.

## Approval

| Gate | Decision asked of the owner | State |
|---|---|---|
| G-1 | Approve 003 as a dated tracker decision-log entry, or approve it with stated exceptions | **Approved by delegation, 26 October 2026, no exceptions**: [ARCH-01](../../../09-PROJECT-TRACKER.md#decision-log), by Codex as the owner's explicitly delegated decision-maker (AUTH-01). Not a personal owner review. *Historical: PENDING until then* |

The earlier gates G-2 and G-4 to G-10 are now engineering decisions in 003's body (003 §11). G-3, the
region, is owner-reserved item R-1. OW-3 still opens every account, and nothing has been provisioned.
Revision 2 adds no gate. The tombstone store's account, vendor and retention fall under the existing
R-2, R-3 and R-4. Revision 3 adds none either: the register's retention bound is R-4, and whether
object copies exist is R-7.

## Resume

A new session starts from 003, [phase2A.md](phase2A.md) and test-plan §0. G-1 does not block it.
- A non-empty diff, a CLI failure or an unmet preflight expectation: save the output to
  `docs/evidence/AR-1/` and report it to the orchestrator.
- A local `supabase db reset`: only this needs the owner's confirmation first. Never run one without
  it.
