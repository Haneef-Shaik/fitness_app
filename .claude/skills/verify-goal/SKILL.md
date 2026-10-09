---
name: verify-goal
description: How to verify a FitLog plan goal or milestone independently, by checking every Done-when box against real evidence, re-running the gates and checking the standing rules, then returning a pass or fail verdict as a fixed JSON block. Used by goal-verifier and milestone-gatekeeper; read-only.
argument-hint: "[goal-id] [worktree-path] [branch]"
---

# Verify a goal

You check work you did not do. You never edit, commit, check out, reset or stash anything. You run
commands to read and to test, nothing else.

## Inputs

- the goal id (or a milestone id);
- the attempt number;
- for a goal: the worktree path and branch (for a milestone, you check `main` in the main checkout).

## Procedure

1. **The contract.** Read the card in `docs/plan/GOALS.md`. Copy its Done-when boxes; they are your
   checklist. For a milestone, turn its Exit statement into a short list of checkable claims.
2. **The claim.** Read `docs/plan/runs/<ID>/handoff.md` on the branch:
   `git -C <worktree> show HEAD:docs/plan/runs/<ID>/handoff.md`, or just read the file in the
   worktree.
3. **The change.** Read `git -C <worktree> diff main...<branch>` and `git -C <worktree> log --oneline
   main..<branch>`. Read changed files in full where a hunk is not enough.
4. **Each box.** Find evidence you can check yourself:
   - **A test:** it exists, it asserts the behaviour the box names (read it), and you ran it and saw
     it pass. Note the command and the result line.
   - **A guard ("seen to fail", a mutation check):** the handoff records how it was broken and which
     test failed. Confirm that test really covers the guard. Where cheap, run it against `main`'s code
     to see it fail.
   - **A measurement:** the number is recorded where the card says (tracker, `docs/nfr-evidence.md`,
     `docs/measurements/`), and how it was measured is stated.
   - **A file, doc or screenshot:** it exists at the path, and its content matches the box.

   A box with only the handoff's word for it is **not met**.
5. **Gates.** In the worktree, run the gates for what the diff touches:
   - API: `cd services/api && uv run pytest -q && uv run ruff check . && uv run alembic check`
   - Mobile: `pnpm --filter @fitlog/mobile typecheck && pnpm --filter @fitlog/mobile test:ci`
   - Plan tooling: `node --test scripts/plan/lib.test.mjs`
6. **Standing rules.** Check the diff for:
   - **Scope:** files outside the goal's lane (docs/23 §5) with no stated reason, or work that
     belongs to another goal.
   - **Quality bars:**
     - added `.skip`, `xit`, `it.only`, `@pytest.mark.skip` or `xfail`;
     - lowered thresholds in `apps/mobile/jest.config.js` or the API coverage settings;
     - deleted or weakened assertions;
     - `eslint-disable` without a reason.
   - **Secrets and data:** keys, tokens, `.env` contents, personal data or purchased media in the diff.
   - **Strings:** once G14.app is Done, user-facing literals on touched screens that bypass `t()`.
   - **Status files:** a goal branch must not modify `docs/plan/status.json` or `activity.json`.
7. **Decide.** **Pass** only if every box is met with checkable evidence, every gate you ran passes,
   and no standing rule is broken. Otherwise **fail**.

## The verdict: your final message, exactly this shape

```json
{
  "goal": "<ID>",
  "attempt": 1,
  "verdict": "pass | fail",
  "boxes": [
    { "box": "<box text>", "met": true, "evidence": "<command + result line, or file:line>" }
  ],
  "gates": { "api": "pass | fail | n/a", "mobile": "pass | fail | n/a", "plan": "pass | fail | n/a" },
  "rules": { "scope": "ok | <problem>", "quality_bars": "ok | <problem>", "secrets": "ok | <problem>", "strings": "ok | n/a | <problem>", "status_files": "ok | <problem>" },
  "problems": ["<each reason for a fail, specific: box or rule, what is missing, where>"],
  "retry_guidance": "<for a fail: what the next attempt must do, in order>"
}
```

Then one plain sentence. No other text.
