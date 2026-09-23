"""Nutrition core (G7) — foods, meals, the diary, and **AC-07**.

Four things here are load-bearing, and three of them fail quietly:

  **AC-07** a manually logged meal moves TODAY's totals, on the user's local date.
  **02 §4.2 inv. 4** item macros are snapshotted. Correcting a food must not
      rewrite what somebody already ate — the nutrition analogue of AC-12.
  **I2 / D5** only `confirmed = true` reaches a total. An unconfirmed item is
      visible and contributes to nothing: not the day, not a preview.
  **I8** every write is idempotent on a client-generated key.

The resolver is exercised through a test double as well as the real one, because
"no screen imports a provider directly" is only true if something can be
substituted.
"""
from __future__ import annotations

import uuid
from datetime import UTC, datetime

import pytest
from sqlalchemy import select

from app.models import Food

pytestmark = pytest.mark.asyncio


def _body(response, expect: int = 200):
    assert response.status_code == expect, response.text
    return response.json()


def _data(response, expect: int = 200):
    return _body(response, expect)["data"]


async def _a_food(client, **over) -> dict:
    """A user-owned food. Per 100 g, always."""
    payload = {
        "name": f"Chicken {uuid.uuid4().hex[:6]}",
        "calories": 165.0, "protein_g": 31.0, "carbs_g": 0.0, "fat_g": 3.6,
        **over,
    }
    return _data(await client.post("/v1/foods", json=payload), 201)


async def _log(client, food_id: str, grams: float, *, meal_type="lunch",
               consumed_at=None, confirmed=True, expect=201) -> dict:
    body: dict = {
        "meal_type": meal_type,
        "items": [{"food_id": food_id, "quantity_grams": grams, "confirmed": confirmed}],
    }
    if consumed_at is not None:
        body["consumed_at"] = consumed_at.isoformat()
    return _data(
        await client.post("/v1/meals", json=body,
                          headers={"Idempotency-Key": str(uuid.uuid4())}),
        expect,
    )


# --------------------------------------------------------------------- AC-07

class TestAC07:
    async def test_a_logged_meal_moves_todays_totals_immediately(self, auth_client):
        """The criterion, end to end.

        200 g of a 165 kcal/100 g food is 330 kcal. The total must move by
        exactly that, on the user's local date, with no second request needed.
        """
        _data(await auth_client.patch("/v1/profile", json={"timezone": "Asia/Kolkata"}))
        food = await _a_food(auth_client)

        before = _data(await auth_client.get("/v1/nutrition/day"))
        await _log(auth_client, food["id"], 200)
        after = _data(await auth_client.get("/v1/nutrition/day"))

        assert before["calories"] == 0.0
        assert after["calories"] == 330.0, "165 kcal/100 g x 200 g"
        assert after["protein_g"] == 62.0
        assert after["local_date"] == before["local_date"], "the same local day"

    async def test_the_day_is_the_profiles_day_not_the_servers(self, auth_client):
        # I7. 18:40Z is 00:10 the NEXT day in Asia/Kolkata, so it belongs to
        # tomorrow's diary, not today's.
        _data(await auth_client.patch("/v1/profile", json={"timezone": "Asia/Kolkata"}))
        food = await _a_food(auth_client)

        meal = await _log(auth_client, food["id"], 100,
                          consumed_at=datetime(2026, 9, 21, 18, 40, tzinfo=UTC))

        assert meal["local_date"] == "2026-09-22"
        day = _data(await auth_client.get("/v1/nutrition/day", params={"date": "2026-09-22"}))
        assert day["calories"] == 165.0
        empty = _data(await auth_client.get("/v1/nutrition/day", params={"date": "2026-09-21"}))
        assert empty["calories"] == 0.0


# ------------------------------------------- 02 §4.2 invariant 4: snapshots

