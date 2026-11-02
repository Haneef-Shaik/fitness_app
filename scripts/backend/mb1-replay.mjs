// The MB-1 replay runner's entry point: the command table, the order of checks, dispatch and the lock. SF-0 moved its other
// parts, unchanged, into mb1-replay-{exec,live,sql,commands,shared}.mjs (docs/plan/runs/MB-1/sf0.md).
import { randomUUID } from 'node:crypto';
import * as nodeFs from 'node:fs';
import { join } from 'node:path';
import { invokedDirectly, REPO_ROOT } from './local-stack.mjs';
import { addCandidate, check, checked, images, migrate, migrations, mutate, prepare, retain, snapshot, start, stop, suite, teardown, verifyCli } from './mb1-replay-commands.mjs';
import { assertNoSecrets, diffResult, lintResult, redact, secretHits } from './mb1-replay-evidence.mjs';
import { childEnv, runCommand } from './mb1-replay-exec.mjs';
import { refuse, refuseEnvFiles, refuseRemoteDocker, refuseSupabaseVariables, replayRunning, replayStopped, sharedConfigBound, sharedUnchanged } from './mb1-replay-live.mjs';
import { haltNeeds, mutateNeeds, passed, sharedApplyNeeds, sharedSnapshotNeeds, snapshotNeeds, spacing, suiteNeeds } from './mb1-replay-order.mjs';
import { sharedApply, sharedSnapshot, sharedSuite } from './mb1-replay-shared.mjs';
import { lstatOrNull, teardownNeeds } from './mb1-replay-sql.mjs';
import { acquireLock, checkOwnedDir, lockText, releaseLock, replayTarget, STATE } from './mb1-replay-target.mjs';
import { main as identitySuite } from './verify-identity.mjs';
export { CHILD_ENV, childEnv, runCommand } from './mb1-replay-exec.mjs';
export { SUPABASE, SUPABASE_CLI } from './mb1-replay-live.mjs';

