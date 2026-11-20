"""OpenStreetMap Overpass discovery collector."""

from typing import Any, Dict, List
from app.collectors.base import BaseCollector, EvidenceItem
from app.collectors.fixtures_cache import OFFLINE_FIXTURES


class OverpassCollector(BaseCollector):
    name = "osm_overpass"
    category = "discovery"

    async def search_companies(self, industry: str = "", location: str = "") -> List[Dict[str, Any]]:
        """Discover companies matching industry and geographic parameters."""
        results: List[Dict[str, Any]] = []

        # Offline/deterministic local discovery provider
        for domain, data in OFFLINE_FIXTURES.items():
            ind_match = not industry or industry.lower() in data["industry"].lower()
            loc_match = not location or location.lower() in data["location"].lower()

            if ind_match or loc_match:
                results.append({
                    "name": data["company_name"],
                    "domain": data["domain"],
                    "industry": data["industry"],
                    "location": data["location"],
                    "company_size": data["company_size"],
                    "source": "osm_overpass",
                    "description": data["description"],
                })

        return results

    async def collect(self, target: str, **kwargs) -> List[EvidenceItem]:
        # Overpass primarily acts as a discovery provider
        return []
