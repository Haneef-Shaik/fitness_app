/**
 * B-01, I-01…I-06, J-01…J-04, B-02…B-05.
 *
 * What is asserted is mostly **what the screen says when it has nothing** —
 * because a brand-new user has three empty domains and that is the *first*
 * dashboard anybody sees. A zeroed chart, a meter at 0% and a 404 are all worse
 * than a sentence and a way out.
 *
 * The other theme is **null is not zero**: an unmeasured goal, a weight with no
 * baseline and a day with no target each have to read as "not known", never as
 * "no progress", "no change" and "nothing left".
 */
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

const mockPush = jest.fn();
const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  router: {
    push: (...a: unknown[]) => mockPush(...a),
    replace: (...a: unknown[]) => mockReplace(...a),
    back: jest.fn(),
  },
  useLocalSearchParams: () => mockParams,
}));

let mockParams: Record<string, string> = {};

const q = (data: unknown, over: Record<string, unknown> = {}) => ({
  data, isPending: false, isError: false, error: null, refetch: jest.fn(), ...over,
});

const mutation = () => ({
  mutate: jest.fn(),
  mutateAsync: jest.fn((_body?: unknown) => Promise.resolve({ id: 'x' })),
  isPending: false,
});

const FULL = {
  local_date: '2026-09-23',
  timezone: 'Europe/London',
  training: {
    sessions_today: 1, volume_today_kg: 4820, sessions_this_week: 3,
    volume_this_week_kg: 14300, streak_days: 2, active_session_id: null,
    last_session: { id: 's1', local_date: '2026-09-23', title: null,
      total_volume_kg: 4820, set_count: 14 },
  },
  nutrition: {
    calories: 1480, protein_g: 122, carbs_g: 140, fat_g: 44,
    meals_logged: 2, pending_count: 1, incomplete: false,
    targets: { calories: 2400, protein_g: 180, carbs_g: 240, fat_g: 80 },
  },
  body: {
    latest: { local_date: '2026-09-21', value: 78.4, moving_average: 78.6 },
    today: null, change_7d: -0.4, change_30d: -1.8, unit: 'kg',
  },
  goals: [{
    id: 'g1', goal_type: 'fat_loss', metric_key: 'body_weight', direction: 'down',
    start_value: 80.0, target_value: 75.0, target_unit: 'kg',
    start_date: '2026-09-01', target_date: null, weekly_rate: 0.5,
    current_value: 78.4, progress: 0.32, status: 'active',
  }],
};

const CHECKINS = {
  today: '2026-09-23', interval_days: 7, next_due: '2026-09-28', overdue: false,
  baseline: { local_date: '2026-09-01', values: { body_weight: 80, waist_cm: 92 }, since_baseline: {} },
  checkins: [
    { local_date: '2026-09-21', values: { body_weight: 78.4, waist_cm: 90 },
      since_baseline: { body_weight: -1.6, waist_cm: -2 } },
    { local_date: '2026-09-01', values: { body_weight: 80, waist_cm: 92 }, since_baseline: {} },
  ],
};

const EMPTY = {
  local_date: '2026-09-23', timezone: 'UTC',
  training: { sessions_today: 0, volume_today_kg: 0, sessions_this_week: 0,
    volume_this_week_kg: 0, streak_days: 0, active_session_id: null, last_session: null },
  nutrition: { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, meals_logged: 0,
    pending_count: 0, incomplete: false,
    targets: { calories: null, protein_g: null, carbs_g: null, fat_g: null } },
  body: { latest: null, today: null, change_7d: null, change_30d: null, unit: 'kg' },
  goals: [],
};

const SERIES = {
  metric_key: 'body_weight', unit: 'kg',
  points: [
    { local_date: '2026-09-21', value: 79.0, moving_average: 79.0 },
    { local_date: '2026-09-22', value: 78.6, moving_average: 78.8 },
    { local_date: '2026-09-23', value: 78.4, moving_average: 78.67 },
  ],
  change: -0.6,
  latest: { local_date: '2026-09-23', value: 78.4, moving_average: 78.67 },
};

const mocks = {
  dashboard: q(FULL),
  series: q(SERIES),
  metrics: q([]),
  goals: q(FULL.goals),
  goal: q(FULL.goals[0]),
  profile: q({ preferred_unit_system: 'metric' }),
  logMetric: mutation(),
  deleteMetric: mutation(),
  createGoal: mutation(),
  updateGoal: mutation(),
  checkins: q(CHECKINS),
};