// The one runner for MB-1's disposable replay project (phase2-plan.md; review 39fe1fb5 finding 1). It takes the literal
// directory /tmp/fitlog-mb1-replay-YYYYMMDD and no shell variable. Before every command, in this order, it checks:
//   0. that no SUPABASE_* variable is set (names only are printed), because one can override the replay's config.toml,
//      project_id included (review a102fb68 finding 1); every child then gets only an allowlisted environment; and that no
//      .env file is in a directory the CLI may read it from, for the repository or the replay: their supabase directories,
//      themselves and every parent (paths only; no file is read; review b75d1e73 finding 3);
//   1. the literal path (no I/O);
//   2. the owned directory: not a link, its real location /tmp or /private/tmp, sentinel, manifest sha256s, config
//      project_id and its eight 564xx ports (mb1-replay-target.mjs); then it takes the directory's lock, so one command
//      runs at a time, and checks the directory again under it (review a102fb68 finding 5);
//   3. that the shared 55321 database container still has the start time pinned at prepare;
//   4. the CLI flags it uses were found in the CLI's own --help; stop and teardown carry --confirm fitlog-mb1-replay-<date>,
//      and shared-apply its own --confirm fitlog-mb1-shared-apply-<date> (review a102fb68 finding 4);
//   5. the plan order, from the runner's state (snapshots, mutation proofs, suite spacing, retained SQL);
//   6. live: `supabase status` for the directory answers at 56421 with its database at 127.0.0.1:56422, and the replay
//      container runs (or, for start, no replay container runs). 55321 commands need the repository's status at exactly
//      127.0.0.1:55321 with its database at 127.0.0.1:55322 (review b75d1e73 finding 3).
// 55321 commands also need, before any child process (between 2 and 3), the repository's config bound to that database: no
// supabase/config.json, which the CLI prefers (names only), and a config.toml whose [db] port is 55322 and which is the one
// the replay was prepared from (review 19eea0f3 finding 1). shared-apply checks all of that, the SUPABASE_* and .env
// refusals, the pinned candidate and the repository's migrations again immediately before migration up, and hashes the
// candidate again after it (review 19eea0f3 finding 2).
// The candidate's bytes are pinned by a constant at add-candidate and shared-apply (review b75d1e73 finding 4), and the
// migration list must prove the manifest's migrations row by row (F5). GoTrue's ban answer has three classes, live, ended
// and banned (F6). Review bbe2fbba (phase 1G): shared-apply's migration up reads a runner-owned, manifest-pinned staging copy,
// never the repository; its attempt is recorded before the CLI starts, every guard runs again after it as a STOP, and exit 0
// needs 55321 equal to the replay's after snapshot (finding 1). M2 holds under live or banned only on its exact kill, and is
// refused under ended (finding 2); expected failures need their exact detail line (finding 3); the before snapshot is never
// retaken (finding 4). Review 2026-10-26T2000Z (phase 1H): any complete M2 run whose banned check passed stops M2, a passed
// M2 never runs again, and a stop blocks shared-apply even after a pass (finding 1); start and migrate recheck the replay
// directory, its config and the environment synchronously immediately before the CLI, and migrate again after it as a
// recorded STOP that halts every later command (finding 2). Review 2026-10-26T2305Z (phase 1I): an M2 run whose banned check
// passed is the stop, complete or not (finding 1); migrations, diff, lint and stop recheck before the CLI, diff and lint after
// it as the same recorded STOP (finding 4). SF-7 (review 2026-10-27T0405Z findings 1 and 4): every 55321 command needs Docker's
// own binding of the shared stack; shared-apply proves the route to 55321 with the staged migration list and reads the binding
// again before the final guards, and once more after migration up as a STOP; state.json's shared pin must be "true <ISO
// time>". The replay's own binding (the mirror) is held until a reviewed first live read of Docker's shape.
// SF-7b (review 2026-10-27T0905Z L1-L4): 55321 commands refuse a DOCKER_HOST that does not match ^unix:/// (a unix socket with
// an absolute path; a bare unix:// is refused); both inspects say --type container; 55321 snapshots exec the proven database
// ID; and no STOP advises a runner read of a changed container. SF-7c (review 2026-10-27T0935Z L1): right after the binding,
// the proven database ID is inspected and must carry the start time pinned at prepare, before any exec, attempt or apply.
// SF-7d (review 2026-10-27T1105Z L1, L2): shared-apply inspects that ID again right after its second binding read, as the last
// child before the final guards, and after migration up both before and after the after snapshot, each change a STOP.
// Lifecycle commands check the shared container by name again afterwards, once. SF-7e (review 2026-10-27T1132Z L1): a
// verified shared-apply is written only after that check holds, so sharedApplied means every check of the apply held, that
// one included, before state.json recorded it. It does not mean exit 0: a lock-release STOP or a failed evidence write may
// follow. Every other outcome, and every other lifecycle command, writes its state first and is checked after it.
// The Supabase CLI is the installed executable, run by this node with `--workdir <the literal path>`, never through pnpm;
// stop names the replay's literal --project-id. Every child runs in its own process group, and a timeout or a signal to the
// runner stops the whole group (review a102fb68 finding 5).
// Output is allowlisted and redacted before it is printed or saved (39fe1fb5 finding 2); verdicts are mechanical (findings
// 3, 4); SQL is hash-pinned, the preconditions to the reviewed block's constant (a102fb68 finding 3), and the read-only
// runner sets the session default to read-only (39fe1fb5 finding 6). Nothing is ever removed recursively.

const USAGE = 'usage: node scripts/backend/mb1-replay.mjs <command> /tmp/fitlog-mb1-replay-YYYYMMDD [argument] [--confirm fitlog-mb1-replay-YYYYMMDD | fitlog-mb1-shared-apply-YYYYMMDD] [--evidence phase2-<name>]';

/**
 * Each command: its argument, whether it needs the verified CLI or a confirmation token ('replay' for stop and teardown,
 * 'shared' for shared-apply), whether it is a 55321 command (`shared`: the repository's config is bound before any child
 * process), its plan-order check, the live state it needs (running or stopped), and whether it is a lifecycle command
 * (shared stack checked again after).
 */
const OPS = Object.freeze({
  prepare: { run: prepare },
  'verify-cli': { run: verifyCli },
  check: { live: 'running', run: check },
  start: { cli: true, live: 'stopped', lifecycle: true, run: start },
  migrations: { cli: true, live: 'running', run: migrations },
  'add-candidate': { needs: (state) => (state.candidate !== 'absent' || state.generation !== 1 ? 'add-candidate runs once, on the first start' : !passed(state, 'red') ? 'add-candidate needs a passing red suite first' : null), run: addCandidate },
  migrate: { cli: true, live: 'running', lifecycle: true, needs: (state) => (state.candidate === 'added' ? null : 'migrate needs add-candidate first'), run: migrate },
  diff: { cli: true, live: 'running', lifecycle: true, run: (ctx) => checked(ctx, 'diff', diffResult) },
  lint: { cli: true, live: 'running', run: (ctx) => checked(ctx, 'lint', lintResult) },
  images: { live: 'running', run: images },
  snapshot: { arg: 'before|after|m1|m2|m3|restored|fresh16', live: 'running', needs: snapshotNeeds, run: snapshot },
  mutate: { arg: 'm1|m2|m3|restore-m1|restore-member-active', live: 'running', needs: mutateNeeds, run: mutate },
  suite: { arg: 'red|green|m1|m2|m3', live: 'running', needs: suiteNeeds, run: suite },
  'shared-snapshot': { arg: 'before|after', shared: true, needs: sharedSnapshotNeeds, run: sharedSnapshot },
  'shared-apply': { confirm: 'shared', shared: true, lifecycle: true, needs: sharedApplyNeeds, run: sharedApply },
  'shared-suite': { shared: true, needs: (state, arg, now) => (!state.sharedApplied || !state.snapshots['55321-after'] ? 'shared-suite needs shared-apply and the 55321-after snapshot first' : spacing(state, 'shared', now)), run: sharedSuite },
  retain: { run: retain },
  stop: { cli: true, confirm: 'replay', live: 'running', lifecycle: true, run: stop },
  teardown: { cli: true, confirm: 'replay', lifecycle: true, needs: teardownNeeds, run: teardown },
});

