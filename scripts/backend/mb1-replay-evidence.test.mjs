import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { REPO_ROOT } from './local-stack.mjs';
import {
  appliedMigrations, banNote, CANDIDATE, CANDIDATE_SHA256, classifyBan, diffResult, diffSnapshots, extractPreconditions, filterOutput, IDENTITY_CHECKS, imageProblems,
  judgeSuite, lintResult, M2_BAN_CLASSES, M2_CHECK, M2_UNKILLED, m2RunUnkilled, migrationListResult, mutationSql, P1_COLUMNS, parsePreconditions, preconditionProblems, PROFILE_READ_FAILURES,
  PROFILE_ROW_DETAIL, readOnlySqlProblems, redact, renderRun, secretHits, sha256, SNAPSHOT_RULES, snapshotVerdict,
} from './mb1-replay-evidence.mjs';

// Pure rules only: no command, file write, database or network. Secret-shaped values are injected on purpose, built at
// run time so no key-shaped literal sits in this file, and no test may see one come back out.
const b64url = (text) => Buffer.from(text).toString('base64url');
const FAKE = Object.freeze({
  secret: 'sb_secret_fixture-must-never-print-0001',
  publishable: 'sb_publishable_fixture-must-never-print-0002',
  jwt: `${b64url('{"alg":"HS256","typ":"JWT"}')}.${b64url('{"role":"service_role","fixture":true}')}.${b64url('fixture-signature')}`,
  jwtSecret: 'fixture-jwt-secret-with-at-least-thirty-two-characters',
  s3Access: 'fixture-s3-access-key-0003',
  s3Secret: 'fixture-s3-secret-key-0004',
  dbPassword: 'fixture-db-pw-0005',
});
const leaks = (text) => [...Object.values(FAKE).filter((value) => text.includes(value)), ...secretHits(text)];
const read = (rel) => readFileSync(join(REPO_ROOT, rel), 'utf8');
const MIGRATIONS = readdirSync(join(REPO_ROOT, 'supabase/migrations')).filter((name) => name.endsWith('.sql')).sort();
const BASE = MIGRATIONS.filter((name) => name !== CANDIDATE);
const md5 = (seed) => createHash('md5').update(seed).digest('hex');

// What `supabase start` prints at the end: the status block, which holds every key (review 39fe1fb5 finding 2).
const STATUS_BLOCK = [
  '         API URL: http://127.0.0.1:56421',
  `          DB URL: postgresql://postgres:${FAKE.dbPassword}@127.0.0.1:56422/postgres`,
  `      JWT secret: ${FAKE.jwtSecret}`,
  `  Publishable key: ${FAKE.publishable}`,
  `       Secret key: ${FAKE.secret}`,
  `   S3 Access Key: ${FAKE.s3Access}`,
  `   S3 Secret Key: ${FAKE.s3Secret}`,
  `        anon key: ${FAKE.jwt}`,
  `service_role key: ${FAKE.jwt}`,
  JSON.stringify({ API_URL: 'http://127.0.0.1:56421', SECRET_KEY: FAKE.secret, JWT_SECRET: FAKE.jwtSecret }),
];
const START_PROGRESS = ['Starting database...', 'Initialising schema...', 'Seeding globals from roles.sql...', ...BASE.map((name) => `Applying migration ${name}...`), 'Seeding data from supabase/seed.sql...', 'Seeding data from supabase/development-catalogue.sql...', 'Started supabase local development setup.'];
// AR-1's recorded CLI 2.121.0 output (docs/evidence/AR-1/replay-final-diff.log and replay-lint.log).
const AR1_DIFF = read('docs/evidence/AR-1/replay-final-diff.log');
const AR1_LINT = read('docs/evidence/AR-1/replay-lint.log');

