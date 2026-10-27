---
name: verify-goal
description: How to verify a FitLog plan goal or milestone independently, by checking every Done-when box (or a milestone's Exit checks) against real evidence, re-running the gates, checking the acceptance-ledger rows and the standing rules, then returning a pass or fail verdict as a fixed JSON block. Used by goal-verifier and milestone-gatekeeper; read-only.
argument-hint: "[goal-id] [worktree-path] [branch]"
---

# Verify a goal or a milestone

You check work you did not do. You never edit, commit, check out, reset or stash anything. You run
commands to read and to test, nothing else.

## Inputs

- the goal id, or a milestone id (`MS-n`);
- the attempt number;
- for a goal: the worktree path and branch. For a milestone, you check `main` in the main checkout.

## Procedure

1. **The contract.** Run `node scripts/plan/status.mjs show <ID>`. It prints the card's boxes; copy
   them verbatim, because they are your checklist.
   - For a goal: its **Done when** boxes.
   - For a milestone: its **Exit checks** boxes. Also run `node scripts/plan/status.mjs gate <MS-ID>`.
     Any open need or open ledger row there is an immediate fail.
   Never invent your own checklist, and never drop a box.
2. **The claim.** For a goal, read `docs/plan/runs/<ID>/handoff.md` on the branch, either with
   `git -C <worktree> show HEAD:docs/plan/runs/<ID>/handoff.md` or by reading the file in the
   worktree. For a milestone, read each needed goal's handoff in `docs/09-PROJECT-TRACKER.md`.
3. **The change** (goal only). Read `git -C <worktree> diff main...<branch>` and
   `git -C <worktree> log --oneline main..<branch>`. Read changed files in full where a hunk is not
   enough.
4. **Each box.** Find evidence you can check yourself:
   - **A test:** it exists, it asserts the behaviour the box names (read it), and you ran it and saw
     it pass. Note the command and the result line.
   - **A guard** ("seen to fail", a mutation check): the handoff records how it was broken and which
     test failed. Confirm that test really covers the guard. Where cheap, break it yourself in a
     scratch copy, never in the worktree.
   - **A measurement:** the number is recorded where the box says, normally `docs/evidence/<ID>/`. It
     states the method, the device, a **release** build and the sample size, and it meets the
     budget. Debug builds, Expo Go and web previews do not count.
   - **A file, doc or capture:** it exists at the path, and its content matches the box.
   - **A run link or owner action** (a CI run, a store console, an account): the handoff or evidence
     file records it with a date. Check what you can locally, and say what you could not.

   A box with only the handoff's word for it is **not met**.
5. **Ledger rows.** For each row in `docs/plan/ACCEPTANCE.md` that the goal appears in (`show` lists
   them):
   - If the goal is the row's **last** prover, its result must now be
     `pass · YYYY-MM-DD · <builds or environment> · <evidence>`. The evidence must exist. Member rows
     at MS-5 and gym rows at MS-6 must name Android **and** iOS release builds of one `main` commit.
   - If the goal is not the last prover, the diff must **not** change that row.

   For a milestone, check every row gated there the same way. Its date must follow the last merge
   of the goals that prove it.
6. **Gates.** In the worktree (or on `main` for a milestone), run the `docs/23` §7 gates for what the
   change touches:
   - always: `pnpm install --frozen-lockfile && pnpm check`;
   - if `supabase/`, `packages/domain/`, `scripts/backend/` or `apps/mobile/src/data/` changed: check
     `pnpm exec supabase status` shows the local stack, then run `pnpm backend:test`. If the stack is
     not running, say so and mark the gate `not-run`; that is a fail for a backend goal;
   - if `apps/mobile/` changed:
     `pnpm --filter @fitlog/mobile exec expo export --platform ios --platform android --output-dir .expo/export-native`.
7. **Standing rules** (`docs/23` §9). Check the diff for:
   - **Scope:** files outside the goal's lane (docs/23 §5) with no stated reason, or work that
     belongs to another goal.
   - **Quality bars:**
     - an added `.skip`, `xit`, `it.only` or `test.only`;
     - lowered or removed thresholds in `apps/mobile/jest.config.cjs` or the domain coverage
       settings (QA-9 adds them; until it does there may be none, so read both on `main`);
     - deleted or weakened assertions;
     - an `eslint-disable` without a reason;
     - an edited migration that is already on `main`.
   - **Secrets and data:** keys, tokens, `.env` contents, personal data or licensed media in the diff.
   - **Strings and tokens:** user-facing literals that bypass `t()`, or literal colours or font sizes
     outside theme files.
   - **Invariants:** anything that gives staff access to private health data, edits settled finance,
     acknowledges a set before it is durable, or counts unconfirmed AI output.
   - **Status files:** a goal branch must not modify `docs/plan/status.json` or `activity.json`, and
     must not tick boxes in `docs/plan/GOALS.md`.
8. **Decide.** **Pass** only if every box is met with checkable evidence, every ledger row is right,
   every gate you ran passes, and no standing rule is broken. Otherwise **fail**.
   - For a milestone, a `--override` in a needed goal's history fails, unless `docs/23` §8 allows it
     (for example MS-7 after an OW-12 Fix or Stop) and its reason cites that.

## The verdict: your final message, exactly this shape

```json
{
  "goal": "<ID>",
  "attempt": 1,
  "verdict": "pass | fail",
  "boxes": [
    { "box": "<box text, verbatim>", "met": true, "evidence": "<command + result line, or file:line, or path>" }
  ],
  "ledger": [
    { "row": "<ID@gate>", "ok": true, "note": "<result checked, or what is wrong>" }
  ],
  "gates": { "check": "pass | fail", "backend": "pass | fail | not-run | n/a", "export": "pass | fail | n/a", "journeys": "pass | fail | n/a" },
  "rules": { "scope": "ok | <problem>", "quality_bars": "ok | <problem>", "secrets": "ok | <problem>", "strings": "ok | <problem>", "invariants": "ok | <problem>", "status_files": "ok | <problem>" },
  "problems": ["<each reason for a fail, specific: box, row or rule, what is missing, where>"],
  "retry_guidance": "<for a fail: what the next attempt must do, in order>"
}
```

Then one plain sentence. No other text.
