"""Account export and deletion (G10).

**This is a legal surface as much as a feature**, and it has one property that
is hard to get right and easy to believe you have: *completeness*.

An export that quietly omits a domain looks correct — the file downloads, it has
data in it, nobody counts. A deletion that leaves rows behind looks correct for
the same reason. So both are asserted **per table, from the schema's own table
list**, which means a table added next year is covered whether or not anybody
remembers this file exists.

The trap the contract names: `food_analysis_items` is **append-only** and
`meal_items.analysis_item_id` references it with `ON DELETE RESTRICT`. Nothing
else in the codebase ever deletes from it, which is exactly why a naive account
delete forgets it — and, because of the RESTRICT, fails loudly rather than
silently. Both halves are tested.
"""
from __future__ import annotations

import uuid
from datetime import UTC, datetime

import pytest
from sqlalchemy import func, select, text

from app.db import Base

pytestmark = pytest.mark.asyncio

#: Tables that belong to no user — the shared catalog. Everything else must be
#: empty of a user's rows after deletion.
GLOBAL_TABLES = {"muscle_groups", "exercises", "exercise_muscles"}


def _data(response, expect: int = 200):
    assert response.status_code == expect, response.text
    return response.json()["data"]


async def _populate(client) -> dict:
    """One row in every domain the app has. If a domain is missing here, the
    completeness assertions below are weaker than they look."""
    out: dict = {}

    exercises = _data(await client.get("/v1/exercises", params={"limit": 1}))

    program = _data(await client.post("/v1/workout-programs", json={"name": "PPL"}), 201)
    program = _data(await client.post(
        f"/v1/workout-programs/{program['id']}/days", json={"name": "Push"}), 201)
    day_id = program["days"][0]["id"]
    _data(await client.put(f"/v1/plan-days/{day_id}/exercises", json=[
        {"exercise_id": exercises[0]["id"], "target_sets": 3},
    ]))
    out["program"] = program

    session = _data(await client.post("/v1/workout-sessions",
                                      json={"plan_day_id": day_id}), 201)
    se_id = session["exercises"][0]["id"]
    _data(await client.post(
        f"/v1/session-exercises/{se_id}/sets",
        json={"set_type": "working", "load_kg": 60, "reps": 8, "completed": True},
        headers={"Idempotency-Key": str(uuid.uuid4())}), 201)
    out["session"] = _data(await client.post(
        f"/v1/workout-sessions/{session['id']}/finish", json={}))

    food = _data(await client.post("/v1/foods", json={
        "name": "Oats", "calories": 380, "protein_g": 13, "carbs_g": 67, "fat_g": 7,
    }), 201)
    out["food"] = food
    out["meal"] = _data(await client.post("/v1/meals", json={
        "meal_type": "lunch",
        "items": [{"food_id": food["id"], "quantity_grams": 100}],
    }, headers={"Idempotency-Key": str(uuid.uuid4())}), 201)

    out["recipe"] = _data(await client.post("/v1/recipes", json={
        "name": "Morning oats", "servings": 2,
        "items": [{"food_id": food["id"], "quantity_grams": 100}],
    }), 201)

    out["goal"] = _data(await client.post("/v1/goals", json={
        "goal_type": "fat_loss", "metric_key": "body_weight", "direction": "down",
        "start_value": 80.0, "target_value": 75.0, "target_unit": "kg",
        "start_date": "2026-09-01",
    }), 201)

    out["metric"] = _data(await client.post("/v1/body-metrics", json={
        "metric_key": "body_weight", "value": 78.4, "unit": "kg",
        "measured_at": datetime(2026, 9, 21, 7, 30, tzinfo=UTC).isoformat(),
    }, headers={"Idempotency-Key": str(uuid.uuid4())}), 201)

    # A dated calorie target (Q8, G10) — its own table.
    _data(await client.patch("/v1/profile", json={"daily_calorie_target": 2200, "protein_g_target": 160}))

    # Warms a daily_summaries row, which nothing else in this fixture writes.
    _data(await client.get("/v1/dashboard"))
    return out


