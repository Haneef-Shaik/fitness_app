"""Meal categories, recipes and copying (H-16, H-11, H-12).

These three share one rule, and it is the rule G7 keeps repeating: **what
happened is frozen, what is planned may change.**

  A category is renamed → meals already filed under it keep rendering, because
      meals reference the SLUG and the name is only a label.
  A recipe is edited → meals already logged from it do not move, because logging
      a recipe snapshots its items exactly as logging a food does.
  A day is copied → the copies are manual, confirmed entries with fresh ids and
      no AI provenance. A copy is something the user did, not a new estimate.

The delete rules are the same soft-delete principle as exercises and programs: a
category with meals behind it can be hidden, never deleted.
"""
from __future__ import annotations

import uuid
from datetime import UTC, datetime

import pytest

pytestmark = pytest.mark.asyncio


def _data(response, expect: int = 200):
    assert response.status_code == expect, response.text
    return response.json()["data"]


async def _a_food(client, **over) -> dict:
    return _data(await client.post("/v1/foods", json={
        "name": f"Oats {uuid.uuid4().hex[:6]}",
        "calories": 380.0, "protein_g": 13.0, "carbs_g": 67.0, "fat_g": 7.0,
        **over,
    }), 201)


async def _log(client, food_id, grams, *, meal_type="lunch", consumed_at=None, confirmed=True):
    body: dict = {"meal_type": meal_type, "items": [
        {"food_id": food_id, "quantity_grams": grams, "confirmed": confirmed},
    ]}
    if consumed_at is not None:
        body["consumed_at"] = consumed_at.isoformat()
    return _data(await client.post(
        "/v1/meals", json=body, headers={"Idempotency-Key": str(uuid.uuid4())}), 201)


# ------------------------------------------------------- H-16 · categories

