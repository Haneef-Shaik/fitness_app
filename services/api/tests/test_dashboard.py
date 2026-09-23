"""`GET /dashboard` — **AC-11**, and the invariant it would be easiest to break.

**One call, one local date, three domains.** The date is resolved *here*, from
the profile's timezone, and the client is never asked. A phone in a different
timezone from the profile is not a bug the client gets to have an opinion about
(**I7**), and this is the screen where getting it wrong would be least visible:
a day boundary is off by hours, the numbers look plausible, and nobody notices
until someone travels.

The second rule is **I2**: the dashboard is the single most plausible place for
an unconfirmed AI estimate to sneak into a total "because it's just a preview".
It has its own test, and the preview *is* the bug.
"""
from __future__ import annotations

import uuid
from datetime import UTC, datetime, timedelta

import pytest

pytestmark = pytest.mark.asyncio


def _data(response, expect: int = 200):
    assert response.status_code == expect, response.text
    return response.json()["data"]


async def _log_a_workout(client, *, load=60.0, reps=8, started_at=None) -> dict:
    exercises = _data(await client.get("/v1/exercises", params={"limit": 1}))
    body = {} if started_at is None else {"started_at": started_at.isoformat()}
    session = _data(await client.post("/v1/workout-sessions", json=body), 201)
    with_ex = _data(await client.post(
        f"/v1/workout-sessions/{session['id']}/exercises",
        json={"exercise_id": exercises[0]["id"]}), 201)
    se_id = with_ex["exercises"][-1]["id"]
    _data(await client.post(
        f"/v1/session-exercises/{se_id}/sets",
        json={"set_type": "working", "load_kg": load, "reps": reps, "completed": True},
        headers={"Idempotency-Key": str(uuid.uuid4())}), 201)
    return _data(await client.post(f"/v1/workout-sessions/{session['id']}/finish", json={}))


async def _log_a_meal(client, kcal=380.0) -> dict:
    food = _data(await client.post("/v1/foods", json={
        "name": f"Oats {uuid.uuid4().hex[:6]}", "calories": kcal,
        "protein_g": 13, "carbs_g": 67, "fat_g": 7,
    }), 201)
    return _data(await client.post("/v1/meals", json={
        "meal_type": "lunch",
        "items": [{"food_id": food["id"], "quantity_grams": 100}],
    }, headers={"Idempotency-Key": str(uuid.uuid4())}), 201)


async def _weigh(client, kg: float) -> dict:
    return _data(await client.post("/v1/body-metrics", json={
        "metric_key": "body_weight", "value": kg, "unit": "kg",
        "measured_at": datetime.now(UTC).isoformat(),
    }, headers={"Idempotency-Key": str(uuid.uuid4())}), 201)


