I found no critical, high or medium issues, so Codex can make the scoped local commit below. My independent `pnpm check` confirms every figure the implementer claimed. There are three low findings, two of them in the records.

## Executed in this review (Node v22.23.1, the `.node-version` pin)
| What | Result |
|---|---|
| `rtk proxy pnpm check`, run once, on `4a7ee21` plus the uncommitted test, with `HEAD` ahead of `main` | **Passed.** Every step ran through to `plan.json and board.html match GOALS.md`. |
| Tests | **285** in total: 40 domain, 97 quality, 126 mobile, 22 plan. None failed or was skipped. |
| Domain coverage | **Branches 273/313** (87.2204%), as claimed. Lines 537/583, functions 106/117. `snapshot-contract.ts` branches 88.81%. |
| Format step | **19 files**, labelled `Base: main@2a95726912c6, from 4a7ee2100bff, which adds scripts/quality/touched-format.mjs`; 26 files skipped as not JavaScript or TypeScript. |
| Mobile coverage | 12.23 / 10.57 / 10.23 / 18.67, unchanged. |
| Word diff of the test file against `HEAD` | Every change to existing code is Prettier formatting: trailing commas, re-wrapping, and dropped redundant parentheses around arrow bodies. No assertion was removed or weakened. The live history test (`contract.test.ts:213`) is still there. |
| `git status --short`, before and after | The same 4 modified and 4 untracked files. Production code, thresholds, config and `coverage-floor.json` are unmodified. |
| `git log --all` for the test file | Only the two AR-1 commits, so no other branch will conflict with the whole-file reformat. |

The word-diff check is my reading of the diff, not an AST comparison.

Two commands were denied and not worked around: the first, compound command, and `git rev-parse HEAD main`. The harness saved two large outputs to its own folder outside the repo. I wrote nothing in the repo and mutated nothing.

## Inspection: the Git double and the three tests
- **The double (`contract.test.ts:567-624`)** answers only the five read-only Git commands `gitBaselines` and `gitSource` send, from the right directory. Anything else gets a non-zero status, so a changed call fails loudly. Its fork-point logic is correct for this five-commit history. With `env` set to `{}`, the host's `CI` and `FITLOG_CONTRACT_BASELINE` don't matter.
- **One fork point (`:633`).** With `HEAD` at `main` and `HEAD` behind `main`, the test checks:
  - one source, with the `same commit as an earlier baseline` note;
  - the fork point's tree is read once and holds the fork point's history;
  - it still catches a self-consistent rewrite of 0.1.0.
- **Ahead, committed rewrite and diverged (`:676`).** Each case asserts both baselines, each read once.
  - Ahead: only `HEAD` catches an uncommitted rewrite of 0.3.0; `main`'s fork point stays silent about it.
  - Committed rewrite: `HEAD` alone can't catch it, and `main`'s fork point does.
  - Diverged: `main`'s baseline is the fork point, not `main`'s tip, and the tip is never read. A contrast assertion shows the branch's 0.3.0 would be refused against the tip, so the diverged case means something.
- **No local `main` (`:757`).** It checks `HEAD` alone, with the note `main: not found (exit 1); skipped`, and still catches a rewrite of 0.2.0.
- **How the assertions read.** They check labels, notes, which trees were read and what `baselineProblems` reports, none of which depends on the host's Git state. `assert.equal(mainCatch, '')` and `ownCatch` would also catch a missing source, since `undefined` is not `''`.
- **PRD 16.1 / frozen003.** The diff is test code over synthetic snapshots and touches no data access, so there is nothing to apply.

## The three §14 mutations (not run, by the brief)
| Mutation | Would it be killed? |
|---|---|
| 1. Drop the `seen` check at `snapshot-contract.ts:151` | **Yes,** by test 1 in both states: two sources, two `checked` notes, the tree read twice. The prediction is correct. |
| 2. Use `main`'s tip instead of the fork point | **Yes,** by the diverged case (`main@eeeeeeeeeeee`, the tip's tree read, 0.3.0 refused). Test 1's `HEAD`-behind-`main` case also fails, which §14 doesn't mention. |
| 3. "Stop on a ref that is not found" | **Depends on the edit.** Making `:144` throw locally, or skipping without the note, is killed. A `break` or early `return` is **not**: the note is written before the `continue` and `main` is the last ref, so the output is identical. See finding 1. |

