# PL-1 · Corrections for independent review 0535 (offline)

| Field | Value |
|---|---|
| Date | 27 October 2026 |
| Review | [final-2026-10-27T0535Z.md](final-2026-10-27T0535Z.md): 0 Critical, 2 High, 2 Medium, 6 Low |
| Corrected later | Review [0705](final-2026-10-27T0705Z.md) found that H1's claim below held only after the mobile steps before `pnpm check` were pinned (F1), and that the residual risks were too narrow (F2) and the YAML-parse note too narrow (F6). See [review-0705-corrections.md](review-0705-corrections.md). The text below is otherwise this phase's record |
| Worktree | `/Users/Adya/.codex/worktrees/fitlog-pl1-ci/fitness_app`, branch `codex/fitlog-pl1-ci`, `HEAD` = local `main` = `c8a5d57c3a09…`. Nothing committed or staged, by instruction |
| Authority | Codex's brief for this phase, acting under the owner's AUTH-01 delegation (EXECUTION.md, "Decision authority"). M2 is Codex's delegated decision, not a personal owner review |
| What ran | Only the offline CI tests in `scripts/ci/`, through `rtk proxy node --test`. Before running them I checked what they touch. They read repository files and write scratch Git repositories and workflow copies under the OS temporary folder, which they remove. Git runs with an isolated configuration. Supabase, Docker and psql are injected fakes. They make no network, database or real-repository writes |
| What did not run | Prettier, a YAML parser, the earlier external mutation script, `scripts/backend` tests, `pnpm check`, `pnpm backend:test`, Docker, Supabase, any network call, and any hosted run, push, pull request or GitHub API call |

## 1. Dispositions

