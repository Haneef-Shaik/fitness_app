// MB-1 SF-0 (docs/plan/runs/MB-1/sf0.md): a verifier for the behaviour-preserving split of scripts/backend/mb1-replay.mjs (798
// lines) and scripts/backend/mb1-replay.test.mjs (2210 lines). NOT EXECUTED IN SF-0: running a local node script was denied in
// that session, so the split was proved there with `git diff --no-index --numstat` against the intact originals (sf0.md §3).
// This file records the split's exact plan and lets a reviewer who may run node check it byte for byte:
//
//   node docs/evidence/MB-1/sf0/sf0-split.mjs verify
//     Rebuilds both originals from the split files alone (each original's import block, then every moved line put back at its
//     own line number, and the blank lines dropped between sections), and requires each rebuilt original to have its pinned
//     sha256. Also requires every line of a split file outside its moved lines to be wiring only: a `// ` comment, an import or
//     export statement (or a line of one), or blank. Prints one line per file; exit 0 only if everything holds.
//   node docs/evidence/MB-1/sf0/sf0-split.mjs names <before.tap> <after.tap>
//     Compares the test paths (parent › child) of two `node --test` TAP outputs as multisets; exit 0 only if equal.
//
// It reads only the files named here and writes nothing: no network, database, Docker, Supabase CLI, runner or replay directory.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const BACKEND = join(dirname(fileURLToPath(import.meta.url)), '../../../../scripts/backend');
const sha256 = (text) => createHash('sha256').update(text).digest('hex');
const fail = (message) => { throw new Error(message); };

