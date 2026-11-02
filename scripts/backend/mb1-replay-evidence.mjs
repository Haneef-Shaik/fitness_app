import { createHash } from 'node:crypto';

// MB-1 phase 2 evidence rules as pure functions (review 39fe1fb5, findings 2-4 and 6). They decide which CLI output may be
// kept (a per-command allowlist, then key redaction, then a final secret scan), the identity suite's mechanical verdict,
// the read-only precondition snapshot and its comparisons, GoTrue's ban answer, the service images, and whether SQL is
// safe for the read-only runner. Nothing here runs a command, reads a file or touches a database.

export const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
export const CANDIDATE = '20261026040045_mb1_live_session_guard.sql';
/**
 * The sha256 of the phase1.md §7 `sql preconditions` block (lines 236-251) that review a102fb68 read and called clean. The
 * runner refuses any other block at prepare and before every snapshot (review a102fb68 finding 3): the manifest only
 * vouches for itself, so this constant, not the untracked phase1.md, is what ties a run to the reviewed SQL.
 */
export const PRECONDITIONS_SHA256 = 'ca683771f22935ff97c26f3101e93634f1611132963d2e44db7bc9d913ed769a';
/**
 * The sha256 of the candidate migration, the only SQL that ever reaches 55321 (review b75d1e73 finding 4). Taken in phase 1E
 * from the file whose one statement is phase1.md §3's, which review a102fb68 called "unchanged and correct". add-candidate
 * and shared-apply refuse any other bytes, so an edit after review reaches neither the replay nor 55321.
 */
export const CANDIDATE_SHA256 = 'ac262f39fc6962345f64982e36c6b2aa7f8f3418829fd653684002f2f2c1bdc3';
const CANDIDATE_VERSION = CANDIDATE.slice(0, 14);

/* ---------------------------------------------------------------- CLI output ---------------------------------------- */

