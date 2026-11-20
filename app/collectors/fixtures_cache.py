"""Pre-seeded offline fixture cache for 100% air-gapped execution."""

from typing import Any, Dict, List, Optional
from app.collectors.base import EvidenceItem, normalize_domain

OFFLINE_FIXTURES: Dict[str, Dict[str, Any]] = {
    "acmesaas.com": {
        "company_name": "Acme SaaS Technologies",
        "domain": "acmesaas.com",
        "description": "Enterprise cloud platform automating revenue workflows, lead routing, and outbound email deliverability.",
        "industry": "B2B SaaS",
        "company_size": "51-200",
        "location": "San Francisco, CA",
        "tech_stack": ["React", "FastAPI", "PostgreSQL", "HubSpot", "Stripe", "AWS"],
        "ats_jobs": [
            {"title": "Senior Outbound Sales Development Representative", "department": "Sales", "location": "Remote"},
            {"title": "Director of Revenue Operations", "department": "Operations", "location": "San Francisco, CA"},
            {"title": "Lead Software Engineer - Pipeline Infrastructure", "department": "Engineering", "location": "Remote"},
        ],
        "funding": "Series A ($14M led by Benchmark)",
        "evidence": [
            {
                "signal_code": "company_description",
                "source_name": "website_dom",
                "source_url": "https://acmesaas.com/about",
                "value_text": "Enterprise cloud platform automating revenue workflows, lead routing, and outbound email deliverability.",
                "confidence": 1.0,
                "is_inferred": False,
            },
            {
                "signal_code": "tech_stack",
                "source_name": "dom_scripts",
                "source_url": "https://acmesaas.com",
                "value_text": "Detected technologies: React, FastAPI, PostgreSQL, HubSpot, Stripe, AWS",
                "confidence": 0.95,
                "is_inferred": False,
            },
            {
                "signal_code": "hiring_expansion",
                "source_name": "greenhouse_ats",
                "source_url": "https://boards.greenhouse.io/acmesaas",
                "value_text": "Active hiring surge: Recruiting 3+ outbound sales representatives and RevOps leads.",
                "value_num": 3.0,
                "confidence": 1.0,
                "is_inferred": False,
            },
        ],
    },
    "cyberdyne.ai": {
        "company_name": "Cyberdyne Systems",
        "domain": "cyberdyne.ai",
        "description": "Pioneering neural network processors, autonomous edge systems, and sovereign machine learning accelerators.",
        "industry": "Artificial Intelligence",
        "company_size": "201-500",
        "location": "Sunnyvale, CA",
        "tech_stack": ["PyTorch", "CUDA", "C++", "Python", "Kubernetes", "Linux"],
        "ats_jobs": [
            {"title": "Principal AI Research Scientist", "department": "Research", "location": "Sunnyvale, CA"},
            {"title": "VP of Enterprise Solutions", "department": "Sales", "location": "Sunnyvale, CA"},
        ],
        "funding": "Series B ($50M led by DARPA & Founders Fund)",
        "evidence": [
            {
                "signal_code": "company_description",
                "source_name": "website_dom",
                "source_url": "https://cyberdyne.ai",
                "value_text": "Pioneering neural network processors, autonomous edge systems, and sovereign machine learning accelerators.",
                "confidence": 1.0,
                "is_inferred": False,
            },
            {
                "signal_code": "tech_stack",
                "source_name": "dom_scripts",
                "source_url": "https://cyberdyne.ai",
                "value_text": "Detected technologies: PyTorch, CUDA, C++, Python, Kubernetes, Linux",
                "confidence": 0.95,
                "is_inferred": False,
            },
            {
                "signal_code": "funding_signal",
                "source_name": "press_release",
                "source_url": "https://cyberdyne.ai/news/series-b",
                "value_text": "Announced $50M Series B expansion to scale commercial enterprise deployments.",
                "value_num": 50000000.0,
                "confidence": 1.0,
                "is_inferred": False,
            },
        ],
    },
    "novatech.io": {
        "company_name": "NovaTech Cloud",
        "domain": "novatech.io",
        "description": "Next-generation cloud infrastructure management and automated Kubernetes cost optimization platform.",
        "industry": "Cloud Infrastructure",
        "company_size": "11-50",
        "location": "Austin, TX",
        "tech_stack": ["Go", "Kubernetes", "Terraform", "AWS", "Datadog"],
        "ats_jobs": [
            {"title": "Senior DevOps Engineer", "department": "Engineering", "location": "Remote"},
        ],
        "funding": "Seed ($3.5M led by Y Combinator)",
        "evidence": [
            {
                "signal_code": "company_description",
                "source_name": "website_dom",
                "source_url": "https://novatech.io",
                "value_text": "Next-generation cloud infrastructure management and automated Kubernetes cost optimization.",
                "confidence": 1.0,
                "is_inferred": False,
            },
            {
                "signal_code": "tech_stack",
                "source_name": "dom_scripts",
                "source_url": "https://novatech.io",
                "value_text": "Detected technologies: Go, Kubernetes, Terraform, AWS, Datadog",
                "confidence": 0.95,
                "is_inferred": False,
            },
        ],
    },
    "apexlogistics.com": {
        "company_name": "Apex Logistics Global",
        "domain": "apexlogistics.com",
        "description": "Global freight transportation management, route tracking, and supply chain logistics platform.",
        "industry": "Logistics & Supply Chain",
        "company_size": "501-1000",
        "location": "Chicago, IL",
        "tech_stack": ["Java", "Spring Boot", "SAP", "Angular", "Oracle"],
        "ats_jobs": [
            {"title": "Logistics Route Coordinator", "department": "Operations", "location": "Chicago, IL"},
        ],
        "funding": "Private Equity Owned",
        "evidence": [
            {
                "signal_code": "company_description",
                "source_name": "website_dom",
                "source_url": "https://apexlogistics.com",
                "value_text": "Global freight transportation management, route tracking, and supply chain logistics.",
                "confidence": 1.0,
                "is_inferred": False,
            },
        ],
    },
}


def get_cached_fixture(domain_or_name: str) -> Optional[Dict[str, Any]]:
    """Retrieve pre-seeded company fixture by domain or normalized name."""
    norm = normalize_domain(domain_or_name)
    if norm in OFFLINE_FIXTURES:
        return OFFLINE_FIXTURES[norm]

    # Search by normalized name match
    clean_target = domain_or_name.lower().replace(" ", "").replace(".com", "")
    for dom, data in OFFLINE_FIXTURES.items():
        clean_name = data["company_name"].lower().replace(" ", "")
        if clean_target in clean_name or clean_name in clean_target:
            return data
    return None


def get_fixture_evidence(domain_or_name: str) -> List[EvidenceItem]:
    """Retrieve structured EvidenceItems from offline cache with <untrusted> fencing."""
    data = get_cached_fixture(domain_or_name)
    if not data or "evidence" not in data:
        return []
    from app.llm.prompts import fence

    items = []
    for item in data["evidence"]:
        val = item["value_text"]
        if not val.startswith("<untrusted"):
            val = fence(val, item.get("source_url", domain_or_name))
        items.append(
            EvidenceItem(
                signal_code=item["signal_code"],
                source_name=item["source_name"],
                source_url=item["source_url"],
                value_text=val,
                value_num=item.get("value_num"),
                confidence=item.get("confidence", 1.0),
                is_inferred=item.get("is_inferred", False),
            )
        )
    return items
