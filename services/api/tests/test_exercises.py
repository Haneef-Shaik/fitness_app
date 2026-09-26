"""Catalog API — §2 of the M2 task list."""
from __future__ import annotations

import pytest

from tests.auth import sign_up

pytestmark = pytest.mark.asyncio


async def _muscle(client, slug: str) -> str:
    rows = (await client.get("/v1/muscle-groups")).json()["data"]
    return next(m["id"] for m in rows if m["slug"] == slug)


async def test_muscle_groups_are_hierarchical(auth_client):
    rows = (await auth_client.get("/v1/muscle-groups")).json()["data"]
    by_slug = {m["slug"]: m for m in rows}
    assert by_slug["chest"]["parent_id"] is None
    assert by_slug["upper-chest"]["parent_id"] == by_slug["chest"]["id"]


async def test_search_matches_name_and_alias(auth_client):
    by_name = (await auth_client.get("/v1/exercises", params={"q": "Barbell Bench"})).json()["data"]
    assert any(e["name"] == "Barbell Bench Press" for e in by_name)

    # "bench" is only an alias of Barbell Bench Press, not part of every name.
    by_alias = (await auth_client.get("/v1/exercises", params={"q": "bench"})).json()["data"]
    assert any(e["name"] == "Barbell Bench Press" for e in by_alias)


async def test_filter_by_muscle_and_equipment(auth_client):
    chest = (await auth_client.get("/v1/exercises", params={"muscle": "chest"})).json()["data"]
    assert chest and all(
        any(m["slug"] == "chest" for m in e["muscles"]) for e in chest
    )

    barbell = (await auth_client.get("/v1/exercises", params={"equipment": "barbell"})).json()["data"]
    assert barbell and all(e["equipment"] == "barbell" for e in barbell)


async def test_create_custom_exercise(auth_client):
    quads, hams = await _muscle(auth_client, "quads"), await _muscle(auth_client, "hamstrings")
    r = await auth_client.post("/v1/exercises", json={
        "name": "Sissy Squat", "equipment": "bodyweight", "movement_pattern": "squat",
        "aliases": ["sissy"],
        "muscles": [{"muscle_group_id": quads, "role": "primary"},
                    {"muscle_group_id": hams, "role": "secondary"}],
        "tracks_load": False, "tracks_reps": True,
    })
    assert r.status_code == 201
    data = r.json()["data"]
    assert data["is_custom"] is True
    assert {m["role"] for m in data["muscles"]} == {"primary", "secondary"}


async def test_custom_exercise_requires_a_primary_muscle(auth_client):
    hams = await _muscle(auth_client, "hamstrings")
    r = await auth_client.post("/v1/exercises", json={
        "name": "No Primary", "muscles": [{"muscle_group_id": hams, "role": "secondary"}],
    })
    assert r.status_code == 422
    assert "primary muscle" in str(r.json()["error"]["fields"])


async def test_exercise_must_track_something(auth_client):
    quads = await _muscle(auth_client, "quads")
    r = await auth_client.post("/v1/exercises", json={
        "name": "Tracks Nothing",
        "muscles": [{"muscle_group_id": quads, "role": "primary"}],
        "tracks_reps": False, "tracks_duration": False, "tracks_distance": False,
    })
    assert r.status_code == 422


async def test_global_exercises_are_read_only(auth_client):
    listed = (await auth_client.get("/v1/exercises", params={"q": "Barbell Bench Press"})).json()["data"]
    global_id = next(e["id"] for e in listed if not e["is_custom"])

    r = await auth_client.patch(f"/v1/exercises/{global_id}", json={"name": "Hijacked"})
    assert r.status_code == 403
    assert "built-in" in r.json()["error"]["message"]

    r = await auth_client.post(f"/v1/exercises/{global_id}/archive")
    assert r.status_code == 403


async def test_archive_hides_from_the_default_list_but_keeps_the_record(auth_client):
    quads = await _muscle(auth_client, "quads")
    created = (await auth_client.post("/v1/exercises", json={
        "name": "Temp Movement", "muscles": [{"muscle_group_id": quads, "role": "primary"}],
    })).json()["data"]

    assert (await auth_client.post(f"/v1/exercises/{created['id']}/archive")).status_code == 200

    default = (await auth_client.get("/v1/exercises", params={"mine": True})).json()["data"]
    assert all(e["id"] != created["id"] for e in default)

    with_archived = (await auth_client.get(
        "/v1/exercises", params={"mine": True, "include_archived": True})).json()["data"]
    assert any(e["id"] == created["id"] for e in with_archived)

    # The record itself is untouched — history must keep resolving it.
    still = await auth_client.get(f"/v1/exercises/{created['id']}")
    assert still.status_code == 200 and still.json()["data"]["status"] == "archived"


async def test_cannot_see_another_users_custom_exercise(client, auth_client):
    quads = await _muscle(auth_client, "quads")
    mine = (await auth_client.post("/v1/exercises", json={
        "name": "Private Movement", "muscles": [{"muscle_group_id": quads, "role": "primary"}],
    })).json()["data"]

    import uuid
    other = await sign_up(client, json={
        "email": f"other-{uuid.uuid4().hex[:8]}@example.com", "password": "correct-horse-battery",
    })
    token = other.json()["data"]["access_token"]
    headers = {"authorization": f"Bearer {token}"}

    r = await auth_client.get(f"/v1/exercises/{mine['id']}", headers=headers)
    assert r.status_code == 403

    listed = (await auth_client.get("/v1/exercises", headers=headers)).json()["data"]
    assert all(e["id"] != mine["id"] for e in listed)
