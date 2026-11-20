"""API tests for research and discovery endpoints."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_trigger_company_research_api(client: AsyncClient):
    payload = {"domain": "acmesaas.com"}
    resp = await client.post("/api/v1/research/company/comp_abc", json=payload)
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert len(data) >= 2
    assert any(i["signal_code"] == "company_description" for i in data)


@pytest.mark.asyncio
async def test_get_company_evidence_api(client: AsyncClient):
    # First trigger research to populate DB
    payload = {"domain": "cyberdyne.ai"}
    await client.post("/api/v1/research/company/comp_cyber", json=payload)

    # Fetch stored observations
    resp = await client.get("/api/v1/research/company/comp_cyber")
    assert resp.status_code == 200
    observations = resp.json()["data"]
    assert len(observations) >= 2
    assert all(o["company_id"] == "comp_cyber" for o in observations)


@pytest.mark.asyncio
async def test_discover_companies_api(client: AsyncClient):
    resp = await client.get("/api/v1/research/discovery?industry=Artificial Intelligence")
    assert resp.status_code == 200
    companies = resp.json()["data"]
    assert len(companies) >= 1
    assert any("Cyberdyne" in c["name"] for c in companies)