test('start output keeps only allowlisted progress lines; the status block with every key is withheld', () => {
  const { lines, withheld } = filterOutput('start', [...START_PROGRESS, '', ...STATUS_BLOCK].join('\n'));
  assert.deepEqual(lines, START_PROGRESS);
  assert.equal(withheld, STATUS_BLOCK.length);
  const text = renderRun('pnpm exec supabase start', 'start', { status: 0, stdout: [...START_PROGRESS, ...STATUS_BLOCK].join('\n'), stderr: STATUS_BLOCK.join('\n') });
  assert.deepEqual(leaks(text), []);
  assert.match(text, /^# 20 line\(s\) withheld \(not on the start allowlist, or secret-shaped\)$/m);
  assert.match(text, /^# exit 0$/m);
  assert.deepEqual(appliedMigrations(text), BASE);
});

test('a failed command keeps redacted error lines only, and never a key, token or password', () => {
  const stderr = [
    `Error: failed to connect to postgres://postgres:${FAKE.dbPassword}@127.0.0.1:56422/postgres using ${FAKE.secret}`,
    `failed to verify token ${FAKE.jwt}`,
    `Error: JWT secret ${FAKE.jwtSecret} is too short`,
    `docker: some unlisted line with ${FAKE.publishable}`,
  ].join('\n');
  const text = renderRun('pnpm exec supabase stop', 'stop', { status: 1, stdout: STATUS_BLOCK.join('\n'), stderr });
  assert.deepEqual(leaks(text), []);
  assert.match(text, /^Error: failed to connect to postgres:\/\/postgres:\[redacted\]@127\.0\.0\.1:56422\/postgres using \[redacted key\]$/m);
  assert.match(text, /^failed to verify token \[redacted token\]$/m);
  assert.match(text, /^\[redacted line\]$/m);
  assert.match(text, /^# exit 1$/m);
  assert.equal(redact(`token ${FAKE.jwt} and ${FAKE.publishable}`), 'token [redacted token] and [redacted key]');
  const spawnError = renderRun('pnpm exec supabase stop', 'stop', { status: null, stdout: '', stderr: '', error: 'ETIMEDOUT' });
  // A timed-out or interrupted command may have run part of the way (review a102fb68 finding 5): never "did not run".
  assert.match(spawnError, /^# did not finish \(ETIMEDOUT\)$/m);
});

test('error lines are kept only when the command failed', () => {
  assert.deepEqual(filterOutput('lint', 'Error: something').lines, []);
  assert.deepEqual(filterOutput('lint', 'Error: something', { failed: true }).lines, ['Error: something']);
});

test('a JSON summary line is kept only with known keys, so a status object is never printed', () => {
  assert.deepEqual(filterOutput('start', JSON.stringify({ status: 'started', message: 'Started local database.' })).lines, ['{"status":"started","message":"Started local database."}']);
  assert.equal(filterOutput('start', JSON.stringify({ status: 'started', SECRET_KEY: FAKE.secret })).withheld, 1);
  assert.deepEqual(filterOutput('start', JSON.stringify({ status: 'started', message: FAKE.secret })).lines, ['{"status":"started","message":"[redacted key]"}']);
  assert.throws(() => filterOutput('status', 'API URL'), /No output allowlist for status/);
});

test('db diff and db lint are clean only when both the result line and the JSON say so (AR-1 output)', () => {
  assert.deepEqual(diffResult(AR1_DIFF), { clean: true, problems: [] });
  assert.deepEqual(lintResult(AR1_LINT), { clean: true, problems: [] });
  const changed = AR1_DIFF.replace('"diff":""', '"diff":"DROP TABLE public.x;"').replace('No schema changes found\n', '');
  assert.deepEqual(diffResult(changed).problems, ['no "No schema changes found" line', 'the diff JSON is not empty: diff 20 character(s), 0 drop statement(s)']);
  assert.deepEqual(diffResult('No schema changes found\n').problems, ['no diff JSON line']);
  assert.deepEqual(lintResult(AR1_LINT.replace('"results":[]', '"results":[{"level":"warning"}]')).problems, ['the lint JSON has 1 result(s)']);
  assert.ok(renderRun('pnpm exec supabase db diff', 'diff', { status: 0, stdout: AR1_DIFF, stderr: '' }).includes('No schema changes found'));
});

/* ---------------------------------------------------------------- migration list (F5) ---------------------------------- */

// `supabase migration list` as CLI 2.121.0 prints it, transcribed from the installed CLI's own bundled code
// (node_modules/@supabase/cli-darwin-arm64/bin/supabase, sha256 6e8be5fb…08dc, read as a file and never run; phase1e.md §2):
// POn wraps every cell in backticks, an empty cell as "` `"; Da pads each column to its widest cell, prints "  " and then
// " cell " joined by "|", a rule two dashes wider than each column, and an empty line, a "  " line and an empty line around
// the table; _me prints the time as YYYY-MM-DD HH:MM:SS. These rows are NOT live output: phase 2 attempt 2 withheld every
// live row, so only the header and rule lines were ever seen, and the first test below ties the transcription to them.
const listTime = (v) => `${v.slice(0, 4)}-${v.slice(4, 6)}-${v.slice(6, 8)} ${v.slice(8, 10)}:${v.slice(10, 12)}:${v.slice(12, 14)}`;
function cliTable(rows) {
  const cell = (value) => (value.length > 0 ? `\`${value}\`` : '` `');
  const body = rows.map(({ local, remote }) => [cell(local), cell(remote), `\`${listTime(remote || local)}\``]);
  const head = ['Local', 'Remote', 'Time (UTC)'];
  const widths = head.map((title, at) => Math.max(title.length, ...body.map((row) => row[at].length)));
  const line = (cells) => `  ${cells.map((value, at) => ` ${value.padEnd(widths[at])} `).join('|')}`;
  return ['', '  ', line(head), `  ${widths.map((width) => '-'.repeat(width + 2)).join('|')}`, ...body.map(line), ''].join('\n');
}
const VERSIONS = MIGRATIONS.map((file) => file.slice(0, 14));
const BASE_VERSIONS = BASE.map((file) => file.slice(0, 14));
const CANDIDATE_VERSION = CANDIDATE.slice(0, 14);
const both = (versions) => versions.map((version) => ({ local: version, remote: version }));
const listProblems = (text, { local = BASE_VERSIONS, applied = BASE_VERSIONS } = {}) => migrationListResult(text, { local, applied }).problems;

test('the transcribed 2.121.0 migration list prints exactly the header and rule lines the runner kept live', () => {
  const live = read('docs/evidence/MB-1/phase2-1-migrations.txt').split('\n');
  const table = cliTable(both(BASE_VERSIONS)).split('\n').map((line) => line.trimEnd());
  assert.equal(live[1], '   Local            | Remote           | Time (UTC)');
  assert.equal(table[2], live[1]);
  assert.equal(table[3], live[2]);
  assert.deepEqual(filterOutput('migrations', `${live[1]}\n${live[2]}\n`), { lines: [live[1], live[2]], withheld: 0 });
});

test('migration list rows as CLI 2.121.0 prints them are kept, and the list proves the manifest rows, local and remote', () => {
  const text = `${cliTable(both(BASE_VERSIONS))}Connecting to local database...\n`;
  const { lines, withheld } = filterOutput('migrations', text);
  assert.equal(withheld, 0);
  assert.equal(lines.length, 2 + BASE_VERSIONS.length + 1);
  assert.equal(lines[2], '   `20261017161031` | `20261017161031` | `2026-10-17 16:10:31`');
  assert.deepEqual(migrationListResult(text, { local: BASE_VERSIONS, applied: BASE_VERSIONS }), { ok: true, problems: [], rows: both(BASE_VERSIONS) });
  // After add-candidate: the candidate is a local file only; after migrate, local and remote.
  const added = cliTable([...both(BASE_VERSIONS), { local: CANDIDATE_VERSION, remote: '' }]);
  assert.ok(added.includes(`   \`${CANDIDATE_VERSION}\` | \` \`${' '.repeat(14)}| \`2026-10-26 04:00:45\``), added);
  assert.deepEqual(listProblems(added, { local: VERSIONS }), []);
  assert.deepEqual(listProblems(cliTable(both(VERSIONS)), { local: VERSIONS, applied: VERSIONS }), []);
  // Da's padding follows the widest cell: with only empty local cells that column is five wide ("Local").
  const narrow = cliTable([{ local: '', remote: BASE_VERSIONS[0] }]);
  assert.match(narrow, /^ {3}` ` {3}\| `20261017161031` \| `2026-10-17 16:10:31` $/m);
  assert.deepEqual(listProblems(narrow, { local: [], applied: [BASE_VERSIONS[0]] }), []);
});

test('an empty list, the pre-F5 row shape, box borders, malformed rows and secret-bearing lines stay withheld and fail', () => {
  const empty = cliTable([]);
  assert.deepEqual(filterOutput('migrations', empty), { lines: ['   Local | Remote | Time (UTC)', '  -------|--------|------------'], withheld: 0 });
  assert.deepEqual(listProblems(empty), ['no migration row was recognised, so the list proves nothing']);
  assert.deepEqual(listProblems(''), ['no migration row was recognised, so the list proves nothing']);
  // The hand-written fixture the runner was first built on (no backticks) and box-drawing borders: 2.121.0 cannot print
  // either (POn always wraps a cell; Da always joins with "|"), so neither is kept, and either fails the list.
  const old = '  Local          | Remote         | Time (UTC)\n  ---------------|----------------|---------------------\n  20261017161031 | 20261017161031 | 2026-10-17 16:10:31\n';
  assert.deepEqual(filterOutput('migrations', old), { lines: ['  Local          | Remote         | Time (UTC)', '  ---------------|----------------|---------------------'], withheld: 1 });
  assert.deepEqual(listProblems(old, { local: [BASE_VERSIONS[0]], applied: [BASE_VERSIONS[0]] }), ['no migration row was recognised, so the list proves nothing', '1 table-shaped line(s) were not recognised and stay withheld']);
  const table = cliTable(both(BASE_VERSIONS));
  const unreadable = [
    '   `20261017161031` │ `20261017161031` │ `2026-10-17 16:10:31`',
    '   `2026101716103` | `2026101716103` | `2026-10-17 16:10:3`',
    '   `20261017161031` | `20261017161031` | `2026-10-17 16:10:31` | `x`',
    '   20261017161031 | `20261017161031` | `2026-10-17 16:10:31`',
    `   \`20261017161031\` | ${FAKE.secret} | \`2026-10-17 16:10:31\``,
    `   \`20261017161031\` | \`20261017161031\` | postgresql://postgres:${FAKE.dbPassword}@127.0.0.1:56422/postgres`,
  ];
  for (const line of unreadable) {
    const text = `${table}${line}\n`;
    const kept = filterOutput('migrations', text);
    assert.equal(kept.withheld, 1, line);
    assert.deepEqual(kept.lines, filterOutput('migrations', table).lines, line);
    const problems = listProblems(text);
    assert.deepEqual(problems, ['1 table-shaped line(s) were not recognised and stay withheld'], line);
    assert.deepEqual(leaks(`${kept.lines.join('\n')}${problems.join('\n')}`), []);
  }
  // A secret-shaped line outside the table is withheld and counted; it is not a table line, so the rows still stand.
  const noisy = `${table}${FAKE.secret}\nservice_role key: ${FAKE.jwt}\n`;
  assert.equal(filterOutput('migrations', noisy).withheld, 2);
  assert.deepEqual(listProblems(noisy), []);
  const rendered = renderRun('node_modules/.bin/supabase migration list --local', 'migrations', { status: 0, stdout: noisy, stderr: `postgres://postgres:${FAKE.dbPassword}@127.0.0.1:56422\n` });
  assert.deepEqual(leaks(rendered), []);
  assert.match(rendered, /^# 3 line\(s\) withheld \(not on the migrations allowlist, or secret-shaped\)$/m);
});

test('the list must hold exactly the manifest versions, once each, in order, each local and remote as expected', () => {
  const swap = (rows, at, row) => rows.map((entry, index) => (index === at ? row : entry));
  const last = BASE_VERSIONS.at(-1);
  assert.deepEqual(listProblems(cliTable(both(BASE_VERSIONS.slice(1)))), ['the list has 14 row(s); the manifest expects 15', `${BASE_VERSIONS[0]} is missing`]);
  assert.deepEqual(listProblems(cliTable([...both(BASE_VERSIONS), { local: '', remote: CANDIDATE_VERSION }])), ['the list has 16 row(s); the manifest expects 15', `${CANDIDATE_VERSION} is listed remote only, but it is not in the manifest`]);
  assert.deepEqual(listProblems(cliTable(swap(both(BASE_VERSIONS), 14, { local: last, remote: '' }))), [`${last} is listed local only, expected local and remote`]);
  assert.deepEqual(listProblems(cliTable(both(VERSIONS)), { local: VERSIONS }), [`${CANDIDATE_VERSION} is listed local and remote, expected local only`]);
  assert.deepEqual(listProblems(cliTable([...both(BASE_VERSIONS), ...both(BASE_VERSIONS.slice(0, 1))])), ['the list has 16 row(s); the manifest expects 15', `${BASE_VERSIONS[0]} is listed 2 times`]);
  assert.deepEqual(listProblems(cliTable(both([BASE_VERSIONS[1], BASE_VERSIONS[0], ...BASE_VERSIONS.slice(2)]))), ['the rows are not in version order']);
  assert.deepEqual(listProblems(cliTable(both(BASE_VERSIONS)).replace('`2026-10-17 16:10:31`', '`2026-10-17 16:10:32`')), [`${BASE_VERSIONS[0]}'s time is not its version's timestamp`]);
  const paired = listProblems(cliTable(swap(both(BASE_VERSIONS), 0, { local: BASE_VERSIONS[0], remote: BASE_VERSIONS[1] })));
  assert.ok(paired.includes(`a row pairs local ${BASE_VERSIONS[0]} with remote ${BASE_VERSIONS[1]}`), paired.join('; '));
  assert.ok(listProblems(`${cliTable(both(BASE_VERSIONS))}   \` \` | \` \` | \`2026-10-17 16:10:31\`\n`).includes('a row lists no version'));
});

test('the 27 identity checks are exactly the ones verify-identity.mjs runs, in order, each name once', () => {
  const source = read('scripts/backend/verify-identity.mjs');
  const names = [...source.matchAll(/await check\((['"])(.*?)\1, async/g)].map((match) => match[2]);
  assert.deepEqual(names, IDENTITY_CHECKS);
  assert.equal(IDENTITY_CHECKS.length, 27);
  assert.equal(new Set(IDENTITY_CHECKS).size, 27);
  assert.ok(PROFILE_READ_FAILURES.every((name) => IDENTITY_CHECKS.includes(name)));
});

const BAN_LIVE = "# after the ban, GoTrue answers member C's session with HTTP 200";
const BAN_ENDED = `# after the ban, GoTrue answers member C's session with HTTP 403 ${JSON.stringify({ code: 'session_not_found', message: 'Session from session_id claim in JWT does not exist' })}`;
// Review bbe2fbba finding 2: under "ended" the ban ended member C's session, so M2 can never be credited.
const M2_ENDED = /^M2 has no sound expectation under the "ended" ban answer \(GoTrue session_not_found\): the ban ended member C's session, so the session clause of member_active\(\) refuses its read with or without the ban clause, and no M2 run can show the ban clause is needed; M2 stays refused on this replay \(review bbe2fbba finding 2\)$/;
// Review bbe2fbba finding 3: an expected failure whose detail line is not exactly the caller's own row.
const detailProblem = (name, detail) => `"${name}" failed with ${detail === null ? 'no detail line' : `"${detail}"`}, not "HTTP 200, 1 row(s)" (the caller's own row): a failure for another reason is not the expected one (review bbe2fbba finding 3)`;
/**
 * The suite's output: each failing check is followed by its detail line, `HTTP 200, 1 row(s)` unless `details` names another
 * (null: none). `ban` is the line printed before the banned check, or null for none.
 */
function suiteLog({ failing = [], ban = BAN_LIVE, drop = 0, extra = [], details = {} } = {}) {
  const lines = [];
  for (const name of IDENTITY_CHECKS.slice(0, IDENTITY_CHECKS.length - drop)) {
    if (name === 'a banned account reads no profile' && ban !== null) lines.push(ban);
    const detail = Object.hasOwn(details, name) ? details[name] : 'HTTP 200, 1 row(s)';
    lines.push(!failing.includes(name) ? `ok - ${name}` : detail === null ? `not ok - ${name}` : `not ok - ${name}\n  ${detail}`);
  }
  const failed = IDENTITY_CHECKS.filter((name) => failing.includes(name));
  lines.push('', failed.length ? `${failed.length} of 27 identity checks failed: ${failed.join('; ')}` : 'Local identity integration passed, 27 checks: profile ownership; GraphQL closed (tripwire).');
  return `${[...lines, ...extra].join('\n')}\n`;
}

test('RED holds only with exactly the five profile_read failures, exit 1, a known ban answer and the matching summary', () => {
  assert.deepEqual(judgeSuite(suiteLog({ failing: PROFILE_READ_FAILURES }), { expect: 'red', exitCode: 1 }), { ok: true, problems: [], ban: 'live', failures: PROFILE_READ_FAILURES });
  assert.deepEqual(judgeSuite(suiteLog(), { expect: 'green', exitCode: 0 }).problems, []);
  const extra = judgeSuite(suiteLog({ failing: [...PROFILE_READ_FAILURES, 'the revoking session stays live'] }), { expect: 'red', exitCode: 1 });
  assert.equal(extra.ok, false);
  assert.match(extra.problems.join('\n'), /expected not ok: .*; got: .*the revoking session stays live/);
  assert.match(judgeSuite(suiteLog({ failing: PROFILE_READ_FAILURES.slice(1) }), { expect: 'red', exitCode: 1 }).problems.join('\n'), /expected not ok/);
  assert.deepEqual(judgeSuite(suiteLog({ drop: 1 }), { expect: 'green', exitCode: 0 }).problems.slice(0, 1), ['expected the 27 identity checks in order, got 26 check line(s)']);
});

test('an exit code is never a verdict on its own: a 429 or any setup, cleanup or refusal line is not a kill', () => {
  const setup = judgeSuite('verify-identity setup failed: Fixture sign-in failed: HTTP 429\n', { expect: 'm1', exitCode: 1 });
  assert.equal(setup.ok, false);
  assert.deepEqual(setup.problems.slice(0, 2), ['expected the 27 identity checks in order, got 0 check line(s)', 'stop line: verify-identity setup failed: Fixture sign-in failed: HTTP 429']);
  for (const line of ['Fixture cleanup needs attention: account 1 (HTTP 500)', 'The checks passed, but fixture cleanup failed, so this run fails', 'verify-identity refused: supabase status failed (exit 1)', "SIGINT: removing this run's fixtures"]) {
    const verdict = judgeSuite(suiteLog({ failing: PROFILE_READ_FAILURES, extra: [line] }), { expect: 'm1', exitCode: 1 });
    assert.deepEqual(verdict.problems, [`stop line: ${line}`], line);
  }
  assert.deepEqual(judgeSuite(suiteLog({ failing: PROFILE_READ_FAILURES }), { expect: 'm1', exitCode: 0 }).problems, ['expected exit 1, got 0']);
  assert.deepEqual(judgeSuite(suiteLog({ extra: ['stray output'] }), { expect: 'green', exitCode: 0 }).problems, ['1 unexpected line(s) in the suite output']);
});

test("M2's expectation follows GoTrue's ban answer, which must match the reference run; any other answer stops", () => {
  assert.equal(classifyBan('HTTP 200'), 'live');
  assert.equal(classifyBan(BAN_ENDED.split(' with ')[1]), 'ended');
  assert.equal(classifyBan('HTTP 403 {"code":"bad_jwt","message":"invalid JWT"}'), null);
  assert.equal(classifyBan('HTTP 401 {"code":"session_not_found","message":null}'), null);
  assert.deepEqual(judgeSuite(suiteLog({ failing: ['a banned account reads no profile'] }), { expect: 'm2', exitCode: 1, ban: 'live' }).problems, []);
  // Review bbe2fbba finding 2: the zero-failure M2 under "ended" that phase 1F still passed (a narrowed claim) fails closed.
  // Review 2026-10-26T2000Z finding 1: its banned check passed in a complete run, so it is also the stop.
  const ended = judgeSuite(suiteLog({ ban: BAN_ENDED }), { expect: 'm2', exitCode: 0, ban: 'ended' });
  assert.equal(ended.ok, false);
  assert.equal(ended.problems.length, 2, ended.problems.join('\n'));
  assert.match(ended.problems[0], M2_ENDED);
  assert.equal(ended.problems[1], M2_UNKILLED);
  assert.deepEqual(judgeSuite(suiteLog({ ban: BAN_ENDED }), { expect: 'green', exitCode: 0, ban: 'live' }).problems, ['the ban answer is ended, but the reference run recorded live']);
  // Phase 1F: user_banned is now a class of its own ("banned", below), so the unknown answer here is another GoTrue code.
  // A complete 27-ok M2 run with an unrecognised answer is the M2 stop too (review 2026-10-26T2000Z finding 1).
  const unknown = judgeSuite(suiteLog({ ban: "# after the ban, GoTrue answers member C's session with HTTP 403 {\"code\":\"bad_jwt\"}" }), { expect: 'm2', exitCode: 0 });
  assert.deepEqual(unknown.problems, ['unrecognised ban answer "HTTP 403 {"code":"bad_jwt"}": stop and record it', 'M2 has no expectation without a recognised ban answer', M2_UNKILLED]);
  assert.throws(() => judgeSuite(suiteLog(), { expect: 'm4', exitCode: 0 }), /Unknown suite expectation m4/);
});

/* ---------------------------------------------------------------- F6: GoTrue's user_banned answer --------------------- */

// Phase 2 attempt 3 (phase2.md A3.3): after the ban, the replay's GoTrue answered member C's session with HTTP 403
// user_banned. That says the user is banned; it does not say whether the session row (auth.sessions) still exists, which is
// what tells the ban clause of member_active() from its session clause (phase1.md R7). So it is a class of its own,
// "banned": never "live", never "ended". Checks whose expectation does not depend on the class (RED, GREEN, M1, M3) keep
// their exact expectations; M2, whose expectation does depend on it, fails closed.
const BANNED_ANSWER = 'HTTP 403 {"code":"user_banned","message":"User is banned"}';
const BAN_BANNED = `# after the ban, GoTrue answers member C's session with ${BANNED_ANSWER}`;

test('F6: the recorded user_banned answer is the class "banned", distinct from live and ended; every other shape stays unknown', () => {
  // The exact answer attempt 3 recorded; the record itself stays as it ran: NOT met, with no reference answer.
  const recorded = read('docs/evidence/MB-1/phase2-2-red.txt');
  const answers = recorded.split('\n').map((line) => /^# after the ban, GoTrue answers member C's session with (.+)$/.exec(line)?.[1]).filter(Boolean);
  assert.deepEqual(answers, [BANNED_ANSWER]);
  assert.equal(classifyBan(answers[0]), 'banned');
  assert.match(recorded, /^# suite exit 1; GoTrue's answer after the ban: unrecognised$/m);
  assert.match(recorded, /^# verdict: the red expectation is NOT met$/m);
  assert.match(recorded, /^# mb1-replay suite: exit 1$/m);
  for (const [answer, expected] of [
    ['HTTP 200', 'live'],
    ['HTTP 403 {"code":"session_not_found","message":"Session from session_id claim in JWT does not exist"}', 'ended'],
    [BANNED_ANSWER, 'banned'],
    ['HTTP 403 {"code":"user_banned","message":null}', 'banned'],
    ['HTTP 403 {"code":"user_banned"}', 'banned'],
  ]) assert.equal(classifyBan(answer), expected, answer);
  for (const answer of [
    'HTTP 400 {"code":"user_banned","message":"User is banned"}', 'HTTP 401 {"code":"user_banned","message":"User is banned"}', 'HTTP 200 {"code":"user_banned"}',
    'HTTP 403 {"code":"USER_BANNED","message":"User is banned"}', 'HTTP 403 {"code":"user_banned_until"}', 'HTTP 403 {"code":" user_banned"}',
    'HTTP 403 {"code":null,"message":"User is banned"}', 'HTTP 403 {"message":"User is banned"}', 'HTTP 403 {"error_code":"user_banned"}',
    'HTTP 403 {"code":["user_banned"]}', 'HTTP 403 ["user_banned"]', 'HTTP 403 "user_banned"', 'HTTP 403 user_banned', 'HTTP 403 {"code":"user_banned"',
    'HTTP 403  {"code":"user_banned"}', 'HTTP 403 {"code":"user_banned"} ', 'HTTP 403 {"__proto__":{"code":"user_banned"}}', 'HTTP 403 {"code":"constructor"}',
    'HTTP 403 {"code":"toString"}', 'HTTP 403 {"code":"bad_jwt","message":"invalid JWT"}', 'HTTP 403 null', 'HTTP 2000', 'http 200', '', undefined, null,
  ]) assert.equal(classifyBan(answer), null, String(answer));
});

test('F6: under "banned", RED, GREEN, M1 and M3 keep their exact expectations, and the reference must match every way', () => {
  assert.deepEqual(judgeSuite(suiteLog({ failing: PROFILE_READ_FAILURES, ban: BAN_BANNED }), { expect: 'red', exitCode: 1 }), { ok: true, problems: [], ban: 'banned', failures: [...PROFILE_READ_FAILURES] });
  assert.deepEqual(judgeSuite(suiteLog({ failing: PROFILE_READ_FAILURES, ban: BAN_BANNED }), { expect: 'red', exitCode: 1, ban: 'banned' }).problems, []);
  // The class loosens nothing: one failure too many or too few, the wrong exit or a stray line still fails RED.
  assert.match(judgeSuite(suiteLog({ failing: [...PROFILE_READ_FAILURES, 'the revoking session stays live'], ban: BAN_BANNED }), { expect: 'red', exitCode: 1 }).problems.join('\n'), /expected not ok: /);
  assert.match(judgeSuite(suiteLog({ failing: PROFILE_READ_FAILURES.slice(1), ban: BAN_BANNED }), { expect: 'red', exitCode: 1 }).problems.join('\n'), /expected not ok: /);
  assert.deepEqual(judgeSuite(suiteLog({ failing: PROFILE_READ_FAILURES, ban: BAN_BANNED }), { expect: 'red', exitCode: 0 }).problems, ['expected exit 1, got 0']);
  assert.deepEqual(judgeSuite(suiteLog({ failing: PROFILE_READ_FAILURES, ban: BAN_BANNED, extra: ['stray output'] }), { expect: 'red', exitCode: 1 }).problems, ['1 unexpected line(s) in the suite output']);
  assert.deepEqual(judgeSuite(suiteLog({ ban: BAN_BANNED }), { expect: 'green', exitCode: 0, ban: 'banned' }).problems, []);
  assert.deepEqual(judgeSuite(suiteLog({ failing: PROFILE_READ_FAILURES, ban: BAN_BANNED }), { expect: 'm1', exitCode: 1, ban: 'banned' }).problems, []);
  assert.deepEqual(judgeSuite(suiteLog({ failing: ['a deletion-pending account reads no profile'], ban: BAN_BANNED }), { expect: 'm3', exitCode: 1, ban: 'banned' }).problems, []);
  for (const [line, ban, reference] of [[BAN_BANNED, 'banned', 'live'], [BAN_BANNED, 'banned', 'ended'], [BAN_LIVE, 'live', 'banned'], [BAN_ENDED, 'ended', 'banned']]) {
    const verdict = judgeSuite(suiteLog({ ban: line }), { expect: 'green', exitCode: 0, ban: reference });
    assert.deepEqual(verdict.problems, [`the ban answer is ${ban}, but the reference run recorded ${reference}`], `${ban} against ${reference}`);
    assert.equal(verdict.ok, false);
  }
});

// Review bbe2fbba finding 2 and its nonvacuous M2 (accepted by Codex as the plan, phase2.md A4.5). Phase 1F refused M2 under
// "banned" outright. Now M2 (member_active() without its ban clause) holds under "live" or "banned" only when exactly the
// banned check fails, with the detail line HTTP 200, 1 row(s): member C's own row came back, so member_active() held, and
// with it its session clause, so member C's session row still existed (the run is its own session evidence). 27 ok is never
// a kill: something other than the ban clause refused member C. Under "ended" the session clause refuses with or without
// the ban clause, so M2 fails closed whatever the run shows.
test('review bbe2fbba finding 2: M2 holds under "live" or "banned" only when exactly the banned check fails with HTTP 200, 1 row(s); 27 ok is never a kill', () => {
  assert.deepEqual(M2_BAN_CLASSES, ['live', 'banned']);
  assert.equal(M2_CHECK, 'a banned account reads no profile');
  assert.match(M2_UNKILLED, /^M2 was not killed: "a banned account reads no profile" passed with the ban clause removed, .*never counts as a kill: record it and stop, .*M2b/);
  const serverError = 'HTTP 500 {"code":"XX000","message":"internal error"}';
  for (const [line, ban] of [[BAN_LIVE, 'live'], [BAN_BANNED, 'banned']]) {
    for (const reference of [null, ban]) {
      const label = `${ban}, reference ${reference}`;
      const judge = (options, exitCode) => judgeSuite(suiteLog({ ban: line, ...options }), { expect: 'm2', exitCode, ban: reference });
      assert.deepEqual(judge({ failing: [M2_CHECK] }, 1), { ok: true, problems: [], ban, failures: [M2_CHECK] }, label);
      // 27 ok, whatever the exit code says: never a kill, and the verdict says to stop.
      assert.deepEqual(judge({}, 0).problems, [`expected not ok: ${M2_CHECK}; got: none`, 'expected exit 1, got 0', 'the summary line does not match', M2_UNKILLED], label);
      assert.deepEqual(judge({}, 1).problems, [`expected not ok: ${M2_CHECK}; got: none`, 'the summary line does not match', M2_UNKILLED], label);
      // The banned check failing for another reason is not the kill (finding 3), and it is not the stop either.
      assert.deepEqual(judge({ failing: [M2_CHECK], details: { [M2_CHECK]: serverError } }, 1).problems, [detailProblem(M2_CHECK, serverError)], label);
      assert.deepEqual(judge({ failing: [M2_CHECK], details: { [M2_CHECK]: null } }, 1).problems, [detailProblem(M2_CHECK, null)], label);
      // One failure too many (another clause broke too), or RED's five, is no kill.
      assert.match(judge({ failing: [M2_CHECK, 'a revoked session reads no profile'] }, 1).problems.join('\n'), /^expected not ok: a banned account reads no profile; got: a banned account reads no profile; a revoked session reads no profile$/m);
      assert.equal(judge({ failing: PROFILE_READ_FAILURES }, 1).ok, false, label);
    }
  }
  // Review 2026-10-26T2305Z finding 1 (phase 1I) flips the old "the stop needs a complete run": a run missing a check, whose
  // banned check printed ok, is the stop. A setup failure that printed no check fails without it.
  const setup = judgeSuite('verify-identity setup failed: Fixture sign-in failed: HTTP 429\n', { expect: 'm2', exitCode: 1, ban: 'banned' });
  assert.equal(setup.ok, false);
  assert.ok(!setup.problems.includes(M2_UNKILLED), setup.problems.join('\n'));
  const partial = judgeSuite(suiteLog({ ban: BAN_BANNED, drop: 1 }), { expect: 'm2', exitCode: 0, ban: 'banned' });
  assert.equal(partial.ok, false);
  assert.ok(partial.problems.includes(M2_UNKILLED), partial.problems.join('\n'));
});

test('review bbe2fbba finding 2: M2 fails closed under "ended", whatever the run shows, a vacuous zero-failure run included', () => {
  for (const [failing, exitCode] of [[[], 0], [[M2_CHECK], 1], [PROFILE_READ_FAILURES, 1]]) {
    for (const reference of [null, 'ended']) {
      const verdict = judgeSuite(suiteLog({ failing, ban: BAN_ENDED }), { expect: 'm2', exitCode, ban: reference });
      assert.equal(verdict.ok, false, `${failing.length} failure(s), reference ${reference}`);
      assert.equal(verdict.ban, 'ended');
      // Review 2026-10-26T2000Z finding 1: under "ended" too, a complete run whose banned check passed is the stop.
      const stop = !failing.includes(M2_CHECK);
      assert.equal(verdict.problems.length, stop ? 2 : 1, verdict.problems.join('\n'));
      assert.match(verdict.problems[0], M2_ENDED);
      if (stop) assert.equal(verdict.problems[1], M2_UNKILLED);
    }
  }
  // A run answering another class than the reference is a mismatch, and never an M2 pass. Review 2026-10-26T2000Z finding 1:
  // the 27-ok run that answers "ended" against a "banned" reference (the ban ended member C's session this time) is the stop.
  for (const [line, failing, exitCode, reference] of [[BAN_LIVE, [M2_CHECK], 1, 'banned'], [BAN_ENDED, [], 0, 'banned'], [BAN_BANNED, [M2_CHECK], 1, 'live']]) {
    const verdict = judgeSuite(suiteLog({ failing, ban: line }), { expect: 'm2', exitCode, ban: reference });
    assert.equal(verdict.ok, false);
    assert.match(verdict.problems.join('\n'), new RegExp(`, but the reference run recorded ${reference}`));
    assert.equal(verdict.problems.includes(M2_UNKILLED), failing.length === 0, `${line} against ${reference}: ${verdict.problems.join(' | ')}`);
  }
  assert.throws(() => judgeSuite(suiteLog(), { expect: 'm4', exitCode: 0 }), /Unknown suite expectation m4/);
});

test('F6 and review bbe2fbba finding 2: the runner states each class limit on every verdict, "banned" with M2\'s exact kill and "ended" with M2 refused', () => {
  assert.equal(banNote('banned'), '# ban answer "banned" (GoTrue HTTP 403 user_banned): the user is banned, but whether its session row still exists is not shown, so this is neither "live" nor "ended"; RED, GREEN, M1 and M3 do not depend on it, and M2 holds only when exactly "a banned account reads no profile" fails with HTTP 200, 1 row(s): with the ban clause removed, that row shows member C\'s session row still existed');
  assert.equal(banNote('ended'), '# ban answer "ended" (GoTrue HTTP 403 session_not_found): the ban ended member C\'s session, so the session clause refuses its read with or without the ban clause; RED, GREEN, M1 and M3 do not depend on it, but M2 is refused on this replay (review bbe2fbba finding 2), so shared-apply stays blocked here');
  for (const ban of ['live', null, undefined]) assert.equal(banNote(ban), null, String(ban));
});

/* ---------------------------------------------------------------- Review 2026-10-26T2000Z finding 1 (phase 1H) -------- */

// Finding 1: M2_UNKILLED was added only when the run answered "live" or "banned". A complete M2 run whose banned check passed
// under "ended", an unrecognised answer, no answer or a reference mismatch carried no stop, so a later suite m2 could pass and
// be chosen instead. The stop now follows the run alone: every complete M2 run in which "a banned account reads no profile"
// passed carries M2_UNKILLED exactly once, whatever GoTrue answered, the reference, the exit code or the other checks.
// m2RunUnkilled is the same rule on the raw output, which the runner reads even when it withholds that output.
const BAN_UNKNOWN = `# after the ban, GoTrue answers member C's session with HTTP 403 ${JSON.stringify({ code: 'bad_jwt', message: 'invalid JWT' })}`;
const ANSWERS = Object.freeze([['live', BAN_LIVE], ['banned', BAN_BANNED], ['ended', BAN_ENDED], ['unrecognised', BAN_UNKNOWN], ['no answer line', null], ['two answer lines', `${BAN_BANNED}\n${BAN_ENDED}`]]);
const OTHER_FAILURES = Object.freeze([[], ['a revoked session reads no profile'], PROFILE_READ_FAILURES.filter((name) => name !== M2_CHECK), ['tripwire: GraphQL is closed (pg_graphql is not enabled)']]);
const unkilledCount = (verdict) => verdict.problems.filter((problem) => problem === M2_UNKILLED).length;
test('review 2026-10-26T2000Z finding 1: every complete M2 run whose banned check passed carries M2_UNKILLED, whatever the answer, reference, exit or other failures', () => {
  let cases = 0;
  for (const [label, line] of ANSWERS) {
    for (const reference of [null, 'live', 'banned', 'ended']) {
      for (const others of OTHER_FAILURES) {
        for (const exitCode of [0, 1]) {
          const where = `${label}, reference ${reference}, ${others.length} other failure(s), exit ${exitCode}`;
          const passedCheck = suiteLog({ failing: others, ban: line });
          const verdict = judgeSuite(passedCheck, { expect: 'm2', exitCode, ban: reference });
          assert.equal(verdict.ok, false, where);
          assert.equal(unkilledCount(verdict), 1, `${where}: ${verdict.problems.join(' | ')}`);
          assert.equal(m2RunUnkilled(passedCheck), true, where);
          // The same run with the banned check failing (the kill, or a failure for another reason) is never the stop.
          for (const detail of ['HTTP 200, 1 row(s)', 'HTTP 500 {"code":"XX000","message":"internal error"}', null]) {
            const failedCheck = suiteLog({ failing: [...others, M2_CHECK], ban: line, details: { [M2_CHECK]: detail } });
            assert.equal(unkilledCount(judgeSuite(failedCheck, { expect: 'm2', exitCode, ban: reference })), 0, `${where}, banned check failing with ${detail}`);
            assert.equal(m2RunUnkilled(failedCheck), false, `${where}, banned check failing with ${detail}`);
          }
          // Only M2 stops on it: RED, GREEN, M1 and M3 never carry M2_UNKILLED.
          for (const expect of ['red', 'green', 'm1', 'm3']) assert.equal(unkilledCount(judgeSuite(passedCheck, { expect, exitCode, ban: reference })), 0, `${where}: ${expect}`);
          cases += 1;
        }
      }
    }
  }
  assert.equal(cases, ANSWERS.length * 4 * OTHER_FAILURES.length * 2);
  // The rule reads the run, never a printed verdict: a stray secret-shaped line leaves a complete 27-ok run the stop.
  assert.equal(m2RunUnkilled(suiteLog({ ban: BAN_BANNED, extra: [FAKE.secret] })), true);
});

// Review 2026-10-26T2305Z finding 1 (phase 1I): the stop required a complete run. In verify-identity.mjs the banned check is
// followed by logout(a1, 'local') and logout(a2, 'others'), outside check(), so a 429 there (or a signal after check 15) ends
// the run with "verify-identity setup failed" after the banned check printed ok. That run carried no stop, and a later run
// showing the exact kill could pass. The stop now fails closed: any M2 run whose parsed checks include "a banned account reads
// no profile" with ok is the stop, whether or not the run is complete or in order, and whatever the exit or the answer. A
// setup failure that printed no check, or a run that broke off before the banned check or with it failing, is not.
const UP_TO_BANNED = Object.freeze(IDENTITY_CHECKS.slice(0, IDENTITY_CHECKS.indexOf(M2_CHECK) + 1));
const LOGOUT_FAILED = 'verify-identity setup failed: Logout (local) failed: HTTP 429 {"code":"over_request_rate_limit","message":"Request rate limit reached"}';
/** A run that printed `names` (the banned check `ok` unless `failing` names it), then broke off with `tail`. */
function brokenOff(names, { ban = BAN_BANNED, failing = [], tail = LOGOUT_FAILED } = {}) {
  const lines = names.flatMap((name) => [...(name === M2_CHECK && ban !== null ? [ban] : []), failing.includes(name) ? `not ok - ${name}\n  HTTP 200, 1 row(s)` : `ok - ${name}`]);
  return `${[...lines, tail].join('\n')}\n`;
}
test('review 2026-10-26T2305Z finding 1: any M2 run whose banned check printed ok is the stop, complete or not, in order or not; a run with no such check is not', () => {
  assert.equal(UP_TO_BANNED.length, 15, 'the banned check is check 15');
  const swapped = suiteLog({ ban: BAN_ENDED }).replace(`ok - ${IDENTITY_CHECKS[0]}\nok - ${IDENTITY_CHECKS[1]}`, `ok - ${IDENTITY_CHECKS[1]}\nok - ${IDENTITY_CHECKS[0]}`);
  const stops = [
    ['the reviewer\'s run: check 15 ok, then the logout failed', brokenOff(UP_TO_BANNED)],
    ['check 15 ok, then a signal', brokenOff(UP_TO_BANNED, { tail: "SIGTERM: removing this run's fixtures" })],
    ['check 15 ok with no answer line, then the logout failed', brokenOff(UP_TO_BANNED, { ban: null })],
    ['check 15 ok with an unrecognised answer, then the logout failed', brokenOff(UP_TO_BANNED, { ban: BAN_UNKNOWN })],
    ['check 15 ok after the "ended" answer, then the logout failed', brokenOff(UP_TO_BANNED, { ban: BAN_ENDED })],
    ['check 15 ok with other failures, then the logout failed', brokenOff(UP_TO_BANNED, { failing: ['a disabled account reads no profile'] })],
    ['the banned check alone', brokenOff([M2_CHECK])],
    ['the banned check ok twice', `${suiteLog({ ban: BAN_BANNED })}ok - ${M2_CHECK}\n`],
    ['26 checks (the tripwire missing)', suiteLog({ ban: BAN_ENDED, drop: 1 })],
    ['26 checks, an unrecognised answer', suiteLog({ ban: BAN_UNKNOWN, drop: 1 })],
    ['two checks out of order', swapped],
  ];
  for (const [label, text] of stops) {
    assert.notEqual(text, suiteLog({ ban: BAN_BANNED }), label);
    assert.equal(m2RunUnkilled(text), true, label);
    for (const exitCode of [0, 1]) {
      for (const reference of [null, 'live', 'banned', 'ended']) {
        const verdict = judgeSuite(text, { expect: 'm2', exitCode, ban: reference });
        assert.equal(verdict.ok, false, `${label}, exit ${exitCode}, reference ${reference}`);
        assert.equal(unkilledCount(verdict), 1, `${label}, exit ${exitCode}, reference ${reference}: ${verdict.problems.join(' | ')}`);
      }
      // Only M2 stops on it: RED, GREEN, M1 and M3 never carry M2_UNKILLED.
      for (const expect of ['red', 'green', 'm1', 'm3']) assert.equal(unkilledCount(judgeSuite(text, { expect, exitCode, ban: 'banned' })), 0, `${label}: ${expect}`);
    }
  }
  // The reviewer's run fails for its own reasons too, and the stop is added to them, never in their place.
  const logoutVerdict = judgeSuite(brokenOff(UP_TO_BANNED), { expect: 'm2', exitCode: 1, ban: 'banned' });
  assert.ok(logoutVerdict.problems.includes(`stop line: ${LOGOUT_FAILED}`), logoutVerdict.problems.join('\n'));
  assert.ok(logoutVerdict.problems.includes(`expected the ${IDENTITY_CHECKS.length} identity checks in order, got 15 check line(s)`), logoutVerdict.problems.join('\n'));
  assert.equal(logoutVerdict.problems.at(-1), M2_UNKILLED);
  const noStop = [
    ['a setup failure that printed no check', 'verify-identity setup failed: Fixture sign-in failed: HTTP 429\n'],
    ['a refusal that printed no check', 'verify-identity refused: the replay project answers at http://127.0.0.1:56421, not the expected API\n'],
    ['no output', ''],
    ['broke off before the banned check', brokenOff(UP_TO_BANNED.slice(0, -1))],
    ['broke off with the banned check failing (the kill, then a logout failure)', brokenOff(UP_TO_BANNED, { failing: [M2_CHECK] })],
    ['a check named like the banned one', brokenOff(UP_TO_BANNED.slice(0, -1), { tail: `ok - ${M2_CHECK} (again)` })],
  ];
  for (const [label, text] of noStop) {
    assert.equal(m2RunUnkilled(text), false, label);
    for (const exitCode of [0, 1]) assert.equal(unkilledCount(judgeSuite(text, { expect: 'm2', exitCode, ban: 'banned' })), 0, `${label}, exit ${exitCode}`);
  }
});

/* ---------------------------------------------------------------- Review bbe2fbba finding 3: detail lines ----------- */

// The suite prints one detail line under each `not ok` (verify-identity.mjs brief()): a profile read that returned the
// caller's own row reads `HTTP 200, 1 row(s)`. The verdict used to skip that line, so an expected check failing for
// another reason (a server error, a refusal, two rows) counted as the expected failure.
test('review bbe2fbba finding 3: every expected failure, in RED and in each mutation, needs exactly the detail line HTTP 200, 1 row(s)', () => {
  assert.equal(PROFILE_ROW_DETAIL, 'HTTP 200, 1 row(s)');
  const wrong = ['HTTP 500 {"code":"XX000","message":"internal error"}', 'HTTP 401 {"code":"PGRST301","message":"JWT expired"}', 'HTTP 403 {"code":"42501","message":"permission denied for table profiles"}',
    'HTTP 200, 2 row(s)', 'HTTP 200, 0 row(s)', 'HTTP 200, 1 row(s) ', 'http 200, 1 row(s)', null];
  const expectations = [
    ['red', PROFILE_READ_FAILURES, BAN_LIVE, 'live', null], ['red', PROFILE_READ_FAILURES, BAN_BANNED, 'banned', 'banned'], ['m1', PROFILE_READ_FAILURES, BAN_BANNED, 'banned', 'banned'],
    ['m2', [M2_CHECK], BAN_LIVE, 'live', 'live'], ['m2', [M2_CHECK], BAN_BANNED, 'banned', 'banned'], ['m3', ['a deletion-pending account reads no profile'], BAN_BANNED, 'banned', 'banned'],
  ];
  for (const [expect, failing, line, ban, reference] of expectations) {
    assert.deepEqual(judgeSuite(suiteLog({ failing, ban: line }), { expect, exitCode: 1, ban: reference }), { ok: true, problems: [], ban, failures: [...failing] }, expect);
    for (const name of failing) {
      for (const detail of wrong) {
        const verdict = judgeSuite(suiteLog({ failing, ban: line, details: { [name]: detail } }), { expect, exitCode: 1, ban: reference });
        assert.equal(verdict.ok, false, `${expect}: ${name}: ${detail}`);
        assert.deepEqual(verdict.failures, [...failing], 'the failing names alone still match');
        assert.deepEqual(verdict.problems, [detailProblem(name, detail)], `${expect}: ${name}: ${detail}`);
      }
    }
  }
  // An unexpected failure is already a problem by name; its detail adds nothing.
  assert.deepEqual(judgeSuite(suiteLog({ failing: ['the revoking session stays live'], details: { 'the revoking session stays live': 'Expected values to be strictly deep-equal:' } }), { expect: 'green', exitCode: 0 }).problems,
    ['expected not ok: none; got: the revoking session stays live', 'the summary line does not match']);
  // The replay's own RED output (attempt 4, phase2-2-red-2.txt up to its summary line), its five detail lines included,
  // meets RED under its reference "banned"; with one detail changed it does not.
  const recorded = read('docs/evidence/MB-1/phase2-2-red-2.txt');
  const output = recorded.slice(0, recorded.indexOf('# suite exit 1;'));
  assert.equal(output.split('\n').filter((line) => line === '  HTTP 200, 1 row(s)').length, 5);
  assert.deepEqual(judgeSuite(output, { expect: 'red', exitCode: 1, ban: 'banned' }), { ok: true, problems: [], ban: 'banned', failures: [...PROFILE_READ_FAILURES] });
  const serverError = output.replace(`not ok - ${M2_CHECK}\n  HTTP 200, 1 row(s)`, `not ok - ${M2_CHECK}\n  HTTP 500 {"code":"XX000","message":"internal error"}`);
  assert.notEqual(serverError, output);
  assert.deepEqual(judgeSuite(serverError, { expect: 'red', exitCode: 1, ban: 'banned' }).problems, [detailProblem(M2_CHECK, 'HTTP 500 {"code":"XX000","message":"internal error"}')]);
  // The record itself stays as it ran: the runner's lines after the summary are unchanged.
  assert.match(recorded, /^# verdict: the red expectation is met$/m);
  assert.match(recorded, /^# mb1-replay suite: exit 0$/m);
});

test('M3 expects only the deletion-pending failure; M1 expects exactly the five profile_read failures', () => {
  assert.deepEqual(judgeSuite(suiteLog({ failing: ['a deletion-pending account reads no profile'] }), { expect: 'm3', exitCode: 1 }).problems, []);
  assert.deepEqual(judgeSuite(suiteLog({ failing: PROFILE_READ_FAILURES }), { expect: 'm1', exitCode: 1 }).problems, []);
});

const READ_QUAL = '(id = ( SELECT auth.uid() AS uid))';
const GUARDED = '((id = ( SELECT auth.uid() AS uid)) AND ( SELECT private.member_active() AS member_active))';
function psqlOutput({ readOnly = 'on|on', fn = md5('fn'), proconfig = '{"search_path=\\"\\""}', prosecdef = 't', readQual = READ_QUAL, migrations = BASE, policies = [] } = {}) {
  const p3 = migrations.map((file) => { const [, version, name] = /^(\d{14})_(.+)\.sql$/.exec(file); return `${version}|${name}|${md5(file)}`; });
  const p2 = [`profile_read|PERMISSIVE|{authenticated}|SELECT|${readQual}|`, ...policies, `profile_update|PERMISSIVE|{authenticated}|UPDATE|${GUARDED}|${GUARDED}`];
  return ['default_transaction_read_only|transaction_read_only', readOnly, '(1 row)', '', 'BEGIN',
    P1_COLUMNS.join('|'), `postgres|t|f|postgres|${prosecdef}|s|${proconfig}|f|f|t|${fn}`, '(1 row)', '',
    'policyname|permissive|roles|cmd|qual|with_check', ...p2, `(${p2.length} rows)`, '',
    'version|name|statements_md5', ...p3, `(${p3.length} rows)`, '', 'ROLLBACK', ''].join('\n');
}

test('the precondition output parses only in its exact shape, with the session read-only proof first', () => {
  const snapshot = parsePreconditions(psqlOutput());
  assert.equal(snapshot.p1.prosecdef, 't');
  assert.equal(snapshot.p2.length, 2);
  assert.equal(snapshot.p3.length, 15);
  assert.throws(() => parsePreconditions(psqlOutput({ readOnly: 'off|off' })), /not read-only: default_transaction_read_only=off, transaction_read_only=off/);
  assert.throws(() => parsePreconditions(psqlOutput().replace('(15 rows)', '(14 rows)')), /footer says 14 row\(s\), but 15 were printed/);
  assert.throws(() => parsePreconditions(psqlOutput().replace('ROLLBACK\n', 'COMMIT\n')), /line 33 is not an expected header or tag/);
  assert.throws(() => parsePreconditions(psqlOutput().replace('BEGIN\n', '')), /sections came in the order readOnly, p1, p2, p3, ROLLBACK/);
  assert.throws(() => parsePreconditions(psqlOutput().replace('|s|', '|s|x|')), /line 7 has 12 cell\(s\), expected 11/);
});

test('P1, P2 and P3 hold before and after the candidate, and each broken rule is named', () => {
  const before = parsePreconditions(psqlOutput());
  const after = parsePreconditions(psqlOutput({ readQual: GUARDED, migrations: MIGRATIONS }));
  assert.deepEqual(preconditionProblems(before, { stage: 'before', migrations: MIGRATIONS }), []);
  assert.deepEqual(preconditionProblems(after, { stage: 'after', migrations: MIGRATIONS }), []);
  assert.deepEqual(preconditionProblems(before, { stage: 'after', migrations: MIGRATIONS }), ['P2: profile_read does not call member_active()', 'P3: the 15 applied migration(s) are not the 16 expected']);
  const broken = parsePreconditions(psqlOutput({ prosecdef: 'f', proconfig: '{search_path=public}', policies: ['profile_all|PERMISSIVE|{authenticated}|ALL|true|'] }));
  assert.deepEqual(preconditionProblems(broken, { stage: 'before', migrations: MIGRATIONS }), [
    'P1: member_active() is not security definer',
    'P1: proconfig is not exactly search_path=""',
    'P2: the policies are profile_read, profile_all, profile_update, not profile_read and profile_update',
  ]);
});

test('snapshot differences are named, and each mutation and restore must change exactly its own part', () => {
  const before = parsePreconditions(psqlOutput());
  const after = parsePreconditions(psqlOutput({ readQual: GUARDED, migrations: MIGRATIONS }));
  const m1 = parsePreconditions(psqlOutput({ migrations: MIGRATIONS }));
  const m2 = parsePreconditions(psqlOutput({ readQual: GUARDED, migrations: MIGRATIONS, fn: md5('m2') }));
  assert.deepEqual(diffSnapshots(before, after), ['P2.profile_read.qual', 'P3.+20261026040045']);
  assert.deepEqual(diffSnapshots(after, m1), ['P2.profile_read.qual']);
  assert.deepEqual(diffSnapshots(after, m2), ['P1.fn_definition_md5']);
  assert.deepEqual(diffSnapshots(after, after), []);
  assert.deepEqual(snapshotVerdict('after', after, { references: { before }, migrations: MIGRATIONS }), { changes: ['P2.profile_read.qual', 'P3.+20261026040045'], problems: [] });
  assert.deepEqual(snapshotVerdict('m1', m1, { references: { after }, migrations: MIGRATIONS }).problems, []);
  assert.deepEqual(snapshotVerdict('m2', m2, { references: { after }, migrations: MIGRATIONS }).problems, []);
  // A mutation that silently did not apply is not proved, and a restore that left the mutation is not restored.
  assert.deepEqual(snapshotVerdict('m3', after, { references: { after }, migrations: MIGRATIONS }).problems, ['changes from after are [none], expected [P1.fn_definition_md5]']);
  assert.deepEqual(snapshotVerdict('restored', m2, { references: { after }, migrations: MIGRATIONS }).problems, ['changes from after are [P1.fn_definition_md5], expected [none]']);
  assert.deepEqual(snapshotVerdict('after', after, { references: {}, migrations: MIGRATIONS }).problems, ['there is no "before" snapshot to compare with']);
  assert.deepEqual(Object.keys(SNAPSHOT_RULES), ['before', 'after', 'm1', 'm2', 'm3', 'restored', 'fresh16', '55321-before', '55321-after']);
});

test('db, auth and REST must run the same images on the replay and the shared stack', () => {
  const ps = (auth) => ['supabase_db_fitlog_mb1_replay_20261026 public.ecr.aws/supabase/postgres:17.6.1.003', `supabase_auth_fitlog_mb1_replay_20261026 ${auth}`, 'supabase_rest_fitlog_mb1_replay_20261026 public.ecr.aws/supabase/postgrest:v13.0.5',
    'supabase_db_fitlog_rebuild_20261017 public.ecr.aws/supabase/postgres:17.6.1.003', 'supabase_auth_fitlog_rebuild_20261017 public.ecr.aws/supabase/gotrue:v2.180.0', 'supabase_rest_fitlog_rebuild_20261017 public.ecr.aws/supabase/postgrest:v13.0.5'].join('\n');
  assert.deepEqual(imageProblems(ps('public.ecr.aws/supabase/gotrue:v2.180.0'), 'fitlog_mb1_replay_20261026').problems, []);
  assert.deepEqual(imageProblems(ps('public.ecr.aws/supabase/gotrue:v2.181.0'), 'fitlog_mb1_replay_20261026').problems, ['auth: the replay runs public.ecr.aws/supabase/gotrue:v2.181.0, the shared stack public.ecr.aws/supabase/gotrue:v2.180.0']);
  assert.deepEqual(imageProblems(ps('x').split('\n').slice(0, 5).join('\n'), 'fitlog_mb1_replay_20261026').problems, ['auth: the replay runs x, the shared stack public.ecr.aws/supabase/gotrue:v2.180.0', 'rest: no running shared container']);
});

const PRECONDITIONS = extractPreconditions(read('docs/plan/runs/MB-1/phase1.md'));

test('the precondition block in phase1.md passes the read-only SQL check', () => {
  assert.match(PRECONDITIONS, /^begin transaction read only;\n/);
  assert.deepEqual(readOnlySqlProblems(PRECONDITIONS), []);
  assert.throws(() => extractPreconditions('no block'), /exactly one sql preconditions block \(it holds 0\)/);
});

test('the read-only SQL check refuses every transaction escape, write, meta-command and side effect', () => {
  const inner = (sql) => `begin transaction read only;\n${sql}\nrollback;\n`;
  const refused = {
    'commit;\nselect 1;': /statement 2 does not start with select or with; statement 2 uses commit/,
    'set default_transaction_read_only = off;': /uses set/,
    'set session characteristics as transaction read write;': /uses set/,
    "select set_config('default_transaction_read_only', 'off', false);": /uses set_config/,
    'select pg_terminate_backend(1);': /uses pg_terminate_backend/,
    'with gone as (delete from public.profiles returning 1) select 1;': /uses delete/,
    'select 1 into scratch;': /uses into/,
    'begin transaction read write;': /does not start with select or with; statement 2 uses begin/,
    '\\! touch /tmp/x': /psql meta-commands/,
    'select 1 \\g': /psql meta-commands/,
    'do $$ begin end $$;': /dollar quoting/,
    'select :secret;': /psql variables/,
    '/* hidden */ select 1;': /block comments/,
    "select 'unterminated;": /an unterminated string/,
  };
  for (const [sql, reason] of Object.entries(refused)) assert.match(readOnlySqlProblems(inner(sql)).join('; '), reason, sql);
  assert.deepEqual(readOnlySqlProblems(inner("select 'commit; set x' as text, E'\\'' as quote; -- commit;")), []);
  assert.deepEqual(readOnlySqlProblems('select 1;\nrollback;\n'), ['the first line is not "begin transaction read only;"', 'the first statement is not "begin transaction read only"']);
  assert.deepEqual(readOnlySqlProblems('begin transaction read only;\nselect 1;\n'), ['the last line is not "rollback;"', 'the last statement is not "rollback"']);
  assert.deepEqual(readOnlySqlProblems('begin transaction read only;\nrollback;\n'), ['there is no query between begin and rollback']);
});

// Review a102fb68 finding 3: a function that runs SQL text hides a side effect inside a string the check skips, and a
// quoted identifier hides a function name. The hash pin (mb1-replay.test.mjs) is the primary barrier; this is the second.
test('the read-only SQL check refuses functions that run SQL text, side-effect functions and quoted names', () => {
  const inner = (sql) => `begin transaction read only;\n${sql}\nrollback;\n`;
  const refused = {
    "select query_to_xml('select pg_terminate_backend(pid) from pg_stat_activity', true, true, '');": /uses query_to_xml/,
    "select query_to_xml_and_xmlschema('select 1', true, true, '');": /uses query_to_xml_and_xmlschema/,
    "select cursor_to_xml('c', 1, true, true, '');": /uses cursor_to_xml/,
    "select table_to_xml('public.profiles', true, true, '');": /uses table_to_xml/,
    "select schema_to_xml('public', true, true, '');": /uses schema_to_xml/,
    "select database_to_xml(true, true, '');": /uses database_to_xml/,
    "select * from ts_stat('select 1');": /uses ts_stat/,
    'select "query_to_xml"(1);': /uses query_to_xml/,
    'select pg_catalog."pg_terminate_backend"(1);': /uses pg_terminate_backend/,
    'select pg_sleep(1);': /uses pg_sleep/,
    'select pg_advisory_lock(1);': /uses pg_advisory_lock/,
    'select pg_try_advisory_xact_lock(1);': /uses pg_try_advisory_xact_lock/,
  };
  for (const [sql, reason] of Object.entries(refused)) assert.match(readOnlySqlProblems(inner(sql)).join('; '), reason, sql);
  assert.deepEqual(readOnlySqlProblems(inner('select relname as "Name" from pg_class;')), []);
});

// The block review a102fb68 read and called clean ("Today's block (phase1.md:235-252) is clean"). The runner holds the
// same sha256 as a constant and refuses any other block at prepare and before every snapshot (mb1-replay.test.mjs).
const REVIEWED_PRECONDITIONS_SHA256 = 'ca683771f22935ff97c26f3101e93634f1611132963d2e44db7bc9d913ed769a';
test('the precondition block in phase1.md is the reviewed one, byte for byte', () => {
  assert.equal(sha256(PRECONDITIONS), REVIEWED_PRECONDITIONS_SHA256);
});

// Review b75d1e73 finding 4: the only SQL that reaches 55321 is the candidate, so its bytes are pinned as a constant, taken
// in phase 1E from the file whose one statement is phase1.md §3's (review a102fb68: "The candidate SQL is unchanged and
// correct"). add-candidate and shared-apply refuse any other bytes (mb1-replay.test.mjs).
const REVIEWED_CANDIDATE_SHA256 = 'ac262f39fc6962345f64982e36c6b2aa7f8f3418829fd653684002f2f2c1bdc3';
test("the candidate migration is the pinned one, byte for byte, and its one statement is phase1.md §3's", () => {
  const candidate = read(`supabase/migrations/${CANDIDATE}`);
  assert.equal(CANDIDATE_SHA256, REVIEWED_CANDIDATE_SHA256);
  assert.equal(sha256(candidate), CANDIDATE_SHA256);
  const statements = candidate.split('\n').filter((line) => line.trim() !== '' && !line.startsWith('--'));
  const section = /^## 3\. Candidate \(not applied\)\n[\s\S]*?^```sql\n([\s\S]*?)^```$/m.exec(read('docs/plan/runs/MB-1/phase1.md'));
  assert.ok(section, 'phase1.md §3 holds the candidate block');
  assert.deepEqual(statements, section[1].split('\n').filter(Boolean));
  assert.equal(statements.length, 1);
});

test('mutation and restore SQL come from the committed sources, each differing in exactly one line', () => {
  const candidate = read(`supabase/migrations/${CANDIDATE}`);
  const files = mutationSql({ candidate, memberCore: read('supabase/migrations/20261017161031_member_core.sql') });
  assert.deepEqual(Object.keys(files), ['sql/m1.sql', 'sql/m2.sql', 'sql/m3.sql', 'sql/restore-member-active.sql']);
  const changedLines = (a, b) => a.split('\n').filter((line, index) => line !== b.split('\n')[index]).length;
  const restore = files['sql/restore-member-active.sql'];
  assert.match(restore, /^create or replace function private\.member_active\(\) returns boolean/);
  assert.match(restore, /\$\$;\n$/);
  assert.equal(changedLines(files['sql/m1.sql'], candidate), 1);
  assert.equal(changedLines(files['sql/m2.sql'], restore), 1);
  assert.equal(changedLines(files['sql/m3.sql'], restore), 1);
  assert.doesNotMatch(files['sql/m1.sql'], /member_active/);
  assert.doesNotMatch(files['sql/m2.sql'], /banned_until/);
  assert.match(files['sql/m3.sql'], /p\.status in \('active','deletion_pending'\)/);
  assert.throws(() => mutationSql({ candidate: `${candidate}${candidate}`, memberCore: read('supabase/migrations/20261017161031_member_core.sql') }), /expected exactly one " and \(select private\.member_active\(\)\)"/);
  assert.throws(() => mutationSql({ candidate, memberCore: `\n${read('supabase/migrations/20261017161031_member_core.sql')}` }), /lines 24-31 are no longer private\.member_active\(\)/);
});
