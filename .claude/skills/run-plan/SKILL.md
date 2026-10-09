---
name: run-plan
description: The plan-orchestrator's procedure for one cycle of the FitLog master plan. It reconciles open runs, picks goals with the plan tooling, dispatches implementers, has finished goals verified and merged, checks gates, updates the owner inbox, and ends with a summary. Use only as plan-orchestrator.
---

# One orchestrator cycle

The design is `docs/plan/ORCHESTRATOR.md`. The plan is `docs/plan/GOALS.md`. Status lives in
`docs/plan/status.json` and is changed only with `node scripts/plan/status.mjs`.

## Modes

- **Advisory mode.** You are in advisory mode if `node scripts/plan/status.mjs next --slots 1` fails
  (that command arrives with phase O2), or if your task says "advisory" or "dry run". In this mode you
  run steps 1–3 and 8 only: report what you would do, and start no agent.
- **Live mode.** Otherwise, run every step.

## 1. Look

```bash
test -f var/orchestrator/STOP && echo STOP
node scripts/plan/status.mjs summary
node scripts/plan/status.mjs list --state running
node scripts/plan/status.mjs list --state review
git status --porcelain && git log --oneline -1
```

- **The `STOP` file exists:** start nothing new. Let running work finish, then go to step 8.
- **`main` is red:** stop the line. That means the last gates on `main` failed, or the main checkout
  has stray changes other than the two status files. Start nothing new; report it in step 8.

## 2. Reconcile

**If this cycle was resumed** after an interruption (your task says so, or your conversation already
shows sub-agents you started), first re-attach to them. Send a message to each sub-agent id that had
not reported back, asking it to continue. A message resumes a sub-agent from its transcript. Any that
cannot be resumed is handled by the rules below.

For each goal that is Running (`claimed`), find out where it is:
- **An implementer finished** (you have its summary block from this cycle, or its handoff file exists
  on its branch): go to step 5.
- **The implementer died or ran out of turns:** its worktree and checkpoint exist. Start a new
  `goal-implementer` for the same goal and attempt, telling it to resume from the checkpoint.
- **Nothing exists for it:** reset it with `status.mjs set <ID> not started --note "reset by
  orchestrator: no run found"`. It will be picked again.

Once the run ledger exists (O2), it is the source of attempts, session ids and costs. Until then,
count attempts from the goal's `activity.json` history.

## 3. Pick

```bash
node scripts/plan/status.mjs next --slots <free slots>
```

That command applies every start rule in code:
- every need is Done;
- the lane is free;
- the parallel cap allows it;
- the goal is not a human one;
- it is under the attempt limit and the budget;
- no needed resource is locked;
- `main` is green.

Take its answer as final. Never start a goal it did not return, and never skip one it did without
writing why.

In advisory mode, use `node scripts/plan/status.mjs ready` instead. Report which goals you would
start, in critical-path order (longest remaining chain first), with one line each.

## 4. Dispatch

For each goal from step 3:

1. Claim it:
   ```bash
   node scripts/plan/status.mjs set <ID> start --who <its lane> --ref orchestrator --note "attempt <n>"
   ```
2. Start `goal-implementer` in the background with this task:
   > Goal **<ID>**, attempt **<n>**. Follow the `run-goal` skill in orchestrator mode. <On a retry:
   > the previous verdict's problems and retry guidance, verbatim.> End with your summary block.

## 5. Verify

When an implementer returns its summary block:
- **`STATUS: blocked`:** run `goal-triage` with the block, then act on its decision (step 6).
- **`STATUS: partial`:** first message that same implementer to continue; it resumes from its
  transcript with everything it knew. If that is not possible, start a new implementer for the same
  attempt, resuming from the checkpoint. A partial run is an interruption, not an attempt. After five
  interruptions, go to triage.
- **`STATUS: ready-for-verification`:** start `goal-verifier` with this task:
  > Verify goal **<ID>**, attempt **<n>**, branch `<branch>`, worktree `<path>`. Follow the
  > `verify-goal` skill.

On the verdict:
- **pass:** record it with `status.mjs set <ID> review --ref <branch> --note "verified attempt <n>"`,
  then queue it for integration.
- **fail:** if attempts are under 3, dispatch attempt n+1 with the verdict's problems and guidance.
  At 3, run `goal-triage`.

## 6. Integrate, and act on triage

- **Integration**, one at a time. Start `goal-integrator` with this task:
  > Integrate goal **<ID>**: branch `<branch>`, worktree `<path>`, verdict pass on attempt <n>.
  > Follow the `integrate-goal` skill.

  On the result:
  - `merged`: the goal is Done; note what is now ready.
  - `conflict`: dispatch a new implementer attempt to rebase and resolve.
  - `gates-failed`: treat it as a failed verification.
  - `refused`: report the reason in step 8.
- **Triage decisions:**
  - `retry`: dispatch the next attempt with its guidance.
  - `split`: put the proposed cards in the inbox for the owner to approve. Set the goal `on hold`.
  - `hold`: set the goal `on hold` with the blocker as its note.
  - `escalate`: set the goal `on hold`, and give the item to `owner-concierge`.

## 7. Gates and the owner

- **Milestones:** for each `MS-*` goal that is Ready (all needs Done), start `milestone-gatekeeper`.
  - On a pass: `status.mjs set <MS-ID> done --who orchestrator --note "gate verified"`.
  - On a fail: report what is missing.
- **The owner:** if any owner goal (`You` lane) is Ready, or anything was escalated, held or split
  this cycle, start `owner-concierge`. Give it those items and the summary output, so it rewrites
  `docs/plan/INBOX.md`.

## 8. End the cycle

The cycle ends when nothing is running, `next` returns nothing more, and every verdict and
integration has been acted on. In advisory mode, it ends after step 3.

End with:

```
CYCLE <date time> · mode: live | advisory
Started:    <ID (attempt) …>
Verified:   <ID pass/fail …>
Merged:     <ID → commit …>
Gates:      <MS-ID pass/fail …>
Held:       <ID: reason …>
Owner:      <items now in the inbox>
Next:       <what the next cycle will pick, or "waiting on: …">
Problems:   <anything the owner should see now, or none>
```
