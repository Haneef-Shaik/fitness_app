"""The PLAN tree. Editing anything here never touches a logged session (AC-12)."""
from __future__ import annotations

import enum
import uuid

from sqlalchemy import Enum, ForeignKey, Index, Numeric, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base
from app.models.user import TimestampMixin


class ProgramStatus(str, enum.Enum):
    active = "active"
    archived = "archived"


class WorkoutProgram(Base, TimestampMixin):
    __tablename__ = "workout_programs"

    id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(80), nullable=False)
    description: Mapped[str | None] = mapped_column(String(500))
    status: Mapped[ProgramStatus] = mapped_column(
        Enum(ProgramStatus, name="program_status"), default=ProgramStatus.active, nullable=False
    )

    days: Mapped[list[WorkoutPlanDay]] = relationship(
        back_populates="program", cascade="all, delete-orphan",
        order_by="WorkoutPlanDay.day_index", lazy="selectin",
    )

    __table_args__ = (Index("ix_programs_user_status", "user_id", "status"),)


class WorkoutPlanDay(Base, TimestampMixin):
    __tablename__ = "workout_plan_days"

    id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    program_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("workout_programs.id", ondelete="CASCADE"), nullable=False
    )
    day_index: Mapped[int] = mapped_column(nullable=False)          # dense, 0-based
    name: Mapped[str] = mapped_column(String(80), nullable=False)
    scheduled_weekday: Mapped[int | None] = mapped_column()          # 0=Mon … 6=Sun, NULL = unscheduled
    notes: Mapped[str | None] = mapped_column(String(2000))

    program: Mapped[WorkoutProgram] = relationship(back_populates="days")
    exercises: Mapped[list[PlanExercise]] = relationship(
        back_populates="plan_day", cascade="all, delete-orphan",
        order_by="PlanExercise.order_index", lazy="selectin",
    )

    __table_args__ = (
        # Deferred: deleting a day renumbers the ones after it through values their
        # neighbours still hold until the transaction settles.
        UniqueConstraint(
            "program_id", "day_index", name="uq_plan_day_index",
            deferrable=True, initially="DEFERRED",
        ),
        Index("ix_plan_days_weekday", "program_id", "scheduled_weekday"),
    )


class PlanExercise(Base, TimestampMixin):
    """A prescription, not a performance. The same exercise may appear twice in a day."""
    __tablename__ = "plan_exercises"

    id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    plan_day_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("workout_plan_days.id", ondelete="CASCADE"), nullable=False
    )
    exercise_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("exercises.id", ondelete="RESTRICT"), nullable=False
    )
    order_index: Mapped[int] = mapped_column(nullable=False)         # dense, 0-based
    target_sets: Mapped[int | None] = mapped_column()
    target_reps_min: Mapped[int | None] = mapped_column()
    target_reps_max: Mapped[int | None] = mapped_column()
    target_load: Mapped[float | None] = mapped_column(Numeric(7, 2))
    load_unit: Mapped[str] = mapped_column(String(8), default="kg", nullable=False)
    # A plank has no reps and a run has no load, so a prescription that can only
    # express sets×reps@load cannot describe them. Canonical units: seconds, metres.
    target_duration_seconds: Mapped[int | None] = mapped_column()
    target_distance_m: Mapped[float | None] = mapped_column(Numeric(10, 2))
    rest_seconds: Mapped[int | None] = mapped_column()
    # E-13 — exercises of one day sharing a number are a superset (or a circuit,
    # with three or more). The logger alternates between them and rests after
    # the round, not after each exercise.
    superset_group: Mapped[int | None] = mapped_column()

    plan_day: Mapped[WorkoutPlanDay] = relationship(back_populates="exercises")

    __table_args__ = (Index("ix_plan_exercises_day_order", "plan_day_id", "order_index"),)
