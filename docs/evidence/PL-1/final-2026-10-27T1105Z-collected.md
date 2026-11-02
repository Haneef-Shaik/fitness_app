Review 1005's M1 and L1 are fixed test-first. The tests failed first and pass now. L2 (the U+2028) is untouched. PL-1 is not Done: 0 of 3 boxes are met, because all three need owner-authorised hosted actions.

**M1 fix, in `scripts/ci/workflow-text.mjs` only**
- **The rule:** the guard accepts a quoted or bracketed value only if it closes on its own line, with at most a comment after it. Bracketed values may not nest. Anything else, including values starting with an anchor (`&`), alias (`*`) or tag (`!`), is refused.
- **Where it applies:** both where a key's value is read and on every non-comment line of every workflow.
- **Why every line:** a fix inside `entry` alone, as the review proposed, would leave one route open. An unclosed quote in `mobile-ci.yml`'s `concurrency` block, which the guard otherwise never reads, can hide the top-level `permissions` block from YAML.
- **No other file:** `workflow-guard.mjs` and all three workflows were not edited.

**Tests**
- **L1:** the missing space in `ci-guard.test.mjs` is added, by a normal Edit.
- **New tests:** two, in `ci-guard.test.mjs`.
  - Test 28 has 9 hiding cases: the review's 5 (mobile double quote, single quote, closed by a later `name: x"`, fork setup-node, backend `pnpm backend:test`), plus an unclosed bracket, an anchor, a tag, and the `concurrency` case.
  - Test 29 checks 7 values read correctly, 15 malformed ones refused, and 5 valid quoted values with comments still accepted.
- **Existing tests:** none of the 37 had an assertion changed.

**Executed**
- `node --version`: v22.23.1.
- **Focused RED:** 2 tests, 0 pass, 2 fail. All 9 hiding cases got "no problem found".
- **Full `scripts/ci` run, once:** 39 of 39 pass. I piped it through `tail`, so only the summary lines were shown.
- **`git status` and `rev-parse`:** no tracked file changed; HEAD = main = `c8a5d57`.

**Inspected (read only):** the test effects before running (no database, Docker, Supabase or network), all three workflows, and every existing test case. Nothing current is newly refused.

**Inherited:** the 0905 phase's hashes and earlier evidence.

**UNRUN:** hashes, Prettier, a YAML parse, mutation runs outside the tests, `pnpm` gates and anything hosted.

**Denied, each stopped with no other tool tried:** `ls` on the evidence folder (I then read the review file by its known name) and `date -u`, so this phase's time is unrecorded.

**New Low, found in self-review after the run:** the line check also reads `run: |` script lines. In `mobile-ci.yml` steps after `pnpm check`, a script line starting with `[[`, `!` or a quote would be wrongly refused. That fails safe, and no such line exists today. I recorded it rather than fixing it, because the tests could only run once. It is routed to QA-9.

**Records:** I wrote the new `review-1005-corrections.md`, added corrected-later notes to `review-0905-corrections.md`, and updated the handoff and checkpoint, including decision 15. The raw review files are unchanged. Nothing is staged or committed.

```
GOAL: PL-1
BRANCH: codex/fitlog-pl1-ci
HEAD: c8a5d57c3a0999760ad21fd1aca4899ca76b5adf (25 PL-1 paths untracked; nothing staged or committed)
HANDOFF: docs/plan/runs/PL-1/handoff.md
BOXES: 0/3 Done-when boxes met
STATUS: ready-for-verification
NOTES: Fresh focused review next, not goal-verifier. 1005 M1 fixed test-first in workflow-text.mjs (RED 2/2 failing, 9/9 hiding mutants unseen; GREEN 39/39 once, Node v22.23.1); L1 fixed; L2 U+2028 untouched; new Low: block-scalar false positives; hashes/Prettier/YAML UNRUN; ls and date -u denied, not retried.
```