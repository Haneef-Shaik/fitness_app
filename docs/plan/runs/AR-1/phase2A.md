# AR-1 · Phase 2A — contract version and immutable schema snapshots

| Field | Value |
|---|---|
| Scope | Box 2, local half only: `CONTRACT_VERSION`, versioned JSON Schema snapshots, and the guards on them ([test-plan §1](test-plan.md), steps 1–3; [003 §8](../../../architecture/003-architecture-freeze.md)) |
| Date | 26 October 2026 |
| Worktree | `/Users/Adya/.codex/worktrees/fitlog-ar1/fitness_app`, branch `codex/ar1-contract-freeze`, on top of `9f148c1` |
| Runtime | Node v26.7.0, Zod 4.6.7, TypeScript 6.0.3 (installed by the coordinator) |
| **AR-1 status** | **Not complete.** Box 1 still needs the owner's G-1 approval of 003. Boxes 2–4 remain open (see the end of this file) |

## Rules this phase kept

- G-9 and G-10 were **not** treated as preconditions. This is routine, reversible work. Owner approval of
  the concrete ADR (003, gate G-1) is **still pending**.
- No migrations, database or Supabase commands, dependency or lockfile changes, `status.json`, GOALS.md or
  ACCEPTANCE.md edits, provider calls or delegation.
- **No git commands were run by hand.** Nothing is staged or committed. The new test and CLI do call git
  themselves, read-only, to find a baseline: `rev-parse --show-prefix`, `rev-parse --verify`,
  `merge-base`, `cat-file -e` and `cat-file blob`.
- Shell commands were only the permitted domain `test`, `typecheck` and `contract:snapshot` scripts and the
  root `pnpm check`, each prefixed with `rtk`.

## Files

| File | Change |
|---|---|
| `packages/domain/src/contract.ts` | New. Safe to load in the client: no Node imports. Exports `CONTRACT_VERSION = '0.1.0'`, `contractSchemas`, `persistedContracts`, `contractSnapshot()`, `contractSnapshotJson()` and the types `ContractSnapshot` and `ContractJson` |
| `packages/domain/src/cli/snapshot-contract.ts` | New. Node only (`fs`, `crypto`, `child_process`). Holds the snapshot command and the history checks the tests reuse |
| `packages/domain/src/contract.test.ts` | New. 11 tests |
| `packages/domain/src/index.ts` | Adds `export * from './contract.ts';` |
| `packages/domain/package.json` | Adds the script `"contract:snapshot": "node --import tsx src/cli/snapshot-contract.ts"` |
| `packages/domain/contracts/0.1.0.json` | Generated, 4,309 lines. SHA-256 `74914ca920f1f9c97957e74ea8b1bf5eea62dfbd26f7c5c80ba9cf91cdcc88e4` |
| `packages/domain/contracts/manifest.json` | Generated: `{"snapshots":[{"version":"0.1.0","sha256":"74914ca9…"}]}` |
| `docs/plan/runs/AR-1/phase2A.md` | This record |

Three files were edited on purpose during the mutation checks and then restored (see the mutation checks below):
`src/models.ts`, `contracts/0.1.0.json` and `src/contract.ts`.

## Design

- **Discovery from exports.** `contractSchemas` holds every `z.ZodType` exported by the four modules
  that `index.ts` re-exports (`models`, `calculations`, `dates`, `finance`), keyed by export name and sorted.
  It throws if a name repeats. Today that is 23 schemas: 7 primitives in `models.ts` (`id`, `name`,
  `note`, `finite`, `localDate`, `timestamp`, `timezone`), 15 model schemas and `paise`. A test fails if the
  package root exports any Zod schema that is not in `contractSchemas`, so adding a new module needs a
  one-line change to `contract.ts`.
- **Persisted eight.** `persistedContracts` builds `exercise`, `food`, `nutrients`, `days`, `instances`,
  `set`, `measurements` and `goal` the same way `scripts/backend/contracts.ts:6` does.
- **Rendering.** Each schema goes through `z.toJSONSchema(schema, { target: 'draft-7', unrepresentable: 'any' })`,
  the same options as the existing generator. Object keys are sorted at every depth, the text is
  indented with two spaces, and it ends with a newline. The snapshot shape is `{persisted, schemas, version}`.
  It is only built on demand, so a client that imports the package pays nothing for it.
