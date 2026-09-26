"""In-app feedback and problem reports (launch plan, phase 8).

A report carries the `request_id` of the last error the app saw, so a "it
didn't save" can be matched to the server log line that says why — the same
bridge the error envelope has offered since G1 (docs/06 §10).

Deleted with the account: a report is often a sentence about the person's own
data, and asking to be forgotten outranks keeping it.
"""
from __future__ import annotations

import uuid

from sqlalchemy import ForeignKey, Index, String
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base
from app.models.user import TimestampMixin


class Feedback(Base, TimestampMixin):
    __tablename__ = "feedback"

    id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    category: Mapped[str] = mapped_column(String(20), nullable=False)   # problem|idea|other
    message: Mapped[str] = mapped_column(String(2000), nullable=False)
    app_version: Mapped[str | None] = mapped_column(String(40))
    platform: Mapped[str | None] = mapped_column(String(40))
    request_id: Mapped[str | None] = mapped_column(String(80))

    __table_args__ = (Index("ix_feedback_created", "created_at"),)
