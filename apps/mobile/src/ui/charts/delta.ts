/**
 * How a change is toned (**I11: a regression is never red**).
 *
 * A lighter week is information, not an error. Colouring a decrease red tells
 * someone their deload was a mistake, and it makes the one colour that should
 * mean "something is wrong" mean "you did less", which spends it.
 *
 * So the palette here has two tones and neither is `crit`: up reads as good,
 * everything else reads as neutral ink.
 */
export type DeltaTone = 'good' | 'ink2';

export function deltaTone(delta: number): DeltaTone {
  return delta > 0 ? 'good' : 'ink2';
}

/** "▲ 2.5" / "▼ 1.2" / "—". The arrow carries the direction, not the colour. */
export function formatDelta(delta: number, unit = ''): string {
  if (delta === 0) return '—';
  const arrow = delta > 0 ? '▲' : '▼';
  return `${arrow} ${Math.abs(delta).toLocaleString('en-US')}${unit}`;
}
