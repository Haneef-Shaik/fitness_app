# Handoff — AR-1 · Freeze the architecture and the versioned data contract        attempt 1 · `codex/ar1-contract-freeze` · `e23e9ae`

## Coordinator gate update — 26 October 2026

After the delegated architecture decision, the coordinator applied only the sole pending additive
private-formula migration to the standard local development stack (no reset or user-row changes).
The complete current `rtk proxy pnpm backend:test` command now passes in one run on55321:
39guardtests, sourceguard, all4integration/isolation suites,8persistedschemas andexactsharedfixture.
[Actual bundled output](../../../evidence/AR-1/bundled-backend.log),
[scope and commands](../../../evidence/AR-1/bundled-backend-gate.md).
This closes the earlier split-target/full-bundle limitation; previous statements are historical.

## CURRENT — 26 October 2026 (read this first)

This section supersedes the **State** row, the Box 1 row and the review-trail rows below, which are kept
as written and are historical.

- **Both independent reviews passed.** [Proposal review 4](../../../evidence/AR-1/proposal-review4.json)
  passed revision 3, and its five low findings N-1 to N-5 are applied
  ([proposal-final-low-dispositions.md](proposal-final-low-dispositions.md)). The
  [guard review](../../../evidence/AR-1/guard-review.json) passed.
