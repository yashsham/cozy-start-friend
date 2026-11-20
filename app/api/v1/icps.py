"""Ideal Customer Profile (ICP) REST endpoints."""

from typing import List
from fastapi import APIRouter, Depends, status

from app.api.deps import get_product_service
from app.core.exceptions import map_exception_to_http
from app.schemas.common import APIResponse
from app.schemas.product import ProductICPCreate, ProductICPResponse
from app.services.product_service import ProductService

router = APIRouter(prefix="/icps", tags=["ICPs"])


@router.get("/product/{product_id}", response_model=APIResponse[List[ProductICPResponse]])
async def list_icps_for_product(
    product_id: str,
    service: ProductService = Depends(get_product_service),
):
    """List all ICP criteria defined for a specific product."""
    try:
        icps = await service.list_icps_for_product(product_id)
        return APIResponse(data=[ProductICPResponse.model_validate(i) for i in icps])
    except Exception as e:
        raise map_exception_to_http(e)


@router.post("", response_model=APIResponse[ProductICPResponse], status_code=status.HTTP_201_CREATED)
async def create_icp(
    data: ProductICPCreate,
    service: ProductService = Depends(get_product_service),
):
    """Define a new ICP rule set for a product."""
    try:
        icp = await service.create_icp(data)
        return APIResponse(
            message="ICP created successfully",
            data=ProductICPResponse.model_validate(icp),
        )
    except Exception as e:
        raise map_exception_to_http(e)


@router.delete("/{icp_id}", response_model=APIResponse[None])
async def delete_icp(
    icp_id: str,
    service: ProductService = Depends(get_product_service),
):
    """Delete an ICP definition."""
    try:
        await service.delete_icp(icp_id)
        return APIResponse(message="ICP deleted successfully", data=None)
    except Exception as e:
        raise map_exception_to_http(e)
