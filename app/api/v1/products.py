"""Multi-Product catalog REST endpoints."""

from typing import List
from fastapi import APIRouter, Depends, status

from app.api.deps import get_product_service
from app.core.exceptions import map_exception_to_http
from app.schemas.common import APIResponse
from app.schemas.product import ProductCreate, ProductResponse, ProductUpdate
from app.services.product_service import ProductService

router = APIRouter(prefix="/products", tags=["Products"])


@router.get("", response_model=APIResponse[List[ProductResponse]])
async def list_products(
    active_only: bool = False,
    service: ProductService = Depends(get_product_service),
):
    """Retrieve all configured products."""
    products = await service.list_products(active_only=active_only)
    return APIResponse(data=[ProductResponse.model_validate(p) for p in products])


@router.post("", response_model=APIResponse[ProductResponse], status_code=status.HTTP_201_CREATED)
async def create_product(
    data: ProductCreate,
    service: ProductService = Depends(get_product_service),
):
    """Add a new product to the catalog."""
    try:
        product = await service.create_product(data)
        return APIResponse(
            message="Product created successfully",
            data=ProductResponse.model_validate(product),
        )
    except Exception as e:
        raise map_exception_to_http(e)


@router.get("/{product_id}", response_model=APIResponse[ProductResponse])
async def get_product(
    product_id: str,
    service: ProductService = Depends(get_product_service),
):
    """Get product details by ID."""
    try:
        product = await service.get_product(product_id)
        return APIResponse(data=ProductResponse.model_validate(product))
    except Exception as e:
        raise map_exception_to_http(e)


@router.put("/{product_id}", response_model=APIResponse[ProductResponse])
async def update_product(
    product_id: str,
    data: ProductUpdate,
    service: ProductService = Depends(get_product_service),
):
    """Update an existing product."""
    try:
        product = await service.update_product(product_id, data)
        return APIResponse(
            message="Product updated successfully",
            data=ProductResponse.model_validate(product),
        )
    except Exception as e:
        raise map_exception_to_http(e)


@router.delete("/{product_id}", response_model=APIResponse[None])
async def delete_product(
    product_id: str,
    service: ProductService = Depends(get_product_service),
):
    """Delete a product from the catalog."""
    try:
        await service.delete_product(product_id)
        return APIResponse(message="Product deleted successfully", data=None)
    except Exception as e:
        raise map_exception_to_http(e)
