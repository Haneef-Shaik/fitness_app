"""One response shape for every endpoint (house patterns rule).

    {"success": true,  "data": {...}, "error": null, "meta": {...}}
    {"success": false, "data": null,  "error": {"code","message","fields","request_id"}}
"""
from __future__ import annotations

from typing import Any

from fastapi.responses import JSONResponse


def ok(data: Any = None, meta: dict[str, Any] | None = None, status_code: int = 200) -> JSONResponse:
    body: dict[str, Any] = {"success": True, "data": data, "error": None}
    if meta is not None:
        body["meta"] = meta
    return JSONResponse(body, status_code=status_code)


def fail(
    code: str, message: str, *, status_code: int, request_id: str,
    fields: dict[str, str] | None = None,
) -> JSONResponse:
    return JSONResponse(
        {
            "success": False,
            "data": None,
            "error": {
                "code": code,
                "message": message,
                "fields": fields or {},
                "request_id": request_id,
            },
        },
        status_code=status_code,
    )
