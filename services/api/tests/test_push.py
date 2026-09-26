"""Push: a phone registers once, and hears when a photo's estimate is ready."""
from __future__ import annotations

import uuid

import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.models import PushToken
from app.notify.push import RecordingPushSender
from tests.auth import PASSWORD, end_session, sign_in

pytestmark = pytest.mark.asyncio

TOKEN = "ExponentPushToken[abc123abc123]"


def _data(response, expect: int = 200):
    assert response.status_code == expect, response.text
    return response.json()["data"]


@pytest.fixture
def pushed(engine, gateway, storage):
    from app.worker.runner import AnalysisWorker

    sender = RecordingPushSender(dead={"ExponentPushToken[gone0000000]"})
    maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    return sender, AnalysisWorker(maker, gateway=gateway, store=storage, push=sender)


async def _drain(worker) -> None:
    # This worker must take ITS job, so drain the queue the suite shares.
    await worker.drain()


async def test_registering_twice_is_one_token(auth_client):
    body = {"token": TOKEN, "platform": "android"}
    _data(await auth_client.put("/v1/devices/push-token", json=body))
    _data(await auth_client.put("/v1/devices/push-token", json=body))
    assert _data(await auth_client.request("DELETE", "/v1/devices/push-token", json=body))["deleted"] is True
    assert _data(await auth_client.request("DELETE", "/v1/devices/push-token", json=body))["deleted"] is False


async def test_a_token_that_is_not_an_expo_token_is_refused(auth_client):
    r = await auth_client.put("/v1/devices/push-token", json={"token": "not-a-token-at-all", "platform": "ios"})
    assert r.status_code == 422


async def test_a_photo_estimate_is_announced_to_the_owners_phones(auth_client, pushed, uploaded_image):
    sender, worker = pushed
    token = f"ExponentPushToken[{uuid.uuid4().hex[:12]}]"
    _data(await auth_client.put("/v1/devices/push-token", json={"token": token, "platform": "ios"}))

    started = _data(await auth_client.post("/v1/food-analysis/image", json={"image_key": uploaded_image}), 202)
    await _drain(worker)

    mine = [m for m in sender.sent if m.token == token]
    assert len(mine) == 1
    assert mine[0].title == "Your meal estimate is ready"
    assert mine[0].data == {"type": "analysis", "analysis_id": started["id"]}


async def test_a_text_estimate_is_not_announced(auth_client, pushed):
    sender, worker = pushed
    token = f"ExponentPushToken[{uuid.uuid4().hex[:12]}]"
    _data(await auth_client.put("/v1/devices/push-token", json={"token": token, "platform": "ios"}))

    _data(await auth_client.post("/v1/food-analysis/text", json={"text": "2 eggs and toast"}), 202)
    await _drain(worker)

    assert [m for m in sender.sent if m.token == token] == []


async def test_a_token_the_service_has_forgotten_is_removed(auth_client, pushed, uploaded_image, engine):
    _, worker = pushed
    dead = "ExponentPushToken[gone0000000]"
    _data(await auth_client.put("/v1/devices/push-token", json={"token": dead, "platform": "android"}))

    _data(await auth_client.post("/v1/food-analysis/image", json={"image_key": uploaded_image}), 202)
    await _drain(worker)

    maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with maker() as db:
        assert await db.scalar(select(PushToken).where(PushToken.token == dead)) is None


async def test_a_phone_that_signs_out_stops_receiving_the_accounts_pushes(
    auth_client, client, pushed, uploaded_image, engine,
):
    """"Sign out other devices" ends the other sign-ins in Supabase; a phone
    whose sign-in has ended hears nothing more, and its token is removed."""
    sender, worker = pushed
    me = _data(await auth_client.get("/v1/auth/me"))
    phone_b = _data(await sign_in(client, json={"email": me["email"], "password": PASSWORD}))
    token_a, token_b = f"ExponentPushToken[{uuid.uuid4().hex[:12]}]", f"ExponentPushToken[{uuid.uuid4().hex[:12]}]"
    _data(await auth_client.put("/v1/devices/push-token", json={"token": token_a, "platform": "ios"}))
    _data(await client.put("/v1/devices/push-token", json={"token": token_b, "platform": "android"},
                           headers={"authorization": f"Bearer {phone_b['access_token']}"}))

    await end_session(uuid.UUID(phone_b["session_id"]))  # phone A: "sign out other devices"
    _data(await auth_client.post("/v1/food-analysis/image", json={"image_key": uploaded_image}), 202)
    await _drain(worker)

    assert {m.token for m in sender.sent} & {token_a, token_b} == {token_a}
    maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with maker() as db:
        left = set((await db.scalars(select(PushToken.token).where(PushToken.token.in_([token_a, token_b])))).all())
    assert left == {token_a}
