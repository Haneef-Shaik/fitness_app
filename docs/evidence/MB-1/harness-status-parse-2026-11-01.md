# MB-1: guarded parse of captured `supabase status` output in the three integration suites (F4 for QA-9 G5)

| Field | Value |
|---|---|
| Written | 1 November 2026 (no clock time: the tools were Read, Grep, Edit and Write only) |
| Authority | Codex AUTH-01: MB-1's carried shared-harness request (phase1d.md:129; handoff "Requests for other lanes' files"), as the F4 prerequisite for QA-9 phase 3N gap G5. Codex assigns the exact shared-file exception for `verify.mjs` (S8) and `verify-gym.mjs`, `verify-freezes.mjs` (S2) |
| What ran | **Nothing.** No test, `node`, CLI, Docker, database, network, Git or hash command. Source reads and edits only |
| Labels | **Inspected:** read only. **UNRUN:** written, never executed |
| Status | Source change only. No Done box, goal status, runtime acceptance, harness readiness or 3N authorization is claimed |

## 1. Change (inspected)

| Path | Change | Why |
|---|---|---|
| `scripts/backend/status-output.mjs` | **New**, 28 lines. One export, `parseStatusOutput(output)`. It takes a string, or a Buffer decoded as UTF-8, and returns `JSON.parse`'s value only if that is a non-null, non-array object. Everything else throws a plain `Error` with one of two fixed messages: `… did not print JSON; …` (malformed text, or input that is not a string or Buffer) and `… did not print a JSON object; …` (null, an array or a scalar). Both end `its output is not shown because it holds keys`. The parse error is caught with no binding and dropped, then the fixed error is thrown outside the `catch`, with no `cause` | G5: V8's `JSON.parse` message quotes the input near where it fails. An uncaught throw at a suite's top level prints that quote, and status output holds keys. The first message is the same text as `local-stack.mjs:43`'s existing guard (F4: "the guarded parse that `local-stack.mjs` already uses") |
| `scripts/backend/status-output.test.mjs` | **New**, 7 `node:test` tests, authored **before** the helper existed. **UNRUN** (§3) | Test-first record for the helper and the wiring |
| `scripts/backend/verify.mjs` | Line 4 (blank) becomes `import { parseStatusOutput } from './status-output.mjs';`. On line 6, `JSON.parse(` becomes `parseStatusOutput(`. Nothing else | Guard the one status parse. Replacing the blank line keeps every line number QA-9 cites (`:6`, `:7`, `:72`, `:74`) |
| `scripts/backend/verify-gym.mjs` | New line 4, the same import. On line 5 (was 4), `JSON.parse(` becomes `parseStatusOutput(`. Nothing else | The same. Lines 4 onwards move down by one |
| `scripts/backend/verify-freezes.mjs` | The same as `verify-gym.mjs` | The same |
| `docs/evidence/MB-1/harness-status-parse-2026-11-01.md` | New. This record | — |

**Unchanged, by reading:**
- In each suite:
  - the status command and every option, byte for byte: `execFileSync('pnpm', ['exec', 'supabase', 'status', '-o', 'json'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })`;
  - the `node:child_process` import;
  - the loopback assertion, still the very next line;
  - `call()`, every test step, `finally` and the cleanup.
- Not touched: `local-stack.mjs`, `verify-identity*`, every `mb1-replay*` file, `verify-freeze-projection.mjs`, `package.json`, the checkpoint, the handoff, status, `GOALS.md` and the ledger.

**Behaviour:**
- A valid status object parses exactly as before. The helper returns `JSON.parse`'s own object, with no trim or rewrite.
- **Only narrower:**
  - Malformed output throws the same kind of failure, now with fixed text.
  - `null` once threw a `TypeError` reading `API_URL`. Arrays and scalars once failed the loopback assertion. Now all three are refused at the parse.
  - A non-string, non-Buffer input is refused before any parse. Example: an object whose `toString` returns JSON, which a bare `JSON.parse` would coerce.
- The helper decides no target. The suites' `assert.equal(… .API_URL, 'http://127.0.0.1:55321', …)` is still the only target check.

**Line numbers for QA-9's records** (QA-9's file, not edited here):
- `verify-gym.mjs`: `:4` → `:5`, `:63` → `:64`, `:65` → `:66`, `:67` → `:68`.
- `verify-freezes.mjs`: `:4` → `:5`, `:79` → `:80`, `:81` → `:82`, `:83` → `:84`.
- `verify.mjs`: unchanged.

## 2. Tests (authored first; UNRUN)

`scripts/backend/status-output.test.mjs`:
- **Imports:** only `node:assert/strict`, `node:buffer`, `node:fs` (`readFileSync`), `node:test`, `node:util` (`inspect`) and the helper.
- **Suites:** it never imports one. Each is read as text, because importing one runs it against the stack.
- **Inputs:** synthetic only. The two credential-shaped values carry Supabase's key prefixes. They are joined from parts at run time, so no file spells either one as a literal, and this record doesn't either.

