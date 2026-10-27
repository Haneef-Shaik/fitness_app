# Handoff — QA-9 · Lint, type and coverage gates that only go up        attempt 1 · `codex/qa9-quality-ratchets` · base `main@2a95726` (phase 3D: scoped stage and one local commit; results recorded after the commit. Phase 3E: R19 fixed by a domain test. Phase 3F: that review's record findings corrected, and the test committed locally. Phase 3G: phase 3F's whitespace stop resolved, and that commit made. Phase 3H: the 0305 review's lows fixed, the records committed, then a rebase onto local `main` and the local gates. Phase 3I: the 0405 review's lows fixed, the records committed, then the floor proof in a disposable clone with `HEAD` = `main`)

> **Phase 3I** *(written before its records commit, and part of it. The results come after the floor proof, uncommitted. No Done is claimed)*.
> - **The review it answers:** the executed [0405 review](../../../evidence/QA-9/final-2026-10-27T0405Z.md) of the rebased `c84bb4c`. On Node v22.23.1 it ran `pnpm check` once (**285 tests**, domain **536/583**, **273/313** and 106/117, 19 format files) and the iOS and Android export once (exit 0, the same two `.hbc` filenames, JS and Hermes only). It found **no critical, high or medium finding**, and two record lows.
> - **Codex's phase-3I brief accepts it** (acceptance (13)). Box 3 stays open, and no push, pull request or integration into `main` is authorized.
> - **Both lows are fixed in place.** The phase-3H implementer's report, `final-2026-10-27T0335Z.md` (session `6a4c540a-d21a-487c-98fa-9a8b47212007`), and the 0405 review are named in the checkpoint's Reviews row and file index, and the stale uncommitted inventory is tagged. Metro's module counts are marked as varying between runs, with the bundles identified by their `.hbc` filenames. The verbatim outputs and finals are unchanged, with annotations outside them.
> - **Then:** one records commit of exactly five paths, and the floor proof, once, in a disposable clone outside every repository, with `HEAD` = `main` inside the clone only. The checkpoint's "Phase 3I" has the brief's terms.

