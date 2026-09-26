"""Request and response shapes for K-07 · Data & privacy (launch)."""
from __future__ import annotations

from pydantic import BaseModel, Field

#: What a person types to confirm, on the app screen and on the web page alike.
DELETE_CONFIRMATION = "DELETE"


class AccountDeleteIn(BaseModel):
    """The password travels in the body, never in the URL, where access logs
    and proxies keep it."""

    password: str = Field(min_length=1, max_length=200)
    #: Must be exactly "DELETE". Checked by the server as well as the screen, so
    #: no client can skip the step a person was meant to take.
    confirmation: str = Field(max_length=40)


class AccountDeletedOut(BaseModel):
    deleted: bool
    photos_deleted: int


class PhotosDeletedOut(BaseModel):
    """What "Delete my uploaded photos" did, in the words K-07 reports back."""

    #: Image files removed from storage — progress, food and never-used uploads.
    files_deleted: int
    #: Progress photos removed, rows and all.
    progress_photos_deleted: int
    #: Food analyses whose photo was removed; the analysis record stays.
    analyses_kept: int
