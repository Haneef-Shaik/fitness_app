# Changing FitLog's theme

Screens use semantic roles such as `surface`, `onSurface`, `primaryContainer` and
`onPrimaryContainer`, so visual changes are made centrally.

| Change | Edit |
| --- | --- |
| Current dark/light colors | `apps/mobile/src/theme/themes/momentum.json` |
| Spacing, shapes, type sizes, font slots and shared dimensions | `apps/mobile/src/theme/tokens.ts` |
| Platform adaptations | `apps/mobile/src/theme/theme.ts` |
| Replace the entire palette | Add a `ThemeDefinition` and pass it to the root `ThemeProvider` |
| A component's appearance in every feature | Its shared primitive in `apps/mobile/src/ui/` |

For example, changing the `primaryContainer`/`onPrimaryContainer` pair in both palettes updates
the shared primary button and the Appearance preview. Always change foreground/background pairs
together and run `pnpm check`. Do not rename role keys just because the accent changes.

```tsx
import { useTheme } from '@/theme';
import { AppText } from '@/ui';
import { View } from 'react-native';

export function Example() {
  const { theme } = useTheme();
  return (
    <View style={{
      backgroundColor: theme.colors.surfaceContainer,
      padding: theme.spacing.xl,
      borderRadius: theme.radius.card,
    }}>
      <AppText variant="title">Example</AppText>
    </View>
  );
}
```

Real product copy goes through `t()` and both catalogs. Prefer `AppButton`, `AppText` and `Screen`
before introducing a feature-specific component. Keep text scaling enabled and use minimum heights,
not fixed heights, for text-bearing controls. Keep the application's `userInterfaceStyle` automatic
so the system preference works on both platforms; retain `expo-system-ui` for Android.

## Adding a palette

```tsx
import type { ThemeDefinition } from '@/theme';
import { ThemeProvider } from '@/theme';
import candidate from './my-palette.json';

const myTheme = candidate satisfies ThemeDefinition;
// In the root layout:
// <ThemeProvider definition={myTheme}>...</ThemeProvider>
```

A complete palette must have both light/dark modes and every semantic role. There is one chosen
brand palette, not an end-user accent picker. Theme preference (`system`/`light`/`dark`) is separate
from the palette definition. Never use coach violet for ordinary actions, gym branding outside gym
surfaces, or error red for decorative data. In light mode, use `primary`/`dataTrain` for accent text
and graphics; the lime `primaryContainer` is a fill and lacks contrast as a thin line on paper.

To generate a starting candidate from a new seed:

```bash
pnpm --filter @fitlog/mobile theme:generate '#C6F432'
```

This prints JSON using Material's Vibrant scheme, 2025 specification, phone platform, contrast 0.
It does not edit production. The committed Figma palette contains curated colors, and the installed
color-utilities version produces different values even for the original seed. Keep the approved
palette until a deliberate visual change is accepted. Review contrast, error/coach/gym separation
and both native modes before adopting a generated candidate. Coach ink and gym branding remain
from the approved definition in candidates; review them against any changed surfaces.

`pnpm check` measures the committed palette. When adding another shipping definition, include it in
the contrast matrix as well. The gallery is reachable through Appearance in development and hidden
in production. It shows primary/secondary actions, loading/disabled states and type styles.

Google Sans Flex, Roboto Condensed and Noto Sans Devanagari are bundled through explicit font-weight
imports in the root layout, with OFL notices in `apps/mobile/assets/licenses/`. Change the font slots
and matching loader together; setting a family name alone does not install a font. Hindi text uses
its own family and line-height allowance. Native Hindi/large-text QA is still required.