function parseArgs(argv) {
  const [op, dir, ...rest] = argv;
  if (op === undefined || dir === undefined) throw refuse(USAGE);
  if (!Object.hasOwn(OPS, op)) throw refuse(`unknown command ${op}; ${USAGE}`);
  const options = { op, dir, positional: [], confirm: undefined, evidence: undefined };
  for (let index = 0; index < rest.length; index += 1) {
    if (rest[index] === '--confirm' || rest[index] === '--evidence') { options[rest[index].slice(2)] = rest[index + 1] ?? ''; index += 1; }
    else if (rest[index].startsWith('--')) throw refuse(`unknown option ${rest[index]}`);
    else options.positional.push(rest[index]);
  }
  return options;
}
/** The shared container's pin as prepare records it: running, with Docker's start time (review 2026-10-27T0405Z finding 4). */
const SHARED_PIN = /^true \d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(\.\d{1,9})?(Z|[+-]\d\d:\d\d)$/;
function readState(ctx) {
  let state;
  try { state = JSON.parse(ctx.fs.readFileSync(join(ctx.target.dir, STATE), 'utf8')); } catch { throw refuse(`${STATE} is not JSON`); }
  if (state?.version !== 1 || typeof state.shared !== 'string' || !Array.isArray(state.suites) || !Array.isArray(state.mutations)) throw refuse(`${STATE} is not this runner's state`);
  if (!SHARED_PIN.test(state.shared)) throw refuse(`${STATE}'s shared pin is not "true <ISO time>" (the shared 55321 database container's start time, pinned at prepare), so it is not this runner's state`);
  return state;
}

