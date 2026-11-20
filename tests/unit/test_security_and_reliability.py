"""Comprehensive security, air-gap, and reliability tests."""

import os
import tempfile
import pytest
import aiosqlite
from app.collectors.web_scraper import check_ssrf
from app.core.exceptions import AirGapViolationError, OllamaConnectionError
from app.db.state import StateManager
from app.llm.leak_guard import validate_inference_endpoint
from app.llm.ollama_client import OllamaClient


def test_ssrf_guard_blocks_private_and_local_networks():
    """Verify SSRF guard rejects loopback, RFC1918, link-local, and bad schemes."""
    # Loopback
    with pytest.raises(ValueError, match="SSRF Protection"):
        check_ssrf("http://127.0.0.1/admin")

    with pytest.raises(ValueError, match="SSRF Protection"):
        check_ssrf("http://localhost:8000/api")

    # RFC1918 Private ranges
    with pytest.raises(ValueError, match="SSRF Protection"):
        check_ssrf("http://10.0.0.1/internal")

    with pytest.raises(ValueError, match="SSRF Protection"):
        check_ssrf("http://192.168.1.1/router")

    with pytest.raises(ValueError, match="SSRF Protection"):
        check_ssrf("http://172.20.0.1/docker")

    # AWS metadata
    with pytest.raises(ValueError, match="SSRF Protection"):
        check_ssrf("http://169.254.169.254/latest/meta-data/")

    # Non-HTTP/HTTPS URI scheme
    with pytest.raises(ValueError, match="SSRF Protection"):
        check_ssrf("file:///etc/passwd")

    with pytest.raises(ValueError, match="SSRF Protection"):
        check_ssrf("gopher://127.0.0.1:70")


def test_ssrf_guard_allows_public_domains():
    """Verify SSRF guard permits legitimate public domains."""
    check_ssrf("https://acmesaas.com")
    check_ssrf("http://example.com/about")
    check_ssrf("https://github.com/features")


def test_cloud_leak_guard():
    """Verify Outbound Leak Guard halts requests to OpenAI, Anthropic, Gemini, Groq."""
    prohibited_urls = [
        "https://api.openai.com/v1/chat/completions",
        "https://api.anthropic.com/v1/messages",
        "https://generativelanguage.googleapis.com/v1beta/models",
        "https://api.groq.com/openai/v1/chat/completions",
    ]
    for url in prohibited_urls:
        with pytest.raises(AirGapViolationError):
            validate_inference_endpoint(url)

    # Permitted local endpoints
    validate_inference_endpoint("http://127.0.0.1:11434/api/generate")
    validate_inference_endpoint("http://localhost:11434/api/chat")


@pytest.mark.asyncio
async def test_offline_ollama_graceful_handling():
    """Verify OllamaClient behaves gracefully and raises OllamaConnectionError when unreachable."""
    # Point to an unused local port
    offline_client = OllamaClient(base_url="http://127.0.0.1:59999", timeout=0.5)
    assert await offline_client.check_health() is False

    # Attempt generate with retries=0 should raise OllamaConnectionError cleanly
    with pytest.raises(OllamaConnectionError, match="Failed to connect to local Ollama"):
        await offline_client.generate(
            prompt="Introduce our cybersecurity platform",
            system_prompt="Sales Assistant",
            retries=0,
        )


@pytest.mark.asyncio
async def test_sqlite_wal_persistence_across_connections():
    """Verify SQLite WAL ACID transactions persist across separate connection handles."""
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as f:
        temp_db_path = f.name

    try:
        # Step 1: Initialize schema and insert data with StateManager
        mgr = StateManager(db_path=temp_db_path)
        await mgr.init_db()

        async with mgr.connect() as conn:
            await conn.execute(
                "INSERT INTO business_profiles (id, company_name, website) VALUES ('bp_persist', 'Persistent Co', 'persist.io');"
            )
            await conn.commit()

        # Step 2: Open a separate brand-new raw connection and verify data is committed
        async with aiosqlite.connect(temp_db_path) as direct_conn:
            direct_conn.row_factory = aiosqlite.Row
            async with direct_conn.execute("SELECT * FROM business_profiles WHERE id = 'bp_persist';") as cursor:
                row = await cursor.fetchone()
                assert row is not None
                assert row["company_name"] == "Persistent Co"
                assert row["website"] == "persist.io"

        # Verify PRAGMA journal_mode is WAL
        async with aiosqlite.connect(temp_db_path) as direct_conn:
            async with direct_conn.execute("PRAGMA journal_mode;") as cursor:
                row = await cursor.fetchone()
                assert row[0].lower() == "wal"

    finally:
        if os.path.exists(temp_db_path):
            try:
                os.remove(temp_db_path)
            except OSError:
                pass
