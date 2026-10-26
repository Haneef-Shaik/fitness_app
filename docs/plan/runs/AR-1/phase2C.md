# AR-1 · Phase 2C — tool wiring: SQL-source guard, contracts in the database, fixture runner

| Field | Value |
|---|---|
| Scope | Test-plan §1 step 4 (`verify-contracts.mjs`), §2 (`check-sql-sources.mjs` and the four SQL files), §4 Runner (`verify-fixtures.mjs`) and §5 (the `backend:test` wiring) ([test-plan](test-plan.md)) |
| Date | 26 October 2026 |
| Worktree | `/Users/Adya/.codex/worktrees/fitlog-ar1/fitness_app`, branch `codex/ar1-contract-freeze`. No git command was run by hand |
| Runtime | `node` v22.23.1 (from the test output). Nothing installed |
| **AR-1 status** | **Not complete.** No database check has run from this phase. Box 1 still needs the owner's G-1 approval. No goal, status, board or ledger entry is claimed or changed |

## Rules this phase kept

- **Writes:** only the new files below and this record. The `backend:test` line was allowed but is
  deferred (Wiring). The ADR, checkpoint, test-plan and proposal docs belong to another worker and were not
  touched. None of these was touched either:
  - `packages/domain` and `apps/mobile`;
  - every migration;
  - the snapshot, the manifest and the fixture;
  - `scripts/backend/sql/training-fixtures.sql`;
  - env and key files, and the lockfile.
- **Commands:** only `rtk proxy node --test scripts/backend/*.test.mjs` and `rtk proxy pnpm check`, plus
  one attempt to delete the retired files (Deletion, below). No database, Docker, Supabase, network or git
  command was run by hand.
- **The tests run git themselves, in scratch repositories only.** Each repository is created under the OS
  temporary directory with no user or system Git configuration, and removed afterwards. The last test
  starts the real `check-sql-sources.mjs` on this repository. That run is read-only:
  `GIT_OPTIONAL_LOCKS=0` is set, so git writes nothing to `.git`.
- **No real migration was mutated.** Every mutation shape of test-plan §2 (M2.1–M2.4) was exercised in a
  scratch repository.

## Files

| File | Change |
|---|---|
| `scripts/backend/check-sql-sources.mjs` | New. The SQL-source and migration guard (§2). No database. Self-contained, so its tests can run a copy inside a scratch repository |
| `scripts/backend/local-stack.mjs` | New, shared. The local-target guard, the argv-only runner, the `project_id` reader and the psql call |
| `scripts/backend/verify-contracts.mjs` | New. `private.contracts` against the snapshot's `persisted` section (§1 step 4) |
| `scripts/backend/verify-fixtures.mjs` | New. The runner for `scripts/backend/sql/training-fixtures.sql` (§4 Runner) |
| `scripts/backend/check-sql-sources.test.mjs` | New. 18 tests: 16 in scratch directories or repositories, 1 on config text, and 1 that runs the command on this repository |
| `scripts/backend/verify-contracts.test.mjs` | New. 13 tests with an injected runner. None reaches Docker or a database |
| `scripts/backend/verify-fixtures.test.mjs` | New. 8 tests with an injected runner. None reaches Docker or a database |
| `package.json` | **Not changed.** The `backend:test` wiring is deferred until the work is complete (Wiring, below) |
| `docs/plan/runs/AR-1/phase2C.md` | This record |
| `supabase/{contracts,contract-validation,gym-read-models,gym-freezes}.sql`, `scripts/backend/contracts.ts` | **Still present.** Deletion was authorized but the permission mode denied `rm` (Deletion, below) |

## Design

### `check-sql-sources.mjs`

It fails when any of the following holds:
- A file in `supabase/migrations/` does not match `^\d{14}_[a-z0-9_]+\.sql$`, or two files share a
  timestamp.
- `supabase/migrations/` holds a directory.
- A `.sql` file anywhere under `supabase/` (the extension is matched in any case) is neither a migration nor
  a configured seed.
- A configured seed is missing.
- Anything under `supabase/` is a symbolic link. Links are reported and never followed. `supabase/` and
  `supabase/migrations/` must be real directories.
