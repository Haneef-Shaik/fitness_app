/**
 * Something has to notice that the network came back.
 *
 * The outbox had three triggers: the screen mounting, the app returning to the
 * foreground, and a set being committed. All three are things the USER does. So
 * a queue that failed while the server was unreachable sat there — the outbox
 * even computed a `nextAttemptAt` backoff, and nothing ever fired it.
 *
 * Seen on a device: sets 2 and 3 logged with the API down, the API brought back,
 * and ninety seconds later the phone still showed two grey dots and the server
 * still held one set. Nobody was going to tap anything; the user is resting
 * between sets with the phone on a bench.
 */
import { startOutboxPump } from '../pump';

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

it('retries on its own, with nobody touching the phone', () => {
  const flush = jest.fn();
  startOutboxPump({ flush, intervalMs: 1000 });

  expect(flush).not.toHaveBeenCalled();   // not eagerly, on a timer

  jest.advanceTimersByTime(3000);

  expect(flush).toHaveBeenCalledTimes(3);
});

it('stops when told to, so a remounted screen cannot stack pumps', () => {
  const flush = jest.fn();
  const stop = startOutboxPump({ flush, intervalMs: 1000 });

  jest.advanceTimersByTime(2000);
  expect(flush).toHaveBeenCalledTimes(2);

  stop();
  jest.advanceTimersByTime(5000);

  expect(flush).toHaveBeenCalledTimes(2);
});

it('keeps ticking when a flush rejects — a failed retry is not the last retry', () => {
  // The whole point is the unreachable case, which is the rejecting case.
  const flush = jest.fn(() => Promise.reject(new Error('still offline')));
  startOutboxPump({ flush, intervalMs: 1000 });

  jest.advanceTimersByTime(3000);

  expect(flush).toHaveBeenCalledTimes(3);
});
