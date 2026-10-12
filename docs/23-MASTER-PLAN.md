# Master plan — FitLog rebuild

| Field | Value |
|---|---|
| Updated | 11 October 2026 |
| Product requirements | [PRD](PRD.md) |
| Design reference | [Momentum](22-UI-MOMENTUM.md) in Figma |
| Goal source | [plan/GOALS.md](plan/GOALS.md), 94 goals in 9 lanes |
| Live status | [plan/status.json](plan/status.json) |
| Baseline | [RESET-BASELINE.md](RESET-BASELINE.md) |

## What this plan governs

This is a fresh implementation. The prior application and its build/deployment infrastructure were
intentionally removed. The planner's historic goal IDs, waves and statuses are retained as useful
delivery structure, but no previous implementation, test, screen, service or deployment claim is
evidence for the new build. The PRD is the requirements source; a goal card defines the smallest
reviewable deliverable that moves it forward.

## Delivery sequence

| Milestone | Outcome |
|---|---|
| M0 — Ground truth | Confirm Momentum, reconcile the reset into the goal graph, choose launch assumptions and define a clean foundation. |
| M1 — Platform | Establish secure environments, account providers, monitoring, backups, CI and release paths. |
| M2 — Momentum foundations | Ship design tokens, typography, motion, component kit, navigation and string catalog. |
| M3 — Member app | Build the member training, food, progress, settings and management surfaces from the PRD. |
| M4 — Launch foundations | Add phone identity, Hindi/Hinglish food depth and Pro entitlement. |
| M5 — Store launch | Complete device, accessibility, beta, legal, listing and launch checks. |
| M6 — Gym pilot | Build owner/manager/front-desk and member-gym MVP in five India gyms; no trainer or private-health sharing. |
| M7 — Gym Phase 2 | Advance only if the pilot gate approves: owner Pro, calling, collections and web console. |
| M8 — Depth and polish | Address deferred member depth: recommendations, body map, offline reads, barcode, widgets and coverage. |
| M9 — Exercise media | Add licensed media last, after source selection and all dependencies. |

## Selected product scope

India is the first public launch; both complete languages, four auth methods and the member/gym
release split remain. G21 retains only owner/manager template offering and member-owned copies;
GT01–GT04/T-01–T-05 and private staff fitness access are retired. G24/G29 exclude diet/plan coaching,
PT/session packs, assessments and coaching floor views. New O-23/O-24/N-05/N-06 designs need actual
Figma reconciliation; this documentation does not edit the Figma file. Finance/freeze/offline/schedule/
streak/AI/pilot/strength/front-desk/storage rules are selected in PRD, with44 acceptance scenarios.
Keep94 goal IDs/statuses; scope changes do not mark implementation done.

## Operating rules

1. Read [RESET-BASELINE.md](RESET-BASELINE.md), the relevant PRD domain and the goal card before
   implementing. Do not infer a deleted codebase, API, database or infrastructure layout.
2. `docs/plan/GOALS.md` is the goal source; `docs/plan/status.json` is the only live goal state;
   `docs/09-PROJECT-TRACKER.md` records evidence and decisions.
3. Do not mark a goal done until its acceptance checks, tests and documented evidence exist in this
   new implementation.
4. A later-phase feature remains deferred even if its old goal card is detailed. P2/P3 gates in the
   PRD and goal dependencies apply.
5. All product and technical work follows the PRD's consent, privacy, tenant-isolation, offline,
   accessibility and performance requirements.

## First actions

- Product rules are selected in PRD v2.1/PROD-01–PROD-12; do not re-ask routine product questions.
- Owner: complete actual vendor/accounts/prices/licenses/qualified reviews and signed pilot evidence
  listed in PRD27; these approvals remain unfulfilled.
- Quality: revise QA-1 and QA-2 so they establish a new green foundation rather than audit deleted
  implementation.
- Design: translate Momentum foundations into implementation-ready tokens and components.
- Platform and backend: establish only the new foundation required by the PRD and currently unblocked
  goals; record interface decisions before dependent client work starts.

## Planning tools

```bash
node scripts/plan/status.mjs summary
node scripts/plan/status.mjs ready --lane S3
node scripts/plan/serve.mjs
```

The board runs locally at <http://127.0.0.1:4317>. See [plan/README.md](plan/README.md) for status
updates and [plan/SESSION-PROMPT.md](plan/SESSION-PROMPT.md) for a goal handoff.