async def _with_analysis(client, worker) -> dict:
    """An analysis, confirmed into a meal — so `meal_items.analysis_item_id`
    actually points at an append-only row and the RESTRICT is live."""
    started = _data(await client.post("/v1/food-analysis/text",
                                      json={"text": "2 eggs, 3 rotis"}), 202)
    await worker.drain()
    analysis = _data(await client.get(f"/v1/food-analysis/{started['id']}"))

    meal = _data(await client.post(
        f"/v1/food-analysis/{started['id']}/confirm",
        json={"meal_type": "breakfast", "items": [
            {"analysis_item_id": analysis["items"][0]["id"], "include": True},
        ]},
        headers={"Idempotency-Key": str(uuid.uuid4())}), 201)
    return {"analysis": analysis, "meal": meal}


async def _user_row_counts(db, user_id: uuid.UUID) -> dict[str, int]:
    """Every table, counted for this user — from the schema's own table list.

    Built from `Base.metadata` rather than a hand-written list, so a table added
    next year is covered whether or not anybody remembers this file exists.
    """
    counts: dict[str, int] = {}
    for name, table in sorted(Base.metadata.tables.items()):
        if name in GLOBAL_TABLES:
            continue
        if "user_id" in table.c:
            column = table.c.user_id
        elif name == "users":
            column = table.c.id
        else:
            # A child table with no user_id of its own — counted through its
            # parent in the join below.
            continue
        counts[name] = await db.scalar(
            select(func.count()).select_from(table).where(column == user_id)
        ) or 0
    return counts


#: Child tables that carry no `user_id`, and the SQL that finds their rows for
#: one user. Listed explicitly because a missed one is exactly the leftover this
#: file exists to catch.
CHILD_TABLE_QUERIES = {
    "session_exercises": """
        SELECT count(*) FROM session_exercises se
        JOIN workout_sessions s ON s.id = se.session_id WHERE s.user_id = :uid""",
    "workout_sets": """
        SELECT count(*) FROM workout_sets w
        JOIN session_exercises se ON se.id = w.session_exercise_id
        JOIN workout_sessions s ON s.id = se.session_id WHERE s.user_id = :uid""",
    "meal_items": """
        SELECT count(*) FROM meal_items mi
        JOIN meals m ON m.id = mi.meal_id WHERE m.user_id = :uid""",
    "recipe_items": """
        SELECT count(*) FROM recipe_items ri
        JOIN recipes r ON r.id = ri.recipe_id WHERE r.user_id = :uid""",
    "food_analysis_items": """
        SELECT count(*) FROM food_analysis_items fai
        JOIN food_analyses fa ON fa.id = fai.analysis_id WHERE fa.user_id = :uid""",
    "plan_exercises": """
        SELECT count(*) FROM plan_exercises pe
        JOIN workout_plan_days d ON d.id = pe.plan_day_id
        JOIN workout_programs p ON p.id = d.program_id WHERE p.user_id = :uid""",
    "workout_plan_days": """
        SELECT count(*) FROM workout_plan_days d
        JOIN workout_programs p ON p.id = d.program_id WHERE p.user_id = :uid""",
}


async def _child_row_counts(db, user_id: uuid.UUID) -> dict[str, int]:
    out: dict[str, int] = {}
    for name, sql in CHILD_TABLE_QUERIES.items():
        out[name] = (await db.execute(text(sql), {"uid": str(user_id)})).scalar() or 0
    return out


