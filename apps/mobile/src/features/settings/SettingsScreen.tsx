import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useMember } from '@/data/MemberProvider';
import { requireBackend } from '@/lib/supabase';
import { gymOperations } from '@/data/gym-outbox';
import { t } from '@/lib/i18n';
import { AppButton, AppText, Card, Header, Screen } from '@/ui';

export function SettingsScreen() {
  const { profile, operations, store } = useMember(); const router = useRouter(); const [error, setError] = useState('');
  async function signOut() {
    if (operations.some((o) => o.status !== 'synced') || gymOperations(store).some((o) => o.status !== 'confirmed')) { setError(t('signOutPending')); return; }
    const { error: failure } = await requireBackend().auth.signOut(); if (failure) setError(failure.message);
  }
  return <Screen><Header title={t('settings')} back />
    <Card><AppText variant="title">{profile.displayName}</AppText><AppText tone="muted">{profile.timezone}</AppText></Card>
    <AppButton label={t('appearance')} variant="secondary" onPress={() => router.push('/appearance')} />
    <AppButton label={t('profile')} variant="secondary" onPress={() => router.push('/profile')} />
    <AppButton label={t('syncCentre')} variant="secondary" onPress={() => router.push('/sync')} />
    <AppButton label={t('nutritionTargets')} variant="secondary" onPress={() => router.push('/nutrition-targets')} />
    <AppButton label={t('workspaces')} variant="secondary" onPress={() => router.push('/gyms')} />
    <AppButton label={t('signOut')} variant="secondary" onPress={() => { void signOut(); }} />
    {!!error && <AppText tone="error">{error}</AppText>}
  </Screen>;
}
