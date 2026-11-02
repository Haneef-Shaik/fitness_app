// MB-1 replay runner tests: SF-7's pure binding parser and route proof (review 2026-10-27T0405Z finding 1, the scope of review
// 2026-10-27T0605Z). Fixtures only: no live `docker inspect` output has been read, so the label key and the shape of an
// IPv4-plus-IPv6 pair are unconfirmed, and such a pair is refused (fail closed) until a reviewed first live read says otherwise.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { test } from 'node:test';
import { BINDING_FORMAT, BINDING_LABEL, bindingArgs, bindingLine, bindingProblems, bindingResult, replayBinding, routeProof, SHARED_BINDING } from './mb1-replay-binding.mjs';
import { CANDIDATE } from './mb1-replay-evidence.mjs';
import { replayTarget } from './mb1-replay-target.mjs';
import { BASE, bindingOutput, cliTable, DIR, failed, MIGRATIONS, ok, version } from './mb1-replay-test-harness.mjs';

const DB = 'supabase_db_fitlog_rebuild_20261017';
const KONG = 'supabase_kong_fitlog_rebuild_20261017';
const id = (seed) => createHash('sha256').update(seed).digest('hex');
const line = (name, label, ports, cid = id(name)) => `${cid}|/${name}|${label}|${JSON.stringify(ports)}`;
const dbLine = (ports, label = 'fitlog_rebuild_20261017') => line(DB, label, ports);
const KONG_LINE = line(KONG, 'fitlog_rebuild_20261017', { '8000/tcp': [{ HostIp: '127.0.0.1', HostPort: '55321' }], '8443/tcp': null });
const at = (hostIp, hostPort) => ({ HostIp: hostIp, HostPort: hostPort });
const parse = (stdout) => bindingProblems(stdout, SHARED_BINDING);

test('SF-7: the binding inspect is one docker inspect of the database and Kong containers with a fixed format', () => {
  assert.equal(BINDING_LABEL, 'com.supabase.cli.project');
  assert.equal(BINDING_FORMAT, '{{.Id}}|{{.Name}}|{{index .Config.Labels "com.supabase.cli.project"}}|{{json .NetworkSettings.Ports}}');
  // SF-7b (review 2026-10-27T0905Z L2): --type container, so a missing container never falls through to a same-named volume.
  assert.deepEqual(bindingArgs(SHARED_BINDING), ['inspect', '--type', 'container', '--format', BINDING_FORMAT, DB, KONG]);
  assert.deepEqual(JSON.parse(JSON.stringify(SHARED_BINDING)), {
    projectId: 'fitlog_rebuild_20261017',
    containers: [{ name: DB, port: '5432/tcp', hostPort: '55322' }, { name: KONG, port: '8000/tcp', hostPort: '55321' }],
  });
  assert.ok(Object.isFrozen(SHARED_BINDING) && Object.isFrozen(SHARED_BINDING.containers) && SHARED_BINDING.containers.every(Object.isFrozen));
  assert.equal(bindingLine(SHARED_BINDING), `# Docker publishes ${DB} 5432/tcp only at 55322 and ${KONG} 8000/tcp only at 55321 (on 127.0.0.1 or 0.0.0.0), each labelled com.supabase.cli.project=fitlog_rebuild_20261017`);
});

