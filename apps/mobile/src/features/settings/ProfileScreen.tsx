import { useState } from 'react';
import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { useMember } from '@/data/MemberProvider';
import { requireBackend } from '@/lib/supabase';
import { setCurrentLocale, t } from '@/lib/i18n';
import { useTheme } from '@/theme';
import { AppButton, AppText, Choice, Field, Header, Screen } from '@/ui';

export function ProfileScreen() {
  const { profile, store } = useMember(); const { theme } = useTheme(); const router = useRouter();
  const [name, setName] = useState(profile.displayName); const [zone, setZone] = useState(profile.timezone); const [weekly, setWeekly] = useState(String(profile.weeklyGoal));
  const [locale, setLocale] = useState(profile.locale); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  async function save() { setBusy(true); setError(''); try {
    if (!name.trim() || name.trim().length > 100 || !Number.isInteger(Number(weekly)) || Number(weekly) < 1 || Number(weekly) > 7) throw new Error(t('invalidProfile'));
    new Intl.DateTimeFormat('en', { timeZone: zone });
    const { error: failure } = await requireBackend().from('profiles').update({ display_name: name.trim(), timezone: zone, locale, weekly_goal: Number(weekly), updated_at: new Date().toISOString() }).eq('id', profile.id);
    if (failure) throw failure;
    setCurrentLocale(locale); await store.updateProfile({ ...profile, displayName: name.trim(), timezone: zone, locale, weeklyGoal: Number(weekly) }); router.back();
  } catch (e) { setError(e instanceof Error ? e.message : t('loadFailed')); } finally { setBusy(false); } }
  return <Screen><Header title={t('profile')} back /><Field label={t('displayName')} value={name} onChangeText={setName} />
    <Field label={t('timezoneLabel')} value={zone} onChangeText={setZone} autoCapitalize="none" /><Field label={t('weeklyGoal')} value={weekly} onChangeText={setWeekly} inputMode="numeric" />
    <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', gap: theme.spacing.sm }}><Choice label="English" selected={locale === 'en'} onPress={() => setLocale('en')} /><Choice label="हिन्दी" selected={locale === 'hi'} onPress={() => setLocale('hi')} /></View>
    {!!error && <AppText tone="error">{error}</AppText>}<AppButton label={t('save')} loading={busy} onPress={() => { void save(); }} />
  </Screen>;
}
