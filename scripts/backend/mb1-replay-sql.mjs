// MB-1 replay runner, SQL and retained evidence: pinned SQL, the read-only snapshot, the kept SQL and the repository
// cross-check. Moved unchanged from mb1-replay.mjs in SF-0 (docs/plan/runs/MB-1/sf0.md).
// Internal: only mb1-replay.mjs and its sibling modules import this; all else goes through runReplay, so dispatch (the lock,
// the halt, the confirm tokens and the plan order) always runs first. mb1-replay-scope.test.mjs pins it (review 0605Z L1).
import { basename, join } from 'node:path';
import {
  assertNoSecrets, P1_COLUMNS, parsePreconditions, PRECONDITIONS_SHA256, READ_ONLY_PROOF, readOnlySqlProblems, renderRun, sha256, SNAPSHOT_RULES, snapshotVerdict,
} from './mb1-replay-evidence.mjs';
import { SHORT } from './mb1-replay-exec.mjs';
import { refuse } from './mb1-replay-live.mjs';
import { MANIFEST, manifestMigrations, Refusal } from './mb1-replay-target.mjs';

/* ---------------------------------------------------------------- SQL ------------------------------------------------ */

function pinned(ctx, rel) {
  const bytes = ctx.fs.readFileSync(join(ctx.target.dir, rel));
  if (sha256(bytes) !== ctx.manifest.files[rel]) throw refuse(`${rel} changed after the manifest check`);
  return bytes;
}
/** psql in `container` with the session default read-only (PGOPTIONS) and the proof query first, in the same session. */
const readOnlyPsql = (ctx, container, sql) => ctx.exec('docker', ['exec', '-i', '-e', 'PGOPTIONS=-c default_transaction_read_only=on', container, 'psql', '-U', 'postgres', '-d', 'postgres', '-X', '-v', 'ON_ERROR_STOP=1', '-A', '-F', '|', '-c', READ_ONLY_PROOF, '-f', '-'], { input: sql, timeoutMs: SHORT });
const writePsql = (ctx, sql) => ctx.exec('docker', ['exec', '-i', ctx.target.container, 'psql', '-U', 'postgres', '-d', 'postgres', '-X', '-v', 'ON_ERROR_STOP=1', '--single-transaction', '-f', '-'], { input: sql, timeoutMs: SHORT });

function renderSnapshot({ p1, p2, p3 }) {
  return assertNoSecrets(`${[`P1 ${P1_COLUMNS.map((column) => `${column}=${p1[column]}`).join(' ')}`,
    ...p2.map((row) => `P2 ${row.policyname} ${row.permissive} ${row.roles} ${row.cmd} qual=${row.qual} with_check=${row.with_check}`),
    ...p3.map((row) => `P3 ${row.version} ${row.name} ${row.statements_md5}`)].join('\n')}\n`);
}
/** The read-only snapshot. Only the reviewed preconditions block ever runs: pinned by the manifest and by the constant. */
async function takeSnapshot(ctx, label, container) {
  const rel = 'sql/preconditions.sql';
  const sql = pinned(ctx, rel);
  const hash = sha256(sql);
  if (hash !== PRECONDITIONS_SHA256) throw refuse(`${rel} is not the reviewed block (sha256 ${hash}, reviewed ${PRECONDITIONS_SHA256}); no snapshot was taken`);
  const problems = readOnlySqlProblems(sql.toString('utf8'));
  if (problems.length) throw refuse(`${rel} fails the read-only check: ${problems.join('; ')}`);
  ctx.print(`# ${rel} sha256 ${hash}, as ${MANIFEST} records and the reviewed constant; read-only check passed\n`);
  const run = await readOnlyPsql(ctx, container, sql);
  if (run.status !== 0) { ctx.print(renderRun(`psql (read-only, ${container})`, 'psql', run)); return { problems: ['psql failed'], changes: [] }; }
  let snapshot;
  try { snapshot = parsePreconditions(run.stdout); } catch (error) { return { problems: [error.message], changes: [] }; }
  ctx.print('# session: default_transaction_read_only=on, transaction_read_only=on\n');
  ctx.print(renderSnapshot(snapshot));
  const references = Object.fromEntries(Object.entries(ctx.state.snapshots).map(([name, entry]) => [name, entry.snapshot]));
  return { snapshot, ...snapshotVerdict(label, snapshot, { references, migrations: manifestMigrations(ctx.manifest) }) };
}
function recordSnapshot(ctx, label, result, extra = {}) {
  for (const problem of result.problems) ctx.print(`# problem: ${problem}\n`);
  if (result.problems.length) { ctx.print(`# snapshot ${label} FAILED\n`); return { code: 1 }; }
  const changes = result.changes.length ? `; changes from ${SNAPSHOT_RULES[label].reference}: ${result.changes.join(', ')}` : '';
  ctx.print(`# snapshot ${label}: ${result.snapshot.p3.length} applied migration(s); no rule broken${changes}\n`);
  const entry = { generation: ctx.state.generation, at: ctx.now(), snapshot: result.snapshot };
  return { code: 0, state: { ...ctx.state, ...extra, snapshots: { ...ctx.state.snapshots, [label]: entry } } };
}

