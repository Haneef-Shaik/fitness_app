# MB-1 phase 1I: review 2026-10-26T2305Z findings 1, 2 and 4 fixed test-first (pure code only, no live run)

| Field | Value |
|---|---|
| Goal and box | MB-1, box 3 (as phase 2). Box 3 is **not met**; B1 and B2 stay open. Nothing is Done |
| Authorization | Codex AUTH-01 (explicit delegation): **one bounded correction phase**, existing lane only. Scope: the independent review of phase 1H, [`reviewer-final-2026-10-26T2305Z.md`](../../../evidence/MB-1/reviewer-final-2026-10-26T2305Z.md). Finding 1: an incomplete M2 run whose banned check printed `ok` is the durable STOP, whatever `completeRun`, order or exit; a setup failure with no check is not; flip the old contrary expectations; a runner regression with a partial banned `ok` then a logout failure; replace phase 1H's mutation B with one that requires a complete run again. Finding 2: the eight `migrate` drift cases each with exit 1 and a timeout, asserting the STOP and the durable candidate state, one subtest per drift case. Finding 4: synchronous pre-spawn guards for `migrations`, `diff`, `lint` and `stop`, and a post-`diff`/`lint` STOP, with pure mocks and tests. Exact, reproducible mutation patches saved under evidence, with the original restore hashes. **Finding 3 (inode and ctime detection) is deferred to a separate design phase.** **Not allowed:** subagents; commits, index, history, branch, status, ledger or `main` changes; pushes, providers, network, CI; any database, Supabase, Docker, actual runner or replay-directory operation; SQL, config, identity or contract edits; an inline test runner through `node -e`. Allowed commands: pure backend tests and `node --check`. No permission bypass |
| Policy note | The coordinator restated that PRD §16.1 and frozen contract 003 override any stale agent text: gym staff never read or write private health data, whatever the consent. This phase changes replay tooling only, so no staff, consent or health-data path is touched |
| Worktree | `/Users/Adya/.codex/worktrees/fitlog-mb1/fitness_app`, branch `codex/mb1-identity`, base local `main` `2a95726`. Nothing committed |
| Date | 27 October 2026, from the session's environment. No clock command was run, so no times are recorded |
| Result | **Findings 1, 2 and 4 are fixed (2: tests only, as the code was already right), test-first.** Baseline before any edit: **128 pass, 0 fail**. RED: the three MB-1 test files gave **229 tests, 122 pass, 107 fail**, each failure the intended one (§5.1). GREEN: the first run after implementing passed **229 of 229**. `rtk proxy node --test scripts/backend/*.test.mjs` gives **`1..133`, `# tests 282`, `# pass 282`, `# fail 0`** (subtests counted), before and after the mutations. All nine `node --check` pass. **11 guard mutations**, each saved as a patch under [`docs/evidence/MB-1/phase1i-mutations/`](../../../evidence/MB-1/phase1i-mutations/), each fail named tests, and each restore hashes equal to the recorded original (§5.4, §6). **No replay, database, CLI, Docker or network command ran.** The candidate SQL, `config.toml`, `verify-identity.mjs`, its test, `mb1-replay-target.mjs` and `phase1.md` are unchanged (§6). **The independent review this phase needs has not run** (subagents are forbidden): it is the next step |
| Read | `/Users/Adya/.codex/RTK.md`; [checkpoint.md](checkpoint.md); the review in full; [phase1h.md](phase1h.md) in full; [handoff.md](handoff.md); [phase2-plan.md](phase2-plan.md) §§0, 1.4, 3, 4, 5, 6; `mb1-replay.mjs`, `mb1-replay-order.mjs`, the relevant parts of `mb1-replay-evidence.mjs` and `verify-identity.mjs` (`check`, `logout`, the banned check, `main`); the three MB-1 test files |

## 1. What this phase did, and did not do

- **Did:**
  - ran the pure suite first as a baseline (**128 pass, 0 fail**, `# duration_ms 6849.022791`) and hashed the inputs (§6), which equal phase 1H's recorded "after" values;
  - wrote every new and changed test first and saw them fail for the intended reasons (§5.1);
  - changed `mb1-replay-evidence.mjs`, `mb1-replay-order.mjs` and `mb1-replay.mjs`, and the three MB-1 test files;
  - ran the pure tests, the nine syntax checks and 11 guard mutations, each from a saved patch and each restored and re-hashed (§5);
  - wrote this record and updated [checkpoint.md](checkpoint.md), [phase2-plan.md](phase2-plan.md) and [handoff.md](handoff.md).
