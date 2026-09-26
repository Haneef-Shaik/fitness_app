/**
 * K-07 and K-08's reads and writes (launch).
 *
 *   **K-08's usage moves when an analysis is submitted** — it lives under the
 *   analyses prefix, so the rule that already refreshes the quota reaches it.
 *
 *   **Deleting every photo refreshes both places photos are shown** — the
 *   analyses (H-18) and the progress gallery (I-05) — and NOT the diary: a
 *   meal saved from a food photo keeps its numbers.
 */
import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { createTestQueryClient } from '../client';
import { useAnalyseText, useAnalysisSettings, useDeleteAllPhotos } from '../hooks';
import { qk, qkPrefix } from '../queryKeys';
import { analysisApi } from '../../api-analysis';
import { accountApi } from '../../api-account';

jest.mock('../../api-analysis', () => ({
  analysisApi: { settings: jest.fn(), analyseText: jest.fn() },
}));
jest.mock('../../api-account', () => ({
  accountApi: { deletePhotos: jest.fn(), export: jest.fn(), delete: jest.fn() },
}));

const analysis = analysisApi as jest.Mocked<typeof analysisApi>;
const account = accountApi as jest.Mocked<typeof accountApi>;
const live: ReturnType<typeof createTestQueryClient>[] = [];

function harness() {
  const client = createTestQueryClient();
  live.push(client);
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { client, wrapper };
}

const seed = (client: ReturnType<typeof createTestQueryClient>, key: readonly unknown[]) =>
  client.setQueryData(key as unknown[], { seeded: true });
const stale = (client: ReturnType<typeof createTestQueryClient>, key: readonly unknown[]) =>
  client.getQueryState(key as unknown[])?.isInvalidated ?? false;

beforeEach(() => jest.clearAllMocks());
afterEach(() => {
  for (const c of live.splice(0)) { c.cancelQueries(); c.unmount(); c.clear(); }
});

const SETTINGS = {
  provider: 'anthropic', provider_name: 'Anthropic', model: 'claude-sonnet-5',
  sends_to_provider: true, low_confidence_threshold: 0.5,
  quota: { used: 1, limit: 25, remaining: 24, resets_at: '2026-09-27T00:00:00+05:30' },
};

it('reads K-08 under the analyses prefix', async () => {
  analysis.settings.mockResolvedValue(SETTINGS as never);
  const { wrapper } = harness();
  const { result } = renderHook(() => useAnalysisSettings(), { wrapper });
  await waitFor(() => expect(result.current.data).toEqual(SETTINGS));
  expect(qk.analysisSettings().slice(0, 1)).toEqual(qkPrefix.analyses());
});

it('submitting an analysis makes K-08 stale', async () => {
  analysis.analyseText.mockResolvedValue({ id: 'a1' } as never);
  const { client, wrapper } = harness();
  seed(client, qk.analysisSettings());

  const { result } = renderHook(() => useAnalyseText(), { wrapper });
  await act(async () => { await result.current.mutateAsync({ text: '2 eggs' } as never); });
  expect(stale(client, qk.analysisSettings())).toBe(true);
});

it('deleting every photo refreshes the analyses and the gallery, not the diary', async () => {
  account.deletePhotos.mockResolvedValue({
    files_deleted: 3, progress_photos_deleted: 1, analyses_kept: 1,
  });
  const { client, wrapper } = harness();
  seed(client, qk.analyses());
  seed(client, qk.progressPhotos());
  seed(client, qk.nutritionDay('2026-09-26'));

  const { result } = renderHook(() => useDeleteAllPhotos(), { wrapper });
  await act(async () => { await result.current.mutateAsync(); });

  expect(account.deletePhotos).toHaveBeenCalledTimes(1);
  expect(stale(client, qk.analyses())).toBe(true);
  expect(stale(client, qk.progressPhotos())).toBe(true);
  expect(stale(client, qk.nutritionDay('2026-09-26'))).toBe(false);
});