- A migration that exists at the base was modified, deleted, renamed or retyped. Uncommitted changes count.
- **Beyond the plan:** a new migration does not sort after the base's latest migration.

**Seeds.** It reads the seed allowlist from `[db.seed] sql_paths` (`supabase/config.toml:72`). The reader
is small and fails closed. It refuses:
- a glob;
- an escape sequence;
- an absolute path, or one outside `supabase/`;
- a path in `migrations/`;
- a path that does not end in `.sql`;
- a second, dotted or misplaced `sql_paths`;
- anything unparseable.

When the key is absent, nothing is allowed.

**Base, failing closed** (test-plan §2, PL-1):
1. `FITLOG_BASE_REF` names the base. Locally it defaults to `main`.
   - In CI the variable is required. CI counts as on unless `CI` is unset, empty, `0` or `false`, the
     same rule as the contract guard.
   - Unset in CI, blank, all zeros, or starting with `-`: exit 1 before git runs.
2. `git rev-parse --verify --quiet <ref>^{commit}` and `git merge-base <commit> HEAD` must both succeed
   and print an object ID. Otherwise: `Cannot resolve base <ref>: fetch it (PL-1) or set FITLOG_BASE_REF (<git's reason>)`.
   So a missing ref, a tree, unrelated history and a shallow clone without the base all fail.
3. Every other git failure fails too:
   - the directory is not the top of its work tree;
   - there is no repository;
   - git is missing;
   - `ls-tree`, `hash-object` or `diff` fails.

**Comparison.** This does not filter `git diff --name-only` output by path. For a migration moved out of
`supabase/migrations/`, rename detection reports only the new path, so such a filter misses it. Test 5
shows this.
1. `git ls-tree -r -z --full-tree <merge-base> -- supabase/migrations/` lists every base migration with
   its mode and blob ID.
2. Each one is checked directly:
   - it is in the directory listing under its exact name (this also catches a case-only rename);
   - `lstat` says it is a regular file;
   - `git hash-object` of the working file equals the base blob.

   No rename detection, path filter or `assume-unchanged` flag can hide a change.
3. `git diff --no-renames --name-status -z <merge-base> -- supabase/migrations/` adds what only the index
   shows: a mode change, or a migration removed from the index but left on disk. Any status other than `A`
   is a problem.
4. git runs with `--no-replace-objects`, so replace refs cannot rewrite the base. Inherited `GIT_DIR`,
   `GIT_WORK_TREE`, `GIT_INDEX_FILE` and the other location variables are dropped.

### `local-stack.mjs`: the target

`localDatabase({ projectDir, expectedApiUrl, run })`:
1. It refuses an expected URL that is not `http://127.0.0.1:<port>`.
2. It reads the single top-level `project_id` from `<projectDir>/supabase/config.toml` and refuses one
   that is not a plain container name.
3. It runs `pnpm exec supabase status -o json --workdir <projectDir>` from the repository root, and
   refuses unless `API_URL` is exactly the expected URL.
4. psql then runs as
   `docker exec -i supabase_db_<project_id> psql -U postgres -d postgres -X -v ON_ERROR_STOP=1 …`.

**Defaults and output:**
- The defaults are this repository and `http://127.0.0.1:55321`, as planned.
- **There is no environment variable or command-line flag to change the target.** Another loopback
  project can only be injected from code (below).
- Status output is never echoed: errors give only the exit code, or the API URL that was refused.
- Every command is an argument array run by `spawnSync`, never through a shell.

### `verify-contracts.mjs [snapshot.json]`

1. It reads `packages/domain/contracts/manifest.json` and takes its last entry.
   - By default it compares `<version>.json`.
   - With a path, it compares that file instead, for M1.5.
   - Either way the file must be that version and must have the manifest's SHA-256. The tool never
     writes the snapshot or the manifest.
2. It queries `select coalesce(json_object_agg(name, schema order by name), '{}') from private.contracts`
   with `-At -c`.
3. It checks that both sides hold exactly the eight names `days, exercise, food, goal, instances,
   measurements, nutrients, set`.
