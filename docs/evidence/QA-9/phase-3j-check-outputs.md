# QA-9 · Phase 3J outputs: the floor proof at `HEAD` = `main`, in a disposable local clone

| Field | Value |
|---|---|
| What | The outputs of phase 3J. It runs the floor proof that phase 3I stopped: a local clone of this worktree at the exact tip `961e1f41104e414f045d5a9a42e8e9ca44acf083`, with `main` set to `HEAD` inside the clone only, an offline frozen install with `--ignore-scripts`, and **one** `pnpm check` |
| Who | The phase-3J implementer, a local Claude session under Codex's phase-3J brief (AUTH-01). Session `62ebc6ab-7078-4826-9214-f1871d560324`, as named in the path of the background task's output file, which the tool printed (run 36). **These are implementer runs, not independent evidence** |
| Node | `v22.23.1` at `/Users/Adya/.hermes/node/bin/node` (runs 4–5), equal to `.node-version` in this worktree and in the clone. The gate used the `node` on `PATH`, with no `PATH` change |
| pnpm | `v10.27.0`, from the install's own output (run 31), equal to `packageManager` in the root `package.json` |
| Git | `git version 2.54.0 (Apple Git-157)` (run 10) |
| Timestamps (UTC, `rtk proxy date -u`) | Start of phase **04:38:17Z** (run 1). Install: **04:40:04Z** before, **04:40:21Z** after. Gate: **04:40:29Z** just before it started, **04:41:42Z** just after its completion notice. So the gate took at most 73 seconds |
| Result | **`pnpm check` exit 0, once. 285 tests** (40 + 97 + 126 + 22). Format step: **0 files**, `Base: main@961e1f41104e`. Guard: **1 Git baseline**, `main@961e1f41104e: same commit as an earlier baseline`, and **no "floor is not anchored" line**. Domain: lines **535/583**, branches **273/313**, functions **106/117**. Mobile: 254/2076, 164/1551, 84/821 and 191/1023. Plan build: matches |
| Floor | The floor file's bytes are identical in this worktree, the clone's working tree and the commit the clone's `HEAD` and `main` both name: sha256 `f0d4017c37f5bbd9ecba809d628f96f7bf12db7f0796e01329c2c0c16d646a4b`, blob `0036eedaf6de63003294b9ff7aa3ef157ab57c74`. Its seven values equal coverage-baseline.md §5, and its scope equals §1 (read below). §5 is a Markdown table and the floor is JSON, so that comparison is by value; the bytes compared are the floor's own, at each place |
| Executed | Every numbered run below, by this session |
| Inspected, not executed | The floor values against §5 and the scope against §1, with Read. The coverage folders, with Glob |
| Inherited | The 0405 review's executed results on `c84bb4c` (285 tests and both JS and Hermes exports), accepted as Codex's acceptance (13). The exports were not run again in this phase. `961e1f4` differs from `c84bb4c` only by five Markdown files (phase 3I, run 17) |
| Normalization | Run 36's output below is copied whole. The one change: the trailing space at the end of 5 Node coverage-table rows (raw lines 97, 99, 101, 105 and 108) is removed, as Codex chose for the same rows in phase 3G. Run 45 checks the copy against the raw file mechanically |
| Cuts | None |
| Redaction | None needed. No output holds a key, token, password or personal data |
| Run numbers | The checkpoint's, under "Commands run in phase 3J" |
| Written | After the gate, uncommitted. This file is untracked. No commit is made in phase 3J, by the brief |

## Run 0: a denied orientation command

Before run 1, a compound command (`pwd; git rev-parse HEAD; git rev-parse --abbrev-ref HEAD; git status --porcelain; ls docs/plan/runs/QA-9/ docs/evidence/QA-9/`) was **denied** in dontAsk mode. It was outside the allowlist, which is written for `rtk proxy` forms. That sequence ended there. Afterwards the folders were listed with Glob, the tool the denial itself names, and each status read was made as a single allowed `rtk proxy git` command. No denied form was retried.

## Runs 1–6: orientation

Run 1, `rtk proxy date -u +%Y-%m-%dT%H:%M:%SZ`: `2026-10-27T04:38:17Z`.

Run 2, `rtk proxy git status --porcelain=v1 -b -uall`:

```text
## codex/qa9-quality-ratchets
 M docs/plan/runs/QA-9/checkpoint.md
 M docs/plan/runs/QA-9/handoff.md
?? docs/evidence/QA-9/final-2026-10-27T0435Z.md
?? docs/evidence/QA-9/phase-3i-check-outputs.md
```

Run 3, `rtk proxy git rev-parse HEAD main`:

```text
961e1f41104e414f045d5a9a42e8e9ca44acf083
c8a5d57c3a0999760ad21fd1aca4899ca76b5adf
```

Run 4, `rtk proxy node --version`: `v22.23.1`. Run 5, `rtk proxy node -p process.execPath`: `/Users/Adya/.hermes/node/bin/node`.

Run 6, `rtk proxy sha256sum` of six files, before any write:

```text
d139b6f5765a317f6ed37b5f70e73e8d867b18d0ea98944584c2fab75bb76943  docs/evidence/QA-9/final-2026-10-27T0435Z.md
1b6964c1c16760c663ae7de29fd326b3540c4c5e08e2bc5224251fbc2ab5cd03  docs/evidence/QA-9/phase-3i-check-outputs.md
8f3958c9bf169cdfd80ab93a63376badf8fc015334a14acb8c629fcc6ea4d04b  docs/evidence/QA-9/final-2026-10-27T0405Z.md
5e0e8271e86f68805bcbfc2e9f26c0349f058337856673081186b30d84ddbdcd  docs/evidence/QA-9/final-2026-10-27T0335Z.md
f0d4017c37f5bbd9ecba809d628f96f7bf12db7f0796e01329c2c0c16d646a4b  scripts/quality/coverage-floor.json
f8d23c1fc7ed98713d99da8b2b9019ce7b91e221d6156e84ffba401cf7695380  docs/evidence/QA-9/coverage-baseline.md
```

## Runs 7–12: the disposable folder, checked, then set up

The folder is phase 3I's `mktemp` folder, `/var/folders/0s/4k0smcx56zl9hdj404qnz2s80000gp/T/fitlog-qa9-floor.dGGhev2tS6`, called `<root>` below.

Run 7, `rtk proxy git -C <root> rev-parse --show-toplevel`, exit 128:

```text
fatal: not a git repository (or any of the parent directories): .git
```

So `<root>` is outside every Git repository.

Run 8, a read-only listing with `rtk proxy node -e` (`fs.lstatSync`, `fs.realpathSync` and `fs.readdirSync` of `<root>`):

```text
{"realpath":"/private/var/folders/0s/4k0smcx56zl9hdj404qnz2s80000gp/T/fitlog-qa9-floor.dGGhev2tS6","isDirectory":true,"isSymbolicLink":false,"mode":"700","uid":502,"entries":[]}
```

So `<root>` was **empty**, hidden entries included, before use. It is a real directory, not a link, and only its owner can open it.

Run 9, `rtk proxy git config --show-origin --get-regexp "^(init\.templatedir|core\.hookspath|core\.fsmonitor|clone\.|submodule\.recurse|protocol\.|filter\.|uploadpack\.)"`: **exit 1, no output**. So no configuration level sets a template, a hooks path, an fsmonitor, a clone default, submodule recursion, a protocol rule, a filter or an upload-pack hook. Only those keys were read, so no credential setting was printed. A Grep of `.gitattributes` files found no `filter=` and no `lfs`.

Run 10, `rtk proxy git --version`: `git version 2.54.0 (Apple Git-157)`.

Runs 11 and 12, `rtk proxy mkdir <root>/empty-template` and `rtk proxy mkdir <root>/empty-hooks`, one path each: no output, so both were made. **`<root>/tmp` was not made.** The brief permits it, but the allowlist has only the exact `pnpm check` form, with no `TMPDIR=` form, so the folder would have stayed unused. See "Differences" below.

## Runs 13–17: the clone

Run 13:

```text
rtk proxy git clone --template=<root>/empty-template -c core.hooksPath=<root>/empty-hooks --no-hardlinks --branch codex/qa9-quality-ratchets /Users/Adya/.codex/worktrees/fitlog-qa9/fitness_app <root>/clone
```

with `<root>` written out in full. Output:

```text
Cloning into '/var/folders/0s/4k0smcx56zl9hdj404qnz2s80000gp/T/fitlog-qa9-floor.dGGhev2tS6/clone'...
done.
```

The source is this local worktree. No fetch, and no network remote. `--no-hardlinks` copies the objects, so nothing in the clone shares a file with this repository.

Run 14, `rtk proxy git -C <root>/clone rev-parse HEAD`: `961e1f41104e414f045d5a9a42e8e9ca44acf083`, the **exact tip**.

