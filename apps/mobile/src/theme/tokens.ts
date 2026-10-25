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

/** Bundled OFL fonts; change these slots to replace typography across the application. */
export const fontFamilies = {
  ios: { body: 'GoogleSansFlex_400Regular', numbers: 'RobotoCondensed_700Bold' },
  android: { body: 'GoogleSansFlex_400Regular', numbers: 'RobotoCondensed_700Bold' },
  web: { body: 'GoogleSansFlex_400Regular', numbers: 'RobotoCondensed_700Bold' },
} as const;
export const fontWeights = { regular: 'GoogleSansFlex_400Regular', medium: 'GoogleSansFlex_600SemiBold', bold: 'GoogleSansFlex_700Bold' } as const;
export const hindiFonts = { regular: 'NotoSansDevanagari_400Regular', bold: 'NotoSansDevanagari_700Bold' } as const;

export const typeRamp = {
  display: { fontSize: 44, lineHeight: 48, fontWeight: '700' },
  headline: { fontSize: 32, lineHeight: 40, fontWeight: '700' },
  title: { fontSize: 22, lineHeight: 28, fontWeight: '600' },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' },
  label: { fontSize: 14, lineHeight: 20, fontWeight: '600' },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '400' },
  number: { fontSize: 48, lineHeight: 52, fontWeight: '700' },
} as const;
