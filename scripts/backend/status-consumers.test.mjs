import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

// The two local consumers of `supabase status -o json` outside the integration suites (QA-9 phase 3N gap G5; the MB-1
// residual named in docs/evidence/MB-1/harness-command-failure-accepted-2026-11-01.md): environment.mjs, which writes the
// mobile app's private local config, and preview-account.mjs, which creates a synthetic local account. Each ran the status
// command and parsed its output inline, so a failed command or bad output could throw an error that quotes keys (PRD 22.1:
// never log tokens). Each now reads status only through readLocalStatus in status-command.mjs, whose fixed refusals
// status-command.test.mjs and status-output.test.mjs already cover; this file does not test the wrapper again. It proves
// the change is that substitution and nothing more, apart from one later, separately assigned correction in
// preview-account.mjs (docs/evidence/MB-1/harness-preview-response-2026-11-01.md), pinned below as text: its two response
// reads go through the guarded helper preview-response.mjs, which preview-response.test.mjs covers. Both consumers have
// real side effects, so they are read here as text and never loaded or run. Nothing here starts a process, reads a real
// status or credential, or reaches the network.

const read = (name) => readFileSync(new URL(name, import.meta.url), 'utf8');
const occurrences = (text, part) => text.split(part).length - 1;
const lineCount = (lines, wanted) => lines.filter((line) => line === wanted).length;
/** The specifier of every whole-line static import, in order. */
const staticImports = (source) => [...source.matchAll(/^import\s.*\sfrom\s'([^']+)';$/gm)].map((match) => match[1]);

const CHILD_IMPORT = "import { execFileSync } from 'node:child_process';";
const INLINE_STATUS = "const status = JSON.parse(execFileSync('pnpm', ['exec', 'supabase', 'status', '-o', 'json'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }));";
const WRAPPER_IMPORT = "import { readLocalStatus } from './status-command.mjs';";
const WRAPPER_STATUS = 'const status = readLocalStatus();';
// The only two edits allowed, each in place: the child import becomes the wrapper import, the inline parse one wrapper call.
const SUBSTITUTIONS = new Map([[CHILD_IMPORT, WRAPPER_IMPORT], [INLINE_STATUS, WRAPPER_STATUS]]);
const LOOPBACK_CHECK = "status.API_URL !== 'http://127.0.0.1:55321'";

const ENVIRONMENT_GUARD = "if (status.API_URL !== 'http://127.0.0.1:55321' || !status.PUBLISHABLE_KEY?.startsWith('sb_publishable_')) throw new Error('Expected this rebuild’s isolated local stack');";
const PREVIEW_GUARD = "if (status.API_URL !== 'http://127.0.0.1:55321') throw new Error('Local rebuild only');";

// The later correction, preview-account.mjs only (QA-9 G5 residual; PRD 22.1): its two inline response parses become
// calls of the guarded helper, whose import follows the wrapper import, and the create refusal moves into that helper
// with its message unchanged. Each key is a line after the status substitutions; its value is the lines that replace it.
const RESPONSE_IMPORT = "import { readCreatedAccount, readLoginSession } from './preview-response.mjs';";
const CREATE_REFUSAL = "if (!response.ok) throw new Error('Could not create local preview account');";
const CREATE_PARSE = 'const user = await response.json();';
const LOGIN_PARSE = 'const session = await login.json();';
const CREATE_READ = 'const user = await readCreatedAccount(response);';
const LOGIN_READ = 'const session = await readLoginSession(login);';
const RESPONSE_EDITS = new Map([[WRAPPER_IMPORT, [WRAPPER_IMPORT, RESPONSE_IMPORT]], [CREATE_REFUSAL, []], [CREATE_PARSE, [CREATE_READ]], [LOGIN_PARSE, [LOGIN_READ]]]);
// A consumer with no later correction: the status substitution alone.
const NO_EDITS = new Map();
const STATUS_REMOVED = [CHILD_IMPORT, INLINE_STATUS];
const STATUS_ADDED = [WRAPPER_IMPORT, WRAPPER_STATUS];
/** A consumer's expected lines: its before-source with the two status substitutions in place, then its response edits. */
const expectedLines = (before, edits) => before.map((line) => SUBSTITUTIONS.get(line) ?? line).flatMap((line) => edits.get(line) ?? [line]);

