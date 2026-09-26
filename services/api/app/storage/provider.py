"""Choosing an object store. The only place a concrete store is named."""
from __future__ import annotations

from functools import lru_cache

from app.config import get_settings
from app.storage.base import ObjectStore
from app.storage.local import LocalObjectStore


@lru_cache
def get_store() -> ObjectStore:
    settings = get_settings()
    if settings.storage_backend == "s3":
        # Imported here so a development process never loads boto3.
        from app.storage.s3 import S3ObjectStore

        return S3ObjectStore(
            bucket=settings.s3_bucket,
            region=settings.s3_region,
            endpoint_url=settings.s3_endpoint_url or None,
            access_key_id=settings.s3_access_key_id,
            secret_access_key=settings.s3_secret_access_key,
        )
    return LocalObjectStore(settings.upload_root)
