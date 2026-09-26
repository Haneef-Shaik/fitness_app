"""The food resolution ladder (02 §5.2).

The rule the tests below are really about: **a wrong match is worse than no
match.** An unresolved item keeps the model's own macros and says so; a
confidently wrong one silently swaps somebody else's recipe for the meal that
was actually eaten, and nothing downstream will ever question it.
"""
from __future__ import annotations

import pytest
from sqlalchemy import select

from app.food.internal import InternalCatalogResolver
from app.food.ladder import candidate_queries, normalise, resolve_detected_name
from app.models import Food, User

pytestmark = pytest.mark.asyncio


class TestNormalisation:
    def test_it_drops_quantities_and_filler(self):
        assert normalise("a bowl of dal") == "dal"
        assert normalise("200g chicken curry") == "chicken curry"
        assert normalise("2 eggs") == "eggs"

    def test_it_drops_punctuation(self):
        assert normalise("Chicken Breast, skinless") == "chicken breast skinless"

    def test_a_name_that_is_only_filler_normalises_to_nothing(self):
        assert normalise("a large bowl of") == ""


class TestRungs:
    def test_it_tries_the_name_as_given_first(self):
        assert candidate_queries("Whole Egg")[0] == "Whole Egg"

    def test_it_singularises(self):
        assert "egg" in candidate_queries("2 eggs")
        assert "roti" in candidate_queries("3 rotis")

    def test_it_tries_each_word_longest_first(self):
        rungs = candidate_queries("Chicken Breast, skinless")
        # "skinless" is the longest word; "chicken" is the one that matters, so
        # both are tried rather than one being picked.
        assert rungs.index("skinless") < rungs.index("chicken")
        assert "breast" in rungs

    def test_it_never_offers_a_rung_short_enough_to_match_everything(self):
        # "Nani's Sunday curry" leaves a stray "s" once punctuation is dropped.
        # A LIKE on "s" matches most of the catalog.
        assert all(len(r) >= 3 for r in candidate_queries("Nani's Sunday curry"))

    def test_it_does_not_repeat_a_rung(self):
        rungs = candidate_queries("Banana")
        assert len(rungs) == len(set(rungs))


class TestAgainstTheCatalog:
    async def test_it_finds_a_food_the_model_named_loosely(self, auth_client, db):
        user = await db.scalar(select(User).order_by(User.created_at.desc()).limit(1))
        resolver = InternalCatalogResolver(db, user.id)

        assert await resolve_detected_name(resolver, "2 eggs") is not None
        assert await resolve_detected_name(resolver, "3 rotis") is not None
        assert await resolve_detected_name(resolver, "a banana") is not None

    async def test_it_gives_up_rather_than_matching_something_wrong(self, auth_client, db):
        user = await db.scalar(select(User).order_by(User.created_at.desc()).limit(1))
        resolver = InternalCatalogResolver(db, user.id)

        # Nothing in the catalog is this. Ladder step 5 — and the item keeps
        # the model's macros rather than a stranger's.
        assert await resolve_detected_name(resolver, "Nani's Sunday curry") is None

    async def test_it_prefers_the_least_qualified_name(self, auth_client, db):
        user = await db.scalar(select(User).order_by(User.created_at.desc()).limit(1))
        resolver = InternalCatalogResolver(db, user.id)

        food_id = await resolve_detected_name(resolver, "2 eggs")
        food = await db.scalar(select(Food).where(Food.id == food_id))
        # Not "Egg Noodles" or anything else that merely contains the word.
        assert food.name == "Whole Egg"


class _Catalog:
    """A resolver that answers every rung with the same hits, best first."""

    def __init__(self, *candidates) -> None:
        self.candidates = list(candidates)

    async def search(self, query: str, *, limit: int = 20) -> list:
        return self.candidates[:limit]


def _hit(name: str, category: str | None = None):
    import uuid

    from app.food.resolver import Candidate, FoodRef

    return Candidate(ref=FoodRef(id=uuid.uuid4()), name=name, brand=None, calories=20,
                     protein_g=1, carbs_g=3, fat_g=0, category=category)


class TestRestaurantItems:
    """"a side salad" matched "McDONALD'S, Side Salad" — the only hit covering
    both words — and would have logged a menu item as someone's own salad
    (found on the store-screenshot account)."""

    async def test_an_unnamed_dish_never_lands_on_a_restaurant_menu(self):
        menu = _hit("McDONALD'S, Side Salad", "Fast Foods")
        assert await resolve_detected_name(_Catalog(menu), "A side salad") is None

    async def test_a_generic_food_beats_a_menu_item(self):
        menu = _hit("McDONALD'S, Side Salad", "Fast Foods")
        garden = _hit("Salad, side, garden", "Vegetables and Vegetable Products")
        assert await resolve_detected_name(_Catalog(menu, garden), "side salad") == garden.ref.id

    async def test_naming_the_restaurant_still_finds_it(self):
        menu = _hit("McDONALD'S, Side Salad", "Fast Foods")
        assert await resolve_detected_name(_Catalog(menu), "McDonald's side salad") == menu.ref.id
