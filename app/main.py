"""Harvey AI Sales Agent - FastAPI Backend Application."""

from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.api import api_router
from app.core.config import settings
from app.core.exceptions import HarveyException, map_exception_to_http
from app.core.logging import logger, setup_logging
from app.db.state import state_manager


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown lifecycle management."""
    setup_logging()
    logger.info("Initializing Harvey AI Backend (v%s)...", settings.APP_VERSION)
    logger.info("Environment: %s | Offline Mode: %s", settings.ENVIRONMENT, settings.OFFLINE_MODE)

    # Initialize SQLite WAL Database & Apply Migrations v1-v17
    version = await state_manager.init_db()
    logger.info("Database initialized successfully at user_version v%d.", version)

    # Seed core multi-product catalog & prospects if empty
    from app.db.seed import seed_initial_data_if_empty
    async with state_manager.connect() as db:
        await seed_initial_data_if_empty(db)

    yield

    logger.info("Shutting down Harvey AI Backend cleanly.")


def create_app() -> FastAPI:
    """FastAPI application factory."""
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description="Local-First, Multi-Product AI Sales Agent operating with zero paid cloud LLMs.",
        lifespan=lifespan,
    )

    # CORS configuration for frontend
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Global Harvey domain exception handler
    @app.exception_handler(HarveyException)
    async def harvey_exception_handler(request: Request, exc: HarveyException):
        http_exc = map_exception_to_http(exc)
        return JSONResponse(
            status_code=http_exc.status_code,
            content=http_exc.detail,
        )

    # Register API routes with multiple prefix options for full client compatibility
    app.include_router(api_router, prefix="/api/v1")
    app.include_router(api_router, prefix="/api")
    app.include_router(api_router)

    @app.get("/")
    async def root():
        return {
            "app": settings.APP_NAME,
            "version": settings.APP_VERSION,
            "docs_url": "/docs",
            "health_url": "/api/v1/health",
        }

    return app


app = create_app()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
    )
