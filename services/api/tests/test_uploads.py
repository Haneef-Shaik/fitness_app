"""Signed uploads and EXIF stripping (G8 scope item 4).

**EXIF is stripped twice, and the server's turn is the one that counts.** A
client strips it before upload; a modified client simply does not. The server
therefore strips it again on arrival, and this file asserts the server's half on
bytes that genuinely carried GPS coordinates.

The signature is asserted the same way: the interesting cases are the ones where
it should be *refused*, because a signed URL that accepts anything is a public
write endpoint.
"""
from __future__ import annotations

import struct

import pytest

from app.storage.exif import strip_exif

pytestmark = pytest.mark.asyncio


def _data(response, expect: int = 200):
    assert response.status_code == expect, response.text
    return response.json()["data"]


# --------------------------------------------------------------- JPEG fixture

GPS_LATITUDE = b"\x33\x2e\x31\x34\x31\x35\x39\x2d\x4e-51.5074W"


def _jpeg_with_exif() -> bytes:
    """A structurally valid JPEG whose APP1 segment carries an EXIF payload.

    Hand-built rather than checked in as a binary, so the GPS bytes this asserts
    the removal of are visible in the test that asserts it.
    """
    exif_payload = b"Exif\x00\x00" + b"MM\x00\x2a" + GPS_LATITUDE
    app1 = b"\xff\xe1" + struct.pack(">H", len(exif_payload) + 2) + exif_payload

    jfif = b"JFIF\x00\x01\x01\x00\x00\x01\x00\x01\x00\x00"
    app0 = b"\xff\xe0" + struct.pack(">H", len(jfif) + 2) + jfif

    # A minimal but real frame: quantisation table, frame header, scan.
    dqt_payload = b"\x00" + bytes(range(64))
    dqt = b"\xff\xdb" + struct.pack(">H", len(dqt_payload) + 2) + dqt_payload
    sof_payload = b"\x08\x00\x08\x00\x08\x01\x01\x11\x00"
    sof = b"\xff\xc0" + struct.pack(">H", len(sof_payload) + 2) + sof_payload
    sos_payload = b"\x01\x01\x00\x00\x3f\x00"
    sos = b"\xff\xda" + struct.pack(">H", len(sos_payload) + 2) + sos_payload
    scan = b"\x00\x11\x22\x33"

    return b"\xff\xd8" + app0 + app1 + dqt + sof + sos + scan + b"\xff\xd9"


class TestExifStripping:
    def test_the_fixture_really_does_carry_gps_bytes(self):
        # Otherwise the test below proves nothing at all.
        assert GPS_LATITUDE in _jpeg_with_exif()

    def test_the_exif_segment_and_its_gps_bytes_are_gone(self):
        cleaned = strip_exif(_jpeg_with_exif(), "image/jpeg")

        assert GPS_LATITUDE not in cleaned
        assert b"Exif\x00\x00" not in cleaned

    def test_the_image_itself_survives(self):
        original = _jpeg_with_exif()
        cleaned = strip_exif(original, "image/jpeg")

        # Still a JPEG, and the scan data is untouched.
        assert cleaned.startswith(b"\xff\xd8")
        assert cleaned.endswith(b"\xff\xd9")
        assert b"\xff\xda" in cleaned
        assert b"\x00\x11\x22\x33" in cleaned

    def test_stripping_twice_changes_nothing_the_second_time(self):
        once = strip_exif(_jpeg_with_exif(), "image/jpeg")
        assert strip_exif(once, "image/jpeg") == once

    def test_a_png_loses_its_exif_and_text_chunks(self):
        import zlib

        def chunk(kind: bytes, payload: bytes) -> bytes:
            return (
                struct.pack(">I", len(payload)) + kind + payload
                + struct.pack(">I", zlib.crc32(kind + payload) & 0xFFFFFFFF)
            )

        png = (
            b"\x89PNG\r\n\x1a\n"
            + chunk(b"IHDR", struct.pack(">IIBBBBB", 1, 1, 8, 0, 0, 0, 0))
            + chunk(b"eXIf", b"MM\x00\x2a" + GPS_LATITUDE)
            + chunk(b"tEXt", b"Comment\x00taken at home")
            + chunk(b"IDAT", zlib.compress(b"\x00\x00"))
            + chunk(b"IEND", b"")
        )
        cleaned = strip_exif(png, "image/png")

        assert GPS_LATITUDE not in cleaned
        assert b"taken at home" not in cleaned
        assert cleaned.startswith(b"\x89PNG\r\n\x1a\n")
        assert b"IDAT" in cleaned and b"IEND" in cleaned

    def test_something_that_is_not_an_image_is_returned_untouched(self):
        # The caller validates the type; this function does not silently mangle.
        assert strip_exif(b"not an image", "image/jpeg") == b"not an image"


