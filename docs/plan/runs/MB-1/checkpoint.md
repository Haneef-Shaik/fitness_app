# MB-1 checkpoint

Attempt 1 · branch `codex/mb1-identity` · base local `main` `2a95726` · uncommitted working tree · 27 October 2026 (SF-7e).

## Where it stands

**SF-7e (Codex AUTH-01: one bounded, pure-code, test-first phase after SF-7d's review) is done in code and tests, 27 October
2026 (no clock time: `date` was denied in SF-7d and not retried). No mutation ran.** Full record: [sf7e.md](sf7e.md);
handoff: [handoff.md](handoff.md). **No runner, Docker, CLI, database, SQL or network command ran, and the replay was not
opened.**
- **The review it follows:** [`final-2026-10-27T1132Z-collected.md`](../../../evidence/MB-1/final-2026-10-27T1132Z-collected.md).
  - SF-7d gets C0 H0, with M1 carried, one new low (L1, self-reported by SF-7d) and four informational notes.
  - 308/308 pure tests on Node v22.23.1, executed by the reviewer and **inherited** here. Codex accepts it.
  - The coordinator confirmed L1 in `dispatch`. The final is not edited.
- **Fixed, test-first, with fixtures only:**
  - **L1:** a verified `shared-apply` (exit 0) now passes the entry's start-time check by name **before** `state.json` is
    written, and `finally` skips its own check, so exactly one runs after the apply.
    - A restart, a stop, another start time read once or a timeout there is a STOP (exit 1).
    - Only the attempt stays on disk: no `sharedApplied` and no `55321-after`.
    - The next `shared-apply` and `shared-suite` are refused.
  - **Other paths, unchanged:** every other outcome and every other lifecycle command still writes its state first and is
    checked in `finally`. Controls show that `stopRecorded` (`migrate`, `diff`) and `stop`'s generation persist.
  - **I-1:** stale wording fixed in the entry header, `order.mjs`, `shared.mjs` and the SF-7d test's header.
- **Meaning:** `sharedApplied` now means that every check inside `shared-apply` held, and then the check by name after it,
  before it was written. It describes 55321, not the exit code: a lock-release STOP or a failed evidence write may follow
  (I-2).
- **Files:**
  - `mb1-replay.mjs` (code: `dispatch`; and comments);
  - comments only in `mb1-replay-order.mjs`, `mb1-replay-shared.mjs` and `mb1-replay-sf7d.test.mjs`;
  - the new `mb1-replay-sf7e.test.mjs` (3 tests, 9 subtests).
- **Tests (Node v22.23.1):**
  - RED, focused on 3 files: 19 tests, 6 failing, each for its reason. The four L1 cases (and their parent) recorded
    `sharedApplied` on a STOP run, and the success control wrote the state before the check by name. The five controls
    passed.
  - GREEN: 19/19 on the first run.
  - The final run, once, on the final code bytes: `1..162`, **`# tests 320`, `# pass 320`, `# fail 0`**.
- **Not run:**
  - SF-7b's eight, SF-7c's four, SF-7d's five and SF-7e's four planned mutations stay **UNRUN**;
  - hashes: `sha256sum` is not retried.
- **Open:**
  - M1;
  - I-b, I-2 (stated), and the stdout line note (sf7e.md §7);
  - SF-1 to SF-6, finding 5, B1, B2, box 3 and any shared apply.
- **Next:** a fresh independent review of SF-7e. Shared apply, SF-1 to SF-6, B1, B2 and box 3 stay blocked.

**SF-7d (Codex AUTH-01: one bounded, pure-code, test-first phase after SF-7c's review) is done in code and tests, 27 October
2026 (no clock time: `date` was denied). No mutation ran.** Full record: [sf7d.md](sf7d.md); handoff:
[handoff.md](handoff.md). **No runner, Docker, CLI, database, SQL or network command ran, and the replay was not opened.**
- **The review it follows:** [`final-2026-10-27T1105Z-collected.md`](../../../evidence/MB-1/final-2026-10-27T1105Z-collected.md).
  SF-7c gets C0 H0 with M1 carried, two new lows and three informational notes; 304 pure tests on Node v22.23.1, executed by
  the reviewer and **inherited** here. SF-7c's own final is
  [`final-2026-10-27T1005Z-collected.md`](../../../evidence/MB-1/final-2026-10-27T1005Z-collected.md). Neither is edited.
- **Fixed, test-first, with fixtures only:**
  - **L1:** right after the second binding read, `shared-apply` inspects the proven database ID again. It is the last child
    before the final guards, the attempt record and `migration up`'s spawn, with no `await` between them.
    - A restart or a stop during the staged status, the route proof or that binding read (same ID) refuses there, with no
      attempt and `state.json` byte-equal.
  - **L2:** after `migration up`, whatever its exit, the proven ID is inspected right after the binding recheck, before the
    after snapshot.
    - It is inspected once more after the snapshot, before the verified state is returned to be written.
    - Any change or failure is a STOP with the attempt recorded, `sharedApplied` false and no `55321-after`.
- **Files:** `mb1-replay-live.mjs` (`provenStarted` takes a consequence and is exported), `mb1-replay-shared.mjs`
  (`provenUnchanged` and its three calls), the new `mb1-replay-sf7d.test.mjs`, and expectations in six test files.
- **Tests (Node v22.23.1):**
  - RED, on 7 files: 37 tests, 15 failing, each for its reason. 11 lack the new inspects. The 4 new tests show the defect:
    `migration up` ran after a restart, and a STOP run recorded `sharedApplied`.
  - GREEN: 37/37 on the first run.
  - The final run, once: `1..159`, **`# tests 308`, `# pass 307`, `# fail 1`**. The failure was the scope test: my
    second header line in `live.mjs` pushed its role comment out of the first five lines. Fixed (comment only), and the
    scope test alone was rerun: 3/3.
  - **The full suite was not rerun** (the brief: once), so a full green on the final bytes is not shown here.
- **Not run:**
  - SF-7b's eight, SF-7c's four and SF-7d's five planned mutations stay **UNRUN**.
  - Hashes were not taken: `sha256sum` was denied to review 1105Z and is not retried here.
  - `date` was denied and not retried.
- **Open:**
  - M1;
  - the entry's window: the start-time check by name in `finally` after the verified state is written (sf7d.md §7). It needs
    `mb1-replay.mjs`, which the brief does not allow;
  - stale wording in the entry header and in one SF-7 test title;
  - I-b;
  - SF-1 to SF-6, finding 5, B1, B2, box 3 and any shared apply.
- **Next:** a fresh independent review of SF-7d.

**SF-7c (Codex AUTH-01: one bounded, pure-code, test-first phase after SF-7b's review) is done in code and tests, 27 October
2026, 09:38:36Z–09:44:46Z, then the records. No mutation ran.** Full record: [sf7c.md](sf7c.md); handoff:
[handoff.md](handoff.md). **No runner, Docker, CLI, database, SQL or network command ran, and the replay was not opened.**
- **The review it follows:** [`final-2026-10-27T0935Z-collected.md`](../../../evidence/MB-1/final-2026-10-27T0935Z-collected.md)
  (`0cefa246…c528`, the 09:35 cycle). SF-7b passes with C0 H0, no new medium, and 301 pure tests on Node v22.23.1, executed
  by the reviewer and **inherited** here. Codex accepts it. The carried M1 stays open.
- **Fixed:**
  - **L1, test-first:** right after the binding, every 55321 command runs `docker inspect --type container` on the proven
    database ID. It must print exactly the start-time pin. A restart, a recreate, a switched context or a stop in the gap
    after the name-based check refuses before any snapshot exec, staged input, attempt, `migration up` or suite. The
    binding's arguments are unchanged.
  - **L2:** the stale comments now name the proven ID and the `^unix:///` rule.
  - **L3:** a pointer names all three finals, with their hashes and actual timing (sf7c.md §6). None is edited.
- **Tests (Node v22.23.1):**
  - RED, on 7 files: 42 tests, 17 failing, each for its reason;
  - GREEN: 42/42 on the first run;
  - the final run, once, after the side effects were inspected: `1..155`, **`# tests 304`, `# pass 304`, `# fail 0`**.
- **Not run:**
  - SF-7b's eight mutations stay **UNRUN**. The denied `mkdir`/`cp` were not retried or replaced, and reading is no
    behavioural kill.
  - SF-7c's four planned mutations are not run either.
  - The live M1 plan (R0–R17) was reviewed, not executed, and is not accepted as closure. SQL cluster equivalence is
    unproved.
- **Decision (Codex):** before any future `backend:test`, QA-9's phase 3N readiness gates G1–G7 require a single, separate
  harness-correction phase. MB-1 owns it, and Codex explicitly assigns its S2 paths. Not authorized now.
- **Open:** M1, the same-ID restart window before `migration up` (sf7c.md §7), SF-1 to SF-6, finding 5, B1, B2, box 3 and
  any shared apply.

**SF-7b (Codex AUTH-01: one bounded, pure-code, test-first phase after SF-7's review) is done in code and tests, 27 October
2026; its mutations did not run (denied).** Full record: [sf7b.md](sf7b.md); handoff: [handoff.md](handoff.md). **No runner,
Docker, CLI, database or network command ran, and the replay was not opened.**
- **The review it follows:** [`final-2026-10-27T0905Z.md`](../../../evidence/MB-1/final-2026-10-27T0905Z.md). SF-7 passes,
  with no critical, high or new medium finding. Codex accepted it and keeps the carried M1 open. *(SF-7c, review 0935Z L3:
  "0905Z" is this file's name. Per Codex, it was collected in the 08:35 cycle. The 09:05 item is SF-7b's own final,
  `final-2026-10-27T0905Z-collected.md` `dddba543…d407`; see sf7c.md §6.)*
- **Fixed test-first, fixtures only (sf7b.md §2):**
  - **L1:** `shared-*` commands refuse a `DOCKER_HOST` that is not `unix:///…`, before any child, and never print it.
    Replay commands, `stop` and `teardown` are unchanged.
  - **L2:** both inspects say `--type container`, and every 55321 snapshot execs the database ID the binding proved. A
    container replaced in between fails the snapshot, applies nothing, or STOPs after `migration up`.
  - **L3:** a valid route table with a non-zero or missing exit refuses before any attempt. The code was already right.
  - **L4:** the STOP and the "already attempted" refusal point to SF-2's manually authorized read-only path, which is not
    written. They advise no runner read.
- **Tests (Node v22.23.1):**
  - RED, on 7 targeted files: 45 tests, 15 failing, each for its reason (the L3 test passed, as a test gap should);
  - GREEN: 44/45, then 45/45 after one fixture selector moved from the container name to the proven ID;
  - the final run, once: `1..152`, **`# tests 301`, `# pass 301`, `# fail 0`**.
- **Mutations: not run.** The scratch tree's `mkdir -p` and `cp` were denied, so the sequence stopped, with no in-place or
  other workaround. R-exit's behavioural kill is **not shown** (sf7b.md §4 lists the planned set).
- **Open:** M1 (the listeners and the context endpoint need the read-only live read), SF-1 to SF-6, finding 5, B1, B2, box 3
  and any shared apply.

**SF-7 (Codex AUTH-01: one bounded, pure-code, test-first phase after SF-0's review) is done, 27 October 2026, as far as code
and fixtures can take it.** Full record: [sf7.md](sf7.md); handoff: [handoff.md](handoff.md). **No runner, Docker, CLI,
database or network command ran, and the replay was not opened.**
- **The review it follows:** [`final-2026-10-27T0605Z.md`](../../../evidence/MB-1/final-2026-10-27T0605Z.md) (SF-0 passes; no
  critical, high or new medium finding). Codex accepted its L2 residual, so no byte-move proof is claimed.
- **Fixed in code, test-first:**
  - **0405Z finding 1, the medium:** every 55321 command now needs Docker's own binding. One `docker inspect` must show the
    project label, `5432/tcp` only at 55322 and Kong's `8000/tcp` only at 55321, on 127.0.0.1 or 0.0.0.0. The parser is pure
    and fails closed (`mb1-replay-binding.mjs`).
  - In `shared-apply`, the staged route proof runs next: 16 local, exactly the 15 base remote, and the candidate local only.
    Then the binding is read again and must be equal. Then come the final guards, the attempt and the CLI, with no await
    between them.
  - After `migration up`, a changed or unreadable binding is a STOP.
  - **The replay mirror is held:** `stop` and `teardown` are unchanged.
  - **0405Z finding 4:** `readState` refuses any `shared` that is not `true <ISO time>`. Today's value and state shape read
    unchanged.
  - **0605Z L1:** the entry's six exports are pinned, a repository scan allows only the runner chain to import the five
    internal modules, and each module's role comment says so.
  - **0605Z L3:** record corrections (sf7.md §5).
- **Tests (Node v22.23.1):**
  - baseline 282/282;
  - RED 2 with an interface stub: 296 tests, 20 failing, each for the intended reason;
  - GREEN 296/296 on the first run;
  - final `1..147`, `# tests 296`, `# pass 296`, `# fail 0`.
- **Mutations:** 17, each killed by named tests (R-exit by message only), each restored to its hash (sf7.md §4).
- **Open, and not claimed:**
  - Docker's real shape is unseen: the label key, the Kong name, and any `0.0.0.0`-plus-`::` pair. Until a reviewed first
    live read, such a pair makes every 55321 command refuse. That is fail closed.
  - Finding 5 (SF-3), SF-1 to SF-6, B1, B2, box 3 and any shared apply.

**SF-0 (Codex AUTH-01: the first reviewed checkpoint of SF-α, pure code only) is done, 27 October 2026: the runner and its
test file are split with no behaviour change.** Full record: [sf0.md](sf0.md); handoff: [handoff.md](handoff.md). **No runner,
CLI, Docker, database or network command ran, and the replay was not opened. The split fixes no finding: review 0405Z's
medium (finding 1, the shared-target binding) and its four lows are as open as before.**
- **The review it follows:** [`final-2026-10-27T0405Z.md`](../../../evidence/MB-1/final-2026-10-27T0405Z.md), SF-α item 1.
  Codex accepted M2 as partial disposable-profile evidence only. Its medium blocks any shared apply.
- **Layout (sf0.md §2):**
  - `mb1-replay.mjs` (798 lines) is now an entry (191) plus `exec` (74), `live` (140), `sql` (87), `commands` (234) and
    `shared` (138).
  - The 2,210-line test file is now `mb1-replay-test-harness.mjs` (321; not a test file) plus eight test files of 119 to 338
    lines; `mb1-replay.test.mjs` keeps the executor tests.
  - The command line, the entry's exports and `readState` are unchanged.
- **Proof (sf0.md §3):**
  - Before either original was overwritten, `git diff --no-index --numstat` showed each new file adding exactly its
    predicted wiring lines (role comment, imports, exports), so every moved line is byte-identical.
  - The two in-place files went through a scratch copy first.
  - A Grep cross-check found no missing import, and `node --check` passed on 22 files.
  - The byte-for-byte verifier `docs/evidence/MB-1/sf0/sf0-split.mjs` was **not run**: a local node script was denied.
- **Tests (sf0.md §4):**
  - The baseline and the split run each went once, over all 7 → 14 `scripts/backend/*.test.mjs` files (corrected from 15 by
    SF-7, review 0605Z L3): `1..133`,
    `# tests 282`, `# pass 282`, `# fail 0`, both times, on Node v22.23.1.
  - The 282 are 229 MB-1 runner, evidence and order tests, plus `verify-identity` 14 (the coordinator's 243), plus 39 others.
  - The names compared: 133 top-level as a multiset, 149 subtests in the same sequence.
- **Mutations (sf0.md §5):**
  - The 11 phase 1I patches passed `git apply --check` on the old layout, and 11 regenerated patches
    (`docs/evidence/MB-1/sf0-mutations/`) pass it on the new one.
  - Each was killed by named tests on the pure harness with **exactly phase 1I's counts** (B2 5, P 19, Q 10, R 74, S 55, U 37,
    T 19, X 75, V 50, W 1, M2 36 of 229).
  - Each was restored to its hash.
- **Denied, not retried:** `wc -l`, running the local verifier script, `sort`, and `git apply -R --check`.
- **Not done, by the brief:** subagent reviews, commits and staging, and any live step.

**Phase 2 attempt 8 (Codex AUTH-01: the M2 block of §4 only, on the disposable replay) met every M2 expectation, 27
October 2026, 03:04:30Z–03:08:08Z.** Full record: [phase2.md](phase2.md), Attempt 8; handoff: [handoff.md](handoff.md).
**This is partial `profile_read` evidence on the disposable replay only: not box 3, not the goal, not 55321. §5, B1, B2,
the 55321 apply and the rest of box 3 are open.**
- **The review it ran under:** [`reviewer-final-2026-10-27T0305Z.md`](../../../evidence/MB-1/reviewer-final-2026-10-27T0305Z.md)
  (no critical, high or medium finding; one low). **Codex accepted it** with its M2 steps 1–7 and conditions C1–C7, and
  authorized **only the M2 block**. The coordinator states that it hashed all 53 handoff files this cycle (all equal);
  this phase did not rerun the pure tests.
- **Exclusive writer, recorded here before the first runner command** (after the 03:04:30Z reading and the pre-flight):
  for this cycle MB-1 alone owns the database lane (the coordinator: the previous three MB-1 sessions are explicitly
  stopped; the other seven lanes are owned elsewhere and unchanged). No other worker has database authority. No session or
  process other than this phase's runner writes to `/tmp/fitlog-mb1-replay-20261026` or to this worktree's `supabase/`;
  no other replay or Supabase writer runs. This session writes only MB-1 docs, and none while a runner job runs.
- **Pre-flight, passed (executed here):** the 12 FINAL and four CLI hashes equal handoff.md's table; both CLI
  `package.json` read `2.121.0`; nine `node --check` exit 0; `state.json` exactly the brief's (generation 1, candidate
  `applied`, active and proven `null`, restoredProof `true`, mutations `["m1","m3"]`, `banned`, sharedApplied `false`,
  `checks {}`, seven suites, the last ending `1793066864185`, no stop or halt key); no lock (the `.*` Glob shows the
  sentinel); no `phase2-4-m2-*` name; `sql/m2.sql` `295f7ad8…c740` and `sql/restore-member-active.sql` `37d4e00b…c904`
  equal the manifest pins, and `m2.sql` is the restore file minus only the `banned_until` clause.
- **The six authorized runner commands (review 0305Z steps 1–7), each a background job with no tool timeout, never
  signalled, each exit 0; `state.json` and the lock read after each:**
  1. `mutate m2 --evidence phase2-4-m2-apply`: `sql/m2.sql` `295f7ad8…c740`, `CREATE FUNCTION`, 0 withheld;
  2. `snapshot m2 --evidence phase2-4-m2-proof`: read-only; `changes from after: P1.fn_definition_md5` only, to
     `0e3be56b…2a11`, neither `e446cfc1…` nor M3's `4ad75fcd…` (also by hand);
  3. (90 s gate: 3500.82 s) `suite m2 --evidence phase2-4-m2-suite`, **the only one**: **the exact kill**. Only `a banned
     account reads no profile` failed, `HTTP 200, 1 row(s)`; 27 checks; the exact `1 of 27 …` summary; `banned`; `the m2
     expectation is met`; no STOP line;
  4. `state.json` read at once: the last entry `m2`, generation 1, `ok true`, `banned`; no `m2Stopped`; no lock;
  5. `mutate restore-member-active --evidence phase2-4-m2-restore`: `37d4e00b…c904`, `CREATE FUNCTION`, 0 withheld;
  6. `snapshot restored --evidence phase2-4-m2-restored`: `no rule broken`, no change from `after` (also by hand);
     byte-identical to M1's and M3's restored files (`518acf3f…342d`);
  7. (90 s gate: waited at 52.25–89.25 s without the runner, ran at 93.25 s) `suite green --evidence phase2-4-m2-green`:
     27 ok, `banned`, `the green expectation is met`; byte-identical to all three earlier GREENs (`8d94be72…6d05`).

  None of C1–C7 was triggered.
- **After:** all 12 sources and the four CLI files hash unchanged. `state.json`: candidate `applied`, active and proven
  `null`, restoredProof `true`, mutations **`["m1","m3","m2"]`**, **nine suites** (new `m2` and `green`, both `ok true`,
  `banned`, ending `1793070372755` and `1793070472840`), sharedApplied `false`, `checks {}`, no stop keys, no lock. The
  replay is still running. 55321 got no SQL and no Supabase command. Every §4 mutation is now used up on this replay.
- **Records:** §8 prints exactly its five inventory lines and six tokens; the inventory is unchanged. The six new runner
  files and the report copies 0235Z (`dba22b0d…0449`) and 0305Z (`e953113a…eaf7`) add no §8 hit.
- **Review 0305Z's low:** the authorization half is done (C3–C5 in the brief). The runner refusal of a second `suite m2`
  after any M2 suite entry, with a test, is **assigned** to the split-first phase. Not edited now.
- **Not run, by the brief:** §5–§7, `diff`, `lint`, `images`, `migrate`, `start`, `stop`, `teardown`, re-prepare, any
  `shared-*`, raw CLI, SQL or Docker, the pure tests and the subagent reviews. Nothing is committed or staged; no code,
  test, SQL or config file changed. The coordinator's launcher script, carried in the brief's message, was not run.

**Phase 2 attempt 7 (Codex AUTH-01: the M3 block of §4 only, on the disposable replay) met every M3 expectation, 27
October 2026, 02:04:12Z–02:07:59Z.** Full record: [phase2.md](phase2.md), Attempt 7; handoff: [handoff.md](handoff.md).
**This is partial `profile_read` evidence on the disposable replay only: not box 3, not the goal, not 55321. M2, §5, B1,
B2, the 55321 apply and the rest of box 3 are open.**
- **The review it ran under:** [`reviewer-final-2026-10-27T0205Z.md`](../../../evidence/MB-1/reviewer-final-2026-10-27T0205Z.md)
  (no critical, high or medium finding; two lows). **Codex accepted it** and its M3 recommendation, and authorized **only
  the M3 block**. The coordinator states that it checked all 45 handoff hashes (all equal) and read the state below;
  this phase did not rerun the pure tests.
- **Exclusive writer, recorded here before the first runner command** (after the 02:04:12Z reading and the pre-flight,
  before the 02:05:06Z reading): for this cycle MB-1 owns the database lane exclusively (the coordinator: every earlier
  MB-1 session is stopped; the seven blocked external lanes are untouched). No other worker has database authority. No
  session or process other than this phase's runner writes to `/tmp/fitlog-mb1-replay-20261026` or to this worktree's
  `supabase/`; no other replay or Supabase writer runs. This session wrote only MB-1 docs, none while a runner job ran.
- **Pre-flight, passed (executed here):** the 12 FINAL and four CLI hashes equal handoff.md's table; both CLI
  `package.json` read `2.121.0`; nine `node --check` exit 0; `state.json` exactly: generation 1, candidate `applied`,
  active and proven `null`, restoredProof `true`, mutations `["m1"]`, ban `banned`, sharedApplied `false`, `checks {}`,
  no stop or halt key; no lock (a `.*` Glob shows the hidden sentinel, so dotfiles are visible); no `phase2-4-m3-*` name.
- **The six authorized runner commands, each a background job with no tool timeout, never signalled, each exit 0:**
  1. `mutate m3 --evidence phase2-4-m3-apply`: `sql/m3.sql` `16a9542b…bb50`, `CREATE FUNCTION`, 0 withheld;
  2. `snapshot m3 --evidence phase2-4-m3-proof`: read-only; `changes from after: P1.fn_definition_md5` only
     (`e446cfc1…` to `4ad75fcd…`; also by hand);
  3. (90 s gate: 3474.86 s) `suite m3 --evidence phase2-4-m3-suite`: exactly `a deletion-pending account reads no
     profile` failed, `HTTP 200, 1 row(s)`; the exact `1 of 27 …` summary; `banned`; `the m3 expectation is met`;
  4. `mutate restore-member-active --evidence phase2-4-m3-restore`: `37d4e00b…c904`, `CREATE FUNCTION`, 0 withheld;
  5. `snapshot restored --evidence phase2-4-m3-restored`: `no rule broken`, no change from `after` (also by hand);
     byte-identical to M1's restored file;
  6. (90 s gate: waited at 53.85–82.85 s without the runner, ran at 92.85 s) `suite green --evidence phase2-4-m3-green`:
     27 ok, `banned`, `the green expectation is met`; byte-identical to both earlier GREENs (`8d94be72…6d05`).
- **After:** all 12 sources and the four CLI files hash unchanged. `state.json`: candidate `applied`, active and proven
  `null`, restoredProof `true`, mutations `["m1","m3"]`, new suites `m3` and `green` (both `ok true`, `banned`, ending
  `1793066763147` and `1793066864185`), sharedApplied `false`, `checks {}`, no stop keys, no lock. The replay is still
  running. 55321 got no SQL and no Supabase command.
- **Records:** §8 prints exactly its five inventory lines and six tokens; the inventory is unchanged. The six new runner
  files and the report copies 0135Z (`c5f39490…5d7f`) and 0205Z (`f52210f4…34f8`) add no §8 hit.
- **Review 0205Z's lows:** low 1 (M2's durable stop on a failed state write, SF-1 extended) and low 2 (the exact mutation
  SQL text pin, SF-5) are **assigned** to the MB-1 split-first design and refactor phase, not edited now. The other lows
  stay assigned as in its table.
- **Not run, by the brief:** M2, `diff`, `lint`, `images`, `migrate`, `start`, `stop`, `teardown`, re-prepare, any
  `shared-*`, raw CLI, SQL or Docker, any git command, the pure tests and the subagent reviews. Nothing is committed or
  staged; no code, test, SQL or config file changed. The coordinator's launcher script, carried in the brief's message,
  was not run.

**Phase 2 attempt 6 (Codex AUTH-01: the M1 block of §4 only, on the disposable replay) met every M1 expectation, 27
October 2026, 01:04:50Z–01:08:22Z.** Full record: [phase2.md](phase2.md), Attempt 6; handoff: [handoff.md](handoff.md).
**This is partial `profile_read` evidence on the disposable replay only: not box 3, not the goal, not 55321. B1, B2, the
55321 apply and the rest of box 3 are open.**
- **The review it ran under:** [`reviewer-final-2026-10-27T0105Z.md`](../../../evidence/MB-1/reviewer-final-2026-10-27T0105Z.md),
  a read-only safety review: GREEN, no critical, high or medium finding. **Codex accepted it** and authorized **only the M1
  block**, not M2 or M3. Codex states that this cycle it checked the 37 handoff hashes (all equal) and ran 282 pure tests
  (all pass); this phase did not rerun the tests.
- **Exclusive writer, recorded before the first runner command** (between the 01:04:50Z and 01:05:35Z clock readings): for
  this cycle MB-1 owns the database lane exclusively. No other worker has database authority, and no session or process
  other than this phase's runner writes to `/tmp/fitlog-mb1-replay-20261026` or to this worktree's `supabase/`. This
  session wrote only MB-1 docs, none while a runner job ran.
- **Pre-flight, passed (executed here):** the 12 FINAL hashes and the four CLI hashes equal; both CLI `package.json` read
  `2.121.0`; nine `node --check` exit 0; `state.json` exactly: candidate `applied`, active `null`, mutations `[]`, ban
  `banned`, sharedApplied `false`, no `stopRecorded`, `m2Stopped` or `sharedApplyAttempted`, and no lock.
- **The six authorized runner commands, each a background job with no tool timeout, never signalled, each exit 0:**
  1. `mutate m1 --evidence phase2-4-m1-apply`: `sql/m1.sql` `5bc259c9…836fb`, `ALTER POLICY`;
  2. `snapshot m1 --evidence phase2-4-m1-proof`: read-only; `changes from after: P2.profile_read.qual` only (also by hand);
  3. (90 s gate: 3527 s) `suite m1 --evidence phase2-4-m1-suite`: exactly RED's five `profile_read` checks failed, each
     `HTTP 200, 1 row(s)`; `banned`; `the m1 expectation is met`;
  4. `mutate restore-m1 --evidence phase2-4-m1-restore`: the pinned candidate `ac262f39…bdc3`, `ALTER POLICY`;
  5. `snapshot restored --evidence phase2-4-m1-restored`: `no rule broken`, no change from `after` (also by hand);
  6. (90 s gate: waited at 44–85 s without the runner, ran at 91.99 s) `suite green --evidence phase2-4-m1-green`: 27 ok,
     `banned`, `the green expectation is met`; byte-identical to attempt 5's GREEN.
- **After:** all 12 sources and the four CLI files hash unchanged. `state.json`: candidate `applied`, active `null`,
  restoredProof `true`, mutations `["m1"]`, new suites `m1` and `green` (both `ok true`, `banned`), sharedApplied `false`,
  no stop keys, no lock. The replay is still running. 55321 got no SQL and no Supabase command.
- **Review 0105Z's lows:** low 1 (secret-scan record) is done in the docs: §8's command and patterns are unchanged, and its
  allowed output is an exact inventory of five lines in three files, by line, token and file hash (phase2-plan.md §8).
  Low 2 (a refused suite uses up its evidence name) is done as a procedure: an explicit 90 s gate before every suite
  (phase2-plan.md rules). No runner edit.
- **Not run, by the brief:** M2, M3, `diff`, `lint`, `start`, `stop`, `teardown`, any `shared-*`, any git command, and the
  subagent reviews. Nothing is committed or staged; no code, test, SQL or config file changed.

**Phase 2 attempt 5 (Codex AUTH-01: bounded §3 on the disposable replay) met GREEN on the replay, 27 October 2026,
00:04:24Z–00:08:08Z.** Full record: [phase2.md](phase2.md), Attempt 5; handoff: [handoff.md](handoff.md). **This GREEN is
partial `profile_read` evidence on the disposable replay only: not box 3, not the goal, not 55321. B1 and B2 are open.**
- **The review it ran under:** [`reviewer-final-2026-10-27T0005Z.md`](../../../evidence/MB-1/reviewer-final-2026-10-27T0005Z.md),
  phase 1I's independent safety review: no critical, high or medium finding; 282 tests and nine syntax checks reproduced
  independently; §3 not blocked. **Codex accepted it.** Its four lows are assigned to an MB-1 design and refactor phase,
  pending, and **the runner (798/800 lines) and its test harness are split before any new runner edit** (phase2.md A5.5).
- **Exclusive writer, recorded before the first runner command (00:04:24Z–00:06:14Z):** for this cycle MB-1 owns the
  database lane exclusively. No other worker has database authority, and no session or process other than the runner
  writes to `/tmp/fitlog-mb1-replay-20261026` or to this worktree's `supabase/` (review 2026-10-27T0005Z condition 2;
  review 2026-10-26T2305Z finding 3). This session wrote only three MB-1 docs, none while a runner job ran.
- **Pre-flight, passed:** the 12 phase1i §6 "after" hashes and the four CLI hashes equal; both CLI `package.json` read
  `2.121.0`; nine `node --check` exit 0; `1..133`, `# tests 282`, `# pass 282`, `# fail 0`, `# skipped 0`; `state.json`
  as attempt 4 left it, with no lock and no halt.
- **The four authorized runner commands, each a background job with no tool timeout, never signalled, each exit 0:**
  1. `add-candidate --evidence phase2-3-add` (00:06:14Z): `ac262f39fc6962345f64982e36c6b2aa7f8f3418829fd653684002f2f2c1bdc3`,
     the pinned candidate, added;
  2. `migrate --evidence phase2-3-migrate` (00:06:28Z): `# rechecked immediately before migration up …` and `# rechecked
     after migration up …` (24 pinned files each), and exactly one `Applying` line, the candidate's;
  3. `snapshot after --evidence phase2-3-after` (00:06:56Z): read-only; `changes from before: P2.profile_read.qual,
     P3.+20261026040045`, which was also checked by hand against `before`;
  4. `suite green --evidence phase2-3-green` (00:07:15Z): 27 ok in order, `# suite exit 0; GoTrue's answer after the
     ban: banned`, `the green expectation is met`.
- **After:** all 12 sources and the four CLI files hash unchanged. `state.json` now holds candidate `applied`, the new
  `after` snapshot and a green suite (`ok true`, `ban "banned"`). There is no lock, `stopRecorded`, `m2Stopped` or
  `sharedApplyAttempted`, and `sharedApplied` is false. The replay is still running. 55321 got no SQL and no Supabase
  command.
- **Records:** the §8 secret scan now prints one line. `reviewer-final-2026-10-27T0005Z.md:106` names the fake test
  fixture `sb_secret_fixture-must-never-print-0001` (not a key). The coordinator decides an exclusion before any commit
  (phase2.md A5.4). The four new runner files are clean.
- **Not run, by the brief:** M1, M2 and M3, `diff`, `lint`, `start`, `stop`, `teardown`, any `shared-*`, any git command,
  and the subagent reviews. Nothing is committed or staged; no code, test, SQL or config file changed.

**Phase 1I (Codex AUTH-01: one bounded, pure-code, test-first correction phase) is done, 27 October 2026: findings 1, 2 and
4 of the independent review of phase 1H are fixed; finding 3 is deferred to a separate design phase.** Full record:
[phase1i.md](phase1i.md); handoff: [handoff.md](handoff.md). **No database, CLI, Docker, network or runner command ran,
and the replay was not opened.** Its own independent review is **done**: review 2026-10-27T0005Z (above), accepted, with
four lows assigned to the MB-1 design and refactor phase.
- **The review it answers:** [`reviewer-final-2026-10-26T2305Z.md`](../../../evidence/MB-1/reviewer-final-2026-10-26T2305Z.md).
  It found phase 1H **not blocked for §3**, with no critical, high or medium finding and four lows; it verified 128/128
  and the 16 hashes.
- **Finding 1 (the M2 stop, needed before any `mutate m2` or `suite m2`):** any M2 run whose checks include
  `ok - a banned account reads no profile` is the stop, complete or not, in order or not, whatever its exit: for example
  the banned check `ok`, then `verify-identity setup failed: Logout (local) failed: …`. It is durable (`m2Stopped`: the
  next `suite m2` is refused before it runs, and `shared-apply` is blocked). A setup failure that printed no check is not
  the stop. The old contrary assertions are flipped.
- **Finding 2 (a test gap; the code was right):** the eight post-`migrate` drift cases now run with exit 0, exit 1 and a
  timeout, one subtest each: the STOP, `stopRecorded`, the candidate still `added`, and every later command refused.
- **Finding 4 (needed before §5):** `migrations`, `diff`, `lint` and `stop` (and `teardown`, through the same stop) rerun
  the replay guards synchronously as their first statement, with no await before the CLI. After `diff` and `lint`,
  whatever the exit, they run again as a STOP recorded with `op` `diff` or `lint`; the halt names the command.
- **Finding 3 (deferred):** no inode or ctime detection. **The condition stands:** one writer only; nothing else writes to
  the replay directory or the worktree's `supabase/` while `migrate`, `diff` or `lint` runs; no actual CLI is approved
  by this phase.
- **Tests:**
  - baseline 128/128; RED on the three MB-1 files 229 tests, 122 pass, 107 fail, each for the intended reason; GREEN
    229/229 on the first run;
  - `rtk proxy node --test scripts/backend/*.test.mjs`: `1..133`, **`# tests 282`, `# pass 282`, `# fail 0`** (subtests
    counted), after the mutation restores; all nine `node --check` pass;
  - 11 guard mutations, each saved as a patch in
    [`docs/evidence/MB-1/phase1i-mutations/`](../../../evidence/MB-1/phase1i-mutations/) with its file's restore hash, each
    killed by named tests (phase1i.md §5.4). B2 replaces phase 1H's B. M2 (phase 1H's M rerun) now shows the repository
    `.env` case killed for real in all 16 contexts.
- **Hashes:** before and after in phase1i.md §6; the restored modules equal their recorded hashes. `verify-identity.mjs`,
  its test, the candidate `ac262f39…bdc3`, `config.toml` `67a35911…1b94`, `mb1-replay-target.mjs` and `phase1.md` are
  unchanged.
- **The live state is unchanged:** attempt 4's (RED met, reference `banned`, candidate `absent`, no GREEN, replay running
  with no lock). **B1 and B2 are open; box 3 is not met.**
