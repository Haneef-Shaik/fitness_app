# PL-1 · Corrections for independent review 0905 (offline)

| Field | Value |
|---|---|
| Date | 27 October 2026, from 09:09 UTC (`rtk proxy date -u`) |
| Review | [final-2026-10-27T0905Z-collected.md](final-2026-10-27T0905Z-collected.md) is the 09:05 UTC independent review: 0 Critical, 0 High, 1 Medium (M1), 2 Low (L1, L2). [final-2026-10-27T0905Z.md](final-2026-10-27T0905Z.md) is **not** that review. It is the implementer's report from the earlier 08:35 cycle (the 0705 correction phase), saved under a 0905 name. Both files are kept verbatim |
| Worktree | `codex/fitlog-pl1-ci`, `HEAD` = local `main` = `c8a5d57c3a0999760ad21fd1aca4899ca76b5adf`. Nothing committed or staged, by instruction |
| Authority | Codex's brief for this phase, under the owner's AUTH-01 delegation. One bounded phase, no sub-agents. Scope: M1 and L1 only, test-first |
| Executed | `rtk proxy date -u`, `rtk proxy node --version` (`v22.23.1`), two RED runs and one final run of the `scripts/ci` tests (§2), `rtk proxy sha256sum` before and after, `rtk proxy git status` and `rtk proxy git rev-parse HEAD main`. Nothing else ran |
| Corrected later | §4's hand layout missed one Prettier change, `const ON ='on:…'` (review 1005 L1). It was fixed in the 1005 phase; see [review-1005-corrections.md](review-1005-corrections.md). Prettier is still unrun |

## 1. Dispositions

| # | Finding | Change | Held by |
|---|---|---|---|
| M1 (Medium) | A changed action SHA in `mobile-ci.yml` could hide behind a decoy. The steps before `pnpm check` compared each action by name only. Their SHAs were held only through `pinsOf`, which scanned mobile's raw text, comments included, and kept the **last** match | **Bound route, guard and tests only.** A new `ACTION` table in `workflow-guard.mjs` holds each action as `owner/repo@sha` at the reviewed commit: checkout `3d3c42e5…`, setup-node `949feb24…`, pnpm `f520eced…`. `MOBILE_STEPS`, `STEPS` and `GUARD_STEPS` use it, and each step's parsed `uses` is compared **whole**. `pinsOf` is gone, so nothing reads raw text, comments or a last match for a pin. The reader already drops a trailing comment and skips comment lines, and a step after `pnpm check` is never compared with a pinned step. `backend-ci.yml` and `ci-guard.yml` are now held to the same table, not to mobile's text. `backendWorkflowProblems` still reads mobile's text, but only for the contract-base expression | New test "another commit of an action before pnpm check is refused whatever comment or later step keeps the old pin (review 0905 M1)". It runs **9 mutants**: each of the three actions, moved to another commit behind a same-line comment, a later comment line, or a step after `pnpm check` that keeps the old pin. Each one is judged by `ciWorkflowProblems`, which is the guard both guard jobs run, and the test asserts that `backend-ci.yml` and `ci-guard.yml` are as reviewed. Also a new ci-guard case (another setup-node commit) and two re-targeted cases (§3) |
| L1 (Low) | `mobile-ci.yml`'s `check` job had its `runs-on` and `timeout-minutes` keys checked by name only, not by value | Fixed in the guard rather than routed to QA-9. A shared `runnerProblems` now holds every required job to `runs-on: ubuntu-latest` and a whole-minute timeout from 1 to its cap. `check`'s cap is **15**, its current value. `backend` (60) and `ci-guard` (15) use the same function, with the same messages as before | New test "mobile-ci.yml's check job runs on ubuntu-latest for at most 15 minutes, as reviewed (review 0905 L1)". Four mutants: `macos-latest`, a custom label `fitlog-runner`, `16` and `0`. Plus the boundary: 1 minute is accepted |
| L2 (Low, deferred) | A literal U+2028 at `workflow-guard.test.mjs:368` | **Not touched, by instruction.** The `perl` writer denied in the 0705 phase was not retried, and no other writer was tried. The test still works | Next phase, if Codex names an allowed writer |

### Claims M1 made wrong, now corrected

