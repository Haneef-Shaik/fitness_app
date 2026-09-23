"""AI food analyses — the audit record (G8).

**The distinction this schema draws, and the one G8 turns on.**

`food_analysis_items` is what the model said. It is written once and is
**strictly append-only**: a database trigger rejects every `UPDATE` and every
`DELETE`, so AC-10's "byte-identical afterwards" is a property of the schema and
not of everybody's discipline. A user's correction goes to `meal_items`; this
table is never touched again.

`food_analyses` is a **job as well as a record**, and a job has a lifecycle:
pending → processing → completed or failed. Pretending otherwise would mean a
second table holding status, which is two homes for one fact (**I15**). The line
is drawn inside the row instead: a trigger makes the *input and the model's own
output* immutable once written — `user_id`, `input_type`, `source_text`,
`model_name`, `schema_version`, `notes`, `created_at` — while allowing the
status columns to move forward. `image_key` is excepted because a user may
delete their photographs (BRD §18) without deleting the record of what was
analysed.
"""
from __future__ import annotations

import enum
import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base
from app.models.user import TimestampMixin


class AnalysisInputType(str, enum.Enum):
    text = "text"
    image = "image"


class AnalysisStatus(str, enum.Enum):
    pending = "pending"
    processing = "processing"
    completed = "completed"
    failed = "failed"


class AnalysisErrorCode(str, enum.Enum):
    """The codes H-07 maps to sentences. A user never sees the enum."""

    ai_unavailable = "ai_unavailable"
    ai_invalid_output = "ai_invalid_output"
    image_unreadable = "image_unreadable"
    no_food_detected = "no_food_detected"
    quota_exceeded = "quota_exceeded"


class FoodAnalysis(Base, TimestampMixin):
    __tablename__ = "food_analyses"

    id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )

    input_type: Mapped[AnalysisInputType] = mapped_column(
        Enum(AnalysisInputType, name="analysis_input_type"), nullable=False
    )
    #: The user's own words, kept so nobody is ever made to retype their meal.
    source_text: Mapped[str | None] = mapped_column(String(1000))
    #: Nulled when the photographs are deleted; the record itself survives.
    image_key: Mapped[str | None] = mapped_column(String(400))

    status: Mapped[AnalysisStatus] = mapped_column(
        Enum(AnalysisStatus, name="analysis_status"),
        default=AnalysisStatus.pending, nullable=False,
    )
    error_code: Mapped[AnalysisErrorCode | None] = mapped_column(
        Enum(AnalysisErrorCode, name="analysis_error_code")
    )

    #: What answered, and under which schema. Stored per row so a v1 analysis
    #: stays readable after v2 ships.
    model_name: Mapped[str | None] = mapped_column(String(120))
    schema_version: Mapped[str | None] = mapped_column(String(40))
    #: Model commentary. Never rendered as fact (02 §5.1).
    notes: Mapped[str | None] = mapped_column(String(2000))

    # Queue bookkeeping. `locked_at` + SKIP LOCKED is the whole scheduler.
    attempts: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    locked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    #: The meal this analysis was confirmed into. Set once, and what makes
    #: confirming twice idempotent without a client key.
    confirmed_meal_id: Mapped[uuid.UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("meals.id", ondelete="SET NULL")
    )

    #: I8 — a submission replayed by the outbox is one job, not two.
    client_id: Mapped[uuid.UUID | None] = mapped_column(PGUUID(as_uuid=True))

    items: Mapped[list[FoodAnalysisItem]] = relationship(
        back_populates="analysis", order_by="FoodAnalysisItem.order_index",
        # No delete-orphan and no cascade: the ORM must have no way to remove
        # these rows, quite apart from the trigger that would stop it.
        passive_deletes=True,
    )

    __table_args__ = (
        Index("ix_food_analyses_user", "user_id", "created_at"),
        # The worker's own query: oldest pending job first.
        Index("ix_food_analyses_queue", "status", "created_at"),
        UniqueConstraint("user_id", "client_id", name="uq_food_analysis_client_id"),
    )


class FoodAnalysisItem(Base, TimestampMixin):
    """One food the model reported. **Append-only, enforced by the database.**"""

    __tablename__ = "food_analysis_items"

    id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    analysis_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("food_analyses.id", ondelete="RESTRICT"), nullable=False
    )
    order_index: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # ---- the model's claims, verbatim -------------------------------------
    detected_name: Mapped[str] = mapped_column(String(160), nullable=False)
    estimated_quantity: Mapped[float | None] = mapped_column(Numeric(9, 2))
    estimated_unit: Mapped[str] = mapped_column(String(16), default="g", nullable=False)
    confidence: Mapped[float | None] = mapped_column(Numeric(4, 3))
    proposed_calories: Mapped[float | None] = mapped_column(Numeric(9, 2))
    proposed_protein_g: Mapped[float | None] = mapped_column(Numeric(8, 2))
    proposed_carbs_g: Mapped[float | None] = mapped_column(Numeric(8, 2))
    proposed_fat_g: Mapped[float | None] = mapped_column(Numeric(8, 2))

    # ---- the platform's, set once at write --------------------------------
    #: The resolver's answer (02 §5.2). NULL is ladder step 5 — unresolved, and
    #: the model's own macros stand. Never set by the model.
    resolved_food_id: Mapped[uuid.UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("foods.id", ondelete="SET NULL")
    )
    #: Below the review threshold. Computed here so the rule has one home and
    #: every screen reads the same answer.
    low_confidence: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    analysis: Mapped[FoodAnalysis] = relationship(back_populates="items")

    __table_args__ = (
        Index("ix_food_analysis_items_analysis", "analysis_id", "order_index"),
    )
