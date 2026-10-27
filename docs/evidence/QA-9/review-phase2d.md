# QA-9 · Independent review of phase 2D (verbatim)

| Field | Value |
|---|---|
| What this is | The independent read-only review of QA-9 phase 2D (the phase-2C review remediation, R8 and R11), copied verbatim below the line. Nothing in it is edited, reordered or summarised |
| Review session | `a8b4f2bc-5888-4bb5-a451-b3c62bb41ad7`, as Codex's phase-2E brief names it. That is the transcript `~/.claude/projects/-Users-Adya--codex-worktrees-fitlog-qa9-fitness-app/a8b4f2bc-5888-4bb5-a451-b3c62bb41ad7.jsonl`. It records `"agentName":"FitLog QA9 phase2D independent scope review"`, `"permissionMode":"dontAsk"`, Claude Code `2.1.310` and branch `codex/qa9-quality-ratchets`, and its text includes this review's title line. The brief is `/tmp/fitlog-qa9-review2d-launch.json` (agent `code-reviewer`). Unlike the phase-2C review, this one ran commands: the quality suite, `pnpm check`, `git status`, `node --version` and `which node`, as the review says |
| Source file | `/tmp/fitlog-a8b4f2bc-final.md`, read on 26 October 2026 |
| Reviewed state | Branch `codex/qa9-quality-ratchets`, uncommitted working tree on top of `main` at `2a95726`, as phase 2D left it |
| What it accepts | Phase 2D, with no critical, high or medium finding. It accepts the phase only: it is not a verdict on the goal, not the owner's signature, and not Codex's acceptance, which is recorded separately in the [checkpoint](../../plan/runs/QA-9/checkpoint.md) |
| Persisted by | The phase-2E session, working for Codex under AUTH-01. How each finding was handled is in [ratchet-enforcement.md §7](ratchet-enforcement.md#7-phase-2e-phase-2d-review-findings-and-r14) and the [checkpoint](../../plan/runs/QA-9/checkpoint.md) |

---

# QA-9 phase 2D review: accept, with four low findings

**Verdict: accept phase 2D.** I found nothing critical, high or medium. Finding 1 is a few-line fix worth making before the commit, since R8 is recorded as closed. Findings 2 and 3 need naming under R6 for PL-1, or a cheap fix in the next bounded phase. Finding 4 corrects the plan for box 3.

This accepts the phase only, not the goal: the floor stays unanchored until it is integrated into `main` at the exact merge commit, and Prettier and the hosted CI run are still open.

## What I ran
- **Node:** `rtk proxy node --version` gave `v22.23.1`, and `rtk proxy which node` gave `/Users/Adya/.local/bin/node`. Inside `pnpm check` the reporter test printed `Node 22.23.1 truncated …`, so the package scripts ran on the pinned Node too.
- **Quality tests:** `rtk proxy node --test scripts/quality/*.test.mjs` passed 65 of 65.
- **`rtk proxy pnpm check`:** exit 0, ending at `plan.json and board.html match GOALS.md`.
  - The guard counted 210 entries, 131 linted files and 141 scanned source files.
  - Domain: 535/583 lines (another R3 data point), 272/313 branches, 106/117 functions, all 8 files counted.
  - Tests: 65 quality, 126 mobile at 12.23 / 10.57 / 10.23 / 18.67, and 22 plan.
- **`git status`:** the same 27 paths before and after (5 modified, 22 untracked). My runs changed nothing.
- **Denied once:** `rtk proxy git rev-parse --git-common-dir` (don't-ask mode). I didn't retry it. I read the installed packages with Read and Grep; they are hoisted at the repo root (`nodeLinker: hoisted`).

## Findings

**1. Low: the `eslint-disable` scan misses two forms of "disable every rule"**
- **Where:** `scripts/quality/lint-scope.mjs:109` and `:117`. The comment at `:104-105` says "a directive is never missed".
- **(a) An empty rule list:** `/* eslint-disable , -- legacy */` or `/* eslint-disable "" -- legacy */`.
  - The guard sees text after the label and takes it as naming rules.
  - ESLint drops empty and quote-only items (`@eslint/plugin-kit` `index.cjs:184-201`), then turns the empty list into "every rule" (`eslint/lib/linter/linter.js:351-352`, `ruleIds.length ? ruleIds : [null]`).
- **(b) Two comments back to back:** `/* keep *//* eslint-disable */` or `/* keep */// eslint-disable-line`.
  - `matchAll(/\/[/*]/g)` takes the `/` that closes the first comment together with the next `/`. The second comment's real start is never matched, and the text the guard reads (`* eslint-disable */`) is not a directive.
  - ESLint sees two comments, and the second one is a directive.
- **What goes wrong:** either form at the top of `GymMembersScreen.tsx` switches off the design-token rule and every other rule for that file. The directive is used, so no unused-directive warning appears, and `pnpm check` passes.
- **Why only low:** it takes deliberately odd syntax, and the guard promises to stop careless changes, not hostile ones.
- **Fix:**
  - Find comment starts with a lookahead, `/\/(?=[/*])/g`, so starts that overlap are each read.
  - Split the rule list the way plugin-kit does: on commas, trimmed, matching quotes removed, empty items dropped. Treat an empty list as "disables every rule".
  - Add all four strings to the failing list in lint-scope test 5.

**2. Low: a `.watchmanconfig` can shrink the set of files Jest counts, wherever watchman is installed**
- **Where:**
  - The inventory looks only for Babel and ESLint names under `apps/mobile`.
  - The pinned `test:ci` is at `gate-wiring.mjs:26`.
- **How it happens:**
  - Jest uses watchman whenever it is installed: `watchman: true` in `jest-config/build/Defaults.js:125`, and the checks in `jest-haste-map/build/index.js:286, 752, 1067-1073`.
  - `--ci` doesn't change that, and `watchman` isn't on the Jest allowlist.
  - Watchman's documented `ignore_dirs` setting hides folders from Jest's file list. Jest adds untested files only from that list.
- **What goes wrong:** on a machine with watchman, a change adds a `.watchmanconfig` at the repo root or in `apps/mobile` that names `src/features/gym`. That gives the 2B review's P1 numbers (statements 254/1503), the thresholds pass, and so does the guard.
- **Where it doesn't apply today:** this Mac (no Homebrew watchman found), and probably GitHub's runner, which I didn't confirm. I didn't run watchman; this follows its documentation and Jest's code.
- **Fix:** name it under R6/R11 for PL-1 now. The cheapest real fix is adding `--no-watchman` to the Jest command in `test:ci` and its pin, in the next bounded phase.

**3. Low: the reason given for skipping `node_modules` is incomplete**
- **Where:** `scripts/quality/config-inventory.mjs:10-14` and `:37`.
- **The gap:** a `node_modules` folder inside `apps/mobile` can override shared config, because each tool looks there before the hoisted copy at the repo root:
  - Jest resolves `preset: 'jest-expo'` starting from `apps/mobile` (`jest-config/build/normalize.js:217-224`).
  - jest-expo resolves `expo/internal/babel-preset` from `apps/mobile` first (`resolveBabelOptions.js:49-51`).
  - `eslint.config.js` requires `eslint-config-expo/flat` from `apps/mobile`.
- **What goes wrong:** a change force-adds `apps/mobile/node_modules/jest-expo/jest-preset.js`, re-exporting the real preset plus a `modulePathIgnorePatterns` entry. A local `pnpm check` uses it, and the guard still sees `preset: 'jest-expo'` while skipping the folder. I didn't verify whether `pnpm install --frozen-lockfile` in CI would remove it.
- **Why only low:** force-adding a gitignored path is deliberate, and this sits at the dependency-trust boundary (R6).
- **Fix:** correct the comment. Then either fail when Git tracks any path with a `node_modules` segment under `apps/mobile` (one read-only `git ls-files`), or name it under R6.

**4. Low (plan): the box-3 run as written won't start the CI job**
- **Where:** `checkpoint.md:203` and `:216` ("Push a throwaway branch"); `.github/workflows/mobile-ci.yml:3-6` and `:37-40`.
- **The problem:** the workflow runs on pull requests, and on pushes only to `main` and `v2/develop`. Pushing a throwaway branch starts nothing. A push that creates a branch also carries an all-zero `before`, which the "Require the trusted contract baseline" step refuses before `pnpm check` runs.
- **Fix:** plan the run as a draft pull request, and confirm the job fails at ESLint, not earlier at the guard or typecheck.

**Harmless false positives:** a lowercase line comment such as `// eslint is configured in …` is flagged as inline configuration, although ESLint reads configuration only from block comments. They fail safe, and the design accepts rewording such text.

## Checked and found sound
- **The four phase-2C findings are fixed.**
  - I found no way around the include-pattern rule: Jest counts only files under `apps/mobile`, and a pattern starting with `src/` can't reach outside `src/`.
  - The `package.json` read now sits outside the `try`.
  - The evidence wording says "authorised".
  - The Babel guard covers every config name the installed jest-expo and @babel/core look for.
- **§6's account of how the tools load config matches the installed code:** jest-expo's options and its 13 names; Babel looking only within the mobile package; `CoverageReporter.js:282-291`; ESLint's six config names, `ESLINT_FLAGS` and `ESLINT_USE_FLAT_CONFIG`; and the directive grammar.
- **New confirmations:**
  - babel-jest passes explicit options to babel-plugin-istanbul, so `.nycrc` and a `nyc` key are never read (`lib/index.js:70-84`).
  - A second `jest.config.*`, or a `jest` key, makes Jest stop with "Multiple configurations found" (`resolveConfigPath.js:142-153`), so that route fails safe.
- **Links, read errors, nested packages:** links outside `node_modules` fail; unreadable entries are reported and never crash the guard; a missing or empty mobile folder reports the missing `package.json`.
- **Gate wiring and tests:** the two `QUALITY_FILES` lines and test 8 are right. The test count is 65 (30 + 6 + 8 + 8 + 7 + 6), and each new case must change the file before it asserts.

## Codex's design choices
- **Exact-text ESLint pin with S7 Quality as owner:** sound.
- **Named, reasoned disables and no inline config:** sound once finding 1 is fixed.
- **Refusing every nested `package.json`:** sound. A future Expo local module with its own `package.json` would need a reviewed change.
- **R15 (fail closed on generated folders):** acceptable for now. A likely trigger: `expo run:ios` creates `ios/Pods/Headers` links, and `ios/` and `android/` aren't gitignored. ESLint would start linting generated code there too, so the guard fails no earlier than lint would.
- **R14 next bounded phase; R9 next phase or QA-10:** agreed. R9 also covers untested files Babel fails to transform for reasons in the source itself, not only in config. The Babel guard closes only the config route.

## Test gaps
All low:
- No test for a directory named `.babelrc`.
- No tests for the lint-scope `package.json` cases (not JSON, `null`, not a regular file).
- The `eslintConfig` and `eslintIgnore` mutations weren't run one by one.
- I didn't re-run mutations D1–D14, since I may not edit.

## Residuals, not new
- **R1:** still unanchored. `HEAD` and `main` are both `2a95726`.
- **R6:** `.npmrc` and `pnpm-workspace.yaml` are committed and unpinned, and CI's pnpm reads them too. PL-1's protection list should name both. Whether pnpm turns an `.npmrc` `node-options` entry into `NODE_OPTIONS` is still unverified.
- **R3:** new sample, 535/583.

I made no edits, installs, network calls, commits, status or ledger changes, and started no sub-agents. Nothing here accepts a goal box.
