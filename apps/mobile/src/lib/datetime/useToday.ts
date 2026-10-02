/**
 * Today, in the profile's zone — the reference point for "Today", "Yesterday"
 * and "6 days ago". A label, never a decision about which day a record is (I7).
 */
import { useProfile } from '@/lib/query/hooks';
import { localDateIn } from './index';

export function useToday(): string {
  return localDateIn(new Date(), useProfile().data?.timezone);
}
