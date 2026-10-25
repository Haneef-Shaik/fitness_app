import { useRef, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { View } from 'react-native';
import * as Crypto from 'expo-crypto';
import { parseRupees } from '@fitlog/domain';
import { useMember } from '@/data/MemberProvider';
import { useDraft } from '@/data/useDraft';
import { gymOperations, queueGymCommand, syncGymOutbox } from '@/data/gym-outbox';
import { t } from '@/lib/i18n';
import { useTheme } from '@/theme';
import { AppButton, AppText, Card, Choice, Field, Header, Screen } from '@/ui';
import { useGym } from './GymProvider';
import { inr, gymAccountBalance, useGymAccount } from './hooks';

export function GymPaymentScreen() {
  const { memberId } = useLocalSearchParams<{ memberId: string }>(); const { gym } = useGym(); const { store } = useMember(); const router = useRouter(); const { theme } = useTheme(); const { account, error, setError } = useGymAccount(memberId);
  const draft = useDraft(`gym:${gym.id}:payment:${memberId}`, { id: Crypto.randomUUID(), operation: Crypto.randomUUID(), amount: '', method: 'cash', receivedAt: new Date().toISOString(), reference: '', note: '' });
  const [review, setReview] = useState(false); const [busy, setBusy] = useState(false); const [submitted, setSubmitted] = useState<string | null>(null); const sending = useRef(false);
  const operation = gymOperations(store).find((o) => o.id === submitted); const result = operation?.result as { receipt?: string } | undefined;
  let amount = 0; try { amount = parseRupees(draft.value.amount); } catch { /* Disable review until valid. */ }
  const balance = account ? gymAccountBalance(account) : null;
  async function save() { if (!account || sending.current) return; sending.current = true; setBusy(true); setError(''); try { await queueGymCommand(store, gym.id, 'payment.record', { memberId, expectedRevision: account.member.revision, paymentId: draft.value.id, amountPaise: amount, method: draft.value.method, receivedAt: draft.value.receivedAt, reference: draft.value.reference, note: draft.value.note }, draft.value.operation); setSubmitted(draft.value.operation); await draft.clear(); } catch (e) { setError(e instanceof Error ? e.message : t('saveFailedDraft')); } finally { sending.current = false; setBusy(false); } }
  if (submitted) return <Screen><Header title={t(operation?.status === 'confirmed' ? 'paymentConfirmed' : 'recordPayment')} back /><Card><AppText>{operation?.status === 'confirmed' ? result?.receipt : operation?.error ?? t('provisionalPayment')}</AppText><AppText variant="caption">{t('operationId')}: {submitted}</AppText></Card><AppButton label={t('syncNow')} onPress={() => { void syncGymOutbox(store).catch((e: unknown) => setError(e instanceof Error ? e.message : t('loadFailed'))); }} /><AppButton label={t('done')} variant="secondary" onPress={() => router.back()} /></Screen>;
  return <Screen><Header title={t('recordPayment')} back />{account && <AppText variant="title">{account.member.name} · #{account.member.number}</AppText>}
    <AppText tone="muted">{t('receivedPaymentHint')}</AppText><Field label={t('amount')} value={draft.value.amount} inputMode="decimal" onChangeText={(v) => { setReview(false); draft.setValue((d) => ({ ...d, amount: v })); }} />
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>{(['cash', 'upi', 'bank', 'card_external', 'other'] as const).map((method) => <Choice key={method} label={t(method)} selected={draft.value.method === method} onPress={() => { setReview(false); draft.setValue((d) => ({ ...d, method })); }} />)}</View>
    <Field label={t('reference')} value={draft.value.reference} onChangeText={(reference) => { setReview(false); draft.setValue((d) => ({ ...d, reference })); }} /><Field label={t('notes')} value={draft.value.note} onChangeText={(note) => draft.setValue((d) => ({ ...d, note }))} />
    {review && balance && <Card><AppText>{t('amount')}: {inr(amount)}</AppText><AppText>{t('dues')}: {inr(Math.max(0, balance.due - amount))}</AppText><AppText>{t('credit')}: {inr(balance.credit + Math.max(0, amount - balance.due))}</AppText><AppText tone="muted">{t('allocationHint')}</AppText></Card>}
    {!!error && <AppText tone="error">{error}</AppText>}<AppButton label={t(review ? 'confirmPayment' : 'recordPayment')} loading={busy} disabled={!account || amount <= 0} onPress={() => { if (review) void save(); else setReview(true); }} />
  </Screen>;
}
