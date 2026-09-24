/**
 * L-02 and L-07.
 *
 * The wireframe's rule is the whole design: **nothing is ever dropped
 * silently.** So what is asserted here is that every terminal failure reaches
 * the screen with the server's own sentence and a concrete choice, and that
 * "Discard" is per-item, confirmed, and names what it is throwing away.
 *
 * And the one that is easy to get wrong in the flattering direction: **the
 * badge counts terminal failures only.** A pending retry is the outbox working,
 * and counting it is how somebody learns to ignore the badge.
 */
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

const mockPush = jest.fn();
const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  router: { push: (...a: unknown[]) => mockPush(...a), replace: jest.fn(),
            back: (...a: unknown[]) => mockBack(...a) },
  useLocalSearchParams: () => mockParams,
}));

jest.mock('@/lib/api', () => ({
  api: { get: jest.fn(() => Promise.resolve({})) },
  API_BASE: 'http://test',
}));

let mockParams: Record<string, string> = {};

const q = (data: unknown, over: Record<string, unknown> = {}) => ({
  data, isPending: false, isError: false, error: null, refetch: jest.fn(), ...over,
});

const mutation = () => ({
  mutate: jest.fn(), mutateAsync: jest.fn(() => Promise.resolve({})), isPending: false,
});

const entry = (over: Record<string, unknown> = {}) => ({
  id: 1, aggregateId: 's1', method: 'POST',
  path: '/session-exercises/se1/sets',
  body: JSON.stringify({ set_type: 'working', load_kg: 60, reps: 8 }),
  idempotencyKey: 'k1', attempts: 0, nextAttemptAt: '2026-09-23T10:00:00Z',
  state: 'pending', lastError: null, ...over,
});

const mocks = {
  outbox: q([]),
  retry: mutation(),
  retryAll: mutation(),
  discard: mutation(),
  unattributed: q(0),
  discardUnattributed: mutation(),
};

jest.mock('@/lib/query/hooks', () => ({
  useOutbox: () => mocks.outbox,
  useRetryQueued: () => mocks.retry,
  useRetryAllQueued: () => mocks.retryAll,
  useDiscardQueued: () => mocks.discard,
  useUnattributed: () => mocks.unattributed,
  useDiscardUnattributed: () => mocks.discardUnattributed,
}));

import SyncCenter from '../sync/index';
import Conflict from '../sync/conflict';
import { SyncBanner, SyncShell } from '@/features/sync/SyncBanner';
import { Text as RNText } from 'react-native';
import { useScreenEdges } from '@/ui/topInset';

beforeEach(() => {
  jest.clearAllMocks();
  mockParams = { entry: '1' };
  mocks.outbox = q([]);
  mocks.unattributed = q(0);
  mocks.retry = mutation();
  mocks.retryAll = mutation();
  mocks.discard = mutation();
});

