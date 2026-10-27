# Master plan — FitLog rebuild

| Field | Value |
|---|---|
| Updated | 27 October 2026 (QA-2: reconciled with `main` and the frozen architecture) |
| Product requirements | [PRD](PRD.md) |
| Architecture and contract | [003 — architecture freeze](architecture/003-architecture-freeze.md), approved by delegation (tracker ARCH-01) and integrated with AR-1 |
| Design reference | [Momentum](22-UI-MOMENTUM.md) in Figma |
| Goal source | [plan/GOALS.md](plan/GOALS.md): 114 goals in 10 lanes |
| Acceptance results | [plan/ACCEPTANCE.md](plan/ACCEPTANCE.md): 94 ledger rows |
| Live status | [plan/status.json](plan/status.json) |
| Evidence and decisions | [09 — Project tracker](09-PROJECT-TRACKER.md) |
| Baseline | [RESET-BASELINE.md](RESET-BASELINE.md) |

## 1. What this plan governs

This is a fresh implementation. The earlier application and its infrastructure were removed on
11 October 2026. No earlier implementation, test, screen, service or deployment counts as evidence
for this build.

The PRD is the only source of requirements. A goal card defines the smallest reviewable deliverable
that moves the PRD forward, together with the evidence that proves it. The acceptance ledger records
whether each release-blocking requirement has been proven.

Three documents decide whether something is done:

| Question | Answered by |
|---|---|
| What must the product do? | [PRD](PRD.md) |
| What must this piece of work deliver, and what proves it? | The goal's card in [GOALS.md](plan/GOALS.md): its **Done when** or **Exit checks** |
| Has each release-blocking requirement been proven? | [ACCEPTANCE.md](plan/ACCEPTANCE.md) |

## 2. Milestones and what each one declares

| Milestone | Gate | Declares | Ledger rows gated here |
|---|---|---|---|
| M0 Ground truth | MS-0 | Momentum recorded; external dependencies registered; architecture and contract frozen; the foundation on a green, protected `main` | — |
| M1 Production platform | MS-1 | Staging and production on the owner's accounts, with email, push, guarded AI, alerts, flags, runbook and a proven restore | NF-11, DEC-02, DEC-09 |
| M2 Momentum foundations | MS-2 | Tokens, type, motion, component kit, both shells and the strings catalog | DEC-12 (minimum OS) |
| M3 Member core | MS-3 | The member product working on an Android release build, every M3 scenario passing | DEC-13 (member) |
| M4 Launch foundations | MS-4 | +91 phone sign-in, complete Hindi, Indian food depth, real food AI, Pro | DEC-05 (phone), DEC-06, DEC-08 |
| M5 Store launch | MS-5 | **MVP-M released**: live in India on both stores, every member scenario passing on both platforms | every `M` scenario, member budgets, MS-5 decisions and deliverables |
| M6 Gym pilot | MS-6 | **MVP-G released**: five India gyms live, every gym scenario passing. With MS-5, **the expanded MVP is complete** | every `G` scenario except the pilot outcome, gym budgets, MS-6 decisions and deliverables |
| M7 Gym Phase 2 | MS-7 | Phase 2 shipped after a Scale decision, or held by a Fix or Stop decision | AC34, AC41, DEC-07 (memo), DEC-10, DEC-11, DEC-17 (gym) |
| M8 Depth and polish | MS-8 | Member P2 depth, health apps, offline reads and 80% coverage | DEC-16 (barcode, map), DEC-17 (member) |
| M9 Media and complete | MS-9 | **Project complete**: licensed media, maintenance handoff, no open ledger row | DEC-16 (media), PD-08 (final) |

Each milestone's **Exit checks** are in its `MS-*` card. `node scripts/plan/status.mjs gate MS-n` shows
what still blocks it.

## 3. Selected product scope

India is the first public launch, with complete English and Hindi, four sign-in methods, and members
released before gyms. There is no trainer role and no staff access to private health data. G21
retains only owner/manager template offers that become member-owned copies. GT01–GT04, T-01–T-05,
coaching copilots, PT packs, assessments and coaching floor views are retired. The finance, freeze,
offline, schedule, streak, AI, pilot, strength-goal, front-desk and storage rules are selected in
PRD v2.1, with 44 acceptance scenarios. Product decisions are PROD-01 to PROD-12 in the tracker; the
external gates are DEC-01 to DEC-17 in PRD §27 and in the ledger.

## 4. The 25 October reconciliation

*A dated record of the reconciliation as it was made on 25 October. Goal statuses since then are on
the board, not here.*

The 7 October plan was written as increments on an existing v1 app. After the reset many cards
pointed at deleted code, and no goal built the member backend that PRD §26.1 says must exist before
screens. The plan was reconciled without dropping any goal ID or status.

