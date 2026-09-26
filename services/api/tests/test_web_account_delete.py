"""The web account-deletion page (Google Play's "delete without the app" URL).

Google Play requires a link where somebody who no longer has the app — lost
phone, uninstalled it, never trusted it — can still have their account removed.
It is a page served by the API itself, so it exists wherever the API does.

What these tests hold it to:

* It deletes through **the same code** as the in-app delete, so it cannot leave
  behind what the app would have removed. The completeness check from
  test_account.py is re-run against it.
* It never says which half of a credential was wrong.
* It is a plain page: no script, nothing loaded from anywhere else, readable on
  a phone, labelled for a screen reader, and impossible to frame.
"""
from __future__ import annotations

import re
import uuid

import pytest
from sqlalchemy import select

from tests.test_account import _child_row_counts, _populate, _user_row_counts

pytestmark = pytest.mark.asyncio

FORM = {"content-type": "application/x-www-form-urlencoded"}


def _form(email: str, password: str, confirmation: str = "DELETE") -> str:
    from urllib.parse import urlencode

    return urlencode({"email": email, "password": password, "confirmation": confirmation})


async def _account(client) -> tuple[str, str]:
    email = f"web-{uuid.uuid4().hex[:10]}@example.com"
    r = await client.post("/v1/auth/register",
                          json={"email": email, "password": "correct-horse-battery"})
    assert r.status_code == 201, r.text
    return email, r.json()["data"]["access_token"]


class TestThePage:
    async def test_it_is_a_form_that_posts_back_to_itself(self, client):
        r = await client.get("/account/delete")
        assert r.status_code == 200
        assert r.headers["content-type"].startswith("text/html")
        html = r.text

        assert re.search(r'<form[^>]+method="post"[^>]+action="/account/delete"', html)
        for name, kind in (("email", "email"), ("password", "password"),
                           ("confirmation", "text")):
            assert re.search(rf'<input[^>]+type="{kind}"[^>]+name="{name}"', html), name
            # Every field has a real label, not just a placeholder.
            assert f'<label for="{name}">' in html, name

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
    async def test_the_right_credentials_delete_the_account(self, client):
        email, _ = await _account(client)

        r = await client.post("/account/delete", content=_form(email, "correct-horse-battery"),
                              headers=FORM)
        assert r.status_code == 200, r.text
        assert "has been deleted" in r.text

        login = await client.post("/v1/auth/login",
                                  json={"email": email, "password": "correct-horse-battery"})
        assert login.status_code == 401

    async def test_it_deletes_as_completely_as_the_app_does(self, client, worker, db):
        """The same service, so the same completeness — asserted, not assumed."""
        from app.models import User

        email, token = await _account(client)
        client.headers["authorization"] = f"Bearer {token}"
        await _populate(client)
        del client.headers["authorization"]
        user_id = (await db.scalar(select(User).where(User.email == email))).id

        r = await client.post("/account/delete", content=_form(email, "correct-horse-battery"),
                              headers=FORM)
        assert r.status_code == 200, r.text

        db.expire_all()
        after = {**await _user_row_counts(db, user_id),
                 **await _child_row_counts(db, user_id)}
        assert not {n: c for n, c in after.items() if c}, after

    async def test_the_uploaded_files_go_too(self, auth_client, storage, uploaded_image):
        me = (await auth_client.get("/v1/auth/me")).json()["data"]
        await auth_client.post("/v1/progress-photos", json={"image_key": uploaded_image},
                               headers={"Idempotency-Key": str(uuid.uuid4())})
        assert await storage.exists(uploaded_image)

        # The page ignores any bearer token: the form's own credentials decide.
        r = await auth_client.post("/account/delete",
                                   content=_form(me["email"], "correct-horse-battery"),
                                   headers=FORM)
        assert r.status_code == 200, r.text
        assert not await storage.exists(uploaded_image)

    async def test_a_wrong_password_and_an_unknown_email_read_the_same(self, client):
        """No enumeration: the page never confirms that an account exists."""
        email, _ = await _account(client)

        wrong = await client.post("/account/delete", content=_form(email, "not-it"),
                                  headers=FORM)
        unknown = await client.post(
            "/account/delete",
            content=_form(f"nobody-{uuid.uuid4().hex[:6]}@example.com", "not-it"),
            headers=FORM)

        assert wrong.status_code == unknown.status_code == 401
        assert "Email or password is incorrect" in wrong.text
        assert "Email or password is incorrect" in unknown.text

        # And the account is still there.
        login = await client.post("/v1/auth/login",
                                  json={"email": email, "password": "correct-horse-battery"})
        assert login.status_code == 200

    async def test_the_confirmation_word_is_required(self, client):
        email, _ = await _account(client)
        r = await client.post("/account/delete",
                              content=_form(email, "correct-horse-battery", "delete"),
                              headers=FORM)
        assert r.status_code == 422
        assert "DELETE" in r.text
        login = await client.post("/v1/auth/login",
                                  json={"email": email, "password": "correct-horse-battery"})
        assert login.status_code == 200

    async def test_what_was_typed_is_escaped_when_it_comes_back(self, client):
        hostile = '"><script>alert(1)</script>@example.com'
        r = await client.post("/account/delete", content=_form(hostile, "x"), headers=FORM)
        assert "<script>alert(1)</script>" not in r.text
        assert "&lt;script&gt;" in r.text or "&#x27;" in r.text or "&quot;" in r.text

    async def test_the_password_is_never_echoed_back(self, client):
        r = await client.post("/account/delete",
                              content=_form("x@example.com", "hunter2-secret-guess"),
                              headers=FORM)
        assert "hunter2-secret-guess" not in r.text

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

    async def test_an_unknown_email_still_checks_a_password(self, client, monkeypatch):
        """Skipping the hash for an unknown email makes that answer faster,
        which says which emails have accounts. Both paths pay for one verify."""
        from app.web import account_delete

        checked: list[str] = []
        real = account_delete.verify_password

        def spy(raw, hashed):
            checked.append(hashed)
            return real(raw, hashed)

        monkeypatch.setattr(account_delete, "verify_password", spy)
        await client.post("/account/delete",
                          content=_form(f"ghost-{uuid.uuid4().hex[:6]}@example.com", "x"),
                          headers=FORM)
        assert len(checked) == 1

    async def test_a_body_that_is_not_a_form_is_refused(self, client):
        r = await client.post("/account/delete", json={"email": "x@example.com"})
        assert r.status_code == 415

    async def test_a_rate_limited_attempt_is_a_page_not_json(self, client, rate_limits):
        rate_limits.set("account_delete", ip="1/minute")
        await client.post("/account/delete", content=_form("x@example.com", "x"), headers=FORM)
        r = await client.post("/account/delete", content=_form("x@example.com", "x"),
                              headers=FORM)
        assert r.status_code == 429
        assert r.headers["content-type"].startswith("text/html")
        assert r.headers["retry-after"]
        assert "Too many attempts" in r.text