const RUNNER = Object.freeze({
  original: 'mb1-replay.mjs',
  sha256: 'fd76c04b0fa656d811831c6b103ef652313e281d77a648e23a0b368b73e83334',
  total: 798,
  // Lines 1-16: the original import block and the blank line after it.
  header: [
    "import { spawn } from 'node:child_process';",
    "import { randomUUID } from 'node:crypto';",
    "import * as nodeFs from 'node:fs';",
    "import { basename, join } from 'node:path';",
    "import { invokedDirectly, LOCAL_API_URL, REPO_ROOT } from './local-stack.mjs';",
    'import {',
    '  appliedMigrations, assertNoSecrets, banNote, CANDIDATE, CANDIDATE_SHA256, diffResult, imageProblems, judgeSuite, lintResult, M2_UNKILLED, m2RunUnkilled, migrationListResult,',
    '  P1_COLUMNS, parsePreconditions, PRECONDITIONS_SHA256, READ_ONLY_PROOF, readOnlySqlProblems, redact, renderRun, secretHits, sha256, SNAPSHOT_RULES, snapshotVerdict,',
    "} from './mb1-replay-evidence.mjs';",
    "import { haltNeeds, mutateNeeds, passed, sharedApplyNeeds, sharedSnapshotNeeds, snapshotNeeds, spacing, suiteNeeds } from './mb1-replay-order.mjs';",
    'import {',
    '  acquireLock, addOwnedFile, checkOwnedDir, createReplayDir, envFiles, envSearchDirs, fillReplayDir, lockText, MANIFEST, manifestMigrations, Refusal, releaseLock,',
    '  removeOwnedDir, REPLAY_API_URL, replayFiles, replayTarget, SHARED, sharedConfigProblems, sharedInputFiles, STAGING, stagedInputProblems, stageSharedInput, STATE,',
    "} from './mb1-replay-target.mjs';",
    "import { main as identitySuite } from './verify-identity.mjs';",
    '',
  ],
  dropped: [],
  // Each split file: the original line ranges its moved lines hold, in file order.
  files: {
    'mb1-replay-exec.mjs': [[59, 62], [66, 67], [81, 85], [102, 158]],
    'mb1-replay-live.mjs': [[63, 65], [68, 78], [80, 80], [86, 101], [159, 254]],
    'mb1-replay-sql.mjs': [[256, 326], [412, 415]],
    'mb1-replay-commands.mjs': [[79, 79], [255, 255], [327, 411], [416, 540], [664, 667]],
    'mb1-replay-shared.mjs': [[541, 663]],
    'mb1-replay.mjs': [[17, 58], [668, 798]],
  },
});
const TESTS = Object.freeze({
  original: 'mb1-replay.test.mjs',
  sha256: '9c18e4238f36275e1a24ba740fe9fc034f703fe220717e37ec1698d13f55e81c',
  total: 2210,
  // Lines 1-14: the original import block and the blank line after it.
  header: [
    "import assert from 'node:assert/strict';",
    "import { createHash } from 'node:crypto';",
    "import { EventEmitter } from 'node:events';",
    "import { existsSync, lstatSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, realpathSync, renameSync, rmdirSync, rmSync, symlinkSync, unlinkSync, writeFileSync } from 'node:fs';",
    "import { tmpdir } from 'node:os';",
    "import { dirname, join } from 'node:path';",
    "import { PassThrough } from 'node:stream';",
    "import { test } from 'node:test';",
    "import { REPO_ROOT } from './local-stack.mjs';",
    "import { CANDIDATE, IDENTITY_CHECKS, M2_CHECK, M2_UNKILLED, P1_COLUMNS, PROFILE_READ_FAILURES, READ_ONLY_PROOF, secretHits, sha256 } from './mb1-replay-evidence.mjs';",
    "import { MANIFEST, REPLAY_API_URL, SENTINEL, SHARED, STATE } from './mb1-replay-target.mjs';",
    "import { runCommand, runReplay } from './mb1-replay.mjs';",
    "import { main as identityMain } from './verify-identity.mjs';",
    '',
  ],
  // The blank line between two sections, at the edge of a split file, is dropped.
  dropped: [311, 419, 685, 983, 1259, 1551, 1703, 2031],
  files: {
    'mb1-replay-test-harness.mjs': [[15, 310], [569, 570], [1112, 1112], [1266, 1266], [1558, 1558]],
    'mb1-replay.test.mjs': [[312, 418]],
    'mb1-replay-guards.test.mjs': [[420, 568], [571, 684]],
    'mb1-replay-plan.test.mjs': [[686, 982]],
    'mb1-replay-phase1f.test.mjs': [[984, 1111], [1113, 1258]],
    'mb1-replay-phase1g.test.mjs': [[1260, 1265], [1267, 1550]],
    'mb1-replay-m2-stop.test.mjs': [[1552, 1557], [1559, 1702]],
    'mb1-replay-rechecks.test.mjs': [[1704, 2030]],
    'mb1-replay-lifecycle.test.mjs': [[2032, 2210]],
  },
});