Run 15, `rtk proxy git -C <root>/clone config --local --list --show-origin`:

```text
file:.git/config	core.repositoryformatversion=0
file:.git/config	core.filemode=true
file:.git/config	core.bare=false
file:.git/config	core.logallrefupdates=true
file:.git/config	core.ignorecase=true
file:.git/config	core.precomposeunicode=true
file:.git/config	core.hookspath=/var/folders/0s/4k0smcx56zl9hdj404qnz2s80000gp/T/fitlog-qa9-floor.dGGhev2tS6/empty-hooks
file:.git/config	remote.origin.url=/Users/Adya/.codex/worktrees/fitlog-qa9/fitness_app
file:.git/config	remote.origin.fetch=+refs/heads/*:refs/remotes/origin/*
file:.git/config	branch.codex/qa9-quality-ratchets.remote=origin
file:.git/config	branch.codex/qa9-quality-ratchets.merge=refs/heads/codex/qa9-quality-ratchets
```

The only remote is this worktree's local path. The tab after each `file:.git/config` is Git's.

Run 16, `rtk proxy git -C <root>/clone status --porcelain=v1 -b -uall`: `## codex/qa9-quality-ratchets...origin/codex/qa9-quality-ratchets` only, so clean.

Run 17, a read-only listing with `rtk proxy node -e` (`fs.readdirSync` of `<root>`, both empty folders and `<root>/clone/.git`, `fs.lstatSync` of `.git` and `fs.existsSync` of `.git/hooks`):

```text
{"root":["clone","empty-hooks","empty-template"],"emptyTemplate":[],"emptyHooks":[],"cloneGitDir":["HEAD","config","index","logs","objects","packed-refs","refs"],"cloneGitIsDir":true,"cloneHooksExists":false}
```

So no template file was copied, the clone has **no hooks folder**, its hooks path is empty, and its `.git` is its own directory, not a link to this repository.

## Runs 18–26: `main` = `HEAD` inside the clone, and the floor's bytes

Run 18, `rtk proxy git -C <root>/clone checkout -B main 961e1f41104e414f045d5a9a42e8e9ca44acf083`:

```text
Switched to a new branch 'main'
```

Run 19, `rtk proxy git -C <root>/clone rev-parse HEAD main refs/heads/main origin/main codex/qa9-quality-ratchets`:

```text
961e1f41104e414f045d5a9a42e8e9ca44acf083
961e1f41104e414f045d5a9a42e8e9ca44acf083
961e1f41104e414f045d5a9a42e8e9ca44acf083
c8a5d57c3a0999760ad21fd1aca4899ca76b5adf
961e1f41104e414f045d5a9a42e8e9ca44acf083
```

So inside the clone, `HEAD`, `main` and the branch are all the tip. `origin/main` is the clone's read-only copy of this repository's `main`, `c8a5d57`. Neither check reads it: `touched-format.mjs` asks for `refs/heads/main`, and the guard's labels below name `main@961e1f41104e`.

Run 20, `rtk proxy git -C <root>/clone symbolic-ref HEAD`: `refs/heads/main`. Run 21, `rtk proxy git -C <root>/clone status --porcelain=v1 -b -uall`: `## main` only, so clean.

Run 22, `rtk proxy git rev-parse HEAD main`, in this worktree: `961e1f41104e414f045d5a9a42e8e9ca44acf083` and `c8a5d57c3a0999760ad21fd1aca4899ca76b5adf`. **This repository's `main` did not move.**

Run 23, `rtk proxy sha256sum` of five files:

```text
f0d4017c37f5bbd9ecba809d628f96f7bf12db7f0796e01329c2c0c16d646a4b  /var/folders/0s/4k0smcx56zl9hdj404qnz2s80000gp/T/fitlog-qa9-floor.dGGhev2tS6/clone/scripts/quality/coverage-floor.json
f8d23c1fc7ed98713d99da8b2b9019ce7b91e221d6156e84ffba401cf7695380  /var/folders/0s/4k0smcx56zl9hdj404qnz2s80000gp/T/fitlog-qa9-floor.dGGhev2tS6/clone/docs/evidence/QA-9/coverage-baseline.md
8aaac7f03b9aa141d8a0d4b9a91006799bb256d05051e26d81caee52ce0ea2b7  /var/folders/0s/4k0smcx56zl9hdj404qnz2s80000gp/T/fitlog-qa9-floor.dGGhev2tS6/clone/pnpm-lock.yaml
8aaac7f03b9aa141d8a0d4b9a91006799bb256d05051e26d81caee52ce0ea2b7  /Users/Adya/.codex/worktrees/fitlog-qa9/fitness_app/pnpm-lock.yaml
7d2df647f25529bd87500319c41564e032e2be642e565350fa6136d7a1ec4d10  /var/folders/0s/4k0smcx56zl9hdj404qnz2s80000gp/T/fitlog-qa9-floor.dGGhev2tS6/clone/.node-version
```

The clone's floor and §5 evidence hash the same as this worktree's (run 6), and so do the two lockfiles. Read shows the clone's `.node-version` as `22.23.1`.

Run 24, `rtk proxy git -C <root>/clone rev-parse HEAD:scripts/quality/coverage-floor.json main:scripts/quality/coverage-floor.json HEAD:docs/evidence/QA-9/coverage-baseline.md`:

```text
0036eedaf6de63003294b9ff7aa3ef157ab57c74
0036eedaf6de63003294b9ff7aa3ef157ab57c74
ac25d0ff9314026fbdfb8889a8e40c328b23717d
```

Run 25, `rtk proxy git -C <root>/clone hash-object scripts/quality/coverage-floor.json docs/evidence/QA-9/coverage-baseline.md`, the clone's working files: `0036eedaf6de63003294b9ff7aa3ef157ab57c74` and `ac25d0ff9314026fbdfb8889a8e40c328b23717d`.

Run 26, `rtk proxy git rev-parse 961e1f41104e414f045d5a9a42e8e9ca44acf083:scripts/quality/coverage-floor.json 961e1f41104e414f045d5a9a42e8e9ca44acf083:docs/evidence/QA-9/coverage-baseline.md`, in this worktree: the same two blobs.

The clone's floor, read with Read:

```text
{
  "source": "docs/evidence/QA-9/coverage-baseline.md, measured 26 October 2026 at 2a95726",
  "mobile": {
    "collectCoverageFrom": ["src/**/*.{ts,tsx}", "!src/**/__tests__/**"],
    "global": { "statements": 12.23, "branches": 10.57, "functions": 10.23, "lines": 18.67 }
  },
  "domain": { "lines": 91.42, "branches": 86.90, "functions": 90.59 }
}
```

**Against coverage-baseline.md, read with Read in this phase:**

| Value | Floor | Evidence | Equal |
|---|---|---|---|
| Mobile statements | 12.23 | §5 **12.23** | Yes |
| Mobile branches | 10.57 | §5 **10.57** | Yes |
| Mobile functions | 10.23 | §5 **10.23** | Yes |
| Mobile lines | 18.67 | §5 **18.67** | Yes |
| Domain lines | 91.42 | §5 **91.42** | Yes |
| Domain branches | 86.90 | §5 **86.90** | Yes |
| Domain functions | 90.59 | §5 **90.59** | Yes |
| Mobile scope | `["src/**/*.{ts,tsx}", "!src/**/__tests__/**"]` | §1 `collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/__tests__/**']` | Yes |

Once `main` records the floor, quality test 2 checks only that the floor is not below §5 (`coverage-ratchet.test.mjs:232-252`); exact equality is asserted only while the floor is unanchored. So at `HEAD` = `main`, this table is what shows equality, not the test.

## Runs 27–34: the offline install, in the clone

Run 27, `cd <root>/clone`: no output. The harness then named the clone as the working directory. Run 28, `rtk proxy node -p "process.cwd()"`: `/private/var/folders/0s/4k0smcx56zl9hdj404qnz2s80000gp/T/fitlog-qa9-floor.dGGhev2tS6/clone`.

Run 29, `rtk proxy node -e` with `fs.existsSync` of the three `node_modules` folders:

```text
[["node_modules",false],["apps/mobile/node_modules",false],["packages/domain/node_modules",false]]
```

So the install started from nothing, with no link and no copied `node_modules`.

Run 30, `date -u`: `2026-10-27T04:40:04Z`.

Run 31, `rtk proxy pnpm install --frozen-lockfile --offline --ignore-scripts`, exit 0:

