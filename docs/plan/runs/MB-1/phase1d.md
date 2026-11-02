# MB-1 phase 1D — closing review a102fb68 before any live operation (box 3; no database execution)

| Field | Value |
|---|---|
| Goal and box | MB-1, box 3: "A revoked session fails on its next request, and a user can read only their own profile (cross-user test)" |
| Attempt | 1, phase 1D, a bounded phase: close all five findings of review a102fb68 in code, pure tests and the plan. Local Claude executor; the Codex coordinator acts under the owner's AUTH-01 delegation |
| Worktree | `/Users/Adya/.codex/worktrees/fitlog-mb1/fitness_app`, branch `codex/mb1-identity`, base local `main` `2a95726`. Nothing committed |
| State | **All five findings are closed in code, with regression tests, and the plan is updated, ready for the coordinator's independent review.** No database, Supabase, Docker, network or provider call was made, and no schema or fixture operation. The candidate SQL is **unapplied** and unchanged. Box 3 is **not met**; B1 and B2 stay open |
| Read | RTK rules (`/Users/Adya/.codex/RTK.md`); [checkpoint.md](checkpoint.md), [phase1c.md](phase1c.md), [phase2-plan.md](phase2-plan.md), [phase1.md](phase1.md) §7; the full review `/tmp/fitlog-a102fb68-final.md`; every phase 1C script and test; `local-stack.mjs`; the installed CLI shim `node_modules/supabase/dist/supabase.js` and its `package.json` (2.121.0), read as files, not run |
| Review | [review-a102fb68-final.md](../../../evidence/MB-1/review-a102fb68-final.md), verbatim, with the reviewing session's full id `a102fb68-5d26-4e2b-8889-2c4741ac0831`: no critical, no high, one medium, four low |

## 1. Files

All are uncommitted (untracked, as in phase 1C).

| Path | Change |
|---|---|
| `scripts/backend/mb1-replay.mjs` | The executor is now asynchronous: each child runs in its own process group with exactly an allowlisted environment, and a timeout or a signal stops the whole group (findings 1, 5). `SUPABASE_*` refusal by name; the installed CLI run directly by node; `stop --project-id <literal>`; the lock lifecycle; the preconditions constant before every snapshot; shared-apply's own token and fresh snapshot; the suite gets the runner's signals, status runner, CLI and an exit that does nothing; the shared-stack status check runs through the runner's own executor; an unfinished `docker inspect` is refused, never read as "absent" |
| `scripts/backend/mb1-replay-target.mjs` | The shared-apply token; the lock (`.fitlog-mb1-replay.lock`): its text, exclusive acquisition, release only with this invocation's token, never automatic removal; `prepare` takes the lock right after its exclusive `mkdir`; teardown releases its own lock after the files and directories, before the sentinel; `prepare` refuses any preconditions block but the reviewed one |
| `scripts/backend/mb1-replay-evidence.mjs` | `PRECONDITIONS_SHA256`, the reviewed block's sha256 as a constant; the read-only check also refuses functions that run SQL text (`query_to_xml…`, `cursor_to_xml`, `table_to_xml…`, `schema_to_xml…`, `database_to_xml…`, `ts_stat`) and reads quoted identifiers as words; a command with no exit status "did not finish", never "did not run" |
| `scripts/backend/verify-identity.mjs` | `stackStatus` is asynchronous and takes the CLI command (`cli`), so the runner's executor answers it; fixture requests carry an abort signal; after a signal's cleanup, `main` returns even if a request never answers, and that request is aborted (finding 2) |
| `scripts/backend/mb1-replay.test.mjs` | 23 tests (15 before): every phase 1C test kept, adapted to the direct CLI and the new tokens (teardown now counts 28 files: its own lock is the 28th); 8 new (§2, §4) |
| `scripts/backend/mb1-replay-evidence.test.mjs` | 19 tests (17 before): 2 new (§4); one expectation changed from "did not run" to "did not finish" |
| `scripts/backend/verify-identity.test.mjs` | 14 tests (12 before): the status tests await the asynchronous `stackStatus` (same assertions); 2 new; the never-finishing-creation test now also requires `main` to return |
| `docs/evidence/MB-1/review-a102fb68-final.md` | New. The review, verbatim, under a provenance header with the full session id |
| `docs/plan/runs/MB-1/phase2-plan.md` | Step 0 environment check; the lock; the CLI as run; `stop --project-id`; shared-apply's token and fresh snapshot; the preconditions constant in 1.1; 95 tests at phase 1D |
| `docs/plan/runs/MB-1/checkpoint.md` | Phase 1D status, proofs, limits, and the next step |
| `docs/plan/runs/MB-1/phase1c.md` | One line pointing its 83-test count and residual risks to this record |
| `docs/plan/runs/MB-1/phase1d.md` | New. This record |

