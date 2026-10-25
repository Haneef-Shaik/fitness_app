import { useState } from 'react';
import { useRouter } from 'expo-router';
import * as Crypto from 'expo-crypto';
import { localDateAt, targetSchema } from '@fitlog/domain';
import { useMember } from '@/data/MemberProvider';
import { useDraft } from '@/data/useDraft';
import { saveTargets } from '@/data/api';
import { t } from '@/lib/i18n';
import { AppButton, AppText, Field, Header, Screen } from '@/ui';

export function TargetsScreen() {
  const { profile, store } = useMember(); const router = useRouter(); const draft = useDraft('nutrition-targets', { id: Crypto.randomUUID(), kcal: '', protein: '', carbs: '', fat: '', fibre: '' });
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  async function save() { setBusy(true); setError(''); try {
    const values = Object.fromEntries((['kcal', 'protein', 'carbs', 'fat', 'fibre'] as const).map((k) => [k, draft.value[k].trim() ? Number(draft.value[k].replace(',', '.')) : null]));
    if (!Object.values(values).some((v) => v !== null)) throw new Error(t('nutritionRequired'));
    const target = targetSchema.parse({ ...values, id: draft.value.id, effectiveDate: localDateAt(new Date(), profile.timezone) });
    await store.onlineWrite(() => saveTargets(target, profile.id)); await draft.clear(); router.back();
  } catch (e) { setError(e instanceof Error ? e.message : t('saveFailedDraft')); } finally { setBusy(false); } }
  return <Screen><Header title={t('nutritionTargets')} back /><AppText tone="muted">{t('targetsBody')}</AppText>
    {(['kcal', 'protein', 'carbs', 'fat', 'fibre'] as const).map((k) => <Field key={k} label={t(k === 'kcal' ? 'calories' : k)} value={draft.value[k]} inputMode="decimal" onChangeText={(v) => draft.setValue((d) => ({ ...d, [k]: v }))} />)}
    {!!error && <AppText tone="error">{error}</AppText>}<AppButton label={t('save')} loading={busy} onPress={() => { void save(); }} />
  </Screen>;
}
