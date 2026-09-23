"""Recipes and saved meals (H-11).

**A recipe is a plan; a meal is a fact.** Reading a recipe computes its macros
from the *current* foods, so correcting a food updates what the recipe will
produce next time. Logging one snapshots those macros onto `meal_items`, so
what it already produced never moves. Editing a recipe therefore changes the
future and nothing else — the same rule as `target_snapshot`, one level up.
"""
from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Header
from sqlalchemy import or_, select
from sqlalchemy.orm import selectinload

from app.api.deps import CurrentUser, DbSession
from app.api.envelope import ok
from app.core.errors import NotFound, ValidationFailed
from app.domain.dates import to_local_date
from app.food.categories import assert_category
from app.food.snapshot import num, scale_absolute, snapshot_from_food
from app.models import Food, ItemSource, Meal, MealItem, Recipe, RecipeItem, UserProfile
from app.schemas.envelope import Envelope
from app.schemas.nutrition import MealOut
from app.schemas.recipe import (
    MacrosOut,
    RecipeIn,
    RecipeItemOut,
    RecipeLogIn,
    RecipeOut,
    RecipePatch,
)
from app.services import summaries

router = APIRouter(tags=["nutrition"])

MACRO_KEYS = ("calories", "protein_g", "carbs_g", "fat_g")


async def _foods_for(db: DbSession, user_id: uuid.UUID, ids: list[uuid.UUID]) -> dict:
    if not ids:
        return {}
    rows = (await db.scalars(
        select(Food).where(
            Food.id.in_(ids),
            or_(Food.owner_user_id.is_(None), Food.owner_user_id == user_id),
        )
    )).all()
    return {f.id: f for f in rows}


def _item_macros(item: RecipeItem, food: Food | None) -> dict:
    """The whole-batch macros for one ingredient.

    With a food behind it, they are derived live — a recipe is a plan, so a
    corrected food SHOULD change what it will make. Without one, the stored
    absolute figures are the source.
    """
    if food is not None:
        grams = float(item.quantity_grams) if item.quantity_grams is not None else 100.0
        snap = snapshot_from_food(food, grams)
        return {k: snap[k] for k in MACRO_KEYS}
    return {k: num(getattr(item, k)) for k in MACRO_KEYS}


def _per_serving(items: list[RecipeItem], foods: dict, servings: float) -> MacrosOut:
    totals: dict[str, float | None] = dict.fromkeys(MACRO_KEYS, 0.0)
    for item in items:
        macros = _item_macros(item, foods.get(item.food_id) if item.food_id else None)
        for key in MACRO_KEYS:
            value, running = macros[key], totals[key]
            if value is None or running is None:
                # "We do not know" must not silently become zero (I13's cousin).
                totals[key] = None
            else:
                totals[key] = running + value

    divisor = servings if servings > 0 else 1.0
    return MacrosOut(**{
        k: (None if totals[k] is None else totals[k] / divisor) for k in MACRO_KEYS
    })


def _item_out(item: RecipeItem, food: Food | None) -> RecipeItemOut:
    macros = _item_macros(item, food)
    return RecipeItemOut(
        id=item.id, food_id=item.food_id, display_name=item.display_name,
        quantity_grams=num(item.quantity_grams), **macros,
    )


async def _out(db: DbSession, user_id: uuid.UUID, recipe: Recipe) -> dict:
    foods = await _foods_for(
        db, user_id, [i.food_id for i in recipe.items if i.food_id is not None]
    )
    return RecipeOut(
        id=recipe.id, name=recipe.name, servings=float(recipe.servings),
        notes=recipe.notes,
        items=[_item_out(i, foods.get(i.food_id) if i.food_id else None) for i in recipe.items],
        per_serving=_per_serving(list(recipe.items), foods, float(recipe.servings)),
    ).model_dump(mode="json")


async def _mine(db: DbSession, user_id: uuid.UUID, recipe_id: uuid.UUID) -> Recipe:
    recipe = await db.scalar(
        select(Recipe)
        .where(Recipe.id == recipe_id, Recipe.user_id == user_id, Recipe.archived.is_(False))
        .options(selectinload(Recipe.items))
    )
    if recipe is None:
        raise NotFound("That recipe no longer exists.")
    return recipe


async def _write_items(db: DbSession, user_id: uuid.UUID, recipe: Recipe, items_in) -> None:
    ids = [i.food_id for i in items_in if i.food_id is not None]
    foods = await _foods_for(db, user_id, ids)
    if missing := [i for i in ids if i not in foods]:
        raise ValidationFailed(
            "One of those foods does not exist.", fields={"items": str(missing[0])},
        )

    for order, item_in in enumerate(items_in):
        food = foods.get(item_in.food_id) if item_in.food_id else None
        db.add(RecipeItem(
            recipe_id=recipe.id,
            food_id=item_in.food_id,
            display_name=(item_in.display_name or (food.name if food else "")).strip(),
            quantity_grams=item_in.quantity_grams,
            calories=None if food else item_in.calories,
            protein_g=None if food else item_in.protein_g,
            carbs_g=None if food else item_in.carbs_g,
            fat_g=None if food else item_in.fat_g,
            sort_order=order,
        ))


@router.get("/recipes", response_model=Envelope[list[RecipeOut]])
async def list_recipes(user: CurrentUser, db: DbSession):
    recipes = (await db.scalars(
        select(Recipe)
        .where(Recipe.user_id == user.id, Recipe.archived.is_(False))
        .options(selectinload(Recipe.items))
        .order_by(Recipe.name)
    )).all()
    return ok([await _out(db, user.id, r) for r in recipes])


