I've fixed R19 locally with a test only, and with your next `pnpm check` passing. The domain branches are back above the threshold, but this is my own run: nobody independent has re-run it yet. Nothing is staged or committed, and `HEAD` is still `4a7ee21`.

**What changed.** Only `packages/domain/src/contract.test.ts`, plus the QA-9 records. I added an in-memory Git stand-in that runs no real Git, and three tests that use it:
- **`HEAD` at or behind `main`:** these share one fork point, so there is one baseline, read once, with the `same commit as an earlier baseline` note.
- **A branch ahead of `main`, a branch that committed a rewrite, and a branch diverged from `main`:** each fork point is read once. Each baseline catches what only it knows about. On a diverged branch, `main`'s baseline is the fork point, not `main`'s later tip.
- **A clone with no local `main`:** `HEAD` is checked alone, with the note `main: not found (exit 1); skipped`.

The live history test is untouched. No production code, threshold or config changed. Once touched, the file had to pass the format step, so I ran Prettier over the whole of it.

**My results (Node 22.23.1, `HEAD` ahead of `main`)**
- **Before (already seen at `4a7ee21`):** 271/313 against 86.90.
- **Domain tests:** 40 of 40 pass, branches **273/313** (87.22%).
- **`pnpm check`:** exit 0 with 285 tests (40 domain, 97 quality, 126 mobile, 22 plan). The format step now selects 19 files.

**One surprise, recorded rather than hidden.** My first version, with only the first two tests, passed every test but measured **271/312**. Coverage merges any code block that runs exactly as often as its parent. That version made `gitBaselines`' loop body run 26 times in 26 calls, so one covered branch dropped out of the count. The final version adds two real states nothing tested before: a branch diverged from `main`, and no local `main`. I predicted 119/134 for `snapshot-contract.ts` and 273/313 for the domain before running, and both matched. A future merge of this kind would still pass, at 272/312 (87.18%). I logged the risk as R19(b), next to R3.

**R3, from the normal outputs only:** four domain lines flip from run to run: `calculations.ts:3`, `calculations.ts:118`, `dates.ts:19` and `finance.ts:14`. 46 lines are uncovered in every run, so 533 is those 46 plus all four. Branch figures did not vary between runs.

**Independent evidence:** none for this phase. The only independent input was your own reading of the branch and the test.

**Still open**
- **Can the tests fail?** Not shown. Your brief forbids production edits even temporarily, so I mutated nothing. ratchet-enforcement.md §14 lists three scratch-copy mutations of `snapshot-contract.ts` for the reviewer, each with its expected failure.
- **Other Git states:** `HEAD` = `main` and CI mode are predicted at 273/313, not measured.
- **Commit:** committing the test is your call. Once it's committed, §7's box-3 checklist needs "18 files" changed to 19.
- **Box 3:** the hosted run still needs the owner's approval to push.
- **Before integration:** the rebase, `pnpm backend:test` and the exports.

Three commands were denied and not worked around: the compound first command, a diagnostic lcov run, and `git rev-parse HEAD`.

```
GOAL: QA-9
BRANCH: codex/qa9-quality-ratchets
HEAD: 4a7ee2100bffbfa77671017b83b1300b341a1dec
HANDOFF: docs/plan/runs/QA-9/handoff.md
BOXES: 2/3 Done-when boxes met (locally, implementer runs only, uncommitted test; none accepted)
STATUS: blocked
NOTES: R19 fixed by an uncommitted contract.test.ts test (domain 273/313, pnpm check exit 0, 285 tests, implementer-run); fresh independent review next; Codex decides the commit; box 3 still needs the owner's push approval
```
