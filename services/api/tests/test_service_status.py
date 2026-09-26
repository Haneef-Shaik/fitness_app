"""L-08 · maintenance and "AI is struggling" — told to the app, not discovered by it.

Two separate facts. **Maintenance** is declared by whoever runs the service and
turns every API call except health and status into a 503 the app can explain.
**AI degraded** is observed, never declared: when most recent analyses failed
because the provider did, the app says so before someone photographs dinner
into a queue that will not answer (I14 keeps training untouched either way).
"""
from __future__ import annotations

import uuid
from datetime import UTC, datetime, timedelta

import pytest
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.config import get_settings
from app.models import AnalysisErrorCode, AnalysisInputType, AnalysisStatus, FoodAnalysis

pytestmark = pytest.mark.asyncio


def _data(response, expect: int = 200):
    assert response.status_code == expect, response.text
    return response.json()["data"]


@pytest.fixture
def maintenance():
    s = get_settings()
    object.__setattr__(s, "maintenance_mode", True)
    object.__setattr__(s, "maintenance_message", "Back by 14:00 UTC.")
    yield
    object.__setattr__(s, "maintenance_mode", False)
    object.__setattr__(s, "maintenance_message", "")


async def test_the_status_is_open_and_all_clear_by_default(client):
    out = _data(await client.get("/v1/status"))
    assert out == {"maintenance": False, "message": None, "ai": "ok"}


async def test_maintenance_turns_the_api_into_an_explained_503(auth_client, maintenance):
    r = await auth_client.get("/v1/profile")
    assert r.status_code == 503
    assert r.json()["error"]["code"] == "MAINTENANCE"
    assert r.json()["error"]["message"] == "Back by 14:00 UTC."


async def test_health_and_status_stay_up_during_maintenance(client, maintenance):
    assert (await client.get("/health")).status_code == 200
    out = _data(await client.get("/v1/status"))
    assert out["maintenance"] is True
    assert out["message"] == "Back by 14:00 UTC."


async def _analyses(engine, user_id, outcomes: list[tuple[AnalysisStatus, AnalysisErrorCode | None]]):
    maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with maker() as db:
        for status, code in outcomes:
            db.add(FoodAnalysis(
                user_id=user_id, input_type=AnalysisInputType.text, source_text="rice", model_name="stub",
                status=status, error_code=code,
                created_at=datetime.now(UTC) - timedelta(minutes=2),
            ))
        await db.commit()


async def _me(client) -> uuid.UUID:
    return uuid.UUID(_data(await client.get("/v1/auth/me"))["id"])


async def _recent_finished(engine) -> int:
    maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with maker() as db:
        return await db.scalar(
            select(func.count()).select_from(FoodAnalysis).where(
                FoodAnalysis.created_at >= datetime.now(UTC) - timedelta(minutes=15),
                FoodAnalysis.status.in_([AnalysisStatus.completed, AnalysisStatus.failed]),
            )
        ) or 0


async def test_ai_is_degraded_when_most_recent_analyses_failed_at_the_provider(auth_client, engine):
    failed = (AnalysisStatus.failed, AnalysisErrorCode.ai_unavailable)
    ok = (AnalysisStatus.completed, None)
    # The status is service-wide, and the rest of the suite analyses meals too:
    # outnumber whatever it left in the window, so this test decides the ratio.
    existing = await _recent_finished(engine)
    await _analyses(engine, await _me(auth_client), [failed] * (4 + existing) + [ok])

    assert _data(await auth_client.get("/v1/status"))["ai"] == "degraded"


async def test_a_user_problem_is_not_a_provider_problem(auth_client, engine):
    """A plate the model could not read is the photo's fault, not the service's."""
    unreadable = (AnalysisStatus.failed, AnalysisErrorCode.no_food_detected)
    await _analyses(engine, await _me(auth_client), [unreadable] * (6 + await _recent_finished(engine)))

    assert _data(await auth_client.get("/v1/status"))["ai"] == "ok"


async def test_too_few_analyses_say_nothing(auth_client, engine):
    failed = (AnalysisStatus.failed, AnalysisErrorCode.ai_unavailable)
    s = get_settings()
    original = s.ai_degraded_min_samples
    # Whatever the rest of the suite left in the window, two more stay below it.
    object.__setattr__(s, "ai_degraded_min_samples", await _recent_finished(engine) + 3)
    try:
        await _analyses(engine, await _me(auth_client), [failed] * 2)
        assert _data(await auth_client.get("/v1/status"))["ai"] == "ok"
    finally:
        object.__setattr__(s, "ai_degraded_min_samples", original)
