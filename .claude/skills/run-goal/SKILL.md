---
name: run-goal
description: How to run one FitLog master-plan goal end to end, from the entry gate through test-first implementation, standing rules and checkpoints to the handoff file with evidence. Use when implementing a goal from docs/plan/GOALS.md, by hand (/run-goal DS-1) or as goal-implementer under plan-orchestrator.
argument-hint: "[goal-id]"
---

# Run one plan goal

The goal id comes with this skill (`/run-goal DS-1`) or in your task. One goal per session.

## 0. Which mode you are in

- **Under the orchestrator** (you are `goal-implementer`):
  - the orchestrator has already claimed the goal;
  - you are in an isolated git worktree branched from `main`;
  - you never change the goal's status;
  - you end with the summary block from your agent definition.
- **By hand** (a person typed `/run-goal <ID>` in the main checkout):
  - you claim the goal yourself and work on a branch;
  - you follow the by-hand close-out in step 9.

**Never write `docs/plan/status.json` or `docs/plan/activity.json` from a worktree.** Statuses live
in the main checkout. A worktree's copy is a snapshot from when it branched.

## 1. Entry gate

```bash
node scripts/plan/status.mjs show <ID>
```

Every goal under **needs** must be Done. If one is not, **stop**:
- under the orchestrator, report `STATUS: blocked`;
- by hand, tell the person which need is open.

By hand only, claim it:
`node scripts/plan/status.mjs set <ID> start --who <lane> --ref plan/<id>-<slug>`.

## 2. Branch and environment

- Branch name: `plan/<id-lowercase>-<short-slug>`, for example `plan/ds-1-colour-tokens`.
  - Under the orchestrator, rename the worktree's branch: `git branch -m plan/<id>-<slug>`.
  - By hand: `git switch -c plan/<id>-<slug>` from an up-to-date `main`.
- In a fresh worktree, install once:
  - `pnpm install --frozen-lockfile` at the root;
  - `uv sync` in `services/api` if you will touch or test the API.
- Tests that need Postgres use `TEST_DATABASE_URL` when it is set. Never drop or reset any database
  other than a test database.
- **Resume, don't restart.** If `docs/plan/runs/<ID>/checkpoint.md` exists on your branch, read it
  first and continue from where it says.

## 3. Read before you touch anything

1. The card: `status.mjs show <ID>` gives its anchor in `docs/plan/GOALS.md`. Read the whole card:
   outcome, scope, Done when.
2. Every doc and line range the card names. For a G-numbered goal, its section in
   `docs/17-GYMS-IMPLEMENTATION-PLAN.md` §4. For a screen goal, the Figma pages in `docs/22`.
3. `docs/23-MASTER-PLAN.md` §5 (lanes and file ownership) and §9 (standing rules).
4. The handoff records in `docs/09-PROJECT-TRACKER.md` from the goals yours needs. Verify what they
   claim; do not assume it.
5. Under the orchestrator, on a retry: the earlier verifier verdicts in your task. They say exactly
   what was missing.

## 4. Standing rules

- **TDD.** Write the test first and see it fail. Mutation-check every guard: break it on purpose, see
  a named test fail, and record that output. The `tdd-guide` sub-agent can plan the tests with you.
- **Stay in your lane's files** (docs/23 §5). A change needed in a shared file another lane owns goes
  in the handoff as a request.
- **Coverage only goes up.** Never lower a threshold, skip a test or weaken an assertion to get green.
- **Strings through `t()`** on every screen you touch once G14.app is Done. Add the directory to the
  source-scan guard.
- **Invariants** I1–I24 hold. AI output is a proposal the user confirms.
- **No cloud, nothing outward-facing.** No pushes, deploys, store actions, emails or payments. Never
  commit secrets, purchased media or user data; the repo is public.
- **Verify, don't assert.** Measurements beat claims: p95, request counts, screenshots.
- **Commits:** the house format (`feat:`, `fix:`, `test:`, `docs:` …) and the goal id in each
  subject, for example `feat(DS-1): Momentum colour roles`.

## 5. Work in steps, with a checkpoint after each

Work through the card's scope in order. After each step:
1. commit;
2. update `docs/plan/runs/<ID>/checkpoint.md`: steps done, the next step, anything surprising;
3. commit it.

If you run out of turns, the next session resumes from it. If the scope turns out wrong (missing
something, or partly done already), note it in the checkpoint and the handoff. Do not quietly change
the goal.

**Never rewrite history on your branch**: no `git reset`, `git rebase -i`, `git commit --amend` on
pushed or checkpointed commits, and no deleting commits. To undo a step, add a revert commit. A later
attempt or a rollback may need every commit you made.

## 6. Review your own diff

When the scope is done, run these sub-agents on `git diff main...HEAD`:
- `code-reviewer`;
- `security-reviewer` (for routes, auth, storage, imports, AI or user data);
- `tdd-guide`, to audit the tests.

Fix every critical and high finding, then list the rest in the handoff.

## 7. Run the gates your change touches

```bash
cd services/api && uv run pytest -q && uv run ruff check . && uv run alembic check   # backend
pnpm --filter @fitlog/mobile typecheck && pnpm --filter @fitlog/mobile test:ci        # mobile
node --test scripts/plan/lib.test.mjs                                                  # plan tooling
```

Keep the exact commands and their result lines for the handoff.

## 8. Write the handoff

Write `docs/plan/runs/<ID>/handoff.md` and commit it. The verifier reads only this, the card and the
diff, so make it checkable:

```markdown
# Handoff — <ID> · <title>        attempt <n> · <branch> · <HEAD>

**Outcome claimed.** <one sentence>

## Done when
| Box | Met | Evidence |
|-----|-----|----------|
| <box text> | yes/no | <test name + command + result line, measurement, or file:line> |

## Gates
| Gate | Command | Result |
|------|---------|--------|

## Inherited and used
| From | Claim | Held? |
|------|-------|-------|

## Mutation checks
<guard → how it was broken → which test failed (output line)>

## Review findings left open
<severity · file:line · finding · why it is left>

## Left undone, and why
## Found for other goals
## Requests for other lanes' files
## Traps hit
```

## 9. Finish

- **Under the orchestrator:** stop here. Do not change status. End with the summary block from your
  agent definition.
- **By hand:**
  1. `node scripts/plan/status.mjs set <ID> review --who <lane> --ref "<PR or commit>"`.
  2. Once merged to `main`: `node scripts/plan/status.mjs set <ID> done --who <lane> --ref <commit>`.
     It prints which goals that unblocks.
  3. Append the handoff to the `docs/09` changelog.
  4. Record any decision the goal forced in charter §6. docs/17 reserves D36–D46 for G13–G21.
  5. Commit `docs/plan/status.json` and `docs/plan/activity.json` along with the work.
