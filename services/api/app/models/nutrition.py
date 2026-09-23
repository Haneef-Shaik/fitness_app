"""Nutrition — `foods`, `meals`, `meal_items`.

The shape is set by [02 §4.2](../../../../docs/02-SYSTEM-ARCHITECTURE.md), and two
of its invariants decide the columns:

**Item macros are snapshotted, not joined.** A `meal_item` carries its own
absolute macros. Reading them back from `foods` would mean correcting a food's
nutrition silently rewrote every meal ever logged from it — the nutrition
analogue of `target_snapshot`, and the same principle as AC-12: what happened is
frozen, what is planned may change.

**`food_id` may be NULL.** A quick-add or an AI estimate that was never resolved
to a canonical food is still a real thing someone ate. `display_name` is on the
item so such a row still has something to render, and so a later-archived food
does not blank a meal from last March.

**A food's nutrition is per 100 g. An item's is absolute.** They are different
units and they live in different tables on purpose — the one column holding both
is the trap named in G7's contract.
"""
from __future__ import annotations

import enum
import uuid
from datetime import date, datetime, time

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Time,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base
from app.models.user import TimestampMixin


class FoodSource(str, enum.Enum):
    """Where a food's numbers came from.

    `provider` exists so a third-party source can be told apart from the
    internal catalog **without** its identifier becoming the primary key —
    Q1 is still open, and the provider is an implementation detail behind the
    resolver, not the identity of the row.
    """

    internal = "internal"
    provider = "provider"
    user = "user"


#: The categories every account starts with, in order. They are *seeds*, not a
#: closed set — H-16 lets a user rename, reorder, hide and add to them, which is
#: exactly why `meals.meal_type` is a slug and not a Postgres ENUM. An enum here
#: would make "Pre-workout" a migration.
DEFAULT_MEAL_CATEGORIES: tuple[tuple[str, str], ...] = (
    ("breakfast", "Breakfast"),
    ("lunch", "Lunch"),
    ("dinner", "Dinner"),
    ("snack", "Snack"),
)


