# F4/G5 status-command failure safety — writer phase, 2026-11-01

Writer phase only. Source written; **every test is UNRUN**. Nothing here claims runtime proof, goal or box acceptance,
a ledger entry or Done. Scope is the carried MB-1 F4/G5 shared-harness prerequisite, under the AUTH-01 S8/S2
shared-file ownership exception for exactly the seven paths below.

## Why

QA-9 phase 3N gap G5: the captured-output parse is guarded (`status-output.mjs`, accepted at 7/7 synthetic tests in
`harness-status-accepted-2026-11-01.md`). But `execFileSync` itself still throws when `pnpm exec supabase status -o json`
fails, and Node's `child_process` docs say that error carries the full `spawnSync` result: `stdout`, `stderr`,
`output`, `status`, `signal` and `pid`, with a message that names the command. In the three suites that error went
uncaught, so Node would print it with its fields. Captured stdout is status JSON, which holds the local keys. That breaks
PRD §22.1 (never log tokens).

## Change

- `scripts/backend/status-command.mjs` (new): `readLocalStatus(run = execFileSync)`. It runs the unchanged command
  `run('pnpm', ['exec', 'supabase', 'status', '-o', 'json'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })`
  inside `try { … } catch { … }`. The catch has no binding, so the thrown value is never read. A failure throws
  `new Error(FAILED)`: one fixed message, no cause, no fields. Successful output goes to the existing
  `parseStatusOutput` outside the catch, so the parser's own fixed refusals are kept. Loading the module runs nothing:
  the real command is only the default of `run`. No change to environment, timeout, cwd or target.
- `scripts/backend/verify.mjs`, `verify-gym.mjs`, `verify-freezes.mjs`: the now-unused `node:child_process` and
  `status-output.mjs` imports become one `status-command.mjs` import. The status line becomes
  `const status|config = readLocalStatus();`. The exact-loopback assertion on the next line and every other byte
  (business assertions, cleanup) are unchanged.
- `scripts/backend/status-command.test.mjs` (new, written before the wrapper): 7 pure `node:test` tests, all with
  injected fakes:
  - Success as a string and as a Buffer: exactly one call, with the exact command, arguments and options.
  - Delegation to the parser: the same value, a near-miss target left unchanged, and the parser's own
    `NOT_JSON`/`NOT_OBJECT` refusals for malformed or non-object output.
  - Thrown error objects with a synthetic key and sentinel in message, stack, cause, stdout, stderr and output. Cases
    include timeout, failed start, AggregateError, a plain object and a Buffer.
  - Thrown primitives, including a string, BigInt and Symbol.
  - Getters on every field, and proxies that record every trap, proving the caught value is never touched.
  - A source gate checked before the dynamic import, so a regression cannot start the real command. It also checks
    that the catch has no binding and the parse sits after the catch.
  - Text-only checks of the three suites. They are never imported.

  Every refusal is checked under message, `String`, stack, `inspect` (showHidden), JSON with and without hidden
  fields, and `structuredClone`.
- `scripts/backend/status-output.test.mjs`: only the wiring constants and the wiring test changed, to follow
  suite → wrapper → parser. It still requires: a single wrapper call in each suite; no child-process import or call and
  no parse in the suites; the unchanged command, run once in the wrapper, with the helper as its one parse; and the
  unchanged loopback assertion immediately after the call. The other six parser tests are byte-for-byte unchanged.

Not touched: `status-output.mjs`, `local-stack.mjs`, `verify-identity.mjs`, replay files, package files, GOALS, the
ledger and main.

## Verification still owed (UNRUN)

The earlier 7/7 is historical, from before this change. Both pure files need a fresh, independent run by a separately
authorised verifier. The proposed exact pure commands (not run here) are:

- `rtk proxy node --test scripts/backend/status-command.test.mjs`
- `rtk proxy node --test scripts/backend/status-output.test.mjs`

RED was not observed: the test was written first against a missing module, but it was never executed. Mutation
checks, and suite syntax or execution, are also unproved. Do not run the three suites for this. They reach the
shared local stack.

## Limits and residual owners

- G1–G4, G6, G7 and the shared target binding stay open. Owner: MB-1 shared-harness prerequisites, verified under
  QA-9 phase 3N.
- By design, a failed status command now gives no exit code or stderr. To diagnose it, run the status command by hand
  in a trusted terminal.
- The hostile-value proof covers JavaScript-level reads only, not V8 or Node internals.
- Seen, not changed: `verify-freeze-projection.mjs` runs `JSON.parse(execFileSync('docker', … psql …))` with stderr
  piped. That is a different command, not status output. MB-1/QA-9 to triage whether it is in G5.
- QA-9 citation offsets remain QA-9-owned and non-blocking.
