# MB-1 SF-7e: review 1132Z's L1 on SF-7d, a verified apply written before the entry's last check (pure code, fixtures only, no live run)

Attempt 1 · branch `codex/mb1-identity` · base local `main` `2a95726` · uncommitted working tree · 27 October 2026. No clock
times are recorded: `date` was denied in SF-7d and is not retried (§8).

Codex AUTH-01 (owner delegation): one bounded phase after SF-7d's independent review
[`final-2026-10-27T1132Z-collected.md`](../../../evidence/MB-1/final-2026-10-27T1132Z-collected.md).
- **That review:** C0 H0, M1 carried, one new low (L1, which SF-7d had reported itself), and four informational notes. It
  ran 308 of 308 pure tests on Node v22.23.1. Those runs are the reviewer's: **inherited** here, not rerun.
- **Codex accepts it.** The coordinator inspected `dispatch` directly: `result.state` is saved before the lifecycle
  `finally`. That confirms L1.
- **Authorized:** SF-7e only, a pure-code, test-first fix.
- **The carried M1 stays open. Nothing is Done and no Done-when box is met** (§7).

## 1. Scope, and what did not run

- **Done, test-first, fixtures only:**
  - **L1:** a verified `shared-apply` result must pass the entry's start-time check by name before `state.json` is written,
    and exactly one such check runs after the apply.
  - **I-1 (wording):** the entry's header, the note in `mb1-replay-order.mjs`, the note in `mb1-replay-shared.mjs` and line 6
    of the SF-7d test.
- **Read first:**
  - the RTK file and `EXECUTION.md` (decision authority);
  - MB-1 in `GOALS.md` and PRD §16.1;
  - the checkpoint and handoff, `sf7d.md` and the 1132Z final.
- **Not run, by the brief:**
  - the runner, the replay directory, Docker, the Supabase CLI, any database, SQL, network or provider call;
  - any shared apply or live read, including the live M1 read (R0–R17);
  - `backend:test`, and QA-9's G1–G7 harness correction;
  - subagents: the `code-reviewer`, `security-reviewer` and `tdd-guide` passes are forbidden by this brief;
  - launchers: the coordinator's Python launcher, carried in the brief's message, was not run;
  - commits, staging, rebases, pushes and integration;
  - any change to status, `GOALS.md` or `ACCEPTANCE.md`.
- **Mutations: none ran (§4).** No scratch tree is authorized. The denied `mkdir` and `cp` were not retried.
- **Policy, restated by the coordinator:**
  - PRD §16.1 / ADR003: gym staff never read or write private health data, whatever the consent.
  - The override stays until QA-2 is integrated and launching-checkout is corrected.
  - SF-7e opens no data path. It moves one read-only `docker inspect` ahead of one write of the runner's own `state.json`.
  - The candidate and `config.toml` were not edited.

## 2. What changed

| File (`scripts/backend/`) | Change |
|---|---|
| `mb1-replay.mjs` | **Code:** `dispatch` keeps a `checkedAfter` flag. When `op` is `shared-apply` and `result.code` is 0, it runs `sharedUnchanged(ctx, 'after shared-apply')` **before** it writes `result.state`, and `finally` then skips its check. Every other outcome and lifecycle command takes `finally`'s check as before. This is the review's minimal correction, unchanged. **Comments:** a four-line comment above the `try`. In the header: the SF-7 sentence no longer calls the binding read the last child (I-1); SF-7d and SF-7e sentences are added; the lifecycle sentence is made exact; and the three lines after it are reflowed with the same words. The six exports are unchanged |
| `mb1-replay-order.mjs` | Comment only: the note above `sharedApplyNeeds` now says what `sharedApplied` means (below) |
| `mb1-replay-shared.mjs` | Comment only, `afterSharedMigrate`'s JSDoc. Exit 0 returns the verified state for `dispatch` to write once the check by name holds. SF-7d's "Residual" sentence is replaced by the SF-7e one. Header lines 1–6 are unchanged, so the scope test's role comment stays on line 5 |
| `mb1-replay-sf7d.test.mjs` | Comment only: the header's last sentence (I-1) now claims only that a STOP *inside* `shared-apply` never records `sharedApplied`, and points to SF-7e. The test bodies and titles are unchanged |
| `mb1-replay-sf7e.test.mjs` (new) | 3 tests with 9 subtests (§3) |
| Unchanged | the harness, `live`, `binding`, `sql`, `commands`, `evidence`, `target`, `exec`, every other test file (the scope test needed no new expectation), `verify-identity.mjs`, the candidate and `config.toml` |

