"""Discovery run execution endpoints."""

from typing import List
from fastapi import APIRouter, Depends
from pydantic import BaseModel
import aiosqlite

from app.collectors.overpass_collector import OverpassCollector
from app.db.session import get_db
from app.models.base import generate_id

router = APIRouter(tags=["Discovery"])


class DiscoveryRunRequest(BaseModel):
    productId: str
    icpId: str
    geography: str = ""
    industry: str = ""
    companySize: str = ""
    limit: int = 10


class DiscoveryRunResponse(BaseModel):
    prospectIds: List[str]


@router.post("/discovery/run", response_model=DiscoveryRunResponse)
async def run_discovery_pipeline(
    payload: DiscoveryRunRequest,
    db: aiosqlite.Connection = Depends(get_db),
):
    """Run lead discovery across Overpass and local fixtures; insert into database."""
    collector = OverpassCollector()
    matches = await collector.search_companies(
        industry=payload.industry,
        location=payload.geography,
    )

    created_ids: List[str] = []
    limit = min(payload.limit or 5, len(matches))

    for i in range(limit):
        m = matches[i]
        pid = f"prosp_{generate_id()}"
        cid = f"comp_{generate_id()}"

        # Insert Company
        sql_comp = """
        INSERT OR IGNORE INTO companies (id, name, domain, industry, company_size, location, description, source)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'discovery');
        """
        await db.execute(
            sql_comp,
            (
                cid,
                m["name"],
                m["domain"],
                m["industry"],
                m["company_size"],
                m["location"],
                m.get("description", ""),
            ),
        )

        # Insert Prospect
        sql_prosp = """
        INSERT INTO prospects (id, company_id, first_name, last_name, email, title, company, industry, status)
        VALUES (?, ?, 'Lead', 'Founder', ?, 'Founder & CEO', ?, ?, 'new');
        """
        await db.execute(
            sql_prosp,
            (
                pid,
                cid,
                f"contact@{m['domain']}",
                m["name"],
                m["industry"],
            ),
        )
        created_ids.append(pid)

    await db.commit()
    return DiscoveryRunResponse(prospectIds=created_ids)
