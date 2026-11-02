// MB-1 replay runner, the 55321 commands: shared-snapshot, shared-apply (the staged input, its guards, the route proof and
// Docker's binding (SF-7), the recorded attempt and the checks after migration up) and shared-suite. Moved from mb1-replay.mjs
// in SF-0 (docs/plan/runs/MB-1/sf0.md); SF-7 added stagedRoute, bindingUnchanged and their calls (sf7.md); SF-7b, L4's text;
// SF-7d, provenUnchanged: the proven database ID's start time before migration up and twice after it (sf7d.md).
// Internal: only mb1-replay.mjs and its sibling modules import this; all else goes through runReplay, so dispatch (the lock,
// the halt, the confirm tokens and the plan order) always runs first. mb1-replay-scope.test.mjs pins it (review 0605Z L1).
import { join } from 'node:path';
import { LOCAL_API_URL } from './local-stack.mjs';
import { routeProof } from './mb1-replay-binding.mjs';
import { pinnedCandidate, suite } from './mb1-replay-commands.mjs';
import { appliedMigrations, CANDIDATE, CANDIDATE_SHA256, redact, renderRun, sha256 } from './mb1-replay-evidence.mjs';
import { LONG } from './mb1-replay-exec.mjs';
import {
  cliCall, loopbackDb, loopbackUrl, provenStarted, refuse, refuseEnvFiles, refuseSupabaseVariables, sharedBinding, sharedConfigBound, sharedRunning, stagingWorkdir, statusOf,
  supabase, supabaseArgs,
} from './mb1-replay-live.mjs';
import { SHARED_INCIDENT } from './mb1-replay-order.mjs';
import { ending, reason, recordSnapshot, repositoryMatchesReplay, takeSnapshot } from './mb1-replay-sql.mjs';
import { BASE_MIGRATIONS, MANIFEST, manifestMigrations, SHARED, sharedInputFiles, stagedInputProblems, stageSharedInput, STAGING, STATE } from './mb1-replay-target.mjs';

async function sharedSnapshot(ctx, label) {
  const { container } = await sharedRunning(ctx);
  const full = `55321-${label}`;
  const result = recordSnapshot(ctx, full, await takeSnapshot(ctx, full, container));
  if (result.code !== 0) ctx.print('# 55321 does not match the replay project: STOP and apply nothing\n');
  return result;
}
/**
 * Every guard on what shared-apply's migration up reads, synchronous, with no child process and no await (review 19eea0f3
 * finding 2, review bbe2fbba finding 1): no SUPABASE_* variable; no .env file the CLI may load (the staged workdir included);
 * the repository's config bound to 55322 and to the replay's; the repository's candidate pinned and its migrations the
 * replay's (cross-checks: the apply is this repository's candidate); and the staged copy, the actual input, exactly as staged.
 */
function inputGuards(ctx, consequence) {
  refuseSupabaseVariables(ctx);
  refuseEnvFiles(ctx);
  sharedConfigBound(ctx);
  pinnedCandidate(ctx, `supabase/migrations/${CANDIDATE}`, consequence);
  repositoryMatchesReplay(ctx, consequence);
  const staged = stagedInputProblems(ctx.target, ctx.fs, ctx.manifest);
  if (staged.length) throw refuse(`${staged.join('; ')}${ending(consequence)}`);
}
/**
 * The guards immediately before migration up (any change refuses: apply nothing; no await separates them from the start of
 * the child), or after it (when: 'after'; the caller turns a refusal into a STOP), with the lines that say so.
 */
function guardsBeforeMigrate(ctx, when = 'before') {
  inputGuards(ctx, when === 'before' ? 'apply nothing' : '');
  const at = when === 'before' ? 'immediately before' : 'after';
  const staged = Object.keys(ctx.manifest.files).filter((rel) => rel.startsWith(`${STAGING}/`)).length;
  ctx.print(`# rechecked ${at} migration up: no SUPABASE_* variable, no .env file, no config.json, [db] port ${SHARED.dbPort} and the replay's config, the pinned candidate, and the ${manifestMigrations(ctx.manifest).length} migration(s) the replay ran\n`);
  ctx.print(`# rechecked ${at} migration up, the staged input it reads: exactly the ${staged} file(s) pinned under ${STAGING}/, each sha256 equal, the staged config bound to ${SHARED.dbPort} and the staged candidate pinned\n`);
}
/**
 * Review bbe2fbba finding 1 (a): writes, or verifies unchanged, the runner-owned copy migration up runs from. The repository's
 * config.toml is read once, bound, and those same bytes are staged; the seeds and migrations are the replay's pinned copies.
 */
