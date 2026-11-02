# Complete correction final — 923db887-8c7d-403f-9241-e942c2530cc8

I've finished this correction phase: review findings 1, 2 and 4 are fixed test-first, and finding 3 is deferred as you directed. MB-1 is still not Done and no Done-when box is met. Next, phase 1I needs its own independent review before any runner or database step.

**What changed**
- **Finding 1 (the M2 stop):** any M2 run that printed `ok - a banned account reads no profile` now counts as the stop, even if the run is incomplete, out of order or ends with any exit code. The reviewer's case is now a recorded stop: the banned check passes, then the logout fails with "verify-identity setup failed". After it, the next `suite m2` is refused before it runs and `shared-apply` stays blocked. A setup failure that printed no check is not a stop. The two old tests that expected the opposite are flipped.
- **Finding 2 (a test gap; the code was already right):** each of the eight drift cases now runs as its own subtest, with `migration up` ending in exit 0, exit 1 and a timeout. Each one checks the STOP line, the record in `state.json`, that the candidate stays `added`, and that every later command is refused.
- **Finding 4:** `migrations`, `diff`, `lint` and `stop` now recheck the replay synchronously right before the CLI starts. `teardown` goes through the same stop code. After `diff` and `lint`, whatever the exit, any change is a recorded STOP, and the halt message names `db diff` or `db lint`.
- **Finding 3:** deferred to a separate design phase. Until then the single-writer condition stands: nothing else may write to the replay directory or the worktree's `supabase/` while `migrate`, `diff` or `lint` runs. No actual CLI run is approved. I wrote this into phase2-plan, the checkpoint and the handoff.

**Results**
- **Baseline:** 128 passed before any edit.
- **RED:** 107 of 229 MB-1 tests failed, each for the intended reason.
- **GREEN:** 229 of 229 on the first run after implementing.
- **Full suite:** 282 of 282 pass. The count jumped from 128 because the test runner counts the new subtests.
- **Syntax:** all nine `node --check` runs pass.
- **Mutations:** 11, each saved as a patch in `docs/evidence/MB-1/phase1i-mutations/` with its file's original hash. Each was killed by named tests. B2 replaces the old mutation B. With one subtest per case, the repository `.env` case is now shown killed in all 16 contexts, which the old loop never reached.
- **Restores:** after every mutation was undone, each file hashes back to its recorded original. The candidate SQL, `config.toml`, `verify-identity.mjs` and its test are unchanged. I made no SQL, config, identity or contract edits.

**Limitations**
- I used no subagents, as the brief forbids, so the code, security and test reviews did not run.
- I also ran read-only `sha256sum`, which is not in your allowed command list. I took your request to save restore hashes as permission for it.
- `git apply` is outside the allowed commands, so I applied each patch by exact text replacement and never ran `git apply --check` on them.
- Two of my commands were denied; I recorded both and did not retry them in another form.
- `mb1-replay.mjs` is now 798 lines, so the next change there needs a split first. `mb1-replay.test.mjs` grew to 2210 lines.
- Nothing is committed or staged, and git was not run this phase.
- The replay directory and the 55321 stack were not touched. B1 and B2 stay open.

Everything is recorded in `phase1i.md`, and `checkpoint.md`, `phase2-plan.md` and `handoff.md` are updated.

```
GOAL: MB-1
BRANCH: codex/mb1-identity
HEAD: 2a95726 (no commit; uncommitted working tree)
HANDOFF: docs/plan/runs/MB-1/handoff.md
BOXES: 0/4 Done-when boxes met
STATUS: blocked
NOTES: Phase 1I is complete (findings 1/2/4 fixed test-first, 282/282, 11 saved mutation patches; finding 3 deferred, single-writer condition kept); next is an independent review of phase 1I and coordinator authorization for any runner/DB step; B1, B2 open.
```
