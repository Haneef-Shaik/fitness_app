# Handoff — DS-2 · Type ramp and fonts        attempt 1 · `codex/fitlog-ds2-type` · HEAD `c8a5d57` + uncommitted working tree

**Outcome claimed.** Words, figures and Hindi each have a tested, licensed typeface and the full Momentum
ramp in the tokens. Every bundled font, including a transitive icon font found during this attempt, has
its shipped licence in the repo and in the in-app licences data. The Android release-build proof at
100% and 200% (box 3) is **not** done: no device or release build was available, so box 3 is blocked.

**Not claimed.** No commit, status, acceptance-ledger, GOALS.md, activity or tracker change. Not
verified and not Done. No push, deploy, account, payment, message or provider call. No user,
personal or health data path was touched: the diff is typography tokens, tests, licence data and
evidence only.

## Files changed (all uncommitted)

| File | Change |
|---|---|
| `apps/mobile/src/theme/tokens.ts` | Typography section only. Removes `fontFamilies`, `fontWeights`, `typeRamp` (theme.ts was their only user). Adds `FontWeightToken`, `FontRole`, `fontFiles`, `TypeToken`, `typeScale` (24 steps), `typeAliases`, `platformType`, `fontScaling`, `devanagariLineHeightRatio` and `lineHeightGrid`. Keeps `hindiFonts`, now derived, for `AppText` |
| `apps/mobile/src/theme/typography.ts` | New: `fontFamilyFor`, `nearestBundledWeight`, `maxFontSizeMultiplierFor`, `effectiveFontScale` and `createTypography` (Latin, Devanagari and caps, each with the 7 legacy aliases) |
| `apps/mobile/src/theme/theme.ts` | Narrow change: the typography block becomes `typography`, `devanagariTypography` and `maxFontSizeMultiplier`. Colours untouched |
| `apps/mobile/src/theme/index.ts` | Exports `fontLicences`, `effectiveFontScale` and the `FontLicence`, `TextStyleToken` and `TypeVariant` types |
| `apps/mobile/src/theme/font-licences.ts` | New: the in-app licence registry (4 fonts) |
| `apps/mobile/assets/licenses/material-symbols-Apache-2.0.txt` | New: byte-identical copy of `@expo-google-fonts/material-symbols@0.4.50/LICENSE_FONT` |
| `apps/mobile/src/theme/__tests__/typography.test.ts`, `font-files.test.ts`, `font-licences.test.ts`, `typography-guard.test.ts` | New tests: 4 of the 6 theme suites. The 6 suites run 70 tests; the mobile suite runs 181 in total (both measured) |
| `apps/mobile/src/theme/__tests__/font-file.ts`, `node.ts` | Test helpers: an sfnt reader (head/hhea/OS/2/cmap/loca/glyf), and typed Node built-ins, because the app's tsconfig omits Node types |
| `docs/evidence/DS-2/README.md`, `android-text-scaling.md`, `probes/guard-patch.cjs`, `probes/font-facts.mjs` | Evidence, the blocked device-gate procedure, and two read-only probes re-run from the repo |
| `docs/plan/runs/DS-2/checkpoint.md`, this file | Run records |

## Done when

