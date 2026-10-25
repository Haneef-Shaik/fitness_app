import * as Crypto from 'expo-crypto';
import { requireBackend } from '@/lib/supabase';
import type { Database, Json } from './database.types';

export type Gym = Database['public']['Tables']['gyms']['Row'];
export type GymRole = Database['public']['Tables']['gym_roles']['Row'];
export type GymMember = Database['public']['Tables']['gym_members']['Row'];
export type GymPlan = Database['public']['Tables']['gym_plans']['Row'];
export type GymMembership = Database['public']['Tables']['gym_memberships']['Row'];
export type GymReceipt = Database['public']['Tables']['gym_receipts']['Row'];
export type GymPayment = Database['public']['Tables']['gym_payments']['Row'];
export interface GymAccount {
  member: GymMember; memberships: GymMembership[];
  freezes: Database['public']['Tables']['gym_freezes']['Row'][];
  charges: Database['public']['Tables']['gym_charges']['Row'][];
  adjustments: Database['public']['Tables']['gym_charge_adjustments']['Row'][];
  payments: GymPayment[]; receipts: GymReceipt[];
  principal: Database['public']['Tables']['gym_principal_events']['Row'][];
  allocations: Database['public']['Tables']['gym_allocations']['Row'][];
  visits: Database['public']['Tables']['gym_visits']['Row'][];
}
export async function gymCommand<T = Json>(gymId: string, kind: string, payload: Record<string, unknown>, operationId = Crypto.randomUUID()): Promise<T> {
  const { data, error } = await requireBackend().rpc('gym_command_v1', { p_command: JSON.parse(JSON.stringify({ id: operationId, gymId, kind, payload })) as Json });
  if (error) throw error;
  return data as T;
}
export async function listGyms() {
  const db = requireBackend(); const [gyms, roles] = await Promise.all([db.from('gyms').select('*').order('name').order('id'), db.from('gym_roles').select('*').is('revoked_at', null)]);
  if (gyms.error) throw gyms.error; if (roles.error) throw roles.error;
  return { gyms: gyms.data, roles: roles.data };
}
export async function loadGym(id: string) {
  const db = requireBackend(); const [gym, plans] = await Promise.all([db.from('gyms').select('*').eq('id', id).single(), db.from('gym_plans').select('*').eq('gym_id', id).order('name').order('version', { ascending: false })]);
  if (gym.error) throw gym.error; if (plans.error) throw plans.error;
  return { gym: gym.data, plans: plans.data.filter((p, i, all) => all.findIndex((other) => other.id === p.id) === i) };
}
export async function listMembers(gymId: string, search: string, page: number, archived = false) {
  let query = requireBackend().from('gym_members').select('*', { count: 'exact' }).eq('gym_id', gymId).eq('archived', archived).order('number').order('id').range(page * 50, page * 50 + 49);
  const clean = search.replace(/[%_(),.\\]/g, '').slice(0, 100).trim();
  if (clean) query = query.or(`name.ilike.%${clean}%,phone.ilike.%${clean}%${/^\d+$/.test(clean) ? `,number.eq.${Number(clean)}` : ''}`);
  const { data, error, count } = await query; if (error) throw error; return { members: data, count: count ?? 0 };
}
export async function loadGymAccount(gymId: string, memberId: string): Promise<GymAccount> {
  const { data, error } = await requireBackend().rpc('gym_account_v1', { p_gym: gymId, p_member: memberId });
  if (error) throw error;
  const account = data as unknown as GymAccount;
  if (!account || account.member.gym_id !== gymId || account.member.id !== memberId) throw new Error('Invalid gym account response');
  return account;
}
