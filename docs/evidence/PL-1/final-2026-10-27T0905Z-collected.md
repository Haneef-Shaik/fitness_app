I found no Critical or High issues, one Medium and two Lows. The Medium is that the action SHAs in `mobile-ci.yml` aren't actually held: one edit to that file can swap in a different commit of an action, and both guard jobs still pass. That contradicts this phase's claim that "a changed SHA in `mobile-ci.yml` is already refused". The 35 CI tests pass (35 of 35, run once on Node v22.23.1). Both new workflow files are still unparsed by any YAML tool, and 0 of 3 hosted boxes are met. PL-1 is not Done, and I'd fix the Medium before committing.

## Findings, most severe first

### M1 · Medium: a decoy line hides a changed action SHA in `mobile-ci.yml`
- **Location:** `scripts/ci/workflow-guard.mjs:264-272` (`pinsOf`), together with `:404-406` and `:297`.
- **Defect:**
  - The steps before `pnpm check` compare each action by name only.
  - Their SHAs are held only by comparing them with the other two workflows. That comparison uses `pinsOf`, which scans the raw text of `mobile-ci.yml`, comments included, and keeps the **last** match for each action.
- **Failure scenario** (found by reading the code; I ran no mutant, as the brief forbids):
  - Change `mobile-ci.yml:49` to `      - uses: pnpm/action-setup@<X> # was uses: pnpm/action-setup@f520eceda224fe1a4aed5a2a27a194379a409996`.
  - The reader drops the trailing comment (`workflow-text.mjs:58`). The step then reads as `pnpm/action-setup@<X>`, which counts as pinned (`:389`) and matches `MOBILE_STEPS` by name.
  - `pinsOf` picks up the old SHA from the comment, so `backend-ci.yml` and `ci-guard.yml` still "agree" (`:297`). No other rule fires, and both guard jobs print their success line.
  - GitHub then runs `<X>`. If `<X>` is a commit in a fork of the action, it could install a `pnpm` that always exits 0, so `check` goes green with nothing run. GitHub is known to resolve fork commits this way; I did not verify that here.
  - The same works with the decoy on a later comment line, or as a step after `pnpm check` (allowed by design) that uses the old SHA. It also works for `actions/checkout` and `actions/setup-node`.
- **Claims this makes wrong:**
  - the guard comment at `:143`;
  - `review-0705-corrections.md:15`;
  - `handoff.md:57` and `:68`, and decision 12;
  - line 6 of the 0905 report;
  - the title of the test at `ci-guard.test.mjs:202`.

  The existing case at `ci-guard.test.mjs:493-498` covers only a plain SHA change, and it was never shown failing first.
- **Fix:**
  - Take mobile's pins from the parsed steps before `pnpm check` (steps 1, 3 and 4), not from the raw text. Alternatively, put the full `owner/repo@sha` in `MOBILE_STEPS`.
  - Optionally, also refuse any action that appears with two different SHAs in the file's non-comment lines.
  - Write three failing tests first: the same-line comment decoy, a later comment-line decoy, and a decoy step after `pnpm check`. Each must be refused by the guard job in a workflow the edit didn't touch.
  - Correct the claims listed above. Add a "corrected later" pointer for the 0905 report rather than editing that file.

### L1 · Low: `mobile-ci.yml`'s `runs-on` and `timeout-minutes` aren't checked
- **Location:** `workflow-guard.mjs:455-460`, compared with `:316-326` for the other two workflows.
- **Defect:** for `check`, only the allowed key names are checked, not their values.
- **Failure scenario:**
  - `runs-on: macos-latest` would bill the `check` job at about ten times the minutes on a private repository, which is the F4 allowance concern.
  - A custom runner label would send `check` to a self-hosted runner, if one were ever registered, without the word `self-hosted` that the guard bans.
  - Neither turns a failing check green on GitHub-hosted runners, hence Low.
- **Fix:** apply the same `ubuntu-latest` rule and timeout cap (15 minutes, as now) to `check`, with two failing tests first. Or route this to QA-9 explicitly in the handoff.

### L2 · Low, deferred: invisible U+2028 at `workflow-guard.test.mjs:368`
- I confirmed it is the only such character under `scripts/ci`, and the test still works.
- Replace it with `\u2028` in a phase where Codex authorises a writer. `perl` was denied before, and I did not retry it.

