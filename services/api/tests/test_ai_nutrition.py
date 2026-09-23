"""AI food analysis (G8) — AC-08, AC-09 and **AC-10**.

AC-10 is the sharpest assertion in the project, and the shape of the assertion
matters as much as the assertion: **byte-identity, not field equality.** A field
comparison passes when a column you forgot to name drifted, which is precisely
the failure mode "the raw AI result is preserved" is meant to rule out. Every
test below that claims immutability hashes the whole row.

The other load-bearing claim here is a *negative* one: **I14 — no AI failure
touches training.** It has one proof, and that proof is killing the gateway and
then using the app.
"""
from __future__ import annotations

import hashlib
import json
import uuid

import pytest
from sqlalchemy import select, text

from app.ai.gateway import AnalysisItem, AnalysisResult
from app.models import FoodAnalysisItem

pytestmark = pytest.mark.asyncio

SCHEMA_VERSION = "food_analysis.v1"


def _data(response, expect: int = 200):
    assert response.status_code == expect, response.text
    return response.json()["data"]


# --------------------------------------------------------------- fingerprints

async def _fingerprint(db, analysis_id: uuid.UUID) -> str:
    """A hash over **every column** of every analysis item, ordered.

    Built from the table's own column list rather than a hand-written field
    list: a column added later is included automatically, so this cannot rot
    into the field-equality test it exists to avoid.
    """
    rows = (await db.scalars(
        select(FoodAnalysisItem)
        .where(FoodAnalysisItem.analysis_id == analysis_id)
        .order_by(FoodAnalysisItem.id)
    )).all()
    payload = [
        {c.name: str(getattr(row, c.name)) for c in FoodAnalysisItem.__table__.columns}
        for row in rows
    ]
    return hashlib.sha256(
        json.dumps(payload, sort_keys=True, separators=(",", ":")).encode()
    ).hexdigest()


# ------------------------------------------------------------------ AC-08

class TestTextAnalysis:
    async def test_ac08_three_foods_become_three_separately_editable_items(
        self, auth_client, worker, db
    ):
        started = _data(await auth_client.post("/v1/food-analysis/text", json={
            "text": "2 eggs, 3 rotis and 200g chicken curry",
        }), 202)
        assert started["status"] == "pending"

        await worker.drain()

        analysis = _data(await auth_client.get(f"/v1/food-analysis/{started['id']}"))
        assert analysis["status"] == "completed"
        # Three items, not one blob — and each one addressable by its own id.
        assert len(analysis["items"]) == 3
        assert len({i["id"] for i in analysis["items"]}) == 3
        for item in analysis["items"]:
            assert item["detected_name"]
            assert item["estimated_quantity"] is not None
            assert item["estimated_unit"]

    async def test_the_users_own_text_is_kept_so_nobody_has_to_retype_it(
        self, auth_client, worker
    ):
        started = _data(await auth_client.post("/v1/food-analysis/text", json={
            "text": "a bowl of dal and 2 rotis",
        }), 202)
        await worker.drain()

        analysis = _data(await auth_client.get(f"/v1/food-analysis/{started['id']}"))
        assert analysis["source_text"] == "a bowl of dal and 2 rotis"

    async def test_unparseable_input_completes_with_zero_items_not_an_error(
        self, auth_client, worker, gateway
    ):
        # "We couldn't identify any food" is a RESULT, not a failure. A failure
        # would offer a retry; this offers manual entry.
        gateway.result = AnalysisResult(
            schema_version=SCHEMA_VERSION, model_name="stub/none", items=[], notes=None,
        )
        started = _data(await auth_client.post("/v1/food-analysis/text",
                                               json={"text": "food"}), 202)
        await worker.drain()

        analysis = _data(await auth_client.get(f"/v1/food-analysis/{started['id']}"))
        assert analysis["status"] == "completed"
        assert analysis["items"] == []
        assert analysis["error_code"] is None

    async def test_text_under_three_characters_is_refused_before_a_job_exists(
        self, auth_client
    ):
        r = await auth_client.post("/v1/food-analysis/text", json={"text": "ab"})
        assert r.status_code == 422, r.text

    async def test_i8_the_same_client_key_submits_one_job_not_two(self, auth_client):
        key = str(uuid.uuid4())
        first = _data(await auth_client.post("/v1/food-analysis/text",
                                             json={"text": "2 eggs", "client_id": key}), 202)
        again = _data(await auth_client.post("/v1/food-analysis/text",
                                             json={"text": "2 eggs", "client_id": key}), 202)
        assert first["id"] == again["id"]

    async def test_another_users_analysis_is_not_readable(self, auth_client, client, worker):
        started = _data(await auth_client.post("/v1/food-analysis/text",
                                               json={"text": "2 eggs"}), 202)
        await worker.drain()

        email = f"other-{uuid.uuid4().hex[:8]}@example.com"
        r = await client.post("/v1/auth/register",
                              json={"email": email, "password": "correct-horse-battery"})
        token = r.json()["data"]["access_token"]

        theirs = await client.get(f"/v1/food-analysis/{started['id']}",
                                  headers={"authorization": f"Bearer {token}"})
        assert theirs.status_code == 404, theirs.text
        # A route that does not exist also 404s, so prove the owner can read it.
        assert (await auth_client.get(f"/v1/food-analysis/{started['id']}")).status_code == 200