- **Did not:**
  - run the Supabase CLI, Docker, any database query or any runner command;
  - read, open, list or check `/tmp/fitlog-mb1-replay-20261026`. Every runner test works on a fresh `mkdtemp` sandbox under the OS temporary directory, with an in-memory executor in place of Docker and the CLI;
  - change `mb1-replay-target.mjs`, the candidate SQL, `config.toml`, `verify-identity.mjs`, its test, `phase1.md`, any contract, `status.json`, GOALS or the ledger;
  - edit any earlier evidence or review file. The only evidence written is the new `phase1i-mutations/` directory of patches, which the brief asked for;
  - commit, stage, push or touch `main`;
  - use subagents, so the `code-reviewer`, `security-reviewer` and `tdd-guide` passes did not run. §8 is my own review, not the independent one;
  - run `node -e` or any inline test runner, `git apply`, `diff` or a shell `patch`.

## 2. The latest result, as attempt 4 left it (persisted, not re-observed)

Unchanged from phase 1H §2 ([phase2.md](phase2.md) A4.2–A4.4): RED is met on the disposable replay, with reference ban answer **`banned`**; the candidate is **`absent`**; there is **no GREEN**; the replay was left running with **no lock**; 55321 has had no SQL and no Supabase command from MB-1. **B1 and B2 are open. Box 3 is not met.**

The new rules read that state as it stands. It holds no M2 run, no `stopRecorded` and no `diff` or `lint` result, so `add-candidate`, `migrate`, `snapshot after` and `suite green` (§3 of the plan) are allowed exactly as before. The differences a §3 run would show are the same two `migrate` recheck lines phase 1H added; phase 1I adds lines only to `migrations`, `diff`, `lint` and `stop`.

## 3. Finding 1: any M2 run whose banned check printed `ok` is the stop, complete or not

**The gap (review, finding 1).** `unkilled` required `completeRun(log)`. In `verify-identity.mjs` the banned check (`:191`) is followed by `logout(a1, 'local')` (`:194`, its assert at `:119`) and `logout(a2, 'others')` (`:208`), both outside `check()`. A 429 or 500 there, or a signal after check 15, ends the run with `verify-identity setup failed: …` after the banned check printed `ok`. That run was neither a pass nor a stop. 75 s later `suiteNeeds` allowed another run, which could show the exact kill and pass, discarding the evidence of the stop.

**The fix (`mb1-replay-evidence.mjs`).**
- `unkilled(log)` is now `log.checks.some((check) => check.name === M2_CHECK && check.ok)`: any parsed `ok - a banned account reads no profile`, whether the run is complete, in order, or ends with any exit.
- `judgeSuite` still adds `M2_UNKILLED` outside the class branches, for `m2` only, and still reports the run's own problems (the incomplete run, the stop line, the missing kill) before it.
- `m2RunUnkilled(text)` is the same rule on raw text, so the runner's `suite()` (`stopped = expect === 'm2' && m2RunUnkilled(text)`) records `m2Stopped: true` and prints the STOP line for a partial run too, its withheld output included. **The runner code needed no change**; only its comment was updated.
- A setup failure that printed no check, a refusal, empty output, a run that broke off before the banned check, a run that broke off with the banned check failing, and a check whose name only resembles the banned one are **not** the stop.

**Durable.** The stop is the existing `m2Stopped` record: `suiteNeeds` refuses every later `suite m2` before it runs, and `sharedApplyNeeds` blocks `shared-apply` whatever else passed. The runner test proves both after the reviewer's run.

## 4. Findings 2 and 4: the CLI's input rechecked, before and after

### 4.1 Finding 2 (test gap): the post-`migrate` STOP with a failed or timed-out CLI

The code was already right: `migrate` reran the guards before it read the CLI's exit. Every test used exit 0, so an early `if (run.status !== 0) return { code: 1 };` placed before the recheck would have passed them all. Now:
- the eight drift cases run with `migration up` ending in **exit 0, exit 1 and a timeout** (`status: null`, `error: 'ETIMEDOUT'`): 24 subtests, each on its own sandbox. Each asserts the STOP line in the output and the evidence file, the CLI's own end (`# exit 1` or `# did not finish (ETIMEDOUT)`), no "rechecked after" line, `stopRecorded: { at, op: 'migrate' }`, the candidate still `added`, and, with the change undone and the CLI healthy again, all eight later commands refused with **no** child process, the record and the candidate unchanged;
- with nothing changed, a failed or timed-out `migration up` is **not** a STOP: it prints the "rechecked after" line, fails, leaves the candidate `added` and no record, and a later `migrate` applies;
- the move to a shared helper (`stopAfter`, below) keeps the STOP before the exit is read, with a comment saying why.

