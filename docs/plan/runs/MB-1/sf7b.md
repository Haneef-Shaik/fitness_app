# MB-1 SF-7b: review 0905Z's four lows, L1–L4 (pure code, fixtures only, no live run)

Attempt 1 · branch `codex/mb1-identity` · base local `main` `2a95726` · uncommitted working tree · 27 October 2026.
Codex AUTH-01 (owner delegation), one bounded phase after SF-7's fresh review
[`final-2026-10-27T0905Z.md`](../../../evidence/MB-1/final-2026-10-27T0905Z.md). That review found no critical, high or new
medium finding and ran 296 pure tests. Codex accepts it and keeps the carried M1 open. **Nothing is Done and no Done-when box is
met.** M1, SF-1 to SF-6, B1, B2, box 3 as a whole and any shared apply stay open (§7).

> **Timing note (added by SF-7c, review 0935Z L3; the text above is unchanged):** "review 0905Z" here is the file name of
> `final-2026-10-27T0905Z.md` (`c68e01d5…91bd`). Per Codex, that review was collected in the **08:35** cycle. The 09:05
> cycle's item is `final-2026-10-27T0905Z-collected.md` (`dddba543…d407`), this phase's own final. SF-7b's independent review
> is `final-2026-10-27T0935Z-collected.md` (`0cefa246…c528`, 09:35). None is edited; full hashes in [sf7c.md](sf7c.md) §6.

## 1. Scope, and what did not run

- **Done, test-first, fixtures only:**
  - L1, the `DOCKER_HOST` refusal;
  - L2, the proven database ID and `--type container`;
  - L3, the route list's exit with a valid table;
  - L4, the STOP text.
- **Not run, by the brief:**
  - the runner, the replay directory (not read, listed or written), Docker, the Supabase CLI, any database, SQL or network
    call;
  - `backend:test`, subagents, launchers, commits and staging;
  - root `package.json` and contract edits. 55321 got nothing.
- **Denied, and the sequence stopped (§4):** the scratch tree for the mutations (`mkdir -p` and `cp`). No mutation ran. No
  other writer, tool or in-place edit was used instead.
- **Policy, restated by the coordinator:**
  - PRD §16.1 / ADR003: gym staff never access private health data, whatever the consent.
  - The launching-checkout override stays until QA-2 is integrated and launching-checkout is corrected.
  - SF-7b opens no data path: the candidate (`ac262f39…bdc3`) and `config.toml` (`67a35911…1b94`) hash unchanged.

## 2. What changed

| File (`scripts/backend/`) | Lines | Change |
|---|---|---|
| `mb1-replay-binding.mjs` | 101 | `bindingArgs` adds `--type container` (`:29`). A binding that holds also returns `ids`: the proven IDs keyed by container name, frozen (`:79`). Every refusal returns `ids: null` (`refused`) |
| `mb1-replay-live.mjs` | 174 | The fingerprint inspect adds `--type container` (`:158`). `sharedBinding` returns `{ value, ids }` (`:154`). `sharedRunning` returns the database's proven ID as `container` (`:129`). New `refuseRemoteDocker` (`:137-141`), exported |
| `mb1-replay.mjs` (entry) | 200 | `refuseRemoteDocker` runs for `shared` commands (`:135`): after the lock, state and halt checks, before `sharedConfigBound` and before any child. Two header lines and the import; the six exports are unchanged |
| `mb1-replay-shared.mjs` | 174 | `bindingUnchanged` reads `.value` (`:92`). The STOP after `migration up` ends with `SHARED_INCIDENT` (`:151`). Role comment and import |
| `mb1-replay-order.mjs` | 116 | `SHARED_INCIDENT` (`:95`), also used by the "already attempted" refusal (`:102`) |
| `mb1-replay-test-harness.mjs` | 348 | The binding inspect is found by its format anywhere in the args. `docker exec <64-hex ID>` reaches only the current fixture database's ID; anything else gets Docker's `No such container`. Adds `dbIdOf`, `INCIDENT` and the new `ATTEMPTED`. The §8 fixture literal stays at line 40 |
| `mb1-replay-sf7b.test.mjs` (new) | 185 | 5 tests (below) |
| `binding`, `guards`, `plan`, `phase1f`, `phase1g`, `sf7` tests | 130, 278, 313, 288, 306, 213 | Expectation updates: `--type container`, `ids`, exec by the proven ID, the new STOP text. All but one were made before the code (§3) |

