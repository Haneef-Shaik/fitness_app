/**
 * The "Resend in 0:45" on A-05 and A-06 — a countdown, never a bare
 * "try later" (01 cross-cutting: rate limiting). The server enforces the same
 * minute per link; this only saves a tap that would be refused.
 */
import { useCallback, useEffect, useState } from 'react';

/** Matches EMAIL_RESEND_COOLDOWN_SECONDS on the server. */
export const RESEND_SECONDS = 60;

export function formatCountdown(seconds: number): string {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export function useCooldown(seconds: number = RESEND_SECONDS) {
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (endsAt === null) return undefined;
    const id = setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (t >= endsAt) setEndsAt(null);
    }, 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  const start = useCallback(() => {
    const t = Date.now();
    setNow(t);
    setEndsAt(t + seconds * 1000);
  }, [seconds]);

  const remaining = endsAt === null ? 0 : Math.max(0, Math.ceil((endsAt - now) / 1000));
  return { remaining, start };
}