class TestMealCategories:
    async def test_a_new_account_already_has_the_four_defaults(self, auth_client):
        cats = _data(await auth_client.get("/v1/meal-categories"))
        assert [c["slug"] for c in cats] == ["breakfast", "lunch", "dinner", "snack"]
        assert all(c["is_default"] for c in cats)
        assert all(not c["hidden"] for c in cats)

    async def test_the_defaults_are_created_once_not_on_every_read(self, auth_client):
        first = _data(await auth_client.get("/v1/meal-categories"))
        second = _data(await auth_client.get("/v1/meal-categories"))
        assert [c["id"] for c in first] == [c["id"] for c in second]

    async def test_one_users_categories_are_invisible_to_another(self, auth_client, client):
        made = _data(await auth_client.post(
            "/v1/meal-categories", json={"name": "Pre-workout"}), 201)

        other_email = f"other-{uuid.uuid4().hex[:8]}@example.com"
        r = await client.post("/v1/auth/register",
                              json={"email": other_email, "password": "correct-horse-battery"})
        token = r.json()["data"]["access_token"]
        theirs = _data(await client.get(
            "/v1/meal-categories", headers={"authorization": f"Bearer {token}"}))
        assert made["id"] not in [c["id"] for c in theirs]

    async def test_a_custom_category_gets_a_slug_and_sorts_last(self, auth_client):
        made = _data(await auth_client.post(
            "/v1/meal-categories", json={"name": "Pre-workout"}), 201)
        assert made["slug"] == "pre-workout"

        cats = _data(await auth_client.get("/v1/meal-categories"))
        assert cats[-1]["slug"] == "pre-workout"

    async def test_a_duplicate_slug_is_refused_not_silently_merged(self, auth_client):
        await auth_client.post("/v1/meal-categories", json={"name": "Pre-workout"})
        r = await auth_client.post("/v1/meal-categories", json={"name": "Pre workout"})
        assert r.status_code == 422, r.text

    async def test_renaming_keeps_the_slug_so_logged_meals_still_render(self, auth_client):
        food = await _a_food(auth_client)
        await _log(auth_client, food["id"], 100.0, meal_type="lunch")

        cats = _data(await auth_client.get("/v1/meal-categories"))
        lunch = next(c for c in cats if c["slug"] == "lunch")
        renamed = _data(await auth_client.patch(
            f"/v1/meal-categories/{lunch['id']}", json={"name": "Midday"}))

        assert renamed["name"] == "Midday"
        assert renamed["slug"] == "lunch"

        day = _data(await auth_client.get("/v1/nutrition/day"))
        assert [m["meal_type"] for m in day["meals"]] == ["lunch"]

    async def test_a_default_time_round_trips(self, auth_client):
        cats = _data(await auth_client.get("/v1/meal-categories"))
        updated = _data(await auth_client.patch(
            f"/v1/meal-categories/{cats[0]['id']}", json={"default_time": "07:30"}))
        assert updated["default_time"] == "07:30"

    async def test_reordering_persists(self, auth_client):
        cats = _data(await auth_client.get("/v1/meal-categories"))
        reversed_ids = [c["id"] for c in reversed(cats)]

        _data(await auth_client.post("/v1/meal-categories/reorder",
                                     json={"ids": reversed_ids}))

        after = _data(await auth_client.get("/v1/meal-categories"))
        assert [c["id"] for c in after] == reversed_ids

    async def test_reordering_refuses_a_partial_list(self, auth_client):
        # Sending three of four ids would silently strand the fourth at an
        # arbitrary position. Refuse rather than guess.
        cats = _data(await auth_client.get("/v1/meal-categories"))
        r = await auth_client.post("/v1/meal-categories/reorder",
                                   json={"ids": [c["id"] for c in cats[:2]]})
        assert r.status_code == 422, r.text

    async def test_a_category_with_meals_cannot_be_deleted(self, auth_client):
        food = await _a_food(auth_client)
        await _log(auth_client, food["id"], 100.0, meal_type="dinner")

        cats = _data(await auth_client.get("/v1/meal-categories"))
        dinner = next(c for c in cats if c["slug"] == "dinner")

        r = await auth_client.delete(f"/v1/meal-categories/{dinner['id']}")
        assert r.status_code == 409, r.text
        assert "hide" in r.json()["error"]["message"].lower()

    async def test_it_can_be_hidden_instead_and_history_still_renders(self, auth_client):
        food = await _a_food(auth_client)
        await _log(auth_client, food["id"], 100.0, meal_type="dinner")

        cats = _data(await auth_client.get("/v1/meal-categories"))
        dinner = next(c for c in cats if c["slug"] == "dinner")
        _data(await auth_client.patch(
            f"/v1/meal-categories/{dinner['id']}", json={"hidden": True}))

        day = _data(await auth_client.get("/v1/nutrition/day"))
        assert [m["meal_type"] for m in day["meals"]] == ["dinner"]

    async def test_an_unused_category_can_be_deleted(self, auth_client):
        made = _data(await auth_client.post(
            "/v1/meal-categories", json={"name": "Pre-workout"}), 201)
        assert (await auth_client.delete(f"/v1/meal-categories/{made['id']}")).status_code == 200
        cats = _data(await auth_client.get("/v1/meal-categories"))
        assert made["id"] not in [c["id"] for c in cats]

    async def test_logging_to_an_unknown_category_is_refused(self, auth_client):
        food = await _a_food(auth_client)
        r = await auth_client.post("/v1/meals", json={
            "meal_type": "second-breakfast",
            "items": [{"food_id": food["id"], "quantity_grams": 50.0}],
        }, headers={"Idempotency-Key": str(uuid.uuid4())})
        assert r.status_code == 422, r.text

    async def test_logging_to_a_custom_category_works(self, auth_client):
        _data(await auth_client.post("/v1/meal-categories", json={"name": "Pre-workout"}), 201)
        food = await _a_food(auth_client)
        meal = await _log(auth_client, food["id"], 50.0, meal_type="pre-workout")
        assert meal["meal_type"] == "pre-workout"


# ---------------------------------------------------------- H-11 · recipes

