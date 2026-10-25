import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect, useRouter, useLocalSearchParams } from 'expo-router';
import { Pressable, View } from 'react-native';
import * as Crypto from 'expo-crypto';
import { localDateAt, addDays } from '@fitlog/domain';
import { gymCommand, listMembers, type GymMember } from '@/data/gym-api';
import { queueGymCommand } from '@/data/gym-outbox';
import { useDraft } from '@/data/useDraft';
import { useMember } from '@/data/MemberProvider';
import { t } from '@/lib/i18n';
import { useTheme } from '@/theme';
import { AppButton, AppText, Card, Choice, Field, Header, Screen } from '@/ui';
import { useGym } from './GymProvider';
import { useGymAccount, gymAccountBalance, inr } from './hooks';

export function GymMembersScreen() {
  const { gym } = useGym(); const router = useRouter(); const { theme } = useTheme();
  const [search, setSearch] = useState(''); const [query, setQuery] = useState(''); const [page, setPage] = useState(0); const [archived, setArchived] = useState(false);
  const [members, setMembers] = useState<GymMember[]>([]); const [count, setCount] = useState(0); const [error, setError] = useState('');
  useEffect(() => { const timer = setTimeout(() => { setQuery(search); setPage(0); }, 300); return () => clearTimeout(timer); }, [search]);
  useFocusEffect(useCallback(() => { let active = true; void listMembers(gym.id, query, page, archived).then((data) => { if (active) { setMembers(data.members); setCount(data.count); setError(''); } }).catch((e: unknown) => { if (active) setError(e instanceof Error ? e.message : t('loadFailed')); }); return () => { active = false; }; }, [gym.id, query, page, archived]));
  return <Screen><Header title={t('members')} action={t('addMember')} onAction={() => router.push({ pathname: '/gym/[gymId]/member-edit', params: { gymId: gym.id, memberId: 'new' } })} />
    <Field label={t('searchMembers')} value={search} onChangeText={setSearch} /><View style={{ flexDirection: 'row', gap: theme.spacing.sm }}><Choice label={t('activeRegister')} selected={!archived} onPress={() => { setArchived(false); setPage(0); }} /><Choice label={t('archivedRegister')} selected={archived} onPress={() => { setArchived(true); setPage(0); }} /></View>
    <AppText variant="caption" tone="muted">{count} {t('members')}</AppText>
    {members.map((member) => <Pressable accessibilityRole="button" key={member.id} onPress={() => router.push({ pathname: '/gym/[gymId]/member', params: { gymId: gym.id, memberId: member.id } })}><Card><AppText variant="title">{member.name}</AppText><AppText tone="muted">#{member.number} · {member.phone ?? t(member.age_status === 'adult' ? 'adult' : 'unknown')}</AppText></Card></Pressable>)}
    {!members.length && <AppText tone="muted">{t('noMembers')}</AppText>}
    <AppButton label={t('previousPage')} variant="secondary" disabled={page === 0} onPress={() => setPage((n) => n - 1)} /><AppButton label={t('next')} variant="secondary" disabled={(page + 1) * 50 >= count} onPress={() => setPage((n) => n + 1)} />{!!error && <AppText tone="error">{error}</AppText>}
  </Screen>;
}
export function GymMemberEditScreen() {
  const { memberId } = useLocalSearchParams<{ memberId: string }>();
  return memberId === 'new' ? <GymMemberForm /> : <ExistingMemberForm memberId={memberId} />;
}
function ExistingMemberForm({ memberId }: { memberId: string }) { const { account, error } = useGymAccount(memberId); return account ? <GymMemberForm member={account.member} /> : <Screen><Header title={t('edit')} back /><AppText>{error || t('loadingData')}</AppText></Screen>; }
function GymMemberForm({ member }: { member?: GymMember }) {
  const { gym, role } = useGym(); const router = useRouter(); const { theme } = useTheme();
  const draft = useDraft(`gym:${gym.id}:member:${member?.id ?? 'new'}`, { id: member?.id ?? Crypto.randomUUID(), operation: Crypto.randomUUID(), name: member?.name ?? '', phone: member?.phone ?? '', email: member?.email ?? '', joinedOn: member?.joined_on ?? localDateAt(new Date(), gym.timezone), notes: member?.notes ?? '', age: member?.age_status ?? 'unknown' });
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  async function save() { setBusy(true); setError(''); try { await gymCommand(gym.id, 'member.save', { memberId: draft.value.id, expectedRevision: member?.revision, name: draft.value.name, phone: draft.value.phone, email: draft.value.email, ageStatus: draft.value.age, joinedOn: draft.value.joinedOn, notes: draft.value.notes, noticeVersion: 'development-notice:v1' }, draft.value.operation); await draft.clear(); router.replace({ pathname: '/gym/[gymId]/member', params: { gymId: gym.id, memberId: draft.value.id } }); } catch (e) { setError(e instanceof Error ? e.message : t('saveFailedDraft')); } finally { setBusy(false); } }
  return <Screen><Header title={t(member ? 'edit' : 'addMember')} back />
    {(['name', 'phone', 'email', 'joinedOn', 'notes'] as const).map((key) => <Field key={key} label={t(key === 'name' ? 'memberName' : key === 'notes' ? 'administrativeNotes' : key)} value={draft.value[key]} onChangeText={(v) => draft.setValue((d) => ({ ...d, [key]: v }))} multiline={key === 'notes'} />)}
    <AppText variant="label">{t('ageStatus')}</AppText><View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>{(['adult', 'unknown'] as const).map((age) => <Choice key={age} label={t(age)} selected={draft.value.age === age} onPress={() => draft.setValue((d) => ({ ...d, age }))} />)}</View>
    <AppText variant="caption" tone="muted">{role} · {t('operationalPrivacy')}</AppText>{!!error && <AppText tone="error">{error}</AppText>}<AppButton label={t('save')} loading={busy} onPress={() => { void save(); }} />
  </Screen>;
}
export function GymMemberScreen() {
  const { memberId } = useLocalSearchParams<{ memberId: string }>(); const { gym, role } = useGym(); const { store } = useMember(); const router = useRouter();
  const { account, error, setError, refresh } = useGymAccount(memberId); const [confirmArchive, setConfirmArchive] = useState(false); const [message, setMessage] = useState('');
  if (!account) return <Screen><Header title={t('members')} back /><AppText>{error || t('loadingData')}</AppText></Screen>;
  const balance = gymAccountBalance(account); const member = account.member; const staff = role !== 'member'; const manager = role === 'owner' || role === 'manager';
  async function visit() { try { await queueGymCommand(store, gym.id, 'visit.record', { memberId, visitId: Crypto.randomUUID(), occurredAt: new Date().toISOString() }); setMessage(t('pendingSync')); } catch (e) { setError(e instanceof Error ? e.message : t('saveFailedDraft')); } }
  return <Screen><Header title={member.name} back {...(staff ? { action: t('edit'), onAction: () => router.push({ pathname: '/gym/[gymId]/member-edit', params: { gymId: gym.id, memberId } }) } : {})} /><AppText tone="muted">#{member.number} · {member.phone ?? t(member.age_status === 'adult' ? 'adult' : 'unknown')}</AppText>
    <Card><AppText variant="label">{t('dues')}</AppText><AppText variant="number">{inr(balance.due)}</AppText><AppText>{t('credit')}: {inr(balance.credit)}</AppText><AppText tone="muted">{t('charges')}: {inr(balance.charges)} · {t('collections')}: {inr(balance.principal)}</AppText></Card>
    {account.memberships.map((m) => <Card key={m.id}><AppText variant="title">{t('membership')}</AppText><AppText>{m.starts_on} — {t('validThrough')} {addDays(m.ends_on, -1)}</AppText>{m.cancelled_on && <AppText tone="muted">{t('cancel')} · {m.cancelled_on}</AppText>}</Card>)}
    <AppText tone="muted">{t('operationalPrivacy')}</AppText>
    <AppButton label={t('freezes')} variant="secondary" onPress={() => router.push({ pathname: '/gym/[gymId]/freezes', params: { gymId: gym.id, memberId } })} />
    {staff && <><AppButton label={t('recordPayment')} onPress={() => router.push({ pathname: '/gym/[gymId]/payment', params: { gymId: gym.id, memberId } })} />{manager && <AppButton label={t('issueMembership')} variant="secondary" disabled={member.archived} onPress={() => router.push({ pathname: '/gym/[gymId]/membership', params: { gymId: gym.id, memberId } })} />}<AppButton label={t('markVisit')} variant="secondary" disabled={member.archived} onPress={() => { void visit(); }} /><AppButton label={t(member.archived ? 'restore' : 'archive')} variant="secondary" onPress={() => setConfirmArchive(true)} /></>}
    {confirmArchive && <Card><AppText>{t(member.archived ? 'restore' : 'archive')} · {member.name}</AppText><AppButton label={t('confirm')} onPress={() => { void gymCommand(gym.id, 'member.archive', { memberId, expectedRevision: member.revision, archived: !member.archived }).then(async () => { setConfirmArchive(false); await refresh(); }).catch((e: unknown) => setError(e instanceof Error ? e.message : t('loadFailed'))); }} /><AppButton label={t('cancel')} variant="secondary" onPress={() => setConfirmArchive(false)} /></Card>}
    <AppText variant="title">{t('receipts')}</AppText>{account.receipts.map((receipt) => <AppButton key={receipt.id} label={receipt.number} variant="secondary" onPress={() => router.push({ pathname: '/gym/[gymId]/receipt', params: { gymId: gym.id, memberId, receiptId: receipt.id } })} />)}
    <AppText variant="title">{t('visits')}</AppText>{account.visits.slice(0, 10).map((v) => <AppText key={v.id}>{v.local_date} · {v.verification === 'staff_verified' ? t('staffVerified') : t('needsAttention')}</AppText>)}
    {!!message && <AppText>{message}</AppText>}{!!error && <AppText tone="error">{error}</AppText>}
  </Screen>;
}