- **G-1 is approved by delegation.** Codex, acting as the owner's explicitly delegated decision-maker,
  approved 003 (revision 3 with N-1 to N-5) with no exceptions, in
  [tracker row ARCH-01](../../../09-PROJECT-TRACKER.md#decision-log). AUTH-01 records the owner's
  delegation in their own words. The owner did not personally review or sign 003. R-1 to R-7 are not
  decided by it.
- **Box 1.** Coverage was already met; the approval half is now in the tracker decision log. The
  GOALS.md wording of box 1 now names "the owner's or an explicitly delegated decision-maker's
  approval". Its technical checks are unchanged.
- **Boxes 2–4.** Evidence as below: 185 tests in `pnpm check`, 39 guard tests, a 15-migration replay
  with a strict empty diff, 8 persisted schemas matching, and the shared AC03 fixture passing.
- **Not Done, not integrated.** The bundled `pnpm backend:test` has not run; the coordinator runs it
  after applying the additive private formula migration to the existing local test stack, and no
  outcome is assumed here. A fresh independent verifier then checks all four boxes, and the branch is
  integrated locally only after that PASS. No status, acceptance or ledger entry has changed.

| Field | Value |
|---|---|
| **State** | *Historical; see CURRENT above.* **READY FOR REVIEW. Not approved, not verified, not merged, not Done.** Independent proposal review 4 and the independent guard review are running; neither verdict is available. The owner's G-1 approval is pending |
| Date | 26 October 2026 |
| Worktree | `/Users/Adya/.codex/worktrees/fitlog-ar1/fitness_app`, branch `codex/ar1-contract-freeze`, head `e23e9ae` at session start |
| Commits on the branch | `07757a5` contract snapshot (phase 2A) · `22c5386` CI fail-closed corrections P2A-1 to P2A-8 · `3040ccf` proposal revision 2 and durable review copies · `ac71e51` proposal revision 3 docs (R2-1 to R2-8) · `fcc9aed` shared AC03 fixture, TypeScript and SQL (phase 2B) · `e23e9ae` SQL-source guard and database runners (phase 2C) |
| How this file was written | A docs-only worker read the card, 003, the phase records and `docs/evidence/AR-1/`. It wrote only this file and [the owner pack](../../owner-packs/AR-1.md). It ran no shell, git, database or Docker command. **Every result below is quoted from the linked record; none was re-run here.** Where a record does not give the exact command line, this file says so |
| Not changed | `GOALS.md`, `ACCEPTANCE.md`, `status.json`, the board, the tracker, 003 and every earlier run or evidence file |

**Outcome claimed.** Boxes 2, 3 and 4 have executed local evidence on the goal branch. Box 1's record is
complete through revision 3, but its owner approval is not in the tracker, so box 1 is **not met** and
AR-1 is **not complete**.

## Done when

| Box (verbatim) | Met | Evidence (detail in the sections below) |
|---|---|---|
| `docs/architecture/003-architecture-freeze.md` covers every PRD §21.1 component and §21.3 rule, and the owner's approval is in the tracker decision log | **No.** Coverage: yes. Approval: pending | 003 §3.1–§3.11 (the eleven §21.1 components) and §4.1–§4.16 with the rule table §4.15 (§21.3). Three revisions answer three independent reviews. Review 4 of revision 3 is running. The tracker decision log ends at PLAN-02 (2026-10-25) and holds no G-1 entry. See [Box 1](#box-1) |
| `packages/domain` exports a contract version, and a test fails when a schema changes without a version bump (seen to fail once) | Yes (local) | `packages/domain/src/contract.ts:8` `export const CONTRACT_VERSION = '0.1.0';`, re-exported at `src/index.ts:5`. M1.1 failed with `Contract schemas changed without a version bump…`. The database half passes, and its mutant snapshot M1.5 fails. See [Box 2](#box-2) |
| All migrations replay from empty to head, and a schema diff against the replay is empty (command and result in the handoff) | Yes (isolated local project) | 15 migrations and 2 seeds replayed. The diff over `public,private,storage` returned `No schema changes found` with `"diff":""`, lint was clean, and a structural drift probe was detected. See [Box 3](#box-3) |
| One shared fixture vector (AC03 volume and e1RM) runs in both the TypeScript tests and a SQL test, from one file | Yes (local) | `packages/domain/fixtures/ac03-training.v1.json`, SHA-256 `bc0672b5…1877`. TypeScript: `fixtures.test.ts` in `pnpm check`. SQL: `verify-fixtures.mjs`, run against the owned stack: `16 set vectors and 2 session vectors passed in SQL`. Mutants fail in both languages. See [Box 4](#box-4) |

## Box 1

- **Record.** [003](../../../architecture/003-architecture-freeze.md), revision 3. Its header says
  "Proposal. Owner approval PENDING".
- **PRD §21.1.** §2 is the platform table. §3.1 to §3.11 cover mobile clients, the versioned API, the
  relational store (with the deletion graph and the external tombstone register), private object
  storage, the worker and jobs, the scheduler, identity, and the subscription, AI and messaging adapters,
  then monitoring.
- **PRD §21.3.** §4.1 to §4.16, with a rule-by-rule status in §4.15 and the domain map in §5. §21.2 and
  §22.1 are in §3.3 and §6, §21.4 is in §7, and the SP3 rule is in §8.
- **Review trail.**

  | Review | Verdict | Answered by |
  |---|---|---|
  | [phase1-review.json](../../../evidence/AR-1/phase1-review.json) | F1–F17, T1–T4 | Revision 1, [phase1-dispositions.md](phase1-dispositions.md) |
  | [checkpoint-review2.json](../../../evidence/AR-1/checkpoint-review2.json) | PR-1 to PR-6 | Revision 2, [proposal-revision2.md](proposal-revision2.md), `3040ccf` |
  | [proposal-review3.json](../../../evidence/AR-1/proposal-review3.json) | REVISE: PR-1 to PR-6 resolved, no medium or higher defect, eight low findings R2-1 to R2-8 | Revision 3, [proposal-revision3.md](proposal-revision3.md): all eight accepted, `ac71e51` |
  | Proposal review 4 (re-check of revision 3) | **Running, no verdict** | — |

- **The checkpoint-review2 copy.** The coordinator reports that the branch copy differs from `main`'s
  copy only in whitespace. The parsed data is equal, so there is no semantic conflict. This file did not
  re-diff them.
- **Approval.** The [tracker decision log](../../../09-PROJECT-TRACKER.md#decision-log) holds no AR-1 or
  G-1 row. The [owner pack](../../owner-packs/AR-1.md) asks for it and drafts the row.

## Box 2

**Local half (phase 2A, [phase2A.md](phase2A.md)).**
- Snapshot `packages/domain/contracts/0.1.0.json`, SHA-256
  `74914ca920f1f9c97957e74ea8b1bf5eea62dfbd26f7c5c80ba9cf91cdcc88e4`, recorded in `manifest.json`.
- `rtk proxy pnpm --filter @fitlog/domain test` (GREEN at the time): `ℹ tests 21`, `ℹ pass 21`.
- **Seen to fail (M1.1).** `src/models.ts:4` was changed from `max(100)` to `max(101)` with no bump. The
  run gave 20 pass and 1 fail: `✖ current schemas equal the snapshot for CONTRACT_VERSION` with
  `Contract schemas changed without a version bump: bump CONTRACT_VERSION and run pnpm --filter @fitlog/domain contract:snapshot (changed: …)`.
  After the restore, 21 of 21 passed.
- M1.2 (a snapshot byte edit), M1.3 (`0.1.1` with no snapshot) and M1.4 (a second `contract:snapshot`)
  each failed as designed (phase2A.md, mutation table).
- **Real Git history** ([coordinator-checkpoint-07757a5.md](../../../evidence/AR-1/coordinator-checkpoint-07757a5.md)).
  In a shared clone at `07757a5`, a snapshot and its manifest hash were rewritten together. The domain
  test exited 1 with `differs from the baseline`, and the restore exited 0.
- **CI fails closed** (`22c5386`; [ci-correction-probes.json](../../../evidence/AR-1/ci-correction-probes.json)).
  - The domain probes exit 1 for a missing, blank, all-zero or unresolvable baseline, and exit 0 for the
    trusted one.
  - The workflow-validation probes exit 1 for a missing, all-zero or malformed value, and exit 0 for the
    trusted one.
  - [p2a-review3.json](../../../evidence/AR-1/p2a-review3.json) passed P2A-1 to P2A-8 by code reading,
    on condition that the domain test and typecheck exit 0. The coordinator's `pnpm check` met that
    condition: exit 0 with 179 tests then ([phase2A-coordinator-corrections.md](../../../evidence/AR-1/phase2A-coordinator-corrections.md)),
    and 185 now.

**Database half (phase 2C runner).**
- [real-runners.log](../../../evidence/AR-1/real-runners.log), line 1:
  `private.contracts matches the persisted section of contract 0.1.0 (packages/domain/contracts/0.1.0.json, sha256 74914ca9…88e4, as manifest.json records): 8 schemas (days, exercise, food, goal, instances, measurements, nutrients, set) in supabase_db_fitlog_ar1_replay_20261026 at http://127.0.0.1:56321`.
- **M1.5** ([real-runner-probes.json](../../../evidence/AR-1/real-runner-probes.json), `M1.5-snapshot-bound`, exit 1).
  It reports the hash mismatch (`… has sha256 0663a558…, but packages/domain/contracts/manifest.json records 74914ca9… for 0.1.0`)
  and the value itself: `persisted.set differs at /properties/distanceMetres/anyOf/0/maximum: database 1000000, snapshot 1000001`.
- An earlier psql comparison on the replay database agrees:
  [persisted-compare.json](../../../evidence/AR-1/persisted-compare.json), `"count": 8, "equal": true`.

**Limits.**
- No hosted CI run has shown the baseline guard passing or failing (PL-1).
- The snapshot history is not on `main` yet. Until the merge, the `main` fork-point baseline has nothing to
  compare (phase2A.md, limitation 1).
- JSON Schema cannot express `.refine()`. The inventory test pins every refine (limitation 4).
- The `.gitattributes` rule from limitation 3 is not added.
- p2a-review3 F1 is deferred to MB-6 (below).

## Box 3

Run by the coordinator from this worktree with Supabase CLI 2.121.0. Each command was prefixed
`rtk proxy` ([replay-verification.md](../../../evidence/AR-1/replay-verification.md)):

```text
pnpm exec supabase --workdir /tmp/fitlog-ar1-replay-20261026 db start
pnpm exec supabase --workdir /tmp/fitlog-ar1-replay-20261026 db diff --local --schema public,private,storage --strict-coverage
pnpm exec supabase --workdir /tmp/fitlog-ar1-replay-20261026 db lint --local --schema public,private --level warning
```

| Step | Result (all exit 0) |
|---|---|
| Start ([replay-start.log](../../../evidence/AR-1/replay-start.log)) | 15 `Applying migration …` lines, from `20261017161031_member_core.sql` to `20261025234317_training_formula_v1.sql`, then `Seeding data from supabase/seed.sql…` and `…development-catalogue.sql…`, then `{"status":"started","message":"Started local database."}`. `supabase_migrations.schema_migrations` returned 15 |
| Diff ([replay-final-diff.log](../../../evidence/AR-1/replay-final-diff.log)) | `No schema changes found` and `{"diff":"","file":null,"files":[],"schemas":["public","private","storage"],"engine":"pg-delta","dropStatements":[],"message":"Diff complete."}` |
| Lint ([replay-lint.log](../../../evidence/AR-1/replay-lint.log)) | `No schema errors found` and `{"results":[],"message":"db lint"}` |
| Drift probe ([replay-drift-probe.json](../../../evidence/AR-1/replay-drift-probe.json)) | A scratch-only `29991231235959_ar1_drift_probe.sql` gave `"diff": "DROP TABLE \"public\".\"ar1_drift_probe\";\n"`, with `expectedDriftDetected: true` and `probeRemoved: true` |
| Inputs | [replayed-migrations.json](../../../evidence/AR-1/replayed-migrations.json) (15 names and SHA-256 values). Image `public.ecr.aws/supabase/postgres@sha256:b15d862126dd2dac02da524696ccfde2dcce2ceaee0a58973b2727befe492706` ([postgres-image-digests.json](../../../evidence/AR-1/postgres-image-digests.json)) |
| Source guard ([guard-coordinator-gates.md](../../../evidence/AR-1/guard-coordinator-gates.md)) | `check-sql-sources.mjs` passes: 15 migrations, 14 unchanged against the `main` merge-base `9f148c13e093`, 1 new, 2 configured seeds, no stray SQL |

**Limits.**
- This is an isolated scratch project, `/tmp/fitlog-ar1-replay-20261026` (`project_id`
  `fitlog_ar1_replay_20261026`, ports 563xx). It is not the 55321 stack and not CI.
- The diff covers `public,private,storage`, and lint covers `public,private`. The drift probe diffed
  `public,private` only.
- PL-1 still has to run replay and diff in CI.
- No existing project was reset or stopped.

## Box 4

- **One file.** `packages/domain/fixtures/ac03-training.v1.json`, SHA-256
  `bc0672b5d26aa93b1e9be41219a0b20db1997913a37d6a9a0b2aac01ed1e1877`. It holds 16 set vectors, 2 session
  vectors (`ac03-session` and `ac03-session-with-deleted-set`) and 1 pending MB-4 session vector.
- **TypeScript.** `packages/domain/src/fixtures.test.ts` runs in `pnpm check`. It calls the real
  `setVolume`, `epley` and `sessionSummary`. AC03 gives session volume `"1920"` with 3 working sets, and
  e1RM `101.333333` for `ac03-working-80x8`. Every run prints `fixture sha256 bc0672b5…1877`
  ([phase2B.md](phase2B.md); [ts-mutations.json](../../../evidence/AR-1/ts-mutations.json), baseline).
- **SQL.**
  - `scripts/backend/sql/training-fixtures.sql` runs inside `begin … rollback` over the three private
    functions in `20261025234317_training_formula_v1.sql`. They are immutable and security invoker, with
    execute revoked from `public`, `anon` and `authenticated`.
  - `scripts/backend/verify-fixtures.mjs` passes the exact file bytes through `-v fixture=…`, sends the
    SQL on stdin, and fails unless the SQL hash notice equals the file's SHA-256.
  - The runner is chained into `backend:test` (`package.json:18`, read in this session).
- **Real run.** [real-runners.log](../../../evidence/AR-1/real-runners.log), line 2:
  `training.v1 SQL check passed for packages/domain/fixtures/ac03-training.v1.json (sha256 bc0672b5…1877, received unchanged): training.v1: 16 set vectors and 2 session vectors passed in SQL; 1 pending MB-4 session vectors not asserted […in supabase_db_fitlog_ar1_replay_20261026 at http://127.0.0.1:56321]`.
- **Earlier SQL runs.**
  - The formula-only container ([fixture-sql-gates.md](../../../evidence/AR-1/fixture-sql-gates.md)):
    RED exit 3 for the missing `private.training_set_eligible_v1`, then GREEN.
  - The full replay ([replay-fixture.log](../../../evidence/AR-1/replay-fixture.log)): the same hash
    notice and GREEN line, then `ROLLBACK`.

**Limits.**
- SQL proves the set-level formulas. Its session values (1920 and 3) are a `sum()` and a `count()`
  composed in the check per PRD §8.2, not a production SQL aggregate (fixture-review R3).
- The no-eligible-session `null` is asserted by neither runner (MB-4, F-20).
- No session best e1RM exists.
- `verify-fixtures.mjs` has not run against 55321.

## Acceptance evidence

| Ledger row | Run | Result | Evidence | Row written here? |
|---|---|---|---|---|
| DEC-02 (proved by AR-1, OW-2, OW-3) | — | AR-1 is not the last prover | Box 1 above | No |
| PD-02 (proved by AR-1, PL-10, QA-12, G23) | Local, 26 Oct 2026 | Early-prover evidence only: versioned interfaces and the shared fixture | Boxes 2 and 4 | No |
| AC03 (owned by MB-4, SC-3, QA-3 and QA-4, per fixture-review) | Local, 26 Oct 2026 | Formula vectors only | Box 4 | No |

## Gates

| Gate | Command | Result | Source |
|---|---|---|---|
| Standard check | `rtk proxy pnpm check` | Exit 0. 185 tests: domain 37, mobile `Tests: 126 passed, 126 total`, plan 22. Server and client `tsc`, `eslint . --max-warnings=0`, design rules, and `plan.json and board.html match GOALS.md` | [fixture-sql-gates.md](../../../evidence/AR-1/fixture-sql-gates.md) (coordinator); [phase2C.md](phase2C.md) addendum, command 10, after the wiring |
| Backend unit tests (39 = 18 guard + 13 contracts + 8 fixtures) | `rtk proxy node --test scripts/backend/*.test.mjs` | `# tests 39`, `# pass 39`, `# fail 0` | phase2C.md addendum, command 9; the coordinator independently passed 39 of 39 ([guard-coordinator-gates.md](../../../evidence/AR-1/guard-coordinator-gates.md)) |
| SQL-source guard | `check-sql-sources.mjs` (the record does not give the exact invocation) | Pass: 15 migrations, 14 unchanged, 1 new, 2 seeds, no stray SQL | guard-coordinator-gates.md |
| Original four backend suites, **previous cycle** | `pnpm backend:test` with the four-suite line, on 55321 | The four `… passed` lines | [baseline-backend.log](../../../evidence/AR-1/baseline-backend.log). Its header shows the four-suite script, run in `/Users/Adya/personals/fitness_app`. The formula migration was not applied to 55321 |
| New database runners | Exported `main()` of `verify-contracts.mjs` and `verify-fixtures.mjs`, given only `{projectDir:'/tmp/fitlog-ar1-replay-20261026', expectedApiUrl:'http://127.0.0.1:56321'}` | Both pass | real-runners.log. The real `supabase status`, `docker exec` and psql ran. No status was faked, and no keys appear in the evidence |
| **Bundled `pnpm backend:test`** (the current eight-step line) | — | **NOT RUN. No bundled PASS is claimed** | 55321 has not received `20261025234317_training_formula_v1.sql`, so the run would stop at `verify-fixtures.mjs`. Applying it there was outside this cycle |
| Native JavaScript export | `expo export`, Android and iOS | PASS at `07757a5` | coordinator-checkpoint-07757a5.md. The coordinator states that later changes touch only Node-side tooling, tests, CI and docs. Not re-run at `e23e9ae` |

**The split, plainly.** The existing behaviour has regression evidence from the four suites on 55321
(previous cycle). The new SQL tools have evidence on the fully migrated owned stack (API 56321,
DB 56322). No single run of the current `backend:test` line exists.

## Inherited and used

| From | Claim | Held? |
|---|---|---|
| QA-1 (Done; local `main` `9f148c1`) | Foundation, 14 migrations, four backend suites | Yes. The suites passed again on 55321 (baseline-backend.log), and `check-sql-sources.mjs` finds the 14 migrations unchanged against the merge-base |
| Phase 2A acceptance ([phase2A-acceptance.md](../../../evidence/AR-1/phase2A-acceptance.md)) | Code conditions left open: the review's domain test and typecheck condition, the AC03 fixture with real TypeScript and SQL runs, the persisted-contract comparison, and the replay and diff | **All fulfilled** (boxes 2–4 above). Still open: the proposal re-check (review 4), G-1, final all-box verification and integration |
| Fixture review ([fixture-review.json](../../../evidence/AR-1/fixture-review.json), checkpoint-scope PASS) | R1 to R8 | **R1** recorded (fixture-sql-gates.md; phase2B addendum). **R2**: runner wired, with an exact-bytes hash. **R4**: TypeScript wrong-formula and null-to-zero mutants, run in a scratch copy with the source never mutated. **R5**: the AC03 IDs are required, and the missing-ID probes fail. R3 and R6 are worded in the records. R7 and R8 are deferred (below) |

## Mutation checks

| Guard | Break | Failure seen (record) |
|---|---|---|
| Contract version | M1.1–M1.4 | Above (phase2A.md) |
| Contract history | Snapshot and manifest rewritten together, in a real clone | `differs from the baseline` (coordinator-checkpoint-07757a5.md) |
| CI baseline | Missing, blank, all-zero, unresolvable and malformed values | Exit 1 each; trusted exit 0 (ci-correction-probes.json) |
| Persisted contracts | M1.5, a copied snapshot with one bound changed | The hash line, plus `persisted.set differs at /properties/distanceMetres/anyOf/0/maximum…` (real-runner-probes.json) |
| SQL-source guard and local target (G1–G4) | Hash compare off, CI detection off, fixture hash compare off, URL check loosened. Breaks were made in untracked files and reverted by exact replacement | Named tests failed, e.g. G2: `Missing expected exception: {"CI":"true"}` ([phase2C.md](phase2C.md)). M2.1–M2.4 ran as scratch-repository tests 8, 2, 13 and 12/17, not as literal commands on this repository |
| TypeScript fixture | Formula `/30` → `/31`; `bodyweight-no-load-12` volume `null` → `"0"`; M4.3 | `ac03-working-80x8 e1rmKg: expected 101.333333, got 100.645161` and six more; `no-eligible-session: bodyweight-no-load-12 must contribute no volume`; restored 6 of 6 (ts-mutations.json; phase2B.md) |
| SQL fixture, formula container | Wrong expected value, null to zero, `/31`, missing variable, `PUBLIC` grant | Each failed; the restores passed (fixture-sql-gates.md; [fixture-sql-probes.json](../../../evidence/AR-1/fixture-sql-probes.json)) |
| SQL fixture, real runner | M4.3, M4.4, missing AC03 set, missing AC03 session | `ac03-working-80x8 e1rmKg: expected 101.333334, got 101.333333`; `bodyweight-no-load-12 volumeKgReps: expected 0, got null`; `set vector ac03-working-80x8 is missing; …`; `session vector ac03-session is missing`. `originalFilesUntouched: true` (real-runner-probes.json) |
| Replay diff | Scratch drift migration | `DROP TABLE "public"."ar1_drift_probe";` (box 3) |

## Retired sources and the lane S2 notice

- **Five files retired** (003 §7, former G-9) by the coordinator:
  - `supabase/contracts.sql`, `supabase/contract-validation.sql`, `supabase/gym-read-models.sql` and
    `supabase/gym-freezes.sql`;
  - their unused generator, `scripts/backend/contracts.ts`.

  Glob in this session: `supabase/*.sql` matches only `development-catalogue.sql` and `seed.sql`, and
  `scripts/backend/` has no `contracts.ts`.
- **Comparison.**
  - `contracts.sql` was a byte-identical prefix of `20261017164336_validated_contracts.sql` (17,640 bytes).
  - Every other statement is compared in phase2C.md's table. No migration was edited.
- **Privileges on the replay database.** `private.freeze_projection` gives authenticated `false` and
  anon `false`. `private.freeze_action` gives authenticated `true` and anon `false`. These match the
  intended grants, so no privilege migration is needed (phase2C residual 7 closed).
- **Lane S2 notice.** The text is in [phase2C.md](phase2C.md#notice-for-lane-s2--handoff-text-not-sent),
  recorded as handoff text for future lane executors. The sole coordinator acknowledged it as part of
  serialized ownership. No person or chat was messaged.

## Review findings left open, by owning goal

| Goal | Item | Source |
|---|---|---|
| MB-4 | Session volume `null` when no set is eligible (the pending vector `no-eligible-session`; F-20); a session best e1RM; a real SQL session aggregate with the completed-session filter; per-row function-call overhead (R8) | fixture-review; phase2B gaps 1–2 |
| MB-4 or owner | Whether a bodyweight set saved with load `0` should give volume `null` (PRD §8.2 open question) | phase2B gap 3 |
| MB-1 or MB-4 | Equal e1RMs can compare unequal when loads carry very different scales. MB-1 bounds `load_kg` scale, or MB-4 compares at a fixed scale (R6) | phase2B R6 correction |
| MB-1 | The 003 §12 PostgREST checks: status mapping, rejected-request counting with the 121st-request rule, `pg_locks` on replay, concurrency (R2-4); the contract header check; the envelope and error codes in a new contract version | proposal-review3; checkpoint §4 |
| MB-6 | Body-entry acceptance vectors for weight only and body fat only (F1, low) | p2a-review3; phase2A-acceptance |
| MB-7 and PL-5 (PL-2 for the store checks) | External tombstone register, fail-closed append, restore import and purge, quiet restore, cutover delta, object copies; actor rows for support and system principals (R2-1, R2-2, R2-3, R2-7) | proposal-review3 |
| G17.api | Trim gym and freeze outcomes to the §4.4 projection; keep `freeze_action`'s order until then; the `operation_result_v1` demotion test (R2-5) | proposal-review3 |
| PL-1 | `FITLOG_BASE_REF` from the CI event, on the same commit as `FITLOG_CONTRACT_BASELINE`; a backend CI job with replay and diff; a hosted run showing the baseline guard pass and fail | phase2C residual 6; checkpoint §4 |
| `packages/domain` owner (with PL-1) | The inline AC03 numbers in `calculations.test.ts:15-22` (R7); the `.gitattributes` rule `packages/domain/contracts/*.json -text` | fixture-review R7; phase2A limitation 3 |
| OW-2 | The dated DEC-15 entry for the confirmed fresh launch | checkpoint §4 |
| Review, no owner named | Guard additions beyond the plan (residual 8); the Node 22.23.1 versus 26.7.0 note (residual 9); the local-target guard cannot detect a remote Docker daemon, the same limit as the existing `verify*.mjs` (residual 10) | phase2C |

## Left undone, and why

- **G-1.** This is the owner's decision. The [owner pack](../../owner-packs/AR-1.md) is ready for review.
- **Proposal review 4 and the guard review.** Both are running, with no verdict yet.
- **The bundled `pnpm backend:test`.** The reason is in [Gates](#gates).
- **Hosted CI.** This is PL-1's.
- **Uncommitted files.** The session-start git status showed `docs/evidence/AR-1/persisted-compare.json`
  and `docs/evidence/AR-1/replay-fixture.log` untracked. Boxes 2–4 cite them. This handoff and the owner
  pack are uncommitted too: the worker ran no git command.

## Requests for other lanes' files

Carried from [checkpoint.md](checkpoint.md) §4 and the table above:
- S2: the notice above.
- PL-1: replay and diff in CI, plus the trusted base.
- `packages/domain` owner: the merge, a hosted CI pass and fail, and `.gitattributes`.
- MB-1: the §12 checks.
- MB-7 and PL-5: the tombstone register.
- G17.api: the outcome trim.
- OW-2: DEC-15.

## Decisions forced (for the tracker decision log)

- **G-1.** Approve 003 as a whole, or with stated exceptions, as a dated entry. The owner pack drafts the
  row. Nothing else in AR-1 needs the owner. R-1 to R-7 (accounts, vendors, region, legal, prices, AI
  vendor, photo backups) stay owner-reserved and unchanged.
- **Engineering, recorded only.** No privilege migration is needed for `freeze_projection` or
  `freeze_action` (see above).

## Traps hit

- `rtk pnpm --filter … typecheck` is rewritten to a bare `tsc`. Use `rtk proxy` (phase2A, command 2).
- `-v fixture="$(cat …)"` drops the final newline, so the hash differs. The runner passes the exact bytes.
- `supabase start` on a running database-only project does not start the API. The local guard correctly
  refuses a project that reports no `API_URL`.
- Harness errors, none of them product faults:
  - the drift harness wrongly required an `--output` file;
  - the TypeScript mutation harness first linked a missing `node_modules`;
  - one CI probe first used a malformed SHA.
- The permission mode denied `rm` in phase 2C. The coordinator made the authorized deletion.

## Remaining steps

1. Receive the proposal review 4 and guard review verdicts. If either asks for changes, fix them and
   append an addendum here. Do not rewrite this record.
2. The coordinator commits the two untracked evidence files, this handoff and the owner pack.
3. The owner gives G-1: a dated row in the tracker decision log ([owner pack](../../owner-packs/AR-1.md)).
4. The standard backend gate. Once 55321 has the formula migration (test-plan §3,
   `migration up --local`), run the bundled `pnpm backend:test` and append its result lines here. Until
   then, the split above is the evidence.
5. `verify-goal` on all four boxes. Then integrate to `main`, run
   `status.mjs set AR-1 done --ref <commit>`, and append this handoff to the tracker handoff log. None of
   this has happened.
