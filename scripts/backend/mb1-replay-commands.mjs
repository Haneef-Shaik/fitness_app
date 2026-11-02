// MB-1 replay runner, the replay commands, prepare to teardown, with the replay guards and the STOP after a CLI that may
// write. Moved unchanged from mb1-replay.mjs in SF-0 (docs/plan/runs/MB-1/sf0.md).
// Internal: only mb1-replay.mjs and its sibling modules import this; all else goes through runReplay, so dispatch (the lock,
// the halt, the confirm tokens and the plan order) always runs first. mb1-replay-scope.test.mjs pins it (review 0605Z L1).
import { basename, join } from 'node:path';
import {
  appliedMigrations, assertNoSecrets, banNote, CANDIDATE, CANDIDATE_SHA256, imageProblems, judgeSuite, M2_UNKILLED, m2RunUnkilled, migrationListResult, renderRun,
  secretHits, sha256,
} from './mb1-replay-evidence.mjs';
import { SHORT } from './mb1-replay-exec.mjs';
import {
  cliCall, commandWords, refuse, refuseEnvFiles, refuseSupabaseVariables, replayContainers, replayRunning, sharedFingerprint, SUPABASE, supabase, SUPABASE_CLI,
} from './mb1-replay-live.mjs';
import { ending, evidencePath, lstatOrNull, pinned, reason, recordSnapshot, sqlFiles, takeSnapshot, writePsql } from './mb1-replay-sql.mjs';
import {
  addOwnedFile, checkOwnedDir, createReplayDir, fillReplayDir, lockText, MANIFEST, manifestMigrations, removeOwnedDir, REPLAY_API_URL, replayFiles,
} from './mb1-replay-target.mjs';

const MUTATIONS = Object.freeze({ m1: 'sql/m1.sql', m2: 'sql/m2.sql', m3: 'sql/m3.sql', 'restore-m1': `supabase/migrations/${CANDIDATE}`, 'restore-member-active': 'sql/restore-member-active.sql' });

/* ---------------------------------------------------------------- Commands ------------------------------------------- */

const newState = (shared) => ({ version: 1, shared, cli: null, generation: 1, candidate: 'absent', active: null, proven: null, restoredProof: false, mutations: [], snapshots: {}, suites: [], ban: null, checks: {}, sharedApplied: false });

