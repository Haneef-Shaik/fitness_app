import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// QA-9 (docs/23 §9 rule 3): coverage scope never narrows. A comment such as `/* istanbul ignore file */` takes code out of
// the count as surely as a narrower collectCoverageFrom, so coverage-ratchet.mjs fails when one is anywhere in the source
// trees whose coverage is enforced. It reads every file there as text and runs nothing.

/** The source trees whose coverage is enforced: mobile (Jest, instrumented by Istanbul) and domain (Node's test runner). */
export const SUPPRESSION_ROOTS = ['apps/mobile/src', 'packages/domain/src'];
/**
 * Comments that take code out of a coverage count: Istanbul's `istanbul ignore` (if, else, next, file); c8's and V8's
 * `c8 ignore` / `v8 ignore` (next, start, stop); and Node's `node:coverage` (disable, enable, ignore next). Each is matched
 * anywhere in a file, in any letter case and with any spacing, so a variant a tool might still honour fails too.
 */
const DIRECTIVES = [
  { tool: 'an Istanbul', pattern: /\bistanbul\s+ignore\b/gi },
  { tool: 'a c8 or V8', pattern: /\b[cv]8\s+ignore\b/gi },
  { tool: 'a Node test runner', pattern: /\bnode:coverage\b/gi },
];
const UNCHECKED = 'so it cannot be checked for coverage-suppression comments';
const reason = (error) => (error instanceof Error ? error.message : String(error));
const byName = (a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
const lineOf = (text, index) => text.slice(0, index).split('\n').length;
const defaultIo = {
  list: (dir) => readdirSync(dir, { withFileTypes: true }),
  read: (file) => readFileSync(file, 'utf8'),
};

/** Every suppression comment in one file's text, in the order they appear. */
function commentsIn(path, text) {
  return DIRECTIVES.flatMap(({ tool, pattern }) =>
    [...text.matchAll(pattern)].map((match) => ({ tool, index: match.index, found: match[0] })),
  )
    .sort((a, b) => a.index - b.index)
    .map(
      ({ tool, index, found }) =>
        `${path}:${lineOf(text, index)} has ${JSON.stringify(found)}, ${tool} coverage-suppression comment. It takes code out of the coverage count, which only goes up: remove it, and test the code or let it count as uncovered`,
    );
}

/**
 * Every coverage-suppression comment under the scanned trees, and how many files were read. Anything the scan cannot read
 * (a missing tree, a directory it cannot list, a file it cannot read, or an entry that is neither a regular file nor a
 * directory, such as a link) is a problem, so a gap in the scan never passes as a clean result.
 */
export function suppressionProblems(root, io = defaultIo) {
  const problems = [];
  let files = 0;
  const visit = (path) => {
    let entries;
    try {
      entries = io.list(join(root, path));
    } catch (error) {
      const missing = error?.code === 'ENOENT' && SUPPRESSION_ROOTS.includes(path);
      problems.push(
        missing
          ? `${path} is missing, ${UNCHECKED}`
          : `${path} cannot be listed (${reason(error)}), ${UNCHECKED}`,
      );
      return;
    }
    for (const entry of [...entries].sort(byName)) {
      const child = `${path}/${entry.name}`;
      if (entry.isDirectory()) {
        visit(child);
        continue;
      }
      if (!entry.isFile()) {
        problems.push(
          `${child} is not a regular file or directory, ${UNCHECKED}; Jest's file map skips links by default, which takes their code out of the count`,
        );
        continue;
      }
      files += 1;
      try {
        problems.push(...commentsIn(child, io.read(join(root, child))));
      } catch (error) {
        problems.push(`${child} cannot be read (${reason(error)}), ${UNCHECKED}`);
      }
    }
  };
  for (const tree of SUPPRESSION_ROOTS) visit(tree);
  return { problems, files };
}
