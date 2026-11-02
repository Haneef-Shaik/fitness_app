# G5 residual: preview-account response reads now go through a guarded helper (source change, tests UNRUN). 2026-11-01

Codex assigned this bounded MB-1 / QA-9 G5 prerequisite under explicit owner delegation AUTH-01. A local Claude
implementer wrote it using only Read, Grep, Edit and Write. It ran nothing: no process, test, CLI, database, network,
environment or credential read, and no commit. It did not touch status, GOALS or the ledger. This record claims no
Done-when box, no acceptance-ledger result, no whole-G5 closure and no MB-1 acceptance. It covers exactly one carried
residual from `harness-status-consumers-accepted-2026-11-01.md`: preview `response.json()`/`login.json()` diagnostic
triage plus the missing `login.ok` check. The coordinator consulted the current official Supabase CLI docs, and there is
no CLI convention change.

## Why

PRD 22.1 says never log tokens. After the accepted status-consumer change, `scripts/backend/preview-account.mjs` still
parsed two local auth responses inline:

- `const user = await response.json();` (admin create-user). A body that was not JSON could throw a V8 `SyntaxError`
  whose message quotes part of that body.
- `const session = await login.json();` (password sign-in). This had the same parse exposure, and `login.ok` was never
  checked. A failed sign-in went straight on to onboarding with `Bearer undefined` and only failed later, as
  'Could not initialize preview profile'.

No actual leak is asserted. Token-bearing success bodies are valid JSON. This is defensive triage of the failure surface.

## What changed (exactly five paths)

| Path | Change |
| --- | --- |
| `scripts/backend/preview-response.test.mjs` | NEW. Written first, UNRUN. Pure `node:test` over fake responses. |
| `scripts/backend/status-consumers.test.mjs` | Minimal update: the preview import list and expected body pin this correction. |
| `scripts/backend/preview-response.mjs` | NEW. Pure helper. No imports; no file, network, process or console use. |
| `scripts/backend/preview-account.mjs` | One import added; the two inline parses replaced with guarded calls (below). |
| `docs/evidence/MB-1/harness-preview-response-2026-11-01.md` | This record. |

`preview-account.mjs` still has 18 lines plus its closing line break:

| Line (before → after) | Before | After |
| --- | --- | --- |
| — → 3 | (none) | `import { readCreatedAccount, readLoginSession } from './preview-response.mjs';` |
| 11–12 → 12 | `if (!response.ok) throw new Error('Could not create local preview account');` + `const user = await response.json();` | `const user = await readCreatedAccount(response);` |
| 14 → 14 | `const session = await login.json();` | `const session = await readLoginSession(login);` |

Every other line is preserved byte for byte:

- the exact wrapper call `readLocalStatus()` and the loopback guard;
- the email/password generation;
- all three fetch calls: URL, method, headers, apikey/secret use, request bodies and order;
- the onboarding call, including `Bearer ${session.access_token}`, and its `profile.ok` check;
- the tmpdir credential file: path, `JSON.stringify({ email, password, id: user.id })` content and mode `0o600`;
- the success message.

The create non-ok refusal moved into the helper with its message unchanged. No fetch, storage, permission or profile
behaviour was added.

## Helper contract (`preview-response.mjs`)

There are two operation-specific exports. Each takes one parameter, the response, so no caller text can reach a
diagnostic. Steps, in order:

1. **Refuse a response that is not ok before reading the body.** The response must be a non-null object whose `ok` is
   exactly `true`. Anything else is refused: a missing `ok`, a falsy `ok`, a truthy `ok` that is not `true`, a
   non-object, or an `ok` getter that throws. `json()` is never called on this path. A throw while reading `ok` is
   dropped in an unbound `catch {}`.
2. **Read the body once.** `await response.json()` runs inside an unbound `catch {}`. A sync throw, a rejection, a
   missing or non-function `json`, or a thenable that throws gives the fixed unread message. The thrown value is never
   bound or read: no message, stack, cause, field or conversion.
3. **Shape.** `null`, an array or a scalar gives the fixed not-an-object message.
4. **Required field.** create needs a nonempty string `id`; login needs a nonempty string `access_token`. The field is
   read once, inside an unbound `catch {}`. A missing field, a non-string or empty value, or a throwing getter gives
   the fixed missing message.
5. **Return.** A new frozen object holding only that field: `{ id }` or `{ access_token }`. The consumer reads only
   `user.id` and `session.access_token`, so its later lines are unchanged. Other token-bearing fields, such as
   `refresh_token`, are not kept.

Closed allowlist (eight fixed messages; each `new Error(message)`, with no cause and no extra field):

