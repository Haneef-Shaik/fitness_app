# DS-1 · Guard wiring and the 26 SVG fills (1 Nov 2026)

**Phase.** One bounded checkpoint phase under AUTH-01 owner delegation. It closes the DS-1 guard-wiring
prerequisite: the 26 literal fills in `src/ui/momentum-assets.ts` (handoff "Guard sequencing"), the L2
bypasses from the review of 2026-10-27T1605Z, and the wiring of `colorGuardConfig()` into the app's
ESLint config. It adds **no exemption** and creates **no DS-4 dependency**.

**Ownership.** `apps/mobile/eslint.config.js` and `apps/mobile/scripts/test-design-rules.cjs` were
assigned to this DS-1 phase only. DS-2 is stopped, and there is no concurrent writer.

**Tools and execution.** The tools were Read, Grep, Edit and Write, and none was denied. **Nothing was
executed:** no tests, type check, lint, mutation, install, build, export, network, database, git or
commit. Every test and source change below is **UNRUN**. Counts and outcomes are authored or predicted,
not observed. No screenshot or native visual check is claimed.

## Changed paths (this phase only)

| Path | Change |
|---|---|
| `apps/mobile/scripts/lint-rules/no-literal-color.cjs` | L2 closure: `tint` props; Reanimated colour arguments resolved through import bindings; aliased, namespace and computed `PlatformColor`/`DynamicColorIOS`. Exports unchanged, so `.d.cts` is unchanged. |
| `apps/mobile/eslint.config.js` | `colorGuardConfig()` appended (lines 3, 25-26). The `no-restricted-syntax` block, including the typography/radius selector, is unchanged. |
| `apps/mobile/scripts/test-design-rules.cjs` | Asserts the stronger rule id against the effective config. It now checks all four typography/radius keys, not two. |
| `apps/mobile/src/ui/momentum-assets.ts` | 26 fills `#…` → `currentColor`; a header comment; `MomentumAssetName`; the typed `momentumAssetRoles` map. |
| `apps/mobile/src/ui/MomentumAsset.tsx` | `color = tint ?? theme.colors[momentumAssetRoles[name]]`; the XML is passed unchanged. The render-time `.replace` and the unused `…Light` lookup are removed. |
| `apps/mobile/src/theme/__tests__/color-guard.test.ts` | +34 standalone L2 cases and +15 effective-config cases. |
| `apps/mobile/src/ui/__tests__/momentum-asset.test.tsx` | New, 145 cases. |
| `docs/evidence/DS-1/guard-wiring-2026-11-01.md` | This file. |
| `docs/plan/runs/DS-1/checkpoint.md`, `handoff.md` | Phase sections appended. |

No other path changed. The palette, tokens, screens, layouts, AppButton, focus code, `package.json`,
the lockfile, the raw exports in `assets/momentum/`, GOALS, status and acceptance are untouched.

## 1 · The guard (L2), as implemented

`no-literal-color.cjs` keeps all of attempt 1's detection. These are the additions:

- **`tint` props.** `isColorName` also accepts `tint` exactly, or a camelCase name ending in `Tint`
  (`/^tint$|Tint$/`). So `<MomentumAsset tint="white" />`, `iconTint="red"`, `{ tint = "black" }` and
  `{ tint: \`navy\` }` are colour positions. `stint` and `<BlurView tint="dark" />` are not flagged:
  only CSS named colours are checked by position.
- **Reanimated colour arguments.** A call counts only when its callee resolves, through
  `sourceCode.getScope(call)` and the scope chain, to an `ImportBinding` from
  `react-native-reanimated`. That covers a named or aliased import (`withTiming as tween`), and dot or
  static computed access on a namespace or default import (`R.withSpring`, `R['interpolateColor']`).
  - `withTiming` and `withSpring`: argument 0 is a colour position for **strings only**. A number there
    is an ordinary animation target.
  - `interpolateColor`: argument 2, the output range, is a colour position for strings **and** numbers.
    The input range is not.
  - Wrappers pass through as before: `withDelay(100, withTiming('white'))`, and a conditional target.
