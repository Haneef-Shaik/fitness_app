import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { display, invokedDirectly, localDatabase, psqlFailure, REPO_ROOT } from './local-stack.mjs';

// Box 2, database half (AR-1 test-plan §1 step 4): private.contracts must hold exactly the eight persisted schemas of
// the latest contract snapshot, value for value. The snapshot is checked against packages/domain/contracts/manifest.json
// and never written. If the database differs, the fix is a new migration, not an edit to the snapshot.

export const PERSISTED = ['days', 'exercise', 'food', 'goal', 'instances', 'measurements', 'nutrients', 'set'];
export const CONTRACTS_QUERY = "select coalesce(json_object_agg(name, schema order by name), '{}') from private.contracts";
const CONTRACTS_DIR = join(REPO_ROOT, 'packages/domain/contracts');
const MANIFEST = 'packages/domain/contracts/manifest.json';
const USAGE = 'usage: node scripts/backend/verify-contracts.mjs [snapshot.json]';
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const shown = (value) => {
  const text = JSON.stringify(value) ?? String(value);
  return text.length > 120 ? `${text.slice(0, 117)}...` : text;
};

function readJson(path, label) {
  const bytes = readFileSync(path);
  try { return { bytes, json: JSON.parse(bytes.toString('utf8')) }; } catch (error) { throw new Error(`${label} is not JSON (${error.message})`); }
}

/** The snapshot to compare (the manifest's last entry unless a path is given) and whether the manifest vouches for its bytes. */
function snapshotOf(snapshotPath) {
  const entries = readJson(join(CONTRACTS_DIR, 'manifest.json'), MANIFEST).json?.snapshots;
  if (!Array.isArray(entries) || !entries.length || !entries.every((entry) => typeof entry?.version === 'string' && /^[0-9a-f]{64}$/.test(entry.sha256 ?? ''))) {
    throw new Error(`${MANIFEST} does not list snapshots as { version, sha256 }`);
  }
  const latest = entries.at(-1);
  const path = snapshotPath ?? join(CONTRACTS_DIR, `${latest.version}.json`);
  const label = display(path);
  const { bytes, json } = readJson(path, label);
  if (!isObject(json?.persisted)) throw new Error(`${label} has no persisted section`);
  const hash = sha256(bytes);
  const problems = json.version !== latest.version ? [`${label} is contract ${json.version}, but ${MANIFEST} ends at ${latest.version}`]
    : hash !== latest.sha256 ? [`${label} has sha256 ${hash}, but ${MANIFEST} records ${latest.sha256} for ${latest.version}`] : [];
  return { label, version: json.version, sha256: hash, persisted: json.persisted, problems };
}

/** The JSON pointer of the first place two JSON values differ, or null. Key order is not a difference; array order is. */
export function firstDifference(database, snapshot, pointer = '') {
  if (Array.isArray(database) && Array.isArray(snapshot)) {
    if (database.length !== snapshot.length) return { pointer, database: `array of ${database.length}`, snapshot: `array of ${snapshot.length}` };
    for (const [i, item] of database.entries()) {
      const found = firstDifference(item, snapshot[i], `${pointer}/${i}`);
      if (found) return found;
    }
    return null;
  }
  if (isObject(database) && isObject(snapshot)) {
    for (const key of [...new Set([...Object.keys(snapshot), ...Object.keys(database)])].sort()) {
      const at = `${pointer}/${key.replaceAll('~', '~0').replaceAll('/', '~1')}`;
      if (!Object.hasOwn(database, key) || !Object.hasOwn(snapshot, key)) {
        return { pointer: at, database: Object.hasOwn(database, key) ? shown(database[key]) : '(absent)', snapshot: Object.hasOwn(snapshot, key) ? shown(snapshot[key]) : '(absent)' };
      }
      const found = firstDifference(database[key], snapshot[key], at);
      if (found) return found;
    }
    return null;
  }
  return database === snapshot ? null : { pointer, database: shown(database), snapshot: shown(snapshot) };
}

/** Exactly the eight persisted names on both sides, and each database value equal to the snapshot's. */
export function contractProblems(database, persisted) {
  return [...new Set([...PERSISTED, ...Object.keys(database), ...Object.keys(persisted)])].sort().flatMap((name) => {
    const [expected, inDatabase, inSnapshot] = [PERSISTED.includes(name), Object.hasOwn(database, name), Object.hasOwn(persisted, name)];
    const difference = inDatabase && inSnapshot ? firstDifference(database[name], persisted[name]) : null;
    return [
      ...(expected && !inSnapshot ? [`the snapshot's persisted section has no ${name}`] : []),
      ...(!expected && inSnapshot ? [`the snapshot's persisted section has an unexpected ${name}`] : []),
      ...(expected && !inDatabase ? [`private.contracts has no row ${name}`] : []),
      ...(!expected && inDatabase ? [`private.contracts has an unexpected row ${name}`] : []),
      ...(difference ? [`persisted.${name} differs at ${difference.pointer || '(root)'}: database ${difference.database}, snapshot ${difference.snapshot}`] : []),
    ];
  });
}

/** Throws when the target is refused or a file cannot be read; otherwise returns every problem found, or the result line. */
export function verifyContracts({ snapshotPath, projectDir, expectedApiUrl, run } = {}) {
  const db = localDatabase({ projectDir, expectedApiUrl, run });
  const snapshot = snapshotOf(snapshotPath);
  const result = db.psql(['-At', '-c', CONTRACTS_QUERY]);
  if (result.status !== 0) return { problems: [...snapshot.problems, psqlFailure(result)] };
  let database;
  try { database = JSON.parse(result.stdout); } catch { database = undefined; }
  if (!isObject(database)) return { problems: [...snapshot.problems, `private.contracts did not come back as one JSON object (${shown(result.stdout.trim())})`] };
  return {
    problems: [...snapshot.problems, ...contractProblems(database, snapshot.persisted)],
    line: `private.contracts matches the persisted section of contract ${snapshot.version} (${snapshot.label}, sha256 ${snapshot.sha256}, as manifest.json records): `
      + `${PERSISTED.length} schemas (${PERSISTED.join(', ')}) in ${db.container} at ${db.apiUrl}`,
  };
}

export function main(argv = process.argv.slice(2), { io = process, ...options } = {}) {
  if (argv.length > 1) {
    io.stderr.write(`${USAGE}\n`);
    return 1;
  }
  let result;
  try { result = verifyContracts({ ...options, snapshotPath: argv[0] }); } catch (error) { result = { problems: [error instanceof Error ? error.message : String(error)] }; }
  if (result.problems.length) {
    io.stderr.write(`verify-contracts failed:\n- ${result.problems.join('\n- ')}\n`);
    return 1;
  }
  io.stdout.write(`${result.line}\n`);
  return 0;
}
if (invokedDirectly(import.meta.url)) process.exitCode = main();
