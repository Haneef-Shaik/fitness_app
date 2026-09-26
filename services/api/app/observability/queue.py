"""The AI queue's health, read from the database (G10).

Outcomes and durations are counted when a job finishes — so a job that never
finishes records nothing, and a stuck queue looked exactly like an idle one.
Depth and the age of the oldest job are read at scrape time from the rows
themselves, which also keeps them true across a restart of either process.
"""
from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.analysis import AnalysisStatus, FoodAnalysis


async def ai_queue_signals(db: AsyncSession) -> dict[str, float]:
    now = datetime.now(UTC)

    async def count(status: AnalysisStatus) -> float:
        return float(await db.scalar(
            select(func.count()).select_from(FoodAnalysis).where(FoodAnalysis.status == status)
        ) or 0)

    async def oldest(status: AnalysisStatus, column) -> float:
        at = await db.scalar(select(func.min(column)).where(FoodAnalysis.status == status))
        if at is None:
            return 0.0
        if at.tzinfo is None:
            at = at.replace(tzinfo=UTC)
        return max(0.0, (now - at).total_seconds())

    return {
        "ai_queue_pending": await count(AnalysisStatus.pending),
        "ai_queue_processing": await count(AnalysisStatus.processing),
        # Waiting since it was queued; processing since the worker took it.
        "ai_oldest_pending_seconds": await oldest(AnalysisStatus.pending, FoodAnalysis.created_at),
        "ai_oldest_processing_seconds": await oldest(AnalysisStatus.processing, FoodAnalysis.locked_at),
    }


def render(signals: dict[str, float]) -> str:
    """The same numbers in the Prometheus text format, appended to `/metrics`."""
    return "\n".join([
        "# HELP fitlog_ai_queue_depth Food analyses waiting or being worked on.",
        "# TYPE fitlog_ai_queue_depth gauge",
        f'fitlog_ai_queue_depth{{status="pending"}} {signals["ai_queue_pending"]:g}',
        f'fitlog_ai_queue_depth{{status="processing"}} {signals["ai_queue_processing"]:g}',
        "# HELP fitlog_ai_queue_oldest_pending_seconds Age of the oldest job not yet picked up.",
        "# TYPE fitlog_ai_queue_oldest_pending_seconds gauge",
        f"fitlog_ai_queue_oldest_pending_seconds {signals['ai_oldest_pending_seconds']:.1f}",
        "# HELP fitlog_ai_queue_oldest_processing_seconds Time the oldest in-flight job has held its lock.",
        "# TYPE fitlog_ai_queue_oldest_processing_seconds gauge",
        f"fitlog_ai_queue_oldest_processing_seconds {signals['ai_oldest_processing_seconds']:.1f}",
    ]) + "\n"
