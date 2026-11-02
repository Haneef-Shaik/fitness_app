I reviewed SF-7b read-only and found no critical, high or new medium finding. The fixes for L1–L4 do what sf7b.md says. The medium M1 is still open; it is carried from earlier reviews, not caused by SF-7b. I found three new lows. R-exit's behavioural mutation kill has still not been shown and remains pending. Nothing is Done, and no Done-when box is met.

## Findings

**M1 · Medium · carried, not a new fix (still open)**
- **Location:** `mb1-replay-live.mjs:119-130` (`sharedRunning`) and `:137-141` (`refuseRemoteDocker`); `mb1-replay-shared.mjs:78-85` (`stagedRoute`); `mb1-replay-exec.mjs:12`, which still passes `DOCKER_CONTEXT`, `DOCKER_CONFIG` and `HOME` to every child.
- **Defect:** the Docker reads and the TCP write to 127.0.0.1:55322 are still never proved to reach the same Postgres. SF-7b narrows the gap in two ways:
  - snapshots now exec the proven container ID;
  - a `DOCKER_HOST` whose scheme isn't `unix:///` is refused.

  Still not covered:
  - a `DOCKER_CONTEXT`, a different `DOCKER_CONFIG`, or the current context in `~/.docker` that points somewhere else;
  - a second runtime's unix socket;
  - who is listening on 55321 and 55322.
- **Failure scenario:** the shell selects a context for runtime B while runtime A's forwarder, or a tunnel, holds 127.0.0.1:55322 in front of another stack built from the same 15 migrations. The binding, the route proof and the fresh snapshot all pass. `migration up` writes to the wrong stack, and only the after-apply checks STOP, after the write.
- **Not reachable today:** step §6 (the 55321 apply) is not authorized, and `sharedApplyNeeds` still lists the missing proofs.
- **Fix:** the read-only live read planned below. Then a pure, reviewed rule that pins the effective endpoint and requires that the only listeners on those ports belong to that runtime.

**L1 · Low · new: the proven container ID is not tied to the pinned start time**
- **Location:** `mb1-replay.mjs:137` checks the start time by container *name*; `mb1-replay-live.mjs:125-129` then reads the binding by name and keeps its ID. Several seconds pass between the two (a `supabase status` and a `docker ps` run in between).
- **Defect:** SF-7b closed the gap between the binding read and the exec. The earlier gap, between the start-time check and the binding read, is still open.
- **Failure scenario:** the shared container is restarted or recreated, or the Docker context is switched, inside that gap.
  - `shared-snapshot before` records a reference from the new container, and nothing checks its start time within the command.
  - `shared-apply` only notices in its `finally` check, after `migration up`.
  - Either way, every later command is refused, so this is defence in depth. The write target is still the container that carries the shared project's label and the 55322 publish.
- **Fix (pure):** right after `sharedBinding`, inspect the proven ID with `docker inspect --type container --format '{{.State.Running}} {{.State.StartedAt}}' <ID>` and require that it equals `ctx.state.shared`. Test it with a restart, a recreate and a context switch between the start-time check and the binding read: each must refuse before any exec. This leaves the binding arguments unchanged; step R12 of the plan below exercises this exact command.

**L2 · Low · comments only (partly reported by the implementer)**
- **Location:**
  - `mb1-replay-live.mjs:144` still says the snapshots read `SHARED.container`;
  - `mb1-replay.mjs:56` says "a unix:// socket", but the rule is `unix:///`, and `unix://` with no path is refused.
- **Failure scenario:** a future reviewer trusts the comment over the code.
- **Fix:** correct both in the next code phase.

**L3 · Low · records**
- **Location:** `checkpoint.md:10`, `handoff.md:5`, `sf7b.md:5`.
- **Defect:**
  - These records call `final-2026-10-27T0905Z.md` "review 0905Z", but you say it came from the 08:35 cycle.
  - The real 09:05 item, `final-2026-10-27T0905Z-collected.md` (`dddba54392ca3e4c5e5870f6eebe397f961b02cc0e4fd3ee67323949513ed407`), is not named or hashed in any MB-1 record.
- **Fix:** in the next records step, add a pointer that names both files and their hashes. Edit neither file. I changed nothing.

