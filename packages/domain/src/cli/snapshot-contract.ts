import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { closeSync, existsSync, mkdirSync, openSync, readdirSync, readFileSync, realpathSync, renameSync, rmSync, writeFileSync } from 'node:fs';
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
export interface GitResult { readonly status: number | null; readonly stdout: Buffer; readonly stderr: string }
export type Git = (cwd: string, args: readonly string[]) => GitResult;

export const sha256 = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');
const snapshotFile = (version: string) => `${version}.json`;
function compareVersions(a: string, b: string): number {
  const [x, y] = [a.split('.').map(BigInt), b.split('.').map(BigInt)];
  const i = x.findIndex((part, n) => part !== y[n]);
  return i < 0 ? 0 : x[i]! < y[i]! ? -1 : 1;
}
const minorLine = (version: string) => version.split('.').slice(0, 2).join('.');
/** The parts of a snapshot that clients and the database see; `version` is left out. */
function wireOf(bytes: Buffer, label: string): unknown[] {
  let json: { schemas?: unknown; persisted?: unknown } | null;
  try { json = JSON.parse(bytes.toString('utf8')); } catch (error) { throw new Error(`${label} is not JSON (${(error as Error).message})`); }
  return [json?.schemas, json?.persisted];
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

/** Runs a git binary read-only and keeps its exit status and stderr, so a failure is never mistaken for an absent file. */
export const gitCommand = (binary: string): Git => (cwd, args) => {
  const run = spawnSync(binary, ['-C', cwd, ...args], { stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024 });
  return run.error
    ? { status: null, stdout: Buffer.alloc(0), stderr: run.error.message }
    : { status: run.status, stdout: run.stdout, stderr: run.stderr.toString('utf8').trim() };
};
export const systemGit = gitCommand('git');
const failure = ({ status, stderr }: GitResult) => `${status === null ? 'git did not run' : `exit ${status}`}${stderr ? `: ${stderr}` : ''}`;
function gitOutput(git: Git, cwd: string, args: readonly string[], label: string): Buffer {
  const run = git(cwd, args);
  if (run.status !== 0) throw new Error(`${label}: git ${args.join(' ')} failed (${failure(run)})`);
  return run.stdout;
}
/** CI is on unless the variable is unset, empty, '0' or 'false'. */
const inCI = (env: NodeJS.ProcessEnv) => !['', '0', 'false'].includes((env.CI ?? '').trim().toLowerCase());

/**
 * One baseline commit's contracts/ files. ls-tree lists them, so a file absent at the baseline reads as null; a failed
 * listing or blob read (missing objects in a shallow or partial clone, I/O errors) throws with git's stderr.
 */
function gitSource(git: Git, root: string, base: string, dir: string, path: string, label: string): ContractSource {
  const listed = new Set(gitOutput(git, root, ['ls-tree', '-r', '-z', '--full-name', '--name-only', base, '--', dir], label).toString('utf8')
    .split('\0').filter((entry) => entry.startsWith(path) && !entry.slice(path.length).includes('/')).map((entry) => entry.slice(path.length)));
  return { label, read: (file) => (listed.has(file) ? gitOutput(git, root, ['cat-file', 'blob', `${base}:${path}${file}`], label) : null) };
}

/**
 * Read-only Git baselines. Locally, by default, HEAD (catches an uncommitted edit) and the fork point from local main
 * (catches an edit committed on this branch). FITLOG_CONTRACT_BASELINE replaces both. CI must set it to the trusted base
 * commit, and a configured baseline fails closed: unset or empty in CI, all zeros, Git or the work tree unavailable, a ref
 * that is not a commit or shares no history with HEAD, or a listing or read that fails. A baseline that holds no manifest
 * yet has no history to protect: that is the first-baseline limitation.
 */
export function gitBaselines(dir: string, env: NodeJS.ProcessEnv = process.env, git: Git = systemGit): { sources: ContractSource[]; notes: string[] } {
  const configured = env[BASELINE_ENV];
  if (inCI(env) && !configured?.trim()) throw new Error(`${BASELINE_ENV} must be set in CI to the trusted base commit (it is ${configured === undefined ? 'unset' : 'empty'})`);
  if (configured !== undefined && !configured.trim()) throw new Error(`${BASELINE_ENV} is empty: unset it to use HEAD and main, or set it to the trusted base commit`);
  if (configured !== undefined && /^0+$/.test(configured.trim())) throw new Error(`${BASELINE_ENV}=${configured} is the all-zero SHA, which names no commit, so there is no trusted baseline`);
  const root = dirname(dir);
  const top = git(root, ['rev-parse', '--show-prefix']);
  if (top.status !== 0 && configured !== undefined) throw new Error(`${BASELINE_ENV}=${configured} cannot be checked: ${root} is not in a usable Git work tree (${failure(top)})`);
  if (top.status !== 0) return { sources: [], notes: [`not in a usable Git work tree (${failure(top)}), so no baseline was checked`] };
  const path = `${top.stdout.toString('utf8').trim()}${basename(dir)}/`;
  const sources: ContractSource[] = [];
  const notes: string[] = [];
  const seen = new Set<string>();
  for (const ref of configured === undefined ? ['HEAD', 'main'] : [configured]) {
    const commit = git(root, ['rev-parse', '--verify', '--quiet', `${ref}^{commit}`]);
    if (commit.status !== 0 && configured !== undefined) throw new Error(`${BASELINE_ENV}=${ref} is not a commit in this repository (${failure(commit)}); CI must fetch full history`);
    if (commit.status !== 0) { notes.push(`${ref}: not found (${failure(commit)}); skipped`); continue; }
    const fork = git(root, ['merge-base', 'HEAD', commit.stdout.toString('utf8').trim()]);
    if (fork.status !== 0 && configured !== undefined) throw new Error(`${BASELINE_ENV}=${ref} is not a commit that shares history with HEAD (${failure(fork)})`);
    if (fork.status !== 0) { notes.push(`${ref}: unrelated to HEAD (${failure(fork)}); skipped`); continue; }
    const base = fork.stdout.toString('utf8').trim();
    const label = `${ref}@${base.slice(0, 12)}`;
    if (seen.has(base)) { notes.push(`${label}: same commit as an earlier baseline`); continue; }
    seen.add(base);
    notes.push(`${label}: checked`);
    sources.push(gitSource(git, root, base, basename(dir), path, label));
  }
  return { sources, notes };
}

/** Validates the existing history first, then refuses an existing or non-increasing version, or a PATCH bump that changes schemas. Writes nothing. */
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
  // 003 §4.1: a patch never changes the wire format within its compatibility line.
  if (last !== undefined && minorLine(version) === minorLine(last) && !isDeepStrictEqual(wireOf(current.read(snapshotFile(last))!, snapshotFile(last)), wireOf(Buffer.from(snapshot), `the ${version} snapshot`))) {
    throw new Error(`CONTRACT_VERSION ${version} only bumps PATCH from ${last}, but the schemas differ; a patch never changes the wire format, so bump MINOR (before 1.0.0 that starts a new compatibility line)`);
  }
  const hash = sha256(Buffer.from(snapshot));
  return { file, snapshot, sha256: hash, manifest: `${JSON.stringify({ snapshots: [...manifest.snapshots, { version, sha256: hash }] }, null, 2)}\n` };
}

