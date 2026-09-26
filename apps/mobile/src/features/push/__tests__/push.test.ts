import { Platform } from 'react-native';

const mockPut = jest.fn(async () => ({}));
const mockSend = jest.fn(async () => ({}));
jest.mock('@/lib/api', () => ({ api: { put: (...a: unknown[]) => mockPut(...(a as [])), send: (...a: unknown[]) => mockSend(...(a as [])) } }));
const mockPrefs: Record<string, unknown> = {};
jest.mock('@/lib/prefs', () => ({
  getPref: async (k: string, d: unknown) => (k in mockPrefs ? mockPrefs[k] : d),
  setPref: async (k: string, v: unknown) => { mockPrefs[k] = v; },
}));
let mockGranted = true;
jest.mock('@/features/permissions/primer', () => ({
  checkPermission: async () => ({ status: mockGranted ? 'granted' : 'undetermined', canAskAgain: true }),
}));
let mockProject: string | undefined = 'proj-1';
jest.mock('expo-constants', () => ({ get expoConfig() { return { extra: { eas: { projectId: mockProject } } }; } }));
jest.mock('expo-notifications', () => ({
  getExpoPushTokenAsync: jest.fn(async () => ({ data: 'ExponentPushToken[xyz]' })),
}));

import { registerForPush, unregisterPush } from '../push';

beforeEach(() => {
  jest.clearAllMocks(); mockGranted = true; mockProject = 'proj-1';
  for (const k of Object.keys(mockPrefs)) delete mockPrefs[k];
  Platform.OS = 'ios';
});

it('registers the token with the server when allowed', async () => {
  await expect(registerForPush()).resolves.toBe('registered');
  expect(mockPut).toHaveBeenCalledWith('/devices/push-token', { token: 'ExponentPushToken[xyz]', platform: 'ios' });
});

it('never asks for permission itself', async () => {
  mockGranted = false;
  await expect(registerForPush()).resolves.toBe('no-permission');
  expect(mockPut).not.toHaveBeenCalled();
});

it('does nothing until the app is linked to an Expo project', async () => {
  mockProject = undefined;
  await expect(registerForPush()).resolves.toBe('no-project');
});

it('unregisters on sign-out and forgets the token', async () => {
  await registerForPush();
  await unregisterPush();
  expect(mockSend).toHaveBeenCalledWith('DELETE', '/devices/push-token', { token: 'ExponentPushToken[xyz]', platform: 'ios' });
  expect(mockPrefs['push.token']).toBeNull();
});