- **Palette bypasses.** `PlatformColor`/`DynamicColorIOS` are still caught by name, as in attempt 1
  (`PlatformColor(…)`, `x.PlatformColor(…)`, `x[PlatformColor](…)`). Two additions:
  - `x['PlatformColor'](…)` and x[`DynamicColorIOS`](…);
  - an alias bound to react-native's export (`import { PlatformColor as PC }`), reported under the real
    name ("PlatformColor() bypasses…").
- **Not followed (bounded, by instruction):**
  - a value that reaches a colour helper through a variable not named as a colour;
  - wrappers or re-exports of the Reanimated helpers in other modules;
  - same-named functions that are local, parameters, declared variables or imported from another module.
- **Unchanged:** the files (`src/**/*.{js,jsx,ts,tsx,mjs,cjs}`) and the only exemptions
  (`src/theme/themes/**`, `src/**/__tests__/**`). There is no file or line exemption for the assets.

## 2 · Wiring

- `eslint.config.js` requires `colorGuardConfig` and appends it as the last block.
- The older `no-restricted-syntax` colour selector is **kept**. It still reports a hex string at the
  start of a literal in `src/` outside `src/theme/**`, so such a literal now gets two reports. It also
  catches malformed hex strings (`#12345`) that the new rule deliberately treats as non-colours.
  Removing it belongs to that array's owner (DS-2/G14), and coverage is not reduced here.
- `test-design-rules.cjs` loads the real config through `new ESLint()`, as `pnpm lint` does. It asserts:
  - 4 typography/radius reports (`fontSize`, `lineHeight`, `fontFamily`, `borderRadius`) on the shared
    selector;
  - 1 `fitlog-colors/no-literal-color` report for `#ffffff`;
  - 1 guard report each for five fixtures that only the wired guard catches: a template literal, a
    MomentumAsset `tint="white"`, an aliased Reanimated target, an aliased `PlatformColor`, and a hex in
    `src/theme/` outside `themes/`;
  - 0 guard reports in the palette and test exemptions;
  - severity 2 for the guard on `src/ui/momentum-assets.ts` and `src/ui/MomentumAsset.tsx`, through
    `calculateConfigForFile`;
  - 0 reports from either rule for semantic tokens.

  Removing `colorGuardConfig()` makes the first guard assertion fail.

## 3 · Assets

**Inspection (Read/Grep on the bundled strings and the raw exports).** All 26 assets have the same
shape: a root `<svg … fill="none">`, one `<g id=…>` (only Cookie12 also has `opacity="0.08"`), and one
`<path id="glyph|shape" d=… fill="#XXXXXX"/>`. There is no stroke, gradient, style element or second
paint. **All 26 are monochrome, and no asset was stopped.**

**Change.** In each bundled string, only `fill="#XXXXXX"` on the path became `fill="currentColor"`.
Keys, order, `viewBox`, `width`/`height`, group ids, opacity, path ids, `d` data and the root
`fill="none"` are byte-for-byte unchanged. Afterwards Grep finds 26 × `fill=\"none\"`, 26 ×
`fill=\"currentColor\"` and 0 hex values in the file. The raw exports in `apps/mobile/assets/momentum/`
keep their original fills as provenance: they are outside `src/`, not imported and not bundled.

**Roles.** `momentumAssetRoles` is `as const satisfies Record<MomentumAssetName, ColorRole>`
(`ColorRole = keyof ThemeColors`). So a missing, extra or misspelt asset, or a non-role, fails the type
check. Every Dark role value equals the original fill, so Dark looks exactly as before.