## Checked and found sound (by reading, except where noted)
- **The pinned list matches the real file.** `MOBILE_STEPS` matches `mobile-ci.yml:26-51` in order and inputs: checkout, the 12 baseline lines, setup-node, the pnpm action with no inputs, install, then `pnpm check`. Test 28 also passed against the real files.
- **Steps before `pnpm check` are refused** because they shift every later step's position.
- **Steps after `pnpm check` are allowed and can't flip the result.** `if` and `continue-on-error` are refused, and with only `contents: read` no step can post a fake `check` result.
- **The text reader is strict.** It refuses inline `{...}` mappings, anchors and merge keys, quoted keys, steps listed at the same indent as `steps:`, other indents, other block-scalar headers, tabs, stray carriage returns and non-ASCII characters. Comment or blank lines inside the baseline script are ignored, which matches bash.
- **The trusted scope (F2) is stated correctly.** M1 falls inside what the guard claims to hold, not inside the trusted scope.
- **The hosted procedure holds up on each point you asked about:**
  - Check source: the read-only `check-sources.json` capture comes before ID 15368 is trusted, and a missing or different `app_id` or `integration_id` fails.
  - Visibility, plan and allowance: read only, with a stop if the repository is private on GitHub Free or the plan can't be read, and no paid action.
  - Bypass: "no bypass" is mandatory.
  - Probe: the results are read on the pull request's head; marking it Ready for review starts no new run; and it requires `isDraft:false` with `BLOCKED`. The §4b expected message matches what `keyProblems` actually prints.
- **Privacy:** PL-1 reads no member or health data and adds no staff access, consistent with PRD §16.1 and ADR-003. The launching-checkout override wording in the handoff is consistent.

## Proof ledger
- **Executed by me:**
  - `rtk proxy node --version` gave v22.23.1.
  - `rtk proxy node --test scripts/ci/*.test.mjs`, **once**: 35 tests, 35 pass, 0 fail. Before running it I checked what the tests touch: only temp folders they delete, scratch Git repositories, and fakes for Supabase, Docker and psql.
  - `git status` before and after the run showed the same 20 untracked paths and no tracked change. `HEAD` and `main` are both `c8a5d57c3a09…`.
  - `git ls-files` confirmed the three AR-1 log files the tests read are tracked.
- **Inspected (read only):**
  - read in full: both new workflows, `mobile-ci.yml`, all six `scripts/ci` files, the checkpoint, the handoff, the 0705 and 0905 reports, the 0705 and 0535 correction records, and the hosted procedure;
  - searched only: `probes.md` and the rest of `local-verification.md` (§1–§2 read in full);
  - not read: the earlier 0505, 0535 and 0635 review reports, kept verbatim.
- **Inherited, not re-run:** the 0905 phase's failing-first run (33 of 35), the phase-1 evidence (labelled stale), and the 39 `scripts/backend` tests.
- **Not run:** Prettier, a strict YAML parse (both workflows still unparsed), any mutant including M1's, `pnpm check`, `pnpm install`, `pnpm backend:test`, Docker, Supabase, the network and anything hosted. No permission was denied, and nothing was edited, staged or committed.

## Next bounded phase
1. One offline correction phase on `codex/fitlog-pl1-ci`, tests first: fix M1, then L1 (or route it to QA-9), and correct the claims M1 makes wrong. Fix L2 only if Codex names an allowed writer.
2. If Codex authorises them: Prettier 3.6.2 `--check` on the six `.mjs` files, and one strict YAML parse of `backend-ci.yml` and `ci-guard.yml`.
3. A focused fresh review of that diff. Then a commit with `PL-1` in the subject, and integration.
4. With the owner's authorisation, in order: the pre-flight (visibility, plan and allowance first), box 1, box 3, box 2, optional §4b, the post-merge push proof, then `goal-verifier`.

```
GOAL: PL-1
BRANCH: codex/fitlog-pl1-ci
HEAD: c8a5d57 (20 PL-1 paths untracked; nothing staged or committed)
REVIEW: fresh independent, read-only (0 Critical, 0 High, 1 Medium, 2 Low)
TESTS: 35/35 on Node v22.23.1 (run once, by me)
NOT RUN: Prettier, strict YAML parse (both workflows unparsed), mutants, hosted
BOXES: 0/3 met; hosted 0/3; not Done
NEXT: offline M1 fix (tests first) + L1, then Prettier/YAML if authorised, focused review, commit, integration, owner-authorised hosted proofs
```