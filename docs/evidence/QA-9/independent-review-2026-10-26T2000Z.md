# Independent review of QA-9 phase 3 (Prettier on touched files): source-only

I found no critical or high defect. There is one medium: in CI the adoption boundary can switch the format check off silently, which is exactly the case you asked me to rule out. There are also three lows. **I ran no tests and not `pnpm check`:** Bash was denied on my first command and I didn't work around it. Like the 2E and 2F reviews, this one is source-only, so phase 3 still has no independent run.

## Findings, most severe first

**1. Medium: the adoption boundary resets silently in CI whenever `RULE` doesn't match the module's real path**
- **Location:** `scripts/quality/touched-format.mjs:141-146`, where the base falls back to `HEAD`, and `:34`, where `RULE` is a hand-written string. The CI refusal at `:99-103` only checks the merge-base with the baseline (the fork point), not the base `ruleStart` returns.
- **The defect:** when the fork point lacks `RULE` and no commit in `fork..HEAD` touches it, `ruleStart` sets the base to `HEAD` in CI too. Nothing ties `RULE` to the file's actual path, and no test checks that it does.
- **Failure scenario:**
  - A reviewed PR renames the module to `format-check.mjs`. It updates root `check`, `PINNED_SCRIPTS` and the test's path, but not `RULE`.
  - All 12 tests still pass, because the fixtures write the module at whatever `RULE` says. That PR's own CI still works, since its fork point holds the old path.
  - After the merge, every later PR finds nothing for `RULE` at the fork point or in the range, so the base becomes `HEAD`. CI then checks 0 files and exits 0 with `Formatting verified… scripts/quality/touched-format.mjs is not committed yet, so only uncommitted edits count`.
  - The check stays off for good, and none of those later PRs touches the checker.
  - Editing `RULE` alone does the same. This also contradicts R18(d) (`ratchet-enforcement.md:417`, `checkpoint.md:564`) and the PL-1 row at `checkpoint.md:650`, which say a rename "restarts the rule".
- **What does hold:** ordinary edits to the checker do not move the boundary. Once the fork point holds `RULE`, the base is the fork point. Before that, `--reverse --topo-order` always picks the earliest commit that touches it.
- **Fix:**
  - When no commit in the range adds `RULE` and `inCI(env)` is true, throw. CI never has an uncommitted module.
  - Locally, also throw if `ls-tree HEAD -- RULE` is non-empty.
  - Derive `RULE` from `import.meta.url` relative to `REPO_ROOT`, or add a test that it equals the module's repository path.
  - Add RED tests for the CI case and for `RULE` drift, plus one mutation.

**2. Low: adding Prettier 3 breaks writing Jest inline snapshots, and the usual fix is blocked by the guard**
- **Location:** root `package.json:25`, together with `coverage-ratchet.mjs:48-54` (the Jest option allowlist). The mechanism is in `node_modules/jest-snapshot/build/InlineSnapshots.js:92-104` (Jest 29.7.0).
- **The defect:**
  - Jest's default `prettierPath` is `'prettier'`, and `jest-expo`'s main preset doesn't override it.
  - Prettier 3.6.2 now resolves from `apps/mobile` through the root `node_modules`. When Jest 29 writes an inline snapshot with Prettier 3 or later, it throws.
  - Before phase 3, Jest swallowed the "module not found" error and the write worked.
- **Failure scenario:** a goal adds `toMatchInlineSnapshot()` and runs Jest locally. It gets "Inline Snapshots are not supported when using Prettier 3.0.0 or above". Adding `prettierPath: null` to `jest.config.cjs` then fails the guard's allowlist. Nothing breaks today: there are no inline snapshots in either `src/`, and CI's `--ci` doesn't write snapshots.
- **Fix:** allow `prettierPath` in the guard, pinned to `null`, in a reviewed diff (it changes neither coverage scope nor thresholds). Or record it as a residual under R18.

**3. Low: after moving the base forward, files changed only on `main` count as touched once `main` is merged in**
- **Location:** `touched-format.mjs:141-157`.
- **The defect:** the moved base is the parent of the commit that adds `RULE`. That parent lacks everything the base side merged into `HEAD` afterwards.
- **Failure scenario:** before integration, the branch merges local `main` (now `c8a5d57`, 20 commits past `2a95726`) to resolve docs/23 conflicts. The base becomes `2a95726`, so any JS or TS file those 20 commits changed is demanded. This only fails safe (a false failure, never a false pass), and it can't happen once `main` holds the rule.
  - The box-3 draft PR is not affected, because `origin/main` (`c8f6d7f`) is an ancestor of local `main` (reflog lines 73–74).
  - I did not verify whether those 20 commits touched any JS or TS.
