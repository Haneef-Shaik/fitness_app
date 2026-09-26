/**
 * Android · Health Connect (androidx.health.connect via react-native-health-connect).
 *
 * Read `Weight`, write `ExerciseSession`. The permission rationale screen the
 * Health Connect dialog links to is wired by the library's Expo plugin
 * (app.config.js); the Play Console also needs the two permissions declared.
 */
import type { HealthBridge } from './bridge';

type Module = typeof import('react-native-health-connect');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const hc = () => require('react-native-health-connect') as Module;

const SDK_AVAILABLE = 3;
/** `ExerciseType.STRENGTH_TRAINING` — the closest Health Connect has to lifting. */
const STRENGTH_TRAINING = 70;

let ready: Promise<boolean> | null = null;
const init = () => (ready ??= hc().initialize().catch(() => false));

export const healthConnect: HealthBridge = {
  name: 'Health Connect',

  async isAvailable() {
    try {
      return (await hc().getSdkStatus()) === SDK_AVAILABLE && (await init());
    } catch {
      return false;
    }
  },

  async requestAccess() {
    if (!(await init())) return { weight: false, workouts: false };
    const granted = await hc().requestPermission([
      { accessType: 'read', recordType: 'Weight' },
      { accessType: 'write', recordType: 'ExerciseSession' },
    ]);
    const has = (access: string, type: string) =>
      granted.some((p) => 'recordType' in p && p.accessType === access && p.recordType === type);
    return { weight: has('read', 'Weight'), workouts: has('write', 'ExerciseSession') };
  },

  async readWeights(since) {
    if (!(await init())) return [];
    const { records } = await hc().readRecords('Weight', {
      timeRangeFilter: { operator: 'after', startTime: since.toISOString() },
      ascendingOrder: true,
    });
    return records
      .filter((r) => r.metadata?.id)
      .map((r) => ({ id: r.metadata!.id!, kg: r.weight.inKilograms, measuredAt: r.time }));
  },

  async saveWorkout(w) {
    if (!(await init())) return;
    await hc().insertRecords([{
      recordType: 'ExerciseSession',
      exerciseType: STRENGTH_TRAINING,
      title: w.title,
      startTime: w.start,
      endTime: w.end,
      // Health Connect upserts on clientRecordId: saving twice is one workout.
      metadata: { clientRecordId: `fitlog-session-${w.id}`, clientRecordVersion: 1 },
    }]);
  },
};
