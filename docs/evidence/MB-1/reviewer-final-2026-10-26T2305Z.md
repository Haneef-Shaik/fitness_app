## Verdict

Phase 1H is **not blocked for the next replay-only step (§3)**. I found nothing critical, high or medium. Both findings of review 2026-10-26T2000Z are closed in code for what they asked. I found two new lows and two carried lows: one is the partial-M2-run gap you asked me to assess, and one is a test gap. B1, B2 and shared-apply all remain open. Box 3 is not met, and nothing is Done.

## Findings (most severe first)

### 1. Low: an incomplete M2 run whose banned check passed is still not a stop
- **Location:**
  - `mb1-replay-evidence.mjs:289-292`: `unkilled` requires `completeRun`.
  - `mb1-replay.mjs:480`: the runner uses the same rule.
  - Two tests require this behaviour: `mb1-replay-evidence.test.mjs:358-364` and `:434-440`.
- **The defect:** the stop is meant to mean "with the ban clause removed, something else refused member C". That is already shown once `ok - a banned account reads no profile` prints, whether or not the run finishes.
- **It can happen in practice:**
  - In `verify-identity.mjs`, the banned check is at `:191`. It is followed by `logout(a1, 'local')` at `:194`, whose assert is at `:119`, and `logout(a2, 'others')` at `:208`. Both are outside `check()`.
  - If either logout fails, or a SIGINT/SIGTERM arrives after check 15, the run ends with "verify-identity setup failed" (`:231`).
