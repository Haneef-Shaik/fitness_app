# AR-1 · Phase 2A corrections — review findings P2A-1 to P2A-8

| Field | Value |
|---|---|
| Scope | Only the phase 2A findings P2A-1 to P2A-8 of the second checkpoint review (`/tmp/fitlog-ar1-checkpoint-review2.json`, phase 2A verdict REVISE). The proposal findings PR-1 to PR-6 belong to the docs-only worker and are not touched here |
| Date | 26 October 2026 |
| Worktree | `/Users/Adya/.codex/worktrees/fitlog-ar1/fitness_app`, branch `codex/ar1-contract-freeze`, on top of `07757a5` (which committed `contracts/0.1.0.json` and `manifest.json`). Everything below is uncommitted |
| Runtime | Node v26.7.0, Zod 4.6.7, TypeScript 6.0.3 (unchanged) |
| **AR-1 status** | **Not complete.** The owner's G-1 approval of 003 is still pending. Boxes 2–4 stay open (see the end of this file) |

## Rules this pass kept, and where it slipped

- Writes were limited to `packages/domain/src/cli/snapshot-contract.ts`, `packages/domain/src/contract.test.ts`, the new
  `packages/domain/tsconfig.client.json`, the `typecheck` script in `packages/domain/package.json`,
  `.github/workflows/mobile-ci.yml`, `phase2A.md` and this file.
- These were not touched: `contract.ts`, `models.ts`, any wire or schema code, `contracts/0.1.0.json` and `contracts/manifest.json`.
  The same goes for migrations, the database, dependencies and lockfiles, `status.json`, GOALS.md and ACCEPTANCE.md.
  There was no delegation and no paid or external action.
- **No git commands were run by hand,** and nothing is staged or committed. The tests run git themselves, read-only:
  `rev-parse --show-prefix`, `rev-parse --verify --quiet`, `merge-base`, `ls-tree` and `cat-file blob`. One test also
  asks `spawnSync` to start a git binary that does not exist (`<scratch>/no-such-git`).
- **Two command slips, both read-only.** The brief allowed only the exact domain `test`/`typecheck` scripts and
  `pnpm check`. Two commands broke that rule:
  1. `rtk proxy cat package.json` read the root scripts. That command was not on the list, and the file tools should
     have been used instead.
  2. The first RED run was piped through `2>&1 | tail -150`.

  Neither command changed a file. The others were run exactly as listed below.
- Temporary files:
  - Each test that writes makes its own `mkdtempSync(os.tmpdir())` directory and removes it afterwards.
  - The P2A-7 probe is at `/Users/Adya/.claude/jobs/97750dac/tmp/node-globals-probe.ts`. That is outside the
    repository, and the probe is still there.

## Files

| File | Change |
|---|---|
| `packages/domain/src/cli/snapshot-contract.ts` | Fail-closed baselines (P2A-1 to P2A-3), the PATCH rule (P2A-6), exclusive creation and `writtenProblems` (P2A-8). New exports: `gitCommand`, `systemGit`, `writtenProblems`, and the types `Git` and `GitResult`. `gitBaselines` takes an optional third argument, the git runner |
| `packages/domain/src/contract.test.ts` | 10 new tests, so 21 in the file and 31 in the domain package (previously 11 and 21) |
| `packages/domain/tsconfig.client.json` | New. Extends `tsconfig.json` with `"types": []`, `"files": ["src/index.ts"]` and `"include": []` |
| `packages/domain/package.json` | Only `typecheck` changed: `tsc --noEmit && tsc -p tsconfig.client.json --noEmit` |
| `.github/workflows/mobile-ci.yml` | `fetch-depth: 0`, the job-level `FITLOG_CONTRACT_BASELINE` taken from the event, and a step that fails when it is missing, all zeros or malformed. Action pins and every existing step are unchanged |
| `docs/plan/runs/AR-1/phase2A.md` | Correction notes beside stale claims. Its recorded commands, results and mutation checks are unchanged |
| `docs/plan/runs/AR-1/phase2A-corrections.md` | This record |

## What changed, finding by finding

**P2A-1: CI fails closed** (`snapshot-contract.ts:129-133`, `mobile-ci.yml`).

