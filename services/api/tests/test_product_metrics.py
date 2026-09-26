"""PRD §6 metrics, computed from what the service already stores."""
from __future__ import annotations

import uuid
from datetime import UTC, date, datetime, timedelta

import pytest
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.models import Meal, SessionStatus, User, WorkoutSession
from app.services.product_metrics import product_metrics

pytestmark = pytest.mark.asyncio

NOW = datetime(2030, 6, 1, 12, tzinfo=UTC)   # after anything other tests create


async def _user(db, days_ago: int) -> User:
    u = User(email=f"m-{uuid.uuid4().hex[:10]}@example.com", 
             created_at=NOW - timedelta(days=days_ago))
    db.add(u)
    await db.flush()
    return u


def _meal(u: User, day: int) -> Meal:
    at = u.created_at + timedelta(days=day, hours=1)
    return Meal(user_id=u.id, meal_type="lunch", consumed_at=at, local_date=at.date(),
                logged_timezone="UTC")


def _session(u: User, day: int, status=SessionStatus.completed) -> WorkoutSession:
    at = u.created_at + timedelta(days=day, hours=1)
    return WorkoutSession(user_id=u.id, started_at=at, status=status, local_date=at.date(),
                          logged_timezone="UTC")


async def test_retention_counts_only_the_window_and_only_old_enough_accounts(engine):
    maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with maker() as db:
        before = await product_metrics(db, NOW)

        kept = await _user(db, 20)            # logged on day 8: retained
        db.add(_meal(kept, 8))
        early = await _user(db, 20)           # only on day 2: in the cohort, not retained
        db.add(_meal(early, 2))
        await _user(db, 3)                    # too new to be in the cohort at all
        lifter = await _user(db, 40)          # finished a workout on day 31
        db.add(_session(lifter, 31))
        await db.flush()

        after = await product_metrics(db, NOW)
        await db.rollback()

    d7_before, d7 = before["d7_nutrition_retention"], after["d7_nutrition_retention"]
    assert d7["cohort"] - d7_before["cohort"] == 3      # kept, early, lifter (40 d old)
    assert d7["retained"] - d7_before["retained"] == 1
    d30 = after["d30_workout_retention"]
    assert d30["retained"] - before["d30_workout_retention"]["retained"] == 1


async def test_a_session_left_open_for_a_day_is_counted_as_lost(engine):
    maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with maker() as db:
        before = await product_metrics(db, NOW)
        u = await _user(db, 10)
        db.add(_session(u, 1, SessionStatus.in_progress))      # open for 8 days
        db.add(_session(u, 2, SessionStatus.cancelled))        # discarded on purpose
        await db.flush()
        after = await product_metrics(db, NOW)
        await db.rollback()

    assert after["sessions_lost"]["stranded"] - before["sessions_lost"]["stranded"] == 1
    assert after["sessions_lost"]["started"] - before["sessions_lost"]["started"] == 2


async def test_every_metric_states_its_definition(engine):
    maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with maker() as db:
        out = await product_metrics(db, NOW)
    assert "day 7–13" in out["d7_nutrition_retention"]["definition"]
    assert out["d30_workout_retention"]["target"] == 0.45
    assert date.fromisoformat(out["as_of"][:10]) == NOW.date()
