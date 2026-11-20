"""SQLite WAL State Manager with async connection pool and migration runner."""

import os
from contextlib import asynccontextmanager
from pathlib import Path
from typing import AsyncGenerator, Optional
import aiosqlite

from app.core.config import settings
from app.core.logging import logger
from app.db.migrations import MIGRATIONS


class StateManager:
    """Manages SQLite connection lifecycle, WAL configuration, and migrations."""

    def __init__(self, db_path: Optional[str] = None):
        self.db_path = db_path or settings.DB_PATH

    @asynccontextmanager
    async def connect(self) -> AsyncGenerator[aiosqlite.Connection, None]:
        """Provide an aiosqlite connection with busy timeout and foreign keys."""
        Path(self.db_path).parent.mkdir(parents=True, exist_ok=True)
        db = await aiosqlite.connect(
            self.db_path,
            timeout=settings.DB_BUSY_TIMEOUT_SECONDS
        )
        db.row_factory = aiosqlite.Row
        try:
            await db.execute("PRAGMA foreign_keys = ON;")
            yield db
        finally:
            await db.close()

    async def init_db(self) -> int:
        """Create or upgrade database schema to current migration version."""
        Path(self.db_path).parent.mkdir(parents=True, exist_ok=True)
        async with self.connect() as db:
            await db.execute("PRAGMA journal_mode = WAL;")
            await db.execute("PRAGMA synchronous = NORMAL;")

            async with db.execute("PRAGMA user_version;") as cursor:
                row = await cursor.fetchone()
                current_version = row[0] if row else 0

            logger.info("Current SQLite user_version: %d (Total available: %d)", current_version, len(MIGRATIONS))

            for target_version, script in enumerate(MIGRATIONS, start=1):
                if current_version < target_version:
                    logger.info("Applying SQLite migration v%d...", target_version)
                    await db.executescript(script)
                    await db.execute(f"PRAGMA user_version = {target_version};")
                    await db.commit()
                    current_version = target_version

            logger.info("SQLite database initialized at %s (v%d)", self.db_path, current_version)
            return current_version

    async def get_version(self) -> int:
        """Return the current user_version of the database."""
        async with self.connect() as db:
            async with db.execute("PRAGMA user_version;") as cursor:
                row = await cursor.fetchone()
                return row[0] if row else 0


state_manager = StateManager()
