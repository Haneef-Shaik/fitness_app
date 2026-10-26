# Execution handoff — 25 October 2026

The owner requested Codex as the main coordinator, Claude as the implementation executor,
and execution until the app meets the complete plan. The owner then clarified: use the locally
installed Claude first, with cloud only as a fallback if local execution cannot work. This supersedes
the older choice of Claude as the top-level coordinator in ORCHESTRATOR.md. It authorizes
implementation and coordination; it does not supply missing accounts, legal approvals,
device results, field studies or provider credentials.

## Responsibilities and completion

Codex selects dependency-ready work, assigns a bounded goal to Claude, reviews the resulting
diff and test evidence, requests corrections, and integrates only verified work. Claude's
`goal-implementer`, `code-reviewer`, `security-reviewer`, `tdd-guide` and `goal-verifier`
definitions and their goal procedures remain useful. A fresh verifier must check each
Done-when box. Status changes use `scripts/plan/status.mjs`; a goal is Done only after
verification and integration on `main`. Milestone acceptance rows and Exit checks still apply.

PRD.md owns requirements; GOALS.md owns the goal contracts; status.json owns live state;
ACCEPTANCE.md owns release evidence. Do not tick a goal to bypass an open dependency.
Keep backend contracts ahead of dependent screens, serialize integration and shared database
operations, and preserve the existing uncommitted foundation during bootstrap.

## Observed state

These are observations from this session, not completed goal claims:

- Bootstrap began on `v2/develop` at `846fd1f` with extensive existing work. The canonical checkout
  is now on local `main`; implementation commit `67e6d1c` contains the reviewed foundation. Unrelated
  marketing artifacts, review screenshots, error.log and ignored environments were preserved.
- 114 goals, 230 dependencies, 94 acceptance-ledger rows. OW-1 and QA-1 are Done after independent
  passes on attempt 2 and integration. OW-2's dependency register records the owner's fresh-launch
  decision (MIG-01); all three boxes independently passed and `b4771d0` is integrated on main.
  OW-2 is Done. OW-9 requires field work. Next ready technical goals include AR-1, QA-9, PL-1 and DS-1–DS-3;
  respect SP0 before contract-dependent feature work.
- `pnpm check` passed before this handoff: TypeScript, lint/design rules, 10 domain tests,
  126 mobile tests, 22 planner tests and contract/ledger validation on the reviewed foundation.
  This is not native-device or release acceptance evidence.
- Claude Code is installed and its login is confirmed with normal macOS keychain access.
  Sandboxed commands report no login because they cannot access that keychain. Launch the
  bounded local Claude worker through the approved execution tool; do not copy credentials.
- A minimal authenticated Claude request returned `READY`. Claude implemented the backend
  portability fix in seven scripts; Codex verified syntax and all four backend suites, including
  a second run with RTK absent from PATH. Native Android/iOS JavaScript exports also passed.
  Results and limits are in [bootstrap-gates.md](../evidence/QA-1/bootstrap-gates.md).
- Claude's security review found a High deep-link session-injection issue. Claude implemented the
  PKCE-only fix after a RED regression test; the full check now passes 126 mobile tests, 10 domain
  tests and 22 planner tests. A fragment-guard mutation in a scratch copy fails four behavioral
  tests. Independent security review confirms F-1 is closed by reading; real-device/provider
  acceptance remains unproved. Code-review findings and fresh-stack reproducibility corrections
  are recorded under `docs/evidence/QA-1/`.
- Codex Cloud task listing succeeded and returned no tasks. That does not establish whether
  an environment exists. No target environment ID has been supplied or cloud task launched.
- The current chat and filesystem are local. The extensive uncommitted foundation is not
  available to a remote checkout merely because cloud access works.
- ORCHESTRATOR.md O2–O5 remain unimplemented: `status.mjs next --slots 1` is unsupported;
  there is no working continuous scheduler, recovery ledger, runner or kill-drill evidence.
  Do not represent the existing agent prompts as an operating unattended service.
