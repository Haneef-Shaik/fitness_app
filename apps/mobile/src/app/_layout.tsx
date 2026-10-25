import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SystemUI from 'expo-system-ui';
import { t } from '@/lib/i18n';
import { ThemeProvider, useTheme } from '@/theme';
import { MemberProvider } from '@/data/MemberProvider';
import { useFonts } from 'expo-font';
import { GoogleSansFlex_400Regular } from '@expo-google-fonts/google-sans-flex/400Regular';
import { GoogleSansFlex_600SemiBold } from '@expo-google-fonts/google-sans-flex/600SemiBold';
import { GoogleSansFlex_700Bold } from '@expo-google-fonts/google-sans-flex/700Bold';
import { RobotoCondensed_700Bold } from '@expo-google-fonts/roboto-condensed/700Bold';
import { NotoSansDevanagari_400Regular } from '@expo-google-fonts/noto-sans-devanagari/400Regular';
import { NotoSansDevanagari_700Bold } from '@expo-google-fonts/noto-sans-devanagari/700Bold';

void SplashScreen.preventAutoHideAsync();

function AppLayout() {
  const { theme, hydrated } = useTheme();
  const [fontsLoaded, fontError] = useFonts({ GoogleSansFlex_400Regular, GoogleSansFlex_600SemiBold, GoogleSansFlex_700Bold,
    RobotoCondensed_700Bold, NotoSansDevanagari_400Regular, NotoSansDevanagari_700Bold });
  const ready = hydrated && (fontsLoaded || !!fontError);

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(theme.colors.surface);
  }, [theme.colors.surface]);

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  return <View style={{ flex: 1, backgroundColor: theme.colors.surface }}>
    <StatusBar style={theme.scheme === 'dark' ? 'light' : 'dark'} />
    {ready ? <MemberProvider><Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.surface } }} /></MemberProvider> :
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={theme.colors.primary} accessibilityLabel={t('loading')} />
      </View>}
  </View>;
}

export default function RootLayout() {
  return <SafeAreaProvider><ThemeProvider><AppLayout /></ThemeProvider></SafeAreaProvider>;
}
