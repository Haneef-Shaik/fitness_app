# MB-1 phase 1C — guarded replay preparation (box 3; no database execution)

| Field | Value |
|---|---|
| Goal and box | MB-1, box 3: "A revoked session fails on its next request, and a user can read only their own profile (cross-user test)" |
| Attempt | 1, phase 1C, a bounded phase: guarded replay preparation only. Local Claude executor; the Codex coordinator acts under the owner's AUTH-01 delegation |
| Worktree | `/Users/Adya/.codex/worktrees/fitlog-mb1/fitness_app`, branch `codex/mb1-identity`, base local `main` `2a95726`. Nothing committed |
| State | **All six findings of review 39fe1fb5 are addressed in code, tests and the plan, ready for the coordinator's independent review.** No database, Supabase, Docker, network or provider call was made. No replay directory exists. The candidate SQL is **unapplied**. Box 3 is **not met**; B1 and B2 stay open |
| Read | RTK rules; the `run-goal` skill; [checkpoint.md](checkpoint.md), [phase1b.md](phase1b.md), [phase1.md](phase1.md), [phase2-plan.md](phase2-plan.md); the full review `/tmp/fitlog-39fe1fb5-final.md`; `local-stack.mjs`, `verify-contracts.test.mjs`, `verify-fixtures.mjs`; AR-1's recorded CLI 2.121.0 logs (`docs/evidence/AR-1/replay-start.log`, `replay-final-diff.log`, `replay-lint.log`, `replay-verification.md`) |
| Review | [review-39fe1fb5-final.md](../../../evidence/MB-1/review-39fe1fb5-final.md), verbatim with provenance 39fe1fb5: no critical, one high, one medium, four low |
| Superseded in part | By [phase1d.md](phase1d.md), after review a102fb68: the 83-test count below is phase 1C's own (phase 1D's is 95), and the runner's executor, CLI path, stop arguments, shared-apply safeguards and locking are as phase 1D describes. This record stays as written |

## 1. Files

All are uncommitted.

| Path | Change |
|---|---|
| `scripts/backend/mb1-replay.mjs` | New. The one guarded runner for every replay command (finding 1); see §3 |
| `scripts/backend/mb1-replay-target.mjs` | New. The literal target, the owned directory (sentinel, manifest, inventory), config and port checks, file-by-file removal |
| `scripts/backend/mb1-replay-evidence.mjs` | New. Pure rules: output allowlists, redaction and secret scan; the suite verdict; snapshots and their comparisons; ban answers; images; the read-only SQL check; generated SQL |
| `scripts/backend/mb1-replay.test.mjs` | New. 15 runner tests (one of them spawns a local node echo script to test the real executor) with an injected executor (Docker and the CLI in memory), an injected suite, and a temporary directory mapped to the literal `/tmp` path |
| `scripts/backend/mb1-replay-evidence.test.mjs` | New. 17 pure tests; secret-shaped values are built at run time and injected |
| `scripts/backend/verify-identity.mjs` | Finding 5: stop flag, waiting for creations in flight, run-id fixture emails, unknown creations named; injectable `fetch`, `signals`, `exit`, `settleMs`, `runId`; one check renamed so all 27 names are unique |
| `scripts/backend/verify-identity.test.mjs` | Four new tests (12 in all), each with a fetch double and a stub that fails if the real fetch is called |
| `docs/evidence/MB-1/review-39fe1fb5-final.md` | New. The review, verbatim, under a provenance header |
| `docs/plan/runs/MB-1/phase2-plan.md` | Rewritten around the runner: literal values, no shell variable, no `rm -rf`, teardown separately authorized |
| `docs/plan/runs/MB-1/phase1.md`, `phase1b.md`, `checkpoint.md` | Stale "not run" statements corrected with the prior 8/8 and this phase's results; finding 4 and 5 notes |
| `docs/plan/runs/MB-1/phase1c.md` | New. This record |

**Unchanged on purpose:** the candidate migration (still unapplied) and every other migration; `local-stack.mjs` and the
other `verify*.mjs` runners; the root `package.json`, schema, contracts, mobile, domain, CI and the lockfile;
`status.json`, the ledger and `GOALS.md`; `phase1-red.log` and `security-phase1.md` (historical).

## 2. Dispositions of review 39fe1fb5

Test numbers are from the final 83-test run of `node --test scripts/backend/*.test.mjs`.

