import { contrastRatio, relativeLuminance } from '../contrast';
import { colorRoles, type ColorRole } from '../roles';
import { momentum } from '../themes/momentum';
import type { ColorScheme } from '../types';

/** WCAG 2.2 SC 1.4.3: normal-size text, figures and icon labels. */
const TEXT = 4.5;
/** WCAG 2.2 SC 1.4.11: graphics and the boundaries that identify a component. */
const NON_TEXT = 3;

const schemes = ['dark', 'light'] as const satisfies readonly ColorScheme[];
const surfaces = [
  'surface', 'surfaceLow', 'surfaceContainer', 'surfaceHigh', 'surfaceHighest',
] as const satisfies readonly ColorRole[];

/** Roles drawn as text, figures or icons directly on any surface. */
const inkOnSurfaces = [
  'onSurface', 'onSurfaceVariant', 'primary', 'dataTrain', 'dataFuel', 'dataGold', 'dataStreak', 'error', 'coachInk',
] as const satisfies readonly ColorRole[];
/** Roles drawn as lines or component boundaries directly on any surface. */
const strokesOnSurfaces = ['outline'] as const satisfies readonly ColorRole[];

type Family = 'text' | 'action' | 'data' | 'error' | 'coach' | 'gym';
interface Pair { readonly family: Family; readonly foreground: ColorRole; readonly background: ColorRole; readonly min: number }

/** Foregrounds on their own filled container: labels, icons and figures. */
const containerPairs: readonly Pair[] = [
  { family: 'action', foreground: 'onPrimary', background: 'primary', min: TEXT },
  { family: 'action', foreground: 'onPrimaryContainer', background: 'primaryContainer', min: TEXT },
  { family: 'action', foreground: 'onSecondaryContainer', background: 'secondaryContainer', min: TEXT },
  { family: 'data', foreground: 'onDataGoldContainer', background: 'dataGoldContainer', min: TEXT },
  { family: 'data', foreground: 'dataStreak', background: 'dataStreakContainer', min: TEXT },
  { family: 'error', foreground: 'onErrorContainer', background: 'errorContainer', min: TEXT },
  { family: 'coach', foreground: 'coachInk', background: 'coachContainer', min: TEXT },
  { family: 'coach', foreground: 'onCoachContainer', background: 'coachContainer', min: TEXT },
  { family: 'coach', foreground: 'coachOutline', background: 'coachContainer', min: NON_TEXT },
  { family: 'gym', foreground: 'onGymBrand', background: 'gymBrand', min: TEXT },
];

/**
 * AppButton's focus ring (src/ui/AppButton.tsx): a 2 dp inset border in the button's label colour, drawn
 * on the fill it sits on: each variant's own fill, or surfaceHigh if focus is reported while the button is
 * disabled or loading (whether a device focuses it then is unverified; see app-button-focus.test.tsx). At
 * rest that border is the fill colour, so this ratio is also the change that focus makes. `primary`
 * cannot be the ring: Dark draws it in primaryContainer's own lime.
 */
const focusRingPairs: readonly Pair[] = [
  { family: 'action', foreground: 'onPrimaryContainer', background: 'primaryContainer', min: NON_TEXT },
  { family: 'action', foreground: 'onSecondaryContainer', background: 'secondaryContainer', min: NON_TEXT },
  { family: 'action', foreground: 'onSurfaceVariant', background: 'surfaceHigh', min: NON_TEXT },
];
const focusRingCases = schemes.flatMap((scheme) => focusRingPairs.map((pair) => ({ scheme, ...pair })));

const familyOf = (role: ColorRole): Family => {
  if (role.startsWith('data')) return 'data';
  if (role.startsWith('coach')) return 'coach';
  if (role === 'error') return 'error';
  if (role === 'primary') return 'action';
  return 'text';
};

const surfacePairs: readonly Pair[] = surfaces.flatMap((background) => [
  ...inkOnSurfaces.map((foreground) => ({ family: familyOf(foreground), foreground, background, min: TEXT })),
  ...strokesOnSurfaces.map((foreground) => ({ family: 'action' as const, foreground, background, min: NON_TEXT })),
]);

/** Purely decorative roles; nothing depends on telling them apart from their surroundings. */
const decorativeRoles: readonly ColorRole[] = ['outlineVariant'];

interface Gap { readonly scheme: ColorScheme; readonly foreground: ColorRole; readonly background: ColorRole; readonly measured: number }
/**
 * Pairs that measure below their bar, each pinned to its measured ratio, so a palette change has to
 * revisit it. A gap is removed only when the pair passes; adding one needs a recorded decision.
 *
 * Light coach outline: the Figma-approved #9B7BFF dashed border on the #EFEEE4 card, 2.70:1. Codex's
 * decision (27 Oct 2026) keeps the approved palette and its 33 curated pins, so this border may only
 * decorate: nothing may be identified by it. That holds only while every AI proposal:
 *  - shows a visible text label naming it a proposal. Violet ink is colour, so it never identifies one,
 *    and a screen-reader label alone is not enough;
 *  - if it can be acted on, is identifiable as interactive on its own, by a visible text control or by
 *    a boundary of at least 3:1 against what it sits on;
 *  - has no state (accepted, unsure, ticked) that depends on the outline.
 * These conditions belong to DS-4's proposal card and are not tested here. The decision is recorded in
 * docs/plan/runs/DS-1/handoff.md.
 */
