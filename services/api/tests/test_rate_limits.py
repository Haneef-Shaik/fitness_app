"""Rate limiting (02 §8 "per-user and per-IP, tighter on auth and AI").

`RateLimited` existed from M1 and was never raised, so every limit the
architecture promised was a sentence rather than a behaviour. These tests drive
**real requests** through the limiter and read what comes back, because the two
ways a limiter fails are both invisible from inside it:

* **The counter is rolled back with the request.** A failed login raises, the
  request's transaction rolls back, and a counter written in that transaction
  goes with it — so the attempts an attacker makes are exactly the ones that
  are never counted. The first test uses logins that FAIL for that reason.
* **The endpoint never asks.** A limiter nobody calls limits nothing, so every
  protected route is driven to its 429 by the table at the bottom of this file.

The suite runs with the limiter off (conftest explains why); the `rate_limits`
fixture turns it on for one test, against an empty counter table and a frozen
clock.
"""
from __future__ import annotations

import uuid

import pytest
from sqlalchemy.ext.asyncio import create_async_engine

pytestmark = pytest.mark.asyncio


def _email() -> str:
    return f"rl-{uuid.uuid4().hex[:10]}@example.com"


async def _login(client, email: str | None = None, headers: dict | None = None):
    return await client.post(
        "/v1/auth/login",
        json={"email": email or _email(), "password": "not-the-password"},
        headers=headers or {},
    )


class TestLogin:
    async def test_the_eleventh_login_from_one_ip_in_a_minute_is_refused(self, client, rate_limits):
        # Ten different accounts, all failing: an attacker spraying one
        # password across many emails is what the per-IP limit is for.
        for _ in range(10):
            r = await _login(client)
            assert r.status_code == 401, r.text

        r = await _login(client)
        assert r.status_code == 429, r.text

        # The standard envelope — a client handles a 429 like any other error.
        body = r.json()
        assert body["success"] is False
        assert body["data"] is None
        assert body["error"]["code"] == "RATE_LIMITED"
        assert body["error"]["request_id"].startswith("req_")
        assert "Try again" in body["error"]["message"]
        # And says when, in the header a well-behaved client reads.
        assert r.headers["retry-after"] == "60"

    async def test_the_window_resets(self, client, rate_limits):
        for _ in range(10):
            await _login(client)
        assert (await _login(client)).status_code == 429

        rate_limits.clock.advance(59)
        assert (await _login(client)).status_code == 429, "reset a second early"

        rate_limits.clock.advance(1)
        assert (await _login(client)).status_code == 401

    async def test_a_retry_after_counts_down_to_the_end_of_the_window(self, client, rate_limits):
        rate_limits.clock.advance(45)
        for _ in range(10):
            await _login(client)
        r = await _login(client)
        assert r.status_code == 429
        assert r.headers["retry-after"] == "15"

    async def test_one_email_is_limited_across_many_ips(self, client, rate_limits):
        """The other half: one account, attacked from a botnet. Capped by the
        per-account total, whichever addresses the attempts come from."""
        rate_limits.trust_proxies(1)
        rate_limits.set("login_total", account="5/hour")
        email = _email()
        for i in range(5):
            r = await _login(client, email, headers={"x-forwarded-for": f"203.0.113.{i}"})
            assert r.status_code == 401, r.text

        r = await _login(client, email, headers={"x-forwarded-for": "203.0.113.99"})
        assert r.status_code == 429

        # A different account from that same fresh address is unaffected.
        r = await _login(client, headers={"x-forwarded-for": "203.0.113.99"})
        assert r.status_code == 401

    async def test_a_stranger_cannot_lock_the_owner_out(self, client, rate_limits):
        """Six bad attempts a minute from one address used to 429 the owner's
        right password too (G11 security review)."""
        rate_limits.trust_proxies(1)
        email = _email()
        await client.post("/v1/auth/register", json={"email": email, "password": "correct-horse-battery"})
        for _ in range(6):
            await _login(client, email, headers={"x-forwarded-for": "198.51.100.66"})
        blocked = await _login(client, email, headers={"x-forwarded-for": "198.51.100.66"})
        assert blocked.status_code == 429

        r = await client.post("/v1/auth/login", json={"email": email, "password": "correct-horse-battery"},
                              headers={"x-forwarded-for": "203.0.113.7"})
        assert r.status_code == 200, r.text

    async def test_the_email_is_matched_the_way_login_matches_it(self, client, rate_limits):
        # Login lowercases and strips; a limit that did not would give every
        # capitalisation of one address its own budget.
        rate_limits.trust_proxies(1)
        rate_limits.set("login_total", account="5/hour")
        email = _email()
        for i, variant in enumerate([email, email.upper(), email.title(), email, email.upper()]):
            await _login(client, variant, headers={"x-forwarded-for": f"198.51.100.{i}"})
        r = await _login(client, email, headers={"x-forwarded-for": "198.51.100.50"})
        assert r.status_code == 429

    async def test_a_forged_forwarded_for_changes_nothing_without_a_trusted_proxy(
        self, client, rate_limits
    ):
        """With no proxy configured, the header is the caller's to write.

        Trusting it would let an attacker name a fresh address per request and
        walk past every per-IP limit.
        """
        for i in range(10):
            await _login(client, headers={"x-forwarded-for": f"192.0.2.{i}"})
        r = await _login(client, headers={"x-forwarded-for": "192.0.2.200"})
        assert r.status_code == 429

    async def test_a_successful_login_still_works_under_the_limit(self, client, rate_limits):
        email = _email()
        await client.post("/v1/auth/register",
                          json={"email": email, "password": "correct-horse-battery"})
        r = await client.post("/v1/auth/login",
                              json={"email": email, "password": "correct-horse-battery"})
        assert r.status_code == 200, r.text


