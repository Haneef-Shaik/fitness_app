# QA-9 · Phase 3E outputs: the R19 regression test, two domain runs and one `pnpm check`

| Field | Value |
|---|---|
| What | The verbatim outputs, cut where marked, of the three gate runs in phase 3E: two `pnpm --filter @fitlog/domain test` runs and one `pnpm check`. All three ran on the uncommitted working tree on top of commit `4a7ee2100bffbfa77671017b83b1300b341a1dec`, with `HEAD` one commit ahead of `main@2a95726`. That is the state in which phase 3D's run 18 failed |
| Who | The phase-3E implementer, a local Claude session under Codex's phase-3E brief (AUTH-01). Its tool-results folder names session `240bec18-9fd3-4f9b-b90a-c12c35a3123e`. **These are implementer runs, not independent evidence.** No reviewer has re-run them yet |
| Node | `v22.23.1` (`rtk proxy node --version`, run 3), the `.node-version` pin |
| Cuts | Each `…` line marks lines left out. The guard's long summary line, the 97 quality tests' TAP output, and the 22 plan tests' TAP output are cut. Everything about the domain package is kept whole. The full `pnpm check` output, 44.1 KB, was saved by the tool to the session's tool-results folder as `bclupbipn.txt` and read back with Read and Grep. It held no secret, so nothing was redacted |
| Run numbers | The checkpoint's, under "Commands run in phase 3E" |
| Normalization | *(Phase 3G, 27 October 2026, Codex's decision under AUTH-01.)* **This is the captured output with trailing spaces removed.** Node printed one space after the last `\|` on each domain coverage-table row whose "uncovered lines" column is empty. That one space was removed from those **19 rows**: 5 in run 7's table, 7 in run 10's and 7 in run 11's. This was done so that `git diff --check` passes. **No output content or figure changed:** no character other than those 19 trailing spaces was added, removed or moved, and no line was added, removed or reordered inside the output blocks. The cuts marked `…` are as before. Against the staged copy, `git diff --numstat` showed 19 lines changed and `git diff --ignore-space-at-eol` showed no difference. Phase 3F's run 14 ([phase-3f-check-outputs.md](phase-3f-check-outputs.md)) lists the 19 rows by line number, as numbered before this row was added |

## Run 7: the first version of the test (two new tests), `rtk proxy pnpm --filter @fitlog/domain test`, exit 1

The 39 tests pass, but the branch gate fails at **271/312**: the denominator fell by one. ratchet-enforcement.md §14 explains why: the loop body's block range in `gitBaselines` merged into the function's range.

```
✔ committed snapshot history is unchanged against each available Git baseline (76.635042ms)
ℹ HEAD@4a7ee2100bff: checked
ℹ main@2a95726912c6: checked
…
✔ a configured baseline fails closed when Git cannot answer, and never reads a failure as an absent file (80.218125ms)
✔ HEAD and main at one fork point are one baseline, listed once, in any host checkout (0.63375ms)
✔ a branch ahead of main checks both fork points, each once, and each protects the history it records (0.25975ms)
✔ rules JSON Schema cannot express hold at their accept and reject boundaries (9.323041ms)
…
ℹ tests 39
ℹ suites 0
ℹ pass 39
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 813.915792
ℹ start of coverage report
ℹ ---------------------------------------------------------------------------------------------
ℹ file                   | line % | branch % | funcs % | uncovered lines
ℹ ---------------------------------------------------------------------------------------------
ℹ src                    |        |          |         |
ℹ  calculations.ts       |  75.20 |    82.02 |   85.29 | 1 3 12-13 44-51 70-77 79-85 87-89 118
ℹ  cli                   |        |          |         |
ℹ   snapshot-contract.ts |  93.27 |    87.97 |   88.37 | 205-218 223
ℹ  contract.ts           | 100.00 |    88.89 |   92.86 |
ℹ  dates.ts              |  95.24 |    80.00 |  100.00 | 19
ℹ  encoding.ts           |  92.86 |   100.00 |  100.00 | 1
ℹ  finance.ts            |  97.14 |    87.10 |  100.00 | 14
ℹ  index.ts              | 100.00 |   100.00 |  100.00 |
ℹ  models.ts             |  99.11 |   100.00 |  100.00 | 112
ℹ ---------------------------------------------------------------------------------------------
ℹ all files              |  91.42 |    86.86 |   90.60 |
ℹ ---------------------------------------------------------------------------------------------
ℹ end of coverage report
Exact lines coverage 533/583 (91.4237%) meets the threshold of 91.42%
Error: exact branches coverage 271/312 (86.8590%) does not meet the threshold of 86.9%
Exact functions coverage 106/117 (90.5983%) meets the threshold of 90.59%
Coverage counts all 8 files that --test-coverage-include matches
/Users/Adya/.codex/worktrees/fitlog-qa9/fitness_app/packages/domain:
 ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL  @fitlog/domain@0.1.0 test: `node ../../scripts/quality/coverage-ratchet.mjs && node --import tsx --enable-source-maps --test --experimental-test-coverage --test-coverage-include='src/**/*.ts' --test-coverage-exclude='src/**/*.test.ts' --test-coverage-lines=91.42 --test-coverage-branches=86.90 --test-coverage-functions=90.59 --test-reporter=spec --test-reporter-destination=stdout --test-reporter=../../scripts/quality/exact-coverage-reporter.mjs --test-reporter-destination=stdout src/*.test.ts`
Exit status 1
 WARN   Local package.json exists, but node_modules missing, did you mean to install?
```

## Run 10: the final test (three new tests), `rtk proxy pnpm --filter @fitlog/domain test`, exit 0

```
> @fitlog/domain@0.1.0 test /Users/Adya/.codex/worktrees/fitlog-qa9/fitness_app/packages/domain
> node ../../scripts/quality/coverage-ratchet.mjs && node --import tsx --enable-source-maps --test --experimental-test-coverage --test-coverage-include='src/**/*.ts' --test-coverage-exclude='src/**/*.test.ts' --test-coverage-lines=91.42 --test-coverage-branches=86.90 --test-coverage-functions=90.59 --test-reporter=spec --test-reporter-destination=stdout --test-reporter=../../scripts/quality/exact-coverage-reporter.mjs --test-reporter-destination=stdout src/*.test.ts

…
  HEAD@4a7ee2100bff: checked; records the floor, mobile thresholds, domain thresholds
  main@2a95726912c6: checked; records no coverage minimums yet, so the floor applies
…
✔ committed snapshot history is unchanged against each available Git baseline (81.647791ms)
ℹ HEAD@4a7ee2100bff: checked
ℹ main@2a95726912c6: checked
…
✔ a configured baseline fails closed when Git cannot answer, and never reads a failure as an absent file (80.470333ms)
✔ HEAD and main at one fork point are one baseline, listed once, in any host checkout (0.640459ms)
✔ a branch ahead of or diverged from main checks both fork points, each once, and each protects the history it records (0.372333ms)
✔ a clone without a local main checks HEAD alone and notes main as not found (0.123208ms)
✔ rules JSON Schema cannot express hold at their accept and reject boundaries (9.227625ms)
…
ℹ tests 40
ℹ suites 0
ℹ pass 40
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 772.662917
ℹ start of coverage report
ℹ ---------------------------------------------------------------------------------------
ℹ file                   | line % | branch % | funcs % | uncovered lines
ℹ ---------------------------------------------------------------------------------------
ℹ src                    |        |          |         |
ℹ  calculations.ts       |  76.80 |    82.02 |   85.29 | 1 12-13 44-51 70-77 79-85 87-89
ℹ  cli                   |        |          |         |
ℹ   snapshot-contract.ts |  93.27 |    88.81 |   88.37 | 205-218 223
ℹ  contract.ts           | 100.00 |    88.89 |   92.86 |
ℹ  dates.ts              | 100.00 |    80.00 |  100.00 |
ℹ  encoding.ts           |  92.86 |   100.00 |  100.00 | 1
ℹ  finance.ts            | 100.00 |    87.10 |  100.00 |
ℹ  index.ts              | 100.00 |   100.00 |  100.00 |
ℹ  models.ts             |  99.11 |   100.00 |  100.00 | 112
ℹ ---------------------------------------------------------------------------------------
ℹ all files              |  92.11 |    87.22 |   90.60 |
ℹ ---------------------------------------------------------------------------------------
ℹ end of coverage report
Exact lines coverage 537/583 (92.1098%) meets the threshold of 91.42%
Exact branches coverage 273/313 (87.2204%) meets the threshold of 86.9%
Exact functions coverage 106/117 (90.5983%) meets the threshold of 90.59%
Coverage counts all 8 files that --test-coverage-include matches
```

## Run 11: `rtk proxy pnpm check`, exit 0

The guard, the format step, typecheck and lint:

```
> fitlog@ check /Users/Adya/.codex/worktrees/fitlog-qa9/fitness_app
> node scripts/quality/coverage-ratchet.mjs && node scripts/quality/touched-format.mjs && pnpm typecheck && pnpm lint && pnpm test && pnpm plan:build --check

…
  HEAD@4a7ee2100bff: checked; records the floor, mobile thresholds, domain thresholds
  main@2a95726912c6: checked; records no coverage minimums yet, so the floor applies
…
Formatting verified: the 19 touched JavaScript and TypeScript files match Prettier 3.6.2 with .prettierrc.json. Base: main@2a95726912c6, from 4a7ee2100bff, which adds scripts/quality/touched-format.mjs. Not checked: 26 not JavaScript or TypeScript. Untouched and untracked files are never checked.

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
```

The domain test, from the three new tests on:

```
✔ HEAD and main at one fork point are one baseline, listed once, in any host checkout (0.637791ms)
✔ a branch ahead of or diverged from main checks both fork points, each once, and each protects the history it records (0.370667ms)
✔ a clone without a local main checks HEAD alone and notes main as not found (0.12275ms)
…
ℹ tests 40
ℹ suites 0
ℹ pass 40
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 738.640958
ℹ start of coverage report
ℹ -------------------------------------------------------------------------------------------
ℹ file                   | line % | branch % | funcs % | uncovered lines
ℹ -------------------------------------------------------------------------------------------
ℹ src                    |        |          |         |
ℹ  calculations.ts       |  76.00 |    82.02 |   85.29 | 1 12-13 44-51 70-77 79-85 87-89 118
ℹ  cli                   |        |          |         |
ℹ   snapshot-contract.ts |  93.27 |    88.81 |   88.37 | 205-218 223
ℹ  contract.ts           | 100.00 |    88.89 |   92.86 |
ℹ  dates.ts              | 100.00 |    80.00 |  100.00 |
ℹ  encoding.ts           |  92.86 |   100.00 |  100.00 | 1
ℹ  finance.ts            | 100.00 |    87.10 |  100.00 |
ℹ  index.ts              | 100.00 |   100.00 |  100.00 |
ℹ  models.ts             |  99.11 |   100.00 |  100.00 | 112
ℹ -------------------------------------------------------------------------------------------
ℹ all files              |  91.94 |    87.22 |   90.60 |
ℹ -------------------------------------------------------------------------------------------
ℹ end of coverage report
Exact lines coverage 536/583 (91.9383%) meets the threshold of 91.42%
Exact branches coverage 273/313 (87.2204%) meets the threshold of 86.9%
Exact functions coverage 106/117 (90.5983%) meets the threshold of 90.59%
Coverage counts all 8 files that --test-coverage-include matches
```

The quality tests, the mobile tests and the plan build:

```
1..97
# tests 97
# suites 0
# pass 97
# fail 0
…
=============================== Coverage summary ===============================
Statements   : 12.23% ( 254/2076 )
Branches     : 10.57% ( 164/1551 )
Functions    : 10.23% ( 84/821 )
Lines        : 18.67% ( 191/1023 )
================================================================================

Test Suites: 7 passed, 7 total
Tests:       126 passed, 126 total
…
1..22
# tests 22
# suites 0
# pass 22
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 595.101833

> fitlog@ plan:build /Users/Adya/.codex/worktrees/fitlog-qa9/fitness_app
> node scripts/plan/build.mjs --check

GOALS.md: 114 goals, 230 needs, 10 lanes; ACCEPTANCE.md: 94 ledger rows, every PRD scenario and decision covered
plan.json and board.html match GOALS.md
```

So `pnpm check` ran every step through the plan build, with **285 tests**: 40 domain, 97 quality, 126 mobile and 22 plan.
