import type { HealthBridge } from '../bridge';
import {
  FIRST_IMPORT_DAYS, OVERLAP_HOURS, importWeights, importWindowStart, readHealthPrefs,
  saveFinishedWorkout, writeHealthPrefs,
} from '../sync';

const mockPrefs: Record<string, unknown> = {};
jest.mock('@/lib/prefs', () => ({
  getPref: async (k: string, d: unknown) => (k in mockPrefs ? mockPrefs[k] : d),
  setPref: async (k: string, v: unknown) => { mockPrefs[k] = v; },
}));
const mockQueue = jest.fn(async (_body: unknown, _key?: string) => ({ clientId: 'x', idempotencyKey: 'y' }));
jest.mock('@/features/body/logMetric', () => ({ queueMetric: (b: unknown, k?: string) => mockQueue(b, k) }));

const A = '3f1c2b7e-8f4a-4c1d-9a0b-1234567890ab';
const bridge = (over: Partial<HealthBridge> = {}): HealthBridge => ({
  name: 'Health Connect',
  isAvailable: async () => true,
  requestAccess: async () => ({ weight: true, workouts: true }),
  readWeights: jest.fn(async () => [
    { id: A, kg: 78.456, measuredAt: '2026-09-26T06:30:00Z' },
    { id: 'not-a-uuid', kg: 78, measuredAt: '2026-09-26T06:31:00Z' },
    { id: '4f1c2b7e-8f4a-4c1d-9a0b-1234567890ab', kg: 78000, measuredAt: '2026-09-26T06:32:00Z' },
  ]),
  saveWorkout: jest.fn(async () => {}),
  ...over,
});

const NOW = new Date('2026-09-26T12:00:00Z');

beforeEach(() => { jest.clearAllMocks(); for (const k of Object.keys(mockPrefs)) delete mockPrefs[k]; });

describe('K-09 · weight in', () => {
  it('does nothing until the user turns it on', async () => {
    await expect(importWeights(bridge(), NOW)).resolves.toBe(0);
    expect(mockQueue).not.toHaveBeenCalled();
  });

  it('queues each reading under the store\'s own id, so a re-sync is the same write', async () => {
    await writeHealthPrefs({ importWeight: true });
    await expect(importWeights(bridge(), NOW)).resolves.toBe(1);

    expect(mockQueue).toHaveBeenCalledWith({
      metric_key: 'body_weight', value: 78.46, unit: 'kg', measured_at: '2026-09-26T06:30:00Z',
      client_id: A, notes: 'From Health Connect',
    }, A);
  });

  it('skips an id FitLog cannot key on, and a weight no scale reads', async () => {
    await writeHealthPrefs({ importWeight: true });
    await importWeights(bridge(), NOW);
    expect(mockQueue).toHaveBeenCalledTimes(1);
  });

  it('reads a month the first time, then from just before the last sync', async () => {
    expect(importWindowStart(null, NOW).getTime())
      .toBe(NOW.getTime() - FIRST_IMPORT_DAYS * 86_400_000);
    expect(importWindowStart('2026-09-25T12:00:00Z', NOW).toISOString())
      .toBe(new Date(Date.parse('2026-09-25T12:00:00Z') - OVERLAP_HOURS * 3_600_000).toISOString());

    await writeHealthPrefs({ importWeight: true });
    await importWeights(bridge(), NOW);
    expect((await readHealthPrefs()).lastImportAt).toBe(NOW.toISOString());
  });
});

describe('K-09 · workouts out', () => {
  const W = { id: 's1', title: 'Push', start: '2026-09-26T10:00:00Z', end: '2026-09-26T11:00:00Z' };

  it('only when asked', async () => {
    const b = bridge();
    await expect(saveFinishedWorkout(b, W)).resolves.toBe(false);
    await writeHealthPrefs({ saveWorkouts: true });
    await expect(saveFinishedWorkout(b, W)).resolves.toBe(true);
    expect(b.saveWorkout).toHaveBeenCalledWith(W);
  });

  it('a failure in the store never becomes a failed workout', async () => {
    await writeHealthPrefs({ saveWorkouts: true });
    const b = bridge({ saveWorkout: async () => { throw new Error('permission revoked'); } });
    await expect(saveFinishedWorkout(b, W)).resolves.toBe(false);
  });

  it('there is no store on the web', async () => {
    await expect(saveFinishedWorkout(null, W)).resolves.toBe(false);
  });
});