| Operation | refused (not ok) | unread | not an object | missing field |
| --- | --- | --- | --- | --- |
| create | `Could not create local preview account` (unchanged) | `Could not read the local preview account response; it is not shown because it can hold credentials` | `The local preview account response was not a JSON object; it is not shown because it can hold credentials` | `The local preview account response had no account id; it is not shown because it can hold credentials` |
| login | `Could not sign in to local preview account` | `Could not read the local preview sign-in response; it is not shown because it can hold tokens` | `The local preview sign-in response was not a JSON object; it is not shown because it can hold tokens` | `The local preview sign-in response had no access token; it is not shown because it can hold tokens` |

Intended behaviour changes, all fail-closed:

- A non-ok sign-in now stops before parsing and before onboarding.
- A create or sign-in success that lacks its nonempty string field now stops before anything later runs. Before, a
  missing `id` was silently dropped from the credential file.
- `ok` must be exactly `true` rather than truthy. A real fetch `Response.ok` is always boolean.

## Regression tests (written first, UNRUN)

**New `scripts/backend/preview-response.test.mjs`.**

- Imports only `node:assert/strict`, `node:test`, `node:util` (for `inspect`) and the pure helper. It does not import or
  run the preview script, and uses no fs, process, network, private file or real credential. All values are synthetic
  and built from parts.
- Each case runs for both operations. A shared `refusal()` check requires a new plain `Error` that is not the thrown
  value, with no field but `message`, no symbol field, no cause, and a message that is exactly the expected one and in
  the closed list. Its stack must hold call sites only.
- It inspects the message, `String()`, the stack, `inspect` with `showHidden`, JSON with and without hidden names, and a
  `structuredClone`. None may show a synthetic token, refresh token, sentinel, account id or email, a parse or type
  detail, `Bearer`, a body or response field as `name:`, or a cause.

Nine tests:

1. **Success.** A proxy response records every operation. The test sees exactly: `ok` read, `json` read, then `json()`
   called once with no argument. The result is a new frozen `{ field }` and the body is unchanged.
2. **Not ok, json unread.** Covers `ok` values false, undefined, null, 0, 1, '', 'true', {}, [] and `Object(true)`, a
   response with no `ok` at all, and non-responses (undefined, null, true, 200, a token string, a symbol). All give
   `refused` with zero `json()` calls. The missing-`ok` case is the sign-in gap: it stops before parsing, and so before
   onboarding.
3. **Not ok is touched only for ok.** The trap-recording proxy sees exactly `['trap get', 'get ok']`. An `ok` getter that
   throws synthetic tokens is refused without `json()` being called.
4. **Body read throws or rejects.** Thrown values include:
   - a real V8 `JSON.parse` error over a token-bearing non-JSON body;
   - a `SyntaxError` carrying body, status, headers, a cause and a stack full of tokens;
   - an `AggregateError` around it;
   - a plain object with string forms;
   - a token string, the whole body as text, a symbol, undefined and null.

   Each is tried as a rejection and as a sync throw. Each gives `unread`, with `json()` called exactly once (never
   retried).
5. **Odd json.** No `json`, `json` a string, `json` null, a thenable whose `then` throws, and a thenable that rejects all
   give `unread`.
6. **Thrown value never read.** Getters on every field and conversion (`message`, `stack`, `cause`, `toString`,
   `toJSON`, `then`, `Symbol.toPrimitive`, `inspect.custom`, …), and proxies recording every trap, all record zero
   access, both as a rejection and as a throw.
7. **Not an object.** null, undefined, [], `[body]`, a token string, the body as a JSON string, '', 0, 42, true and false
   all give `notObject`.
8. **Missing field.** Covers {}, the body without the field, the other operation's body, the field only nested, '',
   null, 42, true, an array or object holding the value, a `String` object, and a field getter that throws tokens. All
   give `missing`.
9. **Closed list.** The exports are exactly `readCreatedAccount` and `readLoginSession`, each with `length` 1. The eight
   messages are distinct and name no key, token or body. Extra caller arguments (a sentinel, `{ message: token }`)
   change nothing. Every failure throws a new error, and each operation throws only its own four messages.

**Updated `scripts/backend/status-consumers.test.mjs` (minimal; environment pin untouched).**

- The `environment.mjs` entry and its fixture are byte-identical. It gets the status-only defaults (`NO_EDITS`,
  `STATUS_REMOVED`, `STATUS_ADDED`, empty sequence) through destructuring.
- The preview `before` fixture is unchanged. New: `RESPONSE_EDITS`, keyed on lines after the status substitution (the
  wrapper import gains the helper import after it, the create refusal is dropped, the two parses become the two guarded
  calls), the updated preview import list, explicit `removed` and `added` line sets, and an order `sequence`.
- Test 1 still pins the whole file. The old changed-index assertion only works for 1:1 line substitution, so it is
  replaced by exact removed and added line sets, plus a check that each edit key matches one line.