**Added goals (20).**

| Goal | Why it was needed |
|---|---|
| AR-1 | PRD §1 and §26.1 require a frozen architecture and versioned contract before dependent work |
| CT-1 | ≥200 exercises and three reviewed starter programmes (PROD-02, §21.4) had no owner |
| MB-1 to MB-7 | The member backend (identity, plans, logger and outbox, analytics, food, body and goals, account lifecycle) had no goal after the reset |
| QA-11 | Acceptance must run on release builds with fault injection (§23.2, §25); the old Maestro suite was deleted |
| G14.hi | MVP-M needs two complete languages; G14.app only built the spine |
| AI-3 | The food-AI pipeline and its screens (§10) had no goal; G15 covers only entitlements |
| PL-9 | §23.2 monitoring, flags and runbook, and AC32, had no owner |
| PL-10 | §23.3 product events and the launch funnel had no owner |
| QA-12 | No pre-launch security and privacy review was planned |
| G31 | Gym-bought seats are scoped in §24 without a goal |
| AP-10, AP-11, AP-12 | Health apps, substitution and nutrition depth are M8 scope in §24 and §26.1 |
| QA-13 | §26.2 requires a maintenance handoff |

**Re-scoped, same ID.**
- QA-1 now lands the untracked foundation on `main` (§6).
- SC-1 to SC-7, AP-1 and AP-2 build screens on the new backend; they no longer restyle deleted ones.
- QA-3 verifies the member core on Android release builds.
- PL-2 to PL-8 now name the current stack.
- OW-13 reviews the new content rather than v1's 238 texts.
- QA-8 closes the accessibility findings deferred at launch, not v1 finding #28.
- Apple Health moved from PL-8 to AP-10, because health apps are P2 (DEC-13).
- AI-2 moved from M6 to M4, because DEC-08 needs measured AI quality at M4.

**Dependency changes.**
- G16.api needs AR-1 and MB-1 instead of OW-10 and G13. The go memo gates activating gyms (G23),
  not building; phone sign-in gates linking (G18.api).
- G18.api and G20.api no longer wait on OW-11. They use a test provider; real sends wait for G23.
- G23 needs OW-10, OW-11 and MS-5, because PROD-02 releases members before gyms.
- G13 needs MB-1, OW-5 and PL-2. G14.data needs MB-5. G15.api needs AI-3. G21.api needs MB-2.
- QA-2 needs AR-1 instead of OW-2. OW-3 needs AR-1. PL-3 needs MB-1. PL-6 needs PL-2. OW-13 needs
  CT-1. QA-6 needs QA-12 and PL-10. QA-8 needs MS-5.
- The milestones gained the new goals: MS-0 gained AR-1, MS-1 PL-9, MS-4 G14.hi and AI-2, MS-7 G31,
  MS-8 AP-10 to AP-12, and MS-9 QA-13.

**Lanes.** S8 Member backend is new. S6 is now *Food, AI & Pro* and owns food end to end: MB-5, SC-4,
G14.data, AI-3, AP-7 and AP-12.

## 5. Lanes and file ownership

A lane is one parallel session. It edits its own files. A change another lane owns goes into the
handoff as a request, unless the goal card names that file.

| Lane | Owns |
|---|---|
| You | Accounts, money, legal, devices, decisions; `docs/evidence/OW-*` |
| S1 Platform | `.github/workflows/`, `supabase/config.toml`, environment and deploy scripts, `docs/operations/`, account lifecycle (MB-7), analytics events, offline reads, health apps |
| S2 Backend | Gym and phone-identity migrations and RPCs, `scripts/backend/verify-gym*.mjs` and `verify-freeze*.mjs` |
| S3 Design | `apps/mobile/src/theme/`, `src/ui/`, root and shell layouts, the logger screens (SC-1), auth screens, system states, store art |
| S4 Member app | `apps/mobile/src/lib/i18n/`, Train, Today and Progress feature screens, exercise content and seeds |
| S5 Gym app | `apps/mobile/src/features/gym/`, `src/app/gym/`, settings screens, motion |
| S6 Food, AI & Pro | Food migrations and screens, the AI gateway, entitlements and paywall |
| S7 Quality | The journey suite, `docs/evidence/` audits, coverage configuration, results in `docs/plan/ACCEPTANCE.md` |
| S8 Member backend | Member migrations and RPCs, `packages/domain/`, `apps/mobile/src/data/`, `scripts/backend/verify.mjs` |

Shared files are `package.json`, `pnpm-lock.yaml`, `packages/domain/src/index.ts` and the generated
`apps/mobile/src/data/database.types.ts`. Change them in the smallest possible diff, and say so in
the handoff. Regenerate generated files; never edit them by hand. Migrations are append-only and
timestamped. Never edit a migration that is already on `main`.

