I found 0 critical, 1 high, 2 medium and 6 low findings. The generator, recipe and colour guard are sound in the source and fail closed as claimed. Box 1 should not be ticked "met" yet (see H1 and M1), and boxes 2 and 3 are still open, so DS-1 is not Done.

I used only Read and Grep, and no tool call was denied. I ran nothing. Every test count, gate result, SHA-1 and mutation result below is the implementer's claim and is UNRUN in this review. My own contrast numbers are worked out by hand and are approximate, except where I quote DS-1's matrix or the two colours are the identical hex value.

## Findings

### H1 · Primary buttons show no focus change in Dark, and the contrast matrix doesn't test it
- **Location:** `apps/mobile/src/ui/AppButton.tsx:19,33`; `apps/mobile/src/theme/themes/momentum.json:14,16`. The test gap is at `src/theme/__tests__/contrast.test.ts:21,27-38`.
- **Defect:** AppButton's only focus indicator is a 2 dp border in `primary` (`tokens.ts:12`). In Dark, `primary` and `primaryContainer` are both `#CAFD00`, so a focused primary button looks exactly like an unfocused one.
- **Failure scenario:**
  - In the Dark theme, focus any default (primary) AppButton by keyboard or D-pad. Examples: `GymProvider.tsx:15` (Retry), `FreezeScreen.tsx:62`, `WorkspaceScreen.tsx:16`.
  - The border changes from `#CAFD00` to `#CAFD00`, which is 1.00:1, so nothing on screen changes. Unless the platform draws its own highlight on top, this fails WCAG 2.4.7 (AA), which PRD §23.1 requires.
  - The matrix tests only `outline` as a line, and only on surfaces, so all 139 cases still pass. Yet the handoff, the final report and `THEMING.md:82-84` all say every action pair is covered.
- **Scope:** This existed before DS-1 (the button comes from QA-1, the colours from the approved palette), and the DS-1 diff does not make it worse. It blocks ticking box 1, not merging the diff.
- **Suggested fix:**
  - **DS-4:** change the focus treatment, for example an outer ring in `onSurface` with a gap, or a ring colour that differs from the fill in both themes.
  - **DS-1:** add focus-ring rows to the matrix at ≥3:1: `primary` against `primaryContainer`, `secondaryContainer` and `surfaceHigh`. Pin the Dark `primary`/`primaryContainer` row as a known gap until DS-4 lands.
  - Both need implementation authorization.

### M1 · Light coach outline: tested against only one background, and its replacement cue isn't required anywhere
- **Location:** `contrast.test.ts:36,61-67`; `momentum.json:66`; `docs/plan/GOALS.md:474-477`.
- **Defect:** The 2.70 gap is pinned only against the card's own fill (`coachContainer`). The test comment says the border is only a backup cue, because a proposal is identified "by its label and violet ink". Violet ink is colour, and nothing in DS-4's Done-when or in any test requires a visible label.
- **Failure scenario:**
  - In Light, `#9B7BFF` also falls below 3:1 against most surfaces the card can sit on: about 2.99 on `surfaceLow`, 2.85 on `surfaceContainer` and 2.57 on `surfaceHighest`. Only `surface` passes, at about 3.06.
  - The light card fill against the page is about 1.13:1.
  - DS-4's Done-when asks only for a "screen-reader label and role". If DS-4 ships a tappable proposal card with no visible text label, the dashed outline becomes its only boundary and its only cue beyond colour. That fails WCAG 1.4.11 and 1.4.1, and no DS-1 test would catch it.
- **Contract check on Codex's routine choice:**
  - Treating the outline as decorative does **not** violate PRD §19.1, PRD §23.1 or docs/22, provided it is enforced. WCAG 1.4.11 requires 3:1 only for visuals that are needed to identify something, and PRD §19.1 only limits violet to AI proposals.
  - The test pins 2.70 as `< 3`; it does not count it as passing 3:1.
  - The choice holds only if all four of these are true:
    - (a) Every AI proposal shows a visible text label, not just an `accessibilityLabel`.
    - (b) A tappable proposal is identified by a text control, or has a ≥3:1 boundary.
    - (c) No proposal state (accepted, unsure, ticked) depends on the outline.
    - (d) The gap comment stops counting violet ink as an identifier.
  - If DS-4 can't guarantee (a) to (c), the contract-safe fallback is option 2: use coachInk `#6745C7` for the border. Per `contrast-matrix.md:46` it is at least 5.28:1 on every light surface. That is a palette change and needs a Figma update.
- **Owners:**
  - **Codex:** decision log, and conditions (a) to (d) as a DS-4 Done-when line.
  - **DS-4:** the visible label plus a test.
  - **DS-1:** reword the comment; rows against the surfaces are optional.

