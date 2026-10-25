import { z } from 'zod';

export const id = z.uuid();
export const name = z.string().trim().min(1).max(100);
export const note = z.string().max(2000);
export const finite = z.number().finite();
export const localDate = z.iso.date();
export const timestamp = z.iso.datetime({ offset: true });
export const timezone = z.string().refine((value) => {
  try { new Intl.DateTimeFormat('en', { timeZone: value }); return true; } catch { return false; }
}, 'Invalid time zone');

export const exerciseSchema = z.object({
  id, version: z.number().int().positive(), name,
  type: z.enum(['resistance', 'bodyweight', 'timed', 'distance']),
  loadBasis: z.enum(['total', 'per_hand', 'assistance', 'none']),
  multiplier: z.union([z.literal(1), z.literal(2)]),
  equipment: name, primaryMuscles: z.array(name).min(1), secondaryMuscles: z.array(name),
  instructions: note, aliases: z.array(name), ownerId: id.nullable(), archived: z.boolean(),
});
export type Exercise = z.infer<typeof exerciseSchema>;

export const prescriptionSchema = z.object({
  id, exercise: exerciseSchema,
  sets: z.number().int().min(1).max(50), repsMin: z.number().int().min(1).max(1000),
  repsMax: z.number().int().min(1).max(1000), loadKg: finite.min(0).max(2000).nullable(),
  durationSeconds: z.number().int().min(1).max(86400).nullable(), distanceMetres: finite.positive().max(1_000_000).nullable(),
  restSeconds: z.number().int().min(0).max(3600), supersetId: id.nullable(),
}).refine((p) => p.repsMin <= p.repsMax, { message: 'Minimum reps must not exceed maximum', path: ['repsMax'] });
export type Prescription = z.infer<typeof prescriptionSchema>;
export const planDaySchema = z.object({ id, name, notes: note, exercises: z.array(prescriptionSchema), weekdays: z.array(z.number().int().min(0).max(6)) });
export type PlanDay = z.infer<typeof planDaySchema>;
export const programmeSchema = z.object({
  id, name, description: note, version: z.number().int().positive(), days: z.array(planDaySchema),
  archived: z.boolean(), current: z.boolean(), createdAt: timestamp, updatedAt: timestamp,
});
export type Programme = z.infer<typeof programmeSchema>;

export const performedSetSchema = z.object({
  id, mutationId: id, instanceId: id,
  reps: z.number().int().min(1).max(1000).nullable(), loadKg: finite.min(0).max(2000).nullable(),
  durationSeconds: z.number().int().min(1).max(86400).nullable(), distanceMetres: finite.positive().max(1_000_000).nullable(),
  rpe: finite.min(0).max(10).multipleOf(0.5).nullable(), rir: z.number().int().min(0).max(10).nullable(),
  type: z.enum(['warmup', 'working', 'drop', 'failure']), notes: note,
  performedAt: timestamp, revision: z.number().int().positive(), deletedAt: timestamp.nullable(),
});
export type PerformedSet = z.infer<typeof performedSetSchema>;
export const sessionInstanceSchema = z.object({ id, exercise: exerciseSchema, prescription: prescriptionSchema.nullable(), skipped: z.boolean() });
export type SessionInstance = z.infer<typeof sessionInstanceSchema>;
export const sessionSchema = z.object({
  id, ownerId: id, name, programmeId: id.nullable(), dayId: id.nullable(), occurrenceId: id.nullable(),
  startedAt: timestamp, endedAt: timestamp.nullable(), timezone, localDate,
  status: z.enum(['in_progress', 'completed', 'discarded']), revision: z.number().int().positive(),
  instances: z.array(sessionInstanceSchema), sets: z.array(performedSetSchema), notes: note,
  pauses: z.array(z.object({ startedAt: timestamp, endedAt: timestamp.nullable() })),
  restDeadline: timestamp.nullable(), deletedAt: timestamp.nullable(), syncState: z.enum(['pending', 'synced', 'conflict']),
});
export type WorkoutSession = z.infer<typeof sessionSchema>;

