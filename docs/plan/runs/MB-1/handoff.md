# Handoff — MB-1 · Identity, adult onboarding, sessions and preferences        attempt 1 · codex/mb1-identity · 2a95726 (uncommitted working tree)

**Outcome claimed.** **Not ready for verification.** This is an interim handoff after **SF-7e**, one bounded, pure-code,
test-first phase under Codex AUTH-01 (owner delegation), 27 October 2026. No clock time is recorded: `date` was denied in
SF-7d and is not retried.
- **The review it follows:** SF-7d's independent review,
  [`final-2026-10-27T1132Z-collected.md`](../../../evidence/MB-1/final-2026-10-27T1132Z-collected.md). It found C0 H0, M1
  carried, one new low (L1, which SF-7d had reported itself) and four informational notes, with 308/308 pure tests on Node
  v22.23.1 executed by the reviewer (**inherited** here). Codex accepts it.
- **The coordinator** inspected `dispatch` directly and confirmed L1: `result.state` is saved before the lifecycle `finally`.
  The carried M1 stays open.
- **Fixed, test-first, with fixtures only:**
  - **L1:** `dispatch` runs the start-time check by name for a verified `shared-apply` (exit 0) **before** it writes the
    state, and `finally` then skips it. So exactly one check runs after the apply.
    - A restart, a stop, another start time read once or a timeout there is now a STOP (exit 1).
    - `state.json` keeps only the attempt: no `sharedApplied` and no `55321-after`.
    - The next `shared-apply` is refused as already attempted, and `shared-suite` as needing a verified apply.
  - **Everything else is unchanged:** every other `shared-apply` outcome and every other lifecycle command still writes its
    state first and is then checked in `finally`. So `stopRecorded` and `stop`'s generation still persist, and error paths
    are still checked.
  - **I-1 (wording):** the entry header, the `sharedApplied` note in `order.mjs`, the residual note in `shared.mjs` and line
    6 of the SF-7d test.
- **What ran:** pure tests only, on Node v22.23.1:
  - focused RED 13/19, with 6 failing for their reasons;
  - focused GREEN 19/19;
  - then all 21 pure test files once, on the final code bytes: **`1..162`, 320/320**.

  No runner, Docker, CLI, database, SQL or network command ran, and the replay was not opened.
- **Not run:**
  - any mutation: SF-7b's eight, SF-7c's four, SF-7d's five and SF-7e's four stay UNRUN;
  - hashes: `sha256sum` was denied to review 1105Z and is not retried;
  - the subagent reviews, which this brief forbids.

**No MB-1 Done-when box is met, and nothing is Done.** Full record: [sf7e.md](sf7e.md); resume point:
[checkpoint.md](checkpoint.md).

## Done when
| Box | Met | Evidence |
|-----|-----|----------|
| Integration tests cover email signup, verify and reset; Google and Apple sign-in through their adapters (local test configuration); unverified email; a reused reset token; and linking without automatic account merge | no | Not started |
| The server rejects under-18 dates of birth, notice versions and acceptances are recorded, and onboarding resumes at the right step after a kill (tests) | no | Not started |
| A revoked session fails on its next request, and a user can read only their own profile (cross-user test) | no | **Partial, on the replay only; SF-7e changes nothing here.** On the disposable replay: RED, GREEN, M1, M3 and M2, each with its restore and GREEN again (phase 2 attempts 4–8, [phase2.md](phase2.md)). **Still missing:** M1's live read and listener rule, SF-1 to SF-6, §5, §6 on 55321 (not authorized), and **B1 and B2** |
| AC16 fixtures (timezone and unit changes, DST and date boundaries) pass in TypeScript and SQL, and the contract is published (SP3) | no | Not started |

## Acceptance evidence
| Ledger row | Run (build or environment, date) | Result | Evidence | Row written here? |
|------------|----------------------------------|--------|----------|-------------------|
| (none) | Pure tests only, this worktree, 27 Oct 2026 | 320/320 in the one full run, on the final code bytes; no mutation ran | [sf7e.md](sf7e.md) §3–§4 | no. A fixture-only guard gives no acceptance row |

