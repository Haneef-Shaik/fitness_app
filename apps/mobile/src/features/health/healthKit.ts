/**
 * iOS · Apple Health (HealthKit via @kingstinct/react-native-healthkit).
 *
 * Read body mass, save a traditional-strength-training workout. Built and
 * type-checked; it has not run on an iPhone yet — the first iOS build is the
 * first time it will (launch plan, phase 5).
 */
import type { HealthBridge } from './bridge';

type Module = typeof import('@kingstinct/react-native-healthkit');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const hk = () => require('@kingstinct/react-native-healthkit') as Module;

const BODY_MASS = 'HKQuantityTypeIdentifierBodyMass' as const;
const WORKOUT = 'HKWorkoutTypeIdentifier' as const;

export const healthKit: HealthBridge = {
  name: 'Apple Health',

  async isAvailable() {
    try {
      return await hk().isHealthDataAvailableAsync();
    } catch {
      return false;
    }
  },

  async requestAccess() {
    // HealthKit never says whether READ was granted (a privacy choice), so
    // "asked" is the best either side can know; writing is checkable.
    await hk().requestAuthorization({ toRead: [BODY_MASS], toShare: [WORKOUT] });
    return { weight: true, workouts: true };
  },

  async readWeights(since) {
    const samples = await hk().queryQuantitySamples(BODY_MASS, {
      limit: 0, unit: 'kg', ascending: true, filter: { date: { startDate: since } },
    });
    return samples.map((s) => ({
      id: s.uuid, kg: s.quantity, measuredAt: new Date(s.startDate).toISOString(),
    }));
  },

  async saveWorkout(w) {
    const { WorkoutActivityType } = hk();
    await hk().saveWorkoutSample(
      WorkoutActivityType.traditionalStrengthTraining, [],
      new Date(w.start), new Date(w.end), undefined,
      // HKExternalUUID lets Health recognise the same workout from FitLog.
      { HKExternalUUID: `fitlog-session-${w.id}` },
    );
  },
};
