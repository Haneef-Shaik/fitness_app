# Handoff — QA-1 · Land the post-reset foundation on main

Attempt 2 · 25 October 2026 · local `main` · final implementation commit `67e6d1c`.
Coordinator: Codex; implementation and independent code/security reviews: local Claude.

**Accepted outcome.** The reviewed post-reset foundation is committed on local `main`. A separate
fresh clone passed the required gates, which the independent Claude verifier reran. Attempt 2
passed all four boxes ([verdict](../../../evidence/QA-1/verdict-attempt-2.json)); Codex then marked
QA-1 Done through the status CLI. No push, hosted CI run, deployment or native-device acceptance is claimed.

## Done when

| Box (verbatim) | Evidence submitted |
|---|---|
| `main` contains the foundation; `git ls-files` shows no build output, and a secret scan of the tree is clean | Local `main` at `67e6d1c` includes workspace commit `4a7a6ea`, application/backend commit `a8d8f31` and the preview portability correction `67e6d1c`. Ignored runtime directories, environments, unrelated marketing artifacts, review screenshots and error.log were not staged. Gitleaks scanned a copied candidate source/documentation tree: latest run 309 files, exit 0, no findings. See bootstrap-gates.md. |
| On a fresh clone of `main`, `pnpm install --frozen-lockfile`, `pnpm check` and (local Supabase running) `pnpm backend:test` pass; result lines are in the handoff | Clone `/private/tmp/fitlog-qa1-main-67e6d1c`, branch `main`, commit `67e6d1c`. Frozen install passed. `pnpm check` passed: 7 mobile suites / 126 tests, 10 domain tests, 22 planner tests, TypeScript, lint/design guards, contract coverage and generated-plan sync. All four backend suites passed against the isolated local stack. Exact result lines below. |
| Android and iOS JavaScript exports pass from the same clone | In that same clone, `EXPO_NO_TELEMETRY=1 pnpm --filter @fitlog/mobile exec expo export --platform ios --platform android --output-dir .expo/export-native` passed. Result: `ios bundles (1)`, `android bundles (1)`, `Exported: .expo/export-native`. These are JavaScript/Hermes exports, not signed native builds. |
| Review reports are in `docs/evidence/QA-1/`, and every finding left open names its owning goal | bootstrap-code-review.md, bootstrap-security-review.md and auth-callback-verification.md. High F-1 is fixed and independently checked; high G-1 is fixed and passes after a pristine reset without manual seeding. Remaining findings and ownership are recorded below and in the reports. |

## Acceptance evidence

PD-01 remains open: QA-1 is an early prover, not the last prover. No acceptance-ledger result was
changed. Later goals must prove complete delivery and release readiness.

## Gates and exact result lines

Commands ran in the fresh clone, not against an unstaged source tree:

```text
pnpm install --frozen-lockfile
  exit 0 (Node 22.23.1, pnpm 10.27.0)
pnpm check
  Test Suites: 7 passed, 7 total
  Tests: 126 passed, 126 total
  Domain: 10 passed, 0 failed
  Planner: 22 passed, 0 failed
  plan.json and board.html match GOALS.md
pnpm backend:test
  Local backend integration passed: adult eligibility, status protection, owner isolation, one active workout, idempotence, stale-revision conflicts, set commit and finish.
  Gym integration passed: tenant isolation, live roles/revocation, retired role rejection, month-end dates, overlap rejection, immutable money, idempotent receipts, disjoint corrections, waiver/credit, consistent account reads, health privacy and 50 concurrent gap-free receipts.
  Freeze projection passed: PRD October/November fixture, optional early-return gap, sold zero/remaining allowance, overlapping freezes, leap/DST calendar dates and started-renewal rejection.
  Freeze integration passed: member/staff requests, permissions, pending isolation, atomic renewal shifts, stale previews, idempotence, overlap/allowance checks, early-return gap, rejection/cancellation, concurrent approvals, attendance eligibility and unchanged finance.
native JS export
  ios bundles (1)
  android bundles (1)
  Exported: .expo/export-native
```

The isolated test database was confirmed to have zero user accounts before the coordinator restarted
and reset it. All migrations and configured seeds replayed; backend tests passed without running
`seed-development.mjs` manually. The restarted auth container includes all six exact callback URLs
from config.toml. No historical FitLog database was reset.

Final diagnostic logs: `/tmp/fitlog-final-{install,check,backend,native-export}.log` and
`/tmp/fitlog-db-pristine-reset.log`. Logs are not release artifacts or repository inputs.