class TestRecipes:
    async def test_a_recipe_stores_its_items_and_servings(self, auth_client):
        oats = await _a_food(auth_client)
        recipe = _data(await auth_client.post("/v1/recipes", json={
            "name": "Morning oats", "servings": 2,
            "items": [{"food_id": oats["id"], "quantity_grams": 100.0}],
        }), 201)

        assert recipe["name"] == "Morning oats"
        assert recipe["servings"] == 2
        assert len(recipe["items"]) == 1

    async def test_it_reports_macros_per_serving_not_per_batch(self, auth_client):
        # 100 g of oats at 380 kcal/100 g, over 2 servings, is 190 per serving.
        oats = await _a_food(auth_client)
        recipe = _data(await auth_client.post("/v1/recipes", json={
            "name": "Morning oats", "servings": 2,
            "items": [{"food_id": oats["id"], "quantity_grams": 100.0}],
        }), 201)
        assert recipe["per_serving"]["calories"] == pytest.approx(190.0)

    async def test_logging_a_recipe_scales_by_servings(self, auth_client):
        oats = await _a_food(auth_client)
        recipe = _data(await auth_client.post("/v1/recipes", json={
            "name": "Morning oats", "servings": 2,
            "items": [{"food_id": oats["id"], "quantity_grams": 100.0}],
        }), 201)

        meal = _data(await auth_client.post(
            f"/v1/recipes/{recipe['id']}/log",
            json={"meal_type": "breakfast", "servings": 1},
            headers={"Idempotency-Key": str(uuid.uuid4())}), 201)

        assert len(meal["items"]) == 1
        assert meal["items"][0]["quantity_grams"] == pytest.approx(50.0)
        assert meal["items"][0]["calories"] == pytest.approx(190.0)

    async def test_editing_a_recipe_does_not_move_a_meal_already_logged(self, auth_client):
        """The snapshot rule, one level up. Same principle as editing a food."""
        oats = await _a_food(auth_client)
        recipe = _data(await auth_client.post("/v1/recipes", json={
            "name": "Morning oats", "servings": 1,
            "items": [{"food_id": oats["id"], "quantity_grams": 100.0}],
        }), 201)
        meal = _data(await auth_client.post(
            f"/v1/recipes/{recipe['id']}/log",
            json={"meal_type": "breakfast", "servings": 1},
            headers={"Idempotency-Key": str(uuid.uuid4())}), 201)
        before = meal["items"][0]["calories"]
        # Pin the value. Without this, a bug that logged NULL macros would make
        # the comparison below true by comparing nothing to nothing.
        assert before == pytest.approx(380.0)

        _data(await auth_client.patch(f"/v1/recipes/{recipe['id']}", json={
            "servings": 4,
            "items": [{"food_id": oats["id"], "quantity_grams": 500.0}],
        }))

        after = _data(await auth_client.get(f"/v1/meals/{meal['id']}"))
        assert after["items"][0]["calories"] == pytest.approx(before)

    async def test_logging_a_recipe_is_idempotent_on_the_client_key(self, auth_client):
        oats = await _a_food(auth_client)
        recipe = _data(await auth_client.post("/v1/recipes", json={
            "name": "Morning oats", "servings": 1,
            "items": [{"food_id": oats["id"], "quantity_grams": 100.0}],
        }), 201)

        client_id = str(uuid.uuid4())
        first = _data(await auth_client.post(
            f"/v1/recipes/{recipe['id']}/log",
            json={"meal_type": "breakfast", "servings": 1, "client_id": client_id},
            headers={"Idempotency-Key": client_id}), 201)
        again = _data(await auth_client.post(
            f"/v1/recipes/{recipe['id']}/log",
            json={"meal_type": "breakfast", "servings": 1, "client_id": client_id},
            headers={"Idempotency-Key": client_id}), 201)

        assert first["id"] == again["id"]
        day = _data(await auth_client.get("/v1/nutrition/day"))
        assert len(day["meals"]) == 1

    async def test_another_users_recipe_is_not_reachable(self, auth_client, client):
        oats = await _a_food(auth_client)
        recipe = _data(await auth_client.post("/v1/recipes", json={
            "name": "Morning oats", "servings": 1,
            "items": [{"food_id": oats["id"], "quantity_grams": 100.0}],
        }), 201)

        other_email = f"other-{uuid.uuid4().hex[:8]}@example.com"
        r = await client.post("/v1/auth/register",
                              json={"email": other_email, "password": "correct-horse-battery"})
        token = r.json()["data"]["access_token"]
        got = await client.get(f"/v1/recipes/{recipe['id']}",
                               headers={"authorization": f"Bearer {token}"})
        assert got.status_code == 404, got.text
        # Same trap as the copy test: prove the owner CAN reach it, or a missing
        # route would satisfy the assertion above on its own.
        assert (await auth_client.get(f"/v1/recipes/{recipe['id']}")).status_code == 200


# ------------------------------------------------------------- H-12 · copy