- The owner explicitly approved hourly local supervision on 25 October. The thread heartbeat
  `fitlog-coordinate-local-claude-delivery` is ACTIVE and resumes this chat hourly for bounded
  Codex-coordinated local Claude work. This is distinct from the unimplemented O2–O5 Claude runner.
  The owner also confirmed a fresh launch with no existing users or data redirected; DEC-15 is
  recorded as not applicable through completed OW-2.

## Active worker

AR-1 phase2A contract corrections are accepted as intermediate checkpoint `22c5386`, still isolated
and unmerged. Independent [review3](../evidence/AR-1/p2a-review3.json) PASS is based on code reading,
conditional on tests/typecheck; coordinator `pnpm check` (179 tests) fulfills those conditions.
CI-mode negative/positive baseline and literal workflow-script probes pass. Hosted CI is unproved.
Low nonblocking F1 (weight-only/body-fat-only acceptance vectors) is assigned to MB-6.
[Checkpoint disposition](../evidence/AR-1/phase2A-acceptance.md).

Proposal PR-1..6 revision2 is checkpointed on the isolated goal branch at `3040ccf`; the completed
docs worker is stopped. Durable review copies were independently parsed and matched to canonical
records. Focused independent proposal review3 is running: tool session89597,
`/tmp/fitlog-ar1-proposal-review3.jsonl`. It checks restore tombstones, rejected-request counting
(including lock/subtransaction races), actor identity, replay policy and truthful evidence.

Fixture continuation: `7caf2e6b-6b7a-4fca-9eb5-448e1f3fdb6e` (`7caf2e6b`), same phase2B files.
The old71d2d674 worker stalled at another unlisted read-only `rtk ls`. It was stopped; the resumed
worker now uses `dontAsk`: unlisted commands are denied automatically, not approved, while file
reads/edits and exact scoped test commands remain explicitly allowed. It must use file tools and
report any tests it cannot run. No broad shell grant or bypass mode is enabled.

No SQL fixture is executed yet. Read-only preparation confirmed the local PostgreSQL image is
`public.ecr.aws/supabase/postgres:17.11.0.004` and inspected the installed `db diff --help`.
No database was created, reset, upgraded or migrated. Future SQL/replay must use a disposable
isolated test database and preserve all historical/user data.

Checkout: `/Users/Adya/.codex/worktrees/fitlog-ar1/fitness_app`, `codex/ar1-contract-freeze`.
Read [supervisor state](runs/AR-1/supervisor.json) first. Collect proposal review3 and the fixture
output, verify each, then run persisted-contract comparison and full migration replay/diff in
isolation. One owner approval of the completed ADR and final all-box verification/integration
remain required before AR-1 Done.

## Resume order

1. Use the authenticated local Claude worker, with Codex assigning and checking bounded tasks.
   Do not paste tokens into chat or repository files. If login appears absent, distinguish a
   sandbox keychain restriction from an actual signed-out session before asking the owner.
2. Use cloud only if local execution cannot work. In that case identify the actual environment
   and verify Claude installation/authentication there. Local credentials are not automatically
   cloud credentials. Establish the repository revision and transfer reviewed foundation commits
   before dispatching work against that checkout.
3. OW-1, QA-1 and OW-2 are complete and integrated on main. OW-2's DEC-15 answer is MIG-01;
   all other external approvals remain unresolved.
   OW-9 requires real field work. Do not invent owner approval or completion.
4. Inspect the AR-1 worker above and review its bounded phase output. Continue executable contract,
   replay and shared-fixture work in that worktree after review; obtain specific owner approval of
   the concrete ADR before declaring AR-1 Done. Preserve unrelated local changes.
5. Execute dependency-ready goals through implement → independent verify → integrate → status.
   The approved hourly heartbeat provides bounded Codex supervision between chat turns. Reconcile
   running workers and checkpoints before dispatch. O2–O5 must still be implemented and verified
   before claiming the older Claude runner's unattended execution or crash-recovery guarantees.
6. Continue through all milestone gates. Accounts, licensed assets, physical release-device
   evidence, legal review and real pilot durations remain external dependencies until proved.

Cloud environment setup follows the [official environment guide](https://learn.chatgpt.com/docs/environments/cloud-environments).
