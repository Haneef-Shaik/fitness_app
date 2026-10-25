import { useState } from 'react';
import { useRouter } from 'expo-router';
import * as Crypto from 'expo-crypto';
import { bodyEntrySchema, instantForDiaryDate, localDateAt } from '@fitlog/domain';
import { useMember } from '@/data/MemberProvider';
import { useDraft } from '@/data/useDraft';
import { saveBody } from '@/data/api';
import { t } from '@/lib/i18n';
import { AppButton, AppText, Field, Header, Screen } from '@/ui';

export function BodyEntryScreen() {
  const { store, profile } = useMember(); const router = useRouter();
  const draft = useDraft('body-entry', { id: Crypto.randomUUID(), at: new Date().toISOString(), date: localDateAt(new Date(), profile.timezone), weight: '', fat: '', waist: '', chest: '', arm: '', thigh: '', notes: '' });
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  async function save() { setBusy(true); setError(''); try {
    const num = (v: string) => v.trim() ? Number(v.replace(',', '.')) : null; const now = instantForDiaryDate(draft.value.date, profile.timezone, draft.value.at);
    const entry = bodyEntrySchema.parse({ id: draft.value.id, ownerId: profile.id, measuredAt: now, localDate: localDateAt(now, profile.timezone), timezone: profile.timezone,
      weightKg: num(draft.value.weight), bodyFat: num(draft.value.fat), measurements: Object.fromEntries((['waist', 'chest', 'arm', 'thigh'] as const).filter((k) => draft.value[k].trim()).map((k) => [k, num(draft.value[k])])), notes: draft.value.notes, deletedAt: null, revision: 1 });
    await store.onlineWrite(() => saveBody(entry)); await draft.clear(); router.back();
  } catch (e) { setError(e instanceof Error ? e.message : t('saveFailedDraft')); } finally { setBusy(false); } }
  return <Screen><Header title={t('addBody')} back />
    <Field label={t('dateLabel')} value={draft.value.date} placeholder={t('dateFormat')} onChangeText={(date) => draft.setValue((d) => ({ ...d, date }))} />
    {(['weight', 'fat', 'waist', 'chest', 'arm', 'thigh'] as const).map((k) => <Field key={k} label={t(k === 'weight' ? 'bodyWeight' : k === 'fat' ? 'bodyFat' : k)} value={draft.value[k]} inputMode="decimal" onChangeText={(v) => draft.setValue((d) => ({ ...d, [k]: v }))} />)}
    <Field label={t('notes')} value={draft.value.notes} onChangeText={(v) => draft.setValue((d) => ({ ...d, notes: v }))} multiline />
    {!!error && <AppText tone="error">{error}</AppText>}<AppButton label={t('save')} loading={busy} onPress={() => { void save(); }} />
  </Screen>;
}
