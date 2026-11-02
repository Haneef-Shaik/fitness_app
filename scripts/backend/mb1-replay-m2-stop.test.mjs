// MB-1 replay runner tests: the M2 stop, review 2026-10-26T2000Z finding 1 and review 2026-10-26T2305Z finding 1. Moved unchanged from mb1-replay.test.mjs in SF-0
// (docs/plan/runs/MB-1/sf0.md); the shared harness is mb1-replay-test-harness.mjs.
import assert from 'node:assert/strict';
import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { test } from 'node:test';
import { IDENTITY_CHECKS, M2_CHECK, M2_UNKILLED } from './mb1-replay-evidence.mjs';
import { STATE } from './mb1-replay-target.mjs';
import {
  atM2, atSharedApply, BAN, BAN_BANNED, BAN_ENDED, DIR, FAKE, ISO, leaks, M2_STOP, passes, readState, refuses, run, setup, SHARED_CONFIRM, snapshot, SNAPSHOTS,
  STAGING, suiteLog, suiteWith,
} from './mb1-replay-test-harness.mjs';

/* ---------------------------------------------------------------- Review 2026-10-26T2000Z (phase 1H) ------------------ */

// Finding 1: the M2 stop covered only a 27-ok run answering "live" or "banned", and a pass let a later suite m2 run. Now any
// complete M2 run whose banned check passed is the stop, whatever GoTrue answered (its output withheld included); a passed M2
// never runs again; and a recorded stop blocks shared-apply, an earlier pass included (the pure orders: mb1-replay-order.test.mjs).
const BAN_UNKNOWN = `# after the ban, GoTrue answers member C's session with HTTP 403 {"code":"bad_jwt","message":"invalid JWT"}`;
const M2_PASSED = new RegExp(`^mb1-replay refused: suite m2 already passed on this replay at ${ISO}: M2 counts its first pass or its stop and never runs again, so no later run can replace either \\(review 2026-10-26T2000Z finding 1\\)\\n$`);
const M2_STOPPED = /^mb1-replay refused: suite m2 is stopped on this replay: an earlier M2 run passed "a banned account reads no profile" with the ban clause removed, which never counts as a kill \(review bbe2fbba finding 2\); the fallback is M2b, reviewed separately\n$/;
const M2_BLOCKS = new RegExp(`^mb1-replay refused: shared-apply is blocked on this replay: M2 was stopped at ${ISO} \\("a banned account reads no profile" passed with the ban clause removed\\), so no M2 run here counts, an earlier pass included \\(review 2026-10-26T2000Z finding 1\\); the fallback is M2b, reviewed separately\\n$`);
test('review 2026-10-26T2000Z finding 1: a passed M2 never runs again, and a complete M2 run whose banned check passed stops M2, whatever GoTrue answered', async (t) => {
  // The exact kill, then a second run that would show 27 ok (the ban ended member C's session this time): refused before it runs.
  const env = setup(t);
  await atM2(env, BAN_BANNED);
  passes(await suiteWith(env, 'm2', [M2_CHECK], BAN_BANNED), 'the exact kill');
  const ran = env.suiteCalls.length;
  env.clock += 75_000;
  env.suites.push({ log: suiteLog([], BAN_ENDED), code: 0 });
  const again = refuses(await run(env, 'suite', DIR, 'm2', '--evidence', 'phase2-4-m2-suite-2'), M2_PASSED);
  assert.deepEqual(again.kinds, ['inspect']);
  assert.equal(env.suiteCalls.length, ran, 'the suite did not run again');
  assert.match(readFileSync(env.at('evidence/phase2-4-m2-suite-2.txt'), 'utf8'), /^mb1-replay refused: suite m2 already passed on this replay at /m);
  env.suites.length = 0;
  assert.deepEqual(readState(env).suites.filter((entry) => entry.expect === 'm2').map((entry) => `${entry.ok}:${entry.m2Stopped ?? '-'}`), ['true:-']);

  // On a "banned" replay, 27 ok is the stop whatever this run answered: "ended", an unknown code, "live" (a mismatch) or "banned".
  for (const [label, line, ban] of [['ended', BAN_ENDED, 'ended'], ['an unrecognised answer', BAN_UNKNOWN, 'unrecognised'], ['live', BAN, 'live'], ['banned', BAN_BANNED, 'banned']]) {
    const stopped = setup(t);
    await atM2(stopped, BAN_BANNED);
    const vacuous = await suiteWith(stopped, 'm2', [], line);
    assert.equal(vacuous.code, 1, label);
    assert.equal(vacuous.err, '', `${label}: a STOP line, not a refusal`);
    assert.ok(vacuous.out.includes(`# problem: ${M2_UNKILLED}\n`), `${label}: ${vacuous.out}`);
    assert.match(vacuous.out, new RegExp(`^# suite exit 0; GoTrue's answer after the ban: ${ban}\\n# verdict: the m2 expectation is NOT met$`, 'm'), label);
    assert.match(vacuous.out, M2_STOP, label);
    const entry = readState(stopped).suites.at(-1);
    assert.deepEqual([entry.expect, entry.ok, entry.m2Stopped], ['m2', false, true], label);
    stopped.clock += 75_000;
    stopped.suites.push({ log: suiteLog([M2_CHECK], BAN_BANNED), code: 1 });
    assert.deepEqual(refuses(await run(stopped, 'suite', DIR, 'm2'), M2_STOPPED).kinds, ['inspect'], label);
    stopped.suites.length = 0;
  }

  // Output holding a secret-shaped line is withheld, never printed, but the stop still reads the run: 27 ok stops M2 ...
  const withheld = setup(t);
  await atM2(withheld, BAN_BANNED);
  withheld.clock += 75_000;
  withheld.suites.push({ log: `${suiteLog([], BAN_BANNED)}${FAKE.secret}\n`, code: 0 });
  const hidden = await run(withheld, 'suite', DIR, 'm2', '--evidence', 'phase2-4-m2-suite');
  assert.equal(hidden.code, 1);
  assert.equal(hidden.err, '', 'a STOP line, not a refusal');
  assert.match(hidden.out, /^# problem: the suite output held a secret-shaped value and is withheld$/m);
  assert.ok(hidden.out.includes(`# problem: ${M2_UNKILLED}\n`), hidden.out);
  assert.match(hidden.out, M2_STOP);
  assert.doesNotMatch(hidden.out, /^(not )?ok - /m, 'the withheld output is not printed');
  assert.deepEqual(leaks(`${hidden.out}${readFileSync(withheld.at('evidence/phase2-4-m2-suite.txt'), 'utf8')}`), []);
  assert.equal(readState(withheld).suites.at(-1).m2Stopped, true);
  // ... and a withheld run whose banned check failed is neither the stop nor a pass, so M2 may run again.
  const withheldKill = setup(t);
  await atM2(withheldKill, BAN_BANNED);
  withheldKill.clock += 75_000;
  withheldKill.suites.push({ log: `${suiteLog([M2_CHECK], BAN_BANNED)}${FAKE.secret}\n`, code: 1 });
  const hiddenKill = await run(withheldKill, 'suite', DIR, 'm2');
  assert.equal(hiddenKill.code, 1);
  assert.doesNotMatch(hiddenKill.out, /^# STOP:/m);
  assert.deepEqual(leaks(hiddenKill.out), []);
  assert.deepEqual([readState(withheldKill).suites.at(-1).ok, readState(withheldKill).suites.at(-1).m2Stopped], [false, undefined]);
  passes(await suiteWith(withheldKill, 'm2', [M2_CHECK], BAN_BANNED), 'the exact kill after a withheld run');
});

test('review 2026-10-26T2000Z finding 1: a recorded M2 stop blocks shared-apply even after a passing M2, before any child process', async (t) => {
  const env = setup(t);
  await atSharedApply(env);
  const statePath = env.at(`private${DIR}/${STATE}`);
  const ready = readFileSync(statePath);
  const state = JSON.parse(ready.toString('utf8'));
  const at = state.suites.findIndex((entry) => entry.expect === 'm2');
  assert.deepEqual([state.suites[at].ok, state.suites.filter((entry) => entry.expect === 'm2').length], [true, 1], 'one passing M2 among every replay proof');
  const stop = { ...state.suites[at], ok: false, m2Stopped: true };
  // A state holding both a pass and a stop (test harness only: in plan order a pass now refuses a second M2), in both orders.
  for (const [label, suites] of [['the stop after the pass', [...state.suites, stop]], ['the stop before the pass', [...state.suites.slice(0, at), stop, ...state.suites.slice(at)]]]) {
    writeFileSync(statePath, `${JSON.stringify({ ...state, suites }, null, 2)}\n`);
    const result = refuses(await run(env, 'shared-apply', DIR, ...SHARED_CONFIRM, '--evidence', 'phase2-6-apply'), M2_BLOCKS);
    assert.deepEqual(result.kinds, ['inspect'], `${label}: a child process ran`);
    assert.match(readFileSync(env.at('evidence/phase2-6-apply.txt'), 'utf8'), /shared-apply is blocked on this replay: M2 was stopped at /);
    unlinkSync(env.at('evidence/phase2-6-apply.txt'));
    assert.equal(readState(env).sharedApplyAttempted, undefined, label);
    assert.equal(existsSync(env.at(`private${STAGING}`)), false, `${label}: nothing was staged`);
  }
  // The same state without the stop applies: the stop alone blocked it.
  writeFileSync(statePath, ready);
  passes(await run(env, 'shared-apply', DIR, ...SHARED_CONFIRM), 'shared-apply with one passing M2 and no stop');
});

// Review 2026-10-26T2305Z finding 1 (phase 1I): the reviewer's run. The banned check prints ok, then logout(a1, 'local'), which
// is outside check(), gets a 429, and the suite ends with "verify-identity setup failed". That run was no stop, so 75 s later
// another suite m2 could show the exact kill and pass. Now it is the durable STOP: recorded, the next suite m2 refused before it
// runs, and shared-apply blocked. A run that printed no banned ok (a setup failure, or a break before or at a failing banned
// check) is not the stop, and the exact kill may follow it.
const UP_TO_BANNED = IDENTITY_CHECKS.slice(0, IDENTITY_CHECKS.indexOf(M2_CHECK) + 1);
const brokenOff = (names, tail, failing = []) => `${[...names.flatMap((name) => [...(name === M2_CHECK ? [BAN_BANNED] : []), failing.includes(name) ? `not ok - ${name}\n  HTTP 200, 1 row(s)` : `ok - ${name}`]), tail].join('\n')}\n`;
const LOGOUT_FAILED = 'verify-identity setup failed: Logout (local) failed: HTTP 429 {"code":"over_request_rate_limit","message":"Request rate limit reached"}';
test('review 2026-10-26T2305Z finding 1: an M2 run whose banned check printed ok and then broke off is the durable STOP; a run with no banned ok is not', async (t) => {
  for (const [label, log] of [['the banned check ok, then the logout failed', brokenOff(UP_TO_BANNED, LOGOUT_FAILED)], ['the banned check ok, then SIGTERM', brokenOff(UP_TO_BANNED, "SIGTERM: removing this run's fixtures")]]) {
    await t.test(label, async (st) => {
      const env = setup(st);
      await atM2(env, BAN_BANNED);
      env.clock += 75_000;
      env.suites.push({ log, code: 1 });
      const broken = await run(env, 'suite', DIR, 'm2', '--evidence', 'phase2-4-m2-suite');
      assert.equal(broken.code, 1);
      assert.equal(broken.err, '', 'a STOP line, not a refusal');
      assert.ok(broken.out.includes(`# problem: ${M2_UNKILLED}\n`), broken.out);
      assert.match(broken.out, /^# verdict: the m2 expectation is NOT met$/m);
      assert.match(broken.out, M2_STOP);
      assert.match(readFileSync(env.at('evidence/phase2-4-m2-suite.txt'), 'utf8'), M2_STOP);
      const entry = readState(env).suites.at(-1);
      assert.deepEqual([entry.expect, entry.ok, entry.m2Stopped], ['m2', false, true]);
      // Durable: 75 s later the exact kill is refused before the suite runs, and shared-apply stays blocked by the stop itself.
      const ran = env.suiteCalls.length;
      env.clock += 75_000;
      env.suites.push({ log: suiteLog([M2_CHECK], BAN_BANNED), code: 1 });
      assert.deepEqual(refuses(await run(env, 'suite', DIR, 'm2'), M2_STOPPED).kinds, ['inspect']);
      assert.equal(env.suiteCalls.length, ran, 'the suite did not run again');
      env.suites.length = 0;
      passes(await run(env, 'mutate', DIR, 'restore-member-active'), 'restore m2');
      passes(await snapshot(env, 'restored', SNAPSHOTS.after), 'restored after m2');
      assert.deepEqual(refuses(await run(env, 'shared-apply', DIR, ...SHARED_CONFIRM), M2_BLOCKS).kinds, ['inspect']);
      assert.equal(readState(env).suites.filter((one) => one.m2Stopped).length, 1);
    });
  }
  const noStop = [
    ['a setup failure that printed no check', 'verify-identity setup failed: Fixture sign-in failed: HTTP 429 {"code":"over_request_rate_limit","message":"Request rate limit reached"}\n'],
    ['a break before the banned check', brokenOff(UP_TO_BANNED.slice(0, -1), LOGOUT_FAILED)],
    ['a break after the banned check failed', brokenOff(UP_TO_BANNED, LOGOUT_FAILED, [M2_CHECK])],
  ];
  for (const [label, log] of noStop) {
    await t.test(label, async (st) => {
      const env = setup(st);
      await atM2(env, BAN_BANNED);
      env.clock += 75_000;
      env.suites.push({ log, code: 1 });
      const result = await run(env, 'suite', DIR, 'm2');
      assert.equal(result.code, 1);
      assert.doesNotMatch(result.out, /^# STOP:/m);
      assert.ok(!result.out.includes(M2_UNKILLED), result.out);
      assert.deepEqual([readState(env).suites.at(-1).ok, readState(env).suites.at(-1).m2Stopped], [false, undefined]);
      passes(await suiteWith(env, 'm2', [M2_CHECK], BAN_BANNED), 'the exact kill after it');
    });
  }
});
