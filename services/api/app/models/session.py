"""The PERFORMED tree, deliberately separate from the plan tree.

A session is self-describing: history renders entirely from session_exercises and
workout_sets, never by reading live plan data. That is what makes AC-12 hold when a
program is edited afterwards.
"""
from __future__ import annotations

import enum
import uuid
from datetime import date, datetime

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Numeric,
    String,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base
from app.models.user import TimestampMixin


class SessionStatus(str, enum.Enum):
    planned = "planned"
    in_progress = "in_progress"
    completed = "completed"
    cancelled = "cancelled"


class SetType(str, enum.Enum):
    warmup = "warmup"
    working = "working"
    drop = "drop"
    failure = "failure"


class RecordType(str, enum.Enum):
    max_load = "max_load"
    max_reps = "max_reps"
    volume = "volume"
    estimated_1rm = "estimated_1rm"


class WorkoutSession(Base, TimestampMixin):
    __tablename__ = "workout_sessions"

    id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    # Kept for provenance only. History never reads through it — a deleted plan day
    # leaves this dangling and nothing breaks.
    plan_day_id: Mapped[uuid.UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("workout_plan_days.id", ondelete="SET NULL")
    )

    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    status: Mapped[SessionStatus] = mapped_column(
        Enum(SessionStatus, name="session_status"), default=SessionStatus.in_progress, nullable=False
    )
    notes: Mapped[str | None] = mapped_column(String(2000))

    # The user's local calendar day for started_at (AC-03).
    #
    # NOT a Postgres generated column: that would need `started_at AT TIME ZONE <tz>`,
    # and both the timezone lookup and the AT TIME ZONE operator are STABLE rather than
    # IMMUTABLE, which Postgres refuses in a generated column. It is written by the
    # application through domain.dates.to_local_date, and recomputed for the affected
    # rows when a user changes their profile timezone (edge case T4).
    local_date: Mapped[date] = mapped_column(Date, nullable=False)
    # The timezone in force when the row was written, so a recompute is auditable.
    logged_timezone: Mapped[str] = mapped_column(String(64), nullable=False)

    # Denormalised on finish so history lists render without aggregating every set.
    total_volume_kg: Mapped[float | None] = mapped_column(Numeric(10, 2))
    duration_seconds: Mapped[int | None] = mapped_column()

    exercises: Mapped[list[SessionExercise]] = relationship(
        back_populates="session", cascade="all, delete-orphan",
        order_by="SessionExercise.order_index", lazy="selectin",
    )

    __table_args__ = (
        Index(
            "ix_sessions_user_local_date", "user_id", "local_date",
            postgresql_where=(status == SessionStatus.completed),
        ),
        # At most one open session per user — enforced by the database, not by a check
        # in application code that a second device could race past.
        Index(
            "uq_one_active_session_per_user", "user_id", unique=True,
            postgresql_where=(status == SessionStatus.in_progress),
        ),
    )


class SessionExercise(Base, TimestampMixin):
    __tablename__ = "session_exercises"

    id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("workout_sessions.id", ondelete="CASCADE"), nullable=False
    )
    exercise_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("exercises.id", ondelete="RESTRICT"), nullable=False
    )
    order_index: Mapped[int] = mapped_column(nullable=False)         # dense, 0-based
    notes: Mapped[str | None] = mapped_column(String(2000))
    skipped: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    plan_exercise_id: Mapped[uuid.UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("plan_exercises.id", ondelete="SET NULL")
    )
    # Frozen copy of what was PRESCRIBED at the moment the session started. Later plan
    # edits cannot rewrite what the user was asked to do that day.
    target_snapshot: Mapped[dict | None] = mapped_column(JSONB)

    session: Mapped[WorkoutSession] = relationship(back_populates="exercises")
    sets: Mapped[list[WorkoutSet]] = relationship(
        back_populates="session_exercise", cascade="all, delete-orphan",
        order_by="WorkoutSet.set_index", lazy="selectin",
    )

    __table_args__ = (
        # DEFERRABLE: reordering shifts several rows through values their neighbours
        # still hold. Postgres checks a plain unique constraint row-by-row, so an
        # honest renumber would collide mid-statement; deferring moves the check to
        # commit, where the ordering is dense again.
        UniqueConstraint(
            "session_id", "order_index", name="uq_session_exercise_order",
            deferrable=True, initially="DEFERRED",
        ),
        Index("ix_session_exercises_exercise", "session_id", "exercise_id"),
    )


class WorkoutSet(Base, TimestampMixin):
    """Every performed set is a first-class row (BRD §7)."""
    __tablename__ = "workout_sets"

    id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_exercise_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("session_exercises.id", ondelete="CASCADE"), nullable=False
    )
    set_index: Mapped[int] = mapped_column(nullable=False)           # dense, 0-based
    set_type: Mapped[SetType] = mapped_column(
        Enum(SetType, name="set_type"), default=SetType.working, nullable=False
    )

    reps: Mapped[int | None] = mapped_column()
    load_kg: Mapped[float | None] = mapped_column(Numeric(7, 2))     # canonical
    duration_seconds: Mapped[int | None] = mapped_column()
    distance_m: Mapped[float | None] = mapped_column(Numeric(9, 2))
    rpe: Mapped[float | None] = mapped_column(Numeric(3, 1))
    rir: Mapped[float | None] = mapped_column(Numeric(3, 1))
    completed: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    performed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    note: Mapped[str | None] = mapped_column(String(500))

    # What the user typed, so the display can echo their unit without re-deriving it.
    load_unit_entered: Mapped[str] = mapped_column(String(8), default="kg", nullable=False)
    # Stored WITH the formula version so history stays reproducible if the default changes.
    e1rm_kg: Mapped[float | None] = mapped_column(Numeric(7, 2))
    formula_version: Mapped[str | None] = mapped_column(String(20))
    is_pr: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # The client's idempotency key. A retried offline write lands on the same row
    # instead of creating a duplicate set.
    client_id: Mapped[uuid.UUID | None] = mapped_column(PGUUID(as_uuid=True))

    session_exercise: Mapped[SessionExercise] = relationship(back_populates="sets")

    __table_args__ = (
        # Deferred for the same reason as uq_session_exercise_order: deleting set 0
        # of three renumbers 1->0 and 2->1 in one transaction.
        UniqueConstraint(
            "session_exercise_id", "set_index", name="uq_set_index",
            deferrable=True, initially="DEFERRED",
        ),
        UniqueConstraint("session_exercise_id", "client_id", name="uq_set_client_id"),
        Index("ix_sets_performed_at", "performed_at", postgresql_where=(completed == True)),
    )


class PersonalRecord(Base, TimestampMixin):
    __tablename__ = "personal_records"

    id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    exercise_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("exercises.id", ondelete="CASCADE"), nullable=False
    )
    record_type: Mapped[RecordType] = mapped_column(Enum(RecordType, name="record_type"), nullable=False)
    value: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    unit: Mapped[str] = mapped_column(String(8), nullable=False)
    achieved_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    workout_set_id: Mapped[uuid.UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("workout_sets.id", ondelete="SET NULL")
    )

    __table_args__ = (
        UniqueConstraint("user_id", "exercise_id", "record_type", name="uq_pr_per_type"),
        Index("ix_pr_user_exercise", "user_id", "exercise_id", "record_type"),
    )
