"""Choosing a gateway. **The only place a concrete provider is named.**

The same shape `_resolver()` uses for Q1, and for the same reason: swapping
Anthropic for something else, or running the whole application with no provider
at all, is a change to this function and to nothing above it.

`stub` is the default. A checkout with no key runs, its tests pass, and the app
works — a developer opts *in* to spending money.
"""
from __future__ import annotations

from functools import lru_cache

from app.ai.gateway import AIGateway
from app.ai.stub import StubGateway
from app.config import get_settings


@lru_cache
def get_gateway() -> AIGateway:
    settings = get_settings()

    if settings.ai_provider == "anthropic":
        from app.ai.anthropic import AnthropicGateway

        return AnthropicGateway(
            api_key=settings.ai_api_key,
            model=settings.ai_model,
            timeout_seconds=settings.ai_timeout_seconds,
            base_url=settings.ai_base_url,
        )

    return StubGateway()
