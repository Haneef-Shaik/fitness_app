SF-7e is done: the fix and its tests pass (320/320 on the one full run), but MB-1 is not ready for verification. No Done-when box is met, and a fresh independent review comes next.

**The fix.** `dispatch` used to write a verified `shared-apply` result to `state.json`, then run the start-time check by name in `finally`. If that check failed, the run exited 1 but the verified apply was already on disk. I applied the 1132Z reviewer's minimal correction, unchanged, in `mb1-replay.mjs`:
- When `shared-apply` exits 0, the check by name now runs before the state is written, and `finally` skips it. Exactly one check runs after the apply.
- Every other `shared-apply` outcome and every other lifecycle command still writes its state first and is checked in `finally`. So `stopRecorded`, `stop`'s generation and the checks on error paths still persist.
- `sharedApplied` now means every check inside `shared-apply` held, then the check by name, before the write. It describes 55321, not the exit code: a lock-release STOP or a failed evidence write can still follow.

**The new test file**, `mb1-replay-sf7e.test.mjs`:
- **Four failure cases** (restart, stop, another start time read once, timeout), each landing after the last ID inspect. Each run exits 1 with only the attempt on disk: no `sharedApplied` and no `55321-after`. The next `shared-apply` is refused as already attempted. `shared-suite` is refused, and in the one-off cases that refusal comes from `state.json` alone.
- **A success control** showing the check by name comes before the write of the verified state.
- **Five controls**: `migrate` and `diff` keep `stopRecorded`; `stop` keeps its generation; a refused `shared-apply` and `shared-apply`'s own STOP still get exactly one check in `finally`.

The other edits are comments only. The four stale-wording spots from 1132Z I-1 are fixed: the entry header, `order.mjs`, `shared.mjs` and line 6 of the SF-7d test. The scope test needed no change.

**Tests (executed, Node v22.23.1):**

| Run | Files | Result |
|---|---|---|
| RED | new file, SF-7d test, scope test | 19 tests, 6 failing, each for its intended reason: the four failure cases plus their parent, and the success control. All five controls passed |
| GREEN | the same three | 19/19 on the first run; no test changed after the code |
| Full suite, once | all 21 test files | `1..162`, tests 320, pass 320, fail 0 (308 + 12 new), on the final code bytes; only records changed after it. A copy of the output is in `/tmp/fitlog-mb1-sf7e-final.tap` |

**Also executed:** the §8 secret scan with the Grep tool printed exactly the five allowed lines and six tokens. The working tree started at 32 untracked entries and ended at 33 (the new test file), with no tracked change.

**Inherited, not run:** the reviewer's 308/308 baseline.

**Not run:**
- All planned mutations: SF-7b's 8, SF-7c's 4, SF-7d's 5 and SF-7e's 4.
- Hashes.
- `date`, which was denied in SF-7d.
- Any runner, Docker, database, SQL, network or `backend:test` command.
- The `code-reviewer`, `security-reviewer` and `tdd-guide` passes, which the brief forbids.
- The Python launcher in your message.
- Commits or staging.

**Still open:**
- **M1** (carried).
- **Exit 1 with `sharedApplied` true** is still possible after a lock-release STOP or a failed evidence write (1132Z I-2). This is stated, not changed.
- **A stdout line the reviewer may want changed.** On the new STOP, stdout still prints `shared-apply`'s own line saying 55321 equals the replay's after snapshot before the exit line. Exit 1 and the refusal on stderr and in the evidence file carry the outcome. I added no stdout STOP line, to keep the correction minimal.
- **Blocked:** shared apply, SF-1 to SF-6, B1, B2 and box 3.

The full record is in `docs/plan/runs/MB-1/sf7e.md`.

```
GOAL: MB-1
BRANCH: codex/mb1-identity
HEAD: 2a95726 (uncommitted working tree; nothing staged or committed)
HANDOFF: docs/plan/runs/MB-1/handoff.md
BOXES: 0/4 Done-when boxes met
STATUS: blocked
NOTES: SF-7e done (1132Z L1 fixed; full suite 320/320 once on Node v22.23.1; RED 6/19 then GREEN 19/19); mutations UNRUN, no hashes, no subagent reviews (brief); fresh independent review of SF-7e next; M1, shared apply, SF-1–SF-6, B1, B2, box 3 still blocked
```
