# FitLog — planning workspace

This branch was reset on 11 October 2026 for a fresh implementation of the expanded project.
The previous mobile app, API, shared packages, database configuration, deployment workflows,
and application scripts have been removed. The planner runs independently with Node.js.

Start with the [PRD](docs/PRD.md), [master plan](docs/23-MASTER-PLAN.md),
[goal cards](docs/plan/GOALS.md), [project tracker](docs/09-PROJECT-TRACKER.md), and
[reset baseline](docs/RESET-BASELINE.md).
The current screen reference is [Momentum](docs/22-UI-MOMENTUM.md), in
[Figma](https://www.figma.com/design/wukPwvkAsdpqByti0HNdDs).
The [documentation index](docs/README.md) identifies the active sources for agents and contributors.

## Planner

```bash
node scripts/plan/serve.mjs
# Open http://127.0.0.1:4317
```

No dependency installation is needed. Goal status and activity remain in `docs/plan/status.json`
and `docs/plan/activity.json`.

```bash
node scripts/plan/status.mjs summary
node scripts/plan/build.mjs --check
node --test scripts/plan/lib.test.mjs
```

See [planner instructions](docs/plan/README.md) for updating cards and rebuilding the board.