4. It deep-compares each schema. Object key order is ignored and array order is kept. Every difference is
   reported, for example
   `persisted.set differs at /properties/reps/anyOf/0/maximum: database 1001, snapshot 1000`.

For a mutant snapshot both the hash problem and the value difference are listed, so M1.5 shows that the
database comparison itself catches the bound.

### `verify-fixtures.mjs [training-fixtures.sql]`

1. The target, as above.
2. It reads `packages/domain/fixtures/ac03-training.v1.json` as bytes. It refuses invalid UTF-8 (a BOM is
   kept), a NUL byte, or text that is not JSON, all before psql runs.
3. It runs psql with `-q -v fixture=<the exact file text> -f -`. The SQL file's bytes go on stdin, with
   `ON_ERROR_STOP=1`.
4. It passes only if:
   - psql exits 0;
   - its `training.v1 fixture text sha256 …` notice equals the file's SHA-256, so the bytes arrived
     unchanged (phase 2B finding 5);
   - the `training.v1: … passed in SQL…` notice is present.
5. It prints one line naming the fixture, its SHA-256, the pass notice, the SQL file and the container.

## Commands and results, in order

| # | Command | Result |
|---|---|---|
| 1 | `rtk proxy node --test scripts/backend/*.test.mjs`, with only the three test files written (**RED**) | Exit 1. `Error [ERR_MODULE_NOT_FOUND]: Cannot find module '…/scripts/backend/check-sql-sources.mjs'`, and the same for `local-stack.mjs` from both verify tests. `# tests 3`, `# pass 0`, `# fail 3` |
| 2 | Same, after writing the four modules (**GREEN except the real tree**) | Exit 1. `# tests 39`, `# pass 38`, `# fail 1`. The one failure is `this repository passes…` (test 18), the planned §2 step-1 RED. The failure lists exactly the four files and no migration problem: `supabase/contract-validation.sql is SQL outside supabase/migrations/ and not a configured seed`, then the same line for `contracts.sql`, `gym-freezes.sql` and `gym-read-models.sql` |
| 3–5 | Mutation runs (next section) | Each failed as expected |
| 6 | Same, after restoring every mutation | `# tests 39`, `# pass 38`, `# fail 1`, test 18 only, with the same four lines |
| 7 | `rtk proxy rm -- supabase/contracts.sql supabase/contract-validation.sql supabase/gym-read-models.sql supabase/gym-freezes.sql scripts/backend/contracts.ts` | **Denied** by the permission mode ("running in don't ask mode"). Nothing was deleted. The files were not removed by any other route |
| 8 | `rtk proxy pnpm check` | Exit 0. Domain and mobile `tsc` clean. `eslint . --max-warnings=0` clean and `Design rules verified: raw visual values fail; semantic tokens pass.` Domain `# tests 37`, `# pass 37`, with `fixture sha256 bc0672b5d26aa93b1e9be41219a0b20db1997913a37d6a9a0b2aac01ed1e1877` and the contract baselines `HEAD@3040ccf1bdc0: checked`, `main@9f148c13e093: checked`. Mobile `Tests: 126 passed, 126 total`. Plan `# tests 22`, `# pass 22`. `GOALS.md: 114 goals, 230 needs, 10 lanes; ACCEPTANCE.md: 94 ledger rows, every PRD scenario and decision covered`, `plan.json and board.html match GOALS.md` |

`pnpm check` does not run `scripts/backend/*.test.mjs` (residual 5).

## Mutation checks on the new guards

Each break was made in a new, untracked file, then reverted by exact string replacement. Afterwards a search
of `scripts/backend` for `false &&` and `startsWith('http://127` found nothing, and run 6 matched run 2.
`git diff` cannot prove a restore of untracked files, and `shasum` was not a permitted command.

