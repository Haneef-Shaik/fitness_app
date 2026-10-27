## QA-9 review: commit 3007094 and the uncommitted 3G records

There are no critical, high or medium findings in the new code or records. My one `pnpm check` on Node v22.23.1 passed with 285 tests. Two low findings are in the records. QA-9 is not Done: box 3, the hosted CI run, is still unmet.

One part of your brief needs a change: don't merge current `main` into the goal branch. Rebase the branch onto it. The reasons are in the plan below.

### Findings

**1. Low · `docs/plan/runs/QA-9/handoff.md:91` (box-3 row, committed in 3007094)**
- **Defect:** the row says §7 step 4 requires "18 files in its log", but phase 3F changed §7 step 4 to 19 files, naming `contract.test.ts`.
- **Failure scenario:** whoever checks the hosted run goes by this row and expects 18. They then question a correct 19-file log, or accept a wrong 18-file one where `contract.test.ts` is missing.
- **Fix:** tag the row in place, as earlier phases did: "(3F: 19, naming `contract.test.ts`; a rebase changes the `from` commit ID)".

**2. Low · `docs/plan/runs/QA-9/checkpoint.md:41` (uncommitted)**
- **Defect:** it says "Nothing else is uncommitted", but Codex has since saved `implementer-final-2026-10-27T0235Z.md` as a fourth untracked file, and no record mentions it.
- **Failure scenario:** the next records commit stages only the three files the checkpoint names. The phase-3G report then stays untracked and never reaches the branch.
- **Fix:** commit all four paths together, and tag line 41.

### What I ran
- **Commit contents:** `git show --stat` and `--numstat` on 3007094 show exactly the 11 expected paths, 3113 insertions and 124 deletions, with `contract.test.ts` at 713/89. Nothing else in code, config or thresholds changed. `git diff --check 4a7ee21 3007094` is clean, and so is the current uncommitted diff.
- **`pnpm check`, once:** exit 0, 285 tests (40 + 97 + 126 + 22).
  - **Domain:** lines 536/583, branches **273/313** (87.2204%), functions 106/117.
  - **Format step:** 19 files, labelled `Base: main@2a95726912c6, from 4a7ee2100bff, which adds scripts/quality/touched-format.mjs`, with 33 files skipped as not JavaScript or TypeScript.
  - **Mobile:** 254/2076, 164/1551, 84/821 and 191/1023. Plan build matches.
  - **Coverage guard:** it read 2 baselines. `HEAD@300709473f12` records the floor; `main@2a95726912c6` records no minimums, so **the floor is not anchored**.
  - **Line-noise sample (R3):** 536 lines. Of the four lines that flip between runs, only `dates.ts:19` was uncovered this time.
  - The 3G records were uncommitted during the run. They are all Markdown, so the results are unaffected, and the tree was unchanged afterwards.
- **Current baseline:** the fork point is still `2a95726`. Local `main` is at `c8a5d57`, 20 commits ahead of it. Those commits touch only `docs/plan/**` and `docs/evidence/AR-1/cleanup.md`. None of them is a JavaScript or TypeScript file, and none overlaps QA-9's paths.
- **Commands denied, not retried:** `git rev-parse`, `git merge-base` and `sed`. I used `git log`, log ranges and Read instead.
- I didn't run the Python launcher.

### What I checked by reading
- **Whitespace normalization:** phase 3F's 31 flagged line numbers, shifted by the one header row in each file, are exactly the 31 coverage rows that now end in a bare `|`.
  - Phase 3D's output went from 1031 to 1032 lines, and phase 3E's from 224 to 225.
  - No trailing whitespace is left in the 3D, 3E, 3F or 3G output files.
  - The percentages in each table agree with the exact counts printed beside them.
- **The deterministic tests:** the Git double (`contract.test.ts:567-624`) and the tests at `:633`, `:676` and `:757` match the earlier review's description and line numbers, and the live history test at `:213` is still there. All of them passed in my run. I found nothing new; the test split and the surviving mutant stay QA-10's.

### Taken on trust, not re-proved
- That no character besides the 31 spaces changed. The before-strip copies were never hashed, so this rests on the implementer's numstat and `--ignore-space-at-eol` runs.
- That the committed test file is byte-identical to the one the earlier review saw. Only the 713/89 count and the matching line numbers support it.
- Run 20 and the earlier reviews.
- §14's mutations: nobody has run them.

## Plan for local integration prep
None of this is done yet. Each step needs its own brief.

