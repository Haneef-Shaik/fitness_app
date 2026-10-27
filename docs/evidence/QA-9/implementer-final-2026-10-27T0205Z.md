I stopped before the commit, so there is no new commit and no `pnpm check` result to report. The nine paths are staged, but `git diff --cached --check` failed (exit 2). Your brief says to stop on a gate failure, so I did. `HEAD` is still `4a7ee21`, and the staged state is kept.

**Why it stopped.** `--check` found 31 lines with trailing whitespace. I said 32 earlier; the correct count is 31. All of them are copied Node coverage-table rows that end in `| `, inside the verbatim output files: 12 in `phase-3d-check-outputs.md` and 19 in `phase-3e-check-outputs.md`. None is in code, a test, config or a record I edited. I didn't strip them, because that would change verbatim evidence. That's your decision. You can:
- strip them and say so in each file's header;
- accept them as tool output, which makes this the first QA-9 commit whose `--check` isn't clean;
- or leave those two files out of the commit.

**What I ran:**
- Node is v22.23.1.
- The staged set is exactly your nine paths: 9 files, 2785 insertions and 124 deletions, with `contract.test.ts` at 713/89 as the review expected.
- The pre-stage `git diff --check` of my edits was clean.
- Two commands were denied, and I didn't retry them another way:
  - my first command, a compound one without `rtk proxy`;
  - a `git grep` of `4a7ee21` to re-derive the old line numbers.

**What I changed, records only, all before staging.** No code, test, config, threshold or floor changed.
- **Low 1:** §14's three mutations are now five exact diffs of `snapshot-contract.ts`, each with its predicted killing test. Test 1 is now named as a second killer of mutation 2. Replacing `continue` with `break` (or `return`) at `:145` is named as a survivor. Only a `HEAD` that resolves to no commit would expose it, and I've proposed that case for QA-10. These predictions come from reading the tests. No mutation has been run by me or by the review.
- **Low 2:** the R19(b) margin now comes from the reporter's integer test, which I read in `exact-coverage-reporter.mjs:50`. At 273/313:
  - **Absorbed:** one newly uncovered branch, about seven equal-count merges (the eighth fails), or one branch exposed by a test's first call.
  - **Fails:** two exposed uncovered branches, unless six covered ones come with them.

  The coverage model is marked unconfirmed, so the `HEAD` = `main` and CI forecasts now mean only "the margin should hold". The QA-10 advice now covers any domain test change.
- **Stale records:** the old line numbers `:117`, `:194` and `:229–239` are tagged with today's `:214`, `:399`, `:454` and `:463–466`, which I read from the working file. §7's box-3 count is now 19 and names `contract.test.ts`.
- **Low 3**, the test split, is recorded as QA-10's. The test is unchanged.

**Latest gate figures.** These are the review's, not from this session: 285 tests, lines 537/583, branches 273/313, 19 format files, label `from 4a7ee2100bff`.

**Written after the stop, unstaged:** stop notes in the three records, so they now differ from the index, and a new results file, `phase-3f-check-outputs.md`. To resume: re-add the nine paths (and the results file if you want it in), re-check, commit once, then run the pinned `pnpm check` once. The checkpoint's "Stopped before the commit" section has the steps.

Still open: the floor at the exact `main` commit, `pnpm backend:test`, both JS exports, the two re-measures, and the owner's specific approval for the hosted run. QA-9 is not Done.

```
GOAL: QA-9
BRANCH: codex/qa9-quality-ratchets
HEAD: 4a7ee2100bffbfa77671017b83b1300b341a1dec
HANDOFF: docs/plan/runs/QA-9/handoff.md
BOXES: 2/3 Done-when boxes met
STATUS: blocked
NOTES: Records fixed and 9 paths staged, but staged --check failed on 31 trailing spaces in verbatim 3D/3E outputs; no commit or pnpm check; Codex to choose strip/accept/exclude, then re-add (records are MM).
```
