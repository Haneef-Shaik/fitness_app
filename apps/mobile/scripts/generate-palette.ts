import { argbFromHex, hexFromArgb, Hct, SchemeVibrant } from '@material/material-color-utilities';
import { momentum } from '../src/theme/themes/momentum';
import type { ColorScheme, ThemeColors, ThemeDefinition } from '../src/theme/types';

const seed = process.argv[2] ?? '#C6F432';
if (!/^#[\da-f]{6}$/i.test(seed)) {
  throw new Error('Pass a six-digit hex seed, for example: theme:generate "#C6F432"');
}

function colorsFor(mode: ColorScheme): ThemeColors {
  const scheme = new SchemeVibrant(Hct.fromInt(argbFromHex(seed)), mode === 'dark', 0, '2025', 'phone');
  const hex = (value: number) => hexFromArgb(value).toUpperCase();
  return {
    ...momentum.colors[mode],
    surface: hex(scheme.surface),
    surfaceLow: hex(scheme.surfaceContainerLow),
    surfaceContainer: hex(scheme.surfaceContainer),
    surfaceHigh: hex(scheme.surfaceContainerHigh),
    surfaceHighest: hex(scheme.surfaceContainerHighest),
    onSurface: hex(scheme.onSurface),
    onSurfaceVariant: hex(scheme.onSurfaceVariant),
    outline: hex(scheme.outline),
    outlineVariant: hex(scheme.outlineVariant),
    primary: hex(scheme.primary),
    onPrimary: hex(scheme.onPrimary),
    primaryContainer: hex(scheme.primaryContainer),
    onPrimaryContainer: hex(scheme.onPrimaryContainer),
    secondaryContainer: hex(scheme.secondaryContainer),
    onSecondaryContainer: hex(scheme.onSecondaryContainer),
    error: hex(scheme.error),
    errorContainer: hex(scheme.errorContainer),
    onErrorContainer: hex(scheme.onErrorContainer),
    dataTrain: hex(scheme.primary),
    dataFuel: hex(scheme.primary),
    dataGold: hex(scheme.primary),
    dataStreak: hex(scheme.onSurfaceVariant),
    coachContainer: hex(scheme.surfaceContainerHigh),
  };
}

// Print a candidate only. Never silently overwrite the Figma-approved production palette.
const candidate: ThemeDefinition = {
  id: `custom-${seed.slice(1).toLowerCase()}`,
  colors: { dark: colorsFor('dark'), light: colorsFor('light') },
};
process.stdout.write(`${JSON.stringify(candidate, null, 2)}\n`);
