/**
 * H-16, H-11 and H-12 — the three screens that manage nutrition rather than log it.
 *
 * What is asserted here is the *sentences*, not the layout. Each one is load
 * bearing:
 *
 *   H-16 refuses a delete and repeats the server's reason. A screen that
 *        swallowed the 409 would look like the button did nothing.
 *   H-11 states that editing a recipe does not move a meal already logged.
 *        Without it, "I fixed the recipe and last Tuesday changed" is the bug
 *        report, and the answer is that it did not.
 *   H-12 states that a copy arrives confirmed. Copying a day of unreviewed
 *        estimates and finding them counted is a surprise, so it is said first.
 */
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  router: {
    push: (...a: unknown[]) => mockPush(...a),
    replace: jest.fn(),
    back: jest.fn(),
  },
  useLocalSearchParams: () => mockParams,
}));

let mockParams: Record<string, string> = {};

const q = (data: unknown) => ({
  data, isPending: false, isError: false, error: null, refetch: jest.fn(),
});

const mutation = (impl?: (...a: never[]) => Promise<unknown>) => ({
  mutate: jest.fn(),
  mutateAsync: jest.fn(impl ?? (() => Promise.resolve({}))),
  isPending: false,
});

const CATEGORIES = [
  { id: 'c1', slug: 'breakfast', name: 'Breakfast', sort_order: 0, default_time: '08:00', hidden: false, is_default: true },
  { id: 'c2', slug: 'lunch', name: 'Lunch', sort_order: 1, default_time: null, hidden: false, is_default: true },
  { id: 'c3', slug: 'pre-workout', name: 'Pre-workout', sort_order: 2, default_time: null, hidden: true, is_default: false },
];

const RECIPE = {
  id: 'r1', name: 'Morning oats', servings: 2, notes: null,
  items: [{
    id: 'ri1', food_id: 'f1', display_name: 'Oats',
    quantity_grams: 100, calories: 380, protein_g: 13, carbs_g: 67, fat_g: 7,
  }],
  per_serving: { calories: 190, protein_g: 6.5, carbs_g: 33.5, fat_g: 3.5 },
};

const mocks = {
  categories: q(CATEGORIES),
  recipes: q([RECIPE]),
  recipe: q(RECIPE),
  deleteCategory: mutation(),
  updateCategory: mutation(),
  reorderCategories: mutation(),
  createCategory: mutation(),
  logRecipe: mutation(),
  updateRecipe: mutation(),
  deleteRecipe: mutation(),
  copyMeal: mutation(),
  copyDay: mutation(),
};

jest.mock('@/lib/query/hooks', () => ({
  useMealCategories: () => mocks.categories,
  useCreateMealCategory: () => mocks.createCategory,
  useUpdateMealCategory: () => mocks.updateCategory,
  useReorderMealCategories: () => mocks.reorderCategories,
  useDeleteMealCategory: () => mocks.deleteCategory,
  useRecipes: () => mocks.recipes,
  useRecipe: () => mocks.recipe,
  useCreateRecipe: () => mutation(),
  useUpdateRecipe: () => mocks.updateRecipe,
  useDeleteRecipe: () => mocks.deleteRecipe,
  useLogRecipe: () => mocks.logRecipe,
  useCopyMeal: () => mocks.copyMeal,
  useCopyDay: () => mocks.copyDay,
  useFoods: () => q({ data: [], meta: { filtered: false } }),
}));

import Categories from '../nutrition/categories';
import RecipesList from '../nutrition/recipes/index';
import RecipeDetail from '../nutrition/recipes/[id]';
import Copy from '../nutrition/copy';

beforeEach(() => {
  jest.clearAllMocks();
  mockParams = {};
  mocks.categories = q(CATEGORIES);
  mocks.recipes = q([RECIPE]);
  mocks.recipe = q(RECIPE);
  mocks.deleteCategory = mutation();
  mocks.updateCategory = mutation();
  mocks.reorderCategories = mutation();
  mocks.logRecipe = mutation();
  mocks.copyMeal = mutation();
  mocks.copyDay = mutation();
});

describe('H-16 · the category manager', () => {
  it('shows every category, hidden ones included', () => {
    render(<Categories />);
    // The manager has to show what it would be un-hiding.
    expect(screen.getByTestId('category-pre-workout-name').props.value).toBe('Pre-workout');
    expect(screen.getByText('Hidden')).toBeTruthy();
  });

  it('offers Show rather than Hide for a hidden one', () => {
    render(<Categories />);
    expect(screen.getByTestId('category-pre-workout-hide').props.accessibilityLabel).toBe('Show');
    expect(screen.getByTestId('category-lunch-hide').props.accessibilityLabel).toBe('Hide');
  });

  it("repeats the server's reason when a delete is refused", async () => {
    mocks.deleteCategory = mutation(() =>
      Promise.reject(new Error('Dinner has 3 meals in it. Hide it instead — the meals keep their label.')),
    );
    render(<Categories />);

    fireEvent.press(screen.getByTestId('category-lunch-delete'));

    // Swallowing the 409 would make the button look broken.
    await waitFor(() => expect(screen.getByTestId('category-error')).toBeTruthy());
    expect(screen.getByTestId('category-error').props.children).toContain('Hide it instead');
  });

  it('reorders by sending EVERY id, in the new order', async () => {
    render(<Categories />);

    fireEvent.press(screen.getByTestId('category-lunch-up'));

    await waitFor(() => expect(mocks.reorderCategories.mutateAsync).toHaveBeenCalled());
    // A partial list is refused by the server; sending one would be the bug.
    expect(mocks.reorderCategories.mutateAsync).toHaveBeenCalledWith(['c2', 'c1', 'c3']);
  });

  it('cannot move the first one up or the last one down', () => {
    render(<Categories />);
    expect(screen.getByTestId('category-breakfast-up').props.accessibilityState.disabled).toBe(true);
    expect(screen.getByTestId('category-pre-workout-down').props.accessibilityState.disabled).toBe(true);
  });

  it('renames on blur and does not touch the slug', () => {
    render(<Categories />);
    const field = screen.getByTestId('category-lunch-name');

    fireEvent.changeText(field, 'Midday');
    fireEvent(field, 'blur');

    expect(mocks.updateCategory.mutate).toHaveBeenCalledWith({
      id: 'c2', body: { name: 'Midday' },
    });
  });

  it('does not fire a rename when the name is unchanged', () => {
    render(<Categories />);
    fireEvent(screen.getByTestId('category-lunch-name'), 'blur');
    expect(mocks.updateCategory.mutate).not.toHaveBeenCalled();
  });
});