class TestExport:
    async def test_it_covers_every_domain(self, auth_client, worker, db):
        await _populate(auth_client)
        await _with_analysis(auth_client, worker)

        archive = _data(await auth_client.get("/v1/account/export"))

        # Named one at a time, because "it has some data" is what a broken
        # export looks like.
        for domain in (
            "profile", "goals", "programs", "sessions", "foods", "meals",
            "meal_categories", "recipes", "body_metrics", "progress_photos",
            "food_analyses", "personal_records",
        ):
            assert domain in archive, f"the export has no {domain}"

        assert archive["profile"]["timezone"]
        assert len(archive["sessions"]) == 1
        assert len(archive["sessions"][0]["exercises"][0]["sets"]) == 1
        assert len(archive["meals"]) == 2
        assert len(archive["goals"]) == 1
        assert len(archive["body_metrics"]) == 1
        assert len(archive["food_analyses"]) == 1
        assert len(archive["food_analyses"][0]["items"]) >= 1

    async def test_every_table_with_rows_is_represented(self, auth_client, worker, db):
        """The completeness check that survives a new table.

        Counts the user's rows table by table, then asserts the export mentions
        each table that has any. A domain added later without an export entry
        fails here rather than being discovered by a user who lost it.
        """
        await _populate(auth_client)
        await _with_analysis(auth_client, worker)
        assert (await auth_client.post("/v1/feedback", json={"message": "hi"})).status_code == 201

        archive = _data(await auth_client.get("/v1/account/export"))
        covered = set(archive.get("_tables", []))

        from app.models import User
        user_id = (await db.scalar(
            select(User).order_by(User.created_at.desc()).limit(1)
        )).id

        counts = {**await _user_row_counts(db, user_id),
                  **await _child_row_counts(db, user_id)}
        populated = {name for name, n in counts.items() if n > 0}

        # Credentials, not data: an emailed link (account_tokens) is a password
        # while it lives, exactly as a refresh token is.
        credentials = {"users", "refresh_tokens", "account_tokens", "push_tokens"}
        missing = populated - covered - credentials - {"daily_summaries"}
        assert not missing, f"these tables have rows and are not in the export: {missing}"

    async def test_it_declares_its_own_format_and_version(self, auth_client):
        archive = _data(await auth_client.get("/v1/account/export"))
        # An archive with no version is an archive nobody can write an importer
        # for later.
        assert archive["format"] == "fitlog.export.v1"
        assert archive["exported_at"]

    async def test_it_carries_no_other_users_data(self, auth_client, client):
        await _populate(auth_client)

        email = f"other-{uuid.uuid4().hex[:8]}@example.com"
        r = await client.post("/v1/auth/register",
                              json={"email": email, "password": "correct-horse-battery"})
        token = r.json()["data"]["access_token"]

        theirs = _data(await client.get("/v1/account/export",
                                        headers={"authorization": f"Bearer {token}"}))
        assert theirs["sessions"] == []
        assert theirs["meals"] == []

    async def test_it_never_contains_a_password_hash_or_a_token(self, auth_client):
        import json

        await _populate(auth_client)
        archive = _data(await auth_client.get("/v1/account/export"))

        blob = json.dumps(archive)
        # An export is a file a user emails to themselves.
        assert "password_hash" not in blob
        assert "$argon2" not in blob
        assert "refresh_token" not in blob


