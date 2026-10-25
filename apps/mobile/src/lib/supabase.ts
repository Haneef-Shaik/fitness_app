import { createClient } from '@supabase/supabase-js';
import { authStorage } from './auth-storage';
import type { Database } from '@/data/database.types';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
export const backendConfigured = Boolean(url && key);
export const supabase = url && key ? createClient<Database>(url, key, {
  auth: { storage: authStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false, flowType: 'pkce' },
}) : null;

export function requireBackend() {
  if (!supabase) throw new Error('Sign-in is temporarily unavailable. Please try again later.');
  return supabase;
}