class TestSignedUploads:
    async def test_a_signed_url_accepts_the_upload_it_was_issued_for(self, auth_client):
        signed = _data(await auth_client.post("/v1/uploads/sign", json={
            "content_type": "image/jpeg", "byte_size": 1024,
        }), 201)

        assert signed["key"].startswith("uploads/")
        put = await auth_client.put(signed["upload_url"], content=_jpeg_with_exif(),
                                    headers={"content-type": "image/jpeg"})
        assert put.status_code == 200, put.text

    async def test_the_server_strips_exif_even_when_the_client_did_not(
        self, auth_client, storage
    ):
        """The one that matters. A modified client simply does not strip."""
        signed = _data(await auth_client.post("/v1/uploads/sign", json={
            "content_type": "image/jpeg", "byte_size": 1024,
        }), 201)
        await auth_client.put(signed["upload_url"], content=_jpeg_with_exif(),
                              headers={"content-type": "image/jpeg"})

        stored = await storage.read(signed["key"])
        assert GPS_LATITUDE not in stored
        assert b"Exif\x00\x00" not in stored

    async def test_a_tampered_signature_is_refused(self, auth_client):
        signed = _data(await auth_client.post("/v1/uploads/sign", json={
            "content_type": "image/jpeg", "byte_size": 1024,
        }), 201)
        tampered = signed["upload_url"].replace("sig=", "sig=x")

        put = await auth_client.put(tampered, content=b"\xff\xd8\xff\xd9",
                                    headers={"content-type": "image/jpeg"})
        assert put.status_code in (401, 403), put.text

    async def test_an_expired_signature_is_refused(self, auth_client, monkeypatch):
        from app.storage import signing

        signed = _data(await auth_client.post("/v1/uploads/sign", json={
            "content_type": "image/jpeg", "byte_size": 1024,
        }), 201)
        # Jump past the TTL rather than sleeping through it. The original is
        # captured first: a lambda that called `signing._now()` would call the
        # patched version and recurse.
        real_now = signing._now
        monkeypatch.setattr(signing, "_now", lambda: real_now() + 10_000)

        put = await auth_client.put(signed["upload_url"], content=b"\xff\xd8\xff\xd9",
                                    headers={"content-type": "image/jpeg"})
        assert put.status_code in (401, 403), put.text

    async def test_a_key_cannot_be_swapped_for_another_users(self, auth_client):
        signed = _data(await auth_client.post("/v1/uploads/sign", json={
            "content_type": "image/jpeg", "byte_size": 1024,
        }), 201)
        other_key = signed["upload_url"].replace(signed["key"], "uploads/somebody-else.jpg")

        put = await auth_client.put(other_key, content=b"\xff\xd8\xff\xd9",
                                    headers={"content-type": "image/jpeg"})
        assert put.status_code in (401, 403, 404), put.text

    async def test_an_oversized_or_unsupported_upload_is_refused_at_signing_time(
        self, auth_client
    ):
        # Refused BEFORE a URL exists, so the limit is not something to discover
        # after transferring ten megabytes on a phone connection.
        too_big = await auth_client.post("/v1/uploads/sign", json={
            "content_type": "image/jpeg", "byte_size": 50 * 1024 * 1024,
        })
        assert too_big.status_code == 422, too_big.text

        wrong_type = await auth_client.post("/v1/uploads/sign", json={
            "content_type": "application/pdf", "byte_size": 1024,
        })
        assert wrong_type.status_code == 422, wrong_type.text

    async def test_a_body_larger_than_it_declared_is_refused_on_arrival(self, auth_client):
        signed = _data(await auth_client.post("/v1/uploads/sign", json={
            "content_type": "image/jpeg", "byte_size": 16,
        }), 201)

        put = await auth_client.put(signed["upload_url"], content=b"\xff\xd8" + b"x" * 5000,
                                    headers={"content-type": "image/jpeg"})
        assert put.status_code == 413, put.text


class TestKeysAreTheShapeTheServerIssued:
    """A key is only ever one the server made: `uploads/<you>/<32 hex>.<ext>`.

    "Starts with uploads/<you>/" was the check, and `uploads/<you>/../<them>/…`
    starts with that too. The store keeps a key inside its root, not inside the
    owner's folder — so the check belongs where a key is accepted. Found in
    review of K-07, whose photo deletion now deletes key by key.
    """

    @pytest.mark.parametrize("route", ["/v1/food-analysis/image", "/v1/progress-photos"])
    async def test_a_key_that_climbs_out_of_your_folder_is_refused(
        self, auth_client, storage, route
    ):
        me = _data(await auth_client.get("/v1/auth/me"))["id"]
        victim = f"uploads/00000000-0000-0000-0000-000000000000/{'a' * 32}.jpg"
        await storage.put(victim, b"\xff\xd8\xff\xd9", "image/jpeg")

        r = await auth_client.post(route, json={
            "image_key": f"uploads/{me}/../00000000-0000-0000-0000-000000000000/{'a' * 32}.jpg",
        })
        assert r.status_code in (403, 422), r.text
        assert await storage.exists(victim)

    def test_the_shape_check(self):
        import uuid

        from app.storage.signing import is_own_key, new_key

        owner = uuid.uuid4()
        assert is_own_key(new_key(owner, ".jpg"), owner)
        assert is_own_key(new_key(owner, ".png"), owner)
        assert not is_own_key(new_key(uuid.uuid4(), ".jpg"), owner)
        assert not is_own_key(f"uploads/{owner}/../x/{'a' * 32}.jpg", owner)
        assert not is_own_key(f"uploads/{owner}/{'a' * 32}.jpg/../../etc", owner)
        assert not is_own_key(f"uploads/{owner}/notes.txt", owner)
