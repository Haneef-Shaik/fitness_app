import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { defaultIo, reason } from './config-inventory.mjs';

// QA-9 (docs/23 §9 rule 3, R14): type checking never quietly narrows. Read in TypeScript 6.0.3 (lib/typescript.js),
// 26 October 2026, three comments switch it off:
// - `@ts-nocheck`, a pragma in a file's leading `//` comments, whose name is lower-cased first (processCommentPragmas,
//   singleLinePragmaRegEx): no error is reported anywhere in that file;
// - `@ts-ignore` and `@ts-expect-error`, at the start of a `//` comment or of the last line of a block comment, followed by
//   anything (commentDirectiveRegExSingleLine and -MultiLine): no error is reported on the next line. `@ts-expect-error` is
//   itself an error when that line has none, so it cannot outlive the error it names; `@ts-ignore` can.
// gate-wiring.mjs pins the strict tsconfigs, and eslint-config-expo 57.0.2 does not enable @typescript-eslint/ban-ts-comment.
// So this scan reads every TypeScript file of the mobile and domain packages as text, strings and prose included:
// `@ts-ignore` and `@ts-nocheck` fail wherever they appear, and every `@ts-expect-error` needs a reason after it, on its own
// line and in the same comment. Such a string or prose must be reworded. It runs nothing.
// Letter case is matched with Unicode case folding (the `u` flag), not only ASCII case: toLowerCase() turns the KELVIN SIGN,
// U+212A, into "k", so TypeScript reads `@ts-nochec` followed by U+212A as ts-nocheck, and a /i pattern without `u` does not
// match it (phase-2E review, finding 1). The folding also matches U+017F, LONG S, to "s", which TypeScript does not lower-case
// to "s": a fail-safe extra match.
// Phase 2F (R16): skipLibCheck is true for both packages (expo/tsconfig.base and the domain tsconfig.json), and TypeScript then
// type-checks no declaration file (skipTypeCheckingWorker). So a declaration file under either package's src/ is refused:
// it could declare or loosen types with no comment at all. Elsewhere in the packages, such as a generated expo-env.d.ts or
// .expo/types, one is still read for comments but not refused; that narrower scope is the one Codex chose.
// Phase 2G (phase-2F review): declaration names follow TypeScript's own two tests, so a line break in a name changes nothing
// (finding 1). Files are read as bytes, and one that starts with a UTF-16 byte-order mark is refused before decoding, since
// TypeScript's sys.readFile decodes it as UTF-16 (finding 2). JavaScript under either src/ is refused: TypeScript does not
// type-check it and coverage does not count it (finding 3). Outside src/ JavaScript is neither read nor refused.

/** The packages whose type checks `pnpm check` runs: mobile `tsc --noEmit`, and domain `tsc --noEmit` and its client config. */
export const TYPE_ROOTS = ['apps/mobile', 'packages/domain'];
/** Each package's source folder, where a declaration file (R16) and a JavaScript file (phase 2G) are refused. */
export const SOURCE_ROOTS = TYPE_ROOTS.map((dir) => `${dir}/src`);
/** Each package's installed dependencies, skipped only at its top level: a node_modules folder deeper down is read. */
const INSTALLED = 'node_modules';
/**
 * The files TypeScript type-checks: .ts, .tsx, .mts and .cts, declarations included, in any letter case. JavaScript is not
 * read for comments: allowJs is on (expo/tsconfig.base) but checkJs is not, so TypeScript reports no error in it to suppress.
 * Under src/ it is refused instead (JAVASCRIPT).
 */
const TYPESCRIPT = /\.(?:[cm]?ts|tsx)$/i;
/**
 * JavaScript that Metro, Jest or Node would load: .js, .jsx, .mjs and .cjs, in any letter case. Under src/ it is refused.
 * Mobile type-checks none of it (allowJs without checkJs), the domain's tsconfig includes only .ts, and coverage, and the mobile
 * design-token lint, count only TypeScript files. So a file renamed to .jsx would leave strict types and the count unseen.
 */
