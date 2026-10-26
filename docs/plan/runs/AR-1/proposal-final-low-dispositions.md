# AR-1 · Final low corrections (proposal review 4, N-1 to N-5)

| Field | Value |
|---|---|
| Review | [`docs/evidence/AR-1/proposal-review4.json`](../../../evidence/AR-1/proposal-review4.json). Verdict **PASS**: R2-1 to R2-8 resolved, no medium, high or critical defect, and five low findings, N-1 to N-5. It asks for no further re-review after these narrow fixes |
| Scope | N-1 to N-5 only: a bounded, mechanical correction, not a new design review. Nothing else in 003 is reopened |
| Date | 26 October 2026, in worktree `/Users/Adya/.codex/worktrees/fitlog-ar1/fitness_app` (branch `codex/ar1-contract-freeze`). These edits are **uncommitted** |
| Files changed | [`003`](../../../architecture/003-architecture-freeze.md), [`checkpoint.md`](checkpoint.md), [`test-plan.md`](test-plan.md), [`proposal-revision3.md`](proposal-revision3.md), [`phase2A-corrections.md`](phase2A-corrections.md) and this new file. `handoff.md` and the AR-1 owner pack belong to another worker and were not touched |
| Method | Reading only. N-1's citation was checked against `20261019140429_gym_freezes.sql:7` and `:185-186`. No command, git, database, source or SQL change; no external action |
| Result | **All five applied.** N-1 to N-3 are applied as engineering sentences in 003 with named MB-7 and PL-5 tests, not as owner-approval exceptions. G-1 is still **PENDING**. AR-1 is **not** complete |

| Finding | Change | Named test, owner |
|---|---|---|
| **N-1** `gym_freezes.decided_by` already has a foreign key to `profiles` | Confirmed: the column is at `:7` and `gym_freezes_decided_by_fkey` at `:185-186`, with no `ON DELETE` rule. 003 §3.3 Missing (003:275-281) now cites both. The migration that adds `private.actors` drops that constraint when it re-points the column to the actor key with `RESTRICT` | §12 (6), MB-7: the step-5 test erases an owner or manager who has decided a freeze, and the freeze row keeps its actor key |
| **N-2** Erasures pending at the source are lost at cutover | 003 §3.3 Restore (003:231-236): after the source's erasure worker stops, pending erasure requests are copied into the restored project and run from step 1 before clients switch. If the source is unavailable, the loss of in-RPO requests is a stated residual that PL-5 reconciles before declaring the restore complete | §12 (8), PL-5 drill |
| **N-3** An upload URL issued before step 1 can deliver bytes after step 3 | 003 §3.3 erasure steps (003:167-181): step 1 now says that issuing and finalizing an upload check `member_active()`, not an already-issued URL. Step 3 starts only after the longest upload-URL lifetime has passed since step 1 (600 s by decision; MB-6 measures the real value), then deletes every object under the `<owner id>/` prefix in every personal bucket | §12 (7), MB-7: a URL issued just before step 1 delivers bytes; when erasure completes, no object remains under the prefix |
| **N-4** Review links not durable | 003 header (:6) links `proposal-review3.json` and `proposal-review4.json`. 003 §8, the checkpoint (revision 3 input and box 2) and `proposal-revision3.md` (header and state) link `docs/evidence/AR-1/` copies, keeping the main-checkout path as provenance. The earlier "not on this branch" lines are labelled historical | — |
| **N-5** Stale state lines | A dated current-state addendum (26 October 2026, coordinator-reported) sits near the top of 003, the checkpoint, the test plan, `proposal-revision3.md` and `phase2A-corrections.md`. Older status lines are kept as written and labelled historical | — |

## Current state recorded in the addenda

Reported by the coordinator and not independently verified, except proposal review 4.
- Committed on the branch, not merged: `ac71e51` (revision 3), `fcc9aed` (box-4 fixture files) and
  `e23e9ae` (guards, wiring, and five retired files), after `07757a5`, `22c5386` and `3040ccf`.
- The canonical evidence is copied into `docs/evidence/AR-1/`. `checkpoint-review2.json` parses to the
  same JSON as the canonical copy; only formatting differs.
- `pnpm check` passes with 185 tests, and the 39 new backend unit tests pass. The guarded runners pass
  on an owned replay stack (API 56321, DB 56322): 8 schemas match, and the fixture runs exactly 16 set
  and 2 session vectors, with the negative probes failing first. All 15 migrations replay with a strict
  empty diff and a clean lint. The original four suites pass on 55321. The bundled `backend:test` has
  not run, because the new migration is not applied on 55321.
- Still open: the guard review (running), merge and hosted CI, the S2 notice at handoff, the owner's
  G-1 approval (PENDING), and the final goal verifier and integration.

## Not claimed

No owner approval and no approval exception. No box done, no acceptance, and AR-1 is not complete.
Nothing was executed here.