```text
Scope: all 3 workspace projects
Lockfile is up to date, resolution step is skipped
Packages: +1096
++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
Progress: resolved 0, reused 1, downloaded 0, added 0
Progress: resolved 0, reused 1027, downloaded 0, added 30
Progress: resolved 0, reused 1027, downloaded 0, added 80
Progress: resolved 0, reused 1027, downloaded 0, added 235
Progress: resolved 0, reused 1027, downloaded 0, added 547
Progress: resolved 0, reused 1027, downloaded 0, added 702
Progress: resolved 0, reused 1027, downloaded 0, added 868
Progress: resolved 0, reused 1027, downloaded 0, added 1096, done

Done in 7.2s using pnpm v10.27.0
```

**`downloaded 0`**, and the lockfile was not resolved again. `--offline` lets pnpm use only its local store. `--ignore-scripts` skipped every lifecycle script, so `supabase`'s `postinstall`, which downloads its CLI, did not run, and neither did the builds of `esbuild` and `unrs-resolver`.

Run 32, `date -u`: `2026-10-27T04:40:21Z`. Run 33, `rtk proxy git -C <root>/clone status --porcelain=v1 -b -uall`: `## main` only, so no tracked file changed. Run 34, `rtk proxy sha256sum <root>/clone/pnpm-lock.yaml`: `8aaac7f03b9aa141d8a0d4b9a91006799bb256d05051e26d81caee52ce0ea2b7`, unchanged.

## Runs 35–38: `pnpm check`, once, at `HEAD` = `main`

Run 35, `date -u`: `2026-10-27T04:40:29Z`.

Run 36, `rtk proxy pnpm check`, in the clone, run once as background task `b2ytqnhul`, with no file edited until it finished. The harness reported **exit code 0**. The raw output file, `/private/tmp/claude-502/-Users-Adya--codex-worktrees-fitlog-qa9-fitness-app/62ebc6ab-7078-4826-9214-f1871d560324/tasks/b2ytqnhul.output`, is **44,207 bytes**, **889 lines and a final newline**, with sha256 **`6dc7f0ba16205dd6b070132630f57ab6b628dd40fa9b1d5cac5749005f6add2c`** (runs 41 and 44). It has no tab and no carriage return. Copied whole, with only the five trailing spaces removed (see "Normalization"):

