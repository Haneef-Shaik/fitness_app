from __future__ import annotations

import time
import uuid

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse

from app.api.deps import DbSession
from app.api.envelope import fail
from app.api.routes import (
    account,
    admin,
    analytics,
    auth,
    body,
    dashboard,
    exercises,
    food_analysis,
    goals,
    history,
    meal_categories,
    nutrition,
    nutrition_analytics,
    nutrition_copy,
    profile,
    programs,
    recipes,
    sessions,
    uploads,
)
from app.core.errors import AppError
from app.observability import queue as queue_metrics
from app.observability.metrics import registry

app = FastAPI(
    title="Volt API",
    version="0.1.0",
    description="Fitness & Nutrition Tracking Platform. See docs/02-SYSTEM-ARCHITECTURE.md.",
    openapi_url="/v1/openapi.json",
    docs_url="/v1/docs",
)


# The Expo web dev surface is a different origin from the API. Native builds are not
# subject to CORS, so this exists for development and any future web client only.
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+):\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["x-request-id"],
)


@app.middleware("http")
async def request_id_middleware(request: Request, call_next):
    """Every response carries a request id; every error surfaces it so a user can
    quote it to support (docs/06 §10).

    It also records RED (02 §9). The route label is the **template**, not the
    path: a label carrying an id gives one time series per row, which is how a
    metrics backend falls over and how a p95 stops meaning anything.
    """
    rid = request.headers.get("x-request-id") or f"req_{uuid.uuid4().hex[:12]}"
    request.state.request_id = rid

    started = time.perf_counter()
    response = await call_next(request)
    elapsed = time.perf_counter() - started

    if request.url.path != "/metrics":
        template = _route_template(request)
        registry.record_http(request.method, template, response.status_code, elapsed)

        # The core loop, counted here rather than in the handler: a body
        # Pydantic refuses never reaches the handler, and a set the user tried
        # to log and did not is a set-commit failure whatever refused it.
        if request.method == "POST" and template in SET_COMMIT_ROUTES:
            registry.record_set_commit(
                "ok" if response.status_code < 400 else "failed"
            )

    response.headers["x-request-id"] = rid
    return response


#: The routes that ARE the core loop (02 §9). Batch is included because the
#: outbox drains through it, and a drain that fails is sets that did not land.
SET_COMMIT_ROUTES = frozenset({
    "/v1/session-exercises/{se_id}/sets",
    "/v1/workout-sessions/{session_id}/sets/batch",
})


def _route_template(request: Request) -> str:
    """`/v1/goals/{goal_id}`, never `/v1/goals/8f2a…`.

    Built by substituting the matched path params back into the real path,
    rather than reading `scope["route"].path` — which is router-relative here
    and so loses the `/v1` prefix. Substituting every param is also what makes
    it impossible for an id to leak into a label, whatever the routing does.
    """
    template = request.url.path
    for name, value in (request.scope.get("path_params") or {}).items():
        template = template.replace(str(value), "{" + name + "}")
    return template


def _rid(request: Request) -> str:
    return getattr(request.state, "request_id", "req_unknown")


@app.exception_handler(AppError)
async def app_error_handler(request: Request, exc: AppError):
    return fail(
        exc.code, exc.message,
        status_code=exc.status_code, request_id=_rid(request), fields=exc.fields,
    )


@app.exception_handler(RequestValidationError)
async def validation_handler(request: Request, exc: RequestValidationError):
    fields: dict[str, str] = {}
    for err in exc.errors():
        loc = [str(p) for p in err["loc"] if p not in ("body", "query", "path")]
        # A validator's own sentence, not Pydantic's "Value error, " wrapper:
        # these reach the person filling in the form.
        msg = err["msg"]
        fields[".".join(loc) or "body"] = msg.removeprefix("Value error, ")
    return fail(
        "VALIDATION_FAILED", "Some details need fixing.",
        status_code=422, request_id=_rid(request), fields=fields,
    )


@app.exception_handler(Exception)
async def unhandled_handler(request: Request, exc: Exception):
    # Never leak internals. The request id is the bridge to the server log.
    return fail(
        "INTERNAL", "Something went wrong on our side. We have logged it.",
        status_code=500, request_id=_rid(request),
    )


@app.get("/health", tags=["meta"])
async def health():
    return {"success": True, "data": {"status": "ok"}, "error": None}


@app.get("/metrics", tags=["meta"], include_in_schema=False)
async def metrics(db: DbSession):
    """Prometheus text exposition.

    **Deliberately unauthenticated.** A scraper is not a user, and requiring a
    bearer token here is how metrics end up not being collected at all. It
    carries counts and durations by route template — no ids, no bodies, nothing
    a user typed.
    """
    # The in-process counters, then the AI queue as the database sees it (G10).
    body = registry.render() + queue_metrics.render(await queue_metrics.ai_queue_signals(db))
    return PlainTextResponse(body, media_type="text/plain; version=0.0.4")


for r in (
    auth.router, profile.router, goals.router,
    exercises.router, programs.router, sessions.router, history.router,
    analytics.router, nutrition.router, nutrition_copy.router,
    meal_categories.router, recipes.router,
    food_analysis.router, uploads.router,
    body.router, dashboard.router, admin.router, account.router,
    nutrition_analytics.router,
):
    app.include_router(r, prefix="/v1")
