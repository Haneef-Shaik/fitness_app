I finished this phase's fixes, but QA-2 is not ready to verify. Box 2 is met, in uncommitted files only. Boxes 1 and 3 are still open: the `.claude/` patch is unapplied and no box 3 command has run. I made docs and patch changes only. Nothing under `.claude/` changed, nothing was committed, and no status, ledger or `main` file was touched.

**The patch check ran and passed, the first run anyone has repeated.** My first Bash call (a `git status`/`log`/`ls` compound) was denied, and I did not retry it. The one command you permitted, `rtk proxy git apply --check --verbose docs/evidence/QA-2/claude-corrections-UNAPPLIED.patch`, then ran twice: once after the hunk edits and once on the final file. Both times it printed "Checking patch …" for all 8 files and no error. That proves the patch applies to this worktree at `5fefc31`, not on `main` after the rebase. Your pass on the old 15-hunk version is recorded as yours; its time and output aren't in the worktree, and the 00:05Z reviewer couldn't repeat it.

**High 1: the disposable-clone proof is now one script, not run.** The old setup block, print-only guards and D-table are withdrawn. The replacement, in `stale-paths.md` §6.3:
- runs as one bash process with `set -euo pipefail`;
- uses its own `mktemp -d` folder as a canonical `pwd -P` path, so the macOS `/tmp` link can't cause a false mismatch;
- `cd`s inside the same script, so no shell state is lost between steps;
- calls a `guard` before every mutating command. It exits 1 on a wrong directory, an extra remote, or an `origin` that isn't the local bare repo inside that folder.

It reads the main checkout only, never writes it, and makes no network call. Nothing ran, so no live status, push or milestone change happened.

**High 2: the privacy rule now sits above SESSION-PROMPT's paste line.** The new preamble (`SESSION-PROMPT.md:10–43`) states the absolute rule: gym staff never read or write private health data, whatever consent or flag a request carries. It also says exactly who gets it from that file:
- **Paste fallback:** step 5 carries an identical copy, so pasted sessions receive it. This is the only path the file covers itself.
- **`/run-goal` and orchestrated launches:** those sessions never read the file. Whoever starts them must supply the text until the patch is actually applied.

The three records that claimed by-hand coverage are corrected. Your task text for this phase carried the override, and I started no `security-reviewer`.

**The six Lows:**
1. SESSION-PROMPT step 8 now re-bases the handoff's links before appending it to the tracker.
2. The patch now says "a staff read **or write** gated on consent".
3. run-plan finds its mode by reading `status.mjs` for a `next` command, never by running it (0 hits today). A new plan-orchestrator hunk says the same.
4. Advisory mode changes no status, and step 2's reset applies in live mode only.
5. The check records now attribute your run to you.
6. The read-only command list gains the missing verify-goal `show HEAD:…handoff.md` command (M20). M18 is now exactly as written, and M2 has the `.git/index` refresh caveat with `GIT_OPTIONAL_LOCKS=0` as an option.

The patch is now 8 files and 16 hunks, from Grep counts of `diff --git` and `@@` lines.

**Still open:**
- Applying the patch needs your authorisation for the protected `.claude/` write. Until then, `security-reviewer.md` still tells reviewers consent opens staff access, and every `/run-goal` or orchestrated reviewer launch needs the override from you, MB-1's included.
- None of the M, W or D commands has run. The verifier still has to rule on the box 3 reading.
- Figma T-7 is open.
- No sub-agent reviews ran; the handoff has a self-review instead.

The handoff's resume list has the order: apply, commit, rebase, run the commands, review, verify.

```
GOAL: QA-2
BRANCH: codex/fitlog-qa2-docs
HEAD: 5fefc31 (all changes uncommitted)
HANDOFF: docs/plan/runs/QA-2/handoff.md
BOXES: 1/3 Done-when boxes met
STATUS: blocked
NOTES: 8-file/16-hunk .claude patch passes git apply --check (run twice here, not applied; protected write needs coordinator auth); High1 D-proof is now one fail-closed set -euo pipefail script in stale-paths §6.3, not executed; High2 override is in SESSION-PROMPT preamble, reaching paste fallback only — /run-goal and orchestrated security-reviewer launches need the coordinator to supply it until the patch is applied; Lows 1–6 fixed; no M/W/D command run; box 3 reading needs a verifier ruling; never run status.mjs next; T-7 open.
```
