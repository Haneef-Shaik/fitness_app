# AR-1 candidate checkpoint 07757a5

This is an isolated goal-branch checkpoint, not integration or goal acceptance.

Coordinator checks on 26 October2026:

- `pnpm check`: PASS,169 tests (21 domain,126 mobile,22 planner), TypeScript/lint/design and plan/ledger sync.
- Android and iOS `expo export`: both PASS from this candidate, outputs under `/tmp/fitlog-ar1-*-export`.
  These are JavaScript/Hermes exports, not native device or store-release evidence.
- `git diff --exit-code -- packages/domain/src/models.ts packages/domain/src/calculations.ts pnpm-lock.yaml`: PASS; mutation files restored and dependencies unchanged.
- `git diff --check`: PASS.
- In an isolated local shared clone at07757a5, changing a snapshot and rewriting its manifest SHA256
  together makes the domain test exit1 with `differs from the baseline`. Restoring both yields exit0.
  This exercises real Git history; the initial worker had only an in-memory baseline fixture.
- In that clone, setting `CI=1` without FITLOG_CONTRACT_BASELINE still exits0. This is a confirmed
  fail-open defect. Correction and CI wiring are required before accepting the checkpoint.

No database, provider, deployment, remote push or release acceptance was performed.
Independent checkpoint review is running; its verdict is recorded separately when complete.
