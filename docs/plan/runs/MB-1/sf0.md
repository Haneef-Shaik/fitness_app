# MB-1 SF-0: the behaviour-preserving split of the replay runner and its tests (pure code, no live run)

Attempt 1 · branch `codex/mb1-identity` · base local `main` `2a95726` · uncommitted working tree · 27 October 2026.
Codex AUTH-01 (owner delegation), one bounded phase: **SF-0 only**, the first reviewed checkpoint of SF-α
([`final-2026-10-27T0405Z.md`](../../../evidence/MB-1/final-2026-10-27T0405Z.md), "Proposed phase (SF-α)" item 1).
**Nothing is Done and no Done-when box is met.** Box 3, B1, B2, §5–§7 and the shared apply stay open. The split fixes no
finding: review 0405Z's medium (finding 1) and its four lows are unchanged in code (§8).

## 1. Scope, and what did not run

- **Done:** the 798-line runner `scripts/backend/mb1-replay.mjs` and its 2,210-line test file split by their own seams into
  files under 400 lines, with a test harness that is not itself a test file; the 282 pure tests run once before and once
  after, with their names compared; the 11 phase 1I mutation patches regenerated for the new layout, each checked with
  `git apply --check` and each killed by named tests on the pure harness; `node --check` on every MB-1 file; hashes before
  and after.
- **Not run, by the brief:** the runner (no command of it), the replay directory `/tmp/fitlog-mb1-replay-20261026` (not
  read, listed or written), the Supabase CLI, Docker, any database or network call, SQL, migrations, contracts, the root
  package, status, the ledger, `main`, commits, staging and subagents. 55321 got nothing.
- **Policy restated:** PRD §16.1 and frozen 003 override any stale agent text: gym staff never read or write private health
  data, whatever the consent. SF-0 moves code only and opens no data path.

## 2. The new layout

