# Plan board

The master plan's goals, dependency graph and live status, all local. Nothing here talks to the
internet except the page's Google Fonts link, which falls back to system fonts offline.

## Open the board

```bash
node scripts/plan/serve.mjs          # or: pnpm plan:board
# → http://127.0.0.1:4317
```

- **Graph:** one lane per session, one column per wave. Hover or select a goal to light up what it
  needs and what waits on it. The badges **T**, **F** and **L** stand for QA-1, MS-2 and MS-5, which
  many goals need; their lines appear on hover.
- **Ready to run**, **All goals** and **Updates:** the same data as a list, a table and a feed.
- **Saving a status** writes `status.json` and adds an entry to `activity.json` in this folder.
  Changes made in a terminal show up on the page within about two seconds.
- **Export CSV** downloads the table.

The server binds to `127.0.0.1` only and refuses requests from any other host or origin.

## Update from a terminal or a session

```bash
node scripts/plan/status.mjs summary                       # milestones and lanes at a glance
node scripts/plan/status.mjs ready --lane S3               # what a lane can start now
node scripts/plan/status.mjs show DS-1                     # needs, unblocks, status, spec anchor
node scripts/plan/status.mjs set DS-1 start --who S3 --ref plan/ds-1-tokens
node scripts/plan/status.mjs set DS-1 review --ref "PR #12"
node scripts/plan/status.mjs set DS-1 done --ref 1a2b3c4
```

Statuses are `not started`, `claimed` (alias `start`), `in review` (`review`), `done` and
`on hold` (`hold`). **Ready** and **blocked** are worked out from the needs and never stored.
Claiming a blocked goal is refused unless you pass `--force`.

## Change the plan

1. Edit the cards in [GOALS.md](GOALS.md). Its fenced `json` block holds the lanes, milestones,
   sync points and board settings.
2. Run `node scripts/plan/build.mjs`. It checks ids, needs and cycles, writes `plan.json`, and
   rebuilds `board.html` with the `dependency-board` skill's builder. If the skill is not at
   `~/.claude/skills/dependency-board`, set `DEPENDENCY_BOARD_SKILL`.
3. Restart nothing. An open board notices the new `board.html` and reloads itself.

Statuses survive a rebuild, because they are keyed by goal id. A goal that is removed from the plan
keeps its row in `status.json`, and the build warns about it.

## Files

| File | Written by | What |
|---|---|---|
| `GOALS.md` | people | Every goal, plus the board settings. **The source of the plan** |
| `plan.json` | `build.mjs` | GOALS.md as data. Do not edit |
| `board.html` | `build.mjs` | The page. Do not edit |
| `status.json` | the board, `status.mjs` | Current status per goal. **Commit it with the work** |
| `activity.json` | the board, `status.mjs` | The append-only update feed |
| `SESSION-PROMPT.md` | people | What to paste to run a goal in a fresh session |

Tests for the tooling: `node --test scripts/plan/lib.test.mjs` (or `pnpm plan:test`).
