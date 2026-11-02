import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render, screen } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { Text, type ColorValue } from 'react-native';
import { momentum, ThemeProvider, useTheme, type ColorScheme } from '@/theme';
import { createPreferenceStore } from '@/theme/preference-store';
import { colorRoles, type ColorRole } from '@/theme/roles';
import { dimensions } from '@/theme/tokens';
import manifest from '../../../assets/momentum/manifest.json';
import { MomentumAsset } from '../MomentumAsset';
import { momentumAssetRoles, momentumAssets, type MomentumAssetName } from '../momentum-assets';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async () => null), setItem: jest.fn(async () => {}),
}));

/** What MomentumAsset hands to react-native-svg. The native drawing itself is not exercised here. */
interface SvgXmlProps { xml: string | null; color?: ColorValue; width?: number | string; height?: number | string }
const mockSvgXml = jest.fn<null, [SvgXmlProps]>(() => null);
jest.mock('react-native-svg', () => ({
  SvgXml: (props: SvgXmlProps) => mockSvgXml(props),
}));

/**
 * DS-1 guard-wiring prerequisite (1 Nov 2026). Each bundled asset paints its single shape in
 * `currentColor`, and MomentumAsset supplies the colour: `tint` when given, otherwise the asset's
 * semantic role from the current theme. The raw Figma exports in assets/momentum/ keep their original
 * fills, so they are the reference for geometry and for the Dark appearance; the designer's unbundled
 * `…Light.svg` exports are the reference for Light where they exist. No colour value is written in this
 * file: expected colours come from the exports and from the palette.
 */
const repoRoot = join(__dirname, '..', '..', '..', '..', '..');
const exportDir = join(__dirname, '..', '..', '..', 'assets', 'momentum');
const names = Object.keys(momentumAssets) as MomentumAssetName[];
const schemes = ['dark', 'light'] as const satisfies readonly ColorScheme[];
/** Bundled assets for which the design also exported a Light version (an unbundled `…Light.svg`). */
const lightExports = names.filter((name) => existsSync(join(exportDir, `${name}Light.svg`)));

/** The fill attribute of every painted element, in document order. */
const fillsOf = (xml: string) => [...xml.matchAll(/\sfill="([^"]*)"/g)].map((match) => match[1]);
const exportOf = (name: MomentumAssetName) => {
  const file = manifest.files.find((entry) => entry.name === name);
  if (!file) throw new Error(`${name} is not in assets/momentum/manifest.json`);
  return readFileSync(join(repoRoot, file.path), 'utf8');
};
/** An export's one painted colour: the root's fill="none" first, then a single coloured fill. */
function paintOf(raw: string, label: string) {
  const fills = fillsOf(raw);
  expect(fills).toHaveLength(2);
  expect(fills[0]).toBe('none');
  const [, paint] = fills;
  if (paint === undefined || paint === 'none') throw new Error(`${label} has no painted fill`);
  return paint;
}
const exportFill = (name: MomentumAssetName) => paintOf(exportOf(name), `${name}'s export`);

function SchemeProbe() {
  const { theme } = useTheme();
  return <Text testID="scheme">{theme.scheme}</Text>;
}

/** Renders with a stored explicit preference, so the scheme under test never follows the OS. */
async function renderInScheme(scheme: ColorScheme, ui: ReactElement) {
  const store = createPreferenceStore({ getItem: async () => scheme, setItem: async () => {} });
  await store.hydrate();
  render(<ThemeProvider store={store}>{ui}<SchemeProbe /></ThemeProvider>);
  expect(screen.getByTestId('scheme')).toHaveTextContent(scheme);
  const props = mockSvgXml.mock.calls.at(-1)?.[0];
  if (!props) throw new Error('MomentumAsset did not render SvgXml');
  return props;
}

