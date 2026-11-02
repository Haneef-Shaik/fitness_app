import { createTheme, type AppTheme } from '../theme';
import { momentum } from '../themes/momentum';
import { fontFiles, typeAliases, typeScale } from '../tokens';
import {
  effectiveFontScale,
  fontFamilyFor,
  maxFontSizeMultiplierFor,
  nearestBundledWeight,
  type TypeVariant,
} from '../typography';

const android = createTheme(momentum, 'dark', 'android');
const ios = createTheme(momentum, 'light', 'ios');
const variants = Object.keys(android.typography) as TypeVariant[];
const scaleNames = Object.keys(typeScale) as (keyof typeof typeScale)[];
const devanagariFamilies: readonly string[] = Object.values(fontFiles.devanagari);

/** Google Sans Flex descenders need 1.148 under React Native's half-leading (font-files.test.ts). */
const WORDS_MIN_LINE_RATIO = 1.15;
/** Devanagari needs room for matras above the headstroke and marks below the baseline. */
const DEVANAGARI_MIN_LINE_RATIO = 1.6;

function sizes(theme: AppTheme, names: readonly TypeVariant[]) {
  return names.map((name) => theme.typography[name].fontSize);
}

function rendered(theme: AppTheme, variant: TypeVariant, fontScale: number, script: 'latin' | 'devanagari' = 'latin') {
  const style = script === 'latin' ? theme.typography[variant] : theme.devanagariTypography[variant];
  const scale = effectiveFontScale(fontScale, theme.maxFontSizeMultiplier[variant]);
  return { fontSize: style.fontSize * scale, lineHeight: style.lineHeight * scale };
}

function isBundled(fontFamily: string, fontWeight: string) {
  return Object.values(fontFiles).some((files) => (files as Record<string, string>)[fontWeight] === fontFamily);
}