| # | Finding | Change | Tests that hold it |
|---|---|---|---|
| H1 | The guard ran only inside the job it guards, so skipping that job skipped the guard | **In-lane option chosen.** A new, separate required workflow, `.github/workflows/ci-guard.yml`, with job `ci-guard` (Node only, no install). It runs `node scripts/ci/workflow-guard.mjs` and the CI tests. The `backend` job runs the same guard as step 3. The guard now judges **all three** workflows (`backend-ci.yml`, `ci-guard.yml`, and the disabling surface of `mobile-ci.yml`'s `check` job) plus the folder's inventory. So one edit that skips, empties or redirects any one required job is refused by a guard job in a workflow the edit did not touch. Coverage kept and extended for every workflow: job-level `if`, `needs`, `continue-on-error`, `defaults`, `strategy` and display `name`; step `if`, `shell` and `env`; workflow `env` and `defaults`; triggers pinned literally (no `paths`, `paths-ignore`, `branches-ignore` or other events); `\|\| true` and `set +e`; `GITHUB_ENV`; pins; permissions; duplicate check names in another workflow file | `ci-guard.test.mjs` (all 6 tests); `workflow-guard.test.mjs` "each way to skip a step …" (now 41 mutants, from 29) |
| H1 limit | — | **Not claimed:** this does not stop one change that edits the guard code (or its tests) together with the workflows. It also doesn't stop an edit to what `pnpm check` or `pnpm backend:test` run in `package.json`. Review and branch protection carry those (§3) | — |
| H2 | A draft probe pull request can't prove that the required check blocked the merge | Procedure §4: open as a draft only while the runs execute, then mark it **Ready for review**. Capture the non-draft merge box, plus `gh pr view --json isDraft,mergeStateStatus,statusCheckRollup` showing `isDraft:false`, `BLOCKED`, `backend` FAILURE and `check`/`ci-guard` SUCCESS. Close it unmerged. Run this only after box 3 with no bypass | Procedure text |
| M1 | Admin bypass was optional | Procedure §3: no bypass is **mandatory**. That means `enforce_admins` on (classic), or an Active ruleset with an empty bypass list. The capture must show it. A wanted bypass is recorded as a decision, and boxes 2 and 3 then stay unmet | Procedure text |
| M2 | QA-9 R6's review clause was described as covered by box 3 | Corrected. No box enforces review. **Codex's delegated (AUTH-01) decision** is to accept the residual risk of no enforced second review while there is a single maintainer. This is not a personal owner review, and no enforcement is invented. Later: add CODEOWNERS and "Require review from Code Owners" once a second maintainer exists | Handoff "Decisions" |
| L1 | Queued push runs could be cancelled | Each push has its own concurrency group, `…-${{ github.event_name == 'pull_request' && github.ref \|\| github.run_id }}`, in both `backend-ci.yml` and `ci-guard.yml`. Superseded pull-request runs are still cancelled | "every push runs in its own concurrency group …"; the backend and ci-guard group mutants |
| L2 | The guard's idea of a line differed from YAML's | `workflow-text.mjs` refuses a bare CR, every character outside printable ASCII (by code point and column, for example U+0085, U+2028, U+0000, U+001B, U+2014 and a tab inside a value), and any meaningful line nested under a scalar value (top-level `name`, `runs-on`, `timeout-minutes`, env values). CRLF line endings stay readable. Every message quotes values in printable ASCII only | "the guard reads lines as YAML does …" (12 cases), plus CRLF |
| L3 | The pull-request checkout shape was untested | Scratch fixture: a base commit, then a branch that edits a migration, merged `--no-ff` into a detached HEAD. All branches are then deleted and a `pull_request` payload is supplied. `base` passes. `local-main` creates `main` at the base. `checkSqlSources` reports `… was modified since the base main@<12 hex>` (and `<sha>@<12 hex>` with `CI` and `FITLOG_BASE_REF`) | "a pull-request checkout, a detached merge with no local branch …" |
| L4 | The privacy sentence overstated `verify-gym.mjs` | The handoff now states exactly what `verify-gym.mjs:51` asserts, and names AC09's owners (ACCEPTANCE.md row AC09: G16.api, G21.api, G23; MS-6) | Handoff "Self-review" |
| L5 | `FITLOG_CONTRACT_BASELINE` is unused in the backend job | Kept for parity, with a comment saying so. No step in the job reads it (only `packages/domain` does, in `check`). `base` still holds it equal to `FITLOG_BASE_REF`, and the guard holds both lines and mobile's to one expression | Unchanged tests; comment in `backend-ci.yml` |
| L6 | Classic-protection API only; no fast-forward merge on GitHub | Procedure §3 adds the ruleset captures (`/rulesets`, `/rulesets/<id>`, `/rules/branches/main`). Procedure §2 states that box 1 is proven by the **push** runs on the head that `main` has after the merge, all three `success` | Procedure text |
| Status | The review read PL-1 as `"not started"` | That is this branch's historical snapshot of `status.json` at `c8a5d57`. The live board in the canonical main checkout has an uncommitted working-tree edit: PL-1 is `claimed`, `who` Codex, `ref` `codex/fitlog-pl1-ci`, at `2026-10-26T19:40:31.482Z`. Read only; nothing changed | — |

## 2. Test-first runs

| # | Command | Result |
|---|---|---|
| 1 | Tests written first. `rtk proxy node --test --test-reporter=spec scripts/ci/backend-ci.test.mjs scripts/ci/workflow-guard.test.mjs scripts/ci/ci-guard.test.mjs` | **RED:** `ℹ tests 34`, `ℹ pass 23`, `ℹ fail 11`. All 6 `ci-guard.test.mjs` tests and 5 `workflow-guard.test.mjs` tests fail, each at its own assertion. Examples below |
| 2 | Workflows, `workflow-text.mjs` and `workflow-guard.mjs` written; same command | 33 of 34. The one failure was my own rewording of the `secrets` message, which an existing assertion pins (`/this job needs no secret/`). The message was restored; the test was not changed |
| 3 | Same command | **GREEN:** `ℹ tests 34`, `ℹ pass 34`, `ℹ fail 0` |
| 4 | `rtk proxy node --test --test-reporter=dot scripts/ci/*.test.mjs`, the form both jobs run | 34 dots, exit 0 |
| 5 | Prettier-layout pass by hand (no tool run), then run 3's command again | 34 of 34 |
| 6 | Four cases added after the code (see §4), then `--test-reporter=dot` on the three files | 34 dots, exit 0 |
| 7 | Final run after the docs: run 3's command | `ℹ tests 34`, `ℹ pass 34`, `ℹ fail 0` |

RED examples from run 1, verbatim:
- `three required checks, each from its own reviewed workflow, …`: `+ undefined - { 'ci-guard': '.github/workflows/ci-guard.yml', backend: …, check: … }`
- `ci-guard.yml is exactly as reviewed`: `AssertionError [ERR_ASSERTION]: .github/workflows/ci-guard.yml exists`
- `each way to skip a step …`: `the mutant's target "        run: node scripts/ci/workflow-guard.mjs\n" is in the text`
- `the backend base agrees with mobile-ci.yml's …`: the old guard said `on: must equal .github/workflows/mobile-ci.yml's …`, not the literal pin
- `every push runs in its own concurrency group …`: `the reviewed group is the one the workflow sets`
- `the guard reads lines as YAML does …`: `a bare CR that YAML reads as a line break:` with `actual: ''`. **The old guard reported nothing at all for the reviewer's exact L2 attack.**
- The failure messages of the other four `ci-guard.test.mjs` tests fell in the truncated part of the captured output. Their `✖` lines are in the run.

The L3 fixture passed on its first run. It characterizes behaviour the review said nothing was known to break. It was not shown RED.

## 3. Residual risks, stated plainly

- **Coordinated edits.** Both guard jobs run the change's own `scripts/ci/` code. One change that weakens `workflow-guard.mjs` (or its tests) and also disables a job in a workflow passes both guard jobs. Nothing in CI can stop that. Review and branch protection are the control, and with one maintainer that review is Codex's (M2).
- **Package scripts.** The workflows run `pnpm check` and `pnpm backend:test`, whose meaning lives in the root `package.json`. QA-9's `gate-wiring.mjs` pins `check`, but from inside `pnpm check`, which is the same H1 shape. Nothing pins `backend:test`. Both are listed for other goals in the handoff.
- **Text, not YAML.** The guard reads the block style these files use and refuses anything else it can't place. A real YAML parser was not run in this phase. (Corrected 0705 F6: **neither** current workflow has been parsed. Phase 1 parsed an older `backend-ci.yml`.) A strict parse is a step for the reviewer.
- **(Added 0705 F2) The general rule.** The guard judges workflow files only. Everything the jobs run or configure is trusted to review: `package.json` scripts, `.npmrc`, the scripts and tests those commands run, and the guard itself.

## 4. Not shown RED

Four cases were added after the code. All passed on their first run:
- a non-ASCII character in a value that a message quotes, which must come out escaped (`"ubuntu-latest—x"`);
- a file name holding `\n::error::`, which must be quoted;
- a mobile step item written `-  run:` with two spaces;
- an `if:` placed after a `run: |` block.

No mutation script was run in this phase (only CI tests were allowed). The earlier 29 external mutants are inherited from phase 1 and were not re-run against the new code.
