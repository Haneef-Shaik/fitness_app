"""Exercise catalog. Global entries have owner_user_id NULL; custom ones belong to a user."""
from __future__ import annotations

import enum
import uuid

from sqlalchemy import Boolean, Enum, ForeignKey, Index, String
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base
from app.models.user import TimestampMixin


class Equipment(str, enum.Enum):
    barbell = "barbell"
    dumbbell = "dumbbell"
    machine = "machine"
    cable = "cable"
    bodyweight = "bodyweight"
    band = "band"
    kettlebell = "kettlebell"
    other = "other"


class CatalogStatus(str, enum.Enum):
    active = "active"
    archived = "archived"


class MuscleRole(str, enum.Enum):
    primary = "primary"
    secondary = "secondary"


class MuscleGroup(Base, TimestampMixin):
    __tablename__ = "muscle_groups"

    id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(60), unique=True, nullable=False)
    slug: Mapped[str] = mapped_column(String(60), unique=True, nullable=False)
    # Optional hierarchy: Chest -> Upper Chest. "Previous chest day" includes descendants.
    parent_id: Mapped[uuid.UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("muscle_groups.id", ondelete="SET NULL")
    )
    sort_order: Mapped[int] = mapped_column(default=0, nullable=False)

    children: Mapped[list[MuscleGroup]] = relationship(remote_side=[parent_id], uselist=True)


class Exercise(Base, TimestampMixin):
    __tablename__ = "exercises"

    id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    # NULL = global catalog entry, shared by everyone and read-only to users.
    owner_user_id: Mapped[uuid.UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE")
    )
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    equipment: Mapped[Equipment] = mapped_column(
        Enum(Equipment, name="equipment"), default=Equipment.other, nullable=False
    )
    movement_pattern: Mapped[str | None] = mapped_column(String(60))
    aliases: Mapped[list[str]] = mapped_column(ARRAY(String(80)), default=list, nullable=False)
    is_custom: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    status: Mapped[CatalogStatus] = mapped_column(
        Enum(CatalogStatus, name="catalog_status"), default=CatalogStatus.active, nullable=False
    )

    # Which fields the logger offers. A cardio or bodyweight exercise must not demand
    # a load, and its PR types follow from this too (W04.8).
    tracks_load: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    tracks_reps: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    tracks_duration: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    tracks_distance: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    default_unit: Mapped[str] = mapped_column(String(8), default="kg", nullable=False)

    muscles: Mapped[list[ExerciseMuscle]] = relationship(
        back_populates="exercise", cascade="all, delete-orphan", lazy="selectin"
    )

    __table_args__ = (
        Index("ix_exercises_owner_status", "owner_user_id", "status"),
        Index("ix_exercises_name", "name"),
    )


class ExerciseMuscle(Base):
    """M:M exercise <-> muscle group, carrying the primary/secondary role.

    Volume weighting reads this: primary 1.0, secondary 0.5 (decision D7).
    """
    __tablename__ = "exercise_muscles"

    exercise_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("exercises.id", ondelete="CASCADE"), primary_key=True
    )
    muscle_group_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("muscle_groups.id", ondelete="CASCADE"), primary_key=True
    )
    role: Mapped[MuscleRole] = mapped_column(Enum(MuscleRole, name="muscle_role"), nullable=False)

    exercise: Mapped[Exercise] = relationship(back_populates="muscles")
    muscle_group: Mapped[MuscleGroup] = relationship(lazy="joined")

    # (exercise_id, muscle_group_id) is already the composite primary key, so a
    # separate UniqueConstraint would be redundant — `alembic check` flags it.
    __table_args__ = (
        # Drives the "previous chest day" lookup and muscle-volume analytics.
        Index("ix_exercise_muscles_group_role", "muscle_group_id", "role", "exercise_id"),
    )
