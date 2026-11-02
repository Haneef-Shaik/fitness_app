import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { invokedDirectly, LOCAL_API_URL, REPO_ROOT, spawnRunner } from './local-stack.mjs';

// MB-1 box 3: a revoked session fails on its next request, and a member reads only their own profile. Every identity and
// profile request path a client can reach is probed: GoTrue, PostgREST table and RPC, and the private schema. GraphQL is
// closed today, so it gets a tripwire, not a test. Runs on an isolated LOCAL stack only: this project's at LOCAL_API_URL,
// or a disposable loopback replay project that a caller passes to main(). Every account is disposable and deleted here.
// The status output holds keys and is never printed, not even when it fails; failure lines show only an HTTP status, an
// error code and a row count.

const LOOPBACK_API = /^http:\/\/127\.0\.0\.1:\d{1,5}$/;
const WITHHELD = 'its output is withheld because it holds keys';
// verify.mjs's owner tables, children first: a regression that lets a refused request write a row cannot leak a fixture.
const OWNER_TABLES = ['mutation_outcomes', 'workout_revisions', 'performed_sets', 'workout_sessions', 'body_entries', 'goals', 'meal_items', 'nutrition_targets', 'schedule_occurrences', 'programme_schedules', 'programmes', 'foods', 'exercises'];
const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());

/**
 * The checked target and its keys, refused as local-stack.mjs's localDatabase refuses: a loopback expected URL, `supabase
 * status` for that project with no shell, and exactly that API URL. A failed, unparsable or keyless status is refused
 * without any of its output. `run` may answer synchronously or with a promise; `cli` is the command that runs the Supabase
 * CLI (the replay runner passes its installed executable and its own guarded executor: review a102fb68 findings 1 and 5).
 */
export async function stackStatus({ projectDir = REPO_ROOT, expectedApiUrl = LOCAL_API_URL, run = spawnRunner, cli = ['pnpm', 'exec', 'supabase'] } = {}) {
  if (!LOOPBACK_API.test(expectedApiUrl)) throw new Error(`The expected API URL ${expectedApiUrl} is not a loopback http://127.0.0.1:<port> URL; refusing`);
  if (!Array.isArray(cli) || !cli.length || !cli.every((part) => typeof part === 'string' && part)) throw new Error('The Supabase CLI command must be a list of non-empty strings; refusing');
  const out = await run(cli[0], [...cli.slice(1), 'status', '-o', 'json', '--workdir', projectDir], { cwd: REPO_ROOT });
  if (out.status !== 0) throw new Error(`supabase status ${out.status === null ? `did not run (${out.error})` : `failed (exit ${out.status})`}; ${WITHHELD}`);
  let status;
  try { status = JSON.parse(out.stdout); } catch { throw new Error(`supabase status -o json did not print JSON; ${WITHHELD}`); }
  if (status?.API_URL !== expectedApiUrl) throw new Error(`Refusing to run against ${typeof status?.API_URL === 'string' ? status.API_URL : '(no API_URL)'}: expected ${expectedApiUrl}, the isolated local stack`);
  if (![status.PUBLISHABLE_KEY, status.SECRET_KEY].every((key) => typeof key === 'string' && key)) throw new Error(`supabase status did not print both API keys; ${WITHHELD}`);
  return { apiUrl: status.API_URL, publishableKey: status.PUBLISHABLE_KEY, secretKey: status.SECRET_KEY };
}

function brief({ status: http, data }) {
  if (Array.isArray(data)) return `HTTP ${http}, ${data.length} row(s)`;
  return `HTTP ${http} ${JSON.stringify({ code: data?.error_code ?? data?.code ?? null, message: data?.message ?? data?.msg ?? data?.errors?.[0]?.message ?? null })}`;
}
function refused(result, http, code) { assert.equal(result.status, http, brief(result)); assert.equal(result.data?.error_code ?? result.data?.code, code, brief(result)); }
function noRows(result) { assert.equal(result.status, 200, brief(result)); assert.deepEqual(result.data, [], brief(result)); }
const onboarding = (dob) => ({ p_name: 'Identity fixture', p_dob: dob, p_timezone: 'Asia/Kolkata', p_locale: 'en', p_terms: 'test-notice', p_privacy: 'test-notice' });

