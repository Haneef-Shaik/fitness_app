/**
 * The Momentum palette recipe: how every semantic role is generated from the seed.
 *
 * A role comes from a Material scheme colour, aliases another role, or is a fixed brand value (coach
 * violet, gym red). Where the Figma-approved value differs from Material, a curation pins it and records
 * the Material value it replaces, so a changed seed or library fails loudly instead of passing silently.
 * Pure: Material values arrive through a `SchemeSource`, so this module runs in Jest and in the CLI.
 */
import { colorRoles, type ColorRole } from '../../src/theme/roles';
import type { ColorScheme, ThemeColors, ThemeDefinition } from '../../src/theme/types';

export const colorSchemes = ['dark', 'light'] as const satisfies readonly ColorScheme[];

/** DynamicScheme colours in @material/material-color-utilities 0.4.0 that a role may come from. */
export const schemeColors = [
  'background', 'onBackground', 'surface', 'surfaceDim', 'surfaceBright', 'surfaceContainerLowest',
  'surfaceContainerLow', 'surfaceContainer', 'surfaceContainerHigh', 'surfaceContainerHighest', 'onSurface',
  'surfaceVariant', 'onSurfaceVariant', 'inverseSurface', 'inverseOnSurface', 'outline', 'outlineVariant', 'shadow',
  'scrim', 'surfaceTint', 'primary', 'primaryDim', 'onPrimary', 'primaryContainer', 'onPrimaryContainer',
  'primaryFixed', 'primaryFixedDim', 'onPrimaryFixed', 'onPrimaryFixedVariant', 'inversePrimary', 'secondary',
  'secondaryDim', 'onSecondary', 'secondaryContainer', 'onSecondaryContainer', 'secondaryFixed', 'secondaryFixedDim',
  'onSecondaryFixed', 'onSecondaryFixedVariant', 'tertiary', 'tertiaryDim', 'onTertiary', 'tertiaryContainer',
  'onTertiaryContainer', 'tertiaryFixed', 'tertiaryFixedDim', 'onTertiaryFixed', 'onTertiaryFixedVariant', 'error',
  'errorDim', 'onError', 'errorContainer', 'onErrorContainer',
] as const;
export type SchemeColor = (typeof schemeColors)[number];

export type RoleSource =
  | { readonly kind: 'scheme'; readonly color: SchemeColor }
  | { readonly kind: 'alias'; readonly role: ColorRole }
  | { readonly kind: 'brand' };

/** A Figma-approved value pinned over Material; `mcu` is the Material value it replaced (null until recorded). */
export interface Curation {
  readonly approved: string;
  readonly mcu: string | null;
}

export interface SchemeOptions {
  readonly variant: 'vibrant';
  readonly specVersion: '2021' | '2025';
  readonly platform: 'phone' | 'watch';
  readonly contrastLevel: number;
}

type PerScheme<T> = Readonly<Record<ColorScheme, T>>;
type RoleMap<T> = Readonly<Partial<Record<ColorRole, T>>>;

export interface PaletteRecipe {
  readonly comment?: string;
  readonly id: string;
  readonly seed: string;
  readonly scheme: SchemeOptions;
  readonly roles: Readonly<Record<ColorRole, RoleSource>>;
  readonly brand: PerScheme<RoleMap<string>>;
  readonly curations: PerScheme<RoleMap<Curation>>;
}

/** Returns one Material scheme colour as an uppercase #RRGGBB for the recipe's seed. */
export type SchemeSource = (scheme: ColorScheme, color: SchemeColor) => string;

export interface PaletteProblem {
  readonly scheme: ColorScheme;
  readonly role: ColorRole;
  readonly kind: 'unrecorded' | 'stale';
  readonly message: string;
}

export class RecipeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RecipeError';
  }
}

export class UsageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UsageError';
  }
}

const hexColor = /^#[0-9A-F]{6}$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function fail(path: string, message: string): never {
  throw new RecipeError(`${path}: ${message}`);
}

function expectRecord(value: unknown, path: string): Record<string, unknown> {
  if (!isRecord(value)) fail(path, 'expected an object');
  return value;
}

