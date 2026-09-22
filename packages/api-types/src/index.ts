/**
 * The client's view of the API contract.
 *
 * Everything here is a *projection* of `schema.d.ts`, which is generated from the
 * server's OpenAPI document. There are no hand-written shapes in this package by
 * design: a hand-written type that shadows a generated one is drift with extra
 * steps, and CI fails the build when the generated file is stale (D3b).
 *
 * To change a shape, change the Pydantic schema in `services/api/app/schemas/`,
 * then run `pnpm --filter @volt/api-types generate`.
 */
import type { components, operations, paths } from './schema';

export type { components, operations, paths };

/** Every named schema in the document, by its server-side name. */
export type Schemas = components['schemas'];

/* ------------------------------------------------------------------ envelope */

/** The error body, present on failure and never on success (I9). */
export type ApiErrorBody = Schemas['ErrorOut'];

/** Pagination and batch counters; which keys appear is per-endpoint. */
export type Meta = Schemas['Meta'];

/**
 * Pulls the payload type out of a generated envelope.
 *
 *   Unwrap<Schemas['Envelope_ProfileOut_']>  ->  ProfileOut
 *
 * `data` is nullable in the envelope because a failure carries none, and because
 * some endpoints legitimately answer "nothing" — `GET /workout-sessions/active`
 * and previous-performance both return a null `data` rather than a 404.
 */
export type Unwrap<E> = E extends { data?: infer D } ? NonNullable<D> : never;

/* --------------------------------------------------------- response payloads */

export type Profile = Schemas['ProfileOut'];
export type Goal = Schemas['GoalOut'];
export type User = Schemas['UserRefOut'];
export type Me = Schemas['MeOut'];
export type TokenPair = Schemas['TokenPair'];
export type AuthResult = Schemas['AuthOut'];

export type Exercise = Schemas['ExerciseOut'];
export type MuscleGroup = Schemas['MuscleGroupOut'];
export type MuscleRef = Schemas['MuscleRefOut'];

export type Program = Schemas['ProgramOut'];
export type PlanDay = Schemas['PlanDayOut'];
export type PlanExercise = Schemas['PlanExerciseOut'];

export type WorkoutSession = Schemas['SessionOut'];
export type SessionExercise = Schemas['SessionExerciseOut'];
export type WorkoutSet = Schemas['SetOut'];
export type SessionFinish = Schemas['SessionFinishOut'];
export type PersonalRecord = Schemas['PersonalRecordOut'];
export type RecordEntry = Schemas['RecordEntryOut'];
export type PreviousPerformance = Schemas['PreviousPerformanceOut'];
export type ExerciseHistoryEntry = Schemas['ExerciseHistoryEntryOut'];
export type ExerciseStats = Schemas['ExerciseStatsOut'];
export type E1rmPoint = Schemas['E1rmPointOut'];
export type SetBatchResult = Schemas['SetBatchOut'];
export type SetBatchItem = Schemas['SetBatchItemOut'];
export type Deleted = Schemas['DeletedOut'];

/* ---------------------------------------------------------- request payloads */

export type ProfilePatch = Schemas['ProfilePatch'];
export type GoalIn = Schemas['GoalIn'];
export type GoalPatch = Schemas['GoalPatch'];
export type ExerciseIn = Schemas['ExerciseIn'];
export type ExercisePatch = Schemas['ExercisePatch'];
export type ProgramIn = Schemas['ProgramIn'];
export type ProgramPatch = Schemas['ProgramPatch'];
export type PlanDayIn = Schemas['PlanDayIn'];
export type PlanDayPatch = Schemas['PlanDayPatch'];
export type PlanExerciseIn = Schemas['PlanExerciseIn'];
export type SessionStart = Schemas['SessionStart'];
export type SessionExerciseIn = Schemas['SessionExerciseIn'];
export type SetIn = Schemas['SetIn'];
export type RegisterIn = Schemas['RegisterIn'];
export type LoginIn = Schemas['LoginIn'];
export type RefreshIn = Schemas['RefreshIn'];
