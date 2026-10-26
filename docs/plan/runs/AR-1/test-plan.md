# AR-1 · Next-phase test plan

| Field | Value |
|---|---|
| For | AR-1 phase 2: the database half of box 2, the SQL guards, and boxes 3 and 4. Lane S8 Member backend |
| Written | 26 October 2026 in phase 1, and revised the same day after the independent review (T1–T4, F10, F12; [dispositions](phase1-dispositions.md)). Revision 2 (PR-5 and the routed checks of PR-1 and PR-2; [proposal-revision2.md](proposal-revision2.md)) changed only §2's CI policy and §7. **The author of this plan has run nothing.** Phase 2A's runs are in [phase2A.md](phase2A.md) |
| Base | Branch `codex/ar1-contract-freeze` at `9f148c1`, plus phase 2A's uncommitted files and [003](../../../architecture/003-architecture-freeze.md) |
| Approval | None needed to run this plan. Box 1 needs the owner's one approval, G-1 |

## Phase status

| Part | State | Record |
|---|---|---|
| §1 steps 1–3 and M1.1–M1.4 (box 2, local half) | Done by phase 2A, uncommitted; not verified by this plan's author | [phase2A.md](phase2A.md). Where it differs from §1, phase2A.md governs |
| §1 step 4 and M1.5 (box 2, database half) | Not started | §1 |
| §2 SQL-source and migration guards | Not started | §2 |
| §3 box 3 and §4 box 4 | Not started | §3, §4 |

## Ground rules

- **Test first.** Write each test, run it and see it fail for the expected reason, then implement.
  Mutation-check every guard: break it on purpose, see the named test fail, restore it, and prove the
  restore (docs/23 §9, rule 2).
- **Proving a restore.**
  - **Tracked files:** `git diff --exit-code -- <path>`.
  - **Untracked files:** until they are committed, the snapshot, manifest, fixture and new scripts are
    untracked, and `git diff` ignores them. Record their SHA-256 before the mutation and check it after
    the restore:

    ```bash
    shasum -a 256 <paths> > "$AR1_TMP/<check-id>.before.sha256"
    # mutate, see the expected failure, restore
    shasum -a 256 -c "$AR1_TMP/<check-id>.before.sha256"   # every line "OK", exit 0
    ```

  - **A check that must create no file:** also compare `ls -A <dir>` before and after.
- **Local stack only.** `API_URL` must be `http://127.0.0.1:55321` (project `fitlog_rebuild_20261017`).
  Never run `supabase db push`, `link` or any remote command.
- **Stop and report.** If a preflight expectation fails, a diff is not empty or the CLI fails, save the
  output to `docs/evidence/AR-1/` and report it to the orchestrator.
- **Reset.** A local `supabase db reset` is the only step that needs the owner's confirmation first.
  Never run one without it.
- **Scratch files** go in `AR1_TMP="${CLAUDE_JOB_DIR:-${TMPDIR:-/tmp}}/fitlog-ar1"`, never in the
  repo. Evidence never contains keys: from `supabase status` record only `API_URL`.
- **One new migration**, timestamped and append-only. No existing migration is edited.
- **Shared files**, in the smallest diff: root `package.json` (`backend:test`). `packages/domain`
  belongs to the phase 2A worker. Coordinate the box 4 files there (`encoding.ts`, the fixture and its
  tests, one `index.ts` line) with that owner before writing them. `apps/mobile/` is not touched, so
  the Expo export gate does not apply. The new SQL functions are in `private`, so `database.types.ts`
  does not change.
- **SP3.** Contract `0.1.0` publishes only what exists today. The 003 §4 primitives are planned
  wire-format changes and are not part of AR-1 (003 §8).
- **`rtk`.** Phase 2A found that `rtk` rewrites `pnpm --filter … typecheck` into a bare `tsc`. Prefix
  package-filtered commands with `rtk proxy` ([phase2A.md](phase2A.md), commands 2–3).

## 0. Preflight (read-only)

