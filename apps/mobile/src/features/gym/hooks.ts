import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { accountBalance } from '@fitlog/domain';
import { loadGymAccount, type GymAccount } from '@/data/gym-api';
import { useGym } from './GymProvider';
import { t } from '@/lib/i18n';

export function useGymAccount(memberId: string) {
  const { gym } = useGym(); const [account, setAccount] = useState<GymAccount | null>(null); const [error, setError] = useState('');
  const refresh = useCallback(async () => { const next = await loadGymAccount(gym.id, memberId); setAccount(next); setError(''); return next; }, [gym.id, memberId]);
  useFocusEffect(useCallback(() => { let active = true; void loadGymAccount(gym.id, memberId).then((next) => { if (active) { setAccount(next); setError(''); } }).catch((e: unknown) => { if (active) setError(e instanceof Error ? e.message : t('loadFailed')); }); return () => { active = false; }; }, [gym.id, memberId]));
  return { account, error, setError, refresh };
}
export function gymAccountBalance(account: GymAccount) {
  return accountBalance(account.charges.map((c) => ({ id: c.id, amount: c.amount_paise + account.adjustments.filter((a) => a.charge_id === c.id).reduce((n, a) => n + a.delta_paise, 0), dueDate: c.due_on })), account.payments.map((p) => ({ id: p.id, amount: p.amount_paise })),
    account.allocations.map((a) => ({ chargeId: a.charge_id, paymentId: a.payment_id, delta: a.delta_paise })), account.principal.map((p) => ({ paymentId: p.payment_id, start: p.start_paise, amount: p.amount_paise, type: p.event_type as 'refund' | 'reversal' })));
}
export function inr(paise: number) { return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: paise % 100 ? 2 : 0 }).format(paise / 100); }