describe('Momentum type ramp', () => {
  it('has the display, headline, title, body, label and figure sizes from docs/22 §4', () => {
    expect(sizes(android, ['displayLarge', 'displayMedium', 'displaySmall'])).toEqual([56, 44, 36]);
    expect(sizes(android, ['headlineLarge', 'headlineMedium', 'headlineSmall'])).toEqual([32, 28, 24]);
    expect(sizes(android, ['titleLarge', 'titleMedium', 'titleSmall'])).toEqual([22, 16, 14]);
    expect(sizes(android, ['bodyLarge', 'bodyMedium', 'bodySmall'])).toEqual([16, 14, 12]);
    expect(sizes(android, ['labelLarge', 'labelMedium', 'labelSmall'])).toEqual([14, 12, 11]);
    expect(sizes(android, ['labelLargeEmphasized', 'labelMediumEmphasized', 'labelSmallEmphasized'])).toEqual([14, 12, 11]);
    expect(sizes(android, ['numberHero', 'numberXL', 'numberLarge', 'numberMedium', 'numberSmall', 'numberXS']))
      .toEqual([112, 72, 48, 32, 22, 16]);
  });

  it('sets words in Google Sans Flex and figures in Roboto Condensed', () => {
    expect(android.typography.displayLarge).toMatchObject({ fontFamily: 'GoogleSansFlex_700Bold', fontWeight: '700' });
    expect(android.typography.headlineMedium).toMatchObject({ fontFamily: 'GoogleSansFlex_700Bold', fontWeight: '700' });
    expect(android.typography.titleLarge).toMatchObject({ fontFamily: 'GoogleSansFlex_600SemiBold', fontWeight: '600' });
    expect(android.typography.bodyMedium).toMatchObject({ fontFamily: 'GoogleSansFlex_400Regular', fontWeight: '400' });
    expect(android.typography.labelSmall).toMatchObject({ fontFamily: 'GoogleSansFlex_600SemiBold', fontWeight: '600' });
    expect(android.typography.labelSmallEmphasized).toMatchObject({ fontFamily: 'GoogleSansFlex_700Bold', fontWeight: '700' });
    for (const name of scaleNames.filter((key) => key.startsWith('number'))) {
      expect(android.typography[name]).toMatchObject({ fontFamily: 'RobotoCondensed_700Bold', fontWeight: '700' });
    }
  });

  it.each(['android', 'ios'] as const)('only names weights that have a bundled file on %s, so Android never fakes bold', (platform) => {
    const theme = platform === 'android' ? android : ios;
    for (const variant of variants) {
      for (const style of [theme.typography[variant], theme.devanagariTypography[variant]]) {
        expect({ variant, bundled: isBundled(style.fontFamily, style.fontWeight) }).toEqual({ variant, bundled: true });
      }
    }
  });

  it('keeps the original variant names rendering as before', () => {
    expect(Object.keys(typeAliases).sort()).toEqual(['body', 'caption', 'display', 'headline', 'label', 'number', 'title']);
    const t = android.typography;
    expect(t.headline).toEqual({ fontFamily: 'GoogleSansFlex_700Bold', fontSize: 32, lineHeight: 40, fontWeight: '700' });
    expect(t.title).toEqual({ fontFamily: 'GoogleSansFlex_600SemiBold', fontSize: 22, lineHeight: 28, fontWeight: '600' });
    expect(t.body).toEqual({ fontFamily: 'GoogleSansFlex_400Regular', fontSize: 16, lineHeight: 24, fontWeight: '400' });
    expect(t.label).toEqual({ fontFamily: 'GoogleSansFlex_600SemiBold', fontSize: 14, lineHeight: 20, fontWeight: '600' });
    expect(t.caption).toEqual({ fontFamily: 'GoogleSansFlex_400Regular', fontSize: 12, lineHeight: 16, fontWeight: '400' });
    expect(t.number).toEqual({ fontFamily: 'RobotoCondensed_700Bold', fontSize: 48, lineHeight: 52, fontWeight: '700' });
    // Display keeps its 44 dp size; its line box grows from 48 to 52 to meet the words ratio below.
    expect(t.display).toEqual({ fontFamily: 'GoogleSansFlex_700Bold', fontSize: 44, lineHeight: 52, fontWeight: '700' });
    for (const [alias, name] of Object.entries(typeAliases) as [TypeVariant, TypeVariant][]) {
      expect(android.devanagariTypography[alias]).toEqual(android.devanagariTypography[name]);
      expect(android.maxFontSizeMultiplier[alias]).toBe(android.maxFontSizeMultiplier[name]);
    }
  });

  it('adapts body text to 17 pt on iOS and nowhere else', () => {
    expect(ios.typography.bodyLarge.fontSize).toBe(17);
    expect(ios.typography.body).toEqual(ios.typography.bodyLarge);
    expect(android.typography.bodyLarge.fontSize).toBe(16);
    expect(createTheme(momentum, 'dark', 'web').typography.bodyLarge.fontSize).toBe(16);
    expect(ios.devanagariTypography.bodyLarge).toMatchObject({ fontSize: 17, lineHeight: 28 });
  });

  it.each(['android', 'ios'] as const)('keeps every line box tall enough for its script on %s', (platform) => {
    const theme = platform === 'android' ? android : ios;
    for (const variant of variants) {
      const latin = theme.typography[variant];
      const hindi = theme.devanagariTypography[variant];
      const figures = latin.fontFamily === fontFiles.figures['700'];
      expect({ variant, ratio: latin.lineHeight / latin.fontSize >= (figures ? 1 : WORDS_MIN_LINE_RATIO) })
        .toEqual({ variant, ratio: true });
      expect(hindi.lineHeight).toBeGreaterThanOrEqual(latin.lineHeight);
      if (devanagariFamilies.includes(hindi.fontFamily)) {
        expect({ variant, ratio: hindi.lineHeight / hindi.fontSize >= DEVANAGARI_MIN_LINE_RATIO })
          .toEqual({ variant, ratio: true });
      }
      expect([latin.lineHeight % 4, hindi.lineHeight % 4]).toEqual([0, 0]);
    }
  });
});

describe('semantic family and weight mapping', () => {
  it('resolves a role and an exact bundled weight to its registered family', () => {
    expect(fontFamilyFor('words', '600')).toBe('GoogleSansFlex_600SemiBold');
    expect(fontFamilyFor('figures', '700')).toBe('RobotoCondensed_700Bold');
    expect(fontFamilyFor('devanagari', '400')).toBe('NotoSansDevanagari_400Regular');
  });

  it('refuses a weight that is not bundled instead of falling back silently', () => {
    expect(() => fontFamilyFor('figures', '400')).toThrow('No bundled figures font at weight 400');
    expect(() => fontFamilyFor('devanagari', '600')).toThrow('No bundled devanagari font at weight 600');
  });

  it('picks the nearest bundled weight for a script that lacks the requested one', () => {
    expect(nearestBundledWeight('words', '600')).toBe('600');
    expect(nearestBundledWeight('devanagari', '600')).toBe('700');
    expect(nearestBundledWeight('devanagari', '400')).toBe('400');
    expect(nearestBundledWeight('figures', '400')).toBe('700');
  });
});