describe('the bundled Momentum assets', () => {
  it('keeps every asset of the Figma manifest, in manifest order, under its original key', () => {
    expect(names).toEqual(manifest.files.map((file) => file.name));
    expect(names).toHaveLength(26);
  });

  it('draws each asset from one geometry in both schemes (no …Light duplicates)', () => {
    expect(names.filter((name) => name.endsWith('Light'))).toEqual([]);
  });

  it.each(names)('%s has no hardcoded colour: its one painted shape uses currentColor', (name) => {
    const xml = momentumAssets[name];
    expect(fillsOf(xml)).toEqual(['none', 'currentColor']);
    expect(xml).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    expect(xml).not.toMatch(/\b(?:rgba?|hsla?|hwb)\(/i);
    expect(xml).not.toMatch(/\b(?:stroke|stop-color|flood-color|lighting-color|color)=/);
    expect(xml).not.toMatch(/<(?:linearGradient|radialGradient|pattern|image|style)\b/);
  });

  it.each(names)('%s is byte-identical to its Figma export apart from that one fill: geometry, viewBox, size and ids are kept', (name) => {
    const raw = exportOf(name);
    const paint = exportFill(name);
    const expected = raw.replace(` fill="${paint}"/>`, ' fill="currentColor"/>');
    expect(expected).not.toBe(raw);
    expect(momentumAssets[name]).toBe(expected);
  });

  it.each(names)('%s: its default role draws the export\'s own fill in Dark, so Dark looks as before', (name) => {
    expect(momentum.colors.dark[momentumAssetRoles[name]].toUpperCase()).toBe(exportFill(name).toUpperCase());
  });

  it('finds the design\'s Light exports for the seven assets that have one', () => {
    expect(lightExports).toEqual(['imgCookie12', 'imgFitnessCenter', 'imgSunny', 'imgIconHomeFill', 'imgIconExercise', 'imgIconRestaurant', 'imgIconMonitoring']);
  });

  it.each(lightExports)('%s: the same role in Light draws the design\'s own Light fill', (name) => {
    const light = readFileSync(join(exportDir, `${name}Light.svg`), 'utf8');
    expect(momentum.colors.light[momentumAssetRoles[name]].toUpperCase()).toBe(paintOf(light, `${name}Light.svg`).toUpperCase());
  });

  it('maps every asset, and only the assets, to a ThemeColors role', () => {
    expect(Object.keys(momentumAssetRoles).sort()).toEqual([...names].sort());
    const roles: readonly ColorRole[] = Object.values(momentumAssetRoles);
    expect(roles.filter((role) => !colorRoles.includes(role))).toEqual([]);
  });
});

describe('MomentumAsset', () => {
  const cases = schemes.flatMap((scheme) => names.map((name) => ({ scheme, name })));

  it.each(cases)('$scheme $name: without a tint it paints in its role from the current theme, at the icon size', async ({ scheme, name }) => {
    const props = await renderInScheme(scheme, <MomentumAsset name={name} />);
    expect(props.xml).toBe(momentumAssets[name]);
    expect(props.color).toBe(momentum.colors[scheme][momentumAssetRoles[name]]);
    expect(props.width).toBe(dimensions.icon);
    expect(props.height).toBe(dimensions.icon);
  });

  it.each(schemes)('%s: an explicit tint takes precedence over the role, and the XML is not rewritten', async (scheme) => {
    const name: MomentumAssetName = 'imgArrowBack';
    const tint = momentum.colors[scheme].error;
    expect(tint).not.toBe(momentum.colors[scheme][momentumAssetRoles[name]]);
    const props = await renderInScheme(scheme, <MomentumAsset name={name} tint={tint} />);
    expect(props.color).toBe(tint);
    expect(props.xml).toBe(momentumAssets[name]);
  });

  it.each(schemes)('%s: an explicit size sets both width and height', async (scheme) => {
    const props = await renderInScheme(scheme, <MomentumAsset name="imgCookie12" size={dimensions.heroArt} />);
    expect(dimensions.heroArt).not.toBe(dimensions.icon);
    expect(props.width).toBe(dimensions.heroArt);
    expect(props.height).toBe(dimensions.heroArt);
    expect(props.color).toBe(momentum.colors[scheme][momentumAssetRoles.imgCookie12]);
  });
});
