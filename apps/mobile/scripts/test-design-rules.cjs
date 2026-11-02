const assert = require('node:assert/strict');
const { ESLint } = require('eslint');
const { ruleId: colourGuard } = require('./lint-rules/no-literal-color.cjs');

/**
 * Runs against the app's real eslint.config.js, as `pnpm lint` loads it. Typography and radius stay on
 * the shared `no-restricted-syntax` selector; colour is DS-1's wired `fitlog-colors/no-literal-color`.
 * Remove `colorGuardConfig()` from eslint.config.js and the colour assertions below fail.
 */
const selector = 'no-restricted-syntax';
const typographyMessage = 'Use the shared typography or radius tokens from useTheme().';

const count = (result, ruleId, message) =>
  result.messages.filter((entry) => entry.ruleId === ruleId && (message === undefined || entry.message === message)).length;

/** A rule's severity in a calculated config: 'error'/2, ['error', …] or [2, …] all read as 2. */
function severity(setting) {
  const level = Array.isArray(setting) ? setting[0] : setting;
  return { off: 0, warn: 1, error: 2 }[level] ?? level ?? 0;
}

async function verify() {
  const eslint = new ESLint();
  const lint = async (code, filePath) => (await eslint.lintText(code, { filePath }))[0];

  const raw = await lint(
    'export const style = { color: "#ffffff", fontSize: 16, lineHeight: 24, fontFamily: "Inter", borderRadius: 28 };',
    'src/ui/guard-fixture.ts',
  );
  assert.equal(count(raw, selector, typographyMessage), 4,
    'The design rules must reject literal font sizes, line heights, font families and radii in UI code.');
  assert.equal(count(raw, colourGuard), 1, `The wired ${colourGuard} must reject a literal colour in UI code.`);

  // Only the wired guard catches these: the older selector sees string literals that start with a colour.
  const onlyTheGuard = [
    ['a colour in a template literal', 'export const s = (a: number) => ({ color: `rgba(0,0,0,${a})` });', 'src/ui/guard-fixture.ts'],
    ['a named colour on MomentumAsset tint', 'export const icon = <MomentumAsset name="imgCheck" tint="white" />;', 'src/ui/guard-fixture.tsx'],
    ['a named Reanimated target through an alias', 'import { withTiming as tween } from "react-native-reanimated"; export const go = () => tween("white");', 'src/ui/guard-fixture.ts'],
    ['an aliased PlatformColor', 'import { PlatformColor as PC } from "react-native"; export const s = { color: PC("systemBlue") };', 'src/ui/guard-fixture.ts'],
    ['a literal colour in src/theme outside themes/', 'export const s = { color: "#ffffff" };', 'src/theme/guard-fixture.ts'],
  ];
  for (const [name, code, filePath] of onlyTheGuard) {
    const result = await lint(code, filePath);
    assert.equal(count(result, colourGuard), 1, `The wired ${colourGuard} must reject ${name} (${filePath}).`);
  }

  // The only exemptions: palette definitions and tests.
  for (const filePath of ['src/theme/themes/guard-fixture.ts', 'src/ui/__tests__/guard-fixture.test.ts']) {
    const exempt = await lint('export const s = { color: "#ffffff" };', filePath);
    assert.equal(count(exempt, colourGuard), 0, `${filePath} is a palette or test file and must stay exempt.`);
  }

  // The bundled assets are guarded too, with no file exemption.
  for (const filePath of ['src/ui/momentum-assets.ts', 'src/ui/MomentumAsset.tsx']) {
    const config = await eslint.calculateConfigForFile(filePath);
    assert.equal(severity(config?.rules?.[colourGuard]), 2, `${colourGuard} must run as an error on ${filePath}.`);
  }

  const good = await lint(
    'export const styles = (theme) => ({ color: theme.colors.onSurface, ...theme.typography.body, borderRadius: theme.radius.card });',
    'src/ui/guard-fixture.ts',
  );
  assert.equal(count(good, selector), 0);
  assert.equal(count(good, colourGuard), 0);
  console.log(`Design rules verified: raw visual values fail; ${colourGuard} is wired; semantic tokens pass.`);
}

verify().catch((error) => { console.error(error); process.exitCode = 1; });