**Unchanged on purpose:** the candidate migration and every other migration; `local-stack.mjs` (shared; §5) and the other
`verify*.mjs` runners; `phase1.md` (its §7 block is now pinned by sha256, so it must not change); the root
`package.json`, lockfile, schema, contracts, mobile, domain and CI; `status.json`, the ledger and `GOALS.md`;
`phase1-red.log`, `security-phase1.md` and `review-39fe1fb5-final.md` (historical).

## 2. Dispositions of review a102fb68

Test numbers are from the final run of `rtk proxy node --test scripts/backend/*.test.mjs` (95 tests).

| # | Severity | Finding | Disposition | Where |
|---|---|---|---|---|
| 1 | Medium | `stop --no-backup` not tied to the replay's project ID; children inherit the environment | **Fixed, all four parts.** (a) Every child gets only an allowlisted environment: `PATH`, `HOME`, `USER`, `LOGNAME`, `TMPDIR`, `LANG`, `LC_ALL`, `LC_CTYPE`, `TZ`, `DOCKER_HOST`, `DOCKER_CONTEXT`, `DOCKER_CONFIG`, `DOCKER_CERT_PATH`, `DOCKER_TLS_VERIFY`. The executor refuses to run without an explicit environment, so nothing inherits by accident. (b) Every command refuses while any `SUPABASE_*` variable is set (any case), before any command or replay-directory access, naming the variables and never a value; this repeats on every command, so before 5.1 and 7.2 too. (c) `stop` and teardown send `stop --project-id fitlog_mb1_replay_<date> --no-backup --workdir <dir>`, and `verify-cli` requires `--project-id` in `stop --help`. (d) The CLI is the installed `node_modules/.bin/supabase`, run directly by the runner's node: no pnpm layer, and its shim's `SUPABASE_CLI_BINARY_OVERRIDE` is both refused and stripped. The override scenario itself is the reviewer's inference from reading the CLI's config loader; it was **not** reproduced live (no CLI was run in this phase) | tests 44, 45, 49, 60; 38 |
| 2 | Low | Signal cleanup output lost when the suite runs inside the runner | **Fixed.** The runner passes the suite its own signal source, its own status runner and CLI, and an `exit` that does nothing. After a signal, the suite cleans up, aborts any request still in flight and returns even if a request never answers; the runner then prints the cleanup lines, records the failed run in `state.json`, writes the evidence file and returns, and only then does the process end. Proved with the **real** `main()`, a fetch double whose second account creation never answers, and an event emitter, through the real runner: `process.exit` is never called | tests 56, 52, 93, 94, 84 |
| 3 | Low | Read-only SQL check bypassable; nothing ties the run to the reviewed SQL | **Fixed.** The reviewed block's sha256, `ca683771f22935ff97c26f3101e93634f1611132963d2e44db7bc9d913ed769a`, is a constant (`PRECONDITIONS_SHA256`). `prepare` refuses any other `phase1.md` block, and every snapshot (replay, `shared-snapshot`, and the one inside `shared-apply`) refuses any other file, even one re-pinned in the manifest. It is the exact existing block (`phase1.md` lines 236–251, the one the reviewer called clean at `:235-252`); no SQL was written or changed. The deny-list also refuses SQL-text functions and reads quoted identifiers | tests 51, 36, 35 |
| 4 | Low | `shared-apply` without a confirmation token or a fresh snapshot | **Fixed.** `shared-apply` needs its own token, `--confirm fitlog-mb1-shared-apply-<date>`; stop's token does not satisfy it, nor its token stop. As its last step before `migration up`, it takes the read-only snapshot of 55321 again (same pinned file, same read-only session) and requires it to equal the replay's `before` snapshot; otherwise `STOP and apply nothing`, exit 1, and `sharedApplied` stays false | tests 49, 53 |
| 5 | Low | Two commands at once; the CLI can outlive a timeout | **Fixed, both parts.** (a) An exclusive lock file in the replay directory (created with `wx`, which also fails on a link) is held for the whole command, checked after the directory checks and before any state is read; the directory is checked again under it. A second command is refused, naming the holder's command, pid and start time. A lock is released only by the invocation whose token it holds; one that changed hands mid-command is left in place with a `STOP` line and exit 1; none is ever removed automatically, so a crashed run's lock waits for the coordinator. (b) Both: the installed CLI is called directly, **and** every child runs in its own process group; a timeout, or SIGINT or SIGTERM to the runner while a child runs, sends the group SIGTERM, then SIGKILL after a grace period, or at once when the leader has gone, to sweep a process that ignored SIGTERM. Proved with real local node processes: a parent and a grandchild that both ignore SIGTERM are gone after a timeout and after a signal | tests 57, 58, 59, 60, 42; 39, 40 |
| — | Self-review | A `docker inspect` stopped by a timeout or signal was read as "absent", giving a misleading STOP | **Fixed, test first.** An unfinished inspect is now a refusal that says the shared stack could not be checked | test 48 |