### 4.2 Finding 4: `migrations`, `diff`, `lint` and `stop` recheck before the CLI; `diff` and `lint` after it

**The gap.** These commands read the replay's `config.toml` after the dispatch checks only, with awaits in between (the shared container's `inspect`, the replay's `status` and `docker ps`). `diff` starts its shadow database at the config's `shadow_port`; `lint` creates `plpgsql_check` in a transaction it rolls back (the reviewer's reading, not checked against 2.121.0).

**The fix (`mb1-replay.mjs`).**
- **Before the CLI:** `replayGuards(ctx, …)` is the first statement of `migrations` (`immediately before migration list`), of `checked`, which runs `diff` and `lint` (`immediately before db diff` / `db lint`), and of `stopReplay` (`immediately before stop`), which `stop` and `teardown` both use. `replayGuards` is synchronous and spawns nothing; `supabase()` reaches `runCommand`, which spawns inside its Promise executor in the same tick, so no await separates the check from the child. A failure is a refusal: nothing is listed, diffed, linted or stopped, and the state is unchanged.
- **After `diff` and `lint`, whatever the exit:** a new helper `stopAfter(ctx, op, label)` reruns `replayGuards(ctx, 'after <label>')`. A failure prints `# STOP: after db diff on the replay: <reason>; the replay's input changed while the CLI ran, so where db diff wrote is unknown (55321 included): nothing more runs on this replay until the coordinator reviews it (state.json records the STOP)` and returns exit 1 with `stopRecorded: { at, op: 'diff' }` (or `lint`). No `checks.diff` or `checks.lint` result is recorded. `migrate` now uses the same helper with `op 'migrate'` and label `migration up`; its STOP text is unchanged byte for byte.
- **The halt names the command (`mb1-replay-order.mjs`).** `haltNeeds` reads `stopRecorded.op` through a frozen own-key table, `{ migrate: 'migration up', diff: 'db diff', lint: 'db lint' }`, and only when `op` is a string. Any other or missing op (`true`, `'x'`, `null`, `'constructor'`, `'__proto__'`, `['diff']`, …) reads as migrate's, the only op recorded before this phase; every truthy record still halts. The halt text for `migrate` is unchanged.

**Not changed:** no recheck after `start`, `migrations` or `stop` (the brief scoped the after-STOP to `diff` and `lint`; carried in §8); `shared-apply` keeps its own staged-input guards.

**Line count.** `mb1-replay.mjs` is 798 lines, under the 800 limit; the two new doc comments were kept to one line each for that reason.

## 5. Tests

### 5.1 RED (before any implementation)

`rtk proxy node --test --test-reporter=spec --test-reporter-destination=/tmp/fitlog-mb1-phase1i-red.txt` on the three MB-1 files: exit 1, **`ℹ tests 229`, `ℹ pass 122`, `ℹ fail 107`**. Each failure was read; each is the intended one:

| Failing (count) | Why |
|---|---|
| evidence "review bbe2fbba finding 2: M2 holds …" (1) | the flipped partial run (`drop: 1`, banned `ok`) carried no `M2_UNKILLED` |
| evidence "review 2026-10-26T2305Z finding 1: any M2 run …" (1, new) | `m2RunUnkilled` false for the reviewer's run (check 15 `ok`, then the logout failure) |
| order "review 2026-10-26T2305Z finding 4: … names it" (1, new) | the halt said `migration up` for `op: 'diff'` |
| runner finding 1 partial run (2 subtests + parent) | no `M2_UNKILLED`, no STOP after the logout failure or the SIGTERM |
| runner finding 4 before the CLI (45 subtests + parent) | `migration list`, `db diff`, `db lint` and `stop` ran after the change (teardown removed the directory); each clean run lacked the recheck line between the last `docker ps` and the CLI |
| runner finding 4 after diff and lint (54 subtests + parent) | `diff` and `lint` exited 0 after the change, with no STOP or record; each clean run lacked both recheck lines |

**Passing in RED, as expected:** the 24 post-`migrate` drift subtests (exit 0, 1 and timeout) and the two "nothing changed" ones, because the code was already right (finding 2 is a test gap; mutation P proves them); the 18 restructured pre-spawn `start`/`migrate` subtests; the three "no stop" subtests of finding 1.

### 5.2 GREEN

- The three MB-1 files, the first run after implementing: **`ℹ tests 229`, `ℹ pass 229`, `ℹ fail 0`**, `ℹ duration_ms 11543.777667` (`/tmp/fitlog-mb1-phase1i-green.txt`).
- `rtk proxy node --test scripts/backend/*.test.mjs 2>&1 | tail -n 9`: `1..133`, `# tests 282`, `# pass 282`, `# fail 0`, `# cancelled 0`, `# skipped 0`, `# todo 0`, `# duration_ms 11359.593833`.
- One comment in `mb1-replay.mjs` (`reason`'s doc line) was then corrected, and the MB-1 files rerun: **229 of 229** (`/tmp/fitlog-mb1-phase1i-green-2.txt`). The restore hashes in §6 are taken after that.
- **After all 11 mutations were restored:** `1..133`, `# tests 282`, `# pass 282`, `# fail 0`, `# duration_ms 11864.069708`.
- `rtk proxy node --check` exits 0 with no output for each of nine files: `mb1-replay.mjs`, `mb1-replay-target.mjs`, `mb1-replay-evidence.mjs`, `mb1-replay-order.mjs`, `verify-identity.mjs`, `mb1-replay.test.mjs`, `mb1-replay-evidence.test.mjs`, `mb1-replay-order.test.mjs`, `verify-identity.test.mjs`.

The count rises from 128 to 282 because node:test counts subtests: 128 + 5 new top-level tests = 133, plus 149 subtests.

### 5.3 New and changed tests

**New top-level tests (5).**

| File | Test |
|---|---|
| evidence | finding 1: 11 runs whose banned check printed `ok` are each the stop, `M2_UNKILLED` exactly once, for exit 0 and 1 and references `null`, `live`, `banned` and `ended`, and never under RED, GREEN, M1 or M3: the reviewer's run (check 15 `ok`, then `verify-identity setup failed: Logout (local) failed: HTTP 429 …`); the same with a SIGTERM line; with no answer line; with an unrecognised answer; after `ended`; with another failure; the banned check alone; the banned check `ok` twice; 26 checks (two answers); two checks out of order. The reviewer's run keeps its own problems (`stop line: …`, `got 15 check line(s)`) and the stop comes last. 6 runs are **not** the stop: a setup failure with no check, a refusal with no check, no output, a break before the banned check, a break after it failed, and a check named like it |
| order | finding 4: `haltNeeds` names `db diff` for `op: 'diff'` and `db lint` for `op: 'lint'` (an unknown time included); `migrate`, `undefined`, `null`, `'start'`, `'DIFF'`, `' diff'`, `'constructor'`, `'__proto__'`, `'toString'`, `'hasOwnProperty'`, `1` and `['diff']` all read as `migration up` |
| runner | finding 1 (5 subtests): on a `banned` replay at M2, the banned check `ok` then the logout failure, and then SIGTERM: exit 1, no refusal, `M2_UNKILLED`, the NOT met verdict, the STOP line in output and evidence, `m2Stopped: true`; 75 s later the exact kill is refused before the suite runs (`inspect` only); after the restore, `shared-apply` is refused with the stop text (`inspect` only); one stop record. A setup failure with no check, a break before the banned check and a break after it failed: no STOP, no `M2_UNKILLED`, no record, and the exact kill then passes |
| runner | finding 4, before the CLI (45 subtests): for `migrations`, `diff`, `lint` and `stop`, each of the eight changes made during the last `docker ps` is refused with its exact problem, the calls stopping before the CLI (`inspect, status, names`, plus the lifecycle `inspect` for `diff` and `stop`), the replay still running, `state.json` byte-equal, no recheck line and no leak. `teardown` (after `retain`) the same, its calls `inspect, names, status, names, inspect`, nothing removed. Each clean run shows, from the ordered log, only `config.toml` reads between the last `docker ps` and the CLI, and the `# rechecked immediately before …` line (`teardown`: before `stop`, then the directory is removed) |
| runner | finding 4, after the CLI (54 subtests): for `diff` and `lint`, each of the eight changes made while the CLI runs, with exit 0, exit 1 and a timeout: exit 1, no refusal, the expected calls, the "immediately before" line, the CLI's own end, the STOP line in output and evidence, no "rechecked after" or "clean:" line, `stopRecorded: { at, op }`, no `checks` result; with the change undone, `check`, `migrations`, `diff`, `lint`, `images`, `stop`, `teardown` and `shared-snapshot before` are each refused with the `db diff`/`db lint` halt and **no** child process, and the record is unchanged. With nothing changed: both recheck lines, no STOP, no record, and `checks.<name>` `{ generation: 1, clean }` true at exit 0, false at exit 1 or a timeout |

**Changed tests (none weakened).**
- **Evidence "review bbe2fbba finding 2: M2 holds …".** The partial run (`drop: 1`, banned `ok`) now must carry `M2_UNKILLED`; it was asserted absent. The setup-failure case still asserts no stop. *Flipped as the brief and finding 1 require.*
- **Evidence "review 2026-10-26T2000Z finding 1: every complete M2 run …".** Its closing block asserted that a missing check or two checks out of order are no stop; those cases moved, flipped, into the new finding 1 test, which also keeps the setup failure as no stop. The 192-run permutation loop and the withheld-line case are unchanged.
- **Runner "review 2026-10-26T2000Z finding 2: start and migrate recheck …".** Same assertions, now one subtest per drift case on its own sandbox (18 subtests), so a failing case never hides a later one (review informational 5); the undo calls it no longer needs were dropped.
- **Runner "review 2026-10-26T2000Z finding 2: after migrate …"** (title gains "whatever the CLI exit"). Same assertions per case, now for exit 0, exit 1 and a timeout (27 subtests), plus the CLI's own end line, the record's durability after the later commands, and the "nothing changed" and "cleared by hand" subtests.
- **Runner harness.** The in-memory `db diff`/`db lint` call now runs an optional `onDb` hook and returns an optional `dbResult` (test only), as `onMigrate` and `migrateResult` already do for `migration up`. New helpers: `DRIFT_LABELS`, `eachDrift`, `CLI_ENDS`, `CLI_END_LINE`, `atStarted`, `atCandidateAdded`, `unknownAfter`, `haltedBy` (`HALTED` and `REPLAY_UNKNOWN` are now built from the last two, with the same text).

### 5.4 Guard mutations (saved patches)

Each mutation is a unified diff in [`docs/evidence/MB-1/phase1i-mutations/`](../../../evidence/MB-1/phase1i-mutations/), applicable from the worktree root with `git apply <patch>` and reversible with `git apply -R <patch>`. Each patch names the file it applies to and that file's original sha256, which is also the hash it must return to after the restore. **How they were applied here:** `git apply` is outside the brief's command set, so each was applied with one exact string replacement equal to the patch's changed line(s), run with `rtk proxy node --test --test-reporter=spec --test-reporter-destination=/tmp/fitlog-mb1-phase1i-mut-<id>.txt` on the three MB-1 files (each exit 1), and restored the same way. The patches' hunk lines were copied from the files as read at the restore hashes, but **`git apply --check` was not run**, so their applicability is not machine-verified. After the last restore, all three modules hash to the restore values (§6).

| Id | Patch | File (restore sha256) | Mutation | Result | Killed by |
|---|---|---|---|---|---|
| B2 | `B2.patch` | evidence `6d52d70c…f681bb89` | the stop requires a complete run again (**replaces phase 1H's B**, whose effect is now intended) | 224/229, 5 fail | evidence bbe2fbba finding 2 (the flipped partial run), evidence 2305Z finding 1, runner 2305Z finding 1 (both STOP subtests and the parent) |
| P | `P.patch` | runner `fd76c04b…73e83334` | `migrate` returns on a non-zero or null exit before its recheck (the reviewer's example) | 210/229, 19 | the 16 exit-1 and timeout drift subtests, both "nothing changed" ones (their "rechecked after" line), the parent. **The 8 exit-0 cases pass under it**: exactly the reviewer's point |
| Q | `Q.patch` | runner | no recheck before `migration list` | 219/229, 10 | the 8 "before migrations" subtests, the clean run, the parent |
| R | `R.patch` | runner | no recheck before `db diff`/`db lint` | 155/229, 74 | the 16 "before diff/lint" subtests, both clean runs, all 54 post-diff/lint subtests (their "immediately before" line), both parents |
| S | `S.patch` | runner | no recheck after `db diff`/`db lint` | 174/229, 55 | all 54 post-diff/lint subtests and the parent |
| U | `U.patch` | runner | `diff`/`lint` return on a non-zero or null exit before the recheck | 192/229, 37 | the 32 exit-1 and timeout drift subtests, the 4 matching "nothing changed" ones, the parent; the exit-0 cases pass |
| T | `T.patch` | runner | no recheck before `stop` | 210/229, 19 | the 8 "before stop" and 8 "before teardown" subtests, both clean runs, the parent |
| X | `X.patch` | runner | the STOP after a CLI printed but not recorded | 154/229, 75 | the 24 post-`migrate` drift subtests, "cleared by hand", the 48 post-diff/lint drift subtests, both parents |
| V | `V.patch` | order `fb6edb39…248c3b37` | the halt ignores `op` (always `migration up`) | 179/229, 50 | the order finding 4 test, the 48 post-diff/lint drift subtests (their `db diff`/`db lint` halt), the parent |
| W | `W.patch` | order | the halt looks `op` up without requiring a string | 228/229, 1 | the order finding 4 test, at `["diff"]` |
| M2 | `M2.patch` | runner | the recheck without `refuseEnvFiles` (phase 1H's M, rerun) | 193/229, 36 | the 32 `.env` subtests in all 16 contexts and 4 parents. The replay's `.env` is killed **by message only** (the inventory refuses it as a foreign entry); the repository's `.env` is killed **for real** (`start` ran, and so on) in every context. Phase 1H's loop never reached that case; one subtest per case now shows it (review informational 5) |

Phase 1H's other mutations (A, C to L, N, O) were not rerun; none of the tests that killed them was weakened.

## 6. Hashes (`rtk proxy sha256sum`)

**Before any edit** (equal to phase 1H §6 "after" and to the review's 16 values):

| sha256 | File |
|---|---|
| `5e947d6632089d8e75e6d2586250fc5715bd2768c801a5979d67f1c320d8e3b1` | `scripts/backend/mb1-replay.mjs` |
| `7ab5a76944ef5ceabc23e4ae11144e1dfe95c9586d32faaeb6461dce12fe6c6d` | `scripts/backend/mb1-replay-evidence.mjs` |
| `71546d66403d0dbb371ffe50fd20b797aaf45633306b77f403d33c8cd67cbfd0` | `scripts/backend/mb1-replay-order.mjs` |
| `59dd7021046d20145b9cfac749ee30750e417c09e3d02a38c3aa36ae9eeb7219` | `scripts/backend/mb1-replay.test.mjs` |
| `d7253ff1c6339bdb5b6cf7fd17370103b99130ca677dcc4fb59ed11416e3aff1` | `scripts/backend/mb1-replay-evidence.test.mjs` |
| `8101069b5103ffca71eed4059823414e66bc5c3a69c878093bfa6817699302ac` | `scripts/backend/mb1-replay-order.test.mjs` |

**After this phase** (final; the three modules are also the mutation restore hashes, re-taken after the last restore):

| sha256 | File | Changed here |
|---|---|---|
| `fd76c04b0fa656d811831c6b103ef652313e281d77a648e23a0b368b73e83334` | `scripts/backend/mb1-replay.mjs` | yes |
| `6d52d70ce4c059ce89e32efa5d0d6162b9b59f2cf0c106ba3195bac6f681bb89` | `scripts/backend/mb1-replay-evidence.mjs` | yes |
| `fb6edb395cfe01edfc99e4ef70c8bcdfc6d6d206af0f0963aee4c42d248c3b37` | `scripts/backend/mb1-replay-order.mjs` | yes |
| `9c18e4238f36275e1a24ba740fe9fc034f703fe220717e37ec1698d13f55e81c` | `scripts/backend/mb1-replay.test.mjs` | yes |
| `89421648df0583a9cc1c811c7afc9c7003c023eb27cc908ce1c6c77a87918583` | `scripts/backend/mb1-replay-evidence.test.mjs` | yes |
| `95fdb69a52161801dc8e672a83ad60b42294882d138cefcce7b59e9126f89ad7` | `scripts/backend/mb1-replay-order.test.mjs` | yes |
| `42219dee18756927f32ca7aec1c8a6c5139499097c81bc1be5d5a52370f9eb5c` | `scripts/backend/mb1-replay-target.mjs` | no |
| `944ba934a93a369cf6382ddea79620cdf35215d218dc1fde9eea634cc1bcdf81` | `scripts/backend/verify-identity.mjs` | no |
| `902bb69924b929ac0b06c8fc44e3102318cf6f5fc06c212ccd3d51ce45521021` | `scripts/backend/verify-identity.test.mjs` | no |
| `ac262f39fc6962345f64982e36c6b2aa7f8f3418829fd653684002f2f2c1bdc3` | `supabase/migrations/20261026040045_mb1_live_session_guard.sql` | no (the pinned candidate) |
| `67a3591105da6cc41032b8c4dc72680ae65cd93751dc594ee5918f7654481b94` | `supabase/config.toml` | no |
| `8ba686dbdea606484af49fbfe6836283945c27805355fa2586e61614fae34f78` | `docs/plan/runs/MB-1/phase1.md` | no |

An intermediate runner hash, `ff04e8b0…cb05a0c`, was taken after GREEN and before the one-line comment fix in §5.2; it is superseded. The test files were not touched by any mutation, and their hashes above were taken before and after the mutations alike. The docs and patches are hashed in [handoff.md](handoff.md). The four CLI files were not touched, read or hashed.

**Line counts** (Grep): `mb1-replay.mjs` 798 (788 before); `mb1-replay-evidence.mjs` 598 (596); `mb1-replay-order.mjs` 109 (103); `mb1-replay-target.mjs` 430 (unchanged); `mb1-replay.test.mjs` 2210 (1971); `mb1-replay-evidence.test.mjs` 703 (648); `mb1-replay-order.test.mjs` 106 (93).

## 7. Finding 3 (inode and ctime detection): deferred, and the condition that stands until then

The brief defers finding 3 to a separate design phase; nothing here detects a change that is written and undone while a CLI runs. `replayGuards` compares content hashes, so such a change passes both rechecks. **Until that design is done, reviewed and authorized, this condition from the review stands, now for every CLI command that rechecks after (`migrate`, `diff`, `lint`):**
- exactly one writer: no other process writes to the replay directory or to the worktree's `supabase/` while `migrate`, `diff` or `lint` runs;
- no Supabase write of any kind outside the runner's own commands;
- **no actual CLI run is approved by this phase.** Each later runner step needs its own authorization.

For the design phase (not started): the review suggests recording `lstat(…, { bigint: true })` `ino` and `ctimeNs` under the lock for every pinned file and owned directory and treating any difference after the CLI as a STOP, expecting a fail-closed STOP if the CLI creates `supabase/.temp` for the first time. The same residual applies to `shared-apply`.

## 8. Self-review (not independent), and open issues for the reviewer

I found nothing critical or high.

**Checked:**
- No await between any new pre-spawn recheck and its child: each `replayGuards` call is the statement immediately before `await supabase(…)`, which reaches `runCommand` synchronously. The ordered-event tests show only `config.toml` reads between the last `docker ps` and each CLI call, for `migration list`, `db diff`, `db lint` and `stop`.
- The STOP after `migrate`, `diff` and `lint` is decided before the exit or output is read, so a failed or timed-out CLI is still checked (mutations P and U).
- The STOP state is returned to `dispatch`, which writes it before the lifecycle `sharedUnchanged` (`diff`); `lint` has no lifecycle check.
- `haltNeeds` never takes a label from a hand-edited record except through the frozen own-key table, and only for a string.
- Messages carry paths, names and fixed text only; the leak checks pass in every new subtest.
- `readState` still accepts attempt 4's state, and nothing on the §3 path changes beyond phase 1H's two lines.

**Open, low:**
1. **Finding 3 deferred** (§7): the single-writer condition is the only control for a written-and-undone change.
2. **No recheck after `start`, `migrations` or `stop`** (carried from phase 1H for `start`). `migrations` connects read-only; `stop` names the replay's literal `--project-id`. A change during them is caught by the next command's dispatch checks only.
3. **The halt blocks every command**, the read-only `shared-snapshot before` and `teardown` included, now after a `diff` or `lint` STOP too (carried design; the coordinator needs a written procedure for clearing `stopRecorded`, including a read-only check of 55321).
4. **Live CLI behaviour under the new rechecks is not observed.** If `db diff` or `db lint` writes anything under the replay other than `supabase/.temp` or `supabase/.branches` (for example a migration file or a `.env`), the after-recheck stops and halts the replay: fail closed, but it would block §5 until reviewed.
5. **Observed in RED, not changed:** before the fix, `teardown` removed a replay directory whose `config.toml` had changed after the dispatch checks. `removeOwnedDir` removes owned entries by name and type and does not re-hash content after dispatch. With the fix, the stop recheck refuses first when the replay is running; when it is already stopped, `teardown` has no child process and the dispatch-time `checkOwnedDir` is the only content check. Informational: it deletes only what the runner owns.
6. **File sizes.** `mb1-replay.mjs` is at 798 of 800 lines: the next change there needs a split first. `mb1-replay.test.mjs` is 2210 lines (1971 before; carried): a harness module is a separate refactor.
7. **Suite time** roughly doubled (6.8 s to 11.9 s), from the 149 sandboxed subtests.
8. **The patches were not checked with `git apply --check`** (§5.4).
9. **Scratch files** `/tmp/fitlog-mb1-phase1i-*.txt` (RED, GREEN, GREEN-2 and the 11 mutation reports) are spec reports, not evidence, and were not removed.

## 9. State left untouched

- **The replay project** `/tmp/fitlog-mb1-replay-20261026` was not opened, read, listed or checked. It stays as attempt 4 left it (§2).
- **55321** got no query, command or inspect from this phase.
- **Unchanged:** `mb1-replay-target.mjs`, the candidate SQL, `config.toml`, `verify-identity.mjs` and its test, `local-stack.mjs`, `package.json` and the lockfile; `phase1.md` to `phase1h.md` and [phase2.md](phase2.md); every earlier evidence and review file; `status.json`, GOALS and the ledger.
- **Git:** not run this phase (`rtk git status` was denied, and the brief's command set has no git). From the session-start snapshot and the files written here, the working tree holds the 12 untracked MB-1 paths plus `docs/plan/runs/MB-1/phase1i.md` and `docs/evidence/MB-1/phase1i-mutations/` (11 patches). No tracked file was edited, nothing was staged, and no dependency was added.

## 10. Next bounded phase (the coordinator decides)

1. **A fresh, independent review of the phase 1I diff, before any runner or database step.** Hash the files in §6 first and compare. Apply each patch in `phase1i-mutations/` with `git apply`, run the three MB-1 files, compare with §5.4, and restore with `git apply -R` (the module must hash to its restore value). It covers:
   - finding 1's fail-closed stop (partial, out of order, any exit; a setup failure is no stop) and the replaced mutation B2;
   - finding 2's exit-1 and timeout cases and mutation P;
   - finding 4's four pre-spawn rechecks, the post-`diff`/`lint` STOP, the halt's op table and mutations Q to X;
   - the open issues in §8.
2. **§3 of the plan on the running replay is not changed by this phase** and still needs its own authorization (review 2026-10-26T2305Z already found phase 1H not blocked for it). The single-writer condition (§7) applies to `migrate`.
3. **Before `mutate m2` or `suite m2`:** item 1 accepted (finding 1). **Before §5's `diff` and `lint`:** item 1 accepted (finding 4), and ideally finding 3's design phase.
4. **§6 (55321)** stays **not authorized**.
5. **B1 and B2 stay open. Box 3 is not met.**

## 11. Commands and permissions observed

| Command (exact) | Result |
|---|---|
| `pwd; git status --short; ls docs/plan/runs/MB-1/ docs/evidence/MB-1/` | Denied. Not retried in that form; Glob used instead |
| `rtk git status --short` | Denied |
| `rtk proxy node --check scripts/backend/mb1-replay.mjs` | Allowed (first as a permission probe, then as a gate) |
| `rtk proxy node --test scripts/backend/*.test.mjs 2>&1 \| tail -n 12` | Allowed: baseline `# tests 128`, `# pass 128`, `# fail 0`, `# duration_ms 6849.022791` |
| `rtk proxy sha256sum` on the 12 files of §6 | Allowed (read-only; read as covered by the brief's "save … restore hashes"). Run before edits, after GREEN (6 files), before the mutations (3 modules) and after the restores (12 files) |
| `rtk proxy node --test --test-reporter=spec --test-reporter-destination=/tmp/fitlog-mb1-phase1i-red.txt <3 MB-1 files>; echo "exit $?"` | Denied (the compound `echo`). Rerun without it: allowed, exit 1 (RED) |
| `rtk proxy node --test --test-reporter=spec --test-reporter-destination=/tmp/fitlog-mb1-phase1i-green.txt <3 MB-1 files>` | Allowed, exit 0 |
| `rtk proxy node --test scripts/backend/*.test.mjs 2>&1 \| tail -n 9` | Allowed: 282/282, twice |
| `rtk proxy node --test --test-reporter=spec --test-reporter-destination=/tmp/fitlog-mb1-phase1i-green-2.txt <3 MB-1 files>` | Allowed, exit 0 |
| `rtk proxy node --test --test-reporter=spec --test-reporter-destination=/tmp/fitlog-mb1-phase1i-mut-<B2\|P\|Q\|R\|S\|U\|T\|X\|V\|W\|M2>.txt <3 MB-1 files>` | Allowed, each exit 1 |
| `rtk proxy node --check <file>` for the nine files of §5.2 | Allowed, each exit 0 with no output |
| Read, Grep, Glob, Edit and Write in the worktree; Read and Grep of the `/tmp` spec reports | Allowed |
| Subagents, commits, `git apply`, `node -e`, any CLI, Docker or database command | Not used: the brief forbids them |
