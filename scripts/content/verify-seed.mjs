import { readFileSync } from 'node:fs';
import { invokedDirectly, localDatabase, psqlFailure } from '../backend/local-stack.mjs';
import { loadCatalogue } from './catalogue.mjs';
import { uuidv5 } from './ids.mjs';
import { seedRows, seedSqlFromRows, sqlLiteral } from './seed.mjs';
import { buildStarterTemplates } from './templates.mjs';

// CT-1 box 3 database proof, for the coordinator's serialized database phase. Four psql runs against the one local
// stack that scripts/backend/local-stack.mjs accepts (or an injected loopback replay project); each is a single
// transaction that always ends in rollback, so the database is left as it was:
//   twice         synthetic member rows, the seed, the seed again; every catalogue key once, nothing else touched,
//                 and each starter template accepted as a member programme by the days contract and snapshot trigger
//   conflict      a member-owned row planted on a probe catalogue key; the seed must stop with its member-owned error
//   crossVersion  a member-owned row planted on the probe id at version 2 while the seed carries version 1; the seed
//                 must stop with its member-owned error naming the probe id at version 2 (review M1)
//   drift         the probe row changed between two runs; the second run must stop with its drift error
// The probe key is derived from its own name, so it never collides with a real catalogue key. SQL travels on stdin
// through an argument array; nothing is passed through a shell, and no key is printed.

export const SYNTHETIC_MEMBER = 'c7100000-0000-4000-8000-0000000000a1';
export const PROBE_ID = uuidv5('fitlog:seed-check:probe');
const USAGE = 'usage: node scripts/content/verify-seed.mjs';
const PASS_NOTICE = /NOTICE:\s+(CT-1 seed check: [^\n]*)/;
const MEMBER_HELD = /CT-1 seed: catalogue key \S+ version 1 is held by a member-owned row/;
const MEMBER_HELD_OTHER_VERSION = `CT-1 seed: catalogue key ${PROBE_ID} version 2 is held by a member-owned row`;
const DRIFTED = /CT-1 seed: catalogue row \S+ version 1 differs from this seed/;
const sqlFile = (name) => readFileSync(new URL(`./sql/${name}`, import.meta.url), 'utf8');

export const probeRow = () => ({
  id: PROBE_ID, version: 1, name: 'CT-1 seed check probe', loggingType: 'resistance', loadBasis: 'total', multiplier: 1,
  equipment: 'Barbell', primaryMuscles: ['Quadriceps'], secondaryMuscles: [],
  instructions: 'Probe row for the CT-1 seed check. It is always rolled back.', aliases: [], source: 'fitlog-seed-check',
});

const PLANT_MEMBER_ROW = 'insert into public.exercises (id, version, owner_id, name, logging_type, load_basis, multiplier, equipment, primary_muscles, instructions, source) '
  + `values (${sqlLiteral(PROBE_ID)}, 1, ${sqlLiteral(SYNTHETIC_MEMBER)}, 'Claimed catalogue key', 'resistance', 'total', 1, 'Barbell', array['Quadriceps'], 'Planted by the CT-1 seed check.', 'member');`;
const PLANT_MEMBER_ROW_OTHER_VERSION = 'insert into public.exercises (id, version, owner_id, name, logging_type, load_basis, multiplier, equipment, primary_muscles, instructions, source) '
  + `values (${sqlLiteral(PROBE_ID)}, 2, ${sqlLiteral(SYNTHETIC_MEMBER)}, 'Claimed later catalogue version', 'resistance', 'total', 1, 'Barbell', array['Quadriceps'], 'Planted by the CT-1 seed check.', 'member');`;
const DRIFT_PROBE_ROW = `update public.exercises set instructions = instructions || ' Changed by the CT-1 seed check.' where id = ${sqlLiteral(PROBE_ID)} and version = 1 and owner_id is null;`;

