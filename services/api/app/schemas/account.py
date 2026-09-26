"""Request and response shapes for K-07 · Data & privacy (launch)."""
from __future__ import annotations

from pydantic import BaseModel, Field

#: What a person types to confirm, on the app screen and on the web page alike.
DELETE_CONFIRMATION = "DELETE"


class AccountDeleteIn(BaseModel):
    """Who is asking is the bearer's sign-in, which must be recent (docs/14, S5):
    a password, Google or Apple, re-entered in the last few minutes."""

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
