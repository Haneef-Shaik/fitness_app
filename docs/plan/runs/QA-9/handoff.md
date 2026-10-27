# Handoff — QA-9 · Lint, type and coverage gates that only go up        attempt 1 · `codex/qa9-quality-ratchets` · base `main@2a95726` (phase 3D: scoped stage and one local commit; results recorded after the commit)

**Outcome claimed.** Lint, types and coverage now only go up in `pnpm check`, and Prettier runs on touched files. This holds locally, on Node 22.23.1 only. Three things stay open:
- **hosted CI:** box 3's hosted run does not exist. It needs a push and a draft pull request, which need **the owner's specific approval** under docs/23 §6;
- **the floor:** it is not anchored until integration into `main`;
- **the deferred gates:** `pnpm backend:test` and the iOS and Android export, required by docs/23 §7 for this diff, must pass before integration.

So QA-9 is **not complete**, and it is not marked Done.

This handoff is written in **phase 3D**, one bounded phase under Codex (AUTH-01).
- **The review it answers:** the executed [review of phase 3C](../../../evidence/QA-9/reviewer-final-2026-10-27T0005Z.md), session `aab700d3-e7ca-4d66-8f25-169ac16ec95b`. On Node 22.23.1 it passed the 97 quality tests, `pnpm check` with **282 tests**, and Prettier `--check` of the 18 files. It found **no critical or high finding**, one medium in the records and one low (R3), and called phase 3C's code and test 17 sound.
- **Codex's phase-3D brief accepts that independent code and test review**, and makes the records correction and the local commit routine Codex decisions.
- **What phase 3D did:**
  - corrected the medium finding before staging;
  - assigned the low one to QA-9's next phase;
  - then made the scoped stage, the two `pnpm check` runs and one local commit.
- **Where the detail is:** the history, every command and every decision are in [checkpoint.md](checkpoint.md). The evidence is in [ratchet-enforcement.md](../../../evidence/QA-9/ratchet-enforcement.md), with phase 3D in §13.

## Done when

