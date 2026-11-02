# Independent reviewer final

Session: `c315be3a-5890-42c5-9c14-55d3ee924dbd`

## Verdict

I found nothing critical, high or medium in phase 1I. It fixes findings 1, 2 and 4 of review 2026-10-26T2305Z in the way the review asked. Finding 3 is deferred, and the single-writer condition is written into phase2-plan §3.1, §5 and §6.

**A bounded §3 run on the disposable replay is not blocked.** That run is `add-candidate`, `migrate`, `snapshot after` and `suite green`, under the conditions in the readiness section below. Shared-apply stays blocked: `sharedApplyNeeds` refuses on attempt 4's state, and it is not authorized. B1 and B2 are open, and no Done-when box is met.

## What I ran myself, and what I took from the implementer

**Ran myself:**
- `rtk proxy node --test scripts/backend/*.test.mjs`: `1..133`, `# tests 282`, `# pass 282`, `# fail 0`, `# duration_ms 11516.028`.
  - This run includes the pin tests that hash the real candidate file (`ac262f39…bdc3`, evidence.test `:676-684`) and the preconditions block (`ca683771…`, `:668-670`). So those two bindings are confirmed independently.
- `rtk proxy node --check` on the 9 files, one command each: every one exited 0 with no output.

**Checked by reading (nothing executed):**
- **All 11 patches:** each hunk header and its context lines match the current file at the stated lines. Every removed line is present in the current file and every added line is absent, so all three modules are back to their unmutated content.
- **The implementer's spec reports,** read by exact path only (I never listed `/tmp`):
  - RED (122 pass, 107 fail) and all 11 mutation totals match phase1i §5.4: B2 224/5, P 210/19, Q 219/10, R 155/74, S 174/55, U 192/37, T 210/19, X 154/75, V 179/50, W 228/1, M2 193/36.
  - I spot-checked the failing test names for four of them:
    - **B2:** the two evidence tests, the two runner STOP subtests and their parent.
    - **W:** only the order test for finding 4.
    - **P:** the eight exit-0 subtests pass, which is the reviewer's point.
    - **M2:** 32 `.env` subtests fail. The repository case fails because the CLI ran past the skipped guard (the "rechecked … no .env file" line is printed), so it is a real kill.

**The implementer's word only (not reproduced):**
- The mutation runs themselves: applying a patch is an edit, which the brief forbids.
- The restore sha256 values and the 12 file hashes in phase1i §6: `sha256sum` is outside this brief's command set.

## The fixes the review asked for

| Item | Result | Evidence |
|---|---|---|
| **F1:** an M2 run whose banned check printed `ok` is the STOP, complete or not, in order or not, whatever its exit | **Verified** | `unkilled` no longer needs `completeRun` (evidence `:291-294`). The runner applies the rule to the raw text, withheld output included (`:489-497`), and records `m2Stopped`. `firstStop` is checked before `firstM2Pass` (order `:72-75`), and `sharedApplyNeeds` blocks on any stop (`:97-98`). `main()` catches everything and returns (verify-identity `:230-231`), so a partial run always reaches the record |
| F1 tests | **Verified** | The old expectations are flipped (evidence `:358-365`). There are 11 stop cases and 6 no-stop cases (`:452-498`). The runner tests use the reviewer's exact run: banned `ok`, then `Logout (local) failed: HTTP 429`, and a SIGTERM variant (runner.test `:1654-1702`). They check that the record is durable, that the next `suite m2` is refused with `inspect` only, and that shared-apply is blocked |
| **F2:** the post-`migrate` STOP when the CLI exits 1 or times out | **Verified** | `stopAfter` runs before the exit is read (`:433`). There are 24 drift subtests (exit 0, exit 1, timeout), plus "nothing changed" and "cleared by hand" (`:1851-1923`). Mutation P is confirmed (corroborated) |
| **F4:** `migrations`, `diff`, `lint` and `stop`/`teardown` recheck synchronously before the CLI; `diff` and `lint` record a STOP after it | **Verified** | `replayGuards` is the first statement of each (`:401`, `:442`, `:501`). The chain to the child has no await: sync fs, then `supabaseArgs`, then `cliCall`, then the `ctx.exec` wrapper (`:773`), then `runCommand`, which spawns inside the Promise executor (`:113-115`). The post-CLI check is `:444`. The halt reads `op` through a frozen table, string-only and own-key only (order `:23-33`). Tests: runner `:1939-2030` and order `:98-106`. Mutations Q, R, S, U, T, X, V and W are corroborated |
| **F3:** written and undone during a CLI run | **Deferred, condition recorded** | phase2-plan `:198-201`, `:247`, `:301-303` |
| Informational 5 from the last review: one subtest per drift case | **Done** | `eachDrift` (`:1722-1734`). The M2 report shows the repository `.env` case killed in all 16 contexts |

## Findings

### 1. Low (new): a STOP after a CLI is lost if a step after the CLI throws, and the lock is then released
- **Location:** `mb1-replay.mjs`:
  - `:172`: `supabase()` prints `renderRun(…)` before it returns to `stopAfter` at `:433` and `:444`.
  - `:745`: the `state.json` write.
  - `:787`: `releaseHeld` always runs.