# ------------------------------------------------------------------ AC-09

class TestImageAnalysis:
    async def test_ac09_a_photo_yields_items_with_quantity_macros_and_confidence(
        self, auth_client, worker, uploaded_image
    ):
        started = _data(await auth_client.post("/v1/food-analysis/image", json={
            "image_key": uploaded_image,
        }), 202)
        await worker.drain()

        analysis = _data(await auth_client.get(f"/v1/food-analysis/{started['id']}"))
        assert analysis["status"] == "completed"
        assert len(analysis["items"]) >= 1
        for item in analysis["items"]:
            assert item["estimated_quantity"] is not None
            assert item["proposed_calories"] is not None
            assert item["confidence"] is not None

    async def test_an_image_key_that_was_never_uploaded_is_refused(self, auth_client):
        r = await auth_client.post("/v1/food-analysis/image",
                                   json={"image_key": "uploads/nope.jpg"})
        assert r.status_code == 422, r.text

    async def test_the_resolver_attaches_a_canonical_food_when_it_can(
        self, auth_client, worker, gateway
    ):
        # H7.1 — the AI path resolves THROUGH the resolver, not around it.
        gateway.result = AnalysisResult(
            schema_version=SCHEMA_VERSION, model_name="stub/text",
            items=[AnalysisItem(
                detected_name="Whole Egg", estimated_quantity=100, estimated_unit="g",
                confidence=0.9, proposed_calories=140, proposed_protein_g=12,
                proposed_carbs_g=1, proposed_fat_g=9,
            )],
            notes=None,
        )
        started = _data(await auth_client.post("/v1/food-analysis/text",
                                               json={"text": "2 eggs"}), 202)
        await worker.drain()

        analysis = _data(await auth_client.get(f"/v1/food-analysis/{started['id']}"))
        assert analysis["items"][0]["resolved_food_id"] is not None

    async def test_an_unresolved_item_keeps_the_models_macros_and_is_flagged(
        self, auth_client, worker, gateway
    ):
        # Ladder step 5 — this is what makes home-cooked food loggable at all.
        gateway.result = AnalysisResult(
            schema_version=SCHEMA_VERSION, model_name="stub/text",
            items=[AnalysisItem(
                detected_name="Nani's Sunday curry", estimated_quantity=300,
                estimated_unit="g", confidence=0.4, proposed_calories=410,
                proposed_protein_g=22, proposed_carbs_g=18, proposed_fat_g=26,
            )],
            notes=None,
        )
        started = _data(await auth_client.post("/v1/food-analysis/text",
                                               json={"text": "nani's curry"}), 202)
        await worker.drain()

        item = _data(await auth_client.get(f"/v1/food-analysis/{started['id']}"))["items"][0]
        assert item["resolved_food_id"] is None
        assert item["proposed_calories"] == pytest.approx(410)


# ------------------------------------------------------------------ AC-10

