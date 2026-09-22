/**
 * `api.get` unwraps the envelope to `data` and throws `meta` away.
 *
 * That is right for every read so far — nothing needed the counters. It is
 * wrong for a cursor-paged list, where `meta.next_cursor` is not decoration:
 * without it there is no second page, and a client written against `api.get`
 * would silently only ever see the first one.
 *
 * So the paged read is its own function rather than a flag on the old one: a
 * caller either wants the envelope's meta or it does not, and making that a
 * type distinction means the paging loop cannot be written against the wrong
 * shape by accident.
 */
import { api } from '../api';

jest.mock('../storage', () => ({
  getRefreshToken: jest.fn(async () => null),
  setRefreshToken: jest.fn(async () => {}),
  clearRefreshToken: jest.fn(async () => {}),
}));

const envelope = (data: unknown, meta?: unknown) => ({
  ok: true,
  status: 200,
  json: async () => ({ success: true, data, error: null, ...(meta ? { meta } : {}) }),
});

it('hands back the rows AND the meta the cursor lives in', async () => {
  global.fetch = jest.fn(async () => envelope(
    [{ id: 'a' }, { id: 'b' }],
    { limit: 2, count: 2, next_cursor: 'opaque-blob', has_more: true },
  )) as never;

  const page = await api.getPaged<{ id: string }[]>('/history/workouts?limit=2');

  expect(page.data.map((r) => r.id)).toEqual(['a', 'b']);
  expect(page.meta?.next_cursor).toBe('opaque-blob');
  expect(page.meta?.has_more).toBe(true);
});

it('survives an endpoint that sends no meta at all', async () => {
  // Not every list is paged, and a missing meta must read as "no more pages"
  // rather than crash the screen.
  global.fetch = jest.fn(async () => envelope([{ id: 'a' }])) as never;

  const page = await api.getPaged<{ id: string }[]>('/anything');

  expect(page.data).toHaveLength(1);
  expect(page.meta).toBeUndefined();
});

it('still returns an array when the list is empty, not null', async () => {
  // A filtered-empty page (I13) must be iterable without a guard at every site.
  global.fetch = jest.fn(async () => envelope(
    [], { limit: 20, count: 0, has_more: false, filtered: true, total_unfiltered: 7 },
  )) as never;

  const page = await api.getPaged<{ id: string }[]>('/history/workouts?muscle=calves');

  expect(page.data).toEqual([]);
  expect(page.meta?.filtered).toBe(true);
  expect(page.meta?.total_unfiltered).toBe(7);
});
