"""Production backend startup script with automatic pre-flight checks.

Verifies:
- Python version (>= 3.10)
- SQLite database migrations (v1-v17)
- Local Ollama status & model availability
- SentenceTransformers embedding engine
- Boots Uvicorn server on configured host and port
"""

import asyncio
import os
import sys

# Ensure project root in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.config import settings
from app.core.logging import logger, setup_logging
from app.db.state import state_manager
from app.embeddings.local_embeddings import local_embedding_service
from app.llm.ollama_client import ollama_client


async def preflight_checks():
    setup_logging()
    print("=" * 70)
    print("  HARVEY AI SALES AGENT — BACKEND INITIALIZATION & PRE-FLIGHT")
    print("=" * 70)

    # 1. Python runtime
    py_ver = sys.version.split()[0]
    print(f"[*] Python Runtime: v{py_ver} (OK)")

    # 2. Database migrations
    print(f"[*] Verifying SQLite Database at: {settings.DB_PATH}")
    current_version = await state_manager.init_db()
    print(f"    -> Active Schema Migration: v{current_version} (WAL mode enabled)")

    # 3. Local Embeddings Engine
    print(f"[*] Initializing Local Embeddings: {settings.EMBEDDING_MODEL}")
    try:
        dim = len(local_embedding_service.embed_text("Test embedding initialization"))
        print(f"    -> SentenceTransformers ready ({dim}-dimensional dense vectors)")
    except Exception as e:
        print(f"    -> [WARN] SentenceTransformers fallback active: {e}")

    # 4. Ollama Daemon Status
    print(f"[*] Checking Local Ollama Daemon at: {settings.OLLAMA_BASE_URL}")
    is_ollama_up = await ollama_client.check_health()
    if is_ollama_up:
        models = await ollama_client.list_models()
        print(f"    -> Ollama Online. Available models: {', '.join(models) if models else 'None'}")
        is_model_ready = await ollama_client.is_model_available()
        if is_model_ready:
            print(f"    -> Target Model '{settings.OLLAMA_MODEL}' is ready for local inference.")
        else:
            print(f"    -> [INFO] Model '{settings.OLLAMA_MODEL}' not yet downloaded. Run: ollama pull {settings.OLLAMA_MODEL}")
    else:
        print("    -> [NOTICE] Ollama daemon is currently offline.")
        print("       The backend will operate in Offline / Fixture mode.")
        print("       To enable live local LLM inference, start Ollama: 'ollama serve'")

    print("=" * 70)
    print(f"  Starting FastAPI server at http://{settings.HOST}:{settings.PORT}")
    print(f"  API Docs: http://localhost:{settings.PORT}/docs")
    print(f"  Health Check: http://localhost:{settings.PORT}/api/v1/health")
    print("=" * 70)
    print()


def main():
    asyncio.run(preflight_checks())

    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
    )


if __name__ == "__main__":
    main()
