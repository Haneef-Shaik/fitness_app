# MB-1 phase 1G: independent read-only review

**Verdict: not blocked for the next replay-only step.** On a static reading, all four of review bbe2fbba's lows are fixed in code, and the M2 kill under `banned` is nonvacuous. I found two new low findings, one in the M2 stop and one older. Nothing critical, high or medium. `shared-apply` is still unauthorized, and the runner refuses it on today's state. B1 and B2 are open, box 3 is not met, and nothing is Done. I edited nothing and never touched `/tmp/fitlog-mb1-replay-20261026`.

**This review is not bound by hash.** Bash was denied in this session, so I ran no `sha256sum`, no `node --check` and no tests. The review covers the files by path and line count only. All six match phase1g §8: 759, 430, 580, 85, 1723 and 589 lines.

## Findings

### 1. Low: the M2 stop does not cover every case it claims to
- **Location:**
  - `mb1-replay-order.mjs:59-60`: `sharedApplyMissing` uses `passed(state,'m2')` and never reads `m2Stopped`.
  - `mb1-replay-order.mjs:53-55`: `suite m2` can run again after a pass.
  - `mb1-replay-evidence.mjs:300-305`: `M2_UNKILLED` is added only in the `live` or `banned` branch.
  - `mb1-replay.mjs:459`: the STOP line says "shared-apply stays blocked".
- **The defect:** there are two holes.
  - **A pass, then a 27-ok run.** After an exact kill, a second run is allowed after the 75 s spacing. If it shows 27 ok, the runner prints STOP and records `m2Stopped`. But the earlier pass still satisfies `shared-apply`'s M2 requirement, so the printed line is false.
  - **A complete run whose banned check passed, under an `ended` or unrecognised answer.** That run takes the `M2_ENDED` or no-ban branch. `M2_UNKILLED` is never added, so nothing stops a later `suite m2`. An `ended` answer with 27 ok is exactly the "the ban ended the session" case the stop exists for.
- **Failure scenario:** the ban sometimes ends member C's session. On this `banned` replay:
  - Run 1 answers `session_not_found` with 27 ok: not met, and no stop is recorded.
  - Run 2 answers `user_banned` with the exact kill: met.

  `shared-apply`'s M2 prerequisite is then satisfied, which phase1g §4 and phase1.md R7 say cannot happen. The result is an overstated proof on local stacks, not a data exposure. The written rule that any unexpected result stops the phase still applies.
- **Fix (pure code, test-first):**
  - In `judgeSuite`, add `M2_UNKILLED` for any complete M2 run whose banned check is ok, whatever the class.
  - In `sharedApplyMissing`, block whenever any suite entry has `m2Stopped`.
  - In `suiteNeeds('m2')`, refuse once a passing M2 exists.
  - Add tests for a pass followed by 27 ok, and for `ended` with 27 ok under a `banned` reference. Make the evidence test at `:372` assert the stop.

### 2. Low (from before phase 1G): the replay `migrate` reads the replay config after the last check
- **Location:** `mb1-replay.mjs:693` is the last `checkOwnedDir`. Awaits follow at `:696` (inspect) and `:702` (status and `docker ps`), then `migrate` (`:400-407`) starts the CLI. Afterwards only the container start time is checked (`:709`).
- **The defect:** the CLI reads `<replay>/supabase/config.toml` seconds after it was hashed. `shared-apply` got a synchronous recheck before the CLI and a recheck after it (`:529-535`, `:591`, `:612`). Replay CLI commands did not.
- **Failure scenario:** another process running as the same user sets the replay's `[db] port` to 55322 inside that window. `migrate` then writes the candidate to 55321, which is an unreviewed write under D7. The next command refuses on the hash, but only after the write. The threat level matches bbe2fbba finding 1.
- **Fix:** rerun `checkOwnedDir` and the `SUPABASE_*` and `.env` refusals synchronously, immediately before the `start` and `migrate` child processes. Rerun them after `migrate` as a STOP. Test it by changing the port during `onMigrate`.
- **Not blocking §3,** provided nothing else writes to the replay directory or to the worktree's `supabase/` while it runs.

## Review bbe2fbba's four lows

| Low | Status | What I verified |
|---|---|---|
| 1. Staging, attempt record, proof after the apply | **Closed in code** | See below |
| 2. M2 | **Closed, apart from finding 1** | See below |
| 3. Detail lines | **Closed** | See below |
| 4. Immutable `before` | **Closed** | See below |

**Low 1, in order:**
- **Before the CLI:** the early checks and the fresh 55321 snapshot come first. `stageInput` reads the repository config once and binds it. It stages the replay's own pinned copies, writes each exclusively (`wx`), pins them in the manifest and never rewrites them. Then:
  - `inputGuards` runs;
  - the staged status must be at 55321, with its database at `127.0.0.1:55322`;
  - `guardsBeforeMigrate` and `recordApplyAttempt` run synchronously;
  - the child starts in the same tick, because `runCommand:108-110` spawns inside the Promise executor.
