"""M1 tables. Field additions beyond BRD §9 are documented in docs/02 §6."""
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
    func,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


def _uuid_pk() -> Mapped[uuid.UUID]:
    return mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)


class UserStatus(str, enum.Enum):
    active = "active"
    disabled = "disabled"
    deleted = "deleted"


class UnitSystem(str, enum.Enum):
    metric = "metric"
    imperial = "imperial"


class ActivityLevel(str, enum.Enum):
    sedentary = "sedentary"
    light = "light"
    moderate = "moderate"
    very = "very"
    extra = "extra"


class GoalType(str, enum.Enum):
    fat_loss = "fat_loss"
    muscle_gain = "muscle_gain"
    maintenance = "maintenance"
    strength = "strength"
    custom = "custom"


class GoalStatus(str, enum.Enum):
    active = "active"
    completed = "completed"
    paused = "paused"


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )


class User(Base, TimestampMixin):
    """FitLog's account. `id` is Supabase Auth's `auth.users.id` and the row is
    created on the first signed-in request (docs/14, S1). Passwords, sessions and
    email verification are Supabase's; `email` follows the sign-in's address."""

    __tablename__ = "users"

    id: Mapped[uuid.UUID] = _uuid_pk()
    email: Mapped[str] = mapped_column(String(254), unique=True, nullable=False, index=True)
    status: Mapped[UserStatus] = mapped_column(
        Enum(UserStatus, name="user_status"), default=UserStatus.active, nullable=False
    )
    # Soft delete with a grace period — BRD §18 right to delete.
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    profile: Mapped[UserProfile | None] = relationship(
        back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    goals: Mapped[list[FitnessGoal]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )


class UserProfile(Base, TimestampMixin):
    """One profile per user. Canonical units only: height in cm."""
    __tablename__ = "user_profiles"

    user_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    display_name: Mapped[str | None] = mapped_column(String(80))
    height_cm: Mapped[float | None] = mapped_column(Numeric(5, 1))
    birth_date: Mapped[date | None] = mapped_column(Date)
    sex: Mapped[str | None] = mapped_column(String(20))

    preferred_unit_system: Mapped[UnitSystem] = mapped_column(
        Enum(UnitSystem, name="unit_system"), default=UnitSystem.metric, nullable=False
    )
    # Decides which day a workout or meal belongs to. Everything downstream depends on it.
    timezone: Mapped[str] = mapped_column(String(64), default="UTC", nullable=False)
    week_starts_on: Mapped[int] = mapped_column(default=1, nullable=False)  # 0 Sun, 1 Mon, 6 Sat
    activity_level: Mapped[ActivityLevel] = mapped_column(
        Enum(ActivityLevel, name="activity_level"), default=ActivityLevel.moderate, nullable=False
    )

    daily_calorie_target: Mapped[int | None] = mapped_column()
    protein_g_target: Mapped[int | None] = mapped_column()
    carbs_g_target: Mapped[int | None] = mapped_column()
    fat_g_target: Mapped[int | None] = mapped_column()

    onboarding_completed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # The training profile (onboarding step 5). What a program recommendation
    # depends on; all optional, because every onboarding step but units is.
    training_experience: Mapped[str | None] = mapped_column(String(20))   # beginner|intermediate|advanced
    training_days_per_week: Mapped[int | None] = mapped_column()
    session_minutes: Mapped[int | None] = mapped_column()
    equipment: Mapped[str | None] = mapped_column(String(20))             # full_gym|home_gym|dumbbells|bodyweight
    # How often a check-in (weight + measurements) is due. Weekly unless changed.
    checkin_interval_days: Mapped[int] = mapped_column(default=7, server_default="7", nullable=False)

    # K-04 · logging preferences. D6: warm-ups are left out of volume unless the
    # user counts them; flipping this recounts stored totals (services.volume).
    warmups_in_volume: Mapped[bool] = mapped_column(
        Boolean, default=False, server_default="false", nullable=False
    )
    show_rpe: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false", nullable=False)
    show_rir: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false", nullable=False)
    # Used when a plan gives no rest of its own. Null: no timer unless planned.
    default_rest_seconds: Mapped[int | None] = mapped_column()
    load_step_kg: Mapped[float] = mapped_column(
        Numeric(4, 2), default=2.5, server_default="2.5", nullable=False
    )
    # E-12's plate calculator. Null inventory means the standard metric set.
    bar_weight_kg: Mapped[float] = mapped_column(
        Numeric(5, 2), default=20, server_default="20", nullable=False
    )
    plate_inventory_kg: Mapped[list[float] | None] = mapped_column(JSONB)

    user: Mapped[User] = relationship(back_populates="profile")


class CalorieTarget(Base):
    """Q8 — targets are versioned: a row per day the targets changed (G10).

    H-15 promises "your past days keep the numbers they had". With the target
    one column on the profile, changing it rewrote every past day's meter. The
    profile keeps the CURRENT targets (every existing reader is unchanged); this
    table is what a past day is judged against — the latest row on or before it.
    One row per day: changing twice in a day keeps the last.
    """

    __tablename__ = "calorie_targets"

    user_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    #: The profile's local date the change was made on (I7).
    effective_from: Mapped[date] = mapped_column(Date, primary_key=True)
    calories: Mapped[int | None] = mapped_column()
    protein_g: Mapped[int | None] = mapped_column()
    carbs_g: Mapped[int | None] = mapped_column()
    fat_g: Mapped[int | None] = mapped_column()
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class FitnessGoal(Base, TimestampMixin):
    __tablename__ = "fitness_goals"

    id: Mapped[uuid.UUID] = _uuid_pk()
    user_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    goal_type: Mapped[GoalType] = mapped_column(Enum(GoalType, name="goal_type"), nullable=False)
    # P02.4 — progress needs to know WHICH metric a goal tracks.
    metric_key: Mapped[str] = mapped_column(String(40), default="body_weight", nullable=False)
    direction: Mapped[str] = mapped_column(String(10), default="down", nullable=False)

    start_value: Mapped[float | None] = mapped_column(Numeric(8, 2))
    target_value: Mapped[float] = mapped_column(Numeric(8, 2), nullable=False)
    target_unit: Mapped[str] = mapped_column(String(16), default="kg", nullable=False)

    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    target_date: Mapped[date | None] = mapped_column(Date)
    # The pace the user chose, in target units per week (always positive; the
    # direction says which way). Drives the calorie adjustment and the ETA.
    weekly_rate: Mapped[float | None] = mapped_column(Numeric(5, 2))
    status: Mapped[GoalStatus] = mapped_column(
        Enum(GoalStatus, name="goal_status"), default=GoalStatus.active, nullable=False
    )
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    user: Mapped[User] = relationship(back_populates="goals")

    __table_args__ = (Index("ix_goals_user_status", "user_id", "status"),)
