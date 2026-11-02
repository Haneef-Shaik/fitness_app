**SF-7e review: nothing new at critical, high, medium or low. It closes 1132Z's L1. The carried M1 is still open, nothing is Done, and 0 of 4 Done-when boxes are met.**

The code in `dispatch` is the fix 1132Z proposed, unchanged. A successful `shared-apply` now passes the check by container name before `state.json` is written. Every other path still writes its state first and then runs the check in `finally`.

## Findings

**M1 · medium · carried, unchanged.** Nothing yet proves that Docker's reads and the TCP write to 127.0.0.1:55322 reach the same Postgres. No `m1-live-read-*` file exists in the untracked listing. This still blocks any shared apply.

**Informational: the stdout line the implementer flagged (`mb1-replay-shared.mjs:192`, `mb1-replay.mjs:205-209`). I judge it not material; no change and no phase for it.**
- On the new STOP, stdout still prints `# 55321 after migration up: equal to the replay's after snapshot` and then `# mb1-replay shared-apply: exit 1`. The refusal follows on stderr and in the evidence file.
- Both lines are still true of the moment they describe.
- The STOP is clear from exit 1, stderr and the evidence file. `state.json` holds only the attempt, so the next `shared-apply` and `shared-suite` are refused from the file alone (sf7e test lines 105-107).
- Every lifecycle command whose `finally` check fails already prints its success lines and then exit 1, and `shared-apply` did the same before SF-7e. So nothing new reaches the coordinator.
- A by-name check that times out (`mb1-replay-live.mjs:167`) refuses without the word "STOP". The run still ends with exit 1 and the state is still safe, so it is not material either.

**I-2 · carried, stated in the comments, not changed.** A run can still exit 1 with `sharedApplied` true: after a lock-release STOP (`mb1-replay.mjs:203-204`) or a failed evidence write (`:209`). That matches the new definition: `sharedApplied` describes 55321, not the exit code.

## The order after the apply (checked in `mb1-replay.mjs:153-165`)
- **One code path.** `afterSharedMigrate`'s final `return recorded` (`shared.mjs:193`) is the only way `shared-apply` returns exit 0. Every other outcome returns exit 1 (`:141`, `:172-175`) or throws.
- **Verified apply, check holds.** `checkedAfter` is set, the check by name runs, then the state is written, with no `await` between the check and the write. `finally` skips its check, so exactly one runs.
- **Verified apply, check fails.** The flag is set before the `await`, so the refusal propagates, the write is skipped and `finally` doesn't check again. Only the attempt record from before `migration up` stays on disk.
- **The write itself fails after the check holds.** Still one check, and only the attempt on disk, which is the safe outcome.
- **`shared-apply` throws** (refused before `migration up`): `finally` checks. Test 3.4 shows the calls ending `'migration list', 'inspect'`, with `state.json` byte-equal.
- **`shared-apply`'s own STOP** (exit 1): the state is written, then `finally` checks (test 3.5).
- **`migrate` and `diff`:** `stopRecorded` stays on disk (tests 3.1 and 3.2).
- **`stop`:** generation 2 stays on disk (test 3.3).
- **`start`:** the check after it is unchanged and is covered at `mb1-replay-plan.test.mjs:68`.
- **`teardown`:** unchanged path; it writes no state and is checked in `finally`.
- **The comments agree.** The definition of `sharedApplied` reads the same in `order.mjs:96-101`, the entry header (`:62-65`) and `shared.mjs:157-170`. The I-1 wording at `sf7d.test.mjs:1-7` is fixed.

## The new tests (`mb1-replay-sf7e.test.mjs`)
- **Four failure cases (lines 68-110):**
  - `nth(4)` hits the last check by container ID. I counted two in the steps before `migration up` and two after it.
  - The override answers once: the hook deletes it, and line 105 asserts it is gone.
  - Each case asserts exit 1, `sharedApplied` false, no `55321-after`, the attempt, and the exact order of calls and writes, with one check by name at the end.
  - It also asserts the exact refusal, that the STOP is the entry's (no `# STOP:` from `shared-apply` itself), and the end of the evidence file.
  - In the lasting cases (restart, stop), `shared-suite` is first refused at the start check. Then, with the check passing again, the next `shared-apply` is refused as already attempted and `shared-suite` as needing a verified apply. Each makes only the one start check, so the refusals come from `state.json` alone.
