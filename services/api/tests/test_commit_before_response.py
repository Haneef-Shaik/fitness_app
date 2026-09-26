"""A write is saved before the app is told it was.

FastAPI runs a `yield` dependency's exit — our commit — AFTER the response has
gone, unless the dependency is function-scoped. A commit that failed there
(a deferred constraint, a lost connection) had already answered 200: the
outbox marked the write sent, and it was never saved. Nothing on the phone
could know.
"""
from __future__ import annotations

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.main import app

pytestmark = pytest.mark.asyncio


async def test_a_commit_that_fails_is_not_reported_as_success(auth_client, monkeypatch):
    # What the phone would see: the response as sent, not an exception the
    # server raised after sending it.
    transport = ASGITransport(app=app, raise_app_exceptions=False)
    async with AsyncClient(transport=transport, base_url="http://test") as phone:
        phone.headers["authorization"] = auth_client.headers["authorization"]

        async def refuse(self):
            raise RuntimeError("the database went away at commit")

        monkeypatch.setattr(AsyncSession, "commit", refuse)
        r = await phone.patch("/v1/profile", json={"display_name": "Nobody saved me"})

    assert r.status_code >= 500, r.text