```text

> fitlog@ check /private/var/folders/0s/4k0smcx56zl9hdj404qnz2s80000gp/T/fitlog-qa9-floor.dGGhev2tS6/clone
> node scripts/quality/coverage-ratchet.mjs && node scripts/quality/touched-format.mjs && pnpm typecheck && pnpm lint && pnpm test && pnpm plan:build --check

Coverage ratchet verified. Mobile (apps/mobile/coverage-thresholds.json): statements 12.23, branches 10.57, functions 10.23, lines 18.67. Domain (packages/domain/package.json test): lines 91.42, branches 86.9, functions 90.59. Nothing is below the floor or 1 Git baseline(s). No @ts-ignore, @ts-nocheck or @ts-expect-error without a reason is in the 142 TypeScript files under apps/mobile and packages/domain. No Babel configuration is among the 207 entries under apps/mobile, apps/mobile/eslint.config.js is as reviewed, and the 131 other files it lints hold no eslint-disable without rules and a reason, and no inline rule configuration. No coverage-suppression comment is in the 141 files under apps/mobile/src and packages/domain/src.
  HEAD@961e1f41104e: checked; records the floor, mobile thresholds, domain thresholds
  main@961e1f41104e: same commit as an earlier baseline
Formatting verified: the 0 touched JavaScript and TypeScript files match Prettier 3.6.2 with .prettierrc.json. Base: main@961e1f41104e. No other tracked path was touched. Untouched and untracked files are never checked.

> fitlog@ typecheck /private/var/folders/0s/4k0smcx56zl9hdj404qnz2s80000gp/T/fitlog-qa9-floor.dGGhev2tS6/clone
> pnpm --filter @fitlog/domain typecheck && pnpm --filter @fitlog/mobile typecheck


> @fitlog/domain@0.1.0 typecheck /private/var/folders/0s/4k0smcx56zl9hdj404qnz2s80000gp/T/fitlog-qa9-floor.dGGhev2tS6/clone/packages/domain
> tsc --noEmit && tsc -p tsconfig.client.json --noEmit


> @fitlog/mobile@0.1.0 typecheck /private/var/folders/0s/4k0smcx56zl9hdj404qnz2s80000gp/T/fitlog-qa9-floor.dGGhev2tS6/clone/apps/mobile
> tsc --noEmit


> fitlog@ lint /private/var/folders/0s/4k0smcx56zl9hdj404qnz2s80000gp/T/fitlog-qa9-floor.dGGhev2tS6/clone
> pnpm --filter @fitlog/mobile lint


> @fitlog/mobile@0.1.0 lint /private/var/folders/0s/4k0smcx56zl9hdj404qnz2s80000gp/T/fitlog-qa9-floor.dGGhev2tS6/clone/apps/mobile
> eslint . --max-warnings=0 && node scripts/test-design-rules.cjs

Design rules verified: raw visual values fail; semantic tokens pass.

> fitlog@ test /private/var/folders/0s/4k0smcx56zl9hdj404qnz2s80000gp/T/fitlog-qa9-floor.dGGhev2tS6/clone
> pnpm --filter @fitlog/domain test && pnpm --filter @fitlog/mobile test:ci && pnpm plan:test


> @fitlog/domain@0.1.0 test /private/var/folders/0s/4k0smcx56zl9hdj404qnz2s80000gp/T/fitlog-qa9-floor.dGGhev2tS6/clone/packages/domain
> node ../../scripts/quality/coverage-ratchet.mjs && node --import tsx --enable-source-maps --test --experimental-test-coverage --test-coverage-include='src/**/*.ts' --test-coverage-exclude='src/**/*.test.ts' --test-coverage-lines=91.42 --test-coverage-branches=86.90 --test-coverage-functions=90.59 --test-reporter=spec --test-reporter-destination=stdout --test-reporter=../../scripts/quality/exact-coverage-reporter.mjs --test-reporter-destination=stdout src/*.test.ts

Coverage ratchet verified. Mobile (apps/mobile/coverage-thresholds.json): statements 12.23, branches 10.57, functions 10.23, lines 18.67. Domain (packages/domain/package.json test): lines 91.42, branches 86.9, functions 90.59. Nothing is below the floor or 1 Git baseline(s). No @ts-ignore, @ts-nocheck or @ts-expect-error without a reason is in the 142 TypeScript files under apps/mobile and packages/domain. No Babel configuration is among the 207 entries under apps/mobile, apps/mobile/eslint.config.js is as reviewed, and the 131 other files it lints hold no eslint-disable without rules and a reason, and no inline rule configuration. No coverage-suppression comment is in the 141 files under apps/mobile/src and packages/domain/src.
  HEAD@961e1f41104e: checked; records the floor, mobile thresholds, domain thresholds
  main@961e1f41104e: same commit as an earlier baseline
✔ PRD training fixture excludes warmups and does not round intermediate e1RM (2.959042ms)
✔ explicit pauses are removed but background time is counted (1.085125ms)
✔ occurrences require an explicit eligible link and exclude future pending days from adherence (14.331ms)
✔ food portions preserve unknowns and cannot infer liquid density (1.332084ms)
✔ goal progress handles loss, equal targets and baseline-only strength (0.593458ms)
✔ month-end membership and plate calculator fixtures (0.53925ms)
✔ invalid domain inputs cannot enter storage (8.713291ms)
✔ contract version is semver (0.934ms)
✔ current schemas equal the snapshot for CONTRACT_VERSION (21.826375ms)
✔ every committed snapshot matches its manifest hash (1.76975ms)
✔ manifest versions strictly increase and end at CONTRACT_VERSION (0.183375ms)
✔ the package root exports CONTRACT_VERSION (10.308334ms)
✔ the contract covers every Zod schema the package root exports, plus the persisted eight (1.137334ms)
✔ the client entrypoint imports no Node built-ins (0.491916ms)
✔ committed snapshot history is unchanged against each available Git baseline (160.109417ms)
ℹ HEAD@961e1f41104e: checked
ℹ main@961e1f41104e: same commit as an earlier baseline
✔ a snapshot and manifest rewritten together are rejected against a baseline (3.415042ms)
✔ the snapshot command refuses an existing version before planning any write (12.1385ms)
✔ the snapshot command validates existing history before planning a new version (6.992041ms)
✔ a schema change cannot ship as a PATCH bump within its compatibility line (15.197167ms)
✔ the snapshot command writes a snapshot that verifies, and a second write changes nothing (16.973875ms)
✔ a failed write removes only the files that run created (41.688ms)
✔ CI refuses to check history without a trusted baseline (984.637ms)
✔ a configured baseline that is not a commit is refused (65.650625ms)
✔ a configured baseline replaces HEAD and main, and an absent file is not a failure (368.207708ms)
✔ a configured baseline fails closed outside a Git work tree; a local run without one only notes it (64.897666ms)
✔ a configured baseline fails closed when Git cannot answer, and never reads a failure as an absent file (181.047083ms)
✔ HEAD and main at one fork point are one baseline, listed once, in any host checkout (1.008292ms)
✔ a branch ahead of or diverged from main checks both fork points, each once, and each protects the history it records (1.227834ms)
✔ a clone without a local main checks HEAD alone and notes main as not found (0.219167ms)
✔ rules JSON Schema cannot express hold at their accept and reject boundaries (25.759ms)
✔ the refines and transforms the snapshot drops are exactly the ones the vectors cover (2.335417ms)
✔ backdated diary records retain their selected local date in India and DST zones (22.278542ms)
✔ paise input never rounds a binary floating point currency value (2.109208ms)
✔ PRD finance fixtures keep charges, collections, allocations and credit separate (1.541125ms)
✔ training.v1 set vectors match setVolume and epley (6.662333ms)
✔ training.v1 session vectors match sessionSummary (AC03) (50.111875ms)
✔ training.v1 fixture covers the PRD 8.2 cases with explicit nulls (0.810833ms)
ℹ fixture sha256 bc0672b5d26aa93b1e9be41219a0b20db1997913a37d6a9a0b2aac01ed1e1877
ℹ pending MB-4: no-eligible-session expects session volume null and is not asserted against sessionSummary
✔ formatDecimal trims zeros, keeps integers and never returns negative zero (0.383542ms)
✔ formatDecimal refuses non-finite values and invalid scales (0.727708ms)
✔ formatDecimal rounds the binary double, not the decimal (known limit, 003 §4.13) (0.080125ms)
ℹ tests 40
ℹ suites 0
ℹ pass 40
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 3412.694041
ℹ start of coverage report
ℹ ---------------------------------------------------------------------------------------
ℹ file                   | line % | branch % | funcs % | uncovered lines
ℹ ---------------------------------------------------------------------------------------
ℹ src                    |        |          |         |
ℹ  calculations.ts       |  76.80 |    82.02 |   85.29 | 1 12-13 44-51 70-77 79-85 87-89
ℹ  cli                   |        |          |         |
ℹ   snapshot-contract.ts |  93.27 |    88.81 |   88.37 | 205-218 223
ℹ  contract.ts           | 100.00 |    88.89 |   92.86 |
ℹ  dates.ts              |  95.24 |    80.00 |  100.00 | 19
ℹ  encoding.ts           |  92.86 |   100.00 |  100.00 | 1
ℹ  finance.ts            |  97.14 |    87.10 |  100.00 | 14
ℹ  index.ts              | 100.00 |   100.00 |  100.00 |
ℹ  models.ts             |  99.11 |   100.00 |  100.00 | 112
ℹ ---------------------------------------------------------------------------------------
ℹ all files              |  91.77 |    87.22 |   90.60 |
ℹ ---------------------------------------------------------------------------------------
ℹ end of coverage report
Exact lines coverage 535/583 (91.7667%) meets the threshold of 91.42%
Exact branches coverage 273/313 (87.2204%) meets the threshold of 86.9%
Exact functions coverage 106/117 (90.5983%) meets the threshold of 90.59%
Coverage counts all 8 files that --test-coverage-include matches

> @fitlog/mobile@0.1.0 test:ci /private/var/folders/0s/4k0smcx56zl9hdj404qnz2s80000gp/T/fitlog-qa9-floor.dGGhev2tS6/clone/apps/mobile
> node --test ../../scripts/quality/*.test.mjs && node ../../scripts/quality/coverage-ratchet.mjs && jest --runInBand --ci --coverage --no-watchman

TAP version 13
# Subtest: this repository passes under its own environment, so in CI it is judged against the trusted baseline
ok 1 - this repository passes under its own environment, so in CI it is judged against the trusted baseline
  ---
  duration_ms: 461.761292
  type: 'test'
  ...
# Subtest: the floor never sits below the phase-1 evidence, and equals it exactly until main anchors it
ok 2 - the floor never sits below the phase-1 evidence, and equals it exactly until main anchors it
  ---
  duration_ms: 359.15025
  type: 'test'
  ...
# Subtest: before the first commit the checked-in floor is the minimum, the ratchet as built passes, and the floor is not anchored
ok 3 - before the first commit the checked-in floor is the minimum, the ratchet as built passes, and the floor is not anchored
  ---
  duration_ms: 310.958291
  type: 'test'
  ...
# Subtest: before the first commit, lowering any threshold by 0.01 fails against the floor
ok 4 - before the first commit, lowering any threshold by 0.01 fails against the floor
  ---
  duration_ms: 1553.702291
  type: 'test'
  ...
# Subtest: raising thresholds passes the guard; Jest and Node then decide whether coverage meets them
ok 5 - raising thresholds passes the guard; Jest and Node then decide whether coverage meets them
  ---
  duration_ms: 277.745
  type: 'test'
  ...
# Subtest: a metric removed from the thresholds file or the domain command fails
ok 6 - a metric removed from the thresholds file or the domain command fails
  ---
  duration_ms: 2073.406333
  type: 'test'
  ...
# Subtest: a threshold must be a number from 0 to 100 with at most 2 decimals, and per-path thresholds are refused
ok 7 - a threshold must be a number from 0 to 100 with at most 2 decimals, and per-path thresholds are refused
  ---
  duration_ms: 2023.566667
  type: 'test'
  ...
# Subtest: narrowing the coverage scope fails; widening it passes
ok 8 - narrowing the coverage scope fails; widening it passes
  ---
  duration_ms: 905.23425
  type: 'test'
  ...
# Subtest: jest.config.cjs may set only the reviewed options, with preset and testMatch pinned and the thresholds file applied unchanged
ok 9 - jest.config.cjs may set only the reviewed options, with preset and testMatch pinned and the thresholds file applied unchanged
  ---
  duration_ms: 4167.454458
  type: 'test'
  ...
# Subtest: the domain test keeps its template, and the gate wiring checks run inside the guard
ok 10 - the domain test keeps its template, and the gate wiring checks run inside the guard
  ---
  duration_ms: 826.867542
  type: 'test'
  ...
# Subtest: once committed, an uncommitted lowering fails against HEAD even when the floor is lowered with it
ok 11 - once committed, an uncommitted lowering fails against HEAD even when the floor is lowered with it
  ---
  duration_ms: 214.306042
  type: 'test'
  ...
# Subtest: until main holds the ratchet the floor is not anchored: a later branch commit can lower it with a threshold, and only integration into main closes that
ok 12 - until main holds the ratchet the floor is not anchored: a later branch commit can lower it with a threshold, and only integration into main closes that
  ---
  duration_ms: 1010.277375
  type: 'test'
  ...
# Subtest: once main holds the ratchet, a lowering committed on the branch still fails against main
ok 13 - once main holds the ratchet, a lowering committed on the branch still fails against main
  ---
  duration_ms: 511.877333
  type: 'test'
  ...
# Subtest: once committed, the floor itself never goes down or narrows
ok 14 - once committed, the floor itself never goes down or narrows
  ---
  duration_ms: 610.081041
  type: 'test'
  ...
# Subtest: a baseline file that is not valid JSON fails closed
ok 15 - a baseline file that is not valid JSON fails closed
  ---
  duration_ms: 219.505834
  type: 'test'
  ...
# Subtest: CI needs a trusted full commit ID and never falls back to HEAD or main
ok 16 - CI needs a trusted full commit ID and never falls back to HEAD or main
  ---
  duration_ms: 481.170666
  type: 'test'
  ...
# Subtest: in GitHub Actions CI mode cannot be switched off, and a baseline that forks at HEAD is refused
ok 17 - in GitHub Actions CI mode cannot be switched off, and a baseline that forks at HEAD is refused
  ---
  duration_ms: 418.970334
  type: 'test'
  ...
# Subtest: a configured baseline outside a Git work tree fails closed; a local run there only notes it
ok 18 - a configured baseline outside a Git work tree fails closed; a local run there only notes it
  ---
  duration_ms: 30.664833
  type: 'test'
  ...
# Subtest: a Git failure while reading a baseline throws and is never read as an absent file
ok 19 - a Git failure while reading a baseline throws and is never read as an absent file
  ---
  duration_ms: 820.403
  type: 'test'
  ...
# Subtest: a thresholds file, floor or domain package that is JSON null or any other non-object fails closed, before and after main anchors the floor
ok 20 - a thresholds file, floor or domain package that is JSON null or any other non-object fails closed, before and after main anchors the floor
  ---
  duration_ms: 6752.96725
  type: 'test'
  ...
# Subtest: the review's tolerant jest.config.cjs falls back to a narrow scope when the thresholds file is null or missing, and the guard refuses both, before and after main anchors the floor
ok 21 - the review's tolerant jest.config.cjs falls back to a narrow scope when the thresholds file is null or missing, and the guard refuses both, before and after main anchors the floor
  ---
  duration_ms: 1484.295084
  type: 'test'
  ...
# Subtest: a required file that exists but cannot be read stops the guard with its path, and is never read as missing
ok 22 - a required file that exists but cannot be read stops the guard with its path, and is never read as missing
  ---
  duration_ms: 197.956917
  type: 'test'
  ...
# Subtest: the guard command itself exits 1 and names the file for a null thresholds file under the tolerant config, and for an unreadable one
ok 23 - the guard command itself exits 1 and names the file for a null thresholds file under the tolerant config, and for an unreadable one
  ---
  duration_ms: 477.049042
  type: 'test'
  ...
# Subtest: a coverage-suppression comment in mobile or domain source fails the guard, before and after main anchors the floor
ok 24 - a coverage-suppression comment in mobile or domain source fails the guard, before and after main anchors the floor
  ---
  duration_ms: 888.74175
  type: 'test'
  ...
# Subtest: a baseline file that is JSON null fails closed, like one that is not JSON, and is never read as a baseline that predates it
ok 25 - a baseline file that is JSON null fails closed, like one that is not JSON, and is never read as a baseline that predates it
  ---
  duration_ms: 192.558292
  type: 'test'
  ...
# Subtest: a coverage include pattern outside the scanned src/ fails in the thresholds file and the floor, before and after main anchors the floor; widening inside src/ passes
ok 26 - a coverage include pattern outside the scanned src/ fails in the thresholds file and the floor, before and after main anchors the floor; widening inside src/ passes
  ---
  duration_ms: 3998.502292
  type: 'test'
  ...
# Subtest: the review's case: once main records an include outside src/, keeping it fails and dropping it fails, so a suppression comment there is never counted unseen
ok 27 - the review's case: once main records an include outside src/, keeping it fails and dropping it fails, so a suppression comment there is never counted unseen
  ---
  duration_ms: 530.036042
  type: 'test'
  ...
# Subtest: an unreadable mobile package.json stops the jest-key check itself, whatever order the checks run in
ok 28 - an unreadable mobile package.json stops the jest-key check itself, whatever order the checks run in
  ---
  duration_ms: 0.417625
  type: 'test'
  ...
# Subtest: the domain test loads its tests only through the reviewed loader flags, so nothing else transforms domain source before Node counts it
ok 29 - the domain test loads its tests only through the reviewed loader flags, so nothing else transforms domain source before Node counts it
  ---
  duration_ms: 544.125959
  type: 'test'
  ...
# Subtest: the guard refuses a Babel config, a changed ESLint config and an undescribed eslint-disable in the mobile package, before and after main anchors the floor
ok 30 - the guard refuses a Babel config, a changed ESLint config and an undescribed eslint-disable in the mobile package, before and after main anchors the floor
  ---
  duration_ms: 1254.675625
  type: 'test'
  ...
# Subtest: the guard refuses @ts-ignore, @ts-nocheck and an unexplained @ts-expect-error in mobile or domain source, before and after main anchors the floor
ok 31 - the guard refuses @ts-ignore, @ts-nocheck and an unexplained @ts-expect-error in mobile or domain source, before and after main anchors the floor
  ---
  duration_ms: 2193.290042
  type: 'test'
  ...
# Subtest: jest.config.cjs pins prettierPath to null, because the Prettier Jest 29 would load is 3 and it then refuses to write an inline snapshot
ok 32 - jest.config.cjs pins prettierPath to null, because the Prettier Jest 29 would load is 3 and it then refuses to write an inline snapshot
  ---
  duration_ms: 165.926583
  type: 'test'
  ...
# Subtest: the scanned trees are the mobile and domain sources whose coverage is enforced
ok 33 - the scanned trees are the mobile and domain sources whose coverage is enforced
  ---
  duration_ms: 3.548542
  type: 'test'
  ...
# Subtest: this repository carries no coverage-suppression comment, and the scan reads every file in both trees
ok 34 - this repository carries no coverage-suppression comment, and the scan reads every file in both trees
  ---
  duration_ms: 25.49775
  type: 'test'
  ...
# Subtest: each Istanbul, c8, V8 and Node coverage-suppression comment fails, in mobile and in domain source, with its file and line
ok 35 - each Istanbul, c8, V8 and Node coverage-suppression comment fails, in mobile and in domain source, with its file and line
  ---
  duration_ms: 201.147625
  type: 'test'
  ...
# Subtest: a comment split over lines, one in a test file, and every comment in a file are each reported, in file and line order
ok 36 - a comment split over lines, one in a test file, and every comment in a file are each reported, in file and line order
  ---
  duration_ms: 5.1205
  type: 'test'
  ...
# Subtest: prose that names a coverage tool, without a suppression comment, passes
ok 37 - prose that names a coverage tool, without a suppression comment, passes
  ---
  duration_ms: 3.816
  type: 'test'
  ...
# Subtest: a missing tree, a link, and a directory or file that cannot be read each fail closed
ok 38 - a missing tree, a link, and a directory or file that cannot be read each fail closed
  ---
  duration_ms: 17.997208
  type: 'test'
  ...
# Subtest: the threshold flags are read as written, and a flag that is not a number is kept as NaN
ok 39 - the threshold flags are read as written, and a flag that is not a number is kept as NaN
  ---
  duration_ms: 5.3665
  type: 'test'
  ...
# Subtest: the verdict compares unrounded: 106/117 meets 90.59 but not 90.60, and 272/313 meets 86.90 but not 86.91
ok 40 - the verdict compares unrounded: 106/117 meets 90.59 but not 90.60, and 272/313 meets 86.90 but not 86.91
  ---
  duration_ms: 0.482959
  type: 'test'
  ...
# Subtest: the comparison is exact in integers: 29/100 meets 29 although (29 / 100) × 100 is 28.999…, and 2 decimals is the limit
ok 41 - the comparison is exact in integers: 29/100 meets 29 although (29 / 100) × 100 is 28.999…, and 2 decimals is the limit
  ---
  duration_ms: 0.598125
  type: 'test'
  ...
# Subtest: missing counts or a threshold that is not a number fail closed
ok 42 - missing counts or a threshold that is not a number fail closed
  ---
  duration_ms: 0.391
  type: 'test'
  ...
# Subtest: a 2-decimal threshold that Node truncates still fails the run when it is not met, and passes at the exact boundary
ok 43 - a 2-decimal threshold that Node truncates still fails the run when it is not met, and passes at the exact boundary
  ---
  duration_ms: 493.150458
  type: 'test'
  ...
# Node 22.23.1 truncated --test-coverage-functions=50.01 (1/2)
# Subtest: a file the include globs match but no test loads fails the run, because Node would leave its lines out
ok 44 - a file the include globs match but no test loads fails the run, because Node would leave its lines out
  ---
  duration_ms: 343.355083
  type: 'test'
  ...
# Subtest: include globs the reporter cannot read, or thresholds without include globs, fail closed
ok 45 - include globs the reporter cannot read, or thresholds without include globs, fail closed
  ---
  duration_ms: 232.367416
  type: 'test'
  ...
# Subtest: thresholds without a coverage run fail instead of passing silently
ok 46 - thresholds without a coverage run fail instead of passing silently
  ---
  duration_ms: 97.145333
  type: 'test'
  ...
# Subtest: the wiring of this repository passes as reviewed
ok 47 - the wiring of this repository passes as reviewed
  ---
  duration_ms: 2.524625
  type: 'test'
  ...
# Subtest: root check, test, typecheck and lint are pinned, so lint, types and every guard copy keep running
ok 48 - root check, test, typecheck and lint are pinned, so lint, types and every guard copy keep running
  ---
  duration_ms: 1.908584
  type: 'test'
  ...
# Subtest: mobile lint, typecheck and test:ci and the domain typecheck are pinned
ok 49 - mobile lint, typecheck and test:ci and the domain typecheck are pinned
  ---
  duration_ms: 4.636417
  type: 'test'
  ...
# Subtest: no pre or post script may run around a gate script
ok 50 - no pre or post script may run around a gate script
  ---
  duration_ms: 0.672291
  type: 'test'
  ...
# Subtest: type checking stays strict and covers the same files
ok 51 - type checking stays strict and covers the same files
  ---
  duration_ms: 1.757458
  type: 'test'
  ...
# Subtest: the CI check job keeps the trusted baseline line, a one-line pnpm check step and no condition
ok 52 - the CI check job keeps the trusted baseline line, a one-line pnpm check step and no condition
  ---
  duration_ms: 3.187084
  type: 'test'
  ...
# Subtest: the workflow is read by YAML layout, not line by line: comments, blank lines and CRLF endings pass
ok 53 - the workflow is read by YAML layout, not line by line: comments, blank lines and CRLF endings pass
  ---
  duration_ms: 0.2675
  type: 'test'
  ...
# Subtest: a missing quality file fails, and every quality test file on disk is one of them
ok 54 - a missing quality file fails, and every quality test file on disk is one of them
  ---
  duration_ms: 0.738792
  type: 'test'
  ...
# Subtest: the mobile coverage run never uses watchman, so a .watchmanconfig cannot hide folders from the files Jest counts
ok 55 - the mobile coverage run never uses watchman, so a .watchmanconfig cannot hide folders from the files Jest counts
  ---
  duration_ms: 0.295292
  type: 'test'
  ...
# Subtest: this repository lints with the reviewed config, and the other files it lints hold no undescribed eslint-disable
ok 56 - this repository lints with the reviewed config, and the other files it lints hold no undescribed eslint-disable
  ---
  duration_ms: 27.131583
  type: 'test'
  ...
# Subtest: the folders the directive scan skips are exactly the global ignores of the reviewed config
ok 57 - the folders the directive scan skips are exactly the global ignores of the reviewed config
  ---
  duration_ms: 0.216083
  type: 'test'
  ...
# Subtest: narrowing or changing the reviewed ESLint config fails, and line endings or a final newline do not
ok 58 - narrowing or changing the reviewed ESLint config fails, and line endings or a final newline do not
  ---
  duration_ms: 8.535042
  type: 'test'
  ...
# Subtest: every other ESLint config source in the mobile package fails, nested or hidden, in any letter case
ok 59 - every other ESLint config source in the mobile package fails, nested or hidden, in any letter case
  ---
  duration_ms: 86.239541
  type: 'test'
  ...
# Subtest: an eslint-disable must name its rules and give a reason, and inline rule configuration fails, in comments and in strings
ok 60 - an eslint-disable must name its rules and give a reason, and inline rule configuration fails, in comments and in strings
  ---
  duration_ms: 182.46125
  type: 'test'
  ...
# Subtest: the scan reads every linted file, in path and line order, and skips ignored, generated and non-source files
ok 61 - the scan reads every linted file, in path and line order, and skips ignored, generated and non-source files
  ---
  duration_ms: 8.6615
  type: 'test'
  ...
# Subtest: a linted file or the config that cannot be read, or a config that is a link, fails closed
ok 62 - a linted file or the config that cannot be read, or a config that is a link, fails closed
  ---
  duration_ms: 4.374959
  type: 'test'
  ...
# Subtest: the installed ESLint ends a // comment at U+2028 and U+2029, so a blanket disable before one turns every rule off, and the scan refuses it
ok 63 - the installed ESLint ends a // comment at U+2028 and U+2029, so a blanket disable before one turns every rule off, and the scan refuses it
  ---
  duration_ms: 524.455958
  type: 'test'
  ...
# Subtest: a mobile package.json that is not JSON, not an object, not a regular file or unreadable fails closed, so its eslintConfig and eslintIgnore keys are never skipped
ok 64 - a mobile package.json that is not JSON, not an object, not a regular file or unreadable fails closed, so its eslintConfig and eslintIgnore keys are never skipped
  ---
  duration_ms: 25.19825
  type: 'test'
  ...
# Subtest: the fixture texts are what the installed Prettier says they are
ok 65 - the fixture texts are what the installed Prettier says they are
  ---
  duration_ms: 158.903042
  type: 'test'
  ...
# Subtest: the touched files are the tracked JavaScript and TypeScript files added, modified or renamed since the fork from main, committed or not
ok 66 - the touched files are the tracked JavaScript and TypeScript files added, modified or renamed since the fork from main, committed or not
  ---
  duration_ms: 699.977958
  type: 'test'
  ...
# Subtest: only touched files are checked: untouched, generated, vendored, untracked and main-only files stay unformatted and pass
ok 67 - only touched files are checked: untouched, generated, vendored, untracked and main-only files stay unformatted and pass
  ---
  duration_ms: 672.568417
  type: 'test'
  ...
# Subtest: an unformatted touched file fails by name, whether committed, renamed, staged or unstaged, and passes once Prettier formats it
ok 68 - an unformatted touched file fails by name, whether committed, renamed, staged or unstaged, and passes once Prettier formats it
  ---
  duration_ms: 1818.916416
  type: 'test'
  ...
# Subtest: a touched file Prettier cannot parse fails closed
ok 69 - a touched file Prettier cannot parse fails closed
  ---
  duration_ms: 951.262208
  type: 'test'
  ...
# Subtest: no Prettier config, ignore file, editorconfig, package.json key or pragma can weaken the check; the root config must stay the pinned options
ok 70 - no Prettier config, ignore file, editorconfig, package.json key or pragma can weaken the check; the root config must stay the pinned options
  ---
  duration_ms: 1389.433375
  type: 'test'
  ...
# Subtest: the installed Prettier and this repository pin the same exact version and options as the check
ok 71 - the installed Prettier and this repository pin the same exact version and options as the check
  ---
  duration_ms: 539.127208
  type: 'test'
  ...
# Subtest: the base is explicit and fails closed: CI needs the trusted baseline, locally main must exist, and no base means no check
ok 72 - the base is explicit and fails closed: CI needs the trusted baseline, locally main must exist, and no base means no check
  ---
  duration_ms: 1296.695917
  type: 'test'
  ...
# Subtest: the rule applies from the commit that adds it, so a base that predates it never asks for files earlier commits touched
ok 73 - the rule applies from the commit that adds it, so a base that predates it never asks for files earlier commits touched
  ---
  duration_ms: 2582.547292
  type: 'test'
  ...
# Subtest: a touched link or unmerged path fails closed and is never followed
ok 74 - a touched link or unmerged path fails closed and is never followed
  ---
  duration_ms: 781.097166
  type: 'test'
  ...
# Subtest: the command exits 0 when every touched file is formatted, and 1 naming each one that is not or when no base is found
ok 75 - the command exits 0 when every touched file is formatted, and 1 naming each one that is not or when no base is found
  ---
  duration_ms: 857.6275
  type: 'test'
  ...
# Subtest: a Git failure while finding the touched files throws, and is never read as nothing touched or as a base without the rule
ok 76 - a Git failure while finding the touched files throws, and is never read as nothing touched or as a base without the rule
  ---
  duration_ms: 448.9725
  type: 'test'
  ...
# Subtest: RULE is this module's own path in the repository and the path root check runs, so renaming or moving the check carries the rule start with it
ok 77 - RULE is this module's own path in the repository and the path root check runs, so renaming or moving the check carries the rule start with it
  ---
  duration_ms: 0.440541
  type: 'test'
  ...
# Subtest: a renamed check still finds its rule at the fork point, locally and in CI, so later changes stay checked (review finding 1)
ok 78 - a renamed check still finds its rule at the fork point, locally and in CI, so later changes stay checked (review finding 1)
  ---
  duration_ms: 715.71425
  type: 'test'
  ...
# Subtest: in CI the rule must have a start: a base without the check, and no commit after it adding the check, fails instead of checking nothing
ok 79 - in CI the rule must have a start: a base without the check, and no commit after it adding the check, fails instead of checking nothing
  ---
  duration_ms: 480.313917
  type: 'test'
  ...
# Subtest: locally, a committed check whose adding commit Git does not find fails closed, never falls back to uncommitted edits
ok 80 - locally, a committed check whose adding commit Git does not find fails closed, never falls back to uncommitted edits
  ---
  duration_ms: 593.46825
  type: 'test'
  ...
# Subtest: a pull request is checked as GitHub checks it out: a detached merge whose first parent is the baseline still starts the rule at the commit that adopts it (final review finding 2)
ok 81 - a pull request is checked as GitHub checks it out: a detached merge whose first parent is the baseline still starts the rule at the commit that adopts it (final review finding 2)
  ---
  duration_ms: 1334.564167
  type: 'test'
  ...
# Subtest: the mobile package of this repository holds no Babel configuration, and the inventory lists every entry outside node_modules
ok 82 - the mobile package of this repository holds no Babel configuration, and the inventory lists every entry outside node_modules
  ---
  duration_ms: 12.974583
  type: 'test'
  ...
# Subtest: every config name the installed jest-expo and @babel/core look for is refused, in any letter case
ok 83 - every config name the installed jest-expo and @babel/core look for is refused, in any letter case
  ---
  duration_ms: 4.422959
  type: 'test'
  ...
# Subtest: a Babel config file fails wherever it sits in the mobile package, hidden or nested, in any letter case
ok 84 - a Babel config file fails wherever it sits in the mobile package, hidden or nested, in any letter case
  ---
  duration_ms: 233.066542
  type: 'test'
  ...
# Subtest: a "babel" key in the mobile package.json fails, and so does any package.json nested in the mobile package
ok 85 - a "babel" key in the mobile package.json fails, and so does any package.json nested in the mobile package
  ---
  duration_ms: 17.883416
  type: 'test'
  ...
# Subtest: node_modules folders are skipped at any depth, as Babel and ESLint skip them, and generated folders are not
ok 86 - node_modules folders are skipped at any depth, as Babel and ESLint skip them, and generated folders are not
  ---
  duration_ms: 10.258167
  type: 'test'
  ...
# Subtest: a link, a folder that cannot be listed, a file that cannot be read and a missing package each fail closed
ok 87 - a link, a folder that cannot be listed, a file that cannot be read and a missing package each fail closed
  ---
  duration_ms: 13.504333
  type: 'test'
  ...
# Subtest: this repository holds no TypeScript suppression comment, and the scan reads every TypeScript file of both packages outside their installed node_modules
ok 88 - this repository holds no TypeScript suppression comment, and the scan reads every TypeScript file of both packages outside their installed node_modules
  ---
  duration_ms: 27.348667
  type: 'test'
  ...
# Subtest: the scanned packages are exactly the ones whose type checks pnpm check runs
ok 89 - the scanned packages are exactly the ones whose type checks pnpm check runs
  ---
  duration_ms: 0.111333
  type: 'test'
  ...
# Subtest: @ts-ignore and @ts-nocheck fail wherever they appear, in any letter case and in strings too, with file and line
ok 90 - @ts-ignore and @ts-nocheck fail wherever they appear, in any letter case and in strings too, with file and line
  ---
  duration_ms: 241.369042
  type: 'test'
  ...
# Subtest: @ts-expect-error needs a reason of at least three different words after it, on its own line and in the same comment
ok 91 - @ts-expect-error needs a reason of at least three different words after it, on its own line and in the same comment
  ---
  duration_ms: 125.193917
  type: 'test'
  ...
# Subtest: the scan reads every TypeScript file in both packages, hidden, generated or nested, and skips only each package's installed node_modules and files TypeScript does not check
ok 92 - the scan reads every TypeScript file in both packages, hidden, generated or nested, and skips only each package's installed node_modules and files TypeScript does not check
  ---
  duration_ms: 14.572709
  type: 'test'
  ...
# Subtest: a missing package, a link, a folder that cannot be listed and a file that cannot be read each fail closed
ok 93 - a missing package, a link, a folder that cannot be listed and a file that cannot be read each fail closed
  ---
  duration_ms: 14.130292
  type: 'test'
  ...
# Subtest: every one-character spelling the installed TypeScript reads as ts-nocheck is refused, the Kelvin sign among them
ok 94 - every one-character spelling the installed TypeScript reads as ts-nocheck is refused, the Kelvin sign among them
  ---
  duration_ms: 234.783958
  type: 'test'
  ...
# 10 spellings: @ts-noCheck @ts-nocheCk @ts-nochEck @ts-nocHeck @ts-nochecK @ts-Nocheck @ts-nOcheck @tS-nocheck @Ts-nocheck @ts-nochecU+212A
# Subtest: a declaration file under apps/mobile/src or packages/domain/src fails, by the names the installed TypeScript gives them, and one outside src/, such as a generated expo-env.d.ts, does not
ok 95 - a declaration file under apps/mobile/src or packages/domain/src fails, by the names the installed TypeScript gives them, and one outside src/, such as a generated expo-env.d.ts, does not
  ---
  duration_ms: 315.490208
  type: 'test'
  ...
# Subtest: a TypeScript file that starts with a UTF-16 byte-order mark fails before it is decoded, since the installed TypeScript reads it as UTF-16 and this scan reads UTF-8
ok 96 - a TypeScript file that starts with a UTF-16 byte-order mark fails before it is decoded, since the installed TypeScript reads it as UTF-16 and this scan reads UTF-8
  ---
  duration_ms: 22.015958
  type: 'test'
  ...
# Subtest: a JavaScript file under apps/mobile/src or packages/domain/src fails, since TypeScript does not type-check it and coverage does not count it, and one outside src/ does not
ok 97 - a JavaScript file under apps/mobile/src or packages/domain/src fails, since TypeScript does not type-check it and coverage does not count it, and one outside src/ does not
  ---
  duration_ms: 875.925334
  type: 'test'
  ...
1..97
# tests 97
# suites 0
# pass 97
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 36073.412833
Coverage ratchet verified. Mobile (apps/mobile/coverage-thresholds.json): statements 12.23, branches 10.57, functions 10.23, lines 18.67. Domain (packages/domain/package.json test): lines 91.42, branches 86.9, functions 90.59. Nothing is below the floor or 1 Git baseline(s). No @ts-ignore, @ts-nocheck or @ts-expect-error without a reason is in the 142 TypeScript files under apps/mobile and packages/domain. No Babel configuration is among the 207 entries under apps/mobile, apps/mobile/eslint.config.js is as reviewed, and the 131 other files it lints hold no eslint-disable without rules and a reason, and no inline rule configuration. No coverage-suppression comment is in the 141 files under apps/mobile/src and packages/domain/src.
  HEAD@961e1f41104e: checked; records the floor, mobile thresholds, domain thresholds
  main@961e1f41104e: same commit as an earlier baseline
PASS src/lib/__tests__/auth-callback.test.ts
PASS src/data/__tests__/member-store.test.ts
PASS src/theme/__tests__/theme.test.ts
PASS src/theme/__tests__/preference-store.test.ts
PASS src/ui/__tests__/appearance.test.tsx
PASS src/data/__tests__/gym-outbox.test.ts
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
Time:        6.267 s
Ran all test suites.

> fitlog@ plan:test /private/var/folders/0s/4k0smcx56zl9hdj404qnz2s80000gp/T/fitlog-qa9-floor.dGGhev2tS6/clone
> node --test scripts/plan/lib.test.mjs

TAP version 13
# Subtest: generated plan and board drift is rejected without executing embedded JavaScript
ok 1 - generated plan and board drift is rejected without executing embedded JavaScript
  ---
  duration_ms: 1.05275
  type: 'test'
  ...
# Subtest: parses goals, fields, wrapped needs and anchors
ok 2 - parses goals, fields, wrapped needs and anchors
  ---
  duration_ms: 1.385375
  type: 'test'
  ...
# Subtest: malformed cards fail loudly instead of losing data
ok 3 - malformed cards fail loudly instead of losing data
  ---
  duration_ms: 0.666917
  type: 'test'
  ...
# Subtest: rejects unknown needs and cycles
ok 4 - rejects unknown needs and cycles
  ---
  duration_ms: 0.113375
  type: 'test'
  ...
# Subtest: ready and blocked are derived from needs
ok 5 - ready and blocked are derived from needs
  ---
  duration_ms: 30.306625
  type: 'test'
  ...
# Subtest: claiming a blocked goal needs force, from any earlier status
ok 6 - claiming a blocked goal needs force, from any earlier status
  ---
  duration_ms: 40.217291
  type: 'test'
  ...
# Subtest: writes keep earlier fields and record the true previous status in the feed
ok 7 - writes keep earlier fields and record the true previous status in the feed
  ---
  duration_ms: 45.296
  type: 'test'
  ...
# Subtest: status words and aliases normalise; junk and prototype keys are refused
ok 8 - status words and aliases normalise; junk and prototype keys are refused
  ---
  duration_ms: 0.11625
  type: 'test'
  ...
# Subtest: rejects unknown goals and non-text fields
ok 9 - rejects unknown goals and non-text fields
  ---
  duration_ms: 8.2485
  type: 'test'
  ...
# Subtest: a damaged status file shape still loads as empty goals
ok 10 - a damaged status file shape still loads as empty goals
  ---
  duration_ms: 24.119583
  type: 'test'
  ...
# Subtest: concurrent writers from separate processes lose nothing
ok 11 - concurrent writers from separate processes lose nothing
  ---
  duration_ms: 312.565041
  type: 'test'
  ...
# Subtest: Done-when and Exit-check boxes belong to their card; prose and code boxes do not
ok 12 - Done-when and Exit-check boxes belong to their card; prose and code boxes do not
  ---
  duration_ms: 0.550958
  type: 'test'
  ...
# Subtest: every goal must carry a contract
ok 13 - every goal must carry a contract
  ---
  duration_ms: 0.178
  type: 'test'
  ...
# Subtest: ancestors follow needs transitively
ok 14 - ancestors follow needs transitively
  ---
  duration_ms: 0.084416
  type: 'test'
  ...
# Subtest: the ledger parses rows and their proving goals
ok 15 - the ledger parses rows and their proving goals
  ---
  duration_ms: 0.164667
  type: 'test'
  ...
# Subtest: the PRD's acceptance and decision ids are read from their tables
ok 16 - the PRD's acceptance and decision ids are read from their tables
  ---
  duration_ms: 0.097625
  type: 'test'
  ...
# Subtest: a complete ledger passes the coverage check
ok 17 - a complete ledger passes the coverage check
  ---
  duration_ms: 0.270667
  type: 'test'
  ...
# Subtest: the coverage check names every gap
ok 18 - the coverage check names every gap
  ---
  duration_ms: 0.363
  type: 'test'
  ...
# Subtest: a gate must actually wait on a goal that proves the row
ok 19 - a gate must actually wait on a goal that proves the row
  ---
  duration_ms: 0.064542
  type: 'test'
  ...
# Subtest: Done is refused while a need is open, unless overridden with a reason
ok 20 - Done is refused while a need is open, unless overridden with a reason
  ---
  duration_ms: 25.444333
  type: 'test'
  ...
# Subtest: a milestone is declared only when its needs are Done and its ledger rows pass
ok 21 - a milestone is declared only when its needs are Done and its ledger rows pass
  ---
  duration_ms: 56.052958
  type: 'test'
  ...
# Subtest: the gate report says whether a milestone can be declared and why not
ok 22 - the gate report says whether a milestone can be declared and why not
  ---
  duration_ms: 7.921333
  type: 'test'
  ...
1..22
# tests 22
# suites 0
# pass 22
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 592.821292

> fitlog@ plan:build /private/var/folders/0s/4k0smcx56zl9hdj404qnz2s80000gp/T/fitlog-qa9-floor.dGGhev2tS6/clone
> node scripts/plan/build.mjs --check

GOALS.md: 114 goals, 230 needs, 10 lanes; ACCEPTANCE.md: 94 ledger rows, every PRD scenario and decision covered
plan.json and board.html match GOALS.md

[exited with code 0]
```