const JAVASCRIPT = /\.(?:[cm]?js|jsx)$/i;
/**
 * TypeScript 6.0.3's declaration file names, copied from getDeclarationFileExtension (isDeclarationFileName): a name ending
 * .d.ts, .d.mts or .d.cts, or a name ending .ts with ".d." anywhere in it, such as styles.d.css.ts. Written as TypeScript
 * writes it, with no `.` wildcard: `.` does not match CR, LF, U+2028 or U+2029, and TypeScript allows any of them between ".d."
 * and ".ts" (phase-2F review, finding 1). These patterns ignore letter case and TypeScript's do not, and they read the whole
 * entry name where TypeScript reads the part after its last slash or backslash, so they can only add names: a superset by
 * construction. Type-suppression test 8 checks each name it uses, line breaks included, against the installed TypeScript.
 */
const DECLARATION_EXTENSION = /\.d\.[cm]ts$/i;
const TS_EXTENSION = /\.ts$/i;
const DECLARATION_MARK = /\.d\./i;
const isDeclarationName = (name) =>
  DECLARATION_EXTENSION.test(name) || (TS_EXTENSION.test(name) && DECLARATION_MARK.test(name));
/**
 * The byte-order marks TypeScript 6.0.3's sys.readFile decodes as UTF-16 when a file starts with them (FE FF swapped to
 * little-endian, FF FE as is). Every other file it decodes as UTF-8, as this scan, ESLint, Babel and Metro do.
 */
const UTF16_MARKS = [
  { encoding: 'UTF-16BE', bytes: [0xfe, 0xff] },
  { encoding: 'UTF-16LE', bytes: [0xff, 0xfe] },
];
/** Reads each file as raw bytes, so its byte-order mark is checked before anything is decoded. */
const byteIo = { list: defaultIo.list, read: (file) => readFileSync(file) };
const REFUSED = [
  {
    pattern: /@ts-nocheck/giu,
    effect:
      'which switches off type checking for the whole file. Remove it and fix the type errors',
  },
  {
    pattern: /@ts-ignore/giu,
    effect:
      'which switches off type checking for the next line and outlives the error it hides. Fix the type error, or use @ts-expect-error with a reason on the same line',
  },
];
const EXPECT_ERROR = /@ts-expect-error/giu;
const DECLARATION_IN_SOURCE =
  'is a declaration file in source. skipLibCheck is on in both packages, so TypeScript never type-checks it, and it can declare or loosen types without any suppression comment. Put the declarations in a checked .ts module, or change scripts/quality/type-suppression.mjs in a reviewed diff first';
const JAVASCRIPT_IN_SOURCE =
  'is JavaScript in source. TypeScript does not type-check it (checkJs is off), and coverage counts only TypeScript files, so it would escape strict types and coverage. Write it as .ts or .tsx, or change scripts/quality/type-suppression.mjs in a reviewed diff first';
const UTF16_EFFECT =
  'TypeScript decodes such a file as UTF-16, but this scan reads source as UTF-8, so a suppression comment in it would go unseen. Save it as UTF-8';
const NOT_BYTES = 'was not read as bytes, so its byte-order mark cannot be checked before decoding';
/** A reason ends at a line break (TypeScript's: CR, LF, U+2028 or U+2029) or at the end of its block comment. */
const REASON_END = /[\r\n\u2028\u2029]|\*\//u;
const SEPARATOR = /^[\s:\-\u2013\u2014]+/u;
/** A reason needs this many different words of two or more letters. */
export const REASON_WORDS = 3;
const WORD = /\p{L}{2,}/gu;
const PLACEHOLDERS = ['todo', 'fixme', 'tbd', 'xxx', 'hack'];
const UNCHECKED = 'so it cannot be checked for TypeScript suppression comments';
const byName = (a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
const lineOf = (text, index) => text.slice(0, index).split('\n').length;

/** The text after a `@ts-expect-error`, up to its line's end or its comment's end, with a leading `:` or dash removed. */
function reasonAfter(text, end) {
  const rest = text.slice(end);
  const stop = REASON_END.exec(rest);
  return rest
    .slice(0, stop ? stop.index : rest.length)
    .replace(SEPARATOR, '')
    .trim();
}
const substantive = (why) =>
  new Set(
    (why.match(WORD) ?? [])
      .map((word) => word.toLowerCase())
      .filter((word) => !PLACEHOLDERS.includes(word)),
  ).size >= REASON_WORDS;

/** Every refused or unexplained suppression comment in one file's text, in the order they appear. */
function suppressionsIn(path, text) {
  const refused = REFUSED.flatMap(({ pattern, effect }) =>
    [...text.matchAll(pattern)].map((match) => ({
      index: match.index,
      problem: `has ${JSON.stringify(match[0])}, ${effect}`,
    })),
  );
  const unexplained = [...text.matchAll(EXPECT_ERROR)]
    .map((match) => ({ match, why: reasonAfter(text, match.index + match[0].length) }))
    .filter(({ why }) => !substantive(why))
    .map(({ match, why }) => ({
      index: match.index,
      problem: `has ${JSON.stringify(match[0])} ${why ? `with the reason ${JSON.stringify(why)}` : 'with no reason'}: give a reason of at least ${REASON_WORDS} different words after it, on the same line and in the same comment, saying why the error is expected (TODO, FIXME, TBD, XXX and HACK do not count)`,
    }));
  return [...refused, ...unexplained]
    .sort((a, b) => a.index - b.index)
    .map(({ index, problem }) => `${path}:${lineOf(text, index)} ${problem}`);
}

const inSource = (path) => SOURCE_ROOTS.some((dir) => path.startsWith(`${dir}/`));
/** The UTF-16 byte-order mark a file's bytes start with, as TypeScript checks it (the first two bytes), or undefined. */
const utf16MarkOf = (bytes) =>
  UTF16_MARKS.find(
    (mark) => bytes.length >= 2 && bytes[0] === mark.bytes[0] && bytes[1] === mark.bytes[1],
  );
const hex = (bytes) =>
  bytes.map((byte) => byte.toString(16).toUpperCase().padStart(2, '0')).join(' ');
/** The UTF-8 text of a file's bytes, decoded as TypeScript decodes a file with no UTF-16 byte-order mark. */
const utf8Of = (bytes) =>
  Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength).toString('utf8');

