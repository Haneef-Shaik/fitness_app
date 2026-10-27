# QA-9 · Coverage baseline (phase 1)

| Field | Value |
|---|---|
| Goal | QA-9 · Lint, type and coverage gates that only go up. Attempt 1, phase 1 (measure only) |
| Date | 26 October 2026 |
| Worktree | `/Users/Adya/.codex/worktrees/fitlog-qa9/fitness_app`, branch `codex/qa9-quality-ratchets`, based on `main` at `2a95726` (AR-1 Done) |
| Machine | Local macOS (Darwin 27.0.0). Not a device or release-build measurement; coverage is a unit-test metric |
| Runtime | pnpm 10.27.0 (install output); Jest 29.7.0 with the `jest-expo` ~57.0.6 preset; tsx 4.21.0; Node's built-in test runner. The local `node --version` was not captured: it is outside this session's allowed commands. The repository pins Node 22.23.1 (`.node-version`), which CI uses. *Phase 2B:* `rtk proxy node --version` printed `v22.23.1`, the pinned version, so these measurements and the truncation finding were made on the pinned Node |
| Install | `pnpm install --frozen-lockfile`: lockfile up to date, no package or lockfile change |
| Sample | Mobile: 2 runs, identical. Domain: 5 runs; branches and functions identical, lines vary (below) |
| Raw output | `apps/mobile/coverage/` (`coverage-summary.json`, `coverage.txt`) is git-ignored (`.gitignore:16`) and not committed. Domain prints to stdout only |

