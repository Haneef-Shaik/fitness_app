# MB-1 SF-7: Docker's binding of the shared stack, the staged route proof, the `shared` pin, and L1/L3 (pure code, no live run)

Attempt 1 · branch `codex/mb1-identity` · base local `main` `2a95726` · uncommitted working tree · 27 October 2026.
Codex AUTH-01 (owner delegation), one bounded phase, after SF-0's independent review
[`final-2026-10-27T0605Z.md`](../../../evidence/MB-1/final-2026-10-27T0605Z.md) (no critical, high or new medium finding;
282 pure tests). **Nothing is Done and no Done-when box is met.** SF-1 to SF-6, finding 5, B1, B2, the rest of box 3 and any
shared apply stay open (§8).

## 1. Scope, and what did not run

- **Done, test-first:** review 0405Z finding 1 (the medium, the shared-target binding), in 0605Z's scope: a pure binding
  parser, its wiring in every 55321 command, the binding read again before `shared-apply`'s final guards, a STOP on a changed
  binding after `migration up`, and the staged route proof. Also 0405Z finding 4 (the `shared` pin in `readState`), 0605Z L1
  (export and importer scope) and 0605Z L3 (record corrections).
- **Accepted, not done (0605Z L2):** Codex accepts the residual. The byte-move proof stays syntactic and inherited; the
  verifier was not run or retried, and no byte-for-byte proof of the original move is claimed. It can no longer run anyway:
  SF-7 edits moved lines.
- **Not run, by the brief:** the runner, the replay directory (not read, listed or written), Docker, the Supabase CLI, any
  database, SQL or network call, subagents, launchers, commits and staging. 55321 got nothing. No SQL, config, environment,
  dependency or contract file changed. The raw finals (0535Z, 0605Z) are not edited.
- **Policy:** PRD §16.1 and frozen 003 override stale agent text. Gym staff never read or write private health data, whatever
  the consent. SF-7 opens no data path: the candidate and `config.toml` hash unchanged.

## 2. What changed

| File | Lines | Change |
|---|---|---|
| `mb1-replay-binding.mjs` (new, pure) | 95 | `BINDING_LABEL` `com.supabase.cli.project`; `BINDING_FORMAT` `{{.Id}}\|{{.Name}}\|{{index .Config.Labels "com.supabase.cli.project"}}\|{{json .NetworkSettings.Ports}}`; `SHARED_BINDING` (`supabase_db_…` 5432/tcp at 55322, `supabase_kong_…` 8000/tcp at 55321); `replayBinding` (the mirror, 56422/56421); `bindingArgs`, `bindingLine`, `bindingProblems`, `bindingResult`, `routeProof` |
| `mb1-replay-live.mjs` | 159 | `sharedBinding(ctx, consequence)` (one `docker inspect`, SHORT timeout, refuses on any problem); `sharedRunning` calls it last and returns `{ container, binding }`; role comment |
| `mb1-replay-shared.mjs` | 173 | `stagedRoute`; `bindingUnchanged`; `shared-apply`'s order (below); the after-apply binding STOP; destructuring in `sharedSnapshot`; role comment |
| `mb1-replay.mjs` (entry) | 197 | `SHARED_PIN` and its check in `readState`; four header lines |
| `mb1-replay-{exec,sql,commands}.mjs` | 76, 89, 236 | Two "Internal:" role-comment lines each (L1); no code |
| `mb1-replay-test-harness.mjs` | 341 | The `binding` call kind; `bindingOutput` fixtures; `bindingRuns` and `onBinding`; a staged `migration list` with `stagedList`, `onList` and `sharedRemote` (default: the 15 base) |
| `mb1-replay-binding.test.mjs` (new) | 124 | 6 pure tests: the format, accepted shapes, 24 refusals, failed or unfinished inspects, the replay mirror, the route proof |
| `mb1-replay-sf7.test.mjs` (new) | 213 | 5 wiring tests through `runReplay` (§3) |
| `mb1-replay-scope.test.mjs` (new) | 77 | 3 L1 tests: the entry's six exports, a scratch-fixture check of the importer scan, then the repository scan and the role comments |
| `guards`, `plan`, `phase1f`, `phase1g` tests | 277, 311, 288, 306 | Their expected call sequences gain `binding` and `migration list`, updated before the code (RED 2) |

