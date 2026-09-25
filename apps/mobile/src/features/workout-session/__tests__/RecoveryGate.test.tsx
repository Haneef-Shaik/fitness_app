/**
 * E-10 offers only a workout that is still open (docs/03 §5.3).
 *
 * G10's TalkBack session: after a finished workout had been re-adopted as a
 * draft (fixed in app/session/[id]), every launch said "You left a workout
 * open · 3 sets" for a session the server had completed an hour earlier. The
 * gate never asked the server whether the draft's session was still open.
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import { createMemoryStore } from '../../../lib/db/memory';
import type { SessionStore } from '../../../lib/db/types';
import { configurePersistence, useSessionStore } from '../store/sessionStore';
import { RecoveryGate } from '../RecoveryGate';

let mockStore: SessionStore;
const mockGet = jest.fn();

jest.mock('../../../lib/db', () => ({
  get store() { return mockStore; },
  STORE_KIND: 'memory',
}));

jest.mock('../../../lib/api', () => {
  const actual = jest.requireActual('../../../lib/api');
  return { ...actual, api: { get: (path: string) => mockGet(path) } };
});

jest.mock('expo-router', () => ({ router: { push: jest.fn(), replace: jest.fn() } }));

const DRAFT = {
  sessionId: 'old', startedAt: new Date(Date.now() - 3600_000).toISOString(), revision: 3,
  exercises: [{
    clientId: 'x1', exerciseId: 'e1', exerciseName: 'Bench', sessionExerciseId: 'se1',
    tracks: { load: true, reps: true, duration: false, distance: false }, skipped: false,
    sets: [{ clientId: 's1', setIndex: 0, setType: 'working', reps: 8, loadKg: 80,
      durationSeconds: null, distanceM: null, syncState: 'synced' }],
  }],
};

async function withLocalDraft() {
  await mockStore.commit({ revision: 3, updatedAt: DRAFT.startedAt, json: JSON.stringify(DRAFT) });
}

beforeEach(async () => {
  jest.clearAllMocks();
  mockStore = createMemoryStore('user-1');
  await mockStore.open();
  configurePersistence({ store: mockStore });
  useSessionStore.setState({ draft: null, recoveryCandidate: null });
});
afterEach(() => configurePersistence(null));

describe('RecoveryGate', () => {
  it('drops, without asking, a draft whose session the server has finished', async () => {
    await withLocalDraft();
    mockGet.mockImplementation(async (path: string) =>
      (path === '/workout-sessions/active' ? null : { id: 'old', status: 'completed' }));

    render(<RecoveryGate enabled />);

    await waitFor(() => expect(mockGet).toHaveBeenCalledWith('/workout-sessions/old'));
    await waitFor(async () => expect(await mockStore.loadDraft()).toBeNull());
    expect(screen.queryByTestId('recovery-prompt')).toBeNull();
    expect(useSessionStore.getState().draft).toBeNull();
  });

  it('still offers a draft whose session is open', async () => {
    await withLocalDraft();
    mockGet.mockImplementation(async (path: string) =>
      (path === '/workout-sessions/active' ? null : { id: 'old', status: 'in_progress' }));

    render(<RecoveryGate enabled />);

    await waitFor(() => expect(screen.getByTestId('recovery-prompt')).toBeTruthy());
  });

  it('offline, keeps and offers the draft — it cannot know, so it does not guess', async () => {
    await withLocalDraft();
    mockGet.mockRejectedValue(new TypeError('Network request failed'));

    render(<RecoveryGate enabled />);

    await waitFor(() => expect(screen.getByTestId('recovery-prompt')).toBeTruthy());
    expect(mockGet).not.toHaveBeenCalledWith('/workout-sessions/old');
  });
});
