I found no critical, high or new medium issue in SF-7d. The 1105Z L1 is fixed, and its L2 is fixed inside `shared-apply` but not fully closed: one new low, which SF-7d reported itself, is still open. The full green the implementer couldn't show now exists: I ran all 20 test files once on Node v22.23.1 and got `1..159`, 308 of 308 passing. The carried M1 is still open and nothing is Done.

**Findings: C0 · H0 · M1 carried · L1 new · 4 informational**

## M1 · Medium · carried, unchanged
Nothing yet proves that Docker's reads and the TCP write to 127.0.0.1:55322 reach the same Postgres. No `m1-live-read-*` file exists (I checked with Glob), so the read-only live read (R0–R17) still hasn't run.

## L1 · Low · new: a verified apply is written before the entry's last check
- **Location:** `mb1-replay.mjs:147-153`, together with `mb1-replay-shared.mjs:186-191`.
- **Defect:**
  - `dispatch` writes `result.state` (`sharedApplied: true` plus `55321-after`) at line 149.
  - Only then does `finally` (line 152) check the shared container's start time by name.
  - If that check fails, the run exits 1 with a STOP, but `state.json` already says "verified apply".
  - That breaks the phase's own rule in `handoff.md:120-122`: "a STOP never claims a verified apply". So 1105Z L2 is narrowed, not closed.
- **Failure scenario** (traced by reading, not run):
  1. The last check by container ID, after the snapshot, holds.
  2. `state.json` is written as verified.
  3. The container restarts, or the by-name check times out, or another Docker daemon answers once.
  4. The run exits 1 with a STOP, and the verified apply is on disk.
  - In the one-off cases (timeout, another daemon once), the next command's checks pass, so `shared-suite` is no longer blocked by the runner. Its only gate is `sharedApplied` plus `55321-after` (`mb1-replay.mjs:91`).
- **Why it is Low:**
  - A restart that persists still fails closed: every later command is refused.
  - The 55321 data was verified on the pinned container.
  - It can't happen today: `sharedApplyNeeds` blocks, and §6 is not authorized.
- **Fix:** below. It needs the entry file, which SF-7d's brief excluded, so the implementer was right not to fix it.

## Informational
- **I-1 · wording.**
  - `mb1-replay-sf7d.test.mjs:6` says "a run that ends in a STOP never records sharedApplied". That overstates things until L1 is fixed.
  - The entry header at `mb1-replay.mjs:53-55` still calls the binding read the last step before the final guards. SF-7d reported this one.
  - `handoff.md:16` is accurate only for the checks inside `shared-apply`.
- **I-2 · already there before SF-7d.** Two more ways a run can exit 1 after the state is written, neither about the container:
  - a lock-release STOP (`mb1-replay.mjs:191-192`);
  - a failed evidence write (`:196-197`).

  So `sharedApplied` can't honestly mean "the run exited 0". The definition below takes this into account.
- **I-a, I-c:** unchanged, and acceptable as before.
- **I-b:** still open. `shared-snapshot` and `shared-suite` don't recheck the start time when they finish.

## What `sharedApplied` should mean
- **Today, as coded:** `afterSharedMigrate` returned the verified state. That means all of these held:
  - `migration up` exited 0 and printed at most the candidate's Applying line;
  - the candidate, every input guard and Docker's binding were unchanged;
  - the proven container ID kept its pinned start time just before and just after the after snapshot;
  - that snapshot, read by ID, matched the replay's `after`.

  It does **not** mean the run exited 0, or that no STOP followed.
- **Proposed:** all of the above, plus the by-name start-time check after `shared-apply` held, and only then is it written.
  - It describes the state of 55321, not the run's exit code. The evidence file records the run's outcome.
  - `sharedApplyAttempted` without `sharedApplied` means `migration up` started but wasn't verified (the SF-2 incident path).
  - `55321-after` on its own is not a verification: a later `shared-snapshot after` records it without `sharedApplied`.

