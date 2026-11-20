"""API tests for health and system readiness."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_endpoint(client: AsyncClient):
    response = await client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["database_version"] == 17
    assert data["environment"] == "development"


@pytest.mark.asyncio
async def test_liveness_and_readiness(client: AsyncClient):
    live_resp = await client.get("/api/v1/live")
    assert live_resp.status_code == 200
    assert live_resp.json() == {"live": True}

    ready_resp = await client.get("/api/v1/ready")
    assert ready_resp.status_code == 200
    assert ready_resp.json() == {"ready": True}


@pytest.mark.asyncio
async def test_root_endpoint(client: AsyncClient):
    response = await client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "Harvey AI Sales Agent" in data["app"]
