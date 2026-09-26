"""The `ObjectStore` contract, held against every implementation (D26, L1).

"S3 becomes one more implementation" is only true if the two behave the same at
the edges the callers rely on: a missing object reads as `FileNotFoundError`
(the worker turns that into `image_unreadable`), deleting a missing object is
not an error, a key cannot climb out of the store, and `delete_prefix` removes a
user's folder **and nothing beside it** — which is what account deletion is.

The S3 half runs over real HTTP against moto's server by default, or against
MinIO / a staging bucket when `S3_TEST_ENDPOINT_URL` is set (see conftest).
"""
from __future__ import annotations

import asyncio
import time

import httpx
import pytest

pytestmark = pytest.mark.asyncio

JPEG = b"\xff\xd8" + b"\xff\xdb\x00\x43" + bytes(65) + b"\xff\xd9"


async def _get(url: str) -> httpx.Response:
    """As a phone would: a plain GET, no credentials."""
    async with httpx.AsyncClient() as client:
        return await client.get(url)


@pytest.fixture(params=["local", "s3"])
def store(request, tmp_path):
    if request.param == "local":
        from app.storage.local import LocalObjectStore

        return LocalObjectStore(tmp_path / "store")
    return request.getfixturevalue("s3_store")


class TestTheContract:
    async def test_what_is_put_is_what_is_read(self, store):
        await store.put("uploads/u1/a.jpg", JPEG, "image/jpeg")

        assert await store.read("uploads/u1/a.jpg") == JPEG

    async def test_exists_tells_a_stored_object_from_a_missing_one(self, store):
        await store.put("uploads/u1/a.jpg", JPEG, "image/jpeg")

        assert await store.exists("uploads/u1/a.jpg") is True
        assert await store.exists("uploads/u1/never.jpg") is False

    async def test_reading_a_missing_object_is_FileNotFoundError(self, store):
        # Not a transport error: the worker maps this to `image_unreadable`
        # and anything else to `ai_unavailable`.
        with pytest.raises(FileNotFoundError):
            await store.read("uploads/u1/never.jpg")

    async def test_delete_removes_and_deleting_twice_is_not_an_error(self, store):
        await store.put("uploads/u1/a.jpg", JPEG, "image/jpeg")

        await store.delete("uploads/u1/a.jpg")
        await store.delete("uploads/u1/a.jpg")

        assert await store.exists("uploads/u1/a.jpg") is False

    async def test_delete_prefix_takes_the_folder_and_nothing_beside_it(self, store):
        """`uploads/u1` must not take `uploads/u10` with it. On S3 a prefix is a
        string match, so the store has to add the slash itself."""
        for key in ("uploads/u1/a.jpg", "uploads/u1/b.png", "uploads/u1/sub/c.jpg"):
            await store.put(key, JPEG, "image/jpeg")
        await store.put("uploads/u10/keep.jpg", JPEG, "image/jpeg")

        removed = await store.delete_prefix("uploads/u1")

        assert removed == 3
        assert await store.exists("uploads/u1/a.jpg") is False
        assert await store.exists("uploads/u1/sub/c.jpg") is False
        assert await store.exists("uploads/u10/keep.jpg") is True

    async def test_delete_prefix_on_nothing_removes_nothing(self, store):
        assert await store.delete_prefix("uploads/nobody") == 0

    @pytest.mark.parametrize("key", ["../outside.jpg", "uploads/../../etc/passwd", "/abs.jpg"])
    async def test_a_key_that_climbs_out_of_the_store_is_refused(self, store, key):
        # A key is user-influenced input.
        with pytest.raises(ValueError):
            await store.put(key, JPEG, "image/jpeg")
        assert await store.exists(key) is False

    async def test_a_read_url_is_short_lived_and_names_the_object(self, store):
        await store.put("uploads/u1/a.jpg", JPEG, "image/jpeg")

        url = store.read_url("uploads/u1/a.jpg", ttl_seconds=60)

        assert "uploads/u1/a.jpg" in url
        # Expiring by construction: there is no URL without a deadline.
        assert ("exp=" in url) or ("X-Amz-Expires=60" in url)


class TestTheS3Store:
    """What only the bucket can show."""

    async def test_a_presigned_url_serves_the_object_without_a_token(self, s3_store):
        await s3_store.put("uploads/u1/a.jpg", JPEG, "image/jpeg")

        response = await _get(s3_store.read_url("uploads/u1/a.jpg", ttl_seconds=60))

        assert response.status_code == 200
        assert response.content == JPEG

    async def test_the_object_itself_is_private(self, s3_store, s3_endpoint):
        """BRD §18 — no public URL pattern exists. Without the signature, the
        same path is refused."""
        await s3_store.put("uploads/u1/a.jpg", JPEG, "image/jpeg")

        bare = f"{s3_endpoint.url}/{s3_store.bucket}/uploads/u1/a.jpg"
        assert (await _get(bare)).status_code == 403

    async def test_a_presigned_url_expires(self, s3_store, s3_endpoint):
        if not s3_endpoint.real:
            pytest.skip("moto does not enforce presigned expiry; set S3_TEST_ENDPOINT_URL")
        await s3_store.put("uploads/u1/a.jpg", JPEG, "image/jpeg")
        url = s3_store.read_url("uploads/u1/a.jpg", ttl_seconds=1)

        await asyncio.sleep(2.5)

        assert (await _get(url)).status_code == 403

    async def test_the_content_type_is_stored_with_the_object(self, s3_store, s3_endpoint):
        await s3_store.put("uploads/u1/a.png", b"\x89PNG\r\n\x1a\n", "image/png")

        head = s3_endpoint.client().head_object(Bucket=s3_store.bucket, Key="uploads/u1/a.png")

        assert head["ContentType"] == "image/png"

    async def test_delete_prefix_pages_through_more_than_one_listing(
        self, s3_store, monkeypatch
    ):
        """A real account has more photos than one listing page returns. The
        page is shrunk here rather than uploading a thousand objects."""
        from app.storage import s3

        monkeypatch.setattr(s3, "PAGE_SIZE", 2)
        for i in range(5):
            await s3_store.put(f"uploads/u1/{i}.jpg", JPEG, "image/jpeg")

        assert await s3_store.delete_prefix("uploads/u1") == 5
        assert await s3_store.exists("uploads/u1/4.jpg") is False

    async def test_blocking_calls_do_not_block_the_event_loop(self, s3_store, monkeypatch):
        """boto3 is synchronous. A PUT that ran on the loop would stall every
        request the API is serving for the length of the upload."""
        window: dict[str, float] = {}
        original = s3_store._client.put_object

        def slow_put(**kwargs):
            window["start"] = time.monotonic()
            time.sleep(0.3)
            window["end"] = time.monotonic()
            return original(**kwargs)

        monkeypatch.setattr(s3_store._client, "put_object", slow_put)
        ticks: list[float] = []

        async def ticker():
            for _ in range(30):
                await asyncio.sleep(0.02)
                ticks.append(time.monotonic())

        await asyncio.gather(s3_store.put("uploads/u1/a.jpg", JPEG, "image/jpeg"), ticker())

        # The loop kept turning WHILE the PUT held its thread. On the loop
        # itself, not one tick could land inside that window.
        during = [t for t in ticks if window["start"] < t < window["end"]]
        assert len(during) >= 5, f"{len(during)} ticks during a 300 ms PUT"
