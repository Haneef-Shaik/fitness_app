COMPLETE. The preview-account response-safety fix is written across exactly the five assigned paths. Nothing was run: no tests, process, network, credentials or commit. There were no tool denials.

**Paths written**
1. `scripts/backend/preview-response.test.mjs` (new, written first, not run): 9 `node:test` tests using fake responses. It imports only `node:assert/strict`, `node:test`, `node:util` and the helper. It does not touch the consumer, files, processes or the network.
2. `scripts/backend/status-consumers.test.mjs` (small update): the environment entry and its pinned source are unchanged. The preview entry gets the new import list, the exact line edits, the exact sets of lines removed and added, and a check on the order of calls. All wrapper and guard checks are kept, plus a new "no `.json(`" check. Test 4 (the file's own import check) still passes by Grep after I fixed one message that would have tripped it.
3. `scripts/backend/preview-response.mjs` (new): a helper with no imports. It exports `readCreatedAccount` and `readLoginSession`, one parameter each, so no caller text can reach an error message.
   - A response whose `ok` is not exactly `true` is refused before its body is read.
   - `json()` runs inside a `catch {}` that never binds the thrown value.
   - It rejects null, arrays and scalars, and requires a non-empty string `id` (create) or `access_token` (sign-in).
   - Errors are new `Error`s with one of eight fixed messages and no cause.
   - It returns a new frozen object holding only that one field.
4. `scripts/backend/preview-account.mjs`: one import added; lines 11–12 become `const user = await readCreatedAccount(response);` and line 14 becomes `const session = await readLoginSession(login);`. The create refusal moved into the helper with the same message. Every other line is unchanged: the loopback guard, URLs, headers, request bodies and call order, the onboarding call, the tmpdir credential file (path, content, mode `0o600`) and the success message.
5. `docs/evidence/MB-1/harness-preview-response-2026-11-01.md`: records that the tests were not run, the proposed commands, scope, open cleanup gaps and remaining owners. It claims no whole-G5 or goal acceptance.

**Behaviour changes (all fail closed)**
- A failed sign-in now stops before its body is parsed and before onboarding.
- A create or sign-in success missing its required field now stops before anything later runs.
- `ok` must be exactly `true`; a real fetch response's `ok` is always a boolean.

**Proposed future commands** (each needs separate authorization):
```
rtk proxy node --test scripts/backend/preview-response.test.mjs
rtk proxy node --test scripts/backend/status-consumers.test.mjs
```
I expect 9/9 and 4/4 to pass, based on reading only.

**Self-review**
- **Critical / High:** none.
- **Medium:**
  - No independent review has happened yet.
  - The tests have not run. I checked the pinned lines, the order check and the import check by hand only.
- **Low:**
  - A whitespace-only value counts as non-empty, as specified, and an inherited field would be accepted (real JSON never has one).
  - A refused response's body is left unread, which is intended.
  - A refusal still prints a stack of local file paths, the same as the existing status wrapper.
  - The helper's purity is confirmed by reading only, because its test may not read files.
  - One existing comment in `status-consumers.test.mjs` ("The only two edits allowed") now describes only the status change; the new comment next to it explains the later edit.
  - The existing note about the literal `${…}` lint rule still applies.

The status helpers, their tests and `environment.mjs` are untouched. I computed no hashes and did not read the `/tmp` snapshot. Still open: there is no cleanup of the synthetic account if a step after creation fails, and no timeout on fetch or `json()`.
