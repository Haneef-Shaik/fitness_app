import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { localDateAt, addDays } from '@fitlog/domain';
import { useMember } from '@/data/MemberProvider';
import { scheduleProgramme } from '@/data/api';
import { formatDate, t } from '@/lib/i18n';
import { AppButton, AppText, Card, Field, Header, Screen } from '@/ui';

export function ScheduleScreen() {
  const { data, profile, store } = useMember(); const router = useRouter(); const { programmeId } = useLocalSearchParams<{ programmeId?: string }>();
  const today = localDateAt(new Date(), profile.timezone); const [effective, setEffective] = useState(today); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const programme = data.programmes.find((p) => p.id === programmeId);
  async function save() { if (!programme) return; setBusy(true); setError(''); try { await store.sync(); const current = store.getSnapshot().data.programmes.find((p) => p.id === programme.id)!; await store.onlineWrite(() => scheduleProgramme(current.id, current.version, effective, profile.timezone)); } catch (e) { setError(e instanceof Error ? e.message : t('saveFailedDraft')); } finally { setBusy(false); } }
  async function start(id: string) {
    const occurrence = data.occurrences.find((o) => o.id === id)!; const p = data.programmes.find((p) => p.id === occurrence.programmeId); const day = p?.days.find((d) => d.id === occurrence.dayId);
    if (!p || !day) return;
    try { const sid = await store.startWorkout(day.name, day, p, occurrence); router.push({ pathname: '/workout/[id]', params: { id: sid } }); } catch (e) { setError(e instanceof Error ? e.message : t('loadFailed')); }
  }
  const occurrences = data.occurrences.filter((o) => o.status !== 'cancelled' && o.date >= addDays(today, -7) && o.date <= addDays(today, 30) && (!programmeId || o.programmeId === programmeId)).sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
  return <Screen><Header title={t('calendar')} back />
    {programme && <Card><AppText variant="title">{programme.name}</AppText><AppText tone="muted">{t('scheduleHint')}</AppText><Field label={t('scheduleFrom')} value={effective} onChangeText={setEffective} placeholder={t('dateFormat')} /><AppButton label={t('save')} loading={busy} onPress={() => { void save(); }} /></Card>}
    {!!error && <AppText tone="error">{error}</AppText>}
    {occurrences.map((o) => { const p = data.programmes.find((p) => p.id === o.programmeId); const day = p?.days.find((d) => d.id === o.dayId); return <Card key={o.id}>
      <AppText variant="caption" tone="muted">{formatDate(o.date)} · {o.timezone}</AppText><AppText variant="title">{day?.name ?? p?.name}</AppText>
      <AppText>{o.status === 'completed' ? t('completed') : o.date < today ? t('notLogged') : t('notScheduled')}</AppText>
      {occurrences.filter((other) => other.date === o.date).length > 1 && <AppText tone="muted">{t('scheduleConflict')}</AppText>}
      {o.date <= today && o.status !== 'completed' && !o.sessionId && <><AppText variant="caption">{t('countsToward')}: {day?.name} · {formatDate(o.date)}</AppText><AppButton label={t('startWorkout')} onPress={() => { void start(o.id); }} /></>}
    </Card>; })}
    {!occurrences.length && <AppText tone="muted">{t('notScheduled')}</AppText>}
  </Screen>;
}
