"""Choosing an object store. The only place a concrete store is named."""
from __future__ import annotations

from functools import lru_cache

from app.config import get_settings
from app.storage.base import ObjectStore
from app.storage.local import LocalObjectStore


@lru_cache
def get_store() -> ObjectStore:
    return LocalObjectStore(get_settings().upload_root)