- **Files:**
  - changed: `mb1-replay.mjs` (798 lines), `mb1-replay-evidence.mjs`, `mb1-replay-order.mjs` and the three MB-1 test files;
  - new: `phase1i.md` and the 11 patches under `docs/evidence/MB-1/phase1i-mutations/`;
  - docs: this checkpoint, `phase2-plan.md` and `handoff.md`.

  No SQL, config, identity, contract, earlier evidence, review or package file changed. Nothing is committed or staged.
  Subagent reviews did not run; the brief forbids them.

**Phase 1H (Codex AUTH-01: one bounded, pure-code, test-first correction phase) is done, 27 October 2026: both lows of
the independent review of phase 1G are fixed in code.** Full record: [phase1h.md](phase1h.md); handoff:
[handoff.md](handoff.md). **No database, CLI, Docker, network or runner command ran, and the replay was not opened.** Its
own independent review is **done**: review 2026-10-26T2305Z (above), whose findings 1, 2 and 4 phase 1I fixed.
- **The review it answers:** [`independent-review-2026-10-26T2000Z.md`](../../../evidence/MB-1/independent-review-2026-10-26T2000Z.md).
  It found phase 1G **not blocked for the next replay-only step**, with no critical, high or medium finding and two lows.
  Review bbe2fbba's four lows are closed in code. The review was not bound by hash, because its Bash was denied.