- **No new primitives and no wire changes.** The 003 §4 primitives (envelope, error codes, decimal, money,
  cursor) are not in 0.1.0. 003 §8 says 0.1.0 includes them; test-plan §1 step 5 makes them a separate
  0.2.0. The owner should reconcile the wording in 003 §8.
- **Snapshot command** (`planSnapshot` then `writeSnapshot`):
  1. Check the existing history before anything else: the manifest's shape; versions in strictly
     increasing semver order; every listed file exists with its recorded SHA-256; no unlisted files; and
     every Git baseline's manifest entries still appear, in order, with each file still matching the hash
     the baseline recorded.
  2. Refuse a version that is not semver.
  3. Refuse a version that already has a file or a manifest entry.
  4. Refuse a version that is not greater than the last snapshot.
  5. Only then write. The snapshot is created with `flag: 'wx'`, so it can never replace a file. The
     manifest goes to a temporary file, also `wx`, and is moved into place with `renameSync`. If that
     fails, the files this run created are removed. After writing, the command checks the result again.
- **Git baselines.** By default the baselines are `HEAD` and the fork point from local `main`
  (`git merge-base HEAD main`). `HEAD` catches uncommitted edits; the fork point catches edits committed on
  this branch. Setting `FITLOG_CONTRACT_BASELINE=<ref>` replaces both, so CI can pass the pull request base.
  A configured ref that does not resolve is an error. Nothing assumes `origin/main` holds the rebuild:
  no remote ref is read.

## Commands and results, in order

| # | Command | Result |
|---|---|---|
| 1 | `rtk pnpm --filter @fitlog/domain test`, with only `contract.test.ts` written (**RED**) | Exit 1. `Error [ERR_MODULE_NOT_FOUND]: Cannot find module '…/packages/domain/src/cli/snapshot-contract.ts' imported from …/packages/domain/src/contract.test.ts`, then `✖ src/contract.test.ts`, `ℹ tests 11`, `ℹ pass 10`, `ℹ fail 1` |
| 2 | `rtk pnpm --filter @fitlog/domain typecheck` | **Did not typecheck anything.** rtk rewrote it: `[rtk] warning: --filter is not yet supported for pnpm tsc, filters preceding the subcommand will be ignored`. A bare `tsc` ran at the root and printed its help, exit 1 |
| 3 | `rtk proxy pnpm --filter @fitlog/domain typecheck` | `> tsc --noEmit`, exit 0. The `rtk proxy` prefix is used for every later command, to stop the rewrite |
| 4 | `rtk proxy pnpm --filter @fitlog/domain contract:snapshot` | `Wrote contracts/0.1.0.json (sha256 74914ca920f1f9c97957e74ea8b1bf5eea62dfbd26f7c5c80ba9cf91cdcc88e4) and appended it to contracts/manifest.json` |
| 5 | `rtk proxy pnpm --filter @fitlog/domain test` (**GREEN**) | `ℹ tests 21`, `ℹ pass 21`, `ℹ fail 0`. Baseline diagnostics: `ℹ HEAD@9f148c13e093: checked`, `ℹ main@9f148c13e093: same commit as an earlier baseline`, `ℹ HEAD@9f148c13e093: no committed snapshot history to compare (first-baseline limitation)` |
| 6–11 | Mutation checks M1.1–M1.4 (next section) | Each failed as expected and was restored |
| 12 | `rtk proxy pnpm --filter @fitlog/domain test`, after every restore | `ℹ tests 21`, `ℹ pass 21`, `ℹ fail 0` |
| 13 | `rtk proxy pnpm --filter @fitlog/domain typecheck` | `> tsc --noEmit`, exit 0 |
| 14 | `rtk proxy pnpm check` | Exit 0. Domain and mobile `tsc --noEmit` clean. Lint: `eslint . --max-warnings=0` clean, and `Design rules verified: raw visual values fail; semantic tokens pass.` Domain tests: 21 of 21 pass. Mobile: `Test Suites: 7 passed, 7 total`, `Tests: 126 passed, 126 total`. Plan: `ℹ tests 22`, `ℹ pass 22`. `GOALS.md: 114 goals, 230 needs, 10 lanes; ACCEPTANCE.md: 94 ledger rows, every PRD scenario and decision covered` and `plan.json and board.html match GOALS.md` |

QA-1 recorded 10 domain tests; there are now 21. The mobile (126) and plan (22) counts are unchanged.

## Mutation checks

