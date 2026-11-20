"""Unit tests for collectors, SSRF guard, offline fixtures, and research service."""

import pytest
import aiosqlite

from app.collectors.ats_collector import ATSCollector
from app.collectors.base import normalize_company_name, normalize_domain
from app.collectors.overpass_collector import OverpassCollector
from app.collectors.web_scraper import WebScraperCollector, check_ssrf
from app.services.research_service import ResearchService


def test_normalization_utilities():
    assert normalize_domain("https://www.AcmeSaaS.com/about?ref=123") == "acmesaas.com"
    assert normalize_domain("HTTP://CYBERDYNE.AI:8080/") == "cyberdyne.ai"
    assert normalize_company_name("Acme SaaS Technologies, Inc.") == "Acme SaaS"
    assert normalize_company_name("Cyberdyne Systems Corp.") == "Cyberdyne Systems"


def test_ssrf_guard_blocks_internal_and_cloud_metadata():
    forbidden_urls = [
        "http://127.0.0.1:8000/internal",
        "http://localhost:5432",
        "http://10.0.1.5/admin",
        "http://192.168.1.1/router",
        "http://169.254.169.254/latest/meta-data/",
    ]
    for url in forbidden_urls:
        with pytest.raises(ValueError) as exc:
            check_ssrf(url)
        assert "SSRF Protection" in str(exc.value)


@pytest.mark.asyncio
async def test_web_scraper_offline_fixture_fallback():
    scraper = WebScraperCollector()
    items = await scraper.collect("acmesaas.com")
    assert len(items) >= 2
    codes = [i.signal_code for i in items]
    assert "company_description" in codes
    assert "tech_stack" in codes
    assert all("<untrusted" in i.value_text for i in items)


@pytest.mark.asyncio
async def test_ats_collector_extracts_hiring():
    ats = ATSCollector()
    items = await ats.collect("acmesaas.com")
    assert len(items) == 1
    assert items[0].signal_code == "hiring_expansion"
    assert items[0].value_num == 3.0
    assert "Hiring" in items[0].value_text


@pytest.mark.asyncio
async def test_overpass_collector_discovery():
    overpass = OverpassCollector()
    results = await overpass.search_companies(industry="SaaS")
    assert len(results) >= 1
    assert any(r["domain"] == "acmesaas.com" for r in results)


@pytest.mark.asyncio
async def test_research_service_persists_observations(test_db: aiosqlite.Connection):
    service = ResearchService(test_db)
    items = await service.research_company(company_id="comp_test_123", domain="cyberdyne.ai")
    assert len(items) >= 2

    # Verify saved observations in SQLite
    saved = await service.get_company_observations("comp_test_123")
    assert len(saved) >= 2
    assert all(o["company_id"] == "comp_test_123" for o in saved)
