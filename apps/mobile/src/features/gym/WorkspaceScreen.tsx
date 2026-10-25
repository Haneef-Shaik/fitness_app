import { useCallback, useState } from 'react';
import { Redirect, useFocusEffect, useRouter } from 'expo-router';
import * as Crypto from 'expo-crypto';
import { listGyms, gymCommand, type Gym } from '@/data/gym-api';
import { useDraft } from '@/data/useDraft';
import { useMember } from '@/data/MemberProvider';
import { requireBackend } from '@/lib/supabase';
import { useGym } from './GymProvider';
import { t } from '@/lib/i18n';
import { AppButton, AppText, Card, Field, Header, Screen } from '@/ui';

export function WorkspaceScreen() {
  const [gyms, setGyms] = useState<Gym[]>([]); const [staffGyms, setStaffGyms] = useState<string[]>([]); const { profile } = useMember(); const [error, setError] = useState(''); const router = useRouter();
  useFocusEffect(useCallback(() => { let active = true; void listGyms().then((d) => { if (active) { setGyms(d.gyms); setStaffGyms(d.roles.filter((r) => r.user_id === profile.id).map((r) => r.gym_id)); setError(''); } }).catch((e: unknown) => { if (active) setError(e instanceof Error ? e.message : t('loadFailed')); }); return () => { active = false; }; }, [profile.id]));
  return <Screen><Header title={t('workspaces')} back /><AppButton label={t('personalWorkspace')} variant="secondary" onPress={() => router.replace('/today')} />
    {gyms.map((gym) => <Card key={gym.id}><AppText variant="title">{gym.name}</AppText><AppButton label={t('continue')} onPress={() => router.push({ pathname: staffGyms.includes(gym.id) ? '/gym/[gymId]/today' : '/gym/[gymId]/card', params: { gymId: gym.id } })} /></Card>)}
    {!gyms.length && <AppText tone="muted">{t('noGym')}</AppText>}<AppButton label={t('createGym')} onPress={() => router.push('/gym-new')} />{!!error && <AppText tone="error">{error}</AppText>}
  </Screen>;
}
export function GymCardScreen() {
  const { gym } = useGym(); const { profile } = useMember(); const [id, setId] = useState<string | null>(null); const [error, setError] = useState('');
  useFocusEffect(useCallback(() => { let active = true; void requireBackend().from('gym_members').select('id').eq('gym_id', gym.id).eq('linked_user_id', profile.id).single().then(({ data, error }) => { if (active) { if (error) setError(t('notFound')); else setId(data.id); } }); return () => { active = false; }; }, [gym.id, profile.id]));
  if (id) return <Redirect href={{ pathname: '/gym/[gymId]/member', params: { gymId: gym.id, memberId: id } }} />;
  return <Screen><Header title={gym.name} back /><AppText>{error || t('loadingData')}</AppText></Screen>;
}
export function GymNewScreen() {
  const { profile } = useMember(); const router = useRouter(); const draft = useDraft('gym-create', { id: Crypto.randomUUID(), operation: Crypto.randomUUID(), name: '', code: '', address: '', contact: '', timezone: profile.timezone });
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  async function save() { setBusy(true); setError(''); try { await gymCommand(draft.value.id, 'gym.create', { name: draft.value.name, code: draft.value.code, address: draft.value.address, contact: draft.value.contact, timezone: draft.value.timezone }, draft.value.operation); await draft.clear(); router.replace({ pathname: '/gym/[gymId]/today', params: { gymId: draft.value.id } }); } catch (e) { setError(e instanceof Error ? e.message : t('saveFailedDraft')); } finally { setBusy(false); } }
  return <Screen><Header title={t('createGym')} back /><AppText tone="muted">{t('createGymNotice')}</AppText>
    {(['name', 'code', 'address', 'contact', 'timezone'] as const).map((key) => <Field key={key} label={t(key === 'name' ? 'gymName' : key === 'code' ? 'gymCode' : key === 'timezone' ? 'timezoneLabel' : key)} value={draft.value[key]} onChangeText={(v) => draft.setValue((d) => ({ ...d, [key]: v }))} />)}
    {!!error && <AppText tone="error">{error}</AppText>}<AppButton label={t('createGym')} loading={busy} onPress={() => { void save(); }} />
  </Screen>;
}
