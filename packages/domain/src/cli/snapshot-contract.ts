import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, realpathSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import { z } from 'zod';
import { CONTRACT_VERSION, contractSnapshotJson } from '../contract.ts';

// Node-only. Writes contracts/<CONTRACT_VERSION>.json once and appends its SHA-256 to contracts/manifest.json.
// A committed snapshot is never rewritten: a schema change needs a new CONTRACT_VERSION.

export const contractsDir = fileURLToPath(new URL('../../contracts/', import.meta.url));
export const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const MANIFEST = 'manifest.json';
const BASELINE_ENV = 'FITLOG_CONTRACT_BASELINE';
const manifestSchema = z.object({ snapshots: z.array(z.object({ version: z.string(), sha256: z.string().regex(/^[0-9a-f]{64}$/) }).strict()) }).strict();
export type Manifest = z.infer<typeof manifestSchema>;
export interface ContractSource { readonly label: string; read(file: string): Buffer | null }
export interface ContractDirectory extends ContractSource { list(): readonly string[] }
export interface SnapshotPlan { file: string; snapshot: string; sha256: string; manifest: string }

export const sha256 = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');
const snapshotFile = (version: string) => `${version}.json`;
function compareVersions(a: string, b: string): number {
  const [x, y] = [a.split('.').map(BigInt), b.split('.').map(BigInt)];
  const i = x.findIndex((part, n) => part !== y[n]);
  return i < 0 ? 0 : x[i]! < y[i]! ? -1 : 1;
}

export function directory(dir: string): ContractDirectory {
  return {
    label: 'working tree',
    read: (file) => (existsSync(join(dir, file)) ? readFileSync(join(dir, file)) : null),
    list: () => (existsSync(dir) ? readdirSync(dir).filter((file) => !file.startsWith('.')) : []),
  };
}

export function readManifest(files: ContractSource): Manifest | null {
  const bytes = files.read(MANIFEST);
  if (bytes === null) return null;
  let json: unknown;
  try { json = JSON.parse(bytes.toString('utf8')); } catch (error) { throw new Error(`${files.label}: ${MANIFEST} is not JSON (${(error as Error).message})`); }
  const parsed = manifestSchema.safeParse(json);
  if (!parsed.success) throw new Error(`${files.label}: ${MANIFEST} has the wrong shape: ${z.prettifyError(parsed.error)}`);
  return parsed.data;
}

/** Semver entries in strictly increasing order (so unique), ending at the code's version when one is given. */
export function manifestProblems(manifest: Manifest, codeVersion?: string): string[] {
  const versions = manifest.snapshots.map((entry) => entry.version);
  const invalid = versions.filter((version) => !SEMVER.test(version)).map((version) => `${MANIFEST} version ${version} is not MAJOR.MINOR.PATCH semver`);
  const order = invalid.length ? [] : versions.slice(1).flatMap((version, i) => (compareVersions(versions[i]!, version) < 0 ? [] : [`${MANIFEST} version ${version} does not come after ${versions[i]}`]));
  const last = versions.at(-1);
  const end = codeVersion === undefined || last === codeVersion ? [] : [`${MANIFEST} ends at ${last ?? 'no version'}, but CONTRACT_VERSION is ${codeVersion}`];
  return [...invalid, ...order, ...end];
}

/** Every listed snapshot exists with the recorded SHA-256 of its bytes, and nothing unlisted sits beside them. */
export function hashProblems(files: ContractDirectory, manifest: Manifest): string[] {
  const listed = new Set([MANIFEST, ...manifest.snapshots.map((entry) => snapshotFile(entry.version))]);
  const hashes = manifest.snapshots.flatMap(({ version, sha256: recorded }) => {
    const bytes = files.read(snapshotFile(version));
    if (bytes === null) return [`${files.label}: ${snapshotFile(version)} is missing`];
    const actual = sha256(bytes);
    return actual === recorded ? [] : [`${files.label}: ${snapshotFile(version)} has sha256 ${actual}, but ${MANIFEST} records ${recorded}; snapshots are immutable`];
  });
  return [...hashes, ...files.list().filter((file) => !listed.has(file)).map((file) => `${files.label}: ${file} is not listed in ${MANIFEST}`)];
}

/** History recorded at a trusted baseline must survive unchanged: its manifest entries are a prefix of ours, and each file still has its recorded hash. */
export function baselineProblems(current: ContractSource, baseline: ContractSource): string[] {
  const base = readManifest(baseline);
  if (base === null) return [];
  const entries = readManifest(current)?.snapshots ?? [];
  return base.snapshots.flatMap((entry, i) => {
    const file = snapshotFile(entry.version);
    const bytes = current.read(file);
    return [
      ...(isDeepStrictEqual(entries[i], entry) ? [] : [`${MANIFEST} entry ${i + 1} differs from the baseline ${baseline.label}, which records ${entry.version} with sha256 ${entry.sha256}; history is append-only`]),
      ...(bytes !== null && sha256(bytes) === entry.sha256 ? [] : [`${file} differs from the baseline ${baseline.label}, which records sha256 ${entry.sha256}; snapshots are immutable`]),
    ];
  });
}