- **Failure scenario:**
  1. The first M2 run prints the banned check `ok` (the ban ended C's session this time), then the logout gets a 429 or 500. The run is not a stop and not a pass.
  2. 75 seconds later, `suiteNeeds` allows another run (`mb1-replay-order.mjs:66-72`). That run shows the exact kill and passes.
  3. Shared-apply's M2 requirement is now met, and the evidence for the stop has been discarded.

  The result is an overstated proof on local stacks, not a data exposure. The written rule that "any unexpected result stops the phase" still applies.
- **Fix (pure code, test first):**
  - Make the stop fail closed: any M2 run whose parsed checks include `a banned account reads no profile` with `ok` is the stop, whether or not the run is complete or in order.
  - Flip the two test blocks above. A setup failure that printed no checks stays "no stop".
  - Add a runner test whose run prints the banned `ok` and then `verify-identity setup failed: Logout (local) failed: …`.
  - Mutation B then becomes the intended behaviour. Replace it with a mutation that makes the stop require a complete run again, which the new test must kill.
  - **Needed before any `mutate m2` or `suite m2`; it does not block §3.**

### 2. Low (test gap): the post-`migrate` STOP when the CLI fails or times out is never tested
- **Location:** `mb1-replay.mjs:422-428` is correct today. But every replay `migrate` test, including the STOP tests at `mb1-replay.test.mjs:1752-1791`, uses the default exit-0 result (`:136`). `migrateResult` appears only in the shared-apply tests (`:1457-1468`).
- **Failure scenario:** a later edit such as `if (run.status !== 0) return { code: 1 }` placed before the recheck would pass all 128 tests. It would silently drop the STOP in exactly the case where it matters most: a timeout or partial run, where nobody knows where the CLI wrote.
- **Fix:** run the eight drift cases in that test again with a timeout (`status: null`) and with exit 1. Assert the STOP line, `stopRecorded`, and the candidate still `added`. Add the matching mutation.

### 3. Low: a change that is written and then undone during the CLI run is caught by neither recheck
- **Location:** `mb1-replay.mjs:369-376`. `replayGuards` compares content hashes only (`mb1-replay-target.mjs:343-356`).
- **Failure scenario:** the CLI reads `config.toml` some time after it starts. Suppose a process running as the same user sets `[db] port = 55322` after the pre-spawn recheck, the CLI reads it, and the file is restored before the CLI exits. Both rechecks pass, and the candidate could reach 55321 with no STOP. The same residual applies to shared-apply.
- **Realistic threat:** an accidental concurrent writer. A same-user attacker could reach 55322 directly anyway.
- **Fix:**
  - Under the lock, record `lstat(…, { bigint: true })` `ino` and `ctimeNs` for every pinned file and for the owned directories. After the CLI, compare them and treat any difference as a STOP. A same-user process cannot reset ctime.
  - Expect a fail-closed STOP if the CLI creates `supabase/.temp` for the first time.
- **Until fixed:** keep the previous review's condition that nothing else writes to the replay directory or to the worktree's `supabase/` while `migrate` runs.

### 4. Low (carried, phase1h §7.3): `diff`, `lint`, `migrations` and `stop` have no pre-spawn recheck
- **Location:**
  - `mb1-replay.mjs:391-401` (`migrations`)
  - `:435-442` (`checked`, which runs diff and lint)
  - `:491-498` (`stopReplay`)
- **Failure scenario:** the same window as finding 2 of the previous review.
  - `diff` reads the config's `[db] port` and `shadow_port`.
  - As I understand it, `db lint` creates `plpgsql_check` inside a transaction it rolls back. If the port were redirected, that would be a rolled-back write attempt on 55321. I have not checked this against the installed 2.121.0.
- **Fix:** call `replayGuards` synchronously as the first statement of each of these commands. Add an after-check that STOPs for `diff` and `lint`. **Needed before §5, not before §3.**

### 5. Informational
- **Mutation M's evidence is weaker than it reads.** The drift loops stop at the first failing case (`mb1-replay.test.mjs:1708-1717`, `:1732-1742`, `:1761-1782`). Under M, the replay `.env` case fails on its message only, so the repository `.env` case after it never ran. I agree from reading the code that it would be killed for real, but no test run shows it. Use one subtest per drift case.
- **The mutations are recorded in prose only.** Keep each mutation as a patch next time, so a reviewer can re-apply it.
- **`mb1-replay.test.mjs` is 1971 lines,** against the 800-line limit (carried).

## The points you asked me to verify

| Property | Result | Where |
|---|---|---|
| Any complete M2 run whose banned check passed is the STOP, whatever the answer (live, banned, ended, unrecognised, none, two lines, mismatch), the exit code, or withheld output | **Verified** | evidence `:315-322`; runner `:480-488`; 192-case permutation test `:408-443`; runner `:1560-1618` |
| A STOP outranks an earlier pass | **Verified** | order `:87-95`: the stop is checked before the "missing proofs" list; `:66-69`: the stop before the pass. 39 orders tested (order.test `:45-82`) |
| A passed M2 is refused on any repeat | **Verified** | order `:68-69`; runner test: refused after only `inspect`, and the suite does not run |
| `start` and `migrate` recheck synchronously before the child process | **Verified** | `:378` and `:421`, then `supabase()` `:167-169` → `cliCall` `:165` → wrapper `:763` → `runCommand` `:111-113`, which spawns inside the Promise executor. No await anywhere in that chain. The test with the ordered log of events confirms only config reads come between the last `docker ps` and the spawn |
| The post-`migrate` STOP is durable | **Verified** | `:425-427` builds the STOP state; dispatch writes it (`:735`) before the lifecycle check (`:738`); `haltNeeds` (`:722-723`) runs before the first child process; all 8 later commands are refused with **no** child process. If the runner is killed before that write, the lock stays and blocks every later command |

**Phase 1H's 15 mutations:** I read all 15 spec reports at `/tmp/fitlog-mb1-phase1h-mut-{A..O}.txt` by exact file name. Every pass/fail total and every failing test name matches phase1h §5.4: A 71/75; B, D, G, K, L, M, N and O 73/75; E 72/75; C, F, H, I and J 74/75. RED was 64/11 and GREEN 75/75. All of them are sound kills, with the exceptions in findings 2 and 5.

## Closed and open

- **Closed:**
  - Review 2026-10-26T2000Z finding 1. Only the partial-run gap remains (my finding 1).
  - Review 2026-10-26T2000Z finding 2, for `start` and `migrate`. The remaining gaps are my findings 3 and 4.
  - Review bbe2fbba's four lows: no regression.
- **Open:**
  - My findings 1 to 4.
  - Carried and accepted as design: no recheck after `start` (a port collision is inferred, not observed), and the halt also blocks `teardown` and the read-only `shared-snapshot before`. The coordinator needs a written procedure for clearing `stopRecorded`, including a read-only check of 55321.
  - The live CLI's writes during `migrate` have not been observed.
  - **B1, B2 and shared-apply** (not authorized; `sharedApplyNeeds` refuses on attempt 4's state).

## Tests and hashes I ran

- `rtk proxy node --test scripts/backend/*.test.mjs`: **128 tests, 128 pass, 0 fail** (`duration_ms 6310.995667`).
- `rtk proxy node --check` on 9 files, each its own command: all exit 0 with no output.
- `rtk proxy sha256sum`: all **16** values equal phase1h §6 and handoff.md:
  - the 7 replay code and test files;
  - `verify-identity.mjs` `944ba934…cdbf81` and its test `902bb699…521021`;
  - the candidate `ac262f39…bdc3` and `config.toml` `67a35911…1b94`;
  - `phase1.md`, `phase1h.md`, `checkpoint.md`, `phase2-plan.md` and the review copy.
- **Git status:** taken from the session-start snapshot (not re-run). It shows the 12 untracked MB-1 paths and no tracked change.

## Done-when boxes (none met)

| Box | Met |
|---|---|
| 1. Email signup, verify and reset; Google and Apple adapters; linking without automatic merge | **No.** Not started |
| 2. Under-18 rejection, notices recorded, onboarding resumes | **No.** Not started |
| 3. A revoked session fails on its next request; a user reads only their own profile | **No.** RED only, on the replay. No GREEN, nothing applied to 55321, B1 and B2 open |
| 4. AC16 fixtures pass, contract published | **No.** Not started |

## Next bounded phase

1. **§3 only, on the running replay, under its own authorization:** `add-candidate`, `migrate` (expect both "rechecked" lines), `snapshot after`, `suite green` (expect the answer `banned`).
   - Each runs as a background job and is never killed.
   - First re-hash the 16 files and the 4 CLI files, and confirm 128/128.
   - Stop on any refusal or STOP. Nothing else may write to the replay or to `supabase/` during `migrate`.
   - M1 and M3 may follow, each with its own authorization.
2. **Before `mutate m2`:** one pure-code, test-first phase for findings 1 and 2, independently reviewed. Add finding 4 (and ideally 3) before §5's `diff` and `lint`.
3. §6 (55321) stays **not authorized**.

## Limitations and scope notes

- **Hashing:** you asked me to run only the tests and `node --check`, but also to verify hashes. I read "verify hashes" as permission for one read-only `sha256sum`, which runs no project code. Strike it if you meant otherwise.
- **Path:** the brief's `docs/evidence/MB-1/phase1h.md` does not exist. I read `docs/plan/runs/MB-1/phase1h.md` instead.
- **What I touched:** no tool call was denied. I edited, committed and changed nothing, and used no subagents, network, database, CLI, Docker or runner. I never opened or listed `/tmp/fitlog-mb1-replay-20261026`.
- **Policy:** this change touches no staff, consent or health-data path, so PRD §16.1 and frozen contract 003 (staff never read or write private health data, whatever the consent) are not engaged. The same goes for AI, messaging and location. No new dependency was added.