class TestAC10:
    """The critical one. Byte-identity, not field equality."""

    async def test_ac10_a_correction_confirms_the_meal_and_leaves_the_analysis_untouched(
        self, auth_client, worker, db
    ):
        started = _data(await auth_client.post("/v1/food-analysis/text", json={
            "text": "2 eggs, 3 rotis and 200g chicken curry",
        }), 202)
        await worker.drain()
        analysis = _data(await auth_client.get(f"/v1/food-analysis/{started['id']}"))
        first = analysis["items"][0]

        before = await _fingerprint(db, uuid.UUID(started["id"]))

        corrected_grams = float(first["estimated_quantity"]) + 75.0
        meal = _data(await auth_client.post(
            f"/v1/food-analysis/{started['id']}/confirm",
            json={
                "meal_type": "lunch",
                "items": [{
                    "analysis_item_id": first["id"],
                    "include": True,
                    "quantity_grams": corrected_grams,
                }],
            },
            headers={"Idempotency-Key": str(uuid.uuid4())},
        ), 201)

        # The meal carries the NEW value, confirmed and marked as corrected.
        item = meal["items"][0]
        assert item["confirmed"] is True
        assert item["user_corrected"] is True
        assert item["quantity_grams"] == pytest.approx(corrected_grams)
        assert item["source"] == "text_ai"

        db.expire_all()
        after = await _fingerprint(db, uuid.UUID(started["id"]))
        assert after == before, "the analysis row changed when a correction was confirmed"

    async def test_confirming_without_editing_does_not_claim_a_correction(
        self, auth_client, worker
    ):
        started = _data(await auth_client.post("/v1/food-analysis/text",
                                               json={"text": "2 eggs"}), 202)
        await worker.drain()
        analysis = _data(await auth_client.get(f"/v1/food-analysis/{started['id']}"))
        first = analysis["items"][0]

        meal = _data(await auth_client.post(
            f"/v1/food-analysis/{started['id']}/confirm",
            json={"meal_type": "lunch",
                  "items": [{"analysis_item_id": first["id"], "include": True}]},
            headers={"Idempotency-Key": str(uuid.uuid4())},
        ), 201)

        # Accepting what was proposed is not correcting it. G8 leans on that
        # distinction and so does BRD §13.
        assert meal["items"][0]["user_corrected"] is False
        assert meal["items"][0]["confirmed"] is True

    async def test_an_excluded_item_is_not_written_and_the_analysis_still_has_it(
        self, auth_client, worker, db
    ):
        started = _data(await auth_client.post("/v1/food-analysis/text", json={
            "text": "2 eggs, 3 rotis and 200g chicken curry",
        }), 202)
        await worker.drain()
        analysis = _data(await auth_client.get(f"/v1/food-analysis/{started['id']}"))
        before = await _fingerprint(db, uuid.UUID(started["id"]))

        meal = _data(await auth_client.post(
            f"/v1/food-analysis/{started['id']}/confirm",
            json={"meal_type": "lunch", "items": [
                {"analysis_item_id": analysis["items"][0]["id"], "include": True},
                {"analysis_item_id": analysis["items"][1]["id"], "include": False},
                {"analysis_item_id": analysis["items"][2]["id"], "include": False},
            ]},
            headers={"Idempotency-Key": str(uuid.uuid4())},
        ), 201)

        assert len(meal["items"]) == 1
        db.expire_all()
        # Removing an item from the meal does not remove it from the record.
        assert await _fingerprint(db, uuid.UUID(started["id"])) == before

    async def test_confirming_twice_writes_one_meal(self, auth_client, worker):
        started = _data(await auth_client.post("/v1/food-analysis/text",
                                               json={"text": "2 eggs"}), 202)
        await worker.drain()
        analysis = _data(await auth_client.get(f"/v1/food-analysis/{started['id']}"))
        body = {"meal_type": "lunch", "items": [
            {"analysis_item_id": analysis["items"][0]["id"], "include": True},
        ]}

        first = _data(await auth_client.post(
            f"/v1/food-analysis/{started['id']}/confirm", json=body,
            headers={"Idempotency-Key": str(uuid.uuid4())}), 201)
        again = _data(await auth_client.post(
            f"/v1/food-analysis/{started['id']}/confirm", json=body,
            headers={"Idempotency-Key": str(uuid.uuid4())}), 201)

        # Idempotent on the ANALYSIS, not on a client key: a double tap and a
        # second device are the same event here.
        assert first["id"] == again["id"]
        day = _data(await auth_client.get("/v1/nutrition/day"))
        assert len(day["meals"]) == 1

    async def test_the_database_itself_refuses_an_update_to_an_analysis_item(self, db, auth_client, worker):
        """Append-only is a property of the schema, not of everyone's discipline."""
        _data(await auth_client.post("/v1/food-analysis/text",
                                     json={"text": "2 eggs"}), 202)
        await worker.drain()

        with pytest.raises(Exception) as caught:
            await db.execute(text(
                "UPDATE food_analysis_items SET detected_name = 'tampered'"
            ))
            await db.flush()
        assert "append-only" in str(caught.value).lower()
        await db.rollback()

    async def test_the_database_itself_refuses_a_delete_of_an_analysis_item(self, db, auth_client, worker):
        _data(await auth_client.post("/v1/food-analysis/text",
                                     json={"text": "2 eggs"}), 202)
        await worker.drain()

        with pytest.raises(Exception) as caught:
            await db.execute(text("DELETE FROM food_analysis_items"))
            await db.flush()
        assert "append-only" in str(caught.value).lower()
        await db.rollback()

    @pytest.mark.parametrize("column, value", [
        ("source_text", "'tampered'"),
        ("user_id", "gen_random_uuid()"),
        ("input_type", "'image'"),
        ("model_name", "'someone/else@9'"),
        ("schema_version", "'food_analysis.v99'"),
        ("notes", "'the model never said this'"),
        ("error_code", "'image_unreadable'"),
        ("status", "'pending'"),
        ("created_at", "now() - interval '1 year'"),
    ])
    async def test_the_request_and_the_model_output_cannot_be_rewritten(
        self, db, auth_client, worker, column, value
    ):
        """Every immutable column, not one of them.

        Naming a single column here would pass while a guard on any of the
        others was quietly removed — the same shape of weak test that byte
        identity exists to avoid one level down.
        """
        _data(await auth_client.post("/v1/food-analysis/text",
                                     json={"text": "2 eggs"}), 202)
        await worker.drain()

        with pytest.raises(Exception) as caught:
            await db.execute(text(f"UPDATE food_analyses SET {column} = {value}"))
            await db.flush()
        assert "immutable" in str(caught.value).lower()
        await db.rollback()

    async def test_commentary_cannot_be_invented_for_an_analysis_that_had_none(
        self, db, auth_client, worker
    ):
        """The hole a "guard it once it is set" rule would leave open.

        "2 eggs" produces items and therefore no notes. If the guard were
        "freeze `notes` once it is non-null", a completed analysis with no
        commentary could have commentary written into it afterwards — and the
        audit trail would show the model saying something it never said.
        """
        _data(await auth_client.post("/v1/food-analysis/text",
                                     json={"text": "2 eggs"}), 202)
        await worker.drain()

        with pytest.raises(Exception) as caught:
            await db.execute(text("UPDATE food_analyses SET notes = 'invented'"))
            await db.flush()
        assert "immutable" in str(caught.value).lower()
        await db.rollback()

    async def test_the_status_columns_may_still_move_forward(self, db, auth_client, worker):
        """The other half of the same rule: this row IS a job.

        A trigger that froze the whole row would stop the worker recording that
        it had finished, so the line is drawn between the record and the
        bookkeeping — and both sides of it are asserted.
        """
        _data(await auth_client.post("/v1/food-analysis/text",
                                     json={"text": "2 eggs"}), 202)
        await worker.drain()

        await db.execute(text("UPDATE food_analyses SET attempts = attempts + 1"))
        await db.flush()
        await db.rollback()


