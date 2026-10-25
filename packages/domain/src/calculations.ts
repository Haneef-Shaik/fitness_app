import type { BodyEntry, Exercise, Food, Goal, MealItem, Nutrients, Occurrence, PerformedSet, WorkoutSession } from './models.ts';

export function localDateAt(value: string | Date, zone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(value));
  const part = (type: string) => parts.find((p) => p.type === type)!.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}
export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + days); return d.toISOString().slice(0, 10);
}
export function weekStart(date: string): string {
  const day = new Date(`${date}T12:00:00Z`).getUTCDay(); return addDays(date, -((day + 6) % 7));
}
export function validateSetForExercise(set: PerformedSet, exercise: Exercise): void {
  if ((exercise.type === 'resistance' || exercise.type === 'bodyweight') && set.reps === null) throw new Error('Repetitions are required');
  if (exercise.type === 'resistance' && set.loadKg === null) throw new Error('Load is required');
  if ((exercise.type === 'timed' || exercise.type === 'distance') && set.durationSeconds === null) throw new Error('Duration is required');
  if (exercise.type === 'distance' && set.distanceMetres === null) throw new Error('Distance is required');
}
export function setVolume(set: PerformedSet, exercise: Exercise): number | null {
  if (set.deletedAt || set.type === 'warmup' || exercise.loadBasis === 'assistance') return null;
  if (!['resistance', 'bodyweight'].includes(exercise.type) || set.reps === null || set.loadKg === null) return null;
  return set.reps * set.loadKg * exercise.multiplier;
}
export function epley(set: PerformedSet, exercise: Exercise): number | null {
  if (set.deletedAt || set.type === 'warmup' || exercise.type !== 'resistance' || exercise.loadBasis === 'assistance') return null;
  if (set.reps === null || set.reps < 1 || set.reps > 30 || set.loadKg === null || set.loadKg <= 0) return null;
  return set.loadKg * (1 + set.reps / 30);
}
export function sessionSummary(session: WorkoutSession, now = new Date().toISOString()) {
  const sets = session.sets.filter((s) => !s.deletedAt);
  const work = sets.filter((s) => s.type !== 'warmup');
  let volume = 0;
  for (const set of work) {
    const exercise = session.instances.find((i) => i.id === set.instanceId)?.exercise;
    if (exercise) volume += setVolume(set, exercise) ?? 0;
  }
  const ended = new Date(session.endedAt ?? now).getTime();
  const paused = session.pauses.reduce((sum, p) => sum + Math.max(0, Math.min(ended, new Date(p.endedAt ?? now).getTime()) - new Date(p.startedAt).getTime()), 0);
  return { workingSets: work.length, exerciseCount: new Set(work.map((s) => s.instanceId)).size, volume,
    durationSeconds: Math.max(0, Math.floor((ended - new Date(session.startedAt).getTime() - paused) / 1000)) };
}
export function previousPerformance(sessions: WorkoutSession[], exercise: Exercise, before: string) {
  return sessions.filter((s) => s.status === 'completed' && !s.deletedAt && s.startedAt < before)
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt) || b.id.localeCompare(a.id))
    .flatMap((s) => {
      const instances = s.instances.filter((i) => i.exercise.id === exercise.id && i.exercise.version === exercise.version && i.exercise.loadBasis === exercise.loadBasis);
      const sets = s.sets.filter((set) => !set.deletedAt && instances.some((i) => i.id === set.instanceId));
      return sets.length ? [{ session: s, sets }] : [];
    })[0] ?? null;
}
export function adherence(occurrences: Occurrence[], today: string) {
  const due = occurrences.filter((o) => o.status !== 'cancelled' && (o.date < today || (o.date === today && o.status === 'completed')));
  return due.length ? { completed: due.filter((o) => o.status === 'completed').length, due: due.length,
    percent: 100 * due.filter((o) => o.status === 'completed').length / due.length } : null;
}
export function canLinkOccurrence(occurrence: Occurrence, actualStart: string, sessionId: string): boolean {
  const date = localDateAt(actualStart, occurrence.timezone);
  return occurrence.status !== 'cancelled' && (occurrence.sessionId === null || occurrence.sessionId === sessionId)
    && date >= occurrence.date && date <= addDays(occurrence.date, 7);
}

