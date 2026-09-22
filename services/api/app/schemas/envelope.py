"""The one response shape, declared so it reaches the OpenAPI document (I9).

`app.api.envelope.ok`/`fail` build these bodies at runtime. The models here exist so
FastAPI can *document* them: a route that returns a `JSONResponse` gives FastAPI
nothing to infer from, so without an explicit `response_model` the response shape
never reaches `/v1/openapi.json` — and a generated client is then left hand-typing
every response, which is the drift `D3b` exists to prevent.

Declaring `response_model` does not change what a route returns. FastAPI skips
response validation when the endpoint returns a `Response` instance directly; these
models are documentation only, and `tests/` proves the bodies are unchanged.
"""
from __future__ import annotations

from pydantic import BaseModel, Field


class ErrorOut(BaseModel):
    """Always present on a failure, never on a success."""

    code: str
    message: str
    fields: dict[str, str] = Field(default_factory=dict)
    request_id: str


class Envelope[T](BaseModel):
    success: bool
    data: T | None = None
    error: ErrorOut | None = None


class Meta(BaseModel):
    """Counters `ok(..., meta=...)` attaches. Which keys appear is per-endpoint:

    * `total` — goal and program lists
    * `count` — session list
    * `limit` / `offset` / `count` — the exercise catalog
    * `accepted` — the outbox flush
    """

    total: int | None = None
    count: int | None = None
    limit: int | None = None
    offset: int | None = None
    accepted: int | None = None


class PagedEnvelope[T](Envelope[T]):
    meta: Meta | None = None


class DeletedOut(BaseModel):
    """Every delete answers the same way, so the client has one shape to handle."""

    deleted: bool