@router.post("/recipes", status_code=201, response_model=Envelope[RecipeOut])
async def create_recipe(body: RecipeIn, user: CurrentUser, db: DbSession):
    recipe = Recipe(
        user_id=user.id, name=body.name.strip(),
        servings=body.servings, notes=body.notes,
    )
    db.add(recipe)
    await db.flush()
    await _write_items(db, user.id, recipe, body.items)
    await db.flush()

    fresh = await _mine(db, user.id, recipe.id)
    return ok(await _out(db, user.id, fresh), status_code=201)


@router.get("/recipes/{recipe_id}", response_model=Envelope[RecipeOut])
async def get_recipe(recipe_id: uuid.UUID, user: CurrentUser, db: DbSession):
    return ok(await _out(db, user.id, await _mine(db, user.id, recipe_id)))


@router.patch("/recipes/{recipe_id}", response_model=Envelope[RecipeOut])
async def patch_recipe(
    recipe_id: uuid.UUID, body: RecipePatch, user: CurrentUser, db: DbSession,
):
    """Edits the plan. Meals already logged from it do not move — they hold
    their own snapshot and nothing here touches `meal_items`."""
    recipe = await _mine(db, user.id, recipe_id)
    changes = body.model_dump(exclude_unset=True)

    if "name" in changes:
        recipe.name = str(changes["name"]).strip()
    if "servings" in changes:
        recipe.servings = changes["servings"]
    if "notes" in changes:
        recipe.notes = changes["notes"]

    if body.items is not None:
        # Wholesale replacement: a merge could not express "remove the honey".
        for existing in list(recipe.items):
            await db.delete(existing)
        await db.flush()
        await _write_items(db, user.id, recipe, body.items)

    await db.flush()
    fresh = await db.scalar(
        select(Recipe).where(Recipe.id == recipe.id)
        .options(selectinload(Recipe.items))
        .execution_options(populate_existing=True)
    )
    return ok(await _out(db, user.id, fresh))


@router.delete("/recipes/{recipe_id}", response_model=Envelope[RecipeOut])
async def delete_recipe(recipe_id: uuid.UUID, user: CurrentUser, db: DbSession):
    """Archives rather than deletes — a meal logged from it keeps its own
    macros either way, but the recipe list is a place people go looking."""
    recipe = await _mine(db, user.id, recipe_id)
    out = await _out(db, user.id, recipe)
    recipe.archived = True
    await db.flush()
    return ok(out)


@router.post("/recipes/{recipe_id}/log", status_code=201, response_model=Envelope[MealOut])
async def log_recipe(
    recipe_id: uuid.UUID,
    body: RecipeLogIn,
    user: CurrentUser,
    db: DbSession,
    idempotency_key: Annotated[uuid.UUID | None, Header(alias="Idempotency-Key")] = None,
):
    """Adds every ingredient to a meal, scaled by servings, **snapshotted**.

    Idempotent on `client_id` (**I8**) like every other meal write, because this
    rides the same outbox.
    """
    from app.api.routes.nutrition import meal_out  # local: avoids a route-module cycle

    recipe = await _mine(db, user.id, recipe_id)
    await assert_category(db, user.id, body.meal_type)

    if body.client_id is not None:
        existing = await db.scalar(
            select(Meal)
            .where(Meal.user_id == user.id, Meal.client_id == body.client_id)
            .options(selectinload(Meal.items))
        )
        if existing is not None:
            return ok(meal_out(existing), status_code=201)

    tz = await db.scalar(
        select(UserProfile.timezone).where(UserProfile.user_id == user.id)
    ) or "UTC"
    consumed_at = datetime.fromisoformat(body.consumed_at) if body.consumed_at else datetime.now(UTC)
    if consumed_at.tzinfo is None:
        consumed_at = consumed_at.replace(tzinfo=UTC)

    meal = Meal(
        user_id=user.id, meal_type=body.meal_type, consumed_at=consumed_at,
        local_date=to_local_date(consumed_at, tz), logged_timezone=tz,
        notes=recipe.name, client_id=body.client_id,
    )
    db.add(meal)
    await db.flush()

    # One batch makes `recipe.servings`; the caller wants `body.servings` of them.
    factor = float(body.servings) / float(recipe.servings or 1)
    foods = await _foods_for(
        db, user.id, [i.food_id for i in recipe.items if i.food_id is not None]
    )

    for item in recipe.items:
        food = foods.get(item.food_id) if item.food_id else None
        grams = float(item.quantity_grams) * factor if item.quantity_grams is not None else None
        if food is not None:
            macros = snapshot_from_food(food, grams if grams is not None else 100.0)
        else:
            # Recipe items carry no fibre — there is no column for it, and
            # inventing a zero would make "unknown" look like "none".
            macros = scale_absolute({k: getattr(item, k) for k in MACRO_KEYS}, factor)
            macros["fiber_g"] = None

        db.add(MealItem(
            meal_id=meal.id, food_id=item.food_id, display_name=item.display_name,
            quantity_grams=grams,
            confirmed=True, source=ItemSource.manual,
            **macros,
        ))

    await summaries.invalidate(db, user.id, meal.local_date)
    await db.flush()
    fresh = await db.scalar(
        select(Meal).where(Meal.id == meal.id).options(selectinload(Meal.items))
        .execution_options(populate_existing=True)
    )
    return ok(meal_out(fresh), status_code=201)
