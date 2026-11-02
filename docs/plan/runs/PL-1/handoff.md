# Handoff — PL-1 · Hosted CI green and main protected        attempt 1, phase for PL1-D1, PL1-D2 and review 1205's L-1 and L-2 · `codex/fitlog-pl1-ci` · `c8a5d57` + uncommitted

**Outcome claimed.** All four items were done test-first, with code changes in `scripts/ci/workflow-text.mjs` and `scripts/ci/ci-guard.test.mjs` only.
- **PL1-D1.** The line scan now tracks real YAML block-scalar bodies and skips only the value check inside them. A body ends at the first nonblank line, comment lines included, indented no deeper than its key; after `- run: |` that key is at column 8. A script line that looks like `key: |` opens nothing. The character checks and the 1102 comment-expression check still run on every line. A QA-9 step after `pnpm check` holding `[ -s f ] || exit 1`, `"$X" --flag`, `echo "a: 'b'"` or `! grep -q …` is now accepted.
- **PL1-D2.** A plain key with a refused value now reads "a plain key with a value this guard does not read". Only a line with no plain key says "which is not a plain key".
- **L-1.** Test 30's comment and expression counts are taken across the three workflows. Test 28's concurrency fixtures no longer depend on QA-9's group.
- **L-2.** Test 28 now has a `? ` indicator case.

L5 (U+2028) is untouched. **None of the three Done-when boxes is met**: all three need outward actions. PL-1 is not Done. A **fresh independent review** is next.

| Field | Value |
|---|---|
| Phase | One bounded offline test-first phase under Codex's brief (AUTH-01). No sub-agents, by instruction, so `code-reviewer`, `security-reviewer` and `tdd-guide` were not run (self-review below). The UTC time is UNRUN (`date -u` was denied in the 1005 phase and has not been retried) |
| Review | [final-2026-10-27T1205Z-collected.md](../../../evidence/PL-1/final-2026-10-27T1205Z-collected.md), the independent review of the 1132Z phase, kept verbatim. Codex accepted it (40/40 on Node v22.23.1; C0/H0/M0) |
| Lane | S1 Platform. Files written in this phase: <br>- `scripts/ci/workflow-text.mjs` and `scripts/ci/ci-guard.test.mjs`; <br>- `docs/evidence/PL-1/review-1205-corrections.md` (new); <br>- this handoff and the checkpoint. <br>**Not edited:** `workflow-guard.mjs`, `workflow-guard.test.mjs` (L5), `backend-ci*.mjs`, all three workflows, dependencies, QA-9's files and every raw final |
| Git | **Nothing committed or staged**, by instruction. `HEAD` = local `main` = `c8a5d57c3a0999760ad21fd1aca4899ca76b5adf` (executed). No tracked file changed (`git status`, executed). `package.json`, `status.json`, GOALS and ACCEPTANCE are untouched |
| Full results | [review-1205-corrections.md](../../../evidence/PL-1/review-1205-corrections.md). Earlier phases: [1102](../../../evidence/PL-1/review-1102-corrections.md), [1005](../../../evidence/PL-1/review-1005-corrections.md), [0905](../../../evidence/PL-1/review-0905-corrections.md), [0705](../../../evidence/PL-1/review-0705-corrections.md), [0535](../../../evidence/PL-1/review-0535-corrections.md) |

## Done when

