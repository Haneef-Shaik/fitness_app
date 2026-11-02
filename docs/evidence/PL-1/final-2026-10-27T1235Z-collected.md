I fixed PL1-D1, PL1-D2 and the 1205 review's L-1 and L-2, tests first. All 42 `scripts/ci` tests pass on Node v22.23.1. PL-1 is still not Done: none of the 3 boxes is met, and all three need owner-authorised actions on GitHub.

**What changed** (code in `scripts/ci/workflow-text.mjs` and `scripts/ci/ci-guard.test.mjs` only):
- **D1:** inside a `run: |` or `run: >` block, the guard no longer refuses script lines that start with `[`, `{`, `!` or a quote. A QA-9 step after `pnpm check` holding `[ -s f ] || exit 1` or `"$X" --flag` now passes.
  - A block ends at the first non-blank line, comment lines included, indented no deeper than its key. After `- run: |` that key is at column 8, not 6.
  - A script line like `label: |` does not start a new block.
  - The character checks and the expression-on-a-comment-line check still run on every line.
- **D2:** a valid key with a value the guard can't read now says "a plain key with a value this guard does not read". Only a line with no plain key says "which is not a plain key". Test 28's two exact messages were updated to match.
- **L-1:** test 30 counts comment and expression lines across all three workflows together. Test 28's concurrency cases no longer use the concurrency block in QA-9's `mobile-ci.yml`; they use fixed text instead.
- **L-2:** test 28 has a `? ` indicator case.
- **New tests:** test 34 (D1) and test 35 (D2), added at the end so tests 22 to 33 keep their numbers.
  - Test 34 accepts realistic run blocks after `pnpm check`.
  - It also checks that the guard still refuses: lines just outside a block, a block ended by a comment line, and bad characters inside a block.

**Test runs:**
- **RED, before the code change:** 5 tests, 2 pass, 3 fail. Run alone, test 34 failed only on its two accepted fixtures.
- **GREEN:** 5 of 5 focused, then 42 of 42 in the single full run.
- **After the full run:** I made two layout-only edits to the tests (the same string value, the same logic). I re-ran only the two affected tests (2 of 2), not the full suite.

**Not run:** Prettier, a YAML parse, hashes and any mutant. The mutant cases each test pins, and D1's safety argument from the YAML grammar, were worked out by reading only. I used no sub-agents, as the brief required, so the three agent reviews were replaced by a self-review. Nothing was denied, and I tried no listing or Glob.

I did not run the Python launcher at the end of your message, because it starts background agents and this phase could not do that.

**Still open:**
- L5 (the U+2028 character) waits for a writer you name.
- There is a new optional item, PL1-D3. Tests 24, 27, 28 and 29 still depend on three lines of QA-9's `mobile-ci.yml` that the guard doesn't pin. If QA-9 edits one, the test fails with a clear message rather than silently.

Nothing is committed or staged, and no workflow or QA-9 file changed (`git status`).

Details are in `docs/evidence/PL-1/review-1205-corrections.md`. The checkpoint and handoff are updated; the handoff now records 18 decisions.

```
GOAL: PL-1
BRANCH: codex/fitlog-pl1-ci
HEAD: c8a5d57c3a0999760ad21fd1aca4899ca76b5adf
HANDOFF: docs/plan/runs/PL-1/handoff.md
BOXES: 0/3 Done-when boxes met
STATUS: blocked
NOTES: D1/D2/L-1/L-2 phase done test-first, uncommitted (RED 5/2/3, GREEN 5/5, full 42/42 on Node 22.23.1); Prettier/YAML parse/hashes/mutants UNRUN; next a fresh independent review, then owner-authorised hosted proofs for all 3 boxes
```
