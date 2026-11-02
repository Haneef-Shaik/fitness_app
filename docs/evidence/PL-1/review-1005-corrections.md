# PL-1 · Corrections for independent review 1005 (offline)

| Field | Value |
|---|---|
| Date | 27 October 2026. The UTC time is **UNRUN**: `rtk proxy date -u` was denied, and no other clock was tried |
| Review | [final-2026-10-27T1005Z-collected.md](final-2026-10-27T1005Z-collected.md), the 10:05 UTC independent review: 0 Critical, 0 High, 1 Medium (M1), 2 Low (L1, and L2 the deferred U+2028). Kept verbatim; this phase only read it |
| Worktree | `codex/fitlog-pl1-ci`, `HEAD` = local `main` = `c8a5d57c3a0999760ad21fd1aca4899ca76b5adf`. Nothing committed or staged, by instruction |
| Authority | Codex's brief for this phase, under the owner's AUTH-01 delegation. One bounded phase, no sub-agents. Scope: M1 test-first in `scripts/ci/workflow-text.mjs` and owned tests only; L1 by a normal Edit; L2 untouched |
| Executed | See §2 and §4. Every command was a single `rtk proxy` command. The GREEN run piped its output through `tail -n 12` |
| Denied, sequence stopped | `rtk proxy ls -la docs/evidence/PL-1/`: the listing stopped there, and no other listing tool was tried. The review was then read by its known name. `rtk proxy date -u`: no other clock was tried |
| Corrected later | Review [1102](final-2026-10-27T1102Z-collected.md) corrected three statements below:<br>1. The block-scalar false positives (§5 item 1) are **PL-1's to fix**, as named checkpoint item PL1-D1, and QA-9 is advised. They were not "routed to QA-9" (L2).<br>2. Anchors, aliases and tags (§1, §5 item 2) are refused **at the start of a value or line**, not anywhere in the workflows. Inside a closed one-line flow they are kept as text (L3).<br>3. The "not a plain key" wording (§5 item 3) comes from `workflow-text.mjs` (`keyProblems`, `readStep`), not `workflow-guard.mjs`. It is deferred as PL1-D2 (L4).<br>See [review-1102-corrections.md](review-1102-corrections.md). The text below is otherwise this phase's record |

## 1. Dispositions

| # | Finding | Change | Held by |
|---|---|---|---|
| M1 (Medium) | `entry` kept a value that starts with `"` or `'` whole even when the quote never closed on its line. YAML carries an open quoted value onto the following lines, so the guard and YAML could read different steps | **`workflow-text.mjs` only.** <br>1. A new module-private `readValue`. A plain value loses its trailing comment, as before. A quoted or flow value is kept whole, quotes and brackets included, **only** if it closes on its own line with at most ` # comment` after it. Patterns: double `"(?:[^"\\]|\\.)*"`, single `'(?:[^']|'')*'(?!')`, and a one-level `[…]` or `{…}` whose items are plain characters (no bracket, brace, quote or `#`) or closed quoted items. Anything else that starts with `"`, `'`, `[` or `{` gives `null`, and so does any value that starts with `&`, `*` or `!` (anchor, alias or tag). <br>2. `entry` uses `readValue`. `null` is reported by the guard as "…, which is not a plain key". <br>3. `characterProblems` also checks **every meaningful line**. A new `lineValue` takes the line's value: after any `- `, `? ` or `: `, the line itself if it starts with a quote, bracket, brace, `&`, `*` or `!`, otherwise what follows its first `: `. A value `readValue` refuses is reported as `<path>:<line> has the value …, which this guard does not read: …`. This covers lines that never reach `entry`: the `on`, `permissions` and `concurrency` bodies, compared as text, and `mobile-ci.yml`'s concurrency body, which the guard otherwise doesn't read (mutant 9) | Test 28: 9 hiding mutants, each refused by `ciWorkflowProblems` with the other two workflows asserted as reviewed. Test 29: 7 values read, 15 refused and 5 workflow edits accepted |
| L1 (Low) | `ci-guard.test.mjs:68`, `const ON ='on:…'` (no space after `=`) | The space was added by a normal Edit. The line is now `:69`, because one import line was added above it | Nothing executed. Prettier is **UNRUN** (§4) |
| L2 (Low, deferred) | A literal U+2028 at `workflow-guard.test.mjs:368` | **Not touched.** No writer or formatter was tried, and the denied ones were not retried | A later phase, if Codex names an allowed writer |