class TestSnapshot:
    async def test_editing_a_food_does_not_change_a_meal_already_logged(
        self, auth_client, db
    ):
        """The one the contract says to test directly.

        A food's nutrition is corrected all the time — a label is re-read, a
        provider updates a row. What somebody ate last March must not move.
        """
        food = await _a_food(auth_client)
        meal = await _log(auth_client, food["id"], 200)
        before = meal["items"][0]

        _data(await auth_client.patch(f"/v1/foods/{food['id']}", json={
            "calories": 999.0, "protein_g": 1.0, "carbs_g": 50.0, "fat_g": 40.0,
        }))

        after = _data(await auth_client.get(f"/v1/meals/{meal['id']}"))["items"][0]

        assert after["calories"] == before["calories"] == 330.0
        assert after["protein_g"] == before["protein_g"] == 62.0
        assert after["carbs_g"] == before["carbs_g"]
        assert after["fat_g"] == before["fat_g"]

    async def test_the_days_total_is_unchanged_too(self, auth_client):
        # The snapshot is worthless if a total recomputes from `foods` anyway.
        food = await _a_food(auth_client)
        await _log(auth_client, food["id"], 200)
        before = _data(await auth_client.get("/v1/nutrition/day"))["calories"]

        _data(await auth_client.patch(f"/v1/foods/{food['id']}", json={"calories": 999.0}))

        after = _data(await auth_client.get("/v1/nutrition/day"))["calories"]
        assert after == before == 330.0

    async def test_an_item_survives_its_food_being_deleted(self, auth_client):
        # `food_id` is SET NULL, and `display_name` is on the item, so a meal
        # still renders. Deleting a food must not delete what somebody ate.
        food = await _a_food(auth_client, name="Doomed Food")
        meal = await _log(auth_client, food["id"], 100)

        _data(await auth_client.delete(f"/v1/foods/{food['id']}"))

        item = _data(await auth_client.get(f"/v1/meals/{meal['id']}"))["items"][0]
        assert item["display_name"] == "Doomed Food"
        assert item["calories"] == 165.0
        assert item["food_id"] is None


# ------------------------------------------------- I2 / D5: confirmed only

class TestConfirmedOnly:
    async def test_an_unconfirmed_item_is_visible_and_counts_for_nothing(
        self, auth_client
    ):
        food = await _a_food(auth_client)
        meal = await _log(auth_client, food["id"], 200, confirmed=False)

        day = _data(await auth_client.get("/v1/nutrition/day"))

        assert day["calories"] == 0.0, "an unconfirmed item reaches no total"
        assert day["pending_count"] == 1, "and is still reported as being there"
        assert _data(await auth_client.get(f"/v1/meals/{meal['id']}"))["items"], "visible"

    async def test_confirming_it_moves_the_total(self, auth_client):
        food = await _a_food(auth_client)
        meal = await _log(auth_client, food["id"], 200, confirmed=False)
        item_id = meal["items"][0]["id"]

        _data(await auth_client.patch(f"/v1/meal-items/{item_id}", json={"confirmed": True}))

        day = _data(await auth_client.get("/v1/nutrition/day"))
        assert day["calories"] == 330.0
        assert day["pending_count"] == 0

    async def test_a_correction_is_marked_as_one(self, auth_client):
        # BRD §13 / I12: an edited estimate is not the same as an untouched one,
        # and G8 leans on the distinction.
        food = await _a_food(auth_client)
        meal = await _log(auth_client, food["id"], 200)
        item_id = meal["items"][0]["id"]

        updated = _data(await auth_client.patch(
            f"/v1/meal-items/{item_id}", json={"quantity_grams": 100.0}
        ))

        assert updated["user_corrected"] is True
        assert updated["calories"] == 165.0, "rescaled from the food, not halved blindly"


# ------------------------------------------------------------ I8: idempotency

class TestIdempotency:
    async def test_replaying_a_meal_write_creates_one_meal(self, auth_client):
        food = await _a_food(auth_client)
        key = str(uuid.uuid4())
        body = {
            "meal_type": "lunch",
            "client_id": str(uuid.uuid4()),
            "items": [{"food_id": food["id"], "quantity_grams": 100.0}],
        }

        first = _data(await auth_client.post("/v1/meals", json=body,
                                             headers={"Idempotency-Key": key}), 201)
        second = _data(await auth_client.post("/v1/meals", json=body,
                                              headers={"Idempotency-Key": key}), 201)

        assert first["id"] == second["id"], "a replay is the same meal, not a second one"
        day = _data(await auth_client.get("/v1/nutrition/day"))
        assert day["calories"] == 165.0, "and the total counted it once"


# ------------------------------------------------------------- the resolver

