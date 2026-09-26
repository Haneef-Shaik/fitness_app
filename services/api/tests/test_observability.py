"""RED metrics and the alert table ([02 §9], G10).

**An alert nobody has seen fire is a configuration file.** So the rules are not
a YAML document that a monitoring system may or may not be reading — they are
evaluated in-process against the same counters the `/metrics` endpoint exports,
and `scripts/trigger-alert.sh` makes one of them fire on demand.

The thing that would make all of this worthless is a metric that is never
recorded on the path it claims to watch. Each test below drives a **real
request** and then reads the counter, rather than calling the recorder directly.
"""
from __future__ import annotations

import uuid

import pytest

pytestmark = pytest.mark.asyncio


def _data(response, expect: int = 200):
    assert response.status_code == expect, response.text
    return response.json()["data"]


def _metric(body: str, name: str, **labels) -> float:
    """One sample out of the Prometheus text exposition, by name and labels."""
    wanted = {k: str(v) for k, v in labels.items()}
    for line in body.splitlines():
        if line.startswith("#") or not line.startswith(name):
            continue
        head, _, value = line.rpartition(" ")
        if "{" in head:
            inner = head[head.index("{") + 1: head.rindex("}")]
            got = {
                p.split("=", 1)[0]: p.split("=", 1)[1].strip('"')
                for p in inner.split(",") if "=" in p
            }
            if head[: head.index("{")] != name:
                continue
        else:
            got = {}
            if head != name:
                continue
        if all(got.get(k) == v for k, v in wanted.items()):
            return float(value)
    return 0.0


class TestRED:
    async def test_every_request_counts_rate_errors_and_duration(self, auth_client):
        await auth_client.get("/v1/exercises", params={"limit": 1})

        body = (await auth_client.get("/metrics")).text

        # Rate, errors and duration — the three, on a route that was really hit.
        assert _metric(body, "fitlog_http_requests_total",
                       route="/v1/exercises", method="GET", status="2xx") >= 1
        assert _metric(body, "fitlog_http_request_duration_seconds_count",
                       route="/v1/exercises", method="GET") >= 1

    async def test_the_route_label_is_the_TEMPLATE_not_the_path(self, auth_client):
        """`/v1/goals/{goal_id}`, not `/v1/goals/8f2a…`.

        A label carrying an id gives one time series per row, which is how a
        metrics backend falls over and how a p95 becomes meaningless.
        """
        goal = _data(await auth_client.post("/v1/goals", json={
            "goal_type": "fat_loss", "metric_key": "body_weight", "direction": "down",
            "start_value": 80.0, "target_value": 75.0, "target_unit": "kg",
            "start_date": "2026-09-01",
        }), 201)
        await auth_client.get(f"/v1/goals/{goal['id']}")

        body = (await auth_client.get("/metrics")).text
        assert _metric(body, "fitlog_http_requests_total",
                       route="/v1/goals/{goal_id}", method="GET", status="2xx") >= 1
        assert str(goal["id"]) not in body

    async def test_a_4xx_is_counted_as_a_4xx_and_not_as_an_error(self, auth_client):
        await auth_client.get(f"/v1/goals/{uuid.uuid4()}")

        body = (await auth_client.get("/metrics")).text
        # A 404 is the API working. Counting it as an error is how a dashboard
        # cries wolf until nobody looks at it.
        assert _metric(body, "fitlog_http_requests_total",
                       route="/v1/goals/{goal_id}", method="GET", status="4xx") >= 1

    async def test_set_commits_are_counted_separately(self, auth_client):
        """The core loop gets its own counter, because its alert threshold is
        five times tighter than everything else's (02 §9)."""
        exercises = _data(await auth_client.get("/v1/exercises", params={"limit": 1}))
        session = _data(await auth_client.post("/v1/workout-sessions", json={}), 201)
        with_ex = _data(await auth_client.post(
            f"/v1/workout-sessions/{session['id']}/exercises",
            json={"exercise_id": exercises[0]["id"]}), 201)
        se_id = with_ex["exercises"][-1]["id"]
        _data(await auth_client.post(
            f"/v1/session-exercises/{se_id}/sets",
            json={"set_type": "working", "load_kg": 60, "reps": 8, "completed": True},
            headers={"Idempotency-Key": str(uuid.uuid4())}), 201)

        body = (await auth_client.get("/metrics")).text
        assert _metric(body, "fitlog_set_commits_total", outcome="ok") >= 1

    async def test_a_failed_set_commit_is_counted_as_one(self, auth_client):
        exercises = _data(await auth_client.get("/v1/exercises", params={"limit": 1}))
        session = _data(await auth_client.post("/v1/workout-sessions", json={}), 201)
        with_ex = _data(await auth_client.post(
            f"/v1/workout-sessions/{session['id']}/exercises",
            json={"exercise_id": exercises[0]["id"]}), 201)
        se_id = with_ex["exercises"][-1]["id"]

        # Reps below 1 — the exact failure L-02's wireframe shows.
        r = await auth_client.post(
            f"/v1/session-exercises/{se_id}/sets",
            json={"set_type": "working", "load_kg": 60, "reps": 0, "completed": True},
            headers={"Idempotency-Key": str(uuid.uuid4())})
        assert r.status_code == 422

        body = (await auth_client.get("/metrics")).text
        assert _metric(body, "fitlog_set_commits_total", outcome="failed") >= 1

    async def test_ai_analyses_are_counted_by_outcome(self, auth_client, worker, gateway):
        from app.ai.gateway import AIUnavailable

        _data(await auth_client.post("/v1/food-analysis/text",
                                     json={"text": "2 eggs"}), 202)
        await worker.drain()

        gateway.fail_with = AIUnavailable("down")
        _data(await auth_client.post("/v1/food-analysis/text",
                                     json={"text": "3 rotis"}), 202)
        await worker.drain()

        body = (await auth_client.get("/metrics")).text
        assert _metric(body, "fitlog_ai_analyses_total", outcome="completed") >= 1
        assert _metric(body, "fitlog_ai_analyses_total", outcome="failed") >= 1
        assert _metric(body, "fitlog_ai_analysis_duration_seconds_count") >= 1

    async def test_metrics_do_not_require_a_token(self, client):
        # A scraper is not a user. Requiring a bearer token here is how metrics
        # end up not being collected.
        r = await client.get("/metrics")
        assert r.status_code == 200
        assert "fitlog_http_requests_total" in r.text

    async def test_every_response_carries_a_request_id(self, auth_client):
        r = await auth_client.get("/v1/exercises", params={"limit": 1})
        # I9, and the thread a trace is pulled by.
        assert r.headers["x-request-id"]


