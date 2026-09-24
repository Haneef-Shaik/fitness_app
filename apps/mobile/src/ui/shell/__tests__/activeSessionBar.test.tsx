/**
 * 00 §4 ④ — the active-session bar. While a workout is open it sits on every
 * tab: what, how long, how many sets, and one tap back into the logger. It
 * cannot be dismissed — losing track of an open session is the failure it
 * exists to prevent. Train and Home only offered "Resume" on their own cards.
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ router: { push: (...a: unknown[]) => mockPush(...a) } }));

let mockDraft: unknown = null;
jest.mock('@/features/workout-session/store/sessionStore', () => ({
  useSessionStore: (pick: (s: { draft: unknown }) => unknown) => pick({ draft: mockDraft }),
}));
let mockServer: unknown = null;
jest.mock('@/features/workout-session/useSession', () => ({
  useActiveSession: () => ({ data: mockServer }),
}));

import { ActiveSessionBar, sessionBarSummary } from '../ActiveSessionBar';

const STARTED = '2026-09-24T10:00:00.000Z';
const at = (seconds: number) => Date.parse(STARTED) + seconds * 1000;
const ex = (name: string | null, sets: number, skipped = false) => ({ name, sets, skipped });

beforeEach(() => { jest.clearAllMocks(); mockDraft = null; mockServer = null; });

describe('sessionBarSummary', () => {
  it('names the workout by its exercises', () => {
    const s = (names: (string | null)[]) => sessionBarSummary(
      { id: 's', startedAt: STARTED, exercises: names.map((n) => ex(n, 1)) }, at(0)).title;
    expect(s([])).toBe('Workout');
    expect(s(['Bench Press'])).toBe('Bench Press');
    expect(s(['Bench Press', 'Dip'])).toBe('Bench Press & Dip');
    expect(s(['Bench Press', 'Dip', 'Fly', 'Pushdown'])).toBe('Bench Press + 3 more');
  });

  it('counts sets, and leaves out skipped exercises', () => {
    const s = sessionBarSummary({
      id: 's', startedAt: STARTED, exercises: [ex('Squat', 3), ex('Lunge', 0, true), ex('Curl', 2)],
    }, at(0));
    expect(s.sets).toBe('5 sets');
    expect(s.title).toBe('Squat & Curl');
  });

  it('shows elapsed time as m:ss, then h:mm:ss', () => {
    const e = (sec: number) => sessionBarSummary({ id: 's', startedAt: STARTED, exercises: [] }, at(sec)).elapsed;
    expect(e(0)).toBe('0:00');
    expect(e(24 * 60 + 13)).toBe('24:13');
    expect(e(3600 + 62)).toBe('1:01:02');
  });

  it('reads aloud in minutes, so a screen reader is not handed a changing second count', () => {
    const s = sessionBarSummary({ id: 's', startedAt: STARTED, exercises: [ex('Squat', 1)] }, at(24 * 60 + 13));
    expect(s.label).toBe('Workout in progress: Squat, 24 minutes, 1 set. Resume');
  });
});

describe('ActiveSessionBar', () => {
  const draft = {
    sessionId: 'sess-1', startedAt: STARTED, status: 'in_progress',
    exercises: [{ exerciseName: 'Bench Press', skipped: false, sets: [{}, {}] }],
  };

  it('is absent when no workout is open', () => {
    render(<ActiveSessionBar />);
    expect(screen.queryByTestId('active-session-bar')).toBeNull();
  });

  it('shows the open workout from this phone, and taps through to the logger', () => {
    mockDraft = draft;
    render(<ActiveSessionBar />);
    expect(screen.getByText('Bench Press')).toBeTruthy();
    expect(screen.getByText(/2 sets/)).toBeTruthy();
    fireEvent.press(screen.getByTestId('active-session-bar'));
    expect(mockPush).toHaveBeenCalledWith('/session/sess-1');
  });

  it("falls back to the server's open workout when this phone has none", () => {
    mockServer = {
      id: 'sess-2', started_at: STARTED, status: 'in_progress',
      exercises: [{ exercise_name: 'Squat', skipped: false, sets: [{}] }],
    };
    render(<ActiveSessionBar />);
    fireEvent.press(screen.getByTestId('active-session-bar'));
    expect(mockPush).toHaveBeenCalledWith('/session/sess-2');
  });

  it('offers no way to dismiss it', () => {
    mockDraft = draft;
    render(<ActiveSessionBar />);
    expect(screen.queryByLabelText(/close|dismiss/i)).toBeNull();
  });
});
