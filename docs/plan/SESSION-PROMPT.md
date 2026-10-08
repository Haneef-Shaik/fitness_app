# Session prompt: run one goal

> Start a fresh Claude Code session in `/Users/Adya/personals/fitness_app` and paste everything
> below the line, replacing `<ID>` with the goal id (for example `DS-1`) and `<LANE>` with your
> lane (for example `S3`). One goal per session.

---

You are running goal **`<ID>`** of the FitLog master plan, in lane **`<LANE>`**.

## 1. Entry gate: run this first

```bash
cd /Users/Adya/personals/fitness_app
git checkout main && git pull --ff-only
node scripts/plan/status.mjs show <ID>
```

Every goal under **needs** must be **Done**. If one is not, **stop and report**: that goal is not
finished, and starting would build on code that is not on `main`. Do not pass `--force` unless the
owner tells you to.

Then claim the goal and branch:

```bash
node scripts/plan/status.mjs set <ID> start --who <LANE> --ref plan/<id>-<short-slug>
git checkout -b plan/<id>-<short-slug>
```

## 2. Read before you touch anything

1. The goal's card in `docs/plan/GOALS.md`: its outcome, scope and **Done when**. The `spec:` line
   from `show` is its anchor.
2. Every doc and line range the card names. For a G-numbered goal, that includes its section in
   `docs/17-GYMS-IMPLEMENTATION-PLAN.md` §4: entry gate, inherited handoffs, scope and exit
   criteria.
3. `docs/23-MASTER-PLAN.md` §5 (lanes and file ownership) and §9 (standing rules).
4. The handoff records in `docs/09-PROJECT-TRACKER.md` from the goals yours needs. Verify what they
   claim; do not assume it.

## 3. Standing rules

- **TDD.** Write the test first and see it fail. Mutation-check every guard: break it on purpose, and
  a named test must fail.
- **Stay in your lane's files** (docs/23 §5). If you need a change in a shared file another lane
  owns, write it in the handoff instead of making it.
- **Coverage only goes up.** Never lower a threshold to get green.
- **Strings through `t()`** on every screen you touch, once G14.app is Done. Add the directory to the
  source-scan guard.
- **Invariants** I1–I24 hold. AI output is a proposal the user confirms.
- **No cloud.** Every deliverable is a local file. Never commit secrets, purchased media or user
  data; the repo is public.
- **Verify, don't assert.** A measurement beats a claim: p95, request counts, screenshots on a
  device.
- Commit messages follow the house format (`feat:`, `fix:`, `docs:` …) and name the goal id.

## 4. Do the work

Work through the card's scope in order. If the scope turns out wrong (it misses something, or part
of it is already done), say so in the handoff and the card; do not quietly change the goal. If you
find work for another goal, add it to that card's scope in `GOALS.md` and note it in your handoff.

## 5. Verify

Tick every **Done when** box with its evidence: the test name, the measurement, the screenshot path.
Then run the gates your change touches:

```bash
cd services/api && uv run pytest -q && uv run ruff check . && uv run alembic check   # backend
pnpm --filter @fitlog/mobile typecheck && pnpm --filter @fitlog/mobile test:ci          # mobile
node --test scripts/plan/lib.test.mjs                                                   # plan tooling
```

## 6. Close the goal

1. Open the PR (or have the owner merge), then
   `node scripts/plan/status.mjs set <ID> review --who <LANE> --ref "<PR or commit>"`.
2. Once it is merged to `main`: `node scripts/plan/status.mjs set <ID> done --who <LANE> --ref <commit>`.
   The command prints which goals that unblocks.
3. Append a handoff record to the `docs/09` changelog: outcome claimed, what you inherited and
   whether it held, what you produced with its evidence, what you left undone and why, and the traps
   you hit.
4. Record any decision the goal forced in charter §6. docs/17 reserves D36–D46 for G13–G21.
5. Commit `docs/plan/status.json` and `docs/plan/activity.json` along with the work.

## 7. Report at the end

Say what was built, the evidence for each Done-when box, what is now ready (from the `done` output),
and anything the next session must know.
