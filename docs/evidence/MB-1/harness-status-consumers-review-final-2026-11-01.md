# MB-1 / QA-9 G5 status-consumer review: PASS for this phase only

`status-consumers.test.mjs` ran once: **4 tests, 4 pass, 0 fail** (39 ms). There are no Critical, High or Medium findings, and every requested check below passed.

## Test run
- **Command:** `rtk proxy node --test scripts/backend/status-consumers.test.mjs`, the one authorized command, run once.
- **Before running:** I read the test to make sure it only reads source text.
- **Result:** tests 1–4 all passed (`# tests 4`, `# pass 4`, `# fail 0`, `# cancelled 0`, `# skipped 0`, `# todo 0`).
- **Other activity:** no other command ran and nothing was denied. I made 11 Reads, 5 Greps and 1 Bash call. I made no edits, commits, database or network calls and started no subagents.

## Is the test source-only?
Yes, confirmed by reading it myself rather than relying on its self-check:
- Its only imports are `node:assert/strict`, `node:fs` and `node:test` (`status-consumers.test.mjs:1-3`).
- It reads the two consumers as text through `readFileSync(new URL(...))` (`:14`) and never imports them.
- There is no `import(`, `require(` or `process`, no child process and no call to `fetch`.
- The text `fetch(` appears only inside quoted string data (`:55`, `:66`, `:69`, `:71`). The self-check at `:129-134` can't tell those apart from real calls; reading the file can, and none of them is a call.

## Is the before-fixture accurate?
Yes. I compared it line by line with `/tmp/fitlog-mb1-status-consumers-before.json`:
- **environment.mjs:** all 6 lines plus the final line break match, including the `’` (U+2019) apostrophe, the literal `\\n` inside the template text and the `${…}` in plain strings.
- **preview-account.mjs:** all 18 lines match, including the blank line 6 and the final line break.

## Is the change limited to the two-line swap?
Yes:
- **environment.mjs:** only lines 1 and 3 changed. Line 1 is now the `readLocalStatus` import and line 3 is `const status = readLocalStatus();`.
- **preview-account.mjs:** only lines 2 and 7 changed, in the same way.
- **Unchanged:** the loopback guard (`environment.mjs:4`, `preview-account.mjs:8`) and the `sb_publishable_` check (`environment.mjs:4`). Also every write path, every `0o600` mode, every log message, `randomUUID`, all fetches and headers, and the tmpdir credential file.
- **Same command:** the wrapper runs exactly the command, arguments and options the old inline code ran (`status-command.mjs:18`).
- **Failure messages:** a failed status command now gives a fixed message (`:27`). Bad output gives the helper's fixed messages (`status-output.mjs:25-26`).
- **No other inline status reads:** I searched `scripts/backend` and found no other unguarded inline `supabase status` parse.

## Findings
- **Critical:** none.
- **High:** none.
- **Medium:** none.
- **L1 (outdated comment):** the header comments at `status-command.mjs:4` and `status-output.mjs:4` still name only `verify.mjs`, `verify-gym.mjs` and `verify-freezes.mjs`. The wrapper now has five callers. This doesn't affect behaviour, and the phase rules didn't allow changing those files.
- **L2 (residual, assign to MB-1/QA-9 G5):** in `preview-account.mjs`, `response.json()` (`:12`) and `login.json()` (`:14`) could throw a SyntaxError that quotes part of a local auth response. Line 14 also doesn't check `login.ok`. A failed login therefore sends `Bearer undefined`, which then fails safely with a fixed message at `:16`. This is outside this phase.
- **L3 (residual, assign to MB-1/QA-9 G5):** in `verify-freeze-projection.mjs:12`, a failed command throws an error that carries psql's stdout and stderr, and a bad parse can quote psql output. The inputs are synthetic freeze data and the script never reads status keys, so the risk is unwanted diagnostics rather than a token leak. Triage only.
- **L4 (stricter on purpose):** status that is valid JSON but not an object is now refused with the helper's fixed message (`status-output.mjs:26`). Before, `null` caused a TypeError that contained no key.
- **L5 (test limits):** the checks are pattern-based. For example, the import pattern at `status-consumers.test.mjs:18` expects single quotes and a trailing `;`. Any mistake makes the test fail, not pass, because test 1 compares the whole file exactly.
- **L6 (outdated wording):** `harness-status-consumers-2026-11-01.md` still says the tests are UNRUN (lines 1, 42 and 62). The coordinator's record should note this run without rewriting that file.

## Limits of this review
- I did not compute SHA256 hashes, because no hash command was authorized. I'm relying on the coordinator's exact comparison for those.
- I didn't need to read the QA-9 `checkpoint.md` file.
- I checked the citations. `docs/PRD.md:1487-1488` does say "never log OTP, token". MB-1's Done-when list is at `GOALS.md:562-566`.
- This verdict doesn't accept G5 as a whole, check off any MB-1 Done-when item, record a ledger result, or say anything about running against the real stack or a device. G1–G4, G6, G7, F1–F3, F5, F6 and the rest of MB-1 are still open, and the historical denied sequences stay parked.

**Verdict: PASS, limited to this phase.** The change is exactly the two-line swap in each consumer, everything else in both files is unchanged byte for byte, and the new test passed 4 of 4.