// Each consumer's source before this change, one string per line, as in the phase-before snapshot kept outside the
// repository. The last empty string is the file's closing line break.
const CONSUMERS = Object.freeze([
  {
    file: 'environment.mjs',
    imports: ['./status-command.mjs', 'node:fs'],
    guard: ENVIRONMENT_GUARD,
    checks: [LOOPBACK_CHECK, "!status.PUBLISHABLE_KEY?.startsWith('sb_publishable_')"],
    effects: ["writeFileSync('apps/mobile/.env.local',", '{ mode: 0o600 }', 'console.log('],
    before: Object.freeze([
      CHILD_IMPORT,
      "import { writeFileSync } from 'node:fs';",
      INLINE_STATUS,
      ENVIRONMENT_GUARD,
      "writeFileSync('apps/mobile/.env.local', `EXPO_PUBLIC_SUPABASE_URL=${status.API_URL}\\nEXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=${status.PUBLISHABLE_KEY}\\n`, { mode: 0o600 });",
      "console.log('Wrote the local mobile environment with a publishable key. Restart Expo after changing configuration.');",
      '',
    ]),
  },
  {
    file: 'preview-account.mjs',
    imports: ['node:crypto', './status-command.mjs', './preview-response.mjs', 'node:fs', 'node:os', 'node:path'],
    guard: PREVIEW_GUARD,
    checks: [LOOPBACK_CHECK],
    effects: ['randomUUID()', 'fetch(', 'apikey: status.SECRET_KEY', "writeFileSync(join(tmpdir(), 'fitlog-preview-account.json'),", '{ mode: 0o600 }', 'console.log('],
    edits: RESPONSE_EDITS,
    removed: [CHILD_IMPORT, INLINE_STATUS, CREATE_REFUSAL, CREATE_PARSE, LOGIN_PARSE],
    added: [WRAPPER_IMPORT, RESPONSE_IMPORT, WRAPPER_STATUS, CREATE_READ, LOGIN_READ],
    // Each response is read, and refused unless ok, before the next call: no sign-in after a failed create, no onboarding
    // after a failed sign-in, and no credential file before both succeed.
    sequence: ['const response = await fetch(', CREATE_READ, 'const login = await fetch(', LOGIN_READ, 'const profile = await fetch(', 'writeFileSync('],
    before: Object.freeze([
      "import { randomUUID } from 'node:crypto';",
      CHILD_IMPORT,
      "import { writeFileSync } from 'node:fs';",
      "import { tmpdir } from 'node:os';",
      "import { join } from 'node:path';",
      '',
      INLINE_STATUS,
      PREVIEW_GUARD,
      "const email = `preview-${randomUUID()}@example.invalid`; const password = randomUUID() + 'aA1!';",
      "const response = await fetch(status.API_URL + '/auth/v1/admin/users', { method: 'POST', headers: { apikey: status.SECRET_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, email_confirm: true }) });",
      "if (!response.ok) throw new Error('Could not create local preview account');",
      'const user = await response.json();',
      "const login = await fetch(status.API_URL + '/auth/v1/token?grant_type=password', { method: 'POST', headers: { apikey: status.PUBLISHABLE_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });",
      'const session = await login.json();',
      "const profile = await fetch(status.API_URL + '/rest/v1/rpc/complete_onboarding', { method: 'POST', headers: { apikey: status.PUBLISHABLE_KEY, Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ p_name: 'Local preview', p_dob: '1995-01-01', p_timezone: 'Asia/Kolkata', p_locale: 'en', p_terms: 'test-notice', p_privacy: 'test-notice' }) });",
      "if (!profile.ok) throw new Error('Could not initialize preview profile');",
      "writeFileSync(join(tmpdir(), 'fitlog-preview-account.json'), JSON.stringify({ email, password, id: user.id }), { mode: 0o600 });",
      "console.log('Created a synthetic local preview account. Credentials saved privately for browser testing.');",
      '',
    ]),
  },
]);

test('each consumer is its before-source with two lines replaced in place, the child import by the wrapper import and the inline status parse by one wrapper call, and nothing else but preview-account.mjs’s assigned response edits (read as text, never loaded)', () => {
  for (const { file, before, edits = NO_EDITS, removed = STATUS_REMOVED, added = STATUS_ADDED } of CONSUMERS) {
    assert.equal(lineCount(before, CHILD_IMPORT), 1, `${file}: the before-source held one child import`);
    assert.equal(lineCount(before, INLINE_STATUS), 1, `${file}: the before-source held one inline status parse`);
    const substituted = before.map((line) => SUBSTITUTIONS.get(line) ?? line);
    for (const key of edits.keys()) assert.equal(lineCount(substituted, key), 1, `${file}: each response edit replaces one line: ${key}`);
    const lines = read(file).split('\n');
    assert.deepEqual(lines, expectedLines(before, edits), `${file}: only those lines differ; every other byte, line and line break is kept`);
    assert.deepEqual(before.filter((line) => !lines.includes(line)), removed, `${file}: exactly these before-lines are gone`);
    assert.deepEqual(lines.filter((line) => !before.includes(line)), added, `${file}: exactly these lines are new`);
  }
});

