/**
 * The logging surface: H-01, H-02, H-03/04, H-05, H-13 — and H-11's editor.
 *
 * **H-01 is AC-07's surface.** What is asserted is the rule the whole domain
 * exists to protect: a pending item is VISIBLE and in NO total. Counting it
 * "just for the preview" and hiding it are both wrong, and only a test
 * distinguishes the correct middle from either.
 *
 * The second theme here is that nothing on these screens computes a macro. The
 * server snapshots; the screen renders. A number derived twice is a number that
 * can disagree with itself.
 */
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { ScrollView } from 'react-native';

const mockPush = jest.fn();
const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  router: {
    push: (...a: unknown[]) => mockPush(...a),
    replace: (...a: unknown[]) => mockReplace(...a),
    back: jest.fn(),
  },
  useLocalSearchParams: () => mockParams,
}));

let mockParams: Record<string, string> = {};

const q = (data: unknown, over: Record<string, unknown> = {}) => ({
  data, isPending: false, isError: false, error: null, refetch: jest.fn(), ...over,
});

// `mutateAsync` is typed to take one argument so `mock.calls[0][0]` is reachable:
// a bare `jest.fn(() => …)` infers an empty tuple and TypeScript refuses the index.
const mutation = () => ({
  mutate: jest.fn(),
  mutateAsync: jest.fn((_body?: unknown) => Promise.resolve({ id: 'x' })),
  isPending: false,
});

const OATS = {
  id: 'f1', name: 'Oats', brand: null, calories: 380, protein_g: 13,
  carbs_g: 67, fat_g: 7, fiber_g: null, serving_grams: 40,
  serving_label: '1 scoop', source: 'internal', is_custom: false,
};

const CONFIRMED = {
  id: 'i1', food_id: 'f1', display_name: 'Oats', quantity_grams: 100,
  calories: 380, protein_g: 13, carbs_g: 67, fat_g: 7, fiber_g: null,
  confirmed: true, user_corrected: false, source: 'manual',
};
const PENDING = { ...CONFIRMED, id: 'i2', display_name: 'Curry', calories: 999, confirmed: false, source: 'text_ai' };

const MEAL = {
  id: 'm1', meal_type: 'lunch', consumed_at: '2026-09-23T12:00:00Z',
  local_date: '2026-09-23', logged_timezone: 'UTC', notes: null,
  items: [CONFIRMED, PENDING],
};

const DAY = {
  local_date: '2026-09-23',
  calories: 380, protein_g: 13, carbs_g: 67, fat_g: 7,
  // The server counted the confirmed item only, and says one is waiting.
  pending_count: 1, incomplete: false,
  meals: [MEAL],
};

const CATEGORIES = [
  { id: 'c1', slug: 'breakfast', name: 'Breakfast', sort_order: 0, default_time: null, hidden: false, is_default: true },
  { id: 'c2', slug: 'lunch', name: 'Midday', sort_order: 1, default_time: null, hidden: false, is_default: true },
];

const mocks = {
  day: q(DAY),
  meal: q(MEAL),
  foods: q({ data: [OATS], meta: { filtered: false } }),
  profile: q({ daily_calorie_target: 2000 }),
  categories: q(CATEGORIES),
  log: mutation(),
  updateItem: mutation(),
  deleteMeal: mutation(),
  createRecipe: mutation(),
};

jest.mock('@/lib/query/hooks', () => ({
  useNutritionDay: () => mocks.day,
  useMeal: () => mocks.meal,
  useFoods: () => mocks.foods,
  useFood: () => q(OATS),
  useProfile: () => mocks.profile,
  useMealCategories: () => mocks.categories,
  useLogMeal: () => mocks.log,
  useUpdateMealItem: () => mocks.updateItem,
  useDeleteMealItem: () => mutation(),
  useDeleteMeal: () => mocks.deleteMeal,
  useCreateRecipe: () => mocks.createRecipe,
}));

import Diary from '../nutrition/index';
import MealDetail from '../nutrition/meal/[id]';
import AddFood from '../nutrition/add';
import FoodDetail from '../nutrition/food/[id]';
import QuickAdd from '../nutrition/quick-add';
import NewRecipe from '../nutrition/recipes/new';

beforeEach(() => {
  jest.clearAllMocks();
  mockParams = { id: 'f1' };
  mocks.day = q(DAY);
  mocks.meal = q(MEAL);
  mocks.foods = q({ data: [OATS], meta: { filtered: false } });
  mocks.profile = q({ daily_calorie_target: 2000 });
  mocks.categories = q(CATEGORIES);
  mocks.log = mutation();
  mocks.updateItem = mutation();
  mocks.createRecipe = mutation();
});

