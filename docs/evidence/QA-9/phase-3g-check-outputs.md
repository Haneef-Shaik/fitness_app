# QA-9 · Phase 3G outputs: the eleven-path stage, the second local commit, and one `pnpm check`

| Field | Value |
|---|---|
| What | The outputs of phase 3G's staged-set checks, its one local commit `300709473f12cdae800cd7b3fc25f295887e58ce` on top of `4a7ee21`, and the one `pnpm check` run on that commit with a clean working tree |
| Who | The phase-3G implementer, a local Claude session under Codex's brief after the phase-3F stop (AUTH-01). **These are implementer runs, not independent evidence.** No reviewer has re-run them |
| Node | `v22.23.1` (`rtk proxy node --version`, run 1), the `.node-version` pin |
| Result | **Exit 0.** 285 tests (40 + 97 + 126 + 22). Format step: **19 files**, `Base: main@2a95726912c6, from 4a7ee2100bff, which adds scripts/quality/touched-format.mjs`, **33** not JavaScript or TypeScript. Domain lines **535/583**, branches **273/313**, functions **106/117** |
| Cuts | Each `…` line marks lines left out: the 97 quality tests' TAP output and the 22 plan tests' TAP output. The guard and format lines, everything about the domain package, the mobile summary and the plan build are kept whole. The full output, 892 lines, was written by the tool to the session's background-task file `b4csctutd.output` and read back with Read and Grep |
| Normalization | Node prints one space after the last `\|` on each domain coverage-table row whose "uncovered lines" column is empty. That space is left out of the 5 such rows below, as Codex decided for the outputs of phases 3D and 3E. No other character differs from the captured output |
| Redaction | The full output was searched with Grep for `token`, `secret`, `password`, `api_key`/`api-key`, `bearer`, `sk-…` and `eyJ…`. The only match was "semantic tokens" in the design-rules line. **Nothing was removed.** Absolute paths under `/Users/Adya/.codex/worktrees/fitlog-qa9/` are kept, as in every QA-9 record |
| Run numbers | The checkpoint's, under "Commands run in phase 3G" |
| Written | After the commit, uncommitted. This file is untracked |

## Runs 10–14: the staged set, before the commit, as expected

Run 10, `rtk proxy git diff --cached --name-only`, listed exactly the eleven paths:

```text
docs/evidence/QA-9/implementer-final-2026-10-27T0035Z.md
docs/evidence/QA-9/implementer-final-2026-10-27T0105Z.md
docs/evidence/QA-9/implementer-final-2026-10-27T0205Z.md
docs/evidence/QA-9/phase-3d-check-outputs.md
docs/evidence/QA-9/phase-3e-check-outputs.md
docs/evidence/QA-9/phase-3f-check-outputs.md
docs/evidence/QA-9/ratchet-enforcement.md
docs/evidence/QA-9/reviewer-final-2026-10-27T0135Z.md
docs/plan/runs/QA-9/checkpoint.md
docs/plan/runs/QA-9/handoff.md
packages/domain/src/contract.test.ts
```

Run 12, `rtk proxy git diff --cached --numstat`, with `contract.test.ts` at 713/89 as before:

```text
33	0	docs/evidence/QA-9/implementer-final-2026-10-27T0035Z.md
38	0	docs/evidence/QA-9/implementer-final-2026-10-27T0105Z.md
40	0	docs/evidence/QA-9/implementer-final-2026-10-27T0205Z.md
1032	0	docs/evidence/QA-9/phase-3d-check-outputs.md
225	0	docs/evidence/QA-9/phase-3e-check-outputs.md
102	0	docs/evidence/QA-9/phase-3f-check-outputs.md
397	10	docs/evidence/QA-9/ratchet-enforcement.md
88	0	docs/evidence/QA-9/reviewer-final-2026-10-27T0135Z.md
303	12	docs/plan/runs/QA-9/checkpoint.md
142	13	docs/plan/runs/QA-9/handoff.md
713	89	packages/domain/src/contract.test.ts
```

Run 11, `--stat`, gave the same eleven, `11 files changed, 3113 insertions(+), 124 deletions(-)`. Run 13, `rtk proxy git diff --cached --check`, printed nothing and exited 0. Run 14, `git status --porcelain=v1 -uall`, showed seven `A` and four `M`, all staged, and nothing unstaged or untracked.

