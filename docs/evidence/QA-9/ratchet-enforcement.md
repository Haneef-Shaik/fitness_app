# QA-9 · Coverage ratchet enforcement (phase 2, remediated in phases 2B, 2C, 2D, 2E, 2F and 2G) and Prettier on touched files (phase 3, corrected in phases 3B and 3C; records corrected and committed locally in phase 3D; R19 fixed by a domain test in phase 3E; that review's record findings corrected and the test committed locally in phase 3F; phase 3F's stop resolved in phase 3G, with trailing spaces removed from two captured outputs before that commit)

| Field | Value |
|---|---|
| Goal | QA-9, attempt 1. Phase 2 enforced the phase-1 thresholds and the ratchet. Phase 2B fixed the independent review's findings 1–4 and 6 and resolved or assigned 5 and 7 ([review-phase2.md](review-phase2.md), verbatim). Phase 2C fixed both findings of the phase-2B review ([review-phase2b.md](review-phase2b.md), verbatim): the JSON-`null` fail-open and the unscanned coverage-suppression comments (§5). Phase 2D fixed the four low findings of the phase-2C review ([review-phase2c.md](review-phase2c.md), verbatim) and closed residuals R8 (lint scope) and R11 (transform-time config) within the mobile package (§6). Phase 2E handled the four low findings of the phase-2D review ([review-phase2d.md](review-phase2d.md), verbatim) and closed R14 (TypeScript suppression comments) in the mobile and domain packages (§7). Phase 2F fixed both low findings of the phase-2E review ([review-phase2e.md](review-phase2e.md), verbatim): the Kelvin-sign `@ts-nocheck` and the U+2028/U+2029 line ends in the disable scan. It also closed R16 narrowly (declaration files under each package's `src/`) and added the phase-2D review's three test gaps (§8). Phase 2G fixed all three low findings of the phase-2F review ([review-phase2f.md](review-phase2f.md), verbatim, source-only): declaration names with a line break, UTF-16 files, and JavaScript in source (§9). **Phase 3** built the card's "Prettier on touched files only" (§1, "Formatting"; §10), with Prettier 3.6.2 as an exact root devDependency. It also corrected the records the executed phase-2G review named ([review-phase2g.md](review-phase2g.md), verbatim): R17's owner and its relative-path sentence, and 2G's mutation labels. **Phase 3B** handled the source-only phase-3 review ([independent-review-2026-10-26T2000Z.md](independent-review-2026-10-26T2000Z.md)) (§11). It fixed the medium finding, the rule start lost silently in CI: `RULE` is now derived from the module's own path, and a lost start fails closed. It pinned `prettierPath: null` in `jest.config.cjs` and in the guard, as Codex chose for the second finding. It recorded the third finding as R18(h) and corrected the stale box-3 probe and root `package.json` sentence (fourth finding). **Phase 3C** resolved the three lows of the executed final review of phases 3 and 3B ([reviewer-final-2026-10-26T2305Z.md](reviewer-final-2026-10-26T2305Z.md)) (§12). It added touched-format test 17, the detached merge commit GitHub checks out for a pull request, killed by a `--first-parent` mutation ([phase-3c-mutation-first-parent.patch](phase-3c-mutation-first-parent.patch)). It added the format step's label to §7's box-3 log checklist, and restated the handoff's `pnpm backend:test` and export rows as required by docs/23 for this diff and deferred. No check code changed. **Phase 3D** handled the executed review of phase 3C ([reviewer-final-2026-10-27T0005Z.md](reviewer-final-2026-10-27T0005Z.md)) (§13). It corrected the medium records finding: the box-3 push and draft pull request need **the owner's specific approval** under docs/23 §6, not Codex's, and neither AUTH-01 nor any existing approval covers publication. It assigned the low finding, R3's per-line flip list, to QA-9's next phase, after analysing the coverage artifacts already on disk. Then it staged the eleven named QA-9 paths and made one local commit. No code, config or threshold changed. **Phase 3E** fixed R19 (§14), which the committed `pnpm check` found. It is a test only: three tests in `packages/domain/src/contract.test.ts`, under Codex's routine ownership exception for that one S8 file. They drive `gitBaselines` through an injected in-memory Git, so the duplicate-baseline branch is covered whatever the host's Git state. Domain branches went from 271/313 to **273/313**, and `pnpm check` passes at `4a7ee21` plus the uncommitted test. No production code, threshold or config changed. Phase 3E also named R3's four flipping lines from the normal outputs. **Phase 3F** handled the executed review of phase 3E ([reviewer-final-2026-10-27T0135Z.md](reviewer-final-2026-10-27T0135Z.md)) (§15). It corrected the two low records findings. §14's mutations are now exact source diffs, each with its predicted killers, and a surviving `break` is named. R19(b) now states the margin both ways: one newly uncovered branch, about seven merges, and the exposure of a first call. It also corrected the stale line numbers and §7's box-3 count, now 19. The third low, splitting one test, is assigned to QA-10. Then it staged the nine named paths and made one local commit. *(After the stop, uncommitted: it staged them, but made no commit. The staged `--check` found trailing whitespace in the verbatim outputs of phases 3D and 3E, so the phase stopped. See the checkpoint and [phase-3f-check-outputs.md](phase-3f-check-outputs.md).)* No code, test, config or threshold changed in phase 3F. *(3G)* **Phase 3G** resumes that commit under Codex's brief after the stop (27 October 2026, AUTH-01). Codex chose to strip the trailing whitespace: one space at the end of 31 captured coverage-table rows, 12 in phase 3D's outputs and 19 in phase 3E's, with a note in each file's header. No output content or figure changed. The commit takes eleven paths, the nine plus `phase-3f-check-outputs.md` and `implementer-final-2026-10-27T0205Z.md` (§16). No code, test, config or threshold changed in phase 3G |
| Authorised and accepted | Each phase was **authorised** by Codex under AUTH-01; that is not an acceptance. The acceptances recorded so far: (1) the independent phase-2C review accepted phase 2C's code by reading only, running no commands ([review-phase2c.md](review-phase2c.md)); (2) Codex **accepted the design of phases 2B and 2C**, subject to the exact-integration floor proof (§1, "Anchoring"), in its phase-2D brief of 26 October 2026; (3) the independent phase-2D review **accepted phase 2D** with no critical, high or medium finding, after running the quality suite (65 of 65) and `pnpm check` (exit 0) on Node 22.23.1 ([review-phase2d.md](review-phase2d.md)). Codex's phase-2E brief records that acceptance, and Codex's own independent `pnpm check` and its reproduction of finding 1 (§7); it does not state a separate Codex acceptance of phase 2D. (4) The independent phase-2E review ([review-phase2e.md](review-phase2e.md)) ran **no command** (every Bash call was denied). It found two low bypasses, and said phase 2E is ready for the separate Prettier phase once both are fixed, mutation-checked and re-verified. (5) **Codex accepted phase 2E's routine policy choices, subject to these fixes**, in its phase-2F brief of 26 October 2026. That brief also records Codex's own independent full `pnpm check` of phase 2E on Node 22.23.1 (258 tests), and its scratch reproduction of both phase-2E findings. (6) The independent phase-2F review ([review-phase2f.md](review-phase2f.md), session `68f44e38-7c4c-43ce-bdbb-bc9203468b1a`) was **source-only**: every Bash call in its session was denied, and it executed nothing. It found no critical, high or medium issue and three lows. It said phase 2F is ready for the Prettier phase once finding 1 is fixed, mutation-checked and re-verified on Node 22.23.1, or once Codex accepts it as a named residual. (7) The independent phase-2G review ([review-phase2g.md](review-phase2g.md), session `908f412f-5536-4da2-84f7-743b8d1ec933`) **executed**: on Node 22.23.1 it ran the 79 quality tests and `pnpm check` (264 tests, exit 0), the first independent run of phases 2F and 2G. It found no correctness defect and one low records fix, and it said phase 2G, and with it 2F, is ready for the separate Prettier phase. **Codex's phase-3 brief of 27 October 2026 accepts that review** ("accepts independent phase2G review") and assigns the one separate Prettier phase. None of these is the owner's signature or acceptance of the goal or a box. (8) The independent phase-3 review ([independent-review-2026-10-26T2000Z.md](independent-review-2026-10-26T2000Z.md)) was **source-only**: Bash was denied on its first command, and it ran no test and not `pnpm check`. It found no critical or high defect, one medium and three lows. **Codex's phase-3B brief** assigns the medium fix test-first, chooses `prettierPath: null` for the second finding, and asks for the third to be recorded as an R18 residual and the fourth to be resolved. That is an assignment, not an acceptance of phase 3. ~~**Phase 3 has no acceptance, and phase 3B no review, yet**~~ *(Superseded in phase 3C by (9).)* (9) The independent final review of phases 3 and 3B ([reviewer-final-2026-10-26T2305Z.md](reviewer-final-2026-10-26T2305Z.md)) **executed**. On Node 22.23.1 it ran the 96 quality tests (96 pass) and `pnpm check` (**281 tests**, every step through to the plan build, no failure line), the first independent run of phases 3 and 3B. It found **no critical, high or medium finding**, and three lows: two in the records, one a test gap. **Codex's phase-3C brief of 27 October 2026** directs the records to carry this review as the current review acceptance (no critical, high or medium finding; an independent 281-test pass) and assigns all three lows. The review also says QA-9 is **not Done**: box 3's hosted run, the floor's anchoring and the committed-state format path all stay open. That is a review of phases 3 and 3B, not the owner's signature, and it accepts neither the goal nor a box. ~~Phase 3C itself has no independent review yet~~ *(Superseded in phase 3D by (10).)* (10) The independent review of phase 3C ([reviewer-final-2026-10-27T0005Z.md](reviewer-final-2026-10-27T0005Z.md), session `aab700d3-e7ca-4d66-8f25-169ac16ec95b`) **executed** on Node 22.23.1. It ran the 97 quality tests (97 pass; test 81 is touched-format 17), `pnpm check` (exit 0, **282 tests**: 37 + 97 + 126 + 22) and Prettier `--check` of the 18 files, each named. It found **no critical or high finding**, one medium and one low. The medium is in the records: the wrong approver for the box-3 push (finding 1, corrected in §13). The low is R3: domain lines at 533/583 again (finding 2, assigned in §13). It found phase 3C's code and test 17 sound. It did not run the 3C-M1 mutation, so that result stays the implementer's word. **Codex's phase-3D brief of 27 October 2026 accepts that independent code and test review**: 97 quality tests, 282 tests in `pnpm check`, Node 22.23.1, and phase 3C's code sound. The brief makes the records correction and the local commit routine Codex decisions. That is an accepted review of phase 3C, not the owner's signature, and it accepts neither the goal nor a box. (11) *(3F)* The independent review of phase 3E ([reviewer-final-2026-10-27T0135Z.md](reviewer-final-2026-10-27T0135Z.md), persisted by the coordinator before phase 3F began, and unchanged since; it names no session) **executed** `pnpm check` once on Node v22.23.1, at `4a7ee21` plus the uncommitted test. It measured **285 tests**, domain branches **273/313**, and **19 files** at the format step, labelled `from 4a7ee2100bff`. It found **no critical, high or medium finding**, and three lows. Two are in the records (finding 1, §14's mutation 3; finding 2, R19(b)'s margin), and one is a test split (finding 3). It did not run §14's mutations. **Codex's phase-3F brief of 27 October 2026 accepts that independent R19 review**: 285 tests, Node 22.23.1, 273/313 branches, 19 format files, no critical, high or medium finding. It assigns the two record lows and the stale line numbers to phase 3F, and the test split to QA-10. That is an accepted review of phase 3E, not the owner's signature, and it accepts neither the goal nor a box |
| Date | 26 October 2026; phases 3, 3B, 3C, 3D, 3E and 3F on 27 October 2026 |
| Worktree | `/Users/Adya/.codex/worktrees/fitlog-qa9/fitness_app`, branch `codex/qa9-quality-ratchets`, based on `main` at `2a95726`. ~~**Uncommitted**: no commit was made, by instruction~~ *(3D)* **Uncommitted through phase 3C**, by instruction. Phase 3D stages the eleven named QA-9 paths and makes one local commit (§13). Its results are recorded after the commit, so they are not in it. *(3F)* Phase 3F stages nine named paths, the R19 test and the QA-9 records, and makes a second local commit on top of `4a7ee21`, which it keeps as made (§15). Its results are recorded after that commit, uncommitted, in the checkpoint, the handoff and `phase-3f-check-outputs.md` |
| Machine | Local macOS (Darwin 27.0.0). Node `v22.23.1` at `/Users/Adya/.local/bin/node` (`rtk proxy node --version` and `rtk proxy which node`, phases 2D and 2E), which is the `.node-version` pin that CI's `setup-node` reads. Every phase-2D, 2E, 2F, 2G and 3 run used it; in 2F, 2G and 3 `rtk proxy node --version` printed `v22.23.1` again, and in 2F `which node` was denied (2G and 3 did not ask). Phase 3's pnpm was `10.27.0`, the `packageManager` pin. In phase 3B `rtk proxy node --version` printed `v22.23.1` again, and in phases 3C, 3D and 3E too. Codex ran the 47 phase-2C quality tests independently on Node 26.7.0, and the full `pnpm check` of phases 2D and 2E independently on Node 22.23.1 (§7, §8). Every run is local. No hosted CI run and no Linux run exist |
| Changed outside `scripts/quality/` | Phase 2: mobile `jest.config.cjs`, `coverage-thresholds.json` and `package.json`, and domain `package.json`. Phase 2B: one line of the root `package.json`: `node scripts/quality/coverage-ratchet.mjs && ` prepended to `check`, the single shared-file change Codex authorised. ~~It is still the only root `package.json` change.~~ *(Corrected in phase 3B, phase-3 review finding 4: that held until phase 3, which changed `check` again and added the `prettier` devDependency, below.)* Phases 2C and 2D: nothing outside `scripts/quality/`, the QA-9 documents and docs/23 §9 rule 3. Phase 2E: the same, plus the mobile `test:ci` script alone, which gains ` --no-watchman` (Codex authorised exactly that change). Phase 2F: nothing outside `scripts/quality/`, the QA-9 documents and docs/23 §9 rule 3. Phase 2G: the same. **Phase 3**, as Codex authorised: the root `package.json` gains `"prettier": "3.6.2"` in `devDependencies` and `node scripts/quality/touched-format.mjs && ` in `check`, after the guard; `pnpm-lock.yaml` gains only `prettier@3.6.2` (importer entry, package and snapshot, 10 lines); a new root `.prettierrc.json`; and docs/23 §9 rule 3. `apps/mobile/jest.config.cjs` was already in Prettier's format and is unchanged. **Phase 3B**, as Codex authorised (a limited config change): `apps/mobile/jest.config.cjs` gains `prettierPath: null` and a one-line comment (2 lines), and docs/23 §9 rule 3. No other file outside `scripts/quality/` and the QA-9 documents changed. **Phase 3C:** nothing outside `scripts/quality/touched-format.test.mjs` and the QA-9 documents; not even docs/23. `git diff --stat` is unchanged from the final review's run. **Phase 3D:** only the QA-9 documents changed, all records. No code, config, threshold, dependency or docs/23 change. **Phase 3E:** `packages/domain/src/contract.test.ts` (S8's file, under Codex's routine ownership exception): three new tests, two added imports, and the whole file formatted with Prettier, as the format step requires once a file is touched. Plus the QA-9 records and the new [phase-3e-check-outputs.md](phase-3e-check-outputs.md). No production code, threshold, config, dependency or docs/23 change. **Phase 3F:** only the QA-9 records. `contract.test.ts` is committed as phase 3E left it, and nothing was formatted |
| Not touched | CI workflows, every dependency but phase 3's exact `prettier`, backend, migrations, contracts, snapshots, and tests outside `scripts/quality/` (*(3E)* apart from `packages/domain/src/contract.test.ts`, above). No database, Docker or Supabase. `apps/mobile/eslint.config.js`, pinned as text, is unchanged, though it is not in Prettier's format |

## 1. What is enforced

### Thresholds

| Package | Metric | Threshold | Where it lives | What enforces it |
|---|---|---|---|---|
| Mobile | statements | 12.23 | `apps/mobile/coverage-thresholds.json` → `jest.config.cjs` `coverageThreshold.global` | Jest. It compares the reported percentage, floored to 2 decimals |
| | branches | 10.57 | same | Jest |
| | functions | 10.23 | same | Jest |
| | lines | 18.67 | same | Jest |
| Domain | lines | 91.42 | `--test-coverage-lines` in `packages/domain/package.json` `scripts.test` | Node to the whole number (91), plus the exact reporter in integers |
| | branches | 86.90 | `--test-coverage-branches` in the same script | Node to the whole number (86), plus the exact reporter in integers |
| | functions | 90.59 | `--test-coverage-functions` in the same script | Node to the whole number (90), plus the exact reporter in integers |

**Finding: Node truncates its coverage flags to whole numbers** (mutation M4, on Node 22.23.1).
- With `--test-coverage-lines=92.63 --test-coverage-branches=86.91 --test-coverage-functions=90.60`, Node printed only `Error: 91.94% line coverage does not meet threshold of 92%.`
- The branch and function flags were not enforced at all.
- Node alone would therefore hold the domain to 91 / 86 / 90, not to the measured values.
- `scripts/quality/exact-coverage-reporter.mjs` closes the gap:
  - it is a Node test reporter that reads the same flags from `process.execArgv`;
  - it compares each flag exactly with the run's covered/total counts;
  - it sets a failing exit code when one is missed (mutation M4b).
- The flags stay the single source of the domain thresholds. Node's whole-number check stays as a backstop.
- Phase 2B confirmed the version: the guard test spawns Node and prints `Node 22.23.1 truncated --test-coverage-functions=50.01 (1/2)`.

**Integer comparison (phase 2B, review finding 6).**
- The reporter now checks `covered × 10000 ≥ threshold-in-hundredths × total`, in integers.
- A threshold must have at most 2 decimals. The reporter and the guard both refuse more.
- The floating-point form it replaces failed 29/100 at a threshold of 29, because `(29 / 100) × 100` is `28.999999999999996`. Test 22 holds that case, and 57/100 at 57.

**Exactly how each threshold compares** (Codex asked for the unrounded behaviour):

| Metric | Measured | Unrounded | Threshold | Result |
|---|---|---|---|---|
| Domain functions | 106/117 | 90.598… | 90.59 | passes |
| Domain functions | 106/117 | 90.598… | 90.60 | fails, as M4b shows |
| Domain branches | 272/313 | 86.9009… | 86.90 | passes |
| Domain branches | 272/313 | 86.9009… | 86.91 | fails, as M4b shows |
| Domain lines | varies by run | — | 91.42 | — |
| Mobile statements | 254/2076 | 12.2350… | 12.24 | fails: `not met: 12.23%` (M3) |

Notes on the table:
- **Domain lines:** the threshold 91.42 is 533/583, the lowest count seen. See R3 in §3.
- **Mobile statements:** Jest reports the value floored to 12.23, and that fails a 12.24 threshold.

**Domain files counted (phase 2B, review finding 7).**
- Node counts only the files a test loads. Mobile is different: Jest also counts files no test loads.
- The reporter now lists every file the `--test-coverage-include` globs match, minus the `--test-coverage-exclude` globs. It fails the run when Node's summary lacks one.
- Today's domain run prints `Coverage counts all 8 files that --test-coverage-include matches`.
- It reads only `*`, a whole `**` segment and literal characters, and fails closed on any other glob syntax. Thresholds without an include glob also fail.

### The guard: `scripts/quality/coverage-ratchet.mjs`

**Where it runs.** Since phase 2B it runs three times in every `pnpm check`:
1. first, from the root `check` script;
2. then in `@fitlog/domain` `test`;
3. then in `@fitlog/mobile` `test:ci`, after the quality tests.

Each copy checks that the other two stay wired. A change now has to remove all three in one step to go unseen (R2).

**What it compares, and how.**
- **Floor.** It compares the working tree with the checked-in floor, `scripts/quality/coverage-floor.json`. The floor holds the phase-1 measured values.
- **Baselines.** It also compares with the same files at each trusted Git baseline:
  - In CI it uses `FITLOG_CONTRACT_BASELINE`, which `mobile-ci.yml` already sets and validates, and requires a full 40- or 64-hex commit ID.
  - CI mode means `CI` is set **or `GITHUB_ACTIONS=true`** (phase 2B). Unsetting `CI` no longer drops the guard into local mode. GitHub documents that a workflow cannot overwrite its `GITHUB_*` variables; this session had no network, so that was not re-checked.
  - In CI, a baseline whose fork point is `HEAD` itself is refused (phase 2B). Example: `${{ github.sha }}` would make the change its own baseline.
  - Locally it uses `HEAD` and `main`, each taken as its merge base with `HEAD`.
- **Data only.** Baselines are read as data: `git ls-tree` and `git cat-file blob`, then `JSON.parse`, or a regex over the domain script. Nothing from history is executed.
- **Failing closed.** A configured baseline fails closed in any of these cases:
  - unset in CI, blank or all zeros;
  - a short ref in CI;
  - not a commit, or without shared history;
  - outside a Git work tree;
  - in CI, a fork point at `HEAD`.

  A Git failure while reading a baseline throws; it is never read as an absent file.

**Anchoring (phase 2B; corrects the phase-2 claim, review finding 2).**
- The floor is anchored only when the **trusted** baseline records it: `main` locally, or the CI baseline (the pull request base, which is `main`).
- The first commit on the branch does not anchor it. `HEAD` protects only against an uncommitted lowering, and `main` holds no ratchet until QA-9 is integrated.
- Until integration, a later branch commit that lowers the floor and a threshold together passes the guard. Guard test 12 shows this, both locally and in CI mode, and shows the lowering failing once `main` takes the reviewed commit.
- While the floor is not anchored, the guard prints `the floor is not anchored yet: …`.
- Guard test 2 then requires the floor to **equal** [coverage-baseline.md](coverage-baseline.md) §5 and its §1 scope exactly. Mutation M16 shows that test failing `pnpm check`.
- A change could still edit both the floor and the evidence file in one diff. So the verifier compares `git show <merge-commit>:scripts/quality/coverage-floor.json` with §5 at the exact commit to be merged.

**What fails `pnpm check`.**
- **Ratchet:**
  - a threshold below the floor, or below its value at any baseline (once anchored, the floor itself is ratcheted too);
  - a metric removed: a mobile key, or a domain flag;
  - a threshold that is not a number from 0 to 100 with at most 2 decimals, or an unknown metric;
  - per-path thresholds;
  - a dropped include pattern, or a new `!` exclusion no floor or baseline records.
- **Its own inputs (phase 2C, phase-2B review finding 1).** The floor, `coverage-thresholds.json` and the domain `package.json` are read so that "missing" and "parsed to `null`" can never be confused:
  - In the working tree each must exist. A missing one is a problem (`… is missing, so the ratchet cannot read it`).
  - Each must be JSON, and its top level must be a JSON object. `null`, an array, a string, a number or a boolean is a problem that names the kind (`… must be a JSON object with collectCoverageFrom and global; it is null, so the ratchet cannot read it`). The same holds for a file present at a Git baseline. A baseline without the file still counts as one that predates it.
  - A file that exists but cannot be read (a directory, no permission) stops the guard and names the file (`coverage-ratchet failed: apps/mobile/coverage-thresholds.json cannot be read (EISDIR: …), so the ratchet fails closed`). Only `ENOENT` and `ENOTDIR` count as missing.
  - `jest.config.cjs` is checked even when the thresholds file is unusable. Its allowlist and pins still apply, and its scope and thresholds are reported as `cannot be checked, because apps/mobile/coverage-thresholds.json holds no thresholds object this guard could read`. A config such as `require('./coverage-thresholds.json') ?? { collectCoverageFrom: ['src/theme/**/*.{ts,tsx}'], global: {} }` can therefore no longer hand Jest a narrowed scope unseen.
- **Coverage-suppression comments (phase 2C, phase-2B review finding 2).** `scripts/quality/coverage-suppression.mjs` reads every file under `apps/mobile/src` and `packages/domain/src` as text and fails on:
  - Istanbul's `istanbul ignore` (if, else, next, file);
  - c8's and V8's `c8 ignore` / `v8 ignore` (next, start, stop);
  - Node's `node:coverage` (disable, enable, ignore next).

  Matching ignores letter case and spacing, and covers test files and comments split over lines. Each finding names `file:line`. The scan also fails closed when it cannot see a file: a missing tree, a directory it cannot list, a file it cannot read, or an entry that is neither a regular file nor a directory (a link: Jest's file map skips links by default). It matches text, not comment syntax, so a string containing such words also fails; it must be reworded. None of these comments exist today: the guard reports `No coverage-suppression comment is in the 141 files under apps/mobile/src and packages/domain/src`.
- **The coverage scope stays where the scan reads (phase 2D, phase-2C review finding 1).**
  - In the working tree, every include pattern must start with `src/`, the mobile folder the suppression scan reads. That covers `coverage-thresholds.json` and the floor's mobile scope.
  - It must also hold no `..` and no backslash.
  - The allowed prefixes come from `SUPPRESSION_ROOTS`, so a scope can only widen past `src/` once the scan widens with it, in a reviewed change to the guard.
  - Exclusions (`!…`) are ratcheted as before.
  - A baseline's patterns stay data. A pattern `main` once recorded outside `src/` must still be kept, since the scope never narrows, and it is refused here. So it fails until a reviewed change resolves it (ratchet test 27, the review's "widened, anchored, then suppressed" case).
- **Transform-time configuration (phase 2D, finding 4 and R11).** `scripts/quality/config-inventory.mjs` lists every entry under `apps/mobile` except `node_modules` folders, and never follows a link. `scripts/quality/transform-config.mjs` then refuses:
  - any `babel.config.*`, `.babelrc*` or `.babelignore` anywhere, hidden, nested or generated, in any letter case, whether a file, a directory or a link;
  - a `babel` key in `apps/mobile/package.json`, or a `package.json` that is missing, unreadable, not JSON or not an object;
  - any `package.json` nested below `apps/mobile`.

  The inventory itself fails closed on a missing package, a folder it cannot list, and any link or other non-regular entry. How jest-expo and Babel actually load configuration was read from the installed packages; see §6. Today the guard reports `No Babel configuration is among the 210 entries under apps/mobile`.
- **The domain loader (phase 2D).** Node loads domain tests only through `--import tsx --enable-source-maps`, inside the domain `test` template. The template already allowed a number and nothing else in its slots. Ratchet test 29 now names the loader flags. It shows that another `--import`, a `--require`, an `--experimental-loader`, an `--env-file` or dropping `--enable-source-maps` each fails.
- **Lint scope (phase 2D, R8).** `scripts/quality/lint-scope.mjs`:
  - **Pins `apps/mobile/eslint.config.js` as text.** It differs only in line endings or trailing blank lines, and a difference names its first line.
  - **Refuses every other ESLint config source in `apps/mobile`, in any letter case:**
    - `eslint.config.*` anywhere else, nested included;
    - `.eslintrc*` and `.eslintignore`;
    - the `eslintConfig` and `eslintIgnore` keys of the mobile `package.json`.
  - **Reads every other file ESLint lints for directives.** That is `.js`, `.jsx`, `.mjs`, `.cjs`, `.ts`, `.tsx`, `.mts` and `.cts` outside `node_modules` and the config's global ignores. It applies ESLint's own grammar:
    - `eslint-disable`, `eslint-disable-line` and `eslint-disable-next-line` must name the rules they switch off and give a reason after ` -- `;
    - since phase 2E (phase-2D review, finding 1) the rule list is read as ESLint reads it: split on commas, trimmed, one pair of matching quotes removed, empty items dropped. A list that ends up empty, such as `eslint-disable , -- legacy` or `eslint-disable "" -- legacy`, disables every rule and fails;
    - inline rule configuration (`/* eslint rule: … */`) is refused;
    - `eslint-enable` and `eslint-env` pass.

  Every `//` and `/*` is read as a comment, strings included, so such a string must be reworded. Since phase 2E, comment starts that overlap are each read, so in `/* keep *//* eslint-disable */` the `/` that closes the first comment no longer hides the start of the second. Since phase 2F (phase-2E review, finding 2) a `//` comment ends at CR, LF, U+2028 or U+2029, JavaScript's four line terminators, as it does for ESLint's parsers. Before, the scan read on past U+2028 into the next comment and took its text for the rule list and reason. Lint-scope test 8 shows the installed ESLint turning every rule off in that case, with both parsers used here. The scan reads text, not a parse: it is not ESLint's parser, so a form nobody has named yet could still read differently. Today: 131 files, none.
