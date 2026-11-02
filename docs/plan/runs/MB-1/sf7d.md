# MB-1 SF-7d: review 1105Z's two lows on SF-7c, L1 and L2 (pure code, fixtures only, no live run)

Attempt 1 · branch `codex/mb1-identity` · base local `main` `2a95726` · uncommitted working tree · 27 October 2026. No clock
times are recorded: `rtk proxy date` was denied (§8).
Codex AUTH-01 (owner delegation), one bounded phase after SF-7c's independent review
[`final-2026-10-27T1105Z-collected.md`](../../../evidence/MB-1/final-2026-10-27T1105Z-collected.md). That review found C0 H0,
M1 carried, two new lows and three informational notes, and ran 304 pure tests on Node v22.23.1. The brief directs both
lows to be fixed. The carried M1 stays open. **Nothing is Done and no Done-when box is met** (§7).

## 1. Scope, and what did not run

- **Done, test-first, fixtures only:**
  - **L1:** right after the second binding read, the proven database ID's start time is inspected again. It is the last
    child before the final guards, the attempt record and `migration up`'s spawn;
  - **L2:** after `migration up`, the proven ID's start time is inspected right after the binding recheck, before the after
    snapshot. It is inspected once more after the snapshot, before the verified state is returned to be written.
- **Read first:** the RTK file, `EXECUTION.md`, MB-1 in `GOALS.md`, the checkpoint and handoff,
  `final-2026-10-27T1005Z-collected.md` (SF-7c's own final) and `final-2026-10-27T1105Z-collected.md` (its review).
- **Not run, by the brief:**
  - the runner, the replay directory, Docker, the Supabase CLI, any database, SQL, network or provider call;
  - any shared apply or live read, including the live M1 read (R0–R17);
  - `backend:test`, subagents, launchers, commits, staging, rebases and pushes;
  - edits outside `mb1-replay-{live,shared}.mjs`, the relevant pure tests and the MB-1 records. The entry, the harness,
    status, GOALS and ACCEPTANCE are untouched.
- **Mutations: none ran (§4).** No scratch tree is authorized, and the denied `mkdir`/`cp` were not retried.
- **Policy, restated by the coordinator:**
  - PRD §16.1 / ADR003: gym staff never read or write private health data, whatever the consent.
  - The override stays until QA-2 is integrated and launching-checkout is corrected.
  - SF-7d opens no data path: it adds read-only `docker inspect` calls and STOP paths in the runner. The candidate and
    `config.toml` were not edited.

## 2. What changed

| File (`scripts/backend/`) | Change |
|---|---|
| `mb1-replay-live.mjs` | `provenStarted(ctx, id, consequence = 'nothing runs on 55321')`. The refusal ends with `; <consequence>`, or with nothing when it is empty, as in `sharedBinding`. It is exported. `sharedRunning`'s call is unchanged: the default gives SF-7c's exact text. The header (still four lines) and the JSDoc are updated |
| `mb1-replay-shared.mjs` | New `provenUnchanged(ctx, container, when, consequence)`: `provenStarted`, then one printed line. **L1:** `sharedApply` calls it right after `bindingUnchanged` (`'before migration up'`, `'apply nothing'`). **L2:** `afterSharedMigrate` calls it right after the binding recheck (`'after migration up'`, no consequence), before the exit check and the after snapshot. It calls it again after `recordSnapshot` built the verified state and before that state is returned (`'after the 55321-after snapshot'`). Any refusal after `migration up` is a STOP. The header, the JSDoc and the inline comments are updated |
| `mb1-replay-sf7d.test.mjs` (new) | 4 tests (§3) |
| `sf7`, `sf7b`, `sf7c`, `phase1f`, `phase1g`, `plan` tests | Expectations only, all set before the code. `'inspect-id'` now follows the second binding read in every `shared-apply` that gets past it. It also follows the binding recheck, and the after snapshot, in every apply that reaches them. Positional indexes moved: sf7 `[3, 8, 10]` → `[3, 8, 11]`, phase1g `calls[9]` → `calls[10]`, and plan's destructuring. SF-7b L2's late replacement now lands after the ID's inspect after `migration up` (`provenRuns` answers it as the proved container), so it still tests the exec by ID. The `absent` STOP is in sf7d test 3. Comments in sf7, sf7b and sf7c |
| Unchanged | the harness, the entry `mb1-replay.mjs`, `binding`, `order`, `sql`, `commands`, `evidence`, `target`, `exec`, `verify-identity.mjs`, the candidate and `config.toml` |

**How it behaves:**
- **Before `migration up`:**
  - The children are: the start-time check by name, the repository status, `docker ps`, the binding, the ID's inspect
    (SF-7c), the fresh snapshot, the staged status, the route proof's `migration list` and the second binding read.
  - Then comes the ID's inspect (SF-7d), the last child. It must print exactly `state.json`'s `shared`.
  - Then the synchronous final guards, the attempt record and the spawn run, with no `await` between them.
  - A restart or a stop during the staged status, the route proof or the second binding read, all with the same ID, refuses
    there, as does any other failure of that inspect. **No attempt is recorded and `state.json` is byte-equal.**
  - The refusal: `the database container Docker's binding proved, inspected by its ID, does not have the start time pinned
    at prepare (recorded "…", now "…"): it was restarted or recreated, or another Docker daemon answered, after the
    start-time check; apply nothing`. The ID is not printed.
  - When the change lasts, the start-time check by name after `shared-apply` (a lifecycle command) sees it too. Its STOP
    replaces the printed refusal, as review 1105Z I-a describes. The behaviour is the same.
- **After `migration up`, whatever its exit:**
  1. the candidate re-hash, the guards and the binding, as before;
  2. then the ID's inspect. A restart, a stop, no such container, a timeout or another value is `# STOP: after migration
     up: …`;
  3. then the exit, the applied list, the after snapshot and its comparison;
  4. then the ID's inspect once more: `# STOP: after the 55321-after snapshot: …`.

  A STOP returns `state.json` as it is: the attempt recorded, `sharedApplied` false and no `55321-after`. **A run that ends
  in one of these STOPs never records a verified apply.** `recordSnapshot` only builds the state, and `dispatch` writes
  what `afterSharedMigrate` returns.
- **Lines printed on success:** `# rechecked before migration up:`, `# rechecked after migration up:` and `# rechecked after
  the 55321-after snapshot:`. Each continues `the database container the binding proved, inspected by its ID, still has
  the start time pinned at prepare`.
- **Call order of a verified apply:** `inspect, status, names, binding, inspect-id, psql-read, status, migration list,
  binding, inspect-id, migration up, binding, inspect-id, psql-read, inspect-id, inspect`.

## 3. Tests (Node v22.23.1, `rtk proxy node --version`)

| Run | Command | Result |
|---|---|---|
| Baseline | not rerun (brief) | **Inherited:** 304/304, executed independently by review 1105Z on SF-7c's bytes |
| RED | `rtk proxy node --test --test-reporter=spec --test-reporter-destination=/tmp/fitlog-mb1-sf7b/sf7d-red1.txt` on 7 files: the new `sf7d` test and the six of §2's fourth row | 37 tests, 22 pass, **15 fail, each for its intended reason** (below) |
| GREEN | the same, `sf7d-green1.txt` | **37/37 on the first run.** No assertion changed after the code |
| Final, once | `rtk proxy node --test --test-reporter=tap --test-reporter-destination=/tmp/fitlog-mb1-sf7b/sf7d-final.tap scripts/backend/*.test.mjs` (20 files) | `1..159`, **`# tests 308`, `# pass 307`, `# fail 1`**, `# cancelled 0`, `# skipped 0`, `# todo 0`, `# duration_ms 13643.307833`. The four SF-7d tests are `ok 118`–`121` |
| Scope fix | `rtk proxy node --test --test-reporter=spec --test-reporter-destination=/tmp/fitlog-mb1-sf7b/sf7d-scope-fix.txt scripts/backend/mb1-replay-scope.test.mjs` | 3/3 |

**The final run's one failure** was `not ok 104 - L1: in this repository only the runner chain imports the five internal
modules, and each says so`:
- **Cause:** my second SF-7d header line in `live.mjs` pushed its `// Internal:` role comment from line 5 to line 6, beyond
  the five lines the scope test reads.
- **Fix (comment only):** the SF-7d mention now fits on header line 4.
- **Rerun:** only the scope test file, 3/3. The full run had stopped that test's loop at `live.mjs`; the rerun checked all
  five headers.
- **The full suite was not rerun:** the brief allows it once. So a full green on the final bytes is **not shown here**. The
  final run's other 307 passed on bytes that differ from the final ones only in that header comment. The independent review
  owns the full run.

**RED reasons:**
- **11 existing tests** fail only because their expected sequences lack the new `'inspect-id'` entries: phase1f 3, phase1g
  2, plan 1, sf7 2, sf7b 2, sf7c 1.
- **The four SF-7d tests show the defects themselves:**
  1. A restart during the staged status call: `shared-apply went on past the second binding read`. The calls ran through
     `migration up`, the binding recheck and the after snapshot.
  2. A transient switch: `the proven ID was not inspected again before migration up` (1 queued answer left; the apply went
     on).
  3. A restart during `migration up`: `a run that ended in a STOP recorded sharedApplied` (`true !== false`).
  4. A restart during the after snapshot: the same.

**Counts:** 304 + 4 = 308 tests and 155 + 4 = 159 top-level. The MB-1 runner tests are 251 + 4 = **255** (16 files). The
reports went into SF-7b's existing scratch directory, and no directory was created.

**The four SF-7d tests:**
1. **L1, a restart or a stop during the staged status call, the route proof's `migration list` or the second binding read**
   (3 × 2 cases, the same ID and binding throughout):
   - each refuses at the ID's inspect right after the second binding read, with calls `[…TO_UP, 'inspect']`;
   - that inspect's arguments name the proven ID;
   - `state.json` is byte-equal, and there is no attempt and no `migration up`;
   - the printed refusal is the lifecycle STOP.

   **Not realistic for a stop:** live Docker publishes no port for a stopped container, so there the second binding read
   would refuse a stop first. This fixture holds the binding, so the ID's inspect is what is tested.
2. **L1, the ID's own refusal:**
   - The second ID inspect gives another start time once, `No such container` (`now "absent"`), a timeout or an unexpected
     value. Each refuses with its exact text (`; apply nothing` for the first two), with no attempt.
   - **Order:** a staged migration edited *while that ID inspect runs* is still refused by the synchronous guards after it,
     with no attempt. So the inspect sits before the guards, and no `await` separates the guards, the attempt and the spawn.
   - **Control:** the verified apply's 16 calls (§2). The four ID inspects all name the proven ID with a 120 s timeout. The
     attempt is on disk when `migration up` starts. The printed lines are in order: the ID recheck, the final guards, the
     attempt, the recheck after `migration up`, the snapshot, the recheck after it, then the equality line.
     `sharedApplied` is true.
3. **L2, during `migration up`:**
   - **Cases:** a restart, a stop, a restart with exit 1, another start time once, no such container, and a timeout.
   - **Each:**
     - exit 1, with exactly one `# STOP: after migration up: <exact reason>; what 55321 applied is unknown …` line, also
       in the evidence file;
     - the attempt recorded, `sharedApplied` false and no `55321-after`;
     - calls ending `'migration up', 'binding', 'inspect-id', 'inspect'`, with no after snapshot;
     - the binding recheck printed, and no equality line;
     - the printed refusal is the lifecycle STOP when the change lasts, and empty otherwise;
     - the next `shared-apply` refused as already attempted.
4. **L2, during the after snapshot:**
   - **Cases:** a restart, and another start time once, landing while the after snapshot's read runs.
   - **Each:**
     - `# STOP: after the 55321-after snapshot: …`;
     - calls ending `'psql-read', 'inspect-id', 'inspect'`;
     - the check before the snapshot printed as held;
     - the same state assertions as test 3.

**Side effects, inspected before the final run** (Grep over the 20 test files):
- Writes go only to `mkdtemp`.
- Docker, Supabase, pnpm, psql and fetch are doubles, and fetch is replaced by a double that throws.
- The only real children are temporary `node` scripts, `git` in scratch repositories, and one read-only `check-sql-sources`
  run on this repository.
- The new test file starts no process: its evidence files go to the sandbox's mapped `/evidence`.

## 4. Mutations: none ran

None ran. No scratch tree is authorized, and the denied `mkdir`/`cp` were not retried or replaced:
- SF-7b's eight stay **UNRUN** (sf7b.md §4).
- SF-7c's four stay **UNRUN** (sf7c.md §4). Since SF-7d, P-call would leave a second ID inspect, so its predicted counts
  would change.

Planned for SF-7d, if a scratch tree is ever explicitly authorized (predictions, not results):

| Id | Change | Expected to fail |
|---|---|---|
| U-before | delete the `provenUnchanged` call before `migration up` | sf7d 1 and 2 by behaviour (`migration up` runs, an attempt is recorded, an answer is left queued), and every expectation with the second `inspect-id` |
| U-order | move that call to after `guardsBeforeMigrate`, still before the attempt | sf7d 2's staged-edit case by behaviour (the attempt is recorded and `migration up` runs) |
| U-after | delete the call after the binding recheck | sf7d 3 **by order and message only**: the call after the snapshot still STOPs with no `sharedApplied`, but the calls gain `psql-read` and the STOP names the snapshot |
| U-snapshot | delete the call after the after snapshot | sf7d 4 by behaviour (`sharedApplied` recorded on a STOP run; the transient case exits 0), and every verified-apply expectation |
| U-consequence | pass `''` instead of `'apply nothing'` before `migration up` | sf7d 2's transient and `absent` cases, by message only |

## 5. Hashes: not taken

- `rtk proxy sha256sum` was denied to review 1105Z. This phase treats it as a previously denied operation: it did not run it
  or any substitute. **No file hash is recorded here, before or after.**
- The changed files are those in §2. The reviewer binds by reading or hashes them.
- **§8 (Grep tool, executed):** §8's five patterns, with the single exclusion `!review-39fe1fb5-final.md`, print exactly the
  five inventory lines in three files. The token check prints exactly the six tokens. **The three files' hashes were not
  re-taken** (above). The harness is unchanged, so its fixture literal is still at line 40.

## 6. The finals this phase follows (none edited)

| File (`docs/evidence/MB-1/`) | What it is |
|---|---|
| `final-2026-10-27T1005Z-collected.md` | SF-7c's own final: 304/304, mutations UNRUN, status blocked |
| `final-2026-10-27T1105Z-collected.md` | SF-7c's independent review: C0 H0, M1 carried, L1 and L2 new, I-a to I-c; 304/304 executed by the reviewer on Node v22.23.1; `sha256sum` and `ls -la` denied to it |

Their hashes were not taken (§5). The cycle times in the names are the coordinator's. This phase did not observe them.

## 7. Residuals and decisions (stated, not claimed)

- **M1 (medium, carried, open):** nothing here proves that Docker's reads and the TCP write to 127.0.0.1:55322 reach the
  same Postgres. The live M1 read (R0–R17) was not executed. SQL cluster equivalence stays unproved.
- **The entry's window (new, self-review):**
  - After `afterSharedMigrate` returns the verified state, `dispatch` writes it. Then its `finally` runs the start-time
    check by name.
  - A restart after the last ID inspect therefore ends the run in that check's STOP refusal (exit 1), with the verified
    apply already in `state.json`.
  - **The verification itself held:** the start time was pinned at both inspects around the snapshot.
  - Closing this needs the entry `mb1-replay.mjs`, which this brief does not allow. For example, that STOP could record a
    halt, or `shared-apply` could defer the write. **Not changed; for the next review.**
- **Stale wording left in files outside this brief:**
  - The entry's header (the SF-7 sentence) still says `shared-apply` "reads the binding again as its last child before the
    final guards". Since SF-7d, the proven ID's inspect follows it. This is a comment-only fix for a phase allowed to edit
    the entry.
  - The SF-7 test title "…the binding again as its last children before the final guards…" was left as is, so test
    names stay comparable across runs.
- **Review 1105Z's informational notes:**
  - **I-a:** unchanged and disclosed (§2).
  - **I-b:** `shared-snapshot` and `shared-suite` still do not recheck the start time when they finish. Open.
  - **I-c:** the gap between an ID inspect and the exec stays, accepted by the review. A recreate there fails the exec by
    ID.
- **Fixture limits:**
  - The harness does not model a stopped container's empty port map (§3, test 1).
  - Docker's live shape, the label key, and any IPv4-plus-IPv6 pair stay unconfirmed until a reviewed live read.
- **Mutations:** SF-7b's eight, SF-7c's four and SF-7d's five are UNRUN. R-exit's behavioural kill is still not shown.
- **Decision (Codex, carried):** before any future `backend:test`, QA-9's phase 3N readiness gates G1–G7 require a single,
  separate harness-correction phase. MB-1 owns it, and Codex assigns its S2 paths. Not authorized now.
- **Review:** self-review only; the brief forbids subagents. **A fresh independent review of SF-7d comes next.**
- **Still open:** M1, SF-1 to SF-6, finding 5, I1, I2, files over 400 lines and old citations, the read-only live read, §5,
  §6 (55321) and §7, B1, B2, box 3 as a whole, and any shared apply.

## 8. Commands and permissions (this session)

| Command | Result |
|---|---|
| `rtk proxy git status --short` | at phase start: 31 untracked MB-1 entries (two docs directories, 28 scripts with `mb1-replay-sf7c.test.mjs`, the candidate) and no tracked change |
| `rtk proxy date -u +%Y-%m-%dT%H:%M:%SZ` | **Denied.** Not retried; no other tool read the clock instead. No time is claimed |
| `rtk proxy node --version` | `v22.23.1` |
| `rtk proxy node --test … sf7d-red1.txt <7 files>` | RED, §3 |
| `rtk proxy node --test … sf7d-green1.txt <7 files>` | GREEN, §3 |
| `rtk proxy node --test … sf7d-final.tap scripts/backend/*.test.mjs` | once, §3 |
| `rtk proxy node --test … sf7d-scope-fix.txt scripts/backend/mb1-replay-scope.test.mjs` | the scope test alone, after the comment fix, §3 |
| Not run | `sha256sum` and `shasum` (treated as previously denied), `wc -l` (denied in SF-7c), `mkdir`, `cp`, any mutation, any runner, Docker, CLI, database, SQL or network command, subagents, launchers, commits and staging |
| Grep, Glob, Read, Edit, Write | inspection, the code and tests, §8, and the MB-1 records |
