# DS-2 · Type ramp and fonts — evidence

Branch `codex/fitlog-ds2-type`, base `c8a5d57`, attempt 1, 27 Oct 2026. Environment: macOS worktree,
Node 22.23.1, pnpm 10.27.0, dependencies from `pnpm install --frozen-lockfile` (no package or lockfile
change), React Native 0.86.3, Expo 57. **None of this is device evidence.** Box 3 (Android release
build at 100% and 200%) is blocked; see [android-text-scaling.md](android-text-scaling.md).

## 1 · The ramp in the tokens (box 1)

Source: `apps/mobile/src/theme/tokens.ts` (`typeScale`, `fontFiles`, `fontScaling`,
`devanagariLineHeightRatio`), built by `apps/mobile/src/theme/typography.ts`. Pinned by
`src/theme/__tests__/typography.test.ts`. Sizes and line heights are dp; the 200% columns use React
Native's `maxFontSizeMultiplier` cap (`theme.maxFontSizeMultiplier[variant]`) under linear scaling.

| Variant | Latin size / line | Weight · family | Hindi line (Noto Sans Devanagari) | Cap | At 200%: size / line |
|---|---|---|---|---|---|
| displayLarge | 56 / 68 | 700 · Google Sans Flex Bold | 92 (Bold) | 1.58 | 88.5 / 107.4 |
| displayMedium | 44 / 52 | 700 · GSF Bold | 72 (Bold) | 1.74 | 76.6 / 90.5 |
| displaySmall | 36 / 44 | 700 · GSF Bold | 60 (Bold) | 1.84 | 66.2 / 81.0 |
| headlineLarge | 32 / 40 | 700 · GSF Bold | 52 (Bold) | 1.89 | 60.5 / 75.6 |
| headlineMedium | 28 / 36 | 700 · GSF Bold | 48 (Bold) | 1.95 | 54.6 / 70.2 |
| headlineSmall | 24 / 32 | 700 · GSF Bold | 40 (Bold) | 2 | 48 / 64 |
| titleLarge | 22 / 28 | 600 · GSF SemiBold | 36 (Bold) | 2 | 44 / 56 |
| titleMedium | 16 / 24 | 600 · GSF SemiBold | 28 (Bold) | 2 | 32 / 48 |
| titleSmall | 14 / 20 | 600 · GSF SemiBold | 24 (Bold) | 2 | 28 / 40 |
| bodyLarge | 16 / 24 (iOS 17 / 24) | 400 · GSF Regular | 28 (Regular) | 2 | 32 / 48 |
| bodyMedium | 14 / 20 | 400 · GSF Regular | 24 (Regular) | 2 | 28 / 40 |
| bodySmall | 12 / 16 | 400 · GSF Regular | 20 (Regular) | 2 | 24 / 32 |
| labelLarge / …Emphasized | 14 / 20 | 600 / 700 · GSF | 24 (Bold) | 2 | 28 / 40 |
| labelMedium / …Emphasized | 12 / 16 | 600 / 700 · GSF | 20 (Bold) | 2 | 24 / 32 |
| labelSmall / …Emphasized | 11 / 16 | 600 / 700 · GSF | 20 (Bold) | 2 | 22 / 32 |
| numberHero | 112 / 120 | 700 · Roboto Condensed Bold | figures stay Latin | 1 | 112 / 120 |
| numberXL | 72 / 80 | 700 · RC Bold | — | 1.37 | 98.6 / 109.6 |
| numberLarge | 48 / 52 | 700 · RC Bold | — | 1.68 | 80.6 / 87.4 |
| numberMedium | 32 / 36 | 700 · RC Bold | — | 1.89 | 60.5 / 68.0 |
| numberSmall | 22 / 28 | 700 · RC Bold | — | 2 | 44 / 56 |
| numberXS | 16 / 20 | 700 · RC Bold | — | 2 | 32 / 40 |

The seven original variant names are aliases and render as before (`display`→displayMedium,
`headline`→headlineLarge, `title`→titleLarge, `body`→bodyLarge, `label`→labelLarge,
`caption`→bodySmall, `number`→numberLarge). The only visible change is `display`'s line height,
48 → 52, because 44/48 is below the 1.15 ratio Google Sans Flex descenders need (§2).

Decisions taken here, not read from Figma (the Figma connector was not available in this session):
docs/22 §4 fixes the sizes only. Line heights follow M3 on a 4 dp grid, except Display Large (68
instead of 64, measured below). Weights reuse the existing tokens (display/headline 700, title/label
600, body 400) because the bundled files are 400/600/700 only. Figma line-height parity is unverified.

## 2 · Measurements from the bundled font files

Method: the sfnt tables of each `.ttf` the app bundles are read directly: `head`, `hhea`, `OS/2`,
`cmap` (formats 4 and 12), `loca` and `glyf`. The same parser runs in the tests
(`src/theme/__tests__/font-file.ts`). Sample text per role is in `font-files.test.ts` (`SAMPLES`).
To re-print the metric columns: `node docs/evidence/DS-2/probes/font-facts.mjs "$PWD/apps/mobile"`.

