"""Pytest fixtures for Harvey AI test suite."""

import os
import tempfile
import pytest
import pytest_asyncio
import aiosqlite
from httpx import ASGITransport, AsyncClient

from app.core.config import settings
from app.db.state import StateManager
from app.main import app


@pytest.fixture(scope="session")
def anyio_backend():
    return "asyncio"


@pytest_asyncio.fixture
async def test_db():
    """Create a temporary SQLite database initialized with all 17 migrations."""
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as tmp:
        db_path = tmp.name

    test_manager = StateManager(db_path=db_path)
    await test_manager.init_db()

    async with test_manager.connect() as conn:
        yield conn

    # Teardown
    if os.path.exists(db_path):
        try:
            os.remove(db_path)
        except OSError:
            pass


@pytest_asyncio.fixture
async def client(test_db: aiosqlite.Connection):
    """Async test client with dependency overrides pointing to the test DB."""
    from app.db.session import get_db

    async def override_get_db():
        yield test_db

    app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()