## Gates
| Gate | Command | Result |
|------|---------|--------|
| Baseline | not rerun (brief) | **Inherited:** 308/308, executed independently by review 1132Z on SF-7d's bytes |
| RED (focused) | `rtk proxy node --test --test-reporter=spec scripts/backend/mb1-replay-sf7e.test.mjs scripts/backend/mb1-replay-sf7d.test.mjs scripts/backend/mb1-replay-scope.test.mjs` | `tests 19`, `pass 13`, **`fail 6`, each for its intended reason.** The four L1 subtests and their parent show a run that ended in the STOP after `shared-apply` with `sharedApplied` recorded (`true !== false`). The success control shows `'write state.json'` before the check by name. The five controls, SF-7d's four and the scope test's three pass |
| GREEN (focused) | the same | **19/19 on the first run**; no assertion changed after the code |
| Side effects | reading the new file and the harness | **Inspected:** the new file writes nothing itself. The runner writes only into each `mkdtemp` sandbox and its mapped `/evidence`; Docker and the CLI are the in-memory world; no process starts |
| Final, once | `rtk proxy node --test --test-reporter=tap --test-reporter-destination=stdout --test-reporter=tap --test-reporter-destination=/tmp/fitlog-mb1-sf7e-final.tap scripts/backend/*.test.mjs` (21 files) | **`1..162`, `# tests 320`, `# pass 320`, `# fail 0`**, `# cancelled 0`, `# skipped 0`, `# todo 0`, `# duration_ms 14268.428625`. On the final code bytes: only MB-1 records changed after it. SF-7e is `ok 122`–`124` |
| Mutations | none attempted | **UNRUN:** SF-7b's eight, SF-7c's four, SF-7d's five and SF-7e's four planned (sf7e.md §4). The denied `mkdir`/`cp` were not retried or replaced |
| Clock, line counts, hashes | `rtk proxy date`; `wc -l`; `sha256sum` | `date` denied in SF-7d; `wc -l` denied in SF-7c; `sha256sum` denied to review 1105Z. None retried or substituted in SF-7e, so no time, line count or hash is claimed |
| §8 secret scan | Grep tool, §8's five patterns, `!review-39fe1fb5-final.md` | **Executed:** exactly the five inventory lines in three files and the six tokens; hashes **not** re-taken. SF-7e writes nothing under `docs/evidence/MB-1/` |
| Tree | `rtk proxy git --no-optional-locks status --short`, at start and end | start: 32 untracked entries and no tracked change. End: the same plus `scripts/backend/mb1-replay-sf7e.test.mjs` (33), and no tracked change |
| `pnpm check`, `backend:test` | not run | Outside the brief (see the decision below) |

## Mutation checks
**None ran.**
- **SF-7b's eight** (R-exit, D-call, D-rule, D-empty, I-name, T-bind, T-fp, L4-text) stay **UNRUN**. R-exit's behavioural
  kill is still not shown; reading is not a kill.
- **Predictions only:** SF-7c's four (P-call, P-compare, P-target, P-unfinished), SF-7d's five (U-before, U-order, U-after,
  U-snapshot, U-consequence) and SF-7e's four (E-after, E-double, E-all, E-code). See sf7c.md, sf7d.md and sf7e.md §4.
- **Kills by order or message only:** U-after would be killed by order and message only, and E-code by order only.

## Review findings left open
- **Owed:** a fresh independent review of SF-7e. The `code-reviewer`, `security-reviewer` and `tdd-guide` passes did not
  run: the brief forbids subagents. Self-review only.
- **M1 (medium, carried):** open. The live M1 plan (R0–R17) was reviewed, not executed, and it is not accepted as closure.
  SQL cluster equivalence stays unproved, and needs its own decision.
- **Review 1132Z L1:** fixed in code and tests (sf7e.md §2–§3), pending the independent review. Review 1105Z's L1 and L2
  (SF-7d) were accepted by review 1132Z.
- **Review 1132Z informational:**
  - **I-1:** fixed in the four places listed. This handoff's old line 16 is rewritten above. The SF-7 test title "…as its
    last children before the final guards…" is left, so test names stay comparable; that file is outside this brief.
  - **I-2:** stated, not changed. Exit 1 with `sharedApplied` true is still possible after a lock-release STOP or a failed
    evidence write. By the adopted definition, `sharedApplied` describes 55321, not the exit code (sf7e.md §2).
  - **I-a:** disclosed, unchanged.
  - **I-b:** `shared-snapshot` and `shared-suite` do not recheck at the end. Open.
  - **I-c:** the gap between an ID inspect and the exec. Accepted.
