"""Free-first LLM provider resolution for The Logical Agent.

Uses the rate-limit-aware ModelPool (Groq + Hugging Face) with automatic
model switching when providers hit AI limits.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import structlog

from app.agents.llm.pool import AITask, get_model_pool, reset_model_pool
from app.core.config import Settings, get_settings

logger = structlog.get_logger(__name__)


@dataclass
class LLMCallResult:
    content: str
    tokens_used: int
    provider: str
    model: str
    sentiment: dict | None = None


FREE_DEFAULTS = {
    "groq": "llama-3.3-70b-versatile",
    "gemini": "gemini-2.0-flash",
    "openrouter": "meta-llama/llama-3.3-70b-instruct:free",
    "ollama": "llama3.2",
    "huggingface": "HuggingFaceH4/zephyr-7b-beta",
    "openai": "gpt-4o-mini",
    "anthropic": "claude-3-5-haiku-latest",
}


def resolve_provider(settings: Settings | None = None) -> tuple[str, str]:
    """Pick provider + model for display / bootstrap."""
    settings = settings or get_settings()
    if settings.groq_api_key:
        return "groq", settings.groq_model or FREE_DEFAULTS["groq"]
    if settings.huggingface_api_key:
        return "huggingface", settings.huggingface_model or FREE_DEFAULTS["huggingface"]
    if settings.google_api_key:
        return "gemini", settings.gemini_model or FREE_DEFAULTS["gemini"]
    if settings.openrouter_api_key:
        return "openrouter", settings.openrouter_model or FREE_DEFAULTS["openrouter"]
    if settings.ollama_enabled:
        return "ollama", settings.ollama_model or FREE_DEFAULTS["ollama"]
    if settings.openai_api_key:
        return "openai", settings.default_llm_model or FREE_DEFAULTS["openai"]
    if settings.anthropic_api_key:
        return "anthropic", settings.default_llm_model or FREE_DEFAULTS["anthropic"]
    return "offline", "none"


async def generate_with_free_providers(
    prompt: str,
    *,
    system: str | None = None,
    provider: str | None = None,
    model: str | None = None,
) -> LLMCallResult:
    """Text generation with automatic Groq/HF model rotation on rate limits."""
    _ = provider, model  # pool chooses live endpoint; kept for call-site compatibility
    settings = get_settings()
    if not settings.groq_api_key and not settings.huggingface_api_key:
        text = _offline_fallback(prompt, system)
        return LLMCallResult(content=text, tokens_used=0, provider="offline", model="none")

    pool = get_model_pool()
    try:
        result = await pool.generate(prompt, system=system, task=AITask.TEXT_GENERATION)
        return LLMCallResult(
            content=result.content,
            tokens_used=result.tokens_used,
            provider=result.provider,
            model=result.model,
        )
    except Exception as exc:  # noqa: BLE001
        logger.warning("llm.pool_exhausted", error=str(exc))
        return LLMCallResult(
            content=_offline_fallback(prompt, system, note="pool_exhausted"),
            tokens_used=0,
            provider="offline",
            model="none",
        )


async def analyze_sentiment(text: str) -> LLMCallResult:
    """Sentiment analysis with HF classifiers first, Groq LLM fallback, auto-switch on limits."""
    settings = get_settings()
    if not settings.groq_api_key and not settings.huggingface_api_key:
        return LLMCallResult(
            content="neutral (0.000)",
            tokens_used=0,
            provider="offline",
            model="none",
            sentiment={"label": "neutral", "score": 0.0},
        )

    pool = get_model_pool()
    result = await pool.generate(text, task=AITask.SENTIMENT)
    return LLMCallResult(
        content=result.content,
        tokens_used=result.tokens_used,
        provider=result.provider,
        model=result.model,
        sentiment=result.sentiment,
    )


def _offline_fallback(prompt: str, system: str | None = None, note: str = "no_key") -> str:
    prefix = f"[free-offline:{note}] "
    body = prompt.strip()
    if system:
        body = f"{system.strip()}\n\n{body}"
    return prefix + (body[:500] + "..." if len(body) > 500 else body)


# Re-export for tests / admin
__all__ = [
    "LLMCallResult",
    "analyze_sentiment",
    "generate_with_free_providers",
    "get_model_pool",
    "reset_model_pool",
    "resolve_provider",
]