const linesOf = (text, label) => { const lines = text.split('\n'); if (lines.pop() !== '') fail(`${label} does not end with a newline`); return lines; };
// Lines a split file may hold besides its moved lines: comments, import and export statements (and the lines of a wrapped
// one), and blank lines.
const PREFIX_LINE = /^(\/\/ .*|import .*;|import \{|export \{.*\} from '[^']+';|export \{|  [\w$]+(, [\w$]+)*,|\} from '[^']+';|)$/;
const FOOTER_LINE = /^(export \{.*\};|export \{|  [\w$]+(, [\w$]+)*,|\};|)$/;

function rebuild(spec) {
  const result = new Array(spec.total).fill(undefined);
  const claim = (line, text) => { if (result[line - 1] !== undefined) fail(`${spec.original} line ${line} is claimed twice`); result[line - 1] = text; };
  spec.header.forEach((text, at) => claim(at + 1, text));
  for (const line of spec.dropped) claim(line, '');
  for (const [name, pieces] of Object.entries(spec.files)) {
    const lines = linesOf(readFileSync(join(BACKEND, name), 'utf8'), name);
    const start = lines.indexOf('') + 1;
    if (start === 0) fail(`${name} has no blank line after its imports`);
    let at = start;
    for (const [from, to] of pieces) for (let line = from; line <= to; line += 1) { claim(line, lines[at]); at += 1; }
    const prefix = lines.slice(0, start - 1).filter((line) => !PREFIX_LINE.test(line));
    const footer = lines.slice(at).filter((line) => !FOOTER_LINE.test(line));
    if (prefix.length || footer.length) fail(`${name} holds lines outside its moved lines that are not wiring: ${[...prefix, ...footer].slice(0, 3).join(' | ')}`);
    console.log(`  ${name}: ${lines.length} lines, ${at - start} moved (${pieces.map(([from, to]) => (from === to ? `${from}` : `${from}-${to}`)).join(', ')}), ${start} wiring line(s) before, ${lines.length - at} after; sha256 ${sha256(`${lines.join('\n')}\n`)}`);
  }
  const missing = result.flatMap((text, at) => (text === undefined ? [at + 1] : []));
  if (missing.length) fail(`${spec.original}: no split file holds line(s) ${missing.slice(0, 10).join(', ')}`);
  const text = `${result.join('\n')}\n`;
  if (sha256(text) !== spec.sha256) fail(`${spec.original} rebuilt from the split files has sha256 ${sha256(text)}, not the original's ${spec.sha256}`);
  console.log(`rebuilt ${spec.original} (${spec.total} lines) from the split files alone: sha256 ${spec.sha256}, the original's`);
}

/** A TAP output's test paths (parent › child), from its `# Subtest:` and `ok`/`not ok` lines, and its summary counts. */
function tapNames(path) {
  const stack = [];
  const names = [];
  const summary = {};
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const subtest = /^( *)# Subtest: (.*)$/.exec(line);
    if (subtest) { stack.length = subtest[1].length / 4; stack.push(subtest[2]); continue; }
    const result = /^( *)(not ok|ok) \d+ - (.*?)(?: # (?:SKIP|TODO)\b.*)?$/.exec(line);
    if (result) { names.push(`${result[2] === 'ok' ? '' : 'NOT OK '}${[...stack.slice(0, result[1].length / 4), result[3]].join(' › ')}`); continue; }
    const count = /^# (tests|pass|fail|cancelled|skipped|todo) (\d+)$/.exec(line);
    if (count) summary[count[1]] = Number(count[2]);
  }
  return { names: names.sort(), summary };
}
function compareNames(before, after) {
  const [a, b] = [tapNames(before), tapNames(after)];
  const count = (list) => list.reduce((map, name) => map.set(name, (map.get(name) ?? 0) + 1), new Map());
  const [ca, cb] = [count(a.names), count(b.names)];
  const only = (x, y) => [...x].filter(([name, n]) => (y.get(name) ?? 0) < n).map(([name]) => name);
  const digest = (list) => sha256(`${list.join('\n')}\n`);
  console.log(`before: ${a.names.length} test paths, summary ${JSON.stringify(a.summary)}, sha256 of the sorted list ${digest(a.names)}`);
  console.log(`after:  ${b.names.length} test paths, summary ${JSON.stringify(b.summary)}, sha256 of the sorted list ${digest(b.names)}`);
  for (const name of only(ca, cb)) console.log(`only before: ${name}`);
  for (const name of only(cb, ca)) console.log(`only after:  ${name}`);
  const same = only(ca, cb).length === 0 && only(cb, ca).length === 0;
  console.log(same ? 'the two runs hold exactly the same test paths, each as often' : 'the test paths DIFFER');
  return same ? 0 : 1;
}

function main([mode, ...rest]) {
  if (mode === 'verify' && rest.length === 0) { rebuild(RUNNER); rebuild(TESTS); return 0; }
  if (mode === 'names' && rest.length === 2) return compareNames(...rest);
  fail('usage: verify | names <before.tap> <after.tap>');
}

try { process.exitCode = main(process.argv.slice(2)); } catch (error) { console.error(`sf0-split: ${error.message}`); process.exitCode = 1; }
