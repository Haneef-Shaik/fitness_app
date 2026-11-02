# MB-1 phase 2 — database phase plan (box 3, `profile_read`)

| Field | Value |
|---|---|
| Status | **SF-7 (27 October 2026, pure code, fixtures only):** every 55321 command now also needs Docker's own binding of the shared stack, and `shared-apply` also needs the staged route proof and the binding read again before its final guards; a changed binding after `migration up` is a STOP, and `state.json`'s `shared` must be `true <ISO time>`. The replay's own binding is held; nothing ran on the replay, Docker or 55321 ([sf7.md](sf7.md)). §6 still needs a reviewed first live read of Docker's shape and its own authorization. **SF-0 (27 October 2026, pure code):** the runner `scripts/backend/mb1-replay.mjs` and its test file are split into modules under 400 lines with no behaviour change; the command line, the module's exports and `state.json` are unchanged, and nothing ran on the replay or 55321 ([sf0.md](sf0.md)). **Current (27 October 2026; the rest of this row is history):** on the disposable replay, §3 is met (attempt 5: GREEN, 27 ok, `banned`), the **M1 block of §4 is met** (attempt 6: the M1 proof, the M1 suite, the restore proved and GREEN again; [phase2.md](phase2.md) Attempt 6), the **M3 block of §4 is met** (attempt 7: the M3 proof, the M3 suite, the restore proved and GREEN again; [phase2.md](phase2.md) Attempt 7), and the **M2 block of §4 is met** (attempt 8, under `banned`: the M2 proof, the exact M2 kill with no stop, the restore proved and GREEN again; [phase2.md](phase2.md) Attempt 8). Phases 1H and 1I and their independent reviews are done ([checkpoint.md](checkpoint.md)). **Not authorized:** §5, §6 and §7. Box 3 is not met; B1 and B2 are open. **Earlier:** §§0–2 authorized on the disposable replay only (Codex AUTH-01, 26 October 2026). Attempt 1 stopped at §0** with no runner command run: the Docker daemon was not reachable ([phase2.md](phase2.md)). **Attempt 2 stopped after §1.4**: `migrations` kept no row (F5). **Phase 1E** ([phase1e.md](phase1e.md)) fixed F5, F3 and F4 test-first, in code only. Its independent review, 19eea0f3 ([verbatim](../../../evidence/MB-1/review-19eea0f3-final.md)), found three lows. Codex accepted it for the disposable RED only. Findings 1 and 2 are pending for MB-1, before any `shared-apply`. **Attempt 3** passed 1.4 (rerun) and 2.1. It **stopped at 2.2**: GoTrue's ban answer was `HTTP 403` `user_banned`, which the verdict does not recognise (F6; [phase2.md](phase2.md) A3.3). **Phase 1F** ([phase1f.md](phase1f.md)) fixed findings 1 and 2 and F6 test-first, in code only. `user_banned` is now the class `banned`, under which M2 fails closed. Its independent review, bbe2fbba ([verbatim](../../../evidence/MB-1/review-bbe2fbba-final.md)), found four lows and no critical, high or medium finding. Codex accepted it for one disposable RED. All four lows are assigned to MB-1, pending, before any `shared-apply`. **Attempt 4 met RED** (`phase2-2-red-2`, runner exit 0) with the reference ban answer **`banned`** ([phase2.md](phase2.md) Attempt 4). **Phase 1G** ([phase1g.md](phase1g.md)) fixed bbe2fbba's four lows test-first, in code only, and implemented the nonvacuous M2 (120 pure tests). Its independent review is owed before any further runner or database step. §§3–7 are not authorized. Written in PHASE1B, rewritten in phase 1C ([phase1c.md](phase1c.md)) after review 39fe1fb5 ([verbatim](../../../evidence/MB-1/review-39fe1fb5-final.md)), updated in phase 1D ([phase1d.md](phase1d.md)) for all five findings of review a102fb68 ([verbatim](../../../evidence/MB-1/review-a102fb68-final.md)), and corrected in phase 2 attempt 1 for review b75d1e73's conditions ([verbatim](../../../evidence/MB-1/review-b75d1e73-final.md)) |
| Runs | The coordinator, from this worktree, after explicit authorization for database calls, fixture creation, Docker, a disposable replay project, applying one migration to 55321, and (separately) teardown |
| Proves, if it all passes | MB-1's part of QA-1 F-2: `profile_read` refuses a revoked session, a session revoked from another device, and disabled, deletion-pending and banned accounts, on a replay from empty and on 55321. Each guard is mutation-checked on the replay project only |
| Does **not** prove | Box 3, or MB-1 Done. Blockers B1 and B2 stay open ([phase1.md](phase1.md) §2 D6; §9 below) |

## Rules for this phase

- **No weakening of 55321, ever** (phase1.md D7). On 55321 the only change is `shared-apply` (one `supabase migration up
  --local`), after the read-only preconditions equal the replay's and every replay proof has passed.
- **One runner for every replay command:** `scripts/backend/mb1-replay.mjs` (phase 1C). It takes the literal directory
  `/tmp/fitlog-mb1-replay-YYYYMMDD` and nothing else. There are no shell variables, no `$`, no raw `supabase --workdir`
  command and no `rm -rf` anywhere in this plan.
- **The date is written in when the plan is authorized.** Replace every `YYYYMMDD` below with the literal run date (for
  example `20261027`), in the directory and in both `--confirm` tokens. Left unreplaced, the runner refuses: `YYYYMMDD`
  is not a date. Do not set or reuse a shell variable for it.