The runner's command line (`node scripts/backend/mb1-replay.mjs <command> /tmp/fitlog-mb1-replay-YYYYMMDD …`), the module's
exports (`runReplay` declared there; `SUPABASE_CLI`, `CHILD_ENV`, `SUPABASE`, `childEnv` and `runCommand` re-exported) and
`readState` (moved verbatim, so today's `state.json` reads the same) are unchanged. Every function body moved verbatim. Each new
file adds only a two-line role comment, its import lines (the entry also its two re-export lines), a blank line, and, where a
sibling imports from it, one `export { … }` block. Modules import only from modules earlier in this order, so there is no cycle.

**Runner** (`scripts/backend/`; original line ranges → new lines):

| File | Lines | Holds | Original lines → new lines |
|---|---|---|---|
| `mb1-replay-exec.mjs` | 74 | executor: `runCommand`, timeouts, `CHILD_ENV`, `childEnv` | 59-62 → 5-8; 66-67 → 9-10; 81-85 → 11-15; 102-158 → 16-72 |
| `mb1-replay-live.mjs` | 140 | Supabase command table, SUPABASE_* and .env refusals, status, docker ps, 55321 config binding, shared fingerprint | 63-65 → 9-11; 68-78 → 12-22; 80 → 23; 86-101 → 24-39; 159-254 → 40-135 |
| `mb1-replay-sql.mjs` | 87 | pinned SQL, read-only snapshot, kept SQL, repository cross-check, `ending`, `reason` | 256-326 → 11-81; 412-415 → 82-85 |
| `mb1-replay-commands.mjs` | 234 | replay commands, `replayGuards`, `stopAfter`, `pinnedCandidate` | 79 → 17; 255 → 18; 327-411 → 19-103; 416-540 → 104-228; 664-667 → 229-232 |
| `mb1-replay-shared.mjs` | 138 | `shared-snapshot`, `shared-apply` and its guards, `shared-suite` | 541-663 → 14-136 |
| `mb1-replay.mjs` (entry) | 191 | header comment, `USAGE`, `OPS`, `parseArgs`, `readState`, `dispatch`, the lock, `runReplay` | 17-58 → 19-60; 668-798 → 61-191 |

Original lines 1-16 (the import block and its blank line) are replaced by each file's own imports. Reviews that cite the old
runner by line translate with this table. Examples: `sharedRunning` 234 → `live:115`; `sharedFingerprint` 242 → `live:123`;
`stagedRunning` 588 → `shared:61`; `recordApplyAttempt(ctx)` 630 → `shared:103`; the state write 745 → `mb1-replay.mjs:138`;
`readState` 709-714 → `mb1-replay.mjs:102-107`; the function `releaseHeld` 752-761 → `mb1-replay.mjs:145-154`, and its call
with the lock problem 779-788 → `:172-181` (corrected by SF-7, review 2026-10-27T0605Z L3: this line used to give `:172-181`
for `releaseHeld` itself); the suite entry 497-498 → `commands:185-186`. These are SF-0's lines; SF-7 moved some
([sf7.md](sf7.md) §2).

**Tests** (`scripts/backend/`):

| File | Lines | Holds | Original lines → new lines |
|---|---|---|---|
| `mb1-replay-test-harness.mjs` | 321 | the shared harness; **not a test file** (no `node --test` pattern matches it) | 15-310 → 14-309; 569-570 (`escapeRe`, `envRefusal`) → 310-311; 1112 (`ATTEMPTED`) → 312; 1266 (`M2_STOP`) → 313; 1558 (`ISO`) → 314 |
| `mb1-replay.test.mjs` | 119 | the executor (review a102fb68 finding 5) | 312-418 → 13-119 |
| `mb1-replay-guards.test.mjs` | 277 | the target, the owned directory, the guards before every command | 420-568 → 15-163; 571-684 → 164-277 |
| `mb1-replay-plan.test.mjs` | 311 | migration list (F5), shared stack, CLI verification, read-only SQL, plan order, 55321 gate | 686-982 → 15-311 |
| `mb1-replay-phase1f.test.mjs` | 288 | review 19eea0f3 findings 1–2, pinned candidate, spacing, verdicts, F6 | 984-1111 → 15-142; 1113-1258 → 143-288 |
| `mb1-replay-phase1g.test.mjs` | 305 | review bbe2fbba findings 1, 2 and 4 | 1260-1265 → 16-21; 1267-1550 → 22-305 |
| `mb1-replay-m2-stop.test.mjs` | 162 | the M2 stop (2000Z finding 1, 2305Z finding 1) | 1552-1557 → 13-18; 1559-1702 → 19-162 |
| `mb1-replay-rechecks.test.mjs` | 338 | the rechecks around a CLI (2000Z finding 2, 2305Z finding 4) and the drift helpers only they use | 1704-2030 → 12-338 |
| `mb1-replay-lifecycle.test.mjs` | 192 | real suite under Ctrl-C, the lock, teardown | 2032-2210 → 14-192 |

Original lines 1-14 are the replaced import block. The 8 blank lines between sections at a file's edge (311, 419, 685, 983,
1259, 1551, 1703, 2031) are dropped. Five constants moved to the harness because more than one test file uses them, and a test
file is never imported (that would register its tests twice): `escapeRe`, `envRefusal`, `ATTEMPTED`, `M2_STOP`, `ISO`. No
test mutates a shared fixture (Grep over every assignment to a top-level fixture), and the one global override (`fetch`) is
restored per test, so moving tests into separate files and processes changes no coupling.

## 3. The no-behaviour-change proof (textual; not a live-safety proof)

**Method.** Each new file was compared with the intact original by `rtk proxy git diff --no-index --numstat <original> <new>`
**before** either original was overwritten. A moved line that is verbatim and in order aligns with its original, so the only
lines the diff can add are wiring lines that occur nowhere in the original. Each expected count below was worked out before the
command ran (role comment lines, plus import, re-export and export lines that differ from every original line). Every count
matched, so every moved line is byte-identical to its original line:

