import { bodyEntrySchema, exerciseSchema, foodSchema, goalSchema, mealItemSchema, occurrenceSchema, programmeSchema, sessionSchema, targetSchema, type BodyEntry, type Goal, type MealItem, type NutritionTarget, type Operation } from '@fitlog/domain';
import { requireBackend } from '@/lib/supabase';
import type { Database, Json } from './database.types';
import type { MemberData, Profile } from './types';

type Table = keyof Database['public']['Tables'];
async function rows<T extends Table>(table: T) {
  const all: Database['public']['Tables'][T]['Row'][] = [];
  for (let offset = 0; ; offset += 500) {
    const query = requireBackend().from(table).select('*').order('id').range(offset, offset + 499);
    if (table === 'exercises') query.order('version');
    const { data, error } = await query;
    if (error) throw error;
    const page = data as unknown as Database['public']['Tables'][T]['Row'][];
    all.push(...page);
    if (page.length < 500) return all;
  }
}
export async function loadProfile(): Promise<Profile | null> {
  const { data: { user }, error: authError } = await requireBackend().auth.getUser();
  if (authError) throw authError;
  if (!user) return null;
  const { data, error } = await requireBackend().from('profiles').select('*').eq('id', user.id).maybeSingle();
  if (error) throw error;
  return data ? { id: data.id, displayName: data.display_name, timezone: data.timezone, locale: data.locale as 'en' | 'hi', weightUnit: data.weight_unit as 'kg' | 'lb', lengthUnit: data.length_unit as 'cm' | 'in', weeklyGoal: data.weekly_goal } : null;
}
export async function loadMemberData(): Promise<MemberData> {
  const refresh = await requireBackend().rpc('refresh_schedules_v1');
  if (refresh.error) throw refresh.error;
  const [exercises, programmes, sessions, sets, foods, meals, targets, body, goals, occurrences] = await Promise.all([
    rows('exercises'), rows('programmes'), rows('workout_sessions'), rows('performed_sets'), rows('foods'), rows('meal_items'), rows('nutrition_targets'), rows('body_entries'), rows('goals'), rows('schedule_occurrences'),
  ]);
  return {
    exercises: exercises.map((e) => exerciseSchema.parse({ id: e.id, version: e.version, name: e.name, type: e.logging_type, loadBasis: e.load_basis, multiplier: e.multiplier, equipment: e.equipment, primaryMuscles: e.primary_muscles, secondaryMuscles: e.secondary_muscles, instructions: e.instructions, aliases: e.aliases, ownerId: e.owner_id, archived: e.archived })),
    programmes: programmes.map((p) => programmeSchema.parse({ ...p, createdAt: p.created_at, updatedAt: p.updated_at })),
    sessions: sessions.map((s) => sessionSchema.parse({ ...s, ownerId: s.owner_id, programmeId: s.programme_id, dayId: s.day_id, occurrenceId: s.occurrence_id, startedAt: s.started_at, endedAt: s.ended_at, localDate: s.local_date, restDeadline: null, deletedAt: s.deleted_at, syncState: 'synced',
      sets: sets.filter((set) => set.session_id === s.id).map((set) => ({ id: set.id, mutationId: set.mutation_id, instanceId: set.instance_id, reps: set.reps, loadKg: set.load_kg, durationSeconds: set.duration_seconds, distanceMetres: set.distance_metres, rpe: set.rpe, rir: set.rir, type: set.set_type, notes: set.notes, performedAt: set.performed_at, revision: set.revision, deletedAt: set.deleted_at })) })),
    foods: foods.map((f) => foodSchema.parse({ ...f, ownerId: f.owner_id, referenceQuantity: f.reference_quantity, referenceUnit: f.reference_unit, sourceVersion: f.source_version })),
    meals: meals.map((m) => mealItemSchema.parse({ ...m, ownerId: m.owner_id, foodId: m.food_id, consumedAt: m.consumed_at, localDate: m.local_date, deletedAt: m.deleted_at, nutrients: { kcal: m.kcal, protein: m.protein, carbs: m.carbs, fat: m.fat, fibre: m.fibre } })),
    targets: targets.map((t) => targetSchema.parse({ ...t, effectiveDate: t.effective_date })),
    body: body.map((b) => bodyEntrySchema.parse({ ...b, ownerId: b.owner_id, measuredAt: b.measured_at, localDate: b.local_date, weightKg: b.weight_kg, bodyFat: b.body_fat, deletedAt: b.deleted_at })),
    goals: goals.map((g) => goalSchema.parse({ ...g, type: g.goal_type, exerciseId: g.exercise_id, exerciseVersion: g.exercise_version, loadBasis: g.load_basis, fixedLoadKg: g.fixed_load_kg, baselineCutoff: g.baseline_cutoff, startDate: g.start_date, rangeMin: g.range_min, rangeMax: g.range_max })),
    occurrences: occurrences.map((o) => occurrenceSchema.parse({ ...o, programmeId: o.programme_id, dayId: o.day_id, date: o.local_date, sessionId: o.session_id })),
  };
}
export async function scheduleProgramme(id: string, version: number, effective: string, timezone: string) {
  const { error } = await requireBackend().rpc('schedule_programme_v1', { p_id: id, p_version: version, p_effective: effective, p_timezone: timezone });
  if (error) throw error;
}
export async function sendOperation(operation: Operation) {
  const { data, error } = await requireBackend().rpc('apply_operation_v1', { p_operation: JSON.parse(JSON.stringify(operation)) as Json });
  if (error) throw error;
  return data;
}
export async function saveMeal(item: MealItem) {
  const m = mealItemSchema.parse(item);
  const { error } = await requireBackend().from('meal_items').insert({ id: m.id, owner_id: m.ownerId, label: m.label, food_id: m.foodId, quantity: m.quantity, unit: m.unit,
    ...m.nutrients, category: m.category, consumed_at: m.consumedAt, local_date: m.localDate, timezone: m.timezone, source: m.source, confirmed: true, estimate: m.estimate, revision: m.revision });
  if (error) throw error;
}
export async function saveBody(entry: BodyEntry) {
  const b = bodyEntrySchema.parse(entry);
  const { error } = await requireBackend().from('body_entries').insert({ id: b.id, owner_id: b.ownerId, measured_at: b.measuredAt, local_date: b.localDate, timezone: b.timezone,
    weight_kg: b.weightKg, body_fat: b.bodyFat, measurements: b.measurements, notes: b.notes, revision: b.revision });
  if (error) throw error;
}
export async function saveGoal(goal: Goal, ownerId: string) {
  const g = goalSchema.parse(goal);
  const { error } = await requireBackend().from('goals').insert({ id: g.id, owner_id: ownerId, name: g.name, goal_type: g.type, metric: g.metric, exercise_id: g.exerciseId, exercise_version: g.exerciseVersion,
    load_basis: g.loadBasis, fixed_load_kg: g.fixedLoadKg, baseline: g.baseline, baseline_cutoff: g.baselineCutoff, start_date: g.startDate, deadline: g.deadline, target: g.target,
    range_min: g.rangeMin, range_max: g.rangeMax, status: g.status, notes: g.notes, revision: g.revision });
  if (error) throw error;
}
export async function saveTargets(target: NutritionTarget, ownerId: string) {
  const t = targetSchema.parse(target);
  const { error } = await requireBackend().from('nutrition_targets').insert({ id: t.id, owner_id: ownerId, effective_date: t.effectiveDate, kcal: t.kcal, protein: t.protein, carbs: t.carbs, fat: t.fat, fibre: t.fibre });
  if (error) throw error;
}
