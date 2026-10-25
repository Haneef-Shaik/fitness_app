import type { BodyEntry, Exercise, Food, Goal, MealItem, NutritionTarget, Occurrence, Operation, Programme, WorkoutSession } from '@fitlog/domain';

export interface Profile {
  id: string; displayName: string; timezone: string; locale: 'en' | 'hi';
  weightUnit: 'kg' | 'lb'; lengthUnit: 'cm' | 'in'; weeklyGoal: number;
}
export interface MemberData {
  exercises: Exercise[]; programmes: Programme[]; sessions: WorkoutSession[]; foods: Food[];
  meals: MealItem[]; targets: NutritionTarget[]; body: BodyEntry[]; goals: Goal[]; occurrences: Occurrence[];
}
export const emptyMemberData = (): MemberData => ({ exercises: [], programmes: [], sessions: [], foods: [], meals: [], targets: [], body: [], goals: [], occurrences: [] });
export interface LocalCache {
  read(): Promise<{ data: MemberData; operations: Operation[]; drafts: Record<string, unknown> } | null>;
  write(data: MemberData, operations: Operation[], drafts: Record<string, unknown>): Promise<void>;
  close(): Promise<void>;
  clear(): Promise<void>;
}