**How the four fixes behave:**
- **L1:**
  - For `shared-snapshot`, `shared-apply` and `shared-suite`, a `DOCKER_HOST` in the child environment that does not match
    `^unix:///` is refused before any child process. The message is fixed, and the value is never printed.
  - Tested values: `tcp://…`, `ssh://…`, an empty value, `unix://` with no path, `npipe://…`, `UNIX:///…`, and a leading
    space. Each refuses with no child, no value in the output or the evidence, `state.json` unchanged and the lock released.
  - `unix:///var/run/docker.sock` and an unset variable run as before.
  - Under `tcp://`, every replay command still runs as before, and its children get the value: `prepare` to `images`,
    `stop`, a fresh `start`, `retain` and `teardown`.
- **L2:**
  - Every 55321 snapshot runs `docker exec … <ID>` on the database ID proven in the same command. That covers
    `shared-snapshot before` and `after`, `shared-apply`'s fresh snapshot and its after snapshot.
  - Suppose a container is replaced between the binding read and the exec. `shared-snapshot` then fails with no reference
    recorded. `shared-apply` stops before the write, with no attempt recorded and no `migration up`. After `migration up` it
    is a STOP: the attempt is kept, `sharedApplied` stays false, and there is no `55321-after`.
  - Replay snapshots keep the container name: the mirror is held.
- **L3:**
  - New cases print a valid route table, then end with exit 1 (with stderr), exit 2, or no exit status. Each refuses
    before a second binding read, an attempt or `migration up`.
  - The control, the same table at exit 0, applies to exit 0.
  - The code (`shared:80`) was already right; L3 was a test gap.
- **L4:**
  - The STOP and the refusal of any later apply both end: "…the coordinator reviews 55321 through SF-2's manually
    authorized read-only incident path outside this runner (not yet written; once the shared container has changed, every
    55321 command here is refused)".
  - A test recreates the container while `migration up` runs. `shared-snapshot after`, `shared-apply` and `shared-suite`
    are then each refused before any SQL. SF-2's path is not written, and nothing here runs it.
  - `shared-snapshot after` stays allowed (`sharedSnapshotNeeds` is unchanged). Its "take shared-snapshot after instead"
    refusal shows only while the start-time pin holds, so it advises nothing impossible.

## 3. Tests (Node v22.23.1, `rtk proxy node --version`)

| Run | Command | Result |
|---|---|---|
| Baseline | not rerun (brief) | **Inherited:** 296/296, executed independently by review 0905Z on these bytes. At phase start the 15 SF-7 code hashes equalled sf7.md §6 (executed) |
| RED | `node --test --test-reporter=spec --test-reporter-destination=/tmp/fitlog-mb1-sf7b/red1.txt` on the 7 files of §2's last two rows | 45 tests, 30 pass, **15 fail, each for its intended reason:** binding ×5 (`--type` ×2, `ids` ×3), guards ×1 (fingerprint `--type`), plan ×1 (exec by name), phase 1F ×1, phase 1G ×2 and SF-7 ×1 (the old text), SF-7b ×4 (L2 ×2, L1, L4). **The L3 test passed**, as expected for a test gap |
| GREEN 1 | the same, `green1.txt` | 44/45. In phase 1F "a change made after the fresh snapshot", the `onRead` hook found the 55321 read by the container name. The exec now uses the ID, so the hook never fired. Its selector became the proven ID, with the same intent. **This is the one test edit made after the code** |
| GREEN 2 | the same, `green2.txt` | **45/45** |
| Final, once | `rtk proxy node --test --test-reporter=tap --test-reporter-destination=/tmp/fitlog-mb1-sf7b/final.tap scripts/backend/*.test.mjs` (18 files) | `1..152`, **`# tests 301`, `# pass 301`, `# fail 0`**, `# cancelled 0`, `# skipped 0`, `# todo 0`, `# duration_ms 13099.600167` |

