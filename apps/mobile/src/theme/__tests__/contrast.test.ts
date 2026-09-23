/**
 * Every text tone, in both themes, on every background it is drawn on, meets
 * WCAG 1.4.3 (4.5:1).
 *
 * Found in G10's light-theme check on a phone: the sync banner's "3 changes
 * couldn't sync" was #EC835A on #EDEFEB — 2.28:1. docs/05 accepts that the
 * STATUS colours sit below 3:1 on light surfaces "because the icon and label
 * are the mitigation"; but the app was drawing the label itself in the status
 * colour, which removes the mitigation. Text now uses a `*Ink` shade of the
 * same hue; the reserved status hexes stay for fills and icons.
 */
import { palette, type Colors } from '../tokens';
import { textColor, TEXT_TONES } from '../../ui/textTone';

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
};

const BACKGROUNDS: (keyof Colors)[] = ['page', 'surface', 'sunken'];

describe.each(['dark', 'light'] as const)('%s theme', (scheme) => {
  const c = palette[scheme];
  it.each(TEXT_TONES.filter((t) => t !== 'accentInk'))('%s text reads at 4.5:1 on every background', (tone) => {
    for (const bg of BACKGROUNDS) {
      const ratio = contrast(textColor(c, tone), c[bg] as string);
      expect({ tone, bg, ratio: Math.round(ratio * 100) / 100 })
        .toEqual(expect.objectContaining({ tone, bg }));
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('accentInk reads at 4.5:1 on the accent it is drawn on', () => {
    expect(contrast(textColor(c, 'accentInk'), c.accent)).toBeGreaterThanOrEqual(4.5);
  });

  it('keeps the reserved status hexes untouched for fills and icons (docs/05 §2.4)', () => {
    expect([c.good, c.warn, c.serious, c.crit]).toEqual(
      scheme === 'dark'
        ? ['#3FD07B', '#FAB219', '#EC835A', '#FF6B6B']
        : ['#0C8F3C', '#FAB219', '#EC835A', '#D03B3B'],
    );
  });
});

describe('no text is drawn in a raw status colour', () => {
  it('status hexes are for fills and icons; text goes through the *Ink shades', () => {
    const { readFileSync } = require('fs');
    const { join } = require('path');
    const { sync: glob } = require('glob');
    const root = join(__dirname, '..', '..', '..');
    const offenders: string[] = [];
    for (const f of glob('{app,src}/**/*.tsx', { cwd: root }) as string[]) {
      if (f.includes('__tests__')) continue;
      const src: string = readFileSync(join(root, f), 'utf8');
      // `color:` (text colour) or a Pill/label `fg:` taking a raw status token.
      src.split('\n').forEach((line, i) => {
        if (/\b(color|fg)\s*:[^,}]*\bc\.(good|warn|serious|crit)\b(?!Ink)/.test(line)) offenders.push(`${f}:${i + 1}`);
      });
    }
    expect(offenders).toEqual([]);
  });
});