class TestDelete:
    async def test_it_leaves_nothing_behind_in_any_table(self, auth_client, worker, db):
        """The assertion the contract asks for: every table, after deletion."""
        await _populate(auth_client)
        await _with_analysis(auth_client, worker)

        from app.models import User
        user_id = (await db.scalar(
            select(User).order_by(User.created_at.desc()).limit(1)
        )).id

        before = {**await _user_row_counts(db, user_id),
                  **await _child_row_counts(db, user_id)}
        assert sum(before.values()) > 0, "nothing was populated, so this proves nothing"

        _data(await auth_client.post("/v1/account/delete", json={"password": "correct-horse-battery", "confirmation": "DELETE"}))

        db.expire_all()
        after = {**await _user_row_counts(db, user_id),
                 **await _child_row_counts(db, user_id)}
        leftovers = {name: n for name, n in after.items() if n > 0}
        assert not leftovers, f"deletion left rows behind: {leftovers}"

    async def test_the_append_only_analysis_rows_go_too(self, auth_client, worker, db):
        """The trap, named and asserted on its own.

        `food_analysis_items` has no delete path anywhere else in the codebase —
        a trigger forbids it — and `meal_items.analysis_item_id` references it
        with RESTRICT. It is the row most likely to be forgotten.
        """
        await _with_analysis(auth_client, worker)

        from app.models import User
        user_id = (await db.scalar(
            select(User).order_by(User.created_at.desc()).limit(1)
        )).id
        before = await _child_row_counts(db, user_id)
        assert before["food_analysis_items"] > 0

        _data(await auth_client.post("/v1/account/delete", json={"password": "correct-horse-battery", "confirmation": "DELETE"}))

        db.expire_all()
        assert (await _child_row_counts(db, user_id))["food_analysis_items"] == 0

    async def test_the_uploaded_files_go_too(self, auth_client, worker, storage, uploaded_image):
        """Rows are not the only thing a user owns."""
        _data(await auth_client.post("/v1/progress-photos", json={
            "image_key": uploaded_image,
        }, headers={"Idempotency-Key": str(uuid.uuid4())}), 201)
        assert await storage.exists(uploaded_image)

        _data(await auth_client.post("/v1/account/delete", json={"password": "correct-horse-battery", "confirmation": "DELETE"}))

        assert not await storage.exists(uploaded_image)

    async def test_it_refuses_without_the_password(self, auth_client, db):
        await _populate(auth_client)

        r = await auth_client.post("/v1/account/delete", json={"password": "wrong-password", "confirmation": "DELETE"})
        assert r.status_code in (401, 422), r.text

        from app.models import User
        assert await db.scalar(select(func.count()).select_from(User)) > 0

    async def test_the_account_cannot_be_used_afterwards(self, auth_client, client):
        await _populate(auth_client)

        _data(await auth_client.post("/v1/account/delete", json={"password": "correct-horse-battery", "confirmation": "DELETE"}))

        # The token outlives the row it names, so every route has to 401.
        assert (await auth_client.get("/v1/dashboard")).status_code == 401

    async def test_another_users_data_survives(self, auth_client, client, db):
        await _populate(auth_client)

        email = f"survivor-{uuid.uuid4().hex[:8]}@example.com"
        r = await client.post("/v1/auth/register",
                              json={"email": email, "password": "correct-horse-battery"})
        token = r.json()["data"]["access_token"]
        auth = {"authorization": f"Bearer {token}"}
        _data(await client.post("/v1/goals", json={
            "goal_type": "fat_loss", "metric_key": "body_weight", "direction": "down",
            "start_value": 80.0, "target_value": 75.0, "target_unit": "kg",
            "start_date": "2026-09-01",
        }, headers=auth), 201)

        _data(await auth_client.post("/v1/account/delete", json={"password": "correct-horse-battery", "confirmation": "DELETE"}))

        assert len(_data(await client.get("/v1/goals", headers=auth))) == 1


class TestTheSchemaCarriesItsShare:
    """Deletion leans on `ON DELETE CASCADE` for most tables.

    That is fine, and it is written down in `_DELETE_ORDER` — but a dependency
    nobody restates is one FK edit away from being wrong. These assert the
    schema still promises what the delete path assumes, so an FK changed to
    `SET NULL` fails *here*, with a message that says why, rather than showing
    up as an orphaned row in a table nobody queries.
    """

    def test_every_user_owned_table_cascades_from_users(self):
        from app.db import Base

        offenders: list[str] = []
        for name, table in sorted(Base.metadata.tables.items()):
            for fk in table.foreign_keys:
                if fk.column.table.name != "users":
                    continue
                if fk.ondelete != "CASCADE":
                    offenders.append(f"{name}.{fk.parent.name} is {fk.ondelete}")

        assert not offenders, (
            "account deletion assumes these cascade from users: " + ", ".join(offenders)
        )

    def test_the_analysis_reference_is_still_RESTRICT(self):
        """The one that does NOT cascade, and the reason the order matters."""
        from app.db import Base

        meal_items = Base.metadata.tables["meal_items"]
        fk = next(
            f for f in meal_items.foreign_keys
            if f.column.table.name == "food_analysis_items"
        )
        # If this ever became CASCADE, deleting an analysis would silently take
        # a user's confirmed meal items with it.
        assert fk.ondelete == "RESTRICT"