async function prepare(ctx, lock) {
  const shared = await sharedFingerprint(ctx);
  if (!shared.startsWith('true ')) throw refuse('the shared 55321 database container must be running at prepare, so its start time can be pinned');
  const files = replayFiles(ctx.target, ctx.readRepo, ctx.listMigrations());
  createReplayDir(ctx.target, ctx.fs, lockText(ctx.target, lock));
  ctx.lock = { token: lock.token, released: false };
  fillReplayDir(ctx.target, ctx.fs, files, newState(shared));
  const manifest = checkOwnedDir(ctx.target, ctx.fs);
  ctx.print(`prepared ${ctx.target.dir}: ${files.size} files; sentinel and manifest written; shared stack pinned at "${shared}"\n`);
  for (const [rel, hash] of Object.entries(manifest.files)) {
    const source = rel === 'supabase/config.toml' ? 'generated from supabase/config.toml: project_id and eight ports'
      : rel === 'sql/preconditions.sql' ? "the reviewed phase1.md block; its sha256 is the runner's constant"
        : rel.startsWith('sql/') ? 'generated from the candidate and member_core.sql'
          : sha256(ctx.readRepo(rel)) === hash ? 'equals the repository file' : 'DIFFERS from the repository file';
    ctx.print(`${hash}  ${rel} (${source})\n`);
  }
  return { code: 0 };
}
async function verifyCli(ctx) {
  const out = await cliCall(ctx, ['--version'], SHORT);
  const version = out.status === 0 ? out.stdout.trim() : '';
  if (!/^\d+\.\d+\.\d+$/.test(version)) throw refuse('supabase --version did not print a version');
  ctx.print(`# supabase CLI: node_modules/.bin/supabase, run directly by node (never through pnpm)\n# child environment: ${Object.keys(ctx.childEnv).join(', ') || '(empty)'} (an allowlist; values are not printed; no SUPABASE_* variable is set)\n`);
  let ok = true;
  for (const spec of Object.values(SUPABASE)) {
    const words = commandWords(spec.args(ctx.target));
    const help = await cliCall(ctx, [...words, '--help'], SHORT);
    const flags = [...spec.flags, '--workdir'];
    const missing = flags.filter((flag) => !new RegExp(`(^|[\\s,[])${flag.replace(/[.*+?^${}()|[\]\\-]/g, '\\$&')}($|[\\s,=\\]])`, 'm').test(`${help.stdout}\n${help.stderr}`));
    ok = ok && help.status === 0 && missing.length === 0;
    ctx.print(`supabase ${version} ${words.join(' ')} --help: ${help.status !== 0 ? `failed (exit ${help.status})` : missing.length ? `MISSING ${missing.join(', ')}` : `lists ${flags.join(', ')}`}\n`);
  }
  return { code: ok ? 0 : 1, state: { ...ctx.state, cli: ok ? { version } : null } };
}
/**
 * Review 2026-10-26T2000Z finding 2: what the replay CLI reads, checked again synchronously with no await before start's or
 * migrate's child starts, and after migrate as a STOP: no SUPABASE_* variable, no .env file the CLI may load, the owned
 * directory exactly as written (every pin re-hashed, nothing foreign, the config's project_id and eight 564xx ports), and the
 * manifest's pins the ones read under the lock when this command began.
 */
function replayGuards(ctx, at) {
  refuseSupabaseVariables(ctx);
  refuseEnvFiles(ctx);
  const now = checkOwnedDir(ctx.target, ctx.fs);
  const changed = [...new Set([...Object.keys(ctx.manifest.files), ...Object.keys(now.files)])].filter((rel) => ctx.manifest.files[rel] !== now.files[rel]).sort();
  if (changed.length) throw refuse(`${MANIFEST} changed while this command ran (${changed.join(', ')}): its pins are not the ones checked under the lock`);
  ctx.print(`# rechecked ${at} on the replay: no SUPABASE_* variable, no .env file, the ${Object.keys(now.files).length} file(s) pinned in ${MANIFEST} each sha256 equal and unchanged since this command began, nothing else in ${ctx.target.dir}, and its config.toml naming ${ctx.target.projectId} at the eight 564xx ports\n`);
}
/** After a CLI that may write, whatever its exit, the guards again: a change is a STOP state.json records (haltNeeds), or null. */
function stopAfter(ctx, op, label) {
  try { replayGuards(ctx, `after ${label}`); return null; } catch (error) {
    ctx.print(`# STOP: after ${label} on the replay: ${reason(error)}; the replay's input changed while the CLI ran, so where ${label} wrote is unknown (55321 included): nothing more runs on this replay until the coordinator reviews it (state.json records the STOP)\n`);
    return { code: 1, state: { ...ctx.state, stopRecorded: { at: ctx.now(), op } } };
  }
}
async function start(ctx) {
  replayGuards(ctx, 'immediately before start'); // no await between this and the child (runCommand spawns synchronously)
  const run = await supabase(ctx, 'start');
  ctx.print(`# ${appliedMigrations(`${run.stdout}\n${run.stderr}`).length} Applying migration line(s); the manifest holds ${manifestMigrations(ctx.manifest).length} migration(s). P3 in a snapshot is the proof.\n`);
  if (run.status !== 0) return { code: 1 };
  await replayRunning(ctx);
  ctx.print(`# the replay answers at ${REPLAY_API_URL} in ${ctx.target.container}\n`);
  return { code: 0, state: { ...ctx.state, candidate: ctx.state.candidate === 'absent' ? 'absent' : 'applied', active: null, proven: null } };
}
/**
 * `supabase migration list` for the replay must prove the manifest's migrations row by row (F5): every file the replay
 * holds listed local, and remote exactly when its database should have applied it (the candidate only once migrated). An
 * empty or unreadable list is refused, even when the CLI exits 0.
 */