> **Phase 3H, after the rebase** *(written after the rebase and the gates, uncommitted. These are implementer runs. No Done is claimed)*.
> - **Records commit:** `cf99bc54febe6d2efdb88bd9cb5e0eeb5898a49b`, `docs(QA-9): record phase 3G results and the 0305 review`, exactly the five paths, with staged `--check` clean.
> - **`main` rechecked:** at `c8a5d57`, 20 docs-only commits since `2a95726` and no merge commit. Its 25 paths are Markdown or JSON under `docs/plan/` and `docs/evidence/AR-1/`, and none is code, a contract or a QA-9 path.
> - **Rebased onto `main`, no conflict.** Old → new:
>   - `4a7ee21` → **`06c8220`** (`06c822050d7610223bf7b76fd76842a90368fcde`);
>   - `3007094` → **`557b779`** (`557b779f9428b91158335b4370c071d2580d6994`);
>   - `cf99bc5` → **`c84bb4c`** (`c84bb4cd1639d528779c9cc52e8a1540d0ae1ebc`), the new tip.
>
>   `range-diff` shows `=` for all three, and `git diff <old tip> HEAD` lists only `main`'s 25 docs paths. `main` didn't move, and nothing is pushed.
> - **`pnpm install --frozen-lockfile --offline`:** exit 0, `downloaded 0`. It printed `Packages: +2 -68`, which brought `node_modules` into line with the lockfile.
> - **`pnpm check`, once, on `c84bb4c`, Node v22.23.1: exit 0, 285 tests** (40 + 97 + 126 + 22).
>   - Format step: **19 files**, `Base: main@c8a5d57c3a09, from 06c822050d76`, with **36** not checked.
>   - Domain: **535/583**, **273/313** and **106/117**.
>   - Mobile: 254/2076, 164/1551, 84/821 and 191/1023.
>   - Plan build: matches.
>   - The floor is not anchored.
> - **Both JS exports, offline:** exit 0. iOS has 1228 modules and Android 1691, each compiled to a Hermes `.hbc` bundle, in the ignored `.expo/export-native`. **This proves JS and Hermes only, not a device.** *(3I, 0405 review finding 2: Metro's module count varies between runs, so it doesn't identify a bundle. The 0405 review's run of the same command on the same tip printed 1533 iOS modules for the same `entry-da6fb34959063309d69f1cd38a684cb2.hbc`, and 1691 Android modules for the same `entry-7a6fabfabdc5d614f0f837dcf7833941.hbc`. Identify the bundles by those content-hashed `.hbc` filenames.)*
> - **Not run, by the brief:** `backend:test` and anything touching the database, since MB-1 owns that lane.
> - **Next:** a fresh read-only review, `backend:test` serialised later, the `HEAD` = `main` floor proof in a throwaway clone at the exact tip, the hosted run once the owner specifically approves the push, and final verification. *(3I: the review is done, the 0405 review. The floor proof is phase 3I's.)*
> - **Outputs:** [phase-3h-check-outputs.md](../../../evidence/QA-9/phase-3h-check-outputs.md), and the checkpoint's "Phase 3H" and "Commands run in phase 3H".

> **Phase 3H** *(written before its records commit, and part of it. The results come after the rebase, uncommitted. No Done is claimed)*.
> - **The review it answers:** the executed [0305 review](../../../evidence/QA-9/reviewer-final-2026-10-27T0305Z.md) of commit `3007094`. It ran `pnpm check` once on Node v22.23.1: **285 tests**, domain **536/583** and **273/313**, and 19 format files. It found **no critical, high or medium finding**, and two record lows.
> - **Codex's phase-3H brief accepts it** (acceptance (12)). Box 3 stays open, and integration into `main` isn't authorized.
> - **Both lows are fixed in place:** the box-3 row below now says 19 files, naming `contract.test.ts`, and the checkpoint's "Nothing else is uncommitted" is tagged with the two untracked files.
> - **Then:** one records commit of exactly five paths, a recheck of `main`, `git rebase main` on this branch only, the range-diff proof, the offline frozen install, `pnpm check` once, and both JS exports. There's no backend or database command, no push and no change to `main`. The checkpoint's "Phase 3H" has the brief's terms.

> **Phase 3G, after the commit** *(written after commit `300709473f12cdae800cd7b3fc25f295887e58ce`, uncommitted. These are implementer runs. No Done is claimed)*.
> - **Committed:** `3007094`, `test(QA-9): cover deterministic Git baseline histories`, 11 files, 3113 insertions and 124 deletions, on top of `4a7ee21`. The staged set was exactly the eleven paths, `contract.test.ts` stayed at 713/89, and `git diff --cached --check` was **clean**. After the commit the tree was clean, with no hook output. Not pushed.
> - **`pnpm check`, once, on that commit, Node v22.23.1: exit 0, 285 tests** (40 + 97 + 126 + 22).
>   - Format step: **19 files**, `Base: main@2a95726912c6, from 4a7ee2100bff, which adds scripts/quality/touched-format.mjs`, with **33** not JavaScript or TypeScript, as predicted.
>   - Domain: lines **535/583** (91.7667%), branches **273/313** (87.2204%), functions **106/117** (90.5983%).
>   - Mobile: 254/2076, 164/1551, 84/821 and 191/1023.
>   - Plan build: matches.
> - **So R19's fix holds on the committed state,** with `HEAD` two commits ahead of `main`. The `HEAD` = `main` and CI states are still unmeasured.
> - **R3 sample:** 535 lines, two above the 533 needed. `dates.ts:19` and `finance.ts:14` were uncovered this time, and `calculations.ts:3` and `:118` covered.
> - Outputs: [phase-3g-check-outputs.md](../../../evidence/QA-9/phase-3g-check-outputs.md), and the checkpoint's runs 7–20.

> **Phase 3G** *(written before its commit, and part of it. The results come after the commit, uncommitted. No Done is claimed)*.
> - **The stop it resolves:** phase 3F's staged `git diff --cached --check` exited 2 on 31 trailing spaces in captured Node coverage rows, so phase 3F made no commit ([its report](../../../evidence/QA-9/implementer-final-2026-10-27T0205Z.md)).
> - **Codex's decision, under AUTH-01:** strip only those trailing spaces, 12 in [phase-3d-check-outputs.md](../../../evidence/QA-9/phase-3d-check-outputs.md) and 19 in [phase-3e-check-outputs.md](../../../evidence/QA-9/phase-3e-check-outputs.md), and say so in each file's header.
> - **Done before staging:** against the staged copies, Git saw exactly 12 and 19 changed lines, and no difference once end-of-line whitespace is ignored. **No output content or figure changed.** Each header now says so.
> - **Then:** eleven named paths are staged, checked and committed once, as `test(QA-9): cover deterministic Git baseline histories`, on top of `4a7ee21`. They are phase 3F's nine, plus `phase-3f-check-outputs.md` and the 0205 report. One `pnpm check` runs after the commit, and its results are recorded after the commit.
> - **Accepted:** only the prior independent 285-test review (acceptance (11)). No new review exists for phase 3F or 3G.
> - **Still open:** the floor at the exact `main` commit, `pnpm backend:test`, both JS exports, the `HEAD` = `main` and CI re-measures, §14's mutations, and the owner's specific approval for the hosted run. QA-9 is **not Done**.

> **Phase 3F stopped before its commit** *(written after the stop, uncommitted)*. *(3G: Codex chose to strip the trailing spaces. See the block above.)*
> - **Done:** the records corrections below, and the stage of exactly the nine named paths. The stat was as expected, with `contract.test.ts` at 713/89.
> - **The stop:** `git diff --cached --check` exited 2 with **31 trailing-whitespace lines**. All of them are verbatim Node coverage rows ending in `| `, inside the ```` ```text ```` blocks of `phase-3d-check-outputs.md` (12) and `phase-3e-check-outputs.md` (19). None is in code, a test, config or the records phase 3F edited. The brief says to stop on a gate failure.
> - **So nothing was committed, and no `pnpm check` ran.** `HEAD` is still `4a7ee21`. The nine paths stay staged. The three records carry stop notes the index doesn't hold yet.
> - **Codex decides:** strip the trailing spaces and say so in each file's header, or accept them as verbatim tool output, or leave the two outputs out of the commit. Then re-add, re-check, commit once, and run `pnpm check` once. The checkpoint's "Stopped before the commit" has the exact steps, and [phase-3f-check-outputs.md](../../../evidence/QA-9/phase-3f-check-outputs.md) has the outputs.

> **Phase 3F** *(written before its commit, and part of it. The results come after the commit, uncommitted. No Done is claimed)*.
> - **The review it answers:** the executed [review of phase 3E](../../../evidence/QA-9/reviewer-final-2026-10-27T0135Z.md), persisted by the coordinator. It ran `pnpm check` once on Node v22.23.1, at `4a7ee21` plus the uncommitted test: **285 tests**, domain branches **273/313**, and **19 files** at the format step, labelled `from 4a7ee2100bff`. It found **no critical, high or medium finding**, and three lows. It ran none of §14's mutations.
> - **Codex's phase-3F brief accepts that independent R19 review**, under AUTH-01, and assigns one correction-and-local-commit phase.
> - **Low 1, corrected:** §14's mutations are now exact diffs of `snapshot-contract.ts`, each with its predicted killers. The edit the old wording allowed, `break` or `return` for `continue` at `:145`, is named as a survivor. The input that would kill it, a `HEAD` that resolves to no commit, is proposed for QA-10. Test 1 is named as a second killer of mutation 2.
> - **Low 2, corrected:** R19(b) now gives the margin in the reporter's integers. At 273/313 it absorbs one newly uncovered branch, or about seven equal-count merges, or one branch exposed by a first call. Two exposed uncovered branches fail unless six covered ones come with them. The coverage model is marked unconfirmed, so the `HEAD` = `main` and CI forecasts mean only "the margin should hold". The advice now covers any domain test change, for QA-10.
> - **Low 3, assigned to QA-10:** splitting the 80-line test. The test is unchanged.
> - **Also corrected:** the stale line numbers in R19 and in the request to S8, and §7's box-3 count, now 19 and naming `contract.test.ts`.
> - **Then:** the nine named paths are staged, inspected and committed once, as `test(QA-9): cover deterministic Git baseline histories`, on top of `4a7ee21`. One `pnpm check` runs after the commit. What happened is recorded after the commit.
> - **Still open:** the floor at the exact `main` commit, `pnpm backend:test`, both JS exports, the `HEAD` = `main` and CI re-measures, and the owner's specific approval for the hosted run. QA-9 is **not Done**.

> **Phase 3E** *(uncommitted. This is the implementer's account. No reviewer has re-run it yet, and it claims no Done)*. *(3F: the executed review of phase 3E re-ran `pnpm check` and found no critical, high or medium finding. Phase 3F commits the test.)*
> - **R19 is fixed locally, by a test only.** Codex granted a routine ownership exception for one S8 file, `packages/domain/src/contract.test.ts`. Three new tests drive `gitBaselines` through an injected, read-only, in-memory Git:
>   - `HEAD` and `main` at one fork point: one baseline, listed once;
>   - a branch ahead of `main`, with a committed rewrite, and diverged from it: both fork points, each listed once, each protecting its own history;
>   - a clone with no local `main`.
>
>   The duplicate-baseline branch is now covered whatever the host's `HEAD` and `main` are. No production code, threshold or config changed, and the live history test stays.
> - **RED,** as already observed at `4a7ee21`: 271/313 against 86.90 (phase 3D's run 18).
> - **GREEN, at `4a7ee21` plus the uncommitted test, with `HEAD` ahead of `main`, on Node 22.23.1:**
>   - the domain test: 40 of 40 pass, branches **273/313** (run 10);
>   - `pnpm check`: **exit 0, 285 tests**, with the format step at 19 files (run 11).
>
>   Outputs: [phase-3e-check-outputs.md](../../../evidence/QA-9/phase-3e-check-outputs.md).
> - **The first version measured 271/312, and that is recorded.** It held only the first two tests. A V8 block-coverage coincidence merged the loop body's range into its function's range, since both counts were 26. The final version adds two real states that nothing tested before, diverged and no local `main`. The model predicted 273/313 before the run, and the run matched ([ratchet-enforcement.md §14](../../../evidence/QA-9/ratchet-enforcement.md#14-phase-3e-r19-fixed-by-a-domain-test)).
> - **R3, from the normal outputs:** four flipping domain lines are now named. They are `calculations.ts:3` and `:118`, `dates.ts:19` and `finance.ts:14`.
> - **Not done here:**
>   - the commit, which is Codex's decision;
>   - the re-measures with `HEAD` = `main` and in CI mode, predicted at 273/313;
>   - any mutation of `snapshot-contract.ts`, which the brief forbids even temporarily;
>   - **a fresh independent review, which is next.**

> **After the commit** *(written after commit `4a7ee2100bffbfa77671017b83b1300b341a1dec`; this block and every "(after the commit)" note below are uncommitted)*.
> - **HEAD is `4a7ee21`**, the one local QA-9 commit: 44 files, not pushed.
> - **The staged `pnpm check` passed:** 282 tests, the format step's 18 files and the uncommitted label.
> - **The committed `pnpm check` failed.** The format step was as expected: 18 files, `from 4a7ee2100bff, which adds scripts/quality/touched-format.mjs`. The domain test then stopped the gate with `Error: exact branches coverage 271/313 (86.5815%) does not meet the threshold of 86.9%`.
> - **The cause is R19, high:** a domain branch that is covered only while `HEAD` equals `main`. It is not noise. QA-9 is **blocked** on Codex's decision about it, and the fix is a test in S8's `packages/domain/`, asked for below. Nothing was lowered, re-run, amended or reset.

**Outcome claimed.** Lint, types and coverage now only go up in `pnpm check`, and Prettier runs on touched files. This holds locally, on Node 22.23.1 only. Three things stay open:
- **hosted CI:** box 3's hosted run does not exist. It needs a push and a draft pull request, which need **the owner's specific approval** under docs/23 §6;
- **the floor:** it is not anchored until integration into `main`;
- **the deferred gates:** `pnpm backend:test` and the iOS and Android export, required by docs/23 §7 for this diff, must pass before integration. *(3H: the export passed on the rebased tip `c84bb4c`, JS and Hermes only. `backend:test` is still deferred, to be serialised with MB-1's database lane);*
- *(after the commit)* **R19:** at the commit, `pnpm check` fails at domain branches (271/313 against 86.90). *(3E)* With the uncommitted test, it passes at 273/313 with `HEAD` ahead of `main`. That still needs a fresh independent review, the commit, and re-measures with `HEAD` = `main` and in CI.

So QA-9 is **not complete**, and it is not marked Done.

This handoff is written in **phase 3D**, one bounded phase under Codex (AUTH-01).
- **The review it answers:** the executed [review of phase 3C](../../../evidence/QA-9/reviewer-final-2026-10-27T0005Z.md), session `aab700d3-e7ca-4d66-8f25-169ac16ec95b`. On Node 22.23.1 it passed the 97 quality tests, `pnpm check` with **282 tests**, and Prettier `--check` of the 18 files. It found **no critical or high finding**, one medium in the records and one low (R3), and called phase 3C's code and test 17 sound.
- **Codex's phase-3D brief accepts that independent code and test review**, and makes the records correction and the local commit routine Codex decisions.
- **What phase 3D did:**
  - corrected the medium finding before staging;
  - assigned the low one to QA-9's next phase;
  - then made the scoped stage, the two `pnpm check` runs and one local commit.
- **Where the detail is:** the history, every command and every decision are in [checkpoint.md](checkpoint.md). The evidence is in [ratchet-enforcement.md](../../../evidence/QA-9/ratchet-enforcement.md), with phase 3D in §13.
- *(3E)* **Phase 3E** came after it, under Codex's phase-3E brief. Its record is the block at the top, checkpoint "Phase 3E" and "Commands run in phase 3E", and ratchet-enforcement.md §14.
- *(3F)* **Phase 3F** came next, under Codex's phase-3F brief. Its record is the two phase-3F blocks at the top, checkpoint "Phase 3F" and "Commands run in phase 3F", and ratchet-enforcement.md §15.
- *(3G)* **Phase 3G** resolved phase 3F's stop, under Codex's brief after it. Its record is the phase-3G block at the top, checkpoint "Phase 3G" and "Commands run in phase 3G", and ratchet-enforcement.md §16.
- *(3H)* **Phase 3H** answered the 0305 review, then committed the records, rebased and ran the local gates, under Codex's phase-3H brief. Its record is the two phase-3H blocks at the top, checkpoint "Phase 3H" and "Commands run in phase 3H", and [phase-3h-check-outputs.md](../../../evidence/QA-9/phase-3h-check-outputs.md). By the brief's terms, ratchet-enforcement.md wasn't changed.
- *(3I)* **Phase 3I** answered the 0405 review, committed the records, and ran the floor proof in a disposable clone, under Codex's phase-3I brief. Its record is the phase-3I blocks at the top, and checkpoint "Phase 3I" and "Commands run in phase 3I". ratchet-enforcement.md wasn't changed.

## Done when

| Box | Met | Evidence |
|-----|-----|----------|
| `apps/mobile/jest.config.cjs` collects coverage from all of `src/` with thresholds at the measured values, and `pnpm check` fails when one is lowered (seen once) | **Locally. Not accepted** | `jest.config.cjs` takes its scope and thresholds from `coverage-thresholds.json`, which covers all of `src/` except `__tests__`. The thresholds are 12.23 / 10.57 / 10.23 / 18.67, as measured in phase 1. Lowering one was seen to fail in phase 2 (M1), and ratchet tests 4 and 11–14 hold it. The review of phase 3C measured the same four values independently and passed those tests. Test 12 shows the gap that stays until integration: before `main` holds the ratchet, a branch commit can lower the floor and a threshold together (R1). Phase 3D changed no scope or threshold |
| Domain coverage is measured with a threshold, and the backend inventory lists every exposed RPC with its test | **Locally. Not accepted** | Domain 91.42 / 86.90 / 90.59, enforced exactly by `exact-coverage-reporter.mjs`. The review of phase 3C measured 533/583, 272/313 and 106/117: lines **exactly on the threshold**, as in phase 3C's run 19 (R3). [rpc-test-inventory.md](../../../evidence/QA-9/rpc-test-inventory.md) lists the 9 exposed RPCs, with their gaps named in docs/23 §9 rule 3. The review checked it against the migrations itself: exactly 9 `public` functions, the 9 listed. *(After the commit)* **At `4a7ee21` the branch threshold fails:** 271/313 against 86.90 (R19). The 272 holds only while `HEAD` equals `main`. *(3E)* **With the uncommitted R19 test,** domain is 537/583 and 536/583 for lines, **273/313** for branches and 106/117 for functions, with `HEAD` ahead of `main` (runs 10 and 11). `HEAD` = `main` and CI mode are predicted at 273/313, not measured. *(3G, after the commit)* **With the test committed** in `3007094`: 535/583, **273/313** and 106/117 (run 20). `HEAD` = `main` and CI mode are still not measured. *(3H, after the rebase)* **On the rebased tip `c84bb4c`,** three commits ahead of `main@c8a5d57`: 535/583, **273/313** and 106/117 (run 30). `HEAD` = `main` and CI mode are still not measured |
| CI fails on a lint error (seen once, run linked), and the ratchet rule is in docs/23 §9 | **No** | The rule is in docs/23 §9 rule 3. Locally, `pnpm check` fails on a lint error (phase 2, M12). **No hosted run exists.** It needs the box-3 draft pull request ([ratchet-enforcement.md §7](../../../evidence/QA-9/ratchet-enforcement.md#7-phase-2e-phase-2d-review-findings-and-r14)). Pushing it and opening it need **the owner's specific approval** under docs/23 §6: `"push": true` in `var/orchestrator/config.json`, or the owner pushing by hand. *(3D, phase-3C review finding 1: this row said "Codex's specific authorisation".)* AUTH-01 delegates routine technical choices and final technical sign-off to Codex, not publication, and no existing approval covers it. The repository is public. Touched-format 17 tests the commit shape that run will check out, and §7's step 4 requires the format label and 18 files in its log. *(3H, 0305 review finding 1: since 3F, §7's step 4 requires **19** files, naming `contract.test.ts`. A rebase changes the `from` commit ID in the label.)* |

**Boxes met: 2 of 3, locally, with neither accepted.** *(After the commit)* They hold only with `HEAD` = `main`: at commit `4a7ee21`, `pnpm check` fails on box 2's domain branch threshold (R19), so neither is ready for verification. *(3E)* With the uncommitted test, `pnpm check` passes with `HEAD` ahead of `main` (run 11), so both hold locally again, by the implementer's runs. Neither is accepted. They wait for a fresh independent review and for Codex's decision to commit the test. *(3G, after the commit)* The test is committed, and `pnpm check` passes on commit `3007094` (run 20), by the implementer's run. Neither box is accepted, and box 3 is still unmet. *(3H, after the rebase)* `pnpm check` passes on the rebased tip `c84bb4c` (run 30), by the implementer's run. Neither box is accepted, and box 3 is still unmet. The card's scope line, "Prettier on touched files only", is built (phase 3), corrected (phases 3B and 3C), and reviewed with execution twice (the final review of phases 3 and 3B, and the review of phase 3C).

## Acceptance evidence

| Ledger row | Run (build or environment, date) | Result | Evidence | Row written here? |
|------------|----------------------------------|--------|----------|-------------------|
| — | — | — | QA-9 appears in no row of `docs/plan/ACCEPTANCE.md` (Grep in phase 3C: no match; phase 3D didn't touch the ledger) | No |

## Gates

| Gate | Command | Result |
|------|---------|--------|
| Quality tests | `rtk proxy node --test scripts/quality/*.test.mjs` | Independently, by the review of phase 3C: 97 of 97 pass. In phase 3D they run inside `pnpm check`, results below |
| Formatting of QA-9's own files | Prettier `--check` of `jest.config.cjs` and the 17 `scripts/quality/*.mjs`, each named | Independently, by the review of phase 3C: all match. In phase 3D the format step judges the same 18 inside `pnpm check` |
| Scoped stage | `rtk proxy git add --` and the eleven named paths; then the staged list, stat and `git diff --cached --check` | *(After the commit.)* **As expected** (runs 6–12): 44 files (6 modified, 38 added), nothing else staged, unstaged or untracked. `--check` was clean. The line counts are the earlier phases' |
| `pnpm check`, staged, before the commit, Node 22.23.1 | `rtk proxy pnpm check` | *(After the commit.)* **Exit 0, 282 tests** (37 + 97 + 126 + 22; run 13). The format step selected **18 files**, labelled `from HEAD@2a95726912c6: scripts/quality/touched-format.mjs is not committed yet`, with 26 files not JavaScript or TypeScript. Domain 533/583 (exactly the threshold), 272/313, 106/117 |
| The commit | `rtk proxy git commit`, one commit with QA-9 in the subject | *(After the commit.)* **`4a7ee2100bffbfa77671017b83b1300b341a1dec`**, `test(QA-9): coverage ratchet, gate wiring, exact domain thresholds and Prettier on touched files`: 44 files, no hook output, a clean tree after it (runs 15–17) |
| `pnpm check` after the commit, Node 22.23.1 | `rtk proxy pnpm check` | *(After the commit.)* **Exit 1** (run 18). The format step as expected: 18 files, `Base: main@2a95726912c6, from 4a7ee2100bff, which adds scripts/quality/touched-format.mjs`. The guard, typecheck and lint passed. **The domain test failed:** `Error: exact branches coverage 271/313 (86.5815%) does not meet the threshold of 86.9%` (R19), with lines 536/583 and functions 106/117. The mobile tests and the plan build did not run. The full outputs are in [phase-3d-check-outputs.md](../../../evidence/QA-9/phase-3d-check-outputs.md) |
| *(3E)* Prettier on the touched test | `rtk proxy pnpm exec prettier --check`, then `--debug-check`, then `--write`, on `packages/domain/src/contract.test.ts` only | `--check` warned (run 4), since touching the file made the gate select it. `--debug-check` reported no AST change (run 5). Written in runs 6 and 9. No other file was formatted |
| *(3E)* Domain test, Node 22.23.1, uncommitted test | `rtk proxy pnpm --filter @fitlog/domain test` | **Run 7, first version: exit 1.** 39 of 39 pass, but branches 271/312 (a V8 count coincidence, ratchet-enforcement.md §14). **Run 10, final version: exit 0.** 40 of 40 pass: 537/583, **273/313**, 106/117 |
| *(3E)* `pnpm check`, Node 22.23.1, `4a7ee21` plus the uncommitted test | `rtk proxy pnpm check` | **Run 11: exit 0, 285 tests** (40 + 97 + 126 + 22).<br>**Format step:** 19 files, `Base: main@2a95726912c6, from 4a7ee2100bff, which adds scripts/quality/touched-format.mjs`.<br>**Domain:** 536/583, **273/313**, 106/117.<br>**Mobile:** 254/2076, 164/1551, 84/821, 191/1023.<br>**Plan build:** matches.<br>These are the implementer's runs, not independent. Outputs: [phase-3e-check-outputs.md](../../../evidence/QA-9/phase-3e-check-outputs.md) |
| *(3G)* Staged set and the second commit | `rtk proxy git add --` and the eleven named paths; then the staged names, stat, numstat and `--check`; one `rtk proxy git commit` | *(After the commit, uncommitted.)* **As expected** (runs 9–19): exactly the eleven paths, `contract.test.ts` 713/89, and `--check` **clean**. Commit **`300709473f12cdae800cd7b3fc25f295887e58ce`**, 11 files, no hook output, with a clean tree after it |
| *(3G)* `pnpm check` on commit `3007094`, Node v22.23.1 | `rtk proxy pnpm check`, once | *(After the commit, uncommitted.)* **Run 20: exit 0, 285 tests** (40 + 97 + 126 + 22).<br>**Format step:** 19 files, `Base: main@2a95726912c6, from 4a7ee2100bff, which adds scripts/quality/touched-format.mjs`, 33 not JavaScript or TypeScript.<br>**Domain:** 535/583, **273/313**, 106/117.<br>**Mobile:** 254/2076, 164/1551, 84/821, 191/1023.<br>**Plan build:** matches.<br>These are the implementer's runs, not independent. Outputs: [phase-3g-check-outputs.md](../../../evidence/QA-9/phase-3g-check-outputs.md) |
| *(3H)* The records commit, the `main` recheck, the rebase and its proof | `rtk proxy git add --` the five named paths, the staged checks, one `git commit`; `git rev-parse main`, `merge-base`, `log` and `diff --name-status` since `2a95726`; `git rebase main`; `git range-diff 2a95726..<old tip> main..HEAD`; `git diff <old tip> HEAD` | *(After the rebase, uncommitted.)* **As expected** (runs 4–27). The commit is `cf99bc5`, five paths, `--check` clean. `main` is at `c8a5d57`, docs only. The rebase made `06c8220`, `557b779` and `c84bb4c`, with no conflict. Range-diff shows `=` for all three, and the old-tip diff is `main`'s 25 docs paths only |
| *(3H)* Offline frozen install, Node v22.23.1 | `rtk proxy pnpm install --frozen-lockfile --offline` | *(After the rebase, uncommitted.)* **Exit 0** (run 28). The lockfile was not resolved again, with `reused 70, downloaded 0`. `Packages: +2 -68` brought `node_modules` into line with the lockfile |
| *(3H)* `pnpm check` on the rebased tip `c84bb4c`, Node v22.23.1 | `rtk proxy pnpm check`, once | *(After the rebase, uncommitted.)* **Run 30: exit 0, 285 tests** (40 + 97 + 126 + 22).<br>**Format step:** 19 files, `Base: main@c8a5d57c3a09, from 06c822050d76, which adds scripts/quality/touched-format.mjs`, 36 not JavaScript or TypeScript.<br>**Domain:** 535/583, **273/313**, 106/117.<br>**Mobile:** 254/2076, 164/1551, 84/821, 191/1023.<br>**Plan build:** matches.<br>These are the implementer's runs, not independent. Outputs: [phase-3h-check-outputs.md](../../../evidence/QA-9/phase-3h-check-outputs.md) |
| `pnpm backend:test` | not run | **Required by docs/23 §7 for this diff**, which touches `packages/domain/` (`package.json`, 2 lines). **Deferred, not waived.** The phase-3D brief forbids the database, Supabase and Docker it needs. It must run, and pass, before integration. *(3E)* `contract.test.ts` is in `packages/domain/` too, and phase 3E's brief also allows no backend run. *(3H)* Still not run: phase 3H's brief forbids every backend, shared-database, fixture, Supabase and replay command, since MB-1 owns the database lane. It is to be serialised later, under the 0305 review's step-7 preconditions |
| Native export, iOS and Android: `pnpm --filter @fitlog/mobile exec expo export --platform ios --platform android --output-dir .expo/export-native` | *(3H)* run once, on `c84bb4c`, as `rtk proxy env EXPO_OFFLINE=1 pnpm --filter @fitlog/mobile exec expo export --platform ios --platform android --output-dir .expo/export-native` | **Required by docs/23 §7 for this diff**, which touches `apps/mobile/`: `package.json` (3 lines), `jest.config.cjs` (10 lines) and the new `coverage-thresholds.json`. ~~**Deferred, not waived.** The phase-3D brief forbids exports. Both JS exports must run, and pass, before integration~~ *(3H, after the rebase, uncommitted.)* **Run 33: exit 0**, after run 30 passed.<br>**iOS:** 1228 modules, `entry-da6fb34959063309d69f1cd38a684cb2.hbc` (4.5 MB).<br>**Android:** 1691 modules, `entry-7a6fabfabdc5d614f0f837dcf7833941.hbc` (4.8 MB).<br>Also 40 assets and `metadata.json`, in the ignored `apps/mobile/.expo/export-native`.<br>It is **JS and Hermes only**: no native build, device or simulator. This is an implementer run. If the tip changes in code before integration, re-run it.<br>*(3I, 0405 review finding 2: the module counts vary between runs, and 1228 and 1533 were both seen for the same iOS bundle. The bundles are identified by their `.hbc` filenames. A re-run that prints a different count with the same filenames is not a regression.)* *(3I: the 0405 review re-ran this export once on `c84bb4c`, exit 0, with the same two filenames and 40 assets.)* |

## Inherited and used

| From | Claim | Held? |
|------|-------|-------|
| The review of phase 3C | Phase 3C's code and test 17 are sound; 97 quality tests and `pnpm check` (282 tests) pass on Node 22.23.1 | Accepted by Codex's phase-3D brief. Phase 3D changed no code, so its two `pnpm check` runs are the next check of that claim (results after the commit) |
| The review of phase 3C, finding 1 | The records named Codex as the box-3 push approver; docs/23 §6, `INBOX.md:240` and AUTH-01 say the owner | **Confirmed** by reading `23-MASTER-PLAN.md:136-137`, `INBOX.md:239-240` and `09-PROJECT-TRACKER.md:61`. Corrected (ratchet-enforcement.md §13) |
| The review of phase 3C, finding 2 | Domain lines at 533 twice in a row, and 6 of 36 runs | **533 confirmed from the records; the 6 is not.** The records list at least 8 runs at 533 (phase 1's runs 3 and 4, phase 2B's two, phase 2C's, Codex's phase-2D run, phase 3C's run 19 and the review's). Phase 2's seven runs aren't listed one by one |
| The review of phase 3C | The 3C-M1 mutation kills only test 17 | Still the implementer's claim. The review didn't run the mutation, and phase 3D didn't either |
| *(3H)* The 0305 review | `3007094` holds exactly the 11 expected paths; its `pnpm check` passes with 285 tests, 536/583 and 273/313; `main` since `2a95726` is docs only | Accepted by Codex's phase-3H brief. Phase 3H rechecks `main` itself before the rebase, and runs `pnpm check` once on the rebased branch |
| *(3I)* The 0405 review | The rebase only moved the base; on `c84bb4c` its `pnpm check` passes with 285 tests, 536/583 and 273/313, and its export passes with the same two `.hbc` filenames; the install's lockfile is byte-identical in `node_modules`; `main` is still `c8a5d57` | Accepted by Codex's phase-3I brief. Phase 3I rechecks `main` before and after its commit, and re-measures in the disposable clone with `HEAD` = `main` |

## Mutation checks

*(3F)* **None in phase 3F**, and the review of phase 3E ran none either. Following that review's finding 1, §14 now gives five exact diffs: mutations 1, 2, 3a and 3b, each with predicted killers, and 3c, a predicted survivor. Mutation 2 has two predicted killers, test 1 in its `HEAD behind main` state and test 2's diverged case. These are predictions from reading the tests.

*(3E)* **None in phase 3E.** The brief forbids production edits, even temporary ones, so `snapshot-contract.ts` was never mutated. The tests' power to fail is argued in ratchet-enforcement.md §14, "What stays unproved". It lists three scratch-copy mutations, each with its expected failure, for the fresh review to run.

None in phase 3D: it changed no code or tests. Earlier phases' mutations (M1–M16, G1–G7, D, E, F, 2G-G1 to 2G-G12, 3-M1 to 3-M22, 3B-M1 to 3B-M9, 3C-M1) are in ratchet-enforcement.md §2 and §4–§12.

## Review findings left open

The brief forbade sub-agents, so no code-reviewer, security-reviewer or tdd-guide run happened. A self-review replaced them (checkpoint, "Phase 3D"). *(3F: the same in phase 3F, whose diff is records only. Checkpoint, "Phase 3F".)* *(3G: the same in phase 3G, whose diff is records and whitespace only. Checkpoint, "Phase 3G".)*
- *(After the commit)* **High · R19, domain branch coverage depends on Git state.**
  - **The branch:** `gitBaselines` (`packages/domain/src/cli/snapshot-contract.ts:151`) skips a baseline whose fork point it has already seen. That path runs only when `HEAD`'s fork point with `main` is `HEAD` itself.
  - **Before the commit:** every earlier recorded run in this worktree had `HEAD` = `main` = `2a95726`, since nothing was committed. That includes phase 1's measurement and run 13, and made 272/313, exactly 86.90.
  - **At `4a7ee21`:** the path is skipped (`ℹ main@2a95726912c6: checked`), branches are 271/313 (86.58%), and `pnpm check` fails.
  - **Inferred, not run:** every goal branch ahead of `main` fails the same way, and so, probably, does a CI pull-request run.
  - **The fix:** not made. The brief forbids code and threshold changes, and the file is S8's. The fix that lowers nothing is a domain test that covers the branch in any Git state (below).
  - *(3E)* **Fixed locally by that test**, under Codex's ownership exception: 273/313 with `HEAD` ahead of `main`. It waits for a fresh independent review, the commit, and the `HEAD` = `main` and CI re-measures.
- *(3E)* **New, low · R19(b): branch denominators depend on V8 execution-count coincidences.**
  - V8 drops a block range whose count equals its parent's, and Node counts the ranges that remain, so one test change can remove a branch from the count.
  - The first version of the R19 test hit this, at 271/312.
  - ~~Now both `gitBaselines` branches are covered in any state, so one such merge leaves 272/312 (87.18%), still a pass.~~ *(3F, phase-3E review finding 2: that is one direction only.)* At 273/313 the margin absorbs **one newly uncovered branch** (271/313 fails) or **about seven equal-count merges** (the eighth, 265/305, fails). A test that first calls a domain function nobody called before can also add that function's hidden branches. One uncovered one passes (273/314), but two fail (273/315) unless at least six covered ones come with them. The model behind "merges" is unconfirmed, and the review doubts one step of it (ratchet-enforcement.md §14, "Margin").
  - The residual goes with R3 to QA-9's next phase, and to QA-10 for raises. *(3F)* For QA-10, it applies to **any domain test change**, not only to `gitBaselines` calls.
- *(3I)* **The 0405 review:** no critical, high or medium finding. Both lows are in the records and fixed in phase 3I: the unnamed phase-3H report and stale uncommitted inventory, and Metro's varying module count. Its note for the owning lane, not QA-9, is under "Found for other goals".
- *(3H)* **The 0305 review:** no critical, high or medium finding. Both lows are in the records and fixed in phase 3H: the box-3 row's file count, and the checkpoint's list of uncommitted files.
- *(3F)* **The review of phase 3E:** no critical, high or medium finding. Findings 1 and 2, both low and in the records, are corrected in phase 3F (ratchet-enforcement.md §15). Finding 3, low, splitting the 80-line test at `contract.test.ts:676`, is QA-10's.
- *(3F)* **Low · a surviving mutant:** `break` or `return` for `continue` at `snapshot-contract.ts:145` passes every test, because the ref not found is always `main`, the last default ref. Only a `HEAD` that resolves to no commit would tell them apart, and no test builds it. Proposed for QA-10 with the split; Codex decides.
- **The review of phase 3C:** finding 1 (medium, records) is corrected. Finding 2 (low, R3) is assigned to QA-9's next phase. It found no critical or high finding. *(After the commit)* Runs 13 and 18 add per-line R3 data, from the spec reporter's "uncovered lines" column. The 533 run left exactly the three known lines uncovered, and the 536 run none of them.
- **R3:** domain lines sit exactly on the threshold in two runs in a row. The existing artifacts hold per-line domain data for phase 1's five runs only. They show at least two upward flips beyond the three known lines, and can't rule out a downward one. The per-line flip list is QA-9's next phase, with no threshold lowered. QA-10 owns flip-aware raises, and PL-1 the first Linux sample. *(3E)* **Four flipping lines are named from five normal outputs:** `calculations.ts:3` and `:118`, `dates.ts:19`, `finance.ts:14`.
  - 46 lines are uncovered in all five runs, and 533 is those 46 plus all four flippers.
  - Phase 2's 538 needs at least one more flipping line, among the 46.
  - The lines move independently of Git state and of the test change: runs 10 and 11 are the same code, at 537 and 536.
  - 532 is unseen in 41 runs.
- Low · from phase 3C's self-review: dropping `--topo-order` was not mutation-tested, and test 17 is not claimed to catch it.
- Low · R18(h): a merge of `main` after the rule commit over-selects. It fails safe; rebase, don't merge.
- Low · R18(i): locally, while a rename of the check is uncommitted, only uncommitted edits count. CI never sees that state.
- From earlier phases: R1–R6 and R8–R18, as in ratchet-enforcement.md §3, with owners named (PL-1, QA-10, S7 Quality, review).

## Left undone, and why

- *(3E)* **A fresh independent review of phase 3E,** which is next. It should run the domain test, `pnpm check` and §14's scratch-copy mutations. *(3F: done, except the mutations. The review ran `pnpm check`, with no critical, high or medium finding.)*
- *(3E)* **Committing the R19 test.** Codex decides; the brief forbade staging and commits. Once it is committed, the format step selects 19 files, so §7's box-3 step 4, which says 18, needs updating then. *(3F: §7 now says 19, and phase 3F commits the test.)* *(3G: phase 3F stopped before the commit. The test is committed in `3007094`, and its `pnpm check` selected 19 files.)*
- *(3E)* **R19's re-measures:** with `HEAD` = `main`, and in CI mode with `FITLOG_CONTRACT_BASELINE`. Both are predicted at 273/313, not run. *(3F: the forecasts rest on an unconfirmed model, so they mean "the margin should hold".)*
- *(3F)* **§14's mutations,** now exact diffs. Nobody has run them. A reviewer can run them on a scratch copy of `snapshot-contract.ts`, one at a time.
- **The rebase onto local `main`** (R18(h)), then `pnpm check` again with the domain line count recorded as an R3 sample. The coordinator serialises it later, and the brief forbids it here. *(3H: done. Rebased onto `main@c8a5d57` with identical patches, and `pnpm check` passed at 535/583 and 273/313.)*
- **Before integration:**
  - `pnpm install --frozen-lockfile`; *(3H: done offline, run 28)*
  - `pnpm backend:test`; *(3H: still deferred, to be serialised with MB-1's database lane)*
  - the iOS and Android export; *(3H: done, run 33, JS and Hermes only)*
  - `git show <commit>:scripts/quality/coverage-floor.json`, compared with coverage-baseline.md §5 at the exact `main` commit. *(3H: still open. The throwaway clone with `HEAD` = `main` at the exact tip does this and measures R19's `HEAD` = `main` state.)*
- *(3H)* **A fresh read-only independent review of phase 3H,** which is next. Then final verification. The goal isn't split, and no partial Done is claimed. *(3I: the review is done, the executed 0405 review, accepted as (13). Final verification is still open.)*

  docs/23 §7 requires `backend:test` and the export for this diff. No waiver exists.
- **Box 3's hosted lint-negative run.** It needs a push and a draft pull request, which need **the owner's specific approval** under docs/23 §6. Neither AUTH-01's routine delegation nor any existing approval grants publication. The pushed branch would also carry every unpushed local-`main` commit since `c8f6d7f`, into a public repository.
- **Anchoring the floor.** It needs integration into `main`.
- **R3's per-line flip list.** Assigned to QA-9's next phase.

## Found for other goals

- **The QA-9 integrator:** rebase onto `main`; don't merge it in (R18(h)). Before integration, run `pnpm backend:test` and the iOS and Android export, which docs/23 §7 requires for this diff. *(3H: rebased onto `main@c8a5d57`, and the export passed at `c84bb4c`. If `main` or the tip moves again, rebase again and re-run the gates. `backend:test` is still owed.)*
- **Any goal adding an inline snapshot:** Jest writes it without Prettier (`prettierPath: null`, pinned by the guard). Format the touched test file with `pnpm exec prettier --write`.
- **PL-1:** unchanged from earlier phases (R6, R10, R17, AR-1 L1/L4). The first hosted pull-request run, once the owner approves the push, will be the first real run of the merge shape that touched-format 17 builds.
- **The owner inbox (owner-concierge):** box 3's push and draft pull request wait on the owner's specific approval. This lane doesn't edit `INBOX.md`.
- *(3I, from the 0405 review, for the lane that owns `scripts/backend/`, through Codex; not QA-9's):* `verify-gym.mjs:51` checks only that gym staff can't **read** health rows. Staff **writes** are covered only by the generic forged-write check at `verify.mjs:35`, not by a staff-role test. The rule is PRD 16.1 and frozen003: gym staff never read or write a member's private health data, whatever the consent. That rule overrides any stale agent text saying otherwise, and the override stays in force until QA-2 is merged and the checkout the agents launch from is corrected. Read only by the reviewer; phase 3I didn't open those files.
- *(3F)* **QA-10:**
  - **Split** the 80-line test at `packages/domain/src/contract.test.ts:676` into its three cases, as Codex assigned it (phase-3E review finding 3). The number of `gitBaselines` calls stays the same.
  - **After any domain test change,** compare the branch numerator and denominator, not only the pass. At 273/313 the margin is one newly uncovered branch (R19(b)).
  - **Proposed, for Codex to decide:** a case where `HEAD` resolves to no commit, which would kill the surviving `break` at `snapshot-contract.ts:145` (§14, mutation 3c).

## Requests for other lanes' files

Phase 3D changed only QA-9's records.

*(3E)* **For S8 Member backend, for information, through Codex.** The request below was carried out in phase 3E, under Codex's routine ownership exception for `packages/domain/src/contract.test.ts` alone. Codex is the decision-maker under AUTH-01.
- **What changed in S8's file:**
  - a Git double and three tests;
  - two imports;
  - the whole file formatted with Prettier 3.6.2, as QA-9's format step requires of any touched file.
- **What did not:** no existing assertion, and no production file.
- **For S8 from now on:** the file now runs through the format step whenever it's touched. Its `gitBaselines` coverage also depends on call counts (R19(b)), so adding or removing a default-refs `gitBaselines` call is worth a coverage check. *(3F, phase-3E review finding 2: widened.)* **Any domain test change** is worth a check of the branch numerator and denominator. A merge or a first call can move the count, and the margin is one newly uncovered branch.

*(After the commit)* **To S8 Member backend, through Codex: `packages/domain/src/contract.test.ts`** (R19).
- **The ask:** add a test that drives `gitBaselines` (`src/cli/snapshot-contract.ts:129-157`) to meet the same fork point twice whatever the checkout's Git state. For example, use its injected `git` parameter, with `HEAD` and `main` resolving to one commit. Assert the note `…: same commit as an earlier baseline` and a single source.
- **Why:** today only the real-Git calls at `contract.test.ts:117` and `:194` reach that branch, and only while `HEAD` equals `main`. *(3F: those are the numbers in `4a7ee21`, before phase 3E formatted the file. Today the calls are at `:214` and `:399`.)* On any commit ahead of `main`, domain branches are 271/313, below QA-9's 86.90 threshold, and `pnpm check` fails.
- **The rule:** the threshold must not be lowered to make room.

## Decisions forced in phase 3H

- **A rebase, not a merge,** as Codex chose under docs/23 §6. Codex's brief made it a routine technical choice. The rebase moved only the goal branch, and `main` stayed at `c8a5d57`.
- **The records commit came before the rebase,** so the tree was clean. The results of the rebase and the gates can't be inside the commits they describe, so they stay uncommitted.
- **The install's `+2 -68` was recorded, not investigated.** The install was offline and frozen, and it downloaded nothing. The brief stops only on a missing store package or a network need, and neither happened.
- **Five trailing spaces were left out of the captured coverage rows,** as in phase 3G, so the outputs file passes `--check`. Its header says so.
- **`git config --get core.hooksPath` was denied.** Instead, the commit and rebase outputs were read for hook output, and there was none.

## Decisions forced in phase 3G

- **Codex chose; this phase carried it out.** The decision to strip the trailing spaces is Codex's, from phase 3F's three options. Only the 31 trailing spaces changed, and each output's header says so.
- **Historical reports were left as written.** The 0205 report still says the spaces are present and the nine paths staged. That was true when it was written, and the checkpoint's row for it says so.
- **Stale lines were tagged, not rewritten.** That covers §15's count of 31 (now 33), `phase-3f-check-outputs.md`'s "untracked" and "didn't remove them", and phase 3D's "Committed?" row, through its normalization note.
- **`git hash-object` was denied.** The proof that only whitespace changed is the `--numstat` and `--ignore-space-at-eol` diffs against the staged copies instead.

## Decisions forced in phase 3F

- **Tagged, not rewritten.** The old mutation bullets and the one-direction margin are struck through, with the corrections beside them. Phase 3D's line numbers are kept as the committed file's, with today's added.
- **The surviving mutant is named, not fixed.** Killing it needs a new test, and the brief allows no test change, so it is proposed for QA-10.
- **The old line numbers were not re-derived from `4a7ee21`.** The `git grep` was denied. Today's numbers were read from the working file.

## Decisions forced in phase 3E

- **Real states, not padding,** after the first version measured 271/312. The two added cases are states nothing tested before: diverged from `main`, and no local `main`. Each asserts a behaviour a caller depends on. The 271/312 run and its cause are kept in the record, not hidden.
- **The whole test file was formatted.** The format step requires every touched JavaScript and TypeScript file to match Prettier in full. Formatting only the new lines would fail the gate.
- **No mutation of production code,** even temporarily, by the brief's terms. The expected mutation results are written down for the review instead.
- **The diagnostic lcov run was denied.** The coverage analysis rests on the normal outputs and a model of V8's range merging, and the model's prediction was checked by the next run.

## Decisions forced, after the commit

- **The commit was kept** after the committed `pnpm check` failed: not amended, reset or reverted. The brief permits one local commit, and the failure is a finding about Git state, not about the commit's content.
- **R19 was not re-run to confirm it.** The two required runs' own diagnostics, read against the source, show the mechanism.

## Decisions forced (for the tracker decision log)

- **The box-3 approver is the owner, not Codex** (phase-3C review finding 1). This records docs/23 §6 and the limits of AUTH-01. It doesn't create a new rule.
- **Historical phase lists were tagged, not rewritten.** Their wrong approver is struck through or tagged in place, so the history stays readable and no live line misleads. The verbatim finals are unchanged.
- **The R3 count correction went into ratchet-enforcement.md §13, not `coverage-baseline.md`,** because guard test 2 reads that file.

## Traps hit

- **Bash is allowlisted to `rtk proxy` forms.** A compound command, a bare `rtk git status` and `rtk proxy wc -l` were denied, and none was worked around.
- **Results can't be in the commit they describe.** The checks run on the staged state and on the commit, so their results are written after the commit and stay uncommitted.
- *(3E)* **Coverage counts that coincide.** A correct test that covered the missing branch still failed the gate (271/312), because V8 merged an equal-count range. Check the denominator too, not just whether the branch is covered.
- *(3E)* **A touched file is formatted whole.** Editing an S8 file pulled the whole file into the format step.
- *(After the commit)* **A threshold measured with nothing committed.** Every QA-9 measurement ran with `HEAD` = `main`, so a coverage branch that depends on Git state stayed hidden until the first commit. The committed-boundary check found it, which is what that check is for.
