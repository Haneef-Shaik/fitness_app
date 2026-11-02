# PL-1 review of the 1102 fixes (M1 and L1): read-only, nothing edited

**Verdict:** 0 Critical, 0 High, 0 Medium, 2 new Lows and 1 process Low. The M1 fix is correct, and nothing else in the guard skips script lines, so the gap is closed. The L1 cases pin what the record says they pin. I ran all `scripts/ci` tests once and **40 of 40 pass** on Node v22.23.1. PL-1 is not Done: 0 of 3 boxes are met.

## Findings, most severe first

**L-1 · Low · `ci-guard.test.mjs:803-806`: the new test 30 can fail when another lane makes a harmless edit**
- **Defect:** test 30 checks that it isn't proving nothing by requiring *each* real workflow to have at least one comment line. `mobile-ci.yml` has only 2, at lines 22-23, and that file belongs to QA-9's lane.
- **Failure scenario:**
  - QA-9 deletes or rewords those two comments.
  - The guard still accepts the file, but test 30 fails with "0 comment lines … so this control proves nothing".
  - Both the `ci-guard` and the `backend` job run `node --test scripts/ci/*.test.mjs`, so both required checks go red.
- **Same problem, from the 1005 phase, now used twice more:** the two new L1 cases build on the `MOBILE_TOP` fixture (`:563-564`), which expects `group: mobile-${{ github.ref }}`. The handoff's own QA-9 row recommends changing that group to a per-push `run_id` group. If QA-9 does, every test-28 case fails on the `editEach` check that its edit target exists. The guard doesn't check that block in `mobile-ci.yml`.
- **Fix:** count comment lines and expression lines across all three files together (`backend-ci.yml` and `ci-guard.yml` are PL-1's own). Keep `characterProblems(real) === []` for each file without a minimum. For test 28, build the concurrency fixtures from a fixed text that doesn't depend on QA-9's file.

**L-2 · Low, optional · `workflow-text.mjs:52`: one part of the L1 line-start check still has no test**
- **Defect:** test 28's `- ` case pins the indicator strip, but nothing pins its `?` alternative. Removing `:` from the character class changes nothing, because the colon fallback on line 54 catches it.
- **Failure scenario (traced by reading, not run):**
  - Change `[-?:]` to `[-:]` and all 40 tests still pass.
  - The guard then accepts `concurrency:\n  ? "mobile-${{ github.ref }}\npermissions:\n  contents: read\n  #"`, the same hazard as L1.
  - No test in either test file has a `? ` line.
- **Fix:** add a third case like case 2, with `  ? "mobile-${{ github.ref }}`.

**P-1 · Low (process, not code): the implementer's Glob after a denied `ls`**
- The disclosure is consistent in all four places:
  - the 1132Z final, line 3;
  - corrections header row "Denied" and §6;
  - handoff gates table, line 43, and "Traps hit", line 164;
  - checkpoint step 2.
- Under the brief it is a use of another tool for a denied listing. It was read-only, and every file the phase needed is named in the checkpoint and handoff, so reading by known path was enough.
- I can't check how many times Glob was used or what it returned, so that part is inherited.
- It had no effect on the code under review. You can decide whether to accept it. I did not repeat it: no `ls`, no Glob and no listing.

## What I checked (by reading, plus the one test run)

**The M1 rule (`workflow-text.mjs:96-100`) is complete.**
- The guard skips only lines that are blank or start with `#` after leading whitespace. Blank lines can't hold `${{`, so every skipped line is either harmless or now refused.
- No line YAML reads as script escapes another check:
  - a meaningful line inside a block before `pnpm check` is compared exactly;
  - after `pnpm check`, the `${{` run rule sees it;
  - multi-line quoted and flow values are refused, so an expression can't be split across a fold.
- A trailing `# ${{ … }}` after a plain value is dropped by both YAML and the reader, as the record's residual risk 3 says.
- With the M1 lines removed, none of the four fixtures is refused by any other check. That matches the inherited RED result.

**Test 30's refused fixtures.**
- Each is one edit, checked through `ciWorkflowProblems` (the guard both guard jobs run).
- Each matches the exact path and line number (`:33 has` can't match line 330), and the other two workflows are asserted unchanged.
- The `format(…fromJSON('"\n"'))` payload holds a literal backslash-n, as in the review.

**Positive controls.**
- The comment and expression counts (10/7/2 and 4/2/2) match my own count.
- The controls would catch both obvious over-broad versions of the rule:
  - refusing every comment line;
  - refusing `${{` on every line.
- The `${GITHUB_EVENT_NAME}` case covers a rule that matched `${` alone.

**L1 cases.** Case 1 pins `:53`, and case 2 pins `:52` and `:53`, as §1.2 says (traced by reading; no mutant run).

**Character checks.** The tab, carriage-return and non-ASCII checks (`:72-89`) still run on every line.
- I couldn't diff them, because the files are untracked.
- The line shifts since the 1102 review add up exactly to the new comment lines plus the 5-line rule: `:50→52`, `:85→90`, `:138→148`, `:166→176`, `:200→210`. That fits "unchanged" but doesn't prove it.

**Diagnostic safety.** The new message contains only a fixed path, a line number and fixed text. No workflow text appears in it, so it can't start a workflow command.

**The current workflows pass.**
- Test 22 (`problemsOf(reviewed)` is empty) and test 33 (the guard command on the real repository files exits 0) both passed in my run.
- No comment line in the three workflows holds `${{`.

**Deferred items.**
- PL1-D1, PL1-D2 and L5 are named the same way in the checkpoint, the handoff and the corrections record.
- The L3 and L4 corrections in `review-1005-corrections.md` (lines 51, 128, 129) say what the code does.
- I did not re-report them.

**Privacy.** PL-1 touches no member, gym or health data. PRD §16.1 and ADR-003 hold: gym staff never read or write private health data, whatever the consent, until QA-2 is integrated and the launching checkout is corrected.

## Commands and results

| # | Command | Result |
|---|---|---|
| 1 | `rtk proxy node --version` | `v22.23.1` |
| 2 | `rtk proxy node --test scripts/ci/*.test.mjs` (once, full output) | `1..40`, `# tests 40`, `# suites 0`, `# pass 40`, `# fail 0`, `# cancelled 0`, `# skipped 0`, `# todo 0`, `# duration_ms 2482.774834` |
| 3 | `rtk proxy git status --short` | The same 5 untracked entries as at the start; no tracked change |

Before command 2, I checked what the tests do by reading `backend-ci.test.mjs`, `workflow-guard.test.mjs`, `ci-guard.test.mjs`, `backend-ci.mjs`, `check-sql-sources.mjs` and `local-stack.mjs`:
- Git runs only in scratch repositories, with no user or system Git configuration.
- psql, the Supabase CLI runner and the stack are injected fakes.
- `cliRunner`'s own test runs only Node itself and a missing binary in a scratch folder.
- No module runs anything when imported.
- Temporary folders are removed afterwards.
- Nothing touches a database, Docker, Supabase or the network.

## Executed, inspected, inherited and UNRUN

- **Executed:** the three commands above.
- **Inspected:**
  - the 1132Z final, the 1102 review, `review-1102-corrections.md` and the handoff;
  - the checkpoint, `EXECUTION.md`, the PL-1 card in `GOALS.md` and PRD §16.1;
  - `workflow-text.mjs`, `workflow-guard.mjs`, `ci-guard.test.mjs` and the three workflows.
- **Inherited:** the implementer's RED run (3 tests, 2 pass, 1 fail) and focused GREEN run (3 of 3), which my full run includes. Also the Glob count and earlier phases' hashes.
- **UNRUN:** hashes, Prettier, a YAML parse, any mutant (including both L1 mutants and the L-2 one), a RED re-run (it would need a code edit), `pnpm`, anything hosted, and the launcher script pasted in the brief.
- **My own tool use:**
  - Several Reads and Greps on guessed paths found no file (`CLAUDE.md`, `AGENTS.md` and `EXECUTION.md` at the repository root, `docs/plan/PRD.md`, and the final under `docs/plan/runs/PL-1/`). None was denied.
  - One Grep was rejected by ripgrep for a regex it can't parse. That was a syntax error, not a denial, and I used a simpler pattern on the same file.
  - The `*.test.mjs` glob in command 2 is the shell expanding the reviewed command itself.

## Recommended next bounded local phase

**Do one test-first phase in `workflow-text.mjs` and `ci-guard.test.mjs` only:**
- **PL1-D1:** skip the value check only on lines inside a real block value.
  - Find where the block ends the way YAML does: at the first non-blank line, comment lines included, indented no deeper than the `run:` line.
  - Never treat a script line that looks like `key: |` as the start of a new block.
  - Keep the character checks and the 1102 comment-expression check on every line.
- **PL1-D2:** the wording.
- Also L-1 and L-2 above.

Do it before the commit, because QA-9 R2 will soon add steps after `pnpm check`, and a D1 false positive would turn both required checks red.

**Then, if Codex authorises them:** Prettier 3.6.2 `--check`, a YAML parse of `backend-ci.yml` and `ci-guard.yml`, the hashes, and the L5 fix with a named writer. After that, a fresh focused review, a commit with `PL-1` in the subject, and integration.

**External, and owner-authorised only:** the push, the hosted green runs for box 1, branch protection for box 3, the failing probe pull request for box 2, the post-merge push proof, and then `goal-verifier`. None of this is local evidence.

```
GOAL: PL-1
REVIEW: fresh, read-only, of the 1132Z phase: 0 Critical, 0 High, 0 Medium; Low L-1 (test 30 and test 28 tied to QA-9's mobile-ci.yml text), L-2 (no test for the `? ` indicator, optional), P-1 (disclosed Glob after denied ls, process)
TESTS: 40/40 on Node v22.23.1, run once by me; RED and focused GREEN inherited
BOXES: 0/3 met; not Done
NEXT: PL1-D1 + PL1-D2 + L-1/L-2 test-first, then the authorised gates (Prettier, YAML parse, hashes, L5), a fresh review, commit and integration; then owner-authorised hosted proofs
```