## 6. Branches and integration

- **`main` is the integration branch.** QA-1 brought the reset and the reviewed foundation from
  `v2/develop` onto local `main` (Done 25 October, `67e6d1c`). `v2/develop` is historical; branch
  from `main`.
- Every goal works on `plan/<id-lowercase>-<slug>`, branched from an up-to-date `main`.
- `goal-integrator` rebases, re-runs the standard gates and fast-forwards `main`. There are no merge
  commits and nothing is forced.
- Nothing is pushed, deployed or submitted unless the owner allows it
  (`var/orchestrator/config.json` `"push": true`, or a person doing it by hand).
- **Codex-coordinated lanes (practice recorded by QA-2, 27 October 2026).** The coordinator creates
  a lane's branch as `codex/<lane>` and records that name as the goal's ref in `status.json` (for
  example `codex/mb1-identity`). Keep that name; do not apply run-goal's `git branch -m` rename to it.
  AR-1's integration record states that local `main` was merged into the goal branch (`d624ece`) and
  that `main` then moved only by fast-forward, as "the coordinator's routine integration choice"
  ([integration gates](evidence/AR-1/integration-gates.md)). Both differ from the bullets above. This
  bullet records the practice; whether the written rules change to match it is a coordinator decision.

## 7. Evidence and gates

**The standard gates.** Run them from the repo root on the branch being checked:

```bash
pnpm install --frozen-lockfile
pnpm check                      # types, lint + design guard, domain, mobile and planner tests,
                                # and the plan build check (contracts and ledger coverage)
pnpm exec supabase start        # local stack only, never staging or production
pnpm backend:test               # backend unit tests, the SQL-source guard, the member, gym and freeze
                                # integration suites, the persisted-contract check and the shared
                                # AC03 fixture in SQL (package.json "backend:test")
pnpm --filter @fitlog/mobile exec expo export --platform ios --platform android --output-dir .expo/export-native
```

`pnpm backend:test` is required when a diff touches `supabase/`, `packages/domain/`,
`scripts/backend/` or `apps/mobile/src/data/`. The export is required when a diff touches
`apps/mobile/`. Once QA-11 is Done, its journey command is a gate for any goal whose card names a
scenario on a release build.

The database steps of `pnpm backend:test` target only this repository's local project
(`fitlog_rebuild_20261017`, API `http://127.0.0.1:55321`). Each one except
`verify-freeze-projection.mjs` first checks that `supabase status` reports that API URL and refuses
any other; `verify-freeze-projection.mjs` runs `psql` directly in that project's database container. With
`CI` set, the contract-history guard in `pnpm check` needs `FITLOG_CONTRACT_BASELINE`, and the
SQL-source guard in `pnpm backend:test` needs `FITLOG_BASE_REF`, each set to the trusted base commit;
neither falls back to `HEAD` or `main` (003 §8). Locally, without `CI` and with both unset, the
contract guard compares with `HEAD` and with the fork point from local `main`, and the SQL-source
guard compares with the merge base of local `main`. The contract guard skips a missing `main`; the
SQL-source guard fails without one, so `pnpm backend:test` needs a local `main` branch.

**Release build.** A release-variant build of one `main` commit: an Android release APK or AAB, or an
iOS Release build or TestFlight. A debug build, Expo Go or a web preview is never evidence for a
device, performance or acceptance box. Name a build by version, build number and commit.

**Reference devices and network.** These are the PRD §23.1 devices: a low-end Android (4 GB RAM,
Android 12 class, ₹8–10k), a current Android and an older supported iPhone. The test network is
1 Mbps down, 256 kbps up and 300 ms RTT. QA-11 records the exact models and OS versions in
`docs/evidence/devices.md`.

**Where evidence goes.**

| Evidence | Location |
|---|---|
| A goal's handoff: each Done-when box with its proof, gates, mutation checks, open findings | `docs/plan/runs/<ID>/handoff.md`, appended to the tracker on merge |
| Measurements, captures, review reports, timing records | `docs/evidence/<ID>/`. A measurement note states the method, device, build and sample size |
| Acceptance, budget, decision and deliverable results | [ACCEPTANCE.md](plan/ACCEPTANCE.md), written only by the row's last prover |
| Decisions forced by a goal | The tracker's decision log |
| Accessibility findings | `docs/evidence/a11y-audit.md`, one dated section per pass |

Evidence uses synthetic accounts only. Never commit personal data, secrets or licensed media. Link
large recordings rather than committing them.

A box is **met** only when a verifier can check it: a test they ran and saw pass, a command's
output, a file at the stated path whose content matches, or a measurement recorded where the box
says. The handoff's word alone is not evidence.

