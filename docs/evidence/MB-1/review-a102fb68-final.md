# MB-1 phase 1C independent review, final verdict (verbatim, provenance a102fb68-5d26-4e2b-8889-2c4741ac0831)

| Field | Value |
|---|---|
| Source | `/tmp/fitlog-a102fb68-final.md`, the review's final message as the Codex coordinator supplied it to phase 1D ("Read … /tmp/fitlog-a102fb68-final.md. Persist verbatim independent review with full session provenance a102fb68-5d26-4e2b-8889-2c4741ac0831"). The reviewing session's full id is `a102fb68-5d26-4e2b-8889-2c4741ac0831`, as the coordinator gave it; `a102fb68` in the file name is its first block. No transcript was read |
| Reviewed | The uncommitted phase 1C work on `codex/mb1-identity` (base local `main` `2a95726`): `scripts/backend/mb1-replay.mjs`, `mb1-replay-target.mjs`, `mb1-replay-evidence.mjs`, their tests, `verify-identity.mjs` and its test, and `docs/plan/runs/MB-1/` |
| Copied | 26 October 2026, during phase 1D, before any code change of that phase, by reading that file. Everything below the rule is the file's text, unedited; the only byte added is a final newline, which the source lacks (`git diff --no-index` against the source shows nothing else: [phase1d.md](../../plan/runs/MB-1/phase1d.md) §4) |
| Dispositions | [phase1d.md](../../plan/runs/MB-1/phase1d.md) §2. This file records what the reviewer said, not what has changed since. Its finding 1 failure scenario (a `SUPABASE_*` variable overriding `project_id`) is the reviewer's inference from reading the CLI's config loader; it was not reproduced live, then or since |

---

# MB-1 phase 1C safety review: the runner and the bounded replay plan

**Verdict:** the bounded replay plan is **approved on conditions**. No critical or high findings; one medium and four low.

All six fixes for review 39fe1fb5 are in the code. Two leave gaps:
- **Fix 1 (high):** the runner never ties the destructive `stop --no-backup` to the replay's project ID (finding 1).
- **Fix 5 (low):** the signal cleanup works when `verify-identity.mjs` runs alone, but its output is lost when the suite runs inside the runner, which is how the plan always runs it (finding 2).

**What I ran:**
- `rtk proxy node --test scripts/backend/*.test.mjs`: **83 pass, 0 fail**.
- `rtk proxy node --check` on all seven scripts: no errors.
- The permission mode denied `git status` and a pure `node -e` probe of the SQL check. I didn't retry either, so finding 3 comes from reading the code.
- All in-scope files are untracked, so there is no tracked diff; I read every file in full.
- I made no edits and no database, Docker, Supabase or network calls.
- I didn't run the Python launcher at the end of the brief, because the brief forbids launchers and subagents.

## Findings

### 1. Medium: `stop --no-backup` is not tied to the replay's project ID
- **Location:** `mb1-replay.mjs:50` (every child process inherits the whole environment), `:43`, `:79-87`, `:322-329`. Teardown uses the same code at `:334-338`.
- **Defect:** the checks prove which config file, URLs and container name are in play. They never prove which project ID the CLI actually uses. `stop` removes containers and volumes by that project ID. From my reading of the CLI's config loader, `SUPABASE_*` environment variables override `config.toml`, including `project_id`. That was not verifiable this phase.
- **Failure scenario:**
  - At step 5.1 or 7.2, `SUPABASE_PROJECT_ID=fitlog_rebuild_20261017` is in the environment.
  - `status` still answers on 56421/56422, because the ports come from the replay config, and the replay container is running. Every check passes.
  - `stop --no-backup` then stops 55321 and deletes its data volumes. `sharedUnchanged` only reports STOP afterwards.
  - If the variable is set from step 1 onwards, `start` refuses, so the real window is an environment that changes between commands.
  - Likelihood is low, but this is the last path from a replay command to 55321's data, and D7 forbids it.
- **Fix:**
  - Spawn children with an allowlisted environment.
  - Refuse if any `SUPABASE_*` variable is set, printing names only.
  - Send `stop --project-id fitlog_mb1_replay_<date> --no-backup`, and add `--project-id` to `verify-cli`.
  - Add a test that the executor sees no `SUPABASE_*` variable and that the stop arguments carry the literal ID.
  - Until then, step 0 should print the names of any `SUPABASE_*` variables (expect none), repeated right before 5.1 and 7.2.

### 2. Low: finding 5's fix is lost when the suite runs inside the runner
- **Location:** `mb1-replay.mjs:309-312`; `verify-identity.mjs:127`, `:210`.
- **Defect:** the runner passes the suite only its target and an in-memory output buffer. The suite therefore uses `process` signals and `process.exit`. Its output is printed only after it returns.
- **Failure scenario:**
  - Ctrl-C during `suite` or `shared-suite`.
  - Cleanup runs, then the signal handler calls `process.exit(130)` before the runner prints anything. Its exit is queued before the suite's own cleanup wait.
  - The "Fixture cleanup needs attention: the member B account (…@example.invalid) may exist" line is lost. No evidence file or state entry is written.
- **Fix:**
  - Pass the suite an `exit` that does nothing, so `main` returns, the runner prints and records the failure, and the process then exits.
  - Add a runner test with the real `main`, a fetch double and an event emitter.