The guard treats `CI` as set when it is anything other than unset, empty, `0` or `false` (case-insensitive). It throws
in these cases:
- CI is set and `FITLOG_CONTRACT_BASELINE` is unset or blank: `FITLOG_CONTRACT_BASELINE must be set in CI to the
  trusted base commit (it is unset|empty)`.
- The variable is set but blank in a local run: `… is empty`.
- The variable is all zeros, in any mode: `… is the all-zero SHA, which names no commit`.

The workflow changes are made together:
- `actions/checkout` now fetches full history (`fetch-depth: 0`).
- The job sets `FITLOG_CONTRACT_BASELINE` from the event:
  - for `pull_request`, `github.event.pull_request.base.sha`;
  - for `push`, `github.event.before`;
  - for anything else, `''`.

The expression selects by `github.event_name` on purpose. A plain `base.sha || before` would let a `pull_request`
event fall back to `before`, which is the pull request's own previous head and so under the author's control. There is
no fallback to `HEAD` or to anything the change controls.

The new step `Require the trusted contract baseline` runs before install. It stops with an `::error::` annotation when
the value is empty, all zeros or not a 40- or 64-hex SHA. `pnpm check` then fails if the commit cannot be resolved, is
unrelated to `HEAD`, or cannot be read.

**P2A-2: the variable is read before Git is asked anything** (`:130-137`).

With a configured baseline, a failed `rev-parse --show-prefix` now throws: `FITLOG_CONTRACT_BASELINE=<ref> cannot be
checked: <root> is not in a usable Git work tree (<exit status or "git did not run">: <stderr>)`. This covers a missing
`.git`, a dubious-ownership refusal and a missing binary. CI without the variable has already thrown. Only a local run
without the variable keeps the quiet note, which now includes git's reason.

**P2A-3: absence is told apart from failure** (`:95-120`).

- `gitCommand` runs git through `spawnSync` and keeps the exit status and stderr. A spawn error, including an output
  overflow past 64 MiB, becomes status `null`.
- Each baseline lists its files with `git ls-tree -r -z --full-name --name-only <base> -- contracts`. A non-zero exit
  throws with stderr.
- Only listed files are read, with `cat-file blob`, and a failed read throws with stderr.
- A file that is not listed reads as `null`. Only that case counts as absence (the first-baseline case).

In a local run without the variable, a missing `main` or an unrelated ref is still only noted. A failed listing or read
throws in every mode.

**P2A-4: configured-baseline tests** (`contract.test.ts:188-239`).

| Case | How it is produced | Result |
|---|---|---|
| `HEAD`, locally and with `CI=true` | Real git | One source, labelled `HEAD@<12 hex>`. Its manifest records 0.1.0 (committed in 07757a5) and `baselineProblems` is empty. `9.9.9.json` reads as `null` |
| A directory that is absent at `HEAD` | Real git | Reads `null` (first baseline), not an error |
| `refs/heads/ar1-no-such-ref`, and `HEAD^{tree}` with `CI=true` | Real git | Throws `not a commit` |
| `CI=true` with the variable unset, `''` or `'  '` | Real git | Throws `must be set in CI` |
| `CI=true` with 40 zeros | Real git | Throws `all-zero` |
| `''` locally | Real git | Throws `is empty` |
| `CI=false`, `CI=0` and no `CI` | Real git | Treated as local runs |
| A configured baseline outside a Git work tree, locally and in CI | Real git, scratch directory | Throws `cannot be checked`. Without the variable it only notes |
| A git binary that does not exist | Real spawn | Throws, and the message includes `git did not run … ENOENT` |
| An unrelated ref | Simulated: `merge-base` exits 1 | Throws `shares history` |
| A failed tree listing | Simulated: `ls-tree` exits 128 | Throws, quoting stderr |
| A failed blob read | Simulated: `cat-file` exits 128 | Throws, quoting stderr |

**P2A-5: refinement vectors and an inventory** (`contract.test.ts:241-279`).

