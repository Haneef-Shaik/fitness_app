/**
 * Rest timer arithmetic (E-04), kept out of the component so it is testable.
 *
 * **It counts to a target instant, never down from a number.** A decrementing
 * counter stops when the app is backgrounded and resumes wrong; a target instant
 * is simply re-read, so the phone can sleep through the whole rest period and
 * still be right. Backgrounding is the normal case here, not an edge case — the
 * user puts the phone down between sets.
 */
export interface RestTimerState {
  /** Seconds left, floored at 0. */
  remaining: number;
  /** True once the target has passed. */
  elapsed: boolean;
  /** 0 → 1 for the progress ring. */
  progress: number;
}

export function targetFor(startedAt: Date, seconds: number): string {
  return new Date(startedAt.getTime() + seconds * 1000).toISOString();
}

export function readTimer(targetIso: string, totalSeconds: number, now: Date): RestTimerState {
  const target = Date.parse(targetIso);
  if (Number.isNaN(target) || totalSeconds <= 0) {
    return { remaining: 0, elapsed: true, progress: 1 };
  }
  const remainingMs = target - now.getTime();
  const remaining = Math.max(0, Math.ceil(remainingMs / 1000));
  const done = remainingMs <= 0;
  return {
    remaining,
    elapsed: done,
    progress: done ? 1 : Math.min(1, Math.max(0, 1 - remaining / totalSeconds)),
  };
}

/** `3:00`, `0:45`. */
export function formatRest(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
