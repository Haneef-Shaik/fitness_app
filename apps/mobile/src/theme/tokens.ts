/** Shared design decisions; layout-specific flex rules stay in their components. */
export const spacing = { none: 0, xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, section: 48 } as const;
export const radius = {
  xs: 4, sm: 8, md: 12, lg: 16, list: 20, card: 28, hero: 32, sheet: 48, full: 9999,
} as const;
export const dimensions = {
  contentMaxWidth: 640,
  touchTarget: 48,
  buttonHeight: 56,
  loggerButtonHeight: 96,
  border: 1,
  focusRing: 2,
  icon: 24,
  previewMinHeight: 180,
  ring: 116,
  ringStroke: 10,
  heroArt: 88,
  tabBarHeight: 80,
  dayMarker: 36,
  summaryMinWidth: 144,
} as const;

/** Weights with a bundled static file. Naming any other weight lets Android synthesise faux bold. */
export type FontWeightToken = '400' | '600' | '700';
/** Semantic font roles: words (Latin UI text), figures (scoreboard numbers) and Hindi words. */
export type FontRole = 'words' | 'figures' | 'devanagari';

/**
 * Bundled OFL fonts by role and weight (licences: `font-licences.ts`). Each static weight registers
 * as its own family through the root layout's `useFonts`, so styles choose a weight by family name.
 * Change a slot together with that loader and the licence registry.
 */
export const fontFiles = {
  words: { '400': 'GoogleSansFlex_400Regular', '600': 'GoogleSansFlex_600SemiBold', '700': 'GoogleSansFlex_700Bold' },
  figures: { '700': 'RobotoCondensed_700Bold' },
  devanagari: { '400': 'NotoSansDevanagari_400Regular', '700': 'NotoSansDevanagari_700Bold' },
} as const satisfies Record<FontRole, Partial<Record<FontWeightToken, string>>>;
/** Kept for existing callers; prefer `theme.devanagariTypography`. */
export const hindiFonts = { regular: fontFiles.devanagari['400'], bold: fontFiles.devanagari['700'] } as const;

export interface TypeToken {
  readonly fontSize: number;
  readonly lineHeight: number;
  readonly fontWeight: FontWeightToken;
  readonly role: 'words' | 'figures';
}

/**
 * The Momentum ramp (docs/22 §4) in dp: emphasised Display 56/44/36, the M3 headline, title, body
 * and label steps (labels also emphasised), and figures up to 112. Line heights sit on a 4 dp grid.
 * Display Large uses 68, not M3's 64: Google Sans Flex descenders need a 1.15 ratio on Android.
 */
export const typeScale = {
  displayLarge: { fontSize: 56, lineHeight: 68, fontWeight: '700', role: 'words' },
  displayMedium: { fontSize: 44, lineHeight: 52, fontWeight: '700', role: 'words' },
  displaySmall: { fontSize: 36, lineHeight: 44, fontWeight: '700', role: 'words' },
  headlineLarge: { fontSize: 32, lineHeight: 40, fontWeight: '700', role: 'words' },
  headlineMedium: { fontSize: 28, lineHeight: 36, fontWeight: '700', role: 'words' },
  headlineSmall: { fontSize: 24, lineHeight: 32, fontWeight: '700', role: 'words' },
  titleLarge: { fontSize: 22, lineHeight: 28, fontWeight: '600', role: 'words' },
  titleMedium: { fontSize: 16, lineHeight: 24, fontWeight: '600', role: 'words' },
  titleSmall: { fontSize: 14, lineHeight: 20, fontWeight: '600', role: 'words' },
  bodyLarge: { fontSize: 16, lineHeight: 24, fontWeight: '400', role: 'words' },
  bodyMedium: { fontSize: 14, lineHeight: 20, fontWeight: '400', role: 'words' },
  bodySmall: { fontSize: 12, lineHeight: 16, fontWeight: '400', role: 'words' },
  labelLarge: { fontSize: 14, lineHeight: 20, fontWeight: '600', role: 'words' },
  labelMedium: { fontSize: 12, lineHeight: 16, fontWeight: '600', role: 'words' },
  labelSmall: { fontSize: 11, lineHeight: 16, fontWeight: '600', role: 'words' },
  labelLargeEmphasized: { fontSize: 14, lineHeight: 20, fontWeight: '700', role: 'words' },
  labelMediumEmphasized: { fontSize: 12, lineHeight: 16, fontWeight: '700', role: 'words' },
  labelSmallEmphasized: { fontSize: 11, lineHeight: 16, fontWeight: '700', role: 'words' },
  numberHero: { fontSize: 112, lineHeight: 120, fontWeight: '700', role: 'figures' },
  numberXL: { fontSize: 72, lineHeight: 80, fontWeight: '700', role: 'figures' },
  numberLarge: { fontSize: 48, lineHeight: 52, fontWeight: '700', role: 'figures' },
  numberMedium: { fontSize: 32, lineHeight: 36, fontWeight: '700', role: 'figures' },
  numberSmall: { fontSize: 22, lineHeight: 28, fontWeight: '700', role: 'figures' },
  numberXS: { fontSize: 16, lineHeight: 20, fontWeight: '700', role: 'figures' },
} as const satisfies Record<string, TypeToken>;

/** The original variant names, kept so existing screens render as before. */
export const typeAliases = {
  display: 'displayMedium',
  headline: 'headlineLarge',
  title: 'titleLarge',
  body: 'bodyLarge',
  label: 'labelLarge',
  caption: 'bodySmall',
  number: 'numberLarge',
} as const satisfies Record<string, keyof typeof typeScale>;

/** Platform type adaptations: iOS body text is 17 pt. */
export const platformType = { iosBodySize: 17 } as const;

/**
 * Text scaling (PRD §23.1, up to 200%). Text up to `fullScaleMaxSize` dp follows the OS setting to
 * `maxFontScale`; larger display text and figures grow progressively less and stop growing at
 * `fixedFromSize`, in the manner of Android 14's non-linear font scaling, so hero figures stay on screen.
 */
export const fontScaling = { maxFontScale: 2, fullScaleMaxSize: 24, fixedFromSize: 100 } as const;
/** Hindi line boxes are at least this multiple of the font size: room for matras and below-base marks. */
export const devanagariLineHeightRatio = 1.6;
export const lineHeightGrid = 4;