class TestClientAddress:
    """Which address a request is counted against."""

    def _request(self, peer: str | None, forwarded: str | None = None):
        from starlette.requests import Request

        headers = [(b"x-forwarded-for", forwarded.encode())] if forwarded else []
        scope = {
            "type": "http", "method": "GET", "path": "/", "headers": headers,
            "client": (peer, 1234) if peer else None, "query_string": b"",
        }
        return Request(scope)

    def test_without_trusted_proxies_the_peer_is_the_client(self):
        from app.core.ratelimit import client_ip

        req = self._request("10.0.0.5", "1.2.3.4")
        assert client_ip(req, trusted_proxies=0) == "10.0.0.5"

    def test_one_trusted_proxy_means_the_last_hop_it_appended(self):
        from app.core.ratelimit import client_ip

        # A client can PREPEND anything; the proxy appends the real address.
        req = self._request("10.0.0.5", "6.6.6.6, 1.2.3.4")
        assert client_ip(req, trusted_proxies=1) == "1.2.3.4"

    def test_two_trusted_proxies_count_back_two(self):
        from app.core.ratelimit import client_ip

        req = self._request("10.0.0.9", "6.6.6.6, 1.2.3.4, 10.0.0.5")
        assert client_ip(req, trusted_proxies=2) == "1.2.3.4"

    def test_a_chain_shorter_than_configured_falls_back_to_the_peer(self):
        from app.core.ratelimit import client_ip

        # The request did not come through the proxies we were told about, so
        # nothing in the header can be trusted.
        req = self._request("10.0.0.5", "1.2.3.4")
        assert client_ip(req, trusted_proxies=2) == "10.0.0.5"

    def test_garbage_in_the_header_falls_back_to_the_peer(self):
        from app.core.ratelimit import client_ip

        req = self._request("10.0.0.5", "not-an-address")
        assert client_ip(req, trusted_proxies=1) == "10.0.0.5"

    def test_an_ipv6_client_is_counted_by_its_slash_64(self):
        """One subscriber is handed a whole /64. Counting single addresses
        would give them 2^64 budgets."""
        from app.core.ratelimit import client_ip

        a = client_ip(self._request("2001:db8:1:2::1"), trusted_proxies=0)
        b = client_ip(self._request("2001:db8:1:2:ffff::9"), trusted_proxies=0)
        assert a == b == "2001:db8:1:2::/64"

    def test_no_peer_at_all_is_one_shared_bucket(self):
        from app.core.ratelimit import client_ip

        assert client_ip(self._request(None), trusted_proxies=0) == "unknown"

    def test_a_proxy_that_adds_its_own_header_line_is_read_last(self):
        """HAProxy's `option forwardfor` ADDS a line rather than appending to
        the client's. Reading only the first line would read the forged one."""
        from starlette.requests import Request

        from app.core.ratelimit import client_ip

        scope = {
            "type": "http", "method": "GET", "path": "/", "query_string": b"",
            "client": ("10.0.0.5", 1234),
            "headers": [(b"x-forwarded-for", b"6.6.6.6"), (b"x-forwarded-for", b"1.2.3.4")],
        }
        assert client_ip(Request(scope), trusted_proxies=1) == "1.2.3.4"

    @pytest.mark.parametrize(("entry", "expected"), [
        ("1.2.3.4:5678", "1.2.3.4"),
        ("[2001:db8:1:2::1]:443", "2001:db8:1:2::/64"),
        ("[2001:db8:1:2::1]", "2001:db8:1:2::/64"),
    ])
    def test_an_entry_with_a_port_is_still_its_address(self, entry, expected):
        # Some load balancers write the port too. Falling back to the proxy's
        # own address would put every client in one bucket.
        from app.core.ratelimit import client_ip

        assert client_ip(self._request("10.0.0.5", entry), trusted_proxies=1) == expected


