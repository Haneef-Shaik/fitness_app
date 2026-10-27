# QA-9 · Phase 3L outputs: `pnpm check` once in local CI mode, against the exact `main` commit

| Field | Value |
|---|---|
| What | The outputs of phase 3L. It runs `pnpm check` **once**, in this worktree, in **local CI mode**: `CI=true` and `FITLOG_CONTRACT_BASELINE=c8a5d57c3a0999760ad21fd1aca4899ca76b5adf`, the exact commit of this repository's real `main`. **This is a local CI-mode proof only, not hosted CI.** `GITHUB_ACTIONS` was not set, and nothing ran on GitHub, on Linux or in a fresh install |
| Who | The phase-3L implementer, a local Claude session under Codex's phase-3L brief (27 October 2026, AUTH-01). Session `fcdc094a-2ab4-41c2-a1a9-82f0c1f558a9`, as named in the path of the background task's output file, which the tool printed (run 13). **These are implementer runs, not independent evidence** |
| Commit | `HEAD` = **`961e1f41104e414f045d5a9a42e8e9ca44acf083`** on `codex/qa9-quality-ratchets` (run 2), four commits ahead of `main` (run 12). The work tree held only the eight uncommitted Markdown paths listed under run 9, none of them JavaScript or TypeScript |
| Baseline | `FITLOG_CONTRACT_BASELINE=c8a5d57c3a0999760ad21fd1aca4899ca76b5adf`. **It is exactly this repository's actual `main`** (run 2), and it is the fork point of `main` and `HEAD` (run 3). It is not `HEAD`, so CI mode's "forks from HEAD itself" refusal didn't apply |
| Node | `v22.23.1` (run 6), equal to `.node-version`. The gate used the `node` on `PATH`, with no `PATH` change. `rtk proxy which node` was **denied** (run 7), so the binary's path wasn't re-read in this phase |
| pnpm | Not observed in this phase: `rtk proxy pnpm --version` was **denied** (run 8). The root `package.json` pins `packageManager` `pnpm@10.27.0`. No install ran |
| Timestamps (UTC, `rtk proxy date -u`) | **06:05:41Z** before the preflight (run 1). **06:06:33Z** right after the gate's completion notice (run 14). The gate started after the preflight runs, so it took at most 52 seconds |
| Result | **`pnpm check` exit 0, once. 285 tests** (40 + 97 + 126 + 22). Guard: **1 Git baseline**, `FITLOG_CONTRACT_BASELINE@c8a5d57c3a09: checked; records no coverage minimums yet, so the floor applies`, and **"the floor is not anchored yet"**, as the real `main` has no floor. Format step: **19 files**, `Base: FITLOG_CONTRACT_BASELINE@c8a5d57c3a09, from 06c822050d76, which adds scripts/quality/touched-format.mjs`, 39 not JavaScript or TypeScript. Domain: lines **537/583**, branches **273/313**, functions **106/117**. Mobile: 254/2076, 164/1551, 84/821 and 191/1023. Plan build: matches |
| Floor | Blob **`0036eedaf6de63003294b9ff7aa3ef157ab57c74`** at `HEAD` (run 4), sha256 `f0d4017c37f5bbd9ecba809d628f96f7bf12db7f0796e01329c2c0c16d646a4b` in the work tree, unchanged before and after (runs 11 and 19). **The real `main`, `c8a5d57`, has no floor file**: exit 128 (run 5). It is still **unanchored** |
| Executed | Every numbered run below, by this session |
| Inspected, not executed | The gate's scripts, read for their effects before the run (below). The ignored `apps/mobile/.expo/` and `apps/mobile/coverage/` folders, listed with Glob |
| Inherited | The iOS and Android exports, from the 0405 review on `c84bb4c`, and phase 3H's run 33. **They were not run again:** the brief allows no export without a new reason, and `961e1f4` differs from `c84bb4c` only by five Markdown files |
| Normalization | Run 13's output is copied below, with cuts marked. In the copied Node coverage table, rows whose last column is empty are written without the trailing space Node prints after the final `\|`, as Codex chose for ~~the same rows~~ *(3M)* rows like them in phase 3G. ~~That trailing space is inferred from phase 3J's mechanical count of the same rows (its run 44). It wasn't counted mechanically here, because the count script was denied (run 20).~~ *(3M, 0705 review Low 3: those weren't the same rows. Phase 3J's 5 were its own raw lines 97, 99, 101, 105 and 108.)* **7 trailing spaces removed, at raw lines 96, 98, 100, 101, 103, 104 and 107, by the 0705 review's Grep.** They are the 7 coverage rows with an empty last column: `src`, `cli`, `contract.ts`, `dates.ts`, `finance.ts`, `index.ts` and `all files`, at this file's lines 217, 219, 221, 222, 224, 225 and 228. The review also found 0 trailing-space lines in this copy, and no other difference from the raw output, apart from the two cuts, in the parts it compared line by line (raw 1–120, 690–749 and 860–889). These figures are the review's, inherited. Phase 3M didn't re-count the raw output, because phase 3L's count of it was denied as a script (run 20), and a denied operation isn't retried by another tool. The full raw output is identified by its path and sha256 (run 15) |
| Cuts | Two cuts. Raw lines ~~118–702~~ *(3M, 0705 review Low 1)* **121–702** are the rest of the 97 quality tests' TAP lines. Raw lines 118–120 (`TAP version 13`, the first `# Subtest` and `ok 1`) are kept, at this file's lines 239–241. Raw lines 740–872 are the TAP lines of the 22 plan tests. Each cut is replaced by a marked line. A Grep of the raw output for `not ok`, `Error`, `ERR` and `warn` ~~matched nothing~~ *(3M, 0705 review Low 2)* **matched only raw line 27, the ESLint command line `eslint . --max-warnings=0`**, because `warn` is part of `--max-warnings`. It matched no `not ok`, `Error` or `ERR`. That line is at this file's line 148 |
| Redaction | None needed. No output holds a key, token, password or personal data |
| Run numbers | The checkpoint's, under "Commands run in phase 3L" |
| Written | After the gate, uncommitted. This file is untracked. No commit is made in phase 3L, by the brief. *(3M: corrected in place for the 0705 review's Lows 1–3, in the Normalization and Cuts rows, this row, the first cut marker and one tag after run 20. No captured output line changed. The original phase-3L version's sha256 was `d57c38100c149544d8dacc1e02537d0f5bbdafb18a9034cf9f4c54ea98fe2d20`, from phase 3L's final-state check, as the 0705 review read it, and from phase 3M's run 7, before any edit. This corrected version is part of phase 3M's records commit.)* |

## The gate's effects, inspected before the run

Read before the run, so that one run is enough and nothing outside ignored outputs is written:
- **Root `check`** is `node scripts/quality/coverage-ratchet.mjs && node scripts/quality/touched-format.mjs && pnpm typecheck && pnpm lint && pnpm test && pnpm plan:build --check` (`package.json:16`).
- **The guard, `coverage-ratchet.mjs`,** reads Git through `gitRunner`, with `--no-replace-objects`, `GIT_OPTIONAL_LOCKS=0` and `GIT_TERMINAL_PROMPT=0` (`:101-118`). It writes nothing. With `CI=true`, `inCI` is true (`:129-131`). The baseline must then be a full 40- or 64-hex commit (`:136-159`), it replaces `HEAD` and `main` (`:186`), and a fork point at `HEAD` is refused (`:212-215`).
- **The format step, `touched-format.mjs`,** reads Git the same way. It gives each file's text to Prettier's `check()` in memory, and writes nothing (header, `:27-32`). In CI mode it uses the fork point of the configured baseline, refuses a fork point at `HEAD` (`:105-109`), and fails closed when no commit after it adds the rule (`:135-140`).
- **The contract history test** calls `gitBaselines(contractsDir)` with `process.env` (`contract.test.ts:214`). With a configured baseline, that baseline replaces `HEAD` and `main` (`snapshot-contract.ts:124-131`).
- **`pnpm typecheck`** is `tsc --noEmit`. **`pnpm lint`** is `eslint .` with no cache flag, then the design-rules script.
- **`pnpm test`:** the domain test prints coverage to stdout. The quality tests and plan tests make scratch Git repositories under the OS temporary folder. Jest writes `apps/mobile/coverage/`, which is ignored (`.gitignore:16`), and its cache under the OS temporary folder. `--ci` was already on Jest's command line, so `CI=true` doesn't change it.
- **`pnpm plan:build --check`** only parses and compares, and exits before any write (`scripts/plan/build.mjs:62-71`).
- **pnpm:** `.npmrc` and `pnpm-workspace.yaml` set nothing that installs before a run.
- **No step needs** the network, a database, Supabase, Docker, a fixture, a runner or a replay.

## Runs 0–12: preflight

Run 0, the session's first command, `rtk proxy git status --porcelain=v1 --untracked-files=all`: the same eight paths as run 9.

Run 1, `rtk proxy date -u +%Y-%m-%dT%H:%M:%SZ`: `2026-10-27T06:05:41Z`.

Run 2, `rtk proxy git rev-parse HEAD main`:

```text
961e1f41104e414f045d5a9a42e8e9ca44acf083
c8a5d57c3a0999760ad21fd1aca4899ca76b5adf
```

Run 3, `rtk proxy git merge-base c8a5d57c3a0999760ad21fd1aca4899ca76b5adf HEAD`:

```text
c8a5d57c3a0999760ad21fd1aca4899ca76b5adf
```

Run 4, `rtk proxy git rev-parse HEAD:scripts/quality/coverage-floor.json`: `0036eedaf6de63003294b9ff7aa3ef157ab57c74`.

Run 5, `rtk proxy git cat-file -e main:scripts/quality/coverage-floor.json`: **exit 128**:

```text
fatal: path 'scripts/quality/coverage-floor.json' exists on disk, but not in 'main'
```

Run 6, `rtk proxy node --version`: `v22.23.1`.

Runs 7 and 8, `rtk proxy which node` and `rtk proxy pnpm --version`: **both denied** in dontAsk mode. They were read-only orientation, so by Codex's rule the sequence used the permitted single reads it already had (run 6, and the root `package.json`). Neither was retried in another form.

Run 9, `rtk proxy git status --porcelain=v1 -b -uall`:

```text
## codex/qa9-quality-ratchets
 M docs/plan/runs/QA-9/checkpoint.md
 M docs/plan/runs/QA-9/handoff.md
?? docs/evidence/QA-9/final-2026-10-27T0435Z.md
?? docs/evidence/QA-9/final-2026-10-27T0505Z.md
?? docs/evidence/QA-9/final-2026-10-27T0535Z.md
?? docs/evidence/QA-9/final-2026-10-27T0605Z.md
?? docs/evidence/QA-9/phase-3i-check-outputs.md
?? docs/evidence/QA-9/phase-3j-check-outputs.md
```

Run 10, `rtk proxy git status --porcelain=v1 --ignored`: the same eight paths, then these ignored folders:

```text
!! apps/mobile/.expo/
!! apps/mobile/coverage/
!! apps/mobile/node_modules/
!! node_modules/
```

Run 11, `rtk proxy sha256sum` of the eight uncommitted paths, the floor, coverage-baseline.md and the lockfile:

```text
08bed3be9e1d9be32598142ec132395e616e17fa49384d811d807a7d76be6f05  docs/plan/runs/QA-9/checkpoint.md
07c29dc6fc324d9410bcdec03f27702f69cce968ed7911251eb8b0f199d6d8aa  docs/plan/runs/QA-9/handoff.md
d139b6f5765a317f6ed37b5f70e73e8d867b18d0ea98944584c2fab75bb76943  docs/evidence/QA-9/final-2026-10-27T0435Z.md
5f779f6c4e992c7f01b2a81d374fb49eae005d2ab6fe4c79cd6789bfda7dee23  docs/evidence/QA-9/final-2026-10-27T0505Z.md
62b452203d564d01840f515cc1304d5c95ca76c1038f4fec0349ce7732c582b7  docs/evidence/QA-9/final-2026-10-27T0535Z.md
2a0eb9db7fdcde0f4073d77c404cc850160ce7d66b09f8319bbeb96886619a7a  docs/evidence/QA-9/final-2026-10-27T0605Z.md
1b6964c1c16760c663ae7de29fd326b3540c4c5e08e2bc5224251fbc2ab5cd03  docs/evidence/QA-9/phase-3i-check-outputs.md
73431e58f7f5259e807c6714450ecee38ff725bb09715a05f13814f83cd3bc51  docs/evidence/QA-9/phase-3j-check-outputs.md
f0d4017c37f5bbd9ecba809d628f96f7bf12db7f0796e01329c2c0c16d646a4b  scripts/quality/coverage-floor.json
f8d23c1fc7ed98713d99da8b2b9019ce7b91e221d6156e84ffba401cf7695380  docs/evidence/QA-9/coverage-baseline.md
8aaac7f03b9aa141d8a0d4b9a91006799bb256d05051e26d81caee52ce0ea2b7  pnpm-lock.yaml
```

Run 12, `rtk proxy git log --oneline c8a5d57c3a0999760ad21fd1aca4899ca76b5adf..HEAD`:

```text
961e1f4 docs(QA-9): record phase 3H results and the 0405 review
c84bb4c docs(QA-9): record phase 3G results and the 0305 review
557b779 test(QA-9): cover deterministic Git baseline histories
06c8220 test(QA-9): coverage ratchet, gate wiring, exact domain thresholds and Prettier on touched files
```

## Run 13: `pnpm check`, once, in local CI mode

No file was edited between run 12 and the gate, or while it ran.

Run 13, `rtk proxy env CI=true FITLOG_CONTRACT_BASELINE=c8a5d57c3a0999760ad21fd1aca4899ca76b5adf pnpm check`, in this worktree, run **once** as background task `btpmpv0ep`, with no file edited until it finished. The harness reported **exit code 0**. The raw output file is `/private/tmp/claude-502/-Users-Adya--codex-worktrees-fitlog-qa9-fitness-app/fcdc094a-2ab4-41c2-a1a9-82f0c1f558a9/tasks/btpmpv0ep.output`, sha256 **`bbb95d7f2e56d0ed0c83cbfc047d0f0d10b3c9f2ad714bd672da5b13483e57bb`** (run 15). Read shows 887 lines of output, then the harness's own `[exited with code 0]` line and a final newline. Copied with the cuts marked (see "Cuts" and "Normalization"):

```text

> fitlog@ check /Users/Adya/.codex/worktrees/fitlog-qa9/fitness_app
> node scripts/quality/coverage-ratchet.mjs && node scripts/quality/touched-format.mjs && pnpm typecheck && pnpm lint && pnpm test && pnpm plan:build --check

Coverage ratchet verified. Mobile (apps/mobile/coverage-thresholds.json): statements 12.23, branches 10.57, functions 10.23, lines 18.67. Domain (packages/domain/package.json test): lines 91.42, branches 86.9, functions 90.59. Nothing is below the floor or 1 Git baseline(s). No @ts-ignore, @ts-nocheck or @ts-expect-error without a reason is in the 142 TypeScript files under apps/mobile and packages/domain. No Babel configuration is among the 264 entries under apps/mobile, apps/mobile/eslint.config.js is as reviewed, and the 131 other files it lints hold no eslint-disable without rules and a reason, and no inline rule configuration. No coverage-suppression comment is in the 141 files under apps/mobile/src and packages/domain/src.
  FITLOG_CONTRACT_BASELINE@c8a5d57c3a09: checked; records no coverage minimums yet, so the floor applies
  the floor is not anchored yet: no trusted baseline (main locally, FITLOG_CONTRACT_BASELINE in CI) records scripts/quality/coverage-floor.json. Until the ratchet is on main, a change that lowers the floor and a threshold together passes this guard; until then the quality tests hold the floor to docs/evidence/QA-9/coverage-baseline.md §5, and a reviewer compares the two at the exact commit that is merged
Formatting verified: the 19 touched JavaScript and TypeScript files match Prettier 3.6.2 with .prettierrc.json. Base: FITLOG_CONTRACT_BASELINE@c8a5d57c3a09, from 06c822050d76, which adds scripts/quality/touched-format.mjs. Not checked: 39 not JavaScript or TypeScript. Untouched and untracked files are never checked.

> fitlog@ typecheck /Users/Adya/.codex/worktrees/fitlog-qa9/fitness_app
> pnpm --filter @fitlog/domain typecheck && pnpm --filter @fitlog/mobile typecheck


> @fitlog/domain@0.1.0 typecheck /Users/Adya/.codex/worktrees/fitlog-qa9/fitness_app/packages/domain
> tsc --noEmit && tsc -p tsconfig.client.json --noEmit


> @fitlog/mobile@0.1.0 typecheck /Users/Adya/.codex/worktrees/fitlog-qa9/fitness_app/apps/mobile
> tsc --noEmit


> fitlog@ lint /Users/Adya/.codex/worktrees/fitlog-qa9/fitness_app
> pnpm --filter @fitlog/mobile lint


> @fitlog/mobile@0.1.0 lint /Users/Adya/.codex/worktrees/fitlog-qa9/fitness_app/apps/mobile
> eslint . --max-warnings=0 && node scripts/test-design-rules.cjs

Design rules verified: raw visual values fail; semantic tokens pass.

> fitlog@ test /Users/Adya/.codex/worktrees/fitlog-qa9/fitness_app
> pnpm --filter @fitlog/domain test && pnpm --filter @fitlog/mobile test:ci && pnpm plan:test


> @fitlog/domain@0.1.0 test /Users/Adya/.codex/worktrees/fitlog-qa9/fitness_app/packages/domain
> node ../../scripts/quality/coverage-ratchet.mjs && node --import tsx --enable-source-maps --test --experimental-test-coverage --test-coverage-include='src/**/*.ts' --test-coverage-exclude='src/**/*.test.ts' --test-coverage-lines=91.42 --test-coverage-branches=86.90 --test-coverage-functions=90.59 --test-reporter=spec --test-reporter-destination=stdout --test-reporter=../../scripts/quality/exact-coverage-reporter.mjs --test-reporter-destination=stdout src/*.test.ts

Coverage ratchet verified. Mobile (apps/mobile/coverage-thresholds.json): statements 12.23, branches 10.57, functions 10.23, lines 18.67. Domain (packages/domain/package.json test): lines 91.42, branches 86.9, functions 90.59. Nothing is below the floor or 1 Git baseline(s). No @ts-ignore, @ts-nocheck or @ts-expect-error without a reason is in the 142 TypeScript files under apps/mobile and packages/domain. No Babel configuration is among the 264 entries under apps/mobile, apps/mobile/eslint.config.js is as reviewed, and the 131 other files it lints hold no eslint-disable without rules and a reason, and no inline rule configuration. No coverage-suppression comment is in the 141 files under apps/mobile/src and packages/domain/src.
  FITLOG_CONTRACT_BASELINE@c8a5d57c3a09: checked; records no coverage minimums yet, so the floor applies
  the floor is not anchored yet: no trusted baseline (main locally, FITLOG_CONTRACT_BASELINE in CI) records scripts/quality/coverage-floor.json. Until the ratchet is on main, a change that lowers the floor and a threshold together passes this guard; until then the quality tests hold the floor to docs/evidence/QA-9/coverage-baseline.md §5, and a reviewer compares the two at the exact commit that is merged
✔ PRD training fixture excludes warmups and does not round intermediate e1RM (1.134084ms)
✔ explicit pauses are removed but background time is counted (0.068166ms)
✔ occurrences require an explicit eligible link and exclude future pending days from adherence (8.2465ms)
✔ food portions preserve unknowns and cannot infer liquid density (0.491208ms)
✔ goal progress handles loss, equal targets and baseline-only strength (0.147375ms)
✔ month-end membership and plate calculator fixtures (0.121792ms)
✔ invalid domain inputs cannot enter storage (5.422042ms)
✔ contract version is semver (0.447042ms)
✔ current schemas equal the snapshot for CONTRACT_VERSION (10.433083ms)
✔ every committed snapshot matches its manifest hash (1.595833ms)
✔ manifest versions strictly increase and end at CONTRACT_VERSION (0.17325ms)
✔ the package root exports CONTRACT_VERSION (7.549167ms)
✔ the contract covers every Zod schema the package root exports, plus the persisted eight (0.63ms)
✔ the client entrypoint imports no Node built-ins (0.397583ms)
✔ committed snapshot history is unchanged against each available Git baseline (53.832459ms)
ℹ c8a5d57c3a0999760ad21fd1aca4899ca76b5adf@c8a5d57c3a09: checked
✔ a snapshot and manifest rewritten together are rejected against a baseline (0.760959ms)
✔ the snapshot command refuses an existing version before planning any write (4.313083ms)
✔ the snapshot command validates existing history before planning a new version (1.141875ms)
✔ a schema change cannot ship as a PATCH bump within its compatibility line (4.315ms)
✔ the snapshot command writes a snapshot that verifies, and a second write changes nothing (5.693084ms)
✔ a failed write removes only the files that run created (5.540125ms)
✔ CI refuses to check history without a trusted baseline (160.231625ms)
✔ a configured baseline that is not a commit is refused (29.441041ms)
✔ a configured baseline replaces HEAD and main, and an absent file is not a failure (127.547959ms)
✔ a configured baseline fails closed outside a Git work tree; a local run without one only notes it (24.230291ms)
✔ a configured baseline fails closed when Git cannot answer, and never reads a failure as an absent file (92.185375ms)
✔ HEAD and main at one fork point are one baseline, listed once, in any host checkout (0.649917ms)
✔ a branch ahead of or diverged from main checks both fork points, each once, and each protects the history it records (0.374333ms)
✔ a clone without a local main checks HEAD alone and notes main as not found (0.121166ms)
✔ rules JSON Schema cannot express hold at their accept and reject boundaries (9.497375ms)
✔ the refines and transforms the snapshot drops are exactly the ones the vectors cover (1.141ms)
✔ backdated diary records retain their selected local date in India and DST zones (9.811959ms)
✔ paise input never rounds a binary floating point currency value (0.600125ms)
✔ PRD finance fixtures keep charges, collections, allocations and credit separate (1.403292ms)
✔ training.v1 set vectors match setVolume and epley (1.827625ms)
✔ training.v1 session vectors match sessionSummary (AC03) (11.715583ms)
✔ training.v1 fixture covers the PRD 8.2 cases with explicit nulls (0.717958ms)
ℹ fixture sha256 bc0672b5d26aa93b1e9be41219a0b20db1997913a37d6a9a0b2aac01ed1e1877
ℹ pending MB-4: no-eligible-session expects session volume null and is not asserted against sessionSummary
✔ formatDecimal trims zeros, keeps integers and never returns negative zero (0.124292ms)
✔ formatDecimal refuses non-finite values and invalid scales (0.2035ms)
✔ formatDecimal rounds the binary double, not the decimal (known limit, 003 §4.13) (0.03225ms)
ℹ tests 40
ℹ suites 0
ℹ pass 40
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 735.361083
ℹ start of coverage report
ℹ ---------------------------------------------------------------------------------------
ℹ file                   | line % | branch % | funcs % | uncovered lines
ℹ ---------------------------------------------------------------------------------------
ℹ src                    |        |          |         |
ℹ  calculations.ts       |  76.80 |    82.02 |   85.29 | 1 12-13 44-51 70-77 79-85 87-89
ℹ  cli                   |        |          |         |
ℹ   snapshot-contract.ts |  93.27 |    88.81 |   88.37 | 205-218 223
ℹ  contract.ts           | 100.00 |    88.89 |   92.86 |
ℹ  dates.ts              | 100.00 |    80.00 |  100.00 |
ℹ  encoding.ts           |  92.86 |   100.00 |  100.00 | 1
ℹ  finance.ts            | 100.00 |    87.10 |  100.00 |
ℹ  index.ts              | 100.00 |   100.00 |  100.00 |
ℹ  models.ts             |  99.11 |   100.00 |  100.00 | 112
ℹ ---------------------------------------------------------------------------------------
ℹ all files              |  92.11 |    87.22 |   90.60 |
ℹ ---------------------------------------------------------------------------------------
ℹ end of coverage report
Exact lines coverage 537/583 (92.1098%) meets the threshold of 91.42%
Exact branches coverage 273/313 (87.2204%) meets the threshold of 86.9%
Exact functions coverage 106/117 (90.5983%) meets the threshold of 90.59%
Coverage counts all 8 files that --test-coverage-include matches

> @fitlog/mobile@0.1.0 test:ci /Users/Adya/.codex/worktrees/fitlog-qa9/fitness_app/apps/mobile
> node --test ../../scripts/quality/*.test.mjs && node ../../scripts/quality/coverage-ratchet.mjs && jest --runInBand --ci --coverage --no-watchman

TAP version 13
# Subtest: this repository passes under its own environment, so in CI it is judged against the trusted baseline
ok 1 - this repository passes under its own environment, so in CI it is judged against the trusted baseline
[cut: raw lines 121–702, the rest of the 97 quality tests' TAP lines. Every test line reads "ok"; none reads "not ok"]
1..97
# tests 97
# suites 0
# pass 97
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 18501.410875
Coverage ratchet verified. Mobile (apps/mobile/coverage-thresholds.json): statements 12.23, branches 10.57, functions 10.23, lines 18.67. Domain (packages/domain/package.json test): lines 91.42, branches 86.9, functions 90.59. Nothing is below the floor or 1 Git baseline(s). No @ts-ignore, @ts-nocheck or @ts-expect-error without a reason is in the 142 TypeScript files under apps/mobile and packages/domain. No Babel configuration is among the 264 entries under apps/mobile, apps/mobile/eslint.config.js is as reviewed, and the 131 other files it lints hold no eslint-disable without rules and a reason, and no inline rule configuration. No coverage-suppression comment is in the 141 files under apps/mobile/src and packages/domain/src.
  FITLOG_CONTRACT_BASELINE@c8a5d57c3a09: checked; records no coverage minimums yet, so the floor applies
  the floor is not anchored yet: no trusted baseline (main locally, FITLOG_CONTRACT_BASELINE in CI) records scripts/quality/coverage-floor.json. Until the ratchet is on main, a change that lowers the floor and a threshold together passes this guard; until then the quality tests hold the floor to docs/evidence/QA-9/coverage-baseline.md §5, and a reviewer compares the two at the exact commit that is merged
PASS src/ui/__tests__/appearance.test.tsx
PASS src/data/__tests__/gym-outbox.test.ts
PASS src/data/__tests__/member-store.test.ts
PASS src/lib/__tests__/auth-callback.test.ts
PASS src/theme/__tests__/preference-store.test.ts
PASS src/theme/__tests__/theme.test.ts
PASS src/lib/i18n/__tests__/catalog.test.ts

=============================== Coverage summary ===============================
Statements   : 12.23% ( 254/2076 )
Branches     : 10.57% ( 164/1551 )
Functions    : 10.23% ( 84/821 )
Lines        : 18.67% ( 191/1023 )
================================================================================

Test Suites: 7 passed, 7 total
Tests:       126 passed, 126 total
Snapshots:   0 total
Time:        1.273 s
Ran all test suites.

> fitlog@ plan:test /Users/Adya/.codex/worktrees/fitlog-qa9/fitness_app
> node --test scripts/plan/lib.test.mjs

TAP version 13
[cut: raw lines 740–872, the 22 plan tests' TAP lines. Every test line reads "ok"; none reads "not ok"]
# tests 22
# suites 0
# pass 22
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 598.509416

> fitlog@ plan:build /Users/Adya/.codex/worktrees/fitlog-qa9/fitness_app
> node scripts/plan/build.mjs --check

GOALS.md: 114 goals, 230 needs, 10 lanes; ACCEPTANCE.md: 94 ledger rows, every PRD scenario and decision covered
plan.json and board.html match GOALS.md

[exited with code 0]
```

## Against expectations

The brief named no counts for this run, so the expectations are the gate's own pass conditions and the records' earlier forecasts.

| Expected | Measured | Met |
|---|---|---|
| `pnpm check` passes, once | Exit 0, one run, no retry | Yes |
| 285 tests | 40 domain + 97 quality + 126 Jest + 22 plan = **285**, all passing, none skipped | Yes |
| CI mode accepts the exact `main` commit as the baseline | The guard and the format step both labelled it `FITLOG_CONTRACT_BASELINE@c8a5d57c3a09`. Neither threw on the CI checks: a full commit ID, not a fork point at `HEAD`, and a rule start found | Yes |
| The baseline replaces `HEAD` and `main` | The guard counted **1** baseline, with no `HEAD@` or `main@` line. The contract test noted only `c8a5d57c3a09…@c8a5d57c3a09: checked` | Yes |
| The floor is reported as **not** anchored, since the real `main` has none | "the floor is not anchored yet" printed in all three guard runs, as run 5 predicts | Yes |
| Format step: 19 files, labelled from the QA-9 commit | **19** files, `Base: FITLOG_CONTRACT_BASELINE@c8a5d57c3a09, from 06c822050d76, which adds scripts/quality/touched-format.mjs`. That is ratchet-enforcement.md §7's step-4 shape | Yes |
| Domain at or above its thresholds; R19's CI forecast of 273/313 | Lines **537/583**, branches **273/313**, functions **106/117** | Yes |
| Mobile at or above its thresholds | 254/2076, 164/1551, 84/821 and 191/1023, the same counts as phases 3H and 3J | Yes |
| Plan build matches | "plan.json and board.html match GOALS.md" | Yes |

**R19's CI-mode state, measured for the first time:** branches 273/313, the same as with `HEAD` ahead of `main` (phases 3E to 3H) and with `HEAD` = `main` (phase 3J and the 0535 review). The forecast "the margin should hold" held, at the same count.

**R3 sample:** 537 lines. The uncovered-lines column lists 46 lines (calculations.ts 29, snapshot-contract.ts 15, encoding.ts 1 and models.ts 1). None of the four known flippers is among them: `calculations.ts:3` and `:118`, `dates.ts:19` and `finance.ts:14`. 537 = 583 − 46, the highest count seen, as in phase 3E's run 10.

**Three differences from earlier runs, each explained:**
- **The guard counted 264 entries under `apps/mobile`, not 210 (phase 3H) or 207 (phase 3J).** The guard counts every entry outside `node_modules`. This worktree now also holds the ignored `apps/mobile/.expo/`, which the native export left after phase 3H's gate (phase 3H's run 33, and the 0405 review's export). A Glob shows 44 files in it, `dev/logs/export.log`, 40 assets, `metadata.json` and the two `.hbc` bundles, in 10 folders. 207 + 3 (`coverage/` and its two files) + 54 = 264. None of them is a Babel configuration.
- **39 paths not checked, not phase 3H's 36.** Since `c84bb4c`, the records commit `961e1f4` added three Markdown paths: `phase-3h-check-outputs.md` and the two finals it committed. Untracked files are never counted.
- **Jest took 1.273 s.** Its cache was warm from earlier runs in this worktree. As with Low 1 (accepted in phase 3K), no cold-Jest run is claimed.

## Runs 14–20: after the gate

Run 14, `rtk proxy date -u`: `2026-10-27T06:06:33Z`.

Run 15, `rtk proxy sha256sum` of the raw output:

```text
bbb95d7f2e56d0ed0c83cbfc047d0f0d10b3c9f2ad714bd672da5b13483e57bb  /private/tmp/claude-502/-Users-Adya--codex-worktrees-fitlog-qa9-fitness-app/fcdc094a-2ab4-41c2-a1a9-82f0c1f558a9/tasks/btpmpv0ep.output
```

Run 16, `rtk proxy git status --porcelain=v1 -b -uall`: the same eight paths as run 9, and nothing else.

Run 17, `rtk proxy git status --porcelain=v1 --ignored`: the same eight paths and the same four ignored folders as run 10. **The gate changed no tracked or untracked path, and created no new ignored top-level entry.** Its writes went to `apps/mobile/coverage/`, which is ignored and already existed (a Glob shows the same two files), and to the OS temporary folder.

Run 18, `rtk proxy git rev-parse HEAD main`: `961e1f41104e414f045d5a9a42e8e9ca44acf083` and `c8a5d57c3a0999760ad21fd1aca4899ca76b5adf`, unchanged.

Run 19, `rtk proxy sha256sum` of the same eleven files as run 11: **all eleven unchanged**, the floor and the lockfile included.

Run 20, a read-only byte, line and trailing-space count of the raw output with `rtk proxy node -e`: **denied** in dontAsk mode. It was a script, so by Codex's rule the sequence ended there, with no other tool or form. So the raw output's byte count and its trailing spaces weren't measured (see "Normalization"). *(3M: the 0705 review's Grep later found 7 trailing spaces, at raw lines 96, 98, 100, 101, 103, 104 and 107. See "Normalization".)*