- **Fix:** limit the moved-base diff to paths changed by commits not reachable from the fork point. Or record it as a residual and rebase rather than merge.

**4. Low (records): the box-3 plan still offers a probe that would now fail at the format step**
- **Location:** `ratchet-enforcement.md:656`, `checkpoint.md:538`.
- **The defect:** the plan offers "a hex colour in a `src/features/` screen" as the ESLint-only probe. Touching a screen now makes the format step judge the whole file first, and 33 `src/features` `.tsx` files have lines over 100 characters (460 such lines).
- **Failure scenario:** the authorised draft PR fails before ESLint, and the hosted run is wasted. `checkpoint.md:539` does tell the verifier to confirm the format step passed, so it wouldn't be mistaken for proof.
- **Fix:** drop that alternative. The `jest.config.cjs` probe stays in format.
- **Related stale line:** `ratchet-enforcement.md:10` still says phase 2B's line "is still the only root `package.json` change".

## Closed from the phase-2G review
- **Finding 1 (R17's owner):** closed. `checkpoint.md:563`, `:596` and `:645`, and `ratchet-enforcement.md:416`, now read "PL-1, CI wiring only". The relative-path sentence now names the `import()` at `contract.test.ts:87` and `snapshot-contract.ts:13`. The "S7 Quality, under QA-9" text that remains belongs to R16, which that review didn't flag.
- **Optional items:**
  - The 2G mutation labels now read `2G-G1` to `2G-G12`. The bare G4–G7 at `ratchet-enforcement.md:467-470` are phase 2B's own.
  - The `exports` route is recorded under R17.

## Checked and sound
- **Dependency and lockfile:**
  - Root `package.json` has `"prettier": "3.6.2"` exactly. Compared with the main checkout, the only other change is the `check` line.
  - The lockfile has the importer entry, the package entry with integrity `sha512-I7AIg5…hCuQ==`, and the snapshot. It is 10 lines longer (11316 against 11306), and nothing else in it depends on Prettier.
  - The installed Prettier is 3.6.2.
- **Gate wiring:** the pinned `check` at `gate-wiring.mjs:42` matches `package.json:16` exactly. `touched-format.test.mjs` is in `QUALITY_FILES`. Gate-wiring test 2 covers dropping the format step.
- **Selection and inputs:**
  - Git runs with `-z --no-renames --no-abbrev --no-ext-diff --no-textconv`, through `gitRunner`.
  - Unknown statuses, links, submodules and unmerged paths fail closed.
  - Every Git failure throws. In CI the baseline must be a full commit ID, and a fork point at `HEAD` is refused.
- **Prettier isolation:** the check calls the API's `check()` with the pinned options. The repository has no `.editorconfig` and no other Prettier config.
- **Initial floor:** still not anchored. The unanchored note and its logic in `coverage-ratchet.mjs` (lines 71, 614 and 640) are intact, and nothing in phase 3 claims anchoring.
- **Lint:** no ESLint interaction. `eslint-config-expo` lists Prettier only among its own devDependencies.

## Limitations
- **Nothing executed.** I didn't run the 91 quality tests or `pnpm check` (the writer reports 276 tests) on Node 22.23.1. The writer's runs are still the only ones for phase 3.
- **No Git diff.** I read the untracked files in full. I compared root `package.json` and the lockfile against the main checkout, which is at `c8a5d57`, not `2a95726`. I didn't diff the mobile and domain `package.json` files or `jest.config.cjs`.
- **Formatting-only claim not verified byte for byte.** The pre-format bytes were never hashed. I only spot-checked that the 2G logic is intact after reformatting.
- **The format step hasn't checked the quality scripts through `pnpm check` yet.** They're untracked, so the base is `HEAD`. The writer's `prettier --check` stands in until a commit exists.
- **Local `main` has moved** to `c8a5d57`. The fork point is still `2a95726`, so local behaviour is unchanged, but integration will need a rebase or merge.
- **QA-9 is not Done.** Box 3's hosted lint-negative run is unproved, the floor is not anchored, and nothing is committed.

## Next bounded scope
1. Fix finding 1 with RED tests and a mutation. Then a session that can run commands re-runs the quality tests and `pnpm check` on Node 22.23.1. That would also be the first independent run of phase 3.
2. Choose for finding 2: allow `prettierPath: null`, or record it as a residual.
3. Records: finding 4, and finding 3 as an R18 residual.
4. After Codex commits, run `pnpm check` once. Confirm the format step's label reads "from <QA-9 commit>, which adds …" and that it selects the 17 scripts and `jest.config.cjs`.