| ID | Break | Run | Failure seen |
|---|---|---|---|
| G1 | `check-sql-sources.mjs`: the `git hash-object` comparison disabled (`false && …`) | 3, and 4 alone with G2 | Test 3 (assume-unchanged): `Input: ''`, so git diff alone sees nothing. Tests 2 and 4 (`edit`) got only git diff's `… is modified against the base main@… in the index or working tree (git diff M)` instead of `was modified since the base` |
| G2 | `check-sql-sources.mjs`: CI detection disabled (`inCI = (env) => false && …`) | 5, alone | `# pass 36`, `# fail 3`. Test 12: `Missing expected exception: {"CI":"true"}`. Test 17: the command's stderr lacked `FITLOG_BASE_REF must be set in CI…`. Test 18 is the real tree, as before |
| G3 | `verify-fixtures.mjs`: the hash comparison disabled | 3 | Test 34: expected `psql received fixture text with sha256 0000…, but packages/domain/fixtures/ac03-training.v1.json has sha256 bc0672b5…1877`, got `[]` |
| G4 | `local-stack.mjs`: `apiUrl !== expectedApiUrl` loosened to "starts with `http://127.0.0.1`" | 3 | Test 38: `Missing expected exception`. Test 31: `main` ran the database step instead of refusing (`private.contracts did not come back as one JSON object ("")`) |

Run 3 had all four breaks at once: `# pass 29`, `# fail 10`. The tool display cut the middle of that output
(about 9 KB), so tests 10–18 of that run are not visible. Run 4 had G1 and G2 only: `# pass 33`, `# fail 6`,
with tests 2, 3 and 4 visible. Run 5 had G2 alone, to make its failures visible.

**Test-plan mutations M2.1–M2.4 on this repository were not run.** They need direct
`node scripts/backend/check-sql-sources.mjs` runs and shell redirections that were not permitted. Their
shapes are tests against scratch repositories:

| Plan check | Test |
|---|---|
| M2.1 | 8 |
| M2.2 | 2 |
| M2.3 | 13 |
| M2.4 | 12, and 17 for the exit code and message of the command itself |

## The four SQL files (QA-1 F-8h; 003 §7)

**Method.** Each statement was read against the migration that defines the same object, including any later
migration that replaces it. For `contracts.sql`, whose eight lines are long JSON literals, the reading was
backed by an in-order extraction, per line, from both files:
- every numeric bound (`maximum`, `minimum`, `exclusiveMinimum`, `maxLength`, `minLength`, `minItems`,
  `multipleOf`);
- every `enum` and `required` list.

The two extractions were identical line for line. A byte comparison (`cmp`) was not run, because it was not
a permitted command. Before committing the deletion, the coordinator can confirm with
`cmp <(head -n 13 supabase/migrations/20261017164336_validated_contracts.sql) <(git show HEAD:supabase/contracts.sql)`.
The primary's replay also found the eight persisted schemas in the database equal to `0.1.0`.

