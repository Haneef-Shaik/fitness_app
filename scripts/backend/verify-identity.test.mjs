import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { test } from 'node:test';
import { LOCAL_API_URL, REPO_ROOT } from './local-stack.mjs';
import { main, stackStatus } from './verify-identity.mjs';

// The status step, main()'s refusal and the fixture cleanup on a stop signal. No test here reaches Docker, Supabase, a
// database or the network: `supabase status` is an injected runner, fetch is an injected double (or a stub that fails the
// test if called), and stop signals come from a local emitter. Importing the suite runs nothing; it runs only as
// `node scripts/backend/verify-identity.mjs` or through main() with a target that passes stackStatus.
const SECRET = 'sb_secret_identity-must-never-print';
const PUBLISHABLE = 'sb_publishable_identity-must-never-print';
const WITHHELD = 'its output is withheld because it holds keys';
const statusJson = (fields = {}) => JSON.stringify({ API_URL: LOCAL_API_URL, DB_URL: 'postgresql://postgres:postgres@127.0.0.1:55322/postgres', PUBLISHABLE_KEY: PUBLISHABLE, SECRET_KEY: SECRET, ...fields });
function stack(reply) {
  const calls = [];
  return { calls, run: (command, args, options) => { calls.push({ command, args, options }); return reply; } };
}
/** The refusal's message, after checking that it holds no key. stackStatus is asynchronous, so a refusal is a rejection. */
async function refusal(fn) {
  let message;
  await assert.rejects(fn, (error) => { message = error.message; return true; });
  assert.doesNotMatch(message, /sb_(secret|publishable)_/);
  return message;
}

test('a running local stack gives its URL and keys from one status call at the repository, with no shell', async () => {
  const { run, calls } = stack({ status: 0, stdout: statusJson(), stderr: '' });
  assert.deepEqual(await stackStatus({ run }), { apiUrl: LOCAL_API_URL, publishableKey: PUBLISHABLE, secretKey: SECRET });
  assert.deepEqual(calls, [{ command: 'pnpm', args: ['exec', 'supabase', 'status', '-o', 'json', '--workdir', REPO_ROOT], options: { cwd: REPO_ROOT } }]);
});

test('an injected loopback replay project is checked at its own workdir and URL', async () => {
  const projectDir = '/tmp/fitlog-mb1-replay-unit'; const expectedApiUrl = 'http://127.0.0.1:56421';
  const { run, calls } = stack({ status: 0, stdout: statusJson({ API_URL: expectedApiUrl }), stderr: '' });
  assert.equal((await stackStatus({ projectDir, expectedApiUrl, run })).apiUrl, expectedApiUrl);
  assert.deepEqual(calls[0].args.slice(-2), ['--workdir', projectDir]);
  assert.equal(await refusal(() => stackStatus({ projectDir, expectedApiUrl, run: stack({ status: 0, stdout: statusJson(), stderr: '' }).run })), `Refusing to run against ${LOCAL_API_URL}: expected ${expectedApiUrl}, the isolated local stack`);
});

// Review a102fb68 findings 1 and 5: inside the replay runner, the status step goes through the runner's own executor (the
// installed CLI, an allowlisted environment, a process-group timeout), which answers asynchronously.
test('the status step goes through an injected CLI and an asynchronous runner, as the replay runner passes them', async () => {
  const cli = ['/opt/node/bin/node', '/repo/node_modules/.bin/supabase'];
  const calls = [];
  const run = async (command, args, options) => { calls.push({ command, args, options }); return { status: 0, stdout: statusJson(), stderr: '' }; };
  assert.deepEqual(await stackStatus({ run, cli }), { apiUrl: LOCAL_API_URL, publishableKey: PUBLISHABLE, secretKey: SECRET });
  assert.deepEqual(calls, [{ command: cli[0], args: [cli[1], 'status', '-o', 'json', '--workdir', REPO_ROOT], options: { cwd: REPO_ROOT } }]);
  assert.equal(await refusal(() => stackStatus({ run: async () => ({ status: 1, stdout: statusJson(), stderr: SECRET }), cli })), `supabase status failed (exit 1); ${WITHHELD}`);
  for (const bad of [[], [''], ['node', ''], [42], 'pnpm exec supabase']) {
    const before = calls.length;
    assert.equal(await refusal(() => stackStatus({ run, cli: bad })), 'The Supabase CLI command must be a list of non-empty strings; refusing');
    assert.equal(calls.length, before, 'a refused CLI command runs nothing');
  }
});

