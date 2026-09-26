"""Progress-photo thumbnails rendered by Supabase Storage (docs/14, S10).

Storage is reached over HTTP, so it is stood in for here by an httpx
MockTransport that records every signing request — what was asked for, with
which key, for whose photos. `SUPABASE_TEST_URL` / `SUPABASE_TEST_SECRET_KEY`
run the last test against a real Storage (the local stack: `pnpm supabase
start`), which is the only thing that proves the render itself.
"""
from __future__ import annotations

import base64
import json
import os

import httpx
import pytest

from app.config import get_settings
from app.storage import thumbnails
from tests.auth import SUPABASE_URL as SUPABASE  # the suite's project: tokens are its
from tests.auth import sign_up
from tests.test_signed_reads import _data, _jpeg_with_gps, _photo, _upload


class _Storage:
    """Signs every path it is asked for, unless told to refuse."""

    def __init__(self) -> None:
        self.requests: list[httpx.Request] = []
        self.refuse = False

    def handler(self, request: httpx.Request) -> httpx.Response:
        self.requests.append(request)
        if self.refuse:
            return httpx.Response(500, json={"message": "no"})
        path = request.url.path.removeprefix("/storage/v1/object/sign/")
        return httpx.Response(200, json={"signedURL": f"/render/image/sign/{path}?token=t"})

    def signed_keys(self) -> list[str]:
        return [r.url.path.split("/", 6)[-1] for r in self.requests]


@pytest.fixture
def storage_api(monkeypatch, s3_storage):
    fake = _Storage()
    settings = get_settings()
    monkeypatch.setattr(settings, "supabase_url", SUPABASE)
    monkeypatch.setattr(settings, "supabase_secret_key", "sb_secret_test")
    monkeypatch.setattr(thumbnails, "_transport", httpx.MockTransport(fake.handler))
    thumbnails.clear_cache()
    yield fake
    thumbnails.clear_cache()


async def _listing(client) -> list[dict]:
    return _data(await client.get("/v1/progress-photos"))


class TestTheGrid:
    async def test_each_photo_gets_a_signed_small_copy(self, auth_client, s3_storage, storage_api):
        key = await _upload(auth_client, _jpeg_with_gps())
        await _photo(auth_client, key)

        [photo] = await _listing(auth_client)

        assert photo["thumbnail_url"] == (
            f"{SUPABASE}/storage/v1/render/image/sign/{s3_storage.bucket}/{key}?token=t"
        )
        assert photo["image_url"]  # the original is still there to open
        [request] = storage_api.requests
        assert request.headers["apikey"] == "sb_secret_test"
        body = json.loads(request.content)
        assert body["transform"] == {"width": 288, "height": 384, "resize": "cover", "quality": 70}
        assert body["expiresIn"] == get_settings().upload_url_ttl_seconds

    async def test_only_the_owners_photos_are_signed(
        self, auth_client, client, s3_storage, storage_api,
    ):
        mine = await _upload(auth_client, _jpeg_with_gps())
        await _photo(auth_client, mine)

        # A second account with a photo of its own, listed by its owner only.
        other = client.__class__(transport=client._transport, base_url=client.base_url)
        r = await sign_up(other, json={
            "email": "thumbs-other@example.com", "password": "correct-horse-battery"})
        other.headers["authorization"] = f"Bearer {r.json()['data']['access_token']}"
        theirs = await _upload(other, _jpeg_with_gps())
        await _photo(other, theirs)
        storage_api.requests.clear()

        await _listing(auth_client)

        assert storage_api.signed_keys() == [mine]
        await other.aclose()

    async def test_a_scrolled_back_grid_is_not_signed_again(
        self, auth_client, s3_storage, storage_api,
    ):
        await _photo(auth_client, await _upload(auth_client, _jpeg_with_gps()))

        first = await _listing(auth_client)
        second = await _listing(auth_client)

        assert len(storage_api.requests) == 1
        assert first[0]["thumbnail_url"] == second[0]["thumbnail_url"]