- **TypeScript suppression comments (phase 2E, R14).** `scripts/quality/type-suppression.mjs` reads every `.ts`, `.tsx`, `.mts` and `.cts` file (declarations included, any letter case) in `apps/mobile` and `packages/domain`, the packages whose `tsc` runs `pnpm check` holds. It skips only each package's own top-level `node_modules`, so a `node_modules` folder deeper down, a hidden folder and a generated folder are all read. It matches as text, strings and prose included. Letter case is matched with Unicode case folding (the `u` flag) since phase 2F (phase-2E review, finding 1). Phase 2E matched ASCII case only, so `@ts-nocheck` written with the KELVIN SIGN (U+212A) for `k` passed the scan, though TypeScript lower-cases it to `ts-nocheck`:
  - `@ts-ignore` fails wherever it appears. It hides the next line's error and outlives it;
  - `@ts-nocheck` fails wherever it appears. It switches checking off for the whole file;
  - every `@ts-expect-error` needs a reason after it, on its own line and inside the same comment: at least three different words of two or more letters, not counting TODO, FIXME, TBD, XXX or HACK. The reason stops at a line break (CR, LF, U+2028 or U+2029, TypeScript's line breaks) or at `*/`.

  A missing package, a folder it cannot list, a file it cannot read and a link (TypeScript follows links) each fail closed. JavaScript is not read for comments: `allowJs` is on through `expo/tsconfig.base`, but `checkJs` is not, so TypeScript reports no error in JavaScript for a comment to hide. *(2G)* Under either `src/` JavaScript is refused instead (below). How TypeScript 6.0.3 reads these comments is in §7.

  *(2G, phase-2F review finding 2)* Each TypeScript file is read as raw bytes. One that starts with a UTF-16 byte-order mark (`FF FE`, little-endian, or `FE FF`, big-endian) fails before it is decoded. TypeScript 6.0.3's `sys.readFile` decodes such a file as UTF-16 (`typescript.js:8533-8556`), while this scan, ESLint, Babel and Metro read UTF-8. So `// @ts-nocheck` saved as UTF-16 switched checking off for TypeScript and read as `@\0t\0s\0…` here. Every other file is decoded as UTF-8, as TypeScript decodes it. A UTF-8 byte-order mark is read past, and `FF FE` anywhere but at the start is not refused, because TypeScript checks only the first two bytes. A reader that returns anything but bytes fails closed, so the check cannot be skipped quietly. This applies to every TypeScript file the scan reads, inside `src/` and out, because the mobile tsconfig includes `**/*.ts`. Today: `No @ts-ignore, @ts-nocheck or @ts-expect-error without a reason is in the 142 TypeScript files under apps/mobile and packages/domain`. No existing source changed: none of the three comments was found.

  What the case folding covers, and what it does not:
  - Type-suppression test 7 generates every one-character spelling of `ts-nocheck` that `toLowerCase()` produces: 10 on Node 22.23.1, nine upper-case ASCII letters and U+212A. The installed TypeScript reads each as `ts-nocheck`, and the scan refuses each.
  - The `u` flag on the `@ts-ignore` and `@ts-expect-error` patterns is for consistency only. TypeScript matches those two case-sensitively, so no test can tell the difference.
  - Case folding also matches U+017F, LONG S, to `s`, which TypeScript does not lower-case to `s`. That is a fail-safe extra match.
- **Declaration files in source (phase 2F, R16, narrowly).** The same scan refuses a declaration file under `apps/mobile/src/` or `packages/domain/src/`. ~~That is any name TypeScript 6.0.3's `getDeclarationFileExtension` calls one (`.d.ts`, `.d.mts`, `.d.cts`, or a `.ts` name with `.d.` in it, such as `styles.d.css.ts`), in any letter case.~~ *(Corrected in 2G, phase-2F review finding 1: not "any name". Phase 2F's pattern used `.` between `.d.` and the final `.ts`, and `.` does not match CR, LF, U+2028 or U+2029. So `loose.d.`+U+2028+`.ts`, which TypeScript calls a declaration file and the mobile `**/*.ts` includes, passed. Since 2G the scan applies TypeScript's own two tests, with no wildcard: a name ending `.d.ts`, `.d.mts` or `.d.cts`, or a name ending `.ts` with `.d.` anywhere in it. They are case-insensitive and read the whole entry name, so they are a superset of TypeScript's names by construction. Type-suppression test 8 checks every name it uses against the installed TypeScript, each of the four line breaks included.)* `skipLibCheck` is `true` for both packages, so TypeScript never type-checks such a file, which could declare or loosen types with no comment at all. Declaration files elsewhere in the packages are still read for comments but not refused, as Codex chose: a generated `apps/mobile/expo-env.d.ts`, `.expo/types`, or any other folder outside `src/`. That remainder is R16, S7 Quality's. Type-suppression test 8 takes the names from the installed TypeScript (`createSourceFile(…).isDeclarationFile`). It shows the refusal at any depth under each `src/`, and none outside it, including the prefix trap `apps/mobile/srcs/`. Today neither package holds a declaration file anywhere outside its top-level `node_modules`. That is inferred from mutation F5: refusing them everywhere failed exactly the three fixture tests that expect a declaration file outside `src/`, and none of the tests that scan this repository.
- **JavaScript in source (phase 2G, phase-2F review finding 3).** The same scan refuses every `.js`, `.jsx`, `.mjs` and `.cjs` file, in any letter case, under `apps/mobile/src/` or `packages/domain/src/` (`SOURCE_ROOTS`, the same two folders as declaration files). In mobile, `allowJs` without `checkJs` means TypeScript type-checks no JavaScript, and the types it infers from a `.jsx` flow into the files that import it. Mobile coverage counts only `src/**/*.{ts,tsx}`, and the design-token lint rule applies only to those files. So renaming a screen to `.jsx` would take it out of strict types, the coverage count and the token rule at once, and the ratchet would still pass. The domain is held to the same rule because nothing there needs JavaScript: its tsconfig includes only `src/**/*.ts`, coverage counts only `.ts`, and Glob finds no JavaScript file under either `src/` (type-suppression 1 and ratchet 1 scan the repository and pass). The bounds: JavaScript outside `src/` is neither read nor refused. That covers `apps/mobile/eslint.config.js`, `jest.config.cjs` and `scripts/test-design-rules.cjs`, which mutation 2G-G10 shows would otherwise fail. It also covers a JavaScript file elsewhere in the packages that an import could reach. No tsconfig, `allowJs`, `checkJs`, Jest scope or lint scope changed.
- **`jest.config.cjs` (phase 2B: allowlist, review finding 1):**
  - It may export only `preset`, `testMatch`, `prettierPath` (since phase 3B), `clearMocks`, `collectCoverageFrom`, `coverageThreshold` and `coverageReporters`. Every other option fails, including `roots`, `modulePathIgnorePatterns`, `coveragePathIgnorePatterns`, `testPathIgnorePatterns`, `collectCoverage`, `coverageProvider` and `projects`.
  - `preset` must be `'jest-expo'`, and `testMatch` must be `['<rootDir>/src/**/__tests__/**/*.test.[jt]s?(x)']`.
  - *(3B, phase-3 review finding 2)* `prettierPath` must be `null`, and unset fails too. It names a module Jest loads only to write inline snapshots. Jest 29.7.0's default is `'prettier'`, which from `apps/mobile` now resolves to the root's Prettier 3.6.2, and Jest 29 then refuses to write one. With `null`, Jest writes them without Prettier and loads no module. It changes neither the coverage scope nor a threshold.
  - `collectCoverageFrom` and `coverageThreshold` must be the thresholds file, unchanged.
  - `clearMocks` must be a boolean.
  - `coverageReporters` may name only Istanbul's built-in reporters, since a reporter given as a path would run code before the threshold check.
  - A `jest` key in the mobile `package.json` fails. Since phase 2D (phase-2C review finding 2) the file is read outside the `try` that guards `JSON.parse`, so an unreadable file stops the guard there too, whatever order the checks run in.
  - The config is loaded from the working tree only, never from history.
- **Gate wiring (`scripts/quality/gate-wiring.mjs`, phase 2B, review findings 3 and 4):**
  - Gate scripts are pinned exactly:
    - root `check`, `test`, `typecheck` and `lint`;
    - mobile `test:ci`, `lint` (with `--max-warnings=0` and the design rules) and `typecheck`. Since phase 2E (phase-2D review, finding 2) the pinned `test:ci` runs `jest --runInBand --ci --coverage --no-watchman`. jest-config 29.7.0 defaults `watchman` to `true`, and jest-haste-map then lists files through watchman whenever it is installed, which honours a `.watchmanconfig` `ignore_dirs`. With `--no-watchman` Jest lists the files itself, so such a file cannot hide folders from the count. Gate-wiring test 9 holds the flag in the reviewed command itself;
    - domain `typecheck`.

    The domain `test` must match its template, with a number in each slot.
  - No `pre` or `post` script may exist for a gate script: pnpm can run them around the gate.
  - Type checking stays strict and covers the same files, in mobile `tsconfig.json` and domain `tsconfig.json` and `tsconfig.client.json`:
    - `extends`, `include`, `exclude`, `files` and `references` stay as reviewed;
    - the strict options in use stay `true`;
    - no strict-family option is set to `false`, and `noCheck` is never `true`.

    The files must stay plain JSON.
  - `mobile-ci.yml`, read in the block-style YAML layout it uses:
    - top-level keys only `name`, `on`, `permissions`, `concurrency` and `jobs`;
    - the `check` job with keys only `runs-on`, `timeout-minutes`, `env` and `steps`, so `if`, `needs` and `continue-on-error` are refused (GitHub reports a skipped job as passing);
    - job `env` names only `CI`, `EXPO_NO_TELEMETRY` and `FITLOG_CONTRACT_BASELINE`;
    - the baseline defined exactly once, as the reviewed event-based line;
    - `- run: pnpm check` exactly once, as one line with nothing nested under it;
    - no mention of `GITHUB_ENV` or `GITHUB_PATH` in the job.

    Comments, blank lines and CRLF line endings do not trip it (gate-wiring test 7).
  - The quality test files and the exact reporter must exist. Since phase 2C that includes `coverage-suppression.test.mjs`, since phase 2D `lint-scope.test.mjs` and `transform-config.test.mjs`, and since phase 2E `type-suppression.test.mjs`; gate-wiring test 8 also fails when any `*.test.mjs` in `scripts/quality/` is missing from that list. The guard imports `gate-wiring.mjs`, `coverage-suppression.mjs`, `config-inventory.mjs`, `transform-config.mjs`, `lint-scope.mjs` and `type-suppression.mjs`, so without any of them it cannot start, and every copy fails.
  - Since phase 2D (R8), gate-wiring tests 3 and 6 also hold the lint wiring against narrowing. The cases include `eslint src/ui`, a `--rule '…: off'` or `--ignore-pattern` on the command line, `ESLINT_USE_FLAT_CONFIG=false`, and `ESLINT_FLAGS` or `ESLINT_USE_FLAT_CONFIG` in the CI job or on its step. Each fails the existing pins.

**What the guard cannot do (trust model).**
- `pnpm check` and the workflow run the change's own code: tests, `jest.config.cjs`, `eslint.config.js` (pinned as text since phase 2D, so a change to it shows in review with its pin), the guard itself, any workflow step, the installed tools and presets (jest-expo, `babel-preset-expo`, `eslint-config-expo`, tsx), environment variables such as `ESLINT_FLAGS` or `TSX_TSCONFIG_PATH` outside CI's pinned job, and pnpm settings in `.npmrc` or `pnpm-workspace.yaml`.
- **`node_modules` is a trust boundary, not empty of risk** (phase 2E, phase-2D review finding 3; the comment in `config-inventory.mjs` is corrected). The inventory skips every `node_modules` folder because Babel stops its package search there and ESLint ignores it, so no config file there applies to mobile files. But Jest resolves `preset: 'jest-expo'` from `apps/mobile` first (jest-config `normalize.js`, `setupPreset`), jest-expo resolves `expo/internal/babel-preset` from `apps/mobile` first (`resolveBabelOptions.js`), and `eslint.config.js` requires `eslint-config-expo/flat` from there too. So a force-added `apps/mobile/node_modules/jest-expo/jest-preset.js` could replace the preset while the guard still reads `preset: 'jest-expo'`. A check that Git tracks no `node_modules` path, and protection for `.npmrc` and `pnpm-workspace.yaml`, belong to PL-1 (R6). This phase added no dependency-trust code, as Codex asked.
- The guard stops a careless or casual weakening and makes a deliberate one conspicuous in review. It cannot stop deliberately hostile code in a change.
- Its workflow checks read text, not YAML semantics. An override written in a form they do not look for (for example an escaped key), or code in another step, is beyond them.
- That trust belongs to review and the repository's workflow protections, owned by PL-1 (§3, R6).

### Formatting: Prettier on touched files only (phase 3, `scripts/quality/touched-format.mjs`)

Root `check` runs it once, right after the guard: `node scripts/quality/coverage-ratchet.mjs && node scripts/quality/touched-format.mjs && pnpm typecheck && …`. The line is pinned in `gate-wiring.mjs`. The exact semantics:

