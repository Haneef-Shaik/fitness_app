# Independent reviewer final

Session: `aab700d3-e7ca-4d66-8f25-169ac16ec95b`

I found **one medium and one low finding, and no critical or high ones.** The medium is in the records only; phase 3C's code and test 17 are sound. My runs below are this review's own, on Node 22.23.1.

## Findings

**1. Medium (records): the handoff names the wrong approver for the hosted push**
- **Location:**
  - `docs/plan/runs/QA-9/handoff.md:18` and `:74`
  - `docs/plan/runs/QA-9/checkpoint.md:30`, `:755`, `:773` and `:792`
  - `docs/evidence/QA-9/ratchet-enforcement.md:418` (R10) and `:662`
- **Defect:** these say the box-3 push and draft pull request need "Codex's specific authorisation". The rules say otherwise:
  - docs/23 §6 (`23-MASTER-PLAN.md:136-137`): nothing is pushed unless the owner allows it, through config `"push": true` or by hand.
  - `INBOX.md:240`: pushing is an owner gate, and the repository is public.
  - AUTH-01 (`09-PROJECT-TRACKER.md:61`) delegates routine product, engineering and vendor-technical choices and final technical sign-off. It does not delegate publication.
- **Failure scenario:** a later session follows `checkpoint.md:30`, gets Codex's go-ahead, and pushes. The QA-9 branch and every unpushed local-`main` commit since `c8f6d7f` become public without the owner's specific approval. That cannot be undone.
- **Fix:** in those lines, say the push needs the owner's specific approval under docs/23 §6, and that AUTH-01 and existing approvals don't cover it. Leave the two persisted reviews (`reviewer-final…:114`, `implementer-final…:19`) unchanged; they are verbatim records.

**2. Low (QA-9, R3): domain line coverage landed exactly on the threshold again**
- **Location:** the domain coverage threshold of 91.42 in `packages/domain/package.json`.
- **Evidence:** my `pnpm check` printed `Exact lines coverage 533/583 (91.4237%) meets the threshold of 91.42%`. That makes two runs in a row at exactly 533 (the implementer's run 19, then mine), and 6 of 36 recorded runs. 532 has never been seen.
- **Failure scenario:** one line fewer fails `pnpm check`, at integration or on the hosted run, with no code change. It fails safe: a false failure, never a false pass.
- **Fix:** no threshold edit. Before relying on a single green run, do the R3 per-line flip list R3 assigns to QA-9's next phase.

## The phase-3C fixes

- **Test 17 and the commit-tree fixture are sound.**
  - The fixture checks the merge shape before testing the check: first parent is the baseline, second is the change, the fork point is the baseline, and HEAD is detached.
  - It then asserts the exact base, label and nine files, the files left unchecked, no problems, and the command run as root `check` runs it.
  - The earlier goal's unformatted files make any over-selection fail twice.
- **The `--first-parent` mutation:** by Git's first-parent walk, only the merge itself is listed. The base then becomes the baseline and the assertion at line 688 fails, while the linear-history tests 1–16 are unaffected. The patch's hunk (`@@ -159,6 +159,7 @@`) matches the current file. **I did not run the mutation**, because edits were forbidden. The "kills only test 17" result (runs 8 and 13) is the implementer's claim.
- **`--topo-order`:** I agree with the self-review that test 17 can't catch it being dropped. It's already recorded and doesn't block anything.
- **Code restore:**
  - No `first-parent` remains anywhere in `scripts/`.
  - The `rev-list` call and the line spans match what the final review cited (`touched-format.mjs:34-40`, `135-189`, `157-171`), and test 9 is still at lines 357–407.
  - All 97 tests and Prettier pass.
  - Byte-for-byte restore can't be proven, since no hash was taken before the mutation. That limit is already recorded.
- **Gate rows:**
  - `handoff.md:35-36` now say `pnpm backend:test` (the backend isolation suites) and both JS exports are required by docs/23 §7, deferred, and not waived.
  - No "not applicable" or "not required" wording remains, apart from text describing the old finding.
  - §7 step 4 now requires the format label and the 18-file count.

## Done-when boxes

| Box | State |
|---|---|
| 1. Mobile coverage over all of `src/` | Met locally, uncommitted, not accepted. My run measured 12.23 / 10.57 / 10.23 / 18.67, and ratchet tests 4 and 11–14 pass |
| 2. Domain threshold and RPC inventory | Met locally, uncommitted, not accepted. My run measured 533/583, 272/313 and 106/117. I checked the inventory against the migrations myself: there are exactly 9 `public` functions, the 9 listed |
| 3. CI fails on a lint error, with a run linked | **Not met.** No hosted run exists |

## What I ran, and what are claims

| Run by this review (Node 22.23.1) | Result |
|---|---|
| `rtk proxy node --version` | v22.23.1 |
| `rtk proxy node --test scripts/quality/*.test.mjs` | 97 of 97 pass; test 81 is test 17 |
| `rtk proxy pnpm check` | Exit 0, 282 tests (37 + 97 + 126 + 22). The format step reports 1 file and the uncommitted-state label. The guard says the floor is not anchored |
| `rtk proxy pnpm exec prettier --check` on the 18 files, each named | All match |

These are the first independent runs of phase 3C. The mutation results, runs 1–21 and the claim that only test 17's lines were re-wrapped are the implementer's word.

**Denied, not worked around:** `rtk proxy wc -l`, `rtk proxy git --no-optional-locks diff --stat` and `rtk proxy grep -n`. I chose not to run plain `git diff` or `git status`, because they can rewrite the index's cached file data. So I didn't independently confirm the six tracked files' line counts. I read the root `package.json` and `jest.config.cjs` directly instead.

## Still open, confirmed
- The staged or committed boundary proof (18 files, and a label naming the QA-9 commit) is still pending.
- `pnpm backend:test` and both JS exports must pass before integration.
- The floor must be compared against the evidence at the exact `main` commit.
- The owner's specific push approval for box 3 (see finding 1).
- QA-9 is not Done.

## Recommended next phase
Fix finding 1 first. It's a records-only edit with no code change. Then:

1. Stage only the QA-9 paths, by name, not with `-A`:
   - `.prettierrc.json`, `package.json` and `pnpm-lock.yaml`
   - `apps/mobile/{coverage-thresholds.json,jest.config.cjs,package.json}` and `packages/domain/package.json`
   - `docs/23-MASTER-PLAN.md`, `docs/evidence/QA-9/` and `docs/plan/runs/QA-9/`
   - `scripts/quality/`
2. Run `pnpm check`. Expect 18 files and `from HEAD@2a95726912c6: … not committed yet`. By my count, 25 files should be listed as not JavaScript or TypeScript, plus any review file you add.
3. Commit as one commit with QA-9 in the subject. Run `pnpm check` and expect `Base: main@2a95726912c6, from <commit>, which adds scripts/quality/touched-format.mjs`, with 18 files.
4. Rebase onto local `main`; don't merge it in. Run `pnpm check` again and record the domain line count as an R3 sample.
5. Before integration:
   - `pnpm install --frozen-lockfile`;
   - `pnpm backend:test`, under the database rules that apply then;
   - the iOS and Android JS export;
   - `git show <commit>:scripts/quality/coverage-floor.json`, compared with `coverage-baseline.md` §5.