class TestSeveralInstances:
    async def test_two_api_instances_share_one_count(self, engine, rate_limits):
        """The counter lives in Postgres, so a second instance behind the load
        balancer is not a second budget. Two engines here are two processes'
        connection pools against the one database."""
        from app.config import get_settings
        from app.core.ratelimit import Rule, hit

        other = create_async_engine(get_settings().test_database_url)
        try:
            rule = Rule(count=3, seconds=60)
            now = rate_limits.clock.now()
            counts = [
                await hit(eng, [("test:shared", rule)], now)
                for eng in (engine, other, engine, other)
            ]
        finally:
            await other.dispose()

        assert [c[0] for c in counts] == [1, 2, 3, 4]

    async def test_expired_windows_are_swept(self, engine, rate_limits, monkeypatch):
        from sqlalchemy import func, select

        from app.core import ratelimit
        from app.models import RateLimitCounter

        monkeypatch.setattr(ratelimit, "PRUNE_EVERY", 1)
        rule = ratelimit.Rule(count=5, seconds=60)
        await ratelimit.hit(engine, [("test:old", rule)], rate_limits.clock.now())

        rate_limits.clock.advance(3600)
        await ratelimit.hit(engine, [("test:new", rule)], rate_limits.clock.now())

        async with engine.connect() as conn:
            buckets = set((await conn.execute(select(RateLimitCounter.bucket))).scalars())
            assert "test:old" not in buckets
            assert "test:new" in buckets
            assert await conn.scalar(select(func.count()).select_from(RateLimitCounter)) == 1

    async def test_the_limiter_never_waits_on_the_requests_own_pool(self, rate_limits):
        """A signed-in request already holds a connection when it is counted.

        Taking the counter's connection from the same pool means a burst of
        those requests each holds one and waits for another — the pool drains
        and they all time out, under exactly the load the limiter is for.
        """
        from sqlalchemy import text as sql
        from sqlalchemy.ext.asyncio import AsyncSession
        from starlette.requests import Request

        from app.config import get_settings
        from app.core.ratelimit import enforce

        tiny = create_async_engine(get_settings().test_database_url,
                                   pool_size=1, max_overflow=0, pool_timeout=2)
        request = Request({"type": "http", "method": "POST", "path": "/", "headers": [],
                           "query_string": b"", "client": ("192.0.2.9", 1)})
        try:
            async with AsyncSession(tiny) as session:
                await session.execute(sql("SELECT 1"))  # holds the pool's only connection
                await enforce(session, request, "login", account="pool@example.com")
        finally:
            await tiny.dispose()

    async def test_account_keys_are_not_stored_in_the_clear(self, client, engine, rate_limits):
        from sqlalchemy import select

        from app.models import RateLimitCounter

        email = _email()
        await _login(client, email)
        async with engine.connect() as conn:
            buckets = list((await conn.execute(select(RateLimitCounter.bucket))).scalars())
        assert buckets, "nothing was counted"
        # 02 §8: no emails where they do not need to be.
        assert not any(email in b for b in buckets)


