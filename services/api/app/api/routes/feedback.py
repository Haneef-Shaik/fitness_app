"""In-app feedback — "Report a problem" and "Send an idea" (launch plan, phase 8).

Stored, not emailed from the request: a report must never fail because a mail
provider is slow, and the owner reads them in one place — `GET /v1/admin/feedback`,
behind the admin guard with the other operator-only answers (admin.py).
"""
from __future__ import annotations

from fastapi import APIRouter, Request

from app.api.deps import CurrentUser, DbSession
from app.api.envelope import ok
from app.core.ratelimit import enforce
from app.models import Feedback
from app.schemas.envelope import Envelope
from app.schemas.feedback import FeedbackIn, FeedbackOut

router = APIRouter(tags=["support"])


@router.post("/feedback", status_code=201, response_model=Envelope[FeedbackOut])
async def send_feedback(body: FeedbackIn, request: Request, user: CurrentUser, db: DbSession):
    await enforce(db, request, "feedback", account=str(user.id))
    row = Feedback(user_id=user.id, **body.model_dump())
    db.add(row)
    await db.flush()
    await db.refresh(row)
    return ok(FeedbackOut.model_validate(row).model_dump(mode="json"), status_code=201)

