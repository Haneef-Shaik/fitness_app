"""Object storage, behind an interface.

[02 §5](../../../../docs/02-SYSTEM-ARCHITECTURE.md) draws this as S3 with signed
PUTs straight from the phone. The charter's standing rule is **no cloud** — every
deliverable is a local file in this repo — so what ships is a local
implementation of the same shape: a signed, expiring, single-use URL that the
client PUTs to directly.

That is the `FoodResolver` pattern again, and for the same reason. S3 becomes one
more implementation of this Protocol, and nothing above it changes.
"""
from __future__ import annotations

from typing import Protocol


class ObjectStore(Protocol):
    async def put(self, key: str, data: bytes, content_type: str) -> None: ...

    async def read(self, key: str) -> bytes: ...

    async def exists(self, key: str) -> bool: ...

    async def delete(self, key: str) -> None: ...

    async def delete_prefix(self, prefix: str) -> int:
        """Removes everything under `prefix`. Returns how many objects went."""
        ...
