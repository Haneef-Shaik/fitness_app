# PL-1 · PL1-D1, PL1-D2 and review 1205's L-1 and L-2 (offline)

| Field | Value |
|---|---|
| Date | 27 October 2026. The UTC time is **UNRUN**: `date -u` was denied in the 1005 phase and has not been retried |
| Review | [final-2026-10-27T1205Z-collected.md](final-2026-10-27T1205Z-collected.md), the independent read-only review of the 1132Z phase. It found 0 Critical, 0 High and 0 Medium, plus L-1 and L-2 and the process Low P-1. Codex accepted it: 40/40 independently on Node v22.23.1, and the comment-expression fix is closed. This phase only read it; it is kept verbatim |
| Worktree | `codex/fitlog-pl1-ci`. `HEAD` = local `main` = `c8a5d57c3a0999760ad21fd1aca4899ca76b5adf` (executed). Nothing committed or staged, by instruction |
| Authority | Codex's brief for this phase, under the owner's AUTH-01 delegation. One bounded test-first phase, no sub-agents. Scope: PL1-D1, PL1-D2, L-1 and L-2. Code changes only in `scripts/ci/workflow-text.mjs` and `scripts/ci/ci-guard.test.mjs`, plus the owned evidence, checkpoint and handoff. No workflow, dependency or QA-9 file. L5 (U+2028) is not touched. No formatter, YAML parser or hash |
| Executed | §2. Each command was a single `rtk proxy` command, and its output was read in full |
| Denied | Nothing this phase. No `ls`, Glob, listing, `mkdir`, `cp`, hash, formatter or `perl` was tried. Every file was read by its known path |
| Not run | The launcher script pasted at the end of the brief. It starts background agents, which this phase may not do |

## 1. Dispositions

