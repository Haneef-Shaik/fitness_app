import * as Crypto from 'expo-crypto';
import { z } from 'zod';
import { requireBackend } from '@/lib/supabase';
import type { Json } from '@/data/database.types';
const change = z.object({ id: z.uuid(), revision: z.number().int().positive(), oldStartsOn: z.iso.date(), oldEndsOn: z.iso.date(), startsOn: z.iso.date(), endsOn: z.iso.date(), originalEndsOn: z.iso.date() });
export const freezeReviewSchema = z.object({ freezeId: z.uuid(), previewHash: z.string().min(1), changes: z.array(change).min(1), proposedRenewals: z.array(change), needsShift: z.boolean(), remainingDays: z.number().int().nonnegative(), consumedDays: z.number().int().nonnegative(), restoredDays: z.number().int().nonnegative(), gapDays: z.number().int().nonnegative() });
export type FreezeReview = z.infer<typeof freezeReviewSchema>;
export type FreezeAction = 'request' | 'approve' | 'reject' | 'cancel' | 'unfreeze';
export async function freezePreview(gymId: string, kind: 'approve' | 'unfreeze', payload: Record<string, unknown>) {
  const { data, error } = await requireBackend().rpc('freeze_preview_v1', { p_command: JSON.parse(JSON.stringify({ gymId, kind, payload })) as Json });
  if (error) throw error; return freezeReviewSchema.parse(data);
}
export async function freezeCommand(gymId: string, kind: FreezeAction, payload: Record<string, unknown>, id = Crypto.randomUUID()) {
  const { data, error } = await requireBackend().rpc('freeze_command_v1', { p_command: JSON.parse(JSON.stringify({ id, gymId, kind, payload })) as Json });
  if (error) throw error; return data;
}
