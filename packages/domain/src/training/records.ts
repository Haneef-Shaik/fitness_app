import type { WorkoutSet, PersonalRecords } from '../types';
import { setVolumeKg } from './volume';
import { estimated1rmKg } from './e1rm';

/** Only completed working/failure sets are PR-eligible. Warm-ups and drop sets are not. */
export function isPrEligible(s: WorkoutSet): boolean {
  return s.completed && (s.setType === 'working' || s.setType === 'failure');
}

export function evaluateRecords(sets: readonly WorkoutSet[]): PersonalRecords {
  const eligible = sets.filter(isPrEligible);
  const loads = eligible.map(s => s.loadKg).filter((v): v is number => v !== null);
  const reps = eligible.map(s => s.reps).filter((v): v is number => v !== null);
  const e1rms = eligible
    .map(s => estimated1rmKg(s.loadKg, s.reps))
    .filter((v): v is number => v !== null);

  return {
    maxLoadKg: loads.length ? Math.max(...loads) : null,
    maxReps: reps.length ? Math.max(...reps) : null,
    volumeKg: eligible.reduce((t, s) => t + setVolumeKg(s), 0),
    estimated1rmKg: e1rms.length ? Math.max(...e1rms) : null,
  };
}