describe('H-11 · recipes', () => {
  it('reports calories PER SERVING, not per batch', () => {
    render(<RecipesList />);
    // 380 kcal of oats over 2 servings. Showing 380 here would read as one meal.
    expect(screen.getByText('190 kcal')).toBeTruthy();
    expect(screen.getByText('per serving')).toBeTruthy();
  });

  it('offers to create one when there are none, rather than showing nothing', () => {
    mocks.recipes = q([]);
    render(<RecipesList />);
    expect(screen.getByText('No recipes yet')).toBeTruthy();
  });

  it('says that editing a recipe does not move a meal already logged', () => {
    mockParams = { id: 'r1' };
    render(<RecipeDetail />);
    expect(
      screen.getByText(/Meals already\s+logged from it keep the numbers they had/),
    ).toBeTruthy();
  });

  it('scales the preview by the servings being logged', () => {
    mockParams = { id: 'r1' };
    render(<RecipeDetail />);

    fireEvent.changeText(screen.getByTestId('recipe-log-servings'), '2');

    expect(screen.getByText('380')).toBeTruthy();
  });

  it('logs through the outbox-backed hook with the chosen servings', async () => {
    mockParams = { id: 'r1' };
    render(<RecipeDetail />);

    fireEvent.changeText(screen.getByTestId('recipe-log-servings'), '1.5');
    fireEvent.press(screen.getByTestId('recipe-log'));

    await waitFor(() => expect(mocks.logRecipe.mutateAsync).toHaveBeenCalled());
    expect(mocks.logRecipe.mutateAsync).toHaveBeenCalledWith({
      id: 'r1', body: { meal_type: 'breakfast', servings: 1.5 },
    });
  });

  it('only offers categories that are not hidden', () => {
    mockParams = { id: 'r1' };
    render(<RecipeDetail />);
    expect(screen.getByTestId('recipe-meal-type-breakfast')).toBeTruthy();
    expect(screen.queryByTestId('recipe-meal-type-pre-workout')).toBeNull();
  });
});

describe('H-12 · copying', () => {
  it('says a copy arrives confirmed before anything is copied', () => {
    mockParams = { meal: 'm1' };
    render(<Copy />);
    expect(
      screen.getByText(/anything that was an unreviewed\s+estimate arrives confirmed/),
    ).toBeTruthy();
  });

  it('copies one meal to the chosen date and category', async () => {
    mockParams = { meal: 'm1', date: '2026-09-21' };
    render(<Copy />);

    fireEvent.press(screen.getByTestId('copy-confirm'));

    await waitFor(() => expect(mocks.copyMeal.mutateAsync).toHaveBeenCalled());
    expect(mocks.copyMeal.mutateAsync).toHaveBeenCalledWith({
      id: 'm1',
      body: { to_date: '2026-09-22', meal_type: 'breakfast', client_id: null },
    });
  });

  it('defaults to the day after the one being copied, not to today', () => {
    mockParams = { date: '2026-12-31' };
    render(<Copy />);
    // Crossing a year boundary is where naive date arithmetic breaks.
    expect(screen.getByTestId('copy-to-date').props.value).toBe('2027-01-01');
  });

  it('copies a whole day when no meal was named', async () => {
    mockParams = { date: '2026-09-21' };
    render(<Copy />);

    fireEvent.press(screen.getByTestId('copy-confirm'));

    await waitFor(() => expect(mocks.copyDay.mutateAsync).toHaveBeenCalled());
    expect(mocks.copyDay.mutateAsync).toHaveBeenCalledWith({
      from_date: '2026-09-21', to_date: '2026-09-22',
    });
    expect(mocks.copyMeal.mutateAsync).not.toHaveBeenCalled();
  });

  it("surfaces the server's refusal instead of closing as if it worked", async () => {
    mockParams = { date: '2026-09-21' };
    mocks.copyDay = mutation(() =>
      Promise.reject(new Error('There is nothing logged on that day to copy.')),
    );
    render(<Copy />);

    fireEvent.press(screen.getByTestId('copy-confirm'));

    await waitFor(() => expect(screen.getByTestId('copy-error')).toBeTruthy());
    expect(screen.getByTestId('copy-error').props.children).toContain('nothing logged');
  });

  it('does not offer a category when a whole day is being copied', () => {
    mockParams = { date: '2026-09-21' };
    render(<Copy />);
    // Every meal keeps its own; asking for one would be a lie about what happens.
    expect(screen.queryByTestId('copy-meal-type')).toBeNull();
  });
});