| Asset | Group id · size | Original fill | Role | Dark | Light | Design's Light export | Callsite |
|---|---|---|---|---|---|---|---|
| imgNotifications | notifications · 24 | ACABA4 | onSurfaceVariant | ACABA4 | 65655E | none | none |
| imgCookie12 | Cookie12 (opacity 0.08) · 280 | 495E00 | onPrimaryContainer | 495E00 | 495E00 | 495E00 ✓ | Today hero `Card tone="accent"` (`primaryContainer` fill; its text is `onPrimaryContainer`), so the role is confirmed |
| imgPlayArrowFill | play_arrow-fill · 24 | CAFD00 | primaryContainer | CAFD00 | CAFD00 | none | none |
| imgCookie9 | Cookie9 · 76 | 495E00 | onPrimaryContainer | 495E00 | 495E00 | none | none |
| imgFitnessCenter | fitness_center · 38 | CAFD00 | primaryContainer | CAFD00 | CAFD00 | CAFD00 ✓ | none |
| imgClover4 | Clover4 · 60 | 0E0F0A | surface | 0E0F0A | FEFCF4 | none | none |
| imgSportsGymnastics | sports_gymnastics · 30 | CAFD00 | primaryContainer | CAFD00 | CAFD00 | none | none |
| imgSunny | Sunny · 50 | 495E00 | onPrimaryContainer | 495E00 | 495E00 | 495E00 ✓ | none |
| imgCheck | check · 22 | 516700 | onPrimary | 516700 | FFFFFF | none | none |
| imgTrophyFill | trophy-fill · 20 | 414B24 | secondaryContainer | 414B24 | DCE8B4 | none | none |
| imgIconHomeFill | icon/home-fill · 24 | CAD6A3 | onSecondaryContainer | CAD6A3 | 4C562E | 4C562E ✓ | member Today tab (untinted); gym Today tab (tinted) |
| imgIconExercise | icon/exercise · 24 | ACABA4 | onSurfaceVariant | ACABA4 | 65655E | 65655E ✓ | member Train tab (untinted) |
| imgIconRestaurant | icon/restaurant · 24 | ACABA4 | onSurfaceVariant | ACABA4 | 65655E | 65655E ✓ | member Food tab (untinted) |
| imgIconMonitoring | icon/monitoring · 24 | ACABA4 | onSurfaceVariant | ACABA4 | 65655E | 65655E ✓ | member Progress tab (untinted) |
| imgIconCardMembership | icon/card_membership · 24 | ACABA4 | onSurfaceVariant | ACABA4 | 65655E | none | none |
| imgHistory | history · 24 | FBF9F1 | onSurface | FBF9F1 | 383833 | none | none |
| imgRemove | remove · 26 | FBF9F1 | onSurface | FBF9F1 | 383833 | none | none |
| imgAdd | add · 26 | FBF9F1 | onSurface | FBF9F1 | 383833 | none | none |
| imgCalendarMonth | calendar_month · 18 | ACABA4 | onSurfaceVariant | ACABA4 | 65655E | none | none |
| imgSearch | search · 24 | ACABA4 | onSurfaceVariant | ACABA4 | 65655E | none | none |
| imgIconHome | icon/home · 24 | ACABA4 | onSurfaceVariant | ACABA4 | 65655E | none | none |
| imgGymGroups | groups-fill · 24 | ACABA4 | onSurfaceVariant | ACABA4 | 65655E | none | gym Members tab (tinted) |
| imgGymRupee | currency_rupee · 24 | ACABA4 | onSurfaceVariant | ACABA4 | 65655E | none | gym Money tab (tinted) |
| imgGymVisits | qr_code_scanner · 24 | ACABA4 | onSurfaceVariant | ACABA4 | 65655E | none | gym Visits tab (tinted) |
| imgGymMore | more_horiz · 24 | ACABA4 | onSurfaceVariant | ACABA4 | 65655E | none | gym More tab (tinted) |
| imgArrowBack | icon/arrow_back · 24 | FBF9F1 | onSurface | FBF9F1 | 383833 | none | FreezeScreen back (tint `onSurface`) |

**Role choices.** Every role is the instructed mapping by original fill. The only callsite that sets
its own background, the Today hero, confirms `onPrimaryContainer`. No callsite shows a more precise role,
so none was changed. Light values come from `momentum.json`'s Light scheme for the same role.

The design also exported unbundled `…Light.svg` files for 7 bundled assets. All 7 Light fills equal the
same role's Light value, so the same-role rule matches the design's Light intent wherever the design
recorded it. (`imgSunny1Light.svg` has no bundled base and is ignored.)

**MomentumAsset.**
- The source is `color={tint ?? theme.colors[momentumAssetRoles[name]]}`, with `xml={momentumAssets[name]}`
  unchanged and `width = height = size ?? theme.dimensions.icon`.
- The public props `{ name: keyof typeof momentumAssets; size?: number; tint?: ColorValue }` are
  unchanged.