- **Finding 1 (the M2 stop):**
  - any complete M2 run whose banned check passed now carries `M2_UNKILLED`, whatever GoTrue answered (`ended`,
    unrecognised, none, a mismatch) and even when its output is withheld; the runner prints `STOP:` and records `m2Stopped`;
  - a passed M2 is never run again;
  - any recorded stop blocks `shared-apply`, an earlier pass included.
- **Finding 2 (the replay CLI's input):**
  - `start` and `migrate` rerun, synchronously and immediately before the child: the `SUPABASE_*` and `.env` refusals,
    `checkOwnedDir`, and the manifest's pins unchanged since the lock;
  - after `migrate`, the same checks run again as a `STOP:`, which `state.json` records as `stopRecorded`;
  - while `stopRecorded` is set, every command is refused until the coordinator removes it by hand.
- **Tests:**
  - RED first: two files failed to load, then with only the interface exports, 75 MB-1 tests, 64 pass, 11 fail, each for
    the intended reason;
  - then `rtk proxy node --test scripts/backend/*.test.mjs` gives **128 pass, 0 fail** (`# duration_ms 6379.522667`, after
    the mutation restores), and all nine `node --check` pass;
  - 15 guard mutations each fail a named test (one, M, first by message only).
- **Hashes:** `sha256sum` was allowed this time. The before and after code hashes are in phase1h.md §6, and the doc hashes
  in handoff.md. `verify-identity.mjs`, its test, the candidate `ac262f39…bdc3` and `config.toml` equal phase 1G's.
- **The live state is unchanged:** attempt 4's (RED met, reference `banned`, candidate `absent`, no GREEN, replay running
  with no lock). On that state the new rules change nothing but the two recheck lines `migrate` will print. **B1 and B2
  are open; box 3 is not met.**
