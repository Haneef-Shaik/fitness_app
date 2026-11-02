import { M2_BAN_CLASSES } from './mb1-replay-evidence.mjs';

// The MB-1 replay runner's plan order (phase2-plan.md) as pure functions of its state: what each command needs before it
// runs, or null. Moved out of mb1-replay.mjs unchanged in phase 1G, with review bbe2fbba's rules added (findings 1, 2 and 4).
// Phase 1H (review 2026-10-26T2000Z): M2 counts its first pass or its stop, a stop blocks shared-apply even after a pass
// (finding 1), and a STOP recorded after migrate halts every command (finding 2). Phase 1I (review 2026-10-26T2305Z): the
// halt also follows a STOP recorded after db diff or db lint, and names the command (finding 4).
// Nothing here runs a command, reads a file or touches a database.

const SUITE_SPACING_MS = 75_000;

export function spacing(state, stack, now) {
  const last = state.suites.filter((entry) => entry.stack === stack).at(-1);
  const wait = last ? last.endedAt + SUITE_SPACING_MS - now : 0;
  return wait > 0 ? `wait ${Math.ceil(wait / 1000)} s more: suites on one stack run at least 75 s apart (each makes six sign-ins; GoTrue allows 30 per 5 minutes)` : null;
}
export const passed = (state, expect, generation = 1, stack = 'replay') => state.suites.some((entry) => entry.stack === stack && entry.expect === expect && entry.ok && entry.generation >= generation);
const lastRestoreUnproved = (state) => state.mutations.length > 0 && !state.restoredProof;
/** A recorded epoch-ms time as ISO 8601, or 'an unknown time' for anything a hand-edited state might hold. */
const isoAt = (ms) => (Number.isFinite(ms) && Math.abs(ms) <= 8.64e15 ? new Date(ms).toISOString() : 'an unknown time');

/** The commands that record a STOP after their CLI (review 2026-10-26T2305Z finding 4 added diff and lint), by recorded op. */
const STOP_OPS = Object.freeze({ migrate: 'migration up', diff: 'db diff', lint: 'db lint' });
/**
 * Review 2026-10-26T2000Z finding 2: a STOP recorded after migrate, diff or lint (the replay's input changed while its CLI ran)
 * halts every command, before any child process, until the coordinator reviews it and removes the record by hand, as with the
 * lock. Any other or missing op (a hand-edited state) reads as migrate's, the only op recorded before phase 1I; it still halts.
 */
