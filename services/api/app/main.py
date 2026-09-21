from __future__ import annotations

import uuid

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware

from app.api.envelope import fail
from app.api.routes import auth, exercises, goals, profile, programs
from app.core.errors import AppError

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
    quote it to support (docs/06 §10)."""
    rid = request.headers.get("x-request-id") or f"req_{uuid.uuid4().hex[:12]}"
    request.state.request_id = rid
    response = await call_next(request)
    response.headers["x-request-id"] = rid
    return response


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
        fields[".".join(loc) or "body"] = err["msg"]
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


for r in (auth.router, profile.router, goals.router, exercises.router, programs.router):
    app.include_router(r, prefix="/v1")
