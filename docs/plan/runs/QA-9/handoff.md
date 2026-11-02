# Handoff — QA-9 · Lint, type and coverage gates that only go up        attempt 1 · `codex/qa9-quality-ratchets` · base `main@2a95726` (phase 3D: scoped stage and one local commit; results recorded after the commit. Phase 3E: R19 fixed by a domain test. Phase 3F: that review's record findings corrected, and the test committed locally. Phase 3G: phase 3F's whitespace stop resolved, and that commit made. Phase 3H: the 0305 review's lows fixed, the records committed, then a rebase onto local `main` and the local gates. Phase 3I: the 0405 review's lows fixed, the records committed, then the floor proof in a disposable clone with `HEAD` = `main`. Phase 3J: that floor proof resumed and run once, with no commit. Phase 3K: records only. The 0535 review's floor proof is accepted, its lows resolved and PL-1's H1 captured, with no commit. Phase 3L: `pnpm check` once in local CI mode against the exact `main` commit, with no commit. Phase 3M: records only. The 0705 review's independent audit of phase 3L is accepted, its four lows are fixed, and one records-only local commit is made. Phase 3N-prep: records and a `backend:test` readiness plan, with no gate and no commit)

> **Phase 3N-prep, records and backend readiness** *(uncommitted. No gate, test, export, commit or rebase. No Docker, Supabase, database, SQL or network command. No Done is claimed)*.
> - **The brief:** Codex's phase-3N-prep brief (27 October 2026, AUTH-01) **accepts the [0905 review](../../../evidence/QA-9/final-2026-10-27T0905Z-collected.md)** (acceptance (17)). That review is independent and read-only, of `8b29511` and the after-commit notes. It found no critical, high or medium finding. The 285-test local CI-mode proof stays inherited.
> - **Low 1, fixed:** both 0905 finals are named, with their hashes and the exact inventory, in the checkpoint's Git and Reviews rows and its file index:
>   - [final-2026-10-27T0905Z.md](../../../evidence/QA-9/final-2026-10-27T0905Z.md) is **phase 3M's implementer report**, saved in the 08:35 cycle under a 0905 name (mislabelled, per Codex), sha256 `fa75b065c58e65e82a4af5dc6518fd73e8040b85215b6d068ec5cf47dd9d47a2`;
>   - `final-2026-10-27T0905Z-collected.md` is **the 0905 review**, sha256 `1b3a3705f01647ef0ab122a37a82e9a13312c531e236b5d79531ac5489961627`.
>
>   Both are untracked and unchanged. The stale "only uncommitted" lines are tagged in place.
> - **Low 2, fixed:** **QA-9 runs its own `backend:test`, serialised with MB-1's database lane, not inside it.** The 0905 final's line 23 says otherwise. It stays as written, with a note in the file index.
> - **The decision** ([phase-3n-readiness.md](../../../evidence/QA-9/phase-3n-readiness.md) §1): as written, the backend harness protects user files and doesn't target unrelated rows. **But it can't prove its own cleanup or its target:**
>   - a failed delete only logs, with exit 0;
>   - the `gyms` and `body_entries` deletes are unchecked;
>   - nothing checks the stack after cleanup;
>   - there is no timeout;
>   - the `supabase status` parse is unguarded;
>   - the target is chosen by container name and a configured URL;
>   - every run shares one namespace.
>
>   **So a named fix lane comes before any shared write:** "backend harness: provable cleanup and a bound target". It belongs to S8 and S2, with Codex assigning `local-stack.mjs` and the root line, and it merges with MB-1's carried requests. **3N isn't requested yet.**
> - **The refined 3N plan, for after that lane** (readiness §2–§4):
>   - the prerequisites, from the scripts;
>   - MB-1's M1 live read, run once in the window, as P1–P4 (the endpoint, typed IDs, the listeners and the rule), not run twice;
>   - QA-9's read-only checks Q1–Q8 before and after the gate;
>   - the census of every owned namespace A1–A8 and every table's total;
>   - `backend:test` once.
>
>   A cleanup failure is a failure even with exit 0. There is no manual cleanup, re-run or seed. **How clean 55321 is today is unknown,** and the plan records it rather than assuming it.
> - **Executed:** read-only Git and hashes only (runs 1–7 and the final checks). **UNRUN:** the gate, M1, the census and every live command.
> - **Where:** the checkpoint's "Phase 3N-prep", "Commands run in phase 3N-prep" and "Resume here (phase 3N-prep)".

> **Phase 3M, after the commit** *(written after commit `8b29511381c35b936eb2fe14a148cd21f4dedfed`, uncommitted. No Done is claimed)*.
> - **Committed:** **`8b29511`**, `docs(QA-9): record independently audited local CI proof`, on `961e1f4`. It holds exactly the eleven owned records paths: nine added, and the checkpoint and this file modified. That is 2851 insertions and 15 deletions, with a clean staged `--check`, no hook output and a clean tree after it. Not pushed.
> - **Unchanged:** `main` at `c8a5d57c3a0999760ad21fd1aca4899ca76b5adf`, still with no floor (exit 128), and the floor blob at `HEAD`, still `0036eedaf6de63003294b9ff7aa3ef157ab57c74`. The six finals were committed byte for byte, the same hashes as before the edits.
> - **No gate ran.** None is owed for a records-only commit. No command was denied.
> - **Uncommitted now:** only these after-the-commit notes, in this file and the checkpoint. *(3N-prep, 0905 review Low 1: no longer complete. Two untracked finals were saved later. See the block above.)*
> - **Where:** the checkpoint's "Commands run in phase 3M", runs 8–23.