- The old `${name}Light` lookup is removed. No asset key ends in `Light`, so the lookup was dead, and
  the roles now carry the scheme. A test pins that no key ends in `Light`.
- `fill="currentColor"` together with the SVG's `color` is the mechanism the tinted callsites already
  used, after the old render-time `.replace`. It is not newly introduced.

**Visible effect (reasoned, not observed on a device).**
- **Dark:** unchanged everywhere.
- **Light, tinted callsites** (gym tabs, the Freeze back arrow): unchanged.
- **Light, Today hero cookie:** unchanged (`#495E00` before and after).
- **Light, member tab bar** (untinted): the icons now draw their Light roles instead of the Dark
  palette's fills:
  - Home: `#4C562E`, was `#CAD6A3`;
  - Train, Food and Progress: `#65655E`, was `#ACABA4`.

  These equal the design's Light exports. The handoff's latent "dark-mode colours in Light" note is
  resolved in source.

## 4 · Authored tests (all UNRUN)

| File | Cases | What they pin |
|---|---|---|
| `color-guard.test.ts` | **101** authored (52 inherited + 49 new) | **Standalone, +34:** 20 L2 rejections (tint ×4; Reanimated ×11, covering named, conditional, static template, nested, both output-range kinds, alias, namespace, computed and default-import; aliased, namespace, computed and template-member PlatformColor/DynamicColorIOS ×5), one test that the alias names the real API, one test that both output-range colours are reported, and 12 negatives (numeric targets and configs, non-colour strings, theme roles in an output range, numeric `interpolate`, a same-named local function, a parameter shadow, a declared variable, another module's helper, a non-colour `tint`, `stint`, an alias of `Platform`, a bypass-named alias from another module). The scope negatives each sit beside a real Reanimated or react-native import, so the binding path runs, not the no-import shortcut. **Effective config, +15:** one wiring test (exactly one block, `files` and `ignores` equal to the rule's, `'error'`, the same plugin object); 9 rejections through `eslint.config.js` that the older selector misses (the older selector reports `[]` for each), including a hex inside SVG markup at `src/ui/momentum-assets.ts` itself; 2 exemptions; 4 typography/radius reports kept; and the real `momentum-assets.ts` and `MomentumAsset.tsx` passing with no exemption. |
| `momentum-asset.test.tsx` (new) | **145** | Manifest keys and order (1); no `…Light` keys (1); no hardcoded colour per asset (26); byte-identical to the Figma export apart from the one fill (26); Dark role value equals the export's fill (26); the 7 Light exports are found (1) and each equals the role's Light value (7); the role map is exhaustive and valid (1); untinted role colour, unchanged XML and default icon size in both schemes (52); tint precedence with unchanged XML (2); explicit size with the role colour (2). |
| `scripts/test-design-rules.cjs` | 1 script, 13 assertions | Section 2. Runs inside `pnpm lint`. |

The test files hold no palette hex for assets. Expected colours come from the raw exports and from
`momentum.json`. `react-native-svg`'s `SvgXml` is mocked to capture props, so native drawing is not
exercised.

### Predictions (UNRUN; reasoned from source, not observed)

- **Source as written:** all 101, all 145 and the design-rules script pass.
- **G1, remove `colorGuardConfig()` from `eslint.config.js` (box 2 "seen to fail"):**
  - `test-design-rules.cjs` fails at its first guard assertion, so `pnpm lint` exits non-zero;
  - `color-guard.test.ts` fails 10: the wiring test and the 9 effective rejections;
  - the exemption, typography and real-file cases still pass, and the standalone 86 are unaffected.
- **G2, restore one original hex fill (for example `imgCheck`):**
  - momentum-asset fails 2: that asset's "no hardcoded colour" and "byte-identical";
  - color-guard fails 1: real `momentum-assets.ts`;
  - `pnpm lint` reports 1 `fitlog-colors/no-literal-color`.
- **G3, drop `tintKey`:** standalone fails 4 (the tint rejections), effective fails 1, and the
  design-rules script fails.
