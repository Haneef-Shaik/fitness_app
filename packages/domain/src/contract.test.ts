import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { builtinModules } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { isDeepStrictEqual } from 'node:util';
import { z } from 'zod';
import {
  baselineProblems, contractsDir, directory, gitBaselines, gitCommand, hashProblems, manifestProblems, planSnapshot, readManifest, SEMVER, sha256, systemGit, writeSnapshot, writtenProblems,
  type ContractDirectory, type Git,
} from './cli/snapshot-contract.ts';
import { CONTRACT_VERSION, contractSchemas, contractSnapshotJson, persistedContracts } from './contract.ts';
import { paise } from './finance.ts';
import { bodyEntrySchema, goalSchema, name, prescriptionSchema, timezone } from './models.ts';

const snapshotCommand = 'pnpm --filter @fitlog/domain contract:snapshot';
const committed = directory(contractsDir);
const manifestOf = (files: ContractDirectory) => {
  const manifest = readManifest(files);
  assert.ok(manifest, `${files.label} has no manifest.json: run ${snapshotCommand}`);
  return manifest;
};
const copy = (label: string, files: ContractDirectory, changes: Record<string, Buffer> = {}): ContractDirectory => {
  const bytes: Record<string, Buffer> = { ...Object.fromEntries(files.list().map((file) => [file, files.read(file)!])), ...changes };
  return { label, read: (file) => bytes[file] ?? null, list: () => Object.keys(bytes) };
};
const latest = (files: ContractDirectory) => manifestOf(files).snapshots.at(-1)?.version ?? assert.fail(`${files.label} records no snapshot`);
/** The latest snapshot edited to follow a model change, with its manifest hash rewritten to match: self-consistent, so only a baseline can catch it. */
function forge(files: ContractDirectory) {
  const file = `${latest(files)}.json`;
  const edited = Buffer.from(files.read(file)!.toString('utf8').replace('"maxLength": 100', '"maxLength": 101'));
  const snapshots = manifestOf(files).snapshots.map((entry) => (`${entry.version}.json` === file ? { ...entry, sha256: sha256(edited) } : entry));
  return copy('forged', files, { [file]: edited, 'manifest.json': Buffer.from(`${JSON.stringify({ snapshots }, null, 2)}\n`) });
}
/** An empty directory under the OS temporary directory, so outside every Git work tree; removed after the test. */
const scratch = (t: test.TestContext) => {
  const dir = mkdtempSync(join(tmpdir(), 'fitlog-contract-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
};
const contents = (dir: string) => readdirSync(dir).sort().map((file) => [file, readFileSync(join(dir, file))] as const);
const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const issues = (schema: z.ZodType, input: unknown) => {
  const result = schema.safeParse(input);
  return result.success ? [] : result.error.issues.map((issue) => `${issue.code}@${issue.path.map(String).join('.')}`);
};
/** Every schema node reachable from one schema, each once. */
function reachable(schema: z.ZodType, seen = new Set<z.ZodType>()): z.ZodType[] {
  if (seen.has(schema)) return [];
  seen.add(schema);
  const children = Object.entries(schema._zod.def).filter(([key]) => key !== 'checks')
    .flatMap(([, value]) => (value instanceof z.ZodType ? [value] : Array.isArray(value) ? value : typeof value === 'object' && value !== null ? Object.values(value) : []));
  return [schema, ...children.filter((child): child is z.ZodType => child instanceof z.ZodType).flatMap((child) => reachable(child, seen))];
}
/** The refines (`custom`) and transforms (`overwrite`, such as trim) on each node, which JSON Schema cannot express, named by export. */
const dropped = (nodes: readonly z.ZodType[]) => [...new Set(nodes)].flatMap((node) => {
  const kinds = (node._zod.def.checks ?? []).map((check) => check._zod.def.check).filter((kind) => kind === 'custom' || kind === 'overwrite');
  const label = Object.entries(contractSchemas).find(([, schema]) => schema === node)?.[0] ?? 'an unexported schema';
  return kinds.length ? [`${label}: ${kinds.join(', ')}`] : [];
}).sort();

test('contract version is semver', () => {
  assert.match(CONTRACT_VERSION, SEMVER);
});

test('current schemas equal the snapshot for CONTRACT_VERSION', () => {
  const stored = committed.read(`${CONTRACT_VERSION}.json`)?.toString('utf8');
  assert.ok(stored !== undefined, `No snapshot for contract ${CONTRACT_VERSION}: run ${snapshotCommand}`);
  const current = contractSnapshotJson();
  const [was, now] = [JSON.parse(stored), JSON.parse(current)];
  const changed = (['schemas', 'persisted'] as const).flatMap((section) => [...new Set([...Object.keys(was[section] ?? {}), ...Object.keys(now[section])])]
    .filter((key) => !isDeepStrictEqual(was[section]?.[key], now[section][key])).map((key) => `${section}.${key}`));
  assert.ok(stored === current, `Contract schemas changed without a version bump: bump CONTRACT_VERSION and run ${snapshotCommand} (changed: ${changed.join(', ') || 'bytes only'})`);
});

test('every committed snapshot matches its manifest hash', () => {
  assert.deepEqual(hashProblems(committed, manifestOf(committed)), []);
});

test('manifest versions strictly increase and end at CONTRACT_VERSION', () => {
  assert.deepEqual(manifestProblems(manifestOf(committed), CONTRACT_VERSION), []);
});

test('the package root exports CONTRACT_VERSION', async () => {
  const entry = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).exports['.'];
  const root = await import(new URL(`../${entry}`, import.meta.url).href);
  assert.equal(root.CONTRACT_VERSION, CONTRACT_VERSION);
  assert.equal(root.contractSchemas, contractSchemas);
});

test('the contract covers every Zod schema the package root exports, plus the persisted eight', async () => {
  const root: Record<string, unknown> = await import('./index.ts');
  const exported = Object.entries(root).filter(([, value]) => value instanceof z.ZodType);
  assert.deepEqual(exported.filter(([key, value]) => contractSchemas[key] !== value).map(([key]) => key), [], 'These exported schemas are missing from contractSchemas: add their module to contract.ts');
  assert.deepEqual(Object.keys(contractSchemas), exported.map(([key]) => key).sort());
  assert.equal(contractSchemas.paise, paise);
  assert.deepEqual(Object.keys(persistedContracts).sort(), ['days', 'exercise', 'food', 'goal', 'instances', 'measurements', 'nutrients', 'set']);
});

test('the client entrypoint imports no Node built-ins', () => {
  const builtins = new Set(builtinModules);
  const files = [new URL('./index.ts', import.meta.url).href];
  const nodeImports: string[] = [];
  for (const file of files) {
    for (const match of readFileSync(new URL(file), 'utf8').matchAll(/\bfrom\s+['"]([^'"]+)['"]|\bimport\s*\(?\s*['"]([^'"]+)['"]/g)) {
      const specifier = match[1] ?? match[2] ?? '';
      if (specifier.startsWith('.')) { const next = new URL(specifier, file).href; if (!files.includes(next)) files.push(next); }
      else if (specifier.startsWith('node:') || builtins.has(specifier.split('/')[0] ?? '')) nodeImports.push(`${file}: ${specifier}`);
    }
  }
  assert.ok(files.includes(new URL('./contract.ts', import.meta.url).href));
  assert.deepEqual(nodeImports, []);
});

test('committed snapshot history is unchanged against each available Git baseline', (t) => {
  const { sources, notes } = gitBaselines(contractsDir);
  for (const note of notes) t.diagnostic(note);
  for (const base of sources) if (base.read('manifest.json') === null) t.diagnostic(`${base.label}: no committed snapshot history to compare (first-baseline limitation)`);
  assert.deepEqual(sources.flatMap((base) => baselineProblems(committed, base)), []);
});

test('a snapshot and manifest rewritten together are rejected against a baseline', () => {
  const forged = forge(committed);
  const file = `${latest(committed)}.json`;
  assert.notDeepEqual(forged.read(file), committed.read(file));
  assert.deepEqual(hashProblems(forged, manifestOf(forged)), [], 'the forged pair is self-consistent');
  assert.deepEqual(baselineProblems(committed, committed), []);
  assert.match(baselineProblems(forged, committed).join('\n'), new RegExp(`^${file.replaceAll('.', '\\.')} differs from the baseline`, 'm'));
});

test('the snapshot command refuses an existing version before planning any write', () => {
  assert.throws(() => planSnapshot({ current: committed, baselines: [], version: latest(committed), snapshot: contractSnapshotJson() }), /already has a snapshot/);
});

test('the snapshot command validates existing history before planning a new version', () => {
  const next = { version: '99.0.0', snapshot: '{}\n' };
  const tampered = copy('tampered', committed, { [`${latest(committed)}.json`]: Buffer.from('{}\n') });
  assert.throws(() => planSnapshot({ current: tampered, baselines: [], ...next }), /sha256/);
  assert.throws(() => planSnapshot({ current: forge(committed), baselines: [committed], ...next }), /baseline/);
  assert.throws(() => planSnapshot({ current: copy('stray', committed, { 'draft.json': Buffer.from('{}\n') }), baselines: [], ...next }), /draft\.json/);
  assert.throws(() => planSnapshot({ current: committed, baselines: [], ...next, version: '0.0.9' }), /greater than/);
  assert.throws(() => planSnapshot({ current: committed, baselines: [], ...next, version: '1.0' }), /semver/);
  const plan = planSnapshot({ current: committed, baselines: [committed], ...next });
  assert.equal(plan.file, '99.0.0.json');
  assert.deepEqual(JSON.parse(plan.manifest).snapshots, [...manifestOf(committed).snapshots, { version: '99.0.0', sha256: sha256(Buffer.from(next.snapshot)) }]);
});

test('a schema change cannot ship as a PATCH bump within its compatibility line', () => {
  const last = latest(committed);
  const [major, minor, patch] = last.split('.').map(Number) as [number, number, number];
  const stored = JSON.parse(committed.read(`${last}.json`)!.toString('utf8'));
  const plan = (version: string, change: object = {}) => planSnapshot({ current: committed, baselines: [], version, snapshot: `${JSON.stringify({ ...stored, ...change, version }, null, 2)}\n` });
  const nextPatch = `${major}.${minor}.${patch + 1}`;
  const schemaChange = { schemas: { ...stored.schemas, probe: {} } };
  assert.throws(() => plan(nextPatch, schemaChange), /only bumps PATCH/);
  assert.throws(() => plan(nextPatch, { persisted: { ...stored.persisted, probe: {} } }), /only bumps PATCH/);
  assert.equal(plan(nextPatch).file, `${nextPatch}.json`, 'a patch that leaves every schema unchanged is allowed');
  assert.equal(plan(`${major}.${minor + 1}.0`, schemaChange).file, `${major}.${minor + 1}.0.json`, 'a MINOR bump may change schemas');
});

test('the snapshot command writes a snapshot that verifies, and a second write changes nothing', (t) => {
  const dir = scratch(t);
  const plan = planSnapshot({ current: directory(dir), baselines: [], version: CONTRACT_VERSION, snapshot: contractSnapshotJson() });
  writeSnapshot(dir, plan);
  assert.deepEqual(writtenProblems(directory(dir), CONTRACT_VERSION), []);
  assert.equal(writtenProblems(copy('tampered', directory(dir), { [plan.file]: Buffer.from('{}\n') }), CONTRACT_VERSION).length, 1, 'the check after writing can fail');
  assert.equal(plan.sha256, manifestOf(committed).snapshots.at(-1)?.sha256, 'the generator reproduces the committed snapshot');
  const before = contents(dir);
  assert.throws(() => writeSnapshot(dir, plan), { code: 'EEXIST' });
  assert.deepEqual(contents(dir), before, 'the refused write changed nothing and left no temporary file');
});

test('a failed write removes only the files that run created', (t) => {
  const plan = planSnapshot({ current: directory(scratch(t)), baselines: [], version: CONTRACT_VERSION, snapshot: contractSnapshotJson() });
  const held = scratch(t);
  const temporary = `manifest.json.${process.pid}.tmp`;
  writeFileSync(join(held, temporary), 'another run\n');
  assert.throws(() => writeSnapshot(held, plan), { code: 'EEXIST' });
  assert.deepEqual(contents(held), [[temporary, Buffer.from('another run\n')]], 'the temporary file another run holds is kept, and the new snapshot is removed');
  const blocked = scratch(t);
  mkdirSync(join(blocked, 'manifest.json'));
  assert.throws(() => writeSnapshot(blocked, plan));
  assert.deepEqual(readdirSync(blocked), ['manifest.json'], 'the rename failed, so the new snapshot and the temporary file were removed');
  assert.ok(statSync(join(blocked, 'manifest.json')).isDirectory());
});

test('CI refuses to check history without a trusted baseline', () => {
  for (const env of [{ CI: 'true' }, { CI: '1', FITLOG_CONTRACT_BASELINE: '' }, { CI: 'true', FITLOG_CONTRACT_BASELINE: '  ' }]) {
    assert.throws(() => gitBaselines(contractsDir, env), /FITLOG_CONTRACT_BASELINE must be set in CI to the trusted base commit/, JSON.stringify(env));
  }
  assert.throws(() => gitBaselines(contractsDir, { CI: 'true', FITLOG_CONTRACT_BASELINE: '0'.repeat(40) }), /all-zero/);
  assert.throws(() => gitBaselines(contractsDir, { FITLOG_CONTRACT_BASELINE: '' }), /is empty/);
  for (const env of [{ CI: 'false' }, { CI: '0' }, {}]) assert.match(gitBaselines(contractsDir, env).notes[0] ?? '', /^HEAD@[0-9a-f]{12}: checked$/, JSON.stringify(env));
});

test('a configured baseline that is not a commit is refused', () => {
  assert.throws(() => gitBaselines(contractsDir, { FITLOG_CONTRACT_BASELINE: 'refs/heads/ar1-no-such-ref' }), /not a commit/);
  assert.throws(() => gitBaselines(contractsDir, { CI: 'true', FITLOG_CONTRACT_BASELINE: 'HEAD^{tree}' }), /not a commit/);
});

test('a configured baseline replaces HEAD and main, and an absent file is not a failure', () => {
  for (const env of [{ FITLOG_CONTRACT_BASELINE: 'HEAD' }, { CI: 'true', FITLOG_CONTRACT_BASELINE: 'HEAD' }]) {
    const { sources, notes } = gitBaselines(contractsDir, env);
    const [base] = sources;
    assert.equal(sources.length, 1);
    assert.match(base?.label ?? '', /^HEAD@[0-9a-f]{12}$/);
    assert.deepEqual(notes, [`${base?.label}: checked`]);
    assert.ok(base && readManifest(base)?.snapshots.some((entry) => entry.version === '0.1.0'), 'HEAD records 0.1.0, committed in 07757a5');
    assert.deepEqual(base && baselineProblems(committed, base), []);
    assert.equal(base?.read('9.9.9.json'), null);
  }
  const [absent] = gitBaselines(join(contractsDir, '..', 'no-such-contracts'), { FITLOG_CONTRACT_BASELINE: 'HEAD' }).sources;
  assert.equal(absent?.read('manifest.json'), null, 'a directory absent at the baseline is the first-baseline case');
});

test('a configured baseline fails closed outside a Git work tree; a local run without one only notes it', (t) => {
  const outside = join(scratch(t), 'contracts');
  for (const env of [{ FITLOG_CONTRACT_BASELINE: 'HEAD' }, { CI: 'true', FITLOG_CONTRACT_BASELINE: 'HEAD' }]) {
    assert.throws(() => gitBaselines(outside, env), /cannot be checked/, JSON.stringify(env));
  }
  const local = gitBaselines(outside, {});
  assert.deepEqual(local.sources, []);
  assert.match(local.notes.join('\n'), /no baseline was checked/);
  const noGit = gitCommand(join(scratch(t), 'no-such-git'));
  assert.throws(() => gitBaselines(contractsDir, { CI: 'true', FITLOG_CONTRACT_BASELINE: 'HEAD' }, noGit), /cannot be checked.*git did not run.*ENOENT/);
});

test('a configured baseline fails closed when Git cannot answer, and never reads a failure as an absent file', () => {
  /** The real git, except that one subcommand fails the way a shallow or partial clone, or an unrelated history, makes it fail. */
  const failing = (subcommand: string, status: number, stderr: string): Git => (cwd, args) => (args[0] === subcommand ? { status, stdout: Buffer.alloc(0), stderr } : systemGit(cwd, args));
  const env = { CI: 'true', FITLOG_CONTRACT_BASELINE: 'HEAD' };
  assert.throws(() => gitBaselines(contractsDir, env, failing('merge-base', 1, '')), /not a commit that shares history with HEAD \(exit 1\)/);
  assert.throws(() => gitBaselines(contractsDir, env, failing('ls-tree', 128, 'fatal: not a tree object')), /git ls-tree .* failed \(exit 128: fatal: not a tree object\)/);
  const [base] = gitBaselines(contractsDir, env, failing('cat-file', 128, 'fatal: missing blob')).sources;
  assert.throws(() => base?.read('manifest.json'), /git cat-file blob .* failed \(exit 128: fatal: missing blob\)/);
  assert.equal(base?.read('9.9.9.json'), null, 'a file the listing does not hold is absent without asking git');
  assert.match(gitBaselines(contractsDir, {}, failing('merge-base', 1, '')).notes.join('\n'), /^HEAD: unrelated to HEAD \(exit 1\); skipped$/m, 'a local run only notes it');
});

const exercise = { id: uuid(1), version: 1, name: 'Bench press', type: 'resistance', loadBasis: 'total', multiplier: 1, equipment: 'Barbell',
  primaryMuscles: ['Chest'], secondaryMuscles: [], instructions: '', aliases: [], ownerId: null, archived: false };
const prescription = { id: uuid(2), exercise, sets: 3, repsMin: 8, repsMax: 8, loadKg: null, durationSeconds: null, distanceMetres: null, restSeconds: 90, supersetId: null };
const goal = { id: uuid(3), name: 'Bench', type: 'strength', metric: 'max_load', exerciseId: uuid(1), exerciseVersion: 1, loadBasis: 'total', fixedLoadKg: null, baseline: 80,
  baselineCutoff: '2026-10-11T23:59:59Z', startDate: '2026-10-12', deadline: '2026-10-12', target: 100, rangeMin: null, rangeMax: null, status: 'active', notes: '', revision: 1 };
const bodyEntry = { id: uuid(4), ownerId: uuid(5), measuredAt: '2026-10-12T06:00:00Z', localDate: '2026-10-12', timezone: 'Asia/Kolkata',
  weightKg: null, bodyFat: null, measurements: {}, notes: 'Felt light', deletedAt: null, revision: 1 };
/** The accept and reject boundary of every rule the snapshot cannot hold: [case, schema, input, issues as code@path, none when accepted]. */
const refinementVectors: readonly (readonly [string, z.ZodType, unknown, readonly string[]])[] = [
  ['repsMin equal to repsMax', prescriptionSchema, prescription, []],
  ['repsMin above repsMax', prescriptionSchema, { ...prescription, repsMin: 9 }, ['custom@repsMax']],
  ['deadline on the start date', goalSchema, goal, []],
  ['no deadline', goalSchema, { ...goal, deadline: null }, []],
  ['deadline the day before the start date', goalSchema, { ...goal, deadline: '2026-10-11' }, ['custom@']],
  ['an IANA time zone', timezone, 'Asia/Kolkata', []],
  ['an unknown time zone', timezone, 'Mars/Phobos', ['custom@']],
  ['a name with spaces around it', name, ' a ', []],
  ['a name of spaces only', name, '   ', ['too_small@']],
  ['a body entry with only a note', bodyEntrySchema, bodyEntry, []],
  ['a body entry with only a measurement', bodyEntrySchema, { ...bodyEntry, notes: '', measurements: { waist: 80 } }, []],
  ['a body entry whose note is blank', bodyEntrySchema, { ...bodyEntry, notes: '  ' }, ['custom@']],
  ['an empty body entry', bodyEntrySchema, { ...bodyEntry, notes: '' }, ['custom@']],
];

test('rules JSON Schema cannot express hold at their accept and reject boundaries', () => {
  for (const [label, schema, input, expected] of refinementVectors) assert.deepEqual(issues(schema, input), expected, label);
  assert.equal(name.parse(' a '), 'a');
  assert.equal(goalSchema.parse({ ...goal, name: ' Bench ' }).name, 'Bench');
});

test('the refines and transforms the snapshot drops are exactly the ones the vectors cover', () => {
  assert.deepEqual(dropped(Object.values(contractSchemas).flatMap((schema) => reachable(schema))),
    ['bodyEntrySchema: custom', 'goalSchema: custom', 'name: overwrite', 'prescriptionSchema: custom', 'timezone: custom']);
  assert.deepEqual(Object.fromEntries(Object.entries(persistedContracts).map(([key, schema]) => [key, dropped(reachable(schema))])), {
    days: ['name: overwrite', 'prescriptionSchema: custom'], exercise: ['name: overwrite'], food: ['name: overwrite'], goal: ['goalSchema: custom', 'name: overwrite'],
    instances: ['name: overwrite', 'prescriptionSchema: custom'], measurements: [], nutrients: [], set: [],
  }, 'Postgres validates these persisted contracts without the listed rules');
});
