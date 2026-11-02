// MB-1 replay runner tests: the executor (review a102fb68 finding 5). Moved unchanged from mb1-replay.test.mjs in SF-0
// (docs/plan/runs/MB-1/sf0.md); the shared harness is mb1-replay-test-harness.mjs.
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PassThrough } from 'node:stream';
import { test } from 'node:test';
import { DIR, gone, NODE, until, within } from './mb1-replay-test-harness.mjs';
import { runCommand } from './mb1-replay.mjs';

/* ---------------------------------------------------------------- The executor (review a102fb68 finding 5) ----------- */

test('the real executor passes arguments, stdin and exactly the given environment, with no shell; a spawn failure or timeout gives only its code', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'fitlog-mb1-exec-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const echo = join(dir, 'echo.mjs');
  writeFileSync(echo, "let input = ''; process.stdin.on('data', (d) => { input += d; }).on('end', () => process.stdout.write(JSON.stringify({ args: process.argv.slice(2), input, env: Object.keys(process.env).filter((name) => !name.startsWith('__CF_')).sort() })));\n");
  const args = ['a b; echo $HOME', '$(touch never)', '--workdir', DIR];
  const result = await runCommand(NODE, [echo, ...args], { input: Buffer.from('select 1;\n'), env: { FITLOG_ONLY: 'yes', PATH: '/usr/bin:/bin' } });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout), { args, input: 'select 1;\n', env: ['FITLOG_ONLY', 'PATH'] });
  assert.equal(existsSync(join(dir, 'never')), false);
  assert.deepEqual(await runCommand(join(dir, 'no-such-binary'), [], { env: {} }), { status: null, stdout: '', stderr: '', error: 'ENOENT' });
  assert.deepEqual(await runCommand(NODE, ['-e', 'setTimeout(() => {}, 5000)'], { env: {}, timeoutMs: 100, graceMs: 50 }), { status: null, stdout: '', stderr: '', error: 'ETIMEDOUT' });
});

/** A child process double: real streams, a pid, and `finish` to end it the way node does (exit, streams end, then close). */
function fakeChild(pid) {
  const child = new EventEmitter();
  Object.assign(child, { pid, stdin: new PassThrough(), stdout: new PassThrough(), stderr: new PassThrough() });
  child.finish = (code, signal = null) => { child.emit('exit', code, signal); child.stdout.end(); child.stderr.end(); setImmediate(() => child.emit('close', code, signal)); };
  return child;
}

