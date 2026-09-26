/**
 * E-13 · supersets and circuits in the logger — which exercise comes next, and
 * when to rest.
 *
 * Exercises sharing a `supersetGroup` are done round-robin: a set of the first,
 * a set of the second, …, then rest, then the next round. So after a set, the
 * logger moves to the next member of the group and holds the rest timer until
 * the round is complete. An exercise in no group behaves as it always has.
 */
import type { SessionDraft } from './store/types';

export interface RoundStep {
  /** The exercise to show after this set. */
  next: number;
  /** Whether this set ended a round (or was a straight set) — rest now. */
  restNow: boolean;
}

/** Positions of the exercises sharing `index`'s group, in workout order. */
export function membersOf(draft: SessionDraft, index: number): number[] {
  const group = draft.exercises[index]?.supersetGroup ?? null;
  if (group === null) return [index];
  return draft.exercises
    .map((e, i) => ({ e, i }))
    .filter(({ e }) => (e.supersetGroup ?? null) === group && !e.skipped)
    .map(({ i }) => i);
}

export function roundStep(draft: SessionDraft, index: number): RoundStep {
  const members = membersOf(draft, index);
  if (members.length < 2) return { next: index, restNow: true };
  const at = members.indexOf(index);
  const last = at === members.length - 1;
  return { next: members[last ? 0 : at + 1]!, restNow: last };
}

/** "A", "B", … by order of first appearance, so labels read top to bottom. */
export function groupLetter(draft: SessionDraft, index: number): string | null {
  const group = draft.exercises[index]?.supersetGroup ?? null;
  if (group === null) return null;
  const seen: number[] = [];
  for (const e of draft.exercises) {
    const g = e.supersetGroup ?? null;
    if (g !== null && !seen.includes(g)) seen.push(g);
  }
  return String.fromCharCode(65 + seen.indexOf(group));
}

/** The group to give an exercise joining the next one — theirs, or a new one. */
export function groupWithNext(draft: SessionDraft, index: number): number | null {
  const here = draft.exercises[index];
  const next = draft.exercises[index + 1];
  if (!here || !next) return null;
  if (next.supersetGroup != null) return next.supersetGroup;
  if (here.supersetGroup != null) return here.supersetGroup;
  const used = new Set(draft.exercises.map((e) => e.supersetGroup).filter((g) => g != null));
  for (let g = 1; g <= 9; g++) if (!used.has(g)) return g;
  return null;
}