- **Files:**
  - changed: `mb1-replay.mjs`, `mb1-replay-evidence.mjs`, `mb1-replay-order.mjs`, `mb1-replay.test.mjs` and
    `mb1-replay-evidence.test.mjs`;
  - new: `mb1-replay-order.test.mjs`;
  - docs: `phase1h.md`, `handoff.md`, this checkpoint and `phase2-plan.md`.

  No SQL, config, contract, evidence, review or package file changed. Nothing is committed. Subagent reviews did not run;
  the brief forbids them.

**Phase 1G (Codex AUTH-01: one pure-code, test-first phase) is done, 26 October 2026 (18:33:47Z–19:11:40Z, then the
records): review bbe2fbba's four lows are fixed in code, and its nonvacuous M2 is implemented.** Full record:
[phase1g.md](phase1g.md). **No database, CLI, Docker, network or runner command ran, and the replay was not opened.** Its
independent review is **done**: review 2026-10-26T2000Z (above), whose two lows phase 1H fixed.
- **The latest result, persisted:** attempt 4's disposable **RED is met and accepted** (`phase2-2-red-2`, reference ban
  answer **`banned`**). The candidate is **`absent`**, and there is **no GREEN**. The replay was left running with no lock,
  as attempt 4 recorded. This phase did not re-observe it. **B1 and B2 are open; box 3 is not met.**
- **Finding 3:** the verdict keeps each `not ok` detail line and requires exactly `HTTP 200, 1 row(s)` for every expected
  failure, in RED and in each mutation. Attempt 4's recorded output still meets RED under it.
- **Finding 2 and the nonvacuous M2:**
  - M2 classes are `live` and `banned`. M2 holds only when exactly `a banned account reads no profile` fails, with that
    detail, exit 1, the exact summary and every other check ok. With the ban clause removed, that row shows member C's
    session row still existed.
  - A complete run whose banned check passed is never a kill. The runner prints a `STOP:` line, records `m2Stopped`, and
    refuses every later `suite m2` on the replay (the fallback is M2b, reviewed separately).
  - Under `ended`, `mutate m2` is refused before any SQL, and no M2 verdict holds.
  - `mutate m2` is now allowed under `banned`.
- **Finding 4:** a `before` snapshot that exists is never retaken (refused before any SQL).
- **Finding 1:** `shared-apply` now:
  - stages a runner-owned copy, `<replay>/shared-apply/`, written once and pinned in the manifest. It holds the
    repository's `config.toml` (read once, bound, the same bytes written) and the replay's own seeds and 16 migrations;
  - guards everything, the staged copy included;
  - proves the CLI resolves the copy to 55321 and `127.0.0.1:55322`;
  - guards again immediately before the apply;
  - writes `sharedApplyAttempted` to `state.json` **before** `migration up --workdir <the copy>` starts;
  - after the CLI, reruns every guard as a `STOP`, then exits 0 only if a read-only 55321 snapshot equals the replay's
    `after` (P3 `statements_md5` included).

  An attempt blocks any further apply. The read-only `shared-snapshot after` stays allowed after any outcome.
- **Tests:**
  - RED first: 67 MB-1 tests, 51 pass, 16 fail, each for the intended reason.
  - Then `rtk proxy node --test scripts/backend/*.test.mjs` gives **120 pass, 0 fail** (`# duration_ms 9317.823584`; 112
    plus 8 net new). All eight `node --check` pass.
  - 23 guard mutations each fail a named test, two only on the message (phase1g.md §7.4).
- **Not done:**
  - **Hashes:** every hashing command was denied, so none were computed; the reviewer hashes the files in phase1g.md §8.
  - **Subagent reviews:** forbidden by the brief.
  - **The live CLI with the staged workdir:** not observed.
- **Files:**
  - changed: `mb1-replay.mjs`, `mb1-replay-target.mjs`, `mb1-replay-evidence.mjs` and both MB-1 test files;
  - new: `mb1-replay-order.mjs`, the plan-order rules moved unchanged so the runner stays under 800 lines;
  - docs: `phase1g.md`, this checkpoint, `phase2-plan.md`, and `phase1.md` R7.

  No evidence, review, SQL, config, contract or package file changed. Nothing is committed.

**Phase 2 attempt 4 (Codex AUTH-01: one disposable RED command) met RED on the disposable replay, 26 October 2026,
18:03:50Z–18:05:51Z.** Full record: [phase2.md](phase2.md), Attempt 4.
- **Review bbe2fbba** ([verbatim](../../../evidence/MB-1/review-bbe2fbba-final.md)), the independent review of phase 1F,
  found **no critical, high or medium finding, and four lows**. Codex accepted it for the one disposable RED only.
  - **All four lows are assigned to MB-1, pending.** Each is fixed test-first and independently reviewed **before** any
    `shared-apply` authorization:
    1. a pinned staging copy for `migration up`, a post-apply recheck with a 55321 snapshot equal to the replay's
       `after`, and a recorded apply attempt;
    2. M2 under `ended` fails closed, and the nonvacuous M2 strategy is the one under `banned`;
    3. exact enforcement of each expected failure's detail line;
    4. an immutable `before` snapshot.
  - **No code correction was made.** The review's proposed nonvacuous M2 is accepted as the plan for a later pure-code,
    test-first phase, and is not implemented. A zero-failure M2 under `ended` never counts.
- **Passed first:**
  - seven `node --check`; **112 pass, 0 fail**;
  - the five 1F files, `verify-identity.mjs`, its test, the candidate and `config.toml` hash equal to the review;
  - the four CLI hashes equal the values below, and both `package.json` files read `2.121.0`;
  - `state.json` was as attempt 3 left it, with no lock.
