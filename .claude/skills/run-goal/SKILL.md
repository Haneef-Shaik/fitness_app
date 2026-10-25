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

`show` prints the goal's needs, its **Done when** boxes and the acceptance-ledger rows it helps
prove. Every goal under **needs** must be Done. If one is not, **stop**:
- under the orchestrator, report `STATUS: blocked`;
- by hand, tell the person which need is open.

By hand only, claim it:
`node scripts/plan/status.mjs set <ID> start --who <lane> --ref plan/<id>-<slug>`.

## 2. Branch and environment

- Branch name: `plan/<id-lowercase>-<short-slug>`, for example `plan/mb-3-durable-outbox`.
  - Under the orchestrator, rename the worktree's branch: `git branch -m plan/<id>-<slug>`.
  - By hand: `git switch -c plan/<id>-<slug>` from an up-to-date `main`.
- In a fresh worktree, install once: `pnpm install --frozen-lockfile` at the root.
- If the goal touches `supabase/`, `packages/domain/`, `scripts/backend/` or `apps/mobile/src/data/`,
  start the **local** stack: `pnpm exec supabase start`. Backend tests refuse any other backend.
  Never point a test at staging or production. Never reset a database other than the local one.
- **Resume, don't restart.** If `docs/plan/runs/<ID>/checkpoint.md` exists on your branch, read it
  first and continue from where it says.

## 3. Read before you touch anything

1. **The card.** `status.mjs show <ID>` gives its anchor in `docs/plan/GOALS.md`. Read the whole
   card: outcome, PRD line, scope, existing work and Done when.
2. **The PRD sections** on the card's **PRD** line, in `docs/PRD.md`. The PRD wins any conflict.
3. **The screens.** For a screen goal, read the Figma frames named on the card, through
   `docs/22-UI-MOMENTUM.md` and its live screen evidence links.
4. **`docs/23-MASTER-PLAN.md`:** §5 (lanes and file ownership), §7 (evidence and gates) and §9
   (standing rules).
5. **Existing work.** Read the code the card's **Existing work** line names. Verify it against the
   card. Adopt it if it holds; otherwise replace it. It is never evidence on its own.
6. **Earlier handoffs.** Read the handoffs in `docs/09-PROJECT-TRACKER.md` from the goals yours needs.
   Verify what they claim; do not assume it.
7. **On a retry** (under the orchestrator): read the earlier verifier verdicts in your task. They say
   exactly what was missing.

## 4. Standing rules

These are the rules in `docs/23` §9. In short:

- **TDD.** Write the test first and see it fail. Mutation-check every guard: break it on purpose, see
  a named test fail, and record that output. The `tdd-guide` sub-agent can plan the tests with you.
- **Stay in your lane's files** (docs/23 §5). A change needed in a file another lane owns goes in the
  handoff as a request, unless the card names that file.
- **Quality only goes up.** Never lower a threshold, skip a test or weaken an assertion to get green.
- **Tokens and strings.** Colours, fonts and sizes come from the theme. Every user-facing string goes
  through `t()`.
- **Contract first (SP3).** Migrations and the contract package merge before the screens that use
  them. Migrations are append-only: never edit one that is already on `main`.
- **Product invariants** (docs/23 §9 rule 6) hold, among them:
  - no staff access to private health data;
  - integer money and append-only finance;
  - a durable local acknowledgement before "logged";
  - AI output counts only after the member confirms it.
- **Nothing outward-facing.** No pushes, deploys, store actions, real messages, payments or paid
  provider calls, unless the card is an owner-approved PL or OW step that names them. Never commit
  secrets, personal data or licensed media; the repo is public.
- **Verify, don't assert.** Measurements beat claims. Record the method, device, release build and
  sample size.
- **Commits:** the house format with the goal id in each subject, for example
  `feat(MB-3): durable set outbox`.

## 5. Work in steps, with a checkpoint after each

Work through the card's scope in order. After each step:
1. commit;
2. update `docs/plan/runs/<ID>/checkpoint.md`: steps done, the next step, anything surprising;
3. commit it.

If you run out of turns, the next session resumes from the checkpoint. If the scope turns out wrong
(missing something, or partly done already), note it in the checkpoint and the handoff. Do not
quietly change the goal or its card.

**Never rewrite history on your branch**: no `git reset`, `git rebase -i`, `git commit --amend` on
pushed or checkpointed commits, and no deleting commits. To undo a step, add a revert commit. A later
attempt or a rollback may need every commit you made.

## 6. Prove each box, and write ledger results only if you are the last prover

- Put each box's evidence where `docs/23` §7 says:
  - a test you ran;
  - a command's result line;
  - a file in `docs/evidence/<ID>/` (a measurement note states method, device, build and sample size);
  - a capture beside its Figma frame.
- **Acceptance ledger.** `status.mjs show <ID>` lists the ledger rows your goal appears in. If your
  goal is the **last** goal in a row's *Proved by* list, set that row's result in
  `docs/plan/ACCEPTANCE.md`:
  `pass · YYYY-MM-DD · <builds or environment> · <evidence path or run link>`. If you are not the
  last prover, put your evidence in the handoff only, and never edit the row.
- Run `node scripts/plan/build.mjs --check` after any change to `GOALS.md` or `ACCEPTANCE.md`.

## 7. Review your own diff

When the scope is done, run these sub-agents on `git diff main...HEAD`:
- `code-reviewer`;
- `security-reviewer` (for routes, RPCs, policies, auth, storage, imports, AI or user data);
- `tdd-guide`, to audit the tests.

Fix every critical and high finding, then list the rest in the handoff.

## 8. Run the standard gates the diff touches

These are the `docs/23` §7 gates:

```bash
pnpm check                                                    # always
pnpm backend:test                                             # if supabase/, packages/domain/, scripts/backend/ or src/data/ changed
pnpm --filter @fitlog/mobile exec expo export --platform ios --platform android --output-dir .expo/export-native   # if apps/mobile/ changed
```

Also run the journey suite (once QA-11 is Done) for any box that names a scenario on a release
build. Keep the exact commands and their result lines for the handoff.

## 9. Write the handoff

Write `docs/plan/runs/<ID>/handoff.md` and commit it. The verifier reads only this, the card and the
diff, so make it checkable:

```markdown
# Handoff — <ID> · <title>        attempt <n> · <branch> · <HEAD>

**Outcome claimed.** <one sentence>

## Done when
| Box | Met | Evidence |
|-----|-----|----------|
| <box text, verbatim> | yes/no | <test name + command + result line, measurement file, capture path, or run link> |

## Acceptance evidence
| Ledger row | Run (build or environment, date) | Result | Evidence | Row written here? |
|------------|----------------------------------|--------|----------|-------------------|

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
## Decisions forced (for the tracker decision log)
## Traps hit
```

## 10. Finish

- **Under the orchestrator:** stop here. Do not change status. End with the summary block from your
  agent definition.
- **By hand:**
  1. Run `node scripts/plan/status.mjs set <ID> review --who <lane> --ref "<PR or commit>"`.
  2. Have the goal verified with the `verify-goal` skill (or the `goal-verifier` agent) before
     merging.
  3. Once it is merged to `main`, run
     `node scripts/plan/status.mjs set <ID> done --who <lane> --ref <commit>`. It refuses while a
     need is open, and it prints which goals that unblocks.
  4. Append the handoff to the handoff log in `docs/09-PROJECT-TRACKER.md`, starting with
     `<!-- handoff:<ID>:<short hash> -->`. Add any decision the goal forced to the decision log.
  5. Commit `docs/plan/status.json` and `docs/plan/activity.json` along with the bookkeeping.
