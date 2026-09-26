/**
 * E-06's rules, without the sheet — set types, RPE ↔ RIR, and the one-line
 * summary the logger shows for whatever the sheet set.
 */
import type { SetType } from '@fitlog/domain';

export interface AdvancedValue {
  setType: SetType;
  rpe: number | null;
  rir: number | null;
  note: string | null;
}

export const EMPTY_ADVANCED: AdvancedValue = { setType: 'working', rpe: null, rir: null, note: null };

export const NOTE_MAX = 500;

/**
 * The consequences, stated in the UI because they change the numbers
 * (wireframe 04, E-06). Drop sets are not PR-eligible: a drop is not a clean
 * attempt at a record.
 */
export const SET_TYPES: readonly { value: SetType; label: string; consequence: string }[] = [
  { value: 'warmup', label: 'Warm-up', consequence: 'Not counted in volume or records.' },
  { value: 'working', label: 'Working', consequence: 'Counts toward volume and records.' },
  { value: 'drop', label: 'Drop', consequence: 'Counts toward volume, not records.' },
  { value: 'failure', label: 'Failure', consequence: 'Counts toward volume and records.' },
];

const clamp = (n: number) => Math.min(10, Math.max(0, Math.round(n * 2) / 2));

/**
 * RPE and RIR are two views of one judgement: `RIR ≈ 10 − RPE`. Editing one
 * **suggests** the other only while the other is empty — a value the user
 * typed is theirs, and both are stored as entered.
 */
export function withRpe(v: AdvancedValue, rpe: number | null): AdvancedValue {
  const next = rpe === null ? null : clamp(rpe);
  return { ...v, rpe: next, rir: v.rir ?? (next === null ? null : clamp(10 - next)) };
}

export function withRir(v: AdvancedValue, rir: number | null): AdvancedValue {
  const next = rir === null ? null : clamp(rir);
  return { ...v, rir: next, rpe: v.rpe ?? (next === null ? null : clamp(10 - next)) };
}

/** A note as it will be stored: trimmed, capped, and `null` when empty. */
export function cleanNote(raw: string | null, max: number = NOTE_MAX): string | null {
  const t = (raw ?? '').trim().slice(0, max);
  return t === '' ? null : t;
}

/** "Drop · RPE 8.5 · RIR 1 · note" — or null when the set is plain. */
export function advancedSummary(v: AdvancedValue): string | null {
  const parts = [
    v.setType !== 'working' ? SET_TYPES.find((t) => t.value === v.setType)!.label : null,
    v.rpe !== null ? `RPE ${v.rpe}` : null,
    v.rir !== null ? `RIR ${v.rir}` : null,
    v.note ? 'note' : null,
  ].filter(Boolean);
  return parts.length ? parts.join(' · ') : null;
}

/**
 * Quick tags for E-07 — appended, never replacing what is typed. A tag already
 * in the note is not added twice.
 */
export const QUICK_TAGS = ['felt strong', 'tired', 'short on time', 'elbow pain'] as const;

export const SESSION_NOTE_MAX = 2000;

export function appendTag(note: string, tag: string): string {
  if (note.toLowerCase().includes(tag.toLowerCase())) return note;
  const base = note.trim();
  return (base ? `${base}${/[.!?]$/.test(base) ? ' ' : '. '}` : '')
    + tag.charAt(0).toUpperCase() + tag.slice(1);
}