class TestNeverInTheWay:
    async def test_storage_refusing_leaves_the_original(self, auth_client, s3_storage, storage_api):
        storage_api.refuse = True
        await _photo(auth_client, await _upload(auth_client, _jpeg_with_gps()))

        [photo] = await _listing(auth_client)

        assert photo["thumbnail_url"] is None
        assert photo["image_url"]

    async def test_without_the_secret_key_nothing_is_asked(self, auth_client, s3_storage, monkeypatch):
        monkeypatch.setattr(get_settings(), "supabase_secret_key", "")
        await _photo(auth_client, await _upload(auth_client, _jpeg_with_gps()))

        [photo] = await _listing(auth_client)

        assert photo["thumbnail_url"] is None

    async def test_the_local_store_has_no_thumbnails(self, auth_client, storage, monkeypatch):
        monkeypatch.setattr(get_settings(), "supabase_url", SUPABASE)
        monkeypatch.setattr(get_settings(), "supabase_secret_key", "sb_secret_test")
        await _photo(auth_client, await _upload(auth_client, _jpeg_with_gps()))

        [photo] = await _listing(auth_client)

        assert photo["thumbnail_url"] is None


class TestTheCache:
    async def test_a_url_is_re_signed_once_half_its_life_is_gone(self, s3_storage, storage_api):
        ttl = 600
        first = await thumbnails.signed_thumbnails(["uploads/u/a.jpg"], ttl, now=1000.0)
        await thumbnails.signed_thumbnails(["uploads/u/a.jpg"], ttl, now=1000.0 + ttl / 2 - 1)
        assert len(storage_api.requests) == 1

        again = await thumbnails.signed_thumbnails(["uploads/u/a.jpg"], ttl, now=1000.0 + ttl / 2 + 1)
        assert len(storage_api.requests) == 2
        assert again == first  # same shape; the fake signs the same way


#: A real 48 × 64 JPEG (a checkerboard): Storage's renderer must be able to
#: decode it, which the suite's header-only JPEG is not.
REAL_JPEG = base64.b64decode(
    "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsj"
    "HBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgo"
    "KCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCABAADADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAA"
    "AAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAk"
    "M2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKT"
    "lJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QA"
    "HwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdh"
    "cRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hp"
    "anN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk"
    "5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwC/XnlFeh1p/wAiH+/z/K1vv7nb/wAjr+5yfO9/u7BXnlFeh0f8"
    "iH+/z/K1vv7h/wAjr+5yfO9/u7BXnlFeh0f8iH+/z/K1vv7h/wAjr+5yfO9/u7BXnlFeh0f8iH+/z/K1vv7h/wAj"
    "r+5yfO9/u7BXnlFeh0f8iH+/z/K1vv7h/wAjr+5yfO9/u7BXnlFeh0f8iH+/z/K1vv7h/wAjr+5yfO9/u7BXnlFe"
    "h0f8iH+/z/K1vv7h/wAjr+5yfO9/u7BXnlFeh0f8iH+/z/K1vv7h/wAjr+5yfO9/u7BXnlFeh0f8iH+/z/K1vv7h"
    "/wAjr+5yfO9/u7BXnlFeh0f8iH+/z/K1vv7h/wAjr+5yfO9/u7BXnlFeh0f8iH+/z/K1vv7h/wAjr+5yfO9/u7BX"
    "nlFeh0f8iH+/z/K1vv7h/wAjr+5yfO9/u7H/2Q=="
)


@pytest.mark.skipif(
    not (os.environ.get("SUPABASE_TEST_URL") and os.environ.get("S3_TEST_ENDPOINT_URL")),
    reason="set SUPABASE_TEST_URL, SUPABASE_TEST_SECRET_KEY and S3_TEST_* (pnpm supabase start)",
)
async def test_real_storage_renders_the_thumbnail(auth_client, s3_storage, monkeypatch):
    """Against a real Storage: the signed render URL returns an image. The
    photos' bucket must be Storage's own, so S3_TEST_ENDPOINT_URL points at the
    same stack."""
    monkeypatch.setattr(get_settings(), "supabase_url", os.environ["SUPABASE_TEST_URL"])
    monkeypatch.setattr(get_settings(), "supabase_secret_key", os.environ["SUPABASE_TEST_SECRET_KEY"])
    thumbnails.clear_cache()
    await _photo(auth_client, await _upload(auth_client, REAL_JPEG))

    [photo] = await _listing(auth_client)

    assert photo["thumbnail_url"] and "/render/image/sign/" in photo["thumbnail_url"]
    async with httpx.AsyncClient() as anonymous:
        rendered = await anonymous.get(photo["thumbnail_url"])
    assert rendered.status_code == 200
    assert rendered.headers["content-type"].startswith("image/")
