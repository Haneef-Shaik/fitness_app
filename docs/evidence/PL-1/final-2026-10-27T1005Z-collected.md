I found no Critical or High issues. There is one new Medium, one new Low, and the deferred U+2028 Low is unchanged. The Medium is that the guard's line reader accepts a quoted value that doesn't close on its own line. A YAML parser instead carries that value onto the following lines, so whole steps can disappear. If GitHub's parser accepts that, one edit to one workflow can silently drop `pnpm check` or `pnpm backend:test` while both guard jobs pass. The review 0905 M1 and L1 fixes hold as written. The 37 `scripts/ci` tests pass (37 of 37, run once on Node v22.23.1). PL-1 is not Done: 0 of 3 boxes are met and 0 of 3 hosted proofs exist. Fix the Medium before any commit or goal-verifier step.

## Findings, most severe first

These are this review's labels; review 0905's M1 and L1 are closed.

### M1 · Medium (High if GitHub's parser accepts it): a quoted value left open hides whole steps from the guard
- **Location:** `scripts/ci/workflow-text.mjs:54-59` (`entry`). It is reachable because step `name` values are never compared: `workflow-guard.mjs:288` and `:413-418`.
- **Defect:** a value that starts with `"` or `'` is kept as complete even when the quote never closes on that line. YAML carries an open quoted value onto the following lines, so the guard and YAML can read different steps.
- **Failure scenario** (found by reading; I ran no mutant):
  - **`mobile-ci.yml`:** add `        name: "Install` after line 50, and `      #"` after line 51.
    - The guard reads step 5 as `{run: pnpm install …}`, since the name is dropped, and step 6 as plain `pnpm check`. The `#"` line is a comment to the guard, so it is skipped. Both guard jobs pass, and so do the guard's own tests.
    - A lenient YAML parser reads `Install - run: pnpm check #` as step 5's name, so `pnpm check` never runs and `check` goes green.
  - **`backend-ci.yml`:** put the same open name on the lint step (`run:` first) and close it after `- run: pnpm backend:test`. Then `pnpm backend:test` never runs. The ci-guard job uses the same reader, so it doesn't catch this.
  - **Effect on the 0905 M1 fix:** an `actions/setup-node@<fork>` step that the guard sees after `pnpm check` (allowed there) can end up before the YAML-visible `pnpm check`. So the claim at `workflow-guard.mjs:65-67` holds only where YAML reads the same lines as the guard.
- **Why only Medium for now:** strict YAML 1.2 rejects continuation lines indented this little. libyaml-family parsers are known to accept them. I couldn't check GitHub's parser: YAML parsing and network were both out of scope. If GitHub rejects such a file, the workflow is invalid and merging stays blocked.
- **Fix, tests first:**
  - In `entry`, accept a quoted value only if it is complete on its line, optionally followed by ` # comment`:
    - double quotes: `^"(?:[^"\\]|\\.)*"`
    - single quotes: `^'(?:[^']|'')*'`
  - Anything else returns `null`, which the guard already reports as "not a plain key".
  - Optionally, also refuse flow `[`/`{` values that don't close on their line.
  - Failing mutants to write first, each refused by `ciWorkflowProblems` with the other two workflows left as reviewed:
    - the mobile and backend cases above;
    - the fork setup-node variant;
    - a single-quoted variant;
    - a variant closed by a later step's `name: x"` line.
  - A strict YAML parse of today's files won't close this, because the problem is in what the guard accepts, not in the current files.

### L1 · Low: a Prettier violation in a file this phase touched
- **Location:** `scripts/ci/ci-guard.test.mjs:68`, `const ON ='on:…` (no space after `=`).
- **Effect:** `prettier --check` would fail on this file. That contradicts "layout matched by hand" in `review-0905-corrections.md` §4.
- **Fix:** add the space, using a writer Codex names. Then run Prettier 3.6.2 `--check` if it is authorised.

### L2 · Low, deferred (unchanged): invisible U+2028 at `workflow-guard.test.mjs:368`
- It is still the only U+2028, U+2029 or U+0085 under `scripts/ci`.
- The test still works. No writer or formatter was retried.