| ID | Change | Observed failure | Restore and evidence |
|---|---|---|---|
| M1.1 | `src/models.ts:4`: `max(100)` → `max(101)`, with no version bump | 20 pass, 1 fail. `✖ current schemas equal the snapshot for CONTRACT_VERSION` with `AssertionError [ERR_ASSERTION]: Contract schemas changed without a version bump: bump CONTRACT_VERSION and run pnpm --filter @fitlog/domain contract:snapshot (changed: schemas.exerciseSchema, schemas.foodSchema, schemas.goalSchema, schemas.mealItemSchema, schemas.name, schemas.planDaySchema, schemas.prescriptionSchema, schemas.programmeSchema, schemas.sessionInstanceSchema, schemas.sessionSchema, persisted.days, persisted.exercise, persisted.food, persisted.goal, persisted.instances)` at `contract.test.ts:41` | Line 4 put back by an exact string replacement and read back as `max(100)`. The current-schema test passes again, so every schema renders the same bytes as the snapshot |
| M1.2 | `contracts/0.1.0.json`: `note.maxLength` `2000` → `2001` (one character) | 16 pass, 5 fail. `✖ every committed snapshot matches its manifest hash`: `'working tree: 0.1.0.json has sha256 6f180310a8c953ffacc36f318e3b2710cb2856faa036c54b60d84e5636eb78c9, but manifest.json records 74914ca920f1f9c97957e74ea8b1bf5eea62dfbd26f7c5c80ba9cf91cdcc88e4; snapshots are immutable'`. Also `current schemas…` (`changed: schemas.note`). The three snapshot-command tests failed too, because they read the real, now-broken history and the command refused (`the existing contract history is invalid`) | Character restored. The hash test passes again, so the file's SHA-256 is back to `74914ca9…`, the value the generator wrote |
| M1.3 | `src/contract.ts`: `CONTRACT_VERSION = '0.1.1'`, with no snapshot | 19 pass, 2 fail. `✖ current schemas…`: `No snapshot for contract 0.1.1: run pnpm --filter @fitlog/domain contract:snapshot` (`contract.test.ts:37`). `✖ manifest versions…`: `'manifest.json ends at 0.1.0, but CONTRACT_VERSION is 0.1.1'` (`contract.test.ts:50`) | Put back to `'0.1.0'`. Both tests pass again |
| M1.4 | Ran `rtk proxy pnpm --filter @fitlog/domain contract:snapshot` a second time | Exit 1: `contract:snapshot refused, nothing written: contract 0.1.0 already has a snapshot, and snapshots are immutable; bump CONTRACT_VERSION in src/contract.ts for a schema change` | Afterwards `contracts/` still holds only `manifest.json` and `0.1.0.json`, with no temporary file. The editor reported `manifest.json` unchanged since it was read after the first write, and the hash test still passes for `0.1.0.json` |

**Two test edits made during the mutation runs** (both are in the final file):
1. The first M1.1 run used `assert.equal(stored, current, …)`. It failed correctly, but Node also printed
   about 140 KB of string diff around the message. I changed it to `assert.ok(stored === current, …)`
   and ran M1.1 again; the table shows that second run.
2. The first M1.3 run also failed three history tests, because they used `CONTRACT_VERSION` as their
   target file. They now use the last manifest entry, so bumping the version before snapshotting trips
   only the two intended guards. The table shows the second M1.3 run. M1.2 ran before this edit, which
   did not touch the hash test.

**Restores were not confirmed with `git diff --exit-code`,** because git was out of scope. A reviewer
can confirm them with `git diff --exit-code -- packages/domain/src/models.ts`, which should print
nothing because `models.ts` is not part of this change, and with `git status --porcelain packages/domain`.

**The coordinated rewrite** (snapshot and manifest edited together) cannot be seen against a real
baseline yet (limitation 1 below). It is tested against a baseline held in memory:
`a snapshot and manifest rewritten together are rejected against a baseline` builds a forged pair (the
snapshot edited to `maxLength: 101` and the manifest hash rewritten to match). It shows that the pair
passes the hash check on its own and that `baselineProblems` rejects it with
`0.1.0.json differs from the baseline …`. `the snapshot command validates existing history before planning a new version`
shows that `planSnapshot` refuses the same pair, a tampered file, a stray `draft.json`, a lower version
and a version that is not semver, all before any write is planned.

## Tests in `contract.test.ts`

The five tests named in test-plan §1, plus six more:

