# Changing FitLog's theme

Screens use semantic roles such as `surface`, `onSurface`, `primaryContainer` and
`onPrimaryContainer`, so visual changes are made centrally.

| Change | Edit |
| --- | --- |
| Current dark/light colors | `apps/mobile/src/theme/themes/momentum.recipe.json`, then regenerate `momentum.json` (below) |
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

## Regenerating the palette

`momentum.json` is generated; never edit it by hand. Its source is `momentum.recipe.json`: seed `#C6F432`
and Material's Vibrant scheme (2025 specification, phone platform, contrast 0). Each role comes from a
Material colour (`scheme:<colour>`), copies another role (`alias:<role>`), or is a fixed brand value
(`brand`: coach violet and the default gym red). The approved Figma palette is curated: no Material
setting reproduces it (DS-1 evidence). Each curation pins the approved value and records the Material
value it replaces (`mcu`), so a changed seed or library fails loudly.

```bash
pnpm --filter @fitlog/mobile theme:generate            # --check: fail on any difference (Jest runs this too)
pnpm --filter @fitlog/mobile theme:generate --write    # regenerate momentum.json after editing the recipe
pnpm --filter @fitlog/mobile theme:generate --report   # each role: source, Material value, palette value
pnpm --filter @fitlog/mobile theme:generate --record   # after reviewing a seed/library change: re-record mcu
pnpm --filter @fitlog/mobile theme:generate '#FF5A1F'  # print an uncurated candidate for another seed
```

`--record` never changes a pinned value. It drops a pin Material already matches, so that role then
comes straight from the seed. A candidate keeps the recipe's coach and gym values; review them against
any changed surfaces. Review contrast, error/coach/gym separation and both native modes before adopting
one. Keep the approved palette until a deliberate visual change is accepted.

The contrast matrix (`src/theme/__tests__/contrast.test.ts`, run by `pnpm check`) measures the
committed palette in both schemes. It measures a named list of role pairs, not every pair a screen can
draw:
- each text, figure and accent ink, and `outline`, on the five surfaces;
- each label on its own filled container, across the action, data, error, coach and gym families;
- AppButton's focus ring, which is its label colour on the fill it is drawn on;
- the light-lime rule.

Every role that carries meaning must appear in at least one pair, or be listed there as decorative. A
new role must join the matrix the same way. When adding another shipping definition, include it in the
matrix as well.

What the matrix does not prove:
- **The light coach outline is a known gap.** The light `coachOutline` on `coachContainer` is pinned at
  its measured 2.70:1, below the 3:1 bar. Coach violet, as that border or as ink, is decoration only and
  is not accessibility evidence. An AI proposal must not be identified by it. The card must show a
  visible text label naming it a proposal, be identifiable as interactive on its own (a visible text
  control or a boundary of at least 3:1), and have no state that depends on the outline. The proposal
  card's contract belongs to DS-4, and this matrix does not test it.
- **Some pairs are not in the list.** It does not measure a focus ring against the surface outside its
  button, the pressed border, or a selected or logged state shown only by a change of fill.
- **It is not a pixel check.** It does arithmetic on the palette, not on rendered pixels on a device.

Literal colours belong only in `src/theme/themes/`. `scripts/lint-rules/no-literal-color.cjs` is the
DS-1 colour guard. It catches hex, `rgb()`/`hsl()`/`hwb()`, named colours in colour positions, colours
inside longer strings and template literals, numeric colours, and `PlatformColor`/`DynamicColorIOS`.
Until it is wired into `eslint.config.js`, the older selector there guards plain hex/rgb/hsl strings. The gallery is reachable through Appearance in development and hidden
in production. It shows primary/secondary actions, loading/disabled states and type styles.

Google Sans Flex, Roboto Condensed and Noto Sans Devanagari are bundled through explicit font-weight
imports in the root layout, with OFL notices in `apps/mobile/assets/licenses/`. Change the font slots
and matching loader together; setting a family name alone does not install a font. Hindi text uses
its own family and line-height allowance. Native Hindi/large-text QA is still required.