- **`suite red --evidence phase2-2-red-2`** (background job, runner exit 0) **met RED**:
  - all 27 checks ran in order;
  - exactly the five `profile_read` failures, each `HTTP 200, 1 row(s)` (checked by hand, per finding 3);
  - the exact summary line;
  - `GoTrue's answer after the ban: banned` (GoTrue's `user_banned`, as at 16:41Z);
  - `the red expectation is met` and the `banned` note.
  **`banned` is this replay's reference ban answer for good.**
- **Then:** the four CLI hashes are unchanged.
- **Left:**
  - The replay is running, with **no lock**.
  - `state.json` holds generation 1, candidate `absent`, and the `before` snapshot (unchanged). Its suites are attempt 3's
    (`ok false`, unchanged) and the new red (`ok true`, `ban "banned"`). The reference `ban` is `"banned"`, and
    `sharedApplied` is false.
  - **No GREEN.** 55321 got no SQL and no Supabase command.
  - No process check ran.

**Phase 1F (Codex AUTH-01: one bounded pure-code phase) is done, 26 October 2026 (17:04:38Z–17:22:55Z and the records
after): findings 1 and 2 of review 19eea0f3, and F6, are fixed test-first.** Full record: [phase1f.md](phase1f.md). **No
database, CLI, Docker, network or runner command ran.** Its independent review is **done**: review bbe2fbba (above).
- **Finding 1.** Before any child process, `shared-snapshot`, `shared-apply` and `shared-suite` refuse a repository
  `supabase/config.json` (by name; never read). They also need the repository's `config.toml` to:
  - name `fitlog_rebuild_20261017`;
  - set `[db] port` exactly 55322, where status's `DB_URL` must be;
  - be the config the replay was prepared from (its replay config hashes to the manifest's pin).

  The Codex probe case (config at 56422, status at 55322) now refuses with no command run.
- **Finding 2.** `shared-apply` reruns its file guards synchronously, immediately before `migration up`: `SUPABASE_*`,
  `.env`, the config binding, the candidate pin and the migration comparison. Afterwards it hashes the candidate again. A
  change is `# STOP:` with exit 1, and `sharedApplied` is set to true, so the apply is never repeated. **Residual:** the CLI
  reads the files after it starts, so a change in that window is not ruled out; only the candidate is rechecked after.
- **F6.** GoTrue's `HTTP 403 user_banned` is the class **`banned`**: neither `live` nor `ended`, because it does not show
  whether member C's session row still exists.
  - RED, GREEN, M1 and M3 keep their exact expectations under it, and it becomes the reference.
  - **M2 fails closed.** `mutate m2` is refused before any SQL, and an M2 verdict never holds, a vacuous zero-failure run
    included. So `shared-apply` stays blocked until a separately reviewed, nonvacuous M2 plan exists.
  - A `banNote` line states each class's limit.
  - Attempt 3's failed RED is **not** reclassified: `phase2-2-red.txt` and the replay's `state.json` (`ok false`, `ban
    null`) are untouched, and a new run is needed.
- **Tests.**
  - RED first: the evidence file failed to load, and 5 of 31 runner tests failed.
  - Then `rtk proxy node --test scripts/backend/*.test.mjs` gives **112 pass, 0 fail** (104 plus 8 new), and all seven
    `node --check` pass.
  - 15 guard mutations each fail a named test (phase1f.md §5). Two of them (M3 and M5e) only on the message, since another
    guard still refuses the same input.
- **Unchanged:**
  - the candidate SQL (its pin test passes), `verify-identity.mjs` (27 checks), every published contract, every evidence and
    review file;
  - the running replay project (not opened) and 55321 (not touched).

  No commit. `sha256sum` was denied, so the new file hashes are not recorded. The reviewer should take them. (Review
  bbe2fbba took them, and attempt 4 found the same values: [phase2.md](phase2.md) A4.1.)

**Phase 2 attempt 3 (Codex AUTH-01: disposable RED only) STOPPED at §2.2, 26 October 2026, 16:42:03Z.** Full record:
[phase2.md](phase2.md), Attempt 3.
- **Review 19eea0f3** ([verbatim](../../../evidence/MB-1/review-19eea0f3-final.md)), the independent security review of
  phase 1E, found three lows and **no critical, high or medium**. Codex accepted it for the disposable RED only:
  - **Findings 1 and 2** are **assigned to MB-1, pending**: each fixed test-first and independently reviewed **before**
    any `shared-apply` authorization. Finding 1 is the `[db] port` read from the repository's `config.toml`, with no
    `supabase/config.json` refusal. Finding 2 is the guards running only once, before `migrate`. Neither is fixed: no code
    change was authorized.
  - **Finding 3** is accepted: 0 or 2 withheld non-table lines, together with the exact manifest summary. That is the
    reviewer's inference from the code; no notice line was captured.
- **Passed first:**
  - seven `node --check`; **104 pass, 0 fail**;
  - the candidate and the seven MB-1 scripts hash equal to phase1e.md §8;
  - the four CLI hashes equal the values below, and both `package.json` files read `2.121.0`;
  - `state.json` was as attempt 2 left it, with no lock.
- **`migrations --evidence phase2-1-migrations-2`:** exit 0, **15 backticked rows**, `# 2 line(s) withheld` and
  `# migration list: 15 row(s), equal to the manifest's 15 migration(s), 15 of them applied`. Met.
- **`snapshot before --evidence phase2-2-before`:** exit 0, a read-only session, no P1 rule broken, P2 with two rows
  (`profile_read` without `member_active()`), and P3 with the 15 versions and no candidate. Met.
- **`suite red --evidence phase2-2-red`: STOP.** All 27 checks ran in order, with exactly the five `profile_read`
  failures and the exact summary. But GoTrue's answer after the ban was **`HTTP 403
  {"code":"user_banned","message":"User is banned"}`**: neither `HTTP 200` nor `session_not_found`. The verdict reads
  `the red expectation is NOT met` (runner exit 1). **No RED is claimed and there is no reference ban answer.** This is new
  low finding **F6** (phase2.md A3.3).
- **Then:** the four CLI hashes are unchanged.
- **Left:**
  - The replay project is running. Its directory has **no lock**.
  - `state.json` holds generation 1; candidate `absent`; the `before` snapshot; one red suite with `ok false`; and
    `ban null`.
  - 55321 got no SQL and no Supabase command, and its pin is unchanged.
  - `pgrep` was denied, so no process check was independently shown.

**Phase 1E (Codex AUTH-01: option (b), one bounded pure-code phase) is done, 26 October 2026: F5, F3 and F4 are fixed
test-first.** Full record: [phase1e.md](phase1e.md). **No replay command ran in it. Its independent security review is now
done (review 19eea0f3, above).**
- **F5:** the installed CLI 2.121.0, read as a file and never run, wraps every `migration list` cell in backticks. The
  pre-F5 row pattern required bare digits, so it could keep no row. The runner now keeps exactly 2.121.0's rows. Its
  `migrations` step **refuses** unless the list proves the manifest row by row: count, set, order, local/remote and time.
  An empty list refuses even at CLI exit 0.
- **F3:**
  - 55321 commands need the repository's `DB_URL` at exactly `127.0.0.1:55322`, as well as the API at `55321`.
  - Every command refuses while a `.env*` name is in a directory the CLI may load it from. That is the repository's and
    the replay's `supabase/` and root, as the installed code shows. Every parent directory is checked too, fail closed,
    because the Go sidecar can't be read.
  - Paths only: no file is read, changed or removed.
- **F4:** the candidate's bytes are pinned (`CANDIDATE_SHA256` `ac262f39…bdc3`), checked at `add-candidate` and first in
  `shared-apply`.
- **Tests:**
  - RED first: 34 pass, 8 fail.
  - Then `rtk proxy node --test scripts/backend/*.test.mjs` gives **104 pass, 0 fail** (95 before, plus 9 new); all
    seven `node --check` pass.
  - 9 guard mutations, each killed by a named test (phase1e.md §5).
- **Unknown, recorded:**
  - the 2 non-row withheld lines of attempt 2;
  - the Go sidecar's `.env` path;
  - whether a `.env*` sits in the home directory today;
  - whether the candidate's bytes equal what earlier reviewers read: no earlier hash exists.
- **Unchanged:**
  - the running replay project: not touched; one name-only Glob walked `/private/tmp`;
  - 55321, the candidate SQL, `verify-identity.mjs` and every review and evidence file.

**Phase 2 attempt 2 (Codex AUTH-01 renewed: phase2-plan §§0–2 on the disposable replay only) STOPPED after §1.4,
26 October 2026, 12:57:27Z.** Full record: [phase2.md](phase2.md), Attempt 2.
- **Passed:**
  - §0: the 10 MB-1 paths only; seven `node --check` passes; **95 pass, 0 fail**; nothing listens on 56420–56429 or
    8283; no `fitlog_mb1_replay` container; a fresh directory.
  - The four CLI hashes equal the values below, before the run and after it.
  - `prepare` exited 0, its `sql/preconditions.sql` line equal to `ca683771…d913ed769a`, with the shared container pinned
    at `true 2026-10-26T12:51:50.578854542Z`.
  - `verify-cli` exited 0: exactly `2.121.0` on every line, `stop --help` lists `--project-id`, and no `SUPABASE_*`
    variable is set.
  - `start` exited 0: 15 `Applying migration` lines with no candidate, answering at 56421.
- **The STOP.** `migrations` exited 0 but kept **no migration row** (17 lines withheld), against plan 1.4's "rows only".
  The plan's "any unexpected result stops the phase" applies. The likely cause is the runner's row pattern, which never
  saw real 2.121.0 rows: new low finding **F5** (phase2.md A2.2, A2.4). Not observed, because that would need raw CLI
  output or a source edit, and the brief forbids both.
- **Not run:** `snapshot before` and `suite red`. There is **no RED** and no ban answer.
- **Left running:** the replay project (eight `*_fitlog_mb1_replay_20261026` containers). Its directory has **no lock**,
  and its `state.json` is generation 1, candidate `absent`, with no snapshot or suite. 55321 got no SQL and no Supabase
  command; its pinned start time was unchanged at every runner check.
- **Background jobs are allowed;** `date`, `sysctl` and the 8283 `lsof` are too. Denied: `pgrep`, the running-only
  `docker ps`, `rg` and `git rev-parse`. So "no process left" is not shown independently (every runner job ended on its
  own with exit 0).

Attempt 1 stopped at §0, before `prepare`, because the Docker daemon was not reachable (phase2.md, Attempt 1).

Independent review b75d1e73 ([verbatim](../../../evidence/MB-1/review-b75d1e73-final.md)) accepted the disposable run:
no critical, high or medium finding, four low, 95/95 tests. Codex accepted the four lows for the disposable RED
checkpoint only (phase2.md §1):
- **F1:** done in the docs.
- **F2:** hashes recorded below; the live version and flag check waits for `verify-cli`.
- **F3, F4:** assigned to MB-1 before any 55321 authorization.

Earlier records: [phase1.md](phase1.md) (phase 1, with PHASE1B and 1C corrections), [phase1b.md](phase1b.md) (the first
remediation), [phase1c.md](phase1c.md) (the guarded replay preparation), [phase1d.md](phase1d.md) (review a102fb68
closed), [phase2-plan.md](phase2-plan.md) (the database phase), [phase1e.md](phase1e.md) (F5, F3 and F4 fixed, pure code),
[phase1f.md](phase1f.md) (review 19eea0f3 findings 1 and 2, and F6, fixed, pure code), [phase1g.md](phase1g.md) (review
bbe2fbba's four lows fixed and the nonvacuous M2 implemented, pure code), [phase1h.md](phase1h.md) (review
2026-10-26T2000Z's two lows fixed, pure code), [phase1i.md](phase1i.md) (review 2026-10-26T2305Z findings 1, 2 and 4 fixed,
finding 3 deferred, pure code).

- **Done in phase 1:**
  - an audit of every exposed identity and profile path (phase1.md §1);
  - the local integration suite `scripts/backend/verify-identity.mjs`;
  - **RED on 55321** with its first, 25-check version: 22 ok and 3 not ok, all from `profile_read`
    ([log](../../../evidence/MB-1/phase1-red.log), historical);
  - the candidate append-only migration `supabase/migrations/20261026040045_mb1_live_session_guard.sql`, one
    `alter policy`.
- **Done in PHASE1B (phase1b.md §2):** findings 4–8 of [security-phase1.md](../../../evidence/MB-1/security-phase1.md)
  fixed in the suite (27 checks); stronger read-only preconditions; blockers B1 and B2 recorded; no mutation of 55321,
  ever (phase1.md D7).
- **Done in phase 1C ([phase1c.md](phase1c.md) §2):** all six findings of review 39fe1fb5
  ([verbatim](../../../evidence/MB-1/review-39fe1fb5-final.md)): one guarded runner, `scripts/backend/mb1-replay.mjs`,
  for every replay command, on the literal `/tmp/fitlog-mb1-replay-YYYYMMDD` only; allowlisted and redacted output;
  mechanical verdicts; snapshot proofs; hash-pinned SQL with a read-only session default; the fixture-creation race
  closed; `phase2-plan.md` rewritten around the runner.
- **Done in phase 1D ([phase1d.md](phase1d.md) §2):** all five findings of review a102fb68
  ([verbatim](../../../evidence/MB-1/review-a102fb68-final.md), session `a102fb68-5d26-4e2b-8889-2c4741ac0831`), each
  with regression tests:
  1. children get only an allowlisted environment; every command refuses while a `SUPABASE_*` variable is set (names
     only); `stop` and teardown send `--project-id fitlog_mb1_replay_<date>`, which `verify-cli` requires; the CLI is
     the installed `node_modules/.bin/supabase`, run directly by node;
  2. inside the runner the identity suite gets the runner's signals, status runner and CLI and an exit that does
     nothing, so its cleanup is printed, recorded and saved (proved with the real `main()`);
  3. the reviewed preconditions block's sha256 (`ca683771…d913ed769a`) is a constant, checked at `prepare` and before
     every snapshot; the SQL deny-list also refuses SQL-text functions and reads quoted names;
  4. `shared-apply` needs its own `--confirm fitlog-mb1-shared-apply-<date>` and takes a fresh read-only snapshot, which
     must equal the replay's `before`, right before the apply;
  5. one command at a time under an exclusive lock that is never removed automatically; every child runs in its own
     process group, and a timeout, SIGINT or SIGTERM stops the whole group, **but only while the runner itself is
     alive** (review b75d1e73 finding 1). A runner killed outright, or sent SIGHUP, leaves its detached CLI group
     running unsupervised. So runner commands never get a tool timeout under 660 s (run them as background jobs) and
     never SIGKILL, and after any timeout or signal the lock stays while processes and replay containers are checked
     (phase2-plan rules).
- **Tests:** `rtk proxy node --test scripts/backend/*.test.mjs` gives **95 pass, 0 fail** at phase 1D, superseding phase
  1C's 83 (47 before phase 1C). `node --check` passes on all seven changed scripts. 12 guard mutations each failed a named
  test (phase1d.md §4); phase 1C's 16 still stand.
- **Done in phase 2 attempt 1 ([phase2.md](phase2.md)), 26 October 2026:**
  - §0.1–0.3: git status shows the 10 MB-1 paths; seven `node --check` passes; **95 pass, 0 fail**; nothing listens on
    56420–56429; `/tmp/fitlog-mb1-replay-20261026` does not exist.
  - Then the STOP above.
  - The review copied verbatim (`git diff --no-index`: header and final newline only); the secret scan prints nothing.
- **CLI files, sha256 (F2; names and hashes only, taken before any CLI run, nothing installed since):**

  | sha256 | File |
  |---|---|
  | `21d25b4bfb1870db0aaf0963c028b10d0b0b431485f119abd704c1396c7991e6` | `node_modules/.bin/supabase` |
  | `21d25b4bfb1870db0aaf0963c028b10d0b0b431485f119abd704c1396c7991e6` | `node_modules/supabase/dist/supabase.js` |
  | `6e8be5fb2802ccdd247d3b47823c31ed8d7e792255048594ba32ee79a55208dc` | `node_modules/@supabase/cli-darwin-arm64/bin/supabase` |
  | `fd5f2364521870ad9bb485ce9796e16d9b75fad21b306ad4955a382ea7533813` | `node_modules/@supabase/cli-darwin-arm64/bin/supabase-go` |

  Both `package.json` files read `2.121.0`, as files only. Attempt 2 re-hashed all four before `verify-cli` and at its
  STOP: both equal. The next run re-hashes them after `suite red`; any difference: STOP.
- **Done in phase 2 attempt 2 (phase2.md, Attempt 2), 26 October 2026:**
  - §0, then `prepare`, `verify-cli`, `start` and `migrations`, each exit 0 (above).
  - The runner wrote four evidence files: `phase2-1-prepare.txt`, `phase2-1-cli.txt`, `phase2-1-start.txt` and
    `phase2-1-migrations.txt`.
  - The §8 secret scan, run with the Grep tool, printed nothing.
- **Not done:**
  - The SQL is **not applied and not green**. The SQL itself is unchanged.
  - The 27-check suite has **not run against any stack**; only its pure unit tests have.
  - No snapshot, fixture, mutation, diff or lint has run. The replay project is up with the 15 committed migrations and
    the seeds only. 55321 got no SQL and no Supabase command, only the runner's read-only `docker inspect` of its start
    time.
  - Observed live: CLI 2.121.0, and `stop --help` listing `--project-id` and `--no-backup`. **Not observed:** any
    `stop`. The `SUPABASE_*` override scenario is still the reviewer's inference (phase1d.md §5).
  - Nothing is committed. No status, ledger, 003 or tracker edit.
  - Box 3 is not claimed.

## MB-1 completion blockers (open; a GREEN run does not close them)

- **B1, the G16.api linked-policy prerequisite.** `role_read`, `register_read`, `plans_read` and `gym_read` still serve a
  revoked or disabled session's token. Codex coordinates a narrow cross-lane fix before MB-1 Done (G16.api needs MB-1,
  so waiting for G16.api would deadlock).
- **B2, `401 UNAUTHENTICATED` at the published API.** No contract relaxation. `200 []` from direct reads is defence in
  depth only. It needs MB-1's contract work and a new contract version.

## Next step (resume here): after SF-7c ([sf7c.md](sf7c.md) §4, §7)

1. **A fresh, independent review of SF-7c**, before any other runner edit.
   - Re-hash the files in sf7c.md §5.
   - Re-run the 304 pure tests once, on Node v22.23.1.
   - Decide whether `bindingUnchanged` should also re-inspect the proven ID's start time (sf7c.md §7, the same-ID restart
     window before `migration up`).
   - Mutations (SF-7b's eight, R-exit first, and SF-7c's four) only if Codex explicitly authorizes a scratch tree. The
     denied `mkdir`/`cp` are never retried or replaced.
2. **Then, only under its own read-only authorization:** the live M1 read (review 0935Z, R0–R17). It is not accepted as
   closing M1 by itself. SQL cluster equivalence needs its own decision.
3. **Before any future `backend:test`:** the single, separate harness-correction phase for QA-9's phase 3N readiness gates
   G1–G7. MB-1 owns it, and Codex explicitly assigns its S2 paths. Not authorized now.
4. **Then:** SF-1, SF-2 to SF-6, finding 5 and the remaining lows, each pure code, test-first and reviewed. §5–§7 are not
   authorized. B1 and B2 stay open. **Box 3 is not met.**

## Earlier resume point (after SF-7b; its step 1 done by review 0935Z, and SF-7c followed it)

1. **A fresh, independent review of SF-7b**, before any other runner edit.
   - Re-hash the files in sf7b.md §5.
   - Re-run the 301 tests.
   - If scratch mutations are authorized and possible, run sf7b.md §4's planned set. R-exit first: it must be killed by
     behaviour.
2. **Then, only under its own read-only authorization:**
   - one binding inspect with the final arguments (`--type container`);
   - the Docker context's endpoint;
   - `lsof -nP -iTCP:55321,55322 -sTCP:LISTEN`.

   That settles I1. A reviewed, pure listener rule would then close M1.
3. **Then:** SF-1, SF-2 to SF-6 (SF-2 writes L4's manual read-only incident path), finding 5 and the remaining lows, each
   pure code, test-first and reviewed. §5–§7 are not authorized. B1 and B2 stay open. **Box 3 is not met.**

## Earlier resume point (after SF-7; its step 1 done by review 0905Z, and SF-7b followed it)

1. **A fresh, independent review of SF-7**, before any other runner edit.
   - Re-hash the files in sf7.md §6.
   - Re-run the 296 tests and the 17 patches in `docs/evidence/MB-1/sf7-mutations/`.
   - Check the residuals in sf7.md §7: the unseen Docker shape, what the binding does not prove on macOS, and the `prepare` pin.
2. **The first live read of Docker's shape**, under its own read-only authorization only: one `docker inspect --format
   <BINDING_FORMAT>` of the shared stack's database and Kong containers. Any widening it calls for (for example a `0.0.0.0`
   plus `::` pair) is a reviewed, test-first change, and then the replay mirror may be wired, with `stop` and `teardown` kept
   working.
3. **Then, in order, each pure code, test-first, and each reviewed:** SF-1, SF-2 to SF-6 (finding 5 with SF-3), and the
   remaining lows.
4. **§5, §6 (55321) and §7 are not authorized.** §6 also needs step 2, every replay proof and its own authorization. The
   single-writer condition stands until SF-3 is reviewed.
5. **Records:** before any commit, rerun §8 and compare it with phase2-plan §8's exact inventory. SF-7 left it unchanged, and
   its patches add no hit. B1 and B2 stay open. **Box 3 is not met.**

## Earlier resume point (after SF-0; its step 1 done by review 0605Z, its SF-7 item done by SF-7)

1. **A fresh, independent review of SF-0**, before any other runner edit.
   - Re-hash the files in sf0.md §6.
   - Re-run the 282 and the 11 patches from `docs/evidence/MB-1/sf0-mutations/` (`git apply`, the ten
     `mb1-replay*.test.mjs` files, `git apply -R`, re-hash).
   - If node scripts may run, run `node docs/evidence/MB-1/sf0/sf0-split.mjs verify`. It rebuilds both originals byte for
     byte and checks `fd76c04b…3334` and `9c18e423…5021`.
2. **Then, in order, each pure code, test-first, and each reviewed:**
   - **SF-7 first** (0405Z finding 1, the medium; with findings 4 and 5);
   - SF-1 (a durable state write, and suites as one-shot);
   - SF-2 to SF-6;
   - the remaining lows (sf0.md §8).
3. **§5, §6 (55321) and §7 are not authorized.**
   - §6 also needs SF-7, SF-7's first live read (its own read-only authorization), every replay proof and its own
     authorization.
   - The single-writer condition stands until SF-3 is reviewed.
4. **Records:** before any commit, rerun §8 and compare with phase2-plan §8's exact inventory. SF-0 left it unchanged: its new
   files add no hit.
5. The replay keeps running until a stop is authorized. Every suite needs the 90 s gate. B1 and B2 stay open. **Box 3 is not
   met.**

## Earlier resume point (phase 2 attempt 8; its item 1's SF-0 step done by SF-0, the rest queued in sf0.md §8)

1. **The MB-1 split-first design and refactor phase** (SF-0 to SF-6, review 0205Z's lows 1 and 2, and review 0305Z's low
   1: refuse a second `suite m2` once any M2 suite entry exists, with a test), pure code, test-first, then a fresh
   independent review, before §5 and before any runner edit.
2. **§5** (stop, a fresh start with all 16, `diff`, `lint`, images) is **not authorized**. It needs its own authorization
   after item 1 and its review.
3. **§6 (55321) and §7 are not authorized.** On this replay red, m1, m2 (no stop) and m3 have passed; `shared-apply`
   still lacks a generation 2 GREEN, a clean generation 2 `diff` and `lint`, matching images and the `55321-before`
   snapshot (read from `sharedApplyMissing`, not run), and its own authorization.
4. **Records:** before any commit, rerun §8 and compare with phase2-plan §8's exact inventory (unchanged by attempt 8).
   A report saved into `docs/evidence/MB-1` that spells the fixture literal needs its own exact row first.
5. Every suite needs the 90 s gate; the next one must start at least 90 s after `1793070472840`. The replay keeps running
   until a stop is authorized. B1 and B2 stay open. **Box 3 is not met.**

## Earlier resume point (phase 2 attempt 7; its item 1 done by attempt 8)

1. **M2 under `banned`**, with its own authorization that states the M2 rule in its own text (review 0205Z's "M2 block"):
   `mutate m2` (`m2.sql` `295f7ad8…c740`), `snapshot m2` (only `P1.fn_definition_md5`, a value other than `e446cfc1…`
   and M3's `4ad75fcd…`), the 90 s gate, `suite m2` (exactly `a banned account reads no profile`, `HTTP 200, 1 row(s)`),
   then **read `state.json` at once** (review 0205Z low 1's interim control: the last entry `m2`, generation 1, `banned`,
   and either `ok true` with no `m2Stopped`, or `m2Stopped true` with the STOP line), `restore-member-active`, `snapshot
   restored`, the 90 s gate, `suite green`. On a STOP: only the restore and `snapshot restored`, then stop; M2b follows.
   No runner edit is needed. The runner allows `mutate m2` now (read, not run); `m1` and `m3` are used up.
2. **The MB-1 split-first design and refactor phase** (review 0205Z's SF-0 to SF-6, including its lows 1 and 2), pure
   code, test-first, then a fresh independent review, before §5 and before any runner edit.
3. **§5, §6 (55321) and §7 are not authorized.** §6 needs every replay proof, a passing nonvacuous M2 with no stop, and
   its own authorization.
4. **Records:** before any commit, rerun §8 and compare with phase2-plan §8's exact inventory (unchanged by attempt 7).
   A report saved into `docs/evidence/MB-1` that spells the fixture literal needs its own exact row first.
5. Every suite needs the 90 s gate; the next one must start at least 90 s after `1793066864185`. The replay keeps running
   until a stop is authorized. B1 and B2 stay open. **Box 3 is not met.**

## Earlier resume point (phase 2 attempt 6; its item 1 done by attempt 7)

1. **M3 on the replay**, with its own authorization: `mutate m3`, `snapshot m3` (`changes from after:
   P1.fn_definition_md5`), the 90 s gate, `suite m3` (exactly `a deletion-pending account reads no profile`),
   `restore-member-active`, `snapshot restored` (`fn_definition_md5` back to `e446cfc1…`). No runner edit is needed.
2. **M2 under `banned`**, with its own authorization that states the M2 rule: the exact kill, or a `STOP:` with
   `m2Stopped` (M2b, and `shared-apply` blocked on this replay for good).
3. **The MB-1 split-first design and refactor phase** for review 2026-10-27T0005Z's four lows (item 1 of the earlier
   resume point below), before §5 if possible.
4. **§5, §6 (55321) and §7 are not authorized.** §6 needs every replay proof, a passing nonvacuous M2 with no stop, and
   its own authorization.
5. **Records:** before any commit, rerun §8 and compare with phase2-plan §8's exact inventory. A report saved into
   `docs/evidence/MB-1` that spells the fixture literal needs its own exact row first.
6. Every suite needs the 90 s gate. The replay keeps running until a stop is authorized. B1 and B2 stay open. **Box 3 is
   not met.**

## Earlier resume point (phase 2 attempt 5; its item 2's M1 done by attempt 6, its item 5 by attempt 6's records)

1. **The MB-1 design and refactor phase for review 2026-10-27T0005Z's four lows** (pure code, test-first, then a fresh
   independent review). First split `mb1-replay.mjs` (798/800) and the test harness, with no new runner edit before the
   split. Then:
   - finding 3's `lstat` `ino`/`ctimeNs` detection, with post-CLI rechecks for `start`, `migrations` and `stop`;
   - low 1: keep the lock and print a STOP naming both failures when a `stopRecorded` state write fails; print
     `renderRun` after `stopAfter`;
   - low 2: a written procedure for clearing `stopRecorded`. Clearing needs a fresh independent review plus a
     separately authorized read-only 55321 check, then removal by hand. It never happens in a runner phase.
2. **M1 and M3 on the replay**, each with its own authorization. They need no runner edit. **M2 under `banned`** also
   needs its own authorization.
3. **§5 `diff` and `lint`:** single-writer condition; ideally after the finding 3 design.
4. **§6 (55321)** is **not authorized**. It needs every replay proof, a passing nonvacuous M2 with no stop, and its own
   authorization.
5. **Records:** decide the §8 exclusion for `reviewer-final-2026-10-27T0005Z.md`; bring phase2-plan's status row and §3
   up to date.
6. The replay keeps running until a stop is authorized. B1 and B2 stay open. **Box 3 is not met.**

## Earlier resume point (phase 1I; its item 1 done by review 2026-10-27T0005Z, its item 2 by phase 2 attempt 5)

1. **A fresh, independent review of the phase 1I diff, before any runner or database step.** Hash the files in
   phase1i.md §6 first and compare. Reproduce the 11 mutations from
   [`docs/evidence/MB-1/phase1i-mutations/`](../../../evidence/MB-1/phase1i-mutations/) (`git apply`, run the three MB-1
   test files, compare with phase1i.md §5.4, `git apply -R`, re-hash). It covers:
   - finding 1's fail-closed stop: partial, out of order, any exit; a setup failure with no check is no stop; mutation B2;
   - finding 2's exit-1 and timeout cases, and mutation P;
   - finding 4's pre-spawn rechecks (`migrations`, `diff`, `lint`, `stop`, `teardown`), the post-`diff`/`lint` STOP, the
     halt's op table, and mutations Q to X;
   - the open issues in phase1i.md §8.

   **Every later runner or database phase needs this fresh independent safety review and an explicit coordinator scope.**
2. **§3 on the running replay** (`add-candidate`, `migrate`, `snapshot after`, `suite green`) is unchanged by phase 1I and
   needs its own authorization; review 2026-10-26T2305Z found phase 1H not blocked for it. **The single-writer condition
   applies:** nothing else writes to the replay or to the worktree's `supabase/` while `migrate` runs.
3. **Before any `mutate m2` or `suite m2`:** item 1 accepted (finding 1). **Before §5's `diff` and `lint`:** item 1
   accepted (finding 4), and ideally finding 3's separate design phase (inode and ctime detection), reviewed.
4. **§6 (55321)** needs, in order: item 1 accepted; a passing nonvacuous M2 with no stop; every other replay proof; and its
   own authorization. It is **not authorized**.
5. The replay keeps running until a stop is authorized. B1 and B2 stay open. Box 3 is not met.

## Earlier resume point (phase 1H; its item 1 done by review 2026-10-26T2305Z, whose findings 1, 2 and 4 phase 1I fixed)

1. **A fresh, independent review of the phase 1H diff, before any runner or database step.** Hash the files in
   phase1h.md §6 first and compare. It covers:
   - finding 1's stop rule (every answer class, withheld output);
   - the "already passed" refusal;
   - the stop blocking `shared-apply` after a pass;
   - finding 2's pre-spawn recheck, its pin comparison, the after-`migrate` STOP and the `stopRecorded` halt;
   - the open issues in phase1h.md §7. Among them: an incomplete run whose banned check passed is still no stop; no
     recheck after `start`; `diff` reads its `shadow_port` after the dispatch checks only; the halt also blocks the
     read-only `shared-snapshot before`.

   **Every later runner or database phase needs this fresh independent safety review and an explicit coordinator scope.**
2. **If accepted, the replay §3 steps** on the same running replay, each with its own authorization: `add-candidate`,
   `migrate` (it prints both recheck lines; any STOP halts the replay until reviewed), `snapshot after` and `suite green`
   (GREEN must answer `banned`). Then M1 and M3, then M2 under `banned` (the exact kill, or a `STOP` that sends M2 to
   M2b). Then the restores and §5.
3. **§6 (55321)** needs, in order: item 1 accepted; a passing nonvacuous M2 with no stop; every other replay proof; and
   its own authorization. It is **not authorized**.
4. The replay keeps running until a stop is authorized. B1 and B2 stay open. Box 3 is not met.

## Earlier resume point (phase 1G; its item 1 done by review 2026-10-26T2000Z, whose lows phase 1H fixed)

1. **A fresh, independent review of the phase 1G diff, before any runner or database step.** Hash the files in
   phase1g.md §8 first. It covers:
   - finding 3's exact detail;
   - finding 2's classes, the `M2_UNKILLED` stop and its `m2Stopped` record;
   - finding 4;
   - finding 1: the staging copy, its ownership and `.env` scope, the guard order, the attempt record, the post-apply
     `STOP` path and the `after` snapshot;
   - the open issues in phase1g.md §9.

   **Every later runner or database phase needs this fresh independent safety review and an explicit coordinator scope.**
2. **If accepted, the replay steps that do not need 55321,** each with its own authorization on the same running replay:
   - §3 (`add-candidate`, `migrate`, `snapshot after`, `suite green`: GREEN must answer `banned`);
   - then M1 and M3;
   - then M2 under `banned` (the exact kill, or a `STOP` that sends M2 to M2b, separately reviewed);
   - then the restores and §5.
3. **§6 (55321)** needs, in order: item 1 accepted; a passing nonvacuous M2; every other replay proof; and its own
   authorization. It is **not authorized**.
4. The replay keeps running until a stop is authorized. B1 and B2 stay open. Box 3 is not met.

## Earlier resume point (phase 2 attempt 4; its item 1 done in code by phase 1G, review owed)

1. **One pure-code, test-first phase for review bbe2fbba's four lows and the nonvacuous M2**, then a fresh, independent
   review, before any `mutate m2` or `shared-apply`:
   - finding 3: keep the detail lines, and require `HTTP 200, 1 row(s)` for every expected `profile_read` failure;
   - finding 2: M2 refused under `ended`. Under `banned`, M2 expects exactly `a banned account reads no profile`, with
     `mutate m2` allowed; 27 ok fails closed and stops (the fallback is M2b, reviewed separately);
   - finding 4: the `before` snapshot immutable;
   - finding 1: the pinned staging copy, the post-apply guards and the 55321 `after` snapshot inside `shared-apply`, and a
     recorded apply attempt.
2. **§3 and M1/M3 on the replay** (`add-candidate`, `migrate`, `snapshot after`, `suite green`; then M1 and M3) do not
   depend on the M2 change. Each needs its own authorization. GREEN must answer `banned`, the reference.
3. **§6 (55321)** needs, in order: item 1 done and reviewed; a passing nonvacuous M2; every other replay proof; and its
   own authorization. It is **not authorized**.
4. The replay keeps running until a stop is authorized. B1 and B2 stay open. Box 3 is not met.

## Earlier resume point (phase 1F; done by review bbe2fbba and attempt 4)

1. **A fresh, independent review of the phase 1F diff, before any database step.** It covers:
   - finding 1's config binding and its order before any child process;
   - finding 2's recheck before `migration up`, the re-hash after it, and the `sharedApplied` choice;
   - F6's `banned` class and M2 failing closed;
   - the residuals in phase1f.md §7.

   Hash the five changed files first.
2. **If accepted, for the disposable replay only:** on the same, still running `/tmp/fitlog-mb1-replay-20261026`, never
   prepared again, `MB1 suite red --evidence phase2-2-red-2` as a background job, never killed. Then hash the four CLI files
   again.
   - Expect the five `profile_read` failures and `GoTrue's answer after the ban: banned` (or a recognised `live` or
     `ended`).
   - Any other answer, refusal or `STOP:` line stops the phase.
3. **M2 needs its own reviewed, nonvacuous plan under `banned`:** (a) direct, read-only session evidence, or (b) an isolating
   mutation that removes the session clause instead (phase1f.md §9 item 3). Until then M2 is refused and `shared-apply`
   stays blocked.
4. **§6 (55321)** needs, in order: item 1 accepted; a passing M2 (item 3); every other replay proof; and its own
   authorization.
5. The replay keeps running until a stop is authorized. B1 and B2 stay open. Box 3 is not met.

## Earlier resume point (phase 2 attempt 3; F6 and findings 1 and 2 done in phase 1F, review owed)

1. **Coordinator: decide how to treat GoTrue's `user_banned` answer (F6).** Any choice changes `classifyBan` and, through
   it, M2's expectation, phase1.md R7 and plan 2.2. So it needs a test-first code change and an independent review, in its
   own authorized phase. It must also settle whether the ban ended member C's session, which `user_banned` alone does not
   say. Nothing is guessed here.
2. **Then, if authorized:** on the same, still running `/tmp/fitlog-mb1-replay-20261026`, never prepared again,
   `MB1 suite red --evidence phase2-2-red-2` as a background job, never killed, followed by the four CLI hashes. The runner
   allows this (candidate `absent`, `before` snapshot present, spacing long past). The `before` snapshot still stands.
   Any refusal, `STOP:` line or unexpected result stops the phase. `add-candidate` refuses until a red suite passes.
3. **Before any §6 (55321) authorization:** findings 1 and 2 of review 19eea0f3 fixed test-first and independently
   reviewed.
4. The replay project stays up until a stop is authorized (`stop --confirm fitlog-mb1-replay-20261026`, or §7). If
   55321's database container restarts first, the pin refuses every command on this directory: record it, and do not
   work around it.
5. B1 and B2 stay open. Box 3 is not met.

## Earlier resume point (phase 1E; done by review 19eea0f3 and attempt 3)

1. **A fresh, independent security review of the phase 1E diff, before any replay resume or §6 authorization.** It covers
   F5's grammar and verdict, F3's scope and exact-port checks, and F4's pin and its provenance.
2. **If accepted:** on the same, still running `/tmp/fitlog-mb1-replay-20261026`, never prepared again:
   - `MB1 migrations --evidence phase2-1-migrations-2`: 15 backticked rows and `# migration list: 15 row(s), equal to
     the manifest's 15 migration(s), 15 of them applied`;
   - then §2 (`snapshot before`, `suite red`, the four CLI hashes), each as a background job, never killed.

   A refusal (a `.env*` named in a parent directory included) or a `STOP:` line stops the phase: record it, and change
   nothing.
3. Items 2–4 below still apply. Codex chose option (b) (item 1 below), and phase 1E carried out its fix half.

## Earlier resume point (phase 2 attempt 2; superseded by the step above)

1. **Coordinator: decide on the 1.4 result. Either:**
   - **(a)** accept the missing rows as an evidence gap only (plan 1.3: P3 is the proof of the 15), and authorize
     resuming at §2.1 on the **same, still running** `/tmp/fitlog-mb1-replay-20261026`:
     - `snapshot before --evidence phase2-2-before`;
     - then `suite red --evidence phase2-2-red`: exactly the five `profile_read` failures, `the red expectation is met`,
       and a ban answer of `HTTP 200` or `HTTP 403` with `session_not_found`;
     - then the four CLI hashes again.

     Run each as a background job, never killed. Stop at RED or at the first refusal, `STOP:` line or unexpected result.
     The directory is never prepared again, and it keeps its `20261026` name on a later day.
   - **(b)** or first fix F5 test-first, with a row fixture from real 2.121.0 output, and have it re-reviewed. Then run
     `migrations` again as `phase2-1-migrations-2` (the runner never overwrites), then §2.
2. **The replay project stays up until then.** Stopping it needs its own authorization (`stop --confirm
   fitlog-mb1-replay-20261026`, or §7). If 55321's database container restarts first, the runner's pin refuses every
   command on this directory. Record that, and do not work around it.
3. **Permissions that would help:** a read-only process check (`pgrep -fl` for `mb1-replay.mjs` and the CLI), the
   running-only container list, and the §8 `rg` scan.
4. The rest of [phase2-plan.md](phase2-plan.md) needs further authorizations:
   - **§§3–5 (disposable replay):** the candidate, the after snapshot and GREEN (27 ok); M1–M3 with snapshot proofs and
     proved restores; stop and a fresh start with all 16, then diff, lint and images.
   - **§6 (55321):** first **F3 and F4 fixed test-first** (done in phase 1E) **and re-reviewed** (owed). Then the before snapshot;
     `shared-apply` with its own token (its fresh snapshot must still equal the replay's `before`); the after snapshot,
     the suite and `pnpm backend:test`.
   - **§7:** teardown (`retain`, then `teardown --confirm`), with its own authorization.

## Then (not started)

- B1 and B2 (above).
- The other MB-1 boxes:
  - box 1: email signup, verify and reset; Google and Apple adapters; unverified email; a reused reset token; no
    automatic merge;
  - box 2: notices and resumable onboarding;
  - box 4: AC16 fixtures and the published contract.
- Carry phase1.md §6 R3 (the account-state read) into the contract work, with a new contract version.
- Requests outside MB-1's writes (phase1d.md §5): an allowlisted-environment, process-group executor in the shared
  `local-stack.mjs`; the `verify*.mjs` status-parsing fixes; `verify-identity.mjs` in `backend:test`; 003 §3.7.


## F4/G5 command-failure bounded acceptance — 2026-11-01T12:50:36.364685+00:00

Fresh independent local Claude review PASS, 14/14 synthetic tests, no critical/high findings or tool errors/denials. Codex independently checked phase-before diffs and accepted only this prerequisite. See [acceptance](../../../evidence/MB-1/harness-command-failure-accepted-2026-11-01.md). MB-1/QA-9 owns new environment.mjs/preview-account.mjs G5 residuals and projection diagnostics; other harness/target/whole-goal gates remain open. No further source/wording/test loop for accepted files. No integration/Done/status/ledger/DB/external action.


## Status-consumer prerequisite independently accepted — 2026-11-01T13:50:02.713074+00:00

Complete e16435ef implementer final collected/stopped, four scoped paths, zero errors/denials. Codex exact before-source comparison passes. Fresh independent local Claude3eb4a345 COMPLETE PASS, 4/4 pure source-reading tests, no C/H/M findings; audit {'Read': 11, 'Grep': 5, 'Bash': 1}, zero errors/denials. Same-session local print execution completed after background daemon failed before any call, no bypass. Acceptance: docs/evidence/MB-1/harness-status-consumers-accepted-2026-11-01.md. Seven prior accepted source hashes unchanged, seven current reviewed hashes unchanged. No duplicate accepted-test/source review needed. Preview auth-response diagnostics/login.ok and projection diagnostics retain MB1/QA9G5 owners; stale comments nonblocking MB1. WholeMB1 stays0/4, other harness/target/runtime gates open. No merge/newDone/status/GOALS/ledger/DB/push/deploy/external action. User files/environments preserved. No owner action. Main35c84e3/DS3fd79c12 and fiveDone confirmed, OW1/OW2/QA1/AR1 done; no repeat implementation. Integration/ready-wave/status chats completed/inactive; native workers reconciled, no overlap. Build/sync/diff checks pass114goals/230dependencies/94rows; corrected unsupported status sync call recorded. Supabase skill/official CLI reference consulted; no CLI convention change, markdown changelog renderer unsupported.


## Preview auth-response bounded acceptance — 2026-11-01T14:50:59.793027+00:00

Codex acting under explicit owner delegation AUTH-01 accepts the existing preview-auth response safety prerequisite ONLY. Implementer596e6e6d complete final collected; Read10/Grep3/Write3/Edit13, exactlyfive assignedpaths, no errors/denials. Fresh independent authenticated localClaude fb34c471-1f86-4b66-874d-da9f9e6d421f COMPLETE PASS-bounded collected; Read12/Grep6/Bash2, no errors/denials. Exactly two separately authorized synthetic test commands ONCE each: preview-response9/9 and status-consumers4/4,13PASS0FAIL. Full final, implementer/reviewer audits and raw TAP are adjacent harness-preview-response-* records. No live consumer/auth/CLI/DB/network/account execution. Historical denied sequences parked without alternate retry.

Codex independently compared phase-before consumer bytes: only helper import/create/signin substitutions; all loopback/fetch/onboarding/private-file details preserved. Nine source SHA256 hashes rechecked unchanged after review; five prior accepted status-helper/environment hashes retained. Fixed closed-message fresh errors catch JSON failures unread and non-ok sign-in refuses before body parsing/onboarding. Both pure tests independently inspected for safe scope. No RED/mutation/real-auth/release/device proof. Implementer UNRUN statements are historical, superseded only for these two commands. Source tests provide bounded evidence, no general static-analysis guarantee.

Remaining low findings assigned, no optional polish loop: L1 helper purity future regression hardening MB1/QA9; L2 stricter whitespace/own-property validation MB1 (current nonempty-string contract satisfied; do not rely on the review's general claim that JSON can never expose inherited properties); L3 fetch rejection diagnostics/timeouts/cleanup MB1/QA9 G4/F3; L4 existing credential-file/symlink/mode hardening MB1; L5 historical UNRUN/hash evidence covered by this acceptance. These do not block the scoped result. Projection diagnostics and G1-G4/G6/G7/executor/target binding/live isolation/wholeMB1 remain open0/4. No wholeG5/goal/ledger acceptance, no merge/newDone/status/GOALS/DB/push/deploy/external action. Main35c84e3/fiveDone unchanged. Do not repeat accepted source/wording/test review.

Evidence: docs/evidence/MB-1/harness-preview-response-accepted-2026-11-01.md.


## Projection diagnostic prerequisite independently accepted — 2026-11-02T03:49:41.619636+00:00

Codex acting under owner delegation AUTH-01 accepts ONLY the MB1/QA9G5 projection diagnostic-safety prerequisite. Implementer351f8cee COMPLETE, exactlyfourpaths, Read9/Grep9/Write3/Edit4,zeroerrors/denials. Independent reviewerf2879568-0b5a-4303-898c-aafe3e7461c6 COMPLETE PASS: Read7/Grep3/Bash1,zeroerrors/denials,C0/H0/M0/L6. Exact authorized pure test ONCE passed11/11. Fullfinal/audit/rawTAP/fourhashes/consumerdiff durably collected in docs/evidence/MB-1/harness-projection-*. Codex independently verified exact consumer bytes and unchanged four SHA256s. No live consumer/DB/CLI/network executed. No RED/mutation/device/backend proof or wholeG5/goal acceptance.

L1hardcoded target/L2false-positive assert.throws remain MB1/QA9; L3fixed opaque diagnostic is accepted scoped design; L4positive assertion output remains wholeG5; L5consumer fixture coverage resolved for this phase by exact before-source diff; L6historical UNRUN/hash record is superseded only for the one executed pure test and coordinator hash check. No optional polish or accepted test rerun. Other harness/runtime/MB1 boxes open0/4. No integration/newDone/status/GOALS/ledger/push/deploy/external action; main35c84e3/fiveDone unchanged. No owner action, project incomplete.

Evidence: docs/evidence/MB-1/harness-projection-accepted-2026-11-02.md
