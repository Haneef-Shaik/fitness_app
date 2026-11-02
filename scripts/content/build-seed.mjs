import { realpathSync, writeFileSync } from 'node:fs';
import { isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CONTENT_ROOT, ContentError, loadCatalogue, summarise } from './catalogue.mjs';
import { buildExerciseSeedSql } from './seed.mjs';
import { buildStarterTemplates, hindiBacklog } from './templates.mjs';

// CT-1 content command. It validates content/ and prints or writes derived output; it never runs SQL.
//   check        one summary line
//   sql          the idempotent exercise seed (stdout, or --out <file.sql>)
//   templates    the three starter programmes in the persisted days contract shape (JSON)
//   hi-backlog   every record listed for G14.hi (JSON)

const REPO_ROOT = fileURLToPath(new URL('../../', import.meta.url));
const COMMANDS = ['check', 'sql', 'templates', 'hi-backlog'];
export const USAGE = 'usage: node scripts/content/build-seed.mjs <check | sql [--out <file.sql>] | templates | hi-backlog> [--content <dir>]';

export function parseArgs(argv) {
  const [command, ...rest] = argv;
  if (!COMMANDS.includes(command)) throw new Error(command === undefined ? 'a command is required' : `unknown command ${command}`);
  const options = { command, out: undefined, content: CONTENT_ROOT };
  for (let i = 0; i < rest.length; i += 1) {
    const flag = rest[i];
    const value = rest[i + 1];
    if ((flag === '--out' || flag === '--content') && typeof value === 'string' && value.length > 0 && !value.startsWith('--')) {
      options[flag.slice(2)] = value;
      i += 1;
    } else {
      throw new Error(`unexpected or incomplete argument ${flag}`);
    }
  }
  if (options.out !== undefined && command !== 'sql') throw new Error('--out applies to the sql command only');
  return options;
}

/** A .sql target anywhere except supabase/migrations/, which holds append-only migrations only. */
export function checkOutPath(out, cwd = process.cwd()) {
  const target = resolve(cwd, out);
  if (!target.endsWith('.sql')) throw new Error(`--out ${out} must name a .sql file`);
  const inRepo = relative(REPO_ROOT, target);
  if (inRepo && !inRepo.startsWith('..') && !isAbsolute(inRepo) && inRepo.split(sep).slice(0, 2).join('/') === 'supabase/migrations') {
    throw new Error(`--out ${out} is inside supabase/migrations/; the seed is not a migration`);
  }
  return target;
}

const display = (path) => {
  const inRepo = relative(REPO_ROOT, path);
  return inRepo && !inRepo.startsWith('..') && !isAbsolute(inRepo) ? inRepo.split(sep).join('/') : path;
};

export function main(argv = process.argv.slice(2), { io = process, cwd = process.cwd() } = {}) {
  let options;
  try { options = parseArgs(argv); } catch (error) {
    io.stderr.write(`${error.message}\n${USAGE}\n`);
    return 2;
  }
  let catalogue;
  try { catalogue = loadCatalogue(resolve(cwd, options.content)); } catch (error) {
    io.stderr.write(error instanceof ContentError ? `${error.message}\n` : `CT-1 content check failed: ${error instanceof Error ? error.message : String(error)}\n`);
    return 1;
  }
  if (options.command === 'check') {
    io.stdout.write(`${summarise(catalogue)}\n`);
    return 0;
  }
  if (options.command === 'templates') {
    io.stdout.write(`${JSON.stringify(buildStarterTemplates(catalogue), null, 2)}\n`);
    return 0;
  }
  if (options.command === 'hi-backlog') {
    io.stdout.write(`${JSON.stringify(hindiBacklog(catalogue), null, 2)}\n`);
    return 0;
  }
  const { sql, rows, payloadSha256 } = buildExerciseSeedSql(catalogue);
  if (options.out === undefined) {
    io.stdout.write(sql);
    return 0;
  }
  let target;
  try {
    target = checkOutPath(options.out, cwd);
    writeFileSync(target, sql);
  } catch (error) {
    io.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    return 1;
  }
  io.stdout.write(`Wrote ${display(target)}: ${rows.length} catalogue rows, payload sha256 ${payloadSha256}\n`);
  return 0;
}

function invokedDirectly() {
  try { return realpathSync(process.argv[1] ?? '') === realpathSync(fileURLToPath(import.meta.url)); } catch { return false; }
}
if (invokedDirectly()) process.exitCode = main();
