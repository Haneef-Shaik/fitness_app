# Volt — Fitness & Nutrition Tracking Platform

| | |
|---|---|
| **Mobile** | React Native (Expo) — iOS + Android |
| **API** | Python 3.13 + FastAPI |
| **Database** | PostgreSQL 16 |

Specs live in [docs/](docs/). Start with [docs/README.md](docs/README.md).
The complete UI is in [docs/design/index.html](docs/design/index.html) — open it in a browser.

## Layout

```
contracts/      OpenAPI + shared test vectors (the cross-language contract)
packages/
  domain/       TypeScript domain rules — used by the mobile app offline
services/
  api/          FastAPI service; app/domain/ is the authoritative implementation
apps/
  mobile/       Expo app
```

## Why the domain logic exists twice

The logger must compute volume, estimated 1RM and personal-record candidates **locally**, because a
set commit never waits for the network. The server recomputes them authoritatively when a session is
finished. Two languages means two implementations — so both test suites run the **same JSON vectors**
in [`contracts/vectors/`](contracts/vectors/). If they ever disagree, CI fails rather than a user
watching their session summary change after it syncs.

## Develop

```bash
pnpm install            # TypeScript workspace
pnpm --filter @volt/domain test

cd services/api && uv sync && uv run pytest
```
