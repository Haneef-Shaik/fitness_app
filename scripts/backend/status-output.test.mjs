import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { inspect } from 'node:util';
import * as statusOutput from './status-output.mjs';

// The guarded parse of `supabase status -o json` output that a caller has already captured (QA-9 phase 3N gap G5, fix
// F4). Pure: every input is a synthetic string or Buffer built here. Nothing here runs a command, reads a real status or
// reaches Docker, a database or the network. The three integration suites are read as text and never imported, because
// importing one runs it against the local stack.
const { parseStatusOutput } = statusOutput;

// Credential-shaped synthetic values, assembled from parts so neither literal appears in any file. They are not keys.
const SECRET = ['sb', 'secret', 'statusparse-synthetic-must-never-print-0001'].join('_');
const PUBLISHABLE = ['sb', 'publishable', 'statusparse-synthetic-must-never-print-0002'].join('_');
const LOOPBACK = 'http://127.0.0.1:55321';
const NOT_JSON = 'supabase status -o json did not print JSON; its output is not shown because it holds keys';
const NOT_OBJECT = 'supabase status -o json did not print a JSON object; its output is not shown because it holds keys';
// What a raw JSON.parse error, or one attached as a cause, would show: V8 names the failure and quotes the input near it.
const PARSE_DETAIL = /SyntaxError|is not valid JSON|in JSON at position|Unexpected token|Unexpected end of JSON|Unexpected non-whitespace|Unterminated string|Bad control character|\[cause\]/;
const statusJson = (fields = {}) => JSON.stringify({ API_URL: LOOPBACK, PUBLISHABLE_KEY: PUBLISHABLE, SECRET_KEY: SECRET, ...fields });
const read = (name) => readFileSync(new URL(name, import.meta.url), 'utf8');
const occurrences = (text, part) => text.split(part).length - 1;

/**
 * The error parseStatusOutput throws for `input`, after checking every way it can be shown: its message, its string form,
 * its stack and a full inspection. None may hold the synthetic credentials, a key name, the input's URL, a parse detail
 * or a cause, and the error carries no field but its fixed message.
 */
function refusal(input, expected, label) {
  let caught;
  assert.throws(() => parseStatusOutput(input), (error) => { caught = error; return true; }, `${label}: must throw`);
  assert.equal(Object.getPrototypeOf(caught), Error.prototype, `${label}: a plain Error, not the parse error`);
  assert.equal(caught.message, expected, `${label}: the fixed message`);
  assert.equal('cause' in caught, false, `${label}: no cause`);
  assert.deepEqual(Object.getOwnPropertyNames(caught).filter((name) => name !== 'stack'), ['message'], `${label}: no field but the message`);
  const [head, ...frames] = String(caught.stack).split('\n');
  assert.equal(head, `Error: ${expected}`, `${label}: the stack starts with the fixed message`);
  for (const frame of frames) assert.match(frame, /^\s+at /, `${label}: after the message the stack holds call sites only`);
  for (const shown of [caught.message, String(caught), String(caught.stack), inspect(caught, { showHidden: true, depth: Infinity })]) {
    assert.equal(shown.includes(SECRET), false, `${label}: the synthetic secret is shown`);
    assert.equal(shown.includes(PUBLISHABLE), false, `${label}: the synthetic publishable key is shown`);
    assert.doesNotMatch(shown, /sb_(secret|publishable)_/, `${label}: part of a synthetic key is shown`);
    assert.doesNotMatch(shown, /API_URL|SECRET_KEY|PUBLISHABLE_KEY|127\.0\.0\.1/, `${label}: a key name or the input's URL is shown`);
    assert.doesNotMatch(shown, PARSE_DETAIL, `${label}: a parse detail or a cause is shown`);
  }
  return caught;
}

