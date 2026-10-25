import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';
import { z } from 'zod';
import { requireBackend } from '@/lib/supabase';
import { useMember } from '@/data/MemberProvider';
import { gymOperations, syncGymOutbox } from '@/data/gym-outbox';
import { t } from '@/lib/i18n';
import { useTheme } from '@/theme';
import { AppButton, AppText, Card, Header, Screen } from '@/ui';
import { useGym } from './GymProvider';
import { inr } from './hooks';
const dashboardSchema = z.object({ date: z.iso.date(), dueToday: z.number(), overdue: z.number(), totalDue: z.number(), visitsToday: z.number().int(), activeMembers: z.number().int(), collections: z.number(), recentPayments: z.array(z.object({ id: z.uuid(), member_id: z.uuid(), name: z.string(), amount_paise: z.number(), method: z.string(), received_at: z.string() })) });
function useDashboard() {
  const { gym } = useGym(); const [data, setData] = useState<z.infer<typeof dashboardSchema> | null>(null); const [error, setError] = useState('');
  useFocusEffect(useCallback(() => { let active = true; void requireBackend().rpc('gym_dashboard_v1', { p_gym: gym.id }).then(({ data, error }) => { if (!active) return; if (error) setError(error.message); else { try { setData(dashboardSchema.parse(data)); setError(''); } catch { setError(t('loadFailed')); } } }); return () => { active = false; }; }, [gym.id])); return { data, error };
}
export function GymTodayScreen() {
  const { gym, role } = useGym(); const { data, error } = useDashboard(); const { theme } = useTheme(); const router = useRouter();
  return <Screen><Header title={gym.name} action={t('workspaces')} onAction={() => router.push('/gyms')} /><AppText tone="muted" variant="caption">{data?.date} · {role}</AppText>
    {data && <><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.md }}>{([
      [t('dues'), inr(data.totalDue)], [t('visits'), String(data.visitsToday)], [t('activeRegister'), String(data.activeMembers)], [t('collections'), inr(data.collections)],
    ] as const).map(([label, value]) => <Card key={label} style={{ flex: 1, minWidth: theme.dimensions.summaryMinWidth }}><AppText variant="caption" tone="muted">{label}</AppText><AppText variant="headline">{value}</AppText></Card>)}</View>
      <AppText variant="title">{t('receipts')}</AppText>{data.recentPayments.map((p) => <Pressable accessibilityRole="button" key={p.id} onPress={() => router.push({ pathname: '/gym/[gymId]/member', params: { gymId: gym.id, memberId: p.member_id } })}><Card><AppText variant="label">{p.name}</AppText><AppText>{inr(p.amount_paise)}</AppText><AppText tone="muted" variant="caption">{p.method} · {new Date(p.received_at).toLocaleString()}</AppText></Card></Pressable>)}</>}
    <AppButton label={t('members')} onPress={() => router.push({ pathname: '/gym/[gymId]/members', params: { gymId: gym.id } })} />{!!error && <AppText tone="error">{error}</AppText>}
  </Screen>;
}
export function GymMoneyScreen() {
  const { data, error } = useDashboard(); const { gym } = useGym(); const router = useRouter();
  return <Screen><Header title={t('money')} />{data && <><Card><AppText variant="label">{t('dues')}</AppText><AppText variant="number">{inr(data.totalDue)}</AppText><AppText tone="muted">{t('collections')}: {inr(data.collections)}</AppText></Card>
    {data.recentPayments.map((p) => <Card key={p.id}><AppText variant="title">{p.name}</AppText><AppText>{inr(p.amount_paise)} · {p.method}</AppText><AppButton label={t('receipts')} variant="secondary" onPress={() => router.push({ pathname: '/gym/[gymId]/member', params: { gymId: gym.id, memberId: p.member_id } })} /></Card>)}</>}
    <AppButton label={t('recordPayment')} onPress={() => router.push({ pathname: '/gym/[gymId]/members', params: { gymId: gym.id } })} />{!!error && <AppText tone="error">{error}</AppText>}
  </Screen>;
}
export function GymVisitsScreen() {
  const { gym } = useGym(); const router = useRouter(); const [page, setPage] = useState(0); const [error, setError] = useState(''); const [visits, setVisits] = useState<{ id: string; member_id: string; occurred_at: string; verification: string; gym_members: { name: string; number: number } }[]>([]);
  useFocusEffect(useCallback(() => { let active = true; void requireBackend().from('gym_visits').select('id,member_id,occurred_at,verification,gym_members(name,number)').eq('gym_id', gym.id).order('occurred_at', { ascending: false }).order('id').range(page * 50, page * 50 + 49).then(({ data, error }) => { if (active) { if (error) setError(error.message); else setVisits(data as unknown as typeof visits); } }); return () => { active = false; }; }, [gym.id, page]));
  return <Screen><Header title={t('visits')} /><AppText tone="muted">{t('staffVerified')}</AppText>
    {visits.map((v) => <Pressable accessibilityRole="button" key={v.id} onPress={() => router.push({ pathname: '/gym/[gymId]/member', params: { gymId: gym.id, memberId: v.member_id } })}><Card><AppText variant="title">{v.gym_members.name} · #{v.gym_members.number}</AppText><AppText>{new Date(v.occurred_at).toLocaleString()} · {v.verification === 'staff_verified' ? t('staffVerified') : t('needsAttention')}</AppText></Card></Pressable>)}
    <AppButton label={t('markVisit')} onPress={() => router.push({ pathname: '/gym/[gymId]/members', params: { gymId: gym.id } })} /><AppButton label={t('previousPage')} variant="secondary" disabled={page === 0} onPress={() => setPage((n) => n - 1)} /><AppButton label={t('next')} variant="secondary" disabled={visits.length < 50} onPress={() => setPage((n) => n + 1)} />{!!error && <AppText tone="error">{error}</AppText>}
  </Screen>;
}
export function GymMoreScreen() {
  const { gym, role } = useGym(); const { store } = useMember(); const router = useRouter(); const [error, setError] = useState(''); const pending = gymOperations(store).filter((o) => o.gymId === gym.id && o.status !== 'confirmed');
  return <Screen><Header title={t('more')} /><AppText variant="title">{gym.name}</AppText><AppText tone="muted">{role} · {gym.timezone}</AppText>
    <AppButton label={t('plans')} variant="secondary" onPress={() => router.push({ pathname: '/gym/[gymId]/plans', params: { gymId: gym.id } })} /><AppButton label={t('workspaces')} variant="secondary" onPress={() => router.push('/gyms')} />
    <AppText variant="title">{t('pendingOperations')}</AppText>{pending.map((o) => <Card key={o.id}><AppText>{o.kind === 'payment.record' ? t('provisionalPayment') : t('pendingSync')}</AppText><AppText tone="error">{o.error}</AppText><AppText variant="caption">{o.id}</AppText></Card>)}
    <AppButton label={t('syncNow')} onPress={() => { void syncGymOutbox(store).catch((e: unknown) => setError(e instanceof Error ? e.message : t('loadFailed'))); }} />{!!error && <AppText tone="error">{error}</AppText>}
  </Screen>;
}
