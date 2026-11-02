# QA-2 phase 13: independent read-only review

I found no Critical or High issues. There are two Mediums and five Lows. QA-2 is **not Done**: box 3 is open, D is still blocked, and integration can't pass. I edited, applied, staged and committed nothing, and I did not run the launcher you pasted.

## Findings

**P13-1 · Medium · `.claude/agents/security-reviewer.md:34` vs `:42-43` (F2)**
- **Defect:** F2 contradicts its own bullet. Line 34 (F1, committed) says the erasure job may delete consent events. F2 (`:43`) says deleting them "even in the erasure job" is a finding. Because only deleting is flagged, never keeping, F2 in practice picks an interim answer to R-4.
- **Scenario:**
  - MB-7 builds 003 §3.3 step 4, deleting the erased account's source rows, consent events included, as the trigger allows (003:157-160).
  - A reviewer who follows `:34` passes it; one who follows `:43` flags it.
  - The only change that clears `:43` is to keep consent events after erasure. That is R-4's other answer, which is reserved to the owner and counsel under DEC-04 (003:1239; PRD:1893), and it sits against PRD §22.3's 30-day erasure default (PRD:1515-1516).
  - The text says it decides nothing legal, but the rule it sets does.
- **Fix:** make the interim rule symmetric and tie it to `:34`. For example: "Until then, a change that settles it either way, either the erasure job deleting the erased account's consent events or keeping them after erasure, is a finding that names R-4. Deletion by anything else, or of another account's events, stays a finding as above."
  - Do this before phase 13 is committed, by a writer route Codex names. I have not prepared it.
- The L-1 half of F2 is correct. Create, retry and reanalyse match 003:951-952. The exceptions for a ready proposal and manual food match PRD:541-543 and 003:957.

**P13-2 · Medium · `stale-paths.md:2847-2858` (§20 (d), M22, M23); `handoff.md:210`; integrate-goal `SKILL.md:10` and `:63`**
- **Defect:** Codex's ruling covers pre-existing untracked **and ignored** paths. M22 lists no ignored paths, there is no overlap check for them, and the gap is filed as a Low with "QA-2 adds no check".
- **Scenario:**
  - The main checkout holds an ignored file, or an ignored folder, at a path the branch brings in.
  - M22 doesn't show it, the overlap comes out empty, and the integrator passes.
  - Step 3's `git merge --ff-only` then silently replaces the file, because overwriting ignored files is git's default. I expect this from git's documentation; I did not observe it.
  - That breaks the skill's own "nobody's work overwritten" (`:10`) and EXECUTION.md:41, which says ignored environments were preserved.
  - Path comparison is also by exact string. On macOS (usually case-insensitive), an existing `Error.log` and an incoming `error.log` pass the check but are the same file on disk.
- **Fix:** the read-only contract below. It leaves step 3 unchanged, so D's forms stay the same. Adding `--no-overwrite-ignore` to step 3 would be a second safeguard, but it changes a form D tests and would need D reviewed again.

**P13-3 · Low · `stale-paths.md:2853`, `:2858`**
- **Defect:** three problems with the new M rows:
  - "They count once the skill edit is on `main`" conflicts with the matrix order. The verifier (step 13) comes before integration (step 14), so read as "after the merge", box 3 could never close.
  - M23's expected "48 paths" is commit 2's set. M23 will only run after phase 13's commit, which adds at least four paths.
  - M23 uses the moving `main` ref, and git's rename detection lists only a rename's new path.
- **Fix:**
  - Run M22 and M23 in the main checkout from the branch's skill text, before the verifier.
  - Write M23 as `<H>...<T>` with both hashes typed out, plus `--no-renames`.
  - Take the expected set from the commit's actual paths.

