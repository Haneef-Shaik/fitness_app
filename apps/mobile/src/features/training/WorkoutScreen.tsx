import { useEffect, useRef, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';
import * as Crypto from 'expo-crypto';
import { previousPerformance, sessionSummary, type PerformedSet, type SessionInstance, type WorkoutSession } from '@fitlog/domain';
import { useMember } from '@/data/MemberProvider';
import { t } from '@/lib/i18n';
import { signalMoment } from '@/motion/moments';
import { useTheme } from '@/theme';
import { AppButton, AppText, Card, Choice, Field, Header, Screen } from '@/ui';

function formatTime(seconds: number) { return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`; }

function SetEntry({ workout, instance }: { workout: WorkoutSession; instance: SessionInstance }) {
  const { data, store } = useMember(); const { theme } = useTheme(); const router = useRouter();
  const prior = previousPerformance(data.sessions, instance.exercise, workout.startedAt);
  const last = workout.sets.filter((s) => s.instanceId === instance.id && !s.deletedAt).at(-1);
  const [load, setLoad] = useState(String(instance.prescription?.loadKg ?? last?.loadKg ?? prior?.sets[0]?.loadKg ?? ''));
  const [reps, setReps] = useState(String(instance.prescription?.repsMin ?? last?.reps ?? prior?.sets[0]?.reps ?? ''));
  const [duration, setDuration] = useState(String(instance.prescription?.durationSeconds ?? last?.durationSeconds ?? ''));
  const [distance, setDistance] = useState(String(instance.prescription?.distanceMetres ?? last?.distanceMetres ?? ''));
  const [rpe, setRpe] = useState(''); const [rir, setRir] = useState(''); const [notes, setNotes] = useState('');
  const [type, setType] = useState<PerformedSet['type']>('working'); const [error, setError] = useState('');
  const committing = useRef(false); const mutation = useRef(Crypto.randomUUID());
  const resistance = instance.exercise.type === 'resistance' || instance.exercise.type === 'bodyweight';
  const timed = instance.exercise.type === 'timed' || instance.exercise.type === 'distance';
  async function log() {
    // The ref blocks a double tap. No spinner: nothing animates before the durable acknowledgement (DS-3).
    if (committing.current) return;
    committing.current = true; setError('');
    let durable = false;
    try {
      const number = (value: string) => value.trim() ? Number(value.replace(',', '.')) : null;
      // Resolves only after the local write, so the set is durable before any feedback.
      await store.logSet(workout.id, { instanceId: instance.id, reps: resistance ? number(reps) : null, loadKg: number(load), durationSeconds: timed ? number(duration) : null,
        distanceMetres: instance.exercise.type === 'distance' ? number(distance) : null, rpe: number(rpe), rir: number(rir), type, notes }, instance.prescription?.restSeconds ?? 90, mutation.current);
      durable = true;
      mutation.current = Crypto.randomUUID();
    } catch (e) { setError(e instanceof Error ? e.message : t('loadFailed')); }
    finally { committing.current = false; }
    if (!durable) return;
    signalMoment('setLogged', t('setLogged'));
    void store.sync();
  }
  return <View style={{ gap: theme.spacing.lg }}>
    <Card><AppText variant="headline">{instance.exercise.name}</AppText><AppText tone="muted">{instance.exercise.equipment} · {instance.exercise.loadBasis}</AppText>
      <View style={{ flexDirection: 'row', gap: theme.spacing.md }}>
        <View style={{ flex: 1 }}><Field label={`${t('load')} (kg)`} inputMode="decimal" value={load} onChangeText={setLoad} /></View>
        {resistance && <View style={{ flex: 1 }}><Field label={t('reps')} inputMode="numeric" value={reps} onChangeText={setReps} /></View>}
      </View>
      {timed && <Field label={t('durationSeconds')} inputMode="numeric" value={duration} onChangeText={setDuration} />}
      {instance.exercise.type === 'distance' && <Field label={t('distanceMetres')} inputMode="decimal" value={distance} onChangeText={setDistance} />}
      <View style={{ flexDirection: 'row', gap: theme.spacing.md }}><View style={{ flex: 1 }}><Field label={t('addRpe')} value={rpe} onChangeText={setRpe} inputMode="decimal" /></View><View style={{ flex: 1 }}><Field label={t('addRir')} value={rir} onChangeText={setRir} inputMode="numeric" /></View></View>
      <Field label={t('notes')} value={notes} onChangeText={setNotes} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }} accessibilityRole="radiogroup">
        {(['working', 'warmup', 'drop', 'failure'] as const).map((v) => <Choice key={v} label={t(v)} selected={type === v} onPress={() => setType(v)} />)}
      </View>
    </Card>
    <AppText tone="muted" variant="caption">{prior ? `${t('previous')}: ${prior.sets[0]?.loadKg ?? '—'} kg × ${prior.sets[0]?.reps ?? '—'} · ${prior.session.localDate}` : t('noPrevious')}</AppText>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
      {workout.sets.filter((s) => s.instanceId === instance.id && !s.deletedAt).map((s, i) => <Pressable accessibilityRole="button" accessibilityLabel={`${t('edit')} ${i + 1}`} key={s.id} onPress={() => router.push({ pathname: '/set-edit', params: { sessionId: workout.id, setId: s.id } })}><Card tone="tonal" style={{ borderRadius: theme.radius.lg, padding: theme.spacing.md }}><AppText variant="label" style={{ color: theme.colors.onSecondaryContainer }}>{i + 1} · {s.reps ?? s.durationSeconds} {s.reps ? `× ${s.loadKg ?? 0} kg` : 's'}</AppText></Card></Pressable>)}
    </View>
    {!!error && <AppText tone="error" accessibilityLiveRegion="polite">{error}</AppText>}
    <AppButton label={t('logSet')} large onPress={() => { void log(); }} />
  </View>;
}

export function WorkoutScreen() {
  const { id } = useLocalSearchParams<{ id: string }>(); const { data, store } = useMember(); const { theme } = useTheme(); const router = useRouter();
  const [index, setIndex] = useState(0); const [now, setNow] = useState(() => Date.now()); const [confirm, setConfirm] = useState<'finish' | 'discard' | 'delete' | null>(null); const [error, setError] = useState('');
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  const workout = data.sessions.find((s) => s.id === id);
  if (!workout) return <Screen><Header title={t('notFound')} back /></Screen>;
  const summary = sessionSummary(workout, new Date(now).toISOString()); const instance = workout.instances[index];
  const remaining = workout.restDeadline ? Math.max(0, Math.ceil((new Date(workout.restDeadline).getTime() - now) / 1000)) : 0;
  async function finish() { try { if (confirm === 'delete') await store.deleteWorkout(id); else await store.finishWorkout(id, confirm === 'discard'); void store.sync(); setConfirm(null); } catch (e) { setError(e instanceof Error ? e.message : t('loadFailed')); } }
  const rest = (seconds: number | null) => { void store.adjustRest(id, seconds).catch((e: unknown) => setError(e instanceof Error ? e.message : t('loadFailed'))); };
  async function pause() {
    try { await store.updateWorkout(id, (s) => { const last = s.pauses.at(-1); const time = new Date().toISOString(); return { ...s, pauses: last && !last.endedAt ? s.pauses.map((p, i) => i === s.pauses.length - 1 ? { ...p, endedAt: time } : p) : [...s.pauses, { startedAt: time, endedAt: null }] }; }); }
    catch (e) { setError(e instanceof Error ? e.message : t('loadFailed')); }
  }
  return <Screen>
    <Header title={workout.status === 'completed' ? t('workoutComplete') : workout.name} back />
    <AppText variant="number">{formatTime(summary.durationSeconds)}</AppText>
    <AppText variant="caption" tone="muted">{workout.localDate} · {t(workout.syncState === 'synced' ? 'synced' : 'pendingSync')}</AppText>
    {workout.deletedAt ? <Card><AppText>{t('workoutDeleted')}</AppText>{now - new Date(workout.deletedAt).getTime() <= 10000 && <AppButton label={t('undo')} onPress={() => { void store.deleteWorkout(id, true).then(() => { void store.sync(); }).catch((e: unknown) => setError(e instanceof Error ? e.message : t('loadFailed'))); }} />}<AppButton label={t('done')} onPress={() => router.replace('/history')} /></Card> : workout.status === 'in_progress' ? <>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>{workout.instances.map((item, i) => <Choice key={item.id} label={item.exercise.name} selected={index === i} onPress={() => setIndex(i)} />)}</View>
      {remaining > 0 && <Card tone="tonal"><AppText variant="title" style={{ color: theme.colors.onSecondaryContainer }}>{t('resting')} · {formatTime(remaining)}</AppText><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}><AppButton label={t('subtract15')} variant="secondary" onPress={() => rest(-15)} /><AppButton label={t('add15')} variant="secondary" onPress={() => rest(15)} /><AppButton label={t('skipRest')} variant="secondary" onPress={() => rest(null)} /></View></Card>}
      {instance ? <SetEntry key={instance.id} workout={workout} instance={instance} /> : <AppText tone="muted">{t('selectExercise')}</AppText>}
      <AppButton label={t('addExercise')} variant="secondary" onPress={() => router.push({ pathname: '/exercises', params: { sessionId: id } })} />
      <AppButton label={t(workout.pauses.at(-1)?.endedAt === null ? 'resume' : 'pause')} variant="secondary" onPress={() => { void pause(); }} />
      <AppButton label={t('plateCalculator')} variant="secondary" onPress={() => router.push('/plates')} />
      <AppButton label={t('finishWorkout')} disabled={!workout.sets.some((s) => !s.deletedAt)} onPress={() => setConfirm('finish')} />
      <AppButton label={t('discardWorkout')} variant="secondary" onPress={() => setConfirm('discard')} />
    </> : <>
      <Card><AppText variant="title">{t('summary')}</AppText><AppText>{summary.workingSets} {t('workingSets')} · {summary.exerciseCount} {t('exercises')}</AppText><AppText variant="number">{summary.volume.toLocaleString()} kg·reps</AppText><AppText tone="muted">{t('volume')}</AppText></Card>
      {workout.instances.map((item) => <Card key={item.id}><AppText variant="title">{item.exercise.name}</AppText>{workout.sets.filter((s) => s.instanceId === item.id && !s.deletedAt).map((s, i) => <Pressable accessibilityRole="button" key={s.id} onPress={() => router.push({ pathname: '/set-edit', params: { sessionId: id, setId: s.id } })} style={{ minHeight: theme.dimensions.touchTarget, justifyContent: 'center' }}><AppText>{i + 1} · {s.reps ?? s.durationSeconds} {s.reps ? `× ${s.loadKg ?? 0} kg` : 's'} · {t(s.type)} · {t('edit')}</AppText></Pressable>)}</Card>)}
      <AppButton label={t('deleteWorkout')} variant="secondary" onPress={() => setConfirm('delete')} />
      <AppButton label={t('done')} onPress={() => router.replace('/today')} />
    </>}
    {confirm && <Card><AppText>{t(confirm === 'delete' ? 'confirmDeleteWorkout' : confirm === 'finish' ? 'confirmFinish' : 'confirmDiscard')}</AppText><AppButton label={t('confirm')} onPress={() => { void finish(); }} /><AppButton label={t('cancel')} variant="secondary" onPress={() => setConfirm(null)} /></Card>}
    {!!error && <AppText tone="error">{error}</AppText>}
  </Screen>;
}
