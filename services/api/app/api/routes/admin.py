"""The alert table, evaluated live (G10).

`GET /v1/admin/alerts` answers "what is firing right now" from the **same
counters** `/metrics` exports, so a dashboard and an alert can never disagree
about the numbers — they are the numbers.

It is authenticated, unlike `/metrics`: this one is a human-facing answer, and
it names thresholds that are operational detail rather than a scrape target.
"""
from __future__ import annotations

from datetime import UTC, datetime, timedelta

from fastapi import APIRouter
from sqlalchemy import func, select

from app.api.deps import CurrentUser, DbSession
from app.api.envelope import ok
from app.models import SessionStatus, WorkoutSession
from app.observability.alerts import RULES, evaluate
from app.observability.metrics import registry
from app.schemas.envelope import Envelope

router = APIRouter(prefix="/admin", tags=["meta"])

#: 02 §9 — "sessions abandoned in `in_progress` > 24 h".
ABANDONED_AFTER_HOURS = 24


@router.get("/alerts", response_model=Envelope[dict])
async def alerts(user: CurrentUser, db: DbSession):
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