function stageInput(ctx) {
  let config;
  try { config = ctx.readRepo('supabase/config.toml'); } catch (error) { throw refuse(`the repository's supabase/config.toml could not be read (${error.code ?? 'unknown error'})`); }
  const files = sharedInputFiles(ctx.target, ctx.fs, ctx.manifest, config);
  const { manifest, written } = stageSharedInput(ctx.target, ctx.fs, ctx.manifest, files);
  ctx.manifest = manifest;
  for (const [rel, bytes] of files) ctx.print(`${sha256(bytes)}  ${STAGING}/${rel} (${rel === 'supabase/config.toml' ? `the repository's config.toml, bound to ${SHARED.dbPort} and to the replay's config` : "the replay's pinned copy"})\n`);
  ctx.print(`# shared-apply input ${written ? 'staged' : 'already staged, verified unchanged'}: migration up runs from ${stagingWorkdir(ctx)}, never the repository; ${files.size} file(s) pinned in ${MANIFEST}\n`);
}
/** The environment proof on the actual input: the CLI, given the staged workdir, resolves it to 55321 and 127.0.0.1:55322. */
async function stagedRunning(ctx) {
  const status = await statusOf(ctx, stagingWorkdir(ctx), 'the staged shared-apply input');
  if (status?.API_URL !== LOCAL_API_URL) throw refuse(`the staged shared-apply input answers at ${loopbackUrl(status?.API_URL)}, not ${LOCAL_API_URL}; apply nothing`);
  if (!loopbackDb(status.DB_URL, SHARED.dbPort)) throw refuse(`the staged shared-apply input's database is not at 127.0.0.1:${SHARED.dbPort}; its DB_URL is not printed, because it holds credentials; apply nothing`);
  ctx.print(`# the staged input resolves to ${LOCAL_API_URL} with its database at 127.0.0.1:${SHARED.dbPort}\n`);
}
/**
 * SF-7, the route proof: `migration list --local` for the staged workdir reads the database migration up will write. It must
 * show the replay's 16 migrations local, exactly the 15 base remote and the candidate local only (routeProof), or nothing
 * applies and no attempt is recorded.
 */
async function stagedRoute(ctx) {
  const run = await supabase(ctx, 'migrations', stagingWorkdir(ctx));
  if (run.status !== 0) throw refuse(`migration list for the staged shared-apply input ${run.status === null ? `did not finish (${run.error})` : `failed (exit ${run.status})`}; the route to 55321 is not proved; apply nothing`);
  const migrations = manifestMigrations(ctx.manifest);
  const proof = routeProof(`${run.stdout}\n${run.stderr}`, migrations);
  if (!proof.ok) throw refuse(`the route proof failed (migration list for the staged input must show the ${BASE_MIGRATIONS} base migrations remote and ${CANDIDATE} local only): ${proof.problems.join('; ')}; apply nothing`);
  ctx.print(`# route proof: migration list for the staged input shows ${migrations.length} migration(s) local, the ${BASE_MIGRATIONS} base remote and ${CANDIDATE} local only\n`);
}
/**
 * SF-7: Docker's binding of the shared stack read again, which must equal the one sharedRunning proved (`first`): before
 * migration up a difference refuses (apply nothing); after it (when: 'after', no consequence) the caller makes it a STOP.
 */