function expectKeys(record: Record<string, unknown>, allowed: readonly string[], path: string, required = allowed) {
  for (const key of Object.keys(record)) if (!allowed.includes(key)) fail(`${path}.${key}`, 'unknown key');
  for (const key of required) if (!Object.hasOwn(record, key)) fail(`${path}.${key}`, 'missing');
}

function expectHex(value: unknown, path: string): string {
  if (typeof value !== 'string' || !hexColor.test(value)) {
    fail(path, `expected an uppercase #RRGGBB colour, received ${JSON.stringify(value)}`);
  }
  return value;
}

const isColorRole = (value: string): value is ColorRole => (colorRoles as readonly string[]).includes(value);
const isSchemeColor = (value: string): value is SchemeColor => (schemeColors as readonly string[]).includes(value);

function parseRoleSource(value: unknown, path: string): RoleSource {
  const expected = 'expected "scheme:<Material colour>", "alias:<role>" or "brand"';
  if (typeof value !== 'string') fail(path, expected);
  if (value === 'brand') return { kind: 'brand' };
  const [kind, target = '', ...extra] = value.split(':');
  if (extra.length > 0) fail(path, expected);
  if (kind === 'scheme') {
    if (!isSchemeColor(target)) fail(path, `unknown Material colour ${JSON.stringify(target)}`);
    return { kind: 'scheme', color: target };
  }
  if (kind === 'alias') {
    if (!isColorRole(target)) fail(path, `unknown role ${JSON.stringify(target)}`);
    return { kind: 'alias', role: target };
  }
  return fail(path, expected);
}

function parseSchemeOptions(value: unknown): SchemeOptions {
  const path = 'recipe.scheme';
  const record = expectRecord(value, path);
  expectKeys(record, ['variant', 'specVersion', 'platform', 'contrastLevel'], path);
  const { variant, specVersion, platform, contrastLevel } = record;
  if (variant !== 'vibrant') fail(`${path}.variant`, 'only "vibrant" is supported');
  if (specVersion !== '2021' && specVersion !== '2025') fail(`${path}.specVersion`, 'expected "2021" or "2025"');
  if (platform !== 'phone' && platform !== 'watch') fail(`${path}.platform`, 'expected "phone" or "watch"');
  if (typeof contrastLevel !== 'number' || !(contrastLevel >= -1 && contrastLevel <= 1)) {
    fail(`${path}.contrastLevel`, 'expected a number from -1 to 1');
  }
  return { variant, specVersion, platform, contrastLevel };
}

function parseRoles(value: unknown): Readonly<Record<ColorRole, RoleSource>> {
  const path = 'recipe.roles';
  const record = expectRecord(value, path);
  expectKeys(record, colorRoles, path);
  const roles = Object.fromEntries(
    colorRoles.map((role) => [role, parseRoleSource(record[role], `${path}.${role}`)]),
  ) as Record<ColorRole, RoleSource>;
  for (const role of colorRoles) {
    const source = roles[role];
    if (source.kind !== 'alias') continue;
    if (source.role === role) fail(`${path}.${role}`, 'a role cannot alias itself');
    if (roles[source.role].kind === 'alias') {
      fail(`${path}.${role}`, `aliases must point at a Material or brand role; ${source.role} is itself an alias`);
    }
  }
  return roles;
}

function rolesOfKind(roles: Readonly<Record<ColorRole, RoleSource>>, kind: RoleSource['kind']) {
  return colorRoles.filter((role) => roles[role].kind === kind);
}

function parseBrand(value: unknown, roles: Readonly<Record<ColorRole, RoleSource>>): PerScheme<RoleMap<string>> {
  const path = 'recipe.brand';
  const record = expectRecord(value, path);
  expectKeys(record, colorSchemes, path);
  const brandRoles = rolesOfKind(roles, 'brand');
  const parseScheme = (scheme: ColorScheme): RoleMap<string> => {
    const schemePath = `${path}.${scheme}`;
    const values = expectRecord(record[scheme], schemePath);
    expectKeys(values, brandRoles, schemePath);
    return Object.fromEntries(brandRoles.map((role) => [role, expectHex(values[role], `${schemePath}.${role}`)]));
  };
  return { dark: parseScheme('dark'), light: parseScheme('light') };
}

