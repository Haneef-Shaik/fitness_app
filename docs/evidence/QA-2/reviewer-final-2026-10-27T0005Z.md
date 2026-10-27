# Independent reviewer final

Session: `d3a1e0c5-e376-4236-a060-72fb9aa61057`

**QA-2 correction review: the patch is ready to apply, but the command proof plan is not safe to run yet**

The 15-hunk patch is correct and matches its target files. The privacy text matches PRD §16.1 and 003 §6. The command proof phase is not ready: the disposable-clone guards in stale-paths §6.3 cannot stop anything (High 1). Separately, the SESSION-PROMPT privacy override never reaches the main by-hand path (High 2). Applying the patch is the real fix for that. Nothing is Done: box 1 is open, box 2 is met only in uncommitted files, and box 3 is open.

**What was run.** The one command I was allowed, `git apply --check --verbose docs/evidence/QA-2/claude-corrections-UNAPPLIED.patch`, was refused because Bash is denied ("don't ask" mode). I did not retry it or work around it. So the pass on the 15-hunk patch is Codex's own result, and I did not reproduce it. The 23:05Z reviewer's pass was on the older 13-hunk version. Everything below comes from reading files. No tests ran.

## Findings

**High 1 · `docs/evidence/QA-2/stale-paths.md:390–395` (guards), also :379–388, :397–399, :403–421 (the disposable-clone plan)**
- **Defect:** the two guards only print "STOP" and always succeed. The plan is safe only if `$D` and `cd "$D/repo"` carry over from one command to the next, and shells that start fresh for each call keep neither.
- **Failure scenario:** the coordinator runs D1–D19 one call per table row. From the second call on, the shell is back in its start folder and `D` is empty.
  - Guard 1 becomes `case … in /*)`, which matches any path. Guard 2 prints STOP but still succeeds, so `guards && D13` runs D13.
  - D13, `node scripts/plan/status.mjs set QA-2 done`, then writes to the **live** `status.json`. The script finds its files from its own location, and QA-1 and AR-1 are done, so `setStatus` does not refuse it (`lib.mjs:435–438`). QA-2 would be marked Done with no verifier.
  - D19 would declare MS-0 Done with `--override`, D1 would reset QA-2's live claim, and D17 `git push origin main` would push to the real remote.
  - There is a second problem on macOS, found by reasoning only, not run: `/tmp` links to `/private/tmp`. Inside the correct clone, `git rev-parse --show-toplevel` therefore prints `/private/tmp/…`, and guard 1 prints a false STOP every time. That teaches the operator to ignore it.
- **Fix:** put D1–D19 in one script, run once, with `set -euo pipefail`.
  - Set `D="$(cd "$(mktemp -d /tmp/fitlog-qa2-box3.XXXXXX)" && pwd -P)"` and `cd "$D/repo"` inside the script.
  - Use a `guard` function that compares against the `pwd -P` path and exits 1 on any mismatch, and call it before every mutating line.
  - The commands themselves keep their written form.

**High 2 · `docs/plan/SESSION-PROMPT.md:29–38` vs :3–8; launch points `.claude/skills/run-goal/SKILL.md:126`, `.claude/agents/goal-implementer.md:37`**
- **Defect:** the override sits below the line that :7–8 says is pasted only "if skills are unavailable". By-hand sessions are told to type `/run-goal`, and run-goal §7 launches `security-reviewer` with no override.
- **Failure scenario:** someone follows :3–4 and types `/run-goal G16.api`. At §7 the reviewer obeys `security-reviewer.md:21` and passes a staff read gated on a consent flag. The records claim this path is covered (handoff :7 and :125, stale-paths :467 "override in place for by-hand sessions"), so nobody adds the override by hand.
- **Fix:** apply C4, which is the only real fix, and the patch is ready. Until then, move the override text into the preamble above the line. Correct those three records to "paste fallback only; `/run-goal` and orchestrated launches need the coordinator to state it".

