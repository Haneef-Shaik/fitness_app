# Project tracker — FitLog rebuild

| Field | Value |
| --- | --- |
| Updated | 25 October 2026 |
| Current baseline | Reviewed mobile/backend foundation on local `main` (QA-1 Done); architecture freeze AR-1 in progress |
| Requirements | [PRD](PRD.md) |
| Delivery sequence | [Master plan](23-MASTER-PLAN.md) and [goal cards](plan/GOALS.md) |
| Goal status | [plan/status.json](plan/status.json), changed only through `scripts/plan/status.mjs` or the board |
| Acceptance results | [plan/ACCEPTANCE.md](plan/ACCEPTANCE.md) |

## Evidence rules

This tracker records evidence produced by the new implementation only: accepted decisions, tests,
measurements, security reviews, releases, pilot evidence and goal handoffs. A goal is not done until
its evidence is recorded here and its live status is marked done in `plan/status.json`.

The plan board owns goal status. The [acceptance ledger](plan/ACCEPTANCE.md) owns the results for
the PRD's acceptance scenarios, budgets, external decisions and deliverables. This tracker owns
decisions, goal handoffs and milestone declarations. How each level is declared is in
[docs/23 §8](23-MASTER-PLAN.md#8-declaring-done).

Do not import or cite the deleted v1 implementation as proof. Its committed Git history remains
recoverable, but it is not evidence for this rebuild.

## Current state

| Area | State | Next evidence |
| --- | --- | --- |
| Product requirements | Complete, consolidated in `docs/PRD.md` | External gate evidence; product rules selected in v2.1 |
| Design | Relevant Momentum PRD v2.1 journeys updated in Figma and reviewed | Full Hindi/platform variants, real assets and implementation QA |
| Planning | 114 goal cards (94 retained, 20 added) reconciled with the reset on 25 October; every PRD scenario, budget, decision and deliverable has a ledger row | QA-1 Done; AR-1 in progress; see `status.mjs ready` |
| Application | Initial Expo/TypeScript theme foundation implemented locally | Native builds/device QA; data/API foundation and member flows |
| Platform | Not started | New environment and deployment decision record |
| Gym pilot | Not started | Fresh field-validation notes and counsel guidance |

## Decision log

Record a decision in this format:

| Date | ID | Decision | Why | Linked requirement / goal |
| --- | --- | --- | --- | --- |
| 2026-10-11 | RST-1 | Rebuild from a documentation-only baseline | The old implementation and its documentation no longer matched the expanded product scope or Figma screens. | Reset baseline; QA-1, QA-2 |
| 2026-10-11 | PROD-01 | Remove dedicated trainer role and all gym private-health reads/writes; retain owner/manager gym programme offers as member-owned copies | Simplifies roles while protecting personal fitness data; no permission transfer to staff | GT01–GT04 retired; PRD12/16/19; G16/G21/G24/G29 |
| 2026-10-11 | PROD-02 | India first public launch, member-before-gym release split, four auth methods, full English/Hindi,≥200 exercises/≥500 Indian foods/three starters; international structure retained | Focused launch without a later data-model rewrite; US/Europe needs separate external gates | PRD2/3/5/6/9/27; OW-1/OW-2 |
| 2026-10-11 | PROD-03 | Reversal corrects erroneous payment; refund returns actual money; principal portions disjoint, cash/charges/credit/allocations separate | Avoids reopened dues or double cash impact from ambiguous corrections | PRD13.3–13.4; AC35; G17 |
| 2026-10-11 | PROD-04 | Month anniversary when date exists; missing day includes whole shorter-month final day; Jan31→Feb28 inclusive/non-leap, renewalMar1 | Predictable member-facing expiry; explicitly replaces v2.0 last-dayFeb27 rule | PRD13.1/14; AC22/36; G17/G20 |
| 2026-10-11 | PROD-05 | Sold freeze allowance wins;30-day creation default; cross-expiry permitted; overlap shift atomic or freeze rejected; early-return gap explicit | Prevents overlapping sold entitlements and silent free extensions | PRD13.2; AC36; G17 |
| 2026-10-11 | PROD-06 | Offline operational roster minimal,24h staff mutation freshness/72h purge; current role and historical eligibility rechecked; authorized reconciliation | Supports real front-desk receipts/visits without stale authority or private-health caching | PRD20.1.1; AC37; G16/G17/G19 |
| 2026-10-11 | PROD-07 | Explicit occurrence selection;≤7-day late completion, one session/occurrence, historic date preserved; deletion resets Pending/Missed | Avoids silently crediting wrong weekday or double adherence | PRD6.3/8; AC38 |
| 2026-10-11 | PROD-08 | Ordinary private streak uses eligible visits independently of challenge enrollment; later status changes preserve history; opt-out/rejoin rule explicit | Challenges remain optional and historical standings remain reproducible | PRD15/17; AC39; G19/G22 |
| 2026-10-11 | PROD-09 | AI allowance reserve/consume/release tied to original UTC bucket; dispatch ordering handles consent/expiry/cancel; ready confirmation retained | No surprise dispatch/billing or quota leaks from cancellation races | PRD10.3; AC40 |
| 2026-10-11 | PROD-10 | Pilot every gym≥40% link/≥25% weekly logging with minimum cohorts,≥5-point renewal gain in≥3 gyms and20 expiry samples/gym/window; Unknown evidence excluded | Prevents large-gym averages and weak evidence masking failure; no invented outcomes | PRD15/23; AC41; OW-12 |
| 2026-10-11 | PROD-11 | Strength goal metric/load basis/version/window explicit; no pre-baseline progress; front desk prepares membership requests but cannot approve | Avoids misleading goals and ambiguous financial authority | PRD11.2/12.1; AC42/43 |
| 2026-10-11 | PROD-12 | Workouts offline; meal/body drafts preserved but Save online. Personal image1GiB/2,000 cap with export/delete/manual logging available; no downgrade eviction | Keeps MVP sync bounded and storage costs predictable without paid manual-data limits | PRD18.1/20/27; AC44 |
| 2026-10-17 | TECH-01 | Start the fresh mobile runtime in `apps/mobile/` with Expo SDK 57, strict TypeScript and a typed Momentum theme boundary | Owner explicitly confirmed Expo + TypeScript, retaining Momentum and shared theme tokens | PRD19/21; DS-1/DS-2; [foundation record](architecture/001-mobile-foundation.md) |
| 2026-10-17 (consolidated 25 Oct) | UI-01 | Momentum is the only UI direction; trainer UI T-01–T-05 is retired. Retain volt lime, dark/light/system, the five-tab member shell and the operational staff shell | Documentary consolidation of the existing owner-backed TECH-01 and PROD-01 decisions, PRD §19 and DEC-01; this records their scope without claiming a new owner approval on 25 Oct | OW-1; [Figma gap register](evidence/OW-1/figma-gaps.md); brand clearance remains DS-6 |
| 2026-10-25 | PLAN-01 | Reconcile the goal plan with the reset. Keep all 94 IDs and statuses, add 20 goals for unowned PRD work, give every card a checkable contract and every milestone Exit checks, and add the acceptance ledger | The reset left the member backend, contract freeze, food AI, operations and acceptance runs without goals, and milestones had no checkable exit | [docs/23 §4](23-MASTER-PLAN.md#4-the-25-october-reconciliation); every goal |
| 2026-10-25 | PLAN-02 | `main` is the integration branch once QA-1 lands the reset and the foundation on it | Integrating goals into the pre-reset `main` would mix v1 and the rebuild | [docs/23 §6](23-MASTER-PLAN.md#6-branches-and-integration); QA-1 |
| 2026-10-25 | MIG-01 | No legacy-user cutover. The owner answered: "Fresh launch: no existing users or data will be redirected." No account, workout or food data is migrated into the rebuild. Historical snapshots and volumes (Git history, the 11 Oct reset snapshot, local Supabase volumes and historical containers) are preserved as they are; this decision authorises no deletion and no migration | Explicit owner answer to DEC-15 on 25 Oct 2026. PRD §27 needs a migration only if actual existing users are redirected. Records the owner's answer only; no technical-lead signature or other external approval is claimed | DEC-15 ([ledger](plan/ACCEPTANCE.md)); PRD §§21.4, 27; [OW-2 register](evidence/OW-2/dependency-register.md); OW-2 |

The product owner selected trainer removal and explicitly delegated remaining product decisions.
PROD records do not assert counsel/vendor/licensing approval or completed implementation. Actual
external gates remain in PRD27. Reset evidence/statuses preserved; the product-decision pass changed no app code. The subsequent Figma pass is recorded below.

## Milestone ledger

A milestone is declared only by the procedure in [docs/23 §8](23-MASTER-PLAN.md#8-declaring-done).
`goal-integrator` fills in a row after a passing `milestone-gatekeeper` verdict.

| Gate | Declares | Status | Declared | Verdict / reference |
| --- | --- | --- | --- | --- |
| MS-0 | Ground truth | Open | — | — |
| MS-1 | Production platform | Open | — | — |
| MS-2 | Momentum foundations | Open | — | — |
| MS-3 | Member core | Open | — | — |
| MS-4 | Launch foundations | Open | — | — |
| MS-5 | Store launch: **MVP-M released** | Open | — | — |
| MS-6 | Gym pilot: **MVP-G released; expanded MVP complete** | Open | — | — |
| MS-7 | Gym Phase 2, or held by OW-12 | Open | — | — |
| MS-8 | Depth and polish | Open | — | — |
| MS-9 | **Project complete** | Open | — | — |

## Handoff log

Record each completed goal in this format:

| Date | Goal | Outcome | Evidence | Follow-on work |
| --- | --- | --- | --- | --- |
| — | — | — | — | — |
| 2026-10-17 | Foundation pass (partial QA-1/DS-1/DS-2; no goal marked done) | New workspace, palette/tokens/provider, saved system/light/dark preference, shared primitives, Appearance, dev gallery, typed English/Hindi catalog and CI definition | `pnpm check`: 20 mobile + 10 planner tests, TypeScript/lint and 94-card validation; Android/iOS bundle export; browser dark/light switch and reload persistence | Native builds/screenshots, fonts/licenses, full kit/navigation, API/offline/auth and GitHub CI execution remain open; see architecture record |
| 2026-10-19 | Connected implementation checkpoint (partial delivery; no goal marked done) | Local Auth/adult onboarding, programme/schedule/logger/history, manual food/body/goals; gym register/plans/membership/freeze/payment/receipt/visit paths; bundled fonts and durable workout/gym outboxes | 10 domain + 27 mobile + 10 planner tests; member/gym/freeze backend integration including concurrent approvals and 50 concurrent gap-free receipts; browser gym-to-receipt fixture; web/iOS/Android exports; DB security advisor and strict function lint | Full remaining feature scope, production integrations/content/legal gates, native device/OS receipt/encryption/accessibility/performance QA and hosted CI remain open; [current record](architecture/002-connected-member-and-gym.md) |
| 2026-10-25 | OW-1 · Done | Momentum decision and complete Figma-gap register independently verified on attempt2; integrated on main | [handoff](plan/runs/OW-1/handoff.md), [verdict](evidence/OW-1/verdict-attempt-2.json), implementation 7fe8191 | Live Figma drawing, Hindi/iOS implementation and release evidence remain with their goals |
| 2026-10-25 | QA-1 · Done | Reviewed foundation integrated; clean-main-clone install, all checks, backend suites and both JS exports independently pass on attempt2 | [handoff](plan/runs/QA-1/handoff.md), [verdict](evidence/QA-1/verdict-attempt-2.json), implementation 67e6d1c | AR-1 contract freeze and the remaining platform/design/member/gym/release goals |

| 2026-10-25 | OW-2 · Done | All 25 DEC rows registered; owner MIG-01 resolves DEC-15 as n/a for fresh launch | [handoff](plan/runs/OW-2/handoff.md), [verdict](evidence/OW-2/verdict-attempt-2.json), evidence commit b4771d0; standard gates pass | Other DEC proofs remain open; AR-1 architecture freeze in progress |

<!-- handoff:OW-1:7fe8191 -->
<details>
<summary>OW-1 integration handoff — 25 October 2026</summary>

### Handoff — OW-1 · Record the selected Momentum direction and its Figma gaps        attempt 2 · v2/develop (bootstrap, uncommitted) · base 846fd1f

> **Integration close-out, 25 October:** independent attempt 2 passed both boxes
> ([verdict](evidence/OW-1/verdict-attempt-2.json)); evidence commit `7fe8191` is on local
> `main`. Fresh-main checks passed before Codex marked OW-1 Done. The submission record below
> describes its earlier bootstrap preparation, not the current integration state.

> **Bootstrap correction, not a goal-worktree run.** Prepared 25 October 2026 by the Claude execution
> worker under the Codex orchestrator, after independent verification of attempt 1 accepted box 1
> (through tracker UI-01) and failed box 2 (the iOS list lacked most member screen families). This pass
> edited only `docs/evidence/OW-1/figma-gaps.md` and this handoff. It ran no commands, used no git, did
> not delegate and opened no external service, Figma included. `status.json`, GOALS.md, the tracker,
> ACCEPTANCE.md and code are unchanged.

**Outcome claimed.** Documentary evidence for both Done-when boxes is submitted for independent
verification. Neither box is verified in this attempt, and nothing is on `main`.

Line references are `file:line` in this checkout. `tracker` is `docs/09-PROJECT-TRACKER.md`;
`docs/22` is `docs/22-UI-MOMENTUM.md`.

#### Done when

| Box (verbatim from GOALS.md:114–115) | Status | Evidence |
|-----|-----|----------|
| The tracker decision log has an owner-dated entry: Momentum is the only UI direction and the trainer UI is retired | Documentary evidence submitted for verification | tracker:57 UI-01 |
| `docs/evidence/OW-1/figma-gaps.md` lists every frame still to draw (O-23, O-24, Hindi, iOS), each with the goal that needs it | Documentary evidence submitted for verification (corrected after the failed check) | [figma-gaps.md](evidence/OW-1/figma-gaps.md) |

##### Box 1

> The tracker decision log has an owner-dated entry: Momentum is the only UI direction and the trainer UI is retired

- tracker:57, **UI-01**, dated "2026-10-17 (consolidated 25 Oct)": "Momentum is the only UI direction;
  trainer UI T-01–T-05 is retired. Retain volt lime, dark/light/system, the five-tab member shell and
  the operational staff shell."
- UI-01 consolidates owner choices that were already recorded. It approves nothing new. Its Why column
  reads: "Documentary consolidation of the existing owner-backed TECH-01 and PROD-01 decisions, PRD §19
  and DEC-01; this records their scope without claiming a new owner approval on 25 Oct". The sources:
  - TECH-01 (tracker:56, 2026-10-17): "Owner explicitly confirmed Expo + TypeScript, retaining Momentum
    and shared theme tokens".
  - PROD-01 (tracker:44, 2026-10-11), with tracker:61: "The product owner selected trainer removal".
- UI-01 was already in the tracker when this attempt began. This attempt did not edit the tracker.

##### Box 2

> `docs/evidence/OW-1/figma-gaps.md` lists every frame still to draw (O-23, O-24, Hindi, iOS), each with the goal that needs it

**What this attempt changed in the register.**
- **§4 iOS, rewritten as 29 rows.** Each row names the goal that builds the screens and the box that
  proves them on an iOS release build: QA-4 1 for member screens (QA-4 2 for VoiceOver over the logger,
  the diary and settings), PL-8 1–2 and G15.app 2 for the device journeys, and G23 1 for gym screens.
- **The families the verifier found missing are now listed:**
  - A-01, A-07a–f, A-08–A-10 (SC-5)
  - B-02–B-05 (SC-3)
  - C-01–C-09, D-01–D-04 (SC-2)
  - E-01, E-02, E-05–E-07, E-09, E-12, E-13 (SC-2)
  - F-01–F-07 (SC-2; AP-2 for F-04)
  - G-01–G-07, I-01–I-06, J-01–J-04 (SC-3)
  - H-02, H-04, H-05, H-10–H-16 (SC-4)
  - H-06, H-07, H-18 (AI-3)
- **The gym rows are split by the goal that builds them:** G16.app, G17.app, G18.app, G19.app,
  G20.app, G21.app and G22.app.
- **No current iOS frame is invented.** The three page-04 iOS frames (B-01, E-03, E-11, from 4 October)
  stay recorded as historical coverage. Only 3 rows are partly documented (shell, Today, logger loop),
  1 has the mapping table only (kit), and 25 are still to draw.
- **Other omissions found by comparing PRD §19.1–19.2 and docs/22 §3.1:**
  - The member shell's quick actions and active-session recovery affordance (PRD:1200–1201).
  - The gym-join expired, wrong-phone and already-linked states (PRD:1223), in both the Hindi and iOS
    tables.
  - Today's gym cards (PRD:1224): a Hindi row, iOS-24 and a §6 note. No card owns them.
  - Pro pending, verifying and restore states (PRD:1233).
  - Native share-sheet and photo-picker patterns.
  - O-01 moved to the G16.app staff-shell row.
- **Summary counts updated.** Hindi now has 14 member families and 13 gym rows. iOS now has 29 rows.
  O-23 (10 rows), O-24 (9 rows plus 2 remaining N-06 states) and the 7 retired-entry checks are
  unchanged.
- **Citations.**
  - Tracker citations shifted by the UI-01 insertion are corrected: 60→61, 94→95, 96–97→97–98,
    100→101, 103→104.
  - docs/22:107–108 is corrected to 108–109.
  - UI-01 (tracker:57) is cited in the header, §0 and §5.

**Bounds.** The register is built from local documents only. Rows marked "partly documented" rest on
the tracker's 11 October statement that the node links were verified (tracker:101). Any row marked
"still to draw" may already exist in the file (docs/22:88). P2 and gated screens are excluded on
purpose, and the register lists them.

#### Acceptance evidence

| Ledger row | Run | Result | Row written here? |
|------------|-----|--------|-------------------|
| DEC-01 · brand assets cleared (OW-1, DS-6 · MS-5; ACCEPTANCE:115) | None; records only | No result | No. DS-6 is the last prover |
| DEC-13 · member scope, no trainer or coaching (OW-1, QA-3 · MS-3; ACCEPTANCE:131) | None; records only | No result | No. QA-3 is the last prover |

#### Gates

| Gate | Result |
|------|--------|
| `pnpm check` | Passes on the current dirty bootstrap checkout, as run and reported by the Codex orchestrator. This worker did not run it. No fresh result from `main` is claimed |
| `node scripts/plan/build.mjs --check` | Not run. This attempt did not change GOALS.md or ACCEPTANCE.md |

#### Pending

- **Independent verification** of both boxes by `goal-verifier`.
- **Integration onto `main`.** A goal is Done only after verification and the merge to `main`
  (GOALS.md:58). QA-1 needs OW-1 (GOALS.md:138), and the reset exists only on `v2/develop` until QA-1
  lands it (docs/23 §6). The orchestrator decides how OW-1's evidence reaches `main`.
- **Status and commit.** `status.json` is untouched, and both files remain uncommitted.

#### Follow-ups outside OW-1's boxes (not blockers)

- A live Figma audit that adds node links for rows that already exist (register §7, step 1).
- Drawing the remaining frames (register §7, step 2).
- Handing the register to the designer, which the card's Outcome describes (GOALS.md:103–105).

#### Found for other goals

- **QA-2 (docs/22 is in scope, GOALS.md:206).**
  - docs/22:147–149 says O-23 and O-24 are "not claimed to exist yet", against the linked O-23 frames at
    docs/22:93.
  - The retired page has two names (docs/22:80 against docs/22:144, 258).
  - docs/22:34–35 repeats a garbled phrase.
- **Plan owner.**
  - G21.app's PRD line (GOALS.md:1433) still says O-23 is "to be drawn".
  - Today's gym cards (PRD:1224, MVP-G) have no owning build card.
- **Builders.** Each goal named in the register's §1–§4 owns the rows that cite it.

#### Decisions forced

None.

#### Traps hit

- **Shifted tracker lines.** Inserting UI-01 at tracker:57 moved every later tracker line down by one.
  Citations from attempt 1 pointed at the wrong rows.
- **docs/22 contradicts itself on O-23.** The register follows the dated, linked live table and flags
  the conflict.
- **Historical D47 instructions** in `owner-packs/OW-1.md` and the INBOX snapshot predate the reset
  (INBOX.md:24). They were not followed.

</details>

<!-- handoff:QA-1:67e6d1c -->
<details>
<summary>QA-1 integration handoff — 25 October 2026</summary>

### Handoff — QA-1 · Land the post-reset foundation on main

Attempt 2 · 25 October 2026 · local `main` · final implementation commit `67e6d1c`.
Coordinator: Codex; implementation and independent code/security reviews: local Claude.

**Accepted outcome.** The reviewed post-reset foundation is committed on local `main`. A separate
fresh clone passed the required gates, which the independent Claude verifier reran. Attempt 2
passed all four boxes ([verdict](evidence/QA-1/verdict-attempt-2.json)); Codex then marked
QA-1 Done through the status CLI. No push, hosted CI run, deployment or native-device acceptance is claimed.

#### Done when

| Box (verbatim) | Evidence submitted |
|---|---|
| `main` contains the foundation; `git ls-files` shows no build output, and a secret scan of the tree is clean | Local `main` at `67e6d1c` includes workspace commit `4a7a6ea`, application/backend commit `a8d8f31` and the preview portability correction `67e6d1c`. Ignored runtime directories, environments, unrelated marketing artifacts, review screenshots and error.log were not staged. Gitleaks scanned a copied candidate source/documentation tree: latest run 309 files, exit 0, no findings. See bootstrap-gates.md. |
| On a fresh clone of `main`, `pnpm install --frozen-lockfile`, `pnpm check` and (local Supabase running) `pnpm backend:test` pass; result lines are in the handoff | Clone `/private/tmp/fitlog-qa1-main-67e6d1c`, branch `main`, commit `67e6d1c`. Frozen install passed. `pnpm check` passed: 7 mobile suites / 126 tests, 10 domain tests, 22 planner tests, TypeScript, lint/design guards, contract coverage and generated-plan sync. All four backend suites passed against the isolated local stack. Exact result lines below. |
| Android and iOS JavaScript exports pass from the same clone | In that same clone, `EXPO_NO_TELEMETRY=1 pnpm --filter @fitlog/mobile exec expo export --platform ios --platform android --output-dir .expo/export-native` passed. Result: `ios bundles (1)`, `android bundles (1)`, `Exported: .expo/export-native`. These are JavaScript/Hermes exports, not signed native builds. |
| Review reports are in `docs/evidence/QA-1/`, and every finding left open names its owning goal | bootstrap-code-review.md, bootstrap-security-review.md and auth-callback-verification.md. High F-1 is fixed and independently checked; high G-1 is fixed and passes after a pristine reset without manual seeding. Remaining findings and ownership are recorded below and in the reports. |

#### Acceptance evidence

PD-01 remains open: QA-1 is an early prover, not the last prover. No acceptance-ledger result was
changed. Later goals must prove complete delivery and release readiness.

#### Gates and exact result lines

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

#### Inherited and used

The prior 17–19 October implementation was adopted as incomplete foundation code, not accepted as
feature completion. Existing owner-backed Momentum/Expo decisions remain in the tracker. OW-1's
second independent verdict passed and its evidence reached `main` before formal QA-1 acceptance.

Bootstrap sequencing: planning/reset commit `7fe8191` landed first; reviewed foundation commits
followed so the explicit fresh-clone-of-main check could run. No downstream feature goal was
dispatched before acceptance. OW-1 was then marked Done, and QA-1 claimed for final verification.
No dependency or acceptance override was used.

#### Fixes and mutation checks

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

#### Review findings left open

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

#### Found for other goals

| Existing area | Goals that must adopt/finish it |
|---|---|
| Theme, typography, primitives, shell and strings | DS-1–DS-5, G14.app, G14.hi |
| Domain Zod contracts, SQL migrations and generated database types | AR-1, CT-1 |
| Auth and onboarding | MB-1, SC-5, PL-3, G13 |
| Programmes, scheduling, logger, history and private member data | MB-2–MB-7, SC-1–SC-7 |
| Gym roles/register/membership/finance/visits/freeze partial implementation | G16.api–G22.api and their `.app` goals |
| Development exercise seed | CT-1, OW-13; not launch-scale reviewed content |
| CI definition and test coverage | PL-1, QA-9, QA-11 |

#### Left undone

Production provisioning, provider approvals, complete PRD feature scope, qualified content/legal
review, real Android/iOS device evidence, performance/accessibility, hosted CI, store/beta/pilot
evidence and every later milestone remain open. The app is not release-ready.

</details>


## Design evidence — 11 October 2026

Actual Momentum Figma screens were updated to PRD v2.1, including owner/manager programme templates
and member acceptance, membership/freeze dates, finance adjustments, operational permissions, offline
handoff, planned occurrences, strength baselines, privacy/storage and food AI lifecycle. The trainer
page is retired with no prototype entry points. Food AI is MVP; added voice/review/question/owner
assistant concepts are visibly Phase 2, with MVP links into deferred features removed.

The [live screen inventory](22-UI-MOMENTUM.md#live-v21-screen-evidence) contains verified node links.
The final structural audit passed for 97 reviewed frames (editable text/components, no missing fonts
or whole-screen raster fills), and representative dark/light screens passed visual review after repairs.
Full Hindi screens, full iOS coverage and photographs remain incomplete; prototypes simulate selected
journeys rather than production behavior. No application implementation or goal completion is claimed.

<!-- handoff:OW-2:b4771d0 -->
<details>
<summary>OW-2 integration handoff — 25 October 2026</summary>

# Handoff — OW-2 · Register every external launch dependency        attempt 2 · `codex/ow2-owner-resolution` · base 9f148c1 (session git snapshot; git not run)

> **Integration disposition.** Independent Claude verification passed all three boxes on attempt 2
> ([verdict](evidence/OW-2/verdict-attempt-2.json)). Codex corrected the minor stale references,
> passed the standard gates and integrated `b4771d0` on local `main` before marking OW-2 Done.
> DEC-15 alone is `n/a`; other DEC proof remains open. The submission record follows.

**Outcome claimed.** None. All three Done-when boxes now have evidence, submitted for independent
verification and then integration on `main`. OW-2 is **not** Done, and Done is not claimed.

Prepared on 25 Oct 2026 by a bounded Claude documentation worker under Codex. This attempt records the
owner's explicit DEC-15 answer of 25 Oct 2026: "Fresh launch: no existing users or data will be
redirected." No other external approval is inferred from it.

It wrote only these files:
- [`docs/evidence/OW-2/dependency-register.md`](evidence/OW-2/dependency-register.md): the
  DEC-15 state, detail and answer, with the header and §§5–6 brought into line;
- [ACCEPTANCE.md](plan/ACCEPTANCE.md): the DEC-15 result cell only;
- [the tracker](09-PROJECT-TRACKER.md): one decision row, MIG-01;
- [INBOX.md](plan/INBOX.md): the DEC-15 pending action only;
- this handoff.

It ran no commands and no git, changed no status, contacted no external service, delegated nothing and
recorded no technical-lead signature.

## Done when

| Box | Evidence submitted | Verifier checks |
|-----|--------------------|-----------------|
| `docs/evidence/OW-2/dependency-register.md` gives every DEC row in [ACCEPTANCE.md](plan/ACCEPTANCE.md) its current state and the proof that will close it | Register §1 covers all 25 DEC ledger rows (DEC-01 to DEC-17, every split row) with gate, decider, writer, current state and closing proof. §2 gives each its missing proof, next action and what stays blocked. DEC-15 now cites MIG-01 | §1 against ACCEPTANCE.md rows 115–139, one by one |
| DEC-15 is answered: no legacy-user cutover (its ledger row set to `n/a · <reason>`), or a migration goal is added to this plan | **Answered: no cutover.** Tracker MIG-01 (2026-10-25) quotes the owner. The ledger row reads `n/a · no legacy-user cutover; owner confirmed fresh launch with no existing users or data redirected on 2026-10-25 (tracker MIG-01)`. No migration goal is needed. MIG-01 preserves historical snapshots and volumes and authorises no deletion or migration. Register §2 DEC-15 and §3 | The quote matches the owner's answer; the row is well-formed; nothing claims deletion, migration or other approval |
| No entry claims an approval, account or licence without dated proof | Register §6: every "External proof on record" reads None, a candidate, or local implementation evidence without release approval. The dated owner items, MIG-01 included, are choices, not accounts, licences or external approvals. §4 keeps selected rules, owner-confirmed choices and candidates apart | Independently, entry by entry |

## Acceptance evidence

| Ledger row | Run (build or environment, date) | Result | Evidence | Row written here? |
|------------|----------------------------------|--------|----------|-------------------|
| DEC-15 (MS-5) | None. Documentation only, 25 Oct 2026 | `n/a · no legacy-user cutover; owner confirmed fresh launch with no existing users or data redirected on 2026-10-25 (tracker MIG-01)` | Tracker MIG-01; register §2 DEC-15 and §3 | Yes. OW-2 is the only prover, so it writes the row |

The other 24 DEC rows are written by other goals and still read `open`. DEC-02 names OW-2 as a
prover, but OW-3 writes it.

## Gates

| Gate | Command | Result |
|------|---------|--------|
| Plan check | `node scripts/plan/build.mjs --check` | PASS within coordinator `pnpm check`: 114 goals, 230 needs, 94 ledger rows; generated board and plan match GOALS.md |
| Standard gates | `pnpm check` | PASS, coordinator run 25 Oct 2026: TypeScript, lint/design, 126 mobile + 10 domain + 22 planner tests and artifact/ledger validation |

## For the verifier

- **Ledger process.** ACCEPTANCE.md says a result changes only on a goal branch through `/run-goal`
  and `goal-verifier`, and never by hand on `main`. The coordinator moved this candidate to `codex/ow2-owner-resolution` before
  integration. Independent verification is required before merging to `main`.
- **Technical lead.** PRD §27 names the owner and the technical lead. MIG-01 records the owner's
  answer only. Whether that is enough for `n/a` is for the verifier or the owner to rule on.
- **Coordinator refresh.** Codex refreshed the register's board-state and DEC-01/DEC-13
  references after this worker completed: OW-1 and QA-1 are Done, UI-01 is integrated, OW-2 and
  AR-1 are claimed. External approval and release proof remain open.
- **Snapshot and volumes.** Not checked to exist. MIG-01 preserves them, and with no cutover nothing
  depends on them.

## Traps hit

- **"No automatic migration" is not "no cutover".** The PRD rule covers import behaviour. Only the
  owner's 25 Oct answer settles whether real users are redirected.
- **Archived packs look like defaults.** The 10 Oct provider and region recommendations were never
  answered. They are recorded as candidates, not preferences.
- **Q7 is not a region choice.** "our target udience is India/US and Europe all" is audience intent
  (PRD §27).

## Found for other goals

Gaps G-1 to G-8 are unchanged (register §5). None was fixed here.

## Still external (not OW-2 blockers)

Other DEC rows retain their specified external proof or release verification: accounts and region,
counsel, accounting review, DLT and Meta, store billing, the AI vendor, devices, licences, pilot field
work and scope checks. Long-lead work that can
start now: OW-9 field work, the DEC-01 name search and clearance, and DEC-04 counsel. DLT and Meta
verification (OW-5) can start once OW-2 is Done. The DEC-09 photo policy (the owner's call: a nightly
object copy or an explicitly accepted gap) is needed by PL-5 before MS-1.

</details>