describe('L-02 · the Sync Center', () => {
  it('says everything is uploaded when there is nothing queued', () => {
    render(<SyncCenter />);
    expect(screen.getByTestId('sync-clear')).toBeTruthy();
  });

  it('describes a pending write as the thing the user did', () => {
    mocks.outbox = q([entry()]);
    render(<SyncCenter />);

    expect(screen.getByText('Set')).toBeTruthy();
    expect(screen.getByText('60 kg × 8')).toBeTruthy();
  });

  it('explains that waiting is normal, so nobody "fixes" it', () => {
    mocks.outbox = q([entry()]);
    render(<SyncCenter />);
    expect(screen.getByText(/These retry on their own. Nothing is lost/)).toBeTruthy();
  });

  it("shows the server's own sentence on a failure, not a generic one", () => {
    mocks.outbox = q([entry({ state: 'failed', lastError: 'Reps must be at least 1.' })]);
    render(<SyncCenter />);

    expect(screen.getByTestId('sync-1-reason').props.children).toBe('Reps must be at least 1.');
    expect(screen.queryByText(/an error occurred/i)).toBeNull();
  });

  it('offers Try again for something the user can fix', () => {
    mocks.outbox = q([entry({ state: 'failed', lastError: 'Reps must be at least 1.' })]);
    render(<SyncCenter />);

    fireEvent.press(screen.getByTestId('sync-1-retry'));
    expect(mocks.retry.mutate).toHaveBeenCalledWith(1);
  });

  it('offers the conflict dialog instead when the target is gone', () => {
    mocks.outbox = q([entry({ state: 'failed', lastError: 'That meal no longer exists.' })]);
    render(<SyncCenter />);

    // Not a "Fix" button: this is not something the user typed wrong.
    expect(screen.queryByTestId('sync-1-retry')).toBeNull();
    fireEvent.press(screen.getByTestId('sync-1-conflict'));
    expect(mockPush).toHaveBeenCalledWith('/sync/conflict?entry=1');
  });

  it('confirms a discard and names what is being thrown away', () => {
    mocks.outbox = q([entry({ state: 'failed', lastError: 'nope' })]);
    render(<SyncCenter />);

    fireEvent.press(screen.getByTestId('sync-1-discard'));

    // Per-item, confirmed, and it says what it is.
    expect(mocks.discard.mutate).not.toHaveBeenCalled();
    expect(screen.getByTestId('sync-1-confirm')).toBeTruthy();
    expect(screen.getByText(/cannot be undone/)).toBeTruthy();

    fireEvent.press(screen.getByTestId('sync-1-discard-confirm'));
    expect(mocks.discard.mutate).toHaveBeenCalledWith(1);
  });

  it('lets somebody back out of a discard', () => {
    mocks.outbox = q([entry({ state: 'failed', lastError: 'nope' })]);
    render(<SyncCenter />);

    fireEvent.press(screen.getByTestId('sync-1-discard'));
    fireEvent.press(screen.getByTestId('sync-1-keep'));

    expect(screen.queryByTestId('sync-1-confirm')).toBeNull();
    expect(mocks.discard.mutate).not.toHaveBeenCalled();
  });

  it('retries everything that failed, and nothing that did not', () => {
    mocks.outbox = q([
      entry({ id: 1, state: 'pending' }),
      entry({ id: 2, state: 'failed', lastError: 'nope' }),
      entry({ id: 3, state: 'failed', lastError: 'nope' }),
    ]);
    render(<SyncCenter />);

    fireEvent.press(screen.getByTestId('sync-retry-all'));
    expect(mocks.retryAll.mutate).toHaveBeenCalledWith([2, 3]);
  });
});

describe('L-02 · the banner', () => {
  it('says nothing when there is nothing to say', () => {
    render(<SyncBanner online />);
    expect(screen.queryByTestId('sync-banner')).toBeNull();
  });

  it('states what still works when offline', () => {
    mocks.outbox = q([entry()]);
    render(<SyncBanner online={false} />);

    // Not "No connection". What still works.
    expect(screen.getByTestId('sync-banner').props.accessibilityLabel)
      .toBe('Offline — everything you log is still saving here');
  });

  it('carries the meaning in words, not only in colour', () => {
    mocks.outbox = q([entry({ state: 'failed', lastError: 'nope' })]);
    render(<SyncBanner online />);

    // 05 §3 — colour never carries meaning alone, and a screen reader gets
    // nothing from a background tint.
    expect(screen.getByTestId('sync-banner').props.accessibilityLabel)
      .toBe("1 change couldn't sync");
    expect(screen.getByLabelText('Review the changes that could not sync')).toBeTruthy();
  });

  it('sits below the status bar, not underneath it', () => {
    /**
     * Found on the phone in G10: the banner is the first thing in the shell,
     * so with no inset of its own it was drawn under the clock and the system
     * icons — "2 changes couldn't sync" printed across the status bar. The
     * screens below never saw it because they each inset themselves.
     *
     * The fix is a top-edge SafeAreaView on the banner — and, because the
     * native SafeAreaView always applies the full window inset wherever it
     * sits, the shell also tells the screens beneath not to (see below).
     */
    mocks.outbox = q([entry({ state: 'failed', lastError: 'nope' })]);
    render(<SyncBanner online />);

    const inset = screen.getByTestId('sync-banner-inset');
    // The native view's own form of `edges={['top']}`: the top inset, and
    // nothing at the sides or bottom, which the screens own.
    expect(inset.props.edges).toEqual({
      top: 'additive', bottom: 'off', left: 'off', right: 'off',
    });
    expect(screen.getByTestId('sync-banner')).toBeTruthy();
  });

  it('tells the screens beneath it that the top is already cleared', () => {
    // Otherwise every screen insets itself again under the banner and leaves a
    // blank strip the height of the status bar — seen on the phone in G10.
    function Edges() {
      return <RNText testID="edges">{useScreenEdges().join(',')}</RNText>;
    }
    mocks.outbox = q([entry({ state: 'failed', lastError: 'nope' })]);
    render(<SyncShell><Edges /></SyncShell>);
    expect(screen.getByTestId('edges').props.children).toBe('left,right');
  });

  it('leaves the top to the screens when it is not showing', () => {
    function Edges() {
      return <RNText testID="edges">{useScreenEdges().join(',')}</RNText>;
    }
    render(<SyncShell><Edges /></SyncShell>);
    expect(screen.queryByTestId('sync-banner')).toBeNull();
    expect(screen.getByTestId('edges').props.children).toBe('top,left,right');
  });

  it('adds no inset when there is nothing to say', () => {
    // An empty SafeAreaView would still take the status bar's height and push
    // every screen down by it.
    render(<SyncBanner online />);
    expect(screen.queryByTestId('sync-banner-inset')).toBeNull();
  });

  it('shows the offline state in the real app, where nobody passes `online`', () => {
    // The shell renders <SyncShell> with no prop. Until G10 that meant the
    // offline sentence existed only in tests.
    mocks.outbox = q([entry({ attempts: 1, lastError: 'Could not reach the server.' })]);
    render(<SyncShell><RNText>app</RNText></SyncShell>);
    expect(screen.getByTestId('sync-banner').props.accessibilityLabel)
      .toBe('Offline — everything you log is still saving here');
  });

  it('opens the Sync Center', () => {
    mocks.outbox = q([entry()]);
    render(<SyncBanner online={false} />);

    fireEvent.press(screen.getByTestId('sync-banner-open'));
    expect(mockPush).toHaveBeenCalledWith('/sync');
  });
});

