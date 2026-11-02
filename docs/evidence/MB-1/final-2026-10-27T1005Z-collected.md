I finished the SF-7c phase: L1 is fixed test-first, the comments (L2) and records (L3) are corrected, and the full pure suite passes 304/304 on Node v22.23.1. Nothing is Done and no Done-when box is met. The next step is a fresh independent review.

**L1: the proven ID's start time.** Right after the binding read, every 55321 command now inspects the database container by the ID the binding proved, with `--type container`. That inspect must print exactly the start time pinned at prepare. If it doesn't, the command refuses before any snapshot, staged input, attempt record, `migration up` or suite. The binding's own arguments are unchanged. The new tests cover a restart, a recreate, a switch to another Docker daemon and a stopped container, all happening between the earlier name check and the binding read. They also cover the ID inspect failing: no such container, a timeout, or unexpected output.

**Tests:**
- **RED:** on 7 files, 42 tests, 17 failing, each for the intended reason. The 3 new tests showed the defect itself: a restarted container was read as the 55321 reference, and an apply ran all the way through `migration up`.
- **GREEN:** 42/42 on the first run. No assertion changed after the code; only two comment lines did.
- **Full run, once:** after I checked the test files for side effects, `1..155`, 304 pass, 0 fail.
- The 301-test baseline is inherited from the 0935Z review, not re-run here.
- The §8 secret scan still shows exactly its five known lines, with their hashes unchanged.

**L2 and L3:**
- **L2:** the stale comments now name the proven ID and the `^unix:///` rule.
- **L3:** the records list the three finals by hash and actual timing. None of them was edited.

| File | sha256 | Contents and timing (per Codex) |
|---|---|---|
| `final-2026-10-27T0905Z.md` | `c68e01d5…91bd` | the SF-7 review, from the 08:35 cycle despite its name |
| `final-2026-10-27T0905Z-collected.md` | `dddba543…d407` | SF-7b's own final, 09:05 |
| `final-2026-10-27T0935Z-collected.md` | `0cefa246…c528` | the SF-7b review, 09:35 |

**What did not run:**
- No mutations. SF-7b's eight stay unrun, and the denied `mkdir`/`cp` were not retried or replaced, so R-exit's behavioural kill is still not shown.
- No live step: no runner, Docker, database, SQL, network or `backend:test`, no shared apply, and not the live M1 read.
- No subagent reviews, commits or staging. I did not run the pasted launcher.
- `wc -l` was denied, so I claim no line counts.

**Still open:**
- **M1 is still open.** The live-read plan was reviewed, not run, and is not accepted as closing it. Proving both paths reach the same database cluster still needs a SQL comparison and its own decision.
- **The second binding read** just before `migration up` does not re-check the start time. A restart that keeps the same container ID in that window is caught only by the STOP after the apply. I left this for the next review, since the review placed the fix in `sharedRunning`.
- **Decision recorded, not started:** before any future `backend:test`, one separate harness-correction phase is needed for QA-9's phase 3N gates G1–G7. MB-1 owns it, and you assign its S2 paths.

Files are in `scripts/backend/` and `docs/plan/runs/MB-1/`:
- `mb1-replay-live.mjs`
- `mb1-replay-sf7c.test.mjs` (new)
- `sf7c.md` (new)
- `checkpoint.md`
- `handoff.md`
- `sf7b.md`

```
GOAL: MB-1
BRANCH: codex/mb1-identity
HEAD: 2a95726 (uncommitted working tree; nothing staged or committed)
HANDOFF: docs/plan/runs/MB-1/handoff.md
BOXES: 0/4 Done-when boxes met
STATUS: blocked
NOTES: SF-7c fixed review 0935Z L1 test-first (RED 17/42 as intended, GREEN 42/42, final full pure run once 304/304 on Node v22.23.1), plus L2 comments and the L3 finals inventory; mutations UNRUN (SF-7b's eight; denied mkdir/cp not retried); M1, live read, same-ID restart window before migration up, B1, B2 open; fresh independent review of SF-7c next.
```
