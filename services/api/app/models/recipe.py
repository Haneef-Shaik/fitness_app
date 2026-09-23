"""Recipes and saved meals (H-11).

**A recipe is a plan, a meal is a fact.** That one distinction decides every
column here:

A recipe item references a *live* food and stores no macros of its own. Correct
a food's nutrition and the recipe's preview updates — which is right, because a
recipe is a thing you are going to cook. Logging it snapshots the numbers onto
`meal_items` (02 §4.2 inv. 4), and from that moment they are frozen. So editing
a recipe changes what it will produce next time and nothing about what it
already produced.

This is AC-12 / I1 again, one level up from foods: what happened is frozen, what
is planned may change.
"""
from __future__ import annotations

import uuid

from sqlalchemy import Boolean, ForeignKey, Index, Integer, Numeric, String
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base
from app.models.user import TimestampMixin


class Recipe(Base, TimestampMixin):
    __tablename__ = "recipes"

    id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(160), nullable=False)

    # How many portions the listed quantities make. Everything the UI shows is
    # PER SERVING, so a batch recipe does not read as one terrifying meal.
    servings: Mapped[float] = mapped_column(Numeric(6, 2), default=1, nullable=False)

    notes: Mapped[str | None] = mapped_column(String(500))
    archived: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    items: Mapped[list[RecipeItem]] = relationship(
        back_populates="recipe", cascade="all, delete-orphan", order_by="RecipeItem.sort_order"
    )

    __table_args__ = (Index("ix_recipes_user", "user_id", "archived"),)


class RecipeItem(Base, TimestampMixin):
    """One ingredient. No macro columns on purpose — see the module docstring."""

    __tablename__ = "recipe_items"

    id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    recipe_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("recipes.id", ondelete="CASCADE"), nullable=False
    )
    # NULL for a free-text ingredient, which then carries its own macros below —
    # the recipe equivalent of a quick-add.
    food_id: Mapped[uuid.UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("foods.id", ondelete="SET NULL")
    )
    display_name: Mapped[str] = mapped_column(String(160), nullable=False)
    quantity_grams: Mapped[float | None] = mapped_column(Numeric(9, 2))

    # Used ONLY when `food_id` is NULL. Absolute, for the whole batch.
    calories: Mapped[float | None] = mapped_column(Numeric(9, 2))
    protein_g: Mapped[float | None] = mapped_column(Numeric(8, 2))
    carbs_g: Mapped[float | None] = mapped_column(Numeric(8, 2))
    fat_g: Mapped[float | None] = mapped_column(Numeric(8, 2))

    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    recipe: Mapped[Recipe] = relationship(back_populates="items")

    __table_args__ = (Index("ix_recipe_items_recipe", "recipe_id", "sort_order"),)
