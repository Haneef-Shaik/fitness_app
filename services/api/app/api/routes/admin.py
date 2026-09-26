"""The alert table, evaluated live (G10).

`GET /v1/admin/alerts` answers "what is firing right now" from the **same
counters** `/metrics` exports, so a dashboard and an alert can never disagree
about the numbers — they are the numbers.

It is authenticated, unlike `/metrics` in development: this one is a
human-facing answer, and it names thresholds that are operational detail rather
than a scrape target. **In production every `/v1/admin/*` route takes the
operator's `ADMIN_TOKEN` instead of a user's** (`app/api/admin_auth.py`) — any
registered user could read this table before that.
"""
from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select

from app.api.admin_auth import admin_access
from app.api.deps import DbSession
from app.api.envelope import ok
from app.models import Feedback, SessionStatus, WorkoutSession
from app.observability.alerts import RULES, evaluate
from app.observability.metrics import registry
from app.observability.queue import ai_queue_signals
from app.schemas.envelope import Envelope
from app.schemas.feedback import FeedbackOut
from app.services.product_metrics import product_metrics

# On the router, so a route added here later cannot be added unguarded.
router = APIRouter(prefix="/admin", tags=["meta"], dependencies=[Depends(admin_access)])

#: 02 §9 — "sessions abandoned in `in_progress` > 24 h".
ABANDONED_AFTER_HOURS = 24


@router.get("/alerts", response_model=Envelope[dict])
async def alerts(db: DbSession):
    snapshot = registry.snapshot()

    # One signal the in-process counters cannot know: a session left open
    # across a restart is still abandoned (02 §9, trend watch). It lives in the
    # database, so it is read from there rather than counted in memory.
    cutoff = datetime.now(UTC) - timedelta(hours=ABANDONED_AFTER_HOURS)
    snapshot["abandoned_sessions"] = float(await db.scalar(
        select(func.count())
        .select_from(WorkoutSession)
        .where(
            WorkoutSession.status == SessionStatus.in_progress,
            WorkoutSession.started_at < cutoff,
        )
    ) or 0)

    snapshot.update(await ai_queue_signals(db))

    firing = evaluate(snapshot)

    return ok({
        "rules": [
            {
                "name": rule.name,
                "doc": rule.doc,
                "threshold": rule.threshold,
                "unit": rule.unit,
                "minimum_sample": rule.minimum_sample,
            }
            for rule in RULES
        ],
        "firing": [
            {"name": a.rule.name, "value": a.value, "message": a.message}
            for a in firing
        ],
        "snapshot": snapshot,
    })


# ------------------------------------------------------- support & product
#
# Both behind the router's `admin_access`: feedback is often a sentence about
# someone's own data, and the product metrics are the operator's, not a user's.

@router.get("/feedback", response_model=Envelope[list[FeedbackOut]])
async def list_feedback(db: DbSession, limit: Annotated[int, Query(ge=1, le=200)] = 50):
    """"Send feedback" reports, newest first, each with the request id that
    finds it in the server log."""
    rows = (await db.scalars(
        select(Feedback).order_by(Feedback.created_at.desc()).limit(limit)
    )).all()
    return ok([FeedbackOut.model_validate(r).model_dump(mode="json") for r in rows])


@router.get("/product-metrics", response_model=Envelope[dict])
async def read_product_metrics(db: DbSession):
    """PRD §6, from the service's own tables — no tracking SDK (launch plan, phase 8)."""
    return ok(await product_metrics(db))