## 3. Decisions in this phase

- **An asynchronous executor rather than a supervisor process.** `spawnSync` cannot reach a process group or hear a signal
  while it blocks. The runner's commands now await an executor built on `spawn` with `detached: true` (a new process
  group). This made the identity suite's status step asynchronous too.
- **Detached children need the runner to forward Ctrl-C.** A child in its own process group no longer gets the terminal's
  SIGINT, so the executor listens on the runner's signals while a child runs and stops the child's group itself. Between
  commands no child runs, and Node's default applies: the runner ends at once and its lock stays for the coordinator.
- **The shared-stack check no longer goes through `local-stack.mjs`.** `localDatabase` calls its `run` synchronously, so
  it cannot use the new executor. The runner now checks the repository's `project_id` (with `local-stack.mjs`'s pure
  `projectId`), then status at 55321 and the container, all through its own executor. `local-stack.mjs` is a shared file
  and was not changed (§5).
- **Both remedies of finding 5(b).** Calling the CLI directly removes pnpm. The shim still starts the platform binary as
  its child, which may start others, so the process group is what makes the timeout reliable.
- **`DOCKER_*` variables pass through.** They select the Docker daemon. Every child, the CLI and the runner's own
  `docker` checks get the same ones, so a non-default daemon moves all of them together, never one without the others.
  `verify-cli` prints the names passed, never their values.
- **The lock is taken after the first directory check, not before.** Writing a lock into an unchecked path could follow a
  link. The second check under the lock is the one the command relies on.
- **`prepare` holds the lock too:** its `mkdir` is exclusive, and the lock is the first file it writes, so no other
  command can act on a half-written directory, which every check refuses anyway.
- **No new SQL authority.** The constant pins the existing block. Changing `phase1.md` §7 now requires a new review and a
  code change; until then `prepare` refuses.

## 4. Evidence

Every shell command ran as `rtk proxy …`. The permission mode allowed only `git status`, `git diff --no-index`,
`node --check` and `node --test` on these files; other read-only probes (`stat`, `shasum`, `ls`, a test reporter flag)
were refused and not retried by other means.

