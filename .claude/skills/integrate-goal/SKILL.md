---
name: integrate-goal
description: How to merge one verified FitLog plan goal into main. It rebases the goal branch, runs the full gates, fast-forwards main, marks the goal Done with its commit, appends the handoff to the tracker, and cleans up the worktree. Used by goal-integrator, one goal at a time, only after a passing verdict.
argument-hint: "[goal-id] [branch] [worktree-path]"
---

# Integrate a goal

You run from the **main checkout** (`/Users/Adya/personals/fitness_app`). One integration at a time.
Fast-forward only, nothing forced, nobody's work overwritten.

## Preconditions: refuse if any fails

1. Your task includes a **passing** verdict for this goal and attempt.
2. The main checkout is on `main`, and `git status --porcelain` shows nothing except:
   - `docs/plan/status.json` and `docs/plan/activity.json`. Those two change as the orchestrator
     claims goals, and you commit them below.
   - `docs/09-PROJECT-TRACKER.md`, but only when you are resuming this same goal and the uncommitted
     change is its own `<!-- handoff:<ID>:… -->` entry.
3. No other integration is running. Once `var/orchestrator/` locks exist, take the `integrate` lock.

On a refusal, report `RESULT: refused` and the reason. Never stash, reset or clean anything to make a
precondition pass.

## Resuming an interrupted integration

An earlier integrator may have stopped part-way. Check where it got to before doing anything, and
skip the steps that are already done. Every step below is safe to repeat.

- **The worktree is mid-rebase** (`git -C <worktree> status` says "rebase in progress"): run
  `git -C <worktree> rebase --abort`, then start from step 1.
- **`main` already contains the branch** (`git merge-base --is-ancestor <branch> main` exits 0): the
  fast-forward happened. Skip steps 1–3 and continue from step 4.
- **The goal is already Done** (`node scripts/plan/status.mjs show <ID>`): skip step 4.
- **The tracker already has `<!-- handoff:<ID>:<commit> -->`:** skip step 5.
- **Nothing is staged:** skip the commit in step 6.
- **The worktree or branch is already gone:** skip that part of step 7.

Before step 3, note `main`'s current commit (`git rev-parse main`) and report it as `MAIN_BEFORE`.
That is what makes a later rollback exact. Once the run ledger exists (O2), record it there too.

## Steps

1. **Rebase in the goal's worktree.**
   ```bash
   git -C <worktree> rebase main
   ```
   On a conflict: run `git -C <worktree> rebase --abort` and report `RESULT: conflict` with the list
   of conflicting files. Stop.
2. **Run the full gates on the rebased branch**, in the worktree, whatever the diff touched. The
   rebase may have combined it with other goals' work:
   ```bash
   cd <worktree>/services/api && uv run pytest -q && uv run ruff check . && uv run alembic check
   cd <worktree> && pnpm --filter @fitlog/mobile typecheck && pnpm --filter @fitlog/mobile test:ci
   cd <worktree> && node --test scripts/plan/lib.test.mjs
   ```
   Any failure: report `RESULT: gates-failed` with the failing lines. Stop; `main` is untouched.
3. **Fast-forward `main`**, from the main checkout:
   ```bash
   git merge --ff-only <branch>
   ```
4. **Mark it Done** with the merged commit:
   ```bash
   node scripts/plan/status.mjs set <ID> done --who integrator --ref <short hash>
   ```
   Note the goals it reports as now ready.
5. **Append the handoff to the tracker.** Add the contents of `docs/plan/runs/<ID>/handoff.md`, with
   the merged commit hash, to the changelog in `docs/09-PROJECT-TRACKER.md`. Start the entry with the
   marker line `<!-- handoff:<ID>:<short hash> -->`. This is the only file you edit.
6. **Commit the bookkeeping**:
   ```bash
   git add docs/09-PROJECT-TRACKER.md docs/plan/status.json docs/plan/activity.json
   git commit -m "docs(<ID>): handoff and status"
   ```
7. **Clean up**:
   ```bash
   git worktree remove <worktree>
   git branch -d <branch>
   ```
   Use `-d`, never `-D`. If git refuses, the branch is not fully merged: report it, and do not force.
8. **Push only if allowed.** If `var/orchestrator/config.json` exists and has `"push": true`, run
   `git push origin main` (never `--force`). Otherwise do not push; the owner pushes.

## Final message

```
GOAL: <ID>
RESULT: merged | conflict | gates-failed | refused
MAIN_BEFORE: <main's commit before the fast-forward>
MAIN: <new main commit hash, or unchanged>
NOTES: <now-ready goals, or the reason>
```
