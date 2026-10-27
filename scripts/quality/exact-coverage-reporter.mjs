import { readdirSync, realpathSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

// Exact coverage thresholds for Node's test runner (QA-9). Node 22.23.1 reads --test-coverage-lines, -branches and
// -functions as whole numbers: 92.63 is enforced as 92, and 90.60 as 90. This reporter re-checks the same flags exactly,
// in integers, against the run's covered and total counts, and fails the run when one is not met. Node also counts only the
// files a test loads, so the reporter fails the run when a file the --test-coverage-include globs match was never loaded.
// Use it beside the visible reporter, with its own destination. It reads only the flags of the process it runs in.

const METRICS = { lines: 'Line', branches: 'Branch', functions: 'Function' };
const FLAG = /^--test-coverage-(lines|branches|functions)=(.*)$/;
const GLOB_FLAG = /^--test-coverage-(include|exclude)=(.*)$/;

/** The threshold flags this Node process was started with, as numbers (NaN when a flag is not a number). */
export function thresholdsFrom(execArgv) {
  return Object.fromEntries(
    execArgv.flatMap((arg) => {
      const match = FLAG.exec(arg);
      return match ? [[match[1], match[2].trim() === '' ? Number.NaN : Number(match[2])]] : [];
    }),
  );
}

/** A threshold in hundredths of a percent, or null unless it is a number from 0 to 100 with at most 2 decimals. */
export function hundredths(threshold) {
  if (!Number.isFinite(threshold) || threshold < 0 || threshold > 100) return null;
  const scaled = Math.round(threshold * 100);
  return Math.abs(threshold * 100 - scaled) < 1e-6 ? scaled : null;
}

/** Each threshold against the totals, in integers: covered × 10000 must reach the threshold in hundredths × total. */
export function verdict(totals, thresholds) {
  const results = Object.entries(thresholds).map(([metric, threshold]) => {
    const covered = totals?.[`covered${METRICS[metric]}Count`];
    const total = totals?.[`total${METRICS[metric]}Count`];
    const scaled = hundredths(threshold);
    if (
      scaled === null ||
      !Number.isInteger(covered) ||
      !Number.isInteger(total) ||
      covered < 0 ||
      covered > total
    ) {
      return {
        failed: true,
        line: `Error: ${metric} coverage cannot be checked exactly (threshold ${threshold}, which must be a number from 0 to 100 with at most 2 decimals; counts ${covered}/${total})`,
      };
    }
    const shown = total === 0 ? '100.0000' : ((covered * 100) / total).toFixed(4);
    return covered * 10000 >= scaled * total
      ? {
          failed: false,
          line: `Exact ${metric} coverage ${covered}/${total} (${shown}%) meets the threshold of ${threshold}%`,
        }
      : {
          failed: true,
          line: `Error: exact ${metric} coverage ${covered}/${total} (${shown}%) does not meet the threshold of ${threshold}%`,
        };
  });
  return {
    failed: results.some((result) => result.failed),
    lines: results.map((result) => result.line),
  };
}

/** The include and exclude globs this Node process was started with. */
export function globsFrom(execArgv) {
  const matches = execArgv.map((arg) => GLOB_FLAG.exec(arg)).filter(Boolean);
  return {
    include: matches.filter((m) => m[1] === 'include').map((m) => m[2]),
    exclude: matches.filter((m) => m[1] === 'exclude').map((m) => m[2]),
  };
}

/**
 * A glob over '/'-separated relative paths, as a RegExp. Only literal characters, `*` and a whole `**` directory segment are
 * read, which is all the domain script uses; anything else returns null, so the caller fails closed instead of guessing.
 */
export function globRegExp(glob) {
  if (glob === '' || glob.startsWith('/') || glob.startsWith('./') || /[?[\]{}()!+@\\]/.test(glob))
    return null;
  let source = '';
  for (let i = 0; i < glob.length; ) {
    if (glob.startsWith('**/', i)) {
      source += '(?:[^/]+/)*';
      i += 3;
    } else if (glob[i] === '*') {
      if (glob[i + 1] === '*') return null;
      source += '[^/]*';
      i += 1;
    } else {
      source += glob[i].replace(/[.^$|]/g, '\\$&');
      i += 1;
    }
  }
  return new RegExp(`^${source}$`);
}

/** Every file under dir, as '/'-separated paths relative to base. Dot entries, node_modules and symbolic links are skipped. */
function filesUnder(base, dir) {
  let entries;
  try {
    entries = readdirSync(join(base, dir), { withFileTypes: true });
  } catch (error) {
    if (error?.code === 'ENOENT') return [];
    throw error;
  }
  return entries
    .filter((entry) => !entry.name.startsWith('.') && entry.name !== 'node_modules')
    .flatMap((entry) => {
      const path = dir ? `${dir}/${entry.name}` : entry.name;
      if (entry.isDirectory()) return filesUnder(base, path);
      return entry.isFile() ? [path] : [];
    });
}

/** The files the globs select under the working directory, and those of them Node's summary does not list. */
export function coverageFiles(summary, { include, exclude }) {
  const toRegExp = (glob) => {
    const pattern = globRegExp(glob);
    if (!pattern)
      throw new Error(
        `the coverage glob ${JSON.stringify(glob)} uses syntax this reporter does not read (only *, **/ and literal characters)`,
      );
    return pattern;
  };
  const includes = include.map(toRegExp);
  const excludes = exclude.map(toRegExp);
  const base = realpathSync(summary.workingDirectory);
  const roots = [
    ...new Set(
      include.map((glob) => {
        const parts = glob.split('/');
        const wild = parts.findIndex((part) => part.includes('*'));
        return parts.slice(0, wild < 0 ? parts.length - 1 : wild).join('/');
      }),
    ),
  ];
  const expected = [...new Set(roots.flatMap((dir) => filesUnder(base, dir)))]
    .filter(
      (file) =>
        includes.some((pattern) => pattern.test(file)) &&
        !excludes.some((pattern) => pattern.test(file)),
    )
    .sort();
  const listed = new Set(
    summary.files.map((file) => relative(base, realpathSync(file.path)).split(sep).join('/')),
  );
  return { expected, missing: expected.filter((file) => !listed.has(file)) };
}

/** Lines about files the include globs match: an error for each one no test loaded, or the count when all were. */
function completeness(summary, globs, thresholds) {
  if (!globs.include.length) {
    return Object.keys(thresholds).length
      ? {
          failed: true,
          lines: [
            'Error: coverage thresholds are set without --test-coverage-include, so files no test loads cannot be found',
          ],
        }
      : { failed: false, lines: [] };
  }
  try {
    const { expected, missing } = coverageFiles(summary, globs);
    return missing.length
      ? {
          failed: true,
          lines: missing.map(
            (file) =>
              `Error: ${file} matches --test-coverage-include but no test loaded it, so its lines are not counted; load it from a test`,
          ),
        }
      : {
          failed: false,
          lines: [
            `Coverage counts all ${expected.length} files that --test-coverage-include matches`,
          ],
        };
  } catch (error) {
    return {
      failed: true,
      lines: [
        `Error: the files coverage should count cannot be listed (${error instanceof Error ? error.message : String(error)})`,
      ],
    };
  }
}

export default async function* exactCoverageReporter(source) {
  const thresholds = thresholdsFrom(process.execArgv);
  const globs = globsFrom(process.execArgv);
  let reported = false;
  for await (const event of source) {
    if (event.type !== 'test:coverage') continue;
    reported = true;
    const exact = verdict(event.data?.summary?.totals, thresholds);
    const files = completeness(event.data?.summary, globs, thresholds);
    if (exact.failed || files.failed) process.exitCode = 1;
    yield [...exact.lines, ...files.lines].map((line) => `${line}\n`).join('');
  }
  if (!reported && Object.keys(thresholds).length) {
    process.exitCode = 1;
    yield 'Error: coverage thresholds are set, but no coverage report arrived to check them exactly\n';
  }
}