| Test | Fails when |
|---|---|
| `contract version is semver` | `CONTRACT_VERSION` is not `MAJOR.MINOR.PATCH`, with no leading zeros |
| `current schemas equal the snapshot for CONTRACT_VERSION` | There is no snapshot for the version, or the generated text differs from the committed file. The message names the changed schemas |
| `every committed snapshot matches its manifest hash` | A listed file is missing or its SHA-256 differs, or an unlisted file sits in `contracts/` |
| `manifest versions strictly increase and end at CONTRACT_VERSION` | A version is not semver, repeats, is out of order, or the list does not end at the code's version |
| `the package root exports CONTRACT_VERSION` | The module named by `package.json` `exports["."]` stops exporting `CONTRACT_VERSION` or `contractSchemas` |
| `the contract covers every Zod schema the package root exports, plus the persisted eight` | A schema exported from the root is missing from `contractSchemas`; `paise` is missing; the persisted names change |
| `the client entrypoint imports no Node built-ins` | Any module reachable from `index.ts` imports `node:*` or a built-in Node module |
| `committed snapshot history is unchanged against each available Git baseline` | History recorded at `HEAD` or the `main` fork point was edited, reordered or removed |
| `a snapshot and manifest rewritten together are rejected against a baseline` | The baseline logic would accept a forged, self-consistent pair |
| `the snapshot command refuses an existing version before planning any write` | `planSnapshot` accepts a version that already has a snapshot |
| `the snapshot command validates existing history before planning a new version` | `planSnapshot` plans a write over broken history or for a version that is not new |

## Limitations of the hash and immutability guards

1. **First baseline.** No commit contains `packages/domain/contracts/` yet. `HEAD` and the `main` fork
   point are the same commit, `9f148c1`, and neither has a manifest. **Until the snapshot is committed, nothing
   catches a coordinated rewrite of `0.1.0.json` and `manifest.json`.** Once it is committed on this branch,
   `HEAD` catches uncommitted edits. Once it is merged to `main`, the fork point catches edits on later
   branches. Before that merge, a rewrite committed on the same branch can only be caught in review.
2. **A baseline is only as trusted as its ref.** The author controls `HEAD` and local `main`. The guard catches
   accidents and honest mistakes, not someone who deliberately rewrites history. For that, CI (PL-1) should
   set `FITLOG_CONTRACT_BASELINE` to the protected pull request base.
3. **The hash covers file bytes.** If git converts line endings on checkout (`core.autocrlf`), the hash breaks.
   A `.gitattributes` rule such as `packages/domain/contracts/*.json -text` would prevent that. That file
   was outside this phase's allowed writes.
4. **JSON Schema cannot express `.refine()` or transforms.** It misses four rules today: `repsMin <= repsMax`,
   "enter a measurement or note", `deadline >= startDate`, and IANA zone validity (`timezone` renders as
   `{"type":"string"}`). It also misses `name`'s `.trim()`. Changing any of these needs a manual bump.
   Behavioural tests and fixture vectors catch the change itself.
5. **The output depends on the Zod version.** A Zod upgrade that renders schemas differently fails the
   current-schema test and forces a bump even if runtime behaviour is unchanged. That is deliberate.
6. **Concurrent runs.** Two runs for different versions at once could lose one manifest append, because the
   last rename wins. The hash test would then report the unlisted snapshot file.
7. **Uncommitted snapshots are not history yet.** The command never overwrites a file. To regenerate a
   snapshot that was never committed, delete the file and its manifest entry by hand.

## Remaining AR-1 work (not done here)

- **Box 1:** the owner's G-1 approval of 003, as a dated entry in the tracker decision log.
- **Box 2, database half:** `scripts/backend/verify-contracts.mjs` (compares `private.contracts` with the
  snapshot's `persisted` section) and M1.5. If the database differs, do not edit the snapshot; ship a new
  migration.
- **Box 2, follow-ups:** retire or allowlist the four SQL files (G-9, test-plan §2, M2.1–M2.2); commit the
  snapshot so the baseline guard has history (limitation 1); have PL-1 set `FITLOG_CONTRACT_BASELINE` in CI;
  add the optional 0.2.0 with the §4 primitives (test-plan §1 step 5) and reconcile the 003 §8 wording.
- **Box 3:** replay from empty with an empty schema diff, and the drift probe (test-plan §3).
- **Box 4:** the shared AC03 fixture for TypeScript and SQL (test-plan §4, M4.1–M4.3).
- `pnpm backend:test` gates, `handoff.md`, then the goal verifier. AR-1 is **not** complete, and no status,
  board or ledger entry was changed.