```bash
AR1_TMP="${CLAUDE_JOB_DIR:-${TMPDIR:-/tmp}}/fitlog-ar1"; mkdir -p "$AR1_TMP"
pnpm install --frozen-lockfile
pnpm exec supabase --version                         # expect 2.121.0
pnpm exec supabase status -o json | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).API_URL))'
                                                     # expect http://127.0.0.1:55321
docker ps --format '{{.Names}}' | grep -x supabase_db_fitlog_rebuild_20261017
pnpm exec supabase migration list --local            # all 14 files applied; no extra local rows
pnpm exec supabase db diff --help                    # confirm --local and --schema; never use -f
pnpm exec supabase migration up --help               # confirm it applies pending migrations without a reset
git rev-parse --verify "${FITLOG_BASE_REF:-main}^{commit}"   # the base the migration guard will use
pnpm check                                           # baseline: phase 2A recorded 21 domain, 126 mobile, 22 planner tests
pnpm backend:test                                    # baseline: the four suites QA-1 recorded
```

If the stack is stopped, `pnpm exec supabase start` starts it and keeps its data. If any expectation
fails, record it and report it (ground rules).

## 1. Box 2 — versioned, immutable contract schema

### Done by phase 2A (steps 1–3, M1.1–M1.4)

[phase2A.md](phase2A.md) records the files, the 11 tests in `contract.test.ts`, the red and green runs
and M1.1–M1.4. Two corrections to this section's first draft:
- `persistedContracts` holds the eight schemas that `private.contracts` **stores**. The trigger asserts
  only four of them on write: `days`, `instances`, `nutrients` and `measurements`
  (`20261017164445_contract_trigger_dispatch.sql:5-17`; checkpoint F-18).
- **Restore evidence for M1.1–M1.4:**
  - M1.2: the hash test passes again, so the file's SHA-256 is back to `74914ca9…`. That is a
    hash-based restore check.
  - M1.4: `contracts/` held only its two files afterwards.
  - M1.1: `models.ts` is tracked, so `git diff --exit-code -- packages/domain/src/models.ts` confirms
    its restore.
  - M1.3: `contract.ts` is untracked; its restore is shown by the tests passing again.

  Any rerun uses the ground rules above.

### Step 4 — database side (not started)

Create `scripts/backend/verify-contracts.mjs`. It checks that `private.contracts` equals the
snapshot's `persisted` section, for all eight names, and takes an optional snapshot path.

1. It reads
   `select coalesce(json_object_agg(name, schema order by name), '{}') from private.contracts`
   through `docker exec -i supabase_db_<project_id> psql -U postgres -d postgres -X -At`, where
   `<project_id>` is read from `supabase/config.toml`, and deep-compares the result with `persisted`.
   It calls `execFileSync` with an argument array, never a shell.
2. **If they differ** (for example, Zod renders schemas differently than on 17 October), **do not
   edit the snapshot to match the database**. Record the difference. The fix is a new append-only
   migration that loads the generated schemas, written only after confirming they are right.
3. **M1.5:** copy the snapshot to `$AR1_TMP/0.1.0-mutant.json`, change one persisted bound, run
   `node scripts/backend/verify-contracts.mjs "$AR1_TMP/0.1.0-mutant.json"`, and expect a failure.
   The committed snapshot is untouched; prove it with its SHA-256.

### Not in AR-1

The draft's optional step 5, adding the 003 §4 primitives as `0.2.0`, is withdrawn. Those are planned
wire-format changes (003 §8). They arrive in two groups, each as a new version with the goal that puts
it on the wire:
- the envelope, error codes, command body and cursor with MB-1;
- decimal strings and money with MB-3, MB-5, MB-6 and G17.api.

## 2. Guards on migrations and SQL sources

### File

`scripts/backend/check-sql-sources.mjs` needs no database. It fails when:

- a file in `supabase/migrations/` does not match `^\d{14}_[a-z0-9_]+\.sql$`, or timestamps repeat;
- a `.sql` file under `supabase/` is outside `migrations/` and is not a configured seed (it reads
  `sql_paths` from `supabase/config.toml:72`);
- a migration that exists at the base was modified, deleted, renamed or retyped.

That last check is computed as follows. It runs git through `execFileSync` with argument arrays and
**fails closed**:

1. **Pick the base.**
   - `FITLOG_BASE_REF` names the trusted base. Locally it defaults to `main`.
   - When `CI` is set, the variable is required. If it is unset, exit 1 with
     `FITLOG_BASE_REF must be set in CI to the trusted base commit`.
2. **Resolve the base.** Both `git rev-parse --verify --quiet "$FITLOG_BASE_REF^{commit}"` and
   `git merge-base "$FITLOG_BASE_REF" HEAD` must succeed. Otherwise exit 1 with
   `Cannot resolve base <ref>: fetch it (PL-1) or set FITLOG_BASE_REF`. A shallow clone without the
   base therefore fails instead of passing.