Run 37, while the gate ran, read-only: `rtk proxy git -C /Users/Adya/.codex/worktrees/fitlog-qa9/fitness_app rev-parse main`: `c8a5d57c3a0999760ad21fd1aca4899ca76b5adf`. Run 38, `date -u` after the completion notice: `2026-10-27T04:41:42Z`.

## Against the brief's expectations

| Expected | Measured | Met |
|---|---|---|
| `pnpm check` passes, once | Exit 0, one run, no retry | Yes |
| 285 tests | 40 domain + 97 quality + 126 Jest + 22 plan = **285**, all passing, none skipped | Yes |
| 0 format files | **0**, `Base: main@961e1f41104e`, no `from` clause, "No other tracked path was touched." | Yes |
| Domain branches ≥ 272/313 | **273/313** (87.2204%) | Yes |
| Domain lines ≥ 533/583 | **535/583** (91.7667%) | Yes |
| Domain functions ≥ 106/117 | **106/117** (90.5983%) | Yes |
| Floor bytes equal | Same sha256 and blob in this worktree, the clone's working tree and the clone's `HEAD` and `main` (runs 6, 23–26, 41). Values equal §5, and scope equals §1 | Yes |
| The floor anchored at `HEAD` = `main` | The guard printed **no** "the floor is not anchored yet" line, in all three of its runs, and counted **1** Git baseline: `main@961e1f41104e: same commit as an earlier baseline`. Phase 3H, with `main` behind, printed the line and counted 2 | Yes |

