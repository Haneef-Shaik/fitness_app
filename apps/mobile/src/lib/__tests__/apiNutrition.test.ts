/**
 * The nutrition API surface — the URLs, and only the URLs.
 *
 * Every screen test mocks this module, so nothing else ever exercises the
 * string that actually goes on the wire. A path typo here is invisible until a
 * device is in someone's hand, which is exactly the class of bug G4 spent a day
 * finding.
 */
import { nutritionApi } from '../api-nutrition';
import { api } from '../api';

jest.mock('../api', () => ({
  api: {
    get: jest.fn(() => Promise.resolve({})),
    getPaged: jest.fn(() => Promise.resolve({ data: [], meta: {} })),
    post: jest.fn(() => Promise.resolve({})),
    patch: jest.fn(() => Promise.resolve({})),
    del: jest.fn(() => Promise.resolve({})),
  },
}));

const mockApi = api as jest.Mocked<typeof api>;

beforeEach(() => jest.clearAllMocks());

describe('query strings', () => {
  it('omits a parameter that was not given rather than sending an empty one', async () => {
    await nutritionApi.day();
    // `?date=` is not the same request as no date: the server resolves "today"
    // from the profile (I7) and an empty string is a 422.
    expect(mockApi.get).toHaveBeenCalledWith('/nutrition/day');

    await nutritionApi.day('2026-09-23');
    expect(mockApi.get).toHaveBeenCalledWith('/nutrition/day?date=2026-09-23');
  });

  it('encodes a search term instead of splicing it in raw', async () => {
    await nutritionApi.foods('chicken & rice');
    expect(mockApi.getPaged).toHaveBeenCalledWith(
      '/foods?q=chicken%20%26%20rice&limit=25',
    );
  });

  it('still sends the limit when there is no search term', async () => {
    await nutritionApi.foods();
    expect(mockApi.getPaged).toHaveBeenCalledWith('/foods?limit=25');
  });
});

describe('paths', () => {
  it('addresses foods, meals and items where the server put them', async () => {
    await nutritionApi.meal('m1');
    await nutritionApi.deleteMeal('m1');
    await nutritionApi.updateItem('i1', { confirmed: true });
    await nutritionApi.deleteItem('i1');
    await nutritionApi.updateFood('f1', { calories: 1 });
    await nutritionApi.deleteFood('f1');

    expect(mockApi.get).toHaveBeenCalledWith('/meals/m1');
    expect(mockApi.del).toHaveBeenCalledWith('/meals/m1');
    expect(mockApi.patch).toHaveBeenCalledWith('/meal-items/i1', { confirmed: true });
    expect(mockApi.del).toHaveBeenCalledWith('/meal-items/i1');
    expect(mockApi.patch).toHaveBeenCalledWith('/foods/f1', { calories: 1 });
    expect(mockApi.del).toHaveBeenCalledWith('/foods/f1');
  });

  it('addresses categories, including the reorder collection route', async () => {
    await nutritionApi.categories();
    await nutritionApi.createCategory({ name: 'Pre-workout', default_time: null });
    await nutritionApi.updateCategory('c1', { hidden: true });
    await nutritionApi.reorderCategories({ ids: ['c2', 'c1'] });
    await nutritionApi.deleteCategory('c1');

    expect(mockApi.get).toHaveBeenCalledWith('/meal-categories');
    expect(mockApi.post).toHaveBeenCalledWith('/meal-categories', {
      name: 'Pre-workout', default_time: null,
    });
    expect(mockApi.patch).toHaveBeenCalledWith('/meal-categories/c1', { hidden: true });
    // A collection route, not `/meal-categories/reorder/{id}` — reordering is
    // one operation over the whole list, which is why partial lists are refused.
    expect(mockApi.post).toHaveBeenCalledWith('/meal-categories/reorder', {
      ids: ['c2', 'c1'],
    });
    expect(mockApi.del).toHaveBeenCalledWith('/meal-categories/c1');
  });

  it('addresses recipes and the copy routes', async () => {
    await nutritionApi.recipes();
    await nutritionApi.recipe('r1');
    await nutritionApi.createRecipe({ name: 'Oats', servings: 1, notes: null, items: [] });
    await nutritionApi.updateRecipe('r1', { servings: 2 });
    await nutritionApi.deleteRecipe('r1');
    await nutritionApi.copyMeal('m1', { to_date: '2026-09-24', meal_type: 'lunch', client_id: null });
    await nutritionApi.copyDay({ from_date: '2026-09-23', to_date: '2026-09-24' });

    expect(mockApi.get).toHaveBeenCalledWith('/recipes');
    expect(mockApi.get).toHaveBeenCalledWith('/recipes/r1');
    expect(mockApi.patch).toHaveBeenCalledWith('/recipes/r1', { servings: 2 });
    expect(mockApi.del).toHaveBeenCalledWith('/recipes/r1');
    expect(mockApi.post).toHaveBeenCalledWith('/meals/m1/copy', {
      to_date: '2026-09-24', meal_type: 'lunch', client_id: null,
    });
    expect(mockApi.post).toHaveBeenCalledWith('/nutrition/day/copy', {
      from_date: '2026-09-23', to_date: '2026-09-24',
    });
  });

  it('has no route that posts a meal directly', () => {
    // Logging goes through the outbox. A `POST /meals` here is how someone
    // reaches past the queue and loses a meal logged on the train.
    expect(Object.keys(nutritionApi)).not.toContain('createMeal');
    expect(Object.keys(nutritionApi)).not.toContain('logMeal');
    // And the recipe log is likewise absent — it is queued in logMeal.ts.
    expect(Object.keys(nutritionApi)).not.toContain('logRecipe');
  });
});
