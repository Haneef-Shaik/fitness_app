/**
 * The nutrition hooks (G7).
 *
 * Two rules here are *absences*, and an absence is exactly what a test has to
 * pin down because nothing else will notice it going missing:
 *
 *   Editing a **food** must not invalidate the diary. Item macros were
 *   snapshotted at write (02 §4.2), so nothing already logged moved. Refetching
 *   would imply it had.
 *
 *   Editing a **recipe** must not invalidate the diary either, for the same
 *   reason one level up. This is `program.changed` not touching sessions
 *   (AC-12), restated for nutrition.
 *
 * And one presence: logging goes through the **outbox**, never a direct POST.
 */
import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { createTestQueryClient } from '../client';
import {
  useCopyDay, useCopyMeal, useCreateFood, useCreateMealCategory, useCreateRecipe,
  useDeleteMeal, useDeleteMealItem, useDeleteMealCategory, useDeleteRecipe,
  useFoods, useLogMeal, useLogRecipe, useMeal, useMealCategories,
  useNutritionDay, useRecipe, useRecipes, useReorderMealCategories,
  useUpdateFood, useUpdateMealCategory, useUpdateMealItem, useUpdateRecipe,
} from '../hooks';
import { qk } from '../queryKeys';
import { nutritionApi } from '../../api-nutrition';
import { queueMeal, queueRecipeLog } from '../../../features/nutrition/logMeal';

jest.mock('../../api-nutrition', () => ({
  nutritionApi: {
    day: jest.fn(), meal: jest.fn(), foods: jest.fn(),
    createFood: jest.fn(), updateFood: jest.fn(), deleteFood: jest.fn(),
    updateItem: jest.fn(), deleteItem: jest.fn(), deleteMeal: jest.fn(),
    categories: jest.fn(), createCategory: jest.fn(), updateCategory: jest.fn(),
    reorderCategories: jest.fn(), deleteCategory: jest.fn(),
    recipes: jest.fn(), recipe: jest.fn(), createRecipe: jest.fn(),
    updateRecipe: jest.fn(), deleteRecipe: jest.fn(),
    copyMeal: jest.fn(), copyDay: jest.fn(),
  },
}));

jest.mock('../../../features/nutrition/logMeal', () => ({
  queueMeal: jest.fn(() => Promise.resolve({ clientId: 'c1', idempotencyKey: 'k1' })),
  queueRecipeLog: jest.fn(() => Promise.resolve({ clientId: 'c2', idempotencyKey: 'k2' })),
}));

const api = nutritionApi as jest.Mocked<typeof nutritionApi>;
const mockQueueMeal = queueMeal as jest.MockedFunction<typeof queueMeal>;
const mockQueueRecipe = queueRecipeLog as jest.MockedFunction<typeof queueRecipeLog>;

const live: ReturnType<typeof createTestQueryClient>[] = [];

function harness() {
  const client = createTestQueryClient();
  live.push(client);
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { client, wrapper };
}

beforeEach(() => jest.clearAllMocks());

afterEach(() => {
  for (const c of live.splice(0)) {
    c.cancelQueries();
    c.unmount();
    c.clear();
  }
});

/** Seeds a cache entry so its staleness after a mutation is observable. */
const seed = (client: ReturnType<typeof createTestQueryClient>, key: readonly unknown[]) =>
  client.setQueryData(key as unknown[], { seeded: true });

const staleness = (client: ReturnType<typeof createTestQueryClient>, key: readonly unknown[]) =>
  client.getQueryState(key as unknown[])?.isInvalidated ?? false;