class TestCopy:
    async def test_copying_a_meal_lands_on_the_target_date(self, auth_client):
        food = await _a_food(auth_client)
        source = await _log(auth_client, food["id"], 100.0,
                            consumed_at=datetime(2026, 9, 21, 13, 0, tzinfo=UTC))

        copy = _data(await auth_client.post(
            f"/v1/meals/{source['id']}/copy",
            json={"to_date": "2026-09-22", "meal_type": "lunch"},
            headers={"Idempotency-Key": str(uuid.uuid4())}), 201)

        assert copy["local_date"] == "2026-09-22"
        assert copy["id"] != source["id"]

    async def test_the_copy_keeps_the_clock_time(self, auth_client):
        food = await _a_food(auth_client)
        source = await _log(auth_client, food["id"], 100.0,
                            consumed_at=datetime(2026, 9, 21, 13, 0, tzinfo=UTC))
        copy = _data(await auth_client.post(
            f"/v1/meals/{source['id']}/copy",
            json={"to_date": "2026-09-22", "meal_type": "lunch"},
            headers={"Idempotency-Key": str(uuid.uuid4())}), 201)

        assert copy["consumed_at"][11:16] == source["consumed_at"][11:16]

    async def test_items_copy_with_fresh_ids_and_identical_macros(self, auth_client):
        food = await _a_food(auth_client)
        source = await _log(auth_client, food["id"], 100.0,
                            consumed_at=datetime(2026, 9, 21, 13, 0, tzinfo=UTC))
        copy = _data(await auth_client.post(
            f"/v1/meals/{source['id']}/copy",
            json={"to_date": "2026-09-22", "meal_type": "lunch"},
            headers={"Idempotency-Key": str(uuid.uuid4())}), 201)

        assert copy["items"][0]["id"] != source["items"][0]["id"]
        assert copy["items"][0]["calories"] == pytest.approx(source["items"][0]["calories"])

    async def test_an_unconfirmed_item_copies_as_confirmed_and_manual(self, auth_client):
        """A copy is something the user did. It is not a new estimate (I12)."""
        food = await _a_food(auth_client)
        source = _data(await auth_client.post("/v1/meals", json={
            "meal_type": "lunch",
            "consumed_at": datetime(2026, 9, 21, 13, 0, tzinfo=UTC).isoformat(),
            "items": [{"food_id": food["id"], "quantity_grams": 100.0,
                       "confirmed": False, "source": "text_ai"}],
        }, headers={"Idempotency-Key": str(uuid.uuid4())}), 201)

        copy = _data(await auth_client.post(
            f"/v1/meals/{source['id']}/copy",
            json={"to_date": "2026-09-22", "meal_type": "lunch"},
            headers={"Idempotency-Key": str(uuid.uuid4())}), 201)

        assert copy["items"][0]["confirmed"] is True
        assert copy["items"][0]["source"] == "manual"

    async def test_copying_a_whole_day_brings_every_meal(self, auth_client):
        food = await _a_food(auth_client)
        await _log(auth_client, food["id"], 100.0, meal_type="breakfast",
                   consumed_at=datetime(2026, 9, 21, 8, 0, tzinfo=UTC))
        await _log(auth_client, food["id"], 150.0, meal_type="dinner",
                   consumed_at=datetime(2026, 9, 21, 19, 0, tzinfo=UTC))

        _data(await auth_client.post("/v1/nutrition/day/copy", json={
            "from_date": "2026-09-21", "to_date": "2026-09-23",
        }, headers={"Idempotency-Key": str(uuid.uuid4())}), 201)

        day = _data(await auth_client.get("/v1/nutrition/day?date=2026-09-23"))
        assert sorted(m["meal_type"] for m in day["meals"]) == ["breakfast", "dinner"]
        assert day["calories"] == pytest.approx(380.0 + 570.0)

    async def test_copying_an_empty_day_is_refused_rather_than_silently_doing_nothing(
        self, auth_client
    ):
        r = await auth_client.post("/v1/nutrition/day/copy", json={
            "from_date": "2026-01-01", "to_date": "2026-01-02",
        }, headers={"Idempotency-Key": str(uuid.uuid4())})
        assert r.status_code == 422, r.text

    async def test_copying_a_day_onto_itself_is_refused(self, auth_client):
        food = await _a_food(auth_client)
        await _log(auth_client, food["id"], 100.0,
                   consumed_at=datetime(2026, 9, 21, 13, 0, tzinfo=UTC))
        r = await auth_client.post("/v1/nutrition/day/copy", json={
            "from_date": "2026-09-21", "to_date": "2026-09-21",
        }, headers={"Idempotency-Key": str(uuid.uuid4())})
        assert r.status_code == 422, r.text

    async def test_another_users_meal_cannot_be_copied(self, auth_client, client):
        food = await _a_food(auth_client)
        source = await _log(auth_client, food["id"], 100.0)

        other_email = f"other-{uuid.uuid4().hex[:8]}@example.com"
        r = await client.post("/v1/auth/register",
                              json={"email": other_email, "password": "correct-horse-battery"})
        token = r.json()["data"]["access_token"]
        got = await client.post(
            f"/v1/meals/{source['id']}/copy",
            json={"to_date": "2026-09-22", "meal_type": "lunch"},
            headers={"authorization": f"Bearer {token}",
                     "Idempotency-Key": str(uuid.uuid4())})
        assert got.status_code == 404, got.text

        # A route that does not exist ALSO returns 404, so proving the owner can
        # do it is what makes the line above about ownership rather than routing.
        mine = await auth_client.post(
            f"/v1/meals/{source['id']}/copy",
            json={"to_date": "2026-09-22", "meal_type": "lunch"},
            headers={"Idempotency-Key": str(uuid.uuid4())})
        assert mine.status_code == 201, mine.text
