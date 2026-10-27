The D7 gap is closed in the plan. In stale-paths §6.3, D7's setup line is now `git -c core.hooksPath="$D/no-hooks" worktree add "$D/wt" plan/qa-2-box3-proof-renamed`. It reuses the empty folder that Setup makes before the clones, so the `-c` is in effect before the worktree is created. No Git config is written. Nothing was applied, committed or run as proof, and QA-2 is not Done.

**What ran.** One command: `rtk proxy git apply --check --verbose docs/evidence/QA-2/claude-corrections-UNAPPLIED.patch`, once, after all edits. It passed with eight "Checking patch" lines and no error. Nothing else ran or was attempted. Every other check was done by reading files and searching them.

**The D7 change**
- **Skill commands are unchanged.** No skill or agent contains `git worktree add`; the only worktree command in them is integrate-goal's `git worktree remove` (D16), which keeps its written form.
- **Only `worktree add` gets `-c`, as you decided.** D7's `git switch main` stays as it is. It runs in `$D/repo`, which is already checked after the clones.
- **The `$D/wt` check after D7 stays.** D8 and D11 are skill commands and run there without `-c`.
- **Updated to match:** "What makes it safe", the D7 expected-results row and the skill-forms note. What `-c` does for D7 comes from git's documentation; no reviewer has checked it and nothing has been run.

**Records reconciled**
- **Deferred follow-ups.** The six checks' fixed-text matching, and the unchecked fsmonitor, filter and packObjectsHook config, are now labelled deferred follow-ups. No checks were added.
- **Open request closed.** The handoff's request asking you to decide D7 is now a closed note. The decision is logged under "Decisions forced".
- **Collected report.** The 02:35Z implementer final is now in the file list, kept as written. Its D7 question is marked answered.
- **Earlier phases.** Phase 5's own records keep their wording and get a phase 6 note.
- **Phase 6 summary.** A new §13 in stale-paths lists what this phase changed and what it left alone, and §7 gets a short table of this phase's search checks. The checkpoint (steps 32–35) and the handoff are updated.
- **Left untouched:** the patch (still 8 files and 16 hunks, at the same line numbers), SESSION-PROMPT, `.claude/` and all status files.

Your message also included the Python launcher for three tasks (the MB1 review, the QA9 review and this QA-2 fix). I did only the QA-2 task and did not run the launcher.

```
GOAL: QA-2
BRANCH: codex/fitlog-qa2-docs
HEAD: 5fefc31 (all changes uncommitted)
HANDOFF: docs/plan/runs/QA-2/handoff.md
BOXES: 1/3 Done-when boxes met
STATUS: blocked
NOTES: Phase 6 docs-only: D7 setup `git worktree add` now uses the same one-process -c core.hooksPath="$D/no-hooks" (folder made in Setup first); skill commands, patch (8 files/16 hunks), SESSION-PROMPT and .claude/ unchanged; text-match and fsmonitor/filter/packObjectsHook labelled deferred follow-ups; D7 request closed; git apply --check passed once on the final file and nothing else ran; apply/commit/M/W/D still need authorisation; fresh independent review next.
```
