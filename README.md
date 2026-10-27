# FitLog

FitLog is being rebuilt from the 11 October 2026 reset. The Expo + TypeScript app in `apps/mobile/`
now connects to an isolated local Supabase backend. It includes member sign-in/onboarding, programme
editing and schedules, durable workout logging/history, manual food/body/goal entry, and the first
gym register/membership/freeze/payment/receipt flows. Shared Momentum tokens provide system/light/dark themes
and bundled English/Hindi typography. This is an incomplete development implementation, not a release.

## App

Use Node 22.13+ (`.node-version` pins the verified version) and pnpm 10.27.0.

```bash
pnpm install --frozen-lockfile
pnpm dev
# Or: pnpm android / pnpm ios / pnpm web
pnpm check
```

The app uses Expo SDK 57. Native execution requires a custom development build with SQLCipher,
plus an Android device/emulator or Xcode/iOS Simulator. Expo Go cannot supply encrypted workout
storage. Web is a development preview; browser validation does not establish native behavior.
The component gallery is available from Appearance in development builds.

## Local backend

Docker must be running. This rebuild uses project `fitlog_rebuild_20261017`, API port 55321 and
database port 55322, separate from any historical FitLog containers or data.

```bash
pnpm exec supabase start --exclude studio,postgres-meta,realtime,logflare,vector,supavisor,edge-runtime
pnpm backend:env
pnpm web
# Disposable local integration fixtures only:
pnpm backend:test
```

The environment script writes only the local URL and publishable key to the ignored mobile
`.env.local`. Never copy secret/service-role keys into client configuration. The 20-exercise development
catalogue is authored test content and still requires qualified review; it is not the licensed launch
catalogue. Local start/reset loads it from the configured seed files; no manual seed step is needed
before the backend tests. Production identity providers, legal notices, AI, store billing and release accounts remain
unconfigured. Physical devices also need an explicitly configured reachable development API URL.

For future visual changes, start with the [theming guide](docs/THEMING.md). Colors live in one
dark/light palette; typography, spacing and shapes live in shared tokens.
[Record 003](docs/architecture/003-architecture-freeze.md) is the frozen architecture and contract
(AR-1). The [foundation record 001](docs/architecture/001-mobile-foundation.md) and the
[connected implementation record 002](docs/architecture/002-connected-member-and-gym.md) are
historical checkpoints of 17 and 19 October 2026. CI is defined in `.github/workflows/mobile-ci.yml`;
no hosted run is recorded yet (PL-1). The [delivery checklist](docs/implementation/PROGRESS.md) is a
derived view of the plan board.

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

No dependency installation is needed for the planner. Goal status and activity remain in `docs/plan/status.json`
and `docs/plan/activity.json`.

```bash
node scripts/plan/status.mjs summary
node scripts/plan/build.mjs --check
node --test scripts/plan/lib.test.mjs
```

See [planner instructions](docs/plan/README.md) for updating cards and rebuilding the board.
