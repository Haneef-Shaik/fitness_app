# FitLog — Fitness & Nutrition Tracking Platform

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
pnpm --filter @fitlog/domain test

cd services/api && uv sync && uv run pytest
```

## Run

Two processes, and the separation is deliberate (D25):

```bash
cd services/api
uv run uvicorn app.main:app --reload     # the API
uv run python -m app.worker              # the food-analysis worker
```

The worker calls the AI provider; the API never does. A model call takes seconds and sometimes
takes the timeout, so doing it in a request handler would mean one slow plate photograph occupying
a worker a set-commit needs — and **I14**, *no AI failure touches training*, would stop being true
the first time the provider was slow.

**No key is needed.** `AI_PROVIDER` defaults to `stub`: a deterministic offline gateway that the
whole test suite runs against. Set `AI_PROVIDER=anthropic` and `AI_API_KEY` to use a real model.
See [`services/api/.env.example`](services/api/.env.example) — and never commit a key.

To check that the containment actually holds, rather than trusting that it does:

```bash
./scripts/verify-containment.sh
```

It starts both processes with the AI endpoint pointed at a closed port, then logs a whole workout
over HTTP and reads history, analytics and the nutrition diary. Everything works; the analysis
fails with `ai_unavailable` and nothing else notices.

### Hosted

The same two processes ship as **one Docker image** (`services/api/Dockerfile`): the default
command is the API, `python -m app.worker` is the worker. Postgres and photo storage are Supabase;
`scripts/migrate.sh` is the release step; `.github/workflows/deploy.yml` builds, migrates and
deploys staging, then production behind a reviewer. Every setting, and every click, is in the
runbook: **[docs/12-DEPLOYMENT.md](docs/12-DEPLOYMENT.md)**.

```bash
docker build -t fitlog-api services/api
docker run -p 8000:8000 -e DATABASE_URL=postgresql+asyncpg://fitlog:fitlog@host.docker.internal:5432/fitlog fitlog-api
```