class MealCategory(Base, TimestampMixin):
    """A user's meal categories (H-16).

    **The slug is the identity, the name is a label.** Renaming "Lunch" to
    "Midday" must not orphan every lunch ever logged, so meals reference the
    slug and the name is free to change — the same reason an exercise has a
    slug, and the reason hidden categories still render in history.
    """

    __tablename__ = "meal_categories"

    id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    slug: Mapped[str] = mapped_column(String(40), nullable=False)
    name: Mapped[str] = mapped_column(String(60), nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # "Breakfast usually happens at 08:00" — a default for the logger, never a
    # constraint on when a meal may be filed.
    default_time: Mapped[time | None] = mapped_column(Time)

    # Soft delete, the same principle as exercises and programs: a category with
    # meals behind it is hidden, never removed.
    hidden: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    __table_args__ = (
        UniqueConstraint("user_id", "slug", name="uq_meal_category_slug"),
        Index("ix_meal_categories_user", "user_id", "sort_order"),
    )


class ItemSource(str, enum.Enum):
    """How the item got here. **I12** — estimated must never look confirmed, and
    that starts with the schema being able to tell them apart."""

    manual = "manual"
    text_ai = "text_ai"
    image_ai = "image_ai"


class Food(Base, TimestampMixin):
    """A canonical food. Nutrition is **per 100 g**, always (I6)."""

    __tablename__ = "foods"

    id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    # NULL = global catalog, shared and read-only to users — the same rule the
    # exercise catalog uses.
    owner_user_id: Mapped[uuid.UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE")
    )
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    brand: Mapped[str | None] = mapped_column(String(120))

    # Per 100 g. Nullable because "we do not know the fibre" is a real state and
    # is not the same as zero.
    calories: Mapped[float | None] = mapped_column(Numeric(8, 2))
    protein_g: Mapped[float | None] = mapped_column(Numeric(8, 2))
    carbs_g: Mapped[float | None] = mapped_column(Numeric(8, 2))
    fat_g: Mapped[float | None] = mapped_column(Numeric(8, 2))
    fiber_g: Mapped[float | None] = mapped_column(Numeric(8, 2))

    # A helpful default for the picker: "1 slice = 32 g". Not a second unit for
    # the nutrition columns.
    serving_grams: Mapped[float | None] = mapped_column(Numeric(8, 2))
    serving_label: Mapped[str | None] = mapped_column(String(60))

    source: Mapped[FoodSource] = mapped_column(
        Enum(FoodSource, name="food_source"), default=FoodSource.internal, nullable=False
    )
    # The provider's own id, kept as an ATTRIBUTE. Making it the primary key
    # would tie every row to a provider Q1 has not chosen yet.
    external_ref: Mapped[str | None] = mapped_column(String(120))
    archived: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    __table_args__ = (
        Index("ix_foods_name", "name"),
        Index("ix_foods_owner", "owner_user_id"),
        UniqueConstraint("source", "external_ref", name="uq_food_external_ref"),
    )


class Meal(Base, TimestampMixin):
    """One eating occasion. Filed under the user's LOCAL date (I7)."""

    __tablename__ = "meals"

    id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    # A `meal_categories.slug`, not an enum — see DEFAULT_MEAL_CATEGORIES. No FK:
    # the slug has to outlive a category being deleted, exactly as `display_name`
    # outlives a food being deleted on a meal item.
    meal_type: Mapped[str] = mapped_column(String(40), nullable=False)
    consumed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    # Resolved once, on write, exactly as a session's is. The client never
    # computes its own "today".
    local_date: Mapped[date] = mapped_column(Date, nullable=False)
    logged_timezone: Mapped[str] = mapped_column(String(64), nullable=False)

    notes: Mapped[str | None] = mapped_column(String(500))

    # I8 — idempotency on a client-generated key, the same contract sets use.
    client_id: Mapped[uuid.UUID | None] = mapped_column(PGUUID(as_uuid=True))

    items: Mapped[list[MealItem]] = relationship(
        back_populates="meal", cascade="all, delete-orphan", order_by="MealItem.created_at"
    )

    __table_args__ = (
        Index("ix_meals_user_local_date", "user_id", "local_date"),
        UniqueConstraint("user_id", "client_id", name="uq_meal_client_id"),
    )


class MealItem(Base, TimestampMixin):
    """One food in one meal, with its macros **snapshotted**."""

    __tablename__ = "meal_items"

    id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    meal_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("meals.id", ondelete="CASCADE"), nullable=False
    )
    # NULL is legitimate: a quick-add or an unresolved estimate. SET NULL rather
    # than CASCADE, so deleting a food never deletes what somebody ate.
    food_id: Mapped[uuid.UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("foods.id", ondelete="SET NULL")
    )
    # Survives an unresolved food and a later-archived one.
    display_name: Mapped[str] = mapped_column(String(160), nullable=False)

    quantity_grams: Mapped[float | None] = mapped_column(Numeric(9, 2))

    # ABSOLUTE macros for this quantity, frozen at write. Never per 100 g, and
    # never recomputed from `foods` on read (02 §4.2 invariant 4).
    calories: Mapped[float | None] = mapped_column(Numeric(9, 2))
    protein_g: Mapped[float | None] = mapped_column(Numeric(8, 2))
    carbs_g: Mapped[float | None] = mapped_column(Numeric(8, 2))
    fat_g: Mapped[float | None] = mapped_column(Numeric(8, 2))
    fiber_g: Mapped[float | None] = mapped_column(Numeric(8, 2))

    # I2 / D5 — only confirmed items reach a total. Defaults TRUE because a
    # manual entry is confirmed by the act of typing it; G8's estimates arrive
    # false.
    confirmed: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    user_corrected: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    source: Mapped[ItemSource] = mapped_column(
        Enum(ItemSource, name="item_source"), default=ItemSource.manual, nullable=False
    )

    # Provenance back to the raw AI row. G7 left this as a bare UUID because
    # `food_analysis_items` did not exist yet; G8 built it and added the FK.
    # RESTRICT, not CASCADE: the analysis row is append-only and must never be
    # deleted, so a meal item can safely point at it forever.
    analysis_item_id: Mapped[uuid.UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("food_analysis_items.id", ondelete="RESTRICT")
    )

    client_id: Mapped[uuid.UUID | None] = mapped_column(PGUUID(as_uuid=True))

    meal: Mapped[Meal] = relationship(back_populates="items")

    __table_args__ = (
        Index("ix_meal_items_meal", "meal_id"),
        # Partial on `confirmed`: every total filters on it, so the index that
        # serves those reads carries only the rows they can see.
        Index("ix_meal_items_confirmed", "meal_id", postgresql_where=(confirmed == True)),
        UniqueConstraint("meal_id", "client_id", name="uq_meal_item_client_id"),
    )