| Box (verbatim) | Met | Evidence |
|---|---|---|
| The ramp (Display 56/44/36, numbers up to 112) is in the tokens with tests, and the lint guard rejects a literal font size or family (seen to fail) | **yes, for literal values** (bypass hardening requested, R2) | **Ramp:** `typeScale` in `tokens.ts`. `typography.test.ts › has the display, headline, title, body, label and figure sizes from docs/22 §4` asserts `[56, 44, 36]` and `[112, 72, 48, 32, 22, 16]`. Further tests cover family and weight mapping, faux-bold prevention, legacy aliases, iOS body, line-box ratios and 200% scaling. **Guard:** `typography-guard.test.ts` lints planted literals against the app's real `eslint.config.js` rule block. It rejects `fontSize`, `lineHeight` and `fontFamily` literals (plain object, `StyleSheet.create`, inline JSX style) in `src/ui`, `src/features` and `src/app`. It accepts theme tokens and exempts `src/theme`. **Seen to fail:** M1 below. The existing `test-design-rules.cjs` does **not** catch M1. Six bypass forms (template literal, quoted key, conditional or `\|\|` fallback, `fontWeight`, `letterSpacing`) pass today's rule. The selector that closes them was verified and is request R2 to DS-1 |
| Each bundled font's licence file is in the repo and listed in the in-app licences data | **yes** | The final `expo export` lists exactly 7 font files from 4 packages (README §3). All 4 are in `fontLicences`. `font-licences.test.ts` checks four things: every `@expo-google-fonts` package in `pnpm-lock.yaml` is registered at its locked version; direct dependencies match `package.json`; each notice in `assets/licenses/` is **byte-identical** to the `LICENSE_FONT` its package ships; and the root layout imports and loads exactly the registered text fonts. Caveats: no screen renders the data yet (K-10 belongs to another goal); the Google Sans Flex notice has no copyright line because the shipped licence has none (DEC-16) |
| English and Devanagari samples render at 100% and 200% text on an Android release build without clipping (`docs/evidence/DS-2/`) | **no — blocked** | No Android device, emulator or release-build permission in this phase. `docs/evidence/DS-2/android-text-scaling.md` has the exact procedure, samples and pass rule. Supporting **non-device** evidence: `font-files.test.ts` proves that real sample glyphs (English, figures, unshaped Hindi) fit RN 0.86's half-leading Android line box for every style, and that every Hindi box is at least Noto's ascent + descent. Shaped conjuncts and Android 14+ non-linear `lineHeight` scaling remain unproven (README §§2, 4) |

**Source review and runtime proof are separate here.** Boxes 1 and 2 rest on tests and commands run in
this worktree (results below). Statements about RN's Android behaviour come from reading RN 0.86.3
source in `node_modules`, not from a device.

## Acceptance evidence

| Ledger row | Run (build or environment, date) | Result | Evidence | Row written here? |
|---|---|---|---|---|
| DEC-16 · Font and seed-content rights before the stores (proved by DS-2, CT-1, G14.data, QA-5) | macOS worktree, Node 22.23.1, 27 Oct 2026 | font half: 4 bundled fonts inventoried; notices byte-identical to shipped licences | `font-licences.test.ts`; `docs/evidence/DS-2/README.md` §3 | **No.** DS-2 is not the last prover. Open item for the row: Google Sans Flex's shipped OFL has no copyright line; confirm upstream (google/fonts) from a primary source |

## Gates

All run from the worktree root with `rtk proxy`.

| Gate | Command | Result |
|---|---|---|
| Frozen install | `rtk proxy pnpm install --frozen-lockfile` | `Lockfile is up to date` · `Packages: +1095` · `Done in 11.8s`; no package or lockfile change |
| Types | `rtk proxy pnpm --filter @fitlog/mobile typecheck` | `tsc --noEmit`, exit 0 |
| Lint + design rules | `rtk proxy pnpm --filter @fitlog/mobile lint` | `eslint . --max-warnings=0` clean; `Design rules verified: raw visual values fail; semantic tokens pass.` |
| Mobile tests | `rtk proxy pnpm --filter @fitlog/mobile test:ci` | `Test Suites: 11 passed, 11 total` · `Tests: 181 passed, 181 total` |
| Focused theme tests | `rtk proxy pnpm --filter @fitlog/mobile exec jest --runInBand src/theme` | `Test Suites: 6 passed` · `Tests: 70 passed` |
| Coverage of changed modules | same, plus `--coverage --collectCoverageFrom=src/theme/{typography,font-licences,tokens,theme}.ts` | 100% lines on all four. `typography.ts` 97.29% statements and 91.66% branches; line 45 is the unreachable "no bundled font for role" throw |
| Native JS export | `rtk proxy pnpm --filter @fitlog/mobile exec expo export --platform ios --platform android --output-dir .expo/export-native` | `iOS Bundled … (1059 modules)` · `Android Bundled … (1693 modules)` · 7 font assets · `Exported: .expo/export-native` |
| Not run | root `pnpm check` (domain, planner and plan-build parts) | The coordinator ruled out all-suite runs. The diff touches no domain, plan or GOALS/ACCEPTANCE file. Its mobile parts (typecheck, lint, `test:ci`) ran above |
| Not required | `pnpm backend:test` | No `supabase/`, `packages/domain/`, `scripts/backend/` or `src/data/` change |
| Blocked | Android release build at 100% and 200% | No device; the phase excludes device builds |

