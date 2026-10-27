Phase 3D stopped at a blocker. The local commit `4a7ee21` exists, and the staged `pnpm check` before it passed, but the `pnpm check` after the commit **fails**. Per the brief I didn't amend or reset the commit, re-run, or change any threshold or code. QA-9 is not Done.

**Records fix (before staging).** Every live line in the handoff, checkpoint and `ratchet-enforcement.md` now says the box-3 push and draft pull request need **the owner's specific approval** under docs/23 §6. Neither AUTH-01 nor any earlier approval covers publication. Older phase lists keep their wording, with the wrong approver struck through. The persisted implementer and reviewer finals are unchanged. The phase-3C review is recorded as executed and accepted under your brief. A search confirms no unstruck "Codex's specific authorisation" remains.

**R3 (assigned to QA-9's next phase, no lowering).** No domain coverage file exists on disk, so the analysis used the phase-1 table and run outputs:
- At least two extra lines flip upward (538 − 536). Phase 2B said at least one.
- The records list at least 8 runs at 533. The review counted 6.
- The two required runs in this phase show 533 is exactly the three known flipping lines left uncovered.
- Every `pnpm check` prints the uncovered line numbers, so the flip list can be built from normal runs, with no extra runs.

**Stage and commit:**
- **Stage:** exactly the 11 named paths, 44 files. `git diff --cached --check` was clean, and the line counts match earlier phases.
- **`pnpm check` before the commit:** exit 0 with 282 tests. The format step selected 18 files, with the uncommitted label and 26 files not JavaScript or TypeScript. Domain lines were 533/583, exactly the threshold.
- **Commit:** `4a7ee2100bffbfa77671017b83b1300b341a1dec`, no hook output. I left out the Co-Authored-By trailer because your global git rule disables attribution.
- **`pnpm check` after the commit: exit 1.** The format step was as expected: 18 files, labelled `from 4a7ee2100bff, which adds scripts/quality/touched-format.mjs`. The domain test then failed with `exact branches coverage 271/313 (86.5815%) does not meet the threshold of 86.9%`. The review expected this run to pass.

**The blocker (R19, high).** One branch in `gitBaselines` (`packages/domain/src/cli/snapshot-contract.ts:151`) is only covered while `HEAD` equals `main`. Every run before the commit was in that state, so the 86.90 threshold (272/313) was measured in a state no committed branch is in. The two runs' own diagnostics show the branch taken before the commit and skipped after it. From the code, not run: every goal branch ahead of `main` would fail the same way, and probably so would a CI pull-request run. `packages/domain/` belongs to S8 Member backend, so the handoff asks S8 for a test that covers the branch in any Git state.

**Uncommitted after the commit:** `checkpoint.md`, `handoff.md` and `ratchet-enforcement.md` are modified, and `phase-3d-check-outputs.md` is new (both full outputs; nothing needed redacting). Nothing is staged.

**Denied, not worked around:** the compound first command, `rtk git status` without `proxy`, and `rtk proxy wc -l`.

**Still open:** your R19 decision, the rebase onto `main`, `pnpm backend:test`, both JS exports, anchoring the floor, and the owner's approval for box 3.

```
GOAL: QA-9
BRANCH: codex/qa9-quality-ratchets
HEAD: 4a7ee2100bffbfa77671017b83b1300b341a1dec
HANDOFF: docs/plan/runs/QA-9/handoff.md
BOXES: 2/3 Done-when boxes met (locally only while HEAD equals main; pnpm check fails at 4a7ee21, so none ready to verify)
STATUS: blocked
NOTES: Records fixed (box-3 push needs the owner's approval); staged pnpm check passed (282 tests, 18 files); commit 4a7ee21; post-commit pnpm check fails at domain branches 271/313 vs 86.90 (R19: a branch covered only while HEAD equals main, fix is a test in S8's packages/domain); post-commit records uncommitted (3 modified, 1 new)
```
