"""Who may read `/v1/admin/*` and `/metrics` (launch).

G10 made both easy to reach on purpose: `/metrics` open, because a scraper
that needs credentials is how metrics stop being collected; the alert table
behind any signed-in user. On a laptop that is right. On the internet the first
publishes the shape of the traffic to anybody and the second shows every
registered user the thresholds at which the operator gets paged.

So **in staging and production** both take the operator's `ADMIN_TOKEN` as a bearer —
Prometheus sends one with `authorization: credentials_file` — and production
refuses to start without it (`app.config.validate_settings`). **Everywhere
else** nothing changes, so a developer and the test suite see G10's behaviour.

The comparison is `hmac.compare_digest`: `==` on a secret returns as soon as a
byte differs, which leaks how much of a guess was right.
"""
from __future__ import annotations

from hmac import compare_digest

from fastapi import Request

from app.api.deps import DbSession, current_claims, current_user
from app.config import get_settings
from app.core.errors import Unauthorized


def _bearer(request: Request) -> str | None:
    scheme, _, token = request.headers.get("authorization", "").partition(" ")
    if scheme.lower() != "bearer" or not token.strip():
        return None
    return token.strip()


def require_operator(request: Request) -> None:
    expected = get_settings().admin_token
    presented = _bearer(request)
    # `expected` is never empty in production (startup refuses it), but an
    # empty secret must not match an empty guess if that ever changes.
    if not expected or presented is None or not compare_digest(
        presented.encode(), expected.encode()
    ):
        raise Unauthorized("This needs the operator token.")


async def admin_access(request: Request, db: DbSession) -> None:
    """`/v1/admin/*`: the operator token when deployed, a signed-in user elsewhere."""
    if get_settings().is_deployed:
        require_operator(request)
        return
    await current_user(await current_claims(request, db), db)


async def metrics_access(request: Request) -> None:
    """`/metrics`: the operator token when deployed, open elsewhere."""
    if get_settings().is_deployed:
        require_operator(request)