export function haltNeeds(state) {
  if (!state.stopRecorded) return null;
  const { op } = Object(state.stopRecorded);
  const ran = typeof op === 'string' && Object.hasOwn(STOP_OPS, op) ? STOP_OPS[op] : STOP_OPS.migrate;
  return `a STOP was recorded at ${isoAt(state.stopRecorded.at)}: the replay's input changed while ${ran} ran, so where it wrote is unknown (55321 included), and nothing runs on this replay until the coordinator reviews it and removes stopRecorded from state.json by hand (review 2026-10-26T2000Z finding 2)`;
}
/** Review 2026-10-26T2000Z finding 1: the first M2 run of a kind (`m2Stopped` or a pass), which no later run may replace. */
const firstStop = (state) => state.suites.find((entry) => entry.m2Stopped);
const firstM2Pass = (state) => state.suites.find((entry) => entry.stack === 'replay' && entry.expect === 'm2' && entry.ok && entry.generation >= 1);
export function snapshotNeeds(state, label) {
  switch (label) {
    // Review bbe2fbba finding 4: the before snapshot has nothing to be compared with, and 55321's must later equal it, so a
    // retake would replace a verified reference unchecked. A failed attempt records nothing, so it is no reference.
    case 'before':
      if (state.snapshots.before) return `snapshot before is the reference every later snapshot is compared with, so it is taken once and never retaken (review bbe2fbba finding 4): the one taken at ${isoAt(state.snapshots.before.at)} stands`;
      return state.candidate === 'absent' && state.generation === 1 ? null : 'snapshot before is taken on the first start, before add-candidate';
    case 'after': return state.candidate === 'applied' && state.active === null && state.generation === 1 ? null : 'snapshot after needs the candidate applied by migrate and no mutation applied';
    case 'm1': case 'm2': case 'm3': return state.active === label ? null : `snapshot ${label} needs ${label} applied (now ${state.active ?? 'none'})`;
    case 'restored': return state.active === null && state.mutations.length ? null : 'snapshot restored needs a mutation applied and then restored';
    case 'fresh16': return state.generation >= 2 && state.candidate === 'applied' ? null : 'snapshot fresh16 needs a fresh start with all 16 migrations (stop, then start)';
    default: return `unknown snapshot label ${label}; use before, after, m1, m2, m3, restored or fresh16`;
  }
}
export function mutateNeeds(state, name) {
  if (name === 'restore-m1') return state.active === 'm1' ? null : `restore-m1 restores m1, not ${state.active ?? 'nothing'}`;
  if (name === 'restore-member-active') return ['m2', 'm3'].includes(state.active) ? null : `restore-member-active restores m2 or m3, not ${state.active ?? 'nothing'}`;
  if (!['m1', 'm2', 'm3'].includes(name)) return `unknown mutation ${name}; use m1, m2, m3, restore-m1 or restore-member-active`;
  // M2's expectation depends on the reference ban answer. Under "ended" the session clause refuses member C with or without
  // the ban clause, so no M2 SQL is ever sent (review bbe2fbba finding 2); without a reference there is no expectation (F6).
  if (name === 'm2' && state.ban === 'ended') return 'mutate m2 is refused: the reference ban answer is "ended": GoTrue ended member C\'s session, so the session clause refuses its read with or without the ban clause, and no M2 run can show the ban clause is needed (review bbe2fbba finding 2); M2 needs a fresh replay whose reference is "live" or "banned", or the separately reviewed M2b';
  if (name === 'm2' && !M2_BAN_CLASSES.includes(state.ban)) return `mutate m2 is refused: no reference ban answer of "live" or "banned" is recorded (it is ${state.ban ?? 'none'}), so M2 has no expectation`;
  if (state.active) return `mutate ${name} needs no mutation applied (${state.active} is)`;
  if (state.candidate !== 'applied' || state.generation !== 1 || !state.snapshots.after) return `mutate ${name} needs the candidate applied and the after snapshot, on the first start`;
  if (lastRestoreUnproved(state)) return `mutate ${name} needs the last restore proved by a restored snapshot`;
  return state.mutations.includes(name) ? `${name} was already applied once` : null;
}
export function suiteNeeds(state, expect, now) {
  let need;
  if (expect === 'red') need = state.candidate !== 'absent' ? 'suite red runs before add-candidate' : !state.snapshots.before ? 'suite red needs the before snapshot first' : null;
  else if (expect === 'green') {
    need = state.candidate !== 'applied' ? 'suite green needs the candidate applied' : state.active ? `suite green needs no mutation applied (${state.active} is)`
      : !state.snapshots.after ? 'suite green needs the after snapshot first' : lastRestoreUnproved(state) ? 'suite green needs the last restore proved by a restored snapshot'
        : state.generation >= 2 && state.snapshots.fresh16?.generation !== state.generation ? `suite green needs a fresh16 snapshot of generation ${state.generation}` : null;
  } else if (expect === 'm2' && firstStop(state)) {
    need = 'suite m2 is stopped on this replay: an earlier M2 run passed "a banned account reads no profile" with the ban clause removed, which never counts as a kill (review bbe2fbba finding 2); the fallback is M2b, reviewed separately';
  } else if (expect === 'm2' && firstM2Pass(state)) {
    need = `suite m2 already passed on this replay at ${isoAt(firstM2Pass(state).endedAt)}: M2 counts its first pass or its stop and never runs again, so no later run can replace either (review 2026-10-26T2000Z finding 1)`;
  } else if (['m1', 'm2', 'm3'].includes(expect)) need = state.active !== expect ? `suite ${expect} needs ${expect} applied` : state.proven !== expect ? `suite ${expect} needs the ${expect} snapshot to prove the mutation applied` : null;
  else need = `unknown suite expectation ${expect}; use red, green, m1, m2 or m3`;
  return need ?? spacing(state, 'replay', now);
}
function sharedApplyMissing(state) {
  const missing = ['red', 'm1', 'm2', 'm3'].filter((expect) => !passed(state, expect)).map((expect) => `suite ${expect}`);
  if (!passed(state, 'green', 2)) missing.push('a generation 2 green suite');
  if (!(state.checks.diff?.clean && state.checks.diff.generation >= 2)) missing.push('a clean generation 2 diff');
  if (!(state.checks.lint?.clean && state.checks.lint.generation >= 2)) missing.push('a clean generation 2 lint');
  if (!state.checks.images?.ok) missing.push('matching images');
  if (!state.snapshots['55321-before']) missing.push('the 55321-before snapshot');
  return missing;
}
/**
 * SF-7b (review 2026-10-27T0905Z L4): where the coordinator turns after a shared-apply attempt, in its STOP and in the refusal
 * of any later apply. Never a runner read: once the shared container has changed (a new start time, or a binding SF-7 STOPs
 * on), every 55321 command is refused before any SQL. SF-2 is to define a manually authorized read-only path outside this
 * runner; it is not written, and nothing here runs it.
 */
