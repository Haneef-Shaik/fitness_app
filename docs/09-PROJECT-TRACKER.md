# Project tracker — FitLog rebuild

| Field | Value |
| --- | --- |
| Updated | 27 October 2026 (QA-2 documentation reconciliation) |
| Current baseline | Reviewed mobile/backend foundation on local `main` (QA-1 Done, `67e6d1c`); architecture and contract 0.1.0 frozen and integrated (AR-1 Done, `73e3f63`; [record 003](architecture/003-architecture-freeze.md)) |
| Requirements | [PRD](PRD.md) |
| Architecture | [003 — architecture and contract freeze](architecture/003-architecture-freeze.md), approved by delegation (ARCH-01) |
| Delivery sequence | [Master plan](23-MASTER-PLAN.md) and [goal cards](plan/GOALS.md) |
| Goal status | **Owned by the plan board**: [plan/status.json](plan/status.json), changed only through `scripts/plan/status.mjs` or the board. This tracker does not hold goal status |
| Acceptance results | **Owned by [plan/ACCEPTANCE.md](plan/ACCEPTANCE.md)**, written only by each row's last prover. This tracker does not hold acceptance results |

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

Snapshot of 27 October 2026. Live goal status is on the board (`node scripts/plan/status.mjs summary`).

| Area | State | Next evidence |
| --- | --- | --- |
| Product requirements | Complete, consolidated in `docs/PRD.md` | External gate evidence; product rules selected in v2.1 |
| Design | Relevant Momentum PRD v2.1 journeys updated in Figma and reviewed | Full Hindi/platform variants, real assets and implementation QA |
| Planning | 114 goal cards (94 retained, 20 added) reconciled with the reset on 25 October; every PRD scenario, budget, decision and deliverable has a ledger row | OW-1, OW-2, QA-1 and AR-1 are Done; the board shows what is ready (`status.mjs ready`) |
| Architecture | Frozen in [record 003](architecture/003-architecture-freeze.md) and integrated with AR-1 (`73e3f63`): Supabase Postgres as the system of record, the `/v1` RPC contract rules, and contract package `@fitlog/domain` 0.1.0 | Later contract versions arrive with the backend goals (MB-1 onward, 003 §8); owner-reserved items R-1 to R-7 (003 §11) |
| Application | Reviewed Expo/TypeScript foundation on `main` (QA-1) with connected local member and gym paths ([record 002](architecture/002-connected-member-and-gym.md)); far from complete | Member backend on the frozen contract (MB-1 to MB-7), screens, native builds and device QA |
| Platform | Not provisioned. The target platform and environments are decided in 003 §2 and §9. No hosted Supabase project or build account is opened (003 §11 R-2: "Nothing opened"), and no hosted CI run is recorded | PL-1 hosted CI; accounts and region are owner-reserved (003 §11, R-1 and R-2) |
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
| 2026-10-26 | AUTH-01 | The owner delegates final decisions, in their words: "i dont wanted to get involved i wanted you to act as the final decision make and guide the claude". Codex, the coordinating agent, accepts and acts from now on as the explicitly delegated decision-maker for routine product, engineering and vendor-technical choices and for final technical sign-off. The delegation decides; it does not create evidence. Account access, payments, external messages, legal and licence positions, and device proof still need real evidence | The owner does not want to be involved in routine decisions. Recorded so that later approvals name their authority truthfully | Every goal whose box asks for owner approval of a technical record; AR-1 |
| 2026-10-26 | ARCH-01 | Codex, as the owner's explicitly delegated decision-maker (AUTH-01), approves [architecture record 003](architecture/003-architecture-freeze.md), revision 3 with the final low corrections N-1 to N-5, as the AR-1 freeze, with no exceptions. The owner did not personally review or sign 003. This row does not decide R-1 to R-7 | Independent [proposal review 4](evidence/AR-1/proposal-review4.json) and the independent [guard review](evidence/AR-1/guard-review.json) both PASS. Local gates: 185 tests in `pnpm check`, 39 guard tests, a 15-migration replay with a strict empty diff, 8 persisted schemas matching, and the shared AC03 fixture passing ([evidence](evidence/AR-1/)) | AR-1 box 1 (approval half); DEC-02 (technical part); QA-2 |

The product owner selected trainer removal and explicitly delegated remaining product decisions.
PROD records do not assert counsel/vendor/licensing approval or completed implementation. Actual
external gates remain in PRD27. Reset evidence/statuses preserved; the product-decision pass changed no app code. The subsequent Figma pass is recorded below.

AUTH-01 and ARCH-01 record a delegated decision, not an owner review. ARCH-01 supplies only the
approval half of AR-1's first box. *Historical (26 October, before integration): AR-1 is not Done: a
fresh independent verifier must pass all four boxes, and the branch must be integrated, before its
status changes (docs/23 §8).* **Since then:** the independent verifier passed all four boxes and AR-1
was integrated on local `main` at `73e3f63` and marked Done (handoff log below).

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