class TestTheAlertTable:
    """Every row of [02 §9], evaluated — not a document."""

    def test_every_documented_alert_has_a_rule(self):
        from app.observability.alerts import RULES

        # The table in docs/02 §9, by name. A row added there without a rule
        # here means an alert somebody believes exists and does not.
        documented = {
            "failed_writes", "set_commit_failures", "ai_latency_p95",
            "ai_failure_rate", "food_resolution_failure_rate",
            "outbox_age_p95", "abandoned_sessions",
        }
        assert {r.name for r in RULES} >= documented

    def test_a_quiet_system_fires_nothing(self):
        from app.observability.alerts import evaluate

        assert evaluate({}) == []

    def test_the_set_commit_rule_is_tighter_than_the_general_one(self):
        from app.observability.alerts import RULES

        by_name = {r.name: r for r in RULES}
        # 0.1% versus 0.5% — this is the core loop (02 §9).
        assert by_name["set_commit_failures"].threshold < by_name["failed_writes"].threshold

    def test_a_breach_fires_with_the_number_that_caused_it(self):
        from app.observability.alerts import evaluate

        fired = evaluate({"set_commits_total": 1000, "set_commits_failed": 5})

        names = [a.rule.name for a in fired]
        assert "set_commit_failures" in names
        alert = next(a for a in fired if a.rule.name == "set_commit_failures")
        # An alert that says "something is wrong" and not what, or how much, is
        # an alert people learn to close.
        assert alert.value == pytest.approx(0.005)
        assert "0.5" in alert.message or "0.50" in alert.message

    def test_a_rate_below_the_threshold_does_not_fire(self):
        from app.observability.alerts import evaluate

        fired = evaluate({"set_commits_total": 10_000, "set_commits_failed": 5})
        assert "set_commit_failures" not in [a.rule.name for a in fired]

    def test_a_tiny_sample_does_not_fire_on_one_failure(self):
        """One failure out of three is 33% and means nothing.

        Without a minimum sample, every deploy fires every rate alert during
        the first minute of traffic, and everybody turns them off.
        """
        from app.observability.alerts import evaluate

        assert evaluate({"set_commits_total": 3, "set_commits_failed": 1}) == []

    async def test_a_4xx_write_is_not_a_failed_write(self, auth_client):
        """The alert's own definition of "failed", not just the counter's label.

        `failed_writes` means 5xx. A refused body is the API working, and a
        deploy that counts 4xx would fire this alert on its first bad client.
        """
        from app.observability.metrics import registry

        # Measured as a delta: the registry is process-wide, and other tests
        # cause real 5xx writes on purpose (an email provider that is down).
        failed_before = registry.snapshot()["writes_failed"]

        # A validation refusal on a write route — a 4xx, several times over.
        for _ in range(5):
            r = await auth_client.post("/v1/goals", json={"goal_type": "nonsense"})
            assert r.status_code == 422

        snapshot = registry.snapshot()
        assert snapshot["writes_total"] >= 5
        assert snapshot["writes_failed"] == failed_before

    async def test_the_endpoint_evaluates_against_live_counters(self, auth_client):
        # Not a static document: the same numbers /metrics exports.
        body = _data(await auth_client.get("/v1/admin/alerts"))
        assert "rules" in body and "firing" in body
        assert len(body["rules"]) >= 7


