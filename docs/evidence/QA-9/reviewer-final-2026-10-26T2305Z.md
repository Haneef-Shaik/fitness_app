## Verdict on QA-9 phases 3 and 3B

**No critical, high or medium findings.** I found three low findings: one a test gap, two in the records. My runs on Node 22.23.1 are the first independent runs of phases 3 and 3B on record: the 96 quality tests pass, and `pnpm check` passes with 281 tests.

**QA-9 is not Done.** Box 3's hosted run doesn't exist, the floor is not anchored, nothing is committed, and the committed-state format path has never run on this repository.

## Findings, most severe first

**1. Low: the handoff skips two required gates on a false premise**
- **Location:** `docs/plan/runs/QA-9/handoff.md:30-31`, against the rule at `docs/23-MASTER-PLAN.md:152-154`.
- **Defect:** the handoff says `backend:test` isn't needed because there is "no `packages/domain/` change", and the export isn't needed because "the only `apps/mobile/` change is `jest.config.cjs`". Both premises are wrong:
  - `packages/domain/package.json` changed (2 lines);
  - `apps/mobile/package.json` changed (3 lines);
  - `apps/mobile/coverage-thresholds.json` is new.
- **Failure scenario:** the integrator reads the gates table and skips two gates that docs/23 requires for this diff, and the skip is never recorded as a deviation. The behavioural risk is nil. `scripts/backend/` reads domain contracts and fixtures, not domain scripts, and the export doesn't read test config. CI also runs the native export.
- **Fix:** restate both rows as "required by docs/23 for this diff, not run because the brief forbade the database; deferred to the integrator or the hosted run". Alternatively, get Codex's explicit waiver.

**2. Low: no test covers the commit shape the hosted run will actually see**
- **Location:** `scripts/quality/touched-format.test.mjs:357-407` (test 9) and `scripts/quality/touched-format.mjs:157-171`.
- **Defect:** every rule-start fixture uses linear history. On a pull request, GitHub checks out a test merge commit whose first parent is the baseline, and that baseline lacks `RULE`.
- **Why the code is still right:** `--full-history` lists that merge, because it differs from its first parent. `--reverse --topo-order` still puts the adding commit first, so the base becomes that commit's parent.
- **Failure scenario:** a later edit that adds `--first-parent` (or otherwise changes the history walk) would make the first hosted run throw "no start", or demand the 164 earlier files. Either way the box-3 run fails before ESLint and is wasted, and nothing local catches it.
- **Fix:** add a test 17 at the end of the file. Build a detached merge with `git commit-tree HEAD^{tree} -p main -p work`, run it with `GITHUB_ACTIONS=true` and the baseline set to `main`, and assert the base and selected files. Add `--first-parent` as the mutation.

**3. Low: the box-3 log checklist in the evidence omits the format step**
- **Location:** `docs/evidence/QA-9/ratchet-enforcement.md:664` (§7 "Box 3", step 4).
- **Defect:** the step lists the baseline step, guard, typecheck and the lint failure, but not the format step that phase 3 put between the guard and typecheck. `checkpoint.md:643` does include it.
- **Failure scenario:** a verifier following §7 alone links the run without confirming the format label `Base: FITLOG_CONTRACT_BASELINE@…, from <QA-9 commit>, which adds scripts/quality/touched-format.mjs`.
- **Fix:** add that line to step 4.

## What I ran
| Command (Node 22.23.1) | Result |
|---|---|
| `rtk proxy node --version` | `v22.23.1` |
| `rtk proxy node --test scripts/quality/*.test.mjs` | 96 tests, 96 pass, 0 fail |
| `rtk proxy pnpm check` | Every step ran through to plan build, with no failure line: **281 tests** (domain 37, quality 96, mobile 126, plan 22) |
| `rtk proxy git status --short` | The same 11 paths the checkpoint lists |
| `rtk proxy git diff --stat` | `jest.config.cjs` 10, docs/23 106, mobile `package.json` 3, root `package.json` 3, domain `package.json` 2, lockfile 10 |
| `rtk proxy git diff` (lockfile, root `package.json`, `jest.config.cjs`, docs/23 `-U0`) | See "Checked and sound" |
| `rtk proxy git diff --stat 2a95726 c8a5d57` | 25 files, all under `docs/plan/` or `docs/evidence/AR-1/`; no JavaScript, TypeScript, source or docs/23 |

What `pnpm check` printed:
- **Format step:** `the 1 touched … file … Base: main@2a95726912c6, from HEAD@2a95726912c6: scripts/quality/touched-format.mjs is not committed yet`.
- **Guard:** `not anchored`.
- **Domain:** lines 535/583, branches 272/313, functions 106/117. 535 is a new R3 sample, inside the known 533–538 range.
- **Mobile:** 12.23 / 10.57 / 10.23 / 18.67.
- No Jest validation warning appeared.

**Denied and not worked around:**
- my first two bare `git` commands;
- `rtk proxy pnpm exec prettier --check …`;
- `rtk proxy git merge-base …`. The reflog answered that question instead: lines 74–91 are commits and fast-forwards only, so `origin/main` (`c8f6d7f`) is an ancestor of `2a95726`.

I never touched `/tmp/fitlog-mb1-replay-20261026`, the database, the network or any sub-agent, and I changed no file.

