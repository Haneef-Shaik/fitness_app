import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import * as tsParser from '@typescript-eslint/parser';
import { Linter } from 'eslint';

import {
  colorGuardConfig,
  colorGuardFiles,
  colorGuardIgnores,
  plugin,
  ruleId,
} from '../../../scripts/lint-rules/no-literal-color.cjs';

const appRoot = join(__dirname, '..', '..', '..');
const linter = new Linter({ configType: 'flat', cwd: appRoot });
const parserConfig: Linter.Config = {
  files: ['**/*.{js,jsx,ts,tsx}'],
  languageOptions: { parser: tsParser as Linter.Parser, parserOptions: { ecmaFeatures: { jsx: true } } },
};
const config: Linter.Config[] = [parserConfig, colorGuardConfig()];

/** Lints a fixture as if it lived at `file`; refuses to report "clean" for a fixture that did not parse. */
function lint(code: string, file = 'src/ui/Fixture.tsx') {
  const messages = linter.verify(code, config, { filename: join(appRoot, file) });
  const fatal = messages.filter((message) => message.fatal);
  if (fatal.length > 0) throw new Error(`Fixture did not parse: ${fatal.map((message) => message.message).join('; ')}`);
  return messages.filter((message) => message.ruleId === ruleId);
}

describe('no-literal-color rejects a literal colour outside theme files', () => {
  it.each([
    ['a hex style value', 'export const s = { color: "#ffffff" };'],
    ['a short hex', 'export const s = { borderColor: "#FFF" };'],
    ['an alpha hex', 'export const s = { backgroundColor: "#00000080" };'],
    ['rgb()', 'export const s = { color: "rgb(0, 0, 0)" };'],
    ['rgba() in any case', 'export const s = { shadowColor: "RGBA(0,0,0,0.4)" };'],
    ['hsl()', 'export const s = { color: "hsl(80 100% 50%)" };'],
    ['hwb()', 'export const s = { color: "hwb(80 0% 0%)" };'],
    ['a named colour', 'export const s = { color: "white" };'],
    ['a named colour on an SVG paint', 'export const icon = <Path fill="rebeccapurple" />;'],
    ['a hex JSX attribute', 'export const spinner = <ActivityIndicator color="#CAFD00" />;'],
    ['a colour in a template literal', 'export const s = { color: `rgba(0,0,0,${opacity})` };'],
    ['a static template literal', 'export const s = { color: `#0E0F0A` };'],
    ['a hex embedded in a shorthand', 'export const s = { boxShadow: "0 1px 2px #000000" };'],
    ['a hex inside inline SVG markup', 'export const svg = "<svg><path fill=\\"#ACABA4\\"/></svg>";'],
    ['a conditional colour', 'export const s = (dark: boolean) => ({ color: dark ? "black" : "white" });'],
    ['a fallback colour', 'export const s = (c?: string) => ({ color: c ?? "black" });'],
    ['a colour array', 'export const g = <Gradient colors={["red", "#FFB000"]} />;'],
    ['a nested switch colour', 'export const sw = <Switch trackColor={{ false: "grey", true: "#C6F432" }} />;'],
    ['a colour variable', 'const accentColor = "lime"; export default accentColor;'],
    ['a colour assignment', 'export function paint(node: { style: { color?: string } }) { node.style.color = "red"; }'],
    ['a default colour parameter', 'export function Chip({ tint = "#FFFFFF" }) { return tint; }'],
    ['a numeric colour', 'export const s = { color: 0xff0000ff };'],
    ['a typed constant', 'export const accent = "#C6F432" as const;'],
    ['PlatformColor', 'import { PlatformColor } from "react-native"; export const s = { color: PlatformColor("systemBlue") };'],
    ['DynamicColorIOS', 'import { DynamicColorIOS } from "react-native"; export const s = { color: DynamicColorIOS({ light: "a", dark: "b" }) };'],
  ])('rejects %s', (_name, code) => {
    expect(lint(code).length).toBeGreaterThanOrEqual(1);
  });

  /** Review 2026-10-27T1605Z, L2: named colours outside colour-named keys, and aliased palette bypasses. */
  const reanimated = 'import * as Reanimated from "react-native-reanimated"; import Animated, { interpolateColor, withSpring, withTiming, withTiming as tween } from "react-native-reanimated";';
  it.each([
    ['a named colour on MomentumAsset tint', 'export const icon = <MomentumAsset name="imgCheck" tint="white" />;'],
    ['a named colour on a …Tint prop', 'export const badge = <Badge iconTint="red" />;'],
    ['a named tint default', 'export function Chip({ tint = "black" }: { tint?: string }) { return tint; }'],
    ['a named tint in a style object', 'export const s = { tint: `navy` };'],
    ['a named withTiming target', `${reanimated} export const go = () => withTiming("white");`],
    ['a named withSpring target', `${reanimated} export const go = () => withSpring("black", { damping: 10 });`],
    ['a conditional named target', `${reanimated} export const go = (on: boolean) => withTiming(on ? "white" : "black");`],
    ['a static template target', `${reanimated} export const go = () => withTiming(\`white\`);`],
    ['a nested named target', `${reanimated} import { withDelay } from "react-native-reanimated"; export const go = () => withDelay(100, withTiming("white"));`],
    ['named colours in an interpolateColor output range', `${reanimated} export const c = (p: number) => interpolateColor(p, [0, 1], ["white", "black"]);`],
    ['numeric colours in an interpolateColor output range', `${reanimated} export const c = (p: number) => interpolateColor(p, [0, 1], [0xffffffff, 0xff000000]);`],
    ['an aliased Reanimated helper', `${reanimated} export const go = () => tween("white");`],
    ['a Reanimated namespace call', `${reanimated} export const go = () => Reanimated.withSpring("white");`],
    ['a Reanimated computed call', `${reanimated} export const c = (p: number) => Reanimated["interpolateColor"](p, [0, 1], ["white", "black"]);`],
    ['a Reanimated default-import member', `${reanimated} export const go = () => Animated.withTiming("white");`],
    ['an aliased PlatformColor', 'import { PlatformColor as PC } from "react-native"; export const s = { color: PC("systemBlue") };'],
    ['an aliased DynamicColorIOS', 'import { DynamicColorIOS as Dyn } from "react-native"; export const s = { color: Dyn({ light: "a", dark: "b" }) };'],
    ['PlatformColor through a namespace', 'import * as RN from "react-native"; export const s = { color: RN.PlatformColor("systemBlue") };'],
    ['PlatformColor through a computed namespace member', 'import * as RN from "react-native"; export const s = { color: RN["PlatformColor"]("systemBlue") };'],
    ['DynamicColorIOS through a template-literal member', 'import * as RN from "react-native"; export const s = { color: RN[`DynamicColorIOS`]({ light: "a", dark: "b" }) };'],
  ])('rejects %s', (_name, code) => {
    expect(lint(code).length).toBeGreaterThanOrEqual(1);
  });

  it('names the API an alias stands for', () => {
    const [message] = lint('import { PlatformColor as PC } from "react-native"; export const s = { color: PC("systemBlue") };');
    expect(message?.message).toMatch(/^PlatformColor\(\) bypasses the Momentum palette/);
  });

  it('reports each named colour in an interpolateColor output range', () => {
    expect(lint(`${reanimated} export const c = (p: number) => interpolateColor(p, [0, 1], ["white", "black"]);`)).toHaveLength(2);
  });

  it('names the value and where palette colours belong', () => {
    const [message] = lint('export const s = { color: "#ffffff" };');
    expect(message?.message).toMatch(/Literal colour "#ffffff"/);
    expect(message?.message).toMatch(/src\/theme\/themes\//);
  });

  it('names the colour itself when it is buried in a longer string', () => {
    const [svg] = lint('export const svg = "<svg viewBox=\\"0 0 24 24\\"><path d=\\"M0 0\\" fill=\\"#ACABA4\\"/></svg>";');
    expect(svg?.message).toMatch(/^Literal colour "#ACABA4" outside the theme/);
    const [shadow] = lint('export const s = { boxShadow: "0 1px 2px rgba(0, 0, 0, 0.4)" };');
    expect(shadow?.message).toMatch(/^Literal colour "rgba\(" outside the theme/);
  });

  it('reports each literal once', () => {
    expect(lint('export const s = { color: "#fff", backgroundColor: "black" };')).toHaveLength(2);
  });
});

describe('no-literal-color allows semantic roles and non-colours', () => {
  it.each([
    ['a theme role', 'export const s = (theme: any) => ({ color: theme.colors.onSurface });'],
    ['transparent', 'export const s = { backgroundColor: "transparent" };'],
    ['SVG none and currentColor', 'export const icon = <Path fill="none" stroke="currentColor" />;'],
    ['a colour-scheme preference', 'export const s = { colorScheme: "dark" };'],
    ['a colour word in an unrelated key', 'export const label = { variant: "red", title: "Gold medal" };'],
    ['a ranking string', 'export const rank = "Rank #1";'],
    ['a URL fragment', 'export const href = "https://example.com/page#fff";'],
    ['a colour word as a translation key', 'export const k = t("white");'],
    ['a regex', 'export const hex = /^#[0-9a-f]{6}$/i;'],
    ['an import path', 'import x from "#internal/colours"; export default x;'],
    ['a numeric opacity', 'export const s = { opacity: 0.5, shadowOpacity: 1 };'],
    ['an argb helper name', 'export const name = "argb(";'],
  ])('allows %s', (_name, code) => {
    expect(lint(code)).toEqual([]);
  });

  /** The L2 positions stay narrow: Reanimated is resolved through imports, and only colours are flagged. */
  it.each([
    ['numeric Reanimated targets and configs', 'import { withSpring, withTiming } from "react-native-reanimated"; export const go = () => [withTiming(1, { duration: 200 }), withSpring(0, { damping: 10, stiffness: 100 })];'],
    ['non-colour string targets', 'import { withTiming } from "react-native-reanimated"; export const go = () => [withTiming("100%"), withTiming("45deg")];'],
    ['theme roles in an interpolateColor output range', 'import { interpolateColor } from "react-native-reanimated"; export const c = (p: number, theme: any) => interpolateColor(p, [0, 1], [theme.colors.surface, theme.colors.primary]);'],
    ['a numeric interpolate', 'import { interpolate } from "react-native-reanimated"; export const x = (p: number) => interpolate(p, [0, 1], [0, 100]);'],
    ['a same-named local function beside a Reanimated import', 'import { withSpring } from "react-native-reanimated"; function withTiming(label: string) { return label; } export const x = [withTiming("white"), withSpring(1)];'],
    ['a parameter that shadows a Reanimated import', 'import { withTiming } from "react-native-reanimated"; export const f = (withTiming: (s: string) => string) => withTiming("white");'],
    ['a same-named helper from another module', 'import { withSpring } from "react-native-reanimated"; import { interpolateColor } from "./palette-math"; export const c = (p: number) => [withSpring(1), interpolateColor(p, [0, 1], ["white", "black"])];'],
    ['a same-named declared variable', 'import { withTiming } from "react-native-reanimated"; declare const withSpring: (s: string) => string; export const x = [withTiming(0), withSpring("white")];'],
    ['a non-colour tint keyword', 'export const blur = <BlurView tint="dark" intensity={50} />;'],
    ['a word that merely ends in "tint"', 'export const label = { stint: "red" };'],
    ['an alias of another react-native export', 'import { Platform as PC } from "react-native"; export const os = PC.select({ ios: "a", default: "b" });'],
    ['an alias of a palette-bypass name from another module', 'import { View } from "react-native"; import { PlatformColor as PC } from "./not-react-native"; export const s = { color: PC("systemBlue") }; export { View };'],
  ])('allows %s', (_name, code) => {
    expect(lint(code)).toEqual([]);
  });
});

describe('the guard applies to app source only', () => {
  const literal = 'export const s = { color: "#ffffff" };';

  it.each([
    'src/ui/Fixture.tsx',
    'src/features/today/TodayScreen.tsx',
    'src/app/(member)/today.tsx',
    'src/theme/theme.ts',
    'src/theme/ThemeProvider.tsx',
    'src/lib/legacy.js',
  ])('covers %s', (file) => {
    expect(lint(literal, file)).toHaveLength(1);
  });

  it.each([
    'src/theme/themes/momentum.ts',
    'src/theme/themes/candidate.ts',
    'src/theme/__tests__/theme.test.ts',
    'src/ui/__tests__/AppButton.test.tsx',
    'scripts/generate-palette.ts',
  ])('exempts %s', (file) => {
    expect(lint(literal, file)).toEqual([]);
  });

  it('exempts only the palette definitions and tests', () => {
    expect(colorGuardIgnores).toEqual(['src/theme/themes/**', 'src/**/__tests__/**']);
  });
});

/**
 * The app's real eslint.config.js, as `pnpm lint` loads it. Only the two design rules run, so the
 * Expo rules cannot mask or crash a fixture. Without `colorGuardConfig()` in eslint.config.js, the
 * wiring test and every rejection below fail: the older `no-restricted-syntax` selector reports none of
 * these. It is loaded in beforeAll, so a config that cannot load fails this block only.
 */
describe('the app ESLint configuration runs the colour guard', () => {
  const selector = 'no-restricted-syntax';
  const typographyMessage = 'Use the shared typography or radius tokens from useTheme().';
  const appLinter = new Linter({ configType: 'flat', cwd: appRoot });
  let appConfig: Linter.Config[] = [];

  beforeAll(() => {
    const loaded: unknown = jest.requireActual('../../../eslint.config.js');
    if (!Array.isArray(loaded)) throw new Error('eslint.config.js must export a flat config array');
    appConfig = loaded as Linter.Config[];
  });

  /** Lints with the effective app config, running only the colour guard and the shared selector. */
  function lintApp(code: string, file = 'src/ui/Fixture.tsx') {
    const options = {
      filename: join(appRoot, file),
      ruleFilter: ({ ruleId: id }: { ruleId: string }) => id === ruleId || id === selector,
    };
    const messages = appLinter.verify(code, appConfig, options);
    const fatal = messages.filter((message) => message.fatal);
    if (fatal.length > 0) throw new Error(`Fixture did not parse: ${fatal.map((message) => message.message).join('; ')}`);
    return {
      guard: messages.filter((message) => message.ruleId === ruleId),
      selector: messages.filter((message) => message.ruleId === selector),
    };
  }

  it('wires fitlog-colors/no-literal-color once, as an error, with only the palette and test exemptions', () => {
    const blocks = appConfig.filter((block) => block.rules?.[ruleId] !== undefined);
    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toMatchObject({ files: [...colorGuardFiles], ignores: [...colorGuardIgnores], rules: { [ruleId]: 'error' } });
    expect(blocks[0]?.plugins?.['fitlog-colors']).toBe(plugin);
  });

  it.each([
    ['a hex fill inside inline SVG markup, in the bundled asset file itself', 'export const momentumAssets = { imgCheck: "<svg><path d=\\"M0 0\\" fill=\\"#516700\\"/></svg>" } as const;', 'src/ui/momentum-assets.ts'],
    ['a named colour on MomentumAsset tint', 'export const icon = <MomentumAsset name="imgCheck" tint="white" />;', 'src/ui/Fixture.tsx'],
    ['a named colour in a style', 'export const s = { color: "white" };', 'src/ui/Fixture.tsx'],
    ['a colour in a template literal', 'export const s = (a: number) => ({ color: `rgba(0,0,0,${a})` });', 'src/ui/Fixture.tsx'],
    ['a named Reanimated target through an alias', 'import { withTiming as tween } from "react-native-reanimated"; export const go = () => tween("white");', 'src/motion/fixture.ts'],
    ['named colours in a computed interpolateColor call', 'import * as R from "react-native-reanimated"; export const c = (p: number) => R["interpolateColor"](p, [0, 1], ["white", "black"]);', 'src/motion/fixture.ts'],
    ['an aliased PlatformColor', 'import { PlatformColor as PC } from "react-native"; export const s = { color: PC("systemBlue") };', 'src/ui/Fixture.tsx'],
    ['a computed DynamicColorIOS', 'import * as RN from "react-native"; export const s = { color: RN["DynamicColorIOS"]({ light: "a", dark: "b" }) };', 'src/ui/Fixture.tsx'],
    ['a hex in src/theme outside themes/', 'export const s = { color: "#ffffff" };', 'src/theme/theme.ts'],
  ])('rejects %s through eslint.config.js, which the older selector misses', (_name, code, file) => {
    const found = lintApp(code, file);
    expect(found.guard.length).toBeGreaterThanOrEqual(1);
    expect(found.selector).toEqual([]);
  });

  it.each([
    'src/theme/themes/momentum.ts',
    'src/ui/__tests__/AppButton.test.tsx',
  ])('keeps %s exempt in the effective config', (file) => {
    expect(lintApp('export const s = { color: "#ffffff" };', file).guard).toEqual([]);
  });

  it('keeps the typography and radius restrictions on the shared selector', () => {
    const found = lintApp('export const s = { fontSize: 16, lineHeight: 24, fontFamily: "Inter", borderRadius: 28 };');
    expect(found.selector.filter((message) => message.message === typographyMessage)).toHaveLength(4);
    expect(found.guard).toEqual([]);
  });

  it.each([
    'src/ui/momentum-assets.ts',
    'src/ui/MomentumAsset.tsx',
  ])('passes the real %s with no exemption', (file) => {
    const found = lintApp(readFileSync(join(appRoot, file), 'utf8'), file);
    expect(found.guard).toEqual([]);
  });
});
