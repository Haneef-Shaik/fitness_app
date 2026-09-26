/**
 * K-09 · what moves between FitLog and the health store, and when.
 *
 * **Weight in** goes through the ordinary outbox as a body metric whose
 * `client_id` AND idempotency key are the store's own uuid for the reading:
 * the server stores one weigh-in however often it is synced (I8), and the
 * phone queues one write however often it looks. Readings are imported from
 * a little before the last sync, so one that arrived late is still picked up.
 *
 * **Workouts out** happen once, when a workout is finished, and never block
 * finishing: the health store is a courtesy copy, and a failure there must
 * not look like a failed workout.
 */
import { getPref, setPref } from '@/lib/prefs';
import { queueMetric } from '@/features/body/logMetric';
import type { HealthBridge, HealthWorkout } from './bridge';

export const HEALTH_PREF = 'health.integration';

export interface HealthPrefs {
  importWeight: boolean;
  saveWorkouts: boolean;
  /** ISO time of the last successful weight import. */
  lastImportAt: string | null;
}

export const DEFAULT_HEALTH_PREFS: HealthPrefs = { importWeight: false, saveWorkouts: false, lastImportAt: null };

/** How far back the first import reaches, and how much each sync overlaps. */
export const FIRST_IMPORT_DAYS = 30;
export const OVERLAP_HOURS = 48;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function readHealthPrefs(): Promise<HealthPrefs> {
  return { ...DEFAULT_HEALTH_PREFS, ...(await getPref<Partial<HealthPrefs>>(HEALTH_PREF, {})) };
}

export async function writeHealthPrefs(patch: Partial<HealthPrefs>): Promise<HealthPrefs> {
  const next = { ...(await readHealthPrefs()), ...patch };
  await setPref(HEALTH_PREF, next);
  return next;
}

export function importWindowStart(lastImportAt: string | null, now: Date): Date {
  if (!lastImportAt) return new Date(now.getTime() - FIRST_IMPORT_DAYS * 86_400_000);
  return new Date(Date.parse(lastImportAt) - OVERLAP_HOURS * 3_600_000);
}

/** Pulls weigh-ins since the last sync into the outbox. Returns how many were queued. */
export async function importWeights(bridge: HealthBridge, now: Date = new Date()): Promise<number> {
  const prefs = await readHealthPrefs();
  if (!prefs.importWeight) return 0;
  const readings = await bridge.readWeights(importWindowStart(prefs.lastImportAt, now));

  let queued = 0;
  for (const r of readings) {
    // The store's id becomes FitLog's client id, so it must be a uuid; a kg
    // outside what FitLog accepts is a unit mix-up upstream, not a weigh-in.
    if (!UUID.test(r.id) || !(r.kg > 0 && r.kg <= 1000)) continue;
    await queueMetric({
      metric_key: 'body_weight', value: Math.round(r.kg * 100) / 100, unit: 'kg',
      measured_at: r.measuredAt, client_id: r.id, notes: `From ${bridge.name}`,
    }, r.id);
    queued += 1;
  }
  await writeHealthPrefs({ lastImportAt: now.toISOString() });
  return queued;
}

/** Copies a finished workout to the store, if the user asked for that. Never throws. */
export async function saveFinishedWorkout(bridge: HealthBridge | null, workout: HealthWorkout): Promise<boolean> {
  if (!bridge) return false;
  try {
    if (!(await readHealthPrefs()).saveWorkouts) return false;
    await bridge.saveWorkout(workout);
    return true;
  } catch {
    return false;
  }
}
