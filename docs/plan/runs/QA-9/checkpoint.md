# Checkpoint — QA-9 · Lint, type and coverage gates that only go up

| Field | Value |
|---|---|
| Phase | Attempt 1. Phase 1 (measure, inventory, propose), phase 2 (enforce the ratchet), phase 2B (fix the independent review), phase 2C (fix the phase-2B review), phase 2D (fix the phase-2C review; close R8 and R11 in `apps/mobile`), phase 2E (fix the phase-2D review's four low findings; close R14), phase 2F (fix the phase-2E review's two low Unicode findings; close R16 narrowly inside `src/`; add the phase-2D review's three test gaps) phase 2G (fix all three low findings of the source-only phase-2F review: line breaks in declaration names, UTF-16 files, JavaScript in source) and **phase 3 (the card's "Prettier on touched files only", with Prettier 3.6.2 as an exact root devDependency; and the records fix the executed phase-2G review asked for)** are done. Codex accepted the phase-2G review in its phase-3 brief. **Phase 3B** (the source-only phase-3 review's medium finding fixed test-first, `prettierPath: null` as Codex chose, finding 3 recorded as R18(h), finding 4's records corrected) is done. ~~**Phases 3 and 3B await an independent review that can run commands**~~ *(Done: the executed final review, below.)* **Phase 3C** (the three lows of the executed final review of phases 3 and 3B: touched-format test 17 for GitHub's merge shape, killed by a `--first-parent` mutation; the box-3 log checklist's format label; the handoff's `backend:test` and export rows restated as required and deferred) is done. ~~**Phase 3C awaits Codex's staging and committed-boundary check, and has no independent review yet**~~ *(3D: the executed review of phase 3C found no critical or high finding, and Codex's phase-3D brief accepts it.)* **Phase 3D** resolves that review's medium records finding: the box-3 push needs the owner's specific approval, not Codex's. It assigns the review's low R3 finding to QA-9's next phase. Then it makes the scoped local stage, the two `pnpm check` runs and the one local commit. **Phase 3E** (uncommitted) fixes R19, the high finding the committed `pnpm check` raised. The fix is a domain test only, under Codex's routine ownership exception for `packages/domain/src/contract.test.ts`. It also names R3's flipping lines from the normal outputs (below, "Phase 3E"). **Phase 3F** answers the executed review of phase 3E, which Codex's phase-3F brief accepts (acceptance (11)). It corrects that review's two low records findings and the stale records, assigns its test-split finding to QA-10, then stages nine named paths and makes a second local commit (below, "Phase 3F"). *(After the stop: the records corrections and the stage are done. The commit is not, because the staged `--check` failed on whitespace in verbatim outputs. See "Stopped before the commit")* **Phase 3G** resumes it under Codex's brief after the stop. Codex chose to strip only the trailing spaces from the 31 captured coverage rows and note it in both files' headers. Phase 3G then stages eleven paths, makes the second local commit and runs `pnpm check` once (below, "Phase 3G"). **Phase 3H** answers the executed [0305 review](../../../evidence/QA-9/reviewer-final-2026-10-27T0305Z.md) of `3007094`, which Codex's phase-3H brief accepts (acceptance (12)). It fixes that review's two record lows and commits the five uncommitted records paths once. Then it rebases the branch onto local `main`, and runs the offline install, `pnpm check` once and both JS exports (below, "Phase 3H"). **Phase 3I** answers the executed [0405 review](../../../evidence/QA-9/final-2026-10-27T0405Z.md) of the rebased `c84bb4c`, which Codex's phase-3I brief accepts (acceptance (13)). It fixes that review's two record lows and commits the five uncommitted records paths once. Then it runs the floor proof once in a disposable clone outside every repository, with `HEAD` = `main` at the new tip inside the clone only (below, "Phase 3I"). *(After its stop: the records commit is done; the floor proof stopped at a denied `mkdir`.)* **Phase 3J** resumes that floor proof under Codex's phase-3J brief, which accepts `961e1f4` as five scoped records paths only (acceptance (14)). It runs once, in phase 3I's kept folder, with an allowed `mkdir` of the empty template and hooks, a local clone at `961e1f4`, `main` = `HEAD` inside the clone only, an offline frozen install with `--ignore-scripts` and one `pnpm check`. No commit is made (below, "Phase 3J"). **Phase 3K** is records only, under Codex's phase-3K brief, which accepts the independent floor proof in the [0535 review](../../../evidence/QA-9/final-2026-10-27T0535Z.md) (acceptance (15)). It records Codex's decisions on that review's Low 1 and Low 2, fixes Low 3 and Low 4 in these records, and captures PL-1's new H1. No code, test, gate, stage, commit or clone command (below, "Phase 3K"). **Phase 3L** is one bounded local CI-mode gate under Codex's phase-3L brief. It runs `pnpm check` once in this worktree, with `CI=true` and `FITLOG_CONTRACT_BASELINE` set to the exact `main` commit `c8a5d57c3a0999760ad21fd1aca4899ca76b5adf`. That is a local CI-mode proof only, not hosted CI. No code, config, floor, dependency or commit change (below, "Phase 3L"). **Phase 3M** is records only, under Codex's phase-3M brief, which accepts the 0705 review's independent audit of phase 3L's local CI-mode proof (acceptance (16)). It fixes that review's four lows in the records, adds phase 3L's final-state list, and names the 0635 and 0705 finals. Then, after a fresh inventory and a staged `--check`, it makes one records-only local commit of the eleven owned records paths. There is no code, config, floor, lockfile, gate, test, install, clone, rebase or export (below, "Phase 3M") |
| Date | 26 October 2026; phases 3, 3B, 3C, 3D, 3E, 3F, 3G, 3H, 3I, 3J, 3K, 3L and 3M on 27 October 2026 |
| Worktree | `/Users/Adya/.codex/worktrees/fitlog-qa9/fitness_app`, branch `codex/qa9-quality-ratchets`, based on `main` at `2a95726` (AR-1 Done) |
| Lane | S7 Quality |
| Executor | A local Claude session working for Codex, the final decision-maker under AUTH-01. No owner questions were raised. No sub-agents or other workers ran, in any phase. In phases 2C, 2D, 2E and 2F that included the code-reviewer, security-reviewer and tdd-guide self-reviews the goal-implementer brief asks for: Codex's instruction forbade sub-agents. A self-review by this session replaced them. In 2D it found one gap, fixed and mutation-checked (D14). In 2E it found no code defect and named one new residual (R16); the phase-2E review then found two it had missed. In 2F it found no code defect after the fixes; the phase-2F review then found three lows it had missed. **Phase 2G** was a new local Claude session (`41abab03-da38-402e-9cb0-c0483d9b9af3`), since Codex's brief retired the phase-2F writer session `31abe500`. Codex's brief again forbade sub-agents, so a self-review replaced the three reviews (below). **Phase 3** was another new local Claude session (`287f647f-b235-44cd-9804-676b8e566c57`). Codex's brief forbade sub-agents again, so a self-review replaced the code-reviewer, security-reviewer and tdd-guide runs. **Phase 3B** was another new local Claude session, launched as `goal-implementer` in `dontAsk` mode with an explicit allowlist. Its tool-results folder names session `1e2bed82-07fa-43fe-9eae-9aba2995f855`. Codex's brief forbade sub-agents, so a self-review again replaced the three reviews. **Phase 3C** was another new local Claude session, launched as `goal-implementer` in `dontAsk` mode, whose `rtk proxy` commands were allowed and other Bash forms denied. Its tool-results folder names session `de350e6e-5af0-4152-96a1-ef3baffd7a32`. Codex's brief forbade sub-agents, so a self-review again replaced the three reviews (below). **Phase 3D** was another new local Claude session, launched as `goal-implementer` in `dontAsk` mode. Its `rtk proxy` commands were allowed in the forms listed under "Commands run in phase 3D", and other Bash forms were denied. Codex's brief forbade sub-agents, so a self-review again replaced the three reviews (below). **Phase 3E** was another new local Claude session, launched as `goal-implementer` in `dontAsk` mode. Its tool-results folder names session `240bec18-9fd3-4f9b-b90a-c12c35a3123e`. Its allowed `rtk proxy` forms are under "Commands run in phase 3E". Codex's brief forbade sub-agents, so a self-review again replaced the three reviews. **Phase 3F** was another new local Claude session, launched as `goal-implementer` in `dontAsk` mode. Single `rtk proxy` commands were allowed, and the forms that weren't are under "Commands run in phase 3F". Codex's brief forbade sub-agents, so a self-review again replaced the three reviews. **Phase 3G** was another new local Claude session, under Codex's brief after the phase-3F stop. Its allowed and denied forms are under "Commands run in phase 3G". Codex's brief forbade sub-agents, so a self-review again replaced the three reviews. **Phase 3H** was another new local Claude session, launched as `goal-implementer` in `dontAsk` mode under Codex's phase-3H brief. Its allowed and denied forms are under "Commands run in phase 3H". Codex's brief forbade sub-agents, so a self-review again replaced the three reviews. **Phase 3I** was another new local Claude session, under Codex's phase-3I brief. Its session ID and allowed and denied forms are under "Commands run in phase 3I". Codex's brief forbade sub-agents and any dispatcher, so a self-review again replaced the three reviews. **Phase 3J** was another new local Claude session, launched as `goal-implementer` in `dontAsk` mode under Codex's phase-3J brief. Its session ID, `62ebc6ab-7078-4826-9214-f1871d560324`, is named in the path of its background task's output file. Its allowed and denied forms are under "Commands run in phase 3J". Codex's brief forbade sub-agents and any dispatcher, so a self-review again replaced the three reviews. **Phase 3K** was another new local Claude session, launched as `goal-implementer` in `dontAsk` mode under Codex's phase-3K brief. Its session ID wasn't visible to it. Its allowed forms are under "Commands run in phase 3K". Codex's brief forbade sub-agents and any dispatcher, so a self-review again replaced the three reviews. **Phase 3L** was another new local Claude session, launched as `goal-implementer` in `dontAsk` mode under Codex's phase-3L brief. Its session ID, `fcdc094a-2ab4-41c2-a1a9-82f0c1f558a9`, is named in the path of its background task's output file. Its allowed and denied forms are under "Commands run in phase 3L". Codex's brief forbade sub-agents, dispatch and launch scripts, so a self-review again replaced the three reviews. **Phase 3M** was another new local Claude session, working as `goal-implementer` under Codex's phase-3M brief. The brief records that the phase's first session, `31e5af66`, stopped at an account limit with no change, test or commit. This session's own ID wasn't visible to it. Its commands are under "Commands run in phase 3M". Codex's brief forbade sub-agents, dispatch and launch scripts, so a self-review again replaced the three reviews |
| **QA-9 status** | **Not complete.** Three things stay open. (1) **Hosted CI:** box 3's hosted run is unproved. *(3D)* It needs a push and a draft pull request, which need the owner's specific approval under docs/23 §6. Neither AUTH-01 nor any existing approval covers publication. (2) **The floor:** the initial floor is not anchored; that needs integration into `main`, checked at the exact merge commit. (3) **The committed boundary:** ~~nothing is committed, and the format step has never selected the 18 committed files in this repository. Codex stages and checks that after this handoff.~~ *(3D)* phase 3D stages the QA-9 paths, checks them, commits once locally and checks again. The results are recorded after the commit, under "Phase 3D". The executed review of phase 3C found no critical or high finding, and passed `pnpm check` with 282 tests. *(After the commit, uncommitted.)* (4) **R19, high:** at commit `4a7ee21`, `pnpm check` fails at domain branches, 271/313 against 86.90. The 272 every earlier run measured holds only while `HEAD` equals `main`. *(3E, uncommitted)* **R19 fixed locally by a test:**
- three tests in `contract.test.ts` cover the branch through an injected Git, in any host state;
- at `4a7ee21` plus the uncommitted test, with `HEAD` ahead of `main`, domain branches are **273/313** and `pnpm check` passes (285 tests);
- these are implementer runs. The `HEAD` = `main` and CI states are predicted, not run, and no fresh independent review exists yet.

*(3F)* The executed review of phase 3E reproduced the pass independently: 285 tests and 273/313 on Node v22.23.1, with no critical, high or medium finding. Codex accepts it. Phase 3F corrects the records and commits the test locally, and the result is recorded after the commit. The forecasts for `HEAD` = `main` and CI now mean only "the margin should hold" (R19(b), restated).

*(3G, written after the commit, uncommitted.)* **The R19 test is committed** in `300709473f12`, the second local QA-9 commit. On that commit, with a clean tree, `HEAD` two commits ahead of `main` and Node v22.23.1, `pnpm check` **passes once: 285 tests**, domain **535/583**, **273/313** and **106/117**, and 19 format files labelled `from 4a7ee2100bff` (run 20). That is an implementer run, not independent. The `HEAD` = `main` and CI states are still unmeasured.

*(3H, written after the rebase, uncommitted.)* **Rebased onto local `main@c8a5d57`**, with no conflict and every patch identical (range-diff `=` three times). The tip is now `c84bb4c`. On it, with a clean tree and Node v22.23.1:
- the offline frozen install passed;
- `pnpm check` **passed once**, with 285 tests, domain **535/583**, **273/313** and **106/117**, and 19 format files labelled `Base: main@c8a5d57c3a09, from 06c822050d76`;
- **both JS exports passed**, JS and Hermes only.

These are implementer runs. Still open: `backend:test`, the `HEAD` = `main` floor proof, the hosted run and final verification.

*(3I, written before its records commit.)* The executed 0405 review reproduced phase 3H independently on `c84bb4c`: 285 tests, 273/313, and both JS and Hermes exports, with no critical, high or medium finding. Codex accepts it (acceptance (13)). Phase 3I commits the records, then runs the `HEAD` = `main` floor proof once in a disposable clone. Its results are written after the run, uncommitted. Box 3 stays open.

*(3I, written after the commit and the stop, uncommitted.)* **The records are committed** in `961e1f41104e414f045d5a9a42e8e9ca44acf083`, exactly five paths, with `main` still at `c8a5d57`. **The floor proof didn't run.** `mkdir` was denied inside the disposable folder, and the sequence stopped there by the brief's rule. So the `HEAD` = `main` floor, the 0 format files and R19's `HEAD` = `main` state are still unmeasured. The floor file's values at `961e1f4` equal coverage-baseline.md §5, by reading only.

*(3J, written after the gate, uncommitted.)* **The floor proof ran once, at `HEAD` = `main`, in a disposable local clone at `961e1f4`.** `main` was moved inside the clone only, and this repository's `main` stayed at `c8a5d57`. After an offline frozen install with `--ignore-scripts` (`downloaded 0`), `pnpm check` **passed once on Node v22.23.1, with 285 tests**:
- the format step selected **0 files**, labelled `Base: main@961e1f41104e`;
- the guard counted 1 Git baseline and printed no "not anchored" line, so the floor counts as anchored in the clone;
- domain coverage was **535/583, 273/313 and 106/117**, which is R19's `HEAD` = `main` state, measured for the first time;
- the floor is byte-identical at both clone refs and in this worktree, and its values equal §5.

These are implementer runs. Still open: a fresh independent review, `backend:test`, CI mode, the hosted run (box 3) and final verification. Integration into the real `main` is still the only real anchoring.

*(3K, records only, uncommitted.)* **The independent 0535 review reproduced the floor proof, and Codex accepts it** (acceptance (15)). It ran `pnpm check` once, on Node v22.23.1, in the kept clone `/var/folders/0s/4k0smcx56zl9hdj404qnz2s80000gp/T/fitlog-qa9-floor.dGGhev2tS6/clone`, at `HEAD` = `main` = `961e1f4`:
- exit 0 with **285 tests**, and **0 format files**;
- the floor anchored in the clone;
- domain **536/583, 273/313 and 106/117**.

It found **no critical, high or medium finding**. Those runs are the review's, inherited here. **Executed in phase 3K:** the floor blob at `HEAD` is `0036eedaf6de63003294b9ff7aa3ef157ab57c74`, and **the real `main`, `c8a5d57`, has no floor file**, so it's still unanchored. Still open: the real `main`'s floor, `backend:test`, CI mode, box 3's hosted run, and exact integration with final verification. No Done is claimed.

*(3L, written after the gate, uncommitted.)* **Local CI mode measured once.** In this worktree at `961e1f41104e414f045d5a9a42e8e9ca44acf083`, on Node v22.23.1, `rtk proxy env CI=true FITLOG_CONTRACT_BASELINE=c8a5d57c3a0999760ad21fd1aca4899ca76b5adf pnpm check` **passed once, exit 0, with 285 tests** (40 + 97 + 126 + 22). The baseline is exactly the actual `main` and the fork point:
- the guard and the format step both used `FITLOG_CONTRACT_BASELINE@c8a5d57c3a09`, with 1 Git baseline, and the guard reported **the floor not anchored**, which is true of the real `main`;
- the format step selected **19 files**, `from 06c822050d76, which adds scripts/quality/touched-format.mjs`;
- domain coverage was **537/583, 273/313 and 106/117**, which is R19's CI-mode state, measured for the first time;
- mobile was 254/2076, 164/1551, 84/821 and 191/1023, and the plan build matches.

This is an implementer run, and a **local CI-mode proof only, not hosted CI**: `GITHUB_ACTIONS` was unset, and it ran on macOS with this worktree's existing `node_modules`. Still open: the real `main`'s floor, `backend:test`, box 3's hosted run, and exact integration with final verification. No Done is claimed.

*(3M, records only, written before its records commit, and part of it.)* **The independent 0705 review audited phase 3L's local CI-mode proof, and Codex accepts it** (acceptance (16)). The review re-ran nothing. It checked phase 3L's raw output and transcript, found every figure supported, and found **no critical, high or medium finding**. Its four record lows are fixed in place in phase 3M. Then the eleven owned records paths are committed once, records only, so the floor blob stays `0036eedaf6de63003294b9ff7aa3ef157ab57c74` and no new gate is owed. The proof is still a local CI-mode implementer run, now independently audited. It isn't hosted CI. Still open: `backend:test`, the real `main`'s floor, box 3's hosted run, and exact integration with final verification. No Done is claimed.

*(As phase 3D wrote it, continued.)* The format step's committed boundary itself held: 18 files, labelled with the commit. Prettier on touched files is built (phase 3) and corrected (phases 3B and 3C). The executed final review of phases 3 and 3B found no critical, high or medium finding and passed `pnpm check` with 281 tests. `pnpm backend:test` and both JS exports are required by docs/23 for this diff, and are deferred to before integration, with no waiver |
| Git | ~~**Nothing is committed.**~~ *(3D)* **Nothing was committed through phase 3C.** By instruction there was no commit, push, status, ACCEPTANCE or GOALS change, and every change below was in the working tree. **Phase 3D**, as Codex's brief permits, stages exactly the eleven named QA-9 paths and makes one local commit with QA-9 in the subject. There is no push, rebase, merge or integration. What actually happened is recorded under "Phase 3D", written after the commit. *(After the commit, uncommitted.)* **Committed: `4a7ee2100bffbfa77671017b83b1300b341a1dec`**, 44 files, on `codex/qa9-quality-ratchets`, one commit ahead of `main@2a95726`. Not pushed. The records written after it are uncommitted: this file, `handoff.md` and `ratchet-enforcement.md` are modified, and `phase-3d-check-outputs.md` is new. *(3E)* Also uncommitted:
- `packages/domain/src/contract.test.ts`, modified;
- `phase-3e-check-outputs.md`, new;
- `implementer-final-2026-10-27T0035Z.md`, phase 3D's report, persisted by Codex. It is untracked, and phase 3E read it and did not change it.

Phase 3E staged and committed nothing, and `HEAD` is still `4a7ee21` (run 14). *(3F)* **Phase 3F** stages exactly nine named paths: the R19 test, the three records, both check-output files, both implementer finals and the phase-3E review. It makes one local commit on top of `4a7ee21`, which it keeps, with no amend, reset, rebase, push or integration. What actually happened is written after the commit, under "Phase 3F". *(After the stop, uncommitted.)* **No commit was made.** The nine paths are staged, but the staged `--check` failed on trailing whitespace in the two verbatim check-output files, so the phase stopped (run 14). `HEAD` is still `4a7ee21`. The stop notes in this file and the handoff, and the new `phase-3f-check-outputs.md`, are not staged. *(3G)* **Phase 3G** keeps `4a7ee21`, re-stages eleven named paths (phase 3F's nine, plus `phase-3f-check-outputs.md` and `implementer-final-2026-10-27T0205Z.md`), and makes one local commit on top of it, with no amend, reset, rebase, push or integration. What actually happened is written after the commit, under "Phase 3G". *(After the commit, uncommitted.)* **Committed: `300709473f12cdae800cd7b3fc25f295887e58ce`**, `test(QA-9): cover deterministic Git baseline histories`, 11 files, on top of `4a7ee21`. The branch is two commits ahead of `main@2a95726`, and nothing is pushed. Written after it, uncommitted: this file and `handoff.md` are modified, and `phase-3g-check-outputs.md` is new. *(3H)* **Phase 3H** commits the five uncommitted records paths once (the two records, `phase-3g-check-outputs.md`, the 0235 report and the 0305 review), with no amend, reset or stash. Then it rebases `codex/qa9-quality-ratchets`, and only that branch, onto local `main` with `git rebase main`. On a conflict it aborts and stops. It doesn't move `main` and doesn't push. The old and new commit IDs are recorded after the rebase, under "Phase 3H". *(After the rebase, uncommitted.)*
- **Records commit:** `cf99bc54febe6d2efdb88bd9cb5e0eeb5898a49b`, five files.
- **Rebased with no conflict.** Old → new: `4a7ee21` → **`06c822050d7610223bf7b76fd76842a90368fcde`**, `3007094` → **`557b779f9428b91158335b4370c071d2580d6994`**, `cf99bc5` → **`c84bb4cd1639d528779c9cc52e8a1540d0ae1ebc`**.
- **The branch** is three commits ahead of `main@c8a5d57c3a0999760ad21fd1aca4899ca76b5adf`, which didn't move. Nothing is pushed.
- **Written after it, uncommitted:** this file and `handoff.md`, modified, and `phase-3h-check-outputs.md`, new. *(3I: and, saved later by the coordinator, `final-2026-10-27T0335Z.md` and `final-2026-10-27T0405Z.md`, both new.)*

*(3I)* **Phase 3I** stages exactly those five paths, each named, and makes one local records commit on top of `c84bb4c`, with no amend, reset, rebase, stash or push. `main` must stay at `c8a5d57`. The floor proof then runs in a disposable clone outside every repository, where `main` is set to the clone's `HEAD`; no branch or ref in this repository moves. What actually happened is recorded after the commit, under "Phase 3I". *(After the commit and the stop, uncommitted.)*
- **Records commit:** **`961e1f41104e414f045d5a9a42e8e9ca44acf083`**, `docs(QA-9): record phase 3H results and the 0405 review`, parent `c84bb4c`, five files, 717 insertions and 18 deletions, with no hook output.
- **The branch** is four commits ahead of `main@c8a5d57c3a0999760ad21fd1aca4899ca76b5adf`, which didn't move. Nothing is pushed, and no ref other than this branch moved.
- **No clone was made.** The disposable folder exists and holds no file.
- **Written after it, uncommitted:** this file and `handoff.md`, modified, and `phase-3i-check-outputs.md`, new. *(3J: and, saved later by the coordinator, `final-2026-10-27T0435Z.md`, new.)*

*(3J)* **No commit, by the brief.** No ref in this repository moved: `HEAD` is `961e1f4` and `main` `c8a5d57`, before and after (runs 3, 22, 37 and 42). The only refs that moved are the clone's own, inside the disposable folder: its `main`, made at `961e1f4` by `checkout -B`. Uncommitted after phase 3J: this file and `handoff.md`, modified, and three untracked files: `phase-3i-check-outputs.md` and `final-2026-10-27T0435Z.md`, both unchanged by phase 3J, and the new `phase-3j-check-outputs.md`. *(3K, 0535 review Low 4: no longer complete. After phase 3J ended, the coordinator saved two more untracked files, `final-2026-10-27T0505Z.md` and `final-2026-10-27T0535Z.md`.)*

*(3K)* **No commit or stage, by the brief, and no ref moved:** `HEAD` is `961e1f41104e414f045d5a9a42e8e9ca44acf083` and `main` `c8a5d57c3a0999760ad21fd1aca4899ca76b5adf` (runs 3 and 9). The exact inventory is **seven uncommitted paths** (runs 2 and 10). Two are modified: this file and `handoff.md`. Five are untracked, with their sha256 values from runs 4 and 8, unchanged across the phase:
- `docs/evidence/QA-9/final-2026-10-27T0435Z.md`, phase 3I's final report: `d139b6f5765a317f6ed37b5f70e73e8d867b18d0ea98944584c2fab75bb76943`;
- `docs/evidence/QA-9/final-2026-10-27T0505Z.md`, **phase 3J's final report, from the implementer**: `5f779f6c4e992c7f01b2a81d374fb49eae005d2ab6fe4c79cd6789bfda7dee23`;
- `docs/evidence/QA-9/final-2026-10-27T0535Z.md`, **the 0535 review, the independent review of phase 3J**: `62b452203d564d01840f515cc1304d5c95ca76c1038f4fec0349ce7732c582b7`;
- `docs/evidence/QA-9/phase-3i-check-outputs.md`, phase 3I's outputs: `1b6964c1c16760c663ae7de29fd326b3540c4c5e08e2bc5224251fbc2ab5cd03`;
- `docs/evidence/QA-9/phase-3j-check-outputs.md`, phase 3J's outputs: `73431e58f7f5259e807c6714450ecee38ff725bb09715a05f13814f83cd3bc51`

*(3L)* **No commit or stage, by the brief, and no ref moved:** `HEAD` is `961e1f41104e414f045d5a9a42e8e9ca44acf083` and `main` `c8a5d57c3a0999760ad21fd1aca4899ca76b5adf`, before and after the gate (phase 3L's runs 2 and 18). Before the gate there were **eight uncommitted paths**: phase 3K's seven, plus `docs/evidence/QA-9/final-2026-10-27T0605Z.md`, **phase 3K's final report from the implementer**, which the coordinator saved after phase 3K. It is untracked, with sha256 `2a0eb9db7fdcde0f4073d77c404cc850160ce7d66b09f8319bbeb96886619a7a`. The gate left the inventory exactly as it was (runs 9 and 16, and the ignored folders in runs 10 and 17). All eight paths' hashes, and those of the floor, coverage-baseline.md and the lockfile, were unchanged across it (runs 11 and 19). After the gate, phase 3L wrote `docs/evidence/QA-9/phase-3l-check-outputs.md`, new and untracked, and edited this file and `handoff.md`. So **nine uncommitted paths** remain: two modified and seven untracked. *(3M, from the 0705 review's note: no longer complete. After phase 3L ended, the coordinator saved `final-2026-10-27T0635Z.md`, and later `final-2026-10-27T0705Z.md`.)*

*(3M)* **The fresh inventory, before any edit (runs 2–7):** `HEAD` is `961e1f41104e414f045d5a9a42e8e9ca44acf083` and `main` `c8a5d57c3a0999760ad21fd1aca4899ca76b5adf`. There are **eleven uncommitted paths**, all under `docs/evidence/QA-9/` or `docs/plan/runs/QA-9/`. Two are modified: this file and `handoff.md`. Nine are untracked, with their sha256 values from run 7:
- `docs/evidence/QA-9/final-2026-10-27T0435Z.md`, phase 3I's final report: `d139b6f5765a317f6ed37b5f70e73e8d867b18d0ea98944584c2fab75bb76943`;
- `docs/evidence/QA-9/final-2026-10-27T0505Z.md`, phase 3J's final report: `5f779f6c4e992c7f01b2a81d374fb49eae005d2ab6fe4c79cd6789bfda7dee23`;
- `docs/evidence/QA-9/final-2026-10-27T0535Z.md`, the 0535 review: `62b452203d564d01840f515cc1304d5c95ca76c1038f4fec0349ce7732c582b7`;
- `docs/evidence/QA-9/final-2026-10-27T0605Z.md`, phase 3K's final report: `2a0eb9db7fdcde0f4073d77c404cc850160ce7d66b09f8319bbeb96886619a7a`;
- `docs/evidence/QA-9/final-2026-10-27T0635Z.md`, **phase 3L's final report, from the implementer**: `c3fb223ff526a110cbbf3ba76523b86665b23c06fd3557249c8f4518dfdcca94`;
- `docs/evidence/QA-9/final-2026-10-27T0705Z.md`, **the 0705 review, the independent audit of phase 3L**: `20443d43463909815bc9b8d014022c5c8f839de17b7d697fafd43fa1e4df6e04`;
- `docs/evidence/QA-9/phase-3i-check-outputs.md`: `1b6964c1c16760c663ae7de29fd326b3540c4c5e08e2bc5224251fbc2ab5cd03`;
- `docs/evidence/QA-9/phase-3j-check-outputs.md`: `73431e58f7f5259e807c6714450ecee38ff725bb09715a05f13814f83cd3bc51`;
- `docs/evidence/QA-9/phase-3l-check-outputs.md`: `d57c38100c149544d8dacc1e02537d0f5bbdafb18a9034cf9f4c54ea98fe2d20`, **its original phase-3L version**, before phase 3M's corrections.

**Phase 3M** stages exactly these eleven paths, each named, and makes one records-only local commit on top of `961e1f4`: `docs(QA-9): record independently audited local CI proof`. There is no amend, reset, rebase, stash or push. `main` must stay at `c8a5d57`. What actually happened is recorded after the commit, under "Phase 3M" |
| Reviews | [review-phase2.md](../../../evidence/QA-9/review-phase2.md): the independent review of phase 2, verbatim, from session `e007aa24-8efa-49bd-b29e-1f3750fa0f1c`. [review-phase2b.md](../../../evidence/QA-9/review-phase2b.md): the independent review of phase 2B, verbatim, from session `74c7436b` (prefix only; the full ID was not supplied). [review-phase2c.md](../../../evidence/QA-9/review-phase2c.md): the independent review of phase 2C, verbatim, from session `08c6473e-33b4-46e0-b12f-fee9863f850d`. [review-phase2d.md](../../../evidence/QA-9/review-phase2d.md): the independent review of phase 2D, verbatim, from session `a8b4f2bc-5888-4bb5-a451-b3c62bb41ad7`. [review-phase2e.md](../../../evidence/QA-9/review-phase2e.md): the independent review of phase 2E, verbatim, from session `ad123579-5ce7-4580-9f0a-15446140e87a`. It **ran no command**, and its header says so. [review-phase2f.md](../../../evidence/QA-9/review-phase2f.md): the independent review of phase 2F, verbatim, from session `68f44e38-7c4c-43ce-bdbb-bc9203468b1a`. It is **source-only**: all Bash was denied in its session, and it was **not independently executed**. Its header says so. [review-phase2g.md](../../../evidence/QA-9/review-phase2g.md): the independent review of phase 2G, verbatim, from session `908f412f-5536-4da2-84f7-743b8d1ec933`. It **executed** the 79 quality tests and `pnpm check` (264 tests) on Node 22.23.1, the first independent run of phases 2F and 2G. [independent-review-2026-10-26T2000Z.md](../../../evidence/QA-9/independent-review-2026-10-26T2000Z.md): the independent review of phase 3, persisted by Codex before phase 3B began and unchanged since. It is **source-only**: Bash was denied on its first command, and it ran no test and not `pnpm check`. It found one medium and three lows. [reviewer-final-2026-10-26T2305Z.md](../../../evidence/QA-9/reviewer-final-2026-10-26T2305Z.md): the independent final review of phases 3 and 3B, persisted by Codex before phase 3C began and unchanged since. It **executed**: on Node 22.23.1, 96 quality tests and `pnpm check` with **281 tests**, the first independent run of phases 3 and 3B. It found **no critical, high or medium finding**, and three lows, all resolved in phase 3C. *(3D)* [reviewer-final-2026-10-27T0005Z.md](../../../evidence/QA-9/reviewer-final-2026-10-27T0005Z.md): the independent review of phase 3C, verbatim, from session `aab700d3-e7ca-4d66-8f25-169ac16ec95b`. It was persisted before phase 3D began and is unchanged since. It **executed** on Node 22.23.1: 97 quality tests, `pnpm check` with **282 tests**, and Prettier `--check` of the 18 files. It found no critical or high finding, one medium (records) and one low (R3). It did not run the 3C-M1 mutation. Also persisted verbatim and unchanged, as implementer reports rather than reviews: [implementer-final-2026-10-26T2235Z.md](../../../evidence/QA-9/implementer-final-2026-10-26T2235Z.md), phase 3B's, collected by Codex from session `1e2bed82-07fa-43fe-9eae-9aba2995f855`, and [implementer-final-2026-10-26T2335Z.md](../../../evidence/QA-9/implementer-final-2026-10-26T2335Z.md), phase 3C's, session `de350e6e-5af0-4152-96a1-ef3baffd7a32`. *(3F)* [reviewer-final-2026-10-27T0135Z.md](../../../evidence/QA-9/reviewer-final-2026-10-27T0135Z.md): the independent review of phase 3E, persisted by the coordinator before phase 3F began and unchanged since. It names no session. It **executed** `pnpm check` once on Node v22.23.1: **285 tests**, domain 537/583, **273/313** and 106/117, and **19 files** at the format step. It found no critical, high or medium finding and three lows, and it ran no mutation. Also persisted and unchanged, as implementer reports: [implementer-final-2026-10-27T0035Z.md](../../../evidence/QA-9/implementer-final-2026-10-27T0035Z.md), phase 3D's, and [implementer-final-2026-10-27T0105Z.md](../../../evidence/QA-9/implementer-final-2026-10-27T0105Z.md), phase 3E's. *(3G)* Also persisted and unchanged, as an implementer report: [implementer-final-2026-10-27T0205Z.md](../../../evidence/QA-9/implementer-final-2026-10-27T0205Z.md), phase 3F's stop report. No new review exists for phase 3F or 3G. *(3H)* [reviewer-final-2026-10-27T0305Z.md](../../../evidence/QA-9/reviewer-final-2026-10-27T0305Z.md): the independent review of commit `3007094` and the uncommitted 3G records, persisted by Codex before phase 3H began and unchanged since. It names no session. It **executed** `pnpm check` once on Node v22.23.1: **285 tests**, domain **536/583**, **273/313** and 106/117, and **19 files** at the format step, labelled `from 4a7ee2100bff`. It found **no critical, high or medium finding**, and two lows, both in the records. It ran no mutation, and recommends a rebase, not a merge of `main`. Also persisted and unchanged, as an implementer report: [implementer-final-2026-10-27T0235Z.md](../../../evidence/QA-9/implementer-final-2026-10-27T0235Z.md), phase 3G's. *(3I)* [final-2026-10-27T0405Z.md](../../../evidence/QA-9/final-2026-10-27T0405Z.md): **the current review**, the independent review of phase 3H (the rebased `c84bb4c` and its uncommitted records), saved by the coordinator before phase 3I began and unchanged since. It names no session. It **executed**, once each on Node v22.23.1: `pnpm check` with **285 tests**, domain **536/583**, **273/313** and 106/117, 19 format files labelled `Base: main@c8a5d57c3a09, from 06c822050d76`; and the iOS and Android export, exit 0, with the same two `.hbc` filenames, JS and Hermes only. It found **no critical, high or medium finding**, and two lows, both in the records, fixed in phase 3I. It ran no mutation. Also persisted and unchanged, as an implementer report, though its name doesn't say so: [final-2026-10-27T0335Z.md](../../../evidence/QA-9/final-2026-10-27T0335Z.md), **phase 3H's final report**, session `6a4c540a-d21a-487c-98fa-9a8b47212007`. *(3J)* No new review exists for phase 3I or 3J. Also saved by the coordinator and unchanged, as an implementer report: [final-2026-10-27T0435Z.md](../../../evidence/QA-9/final-2026-10-27T0435Z.md), **phase 3I's final report**, untracked, with sha256 `d139b6f5…` before and after phase 3J. *(3K, 0535 review Low 4: both phase-3J finals are named here.)* [final-2026-10-27T0535Z.md](../../../evidence/QA-9/final-2026-10-27T0535Z.md): **the current review**, the independent review of phase 3J's floor proof and phase 3I's records commit, saved by the coordinator. It is untracked and unchanged, sha256 `62b452203d564d01840f515cc1304d5c95ca76c1038f4fec0349ce7732c582b7`. It names no session. It **executed** `pnpm check` once on Node v22.23.1 in the kept clone at `HEAD` = `main` = `961e1f4`, 05:06:16Z–05:07:08Z: exit 0, **285 tests**, **0 format files**, the floor anchored in the clone, and domain **536/583**, **273/313** and **106/117**. Its raw output is 44,209 bytes, sha256 `967d12ef…` (prefix only, as the review gives it). It found **no critical, high or medium finding**, and four lows. Codex decides Low 1 and Low 2, and phase 3K fixes Low 3 and Low 4 in the records. It ran no mutation, export or `backend:test`. Also saved by the coordinator and unchanged, as an implementer report: [final-2026-10-27T0505Z.md](../../../evidence/QA-9/final-2026-10-27T0505Z.md), **phase 3J's final report**. It is untracked, sha256 `5f779f6c4e992c7f01b2a81d374fb49eae005d2ab6fe4c79cd6789bfda7dee23`. The report names no session. Phase 3J's own record gives session `62ebc6ab-7078-4826-9214-f1871d560324`, which the 0535 review lists as inherited. The report's "five uncommitted paths" was true when it was written. *(3L)* No new review exists for phase 3K or 3L. Also saved by the coordinator and unchanged, as an implementer report: [final-2026-10-27T0605Z.md](../../../evidence/QA-9/final-2026-10-27T0605Z.md), **phase 3K's final report**. It is untracked, sha256 `2a0eb9db7fdcde0f4073d77c404cc850160ce7d66b09f8319bbeb96886619a7a`, the same before and after phase 3L's gate. Its "seven uncommitted paths" was true when it was written. *(3M)* [final-2026-10-27T0705Z.md](../../../evidence/QA-9/final-2026-10-27T0705Z.md): **the current review**, the independent read-only review of phase 3K's and phase 3L's records and provenance. The coordinator saved it after phase 3L. It is untracked until phase 3M's records commit, and unchanged, with sha256 `20443d43463909815bc9b8d014022c5c8f839de17b7d697fafd43fa1e4df6e04`. It names no session of its own. **It re-ran no gate.** It executed Git reads through `rtk proxy`, read and grepped phase 3L's raw output, and read phase 3L's transcript. Its `shasum` of the raw output was denied, and not retried. It accepts phase 3L's local CI-mode proof as accurate, as a local proof only: exit 0, **285 tests**, 19 format files, the floor reported unanchored, and domain 537/583, 273/313 and 106/117. It found **no critical, high or medium finding**, and four lows in the records, all fixed in phase 3M. Also saved by the coordinator and unchanged, as an implementer report: [final-2026-10-27T0635Z.md](../../../evidence/QA-9/final-2026-10-27T0635Z.md), **phase 3L's final report**. It is untracked until phase 3M's records commit, sha256 `c3fb223ff526a110cbbf3ba76523b86665b23c06fd3557249c8f4518dfdcca94`. Its "nine uncommitted paths" was true when it was written. Its line 19 is now backed by phase 3L's final-state list (Low 4). Its line 21's inference from phase 3J's count is superseded by the review's 7 rows (Low 3) |
| **Acceptances recorded** | (1) The phase-2C review **accepted phase 2C's code by reading only**: it ran no commands, since every Bash call in its session was denied. It raised four low findings. (2) **Codex accepted the design of phases 2B and 2C**, subject to the existing exact-integration floor proof (step 4 below), in its phase-2D brief of 26 October 2026. That is a phase acceptance by the delegated decision-maker under AUTH-01. (3) The phase-2D review **accepted phase 2D** with no critical, high or medium finding, after running the 65 quality tests and `pnpm check` on Node 22.23.1. It raised four low findings. Codex's phase-2E brief records that acceptance, together with Codex's own independent pinned `pnpm check` and its reproduction of finding 1; the brief states no separate Codex acceptance of phase 2D. (4) The phase-2E review, **read-only, running no command**, found two low bypasses. It called phase 2E ready for the separate Prettier phase once both are fixed, mutation-checked and re-verified. (5) **Codex accepted phase 2E's routine policy choices, subject to these fixes**, in its phase-2F brief. That brief also records Codex's own independent full `pnpm check` of phase 2E on the pinned Node 22.23.1 (258 tests), and its scratch reproduction of both phase-2E findings. (6) The phase-2F review, **source-only, all Bash denied, executing nothing**, found three lows and no critical, high or medium issue. It called phase 2F ready for the separate Prettier phase once finding 1 is fixed, mutation-checked and re-verified on Node 22.23.1, or once Codex accepts it as a named residual. It called findings 2 and 3 non-blocking. Codex's phase-2G brief asked for all three to be fixed. (7) The phase-2G review, **executed**, found no correctness defect and one low records fix, and called phase 2G, with 2F, ready for the separate Prettier phase. **Codex's phase-3 brief of 27 October 2026 accepts that review** ("accepts independent phase2G review") and assigns the one Prettier phase. That is recorded as Codex's acceptance of the review, not as a separate statement accepting phases 2F or 2G. None of these is the owner's signature, and none accepts the goal or a box. (8) The phase-3 review, **source-only, running nothing**, found no critical or high defect, one medium and three lows. **Codex's phase-3B brief** assigns the medium fix test-first and chooses `prettierPath: null` for finding 2. It also asks for finding 3 as a named R18 residual and for finding 4's records to be resolved. That is an assignment, not an acceptance of phase 3. ~~**Phase 3 has no acceptance, and phase 3B no review, yet**~~ *(Superseded by (9).)* (9) The final review of phases 3 and 3B, **executed** (96 quality tests; `pnpm check` with **281 tests** on Node 22.23.1), found **no critical, high or medium finding** and three lows. **Codex's phase-3C brief of 27 October 2026** directs the records to carry it as the current review acceptance: no critical, high or medium finding, and an independent 281-test pass. The brief assigns all three lows. The review accepts neither the goal nor a box, and it keeps the hosted run, the floor and the committed-state format path open. ~~**Phase 3C has no review yet**~~ *(Superseded in phase 3D by (10).)* (10) The review of phase 3C, **executed** on Node 22.23.1, ran 97 quality tests, `pnpm check` with **282 tests**, and Prettier `--check` of the 18 files. It found **no critical or high finding**, one medium in the records (the box-3 approver) and one low (R3). It called phase 3C's code and test 17 sound. **Codex's phase-3D brief of 27 October 2026 accepts that independent code and test review**: 97 quality tests, 282 tests in `pnpm check`, Node 22.23.1, and phase 3C's code sound. The brief makes the records correction and the commit routine Codex decisions. It accepts neither the goal nor a box, and it isn't the owner's signature. (11) *(3F)* The review of phase 3E, **executed** on Node v22.23.1, ran `pnpm check` once: **285 tests**, domain branches **273/313**, and 19 files at the format step, labelled `from 4a7ee2100bff`. It found **no critical, high or medium finding**, and three lows: two in the records, one a test split. **Codex's phase-3F brief of 27 October 2026 accepts that independent R19 review**: 285 tests, Node 22.23.1, 273/313 branches, 19 format files, no critical, high or medium finding. It assigns the two record lows and the stale line numbers to phase 3F, and the split to QA-10. It accepts neither the goal nor a box, and it isn't the owner's signature. (12) *(3H)* The 0305 review of commit `3007094`, **executed** on Node v22.23.1, ran `pnpm check` once: **285 tests**, domain lines **536/583** and branches **273/313**, and 19 format files. It found **no critical, high or medium finding**, and two record lows. **Codex's phase-3H brief of 27 October 2026 accepts that review**: no critical, high or medium finding, and an independent 285-test pass on Node 22.23.1, with 273/313 branches, 536/583 lines and 19 format files. It keeps box 3 (the hosted run) open, gives no authorization to integrate into `main`, and assigns one bounded local integration-prep phase. It accepts neither the goal nor a box, and it isn't the owner's signature. (13) *(3I)* The 0405 review of the rebased `c84bb4c`, **executed** on Node v22.23.1, ran `pnpm check` once (**285 tests**, 536/583, 273/313, 106/117, 19 format files) and the iOS and Android export once (exit 0, JS and Hermes only). It found **no critical, high or medium finding**, and two record lows. **Codex's phase-3I brief of 27 October 2026 accepts it**: the rebased `c84bb4c`, the independent 285 tests and both JS and Hermes exports, with no critical, high or medium finding. It assigns the two lows, one five-path records commit, and one guarded floor proof in a disposable clone with `HEAD` = `main`. It keeps box 3 open, and authorizes no push, pull request or integration. It accepts neither the goal nor a box, and it isn't the owner's signature. (14) *(3J)* **Codex's phase-3J brief of 27 October 2026 accepts records commit `961e1f4` as five scoped records paths only, not a code change.** It records that the earlier implementers stopped as they said, and that phase 3I's final report was collected. It chooses the literal `mkdir` setup in the kept folder and the offline frozen install with `--ignore-scripts`, and assigns the floor proof once, with no commit. It defers the backend, exports and hosted proof, and accepts neither the goal nor a box. It isn't the owner's signature. (15) *(3K)* The 0535 review of phase 3J, **executed** on Node v22.23.1, ran `pnpm check` once in the kept clone `/var/folders/0s/4k0smcx56zl9hdj404qnz2s80000gp/T/fitlog-qa9-floor.dGGhev2tS6/clone` at `HEAD` = `main` = `961e1f4`. It gave exit 0, **285 tests**, **0 format files**, the floor anchored in the clone, and domain **536/583**, **273/313** and **106/117**. It found **no critical, high or medium finding**, and four lows. **Codex's phase-3K brief of 27 October 2026 accepts that independent floor proof.** It also records that the real `main` is still `c8a5d57`, with no floor. On the lows:
- it accepts Low 1, the shared OS temp folder and Jest cache, as a disclosed limitation of a local proof. No cold-Jest claim is made, and no new run is owed for the cache alone;
- it sets Low 2's rule: a denied compound read-only orientation step may use already permitted single read forms, and a denied write, gate or script stops its sequence. No safety decision is ever bypassed;
- it assigns Low 3 and Low 4 to these records.

It leaves the real `main`'s floor, `backend:test`, box 3's hosted run and exact integration open. It accepts neither the goal nor a box, and it isn't the owner's signature. (16) *(3M)* The 0705 review, **independent and read-only**, audited phase 3L's local CI-mode run from its raw output and transcript, without re-running it. It found **no critical, high or medium finding**, and four record lows. **Codex's phase-3M brief of 27 October 2026 accepts it**: the 0705 review's independent audit, with no critical, high or medium finding, of phase 3L's local CI-mode `pnpm check` proof with 285 tests. The brief assigns the four lows to the records exactly as the review states them, with the raw finals preserved. It authorizes one records-only local commit of the owned QA-9 records paths, the 0635 and 0705 finals included, after a fresh exact inventory and a staged `--check`. It keeps `backend:test`, final verification, the real `main`'s floor and box 3's hosted run open. It accepts neither the goal nor a box, and it isn't the owner's signature. The proof stays a **local CI-mode** implementer run, independently audited. It isn't hosted CI, and it isn't an independent re-run |

*(3G: Codex chose the first option below, stripping the trailing spaces only. See "Phase 3G".)*

**Stopped before the commit** *(3F, written after the stop, uncommitted).* The nine paths are staged, with the stat and the 713/89 test diff as expected. But `git diff --cached --check` **exited 2** with 31 trailing-whitespace lines (run 14). The brief says to stop on a gate failure. So there is **no commit**, no `git show` and no `pnpm check`. `HEAD` is still `4a7ee21`, and the staged state is kept.
- **Where the findings are:** all 31 sit inside the verbatim ```` ```text ```` blocks of `phase-3d-check-outputs.md` (12) and `phase-3e-check-outputs.md` (19). Each is a Node coverage-table row ending in `| `. None is in code, tests, config or the three records phase 3F edited. Outputs: [phase-3f-check-outputs.md](../../../evidence/QA-9/phase-3f-check-outputs.md).
- **For Codex to decide, with no quality bar lowered either way:**
  - strip the trailing spaces from those two files, and say so in each file's header, since the bytes then differ from Node's output by trailing spaces only. Then re-stage and re-check;
  - or accept the findings as verbatim tool output and commit anyway, which would make this the first QA-9 commit whose `--check` isn't clean;
  - or leave the two outputs out of this commit, which drops two of the nine paths the review recommends.
- **Then resume** at the brief's re-stage: `git add` of the nine paths again, since the stop notes make the three records differ from the index, plus `phase-3f-check-outputs.md` if Codex wants it in. Then the staged set, stat and `--check`, the one commit `test(QA-9): cover deterministic Git baseline histories`, `git log`, `git show` and `git status`, and one pinned `pnpm check`. That should give 285 tests, 19 format files, the label `from 4a7ee2100bff`, and domain branches of at least 272/313, with 273 expected.

**Resume here (phase 3M)** *(written before its records commit, and part of it; the commit's results are written after it, uncommitted).* Phase 3M is one bounded records-only phase, and this session stops after it.
1. **Done in phase 3M:**
   - the 0705 review's independent audit of phase 3L's local CI-mode proof is recorded as accepted (16);
   - its four lows are fixed in the records, exactly as it states them;
   - phase 3L's final-state list is added, with `phase-3l-check-outputs.md`'s `d57c3810…` labelled as its original version;
   - the 0635 and 0705 finals are named, with their hashes.

   No code, test, config, threshold, floor, lockfile or raw final changed, and no gate ran.
2. **The records commit:** exactly the eleven owned paths, each named, in one local commit on `961e1f4`, `docs(QA-9): record independently audited local CI proof`. The commit's ID and its checks are written after it, under "Phase 3M" and "Commands run in phase 3M".
3. **No new gate is owed.** The commit is records only, so the floor blob stays `0036eedaf6de63003294b9ff7aa3ef157ab57c74`, and no code changes under phase 3L's local CI-mode pass or the 0535 floor proof. Re-run only if the tip changes in code, or the baseline moves.
4. **Still open:**
   - the real `main`'s floor. Only integration anchors it, and the verifier checks that `git rev-parse <merged commit>:scripts/quality/coverage-floor.json` is `0036eedaf6de63003294b9ff7aa3ef157ab57c74` and equals §5;
   - `pnpm backend:test`, serialised with MB-1's database lane;
   - box 3's hosted run, which needs the owner's specific approval to push (docs/23 §6). It would be the first `GITHUB_ACTIONS`, Linux and fresh-install run, and it should show `check`, `backend` and PL-1's `ci-guard`;
   - exact integration and final verification;
   - §14's mutations, R3's flip list and QA-10's items, unchanged.

The goal isn't split, and no partial Done is claimed.

**Resume here (phase 3L)** *(written after the gate, uncommitted).* Phase 3L is one bounded phase, and this session stops after it. The branch is still **`961e1f41104e414f045d5a9a42e8e9ca44acf083`, four commits on `main@c8a5d57c3a0999760ad21fd1aca4899ca76b5adf`**, not pushed. Nothing was staged or committed, and no ref moved.
1. **Done in phase 3L:** the scripts were read for their effects, then `pnpm check` ran **once** in local CI mode against the exact `main` commit. It passed: exit 0, 285 tests, 19 format files, the floor reported not anchored, and domain 537/583, 273/313 and 106/117. No code, test, config, threshold, floor, dependency or lockfile changed. Outputs: [phase-3l-check-outputs.md](../../../evidence/QA-9/phase-3l-check-outputs.md).
2. **Uncommitted, nine paths:**
   - this file and `handoff.md`, modified;
   - `final-2026-10-27T0435Z.md`, `final-2026-10-27T0505Z.md`, `final-2026-10-27T0535Z.md`, `final-2026-10-27T0605Z.md`, `phase-3i-check-outputs.md`, `phase-3j-check-outputs.md` and the new `phase-3l-check-outputs.md`, untracked.

   Codex decides whether a later phase commits them, as one scoped records commit with a staged `--check`. A records-only commit leaves the floor blob at `0036eedaf6de63003294b9ff7aa3ef157ab57c74`.
3. **CI mode is now measured locally,** so a further local CI-mode run in the kept clone is not owed. On an unchanged success, no new gate is owed either. Re-run only if the tip changes in code, or the baseline moves.
4. **Still open:**
   - the real `main`'s floor. Only integration anchors it, and the verifier checks that `git rev-parse <merged commit>:scripts/quality/coverage-floor.json` is `0036eedaf6de63003294b9ff7aa3ef157ab57c74` and equals §5;
   - `pnpm backend:test`, serialised with MB-1's database lane;
   - box 3's hosted run, which needs the owner's specific approval to push (docs/23 §6). It is the first `GITHUB_ACTIONS`, Linux and fresh-install run, and it should show `check`, `backend` and PL-1's `ci-guard`;
   - exact integration and final verification;
   - §14's mutations, R3's flip list and QA-10's items, unchanged.

The goal isn't split, and no partial Done is claimed.

**Resume here (phase 3K)** *(uncommitted).* Phase 3K is one bounded, records-only phase, and this session stops after it. The branch is still **`961e1f4`, four commits on `main@c8a5d57`**, not pushed. Nothing was staged or committed, and no ref moved.
1. **Done in phase 3K:**
   - the 0535 review's independent floor proof is recorded as accepted (15);
   - Low 1 and Low 2 carry Codex's decisions;
   - Low 3 and Low 4 are fixed in these records;
   - PL-1's new H1 is captured for PL-1.

   No code, test, config, floor, lockfile or raw final changed.
2. **Uncommitted, seven paths** (the Git row has the hashes): this file and `handoff.md`, modified; `final-2026-10-27T0435Z.md`, `final-2026-10-27T0505Z.md`, `final-2026-10-27T0535Z.md`, `phase-3i-check-outputs.md` and `phase-3j-check-outputs.md`, untracked. Codex decides whether a later phase commits them, as one scoped records commit with a staged `--check`. A records-only commit leaves the floor blob at `0036eedaf6de63003294b9ff7aa3ef157ab57c74`.
3. **Kept:** the disposable folder `/var/folders/0s/4k0smcx56zl9hdj404qnz2s80000gp/T/fitlog-qa9-floor.dGGhev2tS6`, its `clone/`, `empty-hooks/` and `empty-template/`. Cleanup is Codex's call. Future briefs and allowlists name `…/clone`, never `…/repo`.
4. **Still open:**
   - the real `main`'s floor. Only integration anchors it, and the verifier checks that `git rev-parse <merged commit>:scripts/quality/coverage-floor.json` is `0036eedaf6de63003294b9ff7aa3ef157ab57c74` and equals §5;
   - `pnpm backend:test`, serialised with MB-1's database lane;
   - CI mode, optionally imitated in the kept clone first;
   - box 3's hosted run, which needs the owner's specific approval to push (docs/23 §6);
   - exact integration and final verification;
   - §14's mutations, R3's flip list and QA-10's items, unchanged.

The goal isn't split, and no partial Done is claimed.

**Resume here (phase 3J)** *(written after the gate, uncommitted).* Phase 3J is one bounded phase, and this session stops after it. The branch is still **`961e1f4`, four commits on `main@c8a5d57`**, not pushed, and nothing was committed in phase 3J.
1. **Done in phase 3J:** phase 3I's step 4, "the floor proof, resumed". Folder checked and set up, local clone at `961e1f4`, `main` = `HEAD` in the clone, offline frozen install with `--ignore-scripts`, and one `pnpm check`: **exit 0, 285 tests, 0 format files, the floor anchored in the clone, domain 535/583, 273/313 and 106/117.** The floor's bytes are identical at both clone refs, and its values equal §5. Implementer runs. Outputs: [phase-3j-check-outputs.md](../../../evidence/QA-9/phase-3j-check-outputs.md).
2. **Uncommitted:** this file and `handoff.md`, modified; `phase-3i-check-outputs.md`, `final-2026-10-27T0435Z.md` and `phase-3j-check-outputs.md`, untracked. Codex decides whether a later phase commits them. A commit moves the tip, so a later gate must name the tip current then.
3. **Kept, not cleaned up:** the disposable folder, holding `clone/` (with its `node_modules` and the gate's outputs), `empty-hooks/` and `empty-template/`.
4. **Next, as separate phases, each with its own brief:**
   - **a fresh independent review** of phase 3I's records commit and phase 3J's floor proof. It can repeat the proof the same way in a new folder, or read the outputs;
   - **`pnpm backend:test`,** serialised later with MB-1's database lane, under the 0305 review's step-7 preconditions;
   - **the CI-mode imitation** (`FITLOG_CONTRACT_BASELINE`), still deferred;
   - **box 3's hosted run,** which needs the owner's specific approval to push (docs/23 §6);
   - **final verification,** then integration by the integrator, only after a passing verdict. At integration the verifier still compares the floor at the exact merge commit.
5. **Still open, unchanged:** §14's mutations, R3's flip list, and QA-10's items.

The goal isn't split, and no partial Done is claimed.

**Resume here (phase 3I)** *(written after the commit and the stop, uncommitted).* Phase 3I is one bounded phase, and this session stops after it. The branch is **`961e1f4`, four commits on `main@c8a5d57`**, with no merge commit. Not pushed. This repository's `main` is unchanged.
1. **Done in phase 3I:**
   - the 0405 review's two record lows, fixed in place, with the verbatim outputs and finals unchanged;
   - one records commit, **`961e1f41104e414f045d5a9a42e8e9ca44acf083`**, of exactly the five paths, with staged `--check` clean.
2. **Stopped:** the floor proof in a disposable clone. The folder `/var/folders/0s/4k0smcx56zl9hdj404qnz2s80000gp/T/fitlog-qa9-floor.dGGhev2tS6` was made with `mktemp` and confirmed outside every repository. Then `rtk proxy mkdir` of its three subfolders was **denied** (run 20). By the brief, the sequence stopped there, with no replacement writer. **No clone, install or `pnpm check` ran,** so the `HEAD` = `main` gate, the 0 format files and the anchored floor are **unmeasured**. The folder holds no file and is kept.
3. **Uncommitted:** this file and `handoff.md`, modified, and the new `phase-3i-check-outputs.md`. Nothing else.
4. **Next, as separate phases, each with its own brief:**
   - **the floor proof, resumed.** Codex chooses how the clone gets an empty template and hooks: an allowed `mkdir`, or Git's own `--template=` and `core.hooksPath=/dev/null` with `TMPDIR` set to the folder. The install should add `--ignore-scripts`, so that `supabase`'s `postinstall` can't download its CLI. Both are in [phase-3i-check-outputs.md](../../../evidence/QA-9/phase-3i-check-outputs.md), "What the next floor-proof phase needs";
   - a fresh independent review of phase 3I's records commit, and of the floor proof once it has run;
   - **`pnpm backend:test`,** serialised later with MB-1's database lane, under the 0305 review's step-7 preconditions;
   - **box 3's hosted run,** which needs the owner's specific approval to push (docs/23 §6);
   - **final verification,** then integration by the integrator, only after a passing verdict.
5. **Still open, unchanged:** §14's mutations, R3's flip list, the optional CI imitation (deferred by the brief), and QA-10's items.

The goal isn't split, and no partial Done is claimed.

**Resume here (phase 3H)** *(written after the rebase and the gates, uncommitted).* Phase 3H is one bounded phase, and this session stops after it. The branch is **`c84bb4c`, three commits on `main@c8a5d57`**, rebased, with no merge commit. Not pushed. `main` is unchanged.
1. **Done in phase 3H:**
   - the 0305 review's two lows;
   - the five-path records commit;
   - the rebase, with every patch shown identical;
   - the offline frozen install;
   - `pnpm check` (285 tests, 273/313);
   - both JS exports, JS and Hermes only.

   These are implementer runs.
2. **Uncommitted:** this file, `handoff.md` and the new `phase-3h-check-outputs.md`. Nothing else. Committing them moves the tip, so every step below that names a tip must use the one current then. *(3I, 0405 review finding 1: no longer true. After phase 3H ended, the coordinator saved two more untracked files in `docs/evidence/QA-9/`: `final-2026-10-27T0335Z.md`, the phase-3H implementer's final report (session `6a4c540a-d21a-487c-98fa-9a8b47212007`), unchanged, and `final-2026-10-27T0405Z.md`, the executed independent review of phase 3H. So five paths were uncommitted, and phase 3I commits all five together.)*
3. **Next, as separate phases, each with its own brief:**
   - **a fresh read-only independent review** of phase 3H: the rebased commits, the range-diff, and the records and outputs; *(3I: done, the executed 0405 review, accepted as (13). It ran commands, so it wasn't read-only in that sense, but it changed no file)*
   - **`pnpm backend:test`,** serialised later with MB-1's database lane, under the 0305 review's step-7 preconditions (`supabase status` at 55321, MB-1 restored with no lock, migrations equal to `main`'s, and the seed present, with no seeding). Required by docs/23 §7, deferred and not waived;
   - **the floor proof in a throwaway clone outside the repository,** with `HEAD` = `main` at the exact tip (`git checkout -B main <tip>` inside the clone only). Install offline, run `pnpm check`, and compare `git show <tip>:scripts/quality/coverage-floor.json` with coverage-baseline.md §5. This also measures R19's `HEAD` = `main` state. **Never move `main` in this repository or its worktrees;**
   - **box 3's hosted run,** which needs the owner's specific approval to push (docs/23 §6). The pushed branch would also publish every unpushed local-`main` commit since `c8f6d7f`;
   - **final verification,** then integration by the integrator, only after a passing verdict.
4. **Still open, unchanged:**
   - §14's mutations, which nobody has run;
   - R3's flip list, QA-9's;
   - QA-10's items.

   If `main` moves again before integration, rebase again the same way and re-run the gates.

The goal isn't split, and no partial Done is claimed.

**Resume here (phase 3G)** *(written after the commit, uncommitted).* Phase 3G is one bounded phase, and this session stops after it. It finished phase 3F's commit, and phase 3F's list below stands, except:
1. **Phase 3F's step 2 is done.** The test is committed in `3007094`, and `pnpm check` passed on that commit (run 20): 285 tests, 19 format files, and 273/313 domain branches.
2. **Next, for Codex:** commit or discard this phase's uncommitted results: this file, `handoff.md` and `phase-3g-check-outputs.md`. Nothing else is uncommitted. *(3H, 0305 review finding 2: no longer true. Codex then saved phase 3G's report, `implementer-final-2026-10-27T0235Z.md`, and the review itself, `reviewer-final-2026-10-27T0305Z.md`, both untracked. So five paths were uncommitted, and phase 3H commits all five together.)*
3. **Still open, unchanged:**
   - the floor at the exact `main` commit;
   - `pnpm backend:test`, and both JS exports;
   - the `HEAD` = `main` and CI re-measures of R19;
   - §14's mutations, now exact diffs, which nobody has run;
   - the owner's specific approval for box 3's hosted run;
   - R3's flip list, QA-9's;
   - QA-10's items.

   No new independent review covers phase 3F or 3G. Their diffs are records and whitespace only.

**Resume here (phase 3F).** Phase 3F is one bounded phase, and this session stops after it. Its records corrections are written before the commit, and its results after it, under "Phase 3F". What comes next is unchanged from phase 3E's list below, except:
1. **Phase 3E's step 1 is done, apart from the mutations.** The executed review of phase 3E found no critical, high or medium finding, and Codex accepts it. **§14's mutations,** now exact diffs, are still unrun. They are for a reviewer, on a scratch copy of `snapshot-contract.ts`.
2. **Phase 3E's step 2 is phase 3F's commit.** The format step should select 19 files, and §7's step 4 now says 19.
3. **Phase 3E's step 3 stands,** with weaker forecasts. Both re-measures should pass by the margin, at least 272/313. The model's exact 273/313 is no longer claimed.
4. **New, for QA-10:** the test split (phase-3E review finding 3), the widened R19(b) advice for any domain test change, and the proposed `HEAD`-not-found case for mutation 3c.

**Phase 3E** *(uncommitted).* Codex decided R19: a test in `contract.test.ts`, under a routine ownership exception, with no threshold lowered. It is made, and the gate passes locally with `HEAD` ahead of `main`. So the blocker below is resolved locally, pending a fresh independent review and the two re-measures under "Resume here". The paragraph below is kept as phase 3D wrote it.

**Blocker, found after the commit** *(written after commit `4a7ee21`; uncommitted).* Steps 1–3 below are done. The committed `pnpm check` (run 18) **fails**: `Error: exact branches coverage 271/313 (86.5815%) does not meet the threshold of 86.9%`. That is R19, domain branch coverage that depends on Git state, and it is high. Step 4 and everything after it wait for **Codex's decision on R19**, which must not lower 86.90. The test change it needs is in `packages/domain/`, S8 Member backend's lane. Then `pnpm check` must pass at the QA-9 commit, with the domain counts recorded. The commit `4a7ee21` is kept as made: not amended, reset or reverted.

**Resume here (phase 3E).** Phase 3E is one bounded phase, and this session stops after it. Nothing was staged or committed.
1. **Next: a fresh independent review of phase 3E,** as Codex's brief says.
   - **Read:** the double and the three tests in `contract.test.ts` (from `Full 40-digit commit IDs` through `a clone without a local main…`); [ratchet-enforcement.md §14](../../../evidence/QA-9/ratchet-enforcement.md#14-phase-3e-r19-fixed-by-a-domain-test); [phase-3e-check-outputs.md](../../../evidence/QA-9/phase-3e-check-outputs.md).
   - **Run, on Node 22.23.1:** the domain test and `pnpm check`. Then §14's three scratch-copy mutations of `snapshot-contract.ts`; this session ran none, because the brief forbids production edits.
   - **Confirm the old tests are unchanged apart from formatting.** One way: format `main`'s copy of the file with Prettier 3.6.2 and `.prettierrc.json`, then compare it with the working file without the new block. Run 5's `--debug-check` covered only the first `--write`.
2. **Codex decides whether to commit the test,** for example as a second local commit with QA-9 in the subject.
   - Then run `pnpm check` on the committed state, and record domain branches and lines (an R3 sample).
   - Once `contract.test.ts` is committed, the format step selects **19 files**, not 18. §7's box-3 step 4 still says 18, so it needs that correction then. *(3F: corrected to 19, naming `contract.test.ts`.)*
3. **Re-measure R19's other states:**
   - `HEAD` = `main`, after integration or in a scratch clone;
   - CI mode with `FITLOG_CONTRACT_BASELINE`, which is the hosted run and needs the owner's approval to push.

   §14's model predicts 273/313 in both. *(3F: the model is unconfirmed, so read this as "the margin should hold", at least 272/313.)*
4. **Then phase 3D's steps 4–8, unchanged:**
   - the rebase onto local `main` (R18(h));
   - the deferred gates;
   - R3, now with four flipping lines named (§14) and R19(b) beside it;
   - the owner's approval for box 3;
   - R9, which is QA-10's.

*(Phase 3D's list follows, as phase 3D left it.)* **Resume here.** Phase 3D is one bounded phase, and this session stops after it. Steps 1–3 are phase 3D's own, and what actually happened is under "Phase 3D", written after the commit. Steps 4–8 come next. Phase 3C's list follows for the record, then phase 3B's and phase 3's.
1. **(Phase 3D) Stage exactly the eleven named QA-9 paths**, each named, never with `-A`: `.prettierrc.json`, `package.json`, `pnpm-lock.yaml`, `apps/mobile/coverage-thresholds.json`, `apps/mobile/jest.config.cjs`, `apps/mobile/package.json`, `packages/domain/package.json`, `docs/23-MASTER-PLAN.md`, `docs/evidence/QA-9/`, `docs/plan/runs/QA-9/` and `scripts/quality/`. Then inspect the staged list, its stat and `git diff --cached --check`.
2. **(Phase 3D) Run `pnpm check` on Node 22.23.1, staged, before the commit.** Expect the format step to select 18 files, with `from HEAD@2a95726912c6: scripts/quality/touched-format.mjs is not committed yet`. On a failure, stop and keep the staged state.
3. **(Phase 3D) Make one local commit with QA-9 in the subject, then run `pnpm check` again.** Expect 18 files and `Base: main@2a95726912c6, from <the QA-9 commit>, which adds scripts/quality/touched-format.mjs`.
4. **Rebase onto local `main`; don't merge it in** (R18(h)). The coordinator serialises this later. Run `pnpm check` again, and record its domain line count as an R3 sample.
5. **Before integration, run what docs/23 §7 requires for this diff.** These are deferred, not waived:
   - `pnpm install --frozen-lockfile`;
   - `pnpm backend:test`, under the database rules that apply then;
   - the iOS and Android JS export;
   - `git show <commit>:scripts/quality/coverage-floor.json`, compared with [coverage-baseline.md](../../../evidence/QA-9/coverage-baseline.md) §5 and its §1 mobile scope, at the exact `main` commit.
6. **QA-9's next phase: R3's per-line flip list** ([ratchet-enforcement.md §13](../../../evidence/QA-9/ratchet-enforcement.md#13-phase-3d-the-phase-3c-reviews-findings-and-the-local-commit)), as Codex's phase-3D brief assigns it. No threshold is lowered.
7. **Box 3's hosted lint-negative run needs the owner's specific approval.** Pushing a branch and opening a draft pull request publish it.
   - Under docs/23 §6, nothing is pushed unless the owner allows it: `"push": true` in `var/orchestrator/config.json`, or the owner pushing by hand.
   - AUTH-01 delegates routine technical choices and final technical sign-off to Codex, not publication. No existing approval covers it either.
   - The repository is public, and the pushed branch would carry every unpushed local-`main` commit since `c8f6d7f`. That can't be undone.

   Codex can route the request to the owner, but can't grant it. Otherwise [§7's plan](../../../evidence/QA-9/ratchet-enforcement.md#7-phase-2e-phase-2d-review-findings-and-r14) is unchanged.
8. R9 is QA-10's.

Phase 3C's list, as phase 3C left it. Phase 3D's steps above replace it, and its step 6's approver is corrected in place:
1. **Codex stages the reviewed candidate and checks the committed boundary.** This is the final review's "What stays unproved before the commit". This session did not stage. There are two ways:
   - stage the QA-9 paths and run `pnpm check`: the base stays `HEAD`, but staged new files are selected (touched-format 2's `scripts/staged.cjs`);
   - or commit, then run `pnpm check`.

   Either way, confirm that the format step selects **18 files**: the 17 `scripts/quality/*.mjs` and `apps/mobile/jest.config.cjs`. After a commit, also confirm that its label reads `Base: main@…, from <the QA-9 commit>, which adds scripts/quality/touched-format.mjs`. An explicit Prettier `--check` of those 18 passed in phase 3C (runs 11 and 18). Still, no gate run has judged the 17 scripts in this repository yet.
2. **`pnpm check` on Node 22.23.1.** Phase 3C's final `pnpm check` passed with **282 tests** (run 19). The final review's independent run passed with **281**, before test 17 was added. **Run 19's domain lines were 533/583, exactly the threshold** (R3). A later run at 532 would fail with no code change, so R3's flip list matters before anyone relies on a single green run.
3. **Codex commits it,** with QA-9 in the subject. The floor stays unanchored until integration, and the format rule starts at that commit.
4. **Rebase onto local `main`; do not merge it in** (R18(h)). The final review found the commits from `2a95726` to `c8a5d57` docs-only, so the rebase should change neither the selection nor coverage. Run `pnpm check` again.
5. **Before integration, run the two deferred gates** that docs/23 §7 requires for this diff. They are required, not waived, and existing approvals do not replace them:
   - `pnpm backend:test`, since the diff touches `packages/domain/` (`package.json`);
   - the native export for iOS and Android, since it touches `apps/mobile/` (`package.json`, `jest.config.cjs`, `coverage-thresholds.json`).

   Phase 3C's brief deferred both. Then, at integration, the verifier compares the floor at the exact merge commit (phase 3's step 4, below).
6. **Codex decides what follows.**
   - **Box 3's hosted run** as a draft pull request ([§7's plan](../../../evidence/QA-9/ratchet-enforcement.md#7-phase-2e-phase-2d-review-findings-and-r14), whose step 4 now requires the format label). It needs ~~Codex's specific authorisation~~ *(3D, phase-3C review finding 1: the owner's specific approval, under docs/23 §6. AUTH-01 doesn't cover publication)*; existing approvals do not permit a push. The pushed branch would also carry every unpushed local-`main` commit since `c8f6d7f`, so that publication is part of the decision.
   - R3's flip list.
   - R9, which is QA-10's.

Phase 3B's list, as phase 3B left it (the final review did its step 1; the steps above replace its steps 2–5):
1. **An independent review of phases 3 and 3B that can run commands.** The phase-3 review ran nothing, so neither phase has an independent run yet. What phase 3B changed (detail in [ratchet-enforcement.md §11](../../../evidence/QA-9/ratchet-enforcement.md#11-phase-3b-the-phase-3-reviews-findings)):
   - `scripts/quality/touched-format.mjs`: `RULE` derived from the module's own path; `holdsRule` and `refuseLostStart` (a lost rule start throws in CI, and locally once `HEAD` holds the check); the header comment.
   - `scripts/quality/touched-format.test.mjs`: tests 13–16 at the end of the file, and an `installCommand` helper taken from test 11's own setup, with test 11's assertions unchanged.
   - `scripts/quality/coverage-ratchet.mjs`: `prettierPath: null` in `JEST_PINNED`, and its comment.
   - `scripts/quality/coverage-ratchet.test.mjs`: test 9's expected message gains `prettierPath` and three new cases; new test 32 at the end of the file.
   - `apps/mobile/jest.config.cjs`: `prettierPath: null` and a one-line comment, as Codex authorised.
   - Records: docs/23 §9 rule 3 (the allowlist sentence and the rule-start sentences); ratchet-enforcement.md (header, §1, §3 R18(d), (h) and (i), §7's probe, the new §11); this file.
2. **`pnpm check` on Node 22.23.1 before the commit.** This session's final `pnpm check` passed with **281 tests** (phase 3B, run 29). Nobody else has run phase 3 or 3B.
3. **Codex commits it,** with QA-9 in the subject. The floor stays unanchored until integration. The format rule starts at that commit, now taken from the module's own path. The commit's JavaScript and TypeScript files are all QA-9's and all formatted: the 17 quality scripts and `jest.config.cjs` (`prettier --check`, run 28). After the commit, run `pnpm check` once. Confirm that the format step's label reads `Base: main@…, from <the QA-9 commit>, which adds scripts/quality/touched-format.mjs`, and that it selects the 17 scripts and `jest.config.cjs` (the review's step 4).
4. **Before integration, rebase onto local `main`; do not merge it in** (R18(h)). Local `main` has moved past `2a95726`. A merge after the rule commit would make the files changed only on `main` count as touched. That fails safe, but it would demand formatting nobody owes. Then, at integration, the verifier compares the floor at the exact commit to be merged, as in phase 3's step 4 below.
5. **Codex decides what follows:** box 3's hosted run as a draft pull request (step 5 below; the probe is now only the `jest.config.cjs` line), R3's flip list, and R9 (QA-10's).

Phase 3's list, as phase 3 left it (phase 3B's steps 2 and 3 replaced its steps 2 and 3):
1. **An independent review of phase 3**, ideally one that can run commands. What to read:
   - **New:** `scripts/quality/touched-format.mjs` (the check), `scripts/quality/touched-format.test.mjs` (12 tests), the root `.prettierrc.json`, and [review-phase2g.md](../../../evidence/QA-9/review-phase2g.md) (the persisted review).
   - **Logic changes to existing files:**
     - root `package.json`: `"prettier": "3.6.2"` in `devDependencies`, and `node scripts/quality/touched-format.mjs && ` in `check`, after the guard;
     - `pnpm-lock.yaml`: `prettier@3.6.2` only, 10 lines;
     - `gate-wiring.mjs`: the root `check` pin, and `touched-format.test.mjs` in `QUALITY_FILES`;
     - `gate-wiring.test.mjs`: one case, dropping the format step;
     - `coverage-ratchet.mjs`: `inCI` exported, one keyword.
   - **Formatting only:** all 17 `scripts/quality/*.mjs` were rewritten by `prettier --write`, after `prettier --debug-check` reported each AST unchanged. Line numbers that phases 2 to 2G cite in these files refer to the pre-format text.
   - **Records:** docs/23 §9 rule 3 (a "Formatting" bullet, and the formatting pin under "Changing thresholds"); [ratchet-enforcement.md](../../../evidence/QA-9/ratchet-enforcement.md) §1 "Formatting", the §1 test list, R3, R10, R17 and the new R18 in §3, and the new §10; the R17 owner and sentence corrections and the `2G-` labels in this file and §9.
2. **`pnpm check` on Node 22.23.1 before the commit.** This session's final `pnpm check` passed with **276 tests** (phase 3, run 73). Nobody else has run phase 3.
3. **Codex commits it.** A commit does **not** anchor the floor; only integration into `main` does. The format rule, by contrast, applies from the commit that adds `touched-format.mjs`. That commit's own JavaScript and TypeScript files are all QA-9's and all formatted: the 17 quality scripts, and `jest.config.cjs`, which was already formatted. Untracked files are not checked locally, so `pnpm check` here could not select `scripts/quality/`; `prettier --check` on those files is the evidence until a commit exists.
4. **At integration** the verifier compares the floor at the exact commit to be merged with the evidence:
   - Run `git show <merge-commit>:scripts/quality/coverage-floor.json` and check it against [coverage-baseline.md](../../../evidence/QA-9/coverage-baseline.md) §5 and its §1 mobile scope.
   - Until `main` records the floor, guard test 2 enforces that equality inside `pnpm check`, so a green CI run on the pull request also shows it. A diff could still edit both files, which is why the human comparison stays.
5. **Codex decides what follows.** Still open: box 3's hosted run as a **draft pull request** ([ratchet-enforcement.md §7](../../../evidence/QA-9/ratchet-enforcement.md#7-phase-2e-phase-2d-review-findings-and-r14)), which needs ~~Codex's specific authorisation~~ *(3D: the owner's specific approval, docs/23 §6)* for a push and a pull request. Since phase 3, root `check` runs the format step before lint. The draft's range from the commit adding the rule must be formatted, and its probe line `const unusedLintProbe = 1;` is. R3's per-line flip list is still not made. R9 is QA-10's.

## Changes in the working tree (uncommitted)

| File | Phase | Change |
|---|---|---|
| `package.json` (root) | **2B**, **3** | 2B, **one line**: `check` now starts with `node scripts/quality/coverage-ratchet.mjs && `. **Phase 3**, as Codex authorised: `check` gains `node scripts/quality/touched-format.mjs && ` right after the guard, and `devDependencies` gains `"prettier": "3.6.2"` (written by `pnpm add --save-exact`). `git diff --stat` shows 3 lines. Nothing else in the file changed |
| `pnpm-lock.yaml` | **3** | `prettier@3.6.2` only: the root importer entry, the package with integrity `sha512-I7AIg5…hCuQ==`, and its snapshot, 10 lines. No other entry changed |
| `.prettierrc.json` (root) | **3** | New. `{ "printWidth": 100, "singleQuote": true }`, which must equal `PRETTIER_OPTIONS`, so that editors and `pnpm exec prettier --write` format as the check does |
| `scripts/quality/touched-format.mjs` | **3**, **3B** | New. Prettier on touched files only; the semantics are in its header comment and in [ratchet-enforcement.md §1, "Formatting"](../../../evidence/QA-9/ratchet-enforcement.md#formatting-prettier-on-touched-files-only-phase-3-scriptsqualitytouched-formatmjs). **3B** (phase-3 review finding 1): `RULE` is derived from the module's own path, not written by hand. `holdsRule` reads `git ls-tree` and throws on failure. `refuseLostStart` throws in CI when no commit adds `RULE`, and locally when `HEAD` holds it anyway. `ruleStart` takes `env`. The header and `ruleStart` comments say so |
| `scripts/quality/touched-format.test.mjs` | **3**, **3B**, **3C** | New. 12 tests over scratch Git repositories, with the installed Prettier as ground truth. **3B:** 16 tests. Tests 13–16 are new and sit at the end of the file, so tests 1–12 keep their numbers. Test 11's copying moved into `installCommand`, which test 14 reuses; test 11's assertions are unchanged. **3C** (final review finding 2): 17 tests. Test 17 is new, at the end of the file: GitHub's detached test merge commit, built with `commit-tree`, with the baseline as first parent. No earlier test or helper changed. Prettier re-wrapped only test 17's own lines (run 10) |
| `docs/evidence/QA-9/reviewer-final-2026-10-26T2305Z.md` | — | The executed final review of phases 3 and 3B, persisted by Codex before phase 3C began. Read, not changed |
| `docs/evidence/QA-9/reviewer-final-2026-10-27T0005Z.md` | — | *(3D)* The executed review of phase 3C, persisted before phase 3D began. Read, not changed |
| `docs/evidence/QA-9/implementer-final-2026-10-26T2235Z.md`, `implementer-final-2026-10-26T2335Z.md` | — | *(3D)* Phase 3B's and phase 3C's implementer reports, verbatim, persisted before phase 3D began. Read, not changed. Their box-3 approver wording is left as written, as the phase-3C review asked |
| `docs/evidence/QA-9/phase-3c-mutation-first-parent.patch` | **3C** | New. The exact one-line 3C-M1 mutation of `touched-format.mjs`, in unified-diff form. Written by hand: `git apply --check` was denied (run 7), so Git never applied it. The Edit tool made the same edit and reversed it |
| `docs/evidence/QA-9/review-phase2g.md` | **3** | New. The phase-2G review verbatim, with provenance (session `908f412f-5536-4da2-84f7-743b8d1ec933`), attributed as executed |
| Every other `scripts/quality/*.mjs` | **3** | **Formatting only.** `prettier --debug-check` reported each AST unchanged, then `prettier --write` rewrote them. Apart from formatting, only `coverage-ratchet.mjs`, `gate-wiring.mjs` and `gate-wiring.test.mjs` changed in phase 3 (their rows) |
| `apps/mobile/coverage-thresholds.json` | 2 | New. `collectCoverageFrom` (all of `src/` except `__tests__`) and `global` thresholds: statements 12.23, branches 10.57, functions 10.23, lines 18.67 |
| `apps/mobile/jest.config.cjs` | 1, 2, **3B** | Reads scope and thresholds from the JSON (`coverageThreshold: { global }`), plus a two-line comment. Coverage reporters as in phase 1. Unchanged in 2B: it was mutated for M14/M15 and restored, and its diff matches phase 2. **3B**, as Codex authorised (phase-3 review finding 2): `prettierPath: null` and a one-line comment saying why, 2 lines. `git diff --stat` against `main`: 10 lines (9 insertions, 1 deletion), up from 8. Still in Prettier's format. Mutated once for 3B-M9 and restored |
| `apps/mobile/package.json` | 1, 2, **2E** | `test:ci` = `node --test ../../scripts/quality/*.test.mjs && node ../../scripts/quality/coverage-ratchet.mjs && jest --runInBand --ci --coverage --no-watchman`. **2E** added only ` --no-watchman` to that one script, as Codex authorised (phase-2D review, finding 2). `test:coverage` (phase 1) is a measurement command, unchanged |
| `packages/domain/package.json` | 1, 2 | `test` = the guard, then Node with coverage, the thresholds and both reporters; `test:coverage` is measurement-only. Unchanged in 2B |
| `scripts/quality/coverage-floor.json` | 2 | The checked-in initial floor: the phase-1 measured values and mobile scope. Unchanged in 2B (mutated for M16 and restored) |
| `scripts/quality/type-suppression.mjs` | 2E, 2F, **2G** | **2G** (phase-2F review, all three lows): declaration names use TypeScript's own two tests with no `.` wildcard, so a line break in the name changes nothing (finding 1). Each TypeScript file is read as bytes, and one starting with `FF FE` or `FE FF` is refused before decoding; a reader that returns anything but bytes fails closed (finding 2). Every `.js`, `.jsx`, `.mjs` and `.cjs` file under either `src/` is refused (finding 3). `DECLARATION_ROOTS` is renamed `SOURCE_ROOTS`, same value. New in 2E (R14). Reads every `.ts`, `.tsx`, `.mts` and `.cts` file in `apps/mobile` and `packages/domain` outside each package's top-level `node_modules`, as text. `@ts-ignore` and `@ts-nocheck` fail anywhere; `@ts-expect-error` needs a reason of at least three different words on its own line and in the same comment. A missing package, an unlistable folder, an unreadable file and a link fail closed. **2F:** letter case is matched with Unicode case folding (the `u` flag on all three patterns; phase-2E review finding 1, the Kelvin sign). A declaration file under `apps/mobile/src/` or `packages/domain/src/` is refused (R16, narrowly). The header comment says both |
| `scripts/quality/type-suppression.test.mjs` | 2E, 2F, **2G** | New in 2E, 6 tests; 8 since 2F; **10** since 2G. **2G:**<br>- test 5's expected list gains `apps/mobile/src/legacy.js`;<br>- test 6's injected reader returns bytes, and a text reader fails closed;<br>- test 8 gains 8 line-break declaration names and 12 near misses, each classified by the installed TypeScript, and both packages' real `include` lists the line-break files;<br>- new test 9: UTF-16LE and BE, through TypeScript's own reader and the scan's default reader;<br>- new test 10: JavaScript in source, with the installed TypeScript's `allowJs`/`checkJs` premise.<br>No assertion was weakened or removed. **2F:** test 3 gains two Kelvin cases; test 5's expected list gains one entry (its `packages/domain/src/types.d.ts` fixture is now refused as a declaration file too); new test 7 (every one-character spelling of `ts-nocheck`, checked against each package's TypeScript) and test 8 (declaration files, names from the installed TypeScript, inside and outside `src/`) |
| `scripts/quality/coverage-ratchet.mjs` | 2, 2B, 2C, 2D, 2E, 3, **3B** | **3B** (phase-3 review finding 2, Codex's choice): `JEST_PINNED` gains `prettierPath: null`, so the allowlist names it and any other value or none fails; its comment says why. Nothing else changed. **3:** `inCI` is exported, one keyword, so the format check uses the same CI-mode rule; otherwise formatting only. **2E:** imports and runs `typeSuppressionProblems`, adds its problems to the result, and adds one summary sentence before the Babel sentence; nothing else changed. The guard. 2B adds: the Jest option allowlist; CI mode from `GITHUB_ACTIONS=true`; in CI, refusal of a baseline that forks at `HEAD`; the `anchored` result and its note; thresholds of at most 2 decimals; and the call into `gate-wiring.mjs`. Its own wiring checks moved there. 2C: `minimumsIn` tells "missing" from JSON `null`, and requires each file it reads to be a JSON object (working tree and baselines); `treeReader` fails closed on a file it cannot read, naming it; `jestProblems` always runs, and `appliedProblems` reports scope and thresholds as `cannot be checked` when there is no thresholds object; the source scan runs, and the summary counts the scanned files. **2D:** in the working tree, every mobile include pattern must start with a prefix taken from `SUPPRESSION_ROOTS` (`src/`) and hold no `..` or backslash (finding 1). The `jest`-key check is now the exported `mobilePackageProblems`, which reads outside its `try` (finding 2). The guard runs the config inventory, transform-config and lint-scope checks, and its summary counts them |
| `scripts/quality/config-inventory.mjs` | 2D, **2E** | New in 2D. Lists every entry under `apps/mobile` except `node_modules` folders, never following a link. A missing package, a folder it cannot list and a non-regular entry fail closed. **2E:** the `SKIPPED` comment only, corrected (phase-2D review, finding 3): skipping `node_modules` is a trust boundary, since Jest, jest-expo and `eslint.config.js` resolve shared config from `apps/mobile/node_modules` first; that trust is PL-1's (R6) |
| `scripts/quality/transform-config.mjs` | **2D** | New. Refuses every `babel.config.*`, `.babelrc*` and `.babelignore` under `apps/mobile`, in any letter case and of any entry kind; a `babel` key in the mobile `package.json`; a `package.json` that is missing, unreadable, not JSON or not an object; and any nested `package.json` (finding 4, R11) |
| `scripts/quality/lint-scope.mjs` | 2D, 2E, **2F** | New in 2D. Pins `apps/mobile/eslint.config.js` as text and refuses every other ESLint config source in `apps/mobile`. In every other linted file, it requires each disable to name its rules and give a reason, and refuses inline rule configuration (R8). 2E (phase-2D review, finding 1): comment starts are found with a lookahead, so overlapping starts are each read; the rule list is read as `@eslint/plugin-kit` reads it, and an empty one disables every rule. **2F** (phase-2E review, finding 2): a `//` comment ends at CR, LF, U+2028 or U+2029 (`LINE_END`), and the `directivesIn` comment no longer claims nothing ESLint sees is skipped |
| `scripts/quality/coverage-suppression.mjs` | 2C | Reads every file under `apps/mobile/src` and `packages/domain/src` and reports Istanbul, c8, V8 and Node suppression comments with `file:line`; a tree, directory, file or link it cannot read fails closed. Unchanged in 2D |
| `scripts/quality/gate-wiring.mjs` | 2B, 2C, 2D, 2E, **3** | **3:** the root `check` pin gains `node scripts/quality/touched-format.mjs && ` after the guard, and `touched-format.test.mjs` joins `QUALITY_FILES`. New in 2B. It pins the gate scripts, refuses `pre`/`post` hooks, and holds tsconfig strictness and scope. It also checks the CI `check` job by layout: keys, env names, the baseline line, the one-line `pnpm check` step, and no `GITHUB_ENV`/`GITHUB_PATH`. 2C: `coverage-suppression.test.mjs` added to `QUALITY_FILES`. 2D: `lint-scope.test.mjs` and `transform-config.test.mjs` added there. **2E:** `MOBILE_TEST_CI` ends ` --no-watchman`, with a comment saying why (finding 2), and `type-suppression.test.mjs` is added to `QUALITY_FILES` |
| `scripts/quality/exact-coverage-reporter.mjs` | 2, 2B | 2B: an integer comparison with at most 2 decimals, and a failure for any file the include globs match that no test loaded. Unchanged in 2C and 2D |
| `scripts/quality/coverage-ratchet.test.mjs` | 2, 2B, 2C, 2D, 2E, 2F, 2G, **3B** | **3B:** 32 tests. Test 9's expected allowlist message gains `prettierPath`, the only changed expectation, and three cases: `'prettier'`, a path, and removal each fail. New test 32, at the end of the file, runs the installed Jest's inline-snapshot writer both ways. 31 tests (30 in 2D). **2G:** test 31 gains three cases only, the phase-2F review's: `apps/mobile/src/loose.d.`+U+2028+`.ts`, the UTF-16LE `@ts-nocheck` in `packages/domain/src/sub/fixtures.test.ts`, and `GymMembersScreen.jsx` holding `'#ff0000'`. Each fails the guard. **2F:** test 31 gains three cases only: the Kelvin-sign `@ts-nocheck` and `packages/domain/src/loose.d.ts` each fail the guard, and a generated `apps/mobile/expo-env.d.ts` passes it. 2E: test 31 (the guard refuses each TypeScript suppression, in both states of `main`), and test 23 copies `type-suppression.mjs` too. No other line changed. 2D: test 8's widening case moved inside `src/`, as Codex asked; tests 26–30 (include patterns outside `src/`, unanchored and anchored; the review's widened-anchored-suppressed case; the unreadable package; the domain loader flags; the guard refusing the new cases). The fixtures now also copy `eslint.config.js`, and test 23 copies the three new modules. No other assertion changed |
| `scripts/quality/coverage-suppression.test.mjs` | 2C | 6 tests of the scanner. Unchanged in 2D |
| `scripts/quality/gate-wiring.test.mjs` | 2B, 2D, 2E, **3** | **3:** test 2 gains one case: root `check` without the format step fails the pin. 9 tests over in-memory copies. 2D: test 3 adds four lint-narrowing cases, test 6 three ESLint environment cases, and test 8 requires every `*.test.mjs` in `scripts/quality/` to be in `QUALITY_FILES`. **2E:** test 3 adds two watchman cases, and the new test 9 holds `--no-watchman` in the reviewed command itself |
| `scripts/quality/lint-scope.test.mjs` | 2D, 2E, **2F** | New in 2D. 7 tests; **9** since 2F. 2E: test 5 adds seven failing comments (the review's four among them) and five passing reasoned disables. **2F:** test 4 gains a case with both eslintrc keys; test 5 gains three failing separator cases and one passing; new test 8 (the installed ESLint, with both parsers, ends a `//` comment at U+2028 and U+2029) and test 9 (the mobile `package.json` fails closed for lint scope) |
| `scripts/quality/transform-config.test.mjs` | 2D, **2F** | New in 2D. 6 tests. **2F:** test 3 gains three directories with a Babel config name |
| `scripts/quality/exact-coverage-reporter.test.mjs` | 2, 2B | 8 tests. Unchanged in 2C and 2D |
| `docs/23-MASTER-PLAN.md` | 2, 2B, 2C, 2D, 2E, 2F, 2G, 3, **3B** | §9 rule 3 only. **3B:** the allowlist sentence says `prettierPath` is pinned to `null` and why. The Formatting bullet says the script takes its own path as the rule's, a lost start fails in CI and, once `HEAD` holds the script, locally, and that a branch should rebase rather than merge `main` until `main` holds the rule. **3:** a "Formatting: Prettier on touched files only" bullet, with the exact semantics, the rule start and the `eslint.config.js` note; "Changing thresholds" adds the formatting pin (version, options, generated list). **2G:** the declaration-file bullet names TypeScript's rule, line breaks included. New bullets cover a UTF-16 byte-order mark in a TypeScript file, and JavaScript in either `src/`, with JavaScript outside `src/` named as not refused. **2F:** the TypeScript bullet's "in any letter case" overclaim replaced by Unicode case folding, checked against TypeScript; a new bullet for declaration files in `src/`, with the remainder named as S7 Quality's (QA-9, R16); one lint-scope sentence on `//` comment ends. 2E: the pinned `--no-watchman`; a bullet for TypeScript suppression comments; an empty rule list counted as disabling every rule; and dependency trust (a force-added `node_modules` path, `.npmrc`, `pnpm-workspace.yaml`) named under PL-1's protections. 2B: three guard copies, CI mode, the 2-decimal rule, the Jest allowlist, gate wiring, anchoring at `main`, and the trust boundary. 2C: scope narrowing names suppression comments in `apps/mobile/src` and `packages/domain/src`, plus one bullet for missing, unreadable, invalid or non-object inputs. **2D:** bullets for include patterns outside `src/` and for Babel configuration and the domain loader. A "Lint scope" paragraph names the pin, the directive rules and S7 Quality as the pin's owner. "Changing thresholds" now also covers the lint config |
| `docs/evidence/QA-9/review-phase2.md` | 2B | The phase-2 review verbatim, with provenance. Unchanged |
| `docs/evidence/QA-9/review-phase2b.md` | 2C | The phase-2B review verbatim, with provenance (session `74c7436b`). Unchanged |
| `docs/evidence/QA-9/review-phase2c.md` | 2D | New. The phase-2C review verbatim, with provenance (session `08c6473e-33b4-46e0-b12f-fee9863f850d`) |
| `docs/evidence/QA-9/review-phase2d.md` | 2E | New. The phase-2D review verbatim, with provenance (session `a8b4f2bc-5888-4bb5-a451-b3c62bb41ad7`) |
| `docs/evidence/QA-9/review-phase2e.md` | **2F** | New. The phase-2E review verbatim, with provenance (session `ad123579-5ce7-4580-9f0a-15446140e87a`). The header marks its commands **not run** and corrects its stale "only the writer has run 2E's `pnpm check`" |
| `docs/evidence/QA-9/review-phase2f.md` | **2G** | New. The phase-2F review verbatim, with provenance (session `68f44e38-7c4c-43ce-bdbb-bc9203468b1a`). The header attributes it as **source-only, all Bash denied, not independently executed** |
| `docs/evidence/QA-9/ratchet-enforcement.md` | 2, 2B, 2C, 2D, 2E, 2F, 2G, 3, 3B, 3C, 3D, 3E, **3F** | **3F (records only):** the title and header (phase 3F, acceptance (11), the date, the second commit); in §3, R19's stale line numbers tagged with today's, R19(b) restated both ways with the reporter's integers, and the QA-10 advice widened to any domain test change; §7's box-3 step 4, `<n>` now 19 and naming `contract.test.ts`; in §14, the model marked unconfirmed, "Margin" restated, the forecasts weakened, and the mutations as exact diffs with predicted killers and one named survivor; the new §15.<br>**3E:** the title and header (phase 3E, the date, Node, what changed outside `scripts/quality/`); in §3, R19's state (fixed locally, the new residual R19(b), what is still owed) and R3's four flipping lines; the new §14.<br>**3D (records only):**<br>- the title and header: phase 3D, acceptance (10), Node, the records-only change, and "uncommitted through phase 3C";<br>- §3: R3 (the review's 533, the 533 count against the records, the artifact analysis, the assignment to QA-9's next phase) and R10's approver;<br>- §7: the finding-4 row and step 1, both now the owner's specific approval;<br>- the new §13.<br>**3C:** the title and header (phase 3C, acceptance (9), Node, nothing changed outside); §1 (the rule-start row's merge shape, 97 tests, touched-format 17); §3 (R3's 34 runs, R10's merge shape and committed state, R18(h)'s check by the final review); §7's box-3 step 4 (the format step and its label, final review finding 3); the new §12. **3B:** title and header (phase 3B, acceptance (8), Node, the `jest.config.cjs` change, and the stale "only root `package.json` change" struck and corrected); §1 (the `prettierPath` pin, the rule-start row, 96 tests, ratchet 9 and 32, touched-format 11 and 13–16); §3 (R18(d) corrected, new (h) and (i)); §7's hex-colour probe struck, with the count confirmed; the new §11. **3:** title and header (phase 3, acceptance (7), Node and pnpm, what changed outside `scripts/quality/`); §1 "Formatting" and the 12 new tests (91); §3 R3 (29 runs), R10, R17 (owner PL-1, CI wiring only; the relative-path sentence corrected) and the new R18; 2G's mutations relabelled `2G-G1` to `2G-G12` in §1 and §9; the new §10. **2G:** the title and header (phase 2G, acceptance (6), Node, changed files); in §1, the UTF-16 rule, "JavaScript in source", the declaration "any name" overclaim struck through and corrected, and 79 tests; in §3, R3's 25 runs, R14, R16 and the new R17; the new §9 phase-2G record. **2F:** title and header (the acceptances recorded, Node); §1 (Unicode case folding and what it covers, declaration files in source, `//` comment ends, 77 tests); §3 (R3's 24 runs, R8, R14 and R16); §7's "superset" sentence struck through and corrected; the new §8 phase-2F record. 2E: title and header (phase 2E, the acceptances recorded, the 2E `package.json` change); §1 (the rule-list grammar and overlapping starts, the TypeScript suppression rule, `--no-watchman`, the `node_modules` trust note, 73 tests); §3 (R3's 23 runs, R6 widened, R9 to QA-10, R10's draft pull request, R14 closed, R15 widened, new R16); the new §7 phase-2E record. 2D: title and header (finding 3: "authorised", plus the recorded acceptances, and the Node path); §1 (scope inside `src/`, transform-time configuration, the domain loader, lint scope, the package read, wiring, trust model, 65 tests); §3 (R3's 19th run, R8 and R11 closed within `apps/mobile`, new R13–R15); the new §6 phase-2D record, with how each tool loads its configuration |
| `docs/evidence/QA-9/coverage-baseline.md` | 1, 2, 2B | Unchanged in 2C and 2D. Test 2 reads its §5 and §1 scope |
| `docs/evidence/QA-9/rpc-test-inventory.md` | 1 | Unchanged |
| `docs/plan/runs/QA-9/checkpoint.md` | 1, 2, 2B, 2C, 2D, 2E, 2F, 2G, 3, 3B, 3C, 3D, 3E, **3F** | This file |
| `docs/plan/runs/QA-9/handoff.md` | 3B, 3C, **3D** | New in 3B. The handoff for attempt 1 as it stands: every box, the gates, the mutations, what is left and why. It claims no box beyond this file's table and does not mark the goal Done. **3C:** rewritten for phase 3C. The `pnpm backend:test` and export rows now say "required by docs/23 for this diff, deferred" (final review finding 1). **3D:** rewritten for phase 3D. The box-3 push needs the owner's specific approval (phase-3C review finding 1), and the current review is the executed review of phase 3C. **3E:** a phase-3E block and phase-3E notes added. Phase 3D's post-commit text is kept, with superseded lines struck or tagged. **3F:** a phase-3F block at the top; R19(b) restated, the S8 advice widened to any domain test change, and the request's line numbers tagged; QA-10 added under "Found for other goals"; "Decisions forced in phase 3F" |
| `packages/domain/src/contract.test.ts` | **3E** | **S8's file, under Codex's routine ownership exception for it alone.** The changes:<br>- a read-only Git double, `memoryGit`, over an in-memory five-commit history;<br>- three new tests after the last existing Git test: one fork point (`HEAD` at or behind `main`); ahead, committed rewrite and diverged; no local `main`;<br>- two imports (`dirname`, `type ContractSource`).<br>No existing test, assertion or helper changed. The whole file was formatted with Prettier 3.6.2, as the format step requires once a file is touched. `git diff --numstat`: 713 insertions, 89 deletions (run 15). **3F:** not changed. It is staged and committed as phase 3E left it (713 and 89 again in phase 3F's run 5) |
| `docs/evidence/QA-9/phase-3e-check-outputs.md` | **3E**, **3G** | New. Runs 7, 10 and 11 verbatim, with the cuts marked, attributed as implementer runs. **3G** (Codex's decision): one trailing space removed from each of 19 coverage-table rows, and a "Normalization" header row saying so. No output content or figure changed |
| `docs/evidence/QA-9/phase-3d-check-outputs.md` | 3D, **3G** | New in 3D, after commit `4a7ee21`: runs 13 and 18 verbatim. **3G** (Codex's decision): one trailing space removed from each of 12 coverage-table rows, and a "Normalization" header row saying so. No output content or figure changed |
| `docs/evidence/QA-9/phase-3f-check-outputs.md` | 3F, **3G** | New in 3F, after its stop: the stage's checks and the failed `--check`. **3G:** two tags only, for its inclusion in the commit and Codex's choice to strip |
| `docs/evidence/QA-9/phase-3g-check-outputs.md` | **3G** | New, after commit `3007094`, uncommitted: runs 10–20, with run 20's `pnpm check` copied with cuts marked. Its 5 domain coverage rows have the trailing space removed, as the header says. Attributed as implementer runs |
| `docs/evidence/QA-9/implementer-final-2026-10-27T0205Z.md` | — | *(3G)* Phase 3F's stop report, persisted before phase 3G began. Read, not changed. Its "the nine paths are staged" and "I didn't strip them" describe the state before phase 3G |
| `docs/evidence/QA-9/implementer-final-2026-10-27T0035Z.md` | — | *(3E)* Phase 3D's implementer report, persisted by Codex before phase 3E began. Read, not changed |
| `docs/evidence/QA-9/implementer-final-2026-10-27T0105Z.md` | — | *(3F)* Phase 3E's implementer report, persisted before phase 3F began. Read, not changed. Its "a future merge of this kind would still pass, at 272/312" is the one-direction margin that phase-3E review finding 2 corrects in the other records |
| `docs/evidence/QA-9/reviewer-final-2026-10-27T0135Z.md` | — | *(3F)* The executed review of phase 3E, persisted by the coordinator before phase 3F began. Read, not changed |
| `docs/evidence/QA-9/implementer-final-2026-10-27T0235Z.md` | — | *(3H)* Phase 3G's implementer report, persisted by Codex before phase 3H began. Read, not changed. Its "Those three files are all that differs from the commit" was true when it was written |
| `docs/evidence/QA-9/reviewer-final-2026-10-27T0305Z.md` | — | *(3H)* The executed review of commit `3007094` and the 3G records, persisted by Codex before phase 3H began. Read, not changed. Its two lows are fixed in place in this file and `handoff.md` |
| `docs/evidence/QA-9/phase-3h-check-outputs.md` | **3H**, **3I** | New, after the rebase, uncommitted: the records commit's checks, the `main` recheck, the rebase and range-diff, the install, run 30's `pnpm check` copied with cuts marked, and the export's output, whole. Its 5 domain coverage rows have the trailing space removed, as the header says. Attributed as implementer runs. **3I:** two annotations outside the verbatim blocks, the header's "Written" tag and a module-count note after the export output (0405 review finding 2). No captured output changed. Committed in phase 3I's records commit |
| `docs/evidence/QA-9/final-2026-10-27T0335Z.md` | — | *(3I)* **The phase-3H implementer's final report**, verbatim, from session `6a4c540a-d21a-487c-98fa-9a8b47212007` (the ID in `phase-3h-check-outputs.md`'s header). Saved by the coordinator after phase 3H ended, untracked until phase 3I's records commit. Read, not changed, and not renamed: its name doesn't say "implementer", so this row and the Reviews row say what it is. Its line 18, "The iOS bundle (1228 modules)", is one run's Metro count, which varies between runs (0405 review finding 2). Its "Uncommitted: … three files" was true when it was written |
| `docs/evidence/QA-9/phase-3i-check-outputs.md` | **3I** | New, after the records commit and the stop, uncommitted: the records commit's checks verbatim, the disposable folder's `mktemp` and outside-the-repository check, the denied `mkdir`, the floor file at `961e1f4`, and what the resumed floor proof needs. Attributed as implementer runs |
| `docs/evidence/QA-9/final-2026-10-27T0405Z.md` | — | *(3I)* **The executed independent review of phase 3H** (the 0405 review), verbatim. It names no session. Saved by the coordinator before phase 3I began, untracked until phase 3I's records commit. Read, not changed. Its two lows are fixed in place in this file, `handoff.md` and `phase-3h-check-outputs.md`. Its "the four records files still uncommitted" and "two modified and two untracked" were true when it was written; it doesn't count itself |
| `docs/evidence/QA-9/final-2026-10-27T0435Z.md` | — | *(3J)* **Phase 3I's implementer final report**, verbatim. Saved by the coordinator after phase 3I ended. Untracked. Read, not changed: sha256 `d139b6f5765a317f6ed37b5f70e73e8d867b18d0ea98944584c2fab75bb76943` before and after phase 3J. Its "three uncommitted files" was true when it was written |
| `docs/evidence/QA-9/phase-3j-check-outputs.md` | **3J** | New, after the gate, untracked: the folder checks, the clone and its config, `main` = `HEAD` in the clone, the floor's hashes and blobs, the install, run 36's `pnpm check` output **whole** (five trailing spaces removed, as its header says, and checked mechanically in run 45), and the post-gate checks. Attributed as implementer runs |
| `docs/evidence/QA-9/final-2026-10-27T0605Z.md` | — | *(3L)* **Phase 3K's final report from the implementer**, verbatim. Saved by the coordinator after phase 3K ended. Untracked. Read, not changed: sha256 `2a0eb9db…6619a7a` before and after phase 3L's gate |
| `docs/evidence/QA-9/phase-3l-check-outputs.md` | **3L** | New, after the gate, untracked. It holds the scripts' effects as inspected, the preflight (the exact `main`, the fork point, the floor blob, `main`'s missing floor, Node, and the inventory with hashes), and run 13's local CI-mode `pnpm check` with two cuts marked and the raw output's sha256. It also has the post-gate checks, and what the run proves and doesn't. Attributed as implementer runs. *(3M)* Corrected in place for the 0705 review's Lows 1–3: the Normalization, Cuts and Written header rows, the first cut marker (raw lines 121–702) and one tag after run 20. No captured output line changed. The original phase-3L version's sha256 was `d57c38100c149544d8dacc1e02537d0f5bbdafb18a9034cf9f4c54ea98fe2d20` (phase 3M's run 7). Part of phase 3M's records commit |
| `docs/evidence/QA-9/final-2026-10-27T0635Z.md` | — | *(3M)* **Phase 3L's final report from the implementer**, verbatim. Saved by the coordinator after phase 3L ended, and untracked until phase 3M's records commit. Read, not changed: sha256 `c3fb223ff526a110cbbf3ba76523b86665b23c06fd3557249c8f4518dfdcca94` (run 7). Its "nine uncommitted paths" was true when it was written. Its line 19, "`git diff --check` was clean", is now recorded in phase 3L's final-state list (0705 review Low 4). Its line 21, "inferring them from phase 3J's count", is superseded: the raw output had 7 trailing spaces, at raw lines 96, 98, 100, 101, 103, 104 and 107, by the 0705 review's Grep (Low 3) |
| `docs/evidence/QA-9/final-2026-10-27T0705Z.md` | — | *(3M)* **The 0705 review**, the independent read-only review of phase 3K's and phase 3L's records and provenance, verbatim. Saved by the coordinator after phase 3L, and untracked until phase 3M's records commit. Read, not changed: sha256 `20443d43463909815bc9b8d014022c5c8f839de17b7d697fafd43fa1e4df6e04` (run 7). Its four lows are fixed in place in `phase-3l-check-outputs.md`, this file and `handoff.md`. Its Low 3 cites `checkpoint.md:348`, but the sentence it means was at `handoff.md:348`. Its "ten uncommitted paths" was true when it was written; it doesn't count itself |

These are unchanged:
- CI workflows, and every dependency but phase 3's exact `prettier` 3.6.2 (`pnpm-lock.yaml` changed only for it);
- backend, `supabase/`, contracts, snapshots and migrations;
- `GOALS.md`, `ACCEPTANCE.md` and status;
- every test outside `scripts/quality/`.
- In phase 2C also: every threshold and floor value, the coverage scope, `jest.config.cjs`, `coverage-thresholds.json`, every `package.json`, and all production source. No suppression comment was added, even temporarily.
- In phase 2D the same, plus `eslint.config.js`, every tsconfig, the root `package.json`, Prettier, and every dependency. No Babel or ESLint config file and no directive was added to the repository, even temporarily: every case ran in scratch fixtures under the OS temporary directory.
- In phase 2E the same, except the mobile `test:ci` script, which gained ` --no-watchman` (authorised). No other script, key or line of any `package.json` changed: `git diff --stat` still shows 3 lines for the mobile file and 2 for the root. Every threshold, the floor and the scope are unchanged. No production or test source outside `scripts/quality/` changed, and no TypeScript suppression comment or `eslint-disable` was added to the repository, even temporarily. The one temporary edit outside `scripts/quality/` was mutation E3b on the same `test:ci` line, restored and checked with `git diff`.
- In phase 2F **nothing outside `scripts/quality/`, the QA-9 documents and docs/23 §9 rule 3 changed, even temporarily**. That covers every `package.json`, CI, dependencies, the lockfile, contracts, source and config. `git diff --stat` still shows exactly the four phase-2/2B files at 8, 3, 2 and 2 lines. Every threshold, the floor, the Jest scope and every package script are unchanged. Every mutation (F1–F14) was an edit to a module in `scripts/quality/`, restored before the next. No Kelvin-sign comment, Unicode-separator directive, declaration file, Babel-named directory or odd `package.json` was ever written to the repository: they exist only in test fixtures under the OS temporary directory.
- In phase 2G the same as 2F: **nothing outside `scripts/quality/`, the QA-9 documents and docs/23 §9 rule 3 changed, even temporarily**. Inside `scripts/quality/`, only `type-suppression.mjs`, `type-suppression.test.mjs` and `coverage-ratchet.test.mjs` changed. `git status --short` shows the same nine paths, and `git diff --stat` shows exactly the four phase-2/2B files at 8, 3, 2 and 2 lines (run 31). Every threshold, the floor, the Jest scope, every tsconfig (`allowJs` and `checkJs` included) and every package script are unchanged. Every mutation (2G-G1 to 2G-G12) was an edit to `type-suppression.mjs`, restored before the next. No line-break-named file, UTF-16 file or JavaScript file was ever written to the repository. They exist only in test fixtures and in scratch probes under the OS temporary directory, and each probe removed its folder.
- In phase 3, beyond `scripts/quality/`, the QA-9 documents and docs/23 §9 rule 3, only what Codex authorised changed: the root `package.json` (the `check` step and the exact `prettier` devDependency), `pnpm-lock.yaml` (`prettier@3.6.2` only) and the new root `.prettierrc.json`. Unchanged:
  - every threshold, the floor and the Jest scope, and every tsconfig;
  - the mobile and domain `package.json` (3 and 2 lines against `main`, as since 2E), and `jest.config.cjs` (8 lines, already in Prettier's format);
  - the pinned `apps/mobile/eslint.config.js`, CI and `.github/`, `.npmrc` and `pnpm-workspace.yaml`;
  - every source file in either `src/`, `supabase/`, GOALS, ACCEPTANCE and `status.json`.

  `git diff --stat` over those paths (run 46) shows only `jest.config.cjs` 8, mobile `package.json` 3, root `package.json` 3, domain `package.json` 2 and `pnpm-lock.yaml` 10. No file outside the owned set was formatted.
- In phase 3B, beyond `scripts/quality/`, the QA-9 documents and docs/23 §9 rule 3, only `apps/mobile/jest.config.cjs` changed: the `prettierPath: null` line and its comment, as Codex authorised. Unchanged:
  - every threshold, the floor and the Jest scope;
  - every dependency, `package.json` file and the lockfile;
  - every tsconfig, `eslint.config.js` and its pin, CI, `.npmrc` and `pnpm-workspace.yaml`;
  - all app source, `supabase/`, contracts, GOALS, ACCEPTANCE and `status.json`;
  - the phase-3 review file, which Codex persisted.

  Only `touched-format.test.mjs` was formatted (`prettier --write`, run 10), and it is QA-9's own. The final diff-stat is run 31.
- In phase 3C **nothing outside `scripts/quality/touched-format.test.mjs` and the QA-9 documents changed**. The one temporary edit was the 3C-M1 mutation of `touched-format.mjs`, made twice and reversed each time. Unchanged:
  - every threshold, the floor and the Jest scope;
  - every dependency, `package.json` file and the lockfile;
  - the gate wiring and its pins, every tsconfig, `eslint.config.js`, CI, `.npmrc` and `pnpm-workspace.yaml`;
  - all app source, `supabase/`, contracts, docs/23, GOALS, ACCEPTANCE and `status.json`;
  - the final review file, which Codex persisted.

  Only `touched-format.test.mjs` was formatted (run 10). `git status --short` shows the same eleven paths, and `git diff --stat` the same six tracked files at the same line counts, as the final review's run (runs 16–17, again runs 20–21).
- In phase 3D **only the QA-9 records changed**: this file, `handoff.md` and `ratchet-enforcement.md`. Unchanged:
  - every check script and test, every threshold, the floor and the Jest scope;
  - every dependency, `package.json` file and the lockfile, and docs/23;
  - the gate wiring and its pins, every tsconfig, `eslint.config.js`, CI, `.npmrc` and `pnpm-workspace.yaml`;
  - all app source, `supabase/`, contracts, GOALS, ACCEPTANCE and `status.json`;
  - the three persisted finals (`reviewer-final-2026-10-27T0005Z.md` and both `implementer-final-…` files), and every earlier review file.

  Nothing was formatted. Git changed only through the scoped stage and the one local commit (under "Phase 3D").
- In phase 3E **only `packages/domain/src/contract.test.ts` and the QA-9 records changed**, plus the new `phase-3e-check-outputs.md`. "Every test outside `scripts/quality/`" above no longer holds for that one file. Unchanged, and never edited even temporarily:
  - `snapshot-contract.ts`, all production code and the domain contract;
  - every threshold, the floor and the Jest scope;
  - every dependency, `package.json` file and the lockfile;
  - the gate wiring and its pins, every tsconfig, `eslint.config.js`, CI, `.npmrc` and `pnpm-workspace.yaml`;
  - docs/23, GOALS, ACCEPTANCE and `status.json`;
  - every persisted review and implementer final.

  Only `contract.test.ts` was formatted (runs 6 and 9). Git was only read: nothing was staged or committed (runs 12–15).
- In phase 3F **only the QA-9 records changed**: this file, `handoff.md` and `ratchet-enforcement.md`. Unchanged, and never edited even temporarily:
  - `contract.test.ts`, which is committed as phase 3E left it;
  - `snapshot-contract.ts`, all production code and the domain contract;
  - every threshold, the floor, the Jest scope, config, dependencies, every `package.json` file and the lockfile;
  - docs/23, GOALS, ACCEPTANCE and `status.json`;
  - every persisted review and implementer final, `reviewer-final-2026-10-27T0135Z.md` included.

  Nothing was formatted. Git changed only through the scoped stage and the one local commit (under "Phase 3F").
- In phase 3G **only QA-9's evidence and records changed**. That means the trailing spaces and one header row in each of the two normalized outputs, two tags in `phase-3f-check-outputs.md`, `ratchet-enforcement.md` §16 and its tags, this file and `handoff.md`. Unchanged, and never edited even temporarily:
  - `contract.test.ts`, every other test, all production code and the domain contract;
  - every threshold, the floor, the Jest scope, config, dependencies, every `package.json` file and the lockfile;
  - docs/23, GOALS, ACCEPTANCE and `status.json`;
  - every persisted review and implementer final, `implementer-final-2026-10-27T0205Z.md` included.

  Nothing was formatted. Git changes only through the eleven-path stage and the one local commit (under "Phase 3G").
- In phase 3I **only QA-9's records changed**: this file, `handoff.md`, two annotations in `phase-3h-check-outputs.md` outside its verbatim blocks, and the new `phase-3i-check-outputs.md`. The two `final-…` files were committed as saved. Unchanged, and never edited even temporarily:
  - every test, all production code, the domain contract and `ratchet-enforcement.md`;
  - every threshold, the floor, the Jest scope, config, dependencies, every `package.json` file, the lockfile and `node_modules`;
  - docs/23, GOALS, ACCEPTANCE and `status.json`;
  - every persisted review and implementer final.

  Nothing was formatted, and nothing was installed. Git changed only through the five-path stage and the one local records commit (under "Phase 3I"). Outside this worktree, the only write was `mktemp`'s empty folder.
- In phase 3J **only QA-9's records changed**, all uncommitted: this file, `handoff.md` and the new `phase-3j-check-outputs.md`. Unchanged, and never edited even temporarily:
  - every test, all production code, the domain contract and `ratchet-enforcement.md`;
  - every threshold, the floor, the Jest scope, config, dependencies, every `package.json` file, the lockfile and this worktree's `node_modules`;
  - docs/23, GOALS, ACCEPTANCE and `status.json`;
  - every persisted review and implementer final, `final-2026-10-27T0435Z.md` and `phase-3i-check-outputs.md` included (hashes before and after, runs 6 and 46).

  Nothing in this repository was formatted, installed, staged or committed, and no ref here moved. Outside this worktree, the writes were: the two empty folders, the clone and its `main`, the clone's `node_modules` and the files the gate wrote in the clone, all inside the disposable folder; and the gate's own scratch fixtures and tool caches in the session's default temporary folder (see the outputs file, "Differences").
- In phase 3K **only this file and `handoff.md` changed**, both uncommitted. Unchanged, and never edited even temporarily:
  - every test, all production code, the domain contract and `ratchet-enforcement.md`;
  - every threshold, the floor, the Jest scope, config, dependencies, every `package.json` file and the lockfile;
  - root wiring and CI workflows;
  - docs/23, GOALS, ACCEPTANCE and `status.json`;
  - every raw final and outputs file (hashes before and after, runs 4 and 8).

  No file was created. Nothing was formatted, installed, staged or committed, no ref moved, and nothing outside this worktree was written.
- In phase 3L **only QA-9's records changed**: this file and `handoff.md`, plus the new `phase-3l-check-outputs.md`, all uncommitted. Unchanged, and never edited even temporarily:
  - every test, all production code, the domain contract and `ratchet-enforcement.md`;
  - every threshold, the floor, the Jest scope, config, dependencies, every `package.json` file, the lockfile and `node_modules`;
  - root wiring and CI workflows;
  - docs/23, GOALS, ACCEPTANCE and `status.json`;
  - every raw final and outputs file (hashes before and after the gate, runs 11 and 19).

  Nothing was formatted, installed, staged or committed, and no ref moved. The gate wrote only ignored outputs: `apps/mobile/coverage/`, which already existed, and the tests' scratch folders and Jest's cache in the OS temporary folder. Its raw output went to the harness's task file in `/private/tmp`.

## Phase 3M: records only, the 0705 review accepted, and one records commit

*(Written before its records commit, and part of it. The commit's own results are written after it, uncommitted.)* Codex's phase-3M brief (27 October 2026, AUTH-01) **accepts the [0705 review](../../../evidence/QA-9/final-2026-10-27T0705Z.md)** (acceptance (16)). That review is an independent, read-only audit of phase 3L's local CI-mode proof, with 285 tests and no critical, high or medium finding. The brief assigns one bounded records-only phase, with no sub-agent, dispatch or launch script:
- fix the review's four lows exactly as it states them, with the raw finals preserved;
- add phase 3L's final-state list, with the outputs file's hash labelled as the original version;
- name the 0635 and 0705 finals, with their hashes;
- then, after a fresh exact inventory and a staged `git diff --cached --check`, make **one** records-only local commit, `docs(QA-9): record independently audited local CI proof`. It stages exactly the owned paths under `docs/evidence/QA-9/` and `docs/plan/runs/QA-9/`, each named, the 0635 and 0705 finals included.

There is no gate, test, install, clone, rebase or export. A records-only commit leaves the floor blob at `0036eedaf6de63003294b9ff7aa3ef157ab57c74`, so no new gate is owed. No source, config, floor, lockfile or other goal's file changes. `backend:test`, final verification, the real `main`'s floor and box 3's hosted run stay open. The brief also records that the first session for this phase, `31e5af66`, stopped at an account limit and ran no change, test or commit. That is the brief's statement, inherited. Runs 2–7 are consistent with it. The refs are unchanged, and the inventory is phase 3L's nine paths plus the two finals the coordinator saved after it. The six untracked files phase 3L hashed, and `phase-3l-check-outputs.md`, still have the hashes that phase 3L and the 0705 review recorded. The 0635 and 0705 finals have no earlier recorded hash. The PRD 16.1 and ADR 003 rule holds: gym staff never read or write a member's private health data, whatever the consent.

In the Source column, **executed** means by phase 3M, **inherited** means from another session's run, and **inspected** means read only.

| Item | Recorded | Source |
|---|---|---|
| The accepted audit | The 0705 review accepts phase 3L's local CI-mode proof as accurate, and as a local proof only: exit 0, **285 tests**, the exact `main` as the baseline, 19 format files, the floor reported unanchored, and domain 537/583, 273/313 and 106/117. It found that the raw output supports every figure. It also found one background gate call of about 30 seconds, no edit during it, the three denials as recorded, and all 11 hashes identical before and after. **No critical, high or medium finding** | **Inherited**, the 0705 review. It re-ran no gate, so the proof stays phase 3L's implementer run, now independently audited |
| **Low 1, the first cut, fixed** | `phase-3l-check-outputs.md`'s Cuts row and its first cut marker now say **raw lines 121–702**. Raw lines 118–120 are kept, at that file's lines 239–241. The second cut, 740–872, was already right | **Executed** edit. **Inspected:** before the first cut, a copy line is its raw line plus 121, since the copy's line 122 is raw line 1. So lines 239–241 are raw 118–120 |
| **Low 2, the Grep, fixed** | The Cuts row now says the Grep for `not ok`, `Error`, `ERR` and `warn` **matched only raw line 27, the ESLint command line `eslint . --max-warnings=0`**, because `warn` is part of `--max-warnings`. It matched no `not ok`, `Error` or `ERR` | **Inherited**, the review's Grep. **Inspected:** the copy's line 148, raw line 27, is that line |
| **Low 3, the trailing spaces, fixed** | The outputs file's Normalization row and `handoff.md:348` now say **7 trailing spaces removed, at raw lines 96, 98, 100, 101, 103, 104 and 107, by the 0705 review's Grep**. These are the 7 coverage rows with an empty last column: `src`, `cli`, `contract.ts`, `dates.ts`, `finance.ts`, `index.ts` and `all files`. Phase 3J's 5 were different rows. The review cites `checkpoint.md:348`, but the sentence was at `handoff.md:348`, and it is fixed there. `final-2026-10-27T0635Z.md:21` is a raw final, so it is left as written, with a note in the file index | **Inherited**, the review's Grep and line-by-line comparison. **Inspected:** the 7 rows' identity, by the offset above. **Not re-counted:** phase 3L's count of the raw output was denied as a script (its run 20), so no other tool re-counted it |
| **Low 4, phase 3L's final state, recorded** | A "Final state" list now follows the table under "Commands run in phase 3L". It lists `git diff --check` (clean), `git status`, `git rev-parse HEAD main` (unchanged), the sha256 check and a Grep. The outputs file's hash there, **`d57c38100c149544d8dacc1e02537d0f5bbdafb18a9034cf9f4c54ea98fe2d20`, is its original phase-3L version** | **Inherited**, the review's reading of phase 3L's transcript. **Executed:** the same hash, before phase 3M's first edit (run 7) |
| The finals named | `final-2026-10-27T0635Z.md` is phase 3L's implementer report, sha256 `c3fb223ff526a110cbbf3ba76523b86665b23c06fd3557249c8f4518dfdcca94`. `final-2026-10-27T0705Z.md` is the 0705 review, sha256 `20443d43463909815bc9b8d014022c5c8f839de17b7d697fafd43fa1e4df6e04`. Both are named in the Reviews row, the Git row and the file index. Neither was edited | **Executed** (run 7) |
| The floor | Blob **`0036eedaf6de63003294b9ff7aa3ef157ab57c74`** at `HEAD` (run 4), sha256 `f0d4017c…` (run 7). **The real `main`, `c8a5d57`, has no floor file** (exit 128, run 5), so it is still unanchored | **Executed** |
| The records commit | Exactly the eleven paths of runs 2 and 7, each named. The results are written after the commit | **Executed**, after the commit |

**Self-review** (in place of the code-reviewer, security-reviewer and tdd-guide sub-agents, which Codex's brief forbade):
- **No code, test, config, threshold, floor, lockfile or dependency changed.** Three records files are edited: this file, `handoff.md` and `phase-3l-check-outputs.md`. The other eight untracked records are committed as they are.
- **No quality bar moved.** No gate ran, by the brief. The commit is records only, so the floor blob and every threshold stay as phase 3L's local CI-mode pass measured them.
- **The raw finals are unchanged.** The six finals are committed byte for byte, and their hashes are checked again before the commit. The 0635 report's stale line 21 and the 0705 review's mis-cited `checkpoint.md:348` are annotated here, not edited there.
- **Each figure is labelled** executed, inherited or inspected. The proof is still a local CI-mode implementer run, audited independently. It isn't hosted CI, and it isn't an independent re-run.
- **Security and the product rule.** No secret, credential, member, staff or health data was read or printed. No network, database, Supabase, Docker, `backend:test`, fixture, runner, replay, export, install, clone or rebase command ran. Under PRD 16.1 and ADR 003, gym staff never read or write a member's private health data, whatever the consent. That overrides any stale agent text, and the override stays until QA-2 is merged and the checkout the agents launch from is corrected. Neither QA-9's diff nor this phase touches any path that enforces it.

## Commands run in phase 3M

Every shell command went through a single `rtk proxy` form, one at a time. Files were read with Read and Grep, and written only with Edit.
- **Denied:** none before the commit's checks. *(Any later denial is written after the commit.)*
- **Not attempted:** a gate, test, install, clone, rebase, export, amend, reset, merge, stash, clean, fetch or push. No ref change beyond this branch's one commit. No command in the kept clone. No `backend:test`, database, Supabase, Docker, fixture, runner or replay. No re-read, re-grep or re-hash of phase 3L's raw output or transcript. No sub-agent, dispatcher or launch script.

| # | Command | Result |
|---|---|---|
| — | Read of RTK (both copies), this file's relevant parts, `handoff.md`, `phase-3l-check-outputs.md`, `final-2026-10-27T0635Z.md`, `final-2026-10-27T0705Z.md`, EXECUTION, the QA-9 card in GOALS, PRD §16.1 and the `run-goal` headings. Grep of this file for its headings and trailing-space notes, of `docs/` for the four lows' phrases, and of the outputs file for the lines the corrected header cites | Read |
| 1 | `rtk proxy date -u +%Y-%m-%dT%H:%M:%SZ` | `2026-10-27T08:03:58Z` |
| 2 | `rtk proxy git status --porcelain=v1 -b -uall` | `## codex/qa9-quality-ratchets`; ` M` this file and `handoff.md`; `??` nine files: the six finals 0435, 0505, 0535, 0605, 0635 and 0705, and the 3I, 3J and 3L outputs. Nothing else |
| 3 | `rtk proxy git rev-parse HEAD main` | `961e1f41104e414f045d5a9a42e8e9ca44acf083`, `c8a5d57c3a0999760ad21fd1aca4899ca76b5adf` |
| 4 | `rtk proxy git rev-parse HEAD:scripts/quality/coverage-floor.json` | `0036eedaf6de63003294b9ff7aa3ef157ab57c74` |
| 5 | `rtk proxy git cat-file -e main:scripts/quality/coverage-floor.json` | **Exit 128**, `fatal: path 'scripts/quality/coverage-floor.json' exists on disk, but not in 'main'` |
| 6 | `rtk proxy git status --porcelain=v1 --ignored` | The same eleven paths, plus `!!` for `apps/mobile/.expo/`, `apps/mobile/coverage/`, `apps/mobile/node_modules/` and `node_modules/` |
| 7 | `rtk proxy sha256sum` of the eleven paths, the floor, coverage-baseline.md and `pnpm-lock.yaml`, before any edit | Fourteen hashes, below |
| — | Edit of `phase-3l-check-outputs.md`, this file and `handoff.md` | This phase's records |

Run 7, before any edit. The six untracked files that phase 3L also hashed (the finals 0435 to 0605, and the 3I and 3J outputs), the floor, coverage-baseline.md and the lockfile have the same hashes as in phase 3L's runs 11 and 19. `phase-3l-check-outputs.md` has the hash in phase 3L's final-state list. The two records differ from phase 3L's run 11, because phase 3L edited them after it:

```text
384a466c3e97fdf6dde89034a2d6d718d98be7d4f67699e50cab3877b4c2f137  docs/plan/runs/QA-9/checkpoint.md
d443298e75c6cefb2df5069954db19fbcae0f533a30915c34a9524abc88a9698  docs/plan/runs/QA-9/handoff.md
d139b6f5765a317f6ed37b5f70e73e8d867b18d0ea98944584c2fab75bb76943  docs/evidence/QA-9/final-2026-10-27T0435Z.md
5f779f6c4e992c7f01b2a81d374fb49eae005d2ab6fe4c79cd6789bfda7dee23  docs/evidence/QA-9/final-2026-10-27T0505Z.md
62b452203d564d01840f515cc1304d5c95ca76c1038f4fec0349ce7732c582b7  docs/evidence/QA-9/final-2026-10-27T0535Z.md
2a0eb9db7fdcde0f4073d77c404cc850160ce7d66b09f8319bbeb96886619a7a  docs/evidence/QA-9/final-2026-10-27T0605Z.md
c3fb223ff526a110cbbf3ba76523b86665b23c06fd3557249c8f4518dfdcca94  docs/evidence/QA-9/final-2026-10-27T0635Z.md
20443d43463909815bc9b8d014022c5c8f839de17b7d697fafd43fa1e4df6e04  docs/evidence/QA-9/final-2026-10-27T0705Z.md
1b6964c1c16760c663ae7de29fd326b3540c4c5e08e2bc5224251fbc2ab5cd03  docs/evidence/QA-9/phase-3i-check-outputs.md
73431e58f7f5259e807c6714450ecee38ff725bb09715a05f13814f83cd3bc51  docs/evidence/QA-9/phase-3j-check-outputs.md
d57c38100c149544d8dacc1e02537d0f5bbdafb18a9034cf9f4c54ea98fe2d20  docs/evidence/QA-9/phase-3l-check-outputs.md
f0d4017c37f5bbd9ecba809d628f96f7bf12db7f0796e01329c2c0c16d646a4b  scripts/quality/coverage-floor.json
f8d23c1fc7ed98713d99da8b2b9019ce7b91e221d6156e84ffba401cf7695380  docs/evidence/QA-9/coverage-baseline.md
8aaac7f03b9aa141d8a0d4b9a91006799bb256d05051e26d81caee52ce0ea2b7  pnpm-lock.yaml
```

**Runs 8 and after:** the unstaged `--check`, a second hash of the same fourteen files, the stage of the eleven named paths, the staged names, stat and `--check`, the one commit, and the checks after it. They come after this text is written, so their results are recorded after the commit, uncommitted.

## Phase 3L: one local CI-mode gate against the exact `main` commit

*(Written after the gate, uncommitted. No commit is made in phase 3L.)* Codex's phase-3L brief (27 October 2026, AUTH-01) assigns one bounded phase, with no sub-agent, dispatch or launch script:
- inspect the scripts for effects;
- then run, **exactly once**, `rtk proxy env CI=true FITLOG_CONTRACT_BASELINE=c8a5d57c3a0999760ad21fd1aca4899ca76b5adf pnpm check`, on this goal branch, with the pinned Node 22.23.1;
- confirm the baseline is exactly the actual `main`, and that the tracked and untracked inventory is preserved;
- record the full SHA, the floor blob, the unanchored real `main`, the counts, the exit code and the provenance.

The gate may make only the normal ignored coverage, cache and temporary outputs. It's a local CI-mode proof, not hosted CI. On a refusal or failure, stop and record the cause, with no workaround and no weakened check. There is no clone, rebase or install, and no new gate after an unchanged success. Exports already proved aren't repeated. Backend, actual-`main` floor, hosted box 3 and exact integration proofs stay open. The PRD 16.1 and ADR 003 rule holds: gym staff never read or write a member's private health data, whatever the consent.

| Step | What happened | Runs |
|---|---|---|
| Effects inspected | Root `check`, the guard, the format step, the contract history test, typecheck, lint, the three test commands and `plan:build --check` were read. Git is only read. Prettier checks in memory. `--check` exits before any write. The only writes are the ignored `apps/mobile/coverage/` and OS-temp scratch and cache. `CI=true` turns on CI mode in the guard, the format step and the contract history test; Jest already had `--ci`. Nothing needs the network or a database | Read and Grep |
| Baseline confirmed | `main` is exactly **`c8a5d57c3a0999760ad21fd1aca4899ca76b5adf`**, and it is the fork point of `HEAD`. `HEAD` is **`961e1f41104e414f045d5a9a42e8e9ca44acf083`**, four QA-9 commits ahead | 2, 3, 12 |
| Floor | Blob **`0036eedaf6de63003294b9ff7aa3ef157ab57c74`** at `HEAD`. The real `main` has **no floor file** (exit 128): **unanchored** | 4, 5 |
| Node | `v22.23.1`. `which node` and `pnpm --version` were denied, and not retried in another form | 6–8 |
| Inventory before | Eight uncommitted paths: two modified and six untracked. Ignored: `apps/mobile/.expo/`, `apps/mobile/coverage/`, `apps/mobile/node_modules/` and `node_modules/`. Eleven hashes | 0, 9–11 |
| **Gate** | Run once, in the background, with no edit until it finished: **exit 0, 285 tests** (40 + 97 + 126 + 22). Guard: **1 baseline**, `FITLOG_CONTRACT_BASELINE@c8a5d57c3a09: checked; records no coverage minimums yet, so the floor applies`, then **"the floor is not anchored yet"**. Format step: **19 files**, `Base: FITLOG_CONTRACT_BASELINE@c8a5d57c3a09, from 06c822050d76, which adds scripts/quality/touched-format.mjs`, 39 not checked. Domain **537/583, 273/313, 106/117**. Mobile 254/2076, 164/1551, 84/821, 191/1023. Plan build matches. Raw output sha256 `bbb95d7f…483e57bb` | 13, 15 |
| After | The same eight paths, the same four ignored folders, the same eleven hashes, and `HEAD` and `main` unchanged. The count script on the raw output was denied, a script, so that sequence ended | 14, 16–20 |

Outputs: [phase-3l-check-outputs.md](../../../evidence/QA-9/phase-3l-check-outputs.md).

**What it shows:** CI mode accepts the exact `main` commit as the trusted baseline in all three places that read it, and the baseline replaces `HEAD` and `main`. The format step finds the rule's start at the first QA-9 commit and selects the 19 QA-9 files, as ratchet-enforcement.md §7's step 4 expects of the hosted run. The guard tells the truth about the real `main`: not anchored. **R19's CI-mode forecast holds at 273/313**, now measured. **R3 sample:** 537 lines, with none of the four known flippers uncovered.

**Three differences from earlier runs, each explained in the outputs file:** the guard counted 264 entries under `apps/mobile`, because the ignored `.expo/` export output adds 54. 39 paths weren't checked, not 36, because `961e1f4` added three Markdown files. Jest's cache was warm, so no cold run is claimed (Low 1).

**Self-review** (in place of the code-reviewer, security-reviewer and tdd-guide sub-agents, which Codex's brief forbade):
- **No code, test, config, threshold, floor, lockfile or dependency changed.** The diff is two records files and one new outputs file, uncommitted.
- **No quality bar moved.** The gate ran once, with no retry, and passed as measured. Nothing was relaxed, and no check was weakened or skipped.
- **The inventory and the raw finals are unchanged across the gate,** by hash (runs 11 and 19) and by status (runs 9–10 and 16–17).
- **Each figure is labelled** executed, inherited or inspected. The CI-mode claim is limited to local CI mode. Hosted CI, Linux, a fresh install and `GITHUB_ACTIONS` are named as not proved.
- **Security and the product rule.** No secret, credential, member, staff or health data was read or printed. No network, database, Supabase, Docker, `backend:test`, fixture, runner, replay, export, install, clone or rebase command ran. Under PRD 16.1 and ADR 003, gym staff never read or write a member's private health data, whatever the consent. That overrides any stale agent text, and the override stays until QA-2 is merged and the checkout the agents launch from is corrected. Neither QA-9's diff nor this phase touches any path that enforces it.

## Commands run in phase 3L

Every shell command went through a single `rtk proxy` form, one at a time. Files were read with Read, Grep and Glob, and written only with Write (the new outputs file) and Edit (the records).
- **Denied:** `rtk proxy which node` (run 7) and `rtk proxy pnpm --version` (run 8), both read-only orientation. Their facts came from permitted single reads already made: run 6, and the root `package.json`. `rtk proxy node -e`, a read-only count of the raw output (run 20), was a script, so that sequence ended with no other tool or form.
- **Not attempted:** a stage, commit, amend, reset, rebase, merge, stash, clean, fetch or push; any ref change; a second gate; an install or clone; any command in the kept clone; `backend:test`, an export, a database, Supabase, Docker, a fixture, a runner or a replay; a sub-agent, dispatcher or launch script.

| # | Command | Result |
|---|---|---|
| — | Read of RTK, this file's relevant parts, `handoff.md`, `final-2026-10-27T0605Z.md`, EXECUTION, the QA-9 card in GOALS, PRD §16.1, the root, domain and mobile `package.json`, and the parts of `coverage-ratchet.mjs`, `touched-format.mjs`, `coverage-ratchet.test.mjs`, `contract.test.ts` and `scripts/plan/build.mjs` that the gate runs. Grep for every `CI`, `GITHUB_*` and `FITLOG_CONTRACT_BASELINE` read, for writes in `scripts/quality/` and `scripts/plan/build.mjs`, for OS-temp use in the tests, and of `.npmrc`, `pnpm-workspace.yaml`, `.node-version` and `.gitignore` | Read |
| 0 | `rtk proxy git status --porcelain=v1 --untracked-files=all` | The eight paths |
| 1 | `rtk proxy date -u +%Y-%m-%dT%H:%M:%SZ` | `2026-10-27T06:05:41Z` |
| 2 | `rtk proxy git rev-parse HEAD main` | `961e1f41104e414f045d5a9a42e8e9ca44acf083`, `c8a5d57c3a0999760ad21fd1aca4899ca76b5adf` |
| 3 | `rtk proxy git merge-base c8a5d57c3a0999760ad21fd1aca4899ca76b5adf HEAD` | `c8a5d57c3a0999760ad21fd1aca4899ca76b5adf` |
| 4 | `rtk proxy git rev-parse HEAD:scripts/quality/coverage-floor.json` | `0036eedaf6de63003294b9ff7aa3ef157ab57c74` |
| 5 | `rtk proxy git cat-file -e main:scripts/quality/coverage-floor.json` | **Exit 128**, `fatal: path 'scripts/quality/coverage-floor.json' exists on disk, but not in 'main'` |
| 6 | `rtk proxy node --version` | `v22.23.1` |
| 7 | `rtk proxy which node` | **Denied** |
| 8 | `rtk proxy pnpm --version` | **Denied** |
| 9 | `rtk proxy git status --porcelain=v1 -b -uall` | `## codex/qa9-quality-ratchets`, ` M` this file and `handoff.md`, and `??` six untracked files |
| 10 | `rtk proxy git status --porcelain=v1 --ignored` | The same, plus `!!` for `apps/mobile/.expo/`, `apps/mobile/coverage/`, `apps/mobile/node_modules/` and `node_modules/` |
| 11 | `rtk proxy sha256sum` of the eight paths, the floor, coverage-baseline.md and `pnpm-lock.yaml` | Eleven hashes, in the outputs file. The floor is `f0d4017c…`, coverage-baseline.md `f8d23c1f…` and the lockfile `8aaac7f0…`, as phase 3J recorded |
| 12 | `rtk proxy git log --oneline c8a5d57c3a0999760ad21fd1aca4899ca76b5adf..HEAD` | `961e1f4`, `c84bb4c`, `557b779` and `06c8220` |
| 13 | **`rtk proxy env CI=true FITLOG_CONTRACT_BASELINE=c8a5d57c3a0999760ad21fd1aca4899ca76b5adf pnpm check`**, once, in the background (task `btpmpv0ep`) | **Exit 0, 285 tests.** Details above, and the output in the outputs file |
| 14 | `rtk proxy date -u +%Y-%m-%dT%H:%M:%SZ` | `2026-10-27T06:06:33Z`. The gate took at most 52 seconds |
| 15 | `rtk proxy sha256sum` of the raw output file | `bbb95d7f2e56d0ed0c83cbfc047d0f0d10b3c9f2ad714bd672da5b13483e57bb` |
| 16 | `rtk proxy git status --porcelain=v1 -b -uall` | The same as run 9 |
| 17 | `rtk proxy git status --porcelain=v1 --ignored` | The same as run 10 |
| 18 | `rtk proxy git rev-parse HEAD main` | Unchanged |
| 19 | `rtk proxy sha256sum` of the same eleven files | **All eleven unchanged** |
| 20 | `rtk proxy node -e` byte, line and trailing-space count of the raw output | **Denied**, a script, so its sequence ended |
| — | Glob of `apps/mobile/.expo/**/*` and `apps/mobile/coverage/**/*` | 44 and 2 files, which explain the guard's 264 entries |
| — | Write of `phase-3l-check-outputs.md`; Edit of this file and `handoff.md` | This phase's records |

**Final state of phase 3L, after its last edit** *(3M, 0705 review Low 4. Added in phase 3M: phase 3L ran these checks but didn't number or record them. Their results are **inherited** from the 0705 review's reading of phase 3L's transcript, session `fcdc094a-2ab4-41c2-a1a9-82f0c1f558a9`, after its last edit at transcript line 643. Phase 3M didn't re-run them for phase 3L.)*
- `git diff --check`: clean. This is the check `final-2026-10-27T0635Z.md:19` cites.
- `git status`: run. The review gives no separate result for it. The 0635 report gives nine uncommitted paths at that point.
- `git rev-parse HEAD main`: unchanged, `961e1f41104e414f045d5a9a42e8e9ca44acf083` and `c8a5d57c3a0999760ad21fd1aca4899ca76b5adf`.
- A sha256 of the finals, the 3I and 3J outputs, the floor and the new outputs file. **`phase-3l-check-outputs.md` was `d57c38100c149544d8dacc1e02537d0f5bbdafb18a9034cf9f4c54ea98fe2d20`, its original phase-3L version.** Phase 3M's run 7 found the same hash before phase 3M's first edit (executed). Phase 3M then corrected that file for Lows 1–3, so any later hash of it differs.
- A Grep. The review doesn't give its pattern.

## Phase 3K: records only, the 0535 review accepted

*(Written in phase 3K, uncommitted. No commit, stage, gate, test, install or clone command ran.)* Codex's phase-3K brief (27 October 2026, AUTH-01) accepts the independent floor proof in the [0535 review](../../../evidence/QA-9/final-2026-10-27T0535Z.md) (acceptance (15)). It assigns one records-only phase, with no sub-agent or dispatcher. In the Source column, **executed** means by phase 3K, **inherited** means from another session's run, and **inspected** means read only.

| Item | Recorded | Source |
|---|---|---|
| The accepted proof | `pnpm check` once, on Node v22.23.1, in the kept clone at `HEAD` = `main` = `961e1f4`, 05:06:16Z–05:07:08Z. Exit 0, **285 tests** (40 + 97 + 126 + 22) and **0 format files**, `Base: main@961e1f41104e`. The guard read 1 Git baseline and printed no "not anchored" line. Domain **536/583, 273/313, 106/117**. Mobile 254/2076, 164/1551, 84/821, 191/1023. Plan build matches. **No critical, high or medium finding** | **Inherited** from the 0535 review's session, and not re-run |
| Against phase 3J | 13 lines differ. The guard counted 210 entries, not 207, because `apps/mobile/coverage/` now existed. `dates.ts:19` was covered, giving 536 lines not 535: a known R3 flip at the same commit. The Jest order and timing came from the reused cache | **Inherited**, the 0535 review |
| **Low 3, the clone path, fixed** | `/var/folders/0s/4k0smcx56zl9hdj404qnz2s80000gp/T/fitlog-qa9-floor.dGGhev2tS6/clone`, whose real path is `/private/var/folders/0s/4k0smcx56zl9hdj404qnz2s80000gp/T/fitlog-qa9-floor.dGGhev2tS6/clone`. **There is no `<root>/repo`.** No current record ever named `repo`; that was in the coordinator's brief. So the fix is this exact path, written into the current records | **Inspected**: phase-3j-check-outputs.md, the clone at run 13 and its real path at run 28. **Inherited**: `repo` absent, from the 0535 review |
| The floor | Blob **`0036eedaf6de63003294b9ff7aa3ef157ab57c74`** at this branch's `HEAD` (run 5). It equals the blob phase 3J recorded at the clone's `HEAD` and `main`. sha256 `f0d4017c37f5…` is unchanged (runs 4 and 8) | **Executed** (runs 4, 5 and 8), and the blob in phase-3j-check-outputs.md |
| The real `main` | `c8a5d57c3a0999760ad21fd1aca4899ca76b5adf`, with **no** `scripts/quality/coverage-floor.json`: `fatal: path … exists on disk, but not in 'main'`, exit 128 (run 6). **Unanchored** | **Executed** (runs 3, 6 and 9) |
| **Low 1, the shared temp folder and cache, accepted** | Codex accepts it as a disclosed limitation of a local proof. Neither phase 3J's run nor the review's claims a cold Jest run, and no new run is owed for the cache alone | Codex's brief |
| **Low 2, the denial rule, recorded** | A denied compound or non-allowlisted read-only orientation step may be done with already permitted single read forms. A denied write, gate or script step ends its sequence. Never retry it with another tool or form, and never get round a safety decision. Phase 3I's stop and phase 3J's single-form orientation both fit this rule | Codex's brief |
| **Low 4, the finals, fixed** | `final-2026-10-27T0505Z.md` is named as phase 3J's implementer report, and `final-2026-10-27T0535Z.md` as the 0535 review, each with its full sha256. The Git row has the exact seven-path inventory | **Executed** (runs 2, 4, 8 and 10) |
| **PL-1's H1, captured** | Below | Codex's brief. Codex's PL-1 launch brief, **inspected** read-only in `/tmp` |

**PL-1's new H1, a skip-guard gap, high, PL-1's to fix.** As Codex's briefs describe it, a single change could skip or disable a required CI job or step and let its check pass without running the gate. The ways in are a job or step skip, `needs`, `continue-on-error`, the default shell, the event and a path filter.
- **Why QA-9's pins don't close it:** QA-9's text pins of `mobile-ci.yml` run inside the `check` job they protect, through `pnpm check`. So they can't see that job or its `pnpm check` step being skipped. *(Inference by reading QA-9's records. It isn't checked in a workflow.)*
- **The fix, in PL-1's lane:** Codex chose a separate **required** `ci-guard` workflow, which PL-1 owns (`.github/workflows/ci-guard.yml` and `scripts/ci/`). It cross-checks the workflows, fails closed, and catches a single disabling change. It doesn't claim to stop a coordinated edit of every guard. That is still R2.
- **Future protection** needs all three required checks: **`check`, `backend` and `ci-guard`**. Box 3's hosted proof and branch protection should show all three.
- **No root wiring change now:** QA-9 changes nothing in root `package.json`, `gate-wiring.mjs` or any workflow in this phase.

This phase didn't open PL-1's worktree, review or files.

**Self-review** (in place of the code-reviewer, security-reviewer and tdd-guide sub-agents, which Codex's brief forbade):
- **No code, test, config, threshold, floor, lockfile or wiring changed.** The diff is two records files, uncommitted.
- **No quality bar moved.** No gate ran, and no result is claimed beyond its source. Each figure is labelled executed, inherited or inspected.
- **The raw finals are unchanged:** all five untracked files and the floor hash the same before and after (runs 4 and 8).
- **Security and the product rule.** No secret, credential, member, staff or health data was read or printed. No network, database, Supabase, Docker, `backend:test`, runner or replay operation ran. Under PRD 16.1 and ADR 003, gym staff never read or write a member's private health data, whatever the consent. That overrides any stale agent text, and the override stays until QA-2 is merged and the checkout the agents launch from is corrected. Neither QA-9's diff nor this phase touches any path that enforces it.

## Commands run in phase 3K

Every shell command went through a single `rtk proxy` form, one at a time, and all were read-only. Files were read with Read, Grep and Glob, and written only with Edit.
- **Denied:** none.
- **Not attempted:** a stage, commit, amend, reset, rebase, merge, stash, clean, fetch or push; any ref change; `pnpm check`, `node --test` or any other gate or test; an install; any command in the clone; `backend:test`, an export, a CI-mode run, a database, Supabase, Docker, a fixture, a runner or a replay; a sub-agent or dispatcher. Also not run: the Python launcher pasted at the end of the brief, which would have started new sessions.

| # | Command | Result |
|---|---|---|
| — | Read of RTK, this file's relevant parts, `handoff.md`, both phase-3J finals, phase 3K's launch file `/tmp/fitlog-qa9-record0535-launch.json` (the allowlist), and Codex's PL-1 brief `/tmp/fitlog-pl1-fix0535-launch.json` (for H1's wording). Grep of phase-3j-check-outputs.md for the folder, the blob and `repo`; of GOALS for QA-9; of EXECUTION; and of PRD §16.1. Glob of `/tmp/fitlog-*0535*` | Read |
| — | Grep of `docs/` for `<root>/repo` or `dGGhev2tS6/repo` | Only in the 0535 review's Low 3 text, so no current record named it |
| 1 | `rtk proxy date -u +%Y-%m-%dT%H:%M:%SZ` | `2026-10-27T05:34:47Z` |
| 2 | `rtk proxy git status --porcelain=v1 -b -uall` | ` M` this file and `handoff.md`; `??` the five untracked files |
| 3 | `rtk proxy git rev-parse HEAD main` | `961e1f41104e…`, `c8a5d57c3a09…` |
| 4 | `rtk proxy sha256sum` of the five finals 0335 to 0535, both outputs files, the floor and coverage-baseline.md | Nine hashes. 0505 is `5f779f6c…` and 0535 `62b45220…`. The floor is `f0d4017c…` and coverage-baseline.md `f8d23c1f…`, both as phase 3J recorded |
| 5 | `rtk proxy git rev-parse HEAD:scripts/quality/coverage-floor.json` | `0036eedaf6de63003294b9ff7aa3ef157ab57c74` |
| 6 | `rtk proxy git cat-file -e main:scripts/quality/coverage-floor.json` | **Exit 128**, `fatal: path 'scripts/quality/coverage-floor.json' exists on disk, but not in 'main'` |
| — | Edit of this file and `handoff.md` | This phase's records |

**Final state, runs 7 and after,** checked after these notes were written. Their results are written below.
- **Run 7,** `rtk proxy git diff --check`: clean, no output.
- **Run 8,** `rtk proxy sha256sum` of the same nine files as run 4: **all nine unchanged**.
- **Run 9,** `rtk proxy git rev-parse HEAD main`: `961e1f41104e414f045d5a9a42e8e9ca44acf083` and `c8a5d57c3a0999760ad21fd1aca4899ca76b5adf`, unchanged.
- **Run 10,** `rtk proxy git status --porcelain=v1 -b -uall`: ` M` for this file and `handoff.md`, and `??` for the five untracked files the Git row lists. Nothing else.
- **Run 11,** `rtk proxy git diff --stat`: the two records, 454 insertions and 14 deletions against `HEAD`, including phases 3I and 3J's uncommitted notes.
- **Run 12,** `rtk proxy date -u`: `2026-10-27T05:40:03Z`, the end of the phase's checks. Written after it: only this paragraph, and the handoff's note that `…/repo`'s absence is the 0535 review's check, inherited.

## Phase 3J: the floor proof at `HEAD` = `main`, resumed and run once

*(Written after the gate, uncommitted. No commit is made in phase 3J.)* Codex's phase-3J brief (27 October 2026, AUTH-01) accepts records commit `961e1f4` as five scoped records paths only, not a code change (acceptance (14)). It assigns one bounded phase, with no sub-agent or dispatcher:
1. use phase 3I's kept folder, `/var/folders/0s/4k0smcx56zl9hdj404qnz2s80000gp/T/fitlog-qa9-floor.dGGhev2tS6`, after checking that it is outside every repository and empty. Make `empty-template`, `empty-hooks` and `tmp` with a literal `mkdir` under that folder only;
2. clone this local goal checkout at exactly `961e1f4`, with the empty template and hooks, into that folder. No fetch, no network and no real ref moves. Set `main` = `HEAD` in the clone only;
3. use the pinned Node 22.23.1 on `PATH`, and an offline frozen install with `--ignore-scripts`, which Codex accepts in order to avoid Supabase's install download. No lockfile or dependency edit. Prefer the install to a symlinked `node_modules`;
4. run the pinned `pnpm check` at `HEAD` = `main` **once**. Expected: 285 tests, 0 format files, domain branches at least 272/313, lines at least 533/583 and functions at least 106/117, and the floor's bytes equal to §5. Record exact counts, hashes, raw output and times. On failure, no retry and nothing lowered;
5. **no commit**, no cleanup or deletion, and no change to tests, code, config, thresholds or dependencies. The raw finals stay unchanged;
6. the backend, the exports and hosted proof are deferred, and there is no real `main` change, integration, database, Supabase, Docker, fixture or runner operation. Box 3 stays open, and a fresh independent review follows. No Done is claimed.

| Step | What happened | Runs |
|---|---|---|
| Orientation | `HEAD` `961e1f4`, `main` `c8a5d57`, Node v22.23.1 at `/Users/Adya/.hermes/node/bin/node`. Four uncommitted paths: this file and `handoff.md` modified, and the two untracked files. The four finals and the floor hashed | 1–6 |
| Folder checked | Outside every repository (exit 128). **Empty**, hidden entries included, a real directory, mode 700 | 7–8 |
| Git config | No template, hooks path, fsmonitor, clone default, submodule recursion, protocol rule, filter or upload-pack key at any level. No `.gitattributes` filter. Git 2.54.0 | 9–10 |
| Folder setup | `mkdir` of `empty-template` and `empty-hooks`, each **allowed**. `tmp` not made: the allowlist has no `TMPDIR=` form for the gate | 11–12 |
| Clone | From this worktree's local path, `--template=<root>/empty-template`, `-c core.hooksPath=<root>/empty-hooks`, `--no-hardlinks`, `--branch codex/qa9-quality-ratchets`. `HEAD` is **exactly `961e1f4`**. Only remote: this worktree's path. No hooks folder, and `.git` is its own directory. Clean | 13–17 |
| `main` = `HEAD`, clone only | `checkout -B main 961e1f4…`. `HEAD`, `main` and the branch are all `961e1f4`, `HEAD` names `refs/heads/main`, and the tree is clean. The clone's `origin/main` is `c8a5d57`, its copy of this repository's `main`. **This repository's `main` stayed at `c8a5d57`** | 18–22 |
| Floor bytes | sha256 `f0d4017c…` and blob `0036eeda…` in this worktree, the clone's working tree and the clone's `HEAD` and `main`. coverage-baseline.md and the lockfile are identical too. Values equal §5 and scope equals §1, by Read | 6, 23–26 |
| Install | `cd` into the clone, confirmed by `process.cwd()`. No `node_modules` before. `pnpm install --frozen-lockfile --offline --ignore-scripts`: **exit 0, `downloaded 0`, `Packages: +1096`**, pnpm v10.27.0, 04:40:04Z–04:40:21Z. Tree clean, and the lockfile hash unchanged | 27–34 |
| **Gate** | `pnpm check`, once, in the background, 04:40:29Z–04:41:42Z: **exit 0, 285 tests** (40 + 97 + 126 + 22). Format step **0 files**, `Base: main@961e1f41104e`. Guard: **1 baseline**, `main@961e1f41104e: same commit as an earlier baseline`, and **no "not anchored" line**. Domain **535/583, 273/313, 106/117**. Mobile 254/2076, 164/1551, 84/821, 191/1023. Plan build matches | 35–38 |
| After | The clone is clean at `HEAD` = `main` = `961e1f4`. The floor and lockfile hashes are unchanged. This repository's `HEAD` and `main` are unchanged, and its status is as before. The raw output is 44,207 bytes, 889 lines, sha256 `6dc7f0ba…`, with trailing spaces on 5 coverage rows only | 39–44 |
| Record | The outputs file copies run 36 whole, with the 5 trailing spaces removed. A mechanical comparison shows the copy equal, line by line | 45 |

Outputs: [phase-3j-check-outputs.md](../../../evidence/QA-9/phase-3j-check-outputs.md).

**Against the expectations:** every one is met. 285 tests and 0 format files, as expected. Branches 273 ≥ 272, lines 535 ≥ 533 and functions 106 ≥ 106. The floor's bytes are identical at each place, and its values equal §5. The 0405 review's forecasts hold too: no `from` clause on the label, and no "not anchored" line.

**Two differences from phase 3H, both explained:**
- **The guard counted 1 baseline, not 2,** because `HEAD` and `main` are one commit here. That is the state being proved.
- **The guard counted 207 entries under `apps/mobile`, not 210.** This worktree holds `apps/mobile/coverage/` and its two files from earlier runs (Glob). The fresh clone gained them only when Jest ran, after all three guard runs.

**Self-review** (in place of the code-reviewer, security-reviewer and tdd-guide sub-agents, which Codex's brief forbade):
- **No code, test, config, threshold, floor or dependency changed,** here or in the clone. The diff is three records files, uncommitted. The clone's tree was clean after the install and after the gate.
- **No quality bar moved.** The gate ran once, with no retry. Every expectation was met as measured, and nothing was relaxed to meet it.
- **The raw finals are unchanged.** The four finals and `phase-3i-check-outputs.md` hash the same before and after (runs 6 and 46).
- **The evidence matches the raw output,** by a mechanical check (run 45), not only by reading.
- **Security and the product rule.** No secret, key, member, staff or health data was read or printed. The Git config read named only hook, template, filter and protocol keys, so no credential setting was shown. No backend, database, Supabase, Docker, fixture, network or replay command ran. The install was offline and ran no install script. PRD 16.1 and frozen003 hold: gym staff never read or write a member's private health data, whatever the consent. That overrides any stale agent text, and the override stays until QA-2 is merged and the checkout the agents launch from is corrected. Neither QA-9's diff nor this phase touches any path that enforces it.
- **What a reviewer should weigh:** the gate's scratch fixtures and caches went to the session's default temporary folder, not to `<root>/tmp`, and the proof is a simulation of `HEAD` = `main` at the same commit, not integration. Both are recorded in the outputs file.

## Commands run in phase 3J

Every allowed shell command went through `rtk proxy`, one at a time, apart from one `cd` (run 27). Git commands named their repository with `-C` after run 6. Files were read with Read, Grep and Glob, and written with Write and Edit.
- **Denied in dontAsk mode, not retried:** run 0, the compound `pwd; git rev-parse HEAD; git rev-parse --abbrev-ref HEAD; git status --porcelain; ls docs/plan/runs/QA-9/ docs/evidence/QA-9/`. That orientation sequence ended there. Glob listed those two folders, and single `rtk proxy git` commands read the status.
- **Not attempted:** a commit, stage, amend, reset, rebase, merge, stash, clean, fetch, push or remote command in this repository; any change to this repository's `main` or another ref; `tmp/`, a `TMPDIR` change, a symlinked `node_modules`, a second `pnpm check`, `backend:test`, an export, a CI-mode run, a database, Supabase, Docker, a fixture, a replay, a sub-agent, a dispatcher, the pasted launcher code, and any deletion.

| # | Command | Result |
|---|---|---|
| 0 | the compound orientation command above | **Denied** |
| — | Read of RTK, GOALS (QA-9), PRD §16.1, phase 3I's final, this file, `handoff.md`, `phase-3i-check-outputs.md`, `phase-3h-check-outputs.md`, the root `package.json`, `.node-version`, `.npmrc`, `pnpm-workspace.yaml`, coverage-baseline.md §1 and §5, and the guard, format check and quality test 2; Read of `/tmp/fitlog-qa9-floor0435-launch.json` for the allowlist | Read |
| 1 | `rtk proxy date -u +%Y-%m-%dT%H:%M:%SZ` | `2026-10-27T04:38:17Z` |
| 2 | `rtk proxy git status --porcelain=v1 -b -uall` | The four uncommitted paths |
| 3 | `rtk proxy git rev-parse HEAD main` | `961e1f4…`, `c8a5d57…` |
| 4 | `rtk proxy node --version` | `v22.23.1` |
| 5 | `rtk proxy node -p process.execPath` | `/Users/Adya/.hermes/node/bin/node` |
| 6 | `rtk proxy sha256sum` of the four finals' and outputs' paths, the floor and coverage-baseline.md | Six hashes |
| 7 | `rtk proxy git -C <root> rev-parse --show-toplevel` | Exit 128: outside every repository |
| 8 | `rtk proxy node -e` with `lstatSync`, `realpathSync` and `readdirSync` of `<root>` | Empty, a directory, not a link, mode 700 |
| 9 | `rtk proxy git config --show-origin --get-regexp` with one pattern naming the template, hooks-path, fsmonitor, clone, submodule-recursion, protocol, filter and upload-pack keys (written out in the outputs file, run 9) | Exit 1, none set |
| — | Grep of `.gitattributes` for `filter=` and `lfs` | No match |
| 10 | `rtk proxy git --version` | `git version 2.54.0 (Apple Git-157)` |
| 11 | `rtk proxy mkdir <root>/empty-template` | Made |
| 12 | `rtk proxy mkdir <root>/empty-hooks` | Made |
| 13 | `rtk proxy git clone --template=<root>/empty-template -c core.hooksPath=<root>/empty-hooks --no-hardlinks --branch codex/qa9-quality-ratchets <this worktree> <root>/clone` | `done.` |
| 14 | `rtk proxy git -C <root>/clone rev-parse HEAD` | `961e1f41104e414f045d5a9a42e8e9ca44acf083` |
| 15 | `rtk proxy git -C <root>/clone config --local --list --show-origin` | Hooks path set; only remote this worktree's path |
| 16 | `rtk proxy git -C <root>/clone status --porcelain=v1 -b -uall` | Clean |
| 17 | `rtk proxy node -e` with `readdirSync` of `<root>`, both empty folders and the clone's `.git` | No hooks folder; empty folders empty |
| 18 | `rtk proxy git -C <root>/clone checkout -B main 961e1f41104e414f045d5a9a42e8e9ca44acf083` | `Switched to a new branch 'main'` |
| 19 | `rtk proxy git -C <root>/clone rev-parse HEAD main refs/heads/main origin/main codex/qa9-quality-ratchets` | `961e1f4…` four times, `origin/main` `c8a5d57…` |
| 20 | `rtk proxy git -C <root>/clone symbolic-ref HEAD` | `refs/heads/main` |
| 21 | `rtk proxy git -C <root>/clone status --porcelain=v1 -b -uall` | `## main`, clean |
| 22 | `rtk proxy git rev-parse HEAD main` (this worktree) | Unchanged |
| 23 | `rtk proxy sha256sum` of the clone's floor, coverage-baseline.md, both lockfiles and the clone's `.node-version` | Equal to this worktree's |
| 24 | `rtk proxy git -C <root>/clone rev-parse HEAD:<floor> main:<floor> HEAD:<baseline>` | `0036eeda…` twice, `ac25d0ff…` |
| 25 | `rtk proxy git -C <root>/clone hash-object <floor> <baseline>` | The same two blobs |
| 26 | `rtk proxy git rev-parse 961e1f4…:<floor> 961e1f4…:<baseline>` (this worktree) | The same two blobs |
| — | Read of the clone's floor and `.node-version` | As recorded |
| 27 | `cd <root>/clone` | Allowed; the harness named it the working directory |
| 28 | `rtk proxy node -p "process.cwd()"` | The clone's real path |
| 29 | `rtk proxy node -e` with `existsSync` of the three `node_modules` folders | None existed |
| 30 | `rtk proxy date -u +%Y-%m-%dT%H:%M:%SZ` | `2026-10-27T04:40:04Z` |
| 31 | `rtk proxy pnpm install --frozen-lockfile --offline --ignore-scripts` | **Exit 0**, `downloaded 0`, `+1096` |
| 32 | `rtk proxy date -u +%Y-%m-%dT%H:%M:%SZ` | `2026-10-27T04:40:21Z` |
| 33 | `rtk proxy git -C <root>/clone status --porcelain=v1 -b -uall` | Clean |
| 34 | `rtk proxy sha256sum <root>/clone/pnpm-lock.yaml` | Unchanged |
| 35 | `rtk proxy date -u +%Y-%m-%dT%H:%M:%SZ` | `2026-10-27T04:40:29Z` |
| 36 | `rtk proxy pnpm check`, background task `b2ytqnhul` | **Exit 0, 285 tests** |
| 37 | `rtk proxy git -C <this worktree> rev-parse main`, during run 36 | `c8a5d57…` |
| 38 | `rtk proxy date -u +%Y-%m-%dT%H:%M:%SZ` | `2026-10-27T04:41:42Z` |
| — | Read of run 36's output file | Whole |
| 39 | `rtk proxy git -C <root>/clone status --porcelain=v1 -b -uall` | Clean |
| 40 | `rtk proxy git -C <root>/clone rev-parse HEAD main` | `961e1f4…` twice |
| 41 | `rtk proxy sha256sum` of run 36's output, the clone's floor and lockfile | `6dc7f0ba…`; floor and lockfile unchanged |
| 42 | `rtk proxy git -C <this worktree> rev-parse HEAD main` | Unchanged |
| 43 | `rtk proxy git -C <this worktree> status --porcelain=v1 -b -uall` | As run 2 |
| 44 | `rtk proxy node -e`, a read-only count of run 36's output | 44,207 bytes, 889 lines, trailing spaces on lines 97, 99, 101, 105 and 108 |
| — | Glob of `apps/mobile/coverage/**` in this worktree and in the clone | Two files in each |
| — | Write of `phase-3j-check-outputs.md` | New |
| 45 | `rtk proxy node -e`, a read-only comparison of the outputs file's copy with run 36's raw output | **Equal**, 889 lines; only the 5 trimmed rows differ from the raw bytes |
| — | Edit of `handoff.md` and this file | This phase's records |

**Final state, runs 46 and after,** checked after these notes, so the counts don't include this paragraph's own lines. Their results are written below.
- **Run 46,** `rtk proxy sha256sum` of the same six files as run 6: **all six hashes unchanged**. That covers the three finals, `phase-3i-check-outputs.md`, the floor and coverage-baseline.md.
- **Run 47,** `git -C <this worktree> diff --check`: clean. A Grep found no trailing whitespace in the untracked `phase-3j-check-outputs.md`.
- **Run 48,** `git -C <this worktree> status --porcelain=v1 -b -uall`: ` M` for this file and `handoff.md`, and `??` for `final-2026-10-27T0435Z.md`, `phase-3i-check-outputs.md` and `phase-3j-check-outputs.md`. Nothing else.
- **Run 49,** `git -C <this worktree> diff --stat`: the two records, 302 insertions and 12 deletions against `HEAD`, phase 3I's uncommitted notes included.
- **Run 50,** `git -C <this worktree> rev-parse HEAD main`: `961e1f41104e414f045d5a9a42e8e9ca44acf083` and `c8a5d57c3a0999760ad21fd1aca4899ca76b5adf`, unchanged.
- **Run 51,** `date -u`: `2026-10-27T04:50:58Z`, the end of the phase. **Run 52,** `cd` back into this worktree.

## Phase 3I: the 0405 review's lows, the records commit, and the floor proof in a disposable clone

*(Written before the records commit, and part of it. The results come after the floor proof, uncommitted.)* Codex's phase-3I brief (27 October 2026, AUTH-01) accepts the [0405 review](../../../evidence/QA-9/final-2026-10-27T0405Z.md) of the rebased `c84bb4c` (acceptance (13)). It assigns one bounded phase:
1. fix the review's two record lows. Name `final-2026-10-27T0335Z.md` as the phase-3H implementer's report, session `6a4c540a…`, unchanged, and name `final-2026-10-27T0405Z.md` as the current review. Correct the stale uncommitted inventory in place. Mark Metro's module counts as variable and identify the bundles by their stable `.hbc` filenames. Keep the raw outputs and the verbatim finals as they are, with annotations outside them;
2. stage exactly the five owned records (`checkpoint.md`, `handoff.md`, `phase-3h-check-outputs.md`, `final-2026-10-27T0335Z.md`, `final-2026-10-27T0405Z.md`), inspect the staged names, stat and `--check`, then make **one** local records commit, with no amend or push. No code, config, floor or dependency change. `main` must stay at `c8a5d57`;
3. then a guarded throwaway clone, at a literal `mktemp` path outside every repository, with an empty template and empty hooks, cloned from this local goal checkout only, with no external remote and no fetch. Clone the exact new tip, and set `main` to `HEAD` only inside the clone. Never move this repository's `main` or any branch ref;
4. in the clone, an offline frozen install with no download, then the pinned Node 22.23.1 gate at `HEAD` = `main`, **once**. Every fixture and clone is writable only inside the owned disposable folder, and none is deleted in this phase;
5. expect 285 tests, **0** format files, domain branches at least 272/313, lines at least 533/583 and functions at least 106/117. On any failure, stop: no retry, no floor or threshold lowered;
6. record the floor's bytes against coverage-baseline.md §5, the `main` = `HEAD` hashes, the raw outputs with timestamps, and the provenance;
7. the optional CI imitation (`CI=true FITLOG_CONTRACT_BASELINE=…`) is deferred;
8. no backend, database, fixture, Supabase, Docker, network, integration into `main`, status, ledger or hosted proof, and no push, pull request or published action. Box 3 stays open: it needs the owner's specific approval to push. No Done is claimed.

| Item | Handling |
|---|---|
| 0405 review finding 1, low (the uncommitted inventory, and `final-2026-10-27T0335Z.md` named nowhere) | **Fixed in place** with tags: "Resume here (phase 3H)" step 2, the Git row and run 36. Both `final-…` files have rows in the file index and the Reviews row. Neither file is renamed or edited |
| 0405 review finding 2, low (Metro's iOS module count used to identify the bundle) | **Tagged in place** at `handoff.md`'s phase-3H block and export row, and this file's phase-3H export row. For the two verbatim files, the note sits outside them: after the export block in `phase-3h-check-outputs.md`, and in the file-index row for `final-2026-10-27T0335Z.md` |
| The review's "Next phase" step 2 (floor proof) | **This phase**, at the new tip, as the brief sets it out. The review's forecast of 0 format files is the brief's expectation |

`ratchet-enforcement.md` is not changed in this phase, as in phase 3H.

*(Written after the commit and the stop, uncommitted.)* **The records commit went as the brief expected. The floor proof stopped at its first write, by the brief's rule on denials. Nothing was retried, and nothing was worked around.**

| Step | What happened | Runs |
|---|---|---|
| Records commit | **`961e1f41104e414f045d5a9a42e8e9ca44acf083`**, `docs(QA-9): record phase 3H results and the 0405 review`, parent `c84bb4c`. The staged set was exactly the five paths: 717 insertions and 18 deletions, numstat 43/0, 62/0, 404/0, 152/6 and 56/12. Staged `--check` was clean. There was no hook output, and the tree was clean afterwards. Committed at `2026-10-27T09:39:27+05:30` (04:09:27Z) | 5–15, 22 |
| Only the records moved | `git diff --name-only c84bb4c HEAD` lists exactly the five. `main` is still `c8a5d57c3a0999760ad21fd1aca4899ca76b5adf`, before and after. Each of the four branch commits has one parent | 3, 14, 16, 17, 25 |
| Disposable folder | `mktemp -d -t fitlog-qa9-floor` made `/var/folders/0s/4k0smcx56zl9hdj404qnz2s80000gp/T/fitlog-qa9-floor.dGGhev2tS6`. `git -C <it> rev-parse --show-toplevel` exited 128, "not a git repository", so it is outside every repository | 18–19 |
| **Stop** | `rtk proxy mkdir` of `empty-template`, `empty-hooks` and `tmp` inside it was **denied** in dontAsk mode. **The sequence stopped.** No clone, `main` = `HEAD`, install, `pnpm check` or hash record. The subfolders weren't made any other way. A Glob of the folder found no file. The folder is kept | 20 |
| Floor file, read only | At `961e1f4`, `coverage-floor.json` holds mobile 12.23 / 10.57 / 10.23 / 18.67 and domain 91.42 / 86.90 / 90.59. Those **equal coverage-baseline.md §5**, value by value. This is inspected, not the `HEAD` = `main` proof. The §1 scope is inherited from the 0405 review | 23 |
| `date -u` | **Denied.** The commit time from `git log` is the phase's one timestamp | 21 |

Outputs: [phase-3i-check-outputs.md](../../../evidence/QA-9/phase-3i-check-outputs.md).

**What the resumed floor proof needs** (from reading, not runs; the outputs file has the exact forms):
- **an empty template and hooks.** Either an allowed `mkdir`, or Git's own `--template=` and `-c core.hooksPath=/dev/null`, with `TMPDIR` set to the folder itself. Codex chooses. Phase 3I didn't switch forms after the denial, because the brief says to stop;
- **`--ignore-scripts` on the offline install.** `pnpm-workspace.yaml`'s `onlyBuiltDependencies` lists `supabase`, whose `postinstall` downloads the Supabase CLI unless pnpm reuses a cached build. No workspace package has an install script or a patch, so the flag skips only the builds of `supabase`, `esbuild` and `unrs-resolver`;
- **the expected results:** 0 format files, labelled `Base: main@<tip>` with no `from` clause (`touched-format.mjs:98`, `:155-156`), no "floor is not anchored" line (the 0405 review's forecast), 285 tests, and domain at least 272/313, 533/583 and 106/117.

**Self-review** (in place of the code-reviewer, security-reviewer and tdd-guide sub-agents, which Codex's brief forbade):
- **No code, test, config, threshold, floor or dependency changed.** The records commit is five Markdown files, and `git diff --name-only c84bb4c HEAD` shows only them.
- **The verbatim files are unchanged.** The two finals were committed at the line counts Read showed before this phase, and `phase-3h-check-outputs.md`'s captured blocks are untouched. Both annotations sit outside them.
- **No gate result is claimed for phase 3I.** The last executed `pnpm check` is still the 0405 review's on `c84bb4c`, and the code at `961e1f4` is the same.
- **Security and the product rule.** There's no data access, secret, member, staff or health data in this phase. No backend, database, Supabase, Docker, fixture, network or replay command ran. PRD 16.1 and frozen003 hold: gym staff never read or write a member's private health data, whatever the consent. That overrides any stale agent text, and the override stays until QA-2 is merged and the checkout the agents launch from is corrected. Neither QA-9's diff nor this phase touches any path that enforces it.
- **One risk found by reading, now recorded:** a fresh-clone install could run `supabase`'s `postinstall` and reach the network. That is why `--ignore-scripts` is recommended above. Phase 3H's install ran in an existing `node_modules`, and whether a script ran then isn't known.

## Commands run in phase 3I

Every allowed shell command went through `rtk proxy`, from this worktree, one at a time. Files were read with Read, Grep and Glob, and edited with Edit and Write.
- **Denied in dontAsk mode, not retried and not worked around:** `rtk proxy mkdir` of the three subfolders (run 20), which stopped the floor-proof sequence, and `rtk proxy date -u +%Y-%m-%dT%H:%M:%SZ` (run 21).
- **Not attempted:** a clone, an install, `pnpm check`, a merge, an amend, a reset, a rebase, a stash, a clean, a remote command, a fetch, a push, a change to `main` or any other ref, `backend:test`, a database, Supabase, Docker, a fixture, a replay, a sub-agent or a dispatcher, or any edit to code, tests, config, thresholds, the floor or dependencies.

| # | Command | Result |
|---|---|---|
| 1 | `rtk proxy git status --porcelain=v1 -b -uall` | ` M` for this file and `handoff.md`, and `??` for `final-2026-10-27T0335Z.md`, `final-2026-10-27T0405Z.md` and `phase-3h-check-outputs.md`. Exactly the five paths |
| 2 | `rtk proxy git log --format=%H%x20%s -4` | `c84bb4c`, `557b779`, `06c8220`, `c8a5d57` |
| 3 | `rtk proxy git rev-parse main` | `c8a5d57c3a0999760ad21fd1aca4899ca76b5adf` |
| 4 | `rtk proxy node --version` | `v22.23.1` |
| — | Grep for trailing whitespace in the three untracked files; Grep of the three `package.json` files for install scripts and patches; Read of `touched-format.mjs`, `pnpm-workspace.yaml`, `.npmrc`, `.gitignore`, the floor and §5 | None; none; read |
| — | The Edit tool: both lows fixed, and this phase's pre-commit notes added | — |
| 5 | `rtk proxy git diff --check` | No output |
| 6 | `rtk proxy git status --porcelain=v1 -uall` | The same five paths |
| 7 | `rtk proxy git add -- <the five paths, each named>` | No output |
| 8 | `rtk proxy git diff --cached --name-only` | **As expected:** exactly the five |
| 9 | `rtk proxy git diff --cached --stat` | 5 files, 717 insertions, 18 deletions |
| 10 | `rtk proxy git diff --cached --numstat` | 43/0, 62/0, 404/0, 152/6, 56/12 |
| 11 | `rtk proxy git diff --cached --check` | **No output: clean** |
| 12 | `rtk proxy git status --porcelain=v1 -uall` | Three `A`, two `M`, all staged; nothing unstaged or untracked |
| 13 | `rtk proxy git commit -m "docs(QA-9): record phase 3H results and the 0405 review"` | **`961e1f4`**, 5 files, three created. No hook output and no attribution trailer |
| 14 | `rtk proxy git log --format=%H%x20%P%x20%s -5` | The full IDs and parents: one parent each |
| 15 | `rtk proxy git status --porcelain=v1 -b -uall` | The branch line only: clean |
| 16 | `rtk proxy git rev-parse main` | `c8a5d57…`, unchanged |
| 17 | `rtk proxy git diff --name-only c84bb4cd1639d528779c9cc52e8a1540d0ae1ebc HEAD` | Exactly the five |
| 18 | `rtk proxy mktemp -d -t fitlog-qa9-floor` | `/var/folders/0s/4k0smcx56zl9hdj404qnz2s80000gp/T/fitlog-qa9-floor.dGGhev2tS6` |
| 19 | `rtk proxy git -C <that folder> rev-parse --show-toplevel` | Exit 128, `fatal: not a git repository`: outside every repository |
| 20 | `rtk proxy mkdir <folder>/empty-template <folder>/empty-hooks <folder>/tmp` | **Denied.** The sequence stopped |
| — | Glob of the folder | No file |
| 21 | `rtk proxy date -u +%Y-%m-%dT%H:%M:%SZ` | **Denied** |
| 22 | `rtk proxy git log -1 --format=%H%x20%cI%x20%aI` | `961e1f4…`, `2026-10-27T09:39:27+05:30` twice |
| — | Glob of this worktree's Claude project folder for `*.jsonl` | The last entry is `0f0d8065-eb22-409e-ae0b-fbe32927ecb9`, probably this session (inferred) |
| 23 | `rtk proxy git show 961e1f41104e414f045d5a9a42e8e9ca44acf083:scripts/quality/coverage-floor.json` | The floor JSON, whole; equal to §5 |
| 24 | `rtk proxy git status --porcelain=v1 -b -uall` | The branch line only: clean |
| 25 | `rtk proxy git rev-parse main HEAD` | `c8a5d57…` and `961e1f4…` |

**After the results,** `phase-3i-check-outputs.md` was created, and this file and `handoff.md` were edited, all uncommitted. The final-state checks follow the handoff edits.

**Final state, runs 26–30,** checked after those notes. This paragraph was added after them, so run 28's counts leave it out.
- **Run 26,** `git diff --check`: clean. A Grep found no trailing whitespace in the untracked `phase-3i-check-outputs.md`.
- **Run 27,** `git status --porcelain=v1 -b -uall`: ` M` for this file and `handoff.md`, and `??` for `phase-3i-check-outputs.md`. Nothing else.
- **Run 28,** `git diff --stat`: the two records, 122 insertions and 6 deletions.
- **Run 29,** `git log --oneline -5`: `961e1f4`, `c84bb4c`, `557b779`, `06c8220`, `c8a5d57`.
- **Run 30,** `git rev-parse main`: `c8a5d57c3a0999760ad21fd1aca4899ca76b5adf`, unchanged.

## Phase 3H: the 0305 review's lows, the records commit, the rebase and the local gates

*(Written before the records commit, and part of it. The results come after the rebase, uncommitted.)* Codex's phase-3H brief (27 October 2026, AUTH-01) accepts the [0305 review](../../../evidence/QA-9/reviewer-final-2026-10-27T0305Z.md) (acceptance (12)). It keeps box 3 open, gives no authorization to integrate into `main`, and assigns one bounded local integration-prep phase:
1. fix the review's two record lows;
2. stage exactly five paths and check the staged set, stat and `--check`, then make **one** records commit of only those paths: `docs/plan/runs/QA-9/checkpoint.md`, `docs/plan/runs/QA-9/handoff.md`, and `implementer-final-2026-10-27T0235Z.md`, `phase-3g-check-outputs.md` and `reviewer-final-2026-10-27T0305Z.md` in `docs/evidence/QA-9/`. No code, config or floor change;
3. require a clean tree, record the old tip and every commit ID, and recheck `main`: expected at `c8a5d57`, with only docs changed since `2a95726`, and no contract, JavaScript, TypeScript or QA-9 path. Stop if anything else;
4. `git rebase main`, on this goal branch only. Codex chose a rebase because docs/23 allows no merge commits. On a conflict, `git rebase --abort` and report, with no resolution, reset or stash;
5. prove only the base moved: `git range-diff 2a95726..<old tip> main..HEAD` shows every patch unchanged, and `git diff <old tip> HEAD` lists only the docs `main` added;
6. `pnpm install --frozen-lockfile --offline` on Node 22.23.1. Stop if the store lacks a package or the network is needed;
7. `pnpm check` **once** on the rebased branch, capturing the test count, the format base and its 19 files, and the exact fractions. No re-run for green, and no threshold lowered. Stop on failure;
8. only after that passes, both JS exports, offline, to the ignored `.expo/export-native`. They prove the JS and Hermes bundles only, not a device;
9. no `backend:test`, shared database, fixture, Supabase or replay command: MB-1 owns the database lane.

Then the results, the old and new IDs and the next steps are written uncommitted. The steps after this phase are separate: a fresh read-only review, `backend:test` serialised later, the floor proof in a throwaway clone with `HEAD` = `main` at the exact tip, the hosted run once the owner specifically approves the push, and final verification. The goal isn't split, and no partial Done is claimed.

| Item | Handling |
|---|---|
| 0305 review finding 1, low (`handoff.md` box-3 row: "18 files") | **Fixed in place** with a tag: 19 since 3F, naming `contract.test.ts`, and a rebase changes the `from` ID |
| 0305 review finding 2, low (this file's "Nothing else is uncommitted") | **Fixed in place** with a tag naming both untracked files. All five paths go into one commit |
| The review's merge-versus-rebase advice | **Followed, as Codex chose:** a rebase, no merge commit |

*(Written after the rebase and the gates, uncommitted.)* **Every step went as the brief expected. Nothing was retried, and nothing stopped the phase.**

| Step | What happened | Runs |
|---|---|---|
| Records commit | **`cf99bc54febe6d2efdb88bd9cb5e0eeb5898a49b`**, `docs(QA-9): record phase 3G results and the 0305 review`: exactly the five paths, 490 insertions and 12 deletions, staged `--check` clean, no hook output, then a clean tree | 4–13 |
| Old IDs | `4a7ee2100bffbfa77671017b83b1300b341a1dec`, `300709473f12cdae800cd7b3fc25f295887e58ce`, `cf99bc54febe6d2efdb88bd9cb5e0eeb5898a49b` (old tip), on `2a95726912c6ce3597187fa34443bf8c7e7dbcb8` | 14 |
| `main` recheck | **As expected:** `c8a5d57c3a0999760ad21fd1aca4899ca76b5adf`, fork point `2a95726`, 20 commits and no merge commit. 25 paths, all Markdown or JSON under `docs/plan/` (not `docs/plan/runs/QA-9/`) plus `docs/evidence/AR-1/cleanup.md`. There is no code, JavaScript, TypeScript or contract snapshot, and no QA-9 path among them | 15–20 |
| Rebase | `git rebase main`: **3 of 3, no conflict.** New IDs: **`06c822050d7610223bf7b76fd76842a90368fcde`**, **`557b779f9428b91158335b4370c071d2580d6994`** and **`c84bb4cd1639d528779c9cc52e8a1540d0ae1ebc`** (new tip). `main` stayed at `c8a5d57`, and the tree was clean | 21–24 |
| Only the base moved | `range-diff`: **`=` for all three commits**, so every patch is identical. `git diff <old tip> HEAD`: exactly `main`'s 25 paths, the same as run 18. `main..HEAD`: QA-9's 55 paths, 13936 insertions and 94 deletions | 25–27 |
| Offline frozen install | Exit 0. The lockfile was up to date and not resolved again, with `reused 70, downloaded 0`. It printed `Packages: +2 -68`: `node_modules` was brought into line with the frozen lockfile. The output doesn't say which packages changed. No tracked file changed | 28–29 |
| `pnpm check`, once | **Exit 0, 285 tests** (40 + 97 + 126 + 22).<br>**Format step:** 19 files, `Base: main@c8a5d57c3a09, from 06c822050d76`, with 36 files not checked, as counted beforehand.<br>**Domain:** **535/583**, **273/313** and **106/117**.<br>**Mobile:** 254/2076, 164/1551, 84/821 and 191/1023.<br>**Plan build:** matches.<br>The floor is not anchored | 30 |
| Both JS exports | **Exit 0**, offline (`EXPO_OFFLINE=1`).<br>**iOS:** 1228 modules, `entry-da6fb349….hbc` (4.5 MB).<br>**Android:** 1691 modules, `entry-7a6fabfa….hbc` (4.8 MB).<br>Also 40 assets and `metadata.json`, in the ignored `apps/mobile/.expo/export-native`.<br>This proves JS and Hermes only, with no device.<br>*(3I, 0405 review finding 2: Metro's module count varies between runs, so it doesn't identify a bundle. 1228 and 1533 were both seen for the same iOS bundle, `entry-da6fb34959063309d69f1cd38a684cb2.hbc`. The bundles are identified by their `.hbc` filenames. The verbatim output stays as captured.)* | 33–34 |

Outputs: [phase-3h-check-outputs.md](../../../evidence/QA-9/phase-3h-check-outputs.md).

**R3 sample from run 30:** domain lines 535/583, with the same uncovered rows as phase 3G's run 20 (`dates.ts:19` and `finance.ts:14` uncovered, `calculations.ts:3` and `:118` covered).

**R19, in the state measured:** `HEAD` is three commits ahead of `main`, with branches at 273/313. The `HEAD` = `main` and CI-mode states remain unmeasured; they are the throwaway-clone step and the hosted run.

**Self-review** (in place of the code-reviewer, security-reviewer and tdd-guide sub-agents, which Codex's brief forbade):
- **No code, test, config, threshold or floor changed.** The records commit is five Markdown files. The rebase's range-diff shows every patch identical.
- **The gate results come from the same code** as phase 3G's run 20 and the 0305 review's run, now on a new base. The domain figures and uncovered rows match run 20 exactly.
- **Security and the product rule.** There's no data access, secret, member, staff or health data in this phase. No backend, database, Supabase, fixture or replay command ran. PRD 16.1 and frozen003 still hold: gym staff never read or write private health data, whatever the consent. Neither QA-9's diff nor this phase touches any path that enforces that.
- **One observation, not a finding.** The install's `+2 -68` means that phase 3G's run 20, and possibly earlier local runs, used a `node_modules` that didn't exactly match the lockfile. This run, on the matching `node_modules`, gave the same counts and fractions. The cause wasn't investigated.

## Commands run in phase 3H

Every allowed shell command went through `rtk proxy`, from this worktree, one at a time. Files were read with Read, Grep and Glob, and edited with Edit and Write.
- **Denied in dontAsk mode, not retried and not worked around:** `rtk proxy git config --get core.hooksPath` (run 2), meant to check for Git hooks before the commit and the rebase. Instead, the commit and rebase outputs were read for hook output, and there was none.
- **Not attempted:** a merge, an amend, a reset, a stash, a clean, a remote command, a push, a change to `main`, `backend:test`, a database, Supabase, Docker, a fixture, a replay, a sub-agent, the pasted Python launcher, or any edit to code, tests, config, thresholds or the floor.

| # | Command | Result |
|---|---|---|
| — | `rtk proxy git status --porcelain=v1 -b` | `## codex/qa9-quality-ratchets`, ` M` for this file and `handoff.md`, and `??` for the 0235 report, `phase-3g-check-outputs.md` and the 0305 review. Exactly the five paths |
| 1 | `rtk proxy node --version` | `v22.23.1` |
| 2 | `rtk proxy git config --get core.hooksPath` | **Denied** |
| 3 | `rtk proxy git log --oneline -4` | `3007094`, `4a7ee21`, `2a95726`, `73e3f63` |
| — | The Edit tool: both lows fixed, and this phase's pre-commit notes added | — |
| 4 | `rtk proxy git diff --check` | No output |
| — | Grep for trailing whitespace in the three untracked evidence files | None |
| 5 | `rtk proxy git status --porcelain=v1 -uall` | Exactly the five paths: two ` M` and three `??` |
| 6 | `rtk proxy git add -- <the five paths, each named>` | No output |
| 7 | `rtk proxy git diff --cached --name-only` | **As expected:** exactly the five |
| 8 | `rtk proxy git diff --cached --stat` | 5 files, 490 insertions, 12 deletions |
| 9 | `rtk proxy git diff --cached --numstat` | 29/0, 269/0, 87/0, 79/7, 26/5 |
| 10 | `rtk proxy git diff --cached --check` | **No output: clean** |
| 11 | `rtk proxy git status --porcelain=v1 -uall` | Three `A`, two `M`, all staged; nothing unstaged or untracked |
| 12 | `rtk proxy git commit -m "docs(QA-9): record phase 3G results and the 0305 review"` | **`cf99bc5`**, 5 files, three created. No hook output. No attribution trailer, like `4a7ee21` and `3007094` |
| 13 | `rtk proxy git status --porcelain=v1 -uall` | No output: clean |
| 14 | `rtk proxy git log --format=%H%x20%s -4` | The old full IDs |
| 15 | `rtk proxy git rev-parse main` | `c8a5d57c3a0999760ad21fd1aca4899ca76b5adf` |
| 16 | `rtk proxy git merge-base HEAD main` | `2a95726912c6ce3597187fa34443bf8c7e7dbcb8` |
| 17 | `rtk proxy git log --format=%h%x20%s 2a95726..main` | 20 commits, every subject `docs:` or `docs(plan):` |
| 18 | `rtk proxy git diff --name-status 2a95726 main` | 25 paths, docs only (above) |
| 19 | `rtk proxy git log --merges --format=%h 2a95726..main` | No output: no merge commit |
| 20 | `rtk proxy git diff --name-only 2a95726 HEAD` | QA-9's 55 paths, with no overlap with run 18 |
| 21 | `rtk proxy git rebase main` | `Successfully rebased and updated refs/heads/codex/qa9-quality-ratchets`, 3 of 3. No hook output |
| 22 | `rtk proxy git log --format=%H%x20%s -5` | The new full IDs, on `c8a5d57` |
| 23 | `rtk proxy git rev-parse main` | `c8a5d57…`, unchanged |
| 24 | `rtk proxy git status --porcelain=v1 -b -uall` | The branch line only: clean |
| 25 | `rtk proxy git range-diff 2a95726..cf99bc54febe6d2efdb88bd9cb5e0eeb5898a49b main..HEAD` | `=` three times |
| 26 | `rtk proxy git diff --name-status cf99bc54febe6d2efdb88bd9cb5e0eeb5898a49b HEAD` | Exactly run 18's 25 lines |
| 27 | `rtk proxy git diff --stat main HEAD` | 55 files, 13936 insertions, 94 deletions |
| 28 | `rtk proxy pnpm install --frozen-lockfile --offline` | Exit 0, `downloaded 0`, `Packages: +2 -68` |
| 29 | `rtk proxy git status --porcelain=v1 -uall` | No output |
| 30 | `rtk proxy pnpm check`, once, in the background, with no file edited until it finished | **Exit 0, 285 tests** (above) |
| 31 | `rtk proxy git rev-parse HEAD`, read-only, while run 30 ran | `c84bb4cd1639d528779c9cc52e8a1540d0ae1ebc` |
| — | Read and Grep of run 30's 892-line output, and a Grep for secrets | No secret |
| 32 | `rtk proxy git status --porcelain=v1 -uall` | No output |
| — | Glob of `apps/mobile/.expo/` | No file |
| 33 | `rtk proxy env EXPO_OFFLINE=1 pnpm --filter @fitlog/mobile exec expo export --platform ios --platform android --output-dir .expo/export-native`, in the background | **Exit 0**, both bundles (above) |
| — | Glob of the export | `metadata.json` and both `.hbc` files |
| 34 | `rtk proxy git status --porcelain=v1 -uall` | No output |

**After the results,** `phase-3h-check-outputs.md` was created, and this file and `handoff.md` were edited, all uncommitted. Nothing else changed after the rebase.

**Final state, runs 35–38,** checked after those notes. This paragraph was added after them, so run 37's counts leave it out.
- **Run 35,** `git diff --check`: clean. A Grep found no trailing whitespace in the untracked `phase-3h-check-outputs.md`.
- **Run 36,** `git status --porcelain=v1 -uall`: ` M` for this file and `handoff.md`, and `??` for `phase-3h-check-outputs.md`. Nothing else. *(3I: true at run 36. The two `final-…` files listed under "Resume here (phase 3H)", step 2, were saved after it.)*
- **Run 37,** `git diff --stat`: the two records, 160 insertions and 12 deletions.
- **Run 38,** `git log --oneline -4`: `c84bb4c`, `557b779`, `06c8220`, `c8a5d57`.

## Phase 3G: Codex's whitespace decision, and the second local commit

Codex's brief after the phase-3F stop (27 October 2026, AUTH-01) decides that stop's question and assigns one bounded phase:
- strip **only** the trailing whitespace from the 31 captured coverage-table rows, 12 in `phase-3d-check-outputs.md` and 19 in `phase-3e-check-outputs.md`;
- note in each file's header that it is the captured output with trailing spaces removed, and that no output content or figure changed;
- don't rewrite historical reports or tests;
- stage exactly eleven paths and check them, then make one local commit, `test(QA-9): cover deterministic Git baseline histories`;
- then run `pnpm check` once on Node 22.23.1, and record the results uncommitted.

The brief accepts the prior independent 285-test review, which is acceptance (11), and nothing new. Its full terms, the normalization's proof and the expectations are in [ratchet-enforcement.md §16](../../../evidence/QA-9/ratchet-enforcement.md#16-phase-3g-the-whitespace-decision-and-the-second-local-commit).

| Item | Handling | Proof |
|---|---|---|
| The 31 rows | **Stripped, trailing spaces only.** The Edit tool matched each table block exactly. Phase 3D's file lost 5 spaces in run 13's table and 7 in run 18's. Phase 3E's lost 5 in run 7's, 7 in run 10's and 7 in run 11's | Runs 5 and 6, and the two Greps, below |
| The header notes | One "Normalization" row in each file's header table: the captured output with trailing spaces removed, no output content or figure changed, and the proof | Both files' headers |
| Stale lines this phase creates | Tagged in place, not rewritten. That covers `phase-3f-check-outputs.md`'s "untracked" and "didn't remove them", the "Committed?" row of phase 3D's outputs (by its normalization note), and §15's count of 31, now 33 | §15 and §16; the two files |
| The commit | Planned: the eleven-path stage and its checks, one commit, then `git log`, `git show`, `git status` and one `pnpm check`. What happened is recorded after the commit. *(Written after the commit, uncommitted.)* **Made as planned:** `300709473f12cdae800cd7b3fc25f295887e58ce`, eleven files, with a clean staged `--check`. **`pnpm check` passed once:** 285 tests, 19 format files labelled `from 4a7ee2100bff`, 33 not JavaScript or TypeScript, and domain 535/583, **273/313** and 106/117 | "Commands run in phase 3G", runs 7–20; [phase-3g-check-outputs.md](../../../evidence/QA-9/phase-3g-check-outputs.md) |

**Self-review (in place of the code-reviewer, security-reviewer and tdd-guide sub-agents, which Codex's brief forbade).**
- **The normalization changes no evidence.** Against the staged copies, Git saw exactly 12 and 19 changed lines, and no difference once end-of-line whitespace is ignored. That was checked before the header rows were added, so those rows are the only other change.
- **Counts.** The rows per table add up to 5 + 7 = 12 and 5 + 7 + 7 = 19, which matches phase 3F's run 14 line for line.
- **No code or test changed,** so the gate results this phase records come from the same code as phase 3E's run 11 and the review's run.
- **Security and product rule.** Records and whitespace only. No data access, secret or member, staff or health data is touched. PRD 16.1 and frozen003 (gym staff never read or write private health data, whatever the consent) are untouched.

## Commands run in phase 3G

Every allowed shell command went through `rtk proxy`, from this worktree, one at a time. Files were read with Read and Grep, and edited with Edit.
- **Denied in dontAsk mode, not retried and not worked around:** `rtk proxy git hash-object` of the two output files (run 4), meant to record their blob hashes before the edit. The `--ignore-space-at-eol` diff (run 6) shows what changed instead.
- **Not attempted:** a branch change, a rebase, a merge, a push, network, a database, Docker, Supabase, an export, a replay, a sub-agent, or any edit to code, tests or config.

| # | Command | Result |
|---|---|---|
| — | `git status --porcelain=v1 -uall`, `git rev-parse --abbrev-ref HEAD` (both through `rtk proxy`) | The state phase 3F left: six `A`, `M` for `contract.test.ts`, `MM` for the three records, and two `??`, `phase-3f-check-outputs.md` and the 0205 report. Branch `codex/qa9-quality-ratchets` |
| 1 | `rtk proxy node --version` | `v22.23.1`, the `.node-version` pin |
| 2 | `rtk proxy git log --oneline -3` | `4a7ee21 test(QA-9): …`, `2a95726`, `73e3f63` |
| 3 | `rtk proxy git diff --cached --numstat` | The nine staged paths, as phase 3F's run 13: `contract.test.ts` 713/89, the outputs 1031 and 224 |
| 4 | `rtk proxy git hash-object …` | **Denied** |
| — | Grep before the edit | 12 and 19 lines ending in whitespace, at phase 3F's run-14 line numbers. Each ends in exactly one space: no tab, no run of two spaces, no CR |
| — | The Edit tool: the five table blocks stripped | — |
| 5 | `rtk proxy git diff --numstat -- <the two outputs>` | **12 12** and **19 19** against the staged copies |
| 6 | `rtk proxy git diff --ignore-space-at-eol --stat -- <the two outputs>` | No output: nothing but end-of-line whitespace changed |
| — | Grep for trailing whitespace in the 3D, 3E and 3F outputs | None |

Runs 7 onward (the record checks, the stage, the commit and `pnpm check`) are recorded after the commit.

*(Written after the commit `300709473f12cdae800cd7b3fc25f295887e58ce`, uncommitted.)* Every step went as expected, and nothing was retried.

| # | Command | Result |
|---|---|---|
| 7 | `rtk proxy git diff --check` | No output: the unstaged record edits and the normalization are clean |
| 8 | `rtk proxy git status --porcelain=v1 -uall` | Six `A`, `AM` for the two normalized outputs, `M` for `contract.test.ts`, `MM` for the three records, and two `??`: `implementer-final-2026-10-27T0205Z.md` and `phase-3f-check-outputs.md`. Exactly the eleven paths, and nothing else |
| — | Grep for trailing whitespace in the 0205 report | None |
| 9 | `rtk proxy git add -- <the eleven paths, each named>` | No output |
| 10 | `rtk proxy git diff --cached --name-only` | **As expected:** exactly the eleven paths |
| 11 | `rtk proxy git diff --cached --stat` | **As expected:** 11 files, 3113 insertions, 124 deletions |
| 12 | `rtk proxy git diff --cached --numstat` | **As expected:** `contract.test.ts` **713/89**. The outputs 1032, 225 and 102, the finals 33, 38 and 40, the review 88, and the records 397/10, 303/12 and 142/13 |
| 13 | `rtk proxy git diff --cached --check` | **No output, exit 0: clean** |
| 14 | `rtk proxy git status --porcelain=v1 -uall` | Seven `A` and four `M`, all staged. Nothing unstaged or untracked |
| 15 | `rtk proxy git commit -m "test(QA-9): cover deterministic Git baseline histories"` | **`3007094`**, 11 files, 3113 insertions, 124 deletions, seven files created. No hook output. No attribution trailer, like `4a7ee21` |
| 16 | `rtk proxy git log --oneline -3` | `3007094 test(QA-9): cover deterministic Git baseline histories`, `4a7ee21 test(QA-9): …`, `2a95726` |
| 17 | `rtk proxy git show --stat HEAD` | `commit 300709473f12cdae800cd7b3fc25f295887e58ce`, 27 October 2026 07:39:54 +0530. The same eleven files and totals as run 11 |
| 18 | `rtk proxy git status --porcelain=v1 -uall` | No output: the tree was clean |
| 19 | `rtk proxy git rev-parse HEAD` | `300709473f12cdae800cd7b3fc25f295887e58ce` |
| 20 | `rtk proxy pnpm check`, once, in the background, with no file edited until it finished | **Exit 0, 285 tests** (40 + 97 + 126 + 22).<br>**Guard:** 2 Git baselines. `HEAD@300709473f12` records the floor and both sets of thresholds, and `main@2a95726912c6` none, so the floor applies and is **not anchored**.<br>**Format step:** **19 files**, `Base: main@2a95726912c6, from 4a7ee2100bff, which adds scripts/quality/touched-format.mjs`, **33** not JavaScript or TypeScript, as §16 predicted by counting.<br>**Typecheck and lint** passed.<br>**Domain:** 40 of 40. Lines **535/583** (91.7667%), branches **273/313** (87.2204%), functions **106/117** (90.5983%). `snapshot-contract.ts` 88.81%.<br>**Mobile:** 126 of 126, 254/2076, 164/1551, 84/821, 191/1023.<br>**Plan:** 22 of 22. `plan.json and board.html match GOALS.md` |

Run 20's output, 892 lines, was written to the session's background-task file `b4csctutd.output`, read back with Read and Grep, and searched for secrets: none. It is copied, with cuts marked, in [phase-3g-check-outputs.md](../../../evidence/QA-9/phase-3g-check-outputs.md).

**R3 sample from run 20:** domain lines 535/583, two above the 533 the threshold needs. The four named flippers read `calculations.ts:3` and `:118` covered, and `dates.ts:19` and `finance.ts:14` uncovered. That is 46 always-uncovered lines plus 2, so 48 uncovered.

**After the results,** this file, `handoff.md` and the new `phase-3g-check-outputs.md` were written, uncommitted. Nothing else changed after the commit.

**Final state, runs 21–24,** checked after those notes. This paragraph was added after them, so run 23's counts leave it out.
- **Run 21,** `git diff --check`: clean.
- **Run 22,** `git status --porcelain=v1 -uall`: ` M` for this file and `handoff.md`, and `??` for `phase-3g-check-outputs.md`. Nothing else.
- **Run 23,** `git diff --stat`: the two records, 61 insertions and 5 deletions.
- **Run 24,** `git log --oneline -3`: `3007094`, `4a7ee21`, `2a95726`.

## Phase 3F: the phase-3E review's findings, and the second local commit

Codex's phase-3F brief (27 October 2026, AUTH-01) accepts the [executed review of phase 3E](../../../evidence/QA-9/reviewer-final-2026-10-27T0135Z.md): 285 tests, Node 22.23.1, 273/313 branches, 19 format files, no critical, high or medium finding. It assigns one bounded phase. First, correct the records. Then stage exactly the nine paths the review names, check them, and make one local commit on top of `4a7ee21`. Then inspect the commit and run `pnpm check` once. The brief's terms, the corrections and the bounds are in [ratchet-enforcement.md §15](../../../evidence/QA-9/ratchet-enforcement.md#15-phase-3f-the-phase-3e-reviews-findings-and-the-second-local-commit).

| Item | Handling | Proof |
|---|---|---|
| 1 Low (records): §14's mutation 3 allowed an undetectable edit | **Corrected before staging.** Five exact diffs: mutations 1, 2, 3a and 3b, each with predicted killers, and 3c, the surviving `break`, with the state that would kill it. Mutation 2 gains test 1 as a second killer | §14, "What stays unproved" |
| 2 Low (records): R19(b) stated one direction, on an unconfirmed model | **Corrected before staging.** The margin in the reporter's integers: one newly uncovered branch, about seven merges, one exposed uncovered branch. The model is marked unconfirmed, and the forecasts mean "the margin should hold". The advice covers any domain test change | §14; R19 in §3; the handoff |
| 3 Low (test): one 80-line test holds three scenarios | **Assigned to QA-10**, as Codex directs. The test is unchanged | The handoff, "Found for other goals" |
| Stale records | R19's and the S8 request's pre-format line numbers, tagged with today's `:214`, `:399`, `:454` and `:463–466`. §7's box-3 count, now 19 and naming `contract.test.ts` | R19 in §3; §7, step 4; the handoff |
| The commit | Planned: the nine-path stage and its checks, one commit, then `git log`, `git show`, `git status` and one `pnpm check`. What happened is recorded after the commit. *(Written after the stop, uncommitted.)* **Stopped at the staged `--check`.** The stage held exactly the nine paths, with the expected stat (runs 11–13 and 15). But `--check` found 31 trailing-whitespace lines in the two verbatim check-output files (run 14). There was no commit and no `pnpm check`. The staged state is kept for Codex's decision | "Commands run in phase 3F", runs 8–17; [phase-3f-check-outputs.md](../../../evidence/QA-9/phase-3f-check-outputs.md) |

**Self-review (in place of the code-reviewer, security-reviewer and tdd-guide sub-agents, which Codex's brief forbade).**
- **Each mutation's prediction was traced against the test source.** For each one, the trace covers which assertion fails first, in which state, and why the other tests pass. Mutation 2's first-state pass in test 1, and its ahead and rewrite passes in test 2, follow from the double's `merge-base`: there, `main`'s tip `b` is the fork point.
- **The margin arithmetic** uses the reporter's own comparison (`exact-coverage-reporter.mjs:50`, read in this phase). Each boundary is checked on both sides: 272 and 271 of 313; 266/306 and 265/305; 273/314 and 273/315; 279/321 and 278/320.
- **Attribution.** The doubt about V8's ranges, the merge direction and the first-call exposure are the review's, and the records say so. Nothing here is a new measurement.
- **Security and product rule.** Records only. No data access, secret or member, staff or health data is touched. PRD 16.1 and frozen003 (gym staff never read or write private health data, whatever the consent) are untouched.

## Commands run in phase 3F

Every allowed shell command went through `rtk proxy`, from this worktree, one at a time. Files were read with Read and Grep, and edited with Edit and Write.
- **Denied in dontAsk mode, not retried and not worked around:**
  - the first command, a compound command without `rtk proxy` (`cat ~/.codex/RTK.md …; git status --short; git log --oneline -3; git rev-parse HEAD`). `RTK.md` was then read with Read;
  - `rtk proxy git grep -n … 4a7ee21 -- packages/domain/src/contract.test.ts` (run 7), meant to re-derive the old line numbers. The records cite only today's lines, read from the working file.
- **Not attempted:** a branch change, a rebase, a merge, a push, network, a database, Docker, Supabase, an export, a replay, a sub-agent, or any edit to code, tests or config.

| # | Command | Result |
|---|---|---|
| 1 | `cat ~/.codex/RTK.md …; git status --short; …` | **Denied** |
| 2 | `rtk proxy git status --short` | 4 modified (`ratchet-enforcement.md`, `checkpoint.md`, `handoff.md`, `contract.test.ts`) and 5 untracked: both implementer finals, both check-output files and the phase-3E review. The review's state, plus the review file itself |
| 3 | `rtk proxy git log --oneline -3` | `4a7ee21 test(QA-9): …`, `2a95726`, `73e3f63` |
| 4 | `rtk proxy git diff --cached --stat` | No output: nothing staged |
| 5 | `rtk proxy git diff --numstat` | `ratchet-enforcement.md` 193/7, `checkpoint.md` 155/10, `handoff.md` 93/12, **`contract.test.ts` 713/89**, before phase 3F's edits |
| 6 | `rtk proxy git log -1 --format=%B 4a7ee21` | The phase-3D commit message, with no attribution trailer |
| 7 | `rtk proxy git grep -n … 4a7ee21 -- packages/domain/src/contract.test.ts` | **Denied** |

Runs 8 onward (the stage, its checks, the commit and `pnpm check`) are recorded after the commit.

*(Written after the stop, uncommitted.)* No commit was made. The phase stopped at run 14.

| # | Command | Result |
|---|---|---|
| 8 | `rtk proxy node --version` | `v22.23.1`, the `.node-version` pin |
| 9 | `rtk proxy git diff --check` | No output: the tracked edits, phase 3F's records among them, are clean |
| 10 | `rtk proxy git status --short` | The same 4 modified and 5 untracked paths as run 2, and nothing else |
| 11 | `rtk proxy git add -- <the nine paths, each named>` | No output |
| 12 | `rtk proxy git diff --cached --stat` | **As expected:** the nine paths only. 9 files, 2785 insertions, 124 deletions |
| 13 | `rtk proxy git diff --cached --numstat` | **As expected:** `contract.test.ts` 713/89. The records 325/10, 213/12 and 120/13. The five new files 33, 38, 1031, 224 and 88 |
| 14 | `rtk proxy git diff --cached --check` | **Exit 2, not as expected.** 31 trailing-whitespace lines: `phase-3d-check-outputs.md` 112, 114, 116, 120, 123, 1007, 1009, 1011, 1012, 1014, 1015 and 1018, and `phase-3e-check-outputs.md` 37, 39, 41, 45, 48, 93, 95, 97, 98, 100, 101, 104, 168, 170, 172, 173, 175, 176 and 179. Each is a verbatim Node coverage row ending in `| `. **Stop** |
| 15 | `rtk proxy git status --short` | Six `A` and three `M`, all staged, matching the nine paths. Nothing unstaged or untracked |
| 16 | `rtk proxy git diff --stat` | No output: the index matched the working tree before these stop notes were written |
| 17 | `rtk proxy git log --oneline -2` | `4a7ee21 test(QA-9): …`, then `2a95726`. `HEAD` is unchanged |

**After the stop,** these were written, and none is staged: this note, the handoff's stop note, a stop tag in ratchet-enforcement.md's header, and the new `phase-3f-check-outputs.md`. So the three records now differ from their staged copies, and the next phase has to re-add them.

**Final state, runs 18–21,** checked after those notes. This line was added after them, so run 20's counts leave it out.
- **Run 18,** `git status --short`: six `A`, `M` for `contract.test.ts`, and `MM` for the three records. One `??`: `phase-3f-check-outputs.md`.
- **Run 19,** `git diff --check`: clean.
- **Run 20,** `git diff --stat`: the three records, 35 insertions and 4 deletions over the index.
- **Run 21,** `git log --oneline -2`: `4a7ee21`, then `2a95726`.

A Grep found no trailing space in `phase-3f-check-outputs.md`.

## Phase 3E: R19, fixed by a domain test

Codex's phase-3E brief (27 October 2026, AUTH-01) assigns one bounded phase: fix the high finding R19. It grants a routine ownership exception for `packages/domain/src/contract.test.ts` alone, and allows no production, contract, threshold, config, dependency, lockfile, Git-write or integration change. The brief's full terms, the test, the coverage analysis and the bounds are in [ratchet-enforcement.md §14](../../../evidence/QA-9/ratchet-enforcement.md#14-phase-3e-r19-fixed-by-a-domain-test). Everything below is the implementer's account. No independent review of phase 3E exists yet.

| Item | Handling | Proof |
|---|---|---|
| RED | **As already observed** at `4a7ee21` (phase 3D's run 18): 271/313 against 86.90. Not re-run before the fix, as the brief directs | [phase-3d-check-outputs.md](../../../evidence/QA-9/phase-3d-check-outputs.md) |
| The test | **A Git double and three tests:** one fork point (`HEAD` at `main`, `HEAD` behind `main`); a branch ahead, with a committed rewrite, and diverged; and no local `main`. Each asserts the sources, the notes, the trees listed (each fork point once) and what each baseline catches. No real Git runs, and `env` is `{}` | §14, "The test" |
| First version: 271/312 | **Explained, not hidden.** With two tests, `gitBaselines` ran 26 times and its loop body 26 times, so V8 merged the loop body's range into the function's range. The duplicate branch was covered, but one other covered branch dropped out of the count | Run 7; §14's model and table |
| Final version: 273/313 | **Two real, untested states added:** diverged, and no local `main`. The model predicted 119/134 and 273/313 before the run, and the run matched. `pnpm check` passed with 285 tests | Runs 10 and 11 |
| R3 | **Four flipping lines named** from five normal outputs: `calculations.ts:3` and `:118`, `dates.ts:19`, `finance.ts:14`. No extra run | §14, "R3"; R3 in §3 |
| New residual R19(b) | The branch denominator depends on V8 execution-count coincidences. The margin now absorbs one such merge (272/312 is 87.18%). *(3F, phase-3E review finding 2: restated both ways. The margin absorbs one newly uncovered branch, about seven merges, or one exposed uncovered branch.)* | §14, "Margin" |

## Commands run in phase 3E

Every allowed shell command went through `rtk proxy`, from this worktree, one at a time. Files were read with Read and Grep, and edited with Edit and Write.
- **Denied in dontAsk mode, not retried and not worked around:**
  - the first, compound command (`cd … && rtk proxy git status --short && rtk proxy git log --oneline -5 && rtk proxy git branch --show-current`);
  - a diagnostic lcov run of `contract.test.ts` alone (run 8). The analysis used only the normal outputs;
  - `rtk proxy git rev-parse HEAD` (run 18). `git log` showed `HEAD` instead.
- **Not attempted:** staging, a commit, a branch change, a rebase, a push, network, a database, Docker, Supabase, an export, a sub-agent, or any edit to `snapshot-contract.ts`.

| # | Command | Result |
|---|---|---|
| 1 | `cd … && rtk proxy git status --short && …` | **Denied** |
| 2 | `rtk proxy git status --short` | 3 modified (`ratchet-enforcement.md`, `checkpoint.md`, `handoff.md`) and 2 untracked (`implementer-final-2026-10-27T0035Z.md`, `phase-3d-check-outputs.md`): phase 3D's state |
| 3 | `rtk proxy node --version` | `v22.23.1`, the `.node-version` pin |
| — | The first version written with the Edit tool: the double, the first two tests and the two imports | — |
| 4 | `rtk proxy pnpm exec prettier --check packages/domain/src/contract.test.ts` | Exit 1, `[warn] packages/domain/src/contract.test.ts`. Once touched, the file is selected, and it wasn't in Prettier's format |
| 5 | `rtk proxy pnpm exec prettier --debug-check packages/domain/src/contract.test.ts` | Printed the path, with no error: formatting leaves the AST unchanged |
| 6 | `rtk proxy pnpm exec prettier --write packages/domain/src/contract.test.ts` | Written |
| 7 | `rtk proxy pnpm --filter @fitlog/domain test` | **Exit 1.** 39 of 39 pass. Lines 533/583, **branches 271/312**, functions 106/117. `snapshot-contract.ts` 87.97%. `Error: exact branches coverage 271/312 (86.8590%) does not meet the threshold of 86.9%` |
| 8 | `rtk proxy pnpm --filter @fitlog/domain exec node --import tsx --test --experimental-test-coverage "--test-coverage-include=src/cli/*.ts" --test-reporter=lcov src/contract.test.ts` | **Denied** |
| — | The revision written with the Edit tool: commit `e`, the optional `main` in `MemoryRefs`, the diverged case and the third test. The model's prediction was stated before run 10 | — |
| 9 | `rtk proxy pnpm exec prettier --write packages/domain/src/contract.test.ts` | Written |
| 10 | `rtk proxy pnpm --filter @fitlog/domain test` | **Exit 0.** 40 of 40 pass. Lines 537/583, **branches 273/313** (87.2204%), functions 106/117. `snapshot-contract.ts` 88.81% (119/134), as predicted |
| 11 | `rtk proxy pnpm check` | **Exit 0, 285 tests** (40 + 97 + 126 + 22).<br>**Format step:** **19 files**, `Base: main@2a95726912c6, from 4a7ee2100bff, which adds scripts/quality/touched-format.mjs`, 26 not JavaScript or TypeScript.<br>**Typecheck and lint** passed.<br>**Domain:** 536/583, **273/313**, 106/117.<br>**Mobile:** 254/2076, 164/1551, 84/821, 191/1023.<br>**Plan build:** `plan.json and board.html match GOALS.md` |
| 12 | `rtk proxy git status --short` | 4 modified (the three records and `contract.test.ts`), 2 untracked. Nothing staged |
| 13 | `rtk proxy git diff --stat` | 4 files, 809 insertions, 101 deletions |
| 14 | `rtk proxy git log --oneline -2` | `4a7ee21 test(QA-9): …`, then `2a95726` |
| 15 | `rtk proxy git diff --numstat` | `contract.test.ts` 713 and 89; the records 20/0, 43/3 and 33/9, mid-edit |

The tool saved run 11's output to the session's tool-results folder as `bclupbipn.txt`. It was read back with Read and Grep, and excerpted in [phase-3e-check-outputs.md](../../../evidence/QA-9/phase-3e-check-outputs.md).

**Final state of phase 3E,** after the records were written (runs 16–20). This note was added after them, so run 17's counts leave it out.
- **Run 16,** `rtk proxy git status --short`: four ` M`, for the three records and `contract.test.ts`. Three `??`: `implementer-final-2026-10-27T0035Z.md`, `phase-3d-check-outputs.md` and `phase-3e-check-outputs.md`.
- **Run 17,** `rtk proxy git diff --stat`: 4 files, 1143 insertions, 118 deletions. `contract.test.ts` is still 802 lines changed, the same as before the records.
- **Run 18,** `rtk proxy git rev-parse HEAD`: **denied**, not retried in another form. Run 20 shows `HEAD` instead.
- **Run 19,** `rtk proxy git diff --cached --stat`: no output, so nothing is staged.
- **Run 20,** `rtk proxy git log --oneline -1`: `4a7ee21 test(QA-9): …`. `HEAD` is still phase 3D's commit.

Neither the test nor production code changed after runs 10 and 11, so those results stand for the tree as handed off.

**Self-review (in place of the code-reviewer, security-reviewer and tdd-guide sub-agents, which Codex's brief forbade).**
- **Correctness of the double.** It answers only the five read-only subcommands that `gitBaselines` and `gitSource` send. It refuses any other command and any other working directory with a non-zero status, so a change to those calls fails the tests loudly. `merge-base` takes the first ancestor of the second commit that is also an ancestor of the first. That is right for these linear and forked histories, but it is not Git's full algorithm for criss-cross merges, and none is used.
- **Not mirroring.** The assertions are on what a caller sees: labels, notes, which commits' trees are read, and what `baselineProblems` reports. The diverged case checks a fact the implementation could get wrong (fork point against tip) through its outcome, not its call sequence.
- **Assertions.** No existing assertion was weakened, removed or skipped, and no test was disabled. `assert.equal(mainCatch, '')` fails on a missing source too, since `undefined` is not `''`.
- **Mutation.** None, by the brief's terms. The power to fail is argued in §14, and listed there for the review to run.
- **Coverage honesty.** No threshold, scope or reporter changed, and nothing was excluded. The added states are real Git states. The record keeps the first version's 271/312 and its cause, so the margin isn't overstated. The two unmeasured states are labelled as predictions.
- **Security and product rule.** Test code only. It reads no network, database, environment secret or member, staff or health data. PRD 16.1 and frozen003 (gym staff never read or write private health data, whatever the consent) are untouched. The outputs hold no secret.

## Phase 3D: the phase-3C review's findings, and the commit

Codex's phase-3D brief (27 October 2026, AUTH-01) accepts the [executed review of phase 3C](../../../evidence/QA-9/reviewer-final-2026-10-27T0005Z.md): 97 quality tests, 282 tests in `pnpm check`, Node 22.23.1, and phase 3C's code sound. It assigns one bounded phase: correct the records first, then stage, check and make one local commit. The brief's terms, the corrections, the R3 analysis and the bounds are in [ratchet-enforcement.md §13](../../../evidence/QA-9/ratchet-enforcement.md#13-phase-3d-the-phase-3c-reviews-findings-and-the-local-commit).

| Item | Handling | Proof |
|---|---|---|
| 1 Medium (records): the handoff named the wrong approver for the box-3 push | **Corrected before staging.** Every live statement in the handoff, this file and ratchet-enforcement.md now says the push and draft pull request need **the owner's specific approval** under docs/23 §6. Neither AUTH-01's delegation to Codex nor any existing approval covers publication. Historical phase lists keep their wording, with the wrong approver struck through or tagged. The verbatim finals are unchanged | §13's table of every line; the Grep under "Commands run in phase 3D" |
| 2 Low (R3): domain lines at 533/583 again | **Assigned to QA-9's next phase**, with no threshold lowered and no extra runs made for samples. Analysed from the artifacts on disk: the only per-line domain data is phase 1's five-run table, and no domain lcov file is kept. 533 fits all three known flipping lines uncovered. At least two more lines flip upward (538 − 536). Whether any line can flip below 533 is unknown. The review counted 6 runs at 533, and the records list at least 8 | §13, "Finding 2"; R3 in §3 |
| The commit | Planned: the scoped stage, then `pnpm check`, then one local commit, then `pnpm check` again. *(Written after the commit, uncommitted.)* **Done as planned up to the last check.** The stage held 44 files, and the staged `pnpm check` passed (282 tests, 18 files, the uncommitted label). The commit is `4a7ee2100bffbfa77671017b83b1300b341a1dec`. The committed `pnpm check` **failed**: the format step was as expected (18 files, `from 4a7ee2100bff, which adds scripts/quality/touched-format.mjs`), but domain branches fell to 271/313 (R19) | "Commands run in phase 3D", runs 6–18 |
| *(After the commit)* **New, high: R19, domain branch coverage depends on Git state** | **Recorded, not fixed.** Branches were 272/313 only while `HEAD` equalled `main`, and are 271/313 on a commit ahead of it, below the 86.90 threshold. `pnpm check` fails at the commit. Phase 3D may change no code, config or threshold, and `packages/domain/` is S8's. So it stops here, with the commit kept as made | R19 in ratchet-enforcement.md §3; runs 13 and 18 |

## Commands run in phase 3D

Every allowed shell command went through `rtk proxy`, from this worktree, one at a time. Files were read with Read, Glob and Grep.
- **Denied in dontAsk mode, not retried and not worked around:**
  - the first command, a compound `cd … && git status --short && git log --oneline -3 && git branch --show-current && ls …`;
  - `rtk git status --short`, without `proxy`;
  - `rtk proxy wc -l` on the three record files. Line counts were not needed: Read and Grep gave the lines cited.

| # | Command | Result |
|---|---|---|
| 1 | `cd … && git status --short && …` | **Denied** |
| 2 | `rtk git status --short` | **Denied** |
| 3 | `rtk proxy git status --short` | The eleven paths the review lists: six modified, five untracked |
| 4 | `rtk proxy wc -l` on the three record files | **Denied** |
| 5 | `rtk proxy node --version` | `v22.23.1`, the `.node-version` pin |

Records were edited after run 5. Before staging, the Grep tool (not the shell) checked the three mutable records. Every remaining `Codex's specific authoris…` is struck through (`~~…~~`), or quoted as the old wording in the handoff's box-3 row and ratchet-enforcement.md §13. All six "Authorise, or not, the box-3 draft pull request" items in "Decisions for Codex" are struck and tagged *(3D …)*. A Grep of the paths to be staged found no trailing whitespace.

The runs from the stage onward are listed below. They are recorded after the commit, so they are not part of it.

*(Written after commit `4a7ee21`; uncommitted.)*

| # | Command | Result |
|---|---|---|
| 6 | `rtk proxy git add --` followed by the eleven named paths | No output |
| 7 | `rtk proxy git status --short` | 44 entries, all staged: 6 `M ` and 38 `A `. Nothing unstaged, nothing untracked |
| 8 | `rtk proxy git diff --cached --name-status` | The same 44 paths, all under the eleven named |
| 9 | `rtk proxy git diff --cached --check` | No output: no whitespace error |
| 10 | `rtk proxy git diff --cached --stat` | `44 files changed, 10380 insertions(+), 5 deletions(-)`. jest.config.cjs 10, mobile `package.json` 3, docs/23 106, root `package.json` 3, domain `package.json` 2, `pnpm-lock.yaml` 10: the earlier phases' figures |
| 11 | `rtk proxy git diff --cached --` the config, package, floor and thresholds files | Only the authorised changes. The lockfile adds only `prettier@3.6.2` (integrity `sha512-I7AIg5…hCuQ==`). No secret |
| 12 | `rtk proxy git diff --cached -U0 -- docs/23-MASTER-PLAN.md` | One hunk, `@@ -210 +210,105 @@`, in §9 rule 3 |
| 13 | `rtk proxy pnpm check` (staged, Node 22.23.1) | **Exit 0, 282 tests** (37 + 97 + 126 + 22). The format step: **18 files**, `from HEAD@2a95726912c6: scripts/quality/touched-format.mjs is not committed yet`, `Not checked: 26 not JavaScript or TypeScript`. Domain **533/583** (exactly the threshold), 272/313, 106/117; `ℹ main@2a95726912c6: same commit as an earlier baseline`. Mobile 254/2076, 164/1551, 84/821, 191/1023 |
| 14 | `rtk proxy git status --short` | The same 44 staged entries as run 7. Nothing changed between the check and the commit |
| 15 | `rtk proxy git commit -m "test(QA-9): coverage ratchet, gate wiring, exact domain thresholds and Prettier on touched files" -m … -m …` | `[codex/qa9-quality-ratchets 4a7ee21]`, `44 files changed, 10380 insertions(+), 5 deletions(-)`. No hook output. No Co-Authored-By trailer, since the owner's global git rule disables attribution |
| 16 | `rtk proxy git rev-parse HEAD` | `4a7ee2100bffbfa77671017b83b1300b341a1dec` |
| 17 | `rtk proxy git status --short` | No output: a clean tree |
| 18 | `rtk proxy pnpm check` (committed, Node 22.23.1) | **Exit 1.** The guard passed against both baselines (`HEAD@4a7ee2100bff: checked; records the floor, mobile thresholds, domain thresholds`). The format step: **18 files**, `Base: main@2a95726912c6, from 4a7ee2100bff, which adds scripts/quality/touched-format.mjs`, `Not checked: 26 not JavaScript or TypeScript`, as expected. Typecheck and lint passed. Domain: 37 of 37 tests pass, but `Error: exact branches coverage 271/313 (86.5815%) does not meet the threshold of 86.9%`, with lines 536/583 and functions 106/117; `ℹ main@2a95726912c6: checked`. `ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL`. The mobile tests and the plan build did not run. **This is R19.** Stopped here: not re-run, nothing amended |

**Final state, after the records were written** (runs 19–21; this note was added after them, so run 21's counts leave it out):
- **Run 19,** `rtk proxy git status --short`: ` M` for `ratchet-enforcement.md`, `checkpoint.md` and `handoff.md`, and `??` for `phase-3d-check-outputs.md`. Nothing is staged, and nothing else changed.
- **Run 20,** `rtk proxy git log --oneline -3`: `4a7ee21 test(QA-9): …`, then `2a95726` and `73e3f63`.
- **Run 21,** `rtk proxy git diff --stat`: 3 files changed, 91 insertions, 12 deletions.

Both `pnpm check` outputs are saved in full in [phase-3d-check-outputs.md](../../../evidence/QA-9/phase-3d-check-outputs.md); nothing needed redacting. Run 13's output was saved by the tool to the session's tool-results folder, which names this session `50545607-a359-4d5a-9cd4-51d5f6818fa8`, and read back with Read and Grep.

**After run 18, by reading only:** `snapshot-contract.ts:129-157` (`gitBaselines`) and `contract.test.ts:112-240`. Both are explained under R19 in [ratchet-enforcement.md §3](../../../evidence/QA-9/ratchet-enforcement.md#3-residual-risks-open-after-phase-3b), and the results are in §13, "Results". `23-MASTER-PLAN.md:122` puts `packages/domain/` in S8 Member backend's lane.

**Self-review (in place of the code-reviewer, security-reviewer and tdd-guide sub-agents, which Codex's brief forbade).**
- **Records.** Every live approver line says the owner. The Grep above shows only struck or quoted "Codex's specific authorisation". The three verbatim finals were staged as found and never edited.
- **Scope.** Exactly the eleven named paths, 44 files, were staged, with no `-A`. The commit holds exactly the state run 13 checked (runs 7 and 14 are identical).
- **The failure.** R19 is real and deterministic: the two runs' own diagnostics show the branch taken before the commit and not after. It is not R3 noise, since every earlier run had 272. It was found, not caused, by the commit: no code changed. It was not worked around, and no threshold was touched.
- **Security.** No code changed. Both outputs were checked for secrets and hold none. Nothing was pushed or published.
- **Product rule.** Nothing here reads or writes member, staff or health data. PRD 16.1 and frozen003 (gym staff never read or write private health data, whatever the consent) are untouched.

## Phase 3C: the final review's findings

Codex's phase-3C brief (27 October 2026, AUTH-01) assigns one bounded correction of the executed [final review of phases 3 and 3B](../../../evidence/QA-9/reviewer-final-2026-10-26T2305Z.md). That review found no critical, high or medium finding and passed `pnpm check` independently with 281 tests. The brief's terms, the test, the mutation and the bounds are in [ratchet-enforcement.md §12](../../../evidence/QA-9/ratchet-enforcement.md#12-phase-3c-the-final-reviews-three-lows).

| Item | Handling | Proof |
|---|---|---|
| 1 Low (records): the handoff skipped `pnpm backend:test` and the export on false premises | **Corrected.** Both rows say each gate is required by docs/23 §7 for this diff, not run in this phase, deferred by Codex's brief, and due before integration. `backend:test` is required for `packages/domain/package.json`. The export, for iOS and Android, is required for `apps/mobile/package.json`, `jest.config.cjs` and `coverage-thresholds.json`. Nothing says "not required" or "not applicable", and there is no waiver | [handoff.md](handoff.md), "Gates"; "Resume here", step 5 |
| 2 Low (test gap): no test of the commit shape the hosted run sees | **Test 17 added**, at the end of the file. No check code changed. It passed first time on the unchanged check (run 6). 3C-M1, `--first-parent` in `ruleStart`'s `rev-list`, fails test 17 and no other test (runs 8 and 13) | Touched-format 17; [the patch](../../../evidence/QA-9/phase-3c-mutation-first-parent.patch); §12 |
| 3 Low (records): §7's box-3 checklist omitted the format step | **Corrected.** §7's step 4 requires the format step to pass with its label and 18 files, and says what to do when either differs. "Remaining phases", step 4, of this file already named the label, and now names the count too | ratchet-enforcement.md §7; "Remaining phases" below |

## Commands run in phase 3C

Every allowed shell command went through `rtk proxy`, from this worktree, one at a time. Files were read with Read, Glob and Grep. The `pnpm check` output was saved to a file by the tool and read back with Read and Grep.
- **Denied in dontAsk mode, not retried and not worked around:**
  - the first command, a compound `cd … && git status --short && git branch --show-current && git log --oneline -3 && ls …`;
  - `rtk git status`, without `proxy`;
  - `rtk proxy git apply --check` on the mutation patch. The mutation was then made with the Edit tool, which is how every earlier phase made its mutations.
- Not attempted: staging, a commit, a branch change, a push, network, a database, Docker, Supabase, a runner, the replay directory or a sub-agent.

| # | Command | Result |
|---|---|---|
| 1 | `cd … && git status --short && git branch --show-current && git log --oneline -3 && ls …` | **Denied** |
| 2 | `rtk git status` | **Denied** |
| 3 | `rtk proxy git status --short` | The eleven paths the final review lists |
| 4 | `rtk proxy node --version` | `v22.23.1`, the `.node-version` pin |
| 5 | `rtk proxy node --test --test-reporter=spec scripts/quality/touched-format.test.mjs` (before any change) | `ℹ tests 16`, `ℹ pass 16` |
| 6 | Test 17 written; `rtk proxy node --test --test-reporter=spec --test-name-pattern="a pull request is checked as GitHub checks it out" scripts/quality/touched-format.test.mjs` | `ℹ pass 1`, on the unchanged check |
| 7 | `rtk proxy git apply --check docs/evidence/QA-9/phase-3c-mutation-first-parent.patch` | **Denied** |
| 8 | 3C-M1 made with the Edit tool (Read back: line 162); then as run 5 | `ℹ tests 17`, `ℹ pass 16`, `ℹ fail 1`: test 17, `measured from the parent of the commit that adopts the rule, not from the baseline`, at line 680. Restored with the Edit tool; Read back; a Grep of `scripts/` found no `first-parent` |
| 9 | `rtk proxy pnpm exec prettier --check apps/mobile/jest.config.cjs` followed by the 17 `scripts/quality/*.mjs`, each named | `[warn] scripts/quality/touched-format.test.mjs` |
| 10 | `rtk proxy pnpm exec prettier --write scripts/quality/touched-format.test.mjs` | Written. Only test 17's own lines were re-wrapped (read back) |
| 11 | Prettier `--check`, as run 9 | `All matched files use Prettier code style!` |
| 12 | As run 6 | `ℹ pass 1` |
| 13 | 3C-M1 again, with the Edit tool; then as run 6 | `ℹ pass 0`, `ℹ fail 1`, the same message, at line 688 of the final text. Restored; Read back; the Grep found no `first-parent` |
| 14 | `rtk proxy node --test scripts/quality/*.test.mjs` | `# tests 97`, `# pass 97`, `# fail 0` |
| 15 | `rtk proxy pnpm check` | **Exit 0, 282 tests** (37 + 97 + 126 + 22) |
| 16 | `rtk proxy git status --short` | The same eleven paths as run 3 |
| 17 | `rtk proxy git diff --stat` | `jest.config.cjs` 10, docs/23 106, mobile `package.json` 3, root `package.json` 3, domain `package.json` 2, `pnpm-lock.yaml` 10: the final review's figures |
| 18 | **Final:** Prettier `--check`, as run 9 | See "Final runs" below |
| 19 | **Final:** `rtk proxy pnpm check` | See "Final runs" below |
| 20 | **Final:** `rtk proxy git status --short` | See "Final runs" below |
| 21 | **Final:** `rtk proxy git diff --stat` | See "Final runs" below |

**Run 15 in detail.**
- The guard prints `Coverage ratchet verified.`, with the `not anchored` note. Its summary is unchanged: 142 TypeScript files, 210 entries, 131 other linted files and 141 scanned files.
- The format step prints `Formatting verified: the 1 touched JavaScript and TypeScript file matches Prettier 3.6.2 with .prettierrc.json. Base: main@2a95726912c6, from HEAD@2a95726912c6: scripts/quality/touched-format.mjs is not committed yet, so only uncommitted edits count. Not checked: 5 not JavaScript or TypeScript.` This is the uncommitted state. The committed boundary is Codex's step ("Resume here", step 1).
- Typecheck passes. Lint passes, with `Design rules verified`.
- Domain: `ℹ pass 37`; `Exact lines coverage 536/583 (91.9383%)`, `Exact branches coverage 272/313 (86.9010%)`, `Exact functions coverage 106/117 (90.5983%)`; `Coverage counts all 8 files that --test-coverage-include matches`.
- Mobile: quality `# pass 97`, `# fail 0`. `Tests: 126 passed, 126 total`. `Statements : 12.23% ( 254/2076 )`, `Branches : 10.57% ( 164/1551 )`, `Functions : 10.23% ( 84/821 )`, `Lines : 18.67% ( 191/1023 )`.
- Plan: `# pass 22`; `plan.json and board.html match GOALS.md`.
- No Jest validation warning, and no `ERR_PNPM` line.

**Final runs**, after every record was written:
- **Run 18**, Prettier `--check` of `jest.config.cjs` and the 17 scripts, each named: `All matched files use Prettier code style!`
- **Run 19**, `pnpm check`: **exit 0, 282 tests** (37 + 97 + 126 + 22). The guard, the format step (the same uncommitted-state line as run 15), typecheck, lint and the plan build pass as in run 15, and the mobile figures are identical. **Domain lines are `533/583 (91.4237%)`, exactly the 91.42 threshold**, with branches 272/313 and functions 106/117. It passed with no margin. This is R3's known variation, since only prose changed after run 15 (536), but it is the lowest value seen, and one line fewer would fail `pnpm check`. R3 is recorded with it.
- **Run 20**, `git status --short`: the same eleven paths as run 3.
- **Run 21**, `git diff --stat`: the same six files and line counts as run 17.

Only prose changed after run 15. The plan build reads nothing under `docs/plan/runs/` (a Grep of `scripts/plan/`).

**Self-review (in place of the code-reviewer, security-reviewer and tdd-guide sub-agents, which Codex's brief forbade).**
- **Correctness of test 17.**
  - It asserts the shape before it asserts the check:
    - `HEAD^1` is the baseline and `HEAD^2` the adopting commit;
    - the fork point is the baseline;
    - `HEAD` is detached (`git symbolic-ref -q HEAD` exits 1).
  - The check's base, label, files, not-checked lists and problems are all asserted exactly, then the full check, then the command as root `check` runs it.
  - The earlier goal's files are unformatted, so any over-selection fails twice: on the exact file list and on the problems.
- **Can it fail?**
  - 3C-M1 fails it, and only it (run 8).
  - A dropped `--topo-order` was not run as a mutation. With one adopting commit and one merge, plain reverse order may already list the adopting commit first, so test 17 is not claimed to catch that.
  - The other rule-start mutations (3B-M1 to 3B-M6) stay covered by tests 13–16.
- **Test isolation.**
  - The fixture is a new scratch repository under the OS temporary directory, removed after the test.
  - Git runs with no user or system configuration, and no inherited `GIT_`, `CI` or baseline variable (the file's `gitEnv`).
  - The command run links the installed Prettier and copies the seven modules from this repository, as tests 11 and 14 do.
- **Security.**
  - No new input reaches a shell: every Git call in the test is an argument list.
  - The test writes only under the OS temporary directory.
  - The patch file is data, read by no script. A Grep of `scripts/` shows only `coverage-baseline.md` under `docs/evidence/` is read.
- **Product rule.** Nothing here reads or writes member, staff or health data. PRD 16.1 and frozen003 (gym staff never read or write private health data, whatever the consent) are untouched.
- **Records.** No row claims a box. No row says a required gate is "not applicable". The hosted run, the floor and the committed boundary stay open.
- **Not done, deliberately.** No check code, threshold, floor, wiring, dependency, lockfile or source change. No staging. No new package script.

## Phase 3B: the phase-3 review's findings

Codex's phase-3B brief (27 October 2026, AUTH-01) assigns one bounded correction of the [phase-3 review](../../../evidence/QA-9/independent-review-2026-10-26T2000Z.md). The design, what the installed tools showed, RED and GREEN, and the mutations are in [ratchet-enforcement.md §11](../../../evidence/QA-9/ratchet-enforcement.md#11-phase-3b-the-phase-3-reviews-findings).

| Item | Handling | Proof |
|---|---|---|
| 1 Medium: the rule start resets silently in CI when `RULE` does not match the module's path | **Fixed.** `RULE` is the module's own path, from `import.meta.url` relative to the repository root. With no commit after the fork point adding it, CI throws, and so does a local run whose `HEAD` holds it. A failing `ls-tree` throws. The local fallback to `HEAD` stays only for the state before the check is committed | Touched-format 13–16. RED (run 5), with the review's exact symptom in test 14. 3B-M1 to 3B-M6 |
| 2 Low: inline snapshots under Prettier 3 | **Fixed, as Codex chose:** `prettierPath: null` in `jest.config.cjs`, pinned in the guard (any other value, or none, fails) | Ratchet 9 (3 cases) and 32, which runs the installed Jest's writer both ways. RED (run 7). 3B-M7 to 3B-M9 |
| 3 Low: a merge of `main` after the rule commit over-selects | **Recorded** as R18(h): fail-safe, gone once `main` holds the rule; rebase, not merge, before integration | R18 below; docs/23 §9 rule 3 |
| 4 Low (records): the hex-colour probe; the stale root `package.json` sentence | **Corrected.** The probe is struck here (Remaining phases, step 4) and in ratchet-enforcement.md §7, and the review's 33 files and 460 lines were confirmed by a Grep. The evidence header's sentence is struck and corrected | — |

## Commands run in phase 3B

Every shell command went through `rtk proxy`, from this worktree, one at a time. The launch allowed only Read, Glob, Grep, Edit, Write and eight `rtk proxy` forms: `node --version`, `node --test`, `node --check`, `pnpm check`, `pnpm exec prettier`, `sha256sum`, `git diff` and `git status`. Files were read with Read, Glob and Grep, `node_modules` and the launch file in `/tmp` included. `pnpm check` output was saved to a file by the tool and read back with Read and Grep.
- **Denied in dontAsk mode, not retried and not worked around:** the first command, a compound `rtk git status && rtk git log --oneline -5 && ls …`. `git log` and `ls` are outside the allowlist. The same facts came from `git status --short` and Glob.
- **Noted:** run 4 piped its output through `tail -12`, and it was allowed. Every later command ran bare, so each matches the allowlist exactly.
- No commit, branch, push, network, database, Docker, Supabase or sub-agent action was attempted.

| # | Command | Result |
|---|---|---|
| 1 | `rtk git status && rtk git log --oneline -5 && ls …` | **Denied** (dontAsk) |
| 2 | `rtk proxy git status --short` | The eleven phase-3 paths |
| 3 | `rtk proxy node --version` | `v22.23.1`, the `.node-version` pin |
| 4 | `rtk proxy node --test scripts/quality/*.test.mjs 2>&1 \| tail -12` (before any change) | `# tests 91`, `# pass 91`, `# fail 0` |
| 5 | RED: `rtk proxy node --test scripts/quality/touched-format.test.mjs` | `# tests 16`, `# pass 13`, `# fail 3`: the renamed check (`0 !== 1`, `the 0 touched … files … not committed yet`), the CI start and the lost local start (`Missing expected exception`) |
| 6 | GREEN, first try: the same | `# tests 16`, `# pass 16` |
| 7 | RED: `rtk proxy node --test --test-name-pattern="jest.config.cjs" scripts/quality/coverage-ratchet.test.mjs` | `# pass 1`, `# fail 2`: the allowlist message, and `undefined !== null` after the Prettier-3 throw was reproduced |
| 8 | GREEN, first try: the same | `# pass 3` |
| 9 | `rtk proxy pnpm exec prettier --check apps/mobile/jest.config.cjs "scripts/quality/*.mjs"` | `touched-format.test.mjs` not formatted |
| 10 | `rtk proxy pnpm exec prettier --write scripts/quality/touched-format.test.mjs` | Written; one call re-wrapped |
| 11 | `rtk proxy git diff --stat -- apps/mobile/jest.config.cjs` | `10 +++++++++-` against `main` |
| 12 | `prettier --check`, as run 9 | All match |
| 13 | All quality tests | `# tests 96`, `# pass 96` |
| 14–22 | 3B-M1 to 3B-M9, each with `--test-reporter=dot` on the file concerned (the ratchet file with `--test-name-pattern="jest.config.cjs\|this repository passes"`) | Each killed; details in [§11](../../../evidence/QA-9/ratchet-enforcement.md#mutations-each-restored-4) |
| 23 | `prettier --check`, as run 9, after a Grep found no mutated text | All match |
| 24 | All quality tests, dot reporter | 96 dots, no failure |
| 25 | `rtk proxy pnpm check` | **Exit 0**, 281 tests (37 + 96 + 126 + 22) |
| 26 | The new tests moved to the end of their files; `prettier --check` | All match |
| 27 | `rtk proxy node --test scripts/quality/coverage-ratchet.test.mjs scripts/quality/touched-format.test.mjs` | `# tests 48`, `# pass 48`: ratchet 32 and touched-format 13–16 are the new ones |
| 28 | **Final:** `prettier --check`, as run 9 | See "Final runs" below |
| 29 | **Final:** `rtk proxy pnpm check` | See "Final runs" below |
| 30 | `rtk proxy git status --short` | See "Final runs" below |
| 31 | `rtk proxy git diff --stat -- <gate, config and protected paths>` | See "Final runs" below |

**Final runs.**
- **Run 28**, `prettier --check apps/mobile/jest.config.cjs "scripts/quality/*.mjs"`: `All matched files use Prettier code style!`
- **Run 29**, `pnpm check`: **exit 0, 281 tests** (37 + 96 + 126 + 22).
  - The root guard prints `Coverage ratchet verified.`, with the `not anchored` note. Its summary is unchanged: 142 TypeScript files, 210 entries, 131 other linted files and 141 scanned files.
  - The format step prints `Formatting verified: the 1 touched JavaScript and TypeScript file matches Prettier 3.6.2 with .prettierrc.json. Base: main@2a95726912c6, from HEAD@2a95726912c6: scripts/quality/touched-format.mjs is not committed yet, so only uncommitted edits count. Not checked: 5 not JavaScript or TypeScript.` The one file is `jest.config.cjs`, now with `prettierPath: null`. This is the honest uncommitted state that phase 3B keeps.
  - Typecheck passes. Lint passes, with `Design rules verified`.
  - Domain: `ℹ pass 37`; `Exact lines coverage 536/583 (91.9383%)`, `Exact branches coverage 272/313 (86.9010%)`, `Exact functions coverage 106/117 (90.5983%)`; `Coverage counts all 8 files that --test-coverage-include matches`.
  - Mobile: `test:ci` echoes `… jest --runInBand --ci --coverage --no-watchman`. Quality `# pass 96`, `# fail 0`. `Tests: 126 passed, 126 total`. `Statements : 12.23% ( 254/2076 )`, `Branches : 10.57% ( 164/1551 )`, `Functions : 10.23% ( 84/821 )`, `Lines : 18.67% ( 191/1023 )`.
  - Plan: `# pass 22`; `plan.json and board.html match GOALS.md`.
  - No Jest validation warning appears.
- **Run 30**, `git status --short`: the same eleven paths as run 2. The new `handoff.md` sits in the already-untracked `docs/plan/runs/QA-9/`.
- **Run 31**, `git diff --stat` over `jest.config.cjs`, the mobile, root and domain `package.json`, the lockfile, `eslint.config.js`, both tsconfigs, `.github`, `.npmrc`, `pnpm-workspace.yaml`, both `src/` trees, `supabase`, GOALS, ACCEPTANCE, `status.json`, `activity.json` and the tracker. It shows `jest.config.cjs` 10, mobile `package.json` 3, root `package.json` 3, domain `package.json` 2 and `pnpm-lock.yaml` 10, and nothing else. Only `jest.config.cjs` moved since phase 3's run 46, by its 2 authorised lines.

Run 29 came after every code edit. After it only prose changed: this file, `ratchet-enforcement.md`'s final-run references and the new `handoff.md`. docs/23 §9 rule 3 was already edited before run 29. No script reads any of them (a Grep of `scripts/` found only a comment naming `ratchet-enforcement.md`).

**Self-review (in place of the code-reviewer, security-reviewer and tdd-guide sub-agents, which Codex's brief forbade).**
- **Correctness.**
  - Each fix has a test that failed first (runs 5 and 7), apart from touched-format 13. That equality test passes on the old value, which happened to be right, so 3B-M2 shows that it fails on a stale one.
  - Each rule has a mutation that fails a named test (3B-M1 to 3B-M9).
  - The `prettierPath` premise is shown on the installed Jest code, not argued (ratchet 32).
  - Test 14 is the review's scenario, end to end, as root `check` runs the command.
- **Escapes considered.**
  - A rename or move: `RULE` follows it, and the rule restarts there (R18(d)).
  - A move to another depth also moves `REPO_ROOT`, and the check fails closed on the work-tree test.
  - A rewritten or cut history: test 16.
  - An uncommitted local rename: R18(i), local only.
  - A hostile change can still edit the check itself, as with every guard (R5, R6).
- **Security.**
  - No new input reaches a shell. Git still runs as an argument list through `gitRunner`.
  - `RULE` comes from the module's own URL, never from the environment or the repository.
  - `prettierPath: null` loads no module from any path, which narrows what Jest can load.
  - The tests write only under the OS temporary directory.
- **Product rule.** Nothing here reads or writes member, staff or health data. PRD 16.1 (gym staff never read or write private health data, whatever the consent) is untouched.
- **Not done, deliberately.**
  - No change to the selection, the options, the version pin or the wiring pins.
  - No new package script.
  - No R18(h) code fix: it is recorded, as asked.

## Phase 3: Prettier on touched files, and the phase-2G review

Codex's phase-3 brief (27 October 2026, AUTH-01) accepts the executed phase-2G review and assigns one separate Prettier phase. The design, what the installed tools showed, RED and GREEN, and the mutations are in [ratchet-enforcement.md §10](../../../evidence/QA-9/ratchet-enforcement.md#10-phase-3-prettier-on-touched-files-and-the-phase-2g-review). The exact semantics are in its [§1, "Formatting"](../../../evidence/QA-9/ratchet-enforcement.md#formatting-prettier-on-touched-files-only-phase-3-scriptsqualitytouched-formatmjs) and in docs/23 §9 rule 3.

| Item | Handling | Proof |
|---|---|---|
| Prettier on touched files only | `scripts/quality/touched-format.mjs`, run once in root `check` after the guard and pinned there. It checks the tracked JavaScript and TypeScript files the change adds, modifies or renames since its base, with Prettier 3.6.2's own `check()` and pinned options, reading no Prettier config, ignore file or pragma | Touched-format 1–12; gate-wiring 2; runs 44 and 73 |
| The exact devDependency and lockfile | `pnpm add --save-dev --save-exact --workspace-root prettier@3.6.2`: one `package.json` line and 10 lockfile lines, all `prettier@3.6.2`, integrity as on the registry. No other dependency moved | Runs 6–9; touched-format 7 pins the version |
| The base, explicit and fail-closed | CI: the fork point of `FITLOG_CONTRACT_BASELINE`, through the guard's own `configuredBaseline` and `inCI`, refused at `HEAD`. Locally: the fork point of `refs/heads/main`, or of the configured baseline. Every way of not finding a base fails, locally too | Touched-format 8; 3-M9, 3-M10 |
| Coherent between local and CI (found here) | `origin/main` is 164 JavaScript and TypeScript files behind local `main` (run 70). So the rule applies from the commit that adds it: a base without it moves to that commit's parent. Without this, the first hosted run would demand all 164 and fail before ESLint | Touched-format 9; 3-M19, 3-M20 |
| Spaces and odd names | `git diff --raw -z`; a space, a tab, a line break, a quote and a non-ASCII letter in fixture names | Touched-format 2 and 4; 3-M2 |
| Deletions, binary, generated, vendor | Listed as not checked: deleted paths, every other extension (PNG with a NUL byte, Markdown), `database.types.ts`, any `node_modules` path | Touched-format 2 and 3; 3-M4, 3-M5, 3-M17 |
| Never mass-format | Untouched, untracked and `main`-only files are never checked, even when unformatted; only the 17 owned `scripts/quality/*.mjs` were formatted here | Touched-format 3; 3-M8; `prettier --check` (run 62) |
| `eslint.config.js` | Not changed. It is not in Prettier's format. It is untouched, so it is not checked; a goal that changes it formats it and updates the pin | Run 15; R18(e) |
| The review's finding 1 (R17 owner, four places; the relative-path sentence) | Corrected to **PL-1, CI wiring only**, and the sentence rewritten after a Grep: `contract.test.ts:87`'s `import()` of `../${entry}` from `exports['.']`, plus `snapshot-contract.ts:13`, which the old sentence also missed | R17 rows here and in §3; decision 3; "Found for other goals" |
| The review's optional items | 2G's labels are now `2G-G1` to `2G-G12`. The guard's success message is not changed (outside this phase). The `exports` route is recorded under R17 | §9 and §1 of the evidence; this file's 2G section |
| The review itself | Persisted verbatim as [review-phase2g.md](../../../evidence/QA-9/review-phase2g.md), attributed as executed | Run 48: only the header and a final newline differ |

## Commands run in phase 3

Every shell command went through `rtk proxy`, from this worktree, one at a time. Files were read with Read, Glob and Grep, including `node_modules`, `/tmp` and the review's transcript. Long outputs had their middle cut; mutation runs were then narrowed with `--test-name-pattern`. `pnpm check` output was saved to a file by the tool and read back with Read and Grep.
- **Denied in dontAsk mode, not retried as is:**
  - the first command, a compound `cd … && git status && git log … && ls …`;
  - `rtk proxy git --version`;
  - a `rtk proxy node -e` probe of `git diff --raw` during a scratch merge conflict;
  - `rtk proxy git hash-object` of the pre-format quality scripts;
  - `rtk proxy node scripts/quality/touched-format.mjs`. Root `check` runs it instead (runs 44, 65, 69 and 73).

| # | Command | Result |
|---|---|---|
| 1 | `cd … && git status && …` | **Denied** |
| 2 | `rtk proxy git status --short` | The phase-2G tree: nine paths |
| 3 | `rtk proxy node --version` | `v22.23.1`, the `.node-version` pin |
| 4 | `rtk proxy pnpm --version` | `10.27.0`, the `packageManager` pin |
| 5 | `rtk proxy git --version` | **Denied** |
| 6 | `rtk proxy pnpm view prettier@3.6.2 version dist.integrity time.3.6.2 license` | `3.6.2`, `sha512-I7AIg5…hCuQ==`, MIT |
| 7 | `rtk proxy pnpm add --save-dev --save-exact --workspace-root prettier@3.6.2` | `+ prettier 3.6.2`; `Packages: +3 -69` in `node_modules`; `Done … using pnpm v10.27.0` |
| 8–9 | `rtk proxy git diff --stat -- pnpm-lock.yaml package.json`, then the full diff | Lockfile 10 lines, all `prettier@3.6.2`; `package.json`, one `devDependencies` line besides 2B's |
| 10 | RED: `rtk proxy node --test scripts/quality/touched-format.test.mjs scripts/quality/gate-wiring.test.mjs` | `# tests 19`, `# pass 8`, `# fail 11` |
| 11 | The ground-truth test alone (`--test-name-pattern="fixture texts"`) | `# pass 1` |
| 12 | GREEN, first try: as run 10 | `# pass 18`, `# fail 1`: the unmerged case |
| 13 | `rtk proxy node -e` (a scratch merge-conflict probe) | **Denied** |
| 14 | GREEN: the format tests | `# tests 10`, `# pass 10` |
| 15 | `rtk proxy pnpm exec prettier --check apps/mobile/jest.config.cjs apps/mobile/eslint.config.js "scripts/quality/*.mjs"` | 18 files not in format: `eslint.config.js` and the 17 scripts. `jest.config.cjs` is |
| 16 | `rtk proxy pnpm exec prettier --debug-check "scripts/quality/*.mjs"` | All 17 listed: AST unchanged, formatting idempotent |
| 17 | `rtk proxy git hash-object …` | **Denied** |
| 18 | `rtk proxy pnpm exec prettier --write "scripts/quality/*.mjs"` | The 17 written |
| 19 | `rtk proxy node --test scripts/quality/*.test.mjs` | `# tests 89`, `# pass 89` |
| 20 | `rtk proxy node scripts/quality/touched-format.mjs` | **Denied** |
| 21 | `rtk proxy pnpm exec prettier --check apps/mobile/jest.config.cjs "scripts/quality/*.mjs"` | `All matched files use Prettier code style!` |
| 22–41 | 3-M1 to 3-M18, with 3-M8 run again after the fixture was strengthened and the format tests run green after it | Each killed; details in [§10](../../../evidence/QA-9/ratchet-enforcement.md#mutations-each-restored-3) |
| 42 | `prettier --check`, as run 21 | All match |
| 43 | All quality tests | `# tests 89`, `# pass 89` |
| 44 | `rtk proxy pnpm check` | Exit 0, 274 tests; domain lines 536/583 |
| 45 | `rtk proxy git status --short` | Eleven paths: the nine, plus `pnpm-lock.yaml` and `.prettierrc.json` |
| 46 | `rtk proxy git diff --stat -- <gate, config and protected paths>` | `jest.config.cjs` 8, mobile `package.json` 3, root `package.json` 3, domain `package.json` 2, `pnpm-lock.yaml` 10; nothing else |
| 47 | `rtk proxy git diff -- package.json` | The `check` line and `"prettier": "3.6.2"` |
| 48 | `rtk proxy git diff --no-index /tmp/fitlog-908f412f-final.md docs/evidence/QA-9/review-phase2g.md` | Only the header and a final newline differ |
| 49 | `rtk proxy git diff --stat origin/main main -- <the eight extensions>` | 589 files differ |
| 50 | `rtk proxy git diff --name-status --no-renames --diff-filter=AM origin/main...main -- <the eight extensions>` | The files listed, from `apps/mobile/app.config.ts` to `scripts/plan/sync.mjs` |
| 51 | RED, rule start: the format tests | `# tests 11`, `# pass 10`, `# fail 1` |
| 52 | GREEN, first try | `# fail 1`: the fixture's copy of this module was not yet formatted |
| 53–54 | `prettier --write` on the two new files, then the format tests | `# tests 11`, `# pass 11` |
| 55 | The Git-failure test alone | `# pass 1` |
| 56–59 | 3-M19 to 3-M22 | Each killed |
| 60 | `prettier --check`, as run 21 | `touched-format.test.mjs` not formatted, caught by the check's own rule |
| 61–63 | `prettier --write` on it; `prettier --check` twice, once after a comment edit | All match |
| 64 | All quality tests | `# tests 91`, `# pass 91` |
| 65 | `rtk proxy pnpm check` | Exit 0; domain lines 534/583 |
| 66 | RED: the two summary tests | `# fail 2` |
| 67 | `prettier --write` on the two files | Both `(unchanged)` |
| 68 | All quality tests | `# tests 91`, `# pass 91`, `# fail 0` |
| 69 | `rtk proxy pnpm check` | Exit 0, 276 tests; domain lines 536/583 |
| 70 | `rtk proxy git diff --shortstat --no-renames --diff-filter=AM origin/main...main -- <the eight extensions>` | `164 files changed` |
| 71 | `prettier --check`, as run 21, after adding `--topo-order` to the `rev-list` call so that "first" means earliest even across merges | All match |
| 72 | The format tests | `# tests 12`, `# pass 12`, `# fail 0` |
| 73 | **Final:** `rtk proxy pnpm check` | **Exit 0.** Run 73 is detailed after this table |
| 74 | After the prose edits: `rtk proxy node --test scripts/quality/*.test.mjs` | `# tests 91`, `# pass 91`, `# fail 0` |
| 75 | `rtk proxy git status --short` | The eleven paths of run 45 |
| 76 | `rtk proxy git diff --stat -- <gate, config and protected paths>`, as run 46 | Unchanged from run 46 |

**Run 73 in full.**
- The root guard prints `Coverage ratchet verified.`, with the `not anchored` note. Its summary is unchanged: 142 TypeScript files, 210 entries, 131 other linted files and 141 scanned files.
- The format step prints `Formatting verified: the 1 touched JavaScript and TypeScript file matches Prettier 3.6.2 with .prettierrc.json. Base: main@2a95726912c6, from HEAD@2a95726912c6: scripts/quality/touched-format.mjs is not committed yet, so only uncommitted edits count. Not checked: 5 not JavaScript or TypeScript.` The checked file is `jest.config.cjs`. The five are the three `package.json` files, docs/23 and the lockfile. `scripts/quality/` is untracked, so it is not selected here: run 62's `prettier --check` stands in for it until a commit exists.
- Typecheck passes. Lint passes, with `Design rules verified`.
- Domain: `ℹ pass 37`, `Exact lines coverage 536/583 (91.9383%)`, `Exact branches coverage 272/313 (86.9010%)`, `Exact functions coverage 106/117 (90.5983%)`, and `Coverage counts all 8 files that --test-coverage-include matches`.
- Mobile `test:ci` echoes `… jest --runInBand --ci --coverage --no-watchman`. Quality `# pass 91`; the mobile guard verified; `Tests: 126 passed`; `Statements : 12.23% ( 254/2076 )`, `Branches : 10.57% ( 164/1551 )`, `Functions : 10.23% ( 84/821 )`, `Lines : 18.67% ( 191/1023 )`.
- Plan `# pass 22`; `plan.json and board.html match GOALS.md`.
- **276 tests** (37 + 91 + 126 + 22).

Run 73 came after every code edit. After it only prose changed: this file, `ratchet-enforcement.md` and docs/23 §9 rule 3. The only document a test reads is `coverage-baseline.md` (ratchet test 2), and it is unchanged.

**Self-review (in place of the code-reviewer, security-reviewer and tdd-guide sub-agents, which Codex's brief forbade).**
- **Correctness.**
  - Each rule has a test that failed first: RED in runs 10 and 51, and in run 66 for the message. Test 12 was written after its code and is shown by mutations instead.
  - Each rule has a mutation that fails a named test (3-M1 to 3-M22).
  - Formatting ground truth comes from the installed Prettier (test 1, `getFileInfo`, `resolveConfig`, `checkIgnorePragma`), never from text in a test.
  - The rule start was found by measuring `origin/main` (runs 49, 50 and 70), not by assumption.
- **Escapes considered.**
  - A stale pull request branch: CI checks out the merge with the base, so the fork point is the base, which holds the rule once `main` does.
  - `assume-unchanged`, untracked files, `prettier-ignore`, a rename of the check and CRLF work trees are R18.
  - A hostile change can still edit the check itself, as with every guard (R5, R6).
- **Security.** Git runs read-only, as an argument list with no shell, through the guard's `gitRunner` (no inherited Git location, no optional locks). Paths from Git are never passed to a shell. Prettier is called as a library and loads no plugin or config from the repository. Nothing reaches the network apart from the authorised `pnpm view` and `pnpm add`. The regular expressions are linear.
- **Not done, deliberately.** No write mode or `format` script. No JSON, Markdown or YAML formatting. No change to `eslint.config.js` or its pin. No change to the guard's success message.

## Phase-2F review findings: how phase 2G handled them

Detail, with what the installed TypeScript showed, is in [ratchet-enforcement.md §9](../../../evidence/QA-9/ratchet-enforcement.md#9-phase-2g-phase-2f-review-findings). The review was source-only (all Bash denied, nothing executed). Phase 2G reproduced findings 1 and 2 with the installed TypeScript before fixing them, and showed finding 3's premise in a test.

| Item | Handling | Proof |
|---|---|---|
| 1 Low: a declaration file in `src/` named `loose.d.`+line break+`.ts` passed R16, though TypeScript calls it a declaration file and `**/*.ts` includes it | **Fixed.** TypeScript's own two tests, with no `.` wildcard: a name ending `.d.ts`, `.d.mts` or `.d.cts`, or ending `.ts` with `.d.` anywhere in it. Case-insensitive, and read on the whole entry name, so a superset of TypeScript's names by construction | Type-suppression 8 (8 line-break declarations and 12 near misses, each classified by the installed TypeScript; both packages' real `include`); ratchet 31. RED; **2G-G1, the exact pre-fix pattern, is killed** (type-suppression 8 and ratchet 31); 2G-G2, 2G-G3 |
| The three overclaims finding 1 named | **Corrected.** The `type-suppression.mjs` comment is rewritten. `ratchet-enforcement.md` §1's "any name" is struck through and corrected. This file's phase-2F self-review line is corrected in place | — |
| 2 Low: a UTF-16 TypeScript file was decoded as UTF-16 by TypeScript and as UTF-8 by the scan | **Fixed.** The scan reads bytes, and refuses a TypeScript file starting with `FF FE` or `FE FF` before decoding, in both packages. Anything else decodes as UTF-8, as before. A reader that returns anything but bytes fails closed | Type-suppression 6 (the injected reader goes through bytes; a text reader fails closed) and 9 (TypeScript's own `sys.readFile` decodes the comment; the scan's default reader refuses it); ratchet 31. RED; 2G-G4 to 2G-G8 |
| 3 Low: JavaScript under `apps/mobile/src` escaped types, coverage and the design-token lint | **Fixed, and the domain is held to the same rule.** Every `.js`, `.jsx`, `.mjs` and `.cjs` under `apps/mobile/src/` or `packages/domain/src/` fails, in any letter case. Neither holds one today, and nothing in the domain needs one. Outside `src/` JavaScript is neither read nor refused: that is R17's named remainder, and it keeps `eslint.config.js`, `jest.config.cjs` and `scripts/test-design-rules.cjs` legitimate | Type-suppression 5 and 10 (the installed TypeScript with the real mobile options: `2339` in `.ts`, nothing in the same `.js`); ratchet 31. RED; 2G-G9 to 2G-G12 |
| The review itself | **Persisted verbatim** as [review-phase2f.md](../../../evidence/QA-9/review-phase2f.md), its header attributing it as source-only, all Bash denied, not independently executed | Run 29: only the header and a final newline differ |

## Commands run in phase 2G

Every shell command went through `rtk proxy`, from this worktree, one at a time. Files were read with Read, Glob and Grep, `node_modules`, `/tmp` and the review's transcript included.
- **Allowed and used:**
  - `rtk proxy node --version`, `rtk proxy git status --short`, `rtk proxy git diff …`;
  - `rtk proxy node --test` on all quality tests or on single test files, and `rtk proxy pnpm check`;
  - four offline `rtk proxy node -e` probes (runs 5–8). Runs 5 and 6 only read the repository. Runs 7 and 8 each wrote only to a new `mkdtemp` folder under the OS temporary directory, and removed it.
- **Denied in dontAsk mode, not retried as is:** the session's first command, a compound `cd … && git status && git log … && ls …`.
- Long outputs had their middle cut. Where a failure fell in the cut part, the single test file was run on its own to name it (runs 13, 17 and 23). `pnpm check` output was saved to a file by the tool and read back with Read and Grep.

| # | Command | Result |
|---|---|---|
| 1 | `cd … && git status && git log --oneline -5 && ls …` | **Denied** (dontAsk) |
| 2 | `rtk proxy node --version` | `v22.23.1`, the `.node-version` pin |
| 3 | `rtk proxy git status --short` | The phase-2F tree: nine paths |
| 4 | `rtk proxy node --test scripts/quality/*.test.mjs` (before any change) | `# tests 77`, `# pass 77`, `# fail 0` |
| 5 | `rtk proxy node -e` (where `typescript` resolves) | Both `apps/mobile` and `packages/domain` resolve the root `node_modules/typescript`, `6.0.3` |
| 6 | `rtk proxy node -e` (`getParsedCommandLineOfConfigFile` on the mobile tsconfig) | `allowJs: true`, `checkJs` unset, `skipLibCheck: true`, 0 errors, 129 files |
| 7 | `rtk proxy node -e` (probe, finding 1) | For each of CR, LF, U+2028 and U+2029: `loose.d.`+break+`.ts` and `st.d.c`+break+`ss.ts` are declaration files to TypeScript, missed by phase 2F's pattern, and listed by `**/*.ts` |
| 8 | `rtk proxy node -e` (probe, finding 2) | UTF-16LE and BE `// @ts-nocheck`: `ts.sys.readFile` decodes it and switches checking off; UTF-8 decoding does not contain it |
| 9 | RED: `rtk proxy node --test scripts/quality/type-suppression.test.mjs` | `# tests 10`, `# pass 5`, `# fail 5`: tests 5, 6, 8, 9 and 10, each at its scan assertion |
| 10 | GREEN: the same | `# tests 10`, `# pass 10`, `# fail 0` |
| 11 | GREEN: all quality tests | `# tests 79`, `# pass 79`, `# fail 0` |
| 12–26 | 2G-G1 to 2G-G12, one mutation each, each restored (2G-G1, 2G-G4 and 2G-G9 also with the ratchet file alone) | Each killed; details in [§9](../../../evidence/QA-9/ratchet-enforcement.md#mutations-each-restored-2) |
| 27 | All quality tests, after restoring (a Grep found no mutated text) | `# tests 79`, `# pass 79`, `# fail 0` |
| 28 | **Final:** `rtk proxy pnpm check` | **Exit 0.** Run 28 is detailed after this table |
| 29 | `rtk proxy git diff --no-index /tmp/fitlog-68f44e38-final.md docs/evidence/QA-9/review-phase2f.md` | Only the provenance header and a final newline differ |
| 30 | `rtk proxy git status --short` | The same nine paths as at the start |
| 31 | `rtk proxy git diff --stat -- <the 2F run-28 path list>` | Only the four phase-2/2B files: 8, 3, 2 and 2 lines |
| 32 | After the prose edits: all quality tests | `# tests 79`, `# pass 79`, `# fail 0` |
| 33 | `rtk proxy git status --short` | The same nine paths |

**Run 28 in full.**
- The root guard prints `Coverage ratchet verified.`, with the `not anchored` note. Its summary is unchanged from 2F: 142 TypeScript files, 210 entries, 131 other linted files, 141 scanned files.
- Typecheck passes. Lint passes (`eslint . --max-warnings=0`), with `Design rules verified`.
- Domain: `ℹ pass 37`, `Exact lines coverage 537/583 (92.1098%) meets the threshold of 91.42%`, `Exact branches coverage 272/313 (86.9010%) meets the threshold of 86.9%`, `Exact functions coverage 106/117 (90.5983%) meets the threshold of 90.59%`, and `Coverage counts all 8 files that --test-coverage-include matches`.
- Mobile `test:ci` echoes `… jest --runInBand --ci --coverage --no-watchman`. Quality `# pass 79`; the mobile guard verified; `Tests: 126 passed`; `Statements : 12.23% ( 254/2076 )`, `Branches : 10.57% ( 164/1551 )`, `Functions : 10.23% ( 84/821 )`, `Lines : 18.67% ( 191/1023 )`.
- Plan `# pass 22`; `plan.json and board.html match GOALS.md`.
- **264 tests** (37 + 79 + 126 + 22).

Run 28 came after every code edit, including two comment-only edits to `type-suppression.mjs` made after 2G-G12 was restored and before run 27. After it only prose changed: this file, `ratchet-enforcement.md`, the new `review-phase2f.md` and docs/23 §9 rule 3. The only document a test reads is `coverage-baseline.md` (ratchet test 2), and it is unchanged.

**Self-review (in place of the code-reviewer, security-reviewer and tdd-guide sub-agents, which Codex's brief forbade).**
- **Correctness.**
  - Each fix has regression tests that failed first: RED in tests 5, 6, 8, 9 and 10, and in ratchet 31 through 2G-G1, 2G-G4 and 2G-G9. Each has mutations that fail named tests.
  - The tests take their ground truth from the installed TypeScript: `isDeclarationFile`, `parseJsonConfigFileContent` with the real `include`, `sys.readFile`, `checkJsDirective`, `getParsedCommandLineOfConfigFile` and `createProgram`. They do not rest on reasoning alone.
  - The real repository passes every new rule (type-suppression 1, ratchet 1, run 28).
- **Escapes considered.**
  - Finding 1: the new tests are a superset of TypeScript's, by construction. They ignore case, and they read the whole entry name where TypeScript reads the part after its last slash or backslash. TypeScript's suffix tests cannot reach past the `/` before an entry name.
  - Finding 2: TypeScript checks only the first two bytes. A UTF-16 file without a byte-order mark, or UTF-32, is read as UTF-8 by both TypeScript and the scan (UTF-32LE starts `FF FE`, so it is refused). That needs no rule.
  - Finding 3: a directory named `x.js` under `src/` is walked, not refused. Its TypeScript files are scanned, and no tool loads a directory as a script. A link named `.js` already fails closed.
- **New false positives, fail-safe.**
  - A declaration-like name with `.d.` before a backslash, which TypeScript would read differently on POSIX.
  - A JavaScript file under `src/` that nothing loads.
  - Neither exists today.
- **Security.** The new code lists folders and reads files as bytes, decodes them, and runs nothing. Its regular expressions are linear. The tests load the installed TypeScript as a library, offline, and write only under the OS temporary directory.
- **Not done, deliberately.**
  - `config-inventory.mjs`'s UTF-8 reader is unchanged. Its consumers' tools all read UTF-8.
  - `coverage-ratchet.mjs` and its summary sentence are unchanged, so no wiring pin moved.
  - No tsconfig, Jest, lint, floor or package change was needed to make anything pass.
- **Tooling note.** Line breaks in test names are written as `'\r'`, `'\n'` and `String.fromCodePoint(0x2028)`/`(0x2029)` (`LINE_BREAKS`), so the source shows them. No raw U+2028 or U+2029 was added.

## Phase-2E review findings, R16 and three test gaps: how phase 2F handled them

Detail, with what the installed tools showed, is in [ratchet-enforcement.md §8](../../../evidence/QA-9/ratchet-enforcement.md#8-phase-2f-phase-2e-review-findings-r16-and-three-test-gaps).

| Item | Handling | Proof |
|---|---|---|
| 1 Low: `@ts-nocheck` with U+212A (KELVIN SIGN) for `k` passed the scan, though TypeScript lower-cases it to `ts-nocheck` | **Fixed.** The `u` flag on all three patterns: letter case is matched with Unicode case folding. Type-suppression test 7 generates every one-character spelling `toLowerCase()` gives (10 on Node 22.23.1), checks with each package's own TypeScript that each switches checking off, and checks the scan refuses each | Type-suppression 3, 7; ratchet 31. RED (`not ok 76`, lines 10 and 11); F1 |
| 2 Low: U+2028 or U+2029 after `// eslint-disable-line` hid a blanket disable | **Fixed.** A `//` comment ends at CR, LF, U+2028 or U+2029 (`LINE_END`). Lint-scope test 8 shows the installed ESLint, with `@typescript-eslint/parser` and with espree, turning every rule off in exactly that case | Lint-scope 5, 8. F2, F3 |
| The overclaims the review named | **Corrected.** docs/23 §9 rule 3; ratchet-enforcement.md §7 (struck through, with the correction); this file's phase-2E self-review. The `directivesIn` comment no longer says no comment ESLint sees is skipped | — |
| R16: declaration files are never type-checked | **Closed narrowly**, as Codex chose: a declaration file (TypeScript's names: `.d.ts`, `.d.mts`, `.d.cts`, `.d.*.ts`, in any case) under `apps/mobile/src/` or `packages/domain/src/` fails. A generated `apps/mobile/expo-env.d.ts`, `.expo/types` and any other folder outside `src/` are read for comments but not refused. That remainder is named as **S7 Quality's, under QA-9**. None exists today | Type-suppression 5, 8; ratchet 31. RED (`not ok 74`); F4–F7 |
| The phase-2D review's three test gaps | **Added.** A directory named `.babelrc`, `babel.config.js` or `.babelignore` (transform-config 3). The lint-scope `package.json` cases: not JSON, five non-objects, a directory, a link, unreadable (lint-scope 9). Both eslintrc keys at once, with each key's check mutated away in turn (lint-scope 4) | F8, F10–F14 |
| The phase-2E review itself | **Persisted verbatim** as [review-phase2e.md](../../../evidence/QA-9/review-phase2e.md), its header marking its commands **not run**. Its "only the writer has run 2E's `pnpm check`" is stale: Codex ran it independently on Node 22.23.1 (258 tests). That claim is not repeated here as fact | `git diff --no-index` against `/tmp/fitlog-ad123579-final.md`: only the header and a final newline |

## Commands run in phase 2F

Every shell command went through `rtk proxy`, from this worktree, one command at a time. Files were read with Read, Glob and Grep, `node_modules` and `/tmp` included.
- **Allowed and used:** `rtk proxy node --version`, `rtk proxy git status --short`, `rtk proxy git diff …`, `rtk proxy node --test scripts/quality/*.test.mjs` and `rtk proxy pnpm check`.
- **Denied in dontAsk mode, not retried as is:**
  - the session's first command, the compound `rtk cat /Users/Adya/.codex/RTK.md; rtk git status; rtk git log …` (the files were read with Read instead);
  - `rtk proxy which node`;
  - `rtk proxy node --test --test-reporter=dot scripts/quality/*.test.mjs`;
  - `rtk proxy node --test /tmp/fitlog-qa9-phase2f-mutants/scripts/quality/type-suppression.test.mjs`. That was a probe for running a scratch copy; nothing had been written there.
- The tool cuts the middle, and for failing runs the end, of long outputs. Where a failing test fell there, the record says so. `pnpm check` output was saved to a file by the tool and read back with Read and Grep.

| # | Command | Result |
|---|---|---|
| 1 | `rtk cat /Users/Adya/.codex/RTK.md; …` | **Denied** (dontAsk) |
| 2 | `rtk proxy node --version` | `v22.23.1`, the `.node-version` pin |
| 3 | `rtk proxy which node` | **Denied** (dontAsk) |
| 4 | `rtk proxy git status --short` | The phase-2E tree: nine paths |
| 5 | `rtk proxy node --test scripts/quality/*.test.mjs` (before any change) | `# tests 73`, `# pass 73`, `# fail 0` |
| 6 | RED: the same, with every phase-2F test and only the `DECLARATION_ROOTS` export | Exit 1; middle and end cut. Visible: `not ok 74` (type-suppression 5, the declaration refusal missing) and `not ok 76` (type-suppression 7: TypeScript's assertions passed, the scan missed the two Kelvin lines) |
| 7 | `rtk proxy node --test --test-reporter=dot scripts/quality/*.test.mjs` | **Denied** (dontAsk) |
| 8 | GREEN, first try | Exit 1: `SyntaxError` at `lint-scope.mjs:108`, a raw U+2028 the editing tool wrote into the regex literal; `# tests 39`, `# pass 37`, `# fail 2` (the two files importing `lint-scope.mjs` could not load) |
| 9 | GREEN, after writing every such character by code point or as `\p{Zl}`/`\p{Zp}` | `# tests 77`, `# pass 77`, `# fail 0`; `10 spellings: … @ts-nochecU+212A` |
| 10 | `rtk proxy node --test /tmp/fitlog-qa9-phase2f-mutants/…` | **Denied** (dontAsk) |
| 11–24 | F1–F14: the same quality command, one mutation each, each restored | 3, 2, 2, 3, 3, 1, 1, 1, 2, 1, 1, 1, 1 and 1 failures; details in [§8](../../../evidence/QA-9/ratchet-enforcement.md#mutations-each-restored-1) |
| 25 | The same, after restoring F1–F14 (a Grep found no mutated text, and every restored line) | `# tests 77`, `# pass 77`, `# fail 0` |
| 26 | **Final:** `rtk proxy pnpm check` | **Exit 0.** Run 26 is detailed after this table |
| 27 | `rtk proxy git status --short` | The same nine paths as at the start of 2F, plus nothing new outside `scripts/quality/`, `docs/evidence/QA-9/` and `docs/plan/runs/QA-9/` |
| 28 | `rtk proxy git diff --stat -- apps/mobile/jest.config.cjs package.json apps/mobile/package.json packages/domain/package.json apps/mobile/eslint.config.js apps/mobile/tsconfig.json packages/domain/tsconfig.json packages/domain/tsconfig.client.json .github pnpm-lock.yaml .npmrc pnpm-workspace.yaml apps/mobile/src packages/domain/src supabase docs/plan/GOALS.md docs/plan/ACCEPTANCE.md apps/mobile/coverage-thresholds.json` | Only the four phase-2/2B files: 8, 3, 2 and 2 lines, as at the end of 2E |
| 29–30 | `rtk proxy git diff --no-index /tmp/fitlog-ad123579-final.md docs/evidence/QA-9/review-phase2e.md`, twice | First: the header, a final newline and two lines with doubled backslashes (a tooling slip). After fixing those two lines: only the header and a final newline |
| 31 | After the prose edits: `rtk proxy node --test scripts/quality/*.test.mjs` | `# tests 77`, `# pass 77`, `# fail 0` |
| 32 | `rtk proxy git status --short` | The same nine paths |

**Run 26 in full.**
- The root guard prints `Coverage ratchet verified.`, with the `not anchored` note. Its summary is unchanged from 2E: 142 TypeScript files, 210 entries, 131 other linted files, 141 scanned files.
- Typecheck passes. Lint passes (`eslint . --max-warnings=0`), with `Design rules verified`.
- Domain: `ℹ pass 37`, `Exact lines coverage 536/583 (91.9383%) meets the threshold of 91.42%`, `Exact branches coverage 272/313 (86.9010%) meets the threshold of 86.9%`, `Exact functions coverage 106/117 (90.5983%) meets the threshold of 90.59%`, and `Coverage counts all 8 files that --test-coverage-include matches`.
- Mobile `test:ci` echoes `… jest --runInBand --ci --coverage --no-watchman`. Quality `# pass 77`; the mobile guard verified; `Tests: 126 passed`; `Statements : 12.23% ( 254/2076 )`, `Branches : 10.57% ( 164/1551 )`, `Functions : 10.23% ( 84/821 )`, `Lines : 18.67% ( 191/1023 )`.
- Plan `# pass 22`; `plan.json and board.html match GOALS.md`.
- **262 tests** (37 + 77 + 126 + 22).

Run 26 came after every code edit. After it, only prose changed: this file, `ratchet-enforcement.md`, `review-phase2e.md` and docs/23 §9 rule 3. The only document a test reads is `coverage-baseline.md` (ratchet test 2), and it is unchanged.

**Self-review (in place of the sub-agent reviews, which the brief forbade).**
- **Correctness.** Each fix has a regression test that failed first (RED, where visible) and a mutation that fails a named test. The two new tests prove the review's scenarios with the installed TypeScript and ESLint rather than by argument. The real repository passes every new rule (type-suppression 1, lint-scope 1, ratchet 1).
- **Escapes considered.**
  - Finding 1: TypeScript lower-cases only pragma names, so `@ts-ignore` and `@ts-expect-error` (matched case-sensitively by TypeScript) gain nothing from the `u` flag. It is there for consistency, and no test can tell the difference.
  - Spellings with two or more substituted characters: case folding works character by character, and test 7 also refuses the all-upper-case Kelvin form.
  - Finding 2: JavaScript has exactly four line terminators, and `LINE_END` holds all four.
  - R16: names TypeScript calls declarations are refused in any letter case (a fail-safe superset). A file named `env.d.tsx` is an ordinary checked file and passes. *(Corrected in 2G: it was not a superset. The pattern's `.` did not match CR, LF, U+2028 or U+2029, so `loose.d.`+U+2028+`.ts`, a declaration file to TypeScript, passed. That was the phase-2F review's finding 1, fixed in 2G with TypeScript's own two tests and checked against the installed TypeScript.)*
- **New false positives, fail-safe.** `@ts-nocheck` or `@ts-ignore` written with U+017F (LONG S) for `s` is now flagged, though TypeScript would not honour it. None exists today.
- **Security.** The new code only lists folders and reads files as text, runs nothing and reaches no network; its regular expressions are linear. The tests load the installed TypeScript and ESLint as libraries, offline.
- **Tooling note.** The editing tool turns a written `\u` escape sequence into the raw character. Every such character in phase-2F code is now written by code point or as a Unicode property escape, so the source shows it. Phase 2E's one raw U+2028, in type-suppression test 4, is left as it was.

## Phase-2D review findings and R14: how phase 2E handled them

Detail, with the installed code each fix was read from, is in [ratchet-enforcement.md §7](../../../evidence/QA-9/ratchet-enforcement.md#7-phase-2e-phase-2d-review-findings-and-r14).

| Item | Handling | Proof |
|---|---|---|
| 1 Low: the disable scan missed `eslint-disable , -- why`, `eslint-disable "" -- why` and two comments back to back | **Fixed.** Overlapping comment starts are each read (`/\/(?=[/*])/g`), and the rule list is read as `@eslint/plugin-kit` reads it; an empty list disables every rule. The comment that claimed "a directive is never missed" is rewritten | Lint-scope 5: the review's four strings, three more failing forms, and five reasoned disables that pass. E1, E2 |
| 2 Low: a `.watchmanconfig` could hide folders from Jest's file list | **Fixed.** `--no-watchman` in the pinned `test:ci` and in the mobile `package.json` `test:ci`, the only change to that file, as Codex authorised | Gate-wiring 3 (two cases) and 9. E3, E3b. `pnpm check` runs Jest with the flag and counts the same 254/2076 statements |
| 3 Low: the reason for skipping `node_modules` was incomplete | **Corrected and named.** The `config-inventory.mjs` comment now says the skip is a trust boundary and why. R6 names, under PL-1, a force-tracked `node_modules` path (a read-only Git-tracking check) and protection for `.npmrc` and `pnpm-workspace.yaml`. No dependency-trust code, as Codex asked | Comment; R6; docs/23 §9 rule 3 |
| 4 Low (plan): a bare push would not start the job | **Plan corrected, not done.** A draft pull request against `main`, with one ESLint-only error that passes the guard and typecheck, such as M12's `const unusedLintProbe = 1;` in `jest.config.cjs`. It still needs ~~Codex's specific authorisation~~ *(3D: the owner's specific approval, docs/23 §6)* for a push and a pull request | [§7, "Box 3"](../../../evidence/QA-9/ratchet-enforcement.md#7-phase-2e-phase-2d-review-findings-and-r14) |
| R14: TypeScript suppression comments | **Closed** for every TypeScript file of `apps/mobile` and `packages/domain`. `@ts-ignore` and `@ts-nocheck` fail anywhere, in any case *(corrected in 2F: in any ASCII case only; the Kelvin-sign spelling passed until 2F's Unicode case folding)*; `@ts-expect-error` needs a reason of at least three different words on its own line and in the same comment. The scan reads 142 files today and finds none, so no source changed | Type-suppression 1–6; ratchet 31. E4–E13 |
| R9: post-Jest file comparison | **Not built, not claimed closed.** Codex assigned it to QA-10 | R9 |
| The review's test gaps (a directory named `.babelrc`; the lint-scope `package.json` cases; `eslintConfig`/`eslintIgnore` mutations one by one) | **Not added** in 2E: outside the brief's list, and no rule depends on them. **Added in 2F** | Named under "Decisions for Codex"; 2F above |

## Commands run in phase 2E

Every shell command went through `rtk proxy`, from this worktree, one command at a time, with no `git -C`, pipe or redirection.
- **Allowed and used:** `rtk proxy node --test scripts/quality/*.test.mjs`, `rtk proxy pnpm check`, `rtk proxy git status *`, `rtk proxy git diff *`, `rtk proxy node --version` and `rtk proxy which node`. Files were read with Read, Glob and Grep, `node_modules` and `/tmp` included.
- **Denied in dontAsk mode, not retried:** `rtk proxy wc -l /tmp/fitlog-qa9-pinned-check-1248.log` (run 4). The log was read with Read instead.
- The tool cuts the middle, and sometimes the end, of long outputs. Where a failing test fell there, the record says so. `pnpm check` output was saved to a file by the tool and read back with Read and Grep.

| # | Command | Result |
|---|---|---|
| 1 | `rtk proxy git status --short` | The phase-2D tree: nine paths |
| 2 | `rtk proxy git status --short --ignored apps/mobile packages/domain` | The same, plus ignored `apps/mobile/coverage/` and `apps/mobile/node_modules/` |
| 3 | `rtk proxy git diff -- docs/23-MASTER-PLAN.md` | The §9 rule 3 diff, read before editing |
| 4 | `rtk proxy wc -l /tmp/fitlog-qa9-pinned-check-1248.log` | **Denied** (dontAsk) |
| 5 | `rtk proxy git diff --no-index /tmp/fitlog-a8b4f2bc-final.md docs/evidence/QA-9/review-phase2d.md` | Only the provenance header and a final newline differ |
| 6 | `rtk proxy node --version` | `v22.23.1`, the `.node-version` pin |
| 7 | `rtk proxy which node` | `/Users/Adya/.local/bin/node` |
| 8 | `rtk proxy node --test scripts/quality/*.test.mjs` (before any change) | `# tests 65`, `# pass 65`, `# fail 0` |
| 9 | RED: the same, with a reporting-nothing stub and every phase-2E test | Exit 1; middle and end cut, totals not visible. Visible: test 54's failure tail and `not ok 59` |
| 10 | GREEN, first try: the same | `# tests 73`, `# pass 73`, `# fail 0` |
| 11–14 | E1, E2, E3, E3b: the same, one mutation each, each restored | 1, 1, exit 1 with many guard-level failures (end cut), and 2 failures |
| 15 | `rtk proxy git diff -- apps/mobile/package.json` (after restoring E3b) | Only `test:ci` differs from `main`'s file apart from phase 1's `test:coverage`, and it ends ` --no-watchman` |
| 16–25 | E4–E13: the same, one mutation each, each restored | 1, 2, 2, 1, 1, 1, 1, 1, 1 and 1 failures; details in §7 |
| 26 | The same, after restoring E1–E13 (a Grep found no mutated text) | `# tests 73`, `# pass 73`, `# fail 0`; `Node 22.23.1 truncated --test-coverage-functions=50.01 (1/2)` |
| 27 | **Final:** `rtk proxy pnpm check` | **Exit 0.** The root guard prints `Coverage ratchet verified.`, with the `not anchored` note. Its summary adds `No @ts-ignore, @ts-nocheck or @ts-expect-error without a reason is in the 142 TypeScript files under apps/mobile and packages/domain.`, and keeps 210 entries, 131 other linted files and 141 scanned files. Then typecheck passes; lint passes, with `Design rules verified`. Domain `ℹ pass 37`, `Exact lines coverage 536/583 (91.9383%) meets the threshold of 91.42%`, `Exact branches coverage 272/313 (86.9010%) meets the threshold of 86.9%`, `Exact functions coverage 106/117 (90.5983%) meets the threshold of 90.59%`, `Coverage counts all 8 files that --test-coverage-include matches`. Mobile `test:ci` echoes `… jest --runInBand --ci --coverage --no-watchman`: quality `# pass 73`, the mobile guard verified, `Tests: 126 passed`, `Statements : 12.23% ( 254/2076 )`, `Branches : 10.57% ( 164/1551 )`, `Functions : 10.23% ( 84/821 )`, `Lines : 18.67% ( 191/1023 )`. Plan `# pass 22`; `plan.json and board.html match GOALS.md`. **258 tests** (37 + 73 + 126 + 22) |
| 28 | `rtk proxy git status --short` | The same nine paths as at the start of 2E |
| 29 | `rtk proxy git diff --stat -- apps/mobile/jest.config.cjs package.json apps/mobile/package.json packages/domain/package.json apps/mobile/eslint.config.js apps/mobile/tsconfig.json packages/domain/tsconfig.json packages/domain/tsconfig.client.json .github pnpm-lock.yaml .npmrc pnpm-workspace.yaml apps/mobile/src packages/domain/src supabase docs/plan/GOALS.md docs/plan/ACCEPTANCE.md` | Only the four phase-2/2B files: `jest.config.cjs` 8, mobile `package.json` 3, root `package.json` 2, domain `package.json` 2 lines. No diff in `eslint.config.js`, any tsconfig, `.github/`, the lockfile, `.npmrc`, `pnpm-workspace.yaml`, any source, `supabase/`, GOALS or ACCEPTANCE |
| 30 | After the prose edits: `rtk proxy node --test scripts/quality/*.test.mjs` | `# tests 73`, `# pass 73`, `# fail 0` |
| 31 | `rtk proxy git status --short` | The same nine paths |

Run 27 came after every code edit. After it only prose changed: this file, `ratchet-enforcement.md` and docs/23 §9 rule 3. The only document a test reads is `coverage-baseline.md` (ratchet test 2), and it is unchanged. Run 30 confirms the quality tests are unaffected.

**Self-review (in place of the sub-agent reviews, which the brief forbade).**
- **Correctness.** Every mutation E1–E13 fails a named test, and the real repository passes each new rule (lint-scope 1, type-suppression 1, ratchet 1). Codex's brief said to stop and report if an actual TypeScript suppression turned up; none did (142 files), so no source changed.
- **Escapes considered.** For R14, the scan is a superset of what TypeScript 6.0.3 honours: anywhere in the file, any case, strings included, `.mts`/`.cts`/`.d.ts` and nested `node_modules` included, and links fail closed. *(Corrected in 2F: it was not a superset. "Any case" meant ASCII case, and `@ts-nocheck` written with U+212A for `k`, which TypeScript lower-cases to `ts-nocheck`, passed the scan. That was the phase-2E review's finding 1, fixed in 2F with Unicode case folding and checked against TypeScript itself.)* What stays outside is named: TypeScript files outside both packages (none imported today), a force-added top-level `node_modules` path (R6), and declaration files that `skipLibCheck` never checks (R16).
- **New false positives, fail-safe.** Prose or strings naming `@ts-ignore`, `@ts-nocheck` or `@ts-expect-error` must be reworded. `/// eslint-disable-line` without rules or a reason is now flagged, though ESLint reads it as `/ eslint-disable-line`. None exists today.
- **Security.** The new code only lists folders and reads files as text, runs nothing, and reaches no network. Its regular expressions are linear.
- **Tests first.** Every phase-2E test was written against a stub before any fix, and RED was seen for lint-scope 5 and gate-wiring 9. The other RED failures fell in the tool's cut output and are inferred from the assertions (§7).

## Phase-2C review findings, R8 and R11: how phase 2D handled them

| Item | Handling | Proof |
|---|---|---|
| 1 Low: the coverage scope could grow past the scanned folders | **Fixed.** In the working tree each mobile include pattern must start with a `SUPPRESSION_ROOTS` prefix (`src/`), with no `..` or backslash, in the thresholds file and the floor. Widening outside `src/` needs the scan widened first. Test 8's widening case now stays inside `src/` | Ratchet 26 (seven patterns, both files, both states of `main`) and 27 (the review's widened-anchored-suppressed case). Mutation D1 |
| 2 Low: an unreadable mobile `package.json` depended on check order | **Fixed.** `mobilePackageProblems` reads outside its `try` and wraps only `JSON.parse` | Ratchet 28. D2 |
| 3 Low (evidence): "approved by Codex" | **Fixed.** `ratchet-enforcement.md` says "authorised". It records the review's code-only acceptance and Codex's design acceptance of 2B and 2C (subject to the exact-integration floor proof) as what they are: phase acceptances, not the owner's signature, not the goal's | Header table of `ratchet-enforcement.md`; "Acceptances recorded" above |
| 4 Low: R11 too narrow | **Fixed** by a transform-config inventory, after reading how jest-expo 57.0.6, babel-jest 29.7.0 and @babel/core 7.29.7 actually load configuration ([§6](../../../evidence/QA-9/ratchet-enforcement.md#6-phase-2d-phase-2c-review-findings-r8-and-r11)). Refused anywhere under `apps/mobile`: every `babel.config.*`, `.babelrc*` and `.babelignore` (hidden, nested, any case, any entry kind), a `babel` key, a nested `package.json`. A missing, unreadable or non-object mobile `package.json` fails too. Links are never followed and fail closed. The domain's loader flags are held by its template and now named by a test | Transform-config 1–6; ratchet 29, 30. D3–D6, D11, D12, D14 |
| R8: lint scope | **Closed within `apps/mobile`.** `eslint.config.js` is pinned as text; every other ESLint config source fails (flat and eslintrc names, nested, any case, and the `eslintConfig`/`eslintIgnore` keys). A disable must name its rules and give a reason after ` -- `, and inline rule configuration fails, using ESLint 9.39.5's own directive grammar. Lint-wiring narrowing cases were added to the existing pins. Ownership: S7 Quality owns the pin; a goal that changes the config updates it in the same diff (docs/23 §9 rule 3) | Lint-scope 1–7; gate-wiring 3, 6, 8; ratchet 30. D7–D10, D13 |
| The review's naming gap | **Recorded for QA-10** as R13, with a `node_modules` folder inside `src/`, which Jest's default ignore pattern also leaves uncounted | R13; "Found for other goals" |

## Commands run in phase 2D

Every shell command went through `rtk proxy`, from this worktree, one command at a time.
- **Allowed commands:** `rtk proxy node --test scripts/quality/*.test.mjs`, `rtk proxy pnpm check`, `rtk proxy git diff *`, `rtk proxy git status *`, `rtk proxy node --version` and `rtk proxy which node`. Files were read with Read, Glob and Grep, `node_modules` included.
- **Denied in dontAsk mode, not retried:** `rtk proxy pwd`, the session's first command. It is not on that list. The denial read: `Permission to use Bash has been denied because Claude Code is running in don't ask mode`. No other command was denied.
- The tool truncates the middle of long outputs. A failing run's middle was cut every time, and the RED run's end too. Where a failing test fell in the cut part, the record says so ([ratchet-enforcement.md §6](../../../evidence/QA-9/ratchet-enforcement.md#6-phase-2d-phase-2c-review-findings-r8-and-r11)). `pnpm check` output was saved to a file by the tool and read back with Read and Grep.

| # | Command | Result |
|---|---|---|
| 1 | `rtk proxy node --version` | `v22.23.1`, the `.node-version` pin |
| 2 | `rtk proxy which node` | `/Users/Adya/.local/bin/node` |
| 3 | `rtk proxy git status --short` | The phase-2C tree: nine paths |
| 4 | `rtk proxy node --test scripts/quality/*.test.mjs` (before any change) | `# tests 47`, `# pass 47`, `# fail 0` |
| 5 | `rtk proxy git diff --no-index /tmp/fitlog-08c6473e-final.md docs/evidence/QA-9/review-phase2c.md` | Only the provenance header and a final newline differ |
| 6 | The same tests after the behaviour-neutral refactor and stubs | `# tests 47`, `# pass 47`, `# fail 0` |
| 7 | RED: the same, with every phase-2D test written | Exit 1; middle and end truncated, totals not visible. Visible: `not ok 58`, `not ok 59`, `not ok 60` |
| 8 | GREEN, first try: the same | `# tests 65`, `# pass 65`, `# fail 0` |
| 9–21 | D1–D13: the same, one mutation each, each restored | 2, 1, 2, 2, 2, 1, 2, 2, 1, 1, 1, 1 and 1 failures; details in §6 |
| 22 | The same, after restoring D1–D13 (a Grep found no mutated text) | `# tests 65`, `# pass 65`, `# fail 0` |
| 23 | `rtk proxy pnpm check` | Exit 0; domain lines 534/583. Self-review then found that a missing mobile `package.json` was reported only when the inventory had entries. The fix and transform-config test 6's empty-folder case followed |
| 24 | D14 (the pre-fix condition): the quality tests | `# pass 64`, `# fail 1`: `not ok 65`; restored |
| 25 | **Final:** `rtk proxy node --test scripts/quality/*.test.mjs` | `# tests 65`, `# pass 65`, `# fail 0`; `Node 22.23.1 truncated --test-coverage-functions=50.01 (1/2)` |
| 26 | **Final:** `rtk proxy pnpm check` | **Exit 0.** The root guard prints `Coverage ratchet verified.` with the `not anchored` note; its summary reads `No Babel configuration is among the 210 entries under apps/mobile, apps/mobile/eslint.config.js is as reviewed, and the 131 other files it lints hold no eslint-disable without rules and a reason, and no inline rule configuration. No coverage-suppression comment is in the 141 files under apps/mobile/src and packages/domain/src.` Then: typecheck passes; lint passes, with `Design rules verified`; domain `ℹ pass 37`, `Exact lines coverage 536/583 (91.9383%) meets the threshold of 91.42%`, `Exact branches coverage 272/313 (86.9010%) meets the threshold of 86.9%`, `Exact functions coverage 106/117 (90.5983%) meets the threshold of 90.59%`, `Coverage counts all 8 files that --test-coverage-include matches`; quality `# pass 65`; mobile guard verified, `Tests: 126 passed`, `Statements : 12.23% ( 254/2076 )`, `Branches : 10.57% ( 164/1551 )`, `Functions : 10.23% ( 84/821 )`, `Lines : 18.67% ( 191/1023 )`; plan `# pass 22`; `plan.json and board.html match GOALS.md`. **250 tests** (37 + 65 + 126 + 22) |
| 27 | `rtk proxy git status --short` | The same nine paths as at the start of 2D |
| 28 | `rtk proxy git diff --stat -- apps/mobile/jest.config.cjs package.json apps/mobile/package.json packages/domain/package.json apps/mobile/eslint.config.js apps/mobile/tsconfig.json packages/domain/tsconfig.json packages/domain/tsconfig.client.json .github pnpm-lock.yaml apps/mobile/src packages/domain/src` | Only the four phase-2/2B files: `jest.config.cjs` 8, mobile `package.json` 3, root `package.json` 2, domain `package.json` 2 lines. No diff in `eslint.config.js`, any tsconfig, `.github/`, the lockfile or any source |
| 29 | After the prose edits: `rtk proxy node --test scripts/quality/*.test.mjs` | `# tests 65`, `# pass 65`, `# fail 0` |

Run 26 came after every code edit. After it only prose changed: this file, `ratchet-enforcement.md` and docs/23 §9 rule 3. Run 29 confirms the quality tests are unaffected. No script or test reads these files: the only document the tests read is `coverage-baseline.md` (ratchet test 2), and it is unchanged.

## Phase-2B review findings and how phase 2C handled them

| # | Finding | Handling | Proof |
|---|---|---|---|
| 1 | Medium: a thresholds file containing `null` switches off every mobile check, before and after anchoring; a `null` floor is caught only because a test module crashes | **Fixed.** The floor, thresholds file and domain `package.json` must each be a JSON object. Missing, not JSON, `null`, array, string, number or boolean are each a named problem, in the working tree and, except for missing, at a baseline. A file that exists but cannot be read stops the guard, naming it. `jest.config.cjs` is checked even then, and its scope and thresholds are reported `cannot be checked` | Ratchet tests 20–23 and 25, unanchored and anchored, including the review's exact tolerant config (test 21 loads it as Jest would and gets the narrowed scope) and the guard command's exit 1 (test 23). Mutations C1, C2, C3 and C7 each fail named tests |
| 2 | Low: `istanbul ignore` and similar comments narrow coverage, and the guard never reads source | **Fixed** by a source scan, rather than by softening docs/23. Istanbul, c8, V8 and Node suppression comments anywhere under `apps/mobile/src` and `packages/domain/src` fail with `file:line`; anything unreadable fails closed. Today it reads 141 files and finds none | Ratchet test 24 (both states of `main`); suppression tests 1–6. Mutations C4, C5 and C6 each fail named tests |

## Commands run in phase 2C

Every shell command went through `rtk proxy`, from this worktree.
- **Denied in dontAsk mode, not retried as is:** one compound command, `rtk proxy cat /Users/Adya/.codex/RTK.md; …; rtk proxy git status; …`. The session's allowed shell commands are exactly `rtk proxy node --test scripts/quality/*.test.mjs`, `rtk proxy pnpm check`, `rtk proxy git diff*`, `rtk proxy git status*` and `rtk proxy node --version`; files were read with Read, Glob and Grep.
- So no single quality test file could be run on its own, and the tool truncates the middle of the full run's output. Where a failing test's line fell in the truncated part, the record says so (ratchet-enforcement.md §5).
- The task message ended with a Python launcher for two background sessions (`qa9-nullfix`, `mb1-review1c`). It was **not run**: the instruction forbids launchers and sub-agents.

| # | Command | Result |
|---|---|---|
| 1 | `rtk proxy git status` | The phase-2B working tree, as listed above |
| 2 | `rtk proxy git diff -- docs/23-MASTER-PLAN.md` | The §9 rule 3 diff, read before editing |
| 3 | `rtk proxy git diff --no-index /tmp/fitlog-74c7436b-final.md docs/evidence/QA-9/review-phase2b.md` | Only the provenance header and a final newline differ |
| 4 | RED: `rtk proxy node --test scripts/quality/*.test.mjs` | `# tests 41`, `# pass 35`, `# fail 6`: ratchet 20–24, and the suppression file at import (`ERR_MODULE_NOT_FOUND`) |
| 5 | GREEN, first try: the same | `# tests 46`, `# pass 46`, `# fail 0` |
| 6–11 | C1–C6: the same, one mutation each, each restored | 3, 1, 2, 2, 1 and 1 failures; details in [ratchet-enforcement.md §5](../../../evidence/QA-9/ratchet-enforcement.md#5-phase-2c-review-remediation) |
| 12 | `rtk proxy git diff --no-index /dev/null scripts/quality/coverage-ratchet.mjs` | The guard read back after the mutations (the tool truncated its middle; a Grep for every mutated text found none) |
| 13 | C7 (with ratchet test 25 added): the same | `# tests 47`, `# pass 46`, `# fail 1` |
| 14 | **Final:** `rtk proxy node --test scripts/quality/*.test.mjs` | `# tests 47`, `# pass 47`, `# fail 0`; `Node 22.23.1 truncated --test-coverage-functions=50.01 (1/2)` |
| 15 | **Final:** `rtk proxy pnpm check` | **Exit 0.** The root guard prints `Coverage ratchet verified. … No coverage-suppression comment is in the 141 files under apps/mobile/src and packages/domain/src.`, with the `not anchored` note. Then: typecheck passes; lint passes, with `Design rules verified`; domain `ℹ pass 37`, `Exact lines coverage 533/583 (91.4237%) meets the threshold of 91.42%`, `Exact branches coverage 272/313 (86.9010%) meets the threshold of 86.9%`, `Exact functions coverage 106/117 (90.5983%) meets the threshold of 90.59%`, `Coverage counts all 8 files that --test-coverage-include matches`; quality `# pass 47`; mobile guard verified, `Tests: 126 passed`, `Statements : 12.23% ( 254/2076 )`, `Branches : 10.57% ( 164/1551 )`, `Functions : 10.23% ( 84/821 )`, `Lines : 18.67% ( 191/1023 )`; plan `# pass 22`; `plan.json and board.html match GOALS.md`. **232 tests** (37 + 47 + 126 + 22) |
| 16 | `rtk proxy git status --short` | The same nine paths as at the start of 2C: no new path outside `scripts/quality/`, `docs/evidence/QA-9/` and `docs/plan/runs/QA-9/` |
| 17 | `rtk proxy git diff -- apps/mobile/jest.config.cjs package.json apps/mobile/package.json packages/domain/package.json` | Exactly the phase-2B diffs described above; 2C changed none of them |
| 18 | After the prose edits: `rtk proxy node --test scripts/quality/*.test.mjs` | `# tests 47`, `# pass 47`, `# fail 0` |

Run 15 came after every code edit. After it only prose changed: docs/23 §9 rule 3, `ratchet-enforcement.md` and this file; run 18 confirms the quality tests are unaffected. No script or test reads any of them. A Grep of `scripts/quality/` for `docs/` finds only:
- `coverage-baseline.md` (read by ratchet test 2, and unchanged);
- the floor's `source` text;
- comments.

## Review findings and how phase 2B handled them

| # | Finding | Handling | Proof |
|---|---|---|---|
| 1 | High: `roots` / `modulePathIgnorePatterns` narrow mobile coverage unseen | **Fixed.** `jest.config.cjs` may export only `preset` (pinned `'jest-expo'`), `testMatch` (pinned), `clearMocks` (boolean), `collectCoverageFrom` and `coverageThreshold` (both must be the thresholds file), and `coverageReporters` (Istanbul built-ins only). A `jest` key in the mobile `package.json` also fails | Probes P1/P2 reproduced the review's numbers (254/1503 and 254/726, Jest green). M14 and M15 fail `pnpm check` at the root guard, while Jest alone still passes. Ratchet test 9 has 17 failing cases |
| 2 | Medium: "the first commit closes R1" is false | **Corrected** everywhere: the floor is anchored only once `main` (or the CI baseline) records it. The guard now reports `anchored` and prints `the floor is not anchored yet` | Ratchet test 12 shows the window locally and in CI, and its closure when `main` takes the reviewed commit. Ratchet test 2 holds the floor equal to §5 while unanchored, and M16 fails `pnpm check` through it |
| 3 | Medium: the trusted baseline redirected, or CI mode switched off | **Fixed within scope, with no CI edit.** `GITHUB_ACTIONS=true` means CI. In CI, a fork point at `HEAD` is refused. Root `check`, `test`, `typecheck` and `lint` are pinned exactly, and root `check` runs the guard first. The CI `check` job is read by its YAML layout (below). Wider workflow trust is recorded for PL-1 | Ratchet tests 10 and 17; wiring tests 2, 6 and 7; G1, G4, G5, G6 |
| 4 | Medium: lint and type gates unprotected | **Fixed.** Mobile `lint` (`--max-warnings=0` and design rules), mobile `typecheck` and domain `typecheck` are pinned, and `pre`/`post` hooks are refused. The tsconfigs keep their strict options, keep every strict-family option on (and never set `noCheck`), and keep the same files | Wiring tests 3, 4 and 5; G2, G3 |
| 5 | Low: domain line noise at zero margin | **Documented with owners; not relaxed** (R3) | — |
| 6 | Low: float arithmetic and Node coupling | **Fixed.** Integer comparison; at most 2 decimals in both the reporter and the guard. The "Node did not fail it" assertion holds only on 22.23.1. `node --version` = `v22.23.1` = `.node-version` | Reporter tests 3, 4 and 5; ratchet test 7 |
| 7 | Low: domain files no test loads go uncounted | **Fixed.** The reporter fails on any matched file missing from Node's summary. Today it prints `Coverage counts all 8 files that --test-coverage-include matches` | Reporter tests 6 and 7 |

**How the CI job is read (finding 3).** The workflow is not edited. The guard reads its block-style YAML by indentation, not by a single regex.
- Top-level keys: only `name`, `on`, `permissions`, `concurrency` and `jobs`.
- Job keys: only `runs-on`, `timeout-minutes`, `env` and `steps`. So `if`, `needs`, `continue-on-error`, `defaults`, `strategy` and merge keys are refused. GitHub reports a skipped job as passing.
- Job `env` names: only `CI`, `EXPO_NO_TELEMETRY` and `FITLOG_CONTRACT_BASELINE`. The baseline is defined exactly once in the file (block, quoted or flow key), as the reviewed event-based line.
- `- run: pnpm check` appears exactly once, with nothing nested under it.
- The job may not mention `GITHUB_ENV` or `GITHUB_PATH`.
- Comments, blank lines and CRLF endings pass.

This reads text, so it does not protect against arbitrary workflow code: an escaped key, an earlier step that rewrites files, a changed action, or pnpm settings. That trust is PL-1's (R6).

## Commands run in phase 2B

Every shell command went through `rtk proxy`, from this worktree.
- **Denied in dontAsk mode, not retried as is:** one compound command, `rtk proxy git -C … status --short && … && rtk proxy ls -la …`. It was replaced by single allowed commands, and by Read/Glob for files.
- No launch script was run, and no sub-agent or worker was started.

| # | Command | Result |
|---|---|---|
| 1 | `rtk proxy git status --short` | The phase-2 files as listed above |
| 2 | `rtk proxy git diff -- docs/23-MASTER-PLAN.md apps/mobile/jest.config.cjs apps/mobile/package.json packages/domain/package.json` | The phase-2 diff, read before editing |
| 3 | `rtk proxy node --version` | `v22.23.1` |
| 4 | `rtk proxy node --test scripts/quality/coverage-ratchet.test.mjs scripts/quality/exact-coverage-reporter.test.mjs` (before changes) | `# tests 21`, `# pass 21` |
| 5 | P1: `rtk proxy pnpm --filter @fitlog/mobile exec jest --runInBand --ci --coverage --coverageReporters=text-summary --modulePathIgnorePatterns='<rootDir>/src/features/gym/'` | `Statements : 16.89% ( 254/1503 )`, `Tests: 126 passed`: finding 1 reproduced |
| 6 | P2: the same with `--roots='<rootDir>/src/data' --roots='<rootDir>/src/lib' --roots='<rootDir>/src/theme' --roots='<rootDir>/src/ui'` | `Statements : 34.98% ( 254/726 )`, `Tests: 126 passed` |
| 7 | RED: `rtk proxy node --test scripts/quality/*.test.mjs` (new tests, old guard and reporter) | `# tests 35`, `# pass 21`, `# fail 14` |
| 8 | RED: `rtk proxy node --test scripts/quality/coverage-ratchet.test.mjs` | `# tests 19`, `# pass 12`, `# fail 7` (tests 2, 3, 7, 9, 10, 12, 17) |
| 9 | GREEN, first try: `rtk proxy node --test scripts/quality/*.test.mjs` | `# pass 34`, `# fail 1`. Test 17 used `^` against `Error: …`, a test bug that was fixed |
| 10 | GREEN: the same | `# tests 35`, `# pass 35`; `Node 22.23.1 truncated --test-coverage-functions=50.01 (1/2)` |
| 11 | `rtk proxy pnpm check` | **Exit 0.** Domain 37 pass, exact lines 533/583, `Coverage counts all 8 files …`; quality 35 pass; mobile 126 pass at 12.23/10.57/10.23/18.67; plan 22 pass |
| 12–15 | M14, M15: `rtk proxy pnpm check`, then the Jest command without flags | Each `pnpm check` exits 1 at the root guard, and Jest alone passes. Verbatim lines are in [ratchet-enforcement.md §4](../../../evidence/QA-9/ratchet-enforcement.md#4-phase-2b-review-remediation) |
| 16 | `rtk proxy git diff -- apps/mobile/jest.config.cjs package.json` | Jest config restored (identical to phase 2); the root diff is one line |
| 17–19 | G1+G2+G3, G4, G5: `rtk proxy node --test scripts/quality/gate-wiring.test.mjs` | 3, 1 and 1 named failures, each restored |
| 20 | G6: `rtk proxy node --test scripts/quality/coverage-ratchet.test.mjs` | Test 17 fails, then restored |
| 21–22 | M16: the ratchet tests, then `rtk proxy pnpm check` | Test 2 fails; `pnpm check` exits 1 in mobile `test:ci`; restored (Grep: both files at 12.23) |
| 23 | `rtk proxy git diff --no-index /tmp/fitlog-qa9-review-final.md docs/evidence/QA-9/review-phase2.md` | Only the provenance header and a final newline differ |
| 24 | `rtk proxy node --test scripts/quality/coverage-ratchet.test.mjs scripts/quality/exact-coverage-reporter.test.mjs` | `# tests 27`, `# pass 27`, `# fail 0` |
| 25 | `rtk proxy pnpm check` | Exit 0; domain lines 533/583. Self-review then found that a wired JSON file whose content is `null` passed silently. The fix, two test cases and G7 followed |
| 26 | G7: `rtk proxy node --test scripts/quality/gate-wiring.test.mjs` | `# pass 6`, `# fail 2` (tests 3 and 5); restored; a Grep for every G mutation text found nothing |
| 27 | **Final:** `rtk proxy node --test scripts/quality/coverage-ratchet.test.mjs scripts/quality/exact-coverage-reporter.test.mjs` | `# tests 27`, `# pass 27`, `# fail 0` |
| 28 | **Final:** `rtk proxy pnpm check` | **Exit 0.** The root guard is verified, with the `not anchored` note. Then: typecheck and lint pass; domain `ℹ pass 37`, with `Exact lines coverage 535/583 (91.7667%) meets the threshold of 91.42%`, `Exact branches coverage 272/313 (86.9010%) meets the threshold of 86.9%`, `Exact functions coverage 106/117 (90.5983%) meets the threshold of 90.59%` and `Coverage counts all 8 files that --test-coverage-include matches`; quality `# pass 35`; mobile `Tests: 126 passed`, `Statements : 12.23% ( 254/2076 )`; plan `# pass 22`; `plan.json and board.html match GOALS.md`. **220 tests** |

Run 28 came after every code edit and every edit to a file the tests read, so its test 2 read the final `coverage-baseline.md`. After it, only prose changed: the run-28 figures and the G7 rows in this file and in `ratchet-enforcement.md`. No script reads either file, or docs/23 (a Grep of `scripts/` for `23-MASTER` found nothing).

## Done-when boxes

| Box (verbatim) | State | Evidence or what is missing |
|---|---|---|
| `apps/mobile/jest.config.cjs` collects coverage from all of `src/` with thresholds at the measured values, and `pnpm check` fails when one is lowered (seen once) | **Met locally, uncommitted.** The phase-2G review re-ran it independently (264 tests). *(3C)* The final review re-ran phases 3 and 3B independently (281 tests) and ran ratchet tests 4, 11, 13 and 14, the lowering tests. *(3D)* The review of phase 3C re-ran it independently (282 tests), measured 12.23 / 10.57 / 10.23 / 18.67, and found ratchet tests 4 and 11–14 passing. No box is accepted | `jest.config.cjs:9` reads `coverage-thresholds.json` (all of `src/`). Thresholds 12.23 / 10.57 / 10.23 / 18.67, as measured in phase 1, unchanged. M1 (phase 2) is the lowering run. M14/M15 show that scope can no longer be narrowed through Jest options. Since 2C neither a `null` thresholds file with a tolerant config (ratchet tests 21 and 23) nor a suppression comment in `src/` (ratchet test 24) can narrow it unseen. Since 2D neither can an include pattern outside `src/` (ratchet tests 26 and 27), nor any Babel configuration in `apps/mobile` (transform-config tests 1–6, ratchet test 30). Since 2E neither can a `.watchmanconfig` (gate-wiring tests 3 and 9). Since 2F a directory named like a Babel config is shown refused too (transform-config test 3). Since 2G neither can renaming a `src/` file to JavaScript, which would drop it from the count (type-suppression test 10, ratchet test 31). Phase 2F run 26, phase 2G run 28 and phase 3 run 73: `Statements : 12.23% ( 254/2076 )`. Phase 3 changed no threshold, floor or scope. *(3B)* Neither did phase 3B: runs 25 and 29 give the same four figures. `prettierPath: null` changes neither scope nor thresholds, and the guard now requires it (ratchet 9 and 32). *(3C)* The final review's run and phase 3C's run 15 give the same four figures; phase 3C changed no scope or threshold |
| Domain coverage is measured with a threshold, and the backend inventory lists every exposed RPC with its test | **Met locally, uncommitted.** No box is accepted | Domain 91.42 / 86.90 / 90.59 are enforced exactly in integers, and every included file must be loaded (phase 2E run 27 and phase 2F run 26: 536/583; phase 2G run 28: 537/583; phase 3 runs 44, 65, 69 and 73: 536, 534, 536 and 536; phase 3B runs 25 and 29: 536; the final review: 535; phase 3C runs 15 and 19: 536 and **533**, the latter exactly the threshold (R3); *(3D)* the review of phase 3C: **533** again; each 272/313, 106/117, all 8 files). *(3D)* The review of phase 3C checked the inventory against the migrations itself: exactly 9 `public` functions, the 9 listed. Since 2C a `node:coverage`, c8 or V8 comment in `packages/domain/src` fails too. Since 2D a test names the reviewed loader flags, and six loader changes fail (ratchet test 29). The [RPC inventory](../../../evidence/QA-9/rpc-test-inventory.md) is unchanged; the phase-2 review confirmed its 9 RPCs and stated gaps |
| CI fails on a lint error (seen once, run linked), and the ratchet rule is in docs/23 §9 | **Not met** | The rule is in docs/23 §9 rule 3, updated in 2B, 2C, 2D, 2E and 2F. `pnpm check` fails on a lint error locally (M12), and lint is pinned into root `check` and CI's `pnpm check` step. Since 2D the ESLint config is pinned, other config sources fail, and an undescribed `eslint-disable` fails `pnpm check`; since 2E so does a rule list ESLint reads as empty, and since 2F a blanket disable hidden by U+2028 or U+2029 (lint-scope tests 1–9). **No hosted run is linked.** Proving one needs a draft pull request with a deliberate ESLint-only error (§7's corrected plan), and the push and pull request still need ~~Codex's specific authorisation~~ **the owner's specific approval** under docs/23 §6 *(corrected in 3D, phase-3C review finding 1; AUTH-01 and existing approvals don't cover publication)*. No hosted run is claimed. *(3)* Root `check` now runs the format step before lint. Thanks to the rule start, the draft is asked to format only files touched from the commit adding the rule onward, not the 164 earlier ones between `origin/main` and local `main`, so it can still fail at ESLint as planned (touched-format 9). *(3C)* Touched-format 17 tests that start in the shape a pull request is checked out in, a detached merge with the baseline as first parent. §7's checklist now requires the format label in the log before the run is linked |

The card's scope also says **"Prettier on touched files only." Built in phase 3**, with its exact devDependency and lockfile change, as its own bounded phase. It is not a box. ~~It is not reviewed yet.~~ *(3C: the executed final review reviewed phases 3 and 3B and found no critical, high or medium finding; phase 3C resolved its three lows.)* Its hosted run is part of R10, and its committed-state run is ~~Codex's step~~ *(3D)* phase 3D's ("Resume here", steps 1–3).

## Remaining phases

1. **An executing review of phases 3 and 3B, then the commit (Codex).** *(3C: the executed final review is done, and its three lows are resolved in 3C. Next comes Codex's staging and committed-boundary check, then the commit; see "Resume here".)* *(3D: the executed review of phase 3C is done and accepted. Phase 3D makes the scoped stage, the checks and the one local commit; see "Phase 3D".)* Commit with QA-9 in the subject, for example `test(QA-9): coverage ratchet, gate wiring, exact domain thresholds and Prettier on touched files`. The floor stays unanchored until integration. The format rule starts at that commit. *(3B)* Then rebase onto `main` rather than merging it in (R18(h)), and run `pnpm check` once to see the label name the QA-9 commit.
2. **Integration into `main`.** The verifier runs the floor-versus-§5 comparison from "Resume here", step 4. After integration, `main` and the CI baseline hold every value, and guard test 2 relaxes to "never below §5". From then on, every goal's `pnpm check` formats-checks the JavaScript and TypeScript files it touches.
3. ~~**Next bounded QA-9 phase: Prettier.**~~ **Done in phase 3**, with one change from this plan. A Prettier config elsewhere is not refused, because the check reads none; it uses Prettier's API with pinned options instead (evidence §10).
   - Still open from it: the R3 per-line flip list, if the lcov measurement command is allowed.
4. **Hosted CI negative run (box 3), as a draft pull request** ([§7, "Box 3"](../../../evidence/QA-9/ratchet-enforcement.md#7-phase-2e-phase-2d-review-findings-and-r14)).
   - With ~~Codex's specific authorisation~~ **the owner's specific approval** under docs/23 §6 *(corrected in 3D, phase-3C review finding 1: neither AUTH-01 nor any existing approval covers publication)* for the push and the pull request: push a throwaway branch holding the QA-9 commit plus one ESLint-only error (M12's `const unusedLintProbe = 1;` in `apps/mobile/jest.config.cjs`~~, or a hex colour in a `src/features/` screen~~), and open it as a **draft pull request** against `main`. *(Struck in phase 3B, phase-3 review finding 4: the format step runs before ESLint and would judge the whole screen. 33 `src/features/` `.tsx` files have lines over 100 characters (460 lines, confirmed by a Grep). The probe adds one line to `jest.config.cjs`, which must keep `prettierPath: null`.)* A bare push starts nothing: the workflow runs on pull requests, and on pushes only to `main` and `v2/develop`, and a new branch's all-zero `before` fails the baseline step.
   - Confirm in the log that the baseline step, the guard, *(3)* the format step (its summary should read `Base: FITLOG_CONTRACT_BASELINE@…, from <the QA-9 commit>, which adds scripts/quality/touched-format.mjs`; *(3C)* with 18 files, when the draft holds only the QA-9 commit and the probe) and typecheck pass, and that the job fails at ESLint. Link the run, close the pull request and delete the branch. It could be shared with PL-1 box 2.
   - It will also be the first hosted and first Linux run of the ratchet's CI mode, the workflow checks, the reporter's file listing, the scans, `--no-watchman` and *(3)* the format check (R10).

## Residual risks (owners named)

Detail is in [ratchet-enforcement.md §3](../../../evidence/QA-9/ratchet-enforcement.md#3-residual-risks-open-after-phase-3b).

| # | Risk | Owner |
|---|---|---|
| R1 | Until the ratchet is on `main`, a branch commit can lower the floor and a threshold together. Guard test 2 now holds the floor to §5, but a diff could edit both | QA-9 verifier and integrator: compare at the exact merge commit. Closes at integration |
| R2 | One change removing all three guard copies at once. *(3K)* PL-1's planned required `ci-guard` workflow, its H1 fix, is that separate CI step for a **single** disabling change. It doesn't claim to stop a coordinated edit of every guard, so R2 stays open for that case | PL-1 (the `ci-guard` workflow, required alongside `check` and `backend`); review meanwhile |
| R3 | Domain lines sit at the lowest of 35 runs (533/583; Codex's independent phase-2D run was 533 again, phase 2E's and 2F's 536, phase 2G's 537, the phase-2G review's 537, phase 3's 536, 534, 536 and 536, *(3C)* phase 3B's 536 and 536, the final review's 535, phase 3C's 536 and **533**: its final run 19 sat exactly on the threshold), with no margin; which lines flip is unknown; no Linux sample. *(3D)* The review of phase 3C gave 533 again, the 36th run. Existing artifacts hold per-line data for phase 1's five runs only, and show at least two upward flips beyond the three known lines (ratchet-enforcement.md §13) | QA-9 next phase (lcov flip list; *(3D)* assigned by Codex's phase-3D brief, with no threshold lowered); QA-10 (flip-aware raises); PL-1 (first Linux run) |
| R4 | The reporter depends on Node's coverage event fields, and fails closed if they change | Whoever bumps `.node-version` |
| R5 | The guard's own code is not ratcheted | Review (docs/23 §9 rule 3) |
| R6 | Workflow, pnpm and dependency trust: code in the change runs inside `pnpm check` and CI, and the text checks cover named bypasses only. *(2E)* Includes a force-added `apps/mobile/node_modules` path, which Jest, jest-expo and `eslint.config.js` resolve before the hoisted copy while the inventory skips it, and `.npmrc` and `pnpm-workspace.yaml` | **PL-1:** a read-only check that Git tracks no `node_modules` path, and protection for `.npmrc`, `pnpm-workspace.yaml`, workflows, `scripts/quality/` and the `package.json` files |
| R8 | **Closed in 2D within `apps/mobile`.** The ESLint config is pinned, other sources are refused, and disables must be described. Outside it: the installed `eslint-config-expo` and plugins (R6), and `ESLINT_FLAGS`/`ESLINT_USE_FLAT_CONFIG` outside CI's pinned job env. The domain is not linted by ESLint; that is the gate as built. *(2F)* The U+2028/U+2029 bypass the phase-2E review found is fixed. The disable scan still reads text, not a parse | S7 Quality owns the pin; a goal changing `eslint.config.js` updates it in the same diff |
| R9 | No post-Jest comparison of counted files with files on disk; it would also catch a config that behaves differently under Jest than under the guard, and untested files Babel fails to transform for reasons in the source. Not built and not claimed closed | **QA-10**, as Codex assigned it in the phase-2E brief |
| R10 | Nothing proven on hosted CI or Linux, including the source scan, the 2D inventory, the 2E TypeScript scan and *(3)* the format check with its rule start against a real event base. *(3C)* The pull-request merge shape is now tested locally (touched-format 17), but never on GitHub | PL-1 / QA-9 box 3 (draft pull request; needs ~~specific push and pull-request authorisation~~ *(3D)* the owner's specific approval for the push and pull request, under docs/23 §6; AUTH-01 doesn't cover publication) |
| R11 | **Closed in 2D within `apps/mobile`.** Every Babel config file and key, and any nested `package.json`, is refused; the domain loader flags are held by the template. Outside it: what the installed presets do (`babel-preset-expo`, tsx and esbuild), environment variables outside CI's pinned job env, and tsconfig options beyond scope and strictness | Review; R6 (PL-1) |
| R12 | *(2C)* The scan knows the documented comment forms of Istanbul, c8, V8 and Node. Whether `node:coverage` takes effect through tsx was not verified (rejected either way); a new tool or syntax needs a new pattern | Whoever adds a coverage tool or bumps Jest, Istanbul or Node |
| R13 | *(2D, from the 2C review)* Code out of the count by its name alone: production code under `src/**/__tests__/`, a domain `*.test.ts` in a subfolder (neither counted nor run), or a `node_modules` folder in `src/` (Jest's default ignore pattern). None exist today | **QA-10** |
| R14 | *(2D)* `@ts-ignore`, `@ts-nocheck` and `@ts-expect-error` were not refused. **Closed in 2E** for every TypeScript file of `apps/mobile` and `packages/domain`. *(2F)* The Kelvin-sign `@ts-nocheck` the phase-2E review found is fixed with Unicode case folding, checked against TypeScript. *(2G)* So is the UTF-16 file the phase-2F review found: a TypeScript file starting with `FF FE` or `FE FF` fails before decoding. Outside it: TypeScript files outside both packages that an import could reach (none today) and a force-added top-level `node_modules` path (R6) | S7 Quality (the scan) |
| R15 | *(2D)* The config inventory walks generated folders too (`dist/`, `coverage/`, `.expo/`); a tool writing a config name, `package.json` or link there fails the guard locally. *(2E)* The TypeScript scan reads them too and fails on a link there, for example `ios/Pods/Headers` after `expo run:ios`. A fail-closed trade-off, found acceptable by the phase-2D review | Review; Codex may choose otherwise |
| R16 | *(2E)* `skipLibCheck` is `true` for both packages, so TypeScript never checks a declaration file; a `.d.ts` in source could loosen types without any comment. **Closed narrowly in 2F:** a declaration file under `apps/mobile/src/` or `packages/domain/src/` fails. **Remainder, open, low, accepted:** declaration files elsewhere in the two packages, such as a generated `expo-env.d.ts`, `.expo/types`, or a hand-written one outside `src/`. They are read for comments but not refused. None exists today. *(2G)* Within `src/`, a line break in the name no longer gets a declaration file past the refusal (phase-2F review, finding 1) | **S7 Quality, under QA-9** (named owner of the remainder): review a declaration file added outside `src/`; widening the refusal needs a reviewed change to `type-suppression.mjs`. Not QA-10, whose card is the 80% target |
| R17 | *(2G, phase-2F review finding 3)* JavaScript in source left strict types, the coverage count and the design-token lint, because mobile has `allowJs` without `checkJs` and both counts take only TypeScript files. **Closed in 2G** for `apps/mobile/src/` and `packages/domain/src/`: every `.js`, `.jsx`, `.mjs` and `.cjs` there fails. **Remainder, open, low:** JavaScript elsewhere in either package (configs, `scripts/`) is neither read nor refused, and an import from `src/` could reach it. Today a Grep of both `src/` trees finds no import of a JavaScript path. ~~No relative import leaves `src/`; the only exceptions are two domain tests that read JSON files by URL.~~ *(Corrected in phase 3, phase-2G review finding 1.)* No relative path in `apps/mobile/src` leaves it. Every relative path that leaves `packages/domain/src` is a URL: `fixtures.test.ts:11` and `contract.test.ts:86` read JSON files, `cli/snapshot-contract.ts:13` names the `contracts/` folder, and `contract.test.ts:87` runs `import()` on `../${entry}`, with `entry` taken from `exports['.']` in `packages/domain/package.json`. Today that is `./src/index.ts`, so the import resolves back into `src/`. That `exports` value is not pinned, and mobile resolves `@fitlog/domain` through it (also R6) | **PL-1, CI wiring only**, as Codex assigned it. *(Corrected in phase 3: this cell read "S7 Quality, under QA-9".)* |
| R18 | *(3)* What the touched-file format check does not cover:<br>(a) locally, untracked files until added; CI checks every committed file;<br>(b) locally, `assume-unchanged` or `skip-worktree` files as Git reports them;<br>(c) `prettier-ignore` comments, honoured as Prettier honours them;<br>(d) a reviewed rename of `touched-format.mjs`, which restarts the rule at the rename. *(3B: false in phase 3, where a hand-written `RULE` left behind by a rename made later CI runs check nothing; true since `RULE` is derived and a lost start fails closed, touched-format 13–16)*;<br>(e) `apps/mobile/eslint.config.js`, unformatted and pinned as text, which a goal changing it must format and re-pin in one diff;<br>(f) the first goal to touch an old file reformats all of it;<br>(g) CRLF work trees fail locally, under Prettier's `lf` default;<br>*(3B, phase-3 review finding 3)* (h) before `main` holds the rule, merging `main` into the branch after the rule commit makes files changed only on `main` count as touched. It fails safe, and it ends once `main` holds the rule. Rebase, do not merge;<br>*(3B)* (i) locally, while a rename of the check is uncommitted, only uncommitted edits count, as before the first commit; CI never sees that state | S7 Quality (the check and its pins); each goal (its own touched files); review ((c), (d)); the QA-9 integrator ((h): rebase onto `main`) |
| R19 | *(3D, after the commit; uncommitted)* **Domain branch coverage depends on Git state.** The `seen.has(base)` branch of `gitBaselines` (`packages/domain/src/cli/snapshot-contract.ts:151`) is covered only while `HEAD`'s fork point with `main` is `HEAD` itself. Every recorded run in this worktree until the commit had that, since nothing was committed, so 272/313 = 86.90 held. At `4a7ee21` it is 271/313 (86.58%), and **`pnpm check` fails**. Inferred: every branch ahead of `main` fails the same way, and so, probably, does a CI pull-request run. **High, blocks integration**; fails safe | **Codex decides.** The test change is in `packages/domain/` (S8 Member backend, docs/23 §5); QA-9 asks for it. 86.90 is not lowered |

R7 (domain files no test loads) is resolved. The phase-2B review's finding 1 (JSON `null` inputs) is resolved in 2C, and its finding 2 is resolved apart from R11, closed in 2D within `apps/mobile`, and R12. The phase-2C review's four findings are resolved in 2D. The phase-2D review's findings 1 and 2 are fixed in 2E, finding 3 is corrected and named under R6, and finding 4's plan is corrected (the run itself stays open). R14 is closed in 2E. The phase-2E review's findings 1 and 2 are fixed in 2F, and R16 is closed narrowly in 2F, with its remainder named above. The phase-2F review's three findings are fixed in 2G, and R17 is closed in 2G within both `src/` folders, with its remainder named above. The phase-2G review's one finding is corrected in 3 (R17's owner is PL-1, CI wiring only, and its sentence is rewritten). R18 is new in 3. The phase-3 review's finding 1 is fixed in 3B, which also makes R18(d) true. Its finding 2 is fixed as Codex chose, finding 3 is R18(h), and finding 4's records are corrected. R18(i) is new in 3B. The final review of phases 3 and 3B found no critical, high or medium finding, and its three lows are resolved in 3C: the handoff's gate rows (finding 1), touched-format 17 (finding 2) and §7's format label (finding 3). Phase 3C adds no new residual. *(3D)* The phase-3C review found no critical or high finding. Its finding 1, the box-3 approver, is corrected in 3D's records. Its finding 2, R3, is assigned to QA-9's next phase. Phase 3D adds no new residual.

## Decisions for Codex

*(3D, phase-3C review finding 1.)* The box-3 push and draft pull request are **not Codex's to authorise**. Under docs/23 §6 they need the owner's specific approval, and AUTH-01 delegates routine technical choices and final technical sign-off, not publication. Each earlier list's "Authorise, or not, the box-3 draft pull request" is tagged below. Codex's part is to route the request to the owner.

**Phase 3D (choices made here under the brief, each reversible in a reviewed diff):**
1. **Note the records correction.** The approver is the owner wherever the mutable records give live guidance. Historical lists are struck or tagged, and the verbatim finals are unchanged (ratchet-enforcement.md §13).
2. **Note the R3 count correction.** The review counts 6 runs at 533, and the records list at least 8. Phase 2B's "at least one more line flips" understates it: 538 needs at least two. `coverage-baseline.md` is left unchanged, because guard test 2 reads it. The corrected statement is in §13.
3. **Route box 3 to the owner**, if Codex wants the hosted run: a push of a throwaway branch and a draft pull request, as in §7. It is the owner's decision.
4. **Schedule the rebase onto local `main`**, then the deferred gates before integration ("Resume here", steps 4 and 5).
5. **Give QA-9's next phase R3's flip list** ("Resume here", step 6).
6. *(After the commit, uncommitted.)* **Decide R19 before anything else.** At `4a7ee21`, `pnpm check` fails at domain branches, 271/313 against 86.90. A fix that lowers nothing is a domain test that covers `gitBaselines`' same-fork-point branch in any Git state, for example through its injected `git` parameter. That test lives in `packages/domain/`, S8 Member backend's lane, so QA-9 asks for it in its handoff. Lowering 86.90 is excluded. Then re-measure in three states: `HEAD` = `main`, a branch ahead of `main`, and CI mode.
7. *(After the commit.)* **Commit the post-commit records, or not.** `checkpoint.md`, `handoff.md` and `ratchet-enforcement.md` are modified after `4a7ee21`, and `phase-3d-check-outputs.md` is new. None of them is staged.

**Phase 3C (open; choices made here under the brief, each reversible in a reviewed diff):**
1. **Accept phase 3C:** touched-format test 17, the corrected gate rows in the handoff, and §7's format label.
2. **Accept test 17's fixture as "the 18-file kind, as suits the fixture".** Its adopting commit has nine JavaScript and TypeScript files: the check, the seven modules it imports, copied from this repository, and `jest.config.cjs`. It also has three files that are not checked. Copying all 17 real scripts would tie the test to every quality file's formatting, with no added coverage of the rule start. The real 18 stay for your committed-boundary check.
3. **Stage and check the committed boundary** ("Resume here", step 1). This session did not stage.
4. **Run `pnpm backend:test` and the iOS and Android export before integration** ("Resume here", step 5). They are required by docs/23 §7 for this diff, deferred by your brief, and not waived.
5. ~~**Authorise, or not, the box-3 draft pull request.**~~ *(3D: not Codex's to authorise. It is the owner's specific approval under docs/23 §6, and AUTH-01 doesn't cover publication; see the note above.)* Existing approvals do not permit a push. Nothing external was done.

**Phase 3B (open; choices made here under the brief, each reversible in a reviewed diff; *(3C)* item 6 is done: the executed final review ran 96 quality tests and `pnpm check` with 281 tests):**
1. **Accept phase 3B:** the derived `RULE`, `holdsRule` and `refuseLostStart`; touched-format tests 13–16 and the `installCommand` helper; `prettierPath: null` in `jest.config.cjs` and `JEST_PINNED`; ratchet test 9's three cases and test 32.
2. **Accept "derive and assert" for `RULE`.** The brief offered either. 3B does both: `RULE` is derived from `import.meta.url`, and touched-format 13 asserts that it is this module's path and the one root `check` runs. Test 14 runs the review's rename scenario end to end.
3. **Accept the local fallback's one remaining use.** Locally, with no commit adding `RULE` and a `HEAD` that does not hold it, only uncommitted edits count. That is the repository's state today, before the commit, and it is labelled. Every other way of finding no start throws, and CI always throws.
4. **Accept `prettierPath` as required, not just allowed.** The guard pins it like `preset` and `testMatch`, so removing it fails too. A lighter choice was to accept it only when present, which would let a later diff silently bring back the Prettier-3 refusal. It changes no coverage scope or threshold.
5. **Note R18(h) for integration:** rebase onto `main`, do not merge it in, until `main` holds the rule.
6. **Get an executing review.** Phases 3 and 3B have run only in this worktree's writer sessions. A review that runs the 96 quality tests and `pnpm check` on Node 22.23.1 would be the first independent run of either.
7. ~~**Authorise, or not, the box-3 draft pull request**~~ *(3D: the owner's decision, not Codex's; docs/23 §6)* (§7's plan, now with only the `jest.config.cjs` probe). Nothing external was done.

**Phase 3 (open; delegated choices made here, each reversible in a reviewed diff):**
1. **Accept phase 3:**
   - `touched-format.mjs` and its 12 tests;
   - the root `check` step and its gate-wiring pin, and the `QUALITY_FILES` entry;
   - `inCI` exported from the guard;
   - `prettier` 3.6.2 as the exact root devDependency, with its 10 lockfile lines and nothing else.
2. **Accept the selection.**
   - It covers tracked files only, as briefed: locally an untracked file is checked once added.
   - A, M and T under `--no-renames`, so a rename is a touch.
   - The eight JavaScript and TypeScript extensions in any case, and no JSON, Markdown or YAML. Including those would have reformatted shared `package.json` files and docs/23, which other lanes own.
   - One generated file and `node_modules` as vendor.
   - Links, submodules, unmerged paths and unknown statuses fail.
3. **Accept the rule start**, found in this phase: the rule applies from the commit that adds `touched-format.mjs`. Without it, the first hosted run, against an `origin/main` 164 JavaScript and TypeScript files behind local `main`, would demand all of them before ESLint ran. Once `main` holds the rule, it changes nothing.
4. **Accept failing closed locally without `main`.** This differs from the ratchet, which only notes it. The developer sets `FITLOG_CONTRACT_BASELINE` instead.
5. **Accept the options and where they live.**
   - `printWidth: 100` and `singleQuote: true`, chosen to match the existing style; Prettier's defaults otherwise.
   - They are pinned in the script, and the root `.prettierrc.json` must equal them.
   - The check reads no Prettier config, ignore file or pragma, so a nested config is not refused: it can mislead an editor, never the check.
6. **Accept the reformatting of all 17 `scripts/quality/*.mjs`** (formatting only). `prettier --debug-check` reported every AST unchanged. The pre-format bytes were not hashed, because `git hash-object` was denied, so a reviewer holding a 2G-state copy compares by AST or by running the tests.
7. **Accept the adoption cost.** Once integrated, every goal formats every JavaScript or TypeScript file it touches, in full (R18(f)), and a goal changing `eslint.config.js` formats it and re-pins it (R18(e)). Prettier has no reliable line-range formatting for JavaScript, so touched files are the smallest unit.
8. **Choose on the phase-2G review's optional item** about the guard's success message, which still names only the three comments. It was left unchanged as outside this phase.
9. ~~**Authorise, or not, the box-3 draft pull request**~~ *(3D: the owner's decision, not Codex's; docs/23 §6)* (§7's plan). It now also runs the format step, which, thanks to the rule start, checks only QA-9's formatted files and the probe line. Nothing external was done.

**Phase 2G (Codex's phase-3 brief accepts its executed independent review; item 3's owner is corrected in phase 3, and item 5 is done):**
1. **Accept phase 2G**: the three fixes in `type-suppression.mjs`, the rename `DECLARATION_ROOTS` → `SOURCE_ROOTS`, and the added tests. `coverage-ratchet.mjs`, `gate-wiring.mjs`, `QUALITY_FILES` and every package file are unchanged, so no wiring pin moved.
2. **Accept the domain policy for finding 3.** The brief named `apps/mobile/src`, and asked whether domain source should follow. 2G applies the same refusal to `packages/domain/src`: it holds no JavaScript, its tsconfig and coverage take only `.ts`, and one shared `SOURCE_ROOTS` keeps R16 and R17 on the same two folders. Choose mobile-only if you prefer; that is a one-line change and a test edit.
3. **Accept R17's remainder.** JavaScript outside both `src/` folders is neither read nor refused, so the repository's legitimate configs and `scripts/test-design-rules.cjs` keep working. That remainder is **PL-1's, for CI wiring only**, as Codex assigned it. *(Corrected in phase 3, phase-2G review finding 1: this item read "S7 Quality's under QA-9".)*
4. **Accept the byte-path contract.** The TypeScript scan's reader must now return bytes, and anything else fails closed. Any future caller that injects a reader must return `readFileSync`-style bytes.
5. **Get an executing re-review.** The phase-2F review executed nothing, and 2G's results come only from this session. Before or with the Prettier phase, a review that runs the 79 quality tests and `pnpm check` on Node 22.23.1 would also be the first independent run of phases 2F and 2G. *(Done: the phase-2G review ran both, with 264 tests.)*
6. ~~**Authorise, or not, the box-3 draft pull request**~~ *(3D: the owner's decision, not Codex's; docs/23 §6)* as planned in §7. Nothing external was done.

**Phase 2F (open; its review's three lows are fixed in 2G):**
1. **Accept phase 2F**: the two fixes, the narrow R16 refusal and the added tests. Nothing in `coverage-ratchet.mjs`, `gate-wiring.mjs` or any package file changed, so no wiring pin moved.
2. **Accept Unicode case folding as the TypeScript scan's letter-case rule.** It covers every one-character spelling TypeScript reads as `ts-nocheck`, and adds one fail-safe extra match (U+017F, LONG S, for `s`). None exists today.
3. **Accept R16's narrow scope and its named remainder.** Declaration files are refused only under each package's `src/`, as your brief chose. Elsewhere in the packages (a generated `expo-env.d.ts`, `.expo/types`, any other folder) they are read for comments but not refused. That remainder is S7 Quality's under QA-9. Choose otherwise if you want it widened, for example to every declaration file outside generated folders.
4. **Note how "scratch-only mutations" was applied.** A scratch copy of `scripts/quality/` could not be run (the `/tmp` path was denied). So the guard-code mutations F1–F14 were edits to `scripts/quality/` modules, each restored, as in 2B–2E. Every bypass input stayed in OS-temp fixtures and never reached the repository. If you meant the code mutations too, allow a scratch path and they can be repeated there.
5. ~~**Authorise, or not, the box-3 draft pull request**~~ *(3D: the owner's decision, not Codex's; docs/23 §6)* as planned in §7. Nothing external was done.

**Phase 2E (routine policy choices accepted by Codex in its phase-2F brief, subject to the 2F fixes):** items 1–4 are covered by that acceptance. Item 5 is done in 2F, and item 6 is carried forward as 2F item 5.
1. **Accept phase 2E**, including the new `type-suppression.mjs` and its `QUALITY_FILES` entry, and the one-script mobile `package.json` change. A future rename or move must update the guard's import and that list in the same reviewed diff.
2. **Accept the R14 rule as built.** It reads every TypeScript file of both packages, strings and prose included, in any letter case, so a string or comment mentioning `@ts-ignore` must be reworded. The `@ts-expect-error` reason rule is mechanical: at least three different words of two or more letters, on the same line and in the same comment, with TODO, FIXME, TBD, XXX and HACK not counted. It cannot judge whether a reason is good; review does. JavaScript is not read, because `checkJs` is off. Choose otherwise if you want a different word count, or JavaScript read too.
3. **Accept skipping only each package's top-level `node_modules`** in the TypeScript scan, so a `node_modules` folder inside `src/` is read. The config inventory still skips `node_modules` at any depth, as Babel and ESLint do; that difference is deliberate.
4. **Accept the new fail-safe false positives** of the lint scan: with overlapping starts, `/// eslint-disable-line …` is read as a disable, although ESLint reads that line comment's value as `/ eslint-disable-line …`. None exists today.
5. **Choose for the review's three low test gaps** (a directory named `.babelrc`, the lint-scope `package.json` cases, the `eslintConfig`/`eslintIgnore` mutations one by one): add them in the Prettier phase, or leave them. No rule depends on them. *(Settled: your phase-2F brief asked for them, and 2F added them.)*
6. ~~**Authorise, or not, the box-3 draft pull request**~~ *(3D: the owner's decision, not Codex's; docs/23 §6)* as planned in §7. Nothing external was done.

**Phase 2D (accepted by the phase-2D review; its four lows handled in 2E):**
1. **Accept phase 2D**, including the three new modules (`config-inventory.mjs`, `transform-config.mjs`, `lint-scope.mjs`) and their two `QUALITY_FILES` entries. A future rename or move must update the guard's imports and that list in the same reviewed diff. Gate-wiring test 8 now also fails on any unlisted quality test file.
2. **Accept the exact-text pin of `eslint.config.js`**, rather than a structural check of its options. It was chosen because the config is 24 lines, and a structural check would have to reason about files, ignores, plugins, parsers and processors and still could not see into a changed dependency. The cost: a goal that tightens lint, such as a new string rule under docs/23 §9 rule 4, must update the pin in `lint-scope.mjs` in the same diff. S7 Quality owns the pin. You may also want `apps/mobile/eslint.config.js` named in S7's row of docs/23 §5; this phase did not change §5.
3. **Accept the directive rules.** A disable must name its rules (no blanket disable, even with a reason) and give a reason. Inline rule configuration is refused outright. Every `//` and `/*` is read as a comment, strings included, so such a string must be reworded. Today: 131 files, none.
4. **Accept refusing every nested `package.json` under `apps/mobile`**, not only one with a `babel` key. A nested one moves Babel's package boundary, and one that is not an object makes Babel fail on every file under it, which drops untested files from Jest's count (§6 of the evidence).
5. **R15:** settled for now. Codex's phase-2D brief chose fail-closed inventorying of generated folders, and the phase-2D review found it acceptable.
6. **R14:** settled. Codex's phase-2E brief asked to close it now; phase 2E did.

**Phase 2C (design accepted by Codex in its phase-2D brief, subject to the exact-integration floor proof):**
1. **Accept the non-object rule.** The floor, thresholds file and domain `package.json` must be JSON objects in the working tree and at every baseline. One consequence: a branch that ever commits such a file as `null` fails at its `HEAD` baseline until a later commit fixes it, the same as an invalid-JSON file today (ratchet tests 15 and 25).
2. **Accept failing closed by stopping, for an unreadable file.** A working-tree input that exists but cannot be read stops the guard with one message naming it, rather than joining the problem list. This matches how a Git read failure already behaves (ratchet test 19). It shows only the first such file.
3. **Accept the text-match scan.** It matches the directive words anywhere in a file, including in strings, and has no escape hatch, so a string such as `"istanbul ignore"` in source must be reworded. Links and unreadable entries fail closed. Today: 141 files, no matches.
4. **Accept the new `coverage-suppression.mjs`** and its entry in `QUALITY_FILES`. A future rename or move must update the guard's import and that list in the same reviewed diff.

**Phase 2B (design accepted by Codex in its phase-2D brief, subject to the exact-integration floor proof):** items 1–3 below are covered by that acceptance; items 4–6 stay open.
1. Accept phase 2B, including the one-line root `check` change and the new `gate-wiring.mjs` pins. Every pin means a future change to those scripts, tsconfigs or the CI `check` job must update `gate-wiring.mjs` in the same reviewed diff. PL-1's planned workflow restructure is the first expected case.
2. Accept the integer and 2-decimal rule. No current threshold changes.
3. Accept the unloaded-file rule for the domain. A future type-only module must be imported by a test.
4. **Open: the commit and the integration**: who makes them, and who runs the merge-commit floor comparison.
5. **Open: the Prettier phase**: approve the exact-version devDependency and the lockfile change. R8 and R11 are done (2D) and R14 (2E); R9 is QA-10's.
6. **Open: push and pull-request authorisation** *(3D: the owner's specific approval, docs/23 §6, not Codex's)* for the hosted lint-failure run, as a draft pull request (2E plan), possibly shared with PL-1 box 2.

## Found for other goals

| For | Finding |
|---|---|
| **PL-1 (S1 Platform): workflow trust** | The guard now pins the shape of `mobile-ci.yml`'s `check` job. That covers the top-level and job keys, the job env names, the event-based `FITLOG_CONTRACT_BASELINE` line (exactly once) and the one-line `- run: pnpm check` step, with no `GITHUB_ENV` or `GITHUB_PATH` in the job. A restructure must update `scripts/quality/gate-wiring.mjs` in the same reviewed diff. These checks read text. They cannot vouch for an escaped YAML key, an earlier step that rewrites files, a changed action, a self-hosted runner, or pnpm settings (`.npmrc`, `pnpm-workspace.yaml`). The real protection belongs to PL-1: CODEOWNERS or required reviews on `.github/workflows/`, `scripts/quality/`, the `package.json` files and pnpm config, plus branch protection that requires the `check` job. This is the same trust issue as AR-1 L1/L4. The phase-1 findings also stand: `graphql_public` exposure, and the Docker container name hard-coded in `verify-freeze-projection.mjs:12` |
| **PL-1 (S1 Platform): H1, the skip-guard gap** *(3K, from Codex's brief; PL-1's to fix)* | **High.** A single change can skip or disable a required CI job or step, so its check passes without running the gate. The ways in are a job or step skip, `needs`, `continue-on-error`, the default shell, the event and a path filter. QA-9's text pins of `mobile-ci.yml` run inside the `check` job they protect, so they can't see that job being skipped *(inference by reading)*. **The in-lane fix is PL-1's:** a separate required `ci-guard` workflow, which cross-checks the workflows, fails closed, and catches a single disabling change, but not a coordinated edit of every guard (R2). **Future protection** needs all three required checks, `check`, `backend` and `ci-guard`, in branch protection and in the hosted proof. **QA-9 makes no root wiring change now.** This phase didn't open PL-1's files or review |
| **PL-1 (R6, phase 2E)** | From the phase-2D review's finding 3: Jest resolves `preset: 'jest-expo'`, jest-expo resolves `expo/internal/babel-preset`, and `eslint.config.js` requires `eslint-config-expo/flat`, each from `apps/mobile/node_modules` before the hoisted copy. A force-added path there can replace shared config while the guard skips `node_modules`. Wanted from PL-1: a read-only check that Git tracks no path with a `node_modules` segment, and `.npmrc` and `pnpm-workspace.yaml` on the protected list. The review did not verify whether CI's `pnpm install --frozen-lockfile` would remove such a path. Codex asked for no dependency-trust code in QA-9 |
| **QA-10 (R9, phase 2E)** | Codex assigned R9 to QA-10: compare the files Jest counted (`coverage-summary.json`) with the files on disk after the Jest run. It would also catch a config that behaves differently under Jest than under the guard, and untested files Babel fails to transform for reasons in the source. Not built, not claimed closed |
| **PL-1, CI wiring only** (R17, phase 2G; owner corrected in phase 3, phase-2G review finding 1, from "S7 Quality, under QA-9") | JavaScript under either `src/` is refused since 2G. The remainder is PL-1's, for CI wiring only, as Codex assigned it: a JavaScript file elsewhere in the packages that source imports, including through the unpinned `exports` of `packages/domain/package.json` (today `./src/index.ts`). None is imported today. Not QA-10's R13, because the refusal, not a rename check, closes the `src/` route |
| S7 Quality, under QA-9 (R16, phases 2E and 2F) | `skipLibCheck` is `true` for both packages, so a declaration file is never type-checked and could loosen types without a comment. **2F refuses one under either package's `src/`.** The remainder is S7 Quality's: one elsewhere in the packages, such as a generated `expo-env.d.ts` or a hand-written file outside `src/`, which is read for comments but not refused. None exists today |
| QA-10 | When raising domain thresholds, use a flip-aware minimum, not a single run (R3). Mobile platform files (`.native`/`.web`) still need per-platform Jest projects. Adding projects means changing the Jest allowlist in `coverage-ratchet.mjs` in a reviewed diff. **(2D) Code out of the count by its name (R13):** production code under `src/**/__tests__/` is excluded from mobile coverage. A domain module named `*.test.ts` in a subfolder of `src/` is excluded from domain coverage and never run as a test, since only `src/*.test.ts` runs. A folder named `node_modules` inside `src/` is left out by Jest's default `coveragePathIgnorePatterns`. A check that no non-test module sits under a test name or such a folder would close it. (R14 is closed in 2E and no longer QA-10's) |
| Any goal that changes `apps/mobile/eslint.config.js` (likely S3 Design or S4 Member app, for rule 4's token and string rules) | Since 2D the config is pinned as text in `scripts/quality/lint-scope.mjs`. The same diff must update `REVIEWED_ESLINT_CONFIG` there, with a reason and the approval docs/23 §9 rule 3 asks for. No other ESLint config file may be added anywhere in `apps/mobile`. *(3)* The file is not in Prettier's format, so touching it also means formatting all of it (`pnpm exec prettier --write apps/mobile/eslint.config.js`) and pinning the formatted text |
| **Every goal that touches JavaScript or TypeScript after QA-9 is integrated** (all lanes, the integrator's rebase included) | *(3)* `pnpm check` fails on any tracked `.js`, `.jsx`, `.mjs`, `.cjs`, `.ts`, `.tsx`, `.mts` or `.cts` file the goal adds, modifies or renames, unless the whole file is in Prettier 3.6.2's format with the root `.prettierrc.json`. Fix it with `pnpm exec prettier --write <path>`. Files the goal does not touch are never checked. The generated `database.types.ts` is exempt, and regenerating it stays the rule. Branches still in flight will meet this on their first `pnpm check` after rebasing onto `main` |
| PL-1 (S1 Platform), first hosted runs | *(3)* `origin/main` is 164 JavaScript and TypeScript files behind local `main` (run 70). The format check starts at the commit that adds it, so the first push of `main`, or the box-3 draft pull request, is not asked to format those 164. If the check is ever renamed or moved, the rule restarts at that commit (R18(d)). *(3B)* That now holds by construction, and a CI run that cannot find the start fails instead of checking nothing. Workflow protection of `scripts/quality/` stays PL-1's (R6) |
| **The QA-9 integrator** (goal-integrator or Codex) | *(3B, R18(h))* Rebase the QA-9 branch onto `main`; do not merge `main` into it. Until `main` holds the format rule, a merge after the rule commit makes files changed only on `main` count as touched. It fails safe, but it demands formatting nobody owes. *(3C, final review finding 1)* Before integration, also run the two gates docs/23 §7 requires for this diff, which no QA-9 phase has run: `pnpm backend:test` (the diff touches `packages/domain/`) and the native export for iOS and Android (it touches `apps/mobile/`). They are deferred, not waived |
| **Any goal that adds an inline snapshot** (`toMatchInlineSnapshot`) | *(3B)* `jest.config.cjs` pins `prettierPath: null`, as the guard requires, so Jest 29 writes the snapshot with Babel's layout and no Prettier. The test file is then touched, so format it with `pnpm exec prettier --write <path>` before `pnpm check` |
| Any goal that needs a Babel config in `apps/mobile` (for example a Babel plugin) | Since 2D every Babel config file and key there fails `pnpm check`. It needs a reviewed change to `scripts/quality/transform-config.mjs` first, which should then pin the new config's exact content |
| PL-1 (R6) | **(2D)** Not checked: whether pnpm passes an `.npmrc` `node-options` entry to scripts as `NODE_OPTIONS`, which would load code ahead of every gate. pnpm's install could not be found from this session. Also environment variables that change transforms or lint (`ESLINT_FLAGS`, `ESLINT_USE_FLAT_CONFIG`, `BABEL_ENV`, `TSX_TSCONFIG_PATH`). CI's job env allowlist refuses them there; locally they belong to the developer |
| Whoever owns the tsx pin (shared `package.json`) | Every domain test file prints `DeprecationWarning: module.register() is deprecated` (DEP0205) from tsx under this Node. It is informational and fails nothing |
| MB-1, MB-2, MB-3, MB-4, MB-5, MB-6, G16.api, G17.api | Unchanged from phase 1; the RPC and test gaps stay named in docs/23 §9 rule 3 |

## Phase 2 record (historical)

- **Commands.** Two commands were denied in dontAsk mode and not retried: `rtk proxy node --test scripts/quality/coverage-ratchet.test.mjs`, and a redirected `pnpm check`. Mutation runs used `rtk proxy pnpm check 2>&1 | grep -E … | head`.
- **Runs.**
  - The first `pnpm check` failed on a real guard bug, the floor's own exclusion flagged before the first commit; it was fixed.
  - M3's first run showed the guard tests depended on the live thresholds, so they were pinned to the floor.
  - M4 found Node's flag truncation, which led to the exact reporter.
  - The final phase-2 `pnpm check` exited 0 with 206 tests.
- **Mutations M1–M13**, each restored, are in [ratchet-enforcement.md §2](../../../evidence/QA-9/ratchet-enforcement.md#2-phase-2-mutation-checks-historical-each-restored-pnpm-check-after-each). M13 passed then; phase 2B's M16 repeats it and now fails.
- **Corrected in 2B:** phase 2 claimed "the first commit closes R1". It does not. Integration into `main` does (review finding 2).

## Phase 1 record (historical)

- **Measured** (all `rtk proxy`, 26 October 2026):
  - mobile 126/126 tests at 12.23 / 10.57 / 10.23 / 18.67 %, deterministic over 2 runs;
  - domain 37/37 tests at branches 86.90 % and functions 90.60 % (5 of 5 runs), lines 91.42–91.94 %;
  - `pnpm check` exit 0 with 185 tests.
- **Inventory:** 9 exposed RPCs at the 15-migration head.
- **Records:** [coverage-baseline.md](../../../evidence/QA-9/coverage-baseline.md) and [rpc-test-inventory.md](../../../evidence/QA-9/rpc-test-inventory.md).
- **Phase-1 decisions, settled by Codex's phase-2 instruction:**
  - the thresholds as proposed;
  - the guard in `scripts/quality/`;
  - no per-directory thresholds;
  - Prettier deferred to its own phase;
  - no push.

## Not done, by instruction

- No commit, push, status, ACCEPTANCE or GOALS change.
- No CI, backend, migration, contract or snapshot change. No lockfile or dependency change until phase 3, which added exactly `prettier` 3.6.2, as authorised.
- The root `package.json` changes are the authorised `check` prepend (2B) and, in phase 3, the authorised format step and `prettier` devDependency.
- No test outside `scripts/quality/`.
- No database, Docker, Supabase, provider or test-user activity. No network either, apart from phase 3's authorised registry read and install.
- No sub-agents, other workers, auth switches, overage or launch scripts. In 2C that covers the Python launcher appended to the task message, which was not run, and the brief's sub-agent self-reviews, which the instruction forbade.
- Until phase 3, no Prettier work: no Prettier, dependency or lockfile change.
- In 2C: no threshold, floor, scope, Jest config, package script or production source change, and no suppression comment anywhere.
- In 2D: the same, plus no `eslint.config.js`, tsconfig, CI or contract change; no Babel or ESLint config file and no directive in the repository, even temporarily; no installs, network, database or external action; no commit, status or ledger change; no sub-agents, so no code-reviewer, security-reviewer or tdd-guide run (a self-review replaced them).
- In 2E: the same as 2D, apart from the authorised ` --no-watchman` on the mobile `test:ci`. No threshold, floor or scope change; no production or test source change outside `scripts/quality/`; no TypeScript suppression comment or `eslint-disable` in the repository, even temporarily; no dependency-trust code (finding 3 is a comment and R6); no Prettier, dependency or lockfile change; no push, pull request, network, provider, auth or overage action (finding 4 is a plan only); no commit, status, ledger, GOALS or `main` change; no sub-agents, so a self-review again replaced the code-reviewer, security-reviewer and tdd-guide runs. Codex's scratch directory `fitlog-qa9-directives-independent-0Rwm5l` was not read.
- In 2F the same as 2E, with no exception at all. Not a single `package.json`, CI, dependency, lockfile, contract, source or config change. No threshold, floor, Jest-scope or package-script change. No Kelvin-sign comment, Unicode-separator directive, declaration file, Babel-named directory or odd `package.json` in the repository, even temporarily. No Prettier work and no install. No push, pull request, network, provider, credential, auth or overage action. No database, Docker or Supabase call. No commit, status, ledger, GOALS or `main` change, and the goal is not marked Done. No sub-agents, so a self-review replaced the code-reviewer, security-reviewer and tdd-guide runs. Codex's scratch directory `fitlog-qa9-unicode-independent-WhSC1M` was not read.
- In 2G the same as 2F, with no exception. There was no change to dependencies, package files, the lockfile, CI, any tsconfig (`allowJs` and `checkJs` included), ESLint, Jest, the baseline, the floor or any threshold. Nothing was widened to make a test pass, and no assertion was weakened or removed. No line-break-named, UTF-16 or JavaScript file was put in the repository, even temporarily. There was no Prettier work and no install. There was no database, Docker, Supabase, network, provider, credential, auth-switch or overage action. There was no commit, push, pull request, status, GOALS, ACCEPTANCE or `main` change, no integration or hosted-CI claim, and the goal is not marked Done. No sub-agents ran, so a self-review replaced the code-reviewer, security-reviewer and tdd-guide runs. This was one bounded correction, and the session stops after it.
- In phase 3, only the authorised dependency work: one registry read (`pnpm view`) and one install (`pnpm add --save-exact prettier@3.6.2`), with no credentials and no paid API. No other dependency was added, upgraded or removed from the lockfile. Unchanged:
  - every threshold, the floor and the Jest scope;
  - every tsconfig, `eslint.config.js` and its pin, CI, `.npmrc` and `pnpm-workspace.yaml`;
  - contracts, SQL, backend, migrations and all app source;
  - status, GOALS and ACCEPTANCE.

  No file outside the QA-9-owned touched set was formatted. There was no database, Docker, Supabase, provider or test-user activity, and no commit, push, pull request, `main` change, integration or hosted-CI claim. The floor stays unanchored, and the goal is not marked Done. No sub-agents ran, so a self-review replaced the code-reviewer, security-reviewer and tdd-guide runs. This was one bounded phase, and the session stops after it.
- In phase 3B, only the authorised changes were made.
  - **Not changed:** any threshold, the floor, the Jest scope, any dependency, `package.json` file or the lockfile; any tsconfig, `eslint.config.js` or its pin; CI, `.npmrc` or `pnpm-workspace.yaml`; contracts, SQL, backend, migrations or app source; status, GOALS, ACCEPTANCE or the tracker.
  - **Not done:** no install and no network. No database, Docker, Supabase, provider, runner, replay-directory or test-user activity. No commit, branch change, push, pull request, CI run, `main` change or integration. No hosted-CI claim.
  - **No sub-agents:** a self-review replaced the code-reviewer, security-reviewer and tdd-guide runs.
  - **No workarounds:** the one denied command was recorded and not worked around.
  - **Launch script:** the Python launcher appended to the task message was not run.
  - The floor stays unanchored, and the goal is not marked Done. This was one bounded correction, and the session stops after it.
- In phase 3C, only test 17 and the records changed.
  - **Not changed:** any check code (apart from the reversed 3C-M1), threshold, floor, Jest scope, wiring or pin; any dependency, `package.json` file or the lockfile; any tsconfig, `eslint.config.js`, CI, `.npmrc` or `pnpm-workspace.yaml`; contracts, SQL, backend, migrations or app source; docs/23, status, GOALS, ACCEPTANCE or the tracker; the final review file.
  - **Not done:** no staging, index, commit, history or branch change. No push, pull request, CI run, `main` change or integration. No install, network or provider. No database, Docker, Supabase, runner, replay-directory or test-user activity. No `pnpm backend:test` and no export: both are required for this diff and deferred by the brief. No hosted-CI claim.
  - **No sub-agents:** a self-review replaced the code-reviewer, security-reviewer and tdd-guide runs.
  - **No workarounds:** the three denied commands were recorded and not worked around. The mutation was made with the Edit tool, as in every earlier phase, after `git apply --check` was denied.
  - The floor stays unanchored, and the goal is not marked Done. This was one bounded correction, and the session stops after it.
- In phase 3D, only the records changed, and Git changed only through the scoped stage and one local commit.
  - **Not changed:** any check code, test, threshold, floor, Jest scope, wiring or pin; any dependency, `package.json` file or the lockfile; any tsconfig, `eslint.config.js`, CI, `.npmrc` or `pnpm-workspace.yaml`; contracts, SQL, backend, migrations or app source; docs/23, status, GOALS, ACCEPTANCE or the tracker; the persisted finals.
  - **Not done:** no `-A` stage and no path beyond the eleven named. No rebase, merge, integration or `main` change. No push, pull request, publication, CI run, provider call, paid credential, overage or deploy. No install or export, and no network. No `pnpm backend:test`, which is required for this diff and deferred. No database, Docker, Supabase, runner, replay-directory or test-user activity. No hosted-CI claim. No test run made just for an R3 sample.
  - **No sub-agents:** a self-review replaced the code-reviewer, security-reviewer and tdd-guide runs.
  - **No workarounds:** denied commands are recorded under "Commands run in phase 3D" and were not worked around.
  - The floor stays unanchored, and the goal is not marked Done. This was one bounded phase, and the session stops after it.
- AR-1 L1 and L4 stay with PL-1.
