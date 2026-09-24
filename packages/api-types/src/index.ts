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
export type Goal = Schemas['GoalCardOut'];
export type User = Schemas['UserRefOut'];
export type Me = Schemas['MeOut'];
export type TokenPair = Schemas['TokenPair'];
export type AuthResult = Schemas['AuthOut'];

export type Exercise = Schemas['ExerciseOut'];
export type MuscleGroup = Schemas['MuscleGroupOut'];
export type MuscleRef = Schemas['MuscleRefOut'];

export type Program = Schemas['ProgramOut'];
export type ProgramTemplate = Schemas['ProgramTemplateOut'];
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

/* ------------------------------------------------------------- history (G5) */

export type HistoryItem = Schemas['HistoryItemOut'];
export type CursorMeta = Schemas['CursorMeta'];
export type PreviousOccurrence = Schemas['PreviousOccurrenceOut'];
export type SessionComparison = Schemas['ComparisonOut'];
export type ComparisonRow = Schemas['ComparisonRowOut'];
export type ComparisonCell = Schemas['ComparisonCellOut'];
export type ComparisonSession = Schemas['ComparisonSessionOut'];

/* ----------------------------------------------------------- analytics (G6) */

export type WorkoutAnalytics = Schemas['WorkoutAnalyticsOut'];
export type VolumeBucket = Schemas['VolumeBucketOut'];
export type MuscleVolume = Schemas['MuscleVolumeOut'];
export type ExerciseProgression = Schemas['ExerciseProgressionOut'];
export type PersonalRecordRow = Schemas['PersonalRecordRowOut'];
export type Frequency = Schemas['FrequencyOut'];
export type ProgressionPoint = Schemas['ProgressionPointOut'];
export type FrequencyCell = Schemas['FrequencyCellOut'];
export type Adherence = Schemas['AdherenceOut'];
export type AdherenceWeek = Schemas['AdherenceWeekOut'];

/* ----------------------------------------------------------- nutrition (G7) */

export type Food = Schemas['FoodOut'];
export type FoodIn = Schemas['FoodIn'];
export type FoodPatch = Schemas['FoodPatch'];
export type Meal = Schemas['MealOut'];
export type MealIn = Schemas['MealIn'];
export type MealItem = Schemas['MealItemOut'];
export type MealItemIn = Schemas['MealItemIn'];
export type MealItemPatch = Schemas['MealItemPatch'];
export type NutritionDay = Schemas['DayOut'];
export type MealCategory = Schemas['MealCategoryOut'];
export type MealCategoryIn = Schemas['MealCategoryIn'];
export type MealCategoryPatch = Schemas['MealCategoryPatch'];
export type CategoryOrderIn = Schemas['CategoryOrderIn'];
export type Recipe = Schemas['RecipeOut'];
export type RecipeIn = Schemas['RecipeIn'];
export type RecipePatch = Schemas['RecipePatch'];
export type RecipeItem = Schemas['RecipeItemOut'];
export type RecipeItemIn = Schemas['RecipeItemIn'];
export type RecipeLogIn = Schemas['RecipeLogIn'];
export type MealCopyIn = Schemas['MealCopyIn'];
export type DayCopyIn = Schemas['DayCopyIn'];

/* ------------------------------------------------------- AI nutrition (G8) */

export type FoodAnalysis = Schemas['AnalysisOut'];
export type FoodAnalysisItem = Schemas['AnalysisItemOut'];
export type TextAnalysisIn = Schemas['TextAnalysisIn'];
export type ImageAnalysisIn = Schemas['ImageAnalysisIn'];
export type ConfirmIn = Schemas['ConfirmIn'];
export type ConfirmItemIn = Schemas['ConfirmItemIn'];
export type UploadSignIn = Schemas['UploadSignIn'];
export type UploadSign = Schemas['UploadSignOut'];
export type AnalysisQuota = Schemas['QuotaOut'];

/* ------------------------------------------- body, goals and B-01 (G9) */

export type Dashboard = Schemas['DashboardOut'];
export type TrainingCard = Schemas['TrainingCardOut'];
export type NutritionCard = Schemas['NutritionCardOut'];
export type BodyCard = Schemas['BodyCardOut'];
export type GoalCard = Schemas['GoalCardOut'];
export type BodyMetric = Schemas['BodyMetricOut'];
export type BodyMetricIn = Schemas['BodyMetricIn'];
export type BodySeries = Schemas['BodySeriesOut'];
export type Checkins = Schemas['CheckinsOut'];
export type Checkin = Schemas['CheckinOut'];
export type BodyPoint = Schemas['BodyPointOut'];
export type ProgressPhoto = Schemas['ProgressPhotoOut'];
export type ProgressPhotoIn = Schemas['ProgressPhotoIn'];

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
export type SessionExercisePatch = Schemas['SessionExercisePatch'];
export type SessionPatch = Schemas['SessionPatch'];
export type SetIn = Schemas['SetIn'];
export type RegisterIn = Schemas['RegisterIn'];
export type LoginIn = Schemas['LoginIn'];
export type RefreshIn = Schemas['RefreshIn'];