- **G4, match Reanimated by callee name, ignoring bindings:** the 4 scope negatives fail (local
  function, parameter shadow, declared variable, other module's helper). The aliased, namespace and
  computed rejections can fail too, depending on how the name match is written.
- **G5, revert MomentumAsset's default colour to `theme.colors.onSurface`:**
  - 44 "without a tint" cases fail: 22 non-`onSurface` assets × 2 schemes;
  - the 2 explicit-size cases fail on colour;
  - the other 99 cases in that file still pass.

## 5 · Recipe for a later, permitted runtime (not run here)

From `apps/mobile`, after a frozen install:

1. `pnpm exec tsc --noEmit`, expecting a clean run. This covers `momentumAssetRoles`'s `satisfies`, the
   JSON import, and `jest.fn<null, [SvgXmlProps]>`.
2. `pnpm lint`. Expect ESLint to report 0 problems. The design-rules script prints
   `Design rules verified: raw visual values fail; fitlog-colors/no-literal-color is wired; semantic tokens pass.`
3. `pnpm exec jest --runInBand src/theme/__tests__/color-guard.test.ts src/ui/__tests__/momentum-asset.test.tsx`.
   Expect 101 and 145. Then `pnpm exec jest --runInBand src/theme src/ui`, which also covers the
   unchanged focus and contrast suites (29 and 145 predicted earlier).
4. **Box 2, seen to fail (G1).**
   - Delete the `colorGuardConfig(),` line, and its comment, from `eslint.config.js`.
   - Run `pnpm lint`. Expect an `AssertionError` naming `fitlog-colors/no-literal-color`.
   - Run the color-guard file. Expect 10 failures (the wiring test and the 9 effective rejections).
   - Restore, and confirm an empty diff on `eslint.config.js`.
5. **Effective lint negative fixture.**
   - Create `src/ui/__guard_probe__.tsx` with:
     `import { withTiming as tween } from 'react-native-reanimated'; export const probe = { tint: 'white', go: () => tween('black') };`
   - Run `pnpm exec eslint src/ui/__guard_probe__.tsx`. Expect 2 `fitlog-colors/no-literal-color` errors.
   - Delete the probe.
6. G2 to G5, one at a time, each restored to an empty diff.
7. **Both-platform export:** `pnpm exec expo export --platform ios --platform android --output-dir dist-verified`.
   It must succeed for both platforms, and `dist-verified/` is ignored by lint.
8. Root `pnpm check` at integration.
9. **Native visual check (not claimed here):** the member tab bar and Today in Light and Dark on a
   device, with box 3's Android release capture.

## 6 · Unresolved findings and notes

1. **Lime glyphs in Light (for DS-4 when it adopts them).** `imgPlayArrowFill` and
   `imgSportsGymnastics` have no callsite and no Light export. Their role, `primaryContainer`, is lime
   in Light, which reads only on a dark or tonal tile (the light-lime-as-container rule).
   `imgFitnessCenterLight.svg` shows the design keeping lime in Light for that glyph. Choose per callsite.
2. **Integration risk.** The stronger guard and its L2 positions now run over all of `src/`. DS-3's
   `src/motion/**` on main was not read: it is another checkout and out of scope. After the rebase,
   `pnpm lint` may report a named-colour Reanimated target there. Fix any such report at its callsite;
   do not exempt it.
3. **The older colour selector stays** (section 2). A hex string in `src/` outside `src/theme/**` gets
   two reports. Removing the selector is for the owner of `no-restricted-syntax`.
4. **The Jest effective-config block loads `eslint-config-expo`'s plugins inside Jest.** If one cannot
   load, that block fails in `beforeAll` while the standalone tests still run. The same assertions run
   under Node in `test-design-rules.cjs`. `ruleFilter` is honoured by `Linter#verify` (ESLint 9.39
   `linter.js:832`) but is missing from the `Linter.LintOptions` type. It is passed in a non-literal
   options object, with no cast.
5. **L3 (QA-9).** The undeclared `@typescript-eslint/parser` is still recorded. No dependency or lockfile
   edit was made.
6. **Stale wording outside this phase's paths.** `docs/THEMING.md:105-108` still says "Until it is wired
   into `eslint.config.js`, the older selector there guards…". It also does not list the L2 positions
   (tint, Reanimated, aliases) or the asset roles. This is a later DS-1 wording item; THEMING.md was not
   an allowed path.
7. **Not verified:** native rendering, screenshots, web and both-platform export. Every gate is UNRUN.
