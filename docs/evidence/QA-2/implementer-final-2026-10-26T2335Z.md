# Complete correction final — 02ee6978-7b17-49ec-859d-6622b8fdeed6

QA-2 is still not ready to verify. This phase did everything you scoped, but Bash was denied again, so no command ran, including `git apply --check` on the revised patch. Box 2 is met in the working tree only; boxes 1 and 3 stay open. Nothing under `.claude/` was touched, nothing was committed, and no status or ledger file changed.

**Patch (`docs/evidence/QA-2/claude-corrections-UNAPPLIED.patch`), still unapplied.** It now covers 7 files in 15 hunks:
- **Finding 3:** run-goal's by-hand close-out now re-bases the handoff's links, as integrate-goal step 5 does.
- **Finding 4:** the threshold wording no longer says "today there are none". It now says "QA-9 adds these thresholds; until it does there may be none, so read both on `main`". That stays true whether the patch or QA-9 lands first.
- **run-plan:134:** the `next` end condition now applies only after phase O2. Advisory mode, which is every cycle today, ends after step 3.
- **Header:** R1 is labelled C4 only. The earlier version had 13 hunks, not 14.

**Check status.** The reviewer's passing `git apply --check` was on the 13-hunk version. The 15-hunk version has not been tool-checked. Instead I used Grep:
- Each hunk's old side appears exactly once, byte for byte, in its target file.
- Each hunk body has exact added-line counts and no stray lines.
- No added line contains a stale-path search token.

That check caught one real defect, a stray blank line that would have made `git apply` reject the patch; I removed it. These checks are not a substitute for `git apply --check`.

**Box 3 decision.** Recorded in stale-paths §6.3:
- `status.mjs next --slots` is a future-only illustrative command for phase O2, not something to run today. I did not run it.
- `status.mjs ready` is the present-day pick in advisory mode.
- Box 3 therefore covers only commands the docs tell a session to run today. The verifier has to accept that reading.

**Privacy override.** SESSION-PROMPT step 5 now applies the PRD §16.1 / 003 §6 rule to every `security-reviewer` launch: gym staff never read or write private health data, whatever consent or flag a request carries. It applies only while the agent file still has its **Consent:** bullet, and it does not claim the patch is applied. Orchestrated launches still need you to state the override until the patch is applied, MB-1's review included.

**Commands for you, in stale-paths §6.3.** Each command is listed in full with the result you should see:
- **M1–M19:** read-only checks in the main checkout. I confirmed in the code that each only reads; `serve.mjs` is excluded because its board API writes status.
- **W1–W6:** the gates in the worktree.
- **D1–D19:** mutating commands, only in a disposable `/tmp` clone whose `origin` is a local bare repository, with guards that stop if either isn't true.

**Also updated:**
- **Search re-run:** S1–S10 match the previous run line for line. In `.claude/` only the 12 lines the patch fixes still hit.
- **Evidence and file list:** stale-paths §3–§9, the handoff (including the reviewer and implementer report files) and the checkpoint. The implementer report is kept verbatim, and its "14 hunks" is corrected in stale-paths.
- **Still open:** Figma T-7.

**Your call:** SESSION-PROMPT step 8 has the same missing link re-basing step. I left it because you limited that rule to the patch; approving it would add one clause there.

```
GOAL: QA-2
BRANCH: codex/fitlog-qa2-docs
HEAD: 5fefc31 (all changes uncommitted)
HANDOFF: docs/plan/runs/QA-2/handoff.md
BOXES: 1/3 Done-when boxes met
STATUS: blocked
NOTES: 15-hunk .claude patch unapplied and not tool-checked (Bash denied; Grep checks only) — run git apply --check first; R1 live until applied, SESSION-PROMPT override in place; never run status.mjs next; box 3 commands in stale-paths §6.3 (M/W/D); verifier rules on box-3 reading; T-7 open.
```
