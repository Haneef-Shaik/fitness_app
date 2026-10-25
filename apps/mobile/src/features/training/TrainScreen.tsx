import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable } from 'react-native';
import { useMember } from '@/data/MemberProvider';
import { t } from '@/lib/i18n';
import { useTheme } from '@/theme';
import { AppButton, AppText, Card, Header, Screen } from '@/ui';

export function TrainScreen() {
  const { data, store } = useMember(); const { theme } = useTheme(); const router = useRouter(); const [error, setError] = useState('');
  async function start() { try { const id = await store.startWorkout(t('scratchWorkout')); router.push({ pathname: '/workout/[id]', params: { id } }); } catch (e) { setError(e instanceof Error ? e.message : t('loadFailed')); } }
  return <Screen>
    <Header title={t('train')} action={t('history')} onAction={() => router.push('/history')} />
    <AppButton label={t('newProgramme')} onPress={() => router.push('/programme/new')} />
    {data.programmes.filter((p) => !p.archived).map((programme) => <Pressable key={programme.id} onPress={() => router.push({ pathname: '/programme/[id]', params: { id: programme.id } })} accessibilityRole="button">
      <Card tone={programme.current ? 'tonal' : 'surface'}>
        <AppText variant="title" style={{ color: programme.current ? theme.colors.onSecondaryContainer : theme.colors.onSurface }}>{programme.name}</AppText>
        <AppText tone="muted">{programme.days.map((d) => d.name).join(' · ')}</AppText>
        {programme.current && <AppText variant="label" tone="accent">{t('current')}</AppText>}
      </Card>
    </Pressable>)}
    {!data.programmes.some((p) => !p.archived) && <Card><AppText variant="title">{t('noProgrammes')}</AppText><AppText tone="muted">{t('noProgrammesBody')}</AppText></Card>}
    <AppButton label={t('scratchWorkout')} variant="secondary" onPress={() => { void start(); }} />
    <AppButton label={t('exercises')} variant="secondary" onPress={() => router.push('/exercises')} />
    <AppButton label={t('calendar')} variant="secondary" onPress={() => router.push('/schedule')} />
    {!!error && <AppText tone="error">{error}</AppText>}
  </Screen>;
}