export const SHARED_INCIDENT = "the coordinator reviews 55321 through SF-2's manually authorized read-only incident path outside this runner (not yet written; once the shared container has changed, every 55321 command here is refused)";
/**
 * Review bbe2fbba finding 1 (c): an attempt (migration up started, whatever came of it) blocks another apply and a new before
 * snapshot, and allows the read-only shared-snapshot after. sharedApplied alone means a verified apply: every check inside
 * shared-apply held, and then the entry's start-time check by name after it, before state.json recorded it (SF-7e, review
 * 2026-10-27T1132Z L1). It describes 55321, not the run's exit code: a lock-release STOP or a failed evidence write may still
 * follow. An attempt without it means migration up started but was not verified; a 55321-after snapshot alone verifies nothing.
 */
export function sharedApplyNeeds(state) {
  if (state.sharedApplied) return 'the candidate was already applied to 55321';
  if (state.sharedApplyAttempted) return `a shared-apply was already attempted at ${isoAt(state.sharedApplyAttempted.at)} (migration up started), so it never runs again: ${SHARED_INCIDENT}`;
  // Review 2026-10-26T2000Z finding 1: a stop makes every M2 run on this replay void, a pass before it included.
  const stop = firstStop(state);
  if (stop) return `shared-apply is blocked on this replay: M2 was stopped at ${isoAt(stop.endedAt)} ("a banned account reads no profile" passed with the ban clause removed), so no M2 run here counts, an earlier pass included (review 2026-10-26T2000Z finding 1); the fallback is M2b, reviewed separately`;
  const missing = sharedApplyMissing(state);
  return missing.length ? `shared-apply needs every replay proof first; missing: ${missing.join(', ')}` : null;
}
export function sharedSnapshotNeeds(state, label) {
  if (label === 'before') {
    if (state.sharedApplied) return 'the candidate is already applied to 55321';
    return state.sharedApplyAttempted ? `a shared-apply was attempted at ${isoAt(state.sharedApplyAttempted.at)}, so 55321 may hold the candidate: take shared-snapshot after instead` : null;
  }
  if (label === 'after') return state.sharedApplied || state.sharedApplyAttempted ? null : 'shared-snapshot after needs shared-apply first';
  return 'shared-snapshot takes before or after';
}