| Where | Was | Now |
|---|---|---|
| `workflow-guard.mjs` `MOBILE_STEPS` comment (review: `:143`) | "Each action is compared by name; its SHA is held to backend-ci.yml's and ci-guard.yml's pins" | "Each action is compared whole, `owner/repo@sha`, against the reviewed pin (review 0905 M1)". The file header and the `mobileWorkflowProblems` comment also name the runner, the timeout and the commit pins |
| `ci-guard.test.mjs` test title (review: `:202`) | "one edit to mobile-ci.yml cannot skip, empty or redirect its check job without the guard seeing it" | "each listed edit to mobile-ci.yml that would skip, empty or redirect its check job is refused". The title now claims only what the listed cases show. The cases are unchanged |
| `review-0705-corrections.md:15` (F1 row) | "Their SHAs are already held: `backend-ci.yml` and `ci-guard.yml` must pin each action at mobile's SHA" | Corrected in place with a marked note, plus a "Corrected later" row in its header |
| `handoff.md` `:57`, `:68` and decision 12 | Characterisation and self-review claims that the SHAs were held through `pinsOf` | Rewritten in this phase's handoff. Decision 12 is amended, and decision 13 is added |
| [final-2026-10-27T0905Z.md](final-2026-10-27T0905Z.md) line 6 | "A changed SHA in `mobile-ci.yml` is already refused, because the other two workflows must use the same SHAs" | **Corrected later, here; the file itself is not edited.** That claim was wrong: a decoy comment or later step kept the old SHA in view of `pinsOf`. Since this phase, every action is held at its full reviewed `owner/repo@sha`, from the parsed step. The same pointer is in the header of `review-0705-corrections.md` |

`ci-guard.yml`'s comments were not edited: this phase allows no CI YAML change, and the review didn't flag them.

## 2. Test-first runs (executed)

The test files and the test effects were read before any run. The tests only read repository files. They write scratch folders under the OS temporary directory and remove them, run Git in scratch repositories with isolated config, and inject fakes for Supabase, Docker and psql. They make no network call, use no database and change no tracked file.

| # | Command | Result |
|---|---|---|
| 1 | Tests written first, guard unchanged. `rtk proxy node --test scripts/ci/backend-ci.test.mjs scripts/ci/ci-guard.test.mjs scripts/ci/workflow-guard.test.mjs` (the same three files `scripts/ci/*.test.mjs` matches) | **RED:** `# tests 37`, `# pass 32`, `# fail 5`. Failing: 23, 26, 27, 28 and 34. The tool's display cut the middle of the output, so tests 23, 26 and 27 were not visible |
| 2 | Guard still unchanged, to capture the cut output: `rtk proxy node --test --test-name-pattern="ci-guard.yml is exactly as reviewed\|review 0905" scripts/ci/ci-guard.test.mjs` | **RED:** `# tests 3`, `# pass 0`, `# fail 3` (verbatim below) |
| 3 | Guard changed (`ACTION`, `runnerProblems`, `pinsOf` removed, whole-pin comparison), and four F1 expectations updated (§3). Then `rtk proxy node --test scripts/ci/*.test.mjs`, **once** | **GREEN:** `# tests 37`, `# pass 37`, `# fail 0`, on Node v22.23.1. Test 30 runs the guard's command line on the real repository files, so the real three workflows match the bound pins and `check`'s runner and timeout |

RED, verbatim:
- **Test 26 (M1), run 2** `actual`:
  - `actions/checkout behind a comment on the same line: no problem found`
  - `actions/checkout behind a later comment line: no problem found`
  - `actions/checkout behind a step after pnpm check: no problem found`
  - the same three lines for `actions/setup-node` and `pnpm/action-setup`.

  So **9 of 9** decoys passed the old guard unseen.
- **Test 27 (L1), run 2** `actual`:
  - `a macOS runner, billed at about ten times the minutes: no problem found`
  - `a custom runner label: no problem found`
  - `a timeout above the cap: no problem found`
  - `a zero timeout: no problem found`
- **Test 23, run 2.** The old guard couldn't judge `ci-guard.yml` without mobile's text: `.github/workflows/ci-guard.yml jobs.ci-guard step 1 pins actions/checkout at 3d3c42e5aac5ba805825da76410c181273ba90b1, not at unset as .github/workflows/mobile-ci.yml does`, and the same for step 2 `actions/setup-node`.
- **Test 28, run 1.** The mobile checkout SHA case got only the old cross-check lines: `.github/workflows/backend-ci.yml jobs.backend step 1 pins actions/checkout at 3d3c42e5aac5ba805825da76410c181273ba90b1, not at "1111111111111111111111111111111111111111" as .github/workflows/mobile-ci.yml does`, and the same for `ci-guard.yml` step 1. There was no `mobile-ci.yml jobs.check step 1` line.
- **Test 34, run 1.** `another commit of a pinned action (review 0905 M1):` with actual `.github/workflows/backend-ci.yml jobs.backend step 1 pins actions/checkout at 1111111111111111111111111111111111111111, not at "3d3c42e5aac5ba805825da76410c181273ba90b1" as .github/workflows/mobile-ci.yml does`.