- **Before every command the runner checks** (refusing with one line on stderr, exit 1):
  0. no `SUPABASE_*` variable is set in its environment, in any case (phase 1D, review a102fb68 finding 1). A refusal
     names the variables and never prints a value; unset them and run the command again. This check repeats on every
     command, so it also runs right before 5.1 and 7.2. Every child process then gets only an allowlisted environment
     (`PATH`, `HOME`, `USER`, `LOGNAME`, `TMPDIR`, `LANG`, `LC_ALL`, `LC_CTYPE`, `TZ` and the five `DOCKER_*` daemon
     settings); `verify-cli` prints the names it passes. **Phase 1E (review b75d1e73 finding 3):** it also refuses while
     any `.env*` name, in any case, is in a directory the CLI may load it from. That is the repository's and the replay's
     `supabase/` and root, from the installed 2.121.0 code, plus every parent directory up to `/`, by path as given and
     real path. The parents are checked fail closed, because the Go sidecar cannot be read. Paths only: no file is read,
     changed or removed;
  1. the literal path `^/tmp/fitlog-mb1-replay-\d{8}$` and a real calendar date (no I/O yet);
  2. the owned directory: not a link; its real location is itself or `/private` plus itself (macOS `/tmp`); the owner
     sentinel; every manifest file's sha256; no entry it did not create (the CLI's own `supabase/.temp` and
     `supabase/.branches` excepted); `config.toml` names `fitlog_mb1_replay_YYYYMMDD` and exactly the eight 564xx/8283
     ports, and no 553xx or 8183 port. Then it takes the directory's lock (`.fitlog-mb1-replay.lock`, created
     exclusively), so only one command runs at a time, and checks the directory again under the lock (finding 5);
  3. the shared 55321 database container still has the start time pinned at `prepare` (`docker inspect`); lifecycle
     commands (start, migrate, diff, stop, teardown, shared-apply) check it again afterwards;
  4. the CLI flags it sends were found in the CLI's own `--help` (`verify-cli`); stop and teardown carry
     `--confirm fitlog-mb1-replay-YYYYMMDD`, and shared-apply its own `--confirm fitlog-mb1-shared-apply-YYYYMMDD`
     (finding 4); neither token satisfies the other command;
  5. the plan order below, from its state file (snapshots, mutation proofs, suite spacing, retained SQL);
  6. live: `supabase status -o json --workdir <dir>` answers at `http://127.0.0.1:56421` with its database at
     `127.0.0.1:56422`, and `supabase_db_fitlog_mb1_replay_YYYYMMDD` is running (for `start`: no replay container runs).
     For 55321 commands, the repository's status must give exactly `http://127.0.0.1:55321` and a `postgresql:` (or
     `postgres:`) `DB_URL` at exactly `127.0.0.1:55322` (phase 1E, finding 3).
- **How the runner runs the CLI (phase 1D, findings 1 and 5).** The installed `node_modules/.bin/supabase`, run
  directly by the runner's node: no pnpm, no shell. `stop` always names the replay's literal project:
  `stop --project-id fitlog_mb1_replay_YYYYMMDD --no-backup --workdir <dir>`. Every child runs in its own process group;
  a timeout, or Ctrl-C or SIGTERM to the runner while a child runs, sends the whole group SIGTERM, then SIGKILL. The
  identity suite's status call goes through the same executor.
