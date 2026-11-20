"""Integration tests verifying full API contract for frontend screens."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_frontend_draft_endpoint(client: AsyncClient):
    payload = {
        "prospect": {
            "name": "Alex Johnson",
            "first_name": "Alex",
            "company": "Vanguard Tech",
            "title": "Head of Growth",
            "industry": "B2B SaaS",
        },
        "productName": "Harvey Sales AI",
        "objective": "initial_outreach",
        "tone": "concise",
        "length": "short",
        "cta": "soft_ask",
    }
    resp = await client.post("/outreach/draft", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "subject" in data
    assert "body" in data
    assert len(data["body"].split()) <= 125
    assert not any(tag in data["body"] for tag in ["{{first_name}}", "[Company]"])


@pytest.mark.asyncio
async def test_frontend_reply_analysis_endpoint(client: AsyncClient):
    payload = {
        "messages": [
            {"from": "sales@harvey.local", "date": "2026-11-20", "body": "Hi Jane, quick note..."},
            {
                "from": "jane@acme.com",
                "date": "2026-11-20",
                "body": "Hi Alex, we are interested in learning more. What does pricing look like?",
            },
        ]
    }
    resp = await client.post("/replies/analyze", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["intent"] == "positive"
    assert data["sentiment"] == "positive"
    assert data["interest"] >= 80
    assert "pricing" in data["nextAction"].lower() or "call" in data["nextAction"].lower()


@pytest.mark.asyncio
async def test_frontend_discovery_run_endpoint(client: AsyncClient):
    payload = {
        "productId": "prod_1",
        "icpId": "icp_1",
        "geography": "San Francisco",
        "industry": "B2B SaaS",
        "companySize": "51-200",
        "limit": 3,
    }
    resp = await client.post("/discovery/run", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "prospectIds" in data
    assert isinstance(data["prospectIds"], list)
    assert len(data["prospectIds"]) >= 1


@pytest.mark.asyncio
async def test_prospects_crud_api(client: AsyncClient):
    # 1. Create a prospect
    create_payload = {
        "first_name": "Marcus",
        "last_name": "Vance",
        "email": "marcus@vance.io",
        "title": "Chief Revenue Officer",
        "company": "Vance Corp",
        "industry": "FinTech",
        "status": "new",
    }
    create_resp = await client.post("/api/v1/prospects", json=create_payload)
    assert create_resp.status_code == 201
    created = create_resp.json()["data"]
    prospect_id = created["id"]
    assert created["first_name"] == "Marcus"

    # 2. Fetch single prospect
    get_resp = await client.get(f"/api/v1/prospects/{prospect_id}")
    assert get_resp.status_code == 200
    assert get_resp.json()["data"]["id"] == prospect_id

    # 3. Update prospect
    update_payload = {"status": "qualified", "score": 88}
    put_resp = await client.put(f"/api/v1/prospects/{prospect_id}", json=update_payload)
    assert put_resp.status_code == 200
    assert put_resp.json()["data"]["status"] == "qualified"
    assert put_resp.json()["data"]["score"] == 88

    # 4. List prospects with search filter
    search_resp = await client.get("/api/v1/prospects?search=Marcus")
    assert search_resp.status_code == 200
    items = search_resp.json()["data"]["items"]
    assert len(items) >= 1
    assert items[0]["first_name"] == "Marcus"