| File:lines | Object | Migration that runs | Same or different |
|---|---|---|---|
| `contracts.sql:1` | Generator comment | `20261017164336_validated_contracts.sql:1` | Same |
| `contracts.sql:2` | `create extension if not exists pg_jsonschema` | `…164336_validated_contracts.sql:2` | Same |
| `contracts.sql:3–4` | `private.contracts` table and its `revoke` | `…164336_validated_contracts.sql:3–4` | Same |
| `contracts.sql:5–13` | The eight rows | `…164336_validated_contracts.sql:5–13` | Same (method above). No later migration writes `private.contracts` |
| `contract-validation.sql:1–7` | `private.assert_contract` and its `revoke` | `…164336_validated_contracts.sql:14–20` | Same |
| `contract-validation.sql:9–43` | `private.validate_member_record()` | Created at `…164336_validated_contracts.sql:22–55`; replaced by `20261017164445_contract_trigger_dispatch.sql:1–35` | **Different from 164336** (that version declares `item` and builds the loop with a `case`), **same as 164445**, which runs last. The only difference is `create function` versus `create or replace function` |
| `contract-validation.sql:44` | `revoke` on `validate_member_record` | `…164336_validated_contracts.sql:56` | Same |
| `contract-validation.sql:45–49` | Five `validate_*` triggers | `…164336_validated_contracts.sql:57–61` | Same |
| `contract-validation.sql:51–53` | Comment, `revoke update` and `grant update(archived)` on `public.exercises` | `…164336_validated_contracts.sql:63–65` | Same |
| `contract-validation.sql:54–55` | `finite_nutrients` and `finite_targets` checks | `…164336_validated_contracts.sql:66–67` | Same |
| `contract-validation.sql:57–73` | `private.complete_onboarding` | `…164336_validated_contracts.sql:69–85` | Same |
| `gym-read-models.sql:1–20` | `private.gym_account`, its `revoke` and `grant` | `20261019121035_gym_read_models.sql:132–151` | Same |
| `gym-read-models.sql:21` | `public.gym_account_v1` | Created at `…121035_gym_read_models.sql:152`; replaced by `20261019140429_gym_freezes.sql:174–183` | **Different from what runs:** the replacement adds `freezes` to the result. The draft equals the first version only |
| `gym-read-models.sql:22–23` | `revoke` and `grant` on `gym_account_v1` | `…121035_gym_read_models.sql:153–154` | Same (`create or replace` keeps them) |
| `gym-read-models.sql:25–43` | `private.gym_dashboard`, `public.gym_dashboard_v1` and their privileges | `…121035_gym_read_models.sql:156–174` | Same |
| *(not in the draft)* | `private.gym_command_core` | `…121035_gym_read_models.sql:1–131` | Only in the migration |
| `gym-freezes.sql:2, 4–6` | `gym_freezes` columns `revision`, `decision_reason`, `requested_ends_on`, `ended_early_on` | `20261019140429_gym_freezes.sql:3–4, 9–16` | Same columns. The draft says `if not exists` |
| `gym-freezes.sql:3` | `decided_by uuid references public.profiles(id)` | `…140429_gym_freezes.sql:6–7` (column) and `:185–186` (`gym_freezes_decided_by_fkey`) | Same result. The foreign key is a separate statement |
| `gym-freezes.sql:7` | Index `gym_freezes_term` | `…140429_gym_freezes.sql:188` | Same columns. The draft says `if not exists` |
| `gym-freezes.sql:10–52` | `private.freeze_projection` | `…140429_gym_freezes.sql:93–148` | Same body and options (stable, invoker, empty `search_path`). The migration's header is reformatted |
| `gym-freezes.sql:53` | `revoke` on `freeze_projection` | `…140429_gym_freezes.sql:194` | **Different:** the draft revokes from `public, anon, authenticated`; the migration only from `PUBLIC` (finding 1) |
| `gym-freezes.sql:55–120` | `private.freeze_action` | Created at `…140429_gym_freezes.sql:18–91`; replaced by `20261019140839_freeze_preview_binding.sql:3–76` | **Different from 140429:** it hashes without `freezeId` and checks the preview hash after the projection. **Same body as 140839**, which runs last |
| `gym-freezes.sql:121–122` | `revoke` and `grant` on `freeze_action` | `…140429_gym_freezes.sql:190, 192` | **Different:** the migration does not revoke from `anon` (finding 2) |
| `gym-freezes.sql:123–128` | `public.freeze_preview_v1`, `public.freeze_command_v1` | `…140429_gym_freezes.sql:150–158, 162–170` | Same. `security invoker` is the default |
| `gym-freezes.sql:129–130` | `revoke` from `public, anon`; `grant` to `authenticated` | `…140429_gym_freezes.sql:160, 172, 196, 204` | Same. The migration also re-grants `postgres` and grants `service_role` (`:198–202, 206–210`), which the draft does not |
| `gym-freezes.sql:131–133` | `public.gym_account_v1` with `freezes` | `…140429_gym_freezes.sql:174–183` | Same |
| *(not in the draft)* | `set local check_function_bodies = off` | `…140429_gym_freezes.sql:1` | Only in the migration |

**Findings** (the migration is what runs, so none of these changes a database):
1. **`private.freeze_projection` is revoked only from `PUBLIC`.** `authenticated` has `USAGE` on `private`
   (`20261017161031_member_core.sql:4`), and `20261017162313_explicit_api_grants.sql` resets defaults only
   in `public`. Whether `authenticated` can execute it was **not checked in a database**. The replay project
   can answer with
   `select has_function_privilege('authenticated', 'private.freeze_projection(jsonb,jsonb,uuid,uuid,text,date,date,boolean)', 'execute')`.
   The draft intended `false`.