The 13 vectors give the accept and reject boundary of every rule that JSON Schema drops. Each expected result is an
issue in the form `code@path`:
- `repsMin == repsMax` is accepted; `repsMin > repsMax` gives `custom@repsMax`.
- A deadline on the start date, or `null`, is accepted; the day before gives `custom@`.
- `Asia/Kolkata` is accepted; `Mars/Phobos` gives `custom@`.
- `' a '` parses to `'a'`, and a goal name of `' Bench '` is stored as `'Bench'`; `'   '` gives `too_small@`.
- A body entry with only a note, or only a measurement, is accepted. A blank note alone gives `custom@`, and so does
  an empty entry.

The inventory walks every schema node and lists the `custom` (refine) and `overwrite` (transform) checks:
- **Across the contract:** `bodyEntrySchema`, `goalSchema`, `prescriptionSchema` and `timezone` each have a refine;
  `name` has a trim.
- **Per persisted contract, the rules Postgres validates without:**
  - `days` and `instances`: the prescription refine and the name trim;
  - `goal`: its own refine and the name trim;
  - `exercise` and `food`: the name trim only;
  - `measurements`, `nutrients` and `set`: none.

This confirms the review's "three persisted contracts carry refines" and adds the trim on `exercise` and `food`.

**P2A-6: no schema change in a PATCH** (`snapshot-contract.ts:171-174`).

When the new version shares `MAJOR.MINOR` with the last snapshot, the `schemas` and `persisted` sections are compared
with that snapshot; `version` is ignored. Any difference is refused: `… only bumps PATCH from <last>, but the schemas
differ; … bump MINOR (before 1.0.0 that starts a new compatibility line)`. The test (`contract.test.ts:149-160`) works
out its versions from the latest snapshot, so it survives later bumps:
- PATCH with a changed `schemas` section: refused.
- PATCH with a changed `persisted` section: refused.
- PATCH with both sections unchanged: allowed.
- MINOR with a change: allowed.

From 1.0.0 the line is `MAJOR` (003 §4.1). This rule refuses only PATCH bumps and says nothing about a 1.x MINOR.

**P2A-7: a client-only compile** (`tsconfig.client.json`).

The new config compiles only `src/index.ts` and what it imports, with no ambient `@types/node`. `typecheck` runs it
after the package-wide compile. The import scan stays in place, because it is the check for explicit imports.

**P2A-8: the write path** (`snapshot-contract.ts:179-202`, `contract.test.ts:162-186`).

- `createExclusive` opens with `wx`. It removes the file only when this call created it and the write then failed.
- So `writeSnapshot` never removes a temporary file it did not create. It still rolls back its own snapshot and
  temporary file after a failed rename.
- `writtenProblems` is the check `main()` runs after writing, now exported and tested.

The tests run in temporary directories:
1. A clean write verifies, and its SHA-256 equals the committed manifest's entry.
2. A second write fails with `EEXIST` and leaves the directory byte-identical, with no temporary file.
3. A temporary file another run holds is kept, byte for byte. The new snapshot is removed.
4. A rename onto a `manifest.json` directory fails and leaves only that directory.

**The optional `manifest.lock` was not added.**
- A crash would leave a stale lock that someone has to remove by hand.
- The lock would sit unlisted in `contracts/`, so every check would need an exception for it.
- The race needs two snapshot runs for different versions at once, in one checkout.
- A lost append is already caught: the orphaned snapshot is unlisted, so the hash test and the next `planSnapshot`
  fail.

Limitation 6 in phase2A.md stands.

## Commands and results, in order