- **That cleanup holds only while the runner itself is alive (review b75d1e73 finding 1).** The CLI's group is
  detached. If the runner is killed outright (SIGKILL), or gets SIGHUP (not handled), the CLI runs on unsupervised with
  no timeout, nothing is recorded, and the lock stays. Therefore:
  - every runner command runs with a shell-tool timeout of at least 660 s (the runner's own limit is 600 s), or as a
    background job with no tool timeout;
  - the runner is never sent SIGKILL;
  - after any timeout or signal the phase stops and the lock stays. Before any later action, the coordinator checks that
    no `mb1-replay.mjs`, `.bin/supabase`, `cli-darwin-arm64/bin/supabase` or `supabase-go` process is left, and that no
    replay container runs.
- **One command at a time (finding 5).** A second command while one runs is refused, naming the holder's command, pid and
  start time. A lock is never removed automatically. If a runner was killed outright (so no `mb1-replay.mjs` process
  runs), the coordinator reviews `state.json` and the last evidence, then removes only
  `/tmp/fitlog-mb1-replay-YYYYMMDD/.fitlog-mb1-replay.lock` by hand, and records that.
- **Only the reviewed preconditions block runs (finding 3).** Its sha256,
  `ca683771f22935ff97c26f3101e93634f1611132963d2e44db7bc9d913ed769a`, is a constant in the runner: `prepare` refuses any
  other `phase1.md` block, and every snapshot (replay, 55321 and the one inside shared-apply) refuses any other file.
  The `phase2-1-prepare` evidence prints the same value for the coordinator to compare.
- **A refusal, a `STOP:` line or any unexpected result stops the phase.** Record it and report; do not work around it.
- **Evidence:** pass `--evidence phase2-<name>` and the runner writes `docs/evidence/MB-1/phase2-<name>.txt` itself,
  never over an existing file. It holds only allowlisted, redacted lines plus a withheld count and the exit line: never
  raw `start`, `status` or error output (finding 2). No shell redirection.
- **Suites:** at least 75 s apart on one stack, enforced by the runner (six sign-ins a run, 30 allowed per five minutes).
  **Coordinator gate, 90 s (review 2026-10-27T0105Z low 2):** before every `suite` command, read `rtk proxy date -u +%s`
  and the last `suites[].endedAt` (epoch ms) in the replay's `state.json`, and start the suite only when the difference is
  at least 90 s. If it is less, wait without running the runner. The runner's spacing refusal still writes the
  `--evidence` file, which uses up that name, and any refusal stops the phase. Phase 2 attempt 6 used this gate before
  both of its suites.
  A verdict is mechanical: all 27 checks in order, exactly the expected `not ok` names, the matching exit code and
  summary, a recognised ban answer equal to the first run's, and no setup, cleanup, refusal or signal line (finding 3).
- **The CLI's behaviour is not guessed.** `verify-cli` reads each command's `--help` before any Supabase command runs.
  The CLI documentation says `stop --no-backup` deletes the project's data volumes; that is why stop and teardown need
  `--confirm` and name the literal `--project-id`. The Codex coordinator read the installed 2.121.0 `stop --help` before
  phase 1D: it lists `--project-id string`, and `--no-backup` deletes volumes; `verify-cli` checks both again at run
  time. If the CLI writes anything else into the replay directory, every command refuses it: record and stop.
- Every command starts with `rtk proxy` and runs from this worktree. No `reset` of any database. AR-1's replay project
  (563xx) and every other project stay untouched.

## Names

| Name | Value |
|---|---|
| Replay directory | `/tmp/fitlog-mb1-replay-YYYYMMDD` (literal; created by `prepare`, never reused) |
| Replay project | `fitlog_mb1_replay_YYYYMMDD`; database container `supabase_db_fitlog_mb1_replay_YYYYMMDD` |
| Replay ports | API **56421**, DB 56422, shadow 56420, studio 56423, SMTP 56424, analytics 56427, pooler 56429, edge inspector 8283 |
| Shared stack | API **55321**, DB 55322, `project_id` `fitlog_rebuild_20261017`, container `supabase_db_fitlog_rebuild_20261017` |
| Runner | `rtk proxy node scripts/backend/mb1-replay.mjs <command> /tmp/fitlog-mb1-replay-YYYYMMDD [argument] [--confirm …] [--evidence …]`, written `MB1 <command> …` below |
| Tokens | stop and teardown: `fitlog-mb1-replay-YYYYMMDD`; shared-apply: `fitlog-mb1-shared-apply-YYYYMMDD` |
| Lock | `/tmp/fitlog-mb1-replay-YYYYMMDD/.fitlog-mb1-replay.lock`, held by one command at a time |

## 0. Before any database call (no database, Supabase or Docker)

1. `rtk proxy git status --short`: only the PHASE1B and phase 1C paths ([phase1c.md](phase1c.md) §1), unless the
   coordinator has committed them.
2. `rtk proxy node --check scripts/backend/mb1-replay.mjs` (and the other `scripts/backend/mb1-replay*.mjs` and
   `verify-identity*.mjs` files: eight since phase 1G added `mb1-replay-order.mjs`, nine since phase 1H added
   `mb1-replay-order.test.mjs`), then `rtk proxy node --test scripts/backend/*.test.mjs`: every pure unit test passes
   (`1..133`, `# tests 282` at phase 1I, subtests included: one per drift case; this supersedes phase 1H's 128, phase 1G's
   120, phase 1F's 112, phase 1E's 104, phase 1D's 95 and phase 1C's 83).
2a. No `SUPABASE_*` variable is set. The runner refuses every command otherwise, naming the variables only; expect
   `prepare` in 1.1 to pass this check (finding 1).
3. `rtk proxy lsof -nP -iTCP:56420-56429 -sTCP:LISTEN` prints nothing, `rtk proxy docker ps -a --format '{{.Names}}'`
   lists no `fitlog_mb1_replay` container, and `/tmp/fitlog-mb1-replay-YYYYMMDD` does not exist.
4. The shared 55321 stack is running (`prepare` pins its database container's start time and refuses otherwise).

## 1. Build and start the replay project (15 committed migrations, no candidate)

1. `MB1 prepare /tmp/fitlog-mb1-replay-YYYYMMDD --evidence phase2-1-prepare`. It creates the directory, the sentinel,
   the replay `config.toml` (only `project_id` and the eight ports changed: exactly nine lines), both seeds, the 15
   committed migrations, `sql/preconditions.sql` (phase1.md §7's block, which must have the reviewed sha256 and pass the
   read-only SQL check), `sql/m1.sql`–`sql/m3.sql` and `sql/restore-member-active.sql`, then the manifest with every
   sha256. The evidence lists each file's sha256 and whether it equals the repository file; it replaces
   `phase2-replay-inputs.txt`. Its `sql/preconditions.sql` line must read
   `ca683771f22935ff97c26f3101e93634f1611132963d2e44db7bc9d913ed769a  sql/preconditions.sql (the reviewed phase1.md block; …)`.
2. `MB1 verify-cli /tmp/fitlog-mb1-replay-YYYYMMDD --evidence phase2-1-cli`. It prints the CLI it runs
   (`node_modules/.bin/supabase`, directly by node) and the names of the allowlisted variables it passes. Every flag the
   runner sends must be listed by that command's `--help`: `start --exclude` with studio, edge-runtime, logflare, vector
   and imgproxy; `status --output`; `migration list --local`; `migration up --local`; `db diff --local --schema
   --strict-coverage`; `db lint --local --schema --level`; `stop --project-id --no-backup`; and `--workdir` on each.
   Anything missing: stop. The runner accepts any `x.y.z`, so the coordinator also checks that every version line reads
   exactly `2.121.0` and that `stop --help` lists `--project-id`. Before and after each run, the sha256 of
   `node_modules/.bin/supabase`, `node_modules/supabase/dist/supabase.js` and both
   `@supabase/cli-darwin-arm64/bin/` binaries must equal the values in the checkpoint, with no install or file change
   between commands (review b75d1e73 finding 2; accepted for the disposable run only).
3. `MB1 start /tmp/fitlog-mb1-replay-YYYYMMDD --evidence phase2-1-start`. Only `Applying migration`, `Seeding` and
   `Started` lines are kept; the status block is withheld and counted. The `Applying` count is informational; P3 (2.1)
   is the proof of 15.
4. `MB1 migrations /tmp/fitlog-mb1-replay-YYYYMMDD --evidence phase2-1-migrations`: the CLI's own list, rows only.
   *Since phase 1I (review 2026-10-26T2305Z finding 4; [phase1i.md](phase1i.md) §4; review owed):* it first reruns the
   replay guards synchronously, immediately before the CLI (a change refuses; nothing is listed). Expect one
   `# rechecked immediately before migration list on the replay` line.
   **Since phase 1E (F5)** the runner keeps 2.121.0's backticked rows (`` `<version>` | `<version>` | `<time>` ``, as the
   installed code prints them). It **refuses** unless the rows prove the manifest:
   - one row per migration file, in version order, each local, and remote exactly when applied (the candidate only once
     migrated);
   - each with its own timestamp;
   - no table line it cannot read.

   An empty list refuses even at CLI exit 0. Expect `# migration list: 15 row(s), equal to the manifest's 15
   migration(s), 15 of them applied`. Attempt 2 used the name `phase2-1-migrations`, so a rerun uses
   `phase2-1-migrations-2`. **Review 19eea0f3 finding 3 (accepted):** with that exact summary, `# 0 line(s) withheld` or
   `# 2 line(s) withheld` is expected. The 2 are non-table lines, inferred from the CLI code to be its update notice,
   never observed. Any other count stops the phase. Attempt 3 got 2.

## 2. Reference rows and RED on the replay project

1. `MB1 snapshot /tmp/fitlog-mb1-replay-YYYYMMDD before --evidence phase2-2-before`. The read-only runner sends only
   `sql/preconditions.sql`, hash-pinned by the manifest, with the session default read-only
   (`PGOPTIONS=-c default_transaction_read_only=on`) and a proof query first in the same session; it refuses a file with
   any transaction control, setting change, write, side-effect function or psql meta-command (finding 6). Every P1 rule of
   phase1.md §7 holds, P2 has two rows, P3 has the 15 versions. **Since phase 1G (review bbe2fbba finding 4):** the `before`
   snapshot is taken once. Any retake is refused before SQL is sent, so attempt 3's `before` stays the reference. A failed
   attempt records nothing.
2. `MB1 suite /tmp/fitlog-mb1-replay-YYYYMMDD red --evidence phase2-2-red`. Expect the suite's exit 1 with exactly the
   five `profile_read` checks failing: `a disabled account reads no profile`, `a deletion-pending account reads no
   profile`, `a banned account reads no profile`, `a revoked session reads no profile`, `a session revoked from another
   device reads no profile`. The runner's verdict line must say `the red expectation is met`. GoTrue's answer after the
   ban must be `HTTP 200` (live) or `HTTP 403` with `session_not_found` (ended); **any other answer: stop and record**
   (finding 4). This first recognised answer is the reference for every later run, 55321's included. **Attempt 3:** the
   replay's GoTrue answered `HTTP 403 {"code":"user_banned","message":"User is banned"}`, which is neither, so it stopped
   with no RED and no reference (F6, [phase2.md](phase2.md) A3.3). Before this step runs again (as `phase2-2-red-2`), F6
   needs a test-first fix and an independent review.

   **Since phase 1F (F6; [phase1f.md](phase1f.md) §4):**
   - A third answer is recognised: `HTTP 403` with `user_banned`, the class **`banned`**. It is neither live nor ended,
     because it does not show whether the session row still exists.
   - A RED under it needs the same five failures, exit and summary. The runner prints `GoTrue's answer after the ban:
     banned` and a `# ban answer "banned" …` note line.
   - `banned` becomes the reference.
   - M2 is then refused (§4).
   - Attempt 3's failed run stays failed; only a new run (`phase2-2-red-2`) can pass. The fix waits for its independent
     review.

   **Attempt 4 (after review bbe2fbba):** `suite red --evidence phase2-2-red-2` **met RED**. It ran the 27 checks in
   order, with exactly the five failures, each `HTTP 200, 1 row(s)`, and the exact summary. The answer was
   `banned` (GoTrue `user_banned`), with the met verdict and the `banned` note, and runner exit 0. **`banned` is this replay's
   reference for good** (review bbe2fbba condition 4): a later answer of `live` or `ended` is a mismatch and fails. Until
   bbe2fbba finding 3 is fixed, the verdict skips the detail lines, so each run's expected-failure details are checked by
   hand. **Phase 1G fixed finding 3 in code** (review owed): the verdict keeps each detail line and needs exactly
   `HTTP 200, 1 row(s)` for every expected failure, in RED and each mutation. Attempt 4's recorded output still meets RED
   under it.

## 3. The candidate on the replay project, then GREEN

1. `MB1 add-candidate /tmp/fitlog-mb1-replay-YYYYMMDD --evidence phase2-3-add` (copies the committed candidate, adds it to
   the manifest, and since phase 1E refuses unless its sha256 is the pinned `ac262f39…bdc3`), then `MB1 migrate /tmp/fitlog-mb1-replay-YYYYMMDD --evidence phase2-3-migrate`. An `Applying` line for
   anything but the candidate fails it. *Since phase 1H (review 2026-10-26T2000Z finding 2; [phase1h.md](phase1h.md) §4;
   review owed):* `start` and `migrate` rerun the `SUPABASE_*` and `.env` refusals, `checkOwnedDir` and an "unchanged pins"
   check synchronously, immediately before the CLI (a change refuses: nothing migrates). After `migrate`, whatever its exit,
   they run again. A change there is a `STOP:` line, recorded in `state.json` as `stopRecorded`, and every later command
   is refused until the coordinator reviews it and removes the record by hand. Expect two `# rechecked … on the replay`
   lines. *Since phase 1I (review 2026-10-26T2305Z finding 2; [phase1i.md](phase1i.md) §4):* that STOP is now tested with
   `migration up` ending in exit 0, exit 1 and a timeout, eight changes each, one subtest per change; it comes before the
   exit is read. **Condition kept from review 2026-10-26T2305Z finding 3 (deferred to a separate design phase):** the
   rechecks compare content hashes only, so a change written and undone while the CLI runs is caught by neither. Until
   inode and ctime detection is designed and reviewed, nothing else may write to the replay directory or to the worktree's
   `supabase/` while `migrate` (or `diff`, `lint`) runs, and the coordinator keeps a single writer.
2. `MB1 snapshot /tmp/fitlog-mb1-replay-YYYYMMDD after --evidence phase2-3-after`: compared with 2.1, exactly
   `P2.profile_read.qual` and `P3.+20261026040045` change.
3. `MB1 suite /tmp/fitlog-mb1-replay-YYYYMMDD green --evidence phase2-3-green`: 27 ok, exit 0.

## 4. Mutation checks (replay project only)

The mutation and restore files were generated at `prepare` from the committed sources, each swap matching exactly once,
and are hash-pinned; `mutate` sends them only to the replay container, in one transaction.

| Id | Guard broken | Its snapshot must change exactly | Restore | Expected suite result |
|---|---|---|---|---|
| M1 | `profile_read` loses `member_active()` | `P2.profile_read.qual` | `restore-m1` (the candidate itself) | the five checks named in 2.2 |
| M2 | `member_active()` loses its ban clause | `P1.fn_definition_md5` | `restore-member-active` | ban answer `live`: exactly `a banned account reads no profile`; `ended`: 27 ok, exit 0, and the ban claim narrows (phase1.md R7; the runner prints that note). **`banned` (phase 1F): refused.** `mutate m2` sends no SQL, and an M2 verdict never holds, a zero-failure run included. So `shared-apply` stays blocked until a separately reviewed plan adds direct session evidence ([phase1f.md](phase1f.md) §9 item 3). **Review bbe2fbba:** its finding 2 makes `ended` fail closed too, so a zero-failure M2 under `ended` never counts. Its proposed nonvacuous M2 under `banned` keeps member C's session live and passes only when exactly `a banned account reads no profile` fails with `HTTP 200, 1 row(s)`; 27 ok fails closed. Codex accepted it as the plan for a later pure-code, test-first phase with its own review. **Phase 1G implemented it ([phase1g.md](phase1g.md) §4; review owed):** under `live` or `banned`, `mutate m2` runs and M2 holds only on that exact kill (exit 1, the exact summary, every other check ok). With the ban clause removed, member C's own row coming back shows its session row still existed, so the run is its own session evidence. A complete run whose banned check passed is never a kill: the runner prints a `STOP:` line and records `m2Stopped`, and refuses every later `suite m2` on the replay; the fallback is M2b, reviewed separately. Under `ended`, `mutate m2` is refused before any SQL and no M2 verdict holds. **Phase 1H (review 2026-10-26T2000Z finding 1; [phase1h.md](phase1h.md) §3; review owed):** the stop follows the run alone. Any complete M2 run whose banned check passed is the stop, whatever GoTrue answered (`ended`, unrecognised, none, a mismatch) and even when its output is withheld. A passed M2 is never run again, so M2 counts its first pass or its stop. Any recorded stop blocks `shared-apply`, an earlier pass included. **Phase 1I (review 2026-10-26T2305Z finding 1; [phase1i.md](phase1i.md) §3; review owed):** the stop fails closed. Any M2 run whose checks include `ok - a banned account reads no profile` is the stop, complete or not, in order or not, whatever its exit: for example the banned check `ok`, then `verify-identity setup failed: Logout (local) failed: …` or a signal. A setup failure that printed no check, or a run that broke off before the banned check or with it failing, is not the stop. **Needed before any `mutate m2` or `suite m2`; done in code, review owed** |
| M3 | `member_active()` accepts `deletion_pending` | `P1.fn_definition_md5` | `restore-member-active` | exactly `a deletion-pending account reads no profile` |

For each Mi, in order (`i` is 1, 2, 3):
1. `MB1 mutate /tmp/fitlog-mb1-replay-YYYYMMDD mi --evidence phase2-4-mi-apply`;
2. `MB1 snapshot /tmp/fitlog-mb1-replay-YYYYMMDD mi --evidence phase2-4-mi-proof`: the mutation counts as applied only if
   exactly its part changed from 3.2. Until then the runner refuses the suite;
3. `MB1 suite /tmp/fitlog-mb1-replay-YYYYMMDD mi --evidence phase2-4-mi-suite`;
4. `MB1 mutate /tmp/fitlog-mb1-replay-YYYYMMDD restore-m1` (M1) or `restore-member-active` (M2, M3), with
   `--evidence phase2-4-mi-restore`;
5. `MB1 snapshot /tmp/fitlog-mb1-replay-YYYYMMDD restored --evidence phase2-4-mi-restored`: nothing differs from 3.2.

Then `MB1 suite /tmp/fitlog-mb1-replay-YYYYMMDD green --evidence phase2-4-green`: 27 ok.

## 5. Replay from empty with all 16, diff, lint and images (as AR-1 box 3)

1. `MB1 stop /tmp/fitlog-mb1-replay-YYYYMMDD --confirm fitlog-mb1-replay-YYYYMMDD --evidence phase2-5-stop`, then
   `MB1 start /tmp/fitlog-mb1-replay-YYYYMMDD --evidence phase2-5-start` (16 migrations from empty).
2. `MB1 snapshot /tmp/fitlog-mb1-replay-YYYYMMDD fresh16 --evidence phase2-5-fresh16`: nothing differs from 3.2. Then
   `MB1 suite /tmp/fitlog-mb1-replay-YYYYMMDD green --evidence phase2-5-green`: 27 ok.
3. `MB1 diff /tmp/fitlog-mb1-replay-YYYYMMDD --evidence phase2-5-diff`: the `No schema changes found` line and a diff JSON
   with an empty `diff` and no drop statement. `MB1 lint /tmp/fitlog-mb1-replay-YYYYMMDD --evidence phase2-5-lint`:
   `No schema errors found` and no lint result.
4. `MB1 images /tmp/fitlog-mb1-replay-YYYYMMDD --evidence phase2-5-images`: the replay's and 55321's db, auth and REST
   containers run the same images (finding 4).

*Since phase 1I (review 2026-10-26T2305Z finding 4; [phase1i.md](phase1i.md) §4; review owed):* `stop` (5.1, and
`teardown` in 7.2, which stops through the same code), `diff` and `lint` (5.3) each rerun the replay guards synchronously
as their first statement, with no await before the CLI: a change refuses, and nothing stops, diffs or lints. After `diff`
and `lint`, whatever the CLI's exit, the guards run again. A change there is a `STOP:` line, recorded as `stopRecorded`
with `op` `diff` or `lint`, no `checks` result is recorded, and every later command is refused (the halt names `db diff` or
`db lint`) until the coordinator reviews it and removes the record by hand. Expect one `# rechecked immediately before stop`
line, and for `diff` and `lint` both `# rechecked immediately before db <name>` and `# rechecked after db <name>`. The
single-writer condition in §3.1 applies to `diff` and `lint` too.

## 6. The shared 55321 stack (apply only; no mutation)

Not authorized. Before this section can be authorized, MB-1 fixes review b75d1e73's findings 3 and 4 and has them
re-reviewed. Finding 3: tie `sharedRunning` to `DB_URL` at 55322, and refuse any `.env*` file. Finding 4: pin the
candidate's sha256, or compare it against the committed candidate. Codex accepted both only for the disposable run.
**Phase 1E ([phase1e.md](phase1e.md)) fixed both in code, test-first.** Finding 3: the exact `127.0.0.1:55322` `DB_URL`
and the `.env*` refusal above. Finding 4: `CANDIDATE_SHA256` `ac262f39…bdc3`, checked at `add-candidate` and first in
`shared-apply`. **Re-reviewed by 19eea0f3** ([verbatim](../../../evidence/MB-1/review-19eea0f3-final.md)): F5 and F4
hold, and F3 holds for the replay. But two low findings are **pending for MB-1 before this section can be authorized**,
each to be fixed test-first and independently reviewed:
- **Finding 1:** `migration up` connects to the repository's configured `[db] port`, which the `DB_URL` check does not
  bind. Require the repository's `config.toml`, through `replayConfig`, to hash to the manifest's value, and refuse a
  `supabase/config.json`.
- **Finding 2:** rerun the `.env`, candidate-pin and migration-comparison guards immediately before `migrate`, and re-hash
  the candidate after it.

**Phase 1F ([phase1f.md](phase1f.md)) fixed both in code, test-first.**
- **Finding 1.** Before any child process, every 55321 command refuses a repository `supabase/config.json` (by name). It
  also needs the repository's `config.toml` to set `[db] port` 55322 and to be the config the replay was prepared from
  (its replay config hashes to the manifest's pin).
- **Finding 2.** `shared-apply` reruns, synchronously and immediately before `migration up`: the `SUPABASE_*`, `.env`,
  config, candidate-pin and migration checks. After it, it hashes the candidate again. A change is a `STOP:` line, and the
  apply is never repeated.

**Still owed before this section can be authorized:**
- ~~an independent review of phase 1F~~: done, review bbe2fbba ([verbatim](../../../evidence/MB-1/review-bbe2fbba-final.md));
- under a `banned` reference (fixed by attempt 4), a passing M2 under the reviewed nonvacuous plan (§4; implemented in phase
  1G, not yet run);
- review bbe2fbba's four lows, each fixed test-first and independently reviewed. **All four are fixed in code by phase 1G
  ([phase1g.md](phase1g.md)); its independent review is owed:**
  1. `migration up` from a runner-owned, manifest-pinned staging copy; after it, `guardsBeforeMigrate` rerun as a `STOP` and
     a read-only 55321 snapshot that must equal the replay's `after` before exit 0; any started apply recorded (for example
     `sharedApplyAttempted`) so no outcome allows another. *Phase 1G:* done as described in 6.3 below;
  2. M2 under `ended` fails closed; the nonvacuous M2 is the one under `banned` (§4). *Phase 1G:* done;
  3. the verdict keeps the detail lines and requires exactly `HTTP 200, 1 row(s)` for every expected `profile_read`
     failure. *Phase 1G:* done;
  4. the `before` snapshot immutable: a retake refused, or required to equal the existing one. *Phase 1G:* a retake is
     refused.

  **Done:** review 2026-10-26T2000Z ([copy](../../../evidence/MB-1/independent-review-2026-10-26T2000Z.md)) found phase 1G
  not blocked for the replay-only step, with two lows. **Phase 1H ([phase1h.md](phase1h.md)) fixed both in code,
  test-first; its independent review is owed:**
  1. any complete M2 run whose banned check passed is the stop, whatever the answer; a passed M2 never runs again; any
     stop blocks `shared-apply`, an earlier pass included;
  2. replay `start` and `migrate` recheck their input immediately before the CLI, and `migrate` again after it, as a
     recorded STOP that halts every command.

  **Done:** review 2026-10-26T2305Z ([copy](../../../evidence/MB-1/reviewer-final-2026-10-26T2305Z.md)) found phase 1H not
  blocked for §3, with four lows. **Phase 1I ([phase1i.md](phase1i.md)) fixed findings 1, 2 and 4 in code, test-first; its
  independent review is owed:**
  1. any M2 run whose banned check printed `ok` is the stop, complete or not (needed before any `mutate m2` or `suite m2`);
  2. the after-`migrate` STOP is tested with exit 0, exit 1 and a timeout, eight changes each, one subtest per change;
  3. (finding 3, inode and ctime detection) **deferred to a separate design phase.** Until then the single-writer
     condition in §3.1 stands: nothing else writes to the replay or to the worktree's `supabase/` while `migrate`, `diff`
     or `lint` runs;
  4. `migrations`, `diff`, `lint` and `stop` recheck before the CLI, and `diff` and `lint` after it as a recorded STOP
     (needed before §5).

1. The coordinator confirms that no other lane uses 55321 during 6.2 to 6.5.
2. `MB1 shared-snapshot /tmp/fitlog-mb1-replay-YYYYMMDD before --evidence phase2-6-before`: the same pinned file, read-only,
   in `supabase_db_fitlog_rebuild_20261017` after `supabase status` for this repository answers at 55321. It must equal
   2.1 exactly. Any difference: **stop and apply nothing**.
3. `MB1 shared-apply /tmp/fitlog-mb1-replay-YYYYMMDD --confirm fitlog-mb1-shared-apply-YYYYMMDD --evidence phase2-6-apply`.
   Refused without its own token (stop's token does not do), and unless red, M1–M3, a generation 2 green, a clean
   generation 2 diff and lint, matching images and 6.2 have all passed, and the repository's migration files are byte for
   byte the 16 the replay ran. Then, as its last step before the apply, it takes the read-only snapshot of 55321 again;
   it must still equal 2.1 exactly, or it prints `STOP and apply nothing` and exits 1 (finding 4: a change another lane
   made after 6.2, without a restart, applies nothing). Only then one `supabase migration up --local` for this repository;
   an `Applying` line for anything but the candidate fails it.

   **Since phase 1G (review bbe2fbba finding 1; [phase1g.md](phase1g.md) §6), after that fresh snapshot:**
   1. **Staging.** It writes once, or verifies unchanged, a runner-owned copy at `/tmp/fitlog-mb1-replay-YYYYMMDD/shared-apply/`,
      pinned in the manifest and re-hashed before every command. The copy holds:
      - the repository's `config.toml`, read once, bound to 55322 and to the replay's config, and those same bytes written;
      - the seeds and the 16 migrations, as the replay's own pinned copies.
   2. **Every guard,** the staged copy included.
   3. **The environment proof:** `supabase status --workdir <the copy>` must answer exactly 55321, with its database at
      `127.0.0.1:55322`.
   4. **Every guard again,** immediately before the apply.
   5. **The attempt** is written to `state.json` (`sharedApplyAttempted`) before the CLI starts.
   6. **`migration up --local --workdir <the copy>`.** The repository is never its input.
   7. **After it, whatever its exit:** the candidate hashed again, every guard rerun, the CLI's exit and `Applying` lines,
      then a read-only 55321 snapshot that must equal 3.2 (P1, P2 and P3 with each `statements_md5`). Only then is it
      recorded as `55321-after`, with `sharedApplied` and exit 0. Anything else is a `STOP:` line, never a refusal.

   An attempt blocks another `shared-apply` and a new `shared-snapshot before`, whatever its outcome.
4. `MB1 shared-snapshot /tmp/fitlog-mb1-replay-YYYYMMDD after --evidence phase2-6-after`: equal to 3.2. *Since phase 1G:*
   6.3 already records this snapshot. Running it again is read-only and stays allowed after any attempt (a timeout or a
   STOP included), so the coordinator can see what 55321 holds.
5. `MB1 shared-suite /tmp/fitlog-mb1-replay-YYYYMMDD --evidence phase2-6-green`: 27 ok on 55321, and GoTrue's ban answer
   equal to 2.2's (finding 4).
6. `rtk proxy pnpm backend:test`. Every step passes. Its other suites read `supabase status` in ways that could print it
   if they crash (review 39fe1fb5 finding 2, `verify.mjs:6`, `verify-gym.mjs:4`, `verify-freezes.mjs:4`), so save its
   output to evidence only if the scan in §8 prints nothing over it.
7. If 6.5 or 6.6 fails: stop and report. Do not edit any policy or function on 55321 by hand. A correction is a new
   append-only migration, proved on a fresh replay project first.

## 7. Teardown (needs its own authorization; not authorized now)

1. `MB1 retain /tmp/fitlog-mb1-replay-YYYYMMDD --evidence phase2-7-retain`: copies the SQL that ran
   (`sql/*.sql` as `docs/evidence/MB-1/phase2-sql/<name>.sql.txt`) and the manifest
   (`docs/evidence/MB-1/phase2-replay-manifest.json`), never over a different file (finding 6).
2. `MB1 teardown /tmp/fitlog-mb1-replay-YYYYMMDD --confirm fitlog-mb1-replay-YYYYMMDD --evidence phase2-7-teardown`.
   Refused until 7.1 matches. It stops the replay project (`stop --project-id fitlog_mb1_replay_YYYYMMDD --no-backup`,
   which deletes its data volumes), checks that no replay container is left and that 55321's database container is
   unchanged, then removes the directory **one entry at a time, never recursively**: the files it owns, the CLI's
   `.temp` and `.branches` files, then the empty directories, then its own lock (only if it still holds that lock's
   token), the sentinel last. Any entry it did not create stops it with nothing removed.
3. `rtk proxy docker ps -a --format '{{.Names}}'` lists no `fitlog_mb1_replay` container. Leave 55321 running.

## 8. Records

- Before committing any phase 2 evidence, this must print nothing:
  `rtk proxy rg -n -e sb_secret_ -e sb_publishable_ -e eyJhbGci -e 'JWT secret' -e 'S3 (Access|Secret) Key' --glob '!review-39fe1fb5-final.md' docs/evidence/MB-1`.
  The one excluded file is the verbatim review: its lines 65, 68 and 74 name these patterns in prose and hold no key
  (checked in phase 1C). The second verbatim review, `review-a102fb68-final.md`, matches none of them and is not excluded
  (checked in phase 1D). Everything the runner writes has already passed the same scan, widened to any JWT and any URL
  with a password.
- **Known hits allowed by exact line only (review 2026-10-27T0105Z low 1; recorded in phase 2 attempt 6, 27 October
  2026).** The command above stays exactly as written: the same five patterns, the same single exclusion, and no new or
  wider glob. It may print **exactly these five lines in three files and nothing else**. Each file must still have the
  sha256 below. Each line is a review or report copy quoting the repository's committed fake test fixture (the same
  literal as `scripts/backend/mb1-replay-test-harness.mjs:40` (moved there unchanged from `mb1-replay.test.mjs:40` by SF-0, at
  harness line 39, then one line down by SF-7's binding import), and `scripts/backend/mb1-replay-evidence.test.mjs:17`), or the
  bare pattern prefix in prose. No line holds a key. Any other line, a changed line number or a changed hash fails §8.

  | File (in `docs/evidence/MB-1/`) | Line | Tokens on the line (`sb_secret_[A-Za-z0-9_-]*`, `-o`) | File sha256 |
  |---|---|---|---|
  | `reviewer-final-2026-10-27T0005Z.md` | 106 | `sb_secret_fixture-must-never-print-0001` | `cef2fc2d6646dc394821a1fe8972487695193d589f9055f9d5d76e78b9757f08` |
  | `implementer-final-2026-10-27T0035Z.md` | 23 | `sb_secret_fixture-must-never-print-0001` | `fb019b3a929809058f22d558e25324e083f6a9a1364c25e14f9ecf5ec0dc68e9` |
  | `reviewer-final-2026-10-27T0105Z.md` | 9 | `sb_secret_fixture-must-never-print-0001` | `34df6934ebac611e5a6bccd3c4764f06f4d52584294a97a7add9a317836a5436` |
  | `reviewer-final-2026-10-27T0105Z.md` | 140 | `sb_secret_` (a regex quoted in prose), then `sb_secret_fixture-must-never-print-0001` | (as above) |
  | `reviewer-final-2026-10-27T0105Z.md` | 142 | `sb_secret_` (the pattern's name in prose) | (as above) |

  **Token check:** `rtk proxy rg -n -o -e 'sb_secret_[A-Za-z0-9_-]*' --glob '!review-39fe1fb5-final.md' docs/evidence/MB-1`
  must print exactly the six tokens above. Each is either the full fake fixture literal or the bare prefix `sb_secret_`
  with nothing after it. The other four §8 patterns must match nothing outside the excluded file. **Never:** a wildcard
  glob (`!*review*`, `!implementer-*`), a dropped pattern, or any other weakening. A report or review saved here later
  should name the fixture without spelling its literal; if it does spell it, it needs its own exact row here, by line and
  hash, before any commit.
- Write `docs/plan/runs/MB-1/phase2.md` (each step, its command, its result line and its evidence file) and update the
  checkpoint. Claim only what ran. Even if everything above passes, box 3 stays **not met** until B1 and B2 are proven.
- Requests outside MB-1's writes: wire `node scripts/backend/verify-identity.mjs` into `backend:test` (root
  `package.json`), and update 003 §3.7's "Missing" line on F-2 for `profile_read`.

## 9. MB-1 completion blockers (after phase 2, before MB-1 Done)

**B1 — the G16.api linked-policy prerequisite (Codex coordinates a narrow cross-lane fix).**
- Scope: one new append-only migration that adds `and (select private.member_active())` to the `auth.uid()`-only
  branch of each of `role_read` (`user_id=auth.uid()`), `register_read` (`linked_user_id=auth.uid()`), `plans_read` and
  `gym_read` (the linked-member `exists`). The staff branches already pass through `private.gym_role()`, which calls
  `member_active()` (`20261017164708_gym_operations.sql:14`). Nothing else changes.
- Why narrow and cross-lane: the tables are G16.api's (003 §10), but G16.api's card needs MB-1, so waiting for G16.api
  to be Done would deadlock.
- Proof, in the same shape as this plan: per policy, a live control row, then no row for a revoked session and for a
  disabled account. RED on a replay project without the fix, GREEN with it, and a mutation per policy on the replay
  only. Then the same preconditions-then-apply on 55321. (The runner's `shared-apply` refuses while the repository holds a
  migration the replay did not run, so B1's migration needs its own replay.)

**B2 — `401 UNAUTHENTICATED` at the published API (no contract relaxation).**
- 003 §3.7 and §4.5 stand: a missing or revoked session on a published `/v1` path gets `401 UNAUTHENTICATED` with the
  §4.5 envelope. Today those paths return `403 42501`, which the suite pins as current behaviour
  (`refresh_schedules_v1`, `complete_onboarding`).
- The `200 []` from direct table reads is defence in depth only. It never counts as box 3's "fails".
- Delivered by MB-1's contract work under a new contract version (phase1.md D5). The same change flips the suite's
  pins to `401` and `UNAUTHENTICATED` and adds a check per published path.

**Box 3 can be ticked only when** phase 2 has passed (replay and 55321), B1 and B2 each have passing, mutation-checked
evidence, and the handoff cites all three.