describe('H-01 · the diary is AC-07 on screen', () => {
  it('shows the confirmed total and says a pending item is NOT in it', () => {
    render(<Diary />);

    // The hero figure and the meal row both read 380 — the day is one meal.
    expect(screen.getAllByText('380')).toHaveLength(2);
    // Visible, and excluded. Both halves matter (I2 / D5 / I12).
    expect(screen.getByText(/1 item waiting to be\s+confirmed — not counted yet/)).toBeTruthy();
    // 1,379 would be the pending item leaking into the day.
    expect(screen.queryByText('1,379')).toBeNull();
  });

  it('draws the remaining meter against the profile target', () => {
    render(<Diary />);
    expect(screen.getByTestId('calorie-meter')).toBeTruthy();
    expect(screen.getByText('1,620 left')).toBeTruthy();
  });

  it('uses the target in force on the day shown, not only the profile (Q8)', () => {
    mocks.day = q({ ...DAY, targets: { calories: 1500, protein_g: null, carbs_g: null, fat_g: null } });
    render(<Diary />);
    expect(screen.getByText('1,120 left')).toBeTruthy();
  });

  it('draws no meter at all when no target is set', () => {
    mocks.profile = q({ daily_calorie_target: null });
    render(<Diary />);
    // A meter with no target would have to invent one.
    expect(screen.queryByTestId('calorie-meter')).toBeNull();
  });

  it('labels a meal by its CATEGORY NAME, not its slug', () => {
    render(<Diary />);
    // The category was renamed to "Midday"; the meal still says lunch.
    expect(screen.getByText('Midday')).toBeTruthy();
    expect(screen.queryByText('Lunch')).toBeNull();
  });

  it('offers a first meal rather than an empty screen', () => {
    mocks.day = q({ ...DAY, meals: [], calories: 0, pending_count: 0 });
    render(<Diary />);
    expect(screen.getByText('Nothing logged today')).toBeTruthy();
    // I13 — an empty diary offers the way out of being empty.
    expect(screen.getByLabelText('Add food')).toBeTruthy();
  });

  it('leads to H-14, the analytics over a range (G10)', () => {
    render(<Diary />);
    fireEvent.press(screen.getByTestId('go-nutrition-analytics'));
    expect(mockPush).toHaveBeenCalledWith('/nutrition/analytics');
  });

  it('hides "copy this day" when there is nothing to copy', () => {
    mocks.day = q({ ...DAY, meals: [] });
    render(<Diary />);
    expect(screen.queryByTestId('go-copy-day')).toBeNull();
  });

  it('warns when a counted item was missing macros', () => {
    mocks.day = q({ ...DAY, incomplete: true });
    render(<Diary />);
    expect(screen.getByText(/this total is a floor/)).toBeTruthy();
  });
});

describe('H-02 · the meal', () => {
  it('totals the confirmed items only, and marks the other as not counted', () => {
    mockParams = { id: 'm1' };
    render(<MealDetail />);

    // The hero total and the confirmed item's own figure.
    expect(screen.getAllByText('380')).toHaveLength(2);
    expect(screen.getByText('not counted')).toBeTruthy();
    // The pending 999 is rendered as the item's own number and in no total.
    expect(screen.getByText('999')).toBeTruthy();
    expect(screen.getByText(/1 item not counted until\s+confirmed/)).toBeTruthy();
  });

  it('confirming an item sends only `confirmed`, so it is not a correction', () => {
    mockParams = { id: 'm1' };
    render(<MealDetail />);

    fireEvent.press(screen.getByLabelText('Confirm'));

    // Anything else in this body would set `user_corrected` server-side (I12).
    expect(mocks.updateItem.mutate).toHaveBeenCalledWith({
      id: 'i2', body: { confirmed: true },
    });
  });
});

describe('H-03 / H-04 · finding a food', () => {
  it('offers to create what was typed when nothing matches', () => {
    mocks.foods = q({ data: [], meta: { filtered: true } });
    render(<AddFood />);

    fireEvent.changeText(screen.getByTestId('food-search'), 'Nana bread');

    // I13 — filtered-empty is not empty, and quotes what was searched for.
    expect(screen.getByText('Nothing matches "Nana bread"')).toBeTruthy();
    expect(screen.queryByText('No foods yet')).toBeNull();
  });

  it('lists what it found', () => {
    render(<AddFood />);
    expect(screen.getByText('Oats')).toBeTruthy();
  });

  it('keeps every mode reachable however long the catalog is (G10)', () => {
    // Describe and Photograph sat BELOW the food list on a screen that did not
    // scroll: with the seeded catalog, a phone could not reach either one.
    const many = Array.from({ length: 30 }, (_, i) => ({ ...OATS, id: `f${i}`, name: `Food ${i}` }));
    mocks.foods = q({ data: many, meta: { filtered: false } });
    const { UNSAFE_getByType } = render(<AddFood />);
    expect(UNSAFE_getByType(ScrollView)).toBeTruthy();

    const order = screen.toJSON() ? JSON.stringify(screen.toJSON()) : '';
    expect(order.indexOf('go-photo')).toBeGreaterThan(-1);
    expect(order.indexOf('go-photo')).toBeLessThan(order.indexOf('Food 0'));
    expect(order.indexOf('go-describe')).toBeLessThan(order.indexOf('Food 0'));
  });
});

