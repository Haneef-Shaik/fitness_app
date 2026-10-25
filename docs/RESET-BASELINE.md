# Fresh implementation baseline — 11 October 2026

At the owner's request, `v2/develop` now contains the planning workspace and supporting
specifications. The previous implementation has been removed to avoid mixing it with the
new Figma screens and expanded project scope.

Retained: the master plan, 94 goal cards, planner board and tooling, goal statuses and activity,
owner inbox and decision packs, orchestrator instructions, project tracker, Momentum Figma
specification, the consolidated PRD, and project agent tooling.

Removed: `apps/`, `services/`, `packages/`, `contracts/`, `infra/`, `supabase/`, application
CI/deployment workflows, application dependencies and lockfile, old runtime and device scripts,
and legacy screenshot, preview, store screenshot, G0–G10 prompt folders, old requirement,
architecture, design-direction, research, wireframe and evidence documents.

## How to read the retained plan

The 7 October master plan was an incremental plan over an existing v1 implementation.
Its audits, existing-code paths, test counts, CI references, and the tracker's earlier evidence
are historical. They do not describe executable code on this branch after this reset.
The retained goals and specifications describe intended behavior; absent foundation work must
be accounted for before using the original dependency graph to schedule implementation.
The 94 existing cards and their statuses have been preserved, without marking any build work done.

**Reconciled 25 October 2026:** the goal graph now accounts for this baseline. See
[docs/23 §4](23-MASTER-PLAN.md#4-the-25-october-reconciliation) and the
[acceptance ledger](plan/ACCEPTANCE.md). The paragraph below records the original instruction.

Before implementation, reconcile QA-1 and the affected goal entry gates with this empty baseline,
including auth/profile, data contracts, offline storage, training, nutrition, body metrics,
analytics, tests, and deployment foundations. The current task removes the old implementation;
it does not silently replace the owner's expanded plan with a new one.

The current UI reference is [Momentum](22-UI-MOMENTUM.md) and its linked Figma file. The
[PRD](PRD.md) is the only requirements source. All old run commands referencing deleted application
directories are historical and have been removed from the active documentation.

Git history retains the committed implementation. A separate local snapshot of the working tree,
including the uncommitted Expo Go fix, was saved before removal at
`/private/tmp/fitlog-before-reset-20261011-195638/workspace.tar.gz`, alongside a patch and manifest.
Local Supabase database volumes were not deleted by this workspace cleanup.