### M2 · In Light, the lime fill is the only cue for selected and logged states (outside DS-1's diff)
- **Location:** `src/ui/Choice.tsx:9-10`; `src/features/today/TodayScreen.tsx:51-52`.
- **Defect:** The light-lime rule is tested on the palette, not on how components use it. Two shipped components tell states apart only by lime versus a neutral fill, at about 1.02–1.08:1 brightness difference.
- **Failure scenario:**
  - In Light, a selected Choice (`#CAFD00`) against an unselected one (`#EFEEE4`) is about 1.03:1.
  - On Today's week strip, a logged day (`#CAFD00`) against an unlogged one (`#E9E9DE`) is about 1.02:1.
  - DS-1's own matrix puts lime against light surfaces at 1.02–1.16:1.
  - A user with low vision or no colour vision can't tell these states apart, which fails WCAG 1.4.1 (Level A). It will show in the box 3 Light capture of Today.
- **Suggested fix:**
  - **DS-4 (Choice):** add a check mark or a ≥3:1 outline for the selected state.
  - **SC-3 (Today week strip):** add a check mark or a ≥3:1 ring for logged days.
  - This does not block merging DS-1.

### Low findings (can wait, each with an owner)
- **L1 · QA-2 · `docs/22-UI-MOMENTUM.md:192-195` and `:56`.** The correction needs to cover more than the "≥6.0" claim. Going by DS-1's own matrix:
  - "Secondary text ≥5.3" is false: light text measures 4.80 on `surfaceHighest` and 5.04 on `surfaceHigh`.
  - "Accent 16.7:1 on Dark cards" is false: it measures 14.64 on `surfaceContainer`.
  - "5.3:1 on Light cards" is false: it measures 4.81 and 5.04.
  - "Every on-container pair ≥6.0" also fails for `onPrimary` on `primary` (5.34 dark, 5.88 light) and light `dataStreak` on its container (4.80), not only the error pairs as `handoff.md:106-107` implies.
  - §1's "generated with material-color-utilities from seed" now holds for only 3 of 36 values.
