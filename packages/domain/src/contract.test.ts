import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { builtinModules } from 'node:module';
import { test } from 'node:test';
import { isDeepStrictEqual } from 'node:util';
import { z } from 'zod';
import { baselineProblems, contractsDir, directory, gitBaselines, hashProblems, manifestProblems, planSnapshot, readManifest, SEMVER, sha256, type ContractDirectory } from './cli/snapshot-contract.ts';
import { CONTRACT_VERSION, contractSchemas, contractSnapshotJson, persistedContracts } from './contract.ts';
import { paise } from './finance.ts';

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
