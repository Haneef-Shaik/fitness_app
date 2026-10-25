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

- Branch: `v2/develop`, HEAD `846fd1f`, with extensive existing modified and untracked work.
- 114 goals, 230 dependencies, 94 acceptance-ledger rows. OW-1 passed independent documentary
  verification on attempt 2 and is In review, pending integration on `main`. OW-2's dependency
  register is prepared but DEC-15 awaits the owner. OW-9 requires field work. No goal is Done yet.
- `pnpm check` passed before this handoff: TypeScript, lint/design rules, 10 domain tests,
  27 mobile tests, 21 planner tests and contract/ledger validation. New planner sync tests
  are additional checks. This is not backend, native-device or release acceptance evidence.
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

## Resume order

1. Use the authenticated local Claude worker, with Codex assigning and checking bounded tasks.
   Do not paste tokens into chat or repository files. If login appears absent, distinguish a
   sandbox keychain restriction from an actual signed-out session before asking the owner.
2. Use cloud only if local execution cannot work. In that case identify the actual environment
   and verify Claude installation/authentication there. Local credentials are not automatically
   cloud credentials. Establish the repository revision and transfer reviewed foundation commits
   before dispatching work against that checkout.
3. Reconcile OW-1 against the existing dated Momentum decision and documented Figma gaps.
   Prepare OW-2's dependency register from known evidence, leaving actual external approvals
   unresolved. OW-9 requires real field work. Do not invent owner approval or completion.
4. Review/adopt the foundation through QA-1, retain all unrelated local changes, run the full
   card gates, and integrate the reviewed baseline on `main` before creating feature worktrees.
5. Execute dependency-ready goals through implement → independent verify → integrate → status.
   Manual Codex coordination can precede the automated scheduler. Before enabling unattended
   execution, implement and verify O2–O5, including interruption recovery and explicit limits.
6. Continue through all milestone gates. Accounts, licensed assets, physical release-device
   evidence, legal review and real pilot durations remain external dependencies until proved.

Cloud environment setup follows the [official environment guide](https://learn.chatgpt.com/docs/environments/cloud-environments).