test('SF-7: the shared binding holds only for the project label, 5432/tcp only at 55322 and Kong 8000/tcp only at 55321', () => {
  for (const hostIp of ['127.0.0.1', '0.0.0.0']) {
    const result = parse(bindingOutput({ hostIp }));
    assert.deepEqual(result.problems, [], hostIp);
    assert.equal(result.value, `${id(`db_fitlog_rebuild_20261017`)} ${DB} fitlog_rebuild_20261017 5432/tcp=${hostIp}:55322; ${id(`kong_fitlog_rebuild_20261017`)} ${KONG} fitlog_rebuild_20261017 8000/tcp=${hostIp}:55321`);
    // SF-7b (L2): the proven IDs by container name, which the 55321 snapshots exec instead of the name.
    assert.deepEqual(result.ids, { [DB]: id('db_fitlog_rebuild_20261017'), [KONG]: id('kong_fitlog_rebuild_20261017') }, hostIp);
    assert.ok(Object.isFrozen(result.ids), hostIp);
  }
  assert.deepEqual(parse(bindingOutput({ seed: 'replaced' })).ids, { [DB]: id('replaceddb_fitlog_rebuild_20261017'), [KONG]: id('replacedkong_fitlog_rebuild_20261017') });
  // CRLF line ends, no final newline, two equal entries and other exposed ports left unpublished are the same binding.
  assert.deepEqual(parse(bindingOutput().replace(/\n/g, '\r\n')).problems, []);
  assert.deepEqual(parse(bindingOutput().trimEnd()).problems, []);
  assert.deepEqual(parse(`${dbLine({ '5432/tcp': [at('0.0.0.0', '55322'), at('127.0.0.1', '55322')], '9187/tcp': [] })}\n${KONG_LINE}\n`).problems, []);
  // The value changes with anything the binding is: a container id, an address.
  assert.equal(parse(bindingOutput()).value, parse(bindingOutput()).value);
  assert.notEqual(parse(bindingOutput({ seed: 'replaced' })).value, parse(bindingOutput()).value);
  assert.notEqual(parse(bindingOutput({ hostIp: '0.0.0.0' })).value, parse(bindingOutput()).value);
});