3. **Compare.** `git diff --name-only --diff-filter=MDRT <merge-base> -- supabase/migrations` must list
   nothing. This compares the working tree with the merge base, so an uncommitted edit to a migration
   already on the base is caught too.

**Trusted CI policy (PL-1).**
- CI sets `FITLOG_BASE_REF` from the CI event:
  - for a pull request, the base branch fetched from the protected remote;
  - for a push to `main`, the previous head.
- Never from a file, a commit message or any other content of the change being checked.
- CI fetches enough history for the merge base to exist.
- CI sets phase 2A's `FITLOG_CONTRACT_BASELINE` to the same commit, so both guards judge against one
  trusted base.
- **Both guards fail closed in CI (decision, 003 §8, revision 2).** The contract guard's half is the
  `packages/domain` owner's candidate `22c5386`, implemented and tested locally, with independent
  verification pending. No hosted CI run proves it yet, so this plan does not count it as evidence.

### The four SQL files (QA-1 F-8h; 003 §7, former G-9)

1. **Red.** The check fails on `contracts.sql`, `contract-validation.sql`, `gym-read-models.sql` and
   `gym-freezes.sql`.
2. **Compare first.** Compare each statement in each file, by reading, with the migration that
   defines the same object. Put a table in the handoff: file, object, migration `file:line`, same or
   different. Where they differ, the migration is what runs; record the difference as a finding.
3. **Delete.**
   - Delete the four files.
   - Delete the generator `scripts/backend/contracts.ts`, unless phase 2A has already retired it.
     Before deleting it, search `package.json` and `scripts/` for references, and remove only an
     entry that would break.
   - Git history keeps all of them. There is no allowlist branch.
4. **Green.** The check passes.
5. **Notify S2.** The handoff records that lane S2, which wrote `gym-read-models.sql` and
   `gym-freezes.sql`, was notified.

### Mutation checks

| ID | Break | Expected failure | Restore and proof |
|---|---|---|---|
| M2.1 | Create `supabase/zz-probe.sql` | Stray SQL source | Delete it; `test ! -e supabase/zz-probe.sql` |
| M2.2 | Record the SHA-256 of `supabase/migrations/20261017161031_member_core.sql`, then append `-- probe` | Migration edited | `git checkout -- supabase/migrations/20261017161031_member_core.sql`; `shasum -a 256 -c` is OK; `git diff --exit-code -- supabase/migrations` |
| M2.3 | `FITLOG_BASE_REF=refs/heads/ar1-no-such-ref node scripts/backend/check-sql-sources.mjs` | Exit 1 with `Cannot resolve base` | Nothing to restore |
| M2.4 | `env -u FITLOG_BASE_REF CI=true node scripts/backend/check-sql-sources.mjs` | Exit 1 with `FITLOG_BASE_REF must be set in CI` | Nothing to restore |

## 3. Box 3 — isolated replay from empty to head, and a schema diff, without a reset

**Why this is isolated.** `supabase db diff` starts a throwaway shadow database on port 55320
(`supabase/config.toml:36`), applies every migration to it from empty, and compares it with the
running local database. It does not write to the local database. Never pass `-f`, which writes a new
migration file.

### Commands (after §4's migration exists, so the diff covers the new head)

```bash
pnpm exec supabase migration up --local     # applies only the new formula migration; no reset, no data removed
pnpm exec supabase migration list --local   # 15 files, all applied
pnpm exec supabase db diff --local --schema public,private > "$AR1_TMP/db-diff-public-private.sql"; echo "exit $?"
grep -cvE '^\s*(--.*)?$' "$AR1_TMP/db-diff-public-private.sql"   # expect 0: no SQL statement
pnpm exec supabase db diff --local --schema storage > "$AR1_TMP/db-diff-storage.sql"; echo "exit $?"
grep -cvE '^\s*(--.*)?$' "$AR1_TMP/db-diff-storage.sql"          # expect 0
docker exec supabase_db_fitlog_rebuild_20261017 psql -U postgres -d postgres -X -At \
  -c "select id, public, file_size_limit, allowed_mime_types from storage.buckets order by id"
# expect: personal-images|f|10485760|{image/jpeg,image/png,image/heic}
```

