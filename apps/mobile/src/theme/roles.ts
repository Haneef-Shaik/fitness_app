import type { ThemeColors } from './types';

export type ColorRole = keyof ThemeColors;

/**
 * Every semantic colour role, in palette order. `satisfies` makes the compiler reject a role missing
 * here or unknown to ThemeColors, so tests and the palette generator cannot drift from the contract.
 */
const paletteOrder = {
  surface: true,
  surfaceLow: true,
  surfaceContainer: true,
  surfaceHigh: true,
  surfaceHighest: true,
  onSurface: true,
  onSurfaceVariant: true,
  outline: true,
  outlineVariant: true,
  primary: true,
  onPrimary: true,
  primaryContainer: true,
  onPrimaryContainer: true,
  secondaryContainer: true,
  onSecondaryContainer: true,
  error: true,
  errorContainer: true,
  onErrorContainer: true,
  dataTrain: true,
  dataFuel: true,
  dataGold: true,
  dataGoldContainer: true,
  onDataGoldContainer: true,
  dataStreak: true,
  dataStreakContainer: true,
  coachInk: true,
  coachContainer: true,
  onCoachContainer: true,
  coachOutline: true,
  gymBrand: true,
  onGymBrand: true,
} as const satisfies Record<ColorRole, true>;

export const colorRoles = Object.keys(paletteOrder) as readonly ColorRole[];
