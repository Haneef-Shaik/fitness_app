import { createContext, useCallback, useContext, useEffect, useState, type PropsWithChildren } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { loadGym, listGyms, type Gym, type GymPlan } from '@/data/gym-api';
import { useMember } from '@/data/MemberProvider';
import { AppButton, AppText, Header, Screen } from '@/ui';
import { t } from '@/lib/i18n';
interface GymContextValue { gym: Gym; plans: GymPlan[]; role: string; refresh: () => Promise<void> }
const Context = createContext<GymContextValue | null>(null);
export function GymProvider({ children }: PropsWithChildren) {
  const { gymId } = useLocalSearchParams<{ gymId: string }>(); const { profile } = useMember();
  const [value, setValue] = useState<Omit<GymContextValue, 'refresh'> | null>(null); const [error, setError] = useState('');
  const fetchValue = useCallback(async () => { const [{ gym, plans }, { roles }] = await Promise.all([loadGym(gymId), listGyms()]); const role = roles.find((r) => r.gym_id === gymId && r.user_id === profile.id)?.role ?? 'member'; return { gym, plans, role }; }, [gymId, profile.id]);
  const refresh = useCallback(async () => { const next = await fetchValue(); setValue(next); setError(''); }, [fetchValue]);
  useEffect(() => { let active = true; void fetchValue().then((next) => { if (active) { setValue(next); setError(''); } }).catch((e: unknown) => { if (active) setError(e instanceof Error ? e.message : t('loadFailed')); }); return () => { active = false; }; }, [fetchValue]);
  if (error) return <Screen><Header title={t('gym')} back /><AppText tone="error">{error}</AppText><AppButton label={t('retry')} onPress={() => { void refresh().catch(() => {}); }} /></Screen>;
  if (!value || value.gym.id !== gymId) return <Screen><AppText>{t('loadingData')}</AppText></Screen>;
  return <Context.Provider value={{ ...value, refresh }}>{children}</Context.Provider>;
}
export function useGym() { const gym = useContext(Context); if (!gym) throw new Error('Gym workspace unavailable'); return gym; }
