import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { View } from 'react-native';
import * as Crypto from 'expo-crypto';
import { parseRupees, localDateAt, membershipEndExclusive, addDays } from '@fitlog/domain';
import { gymCommand } from '@/data/gym-api';
import { useDraft } from '@/data/useDraft';
import { useTheme } from '@/theme';
import { t } from '@/lib/i18n';
import { AppButton, AppText, Card, Choice, Field, Header, Screen } from '@/ui';
import { useGym } from './GymProvider';
import { inr, useGymAccount } from './hooks';
const emptyPlan = () => ({ id: Crypto.randomUUID(), operation: Crypto.randomUUID(), name: '', code: '', fee: '', duration: '1', unit: 'months', freeze: '30' });

export function GymPlansScreen() {
  const { gym, plans, role, refresh } = useGym(); const { theme } = useTheme(); const [adding, setAdding] = useState(false); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const draft = useDraft(`gym:${gym.id}:plan`, emptyPlan());
  const manager = role === 'owner' || role === 'manager';
  async function save() { setBusy(true); setError(''); try { await gymCommand(gym.id, 'plan.save', { planId: draft.value.id, baseVersion: 0, name: draft.value.name, code: draft.value.code, feePaise: parseRupees(draft.value.fee), durationValue: Number(draft.value.duration), durationUnit: draft.value.unit, freezeDays: Number(draft.value.freeze) }, draft.value.operation); await draft.clear(); draft.setValue(emptyPlan()); await refresh(); setAdding(false); } catch (e) { setError(e instanceof Error ? e.message : t('saveFailedDraft')); } finally { setBusy(false); } }
  return <Screen><Header title={t('plans')} back />
    {plans.map((plan) => <Card key={plan.id}><AppText variant="title">{plan.name}</AppText><AppText>{inr(plan.fee_paise)} · {plan.duration_value} {t(plan.duration_unit === 'months' ? 'months' : 'days')}</AppText><AppText tone="muted">{t('freezeAllowance')}: {plan.freeze_days} · v{plan.version}</AppText>
      {manager && <AppButton label={t(plan.archived ? 'restore' : 'archive')} variant="secondary" onPress={() => { void gymCommand(gym.id, 'plan.save', { planId: plan.id, baseVersion: plan.version, code: plan.code, name: plan.name, feePaise: plan.fee_paise, durationValue: plan.duration_value, durationUnit: plan.duration_unit, freezeDays: plan.freeze_days, archived: !plan.archived }).then(refresh).catch((e: unknown) => setError(e instanceof Error ? e.message : t('loadFailed'))); }} />}
    </Card>)}
    {manager && !adding && <AppButton label={t('newPlan')} onPress={() => { draft.resume(); setAdding(true); }} />}
    {adding && <Card>{(['name', 'code', 'fee', 'duration', 'freeze'] as const).map((key) => <Field key={key} label={t(key === 'name' ? 'planName' : key === 'code' ? 'planCode' : key === 'duration' ? 'durationValue' : key === 'freeze' ? 'freezeAllowance' : 'fee')} value={draft.value[key]} onChangeText={(v) => draft.setValue((d) => ({ ...d, [key]: v }))} />)}
      <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>{(['months', 'days'] as const).map((unit) => <Choice key={unit} label={t(unit)} selected={draft.value.unit === unit} onPress={() => draft.setValue((d) => ({ ...d, unit }))} />)}</View><AppButton label={t('save')} loading={busy} onPress={() => { void save(); }} /><AppButton label={t('cancel')} variant="secondary" onPress={() => setAdding(false)} />
    </Card>}{!!error && <AppText tone="error">{error}</AppText>}
  </Screen>;
}
export function GymMembershipScreen() {
  const { memberId } = useLocalSearchParams<{ memberId: string }>(); const { gym, plans } = useGym(); const router = useRouter(); const { theme } = useTheme(); const { account, error, setError } = useGymAccount(memberId);
  const draft = useDraft(`gym:${gym.id}:membership:${memberId}`, { id: Crypto.randomUUID(), operation: Crypto.randomUUID(), startsOn: localDateAt(new Date(), gym.timezone), planId: '' });
  const [review, setReview] = useState(false); const [busy, setBusy] = useState(false); const plan = plans.find((p) => p.id === draft.value.planId && !p.archived); let end = '';
  try { if (plan) end = plan.duration_unit === 'days' ? addDays(draft.value.startsOn, plan.duration_value) : membershipEndExclusive(draft.value.startsOn, plan.duration_value); } catch { /* Invalid input is shown when reviewing. */ }
  async function save() { if (!plan || !account || !end) return; setBusy(true); setError(''); try { await gymCommand(gym.id, 'membership.issue', { memberId, expectedRevision: account.member.revision, membershipId: draft.value.id, planId: plan.id, planVersion: plan.version, startsOn: draft.value.startsOn }, draft.value.operation); await draft.clear(); router.back(); } catch (e) { setReview(false); setError(e instanceof Error ? e.message : t('saveFailedDraft')); } finally { setBusy(false); } }
  return <Screen><Header title={t('issueMembership')} back />{account && <AppText variant="title">{account.member.name} · #{account.member.number}</AppText>}
    <AppText tone="muted">{t('membershipReviewHint')}</AppText>
    {plans.filter((p) => !p.archived).map((p) => <Choice key={p.id} label={`${p.name} · ${inr(p.fee_paise)}`} selected={p.id === draft.value.planId} onPress={() => { setReview(false); draft.setValue((d) => ({ ...d, planId: p.id })); }} />)}
    {!plans.some((p) => !p.archived) && <AppButton label={t('planRequired')} variant="secondary" onPress={() => router.push({ pathname: '/gym/[gymId]/plans', params: { gymId: gym.id } })} />}
    <Field label={t('startsOn')} value={draft.value.startsOn} onChangeText={(startsOn) => { setReview(false); draft.setValue((d) => ({ ...d, startsOn })); }} />
    {plan && end && <Card style={{ gap: theme.spacing.md }}><AppText variant="title">{t('validThrough')} {addDays(end, -1)}</AppText><AppText>{t('fee')}: {inr(plan.fee_paise)}</AppText><AppText>{t('freezeAllowance')}: {plan.freeze_days}</AppText></Card>}
    {!!error && <AppText tone="error">{error}</AppText>}{review ? <AppButton label={t('confirm')} loading={busy} onPress={() => { void save(); }} /> : <AppButton label={t('issueMembership')} disabled={!account || !plan || !end} onPress={() => setReview(true)} />}
  </Screen>;
}
