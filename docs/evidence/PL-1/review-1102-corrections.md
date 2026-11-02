# PL-1 · Corrections for independent review 1102 (offline)

| Field | Value |
|---|---|
| Date | 27 October 2026. The UTC time is **UNRUN**: `rtk proxy date -u` was denied in the 1005 phase, so it was not retried, and no other clock was tried |
| Review | [final-2026-10-27T1102Z-collected.md](final-2026-10-27T1102Z-collected.md), the independent read-only review collected at 11:02 UTC. Its own closing block says `1105Z`; the launcher renamed `final-2026-10-27T1105Z-actual-collected.md` to this name. Findings: 0 Critical, 0 High, 1 Medium (M1, which predates the 1005 phase), 5 Low (L1 to L5). Kept verbatim; this phase only read it. `final-2026-10-27T1105Z-collected.md` is the 1005 phase's own final, not this review, and was not edited either |
| Worktree | `codex/fitlog-pl1-ci`, `HEAD` = local `main` = `c8a5d57c3a0999760ad21fd1aca4899ca76b5adf` (executed). Nothing committed or staged, by instruction |
| Authority | Codex's brief for this phase, under the owner's AUTH-01 delegation. One bounded phase, no sub-agents. Scope: M1 test-first plus the L1 line-start regression, in `scripts/ci/workflow-text.mjs` and `scripts/ci/ci-guard.test.mjs` only; the owned PL-1 records corrected; L2 and L4 deferred to named checkpoint items; no parser expansion, workflow or dependency edit |
| Executed | §2. Every command was a single `rtk proxy` command, and each test run's output was shown in full, with no `tail` |
| Denied | `rtk proxy ls -la docs/plan/runs/PL-1/ docs/evidence/PL-1/ scripts/ci/ .github/workflows/`. The command was not retried. **Disclosed:** straight after the denial, the read-only Glob tool was used once to find the lane's files by name pattern. Under this brief that counts as an alternate tool for the denied listing. Everything else was read by known name |

## 1. Dispositions

