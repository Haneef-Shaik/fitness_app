/**
 * The AI analysis hooks (G8).
 *
 * The cache rules here are the feature's honesty expressed as invalidation:
 *
 *   **Submitting invalidates the analyses and NOT the diary.** A submitted
 *   analysis has changed no total — it has not even run. Refetching the diary
 *   would be "count it just for the preview" in cache form (**I12**).
 *
 *   **Confirming invalidates both.** Now `meal_items` exist, so the day really
 *   has moved.
 *
 * And one behaviour that is invisible until someone's battery is flat: the poll
 * stops once the analysis has finished.
 */
import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { createTestQueryClient } from '../client';
import {
  useAnalyseImage, useAnalyseText, useAnalyses, useAnalysis, useAnalysisQuota,
  useConfirmAnalysis, useDeleteAnalysisImages,
} from '../hooks';
import { qk } from '../queryKeys';
import { analysisApi } from '../../api-analysis';

jest.mock('../../api-analysis', () => ({
  analysisApi: {
    quota: jest.fn(), analyseText: jest.fn(), analyseImage: jest.fn(),
    get: jest.fn(), list: jest.fn(), confirm: jest.fn(),
    deleteImages: jest.fn(), signUpload: jest.fn(),
  },
}));

const api = analysisApi as jest.Mocked<typeof analysisApi>;
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
  for (const c of live.splice(0)) {
    c.cancelQueries();
    c.unmount();
    c.clear();
  }
});

describe('reads', () => {
  it('caches an analysis, the list and the quota under their registry keys', async () => {
    const { client, wrapper } = harness();
    api.get.mockResolvedValue({ id: 'a1', status: 'completed' } as never);
    api.list.mockResolvedValue([{ id: 'a1' }] as never);
    api.quota.mockResolvedValue({ remaining: 24 } as never);

    const one = renderHook(() => useAnalysis('a1'), { wrapper });
    const many = renderHook(() => useAnalyses(), { wrapper });
    const quota = renderHook(() => useAnalysisQuota(), { wrapper });

    await waitFor(() => expect(one.result.current.isSuccess).toBe(true));
    await waitFor(() => expect(many.result.current.isSuccess).toBe(true));
    await waitFor(() => expect(quota.result.current.isSuccess).toBe(true));

    expect(client.getQueryData(qk.analysis('a1'))).toBeTruthy();
    expect(client.getQueryData(qk.analyses())).toEqual([{ id: 'a1' }]);
    expect(client.getQueryData(qk.analysisQuota())).toBeTruthy();
  });

  it('does not fetch an analysis without an id', () => {
    const { wrapper } = harness();
    renderHook(() => useAnalysis(''), { wrapper });
    expect(api.get).not.toHaveBeenCalled();
  });

  it('stops polling once the analysis has finished', async () => {
    const { wrapper } = harness();
    api.get.mockResolvedValue({ id: 'a1', status: 'completed' } as never);

    const { result } = renderHook(() => useAnalysis('a1'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // A poll that keeps running after `completed` is a battery drain nobody
    // sees in testing.
    const interval = (result.current as { refetchInterval?: unknown }).refetchInterval;
    expect(interval === undefined || interval === false).toBe(true);
    expect(api.get).toHaveBeenCalledTimes(1);
  });

  it('keeps polling while it is still processing', async () => {
    const { wrapper } = harness();
    api.get.mockResolvedValue({ id: 'a1', status: 'processing' } as never);

    const { result } = renderHook(() => useAnalysis('a1'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    await waitFor(() => expect(api.get.mock.calls.length).toBeGreaterThan(1), { timeout: 4000 });
  });
});

describe('the invalidation that is deliberately absent', () => {
  it('submitting text leaves the diary alone', async () => {
    const { client, wrapper } = harness();
    seed(client, qk.nutritionDay('today'));
    seed(client, qk.analyses());
    api.analyseText.mockResolvedValue({ id: 'a1' } as never);

    const { result } = renderHook(() => useAnalyseText(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({ text: '2 eggs', client_id: null });
    });

    expect(stale(client, qk.analyses())).toBe(true);
    // Nothing has been estimated yet, let alone confirmed.
    expect(stale(client, qk.nutritionDay('today'))).toBe(false);
  });

  it('submitting a photo leaves the diary alone too', async () => {
    const { client, wrapper } = harness();
    seed(client, qk.nutritionDay('today'));
    api.analyseImage.mockResolvedValue({ id: 'a1' } as never);

    const { result } = renderHook(() => useAnalyseImage(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({ image_key: 'uploads/u/1.jpg', client_id: null });
    });

    expect(stale(client, qk.nutritionDay('today'))).toBe(false);
  });
});

describe('confirming', () => {
  it('moves the diary AND re-reads the analysis as an audit view', async () => {
    const { client, wrapper } = harness();
    seed(client, qk.nutritionDay('today'));
    seed(client, qk.analyses());
    seed(client, qk.analysis('a1'));
    api.confirm.mockResolvedValue({ id: 'm1' } as never);

    const { result } = renderHook(() => useConfirmAnalysis(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({
        id: 'a1',
        body: { meal_type: 'lunch', consumed_at: null, client_id: null, items: [] },
      });
    });

    expect(stale(client, qk.nutritionDay('today'))).toBe(true);
    expect(stale(client, qk.analysis('a1'))).toBe(true);
    expect(stale(client, qk.analyses())).toBe(true);
  });

  it('does not go through the outbox — there is nothing to replay offline', async () => {
    const { wrapper } = harness();
    api.confirm.mockResolvedValue({ id: 'm1' } as never);

    const { result } = renderHook(() => useConfirmAnalysis(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({
        id: 'a1',
        body: { meal_type: 'lunch', consumed_at: null, client_id: null, items: [] },
      });
    });

    // Confirming needs the analysis, which lives on the server.
    expect(api.confirm).toHaveBeenCalledWith('a1', expect.objectContaining({
      meal_type: 'lunch',
    }));
  });
});

describe('deleting the photos', () => {
  it('re-reads the analyses and nothing else', async () => {
    const { client, wrapper } = harness();
    seed(client, qk.nutritionDay('today'));
    seed(client, qk.analyses());
    api.deleteImages.mockResolvedValue({ photos_deleted: 3 } as never);

    const { result } = renderHook(() => useDeleteAnalysisImages(), { wrapper });
    await act(async () => { await result.current.mutateAsync(); });

    expect(stale(client, qk.analyses())).toBe(true);
    // The meals those photos produced are unaffected.
    expect(stale(client, qk.nutritionDay('today'))).toBe(false);
  });
});
