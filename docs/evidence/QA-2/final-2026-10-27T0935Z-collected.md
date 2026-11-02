Phase 13 is finished. F2 is applied, but the integrate-goal skill change was **denied**, so M-1 and L-4 are encoded only in the proof matrix, not in the skill. I made no stage, commit, rebase, test, or P/M/W/D proof. QA-2 is **not Done**: box 3 is still open, and the D run is still blocked.

**Done (executed)**
- **F2 (M-2, L-1):** a new additive patch, `followup-consent-retention-ai-scope.patch`, adds six lines and removes none.
  - Whether consent events must be kept after erasure stays open as R-4, reserved to the owner and counsel under DEC-04. Until DEC-04's external review is recorded, deleting them is a finding. The lines decide nothing legal.
  - The AI checks cover create, retry and reanalyse. Confirming a proposal that is already ready, and manual food, need neither check.
  - Same SHA-256 before and after, `--check` passed, applied once and cleanly; the lines are at `security-reviewer.md:40-45`. F1 and the historical patch are untouched.
- **L-6:** proven without a pipe. The historical patch's blob in commit 1, its working-file blob ID, and its SHA-256 `4f9ed884…a382169` all link up, with `core.autocrlf` unset and no CR in the file. So the committed patch is the one phase 8 applied.
- **L-2:** `git log --format='%H %s'` on the handoff gives exactly one equal subject, `173eff04…`. The handoff now gives this lookup instead of "unique".
- **Final inventory:** 4 modified and 4 untracked files, nothing staged, `HEAD` unchanged.

**Denied, and stopped there**
- My Edit to `.claude/skills/integrate-goal/SKILL.md` was refused. No other writer was used: no Write, no `git apply`, no patch file.
- I did not attempt the planned resume and `MAIN_BEFORE` edits to the skill, or the one-line consistency fix in `goal-integrator.md`.
- The denied text is recorded word for word in stale-paths §20, so you can decide a writer route.
- Until that edit lands, the committed skill still refuses on any untracked file. So integration still cannot pass in the main checkout.

**Records fixed (records only)**
- **M-1 and L-4:** the matrix now has the tolerated-set rule: a full read-only inventory, the exact set named in the launch brief, and refusal on any unexpected path or overlap. Two new read-only command rows (M22, M23) cover it. It also checks `MAIN_BEFORE` before the rebase and again just before the fast-forward, reconciles a resumed run's record first, and drops the blanket "a refusal leaves `main` untouched".
- **L-3:** the drift check now reads the actual `main` (`M_D`) straight before D, and D's logged pin must equal it.
- **L-5:** the handoff now correctly says the previous version covers phases 1–11; the D-script assumptions Low is restored; the checkpoint shows the committed state; the Write-vs-Edit question is closed as accepted. Both 09:05Z files are inventoried and hashed, unchanged.
- **L-7:** recorded as deferred to G29; the absolute privacy rule is unchanged.
- **New Low for you:** the inventory doesn't list ignored files, and `git merge` overwrites an ignored file at an incoming path by default. That comes from git's documentation; I didn't observe it.

**Inherited:** that the older `final-2026-10-27T0905Z.md` was misnamed (your statement), and the main checkout's state as the 09:05Z reviewer read it.

**Not run:** P1–P5, all M/W/D proofs, the rebase, and the three reviews. I used no sub-agents, as your rules require, so this self-review is not independent. An independent review of phase 13 comes next.

```
GOAL: QA-2
BRANCH: codex/fitlog-qa2-docs
HEAD: 7a01395f1688df7901f804f72c9e3c12267253d2
HANDOFF: docs/plan/runs/QA-2/handoff.md
BOXES: 2/3 Done-when boxes met
STATUS: blocked
NOTES: Phase 13 uncommitted: F2 applied once; L-2/L-6 executed; L-3/L-5 records fixed; integrate-goal Edit denied (no other writer), so M-1/L-4 are matrix-only; D still blocked; independent review next.
```
