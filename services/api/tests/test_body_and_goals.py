"""Body metrics and goal progress (G9).

**Q5 is answered and this file holds it to it: the first weigh-in of a day is
canonical.** Later entries that day are recorded — they are real measurements
and deleting them would be lying — but they do not replace the first. Weight
drifts a kilogram across a day on water alone, and a chart built from "whenever
someone happened to step on the scales" measures hydration, not progress.

The other rule here is **I6**: kilograms and centimetres in storage, converted
at the display edge only.
"""
from __future__ import annotations

import uuid
from datetime import UTC, datetime

import pytest

pytestmark = pytest.mark.asyncio


def _data(response, expect: int = 200):
    assert response.status_code == expect, response.text
    return response.json()["data"]


async def _weigh(client, kg: float, at: datetime, *, expect=201, client_id=None) -> dict:
    body = {
        "metric_key": "body_weight", "value": kg, "unit": "kg",
        "measured_at": at.isoformat(),
    }
    if client_id is not None:
        body["client_id"] = client_id
    return _data(await client.post(
        "/v1/body-metrics", json=body,
        headers={"Idempotency-Key": str(uuid.uuid4())},
    ), expect)


class TestWeighIns:
    async def test_a_weigh_in_round_trips(self, auth_client):
        row = await _weigh(auth_client, 78.4, datetime(2026, 9, 21, 7, 30, tzinfo=UTC))

        assert row["value"] == pytest.approx(78.4)
        assert row["unit"] == "kg"
        assert row["local_date"] == "2026-09-21"

    async def test_q5_the_first_weigh_in_of_the_day_is_canonical(self, auth_client):
        await _weigh(auth_client, 78.4, datetime(2026, 9, 21, 7, 30, tzinfo=UTC))
        await _weigh(auth_client, 79.1, datetime(2026, 9, 21, 19, 0, tzinfo=UTC))

        series = _data(await auth_client.get(
            "/v1/analytics/body?from=2026-09-21&to=2026-09-21"))

        assert len(series["points"]) == 1
        # The morning figure, not the evening one, and not an average of the two.
        assert series["points"][0]["value"] == pytest.approx(78.4)

    async def test_the_later_entry_is_still_recorded(self, auth_client):
        await _weigh(auth_client, 78.4, datetime(2026, 9, 21, 7, 30, tzinfo=UTC))
        await _weigh(auth_client, 79.1, datetime(2026, 9, 21, 19, 0, tzinfo=UTC))

        rows = _data(await auth_client.get("/v1/body-metrics?from=2026-09-21&to=2026-09-21"))
        # Both are real measurements. Only one of them is canonical.
        assert len(rows) == 2
        assert sorted(r["value"] for r in rows) == pytest.approx([78.4, 79.1])

    async def test_the_canonical_entry_is_the_earliest_even_when_logged_out_of_order(
        self, auth_client
    ):
        # Somebody weighs themselves at 07:30, forgets, and logs it after dinner.
        await _weigh(auth_client, 79.1, datetime(2026, 9, 21, 19, 0, tzinfo=UTC))
        await _weigh(auth_client, 78.4, datetime(2026, 9, 21, 7, 30, tzinfo=UTC))

        series = _data(await auth_client.get(
            "/v1/analytics/body?from=2026-09-21&to=2026-09-21"))
        # Earliest MEASURED, not earliest written.
        assert series["points"][0]["value"] == pytest.approx(78.4)

    async def test_i8_a_replayed_weigh_in_is_one_weigh_in(self, auth_client):
        key = str(uuid.uuid4())
        first = await _weigh(auth_client, 78.4, datetime(2026, 9, 21, 7, 30, tzinfo=UTC),
                             client_id=key)
        again = await _weigh(auth_client, 78.4, datetime(2026, 9, 21, 7, 30, tzinfo=UTC),
                             client_id=key)

        assert first["id"] == again["id"]
        rows = _data(await auth_client.get("/v1/body-metrics"))
        assert len(rows) == 1

    async def test_i7_the_day_is_the_profiles_day(self, auth_client):
        _data(await auth_client.patch("/v1/profile", json={"timezone": "Pacific/Auckland"}))
        # 20:00 UTC on the 21st is 08:00 on the 22nd in Auckland.
        row = await _weigh(auth_client, 78.4, datetime(2026, 9, 21, 20, 0, tzinfo=UTC))

        assert row["local_date"] == "2026-09-22"

    async def test_an_implausible_weight_is_refused(self, auth_client):
        r = await auth_client.post("/v1/body-metrics", json={
            "metric_key": "body_weight", "value": 0, "unit": "kg",
            "measured_at": datetime(2026, 9, 21, 7, 30, tzinfo=UTC).isoformat(),
        }, headers={"Idempotency-Key": str(uuid.uuid4())})
        assert r.status_code == 422, r.text

    async def test_pounds_are_converted_to_kilograms_on_the_way_in(self, auth_client):
        """I6 — canonical units in storage, converted at the edge."""
        row = _data(await auth_client.post("/v1/body-metrics", json={
            "metric_key": "body_weight", "value": 170.0, "unit": "lb",
            "measured_at": datetime(2026, 9, 21, 7, 30, tzinfo=UTC).isoformat(),
        }, headers={"Idempotency-Key": str(uuid.uuid4())}), 201)

        assert row["unit"] == "kg"
        assert row["value"] == pytest.approx(77.11, abs=0.01)

    async def test_deleting_one_leaves_the_others(self, auth_client):
        first = await _weigh(auth_client, 78.4, datetime(2026, 9, 21, 7, 30, tzinfo=UTC))
        await _weigh(auth_client, 78.0, datetime(2026, 9, 22, 7, 30, tzinfo=UTC))

        _data(await auth_client.delete(f"/v1/body-metrics/{first['id']}"))

        rows = _data(await auth_client.get("/v1/body-metrics"))
        assert [r["value"] for r in rows] == pytest.approx([78.0])

    async def test_another_users_weigh_in_is_invisible(self, auth_client, client):
        mine = await _weigh(auth_client, 78.4, datetime(2026, 9, 21, 7, 30, tzinfo=UTC))

        email = f"other-{uuid.uuid4().hex[:8]}@example.com"
        r = await client.post("/v1/auth/register",
                              json={"email": email, "password": "correct-horse-battery"})
        token = r.json()["data"]["access_token"]

        theirs = _data(await client.get("/v1/body-metrics",
                                        headers={"authorization": f"Bearer {token}"}))
        assert mine["id"] not in [row["id"] for row in theirs]


