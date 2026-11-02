# Checkpoint — PL-1 · Hosted CI green and main protected

| Field | Value |
|---|---|
| Attempt | 1: implementation, then the review 0535, 0705, 0905, 1005 and 1102 corrections, then this phase: PL1-D1, PL1-D2 and review 1205's L-1 and L-2, in one bounded test-first phase. The UTC time is UNRUN: `date -u` was denied in the 1005 phase and has not been retried |
| Worktree | `/Users/Adya/.codex/worktrees/fitlog-pl1-ci/fitness_app`, branch `codex/fitlog-pl1-ci`, on `main` `c8a5d57` |
| Lane | S1 Platform: `.github/workflows/backend-ci.yml`, `.github/workflows/ci-guard.yml`, `scripts/ci/*`, PL-1 docs and evidence |
| State | **PL1-D1 / PL1-D2 / L-1 / L-2 phase complete.** D1 and D2 are fixed test-first in `workflow-text.mjs`. L-1 and L-2 are fixed in `ci-guard.test.mjs`. 42/42 tests pass. L5 (U+2028) stays deferred. 0 of 3 boxes met; all three need outward actions. Nothing committed or staged, by instruction |
| Review file | `final-2026-10-27T1205Z-collected.md`, the review this phase answers, kept verbatim |
| Handoff | [handoff.md](handoff.md) · results: [review-1205-corrections.md](../../../evidence/PL-1/review-1205-corrections.md) |

## Steps done in this phase

1. **Read:**
   - RTK, the instructions, `EXECUTION.md`, the PL-1 card and PRD §16.1;
   - the 1205 final in full, the checkpoint, the handoff and `review-1102-corrections.md`;
   - in full: the reader, the guard, `ci-guard.test.mjs` and the three workflows.

   The test modules' effects were checked before any run. Nothing was denied, and no Glob, listing or other denied command was tried.
2. **Tests first, in `ci-guard.test.mjs`:**
   - `editEach` takes an optional `base`;
   - `MOBILE_PERMISSIONS` and `mobileWithoutConcurrency()` are new;
   - test 28: its concurrency cases are built from fixed text (L-1), a `? ` case is added (L-2), and its two `step` strings use the D2 wording;
   - test 30: the comment and expression counts are taken across the three workflows (L-1);
   - new test 34 (D1) and test 35 (D2), appended at the end.

   **RED:** the focused run gave 5 tests, 2 pass, 3 fail (28, 34 and 35). Test 34's detail, run alone: only its two accepted fixtures failed.
3. **`workflow-text.mjs`:**
   - block-body tracking in `characterProblems`, with `lineValue` returning the key column, `INDICATORS` new, and `BLOCK_SCALAR` moved up;
   - `lineCharacterProblems` split out, unchanged;
   - `PLAIN_KEY` and `refusedEntry` for D2;
   - the comments updated.

   **Focused GREEN:** 5 of 5.
4. **Full GREEN, run once:** `rtk proxy node --test scripts/ci/*.test.mjs` gave 42 of 42 on Node v22.23.1.
5. **Two layout-only test edits after the full run** (a quote style and a ternary split), then `node --check` and the two edited tests: 2 of 2. Disclosed in the record.
6. **`git status`:** no tracked change. `HEAD` = `main` = `c8a5d57c3a09…`. Hashes, Prettier and the YAML parse are UNRUN.
7. **Docs:** the new `review-1205-corrections.md`, this checkpoint and the handoff (decisions 17 and 18).

## Deferred items

- **L5 · U+2028** at `workflow-guard.test.mjs:368`: waits for a writer Codex names. Do not retry the denied `perl`, `shasum`, `ls` or `date`.
- **PL1-D3 (new, optional, test-only).** Tests still anchor on three pieces of QA-9's `mobile-ci.yml` text that the guard does not pin, the same kind of coupling as L-1:
  - `EXPO_CHECK` in test 28;
  - `export:web` in tests 24 and 29;
  - `timeout-minutes: 15` in tests 24 and 27.

  An edit there fails loudly at the `edit` precondition. Build those fixtures from guard-pinned text in a later bounded phase.

## Resume here

1. A **fresh independent review** of the uncommitted PL-1 files, focused on this phase's diff:
   - `scripts/ci/workflow-text.mjs`: `lineValue` `:57`, `characterProblems` `:108-134`, `PLAIN_KEY` and `refusedEntry` `:137-155`;
   - `scripts/ci/ci-guard.test.mjs`: the helpers at `:47-66`, test 28's `top` and the `? ` case at `:574-685`, test 30's aggregate at `:814`, and tests 34 (`:1023`) and 35 (`:1143`).
2. **If Codex authorises them:** Prettier 3.6.2 `--check` on the six `scripts/ci/*.mjs`, a YAML parse of `backend-ci.yml` and `ci-guard.yml`, the hashes of the workflows and finals, and the L5 fix with a named writer.
3. **If clean:** Codex commits with `PL-1` in the subject, and the integrator brings it to `main`.
4. **Owner-authorised, in order:** the pre-flight (visibility, plan and allowance first), box 1, box 3 (three checks from GitHub Actions, no bypass), box 2, optional §4b, then the post-merge push proof.
5. Then `goal-verifier` on the three boxes.