- **After the CLI:** the candidate is hashed again, then every guard runs as a STOP. Then the exit code and the `Applying` lines are checked. Finally a read-only snapshot must equal `after`, including P3 `statements_md5`.
- **What an attempt blocks:** a further `shared-apply` and `shared-snapshot before`. `shared-snapshot after` stays allowed, and `sharedApplied` is set only by a verified apply.
- **Residuals already in phase1g §9, which I accept:**
  - the live CLI has not been seen running from the staged workdir;
  - the CLI's own `.temp` and `.branches` under the staged copy are not pinned;
  - a write during the CLI run is caught only afterwards;
  - a `retain` before staging would block teardown, which fails safe.

**Low 2:**
- **Refused under `ended`:** `mutate m2` is refused before any SQL is sent (`order:39`), and the verdict fails (`evidence:301`).
- **The kill under `banned`:** it needs exactly the one failure with the exact detail line, exit 1, the exact summary, the reference answer, and every other check ok.
- **Why the kill is nonvacuous:**
  - `m2.sql` removes only the ban clause (`evidence:576`).
  - The m2 snapshot may differ from `after` only in `P1.fn_definition_md5`.
  - P2 reads every policy on `profiles` (`phase1.md:255-257`), so `profile_read` is the only SELECT path.
  - Without the ban clause, `member_active()` returns true only if an `auth.sessions` row exists (`member_core.sql:30`).
  - Setup asserts a future `banned_until` (`verify-identity.mjs:187-188`).

  So `HTTP 200, 1 row(s)` for member C proves its session still existed in that run, and that only the ban clause was missing.

**Low 3:**
- The parser keeps exactly the next line indented by two spaces, and the comparison is exact.
- `brief()` and `noRows` print exactly `HTTP 200, 1 row(s)` for a one-row read (`verify-identity.mjs:37,41,111`).
- A trailing space, a third leading space, a whitespace-only line or a lower-case variant all fail.

**Low 4:**
- `snapshotNeeds('before')` refuses before any SQL once a `before` snapshot exists. `snapshot before` is the only command that writes it.
- `snapshot after` can still be retaken in generation 1. That is fine: it must differ from `before` by an exact list, and the 55321 check after the apply compares against it.

## State, authorization and blockers
- **State (from the docs only):** attempt 4's `state.json` still passes `readState`. The missing `sharedApplyAttempted` and `m2Stopped` fields read as absent, and the staged directories are optional. On that state:
  - `snapshot before` is refused, as intended;
  - `add-candidate` is allowed;
  - `mutate m2` would be allowed later under `banned`;
  - `shared-apply` is refused: it lacks M1, M2, M3, a generation-2 green, diff, lint, images and `55321-before`, and needs its own token.
- **Phase 1F change:** `sharedApplied` no longer marks a STOP; the attempt record does. This is compatible, because no STOP was ever recorded.
- **Authorization:** `shared-apply` is unauthorized (checkpoint:314-315 and phase2-plan §6).
- **Blockers:** B1 and B2 are open (checkpoint:289-295 and phase2-plan §9).
- **Git status:** the session-start snapshot shows only the 11 untracked MB-1 paths, with no tracked change and no new dependency.

## Tests
- **Not run by me.** The 120 pass, 8 `node --check` and 23 mutation results are the implementer's record only.
- **Read:** runner tests `:894-1132` and `:1261-1543`, and evidence tests `:253-425`. They cover what phase1g §7.3 claims, except finding 1's two cases.

## FitLog checklist
This change is replay tooling only: no route, member data, consent, AI, messaging or location path. The test fixtures are labelled placeholders, redaction is unchanged, and all SQL is hash-pinned.

## Next bounded scope
1. **Before any runner command, in the same phase:**
   - hash the phase1g §8 files, plus `verify-identity.mjs`, its test, the candidate, `config.toml` and the four CLI files;
   - run the 8 `node --check` and the tests, which must give 120 pass;
   - confirm the line counts above. Any difference means this review must be redone.
2. **Then §3 only, on the running replay.** Run each command as a background job, never killed. Stop on any refusal, STOP line or unexpected result.
   - `add-candidate`: prints `ac262f39…bdc3`.
   - `migrate`: only the candidate's `Applying` line, with no other writer touching the replay directory or the worktree's `supabase/` (finding 2).
   - `snapshot after`: changes exactly `P2.profile_read.qual` and `P3.+20261026040045`.
   - `suite green`: 27 ok, exit 0, ban answer `banned`.
   - Then hash the four CLI files again.
3. **Before `mutate m2`:** fix finding 1 test-first, then have it independently reviewed. M1 and M3 don't depend on that fix.
4. **`shared-apply`:** stays unauthorized until every prerequisite in phase2-plan §6 is met.