/**
 * One TypeScript file's problems: a declaration file in source; a file that cannot be read, or that the reader did not hand
 * back as bytes; a file that starts with a UTF-16 byte-order mark; or else its suppression comments, read as UTF-8.
 */
function typescriptFileProblems(root, io, path, name) {
  const declared =
    isDeclarationName(name) && inSource(path) ? [`${path} ${DECLARATION_IN_SOURCE}`] : [];
  let bytes;
  try {
    bytes = io.read(join(root, path));
  } catch (error) {
    return [...declared, `${path} cannot be read (${reason(error)}), ${UNCHECKED}`];
  }
  if (!(bytes instanceof Uint8Array)) return [...declared, `${path} ${NOT_BYTES}, ${UNCHECKED}`];
  const mark = utf16MarkOf(bytes);
  if (mark)
    return [
      ...declared,
      `${path} starts with the ${mark.encoding} byte-order mark ${hex(mark.bytes)}. ${UTF16_EFFECT}`,
    ];
  return [...declared, ...suppressionsIn(path, utf8Of(bytes))];
}

/**
 * Every TypeScript suppression comment in the mobile and domain packages, every TypeScript file there that starts with a
 * UTF-16 byte-order mark, every declaration file and JavaScript file in their src/, and how many TypeScript files were read.
 * Anything the scan cannot read (a missing package, a folder it cannot list, a file it cannot read as bytes, or an entry that
 * is neither a regular file nor a directory, such as a link) is a problem, so a gap in the scan never passes as a clean result.
 */
export function typeSuppressionProblems(root, io = byteIo) {
  const problems = [];
  let files = 0;
  const visit = (path, top) => {
    let listed;
    try {
      listed = io.list(join(root, path));
    } catch (error) {
      problems.push(
        top && error?.code === 'ENOENT'
          ? `${path} is missing, ${UNCHECKED}`
          : `${path} cannot be listed (${reason(error)}), ${UNCHECKED}`,
      );
      return;
    }
    for (const entry of [...listed].sort(byName)) {
      if (top && entry.name === INSTALLED) continue;
      const child = `${path}/${entry.name}`;
      if (entry.isDirectory()) {
        visit(child, false);
        continue;
      }
      if (!entry.isFile()) {
        problems.push(
          `${child} is not a regular file or directory, ${UNCHECKED}; TypeScript follows links, so a link can bring in a file this scan never reads`,
        );
        continue;
      }
      if (JAVASCRIPT.test(entry.name) && inSource(child)) {
        problems.push(`${child} ${JAVASCRIPT_IN_SOURCE}`);
        continue;
      }
      if (!TYPESCRIPT.test(entry.name)) continue;
      files += 1;
      problems.push(...typescriptFileProblems(root, io, child, entry.name));
    }
  };
  for (const tree of TYPE_ROOTS) visit(tree, true);
  return { problems, files };
}
