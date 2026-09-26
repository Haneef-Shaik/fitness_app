/**
 * H-15 and H-10 — the two screens where a wrong number is invisible.
 *
 * H-15's macro percentages can read 30 / 40 / 30 while summing to 99, and a
 * calorie target calculated from missing data looks exactly like one
 * calculated from real data. Both are asserted here; the arithmetic itself is
 * proved in `@fitlog/domain`.
 *
 * H-10's fields are per 100 g. A per-serving figure typed into them is wrong in
 * every meal ever logged from that food, so the label is asserted like any
 * other guard.
 */
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

const mockPush = jest.fn();
const mockReplace = jest.fn();
// The factory runs when `expo-router` is first required, which — because ES
// imports hoist — is BEFORE `const mockReplace` has been initialised. Calling
// through a wrapper defers the lookup to call time, where it exists.
jest.mock('expo-router', () => ({
  router: {
    push: (...a: unknown[]) => mockPush(...a),
    replace: (...a: unknown[]) => mockReplace(...a),
    back: jest.fn(),
  },
  useLocalSearchParams: () => mockParams,
}));

let mockParams: Record<string, string> = {};

const q = (data: unknown) => ({
  data, isPending: false, isError: false, error: null, refetch: jest.fn(),
});

// `mutateAsync` is typed to take one argument so `mock.calls[0][0]` is reachable:
// a bare `jest.fn(() => …)` infers an empty tuple and TypeScript refuses the index.
const mutation = () => ({
  mutate: jest.fn(),
  mutateAsync: jest.fn((_body?: unknown) => Promise.resolve({ id: 'f9' })),
  isPending: false,
});

const FULL_PROFILE = {
  display_name: 'A', height_cm: 180, birth_date: '1996-09-23', sex: 'male',
  preferred_unit_system: 'metric', timezone: 'UTC', week_starts_on: 1,
  activity_level: 'moderate', daily_calorie_target: null, protein_g_target: null,
  carbs_g_target: null, fat_g_target: null, onboarding_completed: true,
};

const mocks = {
  profile: q(FULL_PROFILE),
  updateProfile: mutation(),
  createFood: mutation(),
};

jest.mock('@/lib/query/hooks', () => ({
  useProfile: () => mocks.profile,
  useUpdateProfile: () => mocks.updateProfile,
  useCreateFood: () => mocks.createFood,
}));

import Targets from '../nutrition/targets';
import NewFood from '../nutrition/food/new';

beforeEach(() => {
  jest.clearAllMocks();
  mockParams = {};
  mocks.profile = q(FULL_PROFILE);
  mocks.updateProfile = mutation();
  mocks.createFood = mutation();
});

const weigh = (kg: string) => fireEvent.changeText(screen.getByTestId('target-weight'), kg);

describe('H-15 · the calculator', () => {
  it('will not invent a target, and names what it is missing', () => {
    render(<Targets />);
    // No weight yet: FitLog does not track bodyweight, so it has to ask.
    expect(screen.getByTestId('target-cannot-calculate')).toBeTruthy();
    expect(screen.getByTestId('target-cannot-calculate').props.children.join(''))
      .toContain('your weight');
  });

  it('shows the Mifflin–St Jeor working, not just the answer', () => {
    render(<Targets />);
    weigh('80');
    // 10×80 + 6.25×180 − 5×30 + 5 = 1780. A number with no working behind it
    // is indistinguishable from a guess.
    expect(screen.getByText(/BMR 1,780 × 1.55/)).toBeTruthy();
    expect(screen.getByText('Mifflin–St Jeor. An estimate.')).toBeTruthy();
  });

  it('falls back to a rougher estimate when sex is unknown, and says so', () => {
    mocks.profile = q({ ...FULL_PROFILE, sex: null });
    render(<Targets />);
    weigh('80');

    expect(screen.getByText(/rough weight-and-activity estimate/)).toBeTruthy();
    expect(screen.queryByText(/Mifflin/)).toBeNull();
    expect(screen.getByTestId('target-missing')).toBeTruthy();
  });

  it('applies the goal adjustment to the calculated figure', () => {
    render(<Targets />);
    weigh('80');
    // 1780 × 1.55 = 2759 → −10% = 2483
    expect(screen.getByText('2,483 kcal / day')).toBeTruthy();

    fireEvent.press(screen.getByTestId('target-goal-0'));
    expect(screen.getByText('2,759 kcal / day')).toBeTruthy();
  });
});