test('a JSON object, as a string or as a Buffer, comes back exactly as JSON.parse gives it', () => {
  const expected = { API_URL: LOOPBACK, PUBLISHABLE_KEY: PUBLISHABLE, SECRET_KEY: SECRET };
  assert.deepEqual(parseStatusOutput(statusJson()), expected);
  assert.deepEqual(parseStatusOutput(`${statusJson()}\n`), expected, 'the CLI ends its output with a line break');
  const bytes = Buffer.from(`${statusJson()}\n`, 'utf8');
  const before = Buffer.from(bytes);
  assert.deepEqual(parseStatusOutput(bytes), expected, 'a Buffer is read as UTF-8');
  assert.deepEqual(bytes, before, 'the Buffer is only read, never changed');
  const nested = { API_URL: LOOPBACK, NESTED: { list: [1, 'two', null], flag: true }, COUNT: 3 };
  assert.deepEqual(parseStatusOutput(JSON.stringify(nested, null, 2)), nested);
  assert.deepEqual(parseStatusOutput(Buffer.from(JSON.stringify(nested), 'utf8')), nested);
});

test("the helper decides no target: values come back unchanged, so each suite's loopback assertion still refuses a near miss", () => {
  const nearMisses = [` ${LOOPBACK}`, `${LOOPBACK} `, `${LOOPBACK}/`, 'http://localhost:55321', 'https://127.0.0.1:55321', 'http://127.0.0.1:55322'];
  for (const near of nearMisses) {
    const parsed = parseStatusOutput(JSON.stringify({ API_URL: near }));
    assert.equal(parsed.API_URL, near, 'not trimmed, rewritten or normalised');
    assert.notEqual(parsed.API_URL, LOOPBACK);
  }
  assert.deepEqual(parseStatusOutput('{}'), {}, "a missing API_URL is not filled in; the suite's own assertion refuses it");
});

test('malformed output fails closed with one fixed message that shows no input, parse detail, key or cause', () => {
  const full = statusJson();
  const malformed = [
    full.slice(0, -1), // cut before its closing brace
    full.slice(0, full.indexOf(SECRET) + 12), // cut inside the secret's string
    `{"API_URL":"${LOOPBACK}","SECRET_KEY":${SECRET}}`, // the secret unquoted, right at the failing position
    SECRET, // nothing but the secret
    `${full}\n${SECRET}`, // a whole object, then more output
    `Starting the CLI\n${full}`, // a notice line before the object
    `\n         API URL: ${LOOPBACK}\n      Secret key: ${SECRET}\n`, // a text table, not JSON
    `{"SECRET_KEY":"${SECRET}\n"}`, // a raw line break inside a string
    '', // no output at all
    '   \n', // only white space
  ];
  for (const [index, text] of malformed.entries()) {
    refusal(text, NOT_JSON, `malformed ${index} (string)`);
    refusal(Buffer.from(text, 'utf8'), NOT_JSON, `malformed ${index} (Buffer)`);
  }
});

test('JSON that is not an object (null, an array, a scalar) fails closed with its own fixed message', () => {
  const notObjects = ['null', ' null\n', '[]', `[${statusJson()}]`, JSON.stringify(LOOPBACK), JSON.stringify(SECRET), '0', '55321', '-1.5e3', 'true', 'false'];
  for (const [index, text] of notObjects.entries()) {
    refusal(text, NOT_OBJECT, `not an object ${index} (string)`);
    refusal(Buffer.from(text, 'utf8'), NOT_OBJECT, `not an object ${index} (Buffer)`);
  }
});

test('anything but a string or a Buffer is refused before any parse, with the fixed message', () => {
  const lookalike = { toString: () => statusJson() };
  const others = [undefined, null, 55321, true, lookalike, [statusJson()], new Uint8Array(Buffer.from(statusJson(), 'utf8'))];
  for (const [index, input] of others.entries()) refusal(input, NOT_JSON, `not text ${index}`);
});

