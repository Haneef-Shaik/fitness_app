# FitLog — plans and specifications

`main` holds the plans, the reviewed foundation with connected local member and gym paths (QA-1),
and the frozen architecture and contract 0.1.0 (AR-1). It is an incomplete development
implementation, not a release. Read the [reset baseline](RESET-BASELINE.md) before using historical
implementation evidence.

| Purpose | Document |
|---|---|
| Complete product requirements and feature inventory | [PRD](PRD.md) |
| Frozen architecture, `/v1` contract rules and the SP3 rule (AR-1) | [003 — Architecture freeze](architecture/003-architecture-freeze.md) |
| Historical: the 17 October mobile foundation | [001 — Mobile foundation](architecture/001-mobile-foundation.md) |
| Historical: the 19 October connected member/gym checkpoint and its gaps | [002 — Member/gym implementation record](architecture/002-connected-member-and-gym.md) |
| Delivery checklist, a derived view of the plan board | [Implementation progress](implementation/PROGRESS.md) |
| Changing colors, typography, spacing and shapes | [Theming guide](THEMING.md) |
| Expanded project plan | [23 — Master plan](23-MASTER-PLAN.md) |
| Goal cards, dependencies and each goal's definition of done | [plan/GOALS.md](plan/GOALS.md) |
| Acceptance ledger: every PRD scenario, budget, decision and deliverable, with its goals and gate | [plan/ACCEPTANCE.md](plan/ACCEPTANCE.md) |
| Local planner and live status | [plan/README.md](plan/README.md) |
| Decisions, goal handoffs and milestone declarations (the board owns status; ACCEPTANCE.md owns results) | [09 — Project tracker](09-PROJECT-TRACKER.md) |
| Momentum reference and current-vs-historical Figma scope delta | [22 — Momentum](22-UI-MOMENTUM.md) |
| Owner decisions and questions | [plan/INBOX.md](plan/INBOX.md) |
| Goal execution instructions | [plan/SESSION-PROMPT.md](plan/SESSION-PROMPT.md) |
| Plan orchestration | [plan/ORCHESTRATOR.md](plan/ORCHESTRATOR.md) |

## Document rules

[PRD](PRD.md) is the only requirements and feature source. Momentum is the only UI direction.
The master plan and goal board sequence delivery; they do not override a requirement. The tracker
keeps evidence and decisions for the new implementation. Historical documents that described the
removed application, older UI directions or superseded plans have been removed. Where a current
document keeps a historical section, that section says so; it is context, not an instruction.

## 11 October product decisions

PRD v2.1 selects India public launch and removes the trainer role/private staff health access.
G21 retains owner/manager programme offers; GT01–GT04/T-family and coaching/PT depth are retired.
Product choices are resolved; PRD27 lists genuine external gates. Goal/status IDs remain unchanged.