**Rebase; don't merge `main` in.** Three rules forbid a merge commit:
- docs/23 §6: "rebases, re-runs the standard gates and fast-forwards `main`. There are no merge commits."
- The `goal-integrator` agent's own rules: "Fast-forward only… Never create merge commits."
- QA-9's own rule in docs/23 §9: merge only once `main` holds the rule.

Today a merge would cause no formatting harm, because the format step would only add `main`'s 25 Markdown and JSON files to its "not checked" count. The rules still apply, and the fast-forward would carry the merge commit onto `main`. A rebase also moves the format step's base to `main`'s tip, so only QA-9's own files are selected.

1. **Save the 3G records first.** After the two low fixes, make one commit of the four records paths, with a clean `--check`. A rebase needs a clean tree.
2. **Recheck `main` just before rebasing.** Record `main`'s ID and re-list the files it changed since `2a95726`. If any is code, a contract snapshot or a QA-9 path, stop and re-plan.
3. **Rebase, in the QA-9 worktree only:** `rtk proxy git rebase main`. On any conflict, run `git rebase --abort` and report. Keep the old IDs (`4a7ee21`, `3007094`, plus the records commit) so the records can map old to new.
4. **Prove only the base moved:**
   - `git range-diff 2a95726..<old tip> main..HEAD` should show every commit's patch unchanged;
   - `git diff <old tip> HEAD --name-only` should list exactly `main`'s 25 docs paths.
5. **Run the gates on the rebased branch, Node 22.23.1:**
   - `pnpm install --frozen-lockfile --offline`. If the local store is missing a package, stop; don't go online.
   - `pnpm check` once. Expect 285 tests, and the format step at 19 files labelled `Base: main@c8a5d57…, from <new rule commit>`, with about 35 files not checked.
   - Expect domain branches of at least 272/313 (273 likely) and lines of at least 533.
   - If lines reach 532 or branches 271, record it as R3 or R19(b) noise. Don't lower a threshold, and don't re-run hoping for green.
6. **Both JS exports:** `pnpm --filter @fitlog/mobile exec expo export --platform ios --platform android --output-dir .expo/export-native`. Output goes to the gitignored `.expo/`. Consider setting `EXPO_OFFLINE=1`, and stop if it needs the network.
7. **`pnpm backend:test`.** It needs explicit backend authorization, because it writes synthetic users and rows to the **shared** 55321 stack. Before running it:
   - confirm `supabase status` reports `http://127.0.0.1:55321`;
   - confirm from MB1's own records that its state is restored, with no lock and nothing applied to the shared stack, and run strictly one after the other with MB1's work;
   - confirm the applied migrations equal `main`'s, since QA-9 changes nothing under `supabase/`;
   - confirm the seed rows exist, and stop rather than seed if they don't.

   The gym suite asserts "Staff must never gain health access" for reads, which is consistent with PRD 16.1 and frozen003.
8. **Measure the state where `HEAD` equals `main`, in a throwaway clone outside the repo.** Run `git checkout -B main <tip>` inside that clone, then install offline and run `pnpm check`.
   - Expect the `main` baseline to read "same commit as an earlier baseline", the "floor is not anchored" line to be gone, and branches of at least 272.
   - **Never move `main` in this repository or any of its worktrees.** `refs/heads/main` is shared by the main checkout and every worktree.
   - Optionally, in that clone, run `env CI=true FITLOG_CONTRACT_BASELINE=<full c8a5d57 ID> pnpm check` to imitate CI mode. Label it a local imitation; it is not box-3 evidence.
9. **Floor check at the exact commit that will reach `main`:** `git show <tip>:scripts/quality/coverage-floor.json` must equal coverage-baseline.md §5. That is mobile 12.23 / 10.57 / 10.23 / 18.67 over `src/**/*.{ts,tsx}` minus `__tests__`, and domain 91.42 / 86.90 / 90.59. Anchoring itself happens only when the integrator fast-forwards `main`.

## Can the verified local changes go ahead while the hosted proof is open?
- **Steps 1–9 can.** They stay on the goal branch or a throwaway clone. They publish nothing and leave `main` alone. Backend and exports still need their own authorization.
- **Integration into `main` can't.**
  - docs/23 §8 makes a goal Done only when every box has evidence.
  - The integrator runs "only after a pass" from the verifier, and box 3 needs the linked hosted run.
  - docs/23 has no partial-integration path. Splitting box 3 into another goal would be a GOALS.md scope decision for Codex or you, and it's outside this review.
  - With such a split, `main` would carry a CI-mode guard and format step never run on hosted Linux (R10). The push itself still needs your specific approval.
- **Do the rebase before any approved hosted run,** so that run tests the commits that will be integrated. The pushed branch would also publish every unpushed local-`main` commit since `c8f6d7f`.
