"""The web account-deletion page (Google Play's "delete without the app" URL).

Google Play requires a link where somebody who no longer has the app — lost
phone, uninstalled it, never trusted it — can still have their account removed.
It is a page served by the API itself, so it exists wherever the API does.

What these tests hold it to:

* It deletes through **the same code** as the in-app delete, so it cannot leave
  behind what the app would have removed. The completeness check from
  test_account.py is re-run against it.
* It proves the person holds the address with a one-time code Supabase emails
  (docs/14, S6) — for password, Google and Apple accounts alike — and never
  says whether an address has an account.
* It is a plain page: no script, nothing loaded from anywhere else, readable on
  a phone, labelled for a screen reader, and impossible to frame.
"""
from __future__ import annotations

import re
import uuid

import pytest
from sqlalchemy import select

from tests.auth import sign_in, sign_up
from tests.test_account import _child_row_counts, _populate, _user_row_counts

pytestmark = pytest.mark.asyncio

FORM = {"content-type": "application/x-www-form-urlencoded"}


def _send(email: str) -> str:
    from urllib.parse import urlencode

    return urlencode({"step": "send", "email": email})


def _delete(email: str, code: str, confirmation: str = "DELETE") -> str:
    from urllib.parse import urlencode

    return urlencode({"step": "delete", "email": email, "code": code, "confirmation": confirmation})


async def _emailed_code(client, auth_admin, email: str) -> str:
    r = await client.post("/account/delete", content=_send(email), headers=FORM)
    assert r.status_code == 200, r.text
    return auth_admin.codes[email]


async def _account(client) -> tuple[str, str]:
    email = f"web-{uuid.uuid4().hex[:10]}@example.com"
    r = await sign_up(client, json={"email": email, "password": "correct-horse-battery"})
    assert r.status_code == 201, r.text
    return email, r.json()["data"]["access_token"]


class TestThePage:
    async def test_it_is_a_form_that_posts_back_to_itself(self, client):
        r = await client.get("/account/delete")
        assert r.status_code == 200
        assert r.headers["content-type"].startswith("text/html")
        html = r.text

        assert re.search(r'<form[^>]+method="post"[^>]+action="/account/delete"', html)
        assert re.search(r'<input[^>]+type="email"[^>]+name="email"', html)
        # Every field has a real label, not just a placeholder.
        assert '<label for="email">' in html
        # No password on a web form: the proof is a code sent to the address.
        assert 'type="password"' not in html

    async def test_the_second_step_asks_for_the_code_and_the_word(self, client):
        r = await client.post("/account/delete", content=_send("someone@example.com"), headers=FORM)
        assert r.status_code == 200
        for name, extra in (("code", 'inputmode="numeric"'), ("confirmation", "")):
            assert re.search(rf'<input[^>]+name="{name}"', r.text), name
            assert f'<label for="{name}">' in r.text, name
            assert extra in r.text
        assert 'autocomplete="one-time-code"' in r.text

    async def test_it_is_self_contained_and_works_on_a_phone(self, client):
        html = (await client.get("/account/delete")).text

        assert '<html lang="en">' in html
        assert 'name="viewport"' in html
        assert "<script" not in html.lower()
        # Nothing fetched from anywhere else: no fonts, no CSS, no trackers.
        assert not re.search(r'(src|href)="https?://', html)
        assert "<style>" in html

    async def test_it_says_what_is_deleted_and_how_else_to_do_it(self, client):
        html = (await client.get("/account/delete")).text
        assert "permanent" in html.lower()
        assert "Data and privacy" in html  # the in-app route, for people who have the app

    async def test_it_cannot_be_framed_or_cached(self, client):
        r = await client.get("/account/delete")
        # A page that deletes an account is exactly what clickjacking frames.
        assert r.headers["x-frame-options"] == "DENY"
        csp = r.headers["content-security-policy"]
        assert "frame-ancestors 'none'" in csp
        assert "form-action 'self'" in csp
        assert "script-src" not in csp or "'none'" in csp
        assert r.headers["cache-control"] == "no-store"
        assert r.headers["referrer-policy"] == "no-referrer"

    async def test_it_is_not_part_of_the_api_document(self, client):
        # An HTML page for people, not an endpoint for the generated client.
        spec = (await client.get("/v1/openapi.json")).json()
        assert "/account/delete" not in spec["paths"]


