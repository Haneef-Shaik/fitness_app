import assert from 'node:assert/strict';
import { test } from 'node:test';
import { haltNeeds, sharedApplyNeeds, suiteNeeds } from './mb1-replay-order.mjs';

// The MB-1 replay runner's plan-order rules (mb1-replay-order.mjs) as pure functions of its state: no command, file, database
// or network. Review 2026-10-26T2000Z finding 1: M2 counts its first pass or its stop and never a later run, and any stop
// blocks shared-apply for good, an earlier pass included. Every order of one to three M2 runs is checked: a pass (the exact
// kill), a stop (a complete run whose banned check passed) and a failure for another reason (no kill and no stop).

const T0 = Date.UTC(2026, 9, 26, 6);
const LATER = T0 + 3_600_000;
const STEP = 100_000;
const iso = (ms) => new Date(ms).toISOString();
const entry = (expect, ok, extra = {}) => Object.freeze({ stack: 'replay', expect, ok, ban: 'banned', generation: 1, endedAt: T0, ...extra });
const M2_RUNS = Object.freeze({ pass: entry('m2', true), stop: entry('m2', false, { m2Stopped: true }), fail: entry('m2', false) });
/** Every sequence of one to three M2 runs, by name: 3 + 9 + 27. */
const SEQUENCES = (() => {
  const out = [];
  const grow = (sequence) => {
    if (sequence.length) out.push(sequence);
    if (sequence.length < 3) for (const name of Object.keys(M2_RUNS)) grow([...sequence, name]);
  };
  grow([]);
  return Object.freeze(out);
})();
/** The M2 runs of a sequence, STEP ms apart, so the first of each kind has its own time. */
const m2Entries = (sequence) => sequence.map((name, at) => ({ ...M2_RUNS[name], endedAt: T0 + at * STEP }));
const firstAt = (sequence, name) => T0 + sequence.indexOf(name) * STEP;
/** Every replay proof shared-apply needs, with `m2` as the M2 runs between M1's and M3's. */
function ready(m2) {
  return {
    version: 1, shared: 'true 2026-10-26T01:00:00.123456789Z', cli: { version: '2.121.0' }, generation: 2, candidate: 'applied', active: null, proven: null, restoredProof: true,
    mutations: ['m1', 'm2', 'm3'], snapshots: { before: { generation: 1 }, after: { generation: 1 }, fresh16: { generation: 2 }, '55321-before': { generation: 2 } },
    suites: [entry('red', true), entry('green', true), entry('m1', true), ...m2Entries(m2), entry('m3', true), entry('green', true, { generation: 2 })],
    ban: 'banned', checks: { diff: { generation: 2, clean: true }, lint: { generation: 2, clean: true }, images: { generation: 2, ok: true } }, sharedApplied: false,
  };
}
/** M2 applied and proved on the first start, with `m2` as the M2 runs so far. */
const atM2 = (m2) => ({ ...ready([]), generation: 1, active: 'm2', proven: 'm2', mutations: ['m1', 'm2'], snapshots: { before: { generation: 1 }, after: { generation: 1 } }, suites: [entry('red', true), entry('green', true), entry('m1', true), ...m2Entries(m2)] });

const blocked = (at) => `shared-apply is blocked on this replay: M2 was stopped at ${iso(at)} ("a banned account reads no profile" passed with the ban clause removed), so no M2 run here counts, an earlier pass included (review 2026-10-26T2000Z finding 1); the fallback is M2b, reviewed separately`;
const alreadyPassed = (at) => `suite m2 already passed on this replay at ${iso(at)}: M2 counts its first pass or its stop and never runs again, so no later run can replace either (review 2026-10-26T2000Z finding 1)`;
const STOPPED = 'suite m2 is stopped on this replay: an earlier M2 run passed "a banned account reads no profile" with the ban clause removed, which never counts as a kill (review bbe2fbba finding 2); the fallback is M2b, reviewed separately';

test('review 2026-10-26T2000Z finding 1: any M2 stop blocks shared-apply for good, an earlier pass included, in every order', () => {
  assert.equal(SEQUENCES.length, 39);
  assert.equal(sharedApplyNeeds(ready(['pass'])), null, 'every replay proof, one passing M2 and no stop: shared-apply may run');
  for (const sequence of SEQUENCES) {
    const label = sequence.join(', ');
    const needs = sharedApplyNeeds(ready(sequence));
    if (sequence.includes('stop')) assert.equal(needs, blocked(firstAt(sequence, 'stop')), label);
    else if (sequence.includes('pass')) assert.equal(needs, null, label);
    else assert.equal(needs, 'shared-apply needs every replay proof first; missing: suite m2', label);
  }
  // The stop is decisive even with every other proof missing, and any truthy m2Stopped is a stop (a hand-edited state).
  assert.equal(sharedApplyNeeds({ ...ready(['pass', 'stop']), checks: {}, snapshots: {} }), blocked(firstAt(['pass', 'stop'], 'stop')));
  for (const flag of [1, 'yes', {}]) {
    const state = ready(['pass']);
    assert.match(sharedApplyNeeds({ ...state, suites: [...state.suites, { ...M2_RUNS.fail, m2Stopped: flag }] }), /^shared-apply is blocked on this replay: M2 was stopped at /, JSON.stringify(flag));
  }
  // The earlier refusals keep their precedence: a verified apply, then a recorded attempt.
  assert.equal(sharedApplyNeeds({ ...ready(['stop']), sharedApplied: true }), 'the candidate was already applied to 55321');
  assert.match(sharedApplyNeeds({ ...ready(['stop']), sharedApplyAttempted: { at: T0, workdir: 'shared-apply' } }), /^a shared-apply was already attempted at 2026-10-26T06:00:00\.000Z /);
});