2. **`private.freeze_action` keeps any `anon` grant.** `anon` has no `USAGE` on `private`, so the draft's
   extra revoke probably changes nothing. Not checked in a database.
3. **`gym-read-models.sql` was stale.** Its `gym_account_v1` omits the `freezes` key that runs today.
4. **`contract-validation.sql` drafted two migrations.** It is `164336:14–85` with
   `validate_member_record` already in its 164445 form.

## References to the retired files

A search of the whole repository, excluding `node_modules`, for `contracts.sql`, `contract-validation`,
`gym-read-models`, `gym-freezes` and `contracts.ts` found:
- **`package.json` (root) and every `scripts/` file:** no reference, except `scripts/backend/contracts.ts:8`
  itself, which writes `supabase/contracts.sql`. No script, workflow or config runs or reads any of the five
  files. `supabase/config.toml:72` lists only `seed.sql` and `development-catalogue.sql`.
- **`packages/domain/src/contract.ts:23`:** a doc comment, "built exactly as
  `scripts/backend/contracts.ts:6` builds it". It goes stale when the generator is deleted. Domain source was
  outside this phase's writes (residual 4).
- **Docs:** records that cite them as history (003 §7, the QA-1 review, checkpoint, dispositions, phase 2A,
  the test plan). Nothing to change.

So deleting the five files breaks no entry.

## Deletion — authorized, **not done**

The coordinator, the sole lane orchestrator, authorized this phase to delete the four files and
`scripts/backend/contracts.ts` once the comparison and search above were recorded. The one attempt
(command 7) was denied by the permission mode. No permitted tool deletes a file, and no test or script was
used to get around the denial. **All five files are still present and still tracked.**

To finish, the coordinator runs (from the worktree root):

```bash
git rm -q supabase/contracts.sql supabase/contract-validation.sql supabase/gym-read-models.sql supabase/gym-freezes.sql scripts/backend/contracts.ts
node --test scripts/backend/*.test.mjs        # expect 39 of 39: test 18 turns green
node scripts/backend/check-sql-sources.mjs    # expect one "SQL sources verified: 15 migrations (14 unchanged since main@…, 1 new); …" line
```

The expected counts assume the untracked `20261025234317_training_formula_v1.sql` is still the only new
migration. After the deletion, `contract.ts:23` cites a file that no longer exists (residual 4).

## Wiring — deferred

`backend:test` is **not** changed. The prompt says to wire the gates only after the work is complete, and
two things are not:
- the deletion above, without which `check-sql-sources.mjs` fails;
- the formula migration on the stack `backend:test` targets (55321). Wiring `verify-fixtures.mjs` now would
  run the new fixture against that database, which the prompt rules out until the migration is applied
  there (test-plan §3, `migration up --local`).

When both are done, the plan's line (test-plan §4) is:

```json
"backend:test": "node scripts/backend/verify.mjs && node scripts/backend/verify-gym.mjs && node scripts/backend/verify-freeze-projection.mjs && node scripts/backend/verify-freezes.mjs && node scripts/backend/check-sql-sources.mjs && node scripts/backend/verify-contracts.mjs && node scripts/backend/verify-fixtures.mjs"
```

## Running the database checks on the replay project, defaults unchanged

The commands accept only this repository's project at `http://127.0.0.1:55321`. A disposable loopback
project can be targeted only from code, through the exported `main(argv, { projectDir, expectedApiUrl })`.
For the isolated replay project (`/tmp/fitlog-ar1-replay-20261026`, `project_id = "fitlog_ar1_replay_20261026"`):

```bash
REPLAY_API_URL='http://127.0.0.1:<api port>' node --input-type=module -e '
const dir = "/Users/Adya/.codex/worktrees/fitlog-ar1/fitness_app/scripts/backend";
const { main: contracts } = await import(`${dir}/verify-contracts.mjs`);
const { main: fixtures } = await import(`${dir}/verify-fixtures.mjs`);
const target = { projectDir: "/tmp/fitlog-ar1-replay-20261026", expectedApiUrl: process.env.REPLAY_API_URL };
const a = contracts([], target); const b = fixtures([], target); process.exitCode = a || b;'
```

