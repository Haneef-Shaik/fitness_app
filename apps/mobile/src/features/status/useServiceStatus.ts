/**
 * L-08 · what the service says about itself — maintenance, and whether food
 * analysis is struggling. Asked at launch and whenever the app comes back to
 * the foreground; a failed ask means "nothing to report", never an alarm.
 */
import { useQuery } from '@tanstack/react-query';
import type { ServiceStatus } from '@fitlog/api-types';
import { api } from '@/lib/api';

export const SERVICE_STATUS_KEY = ['service-status'] as const;

export function useServiceStatus() {
  return useQuery<ServiceStatus>({
    queryKey: SERVICE_STATUS_KEY,
    queryFn: () => api.get<ServiceStatus>('/status'),
    staleTime: 60_000,
    refetchInterval: 5 * 60_000,
    refetchOnWindowFocus: true,
    retry: false,
  });
}
