# Projection output diagnostic-safety prerequisite (MB-1 / QA-9 G5) — implementer record, 2026-11-02

Codex assigned this work under owner delegation AUTH-01, inside the review-and-merge freeze. Scope: **only** the
diagnostic-safety prerequisite for the freeze projection query's output. This is not whole-G5 or MB-1 acceptance. The
runtime, backend, target binding and the hard-coded container target (MB-1/QA-9) all stay **OPEN**.

**Status: UNRUN.** I wrote the tests first and did not run them, and I ran nothing else. Tools used: Read, Grep, Edit and
Write only. No Bash, no execution, no tests, no imports, no CLI, no DB, no network, no credentials or env, and no
git, status, GOALS or ledger action. There were no permission denials. I computed no SHA256 hashes because I had no
shell; the coordinator should hash the four paths below.

## Inputs read

`scripts/backend/verify-freeze-projection.mjs`, `scripts/backend/status-command.mjs` (and its test, used as the pattern),
`scripts/backend/status-output.mjs`, `docs/evidence/MB-1/harness-command-failure-review-2026-11-01-collected.md`,
`docs/evidence/MB-1/harness-preview-response-accepted-2026-11-01.md` and `docs/PRD.md` §22.1 (lines 1476-1494).
I read `supabase/migrations/20261019140429_gym_freezes.sql:93-147` to confirm that `private.freeze_projection` returns
`jsonb_build_object(...)` only, so the object-shape refusal cannot reject any value the suite asserts on. The coordinator
checked the Supabase CLI reference, so I made no CLI or API convention change.

## Exact paths written (four, no others)

1. `scripts/backend/projection-output.test.mjs` (new, written first): 11 `node:test` tests.
2. `scripts/backend/projection-output.mjs` (new): the helper, which exports `readProjectionResult(run)` alone.
3. `scripts/backend/verify-freeze-projection.mjs` (edited): two changes and nothing else.
   - Added line 4: `import { readProjectionResult } from './projection-output.mjs';`, after the three existing imports.
   - Line 13 (was 12): `JSON.parse(execFileSync(` became `readProjectionResult(() => execFileSync(`. The `'docker'`
     executable, every argument, the SQL construction on line 12, the `{ encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }`
     options, all fixtures, all assertions and their order are unchanged. I added no targeting logic and no DB
     operation, and the container name still appears once.
4. `docs/evidence/MB-1/harness-projection-output-2026-11-02.md` (this file).

## Helper behaviour (`projection-output.mjs`)

- It is pure. It has no import at all: no fs, child_process, network, console or process access, and no real default
  runner. Loading it only defines four fixed strings and two private symbols.
- If `run` is not a function, it raises the fixed `NO_RUN` and calls nothing.
- It calls `run()` once, with no arguments. Any thrown value is caught by an unbound `catch {}`, which never reads it.
  The helper then raises a new `Error(FAILED)` with no cause.
- Output that is not a string is refused as `NOT_JSON` without being converted or awaited. `JSON.parse` sits in its own
  unbound `catch {}`, so a parse failure also becomes the fixed `NOT_JSON`.
- `null`, arrays and other non-objects raise the fixed `NOT_OBJECT`. Objects are returned as they were printed.
- All four messages are fixed text. None includes the error, output, SQL or any other varying text.

Effect on the consumer: execution failures and parse failures now show only the fixed messages. The four existing
`assert.throws` cases still pass on a refusal, because two have no validator and two use `/./`, which matches
`String(error)` = `Error: <fixed message>`.

## Tests written (UNRUN)

Every callback is an inline synthetic fake. No subprocess, network or private file is involved, and the consumer is
read as text and never imported or executed. The helper's source is checked as text before its dynamic import.

1. Success: projection-shaped JSON, with and without psql's newline or extra whitespace, returns the deep-equal object
   after exactly one call with `[]` arguments. `{}` is accepted. Output carrying the sentinel is returned unfiltered.
   Each read is a fresh parse.
2. No callback: no argument, 11 non-callables and one watched non-callable proxy all raise `NO_RUN`. Nothing is read.
3. Command errors, 7 thrown objects: a psql-style failure with the sentinel in message, stack, cause, stdout, stderr,
   output and spawnargs; a timeout; ENOENT; an AggregateError; a SyntaxError; and a plain object with toString/toJSON.
   Each gives one new `FAILED` error after exactly one call. All the errors are distinct.
