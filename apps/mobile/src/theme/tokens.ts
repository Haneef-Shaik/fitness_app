/**
 * FitLog design tokens — Coach OS.
 *
 * The redesign treats the phone like a calm instrument panel: graphite depth,
 * paper-white type and one electric lime action colour. Tonal layering does
 * the work of decoration so a workout still reads in a dim, crowded gym.
 * Status hexes remain reserved for fills and icons; status text uses its
 * `*Ink` shade so the contrast contract stays intact.
 */
export type Scheme = 'dark' | 'light';

const dark = {
  page: '#0B0C0E', surface: '#151719', surface2: '#1D2023', sunken: '#08090A',
  ink: '#F6F7F2', ink2: '#A6AAA3', ink3: '#7F847B',
  line: '#2B2E31', line2: '#3A3E40',
  accent: '#D7FF4F', accentHi: '#E5FF8A', accentInk: '#10140A',
  focusRing: '#D7FF4F',
  accentWash: 'rgba(215,255,79,0.14)',
  good: '#3FD07B', warn: '#FAB219', serious: '#EC835A', crit: '#FF6B6B',
  goodInk: '#3FD07B', warnInk: '#FAB219', seriousInk: '#EC835A', critInk: '#FF6B6B',
  // Protein · carbs · fat · fiber.
  s1: '#3987E5', s2: '#FF8A65', s3: '#34D399', s4: '#C98500',
  rowTint: 'rgba(255,255,255,0.035)',
};

const light: typeof dark = {
  page: '#F7F6F2', surface: '#FFFFFF', surface2: '#EFEEE8', sunken: '#E7E8E1',
  ink: '#151715', ink2: '#484D46', ink3: '#5F665C',
  line: '#DCDDD5', line2: '#BEC2B7',
  accent: '#4F6400', accentHi: '#435500', accentInk: '#FFFFFF',
  focusRing: '#4F6400',
  accentWash: 'rgba(79,100,0,0.10)',
  good: '#0C8F3C', warn: '#FAB219', serious: '#EC835A', crit: '#D03B3B',
  goodInk: '#08702E', warnInk: '#805600', seriousInk: '#A83D12', critInk: '#B52B2B',
  s1: '#2A78D6', s2: '#EB6834', s3: '#1BAF7A', s4: '#EDA100',
  rowTint: 'rgba(21,23,21,0.035)',
};

export const palette = { dark, light };
export type Colors = typeof dark;

/**
 * Hanken Grotesk is bundled in the native app and is used consistently here.
 * A single family keeps the small logger rows coherent while the weight shift
 * still gives Coach OS its editorial hierarchy.
 */
export const font = {
  ui: 'HankenGrotesk_400Regular',
  uiMedium: 'HankenGrotesk_500Medium',
  uiSemi: 'HankenGrotesk_600SemiBold',
  uiBold: 'HankenGrotesk_700Bold',
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

/** 48dp covers Android's floor; 56 inside the logger keeps one-hand entry easy. */
export const target = { min: 48, logger: 56 };
