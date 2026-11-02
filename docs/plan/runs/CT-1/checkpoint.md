# Checkpoint — CT-1 · Exercise catalogue and three starter programmes

Attempt 1 · branch `codex/fitlog-ct1-content` (name fixed by the coordinator) · base `main` c8a5d57.

## Session constraints met on 27 Oct 2026

- **Bash is denied** in this session ("don't ask" mode). No shell command ran: no `status.mjs show`, no
  `pnpm install`, no `node --test`, no git. Every runtime gate is recorded as blocked, not passed.
- No WebFetch or WebSearch tool is available, so no external licence or source page could be read.
  No external text was adopted (see `docs/evidence/CT-1/provenance-and-review.md`).
- The coordinator forbids commits, DB/Docker/Supabase operations, config or migration edits, and
  changes to `supabase/development-catalogue.sql`, `scripts/backend/seed-development.mjs`, package
  files and `packages/domain/`.

## Entry gate

- Needs: AR-1. `docs/plan/status.json` (worktree snapshot) shows AR-1 `done` at 73e3f63. Read with the
  Read tool because `status.mjs show` could not run.

## Steps

1. [x] Read the card, PRD §§6.1, 6.2, 21.2, 21.4, 27 (PROD-02, DEC-16), docs/23 §§5, 7, 9,
   architecture 003 §7, QA-1 F-6, the member schema and the development seed.
2. [x] Content model and files under `content/` (manifest, muscles, equipment, eight exercise files,
   starter programmes).
3. [x] Validator, ID derivation, seed SQL builder, template and Hindi-backlog builders under
   `scripts/content/`, with tests.
4. [x] Serialized-phase DB verifier (`scripts/content/verify-seed.mjs` + SQL), unit-tested through an
   injected runner only. It has never run against a database.
5. [x] Evidence in `docs/evidence/CT-1/`, handoff.

## Resume note (second session, 27 Oct 2026)

Resumed from this checkpoint after the session-limit reset. Bash is still denied, so nothing has run in
either session. Finished in session 2:
- the seven remaining exercise files;
- the starter programmes;
- `seed.mjs`, `templates.mjs`, `build-seed.mjs` and `verify-seed.mjs`, with their tests and the three
  check SQL files;
- `content/README.md`, the evidence notes and the handoff.

Self-review fixed two latent bugs: `isDate` threw on impossible dates, and a `__proto__` source name
resolved to the prototype. Implementation is complete; only runtime proof remains.

## M1 correction (1 Nov 2026, owner delegation AUTH-01)

This fixes only material M1 from `docs/evidence/CT-1/source-review-2026-11-01-collected.md`. It ran under
the CT-1 review and merge freeze. It is a correction, not new goal work.

- **Tools:** Read, Grep, Edit and Write only. No shell, tests, installs, database, Docker, Supabase or
  network, no commits, no sub-agents. **The code is written, but its tests have not been run.**
- **`scripts/content/seed.mjs`:** each record now first raises the member-owned error if a member-owned
  row holds the catalogue id at any version. This runs before the `(id, version)` lookup and the insert.
  The same-version branch, the drift check, the skip of an identical row and the insert-only behaviour are
  unchanged.
- **`scripts/content/seed.test.mjs`:** one new static regression test for that check and its position.
- **`scripts/content/verify-seed.mjs`:** a fourth rolled-back run, `crossVersion`. It plants a member row
  at `(PROBE_ID, 2)`, seeds `(PROBE_ID, 1)`, and accepts only the error for exactly `PROBE_ID` at version 2.
  The result line gains one clause. The twice, conflict and drift runs and their detection are unchanged.
- **`scripts/content/verify-seed.test.mjs`:** the fake-runner tests are updated for four runs. New cases:
  the cross-version plant, a cross-version run that exits 0, a near-miss error for the probe (rejected),
  and a failure for another reason in all three guard runs.
- **No changes to:** content, semantics, multipliers, schema, shared packages, contracts, local-stack or
  target selection.
- **Still open:** M2, M3, L1–L9, and every runtime and external gate. A READ COMMITTED race (a member
  insert at another version, committed between the check and the insert) stays for MB-2's member-side
  guard. Full detail is in the handoff's "Review M1 correction" section. No Done claim.

## M2(b) correction: unilateral multiplier (1 Nov 2026, owner delegation AUTH-01)

