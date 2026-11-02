import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  diffPalettes,
  parseCommand,
  parseRecipe,
  RecipeError,
  recordCurations,
  reportLines,
  resolvePalette,
  schemeColors,
  serializePalette,
  serializeRecipe,
  UsageError,
  type PaletteRecipe,
  type SchemeColor,
  type SchemeSource,
} from '../../../scripts/palette/recipe';
import { colorRoles } from '../roles';
import { momentum } from '../themes/momentum';
import recipeJson from '../themes/momentum.recipe.json';
import type { ColorScheme } from '../types';

const themes = join(__dirname, '..', 'themes');
const recipeText = readFileSync(join(themes, 'momentum.recipe.json'), 'utf8');
const paletteText = readFileSync(join(themes, 'momentum.json'), 'utf8');

function freeze<T>(value: T): T {
  if (typeof value === 'object' && value !== null) {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}

function omit<T extends object>(record: T, key: keyof T): Partial<T> {
  return Object.fromEntries(Object.entries(record).filter(([name]) => name !== key)) as Partial<T>;
}

const committed = parseRecipe(recipeJson);
const schemeRoleCount = colorRoles.filter((role) => committed.roles[role].kind === 'scheme').length;
const curationCount = (recipe: PaletteRecipe) =>
  Object.keys(recipe.curations.dark).length + Object.keys(recipe.curations.light).length;

/** The committed value of a role the recipe takes straight from the seed, if any maps to this colour. */
function seedValue(scheme: ColorScheme, color: SchemeColor): string | undefined {
  const role = colorRoles.find((candidate) => {
    const source = committed.roles[candidate];
    return source.kind === 'scheme' && source.color === color && committed.curations[scheme][candidate] === undefined;
  });
  return role === undefined ? undefined : momentum.colors[scheme][role];
}
const fakeColor = (prefix: string, color: SchemeColor) =>
  `#${prefix}${schemeColors.indexOf(color).toString(16).padStart(2, '0').toUpperCase()}00`;
/** Material stand-in: the committed value where a role comes straight from the seed, a distinct colour elsewhere. */
const fakeMaterial: SchemeSource = (scheme, color) => seedValue(scheme, color) ?? fakeColor(scheme === 'dark' ? '10' : '20', color);
/** The stand-in after a seed change: every Material value moves, seed-derived ones included. */
const movedMaterial: SchemeSource = (scheme, color) => fakeColor(scheme === 'dark' ? '30' : '40', color);
/** Material moves only under the pins: re-recording must keep every pinned value. */
const movedUnderPins: SchemeSource = (scheme, color) => seedValue(scheme, color) ?? movedMaterial(scheme, color);

describe('the committed Momentum recipe', () => {
  it('is in canonical form, so --record rewrites only what changed', () => {
    expect(serializeRecipe(committed)).toBe(recipeText);
  });

  it('maps every theme role exactly once, from seed #C6F432 with the documented Material scheme', () => {
    expect(Object.keys(committed.roles)).toEqual(colorRoles);
    expect(committed.seed).toBe('#C6F432');
    expect(committed.scheme).toEqual({ variant: 'vibrant', specVersion: '2025', platform: 'phone', contrastLevel: 0 });
  });

  it('records the Material value behind every curation', () => {
    for (const scheme of ['dark', 'light'] as const) {
      for (const curation of Object.values(committed.curations[scheme])) {
        expect(curation.mcu).toMatch(/^#[0-9A-F]{6}$/);
        expect(curation.mcu).not.toBe(curation.approved);
      }
    }
  });

  it('agrees with the committed palette on every pinned, brand and alias role', () => {
    for (const scheme of ['dark', 'light'] as const) {
      const colors = momentum.colors[scheme];
      for (const role of colorRoles) {
        const source = committed.roles[role];
        if (source.kind === 'brand') expect({ role, value: committed.brand[scheme][role] }).toEqual({ role, value: colors[role] });
        if (source.kind === 'alias') expect({ role, value: colors[source.role] }).toEqual({ role, value: colors[role] });
        const curation = committed.curations[scheme][role];
        if (curation) expect({ role, value: curation.approved }).toEqual({ role, value: colors[role] });
      }
    }
  });

  it('serialises the palette byte-for-byte as committed', () => {
    expect(serializePalette(momentum)).toBe(paletteText);
  });
});

describe('resolvePalette', () => {
  const recorded = recordCurations(committed, fakeMaterial);

  it('reproduces the committed palette from a recipe recorded against the same Material values', () => {
    const { definition, problems } = resolvePalette(recorded, fakeMaterial, { requireRecorded: true });
    expect(problems).toEqual([]);
    expect(definition).toEqual(momentum);
    expect(serializePalette(definition)).toBe(paletteText);
  });

  it('emits every role in palette order for both schemes', () => {
    const { definition } = resolvePalette(recorded, fakeMaterial, { requireRecorded: true });
    expect(Object.keys(definition)).toEqual(['id', 'colors']);
    expect(Object.keys(definition.colors)).toEqual(['dark', 'light']);
    expect(Object.keys(definition.colors.dark)).toEqual(colorRoles);
    expect(Object.keys(definition.colors.light)).toEqual(colorRoles);
  });

  it('fails every curation when the seed moves, so a seed change cannot pass silently', () => {
    const { problems } = resolvePalette(recorded, movedMaterial, { requireRecorded: true });
    expect(problems).toHaveLength(curationCount(recorded));
    expect(problems.every((problem) => problem.kind === 'stale')).toBe(true);
    expect(problems[0]?.message).toMatch(/^dark\.surface: curation #0E0F0A replaced Material #100200, but the seed now gives #300200/);
  });

  it('takes uncurated roles straight from Material and lets aliases follow them', () => {
    const withoutPrimary: PaletteRecipe = {
      ...recorded,
      curations: { ...recorded.curations, dark: omit(recorded.curations.dark, 'primary') },
    };
    const { definition, problems } = resolvePalette(withoutPrimary, fakeMaterial, { requireRecorded: true });
    const material = fakeMaterial('dark', 'primary');
    expect(problems).toEqual([]);
    expect(definition.colors.dark.primary).toBe(material);
    expect(definition.colors.dark.dataTrain).toBe(material);
    expect(definition.colors.dark.primaryContainer).toBe(momentum.colors.dark.primaryContainer);
  });

  it('reports an unrecorded curation only when recording is required', () => {
    const unrecorded: PaletteRecipe = {
      ...recorded,
      curations: { ...recorded.curations, light: { ...recorded.curations.light, surface: { approved: '#FEFCF4', mcu: null } } },
    };
    expect(resolvePalette(unrecorded, fakeMaterial, { requireRecorded: false }).problems).toEqual([]);
    const { definition, problems } = resolvePalette(unrecorded, fakeMaterial, { requireRecorded: true });
    expect(problems).toEqual([expect.objectContaining({ scheme: 'light', role: 'surface', kind: 'unrecorded' })]);
    expect(definition.colors.light.surface).toBe('#FEFCF4');
  });

  it('rejects a Material value that is not an uppercase #RRGGBB', () => {
    expect(() => resolvePalette(recorded, () => '#abcdef', { requireRecorded: false })).toThrow(RecipeError);
  });
});

describe('recordCurations', () => {
  it('records the Material value for each pin and drops pins Material already matches', () => {
    const matchesSurface: SchemeSource = (scheme, color) =>
      color === 'surface' ? momentum.colors[scheme].surface : fakeMaterial(scheme, color);
    const recorded = recordCurations(committed, matchesSurface);
    expect(recorded.curations.dark.surface).toBeUndefined();
    expect(recorded.curations.light.surface).toBeUndefined();
    expect(recorded.curations.dark.surfaceLow).toEqual({ approved: '#13140F', mcu: fakeMaterial('dark', 'surfaceContainerLow') });
    expect(resolvePalette(recorded, matchesSurface, { requireRecorded: true })).toEqual({ definition: momentum, problems: [] });
  });

  it('never changes the palette it describes, and does not mutate its input', () => {
    const frozen = freeze(parseRecipe(recipeJson));
    const before = serializeRecipe(frozen);
    const recorded = recordCurations(frozen, movedUnderPins);
    expect(serializeRecipe(frozen)).toBe(before);
    expect(resolvePalette(recorded, movedUnderPins, { requireRecorded: true })).toEqual({ definition: momentum, problems: [] });
    expect(curationCount(recorded)).toBe(curationCount(frozen));
    expect(curationCount(recorded)).toBeLessThanOrEqual(schemeRoleCount * 2);
  });
});

describe('parseRecipe rejects an unsafe recipe', () => {
  type RecipeJson = typeof recipeJson;
  const cases: readonly (readonly [string, (recipe: RecipeJson) => unknown, RegExp])[] = [
    ['a non-object', () => [], /recipe: expected an object/],
    ['an unknown top-level key', (r) => ({ ...r, accent: '#C6F432' }), /recipe\.accent: unknown key/],
    ['a missing seed', (r) => omit(r, 'seed'), /recipe\.seed: missing/],
    ['a lowercase seed', (r) => ({ ...r, seed: '#c6f432' }), /recipe\.seed: expected an uppercase #RRGGBB/],
    ['an unsupported variant', (r) => ({ ...r, scheme: { ...r.scheme, variant: 'tonalSpot' } }), /recipe\.scheme\.variant/],
    ['an out-of-range contrast', (r) => ({ ...r, scheme: { ...r.scheme, contrastLevel: 2 } }), /recipe\.scheme\.contrastLevel/],
    ['an unknown role', (r) => ({ ...r, roles: { ...r.roles, accent: 'brand' } }), /recipe\.roles\.accent: unknown key/],
    ['a missing role', (r) => ({ ...r, roles: omit(r.roles, 'gymBrand') }), /recipe\.roles\.gymBrand: missing/],
    ['an unknown Material colour', (r) => ({ ...r, roles: { ...r.roles, surface: 'scheme:surfaceGlow' } }), /recipe\.roles\.surface: unknown Material colour/],
    ['a malformed source', (r) => ({ ...r, roles: { ...r.roles, surface: 'surface' } }), /recipe\.roles\.surface: expected/],
    ['an alias of an alias', (r) => ({ ...r, roles: { ...r.roles, dataFuel: 'alias:dataTrain' } }), /recipe\.roles\.dataFuel: .*dataTrain is itself an alias/],
    ['a self alias', (r) => ({ ...r, roles: { ...r.roles, dataTrain: 'alias:dataTrain' } }), /recipe\.roles\.dataTrain: .*itself/],
    ['a missing brand value', (r) => ({ ...r, brand: { ...r.brand, dark: omit(r.brand.dark, 'gymBrand') } }), /recipe\.brand\.dark\.gymBrand: missing/],
    ['a brand value for a seed role', (r) => ({ ...r, brand: { ...r.brand, dark: { ...r.brand.dark, surface: '#000000' } } }), /recipe\.brand\.dark\.surface: unknown key/],
    ['a curation on an alias', (r) => ({ ...r, curations: { ...r.curations, dark: { ...r.curations.dark, dataTrain: { approved: '#CAFD00', mcu: null } } } }), /recipe\.curations\.dark\.dataTrain: unknown key/],
    ['a curation equal to Material', (r) => ({ ...r, curations: { ...r.curations, dark: { ...r.curations.dark, surface: { approved: '#0E0F0A', mcu: '#0E0F0A' } } } }), /recipe\.curations\.dark\.surface: .*needs no curation/],
    ['a curation with a short hex', (r) => ({ ...r, curations: { ...r.curations, dark: { ...r.curations.dark, surface: { approved: '#0E0F0', mcu: null } } } }), /recipe\.curations\.dark\.surface\.approved: expected/],
  ];

  it.each(cases)('rejects %s', (_name, change, message) => {
    const changed = change(structuredClone(recipeJson));
    expect(() => parseRecipe(changed)).toThrow(RecipeError);
    expect(() => parseRecipe(changed)).toThrow(message);
  });
});

describe('diffPalettes', () => {
  it('names every changed, missing and unknown role', () => {
    const lightWithoutPrimary = omit(momentum.colors.light, 'primary');
    const changed = {
      id: 'momentum',
      colors: { dark: { ...momentum.colors.dark, surface: '#000000' }, light: { ...lightWithoutPrimary, glow: '#FFFFFF' } },
    };
    expect(diffPalettes(momentum, changed)).toEqual([
      'dark.surface: generated #0E0F0A, committed "#000000"',
      'light.primary: generated #556D00, committed (missing)',
      'light.glow: committed but not a theme role',
    ]);
    expect(diffPalettes(momentum, momentum)).toEqual([]);
    expect(diffPalettes(momentum, null)).toEqual(['the committed palette is not a JSON object']);
  });
});

describe('reportLines', () => {
  it('shows each role’s source, Material value, palette value and status', () => {
    const recorded = recordCurations(committed, fakeMaterial);
    const lines = reportLines(recorded, fakeMaterial);
    expect(lines).toHaveLength(1 + colorRoles.length * 2);
    expect(lines.join('\n')).toMatch(/dark\s+surface\s+scheme:surface\s+#100200\s+#0E0F0A\s+curated/);
    expect(lines.join('\n')).toMatch(/dark\s+dataTrain\s+alias:primary\s+-\s+#CAFD00\s+alias/);
    expect(lines.join('\n')).toMatch(/light\s+coachInk\s+brand\s+-\s+#6745C7\s+brand/);
    expect(reportLines(recorded, movedMaterial).join('\n')).toMatch(/dark\s+surface\s+.*stale \(recorded #100200\)/);
  });
});

describe('parseCommand', () => {
  it.each([
    [[], { mode: 'check' }],
    [['--check'], { mode: 'check' }],
    [['--', '--write'], { mode: 'write' }],
    [['--record'], { mode: 'record' }],
    [['--report'], { mode: 'report' }],
    [['--candidate', '#ff5a1f'], { mode: 'candidate', seed: '#FF5A1F' }],
    [['#C6F432'], { mode: 'candidate', seed: '#C6F432' }],
    [['--check', '--recipe', '/tmp/r.json', '--palette', '/tmp/p.json'], { mode: 'check', recipePath: '/tmp/r.json', palettePath: '/tmp/p.json' }],
  ])('parses %p', (args, expected) => {
    expect(parseCommand(args)).toEqual(expected);
  });

  it.each([
    [['--check', '--write'], /one mode/],
    [['--candidate'], /needs a value/],
    [['--candidate', 'lime'], /six-digit hex seed/],
    [['#C6F43'], /six-digit hex seed/],
    [['--recipe'], /needs a value/],
    [['--force'], /Unknown option --force/],
  ])('rejects %p', (args, message) => {
    expect(() => parseCommand(args)).toThrow(UsageError);
    expect(() => parseCommand(args)).toThrow(message);
  });
});
