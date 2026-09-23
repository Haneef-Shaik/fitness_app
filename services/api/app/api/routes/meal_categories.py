"""Meal categories (H-16).

**The slug is identity, the name is a label.** Meals reference the slug, so
renaming a category is free and deleting one is not — a category with meals
behind it can only be hidden, the same soft-delete principle exercises and
programs use. Hidden categories still render in history, because the meal
carries the slug and the label is looked up, not stored.
"""
from __future__ import annotations

import uuid
from datetime import time

from fastapi import APIRouter
from sqlalchemy import func, select

from app.api.deps import CurrentUser, DbSession
from app.api.envelope import ok
from app.core.errors import Conflict, NotFound, ValidationFailed
from app.domain.slug import slugify
from app.food.categories import ensure_categories
from app.models import Meal, MealCategory
from app.schemas.envelope import Envelope
from app.schemas.nutrition import (
    CategoryOrderIn,
    MealCategoryIn,
    MealCategoryOut,
    MealCategoryPatch,
)

router = APIRouter(tags=["nutrition"])


def _parse_time(value: str | None) -> time | None:
    if value is None:
        return None
    try:
        hours, minutes = (int(part) for part in value.split(":"))
        return time(hours, minutes)
    except (ValueError, TypeError) as exc:
        raise ValidationFailed(
            "A default time looks like 07:30.", fields={"default_time": value},
        ) from exc


def _out(category: MealCategory) -> dict:
    return MealCategoryOut(
        id=category.id, slug=category.slug, name=category.name,
        sort_order=category.sort_order,
        default_time=category.default_time.strftime("%H:%M") if category.default_time else None,
        hidden=category.hidden, is_default=category.is_default,
    ).model_dump(mode="json")


async def _mine(db: DbSession, user_id: uuid.UUID, category_id: uuid.UUID) -> MealCategory:
    category = await db.scalar(
        select(MealCategory).where(
            MealCategory.id == category_id, MealCategory.user_id == user_id,
        )
    )
    if category is None:
        raise NotFound("That category no longer exists.")
    return category


@router.get("/meal-categories", response_model=Envelope[list[MealCategoryOut]])
async def list_categories(user: CurrentUser, db: DbSession):
    """Every category, hidden ones included — the manager has to show what it
    would be un-hiding. The logger filters; this does not."""
    return ok([_out(c) for c in await ensure_categories(db, user.id)])


@router.post("/meal-categories", status_code=201, response_model=Envelope[MealCategoryOut])
async def create_category(body: MealCategoryIn, user: CurrentUser, db: DbSession):
    existing = await ensure_categories(db, user.id)
    slug = slugify(body.name)
    if not slug:
        raise ValidationFailed(
            "A category needs a name with letters in it.", fields={"name": body.name},
        )
    if any(c.slug == slug for c in existing):
        # "Pre workout" and "Pre-workout" are the same category. Letting both
        # exist is how a diary ends up with two half-filled rows.
        raise ValidationFailed(
            "You already have a category with that name.", fields={"name": body.name},
        )

    category = MealCategory(
        user_id=user.id, slug=slug, name=body.name.strip(),
        sort_order=max((c.sort_order for c in existing), default=-1) + 1,
        default_time=_parse_time(body.default_time),
        hidden=False, is_default=False,
    )
    db.add(category)
    await db.flush()
    return ok(_out(category), status_code=201)


@router.patch("/meal-categories/{category_id}", response_model=Envelope[MealCategoryOut])
async def patch_category(
    category_id: uuid.UUID, body: MealCategoryPatch, user: CurrentUser, db: DbSession,
):
    """Renames, retimes and hides. **Never re-slugs** — see the module docstring."""
    category = await _mine(db, user.id, category_id)
    changes = body.model_dump(exclude_unset=True)

    if "name" in changes:
        category.name = str(changes["name"]).strip()
    if "default_time" in changes:
        category.default_time = _parse_time(changes["default_time"])
    if "hidden" in changes:
        category.hidden = bool(changes["hidden"])

    await db.flush()
    return ok(_out(category))


@router.post("/meal-categories/reorder", response_model=Envelope[list[MealCategoryOut]])
async def reorder_categories(body: CategoryOrderIn, user: CurrentUser, db: DbSession):
    categories = await ensure_categories(db, user.id)
    known = {c.id: c for c in categories}

    if set(body.ids) != set(known) or len(body.ids) != len(known):
        # A partial list would leave the omitted ones at arbitrary positions,
        # which reads as corruption the next time the screen opens.
        raise ValidationFailed(
            "Send every category, in the order you want them.",
            fields={"ids": f"expected {len(known)}, got {len(body.ids)}"},
        )

    for order, category_id in enumerate(body.ids):
        known[category_id].sort_order = order
    await db.flush()

    return ok([_out(known[i]) for i in body.ids])


@router.delete("/meal-categories/{category_id}", response_model=Envelope[MealCategoryOut])
async def delete_category(category_id: uuid.UUID, user: CurrentUser, db: DbSession):
    """Deletes an unused category. A used one is a 409 telling you to hide it.

    Deleting a category with meals behind it would leave those meals pointing at
    a slug nothing can name — the diary would render them, but the manager could
    never bring the label back.
    """
    category = await _mine(db, user.id, category_id)

    used = await db.scalar(
        select(func.count()).select_from(Meal)
        .where(Meal.user_id == user.id, Meal.meal_type == category.slug)
    )
    if used:
        raise Conflict(
            f"{category.name} has {used} meal{'s' if used != 1 else ''} in it. "
            "Hide it instead — the meals keep their label.",
        )

    out = _out(category)
    await db.delete(category)
    await db.flush()
    return ok(out)