const SECRET_SHAPES = [/sb_secret_/i, /sb_publishable_/i, /eyJhbGci/, /eyJ[\w-]{6,}\.[\w-]+/, /JWT secret/i, /S3 (Access|Secret) Key/i, /\b[a-z][\w+.-]*:\/\/[^\s/@:]+:[^\s/@[]+@/i, /PRIVATE KEY-----/];
const SECRET_LABEL = /\b(JWT secret|S3 (Access|Secret) Key|secret[ _]?key|service[ _]role[ _]key|anon[ _]key|publishable[ _]key|password)\b/i;

/** The secret shapes a text still holds (review 39fe1fb5's scan, widened to any JWT and any URL with a password). */
export function secretHits(text) { return SECRET_SHAPES.filter((shape) => shape.test(String(text))).map((shape) => shape.source); }
export function assertNoSecrets(text) {
  if (secretHits(text).length) throw new Error('Refusing to print: the output still holds a secret-shaped value');
  return text;
}
/** One line with every key, token and URL password masked; a line that names a secret is masked whole. */
export function redact(line) {
  if (SECRET_LABEL.test(line)) return '[redacted line]';
  return String(line).replace(/sb_(secret|publishable)_[\w-]*/gi, '[redacted key]')
    .replace(/eyJ[\w-]*(\.[\w-]*){0,2}/g, '[redacted token]')
    .replace(/\b([a-z][\w+.-]*:\/\/[^\s/@:]+):[^\s/@[]+@/gi, '$1:[redacted]@');
}

const APPLYING = /^Applying migration (\d{14}_[a-z0-9_]+\.sql)\.\.\.$/;
// `supabase migration list` as the installed CLI 2.121.0 prints it (F5; read from its bundled code in
// node_modules/@supabase/cli-darwin-arm64/bin/supabase as a file, never run; phase1e.md §2). POn wraps every cell in
// backticks, an empty one as "` `"; Da pads each column to its widest cell and prints "  " then " cell " joined by "|", under
// a header and a rule of dashes; _me prints the time as YYYY-MM-DD HH:MM:SS. The header and rule equal the lines the runner
// kept live in phase 2 attempt 2. Lines are matched after trimEnd, so Da's trailing pad never matters.
const LIST_HEADER = /^ +Local +\| +Remote +\| +Time \(UTC\)$/;
const LIST_RULE = /^ +-+\|-+\|-+$/;
const LIST_CELL = '`(\\d{14}| )`';
const LIST_ROW = new RegExp(`^ *${LIST_CELL} *\\| *${LIST_CELL} *\\| *\`(\\d{4}-\\d\\d-\\d\\d \\d\\d:\\d\\d:\\d\\d)\`$`);
// Lines known from AR-1's CLI 2.121.0 logs or the CLI's fixed progress messages. Anything else is withheld and counted.
const ALLOW = Object.freeze({
  start: [/^Starting database\.\.\.$/, /^Initialising schema\.\.\.$/, /^Seeding globals from roles\.sql\.\.\.$/, APPLYING, /^Seeding data from supabase\/[\w.-]+\.sql\.\.\.$/, /^Starting containers\.\.\.$/, /^Waiting for health checks\.\.\.$/, /^Started supabase local development setup\.$/],
  migrations: [/^Connecting to local database\.\.\.$/, LIST_HEADER, LIST_RULE, LIST_ROW],
  migrate: [/^Connecting to local database\.\.\.$/, APPLYING, /^Local database is up to date\.$/, /^Finished supabase migration up\.$/],
  diff: [/^Creating shadow database\.\.\.$/, APPLYING, /^Diffing schemas: [a-z_,]+$/, /^Finished supabase db diff\.$/, /^No schema changes found$/],
  lint: [/^Connecting to local database\.\.\.$/, /^Linting schema: [a-z_]+$/, /^No schema errors found$/],
  stop: [/^Stopping containers\.\.\.$/, /^Stopped supabase local development setup\.$/],
  psql: [/^(BEGIN|COMMIT|ROLLBACK|ALTER POLICY|CREATE FUNCTION)$/],
});
const ERROR_LINES = [/^(Error|error|ERROR|FATAL|failed|Failed)\b.*$/, /^psql:\S* ?(ERROR|FATAL|WARNING|error):.*$/, /^Try rerunning the command with --debug/];
const JSON_KEYS = Object.freeze({ start: ['status', 'message'], stop: ['status', 'message'], migrate: ['status', 'message'], diff: ['diff', 'file', 'files', 'schemas', 'engine', 'dropStatements', 'message'], lint: ['results', 'message'] });

function knownJson(line, keys) {
  if (!keys || !line.startsWith('{')) return null;
  let value;
  try { value = JSON.parse(line); } catch { return null; }
  if (value === null || typeof value !== 'object' || Array.isArray(value) || !Object.keys(value).every((key) => keys.includes(key))) return null;
  return redact(JSON.stringify(value));
}

/** The lines of one output stream that may be kept: allowlisted, redacted, and free of any secret shape. */
export function filterOutput(kind, text, { failed = false } = {}) {
  const rules = ALLOW[kind];
  if (!rules) throw new Error(`No output allowlist for ${kind}`);
  const allowed = failed ? [...rules, ...ERROR_LINES] : rules;
  const lines = [];
  let withheld = 0;
  for (const raw of String(text ?? '').split(/\r?\n/)) {
    const line = raw.trimEnd();
    if (!line.trim()) continue;
    const kept = knownJson(line, JSON_KEYS[kind]) ?? (allowed.some((rule) => rule.test(line)) ? redact(line) : null);
    if (kept === null || secretHits(kept).length) withheld += 1;
    else lines.push(kept);
  }
  return { lines, withheld };
}

/** The printable record of one command: its title, kept lines, the withheld count and the exit. Never raw output. */
export function renderRun(title, kind, run) {
  const failed = run.status !== 0;
  const out = filterOutput(kind, run.stdout, { failed });
  const err = filterOutput(kind, run.stderr, { failed });
  // A timed-out or interrupted command may have run part of the way, so it "did not finish", never "did not run".
  const exit = run.status === null ? `did not finish (${redact(String(run.error ?? 'no exit status'))})` : `exit ${run.status}`;
  return assertNoSecrets(`${[`$ ${title}`, ...out.lines, ...err.lines, `# ${out.withheld + err.withheld} line(s) withheld (not on the ${kind} allowlist, or secret-shaped)`, `# ${exit}`].join('\n')}\n`);
}

export function appliedMigrations(text) { return String(text).split(/\r?\n/).map((line) => APPLYING.exec(line)?.[1]).filter(Boolean); }

function jsonLine(text, key) {
  for (const line of String(text).split(/\r?\n/)) {
    if (!line.startsWith('{')) continue;
    try { const value = JSON.parse(line); if (value && typeof value === 'object' && key in value) return value; } catch { /* not this line */ }
  }
  return null;
}
/** Clean only when the result line says so and the JSON summary has an empty diff and no drop statement (AR-1 shape). */
export function diffResult(text) {
  const problems = [];
  if (!/^No schema changes found$/m.test(String(text))) problems.push('no "No schema changes found" line');
  const json = jsonLine(text, 'diff');
  if (!json) problems.push('no diff JSON line');
  else if (json.diff !== '' || !Array.isArray(json.dropStatements) || json.dropStatements.length) problems.push(`the diff JSON is not empty: diff ${String(json.diff ?? '').length} character(s), ${Array.isArray(json.dropStatements) ? json.dropStatements.length : 'no'} drop statement(s)`);
  return { clean: problems.length === 0, problems };
}
export function lintResult(text) {
  const problems = [];
  if (!/^No schema errors found$/m.test(String(text))) problems.push('no "No schema errors found" line');
  const json = jsonLine(text, 'results');
  if (!json || !Array.isArray(json.results)) problems.push('no lint JSON line');
  else if (json.results.length) problems.push(`the lint JSON has ${json.results.length} result(s)`);
  return { clean: problems.length === 0, problems };
}

const versionTime = (v) => `${v.slice(0, 4)}-${v.slice(4, 6)}-${v.slice(6, 8)} ${v.slice(8, 10)}:${v.slice(10, 12)}:${v.slice(12, 14)}`;
const listedAs = (row) => (row.local && row.remote ? 'local and remote' : row.local ? 'local only' : 'remote only');

function migrationRows(text) {
  const rows = [];
  let unrecognised = 0;
  for (const raw of String(text ?? '').split(/\r?\n/)) {
    const line = raw.trimEnd();
    const row = LIST_ROW.exec(line);
    if (row) rows.push({ local: row[1].trim(), remote: row[2].trim(), time: row[3] });
    else if (/[|│]/.test(line) && !LIST_HEADER.test(line) && !LIST_RULE.test(line)) unrecognised += 1;
  }
  return { rows, unrecognised };
}
function rowProblems(rows) {
  const problems = [];
  const seen = new Map();
  for (const row of rows) {
    const version = row.remote || row.local;
    if (!version) { problems.push('a row lists no version'); continue; }
    if (row.local && row.remote && row.local !== row.remote) problems.push(`a row pairs local ${row.local} with remote ${row.remote}`);
    if (row.time !== versionTime(version)) problems.push(`${version}'s time is not its version's timestamp`);
    seen.set(version, [...(seen.get(version) ?? []), row]);
  }
  for (const [version, list] of seen) if (list.length > 1) problems.push(`${version} is listed ${list.length} times`);
  return { problems, seen };
}

/**
 * Whether `supabase migration list --local` proves the expected migrations (F5). `local` is every version in the replay's
 * migrations directory (the manifest), `applied` those its database should have applied. It holds only when every
 * table-shaped line is a recognised row, there is exactly one row per expected version, in version order, each listed local
 * and/or remote as expected and timed as its own version. No recognised row never passes, whatever the CLI's exit code.
 * Problems name versions and counts only, never a withheld line.
 */
export function migrationListResult(text, { local, applied }) {
  const { rows, unrecognised } = migrationRows(text);
  const problems = [];
  if (!rows.length) problems.push('no migration row was recognised, so the list proves nothing');
  if (unrecognised) problems.push(`${unrecognised} table-shaped line(s) were not recognised and stay withheld`);
  const result = () => ({ ok: problems.length === 0, problems, rows: rows.map((row) => ({ local: row.local, remote: row.remote })) });
  if (!rows.length) return result();
  const versions = [...new Set([...local, ...applied])].sort();
  const expected = new Map(versions.map((v) => [v, { local: local.includes(v) ? v : '', remote: applied.includes(v) ? v : '' }]));
  if (rows.length !== versions.length) problems.push(`the list has ${rows.length} row(s); the manifest expects ${versions.length}`);
  const checked = rowProblems(rows);
  problems.push(...checked.problems);
  for (const version of versions) if (!checked.seen.has(version)) problems.push(`${version} is missing`);
  for (const [version, [row]] of checked.seen) {
    const want = expected.get(version);
    if (!want) problems.push(`${version} is listed ${listedAs(row)}, but it is not in the manifest`);
    else if (listedAs(row) !== listedAs(want)) problems.push(`${version} is listed ${listedAs(row)}, expected ${listedAs(want)}`);
  }
  if (!problems.length && rows.map((row) => row.remote || row.local).join(',') !== versions.join(',')) problems.push('the rows are not in version order');
  return result();
}

/* ---------------------------------------------------------------- Identity suite verdict ---------------------------- */

export const IDENTITY_CHECKS = Object.freeze([
  'a live session reads its own profile', "a guessed ID of another member's profile returns no row", 'an unfiltered profile read returns only the caller',
  "another member's profile cannot be updated", 'the anonymous role cannot read profiles', 'a member cannot insert their own profile directly',
  'the private onboarding definer is not reachable over the API', 'a session revoked before onboarding cannot complete it',
  'a new session of the same account can complete onboarding', 'a disabled account reads no profile', 'a disabled account cannot update its profile',
  'a disabled account cannot re-run onboarding', 'a deletion-pending account reads no profile', 'an active account reads its own profile before it is banned',
  'a banned account reads no profile', 'the auth server rejects a revoked session', 'a revoked session reads no profile', 'a revoked session cannot update its profile',
  'a revoked session cannot complete onboarding', 'a revoked session cannot start a sync', 'a revoked session reads no personal rows',
  'a revoked session cannot write personal rows', "revoking one session leaves the account's other sessions live",
  'the auth server rejects a session revoked from another device', 'a session revoked from another device reads no profile', 'the revoking session stays live',
  'tripwire: GraphQL is closed (pg_graphql is not enabled)',
]);
export const PROFILE_READ_FAILURES = Object.freeze(['a disabled account reads no profile', 'a deletion-pending account reads no profile', 'a banned account reads no profile', 'a revoked session reads no profile', 'a session revoked from another device reads no profile']);
/** The detail line the suite prints under a failed profile read that returned the caller's own row (verify-identity.mjs brief()). */
export const PROFILE_ROW_DETAIL = 'HTTP 200, 1 row(s)';
/** The one check M2 (member_active() without its ban clause) must fail. */
export const M2_CHECK = 'a banned account reads no profile';
/** Review bbe2fbba finding 2: an M2 run in which the banned check passed. Never a kill; the runner stops M2 on that replay. */
export const M2_UNKILLED = 'M2 was not killed: "a banned account reads no profile" passed with the ban clause removed, so something other than the ban clause refused member C (most likely the ban ended its session, which the session clause refuses); that never counts as a kill: record it and stop, and the fallback is M2b (the session clause removed instead), reviewed separately';
const AFTER_BAN = /^# after the ban, GoTrue answers member C's session with (.+)$/;
const STOP_LINES = [/^verify-identity refused:/, /^verify-identity setup failed:/, /^Fixture cleanup needs attention:/, /^The checks passed, but fixture cleanup failed/, /^SIG(INT|TERM): /];
const SUMMARY = /^(Local identity integration passed, \d+ checks: |\d+ of \d+ identity checks failed: )/;

/** The GoTrue 403 codes this verdict knows after the ban, and the class each gives (phase1.md R7; F6 in phase 1F). */
const BAN_CODES = Object.freeze({ session_not_found: 'ended', user_banned: 'banned' });
/**
 * The classes under which M2 (member_active() without its ban clause) has a sound expectation (review bbe2fbba finding 2):
 * exactly the banned check fails, with member C's own row. That row shows member_active() held without the ban clause, so its
 * session clause held too: member C's session row still existed, and the run is its own session evidence. Under "ended" the
 * session clause refuses member C with or without the ban clause, so no M2 run can show the ban clause is needed.
 */
export const M2_BAN_CLASSES = Object.freeze(['live', 'banned']);
const M2_ENDED = 'M2 has no sound expectation under the "ended" ban answer (GoTrue session_not_found): the ban ended member C\'s session, so the session clause of member_active() refuses its read with or without the ban clause, and no M2 run can show the ban clause is needed; M2 stays refused on this replay (review bbe2fbba finding 2)';

/**
 * GoTrue's answer to the banned member's session, as one class:
 * - live: HTTP 200. The session row is still there, so with the candidate the ban clause refused the read; M2 proves it.
 * - ended: HTTP 403 session_not_found. The ban ended the session, so the session clause refused the read; the claim narrows.
 * - banned: HTTP 403 user_banned (F6; phase 2 attempt 3). GoTrue refused the session because the user is banned. That does
 *   not show whether the session row still exists, so it is neither live nor ended, and M2 has no sound expectation under it.
 * Anything else, in any other shape, is unknown (null): the run stops and is recorded.
 */
export function classifyBan(answer) {
  if (answer === 'HTTP 200') return 'live';
  const refusal = /^HTTP 403 (\{.*\})$/.exec(typeof answer === 'string' ? answer : '');
  if (!refusal) return null;
  let body;
  try { body = JSON.parse(refusal[1]); } catch { return null; }
  if (body === null || typeof body !== 'object' || Array.isArray(body) || !Object.hasOwn(body, 'code') || typeof body.code !== 'string') return null;
  return Object.hasOwn(BAN_CODES, body.code) ? BAN_CODES[body.code] : null;
}

/** The line the runner prints with every verdict under a class whose limit matters, so it is never silent; null otherwise. */
export function banNote(ban) {
  if (ban === 'banned') return '# ban answer "banned" (GoTrue HTTP 403 user_banned): the user is banned, but whether its session row still exists is not shown, so this is neither "live" nor "ended"; RED, GREEN, M1 and M3 do not depend on it, and M2 holds only when exactly "a banned account reads no profile" fails with HTTP 200, 1 row(s): with the ban clause removed, that row shows member C\'s session row still existed';
  if (ban === 'ended') return '# ban answer "ended" (GoTrue HTTP 403 session_not_found): the ban ended member C\'s session, so the session clause refuses its read with or without the ban clause; RED, GREEN, M1 and M3 do not depend on it, but M2 is refused on this replay (review bbe2fbba finding 2), so shared-apply stays blocked here';
  return null;
}

function expectedFailures(expect, ban) {
  switch (expect) {
    case 'red': case 'm1': return [...PROFILE_READ_FAILURES];
    case 'green': return [];
    case 'm2':
      if (M2_BAN_CLASSES.includes(ban)) return [M2_CHECK];
      throw new Error(`M2 has no expectation under the ban answer ${ban}`);
    case 'm3': return ['a deletion-pending account reads no profile'];
    default: throw new Error(`Unknown suite expectation ${expect}`);
  }
}

/** The suite's lines by kind. A `not ok` keeps the detail line printed under it (review bbe2fbba finding 3), or null. */
export function parseSuiteLog(text) {
  const log = { checks: [], bans: [], stops: [], summaries: [], unexpected: [] };
  const lines = String(text).split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const check = /^(ok|not ok) - (.+)$/.exec(line);
    if (!line.trim()) continue;
    if (check) {
      const next = lines[index + 1] ?? '';
      const detail = check[1] === 'not ok' && /^ {2}\S/.test(next) ? next.slice(2) : null;
      log.checks.push({ name: check[2], ok: check[1] === 'ok', detail });
      if (detail !== null) index += 1;
    } else if (AFTER_BAN.test(line)) log.bans.push(AFTER_BAN.exec(line)[1]);
    else if (STOP_LINES.some((rule) => rule.test(line))) log.stops.push(line);
    else if (SUMMARY.test(line)) log.summaries.push(line);
    else log.unexpected.push(line);
  }
  return log;
}

/** Whether every one of the 27 checks ran, once each, in order. */
function completeRun(log) {
  return log.checks.length === IDENTITY_CHECKS.length && log.checks.every((check, index) => check.name === IDENTITY_CHECKS[index]);
}
/**
 * Review 2026-10-26T2000Z finding 1: whether a run is the M2 stop. That is a run in which "a banned account reads no profile"
 * passed: with the ban clause removed, something else refused member C, so no later M2 run on that replay may count. It
 * follows the run alone, whatever GoTrue answered, the reference recorded, the exit code or the other checks, and it reads
 * the raw output, so the runner applies it even to a run whose output it withholds. Review 2026-10-26T2305Z finding 1: it
 * fails closed, so the run need not be complete or in order. A run that printed the banned check ok and then broke off (a
 * logout failure outside check(), or a signal) has already shown it; a setup failure that printed no check has not.
 */
function unkilled(log) {
  return log.checks.some((check) => check.name === M2_CHECK && check.ok);
}
export const m2RunUnkilled = (text) => unkilled(parseSuiteLog(text));

/**
 * The verdict on one suite run. It holds only when all 27 checks ran in order, exactly the expected ones failed, each with the
 * detail line of the caller's own row (review bbe2fbba finding 3), the exit code agrees, the summary matches, GoTrue's ban
 * answer is known (and equals the reference run's), and no setup, cleanup, refusal or signal line appeared. An exit code
 * alone is never a verdict (review 39fe1fb5 finding 3). Under "banned" (F6), RED, GREEN, M1 and M3 keep their exact
 * expectations. M2 holds under "live" or "banned" only on its exact kill; under "ended", M2 never holds (review bbe2fbba
 * finding 2). An M2 run whose banned check passed is never a kill and says to stop, whatever the answer (review
 * 2026-10-26T2000Z finding 1), complete or not (review 2026-10-26T2305Z finding 1).
 */
export function judgeSuite(text, { expect, exitCode, ban: reference = null }) {
  const log = parseSuiteLog(text);
  const problems = [];
  const names = log.checks.map((check) => check.name);
  if (!completeRun(log)) problems.push(`expected the ${IDENTITY_CHECKS.length} identity checks in order, got ${names.length} check line(s)`);
  problems.push(...log.stops.map((line) => `stop line: ${line}`));
  if (log.unexpected.length) problems.push(`${log.unexpected.length} unexpected line(s) in the suite output`);
  const ban = log.bans.length === 1 ? classifyBan(log.bans[0]) : null;
  if (log.bans.length === 1 && ban === null) problems.push(`unrecognised ban answer "${log.bans[0]}": stop and record it`);
  else if (log.bans.length !== 1 && names.length) problems.push(`expected one "after the ban" line, got ${log.bans.length}`);
  if (reference !== null && ban !== null && ban !== reference) problems.push(`the ban answer is ${ban}, but the reference run recorded ${reference}`);
  const failures = log.checks.filter((check) => !check.ok).map((check) => check.name);
  if (expect === 'm2' && ban === null) problems.push('M2 has no expectation without a recognised ban answer');
  else if (expect === 'm2' && !M2_BAN_CLASSES.includes(ban)) problems.push(M2_ENDED); // "ended", the one known class left: fail closed
  else {
    const expected = expectedFailures(expect, ban);
    problems.push(...expectationProblems(expected, failures, exitCode, log.summaries, names.length), ...detailProblems(expected, log.checks));
  }
  // Review 2026-10-26T2000Z finding 1: outside the class branches, so "ended", an unrecognised answer or none stops M2 too.
  if (expect === 'm2' && unkilled(log)) problems.push(M2_UNKILLED);
  return { ok: problems.length === 0, problems, ban, failures };
}

/**
 * Review bbe2fbba finding 3: every expected failure is a profile read that returned the caller's own row, so its detail line
 * must say exactly that. A server error, a refusal or another row count is a failure for another reason, never the expected one.
 */
function detailProblems(expected, checks) {
  return checks.filter((check) => !check.ok && expected.includes(check.name) && check.detail !== PROFILE_ROW_DETAIL)
    .map((check) => `"${check.name}" failed with ${check.detail === null ? 'no detail line' : `"${check.detail}"`}, not "${PROFILE_ROW_DETAIL}" (the caller's own row): a failure for another reason is not the expected one (review bbe2fbba finding 3)`);
}

function expectationProblems(expected, failures, exitCode, summaries, ran) {
  const problems = [];
  const list = (names) => (names.length ? names.join('; ') : 'none');
  if (ran && failures.join('\n') !== expected.join('\n')) problems.push(`expected not ok: ${list(expected)}; got: ${list(failures)}`);
  const exit = expected.length ? 1 : 0;
  if (exitCode !== exit) problems.push(`expected exit ${exit}, got ${exitCode}`);
  const summary = expected.length ? `${expected.length} of ${IDENTITY_CHECKS.length} identity checks failed: ${expected.join('; ')}` : `Local identity integration passed, ${IDENTITY_CHECKS.length} checks: `;
  if (ran && (summaries.length !== 1 || (expected.length ? summaries[0] !== summary : !summaries[0].startsWith(summary)))) problems.push('the summary line does not match');
  return problems;
}

/* ---------------------------------------------------------------- Precondition snapshot ----------------------------- */

const READ_ONLY_COLUMNS = ['default_transaction_read_only', 'transaction_read_only'];
export const P1_COLUMNS = Object.freeze(['table_owner', 'relrowsecurity', 'relforcerowsecurity', 'fn_owner', 'prosecdef', 'provolatile', 'proconfig', 'rolsuper', 'rolbypassrls', 'fn_owner_has_owner_privs', 'fn_definition_md5']);
const P2_COLUMNS = ['policyname', 'permissive', 'roles', 'cmd', 'qual', 'with_check'];
const P3_COLUMNS = ['version', 'name', 'statements_md5'];
const SECTIONS = [['readOnly', READ_ONLY_COLUMNS], ['p1', P1_COLUMNS], ['p2', P2_COLUMNS], ['p3', P3_COLUMNS]];
const SEQUENCE = ['readOnly', 'BEGIN', 'p1', 'p2', 'p3', 'ROLLBACK'];
/** The session proof the read-only runner sends before the file, in the same session (`-c` before `-f -`). */
export const READ_ONLY_PROOF = `select current_setting('default_transaction_read_only') as default_transaction_read_only, current_setting('transaction_read_only') as transaction_read_only`;

/** psql `-A -F |` output of READ_ONLY_PROOF and the phase1.md §7 block, in exactly that shape; anything else throws. */
export function parsePreconditions(text) {
  const sections = {};
  const sequence = [];
  let current = null;
  String(text).split(/\r?\n/).forEach((line, index) => {
    if (current) {
      const footer = /^\((\d+) rows?\)$/.exec(line);
      if (footer) {
        if (Number(footer[1]) !== current.rows.length) throw new Error(`psql output: the ${current.key} footer says ${footer[1]} row(s), but ${current.rows.length} were printed`);
        sections[current.key] = current.rows;
        current = null;
        return;
      }
      const cells = line.split('|');
      if (cells.length !== current.columns.length) throw new Error(`psql output: line ${index + 1} has ${cells.length} cell(s), expected ${current.columns.length}`);
      current.rows.push(Object.fromEntries(current.columns.map((column, at) => [column, cells[at]])));
      return;
    }
    if (!line.trim()) return;
    if (line === 'BEGIN' || line === 'ROLLBACK') { sequence.push(line); return; }
    const section = SECTIONS.find(([, columns]) => columns.join('|') === line);
    if (!section) throw new Error(`psql output: line ${index + 1} is not an expected header or tag`);
    sequence.push(section[0]);
    current = { key: section[0], columns: section[1], rows: [] };
  });
  if (current) throw new Error(`psql output: the ${current.key} result has no row-count footer`);
  if (sequence.join(',') !== SEQUENCE.join(',')) throw new Error(`psql output: the sections came in the order ${sequence.join(', ')}, not ${SEQUENCE.join(', ')}`);
  const [proof] = sections.readOnly;
  if (sections.readOnly.length !== 1 || proof.default_transaction_read_only !== 'on' || proof.transaction_read_only !== 'on') throw new Error(`psql output: the session was not read-only: default_transaction_read_only=${proof?.default_transaction_read_only}, transaction_read_only=${proof?.transaction_read_only}`);
  if (sections.p1.length !== 1) throw new Error(`psql output: P1 has ${sections.p1.length} row(s), expected 1`);
  return { p1: sections.p1[0], p2: sections.p2, p3: sections.p3 };
}

const GUARD = /\bprivate\.member_active\(\)/;
const MD5 = /^[0-9a-f]{32}$/;
const isTrue = (value) => value === 't';
/** `{"search_path=\"\""}` → `search_path=""`; any array of more than that one element stays distinguishable. */
const proconfigSetting = (value) => String(value).replace(/^\{(.*)\}$/, '$1').replace(/^"(.*)"$/, '$1').replace(/\\"/g, '"');

function p1Problems(p1) {
  const problems = [];
  if (!isTrue(p1.prosecdef)) problems.push('P1: member_active() is not security definer');
  if (!isTrue(p1.relrowsecurity)) problems.push('P1: row level security is off on profiles');
  if (p1.provolatile !== 's') problems.push(`P1: member_active() volatility is ${p1.provolatile}, not s`);
  if (proconfigSetting(p1.proconfig) !== 'search_path=""') problems.push('P1: proconfig is not exactly search_path=""');
  if (!(isTrue(p1.rolsuper) || isTrue(p1.rolbypassrls) || (isTrue(p1.fn_owner_has_owner_privs) && p1.relforcerowsecurity === 'f'))) problems.push('P1: the function owner does not bypass row level security on profiles (recursion risk, phase1.md R1)');
  if (!MD5.test(p1.fn_definition_md5)) problems.push('P1: fn_definition_md5 is not an md5');
  return problems;
}
function p2Problems(p2, stage) {
  const names = p2.map((row) => row.policyname);
  if (names.join(',') !== 'profile_read,profile_update') return [`P2: the policies are ${names.join(', ') || 'none'}, not profile_read and profile_update`];
  const [read, update] = p2;
  const problems = p2.filter((row) => row.permissive !== 'PERMISSIVE' || row.roles !== '{authenticated}').map((row) => `P2: ${row.policyname} is not PERMISSIVE for {authenticated}`);
  if (read.cmd !== 'SELECT' || read.with_check !== '') problems.push('P2: profile_read is not a SELECT policy without with_check');
  if (stage && GUARD.test(read.qual) !== (stage === 'after')) problems.push(stage === 'after' ? 'P2: profile_read does not call member_active()' : 'P2: profile_read already calls member_active()');
  if (update.cmd !== 'UPDATE' || !GUARD.test(update.qual) || !GUARD.test(update.with_check)) problems.push('P2: profile_update is not an UPDATE policy guarded by member_active()');
  return problems;
}
function p3Problems(p3, expected) {
  const problems = [];
  const rows = expected.map((file) => { const [, version, name] = /^(\d{14})_(.+)\.sql$/.exec(file); return `${version}|${name}`; });
  if (p3.map((row) => `${row.version}|${row.name}`).join(',') !== rows.join(',')) problems.push(`P3: the ${p3.length} applied migration(s) are not the ${rows.length} expected`);
  if (p3.some((row) => !MD5.test(row.statements_md5))) problems.push('P3: a statements_md5 is not an md5');
  return problems;
}

/** phase1.md §7's rules. stage 'before' or 'after' the candidate; migrations is every replayed file name, candidate included. */
export function preconditionProblems({ p1, p2, p3 }, { stage, migrations }) {
  const expected = stage === 'after' ? [...migrations] : migrations.filter((file) => file !== CANDIDATE);
  return [...p1Problems(p1), ...p2Problems(p2, stage), ...(stage ? p3Problems(p3, expected) : [])];
}

function diffRows(label, before, after, key, columns) {
  const index = (rows) => new Map(rows.map((row) => [row[key], row]));
  const [left, right] = [index(before), index(after)];
  const changes = [];
  for (const [id, row] of left) {
    const other = right.get(id);
    if (!other) changes.push(`${label}.-${id}`);
    else for (const column of columns) if (row[column] !== other[column]) changes.push(`${label}.${id}.${column}`);
  }
  for (const id of right.keys()) if (!left.has(id)) changes.push(`${label}.+${id}`);
  return changes;
}
/** Every difference between two snapshots, named P1.<column>, P2.<policy>.<column> or P3.<version>, with +/- for rows. */
export function diffSnapshots(a, b) {
  return [...P1_COLUMNS.filter((column) => a.p1[column] !== b.p1[column]).map((column) => `P1.${column}`),
    ...diffRows('P2', a.p2, b.p2, 'policyname', P2_COLUMNS), ...diffRows('P3', a.p3, b.p3, 'version', P3_COLUMNS)];
}

/**
 * What each labelled snapshot must show, against its reference. A mutation is proved applied only when exactly its own
 * part changed; a restore only when nothing differs from the GREEN reference (review 39fe1fb5 finding 3).
 */
export const SNAPSHOT_RULES = Object.freeze({
  before: { stage: 'before', reference: null, changes: [] },
  after: { stage: 'after', reference: 'before', changes: ['P2.profile_read.qual', `P3.+${CANDIDATE_VERSION}`] },
  m1: { stage: null, reference: 'after', changes: ['P2.profile_read.qual'] },
  m2: { stage: 'after', reference: 'after', changes: ['P1.fn_definition_md5'] },
  m3: { stage: 'after', reference: 'after', changes: ['P1.fn_definition_md5'] },
  restored: { stage: 'after', reference: 'after', changes: [] },
  fresh16: { stage: 'after', reference: 'after', changes: [] },
  '55321-before': { stage: 'before', reference: 'before', changes: [] },
  '55321-after': { stage: 'after', reference: 'after', changes: [] },
});
export function snapshotVerdict(label, snapshot, { references, migrations }) {
  const rule = SNAPSHOT_RULES[label];
  if (!rule) throw new Error(`Unknown snapshot label ${label}`);
  const problems = rule.stage ? preconditionProblems(snapshot, { stage: rule.stage, migrations }) : p1Problems(snapshot.p1);
  if (!rule.reference) return { changes: [], problems };
  const reference = references[rule.reference];
  if (!reference) return { changes: [], problems: [...problems, `there is no "${rule.reference}" snapshot to compare with`] };
  const changes = diffSnapshots(reference, snapshot);
  const show = (list) => `[${list.length ? list.join(', ') : 'none'}]`;
  if (changes.join(',') !== rule.changes.join(',')) problems.push(`changes from ${rule.reference} are ${show(changes)}, expected ${show(rule.changes)}`);
  return { changes, problems };
}

/* ---------------------------------------------------------------- Service images ------------------------------------ */

/** `docker ps --format '{{.Names}} {{.Image}}'`: db, auth and REST must run the same image on both stacks (finding 4). */
export function imageProblems(text, replayProjectId, { sharedProjectId = 'fitlog_rebuild_20261017', services = ['db', 'auth', 'rest'] } = {}) {
  const images = new Map(String(text).split(/\r?\n/).filter((line) => line.trim()).map((line) => {
    const at = line.indexOf(' ');
    return at < 0 ? [line.trim(), ''] : [line.slice(0, at), line.slice(at + 1).trim()];
  }));
  const problems = [];
  const pairs = [];
  for (const service of services) {
    const replay = images.get(`supabase_${service}_${replayProjectId}`);
    const shared = images.get(`supabase_${service}_${sharedProjectId}`);
    if (!replay || !shared) problems.push(`${service}: no running ${replay ? 'shared' : 'replay'} container`);
    else if (replay !== shared) problems.push(`${service}: the replay runs ${replay}, the shared stack ${shared}`);
    else pairs.push(`${service} ${replay}`);
  }
  return { problems, pairs };
}

/* ---------------------------------------------------------------- Read-only SQL ------------------------------------- */

const FORBIDDEN_WORDS = new Set(['abort', 'alter', 'analyze', 'begin', 'call', 'checkpoint', 'close', 'cluster', 'comment', 'commit', 'copy', 'create', 'deallocate', 'declare', 'delete', 'discard', 'do', 'drop', 'end', 'execute', 'explain', 'fetch', 'for', 'grant', 'import', 'insert', 'into', 'listen', 'load', 'lock', 'merge', 'move', 'notify', 'prepare', 'reassign', 'refresh', 'reindex', 'release', 'reset', 'revoke', 'rollback', 'savepoint', 'set', 'start', 'truncate', 'unlisten', 'update', 'vacuum']);
// The second line names functions that run SQL text given as a string, which the check skips (review a102fb68 finding 3).
const FORBIDDEN_FUNCTIONS = new RegExp(`^(${[
  'set_config|pg_terminate_backend|pg_cancel_backend|pg_reload_conf|pg_rotate_logfile|pg_promote|pg_switch_wal|pg_sleep\\w*|pg_advisory\\w*|pg_try_advisory\\w*|pg_notify|dblink\\w*|lo_\\w+|pg_read_\\w*file|pg_ls_\\w+|pg_stat_file|pg_file_\\w+|nextval|setval|txid_current\\w*|pg_current_xact_id\\w*|pg_export_snapshot|pg_logical_\\w+|pg_replication_\\w+|pg_create_\\w+|pg_drop_\\w+',
  '(query|cursor|table|schema|database)_to_xml\\w*|ts_stat',
].join('|')})$`);

function quoted(text, start, quote, backslashEscapes) {
  for (let at = start + 1; at < text.length; at += 1) {
    if (backslashEscapes && text[at] === '\\') at += 1;
    else if (text[at] === quote && text[at + 1] === quote) at += 1;
    else if (text[at] === quote) return at + 1;
  }
  throw new Error(`an unterminated ${quote === "'" ? 'string' : 'quoted identifier'}`);
}
/**
 * The statements of a SQL text as lists of lower-case words, with strings and -- comments skipped. A quoted identifier is
 * a word too (its text, lower-cased), so `"pg_terminate_backend"(…)` cannot hide a function name.
 */
function statements(text) {
  const result = [];
  let words = [];
  for (let at = 0; at < text.length;) {
    const char = text[at];
    if (char === '-' && text[at + 1] === '-') { const end = text.indexOf('\n', at); at = end < 0 ? text.length : end; }
    else if (char === '/' && text[at + 1] === '*') throw new Error('block comments are not allowed');
    else if (char === '\\') throw new Error('psql meta-commands (a backslash outside a string) are not allowed');
    else if (char === '$') throw new Error('dollar quoting and parameters are not allowed');
    else if (char === ':' && text[at + 1] === ':') at += 2;
    else if (char === ':') throw new Error('psql variables (:name) are not allowed');
    else if (char === "'") at = quoted(text, at, "'", false);
    else if (char === '"') { const end = quoted(text, at, '"', false); words.push(text.slice(at + 1, end - 1).replaceAll('""', '"').toLowerCase()); at = end; }
    else if (char === ';') { result.push(words); words = []; at += 1; }
    else if (/[A-Za-z_]/.test(char)) {
      const word = /^[A-Za-z_][A-Za-z0-9_]*/.exec(text.slice(at))[0];
      at += word.length;
      if (/^e$/i.test(word) && text[at] === "'") at = quoted(text, at, "'", true);
      else words.push(word.toLowerCase());
    } else at += 1;
  }
  if (words.length) result.push(words);
  return result;
}

/**
 * Why a file may not run through the read-only runner, or nothing. It must be exactly `begin transaction read only;`,
 * queries that start with select or with, and `rollback;`, with no transaction control, write, setting change, side-effect
 * function, psql meta-command or variable anywhere (review 39fe1fb5 finding 6). The runner also sets the session default
 * to read-only, so this check is a second, independent barrier.
 */
export function readOnlySqlProblems(text) {
  let parsed;
  try { parsed = statements(String(text)); } catch (error) { return [`the SQL is refused: ${error.message}`]; }
  const problems = [];
  const lines = String(text).split('\n').map((line) => line.trim()).filter(Boolean);
  if (lines[0]?.toLowerCase() !== 'begin transaction read only;') problems.push('the first line is not "begin transaction read only;"');
  if (lines.at(-1)?.toLowerCase() !== 'rollback;') problems.push('the last line is not "rollback;"');
  const last = parsed.length > 1 ? parsed.at(-1) : undefined;
  const middle = parsed.slice(1, -1);
  if (parsed[0]?.join(' ') !== 'begin transaction read only') problems.push('the first statement is not "begin transaction read only"');
  if (last?.join(' ') !== 'rollback') problems.push('the last statement is not "rollback"');
  if (problems.length) return problems;
  if (!middle.length) problems.push('there is no query between begin and rollback');
  middle.forEach((words, index) => {
    const reasons = [];
    if (!['select', 'with'].includes(words[0])) reasons.push(`statement ${index + 2} does not start with select or with`);
    const bad = [...new Set(words.filter((word) => FORBIDDEN_WORDS.has(word) || FORBIDDEN_FUNCTIONS.test(word)))];
    if (bad.length) reasons.push(`statement ${index + 2} uses ${bad.join(', ')}`);
    if (reasons.length) problems.push(reasons.join('; '));
  });
  return problems;
}

/* ---------------------------------------------------------------- Generated SQL ------------------------------------- */

/** The `sql preconditions` block of phase1.md §7, verbatim. */
export function extractPreconditions(markdown) {
  const blocks = [...String(markdown).matchAll(/^```sql preconditions\n([\s\S]*?)^```$/gm)];
  if (blocks.length !== 1) throw new Error(`phase1.md must hold exactly one sql preconditions block (it holds ${blocks.length})`);
  return blocks[0][1];
}

const swap = (text, from, to) => {
  if (text.split(from).length !== 2) throw new Error(`expected exactly one "${from}"`);
  return text.replace(from, () => to);
};
/** M1-M3 and the restore, generated from the committed candidate and member_core.sql lines 24-31 (phase2-plan §4). */
export function mutationSql({ candidate, memberCore }) {
  const fn = `${memberCore.split('\n').slice(23, 31).join('\n')}\n`;
  if (!fn.startsWith('create function private.member_active() returns boolean') || !fn.endsWith('$$;\n')) throw new Error('member_core.sql lines 24-31 are no longer private.member_active()');
  const restore = swap(fn, 'create function', 'create or replace function');
  return {
    'sql/m1.sql': swap(candidate, ' and (select private.member_active())', ''),
    'sql/m2.sql': swap(restore, ' and (u.banned_until is null or u.banned_until < now())', ''),
    'sql/m3.sql': swap(restore, "p.status='active'", "p.status in ('active','deletion_pending')"),
    'sql/restore-member-active.sql': restore,
  };
}
