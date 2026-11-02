**COMPLETE (UNRUN).** The projection helper is in place and `verify-freeze-projection.mjs` now reads its output through it. The tests were written first and none of them have been run. I ran nothing else either: no tests, consumer, Docker or database. I used only Read, Grep, Edit and Write, and hit no permission denials.

**Exact paths written (four, nothing else):**
1. `scripts/backend/projection-output.test.mjs` (new): 11 `node:test` tests.
2. `scripts/backend/projection-output.mjs` (new): exports only `readProjectionResult(run)`. It imports nothing and has no default runner.
3. `scripts/backend/verify-freeze-projection.mjs` (edited, two changes only):
   - added line 4, the import of the helper;
   - line 13: `JSON.parse(execFileSync(` became `readProjectionResult(() => execFileSync(`.
   
   Everything else in the file is unchanged: the docker executable, all arguments, the SQL construction, the options, the fixtures, the assertions and their order. There is no new targeting logic or database step.
4. `docs/evidence/MB-1/harness-projection-output-2026-11-02.md` (new).

**How the helper behaves:**
- **No callback:** if `run` isn't a function it raises a fixed error and calls nothing.
- **Failed command:** it calls `run()` exactly once with no arguments. Anything thrown is caught without being bound or read, and a new fixed error with no cause replaces it.
- **Output that isn't a string:** refused with the fixed parse error, without converting or awaiting it.
- **Parse failure:** caught without being read and replaced by the same fixed parse error.
- **Wrong shape:** `null`, arrays and other non-objects get a fixed shape error.

I checked the migration: `private.freeze_projection` only ever returns an object, so the shape check can't reject anything the suite asserts on. The four existing `assert.throws` checks still pass when a fixed error is raised.

**Proposed check (needs your separate authorization):** `rtk proxy node --test scripts/backend/projection-output.test.mjs`. It should report 11 tests if it passes.

**Still open:** this doesn't accept G5 as a whole or MB-1. Runtime, backend, target binding and the hardcoded container name are still open under MB-1/QA-9. I couldn't compute hashes without a shell, so the coordinator needs to hash the four files and diff the consumer byte for byte.

**Self-review:**
- **C:** none.
- **H:** none.
- **M1:** nothing has been run. The test checks the helper's source text against exact lines and tokens. I checked those by eye, but the first run could still show that one of my own checks is too strict.
- **L1 (existed before):** the consumer's four failure-case checks pass on any error. They can't tell an intended database rejection from a docker or psql failure, and the fixed messages now hide which one it was.
- **L2 (by design):** a failed query no longer shows its exit code or psql's error text.
- **L3 (by design):** byte-array output is refused. The consumer always gets a string because it passes `encoding: 'utf8'`.
- **L4:** the source checks are text matching, and the poisoned-value tests only cover reads made from JavaScript. The consumer is checked by lines and counts, not a full diff.
- **L5 (fixed):** my first edit to the consumer dropped the space in `'docker', ['exec'`. I corrected it and confirmed line 13 by reading the file.
- **L6:** the new test file matches the `backend:test` glob in `package.json`, so that suite will pick it up. It's pure, so that's expected.