| New file (vs original) | Added: expected = observed | Deleted | Moved lines |
|---|---|---|---|
| `mb1-replay-exec.mjs` (vs runner) | 3 | 727 | 68 |
| `mb1-replay-live.mjs` | 11 | 669 | 127 |
| `mb1-replay-sql.mjs` | 7 | 718 | 75 |
| `mb1-replay-commands.mjs` | 11 | 575 | 216 |
| `mb1-replay-shared.mjs` | 12 | 672 | 123 |
| `mb1-replay.mjs` (scratch copy first) | 13 | 620 | 173 |
| `mb1-replay-test-harness.mjs` (vs test file) | 13 | 1902 | 301 |
| `mb1-replay.test.mjs` (scratch copy first) | 6 | 2097 | 107 |
| `mb1-replay-guards.test.mjs` | 9 | 1942 | 263 |
| `mb1-replay-plan.test.mjs` | 10 | 1909 | 297 |
| `mb1-replay-phase1f.test.mjs` | 10 | 1932 | 274 |
| `mb1-replay-phase1g.test.mjs` | 11 | 1916 | 290 |
| `mb1-replay-m2-stop.test.mjs` | 9 | 2057 | 150 |
| `mb1-replay-rechecks.test.mjs` | 7 | 1879 | 327 |
| `mb1-replay-lifecycle.test.mjs` | 9 | 2027 | 179 |

- **The two files written in place** (`mb1-replay.mjs`, `mb1-replay.test.mjs`) were first written to the scratch folder
  `/tmp/fitlog-mb1-sf0/` and compared there with the original (rows above). Then the same text was written in place, and
  `git diff --no-index --numstat` between the scratch copy and the file printed nothing.
- **Every line is accounted for:** runner 16 import-block lines + 782 moved = 798; tests 14 + 2188 moved + 8 dropped blanks =
  2210.
- **Imports, cross-checked:** for each new file, a Grep for every top-level name of the original's scope that the file neither
  declares nor imports found only comments, strings, regex literals, object keys and locals. No import is missing (plus the
  test run). `node --check` passes on all 22 MB-1 files.
- **Residual, stated:** the files were transcribed by hand. A line replaced by a verbatim copy of another *skipped* original
  line at a piece boundary would keep the counts. That is not a plausible error, and the 282 names, the passes and the
  mutation counts (§5) all agree. A byte-for-byte check exists but was not run:
  [`docs/evidence/MB-1/sf0/sf0-split.mjs`](../../../evidence/MB-1/sf0/sf0-split.mjs) `verify` rebuilds both originals
  from the split files alone and requires their sha256 pins (`fd76c04b…3334`, `9c18e423…5021`). It passes `node --check`;
  **running it was denied** here (§9).

## 4. Tests

**Inputs inventoried first** (sha256 in §6). `scripts/backend/*.test.mjs` matched **7 files** before: `check-sql-sources`,
`mb1-replay-evidence`, `mb1-replay`, `mb1-replay-order`, `verify-contracts`, `verify-fixtures`, `verify-identity`. It matches
**14** after (corrected by SF-7 from 15, review 2026-10-27T0605Z L3): the same six plus the eight split runner test files,
with `mb1-replay.test.mjs` now holding the executor tests. All are pure: they use injected doubles, temporary sandboxes, local `node` child scripts and, in `check-sql-sources`,
git in scratch repositories. None reaches Docker, Supabase, a database or the network.