## Runs 15–19: the commit, as expected

Run 15, `rtk proxy git commit -m "test(QA-9): cover deterministic Git baseline histories"`. No hook printed anything:

```text
[codex/qa9-quality-ratchets 3007094] test(QA-9): cover deterministic Git baseline histories
 11 files changed, 3113 insertions(+), 124 deletions(-)
 create mode 100644 docs/evidence/QA-9/implementer-final-2026-10-27T0035Z.md
 create mode 100644 docs/evidence/QA-9/implementer-final-2026-10-27T0105Z.md
 create mode 100644 docs/evidence/QA-9/implementer-final-2026-10-27T0205Z.md
 create mode 100644 docs/evidence/QA-9/phase-3d-check-outputs.md
 create mode 100644 docs/evidence/QA-9/phase-3e-check-outputs.md
 create mode 100644 docs/evidence/QA-9/phase-3f-check-outputs.md
 create mode 100644 docs/evidence/QA-9/reviewer-final-2026-10-27T0135Z.md
```

Run 16, `rtk proxy git log --oneline -3`:

```text
3007094 test(QA-9): cover deterministic Git baseline histories
4a7ee21 test(QA-9): coverage ratchet, gate wiring, exact domain thresholds and Prettier on touched files
2a95726 docs(AR-1): record completed integration and delegated sign-off
```

Run 17, `rtk proxy git show --stat HEAD`, listed the same eleven files and totals as run 11, under `commit 300709473f12cdae800cd7b3fc25f295887e58ce`, dated `Tue Oct 27 07:39:54 2026 +0530`. Run 18, `git status --porcelain=v1 -uall`, printed nothing: the tree was clean. Run 19, `rtk proxy git rev-parse HEAD`, printed `300709473f12cdae800cd7b3fc25f295887e58ce`.

## Run 20: `rtk proxy pnpm check`, on commit `3007094`, exit 0

Run once, in the background, with no file edited until it finished.

