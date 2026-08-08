from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Resolve monorepo root .env whether cwd is repo root or apps/api
_ENV_CANDIDATES = [
    Path.cwd() / ".env",
    Path.cwd().parent / ".env",
    Path.cwd().parent.parent / ".env",
    Path(__file__).resolve().parents[4] / ".env",  # apps/api/app/core -> repo root
]
_ENV_FILE = next((p for p in _ENV_CANDIDATES if p.is_file()), ".env")


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(_ENV_FILE),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    app_name: str = "The Logical Agent"
    app_env: Literal["development", "staging", "production", "test"] = "development"
    app_debug: bool = False
    app_url: str = "http://localhost:3000"
    api_url: str = "http://localhost:8000"
    secret_key: str = Field(min_length=32)
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 14
    mfa_issuer: str = "The Logical Agent"

    database_url: str
    database_url_sync: str

    redis_url: str = "redis://localhost:6379/0"
    celery_broker_url: str = "redis://localhost:6379/1"
    celery_result_backend: str = "redis://localhost:6379/2"

    elasticsearch_url: str = "http://localhost:9200"
    elasticsearch_index_prefix: str = "tla"

    s3_endpoint: str = "http://localhost:9000"
    s3_access_key: str = "minioadmin"
    s3_secret_key: str = "minioadmin"
    s3_bucket: str = "tla-media"
    s3_region: str = "us-east-1"
    cdn_url: str = "http://localhost:9000/tla-media"

    openai_api_key: str | None = None
    anthropic_api_key: str | None = None
    google_api_key: str | None = None
    groq_api_key: str | None = None
    groq_model: str | None = None
    gemini_model: str | None = None
    openrouter_api_key: str | None = None
    openrouter_model: str | None = None
    huggingface_api_key: str | None = None
    huggingface_model: str | None = None
    ollama_enabled: bool = True
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str | None = None
    github_api_token: str | None = None
    news_api_key: str | None = None
    # auto = pick first available free provider (Groq → Gemini → OpenRouter → Ollama → HF)
    default_llm_provider: str = "auto"
    default_llm_model: str = "llama-3.3-70b-versatile"

    google_client_id: str | None = None
    google_client_secret: str | None = None
    github_client_id: str | None = None
    github_client_secret: str | None = None
    linkedin_client_id: str | None = None
    linkedin_client_secret: str | None = None
    oauth_redirect_base: str = "http://localhost:8000/api/v1/auth/oauth"

    stripe_secret_key: str | None = None
    stripe_webhook_secret: str | None = None
    stripe_publishable_key: str | None = None
    paypal_client_id: str | None = None
    paypal_client_secret: str | None = None
    paypal_mode: str = "sandbox"

    smtp_host: str = "localhost"
    smtp_port: int = 1025
    smtp_user: str | None = None
    smtp_password: str | None = None
    smtp_from: str = "noreply@thelogicalagent.com"
    smtp_tls: bool = False

    sentry_dsn: str | None = None
    log_level: str = "INFO"
    prometheus_enabled: bool = True

    rate_limit_default: str = "100/minute"
    rate_limit_auth: str = "20/minute"
    rate_limit_ai: str = "30/minute"

    feature_ai_agents: bool = True
    feature_social: bool = True
    feature_monetization: bool = True
    feature_newsletter: bool = True
    feature_distribution: bool = True

    cors_origins: list[str] = Field(
        default_factory=lambda: [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        ]
    )

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors(cls, value: str | list[str]) -> list[str]:
        if isinstance(value, str):
            return [item.strip() for item in value.split(",") if item.strip()]
        return value

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]
