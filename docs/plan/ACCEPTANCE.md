# Acceptance ledger

The release evidence for FitLog. There is one row for each PRD acceptance scenario
([§25](../PRD.md#25-acceptance-scenarios)), nonfunctional budget
([§23.1](../PRD.md#231-nonfunctional-acceptance-budgets)), external decision
([§27](../PRD.md#27-assumptions-and-external-decisions)) and supplier deliverable
([§26.2](../PRD.md#262-supplier-deliverables)).

Each row names the goals that prove it and the milestone gate that may not be declared until the
row passes. Goal status is kept in [status.json](status.json); this file holds acceptance results
only.

## How the ledger is kept

- **Proved by** lists the goals whose Done-when boxes demonstrate the row. The goal named last runs
  the gate-level proof and is the **only** goal that writes the row's result. Earlier goals put their
  evidence in their own handoff and evidence folder.
- **Gate** is the milestone that waits on the row.
  - A member scenario (`M`) is gated at MS-5, the store launch.
  - A gym scenario (`G`) is gated at MS-6, the pilot. The two pilot-outcome scenarios are gated at
    MS-7.
  - A scenario the PRD tags `M/G` has one row for each part.
- **Result** is one of:
  - `open`
  - `pass · YYYY-MM-DD · <builds or environment> · <evidence path or run link>`
  - `fail · YYYY-MM-DD · <builds or environment> · <evidence>`
  - `n/a · <reason>`, only where the PRD allows it, for example DEC-15 with no legacy cutover, or
    Phase 2 rows after an OW-12 Fix or Stop.
- A scenario's pass names **release builds** of one `main` commit. Member rows at MS-5 and gym rows at
  MS-6 need Android **and** iOS release builds. A screenshot alone never proves persistence,
  isolation or a business rule (PRD §25).
- A result changes only on a goal branch, through `/run-goal` and `goal-verifier`. Nobody edits a
  result on `main` by hand.

`node scripts/plan/build.mjs --check`, which runs inside `pnpm check`, fails if a PRD scenario or
decision has no row, if a row names a goal that does not exist, if its gate does not wait on any of
its goals, or if a result is malformed. `node scripts/plan/status.mjs set MS-n done` refuses while a
row gated at MS-n is not `pass` or `n/a`. `node scripts/plan/status.mjs ledger --gate MS-5 --open`
lists what still stands between a gate and its declaration.

## Acceptance scenarios (PRD §25)

| ID | Release | Requirement | Proved by | Gate | Result |
|---|---|---|---|---|---|
| AC01 | M | Chest day planned, logged, finished and reloaded; every set persists on its start-local date | MB-2, MB-3, SC-1, SC-2, QA-3, QA-4 | MS-5 | open |
| AC02 | M | Previous occurrence found without knowing the date; draft excluded; repeat shows per-set source | MB-4, SC-2, QA-3, QA-4 | MS-5 | open |
| AC03 | M | Volume 1,920 kg·reps, e1RM 101.333…, frequency one, adherence, same after reload | MB-4, SC-3, QA-3, QA-4 | MS-5 | open |
| AC04 | M | Manual meal plus text/photo AI; proposals never count; corrected confirmation counts once | MB-5, SC-4, AI-3, QA-4 | MS-5 | open |
| AC05 | M | Today agrees with sources; edits recalculate; export, deletion and recovery deadlines met | MB-6, MB-7, SC-3, SC-6, QA-3, QA-4 | MS-5 | open |
| AC06 | G | 150+ rows imported and configured in ≤90 minutes; only selected rows saved | G17.api, G17.app, G23 | MS-6 | open |
| AC07 | G | Invited adult verifies phone and reaches the right gym card; minor and wrong phone refused | G13, G18.api, G18.app, G23 | MS-6 | open |
| AC08 | G | QR check-in online and offline, durable p95 <3 s, one counting visit | G19.api, G19.app, G23 | MS-6 | open |
| AC09 | G | Foreign tenant 404; all staff private-health reads and writes denied; trainer role invalid | G16.api, G21.api, G23 | MS-6 | open |
| AC10 | G | One renewal dispatch per due key in gym hours; invalidated reminders suppressed; no marketing | G18.api, G20.api, G23 | MS-6 | open |
| AC11 | G | Coverage reasons explicit; erroneous ₹400 receipt reversed restores ₹1,000 due | G17.api, G20.api, G20.app, G23 | MS-6 | open |
| AC12 | M | Free user AI route gets PRO_REQUIRED with zero model calls; expiry keeps data and confirmation | G15.api, G15.app, QA-4 | MS-5 | open |
| AC13 | G | Every owner, manager, front-desk and member-gym flow complete in Hindi on low-end Android | G14.hi, G16.app, G17.app, G18.app, G19.app, G23 | MS-6 | open |
| AC14 | M | Double tap, lost response and kill after feedback leave exactly one durable set | MB-3, SC-1, QA-11, QA-3, QA-4 | MS-5 | open |
| AC15 | M | Edits after use leave historical prescriptions, muscles, loads and nutrition unchanged | MB-2, MB-5, SC-2, SC-4, QA-3, QA-4 | MS-5 | open |
| AC16 | M | Timezone and unit changes keep canonical values and historic local dates | MB-1, SC-5, QA-3, QA-4 | MS-5 | open |
| AC17 | M | Deleting the strongest set and editing a past session recompute without moving timestamps | MB-4, AP-2, QA-3, QA-4 | MS-5 | open |
| AC18 | M | Null-macro quick add and unlogged days are unknown, not zero; over-target allowed | MB-5, SC-4, QA-3, QA-4 | MS-5 | open |
| AC19 | M | Latest daily weight, measured-day means, 80→75 goal at 78 is 40%, no interpolation | MB-6, SC-3, QA-3, QA-4 | MS-5 | open |
| AC20 | G | 50 parallel payments give a unique gap-free receipt sequence; replays return the same receipt | G17.api, G23 | MS-6 | open |
| AC21 | G | Front desk denied reversal/export; role change immediate; revoked queued payment Needs attention | G16.api, G17.api, G17.app, G23 | MS-6 | open |
| AC22 | G | Calendar and fixed plans, freeze overlap, early unfreeze and renewal during freeze dated exactly | G17.api, G17.app, G23 | MS-6 | open |
| AC23 | G | Invite replay, expiry, wrong phone, duplicate identity and already-linked claims handled safely | G13, G18.api, G23 | MS-6 | open |
| AC24 | G | Tampered poster rejected; denied location saved unverified; imports deduped; off-clock held | G19.api, G23 | MS-6 | open |
| AC25 | G | Only eligible adult opt-ins rank under the tie rule; no phone or health fields exposed | G22.api, G22.app, G23 | MS-6 | open |
| AC26 | G | Template v1 offer stays v1 after v2; one owned copy; gym sees status only | G21.api, G21.app, G23 | MS-6 | open |
| AC27 | M | Purchase, restore, webhook replay and refund keep entitlement equal to verified store state | G15.api, G15.app, QA-4 | MS-5 | open |
| AC28 | M | Malformed AI output, timeout, cap, offline input and double confirmation handled safely | AI-3, G15.api, QA-4 | MS-5 | open |
| AC29 | M | Two devices offline and user switch with queued work: explicit conflicts, queue never crosses accounts | MB-3, QA-11, QA-3, QA-4 | MS-5 | open |
| AC29 | G | Gym queues never cross tenants; conflicts explicit | G17.app, G19.app, G23 | MS-6 | open |
| AC30 | M | Personal export ≤24 h, erasure lifecycle, restore without resurrection | MB-7, PL-5, SC-6, QA-3, QA-4 | MS-5 | open |
| AC30 | G | Gym export and member erasure; ledger kept only by policy | G17.api, G23 | MS-6 | open |
| AC31 | M | Denied permissions, push off, large text, Reduce Motion and screen reader keep member flows usable | SC-6, SC-7, QA-3, QA-4 | MS-5 | open |
| AC31 | G | The same for gym flows | G17.app, G19.app, G23 | MS-6 | open |
| AC32 | M | Outage and worker crash: local logging works, safe replay, accurate degraded state, alerts | MB-3, PL-9, QA-3, QA-4 | MS-5 | open |
| AC32 | G | The same for gym operations | G17.api, G19.api, G23 | MS-6 | open |
| AC33 | G | Offboarded gym read-only, sends stopped, export available; members' histories continue | G17.api, G23 | MS-6 | open |
| AC34 | G | Ten-week, five-gym pilot memo with stable denominators, costs and incidents | G23, OW-12 | MS-7 | open |
| AC35 | G | Every §13.3 finance fixture exact, including concurrent refund+reversal (409) | G17.api, G23 | MS-6 | open |
| AC36 | G | Sold allowance, cross-expiry freeze, declined shift, early unfreeze, DST and month-end exact | G17.api, G20.api, G23 | MS-6 | open |
| AC37 | G | Cached roster freshness, revoked role, backdated member and authorized reconciliation | G17.app, G19.api, G19.app, G23 | MS-6 | open |
| AC38 | M | Missed Monday vs Tuesday vs unscheduled; no double completion; delete resets the occurrence | MB-2, SC-2, QA-3, QA-4 | MS-5 | open |
| AC39 | G | Private streak independent of challenges; history stable; rejoin counts new visits only | G19.api, G22.api, G23 | MS-6 | open |
| AC40 | M | Cancel, withdrawal and expiry races reserve, consume or release once in the original bucket | G15.api, QA-4 | MS-5 | open |
| AC41 | G | Frozen protocol, per-gym rates, ≥20 samples, ≥5-point gains in ≥3 gyms, precision 4/6 | G20.api, G23, OW-12 | MS-7 | open |
| AC42 | M | Strength goal: no pre-baseline progress, correct load basis, missing baseline explicit | MB-6, SC-3, QA-3, QA-4 | MS-5 | open |
| AC43 | G | Front desk prepares a renewal; only owner or manager issues it; received money kept | G17.api, G17.app, G23 | MS-6 | open |
| AC44 | M | 1 GiB / 2,000-image limits reserved atomically; Pro expiry loses nothing | MB-6, G15.api, G15.app, QA-4 | MS-5 | open |

## Nonfunctional budgets (PRD §23.1)

| ID | Release | Requirement | Proved by | Gate | Result |
|---|---|---|---|---|---|
| NF-01 | M | Set commit p95 <100 ms tap→durable, release build, ≥200 commits in ≥20 sessions | MB-3, SC-1, QA-3, QA-4 | MS-5 | open |
| NF-02 | G | Owner list p95 <300 ms, 1,000-member tenant, ≥500 requests, ≤20 concurrent | G17.api, G23 | MS-6 | open |
| NF-03 | G | Self check-in p95 <3 s scan→durable on the reference device and 3G profile | G19.app, G23 | MS-6 | open |
| NF-04 | G | Gym cold start p95 <3.5 s to a cached actionable gym card, ≥30 cold starts | G19.app, G23 | MS-6 | open |
| NF-05 | M | Common API p95 <300 ms excluding file transfer and AI, on staging-like data | PL-9, QA-4 | MS-5 | open |
| NF-06 | M | API core availability SLO 99.5% monthly; local logging continues in an outage | PL-9, QA-7 | MS-5 | open |
| NF-07 | M | Zero acknowledged local-set loss in the fault suite; production lost sessions <0.1% | MB-3, QA-11, QA-7 | MS-5 | open |
| NF-08 | M | Crash-free sessions ≥99.5% during beta, with the sample count | QA-6 | MS-5 | open |
| NF-09 | M | AI status accepted <1 s server time; ready p95 <60 s; terminal within five minutes | AI-3, QA-4 | MS-5 | open |
| NF-10 | M | Android download ≤60 MB, excluding optional exercise media | QA-3, QA-4 | MS-5 | open |
| NF-11 | M | Database RPO ≤15 min and RTO ≤4 h, proven by a restore; object policy recorded | PL-5 | MS-1 | open |
| NF-12 | M | WCAG 2.2 AA principles, ≥48 dp targets, logger 56/96 dp, screen readers, 200% text | DS-4, QA-3, QA-4 | MS-5 | open |

## External decisions (PRD §27)

| ID | Release | Requirement | Proved by | Gate | Result |
|---|---|---|---|---|---|
| DEC-01 | — | Final name, trademark and brand assets cleared | OW-1, DS-6 | MS-5 | open |
| DEC-02 | — | Architecture, provider accounts, India region and contracts frozen | AR-1, OW-2, OW-3 | MS-1 | open |
| DEC-03 | — | Statutory receipt and tax setup reviewed; taxes off until approved | OW-6, G23 | MS-6 | open |
| DEC-04 | — | Member terms, privacy and notices reviewed (adult only, private personal data) | OW-6 | MS-5 | open |
| DEC-04 | — | Gym DPA, utility basis, financial retention and notices reviewed | OW-9, G23 | MS-6 | open |
| DEC-05 | — | Phone registrations and +91 OTP delivery live | OW-5, G13 | MS-4 | open |
| DEC-05 | — | Utility message templates, credentials and real-send budgets approved | OW-11, G23 | MS-6 | open |
| DEC-06 | — | Localized Pro price, SKUs and store billing accounts | OW-7, G15.app | MS-4 | open |
| DEC-07 | — | City, five signed gyms, baseline and sample records | OW-9, OW-10 | MS-6 | open |
| DEC-07 | — | Ten-week scale memo | OW-12 | MS-7 | open |
| DEC-08 | — | AI model, vendor and DPA, measured quality and monetary spend caps | AI-1, AI-2 | MS-4 | open |
| DEC-09 | — | Backup, PITR and object recovery provisioned; restore drill verified | PL-5 | MS-1 | open |
| DEC-10 | — | Payment provider, submerchant and autopay contract with reconciliation proof (P2) | G27 | MS-7 | open |
| DEC-11 | — | Calling vendor, counsel, disclosure, recording and consent approvals (P2) | G26 | MS-7 | open |
| DEC-12 | — | Minimum OS and native dependency versions recorded | DS-5 | MS-2 | open |
| DEC-12 | — | Reference-device performance and accessibility evidence | QA-3, QA-4 | MS-5 | open |
| DEC-13 | — | Member scope holds: supersets MVP, health and imports P2, no trainer or coaching | OW-1, QA-3 | MS-3 | open |
| DEC-13 | — | Gym scope holds: Join state, no trainer, private sharing or PT | G23 | MS-6 | open |
| DEC-14 | — | Estimate formula suitability reviewed before estimates are enabled | SC-5, OW-6 | MS-5 | open |
| DEC-15 | — | Legacy-user migration approved and verified, only if existing users are redirected | OW-2 | MS-5 | n/a · no legacy-user cutover; owner confirmed fresh launch with no existing users or data redirected on 2026-10-25 (tracker MIG-01) |
| DEC-16 | — | Font and seed-content rights before the stores | DS-2, CT-1, G14.data, QA-5 | MS-5 | open |
| DEC-16 | — | Barcode database and body-map licences | AP-4, AP-7 | MS-8 | open |
| DEC-16 | — | Exercise media licence | OW-14, AP-9 | MS-9 | open |
| DEC-17 | — | Gym P2 numeric fixtures and implementation verified | G29.app, G24 | MS-7 | open |
| DEC-17 | — | Member P2 numeric fixtures and implementation verified | AP-5, AP-3 | MS-8 | open |

## Supplier deliverables (PRD §26.2)

| ID | Release | Requirement | Proved by | Gate | Result |
|---|---|---|---|---|---|
| PD-01 | — | Source, dependency and licence inventory; reproducible startup, builds, migrations, seeds and env examples | QA-1, PL-2, QA-12, QA-5 | MS-5 | open |
| PD-02 | — | Versioned interfaces, database dictionary, constraints and retention matrix, fixtures, event catalog, permission and consent test inventory | AR-1, PL-10, QA-12, G23 | MS-6 | open |
| PD-03 | — | Screen and state inventory matched to Momentum with live data, both languages and themes, deep links, permission and offline states | QA-3, QA-4, G23 | MS-6 | open |
| PD-04 | — | Automated unit, integration and journey results and device recordings linked to each scenario | QA-11, QA-4, G23 | MS-6 | open |
| PD-05 | — | Deployable staging and production, workers, backup and restore, runbooks, alerts, flags, support, export and erasure tools | PL-4, PL-5, PL-9, MB-7, QA-7 | MS-5 | open |
| PD-06 | — | Store-ready artifacts, signing custody, reviewer credentials, listings and privacy disclosures, subscription test evidence | PL-7, PL-8, G15.app, QA-5 | MS-5 | open |
| PD-07 | — | Gym import, message and pilot onboarding materials, approved notices, user help and staff guide | OW-6, G23 | MS-6 | open |
| PD-08 | — | Known limitations, deferred items and outstanding decisions at MVP | G23 | MS-6 | open |
| PD-08 | — | Final maintenance handoff | QA-13 | MS-9 | open |
