"""Prospects management REST endpoints."""

from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
import aiosqlite

from app.core.exceptions import map_exception_to_http
from app.db.session import get_db
from app.repositories.prospect_repository import ProspectRepository
from app.schemas.common import APIResponse, PaginatedResponse
from app.schemas.prospect import ProspectCreate, ProspectResponse, ProspectUpdate

router = APIRouter(prefix="/prospects", tags=["Prospects"])


@router.get("", response_model=APIResponse[PaginatedResponse[ProspectResponse]])
async def list_prospects(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    status: Optional[str] = None,
    search: Optional[str] = None,
    db: aiosqlite.Connection = Depends(get_db),
):
    """Retrieve paginated prospects with optional status filtering and full-text search."""
    repo = ProspectRepository(db)
    items, total = await repo.list_prospects(page=page, page_size=page_size, status=status, search=search)
    total_pages = (total + page_size - 1) // page_size if total > 0 else 0

    return APIResponse(
        data=PaginatedResponse(
            items=[ProspectResponse.model_validate(p) for p in items],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )
    )


@router.get("/{prospect_id}", response_model=APIResponse[ProspectResponse])
async def get_prospect(
    prospect_id: str,
    db: aiosqlite.Connection = Depends(get_db),
):
    """Get single prospect details."""
    repo = ProspectRepository(db)
    prospect = await repo.get_prospect_by_id(prospect_id)
    if not prospect:
        return APIResponse(success=False, message="Prospect not found", data=None)
    return APIResponse(data=ProspectResponse.model_validate(prospect))


@router.post("", response_model=APIResponse[ProspectResponse], status_code=status.HTTP_201_CREATED)
async def create_prospect(
    data: ProspectCreate,
    db: aiosqlite.Connection = Depends(get_db),
):
    """Create a new prospect entry."""
    repo = ProspectRepository(db)
    prospect = await repo.create_prospect(data)
    return APIResponse(
        message="Prospect created successfully",
        data=ProspectResponse.model_validate(prospect),
    )


@router.put("/{prospect_id}", response_model=APIResponse[ProspectResponse])
async def update_prospect(
    prospect_id: str,
    data: ProspectUpdate,
    db: aiosqlite.Connection = Depends(get_db),
):
    """Update an existing prospect."""
    repo = ProspectRepository(db)
    updated = await repo.update_prospect(prospect_id, data)
    if not updated:
        return APIResponse(success=False, message="Prospect not found", data=None)
    return APIResponse(
        message="Prospect updated successfully",
        data=ProspectResponse.model_validate(updated),
    )