- **Pass** means both diffs exit 0 with no SQL statements, and the bucket row matches
  `20261017161031_member_core.sql:167-168`. Bucket rows are data, so the schema diff cannot see them.
- If the storage diff lists objects Supabase manages rather than our policies, record it word for word
  and compare only the three `personal-images` policies.

### Structural drift probe (the replay guard seen to fail once; the local database is untouched)

A comment-only probe could be missed by a differ that ignores comments, which would make the guard
look broken. The probe is therefore a table:

```bash
printf 'create table public.ar1_drift_probe(id integer);\n' \
  > supabase/migrations/29991231235959_ar1_drift_probe.sql
pnpm exec supabase db diff --local --schema public,private > "$AR1_TMP/db-diff-probe.sql"; echo "exit $?"
grep -c ar1_drift_probe "$AR1_TMP/db-diff-probe.sql"   # expect at least 1: the replay differs from the local DB
rm supabase/migrations/29991231235959_ar1_drift_probe.sql
test ! -e supabase/migrations/29991231235959_ar1_drift_probe.sql
git status --porcelain supabase/migrations             # expect only the new formula migration, untracked
```

Never run `migration up` while the probe file exists: that would apply it to the local database.

### Stop conditions

- The clean diff is not empty.
- `migration list` shows a local-only row or a missing file.
- The CLI cannot build the shadow database.

In each case: save the output to `docs/evidence/AR-1/` and report it to the orchestrator. **Do not
reset.**

### Should, not a box

```bash
pnpm exec supabase gen types typescript --local --schema public > "$AR1_TMP/database.types.ts"
```

Compare it with `apps/mobile/src/data/database.types.ts` and record whether they match. Do not
overwrite the checked-in file in AR-1; regeneration belongs to the SP3 owners.

## 4. Box 4 — one AC03 fixture file for TypeScript and SQL

### Files

| Action | Path |
|---|---|
| Create | `packages/domain/fixtures/ac03-training.v1.json` (content below) |
| Create | `packages/domain/src/encoding.ts`: `formatDecimal(value: number, scale = 6): string`. It refuses non-finite values and uses `toFixed(scale)`. It trims trailing zeros, and a bare point, only when a point exists. It turns any negative-zero result, such as `-0.000000`, into `0` |
| Create | `packages/domain/src/encoding.test.ts` (tests below) |
| Create | `packages/domain/src/fixtures.test.ts` |
| Edit | `packages/domain/src/index.ts`: add `export * from './encoding.ts';` |
| Create | `supabase/migrations/<UTC yyyymmddhhmmss>_training_formula_v1.sql`, timestamped later than `20261019140839` |
| Create | `scripts/backend/sql/training-fixtures.sql` |
| Create | `scripts/backend/verify-fixtures.mjs`; an optional argument replaces the SQL file path, for mutation runs |
| Edit | `package.json`: append `&& node scripts/backend/check-sql-sources.mjs && node scripts/backend/verify-contracts.mjs && node scripts/backend/verify-fixtures.mjs` to `backend:test` |

The `packages/domain` rows are coordinated with that package's owner (ground rules).

### `encoding.test.ts`

| Test | Asserts |
|---|---|
| `formatDecimal trims zeros and keeps integers` | `1920`→`1920`, `100.5`→`100.5`, `0`→`0`, `-0`→`0`, `100` at scale 0 → `100` |
| `formatDecimal never returns negative zero` | `-0.0000001`→`0` and `-0.0000004`→`0` (both render as `-0.000000` before trimming) |
| `formatDecimal output is a canonical decimal` | Every output above, and every non-null fixture expectation, matches 003 §4.9's pattern `^(0\|-?[1-9][0-9]*(\.[0-9]*[1-9])?\|-?0\.[0-9]*[1-9])$` |
| `formatDecimal refuses non-finite values` | `NaN`, `Infinity` and `-Infinity` throw |
| `formatDecimal rounds the binary double (known limit)` | `formatDecimal(1.005, 2)` is `1`, because `(1.005).toFixed(2)` is `"1.00"`, while SQL `round(1.005, 2)` is `1.01`. This documents the limit in 003 §4.13; it is not a target behaviour. The server value is authoritative, and fixture expectations avoid exact ties at the seventh decimal |

(In the pattern above, `\|` is a Markdown table escape; the regex itself uses a bare `|`.)

