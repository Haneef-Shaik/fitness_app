/**
 * Which measurements the progress screen offers (I-06).
 *
 * A **device preference**: it needs no round trip, no column and no migration.
 * A read that fails falls back to the default rather than leaving the screen
 * with nothing to show.
 */
import { getPref, setPref } from '../../lib/prefs';

const KEY = 'tracked_metrics';

/** Weight and waist. Enough to be useful, few enough not to be a chore. */
export const DEFAULT_TRACKED: readonly string[] = ['body_weight', 'waist_cm'];

export async function loadTrackedFields(): Promise<readonly string[]> {
  const value = await getPref<unknown>(KEY, DEFAULT_TRACKED);
  // A corrupted value is a reason to fall back, never to render nothing.
  return Array.isArray(value) && value.every((v) => typeof v === 'string')
    ? (value as string[])
    : DEFAULT_TRACKED;
}

export async function saveTrackedFields(keys: readonly string[]): Promise<void> {
  await setPref(KEY, [...keys]);
}
