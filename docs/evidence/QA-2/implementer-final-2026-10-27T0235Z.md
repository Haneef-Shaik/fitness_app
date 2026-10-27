All five 02:05Z findings are fixed in this one docs-only phase. Nothing was applied, committed or run as proof, no protected file was written, and QA-2 is not Done.

**What ran.**
- `rtk proxy git apply --check --verbose docs/evidence/QA-2/claude-corrections-UNAPPLIED.patch`, once on the final file. It passed: eight "Checking patch" lines and no error.
- My first call, a read-only `rtk proxy git status --short`, also ran. I made it before applying this phase's "only `git apply --check`" rule to it. It may have refreshed the worktree's index stat cache, but it changed no tracked content, staging or ref. I've recorded it in the handoff, the checkpoint and stale-paths.
- `rtk proxy cat` on RTK.md was denied. I didn't retry it and read the file with Read instead.
- No sub-agents were started.

**The fixes**
- **Medium 1:** in the D script, `mkdir "$D/no-hooks"` comes first, then the two setup clones run as `git -c core.hooksPath="$D/no-hooks" clone --template= …`. These are setup, not skill commands, and no Git config is changed. Hook config is still checked before the clones, now also stopping if `GIT_CONFIG` is set. After the clones it checks the effective hooks path in both `origin.git` and `repo`.
  - My re-read found one more gap of the same kind: D8 and D11 run git in the worktree `$D/wt`, so the script now checks there too, after D7 creates it.
- **Low 2:** checkpoint step 14 now states the real rule: the override stays until QA-2 is merged and the launching checkout is corrected. The entry gate records QA-2 as `claimed`, taken from your task and the 02:05Z reviewer's reading (inherited, not read by me).
- **Low 3:** SESSION-PROMPT has two new checks. P3b looks for the corrected sentence in `main`'s copy of `security-reviewer.md`. P5 (`GIT_OPTIONAL_LOCKS=0 git -C <root> diff --quiet main -- …`) requires the launching checkout's file to equal `main`'s. The override text stays unless all six checks pass.
- **Low 4:** the order is now D1, D2b, D1 again, D2, and D13, D6 again, D13b. Every claim and Done form is now a real status change, so the needs and Done checks run.
- **Low 5:** one sentence now explains why D1 and D6b type `node scripts/plan/status.mjs` where run-plan writes a bare `status.mjs`.

**The patch** is still 8 files and 16 hunks, and no hunk changed. I reworded three header lines in place (:1, :8 and :19–20) with the same line count, so their "P1-P4" isn't left stale and every cited patch line number still holds.

**Decision for you:** should D7's `git worktree add` (also setup) get the same one-process `-c`? Your acceptance named only the two clones, so I left D7 alone. Until then, a hook from an `includeIf` that matches only worktree git dirs could run during D7, and I've recorded that as a Low.

**Other Low residuals:**
- The six checks match fixed text, so a reworded consent line committed to `main` itself would still pass them.
- Other config that runs commands (`uploadpack.packObjectsHook`, `core.fsmonitor`, filter drivers) is not checked.

What `-c` and `--template=` do comes from git's documentation and the reviewer's reading. I haven't seen it run.

```
GOAL: QA-2
BRANCH: codex/fitlog-qa2-docs
HEAD: 5fefc31 (all changes uncommitted)
HANDOFF: docs/plan/runs/QA-2/handoff.md
BOXES: 1/3 Done-when boxes met
STATUS: blocked
NOTES: Phase 5 fixed all five 02:05Z findings in docs only; patch hunks unchanged (8 files/16 hunks, 3 header lines reworded) and git apply --check passed once on the final file; setup clones now -c core.hooksPath+--template=, with GIT_CONFIG stop and hooks checks in repo/origin.git/wt; six override checks (P1–P5+P3b); D2b/D13b reordered so their checks run; a read-only git status --short also ran (disclosed); D7 -c is Codex's call; apply/commit/M/W/D still need authorisation; fresh independent review next.
```