### `packages/domain/fixtures/ac03-training.v1.json`

```json
{
  "fixture": "ac03-training",
  "fixtureVersion": 1,
  "formula": "training.v1",
  "source": "PRD §8.2 formula contract and acceptance scenario AC03",
  "decimal": "Canonical decimal string rounded half away from zero to 6 places, trailing zeros removed; null when no eligible value exists (docs/architecture/003 §4.9)",
  "exercises": {
    "bench": { "type": "resistance", "loadBasis": "total", "multiplier": 1 },
    "dumbbellPressPerHand": { "type": "resistance", "loadBasis": "per_hand", "multiplier": 2 },
    "assistedPullUp": { "type": "bodyweight", "loadBasis": "assistance", "multiplier": 1 },
    "weightedDip": { "type": "bodyweight", "loadBasis": "total", "multiplier": 1 }
  },
  "setVectors": [
    { "id": "ac03-working-80x8", "exercise": "bench", "setType": "working", "reps": 8, "loadKg": "80", "expect": { "volumeKgReps": "640", "e1rmKg": "101.333333" } },
    { "id": "ac03-warmup-40x10", "exercise": "bench", "setType": "warmup", "reps": 10, "loadKg": "40", "expect": { "volumeKgReps": null, "e1rmKg": null } },
    { "id": "failure-70x6", "exercise": "bench", "setType": "failure", "reps": 6, "loadKg": "70", "expect": { "volumeKgReps": "420", "e1rmKg": "84" } },
    { "id": "drop-60x12", "exercise": "bench", "setType": "drop", "reps": 12, "loadKg": "60", "expect": { "volumeKgReps": "720", "e1rmKg": "84" } },
    { "id": "per-hand-30x8", "exercise": "dumbbellPressPerHand", "setType": "working", "reps": 8, "loadKg": "30", "expect": { "volumeKgReps": "480", "e1rmKg": "38" } },
    { "id": "assistance-20x8", "exercise": "assistedPullUp", "setType": "working", "reps": 8, "loadKg": "20", "expect": { "volumeKgReps": null, "e1rmKg": null } },
    { "id": "weighted-bodyweight-10x10", "exercise": "weightedDip", "setType": "working", "reps": 10, "loadKg": "10", "expect": { "volumeKgReps": "100", "e1rmKg": null } },
    { "id": "reps-over-30", "exercise": "bench", "setType": "working", "reps": 31, "loadKg": "20", "expect": { "volumeKgReps": "620", "e1rmKg": null } },
    { "id": "zero-load", "exercise": "bench", "setType": "working", "reps": 10, "loadKg": "0", "expect": { "volumeKgReps": "0", "e1rmKg": null } },
    { "id": "deleted-100x5", "exercise": "bench", "setType": "working", "reps": 5, "loadKg": "100", "deleted": true, "expect": { "volumeKgReps": null, "e1rmKg": null } }
  ],
  "sessionVectors": [
    {
      "id": "ac03-session",
      "exercise": "bench",
      "sets": [
        { "setType": "working", "reps": 8, "loadKg": "80" },
        { "setType": "working", "reps": 8, "loadKg": "80" },
        { "setType": "working", "reps": 8, "loadKg": "80" },
        { "setType": "warmup", "reps": 10, "loadKg": "40" },
        { "setType": "working", "reps": 5, "loadKg": "100", "deleted": true }
      ],
      "expect": { "volumeKgReps": "1920", "workingSets": 3, "bestE1rmKg": "101.333333" }
    },
    {
      "id": "no-eligible-volume",
      "exercise": "assistedPullUp",
      "sets": [
        { "setType": "warmup", "reps": 10, "loadKg": "30" },
        { "setType": "working", "reps": 8, "loadKg": "20" }
      ],
      "expect": { "volumeKgReps": null, "workingSets": 1, "bestE1rmKg": null }
    }
  ]
}
```

**What the vectors pin (PRD §8.2):**
- Warm-ups and deleted sets count for nothing; working, drop and failure sets count.
- e1RM uses the displayed load basis, not the per-hand ×2 volume multiplier:
  30 × (1 + 8/30) = 38.
- Assisted sets have no kg volume. Weighted bodyweight counts external load for volume but has no
  e1RM.
- e1RM needs 1–30 reps and a positive load.
- A session with no eligible set has volume `null`, not `0` ("no invented kg volume"). An assisted
  working set still counts as a working set.