| # | Finding | Change | Held by |
|---|---|---|---|
| PL1-D1 (review 1102 L2) | The line scan read `run: \|` script lines as YAML values, so a QA-9 step after `pnpm check` holding `[ -s f ] \|\| exit 1`, `"$X" --flag`, `echo "a: 'b'"` or `! grep -q …` would turn both guard jobs red | **`characterProblems` tracks a block scalar's body**, and inside it skips only the value check. The rules are in §1.1. The character checks and the 1102 comment-expression check still run on every line | New test 34, RED first |
| PL1-D2 (review 1102 L4) | A plain key with a refused value was reported as "which is not a plain key" | **`refusedEntry`**, used by `keyProblems` and `readStep`. If the line matches `PLAIN_KEY` (the regex `entry` uses), it says `<where> has "<line>", a plain key with a value this guard does not read`. Otherwise it still says `which is not a plain key` | New test 35, RED first. Test 28's two exact `step` strings updated to the new wording (§3) |
| 1205 L-1 | Test 30 required a comment line and an expression line in *each* workflow, and `mobile-ci.yml` (QA-9's) has only 2 comments. Test 28's concurrency fixtures were built on `group: mobile-${{ github.ref }}`, QA-9's text | **Tests only.**<br>- Test 30: the two counts are summed across the three workflows. `characterProblems(path, reviewed[path])` must still be `[]` for each workflow, with no minimum per file.<br>- Test 28: the concurrency fixtures now use fixed text. `mobileWithoutConcurrency()` removes `mobile-ci.yml`'s own top-level `concurrency` block, whatever it holds, and each fixture replaces the guard-pinned `permissions:\n  contents: read\n` with its own fixed text | Tests 28 and 30 pass, with every refusal still asserted by exact path, line and message |
| 1205 L-2 | No test held the `?` in the indicator strip | **Tests only.** A fourth fixed-text case in test 28: `  ? "mobile-${{ github.ref }}` | A regression pin: it passes on both readers (traced, §1.4) |
| 1205 P-1 | Process: the 1132Z phase's Glob after a denied `ls` | Nothing to change in code. This phase used no Glob and no listing | — |
| L5 | U+2028 at `workflow-guard.test.mjs:368` | **Not touched** | — |

### 1.1 PL1-D1: the rule, and why it is not weaker

`workflow-text.mjs`:
- `BLOCK_SCALAR` (`:47`) moved above its first use.
- New `INDICATORS` (`:49`).
- `lineValue` (`:57`) now also returns `column`: the line's indentation plus any `- `, `? ` or `: ` indicators. For `      - run: |` that is **8**, not 6.
- The character checks moved, unchanged, into `lineCharacterProblems` (`:72`).
- `characterProblems` (`:108`) does the following:
  1. On every line, it runs `lineCharacterProblems`.
  2. Inside a body, the first **nonblank** line (`line.trim() !== ''`, so comment lines count) indented **no deeper** than the block's key column ends the body (`:115`).
  3. Outside a body, on a meaningful line, it runs the value check as before. If the kept value matches `BLOCK_SCALAR` (`|` or `>`, with optional indicators, after `readValue` has dropped a trailing ` # comment`), a body starts at that line's key column (`:116-126`).
  4. Inside a body, no header is looked for, so a script line such as `label: |` opens nothing.
  5. On every line, it runs the 1102 comment-expression check (`:127`).

**Why skipping these lines hides nothing YAML reads as structure.** This argument rests on the YAML 1.2 grammar, read and not run. No parser has run.
- YAML puts a block scalar's content at least one column deeper than its key: `c-l+literal(n)` with `m ≥ 1`, where `n` is the column of the mapping holding the key, including after `- ` or `? `. The content ends at the first non-empty line indented less than the content.
- This scan's body ends at the first nonblank line indented no deeper than the key. That is never earlier than YAML's end.
- A line in between, deeper than the key but shallower than the content, is either:
  - a comment, which YAML reads as a trailing comment (the comment-expression check still applies to it);
  - or a YAML error: the mapping at the key's column can take no deeper entry. GitHub then rejects the file, so no job runs and the required check never reports.
- A header this scan does not recognise (`- |`, `? |`, `: |`) leaves its body value-checked, which fails closed. A false header inside such a body ends no later than the real body does.
- A header on a line the scan already refuses (an anchor, alias, tag or open value) opens no body.

**Where an accepted body can now appear.**
- In `backend-ci.yml` and `ci-guard.yml`, the structural readers still refuse every block scalar: the exact step and `concurrency` comparisons, the nested-line check in `keyProblems`, and `readStep`'s indentation check.
- In `mobile-ci.yml`, a body can now pass in exactly two places:
  - a step's `run:` block, which `readStep` already reads as script and `mobileRuleProblems` checks for `${{`. Before `pnpm check`, step 2's block is still compared line by line;
  - a block-scalar value in the top-level `concurrency` block, which no structural reader reads (the 1205 review's observation). Its body is text to YAML, per the argument above.

### 1.2 Test 34: what it holds (`ci-guard.test.mjs:1023`)

**Accepted.** `ciWorkflowProblems` must report nothing.

| Fixture | Refused by the old reader? |
|---|---|
| Two steps after `pnpm check`. First `- name: Coverage report` with `run: \| # comment`, whose body holds `[ -s … ] \|\| exit 1`, `"$PNPM_HOME/pnpm" --version`, a blank line, `echo "ratchet: 'ok'"`, a shell comment deeper than `run`, `! grep -q '"pct":0' …`, `{` … `}`, and a heredoc whose script text `label: \|` is followed by `[coverage`, `EOF` and `[ -s coverage/badge.yml ] \|\| exit 1`. Then `- run: >-` with `"--summary" …` | Yes: 8 lines (RED, §2) |
| A fixed-text `concurrency:` with `group: >-` and body `[mobile] ${{ github.ref }}`, in place of QA-9's block | Yes: 1 line (RED) |

**Refused.** Each must be reported at its exact `path:line`. The other two workflows are asserted to be as reviewed.

| # | Fixture | Expected | What it pins (traced by reading; no mutant run) |
|---|---|---|---|
| 1 | After `      - run: \|` and one body line, `        name: "Report` at column 8 | `has the value "\"Report"…` | The key column is measured after `- `. With the line's own indentation (6), the line would sit in the body and be missed |
| 2 | After the body, `        # the report ends here` at column 8, then `          name: "Report` at 10 | the same, at the deeper line | Comment lines end the body. If they did not, the deeper line would be missed. To YAML this file is an error |
| 3 | After the body, the next step `      - name: "Upload` | `has the value "\"Upload"…` | A body that never ends |
| 4 | Fixed-text `concurrency:` with `  group: \|`, body `    [mobile] x`, then `  cancel-in-progress: "true`, and then `permissions:` and `contents: read` inside that open string, closed by `  #"` | `has the value "\"true"…` | A body ends at the key's own column (`<=`, not `<`). Without this check, YAML could read the top-level `permissions` into the string, while the guard's exact permissions check still sees `contents: read` |
| 5 | U+0085 inside a body line | `has U+0085 at column 17, outside printable ASCII` | Character checks still run in bodies |
| 6 | A tab indenting a body line | `indents with a tab, which YAML forbids` | Same |
| 7 | A bare CR inside a body line | `has a carriage return that does not end the line` | Same |
| 8 | `# ${{ github.head_ref }}` as a body line | `has an expression on a comment line` | The 1102 check still runs in bodies (test 30 also holds it) |

Further mutants each accepted fixture catches (traced, not run):
- **Nested header:** a header looked for inside a body. `label: \|` would reset the key to 10, the body would end at `EOF`, and `[ -s coverage/badge.yml ] …` would be refused.
- **Blank lines ending a body:** the blank line after `"$PNPM_HOME/pnpm"` would end it.
- **Any comment ending a body:** the shell comment at 10 would end it.
- **The header read before `readValue`:** `\| # comment` would not be seen as a header.
- **`>` dropped from `BLOCK_SCALAR`:** both `>-` fixtures would be refused.

### 1.3 Test 35 and the D2 wording (`ci-guard.test.mjs:1143`)

Each case is one edit to a PL-1-owned workflow. The guard must give the expected wording and not the other one:

| Case | Where | Wording |
|---|---|---|
| `name: *guard` | `ci-guard.yml top level` (`keyProblems`) | a plain key with a value this guard does not read |
| `    timeout-minutes: &minutes 10` | `ci-guard.yml jobs.ci-guard` (`keyProblems`) | the same |
| `        run: !!str node scripts/ci/backend-ci.mjs base` | `backend-ci.yml jobs.backend step 4` (`readStep`, step keys) | the same |
| `          node-version-file: [.node-version` | `backend-ci.yml jobs.backend step 2` (`readStep`, `with:` inputs) | the same |
| `"name": CI guard` | `ci-guard.yml top level` | which is not a plain key |
| `        run:node scripts/ci/backend-ci.mjs vendored` | `backend-ci.yml jobs.backend step 6` | which is not a plain key |

The last case pins `PLAIN_KEY` itself (traced). The looser `/^[A-Za-z0-9_-]+:/` that the 1102 record sketched would match `run:node` and give the wrong wording. YAML reads `run:node …` as one plain scalar.

### 1.4 L-1 and L-2

- **L-1.** QA-9 can now reword or delete `mobile-ci.yml`'s comments, or change its concurrency group, without turning test 28 or test 30 red.
  - Traced, and not executed, since QA-9's file may not be edited: `mobileWithoutConcurrency()` removes the top-level `concurrency:` line together with its indented and blank lines, whatever the group says. It then asserts that no `concurrency:` line is left and that the pinned permissions are there.
  - The current aggregate counts by reading are 19 comment lines and 8 expression lines. `backend-ci.yml` and `ci-guard.yml`, PL-1's own, hold 17 and 6 of them.
- **L-2.** With `INDICATORS`' `[-?:]` changed to `[-:]`, `? "mobile-…` keeps no leading quote and holds no `: `, so the value is `''` and the new case is missed (traced; the 1205 review traced the same).

## 2. Test-first runs (executed)

Before any run:
- `ci-guard.test.mjs` was read in full;
- `backend-ci.test.mjs`'s header, setup and child-process calls were read: Git runs only in scratch folders under the OS temporary directory, with no user or system Git configuration, and psql and the stack are fakes;
- a Grep of all three test files for network, database, Docker or process use found only those scratch Git calls and recorded fixtures.

The 1205 review's fuller inspection is inherited. No database, Docker, Supabase, network or tracked-file write.

| # | Command | Result |
|---|---|---|
| — | `rtk proxy node --version` | `v22.23.1` |
| 1 | Tests written first, with `workflow-text.mjs` unchanged. `rtk proxy node --test --test-name-pattern="review 1005 M1\|review 1102" scripts/ci/ci-guard.test.mjs` (`\|` here is one pipe in the shell) | **RED:** `1..5`, `# tests 5`, `# pass 2`, `# fail 3`.<br>- Test 28: all 8 `install`/lint cases still got "which is not a plain key".<br>- Test 35: its 4 value cases did the same.<br>- Test 34: failed.<br>- Tests 29 and 30 passed.<br>The output was truncated in the middle, which hid test 34's detail, so run 2 shows it |
| 2 | `rtk proxy node --test --test-name-pattern="review 1102 L2" scripts/ci/ci-guard.test.mjs`, before any code change | **RED:** `# tests 1`, `# fail 1`. `actual` held only the two accepted fixtures: 8 value refusals (`mobile-ci.yml:54, 55, 57, 59, 60, 65, 67, 70`) and 1 (`:10`). None of the 8 refusal fixtures was in it: they pass on the old reader, as pins |
| 3 | `rtk proxy node --check scripts/ci/workflow-text.mjs`, after the change | No output (parses) |
| 4 | The focused command of run 1 | **GREEN:** `1..5`, `# tests 5`, `# pass 5`, `# fail 0` |
| 5 | **Once:** `rtk proxy node --test scripts/ci/*.test.mjs`, full output | **GREEN:** `1..42`, `# tests 42`, `# suites 0`, `# pass 42`, `# fail 0`, `# cancelled 0`, `# skipped 0`, `# todo 0`, `# duration_ms 2550.953708`. Test 33 runs the guard command on the real repository files and exits 0 |
| 6 | Two layout-only edits to `ci-guard.test.mjs` after run 5:<br>- test 34's `! grep` line rewritten in single quotes (the same string value);<br>- test 35's ternary split into two named constants (the same logic).<br>Then `rtk proxy node --check scripts/ci/ci-guard.test.mjs` | No output (parses) |
| 7 | `rtk proxy node --test --test-name-pattern="PL1-D" scripts/ci/ci-guard.test.mjs` | `# tests 2`, `# pass 2`, `# fail 0`. The full suite was **not** re-run after run 6, so it stays at "run once" |
| 8 | `rtk proxy git status --short --untracked-files=all`; `rtk proxy git rev-parse HEAD main` | No tracked change, so no workflow was modified. 28 untracked paths before this record: the 1102 phase's 27, plus the 1205 final. `HEAD` = `main` = `c8a5d57c3a0999760ad21fd1aca4899ca76b5adf` |

**Test numbers** (run 5):
- `backend-ci.test.mjs` is 1 to 21.
- `ci-guard.test.mjs` is 22 to 35. Tests 22 to 33 keep their numbers. The new tests are 34 (D1) and 35 (D2), appended at the end of the file.
- `workflow-guard.test.mjs` is now 36 to 42 (was 34 to 40).

## 3. Existing expectations changed (reviewed, as the brief asked)

- **Test 28, two exact `step` strings:** "which is not a plain key" became "a plain key with a value this guard does not read". This is D2's own change. The open-value lines are still asserted at their exact path and line.
- **Test 28, three concurrency cases:** the same fixed text as before (open `group:`, open string, `- ` indicator), now placed on a version of `mobile-ci.yml` without QA-9's concurrency block (L-1). The expected path, line and value are unchanged.
- **Test 30's non-vacuity precondition** is now one count across the three workflows instead of one per file (L-1). The check of each workflow as it stands, `characterProblems` = `[]`, is unchanged. All 4 refused fixtures and both accepted edits are unchanged.
- **`editEach`** takes an optional `base`. Its default is the reviewed text, so test 26 is unchanged.

No guard behaviour was relaxed outside block bodies. No refusal assertion was removed or loosened.

## 4. Not run, inherited

- **UNRUN:**
  - Prettier 3.6.2 `--check`. The code was laid out by hand at width 100 with single quotes, and run 6 aligned two lines with Prettier's quote rule as read. That is not proof;
  - any YAML parse. §1.1's argument is from the YAML 1.2 grammar, by reading;
  - any hash;
  - every mutant listed in §1.2 to §1.4 (traced by reading only);
  - `pnpm check`, `pnpm install`, `pnpm backend:test`, Docker, Supabase, any database, the network, anything hosted, and the launcher.
- **Inherited:** earlier phases' hashes and evidence; the 1205 review's inspection of the test modules' side effects.
- **Unchanged files, without hash proof:** the workflows, `workflow-guard.mjs`, `workflow-guard.test.mjs` (L5 included), `backend-ci*.mjs` and every raw final were only read in this phase. `git status` shows no tracked change.

## 5. Residual risks

1. **Text, not YAML.** The body rule's safety rests on §1.1's reading of the grammar and on GitHub rejecting a file YAML cannot parse. No parser has run.
2. **`readStep` ignores comment lines, and this scan does not.** In a `run:` block that a comment line at or above column 8 interrupts, `readStep` still collects the deeper lines as script, and the line scan value-checks them. To YAML such a file is an error, so GitHub runs nothing. Before `pnpm check`, step 2's exact comparison is unchanged.
3. **Other QA-9 text that tests still anchor on**, the same kind of coupling as L-1 but outside its scope:
   - test 28's `EXPO_CHECK`;
   - the `export:web` step (tests 24 and 29);
   - `    timeout-minutes: 15` (tests 24 and 27).

   An edit to these fails loudly at the `edit` precondition, not silently. Suggested as a later bounded test-only phase.
4. As before: the comment-expression rule fails closed outside blocks; pin bumps need the guard (`ACTION`); and the guard is trusted to review and branch protection (F2).

**Privacy.** PL-1 reads and writes no member, gym or health data, and adds no staff access. Under PRD §16.1 and ADR-003, gym staff never read or write private health data, whatever the consent. That override stays until QA-2 is integrated and the launching checkout is corrected.
