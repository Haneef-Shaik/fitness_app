import type { Exercise } from '@fitlog/api-types';

/** "chest · triceps" — primary muscles first, as the wireframes show them. */
export function muscleSummary(ex: Pick<Exercise, 'muscles'>): string {
  const names = [...(ex.muscles ?? [])]
    .sort((a, b) => (a.role === b.role ? 0 : a.role === 'primary' ? -1 : 1))
    .map((m) => m.name);
  return names.join(' · ');
}

/** Which fields this exercise actually measures. Drives C-07 and, in G3, E-03. */
export function trackedFields(ex: Pick<Exercise,
  'tracks_load' | 'tracks_reps' | 'tracks_duration' | 'tracks_distance'>): {
  load: boolean; reps: boolean; duration: boolean; distance: boolean;
} {
  return {
    load: ex.tracks_load,
    reps: ex.tracks_reps,
    duration: ex.tracks_duration,
    distance: ex.tracks_distance,
  };
}