| Question | Answer |
|---|---|
| Which files | Tracked files with status A, M or T in `git diff --raw -z --no-renames --no-abbrev --no-ext-diff --no-textconv --no-color <base> --`, which compares the base commit with the work tree. So locally, committed, staged and unstaged edits all count. A rename is listed as its new path, added. Untracked files are not listed until `git add` |
| Which types | `.js`, `.jsx`, `.mjs`, `.cjs`, `.ts`, `.tsx`, `.mts`, `.cts`, in any letter case. Prettier lower-cases the name before matching too (`getLanguageByFileName` in `prettier/index.mjs` 3.6.2) |
| Not checked, and listed | Deleted paths; every other extension (binary files, JSON, Markdown, YAML, SQL, the lockfile); any path with a `node_modules` segment (vendor); `GENERATED` = `apps/mobile/src/data/database.types.ts`, which docs/23 §5 says is regenerated, never hand-edited. No tracked JavaScript or TypeScript exists outside `apps/`, `packages/` and `scripts/` today |
| Fails closed | A touched link or submodule with a source name (Git mode 120000 or 160000), an unknown Git status, any unmerged path (`git ls-files -u -z`: against the work tree, `git diff` reports a conflicted path as an ordinary modification), a file Prettier cannot parse or read, and any Git failure |
| The base | CI: the fork point (`merge-base`) of `FITLOG_CONTRACT_BASELINE`, required and validated by the guard's own `configuredBaseline` (unset, blank, all-zero or not a full commit ID fails), and refused when it forks at `HEAD`. Locally: the fork point of `refs/heads/main` (not a tag or remote of that name), or of `FITLOG_CONTRACT_BASELINE` when it is set. No `main`, no shared history or no Git fails, with what to set |
| When the rule starts | From the commit that adds `scripts/quality/touched-format.mjs`. If the fork point does not hold it, the base moves to the parent of the first commit after it that adds it, or to `HEAD` while it is uncommitted. `origin/main` is far behind local `main`: 164 JavaScript and TypeScript files are added or modified between them (`git diff --shortstat --no-renames --diff-filter=AM origin/main...main` over the eight extensions, phase 3). Without this, the first hosted run would demand formatting of all of them. Once `main` holds the rule every base does. A pull request is checked out as its merge with the base, whose first parent is the base, so a stale branch gains nothing. *(3B, phase-3 review finding 1)* `RULE` is derived from the module's own location (its path relative to the repository root, from `import.meta.url`), not written by hand, so a rename or move carries it along. With no commit after the fork point adding `RULE`, the base moves to `HEAD` only locally and only while `HEAD` does not hold `RULE`, the state before the check is committed. In CI that throws (`neither this fork point nor any commit after it up to HEAD holds …`), because CI runs only committed code. Locally, a `HEAD` that holds `RULE` throws too (`HEAD holds …, but no commit after this fork point adds it`). Whether `HEAD` holds it is read with `git ls-tree`, and a failure throws. *(3C, final review finding 2)* The shape a pull request is checked in is now tested: GitHub's detached test merge commit, whose first parent is the baseline and whose second is the change. The fork point is then the baseline itself. `rev-list --reverse --topo-order --full-history` still lists the commit that adds `RULE` before the merge, so the base is that commit's parent (touched-format 17). Walking first parents only would list the merge alone and measure from the baseline, demanding every earlier commit's files; mutation 3C-M1 shows test 17 catches that |
| How each file is judged | Read as UTF-8, as Prettier's CLI reads it, and passed to the installed Prettier's own `check()` with `PRETTIER_OPTIONS` (`printWidth: 100`, `singleQuote: true`, Prettier's defaults otherwise) and the file's path, which picks the parser. No config file, `.prettierignore`, `.editorconfig`, `package.json` key, plugin or `@noformat` pragma is read. The root `.prettierrc.json` must equal the options, and the installed Prettier must be 3.6.2 |
| What it never does | It never writes a file and never formats an untouched one. `pnpm exec prettier --write <path>` is the developer's step |

### Tests (`scripts/quality/*.test.mjs`, run by mobile `test:ci`): 97 (96 until phase 3C, 91 until phase 3B)

Every Git fixture is a scratch repository under the OS temporary directory, and every wiring case edits an in-memory copy. Fixture thresholds are pinned to the floor, so a legitimate raise in this repository never breaks them. Since phase 2C each Git fixture also holds one clean source file in `apps/mobile/src` and one in `packages/domain/src`, because the guard now requires both trees to exist. Since phase 2D it also holds this repository's `apps/mobile/eslint.config.js`, which the guard now pins. Ratchet test 23 copies the guard modules into its scratch repository: three were added in phase 2D, and `type-suppression.mjs` in phase 2E. No existing assertion changed, apart from test 8's widening case (below), which Codex's phase-2D brief asked to move inside `src/`. Phase 2E only added cases and tests.

`coverage-ratchet.test.mjs` (32; 32 added in phase 3B):
1. This repository passes under its own environment. In CI that means against the trusted baseline.
2. The floor never sits below `coverage-baseline.md` §5. While no trusted baseline anchors it, the floor equals §5 and the §1 scope exactly.
3. Before the first commit the floor is the minimum, the ratchet passes, and the guard reports the floor as not anchored.
4. Before the first commit, lowering any of the 7 thresholds by 0.01 fails against the floor.
5. Raising every threshold passes the guard.
6. Removing each mobile metric or domain flag fails.
7. Non-numeric, negative, over-100, null, boolean and 3-decimal thresholds fail, and so do per-path thresholds.
8. Narrowing the scope fails; widening it inside `src/` (since phase 2D, `src/**/*.{js,jsx}` instead of `scripts/**/*.ts`), or dropping an exclusion, passes.
9. `jest.config.cjs` mutations fail:
   - 7 options outside the allowlist (`modulePathIgnorePatterns` and `roots` first);
   - preset changed or removed, and `testMatch` narrowed;
   - `clearMocks` not a boolean, and a reporter given by path;
   - threshold removed, a per-path threshold, and a narrowed list;
   - an async export, and a `jest` key in the mobile `package.json`;
   - *(3B)* `prettierPath` set to `'prettier'` or to a path, or removed.

   Adding `lcov` to the reporters passes.
10. The domain template's four wiring mutations fail. Mobile `test:ci`, root `check` and workflow mutations reach the guard's result, and so does a missing quality file.
11. Once committed, an uncommitted lowering fails against `HEAD`, even with the floor lowered too.
12. Committed on the branch while `main` lacks the ratchet, a commit lowering floor and threshold together passes, locally and in CI. After `main` takes the reviewed commit it fails against `main` and against the CI baseline.
13. Once `main` holds the ratchet, a lowering committed on the branch fails against `main`.
14. Once committed, the floor never goes down or narrows.
15. A baseline file that is not JSON fails closed.
16. CI requires a trusted full commit ID: unset, blank, all-zero, a ref name, a short SHA and an unknown SHA all throw. A valid SHA replaces `HEAD` and `main`.
17. With `GITHUB_ACTIONS=true`, CI mode holds even with `CI` unset or `false`, and a baseline at `HEAD` is refused. Locally a configured `HEAD` is allowed.
18. Outside a Git work tree, a configured baseline fails closed; a local run only notes it.
19. A failing `git ls-tree` or `git cat-file` throws, and is never read as an absent file.
20. *(2C)* In both states of `main` (no ratchet, so unanchored; and holding it, so anchored), the thresholds file, the floor and the domain `package.json` each fail when they hold `null`, `[]`, a string, a number or `true`. A `null` floor with mobile statements set to 0 fails on the floor.
21. *(2C)* The review's tolerant `jest.config.cjs`, in both states of `main`. While the thresholds file is an object, the fallback never runs and the guard passes. With the file `null`, the test loads the config as Jest would and gets the narrowed fallback; the guard reports the `null` file and that the Jest scope and thresholds cannot be checked. A `try`/`catch` variant with the thresholds file removed is reported as missing, with the same Jest problem.
22. *(2C)* In both states of `main`, the thresholds file, the floor and the domain `package.json` each replaced by a directory stop the guard with `<file> cannot be read (EISDIR`.
23. *(2C)* The guard command itself, copied into an anchored scratch repository: exit 0 when clean; exit 1 with `coverage-ratchet failed:` and the named `null` problem under the tolerant config; exit 1 with `… cannot be read (EISDIR` for an unreadable thresholds file.
24. *(2C)* In both states of `main`, `/* istanbul ignore file */` in a gym screen and `/* node:coverage disable */` in a domain module each fail with `file:2`. Once they are removed, the guard passes and its summary counts the 2 fixture files.
25. *(2C)* A thresholds file committed as `null` fails closed at the `HEAD` baseline, like test 15's file that is not JSON.
26. *(2D)* In both states of `main`, seven include patterns fail in the thresholds file and in the floor, each with its own problem: `scripts/**/*.ts`, `**/*.{ts,tsx}`, `{src,scripts}/**/*.ts`, `src/../scripts/**/*.ts`, `./src/**/*.ts`, `/tmp/**/*.ts` and a backslash path. `src/**/*.{js,jsx}` passes.
27. *(2D)* The review's case: `main` records `scripts/**/*.ts` in both files (anchored), and the branch adds `/* istanbul ignore file */` to `apps/mobile/scripts/generate-palette.ts`. Keeping the pattern fails on both files; dropping it fails as narrowing a scope `main` records.
28. *(2D)* `mobilePackageProblems` throws when the mobile `package.json` cannot be read, so the `jest`-key check never takes it for a missing file. A missing file and one that is not JSON are left to gate-wiring; a `jest` key fails.
29. *(2D)* The domain template holds `node --import tsx --enable-source-maps --test` once, and `--import` is its only loader flag. Six loader edits each fail: another module in place of tsx, a second `--import`, `--require`, `--experimental-loader`, `--env-file`, and no `--enable-source-maps`.
30. *(2D)* In both states of `main`, the guard's summary counts the 7 fixture entries under `apps/mobile` and its 2 other linted files. Then each of these fails the guard itself: `apps/mobile/src/.babelrc`, a `babel` key in the mobile `package.json`, an extra ignore in `eslint.config.js` (named at line 6), and `/* eslint-disable */` in `src/clean.ts`.
31. *(2E)* In both states of `main`, the guard's summary counts the 2 fixture TypeScript files. Then each of these fails the guard itself, at `file:2`: `// @ts-nocheck` in a gym screen, `// @ts-ignore` in a domain module, and `// @ts-expect-error TODO` in `apps/mobile/app.config.ts`. Once they are removed the guard passes. *(2F)* So do the Kelvin-sign `@ts-nocheck` in the gym screen (`file:1`) and `packages/domain/src/loose.d.ts`, while a generated `apps/mobile/expo-env.d.ts` passes the guard. *(2G)* So do the phase-2F review's three cases: `apps/mobile/src/loose.d.`+U+2028+`.ts`, the UTF-16LE `@ts-nocheck` in `packages/domain/src/sub/fixtures.test.ts`, and `GymMembersScreen.jsx` holding `'#ff0000'`.
32. *(3B, phase-3 review finding 2)* `apps/mobile` resolves Jest 29's own default `prettierPath`, `'prettier'` (`jest-config` `defaults`), to Prettier 3.6.2. The installed `jest-snapshot`'s `saveInlineSnapshots`, the code Jest runs to write inline snapshots, is loaded from its package folder and called on a scratch `expect(42).toMatchInlineSnapshot();`. With that Prettier it throws `Inline Snapshots are not supported when using Prettier 3.0.0 or above` and writes nothing. The real `jest.config.cjs` sets `prettierPath` to `null`, and with that value the same call writes ``expect(42).toMatchInlineSnapshot(`42`);``.

`coverage-suppression.test.mjs` (6, phase 2C):
1. The scanned trees are exactly `apps/mobile/src` and `packages/domain/src`.
2. This repository has no suppression comment, and the scan counts exactly the files that `readdirSync(…, { recursive: true })` finds in both trees.
3. Eleven comment forms fail in a mobile file and in a domain file, with `file:3` and the tool named: Istanbul `file`, `next`, `else` (line comment), `if` (no spaces), `next @preserve` and mixed case; c8 `next 3` and `start`; V8 `next`; Node `disable` and `ignore next 2`.
4. A comment split over lines, one in a `__tests__` file, and three comments in one file are each reported, in file and line order.
5. Prose naming Istanbul, c8, v8 and "node coverage" without a suppression comment passes.
6. A missing tree, a link, a directory that cannot be listed and a file that cannot be read (the last two through an injected file system) each fail closed with their own message.

`gate-wiring.test.mjs` (9):
1. This repository's wiring passes.
2. Root scripts are pinned. The cases include the review's `pnpm test && pnpm plan:build --check` and its `unset FITLOG_CONTRACT_BASELINE CI && …`.
3. Mobile `lint`, `typecheck` and `test:ci`, and domain `typecheck`, are pinned. A `package.json` that is JSON `null` fails too. *(2D)* The lint cases include `eslint src/ui`, `--rule 'no-restricted-syntax: off'`, `--no-inline-config --ignore-pattern "src/features/**"` and an `ESLINT_USE_FLAT_CONFIG=false` prefix. *(2E)* A `test:ci` without `--no-watchman`, and one with `--watchman` instead, fail.
4. Seven `pre`/`post` scripts around gate scripts fail.
5. Twelve tsconfig mutations fail, among them strict off, a strict-family option off, `noCheck`, a new `exclude`, a narrowed `include`, a comment line, and a file that is JSON `null`.
6. Twenty workflow mutations fail. Among them are the review's `${{ github.sha }}` baseline and `if: false` on the check step. The rest are:
   - a head-SHA baseline, a step-level or top-level override, and `GITHUB_ENV` or `GITHUB_PATH` writes;
   - `continue-on-error`, `env:`, an `if` first, flow style, another command and a duplicate on the step;
   - `if`, `needs`, `continue-on-error` and a merge key on the job;
   - top-level `defaults`, `NODE_OPTIONS` in the job env, and an anchored job;
   - *(2D)* `ESLINT_FLAGS: v10_config_lookup_from_file` or `ESLINT_USE_FLAT_CONFIG: 'false'` in the job env, and `ESLINT_FLAGS` on the check step.

   A missing workflow fails too.
7. Comments, blank lines and CRLF endings pass.
8. Each missing quality file fails. The list holds seven files since phase 2D and eight since phase 2E, and every `*.test.mjs` in `scripts/quality/` must be on it.
9. *(2E)* The reviewed `test:ci` itself holds exactly one Jest run, `jest --runInBand --ci --coverage --no-watchman`; this repository's mobile `package.json` runs exactly that command; and dropping the flag fails the pin. So the flag cannot be removed from the script and the pin together without failing this test.

`lint-scope.test.mjs` (9, phase 2D; 8 and 9 added in 2F):
1. This repository passes, and the scan reads exactly the linted files on disk: the right extensions, outside `node_modules` and the config's global ignores, apart from the pinned config.
2. The folders the scan skips are exactly the reviewed config's global ignores.
3. Six edits to the config fail, each named at its first differing line:
   - an extra ignore;
   - the design rule set to `'off'`;
   - `files` narrowed to `src/ui`;
   - `linterOptions.reportUnusedDisableDirectives: 'off'`;
   - expo's config removed;
   - a rule switched off by appended code.

   CRLF endings, no final newline and an extra one pass. A missing config fails.
4. Nine other config sources fail, each once:
   - `eslint.config.mjs`;
   - `eslint.config.js` under `src/`, and `eslint.config.ts` deeper;
   - `ESLint.Config.CJS`;
   - `.eslintrc`, plus `.eslintrc.json` and `.eslintrc.yml` nested;
   - `.eslintignore`;
   - an `eslint.config.js` in `coverage/`.

   So do the `eslintConfig` and `eslintIgnore` keys. A config inside `node_modules` is skipped. *(2F, phase-2D review test gap)* With both keys present, each is reported on its own, in order; mutations F10 and F11 drop each from the check in turn and fail this test.
5. Ten comments fail with their exact message, among them:
   - `/* eslint-disable */` and `/* eslint-disable -- legacy screen */` (no rules);
   - `// eslint-disable-line no-console` and `… --` with nothing after (no reason);
   - a disable split over lines;
   - `/* eslint rule: "off" */`, with or without a reason (inline configuration);
   - a directive inside a string.

   Seven pass: a described line disable, a described file disable, `eslint-enable`, `eslint-env`, prose naming ESLint, a URL, and prose containing "eslint-disable".

   *(2E, phase-2D review finding 1)* Seven more fail. The review's four: `/* eslint-disable , -- legacy */`, `/* eslint-disable "" -- legacy */`, `/* keep *//* eslint-disable */` and `/* keep */// eslint-disable-line`, each as disabling every rule. Also `/* eslint-disable ,, '', "" -- legacy */` and `// eslint-disable-next-line '' -- legacy` (every rule), and `/* keep *//* eslint-disable no-console */` (no reason). Five more pass, each naming its rules with a reason: two rules in a list, a quoted rule, a quoted rule with a trailing comma, and a described disable directly after another comment, in line and block form.
   *(2F, phase-2E review finding 2)* Three more fail: the review's string with U+2028 and with U+2029 after `// eslint-disable-line` (every rule), and `// eslint-disable-next-line no-console` with U+2028 before `// -- printed only in development builds` (no reason). One more passes: a described line disable followed by U+2028 and a note.
6. Directives in `app.config.ts`, a `.cjs` script, a test file and an `.mjs` module are reported in path and line order. The same comment in `dist/`, `coverage/`, `.expo/`, `node_modules/` or a `.md` file is not read.
7. An unreadable config and an unreadable linted file each fail closed with their own message; a config that is a link fails too.
8. *(2F)* The installed ESLint (`Linter`, flat config), with `@typescript-eslint/parser` from `eslint-config-expo` for `Screen.tsx` and espree for `screen.js`, and a `no-restricted-syntax` hex-colour rule. For U+2028 and U+2029 in turn, the review's line fails lint with a note in place of the directive (`2: Use semantic theme colors.`) and passes with `eslint-disable-line`, because ESLint reads that comment with no rules. The scan refuses the same file as disabling every rule.
9. *(2F, phase-2D review test gap)* The mobile `package.json` fails closed for lint scope when it is not JSON, is JSON `null`, `[]`, a string, a number or `true`, is a directory, is a link, or cannot be read. Each gives its own message, so its `eslintConfig` and `eslintIgnore` keys are never skipped unseen.

`transform-config.test.mjs` (6, phase 2D):
1. This repository passes, and the inventory lists exactly the entries on disk outside `node_modules`.
2. Every name the installed jest-expo (13), and @babel/core's root (7) and relative (6) lists and its `.babelignore` look for, is read from those packages' own files and refused, in upper case too. Six near-miss names such as `babel.ts` are not.
3. Eight names fail in five folders each (40 fixtures): package root, `src/`, `src/features/gym/`, a hidden folder and `coverage/`. The names include `.BabelRC`, `Babel.Config.CJS` and `.babelignore`. *(2F, phase-2D review test gap)* A **directory** named `.babelrc`, `babel.config.js` or `.babelignore` fails too, named as a directory. @babel/core 7.29.7 only checks that the path exists (`lib/config/files/utils.js`, `fileMtime`) before reading it as a file, so a directory makes Babel throw for every file under it.
4. A `babel` key fails, and so does a `package.json` that is not JSON or is `null`. Three nested `package.json` files fail, one of them named `Package.json`.
5. `node_modules` folders are skipped at any depth, including one inside `src/`; a `.babelrc` in `dist/` fails.
6. Each of these fails closed:
   - a `.babelrc` link (reported as a link and as a Babel name);
   - a linked folder, which is not followed;
   - an unlistable folder and an unreadable `package.json`;
   - a missing package, an empty package folder, and a missing `package.json`.

`type-suppression.test.mjs` (10, phase 2E; 7 and 8 added in 2F, 9 and 10 in 2G):
1. This repository has no TypeScript suppression comment, and the scan reads exactly the TypeScript files that `readdirSync(…, { recursive: true })` finds in both packages outside each one's top-level `node_modules`.
2. The scanned packages are exactly `apps/mobile` and `packages/domain`, the reason needs 3 words, and every tsconfig `gate-wiring.mjs` pins lies inside a scanned package.
3. Thirteen comments fail in a mobile file and in a domain file, each with its exact message, `file:line` and the text found: `// @ts-ignore`, `//@ts-ignore`, `/// @ts-ignore`, `/* @ts-ignore */`, a JSDoc ignore on its last line (`file:4`), an ignore with a reason, `@TS-IGNORE`, `@ts-ignored` (TypeScript reads a prefix), an ignore in a string, `// @ts-nocheck`, a nocheck with a reason, `@TS-NoCheck` (TypeScript lower-cases pragma names) and `/* @ts-nocheck */`. Two comments in one file are reported in line order. *(2F)* Two more: `@ts-nocheck` with U+212A for its `k`, alone and in upper case with a reason (phase-2E review, finding 1).
4. Thirteen `@ts-expect-error` forms fail in both packages, with the reason shown: none, `:` only, `-- ` only, upper case, `TODO`, `TODO FIXME, fix later`, `TS2322 TS2345 TS7006`, `the the the`, `a b c d`, a reason after the comment's `*/`, a reason on the next line, a reason after U+2028, and the directive in a string. Eight pass: reasons after `:`, after `--`, in a block comment and on a JSDoc line; a reason that starts with TODO but has three other words; `@ts-check`; and prose without the `@` directive.
5. The scan reads TypeScript files at the package root, in hidden (`.expo`), generated (`dist`) and nested folders, a `node_modules` folder inside `src/`, `.mts`, `.cts`, `.d.ts` and an upper-case `.TSX`, in path order. It skips each package's top-level `node_modules`, JavaScript and Markdown. It counts 11 files. *(2F)* The fixture's `packages/domain/src/types.d.ts` is now also refused as a declaration file in source, before its comment; `.expo/types/router.d.ts`, outside `src/`, is not. This is the one existing expectation phase 2F extended, by one entry; none was removed. *(2G, phase-2F review finding 3)* The fixture's `apps/mobile/src/legacy.js` is now refused as JavaScript in source, and not read for comments; `apps/mobile/jest.config.cjs`, outside `src/`, is still neither read nor refused. One entry added, none removed.
6. A missing package, a linked file and a linked folder, a folder that cannot be listed and a file that cannot be read each fail closed with their own message. *(2G, phase-2F review finding 2)* The injected reader now returns raw bytes (`readFileSync` with no encoding), the same path as the real one, and a TypeScript file it reads cleanly is still scanned (`apps/mobile/app.config.ts:1`). A reader that returns decoded text fails closed for every TypeScript file (`was not read as bytes`), so the byte-order-mark check is never skipped quietly.
7. *(2F, phase-2E review finding 1)* It generates every one-character spelling of `ts-nocheck` from `toLowerCase()` over all code points: 10 on Node 22.23.1, printed as a test diagnostic (`… @ts-nochecU+212A`). For each package's own TypeScript (resolved from `apps/mobile` and from `packages/domain`), it checks with `createSourceFile(…).checkJsDirective` that `@ts-nocheck` switches checking off, and that `@ts-check` and `@ts-nocheckx` do not. It then checks that every generated spelling, and the all-upper-case Kelvin form, switches it off too. The scan refuses all 11 spellings, line by line, in a mobile file and a domain file.
8. *(2F, R16)* `DECLARATION_ROOTS` is exactly `apps/mobile/src` and `packages/domain/src`. The installed TypeScript reads `types.d.ts`, `env.d.mts`, `env.d.cts`, `styles.d.css.ts` and `data.d.json.ts` as declaration files, and `types.ts`, `d.ts`, `odd.ts`, `env.d.tsx`, `index.mts` and `tool.cts` as not. The scan refuses the first five, and `Upper.D.TS`, directly under and nested under each `src/`, and none of the six. Outside `src/` it refuses none of `apps/mobile/expo-env.d.ts`, `.expo/types/router.d.ts`, `types/env.d.ts`, `srcs/env.d.ts` and `packages/domain/types.d.ts` (7 files read). A declaration file in `src/` is still read for comments. *(2G, phase-2F review finding 1)* `DECLARATION_ROOTS` is renamed `SOURCE_ROOTS`, the same two folders. For each of CR, LF, U+2028 and U+2029, the installed TypeScript reads `loose.d.`+break+`.ts` and `styles.d.c`+break+`ss.ts` as declaration files, and `loose.d`+break+`.ts`, `loose.d.`+break+`.tsx` and `loose.d.`+break+`.mts` as not. The scan refuses the eight and none of the twelve, under each `src/`. Each package's real tsconfig `include`, parsed by the installed TypeScript (`parseJsonConfigFileContent` with `ts.sys`), lists the four `loose.d.`+break+`.ts` files in that package's `src/`, so they reach `tsc`.
9. *(2G, phase-2F review finding 2)* For UTF-16LE (`FF FE`) and UTF-16BE (`FE FF`), a file holding `// @ts-nocheck` and a type error is written as bytes to three places: the review's `packages/domain/src/sub/fixtures.test.ts`, a mobile screen, and `apps/mobile/app.config.ts` outside `src/`. For each, the installed TypeScript's own reader (`ts.sys.readFile`) decodes the comment, and `createSourceFile(…).checkJsDirective.enabled` is `false`. The same bytes read as UTF-8 do not contain the comment. The scan, with no reader injected, refuses each file with its encoding and mark, before decoding. A UTF-8 file with a UTF-8 byte-order mark is read past it, as TypeScript does, and its `@ts-nocheck` is refused as usual. `FF FE` after the start of a file, and a one-byte `FF` file, are not refused, because TypeScript reads both as UTF-8 too.
10. *(2G, phase-2F review finding 3)* The installed TypeScript resolves the real `apps/mobile/tsconfig.json` with `allowJs` on and `checkJs` off. With those options, `createProgram` reports `2339` for `count.toUpperCase()` in a `.ts` file and nothing for the same text in a `.js` file. `SOURCE_ROOTS` is exactly both `src/` folders. The scan refuses `legacy.js`, `Screen.jsx`, `tool.mjs`, `tool.cjs` and their upper-case forms, directly under and nested under each `src/`. It does not read them for comments and does not count them as TypeScript files. It refuses none of `apps/mobile/jest.config.cjs`, `eslint.config.js`, `scripts/palette.mjs`, `srcs/legacy.js`, `packages/domain/scripts/tool.cjs`, or a `.json`, `.js.md` or `.snap` file in `src/`.

`exact-coverage-reporter.test.mjs` (8):
1. The flags are parsed as written, and a flag that is not a number is kept as NaN.
2. 106/117 meets 90.59 but not 90.60, and 272/313 meets 86.90 but not 86.91.
3. Integers: 29/100 meets 29 and 57/100 meets 57, 0/0 meets 100, 29.01 fails, and 28.999 fails as not checkable.
4. Missing counts, a non-number threshold, covered above total, and a threshold over 100 fail closed.
5. A spawned run fails at a 2-decimal threshold one hundredth above the actual value, and passes at the exact value.
   - The assertion that Node itself did not fail the run applies only on Node 22.23.1, where truncation was seen.
   - On another release the test only needs the reporter to catch the miss, so a Node that someday checks decimals will not break it.
6. A matched file no test loads fails the run; once loaded, it passes.
7. Unreadable glob syntax, and thresholds without an include glob, fail closed.
8. Thresholds without a coverage run fail.

`touched-format.test.mjs` (17, phase 3; 13–16 added in phase 3B, 17 in phase 3C). Every fixture is a scratch Git repository under the OS temporary directory. What counts as formatted comes from the installed Prettier, never from text in the test:
1. The fixture texts are what Prettier 3.6.2 says they are: one formatted and one unformatted text for `.ts`, `.mjs` and `.tsx`, and `format` of the unformatted text is the formatted one.
2. Selection, in a repository where `main` moved on after the fork and edited an untouched unformatted file: exactly six files are checked. They are a committed edit, a rename (`old name.ts` to `renamed file.ts`), `Screen über.TSX`, `odd "name"`+tab+`with`+line break+`breaks.mjs`, a staged new `.cjs` and an unstaged `.mjs` edit. Two deletions, a PNG with a NUL byte, a Markdown file, the regenerated `database.types.ts` and a force-added `apps/mobile/node_modules` file are listed as not checked. An untracked file and `main`'s own files never appear. The base is the fork point.
3. With all six formatted, the check passes while the untouched, generated, vendored, untracked and `main`-only files stay unformatted, and the summary names each count.
4. Each of five touched files, committed, renamed, staged or unstaged, fails by name when unformatted, and passes once `prettier.format` with the pinned options rewrites it. The path with control characters is printed JSON-quoted.
5. A touched file Prettier cannot parse fails closed.
6. A tracked `.prettierignore` of `*`, a nested `.prettierrc` with `requirePragma`, an `.editorconfig` and a `package.json` `prettier` key are added, and a `/** @noformat */` file is checked. The test first shows that each would switch Prettier off where a tool reads it (`getFileInfo` ignored, `resolveConfig` gives `requirePragma`, `checkIgnorePragma` passes the file). The check still fails the file. A root `.prettierrc.json` with `requirePragma` or a plugin, not JSON, or missing fails, and the pinned one passes.
7. The root `package.json` pins `prettier` at exactly `3.6.2`, the repository's `.prettierrc.json` equals the options, and an installed version other than 3.6.2 fails.
8. The base: in CI no baseline, an all-zero one, an unknown commit and one forking at `HEAD` each fail. A trusted baseline gives the same six files. Locally a configured baseline at `HEAD` gives only the two uncommitted edits. Unrelated history, no `main` and a folder outside Git each fail.
9. *The rule starts where it is added:* while no commit holds it, only uncommitted edits count. Once a commit adds it, files that commits before it touched are not demanded, locally and in CI. A later commit that touches an old file brings it under the rule.
10. A touched link fails as a link and is not followed. In a real conflicted merge, the unmerged path fails and is not checked as a file.
11. The command itself, copied into a fixture with the installed Prettier linked in, exits 0 with the summary. It exits 1 naming an unformatted file, and 1 when no base is found. *(3B)* The copying moved into a helper, `installCommand`, which test 14 reuses. The test's own steps and assertions are unchanged.
12. A failing `git diff`, `git ls-files`, `git ls-tree` or `git rev-list` throws. It is never read as "nothing touched" or as "a base without the rule".
13. *(3B, phase-3 review finding 1)* `RULE` equals this module's own path relative to the repository root, and root `check` runs `node <RULE>`.
14. *(3B, the review's scenario)* `main` holds the check only under a new name, `scripts/quality/format-check.mjs`, with the modules it imports and the installed Prettier linked in. A later change touches an unformatted file. Run as root `check` runs it, the renamed copy exits 1 naming that file, locally and in CI. Once the file is formatted, it exits 0, measured from the fork point (`Base: main@…` and `Base: FITLOG_CONTRACT_BASELINE@…`, with no "from" clause).
15. *(3B)* In CI, a fork point without the check and no commit after it adding it throws `neither this fork point nor any commit after it up to HEAD holds scripts/quality/touched-format.mjs`, from `touchedFiles` and from `checkTouchedFormat`. It throws too once the check is committed only under another name. Locally the same history is the state before the check is committed: the base is `HEAD`, labelled `… is not committed yet, so only uncommitted edits count`.
16. *(3B)* Real Git finds the commit that adds the check. A Git whose `rev-list` lists none, though `HEAD` holds the check, makes the local run throw `HEAD holds …, but no commit after this fork point adds it`, and the CI run throw test 15's refusal. A failing `git ls-tree` at `HEAD` throws, and is never read as "not held".
17. *(3C, final review finding 2: the hosted shape)* A pull request as GitHub checks it out. The baseline `main` predates the check. The change holds an earlier goal's commit, which touches an unformatted file and adds another. Then comes the commit adopting the rule, with QA-9's kinds of file: the check, the seven quality modules beside it (copied from this repository, with the installed Prettier linked in), an edited `apps/mobile/jest.config.cjs`, `.prettierrc.json`, a changed `package.json` and a Markdown file. `git commit-tree` builds the merge with the baseline as first parent and the change as second, and `HEAD` is detached on it. With `GITHUB_ACTIONS=true` and `FITLOG_CONTRACT_BASELINE` set to the baseline, the fork point is the baseline. The base is the adopting commit's parent, and the label reads `FITLOG_CONTRACT_BASELINE@<baseline>, from <adopting commit>, which adds scripts/quality/touched-format.mjs`. Exactly the nine adopting files are selected, and no earlier goal's. The three JSON and Markdown files are listed as not checked, and the check passes. Run as root `check` runs it, the command exits 0 and prints the summary with that label: the line a verifier reads in the box-3 log.

## 2. Phase 2 mutation checks (historical; each restored, `pnpm check` after each)

**How the runs were made.**
- Each run was `rtk proxy pnpm check 2>&1 | grep -E '<result lines>' | head`. The pipe hides pnpm's own exit code, so a failure is shown by pnpm's `ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL … Exit status 1` lines.
- Where a run passes, the last check step printed `plan.json and board.html match GOALS.md`, or every test count shows no failure.
- Two shell commands were denied in dontAsk mode, and neither was retried:
  - `rtk proxy node --test scripts/quality/coverage-ratchet.test.mjs`;
  - `rtk proxy pnpm check > …/tmp/m2.log 2>&1; …`.

| # | Mutation | Result line (verbatim) | `pnpm check` |
|---|---|---|---|
| M1 | Mobile statements 12.23 → 12.22, uncommitted (lowering) | `- apps/mobile/coverage-thresholds.json global.statements is 12.22, below 12.23 at the floor (scripts/quality/coverage-floor.json); coverage thresholds never go down` | **Fails** in `@fitlog/domain test` (domain copy of the guard) |
| M2 | Domain functions 90.59 → 90.58 (lowering) | `- packages/domain/package.json --test-coverage-functions is 90.58, below 90.59 at the floor (scripts/quality/coverage-floor.json); coverage thresholds never go down` | **Fails** in domain `test` |
| M3 | Mobile statements 12.23 → 12.24 (raising) | Guard: `Coverage ratchet verified. Mobile (…): statements 12.24, …`; guard tests `ℹ pass 16`; Jest: `Jest: "global" coverage threshold for statements (12.24%) not met: 12.23%` | **Fails** in mobile `test:ci` (Jest) |
| M4 | Domain lines 92.63, branches 86.91, functions 90.60, before the exact reporter existed (raising) | `ℹ Error: 91.94% line coverage does not meet threshold of 92%.`, with no error for branches or functions | **Fails**, but only on lines. This is the truncation finding |
| M4b | Domain branches 86.91, functions 90.60, with the exact reporter (raising) | `Error: exact branches coverage 272/313 (86.9010%) does not meet the threshold of 86.91%`; `Error: exact functions coverage 106/117 (90.5983%) does not meet the threshold of 90.6%`. No Node threshold line | **Fails** in domain `test` |
| M5 + M6 | Delete mobile `statements`; delete the domain `--test-coverage-lines=91.42` (removal) | `- apps/mobile/coverage-thresholds.json.global.statements is missing; a coverage metric is never removed`; `- packages/domain/package.json scripts.test is not the ratchet command "…" with a number in each slot; it must run this guard and Node coverage with all three thresholds` | **Fails** in domain `test` |
| M7 + M8 | Add `"!src/features/**"` to the thresholds file; add `coveragePathIgnorePatterns: ['/src/app/']` to `jest.config.cjs` (scope) | `- apps/mobile/jest.config.cjs sets coveragePathIgnorePatterns, which can narrow, split or switch off coverage; change this guard in a reviewed diff first`; `- apps/mobile/coverage-thresholds.json collectCoverageFrom adds the exclusion "!src/features/**", which no floor or baseline records; coverage scope never narrows` | **Fails** in domain `test` |
| — | Unmutated: my M9 edit matched two scripts and was not applied | Guard verified twice; domain `ℹ pass 37`, quality `ℹ pass 21`, mobile `Tests: 126 passed`, plan `ℹ pass 22` | **Passes**, confirming M7 and M8 were restored |
| M9 | Mobile `test:ci` without `--coverage` (disabling coverage) | `- apps/mobile/package.json scripts["test:ci"] is not "node --test ../../scripts/quality/*.test.mjs && node ../../scripts/quality/coverage-ratchet.mjs && jest --runInBand --ci --coverage"; it must run this guard, its tests and Jest with coverage` | **Fails** in domain `test` |
| M10 | Mobile `test:ci` without the guard (wiring) | The same line as M9, reported by the domain copy | **Fails** in domain `test` |
| M11 | Domain `test` without the guard (wiring) | Domain `ℹ pass 37` runs unguarded; then `✖ this repository passes under its own environment, …` with `AssertionError [ERR_ASSERTION]: coverage-ratchet failed:`, and quality `ℹ pass 20`, `ℹ fail 1` | **Fails** in mobile `test:ci` |
| M12 | `const unusedLintProbe = 1;` in `apps/mobile/jest.config.cjs` (lint) | `4:7  warning  'unusedLintProbe' is assigned a value but never used  no-unused-vars`; `✖ 1 problem (0 errors, 1 warning)`; `ESLint found too many warnings (maximum: 0).` | **Fails** in `lint` |
| M13 | The floor **and** the threshold both lowered to 12.22 before the first commit (residual probe) | `Coverage ratchet verified. Mobile (…): statements 12.22, …`; every suite passes | **Passed in phase 2.** Phase 2B's M16 repeats this probe; it now fails (§4) |

Every mutation was restored with the same editor, and the files were read back afterwards. The phase-2 messages above are the phase-2 wording; phase 2B changed some of them (for example the Jest and `test:ci` messages).

## 3. Residual risks (open after phase 3B)

| # | Risk | State | Owner |
|---|---|---|---|
| R1 | **Before the ratchet is on `main`.** No trusted baseline records the floor, so a branch commit that lowers the floor and a threshold together passes the guard (guard test 12). | Narrowed: guard test 2 holds the floor to §5 exactly until then (M16 fails), and the guard prints `not anchored`. Still open: a diff can edit both the floor and §5. The verifier compares the floor at the exact merge commit with §5 | QA-9 verifier and integrator. It closes at integration into `main` |
| R2 | **Removing every guard copy at once.** One change that removes the root, domain and mobile copies together is not caught, since no copy runs. | Narrowed from two copies to three (root `check` added in phase 2B) | PL-1, if a separate CI step is wanted. Today it rests on review |
| R3 | **Domain line coverage varies by run** (review finding 5). Covered lines ranged 533–538 of 583 over 30 local runs: 5 in phase 1, 7 in phase 2, the phase-2 review's 537, phase 2B's three full `pnpm check` runs at 533, 533 and 535 (M16's count fell in truncated output and is not counted), the phase-2B review's 535, phase 2C's `pnpm check` at 533, phase 2D's two at 534 and 536, the phase-2D review's 535, Codex's independent phase-2D run at 533, phase 2E's at 536, phase 2F's at 536, phase 2G's at 537, the phase-2G review's 537, and phase 3's four at 536, 534, 536 and 536. *(3C)* Since then 5 more, 35 in all, still within 533–538: phase 3B's two at 536 (runs 25 and 29), the final review's 535, and phase 3C's two at 536 (run 15) and **533 (run 19)**. Run 19 is exactly the threshold (`Exact lines coverage 533/583 (91.4237%) meets the threshold of 91.42%`): it passed with no margin, and one line fewer would have failed `pnpm check` with no change to the code. Codex's independent phase-2E run is not counted: its domain count was not supplied. The threshold 91.42 is 533/583, exactly the lowest seen: 532 would fail. The phase-1 claim that 4 lines are "uncovered in every run" is contradicted by the 537 and 538 runs, so the set of flipping lines is not known. *(3D, phase-3C review finding 2)* The review's own `pnpm check` gave **533 again**, two runs in a row at exactly the threshold, and 532 has never been seen. The review counts 6 of 36 runs at 533. The records list at least 8: phase 1's runs 3 and 4, phase 2B's two, phase 2C's, Codex's phase-2D run, phase 3C's run 19, and the review's own. Phase 2's seven runs aren't listed one by one. A 532 would fail `pnpm check` with no code change: a false failure, never a false pass. The coverage artifacts already on disk can't settle which lines flip (§13, "Finding 2"). The only per-line domain data is phase 1's five runs (coverage-baseline.md §4). The domain reporters write only to stdout, no domain lcov file is kept, and `apps/mobile/coverage/` holds Jest's mobile files only. Those five runs fit 533 as all three known flipping lines uncovered (583 − 43 − 4 − 3). Phase 2's 538 needs **at least two** more lines that are sometimes covered (538 − 536), where phase 2B said "at least one". Nothing on disk shows whether every later 533 is the same three lines, or whether any line can flip below 533. | **Open, not relaxed.** *(3D)* **Assigned to QA-9's next phase** by Codex's phase-3D brief, with no threshold lowered and no extra runs made just for samples. Phase 3D's two required `pnpm check` runs add two samples, recorded after the commit (§13). The measured floor stays. No per-line flip list was made: the lcov variant is outside this phase's allowed commands, and editing the domain script to add it would fail the pinned template. No Linux run exists. *(3E)* **Four flipping lines named from normal outputs**, with no extra run: `calculations.ts:3`, `calculations.ts:118`, `dates.ts:19` and `finance.ts:14`. Five runs print per-line lists (3D's 13 and 18, and 3E's 7, 10 and 11). The same 46 lines are uncovered in all five. 533 is those 46 plus all four flippers; 536 is the 46 plus `calculations.ts:118`; 537 is the 46 alone. Phase 2's 538 therefore needs at least one of the 46 to be covered sometimes. 3E adds three samples, 533, 537 and 536. That makes 41 runs in all, still within 533–538: 35 through phase 3C, the phase-3C review's, 3D's two and these three (§14) | QA-9 next phase: lcov over several runs, list every flipping line, then set the threshold from that list or record the margin. QA-10: when raising domain thresholds, use a flip-aware minimum. PL-1: the first hosted Linux run is the first Linux sample; report it if below 533 |
| R4 | **The exact reporter depends on Node's `test:coverage` event fields:** `summary.totals.covered*Count` / `total*Count`, `summary.files[].path` and `summary.workingDirectory`. | If a Node upgrade renames them, it fails closed (`cannot be checked exactly`, or `cannot be listed`) | Whoever bumps `.node-version` |
| R5 | **The guard's own code is not ratcheted.** A change to `scripts/quality/` is visible in review, and docs/23 §9 rule 3 requires a reason and approval. | Unchanged | Review |
| R6 | **Workflow, pnpm and dependency trust.** Code in the change runs inside `pnpm check` and the workflow, for example: an earlier workflow step that rewrites files, a changed action, `.npmrc` or `pnpm-workspace.yaml` settings (a script shell, Node options), or a config that behaves differently under Jest than under the guard. *(2E, phase-2D review finding 3)* Also a force-added path under `apps/mobile/node_modules`, which Jest, jest-expo and `eslint.config.js` resolve before the hoisted copy at the repository root, while the inventory skips it (§1, trust model). The phase-2D review did not verify whether CI's `pnpm install --frozen-lockfile` would remove such a path. The workflow checks read text: they refuse the named bypasses but cannot vouch for arbitrary YAML or step code. | Out of the guard's reach by design. Phase 2E corrected the inventory's comment and added no dependency-trust code, as Codex asked | **PL-1:** required reviews or CODEOWNERS on `.github/workflows/`, `scripts/quality/`, `package.json` files, `.npmrc` and `pnpm-workspace.yaml`; a check that Git tracks no path with a `node_modules` segment (one read-only `git ls-files`); and branch protection that requires the check. Coordinate with AR-1 L1/L4 |
| R7 | **Domain files no test loads** (review finding 7). | **Resolved:** the reporter fails the run (reporter test 6; `Coverage counts all 8 files …`). Remaining limit: a type-only module no test imports also fails, until a test imports it | — |
| R8 | **Lint scope.** Before phase 2D, `eslint.config.js` itself (its `ignores` and rules) was not pinned, and no rule enforced "never add an unexplained `eslint-disable`". | **Closed in phase 2D within `apps/mobile`** (§1, "Lint scope"; §6): the config is pinned as text, every other ESLint config source there fails, and a disable must name its rules and give a reason. What stays outside: the installed `eslint-config-expo` and plugins (dependency trust, R6); `ESLINT_FLAGS` and `ESLINT_USE_FLAT_CONFIG` outside CI's pinned job env. The domain is not linted by ESLint at all, which is the gate as built (root `lint` covers mobile only); its types stay strict. TypeScript suppressions are R14. *(2F)* The phase-2E review's finding 2, a blanket `eslint-disable-line` hidden by U+2028 or U+2029, is fixed: a `//` comment now ends at all four JavaScript line terminators (lint-scope 5 and 8). The disable scan still reads text rather than parsing, so a form nobody has named yet could still read differently from ESLint | S7 Quality owns the pin. A goal that changes `eslint.config.js` updates the pin in the same diff (docs/23 §9 rule 3) |
| R9 | **Post-Jest file check.** The review suggested comparing `coverage-summary.json` with the files on disk. It would also catch a preset's own options, or a config that behaves differently under Jest than under the guard (for example one that tests `process.env.JEST_WORKER_ID` before falling back to a narrow scope). | Not built, and not claimed closed. The allowlist, and since phase 2C the non-object rule and the Jest `cannot be checked` problem, close the named cases; since phase 2E `--no-watchman` closes the watchman route. The phase-2D review adds that it would also catch untested files Babel fails to transform for reasons in the source itself, which the Babel guard (config only) does not | **QA-10**, as Codex assigned it in the phase-2E brief |
| R10 | **Unproven on hosted CI and Linux.** The CI mode, the workflow checks against the real event values, the reporter's file listing and (since phase 2C) the source scan have run only locally on macOS. *(Phase 3)* So has the touched-file format check, including its rule start against a real event base far behind local `main`. Root `check` runs it before typecheck and lint, so the box-3 draft pull request passes it only if the files touched from the commit adding the rule onward are formatted. Its planned probe line `const unusedLintProbe = 1;` already is. *(3C)* The commit shape the hosted run checks out, a detached merge whose first parent is the baseline, is now tested locally (touched-format 17), but it has never run on GitHub. Nor has the committed state: today the format step selects only `jest.config.cjs`, because the 17 quality scripts are untracked. | Open; nothing is claimed for Linux. *(2E)* The box-3 plan is corrected to a draft pull request (§7), since `mobile-ci.yml` runs on pull requests and on pushes only to `main` and `v2/develop` | PL-1 / QA-9 box 3. Pushing a branch and opening the draft pull request are external actions. They need ~~Codex's specific authorisation~~ **the owner's specific approval** under docs/23 §6 *(corrected in phase 3D, phase-3C review finding 1)*. Neither AUTH-01's delegation to Codex nor any existing approval covers publication. None was taken |
| R11 | **Suppression added at transform time** (phase 2C). The source scan reads the files under `src/`; it does not see what a Babel config does while Jest transforms them. The phase-2C wording named only `apps/mobile/babel.config.js`, which does not exist. The real set is wider, as the phase-2C review's finding 4 said and §6 confirms from the installed packages. | **Closed in phase 2D within `apps/mobile`** (§1, "Transform-time configuration"): every `babel.config.*`, `.babelrc*` and `.babelignore`, a `babel` key, and a nested `package.json` fail. The domain's loader flags are held by its template (ratchet test 29). What stays outside: what the installed presets do (`babel-preset-expo`, tsx and esbuild, dependency trust, R6); environment variables (`BABEL_ENV`, `NODE_ENV`, `TSX_TSCONFIG_PATH`) outside CI's pinned job env; the mobile and domain `tsconfig.json` options beyond scope and strictness, which jest-expo maps to module paths and tsx reads. No such configuration exists today | Review; R6 (PL-1) for dependency and environment trust |
| R13 | **Code out of the count by its name** (phase-2C review, "Trust boundary"). Mobile excludes `src/**/__tests__/**`. The domain excludes `src/**/*.test.ts` and runs only `src/*.test.ts`, so a module named `*.test.ts` in a subfolder is neither counted nor run. Jest's default `coveragePathIgnorePatterns` is `/node_modules/` (`jest-config` `Defaults.js`), and `jest.config.cjs` does not set it, so a folder named `node_modules` inside `src/` is not counted either. These are visible renames, not config changes, and none exist today. | Open; recorded for QA-10 as Codex asked | **QA-10**, for example with a check that no non-test module sits under a test name or a `node_modules` folder in `src/` |
| R14 | **TypeScript suppressions** (phase 2D). `@ts-ignore`, `@ts-nocheck` and `@ts-expect-error` switch type checking off for a line or a file. The strict tsconfigs are pinned, but these comments were not, and `eslint-config-expo` 57.0.2 does not enable `@typescript-eslint/ban-ts-comment` (its `flat/utils/typescript.js`). | **Closed in phase 2E** for every TypeScript file of `apps/mobile` and `packages/domain` (§1, "TypeScript suppression comments"; §7). None existed, so no source changed. *(2F)* The phase-2E review's finding 1, `@ts-nocheck` spelled with U+212A, showed 2E's "any letter case" covered ASCII only. It is fixed with Unicode case folding, and checked against the installed TypeScript for every one-character spelling (type-suppression 7). *(2G)* The phase-2F review's finding 2, a UTF-16 file whose comment TypeScript decodes and the UTF-8 scan did not, is fixed: a TypeScript file that starts with `FF FE` or `FE FF` fails before decoding (type-suppression 6 and 9, ratchet 31). What stays outside: TypeScript files outside both packages that an import could reach (none today), and a force-added top-level `node_modules` path (R6). Encodings TypeScript itself does not detect, such as UTF-16 without a byte-order mark, are read as UTF-8 by both, so they need no rule. Declaration files are R16; JavaScript in source is R17 | S7 Quality (the scan); review |
| R15 | **Generated folders are inventoried** (phase 2D, a design choice). The config inventory walks `dist/`, `coverage/`, `.expo/` and any other folder under `apps/mobile`, skipping only `node_modules`. A tool that wrote a Babel or ESLint config name, a `package.json` or a link there would fail the guard locally until the folder is removed. Today `coverage/` holds two files and the others do not exist. *(2E)* The TypeScript scan reads generated folders too, and fails on a link there, for the same fail-closed reason. The phase-2D review names a likely trigger: `expo run:ios` creates `ios/Pods/Headers` links, and `ios/` and `android/` are not gitignored. | Accepted trade-off for now: the phase-2D review found it acceptable, and Codex's phase-2D brief chose it. The alternative, skipping generated folders, would need a reviewed list that could hide a config | Review; Codex may choose otherwise |
| R16 | **Declaration files are never type-checked** (phase 2E, found while reading TypeScript 6.0.3). `skipLibCheck` is `true` in `expo/tsconfig.base` and in the domain `tsconfig.json`, and TypeScript then skips every declaration file (`skipTypeCheckingWorker`). A `.d.ts` in source can loosen types with no comment at all. None exists in either package today (Glob, phase 2E). It is a type-strictness question, not a suppression comment, so phase 2E did not act on it | **Closed narrowly in phase 2F**, as Codex's phase-2F brief chose. A declaration file under `apps/mobile/src/` or `packages/domain/src/` fails `pnpm check` (§1, "Declaration files in source"; type-suppression 8; ratchet 31). **Open, low, accepted:** declaration files elsewhere in the two packages, which are read for comments but not refused. Examples are a generated `apps/mobile/expo-env.d.ts`, `.expo/types`, or a hand-written one in any folder outside `src/` that the mobile tsconfig's `**/*.ts` includes. None exists today. Turning `skipLibCheck` off was not recommended by the phase-2E review and was not done. *(2G)* The phase-2F review's finding 1 is fixed: a line break (CR, LF, U+2028 or U+2029) in a declaration file's name no longer gets it past the refusal in `src/`. The scan now applies TypeScript's own two tests with no wildcard, checked against the installed TypeScript (type-suppression 8, ratchet 31) | **S7 Quality, under QA-9** (named owner of the remainder). Review a declaration file added outside `src/`; widening the refusal needs a reviewed change to `type-suppression.mjs`. Not QA-10, whose card is the 80% coverage target |
| R17 | **JavaScript in source** (phase-2F review, finding 3). It was already true on `main`; QA-9 did not introduce it. `allowJs` is on without `checkJs` in mobile, and coverage and the design-token lint count only TypeScript files. So a screen renamed to `.jsx` would leave strict types, the coverage count and the token rule together, and the ratchet would pass | **Closed in phase 2G for both `src/` folders**: every `.js`, `.jsx`, `.mjs` and `.cjs` file there fails, in any letter case (§1, "JavaScript in source"; type-suppression 5 and 10, ratchet 31). None exists today. **Remainder, open, low:** JavaScript elsewhere in either package, such as the mobile configs and `scripts/`, is neither read nor refused. Neither tsconfig includes it, and an import from `src/` could still reach it. Today a Grep of both `src/` trees finds no import of a JavaScript path. ~~No relative import leaves `src/`, apart from two domain tests that read JSON files by URL.~~ *(Corrected in phase 3, phase-2G review finding 1.)* No relative path in `apps/mobile/src` leaves it. Every relative path that leaves `packages/domain/src` is a URL: `fixtures.test.ts:11` and `contract.test.ts:86` read JSON files, `cli/snapshot-contract.ts:13` names the `contracts/` folder, and `contract.test.ts:87` runs `import()` on `../${entry}`, where `entry` is `exports['.']` from `packages/domain/package.json`. Today that is `./src/index.ts`, so the import resolves back into `src/`. That `exports` value is not pinned, and mobile resolves `@fitlog/domain` through it (also R6). No `allowJs`, `checkJs`, tsconfig, Jest-scope or lint-scope change was made | **PL-1, CI wiring only**, as Codex assigned it: wiring a CI check for JavaScript outside `src/` that source imports. *(Corrected in phase 3, phase-2G review finding 1: this cell read "S7 Quality, under QA-9".)* |
| R18 | **What the touched-file format check does not cover** (phase 3, §1 "Formatting"). (a) Locally, an untracked file is not checked until it is added; in CI every committed file of the change is. (b) Locally, a file marked `assume-unchanged` or `skip-worktree` is taken as Git reports it; CI checks out fresh. (c) A `prettier-ignore` comment keeps one node as written, as Prettier honours it for everyone; it is neither counted nor refused. (d) A reviewed change that renames `touched-format.mjs` restarts the rule at the rename commit, since the rule starts where `RULE` is added. *(Corrected in phase 3B, phase-3 review finding 1: in phase 3 this was not true. `RULE` was a hand-written string, so a rename that left it behind made every later change find no start and, in CI, check no file and pass. Since 3B `RULE` is the module's own path, and a lost start fails closed: touched-format 13–16. The sentence now holds as written: files that commits before the rename touched are not demanded by that change.)* (e) `apps/mobile/eslint.config.js` is not in Prettier's format and is pinned as text, so a goal that changes it must format it and update the pin in one diff. (f) Touching a file means formatting all of it, so the first goal to touch an old file carries that whole file's reformatting. (g) A CRLF work tree, as with `core.autocrlf` on Windows, fails locally, because the options keep Prettier's `lf` default. *(3B, phase-3 review finding 3)* (h) **Merging `main` in after the rule commit, before `main` holds the rule, over-selects.** The moved base is the parent of the commit that adds `RULE`. That parent lacks whatever a later merge of `main` into the branch brought in, so files changed only on `main` count as touched and must be formatted. It fails safe, a false failure and never a false pass, and it cannot happen once `main` holds the rule. The QA-9 branch should therefore be rebased onto `main`, not merge it, before integration (local `main` is 20 commits past `2a95726`, per the review). Whether those 20 commits touch JavaScript or TypeScript was not checked. *(3C: the final review checked. `git diff --stat 2a95726 c8a5d57` lists 25 files, all under `docs/plan/` or `docs/evidence/AR-1/`, so a rebase or merge of `c8a5d57` brings in no JavaScript or TypeScript today. Phase 3C did not re-run it.)* Not fixed, as Codex's phase-3B brief asked. (i) *(3B)* Locally, while a rename or move of the check is uncommitted, `HEAD` does not hold the new `RULE`, so only uncommitted edits count until it is committed, as before the first commit. CI never sees that state | Open, low, by design. No hosted run exists yet (R10) | S7 Quality (the check and its pins); every goal that touches JavaScript or TypeScript (its own files); review (`prettier-ignore`, a rename of the check); the QA-9 integrator ((h): rebase, not merge) |
| R19 | **Domain branch coverage depends on Git state** *(3D, written after commit `4a7ee21` and not part of it; found by the post-commit `pnpm check`, run 18)*.<br>- **The branch:** `gitBaselines` in `packages/domain/src/cli/snapshot-contract.ts:151` has `if (seen.has(base)) { …; continue; }`. Its true path runs only when the default refs `HEAD` and `main` share one fork point, which happens only when `HEAD` is `main` or behind it.<br>- **How tests reach it:** only through real Git with those refs, at `contract.test.ts:117` and `:194`. The Git doubles at `:229–239` inject failures only. *(3F, phase-3E review: those are phase 3D's numbers, for the file as committed in `4a7ee21`, before phase 3E formatted it. In today's file the two live calls are at `:214` (the history test) and `:399` (`CI refuses…`), and the failure doubles are `noGit` at `:454` and `failing` at `:463–466`, used through `:491`. Phase 3F read today's lines. Its `git grep` of the old ones was denied.)*<br>- **Before the commit:** every earlier recorded run in this worktree, phase 1's measurement included, had `HEAD` = `main` = `2a95726`, since nothing was committed. The branch was covered and 272/313 held. The threshold 86.90 is exactly 272/313, so it was measured in a state no committed branch is in.<br>- **At commit `4a7ee21`:** run 18 printed `ℹ main@2a95726912c6: checked`, not `same commit as an earlier baseline`. `snapshot-contract.ts` branches fell from 88.06% to 87.31% (118 to 117 of 134), and no other file's branch figure moved. Result: `Error: exact branches coverage 271/313 (86.5815%) does not meet the threshold of 86.9%`. Full outputs: [phase-3d-check-outputs.md](phase-3d-check-outputs.md). | ~~**Open, high, blocks integration.**~~ *(3E)* **Fixed locally by a domain test, in one Git state, and not yet independently re-run** (§14). Three tests in `contract.test.ts` drive `gitBaselines` through an injected in-memory Git, so the duplicate-baseline branch and the `not found; skipped` branch are covered whatever the host's `HEAD` and `main` are. At `4a7ee21` plus the uncommitted test, with `HEAD` ahead of `main`: domain **273/313** in `pnpm --filter @fitlog/domain test` (run 10) and in `pnpm check` (run 11, exit 0, 285 tests). No threshold changed. Not measured: `HEAD` = `main`, and CI mode. Both are predicted at 273/313 from the coverage model in §14, which predicted run 10's figures exactly. *(3F, phase-3E review finding 2: one matched prediction doesn't confirm the model, and the review doubts its mechanism. So these two forecasts are weaker than "exactly" suggests, and the pass rests on the margin, not on them. See §14, "Margin".)* *(3F: the review's independent `pnpm check` measured 273/313 in the same state as run 11.)* **New residual, R19(b):** the branch denominator depends on V8 execution-count coincidences (§14). The first version of the test hit one and measured 271/312. ~~With both branches now covered, one such merge leaves 272/312 (87.18%), still above 86.90.~~ *(3F, phase-3E review finding 2: that stated one direction only.)* The reporter compares integers (`covered × 10000 >= 8690 × total`). At 273/313 the margin absorbs **one newly uncovered branch** (272/313 passes, 271/313 fails) or **about seven equal-count merges** of covered ranges (266/306 passes, 265/305 fails). A first call can also expose branches: a test that first calls a domain function no test called before brings that function's hidden branches into the count. A single exposed uncovered branch passes (273/314). Two fail (273/315), unless at least six exposed covered branches come with them (279/321 passes, 278/320 fails). So **any domain test change** can move the count, not only a change to `gitBaselines`' calls. *(As phase 3D wrote it:)* Phase 3D changed nothing for it: the brief allows no code, config or threshold change, and the threshold must not be lowered.<br>**Inferred from the code, not run:**<br>- every branch with a commit ahead of `main` fails `pnpm check` the same way. That covers QA-9 now, every goal branch once QA-9 is on `main` (until it is fast-forwarded), and the integrator's gate on a rebased branch;<br>- `main` itself passes, since `HEAD` = `main` there;<br>- a CI pull-request run probably fails too. With `FITLOG_CONTRACT_BASELINE` set, `:117` checks only that ref, and `:194` reaches the branch only if a local `main` sits at `HEAD`'s fork point.<br>It fails safe: a false failure, never a false pass. | **Codex decides the fix.** `packages/domain/` is S8 Member backend's (docs/23 §5), so the test change is S8's file, asked for through the QA-9 handoff.<br>- **A fix that lowers nothing:** a domain test that drives `gitBaselines` to meet one fork point twice in any Git state, for example through its injected `git` parameter, so the branch counts whatever the checkout.<br>- **Then:** re-measure branches with `HEAD` = `main`, on a branch ahead of `main`, and in CI mode with `FITLOG_CONTRACT_BASELINE`.<br>- **Excluded:** lowering 86.90 to 86.58<br>*(3E)* Codex chose the injected-`git` test and granted a routine ownership exception for `packages/domain/src/contract.test.ts` alone. Still owed: the re-measure with `HEAD` = `main` and in CI mode, and a fresh independent review that runs the tests and a mutation of `snapshot-contract.ts` on a scratch copy (§14, "What stays unproved"). R19(b) goes with R3 to QA-9's next phase, and QA-10. *(3F)* The phase-3E review ran the tests (285 in `pnpm check`), not the mutations. Still owed: the mutations, as exact diffs in §14, and the two re-measures. **For QA-10, and any goal that changes a domain test:** compare the branch count's numerator and denominator before and after, not only the pass. Phase-3E review finding 3, splitting the 80-line test at `contract.test.ts:676`, is QA-10's as Codex assigned it |
| R12 | **Which comments each tool honours** (phase 2C). The scan rejects the documented forms of each tool, case- and spacing-insensitively. Whether Node's `node:coverage` comments take effect through tsx's source maps was not verified, as the review noted; they are rejected either way. A future tool or new comment syntax would need a new pattern. | Open, low | Whoever adds a coverage tool or bumps Jest, Istanbul or Node |

## 4. Phase 2B review remediation

### Findings and how each was handled

| Review finding | Fix | Regression tests | Mutation proof |
|---|---|---|---|
| 1 High: Jest options narrow scope | Strict allowlist of `jest.config.cjs` options; `preset` and `testMatch` pinned; Istanbul-only reporters; `clearMocks` boolean; no `jest` key in mobile `package.json` | Ratchet test 9 (17 cases) | Probes P1/P2 and mutations M14/M15 below |
| 2 Medium: the first commit does not close R1 | Corrected throughout this file, the checkpoint and docs/23. The guard computes `anchored` and prints `not anchored` | Ratchet test 12 shows the window, locally and in CI, and its closure when `main` takes the reviewed commit. Ratchet test 2 holds the floor to §5 exactly while unanchored | M16 |
| 3 Medium: CI trust | `GITHUB_ACTIONS=true` means CI; in CI a fork point at `HEAD` is refused; root `check`/`test`/`typecheck`/`lint` pinned exactly; root `check` runs the guard first; workflow job read by layout (see §1) | Ratchet tests 10 and 17; wiring tests 2, 6 and 7 | G1, G4, G5, G6 |
| 4 Medium: lint and type wiring | Mobile `lint`/`typecheck` and domain `typecheck` pinned; no `pre`/`post` scripts; tsconfig strictness and scope held | Wiring tests 3, 4 and 5 | G2, G3 |
| 5 Low: domain line noise | Not relaxed; recorded with owners (R3) | — | — |
| 6 Low: reporter arithmetic and Node coupling | Integer comparison; at most 2 decimals in reporter and guard; the "Node did not fail it" assertion applies only on Node 22.23.1; `node --version` recorded | Reporter tests 3, 4 and 5; ratchet test 7 | RED run below |
| 7 Low: unloaded domain files | Reporter fails on a matched file Node did not count | Reporter tests 6 and 7 | RED run below |

### Test first: RED, then GREEN

`gate-wiring.mjs` was written before its tests. It is therefore mutation-checked directly (G1–G5).

| Step | Command | Result |
|---|---|---|
| Before any change | `rtk proxy node --test scripts/quality/coverage-ratchet.test.mjs scripts/quality/exact-coverage-reporter.test.mjs` | `# tests 21`, `# pass 21` |
| RED: new tests against the old guard and reporter | `rtk proxy node --test scripts/quality/*.test.mjs` | `# tests 35`, `# pass 21`, `# fail 14`. The tool output was truncated in the middle, so not every failing name was visible |
| RED, ratchet file alone | `rtk proxy node --test scripts/quality/coverage-ratchet.test.mjs` | `# tests 19`, `# pass 12`, `# fail 7`: tests 2, 3, 7, 9, 10, 12 and 17. Examples: `+ 'undefined' - 'boolean'` (no `anchored`); `… is "12.23"; it must be a number from 0 to 100` (no 2-decimal rule); `Missing expected exception.` (no `GITHUB_ACTIONS` CI mode) |
| GREEN, first try | `rtk proxy node --test scripts/quality/*.test.mjs` | `# pass 34`, `# fail 1`: a test bug. `assert.throws` matches a RegExp against `Error: …`, so the `^` anchor was dropped from test 17 |
| GREEN | same | `# tests 35`, `# pass 35`, `# fail 0`; diagnostic `Node 22.23.1 truncated --test-coverage-functions=50.01 (1/2)` |

During GREEN, the old test 2's CI case moved into test 12. The new fork-point rule correctly refuses a CI run whose `HEAD` equals its baseline, a state a real pull request never has.

### Jest probes (finding 1, before the fix; CLI flags, no file edited)

| # | Command | Coverage summary (verbatim) | Jest |
|---|---|---|---|
| P1 | `rtk proxy pnpm --filter @fitlog/mobile exec jest --runInBand --ci --coverage --coverageReporters=text-summary --modulePathIgnorePatterns='<rootDir>/src/features/gym/'` | `Statements : 16.89% ( 254/1503 )`, `Branches : 14.88% ( 164/1102 )`, `Functions : 13.93% ( 84/603 )`, `Lines : 22.6% ( 191/845 )` | `Tests: 126 passed`; every threshold met |
| P2 | same with `--roots='<rootDir>/src/data' --roots='<rootDir>/src/lib' --roots='<rootDir>/src/theme' --roots='<rootDir>/src/ui'` | `Statements : 34.98% ( 254/726 )`, `Branches : 33.81% ( 164/485 )`, `Functions : 34% ( 84/247 )`, `Lines : 40.63% ( 191/470 )` | `Tests: 126 passed`; every threshold met |

### Mutations (each restored and checked)

| # | Mutation | Command | Result (verbatim) |
|---|---|---|---|
| M14 | `modulePathIgnorePatterns: ['<rootDir>/src/features/gym/'],` added to `apps/mobile/jest.config.cjs` | `rtk proxy pnpm check` | Exit 1 at the root guard: `- apps/mobile/jest.config.cjs sets modulePathIgnorePatterns; only preset, testMatch, clearMocks, collectCoverageFrom, coverageThreshold, coverageReporters are allowed, since any other option (roots, modulePathIgnorePatterns, another preset's own options) can change which files coverage counts. Change this guard in a reviewed diff first` |
| M14 | same config, Jest alone | `rtk proxy pnpm --filter @fitlog/mobile exec jest --runInBand --ci --coverage --coverageReporters=text-summary` | `Statements : 16.89% ( 254/1503 )`, `Tests: 126 passed`: without the guard it would pass |
| M15 | `roots: ['<rootDir>/src/data', '<rootDir>/src/lib', '<rootDir>/src/theme', '<rootDir>/src/ui'],` instead | `rtk proxy pnpm check` | Exit 1 at the root guard: `- apps/mobile/jest.config.cjs sets roots; only preset, testMatch, …` |
| M15 | same config, Jest alone | same Jest command | `Statements : 34.98% ( 254/726 )`, `Tests: 126 passed` |
| — | Restore check | `rtk proxy git diff -- apps/mobile/jest.config.cjs package.json` | `jest.config.cjs` diff identical to phase 2; root diff is the one `check` line |
| M16 | Floor **and** mobile statements threshold 12.23 → 12.22, uncommitted (the M13 probe) | `rtk proxy node --test scripts/quality/coverage-ratchet.test.mjs` | `not ok 2 - the floor never sits below the phase-1 evidence, …`, with `until main records scripts/quality/coverage-floor.json, it must equal docs/evidence/QA-9/coverage-baseline.md exactly`, `+ statements: 12.22`, `- statements: 12.23`; `# pass 18`, `# fail 1` |
| M16 | same | `rtk proxy pnpm check` | Every guard copy passes (`statements 12.22`, `the floor is not anchored yet`). Then quality `# pass 34`, `# fail 1`, `ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL  @fitlog/mobile@0.1.0 test:ci`, exit 1. Restored, then checked with Grep: both files at `12.23` |
| G1+G2+G3 | `'if'` added to the job-key allowlist; `pre`/`post` hook list emptied; `noImplicitAny: false` removed from the weakening list | `rtk proxy node --test scripts/quality/gate-wiring.test.mjs` | `# pass 5`, `# fail 3`: test 4 (`… scripts["precheck"] exists …` not matched), test 5 (`compilerOptions\.noImplicitAny is false …` not matched), test 6 (`jobs\.check sets if …` not matched) |
| G4 | Baseline definitions `=== 1` loosened to `>= 1` | same | `# pass 7`, `# fail 1`: test 6, `/\(found 2 definition\(s\)\)/` not matched |
| G5 | Lines under the `pnpm check` step ignored | same | `# pass 7`, `# fail 1`: test 6, `the "- run: pnpm check" step also has "if: false"` not matched |
| G6 | CI fork-point-at-`HEAD` refusal disabled | `rtk proxy node --test scripts/quality/coverage-ratchet.test.mjs` | `# pass 18`, `# fail 1`: test 17, `Missing expected exception.` at line 317 |
| G7 | A wired JSON file whose content is `null` skipped again. This was a self-review fix after the first final run: such a file had passed silently | `rtk proxy node --test scripts/quality/gate-wiring.test.mjs` | `# pass 6`, `# fail 2`: test 3 (`… packages/domain/package.json scripts["typecheck"] is …` not matched) and test 5 (`apps/mobile/tsconfig.json has no compilerOptions object` not matched) |

After G1–G7, a Grep for each mutated text in `scripts/quality/` found no match. G7 was restored by the same editor before the final runs.

### Review persisted

`docs/evidence/QA-9/review-phase2.md` holds the review verbatim. `rtk proxy git diff --no-index /tmp/fitlog-qa9-review-final.md docs/evidence/QA-9/review-phase2.md` shows only the provenance header (session `e007aa24-8efa-49bd-b29e-1f3750fa0f1c`) and a final newline added.

The final runs are in the [checkpoint](../../plan/runs/QA-9/checkpoint.md#commands-run-in-phase-2b).

## 5. Phase 2C review remediation

### Findings and how each was handled

| Phase-2B review finding ([review-phase2b.md](review-phase2b.md)) | Fix | Regression tests | Mutation proof |
|---|---|---|---|
| 1 Medium: a thresholds file containing `null` switched off every mobile check, before and after anchoring | The guard tells "missing" from "parsed to `null`". In the working tree the floor, thresholds file and domain `package.json` must each exist, parse, and be a JSON object; anything else is a named problem. The same non-object rule applies at Git baselines. A required file that exists but cannot be read stops the guard, naming it. `jest.config.cjs` is always checked, and an unusable thresholds file makes its scope and thresholds `cannot be checked`. (§1, "Its own inputs") | Ratchet tests 20–23 and 25 | C1, C2, C3, C7 |
| 2 Low: source comments can narrow coverage unseen | New `scripts/quality/coverage-suppression.mjs`, run by every guard copy: Istanbul, c8, V8 and Node suppression comments anywhere under `apps/mobile/src` or `packages/domain/src` fail with `file:line`, and anything the scan cannot read fails closed. docs/23 §9 rule 3 now names this rule; its "the coverage scope narrows" wording was kept and made true rather than softened | Ratchet test 24; suppression tests 1–6 | C4, C5, C6 |

No threshold, floor value, measured scope, Jest config, package script, workflow or production source changed. No suppression comment was added anywhere, even temporarily.

### Test first: RED, then GREEN

Only `rtk proxy node --test scripts/quality/*.test.mjs` may run the quality tests in this session, so every step runs all of them. The tool truncates the middle of that output. Where a failing test's line fell in the truncated part, the tables below say so, and name the only tests that assert the broken behaviour.

| Step | Command | Result |
|---|---|---|
| RED: ratchet tests 20–24 and the suppression test file, against the phase-2B guard | `rtk proxy node --test scripts/quality/*.test.mjs` | `# tests 41`, `# pass 35`, `# fail 6`. Visible: `not ok 20 - a thresholds file, floor or …`, and `coverage-suppression.test.mjs` failing at import with `ERR_MODULE_NOT_FOUND` for `coverage-suppression.mjs`, which did not exist yet. Tests 21–24 fell in the truncated part. All 35 earlier tests passed, including after the fixture change |
| GREEN, first try | same | `# tests 46`, `# pass 46`, `# fail 0` |
| Ratchet test 25 (baseline `null`), added after self-review | same, under mutation C7 | Fails as below; it passed once C7 was restored |
| Final | same | `# tests 47`, `# pass 47`, `# fail 0`; `Node 22.23.1 truncated --test-coverage-functions=50.01 (1/2)` |

### Mutations (each restored; then a Grep of `scripts/quality/*.mjs` for every mutated text found none)

Test numbers are within each file: "ratchet" is `coverage-ratchet.test.mjs` and "suppression" is `coverage-suppression.test.mjs`.

| # | Mutation | Result |
|---|---|---|
| C1 | The guard reads a JSON `null` as a missing file again (`isObject(value) \|\| value === null`) | `# pass 43`, `# fail 3`. Visible: `not ok 20`. The other two fell in the truncated range (ratchet 21–24); ratchet 21 and 23 are the other tests that need the `null` problem |
| C2 | The Jest scope and threshold check skipped when there is no thresholds object (`if (!mobile) return []`) | `# pass 45`, `# fail 1`. Ratchet 20 visible and passing; the failure fell in the truncated range, and ratchet 21 is the only test asserting `cannot be checked` |
| C3 | `EISDIR` read as a missing file | `# pass 44`, `# fail 2`, both in the truncated range; ratchet 22 and 23 are the only tests asserting `cannot be read (EISDIR` |
| C4 | The `node:coverage` pattern removed | `# pass 44`, `# fail 2`. Visible: the stack trace of suppression 3 (the per-comment test). The other fell in the truncated range; ratchet 24 holds the domain `node:coverage` case |
| C5 | Links skipped silently | `# pass 45`, `# fail 1`: `not ok 30 - a missing tree, a link, and a directory or file that cannot be read each fail closed` (suppression 6), `The input did not match the regular expression /^apps\/mobile\/src\/linked\.ts is not a regular file or directory, …/m. Input: ''` |
| C6 | The scan's problems left out of the guard's result | `# pass 45`, `# fail 1`, in the truncated range; ratchet 24 is the only test that checks the guard's result for a comment |
| C7 | A baseline's JSON `null` read as "predates the file" (`value === null && !required`) | `# tests 47`, `# pass 46`, `# fail 1`, in the truncated range. Ratchet 20 (the working tree) visible and passing; ratchet 25 is the only test asserting the baseline message |

### The review's scenario, reproduced in scratch fixtures only

Ratchet tests 21 and 23 build the review's exact case in scratch repositories, unanchored and anchored: thresholds file `null`, and `jest.config.cjs` line 3 as `require('./coverage-thresholds.json') ?? { collectCoverageFrom: ['src/theme/**/*.{ts,tsx}'], global: {} }`. Test 21 first loads that config as Jest would and gets the narrowed scope, which shows the fixture really reproduces the bypass. Then the guard fails, and the guard command exits 1.

It was not reproduced by editing this repository's `apps/mobile/coverage-thresholds.json` or `jest.config.cjs`, and no suppression comment was put into real source. This phase may change only `scripts/quality/`, the QA-9 documents and docs/23.

### Review persisted

`docs/evidence/QA-9/review-phase2b.md` holds the phase-2B review verbatim. `rtk proxy git diff --no-index /tmp/fitlog-74c7436b-final.md docs/evidence/QA-9/review-phase2b.md` shows only the provenance header and a final newline added. Only the session prefix `74c7436b` was supplied, so that is the recorded provenance.

The final runs are in the [checkpoint](../../plan/runs/QA-9/checkpoint.md#commands-run-in-phase-2c).

## 6. Phase 2D: phase-2C review findings, R8 and R11

### Findings and how each was handled

| Item | Fix | Regression tests | Mutation proof |
|---|---|---|---|
| Finding 1, low: the coverage scope could grow past the folders the scan reads | In the working tree, an include pattern must start with a prefix taken from `SUPPRESSION_ROOTS` (today `src/`) and hold no `..` or backslash; this applies to the thresholds file and the floor. Ratchet test 8's widening case now stays inside `src/` | Ratchet 8, 26, 27 | D1 |
| Finding 2, low: `read(MOBILE_PACKAGE)` inside a bare `try` | Extracted as `mobilePackageProblems(read)`. The read is outside the `try`, which now wraps only `JSON.parse` | Ratchet 28 | D2 |
| Finding 3, low (evidence): "All three phases approved by Codex" | The header now says each phase was **authorised**. A separate row records the actual acceptances: the review's code-only acceptance of 2C, which ran no commands, and Codex's acceptance of the 2B and 2C design subject to the exact-integration floor proof. Neither is the owner's signature or acceptance of the goal. The checkpoint matches | — (prose) | — |
| Finding 4, low: R11 named only `babel.config.js` | New `config-inventory.mjs` and `transform-config.mjs` refuse every Babel config file and key in the mobile package, after reading how the installed tools load them (below). R11 is rewritten | Transform-config 1–6; ratchet 29, 30 | D3–D6, D11, D12, D14 |
| R8: lint scope | New `lint-scope.mjs`: the config is pinned as text, other config sources are refused, a disable must be described, and inline rule configuration is refused. Gate-wiring tests extended | Lint-scope 1–7; gate-wiring 3, 6, 8; ratchet 30 | D7–D10, D13 |
| The review's naming gap | Recorded as R13 for QA-10, together with a `node_modules` folder inside `src/` | — | — |

No threshold, floor value, measured scope, Jest config, package script, tsconfig, workflow, dependency, lockfile or production source changed. No Babel or ESLint config file and no directive was added to the repository, even temporarily; every case runs in scratch fixtures.

### How the tools load configuration (read from `node_modules`, 26 October 2026)

Codex asked for the actual jest-expo loading, not documentation. Each line below was read in the installed package; none was executed.

| Package | File | What it shows |
|---|---|---|
| jest-expo 57.0.6 | `jest-preset.js:43-45` | The preset's transform for `\.[jt]sx?$` is `['babel-jest', resolveBabelOptions(process.cwd())]`. pnpm runs `test:ci` in `apps/mobile`, so that is the mobile package |
| jest-expo 57.0.6 | `src/resolveBabelOptions.js:4-18, 66-81` | It looks for 13 names: `.babelrc`, `.babelrc.{js,cjs,mjs,json,cts}` and `babel.config.{js,cjs,mjs,json,cts,ts,mts}`. It passes `root` and `babelrcRoots` = that folder, `babelrc: true`, `configFile: true`, and `extends` the first name found; with none, `presets: [expo/internal/babel-preset]` |
| babel-jest 29.7.0 | `build/index.js:103-134, 213-237` | Incoming options override its own `root`. It throws `babel-jest: Babel ignores …` when Babel returns no config for a file. When instrumenting, it adds `babel-plugin-istanbul` with `{ cwd, exclude: [] }` |
| @babel/core 7.29.7 | `lib/config/files/configuration.js:58-60, 105-116, 166-187` | Root names: 7 `babel.config.*`. Relative names: 6 `.babelrc*`, plus `.babelignore`, checked in each folder from the file up to its package. The package's `package.json` `babel` key is read at the package folder |
| @babel/core 7.29.7 | `lib/config/config-chain.js:62-67, 92-98, 136-160` | `configFile: true` reads the root config from `root`. `.babelrc` and `.babelignore` load only when the file's package folders include `root`, that is, for files of the mobile package |
| @babel/core 7.29.7 | `lib/config/files/package.js:37-58` | The package search walks up to the first `package.json`, and stops at a folder named `node_modules`. A `package.json` that is not an object throws |
| @jest/reporters 29.7.0 | `build/CoverageReporter.js:282-291` | For a file no test loads, an error while transforming it is only logged (`Failed to collect coverage from …`), and the file is left out of the count. So a `.babelignore`, or a config that throws, narrows coverage while Jest still compares thresholds |
| jest-config 29.7.0 | `build/Defaults.js:52` | `coveragePathIgnorePatterns: [/node_modules/]` (R13) |
| jest-expo 57.0.6 | `src/preset/withTypescriptMapping.js` | `tsconfig.json` `paths` become `moduleNameMapper`. That changes which module a test loads, not which files are counted |
| tsx 4.21.0 | `dist/register-CFH5oNdT.mjs` | Reads `TSX_TSCONFIG_PATH` and turns source maps on itself |
| eslint 9.39.5 | `lib/config/config-loader.js:43-50`; `lib/eslint/eslint-helpers.js:1350-1357, 1431-1433`; `lib/eslint/eslint.js:1350`; `lib/cli.js` | Six `eslint.config.*` names. `ESLINT_FLAGS` merges flags, and `v10_config_lookup_from_file` loads a config per linted file. `ESLINT_USE_FLAT_CONFIG=false` selects the legacy eslintrc mode |
| @eslint/eslintrc (ESLint 9.39.5's) | `dist/eslintrc.cjs:2514-2519, 2704, 3051-3073` | eslintrc mode reads `.eslintrc{,.js,.cjs,.yaml,.yml,.json}`, `package.json` `eslintConfig`, `.eslintignore` and `package.json` `eslintIgnore` |
| eslint 9.39.5 | `lib/config/default-config.js` | Default ignores `**/node_modules/` and `.git/`; `reportUnusedDisableDirectives: 1`; default files `.js`, `.mjs`, `.cjs` |
| @eslint/plugin-kit 0.4.1 | `dist/cjs/index.cjs:26, 208-245` | A directive matches `^([a-z]+(?:-[a-z]+)*)(?:\s\|$)`, in lower case only. The reason starts after `\s-{2,}\s` |
| eslint 9.39.5 | `lib/languages/js/source-code/source-code.js:1040-1060, 1094-1135, 1225-1245`; `lib/linter/linter.js:1929` | Line comments carry only `eslint-disable-line` and `-next-line`. A block `eslint` comment sets rules inline. In flat mode `eslint-env` only warns |
| eslint-config-expo 57.0.2 | `flat/utils/extensions.js`, `flat/utils/typescript.js`, `flat/default.js` | It lints `.cjs`, `.mjs`, `.js`, `.jsx`, `.ts`, `.tsx` and `.d.ts`. It sets no `linterOptions`, and does not enable `@typescript-eslint/ban-ts-comment` (R14) |

**Not checked.** Whether pnpm turns an `.npmrc` `node-options` entry into `NODE_OPTIONS` for scripts: pnpm's install could not be found from this session. It stays with R6 (PL-1). None of the above was observed by running Jest or ESLint with such a config, since this phase may not add one to the repository. The guard refuses these files whatever they would do.

### Test first: RED, then GREEN

Only the commands in the checkpoint could run. Every step ran the whole quality suite, and the tool cut the middle of long outputs. Where a failing test fell there, the table below says so and names the only tests that assert the broken behaviour.

| Step | Command | Result |
|---|---|---|
| Before any change | `rtk proxy node --test scripts/quality/*.test.mjs` | `# tests 47`, `# pass 47`, `# fail 0` |
| Refactor only: finding 2's code extracted as `mobilePackageProblems` with its old behaviour; `config-inventory.mjs`, `transform-config.mjs` and `lint-scope.mjs` added as stubs that report nothing | same | `# tests 47`, `# pass 47`, `# fail 0` |
| RED: every phase-2D test against the stubs and the unfixed guard | same | Exit 1. The tool cut the middle and the end, totals included. Visible: `not ok 58` and `not ok 59` (lint scan and unreadable files: `+ []`), and `not ok 60` (the inventory listed nothing) |
| GREEN, first try | same | `# tests 65`, `# pass 65`, `# fail 0` |
| After D1–D13, each restored | same | `# tests 65`, `# pass 65`, `# fail 0` |
| Self-review fix: a missing mobile `package.json` was reported only when the inventory had entries; now always. Transform-config test 6 gained the empty-folder case | — | D14 below |
| Final | same, and `rtk proxy pnpm check` | In the [checkpoint](../../plan/runs/QA-9/checkpoint.md#commands-run-in-phase-2d) |

Ratchet test 29 and gate-wiring tests 3 and 6's new cases pin behaviour that already held: the domain template, the lint script pin, and the job-env allowlist. They passed before and after, and guard against a later edit to the guard.

### Mutations (each restored; then a Grep of `scripts/quality/*.mjs` for every mutated text found none)

Test numbers are as the suite ran them in phase 2D (phase 2E renumbers them, §7): ratchet 1–30, suppression 31–36, reporter 37–44, gate-wiring 45–52, lint-scope 53–59, transform-config 60–65.

| # | Mutation | Result |
|---|---|---|
| D1 | The include-pattern rule switched off (`if (listed && inTree && false)`) | `# pass 63`, `# fail 2`, both in the truncated range; ratchet 26 and 27 are the only tests asserting it |
| D2 | `read(MOBILE_PACKAGE)` swallowed again (`try { text = read(…) } catch {}`) | `# pass 64`, `# fail 1`, in the truncated range; ratchet 28 is the only test asserting the throw |
| D3 | Babel names matched with letter case (no `i` flag) | `# pass 63`, `# fail 2`: `not ok 61` (input `'.BABELRC'`), `not ok 62` (`apps/mobile/.BabelRC: 0 !== 1`) |
| D4 | `.babelignore` dropped from the names | `# pass 63`, `# fail 2`: `not ok 61` (input `'.babelignore'`), `not ok 62` (`apps/mobile/.babelignore: 0 !== 1`) |
| D5 | The `babel` key ignored | `# pass 63`, `# fail 2`: `not ok 63` (input `''`); the other in the truncated range, where ratchet 30 is the only other test asserting it |
| D6 | Links skipped silently by the inventory | `# pass 64`, `# fail 1`: `not ok 65` (the `.babelrc` link reported only by name) |
| D7 | The ESLint config pin switched off | `# pass 63`, `# fail 2`: `not ok 55` (input `''`); the other in the truncated range, where ratchet 30 is the only other test asserting it |
| D8 | A disable without a reason allowed | `# pass 63`, `# fail 2`: `not ok 57` (`// eslint-disable-line no-console` gave `[]`), `not ok 58` (`store.test.ts:2` missing) |
| D9 | Inline rule configuration allowed | `# pass 64`, `# fail 1`: `not ok 57` (`/* eslint no-restricted-syntax: "off" */` gave `[]`) |
| D10 | Other ESLint config sources allowed | `# pass 64`, `# fail 1`: `not ok 56` (`apps/mobile/eslint.config.mjs: 0 !== 1`) |
| D11 | A nested `package.json` allowed | `# pass 64`, `# fail 1`: `not ok 63` (`apps/mobile/src/features/package.json: 0 !== 1`) |
| D12 | The guard leaves out the transform-config problems | `# pass 64`, `# fail 1`, in the truncated range; ratchet 30 is the only test checking the guard's result for them |
| D13 | The guard leaves out the lint-scope problems | `# pass 64`, `# fail 1`, in the truncated range; ratchet 30 is the only test checking the guard's result for them |
| D14 | A missing mobile `package.json` not reported when the folder is missing or empty (the pre-fix condition) | `# pass 64`, `# fail 1`: `not ok 65` (the missing-`package.json` problem absent) |

### Review persisted

`docs/evidence/QA-9/review-phase2c.md` holds the phase-2C review verbatim. `rtk proxy git diff --no-index /tmp/fitlog-08c6473e-final.md docs/evidence/QA-9/review-phase2c.md` shows only the provenance header and a final newline added. The full session ID `08c6473e-33b4-46e0-b12f-fee9863f850d` was found from the file's prefix: the transcript of that name records the agent name, `dontAsk` mode and branch, and contains the review's title line.

## 7. Phase 2E: phase-2D review findings and R14

### Inputs

- **The phase-2D review**, verbatim in [review-phase2d.md](review-phase2d.md) (session `a8b4f2bc-5888-4bb5-a451-b3c62bb41ad7`). Verdict: accept phase 2D, with four low findings and no critical, high or medium one.
- **Codex's phase-2E brief, 26 October 2026.** It assigns the work below, and it records two independent checks by Codex:
  - **A full `pnpm check` on Node 22.23.1, exit 0.** This session read Codex's log, `/tmp/fitlog-qa9-pinned-check-1248.log`. The guard verified 210 entries, 131 linted files and 141 scanned files. Domain `ℹ pass 37`, `Exact lines coverage 533/583 (91.4237%)`, branches 272/313 and functions 106/117. Quality `# tests 65`, `# pass 65`, with `Node 22.23.1 truncated …`. Mobile `Tests: 126 passed` at 12.23 / 10.57 / 10.23 / 18.67. Plan `# pass 22`. The log ends at `plan.json and board.html match GOALS.md`. It holds no exit-code line, so the exit 0 is Codex's statement. Its 533 is another R3 sample at the floor.
  - **A reproduction of finding 1.** All four of the review's strings gave `problems: []` against phase 2D's scan, in the scratch directory `fitlog-qa9-directives-independent-0Rwm5l` under the OS temporary directory. This session did not read that directory. Lint-scope test 5 now holds the same four strings.
- **What the brief asked:** fix all four lows before the first commit, close R14 now, and assign R9 to QA-10 without claiming it closed. No further bypass scope. Keep the floor, thresholds and existing source unchanged, and keep Prettier, dependencies and the lockfile for their own phase.

### Findings and how each was handled

| Item | Fix | Regression tests | Mutation proof |
|---|---|---|---|
| Finding 1, low: the disable scan missed an empty rule list and two comments back to back | Comment starts are found with a lookahead, `/\/(?=[/*])/g`, so overlapping starts are each read. The rule list is read as `@eslint/plugin-kit` reads it (`namedRules`): split on commas, trimmed, one pair of matching quotes removed, empty items dropped. An empty list disables every rule | Lint-scope 5: the review's four strings and three more fail; five reasoned disables pass | E1, E2 |
| Finding 2, low: a `.watchmanconfig` could hide folders from Jest's file list | `--no-watchman` in the pinned `test:ci` (`gate-wiring.mjs`) and in the mobile `package.json` `test:ci`, the only mobile `package.json` change, as Codex authorised | Gate-wiring 3 (two cases) and 9 | E3, E3b |
| Finding 3, low: the reason for skipping `node_modules` was incomplete | The comment in `config-inventory.mjs` is corrected: the skip is a trust boundary. R6 now names, under PL-1, a force-tracked `node_modules` path and protection for `.npmrc` and `pnpm-workspace.yaml`. No dependency-trust code was added, as Codex asked | — (comment and prose) | — |
| Finding 4, low (plan): the box-3 run as written would not start the job | The plan is corrected to a draft pull request whose only failure is ESLint (below). Not done: it needs ~~Codex's specific authorisation~~ *(3D: the owner's specific approval, docs/23 §6)* for a push and a pull request | — | — |
| R14: TypeScript suppression comments | New `type-suppression.mjs`, run by every guard copy (§1). None of the comments exists, so no source changed | Type-suppression 1–6; ratchet 31 | E4–E13 |
| The review's test gaps (all low): no test for a directory named `.babelrc`; none for the lint-scope `package.json` cases (not JSON, `null`, not a regular file); the `eslintConfig` and `eslintIgnore` mutations not run one by one | Not added in 2E. They were outside the brief's list, and no rule is weakened without them. **Added in 2F** (§8) | — | — |

### How TypeScript 6.0.3 reads these comments (read in `node_modules/typescript/lib/typescript.js`, 26 October 2026; nothing was run)

| Lines | What it shows |
|---|---|
| 11608–11609 | `commentDirectiveRegExSingleLine` is `/^\/\/\/?\s*@(ts-expect-error\|ts-ignore)/` and `commentDirectiveRegExMultiLine` is `/^(?:\/\|\*)*\s*@(ts-expect-error\|ts-ignore)/`. Both are case-sensitive and have no end anchor, so `@ts-ignored` is an ignore |
| 12955–12996 | A `//` comment is matched from its start. A block comment is matched only on its last line (`lastLineStart`), so a JSDoc-style `* @ts-ignore */` on its last line counts |
| 14277–14301 | `appendIfCommentDirective` trims the text's start, and `getDirectiveFromComment` maps the match to "expect error" or "ignore" |
| 7275–7280, 40498–40517, 40600–40660 | `ts-check` and `ts-nocheck` are single-line pragmas read from the file's leading comments. `singleLinePragmaRegEx` is `/^\/\/\/?\s*@([^\s:]+)((?:[^\S\r\n]\|:).*)?$/m`, and the name is lower-cased (`match[1].toLowerCase()`), so `@TS-NoCheck` counts |
| 40567–40577 | `ts-nocheck` sets `checkJsDirective.enabled` to `false` |
| 22898–22908 | `canIncludeBindAndCheckDiagnostics` returns `false` for any file whose `checkJsDirective.enabled` is `false`, TypeScript files included. JavaScript is checked only with `checkJs` or `@ts-check`. `skipLibCheck` skips every declaration file (R16) |

`expo/tsconfig.base.json` sets `allowJs: true` and no `checkJs`; the domain tsconfig sets neither. ~~The scan is therefore a superset of what TypeScript honours: anywhere in a TypeScript file, in any letter case, strings and prose included.~~ **Corrected in phase 2F:** that sentence was wrong. The 2E pattern `/@ts-nocheck/gi` matched ASCII case only, while TypeScript lower-cases the pragma name with `toLowerCase()`, which turns U+212A (KELVIN SIGN) into `k` (phase-2E review, finding 1; demonstrated with the installed TypeScript in type-suppression test 7). Since 2F the scan matches anywhere in a TypeScript file, strings and prose included, with Unicode case folding. That covers every one-character spelling TypeScript reads as `ts-nocheck` (§1).

### How ESLint and Jest behave (findings 1 and 2; read, not run)

- `@eslint/plugin-kit` 0.4.1, `dist/cjs/index.cjs`: lines 184–201 hold `parseListConfig` (split on commas, trim, remove matching quotes, drop empty items), and lines 208–245 hold the directive and reason split.
- ESLint 9.39.5, `lib/linter/linter.js`: lines 351–352 turn an empty list into `[null]`, every rule. Lines 390–391 report a rule name that does not exist as an error, so `eslint-disable " " -- why` fails lint itself.
- jest-config 29.7.0, `build/Defaults.js:125`: `watchman: true`, applied by `build/normalize.js:604-605`.
- jest-haste-map, `build/index.js`: line 286 `useWatchman: options.useWatchman ?? true`; lines 748–753 crawl through watchman when `_shouldUseWatchman()` is true; lines 1066–1073 check it is installed.
- jest-cli, `build/args.js:718-723`: `watchman` is a boolean, "Disable using --no-watchman".
- With the flag, `pnpm check` still counts `Statements : 12.23% ( 254/2076 )`, as expected on a machine without watchman. Watchman was neither installed nor run.

### Box 3: the corrected plan (finding 4; not done)

1. **Authorisation first.** Pushing a branch and opening a pull request are external actions. They still need ~~Codex's specific authorisation, which this phase did not have~~ **the owner's specific approval**. *(Corrected in phase 3D, phase-3C review finding 1.)*
   - Under docs/23 §6, nothing is pushed unless the owner allows it: `"push": true` in `var/orchestrator/config.json`, or the owner pushing by hand. `INBOX.md` lists the push as an owner gate, and the repository is public.
   - AUTH-01 (`09-PROJECT-TRACKER.md`) delegates routine product, engineering and vendor-technical choices and final technical sign-off to Codex. It does not delegate publication. Codex's go-ahead and every existing approval leave it unapproved.
   - The pushed branch would also carry every unpushed local-`main` commit since `c8f6d7f`, so that publication is part of the approval, and it can't be undone.

   Nothing was pushed or opened.
2. **A draft pull request, not a bare push.** `mobile-ci.yml` runs on `pull_request`, and on `push` only to `main` and `v2/develop`. A push that creates a branch also carries an all-zero `before`, which the "Require the trusted contract baseline" step refuses before `pnpm check` runs. So: push a throwaway branch holding the QA-9 commit plus one deliberate error, and open it as a draft pull request against `main`.
3. **The error must fail ESLint and nothing earlier.** Use phase 2's M12 probe, `const unusedLintProbe = 1;` in `apps/mobile/jest.config.cjs`: it is not type-checked and changes no export the guard reads. ~~A hex colour literal in a screen under `src/features/` (the design-token rule) also works.~~ *(Struck in phase 3B, phase-3 review finding 4: since phase 3, root `check` runs the format step before ESLint. Touching a screen makes it judge the whole file, and 33 `.tsx` files under `src/features/` have lines over 100 characters (460 lines; a Grep in 3B confirmed the review's count), so that probe would fail at the format step, before ESLint. Use only the `jest.config.cjs` probe, which is formatted. Since 3B that file also holds `prettierPath: null`, which the guard requires, so the probe must add its line and change nothing else.)* Do not use an `eslint-disable`, which the guard refuses first, or an unused variable in a `.ts` file, which `noUnusedLocals` fails in typecheck first.
4. **Read the job log.** The baseline step passes, the root guard prints `Coverage ratchet verified`, `pnpm typecheck` passes, and `pnpm lint` fails at ESLint naming the rule. Then link the run in box 3, close the draft pull request and delete the branch. *(3C, final review finding 3: the format step was missing here. It runs between the guard and typecheck, and the run is not evidence until it is confirmed.)* **Required: the format step passes, and its summary reads `Formatting verified: the <n> touched JavaScript and TypeScript files match Prettier 3.6.2 with .prettierrc.json. Base: FITLOG_CONTRACT_BASELINE@<baseline>, from <the QA-9 commit>, which adds scripts/quality/touched-format.mjs.`** Check both parts of that label: the `from` clause names the QA-9 commit, and `<n>` is ~~18 (the 17 quality scripts and `jest.config.cjs`, which the probe edits again) when the draft holds only the QA-9 commit and the probe~~ *(3F, phase-3E review: once phase 3F commits the R19 test)* **19**, when the draft holds only the QA-9 commits and the probe. Those are the 17 quality scripts, `apps/mobile/jest.config.cjs` (which the probe edits again) and `packages/domain/src/contract.test.ts`. The `from` clause names the QA-9 commit that adds `scripts/quality/touched-format.mjs`, `4a7ee2100bff` today, not the later R19 commit. A rebase gives it a new ID. A label with no `from` clause, or one ending `is not committed yet`, means the rule start did not hold as tested (touched-format 17). A different count means the selection is not the one tested, for example under R18(h) if `main` on GitHub has moved past the branch's base. Either way, do not link the run until the log is explained, and record what it shows. The probe changes no other file, so the selection stays QA-9's own files.
5. **It is also the first hosted Linux run** of the guard's CI mode, the workflow checks, the reporter's file listing, the scans and `--no-watchman` (R10), and a new R3 sample.

### Test first: RED, then GREEN

Only `rtk proxy node --test scripts/quality/*.test.mjs` and `rtk proxy pnpm check` ran the code. The tool cut the middle, and sometimes the end, of long outputs. Where a failing test fell there, the table says so and names the only tests that assert the broken behaviour. Test numbers are as the suite runs them: ratchet 1–31, suppression 32–37, reporter 38–45, gate-wiring 46–54, lint-scope 55–61, transform-config 62–67, type-suppression 68–73.

| Step | Command | Result |
|---|---|---|
| Before any change | `rtk proxy node --test scripts/quality/*.test.mjs` | `# tests 65`, `# pass 65`, `# fail 0` |
| A stub `type-suppression.mjs` that reports nothing and is not wired, then every phase-2E test, before any fix | — | — |
| RED | same | Exit 1. The tool cut the middle and the end, totals included. Visible: tests 1–19 pass; the end of a failure's stack trace directly before test 55, so test 54 failed; tests 55–58 and 60–67 pass; and `not ok 59` (lint-scope 5) shows `/* eslint-disable , -- legacy */` giving `[]`. The rest fell in the cut part, so their failure was not observed. By their assertions they must fail against the stub: type-suppression 68 (0 files against the count on disk) and 70–73 (nothing reported), ratchet 31 (no summary sentence), gate-wiring 48 (the `--no-watchman` edit changes nothing, which the helper refuses), 53 (`type-suppression.test.mjs` is not in `QUALITY_FILES`) and 54 (the pin lacks the flag) |
| GREEN, first try | same | `# tests 73`, `# pass 73`, `# fail 0` |
| E1–E13, each restored | same | Below |
| After restoring (a Grep of `scripts/quality/` and the mobile `package.json` found no mutated text, and every restored line in place) | same | `# tests 73`, `# pass 73`, `# fail 0` |
| Final | `rtk proxy pnpm check` | Exit 0; in the [checkpoint](../../plan/runs/QA-9/checkpoint.md#commands-run-in-phase-2e) |

### Mutations (each restored)

| # | Mutation | Result |
|---|---|---|
| E1 | Comment starts matched without the lookahead again (`/\/[/*]/g`) | `# pass 72`, `# fail 1`: lint-scope 5 (#59; its name line was cut, its stack is `lint-scope.test.mjs:124`). Expected `…Screen.tsx:2 has "eslint-disable", which disables every rule…` for the back-to-back case; actual `[]` |
| E2 | An empty rule list read as naming rules again (`!directive.slice(label.length).trim()`) | `# pass 72`, `# fail 1`: lint-scope 5 (#59) at `/* eslint-disable , -- legacy */`; actual `[]` |
| E3 | `--no-watchman` dropped from the pin only | Exit 1; the middle and the end were cut. Visible: `not ok 1`, `not ok 3`, `not ok 5`, `not ok 23`, `not ok 24` and `not ok 26`, each with `apps/mobile/package.json scripts["test:ci"] is "… --no-watchman", not "…"; gate scripts are pinned exactly as reviewed`. Every guard copy refuses a script that differs from its pin |
| E3b | `--no-watchman` dropped from the pin and the mobile `test:ci` together (that script only; restored, and `git diff` showed it back) | `# pass 71`, `# fail 2`, both in the cut range (21–56). Gate-wiring 3 (#48) and 9 (#54) are the only tests that assert the flag |
| E4 | `@ts-ignore` and `@ts-nocheck` matched case-sensitively | `# pass 72`, `# fail 1`: `not ok 70` at `// @TS-IGNORE` |
| E5 | `@ts-nocheck` no longer refused | `# pass 71`, `# fail 2`: `not ok 70` at `// @ts-nocheck`. The other fell in the cut range; ratchet 31 is the only other test asserting it |
| E6 | Every `@ts-expect-error` reason accepted | `# pass 71`, `# fail 2`: `not ok 71` at a bare `// @ts-expect-error`. The other fell in the cut range; ratchet 31 (`TODO`) is the only other test asserting it |
| E7 | The reason read past the end of its block comment | `# pass 72`, `# fail 1`: `not ok 71` at `/* @ts-expect-error */ render(); // the router types omit dynamic segments` |
| E8 | TODO, FIXME, TBD, XXX and HACK counted as words | `# pass 72`, `# fail 1`: `not ok 71` at `TODO FIXME, fix later` |
| E9 | Repeated words counted | `# pass 72`, `# fail 1`: `not ok 71` at `TS2322 TS2345 TS7006` |
| E10 | `node_modules` skipped at any depth | `# pass 72`, `# fail 1`: `not ok 72`, `apps/mobile/src/node_modules/local.ts:1` missing |
| E11 | Links skipped silently | `# pass 72`, `# fail 1`: `not ok 73`, both link problems missing |
| E12 | The guard leaves out the TypeScript scan's problems | `# pass 72`, `# fail 1`, in the cut range; ratchet 31 is the only test checking the guard's result for them |
| E13 | TypeScript extensions matched case-sensitively | `# pass 72`, `# fail 1`: `not ok 72`, `apps/mobile/src/Upper.TSX:1` missing |

### Review persisted

`docs/evidence/QA-9/review-phase2d.md` holds the phase-2D review verbatim. `rtk proxy git diff --no-index /tmp/fitlog-a8b4f2bc-final.md docs/evidence/QA-9/review-phase2d.md` shows only the provenance header and a final newline added. Codex's brief supplied the full session ID. The transcript of that name records the agent name, `dontAsk` mode, Claude Code version and branch, and contains the review's title line.

## 8. Phase 2F: phase-2E review findings, R16 and three test gaps

### Inputs

- **The phase-2E review**, verbatim in [review-phase2e.md](review-phase2e.md), from session `ad123579-5ce7-4580-9f0a-15446140e87a`. It **ran no command**: every Bash call in its session was denied. It found two low bypasses, both reasoned from the installed code and not demonstrated by it. It recommended closing R16 narrowly, inside `src/` only.
- **Codex's phase-2F brief, 26 October 2026.** It records:
  - **Codex's own reproduction of both findings**, each scan returning `problems: []`, in the scratch directory `fitlog-qa9-unicode-independent-WhSC1M`. This session did not read that directory.
  - **Codex's own full `pnpm check` of phase 2E**, run independently on the pinned Node 22.23.1, with 258 tests, in the previous cycle. This is Codex's statement, not re-run here. It makes the review's "only the writer has run 2E's `pnpm check`" stale.
  - **Codex's acceptance of phase 2E's routine policy choices, subject to these fixes.**
- **What the brief asked:**
  - fix both findings test-first, with regression tests and scratch-only mutations, and correct the overclaiming wording;
  - close R16 narrowly, refusing declaration files under `apps/mobile/src` and `packages/domain/src` only, not a generated `expo-env.d.ts` outside `src/`, with tests and named S7 Quality ownership under QA-9;
  - add the phase-2D review's three test gaps if practical;
  - persist the review verbatim, marked as running no command;
  - keep the floor, thresholds, Jest scope and package scripts unchanged;
  - make no package, CI, dependency, lockfile, contract, source or config change. Prettier is the next, separate phase.

### Findings and how each was handled

| Item | Fix | Regression tests | Mutation proof |
|---|---|---|---|
| Finding 1, low: `@ts-nocheck` with U+212A for `k` passed the scan | The `u` flag on the `@ts-nocheck`, `@ts-ignore` and `@ts-expect-error` patterns, so letter case is matched with Unicode case folding. The module's header comment is rewritten to say so, and to name the fail-safe extra match (U+017F to `s`) | Type-suppression 3 (two cases), 7 (every one-character spelling, checked against each package's TypeScript); ratchet 31 (the guard itself) | RED; F1 |
| Finding 2, low: U+2028 or U+2029 hid a blanket `eslint-disable-line` | `bodyAt` ends a `//` comment at `LINE_END = /[\r\n\p{Zl}\p{Zp}]/gu`: CR, LF, U+2028 (`\p{Zl}` is that character alone) and U+2029 (`\p{Zp}` likewise). The `directivesIn` comment no longer claims that no comment ESLint sees is skipped; it says the scan reads text, not a parse | Lint-scope 5 (three failing, one passing), 8 (the installed ESLint with both parsers) | F2, F3 |
| The overclaims | docs/23 §9 rule 3; §7 of this file (struck through and corrected); the checkpoint's phase-2E self-review (corrected in place) | — | — |
| R16, narrowly | `DECLARATION` (TypeScript's declaration names, in any letter case) and `DECLARATION_ROOTS` (`apps/mobile/src`, `packages/domain/src`) in `type-suppression.mjs`. A declaration file under either is a problem, reported before its comments | Type-suppression 5 (one added entry), 8; ratchet 31 | RED; F4, F5, F6, F7 |
| Gap: a directory named `.babelrc` | Test only: the code already refused it | Transform-config 3 (three names) | F8 |
| Gap: lint-scope `package.json` cases | Test only | Lint-scope 9 (not JSON, five non-objects, a directory, a link, unreadable) | F12, F13, F14 |
| Gap: `eslintConfig` and `eslintIgnore` one by one | One test case with both keys, and a mutation for each | Lint-scope 4 | F10, F11 (F9 superseded) |

The guard's summary sentence and `coverage-ratchet.mjs` are unchanged. The declaration-file problems reach the guard through the existing `typeSuppressionProblems` call, as ratchet 31 shows.

### What the installed tools showed (run in the tests, not only read)

- **Node 22.23.1 `toLowerCase()`.** Exactly 10 characters stand in for a letter of `ts-nocheck`: the nine upper-case ASCII letters, and U+212A for `k` (test diagnostic: `10 spellings: … @ts-nochecU+212A`).
- **TypeScript 6.0.3**, loaded from `apps/mobile` and from `packages/domain`. `createSourceFile(…).checkJsDirective.enabled` is `false` for all 10 spellings and for `@TS-NOCHEC` plus U+212A, which is how `canIncludeBindAndCheckDiagnostics` switches checking off. `@ts-check` and `@ts-nocheckx` do not switch it off. `createSourceFile(…).isDeclarationFile` gives the declaration names in test 8.
- **ESLint, `Linter` in flat mode**, with `@typescript-eslint/parser` resolved through `eslint-config-expo/flat`, and with espree. A `// eslint-disable-line` followed by U+2028 or U+2029 and a second comment hides a hex-colour error that fails without it. So ESLint ends the comment at the separator and disables every rule on that line.
- **@babel/core 7.29.7** (read, not run): `lib/config/files/utils.js` `fileMtime` checks only `existsSync` before `readFile`, so a `.babelrc` directory makes Babel throw.

### Test first: RED, then GREEN

Only `rtk proxy node --test scripts/quality/*.test.mjs` and `rtk proxy pnpm check` ran the code. The tool cut the middle, and for failing runs the end, of long outputs. Test numbers are as the suite runs them: ratchet 1–31, suppression 32–37, reporter 38–45, gate-wiring 46–54, lint-scope 55–63, transform-config 64–69, type-suppression 70–77.

| Step | Command | Result |
|---|---|---|
| Before any change | `rtk proxy node --test scripts/quality/*.test.mjs` | `# tests 73`, `# pass 73`, `# fail 0` |
| Every phase-2F test written, plus only the `DECLARATION_ROOTS` export (no behaviour), so the test file imports | — | — |
| RED | same | Exit 1, middle and end cut, totals not visible. Visible: `not ok 74` (type-suppression 5, the `packages/domain/src/types.d.ts` refusal missing). Also `not ok 76` (type-suppression 7): its TypeScript assertions passed, then the scan's list lacked lines 10 and 11, the two Kelvin spellings. The other new failing cases (type-suppression 3 and 8, lint-scope 5 and 8, ratchet 31) fell in the cut part. The gap tests (lint-scope 4 and 9, transform-config 3) pin behaviour that already existed, so their proof is mutations F8–F14 |
| `--test-reporter=dot`, to see every failure | `rtk proxy node --test --test-reporter=dot scripts/quality/*.test.mjs` | **Denied** (dontAsk) |
| GREEN, first try | same as RED | Exit 1: `SyntaxError: Invalid regular expression: missing /` at `lint-scope.mjs:108`. The editing tool had written the escape sequences for U+2028 and U+2029 as the raw characters, and a raw U+2028 ends a regular-expression literal. `# tests 39`, `# pass 37`, `# fail 2`: the two test files that import `lint-scope.mjs` could not load. The type-suppression tests 7 and 8 ran there and passed |
| Fixed | — | `LINE_END` written with `\p{Zl}\p{Zp}`. Every test character written by code point (`String.fromCodePoint(0x2028)`, `0x2029`, `0x212a`), so the source shows it. A Grep of `scripts/quality/` for raw U+2028, U+2029, U+212A and U+017F then found only phase 2E's existing case in type-suppression test 4 (`type-suppression.test.mjs:110`), left unchanged. The RED run's test strings held the raw characters, the same values |
| GREEN | same | `# tests 77`, `# pass 77`, `# fail 0`; `10 spellings: @ts-noCheck … @ts-nochecU+212A` |
| F1–F14, each restored | same | Below |
| After restoring | same | `# tests 77`, `# pass 77`, `# fail 0`, after a Grep found no mutated text and every restored line |
| Final | `rtk proxy pnpm check` | Exit 0; detail in the [checkpoint](../../plan/runs/QA-9/checkpoint.md#commands-run-in-phase-2f) |

### Mutations (each restored)

**How "scratch-only" was applied.** A scratch copy of `scripts/quality/` could not be run: `rtk proxy node --test /tmp/fitlog-qa9-phase2f-mutants/scripts/quality/type-suppression.test.mjs` was denied in dontAsk mode. So, as in phases 2B–2E, each guard-code mutation was:
- one edit to a module in `scripts/quality/`;
- run with the allowed command;
- restored before the next mutation.

Every bypass input lived only in the tests' fixtures under the OS temporary directory: the Kelvin spellings, the U+2028/U+2029 directives, the declaration files, the Babel-named directories and the `package.json` forms. None was written to repository source, even temporarily. Codex may want the guard-code mutations repeated on a scratch copy; that needs the scratch path allowed.

| # | Mutation | Result |
|---|---|---|
| F1 | `/@ts-nocheck/gi` again (no `u`) | `# pass 74`, `# fail 3`. Visible: `not ok 76` with lines 10 and 11, the Kelvin spellings, missing. The other two are in the cut range; type-suppression 3 and ratchet 31 are the only other tests with a Kelvin case |
| F2 | `LINE_END = /[\r\n]/gu` (the 2E behaviour) | `# pass 75`, `# fail 2`. A failure's stack tail directly before test 63, so lint-scope 8 (#62) failed. The other is in the cut range; lint-scope 5 (#59) is the only other test with a separator case |
| F3 | U+2029 dropped (`/[\r\n\p{Zl}]/gu`) | `# pass 75`, `# fail 2`, both in the cut range; lint-scope 5 and 8 are the only tests with a U+2029 case |
| F4 | The declaration-file refusal switched off | `# pass 74`, `# fail 3`. Visible: `not ok 74` (`packages/domain/src/types.d.ts` missing) and `not ok 77` at `apps/mobile/src/types.d.ts`. The third is in the cut range; ratchet 31 is the only other test with a declaration case |
| F5 | Declaration files refused anywhere, not only in `src/` | `# pass 74`, `# fail 3`. Visible: `not ok 77`, refusing `.expo/types/router.d.ts`, `expo-env.d.ts`, `srcs/env.d.ts`, `types/env.d.ts` and `packages/domain/types.d.ts`. The other two must be type-suppression 5 (the `.expo` file) and ratchet 31 (`expo-env.d.ts`), so the repository tests passed: no declaration file exists in either package |
| F6 | The `src` prefix without its `/` | `# pass 76`, `# fail 1`: `not ok 77`, `apps/mobile/srcs/env.d.ts` refused |
| F7 | Declaration names narrowed to `/\.d\.ts$/i` | `# pass 76`, `# fail 1`: `not ok 77` at `apps/mobile/src/env.d.mts` |
| F8 | A directory with a Babel config name skipped | `# pass 76`, `# fail 1`: `not ok 66` (transform-config 3) at `apps/mobile/.babelrc: 0 !== 1` |
| F9 | `ESLINTRC_KEYS = ['eslintConfig']` | `# pass 75`, `# fail 2`; one stack at `lint-scope.test.mjs:225` (test 63). Not isolated, because it also changes the "cannot be checked" message, so F10 and F11 replace it |
| F10 | `eslintIgnore` dropped from the key check only | `# pass 76`, `# fail 1`, in the cut range. Test 63 is visible passing, and lint-scope 4 (#58) is the only test with an `eslintIgnore` key |
| F11 | `eslintConfig` dropped from the key check only | `# pass 76`, `# fail 1`, in the cut range. Test 63 is visible passing; lint-scope 4 (#58), as for F10 |
| F12 | The not-an-object check replaced by `json === undefined` | `# pass 76`, `# fail 1`: stack at `lint-scope.test.mjs:227`, test 63's non-object loop |
| F13 | The not-a-regular-file check removed | `# pass 76`, `# fail 1`: stack at `lint-scope.test.mjs:232`, test 63's directory case |
| F14 | An unreadable `package.json` read as clean | `# pass 76`, `# fail 1`: stack at `lint-scope.test.mjs:242`, test 63's unreadable case |

### Review persisted

`docs/evidence/QA-9/review-phase2e.md` holds the phase-2E review verbatim, with a provenance header. The header marks the review's commands as **not run**, and corrects its stale claim that only the writer had run 2E's `pnpm check`. `rtk proxy git diff --no-index /tmp/fitlog-ad123579-final.md docs/evidence/QA-9/review-phase2e.md` shows only the header and a final newline added. The first write differed on the two lines that quote escape sequences (for U+212A, and for U+2028 and U+2029), which came out with doubled backslashes; both were fixed and the diff re-run. The transcript named by the full session ID records the agent name, `dontAsk` mode, Claude Code `2.1.310` and the branch, and holds the review's first sentence.

## 9. Phase 2G: phase-2F review findings

### Inputs

- **The phase-2F review**, verbatim in [review-phase2f.md](review-phase2f.md), from session `68f44e38-7c4c-43ce-bdbb-bc9203468b1a`. It is **source-only**: every Bash call in its session was denied, it executed nothing, and none of its findings was demonstrated by it. It found no critical, high or medium issue and three lows.
- **Codex's phase-2G brief, 26 October 2026 (AUTH-01).** It records that review session `68f44e38` stopped and that the phase-2F writer session `31abe500` is retired. It asked for one bounded, pure-code phase:
  - fix all three lows test-first;
  - finding 1: recognise declaration files with CR, LF, U+2028 or U+2029 in the name, consistently with the installed TypeScript's `isDeclarationFile`, with a mandatory mutation kill;
  - finding 2: refuse UTF-16LE and UTF-16BE byte-order-mark TypeScript sources before decoding, with injected tests that go through the real byte read path and no silent skip;
  - finding 3: refuse `.js`, `.jsx`, `.mjs` and `.cjs` under `apps/mobile/src`, consider the same policy for domain source if it holds no legitimate files, and document the bounds;
  - persist the review verbatim, attributed as source-only, all Bash denied and not independently executed;
  - widen no tsconfig, Jest coverage, pin or floor to disguise anything;
  - make no change to dependencies, package files, the lockfile, CI, tsconfig, ESLint, Jest, the baseline or the floor;
  - no Prettier (the next, separate phase), and no database, Docker, Supabase, network, sub-agents, commit, push, status, GOALS, ACCEPTANCE, `main`, auth switch or overage.

### Findings and how each was handled

| Finding | Fix (all in `scripts/quality/type-suppression.mjs`) | Regression tests | Mutation proof |
|---|---|---|---|
| 1, low: a declaration file in `src/` named with a line break after `.d.` passed the R16 refusal | `isDeclarationName` applies TypeScript 6.0.3's two tests from `getDeclarationFileExtension`, with no wildcard: `/\.d\.[cm]ts$/i`, or `/\.ts$/i` together with `/\.d\./i`. The header and pattern comments say so, and the three overclaims are corrected (§1 here, the checkpoint, the module) | Type-suppression 8: 8 line-break declarations and 12 line-break near misses, each classified by the installed TypeScript first; both packages' real `include` lists the four `loose.d.`+break+`.ts` files. Ratchet 31: the U+2028 name fails the guard | 2G-G1 (the exact pre-fix pattern) is killed by type-suppression 8 and ratchet 31. 2G-G2 (over-broad) and 2G-G3 (a plausible wrong fix) are killed too |
| 2, low: a UTF-16 file was decoded as UTF-16 by TypeScript and as UTF-8 by the scan | The scan's own reader returns raw bytes (`readFileSync` with no encoding). A TypeScript file whose first two bytes are `FF FE` or `FE FF` is refused before decoding, as TypeScript's `sys.readFile` checks them. Any other file is decoded as UTF-8, as before. A reader that returns anything but bytes is a problem for that file, so nothing is skipped quietly | Type-suppression 9: both marks, three places, the installed TypeScript's own reader shown decoding the comment and switching checking off, with the scan's default reader (none injected). UTF-8 byte-order mark, a later `FF FE` and a one-byte file pass. Type-suppression 6: the injected reader returns bytes; a text reader fails closed. Ratchet 31: the review's UTF-16LE file fails the guard | 2G-G4, 2G-G5, 2G-G6, 2G-G7, 2G-G8 |
| 3, low: JavaScript under `src/` escaped types, coverage and the design-token lint | Every `.js`, `.jsx`, `.mjs` and `.cjs` file under `apps/mobile/src/` or `packages/domain/src/` (`SOURCE_ROOTS`, renamed from `DECLARATION_ROOTS`) fails, in any letter case, without being read. The domain follows the same rule: it holds no JavaScript and needs none. Outside `src/` nothing changes | Type-suppression 10: the mobile tsconfig's `allowJs` on and `checkJs` off, and the installed TypeScript reporting `2339` in `.ts` but nothing in the same `.js`, then the refusal and its bounds. Type-suppression 5: `apps/mobile/src/legacy.js` refused. Ratchet 31: the review's `GymMembersScreen.jsx` with `'#ff0000'` fails the guard | 2G-G9, 2G-G10, 2G-G11, 2G-G12 |

`coverage-ratchet.mjs` and its summary sentence are unchanged: the three new problems reach the guard through the existing `typeSuppressionProblems` call, as ratchet 31 shows. `config-inventory.mjs` is unchanged too. Its UTF-8 reader still serves the lint-scope, transform-config and coverage-suppression scans, whose tools (ESLint, Babel, Istanbul through Babel, Node with tsx) all read UTF-8. Only TypeScript decodes UTF-16, so only the TypeScript scan needed the byte path. No other module, test file, `QUALITY_FILES` entry, package file, tsconfig, Jest option, lint option, floor or threshold changed.

### What the installed tools showed

Before any fix, three scratch probes ran with `rtk proxy node -e`. Each wrote only to a new `mkdtemp` folder under the OS temporary directory and removed it.
- **Finding 1.** For each of CR, LF, U+2028 and U+2029, TypeScript 6.0.3 (`createSourceFile(…).isDeclarationFile`) read `loose.d.`+break+`.ts` and `st.d.c`+break+`ss.ts` as declaration files. Phase 2F's pattern missed both, and `parseJsonConfigFileContent` with the mobile include `**/*.ts` listed both. `loose.d`+break+`.ts` was not a declaration file, but was listed; the `.tsx` and `.mts` near misses were neither.
- **Finding 2.** For a `// @ts-nocheck` file saved as UTF-16LE and as UTF-16BE, each with its mark, `ts.sys.readFile` returned `// @ts-nocheck\ne…`, and `checkJsDirective.enabled` was `false`. `readFileSync(…, 'utf8')` of the same file did not contain `@ts-nocheck`.
- **Finding 3.** `ts.getParsedCommandLineOfConfigFile('apps/mobile/tsconfig.json')` gave `allowJs: true`, `checkJs` unset, `skipLibCheck: true`, 0 errors and 129 files.

The tests now make each of these checks every run (type-suppression 8, 9 and 10).

### Test first: RED, then GREEN

Test numbers in the full run are ratchet 1–31, suppression 32–37, reporter 38–45, gate-wiring 46–54, lint-scope 55–63, transform-config 64–69 and type-suppression 70–79. This session could run a single test file, so most mutation results are complete, not cut.

| Step | Command | Result |
|---|---|---|
| Before any change | `rtk proxy node --test scripts/quality/*.test.mjs` | `# tests 77`, `# pass 77`, `# fail 0` |
| Every phase-2G test written, plus only the behaviour-neutral rename `DECLARATION_ROOTS` → `SOURCE_ROOTS`, so the test file imports | — | — |
| RED | `rtk proxy node --test scripts/quality/type-suppression.test.mjs` | `# tests 10`, `# pass 5`, `# fail 5`:<br>- test 5: `apps/mobile/src/legacy.js` not refused;<br>- test 6: `text.matchAll is not a function`, because the old scan could not take bytes;<br>- test 8, at its scan assertion: none of the eight line-break declarations refused;<br>- test 9: the UTF-16LE `fixtures.test.ts` not refused;<br>- test 10: `legacy.js` not refused.<br>In tests 8, 9 and 10 every installed-TypeScript assertion before the failing line passed. Ratchet 31's three new cases were not run RED before the fix; 2G-G1, 2G-G4 and 2G-G9 show each one failing without its fix |
| GREEN | same | `# tests 10`, `# pass 10`, `# fail 0` |
| GREEN | `rtk proxy node --test scripts/quality/*.test.mjs` | `# tests 79`, `# pass 79`, `# fail 0` |
| 2G-G1 to 2G-G12, each restored | below | below |
| After restoring | full suite | `# tests 79`, `# pass 79`, `# fail 0`, after a Grep of `type-suppression.mjs` found no mutated text |
| Final | `rtk proxy pnpm check` | Exit 0, 264 tests; detail in the [checkpoint](../../plan/runs/QA-9/checkpoint.md#commands-run-in-phase-2g) |

### Mutations (each restored)

Each mutation was one edit to `scripts/quality/type-suppression.mjs`, run, then restored before the next, as in phases 2B–2F. Every bypass input (the line-break names, UTF-16 bytes and JavaScript files) existed only in test fixtures under the OS temporary directory, never in the repository.

| # | Mutation | Result |
|---|---|---|
| 2G-G1 | **Finding 1's mandatory kill:** the exact pre-fix pattern `/\.d\.(?:[cm]ts\|(?:.*\.)?ts)$/i` restored | Full suite: `# pass 77`, `# fail 2`. Visible: `not ok 77` (type-suppression 8, its scan assertion: the eight line-break declarations not refused). Ratchet file alone: `# pass 30`, `# fail 1`, `not ok 31` at `"apps/mobile/src/loose.d.`+U+2028+`.ts", anchored: false`, with actual `''`: the whole guard passed |
| 2G-G2 | Over-broad: any name with `.d.` | Full suite: `# pass 78`, `# fail 1`: `not ok 77` at `apps/mobile/src/env.d.tsx` |
| 2G-G3 | A plausible wrong fix, `/\.d\.[^]*ts$/i` (any character, but no dot before `ts`) | Type-suppression file: `# pass 9`, `# fail 1`: test 8 at `apps/mobile/src/loose.d.`+CR+`.mts`, one of the new near misses. No older case catches it |
| 2G-G4 | The UTF-16 refusal switched off | Type-suppression and ratchet files: `# pass 39`, `# fail 2`. Visible: type-suppression 9, the UTF-16LE `packages/domain/src/sub/fixtures.test.ts` not refused. Ratchet file alone: `not ok 31` at that file, with actual `''`: the whole guard passed |
| 2G-G5 | `FE FF` (UTF-16BE) dropped | Full suite: `# pass 78`, `# fail 1`: `not ok 78`, UTF-16BE |
| 2G-G6 | The mark matched anywhere in the file, not only in its first two bytes | Type-suppression file: `# pass 9`, `# fail 1`: test 9, `apps/mobile/src/later.ts` refused |
| 2G-G7 | A reader that returns text decoded quietly, instead of failing closed | Type-suppression file: `# pass 9`, `# fail 1`: test 6, the three `was not read as bytes` problems missing |
| 2G-G8 | 2G-G7 kept, and the default reader decodes UTF-8 (`readFileSync(file, 'utf8')`), the pre-fix read path | Type-suppression file: `# pass 8`, `# fail 2`: tests 6 and 9. Test 9 injects no reader, so it fails only through the default read path |
| 2G-G9 | The JavaScript refusal switched off | Type-suppression file: `# pass 8`, `# fail 2`: tests 5 and 10. Ratchet file alone: `not ok 31` at `GymMembersScreen.jsx`, with actual `''` |
| 2G-G10 | JavaScript refused anywhere, not only in `src/` | Type-suppression file: `# pass 7`, `# fail 3`: test 1 (this repository's `apps/mobile/eslint.config.js`, `jest.config.cjs` and `scripts/test-design-rules.cjs`), and tests 5 and 10 |
| 2G-G11 | `.mjs` and `.cjs` dropped (`/\.jsx?$/i`) | Type-suppression file: `# pass 9`, `# fail 1`: test 10 at `apps/mobile/src/tool.mjs` |
| 2G-G12 | JavaScript names matched case-sensitively | Type-suppression file: `# pass 9`, `# fail 1`: test 10 at `apps/mobile/src/Upper.JS` |

### Bounds of the three fixes

- **Finding 1** covers every name the installed TypeScript calls a declaration file, by construction: the tests are TypeScript's own two, case-insensitive and read on the whole entry name. A name TypeScript would not call one (`env.d.tsx`, `loose.d`+break+`.ts`, a `.d.`+break+`.mts` name) is still an ordinary, type-checked file and passes. The refusal stays narrow, under each `src/` only. R16's remainder is unchanged.
- **Finding 2** covers exactly the two marks TypeScript's reader acts on, in every TypeScript file the scan reads in both packages. UTF-8 with or without its byte-order mark is read as before.
- **Finding 3** covers JavaScript files under each `src/`. Outside `src/` JavaScript is neither read nor refused (R17's remainder). No setting moved to make this pass: `allowJs`, `checkJs`, both tsconfigs, the Jest scope and the lint scope are unchanged.

### Review persisted

`docs/evidence/QA-9/review-phase2f.md` holds the phase-2F review verbatim, with a provenance header. The header attributes it as source-only, with all Bash denied, and not independently executed. `rtk proxy git diff --no-index /tmp/fitlog-68f44e38-final.md docs/evidence/QA-9/review-phase2f.md` shows only the header and a final newline added. The transcript named by the full session ID records the agent name, `dontAsk` mode, Claude Code `2.1.310` and the branch, and holds the review's sentence "I found no critical, high or medium issue, and three lows".

## 10. Phase 3: Prettier on touched files, and the phase-2G review

### Inputs

- **The phase-2G review**, verbatim in [review-phase2g.md](review-phase2g.md), from session `908f412f-5536-4da2-84f7-743b8d1ec933`. It **executed**: the 79 quality tests and `pnpm check` (264 tests, exit 0) on Node 22.23.1. It found no correctness defect, one low records fix and three optional items, and called phase 2G, with 2F, ready for the Prettier phase.
- **Codex's phase-3 brief, 27 October 2026 (AUTH-01).** It accepts that review, records that its session stopped, and assigns one separate Prettier phase. It asks for:
  - the review persisted verbatim;
  - the four R17 owner references corrected to PL-1, CI wiring only, and the `contract.test.ts` dynamic import described correctly; optionally, 2G's mutation labels disambiguated;
  - Prettier on touched files only, with exactly `prettier` 3.6.2 as a root devDependency and its lockfile change, and no other dependency upgrade;
  - a coherent selection of tracked added, modified and renamed files, safe with spaces, ignoring deletions, binary, generated and vendor files, with an explicit local and CI base that fails closed when a required base is missing, on the existing contract and ratchet baseline conventions, its exact semantics documented, and never mass-formatting untouched or unrelated files;
  - `pnpm check` and CI wired consistently without invalidating the approved coverage, type and lint gates: small root script changes and matching gate-wiring pins and tests are permitted, and `apps/mobile/eslint.config.js` stays unchanged;
  - meaningful behavioural tests of the selection and of real formatting failures and passes, not tests that mirror trivial code;
  - formatting only owned touched files, then the quality tests and the full `pnpm check` on Node 22.23.1;
  - no threshold or floor change, and no contract, SQL, backend, database, Docker, Supabase, app feature, status, GOALS, ledger, `main`, commit, push, external action or sub-agent. A registry read and install are authorised, with no credentials or paid API. An unavailable dependency is recorded, never silently substituted;
  - the floor kept unanchored until exact integration into `main`. The hosted lint-negative run stays unproved and needs a specific push authorisation.

### The review's finding and optional items

| Item | Handling |
|---|---|
| 1 Low: R17's owner named as "S7 Quality, under QA-9" in four places | **Corrected** to **PL-1, CI wiring only**, as Codex assigned it. That covers the checkpoint's R17 row, its phase-2G decision 3 and its "Found for other goals" row, and R17 in §3 here. Each correction says what it read before |
| 1, also: "the only relative imports leaving `src/` are two domain tests that read JSON files by URL" | **Corrected** after a Grep of both trees. No relative path in `apps/mobile/src` leaves it. In `packages/domain/src` the paths that leave it are `fixtures.test.ts:11` and `contract.test.ts:86` (JSON read by URL), `cli/snapshot-contract.ts:13` (the `contracts/` folder by URL, also missing from the old sentence), and `contract.test.ts:87`, which runs `import()` on `../${entry}` with `entry` from `exports['.']`. Today that is `./src/index.ts`, so it resolves back into `src/` |
| Optional: reused mutation labels | **Done.** Phase 2G's are now `2G-G1` to `2G-G12` in §1, §9 and the checkpoint. Phase 2B's G1–G7 are unchanged. Phase 3's are `3-M1` to `3-M22` |
| Optional: the guard's success message names only the three comments | **Not changed.** It is message text in `coverage-ratchet.mjs`, outside this Prettier phase. It is left for Codex |
| Optional: the R17 route through the unpinned `exports` | **Recorded** under R17 (and R6), PL-1's. Whether strict `tsc` would reject an untyped JavaScript entry was not checked |

### Design decisions (delegated by the brief)

- **Prettier's API, not its CLI.** Per file, the CLI resolves a nested `.prettierrc`, a `package.json` `prettier` key and `.editorconfig`, and it skips anything its ignore files match. A config can also load plugins, which is code from the repository. Test 6 shows each of these switching Prettier off for a file. Calling `check()` with the pinned options closes all of them at once and loads nothing from the repository.
- **A root `.prettierrc.json` equal to the options**, so that editors and `pnpm exec prettier --write` produce what the check expects. A nested config could still mislead an editor, but never the check.
- **Options:** `printWidth: 100` and `singleQuote: true`, with Prettier's defaults otherwise. That matches the repository's style: single quotes, semicolons, trailing commas, double-quoted JSX attributes and the closing bracket on its own line. `apps/mobile/jest.config.cjs` already matched. `apps/mobile/eslint.config.js` does not, and it stays as it is.
- **JavaScript and TypeScript only.** JSON, Markdown and YAML are left out: QA-9 touches the shared `package.json` files and docs/23, which other lanes own, and formatting them would rewrite lines nobody changed.
- **Tracked files only**, as briefed. Locally, a new file is checked once it is added; CI checks every committed file.
- **Generated and vendor.** The generated list holds one file, `database.types.ts`; a Grep found no other generated JavaScript or TypeScript tracked. Vendor means a `node_modules` segment; no other vendored code is tracked.
- **The base** reuses the guard's `configuredBaseline` and `inCI` (now exported: the only change to `coverage-ratchet.mjs` besides formatting) and `gitRunner`. Locally it is `refs/heads/main`. Unlike the ratchet, which only notes a missing `main`, the format check fails, because without a base nothing can be called touched.
- **The rule starts where it is added** (found in this phase). `origin/main` is 164 JavaScript and TypeScript files behind local `main`. Without this rule start, the first hosted run would demand all 164, either the box-3 draft pull request against `main` or the first push of `main`. It would then fail at the format step, before ESLint. The idea is the floor's: it holds once `main` records it.
- **Wiring:** once, in root `check`, after the guard and before typecheck, pinned exactly in `gate-wiring.mjs`, so dropping it fails every guard copy. It is not inside the guard, which runs three times and is synchronous, while Prettier's API is asynchronous. `touched-format.test.mjs` is in `QUALITY_FILES`. There is no write mode and no new package script.

### What the installed tools showed

- **Registry and install.** `pnpm view prettier@3.6.2` gave version `3.6.2`, licence MIT and integrity `sha512-I7AIg5boAr5R0FFtJ6rCfD+LFsWHp81dolrFD8S79U9tb8Az2nGrJncnMSnys+bpQJfRUzqs9hnA81OAA3hCuQ==`. Prettier was in neither the lockfile nor `node_modules` before. `pnpm add --save-dev --save-exact --workspace-root prettier@3.6.2` (pnpm 10.27.0) changed one root `devDependencies` line and 10 lockfile lines, all `prettier@3.6.2` with that integrity. It printed `Packages: +3 -69` for `node_modules`. The lockfile's other entries did not change, so the 69 removed were installed packages the lockfile does not list; which ones was not recorded. Every later `pnpm check` passed.
- **Prettier 3.6.2** lower-cases the basename before matching extensions (`getLanguageByFileName`, `prettier/index.mjs`). `checkIgnorePragma` exists and defaults to `false`.
- **Git.** Rename detection is on by default even with no user configuration (3-M1 shows `R100`). `-z` is what keeps a tab or line break in a path (3-M2). In a real conflicted merge, `git diff <base>` against the work tree did not report `U` for the conflicted path (the first GREEN run, observed). That fits how Git's `diff-lib.c` (`do_oneway_diff`) reports `U` only for entries it treats as cached, but that source was recalled, not read in this session. A probe to print the raw output was denied (`node -e`). Either way, the check asks `git ls-files -u -z` directly, and test 10 shows that working.
- **Formatting the owned files.** `prettier --check` found `jest.config.cjs` formatted, and `eslint.config.js` and all 17 `scripts/quality/*.mjs` not. `prettier --debug-check "scripts/quality/*.mjs"` listed all 17, which means each one's AST is unchanged by formatting and formatting it twice changes nothing more. `prettier --write` then ran on exactly those 17. The pre-format bytes were not hashed: `git hash-object` was denied.

### Test first: RED, then GREEN

In the full run, touched-format is tests 64–75.

| Step | Command | Result |
|---|---|---|
| A stub with the constants and empty functions; format tests 1–8, 10 and 11 (as then numbered); gate-wiring test 2's new case | — | — |
| RED | `rtk proxy node --test scripts/quality/touched-format.test.mjs scripts/quality/gate-wiring.test.mjs` | `# tests 19`, `# pass 8`, `# fail 11`: nine format tests, gate-wiring 2 (`the edit to package.json changed nothing`) and gate-wiring 8 (the unlisted test file). Run alone, the ground-truth test passes |
| GREEN, first try | same | `# pass 18`, `# fail 1`: the unmerged case, since `git diff` reported no `U` |
| GREEN | format tests, after adding `ls-files -u` | `# tests 10`, `# pass 10` |
| Formatting the 17 owned files | `prettier --debug-check`, then `--write` | all 17 AST-unchanged; then quality `# pass 89` |
| 3-M1 to 3-M18 | below | each killed |
| RED, rule start: the rule committed at `changeRepo`'s base, new test 9, only the `RULE` export | format tests | `# tests 11`, `# pass 10`, `# fail 1`: test 9 at its first base assertion |
| GREEN | same, after `ruleStart` | First the fixture's copy of this module was not in Prettier's format, since test 9 commits the module's real text. After `--write`: `# pass 11` |
| Test 12 (Git failures) | written after the code it covers | passes; its value is shown by 3-M19's `rev-list` case, 3-M21 and 3-M22 |
| 3-M19 to 3-M22 | below | each killed |
| The summary's base in its own sentence, and "1 file" | two tests changed first: RED, then GREEN | message text only |
| `--topo-order` added to the `rev-list` call, so "the first commit that adds the rule" means the earliest even across merges, whatever the commit dates | the format tests | `# tests 12`, `# pass 12`. In a linear history, and for a pull request's merge ref, the order was already right, so no test can tell the difference; it is recorded as a robustness change |
| Final | `rtk proxy node --test scripts/quality/*.test.mjs` | `# tests 91`, `# pass 91`, `# fail 0` |
| Final | `rtk proxy pnpm check` | exit 0, **276 tests**; detail in the [checkpoint](../../plan/runs/QA-9/checkpoint.md#commands-run-in-phase-3) |

### Mutations (each restored)

Each was one edit to `touched-format.mjs`, except 3-M18 in `gate-wiring.mjs`. Each was run, then restored before the next. Afterwards a Grep of `scripts/quality/*.mjs` found no mutated text, and `prettier --check` passed. Every fixture lived under the OS temporary directory.

| # | Mutation | Result |
|---|---|---|
| 3-M1 | `--no-renames` dropped | 9 of 10 format tests fail: `git diff --raw -z printed ":100644 100644 … R100", which this check cannot read`. Git's default rename detection is refused, never misread |
| 3-M2 | `-z` dropped | 9 of 10 fail: `git diff --raw -z printed output this check cannot read` |
| 3-M3 | Extensions matched case-sensitively | Selection test (`Screen über.TSX` missing) and the by-name test (`0 !== 1`) |
| 3-M4 | The `node_modules` rule dropped | Selection (`+ apps/mobile/node_modules/pkg/index.js`) and the only-touched test (`… index.js is not formatted …`) |
| 3-M5 | The generated-file rule dropped | Only-touched test: `apps/mobile/src/data/database.types.ts is not formatted …` |
| 3-M6 | The regular-file mode check dropped | Link test: no `link.ts is not a regular file (Git mode 120000, a symbolic link)` |
| 3-M7 | The `ls-files -u` query dropped | Link and unmerged test: no `a.ts is unmerged` |
| 3-M8 | Diff against `main`'s tip instead of the fork point | First only the base assertion failed, a weak kill. The fixture was strengthened: `main` now edits the untouched, unformatted `kept.ts` after the fork. Then the selection test (base) and the only-touched test (`apps/mobile/src/kept.ts is not formatted …`) fail: a file the branch never touched would be demanded |
| 3-M9 | The CI refusal of a baseline that forks at `HEAD` dropped | Base test: `Missing expected exception.` (the fork-at-`HEAD` case) |
| 3-M10 | The local base silently `HEAD` instead of `refs/heads/main` | Selection (base), base test (no `main` no longer fails) and command test (`the 2 touched … files` instead of 6) |
| 3-M11 | The root-config pin dropped | Config test: no `.prettierrc.json is not the reviewed Prettier options` |
| 3-M12 | Options taken from `prettier.resolveConfig(file, { editorconfig: true })`, as the CLI does | Config test: `0 !== 1`. The nested `requirePragma` config lets the unformatted file pass |
| 3-M13 | `checkIgnorePragma: true` | Config test: `0 !== 1`. The `@noformat` file passes |
| 3-M14 | The installed-version pin dropped | Version test: no `Prettier 3.6.1 is installed, but this check is pinned to 3.6.2` |
| 3-M15 | A parse failure swallowed | Parse test: no `could not be parsed by Prettier 3.6.2` |
| 3-M16 | The command exits 0 after a thrown error | Command test: `0 !== 1` for the no-`main` run |
| 3-M17 | Deleted paths read as touched files | Only-touched test: two `cannot be read (ENOENT …)` problems |
| 3-M18 | The `gate-wiring.mjs` root `check` pin without the format step | Gate-wiring 1, 2 and 7 fail: `package.json scripts["check"] is "… && node scripts/quality/touched-format.mjs && …", not "…"; gate scripts are pinned exactly as reviewed` |
| 3-M19 | Rule start off: the fork point is always the base | Rule-start test (base assertion) and Git-failure test (no `rev-list` exception) |
| 3-M20 | Rule start at the adding commit instead of its parent | Rule-start test: `measured from the parent of the commit that adds the rule` |
| 3-M21 | An `ls-tree` failure read as "the base lacks the rule" | Git-failure test: `Missing expected exception: ls-tree` |
| 3-M22 | A failing `git diff` ignored | Git-failure test: `Missing expected exception: diff` |

### Bounds

- The check covers the eight JavaScript and TypeScript extensions in tracked files touched since the rule-adjusted base. Everything outside that is listed, not checked. What remains open is R18 in §3.
- Formatting is by Prettier's own judgment with the pinned options. A `prettier-ignore` comment is honoured, as for any Prettier user.
- Nothing on hosted CI or Linux is proven (R10). The check has never run against a real event base. Test 9 reproduces that situation in a fixture.

### Review persisted

`docs/evidence/QA-9/review-phase2g.md` holds the phase-2G review verbatim, with a provenance header. `rtk proxy git diff --no-index /tmp/fitlog-908f412f-final.md docs/evidence/QA-9/review-phase2g.md` shows only the header and a final newline added. The transcript named by the full session ID records the agent name `FitLog QA9 independent phase2G review`, `dontAsk` mode, Claude Code `2.1.310` and the branch, and holds the review's first sentence.

## 11. Phase 3B: the phase-3 review's findings

### Inputs

- **The phase-3 review**, [independent-review-2026-10-26T2000Z.md](independent-review-2026-10-26T2000Z.md), already in this folder when the session began and left unchanged. It is **source-only**: Bash was denied on its first command, and it ran no test and not `pnpm check`. It found no critical or high defect, one medium and three lows.
- **Codex's phase-3B brief, 27 October 2026 (AUTH-01).** One bounded correction in this worktree. It asks for:
  - finding 1 fixed test-first, with RED tests for CI and for drift plus a mutation: a missing adoption commit in CI throws, a committed checker that drifted throws locally, and `RULE` is derived from the module URL or asserted equal to its path;
  - `prettierPath: null` in Jest and the guard, with tests, as Codex's choice for finding 2. That is an authorised limited config change;
  - finding 4's stale probe and records resolved, and finding 3 recorded as a named R18 residual;
  - no threshold, floor, dependency or lockfile change; the quality tests and `pnpm check` on Node 22.23.1; every shell command prefixed `rtk`;
  - no sub-agents, commit, branch, status or ledger change, `main` integration, network, provider, push, CI, database, Supabase, Docker, runner or replay-directory action. Denied actions are recorded, not worked around. The goal is not marked Done.

### Findings and how each was handled

| Finding | Handling | Proof |
|---|---|---|
| 1 Medium: the rule start resets silently in CI when `RULE` does not match the module's real path | **Fixed, three ways.** (1) `RULE` is derived: `relative(REPO_ROOT, fileURLToPath(import.meta.url))`, with `/` separators. A rename or move carries it. (2) With no commit after the fork point adding `RULE`, CI throws, since CI runs only committed code. (3) Locally, a `HEAD` that holds `RULE` throws too, and whether it does is read with `git ls-tree`, a failure throwing. The fallback to `HEAD` stays for exactly one state: locally, before the check is committed, which is today's state and the label says so | Touched-format 13–16. RED: tests 14, 15 and 16 failed (run 5), test 14 with the review's exact symptom (`the 0 touched … files`, `from HEAD@… not committed yet`, exit 0). 3B-M1 to 3B-M6 |
| 2 Low: Prettier 3 stops Jest 29 writing inline snapshots, and the usual fix was refused by the guard | **Fixed, as Codex chose.** `prettierPath: null` in `jest.config.cjs`, and pinned in the guard's `JEST_PINNED`: any other value, and unset, fail | Ratchet 9 (three new cases) and 32. RED: both failed (run 7); test 32 had already reproduced the review's mechanism against the installed Jest before failing at `prettierPath === null`. 3B-M7 to 3B-M9 |
| 3 Low: after the base moves, a merge of `main` into the branch over-selects | **Recorded as R18(h)**, as the brief asked: fail-safe, gone once `main` holds the rule; rebase, not merge, before integration | §3 R18(h) |
| 4 Low (records): the box-3 plan's hex-colour probe would fail at the format step; a stale root `package.json` sentence | **Corrected.** The probe is struck in §7 and in the checkpoint, with the reason (the review's 33 files and 460 lines, confirmed by a Grep). The header's "still the only root `package.json` change" is struck and corrected | §7; header |

### What the installed tools showed

- **Jest 29.7.0, `jest-config`, `jest-snapshot` and `jest-validate` (read, then run in test 32).** `jest-config`'s `Defaults.js` sets `prettierPath: 'prettier'`. Its `normalize.js` resolves a truthy value from the root directory, and keeps `null` as `null`. `jest-snapshot`'s `SnapshotState.save()` passes it to `saveInlineSnapshots`, which loads Prettier only for a truthy path and throws for 3.0.0 or later. The error is not `MODULE_NOT_FOUND`, so it is rethrown. `jest-validate`'s `condition.js` accepts `null` for any option, so the config prints no warning, and none appeared in run 25's `pnpm check`. Test 32 runs the real `saveInlineSnapshots`.
- **`jest-expo`.** Only its `rsc/jest-preset.js` sets `prettierPath`, to `jest-snapshot-prettier`. The `jest-expo` preset this repository uses does not, as the review said.
- **Layout.** `pnpm-workspace.yaml` sets `nodeLinker: hoisted`, so Jest, `jest-snapshot` and Prettier 3.6.2 all sit in the root `node_modules`, and `apps/mobile` resolves them there.

### Test first: RED, then GREEN

The run numbers are this session's, as listed in the checkpoint.

| Step | Command | Result |
|---|---|---|
| Baseline, before any change | `rtk proxy node --test scripts/quality/*.test.mjs` | `# tests 91`, `# pass 91` (run 4) |
| Tests 13–16 written, first placed mid-file; the command test's copying moved into `installCommand` | — | — |
| RED | `rtk proxy node --test scripts/quality/touched-format.test.mjs` | `# tests 16`, `# pass 13`, `# fail 3`: the renamed check (`0 !== 1`, the review's symptom), the CI start (`Missing expected exception`), the lost local start (`Missing expected exception`). The equality test passed on the old hand-written value, which equalled the path; 3B-M2 proves it |
| GREEN, first try | the same, after deriving `RULE` and adding `holdsRule` and `refuseLostStart` | `# tests 16`, `# pass 16` |
| Ratchet 9's three cases and test 32 written, the allowlist message gaining `prettierPath` | — | — |
| RED | `rtk proxy node --test --test-name-pattern="jest.config.cjs" scripts/quality/coverage-ratchet.test.mjs` | `# pass 1`, `# fail 2`: test 9 (message without `prettierPath`), test 32 (`undefined !== null`, after its throw assertion passed) |
| GREEN, first try | the same, after `prettierPath: null` in the config and in `JEST_PINNED` | `# pass 3` |
| Formatting | `prettier --check`, then `--write` on `touched-format.test.mjs` only, then `--check` | one file to format, then all match |
| All quality tests | `rtk proxy node --test scripts/quality/*.test.mjs` | `# tests 96`, `# pass 96` |
| 3B-M1 to 3B-M9 | below | each killed |
| After restoring | Grep for mutated text; `prettier --check`; all quality tests | none; all match; 96 dots, no failure |
| `pnpm check` | `rtk proxy pnpm check` | exit 0, **281 tests** (run 25) |
| The new tests moved to the end of their files, so every earlier test number stays valid | the two files' tests | `# tests 48`, `# pass 48`: ratchet 1–31 as before and 32 new; touched-format 1–12 as before and 13–16 new |
| Final | `prettier --check` (run 28), then `rtk proxy pnpm check` (run 29) | all match; **exit 0, 281 tests**: domain 37 (536/583, 272/313, 106/117), quality 96, mobile 126 (12.23 / 10.57 / 10.23 / 18.67), plan 22. Detail in the [checkpoint](../../plan/runs/QA-9/checkpoint.md#commands-run-in-phase-3b) |

### Mutations (each restored)

Each was one edit, run, then restored before the next. 3B-M1 to 3B-M6 edited `touched-format.mjs`, 3B-M7 and 3B-M8 `coverage-ratchet.mjs`, and 3B-M9 `apps/mobile/jest.config.cjs`. They ran before the new tests moved to the end of their files. The test bodies were moved byte for byte, so the kills are given here by test name and final number.

| # | Mutation | Result |
|---|---|---|
| 3B-M1 | `RULE` back to the hand-written `'scripts/quality/touched-format.mjs'` (the pre-fix code, with the new refusals kept) | Touched-format 14: `{}: Formatting verified: the 0 touched … files … from HEAD@…: scripts/quality/touched-format.mjs is not committed yet …`, `0 !== 1`. Deriving `RULE` is what closes the review's scenario locally |
| 3B-M2 | A stale hand-written `RULE`, `'scripts/quality/format-check.mjs'` | Touched-format 13 (`'scripts/quality/format-check.mjs' !== 'scripts/quality/touched-format.mjs'`), 9 and 15 |
| 3B-M3 | The CI refusal dropped | Touched-format 15 (`Missing expected exception`) and 16 (the CI case got the local message) |
| 3B-M4 | The local refusal of a committed check with no start dropped | Touched-format 16: `Missing expected exception` |
| 3B-M5 | The CI refusal applied locally too | Touched-format 9, 10, 15 and 16: the honest uncommitted state now throws. The local fallback is needed |
| 3B-M6 | The `ls-tree` at `HEAD` read without its exit status | Touched-format 16: `Missing expected exception` for the failing `ls-tree` |
| 3B-M7 | `prettierPath` dropped from `JEST_PINNED` | Ratchet 1 (`sets prettierPath; only …`), 9 and 21 |
| 3B-M8 | `prettierPath` allowed but not pinned to `null` | Ratchet 9: `prettierPath: 'prettier'` gives no problem |
| 3B-M9 | `prettierPath: null` removed from `jest.config.cjs` | Ratchet 1 (`prettierPath is unset, not null as reviewed`), 9, 21 and 32 (`undefined !== null`) |

### Bounds

- `RULE` is derived from where the module runs. A move to a depth other than two folders under the root also moves `REPO_ROOT`, and the check then fails closed (`… is not the top of its Git work tree`).
- Test 16's lost start is simulated by a Git that lists no commit. Real Git always finds the adding commit when `HEAD` holds `RULE` and the fork point does not, so this refusal is defence in depth.
- The local fallback to `HEAD` stays for the uncommitted state (R18(a), (i)). The repository is in that state today, so `pnpm check` here still selects only `jest.config.cjs`.
- `prettierPath: null` means inline snapshots are written without Prettier, laid out by Babel's generator. A goal that adds one formats its test file with `pnpm exec prettier --write`, as for any touched file.
- Nothing on hosted CI or Linux is proven (R10).

### Review used

The phase-3 review was already persisted by Codex as `independent-review-2026-10-26T2000Z.md`, before this session began. This session read it and did not change it.

## 12. Phase 3C: the final review's three lows

### Inputs

- **The final review of phases 3 and 3B**, [reviewer-final-2026-10-26T2305Z.md](reviewer-final-2026-10-26T2305Z.md). It was already in this folder when the session began, and was left unchanged. It **executed**: on Node 22.23.1 it ran the 96 quality tests (96 pass) and `pnpm check` (**281 tests**, no failure line). It found **no critical, high or medium finding**, and three lows.
- **Codex's phase-3C brief, 27 October 2026 (AUTH-01).** One bounded correction, in the existing lane only. It asks for:
  - **all three lows resolved:**
    - the handoff's `pnpm backend:test` and platform export rows restated as required by docs/23 for this diff but deferred, never "not applicable";
    - touched-format test 17 for the detached GitHub merge shape. It is built with `commit-tree`, the baseline as first parent and the work branch as second, and run with `GITHUB_ACTIONS=true` and `FITLOG_CONTRACT_BASELINE`. It asserts the parent of the commit adopting the rule, and the selected files of the 18-file kind, as suits the fixture. It is test-first, with a `--first-parent` mutation that must fail, and the exact patch and its result are saved;
    - the format step's label added to the hosted checklist;
  - no threshold, floor, dependency, lockfile, wiring or source change;
  - **no blanket waiver:** `pnpm backend:test` and both JS exports are required before integration, and existing approvals do not permit a push;
  - the quality suite, `pnpm check`, and an explicit Prettier `--check` of the 17 untracked quality scripts and `jest.config.cjs`; only the changed test may be formatted, if it needs it;
  - none of the following: sub-agents; a commit, the index, history, a branch, status, the ledger or `main`; push, providers, network or CI; the database, Supabase or Docker; the actual runner or the replay directory. **Codex stages the reviewed candidate and checks the committed boundary after the handoff; this session must not stage.** Denied commands are recorded, never bypassed. PRD 16.1 and frozen003 hold: gym staff never read or write private health data, whatever the consent. The goal is not marked Done.

### Findings and how each was handled

| Finding | Handling | Proof |
|---|---|---|
| 1 Low (records): the handoff skipped `pnpm backend:test` and the export on false premises | **Corrected.** Both rows now say each gate is required by docs/23 §7 for this diff. `backend:test` is required for `packages/domain/package.json`. The export is required for `apps/mobile/package.json`, `apps/mobile/jest.config.cjs` and the new `apps/mobile/coverage-thresholds.json`. Neither was run in this phase, and both are deferred by Codex's brief: they must run, and pass, before integration. No waiver exists, and no row says "not required" or "not applicable" | [handoff.md](../../plan/runs/QA-9/handoff.md), "Gates" |
| 2 Low (test gap): no test covered the commit shape the hosted run sees | **Test 17 added** at the end of `touched-format.test.mjs`, so tests 1–16 keep their numbers. **No check code changed:** the review read the code as right for this shape, and test 17 passed on it first time. That it can fail is shown by 3C-M1, which only test 17 catches | Touched-format 17 (§1); 3C-M1 below |
| 3 Low (records): §7's box-3 log checklist left out the format step | **Corrected.** Step 4 now requires the format step to pass, with the label `Base: FITLOG_CONTRACT_BASELINE@…, from <the QA-9 commit>, which adds scripts/quality/touched-format.mjs` and 18 files. It also says what to do when the label or count differs | §7, "Box 3", step 4 |

### Test first, then the mutation

Test 17 tests behaviour the review read as correct, so there was no fix to show failing first. The order was:
1. test 17 written before any other change in this phase;
2. run against the unchanged check, where it passes;
3. run with the mutation, where it fails;
4. restored, where it passes again.

The mutation is the evidence that the test can fail. The run numbers are this session's, as listed in the checkpoint.

| Step | Command | Result |
|---|---|---|
| Baseline, before any change | `rtk proxy node --test --test-reporter=spec scripts/quality/touched-format.test.mjs` | `ℹ tests 16`, `ℹ pass 16` (run 5) |
| Test 17 written, at the end of the file | — | — |
| Against the unchanged check | `rtk proxy node --test --test-reporter=spec --test-name-pattern="a pull request is checked as GitHub checks it out" scripts/quality/touched-format.test.mjs` | `ℹ pass 1` (run 6) |
| 3C-M1, whole file | `rtk proxy node --test --test-reporter=spec scripts/quality/touched-format.test.mjs` | `ℹ tests 17`, `ℹ pass 16`, `ℹ fail 1`: test 17 alone (run 8) |
| Restored; formatting | Prettier `--check` of the 18 files; `--write` on `touched-format.test.mjs` only; `--check` again | only the test file to format, then `All matched files use Prettier code style!` (runs 9–11) |
| Test 17 on the formatted text | as run 6 | `ℹ pass 1` (run 12) |
| 3C-M1 again, on the final text | as run 6 | `ℹ pass 0`, `ℹ fail 1` (run 13) |
| Restored | Grep of `scripts/` for `first-parent` | no match |
| All quality tests | `rtk proxy node --test scripts/quality/*.test.mjs` | `# tests 97`, `# pass 97`, `# fail 0` (run 14); test 17 is number 81 in the full run |
| `pnpm check` | `rtk proxy pnpm check` | exit 0, **282 tests**: domain 37 (536/583, 272/313, 106/117), quality 97, mobile 126 (12.23 / 10.57 / 10.23 / 18.67), plan 22 (run 15) |
| Final, after the records | Prettier `--check` of the 18 files (run 18); `rtk proxy pnpm check` (run 19) | all match; **exit 0, 282 tests**: domain 37 (**533/583**, exactly the threshold; 272/313; 106/117), quality 97, mobile 126 (12.23 / 10.57 / 10.23 / 18.67), plan 22. The 533 is an R3 sample (§3), not a change: run 19 came after prose edits only |

### Mutation (restored)

| # | Mutation | Result |
|---|---|---|
| 3C-M1 | `'--first-parent'` added to `ruleStart`'s `git rev-list` call in `touched-format.mjs`, after `'--full-history'`. The exact patch is [phase-3c-mutation-first-parent.patch](phase-3c-mutation-first-parent.patch) (`@@ -159,6 +159,7 @@`, one added line) | **Killed by touched-format 17 only.** `AssertionError [ERR_ASSERTION]: measured from the parent of the commit that adopts the rule, not from the baseline`, actual differing from expected. In run 8 that was `+ 'd0277026e8f6…'` / `- '34785ab905e3…'`, at line 680 of the pre-format text. In run 13 it was `+ '2745b7bca05e…'` / `- '20f17e5e8510…'`, at line 688 of the final text. Fixture IDs differ per run, because each scratch repository is new. In run 8, **tests 1–16 all passed with the mutation in place**: before phase 3C nothing caught it, as the review said |

- **How it was applied.** `rtk proxy git apply --check` on the patch was **denied** (run 7) and not retried, so the patch was never applied by Git. The patch file is the exact one-line edit, written by hand in unified-diff form. The same edit was made with the Edit tool. A Read of lines 155–166 then showed `'--first-parent',` at line 162, between `'--full-history',` (161) and `` `${fork}..HEAD`, `` (163), as the hunk says.
- **How it was restored.** The same edit was reversed with the Edit tool, after each run. A Read of lines 155–165 showed the original call, and a Grep of `scripts/` found no `first-parent`. **No hash** of `touched-format.mjs` was taken before the mutation, so its restoration rests on the Read, the Grep, and the passing test and Prettier runs afterwards. It does not rest on a byte comparison.
- **Why it fails (inferred, not printed).** In Git's first-parent walk, the only commit of `<baseline>..HEAD` on the first-parent chain is the merge itself. The merge differs from its first parent at `RULE`, so it is listed first, and the base becomes its first parent, the baseline. That would demand the earlier goal's unformatted files. The run printed only that the base was not the adopting commit's parent. That it was the baseline is inferred from Git's documented walk.

### Bounds

- **Not GitHub itself.** Test 17's merge is built with `git commit-tree`, not by GitHub. The real `refs/pull/<n>/merge` and `actions/checkout` have never run against this check (R10).
- **Ancestry.** In the fixture the baseline is an ancestor of the change. Today that holds for the real case: the final review read from the reflog that `origin/main` (`c8f6d7f`) is an ancestor of `2a95726`. The merge's tree is then the change's tree, which is what a test merge contains when the head already holds the base. A base that has moved past the branch makes its own files count as touched (R18(h)). That fails safe, and is not tested here.
- **9 files, not 18.** The fixture's adopting commit has nine JavaScript and TypeScript files: the check, the seven modules it imports (copied from this repository) and `jest.config.cjs`. It does not have the real 18. **The 18-file selection in this repository is still unobserved.** It needs the committed or staged state, which Codex checks after this handoff.
- **No check code changed in phase 3C**, apart from the mutation, which was reversed (above). The check and the seven modules the fixture copies are therefore the code the final review ran.

### Review used

The final review was already persisted by Codex as `reviewer-final-2026-10-26T2305Z.md` before this session began. This session read it and did not change it.

## 13. Phase 3D: the phase-3C review's findings, and the local commit

### Inputs

- **The review of phase 3C**, [reviewer-final-2026-10-27T0005Z.md](reviewer-final-2026-10-27T0005Z.md), from session `aab700d3-e7ca-4d66-8f25-169ac16ec95b`. It was already in this folder when phase 3D began, and was left unchanged.
  - It **executed** on Node 22.23.1: the 97 quality tests (97 pass), `pnpm check` (exit 0, **282 tests**), and Prettier `--check` of the 18 files, each named.
  - It found no critical or high finding, one medium (records) and one low (R3), and called phase 3C's code and test 17 sound.
  - It did not run the 3C-M1 mutation.
- **The persisted implementer finals:**
  - [implementer-final-2026-10-26T2235Z.md](implementer-final-2026-10-26T2235Z.md): phase 3B's, collected by Codex from session `1e2bed82-07fa-43fe-9eae-9aba2995f855`;
  - [implementer-final-2026-10-26T2335Z.md](implementer-final-2026-10-26T2335Z.md): phase 3C's, session `de350e6e-5af0-4152-96a1-ef3baffd7a32`.

  Both are verbatim records. They were read and left unchanged, including their "your … authorisation" wording for box 3.
- **Codex's phase-3D brief, 27 October 2026 (AUTH-01).** One bounded phase in this lane. It:
  - **accepts the independent code and test review**: 97 quality tests, 282 tests in `pnpm check`, Node 22.23.1, and phase 3C's code sound;
  - asks for finding 1 to be resolved in the mutable records before staging. The handoff, checkpoint and this file must say the push, publication and hosted draft pull request need the owner's specific approval, and that neither AUTH-01's routine delegation nor any earlier approval grants publication. The verbatim implementer and reviewer finals stay as written. The records must show the actual current review, not a pending one. No code, config or threshold changes;
  - assigns finding 2, R3's per-line flip list, to QA-9's next phase, with no threshold lowered. Existing coverage artifacts are to be analysed if any exist, with no repeated test runs made just for samples;
  - then permits one scoped local stage of exactly eleven named paths and one local commit with QA-9 in the subject. The staged diff, its scope and `git diff --check` are inspected first. `pnpm check` runs on Node 22.23.1 before the commit (expect 18 files and the uncommitted label) and after it (expect 18 files and a label naming the QA-9 commit). A failure stops the phase with the staged state kept;
  - rules out sub-agents, a push, publication, provider calls, paid credentials, overage and deploys. It also rules out status, GOALS, ACCEPTANCE or `main` edits, and integration, rebase or merge, since the coordinator serialises those later. Installs, exports, the backend, the database, Supabase, Docker and the network are out too. Denied commands are recorded and never bypassed.
  - PRD 16.1 and frozen003 hold: gym staff never read or write private health data, whatever the consent. The goal is not marked Done.

### Finding 1 (medium, records): who approves the box-3 push

**The rules.**
- docs/23 §6 (`23-MASTER-PLAN.md:136-137`): "Nothing is pushed, deployed or submitted unless the owner allows it (`var/orchestrator/config.json` `"push": true`, or a person doing it by hand)."
- `INBOX.md:240`: `main` stays local until the owner pushes; "§7 calls this an owner gate". Line 239: "The repo is public."
- AUTH-01 (`09-PROJECT-TRACKER.md:61`) delegates "routine product, engineering and vendor-technical choices" and "final technical sign-off" to Codex. Account access, payments, external messages, legal and licence positions, and device proof still need real evidence. Publication is not among the delegated choices.

So the box-3 push and draft pull request need the owner's specific approval. Codex's go-ahead doesn't grant it, and no existing approval does.

**What changed.** Live guidance was corrected in place. Historical phase lists keep their wording, with the wrong approver struck through and the right one named. Line numbers are from before phase 3D.

| Where | Kind | Correction |
|---|---|---|
| `handoff.md:18` (box 3) and `:74` ("Left undone") | live | Rewritten in the phase-3D handoff: the owner's specific approval under docs/23 §6. AUTH-01 and existing approvals don't cover publication |
| `checkpoint.md:30` (3C's "Resume here", step 6) | live, then historical | Phase 3D's own "Resume here" says it, and 3C's list, kept for the record, strikes "Codex's specific authorisation" |
| `checkpoint.md:744` (box 3), `:755` (Remaining phases, step 4), `:773` (R10 owner), `:792` (Decisions, 3C item 5) | live | Struck and corrected to the owner's specific approval |
| `checkpoint.md:63`, `:565`, `:801`, `:824`, `:832`, `:839`, `:847`, `:869` | historical lists | Tagged in place: the owner's approval, not Codex's (docs/23 §6). The rest of each line is unchanged |
| This file, `:418` (R10 owner) and `:662` (§7, step 1) | live | Struck and corrected. §7's step 1 now names the config key, the inbox gate, AUTH-01's limit and the unpushed commits |
| This file, `:634` (§7's finding-4 row) | historical | Tagged in place |

**Left unchanged on purpose:**
- `reviewer-final-2026-10-26T2305Z.md:114` and `implementer-final-2026-10-26T2335Z.md:19`, as the review asked, since they are verbatim records. So is `implementer-final-2026-10-26T2235Z.md`.
- This file's `:882` and `:1060` (line numbers from before phase 3D). They restate Codex's phase-3 and phase-3C briefs ("needs a specific push authorisation", "existing approvals do not permit a push"). Neither names Codex as the approver, and both stay true.

### Finding 2 (low, R3): assigned to QA-9's next phase

**What artifacts exist** (Glob, phase 3D):
- **No domain coverage file.** `packages/domain/coverage/**` matches nothing. The only `lcov.info` in the worktree is under `node_modules/stream-buffers/`. The domain's spec and exact reporters write to stdout, and nothing keeps their per-line data.
- **Mobile only:** `apps/mobile/coverage/coverage-summary.json` and `coverage.txt`, from Jest. Mobile coverage doesn't vary from run to run. Phase 1 found it deterministic over two runs, and every unmutated `pnpm check` recorded since gives 254/2076, 164/1551, 84/821 and 191/1023. The other mobile figures in this file (`254/1503`, `254/726`) come from mutation runs that narrowed the scope.
- **Per-line domain data** exists only as phase 1's five-run table, in [coverage-baseline.md §4](coverage-baseline.md), "Line noise".

**What those artifacts support, and what they don't.**

| Question | From the existing artifacts | Status |
|---|---|---|
| What is 533? | 583 lines, minus 43 truly uncovered lines, minus 4 lines reported uncovered in phase 1's five runs, minus the three known flipping lines (`calculations.ts:3`, `dates.ts:19`, `finance.ts:14`, each a function's declaration line) = 533. Phase 1's runs 3 and 4 show exactly that: 533, with all three uncovered | **Fits** the threshold, 91.42 = 533/583 |
| Is every later 533 the same three lines? | No later run kept per-line data | **Unknown** |
| How many more lines flip? | Phase 2's 537 and 538 are above the 536 that the three known lines allow. 538 − 536 = 2, so **at least two** of the 47 lines phase 1 saw uncovered are sometimes covered. Phase 2B wrote "at least one", which understates it. `coverage-baseline.md` is left unchanged, because guard test 2 reads it | **At least two; which ones is unknown.** `calculations.ts:118`, the declaration line of `membershipEndExclusive` whose body is covered, is the same kind of line as the three known ones. That makes it a candidate, not a finding |
| Can a run reach 532? | Only if some line outside the three known ones can flip from covered to uncovered. In 36 recorded runs, 532 has never come up. 533 has come up at least 8 times by the records: phase 1's runs 3 and 4, phase 2B's two, phase 2C's, Codex's phase-2D run, phase 3C's run 19 and the review's. The review counted 6; phase 2's seven runs aren't listed one by one | **Not ruled out** |
| Which way does it fail? | 532 would fail `pnpm check` on the exact reporter's integer comparison | **Safe:** a false failure, never a false pass |

**Assignment.** Codex's phase-3D brief assigns R3's per-line flip list to **QA-9's next phase**. It is still open.
- **Method:** run the lcov variant several times. That is the measurement command in [coverage-baseline.md §2](coverage-baseline.md), not a change to the domain script, which the template pins. Compare the `DA:` lines, and list each flipping line with the direction it flips.
- **Rule: no threshold is lowered.** If the list shows a line that can flip below 533, Codex chooses the response in that phase. Lowering the threshold isn't one of the options.
- **Others:** QA-10 still owns flip-aware raises, and PL-1 the first Linux sample.
- **No runs just for samples:** phase 3D's two required `pnpm check` runs are gates. They add two samples, recorded after the commit.

### Staging and the commit

**Planned**, as Codex's brief directs:
1. Stage only these paths, each named: `.prettierrc.json`, `package.json`, `pnpm-lock.yaml`, `apps/mobile/coverage-thresholds.json`, `apps/mobile/jest.config.cjs`, `apps/mobile/package.json`, `packages/domain/package.json`, `docs/23-MASTER-PLAN.md`, `docs/evidence/QA-9/`, `docs/plan/runs/QA-9/` and `scripts/quality/`.
2. Inspect the staged file list, its stat and `git diff --cached --check`.
3. Run `pnpm check` on Node 22.23.1 before committing. Expected:
   - the format step selects **18 files**: the 17 `scripts/quality/*.mjs` and `jest.config.cjs`;
   - its label reads `Base: main@2a95726912c6, from HEAD@2a95726912c6: scripts/quality/touched-format.mjs is not committed yet, so only uncommitted edits count.`;
   - by this phase's count, 26 staged files are listed as not JavaScript or TypeScript. That is the review's 25 plus its own file.
4. On a pass, make one local commit with QA-9 in the subject.
5. Run `pnpm check` again. Expected: 18 files, and the label `Base: main@2a95726912c6, from <the QA-9 commit>, which adds scripts/quality/touched-format.mjs`.

**Results.** The results are recorded after the commit, in the checkpoint and the handoff, so they are not part of the commit. This section, as committed, holds only the plan and the expectations.

### Bounds

- **Records only.** No code, config, threshold, floor, dependency, lockfile or docs/23 change.
- **Local only.** No push, no pull request, no rebase or merge onto `main`, no integration.
- **Not run in phase 3D:** `pnpm backend:test`, the iOS and Android export, `pnpm install --frozen-lockfile`, and the floor comparison at the exact `main` commit. docs/23 §7 requires the first two for this diff. All of them are deferred to before integration, not waived.

### Results (written after commit `4a7ee21`, and not part of it)

The run numbers are the checkpoint's. The full outputs are in [phase-3d-check-outputs.md](phase-3d-check-outputs.md).

| Step | Expected | Actual |
|---|---|---|
| Stage (runs 6–12) | The eleven paths only | **As expected.** 44 files: 6 modified, 38 added, nothing unstaged or untracked. `git diff --cached --check` printed nothing. The six tracked files' line counts match the earlier phases' (jest.config.cjs 10, mobile `package.json` 3, docs/23 106, root `package.json` 3, domain `package.json` 2, lockfile 10). docs/23 has one hunk, in §9 rule 3. The lockfile adds only `prettier@3.6.2` |
| `pnpm check`, staged (run 13) | Exit 0; 18 files; the uncommitted label; 26 not JavaScript or TypeScript | **As expected.** Exit 0 and 282 tests (37 + 97 + 126 + 22). `Formatting verified: the 18 touched JavaScript and TypeScript files … Base: main@2a95726912c6, from HEAD@2a95726912c6: scripts/quality/touched-format.mjs is not committed yet … Not checked: 26 not JavaScript or TypeScript.` Domain 533/583 (exactly the threshold), 272/313, 106/117. Mobile 254/2076, 164/1551, 84/821, 191/1023 |
| The commit (run 15) | One local commit, QA-9 in the subject | **As expected.** `4a7ee2100bffbfa77671017b83b1300b341a1dec`, `test(QA-9): coverage ratchet, gate wiring, exact domain thresholds and Prettier on touched files`: 44 files, 10380 insertions, 5 deletions. No hook output. The tree was clean after it (run 17) |
| `pnpm check`, committed (run 18) | Exit 0; 18 files; a label naming the commit | **The format step as expected; the gate failed.** `Formatting verified: the 18 touched JavaScript and TypeScript files … Base: main@2a95726912c6, from 4a7ee2100bff, which adds scripts/quality/touched-format.mjs. Not checked: 26 not JavaScript or TypeScript.` The guard passed against both baselines. Typecheck and lint passed. The domain test then failed: `Error: exact branches coverage 271/313 (86.5815%) does not meet the threshold of 86.9%`, so **`pnpm check` exited 1** (R19). Lines were 536/583 and functions 106/117. The mobile tests and the plan build did not run |

**What the two runs add to R3**, from the spec reporter's "uncovered lines" column, which every `pnpm check` prints:
- run 13 (533) listed `calculations.ts:3`, `dates.ts:19` and `finance.ts:14` uncovered;
- run 18 (536) listed none of them.

So this 533 is the three known flipping lines, as phase 1's runs 3 and 4 were. Each required run already prints the per-line data R3 needs, so QA-9's next phase can collect its flip list from those outputs, with no lcov variant and no extra runs.

**Bounds of this record.** The commit is kept as made: not amended, reset or reverted. Nothing was re-run to confirm R19: the mechanism is read from the source and shown by the two runs' own diagnostics. No threshold, test or code changed.

## 14. Phase 3E: R19 fixed by a domain test

*(Written in phase 3E, uncommitted. Everything in this section is the implementer's account, and no reviewer has re-run it yet. The outputs are verbatim in [phase-3e-check-outputs.md](phase-3e-check-outputs.md).)*

### Inputs

- **Codex's phase-3E brief** (27 October 2026, AUTH-01) assigns one bounded phase: fix the high finding R19. What it fixes:
  - **Commit `4a7ee21`** is a valid local candidate.
  - **Its committed `pnpm check` failed** at domain branches 271/313 against 86.90, because the duplicate-baseline branch at `snapshot-contract.ts:151` depended on `HEAD` = `main`.
  - **Codex read the branch and the test independently.**
- **A routine ownership exception.** The brief allows edits only to `packages/domain/src/contract.test.ts`, which is S8 Member backend's, and to QA-9's own evidence, checkpoint and handoff. Forbidden:
  - production code or the domain contract;
  - thresholds, config, dependencies and the lockfile;
  - staging, a commit, a rebase or integration.
- **The test it asks for:**
  - deterministic and meaningful;
  - through the injected `git` function, preferred because it avoids Git mutations, or else an isolated scratch fixture;
  - covering both a duplicate and a distinct baseline;
  - with assertions on sources and notes that don't depend on the host's `HEAD` or `main`, and that don't mirror the implementation;
  - showing that each immutable baseline is checked exactly once, and that distinct histories are both protected.
- **What stays:** the existing live history test, commit `4a7ee21` and every post-commit record.
- **What to run:** the pinned Node 22.23.1 domain tests and the full `pnpm check`, once each after the fix. Analyse R3 from the normal outputs' per-line diagnostics. Format the touched test only if the gate requires it, with no broad formatting.
- **What else the brief fixes:** RED is recorded as already observed at `4a7ee21`. No sub-agents run. PRD 16.1 and frozen003 apply: gym staff never read or write private health data, whatever the consent.

### RED, as already observed

Phase 3D's run 18 at `4a7ee21`: `Error: exact branches coverage 271/313 (86.5815%) does not meet the threshold of 86.9%`. `snapshot-contract.ts` was at 87.31% (117/134), and the run printed `ℹ main@2a95726912c6: checked`. As the brief directs, it was not re-run before the fix ([phase-3d-check-outputs.md](phase-3d-check-outputs.md)).

### The test (`packages/domain/src/contract.test.ts`, after the last existing Git test)

**The Git double.** `memoryGit` is a read-only Git double over an in-memory history of five commits:
- a root, `a`, holding 0.1.0;
- `main`'s tip, `b`, which adds 0.2.0;
- a branch commit, `c`, which adds 0.3.0;
- a branch commit, `d`, which rewrote 0.2.0 together with its manifest hash, so the pair is self-consistent;
- a later `main`, `e`, which added its own 0.3.0 after the branch forked.

How it behaves:
- It answers as Git does at the top of `packages/domain`: `rev-parse --show-prefix`, `rev-parse --verify`, `merge-base`, `ls-tree` and `cat-file blob`.
- It records each commit whose tree it lists.
- It refuses any other command, and any other working directory.
- No real Git runs.
- Each call passes `env` as `{}`, so the host's `CI` and `FITLOG_CONTRACT_BASELINE` don't matter either.

The snapshots are small synthetic files. Each manifest records their SHA-256 values, as the snapshot command writes them.

| Test | States | What it asserts |
|---|---|---|
| `HEAD and main at one fork point are one baseline, listed once, in any host checkout` | `HEAD` at `main`; `HEAD` behind `main` | One source, `HEAD@<fork>`. Notes `HEAD@<fork>: checked` and `main@<fork>: same commit as an earlier baseline`. The fork point's tree listed exactly once. That source holds the fork point's manifest, and it still catches an uncommitted, self-consistent rewrite of 0.1.0 |
| `a branch ahead of or diverged from main checks both fork points, each once, and each protects the history it records` | `HEAD` ahead of `main` (`c` over `b`); a committed rewrite (`d` over `b`); diverged (`c` against `e`) | **Ahead:** two sources, both `checked`, each tree listed once, and no problem in the committed state. An uncommitted rewrite of 0.3.0 is caught by `HEAD` alone, since `main`'s fork point predates 0.3.0.<br>**Committed rewrite:** `HEAD` reports nothing, because it records the rewrite. `main`'s fork point catches it.<br>**Diverged:** `main`'s baseline is the fork point `b`, not `main`'s tip `e`, and `e`'s tree is never listed. The branch is not asked for the 0.3.0 that `main` added later, though against `e` its own 0.3.0 would be refused |
| `a clone without a local main checks HEAD alone and notes main as not found` | No local `main`, the shape of a CI clone | One source, `HEAD@<c>`. Notes `HEAD@<c>: checked` and `main: not found (exit 1); skipped`. `HEAD` still catches a rewrite of 0.2.0 |

**Unchanged:** the live tests (`committed snapshot history is unchanged against each available Git baseline` and the six Git tests after it) and every other test. Two imports were added: `dirname` and the `ContractSource` type.

**Formatting.** Touching the file made the format step select it, and the file was not in Prettier's format (`prettier --check` warned, run 4). So the whole file was formatted with Prettier 3.6.2:
- `--debug-check` came first and reported no difference (run 5);
- then `--write`, after the first version (run 6) and again after the revision (run 9);
- the diff is 713 insertions and 89 deletions (`git diff --numstat`, run 15), the new tests plus the re-wrapped old lines.

No other file was formatted. `pnpm check`'s format step then selected **19 files**: the 18, plus this test.

### Why the first version measured 271/312, and how the final one avoids it

The first version had only the first two tests. It passed all 39 domain tests but measured **271/312** (run 7). `snapshot-contract.ts` was at 87.97%, 117/133:
- the duplicate-baseline branch was now covered;
- but the total had fallen by one, and so had the covered count.

**The model.** This comes from V8's block-coverage merge passes in `src/debug/debug-coverage.cc`, recalled from that source and not read in this session:
- V8 deletes a block range whose execution count equals its parent's.
- It also merges adjacent sibling ranges whose counts are equal.
- Node's test runner counts every remaining block range as a branch.

So the branch denominator depends on execution counts.

*(3F, phase-3E review finding 2.)* **The model is not confirmed.** It was recalled, not read, and the review doubts one step of it. The review believes V8 also records a separate range after each early `if … throw` or `return`. `gitBaselines` has five such exits before its loop (`snapshot-contract.ts:131–137`). If the review is right, the loop body's direct parent is the last of those ranges, not the function, and "the loop body's count equals the call count" is a doubtful account of the 271/312 merge. Run 10's match is one prediction that held, not proof of the mechanism. Phase 3F read no V8 source and ran no coverage diagnostic, so the question stays open. The pass doesn't depend on it ("Margin", below).

**Where the counts met.** Count `gitBaselines`' calls (C) and its loop-body runs (I) in `contract.test.ts`:
- the existing tests give I − C = −4 locally, where the live default-refs calls at the history test and the `CI refuses…` test each run 2 iterations;
- in CI it is −5, because the history test's call is configured there and runs 1 iteration;
- each default-refs call through the double adds +1.

With the first version's four such calls, I = C = 26 locally. So the loop body's range had the function's count and was deleted: one covered branch gone.

The model fits all four measured states:

| State | Duplicate branch (`:151`) | `not found` branch (`:145`) | Loop-body range | `snapshot-contract.ts` | Domain |
|---|---|---|---|---|---|
| Phase 3D run 13: `HEAD` = `main`, no new test | covered (live calls) | uncovered | kept (I − C = −4) | 118/134 | 272/313 |
| Phase 3D run 18: `HEAD` ahead, no new test | uncovered | uncovered | kept | 117/134 | 271/313 |
| 3E run 7: `HEAD` ahead, first version (4 calls) | covered | uncovered | **merged** (I − C = 0) | 117/133 | 271/312 |
| 3E runs 10 and 11: `HEAD` ahead, final version (6 calls) | covered | covered | kept (I − C = +2) | **119/134** | **273/313** |

**What the final version adds.** It adds two real states that nothing tested before:
- **diverged from `main`:** `main`'s baseline must be the fork point, not the tip;
- **no local `main`:** the CI-clone shape R19 worried about. It also covers the `not found; skipped` branch, which was uncovered in every earlier run.

That makes six default-refs calls, so I − C = +2 locally and +1 in CI.

**The prediction, and the result.** Before run 10, the model predicted 119/134 for `snapshot-contract.ts` and 273/313 for the domain. Run 10 measured 88.81% (119/134) and 273/313, and run 11 (`pnpm check`) the same.

**Margin.** 86.90% of 313 is 271.997, so 272 covered is the least that passes:
- with both branches covered by the double in any state, one further equal-count merge leaves 272/312 (87.18%), which still passes;
- so would the first version's coincidence, now that the `not found` branch is covered too;
- one newly uncovered branch would leave 272/313 (86.90%), exactly the threshold.

*(3F, phase-3E review finding 2.)* Those bullets give one direction only, a single merge, and lean on the model. Restated as the reporter computes it, the gate passes when `covered × 10000 >= 8690 × total` (`exact-coverage-reporter.mjs:50`, with 86.9 scaled to 8690). At 273/313 that is 2,730,000 against 2,719,970, a margin of 10,030 in those units. What each kind of change costs:

| Change in the count | Cost | Absorbed at 273/313 | First failure |
|---|---|---|---|
| A covered branch becomes uncovered | 10,000 | **one** (272/313) | two (271/313) |
| An equal-count merge removes a covered range | 1,310 | **about seven** (266/306 is the seventh) | the eighth (265/305) |
| A first call exposes an uncovered branch | 8,690 | one (273/314) | two (273/315), unless at least six exposed covered branches come with them (279/321 passes, 278/320 fails) |
| A first call exposes a covered branch | a gain of 1,310 | — | — |

- **Merges remove only covered ranges.** That is the review's reading, and it holds whichever account of V8 is right. Inside a function that runs, an uncovered block's parent has a non-zero count, so the two counts can't be equal.
- **First-call exposure** is the review's inference, and no QA-9 run has shown it. A domain function no test has called contributes no inner branches to the count. A test that first calls it adds the branches it hides, covered or not.
- **So any domain test change can move the count,** not only a change to `gitBaselines`' calls. Read both the numerator and the denominator after one.
- **Git state alone no longer moves the numerator.** The double covers both Git-dependent branches, `:145` and `:151`, in every host state.

### Predicted, not run

- **`HEAD` = `main`, locally.** The live calls' `main` iteration takes the duplicate path. The counts move, but no range's count meets its parent's or a neighbour's, so 273/313 is predicted.
- **CI, with `FITLOG_CONTRACT_BASELINE` set.** Whether or not a local `main` exists, no range coincides (I − C = +1), and both branches stay covered by the double, so 273/313 is predicted.

These rest on the model. They are not measurements. Re-measuring both is still owed, and a hosted run needs the owner's approval to push (box 3).

*(3F, phase-3E review finding 2.)* The model is unconfirmed (above), so treat each forecast as "the margin should hold", not as an exact count. If either state measures something other than 273/313, the table under "Margin" shows whether it still passes. The review's `pnpm check` measured 273/313 again, but only in run 11's state, with `HEAD` ahead of `main`.

### R3: per-line data from the normal outputs

Every run prints the uncovered domain lines. These five do, and need no lcov variant:

| Run | Lines | Uncovered among the four that flip |
|---|---|---|
| 3D run 13 (staged, `HEAD` = `main`) | 533 | `calculations.ts:3`, `calculations.ts:118`, `dates.ts:19`, `finance.ts:14` |
| 3D run 18 (committed) | 536 | `calculations.ts:118` |
| 3E run 7 (domain, first version) | 533 | all four |
| 3E run 10 (domain, final version) | 537 | none |
| 3E run 11 (`pnpm check`) | 536 | `calculations.ts:118` |

**What the five runs show:**
- **46 lines are uncovered in all five:**
  - `calculations.ts` 1, 12–13, 44–51, 70–77, 79–85 and 87–89;
  - `snapshot-contract.ts` 205–218 and 223;
  - `encoding.ts` 1;
  - `models.ts` 112.
- **So 533 is the 46 plus all four flippers.** `calculations.ts:118` is the fourth flipper, next to phase 3D's three.
- **The lines don't follow the Git state or the test change:**
  - run 7 and run 13 differ in Git state, and both are 533;
  - runs 10 and 11 are the same code, at 537 and 536.
- **Phase 2's 538 (583 − 45)** needs at least one of the 46 to be covered sometimes.
- **532 has never been seen**, now in 41 runs.

So line coverage still varies from run to run, and branch coverage did not. Every other file's branch figure was the same in all five runs. R3's flip list and the threshold decision stay with QA-9's next phase, and QA-10, with no threshold lowered.

### What stays unproved

- **Can the new tests fail?** Not shown by a run. The brief forbids production changes, even temporary ones, so `snapshot-contract.ts` was never mutated. Mutations a fresh reviewer could run on a scratch copy, with the expected result:
  - ~~drop the `seen` check at `:151`: the one-fork-point test fails, with two sources and the fork point listed twice;~~
  - ~~use `main`'s tip instead of the fork point: the diverged case fails, with label `main@eeeeeeeeeeee` and tip `e` listed;~~
  - ~~stop on a ref that is not found: the no-local-`main` test fails on its notes.~~

  *(3F, phase-3E review finding 1.)* The third bullet allowed an edit no test can detect, so the next reviewer could wrongly conclude a test is weak. The bullets are replaced by exact diffs below. Apply each alone, to a scratch copy of `packages/domain/src/cli/snapshot-contract.ts` as it stands, then restore it. The killers are **predicted from reading the tests, not run**: neither the review nor phase 3F ran any mutation. Test 1 is `contract.test.ts:633`, test 2 is `:676`, test 3 is `:757`.

  **Mutation 1: drop the duplicate check (`:151`).**
  ```diff
  -    if (seen.has(base)) { notes.push(`${label}: same commit as an earlier baseline`); continue; }
  ```
  - **Killed by test 1,** at its first assertion (`:651`), in its first state, `HEAD at main`. There are two sources, `HEAD@bbbbbbbbbbbb` and `main@bbbbbbbbbbbb`. Its second state, `HEAD behind main`, would fail the same way, but the first failure ends the test.
  - **Not killed elsewhere.** Tests 2 and 3 have distinct fork points or one ref. The live calls at `:214` and `:399` still pass, since a duplicate source reports no problem and the first note is unchanged.

  **Mutation 2: `main`'s tip instead of the fork point (`:149`).**
  ```diff
  -    const base = fork.stdout.toString('utf8').trim();
  +    const base = commit.stdout.toString('utf8').trim();
  ```
  - **Killed by test 1,** in its second state, `HEAD behind main`, at `:651`: the sources are `HEAD@aaaaaaaaaaaa` and `main@bbbbbbbbbbbb`. §14's first list didn't name this killer. The first state passes, because there the tip is the fork point.
  - **Killed by test 2,** in its diverged case, at `:728`: the label is `main@eeeeeeeeeeee`, not `main@bbbbbbbbbbbb`. The ahead and committed-rewrite cases pass first, since `main`'s tip `b` is their fork point. The diverged case's later assertions, tip `e` listed and 0.3.0 refused, are never reached.
  - **Not killed** by test 3, which has no `main`, or by the live calls on a host whose `HEAD` is at or ahead of `main`.

  **Mutation 3a: a missing ref fails closed locally too (`:144`).**
  ```diff
  -    if (commit.status !== 0 && configured !== undefined) throw new Error(`${BASELINE_ENV}=${ref} is not a commit in this repository (${failure(commit)}); CI must fetch full history`);
  +    if (commit.status !== 0) throw new Error(`${BASELINE_ENV}=${ref} is not a commit in this repository (${failure(commit)}); CI must fetch full history`);
  ```
  - **Killed by test 3,** which throws at `:758` with `FITLOG_CONTRACT_BASELINE=main is not a commit in this repository (exit 1); …`.
  - **Not killed elsewhere** in this worktree. Every other case has a local `main` or a configured baseline, and the `not a commit` test at `:405` configures one. Inferred, not run: on a host with no local `main`, as a CI clone may be, the live call at `:399` would throw too.

  **Mutation 3b: drop the note (`:145`).**
  ```diff
  -    if (commit.status !== 0) { notes.push(`${ref}: not found (${failure(commit)}); skipped`); continue; }
  +    if (commit.status !== 0) { continue; }
  ```
  - **Killed by test 3,** at its notes assertion (`:763`): the notes hold only `HEAD@cccccccccccc: checked`. Its sources assertion at `:759` passes first.

  **Mutation 3c, which survives: `break` for `continue` (`:145`).**
  ```diff
  -    if (commit.status !== 0) { notes.push(`${ref}: not found (${failure(commit)}); skipped`); continue; }
  +    if (commit.status !== 0) { notes.push(`${ref}: not found (${failure(commit)}); skipped`); break; }
  ```
  - **Not killed,** and neither is `return { sources, notes };` in place of `continue`. The note is pushed before the jump. In every test the ref that is not found is `main`, the last default ref, so all three give the same sources and notes.
  - **Where they differ,** inferred from the code: only when a ref before the last is not found. With the default refs, that is a `HEAD` that resolves to no commit, as on an unborn branch. Then `continue` goes on to `main` and notes it, while `break` and `return` stop. No test builds that state.
  - **So the survivor is a gap in the inputs,** not a weak assertion in test 3. Closing it means a new test, and this phase changes no test. It is proposed for QA-10, beside the test split Codex assigned it (finding 3). Codex decides.
- **The two predicted states** above, and a hosted run.
- **Independent runs of runs 10 and 11.** These are the implementer's runs. *(3F: the phase-3E review's `pnpm check`, on Node v22.23.1, reproduced run 11: 285 tests, 273/313, 19 files. Run 10's domain test ran inside it, not on its own.)*
- **The committed state.** Once Codex commits the test, the format step selects 19 files, not 18. §7's box-3 step 4, which expects 18, needs that correction at the same time. *(3F: §7's step 4 now says 19 and names `contract.test.ts`. Phase 3F commits the test, §15.)*

### Bounds

- **Changed:**
  - `packages/domain/src/contract.test.ts`, under the brief's exception;
  - this file, the checkpoint and the handoff;
  - the new [phase-3e-check-outputs.md](phase-3e-check-outputs.md).
- **Not changed:**
  - production code, `snapshot-contract.ts` and the domain contract, not even temporarily;
  - every threshold, the floor, config, dependencies and the lockfile;
  - every other file, and other files' formatting.
- **Git:** nothing was staged, committed, rebased, merged, pushed or integrated. Commit `4a7ee21` is kept as made. Phase 3D's post-commit records are kept, with phase-3E notes added, struck or tagged rather than rewritten.
- **Not run:**
  - `pnpm backend:test`, the exports and `pnpm install --frozen-lockfile`, all still deferred to before integration;
  - no network, database, Docker, Supabase, provider or paid API was used.
- **Denied in phase 3E and not worked around:**
  - the first, compound command;
  - an lcov diagnostic run of `contract.test.ts`. The analysis above uses only the normal outputs and the model;
  - `git rev-parse HEAD`, at the end. `git log` showed `HEAD` instead.

## 15. Phase 3F: the phase-3E review's findings, and the second local commit

*(Written in phase 3F, before its commit, and part of it. The stage, the commit and the `pnpm check` after it are recorded after the commit, uncommitted: in the checkpoint, the handoff and `phase-3f-check-outputs.md`.)*

### Inputs

- **Codex's phase-3F brief** (27 October 2026, AUTH-01) accepts the independent R19 review, [reviewer-final-2026-10-27T0135Z.md](reviewer-final-2026-10-27T0135Z.md): 285 tests, Node 22.23.1, 273/313 branches, 19 format files, and no critical, high or medium finding. That is acceptance (11) in the header. The coordinator persisted the review before this phase, and phase 3F read it without changing it.
- **One bounded correction-and-local-commit phase.** What the brief fixes:
  - fix the review's low findings 1 and 2 in the records, exactly. Also correct the stale line numbers, and §7's count to 19, naming `contract.test.ts`;
  - finding 3, the test split, is QA-10's, and the test doesn't change again now;
  - production code, config, thresholds and the existing test code stay as they are. Only QA-9's own records change;
  - stage exactly the nine paths the review names, and inspect the staged set, its stat and `--check`;
  - make one local commit, `test(QA-9): cover deterministic Git baseline histories`, on top of `4a7ee21`, which stays. No amend, reset, rebase or integration;
  - stop on an unexpected path or a gate failure. No threshold or floor is lowered;
  - after the commit, inspect `git log`, `git show` and `git status`, then run `pnpm check` once on the pinned Node 22.23.1. Record the branch and line fractions, the 285 tests, the 19 files and the label `from 4a7ee2100bff`, uncommitted.
- **Still open, by the brief:** the floor at the exact `main` commit, `pnpm backend:test`, both JS exports, and the owner's specific approval for the hosted run. No backend, export, database, replay, CI or push in this phase.
- **PRD 16.1 and frozen003:** gym staff never read or write private health data, whatever the consent. This phase changes records only, so nothing touches data access.

### The review's findings

| Finding | Handling | Where |
|---|---|---|
| 1 Low (records): §14's mutation 3 allowed an edit no test can detect | **Corrected.** Each mutation is now an exact diff with its predicted killers. `break` or `return` for `continue` at `:145` is named as a survivor, with the input that would kill it. Test 1 is named as a second killer of mutation 2 | §14, "What stays unproved" |
| 2 Low (records): R19(b) stated one direction only, on an unconfirmed model | **Corrected.** The margin is in the reporter's integers: one newly uncovered branch, about seven merges, or one exposed uncovered branch. The model is marked unconfirmed, with the review's doubt, and the two forecasts are weakened to "the margin should hold". The advice widens from `gitBaselines` calls to any domain test change, for QA-10 | §14, "The model", "Margin" and "Predicted, not run"; R19 in §3; the handoff |
| 3 Low (test): one 80-line test holds three scenarios | **Assigned to QA-10** by Codex. The test is unchanged | R19 in §3; the handoff, "Found for other goals" |
| Records: stale line numbers in the R19 row | **Corrected by tagging.** Phase 3D's numbers stay as the committed file's, and today's are added | R19 in §3; the handoff's request to S8 |
| Records: §7's box-3 count | **Corrected** to 19, naming `contract.test.ts`. The `from` clause names the commit that adds the script, not the R19 commit | §7, "Box 3", step 4 |

### The stage and the commit

Each path is staged by name, never with `-A`:
- `packages/domain/src/contract.test.ts`
- `docs/evidence/QA-9/ratchet-enforcement.md`
- `docs/plan/runs/QA-9/checkpoint.md`
- `docs/plan/runs/QA-9/handoff.md`
- `docs/evidence/QA-9/phase-3d-check-outputs.md`
- `docs/evidence/QA-9/phase-3e-check-outputs.md`
- `docs/evidence/QA-9/implementer-final-2026-10-27T0035Z.md`
- `docs/evidence/QA-9/implementer-final-2026-10-27T0105Z.md`
- `docs/evidence/QA-9/reviewer-final-2026-10-27T0135Z.md`

**Expected before the commit:**
- `git diff --cached --stat` lists only those nine, with `contract.test.ts` at 713 insertions and 89 deletions;
- `git diff --cached --check` is clean;
- `git status --short` shows nothing else.

**Expected after the commit:**
- `git log --oneline -3` shows the new commit, then `4a7ee21`, then `2a95726`;
- `git show --stat HEAD` lists only the nine;
- `git status --short` is clean.

**Expected from `pnpm check`:**
- exit 0, with 285 tests;
- the format step selects **19 files**, labelled `Base: main@2a95726912c6, from 4a7ee2100bff, which adds scripts/quality/touched-format.mjs`;
- predicted by counting, not yet seen: 31 files not JavaScript or TypeScript, the 26 plus the five new records this commit adds; *(3G: the commit now adds seven new records, so 33. See §16.)*
- domain branches at least 272/313, with 273 expected, and the line count recorded as an R3 sample.

*(3G: phase 3F stopped at the staged `--check`, before the commit. Phase 3G stages eleven paths, not nine, and the expectations above move to §16.)*

### Bounds

- **Changed:** this file, the checkpoint and the handoff, all records.
- **Not changed:**
  - `contract.test.ts`, committed as phase 3E left it;
  - production code, `snapshot-contract.ts` and the domain contract;
  - every threshold, the floor, config, dependencies and the lockfile;
  - docs/23, GOALS, ACCEPTANCE and `status.json`;
  - the persisted review and both implementer finals.
- **Not run:** any mutation; `pnpm backend:test`, the exports and `pnpm install --frozen-lockfile`. No network, database, Docker, Supabase, provider or paid API.
- **Denied in phase 3F and not worked around:** the first command, a compound one without `rtk proxy`, and a `git grep` of the old line numbers in `4a7ee21`.

## 16. Phase 3G: the whitespace decision, and the second local commit

*(Written in phase 3G, before its commit, and part of it. The stage, the commit and the `pnpm check` after it are recorded after the commit, uncommitted: in the checkpoint, the handoff and `phase-3g-check-outputs.md`.)*

### Inputs

- **Phase 3F's stop.** Its staged `git diff --cached --check` exited 2 on 31 trailing-whitespace lines, all in captured Node coverage-table rows: 12 in [phase-3d-check-outputs.md](phase-3d-check-outputs.md) and 19 in [phase-3e-check-outputs.md](phase-3e-check-outputs.md). It made no commit and ran no `pnpm check` ([phase-3f-check-outputs.md](phase-3f-check-outputs.md), run 14; phase 3F's report, [implementer-final-2026-10-27T0205Z.md](implementer-final-2026-10-27T0205Z.md)).
- **Codex's brief after the stop** (27 October 2026, AUTH-01), called phase 3G here. It decides the stop's question and assigns one bounded phase:
  - strip **only** the trailing whitespace from those 31 rows. Add a note to each file's header saying that it is the captured output with trailing spaces removed, and that no output content or figure changed;
  - don't rewrite historical reports or tests;
  - stage **exactly eleven paths**: §15's nine, plus `phase-3f-check-outputs.md` and `implementer-final-2026-10-27T0205Z.md`. Check the staged set, `--check` and the stat, then make **one** local commit, `test(QA-9): cover deterministic Git baseline histories`, on top of `4a7ee21`. No amend, reset or rebase;
  - then run `pnpm check` **once** on the pinned Node 22.23.1. Record the actual totals, fractions and format label in a new results file, the checkpoint and the handoff, uncommitted;
  - stop on an unexpected path or a failure. Don't change any threshold, floor, code or config.
- **What the brief accepts:** the prior independent 285-test review, acceptance (11). It adds no new acceptance of the goal or of any box.
- **Still open, by the brief:** the floor at the exact `main` commit, `pnpm backend:test`, both JS exports, and the owner's specific approval for the hosted run. No backend, export, database or replay in this phase.
- **PRD 16.1 and frozen003:** gym staff never read or write private health data, whatever the consent. This phase changes records and whitespace only, so nothing touches data access.

### The normalization

- **What changed:** one space at the end of each of the 31 rows, the space Node prints after the last `|` when a row's "uncovered lines" column is empty.
  - In phase 3D's outputs: 5 rows in run 13's table and 7 in run 18's.
  - In phase 3E's outputs: 5 rows in run 7's table, 7 in run 10's and 7 in run 11's.

  The Edit tool removed it, matching each table block exactly. Each file's header gains one "Normalization" row saying so.
- **The proof, run before the header rows were added:**
  - against the staged copies, `git diff --numstat` showed exactly 12 and 12, and 19 and 19, lines;
  - `git diff --ignore-space-at-eol --stat` printed nothing;
  - a Grep found no trailing whitespace left in the outputs of phases 3D, 3E and 3F.
- **Not changed:**
  - every figure, test name, path, cut and line order in the outputs;
  - every implementer and reviewer final, the 0205 report among them. That report still describes the spaces as present, which was true when it was written;
  - every test.

### The stage and the commit

Each path is staged by name, never with `-A`: §15's nine, plus
- `docs/evidence/QA-9/phase-3f-check-outputs.md`
- `docs/evidence/QA-9/implementer-final-2026-10-27T0205Z.md`

**Expected before the commit:**
- `git diff --cached --name-only` lists exactly the eleven, with `contract.test.ts` still at 713 insertions and 89 deletions;
- `git diff --cached --check` is clean;
- `git status --short` shows nothing else.

**Expected after the commit:**
- `git log --oneline -3` shows the new commit, then `4a7ee21`, then `2a95726`;
- `git show --stat HEAD` lists only the eleven;
- `git status --short` is clean.

**Expected from `pnpm check`:**
- exit 0, with 285 tests;
- the format step selects **19 files**, labelled `Base: main@2a95726912c6, from 4a7ee2100bff, which adds scripts/quality/touched-format.mjs`;
- predicted by counting, not yet seen: **33** files not JavaScript or TypeScript. That is the 26 at `4a7ee21`, plus the seven new records this commit adds: three implementer finals, three check-output files and one review. This replaces §15's 31;
- domain branches at least 272/313. 273 is expected, but the model behind it is unconfirmed (R19(b));
- domain lines recorded as an R3 sample. The threshold, 91.42, needs 533 of 583.

### Bounds

- **Changed:**
  - the two normalized outputs, by trailing spaces and one header row each;
  - two tags in `phase-3f-check-outputs.md`;
  - this file, the checkpoint and the handoff.
- **Not changed:**
  - `contract.test.ts`, committed as phase 3E left it;
  - production code, `snapshot-contract.ts` and the domain contract;
  - every threshold, the floor, config, dependencies and the lockfile;
  - docs/23, GOALS, ACCEPTANCE and `status.json`;
  - every persisted review and implementer final.
- **Not run:** any mutation; `pnpm backend:test`, the exports and `pnpm install --frozen-lockfile`. No network, database, Docker, Supabase, provider, paid API, push or integration.