jest.mock('@/lib/query/hooks', () => ({
  useDashboard: () => mocks.dashboard,
  useBodySeries: () => mocks.series,
  useBodyMetrics: () => mocks.metrics,
  useGoals: () => mocks.goals,
  useGoal: () => mocks.goal,
  useProfile: () => mocks.profile,
  useLogBodyMetric: () => mocks.logMetric,
  useDeleteBodyMetric: () => mocks.deleteMetric,
  useCreateGoal: () => mocks.createGoal,
  useUpdateGoal: () => mocks.updateGoal,
  useCheckins: () => mocks.checkins,
  useProgressPhotos: () => q([]),
  useCreateProgressPhoto: () => mutation(),
  useDeleteProgressPhoto: () => mutation(),
  useExercises: () => q([]),
  useFoods: () => q({ data: [], meta: {} }),
}));

jest.mock('@/lib/session', () => ({
  useSession: () => ({ email: 'a@b.c', signOut: jest.fn(), profile: null }),
}));

import Home from '../home';
import Progress from '../progress/index';
import LogMetric from '../progress/log';
import WeightTrend from '../progress/weight';
import GoalsList from '../progress/goals/index';
import NewGoal from '../progress/goals/new';
import GoalDetail from '../progress/goals/[goalId]';

beforeEach(() => {
  jest.clearAllMocks();
  mockParams = { goalId: 'g1', key: 'waist_cm' };
  mocks.dashboard = q(FULL);
  mocks.series = q(SERIES);
  mocks.metrics = q([]);
  mocks.goals = q(FULL.goals);
  mocks.goal = q(FULL.goals[0]);
  mocks.logMetric = mutation();
  mocks.createGoal = mutation();
  mocks.updateGoal = mutation();
});

describe('B-01 · a brand-new user', () => {
  it('renders every domain empty rather than nothing at all', () => {
    mocks.dashboard = q(EMPTY);
    render(<Home />);

    // The FIRST dashboard anybody sees. It has to be usable.
    expect(screen.getByTestId('training-empty')).toBeTruthy();
    expect(screen.getByTestId('nutrition-empty')).toBeTruthy();
    expect(screen.getByTestId('body-empty')).toBeTruthy();
    expect(screen.getByTestId('goals-empty')).toBeTruthy();
  });

  it('draws no calorie meter when there is no target to draw against', () => {
    mocks.dashboard = q(EMPTY);
    render(<Home />);
    expect(screen.getByTestId('no-target')).toBeTruthy();
    expect(screen.queryByTestId('kcal-remaining')).toBeNull();
  });

  it('offers the first workout rather than a zeroed chart', () => {
    mocks.dashboard = q(EMPTY);
    render(<Home />);
    expect(screen.getByTestId('start-workout')).toBeTruthy();
    expect(screen.queryByTestId('training-volume')).toBeNull();
  });
});

describe('B-01 · a user with data', () => {
  it('shows the date the SERVER resolved, written for a person (B-01)', () => {
    render(<Home />);
    // Not a date computed here: the server said 2026-09-23 (I7), and the
    // header says which day that is — not "2026-09-23 / Europe/London".
    expect(screen.getByTestId('dashboard-date').props.children).toBe('Wednesday, 23 Sep');
  });

  it('is a tab root: bell and avatar, no wall of navigation buttons (G10)', () => {
    render(<Home />);
    expect(screen.getByLabelText('Notifications and reminders')).toBeTruthy();
    expect(screen.getByLabelText('Profile and settings')).toBeTruthy();
    // The avatar used to BE the sign-out button.
    expect(screen.queryByLabelText('Sign out')).toBeNull();
    // Sections are reached from the tab bar now.
    for (const id of ['go-programs', 'go-exercises', 'go-history', 'go-trends', 'go-search', 'go-quick']) {
      expect(screen.queryByTestId(id)).toBeNull();
    }
    expect(screen.getByTestId('go-customize')).toBeTruthy();
  });

  it('counts only confirmed nutrition and names what is waiting', () => {
    render(<Home />);
    expect(screen.getByTestId('kcal-remaining').props.children).toBe('920');
    // I12 — visible, and in no total.
    expect(screen.getByTestId('pending')).toBeTruthy();
  });

  it('shows an old weigh-in WITH its date rather than as if it were fresh', () => {
    render(<Home />);
    expect(screen.getByText(/Last logged 2026-09-21/)).toBeTruthy();
    expect(screen.queryByText(/Logged today/)).toBeNull();
  });

  it('surfaces an in-progress session so resume is reachable', () => {
    mocks.dashboard = q({
      ...FULL, training: { ...FULL.training, active_session_id: 'sess-9' },
    });
    render(<Home />);

    fireEvent.press(screen.getByTestId('resume-session'));
    // G4's lesson: a screen reachable only by typing a URL is not reachable.
    expect(mockPush).toHaveBeenCalledWith('/session/sess-9');
  });

  it('a goal with no measurement says so instead of showing a 0% meter', () => {
    mocks.dashboard = q({
      ...FULL,
      goals: [{ ...FULL.goals[0]!, current_value: null, progress: null }],
    });
    render(<Home />);

    // Null is not zero, and a meter at 0% makes the first read as the second.
    expect(screen.getByTestId('goal-g1-unmeasured')).toBeTruthy();
  });

  it('a goal going the wrong way says so rather than hiding behind a short meter', () => {
    mocks.dashboard = q({
      ...FULL, goals: [{ ...FULL.goals[0]!, progress: -0.2 }],
    });
    render(<Home />);
    expect(screen.getByText('Moving away from it at the moment')).toBeTruthy();
  });
});

