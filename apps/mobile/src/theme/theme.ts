import { dimensions, fontFamilies, fontWeights, radius, spacing, typeRamp } from './tokens';
import type { ColorScheme, ThemeDefinition, ThemePlatform, ThemePreference } from './types';

export function resolveColorScheme(
  preference: ThemePreference,
  systemScheme: ColorScheme | null | undefined,
): ColorScheme {
  return preference === 'system' ? (systemScheme ?? 'light') : preference;
}

export function createTheme(definition: ThemeDefinition, scheme: ColorScheme, platform: ThemePlatform) {
  const family = fontFamilies[platform];
  return {
    id: definition.id,
    scheme,
    colors: definition.colors[scheme],
    spacing,
    radius,
    dimensions,
    typography: {
      display: { ...typeRamp.display, fontFamily: fontWeights.bold },
      headline: { ...typeRamp.headline, fontFamily: fontWeights.bold },
      title: { ...typeRamp.title, fontFamily: fontWeights.medium },
      body: { ...typeRamp.body, fontFamily: family.body, ...(platform === 'ios' ? { fontSize: 17 } : {}) },
      label: { ...typeRamp.label, fontFamily: fontWeights.medium },
      caption: { ...typeRamp.caption, fontFamily: family.body },
      number: { ...typeRamp.number, fontFamily: family.numbers },
    },
  } as const;
}

export type AppTheme = ReturnType<typeof createTheme>;
