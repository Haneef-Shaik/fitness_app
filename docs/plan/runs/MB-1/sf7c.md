# MB-1 SF-7c: review 0935Z's three lows, L1–L3 (pure code, fixtures only, no live run)

Attempt 1 · branch `codex/mb1-identity` · base local `main` `2a95726` · uncommitted working tree · 27 October 2026,
09:38:36Z (first clock reading) to 09:44:46Z (code and tests), then the records.
Codex AUTH-01 (owner delegation), one bounded phase after SF-7b's independent review
[`final-2026-10-27T0935Z-collected.md`](../../../evidence/MB-1/final-2026-10-27T0935Z-collected.md) (`0cefa246…c528`). That
review found no critical, high or new medium finding (C0 H0, new M0) and ran 301 pure tests on Node v22.23.1. **Codex accepts
it.** The carried M1 stays open. **Nothing is Done and no Done-when box is met** (§7).

## 1. Scope, and what did not run

- **Done:**
  - L1, test-first: the proven database ID's start time, checked right after the binding;
  - L2: the two stale comments, and two test comments with the same ambiguity;
  - L3: the records pointer that names the three finals, with their hashes and actual timing (§6).
- **Not run, by the brief:**
  - the runner, the replay directory, Docker, the Supabase CLI, any database, SQL or network call;
  - any shared apply, the real runner, and the live M1 read (R0–R17). That plan was reviewed, not executed, and it is not
    accepted as closing M1;
  - `backend:test`, subagents, launchers, commits, staging and rebases;
  - edits to `verify*.mjs`, `local-stack.mjs`, root `package.json`, status, GOALS, ACCEPTANCE, or any other lane's file.
- **Mutations: none ran (§4).** SF-7b's eight planned mutations stay **UNRUN**. The `mkdir -p` and `cp` that SF-7b was
  denied were not retried, and nothing replaced them. Reading code is not a behavioural kill.
- **Denied this phase:** `rtk proxy wc -l` (a line count at the start). It was not retried, and no other tool counted lines
  instead (§8).
- **Policy, restated by the coordinator:**
  - PRD §16.1 / ADR003: gym staff never read or write private health data, whatever the consent.
  - The privacy override stays until QA-2 is integrated and launching-checkout is corrected.
  - SF-7c opens no data path: the candidate (`ac262f39…bdc3`) and `config.toml` (`67a35911…1b94`) hash unchanged.

## 2. What changed