describe('I-01 · progress overview', () => {
  it('offers to log rather than drawing a chart with nothing in it', () => {
    mocks.dashboard = q(EMPTY);
    mocks.series = q({ ...SERIES, points: [], change: null, latest: null });
    render(<Progress />);

    expect(screen.getByTestId('weight-empty')).toBeTruthy();
    expect(screen.queryByTestId('weight-line')).toBeNull();
  });

  it('refuses to draw a trend from a single point', () => {
    mocks.series = q({ ...SERIES, points: [SERIES.points[0]!], change: null });
    render(<Progress />);

    // One point is not a trend, and drawing it as one is a lie.
    expect(screen.getByTestId('weight-one-entry')).toBeTruthy();
    expect(screen.queryByTestId('weight-line')).toBeNull();
  });

  it('draws the trend once there are two', () => {
    render(<Progress />);
    expect(screen.getByTestId('weight-line')).toBeTruthy();
  });

  it('states when the last entry was, as a fact and not a scold', () => {
    render(<Progress />);
    expect(screen.getByTestId('weight-since').props.children).toBe('Last logged 2 days ago');
  });
});

describe('I-02 · logging a measurement', () => {
  it('queues the write with the unit the user chose', async () => {
    render(<LogMetric />);
    fireEvent.changeText(screen.getByTestId('metric-value'), '78.4');

    fireEvent.press(screen.getByLabelText('Save'));

    await waitFor(() => expect(mocks.logMetric.mutateAsync).toHaveBeenCalled());
    expect(mocks.logMetric.mutateAsync).toHaveBeenCalledWith(expect.objectContaining({
      metric_key: 'body_weight', value: 78.4, unit: 'kg',
    }));
  });

  it('sends pounds as pounds and lets the SERVER convert', async () => {
    render(<LogMetric />);
    fireEvent.press(screen.getByTestId('metric-units-imperial'));
    fireEvent.changeText(screen.getByTestId('metric-value'), '170');

    fireEvent.press(screen.getByLabelText('Save'));

    await waitFor(() => expect(mocks.logMetric.mutateAsync).toHaveBeenCalled());
    // One implementation of the conversion, and it is not this one (I6).
    expect(mocks.logMetric.mutateAsync).toHaveBeenCalledWith(expect.objectContaining({
      value: 170, unit: 'lb',
    }));
  });

  it('says which entry of the day counts, before it surprises anybody', () => {
    render(<LogMetric />);
    expect(screen.getByText(/first weigh-in of a day is the one charts and goals use/))
      .toBeTruthy();
  });

  it('will not save an empty value', () => {
    render(<LogMetric />);
    expect(screen.getByLabelText('Save').props.accessibilityState.disabled).toBe(true);
  });
});