**Not shown RED:**
- the new ci-guard case "another commit of a pinned action (review 0905 M1)". Test 23's first assertion failed before the loop reached it;
- the L1 acceptance of `timeout-minutes: 1`. It comes after the failing assertion, and it passes on the old and the new guard alike;
- the four F1 regex updates in §3. They were made after the RED runs, from reading the new message shape, and first ran in GREEN.

## 3. Changed expectations (re-targeted, none weakened)

Each change keeps the same mutant and still requires a refusal. Each new pattern is at least as specific as the old one: it names the step, the edited value and the reviewed full pin.

| Test | Before | After | Seen RED? |
|---|---|---|---|
| `workflow-guard.test.mjs` test 34, backend checkout at another commit | the old cross-check message, "… pins actions/checkout at 1{40}, not at "3d3c…" as mobile-ci.yml does" | `jobs.backend step 1 is {"uses":"actions/checkout@1{40}"…, not the reviewed {"uses":"actions/checkout@3d3c42e5…"` | Yes, run 1 |
| `ci-guard.test.mjs` test 28, mobile checkout at another commit | `backend-ci.yml … pins actions/checkout at 3d3c…, not at "1{40}"` | `mobile-ci.yml jobs.check step 1 is {"uses":"actions/checkout@1{40}"…, not the reviewed {"uses":"actions/checkout@3d3c42e5…"`. `backend-ci.yml` and `ci-guard.yml` are still asserted untouched | Yes, run 1 |
| `ci-guard.test.mjs` test 23, three calls | `guardWorkflowProblems(text, mobileText)` | `guardWorkflowProblems(text)`: `ci-guard.yml` is judged alone, against the reviewed pins | Yes, run 2 |
| `ci-guard.test.mjs` test 25 (F1): checkout `ref`, extra action, setup-node inputs, pnpm inputs | `"uses":"actions/checkout"` and the like, by name | `"uses":"actions/checkout@3d3c42e5…"`, `"example/env-action@0{40}"`, `"actions/setup-node@949feb24…"`, and `"pnpm/action-setup@f520eced…"` on both sides | No (see §2) |

## 4. Not run (by instruction), and inherited

- **Not run:**
  - Prettier 3.6.2 `--check`. The layout was matched by hand at width 100, which is not proof. One new line in test 26 sits at exactly 100 columns. *Corrected later (review 1005 L1):* `ci-guard.test.mjs:68`, `const ON ='on:…'`, lacked the space after `=`, so the hand layout was not clean. Fixed in the 1005 phase.
  - A strict YAML parse. Neither current workflow has been through a parser, and no CI YAML changed in this phase.
  - Any outside mutation run.
  - `pnpm check`, `pnpm install` and `pnpm backend:test`.
  - Docker, Supabase, any database, the network and anything hosted.
  - The U+2028 writer, which stays denied and was not retried.
- **Inherited, not re-run:** the 0705 phase's RED (33/35) and GREEN (35/35); review 0905's own 35/35 run; the phase-1 evidence (stale where F6 says); the AR-1 L1 scratch-clone probe; and the 39 `scripts/backend` tests (files unchanged).
- **Unchanged, by hash** (`rtk proxy sha256sum`, the same before and after this phase):
  - `mobile-ci.yml` `f26c6272…`
  - `backend-ci.yml` `cfbec911…`
  - `ci-guard.yml` `cf22fa6a…`
  - `final-2026-10-27T0905Z.md` `b938331c…`
  - `final-2026-10-27T0905Z-collected.md` `25d129a2…`
  - the 0505, 0535, 0635 and 0705 finals: `531b08f4…`, `e7f616ee…`, `595e5d57…` and `479c45ec…`.

## 5. Residual risks (accepted or routed)

1. **Pin bumps need the guard (new coupling).** Moving checkout, setup-node or the pnpm action to another commit, in any of the three workflows, now needs the same change to `ACTION` in `workflow-guard.mjs`, in one reviewed diff. This applies to an automated bump too. It is the intended price of M1's fix.
2. **Steps after `pnpm check`** may still use any pinned action at any commit. They can't turn a failed check into a pass: they can't be conditional, and the job has only `contents: read`. The review's optional "two SHAs for one action" rule was therefore not added.
3. **Trusted files (F2), coordinated edits, and text rather than YAML:** unchanged from review 0705's record.
