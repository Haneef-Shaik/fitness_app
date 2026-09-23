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
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = _uuid_pk()
    email: Mapped[str] = mapped_column(String(254), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[UserStatus] = mapped_column(
        Enum(UserStatus, name="user_status"), default=UserStatus.active, nullable=False
    )
    email_verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
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

    user: Mapped[User] = relationship(back_populates="profile")


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


class RefreshToken(Base, TimestampMixin):
    """Rotating refresh tokens with reuse detection (BRD §18).

    Native apps cannot use an httpOnly cookie, so the token lives in the device
    keychain. Rotation + family revocation is what replaces the cookie's protection.
    """
    __tablename__ = "refresh_tokens"

    id: Mapped[uuid.UUID] = _uuid_pk()
    user_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    token_hash: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    family_id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), nullable=False, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    device_label: Mapped[str | None] = mapped_column(String(80))
