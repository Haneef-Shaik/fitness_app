"""L-08 · the service's own status, for the app to show before it matters.

Unauthenticated on purpose: the app asks at launch and on returning to the
foreground, including when the session has lapsed, and the answer holds
nothing about anyone — two flags and a sentence.
"""
from __future__ import annotations

from datetime import UTC, datetime, timedelta

from fastapi import APIRouter
from sqlalchemy import func, select

from app.api.deps import DbSession
from app.api.envelope import ok
from app.config import get_settings
from app.models import AnalysisErrorCode, AnalysisStatus, FoodAnalysis
from app.schemas.envelope import Envelope
from app.schemas.status import ServiceStatusOut

router = APIRouter(tags=["meta"])

#: Failures that are the provider's, not the photo's. `no_food_detected` and
#: `image_unreadable` say something about the input and nothing about the service.
PROVIDER_FAILURES = (AnalysisErrorCode.ai_unavailable, AnalysisErrorCode.ai_invalid_output)


async def _ai_state(db: DbSession) -> str:
    s = get_settings()
    since = datetime.now(UTC) - timedelta(minutes=s.ai_degraded_window_minutes)
    finished = (FoodAnalysis.status == AnalysisStatus.completed) | (FoodAnalysis.status == AnalysisStatus.failed)
    total = await db.scalar(
        select(func.count()).select_from(FoodAnalysis)
        .where(FoodAnalysis.created_at >= since, finished)
    ) or 0
    if total < s.ai_degraded_min_samples:
        return "ok"
    failed = await db.scalar(
        select(func.count()).select_from(FoodAnalysis)
        .where(
            FoodAnalysis.created_at >= since,
            FoodAnalysis.status == AnalysisStatus.failed,
            FoodAnalysis.error_code.in_(PROVIDER_FAILURES),
        )
    ) or 0
    return "degraded" if failed / total >= s.ai_degraded_failure_ratio else "ok"


@router.get("/status", response_model=Envelope[ServiceStatusOut])
async def service_status(db: DbSession):
    s = get_settings()
    return ok(ServiceStatusOut(
        maintenance=s.maintenance_mode,
        message=s.maintenance_message or None,
        ai=await _ai_state(db),
    ).model_dump(mode="json"))
