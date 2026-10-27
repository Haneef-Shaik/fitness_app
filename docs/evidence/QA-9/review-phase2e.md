# QA-9 · Independent review of phase 2E (verbatim)

| Field | Value |
|---|---|
| What this is | The independent read-only review of QA-9 phase 2E (the phase-2D review remediation and R14), copied verbatim below the line. Nothing in it is edited, reordered or summarised |
| Review session | `ad123579-5ce7-4580-9f0a-15446140e87a`. Codex's phase-2F brief names it by its prefix `ad123579`; the full ID is the transcript `~/.claude/projects/-Users-Adya--codex-worktrees-fitlog-qa9-fitness-app/ad123579-5ce7-4580-9f0a-15446140e87a.jsonl`, which records `"agentName":"FitLog QA9 independent phase2E review"`, `"permissionMode":"dontAsk"`, Claude Code `2.1.310` and branch `codex/qa9-quality-ratchets`, and holds this review's first sentence |
| Source file | `/tmp/fitlog-ad123579-final.md`, read on 26 October 2026 |
| Reviewed state | Branch `codex/qa9-quality-ratchets`, uncommitted working tree on top of `main` at `2a95726`, as phase 2E left it |
| **Commands: NOT RUN by this review** | The review ran **no command**. As it says, every Bash call in its session, `rtk` included, was denied in dontAsk mode. It did not run the quality tests or `pnpm check`, and did not read the Node version (only `.node-version`). Its two findings are **reasoned** from the installed TypeScript 6.0.3, ESLint, acorn and JavaScript regex rules, **not demonstrated** by it |
| **Stale claim, corrected** | Its line "Only the writer has run 2E's `pnpm check` so far" was out of date when it was written: Codex had independently run the full `pnpm check` of phase 2E on the pinned Node 22.23.1, 258 tests, in the previous cycle (Codex's phase-2F brief, 26 October 2026; Codex's statement, not re-run here). The line is kept below because the review is verbatim; it is not repeated as fact anywhere else |
| Also since | Codex independently reproduced both findings (each scan returning `problems: []` for the review's input) in its own scratch directory, `fitlog-qa9-unicode-independent-WhSC1M`, which the phase-2F session did not read. Phase 2F then demonstrated both with the installed tools: TypeScript reads the Kelvin-sign spelling as `ts-nocheck`, and ESLint turns every rule off for the U+2028 case ([ratchet-enforcement.md §8](ratchet-enforcement.md#8-phase-2f-phase-2e-review-findings-r16-and-three-test-gaps)) |
| What it accepts | Phase 2E, once findings 1 and 2 are fixed, mutation-checked and re-verified, as ready for the separate Prettier phase. It accepts the phase only: not the goal, not a box, not the owner's signature. Codex's own acceptance is recorded separately in the [checkpoint](../../plan/runs/QA-9/checkpoint.md) |
| Persisted by | The phase-2F session, working for Codex under AUTH-01. How each finding was handled is in [ratchet-enforcement.md §8](ratchet-enforcement.md#8-phase-2f-phase-2e-review-findings-r16-and-three-test-gaps) and the [checkpoint](../../plan/runs/QA-9/checkpoint.md) |

---

I found two low-severity bypasses. Phase 2E is ready for the separate Prettier phase once both one-line fixes are made, and QA-9 is not done. I couldn't run any command: every Bash call, `rtk` included, was denied in don't-ask mode. So I did not run the 73 quality tests or `pnpm check`, and I did not read the actual Node version (only `.node-version`, which says `22.23.1`). Both bypasses below are reasoned from the installed TypeScript 6.0.3, ESLint, acorn and the JavaScript regex rules, not demonstrated.

## Findings

**1. Low (fix before commit, since R14 is recorded as closed): a Kelvin sign gets `@ts-nocheck` past the scan**
- **Location:** `scripts/quality/type-suppression.mjs:26` (`/@ts-nocheck/gi`).
- **The defect:** TypeScript lower-cases the pragma name with `toLowerCase()` (`typescript.js:40601`, `:40651`). The KELVIN SIGN, U+212A, lower-cases to a plain `k`. But a JavaScript `/i` regex without the `u` flag does not treat U+212A as `k`.
- **Failure scenario:** the first line of `apps/mobile/src/features/gym/GymMembersScreen.tsx` is `// @ts-nocheck` with its last letter typed as U+212A.
  - TypeScript reads it as `ts-nocheck`, and `canIncludeBindAndCheckDiagnostics` (`:22902`) then turns off type checking for the whole file.
  - The scan finds nothing, so `tsc` and `pnpm check` both pass with type errors in that file.
  - This breaks the "in any letter case" and "superset of what TypeScript honours" claims in docs/23 line 240, `ratchet-enforcement.md:594` and checkpoint line 120.
  - `@ts-ignore` and `@ts-expect-error` are not affected: TypeScript matches those case-sensitively and never lower-cases them.
- **Fix:**
  - Add the `u` flag to the three patterns (`/@ts-nocheck/giu`, and the same for the other two for consistency). With `u`, U+212A matches `k`.
  - Add `'// @ts-nochec\u212A'` to the refused list in type-suppression test 3, and check that dropping `u` makes it fail.
  - Fix the three overclaiming sentences.

**2. Low (fix before commit, since R8 is recorded as closed): a Unicode line separator hides a blanket `eslint-disable-line`**
- **Location:** `scripts/quality/lint-scope.mjs:109` (`const newline = /[\r\n]/g;`).
- **The defect:** a `//` comment ends at U+2028 and U+2029 as well as at CR and LF, in both TypeScript (`typescript.js:11746-11747`, `:12955-12962`) and acorn (`acorn.js:251-252`). The guard reads on past them to the next LF.
- **Failure scenario:** a screen holds `const accent = '#ff0000'; // eslint-disable-line`, then U+2028, then `// no-restricted-syntax -- palette value`.
  - ESLint sees ` eslint-disable-line` with no rules, so every rule is off on that line and the hex colour passes.
  - The guard reads one long comment, takes `// no-restricted-syntax` as the named rule and `palette value` as the reason, and reports nothing.
  - `scripts/test-design-rules.cjs` only lints fixed sample text, so it doesn't catch this either.
  - `type-suppression.mjs:31` already includes both separators in its line-end pattern, so the two scanners disagree.
- **Fix:**
  - Use `/[\r\n\u2028\u2029]/g` in `bodyAt`.
  - Add the string above to the failing list in lint-scope test 5.
  - Reword the comment at `:115-118`, which says no comment ESLint sees is skipped.

**Not counted as defects (dependency and workflow trust already assigned to PL-1 under R6):** a force-added `node_modules` path, `.npmrc`, `pnpm-workspace.yaml`, and workflow or action trust.

## Checked and sound
- **Overlapping comment starts:** the lookahead `/\/(?=[/*])/g` reads every comment start on its own. The rule-list reading matches `@eslint/plugin-kit`'s `parseListConfig` and its directive and reason split exactly. The extra flags it raises (`/// eslint-disable-line`, `eslint-disable` in a `//` comment) only fail safe.
- **HTML-style `<!--` comments in `.cjs` files:** not a way around the scan. `eslint-config-expo/flat/utils/core.js:25` parses every file as a module, where `<!--` is not a comment.
- **`--no-watchman`:**
  - The pin (`gate-wiring.mjs:31`) and the mobile `test:ci` script are identical.
  - Gate-wiring test 9 checks the reviewed command itself, and `watchman` stays off the Jest allowlist.
  - `test:coverage` lacks the flag, but it is a measurement command outside the gate.
- **Full source coverage and floors, unchanged:**
  - Scope is `src/**/*.{ts,tsx}` minus `__tests__`, in both `coverage-thresholds.json` and the floor.
  - Mobile thresholds are 12.23 / 10.57 / 10.23 / 18.67, and domain flags are 91.42 / 86.90 / 90.59.
  - All of these match `coverage-baseline.md` §5.
  - I read the files but could not diff them against `main`.
- **The rest of the TypeScript scan:** `.mts`, `.cts` and `.d.ts` are all read; only each package's top-level `node_modules` is skipped; links fail closed. The guard wires it in at `coverage-ratchet.mjs:352/362/369`, and `QUALITY_FILES` lists its test.
- **Earlier phases:** the earlier guard modules (`coverage-ratchet`, `coverage-suppression`, `transform-config`, `config-inventory`, `exact-coverage-reporter`) showed no new defect.
- **Your accepted choices:** I didn't count the whole-text scan, the three-different-words reason rule or their known false positives as findings, as you directed.

## Dispositions and readiness
- **R16:** record it explicitly as QA-9's (S7 Quality) accepted low residual. It does not block the Prettier phase.
  - The cheap way to close it is to refuse `.d.ts` files under `src/` in both packages. A search found none today.
  - Limit it to `src/` so a generated `apps/mobile/expo-env.d.ts` doesn't trip it.
  - Turning `skipLibCheck` off is not recommended.
- **R9:** stays with QA-10. The records already say so and don't claim it closed.
- **Readiness:** phase 2E is ready for the separate Prettier phase once findings 1 and 2 are fixed, mutation-checked and re-verified. Before the commit, someone with shell access should run `rtk proxy node --version`, `rtk proxy node --test scripts/quality/*.test.mjs` and `rtk proxy pnpm check`. Only the writer has run 2E's `pnpm check` so far.
- **Goal not done:** box 3's hosted lint-failure run (as a draft pull request) and anchoring the initial floor by integrating it into `main` at the exact merge commit are still open, and Prettier has not started.

I made no edits, commits, pushes or network calls and started no sub-agents. This is one bounded review, and I'm stopping here.