function parseCuration(value: unknown, path: string): Curation {
  const record = expectRecord(value, path);
  expectKeys(record, ['approved', 'mcu'], path);
  const approved = expectHex(record.approved, `${path}.approved`);
  const mcu = record.mcu === null ? null : expectHex(record.mcu, `${path}.mcu`);
  if (mcu === approved) fail(path, 'Material already gives the approved value, so the role needs no curation');
  return { approved, mcu };
}

function parseCurations(value: unknown, roles: Readonly<Record<ColorRole, RoleSource>>): PerScheme<RoleMap<Curation>> {
  const path = 'recipe.curations';
  const record = expectRecord(value, path);
  expectKeys(record, colorSchemes, path);
  const schemeRoles = rolesOfKind(roles, 'scheme');
  const parseScheme = (scheme: ColorScheme): RoleMap<Curation> => {
    const schemePath = `${path}.${scheme}`;
    const values = expectRecord(record[scheme], schemePath);
    expectKeys(values, schemeRoles, schemePath, []);
    return Object.fromEntries(schemeRoles
      .filter((role) => Object.hasOwn(values, role))
      .map((role) => [role, parseCuration(values[role], `${schemePath}.${role}`)]));
  };
  return { dark: parseScheme('dark'), light: parseScheme('light') };
}

/** Validates untrusted recipe JSON. Throws a RecipeError naming the exact path at fault. */
export function parseRecipe(input: unknown): PaletteRecipe {
  const root = expectRecord(input, 'recipe');
  const required = ['id', 'seed', 'scheme', 'roles', 'brand', 'curations'];
  expectKeys(root, ['$comment', ...required], 'recipe', required);
  const comment = root.$comment;
  if (comment !== undefined && typeof comment !== 'string') fail('recipe.$comment', 'expected a string');
  const id = root.id;
  if (typeof id !== 'string' || !/^[a-z][a-z0-9-]*$/.test(id)) fail('recipe.id', 'expected a lowercase identifier');
  const seed = expectHex(root.seed, 'recipe.seed');
  const scheme = parseSchemeOptions(root.scheme);
  const roles = parseRoles(root.roles);
  return {
    ...(comment === undefined ? {} : { comment }),
    id,
    seed,
    scheme,
    roles,
    brand: parseBrand(root.brand, roles),
    curations: parseCurations(root.curations, roles),
  };
}

function readSource(source: SchemeSource, scheme: ColorScheme, color: SchemeColor): string {
  const value = source(scheme, color);
  if (!hexColor.test(value)) {
    throw new RecipeError(`Material ${scheme}.${color} must be an uppercase #RRGGBB, received ${JSON.stringify(value)}`);
  }
  return value;
}

function buildColors(read: (role: ColorRole) => string): ThemeColors {
  const colors: Record<ColorRole, string> = Object.fromEntries(colorRoles.map((role) => [role, read(role)])) as Record<ColorRole, string>;
  return colors;
}

export interface ResolvedPalette {
  readonly definition: ThemeDefinition;
  readonly problems: readonly PaletteProblem[];
}

/**
 * Generates the palette. Curated roles always take their approved value; a problem is reported when the
 * Material value behind a curation was never recorded (if required) or no longer matches the record.
 */
export function resolvePalette(
  recipe: PaletteRecipe,
  source: SchemeSource,
  options: { readonly requireRecorded: boolean },
): ResolvedPalette {
  const problems: PaletteProblem[] = [];
  const baseValue = (scheme: ColorScheme, role: ColorRole, roleSource: Exclude<RoleSource, { kind: 'alias' }>): string => {
    if (roleSource.kind === 'brand') return expectHex(recipe.brand[scheme][role], `recipe.brand.${scheme}.${role}`);
    const material = readSource(source, scheme, roleSource.color);
    const curation = recipe.curations[scheme][role];
    if (!curation) return material;
    if (curation.mcu === null && options.requireRecorded) {
      problems.push({
        scheme, role, kind: 'unrecorded',
        message: `${scheme}.${role}: curation ${curation.approved} has no recorded Material value (the seed gives ${material}). Run theme:generate --record.`,
      });
    } else if (curation.mcu !== null && curation.mcu !== material) {
      problems.push({
        scheme, role, kind: 'stale',
        message: `${scheme}.${role}: curation ${curation.approved} replaced Material ${curation.mcu}, but the seed now gives ${material}. Review the change, then run theme:generate --record.`,
      });
    }
    return curation.approved;
  };
  // Each non-alias role resolves once per scheme, so an alias never repeats its target's problems.
  const resolveScheme = (scheme: ColorScheme): ThemeColors => {
    const base = new Map(colorRoles.flatMap((role) => {
      const roleSource = recipe.roles[role];
      return roleSource.kind === 'alias' ? [] : [[role, baseValue(scheme, role, roleSource)] as const];
    }));
    return buildColors((role) => {
      const roleSource = recipe.roles[role];
      const target = roleSource.kind === 'alias' ? roleSource.role : role;
      return base.get(target) ?? fail(`recipe.roles.${role}`, `alias target ${target} did not resolve`);
    });
  };
  const definition: ThemeDefinition = {
    id: recipe.id,
    colors: { dark: resolveScheme('dark'), light: resolveScheme('light') },
  };
  return { definition, problems };
}

