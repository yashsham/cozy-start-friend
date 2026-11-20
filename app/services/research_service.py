"""Research and Evidence aggregation service."""

import json
from typing import Any, Dict, List
import aiosqlite

from app.collectors.ats_collector import ATSCollector
from app.collectors.base import EvidenceItem, normalize_domain
from app.collectors.overpass_collector import OverpassCollector
from app.collectors.web_scraper import WebScraperCollector
from app.core.logging import logger
from app.models.base import generate_id


class ResearchService:
    """Orchestrates public web collectors, deduplicates findings, and persists observations."""

    def __init__(self, db: aiosqlite.Connection):
        self.db = db
        self.scraper = WebScraperCollector()
        self.ats = ATSCollector()
        self.overpass = OverpassCollector()

    async def research_company(self, company_id: str, domain: str) -> List[EvidenceItem]:
        """Collect and persist evidence from all permitted research sources."""
        norm_domain = normalize_domain(domain)
        all_items: List[EvidenceItem] = []

        # 1. Scrape Web DOM & Tech Stack
        try:
            dom_items = await self.scraper.collect(norm_domain)
            all_items.extend(dom_items)
        except Exception as e:
            logger.warning("Scraper failed for %s: %s", norm_domain, str(e))

        # 2. Collect ATS Hiring Signals
        try:
            ats_items = await self.ats.collect(norm_domain)
            all_items.extend(ats_items)
        except Exception as e:
            logger.warning("ATS collector failed for %s: %s", norm_domain, str(e))

        # 3. Deduplicate by signal_code
        deduped: Dict[str, EvidenceItem] = {}
        for item in all_items:
            key = f"{item.signal_code}:{item.source_url}"
            if key not in deduped or item.confidence > deduped[key].confidence:
                deduped[key] = item

        final_items = list(deduped.values())

        # 4. Persist to observations table
        for item in final_items:
            obs_id = generate_id()
            sql = """
            INSERT INTO observations (
                id, company_id, signal_code, collector, value_num,
                value_text, confidence, evidence_url, observed_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
            """
            try:
                # Ensure signal_code exists in signal_codes table first to satisfy trigger
                await self.db.execute(
                    "INSERT OR IGNORE INTO signal_codes (code, label, status) VALUES (?, ?, 'confirmed');",
                    (item.signal_code, item.signal_code.replace("_", " ").title()),
                )
                await self.db.execute(
                    sql,
                    (
                        obs_id,
                        company_id,
                        item.signal_code,
                        item.source_name,
                        item.value_num,
                        item.value_text,
                        item.confidence,
                        item.source_url,
                        item.retrieved_at.isoformat(),
                    ),
                )
            except Exception as err:
                logger.warning("Failed to persist observation %s: %s", item.signal_code, str(err))

        await self.db.commit()
        return final_items

    async def get_company_observations(self, company_id: str) -> List[Dict[str, Any]]:
        """Fetch all stored evidence observations for a company."""
        sql = """
        SELECT id, company_id, signal_code, collector, value_num,
               value_text, confidence, evidence_url, observed_at
        FROM observations
        WHERE company_id = ?
        ORDER BY observed_at DESC;
        """
        async with self.db.execute(sql, (company_id,)) as cursor:
            rows = await cursor.fetchall()
            return [dict(row) for row in rows]