# ------------------------------------------------------------ I12 · estimated

class TestEstimatedNeverCounts:
    async def test_an_unconfirmed_estimate_is_in_no_total(self, auth_client, worker):
        _data(await auth_client.post("/v1/food-analysis/text",
                                     json={"text": "2 eggs"}), 202)
        await worker.drain()

        # Nothing has been confirmed, so the day has not moved at all.
        day = _data(await auth_client.get("/v1/nutrition/day"))
        assert day["calories"] == 0
        assert day["meals"] == []

    async def test_confidence_never_confirms_anything_by_itself(
        self, auth_client, worker, gateway
    ):
        # Q7 → no. Confidence is information; it is not permission.
        gateway.result = AnalysisResult(
            schema_version=SCHEMA_VERSION, model_name="stub/text",
            items=[AnalysisItem(
                detected_name="Whole Egg", estimated_quantity=100, estimated_unit="g",
                confidence=1.0, proposed_calories=140, proposed_protein_g=12,
                proposed_carbs_g=1, proposed_fat_g=9,
            )],
            notes=None,
        )
        _data(await auth_client.post("/v1/food-analysis/text",
                                     json={"text": "2 eggs"}), 202)
        await worker.drain()

        day = _data(await auth_client.get("/v1/nutrition/day"))
        assert day["meals"] == [], "a confidence of 1.0 confirmed an item on its own"

    async def test_a_low_confidence_item_is_marked_for_checking(
        self, auth_client, worker, gateway
    ):
        gateway.result = AnalysisResult(
            schema_version=SCHEMA_VERSION, model_name="stub/text",
            items=[AnalysisItem(
                detected_name="Raita", estimated_quantity=100, estimated_unit="g",
                confidence=0.41, proposed_calories=74, proposed_protein_g=3,
                proposed_carbs_g=5, proposed_fat_g=4,
            )],
            notes=None,
        )
        started = _data(await auth_client.post("/v1/food-analysis/text",
                                               json={"text": "raita"}), 202)
        await worker.drain()

        item = _data(await auth_client.get(f"/v1/food-analysis/{started['id']}"))["items"][0]
        # The UI starts it unchecked; the server says which band it is in so the
        # rule lives in one place.
        assert item["low_confidence"] is True