class TestAC11:
    async def test_ac11_all_three_domains_show_what_was_just_written(self, auth_client):
        await _log_a_workout(auth_client)
        await _log_a_meal(auth_client)
        await _weigh(auth_client, 78.4)

        board = _data(await auth_client.get("/v1/dashboard"))

        assert board["training"]["sessions_today"] == 1
        assert board["training"]["volume_today_kg"] == pytest.approx(480.0)
        assert board["nutrition"]["calories"] == pytest.approx(380.0)
        assert board["body"]["latest"]["value"] == pytest.approx(78.4)

    async def test_it_is_one_call_carrying_every_domain(self, auth_client):
        board = _data(await auth_client.get("/v1/dashboard"))

        # The shape is the promise: a screen that has this has no reason to
        # fan out, and a domain that is missing here is a domain that will.
        for section in ("local_date", "timezone", "training", "nutrition", "body", "goals"):
            assert section in board, f"the dashboard has no {section}"

    async def test_its_nutrition_figures_equal_the_nutrition_endpoint(self, auth_client):
        """The anti-drift check.

        `/nutrition/day` always computes from base tables. If the dashboard's
        cached summary ever disagrees with it, one of them is lying — and this
        is what catches a write path that forgot to invalidate.
        """
        await _log_a_meal(auth_client, kcal=512.0)

        board = _data(await auth_client.get("/v1/dashboard"))
        day = _data(await auth_client.get("/v1/nutrition/day"))

        assert board["nutrition"]["calories"] == pytest.approx(day["calories"])
        assert board["nutrition"]["protein_g"] == pytest.approx(day["protein_g"])

    async def test_a_meal_logged_after_the_first_read_still_shows(self, auth_client):
        """A stale cache is the failure mode a summary table invites."""
        first = _data(await auth_client.get("/v1/dashboard"))
        assert first["nutrition"]["calories"] == 0

        await _log_a_meal(auth_client, kcal=420.0)

        again = _data(await auth_client.get("/v1/dashboard"))
        assert again["nutrition"]["calories"] == pytest.approx(420.0)

    async def test_a_workout_finished_after_the_first_read_still_shows(self, auth_client):
        _data(await auth_client.get("/v1/dashboard"))

        await _log_a_workout(auth_client, load=100.0, reps=5)

        board = _data(await auth_client.get("/v1/dashboard"))
        assert board["training"]["volume_today_kg"] == pytest.approx(500.0)

    async def test_a_weigh_in_after_the_first_read_still_shows(self, auth_client):
        first = _data(await auth_client.get("/v1/dashboard"))
        # "Not weighed today" is a state the screen needs, and it is cached.
        assert first["body"]["today"] is None

        await _weigh(auth_client, 77.2)

        board = _data(await auth_client.get("/v1/dashboard"))
        assert board["body"]["latest"]["value"] == pytest.approx(77.2)
        # From the cached summary — so a write path that forgot to invalidate
        # would still be reporting "not weighed today" after a weigh-in.
        assert board["body"]["today"] == pytest.approx(77.2)

    async def test_the_body_card_separates_the_last_weigh_in_from_todays(
        self, auth_client
    ):
        """An old figure is shown with its date, never as if it were fresh."""
        _data(await auth_client.post("/v1/body-metrics", json={
            "metric_key": "body_weight", "value": 79.0, "unit": "kg",
            "measured_at": (datetime.now(UTC) - timedelta(days=3)).isoformat(),
        }, headers={"Idempotency-Key": str(uuid.uuid4())}), 201)

        board = _data(await auth_client.get("/v1/dashboard"))
        assert board["body"]["latest"]["value"] == pytest.approx(79.0)
        assert board["body"]["today"] is None


class TestTheLocalDateIsTheServersToDecide:
    async def test_the_day_comes_from_the_profile_not_the_device(self, auth_client):
        """The test the trap list asks for: device timezone ≠ profile timezone.

        A client that computed its own "today" would be right for almost every
        user and wrong for exactly the ones who travel — and would fail silently.
        """
        from zoneinfo import ZoneInfo

        _data(await auth_client.patch("/v1/profile", json={"timezone": "Pacific/Auckland"}))

        board = _data(await auth_client.get("/v1/dashboard"))
        expected = datetime.now(UTC).astimezone(ZoneInfo("Pacific/Auckland")).date()
        assert board["local_date"] == expected.isoformat()
        assert board["timezone"] == "Pacific/Auckland"

    async def test_two_profiles_at_the_same_instant_are_on_different_days(
        self, auth_client
    ):
        """The version of the test above that cannot pass by luck.

        Comparing against one timezone only proves anything when UTC and that
        timezone happen to be on different dates, which depends on what time the
        suite runs. Kiritimati (UTC+14) and Niue (UTC-11) are **25 hours apart**,
        so their local dates differ at every instant — a server reading the
        device clock would return the same date for both.
        """
        _data(await auth_client.patch("/v1/profile", json={"timezone": "Pacific/Kiritimati"}))
        east = _data(await auth_client.get("/v1/dashboard"))["local_date"]

        _data(await auth_client.patch("/v1/profile", json={"timezone": "Pacific/Niue"}))
        west = _data(await auth_client.get("/v1/dashboard"))["local_date"]

        assert east != west, "the dashboard is not resolving the day from the profile"

    async def test_a_date_the_client_sends_is_honoured_but_the_default_is_not_the_clients(
        self, auth_client
    ):
        # Asking for a specific day is legitimate (yesterday's dashboard).
        board = _data(await auth_client.get("/v1/dashboard?date=2026-09-21"))
        assert board["local_date"] == "2026-09-21"

    async def test_the_same_instant_lands_on_different_days_for_different_profiles(
        self, auth_client
    ):
        at = datetime(2026, 9, 21, 20, 0, tzinfo=UTC)

        _data(await auth_client.patch("/v1/profile", json={"timezone": "UTC"}))
        _data(await auth_client.post("/v1/body-metrics", json={
            "metric_key": "body_weight", "value": 78.4, "unit": "kg",
            "measured_at": at.isoformat(),
        }, headers={"Idempotency-Key": str(uuid.uuid4())}), 201)
        assert _data(await auth_client.get("/v1/dashboard?date=2026-09-21")
                     )["body"]["latest"] is not None

        _data(await auth_client.patch("/v1/profile", json={"timezone": "Pacific/Auckland"}))
        # The same measurement is now on the 22nd, and the 21st no longer has it.
        assert _data(await auth_client.get("/v1/dashboard?date=2026-09-22")
                     )["body"]["latest"] is not None