Then, with Glob, not the shell: `apps/mobile/.expo/**/*` (44 files) and `apps/mobile/coverage/**/*` (2 files), for the entry count above.

## Differences from hosted CI

- **`CI=true` only.** `GITHUB_ACTIONS` was unset. In CI mode `GITHUB_ACTIONS=true` only makes `inCI` true, as `CI=true` did here. The rule that CI mode can't be switched off under `GITHUB_ACTIONS` is exercised by the fixtures of `coverage-ratchet.test.mjs:796`, which passed inside this run's 97 quality tests. This live run didn't exercise it.
- **The checkout.** This ran on the branch tip, with eight uncommitted Markdown paths in the work tree. A hosted pull-request run checks out GitHub's detached merge commit (touched-format 17 tests that shape). A push run uses `github.event.before`.
- **The machine and the install.** This ran on macOS, Node v22.23.1, with this worktree's existing `node_modules` and warm caches. Hosted CI runs on Linux after a fresh install that runs the allowed builds.
- **No required-check context.** Nothing here shows PL-1's `ci-guard`, branch protection or the `backend` job (PL-1's H1).

## What this proves, and what it doesn't

**Proves (implementer runs):** at `961e1f4`, in local CI mode, with the exact `main` commit `c8a5d57c3a0999760ad21fd1aca4899ca76b5adf` as `FITLOG_CONTRACT_BASELINE`, `pnpm check` passes once with 285 tests. CI mode's paths in the guard, the format step and the contract history test accept that baseline, and it replaces `HEAD` and `main`. The format step selects the 19 QA-9 files from the rule's own commit. The guard reports the floor as **not** anchored, which is true of the real `main`. Domain coverage is 537/583, 273/313 and 106/117.

**Doesn't prove:**
- hosted CI, or box 3's lint-negative run, which needs the owner's specific approval to push (docs/23 §6);
- that the real `main` holds the floor. Only integration does that, with blob `0036eedaf6de63003294b9ff7aa3ef157ab57c74` at the merged commit;
- `pnpm backend:test`, which is still deferred to MB-1's serialised database lane;
- the exports, which are inherited and not re-run;
- exact integration, or an independent reproduction of this run.
