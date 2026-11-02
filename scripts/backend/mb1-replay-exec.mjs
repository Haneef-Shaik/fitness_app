// MB-1 replay runner, the executor: runCommand, its timeouts and the allowlisted child environment (review a102fb68
// findings 1 and 5). Moved unchanged from mb1-replay.mjs in SF-0 (docs/plan/runs/MB-1/sf0.md).
// Internal: only mb1-replay.mjs and its sibling modules import this; all else goes through runReplay, so dispatch (the lock,
// the halt, the confirm tokens and the plan order) always runs first. mb1-replay-scope.test.mjs pins it (review 0605Z L1).
import { spawn } from 'node:child_process';

const SHORT = 120_000;
const LONG = 600_000;
const KILL_GRACE_MS = 5_000;
const MAX_OUTPUT = 64 * 1024 * 1024;
/** The only variables a child process gets: enough for Docker and the CLI to run, and nothing that steers either. */
export const CHILD_ENV = Object.freeze(['PATH', 'HOME', 'USER', 'LOGNAME', 'TMPDIR', 'LANG', 'LC_ALL', 'LC_CTYPE', 'TZ', 'DOCKER_HOST', 'DOCKER_CONTEXT', 'DOCKER_CONFIG', 'DOCKER_CERT_PATH', 'DOCKER_TLS_VERIFY']);

/** The allowlisted subset of an environment: what every child process gets, and all it gets. */
export function childEnv(env) {
  return Object.fromEntries(CHILD_ENV.filter((name) => typeof env[name] === 'string').map((name) => [name, env[name]]));
}

/* ---------------------------------------------------------------- The executor ------------------------------------- */

/**
 * Runs one command from an argument array, with no shell, in its own process group (`detached`), with exactly `env` (it is
 * required: a child never inherits the runner's environment). On a timeout, or SIGINT or SIGTERM on `signals` while it runs,
 * the whole group gets SIGTERM, then SIGKILL after `graceMs` (or as soon as its leader has gone, to sweep any straggler),
 * so no CLI process outlives the command. A spawn failure, timeout or signal gives status null, no output and only its code.
 */
export function runCommand(command, args, { cwd, input, env, timeoutMs = SHORT, graceMs = KILL_GRACE_MS, signals = process, spawnImpl = spawn, killImpl = process.kill } = {}) {
  if (env === null || typeof env !== 'object') return Promise.reject(new TypeError("runCommand needs an explicit environment; a child never inherits the runner's own"));
  return new Promise((resolve) => {
    let child;
    try { child = spawnImpl(command, args, { cwd, env, detached: true, stdio: [input === undefined ? 'ignore' : 'pipe', 'pipe', 'pipe'], windowsHide: true }); } catch (error) {
      resolve({ status: null, stdout: '', stderr: '', error: error.code ?? 'spawn failed' });
      return;
    }
    const out = []; const err = [];
    let size = 0; let reason = null; let killed = false; let done = false; let graceTimer;
    const group = (signal) => {
      if (!Number.isInteger(child.pid)) return;
      try { killImpl(-child.pid, signal); } catch (error) { if (error.code !== 'ESRCH') reason = `${reason}; ${signal} to the process group failed (${error.code ?? 'unknown'})`; }
    };
    const stop = (why) => {
      if (reason || done) return;
      reason = why;
      group('SIGTERM');
      graceTimer = setTimeout(() => { if (!done) { killed = true; group('SIGKILL'); } }, graceMs);
    };
    const onInt = () => stop('SIGINT');
    const onTerm = () => stop('SIGTERM');
    const timer = setTimeout(() => stop('ETIMEDOUT'), timeoutMs);
    signals.on('SIGINT', onInt);
    signals.on('SIGTERM', onTerm);
    const finish = (result) => {
      if (done) return;
      done = true;
      clearTimeout(timer); clearTimeout(graceTimer);
      signals.off('SIGINT', onInt); signals.off('SIGTERM', onTerm);
      resolve(result);
    };
    const collect = (chunks) => (chunk) => { size += chunk.length; if (size > MAX_OUTPUT) stop('ENOBUFS'); else chunks.push(Buffer.from(chunk)); };
    child.stdout.on('data', collect(out));
    child.stderr.on('data', collect(err));
    child.on('error', (error) => finish({ status: null, stdout: '', stderr: '', error: error.code ?? 'spawn failed' }));
    child.on('close', (code, signal) => {
      if (reason && !killed) group('SIGKILL'); // the leader has gone; SIGKILL sweeps any process of its group that ignored SIGTERM
      if (reason) finish({ status: null, stdout: '', stderr: '', error: reason });
      else if (code === null) finish({ status: null, stdout: '', stderr: '', error: signal ?? 'no exit status' });
      else finish({ status: code, stdout: Buffer.concat(out).toString('utf8'), stderr: Buffer.concat(err).toString('utf8') });
    });
    if (input !== undefined) {
      child.stdin.on('error', () => { /* EPIPE: the child exited before reading all of stdin; its exit status reports it */ });
      child.stdin.end(input);
    }
  });
}

export { LONG, SHORT };