/**
 * Re-records which Material value each curation replaces. A pin Material now matches is dropped (the role
 * then comes straight from the seed). Pinned values never change, so the generated palette stays the same.
 */
export function recordCurations(recipe: PaletteRecipe, source: SchemeSource): PaletteRecipe {
  const recordScheme = (scheme: ColorScheme): RoleMap<Curation> => Object.fromEntries(colorRoles.flatMap((role) => {
    const curation = recipe.curations[scheme][role];
    const roleSource = recipe.roles[role];
    if (!curation || roleSource.kind !== 'scheme') return [];
    const material = readSource(source, scheme, roleSource.color);
    return material === curation.approved ? [] : [[role, { approved: curation.approved, mcu: material }] as const];
  }));
  return { ...recipe, curations: { dark: recordScheme('dark'), light: recordScheme('light') } };
}

/** The exact text of a committed palette file. */
export function serializePalette(definition: ThemeDefinition): string {
  return `${JSON.stringify(definition, null, 2)}\n`;
}

function formatRoleSource(source: RoleSource): string {
  if (source.kind === 'scheme') return `scheme:${source.color}`;
  if (source.kind === 'alias') return `alias:${source.role}`;
  return 'brand';
}

function inRoleOrder<T>(map: RoleMap<T>): Partial<Record<ColorRole, T>> {
  return Object.fromEntries(colorRoles.flatMap((role) => {
    const value = map[role];
    return value === undefined ? [] : [[role, value] as const];
  }));
}

/** The canonical text of a recipe file; `--record` writes it. */
export function serializeRecipe(recipe: PaletteRecipe): string {
  const { comment, id, seed, scheme, roles, brand, curations } = recipe;
  // Rebuild each curation so its keys always serialise as approved, then mcu.
  const curationsInOrder = (map: RoleMap<Curation>) => Object.fromEntries(colorRoles.flatMap((role) => {
    const curation = map[role];
    return curation === undefined ? [] : [[role, { approved: curation.approved, mcu: curation.mcu }] as const];
  }));
  const body = {
    ...(comment === undefined ? {} : { $comment: comment }),
    id,
    seed,
    scheme: {
      variant: scheme.variant,
      specVersion: scheme.specVersion,
      platform: scheme.platform,
      contrastLevel: scheme.contrastLevel,
    },
    roles: Object.fromEntries(colorRoles.map((role) => [role, formatRoleSource(roles[role])])),
    brand: { dark: inRoleOrder(brand.dark), light: inRoleOrder(brand.light) },
    curations: { dark: curationsInOrder(curations.dark), light: curationsInOrder(curations.light) },
  };
  return `${JSON.stringify(body, null, 2)}\n`;
}

/** Human-readable differences between the generated palette and a committed file's parsed JSON. */
export function diffPalettes(expected: ThemeDefinition, committed: unknown): readonly string[] {
  if (!isRecord(committed)) return ['the committed palette is not a JSON object'];
  const differences: string[] = [];
  if (committed.id !== expected.id) {
    differences.push(`id: generated ${JSON.stringify(expected.id)}, committed ${JSON.stringify(committed.id)}`);
  }
  const colors = isRecord(committed.colors) ? committed.colors : {};
  for (const scheme of colorSchemes) {
    const schemeColors = colors[scheme];
    const values = isRecord(schemeColors) ? schemeColors : {};
    for (const role of colorRoles) {
      const generated = expected.colors[scheme][role];
      const value = values[role];
      if (value !== generated) {
        differences.push(`${scheme}.${role}: generated ${generated}, committed ${value === undefined ? '(missing)' : JSON.stringify(value)}`);
      }
    }
    for (const key of Object.keys(values)) {
      if (!isColorRole(key)) differences.push(`${scheme}.${key}: committed but not a theme role`);
    }
  }
  return differences;
}