# ------------------------------------------------------------- launch: K-07

class TestDeleteByPost:
    """`POST /v1/account/delete` — the password in the body, never in the URL.

    `DELETE /v1/account?confirm=<password>` put the password in the query
    string, which is the part of a request that access logs, proxies and
    crash reporters keep. The new route is what the app calls; the old one
    stays, deprecated, for any build that still sends it.
    """

    async def test_it_leaves_nothing_behind(self, auth_client, worker, db):
        await _populate(auth_client)
        await _with_analysis(auth_client, worker)

        from app.models import User
        user_id = (await db.scalar(
            select(User).order_by(User.created_at.desc()).limit(1)
        )).id

        out = _data(await auth_client.post("/v1/account/delete", json={
            "password": "correct-horse-battery", "confirmation": "DELETE",
        }))
        assert out["deleted"] is True

        db.expire_all()
        after = {**await _user_row_counts(db, user_id),
                 **await _child_row_counts(db, user_id)}
        assert not {n: c for n, c in after.items() if c}, after
        assert (await auth_client.get("/v1/dashboard")).status_code == 401

    async def test_a_wrong_password_is_a_field_error_and_not_a_401(self, auth_client, db):
        """A 401 tells the app its session died: it refreshes and sends the
        same wrong password again. The session is fine — the field is wrong."""
        r = await auth_client.post("/v1/account/delete", json={
            "password": "not-my-password", "confirmation": "DELETE",
        })
        assert r.status_code == 422, r.text
        assert r.json()["error"]["fields"]["password"]
        assert (await auth_client.get("/v1/auth/me")).status_code == 200

    @pytest.mark.parametrize("word", ["delete", "DELETE ME", ""])
    async def test_the_typed_confirmation_is_checked_by_the_server_too(self, auth_client, word):
        # The screen asks for it; the server asking too means no client can
        # skip the step a person was meant to take.
        r = await auth_client.post("/v1/account/delete", json={
            "password": "correct-horse-battery", "confirmation": word,
        })
        assert r.status_code == 422, r.text
        assert "confirmation" in r.json()["error"]["fields"]
        assert (await auth_client.get("/v1/auth/me")).status_code == 200

    async def test_the_password_never_travels_in_a_url(self, client):
        # The legacy `DELETE /v1/account?confirm=<password>` is gone: an access
        # log would have kept the password (G11 security review).
        spec = (await client.get("/v1/openapi.json")).json()
        assert "delete" not in spec["paths"].get("/v1/account", {})
        post = spec["paths"]["/v1/account/delete"]["post"]
        assert "requestBody" in post
        assert not post.get("parameters"), "the password must not be a parameter"


async def _another_upload(client) -> str:
    signed = (await client.post("/v1/uploads/sign", json={
        "content_type": "image/jpeg", "byte_size": 4096,
    })).json()["data"]
    jpeg = b"\xff\xd8" + b"\xff\xdb\x00\x43" + bytes(65) + b"\xff\xd9"
    put = await client.put(signed["upload_url"], content=jpeg,
                           headers={"content-type": "image/jpeg"})
    assert put.status_code == 200, put.text
    return signed["key"]