- The deleted 100×5 set would win best e1RM (116.666667) if it were wrongly counted.

Expected values were worked by hand for this plan, including the IEEE double results of the current
TypeScript functions (for example `80 * (1 + 8/30)` is `101.33333333333333`, which formats as
`101.333333`). Phase 2's run is the proof.

### TypeScript test (`packages/domain/src/fixtures.test.ts`)

- It reads the file with `readFileSync(new URL('../fixtures/ac03-training.v1.json', import.meta.url), 'utf8')`.
- It builds `Exercise` and `PerformedSet` objects (`loadKg: Number(v.loadKg)`, `deletedAt` set for
  deleted sets) and calls the existing `setVolume`, `epley` and `sessionSummary` from
  `calculations.ts`.
- **Session volume** is the sum of the non-null `setVolume` results, or `null` when none contributes:
  the same rule as SQL `sum()`. Best e1RM is the maximum non-null `epley`, or `null`.
- `sessionSummary(...).workingSets` is asserted for every session vector. `sessionSummary(...).volume`
  is asserted only for vectors whose expected volume is not null.
- For `no-eligible-volume`, `sessionSummary` reports `0` today (`calculations.ts:33-36`). That is
  checkpoint F-20, owned by MB-4. Phase 2 does not change `sessionSummary`, because `apps/mobile`
  uses it.
- Tests:
  - `training.v1 set vectors match in TypeScript`, with the vector ID in every assertion message;
  - `training.v1 session vectors match in TypeScript`;
  - `training.v1 fixture file is non-trivial`: at least 10 set vectors and 2 session vectors, one of
    them with a null expected volume, all with unique IDs, so an emptied file cannot pass.
- The domain `test` script already runs `src/*.test.ts`, so `pnpm check` picks these up with no
  script change.

### SQL migration (`<timestamp>_training_formula_v1.sql`)

```sql
-- Training formula contract v1 (PRD §8.2). One shared fixture file drives the TypeScript and SQL
-- checks: packages/domain/fixtures/ac03-training.v1.json (docs/architecture/003 §4.13).
create function private.external_set_volume_v1(p_logging_type text,p_load_basis text,p_multiplier integer,p_set_type text,p_reps integer,p_load_kg numeric,p_deleted boolean)
returns numeric language sql immutable set search_path='' as $$
 select case when p_deleted or p_set_type='warmup' or p_load_basis='assistance' or p_logging_type not in ('resistance','bodyweight')
   or p_reps is null or p_load_kg is null then null else p_reps*p_load_kg*p_multiplier end
$$;
create function private.epley_e1rm_v1(p_logging_type text,p_load_basis text,p_set_type text,p_reps integer,p_load_kg numeric,p_deleted boolean)
returns numeric language sql immutable set search_path='' as $$
 select case when p_deleted or p_set_type='warmup' or p_logging_type<>'resistance' or p_load_basis='assistance'
   or p_reps is null or p_reps not between 1 and 30 or p_load_kg is null or p_load_kg<=0 then null
  else p_load_kg*(1+p_reps::numeric/30) end
$$;
create function private.format_decimal_v1(p_value numeric,p_scale integer)
returns text language sql immutable set search_path='' as $$select trim_scale(round(p_value,p_scale))::text$$;
revoke all on function private.external_set_volume_v1(text,text,integer,text,integer,numeric,boolean) from public,anon,authenticated;
revoke all on function private.epley_e1rm_v1(text,text,text,integer,numeric,boolean) from public,anon,authenticated;
revoke all on function private.format_decimal_v1(numeric,integer) from public,anon,authenticated;
```

- `p_reps::numeric/30` matters: `8/30` in integer arithmetic is 0.
- `trim_scale` exists from PostgreSQL 13; the local stack runs 17 (`supabase/config.toml:41`).
- `numeric` has no negative zero, so the SQL side cannot produce `-0`.
- MB-4 calls these functions from its summary code and extends the fixture.

### SQL check (`scripts/backend/sql/training-fixtures.sql`)