**P13-4 · Low · `stale-paths.md:2837-2843` (resume rule (b2))**
- **Defect:** the resume rule compares the recorded `MAIN_BEFORE` with `H`. But rule (b) defines `H` as `main` just before *this* launch, which after an earlier fast-forward is the new `main`.
- **Scenario:** a resume after a successful fast-forward never gets a match, so it always refuses and never reaches steps 4–7.
- **Fix:** name it `H_orig`, the `H` passed to the interrupted run and recorded with its brief. Also state what happens if `main` has moved past the branch tip since.

**P13-5 · Low · `stale-paths.md:2829-2830` vs the denied skill text at `:2788-2802`**
- **Defect:** the matrix says the integrator re-takes the inventory and overlap straight before the fast-forward. The denied text checks them only at the preconditions, and the edits that were planned but not attempted don't include that re-check either.
- **Scenario:** the gates can run for a long time, and another lane can write into the main checkout meanwhile.
- **Fix:** put the re-check into the next skill-edit scope, alongside the second `MAIN_BEFORE` check.

**P13-6 · Low · `handoff.md:140`; stale-paths §20 *Inventory***
- **Defect:** the inventory is now out of date. My status read shows five untracked files, not four. The extra one is `final-2026-10-27T0935Z-collected.md`, phase 13's own final, saved after call 21.
- **Naming risk:** in the 09:05Z pair, "-collected" marked the review. Here the same suffix marks an implementer's final, which repeats the 09:05Z misnaming risk.
- **Fix:** the stage phase re-takes the inventory (already planned), records this file's role and SHA-256, and keeps it verbatim with no rename.

**P13-7 · Low · `stale-paths.md:2466`, `:2447`, `:2454`; handoff *Left undone* item 7**
- **Defect:** the drift and pin checks are written as `git diff --quiet … ; echo $?`. That is a compound command, against the separate-single-command rule, and compound forms have been denied before. The form is inherited from phase 12.
- **Fix:** run `rtk proxy git diff --quiet 5fefc31 <M_D> -- <five paths>` on its own and read the exit code. `rtk proxy` passes exit codes through: my own `git config` call returned exit 1.

## Blockers
- The integrate-goal Edit was denied, so M-1 and L-4 exist only in the matrix. The committed precondition 2 still refuses on any untracked path, so integration cannot proceed.
- D is blocked: there is no approved route for its run.
- P1 and P2 have not run on the post-F1 or post-F2 file. P3, P3b, P4 and P5 have never run.
- Not yet run: M16–M18, M20–M23, the rebase, the M re-runs, W1–W6, the three reviews and the verifier.
- The privacy override stays in every launch (PRD §16.1; 003 §6) until QA-2 is integrated **and** the launching checkout is corrected.

## Recommended read-only inventory and check contract (not executed)
Codex runs these straight before the launch, in the main checkout. Each is a separate call using the established `cd /Users/Adya/personals/fitness_app && rtk proxy` prefix:
1. `git rev-parse main`, recorded as `H`.
2. `git rev-parse codex/fitlog-qa2-docs`, recorded as `T`.
3. `git --no-optional-locks status --porcelain=v1 --untracked-files=all --ignored=matching`. This prints tracked changes, every untracked file (`??`) and each ignored entry (`!!`; a fully ignored folder appears once, ending in `/`).
4. `git config --get core.ignorecase`. If it prints `true`, compare paths case-insensitively.
5. `git diff --name-only --no-renames <H>...<T>`, which gives the incoming paths.

Refuse unless all of these hold, and record the five outputs, the tolerated set and the empty overlap:
- The only tracked changes are `docs/plan/status.json` and `docs/plan/activity.json`, plus the goal's own tracker entry when resuming.
- Every `??` and `!!` entry appears in the brief's tolerated set exactly as printed. Anything else is unexpected.
- For each tolerated entry p and incoming path q: p is not equal to q, q is not inside p, and p is not inside q.
- Every command exits 0, and every output line parses.

