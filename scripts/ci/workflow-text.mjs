// PL-1: the reader behind workflow-guard.mjs, for the block-style YAML the CI workflows are written in. It reads
// text and never runs it. A line it cannot place is a problem, never skipped (review 0535 L2): a line at an
// indentation it does not read, a line nested under a scalar value, a carriage return that does not end a
// line, a character outside printable ASCII, a value YAML could carry onto the lines after it on any line
// outside a block scalar's body (review 1005 M1, review 1102 L2), or a comment line with an expression, which
// inside a run block is script (review 1102 M1). Messages quote values in printable ASCII only, so no message
// can start a workflow command or hide a character from the log.

const escaped = (char) => `\\u${char.charCodeAt(0).toString(16).padStart(4, '0')}`;
/** JSON text with every character outside printable ASCII escaped, so a message stays one plain line. */
export function show(value) {
  if (value === undefined) return 'unset';
  return JSON.stringify(value).replace(/[^\x20-\x7e]/g, escaped);
}

export const indentOf = (line) => line.length - line.trimStart().length;
export const meaningful = (line) => line.trim() !== '' && !line.trimStart().startsWith('#');
/** Lines split as YAML would split this text once characterProblems has passed it: on LF or CRLF. */
export const linesOf = (text) => text.split(/\r?\n/);

const codePoint = (line, column) =>
  `U+${line.codePointAt(column).toString(16).toUpperCase().padStart(4, '0')}`;

const DOUBLE = String.raw`"(?:[^"\\]|\\.)*"`;
/** A single-quoted scalar; its closing quote is never followed by another, so `''` reads one way only. */
const SINGLE = String.raw`'(?:[^']|'')*'(?!')`;
/** Flow content on one line: no bracket, brace or comment outside a closed quoted item, so nothing nests. */
const FLOW = String.raw`(?:[^[\]{}'"#]|${DOUBLE}|${SINGLE})*`;
/** A quoted scalar, or a flow sequence or mapping, closed on its line, with at most a comment after it. */
const CLOSED = new RegExp(String.raw`^(${DOUBLE}|${SINGLE}|\[${FLOW}\]|\{${FLOW}\})(?:\s+#.*)?$`);

/**
 * A value as this reader keeps it, or null where YAML could read it otherwise (review 1005 M1). A plain value
 * loses a trailing comment. A quoted or flow value is kept whole, quotes and brackets included, only when it
 * closes on its line with at most a comment after it: one left open, YAML carries onto the lines after it,
 * which this reader would take for keys and steps of their own. A value that starts with an anchor, alias or
 * tag is refused too, since it can open such a value or stand for one defined elsewhere. Inside a closed
 * one-line flow they are kept as text, not refused (review 1102 L3).
 */