```sql
-- Runs inside one transaction that is always rolled back; it leaves nothing behind.
begin;
select set_config('fitlog.fixture', :'fixture', true);
do $$
declare f jsonb := current_setting('fitlog.fixture')::jsonb; v jsonb; ex jsonb; failures text[] := '{}';
 got text; volume numeric; best numeric; working integer;
begin
 if jsonb_array_length(f->'setVectors')<10 or jsonb_array_length(f->'sessionVectors')<2 then raise exception 'Fixture file has too few vectors'; end if;
 for v in select x from jsonb_array_elements(f->'setVectors') x loop
  ex:=f->'exercises'->(v->>'exercise');
  got:=private.format_decimal_v1(private.external_set_volume_v1(ex->>'type',ex->>'loadBasis',(ex->>'multiplier')::integer,v->>'setType',(v->>'reps')::integer,(v->>'loadKg')::numeric,coalesce((v->>'deleted')::boolean,false)),6);
  if got is distinct from v->'expect'->>'volumeKgReps' then failures:=failures||format('%s volume %s',v->>'id',coalesce(got,'null')); end if;
  got:=private.format_decimal_v1(private.epley_e1rm_v1(ex->>'type',ex->>'loadBasis',v->>'setType',(v->>'reps')::integer,(v->>'loadKg')::numeric,coalesce((v->>'deleted')::boolean,false)),6);
  if got is distinct from v->'expect'->>'e1rmKg' then failures:=failures||format('%s e1rm %s',v->>'id',coalesce(got,'null')); end if;
 end loop;
 for v in select x from jsonb_array_elements(f->'sessionVectors') x loop
  ex:=f->'exercises'->(v->>'exercise');
  select sum(private.external_set_volume_v1(ex->>'type',ex->>'loadBasis',(ex->>'multiplier')::integer,s->>'setType',(s->>'reps')::integer,(s->>'loadKg')::numeric,coalesce((s->>'deleted')::boolean,false))),
         max(private.epley_e1rm_v1(ex->>'type',ex->>'loadBasis',s->>'setType',(s->>'reps')::integer,(s->>'loadKg')::numeric,coalesce((s->>'deleted')::boolean,false))),
         count(*) filter (where s->>'setType'<>'warmup' and not coalesce((s->>'deleted')::boolean,false))
    into volume,best,working from jsonb_array_elements(v->'sets') s;
  if private.format_decimal_v1(volume,6) is distinct from v->'expect'->>'volumeKgReps' then failures:=failures||format('%s volume',v->>'id'); end if;
  if private.format_decimal_v1(best,6) is distinct from v->'expect'->>'bestE1rmKg' then failures:=failures||format('%s best e1rm',v->>'id'); end if;
  if working is distinct from (v->'expect'->>'workingSets')::integer then failures:=failures||format('%s working sets %s',v->>'id',working); end if;
 end loop;
 if cardinality(failures)>0 then raise exception 'training.v1 fixture failed: %',array_to_string(failures,'; '); end if;
 raise notice 'training.v1: % set vectors and % session vectors passed in SQL',jsonb_array_length(f->'setVectors'),jsonb_array_length(f->'sessionVectors');
end $$;
rollback;
```

For `no-eligible-volume`, the SQL side already gives `null`:
- `sum()` over only null values is `null`, and so is `format_decimal_v1(null, 6)`;
- `->>` turns a JSON `null` into SQL `NULL`;
- `is distinct from` treats two `NULL`s as equal, so the check passes.

### Runner (`scripts/backend/verify-fixtures.mjs`)

Follow `scripts/backend/verify.mjs:5-7`:

1. Call `pnpm exec supabase status -o json` and refuse anything but `http://127.0.0.1:55321`.
2. Read `project_id` from `supabase/config.toml`.
3. Read the fixture and `JSON.parse` it, so a malformed file fails early.
4. Run `docker exec -i supabase_db_<project_id> psql -U postgres -d postgres -X -q -v ON_ERROR_STOP=1 -v fixture=<file text> -f -`
   with the SQL on stdin, through `execFileSync` with an argument array (no shell).
5. Print one result line naming the fixture file.

### Steps and commands

1. **Red, TypeScript.** Add the fixture and `fixtures.test.ts` before `encoding.ts`. Run
   `rtk proxy pnpm --filter @fitlog/domain test`; expect a failure because `./encoding.ts` is missing.
2. **Red, SQL.** Before the migration exists, run `node scripts/backend/verify-fixtures.mjs`; expect
   `function private.external_set_volume_v1(...) does not exist`.
3. **Green.** Add `encoding.ts` and the migration. Run `pnpm exec supabase migration up --local`, then
   `rtk proxy pnpm --filter @fitlog/domain test` and `node scripts/backend/verify-fixtures.mjs`. Both
   pass.
