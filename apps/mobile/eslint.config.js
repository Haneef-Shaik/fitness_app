const { defineConfig } = require('eslint/config');
const expo = require('eslint-config-expo/flat');
const { colorGuardConfig } = require('./scripts/lint-rules/no-literal-color.cjs');

module.exports = defineConfig([
  expo,
  { ignores: ['dist/**', 'dist-native/**', 'dist-verified/**', 'coverage/**', '.expo/**'] },
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/theme/**', 'src/**/__tests__/**'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Literal[value=/^(#[a-fA-F0-9]{3,8}|rgba?\\(|hsla?\\()/]',
          message: 'Use semantic theme colors. Define palette values in src/theme/themes/.',
        },
        {
          selector: 'Property[key.name=/^(fontSize|lineHeight|fontFamily|borderRadius)$/] > Literal',
          message: 'Use the shared typography or radius tokens from useTheme().',
        },
      ],
    },
  },
  // DS-1 colour guard: every colour in src/ comes from a theme role; only src/theme/themes/ and tests are exempt.
  colorGuardConfig(),
]);