> **Phase 3M, records only, and one records commit** *(written before its records commit, and part of it. The commit's results follow it, uncommitted. No gate, test, install, clone, rebase or export ran. No Done is claimed)*.
> - **The brief:** Codex's phase-3M brief (27 October 2026, AUTH-01) **accepts the [0705 review](../../../evidence/QA-9/final-2026-10-27T0705Z.md)** (acceptance (16)).
>   - The review is an independent, read-only audit of phase 3L's local CI-mode proof: exit 0, **285 tests**, 19 format files, the floor unanchored, and domain 537/583, 273/313 and 106/117.
>   - It re-ran nothing, and found **no critical, high or medium finding**.
>   - So the proof is still phase 3L's implementer run, now independently audited. It is local CI mode, not hosted.
> - **Its four lows, fixed exactly as stated,** with the raw finals preserved:
>   - **Low 1:** the first cut is raw lines **121–702**, in [phase-3l-check-outputs.md](../../../evidence/QA-9/phase-3l-check-outputs.md)'s Cuts row and its cut marker;
>   - **Low 2:** the Grep matched **only raw line 27**, the ESLint command line `eslint . --max-warnings=0`, with no `not ok`, `Error` or `ERR`;
>   - **Low 3:** **7 trailing spaces removed, at raw lines 96, 98, 100, 101, 103, 104 and 107, by the 0705 review's Grep.** This is in the outputs file and in "Decisions forced in phase 3L" below. The review cites `checkpoint.md:348`; the sentence was this file's line 348;
>   - **Low 4:** phase 3L's "Final state" list is in the checkpoint, with `phase-3l-check-outputs.md`'s hash `d57c38100c149544d8dacc1e02537d0f5bbdafb18a9034cf9f4c54ea98fe2d20` labelled as its original phase-3L version.
>
>   The figures in Lows 2 and 3 are the review's, inherited. Phase 3M didn't re-grep, re-count or re-hash the raw output, because phase 3L's count of it was denied as a script. It inspected the copy's line offset, which places each cited raw line in the copy.
> - **The finals, named and unchanged:**
>   - [final-2026-10-27T0635Z.md](../../../evidence/QA-9/final-2026-10-27T0635Z.md) is phase 3L's implementer report, sha256 `c3fb223ff526a110cbbf3ba76523b86665b23c06fd3557249c8f4518dfdcca94`;
>   - the 0705 review's sha256 is `20443d43463909815bc9b8d014022c5c8f839de17b7d697fafd43fa1e4df6e04`.
> - **The fresh inventory, executed (runs 2–7):** `HEAD` is `961e1f41104e414f045d5a9a42e8e9ca44acf083` and `main` `c8a5d57c3a0999760ad21fd1aca4899ca76b5adf`. There are eleven uncommitted paths, all owned QA-9 records. The floor blob at `HEAD` is `0036eedaf6de63003294b9ff7aa3ef157ab57c74`, and the real `main` has no floor (exit 128).
> - **One records commit:** exactly those eleven paths, each named, after a staged `git diff --cached --check`, as `docs(QA-9): record independently audited local CI proof`. A records-only commit leaves the floor blob at `0036eeda…`, so no gate is owed.
> - **Still open:** `backend:test`, the real `main`'s floor, box 3's hosted run, and exact integration with final verification.
> - **Where:** the checkpoint's "Phase 3M", "Commands run in phase 3M" and "Resume here (phase 3M)".

> **Phase 3L, one local CI-mode gate** *(written after the gate, uncommitted. This is an implementer run, not independent. No commit, stage, install, clone or rebase. No Done is claimed)*.
> - **The brief:** Codex's phase-3L brief (27 October 2026, AUTH-01): inspect the scripts for effects, then run `rtk proxy env CI=true FITLOG_CONTRACT_BASELINE=c8a5d57c3a0999760ad21fd1aca4899ca76b5adf pnpm check` **exactly once** on this branch, with Node 22.23.1. **It is a local CI-mode proof only, not hosted CI.**
> - **The baseline is exact:** `main` = **`c8a5d57c3a0999760ad21fd1aca4899ca76b5adf`**, which is also the fork point of `HEAD` = **`961e1f41104e414f045d5a9a42e8e9ca44acf083`**, four QA-9 commits ahead.
> - **The floor:** blob **`0036eedaf6de63003294b9ff7aa3ef157ab57c74`** at `HEAD`. **The real `main` has no floor file** (exit 128), so it is still unanchored.
> - **The scripts' effects, inspected first:**
>   - Git is only read, and Prettier checks in memory. `plan:build --check` writes nothing.
>   - The only writes are the ignored `apps/mobile/coverage/` and OS-temp scratch and cache.
>   - `CI=true` turns on CI mode in the guard, the format step and the contract history test.
> - **`pnpm check`, once, Node v22.23.1: exit 0, 285 tests** (40 + 97 + 126 + 22).
>   - Guard: **1 baseline**, `FITLOG_CONTRACT_BASELINE@c8a5d57c3a09`, and **"the floor is not anchored yet"**, which is true of the real `main`.
>   - Format step: **19 files**, `Base: FITLOG_CONTRACT_BASELINE@c8a5d57c3a09, from 06c822050d76, which adds scripts/quality/touched-format.mjs`.
>   - Domain: **537/583, 273/313, 106/117**. That is R19's CI-mode state, measured for the first time.
>   - Mobile: 254/2076, 164/1551, 84/821 and 191/1023. Plan build: matches.
>   - Raw output: sha256 `bbb95d7f2e56d0ed0c83cbfc047d0f0d10b3c9f2ad714bd672da5b13483e57bb`.
> - **The inventory was preserved:** the same eight uncommitted paths, the same four ignored folders, the same eleven hashes, and `HEAD` and `main`, all unchanged across the gate. After it, this phase added only [phase-3l-check-outputs.md](../../../evidence/QA-9/phase-3l-check-outputs.md) and edited the two records.
> - **Denied:** `which node` and `pnpm --version`, both read-only orientation, and a `node -e` count of the raw output, a script. None was retried in another form.
> - **Not proved here:** hosted CI (no `GITHUB_ACTIONS`, Linux or fresh install), box 3's lint-negative run, `backend:test`, the real `main`'s floor, and exact integration. The exports are inherited, not re-run.
> - **Where:** the checkpoint's "Phase 3L", "Commands run in phase 3L" and "Resume here (phase 3L)".

> **Phase 3K, records only** *(uncommitted. No commit, stage, gate, test, install or clone command ran. No Done is claimed)*.
> - **The brief:** Codex's phase-3K brief (27 October 2026, AUTH-01) **accepts the independent floor proof** in the [0535 review](../../../evidence/QA-9/final-2026-10-27T0535Z.md) (acceptance (15)).
> - **What the review executed** (inherited here, not re-run): `pnpm check` once, on Node v22.23.1, in the kept clone at `HEAD` = `main` = `961e1f4`. Exit 0, **285 tests** and **0 format files**. The floor counted as anchored in the clone. Domain **536/583** lines, **273/313** branches and **106/117** functions. **No critical, high or medium finding.**
> - **The floor:** blob **`0036eedaf6de63003294b9ff7aa3ef157ab57c74`** at `HEAD` (phase 3K's run 5, executed). It is the same blob phase 3J recorded. **The real `main`, `c8a5d57`, has no floor file** (run 6, exit 128), so it is still unanchored.
> - **Low 1, accepted by Codex:** the shared OS temp folder and Jest cache are a disclosed limitation of a local proof. Neither run claims a cold Jest run, and no new run is owed for the cache alone.
> - **Low 2, Codex's rule:** a denied compound read-only orientation step may use already permitted single read forms. A denied write, gate or script step ends its sequence. Never retry it with another tool or form, and never get round a safety decision.
> - **Low 3, fixed:** the clone is `/var/folders/0s/4k0smcx56zl9hdj404qnz2s80000gp/T/fitlog-qa9-floor.dGGhev2tS6/clone`, real path `/private/var/folders/0s/4k0smcx56zl9hdj404qnz2s80000gp/T/fitlog-qa9-floor.dGGhev2tS6/clone`. It is never `…/repo`, which doesn't exist (the 0535 review's check, inherited; phase 3K ran nothing in the clone).
> - **Low 4, fixed:** two finals are now named.
>   - [final-2026-10-27T0505Z.md](../../../evidence/QA-9/final-2026-10-27T0505Z.md) is phase 3J's implementer report, sha256 `5f779f6c4e992c7f01b2a81d374fb49eae005d2ab6fe4c79cd6789bfda7dee23`.
>   - [final-2026-10-27T0535Z.md](../../../evidence/QA-9/final-2026-10-27T0535Z.md) is the 0535 review, sha256 `62b452203d564d01840f515cc1304d5c95ca76c1038f4fec0349ce7732c582b7`.
>
>   Both are untracked and unchanged. The exact seven-path inventory is in the checkpoint's Git row.
> - **New, for PL-1: H1, a skip-guard gap, high.** A single change can skip or disable a required CI job or step, so its check passes without running. QA-9's pins run inside the job they protect, so they can't see that *(inference by reading)*. The fix is PL-1's, in its lane: a separate required `ci-guard` workflow. Future protection needs all three required checks, **`check`, `backend` and `ci-guard`**. **QA-9 makes no root wiring change now.**
> - **Still open:**
>   - the real `main`'s floor;
>   - `backend:test`;
>   - CI mode;
>   - box 3's hosted run;
>   - exact integration and final verification.
> - **Where:** the checkpoint's "Phase 3K", "Commands run in phase 3K" and "Resume here (phase 3K)".

> **Phase 3J, the floor proof at `HEAD` = `main`** *(written after the gate, uncommitted. These are implementer runs, not independent. No commit was made in phase 3J, by the brief. No Done is claimed)*.
> - **The brief:** Codex's phase-3J brief (27 October 2026, AUTH-01) accepts records commit `961e1f4` as five scoped records paths only, not a code change (acceptance (14)). It chooses an allowed literal `mkdir` for the empty template and hooks, inside phase 3I's kept folder, and an offline frozen install with `--ignore-scripts`. It asks for `pnpm check` once at `HEAD` = `main`, with no retry and no commit.
> - **The folder:** `/var/folders/0s/4k0smcx56zl9hdj404qnz2s80000gp/T/fitlog-qa9-floor.dGGhev2tS6` was checked first. It is outside every repository (exit 128), and it was empty, hidden entries included. It is a real directory with mode 700. `empty-template/` and `empty-hooks/` were made there. `tmp/` was not, because the allowlist has no `TMPDIR=` form for the gate.
> - **The clone:** a local clone of this worktree, with the empty template, the empty hooks path and `--no-hardlinks`. Its `HEAD` is exactly **`961e1f41104e414f045d5a9a42e8e9ca44acf083`**. It has no hooks folder, and its only remote is this worktree's local path. No fetch was made. `git checkout -B main <tip>` ran **inside the clone only**, so its `HEAD` = `main` = the tip, with a clean tree. **This repository's `main` stayed at `c8a5d57`,** before, during and after.
> - **Offline install:** `pnpm install --frozen-lockfile --offline --ignore-scripts`, exit 0, `downloaded 0`, `Packages: +1096`, pnpm v10.27.0. It started with no `node_modules`, and the lockfile hash is unchanged.
> - **`pnpm check`, once, Node v22.23.1, 04:40:29Z–04:41:42Z: exit 0, 285 tests** (40 + 97 + 126 + 22).
>   - Format step: **0 files**, `Base: main@961e1f41104e`, "No other tracked path was touched."
>   - Guard: **1 Git baseline**, `main@961e1f41104e: same commit as an earlier baseline`. **No "floor is not anchored" line**, so the floor counts as anchored at `HEAD` = `main`.
>   - Domain: **535/583**, **273/313** and **106/117**. That is R19's `HEAD` = `main` state, measured for the first time.
>   - Mobile: 254/2076, 164/1551, 84/821 and 191/1023. Plan build: matches.
> - **The floor:** byte-identical in this worktree, the clone's working tree and the clone's `HEAD` and `main` (sha256 `f0d4017c…`, blob `0036eeda…`). Its seven values equal coverage-baseline.md §5, and its scope equals §1.
> - **Raw output:** 44,207 bytes, sha256 `6dc7f0ba…`. It is copied whole in the outputs file, and a mechanical check shows the copy equal to the raw output apart from five trailing spaces.
> - **Not proved here:** this repository's `main` holding the floor (only integration does that), CI mode, box 3's hosted run, `backend:test`, and an independent reproduction. The exports are inherited from the 0405 review on `c84bb4c`.
> - **Outputs:** [phase-3j-check-outputs.md](../../../evidence/QA-9/phase-3j-check-outputs.md), and the checkpoint's "Phase 3J" and "Commands run in phase 3J".

> **Phase 3I, after the commit and the stop** *(written after them, uncommitted. These are implementer runs. No Done is claimed)*.
> - **Records commit:** **`961e1f41104e414f045d5a9a42e8e9ca44acf083`**, `docs(QA-9): record phase 3H results and the 0405 review`, on `c84bb4c`. It holds exactly the five paths, with staged `--check` clean, no hook output and a clean tree after it. `git diff --name-only c84bb4c HEAD` lists the same five.
> - **`main` unchanged** at `c8a5d57`, before and after. No other ref moved, and nothing is pushed.
> - **The floor proof stopped at its first write.** The disposable folder `/var/folders/0s/4k0smcx56zl9hdj404qnz2s80000gp/T/fitlog-qa9-floor.dGGhev2tS6` was made with `mktemp` and confirmed outside every repository. Then `rtk proxy mkdir` of its empty-template, empty-hooks and temp subfolders was **denied**. By the brief, the sequence stopped and is reported here, with no replacement writer and no retry. **So no clone, install or `pnpm check` ran.** The `HEAD` = `main` floor, the 0 format files and R19's `HEAD` = `main` state are still **unmeasured**. The folder holds no file and is kept.
> - **Inspected only:** the floor file at `961e1f4` equals coverage-baseline.md §5, value by value.
> - **Found by reading, for the resumed proof:** a fresh-clone install could run `supabase`'s `postinstall`, which downloads its CLI, because `pnpm-workspace.yaml` allows that build. Add `--ignore-scripts`.
> - **Next:** the floor proof, resumed under Codex's choice of folder setup; a fresh independent review; `backend:test` serialised later; the hosted run once the owner specifically approves the push; and final verification.
> - **Outputs:** [phase-3i-check-outputs.md](../../../evidence/QA-9/phase-3i-check-outputs.md), and the checkpoint's "Phase 3I" and "Commands run in phase 3I".

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
- *(3J)* **Phase 3J** resumed that floor proof and ran it once, under Codex's phase-3J brief, with no commit. Its record is the phase-3J block at the top, checkpoint "Phase 3J" and "Commands run in phase 3J", and [phase-3j-check-outputs.md](../../../evidence/QA-9/phase-3j-check-outputs.md). ratchet-enforcement.md wasn't changed.
- *(3K)* **Phase 3K** recorded Codex's acceptance of the 0535 review's independent floor proof, and resolved that review's four lows. It also captured PL-1's H1. It is records only, under Codex's phase-3K brief, with no commit. Its record is the phase-3K block at the top, and the checkpoint's "Phase 3K" and "Commands run in phase 3K". Only this file and the checkpoint changed.
- *(3L)* **Phase 3L** ran `pnpm check` once in local CI mode against the exact `main` commit, under Codex's phase-3L brief, with no commit. Its record is the phase-3L block at the top, the checkpoint's "Phase 3L" and "Commands run in phase 3L", and [phase-3l-check-outputs.md](../../../evidence/QA-9/phase-3l-check-outputs.md). ratchet-enforcement.md wasn't changed.
- *(3M)* **Phase 3M** recorded Codex's acceptance of the 0705 review's independent audit of phase 3L, and fixed that review's four lows. Then it made one records-only local commit of the eleven owned records paths. It is records only, under Codex's phase-3M brief. Its record is the phase-3M block at the top, and the checkpoint's "Phase 3M" and "Commands run in phase 3M". ratchet-enforcement.md wasn't changed.
- *(3N-prep)* **Phase 3N-prep** recorded Codex's acceptance of the 0905 review and fixed its two lows. It wrote [phase-3n-readiness.md](../../../evidence/QA-9/phase-3n-readiness.md): the harness decision, the fix lane and the refined 3N plan. It is records and planning only, under Codex's phase-3N-prep brief, with no gate and no commit. Its record is the phase-3N-prep block at the top, and the checkpoint's "Phase 3N-prep" and "Commands run in phase 3N-prep". ratchet-enforcement.md wasn't changed.

## Done when

| Box | Met | Evidence |
|-----|-----|----------|
| `apps/mobile/jest.config.cjs` collects coverage from all of `src/` with thresholds at the measured values, and `pnpm check` fails when one is lowered (seen once) | **Locally. Not accepted** | `jest.config.cjs` takes its scope and thresholds from `coverage-thresholds.json`, which covers all of `src/` except `__tests__`. The thresholds are 12.23 / 10.57 / 10.23 / 18.67, as measured in phase 1. Lowering one was seen to fail in phase 2 (M1), and ratchet tests 4 and 11–14 hold it. The review of phase 3C measured the same four values independently and passed those tests. Test 12 shows the gap that stays until integration: before `main` holds the ratchet, a branch commit can lower the floor and a threshold together (R1). Phase 3D changed no scope or threshold |
| Domain coverage is measured with a threshold, and the backend inventory lists every exposed RPC with its test | **Locally. Not accepted** | Domain 91.42 / 86.90 / 90.59, enforced exactly by `exact-coverage-reporter.mjs`. The review of phase 3C measured 533/583, 272/313 and 106/117: lines **exactly on the threshold**, as in phase 3C's run 19 (R3). [rpc-test-inventory.md](../../../evidence/QA-9/rpc-test-inventory.md) lists the 9 exposed RPCs, with their gaps named in docs/23 §9 rule 3. The review checked it against the migrations itself: exactly 9 `public` functions, the 9 listed. *(After the commit)* **At `4a7ee21` the branch threshold fails:** 271/313 against 86.90 (R19). The 272 holds only while `HEAD` equals `main`. *(3E)* **With the uncommitted R19 test,** domain is 537/583 and 536/583 for lines, **273/313** for branches and 106/117 for functions, with `HEAD` ahead of `main` (runs 10 and 11). `HEAD` = `main` and CI mode are predicted at 273/313, not measured. *(3G, after the commit)* **With the test committed** in `3007094`: 535/583, **273/313** and 106/117 (run 20). `HEAD` = `main` and CI mode are still not measured. *(3H, after the rebase)* **On the rebased tip `c84bb4c`,** three commits ahead of `main@c8a5d57`: 535/583, **273/313** and 106/117 (run 30). `HEAD` = `main` and CI mode are still not measured. *(3I)* The 0405 review measured 536/583, **273/313** and 106/117 on `c84bb4c`, independently. The `HEAD` = `main` measure in a disposable clone **didn't run**, because `mkdir` was denied. Still not measured. *(3J)* **Measured at `HEAD` = `main`**, in a disposable local clone at `961e1f4` (phase 3J's run 36): 535/583, **273/313** and 106/117, with the floor anchored in the clone. CI mode is still not measured. *(3K)* **Measured independently at `HEAD` = `main`** by the 0535 review, in the same clone: 536/583, **273/313** and 106/117, with no critical, high or medium finding. Codex accepts it (15). The 536 against 535 is `dates.ts:19`, a known R3 flip. CI mode is still not measured, and the real `main` has no floor (phase 3K's run 6). *(3L)* **Measured in local CI mode** (phase 3L's run 13), with `CI=true` and `FITLOG_CONTRACT_BASELINE` set to the exact `main` commit `c8a5d57c3a0999760ad21fd1aca4899ca76b5adf`: 537/583, **273/313** and 106/117, so R19's CI-mode forecast holds. This is an implementer run, local and not hosted. The real `main` still has no floor (phase 3L's run 5). *(3M)* The 0705 review audited that run independently, from its raw output and transcript, with no critical, high or medium finding, and Codex accepts the audit (16). It re-ran nothing, so the run is still an implementer run, independently audited, local and not hosted. The real `main` still has no floor (phase 3M's run 5) |
| CI fails on a lint error (seen once, run linked), and the ratchet rule is in docs/23 §9 | **No** | The rule is in docs/23 §9 rule 3. Locally, `pnpm check` fails on a lint error (phase 2, M12). **No hosted run exists.** It needs the box-3 draft pull request ([ratchet-enforcement.md §7](../../../evidence/QA-9/ratchet-enforcement.md#7-phase-2e-phase-2d-review-findings-and-r14)). Pushing it and opening it need **the owner's specific approval** under docs/23 §6: `"push": true` in `var/orchestrator/config.json`, or the owner pushing by hand. *(3D, phase-3C review finding 1: this row said "Codex's specific authorisation".)* AUTH-01 delegates routine technical choices and final technical sign-off to Codex, not publication, and no existing approval covers it. The repository is public. Touched-format 17 tests the commit shape that run will check out, and §7's step 4 requires the format label and 18 files in its log. *(3H, 0305 review finding 1: since 3F, §7's step 4 requires **19** files, naming `contract.test.ts`. A rebase changes the `from` commit ID in the label.)* *(3K, PL-1's H1.)* A single change that skips or disables a required job or step could make its check pass without running. The fix is PL-1's required `ci-guard` workflow. Future protection needs all three required checks, `check`, `backend` and `ci-guard`. A hosted proof should show them, once PL-1 has built and proved `ci-guard`. QA-9 makes no root wiring change now |

**Boxes met: 2 of 3, locally, with neither accepted.** *(After the commit)* They hold only with `HEAD` = `main`: at commit `4a7ee21`, `pnpm check` fails on box 2's domain branch threshold (R19), so neither is ready for verification. *(3E)* With the uncommitted test, `pnpm check` passes with `HEAD` ahead of `main` (run 11), so both hold locally again, by the implementer's runs. Neither is accepted. They wait for a fresh independent review and for Codex's decision to commit the test. *(3G, after the commit)* The test is committed, and `pnpm check` passes on commit `3007094` (run 20), by the implementer's run. Neither box is accepted, and box 3 is still unmet. *(3H, after the rebase)* `pnpm check` passes on the rebased tip `c84bb4c` (run 30), by the implementer's run. Neither box is accepted, and box 3 is still unmet. *(3I)* The 0405 review reproduced that pass independently, and Codex accepts it. The new tip `961e1f4` adds only records. The `HEAD` = `main` floor proof didn't run. Neither box is accepted, and box 3 is still unmet. *(3J)* The floor proof ran once in a disposable local clone with `HEAD` = `main` = `961e1f4`: `pnpm check` passed with 285 tests and 0 format files, and the guard treated the floor as anchored there. That is an implementer run, not independent. Neither box is accepted, and box 3 is still unmet. *(3K)* The 0535 review reproduced that proof independently in the same clone (285 tests, 0 format files, the floor anchored, 536/583, 273/313 and 106/117), with no critical, high or medium finding. Codex accepts the review (15). That accepts the review, not a box or the goal, and box 3 is still unmet. *(3L)* `pnpm check` passed once in local CI mode against the exact `main` commit (285 tests, 19 format files, 537/583, 273/313 and 106/117), by the implementer's run. Neither box is accepted. Box 3 is still unmet, because a local CI-mode run isn't its hosted run. *(3M)* Codex accepts the 0705 review's independent audit of that local CI-mode run (16). That accepts the audit, not a box or the goal. Phase 3M commits records only, and box 3 is still unmet. *(3N-prep)* Codex accepts the 0905 review of `8b29511` (17). That accepts the review, not a box or the goal. Phase 3N-prep changes records only, and no box moves. The card's scope line, "Prettier on touched files only", is built (phase 3), corrected (phases 3B and 3C), and reviewed with execution twice (the final review of phases 3 and 3B, and the review of phase 3C).

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
| *(3I)* The records commit | `rtk proxy git add --` the five named paths; the staged names, stat, numstat and `--check`; one `rtk proxy git commit` | *(After the commit, uncommitted.)* **As expected** (runs 5–17). Commit **`961e1f41104e414f045d5a9a42e8e9ca44acf083`**, five paths, 717 insertions and 18 deletions, `--check` clean, no hook output. `main` still `c8a5d57` |
| *(3I)* Floor proof, `HEAD` = `main`, in a disposable clone, Node v22.23.1 | `mktemp -d`, then `mkdir` of the empty template, empty hooks and temp folders, then the clone, `checkout -B main`, the offline install and `pnpm check` once | *(After the stop, uncommitted.)* **Not run.** `mktemp` made the folder, and it is outside every repository (runs 18–19). **`mkdir` was denied** (run 20), so the sequence stopped by the brief's rule. No clone, install or gate ran. The floor's values at `961e1f4` equal §5 by reading (run 23). Outputs: [phase-3i-check-outputs.md](../../../evidence/QA-9/phase-3i-check-outputs.md). *(3J: resumed and run, in the three rows below.)* |
| *(3J)* Disposable folder, clone, and `main` = `HEAD` in the clone | `git -C <root> rev-parse --show-toplevel`, a read-only listing, `mkdir` of `empty-template` and `empty-hooks`, `git clone --template=<root>/empty-template -c core.hooksPath=<root>/empty-hooks --no-hardlinks --branch codex/qa9-quality-ratchets <this worktree> <root>/clone`, `git -C <root>/clone checkout -B main 961e1f4…` | *(Uncommitted.)* **As expected** (runs 7–26). The folder is outside every repository, and was empty. The clone's `HEAD` is exactly `961e1f4`, with no hooks folder and only this worktree's local path as a remote. After the checkout, its `HEAD` = `main` = `961e1f4`, with a clean tree. This repository's `main` stayed at `c8a5d57`. The floor is byte-identical across the worktree, the clone and both clone refs |
| *(3J)* Offline frozen install, no scripts, in the clone | `rtk proxy pnpm install --frozen-lockfile --offline --ignore-scripts` | *(Uncommitted.)* **Exit 0** (run 31), from no `node_modules`. `downloaded 0`, `Packages: +1096`, pnpm v10.27.0. The lockfile's hash and the tree are unchanged |
| *(3J)* `pnpm check` at `HEAD` = `main`, in the clone, Node v22.23.1 | `rtk proxy pnpm check`, once | *(Uncommitted.)* **Run 36: exit 0, 285 tests** (40 + 97 + 126 + 22).<br>**Format step:** **0 files**, `Base: main@961e1f41104e`, no other tracked path touched.<br>**Guard:** 1 Git baseline, `main@961e1f41104e: same commit as an earlier baseline`, and no "not anchored" line.<br>**Domain:** 535/583, **273/313**, 106/117.<br>**Mobile:** 254/2076, 164/1551, 84/821, 191/1023.<br>**Plan build:** matches.<br>These are the implementer's runs, not independent. Outputs, whole: [phase-3j-check-outputs.md](../../../evidence/QA-9/phase-3j-check-outputs.md) |
| *(3K)* Independent floor proof at `HEAD` = `main`, the 0535 review | `rtk proxy pnpm check`, once, in the kept clone `/var/folders/0s/4k0smcx56zl9hdj404qnz2s80000gp/T/fitlog-qa9-floor.dGGhev2tS6/clone`, Node v22.23.1, by the review's own session | *(Inherited, not run in phase 3K.)* **Exit 0, 285 tests** (40 + 97 + 126 + 22), 05:06:16Z–05:07:08Z.<br>**Format step:** **0 files**, `Base: main@961e1f41104e`.<br>**Guard:** 1 Git baseline, and no "not anchored" line.<br>**Domain:** **536/583**, **273/313**, **106/117**.<br>**Mobile:** 254/2076, 164/1551, 84/821, 191/1023.<br>**Plan build:** matches.<br>No critical, high or medium finding. **Accepted by Codex (15).** Jest wasn't cold, because it reused phase 3J's cache (Low 1, accepted as a limitation). Source: [final-2026-10-27T0535Z.md](../../../evidence/QA-9/final-2026-10-27T0535Z.md) |
| *(3K)* The floor at `HEAD` and on the real `main` | `rtk proxy git rev-parse HEAD:scripts/quality/coverage-floor.json`; `rtk proxy git cat-file -e main:scripts/quality/coverage-floor.json` | *(Executed in phase 3K, read-only.)* `HEAD` holds blob `0036eedaf6de63003294b9ff7aa3ef157ab57c74` (run 5). `main@c8a5d57` has none: exit 128, "exists on disk, but not in 'main'" (run 6). **The real `main` is unanchored** |
| *(3L)* `pnpm check` in **local CI mode**, at `961e1f41104e414f045d5a9a42e8e9ca44acf083`, Node v22.23.1 | `rtk proxy env CI=true FITLOG_CONTRACT_BASELINE=c8a5d57c3a0999760ad21fd1aca4899ca76b5adf pnpm check`, once, in this worktree | *(Uncommitted.)* **Run 13: exit 0, 285 tests** (40 + 97 + 126 + 22).<br>**Baseline:** exactly the actual `main` and the fork point (runs 2–3).<br>**Guard:** 1 baseline, `FITLOG_CONTRACT_BASELINE@c8a5d57c3a09`, and "the floor is not anchored yet". The floor blob at `HEAD` is `0036eeda…`, and `main` has none (runs 4–5).<br>**Format step:** 19 files, `from 06c822050d76, which adds scripts/quality/touched-format.mjs`, 39 not checked.<br>**Domain:** 537/583, **273/313**, 106/117.<br>**Mobile:** 254/2076, 164/1551, 84/821, 191/1023.<br>**Plan build:** matches.<br>**Inventory:** preserved, by status and hash (runs 9–11 and 16–19).<br>This is an implementer run, and **local CI mode only, not hosted**. Outputs: [phase-3l-check-outputs.md](../../../evidence/QA-9/phase-3l-check-outputs.md) |
| *(3M)* The records commit | `rtk proxy git add --` and the eleven named paths; then the staged names, stat and `git diff --cached --check`; one `rtk proxy git commit` | *(Results written after the commit, uncommitted.)* No gate is owed: the commit is records only, and the floor blob stays `0036eedaf6de63003294b9ff7aa3ef157ab57c74`. *(After the commit.)* **As expected** (runs 11–22): exactly the eleven paths, nine `A` and two `M`, 2851 insertions and 15 deletions, and `--check` **clean**. Commit **`8b29511381c35b936eb2fe14a148cd21f4dedfed`** on `961e1f4`, with no hook output and a clean tree after it. The floor blob is unchanged, and `main` is still `c8a5d57`, with no floor |
| `pnpm backend:test` | not run | **Required by docs/23 §7 for this diff**, which touches `packages/domain/` (`package.json`, 2 lines). **Deferred, not waived.** The phase-3D brief forbids the database, Supabase and Docker it needs. It must run, and pass, before integration. *(3E)* `contract.test.ts` is in `packages/domain/` too, and phase 3E's brief also allows no backend run. *(3H)* Still not run: phase 3H's brief forbids every backend, shared-database, fixture, Supabase and replay command, since MB-1 owns the database lane. It is to be serialised later, under the 0305 review's step-7 preconditions. *(3N-prep)* Still not run. **QA-9 runs it itself, serialised with MB-1's lane, not inside it.** As written, the harness can't prove its own cleanup or its target, so a named fix lane comes first. The refined plan has a read-only preflight, a census of every owned namespace, and one run. In it, a cleanup failure is a failure even with exit 0, and there is no manual cleanup ([phase-3n-readiness.md](../../../evidence/QA-9/phase-3n-readiness.md)) |
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
| *(3J)* The 0405 review, and phase 3I's run 17 | Both exports pass on `c84bb4c`; `961e1f4` differs from `c84bb4c` only by five Markdown files | Used, not re-run. Codex's phase-3J brief accepts `961e1f4` as records only and defers the exports. Phase 3J's own run is the `HEAD` = `main` gate in the clone |
| *(3K)* The 0535 review | Its executed `pnpm check` in the kept clone at `HEAD` = `main` = `961e1f4`: exit 0, 285 tests, 0 format files, the floor anchored, 536/583, 273/313 and 106/117. Also that `…/repo` doesn't exist, and that the 0505 report's hash is `5f779f6c…` | Accepted by Codex's phase-3K brief (15). Phase 3K re-ran no gate. It confirmed the 0505 hash, the floor blob at `HEAD` and the real `main`'s missing floor itself (runs 4–6) |
| *(3M)* The 0705 review | Phase 3L's local CI-mode proof is accurate, as a local proof: the raw output supports every figure, with one gate call and no edit during it, the three denials as recorded, and all 11 hashes identical across the gate. Also the facts behind its four lows: the cut's offset, raw line 27, the 7 trailing-space rows, and phase 3L's unrecorded final-state checks with `d57c3810…` | Accepted by Codex's phase-3M brief (16). Phase 3M re-ran no gate, and didn't re-read the raw output or the transcript. It ran the inventory, the floor checks and the hashes itself (runs 2–7), and confirmed `d57c3810…` before its first edit. It inspected the copy's line offset |
| *(3N-prep)* The 0905 review | `8b29511` holds exactly the 11 owned paths, and the floor blob and the finals are unchanged. `main` is still unanchored. The four 0705 corrections hold. Also its reading of what `backend:test` needs | Accepted by Codex's phase-3N-prep brief (17). Phase 3N-prep re-ran no gate. It ran the inventory, the refs, the floor blob and the hashes itself (runs 2–4), and re-read every `scripts/backend/` script itself for the readiness record |

## Mutation checks

*(3F)* **None in phase 3F**, and the review of phase 3E ran none either. Following that review's finding 1, §14 now gives five exact diffs: mutations 1, 2, 3a and 3b, each with predicted killers, and 3c, a predicted survivor. Mutation 2 has two predicted killers, test 1 in its `HEAD behind main` state and test 2's diverged case. These are predictions from reading the tests.

*(3E)* **None in phase 3E.** The brief forbids production edits, even temporary ones, so `snapshot-contract.ts` was never mutated. The tests' power to fail is argued in ratchet-enforcement.md §14, "What stays unproved". It lists three scratch-copy mutations, each with its expected failure, for the fresh review to run.

None in phase 3D: it changed no code or tests. Earlier phases' mutations (M1–M16, G1–G7, D, E, F, 2G-G1 to 2G-G12, 3-M1 to 3-M22, 3B-M1 to 3B-M9, 3C-M1) are in ratchet-enforcement.md §2 and §4–§12.

## Review findings left open

The brief forbade sub-agents, so no code-reviewer, security-reviewer or tdd-guide run happened. A self-review replaced them (checkpoint, "Phase 3D"). *(3F: the same in phase 3F, whose diff is records only. Checkpoint, "Phase 3F".)* *(3G: the same in phase 3G, whose diff is records and whitespace only. Checkpoint, "Phase 3G".)* *(3I: the same in phase 3I, whose diff is records only, and whose brief also forbade any dispatcher. Checkpoint, "Phase 3I".)* *(3J: the same in phase 3J, whose diff is three records files only, uncommitted. Its brief forbade sub-agents and any dispatcher, and says a fresh independent review follows. Checkpoint, "Phase 3J".)* *(3K: the same in phase 3K, whose diff is two records files only, uncommitted. Its brief forbade sub-agents and any dispatcher. Checkpoint, "Phase 3K".)* *(3L: the same in phase 3L, whose diff is two records files and one new outputs file, uncommitted. Its brief forbade sub-agents, dispatch and launch scripts. Checkpoint, "Phase 3L". No new finding.)* *(3M: the same in phase 3M, whose diff is records only: three records files edited, and eight untracked records committed as they are. Its brief forbade sub-agents, dispatch and launch scripts. Checkpoint, "Phase 3M". No new finding.)* *(3N-prep: the same in phase 3N-prep, whose diff is records only: two records edited and one new readiness file. Its brief forbade sub-agents. Checkpoint, "Phase 3N-prep". Its one new finding is the harness decision below, which is about other lanes' files.)*
- *(3N-prep)* **The 0905 review:** no critical, high or medium finding, and two lows, both in the records and both fixed in phase 3N-prep.
  - **Low 1, the stale "only uncommitted" lines:** both 0905 finals are now named, with their hashes and the exact inventory. The stale lines are tagged.
  - **Low 2, who runs `backend:test`:** QA-9 runs it, serialised with MB-1's lane, not inside it. The note is in the file index.
- *(3N-prep)* **Medium, for other lanes, not QA-9's code: the backend harness can't prove its own cleanup or its target** (readiness §1, G1–G7). It is inspected, not run. It blocks QA-9's `backend:test` on the shared stack until the named fix lane lands. It's under "Requests for other lanes' files".
- *(3M)* **The 0705 review:** no critical, high or medium finding, and four lows, all in the records and all fixed in phase 3M.
  - **Low 1, the first cut's label:** now raw lines 121–702.
  - **Low 2, the Grep:** it matched only raw line 27, the ESLint command line.
  - **Low 3, the trailing spaces:** 7, at raw lines 96, 98, 100, 101, 103, 104 and 107, by the review's Grep. These aren't phase 3J's rows.
  - **Low 4, phase 3L's final state:** listed in the checkpoint, with `d57c3810…` labelled as the outputs file's original version.
- *(3K)* **The 0535 review:** no critical, high or medium finding, and four lows, all resolved in phase 3K's records.
  - **Low 1, the shared temp folder and cache:** accepted by Codex as a disclosed local-proof limitation. No cold-Jest claim.
  - **Low 2, the denial rule:** answered by Codex's rule, as recorded at the top.
  - **Low 3, the clone path:** fixed, with the exact path written out.
  - **Low 4, the unnamed finals:** fixed, with both finals named and hashed.
- *(3K)* **PL-1's H1, high, PL-1's, not QA-9's:** the skip-guard gap. It is under "Found for other goals". QA-9 makes no root wiring change for it now.
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
- *(3E)* **R19's re-measures:** with `HEAD` = `main`, and in CI mode with `FITLOG_CONTRACT_BASELINE`. Both are predicted at 273/313, not run. *(3F: the forecasts rest on an unconfirmed model, so they mean "the margin should hold".)* *(3L: both are now measured at 273/313. Phase 3J and the 0535 review measured `HEAD` = `main`, in the kept clone. Phase 3L measured local CI mode, with the exact `main` commit as the baseline. The hosted CI run is still box 3's.)*
- *(3F)* **§14's mutations,** now exact diffs. Nobody has run them. A reviewer can run them on a scratch copy of `snapshot-contract.ts`, one at a time.
- **The rebase onto local `main`** (R18(h)), then `pnpm check` again with the domain line count recorded as an R3 sample. The coordinator serialises it later, and the brief forbids it here. *(3H: done. Rebased onto `main@c8a5d57` with identical patches, and `pnpm check` passed at 535/583 and 273/313.)*
- **Before integration:**
  - `pnpm install --frozen-lockfile`; *(3H: done offline, run 28)*
  - `pnpm backend:test`; *(3H: still deferred, to be serialised with MB-1's database lane)* *(3N-prep: still not run. It waits for the named fix lane, then the refined 3N plan in phase-3n-readiness.md §3–§4, in one window Codex names)*
  - the iOS and Android export; *(3H: done, run 33, JS and Hermes only)*
  - `git show <commit>:scripts/quality/coverage-floor.json`, compared with coverage-baseline.md §5 at the exact `main` commit. *(3H: still open. The throwaway clone with `HEAD` = `main` at the exact tip does this and measures R19's `HEAD` = `main` state.)* *(3I: the clone sequence stopped when `mkdir` was denied, so the `HEAD` = `main` gate didn't run. The floor's values at `961e1f4` equal §5 by reading. The proof is still open. It resumes under Codex's choice of folder setup, with `--ignore-scripts` on the install.)* *(3J: run once in a disposable local clone with `HEAD` = `main` = `961e1f4`. `pnpm check` passed with 285 tests and 0 format files, the floor counted as anchored, and the floor's bytes are identical at both clone refs, with values equal to §5. This is an implementer run, not the integration check: the verifier still compares the floor at the exact commit that is merged.)* *(3K: the 0535 review reproduced it independently, and Codex accepts it (15). The real `main` still has no floor (run 6). At integration, `git rev-parse <merged commit>:scripts/quality/coverage-floor.json` must give `0036eedaf6de63003294b9ff7aa3ef157ab57c74`, and its values must still equal §5.)*
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
- *(3K)* **PL-1: H1, the skip-guard gap, high, PL-1's to fix.** This comes from Codex's brief, and phase 3K opened none of PL-1's files.
  - **The gap:** a single change can skip or disable a required CI job or step, and its check then passes without running the gate. The ways in are a job or step skip, `needs`, `continue-on-error`, the default shell, the event and a path filter.
  - **Why QA-9's pins can't catch it:** they run inside the `check` job they protect *(inference by reading)*.
  - **The fix, in PL-1's lane:** a separate required `ci-guard` workflow. It cross-checks the workflows, fails closed and catches a single disabling change. It doesn't stop a coordinated edit of every guard, which is R2.
  - **Future protection:** all three required checks, `check`, `backend` and `ci-guard`, in branch protection and in the hosted proof.
  - **QA-9's part:** no root wiring change now.
- *(3I, from the 0405 review, for the lane that owns `scripts/backend/`, through Codex; not QA-9's):* `verify-gym.mjs:51` checks only that gym staff can't **read** health rows. Staff **writes** are covered only by the generic forged-write check at `verify.mjs:35`, not by a staff-role test. The rule is PRD 16.1 and frozen003: gym staff never read or write a member's private health data, whatever the consent. That rule overrides any stale agent text saying otherwise, and the override stays in force until QA-2 is merged and the checkout the agents launch from is corrected. Read only by the reviewer; phase 3I didn't open those files.
- *(3F)* **QA-10:**
  - **Split** the 80-line test at `packages/domain/src/contract.test.ts:676` into its three cases, as Codex assigned it (phase-3E review finding 3). The number of `gitBaselines` calls stays the same.
  - **After any domain test change,** compare the branch numerator and denominator, not only the pass. At 273/313 the margin is one newly uncovered branch (R19(b)).
  - **Proposed, for Codex to decide:** a case where `HEAD` resolves to no commit, which would kill the surviving `break` at `snapshot-contract.ts:145` (§14, mutation 3c).

## Requests for other lanes' files

*(3N-prep)* **To S8 Member backend (`verify.mjs`) and S2 Backend (`verify-gym.mjs`, `verify-freezes.mjs`, `verify-freeze-projection.mjs`), through Codex. Codex assigns `local-stack.mjs` and the root `backend:test` line, which docs/23 §5 doesn't list. Proposed lane: "backend harness: provable cleanup and a bound target".**
- **The ask:** F1–F6 in [phase-3n-readiness.md](../../../evidence/QA-9/phase-3n-readiness.md) §1, each test-first on fakes:
  - every cleanup result checked, `gyms` and `body_entries` included, and a cleanup failure makes the exit non-zero;
  - a check by the run's own IDs that zero rows remain;
  - timeouts, and cleanup on a signal;
  - the guarded `supabase status` parse;
  - a target bound to proven container IDs, which can be injected;
  - a tag for each run in every synthetic email and gym name.
- **Merge it with MB-1's carried requests** for the same files (MB-1 `handoff.md:78–83`), so there is one executor.
- **Why:** as written, a 0 exit doesn't mean the shared stack was cleaned, and no outside check can undo a leftover or a printed key fragment. QA-9's `backend:test` waits for it.
- **The rule:** nothing is weakened, no assertion is removed, and no threshold moves.

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

## Decisions forced in phase 3N-prep

- **A fix lane, not a run inside an outside check.** The census and the brackets would detect every gap, but they couldn't undo leftovers after a kill or prevent a printed key fragment. With manual cleanup forbidden, a detected failure would leave rows on a stack other lanes use. So the decision is that the harness needs the fix lane before any shared write. Running the unchanged harness inside the outside checks is recorded as considered and not recommended.
- **MB-1's M1 read is used, not copied.** QA-9 lists the four facts it needs (P1–P4) and cites MB-1's command forms. It keeps no second command list. Its own Q6 adds only the start time and restart count, so the IDs can be bracketed around the gate.
- **Counts only, and the stack's state isn't assumed.** The census prints no email, name or ID. C0 is recorded as found, and leftovers from earlier runs are neither assumed absent nor removed.
- **The two 0905 finals were named, not renamed or edited.** Their hashes match before and after. The mislabelled name is as the coordinator saved it, and the file index says what each file is.
- **Network wasn't asserted.** Nobody checked whether the CLI makes non-loopback calls during `status`. So the 0905 plan's "loopback and the Docker socket only" is recorded as not verified.
- **The pasted Python launcher wasn't run.** It would have started sessions, which the brief's "no subagents" forbids.

## Decisions forced in phase 3M

- **The raw finals stay as written.** The 0635 report's line 19 ("`git diff --check` was clean") and line 21 (the inference from phase 3J's count) are annotated in the checkpoint's file index, not edited. The 0705 review is unchanged too, including its citation `checkpoint.md:348`. The sentence it means was this file's line 348, and it was fixed there.
- **The raw output wasn't re-grepped, re-counted or re-hashed.** Phase 3L's count of it was denied as a script, and the 0705 review's `shasum` of it was denied. The brief forbids retrying a denied operation by another tool or form. So the figures in Lows 2 and 3 are the review's, inherited. Phase 3M only inspected the copy's line offset: before the first cut, a copy line is its raw line plus 121, which places each cited raw line in the copy.
- **Corrections are tagged in place.** The old figures stay struck through beside the new ones, and the outputs file's header says which lines changed. The first cut marker inside the copied block was changed in place, because it is phase 3L's own marker, not tool output.
- **Phase 3L's final state is inherited, not re-run.** Its checks happened in phase 3L's session, and only the 0705 review's reading of that transcript records them. Phase 3M's own run 7 adds one executed fact: `d57c3810…` was still the outputs file's hash before the first edit.
- **The commit takes all eleven paths.** They are all owned QA-9 records under `docs/evidence/QA-9/` and `docs/plan/runs/QA-9/`. The brief names the 0635 and 0705 finals, and nothing else was uncommitted.
- **The commit's results stay uncommitted,** as in phases 3D, 3G, 3H and 3I, because results can't be in the commit they describe.
- **No attribution trailer,** following the user's global rule (attribution is disabled) and the earlier QA-9 commits.

## Decisions forced in phase 3L

- **The gate ran in this worktree, not in the kept clone.** The brief names "the current goal branch", and allows no clone or install. The work tree held only uncommitted Markdown, which the format step doesn't check and no test reads.
- **One background run, with no edit until it finished,** as in phase 3J, so no tool timeout could force a second run.
- **The output is copied with two cuts, not whole.** The cuts are the TAP lines of the 97 quality tests and the 22 plan tests. Every count and summary line is kept, and the raw file is identified by its sha256. Phase 3J's whole copy needed a mechanical comparison, and this phase's count script was denied.
- **The coverage rows' trailing spaces are left out of the copy,** as in phases 3G and 3J. ~~That they were in the raw output is inferred from phase 3J's count of the same rows, not counted here.~~ *(3M, 0705 review Low 3: they weren't phase 3J's rows. The review cites this sentence as `checkpoint.md:348`; it was this file's line 348.)* **7 trailing spaces removed, at raw lines 96, 98, 100, 101, 103, 104 and 107, by the 0705 review's Grep.** Phase 3J's 5 were different rows. The figures are the review's, inherited, and phase 3M didn't re-count the raw output.
- **No retry of a denied form.** `which node` and `pnpm --version` were read-only orientation, and their facts came from permitted reads already made. The `node -e` count was a script, so its sequence ended.
- **No exports.** They are inherited from the 0405 review, and `961e1f4` adds only Markdown since then, so no new reason exists.

## Decisions forced in phase 3K

- **No evidence summary file.** Phase 3K ran no gate and has no output to copy. Its few read-only results fit in the checkpoint's "Commands run in phase 3K", so only the two records changed.
- **Low 3's fix is the exact path, written in.** No current record ever said `…/repo`; only the coordinator's brief did. So nothing old needed correcting. The full `/var` path and its `/private/var` real path are now in the current records, for future briefs and allowlists.
- **Two read-only checks were run, not only inherited.** These are the floor blob at `HEAD` and the real `main`'s missing floor (runs 5–6). With them, the records' floor claims rest on this phase's own runs as well as the review's.
- **H1 was worded from Codex's own briefs.** Phase 3K read Codex's PL-1 launch brief in `/tmp`, read-only, to state H1 accurately. It didn't open PL-1's worktree, review or files, and it changed no wiring.
- **The raw finals stay as written.** The 0505 report's "five uncommitted paths" was true when it was written. The checkpoint's Git row gives today's seven, and tags phase 3J's stale "three untracked".
- **The pasted launcher code was not run.** The brief arrived with a Python launcher for four lanes. Running it would have started sessions, which the brief's "no subagents or dispatchers" forbids.

## Decisions forced in phase 3J

- **No `tmp/` folder, and no `TMPDIR` change.** The brief permits a `tmp/` folder, but the allowlist has only the exact `pnpm check` form. A `TMPDIR=` prefix could have been denied, and by the brief's rule that would have ended the gate's sequence. So the gate used the session's default per-user temporary folder for its own scratch fixtures, and `tmp/` would have stayed unused. The outputs file says so.
- **A `cd` into the clone,** because the allowed install and gate forms take no `-C`. `cd` was allowed, and a `process.cwd()` print confirmed the folder before the install. All Git commands named their repository with `-C`.
- **Read-only listings with `node -e`.** The brief asks for the folder to be shown empty. Glob shows files only, so a `readdirSync` listing, which also shows hidden entries and empty folders, was used. `node` is on the allowlist. No denied command was replaced by it: the first command's denial covered only an orientation listing of this worktree, which Glob then did.
- **One background run of the gate,** so no tool timeout could cut it short and force a second run. Nothing was edited until it finished.
- **The raw output is copied whole,** with only the five trailing spaces removed, as Codex chose for the same rows in phase 3G, so a later commit's `--check` stays clean. A mechanical comparison shows the rest equal.
- **No commit, no cleanup.** The brief forbids both in this phase. The clone, its `node_modules` and both empty folders are kept.
- **The pasted launcher code was not run.** The brief arrived together with a Python launcher for this phase and a QA-2 phase. Running it would have started sessions, which the brief's "no subagents or dispatcher" forbids. The QA-2 lane's terms, including its global-config low, are QA-2's, and no QA-2 file was opened.

## Decisions forced in phase 3I

- **Stopped at the denied `mkdir`, with no switch of form.** The brief says to stop a sequence a runtime rule denies, and not to replace its writer. Git can do without the three folders (`--template=`, `core.hooksPath=/dev/null`, `TMPDIR` set to the folder itself), but switching to that after the denial would have changed the guarded design to get round a control. That choice is Codex's for the resumed proof.
- **The two `final-…` files were named, not renamed.** The brief asks for them to be named, so the Reviews row and file index say what each is. Their filenames and contents are as the coordinator saved them.
- **Annotations went outside the verbatim text.** The module-count note sits after the export block in `phase-3h-check-outputs.md`, and in the checkpoint's file-index row for `final-2026-10-27T0335Z.md`.
- **The floor was read, not proved.** `git show` at `961e1f4` needed no clone, so it was run and labelled as inspected. It isn't the `HEAD` = `main` gate.
- **The commit time stands in for timestamps.** `date -u` was denied, and the commit's own time is the one recorded.
- **No attribution trailer,** following the user's global rule and the three earlier QA-9 commits.

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

- **Bash is allowlisted to `rtk proxy` forms.** A compound command, a bare `rtk git status` and `rtk proxy wc -l` were denied, and none was worked around. *(3I)* So were `rtk proxy mkdir`, which stopped the disposable-clone sequence, and `rtk proxy date -u`. A brief that needs a folder made outside the worktree has to name an allowed form.
- *(3I)* **A fresh clone isn't an existing `node_modules`.** `onlyBuiltDependencies` lets `supabase`'s `postinstall` run on a fresh install, and that script downloads a binary. Read the workspace's build allowlist before any install in a new folder.
- **Results can't be in the commit they describe.** The checks run on the staged state and on the commit, so their results are written after the commit and stay uncommitted.
- *(3E)* **Coverage counts that coincide.** A correct test that covered the missing branch still failed the gate (271/312), because V8 merged an equal-count range. Check the denominator too, not just whether the branch is covered.
- *(3E)* **A touched file is formatted whole.** Editing an S8 file pulled the whole file into the format step.
- *(After the commit)* **A threshold measured with nothing committed.** Every QA-9 measurement ran with `HEAD` = `main`, so a coverage branch that depends on Git state stayed hidden until the first commit. The committed-boundary check found it, which is what that check is for.