- `REPLAY_API_URL` must be exactly the `API_URL` that
  `pnpm exec supabase status -o json --workdir /tmp/fitlog-ar1-replay-20261026` reports. The tool runs that
  same status call and refuses anything else, or any non-loopback URL.
- **M1.5:** pass `["$AR1_TMP/0.1.0-mutant.json"]` to `contracts`. Expect exit 1 with the hash line and
  `persisted.<name> differs at …`.
- **M4.2:** pass `["$AR1_TMP/training-fixtures-mutant.sql"]` to `fixtures`. Expect exit 1 with the psql
  error.
- **M4.3 and M4.4:** edit the fixture in place, then restore it, as the plan says.
- `node scripts/backend/verify-contracts.mjs` on 55321 issues one `select`. **Do not** run
  `verify-fixtures.mjs` there before the formula migration is applied.

## Notice for lane S2 — handoff text, not sent

This phase messaged nobody. The text below is for the coordinator to deliver.

> **AR-1 → lane S2.** Phase 2 retires `supabase/gym-read-models.sql` and `supabase/gym-freezes.sql` (003 §7,
> former G-9). Nothing executed them. The migrations `20261019121035_gym_read_models.sql`,
> `20261019140429_gym_freezes.sql` and `20261019140839_freeze_preview_binding.sql` define every object
> they held, and git history keeps both files. From now on `scripts/backend/check-sql-sources.mjs` fails
> on any `.sql` under `supabase/` other than migrations and the configured seeds. Keep drafts outside
> `supabase/`, or ship them as a new migration. Please review two privilege differences between your
> draft and the migration that runs: `private.freeze_projection` is revoked only from `PUBLIC`, and
> `private.freeze_action` is not revoked from `anon` (docs/plan/runs/AR-1/phase2C.md, findings 1–2).

## What was not run

- **No database check.** `verify-contracts.mjs` and `verify-fixtures.mjs` have not run against any
  Supabase project. Their argv, target guard, manifest checks and output parsing were exercised only
  through injected runners. M1.5 and the SQL halves of M4.2–M4.4 are still open.
- `supabase status --workdir`, and psql's real stderr for notices (`psql:<stdin>:N: NOTICE:  …`), are
  assumed from the CLI conventions, not observed. If either differs, the tools fail closed: the target is
  refused, or "did not report …" appears. Inspect the output; do not loosen the checks.
- M2.1–M2.4 as literal commands on this repository (see Mutation checks).

## Residuals

1. **Deletion pending** (above). Until it is done, test 18 and `check-sql-sources.mjs` fail on this
   repository. That failure is correct.
2. **Wiring pending** (above).
3. **The database halves of box 2 and box 4 are open:** the first real `verify-contracts` and
   `verify-fixtures` runs, M1.5, and M4.2–M4.4 in SQL. Phase 2B's predicted SQL RED and GREEN lines still
   need a run.
4. **`packages/domain/src/contract.ts:23`** cites `scripts/backend/contracts.ts:6`, which disappears with
   the deletion. That is a one-line comment fix for the `packages/domain` owner.
5. **No gate runs `scripts/backend/*.test.mjs`.** `pnpm check` covers domain, mobile and plan tests only.
   These tests need no database. Adding `node --test scripts/backend/*.test.mjs` to `pnpm check`, or to
   `backend:test`, is the owner's call. Otherwise nothing stops them rotting.
6. **CI.** `mobile-ci.yml` sets `FITLOG_CONTRACT_BASELINE` but not `FITLOG_BASE_REF`, and runs no
   `backend:test`. Both are PL-1. The guard already refuses to run in CI without the variable.
7. **Privilege findings 1–2** (`freeze_projection`, `freeze_action`) need a check against a real database.
   They also need an owner decision on whether a new migration should revoke them.
8. **Additions beyond the plan, for review:**
   - the "a new migration must sort last" rule;
   - refusing symbolic links anywhere under `supabase/`;
   - the case-insensitive `.sql` match;
   - refusing glob seeds and a missing seed;
   - requiring the check to run at the work tree's top.

   Each is tested. `schema_paths` (declarative schemas) is not supported: it is empty today, and any SQL
   under such a path would be reported as stray.
