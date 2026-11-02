// MB-1 replay runner tests: the real identity suite under Ctrl-C, one invocation at a time, and teardown. Moved unchanged from mb1-replay.test.mjs in SF-0
// (docs/plan/runs/MB-1/sf0.md); the shared harness is mb1-replay-test-harness.mjs.
import assert from 'node:assert/strict';
import { existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, symlinkSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { sha256 } from './mb1-replay-evidence.mjs';
import { MANIFEST, REPLAY_API_URL } from './mb1-replay-target.mjs';
import {
  CONFIRM, DIR, HELP, kind, leaks, LOCK, LOGS, NODE, passes, PROJECT, readState, refuses, run, setup, SHARED_CONFIRM, snapshot, SUPABASE_BIN, within,
} from './mb1-replay-test-harness.mjs';
import { main as identityMain } from './verify-identity.mjs';

/* ---------------------------------------------------------------- The real suite under a signal (finding 2) ---------- */

const RUN_ID = '00000000-0000-4000-8000-000000000002';
const answer = (status, data) => ({ ok: status >= 200 && status < 300, status, text: async () => JSON.stringify(data) });
function noRealFetch(t) {
  const original = globalThis.fetch;
  globalThis.fetch = () => { throw new Error('the real fetch must never be called'); };
  t.after(() => { globalThis.fetch = original; });
}

test('Ctrl-C during the real identity suite inside the runner: cleanup is printed, recorded and saved, and nothing exits the process', async (t) => {
  noRealFetch(t);
  const exits = [];
  t.mock.method(process, 'exit', (code) => { exits.push(code); });
  const env = setup(t);
  passes(await run(env, 'prepare', DIR), 'prepare');
  passes(await run(env, 'verify-cli', DIR), 'verify-cli');
  passes(await run(env, 'start', DIR), 'start');
  passes(await snapshot(env, 'before'), 'snapshot before');
  let arrived;
  const inFlight = new Promise((resolve) => { arrived = resolve; });
  const requests = [];
  const send = async (url, init = {}) => {
    assert.ok(url.startsWith(`${REPLAY_API_URL}/`), url);
    const path = url.slice(REPLAY_API_URL.length); const method = init.method ?? 'GET';
    requests.push({ method, path });
    if (method === 'POST' && path === '/auth/v1/admin/users') {
      if (JSON.parse(init.body).email.endsWith('-a@example.invalid')) return answer(200, { id: 'user-a' });
      arrived();
      return new Promise(() => {}); // member B's creation never answers
    }
    if (method === 'DELETE') return answer(200, []);
    throw new Error(`no ${method} ${path} may be sent in this test`);
  };
  env.deps = {
    // The real main(), with only fetch, the run id and the settle time injected here. Everything else comes from the
    // runner; the guard keeps the defaults (a real `supabase status`, process signals, process.exit) from ever running.
    suite: (options) => {
      assert.equal(typeof options.run, 'function', 'the runner passes its own status runner');
      assert.deepEqual(options.cli, [NODE, SUPABASE_BIN]);
      assert.equal(options.signals, env.signals);
      assert.equal(typeof options.exit, 'function');
      return identityMain({ ...options, fetch: send, runId: RUN_ID, settleMs: 20 });
    },
  };
  env.clock += 75_000;
  const running = run(env, 'suite', DIR, 'red', '--evidence', 'phase2-2-red');
  await Promise.race([inFlight, running.then((result) => assert.fail(`the suite finished before the creation was in flight: ${result.err}`))]);
  env.signals.emit('SIGINT', 'SIGINT');
  const result = await within(running);
  assert.equal(result.code, 1);
  assert.deepEqual(exits, [], 'process.exit is never called');
  const cleanupLine = `Fixture cleanup needs attention: the member B account (fitlog-mb1-identity-${RUN_ID}-b@example.invalid) may exist; its creation did not finish`;
  assert.match(result.out, /^SIGINT: removing this run's fixtures$/m);
  assert.ok(result.out.includes(`${cleanupLine}\n`), result.out);
  assert.match(result.out, /^# problem: stop line: Fixture cleanup needs attention: the member B account/m);
  assert.match(result.out, /^# verdict: the red expectation is NOT met$/m);
  const saved = readFileSync(env.at('evidence/phase2-2-red.txt'), 'utf8');
  assert.ok(saved.includes(`${cleanupLine}\n`), 'the evidence file keeps the cleanup line');
  assert.match(saved, /^# mb1-replay suite: exit 1$/m);
  assert.deepEqual(readState(env).suites.map((entry) => `${entry.expect}:${entry.ok}`), ['red:false']);
  assert.deepEqual(requests.filter((request) => request.path.startsWith('/auth/v1/admin/users/')).map((request) => request.path), ['/auth/v1/admin/users/user-a']);
  assert.equal(env.signals.listenerCount('SIGINT') + env.signals.listenerCount('SIGTERM'), 0);
  assert.equal(existsSync(env.at(`private${DIR}/${LOCK}`)), false);
  assert.deepEqual(leaks(`${result.out}${result.err}${saved}`), []);
});

/* ---------------------------------------------------------------- One invocation at a time (finding 5) --------------- */

test('a lock another invocation holds refuses every command, and no lock is ever removed automatically', async (t) => {
  const env = setup(t);
  passes(await run(env, 'prepare', DIR), 'prepare');
  passes(await run(env, 'verify-cli', DIR), 'verify-cli');
  passes(await run(env, 'start', DIR), 'start');
  const lockPath = env.at(`private${DIR}/${LOCK}`);
  const stale = `${JSON.stringify({ owner: 'fitlog-mb1-replay', dir: DIR, op: 'suite', pid: 4242, startedAt: '2026-10-26T06:00:00.000Z', token: 'another-invocation' })}\n`;
  writeFileSync(lockPath, stale);
  const held = /another mb1-replay command holds \/tmp\/fitlog-mb1-replay-20261026\/\.fitlog-mb1-replay\.lock \(suite, pid 4242, since 2026-10-26T06:00:00\.000Z\); a lock is never removed automatically: wait for that command, or, if no runner is running, the coordinator reviews the state and removes the file by hand/;
  for (const argv of [['check', DIR], ['migrations', DIR], ['snapshot', DIR, 'before'], ['suite', DIR, 'red'], ['mutate', DIR, 'm1'], ['stop', DIR, ...CONFIRM], ['teardown', DIR, ...CONFIRM], ['retain', DIR], ['shared-apply', DIR, ...SHARED_CONFIRM]]) {
    assert.deepEqual(refuses(await run(env, ...argv), held).kinds, [], argv.join(' '));
    assert.equal(readFileSync(lockPath, 'utf8'), stale, 'the lock is left exactly as it was');
  }
  writeFileSync(lockPath, 'not json');
  refuses(await run(env, 'check', DIR), /another mb1-replay command holds \/tmp\/fitlog-mb1-replay-20261026\/\.fitlog-mb1-replay\.lock \(an unreadable lock\)/);
  assert.equal(readFileSync(lockPath, 'utf8'), 'not json');
  unlinkSync(lockPath);
  symlinkSync('/etc/hosts', lockPath);
  refuses(await run(env, 'check', DIR), /holds entries this runner did not create: \.fitlog-mb1-replay\.lock; nothing runs on it and nothing was removed/);
  assert.ok(lstatSync(lockPath).isSymbolicLink());
  unlinkSync(lockPath);
  passes(await run(env, 'check', DIR), 'check once the coordinator has removed the lock by hand');
  assert.equal(existsSync(lockPath), false);
});

test('a second invocation while a suite runs is refused, and the first one keeps its record', async (t) => {
  const env = setup(t);
  passes(await run(env, 'prepare', DIR), 'prepare');
  passes(await run(env, 'verify-cli', DIR), 'verify-cli');
  passes(await run(env, 'start', DIR), 'start');
  passes(await snapshot(env, 'before'), 'snapshot before');
  let entered; let open;
  const inSuite = new Promise((resolve) => { entered = resolve; });
  const gate = new Promise((resolve) => { open = resolve; });
  env.deps = { suite: async ({ io }) => { entered(); await gate; io.stdout.write(LOGS.red); return 1; } };
  env.clock += 75_000;
  const first = run(env, 'suite', DIR, 'red');
  await within(inSuite);
  for (const argv of [['check', DIR], ['mutate', DIR, 'm1'], ['suite', DIR, 'red'], ['stop', DIR, ...CONFIRM]]) {
    assert.deepEqual(refuses(await run(env, ...argv), /another mb1-replay command holds \/tmp\/fitlog-mb1-replay-20261026\/\.fitlog-mb1-replay\.lock \(suite, pid 4100, since 2026-10-26T06:01:15\.000Z\)/).kinds, [], argv.join(' '));
  }
  open();
  passes(await within(first), 'the suite that held the lock');
  env.deps = {};
  passes(await run(env, 'check', DIR), 'check after the suite');
  assert.deepEqual(readState(env).suites.map((entry) => `${entry.expect}:${entry.ok}`), ['red:true']);
  assert.equal(existsSync(env.at(`private${DIR}/${LOCK}`)), false);
});

test('the lock is released after a pass, a refusal or a failure, and a lock replaced mid-command is left in place with a STOP', async (t) => {
  const env = setup(t);
  const lockPath = env.at(`private${DIR}/${LOCK}`);
  passes(await run(env, 'prepare', DIR), 'prepare');
  assert.equal(existsSync(lockPath), false);
  refuses(await run(env, 'start', DIR), /run verify-cli first/);
  assert.equal(existsSync(lockPath), false, 'released after a refusal');
  env.world.help = HELP.replace('      --level string\n', '');
  assert.equal((await run(env, 'verify-cli', DIR)).code, 1);
  assert.equal(existsSync(lockPath), false, 'released after a failure');
  env.world.help = HELP;
  passes(await run(env, 'verify-cli', DIR), 'verify-cli');
  assert.equal(existsSync(lockPath), false, 'released after a pass');
  const seen = [];
  env.world.onStart = () => {
    seen.push(JSON.parse(readFileSync(lockPath, 'utf8')));
    writeFileSync(lockPath, `${JSON.stringify({ ...seen[0], token: 'intruder' })}\n`);
  };
  const replaced = await run(env, 'start', DIR);
  assert.equal(replaced.code, 1);
  assert.deepEqual(Object.keys(seen[0]).sort(), ['dir', 'op', 'owner', 'pid', 'startedAt', 'token']);
  assert.deepEqual({ ...seen[0], token: typeof seen[0].token }, { owner: 'fitlog-mb1-replay', dir: DIR, op: 'start', pid: 4100, startedAt: '2026-10-26T06:00:00.000Z', token: 'string' });
  assert.match(replaced.out, /^# STOP: the lock \/tmp\/fitlog-mb1-replay-20261026\/\.fitlog-mb1-replay\.lock now belongs to another invocation; it was left in place$/m);
  assert.equal(JSON.parse(readFileSync(lockPath, 'utf8')).token, 'intruder');
  refuses(await run(env, 'check', DIR), /another mb1-replay command holds/);
});

/* ---------------------------------------------------------------- Teardown ------------------------------------------- */

test('teardown keeps the SQL that ran, stops the replay by its literal project ID, and removes only what it owns, one entry at a time', async (t) => {
  const env = setup(t);
  passes(await run(env, 'prepare', DIR), 'prepare');
  passes(await run(env, 'verify-cli', DIR), 'verify-cli');
  passes(await run(env, 'start', DIR), 'start');
  const real = env.at(`private${DIR}`);
  mkdirSync(join(real, 'supabase/.temp'));
  writeFileSync(join(real, 'supabase/.temp/cli-latest'), 'v2.121.0');
  assert.deepEqual(refuses(await run(env, 'teardown', DIR, ...CONFIRM), /teardown needs the SQL that ran kept as evidence first: run retain/).kinds, ['inspect']);
  const retain = passes(await run(env, 'retain', DIR), 'retain');
  for (const name of ['preconditions', 'm1', 'm2', 'm3', 'restore-member-active']) {
    assert.deepEqual(readFileSync(env.at(`evidence/phase2-sql/${name}.sql.txt`)), readFileSync(join(real, `sql/${name}.sql`)));
    assert.match(retain.out, new RegExp(`^${sha256(readFileSync(join(real, `sql/${name}.sql`)))}  phase2-sql/${name}\\.sql\\.txt$`, 'm'));
  }
  assert.deepEqual(JSON.parse(readFileSync(env.at('evidence/phase2-replay-manifest.json'), 'utf8')), JSON.parse(readFileSync(join(real, MANIFEST), 'utf8')));
  writeFileSync(join(real, 'supabase/notes.txt'), 'not the runner\'s');
  symlinkSync('/etc/hosts', join(real, 'supabase/.temp/link'));
  const unexpected = refuses(await run(env, 'teardown', DIR, ...CONFIRM), /holds entries this runner did not create: supabase\/\.temp\/link, supabase\/notes\.txt; nothing runs on it and nothing was removed/);
  assert.deepEqual(unexpected.kinds, []);
  assert.equal(env.world.running, true);
  unlinkSync(join(real, 'supabase/notes.txt'));
  unlinkSync(join(real, 'supabase/.temp/link'));
  const teardown = passes(await run(env, 'teardown', DIR, ...CONFIRM), 'teardown');
  assert.deepEqual(teardown.kinds, ['inspect', 'names', 'status', 'names', 'stop', 'names', 'inspect']);
  const stop = env.world.calls.find((call) => kind(call) === 'stop');
  assert.deepEqual(stop.args, [SUPABASE_BIN, 'stop', '--project-id', PROJECT, '--no-backup', '--workdir', DIR]);
  assert.equal(env.world.running, false);
  assert.equal(existsSync(real), false);
  // 28 files: the 27 it wrote or the CLI wrote, and its own lock, removed after the files and directories, before the sentinel.
  assert.match(teardown.out, /^removed \/tmp\/fitlog-mb1-replay-20261026: 28 file\(s\) and 5 director\(ies\), one at a time, after its sentinel and manifest checked$/m);
  assert.deepEqual(readdirSync(env.at('evidence')).sort(), ['phase2-replay-manifest.json', 'phase2-sql']);
});
