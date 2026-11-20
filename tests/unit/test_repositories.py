"""Unit tests for Product, ICP, and Business repositories."""

import pytest
import aiosqlite

from app.repositories.business_repository import BusinessRepository
from app.repositories.product_repository import ProductRepository
from app.schemas.business import BusinessProfileCreate
from app.schemas.product import ProductCreate, ProductICPCreate, ProductUpdate


@pytest.mark.asyncio
async def test_product_crud_lifecycle(test_db: aiosqlite.Connection):
    repo = ProductRepository(test_db)

    # 1. Create product
    create_data = ProductCreate(
        name="Harvey Core",
        slug="harvey-core",
        tagline="Autonomous Local AI Sales Agent",
        description="Self-hosted sales automation system running offline.",
        value_proposition="Zero API costs and guaranteed data sovereignty.",
        pricing_tier="Enterprise",
        target_industries=["SaaS", "FinTech"],
        key_features=["Ollama Qwen2.5", "SQLite WAL", "LangGraph"],
        is_active=True,
    )
    product = await repo.create_product(create_data)
    assert product.id is not None
    assert product.slug == "harvey-core"
    assert product.key_features == ["Ollama Qwen2.5", "SQLite WAL", "LangGraph"]

    # 2. Get by ID and Slug
    fetched_by_id = await repo.get_product_by_id(product.id)
    assert fetched_by_id is not None
    assert fetched_by_id.name == "Harvey Core"

    fetched_by_slug = await repo.get_product_by_slug("harvey-core")
    assert fetched_by_slug is not None
    assert fetched_by_slug.id == product.id

    # 3. List products
    products = await repo.list_products()
    assert len(products) == 1

    # 4. Update product
    update_data = ProductUpdate(tagline="Updated Autonomous Sales Agent", pricing_tier="Pro")
    updated = await repo.update_product(product.id, update_data)
    assert updated is not None
    assert updated.tagline == "Updated Autonomous Sales Agent"
    assert updated.pricing_tier == "Pro"

    # 5. Create Product ICP
    icp_data = ProductICPCreate(
        product_id=product.id,
        title="Enterprise B2B Founders",
        target_roles=["CTO", "CEO"],
        target_company_sizes=["11-50", "51-200"],
        target_industries=["SaaS"],
        key_pain_points=["High SaaS seat costs", "Vendor lock-in"],
        qualification_rules=["Must have active engineering team"],
        min_fit_score=75.0,
    )
    icp = await repo.create_icp(icp_data)
    assert icp.id is not None
    assert icp.product_id == product.id
    assert icp.min_fit_score == 75.0

    # 6. List ICPs for product
    icps = await repo.list_icps_for_product(product.id)
    assert len(icps) == 1
    assert icps[0].title == "Enterprise B2B Founders"

    # 7. Delete product (verifying cascade delete of ICP)
    deleted = await repo.delete_product(product.id)
    assert deleted is True

    # ICP should be deleted via cascade
    icps_after = await repo.list_icps_for_product(product.id)
    assert len(icps_after) == 0


@pytest.mark.asyncio
async def test_business_profile_repository(test_db: aiosqlite.Connection):
    repo = BusinessRepository(test_db)

    # Initial get should be None
    assert await repo.get_profile() is None

    # Create profile
    data = BusinessProfileCreate(
        company_name="Acme AI Corp",
        website="https://acme.local",
        tagline="Local-first AI agents",
        overview="Pioneering sovereign enterprise AI systems.",
        industry="Artificial Intelligence",
        business_model="B2B Enterprise",
        target_geography="Global",
        value_proposition="100% private and air-gapped.",
        competitors=["CloudCorp", "LegacySalesCo"],
    )
    profile = await repo.create_or_update_profile(data)
    assert profile.company_name == "Acme AI Corp"
    assert profile.competitors == ["CloudCorp", "LegacySalesCo"]

    # Update profile
    update_data = BusinessProfileCreate(
        company_name="Acme AI Technologies",
        website="https://acme.tech",
        tagline="Sovereign AI Systems",
        overview="Next-generation private enterprise intelligence.",
        industry="Enterprise Software",
        competitors=["CloudCorp"],
    )
    updated = await repo.create_or_update_profile(update_data)
    assert updated.company_name == "Acme AI Technologies"
    assert updated.website == "https://acme.tech"
