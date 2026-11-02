import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { inspect } from 'node:util';
import { parseStatusOutput } from './status-output.mjs';

// The wrapper that runs `supabase status -o json` for the three integration suites and passes what it printed to the
// guarded parse (QA-9 phase 3N gap G5, fix F4). Every run here is an injected fake: nothing here starts a child process,
// reads a real status or reaches Docker, a database or the network. The wrapper's source is checked before it is loaded,
// so a change that would run the real command on import fails here instead of running it. The three suites are read as
// text and never imported, because importing one runs it against the local stack.

const read = (name) => readFileSync(new URL(name, import.meta.url), 'utf8');
const occurrences = (text, part) => text.split(part).length - 1;
const CHILD_IMPORT = "import { execFileSync } from 'node:child_process';";
const DEFAULT_RUN = 'export function readLocalStatus(run = execFileSync) {';
const RUN_CALL = "run('pnpm', ['exec', 'supabase', 'status', '-o', 'json'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })";
const STATUS_COMMAND = ['pnpm', ['exec', 'supabase', 'status', '-o', 'json'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }];

/**
 * Throws unless the wrapper can reach the real command only through a call of readLocalStatus with no run: the real
 * command is named once, as run's default; run is called once, inside a helper that only readLocalStatus calls; and the
 * module never calls readLocalStatus or loads anything else. Checked on the source text, before the module is loaded.
 */
