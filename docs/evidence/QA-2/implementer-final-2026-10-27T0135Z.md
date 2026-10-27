I fixed all five 01:05Z findings in the docs and the unapplied patch. QA-2 is still not Done: box 2 is met in uncommitted files only, and boxes 1 and 3 are open.

**What ran:** one command, the permitted `rtk proxy git apply --check --verbose docs/evidence/QA-2/claude-corrections-UNAPPLIED.patch`, on the final file. It printed "Checking patch …" for all 8 files and no error. Nothing was applied. My first Bash call (`rtk proxy git … status --short`) was denied and I didn't retry it. No M, W or D command, no `.claude/` write, no git change and no edit to a historical final.

**High 1, when the override can stop.** Applying the patch here changes only this worktree, so MB-1's worktree and the main checkout keep the wrong consent bullet. SESSION-PROMPT now says the override stays until QA-2 is merged to `main` **and** the checkout launching the reviewer has the corrected `security-reviewer.md`. Four read-only checks, P1–P4, decide this before each launch:
- P1: the old bullet is gone from that checkout's `security-reviewer.md`.
- P2: the corrected bullet is there.
- P3: the old bullet is gone from `main`'s committed copy.
- P4: QA-2 shows as Done.

Any other result, a skipped check, sub-agents started for another directory, or an agent file that changed mid-session keeps the override. The pasted step 5 copy is now unconditional. The checks are not run yet. On today's files P1 should find line 21, so the override stays.

**Medium 2, missing commands.**
- Added M21, `git diff main...HEAD` in the worktree, to run after the commit.
- D19 now runs integrate-goal's milestone commit as written and records its exit code. The run instructions turn D19 on (`QA2_BOX3_D19=1`).
- Added run-plan's exact claim and review commands (D2b, D6b), so no equivalence ruling is needed.

Checking every command against its skill line turned up more mismatches, which I also fixed:
- D1, D2, D6, D18 and D19 had flags or values that didn't match the skill text.
- run-goal's by-hand Done command was missing; it is now D13b.
- The gate commands now use integrate-goal's `cd <worktree> && …` form.

Please check these extras too, since the reviewer didn't ask for them.

**Low 3.** Before the first clone, the script now stops if global, system, effective or environment config sets a hooks path or template folder, or if `git config` exits unexpectedly. It only detects, and changes no config. One gap remains: a hook coming from an `includeIf` that only matches inside the new clone, or from git's built-in template folder, could still run during the clone. The checks after the clone still stop it before any commit.

**Low 4.** The run instructions print the literal `mktemp -d` path, run `test -f` on it, then run that literal path. No shell variable carries between calls, and the same one-call rule now covers the read-only command list.

**Low 5.** No "today" is left in any hunk. Live mode now needs a real `next` branch in `status.mjs`'s command dispatch, not any mention of the text; there are 0 such branches now. The patch is still 8 files and 16 hunks; I recounted each edited hunk by hand. Run-plan's hunk headers are now `-10,9 +10,15`, `-41,32 +47,34` and `-131,8 +139,9`.

The records are updated: stale-paths has a new §11 for these findings, and the handoff and checkpoint are current. I ran no sub-agent reviews, per your "no subagents" rule; the handoff has a self-review instead. Next is the fresh independent review, then your authorised apply, then commit, rebase, the M/W commands, the disposable-clone script, the three reviews and a verifier.

```
GOAL: QA-2
BRANCH: codex/fitlog-qa2-docs
HEAD: 5fefc31 (all changes uncommitted)
HANDOFF: docs/plan/runs/QA-2/handoff.md
BOXES: 1/3 Done-when boxes met
STATUS: blocked
NOTES: Phase5 fixed all 5 01:05Z findings in docs/patch only; 8-file/16-hunk patch passes git apply --check once on final file (not applied); override stays until QA-2 merged to main AND launching checkout's security-reviewer.md corrected (read-only checks P1–P4, not yet run); M21, D2b/D6b/D13b, D19 milestone commit added (run with QA2_BOX3_D19=1); pre-clone hook detection and literal-path run steps; no M/W/D run; protected apply needs coordinator auth; fresh independent review next.
```