**R19's `HEAD` = `main` state, measured for the first time:** 273/313, the same as with `HEAD` ahead of `main` (phases 3E to 3H). The domain contract test printed `HEAD@961e1f41104e: checked` and `main@961e1f41104e: same commit as an earlier baseline`.

**R3 sample:** the domain uncovered-lines column is identical to phase 3H's run 30. `dates.ts:19` and `finance.ts:14` are uncovered, and the total is 535 lines, two above the 533 the threshold needs.

**Mobile:** 254/2076, 164/1551, 84/821 and 191/1023, the same counts as phase 3H.

## Runs 39–44: after the gate

Run 39, `rtk proxy git -C <root>/clone status --porcelain=v1 -b -uall`: `## main` only. The gate changed no tracked file. Run 40, `rtk proxy git -C <root>/clone rev-parse HEAD main`: `961e1f41104e414f045d5a9a42e8e9ca44acf083` twice.

Run 41, `rtk proxy sha256sum` of the raw output, the clone's floor and the clone's lockfile:

```text
6dc7f0ba16205dd6b070132630f57ab6b628dd40fa9b1d5cac5749005f6add2c  /private/tmp/claude-502/-Users-Adya--codex-worktrees-fitlog-qa9-fitness-app/62ebc6ab-7078-4826-9214-f1871d560324/tasks/b2ytqnhul.output
f0d4017c37f5bbd9ecba809d628f96f7bf12db7f0796e01329c2c0c16d646a4b  /var/folders/0s/4k0smcx56zl9hdj404qnz2s80000gp/T/fitlog-qa9-floor.dGGhev2tS6/clone/scripts/quality/coverage-floor.json
8aaac7f03b9aa141d8a0d4b9a91006799bb256d05051e26d81caee52ce0ea2b7  /var/folders/0s/4k0smcx56zl9hdj404qnz2s80000gp/T/fitlog-qa9-floor.dGGhev2tS6/clone/pnpm-lock.yaml
```

