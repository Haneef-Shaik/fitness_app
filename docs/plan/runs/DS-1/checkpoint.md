# Checkpoint — DS-1 · Colour tokens and theme

attempt 1 + focus correction (review 2026-10-27T1605Z) + revision (review 2026-10-31) + records
correction (review 2026-11-01) + guard-wiring prerequisite (1 Nov 2026) · branch `codex/fitlog-ds1-theme`
(name kept as assigned) · base `c8a5d57` · **uncommitted by instruction** (the coordinator forbade commits)

**Status after the guard-wiring phase (1 Nov 2026):**
- 0 of 3 boxes are met.
- **Done in source, UNRUN, with no exemption:** the guard-wiring prerequisite. That covers the 26 SVG
  fills, now `currentColor` plus a typed role map, the L2 bypasses, and `colorGuardConfig()` wired into
  `eslint.config.js`.
- **Box 2** stays open until the wired guard is seen to fail (G1) in a permitted runtime.
- **Box 1 runtime and box 3** (the Android release capture beside Figma) stay open.
- No PASS, RED, GREEN, acceptance or Done is claimed. Details are at the end of this file and in
  `docs/evidence/DS-1/guard-wiring-2026-11-01.md`.

**Status before the guard-wiring phase:**
- Box 1 is **not met**, box 2 is **partly** met, and box 3 is **blocked**. The 1 Nov review
  (C0/H0/M1/L1) has 0 of 3 boxes met.
- The focus correction and its revision are source only and **UNRUN**. The 1 Nov review closed H1 and the
  31 Oct high finding in source only.
- The 1 Nov records correction changed comments and records only.
- Runtime proof, guard wiring and the Android release capture are all pending.
- No PASS, RED, GREEN, acceptance or Done is claimed.

## Steps done: attempt 1 (historical, 2026-10-27; results inherited, not re-run)

These results come from the attempt-1 run (final report `final-2026-10-27T0505Z.md`). The 1605Z and 31 Oct
reviews read them but did not execute them, and neither correction phase has re-run them.

1. **Contrast matrix (box 1, second half).** `src/theme/contrast.ts` (WCAG 2.2 luminance/ratio),
   `src/theme/roles.ts` (ordered role list, compiler-checked against `ThemeColors`), the four docs/22 §4
   roles missing from code (`dataGoldContainer`, `onDataGoldContainer`, `dataStreakContainer`,
   `onCoachContainer`) and `src/theme/__tests__/contrast.test.ts`. RED reported (missing module, then
   6 cases failing on `undefined` roles), then GREEN.
2. **Palette regeneration (box 1, first half).** `momentum.recipe.json`, the pure module
   `scripts/palette/recipe.ts`, a rewritten `scripts/generate-palette.ts` CLI (`--check` default,
   `--write`, `--record`, `--report`, `--candidate`), with `palette-recipe.test.ts` (pure, fake
   Material) and `palette-generator.test.ts` (end to end through tsx with the real library). RED
   reported (missing module; bootstrap `--check` refused 36 unrecorded pins), `--record` run once,
   then `--check` reported no diff and `--write` was byte-identical (SHA-1 `1275a7d…` before and
   after).
3. **Colour guard (box 2).** `scripts/lint-rules/no-literal-color.cjs` with typings and
   `color-guard.test.ts`. RED reported (missing module; then the message test), GREEN after. It is
   **not wired** into `eslint.config.js`, per the coordinator; the wiring request is in the handoff.
4. **Mutation checks**: five guards broken on purpose, each failing named tests, all restored
   (`docs/evidence/DS-1/mutation-checks.md`).
5. **Evidence and docs**: `docs/evidence/DS-1/` (palette regeneration, contrast matrix, mutation
   checks, release-capture steps), THEMING.md's generator section, and the handoff. The final focused
   gates reported in that run: mobile `tsc` clean; `pnpm lint` passes; `jest src/theme src/ui` 261
   passed; `theme:generate` reports no diff.

## Steps done: focus correction (27 Oct 2026; records finished 31 Oct 2026 after a sleep interruption)

**Authority:** the Codex AUTH-01 delegated decision allowed one bounded correction of review finding H1,
plus the M1 comment. **Tools:** Read, Grep, Edit and Write only, and none was denied. **Nothing was
executed:** no tests, type check, lint, mutation, install, build, network or commit.

