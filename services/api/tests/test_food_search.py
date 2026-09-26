"""Food search (H-04) and AI resolution against the REAL seeded catalog.

The catalog is ~7,800 foods now, not 22, and the failure mode changed with it:
not "nothing matches" but "the right food is on page three". So these assert
what a person sees FIRST, through the same endpoint the app calls.
"""
from __future__ import annotations

import pytest
from sqlalchemy import select

from app.food.benchmark import MEAL_PHRASES, is_correct
from app.food.internal import InternalCatalogResolver
from app.food.ladder import resolve_detected_name
from app.food.text import stem, terms
from app.models import Food, User

pytestmark = pytest.mark.asyncio


def _data(response, expect: int = 200):
    assert response.status_code == expect, response.text
    return response.json()["data"]


async def _search(client, q: str, limit: int = 5) -> list[dict]:
    return _data(await client.get("/v1/foods", params={"q": q, "limit": limit}))


async def _resolver(db) -> InternalCatalogResolver:
    user = await db.scalar(select(User).order_by(User.created_at.desc()).limit(1))
    return InternalCatalogResolver(db, user.id)


# ------------------------------------------------------------------- H-04

#: query -> the food a person means, which must come FIRST.
TOP_RESULT = {
    "roti": "Roti / Chapati",
    "chapati": "Roti / Chapati",
    "paneer": "Paneer",
    "dal": "Dal (lentil curry)",
    "chicken breast": "Chicken Breast, skinless",
    "banana": "Banana",
    "rice": "White Rice, cooked",
    "egg": "Whole Egg",
    "greek yogurt": "Greek Yogurt, plain 0%",
    "idli": "Idli",
    "dosa": "Plain dosa",
    "biryani": "Chicken biryani",
    "milk": "Whole Milk",
    "almonds": "Almonds",
}

#: query -> a word every one of the top three must contain. Not one exact food
#: (there are three biryanis and several oats), but no junk above the fold.
TOP_THREE_CONTAIN = {
    "oats": "oat",
    "biryani": "biryani",
    "roti": "roti",
    "paneer": "paneer",
    "dal": "dal",
    "chicken breast": "breast",
    "banana": "banana",
    "egg": "egg",
    "greek yogurt": "greek",
    "milk": "milk",
    "rice": "rice",
}


@pytest.mark.parametrize(("query", "expected"), sorted(TOP_RESULT.items()))
async def test_the_food_a_person_means_comes_first(auth_client, query, expected):
    rows = await _search(auth_client, query)
    assert rows, f"nothing found for {query!r}"
    assert rows[0]["name"] == expected, [r["name"] for r in rows]


@pytest.mark.parametrize(("query", "word"), sorted(TOP_THREE_CONTAIN.items()))
async def test_nothing_unrelated_above_the_fold(auth_client, query, word):
    rows = await _search(auth_client, query, limit=3)
    assert len(rows) == 3, rows
    names = [r["name"] for r in rows]
    assert all(word in n.lower() for n in names), names


async def test_a_word_is_matched_at_its_start_not_anywhere(auth_client):
    # "egg" inside "veggie" is not an egg; "rice" inside "licorice" is not rice.
    for query, bad in (("egg", "veggie"), ("rice", "licorice")):
        rows = await _search(auth_client, query, limit=50)
        assert not any(bad in r["name"].lower() for r in rows), (query, bad)


async def test_a_typo_still_finds_the_food(auth_client):
    assert (await _search(auth_client, "bannana"))[0]["name"] == "Banana"
    assert "chicken" in (await _search(auth_client, "chiken breast"))[0]["name"].lower()


async def test_an_indian_name_finds_the_food_usda_files_otherwise(auth_client):
    # USDA calls it okra; nobody in Delhi does.
    names = [r["name"] for r in await _search(auth_client, "bhindi")]
    assert "Bhindi masala" in names and "Okra, raw" in names


