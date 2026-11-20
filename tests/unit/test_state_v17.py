"""Unit tests for SQLite WAL state manager and Migration 17."""

import os
import tempfile
import pytest
import aiosqlite

from app.db.state import StateManager


@pytest.mark.asyncio
async def test_init_db_applies_all_17_migrations():
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as tmp:
        db_path = tmp.name

    try:
        manager = StateManager(db_path=db_path)
        version = await manager.init_db()
        assert version == 17

        # Verify PRAGMA journal_mode is WAL
        async with manager.connect() as db:
            async with db.execute("PRAGMA journal_mode;") as cursor:
                row = await cursor.fetchone()
                assert row[0].lower() == "wal"

            # Check that v17 tables exist
            tables = [
                "products",
                "product_icps",
                "product_scores",
                "business_profiles",
                "buying_signals",
                "local_system_settings",
            ]
            for table in tables:
                async with db.execute(f"SELECT COUNT(*) FROM {table};") as cursor:
                    count_row = await cursor.fetchone()
                    assert count_row is not None
                    assert count_row[0] == 0

        # Idempotency check: running init_db again should not error or downgrade
        second_version = await manager.init_db()
        assert second_version == 17
    finally:
        if os.path.exists(db_path):
            os.remove(db_path)
