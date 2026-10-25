import { createTheme, resolveColorScheme } from '../theme';
import { momentum } from '../themes/momentum';

function luminance(hex: string) {
  const channels = hex.slice(1).match(/../g)!.map((channel) => {
    const value = Number.parseInt(channel, 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return channels[0]! * 0.2126 + channels[1]! * 0.7152 + channels[2]! * 0.0722;
}

function contrast(a: string, b: string) {
  const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (values[0]! + 0.05) / (values[1]! + 0.05);
}

describe('theme contract', () => {
  it('follows the system by default and keeps an explicit preference', () => {
    expect(resolveColorScheme('system', 'dark')).toBe('dark');
    expect(resolveColorScheme('system', 'light')).toBe('light');
    expect(resolveColorScheme('system', null)).toBe('light');
    expect(resolveColorScheme('dark', 'light')).toBe('dark');
    expect(resolveColorScheme('light', 'dark')).toBe('light');
  });

  it('keeps the same roles in both modes and supports replacement themes', () => {
    const dark = createTheme(momentum, 'dark', 'android');
    const light = createTheme(momentum, 'light', 'android');
    expect(Object.keys(dark.colors).sort()).toEqual(Object.keys(light.colors).sort());
    const replacement = {
      ...momentum,
      id: 'replacement',
      colors: { ...momentum.colors, dark: { ...momentum.colors.dark, primary: '#FFFFFF' } },
    };
    expect(createTheme(replacement, 'dark', 'android').colors.primary).toBe('#FFFFFF');
    expect(momentum.colors.dark.primary).toBe('#CAFD00');
  });

  it('adapts native typography and touch targets centrally', () => {
    const android = createTheme(momentum, 'dark', 'android');
    const ios = createTheme(momentum, 'dark', 'ios');
    expect(android.dimensions.touchTarget).toBeGreaterThanOrEqual(48);
    expect(ios.dimensions.touchTarget).toBeGreaterThanOrEqual(44);
    expect(ios.typography.body.fontSize).toBe(17);
  });

  it.each(['dark', 'light'] as const)('%s has accessible text, actions and indicators', (scheme) => {
    const c = createTheme(momentum, scheme, 'android').colors;
    for (const surface of [c.surface, c.surfaceContainer, c.surfaceHigh, c.surfaceHighest]) {
      expect(contrast(c.onSurface, surface)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(c.onSurfaceVariant, surface)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(c.primary, surface)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(c.outline, surface)).toBeGreaterThanOrEqual(3);
    }
    for (const [foreground, background] of [
      [c.onPrimary, c.primary],
      [c.onPrimaryContainer, c.primaryContainer],
      [c.onSecondaryContainer, c.secondaryContainer],
      [c.onErrorContainer, c.errorContainer],
      [c.coachInk, c.coachContainer],
      [c.onGymBrand, c.gymBrand],
    ]) {
      expect(contrast(foreground!, background!)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('keeps light-mode graphics dark enough rather than using the lime fill', () => {
    const c = momentum.colors.light;
    expect(contrast(c.primaryContainer, c.surface)).toBeLessThan(1.5);
    expect(contrast(c.dataTrain, c.surface)).toBeGreaterThanOrEqual(4.5);
    expect(c.dataTrain).not.toBe(c.primaryContainer);
    expect(momentum.colors.dark.dataTrain).toBe(momentum.colors.dark.dataFuel);
  });
});
