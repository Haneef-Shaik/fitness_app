import { dimensions, radius, spacing } from './tokens';
import { createTypography } from './typography';
import type { ColorScheme, ThemeDefinition, ThemePlatform, ThemePreference } from './types';

export function resolveColorScheme(
  preference: ThemePreference,
  systemScheme: ColorScheme | null | undefined,
): ColorScheme {
  return preference === 'system' ? (systemScheme ?? 'light') : preference;
}

export function createTheme(definition: ThemeDefinition, scheme: ColorScheme, platform: ThemePlatform) {
  const type = createTypography(platform);
  return {
    id: definition.id,
    scheme,
    colors: definition.colors[scheme],
    spacing,
    radius,
    dimensions,
    /** Latin text styles by variant; Hindi text uses `devanagariTypography` with the same names. */
    typography: type.latin,
    devanagariTypography: type.devanagari,
    /** Pass as `<Text maxFontSizeMultiplier>` for the same variant (PRD §23.1 text scaling). */
    maxFontSizeMultiplier: type.maxFontSizeMultiplier,
  } as const;
}

export type AppTheme = ReturnType<typeof createTheme>;