function assertRunsNothingOnImport(source) {
  const lines = source.split('\n');
  const specifiers = [...source.matchAll(/\bfrom\s*['"]([^'"]+)['"]|\bimport\s*\(\s*['"]([^'"]+)['"]|^\s*import\s*['"]([^'"]+)['"]/gm)].map((match) => match[1] ?? match[2] ?? match[3]);
  assert.deepEqual(specifiers, ['node:child_process', './status-output.mjs'], 'the wrapper loads the child call and the parse helper, nothing else');
  assert.deepEqual(lines.filter((line) => line.includes('execFileSync')), [CHILD_IMPORT, DEFAULT_RUN], 'the real command is named only as the default of run');
  assert.equal(occurrences(source, 'readLocalStatus'), 1, 'the wrapper never calls itself');
  assert.equal(occurrences(source, 'run('), 1, 'run is called in one place');
  assert.equal(occurrences(source, RUN_CALL), 1, 'with the exact status command and options');
  assert.deepEqual(lines.filter((line) => line.includes('capturedOrFailed')).map((line) => line.trim()), ['function capturedOrFailed(run) {', 'const output = capturedOrFailed(run);'], 'the command runs only from inside readLocalStatus');
  assert.doesNotMatch(source, /\b(?:process|console|globalThis|eval|Function)\b|\brequire\s*\(|\bfetch\b|\bspawn|\bexec(?:Sync)?\s*\(|\bfork\s*\(|readFile|writeFile|\bimport\s*\(/, 'nothing else that could run or load anything');
}

assertRunsNothingOnImport(read('status-command.mjs'));
const statusCommand = await import('./status-command.mjs');
const { readLocalStatus } = statusCommand;

/** Every call here passes a fake run, so run's default, the real command, is never used. */
function readWith(run) {
  assert.equal(typeof run, 'function', 'a test must pass a fake run');
  return readLocalStatus(run);
}

// Credential-shaped synthetic values, assembled from parts so no literal appears in any file. They are not keys.
const SECRET = ['sb', 'secret', 'statuscommand-synthetic-must-never-print-0003'].join('_');
const PUBLISHABLE = ['sb', 'publishable', 'statuscommand-synthetic-must-never-print-0004'].join('_');
const SENTINEL = ['statuscommand', 'credential', 'sentinel', 'must-never-print-0005'].join('-');
const LOOPBACK = 'http://127.0.0.1:55321';
const FAILED = 'supabase status -o json failed; its error and output are not shown because they can hold keys';
const NOT_JSON = 'supabase status -o json did not print JSON; its output is not shown because it holds keys';
const NOT_OBJECT = 'supabase status -o json did not print a JSON object; its output is not shown because it holds keys';
// What a thrown value would show if any part of it got through: the failed command line, the start failure, one of its
// fields as `name: value`, or a cause or inner errors under inspection.
const ORIGINAL_DETAIL = /Command failed|spawnSync|ENOENT|ETIMEDOUT|\b(?:stdout|stderr|output|status|signal|pid|errno|syscall|spawnargs|cause|errors)\s*:|\[cause\]|\[errors\]/;
const statusJson = (fields = {}) => JSON.stringify({ API_URL: LOOPBACK, PUBLISHABLE_KEY: PUBLISHABLE, SECRET_KEY: SECRET, ...fields });

/** An error shaped like the one a failed status command throws, with synthetic keys in its message, stack, cause and fields. */
const commandError = (stdout, fields = {}) => Object.assign(
  new Error(`Command failed: pnpm exec supabase status -o json\n${SECRET}`, { cause: new Error(`${SENTINEL} ${PUBLISHABLE}`) }),
  { stack: `Error: Command failed ${SECRET}\n    at ${SENTINEL} (file:///${PUBLISHABLE}.mjs:1:1)`, status: 1, signal: null, pid: 4242, output: [null, stdout, `${SENTINEL}`], stdout, stderr: `${SECRET} ${SENTINEL}`, ...fields },
);

/**
 * The error `action` throws, after checking every way it can be shown: its message, its string form, its stack, a full
 * inspection, JSON with and without its hidden fields, and a structured clone. None may hold a synthetic key or the
 * sentinel, a key name, a URL or any detail of a thrown value, and the error has no field but its fixed message.
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
    for (const part of [SECRET, PUBLISHABLE, SENTINEL]) assert.equal(form.includes(part), false, `${label}: a synthetic value is shown`);
    assert.doesNotMatch(form, /sb_(?:secret|publishable)_|must-never-print/, `${label}: part of a synthetic value is shown`);
    assert.doesNotMatch(form, /API_URL|SECRET_KEY|PUBLISHABLE_KEY|127\.0\.0\.1|localhost/, `${label}: a key name or a URL is shown`);
    assert.doesNotMatch(form, ORIGINAL_DETAIL, `${label}: a detail of the thrown value is shown`);
  }
  return caught;
}

/** The error readLocalStatus throws when its run throws `thrown`: the fixed refusal, after one exact call, never `thrown`. */
function failure(thrown, label) {
  const calls = [];
  const caught = refusal(() => readWith((...received) => { calls.push(received); throw thrown; }), FAILED, label);
  assert.deepEqual(calls, [STATUS_COMMAND], `${label}: one call of the exact command, never retried`);
  assert.notEqual(caught, thrown, `${label}: a new error, not the thrown value`);
  return caught;
}

test('a successful run gives the parsed object, from a string or a Buffer, after one call of the exact command and options', () => {
  const expected = { API_URL: LOOPBACK, PUBLISHABLE_KEY: PUBLISHABLE, SECRET_KEY: SECRET };
  const outputs = [statusJson(), `${statusJson()}\n`, Buffer.from(`${statusJson()}\n`, 'utf8')];
  for (const [index, output] of outputs.entries()) {
    const calls = [];
    const value = readWith((...received) => { calls.push(received); return output; });
    assert.deepEqual(value, expected, `output ${index}: the status object`);
    assert.deepEqual(calls, [STATUS_COMMAND], `output ${index}: one call, with the command, arguments and options the suites ran, nothing added`);
  }
});

test("a successful run's output goes to parseStatusOutput unchanged: the helper's value, or its own fixed refusal", () => {
  const values = [statusJson(), JSON.stringify({ API_URL: 'http://localhost:55321' }), '{}'];
  for (const [index, output] of values.entries()) {
    assert.deepEqual(readWith(() => output), parseStatusOutput(output), `value ${index}: the helper's value, not rewritten; each suite still asserts its target`);
  }
  const refused = [
    [statusJson().slice(0, -1), NOT_JSON], // cut before its closing brace
    [`{"API_URL":"${LOOPBACK}","SECRET_KEY":${SECRET}}`, NOT_JSON], // the secret unquoted, right at the failing position
    [Buffer.from(`Starting the CLI\n${statusJson()}`, 'utf8'), NOT_JSON], // a notice line before the object
    [undefined, NOT_JSON], // a run that returned nothing
    [`[${statusJson()}]`, NOT_OBJECT], // an array, not an object
    [JSON.stringify(SECRET), NOT_OBJECT], // a bare string
  ];
  for (const [index, [output, expected]] of refused.entries()) {
    refusal(() => readWith(() => output), expected, `refused ${index}: the helper's refusal, not the run-failure message`);
  }
});

test('a failed command throws one new fixed error that shows no message, stack, cause or field of the error it threw', () => {
  const thrown = [
    ['a failed command, its output a string', commandError(statusJson())],
    ['a failed command, its output a Buffer', commandError(Buffer.from(statusJson(), 'utf8'))],
    ['a timed-out command', commandError(statusJson(), { code: 'ETIMEDOUT', status: null, signal: 'SIGTERM' })],
    ['a command that could not start', Object.assign(new Error(`spawnSync pnpm ENOENT ${SENTINEL}`), { errno: -2, code: 'ENOENT', syscall: 'spawnSync pnpm', path: SECRET, spawnargs: ['exec', 'supabase', 'status', '-o', 'json', SECRET], stdout: null, stderr: null })],
    ['an AggregateError around a failed command', new AggregateError([commandError(statusJson())], `${SENTINEL} ${SECRET}`)],
    ['a plain object with output and string forms', { message: SECRET, stdout: statusJson(), output: [null, statusJson(), null], toString: () => SECRET, toJSON: () => SECRET }],
    ['a Buffer of status output', Buffer.from(statusJson(), 'utf8')],
  ];
  const errors = thrown.map(([label, value]) => failure(value, label));
  assert.equal(new Set(errors).size, errors.length, 'every failure throws a new error, never a shared one');
});

test('a thrown primitive gives the same fixed error and shows nothing of the value', () => {
  const primitives = [SECRET, SENTINEL, statusJson(), '', undefined, null, 0, 55321, true, 4242n, Symbol(SECRET)];
  for (const [index, value] of primitives.entries()) failure(value, `thrown primitive ${index}`);
});

/** A thrown value that records every read: a getter for each field or conversion a wrapper might touch, each throwing keys. */
function watchedGetters(touched) {
  const keys = ['message', 'stack', 'name', 'cause', 'code', 'status', 'signal', 'pid', 'output', 'stdout', 'stderr', 'errors', 'constructor', 'toString', 'valueOf', 'toJSON', 'then', Symbol.toPrimitive, Symbol.toStringTag, inspect.custom];
  const value = Object.create(Error.prototype);
  for (const key of keys) {
    Object.defineProperty(value, key, { enumerable: true, get() { touched.push(String(key)); throw new Error(`${SECRET} ${SENTINEL}`); } });
  }
  return value;
}

/** A proxy whose handler records every trap looked up, so any operation on it is seen, then throws keys. */
function watchedProxy(touched, target) {
  const traps = new Proxy({}, { get: (_, trap) => { touched.push(`trap ${String(trap)}`); return () => { throw new Error(`${SECRET} ${SENTINEL}`); }; } });
  return new Proxy(target, traps);
}

test('the thrown value is never read: getters on every field and proxies that watch every trap see no access', () => {
  const cases = [
    ['getters on every field', (touched) => watchedGetters(touched)],
    ['a proxy over an empty object', (touched) => watchedProxy(touched, {})],
    ['a proxy over a failed-command error', (touched) => watchedProxy(touched, commandError(statusJson()))],
  ];
  for (const [label, build] of cases) {
    const touched = [];
    failure(build(touched), label);
    assert.deepEqual(touched, [], `${label}: nothing read the thrown value`);
  }
});

test('the wrapper exports readLocalStatus alone, binds no caught value, and parses through the helper after its catch', () => {
  assert.deepEqual(Object.keys(statusCommand), ['readLocalStatus']);
  const source = read('status-command.mjs');
  assert.equal(occurrences(source, 'catch {'), 1, 'one catch, and it binds nothing');
  assert.doesNotMatch(source, /catch\s*\(/, 'no catch binds the thrown value');
  assert.doesNotMatch(source, /\.(?:cause|stdout|stderr|output|message|stack|status|code)\b/, 'the wrapper reads no field of anything thrown');
  assert.equal(occurrences(source, 'throw new Error(FAILED);'), 1, 'the run failure throws the fixed message alone, with no cause');
  assert.equal(occurrences(source, 'parseStatusOutput('), 1, 'one parse, through the helper');
  assert.equal(source.split('\n').filter((line) => line.trim() === 'return parseStatusOutput(output);').length, 1, "what the command printed goes straight to the helper");
  assert.ok(source.indexOf('return parseStatusOutput(output);') > source.indexOf('catch {'), 'the parse sits outside the catch, so its refusals are kept');
  assert.doesNotMatch(source, /JSON\.parse/, 'no unguarded parse');
});

const WRAPPER_IMPORT = "import { readLocalStatus } from './status-command.mjs';";
const SUITES = Object.freeze([
  { file: 'verify.mjs', name: 'status', check: "assert.equal(status.API_URL, 'http://127.0.0.1:55321', 'Refusing to run against any other backend');" },
  { file: 'verify-gym.mjs', name: 'config', check: "assert.equal(config.API_URL, 'http://127.0.0.1:55321', 'Tests only run on the isolated local stack');" },
  { file: 'verify-freezes.mjs', name: 'config', check: "assert.equal(config.API_URL, 'http://127.0.0.1:55321', 'Tests only run on the isolated local stack');" },
]);

test('all three suites read status through the wrapper alone: the direct command and its imports are gone, and the loopback assertion follows unchanged (read as text, never imported)', () => {
  for (const { file, name, check } of SUITES) {
    const source = read(file);
    const lines = source.split('\n');
    assert.equal(lines.filter((line) => line === WRAPPER_IMPORT).length, 1, `${file}: imports the wrapper once`);
    const call = lines.indexOf(`const ${name} = readLocalStatus();`);
    assert.notEqual(call, -1, `${file}: reads status through the wrapper, which runs the real command by default`);
    assert.equal(lines[call + 1], check, `${file}: the loopback assertion follows at once, unchanged`);
    assert.equal(occurrences(source, check), 1, `${file}: one loopback assertion`);
    assert.equal(occurrences(source, 'readLocalStatus('), 1, `${file}: status is read once`);
    assert.doesNotMatch(source, /node:child_process|execFileSync|\bspawn|'supabase', 'status'/, `${file}: the direct status command and its child import are removed`);
    assert.doesNotMatch(source, /parseStatusOutput|status-output\.mjs/, `${file}: the now-unused parse import is removed; the wrapper parses`);
  }
});