| Box (verbatim) | Met | Evidence |
|---|---|---|
| A green run of both CI jobs on `main`'s head is linked in the tracker | **No** | Needs the owner-authorised push. Every required job (`check`, `backend`, `ci-guard`) must conclude `success`, not `skipped`, on one head. After protection, the proof is the post-merge **push** run ([procedure §2](../../../evidence/PL-1/hosted-proof-procedure.md#2-box-1-a-green-run-of-every-required-job-on-mains-head)) |
| A deliberately failing check on a branch is shown to block merging (run linked) | **No** | Needs box 3 with no bypass, then the probe pull request captured after Ready for review, with `isDraft:false` and `BLOCKED` ([§4](../../../evidence/PL-1/hosted-proof-procedure.md#4-box-2-a-deliberately-failing-check-blocks-merging)). Optional §4b proves the skip design |
| Branch protection with the required checks is on (owner; capture in `docs/evidence/PL-1/`) | **No** | Owner. Requires `check`, `backend` and `ci-guard`, each **sourced from GitHub Actions** (the `app_id` or `integration_id` matching `check-sources.json`), up to date, no force push or deletion, and **no bypass** ([§3](../../../evidence/PL-1/hosted-proof-procedure.md#3-box-3-branch-protection-on-main-owner)) |

## Acceptance evidence

PL-1 is in no `ACCEPTANCE.md` row. No row is written and none is owed.

## Gates (this phase)

| Gate | Command | Result |
|---|---|---|
| Runtime | `rtk proxy node --version` | `v22.23.1` (executed) |
| RED, tests first | `rtk proxy node --test --test-name-pattern="review 1005 M1\|review 1102" scripts/ci/ci-guard.test.mjs`, reader unchanged | `# tests 5`, `# pass 2`, `# fail 3` (executed). Tests 28 and 35 got the old wording; test 34 failed; tests 29 and 30 passed |
| RED detail | `rtk proxy node --test --test-name-pattern="review 1102 L2" scripts/ci/ci-guard.test.mjs`, reader unchanged | `# tests 1`, `# fail 1` (executed). Only test 34's two accepted fixtures failed (8 + 1 value refusals). All 8 refusal fixtures passed, as pins |
| GREEN, focused | The RED command, after the change | `# tests 5`, `# pass 5`, `# fail 0` (executed) |
| GREEN, all `scripts/ci` tests, run once | `rtk proxy node --test scripts/ci/*.test.mjs` (full output) | `1..42`, `# tests 42`, `# pass 42`, `# fail 0`, `# cancelled 0`, `# skipped 0` (executed). Test 33 runs the guard command on the real repository files |
| After two layout-only test edits | `rtk proxy node --check scripts/ci/ci-guard.test.mjs`; `rtk proxy node --test --test-name-pattern="PL1-D" scripts/ci/ci-guard.test.mjs` | Parses; `# tests 2`, `# pass 2` (executed). The full suite was not re-run |
| Working tree | `rtk proxy git status --short --untracked-files=all`; `rtk proxy git rev-parse HEAD main` | No tracked change. 28 untracked paths before this phase's new record. `HEAD` = `main` = `c8a5d57c3a09…` (executed) |
| Hashes | — | **UNRUN.** Not authorised; `shasum` was denied in an earlier cycle and has not been retried |
| Prettier 3.6.2 `--check` | — | **UNRUN** (not authorised). Laid out by hand at width 100 with single quotes; not proof |
| YAML parse | — | **UNRUN**, by instruction. D1's safety argument is from the YAML 1.2 grammar, by reading |
| Mutants outside the tests, `pnpm check`, `pnpm install`, `pnpm backend:test`, Docker, Supabase, database, network, hosted | — | **UNRUN**, by instruction |
| Denied this phase | — | Nothing. No listing, Glob or other denied command was tried |

## Inherited and used (not re-run)

| From | Claim | Held? |
|---|---|---|
| Earlier phases | The entry gate: QA-1 is Done, and the live board has PL-1 `claimed` by Codex | Not re-checked (no `status.mjs` run) |
| Review 1205 | 40/40 on Node v22.23.1; the test modules' side effects inspected | 40/40 superseded by this phase's 42/42. The side-effect inspection is inherited, partly re-read here |
| 0905 phase | Workflow and finals hashes | Inherited; not re-checked (hashes UNRUN) |
| Phase 1 | 29 external mutants, the Prettier pass, the YAML parse of an older `backend-ci.yml` | **Stale** (F6) |

## Mutation checks

In-test only, written first. Details are in [review-1205-corrections.md](../../../evidence/PL-1/review-1205-corrections.md) §1.2 to §1.4.

- **D1, accepted (test 34), RED first.**
  - Two realistic run blocks after `pnpm check`, one under `run: | # comment` and one under `run: >-`. They hold a blank line, a shell comment, and a heredoc whose `label: |` is followed by a `[` line after `EOF`.
  - A fixed-text folded concurrency group.
  - The old reader refused 9 lines in them.
- **D1, refused (test 34), regression pins.** Each passes on both readers; the mutant each pins was traced, not run:
  - an open name at column 8 after `- run: |` pins the key column taken after `- `;
  - a comment at column 8, then a deeper open name, pins comment lines ending a body;
  - the next step's open name pins a body that ends;
  - `cancel-in-progress: "true` after a `group: |` body pins the `<=`;
  - U+0085, a tab and a bare CR in a body pin the character checks;
  - `# ${{ … }}` in a body pins the 1102 check.
- **D2 (test 35), RED first.**
  - Four value cases across `keyProblems` and `readStep` (step keys and `with:` inputs).
  - Two not-a-plain-key controls. One of them, `run:node …`, pins `PLAIN_KEY` against the looser `/^[A-Za-z0-9_-]+:/`.
- **L-2 (test 28):** `? "mobile-…` pins `?` in `INDICATORS` (traced).
- **L-1:** the coupling is removed. Robustness to a changed QA-9 group was traced, not executed (QA-9's file may not be edited).

## Review findings left open

- **Low · L5 (U+2028 at `workflow-guard.test.mjs:368`):** still deferred. No writer, formatter or hash was tried.
- **Low · PL1-D3 (new, optional, test-only):** tests 24, 27, 28 and 29 still anchor on QA-9 text the guard does not pin (`EXPO_CHECK`, `export:web`, `timeout-minutes: 15`). This is the same kind of coupling as L-1, outside this phase's scope. It fails loudly, not silently.
- **No sub-agent review** (forbidden by the brief). A fresh independent review is required next.

## Self-review (in place of the three sub-agents)

- **Correctness.**
  - The body is a superset of YAML's: YAML puts content at least one column deeper than the key and ends it on the first non-empty line shallower than the content.
  - A line this scan keeps in the body but YAML does not is either a trailing comment or a YAML error, which GitHub refuses to run.
  - No header is looked for inside a body. A header the scan does not recognise leaves its body value-checked, which fails closed.
  - In `backend-ci.yml` and `ci-guard.yml`, the structural readers still refuse any block scalar. In `mobile-ci.yml`, an accepted body can sit only under a step's `run:` or a top-level `concurrency` value.
- **Security.**
  - The guard is looser only on block-body lines, and only for the value-shape check.
  - `forbiddenProblems`, `definitionProblems`, the `${{` run rule, step 2's exact comparison, the character checks and the comment-expression check all still read every body line.
  - The new messages reuse `show()`, so no workflow text can start a workflow command.
- **Privacy.** PL-1 reads and writes no member, gym or health data, and adds no staff access, consent-gated or otherwise. PRD §16.1 and ADR-003 hold: gym staff never read or write private health data, whatever the consent. That override stays until QA-2 is integrated and the launching checkout is corrected.
- **TDD.**
  - Tests 34 and 35, and test 28's wording, were RED first.
  - The refusal fixtures and the `? ` case are regression pins that passed first; the mutants they pin were traced, not run.
  - Two layout-only test edits followed the single full run and are disclosed.

## Residual risks (accepted or routed)

1. **Text, not YAML.** D1's safety rests on reading the YAML 1.2 grammar and on GitHub refusing a file it cannot parse. No parser has run.
2. **`readStep` ignores comment lines; the line scan does not.** A `run:` block interrupted by a comment at or above column 8 is a YAML error, so GitHub runs nothing. Step 2's exact comparison is unchanged.
3. **Anchors, aliases and tags** are refused at the start of a value or line. Inside a closed one-line flow they are kept as text (review 1102 L3).
4. **A comment line quoting an expression** is refused even outside a block. This fails closed, by design.
5. **Pin bumps need the guard** (`ACTION`), in one reviewed diff. **Trusted files (F2)**, and coordinated edits to the guard and the workflows together, are left to review.
6. **PL1-D3:** the test anchors on QA-9 text (above).

## Left undone, and why

- **All three boxes:** they need outward actions. Next:
  1. a fresh independent review of this phase's diff;
  2. if Codex allows them: Prettier, a YAML parse, the hashes and the L5 writer;
  3. a commit with `PL-1` in the subject, then integration;
  4. then, owner-authorised: the pre-flight (F4 first), box 1, box 3, box 2, optional §4b, and the post-merge proof.
- **QA-9 R17** ("PL-1, CI wiring only") is still undefined. **QA-9 R2** stays allowed after `pnpm check`, now with ordinary multi-line `run: |` scripts too.

## Found for other goals

| For | Finding |
|---|---|
| QA-9 (advised) | **Updated.** Script lines in a `run: \|` or `run: >` block may now start with `[`, `{`, `!`, `&`, `*` or a quote, or hold `a: 'b'`; PL1-D1 is closed. Still refused:<br>- a comment line holding `${{` anywhere in the three workflows;<br>- `${{` in any `run` (`${VAR}` is fine);<br>- outside a block body, an open quote or flow on its line, and an anchor, alias or tag at the start of a value or line;<br>- `GITHUB_ENV`/`PATH`/`OUTPUT`, `\|\| true`, `set +e`, `secrets`, `continue-on-error`, `self-hosted` |
| QA-9 (joint) | Unchanged: changes to steps up to and including `pnpm check`, to an action commit (`ACTION`), to `runs-on`, or to a `check` timeout above 15 minutes need a matching `workflow-guard.mjs` change in the same diff |
| QA-9 (joint) | `mobile-ci.yml`'s concurrency `mobile-${{ github.ref }}` with `cancel-in-progress: true` cancels push runs on `main`. Suggest the per-push `run_id` group. PL-1's tests no longer depend on that line (L-1) |
| QA-9 (joint) | Have `ci-guard` also run QA-9's `wiringProblems` from outside `check` (needs a command-line entry) |
| MB-1 / S8 | Nothing pins the root `backend:test` script. Pin it from `ci-guard` after MB-1's script changes land |
| `.npmrc` / root config owner | F2: `.npmrc` `node-options` reaches both required jobs. Consider a review-time check, or CODEOWNERS once a second maintainer exists (M2) |
| G16.api (S2), G21.api, G23 | AC09's staff and private-health cases beyond `verify-gym.mjs:51` |
| PL-2 | A new workflow file must extend `workflow-guard.mjs` (inventory, and `REQUIRED_CHECKS`/`GUARD_RUNNERS` if it adds a required job) in the same diff. A new action needs an `ACTION` entry. Outside block bodies its YAML may not start a value or line with an anchor, alias or tag, or leave a quote or flow open on its line. It may hold no `${{` on a comment line |
| `packages/domain` owner | AR-1's `.gitattributes` rule `packages/domain/contracts/*.json -text` |
| S2 | `verify-freeze-projection.mjs:12` hard-codes `supabase_db_fitlog_rebuild_20261017` |

## Requests for other lanes' files

- **Tracker decision log (shared):** record decisions 1 to 18 below, as Codex's under AUTH-01.
- **Root `package.json` (shared), optional:** `node --test scripts/ci/*.test.mjs` in a local gate, as a joint QA-9 change.
- **`scripts/backend/check-sql-sources.test.mjs` (AR-1/S8), optional:** pass `CI` and `FITLOG_BASE_REF` to test 18's child.

## Decisions (Codex, under the AUTH-01 delegation; for the tracker log)

1. A separate `backend-ci.yml`, so QA-9's pin of `mobile-ci.yml` stays intact.
2. AR-1 L1 is fixed by `local-main` in the workflow, not by editing another lane's test.
3. Required checks: `check`, `backend` and `ci-guard`.
4. H1: a separate required `ci-guard` workflow and a guard over all three workflows and the folder, run by `backend` and `ci-guard`.
5. No workflow file other than the three; a new one needs a reviewed guard change.
6. Concurrency: each push has its own `run_id` group; superseded pull-request runs are cancelled.
7. Branch protection means integration through pull requests. Box 1's proof is the post-merge push run.
8. No bypass is mandatory. A wanted bypass leaves boxes 2 and 3 unmet.
9. M2 / QA-9 R6: no enforced second-person review while there is one maintainer. This is a delegated decision, not an owner review. Add CODEOWNERS and required review once a second maintainer exists.
10. `db lint` is a gate. `supabase start`'s stdout is discarded.
11. `FITLOG_CONTRACT_BASELINE` stays in the backend job, for parity only.
12. **(0705, amended 0905)** F1 by the preferred route: `mobile-ci.yml`'s steps up to and including `pnpm check` are pinned exactly in PL-1's guard. Further unconditional steps are allowed only after it. The guard's scope is stated as workflow files only (F2). *Corrected:* the 0705 text said action SHAs were held through the other two workflows; they weren't (review 0905 M1). See decision 13.
13. **(0905 M1)** Each action is pinned in the guard as a full `owner/repo@sha` (`ACTION`), and all three workflows are compared with it, from the parsed step. A pin bump needs a guard change in the same diff.
14. **(0905 L1)** `check` runs on `ubuntu-latest` with a timeout from 1 to 15 minutes, held by the guard rather than routed to QA-9.
15. **(1005 M1, corrected 1102 L3, scoped by decision 17)** The reader refuses any value YAML could carry onto later lines:
    - a quote, `[` or `{` must close on its own line, with at most a comment after it;
    - flow values are one level only;
    - a value or line that **starts** with an anchor, alias or tag is refused. Inside a closed one-line flow they are kept as text.

    This is checked where values are parsed and on every meaningful line outside a block scalar's body, so the keys compared as text, or not read at all, are covered too.
16. **(1102 M1)** Any comment line holding `${{` is refused, in all three workflows, in a block or not.
17. **(New, PL1-D1 / 1102 L2)** A block scalar's body is script or text, so the line scan skips only its value check there:
    - the body starts after a `key: |` or `key: >` line read outside a body;
    - it ends at the first nonblank line, comment lines included, indented no deeper than that key's column, which is taken after any `- `, `? ` or `: `;
    - no header is looked for inside a body;
    - every other line rule still reads body lines.
18. **(New, PL1-D2 / 1102 L4)** A refused key line is named as either a plain key with a value the guard does not read, or not a plain key. The test is `entry`'s own `PLAIN_KEY`, and tests anchor fixtures on text the guard pins, not on QA-9's free text (L-1).

## Traps hit

- The first focused RED output was truncated in the middle and hid test 34's detail. It was re-run alone, still before any code change, and not truncated.
- Two layout-only test edits came after the single full run. Only `node --check` and the two edited tests were re-run, and this is disclosed rather than re-running the whole suite.
- A template literal can't hold `${{` without escaping. Test 34's comment-expression fixture uses `\${{`, and the other fixed text uses single-quoted strings.
- New tests were appended at the end of `ci-guard.test.mjs`, so tests 22 to 33 keep the numbers the records cite. `workflow-guard.test.mjs` is now 36 to 42.
