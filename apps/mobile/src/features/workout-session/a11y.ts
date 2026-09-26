/**
 * What the logger says to a screen reader, in one place so it can be tested
 * without rendering the screen. Every string here was checked against what
 * TalkBack actually spoke in G10's session (docs/a11y-audit.md), not only
 * against the accessibility tree.
 */
import type { DraftSet } from './store/types';

/** The sync state in words — the dot's colour never carries it alone (05 §3). */
export function syncWords(state: DraftSet['syncState']): string {
  return state === 'synced' ? 'Synced' : state === 'failed' ? 'Not uploaded' : 'Waiting to sync';
}

const TYPE_WORDS: Record<DraftSet['setType'], string> = {
  warmup: ', warm-up', working: '', drop: ', drop set', failure: ', to failure',
};

/** How a committed set row is read: one stop, sync state included. */
export function setRowLabel(s: DraftSet): string {
  const effort = [
    s.rpe != null ? `RPE ${s.rpe}` : null,
    s.rir != null ? `${s.rir} in reserve` : null,
  ].filter(Boolean).join(', ');
  return `Set ${s.setIndex + 1}${TYPE_WORDS[s.setType]}, `
    + `${s.loadKg ?? '—'} kilograms for ${s.reps === null ? '— reps' : plural(s.reps, 'rep', 'reps')}`
    + `${effort ? `, ${effort}` : ''}${s.note ? ', has a note' : ''}. ${syncWords(s.syncState)}`;
}

export interface SavedSet {
  setType: string;
  loadKg: number | null;
  reps: number | null;
  durationSeconds: number | null;
  distanceM: number | null;
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** Spoken once a set is committed: which set, and what it recorded. */
export function savedAnnouncement(setNumber: number, v: SavedSet): string {
  const load = v.loadKg !== null ? plural(v.loadKg, 'kilogram', 'kilograms') : null;
  const reps = v.reps !== null ? plural(v.reps, 'rep', 'reps') : null;
  const what = [
    load && reps ? `${load} for ${reps}` : load ?? reps,
    v.durationSeconds !== null ? plural(v.durationSeconds, 'second', 'seconds') : null,
    v.distanceM !== null ? plural(v.distanceM, 'metre', 'metres') : null,
  ].filter(Boolean).join(', ');
  const kind = v.setType === 'warmup' ? ', warm-up' : '';
  return `Set ${setNumber}${kind} saved${what ? `: ${what}` : ''}`;
}

/** "15 minutes 50 seconds" — a duration as words; "15:50" reads as a time of day. */
export function spokenDuration(totalSeconds: number): string {
  const t = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const sec = t % 60;
  const parts = [
    h ? plural(h, 'hour', 'hours') : null,
    m ? plural(m, 'minute', 'minutes') : null,
    sec || (!h && !m) ? plural(sec, 'second', 'seconds') : null,
  ].filter(Boolean);
  return parts.join(' ');
}

/** One exercise's line on the finish summary, read as one sentence. */
export function exerciseSummaryLabel(
  name: string | null, volumeKg: number, setCount: number, bestE1rmKg: number | null | undefined,
): string {
  const best = bestE1rmKg ? `, best estimated one-rep max ${Math.round(bestE1rmKg)} kilograms` : '';
  return `${name ?? 'Exercise'}, ${Math.round(volumeKg).toLocaleString('en-US')} kilograms, `
    + `${plural(setCount, 'set', 'sets')}${best}`;
}

/**
 * "started 55 minutes ago". The recovery prompt printed "54:36 ago" — a clock
 * reading, which TalkBack speaks as a time of day.
 */
export function startedAgo(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  if (s < 60) return 'started just now';
  if (s < 3600) return `started ${plural(Math.floor(s / 60), 'minute', 'minutes')} ago`;
  if (s < 86_400) return `started ${plural(Math.floor(s / 3600), 'hour', 'hours')} ago`;
  return `started ${plural(Math.floor(s / 86_400), 'day', 'days')} ago`;
}