async function migrations(ctx) {
  replayGuards(ctx, 'immediately before migration list'); // review 2026-10-26T2305Z finding 4: no await before the child
  const run = await supabase(ctx, 'migrations');
  if (run.status !== 0) return { code: 1 };
  const files = manifestMigrations(ctx.manifest);
  const applied = files.filter((file) => file !== CANDIDATE || ctx.state.candidate === 'applied');
  const version = (file) => file.slice(0, 14);
  const result = migrationListResult(`${run.stdout}\n${run.stderr}`, { local: files.map(version), applied: applied.map(version) });
  if (!result.ok) throw refuse(`the migration list does not prove the manifest's migrations: ${result.problems.join('; ')}`);
  ctx.print(`# migration list: ${result.rows.length} row(s), equal to the manifest's ${files.length} migration(s), ${applied.length} of them applied\n`);
  return { code: 0 };
}
/** Refuses unless the repository's candidate is the pinned one (review b75d1e73 finding 4); returns its bytes. */
function pinnedCandidate(ctx, rel, consequence) {
  const bytes = ctx.readRepo(rel);
  const hash = sha256(bytes);
  if (hash !== CANDIDATE_SHA256) throw refuse(`${rel} is not the reviewed candidate (sha256 ${hash}, reviewed ${CANDIDATE_SHA256})${ending(consequence)}`);
  return bytes;
}
function addCandidate(ctx) {
  const rel = `supabase/migrations/${CANDIDATE}`;
  const bytes = pinnedCandidate(ctx, rel, 'nothing was added');
  addOwnedFile(ctx.target, ctx.fs, ctx.manifest, rel, bytes);
  ctx.print(`${sha256(bytes)}  ${rel} (equals the repository file and the pinned candidate); added to ${MANIFEST}\n`);
  return { code: 0, state: { ...ctx.state, candidate: 'added' } };
}
async function migrate(ctx) {
  replayGuards(ctx, 'immediately before migration up');
  const run = await supabase(ctx, 'migrate');
  const stopped = stopAfter(ctx, 'migrate', 'migration up'); // before the exit is read: a failed or timed-out run may have written
  if (stopped) return stopped;
  const applied = appliedMigrations(`${run.stdout}\n${run.stderr}`);
  const unexpected = applied.length > 0 && applied.join(',') !== CANDIDATE;
  ctx.print(unexpected ? `# problem: migration up applied ${applied.join(', ')}, not only ${CANDIDATE}\n` : `# migration up: ${applied.length ? applied.join(', ') : 'no recognised Applying line'}; the after snapshot (P3) is the proof\n`);
  if (run.status !== 0 || unexpected) return { code: 1 };
  return { code: 0, state: { ...ctx.state, candidate: 'applied' } };
}
async function checked(ctx, name, judge) {
  replayGuards(ctx, `immediately before db ${name}`); // review 2026-10-26T2305Z finding 4: before the child, and after it
  const run = await supabase(ctx, name);
  const stopped = stopAfter(ctx, name, `db ${name}`);
  if (stopped) return stopped;
  const result = judge(`${run.stdout}\n${run.stderr}`);
  for (const problem of result.problems) ctx.print(`# problem: ${problem}\n`);
  const clean = run.status === 0 && result.clean;
  ctx.print(`# ${name} clean: ${clean ? 'yes' : 'NO'}\n`);
  return { code: clean ? 0 : 1, state: { ...ctx.state, checks: { ...ctx.state.checks, [name]: { generation: ctx.state.generation, clean } } } };
}
async function images(ctx) {
  const run = await ctx.exec('docker', ['ps', '--format', '{{.Names}} {{.Image}}'], { timeoutMs: SHORT });
  if (run.status !== 0) throw refuse('docker ps failed');
  const { problems, pairs } = imageProblems(run.stdout, ctx.target.projectId);
  ctx.print(assertNoSecrets([...pairs.map((pair) => `# same image on both stacks: ${pair}`), ...problems.map((problem) => `# problem: ${problem}`), ''].join('\n')));
  return { code: problems.length ? 1 : 0, state: { ...ctx.state, checks: { ...ctx.state.checks, images: { generation: ctx.state.generation, ok: problems.length === 0 } } } };
}
async function mutate(ctx, name) {
  const rel = MUTATIONS[name];
  const sql = pinned(ctx, rel);
  ctx.print(`# ${rel} sha256 ${sha256(sql)}, as ${MANIFEST} records; sent to ${ctx.target.container} only\n`);
  const run = await writePsql(ctx, sql);
  ctx.print(renderRun(`docker exec -i ${ctx.target.container} psql --single-transaction -f - < ${rel}`, 'psql', run));
  if (run.status !== 0) return { code: 1 };
  const next = name.startsWith('restore') ? { active: null } : { active: name, mutations: [...ctx.state.mutations, name] };
  return { code: 0, state: { ...ctx.state, ...next, proven: null, restoredProof: false } };
}
async function snapshot(ctx, label) {
  const result = await takeSnapshot(ctx, label, ctx.target.container);
  const extra = ['m1', 'm2', 'm3'].includes(label) ? { proven: label } : label === 'restored' ? { restoredProof: true } : {};
  return recordSnapshot(ctx, label, result, extra);
}
/**
 * One run of the identity suite. It gets the runner's own signals, status runner and CLI, and an exit that does nothing
 * (review a102fb68 finding 2): after Ctrl-C, main() cleans up and returns, and this runner prints the cleanup lines, records
 * the failed run in its state and evidence, and only then lets the process end.
 */