# ------------------------------------------------------- I14 · containment

class TestContainment:
    async def test_a_dead_gateway_fails_the_analysis_with_a_code_and_nothing_else(
        self, auth_client, worker, gateway
    ):
        gateway.fail_with = TimeoutError("connection refused")
        started = _data(await auth_client.post("/v1/food-analysis/text",
                                               json={"text": "2 eggs"}), 202)
        await worker.drain()

        analysis = _data(await auth_client.get(f"/v1/food-analysis/{started['id']}"))
        assert analysis["status"] == "failed"
        assert analysis["error_code"] == "ai_unavailable"

    async def test_i14_the_whole_logger_still_works_with_the_gateway_dead(
        self, auth_client, worker, gateway
    ):
        """The one proof I14 has. Kill the service, then use the app."""
        gateway.fail_with = TimeoutError("connection refused")
        _data(await auth_client.post("/v1/food-analysis/text",
                                     json={"text": "2 eggs"}), 202)
        await worker.drain()

        # A whole workout, start to finish.
        exercises = _data(await auth_client.get("/v1/exercises", params={"limit": 5}))
        session = _data(await auth_client.post("/v1/workout-sessions", json={}), 201)
        # The route returns the whole session, so the session-exercise id
        # comes from the list it just grew.
        with_exercise = _data(await auth_client.post(
            f"/v1/workout-sessions/{session['id']}/exercises",
            json={"exercise_id": exercises[0]["id"]}), 201)
        se_id = with_exercise["exercises"][-1]["id"]
        _data(await auth_client.post(
            f"/v1/session-exercises/{se_id}/sets",
            json={"set_type": "working", "load_kg": 60, "reps": 8, "completed": True},
            headers={"Idempotency-Key": str(uuid.uuid4())}), 201)
        finished = _data(await auth_client.post(
            f"/v1/workout-sessions/{session['id']}/finish", json={}))
        assert finished["status"] == "completed"
        assert finished["total_volume_kg"] == pytest.approx(480.0)

        # History, analytics and manual nutrition, all with the model dead.
        assert _data(await auth_client.get("/v1/history/workouts"))
        assert _data(await auth_client.get("/v1/analytics/workouts")) is not None
        food = _data(await auth_client.post("/v1/foods", json={
            "name": "Oats", "calories": 380, "protein_g": 13, "carbs_g": 67, "fat_g": 7,
        }), 201)
        meal = _data(await auth_client.post("/v1/meals", json={
            "meal_type": "lunch",
            "items": [{"food_id": food["id"], "quantity_grams": 100}],
        }, headers={"Idempotency-Key": str(uuid.uuid4())}), 201)
        assert meal["items"][0]["calories"] == pytest.approx(380)

    async def test_malformed_model_output_is_a_failure_never_a_partial_parse(
        self, auth_client, worker, gateway
    ):
        gateway.raw_override = {"schema_version": "food_analysis.v1", "items": "not a list"}
        started = _data(await auth_client.post("/v1/food-analysis/text",
                                               json={"text": "2 eggs"}), 202)
        await worker.drain()

        analysis = _data(await auth_client.get(f"/v1/food-analysis/{started['id']}"))
        assert analysis["status"] == "failed"
        assert analysis["error_code"] == "ai_invalid_output"
        assert analysis["items"] == []

    async def test_an_unknown_schema_version_is_rejected_rather_than_guessed(
        self, auth_client, worker, gateway
    ):
        gateway.raw_override = {"schema_version": "food_analysis.v99", "items": []}
        started = _data(await auth_client.post("/v1/food-analysis/text",
                                               json={"text": "2 eggs"}), 202)
        await worker.drain()

        analysis = _data(await auth_client.get(f"/v1/food-analysis/{started['id']}"))
        assert analysis["error_code"] == "ai_invalid_output"

    async def test_a_failure_carries_a_request_id_like_every_other_error(self, auth_client):
        # I9 — and this is exactly when someone wants a reference to quote.
        r = await auth_client.post("/v1/food-analysis/text", json={"text": "x"})
        assert r.status_code == 422
        assert r.json()["error"]["request_id"]

    async def test_the_daily_quota_is_stated_and_enforced(self, auth_client, worker, quota):
        quota.limit = 2
        for _ in range(2):
            _data(await auth_client.post("/v1/food-analysis/text",
                                         json={"text": "2 eggs"}), 202)

        r = await auth_client.post("/v1/food-analysis/text", json={"text": "2 eggs"})
        assert r.status_code == 429, r.text
        assert r.json()["error"]["code"] == "QUOTA_EXCEEDED"


