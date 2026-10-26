# AR-1 · Guard review — final dispositions

| Field | Value |
|---|---|
| Review | [`docs/evidence/AR-1/guard-review.json`](../../../evidence/AR-1/guard-review.json): **PASS**. No critical, high or medium findings; four low and two nits |
| Scope | `scripts/backend/{check-sql-sources,local-stack,verify-contracts,verify-fixtures}.mjs`, the three `*.test.mjs` files and `package.json` `backend:test` |
| Date | 26 October 2026 |
| Re-review | None needed, except that the coordinator checks the exact command order in `backend:test` (condition 3 of the review) |

## Evidence reported by the coordinator

This session did not run or observe any of the following:
- **Real runners on the coordinator's own stack:** PASS. The run matched all 8 persisted schemas. The exact
  fixture passed with 16 set vectors and 2 session vectors. M1.5, M4.3, M4.4 and the missing-AC03-ID probes
  all failed as expected, and the restored originals passed again. The record is
  `docs/evidence/AR-1/real-runner-probes.json`.
- **The four invalid source CLI cases** each failed.
- **Before this pass:** the 39 backend unit tests and `pnpm check`, 185 tests in total, passed.

## Dispositions

| ID | Severity | Disposition | Change |
|---|---|---|---|
| L1 | low | **Routed to PL-1, not done now** (the review permits deferral) | None |
| L2 | low | **Fixed** | `package.json` `backend:test` runs the two database-free steps first, then the original four live suites, then the two new runners (order below) |
| L3 | low | **Fixed, comment only** | `check-sql-sources.mjs`, the comment on `baseProblems`: "byte for byte" became "the same Git blob". It now says `git hash-object` applies clean filters and line-ending conversion, so it proves the blob Git would store, not identical working bytes. Behaviour unchanged: no `--no-filters` |
| L4 | low | **Routed to PL-1, not done now** (the review permits deferral) | None |
| N1 | nit | **Fixed, comment only** | `verify-fixtures.mjs`, the comment on `fixtureText`: the decoder keeps a leading BOM, so `JSON.parse` then refuses the file as not JSON. Behaviour unchanged. The same wording was corrected in `phase2C.md` |
| N2 | nit | **Fixed** | `phase2C.md` now says verify-contracts reports the first difference within each schema, plus every missing or extra name |

**`backend:test` order now:**
1. `node --test scripts/backend/*.test.mjs`
2. `node scripts/backend/check-sql-sources.mjs`
3. `node scripts/backend/verify.mjs`
4. `node scripts/backend/verify-gym.mjs`
5. `node scripts/backend/verify-freeze-projection.mjs`
6. `node scripts/backend/verify-freezes.mjs`
7. `node scripts/backend/verify-contracts.mjs`
8. `node scripts/backend/verify-fixtures.mjs`

Steps 3–8 keep their earlier relative order.

## Runs after this pass (this session)

| Command | Result |
|---|---|
| `rtk proxy node --test scripts/backend/*.test.mjs` | Exit 0. `# tests 39`, `# pass 39`, `# fail 0` |
| `rtk proxy pnpm check` | Exit 0. Domain 37/37 (contract baseline `HEAD@e23e9ae205c4: checked`), mobile 126/126, plan 22/22: 185 tests. `plan.json and board.html match GOALS.md` |

`pnpm backend:test` was not run. 55321 does not have the formula migration (open conditions, below).

## Deferred to PL-1 (exact paths and actions)

**L1, the CI environment for test 18.** Test 18 is at `scripts/backend/check-sql-sources.test.mjs:248`
(`this repository passes…`). It strips `CI` and `FITLOG_BASE_REF`, so it always judges against a local
`main`. A GitHub Actions checkout has no local `main`. When PL-1 runs the backend unit tests in CI, it
must do one of these:
- pass `CI` and `FITLOG_BASE_REF` through to the child unchanged, by removing them from the filter on
  line 249;
- drop test 18, since `backend:test` already runs `check-sql-sources.mjs` directly.

Either way, the job in `.github/workflows/mobile-ci.yml` that runs them needs `fetch-depth: 0` and a
`FITLOG_BASE_REF`.

**L4, full-SHA enforcement in CI.** Do one of these:
- in `scripts/backend/check-sql-sources.mjs` `baseRef` (line 138), when `CI` is on, accept only a full 40- or
  64-hex object ID;
- in `.github/workflows/mobile-ci.yml`, set `FITLOG_BASE_REF` from the same event expression as
  `FITLOG_CONTRACT_BASELINE` (line 24), and validate it in the "Require the trusted contract baseline" step
  with the same full-SHA check as line 41.

Until either is done, a short ref name in CI is accepted, and git resolves a tag before a branch of the
same name.

## Open conditions (from the review, unchanged)

- Before `pnpm backend:test` counts as green on 55321, apply the formula migration there with
  `migration up --local` and no reset. Until then `verify-fixtures.mjs` is expected to fail there.
- Approving the tools does not approve AR-1 or any goal. Box 1 still needs the owner's G-1.
