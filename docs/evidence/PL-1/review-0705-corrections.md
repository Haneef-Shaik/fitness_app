# PL-1 · Corrections for independent review 0705 (offline)

| Field | Value |
|---|---|
| Date | 27 October 2026 (resumed after the 08:04 UTC reset; the prior run f13d160d stopped at an account limit with nothing executed) |
| Review | [final-2026-10-27T0705Z.md](final-2026-10-27T0705Z.md): 0 Critical, 0 High, 1 Medium (F1), 5 Low (F2–F6), plus a minor U+2028 note. Kept verbatim, as are the earlier finals |
| Worktree | `codex/fitlog-pl1-ci`, `HEAD` = local `main` = `c8a5d57`. Nothing committed or staged, by instruction |
| Authority | Codex's brief for this phase, under the owner's AUTH-01 delegation. One bounded phase, no sub-agents |
| Executed | `rtk proxy node --version` gave `v22.23.1`. One RED run and one final run of `rtk proxy node --test scripts/ci/*.test.mjs`. Nothing else ran |
| Corrected later | Review 0905 ([final-2026-10-27T0905Z-collected.md](final-2026-10-27T0905Z-collected.md), M1) found that the F1 row's claim that action SHAs "are already held" was wrong. The old cross-check read mobile's raw text, comments included, and kept the last match, so a decoy could hide a changed SHA. The same wrong claim is on line 6 of [final-2026-10-27T0905Z.md](final-2026-10-27T0905Z.md), which is this phase's report saved under a 0905 name; that file is kept verbatim. See [review-0905-corrections.md](review-0905-corrections.md). Apart from the marked note in the F1 row, the text below is this phase's record |

## 1. Dispositions

| # | Finding | Change | Held by |
|---|---|---|---|
| F1 (Medium) | Steps before `pnpm check` in `mobile-ci.yml` weren't held, so one edit could empty or redirect `check` | **Preferred fix, guard and tests only.** `mobile-ci.yml` and QA-9 files are unchanged. New `MOBILE_STEPS` in `workflow-guard.mjs` pins every step up to and including `pnpm check`, in file order and without step names: checkout with its exact inputs, the baseline step (`shell: bash`, `run: \|` and its 12 script lines), setup-node with its exact inputs, `pnpm/action-setup` with no `with`, the install line, and `pnpm check`. Actions are compared by name. ~~Their SHAs are already held: `backend-ci.yml` and `ci-guard.yml` must pin each action at mobile's SHA.~~ **Corrected later (review 0905 M1):** they weren't held. Since then, every action in all three workflows is compared whole, as `owner/repo@sha`, against the guard's reviewed pins ([review-0905-corrections.md](review-0905-corrections.md)). Steps **after** `pnpm check` may be added if unconditional, pinned and expression-free, so QA-9's R2 step still fits. The existing rules (no `if`, `shell` only bash, allowed keys, pins, no `${{` in `run`, exactly one plain `pnpm check`) still apply to every step | New test "every mobile-ci.yml step up to and including pnpm check is exactly as reviewed (review 0705 F1)": 9 mutants, namely `npm pkg set scripts.check="echo skipped"`, checkout `ref:`, an extra pinned action before check (`node-options`), setup-node inputs, pnpm action inputs, a chained install line, the baseline `exit 0`, a folded `run: >`, and truncation. It also checks that a pinned step after check is still allowed. Plus three `mobile-ci.yml` cases in the cross-workflow test |
| F2 | The residual-risk list named only `package.json` | The general rule is now stated wherever the scope is described: **the guard judges workflow files only**. Everything the jobs run or configure (`package.json` scripts, `.npmrc` `node-options`, `pnpm-workspace.yaml`, the scripts and tests the commands run, and the guard itself) is trusted to review, which is the M2 decision while there is one maintainer. Updated in: `workflow-guard.mjs` header, the `ci-guard.yml` comment (comment lines only), procedure §5, the handoff, and the review-0535 record | Wording |
| F3 | The capture checked only context names, not the source | Procedure §3: each check's source must be **GitHub Actions**, never "any source". A new read-only capture, `check-sources.json` (`commits/<head>/check-runs`: `name`, `app.id`, `app.slug`), proves the ID from GitHub itself. The reviewer's **15368** is used only if that capture shows the same number. Classic: every `required_status_checks.checks[].app_id` must equal it. Ruleset: every `integration_id` must equal it | Procedure text |
| F4 | The pre-flight didn't check visibility or plan | Procedure §1 starts with read-only `gh api` reads of `visibility`, the owner type and `plan.name`, plus a read of Actions usage. **Private on GitHub Free, or a plan that can't be read, stops the procedure for the owner.** It explicitly forbids upgrades, spending-limit changes, overage and payment methods. The plan rules are marked as last known, to be re-read at run time | Procedure text |
| F5 | No hosted run proves the H1 design | Optional procedure §4b, not a Done-when box: `if: false` under `backend:`. Expected: `backend` skipped, `ci-guard` failing with `… jobs.backend sets if; only runs-on, timeout-minutes, env, steps are allowed`, and `BLOCKED` on the non-draft pull request. Owner-authorised; closed unmerged | Procedure text |
| F6 | The old probe evidence was stale and under-labelled | `probes.md` §2 and §3, and `local-verification.md` §3 to §5, are labelled **phase 1 only**. The docs now state that **neither current workflow has been through a YAML parser** and that **the current guard has no outside mutation evidence** (only in-test mutants) | Labels |
| U+2028 note | `workflow-guard.test.mjs:368` holds a literal U+2028 | **Not fixed.** The Edit tool could not match the invisible character, and a one-character `perl` substitution was **denied**. By the brief, that sequence stopped there, with no retry and no other writer. The test still works: the character is real and the case passes. Owner of the fix: the next phase, with an allowed writer, replacing it with ` ` |