async function bindingUnchanged(ctx, first, when = 'before') {
  const consequence = when === 'before' ? 'apply nothing' : '';
  const { value: now } = await sharedBinding(ctx, consequence);
  if (now !== first) throw refuse(`Docker's binding of the shared stack changed ${when === 'before' ? 'before migration up' : 'while migration up ran'} (a container id, the project label or a published port)${ending(consequence)}`);
  ctx.print(`# rechecked ${when} migration up: Docker's binding of the shared stack is unchanged\n`);
}
/**
 * SF-7d (review 2026-10-27T1105Z L1, L2): the database container the binding proved, inspected again by its ID, must still
 * have the start time pinned at prepare. The binding read compares IDs, the label and the ports, never the start time, so a
 * restart or a stop that keeps the ID passes it. `when` names the point in the lines printed; a change refuses with
 * `consequence` (none after migration up, where the caller makes the refusal a STOP).
 */
async function provenUnchanged(ctx, container, when, consequence) {
  await provenStarted(ctx, container, consequence);
  ctx.print(`# rechecked ${when}: the database container the binding proved, inspected by its ID, still has the start time pinned at prepare\n`);
}
/**
 * Review bbe2fbba finding 1 (c): the attempt is written to state.json before migration up starts, so no outcome (a timeout,
 * a crash, a STOP, a runner killed outright) allows another apply without the coordinator's review.
 */
function recordApplyAttempt(ctx) {
  ctx.state = { ...ctx.state, sharedApplyAttempted: { at: ctx.now(), workdir: STAGING } };
  ctx.fs.writeFileSync(join(ctx.target.dir, STATE), `${JSON.stringify(ctx.state, null, 2)}\n`);
  ctx.print(`# apply attempt recorded in ${STATE} before migration up starts: shared-apply never runs again on this replay\n`);
}
/** After migration up: why the candidate is no longer the pinned bytes the guards saw, or null (finding 2's re-hash). */
function candidateChangedAfter(ctx) {
  const rel = `supabase/migrations/${CANDIDATE}`;
  let hash;
  try { hash = sha256(ctx.readRepo(rel)); } catch (error) { return `${rel} could not be read after migration up (${error.code ?? 'unknown error'})`; }
  if (hash !== CANDIDATE_SHA256) return `${rel} changed while migration up ran (sha256 ${hash}, pinned ${CANDIDATE_SHA256})`;
  ctx.print(`# after migration up: ${rel} still has the pinned sha256 ${CANDIDATE_SHA256}\n`);
  return null;
}
/**
 * The only write to 55321: one `migration up` with this repository's candidate. The repository's candidate must be the pinned
 * bytes (review b75d1e73 finding 4), and a fresh read-only snapshot must still equal the replay's before snapshot (review
 * a102fb68 finding 4). Review bbe2fbba finding 1: migration up runs from the staged copy, never the repository; the guards run
 * before the staged status call and again immediately before the apply; the attempt is on disk before the CLI starts. SF-7:
 * Docker's binding is proved in sharedRunning, the route proof runs on the staged input, and the binding is read again. SF-7d
 * (review 2026-10-27T1105Z L1): then the proven ID's start time is inspected again, as the last child; then the final guards,
 * the attempt record and migration up's spawn follow with no await between them. A restart or a stop during the staged status,
 * the route proof or the second binding read refuses there: no attempt is recorded and nothing applies.
 */
