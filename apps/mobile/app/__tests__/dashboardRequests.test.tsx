/**
 * **How many requests does B-01 make?**
 *
 * G9's contract asks for the number before and after, because "it feels faster"
 * is not the standard this project uses. This file is the measurement, and it
 * stays in the suite afterwards as a ratchet: a future screen that quietly
 * re-introduces a fan-out fails here.
 *
 * It counts at the TRANSPORT layer — `api.get` — rather than counting hooks, so
 * a hook that secretly makes two calls is counted twice, as it should be.
 */
import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { render, waitFor } from '@testing-library/react-native';
import { createTestQueryClient } from '@/lib/query/client';
import { api } from '@/lib/api';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
  useLocalSearchParams: () => ({}),
}));

jest.mock('@/lib/api', () => ({
  API_BASE: 'http://test',
  getAccessToken: () => 'token',
  setAccessToken: jest.fn(),
  api: {
    get: jest.fn(() => Promise.resolve(mockDashboard)),
    getPaged: jest.fn(() => Promise.resolve({ data: [], meta: {} })),
    post: jest.fn(() => Promise.resolve({})),
    patch: jest.fn(() => Promise.resolve({})),
    del: jest.fn(() => Promise.resolve({})),
  },
  auth: { login: jest.fn(), register: jest.fn(), logout: jest.fn() },
  profileApi: { get: jest.fn(() => Promise.resolve(mockProfile)), patch: jest.fn() },
  goalsApi: { list: jest.fn(() => Promise.resolve([])), create: jest.fn() },
  ApiError: class extends Error {},
}));

jest.mock('@/lib/session', () => ({
  useSession: () => ({
    profile: mockProfile, email: 'a@b.c',
    signOut: jest.fn(), refreshProfile: jest.fn(),
  }),
}));

const mockProfile = {
  timezone: 'UTC', daily_calorie_target: 2400, protein_g_target: 180,
  carbs_g_target: 240, fat_g_target: 80, preferred_unit_system: 'metric',
};

const mockDashboard = {
  local_date: '2026-09-23',
  timezone: 'UTC',
  training: {
    sessions_today: 1, volume_today_kg: 4820, sessions_this_week: 3,
    volume_this_week_kg: 14300, streak_days: 2, active_session_id: null,
    last_session: {
      id: 's1', local_date: '2026-09-23', title: 'Push',
      total_volume_kg: 4820, set_count: 14,
    },
  },
  nutrition: {
    calories: 1480, protein_g: 122, carbs_g: 140, fat_g: 44,
    meals_logged: 2, pending_count: 1, incomplete: false,
    targets: { calories: 2400, protein_g: 180, carbs_g: 240, fat_g: 80 },
  },
  body: {
    latest: { local_date: '2026-09-23', value: 78.4, moving_average: 78.6 },
    today: 78.4, change_7d: -0.4, change_30d: -1.8, unit: 'kg',
  },
  goals: [],
};

import Home from '../home';

const mockGet = api.get as jest.Mock;

function harness() {
  const client = createTestQueryClient();
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { client, wrapper };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockGet.mockResolvedValue(mockDashboard);
});

it('renders a complete dashboard from EXACTLY one request', async () => {
  const { client, wrapper } = harness();

  render(<Home />, { wrapper });
  await waitFor(() => expect(mockGet).toHaveBeenCalled());
  // Let anything else that was going to fire, fire.
  await new Promise((r) => setTimeout(r, 30));

  const paths = mockGet.mock.calls.map((c) => c[0] as string);
  expect(paths).toEqual(['/dashboard']);

  client.cancelQueries();
  client.unmount();
  client.clear();
});

it('asks for no date, so the SERVER decides which day it is', async () => {
  const { client, wrapper } = harness();

  render(<Home />, { wrapper });
  await waitFor(() => expect(mockGet).toHaveBeenCalled());

  // I7. A `?date=` here would be the client having an opinion about a question
  // that is not its to answer, and it would be wrong exactly for travellers.
  expect(mockGet).toHaveBeenCalledWith('/dashboard');

  client.cancelQueries();
  client.unmount();
  client.clear();
});