4. Thrown primitives, 10 values, including the sentinel, SQL, BigInt and Symbol: each gives `FAILED`.
5. Poisoned values, where every getter (message, stack, cause, stdout, stderr, output, conversion symbols, `then`,
   `inspect.custom`, …) and every proxy trap records the access: `touched` stays `[]`.
6. No retry: a callback that fails once and would then succeed gives `FAILED` or `NOT_JSON`, with a call count of 1.
7. Malformed JSON carrying the sentinel, in 8 forms (unquoted sentinel, bare sentinel, psql error text, truncated,
   two rows, trailing comma, empty, blank line): each gives `NOT_JSON`.
8. Non-string output (undefined, null, number, boolean, BigInt, Symbol, Uint8Array, Promise, an object with
   toString, watched getters and a proxy): each gives `NOT_JSON`, and nothing is read or converted.
9. Wrong shapes (`null`, `null\n`, `[]`, an array holding the projection, a number, a JSON string holding the
   sentinel, `true`, `false`, `""`): each gives `NOT_OBJECT`.
10. Exports: only `readProjectionResult` is exported, and the four messages are distinct and quote nothing.
11. Consumer wiring, checked on the source text only:
    - the import order;
    - the exact module specifiers;
    - the exact `project` header, the args line, the wrapped call and the closing brace;
    - `execFileSync` named only in its import and the callback;
    - one `readProjectionResult(` and no `JSON.parse`;
    - the container appearing once;
    - 10 `project(`, 13 `assert.equal(` and 4 `assert.throws(`;
    - no new `catch`, spawn, fetch or file access.

Every refusal is checked through message, `String`, stack, `inspect` with showHidden, both JSON forms and
`structuredClone`. Each must be a plain `Error.prototype` error with no `cause`, only `message` as an own property (plus
`stack`), no symbols, a stack made of the fixed head plus call sites, and no sentinel, SQL, raw output or original-error
detail.

## Proposed independent verification (not run; needs separate authorization)

```
rtk proxy node --test scripts/backend/projection-output.test.mjs
```

That is the only command I propose. If it passes, it should report 11 tests. I propose no consumer, backend, Docker or
DB run.

## Not proven / open

- Not proven: RED, mutation checks, any test execution, consumer syntax or execution, live projection behaviour,
  backend gates, whole G5, MB-1 Done-when boxes, the ledger, integration and release.
- Still open (MB-1/QA-9): the hard-coded `supabase_db_fitlog_rebuild_20261017` target and target binding, runtime and
  backend verification, and G1-G4/G6/G7.
- The byte-for-byte diff of the consumer against its prior version, and the hashes, are left to the coordinator.

## Self-review

- **Critical:** none.
- **High:** none.
- **Medium:**
  - **M1 (verification pending):** everything is UNRUN. The source-text gates pin exact lines and tokens. I checked
    the helper's comments and code by eye against every forbidden-token, `run(`, `catch {`, `throw`, field-read and
    export pin, and the consumer against every line and count pin. A first run could still expose a brittle pin in
    the test itself. Resolve this with the single proposed command, run separately.
- **Low:**
  - **L1 (existing, not changed; MB-1/QA-9):** the consumer's four `assert.throws` negatives accept any raised error.
    They cannot tell an intended DB rejection from a Docker, psql or SQL-text failure, and the fixed messages now hide
    which one happened. The positive calls run first (line 15), so a stack that is down fails before the negatives
    run.
  - **L2 (by design):** a failed query now shows no exit code, stderr or psql `ERROR` text. Diagnosing one means
    re-running the SQL under separate authorization.
  - **L3 (by design):** Buffer or Uint8Array output is refused as `NOT_JSON`. The consumer always gets a string,
    because it passes `encoding: 'utf8'`.
  - **L4:** the gates are text matching. The hostile-value proof covers JavaScript-level reads only. The consumer pins
    are lines and counts, not a full diff.
  - **L5 (fixed during the work):** the first Edit dropped the space in `'docker', ['exec'`. I corrected it with a
    second Edit and confirmed it by reading the file: line 13 matches the original apart from the wrapper.
  - **L6 (note):** the new test matches the `backend:test` glob `scripts/backend/*.test.mjs` in `package.json`, so
    it will run in that suite later. It is pure, so this is expected.