This fixes only the unilateral-multiplier half of material M2, under the PRD §6.1 decision in
`docs/evidence/CT-1/source-review-disposition-2026-11-01.md`. It is a separate bounded phase under the
review freeze, not new goal work or polish.

- **Tools:** Read, Grep, Edit and Write only. No shell, tests, installs, imports, database, Docker,
  Supabase or network, no commits, no status changes, no sub-agents. **The code is written, but its tests
  have not been run.**
- **`scripts/content/catalogue.mjs`:** the multiplier now comes from the new exported `volumeMultiplier`.
  Per-hand without `repsPerSide` is 2; per-hand with `repsPerSide` is 1; any other load basis is 1. The
  `singleArm` validation is unchanged.
- **`content/exercises/dumbbell.json`:** five two-dumbbell, one-leg records now carry an explicit
  "per leg" and "load per hand" logging cue: walking lunge, reverse lunge, Bulgarian split squat, step-up
  and split squat. Their multiplier changes from 2 to 1. They stay at 3–4 sentences, are not single-arm,
  remain at version 1 (never seeded) and keep their provenance.
- **Tests (authored, unrun):** an updated formula assertion and one new M2 test in `catalogue.test.mjs`,
  and one new propagation test each in `seed.test.mjs` and `templates.test.mjs`.
- **Docs:** the `content/README.md` formula line, plus the handoff's M2(b) section, decision 5, mutation
  check 9 and MB-2 items.
- **Not changed:** bands, load types, schema, shared contracts, the domain, the accepted M1 seed and
  verifier source, and other content.
- **Still open:**
  - M2(a) bands: an MB-2 contract prerequisite. Band metrics and the first seed stay blocked.
  - MB-2: `repsPerSide` persistence, the snapshot key and the UI cue.
  - M3 wiring (S1/CT-1), OW-13, QA-5/DEC-16, the MB-2 member-claim race, and L1–L9.
  - Every runtime gate and all four Done boxes.

  No Done claim.

## Next step

Run, in this order, from the worktree root (none has run yet):

```bash
rtk pnpm install --frozen-lockfile
rtk node --test scripts/content/*.test.mjs
rtk node scripts/content/build-seed.mjs check
```

Fix anything they report. Then the coordinator's serialized DB phase runs
`node scripts/content/verify-seed.mjs` against the local stack (or a disposable replay project). Since the
1 Nov M1 correction, that is four rolled-back runs: twice, conflict, crossVersion and drift. They are still
unrun, and so is the unit-test gate above (which since the M2(b) correction includes three M2 tests). The
first real seed also waits for M2(a) bands and MB-2.

## Surprises

- `public.programmes.owner_id` is `not null`; there is no global template table, so starter programmes
  cannot be seeded into the database without an MB-2 schema change. CT-1 ships them as validated
  content plus a template builder and hands the table to MB-2.
- `public.exercises` has no licence, version-of-source, Hindi or reps-per-side columns. The seed writes
  provenance into `source`; the rest stays in the content files until MB-2 adds columns.
- A new `.sql` file under `supabase/` would fail `check-sql-sources` unless `config.toml` lists it, and
  `config.toml` belongs to S1. The seed SQL is generated, not committed.


## M1 independent source acceptance — 2026-11-01T16:47:03.005054+00:00

Reviewer76f2aad6 COMPLETE C0/H0/M0/L0 introduced; Read12/Grep10/no errors or denials, six hashes unchanged. Codex independently inspected source/diff and accepts only source correction. See `docs/evidence/CT-1/m1-source-accepted-2026-11-01.md`. M1 runtime remains UNRUN; concurrency MB-2, M2/M3/external gates and all four CT1 boxes remain open. Historical denied commands stay parked; no repeated source/wording loop or integration claim.


## M2(b) independent source acceptance — 2026-11-01T17:49:13.534790+00:00

Reviewer7dfe6009 COMPLETE C0/H0/M0/L2, Read14/Grep20, no errors/denials, eight hashes unchanged, exited. Codex AUTH01 accepts ONLY source correction; see `docs/evidence/CT-1/m2-source-accepted-2026-11-01.md`. Two nonblocking lows assigned CT1 (mutation9 recipe before eventual mutation proof; permitted versus actual tool wording). No optional polish loop. Tests/DB remain UNRUN; historical denied sequences parked. M2(a)/MB2/M3/external gates and all four CT1boxes remain open; no integration/Done claim.
