import type { ExpoConfig } from 'expo/config';
import momentum from './src/theme/themes/momentum.json';

const config: ExpoConfig = {
  name: 'FitLog',
  slug: 'fitlog',
  scheme: 'fitlog',
  version: '0.1.0',
  userInterfaceStyle: 'automatic',
  backgroundColor: momentum.colors.light.surface,
  ios: { supportsTablet: false },
  android: {},
  web: { bundler: 'metro', output: 'single', name: 'FitLog' },
  plugins: [
    'expo-router',
    'expo-system-ui',
    'expo-secure-store',
    'expo-sharing',
    ['expo-sqlite', { useSQLCipher: true }],
    ['expo-splash-screen', {
      backgroundColor: momentum.colors.light.surface,
      dark: { backgroundColor: momentum.colors.dark.surface },
    }],
  ],
};

export default config;
