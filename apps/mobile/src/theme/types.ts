export type ColorScheme = 'light' | 'dark';
export type ThemePreference = ColorScheme | 'system';
export type ThemePlatform = 'ios' | 'android' | 'web';

/** Stable semantic roles. Components never depend on a particular hue or theme name. */
export interface ThemeColors {
  readonly surface: string;
  readonly surfaceLow: string;
  readonly surfaceContainer: string;
  readonly surfaceHigh: string;
  readonly surfaceHighest: string;
  readonly onSurface: string;
  readonly onSurfaceVariant: string;
  readonly outline: string;
  readonly outlineVariant: string;
  readonly primary: string;
  readonly onPrimary: string;
  readonly primaryContainer: string;
  readonly onPrimaryContainer: string;
  readonly secondaryContainer: string;
  readonly onSecondaryContainer: string;
  readonly error: string;
  readonly errorContainer: string;
  readonly onErrorContainer: string;
  readonly dataTrain: string;
  readonly dataFuel: string;
  readonly dataGold: string;
  readonly dataStreak: string;
  readonly coachInk: string;
  readonly coachContainer: string;
  readonly coachOutline: string;
  readonly gymBrand: string;
  readonly onGymBrand: string;
}

export interface ThemeDefinition {
  readonly id: string;
  readonly colors: Readonly<Record<ColorScheme, ThemeColors>>;
}

export interface PreferenceStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}