describe('I-03 · weight trend', () => {
  it('marks which entry of a day is the one that counts', () => {
    mocks.metrics = q([
      { id: 'm1', metric_key: 'body_weight', value: 78.4, unit: 'kg',
        measured_at: '2026-09-23T07:30:00Z', local_date: '2026-09-23', notes: null },
      { id: 'm2', metric_key: 'body_weight', value: 79.1, unit: 'kg',
        measured_at: '2026-09-23T19:00:00Z', local_date: '2026-09-23', notes: null },
    ]);
    render(<WeightTrend />);

    // Q5, on screen: the morning figure is counted, the evening one is kept.
    expect(screen.getByText('counted')).toBeTruthy();
    expect(screen.getByText('also logged')).toBeTruthy();
  });

  it('explains the second line rather than leaving it to be guessed at', () => {
    render(<WeightTrend />);
    expect(screen.getByText(/pale line is the 7-day average/)).toBeTruthy();
  });
});

describe('J-01 … J-04 · goals', () => {
  it('lists them, and offers the first one when there are none', () => {
    mocks.goals = q([]);
    render(<GoalsList />);
    expect(screen.getByText('No goals yet')).toBeTruthy();
  });

  it('offers the latest weigh-in as a starting value, editable', async () => {
    render(<NewGoal />);
    await waitFor(() =>
      expect(screen.getByTestId('goal-start').props.value).toBe('78.4'));

    // Offered, not assumed: progress is measured from where the user says
    // they started (P02.6).
    fireEvent.changeText(screen.getByTestId('goal-start'), '80');
    expect(screen.getByTestId('goal-start').props.value).toBe('80');
  });

  it('sends the direction implied by the kind of goal', async () => {
    render(<NewGoal />);
    fireEvent.press(screen.getByTestId('goal-type-muscle_gain'));
    fireEvent.changeText(screen.getByTestId('goal-target'), '82');

    fireEvent.press(screen.getByLabelText('Set it'));

    await waitFor(() => expect(mocks.createGoal.mutateAsync).toHaveBeenCalled());
    expect(mocks.createGoal.mutateAsync).toHaveBeenCalledWith(expect.objectContaining({
      goal_type: 'muscle_gain', direction: 'up', target_value: 82,
    }));
  });

  it('offers to close a goal that has been reached', () => {
    mocks.goal = q({ ...FULL.goals[0]!, progress: 1.0 });
    render(<GoalDetail />);

    expect(screen.getByTestId('goal-reached')).toBeTruthy();
    fireEvent.press(screen.getByTestId('goal-complete'));
    expect(mocks.updateGoal.mutate).toHaveBeenCalledWith({
      id: 'g1', body: { status: 'completed' },
    });
  });

  it('does not offer to close one that has not been', () => {
    render(<GoalDetail />);
    expect(screen.queryByTestId('goal-reached')).toBeNull();
    expect(screen.getByText('32% of the way')).toBeTruthy();
  });
});


describe('I-01 · the journey and check-ins (G10)', () => {
  it('shows the weight goal as milestones, the next one named, with a projected date', () => {
    render(<Progress />);
    // 80 → 75: milestones at 78.75, 77.5, 76.25, 75. At 78.4, the first is reached.
    expect(screen.getAllByTestId('milestone-reached')).toHaveLength(1);
    expect(screen.getAllByTestId('milestone-ahead')).toHaveLength(3);
    expect(screen.getByTestId('journey-next').props.children).toMatch(/77\.5 kg/);
    expect(screen.getByTestId('journey-projection').props.children).toMatch(/current pace/);
  });

  it('says when the next check-in is due, and what changed since the first', () => {
    render(<Progress />);
    expect(screen.getByTestId('checkin-next').props.children).toBe('Next check-in: Monday, 28 Sep');
    const changes = screen.getByTestId('checkin-changes');
    expect(changes).toBeTruthy();
    expect(screen.getByText('−1.6 kg')).toBeTruthy();
    expect(screen.getByText('−2 cm')).toBeTruthy();
  });

  it('an overdue check-in is marked in words, and the button is the main action', () => {
    mocks.checkins = q({ ...CHECKINS, overdue: true, next_due: '2026-09-20' });
    render(<Progress />);
    expect(screen.getByText('Due')).toBeTruthy();
    expect(screen.getByTestId('checkin-next').props.children).toBe('Your check-in is due.');
    mocks.checkins = q(CHECKINS);
  });

  it('with no goal there is no journey card — and nothing invented', () => {
    mocks.dashboard = q({ ...FULL, goals: [] });
    render(<Progress />);
    expect(screen.queryByTestId('journey')).toBeNull();
    mocks.dashboard = q(FULL);
  });
});