## The M1 and L1 fixes from review 0905
- **Pins come from the parsed steps.**
  - `ACTION` (`workflow-guard.mjs:69-73`) is the only place the pins are defined; `STEPS`, `GUARD_STEPS` and `MOBILE_STEPS` all use it. `pinsOf` is gone, with no match anywhere.
  - `entry` drops ` # …` from plain values (`workflow-text.mjs:58`), and `stepItems` drops comment lines (`:121`).
  - `backend-ci.yml` and `ci-guard.yml` must have an exact step count, and each step must match whole (`:278`, `:298`). So those two have no slot after the last step for a decoy.
  - `mobile-ci.yml`'s steps 1–6 are compared whole (`:433`). Later steps are never compared with a pinned step.
  - So none of the three decoy shapes can keep a changed checkout, setup-node or pnpm pin accepted in any workflow, given the caveat in M1 above.
- **Assertions are not weakened.**
  - The nine decoy mutants (`ci-guard.test.mjs:465-505`) each require the step-specific refusal naming both the fork SHA and the reviewed full pin, from the same function the guard command runs. Each target replaces the right line on its first occurrence.
  - The four runner and timeout mutants (`:507-548`) require the exact message, and the 1-minute boundary must produce no problem at all.
  - The re-targeted tests 23, 28 and 34, and the four F1 regexes, are each as specific as before or more so.
- **Correction evidence is consistent.**
  - The failing tests named in the RED record (23, 26, 27, 28 and 34) match the test numbering I got.
  - RED run 2's name pattern selects exactly 23, 26 and 27. In the raw Markdown the `|` is written `\|` as a table escape; pasted into a shell literally, it would match no test.
  - The quoted RED messages match the old message shape. I did not reproduce them, since the old guard is gone.
  - The corrected-later notes in `review-0705-corrections.md` are present and accurate.

## Proof ledger
- **Executed:**
  - `rtk proxy node --version`: v22.23.1.
  - `rtk proxy node --test` on the three files `scripts/ci/*.test.mjs` matches, **once**: 37 tests, 37 pass, 0 fail.
  - `rtk proxy git status` before and after the run: the same 23 untracked paths and no tracked change. `git rev-parse` shows `HEAD` = `main` = `c8a5d57c3a09…`.
  - `git log --oneline -5`.
- **Test effects, checked before the run:** the tests read the repository's workflows and the AR-1 logs; write temp folders and remove them; run Git in scratch repositories with isolated config; and use fakes for Supabase, Docker and psql. The two imported backend modules have no side effects when imported.
- **Denied:** `rtk proxy shasum -a 256 …`. The hash sequence stopped there, with no retry and no other tool. So the hashes of the workflows and the saved finals are **UNRUN** this cycle, and the "unchanged by hash" claims are inherited, not re-checked.
- **Inspected (read only):**
  - read in full: all six `scripts/ci` files and the three workflows;
  - the checkpoint, the handoff, and the 0905-collected and 0935-collected finals;
  - `review-0905-corrections.md` and the header and F1 row of `review-0705-corrections.md`;
  - the EXECUTION.md handoff and the PL-1 card in GOALS.md.
- **Other:** one Grep failed on a regex syntax error, which was a tool error, not a denial.
- **Not run:** Prettier, any YAML parse, any mutant (including M1's), `pnpm check`, `pnpm install`, `pnpm backend:test`, Docker, Supabase, the database, the network and anything hosted. I did **not** run the pasted launcher. Nothing was edited, staged or committed.
- **Privacy:** PL-1 reads and writes no member or health data and adds no staff access. Under PRD §16.1 and ADR-003, staff never read or write private health data, whatever the consent. That override stays until QA-2 is integrated and the launching checkout is corrected.

## Next local phase
1. One offline correction phase on `codex/fitlog-pl1-ci`: fix M1 tests-first, fix L1, and fix L2 if Codex names a writer.
2. If Codex allows them: re-hash the workflows and finals, run Prettier 3.6.2 `--check` on the six files, and run one strict YAML parse.
3. A fresh focused review of that diff.

I'm not recommending a commit or goal-verifier until M1 and L1 are closed.

```
GOAL: PL-1
BRANCH: codex/fitlog-pl1-ci
HEAD: c8a5d57 (23 PL-1 paths untracked; nothing staged or committed)
REVIEW: fresh independent, read-only (0 Critical, 0 High, 1 Medium, 2 Low incl. deferred U+2028)
TESTS: 37/37 on Node v22.23.1 (run once, by me)
NOT RUN: hashes (denied), Prettier, YAML parse (UNRUN), mutants, hosted
BOXES: 0/3 met; hosted 0/3; not Done
NEXT: offline M1 (quoted-value) fix tests-first + L1, then Prettier/YAML/hashes if authorised, focused review
```