export const occurrenceSchema = z.object({
  id, programmeId: id, dayId: id, date: localDate, timezone,
  status: z.enum(['pending', 'completed', 'missed', 'cancelled']), sessionId: id.nullable(), revision: z.number().int().positive(),
});
export type Occurrence = z.infer<typeof occurrenceSchema>;

export const nutrientsSchema = z.object({
  kcal: finite.min(0).nullable(), protein: finite.min(0).nullable(), carbs: finite.min(0).nullable(),
  fat: finite.min(0).nullable(), fibre: finite.min(0).nullable(),
});
export type Nutrients = z.infer<typeof nutrientsSchema>;
export const foodSchema = z.object({
  id, name, aliases: z.array(name), brand: z.string().max(100), referenceQuantity: finite.positive(),
  referenceUnit: z.enum(['g', 'ml', 'serving']), nutrients: nutrientsSchema,
  servings: z.array(z.object({ name, quantity: finite.positive(), unit: z.enum(['g', 'ml', 'serving']) })),
  source: note, sourceVersion: name, ownerId: id.nullable(), archived: z.boolean(),
});
export type Food = z.infer<typeof foodSchema>;
export const mealItemSchema = z.object({
  id, ownerId: id, label: name, foodId: id.nullable(), quantity: finite.positive(), unit: name,
  nutrients: nutrientsSchema, category: name, consumedAt: timestamp, localDate, timezone,
  source: note, confirmed: z.literal(true), estimate: z.boolean(), revision: z.number().int().positive(), deletedAt: timestamp.nullable(),
});
export type MealItem = z.infer<typeof mealItemSchema>;
export const targetSchema = z.object({
  id, effectiveDate: localDate, kcal: finite.positive().nullable(), protein: finite.min(0).nullable(),
  carbs: finite.min(0).nullable(), fat: finite.min(0).nullable(), fibre: finite.min(0).nullable(),
});
export type NutritionTarget = z.infer<typeof targetSchema>;
export const bodyEntrySchema = z.object({
  id, ownerId: id, measuredAt: timestamp, localDate, timezone,
  weightKg: finite.positive().max(500).nullable(), bodyFat: finite.min(0).max(100).nullable(),
  measurements: z.record(z.string(), finite.positive().max(500)), notes: note, deletedAt: timestamp.nullable(), revision: z.number().int().positive(),
}).refine((e) => e.weightKg !== null || e.bodyFat !== null || Object.keys(e.measurements).length > 0 || e.notes.trim().length > 0, 'Enter a measurement or note');
export type BodyEntry = z.infer<typeof bodyEntrySchema>;
export const goalSchema = z.object({
  id, name, type: z.enum(['loss', 'gain', 'maintenance', 'strength', 'custom']),
  metric: z.enum(['weight', 'max_load', 'e1rm', 'reps', 'manual']),
  exerciseId: id.nullable(), exerciseVersion: z.number().int().positive().nullable(),
  loadBasis: z.enum(['total', 'per_hand', 'none']).nullable(), fixedLoadKg: finite.min(0).nullable(),
  baseline: finite, baselineCutoff: timestamp, startDate: localDate, deadline: localDate.nullable(),
  target: finite, rangeMin: finite.nullable(), rangeMax: finite.nullable(),
  status: z.enum(['active', 'paused', 'completed']), notes: note, revision: z.number().int().positive(),
}).refine((g) => g.deadline === null || g.deadline >= g.startDate, 'Deadline must be on or after start date');
export type Goal = z.infer<typeof goalSchema>;

export const operationSchema = z.object({
  id, ownerId: id, entityId: id, kind: z.enum(['session.create', 'session.update', 'session.finish', 'session.delete', 'session.restore', 'set.commit', 'set.edit', 'set.delete', 'set.restore', 'programme.save', 'programme.archive']),
  baseRevision: z.number().int().min(0), payload: z.record(z.string(), z.unknown()), createdAt: timestamp,
  dependencies: z.array(id), attempts: z.number().int().min(0),
  status: z.enum(['pending', 'syncing', 'synced', 'rejected', 'conflict']), error: z.string().nullable(),
});
export type Operation = z.infer<typeof operationSchema>;
