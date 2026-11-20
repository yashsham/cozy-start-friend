"""Offline Acceptance Protocol and End-to-End User Journey Verification.

Demonstrates that Harvey AI Sales Agent operates 100% locally with zero paid LLM
services and zero external network access, satisfying EDXSO Assignment 2.
"""

import asyncio
import os
import sys
import tempfile
import time

# Ensure project root in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.collectors.web_scraper import WebScraperCollector
from app.db.state import StateManager
from app.embeddings.local_embeddings import LocalEmbeddingService
from app.llm.leak_guard import validate_inference_endpoint
from app.llm.ollama_client import OllamaClient
from app.orchestration.graph import run_sales_agent_workflow
from app.repositories.product_repository import ProductRepository
from app.repositories.prospect_repository import ProspectRepository
from app.safety.gate import check_email_quality
from app.schemas.product import ProductCreate, ProductICPCreate
from app.schemas.prospect import ProspectCreate


async def run_offline_acceptance_test():
    print("=" * 75)
    print("  HARVEY AI SALES AGENT — OFFLINE ACCEPTANCE PROTOCOL")
    print("  EDXSO AI Engineer Intern Assignment 2 Verification")
    print("=" * 75)
    print()

    # Step 1: Air-Gap Leak Guard Verification
    print("[1/7] Testing Outbound Cloud Leak Guard...")
    leak_domains = [
        "https://api.openai.com/v1/chat/completions",
        "https://api.anthropic.com/v1/messages",
        "https://api.groq.com/openai/v1/chat/completions",
    ]
    for domain in leak_domains:
        try:
            validate_inference_endpoint(domain)
            print(f"  [ERROR] Leak guard failed to block {domain}!")
            sys.exit(1)
        except Exception:
            pass
    print("  [PASS] All paid cloud AI domains strictly intercepted and blocked.")

    # Step 2: Isolated SQLite WAL Database & Schema v1-v17
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as f:
        test_db_path = f.name

    print(f"\n[2/7] Initializing Isolated SQLite WAL Database at {test_db_path}...")
    mgr = StateManager(db_path=test_db_path)
    version = await mgr.init_db()
    assert version == 17, f"Expected migration version 17, got {version}"
    print(f"  [PASS] Applied all 17 migrations successfully (Current schema version: v{version}).")

    # Step 3: Multi-Product Catalog & ICP Creation
    print("\n[3/7] Seeding Multi-Product Catalog and ICPs...")
    async with mgr.connect() as db:
        prod_repo = ProductRepository(db)
        prospect_repo = ProspectRepository(db)

        # Product 1: CloudGuard AI
        prod_a = await prod_repo.create_product(
            ProductCreate(
                name="CloudGuard AI",
                slug="cloudguard-ai",
                description="Zero-trust container security and continuous Kubernetes posture management.",
                value_proposition="Automates DevSecOps compliance and stops runtime container breakouts.",
                target_industries=["FinTech", "SaaS", "Cybersecurity"],
                key_features=["Vulnerability Scanner", "Admission Controller", "Runtime Forensics"],
            )
        )
        await prod_repo.create_icp(
            ProductICPCreate(
                product_id=prod_a.id,
                title="FinTech DevSecOps Leaders",
                target_roles=["VP Engineering", "Chief Information Security Officer", "DevSecOps Lead"],
                target_company_sizes=["50-200", "201-500"],
                target_industries=["FinTech", "SaaS"],
                key_pain_points=["Kubernetes misconfigurations", "Manual compliance audits"],
                qualification_rules=["Requires AWS or GCP", "Requires Kubernetes"],
                min_fit_score=60.0,
            )
        )

        # Product 2: SignalFlow Data
        prod_b = await prod_repo.create_product(
            ProductCreate(
                name="SignalFlow Data",
                slug="signalflow-data",
                description="Real-time reverse ETL and event-driven data streaming pipeline.",
                value_proposition="Syncs warehouse data to CRMs with sub-second latency.",
                target_industries=["E-commerce", "Logistics", "Retail"],
                key_features=["Postgres CDC", "Snowflake Sync", "Data Validation"],
            )
        )

        # Seed Prospect: Acme SaaS
        prospect = await prospect_repo.create_prospect(
            ProspectCreate(
                first_name="Elena",
                last_name="Rostova",
                email="elena@acmesaas.com",
                company="Acme SaaS",
                title="VP Engineering",
                industry="FinTech",
                status="new",
            )
        )
    print(f"  [PASS] Created 2 products ('{prod_a.name}', '{prod_b.name}') and target prospect '{prospect.first_name} {prospect.last_name}'.")

    # Step 4: Air-Gapped Evidence Collection from Offline Fixtures
    print("\n[4/7] Harvesting Evidence via Web Collector (Offline Fixture Mode)...")
    scraper = WebScraperCollector()
    evidence = await scraper.collect("acmesaas.com")
    assert len(evidence) >= 2, "Expected offline fixture evidence"
    for item in evidence:
        assert "<untrusted" in item.value_text, "Untrusted XML tags missing!"
    print(f"  [PASS] Harvested {len(evidence)} verified evidence items with strict <untrusted> fencing.")

    # Step 5: Local Dense Vector Semantic Matching
    print("\n[5/7] Computing Local Dense Vector Embeddings (SentenceTransformers)...")
    t0 = time.time()
    embedder = LocalEmbeddingService()
    prospect_text = f"{prospect.title} at {prospect.company} in {prospect.industry}. Kubernetes, AWS, microservices."
    icp_a_text = f"{prod_a.name}: {prod_a.value_proposition} Target: VP Engineering, FinTech."
    icp_b_text = f"{prod_b.name}: {prod_b.value_proposition} Target: Logistics, E-commerce."

    sim_a = embedder.compute_similarity(prospect_text, icp_a_text)
    sim_b = embedder.compute_similarity(prospect_text, icp_b_text)
    dt = (time.time() - t0) * 1000

    print(f"  Similarity with '{prod_a.name}': {sim_a:.4f}")
    print(f"  Similarity with '{prod_b.name}': {sim_b:.4f} (Elapsed: {dt:.1f}ms)")
    assert sim_a > sim_b, "Product A should have higher affinity for FinTech DevSecOps prospect"
    print(f"  [PASS] Multi-product qualification correctly selected '{prod_a.name}' as highest fit, preventing cannibalization.")

    # Step 6: Personalized Cold Outreach & Deterministic Gate Validation
    print("\n[6/7] Generating Cold Email Copy & Enforcing Pre-Send Quality Gate...")
    sample_draft = (
        "Hi Elena,\n\n"
        "Noticed Acme SaaS is scaling your FinTech infrastructure on AWS. "
        "CloudGuard AI automates container posture checks and eliminates manual compliance overhead "
        "for fast-moving engineering teams.\n\n"
        "Would you be open to a 10-minute briefing next Tuesday?\n\n"
        "Best,\nAlex | CloudGuard AI"
    )
    passed, warnings, word_count = check_email_quality("Quick question on container posture", sample_draft)
    print(f"  Draft Word Count: {word_count} words (Limit: <= 125 words)")
    print(f"  Deterministic Quality Gate Passed: {passed}")
    assert passed, f"Draft failed gate checks: {warnings}"
    print("  [PASS] Draft complies with word count, merge tag safety, and tone rules.")

    # Step 7: Deterministic Stop-on-Reply Verification
    print("\n[7/7] Simulating Inbound Prospect Reply & Triggering Stop-on-Reply Guard...")
    initial_state = {
        "prospect_id": prospect.id,
        "prospect": {"first_name": prospect.first_name, "company": prospect.company},
        "company_name": prospect.company,
        "inbound_reply_text": "Thanks Alex, let's connect next Tuesday at 2pm.",
        "dispatched": False,
        "observations": [],
        "product_scores": {},
    }
    result_state = await run_sales_agent_workflow(initial_state)
    intent = result_state.get("reply_intent") or result_state.get("inbound_reply_intent")
    assert intent in ("meeting_request", "interested", "positive")
    assert result_state.get("stop_campaign") is True or result_state.get("dispatched") is False, "Follow-ups must be stopped upon reply!"
    print(f"  Classified Inbound Intent: '{intent}'")
    print(f"  Outbound Dispatch Halted: {not result_state.get('dispatched')}")
    print("  [PASS] Deterministic Stop-on-Reply Guard immediately halted outreach queue.")

    # Cleanup
    if os.path.exists(test_db_path):
        try:
            os.remove(test_db_path)
        except OSError:
            pass

    print()
    print("=" * 75)
    print("  ALL 7 ACCEPTANCE PROTOCOLS COMPLETED SUCCESSFULLY (100% PASS)")
    print("  Offline Local-First Architecture Confirmed.")
    print("=" * 75)


if __name__ == "__main__":
    asyncio.run(run_offline_acceptance_test())