**The 282, by file:** the runner's tests 193 (44 top-level + 149 subtests), evidence 32, order 4 (these three: **229**),
`verify-identity` 14 (with the 229: the coordinator's **243**), `check-sql-sources` 18, `verify-contracts` 13,
`verify-fixtures` 8 (39 more: **282**).

| Run (once each) | Command | Result |
|---|---|---|
| Baseline, before any edit | `rtk proxy node --test scripts/backend/*.test.mjs` | `1..133`, `# tests 282`, `# pass 282`, `# fail 0`, `# cancelled 0`, `# skipped 0`, `# todo 0`, `# duration_ms 12600.237916`; no `not ok` line |
| Split, after the last edit to code | the same | `1..133`, `# tests 282`, `# pass 282`, `# fail 0`, `# cancelled 0`, `# skipped 0`, `# todo 0`, `# duration_ms 7676.885625`; no `not ok` line |

Node here is **v22.23.1** (`rtk proxy node --version`); the coordinator's 243 ran on 26.7.0.

**Test names compared:** both TAP outputs have exactly 133 top-level `# Subtest:` lines and 149 at depth 1, and none deeper.
- **Top level, a multiset match:** the first 50 names (`check-sql-sources` 18, evidence 32) and the last 35 (`verify-contracts`,
  `verify-fixtures`, `verify-identity`) are the same sequence. The order file's 4 names are the same. The old runner file's
  44 appear in the split run as eight blocks (guards 9, lifecycle 5, M2 stop 3, phase 1F 7, phase 1G 6, plan 7, rechecks 4,
  executor 3), each in its original order.
- **Depth 1, the same sequence:** all 149 subtests belong to the M2-stop and recheck tests, whose relative order is unchanged.

**How the comparison was made:** with the Grep tool on the two TAP outputs that the tool runner saved. These are
`~/.claude/projects/…/tool-results/brenzaz6i.txt` (before) and `…/blsq8j9j6.txt` (after); they are scratch files, not evidence.
A sorted machine diff was not possible: `rtk proxy sort` was denied, and the verifier's `names` mode could not run (§9).

## 5. Guard mutations, regenerated and killed (pure harness only)

**Before the split**, all 11 phase 1I patches passed `rtk proxy git apply --check -v` against the original layout. That
closes phase1i.md §8.8 for those patches, which are unchanged. **For the new layout** the patches are in
[`docs/evidence/MB-1/sf0-mutations/`](../../../evidence/MB-1/sf0-mutations/). Each has the same changed lines as its
phase 1I patch and new paths and hunk lines; B2, V and W target files SF-0 did not touch, so their diffs are identical. All
11 pass `git apply --check -v` with no offset.

**How each was run:**
1. The mutation was applied by one exact Edit equal to the patch's changed lines, as in phase 1I. `git apply -R --check` was
   denied, so it is not shown that way.
2. `rtk proxy node --test --test-reporter=spec --test-reporter-destination=/tmp/fitlog-mb1-sf0/mut-<id>.txt
   scripts/backend/mb1-replay*.test.mjs` ran: the 10 MB-1 test files, 229 tests, scratch reports.
3. The Edit was reversed.
4. The forward `git apply --check -v` passed again, and `sha256sum` showed the restore hash.

**Every result equals phase1i.md §5.4, test for test:**

| Id | File @ new hunk (phase 1I line) | Pass / 229 | Fail | Killed by (file: test) |
|---|---|---|---|---|
| B2 | `mb1-replay-evidence.mjs` @289 (289) | 224 | 5 | `mb1-replay-evidence.test.mjs:337` (bbe2fbba F2, the flipped partial run) and `:452` (2305Z F1); `mb1-replay-m2-stop.test.mjs:114` (2305Z F1: both STOP subtests at `:116`, and the parent) |
| P | `mb1-replay-commands.mjs` @118 (430) | 210 | 19 | `mb1-replay-rechecks.test.mjs`, 2000Z F2 after migrate: 16 exit-1/timeout drift subtests, both "nothing changed", the parent. The 8 exit-0 cases pass, as in phase 1I |
| Q | commands @90 (398) | 219 | 10 | rechecks, 2305Z F4 before the CLI: 8 "before migrations", the clean run, the parent |
| R | commands @127 (439) | 155 | 74 | rechecks: 16 "before diff/lint", both clean runs, all 54 post-diff/lint subtests, both parents |
| S | commands @129 (441) | 174 | 55 | rechecks, 2305Z F4 after diff/lint: 48 drift subtests, 6 "nothing changed", the parent |
| U | commands @129 (441) | 192 | 37 | rechecks: 32 exit-1/timeout drift subtests, 4 matching "nothing changed", the parent; exit 0 passes |
| T | commands @186 (498) | 210 | 19 | rechecks: 8 "before stop", 8 "before teardown", both clean runs, the parent |
| X | commands @72 (380) | 154 | 75 | rechecks: 24 post-migrate drift subtests, "cleared by hand", 48 post-diff/lint drift subtests, both parents |
| V | `mb1-replay-order.mjs` @29 (29) | 179 | 50 | `mb1-replay-order.test.mjs:98` (2305Z F4); rechecks: 48 post-diff/lint drift subtests and the parent |
| W | order @29 (29) | 228 | 1 | `mb1-replay-order.test.mjs:98`, at `["diff"]` |
| M2 | commands @62 (370) | 193 | 36 | rechecks: the 32 `.env` subtests in 16 contexts and 4 parents |

**Restores (executed):**
- `mb1-replay-commands.mjs` `967a6fcc…c99c`, `mb1-replay-evidence.mjs` `6d52d70c…bb89` and `mb1-replay-order.mjs`
  `fb6edb39…3b37` after every restore.
- All three re-hashed equal after the last one.

B2 ran twice under the same mutation. Its first run (plain TAP to stdout) failed as expected, but the tool cut a failing run's
output in the middle instead of saving it. So B2 was rerun with the spec report file, which every later mutation used.

## 6. Hashes (`rtk proxy sha256sum`, executed)

**Before any edit** (all 23 files of `scripts/backend/`; the nine MB-1 pins equal handoff.md's table):

| sha256 | File |
|---|---|
| `fd76c04b0fa656d811831c6b103ef652313e281d77a648e23a0b368b73e83334` | `mb1-replay.mjs` (original) |
| `9c18e4238f36275e1a24ba740fe9fc034f703fe220717e37ec1698d13f55e81c` | `mb1-replay.test.mjs` (original) |
| `6d52d70ce4c059ce89e32efa5d0d6162b9b59f2cf0c106ba3195bac6f681bb89` | `mb1-replay-evidence.mjs` |
| `89421648df0583a9cc1c811c7afc9c7003c023eb27cc908ce1c6c77a87918583` | `mb1-replay-evidence.test.mjs` |
| `fb6edb395cfe01edfc99e4ef70c8bcdfc6d6d206af0f0963aee4c42d248c3b37` | `mb1-replay-order.mjs` |
| `95fdb69a52161801dc8e672a83ad60b42294882d138cefcce7b59e9126f89ad7` | `mb1-replay-order.test.mjs` |
| `42219dee18756927f32ca7aec1c8a6c5139499097c81bc1be5d5a52370f9eb5c` | `mb1-replay-target.mjs` |
| `944ba934a93a369cf6382ddea79620cdf35215d218dc1fde9eea634cc1bcdf81` | `verify-identity.mjs` |
| `902bb69924b929ac0b06c8fc44e3102318cf6f5fc06c212ccd3d51ce45521021` | `verify-identity.test.mjs` |
| `1c9090b8c3cce85006f1d930e0abb0b4c89d4285b72ed60deb60cdb208d44d99` | `check-sql-sources.mjs` |
| `7f223d70db59e957377d3ea0d6018c8cc520c9f0d3291bdb63cb7c236d7df212` | `check-sql-sources.test.mjs` |
| `792b8bf8335edf6d77862ee523eed01096df3056d7c5ba597e00673e145e2bc8` | `environment.mjs` |
| `6e50c94d77105b17f1831ffc591f936b955cfdf659f3722a7f522bce0d8b2a7b` | `local-stack.mjs` |
| `39c8d1bef1c10fc0e0db39fa5f4e341c866b4fe2f72db2c543b02c916230e1a8` | `preview-account.mjs` |
| `bc028a412205baab81e103bdb1163038e97ffdfdda8f69a417e7451083793ef6` | `seed-development.mjs` |
| `e03f9d4fb144311cfd47169b15b3ab3c91c28731c3a244d24e671b77f4aaa937` | `verify-contracts.mjs` |
| `2550cc0088c0f3cc2201ddff144bdd924cc436de9976e614168e815f8f27d03e` | `verify-contracts.test.mjs` |
| `c1db87e29f1ef71dd210a2486b3f0018f3aab138344dac00d4673388c9980209` | `verify-fixtures.mjs` |
| `ef55cebe4ebb2ee4cf8c9166c2fb52d3ba33cb6085092f5140aa0f79aaad642b` | `verify-fixtures.test.mjs` |
| `f5dfb9b5de794d96158b5e55cfac0eb94b05e4069e64ef4db36b2bc9bbfd849e` | `verify-freeze-projection.mjs` |
| `71dde87795a5904e4b8a1d7f68ded6578d75886cab9696f1e5133d7ab02a0401` | `verify-freezes.mjs` |
| `9205b7777e066e65ca77cb4394bd8371a162a0c75aad78d1c94db85d3d7b31ed` | `verify-gym.mjs` |
| `b3dcb634c989275cb33eae4e9f9b32152d26cd52e2132ff517ca5ce6320d2f05` | `verify.mjs` |

**After** (the 15 new or rewritten files; the seven other MB-1 files above re-hashed equal):

| sha256 | File |
|---|---|
| `7d76187ee71538bf2f512166c85a09e8d962040fcbccecdbca583455bd1f34a4` | `mb1-replay.mjs` (entry) |
| `a8181695ca5c96ce3b1febc999dee0c83d00b876b6b433f26cd86f781b38da20` | `mb1-replay-exec.mjs` |
| `daa1029106e9c997ddcb94de4d0acced60ea2193efa8d977624b0cc0c7fe8b82` | `mb1-replay-live.mjs` |
| `0b1272eedbcda9909983a149a0cd559521195ec6f737496cf8dd6ddebaee320a` | `mb1-replay-sql.mjs` |
| `967a6fccd3fa6931a098475a27fd2faf0db334565d147c28ae1f66c51059c99c` | `mb1-replay-commands.mjs` |
| `aadd48f5cfeecf0ceec529ee711de46dc4ebdd2bd87e50249d8673b4fe37eb1f` | `mb1-replay-shared.mjs` |
| `4ca7a32febc1f8427de4c02c9251ccf11fc14caa0d2d0ec953b1165b76e54fe4` | `mb1-replay-test-harness.mjs` |
| `6d50f9bd9adfb2b1feff71422fdec77aa1aed78c17e5397f8acb9444768deb58` | `mb1-replay.test.mjs` (executor) |
| `23befa057f346d46619d828bccc99208a1557358c2ff7af6dc9f466629ec5377` | `mb1-replay-guards.test.mjs` |
| `7fe8aa8f9ad0981f8a8306ba97c294fb8a09fe4312be1f4f452c8949c14d39e3` | `mb1-replay-plan.test.mjs` |
| `1d737e45f479bb34b048093e628b4d8898ae1ba8c6b366e56923f070e5b58614` | `mb1-replay-phase1f.test.mjs` |
| `5a9c881d3b08fe029b691ab6b757299faba41be8be2c89af7ddd67c662525b97` | `mb1-replay-phase1g.test.mjs` |
| `89d43d8fcb2d13fbf463aeed9f1b056f12d22944b1a05460ef164e9310306b37` | `mb1-replay-m2-stop.test.mjs` |
| `d3965aa5e02981320f8b5f1636a6fc8af0a83ff317a3729f412f5a0352be07f4` | `mb1-replay-rechecks.test.mjs` |
| `ad50282b90527c1788061e5673a0eafde3232aaa701690c45b791d9d8ffe9e36` | `mb1-replay-lifecycle.test.mjs` |

The phase 1I patches (`docs/evidence/MB-1/phase1i-mutations/`, 11 files) were said to hash "as handoff.md records". **Correction
(SF-7, review 2026-10-27T0605Z L3):** no file on disk held those values any more. SF-7 hashed them again (`rtk proxy sha256sum`,
27 October 2026). All 11 equal the values review 0605Z computed, which are now recorded here:

| sha256 | `phase1i-mutations/` |
|---|---|
| `6b1b44e650659cd3dc52a61d5ee18442c9af3058aefef1295ecaa60be6e95e85` | `B2.patch` |
| `183055fdcfc2e541aea88661a01c3584bef169fc02871b43f64327b93f1fbc83` | `P.patch` |
| `4175573822c6e3c9ccf059c6dffdf5b97788556c6adf975793a9b74c932be4cf` | `Q.patch` |
| `c678c407e64c2dbbccf84417046f3bd1dd0b1771e848ea250e182138e061ffd8` | `R.patch` |
| `cbfb93ca76890b18030c6fa6cc5c0af0cf0e23288ec240927a41c1f97023e562` | `S.patch` |
| `e4c4cca0f0586705c23d8aaa6a76a765009ad378c6554c64be80e462c2bef89e` | `U.patch` |
| `cc3eb2c8fd5bde754dc0ec35d3e57829b23eae98c07af8a8cfe311dc1e8f2fbc` | `T.patch` |
| `6c20983d7f37b9fe39344aa313eacf0ccd3350e6dfb7031aba91457f0dc3cdc6` | `X.patch` |
| `dff0d0cf362feeb6c683f083ce627f784eb74293a308216e7f52aeac61081192` | `V.patch` |
| `85d4a04d6c9fe572d6b0cbd181cba64c33e114bc79efb21de0ab582998e559af` | `W.patch` |
| `c6293197583cd51b8184ea4ba427cdd9d0732a6e008c96320326ddbbd0ced74f` | `M2.patch` |

The new patches, the verifier and the docs are hashed in [handoff.md](handoff.md) as SF-0 left it. SF-7's handoff supersedes
that table and keeps its values ([sf7.md](sf7.md) §7).

## 7. What this proves, and what it does not

- **Proved here (textual and test equivalence):**
  - every original line after the import blocks moved verbatim, into exactly one file;
  - only wiring lines were added;
  - the command line, the exports and `readState` are unchanged;
  - the same 282 tests, by name, pass;
  - the 11 guard mutations are killed with phase 1I's exact counts.
- **Not proved, and not claimed:**
  - **Live safety.** No runner command ran, the replay was not opened, and `state.json` was not read. Compatibility with
    today's state rests on `readState` and every state rule moving verbatim, and on the tests that write and read the same
    format.
  - **Any fix.** The split moved `sharedRunning`, `stagedRunning` and `sharedFingerprint` unchanged, so **review 0405Z's
    medium (finding 1: the shared target is proved from the config, not from what listens at 55322) is exactly as open as
    before** and still blocks §6. Its lows 2–5 are unchanged too.
  - **The single-writer condition** (phase1i.md §7) still stands.

## 8. Owned queue (nothing below was started; each needs SF-0's independent review first, then its own authorization)

1. **SF-7, first:** the shared-target binding (0405Z finding 1, medium). Docker's own label and port binding through a pure,
   fail-closed parser, checked in `sharedRunning`, again after `stagedRunning`, and after `migration up` as a STOP, with the
   replay mirror. Then the route proof: `migration list --local --workdir <staged>` must show 16 local, exactly the 15 base
   remote and the candidate local only, before the attempt is recorded. Also 0405Z finding 4 (`readState` refuses any
   `shared` but `true <ISO time>`), and finding 5 (an exact allowlist for the staged `.temp`/`.branches`; `_current_branch`
   reads `main`) if it is small, else SF-3. The first live read of Docker's shape needs its own read-only authorization.
2. **SF-1, durable write and one-shot:**
   - a provisional suite entry before `suite m1|m2|m3`, and no suite if that write fails;
   - `suiteNeeds` refuses once any entry for that mutation exists (0405Z finding 2, 0305Z low; flip
     `mb1-replay-order.test.mjs:66-81` first, and add m1 and m3);
   - on any failed state write after `spec.run` has begun, the lock is kept and a STOP names the command, the error and any
     stop the result carried (0405Z finding 3, 0005Z L1, 0205Z L1);
   - `renderRun` printed after `stopAfter`.
3. **SF-2:** a written procedure for clearing `stopRecorded`, and a decision on which read-only commands the halt lets
   through (0005Z L2).
4. **SF-3:** `lstat` `ino`/`ctimeNs` under the lock, rechecks after `start`, `migrations` and `stop`, and a re-hash per entry
   in teardown (2305Z F3, 0005Z L3). The single-writer condition stands until it is reviewed.
5. **SF-4:** the runner's suite spacing from 75 s to 90 s, matching the gate (0105Z L2).
6. **SF-5:** the exact sha256 of the four generated SQL files pinned. M2's and M3's new `fn_definition_md5` must differ from
   `after` and from every other mutation snapshot (0205Z L2).
7. **SF-6:** a run-time line in each evidence file (informational).
8. **Remaining lows:**
   - `mb1-replay-target.mjs` (430 lines), `mb1-replay-evidence.mjs` (598) and `mb1-replay-evidence.test.mjs` (703) are over
     400 lines and were outside SF-0's scope.
   - `mb1-replay-evidence.test.mjs:644`, `:666` and `:674` cite `mb1-replay.test.mjs` for tests now in
     `mb1-replay-plan.test.mjs` and `mb1-replay-phase1f.test.mjs`. They are comments only; the file was left byte-identical.
   - Earlier records and reviews cite old runner line numbers (use §2's map).
   - The after-`diff`/`lint` recheck has not been observed live.
   - Informational: an earlier CLI child looked up `cli-latest` over the network (0405Z).

## 9. Commands and permissions (this session)

| Command | Result |
|---|---|
| `rtk proxy wc -l <the nine MB-1 files>` | **Denied** (orientation). Not retried; Read and Grep counts replaced it |
| `rtk proxy sha256sum …` | Allowed: before (23 files, 11 phase 1I patches), after, and after every mutation restore |
| `rtk proxy node --version` | Allowed: `v22.23.1` |
| `rtk proxy git apply --check -v <patch>` | Allowed: 11 phase 1I patches on the original layout; 11 SF-0 patches on the new layout, before the runs and after each restore |
| `rtk proxy node --test scripts/backend/*.test.mjs` | Allowed: once as the baseline, once after the split (§4) |
| `rtk proxy node docs/evidence/MB-1/sf0/sf0-split.mjs plan` | **Denied.** A local node script may not run. The script sequence stopped there and was not retried in any other form (in particular never through `node --test`). The split was done with the Write and Edit tools and proved with `git diff --no-index` (§3). The script was rewritten as the unexecuted verifier |
| `rtk proxy git diff --no-index --numstat …` (and one `-U0`) | Allowed (read-only): §3 |
| Write to `/tmp/fitlog-mb1-sf0/` | Allowed: the two scratch copies (§3) and the mutation reports (§5) |
| `rtk proxy node --check <file>` | Allowed: 22 MB-1 files and the verifier, each exit 0 with no output |
| `rtk proxy sort <TAP output>` | **Denied.** Not retried; names compared with Grep (§4) |
| `rtk proxy git apply -R --check -v <patch>` | **Denied.** Not retried in another flag order; the applied state was shown the phase 1I way (§5) |
| `rtk proxy node --test scripts/backend/mb1-replay*.test.mjs` (B2's first run) | Allowed; exit 1 as expected; its stdout was cut in the middle, so the run was repeated with a report file |
| `rtk proxy node --test --test-reporter=spec --test-reporter-destination=/tmp/fitlog-mb1-sf0/mut-<id>.txt scripts/backend/mb1-replay*.test.mjs` | Allowed: 11 runs, each exit 1 as expected |
| Subagents, commits, staging, any runner, CLI, Docker, database or network command | Not used: the brief forbids them |

**Scratch files left in place** (not evidence): `/tmp/fitlog-mb1-sf0/mb1-replay.mjs`, `/tmp/fitlog-mb1-sf0/mb1-replay.test.mjs`
and `/tmp/fitlog-mb1-sf0/mut-{B2,P,Q,R,S,U,T,X,V,W,M2}.txt`.

## 10. State left untouched

- The replay project was not opened, and 55321 got nothing.
- The SQL, `config.toml`, the candidate migration, the contracts, the root `package.json` and the lockfile, `verify-identity.mjs`
  and its test, `mb1-replay-target.mjs`, the evidence and order modules and their tests (re-hashed equal), every earlier
  record, review and evidence file, and the phase 1I patches are all unchanged.
- `status.json`, GOALS and the ledger are untouched.
- No git write ran: nothing was staged or committed.