## Inherited and used

| From | Claim | Held? |
|---|---|---|
| Card "Existing work" (002) | Google Sans Flex, Roboto Condensed and Noto Sans Devanagari bundled with OFL notices | **Held, but incomplete.** The three notices are byte-identical to the shipped licences (`git diff --no-index` empty; now enforced by a test). Material Symbols (Apache-2.0) also ships, through expo-router → expo-symbols, and had no notice. Now added |
| QA-1 (Done, `67e6d1c`) | Mobile typecheck, lint, tests and export are the baseline gates | Held on this branch (above) |
| `docs/22` §4 | Ramp sizes | Used verbatim for sizes. Line heights and weights are decisions here (D1–D4); Figma line-height parity is unverified |

## Mutation checks

Each guard was broken on purpose, a named test failed, and the change was restored. `git status` then
showed only intended files; `eslint.config.js` and `_layout.tsx` had empty diffs.

| # | Guard → how it was broken | Test that failed (output) |
|---|---|---|
| M1 | Lint guard → `fontFamily` removed from the `eslint.config.js` selector | `typography-guard.test.ts › rejects a font family in components, screens and routes` (also `…StyleSheet.create…` and `…inline JSX style…`): `- "Use the shared typography or radius tokens from useTheme()."` / `+ "messages": Array []`. Under the same mutation `test-design-rules.cjs` still printed `Design rules verified…`, so the old proof misses it |
| M2 | Ramp → displayMedium 44 → 45 | `typography.test.ts › has the display, headline, title, body, label and figure sizes from docs/22 §4`: `- 44` / `+ 45` |
| M3 | Faux bold → `styleFor` returns the requested weight instead of the bundled file's | `typography.test.ts › only names weights that have a bundled file on android/ios`: `"bundled": false, "variant": "titleLarge"` |
| M4 | Hindi line box → `devanagariLineHeightRatio` 1.6 → 1.2 | `font-files.test.ts › gives every Hindi style on android/ios a line box at least Noto Sans Devanagari's ascent + descent`: `"fits": false, "variant": "displayLarge (Hindi)"` |
| M5 | Scaling cap → `fixedFromSize` 100 → 200 | `typography.test.ts › grows larger display text and figures less, never shrinks them and stops at 100 dp`: `Expected: 1 Received: 1.5` |
| M6 | Licence registry → Noto version 0.4.1 → 0.4.0 | `font-licences.test.ts › …version it depends on`: `- …noto-sans-devanagari@0.4.1` / `+ …@0.4.0` |
| M7 | Loader inventory → `NotoSansDevanagari_700Bold` dropped from `useFonts` in `_layout.tsx` | `font-licences.test.ts › matches what the root layout imports and loads…`: `- "NotoSansDevanagari_700Bold"` |
| M8 | Notice fidelity → `PERMISSION & CONDITIONS` → `PERMISSION AND CONDITIONS` in the Noto notice | `font-licences.test.ts › Noto Sans Devanagari keeps the licence its package ships, byte for byte`: `- PERMISSION & CONDITIONS` / `+ PERMISSION AND CONDITIONS` |

**Executed RED → GREEN runs.**
- Display Large line box: `font-files.test.ts › keeps English, figure and Hindi sample glyphs inside
  every line box on android/ios` failed at 56/64 with `"bottom": false, "variant": "displayLarge"`.
  It passes at 56/68.
- Material Symbols: `…registers every font package in the dependency tree at its locked version`
  failed with `- "@expo-google-fonts/material-symbols@0.4.50"`, and `…marks the packages … directly…`
  failed with `+ Array []`. Both pass with the new entry.
- The first test set was written before the implementation, in session 1, but not executed then (no
  shell). Its baseline RED is reproducible on `main`: the suites import `../typography` and
  `../font-licences`, which do not exist there.

## Review findings left open

The coordinator ruled out nested sub-agents, so the `code-reviewer`, `security-reviewer` and
`tdd-guide` agents were **not** run; an independent review follows. This list comes from a self-review
of the full diff. Nothing critical or high was found.