`shared-apply`'s order is now: candidate pin, repository check, `sharedRunning` (status, names, **binding**), the fresh snapshot,
staging, input guards, staged status, **input guards again**, **the route proof**, **the binding again (equal to the first)**,
then `guardsBeforeMigrate`, `recordApplyAttempt` and `migration up`'s spawn, with no await between those three. After `migration
up`: the candidate re-hash, the guards, **the binding again (a change, a failed or unfinished inspect, or a malformed answer is a
STOP; the attempt stays recorded and `sharedApplied` stays false)**, then the exit, the applied lines and the after snapshot.
Call kinds, start to end: `inspect, status, names, binding, psql-read, status, migration list, binding, migration up, binding,
psql-read, inspect`.

- **The binding rule (fixtures only):** exactly one line per container, in order. Each line needs a 64-hex ID, its own name, the
  project label, and its port published only at the expected host port on `127.0.0.1` or `0.0.0.0`, with nothing else published.
  The two IDs must differ. The value compared later is built from the checked fields only. Problems never echo Docker's output.
- **The route proof:** `migration list --local --workdir <staged>` through `routeProof`. The replay must have exactly 15 base
  migrations and the candidate. The list must show all 16 local, the 15 base remote and the candidate local only, row by row
  (`migrationListResult`). A failed or unfinished list refuses, and so does any other row set: 16 remote, 0 rows, a different
  version. Nothing is recorded.
- **The replay mirror is held:** `replayRunning` is unchanged, so no replay command reads a binding, and `stop` and `teardown`
  behave as before (tested). The mirror exists only as a pure function with fixture tests.
- **`readState`:** refuses any `shared` that is not `^true \d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(\.\d{1,9})?(Z|[+-]\d\d:\d\d)$`. It reads
  today's `true 2026-10-26T12:51:50.578854542Z` and today's state shape (§3).
- **Lines moved by SF-7** (for reviews citing SF-0 lines): entry +4 at lines 53-56 and +2 at 105-106 (`SHARED_PIN`), so
  `readState` is now `:107-113` and `releaseHeld` `:151-160`; `exec`, `sql` and `commands` +2 from line 3; `live`
  `sharedRunning` `:119-128`, `sharedBinding` `:136-141`, `sharedFingerprint` `:142`;
  `shared` `stagedRoute` `:77-84`, `bindingUnchanged` `:89-94`, `sharedApply` `:121-141`, `afterSharedMigrate` `:148-167`.

## 3. Tests (Node v22.23.1, `rtk proxy node --version`)

| Run | Command | Result |
|---|---|---|
| Baseline, before any edit | `rtk proxy node --test scripts/backend/*.test.mjs` (14 files) | `1..133`, `# tests 282`, `# pass 282`, `# fail 0`, `# cancelled 0`, `# skipped 0`, `# duration_ms 6867.709208` |
| RED 1: tests and harness written, no binding module | the same (17 files), spec report `/tmp/fitlog-mb1-sf7/red1.txt` | 102 tests, 91 pass, 11 fail: 10 files fail to load (`ERR_MODULE_NOT_FOUND` for `mb1-replay-binding.mjs`), plus the L1 repository test. That last failure was **a bug in the test**: its own fixture strings matched its scan. It was fixed by assembling them at run time, without exempting the file |
| RED 2: interface-only stub (every export, fail closed) | the same, `red2.txt` | 296 tests, 276 pass, **20 fail, each for the intended reason**: the 6 pure binding tests; 8 existing tests whose call sequences now need `binding` and `migration list` (guards 1, plan 1, phase 1F 3, phase 1G 3); L1's missing "Internal:" comments; the 5 SF-7 wiring tests |
| GREEN, first run after the code | the same, `green1.txt` | 296 tests, **296 pass, 0 fail** |
| Final, after every mutation restore | `rtk proxy node --test scripts/backend/*.test.mjs` | `1..147`, **`# tests 296`, `# pass 296`, `# fail 0`**, `# cancelled 0`, `# skipped 0`, `# todo 0`, `# duration_ms 7231.2315` |

282 + 14 new = 296. The 147 top-level tests are 133 + 14. The MB-1 runner tests are 229 + 14 = **243**
(`scripts/backend/mb1-replay*.test.mjs`, 13 files).

**What the SF-7 wiring tests show** (all through `runReplay`, every Docker and CLI answer a harness fixture):
1. `shared-snapshot before` refuses, with exact messages and calls `inspect, status, names, binding` (no SQL), for: another
   label, 56422, 56421, an IPv6 address, malformed output, exit 1, a timeout. Evidence is written with no leak. The default
   passes and prints the binding line. The call is `docker inspect --format … <db> <kong>` with timeout 120000.
2. `shared-apply` refuses on a bad first binding. The route proof refuses with no attempt for: 16 remote, 0 rows, one remote
   version different, exit 1, a timeout. The second binding refuses with no attempt for: another ID, another address, the
   database moved, a timeout. A staged edit during the list or during the second binding is caught by the final synchronous
   guards. In a clean apply the hooks see `binding:none, list:none, binding:none, up staged:attempted, binding:attempted`.
3. After `migration up`, these are each a STOP with the attempt kept, `sharedApplied` false, no `55321-after`, and the next
   apply refused: another ID, the database moved, malformed, exit 1, a timeout. With exit 1 from the CLI and an unchanged
   binding, the binding is still read first.
4. The mirror is held: `atSharedApply` makes exactly one binding call (`shared-snapshot before`), and `teardown`'s calls are
   `inspect, names, status, names, stop, names, inspect`.
5. Today's pin `true 2026-10-26T12:51:50.578854542Z` and today's state shape read unchanged:
   - the state has nine suites, mutations `m1, m3, m2`, `banned`, no shared proof;
   - `check` passes, and `state.json`'s bytes are unchanged;
   - `shared-apply` is refused with exactly the current missing list: a generation 2 green suite, clean generation 2 diff and
     lint, matching images, the 55321-before snapshot.

   16 malformed string pins are refused before any child, with the lock released. A number and `null` keep the older refusal.
   Three well-formed other pins are read and then stopped by the fingerprint comparison.

## 4. Guard mutations (pure harness only; 17, each killed; patches in `docs/evidence/MB-1/sf7-mutations/`)

Each patch passed `rtk proxy git apply --check -v` on the clean files, with no offset. Each was applied by one exact Edit equal
to its patch. Then this ran, with its report in `/tmp/fitlog-mb1-sf7/mut-<id>.txt`: `rtk proxy node --test --test-reporter=spec
--test-reporter-destination=… scripts/backend/mb1-replay*.test.mjs` (243 tests). Then the Edit was reversed. After each module's
last restore, `sha256sum` equalled its GREEN hash (§6).

| Id | Guard broken (file:line) | Fail / 243 | Killed by |
|---|---|---|---|
| B-label | the label check (`binding:50`) | 2 | binding "anything else refuses"; sf7 "every 55321 command" |
| B-name | the container-name check (`binding:49`) | 1 | binding "anything else refuses" |
| B-ip | the host-address check (`binding:54`) | 2 | binding "anything else refuses" (IPv6, the pair, 192.168.1.5); sf7 "every 55321 command" |
| B-port | the host-port check (`binding:54`) | 5 | binding "anything else", "replay mirror"; sf7 "every 55321", "route and binding again", "after migration up" |
| B-others | nothing else published (`binding:56`) | 1 | binding "anything else refuses" |
| B-count | one line per container (`binding:70`) | 3 | binding "anything else"; sf7 "every 55321", "after migration up" |
| B-exit | a failed inspect (`binding:79`) | 3 | binding "an inspect that failed" (exit 125 with good output accepted); sf7 "every 55321", "after migration up" |
| R-count | exactly 15 base and the candidate (`binding:90`) | 1 | binding "the route proof" |
| R-exit | a failed staged list (`shared:79`) | 1 | sf7 "route and binding again", **by message only**: the route proof still refuses the empty list, so nothing applies either way |
| W-equal | the binding equality (`shared:92`) | 2 | sf7 "route and binding again", "after migration up" |
| R-guards | input guards before the route proof (`shared:132`) | 1 | phase 1G "runs from a runner-owned … staging copy" (the list ran on a changed input) |
| R-call | the route proof call (`shared:133`) | 8 | phase 1F ×3, phase 1G ×2, plan "the 55321 apply is gated", sf7 ×2 |
| W-before | the binding before the apply (`shared:134`) | 8 | the same eight |
| W-after | the binding after `migration up` (`shared:157`) | 6 | phase 1F ×2, phase 1G ×1, plan gate, sf7 ×2 |
| W-running | the binding in `sharedRunning` (`live:125`) | 13 | guards ×1, M2 stop ×1, phase 1F ×3, phase 1G ×3, plan ×1, sf7 ×4 |
| W-problems | the binding refusal (`live:139`) | 3 | sf7 "every 55321", "route and binding again", "after migration up" |
| S-pin | the `shared` pin (`mb1-replay:111`) | 1 | sf7 "0405Z finding 4" |

**Not mutated, but tested:** the ID format, the duplicate-ID check and the port map's strict field set (each has its own case
in the binding tests), and the L1 scan, which is itself a test (its scratch fixture shows it can fail).

## 5. Records corrected (0605Z L3) and the 14-file count

- `sf0.md` §4: 15 → **14** test files after the split. `checkpoint.md`'s SF-0 entry: 7 → 15 → **7 → 14**. The SF-0 handoff's
  "(15 files)" is superseded by this handoff.
- `sf0.md` §2: the function `releaseHeld` is at `mb1-replay.mjs:145-154` (original 752-761); `:172-181` is its call and the
  lock problem (both at SF-0).
- `sf0.md` §6: the 11 phase 1I patch hashes, re-hashed here and equal to 0605Z's table, are recorded there.
- The 0535Z final's hash is `ceb7969d4d20c916d6381181384f404343bc819707f32804310db9e0b3aaa5ff` (re-hashed here; handoff table).
  The raw final keeps its "fifteen"; it is preserved, not edited.
- `phase2-plan.md` §8: the harness fixture literal moved from line 39 to line 40 (SF-7's import). The scan rule, its patterns
  and its exact inventory are unchanged.

## 6. Hashes (`rtk proxy sha256sum`, executed after GREEN, again after the mutation restores)

**Before:** not re-hashed in this phase before the first edit (an omission). The pre-edit values are SF-0's (`sf0.md` §6), which
review 0605Z re-verified. The untouched files below re-hash to those values.

**After (GREEN; the four mutated modules equal these after every restore):**

| sha256 | `scripts/backend/` |
|---|---|
| `70cf2af792611dfac22dd56ec6022707b36cfa3b7a5cd4daf60db651faad254b` | `mb1-replay.mjs` |
| `ec1d7e8cb771f63960e62c0552f603ebadbd1ec388831dcde418df439924c3fe` | `mb1-replay-binding.mjs` (new) |
| `9cefbd61c334d83eac27c00fbb5aaea91648edd56bc74f6694b41791139d7323` | `mb1-replay-live.mjs` |
| `ca616247e533fd536cd7f378bf634e2afa6ce1bc3811e0251212d0a34622af3c` | `mb1-replay-shared.mjs` |
| `f77dc9e594551d91eec3867910e4b536b35cde4f8874182b7bbfde0e8c424172` | `mb1-replay-exec.mjs` |
| `f10e317f824ddd113b5d1bbfdbb4a922532fee3fde5e3244390c9a0c05a43a35` | `mb1-replay-sql.mjs` |
| `3269580e068e0c6bcf5ff0c6e5dde920ff1e11180cb62cd121d8e3c0ded1e8d3` | `mb1-replay-commands.mjs` |
| `b72db681e1be9ecb877c823854238ca6a35278f5c7c4d1b87211b61f4a30d766` | `mb1-replay-test-harness.mjs` |
| `1b3c6044f193b1d0561a8862b03d58623b2fd9e83542f18cd7fac739fa847e59` | `mb1-replay-binding.test.mjs` (new) |
| `3ea32471e11a0b636fc015076452c21f168caac2eaf37e0c86888c365b9b5e53` | `mb1-replay-sf7.test.mjs` (new) |
| `419653bc266b90373819df87884d04c872393cbebfb25515f7aa281453945e45` | `mb1-replay-scope.test.mjs` (new) |
| `86428a876bffc5a153467711ae5bc35112a8497c66dd704e35180e3eb57404a5` | `mb1-replay-guards.test.mjs` |
| `46e47e2552c57bee2a6ee6490e1cbcc29867ffe8c8d59d9ce7548eb0223a176b` | `mb1-replay-plan.test.mjs` |
| `7dfea4ab4848480e8d51915dd918946261f0299f6382d75b91c350d653fe218d` | `mb1-replay-phase1f.test.mjs` |
| `cd6687a2a14f6afeb5a4a692220202ba82028aac00d0e96b6fffea79313c7539` | `mb1-replay-phase1g.test.mjs` |

**Untouched, re-hashed equal to SF-0:** candidate `ac262f39…bdc3`, `config.toml` `67a35911…1b94`, `mb1-replay-evidence.mjs`
`6d52d70c…bb89`, `mb1-replay-target.mjs` `42219dee…9eb5c`, `mb1-replay-order.mjs` `fb6edb39…3b37`, `verify-identity.mjs`
`944ba934…df81`, and the `mb1-replay`, `rechecks`, `lifecycle`, `m2-stop`, `evidence` and `order` test files. The patch hashes
are in [handoff.md](handoff.md).

## 7. Residuals (stated, not claimed)

- **Docker's shape has not been seen live.** The label key is a string the installed CLI binary holds (one Grep hit in
  `supabase-go`, read as a file and never run). Its value being the project ID, the Kong name, `8000/tcp` and the
  `NetworkSettings.Ports` JSON are all unconfirmed. Many Docker installs publish `0.0.0.0` **and** `::` for one port. SF-7
  refuses that pair, so on such a host **every 55321 command refuses, `shared-snapshot` included**, until a reviewed first live
  read decides any widening. That is fail closed, as the brief asks.
- **What the binding proves:** that Docker publishes the container the snapshots read at 55322. It does not prove that the host
  routes `127.0.0.1:55322` to Docker. On macOS a socket bound to `127.0.0.1:55322` could shadow a `0.0.0.0` publish. The route
  proof (remote versions) and the snapshots (content) are cross-checks, not an identity proof. The window between the last
  binding read and the CLI's connect stays; the after-apply binding sees Docker-side changes only.
- **`prepare`** still pins any fingerprint `sharedFingerprint` accepts. A pin that `readState` refuses makes every later command
  refuse (fail closed). Not changed (scope).
- **Finding 5** (the staged `.temp`/`.branches` allowlist): not done; it goes to SF-3.
- **I1** (spawning the entry as a process) needs its own authorization and was not done. **I2** (parallel test files) is
  unchanged.
- **The L1 scan** covers the whole repository except `node_modules` and dot-directories. A comment quoting a specifier counts,
  which errs toward false alarms.
- **Reviews:** this phase did a self-review only. Subagents are forbidden by the brief, so a fresh independent review follows.

## 8. Still open (unchanged by SF-7)

SF-1 (durable state write; one-shot suites), SF-2 (the STOP-clearing procedure), SF-3 (ino/ctime, finding 5, the
single-writer condition stands), SF-4 (75 s against 90 s), SF-5 (exact mutation SQL pins), SF-6 (a run-time line), the
remaining lows (three files over 400 lines, the comment names in `mb1-replay-evidence.test.mjs:644/666/674`, old line
citations), **the first live read of Docker's shape** (its own read-only authorization), §5, §6 (55321) and §7, **B1, B2,
box 3 as a whole, and any shared apply**.

## 9. Commands and permissions (this session)

| Command | Result |
|---|---|
| `rtk proxy ls docs/plan/runs/MB-1/` | **Denied** (orientation); not retried. Glob replaced it |
| `rtk proxy node --version` | `v22.23.1` |
| `rtk proxy node --test scripts/backend/*.test.mjs` | Baseline and final. **Both piped through `tail`** to shorten the output; the counts are quoted above |
| `rtk proxy node --test --test-reporter=spec --test-reporter-destination=/tmp/fitlog-mb1-sf7/<name>.txt …` | RED 1 (first try: exit 7, its folder was missing, made with Write), RED 2, GREEN, 17 mutation runs |
| `rtk proxy node --check scripts/backend/mb1-replay-binding.mjs` | exit 0. The other files are parsed by the 13 test processes that load them |
| `rtk proxy git apply --check -v <patch>` × 17 | All apply, no offset |
| `rtk proxy sha256sum …` | GREEN, after each module's restores, untouched files, patches, review copies, the phase 1I patches |
| Grep | the label key in the CLI binary (count 1); the §8 scan: exactly the five inventory lines in three files; the 17 patches add none |
| Not used | subagents, launchers, commits, staging, any runner, Docker, CLI, database or network command |

Scratch, not evidence: `/tmp/fitlog-mb1-sf7/{README.txt,red1.txt,red2.txt,green1.txt,mut-*.txt}`.