class TestBodyAnalytics:
    async def test_it_reports_one_point_per_day_and_the_change_across_the_range(
        self, auth_client
    ):
        for day, kg in [(21, 79.0), (22, 78.6), (23, 78.2)]:
            await _weigh(auth_client, kg, datetime(2026, 9, day, 7, 30, tzinfo=UTC))

        series = _data(await auth_client.get(
            "/v1/analytics/body?from=2026-09-21&to=2026-09-23"))

        assert [p["local_date"] for p in series["points"]] == [
            "2026-09-21", "2026-09-22", "2026-09-23",
        ]
        assert series["change"] == pytest.approx(-0.8)
        assert series["latest"]["value"] == pytest.approx(78.2)

    async def test_a_moving_average_smooths_the_daily_noise(self, auth_client):
        # Water weight moves a kilogram a day. The average is what a person is
        # actually trying to read off the chart.
        for day, kg in [(21, 79.0), (22, 80.0), (23, 78.0)]:
            await _weigh(auth_client, kg, datetime(2026, 9, day, 7, 30, tzinfo=UTC))

        series = _data(await auth_client.get(
            "/v1/analytics/body?from=2026-09-21&to=2026-09-23"))

        assert series["points"][2]["moving_average"] == pytest.approx(79.0)

    async def test_an_empty_range_is_an_empty_series_not_an_error(self, auth_client):
        series = _data(await auth_client.get(
            "/v1/analytics/body?from=2020-01-01&to=2020-01-31"))

        # I13 — a range with nothing in it is a legitimate answer.
        assert series["points"] == []
        assert series["change"] is None
        assert series["latest"] is None


