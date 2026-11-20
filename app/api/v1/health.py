"""Health and readiness probe endpoints."""

from fastapi import APIRouter, Depends
import aiosqlite
import httpx

from app.core.config import settings
from app.db.session import get_db
from app.db.state import state_manager
from app.schemas.common import HealthResponse

router = APIRouter(tags=["Health & System"])


@router.get("/health", response_model=HealthResponse)
async def check_health(db: aiosqlite.Connection = Depends(get_db)):
    """Health check validating database connectivity and Ollama daemon."""
    async with db.execute("PRAGMA user_version;") as cursor:
        row = await cursor.fetchone()
        db_version = row[0] if row else 0

    # Probe Ollama daemon with fast non-blocking timeout
    ollama_status = "unavailable"
    try:
        async with httpx.AsyncClient(timeout=0.5) as client:
            resp = await client.get(f"{settings.OLLAMA_BASE_URL}/api/tags")
            if resp.status_code == 200:
                ollama_status = "online"
    except Exception:
        ollama_status = "unavailable"

    return HealthResponse(
        status="ok",
        version=settings.APP_VERSION,
        environment=settings.ENVIRONMENT,
        database_version=db_version,
        offline_mode=settings.OFFLINE_MODE,
        ollama_status=ollama_status,
    )


@router.get("/ready")
async def check_readiness():
    """Readiness probe."""
    return {"ready": True}


@router.get("/live")
async def check_liveness():
    """Liveness probe."""
    return {"live": True}
