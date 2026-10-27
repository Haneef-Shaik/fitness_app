# QA-9 · Phase 3H outputs: the records commit, the rebase onto local `main`, the offline install, one `pnpm check` and both JS exports

| Field | Value |
|---|---|
| What | The outputs of phase 3H: the five-path records commit `cf99bc54febe6d2efdb88bd9cb5e0eeb5898a49b`, the recheck of local `main`, `git rebase main`, the range-diff proof, `pnpm install --frozen-lockfile --offline`, one `pnpm check` on the rebased tip `c84bb4cd1639d528779c9cc52e8a1540d0ae1ebc` with a clean tree, and the iOS and Android JS export |
| Who | The phase-3H implementer, a local Claude session (`6a4c540a-d21a-487c-98fa-9a8b47212007`, from its task folder) under Codex's phase-3H brief (AUTH-01). **These are implementer runs, not independent evidence.** No reviewer has re-run them |
| Node | `v22.23.1` (`rtk proxy node --version`, run 1), the `.node-version` pin. pnpm `v10.27.0`, from the install's own output |
| Old and new IDs | `4a7ee2100bffbfa77671017b83b1300b341a1dec` → **`06c822050d7610223bf7b76fd76842a90368fcde`**; `300709473f12cdae800cd7b3fc25f295887e58ce` → **`557b779f9428b91158335b4370c071d2580d6994`**; `cf99bc54febe6d2efdb88bd9cb5e0eeb5898a49b` → **`c84bb4cd1639d528779c9cc52e8a1540d0ae1ebc`**. Old base `2a95726912c6ce3597187fa34443bf8c7e7dbcb8`, new base `main` = `c8a5d57c3a0999760ad21fd1aca4899ca76b5adf`, which did not move |
| Result | Records commit as expected, with `--check` clean. `main` docs only. Rebase clean, with no conflict. Range-diff `=` for all three commits. Install offline, with no download. **`pnpm check` exit 0, 285 tests** (40 + 97 + 126 + 22). Format step: **19 files**, `Base: main@c8a5d57c3a09, from 06c822050d76`, **36** not JavaScript or TypeScript. Domain **535/583**, **273/313**, **106/117**. **Export exit 0**: two Hermes bundles |
| What the export proves | That Metro bundles the app for iOS and Android and Hermes compiles each bundle, offline (`EXPO_OFFLINE=1`). **No device, simulator or native build ran.** It isn't device proof |
| Cuts | Each `…` line marks lines left out of `pnpm check`'s output: the domain spec reporter's 40 test lines, the 97 quality tests' and 22 plan tests' TAP output, and the typecheck and lint command echoes. The guard and format lines, the domain totals and coverage table, the mobile summary and the plan build are kept whole. The full output, 892 lines, was written by the tool to the session's background-task file `bh5hmn7aq.output` and read back with Read and Grep. The export output is copied whole |
| Normalization | Node prints one space after the last `\|` on each domain coverage-table row whose "uncovered lines" column is empty. That space is left out of the 5 such rows below, as in phase 3G's outputs. No other character differs from the captured output |
| Redaction | Both full outputs were searched with Grep for `eyJ…`, `sk_live_`/`sk_test_`, `service_role`, `SUPABASE_…KEY`, `password` or `secret` followed by `=` or `:`, and private-key headers. **No match, and nothing was removed.** Absolute paths under `/Users/Adya/.codex/worktrees/fitlog-qa9/` are kept, as in every QA-9 record |
| Run numbers | The checkpoint's, under "Commands run in phase 3H" |
| Written | After the rebase and the gates, uncommitted. This file is untracked. *(3I: committed in phase 3I's records commit, with two annotations added outside the verbatim blocks: this tag, and the module-count note after the export output. No captured output changed)* |

## Runs 7–13: the five-path records commit

Run 7, `rtk proxy git diff --cached --name-only`, listed exactly the five paths:

```text
docs/evidence/QA-9/implementer-final-2026-10-27T0235Z.md
docs/evidence/QA-9/phase-3g-check-outputs.md
docs/evidence/QA-9/reviewer-final-2026-10-27T0305Z.md
docs/plan/runs/QA-9/checkpoint.md
docs/plan/runs/QA-9/handoff.md
```

Run 9, `rtk proxy git diff --cached --numstat`:

```text
29	0	docs/evidence/QA-9/implementer-final-2026-10-27T0235Z.md
269	0	docs/evidence/QA-9/phase-3g-check-outputs.md
87	0	docs/evidence/QA-9/reviewer-final-2026-10-27T0305Z.md
79	7	docs/plan/runs/QA-9/checkpoint.md
26	5	docs/plan/runs/QA-9/handoff.md
```

Run 10, `rtk proxy git diff --cached --check`: no output, exit 0. Run 11, `git status --porcelain=v1 -uall`: three `A` and two `M`, all staged, nothing unstaged or untracked.

Run 12, `rtk proxy git commit -m "docs(QA-9): record phase 3G results and the 0305 review"`:

```text
[codex/qa9-quality-ratchets cf99bc5] docs(QA-9): record phase 3G results and the 0305 review
 5 files changed, 490 insertions(+), 12 deletions(-)
 create mode 100644 docs/evidence/QA-9/implementer-final-2026-10-27T0235Z.md
 create mode 100644 docs/evidence/QA-9/phase-3g-check-outputs.md
 create mode 100644 docs/evidence/QA-9/reviewer-final-2026-10-27T0305Z.md
```

Run 13, `git status --porcelain=v1 -uall`: no output, a clean tree. Run 14, `rtk proxy git log --format=%H%x20%s -4`, the old IDs:

```text
cf99bc54febe6d2efdb88bd9cb5e0eeb5898a49b docs(QA-9): record phase 3G results and the 0305 review
300709473f12cdae800cd7b3fc25f295887e58ce test(QA-9): cover deterministic Git baseline histories
4a7ee2100bffbfa77671017b83b1300b341a1dec test(QA-9): coverage ratchet, gate wiring, exact domain thresholds and Prettier on touched files
2a95726912c6ce3597187fa34443bf8c7e7dbcb8 docs(AR-1): record completed integration and delegated sign-off
```

## Runs 15–20: `main` rechecked before the rebase, as expected

Run 15, `rtk proxy git rev-parse main`: `c8a5d57c3a0999760ad21fd1aca4899ca76b5adf`. Run 16, `rtk proxy git merge-base HEAD main`: `2a95726912c6ce3597187fa34443bf8c7e7dbcb8`.

Run 17, `rtk proxy git log --format=%h%x20%s 2a95726..main`, 20 commits:

```text
c8a5d57 docs(plan): reconcile three active local Claude lanes
5fefc31 docs(plan): checkpoint accepted RED and QA9 formatting phase
06e3195 docs(plan): checkpoint QA9 independent gates and isolated RED
4670390 docs(plan): checkpoint MB1 safety review and QA9 corrections
80574d4 docs(plan): checkpoint ban-response stop and fresh QA9 review
e5f5ab2 docs(plan): accept disposable RED review and checkpoint active workers
56765fd docs(plan): recover interrupted safety review and reconcile active workers
93afeb0 docs(plan): reconcile active workers after sleep and verify stable gates
dd76af6 docs(plan): checkpoint Unicode guard findings and MB1 safety review
a9a2bd0 docs(plan): checkpoint replay evidence gap and verified quality gates
12d0f40 docs(plan): restore local verification and checkpoint pinned quality gates
baf1b12 docs(plan): authorize disposable RED checkpoint and verify QA9 scope gates
94ef3dd docs(plan): checkpoint independent tests and lint scope phase
9e3c0b4 docs(plan): checkpoint QA9 validation and MB1 safety corrections
7644ec3 docs(plan): record null coverage bypass and replay safety review
26d3a04 docs(plan): checkpoint guarded replay remediation and QA9 review
e33b4a5 docs: record quality guard findings and independent identity checks
dd0cef1 docs: advance identity remediation and independent quality review
38195e7 docs: reconcile local supervision and advance bounded checkpoints
3e05c31 docs: dispatch identity and quality phases under delegated supervision
```

Run 18, `rtk proxy git diff --name-status 2a95726 main`, 25 paths, all Markdown or JSON under `docs/plan/` or `docs/evidence/AR-1/`:

```text
A	docs/evidence/AR-1/cleanup.md
M	docs/plan/EXECUTION.md
M	docs/plan/activity.json
M	docs/plan/runs/AR-1/supervisor.json
A	docs/plan/runs/local-supervision.json
A	docs/plan/runs/supervision-2026-10-26T0440Z.md
A	docs/plan/runs/supervision-2026-10-26T0540Z.md
A	docs/plan/runs/supervision-2026-10-26T0648Z.md
A	docs/plan/runs/supervision-2026-10-26T0744Z.md
A	docs/plan/runs/supervision-2026-10-26T0848Z.md
A	docs/plan/runs/supervision-2026-10-26T0947Z.md
A	docs/plan/runs/supervision-2026-10-26T1047Z.md
A	docs/plan/runs/supervision-2026-10-26T1152Z.md
A	docs/plan/runs/supervision-2026-10-26T1254Z.md
A	docs/plan/runs/supervision-2026-10-26T1349Z.md
A	docs/plan/runs/supervision-2026-10-26T1419Z.md
A	docs/plan/runs/supervision-2026-10-26T1633Z.md
A	docs/plan/runs/supervision-2026-10-26T1635Z.md
A	docs/plan/runs/supervision-2026-10-26T1639Z.md
A	docs/plan/runs/supervision-2026-10-26T1705Z.md
A	docs/plan/runs/supervision-2026-10-26T1733Z.md
A	docs/plan/runs/supervision-2026-10-26T1805Z.md
A	docs/plan/runs/supervision-2026-10-26T1835Z.md
A	docs/plan/runs/supervision-2026-10-26T1903Z.md
M	docs/plan/status.json
```

Run 19, `rtk proxy git log --merges --format=%h 2a95726..main`: no output, so there are no merge commits. Run 20, `rtk proxy git diff --name-only 2a95726 HEAD`: QA-9's 55 paths, the same names run 27 lists. None of them is among run 18's 25. QA-9's only `docs/plan/` paths are the two in `docs/plan/runs/QA-9/`.

## Runs 21–27: the rebase, and the proof that only the base moved

Run 21, `rtk proxy git rebase main`:

```text
Rebasing (1/3)Rebasing (2/3)Rebasing (3/3)Successfully rebased and updated refs/heads/codex/qa9-quality-ratchets.
```

Run 22, `rtk proxy git log --format=%H%x20%s -5`, the new IDs:

```text
c84bb4cd1639d528779c9cc52e8a1540d0ae1ebc docs(QA-9): record phase 3G results and the 0305 review
557b779f9428b91158335b4370c071d2580d6994 test(QA-9): cover deterministic Git baseline histories
06c822050d7610223bf7b76fd76842a90368fcde test(QA-9): coverage ratchet, gate wiring, exact domain thresholds and Prettier on touched files
c8a5d57c3a0999760ad21fd1aca4899ca76b5adf docs(plan): reconcile three active local Claude lanes
5fefc31d6d87fab87289c3732888302171f595d4 docs(plan): checkpoint accepted RED and QA9 formatting phase
```

Run 23, `rtk proxy git rev-parse main`: `c8a5d57c3a0999760ad21fd1aca4899ca76b5adf`, unchanged. Run 24, `git status --porcelain=v1 -b -uall`: `## codex/qa9-quality-ratchets` and nothing else.

Run 25, `rtk proxy git range-diff 2a95726..cf99bc54febe6d2efdb88bd9cb5e0eeb5898a49b main..HEAD`. Each `=` means the patch is identical:

```text
1:  4a7ee21 = 1:  06c8220 test(QA-9): coverage ratchet, gate wiring, exact domain thresholds and Prettier on touched files
2:  3007094 = 2:  557b779 test(QA-9): cover deterministic Git baseline histories
3:  cf99bc5 = 3:  c84bb4c docs(QA-9): record phase 3G results and the 0305 review
```

Run 26, `rtk proxy git diff --name-status cf99bc54febe6d2efdb88bd9cb5e0eeb5898a49b HEAD`: exactly run 18's 25 lines, in the same order and with the same status letters. So the old tip and the new tip differ only by what `main` added.

Run 27, `rtk proxy git diff --stat main HEAD`, what the rebased branch adds over `main`:

```text
 .prettierrc.json                                   |    4 +
 apps/mobile/coverage-thresholds.json               |    4 +
 apps/mobile/jest.config.cjs                        |   10 +-
 apps/mobile/package.json                           |    3 +-
 docs/23-MASTER-PLAN.md                             |  106 +-
 docs/evidence/QA-9/coverage-baseline.md            |  245 +++
 .../QA-9/implementer-final-2026-10-26T2235Z.md     |   41 +
 .../QA-9/implementer-final-2026-10-26T2335Z.md     |   31 +
 .../QA-9/implementer-final-2026-10-27T0035Z.md     |   33 +
 .../QA-9/implementer-final-2026-10-27T0105Z.md     |   38 +
 .../QA-9/implementer-final-2026-10-27T0205Z.md     |   40 +
 .../QA-9/implementer-final-2026-10-27T0235Z.md     |   29 +
 .../QA-9/independent-review-2026-10-26T2000Z.md    |   79 +
 .../QA-9/phase-3c-mutation-first-parent.patch      |   10 +
 docs/evidence/QA-9/phase-3d-check-outputs.md       | 1032 +++++++++++++
 docs/evidence/QA-9/phase-3e-check-outputs.md       |  225 +++
 docs/evidence/QA-9/phase-3f-check-outputs.md       |  102 ++
 docs/evidence/QA-9/phase-3g-check-outputs.md       |  269 ++++
 docs/evidence/QA-9/ratchet-enforcement.md          | 1595 ++++++++++++++++++++
 docs/evidence/QA-9/review-phase2.md                |  105 ++
 docs/evidence/QA-9/review-phase2b.md               |   91 ++
 docs/evidence/QA-9/review-phase2c.md               |   92 ++
 docs/evidence/QA-9/review-phase2d.md               |  108 ++
 docs/evidence/QA-9/review-phase2e.md               |   74 +
 docs/evidence/QA-9/review-phase2f.md               |  100 ++
 docs/evidence/QA-9/review-phase2g.md               |   76 +
 .../QA-9/reviewer-final-2026-10-26T2305Z.md        |  115 ++
 .../QA-9/reviewer-final-2026-10-27T0005Z.md        |   88 ++
 .../QA-9/reviewer-final-2026-10-27T0135Z.md        |   88 ++
 .../QA-9/reviewer-final-2026-10-27T0305Z.md        |   87 ++
 docs/evidence/QA-9/rpc-test-inventory.md           |  253 ++++
 docs/plan/runs/QA-9/checkpoint.md                  | 1388 +++++++++++++++++
 docs/plan/runs/QA-9/handoff.md                     |  255 ++++
 package.json                                       |    3 +-
 packages/domain/package.json                       |    2 +-
 packages/domain/src/contract.test.ts               |  802 ++++++++--
 pnpm-lock.yaml                                     |   10 +
 scripts/quality/config-inventory.mjs               |   73 +
 scripts/quality/coverage-floor.json                |    8 +
 scripts/quality/coverage-ratchet.mjs               |  677 +++++++++
 scripts/quality/coverage-ratchet.test.mjs          | 1468 ++++++++++++++++++
 scripts/quality/coverage-suppression.mjs           |   84 ++
 scripts/quality/coverage-suppression.test.mjs      |  139 ++
 scripts/quality/exact-coverage-reporter.mjs        |  206 +++
 scripts/quality/exact-coverage-reporter.test.mjs   |  203 +++
 scripts/quality/gate-wiring.mjs                    |  283 ++++
 scripts/quality/gate-wiring.test.mjs               |  386 +++++
 scripts/quality/lint-scope.mjs                     |  210 +++
 scripts/quality/lint-scope.test.mjs                |  423 ++++++
 scripts/quality/touched-format.mjs                 |  391 +++++
 scripts/quality/touched-format.test.mjs            |  724 +++++++++
 scripts/quality/transform-config.mjs               |   71 +
 scripts/quality/transform-config.test.mjs          |  264 ++++
 scripts/quality/type-suppression.mjs               |  217 +++
 scripts/quality/type-suppression.test.mjs          |  570 +++++++
 55 files changed, 13936 insertions(+), 94 deletions(-)
```

## Run 28: the offline frozen install

`rtk proxy pnpm install --frozen-lockfile --offline`, exit 0:

```text
Scope: all 3 workspace projects
Lockfile is up to date, resolution step is skipped
Progress: resolved 0, reused 1, downloaded 0, added 0
Packages: +2 -68
++--------------------------------------------------------------------
Progress: resolved 0, reused 70, downloaded 0, added 2, done

Done in 679ms using pnpm v10.27.0
```

Nothing was downloaded, and the lockfile was not resolved again. `Packages: +2 -68` shows that the worktree's `node_modules` held 68 packages the frozen lockfile doesn't, and lacked 2 it does. The install made `node_modules` match the lockfile. Which packages they were isn't in the output, and this phase didn't investigate further. Run 29, `git status --porcelain=v1 -uall`: no output, so no tracked file changed.

## Run 30: `pnpm check`, once, on `c84bb4c`

Exit 0. Run in the background, with no file edited until it finished. The one command run meanwhile was run 31, a read-only `git rev-parse HEAD`.

```text

> fitlog@ check /Users/Adya/.codex/worktrees/fitlog-qa9/fitness_app
> node scripts/quality/coverage-ratchet.mjs && node scripts/quality/touched-format.mjs && pnpm typecheck && pnpm lint && pnpm test && pnpm plan:build --check

Coverage ratchet verified. Mobile (apps/mobile/coverage-thresholds.json): statements 12.23, branches 10.57, functions 10.23, lines 18.67. Domain (packages/domain/package.json test): lines 91.42, branches 86.9, functions 90.59. Nothing is below the floor or 2 Git baseline(s). No @ts-ignore, @ts-nocheck or @ts-expect-error without a reason is in the 142 TypeScript files under apps/mobile and packages/domain. No Babel configuration is among the 210 entries under apps/mobile, apps/mobile/eslint.config.js is as reviewed, and the 131 other files it lints hold no eslint-disable without rules and a reason, and no inline rule configuration. No coverage-suppression comment is in the 141 files under apps/mobile/src and packages/domain/src.
  HEAD@c84bb4cd1639: checked; records the floor, mobile thresholds, domain thresholds
  main@c8a5d57c3a09: checked; records no coverage minimums yet, so the floor applies
  the floor is not anchored yet: no trusted baseline (main locally, FITLOG_CONTRACT_BASELINE in CI) records scripts/quality/coverage-floor.json. Until the ratchet is on main, a change that lowers the floor and a threshold together passes this guard; until then the quality tests hold the floor to docs/evidence/QA-9/coverage-baseline.md §5, and a reviewer compares the two at the exact commit that is merged
Formatting verified: the 19 touched JavaScript and TypeScript files match Prettier 3.6.2 with .prettierrc.json. Base: main@c8a5d57c3a09, from 06c822050d76, which adds scripts/quality/touched-format.mjs. Not checked: 36 not JavaScript or TypeScript. Untouched and untracked files are never checked.
…
> @fitlog/domain@0.1.0 test /Users/Adya/.codex/worktrees/fitlog-qa9/fitness_app/packages/domain
> node ../../scripts/quality/coverage-ratchet.mjs && node --import tsx --enable-source-maps --test --experimental-test-coverage --test-coverage-include='src/**/*.ts' --test-coverage-exclude='src/**/*.test.ts' --test-coverage-lines=91.42 --test-coverage-branches=86.90 --test-coverage-functions=90.59 --test-reporter=spec --test-reporter-destination=stdout --test-reporter=../../scripts/quality/exact-coverage-reporter.mjs --test-reporter-destination=stdout src/*.test.ts
…
ℹ tests 40
ℹ suites 0
ℹ pass 40
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 742.612
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
…
> @fitlog/mobile@0.1.0 test:ci /Users/Adya/.codex/worktrees/fitlog-qa9/fitness_app/apps/mobile
> node --test ../../scripts/quality/*.test.mjs && node ../../scripts/quality/coverage-ratchet.mjs && jest --runInBand --ci --coverage --no-watchman
…
1..97
# tests 97
# suites 0
# pass 97
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 18080.316708
Coverage ratchet verified. Mobile (apps/mobile/coverage-thresholds.json): statements 12.23, branches 10.57, functions 10.23, lines 18.67. Domain (packages/domain/package.json test): lines 91.42, branches 86.9, functions 90.59. Nothing is below the floor or 2 Git baseline(s). No @ts-ignore, @ts-nocheck or @ts-expect-error without a reason is in the 142 TypeScript files under apps/mobile and packages/domain. No Babel configuration is among the 210 entries under apps/mobile, apps/mobile/eslint.config.js is as reviewed, and the 131 other files it lints hold no eslint-disable without rules and a reason, and no inline rule configuration. No coverage-suppression comment is in the 141 files under apps/mobile/src and packages/domain/src.
  HEAD@c84bb4cd1639: checked; records the floor, mobile thresholds, domain thresholds
  main@c8a5d57c3a09: checked; records no coverage minimums yet, so the floor applies
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
Time:        1.144 s
Ran all test suites.

> fitlog@ plan:test /Users/Adya/.codex/worktrees/fitlog-qa9/fitness_app
> node --test scripts/plan/lib.test.mjs
…
1..22
# tests 22
# suites 0
# pass 22
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 588.793709

> fitlog@ plan:build /Users/Adya/.codex/worktrees/fitlog-qa9/fitness_app
> node scripts/plan/build.mjs --check

GOALS.md: 114 goals, 230 needs, 10 lanes; ACCEPTANCE.md: 94 ledger rows, every PRD scenario and decision covered
plan.json and board.html match GOALS.md

[exited with code 0]
```

**Against the 0305 review's forecast (its step 5):**
- 285 tests, as forecast.
- The format step is at 19 files, labelled `Base: main@c8a5d57…, from <new rule commit>`, where the rule commit is `06c822050d76`.
- "About 35" files were forecast as not checked. The run reported **36**, which is the count made before the run: phase 3G's 33, plus the records commit's three new evidence files.
- The forecast was domain branches of at least 272/313, likely 273, and lines of at least 533. The run measured **273/313** and **535/583**.

**R3 sample:** the domain uncovered-lines column is identical to phase 3G's run 20. `dates.ts:19` and `finance.ts:14` are uncovered, and `calculations.ts:3` and `:118` covered. That makes 535 lines, two above the 533 the threshold needs.

**Still the branch-ahead state.** The guard read 2 baselines, `HEAD@c84bb4cd1639` and `main@c8a5d57c3a09`, so the floor is **not anchored**. The `HEAD` = `main` and CI-mode states remain unmeasured.

## Run 33: the iOS and Android JS export

`rtk proxy env EXPO_OFFLINE=1 pnpm --filter @fitlog/mobile exec expo export --platform ios --platform android --output-dir .expo/export-native`. It ran in the background after run 30 passed, and **exited 0**. Before it, Glob found no file under `apps/mobile/.expo/`. Output, whole:

```text
Using src/app as the root directory for Expo Router.
Expo Autolinking module resolution enabled
Starting Metro Bundler

| (node:81221) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
| (Use `node --trace-warnings ...` to show where the warning was created)
| (node:81221) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
| (Use `node --trace-warnings ...` to show where the warning was created)
iOS Bundled 3996ms node_modules/expo-router/entry.js (1228 modules)
Android Bundled 6908ms node_modules/expo-router/entry.js (1691 modules)

› Assets (40):
../../node_modules/@expo-google-fonts/google-sans-flex/400Regular/GoogleSansFlex_400Regular.ttf (132KB)
../../node_modules/@expo-google-fonts/google-sans-flex/600SemiBold/GoogleSansFlex_600SemiBold.ttf (133KB)
../../node_modules/@expo-google-fonts/google-sans-flex/700Bold/GoogleSansFlex_700Bold.ttf (133KB)
../../node_modules/@expo-google-fonts/material-symbols/400Regular/MaterialSymbols_400Regular.ttf (971KB)
../../node_modules/@expo-google-fonts/noto-sans-devanagari/400Regular/NotoSansDevanagari_400Regular.ttf (221KB)
../../node_modules/@expo-google-fonts/noto-sans-devanagari/700Bold/NotoSansDevanagari_700Bold.ttf (222KB)
../../node_modules/@expo-google-fonts/roboto-condensed/700Bold/RobotoCondensed_700Bold.ttf (146KB)
../../node_modules/expo-router/assets/arrow_down.png (9.5KB)
../../node_modules/expo-router/assets/arrow_right.xml (307B)
../../node_modules/expo-router/assets/checkmark.xml (312B)
../../node_modules/expo-router/assets/error.png (469B)
../../node_modules/expo-router/assets/file.png (138B)
../../node_modules/expo-router/assets/forward.png (188B)
../../node_modules/expo-router/assets/pkg.png (364B)
../../node_modules/expo-router/assets/react-navigation/elements/back-icon-mask.png (653B)
../../node_modules/expo-router/assets/react-navigation/elements/back-icon.png (8 variations | 359B)
../../node_modules/expo-router/assets/react-navigation/elements/clear-icon.png (4 variations | 425B)
../../node_modules/expo-router/assets/react-navigation/elements/close-icon.png (4 variations | 235B)
../../node_modules/expo-router/assets/react-navigation/elements/search-icon.png (7 variations | 592B)
../../node_modules/expo-router/assets/sitemap.png (465B)
../../node_modules/expo-router/assets/unmatched.png (4.8KB)

› ios bundles (1):
_expo/static/js/ios/entry-da6fb34959063309d69f1cd38a684cb2.hbc (4.5MB)

› android bundles (1):
_expo/static/js/android/entry-7a6fabfabdc5d614f0f837dcf7833941.hbc (4.8MB)

› Files (1):
metadata.json (4.1KB)

Exported: .expo/export-native
```

*(3I annotation, outside the verbatim block, which is unchanged. 0405 review finding 2: Metro's module counts vary between runs, so the `1228 modules` and `1691 modules` above don't identify a bundle. The 0405 review's run of the same command on the same tip printed 1533 iOS modules for the same `entry-da6fb34959063309d69f1cd38a684cb2.hbc`, and 1691 Android modules for the same `entry-7a6fabfabdc5d614f0f837dcf7833941.hbc`. Identify the bundles by those `.hbc` filenames.)*

Afterwards, Glob found `apps/mobile/.expo/export-native/metadata.json` and both `.hbc` bundles. Run 34, `git status --porcelain=v1 -uall`, printed nothing: `.expo/` is ignored (root `.gitignore:14`), and no tracked file changed.

**What this proves:** Metro resolves and bundles the whole app graph for both platforms, from `expo-router/entry.js`, and Hermes compiles each bundle to bytecode (`.hbc`).

**What it doesn't prove:** that a native binary builds, or that the app starts on a device or simulator. `EXPO_OFFLINE=1` was set, and the run needed no network. Whether it made any network request at all wasn't observed separately.
