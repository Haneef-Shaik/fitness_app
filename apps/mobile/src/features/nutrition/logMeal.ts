/**
 * Logging a meal — an offline write, through the **existing** outbox.
 *
 * Meals reuse G3's queue unchanged. The only thing G7 had to add was a door:
 * `store.enqueue` queues a write with no session draft behind it, because
 * `commit(draft, entry)` demanded one and a meal has no draft. That was a G3
 * coupling, fixed on the shared store contract rather than answered with a
 * second queue — two queues is how one of them silently stops flushing.
 *
 * **I8** — the idempotency key is generated once, here, and replayed unchanged.
 * A meal delivered twice is one meal, so a flaky connection cannot double a
 * day's calories.
 */
import type { MealIn } from '@fitlog/api-types';
import { store } from '../../lib/db';
import { uuid } from '../../lib/uuid';

export interface QueuedMeal {
  clientId: string;
  idempotencyKey: string;
}

/**
 * Queues the write and returns immediately.
 *
 * Deliberately does NOT await the network — the same rule the set-commit path
 * follows (**I10**). The diary updates from the server once the queue drains;
 * what must never happen is the user waiting on a round trip to see that their
 * lunch was recorded.
 */
export async function queueMeal(body: MealIn): Promise<QueuedMeal> {
  // One id for the row, one for the delivery. The server dedupes on `client_id`,
  // so a replay of the SAME meal must carry the SAME client_id — generating it
  // per attempt would create a meal per retry.
  const clientId = body.client_id ?? uuid();
  const idempotencyKey = uuid();

  await store.enqueue({
    aggregateId: `meal:${clientId}`,
    method: 'POST',
    path: '/meals',
    body: JSON.stringify({ ...body, client_id: clientId }),
    idempotencyKey,
    nextAttemptAt: new Date().toISOString(),
  });

  return { clientId, idempotencyKey };
}

/**
 * Logging a recipe (H-11) — the same queue, a different path.
 *
 * The outbox replays HTTP, so the server does the expansion from recipe to
 * items exactly as it would online. That is what makes this work offline
 * without the client having to reconstruct a meal it cannot see.
 *
 * Copying is deliberately NOT here: a copy reads a day the client may not
 * have, so it is an online action. Queueing a request whose input lives only
 * on the server would fail on delivery and look like a lost meal.
 */
export async function queueRecipeLog(
  recipeId: string,
  body: { meal_type: string; servings: number; consumed_at?: string | null },
): Promise<QueuedMeal> {
  const clientId = uuid();
  const idempotencyKey = uuid();

  await store.enqueue({
    aggregateId: `meal:${clientId}`,
    method: 'POST',
    path: `/recipes/${recipeId}/log`,
    body: JSON.stringify({ ...body, client_id: clientId }),
    idempotencyKey,
    nextAttemptAt: new Date().toISOString(),
  });

  return { clientId, idempotencyKey };
}