test('SF-7: anything else refuses, fail closed, with problems that never echo what Docker printed', () => {
  const db = (ports, label) => `${dbLine(ports, label)}\n${KONG_LINE}\n`;
  const cases = [
    ['another project label', bindingOutput({ label: 'fitlog_other_20261026' }), [`${DB}: its com.supabase.cli.project label is not fitlog_rebuild_20261017`, `${KONG}: its com.supabase.cli.project label is not fitlog_rebuild_20261017`]],
    ['no label (Go prints <no value>)', bindingOutput({ label: '<no value>' }), [`${DB}: its com.supabase.cli.project label is not fitlog_rebuild_20261017`, `${KONG}: its com.supabase.cli.project label is not fitlog_rebuild_20261017`]],
    ['the database at the replay port', bindingOutput({ db: '56422' }), [`${DB}: 5432/tcp is published other than only at 127.0.0.1 or 0.0.0.0 port 55322`]],
    ['Kong at the replay port', bindingOutput({ api: '56421' }), [`${KONG}: 8000/tcp is published other than only at 127.0.0.1 or 0.0.0.0 port 55321`]],
    ['another host address', bindingOutput({ hostIp: '192.168.1.5' }), [`${DB}: 5432/tcp is published other than only at 127.0.0.1 or 0.0.0.0 port 55322`, `${KONG}: 8000/tcp is published other than only at 127.0.0.1 or 0.0.0.0 port 55321`]],
    ['IPv6 only', db({ '5432/tcp': [at('::', '55322')] }), [`${DB}: 5432/tcp is published other than only at 127.0.0.1 or 0.0.0.0 port 55322`]],
    ['an IPv4-plus-IPv6 pair (unconfirmed shape)', db({ '5432/tcp': [at('0.0.0.0', '55322'), at('::', '55322')] }), [`${DB}: 5432/tcp is published other than only at 127.0.0.1 or 0.0.0.0 port 55322`]],
    ['a second host port', db({ '5432/tcp': [at('127.0.0.1', '55322'), at('127.0.0.1', '55399')] }), [`${DB}: 5432/tcp is published other than only at 127.0.0.1 or 0.0.0.0 port 55322`]],
    ['5432/tcp not published', db({ '5432/tcp': null }), [`${DB}: 5432/tcp is not published`]],
    ['5432/tcp published to nothing', db({ '5432/tcp': [] }), [`${DB}: 5432/tcp is not published`]],
    ['another port published too', db({ '5432/tcp': [at('127.0.0.1', '55322')], '8000/tcp': [at('127.0.0.1', '55399')] }), [`${DB}: it also publishes 8000/tcp`]],
    ['a binding with an extra field', db({ '5432/tcp': [{ ...at('127.0.0.1', '55322'), HostIpv6: '::' }] }), [`${DB}: its ports are not Docker's port map`]],
    ['a port number, not a string', db({ '5432/tcp': [{ HostIp: '127.0.0.1', HostPort: 55322 }] }), [`${DB}: its ports are not Docker's port map`]],
    ['a malformed port key', db({ 'postgres': [at('127.0.0.1', '55322')] }), [`${DB}: its ports are not Docker's port map`]],
    ['ports not an object', `${id(DB)}|/${DB}|fitlog_rebuild_20261017|null\n${KONG_LINE}\n`, [`${DB}: its ports are not Docker's port map`]],
    ['ports not JSON', `${id(DB)}|/${DB}|fitlog_rebuild_20261017|map[5432/tcp:[{127.0.0.1 55322}]]\n${KONG_LINE}\n`, [`${DB}: its ports are not Docker's port map`]],
    ['a short line', `${id(DB)}|/${DB}\n${KONG_LINE}\n`, [`${DB}: the line is not <id>|<name>|<label>|<ports>`]],
    ['a short container id', `${line(DB, 'fitlog_rebuild_20261017', { '5432/tcp': [at('127.0.0.1', '55322')] }, 'abc123')}\n${KONG_LINE}\n`, [`${DB}: the container id is not 64 lowercase hex digits`]],
    ['the lines in the other order', `${KONG_LINE}\n${dbLine({ '5432/tcp': [at('127.0.0.1', '55322')] })}\n`, [`${DB}: the line names another container`, `${DB}: 5432/tcp is not published`, `${DB}: it also publishes 8000/tcp`, `${KONG}: the line names another container`, `${KONG}: 8000/tcp is not published`, `${KONG}: it also publishes 5432/tcp`]],
    ['one container id twice', `${dbLine({ '5432/tcp': [at('127.0.0.1', '55322')] })}\n${line(KONG, 'fitlog_rebuild_20261017', { '8000/tcp': [at('127.0.0.1', '55321')] }, id(DB))}\n`, ['the containers share one id']],
    ['only one line', `${KONG_LINE}\n`, ['docker inspect printed 1 line(s), not 2 (one per container, in order)']],
    ['three lines', `${bindingOutput()}${KONG_LINE}\n`, ['docker inspect printed 3 line(s), not 2 (one per container, in order)']],
    ['nothing', '', ['docker inspect printed 0 line(s), not 2 (one per container, in order)']],
    ['a blank line between', bindingOutput().replace('\n', '\n\n'), ['docker inspect printed 3 line(s), not 2 (one per container, in order)']],
  ];
  for (const [label, stdout, problems] of cases) {
    const result = parse(stdout);
    assert.deepEqual(result, { problems, value: null, ids: null }, label); // SF-7b (L2): no ID is proven by a refused binding
  }
});

test('SF-7: an inspect that failed or did not finish proves nothing and is never read as a binding', () => {
  assert.deepEqual(bindingResult(ok(bindingOutput()), SHARED_BINDING), parse(bindingOutput()));
  // SF-7b (L2): a failed or unfinished inspect proves no ID either, even when it printed a good binding.
  assert.deepEqual(bindingResult(failed('Error: No such object: supabase_kong_fitlog_rebuild_20261017'), SHARED_BINDING), { problems: ['docker inspect failed (exit 1)'], value: null, ids: null });
  assert.deepEqual(bindingResult({ status: 125, stdout: bindingOutput(), stderr: '' }, SHARED_BINDING), { problems: ['docker inspect failed (exit 125)'], value: null, ids: null });
  for (const error of ['ETIMEDOUT', 'SIGINT', 'ENOENT']) {
    assert.deepEqual(bindingResult({ status: null, stdout: bindingOutput(), stderr: '', error }, SHARED_BINDING), { problems: [`docker inspect did not finish (${error})`], value: null, ids: null });
  }
  assert.deepEqual(bindingResult({ status: null, stdout: '', stderr: '' }, SHARED_BINDING), { problems: ['docker inspect did not finish (no exit status)'], value: null, ids: null });
});