describe('H-05 · the portion', () => {
  it('scales the preview from the per-100 g figures', () => {
    render(<FoodDetail />);

    fireEvent.changeText(screen.getByTestId('portion-grams'), '50');

    // 380 kcal per 100 g → 190 at 50 g. Computed by @volt/domain, not here.
    expect(screen.getByText('190')).toBeTruthy();
  });

  it('logs the chosen portion through the outbox-backed hook', async () => {
    render(<FoodDetail />);
    fireEvent.changeText(screen.getByTestId('portion-grams'), '250');

    fireEvent.press(screen.getByLabelText('Add to diary'));

    await waitFor(() => expect(mocks.log.mutateAsync).toHaveBeenCalled());
    const body = mocks.log.mutateAsync.mock.calls[0]![0] as {
      meal_type: string; items: { food_id: string; quantity_grams: number }[];
    };
    expect(body.items[0]!.quantity_grams).toBe(250);
    // The client sends the food and the grams; the server does the arithmetic
    // and freezes the result. Sending macros here could disagree with the food.
    expect(body.items[0]).not.toHaveProperty('calories');
  });
});

describe('H-13 · quick add', () => {
  it('writes an item with no food behind it', async () => {
    render(<QuickAdd />);

    fireEvent.changeText(screen.getByTestId('quick-name'), 'Canteen lunch');
    fireEvent.changeText(screen.getByTestId('quick-calories'), '650');

    fireEvent.press(screen.getByLabelText('Add to diary'));

    await waitFor(() => expect(mocks.log.mutateAsync).toHaveBeenCalled());
    const body = mocks.log.mutateAsync.mock.calls[0]![0] as {
      items: { food_id: unknown; display_name: string; calories: number; confirmed: boolean }[];
    };
    expect(body.items[0]!.display_name).toBe('Canteen lunch');
    expect(body.items[0]!.calories).toBe(650);
    // Typed by a person, so it is confirmed by the act of typing it.
    expect(body.items[0]!.confirmed).toBe(true);
  });
});

describe('H-11 · building a recipe', () => {
  it('will not save one with no name or no ingredients', () => {
    render(<NewRecipe />);
    expect(screen.getByLabelText('Save recipe').props.accessibilityState.disabled).toBe(true);
  });

  it('shows the per-serving figure while the batch is being built', () => {
    render(<NewRecipe />);

    fireEvent.press(screen.getByTestId('recipe-add-f1'));
    fireEvent.changeText(screen.getByTestId('recipe-servings'), '2');

    // 100 g of oats is 380 kcal for the batch; over 2 servings that is 190.
    expect(screen.getByText('190 kcal per serving')).toBeTruthy();
  });

  it('sends ingredients with quantities and no macros of their own', async () => {
    render(<NewRecipe />);
    fireEvent.changeText(screen.getByTestId('recipe-name'), 'Morning oats');
    fireEvent.press(screen.getByTestId('recipe-add-f1'));

    fireEvent.press(screen.getByLabelText('Save recipe'));

    await waitFor(() => expect(mocks.createRecipe.mutateAsync).toHaveBeenCalled());
    const body = mocks.createRecipe.mutateAsync.mock.calls[0]![0] as {
      items: { food_id: string; quantity_grams: number; calories: null }[];
    };
    expect(body.items[0]!.food_id).toBe('f1');
    expect(body.items[0]!.quantity_grams).toBe(100);
    // A recipe is a plan: it points at the live food and holds no snapshot.
    expect(body.items[0]!.calories).toBeNull();
  });

  it('removes an ingredient without disturbing the others', () => {
    render(<NewRecipe />);
    fireEvent.press(screen.getByTestId('recipe-add-f1'));
    fireEvent.press(screen.getByTestId('recipe-add-f1'));

    fireEvent.press(screen.getByTestId('recipe-item-0-remove'));

    expect(screen.queryByTestId('recipe-item-1-remove')).toBeNull();
    expect(screen.getByTestId('recipe-item-0-remove')).toBeTruthy();
  });
});
