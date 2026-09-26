"""Crash reports that carry no personal data (02 §8, launch plan Phase 4).

02 §8's rule for logs is the rule for crash reports: `user_id` and `request_id`,
never emails, bodies, tokens or image contents. A crash report is a log line
that leaves the building, so the scrubber is tested on the shapes Sentry really
sends — and once end to end, through the real app and a real exception, because
a scrubber that is never called protects nothing.
"""
from __future__ import annotations

import copy
import json
from collections.abc import AsyncGenerator

import httpx
import pytest
import pytest_asyncio
import sentry_sdk
from httpx import ASGITransport
from sentry_sdk.transport import Transport

from app.config import Settings
from app.db import get_db
from app.main import app
from app.observability.crash_reporting import init_crash_reporting, scrub_event

EMAIL = "someone@example.com"
JWT = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.c2lnbmF0dXJl"


def _event() -> dict:
    """The shape the FastAPI integration sends for a failed request."""
    return {
        "message": f"could not register {EMAIL}",
        "exception": {"values": [{
            "type": "RuntimeError",
            "value": f"duplicate key for {EMAIL}; token {JWT}",
            "stacktrace": {"frames": [{
                "function": "register", "vars": {"password": "hunter2", "email": EMAIL},
            }]},
        }]},
        "request": {
            "method": "PUT",
            "url": "https://api.fitlog.app/v1/uploads/uploads/u/1.jpg?size=9&exp=1&sig=SECRET",
            "query_string": "size=9&exp=1&sig=SECRET",
            "data": {"email": EMAIL, "password": "hunter2"},
            "cookies": {"session": "abc"},
            "env": {"REMOTE_ADDR": "203.0.113.9"},
            "headers": {
                "Authorization": f"Bearer {JWT}",
                "Cookie": "session=abc",
                "X-Forwarded-For": "203.0.113.9",
                "User-Agent": "okhttp/4.12",
                "X-Request-Id": "req_abc123",
            },
        },
        "user": {"id": "u-1", "email": EMAIL, "ip_address": "203.0.113.9", "username": "sam"},
        "breadcrumbs": {"values": [
            {"category": "httplib", "data": {
                "url": "https://api.anthropic.com/v1/messages?key=abc",
                "http.query": "key=abc", "method": "POST", "status_code": 529,
            }},
            {"category": "log", "message": f"login failed for {EMAIL}"},
        ]},
        "extra": {"refresh_token": "rt-123", "api_key": "sk-123"},
    }


class TestTheScrubber:
    def test_auth_and_identifying_headers_go_and_useful_ones_stay(self):
        headers = scrub_event(_event())["request"]["headers"]

        assert {k.lower() for k in headers} == {"user-agent", "x-request-id"}

    def test_the_body_cookies_and_client_address_go(self):
        request = scrub_event(_event())["request"]

        for gone in ("data", "cookies", "env", "query_string"):
            assert gone not in request

    def test_the_query_string_is_cut_from_every_url(self):
        # An upload URL's query IS its signature.
        event = scrub_event(_event())

        assert event["request"]["url"] == "https://api.fitlog.app/v1/uploads/uploads/u/1.jpg"
        assert event["breadcrumbs"]["values"][0]["data"]["url"] == "https://api.anthropic.com/v1/messages"
        assert "http.query" not in event["breadcrumbs"]["values"][0]["data"]

    def test_emails_are_replaced_wherever_they_appear(self):
        event = scrub_event(_event())

        assert EMAIL not in json.dumps(event)
        assert "[email]" in event["exception"]["values"][0]["value"]
        assert "[email]" in event["breadcrumbs"]["values"][1]["message"]

    def test_a_database_errors_bound_values_are_dropped(self):
        """SQLAlchemy appends the row it tried to write; a note about someone's
        health is not something to keep in a crash report (G11 review)."""
        event = _event()
        event["exception"]["values"][0]["value"] = (
            "(psycopg.errors.NumericValueOutOfRange) numeric field overflow\n"
            "[SQL: INSERT INTO workout_sets ...]\n"
            "[parameters: (1000000, 'felt-awful-private-health-note')]"
        )
        scrubbed = json.dumps(scrub_event(event))
        assert "private-health-note" not in scrubbed
        assert "[parameters: redacted]" in scrubbed

    def test_a_token_in_a_message_is_replaced(self):
        assert JWT not in json.dumps(scrub_event(_event()))

    def test_the_user_is_their_id_and_nothing_else(self):
        assert scrub_event(_event())["user"] == {"id": "u-1"}

    def test_secrets_named_as_such_are_filtered_anywhere(self):
        extra = scrub_event(_event())["extra"]

        assert extra == {"refresh_token": "[Filtered]", "api_key": "[Filtered]"}

    def test_stack_frame_locals_go(self):
        frame = scrub_event(_event())["exception"]["values"][0]["stacktrace"]["frames"][0]

        assert "vars" not in frame
        assert frame["function"] == "register"

    def test_nothing_the_scrubber_was_given_is_changed(self):
        original = _event()
        before = copy.deepcopy(original)

        scrub_event(original)

        assert original == before

    def test_the_event_is_still_sent(self):
        # `None` would drop it. The point is a report without PII, not no report.
        assert scrub_event(_event())["exception"]["values"][0]["type"] == "RuntimeError"


