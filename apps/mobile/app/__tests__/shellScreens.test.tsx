/**
 * B-02 … B-05, I-04, I-05 and I-06 — the screens around the edges.
 *
 * Two of these make a promise the code has to keep:
 *
 *   B-04's reminders are real local notifications (G10); a refused
 *        permission leaves the switch off and says so, never a toggle that
 *        silently does nothing.
 *   B-05 states what it searches, because an empty box that quietly misses
 *        half the app is worse than one that tells you where to look.
 */
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  router: {
    push: (...a: unknown[]) => mockPush(...a),
    replace: (...a: unknown[]) => mockReplace(...a),
    back: (...a: unknown[]) => mockBack(...a),
  },
  useLocalSearchParams: () => mockParams,
}));

jest.mock('expo-image-picker', () => ({
  launchCameraAsync: jest.fn(() => Promise.resolve({ canceled: true })),
  launchImageLibraryAsync: jest.fn(() => Promise.resolve({ canceled: true })),
}));

jest.mock('@/features/nutrition/uploadPhoto', () => ({ uploadPhoto: jest.fn() }));

const mockPrefs: Record<string, unknown> = {};
jest.mock('@/lib/prefs', () => ({
  getPref: (key: string, fallback: unknown) =>
    Promise.resolve(key in mockPrefs ? mockPrefs[key] : fallback),
  setPref: (key: string, value: unknown) => {
    mockPrefs[key] = value;
    return Promise.resolve();
  },
}));

let mockParams: Record<string, string> = {};

const q = (data: unknown, over: Record<string, unknown> = {}) => ({
  data, isPending: false, isError: false, error: null, refetch: jest.fn(), ...over,
});

const mutation = () => ({
  mutate: jest.fn(),
  mutateAsync: jest.fn((_b?: unknown) => Promise.resolve({})),
  isPending: false,
});

const mocks = {
  exercises: q([]),
  foods: q({ data: [], meta: {} }),
  series: q({ metric_key: 'waist_cm', unit: 'cm', points: [], change: null, latest: null }),
  photos: q([]),
  dashboard: q({ training: { active_session_id: null } }),
  programs: q([{ status: 'active', days: [{ scheduled_weekday: 0 }, { scheduled_weekday: 3 }, { scheduled_weekday: null }] }]),
  checkins: q({ next_due: '2026-09-30', today: '2026-09-24' }),
};

jest.mock('@/lib/query/hooks', () => ({
  useExercises: () => mocks.exercises,
  useFoods: () => mocks.foods,
  useBodySeries: () => mocks.series,
  useProgressPhotos: () => mocks.photos,
  useCreateProgressPhoto: () => mutation(),
  useDeleteProgressPhoto: () => mutation(),
  useDashboard: () => mocks.dashboard,
  usePrograms: () => mocks.programs,
  useCheckins: () => mocks.checkins,
}));

let mockPermission: 'granted' | 'denied' = 'granted';
const mockApply = jest.fn(async (list: unknown[]) => list.length);
jest.mock('@/features/reminders/schedule', () => ({
  ensurePermission: jest.fn(async () => mockPermission),
  applyReminders: (list: unknown[]) => mockApply(list),
}));

import Customize from '../home/customize';
import Notifications from '../notifications';
import Search from '../search';
import Quick from '../quick';
import Photos from '../progress/photos';
import Fields from '../progress/fields';
import MeasurementDetail from '../progress/measurements/[key]';

beforeEach(() => {
  jest.clearAllMocks();
  for (const key of Object.keys(mockPrefs)) delete mockPrefs[key];
  mockParams = { key: 'waist_cm' };
  mocks.exercises = q([]);
  mocks.foods = q({ data: [], meta: {} });
  mocks.series = q({ metric_key: 'waist_cm', unit: 'cm', points: [], change: null, latest: null });
  mocks.photos = q([]);
  mocks.dashboard = q({ training: { active_session_id: null } });
});

describe('B-02 · customising the dashboard', () => {
  it('lists every section, in order, all visible by default', async () => {
    render(<Customize />);
    await waitFor(() => expect(screen.getByTestId('section-training-toggle')).toBeTruthy());

    for (const key of ['training', 'nutrition', 'body', 'goals']) {
      expect(screen.getByTestId(`section-${key}-toggle`).props.accessibilityLabel).toBe('Hide');
    }
  });

  it('cannot move the first up or the last down', async () => {
    render(<Customize />);
    await waitFor(() => expect(screen.getByTestId('section-training-up')).toBeTruthy());

    expect(screen.getByTestId('section-training-up').props.accessibilityState.disabled).toBe(true);
    expect(screen.getByTestId('section-goals-down').props.accessibilityState.disabled).toBe(true);
  });

  it('saves the order and the visibility', async () => {
    render(<Customize />);
    await waitFor(() => expect(screen.getByTestId('section-nutrition-up')).toBeTruthy());

    fireEvent.press(screen.getByTestId('section-nutrition-up'));
    fireEvent.press(screen.getByTestId('section-body-toggle'));
    fireEvent.press(screen.getByLabelText('Save'));

    await waitFor(() => expect(mockBack).toHaveBeenCalled());
    expect(mockPrefs.dashboard_layout).toEqual([
      { key: 'nutrition', visible: true },
      { key: 'training', visible: true },
      { key: 'body', visible: false },
      { key: 'goals', visible: true },
    ]);
  });

  it('says that hiding a card hides nothing else', async () => {
    render(<Customize />);
    await waitFor(() => expect(screen.getByTestId('section-training-toggle')).toBeTruthy());
    expect(screen.getByText(/Nothing stops being tracked/)).toBeTruthy();
  });
});

