# MB-1 phase 1E: F5, F3 and F4 fixed test-first (pure code only, no live run)

| Field | Value |
|---|---|
| Goal and box | MB-1, box 3 (as phase 2). Box 3 is **not met**; B1 and B2 stay open |
| Authorization | Codex AUTH-01 (owner delegation: Codex makes routine technical decisions). Codex chose **option (b)** of [phase2.md](phase2.md) A2.7, and authorized one bounded **pure-code** phase, 1E: fix F5 test-first; also fix F3 and F4 before any later shared authorization. Allowed: reading the installed CLI's files (never running it), the pure backend tests and `node --check`. Writes limited to `scripts/backend/mb1-replay*.mjs`, their tests and the MB-1 docs. **Not allowed:** any database query, CLI, Docker, status, network, suite, runner command, stop, teardown or lock removal; any edit in `/tmp/fitlog-mb1-replay-20261026`; any change to the candidate SQL, `verify-identity.mjs`, the root package, dependencies, lockfiles, contracts or another goal; subagents; commits; status, GOALS, ACCEPTANCE or main edits; waiving missing evidence |
| Worktree | `/Users/Adya/.codex/worktrees/fitlog-mb1/fitness_app`, branch `codex/mb1-identity`, base local `main` `2a95726`. Nothing committed |
| Date | 26 October 2026. No clock time: `rtk proxy date -u …` was denied in this session |
| Result | **F5, F3 and F4 are fixed in code, test-first, with 9 guard mutations each killed by a named test.** `rtk proxy node --test scripts/backend/*.test.mjs`: **104 pass, 0 fail** (95 before, plus 9 new tests). All seven `node --check` pass. **No replay command ran.** A fresh security review of this diff is required before any replay resume (§9) |
| Read | RTK rules (`/Users/Adya/.codex/RTK.md`); GOALS MB-1; [checkpoint.md](checkpoint.md); [phase2.md](phase2.md) (attempts 1 and 2); [phase2-plan.md](phase2-plan.md); review b75d1e73 ([verbatim](../../../evidence/MB-1/review-b75d1e73-final.md)); `/tmp/fitlog-ba065077-final.md` (attempt 2's final message); the runner, its target and evidence modules and their tests; `phase2-1-migrations.txt`; the installed CLI files (§2, §3) |

## 1. What this phase did, and did not do

- **Did:** read the installed Supabase CLI 2.121.0 as files to learn the exact `migration list` table and `.env` loading;
  wrote the tests first and saw them fail (RED); changed only `mb1-replay.mjs`, `mb1-replay-target.mjs` and
  `mb1-replay-evidence.mjs` and their two test files; ran the pure tests, the syntax checks and nine guard mutations; wrote
  this record and updated [checkpoint.md](checkpoint.md) and [phase2-plan.md](phase2-plan.md).
- **Did not:** run the CLI, Docker, any database query, `supabase status` or any runner command; touch, stop or check the
  running replay project; change the candidate SQL, `verify-identity.mjs`, any review copy or any evidence file; commit.
- **The CLI files are the ones that ran in attempt 2.** `rtk proxy sha256sum` of the four CLI files at the start of this
  phase gave exactly the checkpoint values (`21d25b4b…91e6` twice, `6e8be5fb…08dc`, `fd5f2364…3813`).

## 2. F5: the `migration list` rows

**What 2.121.0 prints, read from its own code.** In 2.121.0 `migration list` is TypeScript bundled into the Bun binary
`node_modules/@supabase/cli-darwin-arm64/bin/supabase` (sha256 `6e8be5fb…08dc`), not the Go sidecar. The sidecar holds no
`Time (UTC)` string. The Grep tool, reading the binary as a file, shows (ripgrep line numbers in that file):

| Line | What the code does |
|---|---|
| 11108275 | `o_o=["Local","Remote","Time (UTC)"]` is the header; text output is `r.raw(Da([...o_o],POn(f)))` |
| 11108275 | `POn` **wraps every cell in backticks**: a version becomes backtick, version, backtick; an empty cell becomes backtick, space, backtick; the time is wrapped the same way |
| 11108275 | `COn` makes one row per version, in version order: local and remote, local only, or remote only |
| 11090077 | `Da` pads each column to its widest cell (`padEnd`), prints a two-space indent, then each cell with a space either side, joined by a pipe; its rule is `"-".repeat(width+2)` per column |
| 11090189 | `_me` prints a version as `YYYY-MM-DD HH:MM:SS` |

So a row looks like this (Da's trailing pad trimmed). The pre-F5 pattern required bare digits, so it could match no 2.121.0
row:

```text
   `20261017161031` | `20261017161031` | `2026-10-17 16:10:31`
```

**The kept live lines agree.** Attempt 2 kept the header and rule (`phase2-1-migrations.txt` lines 2 and 3). Their
widths, 18, 18 and 23 dashes, are what `Da` prints for cells 16, 16 and 21 wide: a 14-digit version or a 19-character time
**plus two backticks**. The new test at `mb1-replay-evidence.test.mjs:124` checks that the transcribed `Da`/`POn` prints
those two lines exactly. The rows themselves were never seen live: they were withheld. **Every row fixture in the tests is
transcribed from the installed code, not live output.** The cause of attempt 2's STOP is therefore established from the
installed source plus the kept widths. Mutation M2 (§5) shows the old pattern withholding all 15 transcribed rows. That
fits 17 withheld lines as 15 rows plus 2. **What the other 2 withheld lines were stays unknown;** this phase invents
nothing about them.

**The fix (`mb1-replay-evidence.mjs`).**
- The allowlist keeps exactly 2.121.0's header (`^ +Local +\| +Remote +\| +Time \(UTC\)$`), its rule (`^ +-+\|-+\|-+$`)
  and its row: two cells, each `` `<14 digits>` `` or `` ` ` ``, and a backticked time, with any padding. `│` borders and
  bare-digit rows (the pre-F5 hand-written fixture shape) are **not** accepted: 2.121.0 cannot print them (`POn` always
  wraps, `Da` always joins with `|`), so accepting them is not warranted.
- **`migrationListResult(text, { local, applied })`**, a mechanical verdict:
  - **no recognised row fails, whatever the exit code;**
  - any table-shaped line (holding `|` or `│`) that is not the header, the rule or a recognised row fails, by count only;
  - then exactly one row per expected version, in version order, each listed local and/or remote as expected, with its
    time equal to its version's timestamp.
  - Problems name versions and counts, never a withheld line.
- **The runner (`mb1-replay.mjs`, `migrations`).** After a CLI exit 0, `local` is every migration in the manifest (the
  replay's `supabase/migrations`, which `checkOwnedDir` keeps to exactly the manifest). `applied` is the same list without
  the candidate, unless the state says `applied`. If the verdict fails, the runner refuses: `mb1-replay refused: the
  migration list does not prove the manifest's migrations: …`, exit 1, written to the evidence. On success it prints
  `# migration list: 15 row(s), equal to the manifest's 15 migration(s), 15 of them applied`. A CLI exit other than 0 stays
  a plain failure (exit 1).
- **Secret-shaped or malformed lines stay withheld and counted.** A malformed or secret-bearing row also fails the list.
  A secret-shaped line outside the table is withheld but does not fail it.

## 3. F3: the 55321 database port and `.env` files

**Exact loopback (`sharedRunning`, `replayRunning`).** The repository's `supabase status -o json` must give
`API_URL` exactly `http://127.0.0.1:55321` (unchanged) **and** a `DB_URL` whose scheme is `postgresql:` or `postgres:`, host
exactly `127.0.0.1` and port exactly `55322` (`SHARED.dbPort`). Otherwise: `the repository's database is not at
127.0.0.1:55322; its DB_URL is not printed, because it holds credentials`. The replay's own check now uses the same helper
at `56422`, which adds the scheme check. The installed code builds every database URL it prints as
`postgresql://…@host:port/db` (binary lines 11088396, 11090132, 11098153; `r.DB_URL=e.database` at 11107311). Which
builder `status` uses was not traced, so `postgres:` is accepted too. Attempt 2's live replay checks (after `start` and
before `migrations`) passed the older host-and-port check, so `DB_URL` is present in 2.121.0's status output.

**`.env` files: what 2.121.0 reads, from its own code.**

| Line | What the code does |
|---|---|
| 11090182 | `fi`: the environment name is `SUPABASE_ENV`, default `M9r="development"`. The names are `.env.<env>.local`, `.env.local` (unless the name is `test`), `.env.<env>` and `.env`. The directories are `n.join(r,"supabase")`, then `r`. Every name is read in both, and the first value wins |
| 11088725 | `Ukt` names the project's `supabase/.env` (`envPath`) and `supabase/.env.local` (`envLocalPath`) |
| 11088729 | the config loader reads `envPath`, then `envLocalPath` unless `skipEnvLocal`, then the ambient environment |
| 11088725 | `Wp` searches the project root **upward**, but only when `<dir>/supabase/config.json` and `config.toml` are both missing |

**The chosen scope (`mb1-replay-target.mjs`: `envSearchDirs`, `envFiles`; checked in `dispatch` before any command).**
- **Justified by the installed code:** `<workdir>/supabase` and `<workdir>`, for both workdirs the runner gives the CLI:
  the repository (55321 commands, and the `cwd` of every CLI call) and the replay directory.
- **Unverified, so fail closed:**
  - which root each of the 24 `fi(…)` call sites passes;
  - what the Go sidecar `supabase-go` reads. It is compiled; its strings hold `.env.local`, but its search path cannot be
    read as code.
  - So **every parent directory** of both workdirs is also checked, up to `/`, by the path as given and by its real path
    (`/tmp` and `/private/tmp` for the replay).
- **Any `.env*` name counts, in any case** (`/^\.env/i`): APFS ignores case by default, and `.envrc` is refused too. Only
  the directories themselves are listed, so `apps/mobile/.env.example` is not in scope.
- **The refusal names paths only:** `a .env file the Supabase CLI may load is present: <paths>; nothing runs while one is
  there (names only: no file was read, changed or removed)`. No `.env` file is opened, changed or removed. A directory
  that cannot be listed (other than missing) is refused too.
- **Partly observed (Glob, names only):** no `.env*` sits directly in the repository root, its `supabase/`, its parent
  `/Users/Adya/.codex/worktrees/fitlog-mb1` or `/private/tmp`. The only `.env*` under the worktree is
  `apps/mobile/.env.example`, which is out of scope.
- **Not observed:** `/Users/Adya/.codex/worktrees`, `/Users/Adya/.codex`, `/Users/Adya`, `/Users`, `/private` and `/`. A
  recursive Glob of the home directory timed out, and a depth-limited `find` was denied. The runner checks these itself
  on every command, so a stray `.env*` there (for example `~/.envrc`) would refuse the resume, by name.

## 4. F4: the candidate's bytes are pinned

- `CANDIDATE_SHA256 = 'ac262f39fc6962345f64982e36c6b2aa7f8f3418829fd653684002f2f2c1bdc3'` in `mb1-replay-evidence.mjs`.
- **Provenance:** `rtk proxy sha256sum supabase/migrations/20261026040045_mb1_live_session_guard.sql`, run in this phase
  on the unchanged file. Its one statement equals [phase1.md](phase1.md) §3 line 104 byte for byte; review a102fb68 called
  the candidate SQL "unchanged and correct". **No earlier sha256 of the candidate was ever recorded**, so the pin binds
  today's bytes; it cannot prove that they are byte-identical to what an earlier reviewer read.
- **Checked:**
  - at `add-candidate`, before anything is copied or added to the manifest: "`… is not the reviewed candidate (sha256 …,
    reviewed …); nothing was added`";
  - at `shared-apply`, first, before the byte comparison with the replay and before any status or SQL: "`…; apply
    nothing`".
- The evidence test (`:395`) ties the constant to the file and to phase1.md §3. The runner tests cover:
  - an added `grant` and a weakened guard refused at add-candidate (`:924`);
  - finding 4's own scenario at shared-apply: the candidate is edited after review and replayed, so the replay's copy
    and manifest carry the edit, every replay proof passes, and the byte comparison passes. Only the pin refuses it
    (`:844`);
  - the byte comparison still covered by a replay that ran other bytes than the pinned candidate (`:844`).

## 5. Tests

**RED (before any implementation).** `rtk proxy node --test` over the three MB-1 test files: 42 tests, **34 pass, 8 fail**:
- `mb1-replay-evidence.test.mjs` failed to load, since `CANDIDATE_SHA256` and `migrationListResult` did not exist yet;
- 7 runner tests failed, among them the `.env` test (prepare refused only as "already exists").

**GREEN.**
- `rtk proxy node --test scripts/backend/*.test.mjs`: `# tests 104`, `# pass 104`, `# fail 0` (`# duration_ms 4636.172291`,
  after the mutations were restored).
- `rtk proxy node --check scripts/backend/<file>` for `mb1-replay.mjs`, `mb1-replay-target.mjs`,
  `mb1-replay-evidence.mjs`, `verify-identity.mjs`, `mb1-replay.test.mjs`, `mb1-replay-evidence.test.mjs` and
  `verify-identity.test.mjs`: all exit 0, no output.

**New tests (9).**
- Evidence: `:124` header and rule equal the live lines; `:133` 2.121.0 rows kept and proved; `:151` empty list, old
  shape, `│` borders, malformed and secret-bearing rows withheld and failing; `:188` count, set, order, local/remote and
  time; `:395` candidate pin.
- Runner: `:518` `.env` refusal; `:586` exact 55321/55322; `:636` `migrations` verdict and refusals at CLI exit 0; `:924`
  add-candidate pin.

**Changed existing tests (no assertion weakened).**
- The in-memory CLI now prints the transcribed 2.121.0 table and records applied migrations. `:616` asserts the backticked
  row instead of the old hand-written one, and still asserts `# 1 line(s) withheld`.
- The repository's in-memory status now carries a `DB_URL` at 55322. `:560` gained four replay `DB_URL` refusals.
- In `:844`, the changed-candidate case now expects the earlier pin refusal. Two cases were added: finding 4's scenario,
  and the byte comparison, which keeps that guard covered. A `DB_URL` refusal at shared-apply was added as well.

**Guard mutations (each applied, run, then restored; the final run above is after restoring all).**

| # | Mutation | Killed by |
|---|---|---|
| M1 | No "no migration row" problem | evidence `:151`; runner `:636` (an empty table printed `0 row(s)` and exit 0) |
| M2 | The pre-F5 row pattern in the allowlist | evidence `:133` (15 rows withheld, `15 !== 0`), `:151`; runner `:636` and one more (4 failures) |
| M3 | No local/remote expectation check | evidence `:188`; runner `:636` |
| M4 | No `DB_URL` check in `sharedRunning` | runner `:586`; `:844` (the in-memory 55321 "applied" with `DB_URL` at 56322) |
| M5 | No `.env` refusal | runner `:518` |
| M5b | `.env` search without parent directories | runner `:518` (the parent's `.env.development` was not found) |
| M6 | No pin at add-candidate | runner `:924` (the edited candidate was added, exit 0) |
| M7 | No pin at shared-apply | runner `:844` |
| M7b | M7, with `:844`'s first changed-candidate case temporarily loosened to any "apply nothing" | runner `:844` at finding 4's scenario: the in-memory 55321 "applied" the edited candidate |
| M8 | No URL scheme check in `loopbackDb` | runner `:560`, `:586` |

## 6. Unknowns, recorded rather than guessed

- The 2 withheld lines of attempt 2's `migrations` that were not rows.
- How 2.121.0's Go sidecar loads `.env` files, and which root each `fi` call gets (covered by the fail-closed parents).
- Which builder produces `status`'s `DB_URL` (both Postgres schemes accepted; host and port exact).
- Whether a `.env*` exists today in a parent this phase could not list: `~/.codex/worktrees`, `~/.codex`, `~`, `/Users`,
  `/private` or `/` (§3).
- Whether the candidate's bytes equal what an earlier reviewer read: no earlier hash exists (§4).
- The 2.121.0 table rows themselves: transcribed from code, tied to the live header and rule only.

**Self-review residuals.** The brief forbids subagents, so this is my own pass over the diff, not the independent review
§9 asks for. I found nothing critical or high. These low items stay open for that review:
- **Fail-closed reach.** The parent scan runs on every command, so an unrelated `.env*` in a parent, such as `~/.envrc`,
  blocks the runner until it is moved. That is by design, and the refusal names it.
- **Withheld lines outside the table.** The `migrations` verdict counts them but does not fail on them, unless they hold
  a `|` or `│`. So an unknown notice line (like attempt 2's 2 extra lines, if they are such) does not stop it.
- **Live confirmation.** The first live rerun of `migrations` is the first time 2.121.0's rows meet the new grammar.
- **Accepted schemes.** `loopbackDb` accepts both `postgresql:` and `postgres:`, while host and port are exact.
- **File size.** `mb1-replay.test.mjs` is about 1150 lines, over the 800-line guideline; it was 947 before this phase.

## 7. State left untouched

- **The replay project:** not started, stopped, queried or checked; no runner command ran. Its directory was neither opened
  nor edited. One recursive, name-only Glob of `/private/tmp` for `.env*` names (§3) walked the names under it, the replay
  directory included; it read, changed and removed nothing. Its state therefore stays as attempt 2 left it: running, no
  lock, generation 1, candidate `absent`.
- **55321:** no query, command or inspect from this phase.
- **Unchanged:**
  - the candidate SQL (sha256 `ac262f39…bdc3`), `verify-identity.mjs` and its test;
  - every review copy and evidence file, `phase1*.md` and [phase2.md](phase2.md);
  - `local-stack.mjs`, `package.json`, the lockfile and `config.toml`;
  - `status.json`, GOALS and the ledger.

## 8. Files changed

| Path | Change |
|---|---|
| `scripts/backend/mb1-replay-evidence.mjs` | `CANDIDATE_SHA256`; the 2.121.0 `migration list` header, rule and row; `migrationListResult` |
| `scripts/backend/mb1-replay-target.mjs` | `SHARED.dbPort`; `ENV_FILE`, `envSearchDirs`, `envFiles` |
| `scripts/backend/mb1-replay.mjs` | the `.env` refusal in `dispatch`; `loopbackDb` (scheme, host, port) for both stacks; the `DB_URL` check in `sharedRunning`; the `migrations` verdict; `pinnedCandidate` at add-candidate and shared-apply; header comment |
| `scripts/backend/mb1-replay-evidence.test.mjs`, `scripts/backend/mb1-replay.test.mjs` | §5 |
| `docs/plan/runs/MB-1/phase1e.md` | New: this record |
| `docs/plan/runs/MB-1/checkpoint.md`, `docs/plan/runs/MB-1/phase2-plan.md` | Status, resume point, §1.4 expectation, rules, §6 prerequisites |

**The bytes for review.** `rtk proxy sha256sum` after the final test run (`# tests 104`, `# pass 104`, `# fail 0`,
`# duration_ms 4558.874666`):

| sha256 | File |
|---|---|
| `ac262f39fc6962345f64982e36c6b2aa7f8f3418829fd653684002f2f2c1bdc3` | `supabase/migrations/20261026040045_mb1_live_session_guard.sql` (unchanged; the pinned value) |
| `2bc49a62186f55d8f2fe384063d8c67dbaa611806f9674655edc88b9c2859b57` | `scripts/backend/mb1-replay.mjs` |
| `fa0413721625846486a659947fe86c7e8d011df0533fd9de16f57ae2453d7045` | `scripts/backend/mb1-replay-target.mjs` |
| `29d73cdbd2694420a8d18beba37d36f411436f3162d52e7a91585983b9caf857` | `scripts/backend/mb1-replay-evidence.mjs` |
| `0483301ecb8875c22c0221798f8fe2220d1447f1deaad68e6f47dd07088175a3` | `scripts/backend/mb1-replay.test.mjs` |
| `9cf1d7e99f380feab57f82684dd54666d503b18ba991463e7d6bf2232dffec68` | `scripts/backend/mb1-replay-evidence.test.mjs` |
| `944ba934a93a369cf6382ddea79620cdf35215d218dc1fde9eea634cc1bcdf81` | `scripts/backend/verify-identity.mjs` (unchanged in this phase) |
| `902bb69924b929ac0b06c8fc44e3102318cf6f5fc06c212ccd3d51ce45521021` | `scripts/backend/verify-identity.test.mjs` (unchanged in this phase) |

No earlier sha256 of the two `verify-identity` files is recorded, so "unchanged" rests on this phase making no edit to
them. The runner files' hashes changed in this phase, so review b75d1e73 covered earlier bytes.

## 9. Next bounded checkpoint (the coordinator decides)

1. **A fresh, independent security review of this diff is required before any replay resume** (and before any §6
   authorization): F5's grammar and verdict, F3's scope and exact-port checks, F4's pin and its provenance. Reviews
   b75d1e73, a102fb68 and 39fe1fb5 stay as recorded; their copies are unchanged.
2. **Then, if accepted:** on the **same, still running** `/tmp/fitlog-mb1-replay-20261026`, never prepared again:
   1. `MB1 migrations --evidence phase2-1-migrations-2`. Expect 15 backticked rows and `# migration list: 15 row(s), equal
      to the manifest's 15 migration(s), 15 of them applied`. A refusal or `STOP:` line: stop and record.
   2. Then phase2-plan §2 (`snapshot before`, `suite red`, the CLI hashes again), as authorized.
   3. If a `.env*` refusal names a parent such as the home directory, record it and stop. Do not remove the file.
3. **§6 (55321)** still needs its own authorization after the review accepts F3 and F4.
4. **B1 and B2** stay open ([checkpoint.md](checkpoint.md)). Box 3 is not met.

## 10. Permissions observed

| Command | Result |
|---|---|
| `rtk git status`, and a compound `rtk git status; …` | Denied |
| `rtk proxy git status --short` | Allowed |
| `rtk proxy sha256sum` (the candidate; the four CLI files) | Allowed |
| `rtk proxy node --test scripts/backend/…` and `rtk proxy node --check scripts/backend/…` | Allowed |
| `rtk proxy node --test --test-reporter=dot …` | Denied; the plain form was used |
| `rtk proxy stat …`, `rtk proxy find … -maxdepth 1 …`, `rtk proxy date -u …` | Denied; not retried |
| Glob of the home directory for `.env*` | Timed out (20 s) |
| Subagents (`code-reviewer`, `security-reviewer`, `tdd-guide`) | Not used: the brief forbids them, so the review in §9 is still owed |
