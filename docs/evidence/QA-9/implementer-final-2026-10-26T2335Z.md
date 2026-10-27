# Complete correction final — de350e6e-5af0-4152-96a1-ef3baffd7a32

Phase 3C is done, and all three lows from the final review are resolved. Nothing is staged or committed, and the goal is not marked Done. Bash was allowed only in the `rtk proxy …` form. Three commands were denied and not worked around: a compound command, a bare `rtk git status`, and `git apply --check`.

**What changed** (only one test file and the QA-9 documents; no check code, thresholds, floor, dependencies, lockfile, wiring, source or docs/23):
- **Finding 1 (handoff gate rows):** the `pnpm backend:test` and native export rows now say each gate is required by docs/23 §7 for this diff, was not run, and is deferred, with no waiver. Both must pass before integration: `backend:test` because `packages/domain/package.json` changed, the iOS and Android export because of the three `apps/mobile/` files.
- **Finding 2 (test gap):** I added touched-format test 17 at the end of the file. It builds the merge commit GitHub checks out for a pull request with `git commit-tree`: the baseline is the first parent, the work branch the second, and `HEAD` is detached on it. It runs with `GITHUB_ACTIONS=true` and `FITLOG_CONTRACT_BASELINE`. It asserts that the base is the parent of the commit that adds the format rule, and checks the exact label and the nine files that commit adds. It then runs the command the way root `check` does. It passed on the unchanged check.
- **The mutation:** I saved the exact patch in `docs/evidence/QA-9/phase-3c-mutation-first-parent.patch`. Because `git apply` was denied, I made the same one-line edit with Edit, and the patch file was never applied by Git. With `--first-parent` added, test 17 fails ("measured from the parent of the commit that adopts the rule, not from the baseline") while tests 1–16 all pass. It failed again after Prettier re-wrapped the test. I restored the line each time and confirmed by reading it back and a search. I took no hash beforehand, so that restore isn't proven byte for byte.
- **Finding 3 (box-3 checklist):** step 4 of the hosted-run checklist in `ratchet-enforcement.md` §7 now requires the format step to pass with the label `Base: FITLOG_CONTRACT_BASELINE@…, from <the QA-9 commit>, which adds scripts/quality/touched-format.mjs` and 18 files. It also says not to link the run if the label or count differs.
- **Records:** the checkpoint, handoff and evidence (new §12) list every command. They record the final review as the current review acceptance: no critical, high or medium finding, and an independent pass of 281 tests.

**Results on Node 22.23.1:** the quality tests pass 97 of 97, and `pnpm check` exits 0 with 282 tests, run twice. Prettier `--check` passes for all 18 files, each named (17 quality scripts plus `jest.config.cjs`); only the changed test needed formatting. `git status` and `git diff --stat` are the same as in the final review.

**One thing to look at:** in the final `pnpm check`, domain line coverage came out at **533/583, exactly the 91.42% threshold**. Only prose had changed since the previous run's 536. It passed, but with no margin, so a run at 532 would fail with no code change. This is the known run-to-run variation (R3, now 35 runs); I recorded it in all three files.

**Still open:**
- **Committed boundary:** you stage and check it. The format step should select the 18 files, with the label naming the QA-9 commit.
- **Deferred gates:** `pnpm backend:test` and both JS exports.
- **Box 3:** the hosted CI run needs your specific authorisation to push and open a draft pull request.
- **Floor:** anchoring happens at integration.
- **No review of phase 3C:** sub-agents were forbidden, so a self-review stands in for the reviewer runs.

```
GOAL: QA-9
BRANCH: codex/qa9-quality-ratchets
HEAD: 2a95726 (nothing committed; all QA-9 work is uncommitted in the worktree)
HANDOFF: docs/plan/runs/QA-9/handoff.md
BOXES: 2/3 Done-when boxes met (locally, uncommitted, neither accepted)
STATUS: blocked
NOTES: Phase 3C done (3 lows resolved, 282-test pnpm check passes; final run's domain lines 533/583, exactly at threshold); box 3 hosted run needs Codex push authorisation; Codex to stage and check the 18-file committed boundary; backend:test and the iOS/Android export required and deferred.
```