- Test 2 keeps every wrapper, child-process, status-command, `JSON.parse`, helper and run-time-load invariant, and adds
  `no .json(` for both consumers.
- Test 3 keeps the guard-at-once, imports-only-before and every side effect after (never before) the guard. The body is
  compared against the edited expectation. For preview it adds the order: create fetch → guarded create read → sign-in
  fetch → guarded sign-in read → onboarding fetch → credential write.
- Test 4 (self-check, three imports, no run-time load) is unchanged. The new text was checked by Grep so that it does not
  trip it.

TDD order: both tests were written before the helper or the consumer existed or changed. Expected results come from
reading only:

- **Before the change:** `preview-response.test.mjs` cannot load, because the helper is missing, so it fails.
  `status-consumers.test.mjs` tests 1–3 fail on preview and test 4 passes.
- **After the change:** 9/9 and 4/4 pass.

Neither result was observed, because nothing was run.

## Proposed future commands (separately authorized, not run)

Each command is pure, loads no consumer, and needs no process, network or database beyond the Node test runner itself:

```
rtk proxy node --test scripts/backend/preview-response.test.mjs
rtk proxy node --test scripts/backend/status-consumers.test.mjs
```

The `backend:test` glob would pick both up, but it goes on to run the live suites, so it is not proposed.

## Unchanged by design

The following were read only and are untouched:

- `status-command.mjs`, `status-output.mjs`, `status-command.test.mjs` and `status-output.test.mjs` (the accepted status
  helpers and their tests);
- `environment.mjs`.

They should still match the SHA256 values in `harness-status-consumers-accepted-2026-11-01.md`. `preview-account.mjs` and
`status-consumers.test.mjs` change from their accepted hashes on purpose. No hashes were computed, because there was no
execution tool; the verifier should record them. The before snapshot
`/tmp/fitlog-mb1-preview-response-20261101-before.json` was neither read nor written by the implementer. The base
content was read directly from the worktree at the start, and both new source files were created fresh.

## Residuals and owners (open)

**Cleanup gaps (still open, not addressed here, owned by MB-1 / QA-9 cleanup and timeout gaps):**

- If create succeeds and sign-in, onboarding or the write then fails, the synthetic account stays in local auth with no
  cleanup. This predates the change; the new fail-closed stops make no cleanup attempt.
- The tmpdir credential file persists after success by design.
- There is no timeout on any fetch or `json()`. A body that never settles hangs. Fetch behaviour was not expanded.

**Other open items:**

- **MB-1 / QA-9 G5:** projection subprocess and parse diagnostics (`verify-freeze-projection.mjs`) are untouched.
  Whole-G5 closure is not claimed.
- **MB-1:** the stale helper caller comments stay as nonblocking documentation; no polish was done.
- **MB-1 / QA-9:** G1–G4, G6, G7, F1–F3, F5, F6, the allowlisted executor, route and target binding, backend isolation
  suites and the whole of MB-1 stay open. No live CLI, consumer, DB, network, release, device, hosted or mutation proof
  ran. Historical denied sequences stay parked without alternative retries.

## Self-review (C/H/M/L)

The code-reviewer, security-reviewer and tdd-guide sub-agents were not used, because this phase's tool scope forbids
subagents.

- **Critical:** none.
- **High:** none.
- **M1:** there is no independent review yet. A verifier must cover the code, security and TDD review.
- **M2:** the tests have not run. The fixtures and expectations were traced by hand against the written consumer: 19
  lines, the removed and added sets, the sequence order, no `.json(`, and the self-check Grep. A typo would most likely
  give a false failure, not a false pass, because the whole-file pin and the exact message pins fail closed.
- **L1:** whitespace-only strings count as nonempty, as specified. An inherited (non-own) field would be accepted.
  `JSON.parse` never produces one.
- **L2:** a refused response's body is left unread and unconsumed. This is intended (refuse before reading), and the
  script exits on the rejection.
- **L3:** the top-level rejection prints the fixed message plus call-site frames (local file paths), the same pattern as
  `status-command.mjs`.
- **L4:** the helper's purity (no imports; no fs, process, network or console use) was confirmed by reading only. The
  helper test may not use fs, so it cannot scan source. `status-consumers.test.mjs` was deliberately not extended to scan
  the helper, to keep this update minimal.
- **L5:** the `SUBSTITUTIONS` comment in `status-consumers.test.mjs` ("The only two edits allowed") now describes only the
  status layer. The adjacent new comment explains the later correction. This is nonblocking wording.
- **L6:** as before, `${…}` written literally in plain strings would trip `no-template-curly-in-string` if
  `scripts/backend` were ever linted. Today ESLint covers only `apps/mobile`.
