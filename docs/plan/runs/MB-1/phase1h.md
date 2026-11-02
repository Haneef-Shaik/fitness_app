# MB-1 phase 1H: review 2026-10-26T2000Z's two lows fixed test-first (pure code only, no live run)

| Field | Value |
|---|---|
| Goal and box | MB-1, box 3 (as phase 2). Box 3 is **not met**; B1 and B2 stay open. Nothing is Done |
| Authorization | Codex AUTH-01: **one bounded, pure-code, test-first correction phase** in the existing worktree. Scope: both findings of the independent review [`independent-review-2026-10-26T2000Z.md`](../../../evidence/MB-1/independent-review-2026-10-26T2000Z.md) (the phase 1G review). Finding 1: any complete M2 run whose banned check passed records the STOP whatever GoTrue answered; any `m2Stopped` blocks `shared-apply`, even after a pass; a passed M2 is never run again; permutations tested. Finding 2: replay `start` and `migrate` recheck the owned directory, the environment and the config synchronously, immediately before the child process; the guards after `migrate` are a STOP; config changes tested with mocked processes only. Checkpoint this phase with hashes. **Not allowed:** subagents, commits, branch, status or ledger changes, main integration, network, providers, pushes, CI, any database, Supabase, Docker or runner command, any operation on the replay directory, the actual runner. One writer only. No permission bypass: denied actions are recorded, never wrapped |
| Policy note | The coordinator restated that PRD §16.1 and frozen contract 003 override any stale agent text: gym staff never read or write private health data, whatever the consent. This phase changes replay tooling only, so no staff, consent or health-data path is touched |
| Worktree | `/Users/Adya/.codex/worktrees/fitlog-mb1/fitness_app`, branch `codex/mb1-identity`, base local `main` `2a95726`. Nothing committed |
| Node | `v22.23.1` (from the test runner's own error banner; `node --version` was not run) |
| Date | 27 October 2026, from the session's environment. `rtk proxy date -u` was denied, so no clock times are recorded |
| Result | **Both findings are fixed in code, test-first.** RED first: the two new or changed test files failed to load, then, with only the two interface exports added, **75 MB-1 tests: 64 pass, 11 fail**, each for the intended reason (§5.1). GREEN: the first run after implementing passed **75 of 75**. `rtk proxy node --test scripts/backend/*.test.mjs` gives **128 pass, 0 fail** (120 before, plus 8 new tests). All nine `node --check` pass. 15 guard mutations each fail a named test (§5.4). **No replay, database, CLI, Docker or network command ran.** The candidate SQL, `verify-identity.mjs`, its test, `config.toml`, `mb1-replay-target.mjs`, `phase1.md` and every evidence and review file are unchanged (hashes in §6). **The independent review this phase needs has not run** (subagents are forbidden): it is the next step |
| Read | `/Users/Adya/.codex/RTK.md`; GOALS.md MB-1; the run-goal skill; [checkpoint.md](checkpoint.md); [phase1g.md](phase1g.md) in full; [phase2-plan.md](phase2-plan.md) §§0, 3, 4, 6; the review in full; the three runner modules, `mb1-replay-target.mjs` and both MB-1 test files |

## 1. What this phase did, and did not do

- **Did:**
  - ran the pure suite first as a baseline: **120 pass, 0 fail**, and hashed the files before any edit (§6);
  - wrote the tests first and saw them fail (§5.1);
  - changed `mb1-replay-evidence.mjs`, `mb1-replay-order.mjs`, `mb1-replay.mjs`, `mb1-replay-evidence.test.mjs` and `mb1-replay.test.mjs`, and added `mb1-replay-order.test.mjs`, the first pure tests of the plan-order rules;
  - ran the pure tests, the nine syntax checks and 15 guard mutations, each restored (§5);
  - wrote this record and updated [checkpoint.md](checkpoint.md), [phase2-plan.md](phase2-plan.md) and the MB-1 [handoff.md](handoff.md).
- **Did not:**
  - run the Supabase CLI, Docker, any database query or any runner command;
  - read, open, list or check `/tmp/fitlog-mb1-replay-20261026`. Every runner test works on a fresh `mkdtemp` sandbox under the OS temporary directory, with an in-memory executor in place of Docker and the CLI. Only the existing executor tests start processes, and only local `node` scripts;
  - change `mb1-replay-target.mjs`, the candidate SQL, `verify-identity.mjs`, its test, `config.toml`, `phase1.md`, any evidence or review file, `status.json`, GOALS or the ledger;
  - commit, push or touch `main`;
  - use subagents, so the `code-reviewer`, `security-reviewer` and `tdd-guide` passes did not run. §7 is my own review, not the independent one this phase needs;
  - run the Python launcher snippet at the end of the brief. It starts a background `claude` agent, which this phase's scope forbids.

## 2. The latest result, as attempt 4 left it (persisted, not re-observed)

This phase never opened the replay, so this is attempt 4's record ([phase2.md](phase2.md) A4.2–A4.4), unchanged:
- RED is met on the disposable replay, with reference ban answer **`banned`**. The candidate is **`absent`**. There is **no GREEN**, and nothing was applied anywhere.
- The replay was left running with **no lock**. Its `state.json` holds generation 1, the `before` snapshot, attempt 3's failed red, attempt 4's red (`ok true`, `ban "banned"`), reference `ban "banned"` and `sharedApplied` false.
- 55321 has had no SQL and no Supabase command from MB-1.
- **B1 and B2 are open. Box 3 is not met.**

The new rules read that state as it stands: it holds no M2 run and no `stopRecorded` field, so `add-candidate`, `migrate`, `snapshot after` and `suite green` are allowed exactly as before. The only differences on that path are the two recheck lines `migrate` now prints (§4).

## 3. Finding 1: the M2 stop now follows the run, a pass is final, and any stop blocks `shared-apply`

**The gap (review, finding 1).** There were two holes:
- **A complete run whose banned check passed, under `ended` or an unrecognised answer, recorded no stop.** `M2_UNKILLED` was added only inside the `live`/`banned` branch of `judgeSuite`. So on a `banned` replay, a run answering `session_not_found` with 27 ok (the "the ban ended the session" case the stop exists for) was not met and recorded no stop. A later run with the exact kill then passed.
- **A pass, then a 27-ok run.** `suite m2` could run again after a pass. If that run stopped, the earlier pass still satisfied `shared-apply`, because `sharedApplyMissing` used `passed(state, 'm2')` and never read `m2Stopped`.

**The fix.**
- **`mb1-replay-evidence.mjs`.**
  - A new pure rule decides the stop from the run alone: `unkilled(log)`, exported on raw text as `m2RunUnkilled(text)`. It holds for a run in which all 27 checks ran once each, in order, and `a banned account reads no profile` printed `ok`.
  - `judgeSuite` now adds `M2_UNKILLED` **outside the class branches**, for every `m2` verdict whose run meets that rule. That covers `live`, `banned`, `ended`, an unrecognised answer, no answer line, two answer lines, a reference mismatch, either exit code and any other failures.
  - The old "complete" test is now the helper `completeRun(log)`, with the same meaning.
  - It is still M2's rule only: RED, GREEN, M1 and M3 never carry it.
- **`mb1-replay.mjs` `suite()`.**
  - The stop is `expect === 'm2' && m2RunUnkilled(text)`, decided from the run itself.
  - A run whose output is withheld (a secret-shaped line) is therefore stopped too. Its output is still never printed, and its printed problems gain only the constant `M2_UNKILLED`.
  - The STOP line and the `m2Stopped: true` record are unchanged.
- **`mb1-replay-order.mjs`.**
  - **`suiteNeeds('m2')`** refuses, before the suite runs:
    - first, as before, any recorded stop;
    - then, new, any passing M2: `suite m2 already passed on this replay at <ISO>: M2 counts its first pass or its stop and never runs again, so no later run can replace either (review 2026-10-26T2000Z finding 1)`.

    A failure for another reason (no kill and no stop, for example a `HTTP 500` detail) may still be repeated.
  - **`sharedApplyNeeds`**, after the existing "already applied" and "already attempted" refusals, refuses whenever **any** suite entry carries a truthy `m2Stopped`, whatever else is present or missing, an earlier pass included: `shared-apply is blocked on this replay: M2 was stopped at <ISO> ("a banned account reads no profile" passed with the ban clause removed), so no M2 run here counts, an earlier pass included (review 2026-10-26T2000Z finding 1); the fallback is M2b, reviewed separately`.

  So the runner's STOP line ("shared-apply stays blocked") is now true in every order.

**Unchanged.** M2's kill (exactly the banned check failing with `HTTP 200, 1 row(s)`, exit 1, the exact summary, the reference class, every other check ok). M2 still fails closed under an `ended` reference, and `mutate m2` is still refused there before any SQL.

## 4. Finding 2: replay `start` and `migrate` recheck what the CLI reads, immediately before it starts and after `migrate`

**The gap (review, finding 2).** `dispatch` checked the owned directory, the environment and the replay config. Then it awaited the shared container's `docker inspect`, and the replay's `supabase status` and `docker ps` (`start`: `docker ps`). Only then did the CLI start and read `<replay>/supabase/config.toml`. A `[db] port` moved to 55322 in that window would have sent `migrate`'s candidate to 55321. Afterwards only the shared container's start time was checked.

**The fix (`mb1-replay.mjs`).**
- **`replayGuards(ctx, at)`** is synchronous and spawns no process:
  - `refuseSupabaseVariables` and `refuseEnvFiles` (the repository, the replay and the staged workdir, their `supabase/` and every parent, as before);
  - then `checkOwnedDir`: the literal path and its real location, the sentinel, every manifest pin re-hashed, nothing the runner did not create (a `config.json` or a planted migration included), and the config's `project_id` and eight 564xx ports;
  - then, new, **the manifest's pins must equal the ones read under the lock when the command began**. That catches a consistent rewrite of a file and its pin: `manifest.json changed while this command ran (<paths>): its pins are not the ones checked under the lock`.

  On success it prints `# rechecked <at> on the replay: … the <n> file(s) pinned in manifest.json each sha256 equal and unchanged since this command began, nothing else in /tmp/fitlog-mb1-replay-…, and its config.toml naming fitlog_mb1_replay_… at the eight 564xx ports`.
- **`start`** calls it first. No await separates it from the child: `supabase()` reaches `runCommand`, whose Promise executor spawns in the same tick. A failure is a refusal, so nothing starts.
- **`migrate`** calls it first, the same way. A failure refuses, so nothing is migrated and the candidate stays `added`.
- **After `migrate`'s CLI returns, whatever its exit**, it calls it again. A failure is never a refusal. It is `# STOP: after migration up on the replay: <reason>; the replay's input changed while the CLI ran, so where migration up wrote is unknown (55321 included): nothing more runs on this replay until the coordinator reviews it (state.json records the STOP)`, with exit 1. `state.json` gets `stopRecorded: { at, op: "migrate" }`, and the candidate stays `added`, never `applied`.
- **`haltNeeds` (`mb1-replay-order.mjs`)** is checked in `dispatch` right after `state.json` is read, before any child process. A truthy `stopRecorded` refuses **every** command, `check`, `teardown` and the read-only `shared-snapshot` included: `a STOP was recorded at <ISO>: the replay's input changed while migration up ran, so where it wrote is unknown (55321 included), and nothing runs on this replay until the coordinator reviews it and removes stopRecorded from state.json by hand (review 2026-10-26T2000Z finding 2)`.

  This follows the lock's pattern: nothing removes it automatically, and the coordinator clears it after review. So undoing the change afterwards does not reopen the replay.
- **Order of checks after `migrate`.** The STOP decision comes before the CLI's exit status and `Applying` lines. The lifecycle `sharedUnchanged` still runs afterwards, and the state is written before it, so a STOP is recorded even if that check then refuses.

**Not changed:**
- `diff`, `lint`, `migrations`, `stop` and `teardown` keep the dispatch-time checks only (§7);
- `shared-apply` keeps its own staged-input guards from phase 1G.

## 5. Tests

### 5.1 RED (before any implementation)

1. **The first run** of the three MB-1 test files failed to load the two changed or new files, as intended:
   - `SyntaxError: The requested module './mb1-replay-evidence.mjs' does not provide an export named 'm2RunUnkilled'`;
   - `… './mb1-replay-order.mjs' does not provide an export named 'haltNeeds'`.

   The runner test file loaded, and its new tests failed: `start` ran despite the change, and `migrate` exited 0 after its config's port moved.
2. **Next, only the two interface exports were added**, as stubs with no behaviour (`m2RunUnkilled` returning false, `haltNeeds` returning null). Spec report `/tmp/fitlog-mb1-phase1h-red.txt`: **`ℹ tests 75`, `ℹ pass 64`, `ℹ fail 11`**.

Each failure was read, and each is the intended one:

| Test | Why it failed |
|---|---|
| evidence "M2's expectation follows GoTrue's ban answer…" | the `ended` 27-ok run gave 1 problem, not `M2_ENDED` plus `M2_UNKILLED` |
| evidence "M2 fails closed under ended…" | the same, for the 27-ok case |
| evidence finding 1 permutations (new) | `m2RunUnkilled` (stub) false for a complete 27-ok run |
| order: any stop blocks shared-apply (new) | `pass, pass, stop` allowed (`null`): the reviewer's hole |
| order: suite m2 until first pass or stop (new) | `pass`: a second M2 allowed |
| order: halt (new) | stub `null` |
| runner bbe2fbba finding 2 (changed assertion) | refusal named only the missing proofs, not the stop |
| runner finding 1, M2 never runs again (new) | a second `suite m2` ran after the exact kill |
| runner finding 1, stop blocks shared-apply after a pass (new) | `shared-apply` **ran to exit 0** on a state holding a pass and a stop |
| runner finding 2, recheck before start and migrate (new) | `start` ran with a changed replay directory |
| runner finding 2, STOP after migrate (new) | `migrate` exited 0 after its `[db]` port moved to 55322 during the CLI |

### 5.2 GREEN

- The three MB-1 files, the first run after implementing: **`ℹ tests 75`, `ℹ pass 75`, `ℹ fail 0`** (`/tmp/fitlog-mb1-phase1h-green.txt`).
- `rtk proxy node --test scripts/backend/*.test.mjs` (the plain form of phase2-plan §0.2):
  - after implementing: `1..128`, `# tests 128`, `# pass 128`, `# fail 0`, `# cancelled 0`, `# skipped 0`, `# todo 0`, `# duration_ms 6416.063083`;
  - **again after all 15 mutations were restored:** `# tests 128`, `# pass 128`, `# fail 0`, `# duration_ms 6379.522667`.
- `rtk proxy node --check` exits 0 with no output for each of nine files:
  - `mb1-replay.mjs`, `mb1-replay-target.mjs`, `mb1-replay-evidence.mjs`, `mb1-replay-order.mjs`, `verify-identity.mjs`;
  - `mb1-replay.test.mjs`, `mb1-replay-evidence.test.mjs`, `mb1-replay-order.test.mjs`, `verify-identity.test.mjs`.

### 5.3 New and changed tests

**New (8: 120 → 128).**

| File | Test |
|---|---|
| evidence | finding 1: every complete M2 run whose banned check passed carries `M2_UNKILLED` exactly once (and `m2RunUnkilled` agrees) across 6 answers × 4 references × 4 sets of other failures × 2 exit codes. The answers are `live`, `banned`, `ended`, unrecognised, no answer line and two answer lines; the references are `null`, `live`, `banned` and `ended`. That is 192 runs, each also checked with the banned check failing (the kill, `HTTP 500`, no detail: never the stop) and under RED, GREEN, M1 and M3 (never the stop). A setup failure, a missing check or two checks out of order is no stop. A stray secret-shaped line leaves a complete 27-ok run the stop |
| order (new file) | finding 1: all 39 orders of one to three M2 runs (pass, stop, failure): any stop blocks `shared-apply` with the first stop's time; else a pass allows it; else `missing: suite m2`. The stop is decisive with every other proof missing. Any truthy `m2Stopped` (1, `'yes'`, `{}`) blocks. The "applied" and "attempted" refusals keep their precedence |
| order | finding 1: the same 39 orders for `suite m2`: a stop gives the stop refusal; else a pass gives the "already passed" refusal with the first pass's time; else allowed. M1 and M3 are unaffected. Spacing and the proof requirement still apply |
| order | finding 2: `haltNeeds`: no record or `null` gives null; a record gives the halt text with its time; `true`, `'x'`, no time, a non-time and an out-of-range time each halt as "an unknown time" |
| runner | finding 1: after the exact kill, a second `suite m2` is refused before the suite runs (`inspect` only, evidence written). On a `banned` replay, 27 ok answering `ended`, an unknown code, `live` or `banned` prints `M2_UNKILLED`, the exit and answer lines and the STOP line, and records `m2Stopped`; the next `suite m2` is refused. A withheld 27-ok output stops M2 without printing anything of the run or leaking; a withheld kill is no stop, and the exact kill then passes |
| runner | finding 1: on a state with every replay proof, one passing M2 and an added stop (after the pass, and before it), `shared-apply` is refused with the stop text, `inspect` only, no attempt and nothing staged; without the stop the same state applies |
| runner | finding 2: eight changes made during the last `docker ps` before the CLI, each refused immediately before `start` (`inspect, names, inspect`; nothing started or applied) and before `migrate` (`inspect, status, names, inspect`; nothing applied; candidate `added`), with no leak in the output or evidence. The changes are: the `[db]` port to 55322; the same, re-pinned; a migration edited and re-pinned; a planted migration; a planted `config.json`; a `.env` in the replay; a `.env` in the repository; a `SUPABASE_*` variable. The clean runs show, from an ordered log of child processes and config reads, that between the last `docker ps` and the CLI's spawn there are only reads of the replay's `config.toml`, no other process, and that the recheck line is printed |
| runner | finding 2: the same eight changes made **while `migration up` runs** (`onMigrate`) each give the STOP line (not a refusal), exit 1, `inspect, status, names, migration up, inspect`, the STOP in the evidence file, no "rechecked after" line, candidate still `added` and `stopRecorded: { at, op: "migrate" }`. With the change undone, `check`, `migrate`, `snapshot after`, `suite green`, `stop`, `teardown`, `shared-snapshot before` and `shared-apply` are each refused before any child process. Clearing the record by hand (test harness), the clean `migrate` prints both recheck lines, records `applied` and `snapshot after` passes |

**Changed existing assertions (none weakened).**
- **Evidence "M2's expectation follows GoTrue's ban answer…".**
  - The `ended` zero-failure M2 now expects 2 problems: `M2_ENDED` then `M2_UNKILLED`. It was 1.
  - The unrecognised-answer case's exact list gains `M2_UNKILLED`.

  Both are stricter: a further problem is required.
- **Evidence "M2 fails closed under ended…".**
  - The 27-ok cases now require `M2_UNKILLED` as well, and the cases where the banned check fails still require exactly one problem.
  - The mismatch loop (the review's `:372`) now also asserts the stop exactly when the run had 27 ok.
- **Evidence `suiteLog` helper.** `ban: null` now prints no answer line. Before, it printed an empty line, which the parser skipped, so existing calls are unaffected.
- **Runner "review bbe2fbba finding 2: under banned…".** After the STOP, the `shared-apply` refusal was a partial match on "missing: suite m1, suite m2, suite m3,". It is now the exact, anchored stop text, and it also asserts `inspect` only (no child process).
- **Runner harness.** The in-memory `docker ps` names call now runs an optional `onNames` hook (test only), so a test can change files at the last check before the CLI.

### 5.4 Guard mutations

Each mutation was applied and run (the three MB-1 files, with a spec report to `/tmp/fitlog-mb1-phase1h-mut-<x>.txt`), then restored. A Grep for `MUTATION`, `false &&`, `true ||` and the RED stub text then found nothing but the runner's own `MUTATIONS` table, and the final 128/128 run came after all of them.

| # | Mutation | Result | Killed by |
|---|---|---|---|
| A | `M2_UNKILLED` only under `live`/`banned` (the phase 1G placement) | 71/75 | evidence "M2's expectation…", evidence "fails closed under ended", evidence finding 1 permutations, runner finding 1 (never runs again / any answer) |
| B | the stop without a complete run | 73/75 | evidence bbe2fbba finding 2 (the partial run), evidence finding 1 permutations |
| C | a withheld output never stops | 74/75 | runner finding 1 (the withheld case) |
| D | no "already passed" refusal | 73/75 | order suite m2, runner finding 1 |
| E | no stop block in `sharedApplyNeeds` | 72/75 | order shared-apply, runner bbe2fbba finding 2 (changed assertion), runner finding 1 (blocks after a pass) |
| F | no recheck before `start` | 74/75 | runner finding 2 (before the CLI) |
| G | no recheck before `migrate` | 73/75 | runner finding 2 (before the CLI), runner finding 2 (after migrate: its "immediately before" line) |
| H | no recheck after `migrate` | 74/75 | runner finding 2 (after migrate) |
| I | the STOP printed but not recorded | 74/75 | runner finding 2 (after migrate) |
| J | `dispatch` ignores `haltNeeds` | 74/75 | runner finding 2 (after migrate) |
| K | no "pins unchanged since the lock" check | 73/75 | both runner finding 2 tests (the re-pinned migration) |
| L | the recheck without `checkOwnedDir` | 73/75 | both runner finding 2 tests |
| M | the recheck without `refuseEnvFiles` | 73/75 | both runner finding 2 tests. The first failing case is the replay `.env`, **by message only**, because the inventory still refuses it; the repository's `.env` has no other guard |
| N | the recheck without `refuseSupabaseVariables` | 73/75 | both runner finding 2 tests (the `SUPABASE_*` case) |
| O | `haltNeeds` always `null` | 73/75 | order halt, runner finding 2 (after migrate) |

**Trap hit:** mutation L's edit lost one trailing space (`const changed =[`), so its first restore did not match. It was restored by hand, re-read and confirmed byte-equal in meaning to the GREEN text, and the final 128/128 run and the post-run hashes (§6) come after that restore.

## 6. Hashes (`rtk proxy sha256sum`, allowed this session)

**Before any edit** (the input this phase started from, which the reviewer can tie to phase 1G):

| sha256 | File |
|---|---|
| `e9c4aeb3b08106e75005ccb12bf458597ab07f060e6023323bc83d05a7fcb2a9` | `scripts/backend/mb1-replay.mjs` |
| `42219dee18756927f32ca7aec1c8a6c5139499097c81bc1be5d5a52370f9eb5c` | `scripts/backend/mb1-replay-target.mjs` |
| `e05526f1a599601bf700e5a91d4495fe4400674fcd9a8c16df5b04b361ac6b47` | `scripts/backend/mb1-replay-evidence.mjs` |
| `33b3f644878d75cac2e6421bcaedcc68f504d193e44843bff811b8bef593e5a3` | `scripts/backend/mb1-replay-order.mjs` |
| `39ad794dfc155f22d9f069c6914bf3782decf2a342c4980600e22625dfbbd91e` | `scripts/backend/mb1-replay.test.mjs` |
| `40963b2c6066902d3198c18329ed8b650f4e3c3be6c4d8b2950e979243826b80` | `scripts/backend/mb1-replay-evidence.test.mjs` |

**After this phase** (code final; the docs are hashed in [handoff.md](handoff.md)):

| sha256 | File | Changed here |
|---|---|---|
| `5e947d6632089d8e75e6d2586250fc5715bd2768c801a5979d67f1c320d8e3b1` | `scripts/backend/mb1-replay.mjs` | yes |
| `42219dee18756927f32ca7aec1c8a6c5139499097c81bc1be5d5a52370f9eb5c` | `scripts/backend/mb1-replay-target.mjs` | no |
| `7ab5a76944ef5ceabc23e4ae11144e1dfe95c9586d32faaeb6461dce12fe6c6d` | `scripts/backend/mb1-replay-evidence.mjs` | yes |
| `71546d66403d0dbb371ffe50fd20b797aaf45633306b77f403d33c8cd67cbfd0` | `scripts/backend/mb1-replay-order.mjs` | yes |
| `59dd7021046d20145b9cfac749ee30750e417c09e3d02a38c3aa36ae9eeb7219` | `scripts/backend/mb1-replay.test.mjs` | yes |
| `d7253ff1c6339bdb5b6cf7fd17370103b99130ca677dcc4fb59ed11416e3aff1` | `scripts/backend/mb1-replay-evidence.test.mjs` | yes |
| `8101069b5103ffca71eed4059823414e66bc5c3a69c878093bfa6817699302ac` | `scripts/backend/mb1-replay-order.test.mjs` | new |
| `944ba934a93a369cf6382ddea79620cdf35215d218dc1fde9eea634cc1bcdf81` | `scripts/backend/verify-identity.mjs` | no (equals phase1g §8's `944ba934…cdbf81`) |
| `902bb69924b929ac0b06c8fc44e3102318cf6f5fc06c212ccd3d51ce45521021` | `scripts/backend/verify-identity.test.mjs` | no (equals `902bb699…521021`) |
| `ac262f39fc6962345f64982e36c6b2aa7f8f3418829fd653684002f2f2c1bdc3` | `supabase/migrations/20261026040045_mb1_live_session_guard.sql` | no (the pinned candidate) |
| `67a3591105da6cc41032b8c4dc72680ae65cd93751dc594ee5918f7654481b94` | `supabase/config.toml` | no (equals `67a35911…1b94`) |
| `8ba686dbdea606484af49fbfe6836283945c27805355fa2586e61614fae34f78` | `docs/plan/runs/MB-1/phase1.md` | no (its pinned preconditions block test passes) |

The four CLI files were not touched, read or hashed. Line counts after this phase, from Grep (`wc` was not tried):
- `mb1-replay.mjs` 788, under the 800 limit (759 before);
- `mb1-replay-evidence.mjs` 596 (580);
- `mb1-replay-order.mjs` 103 (85);
- `mb1-replay-target.mjs` 430 (unchanged);
- `mb1-replay.test.mjs` 1971 (1723);
- `mb1-replay-evidence.test.mjs` 648 (589);
- `mb1-replay-order.test.mjs` 93 (new).

## 7. Self-review (not independent), and open issues for the reviewer

I found nothing critical or high.

**Checked:**
- No await sits between either pre-spawn recheck and its child. With the real executor, `runCommand` spawns inside its Promise executor in the same tick. The runner tests prove the order with the injected executor: only config reads lie between the last `docker ps` and the spawn.
- The STOP's state is written before the lifecycle `sharedUnchanged` runs.
- A halted directory refuses before any child process.
- `readState` still accepts attempt 4's state, which has no new fields, and nothing there changes.
- Messages carry paths, names and fixed text only, never file contents. The pin paths come from `checkOwnedDir`, whose manifest keys pass `SAFE_REL`.

**Open, low:**
1. **An incomplete M2 run whose banned check printed `ok` is still no stop.** The review and the brief both say "complete", and phase 1G's test keeps it so. A run that crashed after the banned check passed then fails without the stop, so M2 may run again and pass. The reviewer may want "any run in which the banned check printed `ok`" instead. That is a one-line change in `unkilled`, plus flipping phase 1G's partial-run assertion.
2. **No recheck after `start`.** The brief scoped the after-guards to `migrate`. A change while `start` runs is still caught only by the next command's dispatch checks. A `[db]` port of 55322 there would collide with the running shared container rather than write to it, but that is inferred, not observed.
3. **`diff`, `lint`, `migrations` and `stop` read the replay config after the dispatch-time checks only.** `lint` and `migrations` connect read-only; `stop` names the replay's literal `--project-id`. `diff` starts its own shadow database at the config's `shadow_port` and applies the migrations there. A same-user change of that port in the window is the same class as finding 2, with a shadow container as the target. Not in this brief.
4. **The halt blocks every command,** the read-only `shared-snapshot before` and `teardown` included, until `stopRecorded` is removed by hand. That is deliberately the lock's pattern. The coordinator may prefer to allow the read-only 55321 check, which would show whether the candidate reached 55321.
5. **Live CLI behaviour under the after-`migrate` recheck is not observed.** If `migration up --workdir <replay>` writes anything under the replay other than `supabase/.temp` or `supabase/.branches`, the recheck stops and halts the replay (fail closed). Attempt 2's `start` and `migrations` left nothing else, and every later command's `checkOwnedDir` passed.
6. **File size.** `mb1-replay.test.mjs` is 1971 lines, over the 800-line guideline (1723 before). Splitting the harness into a shared module is a separate refactor.
7. **Scratch files** `/tmp/fitlog-mb1-phase1h-*.txt` (RED, GREEN and the 15 mutation reports) are spec reports only, not evidence, and were not removed.

## 8. State left untouched

- **The replay project** `/tmp/fitlog-mb1-replay-20261026` was not opened, read, listed or checked. It stays as attempt 4 left it (§2).
- **55321** got no query, command or inspect from this phase.
- **Unchanged:**
  - `mb1-replay-target.mjs`, the candidate SQL, `verify-identity.mjs` and its test;
  - `supabase/config.toml`, `local-stack.mjs`, `package.json` and the lockfile;
  - `phase1.md` to `phase1g.md` and [phase2.md](phase2.md);
  - every evidence and review file (the review copy included);
  - `status.json`, GOALS and the ledger.
- `rtk proxy git status --short`:
  - before: the 11 untracked MB-1 paths;
  - after: 12, the earlier 11 plus `scripts/backend/mb1-replay-order.test.mjs`;
  - no tracked change, and no new dependency.

## 9. Next bounded phase (the coordinator decides)

1. **A fresh, independent review of the phase 1H diff, before any runner or database step.** Hash the files in §6 first and compare. It covers:
   - finding 1's stop rule (every class, withheld output);
   - the "already passed" refusal;
   - the stop blocking `shared-apply`;
   - finding 2's pre-spawn recheck, its pin comparison, the after-`migrate` STOP and the halt;
   - the open issues in §7.
2. **If accepted,** the replay §3 steps on the same running replay, each with its own authorization: `add-candidate`, `migrate` (it prints both recheck lines; any STOP halts the replay), `snapshot after` and `suite green`. Then M1 and M3, then M2 under `banned`.
3. **§6 (55321)** stays **not authorized** until every prerequisite in phase2-plan §6 is met.
4. **B1 and B2 stay open. Box 3 is not met.**

## 10. Permissions observed

| Command | Result |
|---|---|
| A compound `cd … && git status --short && git branch … && git log … && ls …` (my first command) | Denied. Not retried in that form |
| `rtk git status --short` | Denied |
| `rtk proxy date -u +%Y-%m-%dT%H:%M:%SZ` | Denied; no time was taken another way |
| `rtk proxy shasum -a 256 <files>` | Denied |
| `rtk proxy sha256sum <files>` | **Allowed** (§6) |
| `rtk proxy git status --short` | Allowed |
| `rtk proxy node --test scripts/backend/*.test.mjs` | Allowed (output persisted by the tool, read with Grep) |
| `rtk proxy node --test <three MB-1 files>`, plain and with `--test-reporter=spec --test-reporter-destination=/tmp/fitlog-mb1-phase1h-*.txt` | Allowed (exit 1 on RED and under every mutation, 0 on GREEN) |
| `rtk proxy node --check <file>` | Allowed (nine commands) |
| Read, Grep, Glob, Edit and Write in the worktree; Read and Grep of the `/tmp` spec reports | Allowed |
| Subagents, the Python launcher in the brief | Not used: the brief forbids both |