9. The tests ran on `node` v22.23.1, while phase 2B's pnpm runs reported v26.7.0. Both satisfy
   `engines` (`>=22.13.0`). The code uses `Map.groupBy` (Node 21 or later).
10. **The local-target guard does not detect a remote Docker daemon.** It rests on two checks: the
    `API_URL` that `supabase status` reports, and the container name taken from `project_id`. A Docker
    client pointed at a remote daemon, through `DOCKER_HOST` or a docker context, would pass both. The
    existing `verify*.mjs` scripts have the same limit.

## Addendum — after the coordinator's deletion (26 October 2026)

Everything above is the record as first written. The denied `rm` (command 7), "Deletion — authorized,
**not done**" and "Wiring — deferred" stay as they happened. This addendum records what changed after
them.

### Coordinator evidence

The coordinator reported all of this. This session did not run or observe any of it.

- **`contracts.sql`:** confirmed byte-identical to the prefix of
  `20261017164336_validated_contracts.sql`.
- **Comparison table:** inspected.
- **Deletions:** removed exactly the five authorized files. They are `supabase/contracts.sql`,
  `supabase/contract-validation.sql`, `supabase/gym-read-models.sql`, `supabase/gym-freezes.sql` and
  `scripts/backend/contracts.ts`.
- **Privileges in the real replay database:**

  | Function | `authenticated` | `anon` |
  |---|---|---|
  | `private.freeze_action` | `true` | `false` |
  | `private.freeze_projection` | `false` | `false` |

  `authenticated` executing `freeze_action` matches the migration's explicit grant, so findings 1–2 need
  no revocation migration. Residual 7 is closed.
- **Local guard:** it correctly refused the database-only replay project, which reports no `API_URL`.
  The coordinator is starting an owned gateway and REST stack for the real checks.

This session confirmed the deletions with Glob before editing. `supabase/*.sql` now matches only
`development-catalogue.sql` and `seed.sql`, and `scripts/backend/contracts.ts` is absent.

### Changes in this pass

| File | Change |
|---|---|
| `package.json` | `backend:test` = the existing four suites `&& node --test scripts/backend/*.test.mjs && node scripts/backend/check-sql-sources.mjs && node scripts/backend/verify-contracts.mjs && node scripts/backend/verify-fixtures.mjs`. This closes residuals 2 and 5 |
| `packages/domain/src/contract.ts:23` | Doc comment only. It now names the eight schemas that `supabase/migrations/20261017164336_validated_contracts.sql:5-13` loads, instead of the deleted generator. No code changed. This closes residual 4 |
| `docs/plan/runs/AR-1/phase2C.md` | This addendum |

### Commands and results

| # | Command | Result |
|---|---|---|
| 9 | `rtk proxy node --test scripts/backend/*.test.mjs` | Exit 0. `# tests 39`, `# pass 39`, `# fail 0`. Test 18 (`this repository passes…`) is green now that the five files are gone. This closes residual 1 |
| 10 | `rtk proxy pnpm check` | Exit 0. Domain and mobile `tsc` clean, after the `contract.ts` comment edit. `eslint . --max-warnings=0` clean and `Design rules verified…`. Domain `# tests 37`, `# pass 37`. Mobile `Tests: 126 passed, 126 total`. Plan `# tests 22`, `# pass 22`. `plan.json and board.html match GOALS.md` |

**`pnpm backend:test` was not run.** Against 55321 it would reach `verify-fixtures.mjs`, and the formula
migration is not applied there. The coordinator runs separately:
- the baseline of the original four suites on 55321;
- the new runners `verify-contracts.mjs` and `verify-fixtures.mjs` on its owned stack.

Until the formula migration reaches 55321, a full `pnpm backend:test` there is expected to fail at
`verify-fixtures.mjs`.

### Residuals still open

- **3:** the first real `verify-contracts` and `verify-fixtures` runs, M1.5, and M4.2–M4.4 in SQL. These
  are the coordinator's owned-stack runs.
- **6:** CI, owned by PL-1.
- **8:** the additions beyond the plan, for review.
- **9:** the Node version note.
- **10:** a remote Docker daemon is not detected.
