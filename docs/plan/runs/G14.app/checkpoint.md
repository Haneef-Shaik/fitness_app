# Checkpoint — G14.app · Strings catalog, locale formats and the Hindi spine

Attempt 1 · branch `codex/fitlog-g14-i18n` (the coordinator asked to keep this name) · base `c8a5d57`.
Three sessions:
1. The first did the reading and analysis.
2. The second resumed from it; no partial files existed.
3. The third (27 Oct) was a bounded M3/M4 source correction under Codex AUTH-01 delegation.

## Environment limits (all sessions)

- The Bash tool was denied ("don't ask" permission mode) in sessions 1 and 2. Session 3 was limited
  to Read, Grep, Edit and Write. No shell command ran in any session: no `git`, `rtk`,
  `pnpm install`, Jest, `tsc`, ESLint or `status.mjs`.
- `node_modules` is not installed in this worktree.
- So every test in this diff was written but **never executed**. No RED or GREEN run was seen, and no
  mutation check ran. Nothing here is runtime proof.
- Nothing is committed (the coordinator said no commits, and there is no shell). The diff sits
  uncommitted in the worktree.

## Steps

1. Read the card, the PRD sections, docs/23 §§5/7/9, the AR-1 record, the existing i18n code and
   every screen file. **Done.**
2. Tests written first, all in `apps/mobile/src/lib/i18n/__tests__/`. **Done, not run.**
   - `catalog.test.ts` — parity, including a planted literal;
   - `format.test.ts` — the formatters;
   - `language.test.tsx` — the device store and provider;
   - `copy-literals.test.ts` — the scan, with planted literals in scratch copies.
3. Implementation. **Done.**
   - In `src/lib/i18n/`: `locale`, `translate`, `format-copy`, `plurals`, `plural-rules`,
     `calendar`, `format`, `parity`, `language-store`, `use-locale`, `LanguageProvider` and `index`.
     `en.ts` and `hi.ts` gain the format copy.
   - `apps/mobile/scripts/copy-literal-scan.cjs`, plus `copy-literal-baseline.json` with 13 entries,
     all in other lanes' screens.
4. Narrow migrations of S4 screens to `t()` and the formatters. **Done.**
   - Training: Plates, Programme, History, EditSet, Schedule.
   - Today.
   - Progress: Progress, NewGoal.
   - WorkoutScreen (SC-1) was left alone and baselined.
5. Evidence `docs/evidence/G14.app/i18n-spine-notes.md`, and the handoff. **Done.**

## Phase 3 · 27 Oct · M3/M4 source correction (Codex AUTH-01 delegation)

Bounded to review findings M3 and M4. Read, Grep, Edit and Write only: no shell, subagents, tests,
installs, commits or status edits.

6. Regression tests written first in `copy-literals.test.ts`. **Done, UNRUN.**
   - Six M3 rule tests;
   - one real-screen plant on a TodayScreen scratch copy;
   - eight M4 baseline tests.
   - The original 13 tuples are pinned in the test, copied from the JSON, with a byte match confirmed
     by Grep.
7. Scanner change in `copy-literal-scan.cjs`. **Done, UNRUN.**
   - Lexical same-file const following, with a per-site visited set.
   - Display-call objects and arrays read at user-facing keys.
   - `setOptions` added as a display call.
   - `kind` added to the baseline match.
   - New `baselineProblems(entries, policy)`.
   - The baseline JSON and screens are unchanged.
8. Evidence note §2 updated with the precise limits and baseline policy; handoff updated. **Done.**

Predicted by reading: the stronger rules add no finding to today's tree (handoff, "This phase").
Review findings M1, M2, M5, M6 and L1–L3 stay open with the owners named in the handoff, and their
files were not touched. No box is met, and there is no Done or integration claim.

## Next step for whoever resumes

With a shell, from the repo root:

```bash
rtk pnpm install --frozen-lockfile
rtk pnpm --filter @fitlog/mobile exec jest --runInBand src/lib/i18n/__tests__/copy-literals.test.ts
rtk pnpm --filter @fitlog/mobile exec jest --runInBand src/lib/i18n
rtk pnpm --filter @fitlog/mobile typecheck
rtk pnpm --filter @fitlog/mobile lint
rtk proxy node apps/mobile/scripts/copy-literal-scan.cjs
```

Fix whatever fails:
- Start with any difference between the scan's real findings and the baseline. Kind now counts.
- A new real finding is fixed in source by its owner. It is never added to the baseline, and the
  pinned test forbids that anyway.

Then:

1. Run the mutation checks in the handoff, including the M3/M4 rows, and record their output lines.
2. Run `rtk pnpm check` and the native JS export.
3. Have M3 and M4 re-reviewed independently.
4. Pick up the open findings in the handoff table:
   - M1, M2, L1 and L3 (G14.app);
   - M5, which holds the S3 mount;
   - M6 (SC-2, plus the G14.app parser design);
   - L2 (MB-1 and G14.app).
5. Commit with `feat(G14.app): ...` subjects when a commit is authorised.