function git(cwd: string, args: readonly string[]): string | null {
  try { return execFileSync('git', ['-C', cwd, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { return null; }
}
/**
 * Read-only Git baselines. By default HEAD (catches an uncommitted edit) and the fork point from local main (catches an edit
 * committed on this branch). FITLOG_CONTRACT_BASELINE replaces both, for CI to pass the pull request base. A baseline that
 * holds no manifest yet has no history to protect: that is the first-baseline limitation.
 */
export function gitBaselines(dir: string, env: NodeJS.ProcessEnv = process.env): { sources: ContractSource[]; notes: string[] } {
  const root = dirname(dir);
  const prefix = git(root, ['rev-parse', '--show-prefix']);
  if (prefix === null) return { sources: [], notes: ['not in a Git work tree, so no baseline was checked'] };
  const path = `${prefix}${basename(dir)}/`;
  const configured = env[BASELINE_ENV];
  const sources: ContractSource[] = [];
  const notes: string[] = [];
  const seen = new Set<string>();
  for (const ref of configured ? [configured] : ['HEAD', 'main']) {
    const commit = git(root, ['rev-parse', '--verify', '--quiet', `${ref}^{commit}`]);
    const base = commit === null ? null : git(root, ['merge-base', 'HEAD', commit]);
    if (base === null && configured) throw new Error(`${BASELINE_ENV}=${ref} is not a commit that shares history with HEAD`);
    if (base === null) { notes.push(`${ref}: not found or unrelated to HEAD; skipped`); continue; }
    const label = `${ref}@${base.slice(0, 12)}`;
    if (seen.has(base)) { notes.push(`${label}: same commit as an earlier baseline`); continue; }
    seen.add(base);
    notes.push(`${label}: checked`);
    sources.push({ label, read: (file) => (git(root, ['cat-file', '-e', `${base}:${path}${file}`]) === null ? null : execFileSync('git', ['-C', root, 'cat-file', 'blob', `${base}:${path}${file}`], { encoding: 'buffer' })) });
  }
  return { sources, notes };
}

/** Validates the existing history first, then refuses an existing or non-increasing version. Writes nothing. */
export function planSnapshot({ current, baselines, version, snapshot }: { current: ContractDirectory; baselines: readonly ContractSource[]; version: string; snapshot: string }): SnapshotPlan {
  const manifest = readManifest(current) ?? { snapshots: [] };
  const problems = [...manifestProblems(manifest), ...hashProblems(current, manifest), ...baselines.flatMap((base) => baselineProblems(current, base))];
  if (problems.length) throw new Error(`the existing contract history is invalid:\n- ${problems.join('\n- ')}`);
  if (!SEMVER.test(version)) throw new Error(`CONTRACT_VERSION ${version} is not MAJOR.MINOR.PATCH semver`);
  const file = snapshotFile(version);
  if (current.read(file) !== null || manifest.snapshots.some((entry) => entry.version === version)) {
    throw new Error(`contract ${version} already has a snapshot, and snapshots are immutable; bump CONTRACT_VERSION in src/contract.ts for a schema change`);
  }
  const last = manifest.snapshots.at(-1)?.version;
  if (last !== undefined && compareVersions(version, last) <= 0) throw new Error(`CONTRACT_VERSION ${version} must be greater than the last snapshot, ${last}`);
  const hash = sha256(Buffer.from(snapshot));
  return { file, snapshot, sha256: hash, manifest: `${JSON.stringify({ snapshots: [...manifest.snapshots, { version, sha256: hash }] }, null, 2)}\n` };
}

/** The snapshot is created exclusively (never replaced); the manifest is swapped in with an atomic rename. */
export function writeSnapshot(dir: string, plan: SnapshotPlan): void {
  mkdirSync(dir, { recursive: true });
  const snapshotPath = join(dir, plan.file);
  const temporary = join(dir, `${MANIFEST}.${process.pid}.tmp`);
  writeFileSync(snapshotPath, plan.snapshot, { flag: 'wx' });
  try {
    writeFileSync(temporary, plan.manifest, { flag: 'wx' });
    renameSync(temporary, join(dir, MANIFEST));
  } catch (error) {
    rmSync(temporary, { force: true });
    rmSync(snapshotPath, { force: true });
    throw error;
  }
}

const reason = (error: unknown) => (error instanceof Error ? error.message : String(error));
function fail(message: string): void {
  process.stderr.write(`contract:snapshot ${message}\n`);
  process.exitCode = 1;
}
function main(): void {
  let plan: SnapshotPlan;
  try {
    plan = planSnapshot({ current: directory(contractsDir), baselines: gitBaselines(contractsDir).sources, version: CONTRACT_VERSION, snapshot: contractSnapshotJson() });
  } catch (error) { return fail(`refused, nothing written: ${reason(error)}`); }
  try { writeSnapshot(contractsDir, plan); } catch (error) { return fail(`could not write; any file this run created was removed: ${reason(error)}`); }
  const written = directory(contractsDir);
  const manifest = readManifest(written) ?? { snapshots: [] };
  const problems = [...manifestProblems(manifest, CONTRACT_VERSION), ...hashProblems(written, manifest)];
  if (problems.length) return fail(`wrote contracts/${plan.file}, but the result does not verify:\n- ${problems.join('\n- ')}`);
  process.stdout.write(`Wrote contracts/${plan.file} (sha256 ${plan.sha256}) and appended it to contracts/${MANIFEST}\n`);
}

function invokedDirectly(): boolean {
  try { return realpathSync(process.argv[1] ?? '') === realpathSync(fileURLToPath(import.meta.url)); } catch { return false; }
}
if (invokedDirectly()) main();
