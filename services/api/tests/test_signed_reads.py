"""Reading a photograph back: signed, expiring, and never public (BRD §18, L1).

The client asked for `/v1/uploads/<key>` and nothing served it — an `<Image>`
cannot attach a bearer token the way `fetch` does, and a progress photo is the
most personal thing the app stores. So every photo now carries an `image_url`:
a capability that expires, which is exactly what a presigned S3 URL is. The
local store signs one that this API serves; the S3 store hands out the bucket's.

The S3 half below runs the real routes against a bucket — the upload strips EXIF
on its way in, the URL reads it back, and deleting the account empties the
user's folder and nobody else's.
"""
from __future__ import annotations

import struct
import uuid

import httpx
import pytest
from httpx import ASGITransport

from app.main import app

pytestmark = pytest.mark.asyncio

GPS = b"51.5074N-0.1278W"


def _jpeg_with_gps() -> bytes:
    exif = b"Exif\x00\x00MM\x00\x2a" + GPS
    app1 = b"\xff\xe1" + struct.pack(">H", len(exif) + 2) + exif
    dqt = b"\xff\xdb" + struct.pack(">H", 67) + b"\x00" + bytes(range(64))
    return b"\xff\xd8" + app1 + dqt + b"\xff\xd9"


def _data(response, expect: int = 200):
    assert response.status_code == expect, response.text
    return response.json()["data"]


async def _anonymous_get(url: str) -> httpx.Response:
    """As an `<Image>` would: no bearer token."""
    if url.startswith("/"):
        async with httpx.AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as anonymous:
            return await anonymous.get(url)
    async with httpx.AsyncClient() as anonymous:
        return await anonymous.get(url)


async def _upload(auth_client, content: bytes) -> str:
    signed = _data(await auth_client.post("/v1/uploads/sign", json={
        "content_type": "image/jpeg", "byte_size": len(content),
    }), 201)
    put = await auth_client.put(signed["upload_url"], content=content,
                                headers={"content-type": "image/jpeg"})
    assert put.status_code == 200, put.text
    return signed["key"]


async def _photo(auth_client, key: str) -> dict:
    return _data(await auth_client.post("/v1/progress-photos", json={
        "image_key": key, "pose": "front",
    }), 201)


class TestTheLocalStore:
    async def test_a_photo_carries_a_url_that_reads_it_without_a_token(
        self, auth_client, storage
    ):
        key = await _upload(auth_client, _jpeg_with_gps())
        photo = await _photo(auth_client, key)

        assert photo["image_url"].startswith("/v1/uploads/")
        response = await _anonymous_get(photo["image_url"])

        assert response.status_code == 200
        assert response.headers["content-type"] == "image/jpeg"
        # What was stored — so, stripped.
        assert response.content == await storage.read(key)
        assert GPS not in response.content

    async def test_the_list_carries_the_url_too(self, auth_client, storage):
        await _photo(auth_client, await _upload(auth_client, _jpeg_with_gps()))

        rows = _data(await auth_client.get("/v1/progress-photos"))

        assert rows and all(r["image_url"] for r in rows)

    async def test_a_tampered_url_is_refused(self, auth_client, storage):
        photo = await _photo(auth_client, await _upload(auth_client, _jpeg_with_gps()))

        response = await _anonymous_get(photo["image_url"].replace("sig=", "sig=x"))

        assert response.status_code == 403

    async def test_an_expired_url_is_refused(self, auth_client, storage, monkeypatch):
        from app.storage import signing

        photo = await _photo(auth_client, await _upload(auth_client, _jpeg_with_gps()))
        real_now = signing._now
        monkeypatch.setattr(signing, "_now", lambda: real_now() + 10_000)

        assert (await _anonymous_get(photo["image_url"])).status_code == 403

    async def test_an_upload_signature_is_not_a_read_signature(self, auth_client, storage):
        """A URL issued to PUT one object must not become a way to GET it."""
        signed = _data(await auth_client.post("/v1/uploads/sign", json={
            "content_type": "image/jpeg", "byte_size": 1024,
        }), 201)
        await auth_client.put(signed["upload_url"], content=_jpeg_with_gps(),
                              headers={"content-type": "image/jpeg"})

        assert (await _anonymous_get(signed["upload_url"])).status_code == 403

    async def test_a_url_for_one_key_does_not_read_another(self, auth_client, storage):
        mine = await _photo(auth_client, await _upload(auth_client, _jpeg_with_gps()))
        other_key = await _upload(auth_client, _jpeg_with_gps())

        swapped = mine["image_url"].replace(mine["image_key"], other_key)

        assert (await _anonymous_get(swapped)).status_code == 403


class TestTheS3Store:
    async def test_an_upload_lands_in_the_bucket_stripped(self, auth_client, s3_storage):
        key = await _upload(auth_client, _jpeg_with_gps())

        stored = await s3_storage.read(key)

        assert stored.startswith(b"\xff\xd8")
        assert GPS not in stored

    async def test_the_photo_url_is_a_presigned_bucket_url(self, auth_client, s3_storage):
        key = await _upload(auth_client, _jpeg_with_gps())
        photo = await _photo(auth_client, key)

        assert "X-Amz-Signature=" in photo["image_url"]
        response = await _anonymous_get(photo["image_url"])

        assert response.status_code == 200
        assert response.content == await s3_storage.read(key)

    async def test_deleting_a_photo_deletes_the_object(self, auth_client, s3_storage):
        key = await _upload(auth_client, _jpeg_with_gps())
        photo = await _photo(auth_client, key)

        _data(await auth_client.delete(f"/v1/progress-photos/{photo['id']}"))

        assert await s3_storage.exists(key) is False

    async def test_deleting_the_account_empties_the_users_folder_and_no_one_elses(
        self, auth_client, s3_storage
    ):
        me = _data(await auth_client.get("/v1/profile"))
        mine = [await _upload(auth_client, _jpeg_with_gps()) for _ in range(3)]
        await _photo(auth_client, mine[0])

        # Somebody else's photograph, in the same bucket.
        theirs = f"uploads/{uuid.uuid4()}/keep.jpg"
        await s3_storage.put(theirs, _jpeg_with_gps(), "image/jpeg")

        r = await auth_client.post("/v1/account/delete", json={"password": "correct-horse-battery", "confirmation": "DELETE"})
        assert r.status_code == 200, r.text

        for key in mine:
            assert await s3_storage.exists(key) is False, key
        assert await s3_storage.exists(theirs) is True
        assert me  # the profile read proves the account existed before