describe('reads', () => {
  it('keys the diary by LOCAL date, and by "today" when none is given', async () => {
    const { client, wrapper } = harness();
    api.day.mockResolvedValue({ local_date: '2026-09-23' } as never);

    const { result } = renderHook(() => useNutritionDay('2026-09-23'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.getQueryData(qk.nutritionDay('2026-09-23'))).toBeTruthy();

    const { result: today } = renderHook(() => useNutritionDay(), { wrapper });
    await waitFor(() => expect(today.current.isSuccess).toBe(true));
    // The client never decides which day it is (I7) — it asks for the server's.
    expect(client.getQueryData(qk.nutritionDay('today'))).toBeTruthy();
    expect(api.day).toHaveBeenLastCalledWith(undefined);
  });

  it('caches categories and recipes under their registry keys', async () => {
    const { client, wrapper } = harness();
    api.categories.mockResolvedValue([{ id: 'c1' }] as never);
    api.recipes.mockResolvedValue([{ id: 'r1' }] as never);

    const cats = renderHook(() => useMealCategories(), { wrapper });
    const recs = renderHook(() => useRecipes(), { wrapper });
    await waitFor(() => expect(cats.result.current.isSuccess).toBe(true));
    await waitFor(() => expect(recs.result.current.isSuccess).toBe(true));

    expect(client.getQueryData(qk.mealCategories())).toEqual([{ id: 'c1' }]);
    expect(client.getQueryData(qk.recipes())).toEqual([{ id: 'r1' }]);
  });

  it('does not fetch one meal or recipe until it has an id', () => {
    const { wrapper } = harness();
    renderHook(() => useMeal(''), { wrapper });
    expect(api.meal).not.toHaveBeenCalled();
  });

  it('caches a food search under the query it was made with', async () => {
    const { client, wrapper } = harness();
    api.foods.mockResolvedValue({ data: [{ id: 'f1' }], meta: {} } as never);

    const { result } = renderHook(() => useFoods('oat'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Two searches are two queries, not one refetched — which is what keeps the
    // previous result on screen while a new one loads.
    expect(client.getQueryData(qk.foods('oat'))).toBeTruthy();
    expect(client.getQueryData(qk.foods('rice'))).toBeUndefined();
  });

  it('fetches one meal and one recipe under their detail keys', async () => {
    const { client, wrapper } = harness();
    api.meal.mockResolvedValue({ id: 'm1' } as never);
    api.recipe.mockResolvedValue({ id: 'r1' } as never);

    const m = renderHook(() => useMeal('m1'), { wrapper });
    const r = renderHook(() => useRecipe('r1'), { wrapper });
    await waitFor(() => expect(m.result.current.isSuccess).toBe(true));
    await waitFor(() => expect(r.result.current.isSuccess).toBe(true));

    expect(client.getQueryData(qk.meal('m1'))).toEqual({ id: 'm1' });
    expect(client.getQueryData(qk.recipe('r1'))).toEqual({ id: 'r1' });
  });

  it('does not fetch one recipe until it has an id', () => {
    const { wrapper } = harness();
    renderHook(() => useRecipe(''), { wrapper });
    expect(api.recipe).not.toHaveBeenCalled();
  });
});

describe('logging goes through the outbox', () => {
  it('a meal is queued, not posted', async () => {
    const { wrapper } = harness();
    const { result } = renderHook(() => useLogMeal(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ meal_type: 'lunch', items: [] } as never);
    });

    expect(mockQueueMeal).toHaveBeenCalledTimes(1);
  });

  it('a recipe is queued too — it is still logging a meal', async () => {
    const { wrapper } = harness();
    const { result } = renderHook(() => useLogRecipe(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        id: 'r1', body: { meal_type: 'breakfast', servings: 2 },
      });
    });

    expect(mockQueueRecipe).toHaveBeenCalledWith('r1', {
      meal_type: 'breakfast', servings: 2,
    });
  });

  it('logging marks the diary stale so the server replaces the local guess', async () => {
    const { client, wrapper } = harness();
    seed(client, qk.nutritionDay('today'));

    const { result } = renderHook(() => useLogMeal(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({ meal_type: 'lunch', items: [] } as never);
    });

    expect(staleness(client, qk.nutritionDay('today'))).toBe(true);
  });
});

describe('the invalidations that are deliberately absent', () => {
  it('editing a FOOD leaves the diary alone', async () => {
    const { client, wrapper } = harness();
    seed(client, qk.nutritionDay('today'));
    seed(client, qk.foods('oat'));
    api.updateFood.mockResolvedValue({ id: 'f1' } as never);

    const { result } = renderHook(() => useUpdateFood(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({ id: 'f1', body: { calories: 400 } });
    });

    expect(staleness(client, qk.foods('oat'))).toBe(true);
    // Item macros were snapshotted. Nothing already logged moved.
    expect(staleness(client, qk.nutritionDay('today'))).toBe(false);
  });

  it('editing a RECIPE leaves the diary alone', async () => {
    const { client, wrapper } = harness();
    seed(client, qk.nutritionDay('today'));
    seed(client, qk.recipes());
    seed(client, qk.recipe('r1'));
    api.updateRecipe.mockResolvedValue({ id: 'r1' } as never);

    const { result } = renderHook(() => useUpdateRecipe(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({ id: 'r1', body: { servings: 4 } });
    });

    expect(staleness(client, qk.recipes())).toBe(true);
    expect(staleness(client, qk.recipe('r1'))).toBe(true);
    // AC-12's shape, one level up: the plan changed, the record did not.
    expect(staleness(client, qk.nutritionDay('today'))).toBe(false);
  });
});