- **New, self-review (sf7e.md §7):**
  - On the new STOP, stdout still carries `shared-apply`'s own `# 55321 after migration up: equal …` line before the exit
    line. The exit code and the refusal, on stderr and in the evidence file, carry the outcome.
  - No stdout STOP line was added, to keep to the minimal correction. That is for the reviewer to judge.
- **Carried from SF-7d:** the fixture holds the binding for a stopped container. Live Docker would publish no port, and the
  binding read would refuse first.
- **Carried:**
  - the `DOCKER_HOST` rule checks the scheme only (`DOCKER_CONTEXT`, `~/.docker` and another runtime's socket are not
    refused);
  - SF-2's incident path is not written;
  - SF-1 to SF-6; finding 5 (SF-3); 0605Z L2 (accepted residual); I1 and I2;
  - `prepare` pins any accepted fingerprint;
  - three files over 400 lines; old line citations;
  - the after-`diff`/`lint` recheck not seen live.

## Left undone, and why
- The live M1 read: it needs its own read-only authorization.
- The QA-9 phase 3N harness correction: not authorized now (decision below).
- SF-1 to SF-6, B1, B2, box 3 as a whole, §5–§7, and any shared apply: out of scope.
- Mutations: no scratch tree is authorized, and the denied commands are not retried. Commits and staging: forbidden.
- G1–G7 (QA-9 phase 3N harness correction) and M1: explicitly not part of SF-7e.

## Found for other goals
- **G16.api:** B1. `role_read`, `register_read`, `plans_read` and `gym_read` still serve a revoked or disabled session's token.

## Requests for other lanes' files
Unchanged (phase1d.md §5):
- an allowlisted-environment, process-group executor in `local-stack.mjs`;
- the `verify*.mjs` status-parsing fixes;
- `verify-identity.mjs` in `backend:test`;
- 003 §3.7.

## Decisions forced
- **SF-7e L1:**
  - **Correction:** the review's minimal correction, as written. The early check is scoped to `op === 'shared-apply' &&
    result.code === 0`, the only outcome that returns a verified state. A `checkedAfter` flag keeps it to one check after
    the apply.
  - **Not moved for every command.** Moving the check ahead of the write everywhere would drop a recorded `stopRecorded`
    (`migrate`, `diff`, `lint`) and `stop`'s generation when that check fails. Controls show both persist.
  - **`sharedApplied` now means:** every check inside `shared-apply` held, and then the entry's start-time check by name
    after it, before `state.json` recorded it. It describes 55321, not the run's exit code.
  - **The order is shown** through the harness's existing `deps` injection: a logging executor and file system. The harness
    is unchanged.
- **SF-7d L1 (carried):**
  - `provenStarted` (SF-7c) gains a consequence argument and is exported. `shared.mjs`'s `provenUnchanged` calls it, then
    prints one line.
  - In `sharedApply` it runs right after `bindingUnchanged`, so the ID inspect is the last child; the synchronous final
    guards then come after it. A test shows a staged edit made during that inspect is still refused.
  - When a change lasts, the lifecycle STOP by name replaces the printed refusal (review 1105Z I-a). Either way there is no
    attempt.
- **SF-7d L2 (carried):**
  - **Check 1:** right after the binding recheck after `migration up`, whatever the exit, before anything is read from the
    container. This is the review's placement.
  - **Check 2:** after the snapshot, which goes beyond the review's placement. Without it, a restart during the after
    snapshot would still end in a STOP with `sharedApplied` recorded, against the brief's "a STOP never claims a verified
    apply". It runs after `recordSnapshot`, which only builds the state, so an unequal snapshot keeps its own STOP. SF-7b's
    exec-by-ID test is unchanged in intent: its replacement lands after the first check.
- **Codex's decision, carried:** before any future `backend:test`, QA-9's phase 3N readiness gates G1–G7 require a single,
  separate harness-correction phase. MB-1 owns it, and Codex explicitly assigns its S2 paths. **Not authorized now.**
- **Followed:** review 1132Z (C0 H0, M1 carried; 308 pure tests on Node v22.23.1, executed by the reviewer and inherited
  here). The carried M1 stays open.
- **Policy, restated by the coordinator:**
  - PRD §16.1 / ADR003: staff never read or write private health data, whatever the consent.
  - The privacy override stays until QA-2 is integrated and launching-checkout is corrected.
  - SF-7e opens no data path: it only moves one read-only inspect ahead of one write of the runner's own `state.json`.

## Traps hit
- **Kept from SF-7d:** `mb1-replay-scope.test.mjs` reads each internal module's first five lines for its `// Internal:`
  role comment, so `shared.mjs`'s header was not touched. Its SF-7e note is in a JSDoc body. The scope scan also flags a
  comment that quotes an internal module after `from` or `import`; the new test's comments avoid that.