## 2. Test-first runs (executed)

| # | Command | Result |
|---|---|---|
| 1 | Tests written first. `rtk proxy node --test scripts/ci/*.test.mjs` | **RED:** `# tests 35`, `# pass 33`, `# fail 2`. Each failed at its own assertion (below) |
| 2 | `workflow-guard.mjs` changed (`MOBILE_STEPS`, `mobileRuleProblems`, `mobilePrefixProblems`); comment-only edit to `ci-guard.yml`; then the same command, **once** | **GREEN:** `# tests 35`, `# pass 35`, `# fail 0`. Test 28 runs the guard CLI on the real repository files, so the real `mobile-ci.yml` matches `MOBILE_STEPS` |

RED, verbatim:
- Test 25 (new) `actual`:
  - `npm pkg set rewrites the check script just before it runs: no problem found`
  - the same `no problem found` for the checkout `ref`, the extra action, the setup-node inputs, the pnpm action inputs, the chained install, the baseline `exit 0` and the folded block;
  - `every step from setup-node on removed: .github/workflows/mobile-ci.yml jobs.check must run "pnpm check" in exactly one plain step with no other key (found 0)`.

  So 8 of 9 mutants passed the old guard unseen, and the 9th got only the old, weaker message.
- Test 26 (cross-workflow): `.github/workflows/mobile-ci.yml: "      - run: npm pkg set scripts.check=\"echo skipped\"\n      - run: pnpm check\n":` with `actual: ''`.

**Not shown RED:**
- The cross-workflow case for a changed checkout SHA in `mobile-ci.yml` is a characterization of existing behaviour: `backend-ci.yml` reports the pin mismatch. It ran before the failing case in the same loop and passed. *(Later: review 0905 re-targeted this case to `mobile-ci.yml`'s own step-1 refusal, and it was seen RED there; see [review-0905-corrections.md](review-0905-corrections.md) §3.)*
- The "pinned step after pnpm check stays allowed" assertion comes after the failing assertion in test 25. It was first reached in GREEN.

## 3. Not run (by instruction), and inherited

- **Not run:**
  - Prettier 3.6.2 `--check`. It was denied in review 0705 and not retried, by instruction. The layout was matched by hand at width 100, which is not proof.
  - A strict YAML parse. Not run in this phase, by instruction. Only comment lines of `ci-guard.yml` changed.
  - The phase-1 mutation script (stale, F6).
  - `pnpm check`, `pnpm install`, `pnpm backend:test`, Docker, Supabase, any database, any network call, and anything hosted.
- **Inherited, not re-run:** the review-0535 RED and GREEN runs, the phase-1 runs (stale where F6 says), the AR-1 L1 scratch-clone probe, and the 39 `scripts/backend` unit tests (unchanged files).

## 4. Residual risks (accepted or routed)

1. **Trusted files.** The F2 rule above. Review is the control, and with one maintainer that is the M2 decision.
2. **Coupling to QA-9.** Any change to `mobile-ci.yml` steps up to `pnpm check` now needs a reviewed `MOBILE_STEPS` change in the same diff. Steps after `pnpm check` don't.
3. **Text, not YAML.** The baseline script is compared line by line after trimming. YAML's block indentation, blank lines and `#` lines inside the block are not compared. Bash ignores all three, and every pinned line is self-contained (no quote or `\` spans lines).