const knownGaps: readonly Gap[] = [
  { scheme: 'light', foreground: 'coachOutline', background: 'coachContainer', measured: 2.7 },
];
const isKnownGap = (scheme: ColorScheme, pair: Pair) => knownGaps.some((gap) =>
  gap.scheme === scheme && gap.foreground === pair.foreground && gap.background === pair.background);

const cases = schemes.flatMap((scheme) => [...surfacePairs, ...containerPairs]
  .filter((pair) => !isKnownGap(scheme, pair))
  .map((pair) => ({ scheme, ...pair })));

describe('WCAG contrast helpers', () => {
  it('measures the reference extremes exactly', () => {
    expect(relativeLuminance('#FFFFFF')).toBe(1);
    expect(relativeLuminance('#000000')).toBe(0);
    expect(contrastRatio('#FFFFFF', '#000000')).toBe(21);
    expect(contrastRatio('#000000', '#FFFFFF')).toBe(21);
    expect(contrastRatio('#777777', '#777777')).toBe(1);
  });

  it('matches a published WCAG value', () => {
    // #767676 on white is the well-known lightest grey that passes AA: 4.54:1.
    expect(contrastRatio('#767676', '#FFFFFF')).toBeCloseTo(4.54, 2);
  });

  it.each(['', '#FFF', 'FFFFFF', '#GGGGGG', '#FFFFFF00', 'rgb(0,0,0)'])('rejects %p', (value) => {
    expect(() => relativeLuminance(value)).toThrow('#RRGGBB');
  });
});

describe('Momentum contrast matrix', () => {
  it.each(cases)('$scheme · $family · $foreground on $background ≥ $min:1', ({ scheme, foreground, background, min }) => {
    const colors = momentum.colors[scheme];
    expect(contrastRatio(colors[foreground], colors[background])).toBeGreaterThanOrEqual(min);
  });

  it.each(focusRingCases)('$scheme · focus ring · $foreground on $background ≥ $min:1', ({ scheme, foreground, background, min }) => {
    const colors = momentum.colors[scheme];
    expect(contrastRatio(colors[foreground], colors[background])).toBeGreaterThanOrEqual(min);
  });

  it.each(knownGaps)('pins the known gap: $scheme $foreground on $background ≈ $measured:1', (gap) => {
    const colors = momentum.colors[gap.scheme];
    const ratio = contrastRatio(colors[gap.foreground], colors[gap.background]);
    expect(ratio).toBeCloseTo(gap.measured, 1);
    expect(ratio).toBeLessThan(NON_TEXT);
  });

  it('pins every role that carries meaning, in both schemes', () => {
    const pinned = new Set<ColorRole>([...surfacePairs, ...containerPairs]
      .flatMap((pair) => [pair.foreground, pair.background]));
    const unpinned = colorRoles.filter((role) => !pinned.has(role) && !decorativeRoles.includes(role));
    expect(unpinned).toEqual([]);
  });

  it('covers every text, action, error, coach and gym family in both schemes', () => {
    const families = new Set(cases.map((testCase) => `${testCase.scheme}:${testCase.family}`));
    for (const scheme of schemes) {
      for (const family of ['text', 'action', 'data', 'error', 'coach', 'gym'] as const) {
        expect(families).toContain(`${scheme}:${family}`);
      }
    }
  });
});

describe('the light lime is a container, never ink', () => {
  const light = momentum.colors.light;

  it.each(surfaces)('the lime fill fails the graphics bar on light %s, so it is never a line or text', (surface) => {
    expect(contrastRatio(light.primaryContainer, light[surface])).toBeLessThan(NON_TEXT);
  });

  it('carries its own label at text contrast', () => {
    expect(contrastRatio(light.onPrimaryContainer, light.primaryContainer)).toBeGreaterThanOrEqual(TEXT);
  });

  it('is not reused by any ink or stroke role', () => {
    for (const role of [...inkOnSurfaces, ...strokesOnSurfaces, 'coachOutline'] as const) {
      expect({ role, value: light[role] }).not.toEqual({ role, value: light.primaryContainer });
    }
  });

  it.each(schemes)('%s draws accent graphics with the accent that holds contrast there', (scheme) => {
    const colors = momentum.colors[scheme];
    for (const role of ['dataTrain', 'dataFuel', 'dataGold'] as const) {
      expect({ role, value: colors[role] }).toEqual({ role, value: colors.primary });
    }
  });
});