test('a failed or unrun status is refused without its output, which holds keys', async () => {
  assert.equal(await refusal(() => stackStatus({ run: stack({ status: 1, stdout: statusJson(), stderr: `SECRET_KEY=${SECRET}\n` }).run })), `supabase status failed (exit 1); ${WITHHELD}`);
  assert.equal(await refusal(() => stackStatus({ run: stack({ status: null, stdout: '', stderr: '', error: 'spawnSync pnpm ETIMEDOUT' }).run })), `supabase status did not run (spawnSync pnpm ETIMEDOUT); ${WITHHELD}`);
});

test('status output that is not JSON is refused without echoing any of it', async () => {
  for (const stdout of [`API_URL: ${LOCAL_API_URL}\nSECRET_KEY: ${SECRET}\n`, statusJson().slice(0, -12), `${statusJson()}\n${SECRET}`]) {
    assert.equal(await refusal(() => stackStatus({ run: stack({ status: 0, stdout, stderr: '' }).run })), `supabase status -o json did not print JSON; ${WITHHELD}`);
  }
});

test('any other API URL is refused by name, and a key is never part of the reason', async () => {
  for (const API_URL of ['http://127.0.0.1:54321', 'https://project.supabase.co']) {
    assert.equal(await refusal(() => stackStatus({ run: stack({ status: 0, stdout: statusJson({ API_URL }), stderr: '' }).run })), `Refusing to run against ${API_URL}: expected ${LOCAL_API_URL}, the isolated local stack`);
  }
  assert.equal(await refusal(() => stackStatus({ run: stack({ status: 0, stdout: statusJson({ API_URL: { key: SECRET } }), stderr: '' }).run })), `Refusing to run against (no API_URL): expected ${LOCAL_API_URL}, the isolated local stack`);
});

test('a status without both keys is refused without printing the key it has', async () => {
  for (const missing of ['PUBLISHABLE_KEY', 'SECRET_KEY']) {
    assert.equal(await refusal(() => stackStatus({ run: stack({ status: 0, stdout: statusJson({ [missing]: '' }), stderr: '' }).run })), `supabase status did not print both API keys; ${WITHHELD}`);
  }
});

test('a target that is not a loopback URL is refused before status runs', async () => {
  const { run, calls } = stack({ status: 0, stdout: statusJson(), stderr: '' });
  for (const expectedApiUrl of ['https://project.supabase.co', 'http://localhost:55321', 'http://127.0.0.1:55321/']) {
    await assert.rejects(() => stackStatus({ expectedApiUrl, run }), /is not a loopback http:\/\/127\.0\.0\.1:<port> URL; refusing$/);
  }
  assert.equal(calls.length, 0);
});

test('main refuses in one line with exit 1, prints no key and sends no request', async (t) => {
  const original = globalThis.fetch; let requests = 0;
  globalThis.fetch = () => { requests += 1; throw new Error('no request may be sent'); };
  t.after(() => { globalThis.fetch = original; });
  for (const [reply, reason] of [
    [{ status: 1, stdout: statusJson(), stderr: SECRET }, `supabase status failed (exit 1); ${WITHHELD}`],
    [{ status: 0, stdout: statusJson({ API_URL: 'http://127.0.0.1:54321' }), stderr: '' }, `Refusing to run against http://127.0.0.1:54321: expected ${LOCAL_API_URL}, the isolated local stack`],
  ]) {
    const out = []; const err = [];
    const io = { stdout: { write: (text) => out.push(text) }, stderr: { write: (text) => err.push(text) } };
    assert.equal(await main({ io, run: stack(reply).run }), 1);
    assert.deepEqual(out, []);
    assert.deepEqual(err, [`verify-identity refused: ${reason}\n`]);
  }
  assert.equal(requests, 0);
});

// Review 39fe1fb5 finding 5: a stop signal while a fixture account is being created must neither leak that account nor
// leave it unnamed. Every request below goes to an in-memory double; none leaves the process.
const RUN_ID = '00000000-0000-4000-8000-000000000001';
const fixtureEmail = (letter) => `fitlog-mb1-identity-${RUN_ID}-${letter}@example.invalid`;
const answer = (status, data) => ({ ok: status >= 200 && status < 300, status, text: async () => JSON.stringify(data) });
const okStatus = () => stack({ status: 0, stdout: statusJson(), stderr: '' }).run;
function capture() {
  const out = []; const err = [];
  return { out, err, io: { stdout: { write: (text) => out.push(text) }, stderr: { write: (text) => err.push(text) } } };
}
/**
 * A fetch double: account creation answers as `creations[letter](init)` says, every DELETE succeeds, and nothing else may
 * be sent.
 */
