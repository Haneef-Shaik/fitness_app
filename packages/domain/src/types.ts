/** Canonical units only: kg, cm, g, seconds, metres. Conversion happens at the display edge. */
export type SetType = 'warmup' | 'working' | 'drop' | 'failure';

export interface WorkoutSet {
  readonly setType: SetType;
  readonly loadKg: number | null;
  readonly reps: number | null;
  readonly durationSeconds?: number | null;
  readonly distanceM?: number | null;
  readonly completed: boolean;
}

export interface PersonalRecords {
  readonly maxLoadKg: number | null;
  readonly maxReps: number | null;
  readonly volumeKg: number;
  readonly estimated1rmKg: number | null;
}

export interface MealItem {
  readonly calories: number | null;
  readonly proteinG: number | null;
  readonly carbsG: number | null;
  readonly fatG: number | null;
  readonly confirmed: boolean;
}

export interface DayTotals {
  readonly calories: number;
  readonly proteinG: number;
  readonly carbsG: number;
  readonly fatG: number;
  readonly pendingCount: number;
  /** True when a confirmed item was missing a macro — the total cannot be trusted as complete. */
  readonly incomplete: boolean;
}