Every row and every appended handoff below is a dated record of its own time. Statements in them such
as "in progress", "not Done", "pending" or "claimed" are historical; *Current state* above and the
board give the live state. A handoff appended in full keeps its text as written, with three
exceptions made by QA-2 on 27 October 2026 and listed in a note at the top of that handoff: relative
links are re-based to resolve from `docs/`; in-page links that would jump to an earlier handoff's
heading of the same name are written as words; and words run together in coordinator text are
re-spaced.

Record each completed goal in this format:

| Date | Goal | Outcome | Evidence | Follow-on work |
| --- | --- | --- | --- | --- |
| — | — | — | — | — |
| 2026-10-17 | Foundation pass (partial QA-1/DS-1/DS-2; no goal marked done) | New workspace, palette/tokens/provider, saved system/light/dark preference, shared primitives, Appearance, dev gallery, typed English/Hindi catalog and CI definition | `pnpm check`: 20 mobile + 10 planner tests, TypeScript/lint and 94-card validation; Android/iOS bundle export; browser dark/light switch and reload persistence | Native builds/screenshots, fonts/licenses, full kit/navigation, API/offline/auth and GitHub CI execution remain open; see architecture record |
| 2026-10-19 | Connected implementation checkpoint (partial delivery; no goal marked done) | Local Auth/adult onboarding, programme/schedule/logger/history, manual food/body/goals; gym register/plans/membership/freeze/payment/receipt/visit paths; bundled fonts and durable workout/gym outboxes | 10 domain + 27 mobile + 10 planner tests; member/gym/freeze backend integration including concurrent approvals and 50 concurrent gap-free receipts; browser gym-to-receipt fixture; web/iOS/Android exports; DB security advisor and strict function lint | Full remaining feature scope, production integrations/content/legal gates, native device/OS receipt/encryption/accessibility/performance QA and hosted CI remain open; [current record](architecture/002-connected-member-and-gym.md) |
| 2026-10-25 | OW-1 · Done | Momentum decision and complete Figma-gap register independently verified on attempt2; integrated on main | [handoff](plan/runs/OW-1/handoff.md), [verdict](evidence/OW-1/verdict-attempt-2.json), implementation 7fe8191 | Live Figma drawing, Hindi/iOS implementation and release evidence remain with their goals |
| 2026-10-25 | QA-1 · Done | Reviewed foundation integrated; clean-main-clone install, all checks, backend suites and both JS exports independently pass on attempt2 | [handoff](plan/runs/QA-1/handoff.md), [verdict](evidence/QA-1/verdict-attempt-2.json), implementation 67e6d1c | AR-1 contract freeze and the remaining platform/design/member/gym/release goals |
| 2026-10-25 | OW-2 · Done | All 25 DEC rows registered; owner MIG-01 resolves DEC-15 as n/a for fresh launch | [handoff](plan/runs/OW-2/handoff.md), [verdict](evidence/OW-2/verdict-attempt-2.json), evidence commit b4771d0; standard gates pass | Other DEC proofs remain open; AR-1 architecture freeze in progress |
| 2026-10-26 | AR-1 · Done | Architecture approved by Codex under explicit owner delegation AUTH-01/ARCH-01; contract 0.1.0, shared TS/SQL fixtures and 15 migration replay verified and integrated | Local main 73e3f63; [final verdict](evidence/AR-1/verdict-attempt-1.json); [integration gates](evidence/AR-1/integration-gates.md); 185 check + 39 guard tests, 4 backend suites and both JS exports pass | MB-1/member backend, QA-2, QA-9; real external/release proof remains open |

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


<!-- handoff:AR-1:73e3f63 -->
<details>
<summary>AR-1 integration handoff — 26 October 2026</summary>

# Handoff — AR-1 · Freeze the architecture and the versioned data contract        attempt 1 · `codex/ar1-contract-freeze` · verified candidate `12b8a20`

> **QA-2 note, 27 October 2026.** This handoff was written in `docs/plan/runs/AR-1/handoff.md`. Its
> relative links are re-based here so they resolve from `docs/`, and its in-page links to *Box 1*–*Box
> 4* and *Gates* now name this handoff's own sections in words, because earlier handoffs in this file
> use the same headings. Commands shown as `rtk proxy …` ran through the coordinator's local RTK
> wrapper; anywhere else, run them without that prefix (the repository's scripts need no RTK, as QA-1
> showed). Words run together in the *Integration disposition*, *Coordinator gate update* and
> *CURRENT* sections are re-spaced (QA-2 correction phase, 27 October 2026); their wording and facts
> are unchanged. No other text is changed.

## Integration disposition — 26 October 2026

**AR-1 Done.** Codex integrated 73e3f63 on local main after independent goal-verifier attempt 1 PASS,
all 4 boxes met, and all integration gates pass (frozen install, 185-test check, complete backend
bundle, Android + iOS JS exports). AUTH-01/ARCH-01 record delegated authority and approval. The status
tool marked AR-1 Done only after integration. No acceptance ledger row changed. Earlier not
Done/pending/unrun states below are historical, superseded by this disposition.

## Coordinator gate update — 26 October 2026