- **Medium** · Android 14+ may convert `lineHeight` non-linearly, separately from `fontSize`
  (`node_modules/react-native/.../TextAttributes.kt:65-91`, `PixelUtil.kt:38-51`). Hindi leading could
  shrink at 200%. Device gate (box 3).
- **Medium** · The glyph-fit test is unshaped (`__tests__/font-file.ts › glyphBounds`). Devanagari
  conjunct stacks can reach Noto's bounding box (+1.347 / −0.547 em). Device gate.
- **Low** · `font-licences.test.ts` reads `src/app/_layout.tsx` with regexes. It breaks if DS-5
  restructures the loader; request R3 removes that coupling.
- **Low** · `typography-guard.test.ts` mocks `eslint-config-expo/flat`, so it proves the app's own rule
  block only. The full config is exercised by `pnpm lint` and `test-design-rules.cjs`.
- **Low** · `typography.ts:45` throws when a role has no bundled font; this is unreachable with
  today's tokens and uncovered.
- **Low** · `hindiFonts` is kept only for `AppText`. Remove it after R1.

## Left undone, and why

- **Box 3:** needs an Android release build and device; blocked (see above).
- **`AppText` and `Field` still use the old Hindi rule** (×1.2 line height, weight `'400'` → Regular,
  else Bold) and pass no `maxFontSizeMultiplier`. They are in `src/ui/`, outside this phase's scope;
  request R1. Until R1 lands, the new Hindi line boxes and scaling caps are not applied on screen. Text
  using the existing 7 variant names renders as before, except `display`, whose line height goes 48 → 52.
- **Figma parity of line heights:** the Figma connector was not used in this session; sizes follow
  docs/22 §4.
- **Primary-source licence check for Google Sans Flex upstream:** no web tool in this session. The
  in-repo notice equals the licence the npm package ships.

## Found for other goals

- **K-10 settings licences screen (MVP-M "feedback/about/licenses"):** render `fontLicences` with each
  notice's full text. Metro's default `assetExts` has no `txt`, and the app has no `metro.config`, so
  the `.txt` notices cannot be `require()`d as they are. Ship the text as TS strings, or add `txt` to
  `assetExts` (shared file).
- **DS-4:** if the kit adds Material Symbols *Rounded* (`@expo-google-fonts/material-symbols-rounded`),
  the lockfile test will demand a registry entry and notice. That is intended.
- **S7 / PL-1:** a CI check that compares `expo export`'s font assets with `fontLicences` would close the
  last gap. The lockfile test is over-inclusive and approximates it.
- **DEC-16 (CT-1, G14.data, QA-5):** settle the Google Sans Flex copyright line upstream.
- **QA-11:** record the reference Android models, which box 3 needs.

## Requests for other lanes' files

**R1 — DS-4 / S3 `src/ui/AppText.tsx` (and the same idea in `Field.tsx`).** Apply the theme's Hindi
styles and caps:

```tsx
import { Text, type TextProps } from 'react-native';
import { useTheme, type AppTheme } from '@/theme';
import { getCurrentLocale } from '@/lib/i18n';

interface AppTextProps extends TextProps {
  variant?: keyof AppTheme['typography'];
  tone?: 'default' | 'muted' | 'accent' | 'error';
}

export function AppText({ variant = 'body', tone = 'default', style, ...props }: AppTextProps) {
  const { theme } = useTheme();
  const color = { default: theme.colors.onSurface, muted: theme.colors.onSurfaceVariant,
    accent: theme.colors.primary, error: theme.colors.error }[tone];
  const type = getCurrentLocale() === 'hi' ? theme.devanagariTypography[variant] : theme.typography[variant];
  return <Text maxFontSizeMultiplier={theme.maxFontSizeMultiplier[variant]} {...props} style={[type, { color }, style]} />;
}
```

**R2 — DS-1, owner of the design-rule lint: `apps/mobile/eslint.config.js` and
`scripts/test-design-rules.cjs`.** Verified with `docs/evidence/DS-2/probes/guard-patch.cjs` against
the app's real config (`node docs/evidence/DS-2/probes/guard-patch.cjs "$PWD/apps/mobile" [current]`):
- today's rule: 0 of 6 bypasses caught;
- proposed rule: 6 of 6 caught, theme tokens 0, existing `src/` lines flagged 0.

