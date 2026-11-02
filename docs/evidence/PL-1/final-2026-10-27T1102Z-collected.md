# Review of PL-1's 1005 corrections (read-only; nothing edited)

The 1005 corrections hold, and the test count is confirmed: **39 of 39 pass**. I ran them once on Node v22.23.1, with the full output shown rather than piped through `tail`.

I found one new Medium, but this phase didn't cause it: a `#` line inside a `run: |` block is invisible to the guard, yet GitHub still pastes any `${{ }}` on that line into the script. That breaks the guard's "steps up to `pnpm check` held exactly" rule. I recommend fixing it in one small test-first phase before any commit. There are also five Lows, and none of them blocks a commit.

PL-1 is not Done: 0 of 3 boxes are met.

## Findings, most severe first

### M1 · Medium (existed before this phase): an expression on a comment line inside a `run: |` block gets past the guard
- **Location:** `workflow-text.mjs:166`: `stepItems` drops every `#` line, including lines inside a block. The checks that should see it never do:
  - the `${{` rule at `workflow-guard.mjs:403-404`;
  - the exact step-2 comparison at `workflow-guard.mjs:413-417`;
  - the line scan at `workflow-text.mjs:85`.
- **Defect:** inside a YAML block, a `#` line is part of the script. GitHub fills in any `${{ }}` on it before bash runs, and the guard never reads that line.
- **Failure scenario** (found by reading; I ran no mutant):
  - In `mobile-ci.yml`, after line 32 (`        run: |`), add the line `          # ${{ github.event.pull_request.body }}`.
  - The guard reports no problem, so `backend` and `ci-guard` both pass. Step 2 still matches `BASELINE_SCRIPT` exactly.
  - Set the PR body to `x`, a newline, then `npm pkg set scripts.check=true`. Bash runs the injected line before `pnpm check`, so `check` goes green without checking anything.
  - The edit can also carry the payload itself, with no PR body needed: `# ${{ format('{0}npm pkg set scripts.check=true', fromJSON('"\n"')) }}`.
  - Unlike 1005's M1, this doesn't depend on how leniently GitHub parses YAML.
- **Why Medium and not High:** editing `package.json` (F2, an accepted risk) already gets the same result outside the guard's scope, and this line is visible in the diff.
- **Minimal fix, test first:**
  - Test: add to the `cases` in test 24 (`ci-guard.test.mjs:229`). It fails today:
    ```js
    [
      'an expression on a comment line of the baseline run block',
      '        run: |\n',
      '        run: |\n          # ${{ github.event.pull_request.body }}\n',
      /mobile-ci\.yml:33 has an expression on a comment line/,
    ],
    ```
  - Code: add this inside the `forEach` of `characterProblems`, after the value check:
    ```js
    if (!meaningful(line) && line.includes('${{')) {
      problems.push(
        `${where} has an expression on a comment line; inside a run block it is script, where GitHub pastes it before the script runs, and this guard skips comment lines`,
      );
    }
    ```
  - It's compatible with today's files: no comment line in the three workflows contains `${{` (checked by reading).

### L1 · Low: the line-start part of the line scan has no test
- **Location:** `workflow-text.mjs:50-51`: the indicator strip and the `/^["'[{&*!]/` branch. The tests concerned are at `ci-guard.test.mjs:576-626`.
- **Defect:** all 9 test-28 mutants reach the scan through `key: value`. Deleting line 51, or the strip on line 50, would still leave 39 of 39 passing (traced by reading).
- **Failure scenario:**
  - After such a deletion, the guard would accept `concurrency:\n  "mobile-${{ github.ref }}\npermissions:\n  contents: read\n  #"`.
  - Today that file is refused. Without line 51 nothing else catches it, because `concurrency` is empty and `permissions` reads exactly as reviewed.
  - A lenient parser would then turn `concurrency` into a string, which GitHub allows, and drop `permissions` altogether.
- **Fix:** add this case to test 28. It passes on the current reader and pins line 51:
  ```js
  ['the top-level permissions inside an open concurrency string on its own line', {
    path: MOBILE,
    pairs: [[MOBILE_TOP, 'concurrency:\n  "mobile-${{ github.ref }}\npermissions:\n  contents: read\n  #"\n']],
    opening: '  "mobile-${{ github.ref }}',
    value: '"mobile-${{ github.ref }}',
  }],
  ```

