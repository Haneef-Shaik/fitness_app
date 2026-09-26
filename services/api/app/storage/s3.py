"""An S3-compatible object store — Supabase Storage when hosted (L1).

The same contract as `LocalObjectStore` (`tests/test_object_store.py` holds both
to it), because D26 promised S3 would be one more implementation and nothing
above the store would change.

**boto3 is synchronous**, so every call that crosses the network runs on a
thread (`asyncio.to_thread`). On the event loop, one slow PUT would stall every
request the API is serving — the set-commits included.

**The bucket is private and stays that way** (BRD §18). Nothing here sets an ACL
or a public policy; the only way to read an object without the keys is a
presigned GET that expires.

Four things differ because Supabase is S3-*compatible*, not S3:
  - path-style addressing (`<endpoint>/<bucket>/<key>`) — its docs require it;
  - checksums only when an operation demands them — botocore ≥ 1.36 sends a
    CRC32 on every PUT by default, and Supabase does not support checksums;
  - SigV4, which is what it verifies, presigned URLs included;
  - DeleteObjects must say its body is XML. botocore sends no Content-Type, and
    Supabase then reads no body at all ("must have required property 'Body'"),
    so deleting an account's photos failed — found against a local Supabase
    (26 Sep), never by moto. AWS and MinIO accept the header as well.
"""
from __future__ import annotations

import asyncio
from typing import Any

import boto3
from botocore.config import Config
from botocore.exceptions import ClientError

#: Objects per listing page, and so per DeleteObjects call (whose limit is
#: 1000). A module constant so a test can page through five objects.
PAGE_SIZE = 1000

_MISSING = frozenset({"NoSuchKey", "404", "NotFound"})


def _xml_body(request: Any, **_: Any) -> None:
    """DeleteObjects' body is XML; Supabase will not read it unless told so."""
    request.headers["Content-Type"] = "application/xml"


def _config(path_style: bool) -> Config:
    return Config(
        signature_version="s3v4",
        s3={"addressing_style": "path" if path_style else "auto"},
        request_checksum_calculation="when_required",
        response_checksum_validation="when_required",
        # A photo upload waits on this; a hung connection must not hold the
        # request until the host's own timeout kills it.
        connect_timeout=5,
        read_timeout=30,
        retries={"max_attempts": 3, "mode": "standard"},
    )


def _checked(key: str) -> str:
    """The local store's rule, kept here although S3 has no directories: a key
    with `..` in it is a key someone built on purpose, and both stores must
    answer it the same way."""
    parts = key.split("/")
    climbs = any(part in (".", "..") for part in parts)
    if not key or key.startswith("/") or "\\" in key or climbs:
        raise ValueError("That object key points outside the store.")
    return key


def _is_missing(error: ClientError) -> bool:
    code = str(error.response.get("Error", {}).get("Code", ""))
    status = error.response.get("ResponseMetadata", {}).get("HTTPStatusCode")
    return code in _MISSING or status == 404


class S3ObjectStore:
    def __init__(
        self,
        *,
        bucket: str,
        region: str,
        access_key_id: str,
        secret_access_key: str,
        endpoint_url: str | None = None,
    ) -> None:
        self.bucket = bucket
        # One client for the process: boto3 clients are thread-safe, sessions
        # are not, and building one per call re-reads credentials each time.
        self._client: Any = boto3.client(
            "s3",
            endpoint_url=endpoint_url or None,
            region_name=region,
            aws_access_key_id=access_key_id,
            aws_secret_access_key=secret_access_key,
            config=_config(path_style=bool(endpoint_url)),
        )
        self._client.meta.events.register("before-sign.s3.DeleteObjects", _xml_body)

    async def put(self, key: str, data: bytes, content_type: str) -> None:
        await asyncio.to_thread(
            self._client.put_object,
            Bucket=self.bucket, Key=_checked(key), Body=data, ContentType=content_type,
        )

    async def read(self, key: str) -> bytes:
        checked = _checked(key)

        def _get() -> bytes:
            try:
                response = self._client.get_object(Bucket=self.bucket, Key=checked)
            except ClientError as exc:
                if _is_missing(exc):
                    # The contract: missing is FileNotFoundError, which the
                    # worker reports as `image_unreadable`, not an outage.
                    raise FileNotFoundError(checked) from exc
                raise
            return response["Body"].read()

        return await asyncio.to_thread(_get)

    async def exists(self, key: str) -> bool:
        try:
            checked = _checked(key)
        except ValueError:
            return False

        def _head() -> bool:
            try:
                self._client.head_object(Bucket=self.bucket, Key=checked)
            except ClientError as exc:
                if _is_missing(exc):
                    return False
                raise
            return True

        return await asyncio.to_thread(_head)

    async def delete(self, key: str) -> None:
        # S3 answers 204 for a key that is not there, which is the contract.
        await asyncio.to_thread(self._client.delete_object, Bucket=self.bucket, Key=_checked(key))

    async def delete_prefix(self, prefix: str) -> int:
        # The slash is the point: on S3 a prefix is a string match, and
        # `uploads/u1` would otherwise delete `uploads/u10`'s photographs.
        folder = _checked(prefix).rstrip("/") + "/"

        def _sweep() -> int:
            removed = 0
            pages = self._client.get_paginator("list_objects_v2").paginate(
                Bucket=self.bucket, Prefix=folder, PaginationConfig={"PageSize": PAGE_SIZE},
            )
            for page in pages:
                keys = [{"Key": obj["Key"]} for obj in page.get("Contents", [])]
                if not keys:
                    continue
                response = self._client.delete_objects(
                    Bucket=self.bucket, Delete={"Objects": keys, "Quiet": True}
                )
                errors = response.get("Errors") or []
                if errors:
                    # Loud, not partial: account deletion must not report
                    # success over photographs it failed to remove.
                    first = errors[0]
                    raise RuntimeError(
                        f"could not delete {len(errors)} object(s) under {folder}: "
                        f"{first.get('Code')} {first.get('Message')}"
                    )
                removed += len(keys)
            return removed

        return await asyncio.to_thread(_sweep)

    def read_url(self, key: str, ttl_seconds: int) -> str:
        return self._client.generate_presigned_url(
            "get_object",
            Params={"Bucket": self.bucket, "Key": _checked(key)},
            ExpiresIn=ttl_seconds,
        )
