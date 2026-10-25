import { useState } from 'react';
import { Switch, View } from 'react-native';
import { requireBackend } from '@/lib/supabase';
import { t } from '@/lib/i18n';
import { useTheme } from '@/theme';
import { AppButton, AppText, Card, Field, Screen } from '@/ui';

export function OnboardingScreen({ onComplete }: { onComplete: () => void }) {
  const { theme } = useTheme(); const [name, setName] = useState(''); const [dob, setDob] = useState('');
  const [zone, setZone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone); const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  async function save() {
    setBusy(true); setError('');
    try {
      const { error: failure } = await requireBackend().rpc('complete_onboarding', { p_name: name.trim(), p_dob: dob, p_timezone: zone, p_locale: 'en', p_terms: 'development-2026-10-17', p_privacy: 'development-2026-10-17' });
      if (failure) throw failure; onComplete();
    } catch (e) { setError(e instanceof Error ? e.message : t('loadFailed')); } finally { setBusy(false); }
  }
  return <Screen>
    <AppText variant="display">{t('aboutYou')}</AppText><AppText tone="muted">{t('aboutYouBody')}</AppText>
    <Field label={t('displayName')} value={name} onChangeText={setName} autoComplete="name" maxLength={100} />
    <Field label={t('dateOfBirth')} placeholder={t('dateFormat')} value={dob} onChangeText={setDob} />
    <AppText tone="muted" variant="caption">{t('adultRequired')}</AppText>
    <Field label={t('timezoneLabel')} value={zone} onChangeText={setZone} autoCapitalize="none" />
    <Card><AppText>{t('developmentNotices')}</AppText></Card>
    <View style={{ flexDirection: 'row', gap: theme.spacing.lg, alignItems: 'center' }}>
      <Switch accessibilityLabel={t('consentLabel')} value={consent} onValueChange={setConsent} trackColor={{ false: theme.colors.outlineVariant, true: theme.colors.secondaryContainer }} thumbColor={theme.colors.primary} />
      <AppText style={{ flex: 1 }}>{t('consentLabel')}</AppText>
    </View>
    {!!error && <AppText tone="error">{error}</AppText>}
    <AppButton label={t('continue')} onPress={() => { void save(); }} loading={busy} disabled={!consent || !name.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(dob)} />
  </Screen>;
}