### The 9 hiding mutants (test 28)

Each is one edit to one workflow. The guard both guard jobs run must report the opening line by path and line number. For the eight step cases, it must also report the step's "not a plain key" problem.

| # | Workflow | Mutant | What a lenient YAML parser would read |
|---|---|---|---|
| 1 | mobile | `        name: "Install` under the install step; `      #"` after `- run: pnpm check` (the review's case) | `pnpm check` becomes part of step 5's name |
| 2 | mobile | The same with single quotes: `name: 'Install` … `#'` | The same |
| 3 | mobile | `name: "Install`, closed by `        name: x"` on the next step (`expo install --check`) | `pnpm check` and the next step are swallowed |
| 4 | mobile | Case 1, followed by `- uses: actions/setup-node@1{40}` and a named `run: pnpm check` | A fork setup-node runs before the only `pnpm check` YAML sees. To the guard, the fork step comes after its plain `pnpm check`, where it is allowed |
| 5 | backend | The lint step reordered `run:` first, with `name: "The replayed schemas lint clean`; `      #"` after `- run: pnpm backend:test` (the review's case) | `pnpm backend:test` never runs |
| 6 | mobile | `name: [Install`, closed by `name: x]` on the next step | An open flow sequence. **Refused to fail closed**; that a parser accepts this was not checked |
| 7 | mobile | `name: &install "Install` … `#"` | An anchor before an open quote, which the old reader's `^['"]` check missed |
| 8 | mobile | `name: !!str "Install` … `#"` | A tag before an open quote |
| 9 | mobile | `concurrency:` moved above `permissions:`, with `  group: "mobile-${{ github.ref }}` left open and `  #"` closing it under `permissions:` | The top-level `permissions: contents: read` becomes part of the group string, so the job gets the repository's default token permissions. The guard still saw an exact `permissions` block. **This route never reaches `entry`**, so an `entry`-only fix would leave it open |

### Flow collections, inspected

- **Where flow values reach the reader.**
  - Parsed entries, today only in mutants: `needs: [backend]`, `[lint]`, `[setup]`, `x: [1]`.
  - The three workflows' `branches: [main, v2/develop]`, which is compared as text inside `on:`.
- **The ambiguities.**
  - An open `[` or `{` continues onto the following lines, as an open quote does.
  - Inside a flow, a `#` after whitespace starts a comment, and the collection continues on the next line. The old reader read `[a, # a comment inside]` as `[a,` (test 29, RED).
  - A nested flow is not read.
- **Decision.** Accept a one-level flow closed on its line, whose items are plain or closed quoted items, with no unquoted `#`. Refuse every other flow value.
- **Compatibility.**
  - The only flow value in the three files, `[main, v2/develop]`, is accepted.
  - Every existing flow mutant (`[backend]`, `[lint]`, `[setup]`, `[1]`, `[docs/**]`, `[supabase/**]`, `[scripts/ci/**]`, `[wip/**]`, `['**']`, `["**"]`) is a closed one-level flow, so its expected message is unchanged.
  - Test 32 runs the guard command on the real repository files.
- **Anchors, aliases and tags are refused in all three workflows**, so the guard fails closed. *Corrected later (review 1102 L3): only at the start of a value or line. Inside a closed one-line flow, such as `[&p coverage, *p]`, they are kept as text.*
  - they can open an unclosed quote (mutants 7 and 8);
  - an alias stands for a value defined elsewhere, which the guard does not resolve. For example, an anchored `${{ … }}` reused as a later step's `run` would bypass the "no expression in run" rule.

  Whether GitHub accepts them was not checked (no network).

## 2. Test-first runs (executed)

Before any run, the three test files and the modules they import were read for effects:
- the tests read the repository's workflows and AR-1's recorded CLI logs;
- they write scratch folders under the OS temporary directory and remove them;
- they run Git only in scratch repositories, with `GIT_CONFIG_GLOBAL=/dev/null` and `GIT_CONFIG_NOSYSTEM`;
- they inject fakes for Supabase, Docker, psql and the CLI runner, and `cliRunner` only runs Node itself and a missing binary in a scratch folder;
- `backend-ci.mjs`, `check-sql-sources.mjs` and `local-stack.mjs` run nothing when imported.

No database, Docker, Supabase, network or tracked-file write.

| # | Command | Result |
|---|---|---|
| — | `rtk proxy node --version` | `v22.23.1` |
| 1 | Tests 28 and 29 written first, plus the L1 space; `workflow-text.mjs` unchanged. `rtk proxy node --test --test-name-pattern="review 1005" scripts/ci/ci-guard.test.mjs` | **RED:** `# tests 2`, `# pass 0`, `# fail 2` |
| 2 | `workflow-text.mjs` changed (§1). Then, **once**: `rtk proxy node --test scripts/ci/*.test.mjs 2>&1 \| tail -n 12` (the `\|` is a table escape) | **GREEN:** `1..39`, `# tests 39`, `# pass 39`, `# fail 0`, `# cancelled 0`, `# skipped 0`. Only the last 12 lines were displayed |

**RED, verbatim (run 1):**
- **Test 28** `actual`, all 9 mutants: `<label>: no problem found`, for
  1. `pnpm check inside an open double-quoted name`
  2. `pnpm check inside an open single-quoted name`
  3. `pnpm check and the next step inside a name a later step closes with name: x"`
  4. `a fork setup-node that YAML runs before the only pnpm check it reads`
  5. `pnpm backend:test inside an open name on the lint step`
  6. `pnpm check inside an open flow sequence`
  7. `pnpm check inside a quote opened after an anchor`
  8. `pnpm check inside a quote opened after a tag`
  9. `the top-level permissions inside an open concurrency group, which the guard reads nowhere else`
- **Test 29** `actual`, 18 lines:
  - 2 closed values that kept their comment: `name: "a \" b # not a comment" # a comment` read as `"\"a \\\" b # not a comment\" # a comment"`, and `name: 'it''s' # a comment` read as `"'it''s' # a comment"`;
  - all 15 refused values, each read as `{"key":"name",…}`, `not refused`: `"open`, `'open`, `"a closing quote escaped\"`, `'a closing quote escaped''`, `"closed" then text`, `"closed"# a comment with no space`, `'one' 'two'`, `[open`, `[closed] then text`, `[[nested]]`, `[a, # a comment inside]` (read as `[a,`), `{a: "open}`, `&anchor value`, `*alias` and `!!str value`;
  - `a quoted env value and a comment: .github/workflows/backend-ci.yml jobs.backend.env.CI is "'1' # the CI flag", not the reviewed "'1'"`.

**Test numbers** come from file order: 21 tests in `backend-ci.test.mjs`, then `ci-guard.test.mjs` (22 to 32), then `workflow-guard.test.mjs` (33 to 39). The GREEN display showed only the summary, so the numbers were not read from that output.

**Not shown RED** (they passed on the old reader too; they are compatibility checks, not mutants):
- in test 29, `name: plain text # a comment`, `CI: '1'`, `needs: [a, "b]", 'c'] # a comment`, `with:` and `run: |`;
- 4 of the 5 accepted workflow edits: a double-quoted name with a comment, escapes in a double-quoted name, a single-quoted name containing `''`, and a closed flow input after `pnpm check`.

**Each mechanism is held.** For mutants 1 to 8, test 28 requires both the line-level message (from `characterProblems`) and the step-level one (from `entry`). Mutant 9 requires the line-level message. Removing either change would fail test 28. That follows from the assertions; no outside mutation run was made.

## 3. Existing expectations

**None changed.** In the 37 existing tests, the only edits are:
- the L1 space;
- one new import line, `import { entry } from './workflow-text.mjs';`.

No assertion, regex or case was edited, removed or weakened. All 37 pass in the GREEN run.

## 4. Not run, inherited and denied

- **Not run:**
  - **Prettier 3.6.2 `--check`.** The local settings are `--no-config --no-editorconfig --print-width 100 --single-quote`, per `local-verification.md:113`. `rtk proxy git ls-files` on the Prettier and EditorConfig names found no tracked config. The new code was laid out by hand to that width, which is **not proof**.
  - **A strict YAML parse.** Whether GitHub's parser accepts an open quote that carries onto later lines is still unchecked. The fix does not depend on it.
  - **Any hash.** `shasum` was denied in the review 1005 cycle. It was not retried, and no other hasher was tried.
  - **Any outside mutation run.**
  - **`pnpm check`, `pnpm install` and `pnpm backend:test`.**
  - **Docker, Supabase, any database, the network and anything hosted.**
- **Unchanged files, without hash proof.**
  - This phase wrote none of these files. It read the three workflows and `final-2026-10-27T1005Z-collected.md` in full, and searched the other seven finals' `STATUS`, `BOXES`, `NOTES` and `HANDOFF` lines.
  - `rtk proxy git status --short --untracked-files=all` shows no tracked change, so `mobile-ci.yml` is unmodified. It also shows the same 24 untracked PL-1 paths, plus this file.
  - For the untracked `backend-ci.yml`, `ci-guard.yml` and the finals, "unchanged" rests on this phase's tool log, not on a hash.
- **Inherited, not re-run:** the 0905 phase's hashes, its RED and its 37/37; review 1005's 37/37; and earlier phases' evidence, as their records state.

## 5. Residual risks (accepted or routed)

1. **The line scan also reads `run: |` script lines** (fail closed, false positives possible). A script line is refused if it starts with:
   - `[[`, `[`, `{`, `!`, `&`, `*`, `"` or `'`, as in `[[ -n "$X" ]] || exit 1`, `! grep …` or `"$CMD" --flag`;
   - or `: ` followed by one of those.

   Only `mobile-ci.yml`'s steps after `pnpm check` can hold such a script; the other run blocks are pinned exactly. None does today. A follow-up could skip block-scalar content (lines indented past the header's key column) in its own test-first phase. The `lineValue` comment says only "a script line that looks like an open value"; this item states it fully. Not edited after GREEN, by the run-once instruction. Routed to QA-9 in the handoff. *Corrected later (review 1102 L2): PL-1 owns this fix, as named checkpoint item PL1-D1, and QA-9 is advised. It was not QA-9's to fix.*
2. **Anchors, aliases and tags** are refused in all three workflows. Using them needs a reviewed guard change. *Corrected later (review 1102 L3): only at the start of a value or line. Inside a closed one-line flow they are kept as text.*
3. **"Not a plain key" wording.** A plain key with a value the reader refuses is reported by the guard as "…, which is not a plain key". The line-level message beside it states the real reason. Low; the wording is in `workflow-guard.mjs`, outside this phase's files. *Corrected later (review 1102 L4): the wording is in `workflow-text.mjs` (`keyProblems` and `readStep`). It is deferred as named checkpoint item PL1-D2.*
4. **Text, not YAML.** M1 closes the known routes by which a value carries onto later lines. Other YAML features were checked by reading only, where they could hide lines: for example a block scalar with an explicit indentation indicator, or a document marker inside a body. Each case found leads to a YAML error, which fails the workflow, rather than a different reading. No parser has run.