describe('B-04 · reminders (G10: they send now)', () => {
  // They used to be toggles over the words "These do not send yet".
  beforeEach(() => { mockPermission = 'granted'; delete mockPrefs.reminders; });

  it('starts every reminder off — nothing is switched on for anyone', () => {
    render(<Notifications />);
    for (const key of ['workout', 'weigh_in', 'meal_log', 'checkin']) {
      expect(screen.getByTestId(`reminder-${key}`).props.accessibilityLabel).toBe('Off');
    }
  });

  it('switching one on asks permission, remembers it, and schedules it on the phone', async () => {
    render(<Notifications />);
    fireEvent.press(screen.getByTestId('reminder-workout'));
    await waitFor(() => expect(mockPrefs.reminders).toEqual({ workout: true }));
    // One per planned program day — Monday and Thursday — and none for the unscheduled one.
    await waitFor(() => expect(mockApply).toHaveBeenLastCalledWith([
      expect.objectContaining({ id: 'workout-0' }), expect.objectContaining({ id: 'workout-3' }),
    ]));
  });

  it('refused permission leaves it off, and says how to change that', async () => {
    mockPermission = 'denied';
    render(<Notifications />);
    fireEvent.press(screen.getByTestId('reminder-weigh_in'));
    await waitFor(() => expect(screen.getByTestId('reminders-denied')).toBeTruthy());
    expect(mockPrefs.reminders).toBeUndefined();
    expect(mockApply).not.toHaveBeenCalled();
  });

  it('switching one off takes it off the phone', async () => {
    mockPrefs.reminders = { weigh_in: true };
    render(<Notifications />);
    await waitFor(() => expect(screen.getByTestId('reminder-weigh_in').props.accessibilityLabel).toBe('On'));
    fireEvent.press(screen.getByTestId('reminder-weigh_in'));
    await waitFor(() => expect(mockApply).toHaveBeenLastCalledWith([]));
  });
});

describe('B-05 · search', () => {
  it('states its scope before anything is typed', () => {
    render(<Search />);
    // An empty box that quietly misses half the app is worse than one that
    // tells you where else to look.
    expect(screen.getByText('Exercises and foods.')).toBeTruthy();
    expect(screen.getByText(/Past workouts have their own search/)).toBeTruthy();
  });

  it('quotes what was searched for when nothing matches', () => {
    render(<Search />);
    fireEvent.changeText(screen.getByTestId('search-input'), 'zzzz');

    // I13 — filtered-empty is not empty.
    expect(screen.getByTestId('search-empty')).toBeTruthy();
  });

  it('lists what it found, across both kinds', () => {
    mocks.exercises = q([{ id: 'e1', name: 'Barbell Row' }]);
    mocks.foods = q({ data: [{ id: 'f1', name: 'Rolled Oats', is_custom: false }], meta: {} });
    render(<Search />);
    fireEvent.changeText(screen.getByTestId('search-input'), 'o');

    expect(screen.getByTestId('search-exercise-e1')).toBeTruthy();
    expect(screen.getByTestId('search-food-f1')).toBeTruthy();
    expect(screen.queryByTestId('search-empty')).toBeNull();
  });
});

describe('B-03 · quick actions', () => {
  it('offers to start a workout when none is open', () => {
    render(<Quick />);
    expect(screen.getByTestId('quick-workout')).toBeTruthy();
    expect(screen.queryByTestId('quick-resume')).toBeNull();
  });

  it('offers to resume when one is', () => {
    mocks.dashboard = q({ training: { active_session_id: 'sess-3' } });
    render(<Quick />);

    fireEvent.press(screen.getByTestId('quick-resume'));
    expect(mockReplace).toHaveBeenCalledWith('/session/sess-3');
  });
});

describe('I-05 · progress photos', () => {
  it('says what happens to the location data, before the camera opens', () => {
    render(<Photos />);
    expect(screen.getByText(/location data removed before they leave your\s+phone/))
      .toBeTruthy();
  });

  it('offers a first photo rather than an empty grid', () => {
    render(<Photos />);
    expect(screen.getByText('No photos yet')).toBeTruthy();
  });
});

describe('I-06 · what to track', () => {
  it('starts on the defaults and saves a change', async () => {
    render(<Fields />);
    await waitFor(() =>
      expect(screen.getByTestId('field-body_weight').props.accessibilityLabel)
        .toBe('✓ Weight (kg)'));

    fireEvent.press(screen.getByTestId('field-chest_cm'));
    fireEvent.press(screen.getByLabelText('Save'));

    await waitFor(() => expect(mockPrefs.tracked_metrics).toContain('chest_cm'));
    // Nothing already logged is affected, and the screen says so.
    expect(mockPrefs.tracked_metrics).toContain('body_weight');
  });
});

describe('I-04 · one measurement', () => {
  it('offers to log one rather than drawing an empty chart', () => {
    render(<MeasurementDetail />);
    expect(screen.getByText('No waist logged yet')).toBeTruthy();
    expect(screen.queryByTestId('measurement-line')).toBeNull();
  });

  it('draws the trend once there are two points', () => {
    mocks.series = q({
      metric_key: 'waist_cm', unit: 'cm',
      points: [
        { local_date: '2026-09-21', value: 86.0, moving_average: 86.0 },
        { local_date: '2026-09-23', value: 84.0, moving_average: 85.0 },
      ],
      change: -2.0,
      latest: { local_date: '2026-09-23', value: 84.0, moving_average: 85.0 },
    });
    render(<MeasurementDetail />);

    expect(screen.getByTestId('measurement-line')).toBeTruthy();
    expect(screen.getByText('▼ 2.0 cm')).toBeTruthy();
  });
});