async function suite(ctx, expect, { stack = 'replay', target = { projectDir: ctx.target.dir, expectedApiUrl: REPLAY_API_URL } } = {}) {
  const chunks = [];
  const capture = { write: (text) => { chunks.push(String(text)); return true; } };
  const status = (command, args, options = {}) => ctx.exec(command, args, { ...options, timeoutMs: SHORT });
  const exitCode = await ctx.suite({ ...target, io: { stdout: capture, stderr: capture }, signals: ctx.signals, exit: () => {}, run: status, cli: [...SUPABASE_CLI] });
  const text = chunks.join('');
  const withheld = secretHits(text).length > 0;
  // Review bbe2fbba finding 2: an M2 run whose banned check passed is never a kill. It stops M2 on this replay, recorded with
  // the run, so a later run cannot be picked instead; the fallback is M2b, reviewed separately. Review 2026-10-26T2000Z
  // finding 1: whatever GoTrue answered, read from the run itself (a withheld output too), complete or not (2305Z finding 1).
  const stopped = expect === 'm2' && m2RunUnkilled(text);
  const verdict = withheld ? { ok: false, problems: ['the suite output held a secret-shaped value and is withheld', ...(stopped ? [M2_UNKILLED] : [])], ban: null } : judgeSuite(text, { expect, exitCode, ban: ctx.state.ban });
  ctx.print(withheld ? '' : text);
  for (const problem of verdict.problems) ctx.print(`# problem: ${problem}\n`);
  ctx.print(`# suite exit ${exitCode}; GoTrue's answer after the ban: ${verdict.ban ?? 'unrecognised'}\n# verdict: the ${expect} expectation is ${verdict.ok ? 'met' : 'NOT met'}\n`);
  const note = banNote(verdict.ban); // F6: what the ban class does not show is printed, never left silent
  if (note) ctx.print(`${note}\n`);
  if (stopped) ctx.print('# STOP: M2 is stopped on this replay: "a banned account reads no profile" passed with the ban clause removed, so no later suite m2 runs here and shared-apply stays blocked; the fallback is M2b, reviewed separately\n');
  const entry = { stack, expect, ok: verdict.ok, ban: verdict.ban, generation: ctx.state.generation, endedAt: ctx.now(), ...(stopped ? { m2Stopped: true } : {}) };
  return { code: verdict.ok ? 0 : 1, state: { ...ctx.state, suites: [...ctx.state.suites, entry], ban: ctx.state.ban ?? (verdict.ok ? verdict.ban : null) } };
}
async function stopReplay(ctx) {
  replayGuards(ctx, 'immediately before stop'); // review 2026-10-26T2305Z finding 4; teardown stops through here too
  const run = await supabase(ctx, 'stop');
  if (run.status !== 0) return false;
  const left = await replayContainers(ctx);
  if (left.length) throw refuse(`replay containers still run after stop: ${left.join(', ')}`);
  ctx.print(`# no ${ctx.target.projectId} container is left; --no-backup deletes its data volumes\n`);
  return true;
}
async function stop(ctx) {
  if (!(await stopReplay(ctx))) return { code: 1 };
  return { code: 0, state: { ...ctx.state, generation: ctx.state.generation + 1, active: null, proven: null, candidate: ctx.state.candidate === 'absent' ? 'absent' : 'added' } };
}
async function teardown(ctx) {
  if ((await replayContainers(ctx)).length) {
    await replayRunning(ctx);
    if (!(await stopReplay(ctx))) return { code: 1 };
  }
  const removed = removeOwnedDir(ctx.target, ctx.fs, ctx.manifest, { token: ctx.lock.token, onReleased: () => { ctx.lock = { ...ctx.lock, released: true }; } });
  ctx.print(`removed ${ctx.target.dir}: ${removed.files} file(s) and ${removed.dirs} director(ies), one at a time, after its sentinel and manifest checked\n`);
  return { code: 0 };
}
function keep(ctx, path, bytes) {
  if (lstatOrNull(ctx.fs, path)) {
    if (sha256(ctx.fs.readFileSync(path)) !== sha256(bytes)) throw refuse(`${path} already holds different content; evidence is never overwritten`);
    return;
  }
  ctx.fs.writeFileSync(path, bytes, { flag: 'wx' });
}
function retain(ctx) {
  const dir = join(ctx.evidenceDir, 'phase2-sql');
  if (!lstatOrNull(ctx.fs, dir)) ctx.fs.mkdirSync(dir);
  for (const rel of sqlFiles(ctx.manifest)) {
    const bytes = pinned(ctx, rel);
    keep(ctx, evidencePath(ctx, rel), bytes);
    ctx.print(`${sha256(bytes)}  phase2-sql/${basename(rel)}.txt\n`);
  }
  keep(ctx, join(ctx.evidenceDir, 'phase2-replay-manifest.json'), ctx.fs.readFileSync(join(ctx.target.dir, MANIFEST)));
  ctx.print(`# kept the SQL that ran and ${MANIFEST} as phase2-replay-manifest.json\n`);
  return { code: 0 };
}
function check(ctx) {
  ctx.print(`${ctx.target.dir} is the owned replay project ${ctx.target.projectId}: sentinel and manifest (${Object.keys(ctx.manifest.files).length} files, each sha256 equal), config ports 564xx, API ${REPLAY_API_URL}, ${ctx.target.container} running; shared stack unchanged ("${ctx.state.shared}")\n`);
  return { code: 0 };
}

export { addCandidate, check, checked, images, migrate, migrations, mutate, pinnedCandidate, prepare, retain, snapshot, start, stop, suite, teardown, verifyCli };