describe('L-07 · the conflict dialog', () => {
  it('shows both sides with enough detail to choose', async () => {
    mocks.outbox = q([entry({
      state: 'failed', attempts: 2, path: '/meals',
      body: JSON.stringify({ meal_type: 'lunch', items: [{}, {}] }),
      lastError: 'That meal no longer exists.',
    })]);
    render(<Conflict />);

    expect(screen.getByText('On this device')).toBeTruthy();
    expect(screen.getByText('On the server')).toBeTruthy();
    expect(screen.getByText('lunch · 2 items')).toBeTruthy();
    await waitFor(() =>
      expect(screen.getByTestId('conflict-server').props.children).not.toBe('Checking…'));
  });

  it('reassures that sets never reach here', () => {
    mocks.outbox = q([entry({ state: 'failed', lastError: 'gone' })]);
    render(<Conflict />);
    expect(screen.getByText(/Individual sets never end up here/)).toBeTruthy();
  });

  it('offers both choices and does neither on its own', () => {
    mocks.outbox = q([entry({ state: 'failed', lastError: 'gone' })]);
    render(<Conflict />);

    // A dialog that resolved a conflict by rendering would be a silent
    // last-writer-wins with extra steps.
    expect(mocks.retry.mutate).not.toHaveBeenCalled();
    expect(mocks.discard.mutate).not.toHaveBeenCalled();

    fireEvent.press(screen.getByTestId('conflict-retry'));
    expect(mocks.retry.mutate).toHaveBeenCalledWith(1);
  });

  it('copes with the entry going away while the dialog is open', () => {
    mocks.outbox = q([]);
    render(<Conflict />);
    expect(screen.getByTestId('conflict-resolved')).toBeTruthy();
  });
});

describe('L-02 · writes from before accounts were separated (G10)', () => {
  // Local schema v2 could not tell whose they were, so they are never sent.
  // They were also never shown: invisible and permanent. Now they are counted
  // and can be thrown away — deliberately, never automatically.
  it('says nothing when there are none', () => {
    render(<SyncCenter />);
    expect(screen.queryByTestId('sync-unattributed')).toBeNull();
  });

  it('counts them, explains why they will not upload, and discards only on confirm', () => {
    mocks.unattributed = q(3);
    render(<SyncCenter />);
    expect(screen.getByTestId('sync-unattributed')).toBeTruthy();
    expect(screen.getByText(/3 changes from an older version/)).toBeTruthy();
    fireEvent.press(screen.getByTestId('sync-unattributed-discard'));
    expect(mocks.discardUnattributed.mutate).not.toHaveBeenCalled();
    fireEvent.press(screen.getByTestId('sync-unattributed-discard-confirm'));
    expect(mocks.discardUnattributed.mutate).toHaveBeenCalled();
  });
});