4. **Mutation checks.**

   | ID | Break | Expected failure | Restore and proof |
   |---|---|---|---|
   | M4.1 | `packages/domain/src/calculations.ts:28`: `set.reps / 30` → `set.reps / 31` | The TypeScript set test names `ac03-working-80x8` | Restore; `git diff --exit-code -- packages/domain/src/calculations.ts` |
   | M4.2 | Copy the SQL check to `$AR1_TMP/training-fixtures-mutant.sql`. After `begin;` insert `create or replace function private.epley_e1rm_v1(p_logging_type text,p_load_basis text,p_set_type text,p_reps integer,p_load_kg numeric,p_deleted boolean) returns numeric language sql immutable set search_path='' as $f$select case when p_deleted or p_set_type='warmup' or p_logging_type<>'resistance' or p_load_basis='assistance' or p_reps is null or p_reps not between 1 and 30 or p_load_kg is null or p_load_kg<=0 then null else p_load_kg*(1+p_reps::numeric/31) end$f$;`. Run `node scripts/backend/verify-fixtures.mjs "$AR1_TMP/training-fixtures-mutant.sql"` | `training.v1 fixture failed: ac03-working-80x8 e1rm …` | The transaction rolls back, so the real function is unchanged; rerun the normal runner and see it pass |
   | M4.3 (one file) | Record the fixture's SHA-256. Change `"e1rmKg": "101.333333"` → `"101.333334"` on `ac03-working-80x8` | **Both** the TypeScript and the SQL checks fail | Restore; `shasum -a 256 -c` is OK (the fixture is untracked, so `git diff` would prove nothing) |
   | M4.4 (null rule) | Record the fixture's SHA-256. Change `no-eligible-volume`'s `"volumeKgReps": null` → `"0"` | **Both** checks fail on `no-eligible-volume` | Restore; `shasum -a 256 -c` is OK |

## 5. Gates for the phase-2 handoff

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm backend:test        # the original four suites plus check-sql-sources, verify-contracts and verify-fixtures
```

Record the result lines exactly as QA-1 and phase 2A did. The Expo export is not required unless
`apps/mobile/` changed.

## 6. Evidence for `docs/plan/runs/AR-1/handoff.md`

| Box | Evidence |
|---|---|
| 1. Record covers §21.1 and §21.3, approval in the tracker | `docs/architecture/003-architecture-freeze.md`, plus the owner's dated decision-log entry (G-1). **Only the owner can supply the second part** |
| 2. Contract version, and a test that fails on an unversioned schema change (seen once) | Phase 2A's record: the `CONTRACT_VERSION` export, the M1.1 failure line and the passing run, M1.2–M1.4. Then this phase's `verify-contracts.mjs` result and M1.5 |
| 3. Replay from empty to head; empty schema diff | The §3 commands and their output lines; the structural probe's non-empty result; a statement that no reset was run |
| 4. One AC03 vector in TypeScript and SQL from one file | The fixture path; both passing lines; M4.1–M4.4 failure lines |

Also record:
- the stray-SQL comparison table, the deletions, and the notice to lane S2;
- the M2.3 and M2.4 fail-closed lines;
- any mismatch between `private.contracts` and the snapshot;
- the `gen types` comparison.

## 7. Not in phase 2

- Making RPCs emit the §4 envelopes and error codes, decimal strings, cursors, jobs, storage intents,
  webhooks or rate limits, and adding the §4 primitives to the contract. Those are planned for MB-1 and
  the goals named in 003.
- Changing `sessionSummary`'s volume for sessions with no eligible set (MB-4, checkpoint F-20).
- Changing phase 2A's baseline variable, its default or its CI behaviour. That belongs to the
  `packages/domain` owner. Failing closed in CI is a decision (003 §8), and the owner's correction is
  candidate `22c5386`, not verified here.
- The checks that 003 §12 routes elsewhere in revision 2:
  - rejected requests are counted and replays are not (MB-1; PR-2);
  - tombstones survive a restore, and a failed register append stops erasure (MB-7, PL-5; PR-1).

  They need code that AR-1 does not build.
- Any change to `status.json`, the GOALS.md boxes or ACCEPTANCE.md. AR-1 is an early prover of PD-02,
  not its last prover.
- Push, deploy or any remote Supabase command.
