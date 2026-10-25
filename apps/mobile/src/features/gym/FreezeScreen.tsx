import { useRef, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';
import * as Crypto from 'expo-crypto';
import { addDays, localDateAt } from '@fitlog/domain';
import { useMember } from '@/data/MemberProvider';
import { useDraft } from '@/data/useDraft';
import type { GymAccount } from '@/data/gym-api';
import { t } from '@/lib/i18n';
import { useTheme } from '@/theme';
import { AppButton, AppText, Card, Choice, Field, Screen } from '@/ui';
import { MomentumAsset } from '@/ui/MomentumAsset';
import { useGym } from './GymProvider';
import { useGymAccount } from './hooks';
import { freezeCommand, freezePreview, freezeReviewSchema, type FreezeReview } from './freeze-api';

type Freeze = GymAccount['freezes'][number];
interface Review { data: FreezeReview; freeze: Freeze; kind: 'approve' | 'unfreeze'; payload: Record<string, unknown>; operation: string }

export function FreezeScreen() {
  const { memberId, membershipId } = useLocalSearchParams<{ memberId: string; membershipId?: string }>(); const { gym, role } = useGym(); const { profile } = useMember(); const router = useRouter(); const { theme } = useTheme();
  const { account, error, setError, refresh } = useGymAccount(memberId); const today = localDateAt(new Date(), gym.timezone);
  const draft = useDraft(`gym:${gym.id}:freeze:${memberId}`, { id: Crypto.randomUUID(), operation: Crypto.randomUUID(), membershipId: membershipId ?? '', startsOn: today, endsOn: addDays(today, 1), reason: '', returnOn: today, returnReason: '' });
  const [outcome, setOutcome] = useState<Review | null>(null);
  const [busy, setBusy] = useState(false); const [review, setReview] = useState<Review | null>(null); const [early, setEarly] = useState<Freeze | null>(null); const [shiftEarly, setShiftEarly] = useState(false); const [message, setMessage] = useState('');
  const [decision, setDecision] = useState<{ freeze: Freeze; kind: 'reject' | 'cancel'; operation: string } | null>(null); const [decisionReason, setDecisionReason] = useState(''); const committing = useRef(false);
  const manager = role === 'owner' || role === 'manager'; const targetId = draft.value.membershipId || account?.memberships.find((m) => !m.cancelled_on && m.starts_on <= today && today < m.ends_on)?.id || account?.memberships.find((m) => !m.cancelled_on)?.id;
  const showDate = (date: string) => new Intl.DateTimeFormat(profile.locale === 'hi' ? 'hi-IN' : 'en-IN', { timeZone: 'UTC', day: 'numeric', month: 'short', ...(date.slice(0, 4) === today.slice(0, 4) ? {} : { year: 'numeric' }) }).format(new Date(`${date}T12:00:00Z`));
  const target = account?.memberships.find((m) => m.id === targetId);
  async function request() {
    if (!target || committing.current) return; committing.current = true; setBusy(true); setError('');
    try { await freezeCommand(gym.id, 'request', { memberId, freezeId: draft.value.id, membershipId: target.id, startsOn: draft.value.startsOn, endsOn: draft.value.endsOn, reason: draft.value.reason }, draft.value.operation); await draft.clear(); draft.setValue((d) => ({ ...d, id: Crypto.randomUUID(), operation: Crypto.randomUUID(), reason: '' })); setMessage(t('freezeRequested')); await refresh(); }
    catch (e) { setError(e instanceof Error ? e.message : t('saveFailedDraft')); } finally { committing.current = false; setBusy(false); }
  }
  async function preview(freeze: Freeze, kind: 'approve' | 'unfreeze') {
    setBusy(true); setError(''); setMessage('');
    try { const payload = { memberId, freezeId: freeze.id, shiftRenewals: kind === 'approve' || shiftEarly, ...(kind === 'unfreeze' ? { returnOn: draft.value.returnOn, reason: draft.value.returnReason } : {}) }; const data = await freezePreview(gym.id, kind, payload); setReview({ data, freeze, kind, payload, operation: Crypto.randomUUID() }); }
    catch (e) { setError(e instanceof Error ? e.message : t('loadFailed')); } finally { setBusy(false); }
  }
  async function commit() {
    if (!review || committing.current) return; committing.current = true; setBusy(true); setError('');
    try { const saved = await freezeCommand(gym.id, review.kind, { ...review.payload, previewHash: review.data.previewHash }, review.operation); setOutcome({ ...review, data: freezeReviewSchema.parse(saved) }); setReview(null); setEarly(null); setMessage(''); await refresh().catch(() => {}); }
    catch (e) { const failure = e as { code?: string; message?: string }; if (failure.code === 'PT409') { setReview(null); await refresh().catch(() => {}); } setError(failure.message ?? t('saveFailedDraft')); } finally { committing.current = false; setBusy(false); }
  }
  async function decide() {
    if (!decision || committing.current) return; committing.current = true; setBusy(true); setError('');
    try { await freezeCommand(gym.id, decision.kind, { memberId, freezeId: decision.freeze.id, requestRevision: decision.freeze.revision, reason: decisionReason }, decision.operation); setDecision(null); await refresh(); }
    catch (e) { setError(e instanceof Error ? e.message : t('saveFailedDraft')); } finally { committing.current = false; setBusy(false); }
  }
  const selectedTerm = review ? account?.memberships.find((m) => m.id === review.freeze.membership_id) : target;
  const backToMember = () => router.replace({ pathname: '/gym/[gymId]/member', params: { gymId: gym.id, memberId } });
  const soldAllowance = Number((selectedTerm?.snapshot as { freeze_days?: number } | undefined)?.freeze_days ?? 0);
  return <Screen key={outcome ? 'outcome' : review ? 'review' : 'requests'} fill={!!review || !!outcome} inset="xl">
    <Pressable accessibilityRole="button" accessibilityLabel={t('back')} onPress={() => outcome ? backToMember() : review ? setReview(null) : router.canGoBack() ? router.back() : router.replace('/gyms')} style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md, minHeight: theme.dimensions.touchTarget }}><MomentumAsset name="imgArrowBack" tint={theme.colors.onSurface} /><AppText variant="caption" tone="muted">{gym.name.toUpperCase()} · {t(outcome ? 'membership' : review ? 'reviewFreeze' : 'freezes')}</AppText></Pressable>
    <AppText variant="headline" accessibilityRole="header">{t(outcome ? outcome.kind === 'unfreeze' ? 'earlyReturnUpdated' : outcome.data.changes.length > 1 ? 'freezeRenewalUpdated' : 'freezeSaved' : review ? review.kind === 'approve' ? 'reviewFreeze' : 'earlyReturn' : 'freezes')}</AppText>
    {account && <AppText tone="muted">{account.member.name} · #{account.member.number}</AppText>}
    {outcome ? <>
      <Card style={{ borderRadius: theme.radius.lg }}><AppText variant="title">{t(outcome.kind === 'approve' ? 'freezeApproved' : 'earlyReturn')} · {showDate(outcome.freeze.starts_on)} — {showDate(outcome.kind === 'approve' ? addDays(outcome.freeze.ends_on, -1) : outcome.payload.returnOn as string)}</AppText><AppText>{outcome.data.consumedDays} {t('consumedFreezeDays')} · {outcome.data.remainingDays} {t('remainingAllowance')}</AppText>{outcome.kind === 'unfreeze' && <AppText>{outcome.data.restoredDays} {t('restoredFreezeDays')}</AppText>}</Card>
      <Card tone="tonal" style={{ borderRadius: theme.radius.lg }}><AppText variant="title" style={{ color: theme.colors.onSecondaryContainer }}>{t('currentValidity')}</AppText><AppText style={{ color: theme.colors.onSecondaryContainer }}>{t('validThrough')} {showDate(addDays(outcome.data.changes[0]!.endsOn, -1))}</AppText></Card>
      {outcome.data.changes.slice(1).map((term) => <Card key={term.id} style={{ borderRadius: theme.radius.lg }}><AppText variant="title">{t('soldRenewalShifted')}</AppText><AppText>{t('startsOn')} {showDate(term.startsOn)} · {t('validThrough')} {showDate(addDays(term.endsOn, -1))}</AppText></Card>)}
      {outcome.data.gapDays > 0 && <Card><AppText>{t('inactiveGap')}: {outcome.data.gapDays} · {t('keepRenewalDates')}</AppText></Card>}
      <AppText tone="muted">{t('freezeCommittedHint')}</AppText><View style={{ flex: 1 }} /><AppButton label={t('backToMember')} onPress={backToMember} />
    </> : review ? <>
      {selectedTerm && <AppText tone="muted">{showDate(selectedTerm.starts_on)} — {showDate(addDays(selectedTerm.ends_on, -1))} · {t('allowanceShort')} {soldAllowance} {t('days')}</AppText>}
      <Card tone="tonal" style={{ borderRadius: theme.radius.lg }}><AppText variant="title" style={{ color: theme.colors.onSecondaryContainer }}>{showDate(review.freeze.starts_on)} — {showDate(review.kind === 'approve' ? addDays(review.freeze.ends_on, -1) : review.payload.returnOn as string)}</AppText><AppText style={{ color: theme.colors.onSecondaryContainer }}>{review.data.consumedDays} {t('consumedFreezeDays')} · {review.data.remainingDays} {t('remainingAllowance')}</AppText>{review.kind === 'unfreeze' && <AppText style={{ color: theme.colors.onSecondaryContainer }}>{review.data.restoredDays} {t('restoredFreezeDays')}</AppText>}</Card>
      <Card style={{ borderRadius: theme.radius.lg }}><AppText variant="title">{t('currentValidity')}</AppText><AppText>{t('validThrough')} {showDate(addDays(review.data.changes[0]!.oldEndsOn, -1))} → {showDate(addDays(review.data.changes[0]!.endsOn, -1))}</AppText></Card>
      {review.data.proposedRenewals.map((term) => <Card key={term.id} style={{ borderRadius: theme.radius.lg }}><AppText variant="title">{t(review.payload.shiftRenewals ? 'renewalShift' : 'keepRenewalDates')}</AppText><AppText>{review.payload.shiftRenewals ? `${showDate(term.oldStartsOn)} → ${showDate(term.startsOn)}` : showDate(term.oldStartsOn)} · {t('validThrough')} {showDate(addDays(review.payload.shiftRenewals ? term.endsOn : term.oldEndsOn, -1))}</AppText></Card>)}
      {review.data.gapDays > 0 && <Card><AppText variant="title">{t('inactiveGap')}: {review.data.gapDays}</AppText><AppText>{t('keepRenewalDates')}</AppText></Card>}
      <AppText tone="muted">{t('declineFreezeHint')}</AppText><View style={{ flex: 1 }} /><AppButton label={t(review.kind === 'unfreeze' ? 'confirmReturn' : review.data.needsShift ? 'approveFreezeShift' : 'approveFreeze')} loading={busy} onPress={() => { void commit(); }} /><AppButton label={t('declineChange')} variant="secondary" disabled={busy} onPress={() => setReview(null)} />
    </> : <>
      <AppText tone="muted">{t('freezeOnline')}</AppText>
      {!account && <AppText>{t('loadingData')}</AppText>}
      {(account?.memberships ?? []).filter((m) => !m.cancelled_on).map((m) => <Choice key={m.id} label={`${m.starts_on} — ${t('validThrough')} ${addDays(m.ends_on, -1)}`} selected={m.id === targetId} onPress={() => { draft.resume(); draft.setValue((d) => ({ ...d, membershipId: m.id })); }} />)}
      {target && <Card><AppText variant="title">{t('requestFreeze')}</AppText><Field label={t('freezeStart')} value={draft.value.startsOn} onChangeText={(startsOn) => { draft.resume(); draft.setValue((d) => ({ ...d, startsOn })); }} /><Field label={t('returnOn')} value={draft.value.endsOn} onChangeText={(endsOn) => { draft.resume(); draft.setValue((d) => ({ ...d, endsOn })); }} /><Field label={t('freezeReason')} multiline value={draft.value.reason} onChangeText={(reason) => { draft.resume(); draft.setValue((d) => ({ ...d, reason })); }} /><AppText variant="caption" tone="muted">{t('endExclusiveHint')}</AppText><AppButton label={t('requestFreeze')} loading={busy} disabled={account?.member.archived || !draft.value.reason.trim()} onPress={() => { void request(); }} /></Card>}
      {early && <Card><AppText variant="title">{t('earlyReturn')}</AppText><Field label={t('returnOn')} value={draft.value.returnOn} onChangeText={(returnOn) => { draft.resume(); draft.setValue((d) => ({ ...d, returnOn })); }} /><Field label={t('freezeReason')} value={draft.value.returnReason} onChangeText={(returnReason) => { draft.resume(); draft.setValue((d) => ({ ...d, returnReason })); }} /><Choice label={t('keepRenewalDates')} selected={!shiftEarly} onPress={() => setShiftEarly(false)} /><Choice label={t('moveRenewalsEarlier')} selected={shiftEarly} onPress={() => setShiftEarly(true)} /><AppButton label={t('reviewFreeze')} loading={busy} disabled={!draft.value.returnReason.trim()} onPress={() => { void preview(early, 'unfreeze'); }} /></Card>}
      {(account?.freezes ?? []).map((f) => <Card key={f.id}><AppText variant="title">{f.starts_on} — {addDays(f.ends_on, -1)}</AppText><AppText>{t(f.status === 'pending' ? 'freezePending' : f.status === 'approved' ? 'freezeApproved' : f.status === 'rejected' ? 'freezeRejected' : 'freezeCancelled')}</AppText><AppText tone="muted">{f.reason}</AppText>{f.decision_reason && <AppText>{f.decision_reason}</AppText>}
        {f.status === 'pending' && <>{manager && <AppButton label={t('reviewFreeze')} loading={busy} onPress={() => { void preview(f, 'approve'); }} />}{(manager || f.actor_id === profile.id) && <AppButton label={t(manager ? 'rejectRequest' : 'cancelRequest')} variant="secondary" disabled={busy} onPress={() => { setDecisionReason(''); setDecision({ freeze: f, kind: manager ? 'reject' : 'cancel', operation: Crypto.randomUUID() }); }} />}</>}
        {manager && f.status === 'approved' && f.starts_on <= today && today < f.ends_on && <AppButton label={t('earlyReturn')} variant="secondary" disabled={busy} onPress={() => { setEarly(f); setReview(null); }} />}
      </Card>)}
      {account?.freezes.length === 0 && <AppText tone="muted">{t('noFreezes')}</AppText>}
      {decision && <Card><Field label={t('decisionReason')} value={decisionReason} onChangeText={setDecisionReason} /><AppButton label={t(decision.kind === 'reject' ? 'rejectRequest' : 'cancelRequest')} loading={busy} disabled={!decisionReason.trim()} onPress={() => { void decide(); }} /><AppButton label={t('cancel')} variant="secondary" disabled={busy} onPress={() => setDecision(null)} /></Card>}
    </>}{!!message && <AppText accessibilityLiveRegion="polite">{message}</AppText>}{!!error && <AppText tone="error" accessibilityLiveRegion="polite">{error}</AppText>}
  </Screen>;
}
