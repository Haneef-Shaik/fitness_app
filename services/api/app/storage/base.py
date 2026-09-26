"""Object storage, behind an interface.

[02 §5](../../../../docs/02-SYSTEM-ARCHITECTURE.md) draws this as S3 with signed
PUTs straight from the phone. The charter's standing rule was **no cloud**, so
what shipped first was a local implementation of the same shape: a signed,
expiring URL that the client PUTs to (D26).

That is the `FoodResolver` pattern again, and for the same reason. Hosting (L1)
made S3 — Supabase Storage — one more implementation of this Protocol
(`app/storage/s3.py`), and nothing above it changed. **Uploads still go through
the API** on every backend: the server strips EXIF on arrival (`exif.py`), and a
PUT straight to the bucket would be the one path a modified client could use to
skip it.
"""
from __future__ import annotations

from typing import Protocol


class ObjectStore(Protocol):
    async def put(self, key: str, data: bytes, content_type: str) -> None: ...

    async def read(self, key: str) -> bytes: ...

    async def exists(self, key: str) -> bool: ...

    async def delete(self, key: str) -> None: ...

    async def delete_prefix(self, prefix: str) -> int:
        """Removes everything in the folder `prefix` — `uploads/u1` never takes
        `uploads/u10` with it. Returns how many objects went."""
        ...

    def read_url(self, key: str, ttl_seconds: int) -> str:
        """A URL a client can GET the object from **without a bearer token**,
        for `ttl_seconds`. Never a permanent one: the bucket is private (BRD
        §18), and the URL is the only capability that reads it.

        Synchronous because it is a signature, not a request: nothing leaves
        the process.
        """
        ...