describe('item and meal edits all reach the diary', () => {
  it('confirming, deleting an item and deleting a meal each invalidate it', async () => {
    const { client, wrapper } = harness();
    api.updateItem.mockResolvedValue({ id: 'i1' } as never);
    api.deleteItem.mockResolvedValue({ id: 'i1' } as never);
    api.deleteMeal.mockResolvedValue({ id: 'm1' } as never);

    const confirm = renderHook(() => useUpdateMealItem(), { wrapper });
    const dropItem = renderHook(() => useDeleteMealItem(), { wrapper });
    const dropMeal = renderHook(() => useDeleteMeal(), { wrapper });

    for (const run of [
      () => confirm.result.current.mutateAsync({ id: 'i1', body: { confirmed: true } }),
      () => dropItem.result.current.mutateAsync('i1'),
      () => dropMeal.result.current.mutateAsync('m1'),
    ]) {
      seed(client, qk.nutritionDay('today'));
      await act(async () => { await run(); });
      // Confirming an item moves a total. So does removing one. So does
      // removing the meal. All three are the same fact changing.
      expect(staleness(client, qk.nutritionDay('today'))).toBe(true);
    }
  });

  it('creating a food touches the picker and not the diary', async () => {
    const { client, wrapper } = harness();
    seed(client, qk.nutritionDay('today'));
    seed(client, qk.foods('oat'));
    api.createFood.mockResolvedValue({ id: 'f9' } as never);

    const { result } = renderHook(() => useCreateFood(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({ name: 'Oats' } as never);
    });

    expect(staleness(client, qk.foods('oat'))).toBe(true);
    expect(staleness(client, qk.nutritionDay('today'))).toBe(false);
  });

  it('creating and deleting a recipe touch the recipe list only', async () => {
    const { client, wrapper } = harness();
    api.createRecipe.mockResolvedValue({ id: 'r9' } as never);
    api.deleteRecipe.mockResolvedValue({ id: 'r9' } as never);

    const create = renderHook(() => useCreateRecipe(), { wrapper });
    const remove = renderHook(() => useDeleteRecipe(), { wrapper });

    for (const run of [
      () => create.result.current.mutateAsync({
        name: 'Oats', servings: 1, notes: null, items: [],
      }),
      () => remove.result.current.mutateAsync('r9'),
    ]) {
      seed(client, qk.nutritionDay('today'));
      seed(client, qk.recipes());
      await act(async () => { await run(); });
      expect(staleness(client, qk.recipes())).toBe(true);
      expect(staleness(client, qk.nutritionDay('today'))).toBe(false);
    }
  });
});

describe('categories', () => {
  it('a rename reaches the diary, because the diary renders the NAME', async () => {
    const { client, wrapper } = harness();
    seed(client, qk.nutritionDay('today'));
    seed(client, qk.mealCategories());
    api.updateCategory.mockResolvedValue({ id: 'c1' } as never);

    const { result } = renderHook(() => useUpdateMealCategory(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({ id: 'c1', body: { name: 'Midday' } });
    });

    expect(staleness(client, qk.mealCategories())).toBe(true);
    expect(staleness(client, qk.nutritionDay('today'))).toBe(true);
  });

  it('creating, reordering and deleting all invalidate the same way', async () => {
    const { client, wrapper } = harness();
    api.createCategory.mockResolvedValue({ id: 'c9' } as never);
    api.reorderCategories.mockResolvedValue([] as never);
    api.deleteCategory.mockResolvedValue({ id: 'c9' } as never);

    const create = renderHook(() => useCreateMealCategory(), { wrapper });
    const reorder = renderHook(() => useReorderMealCategories(), { wrapper });
    const remove = renderHook(() => useDeleteMealCategory(), { wrapper });

    seed(client, qk.mealCategories());
    await act(async () => {
      await create.result.current.mutateAsync({ name: 'Pre-workout', default_time: null });
    });
    expect(staleness(client, qk.mealCategories())).toBe(true);

    seed(client, qk.mealCategories());
    await act(async () => { await reorder.result.current.mutateAsync(['c1', 'c2']); });
    expect(api.reorderCategories).toHaveBeenCalledWith({ ids: ['c1', 'c2'] });
    expect(staleness(client, qk.mealCategories())).toBe(true);

    seed(client, qk.mealCategories());
    await act(async () => { await remove.result.current.mutateAsync('c9'); });
    expect(staleness(client, qk.mealCategories())).toBe(true);
  });

  it('a refused delete rejects rather than resolving quietly', async () => {
    const { wrapper } = harness();
    api.deleteCategory.mockRejectedValue(new Error('Hide it instead'));

    const { result } = renderHook(() => useDeleteMealCategory(), { wrapper });
    await expect(
      act(async () => { await result.current.mutateAsync('c1'); }),
    ).rejects.toThrow('Hide it instead');
  });
});

describe('copying', () => {
  it('goes straight to the API — it reads a day the client may not hold', async () => {
    const { client, wrapper } = harness();
    seed(client, qk.nutritionDay('today'));
    api.copyMeal.mockResolvedValue({ id: 'm2' } as never);

    const { result } = renderHook(() => useCopyMeal(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({
        id: 'm1', body: { to_date: '2026-09-24', meal_type: 'lunch', client_id: null },
      });
    });

    expect(api.copyMeal).toHaveBeenCalledWith('m1', {
      to_date: '2026-09-24', meal_type: 'lunch', client_id: null,
    });
    expect(mockQueueMeal).not.toHaveBeenCalled();
    expect(staleness(client, qk.nutritionDay('today'))).toBe(true);
  });

  it('copying a day invalidates the diary as well', async () => {
    const { client, wrapper } = harness();
    seed(client, qk.nutritionDay('2026-09-24'));
    api.copyDay.mockResolvedValue([] as never);

    const { result } = renderHook(() => useCopyDay(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({ from_date: '2026-09-23', to_date: '2026-09-24' });
    });

    expect(staleness(client, qk.nutritionDay('2026-09-24'))).toBe(true);
  });
});