class TestDeleting:
    async def test_the_emailed_code_deletes_the_account(self, client, auth_admin):
        email, _ = await _account(client)
        code = await _emailed_code(client, auth_admin, email)

        r = await client.post("/account/delete", content=_delete(email, code), headers=FORM)
        assert r.status_code == 200, r.text
        assert "has been deleted" in r.text

        # The Supabase sign-in went too, so the address can no longer sign in.
        assert len(auth_admin.deleted) == 1
        login = await sign_in(client, json={"email": email, "password": "correct-horse-battery"})
        assert login.status_code == 400

    async def test_it_deletes_as_completely_as_the_app_does(self, client, auth_admin, worker, db):
        """The same service, so the same completeness — asserted, not assumed."""
        from app.models import User

        email, token = await _account(client)
        client.headers["authorization"] = f"Bearer {token}"
        await _populate(client)
        del client.headers["authorization"]
        user_id = (await db.scalar(select(User).where(User.email == email))).id

        code = await _emailed_code(client, auth_admin, email)
        r = await client.post("/account/delete", content=_delete(email, code), headers=FORM)
        assert r.status_code == 200, r.text

        db.expire_all()
        after = {**await _user_row_counts(db, user_id),
                 **await _child_row_counts(db, user_id)}
        assert not {n: c for n, c in after.items() if c}, after

    async def test_the_uploaded_files_go_too(self, auth_client, auth_admin, storage, uploaded_image):
        me = (await auth_client.get("/v1/auth/me")).json()["data"]
        await auth_client.post("/v1/progress-photos", json={"image_key": uploaded_image},
                               headers={"Idempotency-Key": str(uuid.uuid4())})
        assert await storage.exists(uploaded_image)

        # The page ignores any bearer token: the code decides.
        code = await _emailed_code(auth_client, auth_admin, me["email"])
        r = await auth_client.post("/account/delete", content=_delete(me["email"], code), headers=FORM)
        assert r.status_code == 200, r.text
        assert not await storage.exists(uploaded_image)

    async def test_an_unknown_address_reads_the_same_as_a_known_one(self, client, auth_admin):
        """No enumeration: asking for a code never says whether an account exists."""
        email, _ = await _account(client)
        unknown = f"nobody-{uuid.uuid4().hex[:6]}@example.com"

        known_page = await client.post("/account/delete", content=_send(email), headers=FORM)
        unknown_page = await client.post("/account/delete", content=_send(unknown), headers=FORM)

        assert known_page.status_code == unknown_page.status_code == 200
        assert known_page.text.replace(email, "X") == unknown_page.text.replace(unknown, "X")
        assert unknown not in auth_admin.codes  # nothing was sent there

    async def test_a_wrong_code_deletes_nothing(self, client, auth_admin):
        email, _ = await _account(client)
        await _emailed_code(client, auth_admin, email)

        r = await client.post("/account/delete", content=_delete(email, "000000"), headers=FORM)
        assert r.status_code == 401
        assert "wrong or has expired" in r.text
        assert auth_admin.deleted == []
        login = await sign_in(client, json={"email": email, "password": "correct-horse-battery"})
        assert login.status_code == 200

    async def test_the_confirmation_word_is_required(self, client, auth_admin):
        email, _ = await _account(client)
        code = await _emailed_code(client, auth_admin, email)

        r = await client.post("/account/delete", content=_delete(email, code, "delete"), headers=FORM)
        assert r.status_code == 422
        assert "DELETE" in r.text
        assert auth_admin.deleted == []
        # The code was not spent on the refused attempt.
        r = await client.post("/account/delete", content=_delete(email, code), headers=FORM)
        assert r.status_code == 200, r.text

    async def test_if_supabase_fails_at_the_end_no_data_is_left(self, client, auth_admin, db):
        from app.models import User

        email, _ = await _account(client)
        code = await _emailed_code(client, auth_admin, email)
        real = auth_admin._handle  # the code checks out; only the final delete fails

        async def failing_delete(request):
            if request.method == "DELETE":
                import httpx
                return httpx.Response(503)
            return await real(request)

        from app.auth import admin
        admin._transport = __import__("httpx").MockTransport(failing_delete)
        try:
            r = await client.post("/account/delete", content=_delete(email, code), headers=FORM)
        finally:
            admin._transport = auth_admin.transport()
        assert r.status_code == 503
        assert await db.scalar(select(User).where(User.email == email)) is None

    async def test_what_was_typed_is_escaped_when_it_comes_back(self, client):
        hostile = '"><script>alert(1)</script>@example.com'
        r = await client.post("/account/delete", content=_send(hostile), headers=FORM)
        assert "<script>alert(1)</script>" not in r.text
        assert "&lt;script&gt;" in r.text or "&#x27;" in r.text or "&quot;" in r.text

    async def test_the_code_is_never_echoed_back(self, client, auth_admin):
        email, _ = await _account(client)
        await _emailed_code(client, auth_admin, email)
        r = await client.post("/account/delete", content=_delete(email, "654321"), headers=FORM)
        assert "654321" not in r.text

    async def test_an_oversized_body_is_refused(self, client):
        r = await client.post("/account/delete", content="email=" + "a" * 20_000, headers=FORM)
        assert r.status_code == 413

    async def test_a_declared_oversized_body_is_refused_before_it_is_read(self, client):
        r = await client.post("/account/delete", content="email=x",
                              headers={**FORM, "content-length": "999999"})
        assert r.status_code == 413

    async def test_too_many_fields_is_a_refusal_not_a_crash(self, client):
        r = await client.post("/account/delete", content="a=1" + "&" * 20, headers=FORM)
        assert r.status_code == 400
        assert r.headers["content-type"].startswith("text/html")

    async def test_a_body_that_is_not_a_form_is_refused(self, client):
        r = await client.post("/account/delete", json={"email": "x@example.com"})
        assert r.status_code == 415

    async def test_a_rate_limited_attempt_is_a_page_not_json(self, client, rate_limits):
        rate_limits.set("account_delete", ip="1/minute")
        await client.post("/account/delete", content=_send("x@example.com"), headers=FORM)
        r = await client.post("/account/delete", content=_send("x@example.com"), headers=FORM)
        assert r.status_code == 429
        assert r.headers["content-type"].startswith("text/html")
        assert r.headers["retry-after"]
        assert "Too many attempts" in r.text
