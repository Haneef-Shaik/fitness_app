"""Signed uploads (G8 scope 4), and the local store's signed reads (L1).

Uploads are two endpoints and one rule: **the server strips EXIF on arrival,
whatever the client did.** The client strips it too (H-09's pipeline), but a
modified client simply does not, and a photo of someone's kitchen carries the
coordinates of their home. Either half alone is a single point of failure for
location data.

The signature covers the key, the content type, the declared size and the owner
— not just the key. Signing the key alone would let a caller re-point a valid
signature at another object, or push 40 MB through a URL issued for a thumbnail.
"""
from __future__ import annotations

from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Query, Request, Response

from app.api.deps import CurrentUser
from app.api.envelope import ok
from app.config import get_settings
from app.core.errors import Forbidden, NotFound, PayloadTooLarge, ValidationFailed
from app.schemas.analysis import UploadSignIn, UploadSignOut
from app.schemas.envelope import Envelope
from app.storage import signing
from app.storage.exif import PNG_MAGIC, is_supported_image, strip_exif
from app.storage.provider import get_store

router = APIRouter(tags=["uploads"])

_EXTENSIONS = {"image/jpeg": ".jpg", "image/png": ".png"}


@router.post("/uploads/sign", status_code=201, response_model=Envelope[UploadSignOut])
async def sign_upload(body: UploadSignIn, user: CurrentUser):
    """Issues a short-lived URL for one object.

    The size limit is enforced **here**, before a URL exists, so nobody
    discovers it after transferring ten megabytes on a phone connection.
    """
    settings = get_settings()
    if body.byte_size > settings.upload_max_bytes:
        raise ValidationFailed(
            f"Images must be under {settings.upload_max_bytes // (1024 * 1024)} MB.",
            fields={"byte_size": str(body.byte_size)},
        )

    key = signing.new_key(user.id, _EXTENSIONS[body.content_type])
    signature, expires = signing.sign(
        key=key, content_type=body.content_type, byte_size=body.byte_size,
        user_id=user.id, secret=settings.upload_signing_secret,
        ttl_seconds=settings.upload_url_ttl_seconds,
    )

    return ok(UploadSignOut(
        key=key,
        upload_url=(
            f"/v1/uploads/{key}?size={body.byte_size}"
            f"&exp={expires}&sig={signature}"
        ),
        expires_at=datetime.fromtimestamp(expires, UTC),
        max_bytes=settings.upload_max_bytes,
    ).model_dump(mode="json"), status_code=201)


@router.put("/uploads/{key:path}", response_model=Envelope[dict])
async def put_upload(
    key: str,
    request: Request,
    user: CurrentUser,
    size: Annotated[int, Query()],
    exp: Annotated[int, Query()],
    sig: Annotated[str, Query()],
):
    settings = get_settings()
    content_type = request.headers.get("content-type", "").split(";")[0].strip()

    if not signing.verify(
        key=key, content_type=content_type, byte_size=size, user_id=user.id,
        secret=settings.upload_signing_secret, expires=exp, signature=sig,
    ):
        # One message for a forged signature, an expired one and a swapped key.
        # Telling them apart is information a caller does not need.
        raise Forbidden("That upload link is not valid any more.")

    data = await request.body()
    if len(data) > min(size, settings.upload_max_bytes):
        raise PayloadTooLarge()
    if not is_supported_image(data):
        raise ValidationFailed("That file is not a JPEG or a PNG.",
                               fields={"body": "unsupported image"})

    # The server's turn. A client that skipped this is exactly who this is for.
    cleaned = strip_exif(data, content_type)
    await get_store().put(key, cleaned, content_type)

    return ok({"key": key, "byte_size": len(cleaned)})


@router.get("/uploads/{key:path}", include_in_schema=False)
async def read_upload(
    key: str,
    exp: Annotated[int, Query()],
    sig: Annotated[str, Query()],
):
    """The local store's `read_url`: an image, for whoever holds the signature.

    **No bearer token, on purpose.** An `<Image>` does not attach one, and the
    signature already is the authorisation — issued per response after the
    owner check, expiring, and bound to one key. That is exactly what the S3
    store's presigned URL is, so a client treats the two the same. Hosted, the
    S3 store never points here.
    """
    settings = get_settings()
    if not signing.verify_read(
        key=key, secret=settings.upload_signing_secret, expires=exp, signature=sig,
    ):
        # One answer for forged, expired and swapped, as with uploads.
        raise Forbidden("That image link is not valid any more.")

    try:
        data = await get_store().read(key)
    except (FileNotFoundError, ValueError) as exc:
        raise NotFound("That image no longer exists.") from exc

    remaining = max(0, exp - signing._now())
    return Response(
        content=data,
        media_type="image/png" if data.startswith(PNG_MAGIC) else "image/jpeg",
        # `private`: a shared cache must never hold somebody's progress photo.
        headers={"cache-control": f"private, max-age={remaining}"},
    )
