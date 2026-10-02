/**
 * B-01's guidance (docs/15): the "up next" line that says what to do now, and
 * the checklist that replaces three empty cards on a brand-new account.
 *
 * The old dashboard was four cards each ending in a small grey button, and a
 * new user had no idea which one to press.
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  router: { push: (...a: unknown[]) => mockPush(...a), replace: jest.fn(), back: jest.fn() },
  useLocalSearchParams: () => ({}),
}));

const q = (data: unknown) => ({ data, isPending: false, isError: false, error: null, refetch: jest.fn() });

const FULL = {
  local_date: '2026-09-23', timezone: 'UTC',
  training: {
    sessions_today: 1, volume_today_kg: 4820, sessions_this_week: 3, volume_this_week_kg: 14300,
    streak_days: 2, active_session_id: null,
    last_session: { id: 's1', local_date: '2026-09-23', title: null, total_volume_kg: 4820, set_count: 14 },
  },
  nutrition: {
    calories: 1480, protein_g: 122, carbs_g: 140, fat_g: 44, meals_logged: 2, pending_count: 0, incomplete: false,
    targets: { calories: 2400, protein_g: 180, carbs_g: 240, fat_g: 80 },
  },
  body: { latest: { local_date: '2026-09-23', value: 78.4, moving_average: 78.6 }, today: 78.4, change_7d: -0.4, change_30d: -1.8, unit: 'kg' },
  goals: [],
};

const EMPTY = {
  local_date: '2026-09-23', timezone: 'UTC',
  training: { sessions_today: 0, volume_today_kg: 0, sessions_this_week: 0, volume_this_week_kg: 0, streak_days: 0, active_session_id: null, last_session: null },
  nutrition: { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, meals_logged: 0, pending_count: 0, incomplete: false, targets: { calories: null, protein_g: null, carbs_g: null, fat_g: null } },
  body: { latest: null, today: null, change_7d: null, change_30d: null, unit: 'kg' },
  goals: [],
};

const mocks = { dashboard: q(FULL) };
jest.mock('@/lib/query/hooks', () => ({ useDashboard: () => mocks.dashboard }));
jest.mock('@/lib/session', () => ({ useSession: () => ({ email: 'a@b.c', profile: null }) }));

import Home from '../home';

beforeEach(() => { jest.clearAllMocks(); mocks.dashboard = q(FULL); });

describe('the up-next line', () => {
  it('leads to the open workout first', () => {
    mocks.dashboard = q({ ...FULL, training: { ...FULL.training, active_session_id: 'sess-1' } });
    render(<Home />);
    fireEvent.press(screen.getByTestId('next-up-resume'));
    expect(mockPush).toHaveBeenCalledWith('/session/sess-1');
  });

  it('sends unchecked estimates to the diary before anything else', () => {
    mocks.dashboard = q({ ...FULL, nutrition: { ...FULL.nutrition, pending_count: 1 } });
    render(<Home />);
    fireEvent.press(screen.getByTestId('next-up-review'));
    expect(mockPush).toHaveBeenCalledWith('/nutrition');
  });

  it('suggests training when nothing has been trained today', () => {
    mocks.dashboard = q({ ...FULL, training: { ...FULL.training, sessions_today: 0 } });
    render(<Home />);
    fireEvent.press(screen.getByTestId('next-up-workout'));
    expect(mockPush).toHaveBeenCalledWith('/train/start');
  });

  it('says so when everything is done', () => {
    render(<Home />);
    expect(screen.getByTestId('next-up-done')).toBeTruthy();
  });
});

describe('the first-run checklist', () => {
  it('replaces the three empty cards, and every step leads somewhere', () => {
    mocks.dashboard = q(EMPTY);
    render(<Home />);
    expect(screen.getByTestId('first-run')).toBeTruthy();
    expect(screen.queryByTestId('training-volume')).toBeNull();
    expect(screen.queryByTestId('kcal-remaining')).toBeNull();

    fireEvent.press(screen.getByTestId('start-workout'));
    expect(mockPush).toHaveBeenLastCalledWith('/train/start');
    fireEvent.press(screen.getByTestId('go-targets'));
    expect(mockPush).toHaveBeenLastCalledWith('/nutrition/targets');
  });

  it('is gone as soon as any domain has data', () => {
    mocks.dashboard = q({ ...EMPTY, nutrition: { ...EMPTY.nutrition, meals_logged: 1, calories: 400 } });
    render(<Home />);
    expect(screen.queryByTestId('first-run')).toBeNull();
    // The other domains still say what to do, each on its own card.
    expect(screen.getByTestId('training-empty')).toBeTruthy();
    expect(screen.getByTestId('body-empty')).toBeTruthy();
  });
});

describe('the cards say things in words', () => {
  it('prints the goal type and status, not their slugs', () => {
    mocks.dashboard = q({ ...FULL, goals: [{
      id: 'g1', goal_type: 'fat_loss', metric_key: 'body_weight', direction: 'down',
      start_value: 80, target_value: 75, target_unit: 'kg', start_date: '2026-09-01',
      target_date: null, weekly_rate: 0.5, current_value: 78.4, progress: 0.32, status: 'active',
    }] });
    render(<Home />);
    expect(screen.getByText('Fat loss')).toBeTruthy();
    expect(screen.getByText('Active')).toBeTruthy();
    expect(screen.queryByText('fat loss')).toBeNull();
  });

  it('shows what is left as the headline and eaten-of-target beside it', () => {
    render(<Home />);
    expect(screen.getByTestId('kcal-remaining').props.children).toBe('920');
    expect(screen.getByText('1,480 / 2,400 kcal')).toBeTruthy();
  });
});