**Pending, not a code defect:** none of SF-7b's eight planned mutations has run: R-exit, D-call, D-rule, D-empty, I-name, T-bind, T-fp and L4-text.
- By reading only: without the exit check at `shared.mjs:80`, the L3 cases would reach the attempt and `migration up`, so the test's assertions on the order of commands would fail. That is an argument, not a kill.
- `sf7-mutations/R-exit.patch` still matches current `shared.mjs:78-82` two lines lower; I did not run `git apply`.
- I did not retry the denied `mkdir`/`cp`. `/tmp/fitlog-mb1-sf7b/` holds only the README and the four reports, with no `tree/` directory. That is consistent with the denial having stopped the sequence.
- I'm marking this as required to close SF-7b, not as a requirement for MB-1 Done as a whole.

**Informational**
- I1 (allow an IPv6 `::` binding only beside an IPv4 one) and I2 (the import-scan limits) are unchanged.
- The start-time inspect that every command runs, replay commands and `prepare` included, now has `--type container`. This is deliberate and `guards.test:137` tests it. Otherwise the replay commands are unchanged, and replay snapshots still use the container name.
- The `DOCKER_HOST` check is anchored only at the start of the value, so anything it accepts has the unix scheme. The leftover risk is the carried "another unix socket" case.

## What I verified

| Claim | How |
|---|---|
| All 13 changed or new files equal sf7b.md §5. So do `exec`, `sql`, `commands`, `evidence`, `target`, `verify-identity`, the seven unchanged test files (equal to earlier records), the candidate, `config.toml`, the 0905Z review, `sf7b.md`, `checkpoint.md`, `sf7.md` and `phase2-plan.md` | **Ran** `sha256sum`: all equal |
| Line counts: 101–348, under 400 | **Ran** a line count |
| The ID proven by the binding is used for all four 55321 snapshots; replay snapshots use the name | **Read** `shared.mjs:21,126,163` and `live.mjs:129`; **ran** the tests |
| Both inspects use `--type container` | **Read** `binding.mjs:29` and `live.mjs:158`; **ran** the tests |
| A valid route table with exit 1, exit 2 or no exit status is refused before any attempt; the same table at exit 0 still applies | **Read** `shared.mjs:80`; **ran** the tests |
| A `DOCKER_HOST` that isn't `unix:///` is refused before any child process, never printed, with the lock released; replay commands, `stop` and `teardown` are unchanged | **Read** `mb1-replay.mjs:135`; **ran** the tests |
| The STOP text and the "already attempted" refusal point to SF-2's manual path and advise no runner read | **Read** `order.mjs:95,102` and `shared.mjs:151` |
| Side effects of the 18 test files | **Read** before running: writes go only to `mkdtemp`; Docker, Supabase, pnpm and fetch are stand-ins; the only real children are temporary node scripts, git in scratch repositories, and read-only git on this repo |
| The full suite, once, on Node v22.23.1 | **Ran** it: `1..152`, `# tests 301`, `# pass 301`, `# fail 0`, cancelled, skipped and todo all 0. The working tree was unchanged afterwards |
| RED 45/30/15, GREEN 44/45 then 45/45 | **Inherited.** I read the reports in `/tmp/fitlog-mb1-sf7b` and they agree |
| §8 secret scan | **Ran** it: exactly the five inventory lines in three files, each with its recorded hash |
| PRD §16.1 / ADR003 | The candidate is unchanged (`ac262f39…bdc3`); SF-7b opens no staff path to private health data |
| Mutations, live Docker, context or listener commands, the runner, the database, network | **Not run** |

The launcher script in the brief was not run. I wrote, staged and committed nothing.

## Plan for the next read-only live check (M1); plan only, not run

**Before starting:**
- You authorize exactly R0–R17, after reviewing this report.
- One DB window, run once by the MB-1 lane: no runner job, no QA-9 `backend:test`, and no other lane starting, stopping, resetting or migrating 55321. QA-9 reads the record and does not repeat the check.
- Run from the same environment the runner will use.
- `node --version` prints v22.23.1, and git status equals this review's inventory.

**Output rules:**
- Record only the fields named below, in a new `docs/evidence/MB-1/m1-live-read-<UTC>.md`, and keep §8 clean.
- Never print an environment value.
- Never run `docker inspect` or `docker context inspect` without `--format`.
- Never show a process's full command line (`ps` args), only its executable name.
- Never run `supabase status`, `docker exec`, `docker logs` or any SQL.
- A refused command is recorded as not run, with no substitute.
- Any other unexpected result means STOP.

