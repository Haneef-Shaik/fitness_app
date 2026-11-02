# MB-1 / QA-9 G5 preview-auth response safety: PASS (bounded)

The change is correct and safe on both pure tests and on reading the code. I found no Critical, High or Medium issues. This covers only this one G5 prerequisite. It does not accept any goal or the whole of G5, and makes no RED, mutation, device or release claim.

## Test results (each authorized command run once)

| Command | Tests | Pass | Fail | Cancelled | Skipped | Todo | Duration |
|---|---|---|---|---|---|---|---|
| `rtk proxy node --test scripts/backend/preview-response.test.mjs` | 9 | 9 | 0 | 0 | 0 | 0 | 49.2 ms |
| `rtk proxy node --test scripts/backend/status-consumers.test.mjs` | 4 | 4 | 0 | 0 | 0 | 0 | 37.5 ms |

I checked safety by reading both tests and the helper before running anything:
- **Helper:** `preview-response.mjs` imports nothing.
- **Helper test:** `preview-response.test.mjs` imports only `node:assert/strict`, `node:test`, `node:util` and the helper. Every response, body and thrown value is synthetic and built in the file.
- **Consumer test:** `status-consumers.test.mjs` imports only assert, fs and test, and reads the two consumers as text. It never loads or runs them.
- **Neither test** starts a process, uses the network or reads a real credential.

These are tests on fake responses and on source text. They are not proof that real sign-in works: no real Supabase auth response or real fetch `json()` failure was observed.

Tools used: Read 12, Grep 6, Bash 2 (only the two commands above). There were no denials or errors. The Python launcher at the end of the brief was treated as context and not run.

## What I checked

- **Refused before reading the body:** `readRequired` (`preview-response.mjs:68`) refuses unless `ok` is exactly `true`, before any body read.
  - A `throw` while reading `ok` is caught (`:30-35`).
  - Tests 2 and 3 cover 10 bad `ok` values, a missing `ok` (the old sign-in gap) and 6 non-responses, with zero `json()` calls.
  - A watching proxy records only one read of `ok`.
- **Bad JSON is dropped unread:** the body read (`:39-45`) catches any error without binding or reading it.
  - Test 4 covers a real V8 parse error over a token-bearing body, an error carrying tokens in its cause and stack, an `AggregateError`, strings, a symbol, `undefined` and `null`, each both rejected and thrown. `json()` is called exactly once.
  - Test 6 shows that getters and proxies on the thrown value record zero access.
- **Fixed messages only:** every refusal is a new plain `Error` with one of 8 fixed messages, no cause and no other field.
  - Each helper takes one parameter, so no caller text can reach a message.
  - The test's 8 messages are written out on their own, not imported from the helper, so they really pin it. I checked that all 8 match `:14-27` exactly.
  - No synthetic value, parse detail, `Bearer` or `name:` field shows up in the message, `String()`, stack, `inspect`, JSON or `structuredClone`.
- **Bad shapes and missing fields:** shape check at `:48-54`, field check at `:57-64`. Tests 7 and 8 cover 11 non-object bodies and 12 missing-field cases, including the other operation's body, a field only present nested, a `String` object and a getter that throws. Each helper returns a new frozen object with only its one field, so `refresh_token` is not kept.
- **Changes to `preview-account.mjs` since the before-snapshot:** I compared the file with `/tmp/...-before.json` line by line. Exactly three things changed:
  - +line 3: the helper import.
  - Old lines 11-12 became line 12: `readCreatedAccount(response)`. The create refusal moved into the helper with its message unchanged.
  - Line 14: `readLoginSession(login)`.

  Everything else is unchanged: all three fetch calls (URL, method, headers, `SECRET_KEY` only for the admin create call, request bodies, order), the loopback guard at `:9`, the onboarding `Bearer ${session.access_token}` and `profile.ok` check, and the credential write at `:17` (same tmpdir path, `{ email, password, id }` content and mode `0o600`). This matches the coordinator's claim.
- **The pin is accurate and the guards are not weakened:**
  - The `environment.mjs` fixture and every shared constant in `status-consumers.test.mjs` match the snapshot's earlier copy of the test.
  - The `preview-account.mjs` before-source plus the status substitution reproduces the snapshot file.
  - The whole-file `deepEqual` pin still applies. The old changed-index check was replaced by exact removed and added line lists, which is equivalent.
  - New checks were added: no `.json(` in either consumer, and the order create → read → sign-in → read → onboarding → write.
  - The passing pin proves `environment.mjs` matches its accepted form. The `ENVIRONMENT_GUARD` (`environment.mjs:4`) and `PREVIEW_GUARD` lines are unchanged.
  - I read `status-command.mjs` and `status-output.mjs` and saw no weakening: the command is fixed and failures are caught unread with a fixed message.

## Findings

**Critical:** none. **High:** none. **Medium:** none.

**Low (none of these block this result):**
- **L1** `preview-response.mjs:1-8`: the claim that the helper imports nothing and does no file, network, process or console work rests on reading only. No test scans its source, so a later import would not fail any test. The evidence already notes this as its own L4.
- **L2** `preview-response.mjs:57-60`: I agree with the evidence's own L1. A whitespace-only string is accepted, and so is a field inherited from the prototype. A real `JSON.parse` result can't produce an inherited field, so the impact is none.
- **L3** `preview-account.mjs:11,13,15`: if `fetch()` itself rejects (for example, connection refused), that error is outside the helper and unguarded. By platform behaviour it carries connection details, not the response body or request headers, but that is not proven here. It belongs with the existing G4/F3 timeout and cleanup residuals, as do the orphaned account after a later failure and the `json()` call having no timeout.
- **L4** `preview-account.mjs:17`: this predates the change and is correctly kept byte for byte. Mode `0o600` only applies when the file is created, and `writeFileSync` follows an existing file or symlink at that tmpdir path. macOS's per-user `TMPDIR` lowers the risk. MB-1 owns this.
- **L5** `harness-preview-response-2026-11-01.md:1,88,152-159,180-182`: the record still says the tests are "UNRUN". This run (9/9 and 4/4) supersedes that for these two commands only. RED was never observed. I did not recompute the SHA256 hashes of the unchanged files because hash commands were outside my scope. `environment.mjs` is proven unchanged by the passing pin; `status-command.mjs` and `status-output.mjs` need the coordinator's hash check.

The rest of MB-1 and QA-9 stays with its owners, and historical denied sequences stay parked. No edits, commits, status/GOALS/ledger changes, database work, network use, live CLI or consumer runs, or sub-agents were used.