class TestABrandNewUser:
    async def test_every_domain_is_empty_and_nothing_404s(self, auth_client):
        """The FIRST dashboard anybody sees has three empty domains."""
        response = await auth_client.get("/v1/dashboard")
        assert response.status_code == 200, response.text
        board = response.json()["data"]

        assert board["training"]["sessions_today"] == 0
        assert board["training"]["last_session"] is None
        assert board["nutrition"]["calories"] == 0
        assert board["nutrition"]["meals_logged"] == 0
        assert board["body"]["latest"] is None
        assert board["goals"] == []

    async def test_one_empty_domain_never_blanks_the_others(self, auth_client):
        await _log_a_meal(auth_client)

        board = _data(await auth_client.get("/v1/dashboard"))

        assert board["nutrition"]["calories"] > 0
        # Training and body are empty; nutrition is not affected by that.
        assert board["training"]["sessions_today"] == 0
        assert board["body"]["latest"] is None

    async def test_targets_are_reported_so_the_screen_need_not_fetch_the_profile(
        self, auth_client
    ):
        _data(await auth_client.patch("/v1/profile", json={
            "daily_calorie_target": 2400, "protein_g_target": 180,
        }))

        board = _data(await auth_client.get("/v1/dashboard"))
        assert board["nutrition"]["targets"]["calories"] == 2400
        assert board["nutrition"]["targets"]["protein_g"] == 180


class TestI2OnTheDashboard:
    async def test_an_unconfirmed_estimate_is_shown_and_counted_nowhere(
        self, auth_client, worker
    ):
        _data(await auth_client.post("/v1/food-analysis/text",
                                     json={"text": "2 eggs"}), 202)
        await worker.drain()

        board = _data(await auth_client.get("/v1/dashboard"))

        # The analysis exists and has moved nothing. The preview IS the bug.
        assert board["nutrition"]["calories"] == 0
        assert board["nutrition"]["meals_logged"] == 0

    async def test_an_unconfirmed_meal_item_is_surfaced_as_pending_not_as_calories(
        self, auth_client
    ):
        food = _data(await auth_client.post("/v1/foods", json={
            "name": "Curry", "calories": 400, "protein_g": 20, "carbs_g": 30, "fat_g": 20,
        }), 201)
        _data(await auth_client.post("/v1/meals", json={
            "meal_type": "dinner",
            "items": [{"food_id": food["id"], "quantity_grams": 200, "confirmed": False,
                       "source": "text_ai"}],
        }, headers={"Idempotency-Key": str(uuid.uuid4())}), 201)

        board = _data(await auth_client.get("/v1/dashboard"))

        assert board["nutrition"]["calories"] == 0
        assert board["nutrition"]["pending_count"] == 1


class TestTheTrainingCard:
    async def test_it_names_the_last_session_so_the_card_is_not_blank_on_a_rest_day(
        self, auth_client
    ):
        await _log_a_workout(auth_client)

        board = _data(await auth_client.get("/v1/dashboard"))
        assert board["training"]["last_session"]["id"] is not None
        assert board["training"]["last_session"]["total_volume_kg"] == pytest.approx(480.0)

    async def test_an_in_progress_session_is_surfaced_so_resume_is_reachable(
        self, auth_client
    ):
        session = _data(await auth_client.post("/v1/workout-sessions", json={}), 201)

        board = _data(await auth_client.get("/v1/dashboard"))
        # G4's lesson: a screen reachable only by typing a URL is not reachable.
        assert board["training"]["active_session_id"] == session["id"]

    async def test_the_streak_counts_consecutive_days_with_a_session(self, auth_client):
        await _log_a_workout(auth_client)

        board = _data(await auth_client.get("/v1/dashboard"))
        assert board["training"]["streak_days"] == 1

    async def test_the_streak_is_consecutive_days_not_a_count_of_days(self, auth_client):
        """Three sessions, two days, a gap between them — the streak is 1.

        A count of training days would say 2 and be wrong in the direction that
        flatters, which is the direction nobody questions.
        """
        today = datetime.now(UTC)
        for offset in (0, 4, 5):
            await _log_a_workout(auth_client, started_at=today - timedelta(days=offset))

        board = _data(await auth_client.get("/v1/dashboard"))
        assert board["training"]["streak_days"] == 1

    async def test_yesterday_still_counts_because_today_is_not_over(self, auth_client):
        today = datetime.now(UTC)
        for offset in (1, 2):
            await _log_a_workout(auth_client, started_at=today - timedelta(days=offset))

        board = _data(await auth_client.get("/v1/dashboard"))
        # A streak that reset at midnight would punish somebody for not having
        # trained yet at 09:00, which is the opposite of what a streak is for.
        assert board["training"]["streak_days"] == 2

    async def test_the_week_figures_cover_the_profiles_week(self, auth_client):
        await _log_a_workout(auth_client)
        await _log_a_workout(auth_client, load=100.0, reps=5)

        board = _data(await auth_client.get("/v1/dashboard"))
        assert board["training"]["sessions_this_week"] == 2
        assert board["training"]["volume_this_week_kg"] == pytest.approx(980.0)


