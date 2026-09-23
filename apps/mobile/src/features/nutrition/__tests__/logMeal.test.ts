/**
 * Meals ride the outbox that already exists (H3.2), and the contract is the
 * same one sets have: queue now, deliver later, exactly once.
 */
import { createMemoryStore } from '../../../lib/db/memory';

// `mock`-prefixed: Jest forbids a mock factory closing over anything else.
const mockStore = createMemoryStore('user-1');
jest.mock('../../../lib/db', () => ({ get store() { return mockStore; } }));

import { queueMeal } from '../logMeal';

beforeEach(async () => { await mockStore.open(); await mockStore.reset(); });

// `confirmed` and `source` have server-side defaults but the generated request
// type lists them, so callers state them. Explicit beats a lie about the shape.
const lunch = () => ({
  meal_type: 'lunch' as const,
  items: [{
    food_id: 'f1', quantity_grams: 200,
    confirmed: true, source: 'manual' as const,
  }],
});

it('queues the write instead of awaiting the network (I10)', async () => {
  await queueMeal(lunch());

  const entries = await mockStore.allEntries();
  expect(entries).toHaveLength(1);
  expect(entries[0]!.path).toBe('/meals');
  expect(entries[0]!.state).toBe('pending');
});

it('does not disturb a workout draft that is in progress', async () => {
  // The reason `enqueue` exists rather than a faked draft.
  await mockStore.commit({ revision: 3, updatedAt: '2026-09-23T00:00:00Z', json: '{"sets":[1]}' });

  await queueMeal(lunch());

  expect((await mockStore.loadDraft())?.revision).toBe(3);
});

it('stamps a client_id so the server can dedupe a replay (I8)', async () => {
  const { clientId } = await queueMeal(lunch());

  const body = JSON.parse((await mockStore.allEntries())[0]!.body);
  expect(body.client_id).toBe(clientId);
});

it('keeps a caller-supplied client_id rather than minting a second one', async () => {
  // A retry of the SAME meal must carry the SAME client_id. Generating one per
  // attempt would create a meal per retry — the exact bug I8 exists to stop.
  const { clientId } = await queueMeal({ ...lunch(), client_id: 'chosen-id' });

  expect(clientId).toBe('chosen-id');
  expect(JSON.parse((await mockStore.allEntries())[0]!.body).client_id).toBe('chosen-id');
});

it('gives each queued meal its own aggregate, so one stuck meal blocks no other', async () => {
  // FIFO is per aggregate. Sharing one would make a rejected breakfast hold up
  // every later meal.
  await queueMeal(lunch());
  await queueMeal({ ...lunch(), meal_type: 'dinner' });

  const aggregates = (await mockStore.allEntries()).map((e) => e.aggregateId);
  expect(new Set(aggregates).size).toBe(2);
});
