"""Rate-limit-aware model pool with automatic failover across Groq + Hugging Face.

Tasks:
  - text_generation: chat/completion models
  - sentiment: classification models (HF) + LLM fallback (Groq)
"""

from __future__ import annotations

import asyncio
import time
from dataclasses import dataclass, field
from enum import StrEnum
from typing import Any

import httpx
import structlog

from app.core.config import get_settings

logger = structlog.get_logger(__name__)


class AITask(StrEnum):
    TEXT_GENERATION = "text_generation"
    SENTIMENT = "sentiment"


@dataclass
class ModelEndpoint:
    provider: str
    model_id: str
    task: AITask
    priority: int = 100
    cooldown_until: float = 0.0
    failures: int = 0
    successes: int = 0
    last_error: str | None = None

    @property
    def available(self) -> bool:
        return time.time() >= self.cooldown_until


@dataclass
class PoolResult:
    content: str
    provider: str
    model: str
    task: AITask
    tokens_used: int = 0
    raw: Any = None
    sentiment: dict[str, Any] | None = None


# Curated free defaults — refreshed live from Groq / HF when possible
DEFAULT_TEXT_MODELS: list[tuple[str, str, int]] = [
    ("groq", "llama-3.3-70b-versatile", 10),
    ("groq", "llama-3.1-8b-instant", 20),
    ("groq", "gemma2-9b-it", 30),
    ("groq", "mixtral-8x7b-32768", 40),
    ("huggingface", "HuggingFaceH4/zephyr-7b-beta", 50),
    ("huggingface", "mistralai/Mistral-7B-Instruct-v0.2", 60),
    ("huggingface", "google/flan-t5-large", 70),
]

DEFAULT_SENTIMENT_MODELS: list[tuple[str, str, int]] = [
    ("huggingface", "cardiffnlp/twitter-roberta-base-sentiment-latest", 10),
    ("huggingface", "distilbert/distilbert-base-uncased-finetuned-sst-2-english", 20),
    ("huggingface", "finiteautomata/bertweet-base-sentiment-analysis", 30),
    ("groq", "llama-3.1-8b-instant", 40),  # LLM classification fallback
]