class TestTheBodyCardsChangeFigures:
    async def test_a_single_weigh_in_has_no_change_to_report(self, auth_client):
        await _weigh(auth_client, 78.4)

        board = _data(await auth_client.get("/v1/dashboard"))
        # None, not 0. "We have only weighed you once" and "you have not
        # changed" are different statements, and 0 makes the first read as the
        # second — on the card somebody checks most often.
        assert board["body"]["change_7d"] is None
        assert board["body"]["change_30d"] is None

    async def test_it_reports_the_change_since_the_start_of_the_window(self, auth_client):
        _data(await auth_client.post("/v1/body-metrics", json={
            "metric_key": "body_weight", "value": 80.0, "unit": "kg",
            "measured_at": (datetime.now(UTC) - timedelta(days=5)).isoformat(),
        }, headers={"Idempotency-Key": str(uuid.uuid4())}), 201)
        await _weigh(auth_client, 78.5)

        board = _data(await auth_client.get("/v1/dashboard"))
        assert board["body"]["change_7d"] == pytest.approx(-1.5)

    async def test_a_baseline_outside_the_window_is_not_borrowed_for_it(self, auth_client):
        _data(await auth_client.post("/v1/body-metrics", json={
            "metric_key": "body_weight", "value": 82.0, "unit": "kg",
            "measured_at": (datetime.now(UTC) - timedelta(days=20)).isoformat(),
        }, headers={"Idempotency-Key": str(uuid.uuid4())}), 201)
        await _weigh(auth_client, 78.5)

        board = _data(await auth_client.get("/v1/dashboard"))
        # Twenty days ago is in the 30-day window and not in the 7-day one.
        assert board["body"]["change_7d"] is None
        assert board["body"]["change_30d"] == pytest.approx(-3.5)


class TestTheSummaryCacheIsNeverTheSourceOfTruth:
    async def test_a_summary_row_that_disagrees_with_the_base_tables_is_discarded(
        self, auth_client, db
    ):
        """02 §4.4 — a disagreement resolves in favour of the base tables.

        Written as a direct attack: corrupt the cache behind the API's back and
        check the dashboard still tells the truth.
        """
        from sqlalchemy import text

        await _log_a_meal(auth_client, kcal=380.0)
        board = _data(await auth_client.get("/v1/dashboard"))
        assert board["nutrition"]["calories"] == pytest.approx(380.0)

        await db.execute(text("UPDATE daily_summaries SET calories = 99999"))
        await db.commit()

        # The row is stale by definition the moment anything under it moves, so
        # the next write invalidates it rather than the read trusting it.
        await _log_a_meal(auth_client, kcal=120.0)
        again = _data(await auth_client.get("/v1/dashboard"))
        assert again["nutrition"]["calories"] == pytest.approx(500.0)