> **Phase 2 update (26 October 2026).** The thresholds in §5 are now enforced in `pnpm check`, and a
> ratchet guard protects them: see [ratchet-enforcement.md](ratchet-enforcement.md).
> - **Domain thresholds.** Node reads its `--test-coverage-*` flags as whole numbers. A Node test reporter
>   in `scripts/quality/` therefore checks the domain thresholds unrounded.
> - **Commands.** The domain `test` and mobile `test:ci` scripts now measure coverage themselves. The
>   `test:coverage` scripts below remain measurement-only commands.
> - **Domain line range.** Seven more domain runs widened the observed line range to 533–538 of 583
>   lines over 12 runs. The 91.42 threshold is still the lowest count seen.
>
> **Phase 2B update (26 October 2026), after the independent review** ([review-phase2.md](review-phase2.md)).
> - **The floor is anchored only at integration into `main`.** Until `main` records it, the quality
>   tests require `scripts/quality/coverage-floor.json` to equal §5 below and the §1 scope exactly. So
>   do not edit §5 or the §1 `collectCoverageFrom` line, and the verifier compares the floor at the exact
>   merge commit with them. See [ratchet-enforcement.md](ratchet-enforcement.md) §1.
> - **Line noise is wider than §4 says.** Runs at 537 and 538 contradict §4's claim that four lines are
>   uncovered in every run, so the set of flipping lines is not known. The threshold stays at the lowest
>   count seen (533), with no margin below it. Owners: [ratchet-enforcement.md](ratchet-enforcement.md) §3, R3.
> - **Domain files no test loads** now fail the run instead of going uncounted (§1's "Node lists only
>   the files a test loads").

**Headline.** All of mobile `src/` is at **12.23 % statements**. The old configuration measured only
`src/theme` and `src/ui`, whose 103 statements stand at 73.78 %. That figure described 5 % of the code.
The domain package is at **91.42–91.94 % lines**. Nothing is near QA-10's 80 % for mobile, and this
document does not claim it.

## 1. Instruments and scope

| | Mobile `@fitlog/mobile` | Domain `@fitlog/domain` |
|---|---|---|
| Instrument | Jest coverage, default `babel` provider (istanbul instrumentation through the `jest-expo` transform) | Node test-runner coverage (`--experimental-test-coverage`, V8), mapped back to the TypeScript through tsx with `--enable-source-maps` |
| Metrics | Statements, branches, functions, lines | Lines, branches, functions. **Node reports no statement metric** |
| Files counted | `collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/__tests__/**']`. Every file matches, imported or not; a file no test loads counts as 0 | `--test-coverage-include='src/**/*.ts' --test-coverage-exclude='src/**/*.test.ts'`. Node lists only the files a test loads, but all 8 production modules are loaded, so none is missing (`index.ts` through test 12's import of the package root) |
| Files in scope | 120. 42 of them have no statements (37 expo-router re-export routes such as `src/app/appearance.tsx`, plus `data/cache.ts`, `lib/auth-storage.ts`, `theme/index.ts`, `theme/types.ts` and `ui/index.ts`). They count 0/0 and do not move the totals | 8: `calculations.ts`, `cli/snapshot-contract.ts`, `contract.ts`, `dates.ts`, `encoding.ts`, `finance.ts`, `index.ts`, `models.ts` |
| Excluded | Test files only. `src/theme/themes/momentum.json` is data, not TypeScript | Test files only. `contracts/*.json` and `fixtures/*.json` are data |

**Configuration changes made for this measurement** (the only code changes in phase 1):
- `apps/mobile/jest.config.cjs`: `collectCoverageFrom` widened from theme + ui to all of `src/`. Added
  `coverageReporters` (`text-summary`, `json-summary`, and the per-file `text` table written to
  `coverage/coverage.txt`). There was no threshold before, so none is lowered.
- `apps/mobile/package.json`: added `"test:coverage": "jest --runInBand --ci --coverage"`.
- `packages/domain/package.json`: added `test:coverage`, the command in §2.
- `test`, `test:ci`, the root `package.json`, CI and the lockfile are unchanged. `pnpm check` still runs
  without coverage.

## 2. Reproduce

From the repository root:

```bash
pnpm install --frozen-lockfile
pnpm --filter @fitlog/mobile test:coverage                       # jest --runInBand --ci --coverage
pnpm --filter @fitlog/mobile exec jest --coverage --runInBand    # same totals (second run)
pnpm --filter @fitlog/domain test:coverage
# = node --import tsx --enable-source-maps --test --experimental-test-coverage \
#     --test-coverage-include='src/**/*.ts' --test-coverage-exclude='src/**/*.test.ts' src/*.test.ts
```

**Domain counts (lcov).** Node's text table gives only percentages. The counts below come from the same
command with `--test-reporter=lcov --test-reporter-destination=stdout` added. In this session the
variant was run by adding those flags to `test:coverage` temporarily and then removing them. The
direct form, which is equivalent but was not itself run here, is:

```bash
pnpm --filter @fitlog/domain exec node --import tsx --enable-source-maps --test --experimental-test-coverage \
  --test-coverage-include='src/**/*.ts' --test-coverage-exclude='src/**/*.test.ts' \
  --test-reporter=lcov --test-reporter-destination=stdout src/*.test.ts
```

## 3. Mobile results

All 7 suites and 126 tests pass. Both runs gave identical totals.

| Metric | Covered / total | % |
|---|---|---|
| Statements | 254 / 2076 | **12.23** |
| Branches | 164 / 1551 | **10.57** |
| Functions | 84 / 821 | **10.23** |
| Lines | 191 / 1023 | **18.67** |

Jest reports each percentage as `floor(covered / total × 10000) / 100`. For example, 254/2076 =
12.2350… is reported as 12.23.

### By area (covered / total)

| Area | Statements | Branches | Functions | Lines |
|---|---|---|---|---|
| `features/gym` | 0 / 573 | 0 / 449 | 0 / 218 | 0 / 178 |
| `features/training` | 0 / 405 | 0 / 318 | 0 / 200 | 0 / 170 |
| `features/progress` | 0 / 99 | 0 / 73 | 0 / 44 | 0 / 48 |
| `features/food` | 0 / 87 | 0 / 72 | 0 / 38 | 0 / 45 |
| `features/auth` | 0 / 57 | 0 / 49 | 0 / 9 | 0 / 30 |
| `features/today` | 0 / 36 | 0 / 57 | 0 / 18 | 0 / 20 |
| `features/settings` | 12 / 73 (16.43) | 17 / 59 (28.81) | 5 / 32 (15.62) | 12 / 48 (25.00) |
| `app` (routes and layouts) | 0 / 35 | 0 / 11 | 0 / 23 | 0 / 29 |
| `data` | 134 / 533 (25.14) | 74 / 306 (24.18) | 47 / 186 (25.26) | 85 / 313 (27.15) |
| `lib` (without i18n) | 25 / 67 (37.31) | 19 / 43 (44.18) | 6 / 17 (35.29) | 20 / 47 (42.55) |
| `lib/i18n` | 7 / 8 (87.50) | 9 / 9 (100) | 3 / 4 (75.00) | 7 / 8 (87.50) |
| `theme` (with `themes/`) | 63 / 65 (96.92) | 24 / 32 (75.00) | 19 / 19 (100) | 54 / 54 (100) |
| `ui` | 13 / 38 (34.21) | 21 / 73 (28.76) | 4 / 13 (30.76) | 13 / 33 (39.39) |
| **All** | **254 / 2076** | **164 / 1551** | **84 / 821** | **191 / 1023** |

The old scope (`theme` + `ui`): statements 76/103 (73.78), branches 45/105 (42.85), functions
23/32 (71.87), lines 67/87 (77.01).

### Partly covered files

| File | Stmts | Branches | Funcs | Lines | Uncovered (from `coverage.txt`) |
|---|---|---|---|---|---|
| `data/member-store.ts` | 101/206 | 56/154 | 37/91 | 69/128 | 28, 30, 55, 65–76, 91, 125–184, 187–196 |
| `data/gym-outbox.ts` | 31/32 | 18/25 | 9/11 | 15/15 | 11–13, 23–24 |
| `features/settings/AppearanceScreen.tsx` | 12/15 | 17/22 | 5/8 | 12/15 | 26–27, 93 |
| `lib/auth-callback.ts` | 25/26 | 19/19 | 6/6 | 20/20 | one statement |
| `lib/i18n/index.ts` | 3/4 | 9/9 | 3/4 | 3/4 | 6 |
| `theme/ThemeProvider.tsx` | 17/18 | 6/11 | 6/6 | 13/13 | 25, 29–47 (branches) |
| `theme/preference-store.ts` | 35/36 | 12/15 | 11/11 | 30/30 | 42–51, 59 (branches) |
| `ui/AppButton.tsx` | 7/9 | 14/22 | 2/4 | 7/9 | 29–30 |
| `ui/AppText.tsx` | 4/4 | 4/8 | 1/1 | 4/4 | 19–21 (branches) |
| `ui/Screen.tsx` | 2/2 | 3/4 | 1/1 | 2/2 | 15 (branch) |

These files are fully covered: `data/types.ts`, `lib/i18n/{app,en,hi}.ts`, `theme/{theme,tokens}.ts`
and `theme/themes/momentum.ts`.

### Uncovered code (1,822 statements; uncovered statements per file)

- **`features/gym` (573):** `FreezeScreen` 123, `GymMembersScreen` 98, `GymPlansScreen` 71,
  `GymHomeScreens` 69, `WorkspaceScreen` 57, `GymPaymentScreen` 51, `GymProvider` 34,
  `ReceiptScreen` 33, `hooks.ts` 27, `freeze-api.ts` 10.
- **`features/training` (405):** `ProgrammeScreen` 116, `WorkoutScreen` 105, `EditSetScreen` 49,
  `ScheduleScreen` 45, `CustomExerciseScreen` 28, `ExercisePickerScreen` 23, `TrainScreen` 19,
  `HistoryScreen` 12, `PlatesScreen` 5, `ExerciseDetailScreen` 3.
- **`data` (399):** `member-store.ts` 105 of 206, `MemberProvider.tsx` 102, `api.ts` 61,
  `cache.web.ts` 44, `gym-api.ts` 35, `useDraft.ts` 26, `cache.native.ts` 24, `database.types.ts` 1
  (the generated `Constants` export), `gym-outbox.ts` 1.
- **Other features (340):** `progress` 99 (`NewGoalScreen` 32, `BodyEntryScreen` 29, `ProgressScreen`
  29, `GoalsScreen` 9); `food` 87 (`AddFoodScreen` 45, `TargetsScreen` 25, `FoodScreen` 17);
  `settings` 61 (`ProfileScreen` 27, `SettingsScreen` 18, `ComponentGalleryScreen` 7, `SyncScreen` 6,
  `AppearanceScreen` 3); `auth` 57 (`AuthScreen` 39, `OnboardingScreen` 18); `today` 36
  (`TodayScreen`).
- **`lib` (43):** `auth-storage.native.ts` 30, `supabase.ts` 7, `auth-storage.web.ts` 4,
  `auth-callback.ts` 1, `i18n/index.ts` 1.
- **`app` (35):** `_layout.tsx` 11, `gym/[gymId]/(tabs)/_layout.tsx` 7, `(member)/_layout.tsx` 6,
  `+not-found.tsx` 3, the two `_layout.native.tsx` files 2 each, and 1 each in `design-system.tsx`,
  `index.tsx`, `auth/callback.tsx` and `gym/[gymId]/_layout.tsx`.
- **`ui` (25):** `ProgressRing` 7, `MomentumAsset` 5, `Header` 4, `AppButton` 2, `Card` 2, `Choice` 2,
  `Field` 2, `momentum-assets.ts` 1.
- **`theme` (2):** one statement each in `ThemeProvider.tsx` and `preference-store.ts`.

**Platform files.** No test loads any `.native.ts(x)` or `.web.ts` file: `cache.native`, `cache.web`,
`auth-storage.native`, `auth-storage.web` and both `_layout.native` files are all at 0 %. Covering both
variants of a file needs per-platform Jest projects. That is QA-10's call, not a phase-1 change.

## 4. Domain results

All 37 tests pass in every run.

| Metric | Covered / total | % |
|---|---|---|
| Lines | 533–536 / 583 | **91.42–91.94** (varies between runs, below) |
| Branches | 272 / 313 | **86.90** (identical in 5 of 5 runs) |
| Functions | 106 / 117 | **90.60** as printed; 90.598… exactly (identical in 5 of 5 runs) |
| Statements | — | Not reported by Node's instrument |

| File | Lines | Branches | Functions | Uncovered lines (text report) |
|---|---|---|---|---|
| `calculations.ts` | 94–95 / 125 | 73 / 89 | 29 / 34 | 1, (3), 12–13, 44–51, 70–77, 79–85, 87–89, 118 |
| `cli/snapshot-contract.ts` | 208 / 223 | 118 / 134 | 38 / 43 | 205–218, 223 |
| `contract.ts` | 48 / 48 | 24 / 27 | 13 / 14 | — |
| `dates.ts` | 20–21 / 21 | 8 / 10 | 3 / 3 | (19) |
| `encoding.ts` | 13 / 14 | 13 / 13 | 1 / 1 | 1 |
| `finance.ts` | 34–35 / 35 | 27 / 31 | 18 / 18 | (14) |
| `index.ts` | 5 / 5 | 1 / 1 | 0 / 0 | — |
| `models.ts` | 111 / 112 | 8 / 8 | 4 / 4 | 112 |

### Line noise (instrument behaviour, not test behaviour)

Three lines flip between covered and uncovered from run to run: `calculations.ts:3` (`localDateAt`),
`dates.ts:19` (`instantForDiaryDate`) and `finance.ts:14` (`accountBalance`). Each is the declaration
line of a function whose body is covered in every run. The tests run each file in its own process,
and Node merges the per-process V8 coverage through the tsx source maps. Running the files serially
did not remove the noise.

| Run | Command | Lines | Flipping lines uncovered |
|---|---|---|---|
| 1 | `test:coverage` | 91.60 (534) | calc:3, finance:14 |
| 2 | lcov variant (§2) | 91.94 (536) | none |
| 3 | `test:coverage` | 91.42 (533) | all three |
| 4 | `test:coverage` with `--test-concurrency=1` (trial, reverted) | 91.42 (533) | all three |
| 5 | `test:coverage` with `--test-concurrency=1` (trial, reverted) | 91.94 (536) | none |

Four more lines are reported uncovered in every run but hold no executable code:
- `calculations.ts:1`, an `import type`;
- `calculations.ts:118`, the declaration line of `membershipEndExclusive`, whose body is covered;
- `encoding.ts:1`, a doc comment;
- `models.ts:112`, a type alias.

*Phase 2B correction (review finding 5):* "in every run" held for these 5 runs only. Later runs
covered 537 and 538 lines, more than the 536 these three flipping lines allow. So at least one more
line flips, and which lines flip is not established. No per-line list was made in phase 2B (see
[ratchet-enforcement.md](ratchet-enforcement.md) §3, R3).

### Truly uncovered domain code (43 lines, 41 branches, 11 functions)

- **Five exported calculations with no domain test** (28 lines): `weekStart` (`calculations.ts:11–13`),
  `previousPerformance` (43–51), `nutritionTotals` (69–77), `latestDailyWeights` (78–85) and
  `movingWeight` (86–89).
  - The mobile screens call them: `TodayScreen.tsx:17–20`, `WorkoutScreen.tsx:16`, `FoodScreen.tsx:14`,
    `GoalsScreen.tsx:8` and `ProgressScreen.tsx:19`. Those screens are at 0 %, so **no test runs
    these five functions at all**.
  - By the 003 §5 domain map they belong to MB-4 (`previousPerformance`), MB-5 (`nutritionTotals`) and
    MB-6 (`latestDailyWeights`, `movingWeight`, and `weekStart` for Today).
- **The contract snapshot CLI entry** (15 lines): `reason`, `fail` and `main`
  (`cli/snapshot-contract.ts:204–218`) and the direct-invocation guard (223). They run only under
  `pnpm --filter @fitlog/domain contract:snapshot`. The tests drive the library functions instead.
- **Branches** (41, from lcov `BRDA … 0`): `calculations.ts` 16, `cli/snapshot-contract.ts` 16,
  `finance.ts` 4, `contract.ts` 3, `dates.ts` 2.

## 5. Proposed baseline thresholds (phase 1 proposal; enforced in phase 2, see ratchet-enforcement.md)

These are today's measured values. They are not the 80 % target, which belongs to QA-10.

| Package | Metric | Proposed threshold | Why this exact value |
|---|---|---|---|
| Mobile (`coverageThreshold.global`) | statements | **12.23** | Jest fails when the floored percentage is below the threshold. Deterministic in 2 of 2 runs |
| | branches | **10.57** | as above |
| | functions | **10.23** | as above |
| | lines | **18.67** | as above |
| Domain (Node flags) | `--test-coverage-lines` | **91.42** | The lowest of 5 runs (533/583 = 91.4236…), so instrument noise cannot fail a correct change |
| | `--test-coverage-branches` | **86.90** | 272/313 = 86.9009… ≥ 86.90 |
| | `--test-coverage-functions` | **90.59** | 106/117 = 90.598…, which Node prints as 90.60. *Phase 2 checked this:* Node truncates each flag to a whole number (90.60 is enforced as 90), so `scripts/quality/exact-coverage-reporter.mjs` compares unrounded: 90.59 passes and 90.60 fails (M4b) |

The ratchet as built (where thresholds live, the guard that fails when one is lowered, and the
mutation checks) is in [ratchet-enforcement.md](ratchet-enforcement.md).