| Command | Result |
|---|---|
| `rtk proxy git status --short` (start) | Only the PHASE1B and phase 1C paths, untracked |
| `rtk proxy node --test scripts/backend/*.test.mjs` (start, before any change) | `# tests 83`, `# pass 83`, `# fail 0` |
| `rtk proxy git diff --no-index /tmp/fitlog-a102fb68-final.md docs/evidence/MB-1/review-a102fb68-final.md` | Only the provenance header added, and a final newline the source lacks |
| `rtk proxy node --test scripts/backend/mb1-replay-evidence.test.mjs` (RED) | `# tests 19`, `# pass 16`, `# fail 3`: "did not run" where "did not finish" is expected; `query_to_xml(…)` not refused; the hash test's placeholder against the actual `ca683771…d913ed769a`, which became the pinned literal |
| `rtk proxy node --test scripts/backend/verify-identity.test.mjs` (RED) | `# tests 14`, `# pass 5`, `# fail 9`: six status tests got a synchronous throw where a rejection is expected; the injected-CLI test got `exit undefined` (the runner's promise was not awaited); "still pending after 2000 ms" (main never returned); the abort signal was `undefined` |
| `rtk proxy node --test scripts/backend/mb1-replay.test.mjs` (RED) | Failed; the tool truncated the summary. Failures seen: the child received the whole inherited environment (names only were shown); `prepare` accepted an edited preconditions block (exit 0); the suite got no signal source; `shared-apply takes no --confirm`. No real Supabase status ran: the real-`main()` test checks the runner's wiring before `main()` starts |
| Same three files after the implementation (GREEN) | 19/19, 14/14, 23/23 |
| `rtk proxy node --test scripts/backend/*.test.mjs` after removing the RED-only `pnpm` branch from the test double | `# tests 95`, `# pass 95`, `# fail 0` |
| Same, after the self-review test for an interrupted inspect (RED) | `mb1-replay.test.mjs`: 22 pass, 1 fail ("changed before check … now "absent"" where "did not finish (SIGINT)" is expected) |
| Same, after the fix | `# tests 95`, `# pass 95`, `# fail 0` |
| `rtk proxy node --check` on `mb1-replay.mjs`, `mb1-replay-target.mjs`, `mb1-replay-evidence.mjs`, `verify-identity.mjs` and the three test files | All exit 0, no output |
| Final `rtk proxy node --test scripts/backend/*.test.mjs` (after the mutation checks were restored) | **`# tests 95`, `# pass 95`, `# fail 0`**, about 3 s. This supersedes phase 1C's 83: 83 + 2 evidence + 8 runner + 2 identity tests |
| Secret scan of `docs/evidence/MB-1` with phase2-plan §8's patterns | Matches only `review-39fe1fb5-final.md` lines 65, 68 and 74 (prose, already excluded). The new review copy has none |

**Mutation checks.** Each guard below was broken on purpose, the test file run, and the guard restored exactly. The RED
runs above already showed the tests fail without the other new guards. Afterwards a search for the markers found none,
and the full suite was back to 95/95.

| Id | Guard broken | Failing tests (final numbering) |
|---|---|---|
| MD1 | Children get the runner's whole environment | 44 (`NODE_OPTIONS`, `LD_PRELOAD` and `OPENAI_API_KEY` reached the injected executor) |
| MD2 | No `SUPABASE_*` refusal | 45 (`prepare` ran with `SUPABASE_PROJECT_ID` set) |
| MD3 | `stop` without `--project-id` | 44, 52, 53, 60 |
| MD4 | `verify-cli` does not require `--project-id` | 49 |
| MD5 | `shared-apply` without its fresh snapshot | 53 (the drifted 55321 was applied over) |
| MD6 | Lock written with `w` instead of `wx` | 57, 58, 59 |
| MD7 | Release ignores the lock's token | 59 |
| MD8 | Children not in their own process group | 39, 40 (the signal case did not finish within 5 s) |
| MD9 | Only the leader is killed, not its group | 39, 40 ("process 31692 outlived the command": the reviewer's scenario, reproduced with local node processes) |
| MD10 | The suite gets no `exit` (so `process.exit`) | 52, 56 (both stop before any real process or `main()` runs) |
| MD11 | Quoted identifiers hidden from the SQL check | 35 (`select "query_to_xml"(1);` passed) |
| MD12 | Snapshots skip the preconditions constant | 51 |

The real-process tests use only `node` scripts written to a temporary directory. Their stubborn processes exit on their
own after 20 s, so a failing run cannot leave one behind for long; MD8 and MD9 relied on that, and none was left.

## 5. Not done, requests and limits

- **Not done:** any database, Supabase, Docker, network or provider call; any schema or fixture operation; any replay
  directory; applying the candidate; any run of the 27-check suite against a stack; any commit, `status.json`, ledger,
  `GOALS.md`, `main`, shared package or contract edit. Box 3 is not claimed. B1 and B2 stay open (checkpoint).
- **Reviews:** the brief forbids subagents, so the `code-reviewer`, `security-reviewer` and `tdd-guide` passes were not
  run; the coordinator reviews independently. A self-review found one gap, fixed test-first (§2, last row).
- **Not run:** the Python launcher at the end of the brief, because the brief forbids launchers and subagents.
- **Request, `local-stack.mjs` owner (shared file, not changed):** `spawnRunner` gives children the whole environment, goes
  through pnpm, and on timeout stops only pnpm. That is finding 1's and 5's pattern for every other `verify*.mjs`
  runner. The executor in `mb1-replay.mjs` (`runCommand`) could move there. Inside the replay runner, nothing uses it any
  more. Standalone `node scripts/backend/verify-identity.mjs` still does, and the plan never runs it against the replay.
- **Carried requests:** `verify.mjs:6`, `verify-gym.mjs:4` and `verify-freezes.mjs:4` (status parsing that could print
  keys if it crashes); wire `verify-identity.mjs` into `backend:test` (root `package.json`); 003 §3.7's F-2 line.

### Limits of the code and the CLI evidence (for the coordinator)

- **No CLI behaviour was observed in this phase.** The following come from reading, not running:
  - `stop --project-id` is listed in 2.121.0's `stop --help` (the coordinator's reading).
  - `--project-id` decides which containers and volumes `stop` removes.
  - The shim at `node_modules/.bin/supabase` starts the platform binary and reads `SUPABASE_CLI_BINARY_OVERRIDE`. It was
    read as a file; whether `.bin/supabase` is a link to `dist/supabase.js` or a copy is unconfirmed.

  `verify-cli` is the first live check of the CLI path, its version and its flags. If any of them fails, every Supabase
  command refuses.
- **The allowlist may withhold a variable the CLI needs.** For example, `config.toml` reads `env(OPENAI_API_KEY)` (studio,
  which is excluded) and `env(S3_*)`. A missing variable can only make `verify-cli` or `start` fail on the replay; it
  cannot reach 55321. AR-1's logs do not record which variables were set.
- **Docker processes are outside the process group.** Containers run under the Docker daemon.
  - A timed-out or interrupted `start` can leave replay containers half-started; the next command's live checks see them.
  - Killing a `docker exec … psql` client may not stop the server-side `psql`. A mutation sent with `--single-transaction`
    then either applies whole or not at all, and its snapshot proof shows which.
- **Ctrl-C while no child runs** (between steps) ends the runner by Node's default and leaves its lock. That is safe; the
  coordinator removes the lock by hand after review (phase2-plan rules).
- **Process-group signals by number.** The final SIGKILL sweep after a stopped command's leader has gone signals the
  group by its id. Another process could take that id only if process ids wrapped around in that instant. This is
  accepted as negligible.
- **The lock is taken after the first directory check.** A directory swapped for a link between that check and the lock
  write would put a lock file elsewhere. The second check under the lock then refuses, and the runner removes its own
  lock file. The threat model is one local operator, as in phase 1C.
- **Carried from phase 1C:** `state.json` is not hash-pinned. The SQL deny-list is the third barrier (after the constant
  and the read-only session). Output allowlists come from 2.121.0.
