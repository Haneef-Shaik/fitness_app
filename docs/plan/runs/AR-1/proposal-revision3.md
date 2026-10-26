# AR-1 · Proposal revision 3 (proposal re-review, R2-1 to R2-8)

| Field | Value |
|---|---|
| Review | The re-review of proposal revision 2, [`docs/evidence/AR-1/proposal-review3.json`](../../../evidence/AR-1/proposal-review3.json). Provenance: first read in the main checkout at `/Users/Adya/personals/fitness_app/docs/evidence/AR-1/proposal-review3.json`. *Historical:* when this revision was written it was not on this branch, because copying it was outside this revision's allowed writes; it has since been copied. Verdict **REVISE**: PR-1 to PR-6 resolved, no medium or higher defect, and eight low findings, R2-1 to R2-8 |
| Scope | R2-1 to R2-8 only, with no new architecture beyond what each finding needs. PR-1 to PR-6, F1–F17, T1–T4 and P2A-1 to P2A-8 are not reopened |
| Revision | Revision 3, 26 October 2026, in worktree `/Users/Adya/.codex/worktrees/fitlog-ar1/fitness_app` (branch `codex/ar1-contract-freeze`). Its edits are **uncommitted** |
| Files changed | [`003`](../../../architecture/003-architecture-freeze.md); [`checkpoint.md`](checkpoint.md); [`test-plan.md`](test-plan.md); [`proposal-revision2.md`](proposal-revision2.md) and [`phase1-dispositions.md`](phase1-dispositions.md) (state notes only); the review link in [`phase2A-corrections.md`](phase2A-corrections.md)'s header; this new file. Nothing else |
| Method | The reviewer's statements were treated as claims, and each was checked against the current lines of 003, the run files and the cited migrations, by reading only. No command, git, Docker, database, source, SQL, status, plan data or credential change; no external action; no delegation |
| Result | **All eight accepted. None rejected.** One approval only, G-1, still **PENDING**. AR-1 is **not** complete |

## Current state — dated addendum, 26 October 2026 (read this first)

Reported by the coordinator and not independently verified, except where a review is named. The
"uncommitted", "not on this branch" and box-4 lines below are historical; this addendum supersedes them.

- This revision is committed in `ac71e51`, the box-4 fixture files in `fcc9aed`, and the SQL-source
  guard, runner wiring and the retirement of five files in `e23e9ae`. Nothing is merged.
- [`proposal-review4.json`](../../../evidence/AR-1/proposal-review4.json) independently **passed** this
  revision: all of R2-1 to R2-8 resolved, no medium, high or critical defect, and five low findings
  (N-1 to N-5), applied in [proposal-final-low-dispositions.md](proposal-final-low-dispositions.md). It
  asks for no further re-review.
- The canonical evidence is now on the branch, including
  [`p2a-review3.json`](../../../evidence/AR-1/p2a-review3.json) and `proposal-review3.json`.
- The SQL has since run: all 15 migrations replay with a strict empty diff, 8 persisted schemas match,
  and the fixture's 16 set and 2 session vectors pass on an owned replay stack (API 56321, DB 56322).
  `pnpm check` passes 185 tests and the 39 new backend unit tests pass. The bundled `backend:test` has
  not run. Details and evidence links are in the [checkpoint addendum](checkpoint.md).
- Still open: the guard review, merge and hosted CI, the S2 notice, the owner's G-1 approval
  (PENDING), the final goal verifier and integration. No box is claimed done; AR-1 is not complete.

## State this revision records (R2-6)

*Historical, as of revision 3.*

- Phase 2A's snapshot is committed in `07757a5` and its corrections (P2A-1 to P2A-8) in `22c5386`.
  Revision 2 and the durable review copies are committed in `3040ccf`. All three commits are on this
  branch only, **not merged**.
- An independent code reading of the corrections passed
  ([`p2a-review3.json`](../../../evidence/AR-1/p2a-review3.json), first read in the main checkout). It ran
  no command; the coordinator's local run of 179 tests and the CI-baseline probes is the executed
  evidence. **No hosted CI run** has shown the baseline guard passing or failing.
- Box 4's fixture, TypeScript test, `encoding.ts`, migration body and SQL check now exist from phase 2B,
  untracked. **The SQL has never run**, and the runner does not exist. Box 4 is not done.
- The review said revision 2's docs and review copies were uncommitted. That was true when it read
  them; the current state is the `3040ccf` commit above.

## Dispositions

Line numbers are 003's current lines.

