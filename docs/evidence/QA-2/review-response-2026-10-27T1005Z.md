# QA-2 · Response to the 10:05Z independent review (correction phase 14)

The review is [final-2026-10-27T1005Z-collected.md](final-2026-10-27T1005Z-collected.md), of
phase 13. `final-2026-10-27T0935Z-collected.md` is phase 13's own implementer final, not a review
(the reviewer's reading, *inherited*; its content agrees, *inspected*). All the finals are kept
verbatim and unrenamed. The full record is [stale-paths §21](stale-paths.md). QA-2 is **not
Done**: box 3 is open, P13-1 is open, integration is blocked, and nothing is integrated. This
phase makes no box claim.

| Finding | What phase 14 did | State |
|---|---|---|
| **P13-1** · Medium (F2 picks R-4's retention answer) | Codex ruled: one symmetric sentence, replacing F2's "Until then, a change that deletes consent events, even in the erasure job, is a finding." F1's erasure-job exception becomes subject to R-4. A change that settles it either way, deletion or retention after erasure, is an unresolved finding that names R-4 and needs DEC-04's real external review. Deletion by anything else, or of another account's events, stays a finding. The **Edit was denied**, and no other writer was used. The text as typed is in §21 | **Open.** Codex names a writer route before phase 13's files are committed |
| **P13-2** · Medium (ignored paths; case) | Phase 13's Low is raised to a Medium. M22 now lists ignored entries (`--ignored=matching`), and collisions are compared after NFC normalisation and case folding, and by path prefix (§21) | **An integration blocker** until the denied skill correction lands. A plan, not executed code |
| **P13-3** · Low (M22 and M23 timing, set, refs) | M22 and M23 run before the verifier, from the branch's skill text. M23 is `git diff --name-only --no-renames <H>...<T>` with both hashes typed out. The expected set is the commits' actual paths, and "48 paths" is withdrawn | Fixed in the records. UNRUN |
| **P13-4** · Low (resume compares with the wrong `H`) | `H_orig`, the `H` passed to the interrupted run, recorded with its brief. Three cases: no fast-forward yet; `main` at the tip; `main` moved past the tip, which refuses so that Codex decides | Fixed in the records. Not in the skill |
| **P13-5** · Low (no re-check before the fast-forward) | Straight before step 3: M22a, M22 and M23 with `<H>...<T′>`, together with the second `MAIN_BEFORE` check. Put into §21's next skill-edit scope | In the scope. Not implemented |
| **P13-6** · Low (inventory; naming) | Re-taken (*executed*): 4 modified, 6 untracked. The roles of `0935Z-collected` (phase 13's final) and `1005Z-collected` (this review) are recorded. Their SHA-256 values are **UNRUN**, and the stage phase records them. No rename | Fixed in the records |
| **P13-7** · Low (`; echo $?` compounds) | The drift and pin checks are single `rtk proxy git diff --quiet …` calls, with the exit code read from the tool's result | Fixed in the records. UNRUN |

**Denied this phase, and not retried or replaced:**
- the F2-sentence Edit on `.claude/agents/security-reviewer.md`;
- `rtk proxy date -u`.

**Executed:**
- `git rev-parse --abbrev-ref HEAD`: `codex/fitlog-qa2-docs`;
- `git rev-parse HEAD`: `7a01395f…`;
- the `--no-optional-locks` inventory, before and after the record edits.

**Inherited:**
- the 0935Z file's role;
- the phase 13 hashes;
- that `rtk proxy` passes exit codes through.

**UNRUN:** every P, M, W and D proof, every hash, the rebase, staging, the commit, the three
reviews and the verifier.

**Not done this phase, by rule:**
- no integrate-goal or `goal-integrator.md` edit;
- no sub-agents.

A fresh independent review of phase 14 is next.