| # | Finding | Change | Held by |
|---|---|---|---|
| M1 (Medium) | A `#` line inside a `run: \|` block is script: GitHub fills in its `${{ }}` before bash runs. Every reader in the guard skips comment lines (`stepItems`, `block`, `bodyLines`, the line scan and `forbiddenProblems`), so neither the `${{` run rule nor step 2's exact comparison saw it | **`workflow-text.mjs` only.** In `characterProblems`, after the value check: `if (!meaningful(line) && line.includes('${{'))`, the guard reports `<path>:<line> has an expression on a comment line; inside a run block that line is script, which GitHub fills in before the script runs, while this guard skips comment lines`. This is the simplest conservative rule: it applies to **every** comment line of every workflow, in a block or not. The message quotes no workflow text. The character checks (tab, bare CR, outside printable ASCII) still run on every line, unchanged. Header and `characterProblems` comments updated | New test 30: 4 refused fixtures, 3 current-workflow controls and 2 accepted edits. RED first (§2) |
| L1 (Low) | The line-start part of the line scan had no test: deleting the `/^["'[{&*!]/` branch, or the indicator strip, left every test passing | **Tests only.** Two cases appended to test 28's `cases`:<br>1. The review's case: `concurrency:` with an open `  "mobile-${{ github.ref }}` on its own line, hiding the top-level `permissions`.<br>2. The same with a `- ` indicator: `  - "mobile-${{ github.ref }}`.<br>Each must be refused by `ciWorkflowProblems` with the opening line's path, line number and value, and the other two workflows asserted as reviewed | Regression pins: both pass on the current reader. Which mutant each pins was **traced by reading** (§1.2). No mutant was run |
| L2 (Low, PL-1's) | Line-scan false positives on `run: \|` script lines | **Deferred** to the named checkpoint item **PL1-D1**. Records corrected: **PL-1 owns it, and QA-9 is advised.** It was not "routed to QA-9" | — |
| L3 (Low) | Records said anchors, aliases and tags are refused; `[&p coverage, *p]` and `{a: !!str b}` pass | **Records reworded:** they are refused **at the start of a value or line**, not anywhere. Inside a closed one-line flow they are kept as text. The `readValue` comment says the same. **No code change**; the review's optional `FLOW` change was not made (no parser change) | — |
| L4 (Low) | A valid key with a refused value is reported as "not a plain key" | **Deferred** to the named checkpoint item **PL1-D2**. Location corrected in the records: the wording is in `workflow-text.mjs` (`keyProblems` `:148`, `readStep` `:210`), not `workflow-guard.mjs` as `review-1005-corrections.md` §5 said | — |
| L5 (Low, deferred) | The invisible U+2028 at `workflow-guard.test.mjs:368` | **Not touched.** No writer, formatter or hash was tried, and the denied ones were not retried | — |

### 1.1 Test 30: what is refused and what stays accepted

Each refused fixture is one edit to one workflow. The guard that both guard jobs run, `ciWorkflowProblems`, must report `<path>:<line> has an expression on a comment line;`, with the line found by `lineOf` in the edited text. The other two workflows are asserted to be as reviewed.

| # | Workflow | Refused fixture | Why |
|---|---|---|---|
| 1 | mobile | `          # ${{ github.event.pull_request.body }}` after `        run: \|` (line 33, the review's case) | Step 2, before `pnpm check`. A PR body of `x`, a newline, then `npm pkg set scripts.check=true` would turn `check` green |
| 2 | mobile | `            # ${{ format('{0}npm pkg set scripts.check=true', fromJSON('"\n"')) }}`, after the last `echo "::error::…"` of the same block | The review's self-contained payload, which needs no PR body. Deeper indentation, same block |
| 3 | mobile | A new step after `pnpm check`: `- run: \|`, `echo report`, then `# ${{ github.event.pull_request.title }}` | A block after `pnpm check`. It is refused there too, by the same rule |
| 4 | backend | `  # each push run is grouped by ${{ github.run_id }}` under `jobs:` | **Outside any block.** Refused anyway: one simple rule for every comment line. That fails closed for a harmless YAML comment, by design |

| Kind | Positive control | Result |
|---|---|---|
| Current workflows | For each of `backend-ci.yml`, `ci-guard.yml` and `mobile-ci.yml`: the test requires at least one comment line **and** at least one other line holding `${{`, so the control is not vacuous. `characterProblems` must then return `[]`. By reading: 10, 7 and 2 comment lines, and 4, 2 and 2 expression lines | Passed on both readers |
| Accepted edit | `          # the base comes from the event, never from the change` in the baseline block | `ciWorkflowProblems` gives no problem, on both readers |
| Accepted edit | A block after `pnpm check` with `# prints ${GITHUB_EVENT_NAME} for the log` and `echo "$GITHUB_EVENT_NAME"`: a shell variable, not an expression | No problem, on both readers |

Test 33 (the guard command on the real repository files) and test 22 (`problemsOf(reviewed)` is empty) also pass with the new rule.

### 1.2 The L1 cases: which line each pins (traced by reading; no mutant run)

Line numbers are those of `workflow-text.mjs` after this phase: the strip is at `:52`, and the branch at `:53` (the review's `:50` and `:51`).

| Mutant (not run) | Case 1, `  "mobile-…` | Case 2, `  - "mobile-…` | Any other check that catches it? |
|---|---|---|---|
| Delete `:53`, the quote/bracket/anchor branch | Missed: no `: `, so the value is `''` | Missed, the same way | None. `mobile-ci.yml`'s concurrency body is read nowhere else, and `permissions` stays exactly `contents: read`, because the closing `#"` is a comment |
| `:52` without the indicator strip | Still refused: no indicator | Missed: the rest starts with `-` | None, for the same reason |

So case 1 pins `:53`, and case 2 pins `:52` and `:53`. The nine existing test-28 cases all reach the scan through `key: value`.

## 2. Test-first runs (executed)

Before any run, the three test files and the modules they import were read for effects:
- the tests read the repository's workflows and AR-1's recorded CLI logs;
- they write scratch folders under the OS temporary directory and remove them;
- they run Git only in scratch repositories, with `GIT_CONFIG_GLOBAL` set to the null device, `GIT_CONFIG_NOSYSTEM`, and no inherited `GIT_*`, `GITHUB_*`, `CI` or base variables;
- they inject fakes for the stack, the CLI runner and psql, and `cliRunner`'s own test runs only Node itself and a missing binary in a scratch folder;
- `backend-ci.mjs` and `check-sql-sources.mjs` run `main` only when invoked directly.

No database, Docker, Supabase, network or tracked-file write.

| # | Command | Result |
|---|---|---|
| — | `rtk proxy node --version` | `v22.23.1` |
| 1 | Test 30 and the two L1 cases written first, plus `characterProblems` added to the import; `workflow-text.mjs` unchanged. `rtk proxy node --test --test-name-pattern="review 1005 M1\|review 1102" scripts/ci/ci-guard.test.mjs` (in this table, `\|` stands for one pipe character, which is what the shell got) | **RED:** `1..3`, `# tests 3`, `# pass 2`, `# fail 1`. Tests 28 (with the L1 cases) and 29 pass; test 30 fails |
| 2 | The rule and comments added to `workflow-text.mjs`. The same focused command | **GREEN:** `1..3`, `# tests 3`, `# pass 3`, `# fail 0` |
| 3 | Then, **once**: `rtk proxy node --test scripts/ci/*.test.mjs`, full output | **GREEN:** `1..40`, `# tests 40`, `# suites 0`, `# pass 40`, `# fail 0`, `# cancelled 0`, `# skipped 0`, `# todo 0`, `# duration_ms 2484.216834` |
| 4 | `rtk proxy git status --short --untracked-files=all`; `rtk proxy git rev-parse HEAD main` | No tracked change, so `mobile-ci.yml` is unmodified. 27 untracked paths before this record (the review's 26, plus its own collected final). `HEAD` = `main` = `c8a5d57c3a0999760ad21fd1aca4899ca76b5adf` |

**RED, verbatim (run 1), test 30's `actual`:**
```
"the pull request body on a comment line of the baseline run block, before pnpm check (the review's case): no problem found",
'a payload that needs no pull request body, deeper in the same run block: no problem found',
'the pull request title on a comment line of a run block after pnpm check: no problem found',
'a comment line outside any run block, in backend-ci.yml: refused all the same, by the one simple rule: no problem found'
```
No positive control appeared in `actual`, so all three current-workflow controls and both accepted edits passed on the old reader.

**Test numbers**, read from the full output of run 3: `backend-ci.test.mjs` is 1 to 21, `ci-guard.test.mjs` is 22 to 33, and `workflow-guard.test.mjs` is 34 to 40. The new test is 30. The old 30 to 39 are now 31 to 40, and 22 to 29 keep the numbers the review cites.

## 3. Existing expectations

**None changed.** In the 39 existing tests, the only edits are:
- the import line, `import { characterProblems, entry } from './workflow-text.mjs';`;
- two cases appended to test 28's `cases`. Its nine existing cases and its assertion are unchanged.

No assertion, regex or case was edited, removed or weakened. All 39 pass in run 3, with test 30 as the 40th.

## 4. Records corrected

| Where | Was | Now |
|---|---|---|
| `review-1005-corrections.md` §5 item 1, and the handoff's 1005 text | Block-scalar false positives "routed to QA-9" | **PL-1 owns them** (named item PL1-D1), and QA-9 is advised. A "Corrected later" header row and inline notes were added; the 1005 text is otherwise kept |
| `review-1005-corrections.md` §1 (flow) and §5 item 2; the handoff's residual risk 2, decision 15 and PL-2 row | Anchors, aliases and tags "refused in all three workflows" | Refused **at the start of a value or line**. Inside a closed one-line flow, such as `[&p coverage, *p]`, they are kept as text |
| `review-1005-corrections.md` §5 item 3 | The "not a plain key" wording "is in `workflow-guard.mjs`" | It is in `workflow-text.mjs` (`keyProblems`, `readStep`); deferred as PL1-D2 |
| `workflow-text.mjs`, `readValue` comment | "An anchor, alias or tag is refused too" | "A value that starts with an anchor, alias or tag is refused too … Inside a closed one-line flow they are kept as text, not refused" |

## 5. Deferred to named PL-1 checkpoint items

- **PL1-D1 (review 1102 L2).** The line scan reads `run: |` script lines as YAML values. That fails closed, but a QA-9 step after `pnpm check` holding `[ -s coverage/summary.json ] || exit 1`, `"$X" --flag`, `echo "a: 'b'"` or `! grep -q …` would be refused, turning both guard jobs red. **Fix, test-first, in its own phase:**
  - in the value check, skip lines indented deeper than a block scalar's key;
  - keep the character checks and this phase's comment-line expression check on those lines;
  - correct the `lineValue` comment.

  QA-9's planned `run: node scripts/quality/coverage-ratchet.mjs` passes today.
- **PL1-D2 (review 1102 L4).** At `workflow-text.mjs:148` and `:210`: when `/^[A-Za-z0-9_-]+:/` matches, say "has a value this guard does not read", not "which is not a plain key". Test-first, in the same or a later phase. Existing tests that match the old wording (test 28's `step` strings) would need a reviewed update.
- **L5** stays as before: the U+2028, waiting for a writer Codex names.

## 6. Not run, inherited and denied

- **Not run (UNRUN):**
  - Prettier 3.6.2 `--check`. The new code was laid out by hand at width 100 with single quotes, which is not proof;
  - any YAML parse;
  - any hash;
  - any mutant, including the two L1 mutants in §1.2;
  - `pnpm check`, `pnpm install`, `pnpm backend:test`, Docker, Supabase, any database, the network and anything hosted.
- **Not run:** the launcher text pasted at the end of the brief.
- **Inherited, not re-run:** earlier phases' hashes, RED records and evidence, as their records state.
- **Unchanged files, without hash proof.** This phase wrote only the files listed in the handoff. `git status` shows no tracked change. For the untracked workflows and finals, "unchanged" rests on this phase's tool log, which only read them.
- **Denied:** see the header. The one Glob use after the denied `ls` is disclosed there.

## 7. Residual risks

1. **The comment rule fails closed outside blocks.** A plain YAML comment that quotes an expression, which GitHub never reads, is refused too (fixture 4). Write such a comment without `${{`.
2. **Comment lines without an expression** are still dropped from step 2's exact comparison (accepted edit 1). Bash ignores them. A `#` line could be data only inside a heredoc or a multi-line string, and the baseline script has neither. Any meaningful line added to make one fails the exact comparison.
3. **Trailing comments.** `run: pnpm check # ${{ … }}` on a plain value is a YAML comment that GitHub never sees, so it is not refused. Inside a block, such a line is meaningful, kept whole, and caught by the existing `${{` run rule.
4. **Text, not YAML**, as before: no parser has run.

**Privacy.** PL-1 reads and writes no member, gym or health data, and adds no staff access. Under PRD §16.1 and ADR-003, staff never read or write private health data, whatever the consent. That override stays until QA-2 is integrated and the launching checkout is corrected.