class TestGoalProgress:
    async def test_progress_is_measured_from_where_the_user_started(self, auth_client):
        _data(await auth_client.post("/v1/goals", json={
            "goal_type": "fat_loss", "metric_key": "body_weight", "direction": "down",
            "start_value": 80.0, "target_value": 75.0, "target_unit": "kg",
            "start_date": "2026-09-01",
        }), 201)
        await _weigh(auth_client, 78.5, datetime(2026, 9, 21, 7, 30, tzinfo=UTC))

        rows = _data(await auth_client.get("/v1/goals"))
        # 80 → 75 is 5 kg; 80 → 78.5 is 1.5 of them.
        assert rows[0]["current_value"] == pytest.approx(78.5)
        assert rows[0]["progress"] == pytest.approx(0.3)

    async def test_a_goal_with_no_measurement_yet_has_no_progress_not_zero(
        self, auth_client
    ):
        _data(await auth_client.post("/v1/goals", json={
            "goal_type": "fat_loss", "metric_key": "body_weight", "direction": "down",
            "start_value": 80.0, "target_value": 75.0, "target_unit": "kg",
            "start_date": "2026-09-01",
        }), 201)

        rows = _data(await auth_client.get("/v1/goals"))
        # "Not measured yet" and "no progress" are different statements, and a
        # meter drawn at 0% makes the first read as the second.
        assert rows[0]["current_value"] is None
        assert rows[0]["progress"] is None

    async def test_overshooting_a_goal_reports_complete_not_more_than_complete(
        self, auth_client
    ):
        _data(await auth_client.post("/v1/goals", json={
            "goal_type": "fat_loss", "metric_key": "body_weight", "direction": "down",
            "start_value": 80.0, "target_value": 75.0, "target_unit": "kg",
            "start_date": "2026-09-01",
        }), 201)
        await _weigh(auth_client, 72.0, datetime(2026, 9, 21, 7, 30, tzinfo=UTC))

        rows = _data(await auth_client.get("/v1/goals"))
        assert rows[0]["progress"] == pytest.approx(1.0)

    async def test_moving_the_wrong_way_is_negative_progress_not_clamped_to_zero(
        self, auth_client
    ):
        _data(await auth_client.post("/v1/goals", json={
            "goal_type": "fat_loss", "metric_key": "body_weight", "direction": "down",
            "start_value": 80.0, "target_value": 75.0, "target_unit": "kg",
            "start_date": "2026-09-01",
        }), 201)
        await _weigh(auth_client, 81.0, datetime(2026, 9, 21, 7, 30, tzinfo=UTC))

        rows = _data(await auth_client.get("/v1/goals"))
        # Hiding it behind a 0% meter is how someone finds out in three months.
        assert rows[0]["progress"] < 0


class TestProgressPhotos:
    """I-05. The most personal thing the app stores, so it reuses G8's upload —
    signed, size-capped, and **EXIF stripped on arrival**."""

    async def test_a_photo_is_filed_against_the_day_it_was_taken(
        self, auth_client, uploaded_image
    ):
        row = _data(await auth_client.post("/v1/progress-photos", json={
            "image_key": uploaded_image, "pose": "front",
            "taken_at": datetime(2026, 9, 21, 7, 30, tzinfo=UTC).isoformat(),
        }, headers={"Idempotency-Key": str(uuid.uuid4())}), 201)

        assert row["local_date"] == "2026-09-21"
        assert row["pose"] == "front"

    async def test_a_key_that_is_not_yours_is_refused(self, auth_client):
        r = await auth_client.post("/v1/progress-photos", json={
            "image_key": "uploads/00000000-0000-0000-0000-000000000000/x.jpg",
        }, headers={"Idempotency-Key": str(uuid.uuid4())})
        assert r.status_code == 403, r.text

    async def test_deleting_one_removes_the_file_as_well_as_the_row(
        self, auth_client, uploaded_image, storage
    ):
        row = _data(await auth_client.post("/v1/progress-photos", json={
            "image_key": uploaded_image,
        }, headers={"Idempotency-Key": str(uuid.uuid4())}), 201)
        assert await storage.exists(uploaded_image)

        _data(await auth_client.delete(f"/v1/progress-photos/{row['id']}"))

        # Not an audit record: it is the user's own picture and it goes.
        assert not await storage.exists(uploaded_image)
        assert _data(await auth_client.get("/v1/progress-photos")) == []

    async def test_i8_a_replayed_upload_files_one_photo(self, auth_client, uploaded_image):
        key = str(uuid.uuid4())
        first = _data(await auth_client.post("/v1/progress-photos", json={
            "image_key": uploaded_image, "client_id": key,
        }, headers={"Idempotency-Key": key}), 201)
        again = _data(await auth_client.post("/v1/progress-photos", json={
            "image_key": uploaded_image, "client_id": key,
        }, headers={"Idempotency-Key": key}), 201)

        assert first["id"] == again["id"]
        assert len(_data(await auth_client.get("/v1/progress-photos"))) == 1