- **Positive control (lines 112-126):** writes `[[false,false],[true,true]]`, the exact order, and `shared-suite` passes 75 s later.
- **Planned mutations, by reading only (none run):** E-after, E-double, E-all and E-code would each be caught as predicted. E-code would be caught by order only, because a STOP rewrites the state already on disk. A variant setting `checkedAfter` after the `await` would also be caught: the four cases would show a second check at the end.

## Test results (executed by me, once, on Node `v22.23.1`)
`rtk proxy node --test --test-reporter=tap scripts/backend/*.test.mjs` (21 files):

`1..162`, `# tests 320`, `# suites 0`, `# pass 320`, `# fail 0`, `# cancelled 0`, `# skipped 0`, `# todo 0`, `# duration_ms 14950.926375`.
- SF-7e is `ok 122` (4/4 subtests), `ok 123` and `ok 124` (5/5 subtests).
- SF-7d is `ok 118`–`121`.
- The output was saved in Claude Code's tool-results folder, outside the repository.

This confirms the implementer's 320/320 independently, on the current files.

**Side effects, checked before the run:**
- The runner tests use a temporary sandbox directory per test, removed afterwards, with Docker and the Supabase CLI simulated in memory.
- `verify-identity` replaces `fetch` with a double, and the real one throws if called.
- The `check-sql-sources` tests make scratch git repositories in the temp folder, plus one read-only git run on this repository.
- The contracts and fixtures tests write only to temp folders. The executor tests start local `node` scripts in temp folders.
- After the run there were still 33 untracked entries and no tracked change.

## What is executed, inherited or not run
- **Executed:** the full run above, `node --version`, `git status` and `git ls-files`. I also searched the new test file for secret-shaped values and found none.
- **Inherited, not rerun:** the implementer's RED (13 of 19 passing, 6 failing) and GREEN (19/19), the claim that no assertion changed after the code, 1132Z's 308/308, and the full §8 secret scan. By reading, the old order would fail exactly the six tests the RED names.
- **Not run:**
  - every planned mutation: SF-7b's 8, SF-7c's 4, SF-7d's 5 and SF-7e's 4;
  - hashes, any live probe, the runner, Docker, any database, SQL or network command, and `backend:test`;
  - subagents, and the Python launcher in the message;
  - any write to code or docs.
- **Policy:** SF-7e only moves one read-only `docker inspect` ahead of one write of the runner's own `state.json`. It opens no member-data or staff access path, so the PRD §16.1 / ADR003 override is untouched. I read `EXECUTION.md` and the MB-1 goal card; I did not re-read PRD §16.1.

## Recommended next phase
Accept SF-7e and stop the SF-7 run of lows; nothing here needs another pure-code phase. The one thing standing between this runner and a safe shared apply is M1. So the next bounded phase should be the read-only live M1 read (R0–R17), under its own explicit authorization:
- one writer only, with no `shared-*` command and no SQL write;
- stop conditions declared in advance;
- its output reviewed independently before SF-1 to SF-6.

If that authorization isn't available yet, the most useful pure alternative is to authorize a scratch tree once and run the 21 planned mutations. That turns predictions into real kills, R-exit among them. B1 (G16.api), B2 and box 3 stay blocked whichever comes first.

```
GOAL: MB-1 · REVIEW: SF-7e (independent, read-only)
FINDINGS: C0 H0 M1 (carried) L0 new · Info: stdout line (not material, close), I-2 (carried, stated)
TESTS: executed 1..162, 320/320 pass, 0 fail, Node v22.23.1; tree unchanged (33 untracked, 0 tracked)
UNRUN: all mutations, hashes, live M1 read, runner/Docker/DB/network, backend:test
STATUS: SF-7e acceptable; 1132Z L1 closed; not Done; 0/4 boxes; shared apply, SF-1–SF-6, B1, B2, box 3 blocked
NEXT: separately authorized read-only live M1 read (R0–R17)
```