## Checked and sound
- **Rule start and `RULE` from the module's own path** (`touched-format.mjs:34-40,135-189`):
  - `RULE` is computed from where the module runs, so it can't drift from the file's real path.
  - With no start found, CI throws. Locally it throws once `HEAD` holds the check, and a failing `ls-tree` throws.
  - Tests 13–16 executed, and test 14 is the previous review's rename scenario run end to end.
  - On real Git, the fallback to `HEAD` can only happen while the check is uncommitted.
- **Gate wiring:**
  - `gate-wiring.mjs:42` matches root `check` exactly, and test 13 ties `RULE` to that command.
  - Gate-wiring test 2 drops the format step and fails as it should.
  - `mobile-ci.yml` is unchanged and still uses `fetch-depth: 0` with the event-derived baseline.
- **`prettierPath: null`:**
  - The installed `jest-validate` accepts `null`, and `jest-config`'s `normalize.js:696-710` keeps it as `null`.
  - Test 32 exercises the real `saveInlineSnapshots` both ways.
  - Ratchet test 9's three new cases are real edits: `withEdit` asserts each one changes the file.
- **Coverage floor and scope:** unchanged apart from the one allowlist key. Missing, null or non-object inputs fail closed, and narrowing scope or adding an exclusion fails (ratchet tests 1–31 executed).
- **Prettier 3.6.2 pin:**
  - Root `devDependencies` has `"prettier": "3.6.2"`, exact.
  - The lockfile diff is exactly 10 added lines: the importer entry, the package with integrity `sha512-I7AIg5…hCuQ==`, and the snapshot. No other entry moved and no peer depends on Prettier.
  - The installed package is 3.6.2. I couldn't check the integrity against the registry (network was forbidden).
- **Config isolation:** outside `node_modules` the only Prettier-related config is `.prettierrc.json`, which equals `PRETTIER_OPTIONS`. So the writer's CLI `prettier --check` resolves the same options as the API check.
- **Box-3 probe:** `jest.config.cjs` is linted, M12 shows the probe fails `lint`, and the screen probe is struck in both places.
- **PRD 16.1 / frozen003:** nothing in the diff touches source, `supabase/`, contracts, or any staff or health data path.

## Previous review's findings
**Closed:**
- **Finding 1 (medium):** fixed, and verified by reading and by executed tests 13–16.
- **Finding 2:** fixed with `prettierPath: null` (test 32 executed, no validation warning).
- **Finding 3:** recorded as R18(h). It is empty today: a rebase or merge of `c8a5d57` brings in no JavaScript or TypeScript.
- **Finding 4:** the records are corrected (`ratchet-enforcement.md:10,663`, `checkpoint.md:642`).
- **Handoff:41 "not re-checked":** now checked. Local `main` is exactly 20 commits past `2a95726`, all docs.

**Open:**
- my findings 1–3;
- residuals R1–R6 and R8–R18;
- box 3's hosted run;
- anchoring the floor at the exact merge commit;
- R3's per-line flip list;
- whether the phase-3 rewrite was formatting only. That can't be proved: the pre-format bytes were never hashed or committed. Passing tests only show behaviour held for the paths they cover.

## What stays unproved before the commit
- Today the format step selects only `jest.config.cjs`, because the 17 quality scripts are untracked. **No gate run has ever judged those 17 scripts on this repository.** The only evidence they're formatted is the writer's CLI check (run 28); mine was denied.
- The committed-state path has run only in scratch fixtures, never here. That is: base `2a95726` lacks `RULE`, `rev-list` finds the QA-9 commit, and the label reads "from <QA-9 commit>, which adds…". The expected selection, 18 files (the 17 scripts plus `jest.config.cjs`), has not been observed.
- **Two ways to close it**, both needing Codex because they change the index or history:
  - Stage the QA-9 paths and run `pnpm check`. The base stays `HEAD`, but staged new files are selected, as `scripts/staged.cjs` is in touched-format test 2.
  - Or commit, then run `pnpm check` and confirm the label and the 18-file count.
- The hosted shape (a pull request's test merge commit) has never run anywhere.

## Done-when boxes
| Box | State |
|---|---|
| 1. Mobile coverage from all of `src/` at the measured thresholds; lowering one fails | Met locally and uncommitted. I independently ran the thresholds and the lowering tests (4, 11, 13, 14). Not accepted |
| 2. Domain coverage has a threshold; the RPC inventory is complete | Domain threshold met locally and executed. I didn't re-check the inventory's completeness. Not accepted |
| 3. CI fails on a lint error (run linked); the rule is in docs/23 §9 | Rule present, and the diff is confined to §9 rule 3. **No hosted run, so not met** |

## Next bounded phase
1. Fix findings 1 and 3 in the records, and optionally add finding 2's test 17.
2. Codex commits, ideally after a stage-and-check run, then runs `pnpm check` and confirms the label and the 18 files.
3. Rebase onto `c8a5d57`. It should be clean: those commits are docs-only, so the selection and coverage don't change. Run `pnpm check` again.
4. The box-3 draft pull request needs Codex's specific authorisation. The pushed branch will also carry every unpushed local-`main` commit since `c8f6d7f`, so that publication is part of the decision.
5. At integration, compare the floor at the exact commit with the evidence's §5; R3 and R9 continue as assigned.
