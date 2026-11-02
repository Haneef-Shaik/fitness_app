import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { inspect } from 'node:util';

// The guarded read of the freeze projection query's output for verify-freeze-projection.mjs (MB-1 / QA-9 gap G5). Every
// callback here is an injected fake that returns or throws synthetic values: nothing here starts a child process or
// reaches Docker, psql, a database or the network, and no private file is read. The helper's source is checked as text
// before it is loaded, so a change that would load or run anything on import fails here first. The consumer is read as
// text and never imported, because importing it runs the projection query against the local stack.

const read = (name) => readFileSync(new URL(name, import.meta.url), 'utf8');
const occurrences = (text, part) => text.split(part).length - 1;
const specifiersOf = (source) => [...source.matchAll(/\bfrom\s*['"]([^'"]+)['"]|\bimport\s*\(\s*['"]([^'"]+)['"]|^\s*import\s*['"]([^'"]+)['"]/gm)].map((match) => match[1] ?? match[2] ?? match[3]);

const NO_RUN = 'freeze projection read needs a callback that runs the query; nothing was run';
const FAILED = 'freeze projection query failed; its error and output are not shown because they can hold query text and data';
const NOT_JSON = 'freeze projection query did not print JSON; its output is not shown because it can hold query data';
const NOT_OBJECT = 'freeze projection query did not print a JSON object; its output is not shown because it can hold query data';
const MESSAGES = Object.freeze({ NO_RUN, FAILED, NOT_JSON, NOT_OBJECT });

/**
 * Throws unless the helper is pure: it loads nothing; it names no way to run a command, touch a file or the network, or
 * print; it calls the supplied callback in one place, with no arguments and no default; it binds no caught value and
 * reads no field of anything thrown or returned; and each refusal is a new Error with one fixed message and no cause.
 * Checked on the source text, before the module is loaded.
 */
function assertHelperIsPure(source) {
  assert.deepEqual(specifiersOf(source), [], 'the helper loads no module');
  assert.doesNotMatch(source, /\bimport\b|\brequire\b|node:|child_process/, 'no static or dynamic load');
  assert.doesNotMatch(source, /\b(?:process|console|globalThis|eval|Function|fetch|spawn|spawnSync|exec|execSync|execFile|execFileSync|fork|Buffer|setTimeout|setInterval|queueMicrotask)\b|readFile|writeFile/, 'nothing that could run, read, write or print');
  for (const [name, message] of Object.entries(MESSAGES)) assert.equal(occurrences(source, `const ${name} = '${message}';`), 1, `${name} is fixed text`);
  assert.equal(occurrences(source, 'export '), 1, 'one export');
  assert.equal(occurrences(source, 'export function readProjectionResult(run) {'), 1, 'the callback is a required parameter with no default');
  assert.equal(occurrences(source, 'readProjectionResult'), 1, 'the helper never calls itself');
  assert.doesNotMatch(source, /\brun\s*=[^=]/, 'run has no default and is never reassigned');
  assert.equal(occurrences(source, 'run('), 1, 'the callback is called in one place');
  assert.equal(occurrences(source, 'return run();'), 1, 'with no arguments, its value returned unread');
  assert.equal(occurrences(source, 'catch {'), 2, 'one catch around the callback and one around the parse, neither binding anything');
  assert.doesNotMatch(source, /catch\s*\(/, 'no catch binds the thrown value');
  assert.equal(occurrences(source, 'JSON.parse('), 1, 'one parse');
  assert.doesNotMatch(source, /\.(?:cause|stdout|stderr|output|message|stack|status|signal|code|errors|toString|valueOf|then)\b/, 'no field of anything thrown or returned is read');
  const raised = source.split('\n').filter((line) => /\bthrow\b/.test(line)).map((line) => line.match(/^\s*if \(.+\) throw new Error\(([A-Z_]+)\);$/)?.[1]);
  assert.deepEqual(raised, ['NO_RUN', 'FAILED', 'NOT_JSON', 'NOT_OBJECT'], 'each refusal is a new Error with one fixed message and no cause, in this order');
}

assertHelperIsPure(read('projection-output.mjs'));
const projectionOutput = await import('./projection-output.mjs');
const { readProjectionResult } = projectionOutput;

// Synthetic values assembled from parts, so no literal appears in any file. SQL only resembles the suite's query text;
// nothing here runs it.
const SENTINEL = ['projection', 'output', 'sentinel', 'must-never-print-0006'].join('-');
const SQL = `select private.freeze_projection($terms$[{"note":"${SENTINEL}"}]$terms$::jsonb)`;
const PROJECTION = { changes: [{ id: 'synthetic-term-0001', startsOn: '2026-11-05', endsOn: '2026-12-05', originalEndsOn: '2026-12-01' }], remainingDays: 3, consumedDays: 4, gapDays: 0, mode: 'approve' };
const PRINTED = JSON.stringify(PROJECTION);
const LEAKY = JSON.stringify({ ...PROJECTION, note: SENTINEL });
// Any of these in a refusal means raw output, query text or a detail of the original error got through.
const RAW = /must-never-print|freeze_projection|\$terms\$|\bpsql\b|docker exec|ON_ERROR_STOP|synthetic-term|remainingDays/;
const ORIGINAL_DETAIL = /Command failed|spawnSync|ENOENT|ETIMEDOUT|SyntaxError|RangeError|Unexpected (?:token|end|non-whitespace)|not valid JSON|at position|\b(?:stdout|stderr|output|status|signal|pid|errno|syscall|spawnargs|cause|errors)\s*:|\[cause\]|\[errors\]/;

/**
 * The error `action` raises, after checking every way it can be shown: its message, string form, stack, a full
 * inspection, JSON with and without hidden fields, and a structured clone. None may hold the sentinel, query text, raw
 * output or any detail of an original error, and the error has no field but its fixed message and no cause.
 */
function refusal(action, expected, label) {
  let caught;
  assert.throws(action, (error) => { caught = error; return true; }, `${label}: must throw`);
  assert.equal(Object.getPrototypeOf(caught), Error.prototype, `${label}: a plain Error`);
  assert.equal(caught.message, expected, `${label}: the fixed message`);
  assert.equal('cause' in caught, false, `${label}: no cause`);
  assert.deepEqual(Object.getOwnPropertyNames(caught).filter((name) => name !== 'stack'), ['message'], `${label}: no field but the message`);
  assert.deepEqual(Object.getOwnPropertySymbols(caught), [], `${label}: no symbol field`);
  const [head, ...frames] = String(caught.stack).split('\n');
  assert.equal(head, `Error: ${expected}`, `${label}: the stack starts with the fixed message`);
  for (const frame of frames) assert.match(frame, /^\s+at /, `${label}: after the message the stack holds call sites only`);
  const shown = [
    caught.message,
    String(caught),
    String(caught.stack),
    inspect(caught, { showHidden: true, depth: Infinity }),
    JSON.stringify(caught),
    JSON.stringify(caught, Object.getOwnPropertyNames(caught)),
    inspect(structuredClone(caught), { showHidden: true, depth: Infinity }),
  ];
  for (const form of shown) {
    assert.equal(form.includes(SENTINEL), false, `${label}: the sentinel is shown`);
    assert.doesNotMatch(form, RAW, `${label}: raw output or query text is shown`);
    assert.doesNotMatch(form, ORIGINAL_DETAIL, `${label}: a detail of an original error is shown`);
  }
  return caught;
}

/** The refusal for a callback that returns `output`, after exactly one call with no arguments. */
function refusedOutput(output, expected, label) {
  const calls = [];
  const caught = refusal(() => readProjectionResult((...received) => { calls.push(received); return output; }), expected, label);
  assert.deepEqual(calls, [[]], `${label}: one call with no arguments, never retried`);
  return caught;
}

/** The refusal for a callback that throws `thrown`: the fixed failure, after exactly one call, never `thrown` itself. */
function failure(thrown, label) {
  const calls = [];
  const caught = refusal(() => readProjectionResult((...received) => { calls.push(received); throw thrown; }), FAILED, label);
  assert.deepEqual(calls, [[]], `${label}: one call with no arguments, never retried`);
  assert.equal(caught === thrown, false, `${label}: a new error, not the thrown value`);
  return caught;
}

/** An error shaped like the one a failed `docker exec … psql` call raises, with the sentinel in its message, stack, cause and fields. */
const commandError = (fields = {}) => Object.assign(
  new Error(`Command failed: docker exec synthetic-container psql -At -c ${SQL}\nERROR:  ${SENTINEL}`, { cause: new Error(`${SENTINEL} ${SQL}`) }),
  { stack: `Error: Command failed ${SENTINEL}\n    at ${SENTINEL} (file:///${SENTINEL}.mjs:1:1)`, status: 1, signal: null, pid: 4242, output: [null, LEAKY, `ERROR:  ${SENTINEL}`], stdout: LEAKY, stderr: `ERROR:  ${SENTINEL}\nQUERY:  ${SQL}`, ...fields },
);

const WATCHED_KEYS = ['message', 'stack', 'name', 'cause', 'code', 'status', 'signal', 'pid', 'output', 'stdout', 'stderr', 'errors', 'constructor', 'toString', 'valueOf', 'toJSON', 'then', 'length', Symbol.toPrimitive, Symbol.toStringTag, Symbol.iterator, inspect.custom];

/** A value that records every read: a getter for each field or conversion a reader might touch, each throwing the sentinel. */
function watchedGetters(touched, prototype) {
  const value = Object.create(prototype);
  for (const key of WATCHED_KEYS) {
    Object.defineProperty(value, key, { enumerable: true, get() { touched.push(String(key)); throw new Error(`${SENTINEL} ${SQL}`); } });
  }
  return value;
}

/** A proxy whose handler records every trap looked up, so any operation on it is seen, then throws the sentinel. */
function watchedProxy(touched, target) {
  const traps = new Proxy({}, { get: (_, trap) => { touched.push(`trap ${String(trap)}`); return () => { throw new Error(`${SENTINEL} ${SQL}`); }; } });
  return new Proxy(target, traps);
}

test('a successful run gives the parsed projection object, unchanged, after exactly one call with no arguments', () => {
  for (const [index, output] of [PRINTED, `${PRINTED}\n`, ` \n${PRINTED}\n\n`].entries()) {
    const calls = [];
    const value = readProjectionResult((...received) => { calls.push(received); return output; });
    assert.deepEqual(value, PROJECTION, `output ${index}: the projection object`);
    assert.deepEqual(calls, [[]], `output ${index}: one call with no arguments`);
  }
  assert.deepEqual(readProjectionResult(() => '{}'), {}, 'an empty object is still an object');
  assert.deepEqual(readProjectionResult(() => LEAKY), { ...PROJECTION, note: SENTINEL }, 'a successful value is returned as printed, not filtered: the suite owns its data');
  assert.equal(readProjectionResult(() => PRINTED) === readProjectionResult(() => PRINTED), false, 'each read parses afresh; nothing is cached or shared');
});

test('without a callback nothing is run and one fixed refusal is raised: the helper has no real default', () => {
  refusal(() => readProjectionResult(), NO_RUN, 'no argument');
  const values = [undefined, null, 'docker', SQL, 42, 4242n, true, {}, [], Symbol(SENTINEL), new Error(SENTINEL)];
  for (const [index, run] of values.entries()) refusal(() => readProjectionResult(run), NO_RUN, `non-callback ${index}`);
  const touched = [];
  refusal(() => readProjectionResult(watchedProxy(touched, {})), NO_RUN, 'a watched non-callable proxy');
  assert.deepEqual(touched, [], 'a non-callback is never read');
});

test('a failed command raises one new fixed error that shows no message, stack, cause, field or output of what it threw', () => {
  const thrown = [
    ['a failed query, psql output a string', commandError()],
    ['a failed query, its arguments holding the SQL', commandError({ spawnargs: ['exec', 'synthetic-container', 'psql', '-c', SQL] })],
    ['a timed-out query', commandError({ code: 'ETIMEDOUT', status: null, signal: 'SIGTERM' })],
    ['docker that could not start', Object.assign(new Error(`spawnSync docker ENOENT ${SENTINEL}`), { errno: -2, code: 'ENOENT', syscall: 'spawnSync docker', path: 'docker', spawnargs: ['exec', 'synthetic-container', 'psql', '-c', SQL], stdout: null, stderr: null })],
    ['an AggregateError around a failed query', new AggregateError([commandError()], `${SENTINEL} ${SQL}`)],
    ['a SyntaxError carrying the sentinel', new SyntaxError(`Unexpected token in JSON at position 0: ${SENTINEL}`)],
    ['a plain object with output and string forms', { message: SENTINEL, stdout: LEAKY, output: [null, LEAKY, SQL], toString: () => SENTINEL, toJSON: () => SQL }],
  ];
  const errors = thrown.map(([label, value]) => failure(value, label));
  assert.equal(new Set(errors).size, errors.length, 'every failure raises a new error, never a shared one');
});

test('a thrown primitive gives the same fixed error and shows nothing of the value', () => {
  const primitives = [SENTINEL, SQL, LEAKY, '', undefined, null, 0, true, 4242n, Symbol(SENTINEL)];
  for (const [index, value] of primitives.entries()) failure(value, `thrown primitive ${index}`);
});

test('the thrown value is never read: poisoned message, stack, stdout, stderr, output and cause getters and watched proxies see no access', () => {
  const cases = [
    ['getters on every field of an Error', (touched) => watchedGetters(touched, Error.prototype)],
    ['getters on every field of a plain object', (touched) => watchedGetters(touched, Object.prototype)],
    ['a proxy over an empty object', (touched) => watchedProxy(touched, {})],
    ['a proxy over a failed-query error', (touched) => watchedProxy(touched, commandError())],
  ];
  for (const [label, build] of cases) {
    const touched = [];
    failure(build(touched), label);
    assert.deepEqual(touched, [], `${label}: nothing read the thrown value`);
  }
});

test('the callback is never retried: a first failure stays a failure even when a second call would succeed', () => {
  let count = 0;
  refusal(() => readProjectionResult(() => { count += 1; if (count === 1) throw commandError(); return PRINTED; }), FAILED, 'a failure that would pass on retry');
  assert.equal(count, 1, 'one call after a failed command');
  count = 0;
  refusal(() => readProjectionResult(() => { count += 1; return count === 1 ? LEAKY.slice(0, -1) : PRINTED; }), NOT_JSON, 'bad output that would pass on retry');
  assert.equal(count, 1, 'one call after bad output');
});

test('output that is not JSON gets one fixed parse refusal that shows none of it, and the parse error is never shown', () => {
  const malformed = [
    ['the sentinel unquoted where the parse fails', `{"changes":[],"note":${SENTINEL}}`],
    ['a bare sentinel', SENTINEL],
    ['an error line on stdout', `ERROR:  ${SENTINEL}\nQUERY:  ${SQL}`],
    ['projection output cut short', LEAKY.slice(0, -1)],
    ['two result rows', `${LEAKY}\n${LEAKY}\n`],
    ['a trailing comma after the sentinel', `{"note":"${SENTINEL}",}`],
    ['nothing printed, as for a SQL null', ''],
    ['a blank line', '\n'],
  ];
  for (const [label, output] of malformed) refusedOutput(output, NOT_JSON, label);
});

test('output that is not a string is refused as not JSON without being converted, awaited or read', () => {
  const values = [undefined, null, 42, true, 4242n, Symbol(SENTINEL), new TextEncoder().encode(LEAKY), Promise.resolve(LEAKY), { toString: () => LEAKY }];
  for (const [index, output] of values.entries()) refusedOutput(output, NOT_JSON, `non-string output ${index}`);
  const watched = [
    ['getters on every field', (touched) => watchedGetters(touched, Object.prototype)],
    ['a proxy over an empty object', (touched) => watchedProxy(touched, {})],
  ];
  for (const [label, build] of watched) {
    const touched = [];
    refusedOutput(build(touched), NOT_JSON, `watched output, ${label}`);
    assert.deepEqual(touched, [], `${label}: the output was never read or converted`);
  }
});

test('JSON that is not an object gets one fixed shape refusal: null, arrays and bare values', () => {
  const shapes = [
    ['null', 'null'],
    ['null with the newline psql prints', 'null\n'],
    ['an empty array', '[]'],
    ['an array holding the projection', `[${LEAKY}]`],
    ['a number', '42'],
    ['a string holding the sentinel', JSON.stringify(SENTINEL)],
    ['true', 'true'],
    ['false', 'false'],
    ['an empty string value', '""'],
  ];
  for (const [label, output] of shapes) refusedOutput(output, NOT_OBJECT, label);
});

test('the helper exports readProjectionResult alone, and its four refusals are distinct fixed texts that quote nothing', () => {
  assert.deepEqual(Object.keys(projectionOutput), ['readProjectionResult']);
  assert.equal(new Set(Object.values(MESSAGES)).size, 4, 'each refusal says which step failed');
  for (const message of Object.values(MESSAGES)) {
    assert.doesNotMatch(message, RAW, 'no query text or output in a fixed message');
    assert.doesNotMatch(message, ORIGINAL_DETAIL, 'no original error detail in a fixed message');
  }
});

const CONSUMER = 'verify-freeze-projection.mjs';
const CONSUMER_HEAD = Object.freeze([
  "import assert from 'node:assert/strict';",
  "import { execFileSync } from 'node:child_process';",
  "import { randomUUID } from 'node:crypto';",
  "import { readProjectionResult } from './projection-output.mjs';",
]);
const PROJECT_HEADER = "function project(t, f, mode, returns = null, shift = true, today = '2026-10-19') {";
const PROJECT_ARGS = "  const args = [`$terms$${JSON.stringify(t)}$terms$::jsonb`, `$freezes$${JSON.stringify(f)}$freezes$::jsonb`, `'${id}'::uuid`, `'${freeze}'::uuid`, `'${mode}'`, returns ? `'${returns}'::date` : 'null::date', `'${today}'::date`, shift ? 'true' : 'false'];";
const PROJECT_CALL = "  return readProjectionResult(() => execFileSync('docker', ['exec', 'supabase_db_fitlog_rebuild_20261017', 'psql', '-U', 'postgres', '-d', 'postgres', '-At', '-v', 'ON_ERROR_STOP=1', '-c', `select private.freeze_projection(${args.join(',')})`], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }));";

test('the consumer reads the projection through the helper alone, with its command, arguments, SQL, options and checks unchanged (read as text, never imported)', () => {
  const source = read(CONSUMER);
  const lines = source.split('\n');
  assert.deepEqual(lines.slice(0, 4), CONSUMER_HEAD, 'the existing imports in their order, then the helper');
  assert.deepEqual(specifiersOf(source), ['node:assert/strict', 'node:child_process', 'node:crypto', './projection-output.mjs'], 'nothing else is loaded');
  const header = lines.indexOf(PROJECT_HEADER);
  assert.notEqual(header, -1, 'project keeps its signature and defaults');
  assert.deepEqual(lines.slice(header, header + 4), [PROJECT_HEADER, PROJECT_ARGS, PROJECT_CALL, '}'], 'the SQL arguments and the exact docker call are kept; only the parse is replaced');
  assert.deepEqual(lines.filter((line) => line.includes('execFileSync')), [CONSUMER_HEAD[1], PROJECT_CALL], 'the real command is named once, inside the callback');
  assert.equal(occurrences(source, 'readProjectionResult('), 1, 'one guarded read');
  assert.doesNotMatch(source, /JSON\.parse/, 'no unguarded parse remains');
  assert.equal(occurrences(source, 'supabase_db_fitlog_rebuild_20261017'), 1, 'the target is unchanged and no targeting is added');
  assert.equal(occurrences(source, 'project('), 10, 'the definition and its nine calls are kept');
  assert.equal(occurrences(source, 'assert.equal('), 13, 'every equality check is kept');
  assert.equal(occurrences(source, 'assert.throws('), 4, 'every rejection check is kept');
  assert.doesNotMatch(source, /\bcatch\b|\bspawn|\bfetch\b|readFile|writeFile/, 'no new catch, child call, network or file access');
});