## Findings
**1. Low · `docs/evidence/QA-9/ratchet-enforcement.md:1372`**
- **Defect:** mutation 3's wording allows an edit the tests can't detect, and §14 says it would fail.
- **Scenario:** the next reviewer replaces `continue` with `break` at `:145`. The no-local-`main` test passes, and the reviewer wrongly concludes the test is weak.
- **Fix:** write each mutation as an exact diff, like the 3C patch. For mutation 3, use "drop `&& configured !== undefined` at `:144`" or "drop the note at `:145`". Add test 1 as a killer of mutation 2.

**2. Low · `ratchet-enforcement.md:1297-1338` and `handoff.md:105-109, 155`**
- **Defect:** R19(b) describes the coverage risk in one direction only, and rests its other-state predictions on an unconfirmed explanation of V8's coverage.
- **Scenario:**
  - I believe V8 also records a separate coverage range after each early `if…throw`/`return`. If so, the loop body's direct parent is not the function, and the "loop body count equals call count" explanation is doubtful. The exact 273/313 forecast for `HEAD` = `main` and CI is then weaker than "predicted run 10 exactly" suggests.
  - The pass verdict holds anyway. Both Git-dependent branches are now covered by the double in every state. Merging equal-count ranges only removes covered ones, and the margin absorbs about 7 such merges.
  - The unstated direction (my inference): a test that first calls a never-called domain function exposes its hidden branches. Two or three uncovered ones would push 273/313 below 86.90.
- **Fix:** restate R19(b) as a margin of one newly uncovered branch, or about 7 merges, and note the first-call exposure. Widen the advice to S8 from "`gitBaselines` calls" to "any domain test change", for QA-10.

**3. Low · `packages/domain/src/contract.test.ts:676-755`**
- **Defect:** one 80-line test holds three scenarios.
- **Scenario:** if the "ahead" assertions fail, for example under a mutation run, the rewrite and diverged results are never reported.
- **Fix:** split it into three tests. The number of `gitBaselines` calls stays the same, so R19(b)'s coverage counts don't move.

## R19(b), R3 and the floor
- **Floor:** unchanged at lines 91.42, branches 86.90, functions 90.59.
- **Branch margin:** the reporter compares exact integers (`covered × 10000 >= 8690 × total`). So 272/313 passes, 271/313 fails, and today's margin is **one branch**.
- **Lines:** 533/583 is exactly the threshold, and 532 would fail. My run's 537 is 583 minus the 46 lines uncovered in every run, with none of the four flipping lines uncovered. That makes 42 samples, and 532 has still never been seen.
- **Hypothesis for the R3 phase (unverified):** each `src/*.test.ts` runs in its own process. The flips may come from merging those processes' coverage in a different order each run.

## Recommended commit (local only)
1. **Before staging, records only.**
   - In §7 step 4 (`ratchet-enforcement.md:671`), change `<n>` from 18 to **19**, naming `contract.test.ts`.
   - Optionally fix findings 1 and 2, and the stale pre-format line numbers (`:117`, `:194`, `:229–239`) in the R19 row.
   - Persist this review verbatim. Leave both implementer finals unchanged.
2. **Stage each path by name, never `-A`:**
   - `packages/domain/src/contract.test.ts`
   - `docs/evidence/QA-9/ratchet-enforcement.md`
   - `docs/plan/runs/QA-9/checkpoint.md`
   - `docs/plan/runs/QA-9/handoff.md`
   - `docs/evidence/QA-9/phase-3d-check-outputs.md`
   - `docs/evidence/QA-9/phase-3e-check-outputs.md`
   - `docs/evidence/QA-9/implementer-final-2026-10-27T0035Z.md`
   - `docs/evidence/QA-9/implementer-final-2026-10-27T0105Z.md`
   - this review's file
3. **Inspect the stage:** `git diff --cached --stat` should show only those paths, with the test at 713 insertions and 89 deletions. `git diff --cached --check` should be clean, and `git status --short` should show nothing else.
4. **Commit once,** for example `test(QA-9): cover gitBaselines fork-point dedupe in any Git state (R19)`.
5. **Post-commit proof, each command separately through `rtk proxy`:**
   - `git log --oneline -3` shows the new commit, then `4a7ee21`, then `2a95726`;
   - `git show --stat HEAD` lists only the staged paths;
   - `git status --short` is clean;
   - `pnpm check` on Node 22.23.1 exits 0 with 285 tests, 19 format files and the label `from 4a7ee2100bff`. Domain branches should be at least 272/313 (273 expected). Record the line count as an R3 sample, and write the results down after the commit, uncommitted.

After that, still no rebase or integration. The `HEAD` = `main` and CI re-measures, `pnpm backend:test` and the exports stay deferred, and the hosted push still needs the owner's specific approval. QA-9 is not Done.