const STATUS_CALL = "run('pnpm', ['exec', 'supabase', 'status', '-o', 'json'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })";
const HELPER_IMPORT = "import { parseStatusOutput } from './status-output.mjs';";
const CHILD_IMPORT = "import { execFileSync } from 'node:child_process';";
const WRAPPER_IMPORT = "import { readLocalStatus } from './status-command.mjs';";
const SUITES = Object.freeze([
  { file: 'verify.mjs', name: 'status', check: "assert.equal(status.API_URL, 'http://127.0.0.1:55321', 'Refusing to run against any other backend');" },
  { file: 'verify-gym.mjs', name: 'config', check: "assert.equal(config.API_URL, 'http://127.0.0.1:55321', 'Tests only run on the isolated local stack');" },
  { file: 'verify-freezes.mjs', name: 'config', check: "assert.equal(config.API_URL, 'http://127.0.0.1:55321', 'Tests only run on the isolated local stack');" },
]);

test('all three suites reach the helper only through the status-command wrapper, which runs the unchanged status command once and passes its output straight to the helper (read as text, never imported)', () => {
  const wrapper = read('status-command.mjs');
  const wrapperLines = wrapper.split('\n');
  assert.equal(wrapperLines.filter((line) => line === HELPER_IMPORT).length, 1, 'status-command.mjs: imports the helper once');
  assert.equal(wrapperLines.filter((line) => line === CHILD_IMPORT).length, 1, 'status-command.mjs: holds the unchanged child-process import');
  assert.equal(occurrences(wrapper, STATUS_CALL), 1, 'status-command.mjs: the status command and its options are unchanged, and run once');
  assert.equal(occurrences(wrapper, 'run('), 1, 'status-command.mjs: no other child call');
  assert.equal(occurrences(wrapper, 'parseStatusOutput('), 1, 'status-command.mjs: one guarded parse');
  assert.equal(wrapperLines.filter((line) => line.trim() === 'return parseStatusOutput(output);').length, 1, "status-command.mjs: the command's output goes straight to the helper");
  assert.doesNotMatch(wrapper, /JSON\.parse/, 'status-command.mjs: no unguarded parse');
  for (const { file, name, check } of SUITES) {
    const source = read(file);
    const lines = source.split('\n');
    assert.equal(lines.filter((line) => line === WRAPPER_IMPORT).length, 1, `${file}: imports the wrapper once`);
    const parsed = lines.indexOf(`const ${name} = readLocalStatus();`);
    assert.notEqual(parsed, -1, `${file}: status comes from the wrapper, so its output reaches the helper`);
    assert.equal(lines[parsed + 1], check, `${file}: the loopback assertion follows at once, unchanged`);
    assert.equal(occurrences(source, check), 1, `${file}: one loopback assertion`);
    assert.equal(occurrences(source, 'readLocalStatus('), 1, `${file}: the wrapper runs once`);
    assert.equal(occurrences(source, 'execFileSync'), 0, `${file}: no child import or call of its own`);
    assert.equal(occurrences(source, 'node:child_process'), 0, `${file}: no child-process import of its own`);
    assert.equal(occurrences(source, 'parseStatusOutput'), 0, `${file}: no parse of its own; the helper parses inside the wrapper`);
    assert.doesNotMatch(source, /JSON\.parse\(\s*execFileSync\(/, `${file}: the unguarded status parse stays removed`);
  }
});

test('the helper is pure and narrow: one export, node:buffer its only import, and no file, network, child, console or process use', () => {
  assert.deepEqual(Object.keys(statusOutput), ['parseStatusOutput']);
  const source = read('status-output.mjs');
  const specifiers = [...source.matchAll(/\bfrom\s*['"]([^'"]+)['"]|\bimport\s*\(\s*['"]([^'"]+)['"]|^\s*import\s*['"]([^'"]+)['"]/gm)].map((match) => match[1] ?? match[2] ?? match[3]);
  assert.deepEqual(specifiers, ['node:buffer']);
  assert.doesNotMatch(source, /\b(?:process|console|globalThis)\b|\brequire\s*\(|\bfetch\b|execFile|spawn|readFile|writeFile|\bimport\s*\(/);
});