test("SF-7: the replay mirror (held, not wired) is the same rule at the replay's 56422 and 56421 under its own label", () => {
  const mirror = replayBinding(replayTarget(DIR));
  const project = 'fitlog_mb1_replay_20261026';
  assert.deepEqual(bindingArgs(mirror), ['inspect', '--type', 'container', '--format', BINDING_FORMAT, `supabase_db_${project}`, `supabase_kong_${project}`]);
  assert.deepEqual(bindingProblems(bindingOutput({ project, db: '56422', api: '56421' }), mirror).problems, []);
  assert.deepEqual(bindingProblems(bindingOutput({ project, db: '55322', api: '55321' }), mirror).problems, [
    `supabase_db_${project}: 5432/tcp is published other than only at 127.0.0.1 or 0.0.0.0 port 56422`,
    `supabase_kong_${project}: 8000/tcp is published other than only at 127.0.0.1 or 0.0.0.0 port 56421`,
  ]);
  // The shared stack's own containers never satisfy the mirror, nor the replay's the shared rule.
  assert.notDeepEqual(bindingProblems(bindingOutput(), mirror).problems, []);
  assert.notDeepEqual(parse(bindingOutput({ project, db: '56422', api: '56421' })).problems, []);
});

test("SF-7: the route proof needs the 16 staged migrations local, exactly the 15 base remote and the candidate local only", () => {
  const rows = (remote) => MIGRATIONS.map((file) => ({ local: version(file), remote: remote(file) ? version(file) : '' }));
  const good = cliTable(rows((file) => file !== CANDIDATE));
  assert.equal(MIGRATIONS.length, 16);
  assert.deepEqual(routeProof(good, MIGRATIONS), { ok: true, problems: [], rows: rows((file) => file !== CANDIDATE) });
  const other = '29991231235959';
  const cases = [
    ['the candidate already remote (16 remote)', cliTable(rows(() => true)), [`${version(CANDIDATE)} is listed local and remote, expected local only`]],
    ['no row', cliTable([]), ['no migration row was recognised, so the list proves nothing']],
    ['a base migration not remote', cliTable(rows((file) => file !== CANDIDATE && file !== BASE[3])), [`${version(BASE[3])} is listed local only, expected local and remote`]],
    ['one remote version differs', cliTable([...rows((file) => file !== CANDIDATE && file !== BASE[3]), { local: '', remote: other }].sort((a, b) => (a.remote || a.local).localeCompare(b.remote || b.local))), [`the list has 17 row(s); the manifest expects 16`, `${version(BASE[3])} is listed local only, expected local and remote`, `${other} is listed remote only, but it is not in the manifest`]],
  ];
  for (const [label, text, problems] of cases) assert.deepEqual(routeProof(text, MIGRATIONS).problems, problems, label);
  // Exactly the 15 base and the candidate: another count, or no candidate, proves nothing whatever the list says.
  const extra = [...MIGRATIONS, '29991231235959_b1_linked_policies.sql'].sort();
  assert.deepEqual(routeProof(good, extra), { ok: false, problems: [`the replay ran 17 migration(s); the route proof expects the 15 base and ${CANDIDATE}`], rows: [] });
  assert.deepEqual(routeProof(cliTable(rows(() => true).slice(0, 15)), BASE), { ok: false, problems: [`the replay ran 15 migration(s); the route proof expects the 15 base and ${CANDIDATE}`], rows: [] });
});
