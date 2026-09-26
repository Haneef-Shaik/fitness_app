"""K-08 · AI preferences — what the app tells a person about the AI (launch).

`GET /v1/food-analysis/settings` answers the questions K-08 has to answer
before anybody takes a photo: how many analyses are left today and when that
resets, **who receives the photo**, and what "low confidence" means. The
provider comes from configuration, never from a constant in the app, so the
disclosure cannot drift from where photos actually go.
"""
from __future__ import annotations

from datetime import UTC, datetime, timedelta
from zoneinfo import ZoneInfo

import pytest

pytestmark = pytest.mark.asyncio


def _data(response, expect: int = 200):
    assert response.status_code == expect, response.text
    return response.json()["data"]


async def test_it_needs_a_session(client):
    client.headers.pop("authorization", None)
    assert (await client.get("/v1/food-analysis/settings")).status_code == 401


async def test_the_stub_says_nothing_leaves_the_server(auth_client):
    out = _data(await auth_client.get("/v1/food-analysis/settings"))
    assert out["provider"] == "stub"
    assert out["sends_to_provider"] is False
    assert out["model"] == "stub/deterministic@1"
    assert out["low_confidence_threshold"] == 0.5
    assert set(out["quota"]) == {"used", "limit", "remaining", "resets_at"}


async def test_a_real_provider_is_named_with_its_model(auth_client, monkeypatch):
    from app.config import get_settings

    settings = get_settings()
    monkeypatch.setattr(settings, "ai_provider", "anthropic")
    monkeypatch.setattr(settings, "ai_model", "claude-sonnet-5")

    out = _data(await auth_client.get("/v1/food-analysis/settings"))
    assert out["provider"] == "anthropic"
    assert out["provider_name"] == "Anthropic"
    assert out["model"] == "claude-sonnet-5"
    # K-08 states this plainly: a photo goes to somebody else's computer.
    assert out["sends_to_provider"] is True


async def test_usage_counts_todays_analyses(auth_client, quota):
    quota.limit = 5
    for text_in in ("2 eggs", "1 roti"):
        _data(await auth_client.post("/v1/food-analysis/text", json={"text": text_in}), 202)

    out = _data(await auth_client.get("/v1/food-analysis/settings"))["quota"]
    assert (out["used"], out["limit"], out["remaining"]) == (2, 5, 3)


async def test_the_quota_resets_at_the_users_own_midnight(auth_client):
    """I7 — "a quota that resets at UTC midnight resets in the middle of
    dinner for half the world". The day started at local midnight, but the
    arithmetic treated that date's midnight as UTC: for Kolkata the reset was
    05:30 in the morning and the first five and a half hours counted for the
    day before. Found building K-08, which shows the time."""
    _data(await auth_client.patch("/v1/profile", json={"timezone": "Asia/Kolkata"}))

    out = _data(await auth_client.get("/v1/food-analysis/settings"))["quota"]

    zone = ZoneInfo("Asia/Kolkata")
    today = datetime.now(UTC).astimezone(zone).date()
    midnight = datetime.combine(today + timedelta(days=1), datetime.min.time(), tzinfo=zone)
    assert datetime.fromisoformat(out["resets_at"]) == midnight


async def test_the_quota_endpoint_agrees(auth_client):
    # H-06 and H-09 read the older endpoint; both must say the same thing.
    _data(await auth_client.patch("/v1/profile", json={"timezone": "America/Los_Angeles"}))
    a = _data(await auth_client.get("/v1/food-analysis/quota"))
    b = _data(await auth_client.get("/v1/food-analysis/settings"))["quota"]
    assert a == b
