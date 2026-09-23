"""The real gateway — Anthropic's Messages API.

Three things here are the difference between a feature and an outage:

**A timeout on every call.** Without one, a model that hangs holds a worker
slot until the process is restarted. The timeout is configuration, not a
constant, because the right value for an image is not the right value for text.

**A strict schema, enforced twice.** The tool definition tells the model the
shape; `parse_result` refuses anything that is not it. The tool definition is a
request; the parser is the guarantee.

**One reprompt, then stop** (02 §5.3). A model that answers badly twice is not
going to answer well on the fifth try, and a retry loop against a paid API is a
bill and an outage at the same time.

The API key comes from the environment and is validated at startup. It is never
logged, never returned in an envelope, and never written to a database.
"""
from __future__ import annotations

import base64
import json

import httpx

from app.ai.gateway import (
    SCHEMA_VERSION,
    VALID_UNITS,
    AIInvalidOutput,
    AIUnavailable,
    AnalysisResult,
    parse_result,
)

API_URL = "https://api.anthropic.com/v1/messages"
API_VERSION = "2023-06-01"

SYSTEM_PROMPT = (
    "You estimate the nutritional content of food from a photograph or a "
    "description. You always answer by calling the report_foods tool, once. "
    "Confidence is how sure you are that you identified the food, not how "
    "accurate the calories are. Quantities are your best estimate of what is "
    "actually present. If you cannot identify any food, report an empty list "
    "rather than guessing."
)

#: The tool schema IS the contract in 02 §5.1. `resolved_food_id` and
#: `user_corrected` are absent on purpose — the platform sets those, and a model
#: able to set them could mark its own guess as a user's decision.
TOOL = {
    "name": "report_foods",
    "description": "Report every food you can identify, with estimated amounts.",
    "input_schema": {
        "type": "object",
        "properties": {
            "items": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "detected_name": {"type": "string"},
                        "estimated_quantity": {"type": "number"},
                        "estimated_unit": {"type": "string", "enum": list(VALID_UNITS)},
                        "confidence": {"type": "number", "minimum": 0, "maximum": 1},
                        "proposed_calories": {"type": "number"},
                        "proposed_protein_g": {"type": "number"},
                        "proposed_carbs_g": {"type": "number"},
                        "proposed_fat_g": {"type": "number"},
                    },
                    "required": ["detected_name", "estimated_unit", "confidence"],
                },
            },
            "notes": {"type": "string"},
        },
        "required": ["items"],
    },
}


class AnthropicGateway:
    def __init__(
        self, *, api_key: str, model: str, timeout_seconds: float,
        max_tokens: int = 2048, base_url: str = API_URL,
    ) -> None:
        if not api_key:
            raise RuntimeError("An AI API key is required to use the Anthropic gateway.")
        self._api_key = api_key
        self._model = model
        self._timeout = timeout_seconds
        self._max_tokens = max_tokens
        self._base_url = base_url

    async def analyse_text(self, text: str) -> AnalysisResult:
        return await self._call([{"type": "text", "text": f"What food is this?\n\n{text}"}])

    async def analyse_image(self, image: bytes, content_type: str) -> AnalysisResult:
        return await self._call([
            {
                "type": "image",
                "source": {
                    "type": "base64",
                    "media_type": content_type,
                    "data": base64.b64encode(image).decode(),
                },
            },
            {"type": "text", "text": "What food is on this plate, and how much of it?"},
        ])

    async def _call(self, content: list[dict]) -> AnalysisResult:
        messages = [{"role": "user", "content": content}]

        try:
            raw = await self._request(messages)
        except (httpx.TimeoutException, httpx.TransportError) as exc:
            raise AIUnavailable(str(exc)) from exc

        try:
            return parse_result(raw)
        except AIInvalidOutput:
            # One reprompt with the schema, then give up (02 §5.3).
            messages.append({"role": "user", "content": [{
                "type": "text",
                "text": (
                    "That did not match the tool schema. Call report_foods once, "
                    "with an items array. Do not add any other fields."
                ),
            }]})
            try:
                retried = await self._request(messages)
            except (httpx.TimeoutException, httpx.TransportError) as exc:
                raise AIUnavailable(str(exc)) from exc
            return parse_result(retried)

    async def _request(self, messages: list[dict]) -> dict:
        async with httpx.AsyncClient(timeout=self._timeout) as http:
            response = await http.post(
                self._base_url,
                headers={
                    "x-api-key": self._api_key,
                    "anthropic-version": API_VERSION,
                    "content-type": "application/json",
                },
                json={
                    "model": self._model,
                    "max_tokens": self._max_tokens,
                    # Deterministic: the same plate should not produce a
                    # different answer on a second look (02 §5).
                    "temperature": 0,
                    "system": SYSTEM_PROMPT,
                    "tools": [TOOL],
                    "tool_choice": {"type": "tool", "name": TOOL["name"]},
                    "messages": messages,
                },
            )

        if response.status_code == 429 or response.status_code >= 500:
            # Provider-side and retryable. The job is left for another attempt
            # rather than being marked permanently failed.
            raise AIUnavailable(f"provider returned {response.status_code}")
        if response.status_code >= 400:
            raise AIInvalidOutput(f"provider rejected the request ({response.status_code})")

        return self._tool_input(response.json())

    def _tool_input(self, body: dict) -> dict:
        """Pull the tool call out, and shape it into the 02 §5.1 envelope."""
        for block in body.get("content", []):
            if isinstance(block, dict) and block.get("type") == "tool_use":
                payload = block.get("input")
                if not isinstance(payload, dict):
                    raise AIInvalidOutput("the tool call carried no object")
                return {
                    "schema_version": SCHEMA_VERSION,
                    "model_name": f"anthropic/{body.get('model', self._model)}",
                    "items": payload.get("items"),
                    "notes": payload.get("notes"),
                }
        raise AIInvalidOutput(f"no tool call in the response: {json.dumps(body)[:200]}")
