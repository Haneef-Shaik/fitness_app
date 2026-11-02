# G5 residual: status consumers now read through the wrapper (source change, tests UNRUN). 2026-11-01

Codex assigned this bounded phase under explicit owner delegation AUTH-01. A local Claude goal-implementer wrote it,
limited to Read, Grep, Edit and Write. It ran nothing: no process, test, CLI, database, network, environment or credential
read, and no commit. This record claims no Done-when box, no acceptance-ledger result, no whole-G5 closure and no MB-1
acceptance. It covers one named residual from `harness-command-failure-accepted-2026-11-01.md`.

## Why

QA-9 phase 3N gap G5 says status diagnostics can expose keys, and PRD 22.1 says never log tokens. The accepted F4
prerequisite moved the three integration suites onto `readLocalStatus` in `status-command.mjs`. That wrapper drops the
thrown value of a failed command without binding it, throws one fixed message, and parses through `parseStatusOutput`,
which has fixed refusals. Two consumers still ran `pnpm exec supabase status -o json` and parsed it inline:

- `scripts/backend/environment.mjs` (`pnpm backend:env`) writes the mobile app's private `apps/mobile/.env.local`.
- `scripts/backend/preview-account.mjs` creates a synthetic local account and writes its credentials privately to tmpdir.

In both, a failed command could throw Node's child-process error, which carries the printed output (keys) in its message,
`stdout` and `output`. Bad output could throw a V8 `SyntaxError` that quotes the input. With no handler, either one would
print to the terminal.

## What changed

Two lines changed in each consumer, each in place, so the line count and every line number stay the same:

| File | Line | Before | After |
| --- | --- | --- | --- |
| `scripts/backend/environment.mjs` | 1 | `import { execFileSync } from 'node:child_process';` | `import { readLocalStatus } from './status-command.mjs';` |
| `scripts/backend/environment.mjs` | 3 | `const status = JSON.parse(execFileSync('pnpm', [...status -o json], {...}));` | `const status = readLocalStatus();` |
| `scripts/backend/preview-account.mjs` | 2 | `import { execFileSync } from 'node:child_process';` | `import { readLocalStatus } from './status-command.mjs';` |
| `scripts/backend/preview-account.mjs` | 7 | `const status = JSON.parse(execFileSync('pnpm', [...status -o json], {...}));` | `const status = readLocalStatus();` |

Nothing else changed: not the exact loopback guard, not environment's `sb_publishable_` guard, not the file paths, modes
(`0o600`), messages, `randomUUID` IDs, fetch calls, apikey/secret handling or the tmpdir credential file. Both files
still have no other imports to touch, so there was no cleanup. The wrapper runs the same command, arguments and options
as before, so the success path is unchanged; `status-command.test.mjs` already covers that. Only the failure surface
changed: it now raises the wrapper's fixed messages. The wrapper also refuses JSON that is not an object; before, a JSON
`null` would have thrown a `TypeError` with no key in it.

`docs/architecture/003-architecture-freeze.md` cites `environment.mjs:4-5`, which still points at the guard and the write.

## Regression test (written first, UNRUN)

New `scripts/backend/status-consumers.test.mjs`, pure `node:test`. It imports only `node:assert/strict`, `node:fs` and
`node:test`. It reads both consumers as text through `readFileSync`, never loads either one (they have real side
effects), has no run-time load, starts no process and makes no network call. Its four tests:

1. **Exact scoped change.** The before-source is pinned as explicit per-line strings, copied from the out-of-repo snapshot
   `/tmp/fitlog-mb1-status-consumers-before.json`. Each consumer must equal that source with the child import replaced by
   the wrapper import and the inline parse replaced by `const status = readLocalStatus();`, and nothing else. The test
   also checks that only those two line indexes differ.
2. **Wrapper only.** Each consumer has one wrapper import line, one no-argument call, and `readLocalStatus` named exactly
   twice. Its static import list is exact and in order. No `child_process`, exec/spawn/fork call, `JSON.parse`, status
   command text, direct helper import, run-time load or `require` remains.
3. **Guard and body.** Only imports come before the status read. The existing exact guard follows it on the next line,
   unchanged, and appears once. The pinned guard contains the exact loopback check, plus the publishable-key check for
   environment. Everything after the guard matches the before-source byte for byte. Every listed side effect (writes,
   modes, logs, `randomUUID()`, `fetch(`, secret-key header, tmpdir file) appears after the guard and never before it.
4. **Self-check.** The test file's own static imports are exactly the three above, and it contains no run-time load.

TDD order: the test was written before either consumer was edited. Expected against the before-source, by reading only:
tests 1–3 fail and test 4 passes. Expected after the change: 4/4 pass. Neither result was observed, because nothing was run.

The proposed future command needs separate authorization. It is pure, uses no process, network or database, and loads
neither consumer:

```
node --test scripts/backend/status-consumers.test.mjs
```

The repository's usual prefix gives `rtk proxy node --test scripts/backend/status-consumers.test.mjs`. The
`backend:test` script's `scripts/backend/*.test.mjs` glob will also pick the file up, but that script goes on to run the
live suites, so it is not the proposed command.

## Unchanged by design

`status-command.mjs`, `status-output.mjs`, `status-command.test.mjs` and `status-output.test.mjs` were read only. They
should still match the reviewed SHA256 values in `harness-command-failure-accepted-2026-11-01.md`. No hashes were
computed this phase because no execution tool was available, so the verifier should record them. The snapshot was read,
not written.

## Residual owners (open)

- **MB-1 / QA-9 G5:** triage the `verify-freeze-projection.mjs` raw child-process and parse diagnostics. These were
  already named and are untouched here.
- **MB-1 / QA-9 G5:** in `preview-account.mjs`, `response.json()` and `login.json()` could throw a V8 `SyntaxError` that
  quotes part of a local auth response that isn't JSON. Token-bearing success bodies are valid JSON, so exposure is
  unlikely. This is out of scope for this phase, which allows no other security changes. It is named for triage.
- **MB-1 / QA-9:** G1–G4, G6, G7 (cleanup, timeout, target binding and the others), F1–F3, F5, F6, the allowlisted
  executor, exact shared-target binding, backend isolation suites and the whole of MB-1 stay open. Historical denied
  sequences stay parked.

## Self-review (C/H/M/L)

The `code-reviewer`, `security-reviewer` and `tdd-guide` sub-agents were not used: this phase's tool scope forbids
subagents.

- **Critical:** none.
- **High:** none.
- **M1:** no independent review yet. An independent verifier must cover the code, security and TDD review.
- **M2:** the tests have not been run. The fixture strings were checked against the snapshot by hand only, including the
  `’` apostrophe, the escaped `\\n` inside the template text, and `${…}` written literally in plain strings. A
  fixture typo would give a false failure, not a false pass, because test 1 compares the whole file.
- **L1:** test 3's body check overlaps test 1, on purpose, so failures name the cause.
- **L2:** the checks are lexical and do not parse the JavaScript. Mistakes fail closed, and the whole-file pin is the
  strong check.
- **L3:** the self-check cannot rule out use of the global `fetch`, because the fixture strings contain `fetch(`.
  Reading the file shows no call.
- **L4:** the consumers now refuse JSON that is not an object with the helper's fixed message. This is stricter and
  intended.
- **L5:** the `response.json()` residual above.
- **L6:** `${…}` written literally in plain strings would trip `no-template-curly-in-string` if `scripts/backend` were
  ever linted. Today ESLint covers only `apps/mobile`.