| Finding | Claim checked | Change | Residual test and owner |
|---|---|---|---|
| **R2-1** Erasure step 1 does not block re-sign-in or re-onboarding | Holds. `complete_onboarding` refuses a ban (`20261017164336_validated_contracts.sql:74`) and a non-active profile (`:80`), but once step 5 has deleted the profile it inserts a new one (`:78-83`). `member_active()` refuses a ban and a non-active status (`20261017161031_member_core.sql:27-28`) | Step 1 also sets `deletion_pending` and bans the auth user (003:133-138). `complete_onboarding` refuses an actor whose `erased_at` is set, with its existing not-active error, and `member_active()` requires `erased_at` to be null (003:111-115). "Stays revoked by step 1" is now true | MB-7: a sign-in between steps 5 and 6 cannot complete onboarding (003:195-199; §12 row (5), 003:1169) |
| **R2-2** Register retention starts at the append, not at the `erased_at` commit | Holds (old 003:145-147, 161-162) | Retention covers backups taken before `erased_at` commits. Written as append + longest backup expiry + 30 days (the erasure deadline); if step 2 outlasts that margin, the worker extends retention before it sets `erased_at`. The worker credential may extend but never shorten (003:155-157, 163-176, 200-207; §9 003:1094-1102). **≤90 days:** backup expiry is unchanged, at 90 days or less by default (PRD §22.3). The entry outlives the backups by up to 30 days, and whether that fits the retention schedule is assigned to R-4 (003:1152). No compliance is claimed | MB-7 and PL-2: the store refuses overwrite, shorten and delete, writes the bound, and lets the worker extend (§12 row (3)) |
| **R2-3** The restore gate only keeps clients out | Holds for (a), (b) and (c). PRD:1531-1532 says a database backup must not be assumed to include objects | The restored project runs no `pg_cron` job or `pg_net` wakeup and holds no worker or messaging credential until the check passes. At cutover, the runbook stops the source's erasure worker if it still runs, imports the entries appended since the first import, and purges them. Every restore of object copies gets the import and purge, and the check confirms that no object remains under a tombstoned `<owner id>/` prefix (003:179-194; §9) | PL-5: these three in the drill (§12 row (4)). Whether object copies exist is R-7 |
| **R2-4** Replays take the lock; lock lifetime unstated; §12 (1) unreachable | Holds. (a) Old 003 took the lock at step 3, before the replay lookup at step 4, and today's code does the same (`20261019121035_gym_read_models.sql:13-15`; `20261019140839_freeze_preview_binding.sql:17`, then `:24-27`; `20261019122347_function_lint_cleanup.sql:34-38`). (c) A scope 404 and `OPERATION_REUSED` come before the rate check | (a) **Lock-free replay fast path** after scope: a committed key replays uncounted with no lock; a miss takes the lock and looks up again, which at `READ COMMITTED` sees a concurrent first attempt (003:461-469). Scope still comes first (003:484-485). Replays are an uncounted, lock-free stated residual; only a duplicate of an in-flight first attempt waits on the lock, and PL-9 watches replay rates (003:835-840). (b) Lock lifetimes for fast-path replay, success, a caught error and a cancel; the minute window is counted before the day window (003:804-819). (c) The 121st request must pass scope and both replay lookups (§12 row (1)) | MB-1: §12 row (1) as corrected; (2) adds a `pg_locks` check that a replay holds no advisory lock; (4) adds a fast-path mutation; (5) is new: N concurrent rejected commands raise both windows by exactly N, with no `40P01`, and no advisory lock remains after a caught error (003:1168) |
| **R2-5** `operation_result_v1` could return an untrimmed freeze projection | Holds. It runs only steps 1–2; `freeze_action` refuses at `20261019140839_freeze_preview_binding.sql:22` a result whose projection is at `:70` | From its first release it returns only the §4.4 allowlist projection, whatever the definer's trim state (003:486-489, 506-508). `freeze_action`'s per-kind check stays before both lookups until its outcomes are trimmed (003:500-505). A revision-3 note in proposal-revision2 PR-4 | The goal that first ships `operation_result_v1` for gym scope, and G17.api: a demoted manager gets only identifiers and status for a freeze approve stored before the trim (new §12 row, 003:1170) |
| **R2-6** Stale committed and verification state | Holds for every cited line; see "State" above | 003 header (:6-8) and §8 (:1021-1024, 1044-1055); checkpoint header, boxes 1, 2 and 4, F-1, and the lane requests; test-plan header, phase status and §2; revision-3 notes in proposal-revision2 (:16-22, PR-5 state, PR-6, Not claimed) and phase1-dispositions (T4 note). Box 2's remaining item is now "merge so the trusted base carries the snapshot history" | — |
| **R2-7** No path creates support and system actor rows | Holds: the creation-order argument covered member and gym definers only | `private.actors` records a `kind` (`member`, `support`, `system`). A support row is inserted in the transaction that provisions the support principal. System jobs act as one seeded `system` row under a fixed reserved UUID, and their audit rows carry the job ID. The member erasure job refuses any non-member row (003:98-101, 116-121) | MB-7: the migration seeds the system row, and erasure refuses a non-member row. Not built |
| **R2-8** phase2A-corrections cites review 2 only under `/tmp` | Holds (line 5) | Header now links `docs/evidence/AR-1/checkpoint-review2.json` and keeps `/tmp` as provenance. Nothing else in that file changed | — |

## Where this goes beyond the review (for the re-check)

1. **R2-2** uses both of the review's options: a margin at write time, and an extension only when step 2
   outlasts it. The worker credential can therefore extend retention, so "append-only" now reads "add
   and extend, never overwrite, shorten or delete".
2. **R2-3(b)** uses both options too: stop the source's erasure worker, then import the delta. A delta
   import alone could miss an entry appended after it.
3. **R2-4**: the second lookup's correctness depends on `READ COMMITTED`. A duplicate of an uncommitted
   first attempt still takes the lock uncounted; that is stated as a residual.
4. **R2-7** adds one column, `actors.kind`, instead of a null actor, so that the erasure job can refuse
   non-member rows by a check.

## Not claimed

- No owner approval. G-1 is **PENDING**. No region, account, vendor, legal, retention, price or backup
  approval is claimed. Nothing is provisioned, and the tombstone store is still a candidate.
- No AR-1 box is complete, and **AR-1 is not complete**. No goal status, board, ledger, plan data or
  tracker entry was changed.
- Nothing was executed. In particular, lock release when a PL/pgSQL exception block rolls back, and the
  `READ COMMITTED` visibility in step 4, come from PostgreSQL's documented behaviour. §12 row (5) and
  the `pg_locks` checks are how MB-1 proves them.
- Hosted CI is unproved, and nothing here is merged. Box 4's SQL is not verified.
