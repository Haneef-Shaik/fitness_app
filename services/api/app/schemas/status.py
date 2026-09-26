from __future__ import annotations

from typing import Literal

from pydantic import BaseModel


class ServiceStatusOut(BaseModel):
    maintenance: bool
    message: str | None = None
    ai: Literal["ok", "degraded"]