describe('H-15 · the macro interlock', () => {
  it('starts at exactly 100%', () => {
    render(<Targets />);
    expect(screen.getByText('total 100% ✓')).toBeTruthy();
  });

  it('stays at exactly 100% after a macro is moved', () => {
    render(<Targets />);

    fireEvent.press(screen.getByTestId('macro-proteinG-up'));
    fireEvent.press(screen.getByTestId('macro-proteinG-up'));

    // 30 / 40 / 30 reading as 99 is the invisible bug this asserts against.
    expect(screen.getByText('total 100% ✓')).toBeTruthy();
    expect(screen.getByTestId('macro-proteinG-pct').props.children.join('')).toBe('40%');
  });

  it('redistributes to the other two rather than only one', () => {
    render(<Targets />);

    fireEvent.press(screen.getByTestId('macro-proteinG-down'));

    expect(screen.getByTestId('macro-carbsG-pct').props.children.join('')).toBe('43%');
    expect(screen.getByTestId('macro-fatG-pct').props.children.join('')).toBe('32%');
  });

  it('shows the gap when edited grams stop totalling 100%, and blocks Save', () => {
    /**
     * Editing grams directly back-computes the percentages, and they can then
     * fall short. Quietly normalising them to 100 would hide the fact that the
     * day is under-specified — the badge exists to show exactly that, so the
     * gate has to be real and not decorative.
     */
    render(<Targets />);
    weigh('80');
    expect(screen.getByText('total 100% ✓')).toBeTruthy();

    fireEvent.changeText(screen.getByTestId('macro-proteinG-grams'), '0');

    expect(screen.getByText('total 70%')).toBeTruthy();
    expect(screen.queryByText('total 100% ✓')).toBeNull();
    expect(screen.getByLabelText('Save targets').props.accessibilityState.disabled).toBe(true);
  });

  it('applies a preset split', () => {
    render(<Targets />);

    fireEvent.press(screen.getByTestId('target-preset-lowCarb'));

    expect(screen.getByTestId('macro-carbsG-pct').props.children.join('')).toBe('20%');
    expect(screen.getByText('total 100% ✓')).toBeTruthy();
  });
});

describe('H-15 · saving', () => {
  it('opens on the saved target rather than recalculating over it', () => {
    mocks.profile = q({
      ...FULL_PROFILE, daily_calorie_target: 2000,
      protein_g_target: 150, carbs_g_target: 200, fat_g_target: 67,
    });
    render(<Targets />);
    expect(screen.getByTestId('target-calories').props.value).toBe('2000');
  });

  it('saves calories AND the gram figures the split implies', async () => {
    render(<Targets />);
    weigh('80');

    fireEvent.press(screen.getByLabelText('Save targets'));

    await waitFor(() => expect(mocks.updateProfile.mutateAsync).toHaveBeenCalled());
    // 2483 at 30/40/30 → 186 / 248 / 83 g
    expect(mocks.updateProfile.mutateAsync).toHaveBeenCalledWith({
      daily_calorie_target: 2483,
      protein_g_target: 186,
      carbs_g_target: 248,
      fat_g_target: 83,
    });
  });

  it('refuses a target outside 800–8000 and says why', () => {
    render(<Targets />);
    fireEvent.press(screen.getByTestId('target-mode-manual'));
    fireEvent.changeText(screen.getByTestId('target-calories'), '400');

    expect(screen.getByTestId('target-calorie-notice')).toBeTruthy();
    expect(screen.getByLabelText('Save targets').props.accessibilityState.disabled).toBe(true);
  });

  it('warns below 1,200 without blocking it', () => {
    render(<Targets />);
    fireEvent.press(screen.getByTestId('target-mode-manual'));
    fireEvent.changeText(screen.getByTestId('target-calories'), '1100');

    expect(screen.getByTestId('target-calorie-notice')).toBeTruthy();
    // A warning that blocked would be an error wearing a softer word.
    expect(screen.getByLabelText('Save targets').props.accessibilityState.disabled).toBe(false);
  });

  it('states that a target change does not rewrite what was logged', () => {
    render(<Targets />);
    expect(
      screen.getByText(/Nothing you have already logged is rewritten/),
    ).toBeTruthy();
  });
});

describe('H-10 · a custom food', () => {
  it('says the numbers are per 100 g, twice', () => {
    render(<NewFood />);
    expect(screen.getByText('Nutrition per 100 g')).toBeTruthy();
    // And again on the field, because the card scrolls away.
    expect(screen.getByLabelText('Calories /100 g')).toBeTruthy();
  });

  it('sends what was typed, with blanks as null rather than zero', async () => {
    render(<NewFood />);

    fireEvent.changeText(screen.getByTestId('food-name'), 'Nana bread');
    fireEvent.changeText(screen.getByTestId('food-calories'), '280');
    fireEvent.changeText(screen.getByTestId('food-protein_g'), '4.5');

    fireEvent.press(screen.getByLabelText('Save food'));

    await waitFor(() => expect(mocks.createFood.mutateAsync).toHaveBeenCalled());
    expect(mocks.createFood.mutateAsync).toHaveBeenCalledWith({
      name: 'Nana bread',
      calories: 280, protein_g: 4.5,
      // "We do not know the fat" is not "there is no fat".
      carbs_g: null, fat_g: null, serving_grams: null,
    });
  });

  it('accepts a comma as a decimal separator', async () => {
    render(<NewFood />);
    fireEvent.changeText(screen.getByTestId('food-name'), 'Yoghurt');
    fireEvent.changeText(screen.getByTestId('food-fat_g'), '3,6');

    fireEvent.press(screen.getByLabelText('Save food'));

    await waitFor(() => expect(mocks.createFood.mutateAsync).toHaveBeenCalled());
    const body = mocks.createFood.mutateAsync.mock.calls[0]![0] as { fat_g: number };
    expect(body.fat_g).toBe(3.6);
  });
});