**Lows, all for QA-2**
1. **`SESSION-PROMPT.md:48`, step 8.** It appends the handoff to the tracker with no link re-basing clause, the same gap C17 fixes in run-goal. This is the follow-up you named; one clause fixes it.
2. **Patch line 74.** "A staff read gated on consent is a critical finding" leaves out writes. PRD §16.1 (:1052) and SESSION-PROMPT :38 say "read or write". Add "or write"; if you edit the patch, re-run the check.
3. **Patch lines 225–231 (run-plan Modes).** Nothing observable tells a session that "phase O2" has arrived. Meanwhile `plan-orchestrator.md:40–42` still decides the mode by whether `status.mjs next` exists, which conflicts with "never run it, not even to watch it fail" (stale-paths :317). It is harmless today: the call exits 1 after reads at most. Either name a check that only reads, or record this under C11.
4. **run-plan :44–45, with patch :225–229.** Advisory mode is now "every cycle today" and still runs step 2. Step 2's "Nothing exists for it" branch runs `status.mjs set <ID> not started`, so a cycle that cannot see a Codex lane's run could reset a live claim. Add "and change no status" to the advisory sentence.
5. **Stale "not tool-checked" records.** Patch :6–8, handoff :44 and :131, stale-paths :219–222, and checkpoint :42 and :49 still say the 15-hunk version has not been checked. Record Codex's run (command, time, output) as Codex's, and note that this review could not repeat it.
6. **Gaps in the M list (box 3).**
   - `verify-goal:27` (`git -C <worktree> show HEAD:docs/plan/runs/<ID>/handoff.md`) is missing.
   - M18 adds `--stat`, so it is not the command as written.
   - M2's `git status` can rewrite the `.git/index` stat cache, so "only reads" is slightly overstated.

## What I verified independently (reads only)

- **Patch structure.** For each of the 15 hunks I compared the old side line by line with its target file. All line numbers, counts and new start lines are right: run-goal 17/28/41/193 → +0/+4/+3 → 200, and run-plan 10/49/131 → 52/135. Grep found 22 = 7 `diff --git` + 15 `@@` lines, no trailing whitespace or CR, a patch that ends exactly with `End with:\n\n`, and a final newline in `run-goal/SKILL.md`.
- **Applies on `main` too, probably.** The 12 key old-side lines sit at the same line numbers in the main checkout's copies. That makes a clean apply after the rebase likely, but it is not proof.
- **C17 (run-goal link re-basing).** It matches C9, and C9's example links resolve correctly from `docs/plan/runs/<ID>/`.
- **C15 (timeless thresholds).** The wording is true whether this patch or QA-9 lands first (`GOALS.md:229`).
- **C16 (main checkout's planner).** True: the script finds its files from its own location (`lib.mjs:11–12`).
- **run-plan `ready` vs `next`.** Matches the code: the option parser is strict with no `slots` option (`status.mjs:24–38`), there is no `next` command (:123), and `ready` means not started with all needs Done (:104, `lib.mjs:372–380`).
- **Sources.** The privacy text matches PRD §16.1 (:1050–1053), PRD §22.1 (:1481–1482) and 003 §6 (:1030, :1032). The patch's other citations hold for PRD §4.2 and §10.3. The test files tdd-guide names exist.
- **SESSION-PROMPT override.** Its wording is correct and does not claim the patch is applied; only its reach is wrong (High 2).
- **Box 3 reading** (`next` is a future command and is not run; `ready` is today's pick). It is defensible, but only once the patch is applied. The verifier rules on it.

## Done-when boxes

| Box | State |
|---|---|
| 1 · searches recorded, every hit fixed or labelled | Open: the stale `.claude/` lines are still there until the patch is applied |
| 2 · tracker states who owns status and results | Met in the working tree only: `docs/09:10–11` and `:19–21`, uncommitted |
| 3 · every command runs on `main` as written | Open: no command proof yet, and the reading needs a verifier ruling |

## Readiness

- **Applying the patch: ready**, once the coordinator authorises the protected `.claude/` write. Apply it in this worktree, then re-run S1, S5 and S6 over `.claude/`; only `verify-goal:40` should remain. Then update the records. Low 2 can be fixed first, with a fresh check, or afterwards.
- **Command proof: not ready.**
  - The M list can run now; it only reads.
  - W comes after the commit and rebase, under the stack policy.
  - D waits until High 1 is fixed.
- **Still open:** the command proof itself, the verifier's ruling on box 3, T-7, and a fresh independent verifier.