class ModelPool:
    def __init__(self) -> None:
        self._lock = asyncio.Lock()
        self._endpoints: list[ModelEndpoint] = []
        self._catalog_refreshed_at: float = 0.0
        self._bootstrap()

    def _bootstrap(self) -> None:
        settings = get_settings()
        self._endpoints.clear()
        if settings.groq_api_key:
            for provider, model_id, priority in DEFAULT_TEXT_MODELS:
                if provider == "groq":
                    self._endpoints.append(
                        ModelEndpoint(provider, model_id, AITask.TEXT_GENERATION, priority)
                    )
            for provider, model_id, priority in DEFAULT_SENTIMENT_MODELS:
                if provider == "groq":
                    self._endpoints.append(ModelEndpoint(provider, model_id, AITask.SENTIMENT, priority))
        if settings.huggingface_api_key:
            for provider, model_id, priority in DEFAULT_TEXT_MODELS:
                if provider == "huggingface":
                    self._endpoints.append(
                        ModelEndpoint(provider, model_id, AITask.TEXT_GENERATION, priority)
                    )
            for provider, model_id, priority in DEFAULT_SENTIMENT_MODELS:
                if provider == "huggingface":
                    self._endpoints.append(ModelEndpoint(provider, model_id, AITask.SENTIMENT, priority))

    async def refresh_catalog(self, force: bool = False) -> dict[str, list[str]]:
        """Fetch live model lists from Groq (+ keep curated HF sentiment/text models)."""
        if not force and (time.time() - self._catalog_refreshed_at) < 300:
            return self.list_models()

        settings = get_settings()
        async with self._lock:
            self._bootstrap()
            if settings.groq_api_key:
                try:
                    async with httpx.AsyncClient(timeout=30.0) as client:
                        resp = await client.get(
                            "https://api.groq.com/openai/v1/models",
                            headers={"Authorization": f"Bearer {settings.groq_api_key}"},
                        )
                        resp.raise_for_status()
                        data = resp.json()
                    existing = {
                        (e.provider, e.model_id, e.task) for e in self._endpoints if e.provider == "groq"
                    }
                    priority = 15
                    for item in data.get("data") or []:
                        model_id = item.get("id")
                        if not model_id or "whisper" in model_id or "tts" in model_id:
                            continue
                        key = ("groq", model_id, AITask.TEXT_GENERATION)
                        if key not in existing:
                            self._endpoints.append(
                                ModelEndpoint("groq", model_id, AITask.TEXT_GENERATION, priority)
                            )
                            priority += 5
                    logger.info("model_pool.groq_catalog_refreshed", count=len(data.get("data") or []))
                except Exception as exc:  # noqa: BLE001
                    logger.warning("model_pool.groq_catalog_failed", error=str(exc))

            # Hugging Face: probe curated models; keep those that respond
            if settings.huggingface_api_key:
                await self._probe_huggingface_models(settings.huggingface_api_key)

            self._catalog_refreshed_at = time.time()
        return self.list_models()

    async def _probe_huggingface_models(self, api_key: str) -> None:
        """Lightweight existence check via model info API."""
        candidates = [
            m for m in self._endpoints if m.provider == "huggingface"
        ] + [
            ModelEndpoint("huggingface", mid, AITask.TEXT_GENERATION, 55)
            for mid in (
                "microsoft/Phi-3-mini-4k-instruct",
                "Qwen/Qwen2.5-1.5B-Instruct",
            )
        ]
        seen: set[tuple[str, str, AITask]] = {(e.provider, e.model_id, e.task) for e in self._endpoints}
        async with httpx.AsyncClient(timeout=20.0) as client:
            for endpoint in candidates:
                key = (endpoint.provider, endpoint.model_id, endpoint.task)
                try:
                    resp = await client.get(
                        f"https://huggingface.co/api/models/{endpoint.model_id}",
                        headers={"Authorization": f"Bearer {api_key}"},
                    )
                    if resp.status_code == 200 and key not in seen:
                        self._endpoints.append(endpoint)
                        seen.add(key)
                except Exception:  # noqa: BLE001
                    continue

    def list_models(self) -> dict[str, list[str]]:
        by_task: dict[str, list[str]] = {
            AITask.TEXT_GENERATION.value: [],
            AITask.SENTIMENT.value: [],
        }
        for endpoint in sorted(self._endpoints, key=lambda e: (e.task, e.priority, e.failures)):
            label = f"{endpoint.provider}:{endpoint.model_id}"
            if endpoint.available:
                by_task[endpoint.task.value].append(label)
            else:
                by_task[endpoint.task.value].append(f"{label}(cooling)")
        return by_task

    def _ordered(self, task: AITask) -> list[ModelEndpoint]:
        return sorted(
            [e for e in self._endpoints if e.task == task and e.available],
            key=lambda e: (e.priority + e.failures * 10, e.failures),
        )

    def _mark_rate_limited(self, endpoint: ModelEndpoint, retry_after: float | None = None) -> None:
        cooldown = retry_after if retry_after and retry_after > 0 else 60.0
        # Escalate cooldown on repeated failures
        cooldown = min(900.0, cooldown * (1 + endpoint.failures))
        endpoint.cooldown_until = time.time() + cooldown
        endpoint.failures += 1
        endpoint.last_error = "rate_limited"
        logger.warning(
            "model_pool.cooldown",
            provider=endpoint.provider,
            model=endpoint.model_id,
            seconds=cooldown,
        )

    def _mark_success(self, endpoint: ModelEndpoint) -> None:
        endpoint.successes += 1
        endpoint.failures = max(0, endpoint.failures - 1)
        endpoint.last_error = None

    def _mark_failure(self, endpoint: ModelEndpoint, error: str, status_code: int | None = None) -> None:
        endpoint.failures += 1
        endpoint.last_error = error
        if status_code in {429, 503}:
            self._mark_rate_limited(endpoint)
        elif status_code in {401, 403}:
            endpoint.cooldown_until = time.time() + 300
        else:
            endpoint.cooldown_until = time.time() + 15

    async def generate(
        self,
        prompt: str,
        *,
        system: str | None = None,
        task: AITask = AITask.TEXT_GENERATION,
    ) -> PoolResult:
        await self.refresh_catalog()
        candidates = self._ordered(task)
        if not candidates:
            # Reset cooldowns once if everything is cooling — try least-failed
            async with self._lock:
                for e in self._endpoints:
                    if e.task == task:
                        e.cooldown_until = 0
            candidates = self._ordered(task)

        errors: list[str] = []
        for endpoint in candidates:
            try:
                if task == AITask.SENTIMENT:
                    result = await self._run_sentiment(endpoint, prompt)
                else:
                    result = await self._run_text(endpoint, prompt, system)
                self._mark_success(endpoint)
                return result
            except httpx.HTTPStatusError as exc:
                status = exc.response.status_code
                retry_after = None
                if status == 429:
                    ra = exc.response.headers.get("retry-after")
                    if ra and ra.isdigit():
                        retry_after = float(ra)
                    self._mark_rate_limited(endpoint, retry_after)
                else:
                    self._mark_failure(endpoint, str(exc), status)
                errors.append(f"{endpoint.provider}:{endpoint.model_id} -> HTTP {status}")
                continue
            except Exception as exc:  # noqa: BLE001
                self._mark_failure(endpoint, str(exc))
                errors.append(f"{endpoint.provider}:{endpoint.model_id} -> {exc}")
                continue

        raise RuntimeError("All models exhausted or rate-limited: " + "; ".join(errors[:6]))

    async def _run_text(self, endpoint: ModelEndpoint, prompt: str, system: str | None) -> PoolResult:
        settings = get_settings()
        if endpoint.provider == "groq":
            content, tokens, raw = await self._groq_chat(
                settings.groq_api_key or "",
                endpoint.model_id,
                prompt,
                system,
            )
            return PoolResult(
                content=content,
                provider="groq",
                model=endpoint.model_id,
                task=AITask.TEXT_GENERATION,
                tokens_used=tokens,
                raw=raw,
            )
        if endpoint.provider == "huggingface":
            content, raw = await self._hf_text(settings.huggingface_api_key or "", endpoint.model_id, prompt, system)
            return PoolResult(
                content=content,
                provider="huggingface",
                model=endpoint.model_id,
                task=AITask.TEXT_GENERATION,
                raw=raw,
            )
        raise ValueError(f"Unsupported provider {endpoint.provider}")

    async def _run_sentiment(self, endpoint: ModelEndpoint, text: str) -> PoolResult:
        settings = get_settings()
        if endpoint.provider == "huggingface":
            sentiment, raw = await self._hf_sentiment(
                settings.huggingface_api_key or "", endpoint.model_id, text
            )
            label = sentiment.get("label", "unknown")
            score = sentiment.get("score", 0.0)
            return PoolResult(
                content=f"{label} ({score:.3f})",
                provider="huggingface",
                model=endpoint.model_id,
                task=AITask.SENTIMENT,
                raw=raw,
                sentiment=sentiment,
            )
        # Groq LLM fallback for sentiment
        system = (
            "Classify sentiment of the user text. Reply with JSON only: "
            '{"label":"positive|neutral|negative","score":0.0-1.0,"rationale":"..."}'
        )
        content, tokens, raw = await self._groq_chat(
            settings.groq_api_key or "", endpoint.model_id, text[:4000], system
        )
        sentiment = _parse_sentiment_json(content)
        return PoolResult(
            content=content,
            provider="groq",
            model=endpoint.model_id,
            task=AITask.SENTIMENT,
            tokens_used=tokens,
            raw=raw,
            sentiment=sentiment,
        )

    async def _groq_chat(
        self, api_key: str, model: str, prompt: str, system: str | None
    ) -> tuple[str, int, Any]:
        messages: list[dict[str, str]] = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})
        async with httpx.AsyncClient(timeout=90.0) as client:
            response = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                json={"model": model, "messages": messages, "temperature": 0.3},
            )
            response.raise_for_status()
            data = response.json()
        content = data["choices"][0]["message"]["content"]
        tokens = int((data.get("usage") or {}).get("total_tokens") or 0)
        return content, tokens, data

    async def _hf_text(
        self, api_key: str, model: str, prompt: str, system: str | None
    ) -> tuple[str, Any]:
        text = f"{system}\n\n{prompt}" if system else prompt
        # Prefer OpenAI-compatible router when available; fall back to classic inference
        async with httpx.AsyncClient(timeout=120.0) as client:
            router = await client.post(
                "https://router.huggingface.co/v1/chat/completions",
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                json={
                    "model": model,
                    "messages": (
                        ([{"role": "system", "content": system}] if system else [])
                        + [{"role": "user", "content": prompt}]
                    ),
                    "temperature": 0.3,
                    "max_tokens": 800,
                },
            )
            if router.status_code < 400:
                data = router.json()
                content = data["choices"][0]["message"]["content"]
                return content, data

            response = await client.post(
                f"https://api-inference.huggingface.co/models/{model}",
                headers={"Authorization": f"Bearer {api_key}"},
                json={"inputs": text, "parameters": {"max_new_tokens": 800, "return_full_text": False}},
            )
            response.raise_for_status()
            data = response.json()
        if isinstance(data, list) and data:
            content = data[0].get("generated_text") or str(data[0])
        elif isinstance(data, dict) and "generated_text" in data:
            content = data["generated_text"]
        else:
            content = str(data)
        return content, data

    async def _hf_sentiment(self, api_key: str, model: str, text: str) -> tuple[dict[str, Any], Any]:
        urls = [
            f"https://router.huggingface.co/hf-inference/models/{model}",
            f"https://api-inference.huggingface.co/models/{model}",
        ]
        last_error: Exception | None = None
        async with httpx.AsyncClient(timeout=60.0) as client:
            for url in urls:
                try:
                    response = await client.post(
                        url,
                        headers={"Authorization": f"Bearer {api_key}"},
                        json={"inputs": text[:2000]},
                    )
                    response.raise_for_status()
                    data = response.json()
                    break
                except Exception as exc:  # noqa: BLE001
                    last_error = exc
                    continue
            else:
                assert last_error is not None
                raise last_error
        # HF returns [[{label, score}, ...]] or [{label, score}, ...]
        rows = data
        if isinstance(data, list) and data and isinstance(data[0], list):
            rows = data[0]
        if isinstance(rows, list) and rows and isinstance(rows[0], dict):
            best = max(rows, key=lambda r: float(r.get("score") or 0))
            label = str(best.get("label", "unknown")).lower()
            label = _normalize_sentiment_label(label)
            return {"label": label, "score": float(best.get("score") or 0), "scores": rows}, data
        return {"label": "unknown", "score": 0.0, "raw": data}, data


def _normalize_sentiment_label(label: str) -> str:
    label = label.lower().strip()
    mapping = {
        "label_0": "negative",
        "label_1": "neutral",
        "label_2": "positive",
        "neg": "negative",
        "neu": "neutral",
        "pos": "positive",
        "negative": "negative",
        "neutral": "neutral",
        "positive": "positive",
    }
    return mapping.get(label, label)


def _parse_sentiment_json(content: str) -> dict[str, Any]:
    import json
    import re

    match = re.search(r"\{.*\}", content, re.DOTALL)
    if not match:
        return {"label": "unknown", "score": 0.0, "rationale": content[:200]}
    try:
        data = json.loads(match.group(0))
        return {
            "label": _normalize_sentiment_label(str(data.get("label", "unknown"))),
            "score": float(data.get("score") or 0),
            "rationale": data.get("rationale"),
        }
    except Exception:  # noqa: BLE001
        return {"label": "unknown", "score": 0.0, "rationale": content[:200]}


_pool: ModelPool | None = None


def get_model_pool() -> ModelPool:
    global _pool
    if _pool is None:
        _pool = ModelPool()
    return _pool


def reset_model_pool() -> None:
    global _pool
    _pool = None
