import { createTheme, type AppTheme } from '../theme';
import { fontLicences } from '../font-licences';
import { momentum } from '../themes/momentum';
import { fontFiles, type FontRole } from '../tokens';
import type { TextStyleToken, TypeVariant } from '../typography';
import { bundledFontFile, glyphBounds, readFontFacts, type FontFileFacts, type GlyphBounds } from './font-file';

/** Sample text per role: ascenders, descenders, capitals, digits, punctuation, matras and conjuncts. */
const SAMPLES: Record<FontRole, string> = {
  words: 'Today Log set 80 kg × 8 Week 8 locked in Protein 44 g to go, Join gym? Quickly (jog) — 100%',
  figures: '0123456789.,×+−-:%₹',
  devanagari: 'आज सेट दर्ज करें प्रगति शुक्रवार पूर्ण ईंधन हृदय कृपया द्वितीय अर्ध स्क्वाट डेडलिफ़्ट ऊँचाई ₹१२३',
};

const fileFor = new Map(fontLicences.flatMap((entry) => entry.files.map((family) => [family, bundledFontFile(entry.package, family)] as const)));
const roleOf = new Map((Object.entries(fontFiles) as [FontRole, Record<string, string>][])
  .flatMap(([role, files]) => Object.values(files).map((family) => [family, role] as const)));
const bundled = (Object.entries(fontFiles) as [FontRole, Record<string, string>][])
  .flatMap(([role, files]) => Object.entries(files).map(([weight, family]) => [family, role, weight] as const));
const themes = { android: createTheme(momentum, 'dark', 'android'), ios: createTheme(momentum, 'dark', 'ios') };
const factsCache = new Map<string, FontFileFacts>();
const boundsCache = new Map<string, GlyphBounds>();

function fileOf(family: string): string {
  const file = fileFor.get(family);
  if (!file) throw new Error(`${family} is not in the licences registry`);
  return file;
}

function factsFor(family: string): FontFileFacts {
  const facts = factsCache.get(family) ?? readFontFacts(fileOf(family));
  factsCache.set(family, facts);
  return facts;
}

/** Glyph bounds of the sample for the font's own role. */
function sampleBoundsFor(family: string, role: FontRole): GlyphBounds {
  const bounds = boundsCache.get(family) ?? glyphBounds(fileOf(family), SAMPLES[role]);
  boundsCache.set(family, bounds);
  return bounds;
}

/**
 * React Native 0.86's Android line box (CustomLineHeightSpan): the gap between the line height and
 * the font's ascent + descent is split in half above and below, so a short line box trims both ends.
 */
function lineBox(style: TextStyleToken) {
  const { ascent, descent } = factsFor(style.fontFamily);
  const halfLeading = (style.lineHeight - style.fontSize * (ascent + descent)) / 2;
  return { above: style.fontSize * ascent + halfLeading, below: style.fontSize * descent + halfLeading };
}

function stylesOf(theme: AppTheme) {
  return (Object.keys(theme.typography) as TypeVariant[])
    .flatMap((variant) => [[variant, theme.typography[variant]], [`${variant} (Hindi)`, theme.devanagariTypography[variant]]] as const);
}

describe('bundled font files', () => {
  it.each(bundled)('%s (%s) declares the weight %s its token uses, so no weight is synthesised', (family, _role, weight) => {
    expect(factsFor(family).weightClass).toBe(Number(weight));
  });

  it.each(bundled)('%s has a glyph for every character of the %s sample', (family, role) => {
    expect(sampleBoundsFor(family, role).missing).toBe('');
  });

  it.each(['android', 'ios'] as const)('gives every Hindi style on %s a line box at least Noto Sans Devanagari\'s ascent + descent', (platform) => {
    const theme = themes[platform];
    const hindi = stylesOf(theme).filter(([, style]) => roleOf.get(style.fontFamily) === 'devanagari');
    expect(hindi.length).toBeGreaterThan(0);
    for (const [variant, style] of hindi) {
      const { ascent, descent } = factsFor(style.fontFamily);
      // A shorter box is trimmed at both ends, cutting matras above the headstroke and marks below.
      expect({ variant, fits: style.lineHeight >= Math.ceil(style.fontSize * (ascent + descent)) }).toEqual({ variant, fits: true });
    }
  });

  it.each(['android', 'ios'] as const)('keeps English, figure and Hindi sample glyphs inside every line box on %s', (platform) => {
    for (const [variant, style] of stylesOf(themes[platform])) {
      const role = roleOf.get(style.fontFamily);
      if (!role) throw new Error(`${variant} uses ${style.fontFamily}, which is not bundled`);
      const { yMax, yMin } = sampleBoundsFor(style.fontFamily, role);
      const { above, below } = lineBox(style);
      expect({ variant, top: above >= yMax * style.fontSize, bottom: below >= -yMin * style.fontSize })
        .toEqual({ variant, top: true, bottom: true });
    }
  });
});
