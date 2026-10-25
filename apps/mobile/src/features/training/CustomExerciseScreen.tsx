import { useState } from 'react';
import { useRouter } from 'expo-router';
import { View } from 'react-native';
import * as Crypto from 'expo-crypto';
import { exerciseSchema, type Exercise } from '@fitlog/domain';
import { useMember } from '@/data/MemberProvider';
import { requireBackend } from '@/lib/supabase';
import { t } from '@/lib/i18n';
import { useTheme } from '@/theme';
import { AppButton, AppText, Choice, Field, Header, Screen } from '@/ui';

export function CustomExerciseScreen() {
  const { profile, store } = useMember(); const { theme } = useTheme(); const router = useRouter();
  const [name, setName] = useState(''); const [equipment, setEquipment] = useState(''); const [muscle, setMuscle] = useState('');
  const [type, setType] = useState<Exercise['type']>('resistance'); const [basis, setBasis] = useState<Exercise['loadBasis']>('total');
  const [notes, setNotes] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  async function save() {
    setBusy(true); setError('');
    try {
      const e = exerciseSchema.parse({ id: Crypto.randomUUID(), version: 1, ownerId: profile.id, name, type, loadBasis: basis, multiplier: basis === 'per_hand' ? 2 : 1, equipment, primaryMuscles: [muscle], secondaryMuscles: [], instructions: notes, aliases: [], archived: false });
      await store.onlineWrite(async () => { const { error: failure } = await requireBackend().from('exercises').insert({ id: e.id, version: e.version, owner_id: e.ownerId, name: e.name, logging_type: e.type, load_basis: e.loadBasis, multiplier: e.multiplier, equipment: e.equipment, primary_muscles: e.primaryMuscles, secondary_muscles: [], instructions: e.instructions, aliases: [] }); if (failure) throw failure; });
      router.back();
    } catch (e) { setError(e instanceof Error ? e.message : t('saveFailedDraft')); } finally { setBusy(false); }
  }
  return <Screen><Header title={t('customExercise')} back />
    <Field label={t('exerciseName')} value={name} onChangeText={setName} maxLength={100} />
    <Field label={t('equipment')} value={equipment} onChangeText={setEquipment} />
    <Field label={t('muscle')} value={muscle} onChangeText={setMuscle} />
    <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>{(['resistance', 'bodyweight', 'timed', 'distance'] as const).map((v) => <Choice key={v} label={v} selected={type === v} onPress={() => setType(v)} />)}</View>
    <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>{(['total', 'per_hand', 'assistance', 'none'] as const).map((v) => <Choice key={v} label={v} selected={basis === v} onPress={() => setBasis(v)} />)}</View>
    <Field label={t('notes')} value={notes} onChangeText={setNotes} multiline />
    {!!error && <AppText tone="error">{error}</AppText>}<AppButton label={t('save')} onPress={() => { void save(); }} loading={busy} />
  </Screen>;
}