1. **Tests authored first (UNRUN).**
   - `apps/mobile/src/ui/__tests__/app-button-focus.test.tsx` (new, 29 cases):
     - focus and blur in both themes × both variants, measured against the drawn fill at ≥ 3:1,
       with the box unchanged;
     - the 96 dp large action;
     - three groups of 8 for disabled and loading buttons. The revision rewrote them.
   - `contrast.test.ts`: +4 focus-ring rows (`onPrimaryContainer`/`primaryContainer` and
     `onSecondaryContainer`/`secondaryContainer`, both schemes, ≥ 3:1), 143 cases authored then. H1 is
     not pinned as a gap, and no threshold changed.
2. **Source (UNRUN).** In `apps/mobile/src/ui/AppButton.tsx` the ring was drawn in the label colour, with
   `focusVisible = focused && !unavailable`. **The revision superseded this.** The 31 Oct review found that
   the gate hid focus that React Native reports on disabled and loading buttons. (The earlier wording here,
   that such buttons still hold focus, is unverified on a device, per the 1 Nov review's M1.)
3. **M1.** The known-gap comment in `contrast.test.ts` now requires:
   - a visible text label (violet ink is not an identifier);
   - an independently identifiable interactive control, or a ≥ 3:1 boundary;
   - no state that depends on the outline.

   It also records the Codex decision preserving the palette and the 33 curated pins.
4. **Records:** `docs/evidence/DS-1/focus-correction-2026-10-27T1605Z.md` (new), the handoff and this
   checkpoint.

**Withdrawn.** This phase's claim that "21 of the 29 new UI cases should fail" against the previous
source, implying all 21 caught H1, is withdrawn, together with its planned F2 ("drop the unavailable
gate, expect 16"). The 31 Oct review found:
- only 4 of the 21 caught the 1.00:1 defect;
- 3 failed only on the exact ring colour;
- 14 failed because the old source showed a visible ring on unavailable buttons.

## Steps done: revision after the 31 Oct review (1 Nov 2026)

**Authority:** AUTH-01 owner delegation, under the review and merge freeze, for a bounded correction of
the 31 Oct review's finding 1 (high) and finding 2 (medium), with its lows 3 and 4. **Tools:** Read,
Grep, Edit and Write only, and none was denied. **Nothing was executed:** no tests, type check, lint,
mutation, install, build, network, status or commit.

1. **Source (UNRUN).** In `AppButton.tsx` the gate is removed:
   `borderColor: focused ? foreground : pressed ? colors.primary : background`.
   - A focused disabled or loading button now draws `onSurfaceVariant` on `surfaceHigh`.
   - Focus is not moved, and `focusable` is not set.
   - The palette, props, action blocking, layout, the 2 dp width and the pressed-only border are
     unchanged.
2. **Tests (UNRUN).**
   - `app-button-focus.test.tsx`: the three unavailable groups are rewritten, and the count stays at 29:
     - focus lands while unavailable;
     - focus persists from available to disabled or loading and back to available;
     - blur while unavailable.

     Each focused state is checked for fill, then ≥ 3:1, then the exact role, then the box. Blur removes
     the ring, and no layout changes. Unavailable focus and blur call the host's handlers directly,
     because `fireEvent` cannot reach a disabled host; that constraint is read in source.
   - `contrast.test.ts`: +2 focus-ring rows (`onSurfaceVariant`/`surfaceHigh`, both schemes), so 6
     focus-ring rows and 145 cases are authored.
3. **Records.**
   - The focus evidence is rewritten.
   - `contrast-matrix.md`: the count line is resolved (139 inherited, 145 authored) and the six focus-ring
     rows are added.
   - The handoff and this checkpoint are updated.
   - Corrected along the way:
     - the 21 and old F2 claims are withdrawn everywhere;
     - the predictions are recounted;
     - the ring-against-surface range is recorded with attribution;
     - the light-lime count is corrected from 8 to 9;
     - the GOALS statement is corrected (main already carries DS-4's contract, per the coordinator).

### Predictions for the revised tests (UNRUN; reasoned, not observed)

- **Revised source:** all 29 UI and 145 contrast cases pass.
- **F1, the source before either correction:** 29 of 29 fail.
  - 4 detect H1's 1:1 ring: available Dark primary, Dark large, and Dark primary disabled and loading in
    the "focus persists" group.
  - 25 fail only on the exact-colour policy, against a ring that was visible. They include all 16
    "lands while unavailable" and "blur while unavailable" cases.
- **F2, reintroduce the unavailable gate:** 24 fail, all of them unavailable cases, each at ≥ 3:1 with a
  received ratio of 1. The 5 available and large cases pass.
- **F3, border width only while focused:** 29 of 29 fail, at a border-width or box assertion.

## Steps done: records correction after the 1 Nov review (1 Nov 2026)

**Authority:** AUTH-01, a bounded correction of the 1 Nov review's M1 and L1, plus its two wording
obligations. **Tools:** Read, Grep, Edit and Write only, and none was denied. **Nothing was executed:** no
tests, type check, lint, mutation, install, network, DB, git or commit.

1. **M1: comments only, logic unchanged.**
   - The comments in `AppButton.tsx` (above the ring expression), `app-button-focus.test.tsx` (file
     header and the native-focus helper) and `contrast.test.ts` (the focus-ring pairs) now say the same
     thing:
     - RN's JS layer keeps the button focusable and forwards focus (`Pressable.js:258`,
       `Pressability.js:433-444`);
     - RN Android forwards `disabled` (`Pressable.js:235-236`, `View.js:94-99`) and disables the native
       view (`BaseViewManager.java:387-389`);
     - so device focus on a disabled or loading button is **unverified**, and the tests model *reported*
       focus.
   - Ring logic, `disabled`/`accessibilityState` props, test logic, titles and assertions, palette and
     contracts are unchanged.
2. **M1: records.** The same correction is made in the focus evidence, `contrast-matrix.md`'s focus-ring
   section, the handoff and this checkpoint. The inferences that Android would move focus mid-save, or
   necessarily keeps focus, are withdrawn. They came from the 31 Oct review, which stays verbatim.
   `final-2026-11-01-collected.md:23` stays verbatim and is superseded by this correction.
3. **L1.** In the focus evidence, "never show the pressed border" is replaced. A quick tap can keep
   `pressed` briefly after loading starts, until the deferred press-out: 130 ms or less according to the
   source, not timed on a device.
4. **Wording obligations.**
   - `docs/THEMING.md:82-84` now names what the matrix measures and what it does not prove.
   - `contrast-matrix.md`'s known-gap section records the Codex decision. Curated violet is decoration
     only and not accessibility evidence, under conditions (a) to (c), which are DS-4's. The attempt-1
     sentence counting violet ink as an identifier is withdrawn.

## Next step before the guard-wiring phase (superseded: see "Next step (resume here)" at the end)

1. **Authorized runtime phase** in `apps/mobile`:
   - `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm exec jest --runInBand src/theme src/ui` (predicted
     29 of 29 and 145 of 145) and `pnpm theme:generate`, then root `pnpm check`;
   - mutations F1, F2 and F3, exactly as written in the focus evidence. Apply each alone, record it
     against its prediction above, and restore it (empty diff on `AppButton.tsx`). Build F1 from
     `c8a5d57:apps/mobile/src/ui/AppButton.tsx`, or confirm the written expression matches it.
2. **An independent review of the runtime results.** The source-only review was done on 1 Nov, and its
   M1 and L1 are corrected in records.

   Box 1 can be reconsidered only after both steps. Neither is done.
3. **DS-1 work before DS-4 starts (no circular wait):**
   - resolve the guard-wiring prerequisite, `src/ui/momentum-assets.ts` (26 fills): a dated,
     owner-named exemption or an authorized DS-1 asset change;
   - then wire `colorGuardConfig()`, including the L2 bypasses, and see it fail once (box 2).
4. **Later DS-1 wording:** the L4 evidence wording. `docs/THEMING.md:82-84` and `contrast-matrix.md`'s
   known-gap section were corrected on 1 Nov, and `contrast-matrix.md:8` is resolved. L5 and L6 are
   deferred and optional.
   - Recorded, not scheduled: whether a device gives or keeps focus on a disabled or loading AppButton
     is unverified. No Done-when box depends on it.
5. **Box 3:** an Android release capture beside Figma page 02. Blocked on a release build and device;
   the steps are in `docs/evidence/DS-1/release-capture.md`.
6. Root `pnpm check` and the native export at integration.

**Owned elsewhere** (recorded in the handoff):
- M2: DS-4 (Choice) and SC-3 (Today week strip);
- L1: QA-2;
- L3: QA-9;
- what remains of M1: DS-4 (the proposal card's visible label, interactivity and tests). The coordinator
  states that main's GOALS.md already carries the contract. This worktree's GOALS.md is a stale older
  copy and is not edited.

## Surprises

- No Material setting reproduces the approved palette. Searched 9 variants × 2 specs × 2 platforms ×
  5 contrast levels; the best is the documented Vibrant 2025 phone 0, with 3 of 36 base roles. The
  palette is curated, so the recipe records 33 pins and the Material value each replaces.
- material-color-utilities 0.4.0 has an extensionless ESM import, so it loads only under tsx and not
  under plain Node ESM or Jest. The real-library test therefore runs the CLI in a child process.
- The light coach outline `#9B7BFF` on `#EFEEE4` measures 2.70:1, below the 3:1 non-text bar. It stays
  pinned as a known gap. Codex decided (AUTH-01) to keep it, under conditions (a) to (c).
- `src/ui/momentum-assets.ts` embeds dark-palette hex fills in 26 SVG strings. The wired guard misses
  them; the new rule flags exactly these 26 and nothing else in `src/`.
- **Self-review missed H1.** In Dark, `primary` and `primaryContainer` are both `#CAFD00`, so the old
  focus border was invisible on primary buttons. The matrix tested lines only on surfaces, so it could
  not see this.
- **The first correction regressed.** Gating the ring on availability hid focus that React Native reports
  on disabled and loading buttons, where the old source had shown a ring. Its records also overstated
  H1 detection (21 claimed, 4 actual). The 31 Oct review found both.
- **RNTL's `fireEvent` drops events on a disabled Pressable**, but Pressability forwards focus and blur
  regardless. For unavailable buttons the focus test calls the host's handlers directly. This was read
  in the source, not run.
- **The JS layer is not the device (1 Nov review, M1).** "Focusable, and forwards focus" is true of RN's
  JS layer. RN Android disables the native view (`BaseViewManager.java:387-389`), so device focus on a
  disabled or loading button is unverified. The records had stated it as read in source.

## Steps done: guard-wiring prerequisite (1 Nov 2026)

**Authority:** AUTH-01 owner delegation, for one bounded checkpoint phase that closes the DS-1
guard-wiring and 26-SVG-fill prerequisite with no exemption and no DS-4 dependency.
`apps/mobile/eslint.config.js` and `scripts/test-design-rules.cjs` were assigned to this phase; DS-2 is
stopped. **Tools:** Read, Grep, Edit and Write only, and none was denied. **Nothing was executed:** no
tests, type check, lint, mutation, install, build, export, network, DB, git or commit. Reviews read
first: `review-2026-10-27T1605Z-collected.md` (L2) and `review-2026-11-01-collected.md` (box 2's
obligations).

1. **Tests authored first (UNRUN).**
   - `color-guard.test.ts`: 52 → 101 cases.
     - +34 standalone L2 cases: 20 rejections, the alias message, the output-range count and 12
       scope or non-colour negatives.
     - +15 effective-config cases, which load the real `eslint.config.js` and run only the guard and
       the shared selector. Removing the wiring fails 10 of them.
   - New `src/ui/__tests__/momentum-asset.test.tsx`, 145 cases:
     - no hardcoded colour;
     - byte-identical to each raw Figma export apart from its one fill;
     - Dark role value equals the export's fill;
     - the 7 design Light exports equal the role's Light value;
     - the exhaustive role map;
     - role, tint precedence and size in both schemes.
2. **Guard (UNRUN).** `no-literal-color.cjs` adds:
   - `tint` and `…Tint` colour props;
   - Reanimated `withTiming`/`withSpring` targets (strings only) and `interpolateColor`'s output range
     (strings and numbers), resolved through the file's import bindings;
   - aliased, namespace and computed `PlatformColor`/`DynamicColorIOS`.

   Exemptions and exports are unchanged.
3. **Wiring (UNRUN).**
   - `eslint.config.js` appends `colorGuardConfig()`. The typography/radius selector, and the older
     colour selector, are kept.
   - `test-design-rules.cjs` asserts the guard's rule id against the effective config, and all four
     typography/radius keys.
4. **Assets (UNRUN).**
   - All 26 were inspected: each is monochrome with one non-`none` fill, so none was stopped.
   - Each path fill is now `currentColor`, with geometry, `viewBox`, keys, ids, opacity and the root
     `fill="none"` unchanged. Grep finds 0 hex values left.
   - `momentumAssetRoles` (`satisfies Record<MomentumAssetName, ColorRole>`) uses the instructed
     mapping. The only untinted callsite that sets its own background, Today's hero card, confirms
     `onPrimaryContainer`. No callsite showed a more precise role, so none was changed.
   - `MomentumAsset` draws `tint ?? theme.colors[role]` and passes the XML unchanged. The render-time
     `.replace` and the dead `…Light` lookup are removed, and the props are unchanged.
5. **Records:** `docs/evidence/DS-1/guard-wiring-2026-11-01.md` (new), this section and the handoff's
   appended section.

### Predictions (UNRUN; reasoned, not observed)

- **Source as written:** 101 color-guard, 145 momentum-asset and the design-rules script pass.
- **G1, remove the wiring:** `pnpm lint` fails at the design-rules guard assertion, and color-guard
  fails 10.
- **G2, restore one hex fill:** momentum-asset fails 2, color-guard fails 1, and lint reports 1.
- **G3, drop `tintKey`:** standalone fails 4, effective fails 1, and the script fails.
- **G4, match Reanimated by callee name, ignoring bindings:** at least the 4 scope negatives fail.
- **G5, default colour back to `onSurface`:** momentum-asset fails 46.

## Next step (resume here)

1. **Authorized runtime phase** in `apps/mobile`. Follow the recipe in
   `docs/evidence/DS-1/guard-wiring-2026-11-01.md` §5:
   - `pnpm exec tsc --noEmit`, `pnpm lint`, the two named suites (101 and 145), then
     `pnpm exec jest --runInBand src/theme src/ui` and `pnpm theme:generate`;
   - **G1 seen to fail (box 2)**, then G2 to G5, each restored to an empty diff;
   - the effective negative probe and the both-platform `expo export`;
   - the focus mutations F1 to F3 still pending from earlier phases (see the superseded next step
     above, item 1);
   - root `pnpm check` at integration.
2. **An independent review** of this phase's source, then of the runtime results.
3. **At the rebase onto main:** run `pnpm lint` over DS-3's `src/motion/**`. The L2 positions may report
   a named-colour Reanimated target there; fix it at the callsite, with no exemption.
4. **Box 3:** the Android release capture beside Figma page 02 (`release-capture.md`). It is still
   blocked on a release build and a device.
5. **Later DS-1 wording:** L4, and `docs/THEMING.md:105-108`, which still says the guard is not wired.
   L5 and L6 stay optional.

## Surprises (guard-wiring phase)

- **The design also exported unbundled `…Light.svg` files** for 7 of the bundled assets. All 7 Light
  fills equal the same role's Light value, so the same-role Light rule matches the design wherever the
  design recorded a Light colour. They are now a test reference, and no hex is written in the test.
- **The member tab bar was the latent Light defect.** Its untinted icons drew Dark-palette fills in
  Light. With roles they now draw the Light values that the design's Light exports show. Dark is
  unchanged.
- **`ruleFilter` works in `Linter#verify`** (ESLint 9.39) but is not in `Linter.LintOptions`' type. The
  effective-config test passes it through a non-literal options object instead of a cast.
- **ESLint's `ESLint` class loads `eslint.config.js` with a native `import()`**, which Jest's VM does not
  support. The Jest test therefore loads the config with `jest.requireActual` and uses `Linter`, and
  `test-design-rules.cjs` covers the same wiring under Node.


## Guard prerequisite independent source review closed — 2026-11-01T10:47:47.268809+00:00

Complete review C0/H0/M0/L0 accepted by Codex in source only. See `docs/evidence/DS-1/guard-source-accepted-2026-11-01T1045Z.md` and verbatim review/audit. Reviewer6a95ddd3 stopped. All runtime/mutation/export/release gates remain UNRUN,0/3boxes; no new source or wording loop. The existing runtime recipe is pending and does not authorize retry of a denied sequence.