function api(creations) {
  const requests = [];
  const send = async (url, init = {}) => {
    assert.ok(url.startsWith(LOCAL_API_URL), url);
    const path = url.slice(LOCAL_API_URL.length); const method = init.method ?? 'GET';
    requests.push({ method, path, body: init.body ? JSON.parse(init.body) : undefined, signal: init.signal });
    if (method === 'POST' && path === '/auth/v1/admin/users') return creations[/-([a-c])@example\.invalid$/.exec(JSON.parse(init.body).email)[1]](init);
    if (method === 'DELETE') return answer(200, []);
    throw new Error(`no ${method} ${path} may be sent in this test`);
  };
  return { send, requests, deletes: () => requests.filter((request) => request.method === 'DELETE') };
}
/** Belt and braces: if the injected double were ever bypassed, the real fetch fails the test instead of reaching a stack. */
function noRealFetch(t) {
  const original = globalThis.fetch;
  globalThis.fetch = () => { throw new Error('the real fetch must never be called'); };
  t.after(() => { globalThis.fetch = original; });
}
/** Waits for the creation to be in flight; fails at once if main() finished first. */
const whenInFlight = (inFlight, done) => Promise.race([inFlight, done.then(() => assert.fail('main() finished before the creation was in flight'))]);
/** The promise's value, or a failure after `ms`: a main() that never returns fails the test instead of hanging it. */
function within(promise, ms = 2000) {
  let timer;
  const late = new Promise((resolve, reject) => { timer = setTimeout(() => reject(new Error(`still pending after ${ms} ms`)), ms); });
  return Promise.race([promise, late]).finally(() => clearTimeout(timer));
}
const tick = () => new Promise((resolve) => setImmediate(resolve));
async function until(predicate) {
  for (let waited = 0; !predicate(); waited += 5) {
    assert.ok(waited < 2000, 'timed out waiting');
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
}
const accounts = (requests) => requests.filter((request) => request.path.startsWith('/auth/v1/admin/users/')).map((request) => request.path.slice('/auth/v1/admin/users/'.length));
const filter = encodeURIComponent('in.(user-a,user-b)');

test('a stop signal during fixture creation waits for the creation in flight, then deletes every account it made', async (t) => {
  noRealFetch(t);
  const signals = new EventEmitter(); const exits = [];
  let arrived; let release;
  const inFlight = new Promise((resolve) => { arrived = resolve; });
  const double = api({
    a: async () => answer(200, { id: 'user-a' }),
    b: () => { arrived(); return new Promise((resolve) => { release = () => resolve(answer(200, { id: 'user-b' })); }); },
    c: () => assert.fail('no account may be created after the stop signal'),
  });
  const { out, err, io } = capture();
  const done = main({ io, run: okStatus(), fetch: double.send, signals, exit: (code) => exits.push(code), runId: RUN_ID });
  await whenInFlight(inFlight, done);
  signals.emit('SIGINT', 'SIGINT');
  await tick();
  assert.deepEqual(double.deletes(), [], 'cleanup waits for the creation that is still in flight');
  release();
  assert.equal(await done, 1);
  await tick();
  assert.deepEqual(exits, [130]);
  assert.deepEqual(double.requests.slice(0, 2).map((request) => request.body.email), [fixtureEmail('a'), fixtureEmail('b')]);
  assert.deepEqual(double.requests.slice(2), double.deletes(), 'after the signal only cleanup requests are sent');
  assert.deepEqual(accounts(double.requests), ['user-a', 'user-b']);
  const rows = double.deletes().filter((request) => request.path.startsWith('/rest/v1/'));
  assert.equal(rows.length, 13);
  assert.ok(rows.every((request) => request.path.endsWith(`?owner_id=${filter}`)), 'every owner-table delete covers both accounts');
  assert.deepEqual(out, []);
  assert.equal(err.join(''), "SIGINT: removing this run's fixtures\nverify-identity setup failed: stopping: the member B fixture was created after the stop signal; cleanup removes it\n");
  assert.equal(signals.listenerCount('SIGINT') + signals.listenerCount('SIGTERM'), 0);
});

test('after a stop signal no request but cleanup is sent, even when the signal arrives during a sign-in', async (t) => {
  noRealFetch(t);
  const signals = new EventEmitter(); const exits = [];
  let arrived; let release;
  const inFlight = new Promise((resolve) => { arrived = resolve; });
  const double = api({ a: async () => answer(200, { id: 'user-a' }), b: async () => answer(200, { id: 'user-b' }), c: async () => answer(200, { id: 'user-c' }) });
  const send = (url, init = {}) => {
    if (!url.endsWith('/auth/v1/token?grant_type=password')) return double.send(url, init);
    double.requests.push({ method: init.method, path: url.slice(LOCAL_API_URL.length) });
    if (release) return Promise.resolve(answer(200, { access_token: 'fixture-session' })); // only the first sign-in waits
    arrived();
    return new Promise((resolve) => { release = () => resolve(answer(200, { access_token: 'fixture-session' })); });
  };
  const { io } = capture();
  const done = main({ io, run: okStatus(), fetch: send, signals, exit: (code) => exits.push(code), runId: RUN_ID });
  await whenInFlight(inFlight, done);
  const sent = double.requests.length;
  signals.emit('SIGINT', 'SIGINT');
  release();
  assert.equal(await done, 1);
  await tick();
  assert.deepEqual(exits, [130]);
  assert.deepEqual(double.requests.slice(sent).map((request) => request.method), Array(16).fill('DELETE'), 'only the 13 owner-table and 3 account deletes follow the signal');
  assert.deepEqual(accounts(double.requests), ['user-a', 'user-b', 'user-c']);
});

test('a creation that never finishes is named by its email, the accounts already made are deleted, and main still returns', async (t) => {
  noRealFetch(t);
  const signals = new EventEmitter(); const exits = [];
  let arrived;
  const inFlight = new Promise((resolve) => { arrived = resolve; });
  const double = api({ a: async () => answer(200, { id: 'user-a' }), b: () => { arrived(); return new Promise(() => {}); } });
  const { err, io } = capture();
  const done = main({ io, run: okStatus(), fetch: double.send, signals, exit: (code) => exits.push(code), runId: RUN_ID, settleMs: 20 });
  await whenInFlight(inFlight, done);
  signals.emit('SIGTERM', 'SIGTERM');
  await until(() => exits.length > 0);
  assert.deepEqual(exits, [143]);
  assert.equal(await within(done), 1);
  assert.deepEqual(accounts(double.requests), ['user-a']);
  assert.equal(err.join(''), `SIGTERM: removing this run's fixtures\nFixture cleanup needs attention: the member B account (${fixtureEmail('b')}) may exist; its creation did not finish\nverify-identity setup failed: stopping: this run was interrupted by SIGTERM\n`);
});

// Review a102fb68 finding 2: inside the replay runner, exit does nothing, so main itself must return once cleanup has run,
// even while a request never answers; that request is then aborted, so nothing keeps the process alive.
test('with an exit that does nothing, main returns after cleanup although a request never answers, and aborts it', async (t) => {
  noRealFetch(t);
  const signals = new EventEmitter(); const exits = [];
  let arrived; let held;
  const inFlight = new Promise((resolve) => { arrived = resolve; });
  const double = api({ a: async () => answer(200, { id: 'user-a' }), b: (init) => { held = init.signal; arrived(); return new Promise(() => {}); } });
  const { out, err, io } = capture();
  const done = main({ io, run: okStatus(), fetch: double.send, signals, exit: (code) => { exits.push(code); }, runId: RUN_ID, settleMs: 20 });
  await whenInFlight(inFlight, done);
  assert.equal(held?.aborted, false, 'a fixture request carries an abort signal, not yet aborted');
  signals.emit('SIGINT', 'SIGINT');
  assert.equal(await within(done), 1, 'main returns once cleanup has run');
  assert.deepEqual(exits, [130]);
  assert.equal(held.aborted, true, 'the request still in flight is aborted once cleanup has run');
  assert.ok(double.deletes().every((request) => request.signal === undefined), 'cleanup requests are never aborted');
  assert.deepEqual(accounts(double.requests), ['user-a']);
  assert.deepEqual(out, []);
  assert.equal(err.join(''), `SIGINT: removing this run's fixtures\nFixture cleanup needs attention: the member B account (${fixtureEmail('b')}) may exist; its creation did not finish\nverify-identity setup failed: stopping: this run was interrupted by SIGINT\n`);
  assert.equal(signals.listenerCount('SIGINT') + signals.listenerCount('SIGTERM'), 0);
});

test('a creation request that fails outright is named and fails the run; a refused creation names nothing', async (t) => {
  noRealFetch(t);
  for (const [b, named] of [[async () => { throw new Error('socket hang up'); }, true], [async () => answer(422, { code: 'email_exists', message: 'taken' }), false]]) {
    const signals = new EventEmitter();
    const double = api({ a: async () => answer(200, { id: 'user-a' }), b });
    const { err, io } = capture();
    assert.equal(await main({ io, run: okStatus(), fetch: double.send, signals, exit: () => assert.fail('no exit without a signal'), runId: RUN_ID }), 1);
    assert.deepEqual(accounts(double.requests), ['user-a']);
    const text = err.join('');
    assert.match(text, named ? /^verify-identity setup failed: socket hang up\n/m : /^verify-identity setup failed: Creating the member B fixture failed: HTTP 422 \{"code":"email_exists","message":"taken"\}\n/m);
    assert.equal(text.includes(`Fixture cleanup needs attention: the member B account (${fixtureEmail('b')}) may exist; its creation request did not complete\n`), named);
    assert.equal(signals.listenerCount('SIGINT') + signals.listenerCount('SIGTERM'), 0);
  }
});
