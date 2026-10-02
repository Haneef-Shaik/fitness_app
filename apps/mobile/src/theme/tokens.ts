/**
 * FitLog design tokens — the "Kinetic Performance" direction (docs/15-UI-REDESIGN.md).
 *
 * Dark is primary: a gym is a dark room and the logger gets used at 6am.
 * Depth comes from tonal layering (page → card → panel) and hairline
 * outlines, never from glows or gradients. One accent, blue, on every primary
 * action and active state; the macro trio keeps its own hues.
 *
 * Every text tone is pinned at 4.5:1 on page, surface and sunken in both
 * themes by `__tests__/contrast.test.ts`, and the status hexes are reserved
 * for fills and icons — text in a status tone uses its `*Ink` shade.
 */
export type Scheme = 'dark' | 'light';

const dark = {
  page: '#0E0F11', surface: '#16181C', surface2: '#1E2025', sunken: '#0B0C0E',
  ink: '#FFFFFF', ink2: '#C4C6C1', ink3: '#8E918F',
  line: '#272A30', line2: '#3F4248',
  // Light enough to read as text on the dark surfaces, dark enough that its
  // own ink reads on it — one blue cannot carry white text and pass both.
  accent: '#6BA5FF', accentHi: '#85B6FF', accentInk: '#0B1A33',
  focusRing: '#6BA5FF',
  accentWash: 'rgba(107,165,255,0.14)',
  good: '#3FD07B', warn: '#FAB219', serious: '#EC835A', crit: '#FF6B6B',
  goodInk: '#3FD07B', warnInk: '#FAB219', seriousInk: '#EC835A', critInk: '#FF6B6B',
  // Protein · carbs · fat · fiber.
  s1: '#3987E5', s2: '#FF8A65', s3: '#34D399', s4: '#C98500',
  rowTint: 'rgba(255,255,255,0.028)',
};

const light: typeof dark = {
  page: '#F4F5F3', surface: '#FFFFFF', surface2: '#EFEFF0', sunken: '#EDEFEB',
  ink: '#0B0C0D', ink2: '#4B4D48', ink3: '#696B65',
  line: '#E2E4E6', line2: '#C9CCD0',
  accent: '#2368C0', accentHi: '#1D5AA8', accentInk: '#FFFFFF',
  focusRing: '#2368C0',
  accentWash: 'rgba(35,104,192,0.10)',
  good: '#0C8F3C', warn: '#FAB219', serious: '#EC835A', crit: '#D03B3B',
  goodInk: '#0A7A33', warnInk: '#8E6103', seriousInk: '#B94315', critInk: '#C73030',
  s1: '#2A78D6', s2: '#EB6834', s3: '#1BAF7A', s4: '#EDA100',
  rowTint: 'rgba(11,12,13,0.035)',
};

export const palette = { dark, light };
export type Colors = typeof dark;

/**
 * Two families: Hanken Grotesk for headlines and every figure (its chiselled
 * numerals hold a column), Inter for body, labels and log lines.
 */
export const font = {
  ui: 'Inter_400Regular',
  uiMedium: 'Inter_500Medium',
  uiSemi: 'Inter_600SemiBold',
  uiBold: 'Inter_700Bold',
  display: 'HankenGrotesk_700Bold',
  displaySemi: 'HankenGrotesk_600SemiBold',
  data: 'HankenGrotesk_800ExtraBold',
  dataSemi: 'HankenGrotesk_700Bold',
};

/** Sizes. The figures lead a screen; the scale is wide but not shouting. */
export const type = {
  record: 44, hero: 40, entry: 34, display: 32, stat: 24,
  h1: 26, h2: 22, title: 17, body: 15, caption: 13, label: 11, micro: 11,
};

export const space = { xs: 4, sm: 8, md: 12, base: 16, lg: 20, xl: 24, xxl: 32, huge: 48 };

/** Tight corners: tags 6, rows 10, controls 12, cards 16. Pills only for dots and avatars. */
export const radius = { tag: 6, row: 10, btn: 12, card: 16, lg: 16, pill: 999 };

/** 44 is the floor everywhere. 56 inside the logger: one hand, a phone on a bench. */
export const target = { min: 44, logger: 56 };
