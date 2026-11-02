# QA-2 · Response to the 09:05Z independent review (correction phase 13)

The review is [final-2026-10-27T0905Z-collected.md](final-2026-10-27T0905Z-collected.md). The
older `final-2026-10-27T0905Z.md` is phase 12's own implementer final, misnamed in the 08:35 cycle
(Codex). Both are kept verbatim. The full record is [stale-paths §20](stale-paths.md). QA-2 is
**not Done**: box 3 is open, and nothing is integrated.

| Finding | What phase 13 did | State |
|---|---|---|
| **M-1** (step 14 (a) can never pass) | Codex ruled: tolerate explicit, pre-existing, unrelated untracked paths only after a read-only full inventory and an empty incoming-path overlap, with the exact tolerated set in the launch brief, failing closed, and never stash, reset, clean, move or delete. The proof matrix encodes it (§20 *Integration preconditions*; new M22 and M23). The integrate-goal **Edit was denied**; no other writer was used. The denied text is in §20, as typed | **Open in the skill.** Codex decides the writer route |
| **M-2** (R-4 presented as settled) | F2, `followup-consent-retention-ai-scope.patch`: six added lines. Retention after erasure stays open as R-4, reserved to the owner and counsel under DEC-04; until DEC-04's external review is recorded, a change that deletes consent events, even in the erasure job, is a finding. No legal position is decided. `--check`, then applied once (SHA-256 `14d71b17…61a9dc4fa` before and after) | Applied in the worktree, uncommitted, not yet independently read |
| **L-1** (AI entry points undefined) | In F2: create, retry and reanalyse (003 §4.14); confirming a ready proposal, and manual food, need neither check (PRD §10.3; 003 §4.14) | As M-2 |
| **L-2** (subject lookup) | `git log --format='%H %s' -- docs/plan/runs/QA-2/handoff.md`, keeping the one exactly equal subject. Ran once (*executed*): one match, `173eff04…`. The handoff gives the lookup and warns against `--grep` | Fixed; repeat after the commit and the rebase |
| **L-3** (drift check vs D's clone) | `git rev-parse main` straight before D, as `M_D`; the five-path check from `5fefc31` to `M_D`; the D pin must equal `M_D` | Fixed in the records; D still blocked |
| **L-4** (`MAIN_BEFORE` timing; resume) | In the matrix: checked before the rebase and every gate, and straight before the fast-forward. A resume reconciles the recorded `MAIN_BEFORE` and result first, and compares the recorded one with `H` after an earlier fast-forward. The blanket "a refusal leaves `main` untouched" is withdrawn | Matrix only; the skill edit was in the denied sequence |
| **L-5** (compaction records) | The handoff now says phases 1–11, with phase 12 in §19, checkpoint step 67 and its own commit section. The D-script assumptions Low is restored. Checkpoint :6 shows the committed state. Step 67 says Write, not Edit. The Write ruling is closed as accepted. The 09:05Z files are in the inventory | Fixed |
| **L-6** (patch hash to blob) | The committed blob, the working file's `git hash-object` and its SHA-256 `4f9ed884…a382169`, with `core.autocrlf` unset and no CR | Linked (*executed*) |
| **L-7** (passport vs F1) | Named, deferred to G29; F1, F2 and the absolute rule unchanged | Deferred |

**Also found:** M22's inventory does not list ignored files, and `git merge` overwrites an ignored
file at an incoming path by default (*expected* from git's documentation). This is a new Low for
Codex; QA-2 adds no check.

**Not done this phase, by rule:** no P, M, W or D proof, rebase, tests, staging or commit. No
sub-agents. An independent review of phase 13 is next.
