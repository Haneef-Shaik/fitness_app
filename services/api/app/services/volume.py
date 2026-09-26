"""Which sets count toward volume, for one user — and keeping stored totals honest.

D6: warm-ups are left out by default, and K-04 lets the user count them. Every
reader asks `warmups_counted` rather than reading the profile itself, so there is
one home for the rule (I15). Flipping the preference **recounts** the totals
stored at finish: a preference that only applied from now on would show last
month's chest day and this month's, same work, as different numbers.
"""
from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.domain.training import total_volume_kg
from app.models import SessionExercise, SessionStatus, UserProfile, WorkoutSession
from app.services import summaries
from app.services.sessions import to_domain


async def warmups_counted(db: AsyncSession, user_id: uuid.UUID) -> bool:
    value = await db.scalar(
        select(UserProfile.warmups_in_volume).where(UserProfile.user_id == user_id)
    )
    return bool(value)


async def recount(db: AsyncSession, user_id: uuid.UUID, include_warmups: bool) -> int:
    """Re-derives every completed session's stored total. Returns how many changed."""
    sessions = (await db.scalars(
        select(WorkoutSession)
        .where(
            WorkoutSession.user_id == user_id,
            WorkoutSession.status == SessionStatus.completed,
        )
        .options(selectinload(WorkoutSession.exercises).selectinload(SessionExercise.sets))
    )).all()

    changed = 0
    for session in sessions:
        sets = [to_domain(s) for se in session.exercises for s in se.sets]
        total = round(total_volume_kg(sets, include_warmups=include_warmups), 2)
        if session.total_volume_kg is None or float(session.total_volume_kg) != total:
            session.total_volume_kg = total
            changed += 1
    await db.flush()
    # Daily summaries hold the day's volume, read from these totals.
    await summaries.invalidate_all(db, user_id)
    return changed