async function dispatch(ctx, { op, dir, positional, confirm, evidence }) {
  const spec = OPS[op];
  ctx.target = replayTarget(dir);
  if (spec.arg ? positional.length !== 1 : positional.length) throw refuse(spec.arg ? `${op} takes one argument: ${spec.arg}` : `${op} takes no argument`);
  if (confirm !== undefined && !spec.confirm) throw refuse(`${op} takes no --confirm`);
  if (evidence !== undefined && (!/^phase2-[a-z0-9-]+$/.test(evidence) || lstatOrNull(ctx.fs, join(ctx.evidenceDir, `${evidence}.txt`)))) throw refuse(`--evidence needs a new phase2-<name> (${JSON.stringify(evidence)} is not one, or already exists)`);
  refuseSupabaseVariables(ctx);
  // A .env file's SUPABASE_* names override config.toml too, ports included (review b75d1e73 finding 3): paths only.
  refuseEnvFiles(ctx);
  const lock = { op, pid: ctx.pid, startedAt: new Date(ctx.now()).toISOString(), token: ctx.token() };
  if (op === 'prepare') return prepare(ctx, lock);
  checkOwnedDir(ctx.target, ctx.fs); // the directory is checked before the lock file is written into it
  acquireLock(ctx.target, ctx.fs, lockText(ctx.target, lock));
  ctx.lock = { token: lock.token, released: false };
  ctx.manifest = checkOwnedDir(ctx.target, ctx.fs); // and again under the lock, which every later step runs under
  ctx.state = readState(ctx);
  const halted = haltNeeds(ctx.state); // review 2026-10-26T2000Z finding 2: a recorded STOP, before any child process
  if (halted) throw refuse(halted);
  if (spec.shared) refuseRemoteDocker(ctx); // SF-7b (review 2026-10-27T0905Z L1): before any child process, value never printed
  if (spec.shared) sharedConfigBound(ctx); // review 19eea0f3 finding 1: before any child process
  await sharedUnchanged(ctx, `before ${op}`);
  if (spec.cli && !ctx.state.cli) throw refuse("run verify-cli first: no Supabase command runs before its flags are found in the CLI's own help");
  const token = spec.confirm === 'shared' ? ctx.target.sharedConfirm : ctx.target.confirm;
  if (spec.confirm && confirm !== token) throw refuse(`${op} needs --confirm ${token}`);
  const need = spec.needs?.(ctx.state, positional[0], ctx.now(), ctx);
  if (need) throw refuse(need);
  if (spec.live === 'running') await replayRunning(ctx);
  else if (spec.live === 'stopped') await replayStopped(ctx);
  // SF-7e (review 2026-10-27T1132Z L1): a lifecycle command checks the shared container by name once after it runs. A verified
  // shared-apply (exit 0: sharedApplied and 55321-after) is checked before its state is written, so a change there is a STOP
  // with only the attempt on disk. Every other outcome, and every other lifecycle command, is checked in finally, after any
  // state is written, so a STOP's stopRecorded and stop's generation persist, and so does an error path's check.
  let checkedAfter = false;
  try {
    const result = await spec.run(ctx, positional[0]);
    if (op === 'shared-apply' && result.code === 0) { checkedAfter = true; await sharedUnchanged(ctx, `after ${op}`); }
    if (result.state && op !== 'teardown') ctx.fs.writeFileSync(join(ctx.target.dir, STATE), `${JSON.stringify(result.state, null, 2)}\n`);
    return result;
  } finally {
    if (spec.lifecycle && !checkedAfter) await sharedUnchanged(ctx, `after ${op}`);
  }
}
/** Releases this invocation's lock, if it holds one; returns why it could not, or null. */
function releaseHeld(ctx) {
  if (!ctx.lock || ctx.lock.released) return null;
  ctx.lock = { ...ctx.lock, released: true };
  try {
    const status = releaseLock(ctx.target, ctx.fs, ctx.lock.token);
    return status === 'released' ? null : status;
  } catch (error) {
    return `the lock ${ctx.target.dir} could not be released (${error.code ?? 'unknown error'}); it was left in place`;
  }
}

/** Runs one command and returns its exit code. Every dependency can be injected; the defaults are the real ones. */
export async function runReplay(argv, deps = {}) {
  const ctx = {
    exec: runCommand, fs: nodeFs, now: Date.now, io: process, env: process.env, signals: process, pid: process.pid, token: randomUUID, repoRoot: REPO_ROOT,
    suite: identitySuite, evidenceDir: join(REPO_ROOT, 'docs/evidence/MB-1'),
    readRepo: (rel) => nodeFs.readFileSync(join(REPO_ROOT, rel)), listMigrations: () => nodeFs.readdirSync(join(REPO_ROOT, 'supabase/migrations')), ...deps,
  };
  // Every child, whatever the executor, gets only the allowlisted environment and the runner's signals (finding 1 and 5).
  const exec = ctx.exec;
  ctx.childEnv = Object.freeze(childEnv(ctx.env));
  ctx.exec = (command, args, options = {}) => exec(command, args, { ...options, env: ctx.childEnv, signals: ctx.signals });
  const printed = [];
  ctx.print = (text) => { printed.push(text); };
  let parsed;
  let code = 1;
  let refusal = null;
  try {
    parsed = parseArgs(argv);
    ({ code } = await dispatch(ctx, parsed));
  } catch (error) {
    const message = redact(String(error?.message ?? error)).split('\n')[0];
    refusal = secretHits(message).length ? 'a refusal message held a secret-shaped value and is withheld' : message;
    code = 1;
  }
  const lockProblem = releaseHeld(ctx);
  if (lockProblem) { ctx.print(`# STOP: ${lockProblem}\n`); code = 1; }
  const out = `${printed.join('')}# mb1-replay ${parsed?.op ?? '(none)'}: exit ${code}\n`;
  ctx.io.stdout.write(out);
  if (refusal) ctx.io.stderr.write(`mb1-replay refused: ${refusal}\n`);
  if (parsed?.evidence && ctx.target && !(refusal ?? '').startsWith('--evidence')) {
    try { ctx.fs.writeFileSync(join(ctx.evidenceDir, `${parsed.evidence}.txt`), assertNoSecrets(`${out}${refusal ? `mb1-replay refused: ${refusal}\n` : ''}`), { flag: 'wx' }); } catch (error) { ctx.io.stderr.write(`mb1-replay: evidence not written (${error.code ?? 'secret-shaped output'})\n`); return 1; }
  }
  return code;
}

if (invokedDirectly(import.meta.url)) process.exitCode = await runReplay(process.argv.slice(2));
