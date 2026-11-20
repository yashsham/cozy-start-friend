"""Seed initial product catalog and prospects into SQLite WAL database."""

import aiosqlite
from app.core.logging import logger
from app.repositories.product_repository import ProductRepository
from app.repositories.prospect_repository import ProspectRepository
from app.schemas.product import ProductCreate, ProductICPCreate
from app.schemas.prospect import ProspectCreate


async def seed_initial_data_if_empty(db: aiosqlite.Connection) -> None:
    """Populates SQLite database with default multi-product catalog and prospects if empty."""
    prod_repo = ProductRepository(db)
    prospect_repo = ProspectRepository(db)

    existing_products = await prod_repo.list_products()
    if not existing_products:
        logger.info("Database products table is empty. Seeding initial multi-product catalog...")

        # Product 1: CloudGuard AI
        prod_a = await prod_repo.create_product(
            ProductCreate(
                name="CloudGuard AI",
                slug="cloudguard-ai",
                tagline="Zero-trust automated container posture management",
                description="Continuous runtime protection, vulnerability scanning, and compliance automation for cloud-native infrastructure.",
                value_proposition="Automates DevSecOps compliance and eliminates runtime container breakouts without slowing down deployments.",
                pricing_tier="Enterprise",
                target_industries=["FinTech", "HealthTech", "SaaS", "Cybersecurity"],
                key_features=["Vulnerability Scanning", "Admission Controller", "Runtime Forensics", "SOC2 Automation"],
                is_active=True,
            )
        )

        await prod_repo.create_icp(
            ProductICPCreate(
                product_id=prod_a.id,
                title="FinTech DevSecOps & Security Leaders",
                target_roles=["VP Engineering", "Chief Information Security Officer", "Head of Infrastructure", "DevSecOps Lead"],
                target_company_sizes=["50-200", "201-500", "501-1000"],
                target_industries=["FinTech", "SaaS", "Cybersecurity"],
                key_pain_points=["Kubernetes misconfigurations", "Manual SOC2 compliance overhead", "Container breakout risks"],
                qualification_rules=["Requires AWS, GCP, or Azure", "Requires Kubernetes or Docker microservices"],
                min_fit_score=60.0,
            )
        )

        # Product 2: SignalFlow Data
        prod_b = await prod_repo.create_product(
            ProductCreate(
                name="SignalFlow Data",
                slug="signalflow-data",
                tagline="Real-time reverse-ETL and data streaming pipeline",
                description="Sub-second synchronization between cloud data warehouses (Snowflake, BigQuery) and business operational tools.",
                value_proposition="Syncs warehouse data to CRMs and support queues with sub-second latency and zero data-loss guarantees.",
                pricing_tier="Growth",
                target_industries=["E-commerce", "Logistics", "Retail", "Media"],
                key_features=["Postgres CDC", "Snowflake Sync", "Data Validation Engine", "Schema Drift Alerts"],
                is_active=True,
            )
        )

        await prod_repo.create_icp(
            ProductICPCreate(
                product_id=prod_b.id,
                title="Modern Data Stack Engineers & RevOps",
                target_roles=["Head of Data", "VP Data Engineering", "RevOps Director", "Lead Analytics Engineer"],
                target_company_sizes=["20-100", "101-500"],
                target_industries=["E-commerce", "Logistics", "B2B SaaS"],
                key_pain_points=["Stale CRM records", "High API rate-limiting errors", "Broken data pipelines"],
                qualification_rules=["Requires Snowflake, BigQuery, or Redshift", "Requires Salesforce or HubSpot"],
                min_fit_score=60.0,
            )
        )

        logger.info("Seeded 2 core products ('%s', '%s') with structured ICPs.", prod_a.name, prod_b.name)

    # Seed prospects if empty
    prospects, total = await prospect_repo.list_prospects(page=1, page_size=10)
    if total == 0:
        logger.info("Prospects table is empty. Seeding initial candidate leads...")
        await prospect_repo.create_prospect(
            ProspectCreate(
                first_name="Elena",
                last_name="Rostova",
                email="elena.rostova@acmesaas.com",
                company="Acme SaaS",
                title="VP Engineering",
                industry="FinTech",
                company_size="150-300",
                phone="+1 (555) 234-5678",
                linkedin_url="https://linkedin.com/in/elena-rostova",
                status="qualified",
            )
        )
        await prospect_repo.create_prospect(
            ProspectCreate(
                first_name="Marcus",
                last_name="Vance",
                email="marcus.vance@apexlogistics.com",
                company="Apex Logistics",
                title="Chief Technology Officer",
                industry="Logistics",
                company_size="500-1000",
                phone="+1 (555) 876-5432",
                linkedin_url="https://linkedin.com/in/marcus-vance",
                status="new",
            )
        )
        logger.info("Seeded initial prospects (Elena Rostova @ Acme SaaS, Marcus Vance @ Apex Logistics).")
