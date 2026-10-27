# QA-9 · Independent review of phase 2F (verbatim)

| Field | Value |
|---|---|
| What this is | The independent read-only review of QA-9 phase 2F (the phase-2E review remediation, and R16 closed narrowly), copied verbatim below the line. Nothing in it is edited, reordered or summarised |
| Review session | `68f44e38-7c4c-43ce-bdbb-bc9203468b1a`. Codex's phase-2G brief names it by its prefix `68f44e38` and says that session has stopped. The transcript `~/.claude/projects/-Users-Adya--codex-worktrees-fitlog-qa9-fitness-app/68f44e38-7c4c-43ce-bdbb-bc9203468b1a.jsonl` records `"agentName":"FitLog QA9 independent phase2F review"`, `"permissionMode":"dontAsk"`, Claude Code `2.1.310` and branch `codex/qa9-quality-ratchets`, and holds this review's sentence "I found no critical, high or medium issue, and three lows" |
| Source file | `/tmp/fitlog-68f44e38-final.md`, read on 26 October 2026 |
| Reviewed state | Branch `codex/qa9-quality-ratchets`, uncommitted working tree on top of `main` at `2a95726`, as phase 2F left it. The phase-2F writer session (`31abe500`, prefix only) is retired, as Codex's phase-2G brief records |
| **Attribution: source-only, all Bash denied, NOT independently executed** | This review is **source-only**. Every Bash call in its session was **denied** in dontAsk mode, so it ran nothing: not the 77 quality tests, not `pnpm check`, not `node --version`, not `git diff`. Its three findings are **reasoned** from the candidate files and the installed TypeScript 6.0.3, ESLint 9.39.5, acorn and plugin-kit code. **It did not execute or demonstrate any of them.** Its own text says the four non-QA-9 diff sizes (8, 3, 2 and 2 lines) were not verifiable without git |
| Since | Phase 2G reproduced findings 1 and 2 with the installed TypeScript in scratch probes under the OS temporary directory before fixing them, and turned each into a regression test. Type-suppression test 10 now shows finding 3's premise with the installed TypeScript: the mobile tsconfig resolves `allowJs` on and `checkJs` off, and a type error TypeScript reports in a `.ts` file goes unreported in the same `.js` file. Details: [ratchet-enforcement.md §9](ratchet-enforcement.md#9-phase-2g-phase-2f-review-findings) |
| What it accepts | Phase 2F is ready for the separate touched-file Prettier phase once finding 1 is fixed, mutation-checked and re-verified on Node 22.23.1, or once Codex accepts it as a named residual. The review called findings 2 and 3 non-blocking. It accepts the phase only: not the goal, not a box, and not the owner's signature |
| Persisted by | The phase-2G session (a new session, working for Codex under AUTH-01). How each finding was handled is in [ratchet-enforcement.md §9](ratchet-enforcement.md#9-phase-2g-phase-2f-review-findings) and the [checkpoint](../../plan/runs/QA-9/checkpoint.md) |

---

The coverage floors are unchanged. Next I'll check how the earlier lows were handled, starting with the phase-2E review as persisted.

The core guard has nothing new: it runs the type scan, and its declaration-file refusals reach `problems`. Last check: whether `scripts/test-design-rules.cjs` would catch JavaScript under `src/`.

I found no critical, high or medium issue, and three lows. One of them (finding 1) is a real gap in the new R16 refusal and is worth a one-line fix before the commit.

Bash was denied in this session, so I ran nothing. I did not run the 77 quality tests, `pnpm check`, `node --version` or any `git diff`. Everything below comes from reading the candidate files and the installed TypeScript 6.0.3, ESLint 9.39.5, acorn and plugin-kit code. I made no edits and started no sub-agents.

## Findings

**1. Low, a concrete defect: a declaration file in `src/` gets past the R16 refusal if its name has a line break after `.d.`**
- **Location:** `scripts/quality/type-suppression.mjs:39`, `DECLARATION = /\.d\.(?:[cm]ts|(?:.*\.)?ts)$/i`.
- **The defect:** in a JavaScript regex without the `s` flag, `.` does not match CR, LF, U+2028 or U+2029. TypeScript has no such limit: any name ending `.ts` whose base name contains `.d.` is a declaration file (`typescript.js:40476-40480`).
- **Failure scenario:** someone adds `apps/mobile/src/types/loose.d.` + U+2028 + `.ts`, holding a loosening declaration such as a `declare module` augmentation.
  - The mobile tsconfig's `**/*.ts` includes it, because its wildcard uses `[^./]`, which does match U+2028 (`typescript.js:22396`).
  - TypeScript treats it as a declaration file, so `skipLibCheck` means it is never type-checked.
  - The scan counts it as a TypeScript file but does not refuse it, and ESLint and Jest find nothing in a types-only file. `pnpm check` passes.
  - The separator is invisible in most file lists.
  - In `packages/domain/src` the exact coverage reporter already fails any matched file no test loads (R7), so this route is mobile only.
- **Docs it falsifies:** the comment at `type-suppression.mjs:37` and checkpoint line 135 call this pattern a "fail-safe superset" of TypeScript's names. `ratchet-enforcement.md` line 153 says it covers "any name" TypeScript calls a declaration.
- **Fix:**
  - Add the `s` flag (`/…$/is`), or copy TypeScript's rule directly: `/\.d\.[cm]ts$/i.test(n) || (/\.ts$/i.test(n) && /\.d\./i.test(n))`.
  - In type-suppression test 8, add `loose.d.${LS}.ts` and `loose.d.\n.ts` to the declaration names checked with `isDeclarationFile`, and check that they are refused.
  - Mutation-check by dropping the flag, and correct the wording in the three places above.
  - R16-in-`src/` is recorded as closed, so this is the same class as phase 2E's two lows.

**2. Low and bounded: a UTF-16 file is decoded differently by the scan and by TypeScript**
- **Location:** `scripts/quality/config-inventory.mjs:22` reads every file as UTF-8, and `type-suppression.mjs:105` uses that reader. TypeScript's `sys.readFile` decodes a UTF-16 file that starts with a byte-order mark (`typescript.js:8533-8556`).
- **Failure scenario:** `packages/domain/src/sub/fixtures.test.ts` is saved as UTF-16LE and starts with `// @ts-nocheck`.
  - TypeScript (domain include `src/**/*.ts`) reads it and switches checking off for that file.
  - The scan sees `@\0t\0s\0…`, with a NUL byte between letters, and finds nothing.
  - The domain is not linted, the file is excluded from coverage, and only `src/*.test.ts` runs, so `pnpm check` passes.
  - Git shows the file as binary, which hides the comment from a diff review.
- **Why the impact is small:** Babel, Metro, Node with tsx, and ESLint all read UTF-8, so such a file can only ever be dead or types-only code. In mobile, ESLint fails to parse it unless it sits in an ignored folder.
- **Fix:** refuse any TypeScript file that starts with the bytes `FE FF` or `FF FE`. No real source file can be UTF-16, so this has no false positive. At minimum, name this under R14. It does not block the next phase.

**3. Low, an unnamed residual (it was already true on `main`; QA-9 did not introduce it): JavaScript under `apps/mobile/src` escapes types, coverage and the design-token lint**
- **Location:**
  - `allowJs` is on in `expo/tsconfig.base`, without `checkJs`. TypeScript then reports almost no type errors for plain JavaScript (`typescript.js:22904-22907`).
  - Coverage counts only `src/**/*.{ts,tsx}` (`coverage-thresholds.json:2`).
  - The design-token lint rule applies only to `src/**/*.{ts,tsx}` (`lint-scope.mjs:53`).
- **Failure scenario:** someone renames `GymMembersScreen.tsx` to `.jsx`, strips its types and adds `'#ff0000'`.
  - `tsc` passes, and the types it infers from the JavaScript flow into the files that import it.
  - The design-token rule never sees the file.
  - Jest stops counting it, so statement coverage changes, upward if the file was poorly covered, and the ratchet passes.
  - No JavaScript file exists under either `src/` today.
- **Fix:** name it in R13 (QA-10, renames that take code out of the count) and next to R16 (QA-9). Or refuse `.js`, `.jsx`, `.mjs` and `.cjs` under `apps/mobile/src` in the guard. This can be deferred.

**What I did not count as defects:**
- **PL-1 dependency and workflow trust (R6):** a force-added `node_modules` path, `.npmrc`, `pnpm-workspace.yaml`, workflow steps, and the installed TypeScript, ESLint and expo config that tests 7 and 8 load.
- **False positives you have accepted, all fail-safe:**
  - the whole-text scans, including strings and prose;
  - U+017F (long s) matching `s`, and upper-case `.D.TS`;
  - `ios/Pods` links failing closed (R15);
  - the three-word reason rule and the named config pins.
- **The src-only declaration policy**, with the rest of R16 open, low, accepted and owned by S7 Quality under QA-9.

## Checked and sound
- **The `u` flag (Kelvin fix):**
  - For the letters in these directives, Unicode folding adds exactly two new matches, U+212A for `k` and U+017F for `s`. Nothing that matched under `/gi` stops matching.
  - Test 7 builds its spellings from `toLowerCase()` over every code point and checks each one against each package's own TypeScript.
- **`LINE_END` (separator fix):**
  - `\p{Zl}` and `\p{Zp}` are exactly U+2028 and U+2029, the same four line ends that acorn and TypeScript use.
  - Ending a `//` comment earlier cannot hide anything ESLint sees, and block comments are unchanged.
  - plugin-kit 0.4.1's directive and reason split matches the scan exactly, and ESLint reads files as UTF-8 too.
  - The HTML-style comment `<!--` cannot be used: expo's core config parses every file as a module, overriding ESLint's commonjs default for `.cjs`.
- **Coverage-suppression scan:** Istanbul's comment regexes are case-sensitive, so the scan's `/gi` matches more than Istanbul does, never less.
- **R16 wiring:**
  - `DECLARATION_ROOTS` and the `inSource` prefix with its slash (the `srcs/` trap is covered).
  - The refusal runs before the file is read.
  - `skipLibCheck` is on in both packages.
  - No declaration file exists in either package today (Glob).
- **Floors unchanged:** the floor, the thresholds file, the domain flags and baseline §5 all hold 12.23/10.57/10.23/18.67 and 91.42/86.90/90.59, with scope `src/**/*.{ts,tsx}` minus `__tests__`.
  - Mobile `test:ci` is the same as `MOBILE_TEST_CI`.
  - `QUALITY_FILES` lists all seven test files. 31+6+8+9+9+6+8 = 77 tests.
- **Phase-2D test gaps:** all three are present.
- **Earlier lows:** each phase-2E disposition holds. R9 stays with QA-10.
- **Not verifiable without git:** the claim that the only non-QA-9 diffs are four files at 8, 3, 2 and 2 lines. The current file contents fit it.

## Readiness
Phase 2F is ready for the separate touched-file Prettier phase once finding 1 is fixed, mutation-checked and re-verified on Node 22.23.1. Alternatively, Codex can explicitly accept it as a named residual. Findings 2 and 3 don't block.

For the Prettier phase, leave `apps/mobile/eslint.config.js` alone, because it is pinned as text, then re-run the quality tests and `pnpm check`. That run will also be the independent re-run of phase 2F, which nobody but its writer has done yet.

None of this means QA-9 is done. Box 3's hosted run and anchoring the floor at the exact merge commit are still open. This review is finished, and I'm stopping here.