async def test_a_users_own_food_ranks_right_after_an_exact_match(auth_client):
    # 02 §5.2: exact name, then alias, then the user's own foods — above
    # every catalog row that only partly matches.
    mine = _data(await auth_client.post("/v1/foods", json={
        "name": "Office canteen roti", "calories": 310.0,
    }), 201)
    rows = await _search(auth_client, "roti")
    assert rows[0]["name"] == "Roti / Chapati", [r["name"] for r in rows]
    assert rows[1]["id"] == mine["id"], [r["name"] for r in rows]


async def test_browsing_with_no_query_opens_on_staples_not_the_alphabet(auth_client):
    rows = _data(await auth_client.get("/v1/foods", params={"limit": 10}))
    names = [r["name"] for r in rows]
    # Alphabetical order opened on "Abiyuch, raw" — true, and useless.
    assert "Abiyuch, raw" not in names
    assert any(n in names for n in ("Whole Egg", "Banana", "White Rice, cooked")), names


# -------------------------------------------------------------- H-05 data

async def test_a_catalog_food_carries_portions_and_its_source(auth_client):
    idli = (await _search(auth_client, "idli"))[0]
    food = _data(await auth_client.get(f"/v1/foods/{idli['id']}"))

    assert {"label": "1 idli", "grams": 38.0} in food["portions"]
    assert food["dataset"] == "fitlog_indian"
    assert "FDC 2708346" in food["source_note"]
    assert "USDA" in food["attribution"]


async def test_a_usda_food_names_its_record_and_the_attribution(auth_client):
    rows = await _search(auth_client, "okra", limit=10)
    okra = next(r for r in rows if r["name"] == "Okra, raw")
    assert okra["source"] == "provider"
    assert okra["dataset"] == "usda_fdc_sr_legacy"
    assert okra["source_note"].startswith("FDC ")
    assert "FoodData Central" in okra["attribution"]
    assert okra["portions"], "SR Legacy ships household measures; they must survive import"


async def test_a_custom_food_has_no_catalog_provenance(auth_client):
    food = _data(await auth_client.post("/v1/foods", json={
        "name": "Aunty's ladoo", "calories": 420.0, "sodium_mg": 40.0,
    }), 201)
    assert food["source"] == "user" and food["dataset"] is None
    assert food["attribution"] is None and food["portions"] == []
    assert food["sodium_mg"] == pytest.approx(40.0)


# ------------------------------------------------------------- the ladder

async def test_every_benchmark_phrase_resolves_to_the_right_food(auth_client, db):
    """The measure `scripts/measure_food_resolution.py` reports. It was 17/40
    against the 22-food catalog; every one must now land on the right food."""
    resolver = await _resolver(db)
    wrong = []
    for phrase, expected in MEAL_PHRASES:
        food_id = await resolve_detected_name(resolver, phrase)
        name = food_id and await db.scalar(select(Food.name).where(Food.id == food_id))
        if not is_correct(name, expected):
            wrong.append((phrase, name))
    assert not wrong, wrong


async def test_a_lone_word_must_be_a_food_not_merely_part_of_one(auth_client, db):
    resolver = await _resolver(db)
    # "curry" appears in a dozen names but is not itself a food in the catalog.
    assert await resolve_detected_name(resolver, "Grandma's special curry") is None
    # "salmon" IS a food, so the last rung may take it.
    food_id = await resolve_detected_name(resolver, "grilled lemon herb salmon")
    assert "salmon" in (await db.scalar(select(Food.name).where(Food.id == food_id))).lower()


async def test_a_fuzzy_guess_is_never_accepted_for_an_ai_item(auth_client, db):
    # The search forgives the typo; the ladder does not accept the guess.
    resolver = await _resolver(db)
    assert (await resolver.search("bannana"))[0].name == "Banana"
    assert await resolve_detected_name(resolver, "bannana") is None


# ------------------------------------------------------------ query terms

class TestTerms:
    def test_grammar_and_one_letter_debris_are_dropped(self):
        assert terms("a bowl of dal") == ["bowl", "dal"]
        assert terms("Nani's Sunday curry") == ["nani", "sunday", "curry"]

    def test_plurals_share_a_prefix_with_their_singular(self):
        assert stem("eggs") == "egg"
        assert stem("berries") == "berr"
        assert stem("tomatoes") == "tomato"
        assert stem("sandwiches") == "sandwich"
        assert stem("glass") == "glass"