## Inherited and used

The prior 17–19 October implementation was adopted as incomplete foundation code, not accepted as
feature completion. Existing owner-backed Momentum/Expo decisions remain in the tracker. OW-1's
second independent verdict passed and its evidence reached `main` before formal QA-1 acceptance.

Bootstrap sequencing: planning/reset commit `7fe8191` landed first; reviewed foundation commits
followed so the explicit fresh-clone-of-main check could run. No downstream feature goal was
dispatched before acceptance. OW-1 was then marked Done, and QA-1 claimed for final verification.
No dependency or acceptance override was used.

## Fixes and mutation checks

- F-1: the new auth regression suite failed before the handler existed. Claude implemented a strict,
  PKCE-only callback, exact runtime URL matching, signed-in-session refusal and serialized handling.
  An independent Claude security verifier found no remaining High in that path. Removing the fragment
  guard in a scratch copy caused four behavioral failures; working source was unchanged.
- Programmatic RTK wrappers were removed from seven backend scripts. All four suites also passed
  with RTK absent from PATH; the harness first asserted `which rtk` failed.
- G-1: the first fresh-stack run failed with `Run seed-development.mjs first`. Configured seeds now
  load the existing 20 authored development exercises automatically; pristine replay passes.
- R-1: local auth redirects now include the actual triple-slash native callback, localhost web and
  exact loopback Expo URLs. AuthScreen and MemberProvider use the shared callback path constant.
- F-8i: attempt 1 passed all gates but failed because a macOS-only preview output path remained
  assigned to QA-1. Claude corrected it to `join(tmpdir(), 'fitlog-preview-account.json')`, retaining
  mode 0600 and credential privacy. Commit `67e6d1c` passed all required gates in a new fresh clone.
  The preview-account creation itself was not rerun; no extra account was needed for this path fix.

## Review findings left open

No Critical or High finding remains submitted as open. The independent verifier must confirm that.
Lower findings stay owned by their goal; these are not accepted release behavior:

| Finding | Owning goals |
|---|---|
| Revoked-session read policies | MB-1, G16.api |
| Database enforcement of append-only finance; lock authorization order; front-desk duplicate-reference policy | G17.api |
| Rejected/conflicted outbox recovery, cache performance/durability, offline cold start, key recovery, pruning | MB-3, with MB-1 for identity |
| Member catalogue-ID collision | CT-1, MB-2, MB-5 |
| Programme upsert race, schedule refresh cost | MB-2 |
| Audit snapshot growth | MB-4 |
| Staff notes visibility and private-health content boundary | G18.api, G17.api |
| Owner creation/verification | G16.api |
| SQL copies versus migrations | AR-1 |
| Session-storage chunking tests and cache-handle cleanup | MB-1 |
| Password recovery completion, callback queue/integration/provider tests and native end-to-end acceptance | MB-1, SC-5 |
| Callback failure feedback | SC-5 |
| Hosted redirect configuration and verified HTTPS links | PL-2, PL-4, MB-1 |
| Hosted CI, backend CI, branch protection | PL-1 |
| Strict-peer install and Expo dependency compatibility checks in hosted CI; any required Windows subprocess support | PL-1 (Windows development is not claimed as currently supported) |

The reports retain the detailed file/line references and failure paths. Their initial blocker lists
describe the pre-fix review; this handoff and the fix evidence record subsequent disposition.

## Found for other goals

| Existing area | Goals that must adopt/finish it |
|---|---|
| Theme, typography, primitives, shell and strings | DS-1–DS-5, G14.app, G14.hi |
| Domain Zod contracts, SQL migrations and generated database types | AR-1, CT-1 |
| Auth and onboarding | MB-1, SC-5, PL-3, G13 |
| Programmes, scheduling, logger, history and private member data | MB-2–MB-7, SC-1–SC-7 |
| Gym roles/register/membership/finance/visits/freeze partial implementation | G16.api–G22.api and their `.app` goals |
| Development exercise seed | CT-1, OW-13; not launch-scale reviewed content |
| CI definition and test coverage | PL-1, QA-9, QA-11 |

## Left undone

Production provisioning, provider approvals, complete PRD feature scope, qualified content/legal
review, real Android/iOS device evidence, performance/accessibility, hosted CI, store/beta/pilot
evidence and every later milestone remain open. The app is not release-ready.