The integrator repeats steps 1, 3, 4 and 5 at its preconditions. It repeats them again after its rebase, straight before the fast-forward, using `<H> <T′>` (T′ is the rebased tip) and requiring `main` = `H`. Nothing is stashed, reset, cleaned, moved or deleted, whether tolerated or not.

## Smallest next correction scope (named here; none of it is implemented)
1. **The integration blocker.** One `.claude/` phase, with a writer Codex names in advance, for exactly two files:
   - `.claude/skills/integrate-goal/SKILL.md`:
     - preconditions 2–5 and the refusal paragraph, extended to ignored paths and case-insensitive comparison;
     - the `MAIN_BEFORE` check before step 1, and again straight before step 3 together with the inventory re-check;
     - `H_orig` in the resume section;
     - the milestone preconditions.
   - `.claude/agents/goal-integrator.md:29`.

   That phase needs a fresh independent read afterwards and includes no P, M, W or D proof, staging or commit.
2. **The F2 fix (P13-1).** One sentence, by the same named writer, before phase 13 is committed.
3. **Records only (P13-3 to P13-7).**

Until item 1 lands and is reviewed, the matrix rules are plans only.

## What holds
- **F2 as applied:** the working diff is exactly the patch's single hunk, six lines added and none removed (*executed* `git diff`; *inspected* patch). Its citations check out against 003 and the PRD (*inspected*).
- **The privacy rule is untouched:** F2 changes nothing in the privacy bullet (`:22-29`) or in "No purpose consent opens staff access" (`:38-39`) (*inspected*).
- **L-6 hash chain holds:** nothing could have filtered `git hash-object`. There is no `info/attributes`, no `~/.config/git/attributes`, no `.gitattributes`, and `core.attributesFile` is unset (exit 1, *executed*). Phase 8's own link from its hash to its apply is *inherited*.
- **L-2 and L-3 designs are sound:**
  - The subject lookup matches the subject exactly rather than using `--grep`.
  - The drift check reads `M_D` and requires D's pin to equal it, which closes the gap between check and clone. `M_D` is read from the same shared `main` ref that D clones.
- **`main` has not touched the pinned paths:** `main` is `c8a5d57`, the merge base is `5fefc31`, and since then `main` changed only `EXECUTION.md` and one supervision file (*executed*). This is an inspection, not the formal drift check.
- **Records:**
  - The history is correctly stated as phases 1–11.
  - The D-script Low is restored.
  - The script's fences are still at `:917` and `:1149`.
  - `integrate-goal/SKILL.md` is unmodified, consistent with the denial (*executed* status).

## How each item was obtained
- **Executed by me**, as separate read-only `rtk proxy` calls: `git status`, `log`, `diff`, `diff --stat`, `merge-base`, `log` over both ranges, `diff 5fefc31 main`, and `config --get core.attributesFile`. These were typed without `--no-optional-locks`, so they may have refreshed this worktree's index cache. No content, staging or ref changed.
- **Inspected** with Read, Grep and Glob: F2, the agent file, integrate-goal, goal-integrator, PRD §10.3/§16.1/§22.2–22.3/§27, 003 §3.3/§3.9/§4.14/§11, stale-paths §18–§20, the handoff, the checkpoint, the 09:05Z and 09:35Z files, and EXECUTION.md.
- **Inherited:**
  - every SHA-256 value (`14d71b17…`, `4f9ed884…`, and the 09:05Z files);
  - the `--check` and apply outputs;
  - the Edit denial;
  - the L-2 result `173eff04…`;
  - the main checkout's untracked files;
  - the `claimed` status.
- **UNRUN:**
  - P1–P5 and P3b; M1–M23; W1–W6;
  - D and its drift and pin checks;
  - the rebase, the three reviews, the verifier and integration;
  - any hash recomputation, and any read of the main checkout.
- **Not run:**
  - **The launcher you pasted:** it would have started three background "don't ask" sessions from `/tmp` JSON files I didn't read.
  - **Sub-agents:** none were used.