**How it behaves:**
- **A verified `shared-apply`** (`afterSharedMigrate` returned exit 0, with `sharedApplied` and `55321-after` built but not
  yet written):
  - `dispatch` first runs the start-time check by name, `after shared-apply`.
  - If it holds, `state.json` is written and the run exits 0.
  - If it fails (a restart, a stop, another start time, no such container, a timeout or an unexpected value), its refusal
    propagates and the run exits 1. The refusal printed is `mb1-replay refused: STOP: the shared 55321 database container
    changed after shared-apply (…)`, or the unfinished-inspect text.
  - `state.json` keeps only what `recordApplyAttempt` wrote before `migration up`: the attempt, with `sharedApplied` false
    and no `55321-after`.
  - `finally` does not check again.
- **Unchanged:**
  - every other `shared-apply` outcome: a refusal before `migration up`, a STOP after it, or an error;
  - every other lifecycle command: `start`, `migrate`, `diff`, `stop` and `teardown`.

  In both cases the state, if there is one, is written first and then `finally` runs the check. So `migrate`'s and
  `diff`'s `stopRecorded`, and `stop`'s generation, persist when that check fails.
- **A verified apply's calls are unchanged:** the same 16 kinds, with one check by name at the end. Only the state write
  moved, from just before that check to just after it. The check's result and the write have no `await` between them.
- **Output of the new STOP:**
  - stdout still ends with `shared-apply`'s own `# rechecked after the 55321-after snapshot: …` and `# 55321 after
    migration up: equal to the replay's after snapshot …` lines, then `# mb1-replay shared-apply: exit 1`;
  - the refusal follows, on stderr and in the evidence file;
  - those two lines are still true of the snapshot. The exit code and the refusal carry the outcome;
  - no stdout line was added, to keep to the minimal correction (§7).

**What `sharedApplied` means now** (the review's proposed definition, adopted; the comments in `order.mjs` and the entry say
it):
- **Every check inside `shared-apply` held:**
  - `migration up` exited 0 and printed at most the candidate's Applying line;
  - the candidate, every input guard and Docker's binding were unchanged;
  - the proven ID kept its pinned start time just before and just after the after snapshot;
  - that snapshot, read by ID, matched the replay's `after`.
- **Then** the entry's start-time check by name after `shared-apply` held, **before** `state.json` recorded it.
- **It describes 55321, not the run's exit code.** A lock-release STOP or a failed evidence write may still follow (review
  1132Z I-2).
- `sharedApplyAttempted` without `sharedApplied` means `migration up` started but was not verified (the SF-2 incident path).
- A `55321-after` snapshot on its own verifies nothing: a later `shared-snapshot after` records one without `sharedApplied`.

## 3. Tests (Node v22.23.1, `rtk proxy node --version`)

| Run | Command | Result |
|---|---|---|
| Baseline | not rerun (brief) | **Inherited:** 308/308, executed independently by review 1132Z on SF-7d's bytes |
| RED (focused) | `rtk proxy node --test --test-reporter=spec scripts/backend/mb1-replay-sf7e.test.mjs scripts/backend/mb1-replay-sf7d.test.mjs scripts/backend/mb1-replay-scope.test.mjs` | `tests 19`, `pass 13`, **`fail 6`, each for its intended reason** (below) |
| GREEN (focused) | the same | **19/19 on the first run.** No assertion changed after the code |
| Final, once | `rtk proxy node --test --test-reporter=tap --test-reporter-destination=stdout --test-reporter=tap --test-reporter-destination=/tmp/fitlog-mb1-sf7e-final.tap scripts/backend/*.test.mjs` (21 files) | `1..162`, **`# tests 320`, `# pass 320`, `# fail 0`**, `# cancelled 0`, `# skipped 0`, `# todo 0`, `# duration_ms 14268.428625`. SF-7e is `ok 122`–`124`, SF-7d `ok 118`–`121`, the scope test `ok 104` |

**The full green is on the final code bytes.** The final run came after the last code and test edits, which were two
comment corrections in `mb1-replay.mjs`. After it only MB-1 records changed: this file, the checkpoint and the handoff.

**RED reasons:**
- **The four L1 subtests, and their parent:** each fails `a run that ended in the STOP after shared-apply recorded
  sharedApplied` (`true !== false`).
- **The success control:** its events end `…'inspect-id', 'write state.json', 'inspect'`, where `…'inspect-id', 'inspect',
  'write state.json'` is expected.
- **Passing on RED, as controls should:** the five lifecycle and error-path subtests, SF-7d's four tests and the scope test's
  three.