# ------------------------------------------------------------------ wiring


class _Capture(Transport):
    def __init__(self) -> None:
        super().__init__()
        self.events: list[dict] = []

    def capture_envelope(self, envelope) -> None:
        for item in envelope.items:
            if item.type == "event":
                self.events.append(item.payload.json)


def _settings(**overrides) -> Settings:
    return Settings(
        _env_file=None, sentry_dsn="https://public@o0.ingest.sentry.io/0",
        environment="staging", app_release="fitlog-api@abc1234", **overrides,
    )


@pytest.fixture
def reset_sentry():
    yield
    # A client with no DSN: inactive, so nothing leaks into the next test.
    sentry_sdk.init(dsn=None)


class TestInit:
    def test_without_a_dsn_nothing_is_initialised(self, reset_sentry):
        assert init_crash_reporting(Settings(_env_file=None), process="api") is False
        assert not sentry_sdk.get_client().is_active()

    def test_with_a_dsn_the_client_is_configured_to_send_no_pii(self, reset_sentry):
        assert init_crash_reporting(_settings(), process="api", transport=_Capture()) is True

        options = sentry_sdk.get_client().options
        assert options["send_default_pii"] is False
        assert options["include_local_variables"] is False
        assert options["max_request_body_size"] == "never"
        assert options["before_send"] is scrub_event
        assert options["environment"] == "staging"
        assert options["release"] == "fitlog-api@abc1234"

    def test_the_worker_initialises_as_the_worker(self, monkeypatch, reset_sentry):
        from app.worker import runner

        calls: list[str] = []

        class _Worker:
            def __init__(self, *args, **kwargs) -> None: ...

            async def run_forever(self, *args, **kwargs) -> None: ...

        monkeypatch.setattr(
            runner, "init_crash_reporting", lambda settings, *, process: calls.append(process)
        )
        monkeypatch.setattr(runner, "AnalysisWorker", _Worker)
        monkeypatch.setattr(runner, "_session_factory", lambda: None)

        import asyncio

        asyncio.run(runner.main())

        assert calls == ["worker"]


@pytest_asyncio.fixture
async def failing_app(reset_sentry) -> AsyncGenerator[tuple[httpx.AsyncClient, _Capture], None]:
    """The real app with Sentry on, and a dependency that raises with an email
    in its message — the unhandled-exception path end to end."""
    capture = _Capture()
    init_crash_reporting(_settings(), process="api", transport=capture)

    async def broken_db():
        raise RuntimeError(f"connection refused while loading {EMAIL}")
        yield  # pragma: no cover — makes this a generator dependency

    app.dependency_overrides[get_db] = broken_db
    # The server error middleware re-raises after answering 500; a real server
    # logs that, and the test client must not turn it into a test error.
    transport = ASGITransport(app=app, raise_app_exceptions=False)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        yield client, capture
    app.dependency_overrides.clear()


class TestEndToEnd:
    async def test_an_unhandled_error_is_reported_once_and_scrubbed(self, failing_app):
        client, capture = failing_app

        response = await client.get(
            "/metrics?sig=SECRET",
            headers={"authorization": f"Bearer {JWT}", "cookie": "session=abc",
                     "x-request-id": "req_e2e"},
        )
        sentry_sdk.flush()

        assert response.status_code == 500
        assert response.json()["error"]["request_id"] == "req_e2e"
        assert len(capture.events) == 1
        event = capture.events[0]
        # Findable by the id the user quotes to support (docs/06 §10).
        assert event["tags"]["request_id"] == "req_e2e"
        assert event["tags"]["process"] == "api"
        sent = json.dumps(event)
        for leaked in (EMAIL, JWT, "SECRET", "session=abc"):
            assert leaked not in sent, leaked
