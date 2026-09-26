/**
 * Nutrition endpoints (G7) — H-01 … H-16.
 *
 * A surface, not transport. Every shape comes from @fitlog/api-types (D3b), and
 * nothing here computes a macro: a food is per 100 g, an item is absolute, and
 * the server does the one conversion between them so the snapshot can never
 * disagree with its source.
 */
import type {
  CategoryOrderIn, DayCopyIn, Food, FoodIn, FoodPatch, Meal, MealCategory,
  MealCategoryIn, MealCategoryPatch, MealCopyIn, MealIn, MealItem, MealItemPatch,
  NutritionDay, Recipe, RecipeIn, RecipeLogIn, RecipePatch,
} from '@fitlog/api-types';
import { api, type Page } from './api';

function qs(params: Readonly<Record<string, unknown>>): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== '',
  );
  if (entries.length === 0) return '';
  return '?' + entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join('&');
}

export const nutritionApi = {
  /**
   * H-04's search. Paged so `meta.filtered` reaches the screen: "you have no
   * foods" and "nothing matches this" are different states (**I13**), and the
   * second one offers to create what was typed.
   */
  foods: (q?: string, limit = 25): Promise<Page<Food[]>> =>
    api.getPaged<Food[]>('/foods' + qs({ q, limit })),

  /** One food by id. H-05 used to find it in the paged list — see G10. */
  food: (id: string) => api.get<Food>(`/foods/${id}`),

  createFood: (body: FoodIn) => api.post<Food>('/foods', body),
  updateFood: (id: string, body: FoodPatch) => api.patch<Food>(`/foods/${id}`, body),
  deleteFood: (id: string) => api.del<Food>(`/foods/${id}`),

  /** H-01's diary for one local day. Totals count confirmed items only. */
  day: (date?: string) => api.get<NutritionDay>('/nutrition/day' + qs({ date })),

  meal: (id: string) => api.get<Meal>(`/meals/${id}`),
  deleteMeal: (id: string) => api.del<Meal>(`/meals/${id}`),

  updateItem: (id: string, body: MealItemPatch) =>
    api.patch<MealItem>(`/meal-items/${id}`, body),
  deleteItem: (id: string) => api.del<MealItem>(`/meal-items/${id}`),

  /* ----------------------------------------------- H-16 · categories */

  categories: () => api.get<MealCategory[]>('/meal-categories'),
  createCategory: (body: MealCategoryIn) =>
    api.post<MealCategory>('/meal-categories', body),
  updateCategory: (id: string, body: MealCategoryPatch) =>
    api.patch<MealCategory>(`/meal-categories/${id}`, body),
  reorderCategories: (body: CategoryOrderIn) =>
    api.post<MealCategory[]>('/meal-categories/reorder', body),
  deleteCategory: (id: string) => api.del<MealCategory>(`/meal-categories/${id}`),

  /* -------------------------------------------------- H-11 · recipes */

  recipes: () => api.get<Recipe[]>('/recipes'),
  recipe: (id: string) => api.get<Recipe>(`/recipes/${id}`),
  createRecipe: (body: RecipeIn) => api.post<Recipe>('/recipes', body),
  updateRecipe: (id: string, body: RecipePatch) =>
    api.patch<Recipe>(`/recipes/${id}`, body),
  deleteRecipe: (id: string) => api.del<Recipe>(`/recipes/${id}`),

  /* ----------------------------------------------------- H-12 · copy */

  copyMeal: (id: string, body: MealCopyIn) =>
    api.post<Meal>(`/meals/${id}/copy`, body),
  copyDay: (body: DayCopyIn) => api.post<Meal[]>('/nutrition/day/copy', body),

  /**
   * Logging is NOT here.
   *
   * A meal is an offline write and goes through the outbox, exactly as a set
   * does — see `features/nutrition/logMeal.ts`. Putting a direct `POST /meals`
   * next to these reads is how someone reaches past the queue and loses a meal
   * logged on the train.
   */
};

export type { MealIn, RecipeLogIn };
