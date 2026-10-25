import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable } from 'react-native';
import { sessionSummary } from '@fitlog/domain';
import { useMember } from '@/data/MemberProvider';
import { t } from '@/lib/i18n';
import { AppText, Card, Field, Header, Screen } from '@/ui';
export function HistoryScreen() {
  const { data } = useMember(); const router = useRouter(); const [search, setSearch] = useState('');
  const sessions = data.sessions.filter((s) => s.status === 'completed' && !s.deletedAt && [s.name, ...s.instances.map((i) => i.exercise.name)].some((value) => value.toLowerCase().includes(search.toLowerCase()))).sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  return <Screen><Header title={t('workoutHistory')} back /><Field label={t('searchExercises')} value={search} onChangeText={setSearch} />
    {sessions.map((s) => { const summary = sessionSummary(s); return <Pressable key={s.id} onPress={() => router.push({ pathname: '/workout/[id]', params: { id: s.id } })} accessibilityRole="button"><Card><AppText variant="caption" tone="muted">{s.localDate}</AppText><AppText variant="title">{s.name}</AppText><AppText>{summary.workingSets} {t('workingSets')} · {Math.round(summary.durationSeconds / 60)} min</AppText><AppText tone="muted">{summary.volume.toLocaleString()} kg·reps</AppText></Card></Pressable>; })}
    {!sessions.length && <Card><AppText variant="title">{t('noHistory')}</AppText><AppText tone="muted">{t('noHistoryBody')}</AppText></Card>}
  </Screen>;
}
