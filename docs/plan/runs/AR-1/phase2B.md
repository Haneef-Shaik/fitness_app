# AR-1 · Phase 2B — one training fixture for TypeScript and SQL, and the v1 formula functions

| Field | Value |
|---|---|
| Scope | Box 4, source only: the shared AC03 fixture, its TypeScript test against the real calculators, a canonical decimal formatter, the `training_formula_v1` migration body and the rollback-only SQL check ([test-plan §4](test-plan.md); [003 §4.9, §4.13](../../../architecture/003-architecture-freeze.md)) |
| Date | 26 October 2026 |
| Worktree | `/Users/Adya/.codex/worktrees/fitlog-ar1/fitness_app`, branch `codex/ar1-contract-freeze`. The session started at `22c5386`; during this phase the contract test's baseline diagnostic reported `HEAD@3040ccf1bdc0`, so the head moved under this work. No git command was run here |
| Runtime | Node v26.7.0 (from the test output), the installed Zod and TypeScript; nothing installed |
| **AR-1 status** | **Not complete.** The SQL has never run. Box 1 still needs the owner's G-1 approval of 003. No goal, status, board or ledger entry is claimed or changed |
| Addendum | 26 October 2026, after the checkpoint review: the primary has since run the SQL, R5 hardened the check, and R1, R3 and R6 are recorded. See the [addendum](#addendum-26-october-2026-review-r1-r3-r5-r6) at the end. The text above it is left as written |

## Rules this phase kept

- Writes only to the six allowed paths below. No edit to models, calculations, the contract, snapshots,
  the manifest, `index.ts`, any `package.json`, the lockfile, any existing migration, or the ADR,
  checkpoint, test-plan or proposal docs (another worker owns those).
- **No database, Docker, Supabase or git command; no external service, credentials or delegation.**
  The migration file was created empty by the coordinator. This phase only wrote its body.
- Shell commands were only the domain `test` and `typecheck` scripts and the root `check`, each run as
  `rtk proxy pnpm …`. One attempt to pipe the test output through `grep` was denied. It was rerun as
  the exact command (see Commands, below).

## Files

| File | Change |
|---|---|
| `packages/domain/fixtures/ac03-training.v1.json` | New. The only copy of every input and expected value. SHA-256 `bc0672b5d26aa93b1e9be41219a0b20db1997913a37d6a9a0b2aac01ed1e1877`, as printed by the test |
| `packages/domain/src/fixtures.test.ts` | New. 6 tests: 3 fixture tests and 3 `formatDecimal` tests |
| `packages/domain/src/encoding.ts` | New. `CANONICAL_DECIMAL` (the 003 §4.9 pattern) and `formatDecimal(value, scale = 6)`. **Not exported from `index.ts`**: only the test imports it |
| `supabase/migrations/20261025234317_training_formula_v1.sql` | Was empty; now holds 3 private functions and their revokes |
| `scripts/backend/sql/training-fixtures.sql` | New. A psql script that reads the fixture through `-v fixture=…` and always rolls back |
| `docs/plan/runs/AR-1/phase2B.md` | This record |

## Design

### The fixture

- **16 set vectors, 2 session vectors and 1 pending session vector.** The set vectors cover:
  - AC03 itself: working 80×8, warm-up 40×10, and a deleted working set;
  - a failure set and a drop set;
  - per hand ×2 at 30 kg and at 12.5 kg (the second rounds up at the sixth place);
  - assisted, weighted bodyweight and unloaded bodyweight (`loadKg: null`);
  - timed (with reps and load, so only the type rule excludes it) and distance;
  - reps 1, 30 and 31;
  - an eligible 0 kg set, whose volume is `"0"`.
- **Explicit nulls.** Every expectation key is present. `null` means no value exists. The fixture's
  `nullSemantics` field says this in words. Both runners treat a missing key as malformed, never as
  null: the TypeScript side through Zod `strictObject` with `.nullable()` (not `.optional()`), and the
  SQL side through `jsonb_typeof` checks wrapped in `coalesce(…, true)`.
- **Sessions name set vectors by ID,** so no input or expected value is written twice.
  - `ac03-session` is the PRD row exactly: three 80×8 sets and a 40×10 warm-up, giving `"1920"` and 3
    working sets.
  - `ac03-session-with-deleted-set` adds the deleted 100×5 set and expects the same result.
- **`pendingSessionVectors` holds the MB-4 gap and nothing passes for it.**
  - `no-eligible-session` is made of the assisted, unloaded and timed sets, with `prdExpect.volumeKgReps: null`.
  - Each of its sets is asserted as a set vector, against the real functions in TypeScript and SQL.
  - The session total is asserted by neither runner.
  - The TypeScript run prints `pending MB-4: no-eligible-session expects session volume null and is not asserted against sessionSummary` on every run.

### TypeScript (`fixtures.test.ts`)

- It calls the real `setVolume`, `epley` and `sessionSummary`. It contains no formula and no reducer.
  Sets are built with `performedSetSchema`/`exerciseSchema`/`sessionSchema.parse`, and each one must
  pass the real `validateSetForExercise`, so every vector is a set the app can save.
- `sessionSummary` is asserted only for the two AC03 session vectors: `volume` and `workingSets`. The
  schema requires a non-null `volumeKgReps` in `sessionVectors`, so a no-eligible case cannot be put
  there by mistake.
- The coverage test fails if the fixture loses any of these:
  - every set type, exercise type and load basis, with the lists taken from the model enums;
  - a deleted set, and a counted ×2 volume;
  - an e1RM at 1 rep and at 30 reps, and a counted set at 31 reps with no e1RM;
  - a set with no load;
  - both null and non-null volume and e1RM, and the eligible `"0"`;
  - the AC03 IDs.

  It also checks that IDs are unique, that every reference resolves, and that every set of a pending
  vector expects a null volume. It prints the fixture's SHA-256.
- **Formatting.** `formatDecimal`:
  - uses `toFixed(scale)`;
  - trims trailing zeros only after a point;
  - turns `-0` and tiny negatives into `"0"`;
  - refuses NaN, ±Infinity, values of 1e21 or more (where `toFixed` switches to exponent form) and scales outside 0–20.

  **Binary tie limit:** `formatDecimal(1.005, 2)` is `"1"`, while SQL `round(1.005, 2)` is `1.01`. The
  test pins this as a known limit, not a target. SQL is authoritative, and no fixture value has a tie at
  the seventh decimal.

### SQL migration (written, not executed)

| Function | Rule (PRD §8.2) |
|---|---|
| `private.training_set_eligible_v1(set_type, deleted)` | `deleted is false` and the set type is working, drop or failure. A null or unknown value does not count |
| `private.external_set_volume_v1(logging_type, load_basis, multiplier, set_type, reps, load_kg, deleted)` | `reps × load_kg × multiplier` for an eligible resistance or bodyweight set whose load basis is not assistance; otherwise `null` |
| `private.epley_e1rm_v1(logging_type, load_basis, set_type, reps, load_kg, deleted)` | `load_kg × (30 + reps) / 30`, which equals `load_kg × (1 + reps/30)`, for an eligible resistance set that is not assisted, with reps from 1 to 30 and `load_kg > 0`. It takes no multiplier, so per hand stays per hand |

- Every function is `language sql immutable parallel safe security invoker set search_path=''`. Each
  has `revoke all … from public,anon,authenticated`, as `private.membership_end` does at
  `20261017164708_gym_operations.sql:120`. The parameter types match the columns: `text` logging type,
  load basis and set type; `integer` multiplier and reps; `numeric` load.
- **No early e1RM rounding.**
  - Nothing is rounded inside the functions.
  - The plan's draft `p_load_kg*(1+p_reps::numeric/30)` divides first, at 20 decimals. That makes
    30×8 come to `38.0000000000000000001` and 28.5×10 come to `37.999999999999999999905`, though both
    equal 38 exactly. PR comparisons use unrounded values, and an equal e1RM is not a new record, so
    that drift could create a false PR.
  - In the written form, `load × (30 + reps)` is exact and every value is divided by the same 30. Equal
    e1RMs therefore always compare equal.
  - **Correction (review R6, 26 October 2026):** "always" overstated it.
    - **Why.** PostgreSQL picks a division's result scale from the dividend's own scale: at least 16
      digits at these sizes, or more if the dividend has more decimals. `load_kg` is `numeric` with no
      declared scale (`20261017161031_member_core.sql:91`). So two equal numerators can carry different
      numbers of decimals. For a quotient that never terminates, they then give different digit counts
      and compare unequal. For example, `25 × 40 / 30` gives 16 decimals of 3s, while a load stored
      with 17 or more decimals gives one more digit.
    - **What holds.** The claim holds only while loads keep fewer decimal places than that result
      scale. It does hold for the loads in the fixture and for ordinary entries such as `28.5`.
    - **Routed, not fixed here.** Either MB-1 gives `load_kg` a bounded scale (003 §4.9: each field
      states its scale, backed by a `numeric` range check), or MB-4 compares e1RMs at a fixed scale.
- **Kept out of the migration on purpose:**
  - The draft's `private.format_decimal_v1`. That is the §4.9 wire encoding, planned for MB-1 and not
    part of 0.1.0. The check formats locally with `trim_scale(round(x, 6))::text`.
  - Any table, grant, public RPC or session aggregate. The completed-session filter belongs to the
    caller (MB-4).

### SQL check (written, not executed)

- psql variable `fixture` → `set_config('fitlog.training_fixture', :'fixture', true)` inside
  `begin … rollback`, with `\set ON_ERROR_STOP on` and `set local search_path = ''`. Without
  `-v fixture` it raises `Pass the fixture text: …` instead of passing silently.
- It prints the SHA-256 of the fixture text it received.
- It checks each function's properties: immutable (`provolatile = 'i'`), not security definer, and
  `proconfig = {search_path=""}`. It also checks that `has_function_privilege` is false for `public`,
  `anon` and `authenticated`; a role that does not exist in the database is skipped.
- It then checks every set vector through the functions, and every session vector with `sum()` over
  the volume function and a `count(*) filter` over the eligibility function. It collects every failure
  and raises them as one `training.v1 fixture failed in SQL: …`.

**Desk check, not a run.** Worked by hand with numeric arithmetic:

| Vector | Volume | e1RM |
|---|---|---|
| `ac03-working-80x8` | `640` | `3040/30` = `101.3333333333333333` → `101.333333` |
| `failure-70x6`, `drop-60x12` | `420`, `720` | `2520/30` = `84` |
| `per-hand-30x8` | `480` | `1140/30` = `38` |
| `per-hand-12.5x10` | `250.0` → `250` | `500.0/30` = `16.6666666666666667` → `16.666667` |
| `reps-1-lower-bound` | `100` | `3100/30` → `103.333333` |
| `reps-30-upper-bound` | `1500` | `3000/30` = `100` |
| `zero-load` | `0` | `null` |
| `ac03-session`, `ac03-session-with-deleted-set` | `sum` = `1920` | working sets: `count` = 3 |

All the other set vectors are `null` in both columns, as the fixture expects.

## Commands and results, in order

| # | Command | Result |
|---|---|---|
| 1 | `rtk proxy pnpm --filter @fitlog/domain test 2>&1 \| tail -40`, with only the fixture and `fixtures.test.ts` written (**RED**) | Exit 1. `Error [ERR_MODULE_NOT_FOUND]: Cannot find module '…/packages/domain/src/encoding.ts' imported from …/packages/domain/src/fixtures.test.ts`, `✖ src/fixtures.test.ts`, `ℹ tests 32`, `ℹ pass 31`, `ℹ fail 1` |
| 2 | Same command piped through `grep` | **Denied** by the permission mode; nothing ran |
| 3 | `rtk proxy pnpm --filter @fitlog/domain test`, after adding `encoding.ts` (**GREEN**) | `ℹ tests 37`, `ℹ pass 37`, `ℹ fail 0`. `ℹ fixture sha256 bc0672b5d26aa93b1e9be41219a0b20db1997913a37d6a9a0b2aac01ed1e1877`; the pending MB-4 line |
| 4 | `rtk proxy pnpm --filter @fitlog/domain typecheck` | `tsc --noEmit && tsc -p tsconfig.client.json --noEmit`, exit 0 |
| 5 | Mutation, next section | Failed as expected |
| 6 | `rtk proxy pnpm --filter @fitlog/domain test`, after the restore | `ℹ tests 37`, `ℹ pass 37`, `ℹ fail 0`, `ℹ fixture sha256 bc0672b5d26aa93b1e9be41219a0b20db1997913a37d6a9a0b2aac01ed1e1877` |
| 7 | `rtk proxy pnpm check` | Exit 0. Domain and mobile `tsc` clean. `eslint . --max-warnings=0` clean and `Design rules verified: raw visual values fail; semantic tokens pass.` Domain 37 of 37. Mobile `Tests: 126 passed, 126 total`. Plan `ℹ tests 22`, `ℹ pass 22`. `GOALS.md: 114 goals, 230 needs, 10 lanes; ACCEPTANCE.md: 94 ledger rows, every PRD scenario and decision covered`, `plan.json and board.html match GOALS.md` |

The domain test count goes from 31 to 37. Mobile (126) and plan (22) are unchanged.

## Mutation check (TypeScript half of M4.3)

| Step | Evidence |
|---|---|
| Before | `ℹ fixture sha256 bc0672b5d26aa93b1e9be41219a0b20db1997913a37d6a9a0b2aac01ed1e1877` (run 3) |
| Break | In the fixture, on `ac03-working-80x8` only, `"e1rmKg": "101.333333"` → `"101.333334"` |
| Failure | Exit 1, `ℹ pass 36`, `ℹ fail 1`. `✖ training.v1 set vectors match setVolume and epley` with `actual: [ 'ac03-working-80x8 e1rmKg: expected 101.333334, got 101.333333' ]`. The hash changed to `417c6be61eb3f16e4a7746e7580b3c8cb76325dd1287d932ee4566d7f935b873` |
| Restore | The exact string put back. Run 6 prints `bc0672b5…1877` again, the pre-mutation hash, and 37 of 37 pass |

The SQL half of this mutation has not been run (below).

## Gaps and findings

1. **MB-4 aggregate gap (checkpoint F-20).** PRD §8.2 and 003 §4.9 say a session with no eligible set
   has volume `null`. `sessionSummary` returns `0` (`calculations.ts:33-36`). This phase does **not**
   fix it, and no test reducer stands in for it. The case is `pendingSessionVectors[0]`. When MB-4
   changes `sessionSummary`, it should move that vector into `sessionVectors` with
   `"volumeKgReps": null` and relax the non-null session schema in `fixtures.test.ts`.
2. **No session best e1RM.** The draft's `bestE1rmKg` was dropped: no production TypeScript function
   returns a session best e1RM, and a test-side `max` would be the forbidden reducer. AC03's e1RM is
   asserted per set, and the deleted 100×5 set's `null` e1RM is asserted per set.
3. **Open PRD question for the owner or MB-4.** A bodyweight set saved with load `0` (not `null`) gets
   volume `0` in both TypeScript and SQL. PRD §8.2 counts "externally weighted" bodyweight sets and
   says "no invented kg volume", which may mean `null`. That case is left out of the fixture rather
   than pinned either way.
4. **Unknown values.** SQL uses allow-lists, and a `null` deleted flag does not count. TypeScript
   excludes only `warmup` and `assistance`. They agree on every value the model enums allow. SQL is
   stricter on values the schema already rejects.
5. **Hash through a shell.** `-v fixture="$(cat …)"` drops the file's final newline, so the SQL notice
   will equal `printf '%s' "$(cat packages/domain/fixtures/ac03-training.v1.json)" | shasum -a 256`, not
   `bc0672b5…`. A runner that passes the exact file text as an argument (test-plan §4, `execFileSync`)
   gets the file hash.
6. **Fail-closed assumption to confirm.** The check expects `proconfig` to be `{search_path=""}` for
   `set search_path=''`. If PostgreSQL stores it differently, the check fails with
   `… must be immutable and security invoker with an empty search_path`. Inspect it rather than loosen it.
7. `calculations.test.ts:15-22` still repeats the AC03 numbers inline (003 §4.13 "Today"). It was out
   of scope here.

## Remaining work, not done here

- **Run the SQL (coordinator, in a disposable isolated database).** Every SQL result below is a
  prediction until then:
  - **SQL RED:** before the migration is applied, the check should stop at
    `function "private.training_set_eligible_v1(text,boolean)" does not exist`.
  - **SQL GREEN:** after the migration is applied, it should print the hash line and
    `training.v1: 16 set vectors and 2 session vectors passed in SQL; 1 pending MB-4 session vectors not asserted`,
    then `ROLLBACK`.
  - **SQL half of M4.3:** apply the same one-character edit, expect
    `training.v1 fixture failed in SQL: ac03-working-80x8 e1rmKg: expected 101.333334, got 101.333333`,
    restore, and confirm with `shasum -a 256` (the fixture is untracked).
  - **M4.2:** a function mutation inside the rolled-back transaction. If it uses `create or replace`
    with the same options, the property check still passes and only the vectors fail.
  - **M4.4 now differs from the plan.** The pending vector is not asserted by either runner, so the
    null rule is proved at set level instead. For example, set `bodyweight-no-load-12`'s
    `volumeKgReps` to `"0"`: both runners should fail on that ID.
  - **Missing variable:** run once without `-v fixture` and expect `Pass the fixture text`.
- **Replay and diff (box 3).** Replay all migrations from empty to the new head, with an empty schema
  diff and no reset.
- **Files outside this phase:**
  - `scripts/backend/verify-fixtures.mjs` (the runner);
  - the `backend:test` entry in `package.json`;
  - `export * from './encoding.ts'` in `index.ts`, with a contract-test review;
  - optionally, moving the `formatDecimal` tests to `encoding.test.ts`.
- **M4.1** (`calculations.ts` `/30` → `/31`) was not run, because `calculations.ts` was outside the
  allowed writes. The fixture mutation above shows that the set-vector test fails on a one-digit change.
- **Approval and closure.** The owner's G-1 approval, `handoff.md`, `pnpm backend:test`, and then the
  goal verifier. AR-1 is not complete, and nothing here claims an approval or a Done status.

## Addendum (26 October 2026, review R1, R3, R5, R6)

Written after the checkpoint review [fixture-review.json](../../../evidence/AR-1/fixture-review.json).
Its PASS covers this checkpoint only; it is not final AR-1 acceptance. For this addendum the worker
edited only `scripts/backend/sql/training-fixtures.sql` and this file. It ran no shell, database, Docker
or git command, and changed no fixture, migration or domain file.

**History kept.** "The SQL has never run", the "written, not executed" headings and the predictions
under Remaining work were true when this phase wrote them. They are left as written.

### R1: the primary's SQL run

This run was done by the primary, not by this worker. The primary evidence is
[fixture-sql-gates.md](../../../evidence/AR-1/fixture-sql-gates.md) and
[fixture-sql-probes.json](../../../evidence/AR-1/fixture-sql-probes.json). According to those records:

- **Setup.**
  - Image `public.ecr.aws/supabase/postgres:17.11.0.004`, in an owned, disposable container with no
    network, ports or host mounts.
  - Only the `private` schema and the `anon` and `authenticated` roles were created first; then only
    `20261025234317_training_formula_v1.sql` was applied.
  - This is a formula test. It is not a migration replay from empty (box 3) and not an API isolation test.
- **Exact fixture bytes.** The fixture was passed as the exact file bytes through argv, and the hash
  notice was `bc0672b5…1877`, the same as the TypeScript hash. Gap 5 (the dropped final newline) did not
  affect this run, but it still applies to the `$(cat …)` call documented in the check (review R2).
- **RED:** exit 3, because `private.training_set_eligible_v1` did not exist.
- **GREEN:** `training.v1: 16 set vectors and 2 session vectors passed in SQL; 1 pending MB-4 session vectors not asserted`,
  then `ROLLBACK`. Because GREEN passed, the function-property check passed too, so gap 6's `proconfig`
  assumption held.

| Probe | Recorded failure or result |
|---|---|
| `bad-expected` (the SQL half of M4.3) | `ac03-working-80x8 e1rmKg: expected 101.333334, got 101.333333`; hash `417c6be6…`, the same as the TypeScript mutation run |
| `null-is-not-zero` (the null rule, at set level) | `ac03-warmup-40x10 volumeKgReps: expected 0, got null`. The primary mutated this vector, not the `bodyweight-no-load-12` suggested above |
| `bad-formula` (`/31` inside the transaction) | Seven e1RM vectors fail, for example `ac03-working-80x8 e1rmKg: expected 101.333333, got 98.064516` |
| `missing-fixture` | `Pass the fixture text: …` |
| `public-grant` | `private.epley_e1rm_v1(…) is executable by public`, and by `anon` and `authenticated` |
| `restored`, `after-grant-rollback` | The GREEN line again, with hash `bc0672b5…1877` |

The review asks for more in the verification record: the image digest, and `shasum` before each
mutation and after each restore. Those are the primary's to add. This addendum only links what already
exists.

### R3: what the SQL run proves

- **Set level.** The SQL run proves the set-level formulas: the three private functions match all 16
  set vectors.
- **Session level.** The SQL session results for the 2 AC03 session vectors (`1920` and 3 working sets)
  are written in the check itself: a `sum()` over `external_set_volume_v1` and a `count(*) filter` over
  `training_set_eligible_v1`. They follow PRD §8.2's definition of session volume, but they are test
  compositions, not a production SQL aggregate. No SQL session function and no completed-session filter
  exist yet; both belong to MB-4.
- **"No reducer"** in the TypeScript section is true of the TypeScript test only.

### R5: the check now requires the AC03 IDs (not yet run)

`training-fixtures.sql` now also fails when:
- the set vector `ac03-working-80x8` is missing;
- the session vector `ac03-session` is missing;
- a session ID is missing or repeated anywhere in `sessionVectors` and `pendingSessionVectors`;
- a pending session vector names a set vector that does not exist.

The check names IDs only. Every expected value stays in the fixture, which is unchanged
(`bc0672b5…1877`).

**This version has not been run.** The primary's GREEN and probes above used the earlier version.

- **Predicted on a rerun with the unchanged fixture:** the same GREEN line.
- **Predicted probes:**
  - renaming `ac03-session` should fail with `session vector ac03-session is missing`;
  - renaming `ac03-working-80x8` should fail with `set vector ac03-working-80x8 is missing`, and
    also flag the AC03 session vectors that refer to it.

### R6

The equal-e1RM claim is qualified in place: see "Correction (review R6, 26 October 2026)" under the SQL
migration's "No early e1RM rounding". A bounded load scale goes to MB-1, or a fixed-scale comparison to
MB-4.

### Still open (unchanged by this addendum)

- **R2:** the runner script, wired into `backend:test`, with an exact-bytes hash check.
- **R4:** M4.1 and the TypeScript half of null-to-zero (the primary's).
- **R7:** the inline AC03 numbers in `calculations.test.ts`.
- **Boxes 1–3:** box 3's replay and schema diff, box 2's database half, and box 1's G-1 approval.
- The handoff.

AR-1 is not complete. No status, ledger entry or approval is claimed.