async function sharedApply(ctx) {
  pinnedCandidate(ctx, `supabase/migrations/${CANDIDATE}`, 'apply nothing');
  repositoryMatchesReplay(ctx);
  const { container, binding } = await sharedRunning(ctx);
  const fresh = await takeSnapshot(ctx, '55321-before', container);
  for (const problem of fresh.problems) ctx.print(`# problem: ${problem}\n`);
  if (fresh.problems.length) { ctx.print('# 55321 changed since its before snapshot, or does not match the replay: STOP and apply nothing\n'); return { code: 1 }; }
  ctx.print("# fresh 55321 snapshot right before the apply: equal to the replay's before snapshot\n");
  stageInput(ctx);
  inputGuards(ctx, 'apply nothing'); // nothing changed while the snapshot ran, before the next child process
  await stagedRunning(ctx);
  inputGuards(ctx, 'apply nothing'); // SF-7: the route proof's list reads the staged input too
  await stagedRoute(ctx);
  await bindingUnchanged(ctx, binding); // SF-7: the binding read again, equal to the first
  await provenUnchanged(ctx, container, 'before migration up', 'apply nothing'); // SF-7d L1: the last child; then no await until migration up starts
  guardsBeforeMigrate(ctx);
  recordApplyAttempt(ctx);
  const args = supabaseArgs(ctx, 'migrate', stagingWorkdir(ctx));
  const run = await cliCall(ctx, args, LONG);
  ctx.print(renderRun(`node_modules/.bin/supabase ${args.join(' ')}`, 'migrate', run));
  return afterSharedMigrate(ctx, run, container, binding);
}
/**
 * After migration up, whatever its exit (review bbe2fbba finding 1 (b)): the candidate hashed again (review 19eea0f3 finding
 * 2), every guard rerun, the CLI's result, then a read-only 55321 snapshot that must equal the replay's after snapshot, P3's
 * statements_md5 included. Only then exit 0, with the verified state (sharedApplied) returned for dispatch to write once the
 * entry's start-time check by name holds (SF-7e). Anything else is a STOP, never a refusal: migration up may have
 * written, the attempt is already recorded, and the coordinator reviews 55321. A STOP returns the state as it is (the attempt,
 * sharedApplied false), never the snapshot's.
 * SF-7d (review 2026-10-27T1105Z L2): after the binding, the proven ID's start time is checked before the after snapshot (a
 * restart or a stop during migration up, which no check before it can catch), and once more after it, before the verified
 * state is returned: recordSnapshot only builds that state, and dispatch writes what this returns. So a restart during the
 * snapshot is a STOP with no sharedApplied either. SF-7e (review 2026-10-27T1132Z L1): dispatch runs the entry's start-time
 * check by name before it writes the verified state, so a restart after this last inspect is a STOP with only the attempt on
 * disk, too (sf7e.md).
 */
async function afterSharedMigrate(ctx, run, container, binding) {
  const stop = (why) => {
    ctx.print(`# STOP: ${why}; what 55321 applied is unknown, so shared-apply never runs again: ${SHARED_INCIDENT}\n`); // SF-7b L4
    return { code: 1, state: ctx.state };
  };
  const changed = candidateChangedAfter(ctx);
  if (changed) return stop(changed);
  try { guardsBeforeMigrate(ctx, 'after'); } catch (error) { return stop(`after migration up: ${reason(error)}`); }
  // SF-7: whatever the exit, Docker's binding must still be the one proved before; a change, or no answer, is a STOP.
  try { await bindingUnchanged(ctx, binding, 'after'); } catch (error) { return stop(`after migration up: ${reason(error)}`); }
  // SF-7d L2: whatever the exit, the proven ID's start time too, before anything is read from it.
  try { await provenUnchanged(ctx, container, 'after migration up', ''); } catch (error) { return stop(`after migration up: ${reason(error)}`); }
  if (run.status !== 0) return stop(`migration up ${run.status === null ? `did not finish (${redact(String(run.error ?? 'no exit status'))})` : `exited ${run.status}`}`);
  const applied = appliedMigrations(`${run.stdout}\n${run.stderr}`);
  if (applied.length && applied.join(',') !== CANDIDATE) return stop(`55321 applied ${applied.join(', ')}, not only ${CANDIDATE}`);
  let after;
  try { after = await takeSnapshot(ctx, '55321-after', container); } catch (error) { return stop(`the read-only 55321 snapshot after migration up failed (${reason(error)})`); }
  const recorded = recordSnapshot(ctx, '55321-after', after, { sharedApplied: true }); // built, not yet written
  if (recorded.code !== 0) return stop("55321 does not equal the replay's after snapshot after migration up");
  // SF-7d L2: the snapshot came from the pinned container only if its start time held while it ran.
  try { await provenUnchanged(ctx, container, 'after the 55321-after snapshot', ''); } catch (error) { return stop(`after the 55321-after snapshot: ${reason(error)}`); }
  ctx.print("# 55321 after migration up: equal to the replay's after snapshot (P1, P2 and P3 with each statements_md5)\n");
  return recorded;
}
async function sharedSuite(ctx) {
  await sharedRunning(ctx);
  return suite(ctx, 'green', { stack: 'shared', target: {} });
}

export { sharedApply, sharedSnapshot, sharedSuite };
