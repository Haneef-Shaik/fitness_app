/**
 * The session provider — mockAuth state for the whole app, and 0% covered from G1
 * until now.
 *
 * It decides whether a cold start lands on the splash, the login screen or the
 * dashboard, and it is where the refresh token is written. Getting it wrong
 * signs people out of a workout, which is exactly what the G3 refresh stampede
 * did from one layer down.
 */
import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react-native';
import { Text } from 'react-native';
import { SessionProvider, useSession } from '../session';

const mockApi = { tryRefresh: jest.fn() };
const mockAuth = { me: jest.fn(), login: jest.fn(), register: jest.fn(), logout: jest.fn() };
const mockProfileApi = { get: jest.fn() };
const mockSetAccessToken = jest.fn();

jest.mock('../api', () => ({
  get api() { return mockApi; },
  get auth() { return mockAuth; },
  get profileApi() { return mockProfileApi; },
  setAccessToken: (...a: unknown[]) => mockSetAccessToken(...a),
}));

const mockTokens = { value: null as string | null };
jest.mock('../storage', () => ({
  getRefreshToken: jest.fn(async () => mockTokens.value),
  setRefreshToken: jest.fn(async (t: string) => { mockTokens.value = t; }),
  clearRefreshToken: jest.fn(async () => { mockTokens.value = null; }),
}));

function Probe() {
  const { status, email } = useSession();
  return <Text testID="state">{`${status}|${email ?? '-'}`}</Text>;
}

const show = () => render(<SessionProvider><Probe /></SessionProvider>);
const state = () => screen.getByTestId('state').props.children;

beforeEach(() => {
  jest.clearAllMocks();
  mockTokens.value = null;
  mockProfileApi.get.mockResolvedValue({ onboarding_completed: true, timezone: 'UTC' });
  mockAuth.me.mockResolvedValue({ email: 'a@b.com' });
});

describe('cold start', () => {
  it('goes straight to signed-out with no stored token', async () => {
    show();
    await waitFor(() => expect(state()).toBe('signed-out|-'));
    expect(mockApi.tryRefresh).not.toHaveBeenCalled();
  });

  it('restores a session when the stored token still refreshes', async () => {
    mockTokens.value = 'stored';
    mockApi.tryRefresh.mockResolvedValue(true);

    show();

    await waitFor(() => expect(state()).toBe('ready|a@b.com'));
  });

  it('signs out when the stored token no longer refreshes', async () => {
    // Reuse detection revoked the family — the honest answer is the login screen.
    mockTokens.value = 'stale';
    mockApi.tryRefresh.mockResolvedValue(false);

    show();

    await waitFor(() => expect(state()).toBe('signed-out|-'));
  });

  it('signs out rather than hanging when the profile call fails', async () => {
    mockTokens.value = 'stored';
    mockApi.tryRefresh.mockResolvedValue(true);
    mockProfileApi.get.mockRejectedValue(new Error('500'));

    show();

    await waitFor(() => expect(state()).toBe('signed-out|-'));
  });

  it('routes to onboarding when the profile is incomplete', async () => {
    mockTokens.value = 'stored';
    mockApi.tryRefresh.mockResolvedValue(true);
    mockProfileApi.get.mockResolvedValue({ onboarding_completed: false, timezone: 'UTC' });

    show();

    await waitFor(() => expect(state()).toBe('onboarding|a@b.com'));
  });
});

describe('signing in', () => {
  it('stores the refresh token and lands ready', async () => {
    mockAuth.login.mockResolvedValue({
      access_token: 'at', refresh_token: 'rt', user: { email: 'a@b.com' },
    });
    const { result } = { result: { current: null as never } };
    function Login() {
      const s = useSession();
      (result as { current: unknown }).current = s;
      return <Text testID="state">{`${s.status}|${s.email ?? '-'}`}</Text>;
    }
    render(<SessionProvider><Login /></SessionProvider>);
    await waitFor(() => expect(state()).toBe('signed-out|-'));

    await act(async () => {
      await (result.current as unknown as { signIn: (e: string, p: string) => Promise<void> })
        .signIn('a@b.com', 'pw');
    });

    await waitFor(() => expect(state()).toBe('ready|a@b.com'));
    expect(mockSetAccessToken).toHaveBeenCalledWith('at');
    expect(mockTokens.value).toBe('rt');
  });
});

describe('signing out', () => {
  it('clears the token even when the server call fails', async () => {
    // A failed logout must not leave a token on the device.
    mockTokens.value = 'stored';
    mockApi.tryRefresh.mockResolvedValue(true);
    mockAuth.logout.mockRejectedValue(new Error('offline'));

    let session: unknown;
    function Out() {
      const s = useSession();
      session = s;
      return <Text testID="state">{`${s.status}|${s.email ?? '-'}`}</Text>;
    }
    render(<SessionProvider><Out /></SessionProvider>);
    await waitFor(() => expect(state()).toBe('ready|a@b.com'));

    await act(async () => {
      await (session as { signOut: () => Promise<void> }).signOut();
    });

    await waitFor(() => expect(state()).toBe('signed-out|-'));
    expect(mockTokens.value).toBeNull();
    expect(mockSetAccessToken).toHaveBeenLastCalledWith(null);
  });
});