/** Creates a file that must not exist yet. Only a file this call created is ever removed, if writing to it fails. */
function createExclusive(path: string, text: string): void {
  const fd = openSync(path, 'wx');
  try { writeFileSync(fd, text); } catch (error) { closeSync(fd); rmSync(path, { force: true }); throw error; }
  closeSync(fd);
}
/** The snapshot is created exclusively (never replaced); the manifest is swapped in with an atomic rename. */
export function writeSnapshot(dir: string, plan: SnapshotPlan): void {
  mkdirSync(dir, { recursive: true });
  const snapshotPath = join(dir, plan.file);
  const temporary = join(dir, `${MANIFEST}.${process.pid}.tmp`);
  createExclusive(snapshotPath, plan.snapshot);
  try { createExclusive(temporary, plan.manifest); } catch (error) { rmSync(snapshotPath, { force: true }); throw error; }
  try { renameSync(temporary, join(dir, MANIFEST)); } catch (error) {
    rmSync(temporary, { force: true });
    rmSync(snapshotPath, { force: true });
    throw error;
  }
}
/** The check the command runs after writing: the manifest ends at the version, and every listed file has its recorded hash. */
export function writtenProblems(files: ContractDirectory, version: string): string[] {
  const manifest = readManifest(files) ?? { snapshots: [] };
  return [...manifestProblems(manifest, version), ...hashProblems(files, manifest)];
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
  const problems = writtenProblems(directory(contractsDir), CONTRACT_VERSION);
  if (problems.length) return fail(`wrote contracts/${plan.file}, but the result does not verify:\n- ${problems.join('\n- ')}`);
  process.stdout.write(`Wrote contracts/${plan.file} (sha256 ${plan.sha256}) and appended it to contracts/${MANIFEST}\n`);
}

function invokedDirectly(): boolean {
  try { return realpathSync(process.argv[1] ?? '') === realpathSync(fileURLToPath(import.meta.url)); } catch { return false; }
}
if (invokedDirectly()) main();