| # | Severity | Finding | Disposition | Where |
|---|---|---|---|---|
| 1 | High | Replay commands can hit the shared 55321 stack; raw `$R`/`$D`; `rm -rf` | **Fixed.** Every replay command goes through `mb1-replay.mjs`, which takes only the literal `/tmp/fitlog-mb1-replay-YYYYMMDD` (a real calendar date; `/private/tmp` accepted only as its real location) and checks, before every command: the owned directory (not a link, sentinel, manifest sha256s, no foreign entry, project id and the eight ports), the shared container's pinned start time, the verified CLI flags, `--confirm` for stop and teardown, the plan order, and live status at 56421/56422 with the replay container running. Lifecycle commands re-check 55321 after. Supabase always gets `--workdir <literal path>`. No `rm -rf`: teardown removes only what it owns, file by file, and is not authorized now. The plan has no shell variable; `YYYYMMDD` is written in at authorization and refused until then | `mb1-replay*.mjs`; tests 36–50 (§4); phase2-plan.md |
| 2 | Medium | `start` output with keys would be saved | **Fixed.** Every CLI output passes a per-command allowlist (built from AR-1's recorded CLI 2.121.0 logs), then redaction, then a secret scan; unknown lines are withheld and counted. `status` output is never printed. Errors keep only redacted error lines. `--evidence` writes the filtered text itself; the plan's §8 scan stays. Proof of 15 and 16 migrations is P3, not `Applying` lines | `mb1-replay-evidence.mjs`; tests 19–23, 41, 42 |
| 3 | Low | A kill judged by exit code; no spacing | **Fixed.** The verdict is mechanical: 27 checks in order, exactly the expected `not ok` names, exit code and summary, no setup, cleanup, refusal or signal line. Suites on one stack run at least 75 s apart. A mutation counts only after its snapshot shows exactly its own change (M1 `P2.profile_read.qual`; M2, M3 `P1.fn_definition_md5`); a restore only after nothing differs. Every SQL file is hash-pinned | tests 25–28, 31, 46, 48, 49 |
| 4 | Low | Ban answer has two branches; images unchecked | **Fixed.** `live` (`HTTP 200`) or `ended` (`HTTP 403` with `session_not_found`); anything else stops. Every run's answer must equal the first one's, 55321's included. `images` requires the same db, auth and REST images on both stacks | tests 27, 32, 47, 49 |
| 5 | Low | Ctrl-C during setup can leak an unnamed account | **Fixed (both options).** After a signal no request but cleanup's starts; cleanup waits up to 30 s for creations in flight, deletes every account created (even after the signal), and names by email any creation that never answered or failed. Emails carry a per-run id | tests 80–83 (§4) |
| 6 | Low | The read-only runner trusts its file; SQL not kept | **Fixed.** The preconditions file is generated once, must pass a read-only SQL check (no transaction control, setting change, write, side-effect function, psql meta-command, variable or dollar quote), is hash-pinned, and runs with the session default read-only (`PGOPTIONS`) and a proof query in the same session. `retain` keeps every SQL file that ran and the manifest as evidence; teardown refuses until it has | tests 29, 33, 34, 45, 50 |
| — | Note | Stale "unit test not run" records | **Corrected** with the prior 8/8 (Codex 06:45 UTC; the reviewer's own run) and this phase's runs | phase1.md §4, §5; phase1b.md §1, §4; checkpoint |
| — | Note (finding 7 gap) | `verify-freezes.mjs:4` has the status-parse pattern too | **Recorded as a request** (§5): outside this phase's writes, with `verify.mjs:6` and `verify-gym.mjs:4` | §5 |

## 3. Decisions in this phase

- **One runner, many small checked commands** (`prepare`, `verify-cli`, `check`, `start`, `migrations`, `add-candidate`,
  `migrate`, `snapshot`, `suite`, `mutate`, `diff`, `lint`, `images`, `shared-snapshot`, `shared-apply`, `shared-suite`,
  `retain`, `stop`, `teardown`). Each runs the same guard sequence (runner header comment; phase2-plan.md rules), so no
  step of the plan is a raw Supabase or shell command except `pnpm backend:test` and read-only `lsof`/`docker ps`.
- **The owned directory.** `prepare` creates it once (never reuses one), writes the sentinel first and the manifest
  last, so an interrupted prepare leaves a directory every command refuses. Before every command, any entry the runner
  did not create is refused, because `supabase start` would apply an unpinned migration file. Only the CLI's own
  `supabase/.temp` and `supabase/.branches` are tolerated. If the CLI writes anything else, the runner refuses (no
  guessing).
- **The shared stack is pinned, not trusted.** `prepare` requires 55321's database container to be running and records
  its `State.StartedAt`; every command compares it before, and lifecycle commands after. A change is a `STOP`.
- **No guessed CLI behaviour.** `verify-cli` must find each flag in the CLI's own `--help` before any Supabase command
  runs. Output allowlists come from AR-1's recorded 2.121.0 output; anything else is withheld and counted, never printed.
- **The 55321 apply is gated mechanically.** `shared-apply` needs red, M1–M3, a generation 2 green, a clean generation 2
  diff and lint, matching images and an equal `55321-before` snapshot, and refuses if the repository's migration files
  are not byte for byte the 16 the replay ran.
- **Teardown is designed and tested on temporary fixtures, not authorized.** It needs `--confirm`, retained SQL, a stop
  with no replay container left, an unchanged 55321, and removes files one at a time, then empty directories, the
  sentinel last.
- **verify-identity.** The cleanup waits at most 30 s (`settleMs`) for a creation in flight; past that it names the
  email instead of hanging. The renamed check (`a session revoked before onboarding cannot complete it`) keeps all 27
  names unique; the evidence test ties the runner's list to the suite's source.

## 4. Evidence

| Command | Result |
|---|---|
| `rtk proxy git status --short` (start) | Only the PHASE1B paths, untracked |
| `rtk proxy node --test scripts/backend/*.test.mjs` (start, before any change) | `# tests 47`, `# pass 47`, `# fail 0` (8 identity tests among them) |
| Same, after writing `mb1-replay-evidence.test.mjs` (RED) | `# tests 48`, `# pass 47`, `# fail 1`: `not ok 2 - scripts/backend/mb1-replay-evidence.test.mjs` (module missing) |
| Same, after `mb1-replay-evidence.mjs` | `# tests 64`, `# pass 63`, `# fail 1`: only `the 27 identity checks are exactly the ones verify-identity.mjs runs…` (the duplicate name, RED for the rename) |
| `rtk proxy node --test scripts/backend/verify-identity.test.mjs` with the three new signal tests (RED) | `# tests 11`, `# pass 8`, `# fail 3`, each `main() finished before the creation was in flight`; the stubbed real fetch threw, so nothing reached a network |
| `rtk proxy node --test scripts/backend/*.test.mjs` after the verify-identity fix | `# tests 67`, `# pass 67`, `# fail 0` |
| Same, after writing `mb1-replay.test.mjs` (RED) | `# tests 68`, `# pass 67`, `# fail 1`: `not ok 3 - scripts/backend/mb1-replay.test.mjs` (module missing) |
| Same, after the runner, the self-review fixes and the fourth identity test | `# tests 82`, `# pass 82`, `# fail 0` |
| Same, after the real-executor test (final) | **`# tests 83`, `# pass 83`, `# fail 0`** |
| `rtk proxy node --check` on `mb1-replay.mjs`, `mb1-replay-target.mjs`, `mb1-replay-evidence.mjs`, `verify-identity.mjs` and the three test files | All exit 0, no output |
| `rtk proxy git diff --no-index /tmp/fitlog-39fe1fb5-final.md docs/evidence/MB-1/review-39fe1fb5-final.md` | Only the provenance header added, and a final newline the source lacks |
| `rtk proxy pnpm check` (regression only; its scope excludes `scripts/backend/`) | `Design rules verified`; domain `# pass 37`, `# fail 0`; mobile `Tests: 126 passed, 126 total`; plan `# pass 22`, `# fail 0`; `GOALS.md: 114 goals, 230 needs, 10 lanes; ACCEPTANCE.md: 94 ledger rows…`; `plan.json and board.html match GOALS.md` |

**Mutation checks.** Each guard was broken on purpose, the full suite run, and the guard restored exactly; afterwards a
search for the markers found none, and the suite was back to 82/82 (83/83 once the executor test was added after).

| Id | Guard broken | Test that failed |
|---|---|---|
| MC1 | Real location of the directory not checked | `a symlinked, foreign, tampered or shared-config directory is refused…` |
| MC2 | Symbolic links not refused | the same test |
| MC3 | Path pattern loosened to `/private/tmp/…` and a trailing `/` | `every target that is not the literal replay directory is refused…` |
| MC4 | No shared-stack check before a command | 8 tests, among them `the shared stack changing stops the runner…` and `the project, port, container and shared-stack checks run before every command…` |
| MC5 | Session default read-only dropped from psql | `the read-only runner sends only the pinned preconditions file…`; `the 55321 apply is gated…` |
| MC6 | Output allowlist disabled (redaction kept) | `start output keeps only allowlisted progress lines…`; `error lines are kept only when the command failed`; `a JSON summary line is kept only with known keys…`; `start and status output, CLI errors and refusals never print a key…` |
| MC7 | Redaction disabled (allowlist kept) | `a failed command keeps redacted error lines only…`; `a JSON summary line is kept only with known keys…` |
| MC8 | Setup, cleanup and refusal lines ignored by the verdict | `an exit code is never a verdict on its own…`; `a suite verdict is mechanical…` |
| MC9 | Mutation suite allowed without its snapshot proof | `the replay runs in plan order, and a mutation counts only after its snapshot proves it applied` |
| MC10 | Suite spacing 60 s instead of 75 s | `suites on one stack are spaced at least 75 seconds apart…` |
| MC11 | Teardown ignores foreign entries | `teardown keeps the SQL that ran… removes only what it owns…` |
| MC12 | Cleanup does not wait for creations in flight | `a stop signal during fixture creation waits for the creation in flight…` |
| MC13 | Requests not stopped after a signal | `after a stop signal no request but cleanup is sent, even when the signal arrives during a sign-in` |
| MC14 | `set` allowed in read-only SQL | `the read-only SQL check refuses every transaction escape…` |
| MC15 | Foreign entries not refused before every command | the symlinked/foreign directory test and the teardown test |
| MC16 | `shared-apply` without the repository-equals-replay check | `the 55321 apply is gated on every replay proof…` |

Two first attempts (MC5, MC11) put a `//` marker that commented out the rest of the line, which failed at import rather
than at the guard; they were redone with `/* */` markers and the results above are from the redone runs.

## 5. Not done, and requests

- **Not done:** any database, Supabase, Docker, network or provider call; any replay directory; applying the candidate;
  any run of the 27-check suite; any cleanup or teardown; any commit, status, ledger or `GOALS.md` edit; any change to
  the schema, contracts or root `package.json`. Box 3 is not claimed. B1 and B2 stay open.
- **Reviews:** the brief forbids sub-agents, so the `code-reviewer`, `security-reviewer` and `tdd-guide` passes were not
  run; the coordinator reviews independently before authorizing any real replay. A self-review found two gaps, fixed
  with tests: an unlisted migration file in the replay directory (now refused before every command), and `shared-apply`
  applying migrations the replay never ran (now refused).
- **Coordinator:** review this diff; then authorize [phase2-plan.md](phase2-plan.md) with the literal date written in.
  Teardown (§7) needs its own authorization.
- **Owners of `verify.mjs:6`, `verify-gym.mjs:4` and `verify-freezes.mjs:4`:** each parses `supabase status` in a way
  whose crash could print it (review 39fe1fb5 findings 2 and 7). They could take `verify-identity.mjs`'s fixed-message
  handling. Until then, phase2-plan.md §6.6 saves `backend:test` output only after the secret scan.
- **Root `package.json` owner:** wire `node scripts/backend/verify-identity.mjs` into `backend:test` after phase 2 (the
  new pure tests already run through its `*.test.mjs` glob).

## 6. Residual risks

- **The runner's state file is not hash-pinned.** It records proofs (snapshots, suites, checks). Someone who edits it by
  hand could fake a proof. The threat is a single local operator under the coordinator, and every proof is also in the
  `--evidence` files the coordinator reviews.
- **The read-only SQL check is a deny-list over SELECT statements.** The primary barriers are the hash pin (only the
  reviewed block runs) and the session default; the check is the third.
- **`--workdir` resolution is the CLI's.** The runner never passes an empty or variable workdir, checks the project and
  ports in it, checks status answers at 56421, and re-checks 55321's container after every lifecycle command; it cannot
  prove what the CLI does internally.
- **The shared-stack fingerprint catches a restart, not every change.** The 55321 snapshots (P1–P3 equal to the
  replay's) cover the schema it guards.
- **Allowlists may withhold useful lines** from CLI versions other than 2.121.0. That fails safe: the withheld count is
  printed, and P3, the snapshots and the suite verdicts are the proofs.