- **The by-name check's override has to be one-off:** `w.inspect` persists in the harness until cleared. The new test
  deletes it once the check by name has answered, so the one-off cases are one-off: the next command's check passes with
  no reset.
- **Denied, not retried:** `date` (SF-7d), and `sha256sum` (review 1105Z), which was not tried.

## Hashes (not taken in SF-7d or SF-7e)
`sha256sum` was denied to review 1105Z, so neither SF-7d nor SF-7e ran it or any substitute. No SF-7d or SF-7e hash is
recorded. The changed files are listed in [sf7d.md](sf7d.md) §2 and [sf7e.md](sf7e.md) §2. The table below is SF-7c's,
carried verbatim. Its `live.mjs`, `shared.mjs`, test-file, `checkpoint.md`, `sf7c.md` and handoff values are superseded by
SF-7d's and SF-7e's edits. This file cannot record its own hash.

### Carried from the SF-7c handoff (verbatim)

The code hashes before and after are in [sf7c.md](sf7c.md) §5, and the three finals in §6.

**This phase:**

| sha256 | File |
|---|---|
| `e5923e21f872c2b96d608df087280e131c214c707adc5906a1aa720f6207c88d` | `docs/plan/runs/MB-1/sf7c.md` (new) |
| `08ee6c3b58478f6fdfa8e9ef2c357292d194d19bd92d7b0620923deea37f5f63` | `docs/plan/runs/MB-1/checkpoint.md` (was `3ad91e60…259b`) |
| `20169170cbdaa107379f93405f05d8d1ce3caef02ddfc7cf7b0948ec7120b960` | `docs/plan/runs/MB-1/sf7b.md` (was `2f11be97…8255`; only the L3 timing note added) |
| `c68e01d570be0271ef489416fffe735c820bc0fc20aeaf6f81ca38de42c991bd` | `docs/evidence/MB-1/final-2026-10-27T0905Z.md` (SF-7's review; the 08:35 cycle, per Codex; not edited) |
| `dddba54392ca3e4c5e5870f6eebe397f961b02cc0e4fd3ee67323949513ed407` | `docs/evidence/MB-1/final-2026-10-27T0905Z-collected.md` (SF-7b's own final; the 09:05 cycle; not edited) |
| `0cefa2469579947aa71a3dbb9d8394913a53496cb3cd45fc2482ca3d1112c528` | `docs/evidence/MB-1/final-2026-10-27T0935Z-collected.md` (SF-7b's review; the 09:35 cycle; not edited) |
| `d07e968613b0bc7d349e9a95a4c2547768c8c52eac9d63657efb919caecb7955` | `docs/plan/runs/MB-1/sf7.md` (unchanged) |
| `8c88fd14d9a469e85250c4e1be5813f65dd2866269d1dfcf38d56565426677c7` | `docs/plan/runs/MB-1/phase2-plan.md` (unchanged) |
| `ac262f39fc6962345f64982e36c6b2aa7f8f3418829fd653684002f2f2c1bdc3` | the candidate migration (unchanged) |
| `67a3591105da6cc41032b8c4dc72680ae65cd93751dc594ee5918f7654481b94` | `supabase/config.toml` (unchanged) |

The SF-7b handoff (`1be49b11…c057`) is superseded. Its hash table and the SF-7 tables it carried follow verbatim. Its
`checkpoint.md` and `sf7b.md` rows are superseded by the rows above.

### Carried from the SF-7b handoff (verbatim)

| sha256 | File |
|---|---|
| `2f11be97d3a9d6b1b73c860ffa5d70d0a68a4f26b8e59e47e911e5d18cf78255` | `docs/plan/runs/MB-1/sf7b.md` (new) |
| `3ad91e607fb8ddb8d40cb323a10c293a13bbaa1070699090301cdcdde300259b` | `docs/plan/runs/MB-1/checkpoint.md` (was `24509acc…0fb2`) |
| `c68e01d570be0271ef489416fffe735c820bc0fc20aeaf6f81ca38de42c991bd` | `docs/evidence/MB-1/final-2026-10-27T0905Z.md` (the raw final; not edited) |
| `d07e968613b0bc7d349e9a95a4c2547768c8c52eac9d63657efb919caecb7955` | `docs/plan/runs/MB-1/sf7.md` (unchanged) |
| `8c88fd14d9a469e85250c4e1be5813f65dd2866269d1dfcf38d56565426677c7` | `docs/plan/runs/MB-1/phase2-plan.md` (unchanged) |
| `ac262f39fc6962345f64982e36c6b2aa7f8f3418829fd653684002f2f2c1bdc3` | the candidate migration (unchanged) |
| `67a3591105da6cc41032b8c4dc72680ae65cd93751dc594ee5918f7654481b94` | `supabase/config.toml` (unchanged) |

The previous handoff (SF-7, `fc2b6a66…2cde`) is superseded. `sf7.md` §6 points here for the patch hashes, so its three
hash tables are carried below verbatim (values as SF-7 executed them; not re-hashed in SF-7b).

### Carried from the SF-7 handoff (verbatim)

**Unchanged (re-hashed in this phase, each equal to the previous handoff):**

| sha256 | File |
|---|---|
| `ac262f39fc6962345f64982e36c6b2aa7f8f3418829fd653684002f2f2c1bdc3` | `supabase/migrations/20261026040045_mb1_live_session_guard.sql` |
| `67a3591105da6cc41032b8c4dc72680ae65cd93751dc594ee5918f7654481b94` | `supabase/config.toml` |
| `8ba686dbdea606484af49fbfe6836283945c27805355fa2586e61614fae34f78` | `docs/plan/runs/MB-1/phase1.md` |
| `d3e2773e5e738b99188cd5052d98abf0ecca72157309461c8e38dda343c39cc8` | `docs/plan/runs/MB-1/phase1i.md` |
| `0bdcecdf63d894e895a7e8a18b7261724964b585a4f9934ee1d738fec38ea7b1` | `docs/plan/runs/MB-1/phase2.md` |
| `556bdd9f757bd45e9a131bae9ce2251f19e1d81d61c12047b982491ad08411f2` | `docs/evidence/MB-1/sf0/sf0-split.mjs` (the verifier; not executed; L2 accepted) |
| `37c9e3e1c6f90ccf32cd33fa73f1cd06e08aca1327498e4b63ccb5d55103308c` | `docs/evidence/MB-1/final-2026-10-27T0405Z.md` |
| `8169a12ec6bd3517f296196ffed5e0682617b2d1ef6f5e8dd08b250c84609722` | `docs/evidence/MB-1/sf0-mutations/B2.patch` |
| `c43a9b6d7ef5394d6097eae4b9005239efde9a82863ad39771e1b0a052b9e524` | `docs/evidence/MB-1/sf0-mutations/P.patch` |
| `c1a5d5aa1f555d5c68831c53cfa7aa995ef4a7fae3f4a0463ace98175e2282f8` | `docs/evidence/MB-1/sf0-mutations/Q.patch` |
| `90122320483cdcf8c4c87c2a9caad334ad229f30d40f06983c5c47a1091e64d8` | `docs/evidence/MB-1/sf0-mutations/R.patch` |
| `08f5664043ff4e1e9bc78dc7a2fca46d5aa1f32b5a74c52dd38e9060ebf5c05a` | `docs/evidence/MB-1/sf0-mutations/S.patch` |
| `c3bad3d4572943f7f09493845b9aceabe3a3ab105fbb3f305fbe07f519a64ce1` | `docs/evidence/MB-1/sf0-mutations/U.patch` |
| `8f34ab894fec8ba2733d4d318ed26043ff4e14a6abc3be82dbcdfdf7ce211ce4` | `docs/evidence/MB-1/sf0-mutations/T.patch` |
| `ecb76e288acfde413aee006114d68e52ce5b42dfb45cb121ccd1893b6af513e3` | `docs/evidence/MB-1/sf0-mutations/X.patch` |
| `47a7992b0badd578eb4ee63b1f933bc4fc7946c2642deef27c0dd266da5f2d4e` | `docs/evidence/MB-1/sf0-mutations/V.patch` |
| `febf72ba675cbff7e3211cf208d918d493fcce4060b91cbf01ece91ecb8ff2ef` | `docs/evidence/MB-1/sf0-mutations/W.patch` |
| `88e082fd4b99681bf45d853b75d1e9d7caa04ad363d7321a0d76f7987f4058f9` | `docs/evidence/MB-1/sf0-mutations/M2.patch` |

The 11 phase 1I patches (full values in `sf0.md` §6) and the three §8 inventory files (`phase2-plan.md` §8) also re-hash
equal. The four CLI files and the runner evidence files were not touched or hashed (their values stand in earlier records).

**New or first recorded in this phase:**

| sha256 | File |
|---|---|
| `d07e968613b0bc7d349e9a95a4c2547768c8c52eac9d63657efb919caecb7955` | `docs/plan/runs/MB-1/sf7.md` |
| `635096661e033ad916219448b339b40c9a955f915319dd6c7c2da2d99ae9acca` | `docs/evidence/MB-1/final-2026-10-27T0605Z.md` (the review copy this phase follows; not edited) |
| `ceb7969d4d20c916d6381181384f404343bc819707f32804310db9e0b3aaa5ff` | `docs/evidence/MB-1/final-2026-10-27T0535Z.md` (not edited; 0605Z L3) |
| `830cbf2e723f69235a55685c243f52f280183a1d669056683a4828ddf11e66bb` | `sf7-mutations/B-label.patch` |
| `11c90cc41c7271502c60bc82c8b5b8e65444ea77d4a4e972a0e805609fe562aa` | `sf7-mutations/B-name.patch` |
| `1ed27449b5de2bc4254ee07748f2a9c7a60e555d8108fe9112164479a71e0c27` | `sf7-mutations/B-ip.patch` |
| `db4be73523edb278e505e1ff0075e363dec36a7884a58e350d9f0bb0572318ce` | `sf7-mutations/B-port.patch` |
| `76dbbe47852ff3b81b5e59c1af6ca2195b7a3778a877dbb852742dbb2d09aa08` | `sf7-mutations/B-others.patch` |
| `5999c9d165059b6c8e5f293eb7d8decc8d2002f97e427d8b7f25ca906f9ae5e0` | `sf7-mutations/B-count.patch` |
| `9bc66f75887c96706cc3129fdd61bb4718b9bf777b0ee6e53f8e818f5377d257` | `sf7-mutations/B-exit.patch` |
| `f51905675d0889027851051e35cce9f1666ee9e6ad37f345e0422e7f605345a9` | `sf7-mutations/R-count.patch` |
| `93141dd6c12efb5cedb0f6fe2fbb6d35f7dda46419e1d84bb3073e510d4c8ff1` | `sf7-mutations/R-exit.patch` |
| `4aee31ada5bae77ef2ed7121e6c58ece536ed30d4f4ee8a545616066a8307209` | `sf7-mutations/W-equal.patch` |
| `9b7c7d637263fb7dd77c367435ccac65fa02588800b34b223ca31bc249c74852` | `sf7-mutations/R-guards.patch` |
| `7f7c7cba1eece7532af32a4fa9a4644e7d95a73d36f820f4936f45075c8dfe47` | `sf7-mutations/R-call.patch` |
| `6597745b42d51316fa94d90e754dabf7605edbc4b3426fb8deda6bd1cedc4f7c` | `sf7-mutations/W-before.patch` |
| `c139e7813cc521b55e94c072cd0600e3e6c1805a600fa7faa6242a553ba173e4` | `sf7-mutations/W-after.patch` |
| `f8bd54c8ad69be8c4a6a437837a65634c5939785de0b4d0728501f2987f9cdd2` | `sf7-mutations/W-running.patch` |
| `2e86c9f938387aad43f64460792257c9c2d149585326903f6022582bc0960a42` | `sf7-mutations/W-problems.patch` |
| `b28bfa0d59dc05ef425d2dfbf7673193570cec5204fb64c8d334bc4386f530a1` | `sf7-mutations/S-pin.patch` |

**Edited in this phase** (the previous values are superseded):

| sha256 | File |
|---|---|
| `24509acc07050811d36d37aee96fcf530a2b4ea8aa53489511c95d4a82ff0fb2` | `docs/plan/runs/MB-1/checkpoint.md` (was `a2ffbd4b1e0746097b0aa5a42ac15fdcac767bf6e04ceeeea2a52db0de2bae6c`) |
| `25f08ae5948b2c087ff2a74990846744376b47031ce7dd4ab25aea725cdcf863` | `docs/plan/runs/MB-1/sf0.md` (was `e155c8e05b1992d43eb99ea5f04caed64241cca7b2ac19ec7b30a2f5e0ad0048`; the L3 corrections) |
| `8c88fd14d9a469e85250c4e1be5813f65dd2866269d1dfcf38d56565426677c7` | `docs/plan/runs/MB-1/phase2-plan.md` (was `9ed9efe4b9c1c708b8d797531c89bb4cc104c45558428f702600c7cb6fdbd0b8`; an SF-7 status pointer, and §8's line 39 → 40) |

**Note on SF-7's patches after SF-7b:** SF-7b edited `binding.mjs`, `live.mjs`, `shared.mjs` and `mb1-replay.mjs`. Some of
these 17 patches may no longer apply with `git apply --check` at their old offsets. They were not re-checked here: the
mutation sequence was denied. Their hashes still identify the files.

**Note after SF-7c:** SF-7c edited `live.mjs` (code) and `mb1-replay.mjs` (comments only) again. No patch was re-checked:
no mutation or scratch tree was authorized.

**Note after SF-7d:** SF-7d edited `live.mjs` and `shared.mjs` (code) again; `mb1-replay.mjs` is unchanged. No patch was
re-checked and no hash was taken: no mutation or scratch tree was authorized, and `sha256sum` is not retried.

**Note after SF-7e:** SF-7e edited `mb1-replay.mjs` (code: `dispatch`; and comments) and, in comments only, `order.mjs`,
`shared.mjs` and the SF-7d test. It added `mb1-replay-sf7e.test.mjs`. No patch was re-checked and no hash was taken: no
mutation or scratch tree was authorized, and `sha256sum` is not retried.


## F4/G5 command-failure bounded acceptance — 2026-11-01T12:50:36.364685+00:00

Fresh independent local Claude review PASS, 14/14 synthetic tests, no critical/high findings or tool errors/denials. Codex independently checked phase-before diffs and accepted only this prerequisite. See [acceptance](../../../evidence/MB-1/harness-command-failure-accepted-2026-11-01.md). MB-1/QA-9 owns new environment.mjs/preview-account.mjs G5 residuals and projection diagnostics; other harness/target/whole-goal gates remain open. No further source/wording/test loop for accepted files. No integration/Done/status/ledger/DB/external action.


## Status-consumer prerequisite independently accepted — 2026-11-01T13:50:02.713074+00:00

Complete e16435ef implementer final collected/stopped, four scoped paths, zero errors/denials. Codex exact before-source comparison passes. Fresh independent local Claude3eb4a345 COMPLETE PASS, 4/4 pure source-reading tests, no C/H/M findings; audit {'Read': 11, 'Grep': 5, 'Bash': 1}, zero errors/denials. Same-session local print execution completed after background daemon failed before any call, no bypass. Acceptance: docs/evidence/MB-1/harness-status-consumers-accepted-2026-11-01.md. Seven prior accepted source hashes unchanged, seven current reviewed hashes unchanged. No duplicate accepted-test/source review needed. Preview auth-response diagnostics/login.ok and projection diagnostics retain MB1/QA9G5 owners; stale comments nonblocking MB1. WholeMB1 stays0/4, other harness/target/runtime gates open. No merge/newDone/status/GOALS/ledger/DB/push/deploy/external action. User files/environments preserved. No owner action. Main35c84e3/DS3fd79c12 and fiveDone confirmed, OW1/OW2/QA1/AR1 done; no repeat implementation. Integration/ready-wave/status chats completed/inactive; native workers reconciled, no overlap. Build/sync/diff checks pass114goals/230dependencies/94rows; corrected unsupported status sync call recorded. Supabase skill/official CLI reference consulted; no CLI convention change, markdown changelog renderer unsupported.


## Preview auth-response bounded acceptance — 2026-11-01T14:50:59.793027+00:00

Codex acting under explicit owner delegation AUTH-01 accepts the existing preview-auth response safety prerequisite ONLY. Implementer596e6e6d complete final collected; Read10/Grep3/Write3/Edit13, exactlyfive assignedpaths, no errors/denials. Fresh independent authenticated localClaude fb34c471-1f86-4b66-874d-da9f9e6d421f COMPLETE PASS-bounded collected; Read12/Grep6/Bash2, no errors/denials. Exactly two separately authorized synthetic test commands ONCE each: preview-response9/9 and status-consumers4/4,13PASS0FAIL. Full final, implementer/reviewer audits and raw TAP are adjacent harness-preview-response-* records. No live consumer/auth/CLI/DB/network/account execution. Historical denied sequences parked without alternate retry.

Codex independently compared phase-before consumer bytes: only helper import/create/signin substitutions; all loopback/fetch/onboarding/private-file details preserved. Nine source SHA256 hashes rechecked unchanged after review; five prior accepted status-helper/environment hashes retained. Fixed closed-message fresh errors catch JSON failures unread and non-ok sign-in refuses before body parsing/onboarding. Both pure tests independently inspected for safe scope. No RED/mutation/real-auth/release/device proof. Implementer UNRUN statements are historical, superseded only for these two commands. Source tests provide bounded evidence, no general static-analysis guarantee.

Remaining low findings assigned, no optional polish loop: L1 helper purity future regression hardening MB1/QA9; L2 stricter whitespace/own-property validation MB1 (current nonempty-string contract satisfied; do not rely on the review's general claim that JSON can never expose inherited properties); L3 fetch rejection diagnostics/timeouts/cleanup MB1/QA9 G4/F3; L4 existing credential-file/symlink/mode hardening MB1; L5 historical UNRUN/hash evidence covered by this acceptance. These do not block the scoped result. Projection diagnostics and G1-G4/G6/G7/executor/target binding/live isolation/wholeMB1 remain open0/4. No wholeG5/goal/ledger acceptance, no merge/newDone/status/GOALS/DB/push/deploy/external action. Main35c84e3/fiveDone unchanged. Do not repeat accepted source/wording/test review.

Evidence: docs/evidence/MB-1/harness-preview-response-accepted-2026-11-01.md.


## Projection diagnostic prerequisite independently accepted — 2026-11-02T03:49:41.619636+00:00

Codex acting under owner delegation AUTH-01 accepts ONLY the MB1/QA9G5 projection diagnostic-safety prerequisite. Implementer351f8cee COMPLETE, exactlyfourpaths, Read9/Grep9/Write3/Edit4,zeroerrors/denials. Independent reviewerf2879568-0b5a-4303-898c-aafe3e7461c6 COMPLETE PASS: Read7/Grep3/Bash1,zeroerrors/denials,C0/H0/M0/L6. Exact authorized pure test ONCE passed11/11. Fullfinal/audit/rawTAP/fourhashes/consumerdiff durably collected in docs/evidence/MB-1/harness-projection-*. Codex independently verified exact consumer bytes and unchanged four SHA256s. No live consumer/DB/CLI/network executed. No RED/mutation/device/backend proof or wholeG5/goal acceptance.

L1hardcoded target/L2false-positive assert.throws remain MB1/QA9; L3fixed opaque diagnostic is accepted scoped design; L4positive assertion output remains wholeG5; L5consumer fixture coverage resolved for this phase by exact before-source diff; L6historical UNRUN/hash record is superseded only for the one executed pure test and coordinator hash check. No optional polish or accepted test rerun. Other harness/runtime/MB1 boxes open0/4. No integration/newDone/status/GOALS/ledger/push/deploy/external action; main35c84e3/fiveDone unchanged. No owner action, project incomplete.

Evidence: docs/evidence/MB-1/harness-projection-accepted-2026-11-02.md
