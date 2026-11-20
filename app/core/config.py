"""Centralized application configuration and environment validation."""

from pathlib import Path
from typing import List
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Root project paths
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(PROJECT_ROOT / ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    # Core Application
    APP_NAME: str = "Harvey AI Sales Agent"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"
    DEBUG: bool = False

    # Server Binding
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ]

    # SQLite Persistence
    DB_PATH: str = str(PROJECT_ROOT / "data" / "sellbird.db")
    DB_BUSY_TIMEOUT_SECONDS: float = 30.0

    # Local AI Inference via Ollama (Zero paid cloud LLM services)
    OLLAMA_BASE_URL: str = "http://127.0.0.1:11434"
    OLLAMA_MODEL: str = "qwen2.5:7b-instruct"
    OLLAMA_TIMEOUT_SECONDS: float = 60.0

    # Local Embeddings (SentenceTransformers)
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"
    EMBEDDING_DIMENSION: int = 384

    # Offline Air-Gap Mode Flag
    OFFLINE_MODE: bool = False

    # Outbound Mail Delivery
    SMTP_HOST: str = "localhost"
    SMTP_PORT: int = 1025
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = "sales@harvey.local"
    MOCK_SMTP: bool = True

    # Rate Limiting & Safety
    MAX_DAILY_SENDS: int = 50
    EMAIL_MAX_WORDS: int = 125

    @field_validator("DB_PATH")
    @classmethod
    def ensure_db_dir(cls, v: str) -> str:
        p = Path(v)
        p.parent.mkdir(parents=True, exist_ok=True)
        return str(p)


settings = Settings()
