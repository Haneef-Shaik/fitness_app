import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { display, invokedDirectly, localDatabase, psqlFailure, REPO_ROOT } from './local-stack.mjs';

// Box 4, SQL side (AR-1 test-plan §4, Runner): runs the rollback-only training.v1 check against the shared AC03 fixture.
// The fixture's exact bytes travel as one psql variable and the SQL file goes on stdin, through an argument array with
// no shell. The check's own sha256 notice must equal the file's, so a fixture altered on the way cannot pass.

export const DEFAULT_FIXTURE = join(REPO_ROOT, 'packages/domain/fixtures/ac03-training.v1.json');
export const DEFAULT_SQL = join(REPO_ROOT, 'scripts/backend/sql/training-fixtures.sql');
const USAGE = 'usage: node scripts/backend/verify-fixtures.mjs [training-fixtures.sql]';
const HASH_NOTICE = /NOTICE:\s+training\.v1 fixture text sha256 ([0-9a-f]{64})/;
const PASS_NOTICE = /NOTICE:\s+(training\.v1: \d+ set vectors and \d+ session vectors passed in SQL[^\n]*)/;
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

/** The file text psql receives. It must decode as UTF-8 (a BOM kept), hold no NUL, which argv cannot carry, and parse as JSON. */
function fixtureText(bytes, label) {
  let text;
  try { text = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes); } catch { throw new Error(`${label} is not valid UTF-8, so it cannot reach psql unchanged`); }
  if (text.includes('\0')) throw new Error(`${label} contains a NUL byte, which no command-line argument can carry`);
  try { JSON.parse(text); } catch (error) { throw new Error(`${label} is not JSON (${error.message})`); }
  return text;
}

/** Throws when the target is refused or a file cannot be read or sent; otherwise returns every problem found, or the result line. */
export function verifyFixtures({ sqlPath = DEFAULT_SQL, fixturePath = DEFAULT_FIXTURE, projectDir, expectedApiUrl, run } = {}) {
  const db = localDatabase({ projectDir, expectedApiUrl, run });
  const [fixture, sql] = [display(fixturePath), display(sqlPath)];
  const bytes = readFileSync(fixturePath);
  const text = fixtureText(bytes, fixture);
  const result = db.psql(['-q', '-v', `fixture=${text}`, '-f', '-'], readFileSync(sqlPath));
  if (result.status !== 0) return { problems: [psqlFailure(result)] };
  const hash = sha256(bytes);
  const received = HASH_NOTICE.exec(result.stderr)?.[1];
  const passed = PASS_NOTICE.exec(result.stderr)?.[1];
  return {
    problems: [
      ...(received === undefined ? ['the SQL check did not report the sha256 of the fixture text it received']
        : received !== hash ? [`psql received fixture text with sha256 ${received}, but ${fixture} has sha256 ${hash}`] : []),
      ...(passed === undefined ? ['the SQL check did not report that the training.v1 vectors passed'] : []),
    ],
    line: `training.v1 SQL check passed for ${fixture} (sha256 ${hash}, received unchanged): ${passed} [${sql} in ${db.container} at ${db.apiUrl}]`,
  };
}

export function main(argv = process.argv.slice(2), { io = process, ...options } = {}) {
  if (argv.length > 1) {
    io.stderr.write(`${USAGE}\n`);
    return 1;
  }
  let result;
  try { result = verifyFixtures({ ...options, sqlPath: argv[0] }); } catch (error) { result = { problems: [error instanceof Error ? error.message : String(error)] }; }
  if (result.problems.length) {
    io.stderr.write(`verify-fixtures failed:\n- ${result.problems.join('\n- ')}\n`);
    return 1;
  }
  io.stdout.write(`${result.line}\n`);
  return 0;
}
if (invokedDirectly(import.meta.url)) process.exitCode = main();