```text

> fitlog@ check /Users/Adya/.codex/worktrees/fitlog-qa9/fitness_app
> node scripts/quality/coverage-ratchet.mjs && node scripts/quality/touched-format.mjs && pnpm typecheck && pnpm lint && pnpm test && pnpm plan:build --check

Coverage ratchet verified. Mobile (apps/mobile/coverage-thresholds.json): statements 12.23, branches 10.57, functions 10.23, lines 18.67. Domain (packages/domain/package.json test): lines 91.42, branches 86.9, functions 90.59. Nothing is below the floor or 2 Git baseline(s). No @ts-ignore, @ts-nocheck or @ts-expect-error without a reason is in the 142 TypeScript files under apps/mobile and packages/domain. No Babel configuration is among the 210 entries under apps/mobile, apps/mobile/eslint.config.js is as reviewed, and the 131 other files it lints hold no eslint-disable without rules and a reason, and no inline rule configuration. No coverage-suppression comment is in the 141 files under apps/mobile/src and packages/domain/src.
  HEAD@300709473f12: checked; records the floor, mobile thresholds, domain thresholds
  main@2a95726912c6: checked; records no coverage minimums yet, so the floor applies
  the floor is not anchored yet: no trusted baseline (main locally, FITLOG_CONTRACT_BASELINE in CI) records scripts/quality/coverage-floor.json. Until the ratchet is on main, a change that lowers the floor and a threshold together passes this guard; until then the quality tests hold the floor to docs/evidence/QA-9/coverage-baseline.md §5, and a reviewer compares the two at the exact commit that is merged
Formatting verified: the 19 touched JavaScript and TypeScript files match Prettier 3.6.2 with .prettierrc.json. Base: main@2a95726912c6, from 4a7ee2100bff, which adds scripts/quality/touched-format.mjs. Not checked: 33 not JavaScript or TypeScript. Untouched and untracked files are never checked.

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
  HEAD@300709473f12: checked; records the floor, mobile thresholds, domain thresholds
  main@2a95726912c6: checked; records no coverage minimums yet, so the floor applies
  the floor is not anchored yet: no trusted baseline (main locally, FITLOG_CONTRACT_BASELINE in CI) records scripts/quality/coverage-floor.json. Until the ratchet is on main, a change that lowers the floor and a threshold together passes this guard; until then the quality tests hold the floor to docs/evidence/QA-9/coverage-baseline.md §5, and a reviewer compares the two at the exact commit that is merged
✔ PRD training fixture excludes warmups and does not round intermediate e1RM (1.925417ms)
✔ explicit pauses are removed but background time is counted (0.199ms)
✔ occurrences require an explicit eligible link and exclude future pending days from adherence (7.846834ms)
✔ food portions preserve unknowns and cannot infer liquid density (0.477958ms)
✔ goal progress handles loss, equal targets and baseline-only strength (0.148125ms)
✔ month-end membership and plate calculator fixtures (0.120625ms)
✔ invalid domain inputs cannot enter storage (3.856125ms)
✔ contract version is semver (0.542375ms)
✔ current schemas equal the snapshot for CONTRACT_VERSION (9.418167ms)
✔ every committed snapshot matches its manifest hash (1.392833ms)
✔ manifest versions strictly increase and end at CONTRACT_VERSION (0.164084ms)
✔ the package root exports CONTRACT_VERSION (6.674625ms)
✔ the contract covers every Zod schema the package root exports, plus the persisted eight (0.560875ms)
✔ the client entrypoint imports no Node built-ins (0.407209ms)
✔ committed snapshot history is unchanged against each available Git baseline (91.080458ms)
ℹ HEAD@300709473f12: checked
ℹ main@2a95726912c6: checked
✔ a snapshot and manifest rewritten together are rejected against a baseline (0.721667ms)
✔ the snapshot command refuses an existing version before planning any write (4.704125ms)
✔ the snapshot command validates existing history before planning a new version (1.141166ms)
✔ a schema change cannot ship as a PATCH bump within its compatibility line (3.881333ms)
✔ the snapshot command writes a snapshot that verifies, and a second write changes nothing (5.763667ms)
✔ a failed write removes only the files that run created (5.0475ms)
✔ CI refuses to check history without a trusted baseline (310.579ms)
✔ a configured baseline that is not a commit is refused (29.395167ms)
✔ a configured baseline replaces HEAD and main, and an absent file is not a failure (121.131042ms)
✔ a configured baseline fails closed outside a Git work tree; a local run without one only notes it (21.556417ms)
✔ a configured baseline fails closed when Git cannot answer, and never reads a failure as an absent file (90.114667ms)
✔ HEAD and main at one fork point are one baseline, listed once, in any host checkout (0.651542ms)
✔ a branch ahead of or diverged from main checks both fork points, each once, and each protects the history it records (0.377917ms)
✔ a clone without a local main checks HEAD alone and notes main as not found (0.121333ms)
✔ rules JSON Schema cannot express hold at their accept and reject boundaries (9.670666ms)
✔ the refines and transforms the snapshot drops are exactly the ones the vectors cover (1.240042ms)
✔ backdated diary records retain their selected local date in India and DST zones (10.14325ms)
✔ paise input never rounds a binary floating point currency value (0.594875ms)
✔ PRD finance fixtures keep charges, collections, allocations and credit separate (0.614833ms)
✔ training.v1 set vectors match setVolume and epley (2.298333ms)
✔ training.v1 session vectors match sessionSummary (AC03) (9.853708ms)
✔ training.v1 fixture covers the PRD 8.2 cases with explicit nulls (0.380875ms)
ℹ fixture sha256 bc0672b5d26aa93b1e9be41219a0b20db1997913a37d6a9a0b2aac01ed1e1877
ℹ pending MB-4: no-eligible-session expects session volume null and is not asserted against sessionSummary
✔ formatDecimal trims zeros, keeps integers and never returns negative zero (0.265708ms)
✔ formatDecimal refuses non-finite values and invalid scales (0.396958ms)
✔ formatDecimal rounds the binary double, not the decimal (known limit, 003 §4.13) (0.066708ms)
ℹ tests 40
ℹ suites 0
ℹ pass 40
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 904.646583
ℹ start of coverage report
ℹ ---------------------------------------------------------------------------------------
ℹ file                   | line % | branch % | funcs % | uncovered lines
ℹ ---------------------------------------------------------------------------------------
ℹ src                    |        |          |         |
ℹ  calculations.ts       |  76.80 |    82.02 |   85.29 | 1 12-13 44-51 70-77 79-85 87-89
ℹ  cli                   |        |          |         |
ℹ   snapshot-contract.ts |  93.27 |    88.81 |   88.37 | 205-218 223
ℹ  contract.ts           | 100.00 |    88.89 |   92.86 |
ℹ  dates.ts              |  95.24 |    80.00 |  100.00 | 19
ℹ  encoding.ts           |  92.86 |   100.00 |  100.00 | 1
ℹ  finance.ts            |  97.14 |    87.10 |  100.00 | 14
ℹ  index.ts              | 100.00 |   100.00 |  100.00 |
ℹ  models.ts             |  99.11 |   100.00 |  100.00 | 112
ℹ ---------------------------------------------------------------------------------------
ℹ all files              |  91.77 |    87.22 |   90.60 |
ℹ ---------------------------------------------------------------------------------------
ℹ end of coverage report
Exact lines coverage 535/583 (91.7667%) meets the threshold of 91.42%
Exact branches coverage 273/313 (87.2204%) meets the threshold of 86.9%
Exact functions coverage 106/117 (90.5983%) meets the threshold of 90.59%
Coverage counts all 8 files that --test-coverage-include matches

> @fitlog/mobile@0.1.0 test:ci /Users/Adya/.codex/worktrees/fitlog-qa9/fitness_app/apps/mobile
> node --test ../../scripts/quality/*.test.mjs && node ../../scripts/quality/coverage-ratchet.mjs && jest --runInBand --ci --coverage --no-watchman

TAP version 13
…
1..97
# tests 97
# suites 0
# pass 97
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 17781.3595
Coverage ratchet verified. Mobile (apps/mobile/coverage-thresholds.json): statements 12.23, branches 10.57, functions 10.23, lines 18.67. Domain (packages/domain/package.json test): lines 91.42, branches 86.9, functions 90.59. Nothing is below the floor or 2 Git baseline(s). No @ts-ignore, @ts-nocheck or @ts-expect-error without a reason is in the 142 TypeScript files under apps/mobile and packages/domain. No Babel configuration is among the 210 entries under apps/mobile, apps/mobile/eslint.config.js is as reviewed, and the 131 other files it lints hold no eslint-disable without rules and a reason, and no inline rule configuration. No coverage-suppression comment is in the 141 files under apps/mobile/src and packages/domain/src.
  HEAD@300709473f12: checked; records the floor, mobile thresholds, domain thresholds
  main@2a95726912c6: checked; records no coverage minimums yet, so the floor applies
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
Time:        1.179 s
Ran all test suites.

> fitlog@ plan:test /Users/Adya/.codex/worktrees/fitlog-qa9/fitness_app
> node --test scripts/plan/lib.test.mjs

TAP version 13
…
1..22
# tests 22
# suites 0
# pass 22
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 585.140917

> fitlog@ plan:build /Users/Adya/.codex/worktrees/fitlog-qa9/fitness_app
> node scripts/plan/build.mjs --check

GOALS.md: 114 goals, 230 needs, 10 lanes; ACCEPTANCE.md: 94 ledger rows, every PRD scenario and decision covered
plan.json and board.html match GOALS.md

[exited with code 0]
```

