# QA-1 bootstrap gates — 25 October 2026

Coordinator: Codex. Checkout: current uncommitted `v2/develop` foundation, based on `846fd1f`.
These results are preparatory evidence. They are not a fresh-clone or integrated-main result.

| Check | Observed result |
|---|---|
| `pnpm check` | Pass: TypeScript, lint/design guard, 10 domain tests, 27 mobile tests, 22 planner tests, contracts and ledger coverage, generated plan/board sync |
| `pnpm --filter @fitlog/mobile exec expo export --platform ios --platform android --output-dir .expo/export-native` | Pass: Android and iOS Hermes bundles exported. JavaScript exports are not signed native builds or device acceptance evidence. |
| `node --check` on every backend `.mjs` file | Pass for all seven scripts after Claude removed the programmatic RTK wrapper |
| `pnpm backend:test` | Pass, all four suites, on the isolated local stack (`127.0.0.1:55321`) after loading the existing 20 authored development exercise fixtures |
| Same backend suites with a restricted PATH containing Node, pnpm, Docker and system utilities, with RTK absent | Pass: `RTK absent from PATH; all four backend suites passed.` The coordinator's harness asserted that `which rtk` failed before launching the suite. |
| `pnpm check` after the F-1 auth callback fix | Pass: 126 mobile tests, 10 domain tests, 22 planner tests, TypeScript, lint/design rules, ledger coverage and generated-plan sync |
| F-1 fragment guard mutation in an isolated scratch copy | Four behavioral regression tests fail when the fragment guard is removed; working source unchanged |
| Native JavaScript export repeated after F-1 fix | Pass for both Android and iOS |
| Gitleaks on a copied candidate source/documentation tree | Pass: 301 candidate files, zero findings. Git-ignored runtime files and unrelated marketing artifacts, review screenshots and error.log were excluded and will not be staged. |
| Gitleaks repeated before the application foundation commit | Pass on 25 October: 306 candidate files, exit 0, no findings. Same exclusions; the larger count includes later source and review evidence. |
| Fresh clone of local `main` at `a8d8f31` | Frozen install, full check (126 mobile / 10 domain / 22 planner tests), all four backend suites and Android/iOS JavaScript exports passed; an independent Claude verifier reran these gates successfully |
| Pristine isolated database replay after configured-seed fix | Pass without manual seeding: all migrations and configured seeds replayed, then all four backend suites passed |
| Running auth container versus configured redirect list | Pass: all six exact local callback URLs are loaded; no credentials printed |
| Final Gitleaks run after preview portability correction | Pass: 309 candidate files, exit 0, no findings; same documented exclusions |
| Fresh clone of final local `main` implementation `67e6d1c` | Frozen install, full check (126 mobile / 10 domain / 22 planner tests), all four backend suites and Android/iOS JavaScript exports passed |

Backend result lines:

- Local backend integration passed: adult eligibility, status protection, owner isolation, one active workout, idempotence, stale-revision conflicts, set commit and finish.
- Gym integration passed: tenant isolation, live roles/revocation, retired role rejection, month-end dates, overlap rejection, immutable money, idempotent receipts, disjoint corrections, waiver/credit, consistent account reads, health privacy and 50 concurrent gap-free receipts.
- Freeze projection passed: PRD October/November fixture, optional early-return gap, sold zero/remaining allowance, overlapping freezes, leap/DST calendar dates and started-renewal rejection.
- Freeze integration passed: member/staff requests, permissions, pending isolation, atomic renewal shifts, stale previews, idempotence, overlap/allowance checks, early-return gap, rejection/cancellation, concurrent approvals, attendance eligibility and unchanged finance.

The initial backend test failed because the newly started database lacked the development
catalogue. Running the existing `seed-development.mjs` loaded those fixtures, then all suites
passed. The catalogue remains development content requiring human review before release.

Still required: finish reviews and findings, scan candidate tracked content for secrets/build
output, commit reviewable foundation pieces, integrate on `main`, and rerun every QA-1 gate on
a fresh clone with the local test backend. No QA-1 completion is asserted here.