class TestDeletePhotos:
    """`DELETE /v1/account/photos` — K-07's "Delete my uploaded photos".

    Every stored image goes, whatever it was for: progress photos (with their
    rows — there is nothing left of a picture once it is gone), food photos
    (the analysis record stays, as H-18 has always promised), and uploads that
    never became either.
    """

    async def _three_kinds(self, client, worker, uploaded_image) -> dict:
        _data(await client.post("/v1/progress-photos", json={"image_key": uploaded_image},
                                headers={"Idempotency-Key": str(uuid.uuid4())}), 201)
        food_key = await _another_upload(client)
        started = _data(await client.post("/v1/food-analysis/image",
                                          json={"image_key": food_key}), 202)
        await worker.drain()
        orphan = await _another_upload(client)
        return {"progress": uploaded_image, "food": food_key, "orphan": orphan,
                "analysis_id": started["id"]}

    async def test_every_stored_image_goes(self, auth_client, worker, storage, uploaded_image):
        keys = await self._three_kinds(auth_client, worker, uploaded_image)

        out = _data(await auth_client.delete("/v1/account/photos"))

        assert out == {"files_deleted": 3, "progress_photos_deleted": 1, "analyses_kept": 1}
        for key in ("progress", "food", "orphan"):
            assert not await storage.exists(keys[key]), f"the {key} image survived"

    async def test_the_rows_that_named_them_are_updated(
        self, auth_client, worker, storage, uploaded_image
    ):
        keys = await self._three_kinds(auth_client, worker, uploaded_image)
        _data(await auth_client.delete("/v1/account/photos"))

        # A progress photo IS its image; the row goes with it.
        assert _data(await auth_client.get("/v1/progress-photos")) == []
        # An analysis is the audit trail (BRD §18); only its photo goes.
        analysis = _data(await auth_client.get(f"/v1/food-analysis/{keys['analysis_id']}"))
        assert analysis["image_key"] is None
        assert analysis["status"] == "completed"

    async def test_confirmed_nutrition_is_kept(self, auth_client, worker, storage, uploaded_image):
        """K-07: deleting food photos "keeps the confirmed nutrition"."""
        started = _data(await auth_client.post("/v1/food-analysis/image",
                                               json={"image_key": uploaded_image}), 202)
        await worker.drain()
        analysis = _data(await auth_client.get(f"/v1/food-analysis/{started['id']}"))
        meal = _data(await auth_client.post(
            f"/v1/food-analysis/{started['id']}/confirm",
            json={"meal_type": "lunch", "items": [
                {"analysis_item_id": analysis["items"][0]["id"], "include": True},
            ]}, headers={"Idempotency-Key": str(uuid.uuid4())}), 201)

        _data(await auth_client.delete("/v1/account/photos"))

        assert _data(await auth_client.get(f"/v1/meals/{meal['id']}"))["items"]

    async def test_it_is_idempotent(self, auth_client, worker, storage, uploaded_image):
        await self._three_kinds(auth_client, worker, uploaded_image)
        _data(await auth_client.delete("/v1/account/photos"))

        again = _data(await auth_client.delete("/v1/account/photos"))
        assert again == {"files_deleted": 0, "progress_photos_deleted": 0, "analyses_kept": 0}

    async def test_nothing_to_delete_is_not_an_error(self, auth_client, storage):
        out = _data(await auth_client.delete("/v1/account/photos"))
        assert out["files_deleted"] == 0

    async def test_another_users_photos_survive(self, auth_client, client, storage, uploaded_image):
        _data(await auth_client.post("/v1/progress-photos", json={"image_key": uploaded_image},
                                     headers={"Idempotency-Key": str(uuid.uuid4())}), 201)

        r = await client.post("/v1/auth/register", json={
            "email": f"bystander-{uuid.uuid4().hex[:8]}@example.com",
            "password": "correct-horse-battery",
        })
        token = r.json()["data"]["access_token"]
        _data(await client.delete("/v1/account/photos",
                                  headers={"authorization": f"Bearer {token}"}))

        assert await storage.exists(uploaded_image)
        assert len(_data(await auth_client.get("/v1/progress-photos"))) == 1


async def test_the_export_names_the_users_own_exercises(auth_client):
    """Sessions point at exercises by id; custom ones must travel with them."""
    group = _data(await auth_client.get("/v1/muscle-groups"))[0]["id"]
    _data(await auth_client.post("/v1/exercises", json={
        "name": "My Odd Lift", "equipment": "other",
        "muscles": [{"muscle_group_id": group, "role": "primary"}],
    }), 201)
    archive = _data(await auth_client.get("/v1/account/export"))
    assert [e["name"] for e in archive["custom_exercises"]] == ["My Odd Lift"]
