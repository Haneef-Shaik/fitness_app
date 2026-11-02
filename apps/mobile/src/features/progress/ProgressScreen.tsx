import { useState } from 'react';
import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { epley, latestDailyWeights, localDateAt, movingWeight } from '@fitlog/domain';
import { useMember } from '@/data/MemberProvider';
import { formatCount, formatDate, formatMeasure, t } from '@/lib/i18n';
import { useTheme } from '@/theme';
import { AppButton, AppText, Card, Choice, Header, Screen } from '@/ui';

export function ProgressScreen() {
  const { data, profile } = useMember(); const { theme } = useTheme(); const router = useRouter(); const [mode, setMode] = useState<'strength' | 'body' | 'habits'>('strength');
  const completed = data.sessions.filter((s) => s.status === 'completed' && !s.deletedAt); const records = new Map<string, { name: string; maxLoad: number; e1rm: number | null }>();
  for (const session of completed) for (const set of session.sets.filter((s) => !s.deletedAt && s.type !== 'warmup')) {
    const exercise = session.instances.find((i) => i.id === set.instanceId)?.exercise;
    if (!exercise || exercise.loadBasis === 'assistance' || exercise.type !== 'resistance' || set.loadKg === null) continue;
    const key = `${exercise.id}:${exercise.version}:${exercise.loadBasis}`; const prior = records.get(key); const estimate = epley(set, exercise);
    records.set(key, { name: exercise.name, maxLoad: Math.max(prior?.maxLoad ?? 0, set.loadKg), e1rm: Math.max(prior?.e1rm ?? 0, estimate ?? 0) || null });
  }
  const weights = latestDailyWeights(data.body); const avg = movingWeight(data.body, localDateAt(new Date(), profile.timezone));
  return <Screen><Header title={t('progress')} action={t('goals')} onAction={() => router.push('/goals')} />
    <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', gap: theme.spacing.sm }}>{(['strength', 'body', 'habits'] as const).map((v) => <Choice key={v} label={t(v)} selected={mode === v} onPress={() => setMode(v)} />)}</View>
    {mode === 'strength' && <>
      {[...records].map(([key, record]) => <Card key={key}><AppText variant="title">{record.name}</AppText><AppText variant="number">{formatMeasure(record.maxLoad, 'kg')}</AppText><AppText tone="muted">{t('maxLoad')}</AppText><AppText>{formatMeasure(record.e1rm, 'kg')} · {t('e1rmFormula')}</AppText></Card>)}
      {!records.size && <Card><AppText variant="title">{t('noRecords')}</AppText><AppText tone="muted">{t('noRecordsBody')}</AppText></Card>}
      <AppButton label={t('workoutHistory')} variant="secondary" onPress={() => router.push('/history')} />
    </>}
    {mode === 'body' && <>
      <Card><AppText variant="title">{t('sevenDayAverage')}</AppText><AppText variant="number">{formatMeasure(avg?.value, 'kg')}</AppText><AppText tone="muted">{avg ? formatCount('measurementCount', avg.count) : t('notMeasured')}</AppText></Card>
      <AppButton label={t('addBody')} onPress={() => router.push('/body-add')} />
      {[...weights].reverse().map((w) => <Card key={w.id}><AppText>{formatDate(w.localDate)}</AppText><AppText variant="title">{formatMeasure(w.weightKg, 'kg')}</AppText>{w.notes && <AppText tone="muted">{w.notes}</AppText>}</Card>)}
    </>}
    {mode === 'habits' && <><Card><AppText variant="number">{completed.length}</AppText><AppText>{t('sessions')}</AppText></Card><AppButton label={t('workoutHistory')} onPress={() => router.push('/history')} /></>}
  </Screen>;
}
