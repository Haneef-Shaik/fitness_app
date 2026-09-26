"""A local-filesystem object store — development and the suite.

Keys are treated as opaque paths under one root, and every one of them is
checked to resolve **inside** that root — a key is user-influenced input, and
`uploads/../../etc/passwd` is the oldest trick there is.

Its read URLs point back at the API (`GET /v1/uploads/{key}`), HMAC-signed and
expiring — the same capability a presigned S3 URL is, so a client treats the two
identically.
"""
from __future__ import annotations

import asyncio
from pathlib import Path
from urllib.parse import quote

from app.storage import signing

#: Where `app/api/routes/uploads.py` serves a signed read.
READ_ROUTE = "/v1/uploads"


class LocalObjectStore:
    def __init__(self, root: str | Path, *, signing_secret: str | None = None) -> None:
        self.root = Path(root).resolve()
        self.root.mkdir(parents=True, exist_ok=True)
        # None reads the secret the route verifies with, so the two cannot
        # disagree; tests construct the store without naming it.
        self._signing_secret = signing_secret

    def _path(self, key: str) -> Path:
        candidate = (self.root / key).resolve()
        if not candidate.is_relative_to(self.root):
            raise ValueError("That object key points outside the store.")
        return candidate

    async def put(self, key: str, data: bytes, content_type: str) -> None:
        path = self._path(key)
        await asyncio.to_thread(path.parent.mkdir, parents=True, exist_ok=True)
        await asyncio.to_thread(path.write_bytes, data)

    async def read(self, key: str) -> bytes:
        return await asyncio.to_thread(self._path(key).read_bytes)

    async def exists(self, key: str) -> bool:
        try:
            return await asyncio.to_thread(self._path(key).is_file)
        except ValueError:
            return False

    async def delete(self, key: str) -> None:
        path = self._path(key)
        await asyncio.to_thread(path.unlink, True)

    async def delete_prefix(self, prefix: str) -> int:
        base = self._path(prefix)

        def _sweep() -> int:
            if not base.exists():
                return 0
            removed = 0
            for item in sorted(base.rglob("*"), reverse=True):
                if item.is_file():
                    item.unlink()
                    removed += 1
                elif item.is_dir():
                    item.rmdir()
            return removed

        return await asyncio.to_thread(_sweep)

    def read_url(self, key: str, ttl_seconds: int) -> str:
        self._path(key)  # a key outside the store gets no URL at all
        signature, expires = signing.sign_read(
            key=key, secret=self._secret(), ttl_seconds=ttl_seconds
        )
        return f"{READ_ROUTE}/{quote(key)}?exp={expires}&sig={signature}"

    def _secret(self) -> str:
        if self._signing_secret is not None:
            return self._signing_secret
        from app.config import get_settings

        return get_settings().upload_signing_secret