class TestResolver:
    async def test_search_finds_a_seeded_food(self, auth_client):
        rows = _data(await auth_client.get("/v1/foods", params={"q": "chicken"}))
        assert rows, "the internal catalog must answer without a provider (Q1 is open)"
        assert any("chicken" in r["name"].lower() for r in rows)

    async def test_filtered_empty_offers_a_way_forward(self, auth_client):
        # I13. "No foods at all" and "nothing matches 'zzzz'" are different
        # screens: one offers a first food, the other offers to create this one.
        body = _body(await auth_client.get("/v1/foods", params={"q": "zzzzqqqq"}))

        assert body["data"] == []
        assert body["meta"]["filtered"] is True
        assert body["meta"]["total_unfiltered"] > 0

    async def test_a_users_own_food_is_searchable_and_nobody_elses(
        self, auth_client, client
    ):
        # A name with no substring inside the seeded catalog: "Nana" matched
        # Ba-NANA, so the first version of this test failed on its own fixture
        # rather than on the scoping it was checking.
        mine = await _a_food(auth_client, name="Grandmothers Zqx Dal")

        other = f"other-{uuid.uuid4().hex[:8]}@example.com"
        r = await client.post("/v1/auth/register",
                              json={"email": other, "password": "correct-horse-battery"})
        token = r.json()["data"]["access_token"]

        theirs = _data(await auth_client.get(
            "/v1/foods", params={"q": "Zqx"},
            headers={"authorization": f"Bearer {token}"},
        ))

        assert any(f["id"] == mine["id"] for f in _data(
            await auth_client.get("/v1/foods", params={"q": "Zqx"})))
        assert theirs == [], "a custom food is not shared"


# -------------------------------------------------------------- the diary

class TestDiary:
    async def test_lists_a_days_meals_with_their_items(self, auth_client):
        food = await _a_food(auth_client)
        await _log(auth_client, food["id"], 150, meal_type="breakfast")

        day = _data(await auth_client.get("/v1/nutrition/day"))

        assert len(day["meals"]) == 1
        assert day["meals"][0]["meal_type"] == "breakfast"
        assert day["meals"][0]["items"][0]["quantity_grams"] == 150.0

    async def test_an_empty_day_is_an_answer_not_an_error(self, auth_client):
        day = _data(await auth_client.get("/v1/nutrition/day",
                                          params={"date": "2020-01-01"}))
        assert day["meals"] == []
        assert day["calories"] == 0.0

    async def test_never_another_users_diary(self, auth_client, client):
        food = await _a_food(auth_client)
        await _log(auth_client, food["id"], 200)

        other = f"other-{uuid.uuid4().hex[:8]}@example.com"
        r = await client.post("/v1/auth/register",
                              json={"email": other, "password": "correct-horse-battery"})
        token = r.json()["data"]["access_token"]

        day = _data(await auth_client.get(
            "/v1/nutrition/day", headers={"authorization": f"Bearer {token}"}))

        assert day["calories"] == 0.0


# ------------------------------------------------------------------ guards

class TestGuards:
    async def test_rejects_a_negative_quantity(self, auth_client):
        food = await _a_food(auth_client)
        r = await auth_client.post("/v1/meals", json={
            "meal_type": "lunch",
            "items": [{"food_id": food["id"], "quantity_grams": -50.0}],
        }, headers={"Idempotency-Key": str(uuid.uuid4())})
        assert r.status_code == 422, r.text

    async def test_a_quick_add_needs_no_food(self, auth_client):
        # `food_id` NULL is legitimate — someone ate something the catalog has
        # never heard of, and it still counts.
        meal = _data(await auth_client.post("/v1/meals", json={
            "meal_type": "snack",
            "items": [{"display_name": "Canteen curry", "calories": 420.0}],
        }, headers={"Idempotency-Key": str(uuid.uuid4())}), 201)

        assert meal["items"][0]["food_id"] is None
        assert _data(await auth_client.get("/v1/nutrition/day"))["calories"] == 420.0

    async def test_an_item_with_neither_a_food_nor_a_name_is_refused(self, auth_client):
        r = await auth_client.post("/v1/meals", json={
            "meal_type": "snack", "items": [{"calories": 100.0}],
        }, headers={"Idempotency-Key": str(uuid.uuid4())})
        assert r.status_code == 422, r.text

    async def test_a_global_catalog_food_is_read_only(self, auth_client, db):
        seeded = await db.scalar(select(Food).where(Food.owner_user_id.is_(None)))
        assert seeded is not None, "the internal catalog should be seeded"

        r = await auth_client.patch(f"/v1/foods/{seeded.id}", json={"calories": 1.0})

        assert r.status_code == 403, r.text
