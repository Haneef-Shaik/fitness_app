# QA-9 · Independent review of phase 2B (verbatim)

| Field | Value |
|---|---|
| What this is | The independent read-only review of QA-9 phase 2B (the review remediation), copied verbatim below the line. Nothing in it is edited, reordered or summarised |
| Review session | `74c7436b` (the session prefix in the source file's name; the full session ID was not supplied) |
| Source file | `/tmp/fitlog-74c7436b-final.md`, read on 26 October 2026 |
| Reviewed state | Branch `codex/qa9-quality-ratchets`, uncommitted working tree on top of `main` at `2a95726`, as phase 2B left it |
| Persisted by | The phase-2C remediation session, working for Codex under AUTH-01. How each finding was handled is in [ratchet-enforcement.md §5](ratchet-enforcement.md#5-phase-2c-review-remediation) and the [checkpoint](../../plan/runs/QA-9/checkpoint.md) |

---

All 35 quality tests passed on their own as well. Next I'm checking one suspected fail-open path in the guard, plus the Node pin, before I write up.

I didn't run the launcher script. I read the brief it points to (`/tmp/fitlog-qa9-review2b-launch.json`, the read-only QA-9 phase 2B review) and did the review myself in this session. `cat` was denied, so I opened the brief with Read.

## Result

There is one material defect: the coverage guard passes silently when the mobile thresholds file contains just `null`. There is also one low-severity gap. Fixes 1–4, 6 and 7 otherwise hold up.

The full gate passes. `rtk proxy pnpm check` exited 0 on Node `v22.23.1`, the version `.node-version` pins. Jest wrote its coverage reports normally, with no EACCES or warnings in the output.
- **Guard:** "verified" in all three copies, with the "not anchored" note.
- **Typecheck and lint:** pass.
- **Domain:** 37 of 37 tests pass.
  - Lines 535/583, branches 272/313, functions 106/117.
  - All 8 included files are counted.
- **Quality tests:** 35 of 35 pass.
- **Mobile:** 126 of 126 tests pass at 12.23 / 10.57 / 10.23 / 18.67 (254/2076 statements).
- **Plan:** 22 of 22 pass, and `plan.json and board.html match GOALS.md`.

Running `rtk proxy node --test scripts/quality/*.test.mjs` on its own also passed 35 of 35, and printed `Node 22.23.1 truncated --test-coverage-functions=50.01 (1/2)`.

## Findings

**1. Medium: a thresholds file containing `null` switches off every mobile check in the guard, before and after the floor is anchored.**
- **Location:** `scripts/quality/coverage-ratchet.mjs:181-185` and `:195-196`, with the effects at `:287` and `:237-238`.
- **Defect:**
  - `json()` returns `JSON.parse('null')`, which is `null`. That is the same value it uses for "file missing".
  - It only reports a problem when the file text itself is null, so a file containing `null` gives `tree.mobile = null` with no problem.
  - As a result, `jestProblems` is skipped (`:287`). The threshold and scope comparisons see `undefined` and return nothing (`:237-238`). The summary still says "verified", printing `statements ?`.
  - Self-review fix G7 closed exactly this case in `gate-wiring.mjs`, but not here.
- **Failure scenario:**
  1. Set `apps/mobile/coverage-thresholds.json` to `null`.
  2. Change line 3 of `jest.config.cjs` to `require('./coverage-thresholds.json') ?? { collectCoverageFrom: ['src/theme/**/*.{ts,tsx}'], global: {} }`.
  3. The guard passes in all three copies, including against an anchored `main`. Jest runs with the narrowed scope and no thresholds.
  4. All 35 quality tests still pass. The fixtures overwrite the thresholds file with `PINNED_THRESHOLDS`, so the tolerant config behaves correctly there. Test 1 runs the guard against the repository, and the guard itself passes.
  5. `pnpm check` goes green with mobile coverage effectively removed.
- **Fix:**
  - Tell "missing" apart from "parsed to null". For required files, report any parsed value that isn't an object, including `null`.
  - When the thresholds file exists but can't be read, report that the Jest config can't be checked, rather than skipping `jestProblems`.
  - Treat a `null` floor the same way. Today it is caught only by accident: the test module throws at import when it reads `floor.mobile`.
  - Add guard tests where the working-tree thresholds file and floor each contain `null`.

**2. Low: comments in the source code can narrow coverage, and the guard never looks at source files.**
- **Location:** `scripts/quality/coverage-ratchet.mjs:247-269` checks scope only through the Jest config. `docs/23-MASTER-PLAN.md:226` says the guard fails whenever "the coverage scope narrows".
- **Defect:** a `/* istanbul ignore file */` comment removes a file from Jest's coverage entirely. Node's `/* node:coverage disable */` comments probably do the same for the domain package (not verified through tsx). No residual risk lists this.
- **Failure scenario:**
  - Add `/* istanbul ignore file */` to the 0 %-covered `features/gym` screens.
  - That removes up to 573 uncovered statements, the same effect as the review's High finding 1.
  - Every threshold still passes, and so does the guard.
  - There are none in the repository today (I searched for `istanbul ignore`, `c8 ignore`, `v8 ignore` and `node:coverage`).
- **Fix:** have the guard fail on these comments under `apps/mobile/src` and `packages/domain/src`. Alternatively, record the gap next to R8/R9 and soften the docs/23 wording.

## What I checked and found sound
- **Fix 1 (Jest options):**
  - Only the six listed options are allowed, and `preset` and `testMatch` are pinned.
  - Reporters can only be Istanbul built-ins, and Jest runs its threshold check after the reporters.
  - A `jest` key in `package.json` is refused, and the require cache is cleared before each load.
- **Fix 2 (anchoring):**
  - `anchor` is the fork point of the last trusted ref, and it is set before the duplicate-commit skip, so it works when `HEAD` and `main` are the same commit.
  - Test 12 covers the gap before integration and its closure after.
  - Test 2 reads the evidence §5 rows and the §1 scope correctly.
- **Fix 3 (CI trust):**
  - CI mode comes from `GITHUB_ACTIONS` or `CI`.
  - A baseline that forks at `HEAD` is refused in CI.
  - The real workflow passes the layout checks. The baseline is defined exactly once, the check step is one line, and the job's env names match the allowlist.
- **Fix 4 (lint and types):** the gate scripts are pinned exactly, `pre`/`post` scripts are refused, and the strict compiler options are checked against the current TypeScript list.
- **Fix 6 (integer comparison):**
  - Lines: 533×10000 ≥ 9142×583, and 532 fails.
  - Branches: 272/313 against 86.90 passes.
  - Functions: 106/117 against 90.59 passes, and against 90.60 fails.
  - The 2-decimal rule is the same in the guard and the reporter, and the Node-version assertion only applies on 22.23.1.
- **Fix 7 (unloaded files):**
  - The reporter's glob matching agrees with Node's for the pinned globs.
  - It fails closed when a file can't be listed or the globs use syntax it doesn't read.
  - Node keeps a failing exit code.
- **Starting floor:** all 7 values equal the measured counts rounded down to 2 decimals, and the floor equals evidence §5 and the §1 scope.
- **Documentation:** the test counts (19 + 8 + 8) and mutation case counts (17 Jest, 20 workflow, 12 tsconfig) match the documents.
- **Still open, already recorded:** R3 (domain lines sit exactly at the lowest run seen; my run gave 535) and R1, R2, R5, R6, R10.

I made no edits, commits, status changes, sub-agents or network calls.
