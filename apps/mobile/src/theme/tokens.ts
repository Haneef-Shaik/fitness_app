/**
 * FitLog design tokens — the React Native port of docs/design/fitlog.css.
 * Dark is primary; light is the deliberate swap. The Iris accent (OKLCH ~292 deg)
 * was chosen by CVD separation, not taste — see docs/05-DESIGN-SYSTEM.md section 2.3.
 */
export type Scheme = 'dark' | 'light';

const dark = {
  page: '#0E0F11', surface: '#17181A', surface2: '#1F2124', sunken: '#0B0C0E',
  ink: '#FFFFFF', ink2: '#B9BBB6', ink3: '#81847E',
  line: 'rgba(255,255,255,0.085)', line2: 'rgba(255,255,255,0.14)',
  accent: '#B0A4FF', accentHi: '#C9C1FF', accentInk: '#0E0F11',
  // docs/05 `--focus-ring`: 2 px ring + 2 px offset, never removed.
  focusRing: '#B0A4FF',
  accentWash: 'rgba(176,164,255,0.13)',
  good: '#3FD07B', warn: '#FAB219', serious: '#EC835A', crit: '#FF6B6B',
  // Text in a status tone (docs/05 §2.4). On dark these already read at 4.5:1,
  // so the text shade IS the status hex; on light they are darker (below).
  goodInk: '#3FD07B', warnInk: '#FAB219', seriousInk: '#EC835A', critInk: '#FF6B6B',
  s1: '#3987E5', s2: '#D95926', s3: '#199E70', s4: '#C98500',
  rowTint: 'rgba(255,255,255,0.028)',
  cardTop: 'rgba(255,255,255,0.045)', cardBottom: 'rgba(255,255,255,0.012)',
  sheen: 'rgba(255,255,255,0.07)',
};

const light: typeof dark = {
  page: '#F4F5F3', surface: '#FFFFFF', surface2: '#FFFFFF', sunken: '#EDEFEB',
  ink: '#0B0C0D', ink2: '#4B4D48', ink3: '#696B65',
  line: 'rgba(11,12,13,0.11)', line2: 'rgba(11,12,13,0.2)',
  accent: '#5A31C4', accentHi: '#4A2AA6', accentInk: '#FFFFFF',
  focusRing: '#5A31C4',
  accentWash: 'rgba(90,49,196,0.09)',
  good: '#0C8F3C', warn: '#FAB219', serious: '#EC835A', crit: '#D03B3B',
  // Same hue, darkened to 4.5:1+ on page, surface and sunken — G10 measured the
  // raw status hexes as TEXT at 1.6–4.4:1 on this theme (contrast.test.ts).
  goodInk: '#0A7A33', warnInk: '#8E6103', seriousInk: '#B94315', critInk: '#C73030',
  s1: '#2A78D6', s2: '#EB6834', s3: '#1BAF7A', s4: '#EDA100',
  rowTint: 'rgba(11,12,13,0.035)',
  cardTop: '#FFFFFF', cardBottom: '#FCFCFB',
  sheen: 'rgba(255,255,255,0.9)',
};

export const palette = { dark, light };
export type Colors = typeof dark;

/** One superfamily, two widths. Condensed carries every number. */
export const font = {
  ui: 'Barlow_400Regular',
  uiMedium: 'Barlow_500Medium',
  uiSemi: 'Barlow_600SemiBold',
  uiBold: 'Barlow_700Bold',
  data: 'BarlowCondensed_700Bold',
  dataSemi: 'BarlowCondensed_600SemiBold',
};

/** Scale runs 10 -> 76. A narrow scale reads as timid; the numbers ARE the product. */
export const type = {
  record: 76, hero: 66, entry: 56, display: 38, stat: 27,
  h1: 24, h2: 20, title: 17, body: 15, caption: 12.5, label: 10.5, micro: 11,
};

export const space = { xs: 4, sm: 8, md: 12, base: 16, lg: 20, xl: 24, xxl: 32, huge: 48 };
export const radius = { row: 11, btn: 13, card: 16, lg: 18, pill: 999 };

/** 44 is the floor everywhere. 56 inside the logger: one hand, a phone on a bench. */
export const target = { min: 44, logger: 56 };
