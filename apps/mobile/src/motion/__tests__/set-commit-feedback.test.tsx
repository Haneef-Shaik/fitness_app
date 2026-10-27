/**
 * DS-3 box 3: nothing animates, buzzes or announces on the set-commit path before the durable
 * local acknowledgement. Drives the real logger (WorkoutScreen) over the real member store, with a
 * local cache write the test holds open.
 */
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { AccessibilityInfo, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { createMemberStore, type MemberStore } from '@/data/member-store';
import { type LocalCache, type Profile } from '@/data/types';
import { WorkoutScreen } from '@/features/training/WorkoutScreen';
import { t } from '@/lib/i18n';
import { ThemeProvider } from '@/theme';
import { createPreferenceStore } from '@/theme/preference-store';

let mockStore: MemberStore | undefined;
let mockSessionId = '';
let mockUuid = 900;

jest.mock('@/data/MemberProvider', () => ({
  useMember: () => {
    const { useSyncExternalStore } = jest.requireActual<typeof import('react')>('react');
    if (!mockStore) throw new Error('Test store missing');
    const store = mockStore;
    const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
    return { store, profile: store.profile, ...snapshot };
  },
}));
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: mockSessionId }),
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => false }),
}));
jest.mock('expo-crypto', () => ({
  randomUUID: () => `00000000-0000-4000-8000-${String(mockUuid++).padStart(12, '0')}`,
}));
jest.mock('expo-haptics', () => ({
  notificationAsync: jest.fn(async () => {}),
  impactAsync: jest.fn(async () => {}),
  performAndroidHapticsAsync: jest.fn(async () => {}),
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy', Soft: 'soft', Rigid: 'rigid' },
  AndroidHaptics: { Confirm: 'confirm', Reject: 'reject' },
}));
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async () => null), setItem: jest.fn(async () => {}),
}));
jest.mock('react-native-safe-area-context', () => jest.requireActual('react-native-safe-area-context/jest/mock').default);

const profile: Profile = { id: '00000000-0000-4000-8000-000000000001', displayName: 'Fixture', timezone: 'Asia/Kolkata', locale: 'en', weightUnit: 'kg', lengthUnit: 'cm', weeklyGoal: 3 };

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => { resolve = done; });
  return { promise, resolve };
}

function hapticCalls() {
  return [
    ...jest.mocked(Haptics.impactAsync).mock.calls.map((call) => ['impact', ...call]),
    ...jest.mocked(Haptics.notificationAsync).mock.calls.map((call) => ['notification', ...call]),
    ...jest.mocked(Haptics.performAndroidHapticsAsync).mock.calls.map((call) => ['android', ...call]),
  ];
}

/** An in-progress workout with one exercise, offline, so sync never replaces local state mid-test. */
async function workoutInProgress() {
  let n = 10;
  const uuid = () => `00000000-0000-4000-8000-${String(n++).padStart(12, '0')}`;
  const cache: LocalCache = { read: jest.fn(async () => null), write: jest.fn(async () => {}), close: jest.fn(async () => {}), clear: jest.fn(async () => {}) };
  const offline = async () => { throw new Error('Offline'); };
  const store = createMemberStore(profile, cache, { load: jest.fn(offline), send: jest.fn(offline) }, uuid);
  const id = await store.startWorkout('Push');
  const exercise = { id: uuid(), version: 1, name: 'Bench', type: 'resistance' as const, loadBasis: 'total' as const, multiplier: 1 as const, equipment: 'Barbell', primaryMuscles: ['Chest'], secondaryMuscles: [], instructions: '', aliases: [], ownerId: profile.id, archived: false };
  await store.updateWorkout(id, (s) => ({ ...s, instances: [{ id: uuid(), exercise, prescription: null, skipped: false }] }));
  mockStore = store;
  mockSessionId = id;
  return { store, cache };
}

async function renderLogger() {
  const themeStore = createPreferenceStore({ getItem: async () => null, setItem: async () => {} });
  await themeStore.hydrate();
  render(<ThemeProvider store={themeStore}><WorkoutScreen /></ThemeProvider>);
  fireEvent.changeText(screen.getByLabelText(`${t('load')} (kg)`), '80');
  fireEvent.changeText(screen.getByLabelText(t('reps')), '8');
}

const loggedChip = () => screen.queryByRole('button', { name: `${t('edit')} 1` });

describe('set commit feedback', () => {
  it('confirms a logged set only after the durable local write, with no spinner while it is written', async () => {
    expect(Platform.OS).toBe('ios'); // jest-expo's default platform; Android's CONFIRM mapping is covered in haptics.test.ts
    const { store, cache } = await workoutInProgress();
    await renderLogger();
    const write = deferred();
    const writesBefore = jest.mocked(cache.write).mock.calls.length;
    jest.mocked(cache.write).mockImplementationOnce(() => write.promise);

    fireEvent.press(screen.getByRole('button', { name: t('logSet') }));
    await waitFor(() => expect(cache.write).toHaveBeenCalledTimes(writesBefore + 1));

    // The write is in flight and not yet acknowledged.
    expect(hapticCalls()).toEqual([]);
    expect(AccessibilityInfo.announceForAccessibility).not.toHaveBeenCalled();
    expect(loggedChip()).toBeNull();
    expect(screen.getByRole('button', { name: t('logSet') })).not.toBeBusy();

    await act(async () => { write.resolve(); });
    await waitFor(() => expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith(t('setLogged')));
    expect(hapticCalls()).toEqual([['impact', 'light']]);
    expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledTimes(1);
    expect(loggedChip()).not.toBeNull();

    await act(async () => { await store.sync(); });
  });

  it('gives no logged feedback when the durable write fails', async () => {
    const { store, cache } = await workoutInProgress();
    await renderLogger();
    jest.mocked(cache.write).mockRejectedValueOnce(new Error('Storage full'));

    fireEvent.press(screen.getByRole('button', { name: t('logSet') }));

    expect(await screen.findByText('Storage full')).toBeTruthy();
    expect(hapticCalls()).toEqual([]);
    expect(AccessibilityInfo.announceForAccessibility).not.toHaveBeenCalled();
    expect(loggedChip()).toBeNull();
    expect(store.getSnapshot().data.sessions[0]?.sets).toEqual([]);
  });
});
