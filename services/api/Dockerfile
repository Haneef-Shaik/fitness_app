# syntax=docker/dockerfile:1.7
#
# One image, two processes (D25) — the API and the food-analysis worker:
#
#   docker run IMAGE                              # the API: uvicorn on $PORT
#   docker run IMAGE python -m app.worker         # the worker: same code, no HTTP
#   docker run IMAGE alembic upgrade head         # migrations (a release step)
#
# The two are the same build so they can never disagree about the schema or the
# job contract. Build from services/api:
#
#   docker build -t fitlog-api --build-arg GIT_SHA=$(git rev-parse HEAD) services/api
#
# docs/12-DEPLOYMENT.md is the runbook; every setting is an environment variable.

ARG PYTHON_VERSION=3.13

# ---------------------------------------------------------------- build stage
# uv resolves from the lock and nothing else: `--frozen` fails the build rather
# than quietly picking a newer version than CI tested.
FROM python:${PYTHON_VERSION}-slim-bookworm AS build
COPY --from=ghcr.io/astral-sh/uv:0.11 /uv /usr/local/bin/uv

ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_PYTHON_DOWNLOADS=never \
    UV_PROJECT_ENVIRONMENT=/app/.venv

WORKDIR /app
# Dependencies first, in their own layer: a code change rebuilds in seconds.
COPY pyproject.toml uv.lock ./
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-dev --no-install-project

# -------------------------------------------------------------- runtime stage
# Same base as the build stage, so the venv's interpreter path is the same one.
FROM python:${PYTHON_VERSION}-slim-bookworm AS runtime

# A fixed, unprivileged uid: the process can read the code and write only /tmp
# (the worker's heartbeat) and /app/var — the local object store's root, used
# when the image runs on a laptop. Staging and production refuse the local
# store (app/config.py), because a container's disk does not survive a deploy.
RUN groupadd --system --gid 10001 fitlog \
 && useradd --system --uid 10001 --gid fitlog --home-dir /app --shell /usr/sbin/nologin fitlog \
 && mkdir -p /app/var/uploads \
 && chown -R fitlog:fitlog /app/var

WORKDIR /app
COPY --from=build /app/.venv /app/.venv
COPY alembic.ini ./
COPY alembic ./alembic
COPY app ./app
COPY scripts ./scripts

# Which build this is — tags every crash report and is echoed by /health, which
# is how the deploy workflow confirms the new build is the one answering.
ARG GIT_SHA=dev
ENV APP_RELEASE=fitlog-api@${GIT_SHA} \
    PATH="/app/.venv/bin:${PATH}" \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8000 \
    ENVIRONMENT=production

USER fitlog
EXPOSE 8000

# Both processes: the API answers /health; the worker has no HTTP and is judged
# by its heartbeat file instead (app/healthcheck.py).
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD ["python", "-m", "app.healthcheck"]

# `exec` so uvicorn is PID 1 and receives the host's SIGTERM — a graceful stop
# finishes the requests in flight. One process per container; scale with
# replicas (/metrics counters are per process). WEB_CONCURRENCY is honoured.
#
# --no-proxy-headers, deliberately. uvicorn's proxy mode with a wildcard would
# replace the client address with the LEFTMOST X-Forwarded-For entry — the one
# the caller writes — and every per-address rate limit would count a forged
# address (found in the G11 security review). The client address is read by the
# app instead, from the entry the host's proxy appended: set TRUSTED_PROXY_COUNT
# to the number of proxies in front of the API (1 on Render/Railway/Fly).
CMD ["sh", "-c", "exec uvicorn app.main:app --host 0.0.0.0 --port \"${PORT}\" --no-proxy-headers --timeout-graceful-shutdown 20"]
