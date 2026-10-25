import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMember } from '@/data/MemberProvider';
import { useDraft } from '@/data/useDraft';
import { t } from '@/lib/i18n';
import { AppButton, AppText, Card, Choice, Field, Header, Screen } from '@/ui';
import type { PerformedSet } from '@fitlog/domain';

export function EditSetScreen() {
  const { sessionId, setId } = useLocalSearchParams<{ sessionId: string; setId: string }>(); const { data, store } = useMember(); const router = useRouter();
  const workout = data.sessions.find((s) => s.id === sessionId); const set = workout?.sets.find((s) => s.id === setId); const instance = workout?.instances.find((i) => i.id === set?.instanceId);
  const draft = useDraft(`set:${setId}`, { reps: String(set?.reps ?? ''), load: String(set?.loadKg ?? ''), duration: String(set?.durationSeconds ?? ''), distance: String(set?.distanceMetres ?? ''), rpe: String(set?.rpe ?? ''), rir: String(set?.rir ?? ''), notes: set?.notes ?? '' });
  const [type, setType] = useState<PerformedSet['type']>(set?.type ?? 'working'); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const change = (key: keyof typeof draft.value, v: string) => draft.setValue((d) => ({ ...d, [key]: v }));
  async function save() {
    if (!set) return; setBusy(true); setError('');
    try { const n = (v: string) => v.trim() ? Number(v.replace(',', '.')) : null; await store.editSet(sessionId, { ...set, reps: n(draft.value.reps), loadKg: n(draft.value.load), durationSeconds: n(draft.value.duration), distanceMetres: n(draft.value.distance), rpe: n(draft.value.rpe), rir: n(draft.value.rir), notes: draft.value.notes, type }); await draft.clear(); void store.sync(); router.back(); }
    catch (e) { setError(e instanceof Error ? e.message : t('saveFailedDraft')); } finally { setBusy(false); }
  }
  if (!set || !instance) return <Screen><Header title={t('notFound')} back /></Screen>;
  return <Screen><Header title={`${t('edit')} · ${instance.exercise.name}`} back />
    {set.deletedAt ? <Card><AppText>{t('workoutDeleted')}</AppText><AppButton label={t('undo')} onPress={() => { void store.deleteSet(sessionId, setId, true).then(() => { void store.sync(); router.back(); }).catch((e: unknown) => setError(e instanceof Error ? e.message : t('loadFailed'))); }} /></Card> : <>
      {(['resistance', 'bodyweight'].includes(instance.exercise.type)) && <Field label={t('reps')} value={draft.value.reps} onChangeText={(v) => change('reps', v)} inputMode="numeric" />}
      <Field label={`${t('load')} (kg)`} value={draft.value.load} onChangeText={(v) => change('load', v)} inputMode="decimal" />
      {(['timed', 'distance'].includes(instance.exercise.type)) && <Field label={t('durationSeconds')} value={draft.value.duration} onChangeText={(v) => change('duration', v)} inputMode="numeric" />}
      {instance.exercise.type === 'distance' && <Field label={t('distanceMetres')} value={draft.value.distance} onChangeText={(v) => change('distance', v)} inputMode="decimal" />}
      <Field label={t('addRpe')} value={draft.value.rpe} onChangeText={(v) => change('rpe', v)} inputMode="decimal" /><Field label={t('addRir')} value={draft.value.rir} onChangeText={(v) => change('rir', v)} inputMode="numeric" />
      {(['working', 'warmup', 'drop', 'failure'] as const).map((value) => <Choice key={value} label={t(value)} selected={type === value} onPress={() => setType(value)} />)}
      <Field label={t('notes')} multiline value={draft.value.notes} onChangeText={(v) => change('notes', v)} /><AppButton label={t('save')} loading={busy} onPress={() => { void save(); }} />
      <AppButton label={t('remove')} variant="secondary" onPress={() => { void store.deleteSet(sessionId, setId).then(() => { void store.sync(); }).catch((e: unknown) => setError(e instanceof Error ? e.message : t('loadFailed'))); }} />
    </>}{!!error && <AppText tone="error">{error}</AppText>}
  </Screen>;
}