Run 42, `rtk proxy git -C /Users/Adya/.codex/worktrees/fitlog-qa9/fitness_app rev-parse HEAD main`: `961e1f4…` and `c8a5d57…`, unchanged. Run 43, `rtk proxy git -C /Users/Adya/.codex/worktrees/fitlog-qa9/fitness_app status --porcelain=v1 -b -uall`: the same four paths as run 2, before any record was written.

Run 44, a read-only count of the raw output with `rtk proxy node -e`:

```text
{"bytes":44207,"lines":890,"endsWithNewline":true,"trailingSpaceLines":[97,99,101,105,108],"tabs":0,"cr":false}
```

`lines` counts the empty string after the final newline, so the output has 889 lines.

**Why 207 entries, not phase 3H's 210.** The guard's inventory lists every entry under `apps/mobile` outside `node_modules`. A Glob shows `apps/mobile/coverage/coverage-summary.json` and `coverage.txt` in this worktree, left by earlier runs: the folder and its two files are 3 entries. The fresh clone gained them only when Jest ran, after all three guard runs. A Glob of the clone after the gate shows the same two files.

## Differences from CI and from phase 3I's plan

- **`--ignore-scripts`** on the install, as Codex chose. CI's install runs the allowed builds. This run shows that `pnpm check` needs none of the three skipped builds (`supabase`, `esbuild`, `unrs-resolver`). It doesn't show that for `backend:test` or the exports.
- **Local mode.** No `GITHUB_ACTIONS` and no `FITLOG_CONTRACT_BASELINE`, so the baselines are `HEAD` and `main`. The CI-mode imitation stays deferred.
- **No `TMPDIR` change.** The allowlist has only the exact `pnpm check` form, so the gate ran with the session's default `TMPDIR`, the per-user `/var/folders/0s/4k0smcx56zl9hdj404qnz2s80000gp/T/`. The quality tests' scratch repositories, and any tool cache such as Jest's, went there, outside `<root>` but inside this user's temporary folder. Whether the tests removed their own folders afterwards wasn't checked. This phase deleted nothing.
- **pnpm's store.** The install reused pnpm's local store. Whether pnpm wrote any metadata to the store wasn't observed.
- **This is a simulation of `HEAD` = `main` at the same commit, not integration.** This repository's `main` is still `c8a5d57`, and the real anchoring happens only when `main` takes the QA-9 commits.

## The disposable folder now

Kept, with nothing deleted, as the brief requires. It holds `clone/` (the clone, its `node_modules` and the files the gate wrote, such as `apps/mobile/coverage/`), and `empty-hooks/` and `empty-template/`, both still empty (run 17; no later write went there).

## What this proves, and what it doesn't

**Proves (implementer runs):** at `961e1f4`, with `HEAD` = `main`, in a fresh local clone with a fresh offline install, `pnpm check` passes once with 285 tests. The format step selects 0 files. The guard treats the floor as anchored. Domain coverage is 535/583, 273/313 and 106/117. The floor file is byte-identical to the one inspected at `961e1f4`, and its values equal §5.

**Doesn't prove:**
- that this repository's `main` holds the floor. Only integration does that;
- CI mode, or box 3's hosted run, which needs the owner's specific approval to push;
- `pnpm backend:test` or the exports. The exports are inherited from the 0405 review on `c84bb4c`;
- an independent reproduction. A fresh independent review follows, by the brief.