# ------------------------------------------------------------------- H-18

class TestAnalysisHistory:
    async def test_it_lists_this_users_analyses_newest_first(self, auth_client, worker):
        for text_in in ["2 eggs", "3 rotis", "200g chicken"]:
            _data(await auth_client.post("/v1/food-analysis/text",
                                         json={"text": text_in}), 202)
            await worker.drain()

        rows = _data(await auth_client.get("/v1/food-analyses"))
        assert len(rows) == 3
        assert rows[0]["source_text"] == "200g chicken"

    async def test_deleting_the_photos_keeps_the_analysis_record(
        self, auth_client, worker, uploaded_image, storage
    ):
        started = _data(await auth_client.post("/v1/food-analysis/image",
                                               json={"image_key": uploaded_image}), 202)
        await worker.drain()

        _data(await auth_client.delete("/v1/food-analyses/images"))

        assert not await storage.exists(uploaded_image)
        analysis = _data(await auth_client.get(f"/v1/food-analysis/{started['id']}"))
        # The record survives; only the photograph is gone (BRD §18 audit).
        assert analysis["image_key"] is None
        assert analysis["status"] == "completed"


# ------------------------------------------- the REAL gateway, genuinely dead

class TestTheRealGatewayFailing:
    """The stub can be told to fail. This proves the real client does too.

    Everything above uses `StubGateway`, which raises on request. That tests the
    worker's handling and not the HTTP client's — so this one points
    `AnthropicGateway` at a closed port and asserts the failure arrives as
    `AIUnavailable` rather than as a `httpx` exception nobody catches.
    """

    async def test_an_unreachable_provider_raises_ai_unavailable(self):
        from app.ai.anthropic import AnthropicGateway
        from app.ai.gateway import AIUnavailable

        gateway = AnthropicGateway(
            api_key="not-a-real-key", model="claude-sonnet-5",
            timeout_seconds=2.0,
            # Port 1 is reserved and nothing listens on it.
            base_url="http://127.0.0.1:1/v1/messages",
        )

        with pytest.raises(AIUnavailable):
            await gateway.analyse_text("2 eggs")

    async def test_the_worker_turns_that_into_a_failed_analysis_and_nothing_else(
        self, auth_client, engine
    ):
        from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

        from app.ai.anthropic import AnthropicGateway
        from app.worker.runner import AnalysisWorker

        started = _data(await auth_client.post("/v1/food-analysis/text",
                                               json={"text": "2 eggs"}), 202)

        dead = AnthropicGateway(
            api_key="not-a-real-key", model="claude-sonnet-5", timeout_seconds=2.0,
            base_url="http://127.0.0.1:1/v1/messages",
        )
        maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
        await AnalysisWorker(maker, gateway=dead).drain()

        analysis = _data(await auth_client.get(f"/v1/food-analysis/{started['id']}"))
        assert analysis["status"] == "failed"
        assert analysis["error_code"] == "ai_unavailable"

        # And the rest of the application is completely unaware of it.
        food = _data(await auth_client.post("/v1/foods", json={
            "name": "Oats", "calories": 380, "protein_g": 13, "carbs_g": 67, "fat_g": 7,
        }), 201)
        _data(await auth_client.post("/v1/meals", json={
            "meal_type": "lunch",
            "items": [{"food_id": food["id"], "quantity_grams": 100}],
        }, headers={"Idempotency-Key": str(uuid.uuid4())}), 201)
        day = _data(await auth_client.get("/v1/nutrition/day"))
        assert day["calories"] == pytest.approx(380)