**Counts:**
- 308 + 12 = 320 tests, and 159 + 3 = 162 top-level.
- The MB-1 runner tests are 255 + 12 = **267** (17 files).
- The full TAP went to stdout, which Claude Code saved in its own tool-results folder outside the repository. A copy went to
  one new file, `/tmp/fitlog-mb1-sf7e-final.tap`. No directory was created.

**How the order is seen:**
- `logged()` hands the runner an executor and a file system through the harness's existing `deps` injection.
- They log, in order, each child process (by the harness's `kind`) and each write of `state.json`, and keep the states
  written. This follows the `ordered` helper in `mb1-replay-rechecks.test.mjs`. The harness is unchanged.
- `after[kind]` runs once a child of that kind has answered: a change while that child ran.

**The SF-7e tests:**
1. **L1, the four cases** (one subtest each, each in its own sandbox brought to `atSharedApply`):
   - **Setup:** the change lands once the fourth proven-ID inspect, the last one (after the after snapshot), has answered.
   - **Cases:**
     - a restart (a new start time);
     - a stop (not running);
     - another start time read once by the check by name;
     - a timeout of that check, once.
   - **Each:**
     - exit 1, `sharedApplied` false, no `55321-after`, and the attempt `{ at, workdir: 'shared-apply' }`;
     - the events exactly `[…TO_UP, 'write state.json', 'migration up', 'binding', 'inspect-id', 'psql-read', 'inspect-id',
       'inspect']`. So one check by name runs after the apply and after the last ID inspect, and the attempt is the only write;
     - the exact refusal;
     - `shared-apply`'s own last recheck printed and no `# STOP:` line, so the STOP is the entry's;
     - the evidence file ends with the exit line and the refusal.
   - **The lasting cases (restart, stop):** `shared-suite` is refused at the check by name before it (`changed before
     shared-suite`, calls `['inspect']`). The harness then restores the pin.
   - **Then, with the check by name passing again:** `state.json` alone refuses. A second `shared-apply` is refused as
     already attempted, and `shared-suite` as needing `shared-apply` and the `55321-after` snapshot. Each makes exactly one
     call, `['inspect']`.
2. **Positive control, nothing changed:**
   - The events are `[…TO_UP, write, …AFTER_UP, write]`.
   - The two writes record `[false, false]`, then `[true, true]`.
   - The state on disk is verified, and `shared-suite` then passes 75 s later.
3. **Controls for every other path** (five subtests):
   - **`migrate`:** `SUPABASE_DB_PORT` is set and the shared container restarts while `migration up` runs. Seen: the replay
     STOP line; `stopRecorded { at, op: 'migrate' }` on disk; the candidate still `added`; the events `[inspect, status,
     names, migration up, write, inspect]`; the refusal `changed after migrate`.
   - **`diff`:** the same, with `op: 'diff'`.
   - **`stop`:** a restart during the CLI stop. Generation 2 is on disk, the events are `[inspect, status, names, stop,
     names, write, inspect]`, and the refusal is `changed after stop`.
   - **`shared-apply` refused before `migration up`:** the route proof's list exits 1. There is no write, `state.json` is
     byte-equal, and the events end `'migration list', 'inspect'`.
   - **`shared-apply`'s own STOP:** `migration up` exits 1. Seen: an empty stderr; the STOP line; the events `[…TO_UP,
     write, 'migration up', 'binding', 'inspect-id', write, 'inspect']`; both writes unverified.

**Side effects, inspected before the final run** (reading the new file and the harness):
- The new file writes nothing itself.
- The runner writes only into each test's `mkdtemp` sandbox, through the harness's mapped file system, and its evidence goes
  to the sandbox's `/evidence`.
- Docker and the CLI are the harness's in-memory world, so no process starts.

## 4. Mutations: none ran

None ran. No scratch tree is authorized, and the denied `mkdir` and `cp` were not retried or replaced. SF-7b's eight, SF-7c's
four and SF-7d's five stay **UNRUN**.

Planned for SF-7e, if a scratch tree is ever explicitly authorized (predictions, not results):

| Id | Change | Expected to fail |
|---|---|---|
| E-after | the old order: the write before the check by name, the check in `finally` | sf7e 1 (four subtests, by behaviour: `sharedApplied` recorded) and sf7e 2 (by order) |
| E-double | the check before the write, but `!checkedAfter` dropped from `finally` | sf7e 1 and 2 by call count (a second `'inspect'` at the end), and every existing verified-apply call expectation (sf7d 2, phase1g, plan, sf7, sf7b, sf7c) |
| E-all | the check before the write for every lifecycle command | sf7e 3's `migrate`, `diff` and `stop` subtests by behaviour (`stopRecorded` or the generation lost), and its STOP subtest by order |
| E-code | `result.code === 0` dropped (the check before the write for every `shared-apply` result) | sf7e 3's STOP subtest, **by order only**: the state rewritten on a STOP is the one already on disk, so nothing on disk differs |

## 5. Hashes: not taken

- `rtk proxy sha256sum` was denied to review 1105Z. This phase treats it as previously denied: it did not run it or any
  substitute. **No file hash is recorded here, before or after.**
- The changed files are the ones in §2. The reviewer binds them by reading or hashes them.
- **§8 (Grep tool, executed):** §8's five patterns, with the single exclusion `!review-39fe1fb5-final.md`, print exactly the
  five inventory lines in three files. The token check prints exactly the six tokens. The three files' hashes were not
  re-taken. This phase writes nothing under `docs/evidence/MB-1/`.

## 6. The final this phase follows (not edited)

| File (`docs/evidence/MB-1/`) | What it is |
|---|---|
| `final-2026-10-27T1132Z-collected.md` | SF-7d's independent review: C0 H0, M1 carried, L1 new (self-reported), I-1, I-2, I-a, I-b, I-c. 308/308 executed by the reviewer on Node v22.23.1 |

Its hash was not taken (§5). The cycle time in its name is the coordinator's; this phase did not observe it. The earlier
finals are untouched.

## 7. Residuals and decisions (stated, not claimed)

- **M1 (medium, carried, open):** nothing here proves that Docker's reads and the TCP write to 127.0.0.1:55322 reach the
  same Postgres. The live M1 read (R0–R17) was not executed.
- **Review 1132Z L1:** fixed in code and tests (§2–§3), pending the independent review.
- **I-1:** fixed in the four places the review lists. `handoff.md:16` is rewritten. The SF-7 test title ("…as its last
  children before the final guards…") is left unchanged, so test names stay comparable, and that file is outside this
  brief.
- **I-2, stated, not changed:**
  - exit 1 with `sharedApplied` true is still possible after a lock-release STOP or a failed evidence write;
  - by the definition above, `sharedApplied` describes 55321, not the exit code;
  - the evidence file, when it is written, records the run's outcome.
- **New, disclosed (self-review):** on the new STOP, stdout still carries `shared-apply`'s own `# 55321 after migration up:
  equal …` line before the exit line. The exit code and the refusal, on stderr and in the evidence file, carry the outcome.
  A reviewer may want an explicit stdout STOP line there. It was not added, to keep to the minimal correction.
- **The window that is left:**
  - There is no `await` between the check by name holding and the write.
  - A change after that check is outside any check, as for every command after its last one.
  - The check reads the container by name. A recreate under that name changes the start time, so it is still caught.
- **I-b (open):** `shared-snapshot` and `shared-suite` do not recheck the start time when they finish.
- **I-a, I-c:** unchanged, and accepted by the review.
- **Mutations:** SF-7b's eight, SF-7c's four, SF-7d's five and SF-7e's four are UNRUN.
- **Decision (Codex, carried):** before any future `backend:test`, QA-9's phase 3N readiness gates G1–G7 require a single,
  separate harness-correction phase. MB-1 owns it. **Not authorized now.**
- **Review:** self-review only, because the brief forbids subagents. **A fresh independent review of SF-7e comes next.**
- **Still open:**
  - M1, SF-1 to SF-6, finding 5, I1 and I2;
  - files over 400 lines, and old citations;
  - the read-only live read;
  - §5, §6 (55321) and §7;
  - B1, B2 and box 3 as a whole;
  - any shared apply.

## 8. Commands and permissions (this session)

| Command | Result |
|---|---|
| `rtk proxy git --no-optional-locks status --short` | at phase start: 32 untracked entries (two docs directories, 29 scripts, the candidate) and no tracked change |
| `rtk proxy node --version` | `v22.23.1` |
| `rtk proxy node --test --test-reporter=spec <3 files>` | RED, then GREEN, §3 |
| `rtk proxy node --test --test-reporter=tap … scripts/backend/*.test.mjs` | once, §3 |
| `rtk proxy git --no-optional-locks status --short` | at phase end: see the handoff |
| Not run | `date` (denied in SF-7d), `sha256sum`, `shasum`, `wc -l`, `ls` or any other listing command, `mkdir`, `cp`, a formatter, any mutation, the runner, Docker, the CLI, any database, SQL or network command, `backend:test`, subagents, launchers, commits and staging |
| Grep, Read, Edit, Write | inspection, the code and tests, the summary of the saved test output, §8 and the MB-1 records |
