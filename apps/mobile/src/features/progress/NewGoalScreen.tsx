import { useState } from 'react';
import { useRouter } from 'expo-router';
import { View } from 'react-native';
import * as Crypto from 'expo-crypto';
import { goalSchema, localDateAt } from '@fitlog/domain';
import { useMember } from '@/data/MemberProvider';
import { useDraft } from '@/data/useDraft';
import { saveGoal } from '@/data/api';
import { t } from '@/lib/i18n';
import { useTheme } from '@/theme';
import { AppButton, AppText, Choice, Field, Header, Screen } from '@/ui';

export function NewGoalScreen() {
  const { store, profile } = useMember(); const router = useRouter(); const { theme } = useTheme(); const date = localDateAt(new Date(), profile.timezone);
  const draft = useDraft('new-goal', { id: Crypto.randomUUID(), at: new Date().toISOString(), name: '', baseline: '', target: '', deadline: '' });
  const [type, setType] = useState<'loss' | 'gain'>('loss'); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  async function save() { setBusy(true); setError(''); try {
    const goal = goalSchema.parse({ id: draft.value.id, name: draft.value.name, type, metric: 'weight', exerciseId: null, exerciseVersion: null, loadBasis: null, fixedLoadKg: null,
      baseline: Number(draft.value.baseline), baselineCutoff: draft.value.at, startDate: date, deadline: draft.value.deadline.trim() || null, target: Number(draft.value.target),
      rangeMin: null, rangeMax: null, status: 'active', notes: '', revision: 1 });
    if (!draft.value.baseline.trim() || !draft.value.target.trim() || goal.baseline <= 0 || goal.target <= 0) throw new Error(t('enterPositiveWeight'));
    await store.onlineWrite(() => saveGoal(goal, profile.id)); await draft.clear(); router.back();
  } catch (e) { setError(e instanceof Error ? e.message : t('saveFailedDraft')); } finally { setBusy(false); } }
  return <Screen><Header title={t('newGoal')} back /><Field label={t('goalName')} value={draft.value.name} onChangeText={(name) => draft.setValue((d) => ({ ...d, name }))} />
    <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', gap: theme.spacing.sm }}>{(['loss', 'gain'] as const).map((v) => <Choice key={v} label={t(v)} selected={type === v} onPress={() => setType(v)} />)}</View>
    <Field label={`${t('baseline')} (kg)`} value={draft.value.baseline} onChangeText={(baseline) => draft.setValue((d) => ({ ...d, baseline }))} inputMode="decimal" />
    <Field label={`${t('target')} (kg)`} value={draft.value.target} onChangeText={(target) => draft.setValue((d) => ({ ...d, target }))} inputMode="decimal" />
    <Field label={t('deadline')} value={draft.value.deadline} placeholder={t('dateFormat')} onChangeText={(deadline) => draft.setValue((d) => ({ ...d, deadline }))} />
    {!!error && <AppText tone="error">{error}</AppText>}<AppButton label={t('save')} loading={busy} onPress={() => { void save(); }} />
  </Screen>;
}
