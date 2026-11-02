import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { View } from 'react-native';
import * as Crypto from 'expo-crypto';
import { exerciseSchema, programmeSchema, type Programme, type Prescription } from '@fitlog/domain';
import { useMember } from '@/data/MemberProvider';
import { useDraft } from '@/data/useDraft';
import { formatMeasure, labelWithUnit, t } from '@/lib/i18n';
import { useTheme } from '@/theme';
import { AppButton, AppText, Card, Choice, Field, Header, Screen } from '@/ui';

export function ProgrammeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>(); const { data, store, drafts } = useMember(); const { theme } = useTheme(); const router = useRouter();
  const existing = data.programmes.find((p) => p.id === id); const [editing, setEditing] = useState(!existing);
  const draft = useDraft<Programme>(`programme:${id}`, existing ?? { id: Crypto.randomUUID(), name: '', description: '', version: 1, days: [{ id: Crypto.randomUUID(), name: '', notes: '', exercises: [], weekdays: [] }], archived: false, current: data.programmes.length === 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, (raw) => programmeSchema.parse(raw));
  const programme = draft.value; const setProgramme = draft.setValue;
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [error, setError] = useState(''); const [selection, setSelection] = useState<{ day: string; key: string } | null>(null);
  const picked = selection ? exerciseSchema.safeParse(drafts[selection.key]) : null;
  const resolved = picked?.success && selection && !programme.days.find((d) => d.id === selection.day)?.exercises.some((p) => p.id === selection.key)
    ? { ...programme, days: programme.days.map((d) => d.id === selection.day ? { ...d, exercises: [...d.exercises, { id: selection.key, exercise: picked.data, sets: 3, repsMin: 8, repsMax: 12, loadKg: null, durationSeconds: null, distanceMetres: null, restSeconds: 90, supersetId: null }] } : d) } : programme;
  if (resolved !== programme) setProgramme(resolved);
  function updatePrescription(dayId: string, pid: string, patch: Partial<Prescription>) { setProgramme((p) => ({ ...p, days: p.days.map((d) => d.id === dayId ? { ...d, exercises: d.exercises.map((e) => e.id === pid ? { ...e, ...patch } : e) } : d) })); }
  async function save() { try { programmeSchema.parse(programme); await store.saveProgramme(programme); await draft.clear(); void store.sync(); setEditing(false); router.replace({ pathname: '/programme/[id]', params: { id: programme.id } }); } catch (e) { setError(e instanceof Error ? e.message : t('loadFailed')); } }
  function move<T>(items: T[], from: number, by: number) { const next = [...items]; const to = from + by; if (to >= 0 && to < next.length) [next[from], next[to]] = [next[to]!, next[from]!]; return next; }
  async function duplicate() { try { const copy = { ...programme, id: Crypto.randomUUID(), name: `${programme.name} (2)`, current: false, archived: false, version: 1, days: programme.days.map((day) => ({ ...day, id: Crypto.randomUUID(), exercises: day.exercises.map((p) => ({ ...p, id: Crypto.randomUUID() })) })) }; await store.saveProgramme(copy); void store.sync(); router.replace({ pathname: '/programme/[id]', params: { id: copy.id } }); } catch (e) { setError(e instanceof Error ? e.message : t('loadFailed')); } }
  async function start(dayId: string) { try { const day = programme.days.find((d) => d.id === dayId)!; const sid = await store.startWorkout(day.name, day, programme); router.push({ pathname: '/workout/[id]', params: { id: sid } }); } catch (e) { setError(e instanceof Error ? e.message : t('loadFailed')); } }
  return <Screen><Header title={editing ? t('createProgramme') : programme.name} back {...(!editing ? { action: t('edit'), onAction: () => { draft.resume(); setEditing(true); } } : {})} />
    {editing && <Field label={t('programmeName')} value={programme.name} onChangeText={(name) => setProgramme({ ...programme, name })} />}
    {editing && <Field label={t('description')} multiline value={programme.description} onChangeText={(description) => setProgramme({ ...programme, description })} />}
    {programme.days.map((day, dayIndex) => <Card key={day.id}>
      {editing ? <Field label={t('dayName')} value={day.name} onChangeText={(name) => setProgramme((p) => ({ ...p, days: p.days.map((d) => d.id === day.id ? { ...d, name } : d) }))} /> : <AppText variant="title">{day.name}</AppText>}
      {editing && <><Field label={t('dayNotes')} multiline value={day.notes} onChangeText={(notes) => setProgramme((p) => ({ ...p, days: p.days.map((d) => d.id === day.id ? { ...d, notes } : d) }))} />
        <AppText variant="label">{t('weekdays')}</AppText><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>{(['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const).map((label, i) => <Choice key={label} label={t(label)} selected={day.weekdays.includes(i)} onPress={() => setProgramme((p) => ({ ...p, days: p.days.map((d) => d.id === day.id ? { ...d, weekdays: d.weekdays.includes(i) ? d.weekdays.filter((n) => n !== i) : [...d.weekdays, i] } : d) }))} />)}</View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}><AppButton label={t('moveUp')} variant="secondary" disabled={dayIndex === 0} onPress={() => setProgramme((p) => ({ ...p, days: move(p.days, dayIndex, -1) }))} /><AppButton label={t('moveDown')} variant="secondary" disabled={dayIndex === programme.days.length - 1} onPress={() => setProgramme((p) => ({ ...p, days: move(p.days, dayIndex, 1) }))} /><AppButton label={t('duplicate')} variant="secondary" onPress={() => setProgramme((p) => ({ ...p, days: [...p.days, { ...day, id: Crypto.randomUUID(), exercises: day.exercises.map((e) => ({ ...e, id: Crypto.randomUUID() })) }] }))} /><AppButton label={t('remove')} variant="secondary" onPress={() => setProgramme((p) => ({ ...p, days: p.days.filter((d) => d.id !== day.id) }))} /></View></>}
      {day.exercises.map((p, prescriptionIndex) => <View key={p.id} style={{ gap: theme.spacing.sm, paddingVertical: theme.spacing.sm }}>
        <AppText variant="label">{p.exercise.name}</AppText>
        {editing ? <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
          <View style={{ flex: 1 }}><Field label={t('setCount')} value={String(p.sets)} inputMode="numeric" onChangeText={(v) => updatePrescription(day.id, p.id, { sets: Number(v) })} /></View>
          <View style={{ flex: 1 }}><Field label={t('reps')} value={String(p.repsMin)} inputMode="numeric" onChangeText={(v) => updatePrescription(day.id, p.id, { repsMin: Number(v), repsMax: Math.max(Number(v), p.repsMax) })} /></View>
          <View style={{ flex: 1 }}><Field label={t('maximumReps')} value={String(p.repsMax)} inputMode="numeric" onChangeText={(v) => updatePrescription(day.id, p.id, { repsMax: Number(v) })} /></View>
          <View style={{ flex: 1 }}><Field label={labelWithUnit(t('load'), 'kg')} value={p.loadKg === null ? '' : String(p.loadKg)} inputMode="decimal" onChangeText={(v) => updatePrescription(day.id, p.id, { loadKg: v.trim() ? Number(v) : null })} /></View>
          <View style={{ flex: 1 }}><Field label={t('restSeconds')} value={String(p.restSeconds)} inputMode="numeric" onChangeText={(v) => updatePrescription(day.id, p.id, { restSeconds: Number(v) })} /></View>
          {(p.exercise.type === 'timed' || p.exercise.type === 'distance') && <Field label={t('durationSeconds')} value={p.durationSeconds === null ? '' : String(p.durationSeconds)} inputMode="numeric" onChangeText={(v) => updatePrescription(day.id, p.id, { durationSeconds: v.trim() ? Number(v) : null })} />}
          {p.exercise.type === 'distance' && <Field label={t('distanceMetres')} value={p.distanceMetres === null ? '' : String(p.distanceMetres)} inputMode="decimal" onChangeText={(v) => updatePrescription(day.id, p.id, { distanceMetres: v.trim() ? Number(v) : null })} />}
          <AppButton label={t('moveUp')} variant="secondary" disabled={prescriptionIndex === 0} onPress={() => setProgramme((current) => ({ ...current, days: current.days.map((d) => d.id === day.id ? { ...d, exercises: move(d.exercises, prescriptionIndex, -1) } : d) }))} />
          <AppButton label={t('duplicate')} variant="secondary" onPress={() => setProgramme((current) => ({ ...current, days: current.days.map((d) => d.id === day.id ? { ...d, exercises: [...d.exercises, { ...p, id: Crypto.randomUUID() }] } : d) }))} />
          <AppButton label={t('remove')} variant="secondary" onPress={() => setProgramme((current) => ({ ...current, days: current.days.map((d) => d.id === day.id ? { ...d, exercises: d.exercises.filter((e) => e.id !== p.id) } : d) }))} />
        </View> : <AppText tone="muted">{p.sets} × {p.repsMin}–{p.repsMax} · {formatMeasure(p.restSeconds, 's')}</AppText>}
      </View>)}
      {editing ? <AppButton label={t('addExercise')} variant="secondary" onPress={() => { const key = Crypto.randomUUID(); setSelection({ day: day.id, key }); router.push({ pathname: '/exercises', params: { selectionKey: key } }); }} /> : <AppButton label={t('startWorkout')} disabled={!day.exercises.length} onPress={() => { void start(day.id); }} />}
    </Card>)}
    {!!(error || draft.storageError) && <AppText tone="error">{error || t('saveFailedDraft')}</AppText>}
    {editing ? <><AppButton label={t('addDay')} variant="secondary" onPress={() => setProgramme((p) => ({ ...p, days: [...p.days, { id: Crypto.randomUUID(), name: '', notes: '', exercises: [], weekdays: [] }] }))} /><AppButton label={t('save')} onPress={() => { void save(); }} /></> :
      <><AppButton label={t('makeCurrent')} variant="secondary" disabled={programme.archived} onPress={() => { void store.saveProgramme({ ...programme, current: true }).then(() => { setProgramme({ ...programme, current: true }); void store.sync(); }).catch((e: unknown) => setError(e instanceof Error ? e.message : t('loadFailed'))); }} />
      <AppButton label={t('calendar')} variant="secondary" disabled={programme.archived} onPress={() => router.push({ pathname: '/schedule', params: { programmeId: programme.id } })} />
      <AppButton label={t('duplicate')} variant="secondary" onPress={() => { void duplicate(); }} />
      <AppButton label={t(programme.archived ? 'restore' : 'archive')} variant="secondary" onPress={() => setConfirmArchive(true)} />
      {confirmArchive && <Card><AppText>{t('scheduleHint')}</AppText><AppButton label={t('confirm')} onPress={() => { void (programme.archived ? store.saveProgramme({ ...programme, archived: false, current: false }) : store.archiveProgramme(programme.id)).then(() => { void store.sync(); router.replace('/train'); }).catch((e: unknown) => setError(e instanceof Error ? e.message : t('loadFailed'))); }} /><AppButton label={t('cancel')} variant="secondary" onPress={() => setConfirmArchive(false)} /></Card>}</>}
  </Screen>;
}
