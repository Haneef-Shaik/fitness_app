from __future__ import annotations

import uuid
from datetime import UTC, datetime

from fastapi import APIRouter
from sqlalchemy import select

from app.api.deps import CurrentUser, DbSession, authorize
from app.api.envelope import ok
from app.api.routes.dashboard import goal_card
from app.core.errors import NotFound, ValidationFailed
from app.models import FitnessGoal
from app.schemas.body import GoalCardOut
from app.schemas.envelope import Envelope, PagedEnvelope
from app.schemas.goals import GoalIn, GoalPatch

router = APIRouter(prefix="/goals", tags=["goals"])


async def _out(db: DbSession, user_id: uuid.UUID, g: FitnessGoal) -> dict:
    """A goal WITH its progress.

    Shared with the dashboard through `goal_card`, so J-01's list and B-01's
    card can never disagree about how far along something is — which they
    would, eventually, if each computed it.
    """
    return (await goal_card(db, user_id, g)).model_dump(mode="json")


@router.get("", response_model=PagedEnvelope[list[GoalCardOut]])
async def list_goals(user: CurrentUser, db: DbSession, status: str | None = None):
    stmt = select(FitnessGoal).where(FitnessGoal.user_id == user.id)
    if status:
        stmt = stmt.where(FitnessGoal.status == status)
    rows = (await db.scalars(stmt.order_by(FitnessGoal.created_at.desc()))).all()
    return ok([await _out(db, user.id, g) for g in rows], meta={"total": len(rows)})


@router.post("", status_code=201, response_model=Envelope[GoalCardOut])
async def create_goal(body: GoalIn, user: CurrentUser, db: DbSession):
    if body.target_date is not None and body.target_date <= body.start_date:
        raise ValidationFailed(
            "The target date must be after the start date.",
            fields={"target_date": "Must be after the start date."},
        )
    goal = FitnessGoal(user_id=user.id, **body.model_dump())
    db.add(goal)
    await db.flush()
    return ok(await _out(db, user.id, goal), status_code=201)


@router.get("/{goal_id}", response_model=Envelope[GoalCardOut])
async def get_goal(goal_id: uuid.UUID, user: CurrentUser, db: DbSession):
    goal = await db.scalar(select(FitnessGoal).where(FitnessGoal.id == goal_id))
    if goal is None:
        raise NotFound("That goal no longer exists.")
    authorize(user, "read", goal.user_id)
    return ok(await _out(db, user.id, goal))


@router.patch("/{goal_id}", response_model=Envelope[GoalCardOut])
async def patch_goal(goal_id: uuid.UUID, body: GoalPatch, user: CurrentUser, db: DbSession):
    goal = await db.scalar(select(FitnessGoal).where(FitnessGoal.id == goal_id))
    if goal is None:
        raise NotFound("That goal no longer exists.")
    authorize(user, "update", goal.user_id)

    changes = body.model_dump(exclude_unset=True)
    # Editing a target keeps the original start_date and start_value, so progress is
    # still measured from where the user actually started (P02.6).
    if changes.get("status") == "completed" and goal.completed_at is None:
        goal.completed_at = datetime.now(UTC)
    for key, value in changes.items():
        setattr(goal, key, value)
    await db.flush()
    return ok(await _out(db, user.id, goal))