class TestConfiguration:
    def test_rules_parse(self):
        from app.core.ratelimit import Rule, parse_rule

        assert parse_rule("10/minute") == Rule(count=10, seconds=60)
        assert parse_rule("5 / hour") == Rule(count=5, seconds=3600)
        assert parse_rule("100/day") == Rule(count=100, seconds=86400)
        assert parse_rule("3/second") == Rule(count=3, seconds=1)

    @pytest.mark.parametrize("bad", ["ten/minute", "10/fortnight", "10", "0/minute", ""])
    def test_a_malformed_rule_refuses_to_start(self, bad):
        from app.config import Settings, validate_settings

        with pytest.raises(RuntimeError, match="RATE_LIMIT_LOGIN_IP"):
            validate_settings(Settings(rate_limit_login_ip=bad))

    async def test_switched_off_it_counts_nothing(self, client, rate_limits):
        rate_limits.enabled = False
        for _ in range(12):
            assert (await _login(client)).status_code == 401


# --------------------------------------------------------- every protected route

async def _registered(client) -> dict:
    r = await client.post("/v1/auth/register",
                          json={"email": _email(), "password": "correct-horse-battery"})
    assert r.status_code == 201, r.text
    return r.json()["data"]


def _bearer(user: dict) -> dict:
    return {"authorization": f"Bearer {user['access_token']}"}


async def _call(client, route: str, user: dict | None):
    """One request to a protected route. Whether it succeeds does not matter —
    every attempt counts, including the ones that fail."""
    if route == "register":
        return await client.post("/v1/auth/register",
                                 json={"email": _email(), "password": "correct-horse-battery"})
    if route == "login":
        return await _login(client)
    if route == "refresh":
        return await client.post("/v1/auth/refresh", json={"refresh_token": "not-a-token"})
    if route == "account-delete-post":
        return await client.post("/v1/account/delete", headers=_bearer(user),
                                 json={"password": "wrong-password", "confirmation": "DELETE"})
    if route == "account-delete-web":
        return await client.post(
            "/account/delete",
            content=f"email={user['user']['email']}&password=wrong&confirmation=DELETE",
            headers={"content-type": "application/x-www-form-urlencoded"},
        )
    if route == "ai-text":
        return await client.post("/v1/food-analysis/text", headers=_bearer(user),
                                 json={"text": "2 eggs"})
    if route == "password-forgot":
        return await client.post("/v1/auth/password/forgot", json={"email": _email()})
    if route == "password-reset":
        return await client.post("/v1/auth/password/reset",
                                 json={"token": "not-a-real-token", "new_password": "correct-horse-battery"})
    if route == "email-verify":
        return await client.post("/v1/auth/email/verify", json={"token": "not-a-real-token"})
    if route == "import-workouts":
        return await client.post("/v1/imports/workouts", headers=_bearer(user), json={"csv": "a,b\n1,2\n"})
    if route == "feedback":
        return await client.post("/v1/feedback", headers=_bearer(user), json={"message": "hello"})
    if route == "change-password":
        return await client.post("/v1/account/password", headers=_bearer(user),
                                 json={"current_password": "wrong-password-x", "new_password": "another-long-password"})
    if route == "change-email":
        return await client.post("/v1/account/email", headers=_bearer(user),
                                 json={"new_email": _email(), "password": "wrong-password-x"})
    if route == "ai-image":
        return await client.post("/v1/food-analysis/image", headers=_bearer(user),
                                 json={"image_key": "uploads/nobody/x.jpg"})
    raise AssertionError(route)


