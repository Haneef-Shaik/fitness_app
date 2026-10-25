import { useState } from 'react';
import { View } from 'react-native';
import * as Linking from 'expo-linking';
import { z } from 'zod';
import { AUTH_CALLBACK_PATH } from '@/lib/auth-callback';
import { requireBackend, backendConfigured } from '@/lib/supabase';
import { t } from '@/lib/i18n';
import { useTheme } from '@/theme';
import { AppButton, AppText, Choice, Field, Screen } from '@/ui';

export function AuthScreen() {
  const { theme } = useTheme(); const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login');
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState(''); const [error, setError] = useState('');
  async function submit() {
    setError(''); setMessage('');
    if (!z.email().safeParse(email.trim()).success) { setError(t('email')); return; }
    if (mode !== 'reset' && (mode === 'signup' ? password.length < 12 : !password)) { setError(t('passwordHint')); return; }
    setBusy(true);
    try {
      const client = requireBackend();
      const redirectTo = Linking.createURL(AUTH_CALLBACK_PATH);
      if (mode === 'reset') { const result = await client.auth.resetPasswordForEmail(email.trim(), { redirectTo }); if (result.error) throw result.error; setMessage(t('resetSent')); }
      else if (mode === 'signup') { const result = await client.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: redirectTo } }); if (result.error) throw result.error; setMessage(t('verifyEmail')); }
      else { const result = await client.auth.signInWithPassword({ email: email.trim(), password }); if (result.error) throw result.error; }
    } catch (e) { setError(e instanceof Error ? e.message : t('authUnavailable')); }
    finally { setBusy(false); }
  }
  return <Screen>
    <View style={{ gap: theme.spacing.lg, paddingTop: theme.spacing.section }}>
      <AppText variant="display">{t('welcome')}</AppText>
      <AppText tone="muted">{t('welcomeBody')}</AppText>
    </View>
    <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
      <Choice label={t('signIn')} selected={mode === 'login'} onPress={() => setMode('login')} />
      <Choice label={t('signUp')} selected={mode === 'signup'} onPress={() => setMode('signup')} />
    </View>
    <Field label={t('email')} value={email} onChangeText={setEmail} inputMode="email" autoCapitalize="none" autoComplete="email" />
    {mode !== 'reset' && <Field label={t('password')} value={password} onChangeText={setPassword} secureTextEntry autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} />}
    {mode === 'signup' && <AppText tone="muted" variant="caption">{t('passwordHint')}</AppText>}
    {!backendConfigured && <AppText tone="error">{t('authUnavailable')}</AppText>}
    {!!error && <AppText tone="error" accessibilityLiveRegion="polite">{error}</AppText>}
    {!!message && <AppText accessibilityLiveRegion="polite">{message}</AppText>}
    <AppButton label={t(mode === 'login' ? 'signIn' : mode === 'signup' ? 'signUp' : 'resetPassword')} loading={busy} disabled={!backendConfigured} onPress={() => { void submit(); }} />
    <AppButton label={t(mode === 'reset' ? 'signIn' : 'forgotPassword')} variant="secondary" onPress={() => setMode(mode === 'reset' ? 'login' : 'reset')} />
  </Screen>;
}
