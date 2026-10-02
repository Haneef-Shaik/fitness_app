/**
 * The exercise catalog is read whole.
 *
 * The API serves at most 200 exercises a page (routes/exercises.py, `le=200`)
 * and the catalog is 297 and growing. A single page made everything after
 * "Machine Triceps Extension" unreachable in the library and the picker, and the plan day
 * editor — which looks names and muscles up in that list — showed Overhead
 * Press and Triceps Pushdown as "Exercise" (found taking the screenshots, 2 Oct).
 */
import { catalogApi } from '../api-catalog';
import { api } from '../api';

jest.mock('../api', () => ({ api: { get: jest.fn() } }));

const mockGet = api.get as jest.Mock;

const page = (from: number, n: number) =>
  Array.from({ length: n }, (_, i) => ({ id: `e${from + i}`, name: `Exercise ${from + i}` }));

beforeEach(() => mockGet.mockReset());

describe('catalogApi.exercises', () => {
  it('follows the pages until one comes back short', async () => {
    mockGet
      .mockResolvedValueOnce(page(0, 200))
      .mockResolvedValueOnce(page(200, 97));

    const all = await catalogApi.exercises();

    expect(all).toHaveLength(297);
    expect(all[296]).toEqual({ id: 'e296', name: 'Exercise 296' });
    expect(mockGet).toHaveBeenNthCalledWith(1, '/exercises?limit=200&offset=0');
    expect(mockGet).toHaveBeenNthCalledWith(2, '/exercises?limit=200&offset=200');
  });

  it('keeps the filter on every page', async () => {
    mockGet.mockResolvedValueOnce(page(0, 200)).mockResolvedValueOnce([]);

    await catalogApi.exercises({ muscle: 'chest' });

    expect(mockGet).toHaveBeenNthCalledWith(1, '/exercises?muscle=chest&limit=200&offset=0');
    expect(mockGet).toHaveBeenNthCalledWith(2, '/exercises?muscle=chest&limit=200&offset=200');
  });

  it('asks once when the first page is not full', async () => {
    mockGet.mockResolvedValueOnce(page(0, 12));

    const found = await catalogApi.exercises({ q: 'bench' });

    expect(found).toHaveLength(12);
    expect(mockGet).toHaveBeenCalledTimes(1);
  });

  it('stops at a ceiling rather than looping on a server that never runs short', async () => {
    mockGet.mockResolvedValue(page(0, 200));

    const all = await catalogApi.exercises();

    expect(mockGet).toHaveBeenCalledTimes(20);
    expect(all).toHaveLength(4000);
  });

  it('asks for exactly one page when the caller names one', async () => {
    mockGet.mockResolvedValueOnce(page(0, 20));

    await catalogApi.exercises({ limit: 20, offset: 40 });

    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(mockGet).toHaveBeenCalledWith('/exercises?limit=20&offset=40');
  });
});
