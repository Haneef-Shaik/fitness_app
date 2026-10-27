# QA-9 · Independent review of phase 2 (verbatim)

| Field | Value |
|---|---|
| What this is | The independent review of QA-9 phase 2 (the coverage ratchet), copied verbatim below the line. Nothing in it is edited, reordered or summarised |
| Review session | `e007aa24-8efa-49bd-b29e-1f3750fa0f1c` |
| Source file | `/tmp/fitlog-qa9-review-final.md`, read on 26 October 2026 |
| Reviewed state | Branch `codex/qa9-quality-ratchets`, uncommitted working tree on top of `main` at `2a95726` |
| Persisted by | The phase-2B remediation session, working for Codex under AUTH-01. How each finding was handled is in [ratchet-enforcement.md §4](ratchet-enforcement.md#4-phase-2b-review-remediation) and the [checkpoint](../../plan/runs/QA-9/checkpoint.md) |

---

The guard catches every case it tests, but it still misses one-line ways to narrow mobile coverage scope and to point CI at an untrusted baseline. One evidence claim about the commit timeline is also wrong. Initial floors and the exact domain reporter hold up; the main gaps are below.

## Findings (most severe first)

**1. High: a one-line Jest option narrows mobile coverage scope and the guard accepts it**
- **Location:** `scripts/quality/coverage-ratchet.mjs:36` (`JEST_FORBIDDEN`) and `:243-247`.
- **Defect:** the guard blocks only `collectCoverage`, `coveragePathIgnorePatterns`, `coverageProvider` and `projects`. It misses `modulePathIgnorePatterns` and `roots`, which also shrink the set of files coverage counts.
- **Why it works:** Jest adds files no test loads from its module map (`@jest/reporters/build/CoverageReporter.js:202-215`). That map honours `roots` and `modulePathIgnorePatterns` (`jest-runtime/build/index.js:376-409`).
- **Failure scenario:** add `modulePathIgnorePatterns: ['<rootDir>/src/features/gym/']` to `jest.config.cjs`.
  - No test imports gym, so 573 statements leave the count.
  - Coverage becomes statements 254/1503 = 16.9%, branches 14.9%, functions 13.9%, lines 22.6%.
  - Every threshold still passes, the guard passes, and `pnpm check` is green.
  - The same works with `roots`, or with a key a different preset supplies, since only the raw config object is checked.
- **Fix:** switch to an allowlist. Allow only `preset` (pinned to `'jest-expo'`), `testMatch` (pinned), `clearMocks`, `collectCoverageFrom`, `coverageThreshold` and `coverageReporters`. For extra safety, add a step after Jest that compares the files in `coverage-summary.json` with the files on disk matching `collectCoverageFrom`. Add mutation tests for `roots` and `modulePathIgnorePatterns`.

**2. Medium: "the first commit closes R1" is false**
- **Location:**
  - `docs/evidence/QA-9/ratchet-enforcement.md:144-146`
  - `docs/plan/runs/QA-9/checkpoint.md:15` and `:118`
  - `scripts/quality/coverage-ratchet.mjs:99`
  - `scripts/quality/coverage-ratchet.test.mjs:40-45`
- **Defect:** the open window lasts until the ratchet is on `main`, not until it is first committed.
  - Locally the baselines are `HEAD` and its fork point from `main`. In CI the baseline is the PR base, which is `main`.
  - Until merge, `main` holds no floor or thresholds.
  - Tests 10–12 use `ratchetRepo`, where `main` already holds the ratchet, so the real state after the first commit is never tested.
- **Failure scenario:** after the first commit, a second commit (or an amend) lowers both the floor and a threshold.
  - `HEAD` now holds the lowered values, and `main` holds nothing.
  - It passes locally, and passes in CI against the PR base.
- **Fix:** correct the R1 text to say it closes at merge into `main`. Tell the verifier to compare `coverage-floor.json` with `coverage-baseline.md` §5 at the exact commit that is merged. Add a test for "committed on the branch, `main` without the ratchet" that documents the state.

**3. Medium: the change under review can redirect the trusted baseline or switch off CI mode**
- **Location:** `coverage-ratchet.mjs:66`, `:71-80`, `:258-265`.
- **Defect, root scripts:** each `&&` part is filtered only for characters like `|;&$()<>`.
  - A part such as `unset FITLOG_CONTRACT_BASELINE CI` passes the filter.
  - The guard then runs in local mode. A PR checkout has no local `main`, so only `HEAD` is used, which is the PR's own values.
- **Defect, workflow:** the workflow check is just a regex for `- run: pnpm check`.
  - An `if: false` on that step passes the regex.
  - So does `FITLOG_CONTRACT_BASELINE: ${{ github.sha }}`. Its fork point with `HEAD` is `HEAD` itself, so the PR's own values become the baseline.
- **Failure scenario:** a PR lowers the floor and thresholds and makes either edit above. Hosted CI goes green.
- **Fix:**
  - Pin the root `test` and `check` scripts exactly, as `MOBILE_TEST_CI` already is.
  - Pin the workflow's `FITLOG_CONTRACT_BASELINE` line, and refuse `if:` on the check job or step.
  - Treat `GITHUB_ACTIONS=true` as CI.
  - In CI, refuse a baseline whose fork point equals `HEAD`.
  - This is the same trust issue the contract guard has (AR-1 L1/L4, owned by PL-1), so coordinate the fix there.

**4. Medium: lint and type gates are not protected, and this gap isn't listed as remaining work**
- **Location:** `coverage-ratchet.mjs:34`.
- **Defect:** `ROOT_STEPS.check` requires only `pnpm test`. Nothing requires `pnpm lint`, `pnpm typecheck`, mobile `--max-warnings=0`, or `strict` in the tsconfigs. The "never add an unexplained `eslint-disable`" rule in docs/23 has no enforcing lint rule.
- **Failure scenario:** `"check": "pnpm test && pnpm plan:build --check"` passes the guard. Lint and types stop running both locally and in CI, and box 3 regresses silently.
- **Fix:** add `pnpm typecheck` and `pnpm lint` to `ROOT_STEPS.check`, and pin the mobile `lint` and domain `typecheck` scripts. Otherwise, record this as an accepted residual next to Prettier and the hosted CI run.

**5. Low: the domain line threshold sits at an observed minimum the noise analysis can't bound**
- **Location:** `scripts/quality/coverage-floor.json:7`; `docs/evidence/QA-9/coverage-baseline.md:176-196`.
- **Defect:**
  - Phase 1 found 3 lines that flip between runs (at most 536 covered) and 4 lines it called "always uncovered".
  - Phase 2 saw 537 and 538, and my run gave 537, so more lines flip and that classification is wrong.
  - There has been no Linux run.
- **Failure scenario:** one more line flips off in a run, giving 532/583 = 91.25% < 91.42. `pnpm check` then fails at random.
- **Fix:** take lcov from a 537 or 538 run, list every line that flips, and set the threshold from that list or record the margin.

**6. Low: the exact reporter's arithmetic and one of its tests are fragile**
- **Location:** `exact-coverage-reporter.mjs:27-28`; `exact-coverage-reporter.test.mjs:61-62`.
- **Floating point:** `(covered/total)*100` gives 28.999999999999996 for 29/100, so a threshold set at exactly the measured value fails. The test builds `actual` with the same formula, so it can't catch this. No current domain total hits it today.
- **Node-version coupling:** the test asserts that Node does not print its own threshold message. If Node ever enforces the decimal flags exactly, Node fails the run too, this test fails and `pnpm check` breaks. The local Node version was never captured, so the truncation finding isn't tied to the pinned 22.23.1.
- **Fix:** compare with integers, e.g. `covered*10000 >= Math.round(threshold*100)*total`, and limit thresholds to 2 decimals. Make the "Node didn't fail it" assertion depend on the Node version. Record `node --version` in the evidence.

**7. Low: new domain files no test loads are not counted**
- **Location:** domain `test` template (`coverage-ratchet.mjs:32`).
- **Defect:** Node counts only files a test loads, unlike mobile, and this isn't listed as a residual risk. A new module reachable only from the CLI, or not exported, adds no uncovered lines.
- **Fix:** have the reporter check that `summary.files` includes every `src/**/*.ts` file that isn't a test.

## What I checked and found sound
- **Initial floors** match the measured counts:
  - mobile 254/2076, 164/1551, 84/821, 191/1023 give 12.23, 10.57, 10.23, 18.67;
  - domain 533/583 gives 91.42, 272/313 gives 86.90, 106/117 gives 90.59.
- **Baselines:** read only through `ls-tree` and `cat-file`, with `--no-replace-objects` and `GIT_*` location variables stripped. A Git failure throws rather than reading as a missing file. In CI the baseline must be a full SHA; unset, blank or all-zero values fail.
- **Ratchet logic:** lowering, removing a metric, invalid values, per-path thresholds, added `!` exclusions (including negated extglobs) and dropped include patterns all fail. A `jest.config.js` added beside the `.cjs` makes Jest stop with "Multiple configurations found" (`resolveConfigPath.js:149`).
- **Exact reporter:** in principle it is correct. It reads `process.execArgv`, fails when no coverage report arrives or counts are missing, and Node never resets a failing exit code to 0.
- **RPC inventory:** the 9 public functions match every `create function public.*` in the migrations, and no function is created without a schema. The `verify.mjs` lines I sampled match. The stated gaps are confirmed: no backend test mentions those RPCs, kinds or the `manager` role.

## Commands and results
- `rtk proxy node --test scripts/quality/coverage-ratchet.test.mjs scripts/quality/exact-coverage-reporter.test.mjs`: 21 of 21 pass, about 4.5 s.
- `rtk proxy pnpm check` (run twice, the second filtered): passes through `plan:build --check`.
  - Guard verified against 1 baseline (`HEAD` and `main` are both `2a95726`).
  - Domain 37 pass. Exact lines 537/583 (92.11%), branches 272/313, functions 106/117.
  - Quality tests 21 pass. Mobile 126 tests pass at 12.23 / 10.57 / 10.23 / 18.67. Plan 22 pass.
- Denied in dontAsk mode and not retried: a Jest run with `--modulePathIgnorePatterns` to prove finding 1 directly. That finding rests on the Jest source lines cited above.

## Expected incompleteness (not defects)
Prettier is not started, the hosted CI lint-failure run (box 3) and the first Linux run of the ratchet are unproven, R2 (both guard copies removed in one change) is documented, and nothing is committed. Findings 2 and 3 make the commit and merge timing matter for verification.

I did not run the Python launcher at the end of your prompt. It starts background `claude` sessions, which conflicts with "No additional workers".