test('each consumer reads status through the wrapper alone: one wrapper import, one call with no argument, and no child process, status command, JSON.parse or response .json() call of its own', () => {
  for (const { file, imports } of CONSUMERS) {
    const source = read(file);
    const lines = source.split('\n');
    assert.equal(lineCount(lines, WRAPPER_IMPORT), 1, `${file}: imports the wrapper once`);
    assert.equal(lineCount(lines, WRAPPER_STATUS), 1, `${file}: calls it once with no argument, so the wrapper runs its fixed status command`);
    assert.equal(occurrences(source, 'readLocalStatus('), 1, `${file}: status is read once`);
    assert.equal(occurrences(source, 'readLocalStatus'), 2, `${file}: named only in its import and its one call`);
    assert.deepEqual(staticImports(source), imports, `${file}: the child import is replaced by the wrapper import, which in preview-account.mjs the response helper import follows, the rest kept in order`);
    assert.equal(lines.filter((line) => /^\s*import\b/.test(line)).length, imports.length, `${file}: every import is a whole-line static import`);
    assert.doesNotMatch(source, /child_process|execFileSync|execSync|\bspawn|\bfork\s*\(|\bexec\s*\(/, `${file}: no direct child process remains`);
    assert.doesNotMatch(source, /JSON\.parse/, `${file}: no inline parse remains; the wrapper parses through the guarded helper`);
    assert.doesNotMatch(source, /\.json\s*\(/, `${file}: no inline response parse remains; preview-account.mjs reads both responses through preview-response.mjs`);
    assert.doesNotMatch(source, /'supabase', 'status'|supabase status/, `${file}: the status command is named only inside the wrapper`);
    assert.doesNotMatch(source, /parseStatusOutput|status-output\.mjs/, `${file}: the helper is reached only through the wrapper`);
    assert.doesNotMatch(source, /\bimport\s*\(|\brequire\s*\(/, `${file}: nothing is loaded at run time`);
  }
});

test('the existing exact guard follows the wrapper call at once, unchanged, nothing runs before it, and every side effect after it is the before-source byte for byte, apart from preview-account.mjs’s assigned response edits', () => {
  for (const { file, guard, checks, effects, before, edits = NO_EDITS, sequence = [] } of CONSUMERS) {
    for (const check of checks) assert.ok(guard.includes(check), `${file}: the pinned guard holds ${check}`);
    const source = read(file);
    const lines = source.split('\n');
    const call = lines.indexOf(WRAPPER_STATUS);
    assert.notEqual(call, -1, `${file}: reads status through the wrapper`);
    assert.deepEqual(lines.slice(0, call).filter((line) => line !== '' && !line.startsWith('import ')), [], `${file}: only imports come before the status read`);
    assert.equal(lines[call + 1], guard, `${file}: the guard follows the status read at once, unchanged`);
    assert.equal(occurrences(source, guard), 1, `${file}: one guard`);
    const body = lines.slice(call + 2);
    const expected = expectedLines(before, edits);
    assert.deepEqual(body, expected.slice(expected.indexOf(guard) + 1), `${file}: the side-effect body after the guard is unchanged, apart from the assigned response edits`);
    for (const effect of effects) {
      assert.ok(body.some((line) => line.includes(effect)), `${file}: ${effect} still happens after the guard`);
      assert.equal(lines.slice(0, call + 2).some((line) => line.includes(effect)), false, `${file}: ${effect} never happens before the guard`);
    }
    const positions = sequence.map((part) => body.findIndex((line) => line.includes(part)));
    assert.ok(positions.every((position, index) => position !== -1 && (index === 0 || position > positions[index - 1])), `${file}: in this order after the guard: ${sequence.join(' → ')}`);
  }
});

test('this file reads both consumers as text only: its sole imports are assert, fs and test, and it has no run-time load', () => {
  const own = readFileSync(new URL(import.meta.url), 'utf8');
  assert.deepEqual(staticImports(own), ['node:assert/strict', 'node:fs', 'node:test'], 'no consumer, child process, network or other module is imported');
  assert.equal(own.split('\n').filter((line) => /^\s*import\b/.test(line)).length, 3, 'every import is one of those three');
  assert.doesNotMatch(own, /\bimport\s*\(|\brequire\s*\(/, 'no consumer can be loaded at run time');
});