class TestChangingTimezone:
    """Edge case T4 — the one the M2 model comment claimed was handled.

    `workout_sessions.local_date` has said "recomputed for the affected rows
    when a user changes their profile timezone" since M2. It was not, and G9
    found it, because **I7** is the invariant this goal turns on: a dashboard
    that resolves "today" correctly while the rows underneath it are still
    bucketed by a timezone the user no longer lives in is only half true.
    """

    async def test_history_is_refiled_onto_the_days_it_now_falls_on(self, auth_client):
        _data(await auth_client.patch("/v1/profile", json={"timezone": "UTC"}))
        _data(await auth_client.post("/v1/body-metrics", json={
            "metric_key": "body_weight", "value": 78.4, "unit": "kg",
            # 20:00 UTC on the 21st. In Auckland that is 08:00 on the 22nd.
            "measured_at": datetime(2026, 9, 21, 20, 0, tzinfo=UTC).isoformat(),
        }, headers={"Idempotency-Key": str(uuid.uuid4())}), 201)
        rows = _data(await auth_client.get("/v1/body-metrics"))
        assert rows[0]["local_date"] == "2026-09-21"

        _data(await auth_client.patch("/v1/profile", json={"timezone": "Pacific/Auckland"}))

        rows = _data(await auth_client.get("/v1/body-metrics"))
        # The instant did not move. The day it is filed under did.
        assert rows[0]["local_date"] == "2026-09-22"
        assert rows[0]["measured_at"].startswith("2026-09-21T20:00")

    async def test_a_meal_moves_with_it(self, auth_client):
        _data(await auth_client.patch("/v1/profile", json={"timezone": "UTC"}))
        food = _data(await auth_client.post("/v1/foods", json={
            "name": "Oats", "calories": 380, "protein_g": 13, "carbs_g": 67, "fat_g": 7,
        }), 201)
        _data(await auth_client.post("/v1/meals", json={
            "meal_type": "dinner",
            "consumed_at": datetime(2026, 9, 21, 20, 0, tzinfo=UTC).isoformat(),
            "items": [{"food_id": food["id"], "quantity_grams": 100}],
        }, headers={"Idempotency-Key": str(uuid.uuid4())}), 201)
        assert _data(await auth_client.get("/v1/dashboard?date=2026-09-21")
                     )["nutrition"]["calories"] == pytest.approx(380.0)

        _data(await auth_client.patch("/v1/profile", json={"timezone": "Pacific/Auckland"}))

        # It is Wednesday's dinner now, and Tuesday no longer has it.
        assert _data(await auth_client.get("/v1/dashboard?date=2026-09-22")
                     )["nutrition"]["calories"] == pytest.approx(380.0)
        assert _data(await auth_client.get("/v1/dashboard?date=2026-09-21")
                     )["nutrition"]["calories"] == 0

    async def test_the_cached_summaries_do_not_survive_the_move(self, auth_client):
        """The reason this is in the dashboard's test file and not the profile's.

        Warm the cache on the old boundaries, move the boundary, and check the
        cached day is gone rather than still reporting yesterday's meal.
        """
        _data(await auth_client.patch("/v1/profile", json={"timezone": "UTC"}))
        food = _data(await auth_client.post("/v1/foods", json={
            "name": "Rice", "calories": 130, "protein_g": 2, "carbs_g": 28, "fat_g": 0,
        }), 201)
        _data(await auth_client.post("/v1/meals", json={
            "meal_type": "dinner",
            "consumed_at": datetime(2026, 9, 21, 20, 0, tzinfo=UTC).isoformat(),
            "items": [{"food_id": food["id"], "quantity_grams": 200}],
        }, headers={"Idempotency-Key": str(uuid.uuid4())}), 201)

        # Warm both days into the cache while the old boundary is in force.
        _data(await auth_client.get("/v1/dashboard?date=2026-09-21"))
        _data(await auth_client.get("/v1/dashboard?date=2026-09-22"))

        _data(await auth_client.patch("/v1/profile", json={"timezone": "Pacific/Auckland"}))

        assert _data(await auth_client.get("/v1/dashboard?date=2026-09-21")
                     )["nutrition"]["calories"] == 0
        assert _data(await auth_client.get("/v1/dashboard?date=2026-09-22")
                     )["nutrition"]["calories"] == pytest.approx(260.0)

    async def test_an_unknown_timezone_is_refused_before_anything_moves(self, auth_client):
        _data(await auth_client.patch("/v1/profile", json={"timezone": "UTC"}))
        _data(await auth_client.post("/v1/body-metrics", json={
            "metric_key": "body_weight", "value": 78.4, "unit": "kg",
            "measured_at": datetime(2026, 9, 21, 20, 0, tzinfo=UTC).isoformat(),
        }, headers={"Idempotency-Key": str(uuid.uuid4())}), 201)

        r = await auth_client.patch("/v1/profile", json={"timezone": "Middle/Earth"})
        assert r.status_code == 422, r.text

        rows = _data(await auth_client.get("/v1/body-metrics"))
        assert rows[0]["local_date"] == "2026-09-21"
