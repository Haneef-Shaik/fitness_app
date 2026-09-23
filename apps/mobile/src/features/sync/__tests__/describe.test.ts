/**
 * The Sync Center's reading of the outbox (L-02).
 *
 * The rule the wireframe states, and the one these tests hold it to: **the
 * badge counts terminal failures only.** A pending retry is the outbox working
 * exactly as designed, and counting it alarms somebody about normal operation —
 * after which they stop reading the badge, which is the same as not having one.
 */
import type { OutboxEntry } from '@/lib/db';
import { UNREACHABLE } from '@/lib/offline/outbox';
import {
  looksOffline,
  bannerFor, classify, describePath, summarise, syncState, toChange,
} from '../describe';

const entry = (over: Partial<OutboxEntry> = {}): OutboxEntry => ({
  id: 1,
  aggregateId: 's1',
  method: 'POST',
  path: '/session-exercises/se1/sets',
  body: JSON.stringify({ set_type: 'working', load_kg: 60, reps: 8 }),
  idempotencyKey: 'k1',
  attempts: 0,
  nextAttemptAt: '2026-09-23T10:00:00Z',
  state: 'pending',
  lastError: null,
  ...over,
});

describe('what a queued write is', () => {
  it('names each kind from its path', () => {
    expect(describePath(entry())).toBe('Set');
    expect(describePath(entry({ path: '/meals' }))).toBe('Meal');
    expect(describePath(entry({ path: '/body-metrics' }))).toBe('Measurement');
    expect(describePath(entry({ path: '/recipes/r1/log' }))).toBe('Recipe');
  });

  it('summarises a set as the thing the user actually did', () => {
    expect(summarise(entry())).toEqual({ title: 'Set', detail: '60 kg × 8' });
  });

  it('summarises a measurement with its unit', () => {
    const row = entry({
      path: '/body-metrics',
      body: JSON.stringify({ metric_key: 'body_weight', value: 78.4, unit: 'kg' }),
    });
    expect(summarise(row)).toEqual({ title: 'Measurement', detail: '78.4 kg' });
  });

  it('summarises a meal by category and item count', () => {
    const row = entry({
      path: '/meals',
      body: JSON.stringify({ meal_type: 'lunch', items: [{}, {}] }),
    });
    expect(summarise(row)).toEqual({ title: 'Meal', detail: 'lunch · 2 items' });
  });

  it('still names a change whose body it cannot read', () => {
    // A body we cannot parse is still a change that must not be dropped.
    expect(summarise(entry({ body: 'not json' }))).toEqual({ title: 'Set', detail: null });
  });
});

describe('classifying a failure', () => {
  it('tells a validation error from a conflict from a deletion', () => {
    expect(classify('Reps must be at least 1.')).toBe('validation');
    expect(classify('This was changed somewhere else.')).toBe('conflict');
    expect(classify('That meal no longer exists.')).toBe('gone');
  });

  it('does not guess when there is nothing to go on', () => {
    expect(classify(null)).toBe('unknown');
    expect(classify('Something went wrong on our side.')).toBe('unknown');
  });
});

describe('the badge', () => {
  it('counts terminal failures and NOT pending retries', () => {
    const state = syncState([
      entry({ id: 1, state: 'pending' }),
      entry({ id: 2, state: 'pending', attempts: 3 }),
      entry({ id: 3, state: 'failed', lastError: 'Reps must be at least 1.' }),
    ]);

    expect(state.pending).toHaveLength(2);
    expect(state.failed).toHaveLength(1);
    // A retry in progress is the outbox working. Counting it is how a badge
    // becomes something people stop reading.
    expect(state.badge).toBe(1);
  });

  it('ignores entries that already went', () => {
    const state = syncState([entry({ id: 1, state: 'sent' })]);
    expect(state.pending).toEqual([]);
    expect(state.badge).toBe(0);
  });

  it('carries the server sentence through verbatim', () => {
    const change = toChange(entry({ state: 'failed', lastError: 'Reps must be at least 1.' }));
    // Not a rewrite of it. The server said something specific and the user
    // gets that, not "an error occurred".
    expect(change.reason).toBe('Reps must be at least 1.');
    expect(change.kind).toBe('validation');
  });
});

describe('the banner', () => {
  it('says what still works when offline, not just that something is wrong', () => {
    const line = bannerFor(syncState([entry()]), false);
    expect(line).toBe('Offline — everything you log is still saving here');
  });

  it('reports syncing while online with work outstanding', () => {
    expect(bannerFor(syncState([entry(), entry({ id: 2 })]), true))
      .toBe('Syncing 2 changes…');
  });

  it('a failure outranks everything else', () => {
    const state = syncState([
      entry({ id: 1, state: 'pending' }),
      entry({ id: 2, state: 'failed', lastError: 'nope' }),
    ]);
    expect(bannerFor(state, false)).toBe("1 change couldn't sync");
  });

  it('is silent when there is nothing to say', () => {
    // "never appears more than once per state change" starts with not
    // appearing when nothing has happened.
    expect(bannerFor(syncState([]), true)).toBeNull();
    expect(bannerFor(syncState([entry({ state: 'sent' })]), true)).toBeNull();
  });
});

describe('looksOffline — the only connectivity signal the app has', () => {
  /**
   * Nothing in the app ever told the banner it was offline, so L-02's offline
   * state could not appear on a phone at all — found in G10. The outbox already
   * records the one fact that matters: its last attempt could not reach the
   * server. That is evidence, not a guess from a radio API.
   */
  it('is offline when a queued write could not reach the server', () => {
    expect(looksOffline([entry({ attempts: 1, lastError: UNREACHABLE })])).toBe(true);
  });

  it('is not offline for a write that has simply not been tried yet', () => {
    expect(looksOffline([entry()])).toBe(false);
  });

  it('is not offline because the server said no', () => {
    // A 5xx is the server being reached and failing — not the phone being offline.
    expect(looksOffline([entry({ attempts: 1, lastError: 'Internal error' })])).toBe(false);
  });

  it('ignores a terminal failure', () => {
    expect(looksOffline([entry({ state: 'failed', lastError: UNREACHABLE })])).toBe(false);
  });
});
