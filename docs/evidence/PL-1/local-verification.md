# PL-1 · Local verification of the CI wiring (offline)

| Field | Value |
|---|---|
| Date | 27 October 2026 |
| Worktree | `/Users/Adya/.codex/worktrees/fitlog-pl1-ci/fitness_app`, branch `codex/fitlog-pl1-ci`, `HEAD` `c8a5d57`, PL-1 files uncommitted |
| Runtime | `rtk proxy node --version` → `v22.23.1` (the `.node-version` pin). macOS. No Linux run: the first one is the hosted run |
| What ran | Node tests, Git in scratch repositories and a scratch clone under the OS temporary directory, and read-only uses of Prettier 3.6.2 and `yaml` installed in QA-9's worktree |
| What did not run | Docker, Supabase, any database, `pnpm install`, `pnpm check`, `pnpm backend:test`, any network call, push, pull request or GitHub API call |
| Runtime proof versus source review | Everything in §1–§5 was executed and its output is quoted. §6 lists what only source review supports, and what only the hosted run can prove |
| Later phase | This file records phase 1 (25 tests, one workflow guarded from inside its own job). The correction phase for review 0535 (three required checks, 34 tests) is in [review-0535-corrections.md](review-0535-corrections.md). The one for review 0705 (35 tests) is in [review-0705-corrections.md](review-0705-corrections.md). This file's phase-1 content is unchanged |
| Stale sections (review 0705 F6) | **§3 to §5 are phase 1 only.** §3's 29 mutants ran against the old guard: G2, G5, G6, G7 and G9 target code that no longer exists, and the script can't run on the current files. §4's Prettier result is for older versions of four files. §5 parsed an older `backend-ci.yml`. **Neither current workflow has been through a YAML parser, and the current guard has no outside mutation evidence** |

## 1. Test-first runs

Commands are given exactly; every shell command went through `rtk proxy`.

| # | Command | Result |
|---|---|---|
| 1 | `rtk proxy node --test scripts/ci/backend-ci.test.mjs scripts/ci/workflow-guard.test.mjs` (tests written, no implementation) | Exit 1. Both files fail to load: `ERR_MODULE_NOT_FOUND … scripts/ci/backend-ci.mjs` |
| 2 | Stubs exporting only the names. `rtk proxy node --test --test-reporter=dot scripts/ci/backend-ci.test.mjs` | **RED:** 19 tests, 19 `X`. Each fails at its own assertion, for example `Expected values to be strictly deep-equal: + [] - ['exec','supabase','db','diff',…]` |
| 3 | The helper written; the same command | 16 pass, 3 fail. All three were a test bug: `assert.throws` matches a RegExp against `String(error)`, which starts `Error: `, so `^`-anchored patterns could not match. The patterns gained `^Error: `; no assertion was weakened |
| 4 | The same command | **GREEN:** 19 of 19 |
| 5 | The workflow written, guard still a stub. `rtk proxy node --test --test-reporter=dot scripts/ci/workflow-guard.test.mjs` | **RED:** 5 tests, 5 `X`; for example `continue-on-error on the tests: not implemented` |
| 6 | The guard written; `--test-reporter=spec`, same file | **GREEN:** `ℹ tests 5`, `ℹ pass 5`, `ℹ fail 0` |
| 7 | `rtk proxy node --test --test-reporter=dot scripts/ci/*.test.mjs` (as the workflow step runs it) | 24 of 24 |
| 8 | Prettier 3.6.2 `--check` (§4) | 4 files not in format |
| 9 | Prettier `--write` on the four new files only; `--check` again; run 7 again | `All matched files use Prettier code style!`; 24 of 24 |
| 10 | Self-review found the default `cliRunner` untested. Test 20 added (exit code, both streams, an argument full of shell metacharacters passed unchanged, a missing binary). Run alone with `--test-name-pattern="default runner"` | Pass. It was written after the code, so it is shown by mutants M19 and M20 (§3), not by a RED run |
| 11 | **Final:** `rtk proxy node --test scripts/ci/backend-ci.test.mjs scripts/ci/workflow-guard.test.mjs` | `# tests 25`, `# pass 25`, `# fail 0` |
| 12 | **Final:** `rtk proxy node --test --test-reporter=dot scripts/backend/*.test.mjs` (unchanged files; database-free) | 39 of 39 |
| 13 | `rtk proxy git status --short` | `?? .github/workflows/backend-ci.yml`, `?? docs/plan/runs/PL-1/`, `?? scripts/ci/` (and, later, `docs/evidence/PL-1/`). `rtk proxy git diff --stat` printed nothing: no tracked file changed, `mobile-ci.yml` included |