## What it shows

- **The gate passes at the committed R19 test**, with `HEAD` = `3007094`, two commits ahead of `main@2a95726`: 285 tests, the same total as phase 3E's run 11 and the phase-3E review.
- **Domain branches are 273/313 (87.2204%)** against 86.90. That matches phase 3E's runs 10 and 11 and the phase-3E review's run, all with `HEAD` ahead of `main`. This is the first of them with the test committed. The `HEAD` = `main` and CI states are still not measured (R19(b)).
- **Domain lines are 535/583**, an R3 sample: two above the 533 the threshold needs. The four named flippers read: `calculations.ts:3` and `:118` covered, `dates.ts:19` and `finance.ts:14` uncovered. That is 46 always-uncovered lines plus 2, so 48 uncovered.
- **The format step is as expected:** 19 files, with the label `from 4a7ee2100bff`. The **33** files not JavaScript or TypeScript are as predicted by counting in ratchet-enforcement.md §16: 26, plus the seven new records.
- **The guard read 2 Git baselines:** `HEAD@300709473f12` now records the floor and both sets of thresholds, and `main@2a95726912c6` records none, so the floor still applies and is **not anchored**.
- **Mobile** is 254/2076, 164/1551, 84/821 and 191/1023, the same as phase 3E's run 11. The rounded percentages equal the four thresholds.