function readValue(raw) {
  if (/^[&*!]/.test(raw)) return null;
  if (!/^["'[{]/.test(raw)) return raw.replace(/\s+#.*$/, '');
  return CLOSED.exec(raw)?.[1] ?? null;
}

/** A block scalar header: `|` or `>`, with an optional chomping and indentation indicator. */
const BLOCK_SCALAR = /^[|>](?:[1-9][+-]?|[+-][1-9]?)?$/;
/** The `- `, `? ` and `: ` indicators a line may start with, after its indentation. */
const INDICATORS = /^(?:[-?:](?:\s+|$))+/;

/**
 * The value a meaningful line gives YAML, and the column its key or content starts at: after any `- `, `? ` or
 * `: ` indicators, the line itself when it starts with a quote, bracket, brace, anchor, alias or tag, else what
 * follows its first `: `, else nothing. A `key: |` line's key sits at that column: after `      - run: |` it is
 * 8, not 6, and YAML reads only the lines indented deeper than it as the block's body (review 1102 L2).
 */
function lineValue(line) {
  const content = line.trim();
  const indicators = INDICATORS.exec(content)?.[0] ?? '';
  const rest = content.slice(indicators.length);
  const column = indentOf(line) + indicators.length;
  if (/^["'[{&*!]/.test(rest)) return { column, value: rest };
  const colon = /:(?:\s+|$)/.exec(rest);
  return { column, value: colon ? rest.slice(colon.index + colon[0].length) : '' };
}

/**
 * A tab, which YAML forbids in indentation; a bare carriage return, which YAML reads as a line break where this
 * reader sees none; and the first other character outside printable ASCII, which some YAML parsers read as a
 * line break (U+0085, U+2028, U+2029) and a reviewer cannot see.
 */
function lineCharacterProblems(where, line) {
  const problems = [];
  const indentTab = /^ *\t/.test(line);
  if (indentTab) problems.push(`${where} indents with a tab, which YAML forbids`);
  if (line.includes('\r')) {
    problems.push(
      `${where} has a carriage return that does not end the line; YAML reads it as a line break, so YAML and this guard would see different lines`,
    );
  }
  for (let column = 0; column < line.length; column += 1) {
    const char = line[column];
    if (char >= ' ' && char <= '~') continue;
    // A carriage return, and a tab that indents, are reported above.
    if (char === '\r') continue;
    if (char === '\t' && indentTab && /^[ \t]*$/.test(line.slice(0, column))) continue;
    problems.push(
      `${where} has ${codePoint(line, column)} at column ${column + 1}, outside printable ASCII; a YAML parser may read it as a line break, and a reviewer cannot see it`,
    );
    break;
  }
  return problems;
}

/**
 * On every line, the character problems above and any comment line holding an expression (review 1102 M1):
 * inside a run block a `#` line is script, and GitHub fills in its `${{ }}` before the script runs, but every
 * reader here skips comment lines, so none of the guard's script rules would see it. Refusing the expression
 * wherever such a line sits is the simplest rule; no comment line in the three workflows holds one.
 *
 * On every meaningful line outside a block scalar's body, a value readValue refuses, wherever it sits,
 * including the keys this guard compares as text or not at all (review 1005 M1). A body line is script or
 * text, not a YAML value, so this one check skips it (review 1102 L2). The body starts after a `key: |` or
 * `key: >` line read outside a body, and ends at the first nonblank line, comment lines included, indented no
 * deeper than that key. YAML ends it there or sooner; a line it ends sooner on is a comment or a YAML error.
 * A body line that looks like `key: |` is script, and opens no block of its own.
 */
export function characterProblems(path, text) {
  const problems = [];
  /** The key column of the block scalar whose body the scan is in, or null outside one. */
  let blockKey = null;
  linesOf(text).forEach((line, i) => {
    const where = `${path}:${i + 1}`;
    problems.push(...lineCharacterProblems(where, line));
    if (blockKey !== null && line.trim() !== '' && indentOf(line) <= blockKey) blockKey = null;
    if (blockKey === null && meaningful(line)) {
      const { column, value } = lineValue(line);
      const kept = readValue(value);
      if (kept === null) {
        problems.push(
          `${where} has the value ${show(value)}, which this guard does not read: a quote, [ or { must close on its own line with at most a comment after it, and no anchor, alias or tag; otherwise YAML could read the lines after it into the value, while this guard reads them as keys and steps of their own`,
        );
      } else if (BLOCK_SCALAR.test(kept)) {
        blockKey = column;
      }
    }
    if (!meaningful(line) && line.includes('${{')) {
      problems.push(
        `${where} has an expression on a comment line; inside a run block that line is script, which GitHub fills in before the script runs, while this guard skips comment lines`,
      );
    }
  });
  return problems;
}

/** A plain block key, then a colon that ends the line or is followed by a space, and the value after it. */
const PLAIN_KEY = /^([A-Za-z0-9_-]+):(?:\s+(.*))?$/;

/**
 * `key: value` with a plain key and a value readValue keeps, or null: a plain value loses a trailing comment,
 * and a quoted or flow value must close on its line (review 1005 M1). refusedEntry says which part failed.
 */
export function entry(content) {
  const match = PLAIN_KEY.exec(content);
  if (!match) return null;
  const value = readValue((match[2] ?? '').trim());
  return value === null ? null : { key: match[1], value };
}

/** Why entry refused `content`: a plain key with a value readValue refuses, or no plain key (review 1102 L4). */
function refusedEntry(where, content) {
  return PLAIN_KEY.test(content)
    ? `${where} has ${show(content)}, a plain key with a value this guard does not read`
    : `${where} has ${show(content)}, which is not a plain key`;
}

/** The entries at exactly `indent`, each with the lines nested under it, and any line this reader cannot place. */
export function block(lines, indent) {
  const entries = [];
  const strays = [];
  lines.forEach((line, i) => {
    if (!meaningful(line)) return;
    const depth = indentOf(line);
    if (depth > indent && entries.length) return;
    if (depth !== indent) {
      strays.push(line.trim());
      return;
    }
    const end = lines.findIndex((next, j) => j > i && meaningful(next) && indentOf(next) <= indent);
    const content = line.trim();
    const body = lines.slice(i + 1, end < 0 ? lines.length : end);
    entries.push({ content, parsed: entry(content), body });
  });
  return { entries, strays };
}
export const get = ({ entries }, key) => entries.find(({ parsed }) => parsed?.key === key);
export const bodyLines = (found) => found.body.filter(meaningful).map((line) => line.trimEnd());

/**
 * Only `allowed` keys, each exactly once, as plain block keys, and no meaningful line nested under a scalar
 * value: YAML folds such a line into the value or reads it as a key of its own, and this reader skips it.
 */
export function keyProblems(where, { entries, strays }, allowed) {
  const problems = strays.map(
    (line) => `${where} has ${show(line)} at an indentation this guard does not read`,
  );
  for (const { content, parsed, body } of entries) {
    if (!parsed) {
      problems.push(refusedEntry(where, content));
      continue;
    }
    if (!allowed.includes(parsed.key)) {
      problems.push(`${where} sets ${parsed.key}; only ${allowed.join(', ')} are allowed`);
    }
    const nested = body.filter(meaningful).length;
    if (parsed.value !== '' && nested) {
      problems.push(
        `${where} has ${nested} ${nested === 1 ? 'line' : 'lines'} nested under ${parsed.key}: ${show(parsed.value)}; YAML folds such lines into the value or reads them as keys, and this guard does not read them`,
      );
    }
  }
  for (const key of allowed) {
    const count = entries.filter(({ parsed }) => parsed?.key === key).length;
    if (count !== 1)
      problems.push(`${where} must set ${key} exactly once (it does ${count} times)`);
  }
  return problems;
}

/**
 * The `      - ` items of a steps block, each as its lines with their depths. An item is `- key: value` with
 * one space, so its keys sit at depth 8; anything else is a problem.
 */
export function stepItems(lines, where) {
  const steps = [];
  const problems = [];
  for (const line of lines.filter(meaningful)) {
    const depth = indentOf(line);
    const content = line.trim();
    if (depth === 6 && /^- \S/.test(content)) {
      steps.push([{ depth: 8, content: content.slice(2) }]);
    } else if (depth > 6 && steps.length) {
      steps.at(-1).push({ depth, content });
    } else {
      problems.push(`${where} has ${show(content)} where a "      - key: value" step was expected`);
    }
  }
  return { steps, problems };
}

/**
 * One step's keys at depth 8, with `with:` inputs at depth 10. With `blockRun`, a `run:` block scalar keeps its
 * lines as `{ block, lines }`; any other deeper line is a problem. The caller judges which keys are allowed.
 */
export function readStep(fields, where, { blockRun = false } = {}) {
  const step = {};
  const problems = [];
  let inputs = null;
  let script = null;
  for (const { depth, content } of fields) {
    if (script && depth > 8) {
      script.push(content);
      continue;
    }
    script = null;
    const parsed = entry(content);
    if (!parsed) {
      problems.push(refusedEntry(where, content));
    } else if (depth === 8) {
      inputs = parsed.key === 'with' && parsed.value === '' ? {} : null;
      if (Object.hasOwn(step, parsed.key)) {
        problems.push(`${where} sets ${parsed.key} twice`);
      } else if (blockRun && parsed.key === 'run' && BLOCK_SCALAR.test(parsed.value)) {
        script = [];
        step.run = { block: parsed.value, lines: script };
      } else {
        step[parsed.key] = inputs ?? parsed.value;
      }
    } else if (depth === 10 && inputs) {
      if (Object.hasOwn(inputs, parsed.key))
        problems.push(`${where} sets with.${parsed.key} twice`);
      else inputs[parsed.key] = parsed.value;
    } else {
      problems.push(`${where} has ${show(content)} at an indentation this guard does not read`);
    }
  }
  return { step, problems };
}
