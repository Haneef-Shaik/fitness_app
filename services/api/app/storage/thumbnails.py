"""Photo thumbnails rendered by Supabase Storage (docs/14, S10).

The progress-photo grid draws 96 × 128 tiles, and it was downloading every
original to do it. Storage's image transformation renders a small copy on
request; this signs one URL per photo for that copy.

**Signed, like the originals** (BRD §18): the bucket stays private, and each
URL expires with the same TTL. Signing needs the project's secret key, so this
runs only on the server, only after the owner check the caller has made.

**One request per photo.** Storage's batch-sign endpoint ignores transforms
(checked against Storage 1.77), so the photos are signed concurrently — a
bounded number at a time — and each URL is kept until half its life is gone,
so a grid scrolled back to is not signed again.

**Never in the way.** Not configured (development, the suite, a non-Supabase
bucket), or Storage refusing: the photo has no thumbnail and the app shows the
original. A thumbnail is an optimisation, never a reason a photo is missing.
"""
from __future__ import annotations

import asyncio
import logging
import time
from collections import OrderedDict
from dataclasses import dataclass

import httpx

from app.config import Settings, get_settings
from app.storage import provider

log = logging.getLogger("fitlog.storage")

#: Twice the grid's tile (96 × 128) for dense screens, same aspect.
@dataclass(frozen=True, slots=True)
class Spec:
    width: int = 288
    height: int = 384
    resize: str = "cover"
    quality: int = 70


GRID = Spec()
#: Signing requests in flight at once, per listing.
CONCURRENCY = 12
#: Signed URLs remembered per process; oldest dropped first.
CACHE_SIZE = 5000
TIMEOUT_SECONDS = 5.0

_cache: OrderedDict[tuple[str, Spec], tuple[str, float]] = OrderedDict()
#: Replaced in tests with an httpx.MockTransport.
_transport: httpx.AsyncBaseTransport | None = None


def _bucket(settings: Settings) -> str | None:
    """The bucket to sign in, when thumbnails can be had at all: a Supabase
    project configured, and the photos in an S3 bucket (Storage's)."""
    if not (settings.supabase_url and settings.supabase_secret_key):
        return None
    # Imported here, as provider.py does, so a development process never
    # loads boto3.
    from app.storage.s3 import S3ObjectStore

    # Through the module, so whichever store is installed is the one asked.
    store = provider.get_store()
    return store.bucket if isinstance(store, S3ObjectStore) else None


async def signed_thumbnails(
    keys: list[str], ttl_seconds: int, spec: Spec = GRID, *, now: float | None = None,
) -> dict[str, str]:
    """{image_key: signed thumbnail URL} for the keys that could be signed."""
    settings = get_settings()
    bucket = _bucket(settings) if keys else None
    if bucket is None:
        return {}
    clock = time.time() if now is None else now

    found: dict[str, str] = {}
    missing: list[str] = []
    for key in dict.fromkeys(keys):  # once each, in order
        cached = _cache.get((key, spec))
        if cached and cached[1] - clock > ttl_seconds / 2:
            found[key] = cached[0]
        else:
            missing.append(key)
    if not missing:
        return found

    gate = asyncio.Semaphore(CONCURRENCY)
    base = settings.supabase_url.rstrip("/")
    async with httpx.AsyncClient(
        base_url=f"{base}/storage/v1", timeout=TIMEOUT_SECONDS, transport=_transport,
        headers={"apikey": settings.supabase_secret_key},
    ) as client:
        async def sign(key: str) -> tuple[str, str | None]:
            async with gate:
                return key, await _sign(client, bucket, key, ttl_seconds, spec)

        for key, url in await asyncio.gather(*(sign(k) for k in missing)):
            if url is None:
                continue
            full = f"{base}/storage/v1{url}"
            found[key] = full
            _remember((key, spec), full, clock + ttl_seconds)
    return found


async def _sign(
    client: httpx.AsyncClient, bucket: str, key: str, ttl_seconds: int, spec: Spec,
) -> str | None:
    try:
        response = await client.post(
            f"/object/sign/{bucket}/{key}",
            json={"expiresIn": ttl_seconds, "transform": {
                "width": spec.width, "height": spec.height,
                "resize": spec.resize, "quality": spec.quality,
            }},
        )
    except httpx.HTTPError as exc:
        log.warning("thumbnail signing failed: %s", type(exc).__name__)
        return None
    if response.status_code != 200:
        # The key is the user's path; the status is enough to diagnose.
        log.warning("thumbnail signing refused: HTTP %s", response.status_code)
        return None
    url = response.json().get("signedURL")
    return url if isinstance(url, str) and url.startswith("/render/image/sign/") else None


def _remember(entry: tuple[str, Spec], url: str, expires_at: float) -> None:
    _cache[entry] = (url, expires_at)
    _cache.move_to_end(entry)
    while len(_cache) > CACHE_SIZE:
        _cache.popitem(last=False)


def clear_cache() -> None:
    _cache.clear()