test('the executor runs each command as its own process group with only the given environment, and stops the whole group', async () => {
  const spawned = [];
  const spawnImpl = (command, args, options) => { const child = fakeChild(4242 + spawned.length); spawned.push({ command, args, options, child }); return child; };
  // Without an explicit environment nothing is spawned: no child ever inherits the runner's own environment.
  await assert.rejects(runCommand('supabase-double', ['status'], { spawnImpl }), /runCommand needs an explicit environment/);
  assert.equal(spawned.length, 0);

  const kills = [];
  const killImpl = (pid, signal) => { kills.push([pid, signal]); if (kills.length > 3) throw Object.assign(new Error('gone'), { code: 'ESRCH' }); };
  const signals = new EventEmitter();
  const listeners = () => signals.listenerCount('SIGINT') + signals.listenerCount('SIGTERM');

  // A normal run: output collected, stdin written, nothing killed, no listener left.
  const normal = runCommand('supabase-double', ['status', '-o', 'json'], { env: { PATH: '/usr/bin' }, input: 'select 1;\n', timeoutMs: 1000, graceMs: 10, signals, spawnImpl, killImpl });
  const first = spawned[0];
  assert.deepEqual({ command: first.command, args: first.args, detached: first.options.detached, env: first.options.env, shell: first.options.shell ?? false, stdio: first.options.stdio },
    { command: 'supabase-double', args: ['status', '-o', 'json'], detached: true, env: { PATH: '/usr/bin' }, shell: false, stdio: ['pipe', 'pipe', 'pipe'] });
  assert.equal(listeners(), 2, 'a signal to the runner reaches the command while it runs');
  let stdin = '';
  first.child.stdin.on('data', (chunk) => { stdin += chunk; });
  first.child.stdout.write('{"ok":true}\n');
  first.child.stderr.write('a warning\n');
  first.child.finish(0);
  assert.deepEqual(await normal, { status: 0, stdout: '{"ok":true}\n', stderr: 'a warning\n' });
  assert.equal(stdin, 'select 1;\n');
  assert.deepEqual(kills, []);
  assert.equal(listeners(), 0);

  // A timeout: SIGTERM to the whole group (the negative pid), then SIGKILL after the grace period.
  const slow = runCommand('supabase-double', ['migration', 'up'], { env: {}, timeoutMs: 20, graceMs: 20, signals, spawnImpl, killImpl });
  const second = spawned[1].child;
  await until(() => kills.length === 2);
  assert.deepEqual(kills, [[-second.pid, 'SIGTERM'], [-second.pid, 'SIGKILL']]);
  second.finish(null, 'SIGKILL');
  assert.deepEqual(await slow, { status: null, stdout: '', stderr: '', error: 'ETIMEDOUT' });
  assert.equal(listeners(), 0);

  // A signal to the runner: the group gets SIGTERM; once its leader has gone, SIGKILL sweeps any straggler, and a group
  // that is already gone (ESRCH) is not an error.
  const interrupted = runCommand('supabase-double', ['stop'], { env: {}, timeoutMs: 60_000, graceMs: 60_000, signals, spawnImpl, killImpl });
  const third = spawned[2].child;
  signals.emit('SIGINT', 'SIGINT');
  assert.deepEqual(kills.slice(2), [[-third.pid, 'SIGTERM']]);
  third.finish(null, 'SIGTERM');
  assert.deepEqual(await within(interrupted), { status: null, stdout: '', stderr: '', error: 'SIGINT' });
  assert.deepEqual(kills.slice(2), [[-third.pid, 'SIGTERM'], [-third.pid, 'SIGKILL']]);
  assert.equal(listeners(), 0);
});

test('a timed-out or interrupted command leaves no process behind, even a grandchild that ignores SIGTERM', async (t) => {
  const probe = runCommand(NODE, ['-e', ''], { env: {} });
  assert.ok(probe instanceof Promise, 'runCommand is asynchronous, so a signal can reach it while a command runs');
  assert.equal((await probe).status, 0);
  const dir = mkdtempSync(join(tmpdir(), 'fitlog-mb1-group-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  // A parent and a grandchild that both ignore SIGTERM, as a CLI shim and the binary it starts might; each also exits on
  // its own after 20 s, so a failing run of this test cannot leave a process behind for long.
  const parent = join(dir, 'parent.mjs');
  writeFileSync(parent, [
    "import { spawn } from 'node:child_process';",
    "import { writeFileSync } from 'node:fs';",
    "const stubborn = \"process.on('SIGTERM', () => {}); setTimeout(() => process.exit(0), 20000); setInterval(() => {}, 1000);\";",
    "const child = spawn(process.execPath, ['-e', stubborn], { stdio: 'ignore' });",
    "process.on('SIGTERM', () => {});",
    'setTimeout(() => process.exit(0), 20000);',
    'writeFileSync(process.argv[2], String(child.pid));',
    'setInterval(() => {}, 1000);',
    '',
  ].join('\n'));
  const timeoutPid = join(dir, 'timeout.pid');
  const timedOut = await runCommand(NODE, [parent, timeoutPid], { env: {}, timeoutMs: 1500, graceMs: 200, signals: new EventEmitter() });
  assert.deepEqual(timedOut, { status: null, stdout: '', stderr: '', error: 'ETIMEDOUT' });
  await gone(Number(readFileSync(timeoutPid, 'utf8')));

  const signals = new EventEmitter();
  const signalPid = join(dir, 'signal.pid');
  const running = runCommand(NODE, [parent, signalPid], { env: {}, timeoutMs: 60_000, graceMs: 200, signals });
  await until(() => existsSync(signalPid) && readFileSync(signalPid, 'utf8') !== '');
  signals.emit('SIGINT', 'SIGINT');
  assert.deepEqual(await within(running, 5000), { status: null, stdout: '', stderr: '', error: 'SIGINT' });
  await gone(Number(readFileSync(signalPid, 'utf8')));
  assert.equal(signals.listenerCount('SIGINT') + signals.listenerCount('SIGTERM'), 0);
});