After the delegated architecture decision, the coordinator applied only the sole pending additive
private-formula migration to the standard local development stack (no reset or user-row changes).
The complete current `rtk proxy pnpm backend:test` command now passes in one run on 55321:
39 guard tests, source guard, all 4 integration/isolation suites, 8 persisted schemas and exact shared
fixture.
[Actual bundled output](evidence/AR-1/bundled-backend.log),
[scope and commands](evidence/AR-1/bundled-backend-gate.md).
This closes the earlier split-target/full-bundle limitation; previous statements are historical.

## CURRENT — 26 October 2026 (read this first)

This section supersedes the **State** row, the Box 1 row and the review-trail rows below, which are kept
as written and are historical.

- **Both independent reviews passed.** [Proposal review 4](evidence/AR-1/proposal-review4.json)
  passed revision 3, and its five low findings N-1 to N-5 are applied
  ([proposal-final-low-dispositions.md](plan/runs/AR-1/proposal-final-low-dispositions.md)). The
  [guard review](evidence/AR-1/guard-review.json) passed.
- **G-1 is approved by delegation.** Codex, acting as the owner's explicitly delegated decision-maker,
  approved 003 (revision 3 with N-1 to N-5) with no exceptions, in
  [tracker row ARCH-01](#decision-log). AUTH-01 records the owner's
  delegation in their own words. The owner did not personally review or sign 003. R-1 to R-7 are not
  decided by it.
- **Box 1.** Coverage was already met; the approval half is now in the tracker decision log. The
  GOALS.md wording of box 1 now names "the owner's or an explicitly delegated decision-maker's
  approval". Its technical checks are unchanged.
- **Boxes 2–4.** Evidence as below: 185 tests in `pnpm check`, 39 guard tests, a 15-migration replay
  with a strict empty diff, 8 persisted schemas matching, and the shared AC03 fixture passing.
- **Final verification PASS; integration pending.** The fresh goal-verifier passed all 4 boxes and
  independently re-ran frozen install, 185-test pnpm check and the full 8-step backend:test on 55321.
  [Verdict](evidence/AR-1/verdict-attempt-1.json). The bundled gate limitation is closed.
  No goal status or acceptance result has changed on this branch; integration/bookkeeping follows.

| Field | Value |
|---|---|
| **State** | *Historical; see CURRENT above.* **READY FOR REVIEW. Not approved, not verified, not merged, not Done.** Independent proposal review 4 and the independent guard review are running; neither verdict is available. The owner's G-1 approval is pending |
| Date | 26 October 2026 |
| Worktree | `/Users/Adya/.codex/worktrees/fitlog-ar1/fitness_app`, branch `codex/ar1-contract-freeze`, head `e23e9ae` at session start |
| Commits on the branch | `07757a5` contract snapshot (phase 2A) · `22c5386` CI fail-closed corrections P2A-1 to P2A-8 · `3040ccf` proposal revision 2 and durable review copies · `ac71e51` proposal revision 3 docs (R2-1 to R2-8) · `fcc9aed` shared AC03 fixture, TypeScript and SQL (phase 2B) · `e23e9ae` SQL-source guard and database runners (phase 2C) |
| How this file was written | A docs-only worker read the card, 003, the phase records and `docs/evidence/AR-1/`. It wrote only this file and [the owner pack](plan/owner-packs/AR-1.md). It ran no shell, git, database or Docker command. **Every result below is quoted from the linked record; none was re-run here.** Where a record does not give the exact command line, this file says so |
| Not changed | `GOALS.md`, `ACCEPTANCE.md`, `status.json`, the board, the tracker, 003 and every earlier run or evidence file |

**Outcome claimed.** Boxes 2, 3 and 4 have executed local evidence on the goal branch. Box 1's record is
complete through revision 3, but its owner approval is not in the tracker, so box 1 is **not met** and
AR-1 is **not complete**.

## Done when

| Box (verbatim) | Met | Evidence (detail in the sections below) |
|---|---|---|
| `docs/architecture/003-architecture-freeze.md` covers every PRD §21.1 component and §21.3 rule, and the owner's approval is in the tracker decision log | **No.** Coverage: yes. Approval: pending | 003 §3.1–§3.11 (the eleven §21.1 components) and §4.1–§4.16 with the rule table §4.15 (§21.3). Three revisions answer three independent reviews. Review 4 of revision 3 is running. The tracker decision log ends at PLAN-02 (2026-10-25) and holds no G-1 entry. See *Box 1* below |
| `packages/domain` exports a contract version, and a test fails when a schema changes without a version bump (seen to fail once) | Yes (local) | `packages/domain/src/contract.ts:8` `export const CONTRACT_VERSION = '0.1.0';`, re-exported at `src/index.ts:5`. M1.1 failed with `Contract schemas changed without a version bump…`. The database half passes, and its mutant snapshot M1.5 fails. See *Box 2* below |
| All migrations replay from empty to head, and a schema diff against the replay is empty (command and result in the handoff) | Yes (isolated local project) | 15 migrations and 2 seeds replayed. The diff over `public,private,storage` returned `No schema changes found` with `"diff":""`, lint was clean, and a structural drift probe was detected. See *Box 3* below |
| One shared fixture vector (AC03 volume and e1RM) runs in both the TypeScript tests and a SQL test, from one file | Yes (local) | `packages/domain/fixtures/ac03-training.v1.json`, SHA-256 `bc0672b5…1877`. TypeScript: `fixtures.test.ts` in `pnpm check`. SQL: `verify-fixtures.mjs`, run against the owned stack: `16 set vectors and 2 session vectors passed in SQL`. Mutants fail in both languages. See *Box 4* below |

## Box 1

- **Record.** [003](architecture/003-architecture-freeze.md), revision 3. Its header says
  "Proposal. Owner approval PENDING".
- **PRD §21.1.** §2 is the platform table. §3.1 to §3.11 cover mobile clients, the versioned API, the
  relational store (with the deletion graph and the external tombstone register), private object
  storage, the worker and jobs, the scheduler, identity, and the subscription, AI and messaging adapters,
  then monitoring.
- **PRD §21.3.** §4.1 to §4.16, with a rule-by-rule status in §4.15 and the domain map in §5. §21.2 and
  §22.1 are in §3.3 and §6, §21.4 is in §7, and the SP3 rule is in §8.
- **Review trail.**

  | Review | Verdict | Answered by |
  |---|---|---|
  | [phase1-review.json](evidence/AR-1/phase1-review.json) | F1–F17, T1–T4 | Revision 1, [phase1-dispositions.md](plan/runs/AR-1/phase1-dispositions.md) |
  | [checkpoint-review2.json](evidence/AR-1/checkpoint-review2.json) | PR-1 to PR-6 | Revision 2, [proposal-revision2.md](plan/runs/AR-1/proposal-revision2.md), `3040ccf` |
  | [proposal-review3.json](evidence/AR-1/proposal-review3.json) | REVISE: PR-1 to PR-6 resolved, no medium or higher defect, eight low findings R2-1 to R2-8 | Revision 3, [proposal-revision3.md](plan/runs/AR-1/proposal-revision3.md): all eight accepted, `ac71e51` |
  | Proposal review 4 (re-check of revision 3) | **Running, no verdict** | — |

- **The checkpoint-review2 copy.** The coordinator reports that the branch copy differs from `main`'s
  copy only in whitespace. The parsed data is equal, so there is no semantic conflict. This file did not
  re-diff them.
- **Approval.** The [tracker decision log](#decision-log) holds no AR-1 or
  G-1 row. The [owner pack](plan/owner-packs/AR-1.md) asks for it and drafts the row.

## Box 2

**Local half (phase 2A, [phase2A.md](plan/runs/AR-1/phase2A.md)).**
- Snapshot `packages/domain/contracts/0.1.0.json`, SHA-256
  `74914ca920f1f9c97957e74ea8b1bf5eea62dfbd26f7c5c80ba9cf91cdcc88e4`, recorded in `manifest.json`.
- `rtk proxy pnpm --filter @fitlog/domain test` (GREEN at the time): `ℹ tests 21`, `ℹ pass 21`.
- **Seen to fail (M1.1).** `src/models.ts:4` was changed from `max(100)` to `max(101)` with no bump. The
  run gave 20 pass and 1 fail: `✖ current schemas equal the snapshot for CONTRACT_VERSION` with
  `Contract schemas changed without a version bump: bump CONTRACT_VERSION and run pnpm --filter @fitlog/domain contract:snapshot (changed: …)`.
  After the restore, 21 of 21 passed.
- M1.2 (a snapshot byte edit), M1.3 (`0.1.1` with no snapshot) and M1.4 (a second `contract:snapshot`)
  each failed as designed (phase2A.md, mutation table).
- **Real Git history** ([coordinator-checkpoint-07757a5.md](evidence/AR-1/coordinator-checkpoint-07757a5.md)).
  In a shared clone at `07757a5`, a snapshot and its manifest hash were rewritten together. The domain
  test exited 1 with `differs from the baseline`, and the restore exited 0.
- **CI fails closed** (`22c5386`; [ci-correction-probes.json](evidence/AR-1/ci-correction-probes.json)).
  - The domain probes exit 1 for a missing, blank, all-zero or unresolvable baseline, and exit 0 for the
    trusted one.
  - The workflow-validation probes exit 1 for a missing, all-zero or malformed value, and exit 0 for the
    trusted one.
  - [p2a-review3.json](evidence/AR-1/p2a-review3.json) passed P2A-1 to P2A-8 by code reading,
    on condition that the domain test and typecheck exit 0. The coordinator's `pnpm check` met that
    condition: exit 0 with 179 tests then ([phase2A-coordinator-corrections.md](evidence/AR-1/phase2A-coordinator-corrections.md)),
    and 185 now.

**Database half (phase 2C runner).**
- [real-runners.log](evidence/AR-1/real-runners.log), line 1:
  `private.contracts matches the persisted section of contract 0.1.0 (packages/domain/contracts/0.1.0.json, sha256 74914ca9…88e4, as manifest.json records): 8 schemas (days, exercise, food, goal, instances, measurements, nutrients, set) in supabase_db_fitlog_ar1_replay_20261026 at http://127.0.0.1:56321`.
- **M1.5** ([real-runner-probes.json](evidence/AR-1/real-runner-probes.json), `M1.5-snapshot-bound`, exit 1).
  It reports the hash mismatch (`… has sha256 0663a558…, but packages/domain/contracts/manifest.json records 74914ca9… for 0.1.0`)
  and the value itself: `persisted.set differs at /properties/distanceMetres/anyOf/0/maximum: database 1000000, snapshot 1000001`.
- An earlier psql comparison on the replay database agrees:
  [persisted-compare.json](evidence/AR-1/persisted-compare.json), `"count": 8, "equal": true`.

**Limits.**
- No hosted CI run has shown the baseline guard passing or failing (PL-1).
- The snapshot history is not on `main` yet. Until the merge, the `main` fork-point baseline has nothing to
  compare (phase2A.md, limitation 1).
- JSON Schema cannot express `.refine()`. The inventory test pins every refine (limitation 4).
- The `.gitattributes` rule from limitation 3 is not added.
- p2a-review3 F1 is deferred to MB-6 (below).

## Box 3

Run by the coordinator from this worktree with Supabase CLI 2.121.0. Each command was prefixed
`rtk proxy` ([replay-verification.md](evidence/AR-1/replay-verification.md)):

```text
pnpm exec supabase --workdir /tmp/fitlog-ar1-replay-20261026 db start
pnpm exec supabase --workdir /tmp/fitlog-ar1-replay-20261026 db diff --local --schema public,private,storage --strict-coverage
pnpm exec supabase --workdir /tmp/fitlog-ar1-replay-20261026 db lint --local --schema public,private --level warning
```

| Step | Result (all exit 0) |
|---|---|
| Start ([replay-start.log](evidence/AR-1/replay-start.log)) | 15 `Applying migration …` lines, from `20261017161031_member_core.sql` to `20261025234317_training_formula_v1.sql`, then `Seeding data from supabase/seed.sql…` and `…development-catalogue.sql…`, then `{"status":"started","message":"Started local database."}`. `supabase_migrations.schema_migrations` returned 15 |
| Diff ([replay-final-diff.log](evidence/AR-1/replay-final-diff.log)) | `No schema changes found` and `{"diff":"","file":null,"files":[],"schemas":["public","private","storage"],"engine":"pg-delta","dropStatements":[],"message":"Diff complete."}` |
| Lint ([replay-lint.log](evidence/AR-1/replay-lint.log)) | `No schema errors found` and `{"results":[],"message":"db lint"}` |
| Drift probe ([replay-drift-probe.json](evidence/AR-1/replay-drift-probe.json)) | A scratch-only `29991231235959_ar1_drift_probe.sql` gave `"diff": "DROP TABLE \"public\".\"ar1_drift_probe\";\n"`, with `expectedDriftDetected: true` and `probeRemoved: true` |
| Inputs | [replayed-migrations.json](evidence/AR-1/replayed-migrations.json) (15 names and SHA-256 values). Image `public.ecr.aws/supabase/postgres@sha256:b15d862126dd2dac02da524696ccfde2dcce2ceaee0a58973b2727befe492706` ([postgres-image-digests.json](evidence/AR-1/postgres-image-digests.json)) |
| Source guard ([guard-coordinator-gates.md](evidence/AR-1/guard-coordinator-gates.md)) | `check-sql-sources.mjs` passes: 15 migrations, 14 unchanged against the `main` merge-base `9f148c13e093`, 1 new, 2 configured seeds, no stray SQL |

**Limits.**
- This is an isolated scratch project, `/tmp/fitlog-ar1-replay-20261026` (`project_id`
  `fitlog_ar1_replay_20261026`, ports 563xx). It is not the 55321 stack and not CI.
- The diff covers `public,private,storage`, and lint covers `public,private`. The drift probe diffed
  `public,private` only.
- PL-1 still has to run replay and diff in CI.
- No existing project was reset or stopped.

## Box 4

- **One file.** `packages/domain/fixtures/ac03-training.v1.json`, SHA-256
  `bc0672b5d26aa93b1e9be41219a0b20db1997913a37d6a9a0b2aac01ed1e1877`. It holds 16 set vectors, 2 session
  vectors (`ac03-session` and `ac03-session-with-deleted-set`) and 1 pending MB-4 session vector.
- **TypeScript.** `packages/domain/src/fixtures.test.ts` runs in `pnpm check`. It calls the real
  `setVolume`, `epley` and `sessionSummary`. AC03 gives session volume `"1920"` with 3 working sets, and
  e1RM `101.333333` for `ac03-working-80x8`. Every run prints `fixture sha256 bc0672b5…1877`
  ([phase2B.md](plan/runs/AR-1/phase2B.md); [ts-mutations.json](evidence/AR-1/ts-mutations.json), baseline).
- **SQL.**
  - `scripts/backend/sql/training-fixtures.sql` runs inside `begin … rollback` over the three private
    functions in `20261025234317_training_formula_v1.sql`. They are immutable and security invoker, with
    execute revoked from `public`, `anon` and `authenticated`.
  - `scripts/backend/verify-fixtures.mjs` passes the exact file bytes through `-v fixture=…`, sends the
    SQL on stdin, and fails unless the SQL hash notice equals the file's SHA-256.
  - The runner is chained into `backend:test` (`package.json:18`, read in this session).
- **Real run.** [real-runners.log](evidence/AR-1/real-runners.log), line 2:
  `training.v1 SQL check passed for packages/domain/fixtures/ac03-training.v1.json (sha256 bc0672b5…1877, received unchanged): training.v1: 16 set vectors and 2 session vectors passed in SQL; 1 pending MB-4 session vectors not asserted […in supabase_db_fitlog_ar1_replay_20261026 at http://127.0.0.1:56321]`.
- **Earlier SQL runs.**
  - The formula-only container ([fixture-sql-gates.md](evidence/AR-1/fixture-sql-gates.md)):
    RED exit 3 for the missing `private.training_set_eligible_v1`, then GREEN.
  - The full replay ([replay-fixture.log](evidence/AR-1/replay-fixture.log)): the same hash
    notice and GREEN line, then `ROLLBACK`.

**Limits.**
- SQL proves the set-level formulas. Its session values (1920 and 3) are a `sum()` and a `count()`
  composed in the check per PRD §8.2, not a production SQL aggregate (fixture-review R3).
- The no-eligible-session `null` is asserted by neither runner (MB-4, F-20).
- No session best e1RM exists.
- `verify-fixtures.mjs` has not run against 55321.

## Acceptance evidence

| Ledger row | Run | Result | Evidence | Row written here? |
|---|---|---|---|---|
| DEC-02 (proved by AR-1, OW-2, OW-3) | — | AR-1 is not the last prover | Box 1 above | No |
| PD-02 (proved by AR-1, PL-10, QA-12, G23) | Local, 26 Oct 2026 | Early-prover evidence only: versioned interfaces and the shared fixture | Boxes 2 and 4 | No |
| AC03 (owned by MB-4, SC-3, QA-3 and QA-4, per fixture-review) | Local, 26 Oct 2026 | Formula vectors only | Box 4 | No |

## Gates

| Gate | Command | Result | Source |
|---|---|---|---|
| Standard check | `rtk proxy pnpm check` | Exit 0. 185 tests: domain 37, mobile `Tests: 126 passed, 126 total`, plan 22. Server and client `tsc`, `eslint . --max-warnings=0`, design rules, and `plan.json and board.html match GOALS.md` | [fixture-sql-gates.md](evidence/AR-1/fixture-sql-gates.md) (coordinator); [phase2C.md](plan/runs/AR-1/phase2C.md) addendum, command 10, after the wiring |
| Backend unit tests (39 = 18 guard + 13 contracts + 8 fixtures) | `rtk proxy node --test scripts/backend/*.test.mjs` | `# tests 39`, `# pass 39`, `# fail 0` | phase2C.md addendum, command 9; the coordinator independently passed 39 of 39 ([guard-coordinator-gates.md](evidence/AR-1/guard-coordinator-gates.md)) |
| SQL-source guard | `check-sql-sources.mjs` (the record does not give the exact invocation) | Pass: 15 migrations, 14 unchanged, 1 new, 2 seeds, no stray SQL | guard-coordinator-gates.md |
| Original four backend suites, **previous cycle** | `pnpm backend:test` with the four-suite line, on 55321 | The four `… passed` lines | [baseline-backend.log](evidence/AR-1/baseline-backend.log). Its header shows the four-suite script, run in `/Users/Adya/personals/fitness_app`. The formula migration was not applied to 55321 |
| New database runners | Exported `main()` of `verify-contracts.mjs` and `verify-fixtures.mjs`, given only `{projectDir:'/tmp/fitlog-ar1-replay-20261026', expectedApiUrl:'http://127.0.0.1:56321'}` | Both pass | real-runners.log. The real `supabase status`, `docker exec` and psql ran. No status was faked, and no keys appear in the evidence |
| **Bundled `pnpm backend:test`** (the current eight-step line) | — | **NOT RUN. No bundled PASS is claimed** | 55321 has not received `20261025234317_training_formula_v1.sql`, so the run would stop at `verify-fixtures.mjs`. Applying it there was outside this cycle |
| Native JavaScript export | `expo export`, Android and iOS | PASS at `07757a5` | coordinator-checkpoint-07757a5.md. The coordinator states that later changes touch only Node-side tooling, tests, CI and docs. Not re-run at `e23e9ae` |

**The split, plainly.** The existing behaviour has regression evidence from the four suites on 55321
(previous cycle). The new SQL tools have evidence on the fully migrated owned stack (API 56321,
DB 56322). No single run of the current `backend:test` line exists.

## Inherited and used

| From | Claim | Held? |
|---|---|---|
| QA-1 (Done; local `main` `9f148c1`) | Foundation, 14 migrations, four backend suites | Yes. The suites passed again on 55321 (baseline-backend.log), and `check-sql-sources.mjs` finds the 14 migrations unchanged against the merge-base |
| Phase 2A acceptance ([phase2A-acceptance.md](evidence/AR-1/phase2A-acceptance.md)) | Code conditions left open: the review's domain test and typecheck condition, the AC03 fixture with real TypeScript and SQL runs, the persisted-contract comparison, and the replay and diff | **All fulfilled** (boxes 2–4 above). Still open: the proposal re-check (review 4), G-1, final all-box verification and integration |
| Fixture review ([fixture-review.json](evidence/AR-1/fixture-review.json), checkpoint-scope PASS) | R1 to R8 | **R1** recorded (fixture-sql-gates.md; phase2B addendum). **R2**: runner wired, with an exact-bytes hash. **R4**: TypeScript wrong-formula and null-to-zero mutants, run in a scratch copy with the source never mutated. **R5**: the AC03 IDs are required, and the missing-ID probes fail. R3 and R6 are worded in the records. R7 and R8 are deferred (below) |

## Mutation checks

| Guard | Break | Failure seen (record) |
|---|---|---|
| Contract version | M1.1–M1.4 | Above (phase2A.md) |
| Contract history | Snapshot and manifest rewritten together, in a real clone | `differs from the baseline` (coordinator-checkpoint-07757a5.md) |
| CI baseline | Missing, blank, all-zero, unresolvable and malformed values | Exit 1 each; trusted exit 0 (ci-correction-probes.json) |
| Persisted contracts | M1.5, a copied snapshot with one bound changed | The hash line, plus `persisted.set differs at /properties/distanceMetres/anyOf/0/maximum…` (real-runner-probes.json) |
| SQL-source guard and local target (G1–G4) | Hash compare off, CI detection off, fixture hash compare off, URL check loosened. Breaks were made in untracked files and reverted by exact replacement | Named tests failed, e.g. G2: `Missing expected exception: {"CI":"true"}` ([phase2C.md](plan/runs/AR-1/phase2C.md)). M2.1–M2.4 ran as scratch-repository tests 8, 2, 13 and 12/17, not as literal commands on this repository |
| TypeScript fixture | Formula `/30` → `/31`; `bodyweight-no-load-12` volume `null` → `"0"`; M4.3 | `ac03-working-80x8 e1rmKg: expected 101.333333, got 100.645161` and six more; `no-eligible-session: bodyweight-no-load-12 must contribute no volume`; restored 6 of 6 (ts-mutations.json; phase2B.md) |
| SQL fixture, formula container | Wrong expected value, null to zero, `/31`, missing variable, `PUBLIC` grant | Each failed; the restores passed (fixture-sql-gates.md; [fixture-sql-probes.json](evidence/AR-1/fixture-sql-probes.json)) |
| SQL fixture, real runner | M4.3, M4.4, missing AC03 set, missing AC03 session | `ac03-working-80x8 e1rmKg: expected 101.333334, got 101.333333`; `bodyweight-no-load-12 volumeKgReps: expected 0, got null`; `set vector ac03-working-80x8 is missing; …`; `session vector ac03-session is missing`. `originalFilesUntouched: true` (real-runner-probes.json) |
| Replay diff | Scratch drift migration | `DROP TABLE "public"."ar1_drift_probe";` (box 3) |

## Retired sources and the lane S2 notice

- **Five files retired** (003 §7, former G-9) by the coordinator:
  - `supabase/contracts.sql`, `supabase/contract-validation.sql`, `supabase/gym-read-models.sql` and
    `supabase/gym-freezes.sql`;
  - their unused generator, `scripts/backend/contracts.ts`.

  Glob in this session: `supabase/*.sql` matches only `development-catalogue.sql` and `seed.sql`, and
  `scripts/backend/` has no `contracts.ts`.
- **Comparison.**
  - `contracts.sql` was a byte-identical prefix of `20261017164336_validated_contracts.sql` (17,640 bytes).
  - Every other statement is compared in phase2C.md's table. No migration was edited.
- **Privileges on the replay database.** `private.freeze_projection` gives authenticated `false` and
  anon `false`. `private.freeze_action` gives authenticated `true` and anon `false`. These match the
  intended grants, so no privilege migration is needed (phase2C residual 7 closed).
- **Lane S2 notice.** The text is in [phase2C.md](plan/runs/AR-1/phase2C.md#notice-for-lane-s2--handoff-text-not-sent),
  recorded as handoff text for future lane executors. The sole coordinator acknowledged it as part of
  serialized ownership. No person or chat was messaged.

## Review findings left open, by owning goal

| Goal | Item | Source |
|---|---|---|
| MB-4 | Session volume `null` when no set is eligible (the pending vector `no-eligible-session`; F-20); a session best e1RM; a real SQL session aggregate with the completed-session filter; per-row function-call overhead (R8) | fixture-review; phase2B gaps 1–2 |
| MB-4 or owner | Whether a bodyweight set saved with load `0` should give volume `null` (PRD §8.2 open question) | phase2B gap 3 |
| MB-1 or MB-4 | Equal e1RMs can compare unequal when loads carry very different scales. MB-1 bounds `load_kg` scale, or MB-4 compares at a fixed scale (R6) | phase2B R6 correction |
| MB-1 | The 003 §12 PostgREST checks: status mapping, rejected-request counting with the 121st-request rule, `pg_locks` on replay, concurrency (R2-4); the contract header check; the envelope and error codes in a new contract version | proposal-review3; checkpoint §4 |
| MB-6 | Body-entry acceptance vectors for weight only and body fat only (F1, low) | p2a-review3; phase2A-acceptance |
| MB-7 and PL-5 (PL-2 for the store checks) | External tombstone register, fail-closed append, restore import and purge, quiet restore, cutover delta, object copies; actor rows for support and system principals (R2-1, R2-2, R2-3, R2-7) | proposal-review3 |
| G17.api | Trim gym and freeze outcomes to the §4.4 projection; keep `freeze_action`'s order until then; the `operation_result_v1` demotion test (R2-5) | proposal-review3 |
| PL-1 | `FITLOG_BASE_REF` from the CI event, on the same commit as `FITLOG_CONTRACT_BASELINE`; a backend CI job with replay and diff; a hosted run showing the baseline guard pass and fail | phase2C residual 6; checkpoint §4 |
| `packages/domain` owner (with PL-1) | The inline AC03 numbers in `calculations.test.ts:15-22` (R7); the `.gitattributes` rule `packages/domain/contracts/*.json -text` | fixture-review R7; phase2A limitation 3 |
| OW-2 | The dated DEC-15 entry for the confirmed fresh launch | checkpoint §4 |
| Review, no owner named | Guard additions beyond the plan (residual 8); the Node 22.23.1 versus 26.7.0 note (residual 9); the local-target guard cannot detect a remote Docker daemon, the same limit as the existing `verify*.mjs` (residual 10) | phase2C |

## Left undone, and why

- **G-1.** This is the owner's decision. The [owner pack](plan/owner-packs/AR-1.md) is ready for review.
- **Proposal review 4 and the guard review.** Both are running, with no verdict yet.
- **The bundled `pnpm backend:test`.** The reason is in this handoff's *Gates* section.
- **Hosted CI.** This is PL-1's.
- **Uncommitted files.** The session-start git status showed `docs/evidence/AR-1/persisted-compare.json`
  and `docs/evidence/AR-1/replay-fixture.log` untracked. Boxes 2–4 cite them. This handoff and the owner
  pack are uncommitted too: the worker ran no git command.

## Requests for other lanes' files

Carried from [checkpoint.md](plan/runs/AR-1/checkpoint.md) §4 and the table above:
- S2: the notice above.
- PL-1: replay and diff in CI, plus the trusted base.
- `packages/domain` owner: the merge, a hosted CI pass and fail, and `.gitattributes`.
- MB-1: the §12 checks.
- MB-7 and PL-5: the tombstone register.
- G17.api: the outcome trim.
- OW-2: DEC-15.

## Decisions forced (for the tracker decision log)

- **G-1.** Approve 003 as a whole, or with stated exceptions, as a dated entry. The owner pack drafts the
  row. Nothing else in AR-1 needs the owner. R-1 to R-7 (accounts, vendors, region, legal, prices, AI
  vendor, photo backups) stay owner-reserved and unchanged.
- **Engineering, recorded only.** No privilege migration is needed for `freeze_projection` or
  `freeze_action` (see above).

## Traps hit

- `rtk pnpm --filter … typecheck` is rewritten to a bare `tsc`. Use `rtk proxy` (phase2A, command 2).
- `-v fixture="$(cat …)"` drops the final newline, so the hash differs. The runner passes the exact bytes.
- `supabase start` on a running database-only project does not start the API. The local guard correctly
  refuses a project that reports no `API_URL`.
- Harness errors, none of them product faults:
  - the drift harness wrongly required an `--output` file;
  - the TypeScript mutation harness first linked a missing `node_modules`;
  - one CI probe first used a malformed SHA.
- The permission mode denied `rm` in phase 2C. The coordinator made the authorized deletion.

## Remaining steps

1. Receive the proposal review 4 and guard review verdicts. If either asks for changes, fix them and
   append an addendum here. Do not rewrite this record.
2. The coordinator commits the two untracked evidence files, this handoff and the owner pack.
3. The owner gives G-1: a dated row in the tracker decision log ([owner pack](plan/owner-packs/AR-1.md)).
4. The standard backend gate. Once 55321 has the formula migration (test-plan §3,
   `migration up --local`), run the bundled `pnpm backend:test` and append its result lines here. Until
   then, the split above is the evidence.
5. `verify-goal` on all four boxes. Then integrate to `main`, run
   `status.mjs set AR-1 done --ref <commit>`, and append this handoff to the tracker handoff log. None of
   this has happened.

</details>