| File (`scripts/backend/`) | Change |
|---|---|
| `mb1-replay-live.mjs` | `sharedFingerprint` becomes `startTimeOf(ctx, container, label)`, by name or ID, with the same refusals and texts. New `provenStarted(ctx, id)`. `sharedRunning` calls it right after `sharedBinding`, with no child process between them, then prints one more line. L2: `sharedBinding`'s JSDoc now says the snapshots exec the proven ID. Header line |
| `mb1-replay.mjs` (entry) | Comments only. L2: the `DOCKER_HOST` rule is now stated as `^unix:///` (a socket with an absolute path; a bare `unix://` is refused), plus an SF-7c line. Code and the six exports are unchanged |
| `mb1-replay-test-harness.mjs` | An inspect by a 64-hex ID answers for the container Docker has under that ID now (`w.binding`'s database, with `w.shared`), or `No such container`. `provenRuns` queues answers. The new kind is `inspect-id`. The §8 fixture literal stays at line 40 |
| `mb1-replay-sf7c.test.mjs` (new) | 3 tests (§3) |
| `sf7b`, `sf7`, `phase1g`, `phase1f`, `plan`, `guards` tests | Expectations: `'inspect-id'` after the first `'binding'` of every 55321 command whose binding held, and three positional call indexes moved by one. SF-7b L2's replacement now lands after the ID's inspect (`provenRuns`), so it still tests the exec by ID. Two comment lines in the SF-7b test (L2). All of this was done before the code, except the two comment lines (§3) |

**How L1 behaves:**
- The start-time check that every command runs first reads the container **by name**. Then `supabase status` and
  `docker ps` run, and then the binding proves an ID.
- Right after the binding, `docker inspect --type container --format '{{.State.Running}} {{.State.StartedAt}}' <proven ID>`
  must print exactly `ctx.state.shared`, the pin taken at prepare.
- Anything else refuses before any snapshot exec, staged input, attempt record, `migration up` or suite:
  - a new start time;
  - `false …` (not running);
  - no such container (`absent`);
  - an unfinished inspect;
  - any other value.
- The refusal says: `the database container Docker's binding proved, inspected by its ID, does not have the start time
  pinned at prepare (recorded "…", now "…"): it was restarted or recreated, or another Docker daemon answered, after the
  start-time check; nothing runs on 55321`. The ID is not printed.
- This covers `shared-snapshot` (before and after), `shared-apply` and `shared-suite`: all of them go through
  `sharedRunning`.
- For `shared-apply`, a lifecycle command, the start-time check after it runs again by name. When that check also sees the
  change, its STOP is the message printed. The behaviour is the same.
- The binding's arguments are unchanged (`bindingArgs`, asserted in the control). Replay commands never inspect an ID: the
  `guards` test pins every replay inspect to the name.

## 3. Tests (Node v22.23.1, `rtk proxy node --version`)

| Run | Command | Result |
|---|---|---|
| Baseline | not rerun (brief) | **Inherited:** 301/301, executed independently by review 0935Z on these bytes. At phase start all 13 SF-7b files and the unchanged modules hashed equal to sf7b.md §5 (executed) |
| RED | `rtk proxy node --test --test-reporter=spec --test-reporter-destination=/tmp/fitlog-mb1-sf7b/sf7c-red1.txt` on 7 files: the new `sf7c` test and the six of §2's last row | 42 tests, 25 pass, **17 fail, each for its intended reason.** 14 lack the ID's inspect in their expected sequence. The 3 SF-7c tests show the defect itself: under a restart, `shared-snapshot before` exits 0 and records a reference read from the restarted container; `shared-apply` runs the fresh snapshot, the attempt, `migration up` and the after snapshot, and only the check after it STOPs; with an ID answer queued, the ID is never inspected |
| GREEN | the same, `sf7c-green1.txt` | **42/42 on the first run.** No assertion changed after the code. Two comment lines in the SF-7b test file were edited after the code and before GREEN (L2) |
| Final, once | `rtk proxy node --test --test-reporter=tap --test-reporter-destination=/tmp/fitlog-mb1-sf7b/sf7c-final.tap scripts/backend/*.test.mjs` (19 files) | `1..155`, **`# tests 304`, `# pass 304`, `# fail 0`**, `# cancelled 0`, `# skipped 0`, `# todo 0`, `# duration_ms 14650.751292` |

301 + 3 = 304 tests and 152 + 3 = 155 top-level; the MB-1 runner tests are 248 + 3 = **251** (15 files). The reports went
into SF-7b's existing scratch directory: no directory was created.

**The three SF-7c tests:**
1. **`shared-snapshot before`.** Four changes land between the start-time check and the binding read, armed on the
   `docker ps` that sits between them:
   - a restart (the same ID, a new start time);
   - a recreate (a new ID and start time);
   - a Docker context switched to another daemon with the same names, label and ports;
   - a stop (`false`).

   Each refuses with the exact message. The calls end at `inspect-id`, whose arguments name the ID the binding had just
   proved. `state.json` is byte-equal and records no reference. Control: with nothing changed, the calls are `… binding,
   inspect-id, psql-read`, with the binding arguments unchanged, the exec by the same ID, and the new line printed.
2. **`shared-apply`, then `shared-suite`.**
   - The same four changes refuse `shared-apply` right after the ID's inspect: no fresh snapshot, no staged directory, no
     attempt, no `migration up`, and `state.json` byte-equal.
   - A transient switch (the binding read and the ID's inspect answered by the other daemon, then back) shows the ID's own
     refusal.
   - Control: the apply passes, with `inspect-id` only after the first binding read.
   - Then each change refuses `shared-suite`: no suite runs and `state.json` is unchanged. Its control runs the suite once.
3. **The ID's inspect fails closed.** No such container (`now "absent"`), a timeout, an unexpected value, and two lines each
   refuse before any exec. Each queued answer was consumed, so the ID was inspected.

**Side effects, inspected before the final run** (Grep over the 19 test files): writes go only to `mkdtemp`. Docker,
Supabase, pnpm, psql and fetch are doubles; fetch is replaced by a double that throws. The only real children are temporary
`node` scripts, `git` in scratch repositories, and one read-only `check-sql-sources` run on this repository. The new test
file starts no process.

## 4. Mutations: none ran

None ran. **SF-7b's eight stay UNRUN** (sf7b.md §4: R-exit, D-call, D-rule, D-empty, I-name, T-bind, T-fp, L4-text).
R-exit's behavioural kill is still not shown. Reading `shared.mjs:80` is an argument, not a kill.

Planned for SF-7c, if a scratch tree is ever explicitly authorized (predictions, not results):

| Id | Change | Expected to fail |
|---|---|---|
| P-call | delete the `provenStarted` call in `sharedRunning` | all 3 SF-7c tests by behaviour (exit 0, an exec, an attempt), and every `inspect-id` expectation |
| P-compare | `now !== ctx.state.shared` → `now === 'absent'` | SF-7c 1–2: restart, recreate, context, stop, by behaviour; test 3's `absent` case still refuses |
| P-target | `provenStarted(ctx, SHARED.container)` (by name) | every `inspect-id` kind (it becomes `inspect`); SF-7c 2's transient switch passes, by behaviour |
| P-unfinished | an unfinished inspect returns `'absent'` | SF-7c 3's timeout case, by message only (still refused) |

## 5. Hashes (`rtk proxy sha256sum`, executed)

**Before** (phase start): all 13 SF-7b files equal sf7b.md §5, as do `exec`, `sql`, `commands`, `evidence`, `target`,
`verify-identity.mjs`, the candidate and `config.toml`.

**After (final run):**

| sha256 | `scripts/backend/` | Was (sf7b.md §5) |
|---|---|---|
| `93ce412abb91ceeed09ffb0823a03e6de45e8d594d8c63b4511cdace66703102` | `mb1-replay.mjs` (comments only) | `4f842900…bb06` |
| `d95b9587dca75ae4dbe43d53bce6dfd8b225fd06eb1a0cc662c47824f2b2c15b` | `mb1-replay-live.mjs` | `067b0fe4…ff08` |
| `c6a9f9f21a4a90ec91922977c7e0151bdf576d9a7fd71095185c8296a003ff72` | `mb1-replay-test-harness.mjs` | `a6b5f7f4…6c32` |
| `b7e80462fc86fd9415c27c7f9a3ac6e424f7d7049b85c68c43a29b9b087edbd1` | `mb1-replay-sf7c.test.mjs` | new |
| `f01654d0edbf0c195eb1e61c9e655e7a479c5825a7a5cfd63afe84cb44f7bcfd` | `mb1-replay-sf7b.test.mjs` | `39900b05…e2d8` |
| `001ba47cb2ca4968fbef5c3a62ddacb2f1885231e8c8128d02c2875c5acb17b7` | `mb1-replay-sf7.test.mjs` | `9b0c0c0c…d47c` |
| `d93da8877b8716b88f1c94393669eb30b8759d8a75eb01ef6bb9106e20c79c64` | `mb1-replay-guards.test.mjs` | `b2279c98…7005` |
| `82a7df0701a219fcd4507c455ebfca106180ee1e67b9068bb9453a593998ce8e` | `mb1-replay-plan.test.mjs` | `ebde61ad…079b` |
| `66ab165037767ad8848c801337d48c2880c5e8b6acac85b134d093c1707a769d` | `mb1-replay-phase1f.test.mjs` | `5829cdae…903f` |
| `7a3843479ee646b3fc6fabc3de06f07e6e52b4e378a759b5c0dbeb50527b0257` | `mb1-replay-phase1g.test.mjs` | `8192679c…2f27` |

**Unchanged (re-hashed equal after the final run):** `binding` `95773ef3…b692`, `shared` `3ae13f6e…ce50`, `order`
`a02525f0…c55f`, `binding.test` `cc2a3dde…9e2d`, `exec` `f77dc9e5…4172`, `sql` `f10e317f…3a35`, `commands` `3269580e…e8d3`,
`evidence` `6d52d70c…bb89`, `target` `42219dee…9eb5c`, `verify-identity.mjs` `944ba934…df81`, the candidate `ac262f39…bdc3`
and `config.toml` `67a35911…1b94`.

**§8 (Grep tool, executed):** exactly the five inventory lines in three files. Each of the three hashes as phase2-plan §8
records (`cef2fc2d…7f08`, `fb019b3a…68e9`, `34df6934…5436`). The harness literal is still at line 40.

## 6. L3: the three finals, by hash and actual timing (none edited)

The file names carry a cycle time. They are kept verbatim, and none was edited. Earlier records' "review 0905Z" is the
file name of the first row, not the time of its cycle.

| File (`docs/evidence/MB-1/`) | sha256 | What it is | Actual timing (per Codex) |
|---|---|---|---|
| `final-2026-10-27T0905Z.md` | `c68e01d570be0271ef489416fffe735c820bc0fc20aeaf6f81ca38de42c991bd` | SF-7's independent review (no critical, high or new medium; M1 carried; four lows, which SF-7b fixed) | collected in the **08:35** cycle, despite its name |
| `final-2026-10-27T0905Z-collected.md` | `dddba54392ca3e4c5e5870f6eebe397f961b02cc0e4fd3ee67323949513ed407` | SF-7b's own final (implementer: 301/301, mutations denied, status blocked) | collected in the **09:05** cycle |
| `final-2026-10-27T0935Z-collected.md` | `0cefa2469579947aa71a3dbb9d8394913a53496cb3cd45fc2482ca3d1112c528` | SF-7b's independent review (C0 H0, new M0; M1 carried; L1–L3 new), the review this phase follows | collected in the **09:35** cycle, the current final saved this cycle |

The cycle times are Codex's statements. This phase did not observe them. The hashes are executed (`rtk proxy
sha256sum`, at phase start).

## 7. Residuals and decisions (stated, not claimed)

- **M1 (carried, open):** nothing here proves that the Docker reads (binding, start times, exec) and the TCP write to
  127.0.0.1:55322 reach the same Postgres. The ID's inspect reads the same Docker endpoint as the binding.
  - The live M1 plan (review 0935Z, R0–R17) was **reviewed, not executed, and not accepted as closure**.
  - Even after it, **SQL cluster equivalence stays unproved**: the `system_identifier` comparison over both paths needs SQL
    and a credential, so it needs its own decision.
- **L1's limits:**
  - A gap remains between the ID's inspect and the snapshot exec. A recreate there still fails the exec by ID (SF-7b).
  - The second binding read before `migration up` re-checks the ID, the label and the ports, but not the start time. So a
    restart with the same ID between `sharedRunning` and `migration up` is caught only by the lifecycle STOP after the
    apply. **Not changed now:** L1's fix is placed where the review said, right after the binding in `sharedRunning`. The
    next review decides whether `bindingUnchanged` should re-inspect too. *(SF-7d: review 1105Z made this its L1 and L2;
    the proven ID is now inspected right after the second binding read and twice after `migration up`. See
    [sf7d.md](sf7d.md).)*
- **R-exit's behavioural kill:** still not shown. SF-7b's eight mutations, and SF-7c's four planned above, are UNRUN.
- **Decision (Codex, recorded here):** before any future `backend:test`, QA-9's phase 3N readiness gates G1–G7 require a
  single, separate harness-correction phase. MB-1 owns it, and Codex explicitly assigns its S2 paths. **Not authorized
  now:** SF-7c does none of it.
- **Review:** self-review only; subagents are forbidden by the brief. **A fresh independent review of SF-7c comes next.**
- **Still open:** M1, SF-1 to SF-6, finding 5, I1, I2, three files over 400 lines and the old citations, the read-only live
  read, §5, §6 (55321) and §7, B1, B2, box 3 as a whole, and any shared apply.

## 8. Commands and permissions (this session)

| Command | Result |
|---|---|
| `rtk proxy git -C <worktree> status --short` | at phase start: 30 untracked MB-1 entries (two docs directories, 27 scripts, the candidate) |
| `rtk proxy wc -l …` | **Denied.** Not retried; no other tool counted lines instead. No line count is claimed |
| `rtk proxy node --version` | `v22.23.1` |
| `rtk proxy date -u +%Y-%m-%dT%H:%M:%SZ` | `09:38:36Z`, `09:44:46Z` |
| `rtk proxy sha256sum …` | phase start, after the final run, the three §8 files, the records |
| `rtk proxy node --test --test-reporter=spec --test-reporter-destination=/tmp/fitlog-mb1-sf7b/sf7c-{red1,green1}.txt <7 files>` | §3 |
| `rtk proxy node --test --test-reporter=tap --test-reporter-destination=/tmp/fitlog-mb1-sf7b/sf7c-final.tap scripts/backend/*.test.mjs` | once, §3 |
| Grep, Glob, Read, Edit, Write | inspection, the code and tests, §8, and the MB-1 records |
| Not used | subagents, launchers (the brief's pasted launcher was not run), commits, staging, any runner, Docker, CLI, database, SQL or network command |