- **The defect:** the STOP is only recorded if two steps succeed: `renderRun` must not throw (it can't, in practice, because its inputs are pre-filtered), and the state write must succeed. If the state write fails, for example with ENOSPC or EACCES, the error becomes an ordinary refusal and the lock is released. Nothing records the STOP.
- **Failure scenario:**
  1. `db diff` runs while something changes the replay's input, and `stopAfter` decides a STOP.
  2. The state write fails because the disk is full. The evidence write most likely fails too.
  3. The lock is released.
  4. Once the disk is cleared and the change is undone, the next command runs with no halt. The STOP survives only in stdout.

  The written rule "any STOP line stops the phase" still covers this, so it is not exploitable from outside the machine.
- **Fix:** when a result carries `stopRecorded` and the state write fails, keep the lock (skip `releaseHeld`) and print a STOP naming both failures. Also move the `renderRun` print after `stopAfter`.
- **Follow-up:** MB-1, in the finding 3 design phase, which touches the same code after the CLI. It does not block §3.

### 2. Low (carried, design): a recorded STOP blocks `stop`, `teardown` and the read-only `shared-snapshot before`, with no written way to clear it
- **Location:** order `:29-34`; dispatch `:732-733`.
- **The defect:** §3's `migrate` can now leave a live replay halted, and no written procedure says how to clear it.
- **Fix:** add a clearing procedure to phase2-plan: an independent review first, a read-only check of 55321, then removal by hand.
- **Follow-up:** MB-1, ideally inside the §3 authorization text itself.

### 3. Low (carried): finding 3 is deferred, and `start`, `migrations` and `stop` have no recheck after the CLI
- **The defect:** the single-writer condition is the only control against a change written and undone while a CLI runs.
- **Follow-up:** MB-1, the finding 3 design phase. It records `lstat` `ino` and `ctimeNs` under the lock.

### 4. Low (carried): file sizes
- **The defect:** `mb1-replay.mjs` is at 798 of 800 lines, and `mb1-replay.test.mjs` is 2210 lines.
- **Follow-up:** MB-1. Split the runner and the test harness before the next change to the runner; this is a prerequisite for item 3.

## Can bounded §3 (candidate migration, then GREEN) proceed?

**Yes, as far as safety goes.** On the §3 path, phase 1I changes only two things:
- `migrate` now builds its STOP through `stopAfter`. The STOP text is byte-identical, and test `:1863` checks it.
- New recheck lines are printed.

`add-candidate`, `snapshot after` and `suite green` are unchanged. The coordinator's §3 scope should state:
1. **Pre-flight:** 282/282 and the nine `node --check`, plus `sha256sum` of the 12 files in phase1i §6 and the 4 CLI files. I could not take those hashes.
2. **Exclusive writer:** no other session or process writes to `/tmp/fitlog-mb1-replay-20261026` or to the worktree's `supabase/` during §3, and that is recorded.
3. **How each command runs:** as a background job with a timeout of at least 660 s, never killed, no SIGKILL or SIGHUP.
4. **What to expect:**
   - `add-candidate` prints `ac262f39…`;
   - `migrate` prints both `# rechecked … migration up` lines and applies only the candidate;
   - `snapshot after` changes exactly `P2.profile_read.qual` and `P3 +20261026040045`;
   - `suite green` gives 27 ok, exit 0 and the answer `banned`.
5. **When to stop:** on any refusal, `STOP:` line or unexpected result. If 55321's container has restarted, every command refuses: record it and do not work around it. Never clear `stopRecorded` without review (finding 2 above).

Each later step still needs its own authorization: M1 and M3; M2, which finding 1 no longer blocks; and §5's diff and lint, which finding 4 no longer blocks but which still fall under the single-writer condition. §6 on 55321 stays blocked.

## Done-when boxes (none met)

| Box | Met | Basis |
|---|---|---|
| 1. Signup, verify and reset; the Google and Apple adapters; no automatic merge | No | Not started |
| 2. Under-18 rejection, notices recorded, onboarding resumes | No | Not started |
| 3. A revoked session fails; a user reads only their own profile | No | RED only. `docs/evidence/MB-1` holds no `phase2-3-*` (GREEN) file. Nothing is applied to 55321. B1 and B2 are open |
| 4. AC16 fixtures pass and the contract is published | No | Not started |

## Scope, policy and limitations

- **Policy:** PRD §16.1 and frozen 003 say gym staff never access private health data, whatever the consent. This diff touches no staff, consent or health-data path. The candidate is one owner-only policy, `id = auth.uid() and member_active()`, and opens no staff path.
- **Nothing else in scope:** no AI, messaging, location or dependency change. The test fixtures are clearly fake (`sb_secret_fixture-must-never-print-0001`).
- **Limits I kept to:**
  - no `sha256sum`, `git apply` or `git` commands;
  - tracked files were judged from the session-start status, which shows only untracked MB-1 paths;
  - no edits, subagents, runner, database, CLI or Docker commands;
  - the replay directory was never opened or listed;
  - no command was denied.