- **L2 · whoever wires the guard (Codex to assign) · `no-literal-color.cjs:22-23,46-49,146-147`.** Named colours slip through in these cases:
  - `<MomentumAsset tint="white" />`, because `tint` is not treated as a colour prop (it's the only custom colour prop in the codebase, `MomentumAsset.tsx:6`).
  - Colours inside function calls, such as `withTiming('white')` or `interpolateColor(p, [0, 1], ['white', 'black'])`. This matters more now that DS-3 has put Reanimated on main.
  - An aliased import such as `PlatformColor as PC`.
  - Hex and `rgb()`/`hsl()`/`hwb()` colours are caught in any position, so the realistic bypass is closed.
  - Fix: treat names ending in `tint` as colour props, check the arguments of known colour helpers, and resolve import aliases.
- **L3 · QA-9 · `color-guard.test.ts:2`.** The test imports `@typescript-eslint/parser`, which `apps/mobile/package.json` (lines 60-61) does not declare. It resolves only because eslint-config-expo brings it in and the workspace uses `nodeLinker: hoisted` (`pnpm-workspace.yaml:6`). If that changes, the test fails loudly rather than silently. Declare the dependency.
- **L4 · DS-1 evidence · `docs/evidence/DS-1/scheme-search.mjs:32,35`.**
  - `catch { continue; }` silently skips any scheme class or colour that throws.
  - It only checks exact hex matches under the recipe's own role mapping.
  - So "no Material setting reproduces the palette" really means "under this mapping". The conclusion is credible, because Material's neutrals carry a yellow cast, but the wording should be narrowed.
- **L5 · DS-1, optional · `recipe.ts:256-273` and `generate-palette.ts:87-91`.** The three roles taken straight from the seed (light `primary`, `onPrimary`, `onPrimaryContainer`) have no recorded Material value. After a library upgrade, `--record` followed by `--write` changes them without naming them. `--check` still fails on the byte diff and the contrast tests are a backstop. Fix: have `--write` print the roles it changed.
- **L6 · DS-1, optional · `contrast.test.ts:114-121`.** The family-coverage test is built from fixed arrays and can only fail if someone edits `containerPairs`. Keep it, but don't count it as evidence.

## Box disposition

| Box | Inspected | Executed here | Disposition |
|---|---|---|---|
| 1. Palette regeneration and contrast | `recipe.ts`, `generate-palette.ts`, the recipe and palette JSON, `roles.ts`, `types.ts`, `contrast.ts`, the three palette/contrast tests, the evidence files | Nothing (UNRUN) | **Not met yet.** Generation and fail-closed design are sound in the source, but the matrix is incomplete (H1, M1). Codex should record the curated-palette decision. |
| 2. Lint guard | `no-literal-color.cjs` and its typings, `color-guard.test.ts`, `eslint.config.js` (branch and main), `test-design-rules.cjs`, `momentum-assets.ts`, `MomentumAsset.tsx` | Nothing (UNRUN) | **Open (partly met).** The older selector is wired. The new rule is not, and wiring it first needs the 26 fills on `momentum-assets.ts:2` dealt with. |
| 3. Android release capture | `release-capture.md` | Nothing to run | **Open.** Blocked on a release build and a device. |

## What I could confirm in the source, and what I couldn't

**Confirmed by reading:**
- **Recipe makeup:** 18 Material-derived roles; 33 curations (18 dark, 15 light); 3 roles straight from the seed; 9 aliases; 4 brand values per theme.
- **Values:** every pinned, brand and alias value equals `momentum.json`, and the four added roles match docs/22 §4.
- **Fail-closed:** a change of seed, scheme options or library version fails `--check`. Stale curations fail, and the three seed roles fail on the byte diff. `--write` refuses to write when there are problems.
- **Recipe validation:** it rejects unknown or missing keys, aliases of aliases, curations on aliases, and curations equal to the Material value.
- **CI path:** `test:ci` runs the real-library `--check` (`jest.config.cjs:3`; root `package.json:15-16`).
- **Test counts match the claims:** contrast 139 (119 + 8 + 1 + 1 + 1 + 9), guard 52, recipe 46 (including 17 malformed-recipe rejections), generator 6.
- **Guard exemptions:** limited to `src/theme/themes/**` and `src/**/__tests__/**`. Jest only picks up tests inside `__tests__`, so nothing else escapes.
- **"Only momentum-assets.ts would be flagged":** Grep agrees on both the branch and main. The 26 `fill="#…"` there are the only hex, `rgb()`-style or `PlatformColor` colours in non-test, non-theme source, and none of the common named colours I searched for appear in quotes.

**Not verifiable here (UNRUN):** `theme:generate` reporting no diff, the SHA-1, `tsc`, lint, Jest pass counts, mutations W and A to E, and the recorded Material values.

**Overstated:** "Box 1 met", "every action and coach pair is pinned", and the scope of the note to QA-2.

## Integration with DS-3 on main
- Main is at `35c84e3` (from `.git/logs/refs/heads/main:114`). I read main's files from its checkout's working tree, not from git objects, so a dirty tree could differ.
- DS-3 changed `WorkoutScreen.tsx`, `src/motion/**` and its own docs. DS-1 touches none of these, so the rebase should be clean (not run).
- Main's `eslint.config.js` and `jest.config.cjs` have the same content as DS-1's base.
- DS-3's `set-commit-feedback.test.tsx` uses the default ThemeProvider, so DS-1's four new roles don't break it.
- Wiring the new guard on main would still flag only `momentum-assets.ts`.

## Shortest path to finish locally
1. **Codex records decisions:** the curated palette (33 pins counted as "regenerates from seed"); the coach-outline choice, with conditions (a) to (d) added to DS-4's Done-when; how H1 is handled; and QA-2's wider scope from L1.
2. **Coordinator** commits the DS-1 working tree and rebases it onto `35c84e3`.
3. **On the rebased tree, run:**
   - frozen install
   - root `pnpm check`
   - `pnpm --filter @fitlog/mobile theme:generate`
   - `expo export --platform ios --platform android`

   Then merge it as DS-1 partial.
4. **Box 1** completes once the H1 matrix row exists, either as a known gap owned by DS-4 or after DS-4's fix. It's a small test edit but needs authorization.
5. **Box 2:** the assignee wires `colorGuardConfig()`. Before that, either DS-4 changes the asset generator so the fills use `currentColor` or theme roles, or `src/ui/momentum-assets.ts` gets a dated exemption with a named owner. Then run lint, break the wired rule once to see it fail, and add the assertion to `test-design-rules.cjs`.

## Real device blocker (box 3)
This environment has none of the following, and no JavaScript or web output can stand in:
- **A local Android release build:** JDK 17 and the Android SDK, then `expo prebuild` and `expo run:android --variant release`.
- **A reference device:** one matching PRD §23.1, with its model and OS recorded in QA-11's `devices.md`. `release-capture.md` asks for a device; whether an emulator is acceptable is Codex's call.
- **The Figma references:** file `wukPwvkAsdpqByti0HNdDs`, page 02, frame B-01 in Dark and Light, exported at 412 × 915. The node IDs aren't in docs/22 and must be read from the file.
