/**
 * Logging a body measurement — an offline write, through the **existing** outbox.
 *
 * Third domain on the same queue (**H3.2**), and it needed nothing new: G7's
 * `store.enqueue` already accepts a write with no draft behind it, which is
 * what a weigh-in is.
 *
 * Why it matters here specifically: somebody weighs themselves in a bathroom,
 * which is where the signal is worst in any building. A write that needed the
 * network would be the write most likely to fail.
 *
 * **I8** — the idempotency key is generated once and replayed unchanged, so a
 * flaky connection cannot produce two weigh-ins and a phantom gain.
 */
import type { BodyMetricIn } from '@fitlog/api-types';
import { store } from '../../lib/db';
import { uuid } from '../../lib/uuid';

export interface QueuedMetric {
  clientId: string;
  idempotencyKey: string;
}

/**
 * `idempotencyKey` is for a caller that has a stable id of its own — an import
 * from Health Connect or Apple Health passes the record's uuid, so a second
 * sync of the same weigh-in is the SAME queued write, not another one.
 */
export async function queueMetric(body: BodyMetricIn, idempotencyKey: string = uuid()): Promise<QueuedMetric> {
  const clientId = body.client_id ?? uuid();

  await store.enqueue({
    aggregateId: `body:${clientId}`,
    method: 'POST',
    path: '/body-metrics',
    body: JSON.stringify({ ...body, client_id: clientId }),
    idempotencyKey,
    nextAttemptAt: new Date().toISOString(),
  });

  return { clientId, idempotencyKey };
}
