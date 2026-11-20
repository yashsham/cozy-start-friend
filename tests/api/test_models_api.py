"""API tests for Local Model and Embedding endpoints."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_models_status_endpoint(client: AsyncClient):
    resp = await client.get("/api/v1/models/status")
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert "model_name" in data
    assert "ollama_online" in data
    assert "offline_mode" in data


@pytest.mark.asyncio
async def test_embeddings_endpoint(client: AsyncClient):
    payload = {
        "texts": [
            "Harvey AI Sales Agent",
            "Local offline AI inference using Ollama",
        ]
    }
    resp = await client.post("/api/v1/models/embeddings", json=payload)
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert data["dimension"] == 384
    assert len(data["embeddings"]) == 2
    assert len(data["embeddings"][0]) == 384


@pytest.mark.asyncio
async def test_similarity_endpoint(client: AsyncClient):
    payload = {
        "text_a": "B2B sales automation software",
        "text_b": "Automated pipeline for outbound sales representatives",
    }
    resp = await client.post("/api/v1/models/similarity", json=payload)
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert "similarity" in data
    assert isinstance(data["similarity"], float)
    assert 0.0 <= data["similarity"] <= 1.0
