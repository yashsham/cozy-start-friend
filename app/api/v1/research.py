"""Research and public evidence discovery REST endpoints."""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
import aiosqlite

from app.collectors.base import EvidenceItem
from app.collectors.overpass_collector import OverpassCollector
from app.db.session import get_db
from app.schemas.common import APIResponse
from app.services.research_service import ResearchService

router = APIRouter(prefix="/research", tags=["Research & Evidence"])


class ResearchTriggerRequest(BaseModel):
    domain: str


@router.post("/company/{company_id}", response_model=APIResponse[List[EvidenceItem]])
async def trigger_company_research(
    company_id: str,
    request: ResearchTriggerRequest,
    db: aiosqlite.Connection = Depends(get_db),
):
    """Trigger multi-source research for a target company."""
    service = ResearchService(db)
    items = await service.research_company(company_id=company_id, domain=request.domain)
    return APIResponse(
        message=f"Research completed with {len(items)} evidence items",
        data=items,
    )


@router.get("/company/{company_id}", response_model=APIResponse[List[Dict[str, Any]]])
async def get_company_evidence(
    company_id: str,
    db: aiosqlite.Connection = Depends(get_db),
):
    """Retrieve verified and inferred observations with source citations."""
    service = ResearchService(db)
    observations = await service.get_company_observations(company_id=company_id)
    return APIResponse(
        message="Observations retrieved successfully",
        data=observations,
    )


@router.get("/discovery", response_model=APIResponse[List[Dict[str, Any]]])
async def discover_companies(
    industry: Optional[str] = Query(default="", description="Industry vertical (e.g. SaaS, FinTech, AI)"),
    location: Optional[str] = Query(default="", description="City or region (e.g. San Francisco, Austin)"),
):
    """Discover companies using OpenStreetMap Overpass and local directory cache."""
    collector = OverpassCollector()
    results = await collector.search_companies(industry=industry or "", location=location or "")
    return APIResponse(
        message=f"Discovered {len(results)} potential target companies",
        data=results,
    )