## 8. Declaring done

| Level | Declared when | By | Command | Recorded in |
|---|---|---|---|---|
| **Goal** | Every Done-when box has checkable evidence, `goal-verifier` passes, and the standard gates pass after rebasing onto `main` | `goal-integrator` (or a person after review) | `status.mjs set <ID> done --ref <commit>` | `status.json`, `activity.json`, the tracker's handoff log |
| **Milestone** | All its needs are Done, `status.mjs gate MS-n` shows nothing open, and `milestone-gatekeeper` passes every Exit check | `goal-integrator`, given the passing gate verdict | `status.mjs set MS-n done --ref "<verdict>"` | The tracker's milestone ledger |
| **MVP-M released** | MS-5 is Done | The owner | — | Tracker decision log |
| **Expanded MVP complete** | MS-5 and MS-6 are Done | The owner | — | Tracker decision log |
| **Project complete** | MS-9 is Done | The owner | — | Tracker decision log |

The tooling enforces the order. `status.mjs set <ID> done` refuses while a need is open. For a
milestone it also refuses while a ledger row gated there is not `pass` or `n/a`.

`--override "<reason>"` exists for documented exceptions only. The main one is declaring MS-7 after
an OW-12 Fix or Stop. The reason stays in the goal's note and in the activity feed, and the
milestone gatekeeper fails any override that is not documented.

The boxes in GOALS.md stay unticked. They are the contract, and the evidence lives in handoffs and
the ledger.

## 9. Standing rules

1. **The PRD wins.** Read the sections on the card's **PRD** line before changing anything. If a
   card contradicts the PRD, report it in the handoff; do not build the contradiction.
2. **Test first.** Write the test and see it fail. Mutation-check every guard: break it on purpose and
   see a named test fail.
3. **Quality only goes up.** Never lower a coverage threshold, skip or weaken a test, or add an
   unexplained `eslint-disable`. Thresholds rise when coverage rises (QA-9 ratchet).
4. **Tokens and strings.** Colours, fonts, radii and sizes come from the theme. Every user-facing
   string goes through `t()`, including on a screen you only touch. The lint guards enforce both.
5. **Contract first (SP3).** A backend goal merges its migrations, commands and contract before the
   screens that use them start. Regenerate `database.types.ts` from the migrations. The full change
   set (migrations, commands, contract version bump and snapshot, types, fixture vectors) is in
   [003 §8](architecture/003-architecture-freeze.md#8-contract-package-and-the-sp3-rule).
6. **Product invariants.** These hold in every goal:
   - The member owns their personal data (PRD §4.1).
   - Gym staff never read or write private health data (§16.1). There is no trainer role.
   - Identity comes from the authenticated session, never from the caller (§21.3).
   - Money is integer minor units, and finance is append-only: reversals and refunds are new
     records, never edits (§13).
   - A set the member sees as logged is already durable on the device (§20.2).
   - AI output is a proposal that counts only after the member confirms it (§10.2).
   - Unsaved drafts never change totals (PROD-12).
   - Accounts are adult only (§5.2).
   - Every gym record is tenant-isolated, with a test (§21.1, §25).
   - Clients hold no privileged key, and logs are redacted (§21.1, §23.2).
7. **Nothing outward-facing without the owner.** No push, deploy, store action, real message, real
   payment or paid provider call. The only exceptions are the steps an owner-approved PL, OW or
   release goal names. Never commit secrets, personal data or licensed media. The repo is public.
8. **Verify, don't assert.** Measurements on release builds beat claims. Record the method, device,
   build and sample size.
9. **Commits.** Use the house format with the goal ID: `feat(MB-3): durable set outbox`,
   `test(AC14): kill after local ack`.
10. **Status and results.** Change status only with `status.mjs` or the board. Write a ledger result
    only as that row's last prover. Never tick GOALS.md boxes.

## 10. Planning tools

```bash
node scripts/plan/status.mjs summary                 # milestones and lanes at a glance
node scripts/plan/status.mjs ready --lane S8         # what a lane can start now
node scripts/plan/status.mjs show MB-3               # needs, unblocks, Done-when boxes, ledger rows
node scripts/plan/status.mjs gate MS-3               # what still blocks declaring a milestone
node scripts/plan/status.mjs ledger --gate MS-5 --open
node scripts/plan/serve.mjs                          # the board at http://127.0.0.1:4317
```

Run a goal with `/run-goal <ID>` ([SESSION-PROMPT.md](plan/SESSION-PROMPT.md)). The autonomous loop
is described in [ORCHESTRATOR.md](plan/ORCHESTRATOR.md). Board details are in
[plan/README.md](plan/README.md).