/** The four psql inputs. Each opens one transaction and ends with rollback. */
export function checkScripts(catalogue) {
  const rows = seedRows(catalogue);
  if (rows.some((row) => row.id === PROBE_ID)) throw new Error('The probe key collides with a catalogue key');
  const options = { contentVersion: catalogue.contentVersion };
  const seed = seedSqlFromRows(rows, options).sql;
  const probeSeed = seedSqlFromRows([probeRow(), ...rows], options).sql;
  const open = ['\\set ON_ERROR_STOP on', 'begin;'];
  const close = ['rollback;', ''];
  const parameters = [
    `select set_config('ct1.seed_ids', ${sqlLiteral(JSON.stringify(rows.map((row) => row.id)))}, true) is not null as seed_ids_loaded;`,
    `select set_config('ct1.templates', ${sqlLiteral(JSON.stringify(buildStarterTemplates(catalogue)))}, true) is not null as templates_loaded;`,
  ];
  return {
    rows,
    twice: [...open, ...parameters, sqlFile('seed-check-setup.sql'), seed, sqlFile('seed-check-after-first.sql'), seed, sqlFile('seed-check-assert.sql'), ...close].join('\n'),
    conflict: [...open, sqlFile('seed-check-setup.sql'), PLANT_MEMBER_ROW, probeSeed, ...close].join('\n'),
    crossVersion: [...open, sqlFile('seed-check-setup.sql'), PLANT_MEMBER_ROW_OTHER_VERSION, probeSeed, ...close].join('\n'),
    drift: [...open, probeSeed, DRIFT_PROBE_ROW, probeSeed, ...close].join('\n'),
  };
}

/** Throws when the content is invalid or the target is refused (before any psql run); otherwise returns problems or the result line. */
export function verifySeed({ root, projectDir, expectedApiUrl, run } = {}) {
  const scripts = checkScripts(loadCatalogue(root));
  const db = localDatabase({ projectDir, expectedApiUrl, run });
  const psql = (input) => db.psql(['-q', '-f', '-'], input);
  const problems = [];
  const twice = psql(scripts.twice);
  const notice = PASS_NOTICE.exec(twice.stderr ?? '')?.[1];
  if (twice.status !== 0) problems.push(`the seed-twice check failed: ${psqlFailure(twice)}`);
  else if (notice === undefined) problems.push('the seed-twice check did not report its result');
  const conflict = psql(scripts.conflict);
  if (conflict.status === 0) problems.push('the seed did not stop when a member-owned row held a catalogue key');
  else if (!MEMBER_HELD.test(conflict.stderr ?? '')) problems.push(`the member-owned key run failed for another reason: ${psqlFailure(conflict)}`);
  const crossVersion = psql(scripts.crossVersion);
  if (crossVersion.status === 0) problems.push('the seed did not stop when a member-owned row held another version of a catalogue id');
  else if (!(crossVersion.stderr ?? '').includes(MEMBER_HELD_OTHER_VERSION)) problems.push(`the member-owned other-version run failed for another reason: ${psqlFailure(crossVersion)}`);
  const drift = psql(scripts.drift);
  if (drift.status === 0) problems.push('the seed did not stop when an existing catalogue row differed from it');
  else if (!DRIFTED.test(drift.stderr ?? '')) problems.push(`the drift run failed for another reason: ${psqlFailure(drift)}`);
  return {
    problems,
    line: `CT-1 seed check passed: ${notice}; a member-owned catalogue key stopped the seed; a member-owned row on another version of a catalogue id stopped the seed; a drifted catalogue row stopped the seed [${db.container} at ${db.apiUrl}]`,
  };
}

export function main(argv = process.argv.slice(2), { io = process, ...options } = {}) {
  if (argv.length > 0) {
    io.stderr.write(`${USAGE}\n`);
    return 1;
  }
  let result;
  try { result = verifySeed(options); } catch (error) { result = { problems: [error instanceof Error ? error.message : String(error)] }; }
  if (result.problems.length > 0) {
    io.stderr.write(`verify-seed failed:\n- ${result.problems.join('\n- ')}\n`);
    return 1;
  }
  io.stdout.write(`${result.line}\n`);
  return 0;
}
if (invokedDirectly(import.meta.url)) process.exitCode = main();
