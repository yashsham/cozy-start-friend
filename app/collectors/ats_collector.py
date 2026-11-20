"""Public ATS job board collector for hiring signals (Greenhouse, Lever)."""

from typing import List
from app.collectors.base import BaseCollector, EvidenceItem, normalize_domain
from app.collectors.fixtures_cache import get_cached_fixture
from app.llm.prompts import fence


class ATSCollector(BaseCollector):
    name = "ats_jobs"
    category = "buying_signals"

    async def collect(self, target: str, **kwargs) -> List[EvidenceItem]:
        """Collect hiring signals for the target company."""
        domain = normalize_domain(target)
        fixture = get_cached_fixture(domain)

        if not fixture or "ats_jobs" not in fixture:
            return []

        jobs = fixture["ats_jobs"]
        if not jobs:
            return []

        job_titles = [j["title"] for j in jobs]
        sales_jobs = [j for j in jobs if any(k in j["title"].lower() for k in ["sales", "sdr", "bdr", "account executive", "revops"])]

        headline = f"Hiring {len(jobs)} open positions, including {len(sales_jobs)} in Sales/RevOps"
        summary = f"Open roles: {', '.join(job_titles[:4])}"

        return [
            EvidenceItem(
                signal_code="hiring_expansion",
                source_name="public_ats_feed",
                source_url=f"https://boards.greenhouse.io/{domain.split('.')[0]}",
                value_text=fence(f"{headline}. {summary}", f"ats:{domain}"),
                value_num=float(len(jobs)),
                confidence=0.95,
                is_inferred=False,
                metadata={"job_count": len(jobs), "sales_jobs_count": len(sales_jobs)},
            )
        ]
