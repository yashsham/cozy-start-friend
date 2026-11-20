"""Business Profile REST endpoints."""

from fastapi import APIRouter, Depends

from app.api.deps import get_business_service
from app.schemas.business import BusinessProfileCreate, BusinessProfileResponse
from app.schemas.common import APIResponse
from app.services.business_service import BusinessService

router = APIRouter(prefix="/profile", tags=["Business Profile"])


@router.get("", response_model=APIResponse[BusinessProfileResponse])
async def get_business_profile(
    service: BusinessService = Depends(get_business_service),
):
    """Fetch current company profile, positioning, and competitors."""
    profile = await service.get_profile()
    if not profile:
        return APIResponse(
            message="No profile configured yet",
            data=None,
        )
    return APIResponse(data=BusinessProfileResponse.model_validate(profile))


@router.post("", response_model=APIResponse[BusinessProfileResponse])
async def update_business_profile(
    data: BusinessProfileCreate,
    service: BusinessService = Depends(get_business_service),
):
    """Save or update company profile and positioning."""
    saved = await service.save_profile(data)
    return APIResponse(
        message="Business profile saved successfully",
        data=BusinessProfileResponse.model_validate(saved),
    )