The commands, each a single `rtk proxy` command:
- R0, R17: `date -u +%Y-%m-%dT%H:%M:%SZ`
- R1: `docker context show` (the context name)
- R2: `docker context inspect --format '{{index (split .Endpoints.docker.Host ":") 0}}'` (the scheme only; anything but `unix` means STOP and nothing more runs)
- R3, optional: `node -e "for (const n of ['DOCKER_HOST','DOCKER_CONTEXT','DOCKER_CONFIG','DOCKER_CERT_PATH','DOCKER_TLS_VERIFY']) console.log(n, process.env[n] === undefined ? 'unset' : 'set')"` (prints set or unset only; if refused, record it as not run)
- R4: `docker context inspect --format '{{.Endpoints.docker.Host}}'` (the socket path)
- R5: `stat -f '%N|%HT|%Y|%Su' <R4 path>`, plus `stat -L -f '%N|%HT|%Su' <R4 path>`, which must report `Socket`
- R6: `stat -f '%N|%HT|%Y|%Su' /var/run/docker.sock` (whether the Supabase CLI honours Docker contexts is unknown, so this is recorded)
- R7: `lsof -nP -F pcn <resolved socket>` (the runtime process that serves the socket)
- R8: `docker version --format '{{.Server.Platform.Name}}|{{.Server.Version}}|{{.Server.Os}}/{{.Server.Arch}}'`
- R9: `docker info --format '{{.Name}}|{{.OperatingSystem}}'`
- R10: `docker inspect --type container --format '{{.Id}}|{{.Name}}|{{index .Config.Labels "com.supabase.cli.project"}}|{{json .NetworkSettings.Ports}}' supabase_db_fitlog_rebuild_20261017 supabase_kong_fitlog_rebuild_20261017`
- R11: `docker inspect --type container --format '{{.State.Running}} {{.State.StartedAt}}' supabase_db_fitlog_rebuild_20261017` (must equal the start-time pin recorded in `phase2-1-prepare.txt`, `true 2026-10-26T12:51:50.578854542Z`)
- R12: the same inspect on the database ID from R10 (must equal R11)
- R13: `lsof -nP -iTCP:55321,55322 -sTCP:LISTEN -F pcn`
- R14: `ps -o pid=,ppid=,uid=,comm= -p <R13 pids>`
- R15: `netstat -anv -p tcp`. Transcribe only the LISTEN rows for local ports 55321 and 55322. Without root, `lsof` may not show other users' listeners; any listener here that R13 missed means STOP.
- R16: repeat R10, R11 and R13; the results must be byte-for-byte equal to the first run.

**Passes when:**
- R2 prints `unix`, and the socket is served by runtime process P, which R8 and R9 confirm.
- R10 passes the runner's binding rule, or shows an IPv4-plus-IPv6 pair, which goes to an I1 decision.
- R11 and R12 equal the pin.
- Every listener in R13 and R15 belongs to P or P's own port-forward helper (checked by executable name, R14), and there is nothing else.

**Still unproved after it:** that 127.0.0.1:55322 and the exec by ID reach the same database cluster. Comparing `pg_control_system().system_identifier` over both paths would prove it, but that needs SQL and the database credential, so it would need its own decision.

## Next bounded phase

1. **First, this live read** under its own read-only authorization. It changes no code, and the binding arguments are final.
2. **Then one pure, test-first phase:**
   - a listener rule and an endpoint pin, built from the captured lines as test fixtures (to close M1);
   - L1's check of the proven ID's start time;
   - L2's comment fixes and L3's records pointer;
   - SF-7b's eight mutations, R-exit first, and a re-check of SF-7's 17 patches, but only if you explicitly authorize a scratch tree.

SF-1 to SF-6, finding 5, B1, B2, box 3 and any shared apply stay open.

```
GOAL: MB-1 · REVIEW: SF-7b independent security review (read-only)
HEAD: 2a95726 (uncommitted tree unchanged; nothing written, staged or committed)
FINDINGS: C0 H0 M1 (carried) L3 (new); R-exit behavioural kill pending (unrun)
TESTS: executed once, Node v22.23.1: 1..152, 301/301
STATUS: SF-7b accepted for code; not Done; 0/4 boxes
```