/** Resolves when every promise has settled, or after `ms`, whichever comes first. Never rejects. */
function settleWithin(promises, ms) {
  if (!promises.length) return Promise.resolve();
  let timer;
  const timeout = new Promise((resolve) => { timer = setTimeout(resolve, ms); });
  return Promise.race([Promise.allSettled(promises), timeout]).finally(() => clearTimeout(timer));
}

/** Deletes this run's own owner rows and accounts, and nothing else. Every failure is named; returns whether all succeeded. */
async function removeFixtures(call, users, io) {
  if (!users.length) return true;
  const filter = encodeURIComponent(`in.(${users.join(',')})`);
  let clean = true;
  const attempt = async (label, path) => {
    const result = await call(path, { method: 'DELETE', admin: true }).catch((error) => ({ ok: false, reason: error.message }));
    if (!result.ok) { clean = false; io.stderr.write(`Fixture cleanup needs attention: ${label} (${result.reason ?? brief(result)})\n`); }
  };
  for (const table of OWNER_TABLES) await attempt(table, `/rest/v1/${table}?owner_id=${filter}`);
  for (const user of users) await attempt(`account ${user}`, '/auth/v1/admin/users/' + user);
  return clean;
}

/**
 * Every check, in order, on fixtures it creates. Returns the exit code; a setup failure throws after cleanup. `send` is
 * fetch, `signals` emits SIGINT and SIGTERM, `exit` is called after a signal's cleanup (process.exit standalone; a function
 * that does nothing inside the replay runner), and `runId` goes into every fixture email, so an account whose creation never
 * answered can still be found by name. After a signal's cleanup this returns (by throwing) even if a request never
 * answers, and that request is aborted, so the runner can print and record the cleanup (review a102fb68 finding 2).
 */