### L2 · Low, PL-1's own (self-reported; confirmed): false positives on lines inside a block
- **Location:** `workflow-text.mjs:85` together with `:44-54`.
- **Defect:** the line scan reads lines inside a block as YAML values.
- **Failure scenario:** a QA-9 step after `pnpm check` containing `[ -s coverage/summary.json ] || exit 1`, `"$X" --flag`, `echo "a: 'b'"` or `! grep -q …` is refused, which turns both guard jobs red. This fails closed, nothing current is affected, and QA-9's planned ratchet step passes.
- **Owner:** this is PL-1's code and not shown to be QA-9's. Records saying "routed to QA-9" should read "PL-1 owns it; QA-9 is advised".
- **Fix (a later test-first phase):**
  - In the value check, skip lines indented deeper than a block's key.
  - Keep the character checks and M1's comment check on those lines.
  - Correct the `lineValue` comment.

### L3 · Low: anchors, aliases and tags inside a one-line flow are accepted
- **Location:** `workflow-text.mjs:27` (`FLOW`) and `:35-36`; decision 15; the handoff's PL-2 row.
- **Defect:** the records say anchors, aliases and tags are refused. In fact `[&p coverage, *p]` and `{a: !!str b}` pass.
- **Failure scenario:** I found no way to exploit it. Every flow the guard tolerates is either compared exactly or would give GitHub something that isn't a string.
- **Fix (minimal):** reword to "refused at the start of a value or line". Or, in code, use `[^[\]{}'"#&*!]` in `FLOW`. That is compatible with every current test and file, traced by reading.

### L4 · Low (self-reported; confirmed): misleading wording
- **Location:** `workflow-text.mjs:138` and `:200`.
- **Defect:** a valid key whose value is refused is reported as "not a plain key".
- **Fix:** when `/^[A-Za-z0-9_-]+:/` matches, say "has a value this guard does not read" instead.

### L5 · Low, deferred and unchanged: the invisible U+2028
- **Location:** `workflow-guard.test.mjs:368`.
- The denied writer, formatter and hash sequences stay **UNRUN**.

## Accepted, with limits
I checked these by reading:
- **Quotes close one way only.** `(?!')` makes `''` parse one way, and every alternative starts with a different character, so there's no exponential backtracking.
- **Escapes and trailing text:**
  - an escaped closing quote is refused;
  - `"a\\"` is read correctly;
  - text after a close, `"a"#b` and `'a' 'b'` are all refused.
- **Plain and block values can't swallow less-indented lines.** Deeper lines are refused everywhere the guard reads them.
- **The value after the first `: `** is the right part for any plain key, and every other kind of key is judged whole.
- **Every line of all three workflows** passes. Tests 22–24, 32 and 33 confirm this on the real files.
- **Fails closed:**
  - `key: #c` is read as the value `#c`, where YAML reads nothing;
  - a value YAML can't parse makes GitHub reject the workflow, so it also fails closed.

## What I ran and what I didn't
- **Executed:**
  - `rtk proxy node --version`: v22.23.1.
  - The three `scripts/ci/*.test.mjs` files, once: 39 pass, 0 fail, 0 skipped.
  - `git status`: no tracked change, and 26 untracked paths (the 25 PL-1 paths plus the collected 1105Z final). HEAD = main = `c8a5d57c3a09…`.
- **Test effects, checked before the run:** Git runs only in temporary scratch repositories with isolated config. Supabase, psql and the CLI are fakes. The imported backend modules do nothing on import.
- **Denied:** `rtk proxy ls` on the evidence folder, and `rtk proxy wc -l`. I stopped each and tried no substitute; I read the files by their known names instead.
- **Inherited, not checked:**
  - the RED record (2 of 2 failing; all 9 mutants missed by the old reader);
  - "no existing assertion changed": I couldn't diff, because the files are untracked;
  - the hashes from the 0905 phase.
- **UNRUN:** hashes, Prettier, a YAML parse, every mutant (including mine), `pnpm` and hosted runs.
- **Privacy:** PL-1 reads and writes no member or health data. Under PRD §16.1 and ADR-003, staff never read or write private health data, whatever the consent. That rule stays until QA-2 is integrated and the launching checkout is corrected.

```
GOAL: PL-1
REVIEW: fresh, read-only, 1105Z: 0 Critical, 0 High, 1 Medium (M1, existed before this phase), 5 Low
TESTS: 39/39 on Node v22.23.1 (run once, by me)
BOXES: 0/3 met; not Done
NEXT: M1 test-first (+L1) in one bounded phase, then a focused review, then commit
```