"""`/v1/admin/*` and `/metrics` in production (launch).

G10 left both deliberately easy to reach: `/metrics` open so a scraper needs no
credentials, the alert table behind any user's token. Both are right on a
laptop and wrong on the internet — the first publishes traffic shape to
anybody, the second shows operational thresholds to every registered user.

So production requires an operator's `ADMIN_TOKEN` for both, compared in
constant time, and refuses to start without one. Development and the test
suite keep G10's behaviour exactly, which the first class asserts.
"""
from __future__ import annotations

import pytest

from app.config import Settings, validate_settings

pytestmark = pytest.mark.asyncio

TOKEN = "t" * 48


@pytest.fixture
def production(monkeypatch):
    from app.config import get_settings

    settings = get_settings()
    monkeypatch.setattr(settings, "environment", "production")
    monkeypatch.setattr(settings, "admin_token", TOKEN)
    return settings


def _admin(token: str = TOKEN) -> dict:
    return {"authorization": f"Bearer {token}"}


class TestDevelopmentIsUnchanged:
    async def test_metrics_need_no_token(self, client):
        r = await client.get("/metrics")
        assert r.status_code == 200

    async def test_the_alert_table_takes_a_users_token(self, auth_client):
        r = await auth_client.get("/v1/admin/alerts")
        assert r.status_code == 200, r.text

    async def test_the_alert_table_still_refuses_nobody(self, client):
        client.headers.pop("authorization", None)
        assert (await client.get("/v1/admin/alerts")).status_code == 401


class TestProduction:
    async def test_metrics_refuse_a_scrape_without_the_token(self, client, production):
        r = await client.get("/metrics")
        assert r.status_code == 401
        assert r.json()["error"]["code"] == "UNAUTHORIZED"
        assert "fitlog_http_requests_total" not in r.text

    async def test_metrics_refuse_the_wrong_token(self, client, production):
        assert (await client.get("/metrics", headers=_admin("x" * 48))).status_code == 401

    async def test_metrics_open_for_the_operator(self, client, production):
        r = await client.get("/metrics", headers=_admin())
        assert r.status_code == 200
        assert "fitlog_http_requests_total" in r.text

    async def test_a_users_token_no_longer_opens_the_alert_table(self, auth_client, production):
        # Any registered user could read operational thresholds before this.
        r = await auth_client.get("/v1/admin/alerts")
        assert r.status_code == 401

    @pytest.mark.parametrize("path", ["/v1/admin/feedback", "/v1/admin/product-metrics"])
    async def test_feedback_and_product_metrics_are_the_operators_alone(
        self, auth_client, production, path
    ):
        # Feedback is often about someone's own data; a user's token must not read it.
        assert (await auth_client.get(path)).status_code == 401
        assert (await auth_client.get(path, headers=_admin())).status_code == 200

    async def test_the_operator_opens_the_alert_table(self, client, production):
        r = await client.get("/v1/admin/alerts", headers=_admin())
        assert r.status_code == 200, r.text
        assert "rules" in r.json()["data"]

    async def test_the_comparison_is_constant_time(self, client, production, monkeypatch):
        """A `==` on a secret leaks it one matching prefix at a time."""
        from app.api import admin_auth

        calls: list[tuple[bytes, bytes]] = []
        real = admin_auth.compare_digest

        def spy(a, b):
            calls.append((a, b))
            return real(a, b)

        monkeypatch.setattr(admin_auth, "compare_digest", spy)
        await client.get("/metrics", headers=_admin())
        assert calls, "the admin token was not compared with hmac.compare_digest"

    @pytest.mark.parametrize("header", ["", "Bearer", "Basic " + TOKEN, TOKEN])
    async def test_malformed_headers_are_refused(self, client, production, header):
        r = await client.get("/metrics", headers={"authorization": header} if header else {})
        assert r.status_code == 401


class TestStartup:
    def _prod(self, **overrides) -> Settings:
        base = {
            "environment": "production",
            "upload_signing_secret": "u" * 48,
            "admin_token": TOKEN,
            # A production people can sign in to and delete from (docs/14).
            "supabase_url": "https://ref.supabase.co",
            "supabase_secret_key": "sb_secret_" + "k" * 30,
        }
        return Settings(**{**base, **overrides})

    def test_production_refuses_to_start_without_an_admin_token(self):
        with pytest.raises(RuntimeError, match="ADMIN_TOKEN"):
            validate_settings(self._prod(admin_token=""))

    def test_production_refuses_a_short_admin_token(self):
        with pytest.raises(RuntimeError, match="ADMIN_TOKEN"):
            validate_settings(self._prod(admin_token="password123"))

    def test_production_starts_with_one(self):
        assert validate_settings(self._prod()).admin_token == TOKEN

    def test_a_public_address_must_be_https_in_production(self):
        # It is printed in the policies as the account-deletion link.
        with pytest.raises(RuntimeError, match="PUBLIC_BASE_URL"):
            validate_settings(self._prod(public_base_url="http://api.fitlog.example"))
        assert validate_settings(self._prod(public_base_url="https://api.fitlog.example"))

    def test_development_does_not_need_one(self):
        assert validate_settings(Settings(environment="development", admin_token="")).admin_token == ""

    def test_the_existing_production_rules_still_hold(self):
        # Moved into validate_settings from get_settings; still enforced.
        with pytest.raises(RuntimeError, match="SUPABASE_URL"):
            validate_settings(self._prod(supabase_url=""))
        with pytest.raises(RuntimeError, match="UPLOAD_SIGNING_SECRET"):
            validate_settings(self._prod(upload_signing_secret="dev-only-change-me"))
