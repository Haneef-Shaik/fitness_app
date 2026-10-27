# QA-9 phase 3D · `pnpm check` outputs, staged and committed

| Field | Value |
|---|---|
| Session | Local Claude session `50545607-a359-4d5a-9cd4-51d5f6818fa8` (named by the tool-results folder of run 13's saved output), launched as `goal-implementer` in `dontAsk` mode for Codex's phase-3D brief (AUTH-01) |
| Machine | Local macOS (Darwin 27.0.0), Node `v22.23.1` (`rtk proxy node --version`), pnpm `10.27.0` (`packageManager` pin) |
| Commands | Run 13 (staged, before the commit): `rtk proxy pnpm check`. Run 18 (after commit `4a7ee2100bffbfa77671017b83b1300b341a1dec`): `rtk proxy pnpm check`. Run numbers are the checkpoint's ("Commands run in phase 3D") |
| Results | **Run 13: exit 0**, 282 tests (37 + 97 + 126 + 22). **Run 18: exit 1**, at the domain test: `Error: exact branches coverage 271/313 (86.5815%) does not meet the threshold of 86.9%`. The mobile and plan tests did not run |
| Redaction | Both outputs were checked for secrets. Run 13's saved file was searched with Grep for `token`, `secret`, `password`, `api_key`/`api-key`, `bearer`, `sk-…` and `eyJ…`, and the only match was "semantic tokens" in the design-rules line. Run 18's output was read in full. Neither holds a credential, token, key or environment value, so **nothing was removed**. Absolute paths under `/Users/Adya/.codex/worktrees/fitlog-qa9/` are kept, as in every QA-9 record |
| Committed? | **No.** This file was written after commit `4a7ee21`, so it is untracked and not part of it |
| Normalization | *(Phase 3G, 27 October 2026, Codex's decision under AUTH-01.)* **This is the captured output with trailing spaces removed.** Node printed one space after the last `\|` on each domain coverage-table row whose "uncovered lines" column is empty. That one space was removed from those **12 rows**: 5 in run 13's table and 7 in run 18's. This was done so that `git diff --check` passes. **No output content or figure changed:** no character other than those 12 trailing spaces was added, removed or moved, and no line was added, removed or reordered inside the output blocks. Against the staged copy, `git diff --numstat` showed 12 lines changed and `git diff --ignore-space-at-eol` showed no difference. Phase 3F's run 14 ([phase-3f-check-outputs.md](phase-3f-check-outputs.md)) lists the 12 rows by line number, as numbered before this row was added. This file goes into QA-9's second local commit, so the "Committed?" row above describes only the first commit, `4a7ee21` |

## Run 13: staged, before the commit (exit 0)

The tool saved this output to a file, `…/50545607-a359-4d5a-9cd4-51d5f6818fa8/tool-results/b8nn4sy24.txt`, 43.7 KB and 888 lines. It is copied below in full.

```text

> fitlog@ check /Users/Adya/.codex/worktrees/fitlog-qa9/fitness_app
> node scripts/quality/coverage-ratchet.mjs && node scripts/quality/touched-format.mjs && pnpm typecheck && pnpm lint && pnpm test && pnpm plan:build --check

Coverage ratchet verified. Mobile (apps/mobile/coverage-thresholds.json): statements 12.23, branches 10.57, functions 10.23, lines 18.67. Domain (packages/domain/package.json test): lines 91.42, branches 86.9, functions 90.59. Nothing is below the floor or 1 Git baseline(s). No @ts-ignore, @ts-nocheck or @ts-expect-error without a reason is in the 142 TypeScript files under apps/mobile and packages/domain. No Babel configuration is among the 210 entries under apps/mobile, apps/mobile/eslint.config.js is as reviewed, and the 131 other files it lints hold no eslint-disable without rules and a reason, and no inline rule configuration. No coverage-suppression comment is in the 141 files under apps/mobile/src and packages/domain/src.
  HEAD@2a95726912c6: checked; records no coverage minimums yet, so the floor applies
  main@2a95726912c6: same commit as an earlier baseline
  the floor is not anchored yet: no trusted baseline (main locally, FITLOG_CONTRACT_BASELINE in CI) records scripts/quality/coverage-floor.json. Until the ratchet is on main, a change that lowers the floor and a threshold together passes this guard; until then the quality tests hold the floor to docs/evidence/QA-9/coverage-baseline.md §5, and a reviewer compares the two at the exact commit that is merged
Formatting verified: the 18 touched JavaScript and TypeScript files match Prettier 3.6.2 with .prettierrc.json. Base: main@2a95726912c6, from HEAD@2a95726912c6: scripts/quality/touched-format.mjs is not committed yet, so only uncommitted edits count. Not checked: 26 not JavaScript or TypeScript. Untouched and untracked files are never checked.

> fitlog@ typecheck /Users/Adya/.codex/worktrees/fitlog-qa9/fitness_app
> pnpm --filter @fitlog/domain typecheck && pnpm --filter @fitlog/mobile typecheck


> @fitlog/domain@0.1.0 typecheck /Users/Adya/.codex/worktrees/fitlog-qa9/fitness_app/packages/domain
> tsc --noEmit && tsc -p tsconfig.client.json --noEmit


> @fitlog/mobile@0.1.0 typecheck /Users/Adya/.codex/worktrees/fitlog-qa9/fitness_app/apps/mobile
> tsc --noEmit


> fitlog@ lint /Users/Adya/.codex/worktrees/fitlog-qa9/fitness_app
> pnpm --filter @fitlog/mobile lint


> @fitlog/mobile@0.1.0 lint /Users/Adya/.codex/worktrees/fitlog-qa9/fitness_app/apps/mobile
> eslint . --max-warnings=0 && node scripts/test-design-rules.cjs

Design rules verified: raw visual values fail; semantic tokens pass.

> fitlog@ test /Users/Adya/.codex/worktrees/fitlog-qa9/fitness_app
> pnpm --filter @fitlog/domain test && pnpm --filter @fitlog/mobile test:ci && pnpm plan:test


> @fitlog/domain@0.1.0 test /Users/Adya/.codex/worktrees/fitlog-qa9/fitness_app/packages/domain
> node ../../scripts/quality/coverage-ratchet.mjs && node --import tsx --enable-source-maps --test --experimental-test-coverage --test-coverage-include='src/**/*.ts' --test-coverage-exclude='src/**/*.test.ts' --test-coverage-lines=91.42 --test-coverage-branches=86.90 --test-coverage-functions=90.59 --test-reporter=spec --test-reporter-destination=stdout --test-reporter=../../scripts/quality/exact-coverage-reporter.mjs --test-reporter-destination=stdout src/*.test.ts

Coverage ratchet verified. Mobile (apps/mobile/coverage-thresholds.json): statements 12.23, branches 10.57, functions 10.23, lines 18.67. Domain (packages/domain/package.json test): lines 91.42, branches 86.9, functions 90.59. Nothing is below the floor or 1 Git baseline(s). No @ts-ignore, @ts-nocheck or @ts-expect-error without a reason is in the 142 TypeScript files under apps/mobile and packages/domain. No Babel configuration is among the 210 entries under apps/mobile, apps/mobile/eslint.config.js is as reviewed, and the 131 other files it lints hold no eslint-disable without rules and a reason, and no inline rule configuration. No coverage-suppression comment is in the 141 files under apps/mobile/src and packages/domain/src.
  HEAD@2a95726912c6: checked; records no coverage minimums yet, so the floor applies
  main@2a95726912c6: same commit as an earlier baseline
  the floor is not anchored yet: no trusted baseline (main locally, FITLOG_CONTRACT_BASELINE in CI) records scripts/quality/coverage-floor.json. Until the ratchet is on main, a change that lowers the floor and a threshold together passes this guard; until then the quality tests hold the floor to docs/evidence/QA-9/coverage-baseline.md §5, and a reviewer compares the two at the exact commit that is merged
✔ PRD training fixture excludes warmups and does not round intermediate e1RM (0.987958ms)
✔ explicit pauses are removed but background time is counted (0.063292ms)
✔ occurrences require an explicit eligible link and exclude future pending days from adherence (7.429291ms)
✔ food portions preserve unknowns and cannot infer liquid density (0.501041ms)
✔ goal progress handles loss, equal targets and baseline-only strength (0.148666ms)
✔ month-end membership and plate calculator fixtures (0.125583ms)
✔ invalid domain inputs cannot enter storage (4.085083ms)
✔ contract version is semver (0.413875ms)
✔ current schemas equal the snapshot for CONTRACT_VERSION (12.276125ms)
✔ every committed snapshot matches its manifest hash (2.128958ms)
✔ manifest versions strictly increase and end at CONTRACT_VERSION (0.328ms)
✔ the package root exports CONTRACT_VERSION (7.7435ms)
✔ the contract covers every Zod schema the package root exports, plus the persisted eight (1.076792ms)
✔ the client entrypoint imports no Node built-ins (1.026916ms)
✔ committed snapshot history is unchanged against each available Git baseline (68.111959ms)
ℹ HEAD@2a95726912c6: checked
ℹ main@2a95726912c6: same commit as an earlier baseline
✔ a snapshot and manifest rewritten together are rejected against a baseline (0.774708ms)
✔ the snapshot command refuses an existing version before planning any write (4.231334ms)
✔ the snapshot command validates existing history before planning a new version (1.139916ms)
✔ a schema change cannot ship as a PATCH bump within its compatibility line (4.401167ms)
✔ the snapshot command writes a snapshot that verifies, and a second write changes nothing (6.172917ms)
✔ a failed write removes only the files that run created (6.0875ms)
✔ CI refuses to check history without a trusted baseline (135.382459ms)
✔ a configured baseline that is not a commit is refused (28.186417ms)
✔ a configured baseline replaces HEAD and main, and an absent file is not a failure (113.665791ms)
✔ a configured baseline fails closed outside a Git work tree; a local run without one only notes it (21.355ms)
✔ a configured baseline fails closed when Git cannot answer, and never reads a failure as an absent file (86.375625ms)
✔ rules JSON Schema cannot express hold at their accept and reject boundaries (9.396083ms)
✔ the refines and transforms the snapshot drops are exactly the ones the vectors cover (1.145333ms)
✔ backdated diary records retain their selected local date in India and DST zones (10.000167ms)
✔ paise input never rounds a binary floating point currency value (0.966208ms)
✔ PRD finance fixtures keep charges, collections, allocations and credit separate (0.892667ms)
✔ training.v1 set vectors match setVolume and epley (1.638584ms)
✔ training.v1 session vectors match sessionSummary (AC03) (9.515875ms)
✔ training.v1 fixture covers the PRD 8.2 cases with explicit nulls (0.768458ms)
ℹ fixture sha256 bc0672b5d26aa93b1e9be41219a0b20db1997913a37d6a9a0b2aac01ed1e1877
ℹ pending MB-4: no-eligible-session expects session volume null and is not asserted against sessionSummary
✔ formatDecimal trims zeros, keeps integers and never returns negative zero (0.209958ms)
✔ formatDecimal refuses non-finite values and invalid scales (0.358416ms)
✔ formatDecimal rounds the binary double, not the decimal (known limit, 003 §4.13) (0.068792ms)
ℹ tests 37
ℹ suites 0
ℹ pass 37
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 716.480708
ℹ start of coverage report
ℹ ---------------------------------------------------------------------------------------------
ℹ file                   | line % | branch % | funcs % | uncovered lines
ℹ ---------------------------------------------------------------------------------------------
ℹ src                    |        |          |         |
ℹ  calculations.ts       |  75.20 |    82.02 |   85.29 | 1 3 12-13 44-51 70-77 79-85 87-89 118
ℹ  cli                   |        |          |         |
ℹ   snapshot-contract.ts |  93.27 |    88.06 |   88.37 | 205-218 223
ℹ  contract.ts           | 100.00 |    88.89 |   92.86 |
ℹ  dates.ts              |  95.24 |    80.00 |  100.00 | 19
ℹ  encoding.ts           |  92.86 |   100.00 |  100.00 | 1
ℹ  finance.ts            |  97.14 |    87.10 |  100.00 | 14
ℹ  index.ts              | 100.00 |   100.00 |  100.00 |
ℹ  models.ts             |  99.11 |   100.00 |  100.00 | 112
ℹ ---------------------------------------------------------------------------------------------
ℹ all files              |  91.42 |    86.90 |   90.60 |
ℹ ---------------------------------------------------------------------------------------------
ℹ end of coverage report
Exact lines coverage 533/583 (91.4237%) meets the threshold of 91.42%
Exact branches coverage 272/313 (86.9010%) meets the threshold of 86.9%
Exact functions coverage 106/117 (90.5983%) meets the threshold of 90.59%
Coverage counts all 8 files that --test-coverage-include matches

> @fitlog/mobile@0.1.0 test:ci /Users/Adya/.codex/worktrees/fitlog-qa9/fitness_app/apps/mobile
> node --test ../../scripts/quality/*.test.mjs && node ../../scripts/quality/coverage-ratchet.mjs && jest --runInBand --ci --coverage --no-watchman

TAP version 13
# Subtest: this repository passes under its own environment, so in CI it is judged against the trusted baseline
ok 1 - this repository passes under its own environment, so in CI it is judged against the trusted baseline
  ---
  duration_ms: 232.204625
  type: 'test'
  ...
# Subtest: the floor never sits below the phase-1 evidence, and equals it exactly until main anchors it
ok 2 - the floor never sits below the phase-1 evidence, and equals it exactly until main anchors it
  ---
  duration_ms: 123.845708
  type: 'test'
  ...
# Subtest: before the first commit the checked-in floor is the minimum, the ratchet as built passes, and the floor is not anchored
ok 3 - before the first commit the checked-in floor is the minimum, the ratchet as built passes, and the floor is not anchored
  ---
  duration_ms: 170.558125
  type: 'test'
  ...
# Subtest: before the first commit, lowering any threshold by 0.01 fails against the floor
ok 4 - before the first commit, lowering any threshold by 0.01 fails against the floor
  ---
  duration_ms: 605.066542
  type: 'test'
  ...
# Subtest: raising thresholds passes the guard; Jest and Node then decide whether coverage meets them
ok 5 - raising thresholds passes the guard; Jest and Node then decide whether coverage meets them
  ---
  duration_ms: 120.866375
  type: 'test'
  ...
# Subtest: a metric removed from the thresholds file or the domain command fails
ok 6 - a metric removed from the thresholds file or the domain command fails
  ---
  duration_ms: 596.414375
  type: 'test'
  ...
# Subtest: a threshold must be a number from 0 to 100 with at most 2 decimals, and per-path thresholds are refused
ok 7 - a threshold must be a number from 0 to 100 with at most 2 decimals, and per-path thresholds are refused
  ---
  duration_ms: 659.229625
  type: 'test'
  ...
# Subtest: narrowing the coverage scope fails; widening it passes
ok 8 - narrowing the coverage scope fails; widening it passes
  ---
  duration_ms: 312.999792
  type: 'test'
  ...
# Subtest: jest.config.cjs may set only the reviewed options, with preset and testMatch pinned and the thresholds file applied unchanged
ok 9 - jest.config.cjs may set only the reviewed options, with preset and testMatch pinned and the thresholds file applied unchanged
  ---
  duration_ms: 1531.606584
  type: 'test'
  ...
# Subtest: the domain test keeps its template, and the gate wiring checks run inside the guard
ok 10 - the domain test keeps its template, and the gate wiring checks run inside the guard
  ---
  duration_ms: 576.042833
  type: 'test'
  ...
# Subtest: once committed, an uncommitted lowering fails against HEAD even when the floor is lowered with it
ok 11 - once committed, an uncommitted lowering fails against HEAD even when the floor is lowered with it
  ---
  duration_ms: 157.447333
  type: 'test'
  ...
# Subtest: until main holds the ratchet the floor is not anchored: a later branch commit can lower it with a threshold, and only integration into main closes that
ok 12 - until main holds the ratchet the floor is not anchored: a later branch commit can lower it with a threshold, and only integration into main closes that
  ---
  duration_ms: 511.914166
  type: 'test'
  ...
# Subtest: once main holds the ratchet, a lowering committed on the branch still fails against main
ok 13 - once main holds the ratchet, a lowering committed on the branch still fails against main
  ---
  duration_ms: 224.386625
  type: 'test'
  ...
# Subtest: once committed, the floor itself never goes down or narrows
ok 14 - once committed, the floor itself never goes down or narrows
  ---
  duration_ms: 247.957708
  type: 'test'
  ...
# Subtest: a baseline file that is not valid JSON fails closed
ok 15 - a baseline file that is not valid JSON fails closed
  ---
  duration_ms: 169.107875
  type: 'test'
  ...
# Subtest: CI needs a trusted full commit ID and never falls back to HEAD or main
ok 16 - CI needs a trusted full commit ID and never falls back to HEAD or main
  ---
  duration_ms: 298.331167
  type: 'test'
  ...
# Subtest: in GitHub Actions CI mode cannot be switched off, and a baseline that forks at HEAD is refused
ok 17 - in GitHub Actions CI mode cannot be switched off, and a baseline that forks at HEAD is refused
  ---
  duration_ms: 283.6125
  type: 'test'
  ...
# Subtest: a configured baseline outside a Git work tree fails closed; a local run there only notes it
ok 18 - a configured baseline outside a Git work tree fails closed; a local run there only notes it
  ---
  duration_ms: 19.192709
  type: 'test'
  ...
# Subtest: a Git failure while reading a baseline throws and is never read as an absent file
ok 19 - a Git failure while reading a baseline throws and is never read as an absent file
  ---
  duration_ms: 145.730792
  type: 'test'
  ...
# Subtest: a thresholds file, floor or domain package that is JSON null or any other non-object fails closed, before and after main anchors the floor
ok 20 - a thresholds file, floor or domain package that is JSON null or any other non-object fails closed, before and after main anchors the floor
  ---
  duration_ms: 2629.029209
  type: 'test'
  ...
# Subtest: the review's tolerant jest.config.cjs falls back to a narrow scope when the thresholds file is null or missing, and the guard refuses both, before and after main anchors the floor
ok 21 - the review's tolerant jest.config.cjs falls back to a narrow scope when the thresholds file is null or missing, and the guard refuses both, before and after main anchors the floor
  ---
  duration_ms: 830.435875
  type: 'test'
  ...
# Subtest: a required file that exists but cannot be read stops the guard with its path, and is never read as missing
ok 22 - a required file that exists but cannot be read stops the guard with its path, and is never read as missing
  ---
  duration_ms: 122.1035
  type: 'test'
  ...
# Subtest: the guard command itself exits 1 and names the file for a null thresholds file under the tolerant config, and for an unreadable one
ok 23 - the guard command itself exits 1 and names the file for a null thresholds file under the tolerant config, and for an unreadable one
  ---
  duration_ms: 313.452084
  type: 'test'
  ...
# Subtest: a coverage-suppression comment in mobile or domain source fails the guard, before and after main anchors the floor
ok 24 - a coverage-suppression comment in mobile or domain source fails the guard, before and after main anchors the floor
  ---
  duration_ms: 727.29925
  type: 'test'
  ...
# Subtest: a baseline file that is JSON null fails closed, like one that is not JSON, and is never read as a baseline that predates it
ok 25 - a baseline file that is JSON null fails closed, like one that is not JSON, and is never read as a baseline that predates it
  ---
  duration_ms: 143.067792
  type: 'test'
  ...
# Subtest: a coverage include pattern outside the scanned src/ fails in the thresholds file and the floor, before and after main anchors the floor; widening inside src/ passes
ok 26 - a coverage include pattern outside the scanned src/ fails in the thresholds file and the floor, before and after main anchors the floor; widening inside src/ passes
  ---
  duration_ms: 2405.772666
  type: 'test'
  ...
# Subtest: the review's case: once main records an include outside src/, keeping it fails and dropping it fails, so a suppression comment there is never counted unseen
ok 27 - the review's case: once main records an include outside src/, keeping it fails and dropping it fails, so a suppression comment there is never counted unseen
  ---
  duration_ms: 310.57925
  type: 'test'
  ...
# Subtest: an unreadable mobile package.json stops the jest-key check itself, whatever order the checks run in
ok 28 - an unreadable mobile package.json stops the jest-key check itself, whatever order the checks run in
  ---
  duration_ms: 0.144
  type: 'test'
  ...
# Subtest: the domain test loads its tests only through the reviewed loader flags, so nothing else transforms domain source before Node counts it
ok 29 - the domain test loads its tests only through the reviewed loader flags, so nothing else transforms domain source before Node counts it
  ---
  duration_ms: 435.308625
  type: 'test'
  ...
# Subtest: the guard refuses a Babel config, a changed ESLint config and an undescribed eslint-disable in the mobile package, before and after main anchors the floor
ok 30 - the guard refuses a Babel config, a changed ESLint config and an undescribed eslint-disable in the mobile package, before and after main anchors the floor
  ---
  duration_ms: 957.57575
  type: 'test'
  ...
# Subtest: the guard refuses @ts-ignore, @ts-nocheck and an unexplained @ts-expect-error in mobile or domain source, before and after main anchors the floor
ok 31 - the guard refuses @ts-ignore, @ts-nocheck and an unexplained @ts-expect-error in mobile or domain source, before and after main anchors the floor
  ---
  duration_ms: 1692.546958
  type: 'test'
  ...
# Subtest: jest.config.cjs pins prettierPath to null, because the Prettier Jest 29 would load is 3 and it then refuses to write an inline snapshot
ok 32 - jest.config.cjs pins prettierPath to null, because the Prettier Jest 29 would load is 3 and it then refuses to write an inline snapshot
  ---
  duration_ms: 138.79
  type: 'test'
  ...
# Subtest: the scanned trees are the mobile and domain sources whose coverage is enforced
ok 33 - the scanned trees are the mobile and domain sources whose coverage is enforced
  ---
  duration_ms: 1.637833
  type: 'test'
  ...
# Subtest: this repository carries no coverage-suppression comment, and the scan reads every file in both trees
ok 34 - this repository carries no coverage-suppression comment, and the scan reads every file in both trees
  ---
  duration_ms: 9.759833
  type: 'test'
  ...
# Subtest: each Istanbul, c8, V8 and Node coverage-suppression comment fails, in mobile and in domain source, with its file and line
ok 35 - each Istanbul, c8, V8 and Node coverage-suppression comment fails, in mobile and in domain source, with its file and line
  ---
  duration_ms: 67.736583
  type: 'test'
  ...
# Subtest: a comment split over lines, one in a test file, and every comment in a file are each reported, in file and line order
ok 36 - a comment split over lines, one in a test file, and every comment in a file are each reported, in file and line order
  ---
  duration_ms: 4.895459
  type: 'test'
  ...
# Subtest: prose that names a coverage tool, without a suppression comment, passes
ok 37 - prose that names a coverage tool, without a suppression comment, passes
  ---
  duration_ms: 3.218125
  type: 'test'
  ...
# Subtest: a missing tree, a link, and a directory or file that cannot be read each fail closed
ok 38 - a missing tree, a link, and a directory or file that cannot be read each fail closed
  ---
  duration_ms: 17.792084
  type: 'test'
  ...
# Subtest: the threshold flags are read as written, and a flag that is not a number is kept as NaN
ok 39 - the threshold flags are read as written, and a flag that is not a number is kept as NaN
  ---
  duration_ms: 0.633958
  type: 'test'
  ...
# Subtest: the verdict compares unrounded: 106/117 meets 90.59 but not 90.60, and 272/313 meets 86.90 but not 86.91
ok 40 - the verdict compares unrounded: 106/117 meets 90.59 but not 90.60, and 272/313 meets 86.90 but not 86.91
  ---
  duration_ms: 0.176833
  type: 'test'
  ...
# Subtest: the comparison is exact in integers: 29/100 meets 29 although (29 / 100) × 100 is 28.999…, and 2 decimals is the limit
ok 41 - the comparison is exact in integers: 29/100 meets 29 although (29 / 100) × 100 is 28.999…, and 2 decimals is the limit
  ---
  duration_ms: 0.157875
  type: 'test'
  ...
# Subtest: missing counts or a threshold that is not a number fail closed
ok 42 - missing counts or a threshold that is not a number fail closed
  ---
  duration_ms: 0.051541
  type: 'test'
  ...
# Subtest: a 2-decimal threshold that Node truncates still fails the run when it is not met, and passes at the exact boundary
ok 43 - a 2-decimal threshold that Node truncates still fails the run when it is not met, and passes at the exact boundary
  ---
  duration_ms: 273.739417
  type: 'test'
  ...
# Node 22.23.1 truncated --test-coverage-functions=50.01 (1/2)
# Subtest: a file the include globs match but no test loads fails the run, because Node would leave its lines out
ok 44 - a file the include globs match but no test loads fails the run, because Node would leave its lines out
  ---
  duration_ms: 169.409792
  type: 'test'
  ...
# Subtest: include globs the reporter cannot read, or thresholds without include globs, fail closed
ok 45 - include globs the reporter cannot read, or thresholds without include globs, fail closed
  ---
  duration_ms: 140.044166
  type: 'test'
  ...
# Subtest: thresholds without a coverage run fail instead of passing silently
ok 46 - thresholds without a coverage run fail instead of passing silently
  ---
  duration_ms: 66.496833
  type: 'test'
  ...
# Subtest: the wiring of this repository passes as reviewed
ok 47 - the wiring of this repository passes as reviewed
  ---
  duration_ms: 1.024541
  type: 'test'
  ...
# Subtest: root check, test, typecheck and lint are pinned, so lint, types and every guard copy keep running
ok 48 - root check, test, typecheck and lint are pinned, so lint, types and every guard copy keep running
  ---
  duration_ms: 2.41475
  type: 'test'
  ...
# Subtest: mobile lint, typecheck and test:ci and the domain typecheck are pinned
ok 49 - mobile lint, typecheck and test:ci and the domain typecheck are pinned
  ---
  duration_ms: 2.680333
  type: 'test'
  ...
# Subtest: no pre or post script may run around a gate script
ok 50 - no pre or post script may run around a gate script
  ---
  duration_ms: 0.551375
  type: 'test'
  ...
# Subtest: type checking stays strict and covers the same files
ok 51 - type checking stays strict and covers the same files
  ---
  duration_ms: 1.0045
  type: 'test'
  ...
# Subtest: the CI check job keeps the trusted baseline line, a one-line pnpm check step and no condition
ok 52 - the CI check job keeps the trusted baseline line, a one-line pnpm check step and no condition
  ---
  duration_ms: 2.789
  type: 'test'
  ...
# Subtest: the workflow is read by YAML layout, not line by line: comments, blank lines and CRLF endings pass
ok 53 - the workflow is read by YAML layout, not line by line: comments, blank lines and CRLF endings pass
  ---
  duration_ms: 0.522792
  type: 'test'
  ...
# Subtest: a missing quality file fails, and every quality test file on disk is one of them
ok 54 - a missing quality file fails, and every quality test file on disk is one of them
  ---
  duration_ms: 1.672958
  type: 'test'
  ...
# Subtest: the mobile coverage run never uses watchman, so a .watchmanconfig cannot hide folders from the files Jest counts
ok 55 - the mobile coverage run never uses watchman, so a .watchmanconfig cannot hide folders from the files Jest counts
  ---
  duration_ms: 0.430333
  type: 'test'
  ...
# Subtest: this repository lints with the reviewed config, and the other files it lints hold no undescribed eslint-disable
ok 56 - this repository lints with the reviewed config, and the other files it lints hold no undescribed eslint-disable
  ---
  duration_ms: 11.466125
  type: 'test'
  ...
# Subtest: the folders the directive scan skips are exactly the global ignores of the reviewed config
ok 57 - the folders the directive scan skips are exactly the global ignores of the reviewed config
  ---
  duration_ms: 0.460792
  type: 'test'
  ...
# Subtest: narrowing or changing the reviewed ESLint config fails, and line endings or a final newline do not
ok 58 - narrowing or changing the reviewed ESLint config fails, and line endings or a final newline do not
  ---
  duration_ms: 5.015042
  type: 'test'
  ...
# Subtest: every other ESLint config source in the mobile package fails, nested or hidden, in any letter case
ok 59 - every other ESLint config source in the mobile package fails, nested or hidden, in any letter case
  ---
  duration_ms: 39.713709
  type: 'test'
  ...
# Subtest: an eslint-disable must name its rules and give a reason, and inline rule configuration fails, in comments and in strings
ok 60 - an eslint-disable must name its rules and give a reason, and inline rule configuration fails, in comments and in strings
  ---
  duration_ms: 130.199167
  type: 'test'
  ...
# Subtest: the scan reads every linted file, in path and line order, and skips ignored, generated and non-source files
ok 61 - the scan reads every linted file, in path and line order, and skips ignored, generated and non-source files
  ---
  duration_ms: 9.513209
  type: 'test'
  ...
# Subtest: a linted file or the config that cannot be read, or a config that is a link, fails closed
ok 62 - a linted file or the config that cannot be read, or a config that is a link, fails closed
  ---
  duration_ms: 3.239291
  type: 'test'
  ...
# Subtest: the installed ESLint ends a // comment at U+2028 and U+2029, so a blanket disable before one turns every rule off, and the scan refuses it
ok 63 - the installed ESLint ends a // comment at U+2028 and U+2029, so a blanket disable before one turns every rule off, and the scan refuses it
  ---
  duration_ms: 224.205208
  type: 'test'
  ...
# Subtest: a mobile package.json that is not JSON, not an object, not a regular file or unreadable fails closed, so its eslintConfig and eslintIgnore keys are never skipped
ok 64 - a mobile package.json that is not JSON, not an object, not a regular file or unreadable fails closed, so its eslintConfig and eslintIgnore keys are never skipped
  ---
  duration_ms: 15.166833
  type: 'test'
  ...
# Subtest: the fixture texts are what the installed Prettier says they are
ok 65 - the fixture texts are what the installed Prettier says they are
  ---
  duration_ms: 66.016834
  type: 'test'
  ...
# Subtest: the touched files are the tracked JavaScript and TypeScript files added, modified or renamed since the fork from main, committed or not
ok 66 - the touched files are the tracked JavaScript and TypeScript files added, modified or renamed since the fork from main, committed or not
  ---
  duration_ms: 376.005875
  type: 'test'
  ...
# Subtest: only touched files are checked: untouched, generated, vendored, untracked and main-only files stay unformatted and pass
ok 67 - only touched files are checked: untouched, generated, vendored, untracked and main-only files stay unformatted and pass
  ---
  duration_ms: 263.541541
  type: 'test'
  ...
# Subtest: an unformatted touched file fails by name, whether committed, renamed, staged or unstaged, and passes once Prettier formats it
ok 68 - an unformatted touched file fails by name, whether committed, renamed, staged or unstaged, and passes once Prettier formats it
  ---
  duration_ms: 755.6725
  type: 'test'
  ...
# Subtest: a touched file Prettier cannot parse fails closed
ok 69 - a touched file Prettier cannot parse fails closed
  ---
  duration_ms: 227.9425
  type: 'test'
  ...
# Subtest: no Prettier config, ignore file, editorconfig, package.json key or pragma can weaken the check; the root config must stay the pinned options
ok 70 - no Prettier config, ignore file, editorconfig, package.json key or pragma can weaken the check; the root config must stay the pinned options
  ---
  duration_ms: 464.791167
  type: 'test'
  ...
# Subtest: the installed Prettier and this repository pin the same exact version and options as the check
ok 71 - the installed Prettier and this repository pin the same exact version and options as the check
  ---
  duration_ms: 204.254916
  type: 'test'
  ...
# Subtest: the base is explicit and fails closed: CI needs the trusted baseline, locally main must exist, and no base means no check
ok 72 - the base is explicit and fails closed: CI needs the trusted baseline, locally main must exist, and no base means no check
  ---
  duration_ms: 387.225875
  type: 'test'
  ...
# Subtest: the rule applies from the commit that adds it, so a base that predates it never asks for files earlier commits touched
ok 73 - the rule applies from the commit that adds it, so a base that predates it never asks for files earlier commits touched
  ---
  duration_ms: 614.797958
  type: 'test'
  ...
# Subtest: a touched link or unmerged path fails closed and is never followed
ok 74 - a touched link or unmerged path fails closed and is never followed
  ---
  duration_ms: 391.566458
  type: 'test'
  ...
# Subtest: the command exits 0 when every touched file is formatted, and 1 naming each one that is not or when no base is found
ok 75 - the command exits 0 when every touched file is formatted, and 1 naming each one that is not or when no base is found
  ---
  duration_ms: 451.8815
  type: 'test'
  ...
# Subtest: a Git failure while finding the touched files throws, and is never read as nothing touched or as a base without the rule
ok 76 - a Git failure while finding the touched files throws, and is never read as nothing touched or as a base without the rule
  ---
  duration_ms: 299.879917
  type: 'test'
  ...
# Subtest: RULE is this module's own path in the repository and the path root check runs, so renaming or moving the check carries the rule start with it
ok 77 - RULE is this module's own path in the repository and the path root check runs, so renaming or moving the check carries the rule start with it
  ---
  duration_ms: 0.185
  type: 'test'
  ...
# Subtest: a renamed check still finds its rule at the fork point, locally and in CI, so later changes stay checked (review finding 1)
ok 78 - a renamed check still finds its rule at the fork point, locally and in CI, so later changes stay checked (review finding 1)
  ---
  duration_ms: 535.8595
  type: 'test'
  ...
# Subtest: in CI the rule must have a start: a base without the check, and no commit after it adding the check, fails instead of checking nothing
ok 79 - in CI the rule must have a start: a base without the check, and no commit after it adding the check, fails instead of checking nothing
  ---
  duration_ms: 307.52975
  type: 'test'
  ...
# Subtest: locally, a committed check whose adding commit Git does not find fails closed, never falls back to uncommitted edits
ok 80 - locally, a committed check whose adding commit Git does not find fails closed, never falls back to uncommitted edits
  ---
  duration_ms: 272.692917
  type: 'test'
  ...
# Subtest: a pull request is checked as GitHub checks it out: a detached merge whose first parent is the baseline still starts the rule at the commit that adopts it (final review finding 2)
ok 81 - a pull request is checked as GitHub checks it out: a detached merge whose first parent is the baseline still starts the rule at the commit that adopts it (final review finding 2)
  ---
  duration_ms: 590.065125
  type: 'test'
  ...
# Subtest: the mobile package of this repository holds no Babel configuration, and the inventory lists every entry outside node_modules
ok 82 - the mobile package of this repository holds no Babel configuration, and the inventory lists every entry outside node_modules
  ---
  duration_ms: 9.562375
  type: 'test'
  ...
# Subtest: every config name the installed jest-expo and @babel/core look for is refused, in any letter case
ok 83 - every config name the installed jest-expo and @babel/core look for is refused, in any letter case
  ---
  duration_ms: 3.853708
  type: 'test'
  ...
# Subtest: a Babel config file fails wherever it sits in the mobile package, hidden or nested, in any letter case
ok 84 - a Babel config file fails wherever it sits in the mobile package, hidden or nested, in any letter case
  ---
  duration_ms: 133.034458
  type: 'test'
  ...
# Subtest: a "babel" key in the mobile package.json fails, and so does any package.json nested in the mobile package
ok 85 - a "babel" key in the mobile package.json fails, and so does any package.json nested in the mobile package
  ---
  duration_ms: 13.931834
  type: 'test'
  ...
# Subtest: node_modules folders are skipped at any depth, as Babel and ESLint skip them, and generated folders are not
ok 86 - node_modules folders are skipped at any depth, as Babel and ESLint skip them, and generated folders are not
  ---
  duration_ms: 10.222208
  type: 'test'
  ...
# Subtest: a link, a folder that cannot be listed, a file that cannot be read and a missing package each fail closed
ok 87 - a link, a folder that cannot be listed, a file that cannot be read and a missing package each fail closed
  ---
  duration_ms: 17.17825
  type: 'test'
  ...
# Subtest: this repository holds no TypeScript suppression comment, and the scan reads every TypeScript file of both packages outside their installed node_modules
ok 88 - this repository holds no TypeScript suppression comment, and the scan reads every TypeScript file of both packages outside their installed node_modules
  ---
  duration_ms: 12.212917
  type: 'test'
  ...
# Subtest: the scanned packages are exactly the ones whose type checks pnpm check runs
ok 89 - the scanned packages are exactly the ones whose type checks pnpm check runs
  ---
  duration_ms: 0.094917
  type: 'test'
  ...
# Subtest: @ts-ignore and @ts-nocheck fail wherever they appear, in any letter case and in strings too, with file and line
ok 90 - @ts-ignore and @ts-nocheck fail wherever they appear, in any letter case and in strings too, with file and line
  ---
  duration_ms: 129.382167
  type: 'test'
  ...
# Subtest: @ts-expect-error needs a reason of at least three different words after it, on its own line and in the same comment
ok 91 - @ts-expect-error needs a reason of at least three different words after it, on its own line and in the same comment
  ---
  duration_ms: 112.929875
  type: 'test'
  ...
# Subtest: the scan reads every TypeScript file in both packages, hidden, generated or nested, and skips only each package's installed node_modules and files TypeScript does not check
ok 92 - the scan reads every TypeScript file in both packages, hidden, generated or nested, and skips only each package's installed node_modules and files TypeScript does not check
  ---
  duration_ms: 6.520375
  type: 'test'
  ...
# Subtest: a missing package, a link, a folder that cannot be listed and a file that cannot be read each fail closed
ok 93 - a missing package, a link, a folder that cannot be listed and a file that cannot be read each fail closed
  ---
  duration_ms: 5.845917
  type: 'test'
  ...
# Subtest: every one-character spelling the installed TypeScript reads as ts-nocheck is refused, the Kelvin sign among them
ok 94 - every one-character spelling the installed TypeScript reads as ts-nocheck is refused, the Kelvin sign among them
  ---
  duration_ms: 129.085875
  type: 'test'
  ...
# 10 spellings: @ts-noCheck @ts-nocheCk @ts-nochEck @ts-nocHeck @ts-nochecK @ts-Nocheck @ts-nOcheck @tS-nocheck @Ts-nocheck @ts-nochecU+212A
# Subtest: a declaration file under apps/mobile/src or packages/domain/src fails, by the names the installed TypeScript gives them, and one outside src/, such as a generated expo-env.d.ts, does not
ok 95 - a declaration file under apps/mobile/src or packages/domain/src fails, by the names the installed TypeScript gives them, and one outside src/, such as a generated expo-env.d.ts, does not
  ---
  duration_ms: 175.221
  type: 'test'
  ...
# Subtest: a TypeScript file that starts with a UTF-16 byte-order mark fails before it is decoded, since the installed TypeScript reads it as UTF-16 and this scan reads UTF-8
ok 96 - a TypeScript file that starts with a UTF-16 byte-order mark fails before it is decoded, since the installed TypeScript reads it as UTF-16 and this scan reads UTF-8
  ---
  duration_ms: 14.864125
  type: 'test'
  ...
# Subtest: a JavaScript file under apps/mobile/src or packages/domain/src fails, since TypeScript does not type-check it and coverage does not count it, and one outside src/ does not
ok 97 - a JavaScript file under apps/mobile/src or packages/domain/src fails, since TypeScript does not type-check it and coverage does not count it, and one outside src/ does not
  ---
  duration_ms: 228.538917
  type: 'test'
  ...
1..97
# tests 97
# suites 0
# pass 97
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 17746.945459
Coverage ratchet verified. Mobile (apps/mobile/coverage-thresholds.json): statements 12.23, branches 10.57, functions 10.23, lines 18.67. Domain (packages/domain/package.json test): lines 91.42, branches 86.9, functions 90.59. Nothing is below the floor or 1 Git baseline(s). No @ts-ignore, @ts-nocheck or @ts-expect-error without a reason is in the 142 TypeScript files under apps/mobile and packages/domain. No Babel configuration is among the 210 entries under apps/mobile, apps/mobile/eslint.config.js is as reviewed, and the 131 other files it lints hold no eslint-disable without rules and a reason, and no inline rule configuration. No coverage-suppression comment is in the 141 files under apps/mobile/src and packages/domain/src.
  HEAD@2a95726912c6: checked; records no coverage minimums yet, so the floor applies
  main@2a95726912c6: same commit as an earlier baseline
  the floor is not anchored yet: no trusted baseline (main locally, FITLOG_CONTRACT_BASELINE in CI) records scripts/quality/coverage-floor.json. Until the ratchet is on main, a change that lowers the floor and a threshold together passes this guard; until then the quality tests hold the floor to docs/evidence/QA-9/coverage-baseline.md §5, and a reviewer compares the two at the exact commit that is merged
PASS src/ui/__tests__/appearance.test.tsx
PASS src/data/__tests__/gym-outbox.test.ts
PASS src/data/__tests__/member-store.test.ts
PASS src/lib/__tests__/auth-callback.test.ts
PASS src/theme/__tests__/theme.test.ts
PASS src/theme/__tests__/preference-store.test.ts
PASS src/lib/i18n/__tests__/catalog.test.ts

=============================== Coverage summary ===============================
Statements   : 12.23% ( 254/2076 )
Branches     : 10.57% ( 164/1551 )
Functions    : 10.23% ( 84/821 )
Lines        : 18.67% ( 191/1023 )
================================================================================

Test Suites: 7 passed, 7 total
Tests:       126 passed, 126 total
Snapshots:   0 total
Time:        1.227 s
Ran all test suites.

> fitlog@ plan:test /Users/Adya/.codex/worktrees/fitlog-qa9/fitness_app
> node --test scripts/plan/lib.test.mjs

TAP version 13
# Subtest: generated plan and board drift is rejected without executing embedded JavaScript
ok 1 - generated plan and board drift is rejected without executing embedded JavaScript
  ---
  duration_ms: 0.938875
  type: 'test'
  ...
# Subtest: parses goals, fields, wrapped needs and anchors
ok 2 - parses goals, fields, wrapped needs and anchors
  ---
  duration_ms: 1.211791
  type: 'test'
  ...
# Subtest: malformed cards fail loudly instead of losing data
ok 3 - malformed cards fail loudly instead of losing data
  ---
  duration_ms: 0.571667
  type: 'test'
  ...
# Subtest: rejects unknown needs and cycles
ok 4 - rejects unknown needs and cycles
  ---
  duration_ms: 0.100833
  type: 'test'
  ...
# Subtest: ready and blocked are derived from needs
ok 5 - ready and blocked are derived from needs
  ---
  duration_ms: 30.973292
  type: 'test'
  ...
# Subtest: claiming a blocked goal needs force, from any earlier status
ok 6 - claiming a blocked goal needs force, from any earlier status
  ---
  duration_ms: 41.787167
  type: 'test'
  ...
# Subtest: writes keep earlier fields and record the true previous status in the feed
ok 7 - writes keep earlier fields and record the true previous status in the feed
  ---
  duration_ms: 47.453833
  type: 'test'
  ...
# Subtest: status words and aliases normalise; junk and prototype keys are refused
ok 8 - status words and aliases normalise; junk and prototype keys are refused
  ---
  duration_ms: 0.130584
  type: 'test'
  ...
# Subtest: rejects unknown goals and non-text fields
ok 9 - rejects unknown goals and non-text fields
  ---
  duration_ms: 9.54675
  type: 'test'
  ...
# Subtest: a damaged status file shape still loads as empty goals
ok 10 - a damaged status file shape still loads as empty goals
  ---
  duration_ms: 24.971292
  type: 'test'
  ...
# Subtest: concurrent writers from separate processes lose nothing
ok 11 - concurrent writers from separate processes lose nothing
  ---
  duration_ms: 271.949625
  type: 'test'
  ...
# Subtest: Done-when and Exit-check boxes belong to their card; prose and code boxes do not
ok 12 - Done-when and Exit-check boxes belong to their card; prose and code boxes do not
  ---
  duration_ms: 0.448
  type: 'test'
  ...
# Subtest: every goal must carry a contract
ok 13 - every goal must carry a contract
  ---
  duration_ms: 0.139
  type: 'test'
  ...
# Subtest: ancestors follow needs transitively
ok 14 - ancestors follow needs transitively
  ---
  duration_ms: 0.076541
  type: 'test'
  ...
# Subtest: the ledger parses rows and their proving goals
ok 15 - the ledger parses rows and their proving goals
  ---
  duration_ms: 0.147125
  type: 'test'
  ...
# Subtest: the PRD's acceptance and decision ids are read from their tables
ok 16 - the PRD's acceptance and decision ids are read from their tables
  ---
  duration_ms: 0.095625
  type: 'test'
  ...
# Subtest: a complete ledger passes the coverage check
ok 17 - a complete ledger passes the coverage check
  ---
  duration_ms: 0.275958
  type: 'test'
  ...
# Subtest: the coverage check names every gap
ok 18 - the coverage check names every gap
  ---
  duration_ms: 0.375833
  type: 'test'
  ...
# Subtest: a gate must actually wait on a goal that proves the row
ok 19 - a gate must actually wait on a goal that proves the row
  ---
  duration_ms: 0.070625
  type: 'test'
  ...
# Subtest: Done is refused while a need is open, unless overridden with a reason
ok 20 - Done is refused while a need is open, unless overridden with a reason
  ---
  duration_ms: 25.036875
  type: 'test'
  ...
# Subtest: a milestone is declared only when its needs are Done and its ledger rows pass
ok 21 - a milestone is declared only when its needs are Done and its ledger rows pass
  ---
  duration_ms: 57.957875
  type: 'test'
  ...
# Subtest: the gate report says whether a milestone can be declared and why not
ok 22 - the gate report says whether a milestone can be declared and why not
  ---
  duration_ms: 9.24025
  type: 'test'
  ...
1..22
# tests 22
# suites 0
# pass 22
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 557.722916

> fitlog@ plan:build /Users/Adya/.codex/worktrees/fitlog-qa9/fitness_app
> node scripts/plan/build.mjs --check

GOALS.md: 114 goals, 230 needs, 10 lanes; ACCEPTANCE.md: 94 ledger rows, every PRD scenario and decision covered
plan.json and board.html match GOALS.md
```

## Run 18: after commit `4a7ee21` (exit 1)

The tool returned this output inline, headed `Exit code 1`. It is copied below in full.

```text
Exit code 1

> fitlog@ check /Users/Adya/.codex/worktrees/fitlog-qa9/fitness_app
> node scripts/quality/coverage-ratchet.mjs && node scripts/quality/touched-format.mjs && pnpm typecheck && pnpm lint && pnpm test && pnpm plan:build --check

Coverage ratchet verified. Mobile (apps/mobile/coverage-thresholds.json): statements 12.23, branches 10.57, functions 10.23, lines 18.67. Domain (packages/domain/package.json test): lines 91.42, branches 86.9, functions 90.59. Nothing is below the floor or 2 Git baseline(s). No @ts-ignore, @ts-nocheck or @ts-expect-error without a reason is in the 142 TypeScript files under apps/mobile and packages/domain. No Babel configuration is among the 210 entries under apps/mobile, apps/mobile/eslint.config.js is as reviewed, and the 131 other files it lints hold no eslint-disable without rules and a reason, and no inline rule configuration. No coverage-suppression comment is in the 141 files under apps/mobile/src and packages/domain/src.
  HEAD@4a7ee2100bff: checked; records the floor, mobile thresholds, domain thresholds
  main@2a95726912c6: checked; records no coverage minimums yet, so the floor applies
  the floor is not anchored yet: no trusted baseline (main locally, FITLOG_CONTRACT_BASELINE in CI) records scripts/quality/coverage-floor.json. Until the ratchet is on main, a change that lowers the floor and a threshold together passes this guard; until then the quality tests hold the floor to docs/evidence/QA-9/coverage-baseline.md §5, and a reviewer compares the two at the exact commit that is merged
Formatting verified: the 18 touched JavaScript and TypeScript files match Prettier 3.6.2 with .prettierrc.json. Base: main@2a95726912c6, from 4a7ee2100bff, which adds scripts/quality/touched-format.mjs. Not checked: 26 not JavaScript or TypeScript. Untouched and untracked files are never checked.

> fitlog@ typecheck /Users/Adya/.codex/worktrees/fitlog-qa9/fitness_app
> pnpm --filter @fitlog/domain typecheck && pnpm --filter @fitlog/mobile typecheck


> @fitlog/domain@0.1.0 typecheck /Users/Adya/.codex/worktrees/fitlog-qa9/fitness_app/packages/domain
> tsc --noEmit && tsc -p tsconfig.client.json --noEmit


> @fitlog/mobile@0.1.0 typecheck /Users/Adya/.codex/worktrees/fitlog-qa9/fitness_app/apps/mobile
> tsc --noEmit


> fitlog@ lint /Users/Adya/.codex/worktrees/fitlog-qa9/fitness_app
> pnpm --filter @fitlog/mobile lint


> @fitlog/mobile@0.1.0 lint /Users/Adya/.codex/worktrees/fitlog-qa9/fitness_app/apps/mobile
> eslint . --max-warnings=0 && node scripts/test-design-rules.cjs

Design rules verified: raw visual values fail; semantic tokens pass.

> fitlog@ test /Users/Adya/.codex/worktrees/fitlog-qa9/fitness_app
> pnpm --filter @fitlog/domain test && pnpm --filter @fitlog/mobile test:ci && pnpm plan:test


> @fitlog/domain@0.1.0 test /Users/Adya/.codex/worktrees/fitlog-qa9/fitness_app/packages/domain
> node ../../scripts/quality/coverage-ratchet.mjs && node --import tsx --enable-source-maps --test --experimental-test-coverage --test-coverage-include='src/**/*.ts' --test-coverage-exclude='src/**/*.test.ts' --test-coverage-lines=91.42 --test-coverage-branches=86.90 --test-coverage-functions=90.59 --test-reporter=spec --test-reporter-destination=stdout --test-reporter=../../scripts/quality/exact-coverage-reporter.mjs --test-reporter-destination=stdout src/*.test.ts

Coverage ratchet verified. Mobile (apps/mobile/coverage-thresholds.json): statements 12.23, branches 10.57, functions 10.23, lines 18.67. Domain (packages/domain/package.json test): lines 91.42, branches 86.9, functions 90.59. Nothing is below the floor or 2 Git baseline(s). No @ts-ignore, @ts-nocheck or @ts-expect-error without a reason is in the 142 TypeScript files under apps/mobile and packages/domain. No Babel configuration is among the 210 entries under apps/mobile, apps/mobile/eslint.config.js is as reviewed, and the 131 other files it lints hold no eslint-disable without rules and a reason, and no inline rule configuration. No coverage-suppression comment is in the 141 files under apps/mobile/src and packages/domain/src.
  HEAD@4a7ee2100bff: checked; records the floor, mobile thresholds, domain thresholds
  main@2a95726912c6: checked; records no coverage minimums yet, so the floor applies
  the floor is not anchored yet: no trusted baseline (main locally, FITLOG_CONTRACT_BASELINE in CI) records scripts/quality/coverage-floor.json. Until the ratchet is on main, a change that lowers the floor and a threshold together passes this guard; until then the quality tests hold the floor to docs/evidence/QA-9/coverage-baseline.md §5, and a reviewer compares the two at the exact commit that is merged
✔ PRD training fixture excludes warmups and does not round intermediate e1RM (1.032417ms)
✔ explicit pauses are removed but background time is counted (0.064167ms)
✔ occurrences require an explicit eligible link and exclude future pending days from adherence (6.491583ms)
✔ food portions preserve unknowns and cannot infer liquid density (0.44325ms)
✔ goal progress handles loss, equal targets and baseline-only strength (0.139583ms)
✔ month-end membership and plate calculator fixtures (0.1145ms)
✔ invalid domain inputs cannot enter storage (5.479917ms)
✔ contract version is semver (1.253084ms)
✔ current schemas equal the snapshot for CONTRACT_VERSION (10.911958ms)
✔ every committed snapshot matches its manifest hash (1.58825ms)
✔ manifest versions strictly increase and end at CONTRACT_VERSION (0.156584ms)
✔ the package root exports CONTRACT_VERSION (8.3495ms)
✔ the contract covers every Zod schema the package root exports, plus the persisted eight (0.671458ms)
✔ the client entrypoint imports no Node built-ins (0.404708ms)
✔ committed snapshot history is unchanged against each available Git baseline (90.068709ms)
ℹ HEAD@4a7ee2100bff: checked
ℹ main@2a95726912c6: checked
✔ a snapshot and manifest rewritten together are rejected against a baseline (0.720875ms)
✔ the snapshot command refuses an existing version before planning any write (4.883333ms)
✔ the snapshot command validates existing history before planning a new version (1.216208ms)
✔ a schema change cannot ship as a PATCH bump within its compatibility line (4.030084ms)
✔ the snapshot command writes a snapshot that verifies, and a second write changes nothing (5.89425ms)
✔ a failed write removes only the files that run created (5.548125ms)
✔ CI refuses to check history without a trusted baseline (159.334458ms)
✔ a configured baseline that is not a commit is refused (27.707292ms)
✔ a configured baseline replaces HEAD and main, and an absent file is not a failure (118.789583ms)
✔ a configured baseline fails closed outside a Git work tree; a local run without one only notes it (25.599375ms)
✔ a configured baseline fails closed when Git cannot answer, and never reads a failure as an absent file (90.92125ms)
✔ rules JSON Schema cannot express hold at their accept and reject boundaries (9.591417ms)
✔ the refines and transforms the snapshot drops are exactly the ones the vectors cover (1.110125ms)
✔ backdated diary records retain their selected local date in India and DST zones (9.36075ms)
✔ paise input never rounds a binary floating point currency value (0.594ms)
✔ PRD finance fixtures keep charges, collections, allocations and credit separate (0.606083ms)
✔ training.v1 set vectors match setVolume and epley (1.635167ms)
✔ training.v1 session vectors match sessionSummary (AC03) (10.626166ms)
✔ training.v1 fixture covers the PRD 8.2 cases with explicit nulls (0.741084ms)
ℹ fixture sha256 bc0672b5d26aa93b1e9be41219a0b20db1997913a37d6a9a0b2aac01ed1e1877
ℹ pending MB-4: no-eligible-session expects session volume null and is not asserted against sessionSummary
✔ formatDecimal trims zeros, keeps integers and never returns negative zero (0.192375ms)
✔ formatDecimal refuses non-finite values and invalid scales (0.338125ms)
✔ formatDecimal rounds the binary double, not the decimal (known limit, 003 §4.13) (0.057584ms)
ℹ tests 37
ℹ suites 0
ℹ pass 37
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 782.507209
ℹ start of coverage report
ℹ -------------------------------------------------------------------------------------------
ℹ file                   | line % | branch % | funcs % | uncovered lines
ℹ -------------------------------------------------------------------------------------------
ℹ src                    |        |          |         |
ℹ  calculations.ts       |  76.00 |    82.02 |   85.29 | 1 12-13 44-51 70-77 79-85 87-89 118
ℹ  cli                   |        |          |         |
ℹ   snapshot-contract.ts |  93.27 |    87.31 |   88.37 | 205-218 223
ℹ  contract.ts           | 100.00 |    88.89 |   92.86 |
ℹ  dates.ts              | 100.00 |    80.00 |  100.00 |
ℹ  encoding.ts           |  92.86 |   100.00 |  100.00 | 1
ℹ  finance.ts            | 100.00 |    87.10 |  100.00 |
ℹ  index.ts              | 100.00 |   100.00 |  100.00 |
ℹ  models.ts             |  99.11 |   100.00 |  100.00 | 112
ℹ -------------------------------------------------------------------------------------------
ℹ all files              |  91.94 |    86.58 |   90.60 |
ℹ -------------------------------------------------------------------------------------------
ℹ end of coverage report
Exact lines coverage 536/583 (91.9383%) meets the threshold of 91.42%
Error: exact branches coverage 271/313 (86.5815%) does not meet the threshold of 86.9%
Exact functions coverage 106/117 (90.5983%) meets the threshold of 90.59%
Coverage counts all 8 files that --test-coverage-include matches
/Users/Adya/.codex/worktrees/fitlog-qa9/fitness_app/packages/domain:
 ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL  @fitlog/domain@0.1.0 test: `node ../../scripts/quality/coverage-ratchet.mjs && node --import tsx --enable-source-maps --test --experimental-test-coverage --test-coverage-include='src/**/*.ts' --test-coverage-exclude='src/**/*.test.ts' --test-coverage-lines=91.42 --test-coverage-branches=86.90 --test-coverage-functions=90.59 --test-reporter=spec --test-reporter-destination=stdout --test-reporter=../../scripts/quality/exact-coverage-reporter.mjs --test-reporter-destination=stdout src/*.test.ts`
Exit status 1
 WARN   Local package.json exists, but node_modules missing, did you mean to install?
 ELIFECYCLE  Test failed. See above for more details.
 ELIFECYCLE  Command failed with exit code 1.
```
