from __future__ import annotations

import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


class FeedbackIn(BaseModel):
    category: Literal["problem", "idea", "other"] = "problem"
    message: str = Field(min_length=1, max_length=2000)
    app_version: str | None = Field(default=None, max_length=40)
    platform: str | None = Field(default=None, max_length=40)
    request_id: str | None = Field(default=None, max_length=80)

    @field_validator("message")
    @classmethod
    def _says_something(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Tell us what happened.")
        return v.strip()


class FeedbackOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    category: str
    message: str
    app_version: str | None
    platform: str | None
    request_id: str | None
    created_at: datetime
