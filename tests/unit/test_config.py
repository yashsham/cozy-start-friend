"""Unit tests for centralized configuration and settings."""

import pytest
from app.core.config import Settings


def test_settings_defaults():
    settings = Settings()
    assert settings.APP_NAME == "Harvey AI Sales Agent"
    assert settings.OLLAMA_MODEL == "qwen2.5:7b-instruct"
    assert "127.0.0.1" in settings.OLLAMA_BASE_URL
    assert settings.EMBEDDING_MODEL == "all-MiniLM-L6-v2"
    assert settings.EMAIL_MAX_WORDS == 125
    assert settings.MOCK_SMTP is True


def test_settings_db_dir_ensured():
    settings = Settings()
    assert settings.DB_PATH.endswith(".db")