## Smallest correction (entry only, scoped to `shared-apply`)
```js
let checkedAfter = false;
try {
  const result = await spec.run(ctx, positional[0]);
  if (op === 'shared-apply' && result.code === 0) { checkedAfter = true; await sharedUnchanged(ctx, `after ${op}`); }
  if (result.state && op !== 'teardown') ctx.fs.writeFileSync(/* unchanged */);
  return result;
} finally {
  if (spec.lifecycle && !checkedAfter) await sharedUnchanged(ctx, `after ${op}`);
}
```
- I kept this to `shared-apply` on purpose. Moving the check ahead of the write for every command would drop a recorded `stopRecorded` from migrate, diff or lint, and the generation counter from `stop`.
- No current test expects the old order for a verified apply, so I expect the 308 tests to pass unchanged.

**Test to write first (RED today):**
- Start from `atSharedApply`. Set `provenRuns = provenWith(4 × pinned, 4, effect)`, where `effect` sets one of:
  - a restart: `shared = RESTARTED`;
  - a stop: `shared = STOPPED`;
  - another start time once: `inspect = ok(OTHER)`;
  - a timeout: `inspect = TIMEOUT`.
- Expect, in each case:
  - exit 1 with the refusal;
  - `sharedApplied` false, no `55321-after`, the attempt recorded;
  - the calls equal the verified sequence, with exactly one check by name at the end;
  - the next `shared-apply` refused as already attempted;
  - in the one-off cases, `shared-suite` refused with "needs shared-apply…".
- Clear `w.inspect` between cases: `reset` doesn't.
- Today this fails on `sharedApplied` being true. A planned mutation (not run) would move the check back after the write.

**Text to fix:** the comment at `order.mjs:96-99`, the note in `shared.mjs:166-167`, the entry header, and line 6 of the SF-7d test.

## What I checked
- **Ran:**
  - `git --no-optional-locks status --short`, before and after: the same 32 untracked entries both times and no tracked change.
  - `node --version`: v22.23.1.
  - The 20 test files, named one by one, run once:
    - TAP report: `1..159`, tests 308, pass 308, fail 0, cancelled, skipped and todo 0, `duration_ms 14664.6`;
    - the four SF-7d tests are `ok 118`–`121`, and the scope test passes;
    - the TAP went to a new file, `/tmp/fitlog-mb1-sf7d-review-1102.tap`, my only write;
    - Claude Code also saved the long on-screen output to its own tool-results folder, outside the repository.
- **Read (inspected):**
  - All four L1/L2 checks: the last check by ID before `migration up` is followed only by synchronous guards, the attempt record and the spawn, with no `await` in between. The checks after `migration up` return the state as it was on every failure.
  - IDs are validated as 64-hex before any inspect.
  - The six test files with changed expectations.
  - What the tests touch: only `mkdtemp` folders, fetch replaced by doubles that throw, and read-only git in `check-sql-sources`.
  - Privacy: the candidate is one restrictive `alter policy` (owner plus `member_active()`), and its pin test passed in my run. No staff path to health data opens, so the PRD §16.1 / ADR003 override holds.
- **Taken from the implementer, not re-run:** RED 15/37, GREEN 37/37, the 307/308 run and the 3/3 scope rerun, and the §8 secret scan.
- **Not run:**
  - every mutation (SF-7b's eight, SF-7c's four, SF-7d's five, and the one above);
  - hashes and `date`;
  - any probe of the L1 window;
  - Docker, the database, SQL, the network, the runner and `backend:test`.

  I edited nothing, staged nothing and committed nothing, and the raw finals are untouched. I didn't run the Python launcher at the end of the prompt.

## Next step
1. **SF-7e:** one pure-code, test-first phase that is allowed to edit `mb1-replay.mjs`, a new test file and the four places listed above. Apply the correction, write the RED test, then GREEN, then the full suite once, then a fresh independent review.
2. **Then, separately:** the read-only M1 live read under its own authorization.

Neither step authorizes a shared apply. The shared apply, SF-1 to SF-6, B1, B2 and box 3 stay open.

```
GOAL: MB-1 · REVIEW: SF-7d independent review (read-only)
HEAD: 2a95726 (uncommitted tree unchanged; nothing staged or committed)
FINDINGS: C0 H0 M1 (carried) L1 (new, self-reported) I4
TESTS: executed once, Node v22.23.1, 20 files: 1..159, 308/308
STATUS: SF-7d acceptable for code; 1105Z L1 fixed, L2 narrowed (entry window open); not Done; 0/4 boxes
```