/** One line per scheme and role: where it comes from, what Material gives, what ships, and why. */
export function reportLines(recipe: PaletteRecipe, source: SchemeSource): readonly string[] {
  const { definition } = resolvePalette(recipe, source, { requireRecorded: false });
  const row = (cells: readonly string[]) => [
    cells[0]?.padEnd(6), cells[1]?.padEnd(21), cells[2]?.padEnd(32), cells[3]?.padEnd(8), cells[4]?.padEnd(8), cells[5],
  ].join('  ').trimEnd();
  const lines = colorSchemes.flatMap((scheme) => colorRoles.map((role) => {
    const roleSource = recipe.roles[role];
    const palette = definition.colors[scheme][role];
    if (roleSource.kind !== 'scheme') {
      return row([scheme, role, formatRoleSource(roleSource), '-', palette, roleSource.kind]);
    }
    const material = readSource(source, scheme, roleSource.color);
    const curation = recipe.curations[scheme][role];
    const status = !curation
      ? 'seed'
      : curation.mcu === null
        ? 'curated, unrecorded'
        : curation.mcu === material ? 'curated' : `stale (recorded ${curation.mcu})`;
    return row([scheme, role, formatRoleSource(roleSource), material, palette, status]);
  }));
  return [row(['scheme', 'role', 'source', 'material', 'palette', 'status']), ...lines];
}

type Mode = 'check' | 'write' | 'record' | 'report' | 'candidate';
export interface Command {
  readonly mode: Mode;
  readonly seed?: string;
  readonly recipePath?: string;
  readonly palettePath?: string;
}

export const usage = [
  'Usage: theme:generate [--check | --write | --record | --report | --candidate <#RRGGBB>] [--recipe <file>] [--palette <file>]',
  '  --check      (default) regenerate from the recipe and fail on any difference from the committed palette',
  '  --write      regenerate and write the palette file',
  '  --record     re-record the Material value behind each curation; pinned values do not change',
  '  --report     show each role\'s source, Material value, palette value and status',
  '  --candidate  print an uncurated candidate for another seed; writes nothing',
].join('\n');

function normalizeSeed(value: string): string {
  const seed = value.toUpperCase();
  if (!hexColor.test(seed)) throw new UsageError(`Pass a six-digit hex seed such as "#C6F432", received ${JSON.stringify(value)}`);
  return seed;
}

const modeFlags: Readonly<Record<string, Mode>> = {
  '--check': 'check', '--write': 'write', '--record': 'record', '--report': 'report',
};

/** Parses CLI arguments. Throws a UsageError for anything ambiguous. */
export function parseCommand(args: readonly string[]): Command {
  const rest = args[0] === '--' ? args.slice(1) : args;
  const modes: { mode: Mode; seed?: string }[] = [];
  const paths: { recipePath?: string; palettePath?: string } = {};
  for (let index = 0; index < rest.length; index += 1) {
    const arg = rest[index] ?? '';
    const takeValue = () => {
      const value = rest[index + 1];
      if (value === undefined || value.startsWith('--')) throw new UsageError(`${arg} needs a value`);
      index += 1;
      return value;
    };
    const flagMode = modeFlags[arg];
    if (flagMode) modes.push({ mode: flagMode });
    else if (arg === '--candidate') modes.push({ mode: 'candidate', seed: normalizeSeed(takeValue()) });
    else if (arg === '--recipe') paths.recipePath = takeValue();
    else if (arg === '--palette') paths.palettePath = takeValue();
    else if (arg.startsWith('#')) modes.push({ mode: 'candidate', seed: normalizeSeed(arg) });
    else throw new UsageError(`Unknown option ${arg}`);
  }
  if (modes.length > 1) throw new UsageError('Choose one mode at a time');
  return { ...(modes[0] ?? { mode: 'check' }), ...paths };
}
