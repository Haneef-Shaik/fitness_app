/**
 * Which colour a text tone is drawn in.
 *
 * Text never uses a raw status hex: docs/05 lets `warn` and `serious` sit
 * below 3:1 on light surfaces *because the icon and label carry the meaning*,
 * and a label drawn in that colour would remove the mitigation. So status
 * tones read their `*Ink` shade — the same hue, dark enough for 4.5:1 — and
 * the reserved hexes stay for fills and icons (`contrast.test.ts`).
 */
import type { Colors } from '../theme/tokens';

export const TEXT_TONES = [
  'ink', 'ink2', 'ink3', 'accent', 'good', 'warn', 'serious', 'crit', 'accentInk',
] as const;
export type TextTone = (typeof TEXT_TONES)[number];

const INK: Partial<Record<TextTone, keyof Colors>> = {
  good: 'goodInk', warn: 'warnInk', serious: 'seriousInk', crit: 'critInk',
};

export function textColor(c: Colors, tone: TextTone): string {
  return c[INK[tone] ?? tone] as string;
}