class TestTheAIQueue:
    """G10 TODO 3.3: outcomes and durations were exported, but a stuck queue was
    invisible — a job that never finishes records neither. Depth and age are
    read from the database at scrape time, so they are true across restarts."""

    async def test_metrics_export_queue_depth_and_the_oldest_waiting_job(self, auth_client):
        _data(await auth_client.post("/v1/food-analysis/text", json={"text": "2 eggs"}), 202)
        _data(await auth_client.post("/v1/food-analysis/text", json={"text": "1 roti"}), 202)

        body = (await auth_client.get("/metrics")).text
        assert _metric(body, "fitlog_ai_queue_depth", status="pending") == 2
        assert _metric(body, "fitlog_ai_queue_depth", status="processing") == 0
        assert "fitlog_ai_queue_oldest_pending_seconds" in body
        assert "fitlog_ai_queue_oldest_processing_seconds" in body

    async def test_a_job_stuck_in_processing_fires_an_alert(self, auth_client, db):
        from datetime import UTC, datetime, timedelta

        from app.models.analysis import AnalysisStatus, FoodAnalysis

        made = _data(await auth_client.post("/v1/food-analysis/text", json={"text": "2 eggs"}), 202)
        row = await db.get(FoodAnalysis, uuid.UUID(made["id"]))
        row.status = AnalysisStatus.processing
        row.locked_at = datetime.now(UTC) - timedelta(minutes=10)
        await db.commit()

        body = _data(await auth_client.get("/v1/admin/alerts"))
        assert body["snapshot"]["ai_queue_processing"] == 1
        assert body["snapshot"]["ai_oldest_processing_seconds"] >= 590
        assert "ai_queue_stuck" in [a["name"] for a in body["firing"]]

    def test_the_queue_rules(self):
        from app.observability.alerts import evaluate

        def names(snap):
            return [a.rule.name for a in evaluate(snap)]

        # A job the worker took and never finished: past the worker's own lock timeout.
        assert "ai_queue_stuck" in names({"ai_oldest_processing_seconds": 301})
        assert "ai_queue_stuck" not in names({"ai_oldest_processing_seconds": 30})
        # Nothing is picking jobs up: the oldest has waited longer than the latency alert.
        assert "ai_queue_waiting" in names({"ai_oldest_pending_seconds": 61})
        assert "ai_queue_waiting" not in names({"ai_oldest_pending_seconds": 5})


async def test_every_response_carries_the_basic_security_headers(client):
    r = await client.get("/health")
    assert r.headers["x-content-type-options"] == "nosniff"
    assert r.headers["referrer-policy"] == "no-referrer"
    assert "strict-transport-security" not in r.headers   # not deployed


async def test_a_deployed_api_insists_on_https(client, monkeypatch):
    from app.config import get_settings

    monkeypatch.setattr(get_settings(), "environment", "staging")
    r = await client.get("/health")
    assert r.headers["strict-transport-security"].startswith("max-age=31536000")


async def test_an_oversized_body_is_refused_before_it_is_read(client):
    r = await client.post("/v1/feedback", content=b"{}",
                          headers={"content-type": "application/json", "content-length": str(50 * 1024 * 1024)})
    assert r.status_code == 413
    assert r.json()["error"]["code"] == "PAYLOAD_TOO_LARGE"


async def test_a_path_no_route_matches_is_one_label_not_one_per_path(client):
    from app.observability.metrics import registry

    for i in range(3):
        await client.get(f"/v1/no-such-thing-{i}")
    rendered = registry.render()
    assert "no-such-thing" not in rendered
    assert "(unmatched)" in rendered
