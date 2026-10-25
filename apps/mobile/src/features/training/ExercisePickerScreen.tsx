import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable } from 'react-native';
import * as Crypto from 'expo-crypto';
import type { Exercise } from '@fitlog/domain';
import { useMember } from '@/data/MemberProvider';
import { t } from '@/lib/i18n';
import { AppButton, AppText, Card, Field, Header, Screen } from '@/ui';

export function ExercisePickerScreen() {
  const { data, store } = useMember(); const router = useRouter(); const { sessionId, selectionKey } = useLocalSearchParams<{ sessionId?: string; selectionKey?: string }>();
  const [search, setSearch] = useState(''); const [error, setError] = useState('');
  async function choose(exercise: Exercise) {
    try {
      if (sessionId) await store.updateWorkout(sessionId, (s) => ({ ...s, instances: [...s.instances, { id: Crypto.randomUUID(), exercise, prescription: null, skipped: false }] }));
      else if (selectionKey) await store.saveDraft(selectionKey, exercise);
      else { await store.saveDraft('exercise-detail', exercise); router.push('/exercise-detail'); return; }
      router.back();
    } catch (e) { setError(e instanceof Error ? e.message : t('loadFailed')); }
  }
  const matches = data.exercises.filter((e) => !e.archived && [e.name, ...e.aliases].some((value) => value.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())));
  return <Screen>
    <Header title={t('exercises')} back />
    <Field label={t('searchExercises')} value={search} onChangeText={setSearch} />
    <AppButton label={t('customExercise')} variant="secondary" onPress={() => router.push('/exercise-new')} />
    {!!error && <AppText tone="error">{error}</AppText>}
    {matches.map((e) => <Pressable key={`${e.id}-${e.version}`} accessibilityRole="button" onPress={() => { void choose(e); }}><Card><AppText variant="title">{e.name}</AppText><AppText tone="muted">{e.equipment} · {e.primaryMuscles.join(', ')}</AppText></Card></Pressable>)}
    {!matches.length && <AppText tone="muted">{t('noExercises')}</AppText>}
  </Screen>;
}