export function scaleFood(food: Food, quantity: number, unit: 'g' | 'ml' | 'serving'): Nutrients {
  if (!Number.isFinite(quantity) || quantity <= 0 || quantity > (unit === 'serving' ? 1000 : 100000)) throw new Error('Invalid portion');
  if (unit !== food.referenceUnit) throw new Error('Choose a food-specific portion or a known weight/volume');
  const ratio = quantity / food.referenceQuantity;
  return Object.fromEntries(Object.entries(food.nutrients).map(([key, value]) => [key, value === null ? null : value * ratio])) as Nutrients;
}
export function nutritionTotals(items: MealItem[]) {
  const keys: (keyof Nutrients)[] = ['kcal', 'protein', 'carbs', 'fat', 'fibre'];
  const confirmed = items.filter((i) => i.confirmed && !i.deletedAt);
  return Object.fromEntries(keys.map((key) => [key, {
    value: confirmed.reduce((sum, item) => sum + (item.nutrients[key] ?? 0), 0),
    incomplete: confirmed.some((item) => item.nutrients[key] === null),
    logged: confirmed.length > 0,
  }])) as Record<keyof Nutrients, { value: number; incomplete: boolean; logged: boolean }>;
}
export function latestDailyWeights(entries: BodyEntry[]) {
  const map = new Map<string, BodyEntry>();
  for (const entry of entries.filter((e) => !e.deletedAt && e.weightKg !== null)) {
    const old = map.get(entry.localDate);
    if (!old || entry.measuredAt > old.measuredAt || (entry.measuredAt === old.measuredAt && entry.id > old.id)) map.set(entry.localDate, entry);
  }
  return [...map.values()].sort((a, b) => a.localDate.localeCompare(b.localDate));
}
export function movingWeight(entries: BodyEntry[], date: string) {
  const values = latestDailyWeights(entries).filter((e) => e.localDate >= addDays(date, -6) && e.localDate <= date);
  return values.length ? { value: values.reduce((sum, e) => sum + e.weightKg!, 0) / values.length, count: values.length } : null;
}
export function goalProgress(goal: Goal, current: number | null) {
  if (current === null) return null;
  if (goal.type === 'maintenance') return { percent: null, reached: current >= (goal.rangeMin ?? goal.target) && current <= (goal.rangeMax ?? goal.target) };
  const ratio = goal.target === goal.baseline ? 1 : (current - goal.baseline) / (goal.target - goal.baseline);
  return { percent: Math.max(0, Math.min(1, ratio)) * 100, reached: ratio >= 1 };
}
export function strengthGoalValue(goal: Goal, sessions: WorkoutSession[], today: string): number | null {
  const values: number[] = [];
  for (const s of sessions.filter((s) => s.status === 'completed' && !s.deletedAt && s.localDate >= goal.startDate && s.localDate <= (goal.deadline ?? today))) {
    for (const set of s.sets.filter((set) => !set.deletedAt && set.type !== 'warmup' && set.performedAt > goal.baselineCutoff)) {
      const e = s.instances.find((i) => i.id === set.instanceId)?.exercise;
      if (!e || e.id !== goal.exerciseId || e.version !== goal.exerciseVersion || e.loadBasis === 'assistance' || e.loadBasis !== goal.loadBasis) continue;
      const value = goal.metric === 'e1rm' ? epley(set, e) : goal.metric === 'max_load' ? set.loadKg : set.loadKg === goal.fixedLoadKg ? set.reps : null;
      if (value !== null) values.push(value);
    }
  }
  return values.length ? Math.max(...values) : null;
}
export function platePairs(targetKg: number, barKg: number, available: number[]) {
  if (![targetKg, barKg, ...available].every(Number.isFinite) || targetKg < barKg || barKg < 0 || available.some((p) => p <= 0)) throw new Error('Invalid plate setup');
  let remaining = (targetKg - barKg) / 2;
  const plates: number[] = [];
  for (const weight of [...new Set(available)].sort((a, b) => b - a)) {
    while (remaining + 1e-8 >= weight) { plates.push(weight); remaining -= weight; }
  }
  return { perSide: plates, remainderKg: Math.max(0, remaining * 2), achievedKg: targetKg - Math.max(0, remaining * 2) };
}
/** End-exclusive sold membership boundary; missing anniversary day includes the shorter month's last day. */
export function membershipEndExclusive(start: string, months: number): string {
  if (!Number.isInteger(months) || months < 1) throw new Error('Months must be positive');
  const date = new Date(`${start}T12:00:00Z`); const day = date.getUTCDate();
  const year = date.getUTCFullYear(); const month = date.getUTCMonth() + months;
  const last = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const end = new Date(Date.UTC(year, month, Math.min(day, last), 12));
  return day > last ? addDays(end.toISOString().slice(0, 10), 1) : end.toISOString().slice(0, 10);
}
