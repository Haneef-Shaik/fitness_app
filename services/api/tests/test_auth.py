"""M1 auth. Covers the security rules stated in docs/06 §9."""
from __future__ import annotations

import uuid

import pytest

pytestmark = pytest.mark.asyncio


def _email() -> str:
    return f"user-{uuid.uuid4().hex[:10]}@example.com"


async def test_register_returns_envelope_and_tokens(client):
    r = await client.post("/v1/auth/register", json={"email": _email(), "password": "correct-horse-battery"})
    assert r.status_code == 201
    body = r.json()
    assert body["success"] is True and body["error"] is None
    assert body["data"]["access_token"] and body["data"]["refresh_token"]


async def test_weak_password_is_rejected_with_a_fixable_message(client):
    r = await client.post("/v1/auth/register", json={"email": _email(), "password": "short"})
    assert r.status_code == 422
    err = r.json()["error"]
    assert err["code"] == "VALIDATION_FAILED"
    assert err["fields"]["password"] == "Use at least 10 characters."
    assert err["request_id"].startswith("req_")


async def test_common_password_is_rejected(client):
    r = await client.post("/v1/auth/register", json={"email": _email(), "password": "letmein123"})
    assert r.status_code == 422
    assert "too common" in r.json()["error"]["fields"]["password"]


async def test_duplicate_email_is_rejected(client):
    email = _email()
    await client.post("/v1/auth/register", json={"email": email, "password": "correct-horse-battery"})
    r = await client.post("/v1/auth/register", json={"email": email, "password": "correct-horse-battery"})
    assert r.status_code == 422
    assert "already uses this email" in r.json()["error"]["message"]


async def test_login_does_not_reveal_whether_an_account_exists(client):
    email = _email()
    await client.post("/v1/auth/register", json={"email": email, "password": "correct-horse-battery"})

    wrong_pw = await client.post("/v1/auth/login", json={"email": email, "password": "wrong-password-x"})
    no_user = await client.post("/v1/auth/login", json={"email": _email(), "password": "wrong-password-x"})

    assert wrong_pw.status_code == no_user.status_code == 401
    assert wrong_pw.json()["error"]["message"] == no_user.json()["error"]["message"]


async def test_email_is_normalised_to_lowercase(client):
    email = _email()
    await client.post("/v1/auth/register", json={"email": email.upper(), "password": "correct-horse-battery"})
    r = await client.post("/v1/auth/login", json={"email": email, "password": "correct-horse-battery"})
    assert r.status_code == 200


async def test_me_requires_a_token(client):
    r = await client.get("/v1/auth/me")
    assert r.status_code == 401
    assert r.json()["error"]["code"] == "UNAUTHORIZED"


async def test_refresh_rotates_the_token(client):
    r = await client.post("/v1/auth/register", json={"email": _email(), "password": "correct-horse-battery"})
    first = r.json()["data"]["refresh_token"]

    r2 = await client.post("/v1/auth/refresh", json={"refresh_token": first})
    assert r2.status_code == 200
    second = r2.json()["data"]["refresh_token"]
    assert second != first


async def test_reusing_a_rotated_token_revokes_the_whole_family(client):
    r = await client.post("/v1/auth/register", json={"email": _email(), "password": "correct-horse-battery"})
    first = r.json()["data"]["refresh_token"]

    second = (await client.post("/v1/auth/refresh", json={"refresh_token": first})).json()["data"]["refresh_token"]

    # Replaying the old token means it leaked.
    replay = await client.post("/v1/auth/refresh", json={"refresh_token": first})
    assert replay.status_code == 401
    assert "signed out for security" in replay.json()["error"]["message"]

    # ...and the token issued from it is dead too.
    after = await client.post("/v1/auth/refresh", json={"refresh_token": second})
    assert after.status_code == 401