async function identitySuite({ apiUrl, publishableKey, secretKey }, io, { send, signals, exit, settleMs, runId }) {
  const log = (line) => io.stdout.write(`${line}\n`);
  const users = []; const results = [];
  // After a stop signal no new request starts except cleanup's, and cleanup first waits for creations in flight.
  let stopping = false;
  const creating = new Map(); // email -> { label, done }: account creations still in flight
  const unanswered = []; // { label, email }: creations whose request failed, so the account may exist
  const requests = new AbortController(); // aborts every request but cleanup's, once a signal's cleanup has run
  let halt;
  const halted = new Promise((resolve, reject) => { halt = reject; });
  halted.catch(() => { /* only ever raced against the checks below, which handle it */ });
  async function call(path, { method = 'GET', body, token, admin = false, headers = {}, cleanup = false } = {}) {
    if (stopping && !cleanup) throw new Error('stopping: this run was interrupted');
    const response = await send(apiUrl + path, { method, headers: { apikey: admin ? secretKey : publishableKey, ...(token ? { Authorization: `Bearer ${token}` } : {}), 'Content-Type': 'application/json', Prefer: 'return=representation', ...headers }, ...(body ? { body: JSON.stringify(body) } : {}), ...(cleanup ? {} : { signal: requests.signal }) });
    const text = await response.text(); let data = null; try { data = text ? JSON.parse(text) : null; } catch { data = text; }
    return { ok: response.ok, status: response.status, data };
  }
  const rpc = (name, body, token, headers) => call('/rest/v1/rpc/' + name, { method: 'POST', body, token, headers });
  async function signIn(email, password) {
    const login = await call('/auth/v1/token?grant_type=password', { method: 'POST', body: { email, password } });
    assert.equal(login.ok, true, `Fixture sign-in failed: HTTP ${login.status}`); return login.data.access_token;
  }
  async function account(label, letter) {
    if (stopping) throw new Error(`stopping: the ${label} fixture was not created`);
    const email = `fitlog-mb1-identity-${runId}-${letter}@example.invalid`; const password = randomUUID() + 'aA1!';
    // The id is recorded the moment the answer arrives, before any assertion, so cleanup always sees it.
    const done = call('/auth/v1/admin/users', { method: 'POST', admin: true, body: { email, password, email_confirm: true } }).then(
      (created) => { creating.delete(email); if (created.ok && typeof created.data?.id === 'string') users.push(created.data.id); return created; },
      (error) => { creating.delete(email); unanswered.push({ label, email }); throw error; });
    creating.set(email, { label, done });
    const created = await done;
    assert.equal(created.ok, true, `Creating the ${label} fixture failed: ${brief(created)}`);
    if (stopping) throw new Error(`stopping: the ${label} fixture was created after the stop signal; cleanup removes it`);
    return { id: created.data.id, label, signIn: () => signIn(email, password) };
  }
  async function check(name, run) {
    try { await run(); results.push({ name, ok: true }); log(`ok - ${name}`); } catch (error) {
      if (stopping) throw error;
      results.push({ name, ok: false }); log(`not ok - ${name}\n  ${String(error.message).split('\n')[0]}`);
    }
  }
  const profile = (user, token) => call(`/rest/v1/profiles?id=eq.${user.id}&select=id,display_name,status`, { token });
  const stored = async (user) => (await call(`/rest/v1/profiles?id=eq.${user.id}&select=id,display_name,status`, { admin: true })).data;
  const rename = (user, token) => call(`/rest/v1/profiles?id=eq.${user.id}`, { method: 'PATCH', token, body: { display_name: 'Changed by another request' } });
  const graphql = (token) => call('/graphql/v1', { method: 'POST', token, body: { query: '{ profilesCollection { edges { node { id } } } }' } });
  const bodyEntry = (user, token) => call('/rest/v1/body_entries', { method: 'POST', token, body: { id: randomUUID(), owner_id: user.id, measured_at: new Date().toISOString(), local_date: today, timezone: 'Asia/Kolkata', weight_kg: 80 } });
  async function logout(token, scope) { const out = await call(`/auth/v1/logout?scope=${scope}`, { method: 'POST', token }); assert.equal(out.status, 204, `Logout (${scope}) failed: ${brief(out)}`); }
  async function setStatus(user, status) { const out = await call(`/rest/v1/profiles?id=eq.${user.id}`, { method: 'PATCH', admin: true, body: { status } }); assert.equal(out.data?.[0]?.status, status, `Setting ${user.label} to ${status} failed: ${brief(out)}`); }
  function unchanged(rows, user) { assert.equal(rows[0]?.id, user.id, 'The fixture profile is missing'); assert.equal(rows[0].display_name, 'Identity fixture', 'The profile was changed'); }

  // Ctrl-C or a kill still removes this run's fixtures; a second signal exits at once. Cleanup runs once: it stops new
  // requests, waits up to settleMs for creations in flight, deletes every account it knows, and names any account whose
  // creation never answered (review 39fe1fb5 finding 5). Then it aborts what is still in flight, ends the checks (halt),
  // and calls exit.
  let removal;
  const cleanup = () => (removal ??= (async () => {
    stopping = true;
    await settleWithin([...creating.values()].map((creation) => creation.done), settleMs);
    let clean = await removeFixtures((path, options) => call(path, { ...options, cleanup: true }), users, io);
    const unknown = [...unanswered.map((entry) => ({ ...entry, why: 'its creation request did not complete' })), ...[...creating.entries()].map(([email, { label }]) => ({ label, email, why: 'its creation did not finish' }))];
    for (const { label, email, why } of unknown) { clean = false; io.stderr.write(`Fixture cleanup needs attention: the ${label} account (${email}) may exist; ${why}\n`); }
    return clean;
  })());
  const interrupted = (signal) => {
    io.stderr.write(`${signal}: removing this run's fixtures\n`);
    cleanup().finally(() => { requests.abort(); halt(new Error(`stopping: this run was interrupted by ${signal}`)); exit(signal === 'SIGINT' ? 130 : 143); });
  };
  signals.once('SIGINT', interrupted); signals.once('SIGTERM', interrupted);
  let code = 1;
  try {
    code = await Promise.race([checks(), halted]);
  } finally {
    signals.off('SIGINT', interrupted); signals.off('SIGTERM', interrupted);
    if (!(await cleanup()) && code === 0) { io.stderr.write('The checks passed, but fixture cleanup failed, so this run fails\n'); code = 1; }
  }
  return code;

  /** The checks themselves; returns the exit code. */
  async function checks() {
    const a = await account('member A', 'a'); const b = await account('member B', 'b'); const c = await account('member C', 'c');
    const a1 = await a.signIn(); const a2 = await a.signIn(); const a3 = await a.signIn(); const b1 = await b.signIn(); const c1 = await c.signIn();
    for (const [user, token] of [[a, a1], [b, b1]]) { const done = await rpc('complete_onboarding', onboarding('1995-01-01'), token); assert.equal(done.ok, true, `Onboarding ${user.label} failed: ${brief(done)}`); }
    const entry = await bodyEntry(a, a1); assert.equal(entry.ok, true, `Member A's body entry failed: ${brief(entry)}`);

    // Ownership: one member never reads or changes another member's profile.
    await check('a live session reads its own profile', async () => assert.deepEqual((await profile(a, a1)).data?.map((row) => row.id), [a.id]));
    await check("a guessed ID of another member's profile returns no row", async () => noRows(await profile(a, b1)));
    await check('an unfiltered profile read returns only the caller', async () => assert.deepEqual((await call('/rest/v1/profiles?select=id', { token: b1 })).data?.map((row) => row.id), [b.id]));
    await check("another member's profile cannot be updated", async () => { noRows(await rename(a, b1)); unchanged(await stored(a), a); });
    await check('the anonymous role cannot read profiles', async () => refused(await call('/rest/v1/profiles?select=id'), 401, '42501'));

    // Onboarding bypass: the adult check and notice versions are written only by the checked definer, on a live session.
    // Member C has no profile yet.
    await check('a member cannot insert their own profile directly', async () => {
      refused(await call('/rest/v1/profiles', { method: 'POST', token: c1, body: { id: c.id, display_name: 'Bypass', date_of_birth: '2015-01-01', terms_version: 'x', privacy_version: 'x' } }), 403, '42501');
      assert.deepEqual(await stored(c), []);
    });
    await check('the private onboarding definer is not reachable over the API', async () => { refused(await rpc('complete_onboarding', onboarding('2015-01-01'), c1, { 'Content-Profile': 'private' }), 406, 'PGRST106'); assert.deepEqual(await stored(c), []); });
    await logout(c1, 'local');
    await check('a session revoked before onboarding cannot complete it', async () => { refused(await rpc('complete_onboarding', onboarding('1995-01-01'), c1), 403, '42501'); assert.deepEqual(await stored(c), []); });
    const c2 = await c.signIn();
    await check('a new session of the same account can complete onboarding', async () => { const done = await rpc('complete_onboarding', onboarding('1995-01-01'), c2); assert.equal(done.ok, true, brief(done)); });

    // A disabled account keeps its session but reads and writes no protected data (PRD 5.1).
    await setStatus(b, 'disabled');
    await check('a disabled account reads no profile', async () => noRows(await profile(b, b1)));
    await check('a disabled account cannot update its profile', async () => { noRows(await rename(b, b1)); unchanged(await stored(b), b); });
    await check('a disabled account cannot re-run onboarding', async () => refused(await rpc('complete_onboarding', onboarding('1995-01-01'), b1), 403, '42501'));
    // Deletion revokes access at once (PRD 22.3). B's session is still live, so only the profile status can refuse it.
    await setStatus(b, 'deletion_pending');
    await check('a deletion-pending account reads no profile', async () => noRows(await profile(b, b1)));
    // A banned account (auth.users.banned_until) reads no profile. The run prints GoTrue's answer to C's session after the
    // ban: if the session is still live, the ban itself refused the read; if GoTrue ended it, the session check did.
    await check('an active account reads its own profile before it is banned', async () => assert.deepEqual((await profile(c, c2)).data?.map((row) => row.id), [c.id]));
    const ban = await call('/auth/v1/admin/users/' + c.id, { method: 'PUT', admin: true, body: { ban_duration: '1h' } });
    assert.ok(ban.ok && Date.parse(ban.data?.banned_until) > Date.now(), `Banning member C failed: ${ban.ok ? 'the reply has no future banned_until' : brief(ban)}`);
    const afterBan = await call('/auth/v1/user', { token: c2 });
    log(`# after the ban, GoTrue answers member C's session with ${afterBan.ok ? `HTTP ${afterBan.status}` : brief(afterBan)}`);
    await check('a banned account reads no profile', async () => noRows(await profile(c, c2)));

    // One revoked session: its still-unexpired access token fails on the next request, on every path.
    await logout(a1, 'local');
    await check('the auth server rejects a revoked session', async () => refused(await call('/auth/v1/user', { token: a1 }), 403, 'session_not_found'));
    await check('a revoked session reads no profile', async () => noRows(await profile(a, a1)));
    await check('a revoked session cannot update its profile', async () => { noRows(await rename(a, a1)); unchanged(await stored(a), a); });
    await check('a revoked session cannot complete onboarding', async () => refused(await rpc('complete_onboarding', onboarding('1995-01-01'), a1), 403, '42501'));
    await check('a revoked session cannot start a sync', async () => refused(await rpc('refresh_schedules_v1', {}, a1), 403, '42501'));
    await check('a revoked session reads no personal rows', async () => noRows(await call('/rest/v1/body_entries?select=id', { token: a1 })));
    await check('a revoked session cannot write personal rows', async () => refused(await bodyEntry(a, a1), 403, '42501'));
    await check("revoking one session leaves the account's other sessions live", async () => {
      assert.deepEqual((await profile(a, a2)).data?.map((row) => row.id), [a.id]);
      assert.equal((await call('/rest/v1/body_entries?select=id', { token: a2 })).data?.length, 1);
    });

    // Revoking the other sessions from one device (PRD 5.1, security settings).
    await logout(a2, 'others');
    await check('the auth server rejects a session revoked from another device', async () => refused(await call('/auth/v1/user', { token: a3 }), 403, 'session_not_found'));
    await check('a session revoked from another device reads no profile', async () => noRows(await profile(a, a3)));
    await check('the revoking session stays live', async () => assert.deepEqual((await profile(a, a2)).data?.map((row) => row.id), [a.id]));
    // Tripwire, not a GraphQL test: with pg_graphql off, GraphQL serves nothing on any session. If it is ever enabled,
    // profilesCollection becomes a profile path, and this fails until live and revoked-session checks for it are added.
    await check('tripwire: GraphQL is closed (pg_graphql is not enabled)', async () => { const live = await graphql(a2); assert.equal(live.data?.errors?.[0]?.message, 'pg_graphql extension is not enabled.', `GraphQL now answers (${brief(live)}); add live and revoked-session profile checks for it`); });

    const failures = results.filter((result) => !result.ok).map((result) => result.name);
    if (failures.length) log(`\n${failures.length} of ${results.length} identity checks failed: ${failures.join('; ')}`);
    else log(`\nLocal identity integration passed, ${results.length} checks: profile ownership; no direct or private onboarding path; disabled, deletion-pending and banned accounts and revoked sessions refused on GoTrue and PostgREST; GraphQL closed (tripwire).`);
    return failures.length ? 1 : 0;
  }
}

/**
 * Runs the suite on the checked target and returns the exit code. Options: projectDir and expectedApiUrl (a loopback
 * replay project), run and cli, for the status step; fetch, signals, exit, settleMs and runId. The replay runner passes
 * its own run, cli, signals and an exit that does nothing; unit tests inject the rest.
 */
export async function main({ io = process, fetch: send = globalThis.fetch, signals = process, exit = (code) => process.exit(code), settleMs = 30_000, runId = randomUUID(), ...options } = {}) {
  let target;
  try { target = await stackStatus(options); } catch (error) { io.stderr.write(`verify-identity refused: ${error.message}\n`); return 1; }
  try { return await identitySuite(target, io, { send, signals, exit, settleMs, runId }); } catch (error) { io.stderr.write(`verify-identity setup failed: ${String(error?.message ?? error).split('\n')[0]}\n`); return 1; }
}
if (invokedDirectly(import.meta.url)) process.exitCode = await main();