296 + 5 = 301 tests and 147 + 5 = 152 top-level; the MB-1 runner tests are 243 + 5 = **248** (14 files).

**Side effects, inspected before the final run** (Grep and Read; the seven unedited MB-1 test files hash-equal at phase start):
- Every write goes to `mkdtemp`.
- `pnpm`, `psql`, Supabase and Docker are injected doubles.
- The only real children are:
  - temporary `node` scripts (the executor tests, `verify-contracts`' echo);
  - `git` in scratch repositories;
  - one read-only `check-sql-sources` run on this repository (also the inherited finding of review 0905Z).

## 4. Mutations: not run (denied)

The brief allows bounded, scratch-only mutations. The scratch tree needed `rtk proxy mkdir -p /tmp/fitlog-mb1-sf7b/tree/…` and
six `rtk proxy cp …` (the scripts, migrations, `config.toml`, and the AR-1, MB-1 and `phase1.md` fixtures). **All seven were
denied.** The sequence stopped there:
- no scratch tree, mutation or patch file;
- no in-place edit, which "scratch-only" excludes;
- no other writer.

**R-exit's behavioural kill is therefore not shown.** Inspected inference only: the L3 control proves that the same table at
exit 0 goes on to the attempt and `migration up`. So without `shared:80`, the failing cases would do the same and fail the
test's kinds and no-attempt assertions before its message assertion.

Planned for the next authorized run (predictions, not results):

| Id | Change | Expected to fail |
|---|---|---|
| R-exit (re-run) | delete `shared:80` | SF-7b L3: kinds and an attempt recorded (behaviour) |
| D-call | delete `mb1-replay:135` | SF-7b L1: children run (behaviour) |
| D-rule | `live:137` → `/^(unix\|tcp\|ssh):\/\//` | SF-7b L1, the tcp and ssh cases |
| D-empty | `live:140` `host !== undefined` → `host` | SF-7b L1, the empty case |
| I-name | `live:129` → `SHARED.container` | SF-7b L2 ×2 (a replaced container is read; sharedApplied), plan gate (args) |
| T-bind | `binding:29` without `--type container` | binding ×2, SF-7b L2: by arguments |
| T-fp | `live:158` without `--type container` | guards, SF-7b L2: by arguments |
| L4-text | `order:95` → the old text | every `ATTEMPTED`/STOP-line test: by message (the text is the fix) |

## 5. Hashes (`rtk proxy sha256sum`, executed)

**Before** (phase start; the 15 SF-7 files equal sf7.md §6): `mb1-replay.mjs` `70cf2af7…254b`, `binding` `ec1d7e8c…c3fe`,
`live` `9cefbd61…7323`, `shared` `ca616247…af3c`, `order` `fb6edb39…3b37`, harness `b72db681…d766`, `binding.test`
`1b3c6044…7e59`, `sf7.test` `3ea32471…5b9b5e53`, `guards.test` `86428a87…04a5`, `plan.test` `46e47e25…5e45`, `phase1f.test`
`7dfea4ab…218d`, `phase1g.test` `cd6687a2…c7539`.

**After (final run):**

| sha256 | `scripts/backend/` |
|---|---|
| `4f84290036cf9ae2f7b997ea4dc790913022e848c9b288bb248c54e8aaa1bb06` | `mb1-replay.mjs` |
| `95773ef37eabce45c5729dadeb001aabd78f9a22a761b24bbee863f7a6f2b692` | `mb1-replay-binding.mjs` |
| `067b0fe4e201b17fe442d45dd6215ab423ba4c5f0aea04d6d236a57fbd49ff08` | `mb1-replay-live.mjs` |
| `3ae13f6eaef0b64eedd623cc490d3741d1827ddaead8bcf6e34cf9e84ffece50` | `mb1-replay-shared.mjs` |
| `a02525f0b6e80a2eaa48aa1958e576a58b074964afb0d246175c4dc6f559c55f` | `mb1-replay-order.mjs` |
| `a6b5f7f4b376d0545cafec36a108778b4b47e10450fddad1708bc22dc7916c32` | `mb1-replay-test-harness.mjs` |
| `39900b053fa9018d15e46648a3409599cfedf4052ec09569d4ec7408c44ee2d8` | `mb1-replay-sf7b.test.mjs` (new) |
| `cc2a3dde3417f4804fa25816a497a3ca30877938787b66d331a5e3244b6f9e2d` | `mb1-replay-binding.test.mjs` |
| `9b0c0c0c7adc3e35d6000af3f2a33876ee850d9b91972703a8b5bb28d951d47c` | `mb1-replay-sf7.test.mjs` |
| `b2279c984cf7ad397bee560893b5251b15722344ec2234816d37fcdb0e487005` | `mb1-replay-guards.test.mjs` |
| `ebde61ad901a77e25134ab61ba8cba237ea54d21778fa903658b0df9320b079b` | `mb1-replay-plan.test.mjs` |
| `5829cdae1b4f9156b02620aac77c1929d2112ee1bb6ee3ebf0470885333b903f` | `mb1-replay-phase1f.test.mjs` |
| `8192679ccdc2f81c6cab50f5f9b02d32955a5a73a2f56cba9b9df38ea47f2e27` | `mb1-replay-phase1g.test.mjs` |

**Unchanged (re-hashed equal):**
- `exec` `f77dc9e5…4172`, `sql` `f10e317f…3a35`, `commands` `3269580e…e8d3`, `evidence` `6d52d70c…bb89`, `target`
  `42219dee…9eb5c`, `verify-identity.mjs` `944ba934…df81`;
- the `scope`, `mb1-replay`, `rechecks`, `lifecycle`, `m2-stop`, `evidence` and `order` test files;
- the candidate, `config.toml` and the 0905Z final `c68e01d570be0271ef489416fffe735c820bc0fc20aeaf6f81ca38de42c991bd`
  (preserved, not edited).

**§8 (Grep tool, executed):** exactly the five inventory lines in three files, each hashing as phase2-plan §8 records. The
harness literal is still at line 40.

## 6. Residuals (stated, not claimed)

- **M1 (carried from 0405Z, open):** the binding and the route proof still never prove that they reach the same Postgres. It
  closes only after the read-only live read of the binding (final arguments), the context endpoint and the 55321/55322
  listeners, and a reviewed listener rule. Not done.
- **L1's scope:**
  - Scheme only. `DOCKER_CONTEXT`, `~/.docker`'s current context, and a `unix://` socket of a second runtime are not
    refused. The live read records the endpoint.
  - `unix://` with no path is refused, even though Docker would use its default socket. That is conservative.
- **L2:** an exec by ID fails closed on a replaced container. It does not prove that the container is what 127.0.0.1:55322
  reaches (that is M1).
- **L3:** the behavioural kill is not shown (§4).
- **L4:** SF-2's incident path is not written.
- **Informational:** I1 (widen IPv6 only beside IPv4, at the live read; no widening now) and I2 (the scan's computed
  specifiers) are unchanged.
- **Review:** self-review only; subagents are forbidden. A fresh independent review follows.

## 7. Still open

M1, SF-1 to SF-6, finding 5, the remaining lows (three files over 400 lines and the old citations), the read-only live read,
§5, §6 (55321) and §7, B1, B2, box 3 as a whole, and any shared apply.

## 8. Commands and permissions (this session)

| Command | Result |
|---|---|
| `rtk proxy git status --short`, `rtk proxy node --version` | as shown; `v22.23.1` |
| `rtk proxy sha256sum …` | phase start, after GREEN, the §8 files |
| `rtk proxy node --test --test-reporter=spec --test-reporter-destination=/tmp/fitlog-mb1-sf7b/{red1,green1,green2}.txt <7 files>` | §3 |
| `rtk proxy node --test --test-reporter=tap --test-reporter-destination=/tmp/fitlog-mb1-sf7b/final.tap scripts/backend/*.test.mjs` | once, §3 |
| `rtk proxy mkdir -p …`, `rtk proxy cp …` ×6 | **Denied**; the mutation sequence stopped (§4) |
| Grep, Read, Edit, Write | inspection, the code and tests, the records, and the scratch README `/tmp/fitlog-mb1-sf7b/README.txt` |
| Not used | subagents, launchers, commits, staging, any runner, Docker, CLI, database or network command |