describe('Hindi typography', () => {
  it('sets Hindi words in Noto Sans Devanagari at the nearest bundled weight', () => {
    const d = android.devanagariTypography;
    expect(d.bodyLarge).toEqual({ fontFamily: 'NotoSansDevanagari_400Regular', fontSize: 16, lineHeight: 28, fontWeight: '400' });
    expect(d.titleLarge).toEqual({ fontFamily: 'NotoSansDevanagari_700Bold', fontSize: 22, lineHeight: 36, fontWeight: '700' });
    expect(d.labelSmall).toEqual({ fontFamily: 'NotoSansDevanagari_700Bold', fontSize: 11, lineHeight: 20, fontWeight: '700' });
    expect(d.displayLarge).toEqual({ fontFamily: 'NotoSansDevanagari_700Bold', fontSize: 56, lineHeight: 92, fontWeight: '700' });
  });

  it('keeps figures in Roboto Condensed, because Hindi screens use Latin digits', () => {
    for (const name of scaleNames.filter((key) => key.startsWith('number'))) {
      expect(android.devanagariTypography[name]).toEqual(android.typography[name]);
    }
  });
});

describe('text scaling up to 200% (PRD §23.1)', () => {
  it('lets text up to 24 dp follow the OS setting all the way to 200%', () => {
    for (const variant of variants.filter((name) => android.typography[name].fontSize <= 24)) {
      expect(android.maxFontSizeMultiplier[variant]).toBe(2);
      for (const script of ['latin', 'devanagari'] as const) {
        const base = rendered(android, variant, 1, script);
        expect(rendered(android, variant, 2, script)).toEqual({ fontSize: base.fontSize * 2, lineHeight: base.lineHeight * 2 });
      }
    }
  });

  it('grows larger display text and figures less, never shrinks them and stops at 100 dp', () => {
    for (const variant of variants) {
      const cap = android.maxFontSizeMultiplier[variant];
      expect(cap).toBeGreaterThanOrEqual(1);
      expect(cap).toBeLessThanOrEqual(2);
      expect(rendered(android, variant, 2).fontSize).toBeGreaterThanOrEqual(rendered(android, variant, 1).fontSize);
    }
    expect(android.maxFontSizeMultiplier.displayLarge).toBeLessThan(2);
    expect(android.maxFontSizeMultiplier.numberHero).toBe(1);
    expect(rendered(android, 'numberHero', 2)).toEqual({ fontSize: 112, lineHeight: 120 });
    expect(maxFontSizeMultiplierFor(100)).toBe(1);
    expect(maxFontSizeMultiplierFor(24)).toBe(2);
    expect(maxFontSizeMultiplierFor(56)).toBe(1.58);
  });

  it.each([1, 1.3, 1.5, 2])('keeps the hierarchy at %sx: a smaller step never renders larger', (fontScale) => {
    for (const small of scaleNames) {
      for (const large of scaleNames.filter((name) => typeScale[name].fontSize > typeScale[small].fontSize)) {
        expect({ small, large, ordered: rendered(android, small, fontScale).fontSize < rendered(android, large, fontScale).fontSize })
          .toEqual({ small, large, ordered: true });
      }
    }
  });

  it('keeps Hindi line boxes proportionally tall at 200%', () => {
    for (const variant of variants.filter((name) => devanagariFamilies.includes(android.devanagariTypography[name].fontFamily))) {
      const { fontSize, lineHeight } = rendered(android, variant, 2, 'devanagari');
      expect({ variant, ratio: lineHeight / fontSize >= DEVANAGARI_MIN_LINE_RATIO }).toEqual({ variant, ratio: true });
    }
  });

  it('follows React Native cap semantics: a cap of 1 or more limits, 0 means none', () => {
    expect(effectiveFontScale(2, 1.5)).toBe(1.5);
    expect(effectiveFontScale(1.3, 1.5)).toBe(1.3);
    expect(effectiveFontScale(0.85, 2)).toBe(0.85);
    expect(effectiveFontScale(2, 0)).toBe(2);
  });
});