### 3. Low: the read-only SQL check can be bypassed, and nothing ties the run to the reviewed SQL
- **Location:** `mb1-replay-evidence.mjs:347-348`, `:370`, `:403-409`; `mb1-replay-target.mjs:86-88`; `mb1-replay.mjs:113-117`.
- **Defect:**
  - The check skips the contents of quoted strings, and functions that run SQL text (`query_to_xml`, `cursor_to_xml`, `table_to_xml`) are not denied.
  - Inside a read-only transaction, `pg_terminate_backend`, `pg_sleep` and advisory locks still work.
  - The hash pin is taken at `prepare` from whatever the untracked `phase1.md` says then. The manifest only vouches for itself.
- **Failure scenario:** an edited block, such as `select query_to_xml('select pg_terminate_backend(pid) …', true, true, '')`, passes the check. Step 6.2 then kills other lanes' connections on 55321. No data is written. Today's block (`phase1.md:235-252`) is clean.
- **Fix:**
  - Put the reviewed block's sha256 into the runner as a constant, and refuse any other block at `prepare` and before every snapshot.
  - Optionally, switch to an allowlist of the names the block may use.
  - Until then, the coordinator records the sha256 at authorization and compares it with the `phase2-1-prepare` evidence.

### 4. Low: `shared-apply`, the only write to 55321, has the weakest safeguards
- **Location:** `mb1-replay.mjs:197`, `:369-378`, `:407`.
- **Defect:**
  - No `--confirm`, although `stop` and `teardown` need one.
  - A `55321-before` snapshot of any age is accepted, and it isn't taken again just before the apply.
- **Failure scenario:**
  - The run pauses after 6.2.
  - Another lane changes `profiles` policies or `member_active()` on 55321 without a restart, so the pinned start time is unchanged.
  - The candidate is applied over a state no snapshot saw.
  - A migration version only on 55321 makes `migration up` fail by itself, so that case is already safe.
- **Fix:**
  - Require a separate confirmation token.
  - Inside `sharedApply`, take the read-only snapshot again right before `migration up` and require it to equal the replay's `before` snapshot.

### 5. Low: two commands can run at once, and the CLI can outlive a timeout
- **Location:** `mb1-replay.mjs:433-456` (`state.json` is read at :441 and written at :451); `:49-51`.
- **Defect:**
  - No lock: two invocations interleave, and the last write to `state.json` wins.
  - On timeout, `spawnSync` stops `pnpm`, but not the `supabase` process it started.
- **Failure scenario:**
  - Parallel tool calls such as `mutate` during `suite` scramble the record.
  - A timed-out `migration up` or `stop` can keep running after the runner has exited with 1.
  - Snapshots and verdicts catch most of this, but the state record stops being reliable.
- **Fix:**
  - Hold an exclusive lock file in the replay directory for the whole command, and add it to the runner's own files.
  - Call `node_modules/.bin/supabase` directly, or kill the whole process group on timeout.

## Checked, no finding
- **Target path:** the regex matches the whole string, `\d` matches ASCII digits only, the date must be real, and no I/O happens first. The tests cover a trailing `/`, a newline, `/private` and `..`.
- **Replay directory:**
  - Symbolic links are refused, and the real location is checked.
  - The sentinel must match exactly, and every manifest file's sha256 is checked.
  - Paths are safe: no `..` or leading dot.
  - The directory walk doesn't follow links.
  - Any entry the runner didn't create is refused before every command, so `start` can't apply an unpinned migration.
  - The config must name the replay project and its 564xx ports, and no 553xx or 8183 port.
- **Command arguments:** commands are argument arrays with no shell (test 36 shows `$(…)` and `;` stay inert), and `--workdir` is always the literal path. `mutate` can only reach the container named from the date, with `-X`, `ON_ERROR_STOP` and `--single-transaction`.
- **Read-only snapshots:** `PGOPTIONS` sets the session default to read-only, the file starts with `begin transaction read only`, the proof query's output is parsed (both `on`), the output must have its exact shape, and `ROLLBACK` is required. The repository must equal the replay byte for byte before `shared-apply`.
- **Output and evidence:** output passes the allowlist, then redaction, then the secret scan. `status` JSON is never printed, refusals are redacted, evidence is written only to new files (`wx`) with checked names, and stdout is built only from scanned pieces.
- **Suite verdicts:**
  - All 27 names must appear in order, and test 24 ties them to the suite's source.
  - Setup, cleanup, refusal and signal lines fail a run.
  - The ban answer must be recognised and equal the first run's.
  - Suites run at least 75 s apart.
  - A mutation counts only after its snapshot shows exactly its own change, and a restore only after nothing differs.
  - `diff` and `lint` must be clean on generation 2.
- **M2:** when the ban ends the session, M2 passes as 27 ok and the ban claim narrows, as R7 says. The phase 2 record must say which branch held.
- **Teardown:** it never deletes recursively. It removes files, then directories deepest first, then the sentinel, and refuses anything it didn't create.
- **verify-identity:** after a signal, no new request starts; cleanup waits up to 30 s for creations in flight, deletes are limited to this run's IDs, and no key is printed.
- **Other surfaces:**
  - The candidate SQL is unchanged and correct.
  - `backend:test` has no reset or stop.
  - No new dependency, AI, messaging or location code.
  - Output holds only synthetic `@example.invalid` emails and UUIDs.

## Decision on the bounded replay plan
1. **Before step 1:** close finding 1. The code fix is preferred; at minimum, add the step-0 `SUPABASE_*` check, repeated before 5.1 and 7.2.
2. **Before step 6.2:** close finding 3, at least procedurally (record the reviewed sha256 and compare it with the prepare evidence).
3. **Before 6.3:** I recommend finding 4's confirmation token and fresh snapshot.
4. **Findings 2 and 5:** fix them, or record them as accepted.
5. **Teardown:** still needs its own authorization.

This is not a verdict on the goal: B1 and B2 stay open, and box 3 is not met.