test('review 2026-10-26T2000Z finding 1: suite m2 runs until its first pass or stop and never again; a failure for another reason may be repeated', () => {
  assert.equal(suiteNeeds(atM2([]), 'm2', LATER), null, 'the first M2 run');
  for (const sequence of SEQUENCES) {
    const label = sequence.join(', ');
    const needs = suiteNeeds(atM2(sequence), 'm2', LATER);
    if (sequence.includes('stop')) assert.equal(needs, STOPPED, label);
    else if (sequence.includes('pass')) assert.equal(needs, alreadyPassed(firstAt(sequence, 'pass')), label);
    else assert.equal(needs, null, label);
  }
  // Only M2 is refused on its own record: M1 and M3 still follow their own rules after an M2 pass or stop.
  for (const sequence of [['pass'], ['stop'], ['pass', 'stop']]) {
    for (const expect of ['m1', 'm3']) assert.equal(suiteNeeds({ ...atM2(sequence), active: expect, proven: expect }, expect, LATER), null, `${expect} after ${sequence.join(', ')}`);
  }
  // A run that is allowed still waits for the spacing, and still needs M2 applied and proved.
  assert.match(suiteNeeds(atM2(['fail']), 'm2', T0 + 1_000), /^wait 74 s more: suites on one stack run at least 75 s apart/);
  assert.equal(suiteNeeds({ ...atM2(['fail']), proven: null }, 'm2', LATER), 'suite m2 needs the m2 snapshot to prove the mutation applied');
});

const HALTED = (at) => `a STOP was recorded at ${at}: the replay's input changed while migration up ran, so where it wrote is unknown (55321 included), and nothing runs on this replay until the coordinator reviews it and removes stopRecorded from state.json by hand (review 2026-10-26T2000Z finding 2)`;
test('review 2026-10-26T2000Z finding 2: a STOP recorded after migrate halts every command; a state without one is unaffected', () => {
  assert.equal(haltNeeds(ready(['pass'])), null);
  assert.equal(haltNeeds({ ...ready(['pass']), stopRecorded: null }), null);
  assert.equal(haltNeeds({ ...ready(['pass']), stopRecorded: { at: T0, op: 'migrate' } }), HALTED(iso(T0)));
  // Any other truthy record (a hand-edited state) still halts, and its time is never trusted as one.
  for (const record of [true, 'x', { op: 'migrate' }, { at: 'not a time', op: 'migrate' }, { at: 9e15 }]) {
    assert.equal(haltNeeds({ ...ready([]), stopRecorded: record }), HALTED('an unknown time'), JSON.stringify(record));
  }
});

// Review 2026-10-26T2305Z finding 4 (phase 1I): db diff and db lint now record the same STOP after their CLI, and the halt names
// the command that ran. Any other or missing op reads as migrate's, the only op recorded before this phase; it still halts.
const HALTED_BY = (at, label) => `a STOP was recorded at ${at}: the replay's input changed while ${label} ran, so where it wrote is unknown (55321 included), and nothing runs on this replay until the coordinator reviews it and removes stopRecorded from state.json by hand (review 2026-10-26T2000Z finding 2)`;
test('review 2026-10-26T2305Z finding 4: a STOP recorded after db diff or db lint halts every command and names it; any other op reads as migrate\'s', () => {
  assert.equal(HALTED_BY(iso(T0), 'migration up'), HALTED(iso(T0)));
  assert.equal(haltNeeds({ ...ready([]), stopRecorded: { at: T0, op: 'diff' } }), HALTED_BY(iso(T0), 'db diff'));
  assert.equal(haltNeeds({ ...ready([]), stopRecorded: { at: T0, op: 'lint' } }), HALTED_BY(iso(T0), 'db lint'));
  assert.equal(haltNeeds({ ...ready([]), stopRecorded: { op: 'lint' } }), HALTED_BY('an unknown time', 'db lint'));
  for (const op of ['migrate', undefined, null, 'start', 'DIFF', ' diff', 'constructor', '__proto__', 'toString', 'hasOwnProperty', 1, ['diff']]) {
    assert.equal(haltNeeds({ ...ready([]), stopRecorded: { at: T0, op } }), HALTED(iso(T0)), JSON.stringify(op));
  }
});