| File | unitsPerEm | Ascent / descent used (em) | USE_TYPO_METRICS | usWeightClass | Sample glyph top / bottom (em) |
|---|---|---|---|---|---|
| GoogleSansFlex_400Regular | 2000 | 0.966 / 0.286 | yes (typo = hhea) | 400 | 0.801 / −0.232 (English) |
| GoogleSansFlex_600SemiBold | 2000 | 0.966 / 0.286 | yes | 600 | measured in test |
| GoogleSansFlex_700Bold | 2000 | 0.966 / 0.286 | yes | 700 | 0.810 / −0.234 (English) |
| RobotoCondensed_700Bold | 2048 | 0.928 / 0.244 (hhea) | no | 700 | 0.721 / −0.179 (figures) |
| NotoSansDevanagari_400Regular | 1000 | 0.896 / 0.408 | yes | 400 | 0.896 / −0.274 (Hindi) |
| NotoSansDevanagari_700Bold | 1000 | 0.896 / 0.408 | yes | 700 | 0.896 / −0.279 (Hindi) |

What the tests derive from these numbers:

- **Weights are real.** Each file's `usWeightClass` equals its token weight, and every style names
  the weight of the file it uses. Android therefore never synthesises bold.
- **React Native's Android line box.** `CustomLineHeightSpan` (RN 0.86) splits
  `lineHeight − (ascent + descent)` in half above and below, so a short line box trims both ends.
  For every Latin, figure and Hindi style, the box keeps the sample's tallest and deepest glyphs inside it.
- **This caught Display Large.** At 56/64, English descenders overflowed the trimmed box by about
  0.14 dp (RED run recorded in the handoff), so it is now 56/68. The words floor is 1.15.
- **Hindi.** Every Hindi line box is at least Noto Sans Devanagari's ascent + descent (1.304 em). The
  1.6 ratio leaves at least 0.16 em of half-leading at each end (headlineLarge 52/32 is the tightest)
  for matras and below-base marks.
- **Limits.** Glyph bounds are measured per code point, **unshaped**. Conjuncts and stacked marks that
  Devanagari shaping substitutes can reach the font's bounding box (Noto: +1.347 / −0.547 em), which
  is beyond these bounds. Only device captures prove shaped Hindi.

## 3 · What the app actually bundles (box 2)

`pnpm --filter @fitlog/mobile exec expo export --platform ios --platform android` lists exactly
these font assets (final run on this branch):

```
@expo-google-fonts/google-sans-flex/400Regular/GoogleSansFlex_400Regular.ttf (132KB)
@expo-google-fonts/google-sans-flex/600SemiBold/GoogleSansFlex_600SemiBold.ttf (133KB)
@expo-google-fonts/google-sans-flex/700Bold/GoogleSansFlex_700Bold.ttf (133KB)
@expo-google-fonts/material-symbols/400Regular/MaterialSymbols_400Regular.ttf (971KB)
@expo-google-fonts/noto-sans-devanagari/400Regular/NotoSansDevanagari_400Regular.ttf (221KB)
@expo-google-fonts/noto-sans-devanagari/700Bold/NotoSansDevanagari_700Bold.ttf (222KB)
@expo-google-fonts/roboto-condensed/700Bold/RobotoCondensed_700Bold.ttf (146KB)
```

Material Symbols was not in the earlier inventory. `expo-router`'s Android native-tabs icon converter
imports `expo-symbols`, which bundles it. Its Apache-2.0 licence is now in the repo, and it is in the
registry as a transitive dependency.

| Font | Licence | Notice in repo (`apps/mobile/`) | Registry (`src/theme/font-licences.ts`) |
|---|---|---|---|
| Google Sans Flex 0.4.6 | OFL-1.1 | `assets/licenses/google-sans-flex-OFL.txt` | direct · copyright: none in shipped notice |
| Roboto Condensed 0.4.2 | OFL-1.1 | `assets/licenses/roboto-condensed-OFL.txt` | direct · Copyright 2011 The Roboto Project Authors |
| Noto Sans Devanagari 0.4.1 | OFL-1.1 | `assets/licenses/noto-sans-devanagari-OFL.txt` | direct · Copyright 2022 The Noto Project Authors |
| Material Symbols 0.4.50 | Apache-2.0 | `assets/licenses/material-symbols-Apache-2.0.txt` (new) | transitive (expo-symbols) |

Each notice is byte-identical to the `LICENSE_FONT` its package ships. This was checked with
`git diff --no-index` and is enforced by `font-licences.test.ts`. The Google Sans Flex notice has no
copyright line because the licence the package ships has none. Whether upstream (google/fonts)
carries one could not be checked from a primary web source in this session (no web tool). It is
left for DEC-16.

## 4 · Text-scaling model and its limit

`maxFontSizeMultiplier` is 2 up to 24 dp. It tapers linearly to 1 at 100 dp, so hero figures stay on
screen, in the manner of Android 14's non-linear scaling. Tests check:

- text up to 24 dp doubles at 200%;
- no style shrinks or exceeds 2×;
- a smaller step never renders larger at 1×, 1.3×, 1.5× or 2×;
- Hindi line ratios hold at 200%.

**Limit, read from RN 0.86 source.** `TextAttributes.effectiveFontSize` and `effectiveLineHeight`
each call `PixelUtil.toPixelFromSP`, which uses `TypedValue.applyDimension(COMPLEX_UNIT_SP, …)` on
`DisplayMetricsHolder`'s copied metrics. On Android 14+, if that copy keeps the platform's non-linear
`fontScaleConverter`, line heights (larger sp values) grow less than font sizes. Leading would then
shrink at 200%, Hindi most of all. Whether the converter survives the copy (`setTo` then
`getRealMetrics`) cannot be settled without a device. This is the main thing the Android capture
must check.
