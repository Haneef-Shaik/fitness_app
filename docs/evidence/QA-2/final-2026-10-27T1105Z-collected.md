I could not fix P13-1: the Edit to `.claude/agents/security-reviewer.md` was denied. I stopped that fix at the denial and used no other writer. P13-3 to P13-7 are now fixed in QA-2's records only. QA-2 is not Done. I staged and committed nothing and make no box claim.

**Denied, not retried and nothing put in their place**
- **The F2 sentence (P13-1).** The new sentence would have made F1's erasure-job exception subject to R-4. A change going either way, deleting the erased account's consent events or keeping them after erasure, would be an unresolved finding that names R-4 and needs DEC-04's external review. Deleting by anything else, or deleting another account's events, would stay a finding. The text as typed is recorded in stale-paths §21. The file is as phase 13 left it: Grep shows `:42` unchanged and the diff is still `+6`.
- **`rtk proxy date -u`**, which ran twice in phase 13. This phase has no recorded timestamp.

**Fixed in the records only** (stale-paths §21, with markers in §20 and the D pin rule)
- **P13-2:** the ignored-files gap is raised from Low to a Medium integration blocker. The fix is a plan, not executed code.
- **P13-3:** M22 now lists ignored as well as untracked files. Path collisions are compared regardless of case and Unicode form, and by folder prefix. M23 uses both hashes typed out, with `--no-renames`. Its expected set comes from the commits' actual paths, so "48 paths" is withdrawn. Both run before the verifier, from the branch's skill text.
- **P13-4:** the resume rule now uses `H_orig`, the hash passed to the interrupted run. It covers three cases, and refuses if `main` has moved past the branch tip.
- **P13-5:** the integrator re-checks `main`, the inventory and the incoming paths just before the fast-forward. This is in the next skill-edit scope, not implemented.
- **P13-6:** the inventory is re-taken, and the 09:35Z file is recorded as phase 13's own final, not a review. Nothing is renamed.
- **P13-7:** the drift and pin checks are single `rtk proxy git diff --quiet …` calls, with no `; echo $?`.

**How each item was obtained**
- **Ran:** the branch and `HEAD` reads, the inventory before and after the edits, a check that nothing is staged, `diff --stat`, and `diff --check` twice (clean). `HEAD` is still `7a01395`, and the integrate-goal skill is unmodified.
- **Read from files:** F1 and F2, R-4 in 003 and DEC-04 in the PRD, the P-check sentences, the integrate-goal skill, and the 09:35Z final.
- **Taken from others:** the 09:35Z file's role (the reviewer's reading), phase 13's three SHA-256 values, and that `rtk proxy` passes exit codes through.
- **Not run:** all P, M, W and D proofs, any hash (so the two new finals have none), the rebase, staging, the commit, the three reviews and the verifier.

**Needed from Codex**
- A writer route for the F2 sentence, before phase 13's files are committed.
- A writer route for the next skill-edit scope: integrate-goal plus `goal-integrator.md`. Integration stays blocked until it lands and is reviewed.
- After that, a fresh independent review of this phase.

The privacy override stays in every `security-reviewer` launch: gym staff never read or write private health data, whatever consent.

I used no sub-agents, as your rules require, so the `code-reviewer`, `security-reviewer` and `tdd-guide` reviews did not run. My own read of the records is not independent.

```
GOAL: QA-2
BRANCH: codex/fitlog-qa2-docs
HEAD: 7a01395f1688df7901f804f72c9e3c12267253d2
HANDOFF: docs/plan/runs/QA-2/handoff.md
BOXES: no claim/3 Done-when boxes met (box 3 open; no box claim this phase by rule)
STATUS: blocked
NOTES: Phase 14 uncommitted: F2-sentence Edit denied (P13-1 open, text in stale-paths §21); date -u denied; P13-2 integration blocker; P13-3..7 records-only; no proofs/hashes; Codex writer routes + fresh independent review next.
```