| # | Test | What it shows |
|---|---|---|
| 1 | A JSON object, as a string or a Buffer, comes back exactly as `JSON.parse` gives it | A string, a newline-ended string, a Buffer and nested inputs each return a deep-equal object. The Buffer is byte-equal after the call |
| 2 | The helper decides no target | Six near-miss `API_URL`s (spaces, a trailing slash, `localhost`, `https`, port 55322) come back unchanged and unequal to the loopback. `{}` comes back as `{}` |
| 3 | Malformed output fails closed with one fixed message | Ten malformed inputs, each as a string and as a Buffer. Each holds the synthetic secret, or part of it, except the empty and blank ones. Cases include a truncation, a cut inside the secret, the secret unquoted at the failing position, the secret alone, a whole object followed by more output, a notice line before it, a text table, a raw line break in a string, empty, and blank |
| 4 | Non-objects fail closed with their own fixed message | `null`, ` null\n`, `[]`, an array that wraps a valid status, the loopback URL and the secret as JSON strings, three numbers and two booleans (11 inputs). Each is tried as a string and as a Buffer |
| 5 | Non-text input is refused before any parse | `undefined`, `null`, a number, a boolean, a `toString` lookalike, an array of a JSON string, and a plain `Uint8Array` |
| 6 | Wiring, read as text | For each of the three suites: one helper import; the child-process import unchanged; `const status|config = parseStatusOutput(<the exact command>);`, then the exact loopback assertion at once; the command, `execFileSync(`, `parseStatusOutput(` and the assertion each exactly once; no `JSON.parse(` applied to `execFileSync(` |
| 7 | The helper is pure and narrow | Its only export is `parseStatusOutput`, and `node:buffer` is its only import. No `process`, `console`, `globalThis`, `require(`, `fetch`, `execFile`, `spawn`, `readFile`, `writeFile` or dynamic `import(` appears |

**Checks on every refusal in 3–5.** Each refusal must:
- be a plain `Error` with the exact fixed message, no `cause`, and no own property but `message` (and `stack`);
- have a stack that is `Error: <fixed message>` followed only by `at` lines;
- across the message, `String(error)`, the stack and `inspect(error, { showHidden: true, depth: Infinity })`, show neither synthetic value, no key-prefix fragment, no `API_URL`, `SECRET_KEY`, `PUBLISHABLE_KEY` or `127.0.0.1`, and no V8 parse wording or `[cause]`.

**RED was not observed.** The tests were written before `status-output.mjs` existed, so before it the file could not load. Nothing was executed to show this.

## 3. Proposed verification (FUTURE; needs its own authorization; not run)

From the worktree root, all pure:

```sh
rtk proxy node --check scripts/backend/status-output.mjs
rtk proxy node --check scripts/backend/status-output.test.mjs
rtk proxy node --check scripts/backend/verify.mjs
rtk proxy node --check scripts/backend/verify-gym.mjs
rtk proxy node --check scripts/backend/verify-freezes.mjs
rtk proxy node --test scripts/backend/status-output.test.mjs
```

- `node --check` parses each file without running it.
- The test command imports only the helper and reads the three suites as text.
- **Never as part of this check:** `node scripts/backend/verify*.mjs`, `pnpm backend:test` or `supabase status`. Each is live.
- The full pure glob `node --test scripts/backend/*.test.mjs` now also picks up these 7 tests. No new total is claimed.

**Planned mutations, UNRUN.** Each should be killed by the named tests:
- the helper rethrows with `{ cause }`, or puts the input in its message (3, 4, 5);
- it returns a non-object (4);
- it trims or rewrites a value (2);
- it coerces non-text with `String()` (5);
- one suite reverted to `JSON.parse(` (6);
- the helper imports `node:fs` or adds an export (7).

## 4. Residual limits: open, not claimed

- **`execFileSync` command-failure diagnostics:** not fixed.
  - A non-zero exit, a signal or a buffer overflow throws inside `execFileSync`, before the helper runs.
  - Node's uncaught report inspects that error, and its `stdout` property holds whatever the CLI printed. So a failed status run may still print keys.
  - This needs its own fix: a guarded executor or a fixed rethrow.
- **Still open and untouched:**
  - target binding to proven identity (G6, MB-1 M1 gap);
  - timeouts and signal handling (G4);
  - checked and proven cleanup (G1–G3);
  - per-run namespace (G7);
  - `local-stack.mjs`'s allowlisted executor;
  - `verify-identity.mjs` in `backend:test` and its identity gates;
  - the CLI's network behaviour during `status`.
- **No readiness claim:** the harness is not claimed ready. QA-9 phase 3N stays where it was.
- **Out of scope:** `verify-freeze-projection.mjs:12` still uses a bare `JSON.parse`, on psql output of `freeze_projection`, not status. It is not touched.
- **Loopback assertion:** unchanged, as the brief requires. On a mismatch its `AssertionError` shows the actual `API_URL` value, which is a URL, not a key.
- **Buffer path:** invalid UTF-8 bytes decode to U+FFFD before the parse. The current callers pass strings (`encoding: 'utf8'`), so this path is unused today.
- **Records:**
  - no hashes taken;
  - no subagent review (the brief forbids subagents);
  - nothing committed or staged;
  - the checkpoint and handoff are unchanged (the brief).

## 5. Self-review (source only)

- **Critical:** none.
- **High:** none.
- **Medium:**
  - **M1:** nothing executed. RED was never observed, and the tests' reliance on V8 details is unverified:
    - the own-property layout of `Error`;
    - stack lines that start with `at`;
    - the `inspect` output.

    §3 is the remedy.
- **Low:**
  - **L1:** in `verify.mjs`, the blank line after the imports is now the helper import. This is cosmetic, chosen to keep cited line numbers.
  - **L2:** QA-9's line citations for two files are stale by one (§1). QA-9 owns that file.
  - **L3:** test 6 pins exact source text: the command, the assertion and its position. A later legitimate edit by S8 or S2 to those lines must update it. That is intended.
  - **L4:** test 7's purity check is textual. It shows what the helper names, not what it can reach at run time.
- **Info:** the `execFileSync` failure path (§4) is the main remaining exposure on this line, and is out of this change's scope.
