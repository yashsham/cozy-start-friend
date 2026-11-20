"""API tests for Products and ICP endpoints."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_products_api_full_cycle(client: AsyncClient):
    # 1. Initially empty
    list_resp = await client.get("/api/v1/products")
    assert list_resp.status_code == 200
    assert list_resp.json()["data"] == []

    # 2. Create product
    payload = {
        "name": "Harvey Inbound",
        "slug": "harvey-inbound",
        "tagline": "AI Inbound Reply Classification",
        "description": "Deterministic reply triage and sentiment scoring.",
        "value_proposition": "Never miss an interested prospect reply.",
        "pricing_tier": "Pro",
        "target_industries": ["B2B SaaS"],
        "key_features": ["IMAP Polling", "Stop-on-Reply"],
        "is_active": True,
    }
    create_resp = await client.post("/api/v1/products", json=payload)
    assert create_resp.status_code == 201
    created_product = create_resp.json()["data"]
    product_id = created_product["id"]
    assert created_product["name"] == "Harvey Inbound"
    assert created_product["slug"] == "harvey-inbound"

    # 3. Duplicate slug conflict check
    dup_resp = await client.post("/api/v1/products", json=payload)
    assert dup_resp.status_code == 409

    # 4. Get by ID
    get_resp = await client.get(f"/api/v1/products/{product_id}")
    assert get_resp.status_code == 200
    assert get_resp.json()["data"]["id"] == product_id

    # 5. Update product
    update_payload = {"pricing_tier": "Enterprise", "tagline": "Updated Inbound"}
    put_resp = await client.put(f"/api/v1/products/{product_id}", json=update_payload)
    assert put_resp.status_code == 200
    assert put_resp.json()["data"]["pricing_tier"] == "Enterprise"
    assert put_resp.json()["data"]["tagline"] == "Updated Inbound"

    # 6. Create ICP
    icp_payload = {
        "product_id": product_id,
        "title": "Head of Revenue Ops",
        "target_roles": ["VP RevOps", "Director of Sales Operations"],
        "target_company_sizes": ["51-200"],
        "target_industries": ["B2B SaaS"],
        "key_pain_points": ["Slow reply follow-ups"],
        "qualification_rules": ["Uses HubSpot or Salesforce"],
        "min_fit_score": 70.0,
    }
    icp_resp = await client.post("/api/v1/icps", json=icp_payload)
    assert icp_resp.status_code == 201
    icp_id = icp_resp.json()["data"]["id"]

    # 7. List ICPs for product
    icp_list_resp = await client.get(f"/api/v1/icps/product/{product_id}")
    assert icp_list_resp.status_code == 200
    assert len(icp_list_resp.json()["data"]) == 1
    assert icp_list_resp.json()["data"][0]["id"] == icp_id

    # 8. Delete Product
    del_resp = await client.delete(f"/api/v1/products/{product_id}")
    assert del_resp.status_code == 200

    # 9. Product should no longer exist
    get_again = await client.get(f"/api/v1/products/{product_id}")
    assert get_again.status_code == 404