| Box | Met | Evidence |
|-----|-----|----------|
| `apps/mobile/jest.config.cjs` collects coverage from all of `src/` with thresholds at the measured values, and `pnpm check` fails when one is lowered (seen once) | **Locally. Not accepted** | `jest.config.cjs` takes its scope and thresholds from `coverage-thresholds.json`, which covers all of `src/` except `__tests__`. The thresholds are 12.23 / 10.57 / 10.23 / 18.67, as measured in phase 1. Lowering one was seen to fail in phase 2 (M1), and ratchet tests 4 and 11–14 hold it. The review of phase 3C measured the same four values independently and passed those tests. Test 12 shows the gap that stays until integration: before `main` holds the ratchet, a branch commit can lower the floor and a threshold together (R1). Phase 3D changed no scope or threshold |
| Domain coverage is measured with a threshold, and the backend inventory lists every exposed RPC with its test | **Locally. Not accepted** | Domain 91.42 / 86.90 / 90.59, enforced exactly by `exact-coverage-reporter.mjs`. The review of phase 3C measured 533/583, 272/313 and 106/117: lines **exactly on the threshold**, as in phase 3C's run 19 (R3). [rpc-test-inventory.md](../../../evidence/QA-9/rpc-test-inventory.md) lists the 9 exposed RPCs, with their gaps named in docs/23 §9 rule 3. The review checked it against the migrations itself: exactly 9 `public` functions, the 9 listed |
| CI fails on a lint error (seen once, run linked), and the ratchet rule is in docs/23 §9 | **No** | The rule is in docs/23 §9 rule 3. Locally, `pnpm check` fails on a lint error (phase 2, M12). **No hosted run exists.** It needs the box-3 draft pull request ([ratchet-enforcement.md §7](../../../evidence/QA-9/ratchet-enforcement.md#7-phase-2e-phase-2d-review-findings-and-r14)). Pushing it and opening it need **the owner's specific approval** under docs/23 §6: `"push": true` in `var/orchestrator/config.json`, or the owner pushing by hand. *(3D, phase-3C review finding 1: this row said "Codex's specific authorisation".)* AUTH-01 delegates routine technical choices and final technical sign-off to Codex, not publication, and no existing approval covers it. The repository is public. Touched-format 17 tests the commit shape that run will check out, and §7's step 4 requires the format label and 18 files in its log |

**Boxes met: 2 of 3, locally, with neither accepted.** The card's scope line, "Prettier on touched files only", is built (phase 3), corrected (phases 3B and 3C), and reviewed with execution twice (the final review of phases 3 and 3B, and the review of phase 3C).

## Acceptance evidence

| Ledger row | Run (build or environment, date) | Result | Evidence | Row written here? |
|------------|----------------------------------|--------|----------|-------------------|
| — | — | — | QA-9 appears in no row of `docs/plan/ACCEPTANCE.md` (Grep in phase 3C: no match; phase 3D didn't touch the ledger) | No |

## Gates

| Gate | Command | Result |
|------|---------|--------|
| Quality tests | `rtk proxy node --test scripts/quality/*.test.mjs` | Independently, by the review of phase 3C: 97 of 97 pass. In phase 3D they run inside `pnpm check`, results below |
| Formatting of QA-9's own files | Prettier `--check` of `jest.config.cjs` and the 17 `scripts/quality/*.mjs`, each named | Independently, by the review of phase 3C: all match. In phase 3D the format step judges the same 18 inside `pnpm check` |
| Scoped stage | `rtk proxy git add --` and the eleven named paths; then the staged list, stat and `git diff --cached --check` | Recorded after the commit (checkpoint, "Phase 3D") |
| `pnpm check`, staged, before the commit, Node 22.23.1 | `rtk proxy pnpm check` | Expected: exit 0; the format step selects **18 files**, labelled `from HEAD@2a95726912c6: scripts/quality/touched-format.mjs is not committed yet`. Recorded after the commit |
| The commit | `rtk proxy git commit`, one commit with QA-9 in the subject | Recorded after the commit |
| `pnpm check` after the commit, Node 22.23.1 | `rtk proxy pnpm check` | Expected: exit 0; 18 files; `Base: main@2a95726912c6, from <the QA-9 commit>, which adds scripts/quality/touched-format.mjs`. Recorded after the commit |
| `pnpm backend:test` | not run | **Required by docs/23 §7 for this diff**, which touches `packages/domain/` (`package.json`, 2 lines). **Deferred, not waived.** The phase-3D brief forbids the database, Supabase and Docker it needs. It must run, and pass, before integration |
| Native export, iOS and Android: `pnpm --filter @fitlog/mobile exec expo export --platform ios --platform android --output-dir .expo/export-native` | not run | **Required by docs/23 §7 for this diff**, which touches `apps/mobile/`: `package.json` (3 lines), `jest.config.cjs` (10 lines) and the new `coverage-thresholds.json`. **Deferred, not waived.** The phase-3D brief forbids exports. Both JS exports must run, and pass, before integration |

## Inherited and used

| From | Claim | Held? |
|------|-------|-------|
| The review of phase 3C | Phase 3C's code and test 17 are sound; 97 quality tests and `pnpm check` (282 tests) pass on Node 22.23.1 | Accepted by Codex's phase-3D brief. Phase 3D changed no code, so its two `pnpm check` runs are the next check of that claim (results after the commit) |
| The review of phase 3C, finding 1 | The records named Codex as the box-3 push approver; docs/23 §6, `INBOX.md:240` and AUTH-01 say the owner | **Confirmed** by reading `23-MASTER-PLAN.md:136-137`, `INBOX.md:239-240` and `09-PROJECT-TRACKER.md:61`. Corrected (ratchet-enforcement.md §13) |
| The review of phase 3C, finding 2 | Domain lines at 533 twice in a row, and 6 of 36 runs | **533 confirmed from the records; the 6 is not.** The records list at least 8 runs at 533 (phase 1's runs 3 and 4, phase 2B's two, phase 2C's, Codex's phase-2D run, phase 3C's run 19 and the review's). Phase 2's seven runs aren't listed one by one |
| The review of phase 3C | The 3C-M1 mutation kills only test 17 | Still the implementer's claim. The review didn't run the mutation, and phase 3D didn't either |

## Mutation checks

None in phase 3D: it changed no code or tests. Earlier phases' mutations (M1–M16, G1–G7, D, E, F, 2G-G1 to 2G-G12, 3-M1 to 3-M22, 3B-M1 to 3B-M9, 3C-M1) are in ratchet-enforcement.md §2 and §4–§12.

## Review findings left open

The brief forbade sub-agents, so no code-reviewer, security-reviewer or tdd-guide run happened. A self-review replaced them (checkpoint, "Phase 3D").
- **The review of phase 3C:** finding 1 (medium, records) is corrected. Finding 2 (low, R3) is assigned to QA-9's next phase. It found no critical or high finding.
- **R3:** domain lines sit exactly on the threshold in two runs in a row. The existing artifacts hold per-line domain data for phase 1's five runs only. They show at least two upward flips beyond the three known lines, and can't rule out a downward one. The per-line flip list is QA-9's next phase, with no threshold lowered. QA-10 owns flip-aware raises, and PL-1 the first Linux sample.
- Low · from phase 3C's self-review: dropping `--topo-order` was not mutation-tested, and test 17 is not claimed to catch it.
- Low · R18(h): a merge of `main` after the rule commit over-selects. It fails safe; rebase, don't merge.
- Low · R18(i): locally, while a rename of the check is uncommitted, only uncommitted edits count. CI never sees that state.
- From earlier phases: R1–R6 and R8–R18, as in ratchet-enforcement.md §3, with owners named (PL-1, QA-10, S7 Quality, review).

## Left undone, and why

- **The rebase onto local `main`** (R18(h)), then `pnpm check` again with the domain line count recorded as an R3 sample. The coordinator serialises it later, and the brief forbids it here.
- **Before integration:**
  - `pnpm install --frozen-lockfile`;
  - `pnpm backend:test`;
  - the iOS and Android export;
  - `git show <commit>:scripts/quality/coverage-floor.json`, compared with coverage-baseline.md §5 at the exact `main` commit.

  docs/23 §7 requires `backend:test` and the export for this diff. No waiver exists.
- **Box 3's hosted lint-negative run.** It needs a push and a draft pull request, which need **the owner's specific approval** under docs/23 §6. Neither AUTH-01's routine delegation nor any existing approval grants publication. The pushed branch would also carry every unpushed local-`main` commit since `c8f6d7f`, into a public repository.
- **Anchoring the floor.** It needs integration into `main`.
- **R3's per-line flip list.** Assigned to QA-9's next phase.

## Found for other goals

- **The QA-9 integrator:** rebase onto `main`; don't merge it in (R18(h)). Before integration, run `pnpm backend:test` and the iOS and Android export, which docs/23 §7 requires for this diff.
- **Any goal adding an inline snapshot:** Jest writes it without Prettier (`prettierPath: null`, pinned by the guard). Format the touched test file with `pnpm exec prettier --write`.
- **PL-1:** unchanged from earlier phases (R6, R10, R17, AR-1 L1/L4). The first hosted pull-request run, once the owner approves the push, will be the first real run of the merge shape that touched-format 17 builds.
- **The owner inbox (owner-concierge):** box 3's push and draft pull request wait on the owner's specific approval. This lane doesn't edit `INBOX.md`.

## Requests for other lanes' files

None. Phase 3D changed only QA-9's records.

## Decisions forced (for the tracker decision log)

- **The box-3 approver is the owner, not Codex** (phase-3C review finding 1). This records docs/23 §6 and the limits of AUTH-01. It doesn't create a new rule.
- **Historical phase lists were tagged, not rewritten.** Their wrong approver is struck through or tagged in place, so the history stays readable and no live line misleads. The verbatim finals are unchanged.
- **The R3 count correction went into ratchet-enforcement.md §13, not `coverage-baseline.md`,** because guard test 2 reads that file.

## Traps hit

- **Bash is allowlisted to `rtk proxy` forms.** A compound command, a bare `rtk git status` and `rtk proxy wc -l` were denied, and none was worked around.
- **Results can't be in the commit they describe.** The checks run on the staged state and on the commit, so their results are written after the commit and stay uncommitted.
