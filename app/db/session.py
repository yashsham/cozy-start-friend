"""FastAPI dependency injection for database connections."""

from typing import AsyncGenerator
import aiosqlite
from app.db.state import state_manager


async def get_db() -> AsyncGenerator[aiosqlite.Connection, None]:
    """Dependency provider yielding an active async SQLite connection."""
    async with state_manager.connect() as db:
        yield db