#: route -> the policy that guards it. Adding a sensitive endpoint means adding
#: a line here, and this table is what proves it is actually limited.
PROTECTED = {
    "register": "register",
    "login": "login",
    "refresh": "refresh",
    "account-delete-post": "account_delete",
    "account-delete-web": "account_delete",
    "ai-text": "ai",
    "ai-image": "ai",
    "password-forgot": "password_reset",
    "password-reset": "password_reset",
    "email-verify": "email_verify",
    "import-workouts": "imports",
    "feedback": "feedback",
    "change-password": "reauth",
    "change-email": "reauth",
}


@pytest.mark.parametrize("route", sorted(PROTECTED))
async def test_every_protected_route_is_limited_by_ip(client, rate_limits, route):
    user = None if route == "register" else await _registered(client)
    rate_limits.set(PROTECTED[route], ip="1/minute")

    first = await _call(client, route, user)
    assert first.status_code != 429, f"{route}: refused before its limit"

    second = await _call(client, route, user)
    assert second.status_code == 429, f"{route} is not rate limited: {second.status_code}"
    assert second.headers.get("retry-after")


@pytest.mark.parametrize("route", ["account-delete-post", "account-delete-web", "ai-text",
                                   "change-password", "change-email"])
async def test_the_signed_in_routes_are_limited_per_account(client, rate_limits, route):
    """Per account, whichever address it comes from — the second half of 02 §8."""
    rate_limits.trust_proxies(1)
    user = await _registered(client)
    rate_limits.set(PROTECTED[route], account="1/minute")

    client.headers["x-forwarded-for"] = "203.0.113.1"
    assert (await _call(client, route, user)).status_code != 429
    client.headers["x-forwarded-for"] = "203.0.113.2"
    assert (await _call(client, route, user)).status_code == 429


async def test_strangers_cannot_lock_someone_out_of_deleting_in_the_app(client, rate_limits):
    """The web form needs only an email to spend its per-account budget.

    If the app shared that budget, anybody could post a few bogus attempts an
    hour at a victim's address and stop them deleting their account — which
    both stores require to work. The app's budget is keyed by the signed-in
    account instead, which only its owner's session can spend.
    """
    rate_limits.trust_proxies(1)
    user = await _registered(client)
    rate_limits.set("account_delete", account="1/minute")

    client.headers["x-forwarded-for"] = "203.0.113.7"
    for _ in range(3):
        await _call(client, "account-delete-web", user)
    client.headers["x-forwarded-for"] = "203.0.113.8"
    assert (await _call(client, "account-delete-post", user)).status_code != 429


async def test_the_ai_limit_is_on_top_of_the_daily_quota(client, rate_limits, quota):
    """Two different sentences (errors.py): a burst is RATE_LIMITED, a day's
    allowance used up is QUOTA_EXCEEDED."""
    user = await _registered(client)
    quota.limit = 100
    rate_limits.set("ai", ip="2/minute")

    for _ in range(2):
        assert (await _call(client, "ai-text", user)).status_code == 202
    r = await _call(client, "ai-text", user)
    assert r.status_code == 429
    assert r.json()["error"]["code"] == "RATE_LIMITED"
