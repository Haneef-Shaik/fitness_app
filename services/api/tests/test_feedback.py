"""In-app feedback: stored with the request id that ties it to the server log."""
from __future__ import annotations

import pytest

pytestmark = pytest.mark.asyncio


def _data(response, expect: int = 200):
    assert response.status_code == expect, response.text
    return response.json()["data"]


async def test_a_problem_report_is_kept_with_its_request_id(auth_client):
    out = _data(await auth_client.post("/v1/feedback", json={
        "category": "problem", "message": "  The meal didn't save.  ",
        "app_version": "1.0.0 (12)", "platform": "android 16", "request_id": "req_abc123",
    }), 201)
    assert out["message"] == "The meal didn't save."
    assert out["request_id"] == "req_abc123"


@pytest.mark.parametrize("body", [{"message": "   "}, {"message": ""}, {"message": "x" * 2001},
                                  {"message": "ok", "category": "rant"}])
async def test_an_empty_or_oversized_report_is_refused(auth_client, body):
    assert (await auth_client.post("/v1/feedback", json=body)).status_code == 422


async def test_feedback_needs_an_account(client):
    assert (await client.post("/v1/feedback", json={"message": "hi"})).status_code == 401


async def test_the_operator_reads_reports_newest_first(auth_client):
    _data(await auth_client.post("/v1/feedback", json={"message": "first"}), 201)
    second = _data(await auth_client.post("/v1/feedback", json={"message": "second"}), 201)
    listed = _data(await auth_client.get("/v1/admin/feedback", params={"limit": 5}))
    assert listed[0]["id"] == second["id"]


async def test_product_metrics_are_an_operator_read(auth_client):
    out = _data(await auth_client.get("/v1/admin/product-metrics"))
    assert "d7_nutrition_retention" in out and "sessions_lost" in out