/* ---------------------------------------------------------------- Retained evidence and the repository ---------------- */

const evidencePath = (ctx, rel) => join(ctx.evidenceDir, 'phase2-sql', `${basename(rel)}.txt`);
const sqlFiles = (manifest) => Object.keys(manifest.files).filter((rel) => rel.startsWith('sql/')).sort();
function lstatOrNull(fs, path) {
  try { return fs.lstatSync(path); } catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}
function retainedMissing(ctx) {
  const same = (path, bytes) => lstatOrNull(ctx.fs, path)?.isFile() && sha256(ctx.fs.readFileSync(path)) === sha256(bytes);
  const missing = sqlFiles(ctx.manifest).filter((rel) => !same(evidencePath(ctx, rel), ctx.fs.readFileSync(join(ctx.target.dir, rel)))).map((rel) => `phase2-sql/${basename(rel)}.txt`);
  return same(join(ctx.evidenceDir, 'phase2-replay-manifest.json'), ctx.fs.readFileSync(join(ctx.target.dir, MANIFEST))) ? missing : [...missing, 'phase2-replay-manifest.json'];
}
/** Foreign entries are already refused by checkOwnedDir before every command; removeOwnedDir checks again as it removes. */
function teardownNeeds(state, arg, now, ctx) {
  const missing = retainedMissing(ctx);
  return missing.length ? `teardown needs the SQL that ran kept as evidence first: run retain (missing or different: ${missing.join(', ')})` : null;
}
/**
 * The apply is this repository's candidate, so the repository's migration files must be byte for byte the ones the replay ran.
 * (Since review bbe2fbba finding 1 migration up reads the staged copy, not these files; this stays as a cross-check.)
 */
function repositoryMatchesReplay(ctx, consequence = 'apply nothing') {
  const replayed = manifestMigrations(ctx.manifest);
  const local = ctx.listMigrations().filter((name) => name.endsWith('.sql')).sort();
  const differ = [...new Set([...local, ...replayed])].filter((name) => !replayed.includes(name) || !local.includes(name) || sha256(ctx.readRepo(`supabase/migrations/${name}`)) !== ctx.manifest.files[`supabase/migrations/${name}`]);
  if (differ.length) throw refuse(`the repository's migrations differ from the ${replayed.length} the replay ran (${differ.join(', ')})${ending(consequence)}`);
}

/** `; consequence`, or nothing: a guard rerun after migration up names no consequence, because its STOP line says it. */
const ending = (consequence) => (consequence ? `; ${consequence}` : '');
/** Why a guard rerun after a CLI (migrate, diff, lint, shared-apply) failed, for its STOP line: a refusal's own text, never more. */
const reason = (error) => (error instanceof Refusal ? error.message : `an unexpected error (${error?.code ?? 'no code'})`);

export { ending, evidencePath, lstatOrNull, pinned, reason, recordSnapshot, repositoryMatchesReplay, sqlFiles, takeSnapshot, teardownNeeds, writePsql };
