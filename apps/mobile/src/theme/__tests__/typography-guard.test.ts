import { Linter } from 'eslint';
import { appRoot, path } from './node';

// Only the app's own design-rule block is under test; Expo's shared preset adds no font rule.
jest.mock('eslint-config-expo/flat', () => []);

const appConfig = jest.requireActual<Linter.Config[]>('../../../eslint.config.js');
const parseJsx: Linter.Config = {
  files: ['**/*.{ts,tsx}'],
  languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
};
const linter = new Linter({ cwd: appRoot });

/** Lints a fixture as if it lived at `file` and returns the design-rule messages. */
function designRuleMessages(code: string, file: string): string[] {
  const messages = linter.verify(code, [...appConfig, parseJsx], { filename: path.join(appRoot, file) });
  // A parse error or an unmatched file would hide the rule, so nothing else may be reported.
  expect(messages.filter((message) => message.ruleId !== 'no-restricted-syntax')).toEqual([]);
  return messages.filter((message) => message.ruleId === 'no-restricted-syntax').map((message) => message.message);
}

const TYPE_MESSAGE = 'Use the shared typography or radius tokens from useTheme().';
const UI_FILES = ['src/ui/GuardFixture.tsx', 'src/features/today/GuardFixture.tsx', 'src/app/guard-fixture.tsx'];

/** [what is planted, fixture source, how many design-rule errors it must raise] */
const LITERAL_FONT_CASES: [string, string, number][] = [
  ['a font size', 'export const style = { fontSize: 16 };', 1],
  ['a line height', 'export const style = { lineHeight: 24 };', 1],
  ['a font family', "export const style = { fontFamily: 'Inter' };", 1],
  ['font literals inside StyleSheet.create',
    "import { StyleSheet } from 'react-native';\nexport const s = StyleSheet.create({ title: { fontSize: 28, fontFamily: 'Roboto' } });", 2],
  ['font literals in an inline JSX style',
    "import { Text } from 'react-native';\nexport const T = () => <Text style={{ fontSize: 18, fontFamily: 'System' }}>x</Text>;", 2],
];

describe('literal font guard (docs/23 §9 rule 4)', () => {
  it.each(LITERAL_FONT_CASES)('rejects %s in components, screens and routes', (_, code, count) => {
    for (const file of UI_FILES) {
      expect({ file, messages: designRuleMessages(code, file) }).toEqual({ file, messages: Array(count).fill(TYPE_MESSAGE) });
    }
  });

  it('accepts sizes, line heights and families taken from the theme', () => {
    const code = [
      'export const styles = (theme) => ({',
      '  title: { ...theme.typography.displayLarge },',
      '  figure: { fontFamily: theme.typography.numberHero.fontFamily, fontSize: theme.typography.numberHero.fontSize },',
      '  hindi: { lineHeight: theme.devanagariTypography.bodyLarge.lineHeight },',
      '});',
    ].join('\n');
    for (const file of UI_FILES) expect({ file, messages: designRuleMessages(code, file) }).toEqual({ file, messages: [] });
  });

  it('lets the theme itself define the literal ramp', () => {
    const code = "export const ramp = { displayLarge: { fontSize: 56, lineHeight: 64, fontFamily: 'GoogleSansFlex_700Bold' } };";
    expect(designRuleMessages(code, 'src/theme/fixture.ts')).toEqual([]);
  });
});
