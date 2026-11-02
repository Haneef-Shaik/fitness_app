**Verdict: PASS, within limits.** The verdict covers only the MB-1/QA-9 G5 projection diagnostic-safety prerequisite: the helper, its test, and the consumer's import and parse wiring. It does not cover the consumer's runtime assertions, the rest of G5, goal acceptance or merge.

## What was run
- **The one Bash command, run once:** `rtk proxy node --test scripts/backend/projection-output.test.mjs`. Result: **11 tests, 11 passed**, none failed, cancelled, skipped or todo, in about 84 ms.
- **Before running it** I read the helper and test in full and confirmed both are pure:
  - The helper imports nothing and calls `run` once, with no arguments.
  - Its two `catch {}` blocks discard the caught value without binding it.
  - The test's callbacks are all fakes. It checks the helper's source as text before importing it, and reads the consumer only as text, never importing it.
  - A Grep found no Node config file that could add hooks.
- Everything else was Read or Grep. There were no permission denials, edits or other commands.

## Consumer change (compared with the phase-before snapshot)
I compared the files line by line by eye; no diff or hash tool was authorized. Exactly two changes:
- `verify-freeze-projection.mjs:4` adds the helper import.
- `:13` changes from `JSON.parse(` to `readProjectionResult(() => `.

Everything else is identical:
- the docker arguments, container, psql flags, SQL construction and options;
- all fixtures, the 9 `project(` calls, the 13 `assert.equal`, the 4 `assert.throws` and the `console.log`;
- the closing brackets balance, and the trailing newline is kept.

I read the `/tmp` hash file but could not recompute any hashes, so **whether the files match those hashes is not verified**.

## Behaviour review
- **Command failure** (`projection-output.mjs:18-24`): the caught value is discarded unread, and a new `Error(FAILED)` is raised with no cause and no extra fields. Only `===` touches the result.
- **Parse failure** (`:27-34`): this also becomes the fixed `NOT_JSON`. Output that isn't a string is refused using only `typeof`, without being converted or awaited.
- **Wrong shape** (`:43`): `null`, arrays and bare values raise `NOT_OBJECT`. In the migrations, `private.freeze_projection` is defined once. Its only `return` is `jsonb_build_object(...)` (`20261019140429_gym_freezes.sql:147`), and every other path raises an error. So this check cannot reject a legitimate result. I did not check the function as it exists in the live DB.
- **No retry:** the callback is called exactly once. Because the consumer sets `stdio` explicitly, child stderr is still not echoed; that is unchanged.

**Test quality:** the poisoned-getter, proxy, sentinel and no-retry tests are meaningful. Each catches a likely leak in two ways: the source-text check and a behaviour test. For example, reading the caught error's message, adding a `cause`, rethrowing the original, converting the output or retrying would each fail a test. I reasoned this through but did not run mutation tests.

## Findings
**Critical: none. High: none. Medium: none.**

| # | Low finding | Owner |
|---|---|---|
| L1 | Still open, pre-existing: the container `supabase_db_fitlog_rebuild_20261017` is hardcoded (`:13`). The test pins it (`projection-output.test.mjs:259, :272`), so the fix that binds the target must update those pins in the same change. | MB-1/QA-9 target binding |
| L2 | Still open, pre-existing: the four `assert.throws` negatives (`:22, :23, :25, :27`) accept any error. Every failure now shows the same `FAILED` text, so a rejection for the wrong reason can't be told apart from the intended one. The positive call at `:15` runs first, but it only catches a stack that is down. | MB-1/QA-9 |
| L3 | By design: errors no longer show the exit code or the psql `ERROR` text. `FAILED` says "query failed" even when docker can't start (ENOENT). | Accepted design; noted for the coordinator |
| L4 | Outside this prerequisite: if a positive assertion fails, the `AssertionError` still prints the actual and expected projection values. These are synthetic dates and counts. | Whole-G5 scope (MB-1/QA-9) |
| L5 | The test pins exact consumer lines and counts, not fixture or expected values. My by-eye comparison covered those values this time. | Coordinator |
| L6 | The evidence doc still says `Status: UNRUN`, and the hashes are unverified. | Coordinator records this run and checks the hashes |

**Not claimed:** that the consumer ran or that its runtime assertions passed; anything about the live DB; red-first or mutation results; whole-G5 or goal acceptance; merge. The hardcoded target and the false-positive `assert.throws` weakness remain **open** under MB-1/QA-9.