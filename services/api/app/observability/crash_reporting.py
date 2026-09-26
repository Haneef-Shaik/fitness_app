"""Crash reporting (Sentry) — on only when `SENTRY_DSN` is set, and never with PII.

02 §8's rule for logs holds for crash reports, which are log lines that leave
the building: `user_id` and `request_id`, **never** emails, bodies, tokens or
image contents. Sentry's own switches do most of it (`send_default_pii=False`,
no request bodies, no frame locals); `scrub_event` is the part that does not
depend on remembering which switch covers which field. It runs on every event
and returns a **new** event — what it was handed is left untouched.

Off by default, like the AI provider (D23): `git clone` → `pytest` sends nothing
anywhere. The API and the worker initialise separately (D25) and tag themselves,
so a report says which process crashed.
"""
from __future__ import annotations

import re
from typing import Any

import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.starlette import StarletteIntegration

from app.config import Settings

#: Headers worth keeping. An allow-list, because a deny-list misses the header
#: nobody thought of — `X-Forwarded-For` is the client's IP address.
_KEPT_HEADERS = frozenset({
    "accept", "content-length", "content-type", "host", "user-agent", "x-request-id",
})

#: Request fields that are the user's data or their address.
_DROPPED_REQUEST_FIELDS = frozenset({"data", "cookies", "env", "query_string"})

#: Keys whose VALUE is a secret, wherever they appear.
_SECRET_KEY = re.compile(r"password|passwd|secret|token|authorization|cookie|api_?key|signature",
                         re.IGNORECASE)

#: Keys dropped outright: frame locals, and a breadcrumb's query and fragment.
_DROPPED_KEYS = frozenset({"vars", "http.query", "http.fragment"})

_EMAIL = re.compile(r"[\w.+-]+@[\w-]+(?:\.[\w-]+)+")
_JWT = re.compile(r"eyJ[\w-]+\.[\w-]+\.[\w-]+")
_URL_QUERY = re.compile(r"(https?://[^\s?#\"']+)[?#][^\s\"']*")

FILTERED = "[Filtered]"


def scrub_event(event: dict[str, Any], hint: dict[str, Any] | None = None) -> dict[str, Any]:
    """`before_send`: the event without personal data. Never drops it."""
    cleaned = _scrub(event)
    request = cleaned.get("request")
    if isinstance(request, dict):
        cleaned = {**cleaned, "request": _scrub_request(request)}
    user = cleaned.get("user")
    if isinstance(user, dict):
        # The id is how a report is joined to a support request; nothing else.
        cleaned = {**cleaned, "user": {k: v for k, v in user.items() if k == "id"}}
    return cleaned


def _scrub_request(request: dict[str, Any]) -> dict[str, Any]:
    kept = {k: v for k, v in request.items() if k not in _DROPPED_REQUEST_FIELDS}
    headers = kept.get("headers")
    if isinstance(headers, dict):
        kept = {**kept, "headers": {
            k: v for k, v in headers.items() if k.lower() in _KEPT_HEADERS
        }}
    return kept


def _scrub(value: Any) -> Any:
    if isinstance(value, dict):
        return {
            k: (FILTERED if _SECRET_KEY.search(str(k)) else _scrub(v))
            for k, v in value.items()
            if k not in _DROPPED_KEYS
        }
    if isinstance(value, list | tuple):
        return [_scrub(v) for v in value]
    if isinstance(value, str):
        return _scrub_text(value)
    return value


#: SQLAlchemy's "[parameters: (...)]" suffix on a database error. The engines
#: hide it already; this is the second layer for anything they do not build.
_SQL_PARAMETERS = re.compile(r"\[parameters: .*?\]", re.DOTALL)


def _scrub_text(text: str) -> str:
    text = _SQL_PARAMETERS.sub("[parameters: redacted]", text)
    # The query first: an upload URL's query string IS its signature.
    text = _URL_QUERY.sub(r"\1", text)
    text = _JWT.sub("[token]", text)
    return _EMAIL.sub("[email]", text)


def init_crash_reporting(settings: Settings, *, process: str, transport: Any = None) -> bool:
    """Initialises Sentry for `process` ("api" or "worker"). Returns whether it did.

    `transport` is for the suite, which captures events instead of sending them.
    """
    if not settings.sentry_dsn:
        return False
    sentry_sdk.init(
        dsn=settings.sentry_dsn,
        environment=settings.environment,
        release=settings.app_release or None,
        send_default_pii=False,
        include_local_variables=False,
        max_request_body_size="never",
        before_send=scrub_event,
        before_send_transaction=scrub_event,
        # Errors only. Tracing is a second data stream with its own PII surface,
        # and 02 §9's RED metrics already answer "how slow".
        traces_sample_rate=0.0,
        integrations=[StarletteIntegration(), FastApiIntegration()],
        transport=transport,
    )
    # The global scope, so every event carries it — each request's own scope
    # is forked later, from a context this call may not be in.
    sentry_sdk.get_global_scope().set_tag("process", process)
    return True


def report_unhandled(exc: BaseException, *, request_id: str) -> None:
    """One event per unhandled error, tagged with the id the user was shown —
    the thread from a support email to the stack trace (docs/06 §10). A no-op
    when crash reporting is off."""
    with sentry_sdk.new_scope() as scope:
        scope.set_tag("request_id", request_id)
        scope.capture_exception(exc)
