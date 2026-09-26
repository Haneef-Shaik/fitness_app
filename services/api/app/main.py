from __future__ import annotations

import time
import uuid

from fastapi import Depends, FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse

from app.api.admin_auth import metrics_access
from app.api.deps import DbSession
from app.api.envelope import fail
from app.api.routes import (
    account,
    account_security,
    admin,
    analytics,
    auth,
    body,
    dashboard,
    devices,
    exercises,
    feedback,
    food_analysis,
    goals,
    history,
    imports,
    meal_categories,
    nutrition,
    nutrition_analytics,
    nutrition_copy,
    profile,
    programs,
    recipes,
    recovery,
    sessions,
    status,
    uploads,
)
from app.config import get_settings
from app.core.errors import AppError
from app.db import get_engine
from app.observability import queue as queue_metrics
from app.observability.crash_reporting import init_crash_reporting, report_unhandled
from app.observability.metrics import registry
from app.web import account_delete as web_account_delete
from app.web import legal

# At import, so a bad deployment fails at boot rather than on its first request:
# a missing secret, local storage in production, or a database URL without TLS
# (app/config.py `validate`, app/db_engine.py). The host keeps the previous
# release serving while a new one refuses to come up healthy.
_settings = get_settings()
get_engine()
init_crash_reporting(_settings, process="api")

app = FastAPI(
    title="FitLog API",
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
    # Retry-After is how a 429 says when; a web client cannot read it otherwise.
    expose_headers=["x-request-id", "retry-after"],
)


@app.middleware("http")
async def body_size_middleware(request: Request, call_next):
    """Refuses a body bigger than any legitimate request before reading it.

    FastAPI reads a JSON body whole — on sign-in, before anyone is known — so
    without this a single request could hand the process as much memory as it
    liked (G11 security review). The largest real bodies are an 8 MB photo and
    an 8 MB import; the proxy in front should enforce the same ceiling.
    """
    declared = request.headers.get("content-length")
    limit = get_settings().max_body_bytes
    if declared is not None and (not declared.isdigit() or int(declared) > limit):
        return fail(
            "PAYLOAD_TOO_LARGE", "That is more than FitLog accepts in one request.",
            status_code=413, request_id=getattr(request.state, "request_id", None),
        )
    return await call_next(request)


#: What stays up during maintenance: the probes, and the call that explains it.
MAINTENANCE_OPEN = frozenset({"/health", "/metrics", "/v1/status"})


@app.middleware("http")
async def maintenance_middleware(request: Request, call_next):
    """L-08 — declared downtime answers every call with one explained 503.

    Registered before the request-id middleware, so it runs INSIDE it and the
    503 still carries a request id and still counts in RED.
    """
    settings = get_settings()
    if settings.maintenance_mode and request.url.path not in MAINTENANCE_OPEN:
        return fail(
            "MAINTENANCE",
            settings.maintenance_message or "FitLog is down for maintenance. Try again shortly.",
            status_code=503, request_id=getattr(request.state, "request_id", None),
        )
    return await call_next(request)


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
    for name, value in SECURITY_HEADERS:
        response.headers.setdefault(name, value)
    if get_settings().is_deployed:
        # Deployed behind HTTPS only: tell browsers (the web deletion page, the
        # policies) never to try plain HTTP for this host again.
        response.headers.setdefault("strict-transport-security", "max-age=31536000; includeSubDomains")
    return response


#: On every response. The JSON API needs little, but the HTML pages (legal,
#: web deletion) are pages, and a browser should not sniff or leak referrers.
SECURITY_HEADERS = (
    ("x-content-type-options", "nosniff"),
    ("referrer-policy", "no-referrer"),
)


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
    if request.scope.get("route") is None:
        # No route matched: the raw path is whatever a caller typed, and one
        # label per typo is unbounded memory for anyone who scans us (G11).
        return "(unmatched)"
    template = request.url.path
    for name, value in (request.scope.get("path_params") or {}).items():
        template = template.replace(str(value), "{" + name + "}")
    return template


def _rid(request: Request) -> str:
    return getattr(request.state, "request_id", "req_unknown")


@app.exception_handler(AppError)
async def app_error_handler(request: Request, exc: AppError):
    response = fail(
        exc.code, exc.message,
        status_code=exc.status_code, request_id=_rid(request), fields=exc.fields,
    )
    response.headers.update(exc.headers)
    return response


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
    # Never leak internals. The request id is the bridge to the server log —
    # and to the crash report, which is tagged with it.
    report_unhandled(exc, request_id=_rid(request))
    return fail(
        "INTERNAL", "Something went wrong on our side. We have logged it.",
        status_code=500, request_id=_rid(request),
    )


@app.get("/health", tags=["meta"])
async def health():
    """Liveness for the host and the image's HEALTHCHECK. Touches no database:
    a database blip should not get every replica restarted at once.

    `release` is how a deploy confirms the new build is the one answering
    (`.github/workflows/deploy.yml`), rather than trusting that the hook worked.
    """
    return {
        "success": True,
        "data": {"status": "ok", "release": _settings.app_release or None},
        "error": None,
    }


@app.get("/metrics", tags=["meta"], include_in_schema=False,
         dependencies=[Depends(metrics_access)])
async def metrics(db: DbSession):
    """Prometheus text exposition.

    **Unauthenticated in development, the operator token in production.** A
    scraper is not a user, and requiring a user's bearer here is how metrics
    end up not being collected at all — but open on the internet it publishes
    the shape of the traffic to anybody. Prometheus sends the `ADMIN_TOKEN` as
    a bearer (`app/api/admin_auth.py`). It carries counts and durations by
    route template — no ids, no bodies, nothing a user typed.
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
    nutrition_analytics.router, status.router, feedback.router,
    imports.router, devices.router,
    # A-05, A-06 and K-02 (launch)
    recovery.router, account_security.router,
):
    app.include_router(r, prefix="/v1")

# Pages for people, not endpoints for the app: outside /v1 and outside the
# OpenAPI document (app/web/__init__.py says why they exist at all).
app.include_router(web_account_delete.router)
app.include_router(legal.router)
