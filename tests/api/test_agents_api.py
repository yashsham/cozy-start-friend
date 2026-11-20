"""API tests for LangGraph agent pipeline and trigger endpoints."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_agent_pipeline_endpoint(client: AsyncClient):
    resp = await client.get("/api/v1/agents/pipeline")
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert data["graph_engine"] == "LangGraph StateGraph"
    assert len(data["active_nodes"]) == 8
    assert "stop_on_reply" in data["deterministic_guards"]


@pytest.mark.asyncio
async def test_trigger_agent_run_endpoint(client: AsyncClient):
    payload = {
        "first_name": "Marcus",
        "last_name": "Aurelius",
        "title": "Head of Enterprise Growth",
        "company_name": "Roman SaaS Logistics",
        "company_industry": "B2B SaaS",
        "company_description": "Cloud-based fleet logistics and route planning platform.",
        "auto_approve": True,
    }
    resp = await client.post("/api/v1/agents/run", json=payload)
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert data["status"] == "completed"
    assert data["is_qualified"] is True
    assert data["gate_passed"] is True
    assert data["is_sent"] is True
    assert len(data["execution_logs"]) > 0