```diff
         {
-          selector: 'Property[key.name=/^(fontSize|lineHeight|fontFamily|borderRadius)$/] > Literal',
+          selector: [
+            'Property[key.name=/^(fontSize|lineHeight|fontFamily|fontWeight|letterSpacing|borderRadius)$/] > Literal',
+            'Property[key.value=/^(fontSize|lineHeight|fontFamily|fontWeight|letterSpacing|borderRadius)$/] > Literal.value',
+            'Property[key.name=/^(fontSize|lineHeight|fontFamily|fontWeight|letterSpacing)$/] > TemplateLiteral',
+            'Property[key.name=/^(fontSize|lineHeight|fontFamily|fontWeight|letterSpacing)$/] > :matches(ConditionalExpression, LogicalExpression) > Literal',
+          ].join(', '),
           message: 'Use the shared typography or radius tokens from useTheme().',
         },
```

In `test-design-rules.cjs`, plant a family as well, so M1 fails there too:
`{ color: "#ffffff", fontSize: 16, fontFamily: "Inter", borderRadius: 28 }`, with the expected count
3 → 4. Add the six bypass fixtures to `typography-guard.test.ts` once the selector lands.

**R3 — DS-5 / root layout `src/app/_layout.tsx` (optional).** Move the `useFonts` map into
`src/theme/fonts.ts` (`export const fontAssets = { GoogleSansFlex_400Regular, … }`) and call
`useFonts(fontAssets)`. The inventory test then compares `Object.keys(fontAssets)` instead of
regex-scanning the layout.

**R4 — `docs/THEMING.md` owner.** In the fonts paragraph, document:
- the ramp names;
- `theme.devanagariTypography` and `theme.maxFontSizeMultiplier`;
- the licence registry `src/theme/font-licences.ts`;
- the Material Symbols Apache-2.0 notice.

**R5 — S5 settings gallery (`ComponentGalleryScreen.tsx`) with S4 i18n.** Add a type specimen that
renders every variant in English and Hindi through `t()`, for the box 3 captures.

## Decisions forced (for the tracker decision log)

- **D1 · Display Large is 56/68, not M3's 64.** Google Sans Flex English descenders (−0.234 em) overflow
  RN's half-leading box at 64 by about 0.14 dp (measured; RED run above).
- **D2 · Hindi line height is max(Latin, ⌈1.6 × size⌉ on a 4 dp grid).** Noto Sans Devanagari's ascent +
  descent is 1.304 em, so this leaves at least 0.16 em of half-leading at each end. Hindi 600 maps to
  Noto Bold, because no 600 file is bundled.
- **D3 · Text-scaling caps.** `maxFontSizeMultiplier` is 2 up to 24 dp and tapers linearly to 1 at
  100 dp. Hero figures stay at 112 dp; small text doubles; order is preserved at 1–2×.
- **D4 · Legacy `display` alias.** It now maps to displayMedium 44/52, so its line height moves 48 → 52.
  The other six aliases are unchanged.
- **D5 · Material Symbols (Apache-2.0) is a registered, transitive bundled font.** It comes through
  expo-router → expo-symbols on Android.

## Traps hit

- Session 1 had no shell at all. In session 2 only single `rtk proxy` commands ran: compound commands,
  plain `rtk`, `ls` and `cp` were denied. The licence copy was reproduced with Write and proven
  byte-identical with `git diff --no-index`.
- The mobile tsconfig restricts types to react and jest, so `node:fs`, `__dirname` and `Buffer` don't
  typecheck in tests. `__tests__/node.ts` gives narrow typed wrappers.
- `@typescript-eslint/no-require-imports` flags `require()` in tests. `jest.requireActual` loads the
  real config and still applies the `eslint-config-expo/flat` mock to its imports.
- `nodeLinker: hoisted`: packages live in the root `node_modules`, and Glob skips them unless given
  the path.
- An esquery quoted-key selector without `.value` matches the key literal too (it double-counted in the
  probe).
- Material Symbols shows up only in the `expo export` asset list; no app source imports it.