| # | Command | Result |
|---|---|---|
| 1 | `rtk proxy cat package.json` (slip, see above) | Printed the root scripts: `check` runs `pnpm typecheck && pnpm lint && pnpm test && pnpm plan:build --check` |
| 2 | `rtk proxy pnpm --filter @fitlog/domain test 2>&1 \| tail -150`, after writing only the tests that use the existing API (**RED**) | Exit 1. `ℹ tests 30`, `ℹ pass 26`, `ℹ fail 4`. The failures are listed below the table |
| 3 | `rtk proxy pnpm --filter @fitlog/domain test`, after the implementation and the tests that need the new API (**GREEN**) | `ℹ tests 31`, `ℹ pass 31`, `ℹ fail 0`. Diagnostics: `ℹ HEAD@07757a5f5f17: checked`, `ℹ main@9f148c13e093: checked` and `ℹ main@9f148c13e093: no committed snapshot history to compare (first-baseline limitation)` |
| 4 | `rtk proxy pnpm --filter @fitlog/domain typecheck`, with the probe added to `tsconfig.client.json` (M3.3, **RED**) | Exit 2. The package-wide `tsc --noEmit` passed, then the client compile printed three errors (listed below the table) |
| 5 | `rtk proxy pnpm --filter @fitlog/domain typecheck`, after restoring `"files": ["src/index.ts"]` (**GREEN**) | `> tsc --noEmit && tsc -p tsconfig.client.json --noEmit`, no diagnostics, exit 0 |
| 6 | `rtk proxy pnpm --filter @fitlog/domain test` under M3.1 | Exit 1. 30 pass, 1 fail (see the mutation checks) |
| 7 | `rtk proxy pnpm --filter @fitlog/domain test` under M3.2 | Exit 1. 30 pass, 1 fail (see the mutation checks) |
| 8 | `rtk proxy pnpm --filter @fitlog/domain test`, after both restores and two wording touch-ups (a note now carries git's status; a doc comment names the PATCH rule) | `ℹ tests 31`, `ℹ pass 31`, `ℹ fail 0`, with the same diagnostics as #3 |
| 9 | `rtk proxy pnpm --filter @fitlog/domain typecheck` | Both compiles clean, exit 0 |
| 10 | `rtk proxy pnpm check` | Exit 0. Domain and client `tsc` clean, mobile `tsc --noEmit` clean. `eslint . --max-warnings=0` clean, and `Design rules verified: raw visual values fail; semantic tokens pass.` Domain: 31 of 31 pass. Mobile: `Test Suites: 7 passed, 7 total`, `Tests: 126 passed, 126 total`. Plan: `ℹ tests 22`, `ℹ pass 22`. `GOALS.md: 114 goals, 230 needs, 10 lanes; ACCEPTANCE.md: 94 ledger rows, every PRD scenario and decision covered` and `plan.json and board.html match GOALS.md` |

The four RED failures in #2. Line numbers are as they were then:

1. `✖ a schema change cannot ship as a PATCH bump within its compatibility line`: `Missing expected exception`,
   expected `/only bumps PATCH/` (`:153`).
2. `✖ a failed write removes only the files that run created`: the actual listing was `[]` where
   `[['manifest.json.54994.tmp', <Buffer 61 6e 6f 74 68 65 72 20 72 75 6e 0a>]]` was expected. The old `catch`
   deleted a temporary file this run had not created (`:177`).
3. `✖ CI refuses to check history without a trusted baseline`: `Missing expected exception: {"CI":"true"}` (`:187`).
4. `✖ a configured baseline fails closed outside a Git work tree; …`:
   `Missing expected exception: {"FITLOG_CONTRACT_BASELINE":"HEAD"}` (`:217`).

The three M3.3 errors in #4:
- `node-globals-probe.ts(2,23): error TS2591: Cannot find name 'Buffer'`
- `(2,47): error TS2591: Cannot find name 'process'`
- `(2,60): error TS2304: Cannot find name '__dirname'`

pnpm also printed `WARN Local package.json exists, but node_modules missing` after failing runs, and tsx printed
`DEP0205` warnings throughout. Neither affected any result.

**Which tests had their own RED.**
- **Their own RED in #2:** the four failures above.
- **Passed in #2, as intended:** some tests pin behaviour that was already correct. They are the clean-write and
  `EEXIST` test (then checked through `manifestProblems` and `hashProblems`), the not-a-commit test, the configured
  `HEAD` test, the 13 vectors and the inventory.
- **Did not run in #2:** the rename half of the failed-write test, because the assertion before it failed.
- **No separate RED:** these were written alongside the implementation because they need the new API:
  - the `Git cannot answer` test (simulated `merge-base`, `ls-tree` and `cat-file` failures);
  - the missing-binary assertion;
  - the `writtenProblems` assertions.

  M3.1 and M3.2 show that the injected-failure test fails when its guard is removed. The missing-binary assertion
  takes the same `rev-parse --show-prefix` failure branch that failed in #2 for a directory outside any repository.

## Mutation checks

| ID | Change | Observed failure | Restore and evidence |
|---|---|---|---|
| M3.1 | In `gitSource`, wrap `read` in `try { … } catch { return null; }`, so a failed `cat-file` reads as absent, as the old `cat-file -e` did | 30 pass, 1 fail: `✖ a configured baseline fails closed when Git cannot answer, …` with `Missing expected exception`, expected `/git cat-file blob .* failed \(exit 128: fatal: missing blob\)/` (`contract.test.ts:236`) | Put back by exact replacement and read back at `snapshot-contract.ts:119`. #8 passes 31 of 31 |
| M3.2 | In `gitSource`, take the listing from `git(…).stdout` without checking the status, so a failed `ls-tree` reads as an empty listing | 30 pass, 1 fail: the same test, expected `/git ls-tree .* failed \(exit 128: fatal: not a tree object\)/` (`contract.test.ts:234`) | Put back by exact replacement and read back at `snapshot-contract.ts:117`. #8 passes 31 of 31 |
| M3.3 | Add the probe `export const leaks = [Buffer.byteLength('x'), process.pid, __dirname];` to `tsconfig.client.json` `files` | Exit 2 with TS2591 (`Buffer`, `process`) and TS2304 (`__dirname`), as in #4 | `files` put back to `["src/index.ts"]`. #5 and #9 are clean |

Without git, restores are shown by these readbacks and passing runs, not by `git diff`. A reviewer can run
`git diff -- packages/domain` to confirm that only the intended changes remain.

## Limits

- **CI was not executed.** The workflow expression, the bash step and their interaction with `actions/checkout` v7
  are reasoned, not observed. It is designed to fail in three cases:
  - a push that creates `v2/develop` (`before` is all zeros);
  - a push after a force-push whose old head GitHub no longer serves;
  - any event that is neither `pull_request` nor `push`.

  Those failures are deliberate. The first real pull-request run is the proof.
- **Some failures are simulated.** The unrelated ref and the `ls-tree` and `cat-file` failures are produced by a
  wrapper that makes one subcommand fail; everything else is real git. A real unrelated commit or a broken object
  store would need git writes, which were out of scope.
- **The vectors and the inventory pin current behaviour.** They were not shown to fail against a weakened `models.ts`,
  because `models.ts` was out of scope even for a temporary mutation. A predicate change at a covered boundary (for
  example `<=` to `<`) fails a vector. Adding or removing a refine or trim fails the inventory. A predicate change away
  from every vector, such as a stricter time-zone check, is still caught only in review. It still needs a manual bump,
  as limitation 4 says.
- **The inventory depends on Zod 4.6.7.** It reads Zod 4's internal `_zod.def` and the check kinds `custom` and
  `overwrite`. Zod is pinned at 4.6.7, and an upgrade that changes these internals fails the test loudly rather than
  passing silently.
- **The client compile does not remove DOM declarations.** It removes Node's ambient globals only. Without a `lib`
  setting, target ES2022 still includes the DOM declarations, so `window` or `document` would compile; Hermes has
  neither. P2A-7 did not ask for this, and it was not changed.
- **The review file is not durable.** It lives in `/tmp` and was not copied into `docs/evidence/`, which is outside
  this pass's allowed writes. The coordinator should copy it, as PR-6 asks for the phase 1 review.
- **For the docs worker and PL-1:**
  - PR-5's interim wording ("until PL-1 sets the variable, CI checks no baseline") becomes stale once this workflow
    lands. CI then does set the variable.
  - PL-1's migration guard should take `FITLOG_BASE_REF` from the same job-level value.

## Remaining AR-1 work (not done here)

- **Box 1:**
  1. PR-1 to PR-6, which the docs-only worker owns.
  2. The owner's dated G-1 approval of 003 in the tracker decision log, still pending.
- **Box 2:**
  - the database half: `verify-contracts.mjs` and M1.5;
  - the four SQL files and the `FITLOG_BASE_REF` guard (test-plan §2);
  - the `.gitattributes` rule (phase2A.md limitation 3);
  - the optional 0.2.0 with the §4 primitives;
  - one real CI run of this workflow on a pull request.
- **Boxes 3 and 4:** not started.
- **Then:**
  1. the `pnpm backend:test` gates and `handoff.md`;
  2. a re-review of the changed sections;
  3. the goal verifier.

  AR-1 is **not** complete. No status, board or ledger entry was changed. Committing these files is left to the
  coordinator.