## 2. AR-1 L1 reproduced and fixed, in a scratch clone

[probes.md §1](probes.md#1-l1-probemjs). The probe clones the worktree's committed `HEAD` into the OS temporary
directory, copies the five PL-1 files in, detaches `HEAD` and deletes every local branch, as a pull-request
checkout has none. It then runs the real commands with a push-shaped event payload. Final run, verbatim:

```text
clone HEAD c8a5d57c3a0999760ad21fd1aca4899ca76b5adf (detached), trusted base 5fefc31d6d87fab87289c3732888302171f595d4; local branches: ""
--- test 18 with no local main (AR-1 L1): exit 1
    not ok 1 - this repository passes: only migrations and the configured seeds are SQL, and no base migration changed
    check-sql-sources failed: Cannot resolve base main: fetch it (PL-1) or set FITLOG_BASE_REF (exit 1)
--- backend-ci base: exit 0
    Trusted base 5fefc31d6d87fab87289c3732888302171f595d4 from the push event, for FITLOG_BASE_REF and FITLOG_CONTRACT_BASELINE; it forks from HEAD at 5fefc31d6d87fab87289c3732888302171f595d4
--- backend-ci base, contract variable at HEAD: exit 1
    backend-ci base failed: FITLOG_BASE_REF=5fefc31d… and FITLOG_CONTRACT_BASELINE=c8a5d57c… differ; both guards must judge against one trusted commit
--- backend-ci vendored: exit 0
--- backend-ci local-main: exit 0
    Created refs/heads/main at the trusted base 5fefc31d6d87fab87289c3732888302171f595d4 for the SQL-source test
--- test 18 after local-main: exit 0
    ok 1 - this repository passes: only migrations and the configured seeds are SQL, and no base migration changed
--- check-sql-sources.mjs with CI=1 and FITLOG_BASE_REF: exit 0
    SQL sources verified: 15 migrations (15 unchanged since 5fefc31d6d87fab87289c3732888302171f595d4@5fefc31d6d87, 0 new); configured seeds supabase/seed.sql, supabase/development-catalogue.sql; no other SQL under supabase/
--- node --test scripts/ci/*.test.mjs in the clone, CI env set: exit 0
{"before":1,"baseStatus":0,"mismatch":1,"vendored":0,"created":0,"after":0,"direct":0,"helperTests":0}
```

(The two long SHAs in the mismatch line are shortened here only.) The last run shows the CI tests passing
with `CI=1`, `GITHUB_ACTIONS=true` and both base variables set in the environment, so their own negative cases
stay isolated from the runner's variables. The scratch directory was removed.

## 3. Mutation checks: 29 of 29 killed (phase 1 only; stale, see the header)

[probes.md §2](probes.md#2-mutationsmjs). Each mutant edits one exact piece of a guard in a scratch copy (the
worktree is only read), runs both CI test files there, and restores the piece. Baseline 25 of 25; restored
25 of 25; the copy removed. Final run, after formatting:

| Mutant | Break | Failing test(s) |
|---|---|---|
| M1 | The two base variables may differ | the two variables must name one commit |
| M2 | No cross-check with the event payload | the base must be the event payload's own base |
| M3 | The all-zero SHA accepted | a missing, blank, all-zero, short, symbolic or padded base fails before Git runs |
| M4 | Short or symbolic refs accepted | the same |
| M5 | Any named event trusted | only pull_request and push events carry a trusted base |
| M6 | A base at HEAD accepted | the base must be a commit in this clone …; base, vendored and local-main print one line … |
| M7 | An existing `main` is moved | local-main creates refs/heads/main …; a push to main keeps its checked-out main |
| M8 | A tag named `main` accepted | a tag named main that shadows the branch fails … |
| M9 | `local-main` outside Actions | the same |
| M10 | `node_modules` matched in one letter case only | Git may track no path inside a node_modules folder (QA-9 R6) |
| M11 | Extra applied versions ignored | replay passes only when the database records exactly the migration files as applied |
| M12 | A non-empty diff passes | diff reads the recorded CLI output …; diff fails closed … |
| M13 | Drop statements ignored | diff reads the recorded CLI output … |
| M14 | The diffed schemas not checked | both diff tests |
| M15 | Lint findings ignored | lint reads the recorded CLI output … |
| M16 | The CLI's exit code ignored | 4 tests: both diff/lint failure tests, the refused-stack test, the runner test |
| M17 | A repeated summary accepted | diff fails closed … |
| M18 | The stack not confirmed before the CLI | diff and lint confirm the local stack …; a refused stack stops diff and lint … |
| M19 | A runner error reported as exit 0 | the default runner keeps the exit code … |
| M20 | The runner goes through a shell | the same |
| G1 | `continue-on-error` not named | each way to skip a step, ignore a failure, move the base or unpin an action is refused |
| G2 | Job env values not compared | the same |
| G3 | Extra definitions of a base variable not counted | the same |
| G4 | Pins not compared with `mobile-ci.yml` | the same |
| G5 | Triggers not compared with `mobile-ci.yml` | the two workflows keep one trusted base expression and one set of triggers |
| G6 | Steps not compared with the reviewed list | each way to skip a step … |
| G7 | Unknown keys allowed | the same |
| G8 | `${{ }}` allowed in `run` | the same |
| G9 | `mobile-ci.yml`'s baseline not compared | the two workflows keep one trusted base expression … |

The 29 in-test workflow mutants (test 24, "each way to skip a step …") are separate: each is an edited copy of
the real workflow that must produce a named problem, and a target missing from the text fails the test.

## 4. Formatting (phase 1 only; stale, see the header)

QA-9's touched-file rule (not yet on `main`) will check these four `.mjs` files once it is. They were checked
and formatted with the Prettier 3.6.2 installed in QA-9's worktree, loaded by path, with the options of QA-9's
`.prettierrc.json`, and reading no config:

```bash
rtk proxy node /Users/Adya/.codex/worktrees/fitlog-qa9/fitness_app/node_modules/prettier/bin/prettier.cjs \
  --no-config --no-editorconfig --print-width 100 --single-quote --check \
  scripts/ci/backend-ci.mjs scripts/ci/backend-ci.test.mjs scripts/ci/workflow-guard.mjs scripts/ci/workflow-guard.test.mjs
```

Final result: `All matched files use Prettier code style!`. The `--write` run touched only these four files.
Nothing in QA-9's worktree was written.

## 5. The workflow as GitHub's YAML would read it (phase 1 only; stale, see the header)

[probes.md §3](probes.md#3-yaml-parsecjs). The guard reads the workflow as text. To check that its text
means what the guard assumes, `backend-ci.yml` and `mobile-ci.yml` were parsed with the `yaml` package
installed in QA-9's worktree, in strict mode with unique keys. Result, abridged:
- top-level keys `name, on, permissions, concurrency, jobs`; `on` deep-equals `mobile-ci.yml`'s
  (`"sameOnAsMobile": true`); `permissions` `{ "contents": "read" }`;
- one job, `backend`, with keys `runs-on, timeout-minutes, env, steps`, and `timeout-minutes` `30`;
- `env.CI` `"1"`, and both base variables equal to `mobile-ci.yml`'s `FITLOG_CONTRACT_BASELINE`
  (`"sameBaselineAsMobile": true`);
- 14 steps in the reviewed order, with `with` values `persist-credentials: false` and `fetch-depth: 0`, and
  `if: failure()` only on the last.

## 6. What this does not prove

- **Not run here, by instruction or by design:** Docker, `supabase start`, `db diff`, `db lint`, the `replay`
  command against a real database, `pnpm install`, `pnpm check` and `pnpm backend:test`. The helper's
  database-facing commands are tested with injected runners. The diff and lint parsers are tested against
  AR-1's **recorded** output of the same pinned CLI (2.121.0): `replay-final-diff.log`,
  `replay-drift-probe.log` and `replay-lint.log`.
- **Source review only:** that GitHub's `pull_request` and `push` payloads carry `pull_request.base.sha` and
  `before`, and that the runner exposes `GITHUB_EVENT_PATH` and `GITHUB_ACTIONS=true`. This is how
  `mobile-ci.yml`'s reviewed baseline already works. `WebFetch` and `WebSearch` were not available in this
  session, so no current GitHub or Supabase documentation was re-read. The Supabase CLI decisions rest on the
  pinned version and AR-1's recorded runs of it.
- **Which stream** the CLI writes its JSON summary to is unknown; the parser accepts either, and requires exactly one.
- **Only the hosted run can prove** that the job is green on `ubuntu-latest`: image pulls, the start time under
  the 30-minute limit, that `supabase start` applies the seeds as `db start` did for AR-1, that the storage
  schema diffs empty under a full stack (AR-1 diffed a database-only stack), and the lint result there.
  [hosted-proof-procedure.md](hosted-proof-procedure.md) lists the expected lines and the stop conditions.
