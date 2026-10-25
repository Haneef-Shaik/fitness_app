import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Text, useColorScheme } from 'react-native';
import { AppearanceScreen } from '@/features/settings/AppearanceScreen';
import { t } from '@/lib/i18n';
import { ThemeProvider, useTheme } from '@/theme';
import { createPreferenceStore } from '@/theme/preference-store';
import { AppButton } from '../AppButton';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async () => null), setItem: jest.fn(async () => {}),
}));
jest.mock('expo-router', () => ({ Link: ({ children }: { children: React.ReactNode }) => children }));
jest.mock('react-native-safe-area-context', () => jest.requireActual('react-native-safe-area-context/jest/mock').default);
jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({ __esModule: true, default: jest.fn(() => 'light') }));

function Probe() {
  const { theme } = useTheme();
  return <Text testID="scheme">{theme.scheme}</Text>;
}

describe('theme integration', () => {
  it('changes appearance through accessible controls and persists the choice', async () => {
    const storage = { getItem: jest.fn(async () => null), setItem: jest.fn(async () => {}) };
    const store = createPreferenceStore(storage);
    await store.hydrate();
    render(<ThemeProvider store={store}><AppearanceScreen /><Probe /></ThemeProvider>);
    expect(screen.getByRole('radio', { name: t('system') })).toBeChecked();
    fireEvent.press(screen.getByRole('radio', { name: t('dark') }));
    expect(screen.getByTestId('scheme')).toHaveTextContent('dark');
    expect(screen.getByRole('radio', { name: t('dark') })).toBeChecked();
    await act(async () => { await Promise.resolve(); });
    expect(storage.setItem).toHaveBeenCalledWith('@fitlog/appearance/v1', 'dark');
  });

  it('tracks OS changes only while the system preference is selected', async () => {
    const store = createPreferenceStore({ getItem: async () => null, setItem: async () => {} });
    await store.hydrate();
    const tree = () => <ThemeProvider store={store}><Probe /></ThemeProvider>;
    const view = render(tree());
    jest.mocked(useColorScheme).mockReturnValue('dark');
    view.rerender(tree());
    expect(screen.getByTestId('scheme')).toHaveTextContent('dark');
    await act(async () => { await store.setPreference('light'); });
    expect(screen.getByTestId('scheme')).toHaveTextContent('light');
    jest.mocked(useColorScheme).mockReturnValue('light');
  });

  it('keeps disabled and loading actions unavailable', async () => {
    const press = jest.fn();
    const store = createPreferenceStore({ getItem: async () => null, setItem: async () => {} });
    await store.hydrate();
    render(<ThemeProvider store={store}>
      <AppButton label="Disabled" disabled onPress={press} />
      <AppButton label="Loading" loading onPress={press} />
    </ThemeProvider>);
    fireEvent.press(screen.getByRole('button', { name: 'Disabled' }));
    fireEvent.press(screen.getByRole('button', { name: 'Loading' }));
    expect(press).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Loading' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Loading' })).toBeBusy();
  });
});
